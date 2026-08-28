const express = require('express');
const router = express.Router();
const { serveMedia, getMediaInfo, getMediaMetadata, getMediaList, getMediaTypes, toggleFavorite, getFavoriteCount, editMedia } = require('../controllers/mediaController');
const { apiLimiter, editLimiter } = require('../middleware/rateLimiter');

// Read-heavy endpoints — covered by the global apiLimiter mounted in index.js;
// the limiter is also applied inline so CodeQL's route-level analysis sees it.
router.get('/serve',           apiLimiter, serveMedia);
router.get('/metadata',        apiLimiter, getMediaMetadata);
router.get('/info',            apiLimiter, getMediaInfo);
router.get('/list',            apiLimiter, getMediaList);
router.get('/types',           apiLimiter, getMediaTypes);
router.post('/favorite',       apiLimiter, toggleFavorite);
router.get('/favorites/count', apiLimiter, getFavoriteCount);

// Image editing is CPU/memory intensive — use the tighter editLimiter.
router.post('/edit', editLimiter, express.json(), editMedia);

module.exports = router;
