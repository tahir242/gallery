const express = require('express');
const router = express.Router();
const { serveMedia, getMediaInfo, getMediaList, getMediaTypes, toggleFavorite, getFavoriteCount } = require('../controllers/mediaController');

router.get('/serve', serveMedia);
router.get('/info', getMediaInfo);
router.get('/list', getMediaList);
router.get('/types', getMediaTypes);
router.post('/favorite', toggleFavorite);
router.get('/favorites/count', getFavoriteCount);

module.exports = router;
