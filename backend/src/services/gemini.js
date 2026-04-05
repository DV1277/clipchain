const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

const BASE_URL = 'https://generativelanguage.googleapis.com';
// Models tried in order — each has an independent quota bucket
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const MAX_INLINE_BYTES = 20 * 1024 * 1024; // 20MB limit for inline data

function getKey() {
  return process.env.GEMINI_API_KEY;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo', '.mkv': 'video/x-matroska', '.webm': 'video/webm' }[ext] || 'video/mp4';
}

const ANALYSIS_PROMPT =
  'Analyze this video clip carefully. Identify any rare, unusual, or noteworthy event occurring ' +
  '(weather phenomena, wildlife behavior, astronomical events, extreme sports, natural disasters, ' +
  'or other rare occurrences). Return ONLY a valid JSON object with exactly these fields: ' +
  '{"event_type": string, "description": string, "rarity_score": number (0-10 where 10=once in a lifetime), ' +
  '"tags": [string], "confidence": number (0-1)}. ' +
  'Be specific and honest — if the video shows something common, give a low rarity score.';

// ─── Strategy 1: Gemini File API (for any size video) ───────────────────────

async function uploadFileToGemini(filePath) {
  const mimeType = getMimeType(filePath);
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = 'boundary' + Date.now();

  const metaJson = JSON.stringify({ file: { display_name: fileName, mime_type: mimeType } });
  const header = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;
  const body = Buffer.concat([Buffer.from(header), fileBuffer, Buffer.from(footer)]);

  const resp = await axios.post(
    `${BASE_URL}/upload/v1beta/files?uploadType=multipart&key=${getKey()}`,
    body,
    {
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': body.length,
        'X-Goog-Upload-Protocol': 'multipart',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000,
    }
  );
  return resp.data.file;
}

async function waitForFileActive(fileId) {
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const resp = await axios.get(`${BASE_URL}/v1beta/files/${fileId}?key=${getKey()}`);
    const { state } = resp.data;
    console.log(`[Gemini] File state (attempt ${i + 1}): ${state}`);
    if (state === 'ACTIVE') return resp.data;
    if (state === 'FAILED') {
      throw new Error(`Gemini file processing FAILED — video may use an unsupported codec (e.g. H.265/HEVC). fileId=${fileId}`);
    }
  }
  throw new Error('Gemini file processing timed out after 120s');
}

// Call generateContent trying each model in sequence, with retry on 429
async function generateContent(parts, timeoutMs = 60000) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await axios.post(
          `${BASE_URL}/v1beta/models/${model}:generateContent?key=${getKey()}`,
          {
            contents: [{ parts }],
            generationConfig: { response_mime_type: 'application/json' },
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: timeoutMs }
        );
        const text = resp.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[Gemini] Success with model ${model} (attempt ${attempt + 1})`);
          return text;
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
          const retryDelay = attempt === 0 ? 2000 : attempt === 1 ? 8000 : 20000;
          console.log(`[Gemini] ${model} rate limited (429), retrying in ${retryDelay}ms...`);
          await new Promise((r) => setTimeout(r, retryDelay));
          continue;
        }
        // Non-rate-limit error — move to next model
        console.log(`[Gemini] ${model} error ${status}: ${err.response?.data?.error?.message || err.message}`);
        break;
      }
    }
  }
  throw new Error('All Gemini models exhausted or rate limited');
}

async function generateFromFileUri(fileUri, mimeType) {
  return generateContent([
    { file_data: { mime_type: mimeType, file_uri: fileUri } },
    { text: ANALYSIS_PROMPT },
  ]);
}

async function classifyViaFileAPI(filePath) {
  console.log('[Gemini] Strategy 1: File API upload');
  const uploaded = await uploadFileToGemini(filePath);
  const fileId = uploaded.name.split('/').pop();
  const activeFile = await waitForFileActive(fileId);
  const content = await generateFromFileUri(activeFile.uri, getMimeType(filePath));
  console.log('[Gemini] File API raw response:', content?.slice(0, 300));
  return parseAnalysisJson(content);
}

// ─── Strategy 2: Inline base64 data (small files only) ──────────────────────

async function classifyViaInlineData(filePath) {
  console.log('[Gemini] Strategy 2: Inline base64 data');
  const mimeType = getMimeType(filePath);
  const data = fs.readFileSync(filePath).toString('base64');
  const content = await generateContent([
    { inline_data: { mime_type: mimeType, data } },
    { text: ANALYSIS_PROMPT },
  ]);
  console.log('[Gemini] Inline data raw response:', content?.slice(0, 300));
  return parseAnalysisJson(content);
}

// ─── Strategy 3: Extract a frame with ffmpeg, analyze as image ──────────────

function ffmpegAvailable() {
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function classifyViaFrameExtraction(filePath) {
  if (!ffmpegAvailable()) throw new Error('ffmpeg not available');
  console.log('[Gemini] Strategy 3: Frame extraction via ffmpeg');

  const frameDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(frameDir)) fs.mkdirSync(frameDir, { recursive: true });
  const framePath = path.join(frameDir, `frame_${Date.now()}.jpg`);

  try {
    execSync(`ffmpeg -i "${filePath}" -ss 00:00:02 -vframes 1 "${framePath}" -y`, { stdio: 'pipe' });

    const imageData = fs.readFileSync(framePath).toString('base64');
    const content = await generateContent([
      { inline_data: { mime_type: 'image/jpeg', data: imageData } },
      { text: 'This is a frame extracted from a video clip. Based on what you see, ' + ANALYSIS_PROMPT },
    ]);
    console.log('[Gemini] Frame analysis raw response:', content?.slice(0, 300));
    return parseAnalysisJson(content);
  } finally {
    try { fs.unlinkSync(framePath); } catch { /* ignore */ }
  }
}

// ─── Strategy 4: Text-only analysis from filename ───────────────────────────

async function classifyViaFilenameText(filePath) {
  console.log('[Gemini] Strategy 4: Text-only filename analysis');
  const filename = path.basename(filePath, path.extname(filePath))
    .replace(/[_-]/g, ' ')
    .replace(/\d{8,}/g, '')
    .trim();

  const content = await generateContent(
    [
      {
        text:
          `A video clip has been uploaded with the filename: "${filename}". ` +
          'Based only on this filename, make your best guess about what kind of event ' +
          'this video might contain and estimate its rarity. ' +
          ANALYSIS_PROMPT,
      },
    ],
    30000
  );
  console.log('[Gemini] Filename text raw response:', content?.slice(0, 300));
  return parseAnalysisJson(content);
}

// ─── JSON parsing ────────────────────────────────────────────────────────────

function parseAnalysisJson(content) {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return normalise(parsed);
  } catch {
    const match = content.match(/\{[\s\S]*?\}/);
    if (match) {
      try {
        return normalise(JSON.parse(match[0]));
      } catch { /* fall through */ }
    }
  }
  return null;
}

function normalise(parsed) {
  const score = typeof parsed.rarity_score === 'number' ? parsed.rarity_score : 5;
  return {
    event_type: parsed.event_type || 'Unknown Event',
    description: parsed.description || 'No description available',
    rarity_score: Math.min(10, Math.max(0, score)),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
  };
}

// ─── Main entry point ────────────────────────────────────────────────────────

async function classifyVideo(filePath) {
  const fileSize = fs.statSync(filePath).size;

  // Strategy 1: File API (works for any size, best for video)
  try {
    const result = await classifyViaFileAPI(filePath);
    if (result) return result;
  } catch (err) {
    console.error('[Gemini] File API failed:', err.message);
  }

  // Strategy 2: Inline data (small files only — avoids codec issues by streaming directly)
  if (fileSize < MAX_INLINE_BYTES) {
    try {
      const result = await classifyViaInlineData(filePath);
      if (result) return result;
    } catch (err) {
      console.error('[Gemini] Inline data failed:', err.message);
    }
  }

  // Strategy 3: Extract a single video frame and analyze as image
  try {
    const result = await classifyViaFrameExtraction(filePath);
    if (result) return result;
  } catch (err) {
    console.error('[Gemini] Frame extraction failed:', err.message);
  }

  // Strategy 4: Text-only from filename (last resort — still calls Gemini, no default 5.0)
  try {
    const result = await classifyViaFilenameText(filePath);
    if (result) return result;
  } catch (err) {
    console.error('[Gemini] Filename text failed:', err.message);
  }

  // Absolute last resort — mark as error so UI shows it clearly
  console.error('[Gemini] All strategies exhausted');
  return {
    event_type: 'Classification Failed',
    description: 'Gemini could not analyze this video. Please check codec compatibility (H.264 recommended).',
    rarity_score: 0,
    tags: ['error'],
    confidence: 0,
  };
}

module.exports = { classifyVideo };
