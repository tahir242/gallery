const express = require('express');
const router = express.Router();
const { scan, getScanStatus, listDirectories, searchDirectories, getHistory, deleteHistory, updateExtensions } = require('../controllers/directoryController');
const { apiLimiter, scanLimiter } = require('../middleware/rateLimiter');

// Mutating endpoints — trigger recursive disk walks and/or heavy DB writes.
router.post('/scan',                  scanLimiter, scan);
router.put('/scan/:id/extensions',    scanLimiter, updateExtensions);
router.delete('/history',             scanLimiter, deleteHistory);

// Read-only endpoints — use the general backstop limiter.
router.get('/scan/:id/status',        apiLimiter, getScanStatus);
router.get('/list',                   apiLimiter, listDirectories);
router.get('/search',                 apiLimiter, searchDirectories);
router.get('/history',                apiLimiter, getHistory);

module.exports = router;
