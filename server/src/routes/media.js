const express = require('express');
const router = express.Router();
const { serveMedia, getMediaInfo } = require('../controllers/mediaController');

// GET /api/media/serve?path=<encoded_path>
router.get('/serve', serveMedia);

// GET /api/media/info?path=<encoded_path>
router.get('/info', getMediaInfo);

module.exports = router;
