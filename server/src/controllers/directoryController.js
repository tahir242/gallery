const { getDb } = require('../db');
const { runScan, cancelScan } = require('../utils/scannerJob');
const { normalizePath, checkAccessAsync } = require('../utils/scanner');

/**
 * POST /api/directory/scan
 * Body: { path: string, extensions?: string[] }
 *
 * Always starts a fresh scan. If a scan for this path is already running
 * (pending or scanning), it is cancelled first so there is never more than
 * one concurrent worker per root path.
 */
const scan = async (req, res) => {
  const { path: rawPath, extensions } = req.body;
  if (!rawPath) return res.status(400).json({ error: 'Path is required' });

  const rootPath = normalizePath(rawPath);
  const access = await checkAccessAsync(rootPath);
  if (!access.accessible) {
    return res.status(404).json({ error: access.error, path: rootPath });
  }

  try {
    const db = await getDb();
    
    // Cancel any in-progress scans for this path so we never have two
    // concurrent workers racing over the same database rows.
    const inProgress = await db.all(
      `SELECT id FROM scans WHERE path = ? AND status IN ('pending', 'scanning')`,
      [rootPath]
    );
    for (const s of inProgress) {
      await cancelScan(s.id);
    }

    // Always insert a fresh scan record so the client gets a clean state.
    const result = await db.run(
      `INSERT INTO scans (path, status, selected_extensions) VALUES (?, 'pending', ?)`,
      [rootPath, extensions ? JSON.stringify(extensions) : null]
    );
    const scanId = result.lastID;

    // Start the background worker (fire-and-forget)
    runScan(scanId, rootPath, extensions || null).catch(console.error);

    res.status(202).json({ scanId, status: 'pending', path: rootPath });
  } catch (err) {
    console.error('Scan init error:', err);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * GET /api/directory/scan/:id/status
 */
const getScanStatus = async (req, res) => {
  const scanId = req.params.id;
  try {
    const db = await getDb();
    const scan = await db.get(`SELECT * FROM scans WHERE id = ?`, [scanId]);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/directory/list
 * Query: ?parentPath=... (optional)
 */
const listDirectories = async (req, res) => {
  const { parentPath } = req.query;
  try {
    const db = await getDb();
    let query = `SELECT d.path, d.name FROM directories d WHERE d.parent_path `;
    let params = [];
    if (parentPath) {
      query += `= ? ORDER BY d.name ASC`;
      params.push(parentPath);
    } else {
      query += `IS NULL ORDER BY d.name ASC`;
    }

    const dirs = await db.all(query, params);
    
    // Format for FolderTree node structure
    const formatted = await Promise.all(dirs.map(async (d) => {
      const sep = d.path.includes('\\') ? '\\' : '/';
      const descendantPrefix = d.path + sep;
      const upperBound = descendantPrefix + String.fromCharCode(65535);
      
      const fileCount = await db.get(
        `SELECT COUNT(*) as c FROM media WHERE directory_path = ? OR (directory_path >= ? AND directory_path < ?)`, 
        [d.path, descendantPrefix, upperBound]
      ).then(r => r.c);
      
      const subdirCount = await db.get(
        `SELECT COUNT(*) as c FROM directories WHERE parent_path = ? OR (parent_path >= ? AND parent_path < ?)`, 
        [d.path, descendantPrefix, upperBound]
      ).then(r => r.c);

      return {
        path: d.path,
        name: d.name,
        hasChildren: subdirCount > 0,
        fileCount,
        subdirCount
      };
    }));

    res.json({ directories: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/directory/search
 * Query: ?q=...&root=...
 */
const searchDirectories = async (req, res) => {
  const { q, root } = req.query;
  if (!q || !root) return res.json({ directories: [] });
  
  try {
    const db = await getDb();
    const rootLike = root + '%';
    const queryLike = '%' + q + '%';
    
    const dirs = await db.all(
      `SELECT path, name FROM directories WHERE path LIKE ? AND name LIKE ? ORDER BY name ASC LIMIT 50`,
      [rootLike, queryLike]
    );
    
    const formatted = await Promise.all(dirs.map(async (d) => {
      const sep = d.path.includes('\\') ? '\\' : '/';
      const descendantPrefix = d.path + sep;
      const upperBound = descendantPrefix + String.fromCharCode(65535);
      
      const fileCount = await db.get(
        `SELECT COUNT(*) as c FROM media WHERE directory_path = ? OR (directory_path >= ? AND directory_path < ?)`, 
        [d.path, descendantPrefix, upperBound]
      ).then(r => r.c);
      
      const subdirCount = await db.get(
        `SELECT COUNT(*) as c FROM directories WHERE parent_path = ? OR (parent_path >= ? AND parent_path < ?)`, 
        [d.path, descendantPrefix, upperBound]
      ).then(r => r.c);

      return {
        path: d.path,
        name: d.name,
        hasChildren: subdirCount > 0,
        fileCount,
        subdirCount
      };
    }));

    res.json({ directories: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/directory/history
 * Fetch the latest scan for each unique root path (completed scans only)
 */
const getHistory = async (req, res) => {
  try {
    const db = await getDb();
    const history = await db.all(`
      SELECT s.id, s.path, s.files_indexed as fileCount, s.directories_discovered as folderCount, s.status, s.completed_at as scannedAt, s.selected_extensions as selectedExtensions
      FROM scans s
      INNER JOIN (
          SELECT path, MAX(started_at) as max_started
          FROM scans
          WHERE status = 'completed'
          GROUP BY path
      ) latest ON s.path = latest.path AND s.started_at = latest.max_started
      ORDER BY s.started_at DESC
      LIMIT 10
    `);
    
    const parsedHistory = history.map(h => ({
      ...h,
      selectedExtensions: h.selectedExtensions ? JSON.parse(h.selectedExtensions) : null
    }));
    
    res.json(parsedHistory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/directory/history
 * Body: { path: string }
 * Cancels any running scan, then deletes all media, directories, and scans for
 * the given root path.
 */
const deleteHistory = async (req, res) => {
  const { path: rootPath } = req.body;
  if (!rootPath) return res.status(400).json({ error: 'Path is required' });

  try {
    const db = await getDb();

    // Cancel any in-progress scan before deleting
    const inProgress = await db.all(
      `SELECT id FROM scans WHERE path = ? AND status IN ('pending', 'scanning')`,
      [rootPath]
    );
    for (const s of inProgress) {
      await cancelScan(s.id);
    }

    await db.run('BEGIN TRANSACTION');
    try {
      const sep = rootPath.includes('\\') ? '\\' : '/';
      const rootLike = rootPath + sep + '%';
      await db.run(`DELETE FROM media WHERE path = ? OR path LIKE ?`, [rootPath, rootLike]);
      await db.run(`DELETE FROM directories WHERE path = ? OR path LIKE ?`, [rootPath, rootLike]);
      await db.run(`DELETE FROM scans WHERE path = ?`, [rootPath]);
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await db.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/directory/scan/:id/extensions
 * Body: { extensions: string[] }
 * Updates the extension filter for a scan and re-triggers a fresh scan.
 * The old scan worker is cancelled before the new one starts.
 */
const updateExtensions = async (req, res) => {
  const { id: scanId } = req.params;
  const { extensions } = req.body;
  if (!extensions || !Array.isArray(extensions)) {
    return res.status(400).json({ error: 'extensions array is required' });
  }

  try {
    const db = await getDb();
    const scan = await db.get(`SELECT path FROM scans WHERE id = ?`, [scanId]);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    // Cancel the existing scan worker before touching the data or starting a new one
    await cancelScan(Number(scanId));

    await db.run('BEGIN TRANSACTION');
    try {
      const sep = scan.path.includes('\\') ? '\\' : '/';
      const rootLike = scan.path + sep + '%';

      // Remove files that are no longer in the selected extension set
      if (extensions.length > 0) {
        const extPlaceholders = extensions.map(() => '?').join(',');
        await db.run(
          `DELETE FROM media WHERE (path = ? OR path LIKE ?) AND ext NOT IN (${extPlaceholders})`,
          [scan.path, rootLike, ...extensions]
        );
      } else {
        await db.run(`DELETE FROM media WHERE path = ? OR path LIKE ?`, [scan.path, rootLike]);
      }

      // Update the scan record with new extensions and reset to pending
      await db.run(
        `UPDATE scans SET selected_extensions = ?, status = 'pending', completed_at = NULL WHERE id = ?`,
        [JSON.stringify(extensions), scanId]
      );
      
      await db.run('COMMIT');
    } catch (err) {
      await db.run('ROLLBACK');
      throw err;
    }

    // Start a fresh scan worker for the new extension set
    runScan(Number(scanId), scan.path, extensions).catch(console.error);
    
    res.json({ success: true, scanId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { scan, getScanStatus, listDirectories, searchDirectories, getHistory, deleteHistory, updateExtensions };
