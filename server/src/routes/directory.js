const express = require('express');
const router = express.Router();
const { scan, getScanStatus, listDirectories, searchDirectories, getHistory, deleteHistory, updateExtensions } = require('../controllers/directoryController');

router.post('/scan', scan);
router.put('/scan/:id/extensions', updateExtensions);
router.get('/scan/:id/status', getScanStatus);
router.get('/list', listDirectories);
router.get('/search', searchDirectories);
router.get('/history', getHistory);
router.delete('/history', deleteHistory);

module.exports = router;
