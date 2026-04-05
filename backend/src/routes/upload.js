const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { clips } = require('../store');
const { uploadToVultr } = require('../services/vultr');
const { startIndexing, waitForCompletion, generateAnalysis } = require('../services/twelvelabs');
const { classifyVideo } = require('../services/gemini');
const { calculateRarityScore, calculateBounty } = require('../services/rarity');

async function processClip(clipId, filePath) {
  const clip = clips.get(clipId);
  if (!clip) return;

  console.log(`[Process] Starting pipeline for clip ${clipId}`);

  // Step 1: Upload to Vultr
  try {
    clip.status = 'uploading';
    const mimeType = filePath.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
    const vultrUrl = await uploadToVultr(filePath, clip.filename, mimeType);
    clip.vultrUrl = vultrUrl;
    clip.vultrStatus = 'done';
    clip.status = 'stored';
    console.log(`[Process] Vultr upload done for ${clipId}`);
  } catch (err) {
    console.error(`[Process] Vultr upload failed for ${clipId}:`, err.message);
    clip.vultrStatus = 'error';
    // Continue — don't fail the whole pipeline
  }

  // Step 2: Start TwelveLabs indexing AND Gemini in parallel
  let twelvelabsTaskId = null;
  let geminiPromise = null;

  try {
    clip.twelvelabsStatus = 'indexing';
    clip.status = 'indexing';
    twelvelabsTaskId = await startIndexing(filePath);
    clip.twelvelabsTaskId = twelvelabsTaskId;
    console.log(`[Process] TwelveLabs task started for ${clipId}:`, twelvelabsTaskId);
  } catch (err) {
    console.error(`[Process] TwelveLabs start failed for ${clipId}:`, err.message);
    clip.twelvelabsStatus = 'error';
  }

  // Start Gemini immediately (runs concurrently with TwelveLabs)
  clip.geminiStatus = 'processing';
  clip.status = 'classifying';
  geminiPromise = classifyVideo(filePath).catch((err) => {
    console.error(`[Process] Gemini classifyVideo error for ${clipId}:`, err.message);
    return null;
  });
  console.log(`[Process] Gemini classification started for ${clipId}`);

  // Step 3: Wait for TwelveLabs
  let twelvelabsAnalysis = null;
  if (twelvelabsTaskId) {
    try {
      const videoId = await waitForCompletion(twelvelabsTaskId);
      clip.twelvelabsVideoId = videoId;
      clip.twelvelabsStatus = 'done';
      console.log(`[Process] TwelveLabs complete for ${clipId}, videoId:`, videoId);

      // Get analysis
      twelvelabsAnalysis = await generateAnalysis(videoId);
      clip.twelvelabsAnalysis = twelvelabsAnalysis;
    } catch (err) {
      console.error(`[Process] TwelveLabs completion failed for ${clipId}:`, err.message);
      clip.twelvelabsStatus = 'error';
    }
  }

  // Step 4: Wait for Gemini
  let geminiAnalysis = null;
  if (geminiPromise) {
    try {
      geminiAnalysis = await geminiPromise;
      clip.geminiAnalysis = geminiAnalysis;
      clip.geminiStatus = geminiAnalysis ? 'done' : 'error';
      console.log(`[Process] Gemini complete for ${clipId}:`, geminiAnalysis?.event_type);
    } catch (err) {
      console.error(`[Process] Gemini await failed for ${clipId}:`, err.message);
      clip.geminiStatus = 'error';
    }
  }

  // Step 5: Calculate rarity score + bounty
  const rarityScore = calculateRarityScore(geminiAnalysis, twelvelabsAnalysis);
  const bountySOL = calculateBounty(rarityScore);

  clip.rarityScore = rarityScore;
  clip.bountySOL = bountySOL;
  clip.status = 'complete';

  console.log(
    `[Process] Pipeline complete for ${clipId}: rarity=${rarityScore}, bounty=${bountySOL} SOL`
  );
}

router.post('/upload', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const clipId = uuidv4();
    const clip = {
      id: clipId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date(),
      filePath: req.file.path,
      vultrUrl: null,
      vultrStatus: 'pending',
      twelvelabsTaskId: null,
      twelvelabsVideoId: null,
      twelvelabsStatus: 'pending',
      geminiStatus: 'pending',
      twelvelabsAnalysis: null,
      geminiAnalysis: null,
      rarityScore: null,
      bountySOL: null,
      status: 'uploading',
      errorMessage: null,
    };

    clips.set(clipId, clip);

    // Return immediately, process async
    res.json({ clipId, status: 'uploading' });

    // Process asynchronously
    processClip(clipId, req.file.path).catch((err) => {
      console.error(`[Upload] Pipeline error for ${clipId}:`, err.message);
      const c = clips.get(clipId);
      if (c) {
        c.status = 'error';
        c.errorMessage = err.message;
      }
    });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
