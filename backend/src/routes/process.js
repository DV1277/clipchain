const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { clips } = require('../store');
const twelvelabsService = require('../services/twelvelabs');
const geminiService = require('../services/gemini');
const rarityService = require('../services/rarity');
const router = express.Router();

router.post('/process', async (req, res) => {
  const { vultrUrl, filename, walletAddress } = req.body;
  if (!vultrUrl) return res.status(400).json({ error: 'vultrUrl required' });

  const clipId = uuidv4();
  const clip = {
    id: clipId,
    originalName: filename || 'upload.mp4',
    filename: filename || 'upload.mp4',
    size: 0,
    uploadedAt: new Date().toISOString(),
    filePath: null,
    vultrUrl,
    vultrStatus: 'done',  // already uploaded by frontend
    walletAddress: walletAddress || null,
    twelvelabsTaskId: null,
    twelvelabsVideoId: null,
    twelvelabsStatus: 'pending',
    geminiStatus: 'pending',
    twelvelabsAnalysis: null,
    geminiAnalysis: null,
    rarityScore: null,
    bountySOL: null,
    status: 'stored',
    errorMessage: null,
  };
  clips.set(clipId, clip);
  res.json({ clipId, status: 'stored' });

  // Process asynchronously
  processFromVultr(clipId, vultrUrl, filename).catch((err) => {
    const c = clips.get(clipId);
    if (c) { c.status = 'error'; c.errorMessage = err.message; }
  });
});

async function processFromVultr(clipId, vultrUrl, filename) {
  const clip = clips.get(clipId);
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Download from Vultr to local temp file for Gemini
  const localPath = path.join(uploadsDir, `${clipId}-${filename || 'video.mp4'}`);
  try {
    console.log('[Process] Downloading from Vultr:', vultrUrl);
    const response = await axios.get(vultrUrl, { responseType: 'arraybuffer', timeout: 120000 });
    fs.writeFileSync(localPath, response.data);
    clip.filePath = localPath;
    clip.size = fs.statSync(localPath).size;
  } catch (err) {
    console.error('[Process] Download failed:', err.message);
    clip.filePath = null; // Gemini will use filename fallback
  }

  // Run TwelveLabs (URL-based) + Gemini in parallel
  clip.status = 'indexing';
  clip.twelvelabsStatus = 'indexing';
  clip.geminiStatus = 'processing';

  const [twelvelabsResult, geminiResult] = await Promise.allSettled([
    (async () => {
      const taskId = await twelvelabsService.startIndexingFromUrl(vultrUrl, filename);
      clip.twelvelabsTaskId = taskId;
      const videoId = await twelvelabsService.waitForCompletion(taskId);
      clip.twelvelabsVideoId = videoId;
      clip.twelvelabsStatus = 'done';
      return twelvelabsService.generateAnalysis(videoId);
    })(),
    (async () => {
      const filePath = clip.filePath || path.join(uploadsDir, `fallback-${Date.now()}.mp4`);
      // If no local file, write a tiny placeholder so Gemini uses filename fallback
      if (!clip.filePath) {
        fs.writeFileSync(filePath, Buffer.alloc(5));
        // Rename so filename reflects original name
        const namedPath = path.join(uploadsDir, `${clipId}-${filename || 'video.mp4'}`);
        fs.renameSync(filePath, namedPath);
        clip.filePath = namedPath;
      }
      const result = await geminiService.classifyVideo(clip.filePath);
      clip.geminiStatus = 'done';
      return result;
    })(),
  ]);

  const tlAnalysis = twelvelabsResult.status === 'fulfilled' ? twelvelabsResult.value : null;
  const gemAnalysis = geminiResult.status === 'fulfilled' ? geminiResult.value : null;

  if (twelvelabsResult.status === 'rejected') {
    clip.twelvelabsStatus = 'error';
    console.error('[Process] TwelveLabs error:', twelvelabsResult.reason?.message);
  }
  if (geminiResult.status === 'rejected') {
    clip.geminiStatus = 'error';
    console.error('[Process] Gemini error:', geminiResult.reason?.message);
  }

  clip.twelvelabsAnalysis = tlAnalysis;
  clip.geminiAnalysis = gemAnalysis;
  clip.rarityScore = rarityService.calculateRarityScore(gemAnalysis, tlAnalysis);
  clip.bountySOL = rarityService.calculateBounty(clip.rarityScore);
  clip.status = 'complete';

  // Clean up local file
  try { if (clip.filePath) fs.unlinkSync(clip.filePath); } catch { /* ignore */ }
}

module.exports = router;
