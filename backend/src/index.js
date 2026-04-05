require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { initVultrStorage } = require('./services/vultr');
const { initIndex } = require('./services/twelvelabs');

const uploadRouter = require('./routes/upload');
const clipsRouter = require('./routes/clips');
const solanaRouter = require('./routes/solana');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder for local fallback
app.use('/uploads', express.static(uploadsDir));

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp4|mov|avi|webm|mkv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Attach multer to request for the upload route
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Apply multer middleware to upload route
app.post('/api/upload', upload.single('video'), (req, res, next) => next());

// Routes
app.use('/api', uploadRouter);
app.use('/api', clipsRouter);
app.use('/api', solanaRouter);
app.use('/api', require('./routes/presign'));
app.use('/api', require('./routes/process'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Express Error]', err.message);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Clipchain backend running on port ${PORT}`);
  console.log(`[Server] CORS enabled for ${FRONTEND_URL}`);

  // Initialize services non-blocking
  initVultrStorage()
    .then(() => console.log('[Server] Vultr storage ready'))
    .catch((err) => console.error('[Server] Vultr init error:', err.message));

  initIndex()
    .then((id) => console.log('[Server] TwelveLabs index ready:', id))
    .catch((err) => console.error('[Server] TwelveLabs init error:', err.message));
});

module.exports = app;
