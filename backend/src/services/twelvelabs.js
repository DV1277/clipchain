const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.twelvelabs.io/v1.3';
const INDEX_CACHE_FILE = path.join(__dirname, '../../.twelvelabs-index.json');

let indexId = null;

function getHeaders() {
  return {
    'x-api-key': process.env.TWELVELABS_API_KEY,
  };
}

async function loadCachedIndex() {
  try {
    if (fs.existsSync(INDEX_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(INDEX_CACHE_FILE, 'utf8'));
      return data.index_id;
    }
  } catch (err) {
    console.log('[TwelveLabs] Could not load cached index:', err.message);
  }
  return null;
}

async function saveCachedIndex(id) {
  try {
    fs.writeFileSync(INDEX_CACHE_FILE, JSON.stringify({ index_id: id }, null, 2));
  } catch (err) {
    console.log('[TwelveLabs] Could not save index cache:', err.message);
  }
}

async function initIndex() {
  try {
    // Check cache first
    const cached = await loadCachedIndex();
    if (cached) {
      console.log('[TwelveLabs] Using cached index ID:', cached);
      indexId = cached;
      return indexId;
    }

    // Check existing indexes
    console.log('[TwelveLabs] Checking for existing indexes...');
    const resp = await axios.get(`${BASE_URL}/indexes`, {
      headers: getHeaders(),
      params: { page: 1, page_limit: 50 },
    });

    const indexes = resp.data.data || [];
    // Look for "clipchain" index first, fall back to any existing index
    const existing = indexes.find((idx) => idx.index_name === 'clipchain') || indexes[0];

    if (existing) {
      indexId = existing._id || existing.id;
      console.log('[TwelveLabs] Using index:', existing.index_name, indexId);
      await saveCachedIndex(indexId);
      return indexId;
    }

    // Create new index using v1.3 format
    console.log('[TwelveLabs] Creating new index "clipchain"...');
    const createResp = await axios.post(
      `${BASE_URL}/indexes`,
      {
        index_name: 'clipchain',
        models: [
          {
            model_name: 'marengo3.0',
            model_options: ['visual', 'audio'],
          },
        ],
      },
      { headers: { ...getHeaders(), 'Content-Type': 'application/json' } }
    );

    indexId = createResp.data._id || createResp.data.id;
    console.log('[TwelveLabs] Created index:', indexId);
    await saveCachedIndex(indexId);
    return indexId;
  } catch (err) {
    console.error('[TwelveLabs] Failed to initialize index:', err.response?.data || err.message);
    return null;
  }
}

async function startIndexing(filePath) {
  if (!indexId) {
    await initIndex();
  }
  if (!indexId) {
    throw new Error('TwelveLabs index not initialized');
  }

  console.log('[TwelveLabs] Starting indexing for:', filePath);

  const form = new FormData();
  form.append('index_id', indexId);
  form.append('video_file', fs.createReadStream(filePath));

  const resp = await axios.post(`${BASE_URL}/tasks`, form, {
    headers: {
      ...getHeaders(),
      ...form.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  const taskId = resp.data._id || resp.data.id;
  console.log('[TwelveLabs] Task created:', taskId);
  return taskId;
}

async function waitForCompletion(taskId) {
  console.log('[TwelveLabs] Waiting for task completion:', taskId);

  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));

    try {
      const resp = await axios.get(`${BASE_URL}/tasks/${taskId}`, {
        headers: getHeaders(),
      });

      const task = resp.data;
      const status = task.status;
      console.log(`[TwelveLabs] Task ${taskId} status: ${status}`);

      if (status === 'ready') {
        const videoId = task.video_id || task._id;
        console.log('[TwelveLabs] Task complete, video ID:', videoId);
        return videoId;
      }

      if (status === 'failed') {
        throw new Error(`TwelveLabs task failed: ${task.error || 'unknown error'}`);
      }
    } catch (err) {
      if (err.message.includes('failed')) throw err;
      console.error('[TwelveLabs] Poll error:', err.message);
    }
  }

  throw new Error('TwelveLabs task timed out after 10 minutes');
}

async function generateAnalysis(videoId) {
  console.log('[TwelveLabs] Generating analysis for video:', videoId);

  let gistResult = null;
  let textResult = null;

  try {
    const gistResp = await axios.post(
      `${BASE_URL}/generate/gist`,
      { video_id: videoId, types: ['topic', 'hashtag', 'title'] },
      { headers: { ...getHeaders(), 'Content-Type': 'application/json' } }
    );
    gistResult = gistResp.data;
    console.log('[TwelveLabs] Gist result:', JSON.stringify(gistResult).slice(0, 200));
  } catch (err) {
    console.error('[TwelveLabs] Gist generation failed:', err.response?.data || err.message);
  }

  try {
    const textResp = await axios.post(
      `${BASE_URL}/generate/text`,
      {
        video_id: videoId,
        prompt:
          'What rare natural, wildlife, weather, or human event is in this video? Rate its rarity 0-10. Respond in JSON: {"event_type": "...", "description": "...", "rarity_estimate": 0-10, "confidence": 0-1}',
      },
      { headers: { ...getHeaders(), 'Content-Type': 'application/json' } }
    );
    textResult = textResp.data;
    console.log('[TwelveLabs] Text result:', JSON.stringify(textResult).slice(0, 200));
  } catch (err) {
    console.error('[TwelveLabs] Text generation failed:', err.response?.data || err.message);
  }

  // Parse confidence from text result
  let confidence = 0.5;
  let topics = [];
  let title = 'Unknown Event';

  if (gistResult) {
    topics = gistResult.topics || gistResult.hashtags || [];
    title = gistResult.title || title;
  }

  if (textResult) {
    try {
      const raw = textResult.data || textResult.text || JSON.stringify(textResult);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        confidence = parsed.confidence ?? 0.5;
      }
    } catch (e) {
      // ignore parse error
    }
  }

  return {
    topics,
    title,
    confidence,
    raw_gist: gistResult,
    raw_text: textResult,
  };
}

async function startIndexingFromUrl(videoUrl, filename) {
  if (!indexId) await initIndex();
  if (!indexId) throw new Error('TwelveLabs index not initialized');

  console.log('[TwelveLabs] Starting URL-based indexing:', videoUrl);
  const form = new FormData();
  form.append('index_id', indexId);
  form.append('video_url', videoUrl);
  if (filename) form.append('video_title', filename);

  const resp = await axios.post(`${BASE_URL}/tasks`, form, {
    headers: { ...getHeaders(), ...form.getHeaders() },
  });
  const taskId = resp.data._id || resp.data.id;
  console.log('[TwelveLabs] URL task created:', taskId);
  return taskId;
}

module.exports = { initIndex, startIndexing, waitForCompletion, generateAnalysis, startIndexingFromUrl };
