const ScanSession = require('../models/ScanSession');
const { normalizePath, checkAccess, scanDirectory, buildFolderTree } = require('../utils/scanner');
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
    // Create a session with 'scanning' status
    const session = new ScanSession({
      path: normalizedPath,
      label: label || path.basename(normalizedPath),
      status: 'scanning',
    });
    await session.save();

    // Perform the scan (synchronous — could be moved to worker thread for very large dirs)
    const scanResult = scanDirectory(normalizedPath, normalizedPath);
    const folderTree = buildFolderTree(scanResult.folders, normalizedPath);

    // Update session with results
    session.files = scanResult.files;
    session.fileCount = scanResult.files.length;
    session.folderCount = scanResult.folders.length;
    session.status = 'complete';
    await session.save();

    return res.status(200).json({
      sessionId: session._id,
      path: normalizedPath,
      label: session.label,
      fileCount: session.fileCount,
      folderCount: session.folderCount,
      files: scanResult.files,
      folderTree,
      errors: scanResult.errors,
      scannedAt: session.updatedAt,
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
  try {
    const sessions = await ScanSession.find({ status: 'complete' })
      .select('path label fileCount folderCount createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(500).json({ error: `Failed to fetch history: ${err.message}` });
  }
};

/**
 * DELETE /api/directory/history/:id
 * Delete a scan session from history
 */
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await ScanSession.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Session deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { scanDirectory_handler, getHistory, deleteSession };
