const express = require('express');
const router = express.Router();
const { clips } = require('../store');

// GET /api/clips — return all clips
router.get('/clips', (req, res) => {
  const all = Array.from(clips.values());
  res.json(all);
});

// GET /api/clips/:id — return single clip
router.get('/clips/:id', (req, res) => {
  const clip = clips.get(req.params.id);
  if (!clip) {
    return res.status(404).json({ error: 'Clip not found' });
  }
  res.json(clip);
});

module.exports = router;
