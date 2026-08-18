const express = require('express');
const router = express.Router();
const { serveMedia, getMediaInfo, getMediaMetadata, getMediaList, getMediaTypes, toggleFavorite, getFavoriteCount, editMedia } = require('../controllers/mediaController');

router.get('/serve', serveMedia);
router.get('/metadata', getMediaMetadata);
router.get('/info', getMediaInfo);
router.get('/list', getMediaList);
router.get('/types', getMediaTypes);
router.post('/favorite', toggleFavorite);
router.get('/favorites/count', getFavoriteCount);
router.post('/edit', express.json(), editMedia);

module.exports = router;
