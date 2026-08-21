const fsPromises = require('fs').promises;
const path = require('path');
const { getDb } = require('../db');
const { isMediaFile, getMimeType } = require('./mediaTypes');

const BATCH_SIZE = 2000;

/* ─── Cancellation token registry ───────────────────────────────────────────────
   cancelledScans holds scanIds that have been requested to stop.
   runScan checks this set at the top of every processDir call so cancellation
   takes effect within at most one directory's worth of work (~milliseconds on
   typical folders). The token is deleted when the scan finishes or is cancelled.
─────────────────────────────────────────────────────────────────────────────── */
const cancelledScans = new Set();

/**
 * Request cancellation of a running scan.
 * Marks the scan as 'cancelled' in the DB and adds its id to the token set.
 * Safe to call even if the scan has already finished.
 *
 * @param {number} scanId
 */
const cancelScan = async (scanId) => {
  if (!scanId) return;
  cancelledScans.add(scanId);
  try {
    const db = await getDb();
    await db.run(
      `UPDATE scans
       SET status = 'cancelled', completed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status IN ('pending', 'scanning')`,
      [scanId]
    );
  } catch (err) {
    console.error('cancelScan db error:', err.message);
  }
};

const runScan = async (scanId, rootPath, selectedExtensions = null) => {
  const db = await getDb();
  let dirsDiscovered = 0;
  let filesDiscovered = 0;
  let filesIndexed = 0;
  let filesFailed = 0;
  let lastProgressUpdate = Date.now();

  let queueMedia = [];
  let queueDirs = [];

  const isCancelled = () => cancelledScans.has(scanId);

  const updateProgress = async (force = false) => {
    const now = Date.now();
    if (force || now - lastProgressUpdate > 1000) {
      await db.run(
        `UPDATE scans 
         SET directories_discovered = ?, files_discovered = ?, files_indexed = ?, files_failed = ? 
         WHERE id = ?`,
        [dirsDiscovered, filesDiscovered, filesIndexed, filesFailed, scanId]
      );
      lastProgressUpdate = now;
    }
  };

  const flushBatch = async () => {
    if (queueDirs.length === 0 && queueMedia.length === 0) return;

    await db.run('BEGIN TRANSACTION');
    try {
      if (queueDirs.length > 0) {
        const stmt = await db.prepare(
          `INSERT INTO directories (path, parent_path, name, last_scan_id, last_scanned_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(path) DO UPDATE SET last_scan_id = excluded.last_scan_id, last_scanned_at = CURRENT_TIMESTAMP`
        );
        for (const dir of queueDirs) {
          await stmt.run(dir);
        }
        await stmt.finalize();
        queueDirs = [];
      }

      if (queueMedia.length > 0) {
        const stmt = await db.prepare(
          `INSERT INTO media (path, directory_path, name, ext, mime_type, size, modified_at, last_scan_id, last_scanned_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(path) DO UPDATE SET 
              size = excluded.size, 
              modified_at = excluded.modified_at,
              last_scan_id = excluded.last_scan_id,
              last_scanned_at = CURRENT_TIMESTAMP`
        );
        for (const file of queueMedia) {
          await stmt.run(file);
        }
        await stmt.finalize();
        queueMedia = [];
      }
      
      await db.run('COMMIT');
    } catch (err) {
      await db.run('ROLLBACK');
      console.error('Batch flush failed:', err);
      filesFailed += queueMedia.length;
      queueMedia = [];
      queueDirs = [];
    }
    
    await updateProgress();
    // Yield to event loop after every large batch write
    await new Promise(r => setImmediate(r));
  };

  const processDir = async (dirPath, parentPath) => {
    // ── Cancellation check — bail out immediately if cancelled ──────────────
    if (isCancelled()) return;

    try {
      const dirName = path.basename(dirPath) || dirPath;
      
      queueDirs.push([dirPath, parentPath, dirName, scanId]);
      dirsDiscovered++;
      
      if (queueDirs.length >= BATCH_SIZE) {
        await flushBatch();
      }

      if (isCancelled()) return;

      const dir = await fsPromises.opendir(dirPath);
      const subdirs = [];
      const mediaFiles = [];

      for await (const entry of dir) {
        if (isCancelled()) {
          // Close the directory handle gracefully
          await dir.close().catch(() => {});
          return;
        }
        if (entry.isDirectory()) {
          subdirs.push(path.join(dirPath, entry.name));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).slice(1).toLowerCase();
          if (isMediaFile(ext)) {
            if (!selectedExtensions || selectedExtensions.includes(ext)) {
              mediaFiles.push({ name: entry.name, fullPath: path.join(dirPath, entry.name), ext });
              filesDiscovered++;
            }
          }
        }
      }

      if (isCancelled()) return;
      
      // Parallel stat for all media files in this directory
      if (mediaFiles.length > 0) {
        const stats = await Promise.allSettled(
          mediaFiles.map(f => fsPromises.stat(f.fullPath))
        );

        mediaFiles.forEach((file, idx) => {
          const result = stats[idx];
          if (result.status === 'fulfilled') {
            const stat = result.value;
            const mimeType = getMimeType(file.ext);
            queueMedia.push([
              file.fullPath,
              dirPath,
              file.name,
              file.ext,
              mimeType,
              stat.size,
              stat.mtime.toISOString(),
              scanId
            ]);
            filesIndexed++;
          } else {
            filesFailed++;
          }
        });

        if (queueMedia.length >= BATCH_SIZE) {
          await flushBatch();
        }
      }

      // Process subdirectories — stop early if cancelled
      for (const subdir of subdirs) {
        if (isCancelled()) return;
        await processDir(subdir, dirPath);
      }
      
      // Yield periodically to keep the event loop responsive
      if (dirsDiscovered % 100 === 0) {
        await new Promise(r => setImmediate(r));
      }

    } catch (err) {
      console.error(`Error scanning directory ${dirPath}:`, err.message);
    }
  };

  try {
    await db.run(`UPDATE scans SET status = 'scanning' WHERE id = ?`, [scanId]);
    await processDir(rootPath, null);

    // ── Cancelled — stop cleanly, do not mark as completed ─────────────────
    if (isCancelled()) {
      cancelledScans.delete(scanId);
      return;
    }
    
    // Final flush
    await flushBatch();

    // Purge files/dirs that belong to this root but were not seen in this scan
    // (i.e. they were deleted from disk since the last scan)
    const sep = rootPath.includes('\\') ? '\\' : '/';
    const rootLike = rootPath + sep + '%';
    await db.run(
      `DELETE FROM media WHERE (path = ? OR path LIKE ?) AND (last_scan_id != ? OR last_scan_id IS NULL)`,
      [rootPath, rootLike, scanId]
    );
    await db.run(
      `DELETE FROM directories WHERE (path = ? OR path LIKE ?) AND (last_scan_id != ? OR last_scan_id IS NULL)`,
      [rootPath, rootLike, scanId]
    );

    await updateProgress(true);
    await db.run(
      `UPDATE scans SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [scanId]
    );
  } catch (err) {
    console.error('Scan failed:', err);
    if (!isCancelled()) {
      await updateProgress(true);
      await db.run(
        `UPDATE scans SET status = 'error', completed_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?`,
        [err.message, scanId]
      );
    }
  } finally {
    // Always clean up cancellation token
    cancelledScans.delete(scanId);
  }
};

module.exports = { runScan, cancelScan };
