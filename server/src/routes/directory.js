const express = require('express');
const router = express.Router();
const {
  scan,
  getFiles,
  getHistory,
  deleteHistory,
} = require('../controllers/directoryController');

// POST /api/directory/scan
router.post('/scan', scan);

// GET /api/directory/files (Paginated files endpoint)
router.get('/files', getFiles);

// GET /api/directory/history
router.get('/history', getHistory);

// DELETE /api/directory/history/:id
router.delete('/history/:id', deleteHistory);

module.exports = router;
