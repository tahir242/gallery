const ScanSession = require('../models/ScanSession');
const { normalizePath, checkAccess, scanDirectory, buildFolderTree } = require('../utils/scanner');
const { getIsConnected } = require('../config/db');
const path = require('path');

/**
 * POST /api/directory/scan
 * Scan a directory path and persist results to MongoDB
 */
const scanDirectory_handler = async (req, res) => {
  const { path: inputPath, label } = req.body;

  if (!inputPath || typeof inputPath !== 'string') {
    return res.status(400).json({ error: 'A directory path is required' });
  }

  const normalizedPath = normalizePath(inputPath);

  // Check accessibility
  const access = checkAccess(normalizedPath);
  if (!access.accessible) {
    return res.status(422).json({
      error: access.error,
      path: normalizedPath,
    });
  }

  try {
    // Perform the scan (synchronous — could be moved to worker thread for very large dirs)
    const scanResult = scanDirectory(normalizedPath, normalizedPath);
    const folderTree = buildFolderTree(scanResult.folders, normalizedPath);

    const sessionLabel = label || path.basename(normalizedPath);
    let sessionId = null;

    // Persist to MongoDB if connected
    if (getIsConnected()) {
      try {
        const session = new ScanSession({
          path: normalizedPath,
          label: sessionLabel,
          files: scanResult.files,
          fileCount: scanResult.files.length,
          folderCount: scanResult.folders.length,
          status: 'complete',
        });
        await session.save();
        sessionId = session._id;
      } catch (dbErr) {
        console.warn('Could not persist session to DB:', dbErr.message);
      }
    }

    return res.status(200).json({
      sessionId,
      path: normalizedPath,
      label: sessionLabel,
      fileCount: scanResult.files.length,
      folderCount: scanResult.folders.length,
      files: scanResult.files,
      folderTree,
      errors: scanResult.errors,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Scan error:', err);

    return res.status(500).json({ error: `Scan failed: ${err.message}` });
  }
};

/**
 * GET /api/directory/history
 * Return recent scan sessions (last 20)
 */
const getHistory = async (req, res) => {
  if (!getIsConnected()) {
    return res.status(200).json({ sessions: [] });
  }
  try {
    const sessions = await ScanSession.find({ status: 'complete' })
      .select('path label fileCount folderCount createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(200).json({ sessions: [] });
  }
};

/**
 * DELETE /api/directory/history/:id
 * Delete a scan session from history
 */
const deleteSession = async (req, res) => {
  if (!getIsConnected()) {
    return res.status(200).json({ message: 'No database connection' });
  }
  try {
    const { id } = req.params;
    await ScanSession.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Session deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { scanDirectory_handler, getHistory, deleteSession };
