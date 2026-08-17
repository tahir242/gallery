const fsPromises = require('fs').promises;
const path = require('path');
const { getDb } = require('../db');
const { isMediaFile, getMimeType } = require('./mediaTypes');

const BATCH_SIZE = 2000;

const runScan = async (scanId, rootPath, selectedExtensions = null) => {
  const db = await getDb();
  let dirsDiscovered = 0;
  let filesDiscovered = 0;
  let filesIndexed = 0;
  let filesFailed = 0;
  let lastProgressUpdate = Date.now();

  let queueMedia = [];
  let queueDirs = [];

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
      // Batch failure means we missed some counts, but we don't crash
      filesFailed += queueMedia.length;
      queueMedia = [];
      queueDirs = [];
    }
    
    await updateProgress();
    // Yield to event loop after every large batch write
    await new Promise(r => setImmediate(r));
  };

  const processDir = async (dirPath, parentPath) => {
    try {
      const dirName = path.basename(dirPath) || dirPath;
      
      queueDirs.push([dirPath, parentPath, dirName, scanId]);
      dirsDiscovered++;
      
      if (queueDirs.length >= BATCH_SIZE) {
        await flushBatch();
      }

      const dir = await fsPromises.opendir(dirPath);
      const subdirs = [];
      const mediaFiles = [];

      for await (const entry of dir) {
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

      // Process subdirectories
      for (const subdir of subdirs) {
        await processDir(subdir, dirPath);
      }
      
      // Yield periodically if this is an empty dir taking long to traverse
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
    
    // Final flush
    await flushBatch();

    // Purge deleted files
    const rootLike = rootPath + '%';
    await db.run(
      `DELETE FROM media WHERE path LIKE ? AND (last_scan_id != ? OR last_scan_id IS NULL)`,
      [rootLike, scanId]
    );
    await db.run(
      `DELETE FROM directories WHERE path LIKE ? AND (last_scan_id != ? OR last_scan_id IS NULL)`,
      [rootLike, scanId]
    );

    await updateProgress(true);
    await db.run(
      `UPDATE scans SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [scanId]
    );
  } catch (err) {
    console.error('Scan failed:', err);
    await updateProgress(true);
    await db.run(
      `UPDATE scans SET status = 'error', completed_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?`,
      [err.message, scanId]
    );
  }
};

module.exports = { runScan };
