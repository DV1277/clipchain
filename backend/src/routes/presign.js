const express = require('express');
const { getPresignedUploadUrl } = require('../services/vultr');
const router = express.Router();

router.get('/presign', async (req, res) => {
  const { filename, contentType } = req.query;
  if (!filename) return res.status(400).json({ error: 'filename required' });
  try {
    const { url, key, publicUrl } = await getPresignedUploadUrl(
      filename,
      contentType || 'video/mp4'
    );
    res.json({ url, key, publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
