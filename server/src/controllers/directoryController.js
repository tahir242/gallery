const ScanSession = require('../models/ScanSession');
const { normalizePath, checkAccessAsync, scanDirectoryAsync, buildFolderTree } = require('../utils/scanner');
const cache = require('../utils/scanCache');

/**
 * Scan a directory (or use cache if available)
 */
const scan = async (req, res) => {
  try {
    const { path: dirPath } = req.body;

    if (!dirPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const normalizedPath = normalizePath(dirPath);

    // 1. Check Cache
    if (cache.has(normalizedPath)) {
      const cachedData = cache.get(normalizedPath);
      return res.json({
        path: normalizedPath,
        cached: true,
        totalFiles: cachedData.files.length,
        folderTree: cachedData.folderTree,
      });
    }

    // 2. Access Check
    const access = await checkAccessAsync(normalizedPath);
    if (!access.accessible) {
      return res.status(404).json({
        error: access.error,
        path: normalizedPath,
      });
    }

    // 3. Scan Directory (Async)
    const scanStartTime = Date.now();
    const result = await scanDirectoryAsync(normalizedPath, normalizedPath);
    const scanDuration = Date.now() - scanStartTime;

    // 4. Build Tree
    const folderTree = buildFolderTree(result.folders, normalizedPath);

    // 5. Store in Memory Cache
    cache.set(normalizedPath, {
      files: result.files,
      folders: result.folders,
      folderTree,
    });

    // 6. Persist to MongoDB (graceful failure)
    try {
      await ScanSession.findOneAndUpdate(
        { path: normalizedPath },
        {
          path: normalizedPath,
          fileCount: result.files.length,
          folderCount: result.folders.length,
          scannedAt: new Date(),
          durationMs: scanDuration,
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.warn(`[WARN] MongoDB not available. Scan session not saved for ${normalizedPath}`);
    }

    res.json({
      path: normalizedPath,
      cached: false,
      totalFiles: result.files.length,
      folderTree,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan directory', details: error.message });
  }
};

/**
 * Get paginated and filtered files from cache
 */
const getFiles = async (req, res) => {
  try {
    const { path: dirPath, page = 1, limit = 50, search = '', folder = '' } = req.query;

    if (!dirPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const normalizedPath = normalizePath(dirPath);
    const cachedData = cache.get(normalizedPath);

    if (!cachedData) {
      return res.status(404).json({ error: 'Scan expired or not found. Please rescan.', needsRescan: true });
    }

    let { files } = cachedData;

    // Filter by folder if specified
    if (folder) {
      files = files.filter(f => f.path.startsWith(folder));
    }

    // Filter by search (name AND relative path)
    if (search) {
      const q = search.toLowerCase();
      files = files.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.relativePath.toLowerCase().includes(q)
      );
    }

    // Sort by modifiedAt (newest first) or by name
    files = files.sort((a, b) => {
      if (a.modifiedAt && b.modifiedAt) {
        return b.modifiedAt - a.modifiedAt;
      }
      return a.name.localeCompare(b.name);
    });

    // Paginate
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedFiles = files.slice(startIndex, endIndex);

    res.json({
      path: normalizedPath,
      totalMatches: files.length,
      page: Number(page),
      totalPages: Math.ceil(files.length / Number(limit)),
      hasMore: endIndex < files.length,
      files: paginatedFiles,
    });
  } catch (error) {
    console.error('GetFiles error:', error);
    res.status(500).json({ error: 'Failed to fetch files', details: error.message });
  }
};

/**
 * Get scan history
 */
const getHistory = async (req, res) => {
  try {
    const sessions = await ScanSession.find().sort({ scannedAt: -1 }).limit(10);
    res.json(sessions);
  } catch (error) {
    console.warn('[WARN] MongoDB not available. Returning empty history array.');
    res.json([]);
  }
};

/**
 * Delete a scan session from history
 */
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    await ScanSession.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Session deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  scan,
  getFiles,
  getHistory,
  deleteHistory,
};
