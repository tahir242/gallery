const express = require('express');
const router = express.Router();
const {
  scanDirectory_handler,
  getHistory,
  deleteSession,
} = require('../controllers/directoryController');

// POST /api/directory/scan
router.post('/scan', scanDirectory_handler);

// GET /api/directory/history
router.get('/history', getHistory);

// DELETE /api/directory/history/:id
router.delete('/history/:id', deleteSession);

module.exports = router;
