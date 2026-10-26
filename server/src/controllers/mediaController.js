const fs = require('fs');
const path = require('path');
const { getMimeType } = require('../utils/mediaTypes');
const { normalizePath, containsPath } = require('../utils/scanner');
const { getDb } = require('../db');
const { exiftool } = require('exiftool-vendored');
const sharp = require('sharp');

/**
 * Verify that `resolvedPath` falls within at least one indexed scan root.
 * This is the primary CWE-22 (path traversal) guard for file-serving endpoints.
 * Only files that were explicitly scanned by the user can be read or served.
 *
 * @param {object} db - open database handle
 * @param {string} resolvedPath - absolute, normalized path to validate
 * @returns {Promise<boolean>} true if the path is inside a known scan root
 */
const isUnderIndexedRoot = async (db, resolvedPath) => {
  const roots = await db.all(
    `SELECT DISTINCT path FROM scans WHERE status = 'completed'`
  );
  return roots.some(r => containsPath(r.path, resolvedPath));
};

/**
 * GET /api/media/serve?path=<encoded_file_path>
 * Stream a media file to the client with proper MIME type and range support
 */
const serveMedia = async (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const decodedPath = decodeURIComponent(filePath);
  const normalizedPath = normalizePath(decodedPath);

  // Security (CWE-22): reject paths that are not under any indexed scan root.
  const db = await getDb();
  if (!(await isUnderIndexedRoot(db, normalizedPath))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Security: ensure the file exists and is a file (not a directory)
  let stat;
  try {
    stat = fs.statSync(normalizedPath);
    if (!stat.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }
  } catch (err) {
    return res.status(404).json({ error: 'File not found' });
  }

  const ext = path.extname(normalizedPath).slice(1).toLowerCase();
  const mimeType = getMimeType(ext);
  const fileSize = stat.size;

  // Handle range requests for video streaming
  const rangeHeader = req.headers.range;

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    const stream = fs.createReadStream(normalizedPath, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });

    fs.createReadStream(normalizedPath).pipe(res);
  }
};

/**
 * GET /api/media/info?path=<encoded_file_path>
 * Return metadata about a media file
 */
const getMediaInfo = async (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const decodedPath = decodeURIComponent(filePath);
  const normalizedPath = normalizePath(decodedPath);

  // Security (CWE-22): reject paths outside indexed scan roots.
  const db = await getDb();
  if (!(await isUnderIndexedRoot(db, normalizedPath))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const stat = fs.statSync(normalizedPath);
    const ext = path.extname(normalizedPath).slice(1).toLowerCase();

    return res.status(200).json({
      name: path.basename(normalizedPath),
      path: normalizedPath,
      ext,
      size: stat.size,
      modifiedAt: stat.mtime,
      mimeType: getMimeType(ext),
    });
  } catch (err) {
    return res.status(404).json({ error: 'File not found' });
  }
};

/**
 * GET /api/media/metadata?path=<encoded_file_path>
 * Return exhaustive metadata about a media file (EXIF, GPS, XMP, etc.)
 */
const getMediaMetadata = async (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const decodedPath = decodeURIComponent(filePath);
  const normalizedPath = normalizePath(decodedPath);

  // Security (CWE-22): reject paths outside indexed scan roots.
  const db = await getDb();
  if (!(await isUnderIndexedRoot(db, normalizedPath))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const tags = await exiftool.read(normalizedPath);
    return res.status(200).json(tags);
  } catch (err) {
    console.error('getMediaMetadata error:', err);
    return res.status(500).json({ error: 'Failed to read metadata', details: err.message });
  }
};

/**
 * GET /api/media/list
 * Query: directoryPath, ext, search, sortField, sortOrder, page, limit
 */
const getMediaList = async (req, res) => {
  try {
    const db = await getDb();
    const {
      directoryPath,
      ext,
      mediaType,
      search,
      favoritesOnly,
      sortField = 'modified_at',
      sortOrder = 'desc',
      page = 1,
      limit = 60
    } = req.query;

    // Security: build the WHERE clause using only parameterized placeholders so
    // no user-supplied value is ever interpolated directly into the SQL string.
    // The ORDER BY column and direction cannot be parameterized in SQLite, so
    // they are validated against explicit allowlists before interpolation.
    let baseQuery = `SELECT * FROM media WHERE 1=1`;
    const params = [];

    // Filter by directory path (exact match) OR if omitted, all media
    if (directoryPath) {
      // "All Files" mode — no directory filter
      if (directoryPath !== 'all') {
        // Recursive: load all media whose path starts with the selected folder
        baseQuery += ` AND directory_path LIKE ?`;
        params.push(directoryPath + '%');
      }
    }

    if (ext) {
      baseQuery += ` AND ext = ?`;
      params.push(ext);
    }

    // mediaType filter: 'image' | 'video' | 'audio' | 'document'
    if (mediaType) {
      if (mediaType === 'document') {
        // Documents are anything that is not image/video/audio
        baseQuery += ` AND mime_type NOT LIKE 'image/%' AND mime_type NOT LIKE 'video/%' AND mime_type NOT LIKE 'audio/%'`;
      } else {
        baseQuery += ` AND mime_type LIKE ?`;
        params.push(mediaType + '/%');
      }
    }

    if (search) {
      baseQuery += ` AND name LIKE ?`;
      params.push('%' + search + '%');
    }

    if (favoritesOnly === 'true') {
      baseQuery += ` AND is_favorite = 1`;
    }

    // Allowlist-validate ORDER BY identifiers — SQLite does not support
    // parameterized column names, so we guard against injection explicitly.
    const validFields = ['name', 'size', 'modified_at'];
    const validOrders = ['asc', 'desc'];

    let dbSortField = 'modified_at';
    if (sortField === 'date') dbSortField = 'modified_at';
    else if (validFields.includes(sortField)) dbSortField = sortField;

    const dbSortOrder = validOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toUpperCase()
      : 'DESC';

    // Run the COUNT query against the base WHERE clause (no ORDER BY needed for counting).
    const countQuery = baseQuery.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalResult = await db.get(countQuery, params);

    // Guard against NaN-derived offsets from malformed page/limit values.
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 60));
    const offset = (pageNum - 1) * limitNum;

    // Append ORDER BY and pagination only to the data query.
    const dataQuery = `${baseQuery} ORDER BY ${dbSortField} ${dbSortOrder} LIMIT ? OFFSET ?`;
    const dataParams = [...params, limitNum, offset];

    const files = await db.all(dataQuery, dataParams);

    res.json({
      files,
      totalMatches: totalResult.count,
      hasMore: offset + files.length < totalResult.count
    });
  } catch (err) {
    console.error('getMediaList error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/media/types
 * Query: directoryPath
 */
const getMediaTypes = async (req, res) => {
  try {
    const db = await getDb();
    const { directoryPath } = req.query;
    let query = `SELECT ext as extension, COUNT(*) as count FROM media `;
    const params = [];

    if (directoryPath && directoryPath !== 'all') {
      query += ` WHERE directory_path LIKE ?`;
      params.push(directoryPath + '%');
    }
    
    query += ` GROUP BY ext ORDER BY count DESC`;
    const types = await db.all(query, params);
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/media/favorite
 * Body: { path: <encoded_file_path> }
 */
const toggleFavorite = async (req, res) => {
  try {
    const filePath = req.body.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    const normalizedPath = normalizePath(decodedPath);
    
    const db = await getDb();
    
    // Check current favorite status
    const media = await db.get('SELECT is_favorite FROM media WHERE path = ?', [normalizedPath]);
    
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    const newStatus = media.is_favorite ? 0 : 1;
    await db.run('UPDATE media SET is_favorite = ? WHERE path = ?', [newStatus, normalizedPath]);
    
    res.json({ path: normalizedPath, is_favorite: newStatus === 1 });
  } catch (err) {
    console.error('toggleFavorite error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/media/favorites/count
 */
const getFavoriteCount = async (req, res) => {
  try {
    const db = await getDb();
    const { directoryPath } = req.query;
    let query = 'SELECT COUNT(*) as count FROM media WHERE is_favorite = 1';
    const params = [];
    
    if (directoryPath) {
      query += ` AND directory_path LIKE ?`;
      params.push(directoryPath + '%');
    }
    
    const result = await db.get(query, params);
    res.json({ count: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/media/edit
 * Body: { path, operations, saveMode }
 */
const editMedia = async (req, res) => {
  try {
    const { path: filePath, operations, saveMode } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const decodedPath = decodeURIComponent(filePath);
    const normalizedPath = normalizePath(decodedPath);
    const db = await getDb();
    const existingMedia = await db.get('SELECT path FROM media WHERE path = ?', [normalizedPath]);
    if (!existingMedia) {
      return res.status(403).json({ error: 'Editing is only allowed for indexed media files' });
    }
    const sourcePath = existingMedia.path;
    
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const format = operations?.format || 'png';
    const ext = format === 'jpeg' ? 'jpg' : format;

    let outputPath = sourcePath;
    
    if (saveMode === 'saveAs') {
      const parsedPath = path.parse(sourcePath);
      const timestamp = Date.now();
      outputPath = path.join(parsedPath.dir, `${parsedPath.name}-edited-${timestamp}.${ext}`);
    } else if (saveMode === 'replace') {
      const parsedPath = path.parse(sourcePath);
      outputPath = path.join(parsedPath.dir, `${parsedPath.name}-temp-${Date.now()}.${ext}`);
    }

    // Read into memory to release file lock on Windows before we unlink it later
    const inputBuffer = await fs.promises.readFile(sourcePath);
    let pipeline = sharp(inputBuffer);

    if (operations?.adjustments) {
      const { brightness = 100, saturation = 100, blur = 0 } = operations.adjustments;
      if (brightness !== 100 || saturation !== 100) {
        pipeline = pipeline.modulate({
          brightness: brightness / 100,
          saturation: saturation / 100
        });
      }
      if (blur > 0) {
        pipeline = pipeline.blur(blur);
      }
    }

    if (operations?.rotate) {
      pipeline = pipeline.rotate(operations.rotate);
    }
    
    if (operations?.flipH) {
      pipeline = pipeline.flop();
    }
    
    if (operations?.flipV) {
      pipeline = pipeline.flip();
    }

    if (operations?.crop && operations.crop.width > 0 && operations.crop.height > 0) {
      pipeline = pipeline.extract({
        left: Math.round(operations.crop.x),
        top: Math.round(operations.crop.y),
        width: Math.round(operations.crop.width),
        height: Math.round(operations.crop.height)
      });
    }

    if (operations?.resize && (operations.resize.width || operations.resize.height)) {
      pipeline = pipeline.resize({
        width: operations.resize.width ? Math.round(operations.resize.width) : null,
        height: operations.resize.height ? Math.round(operations.resize.height) : null,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: 90 });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({ quality: 90 });
    } else {
      pipeline = pipeline.png();
    }

    // Security (CWE-22): confirm the output path stays within the same
    // directory as the source file — prevents directory traversal via
    // crafted format or saveMode values.
    const sourceDir = path.parse(sourcePath).dir;
    if (!containsPath(sourceDir, outputPath)) {
      return res.status(400).json({ error: 'Invalid output path' });
    }

    await pipeline.toFile(outputPath);

    if (saveMode === 'replace') {
      if (outputPath !== sourcePath) {
        const finalPath = path.join(path.parse(sourcePath).dir, `${path.parse(sourcePath).name}.${ext}`);
        if (outputPath !== finalPath) {
          if (finalPath !== sourcePath && fs.existsSync(finalPath)) {
            fs.unlinkSync(outputPath);
            return res.status(409).json({ error: 'A file with the selected format already exists' });
          }
          if (fs.existsSync(finalPath)) {
            fs.unlinkSync(finalPath);
          }
          fs.renameSync(outputPath, finalPath);
          outputPath = finalPath;
        }
      }
      
      const stat = fs.statSync(outputPath);
      if (sourcePath === outputPath) {
        await db.run('UPDATE media SET size = ?, modified_at = ? WHERE path = ?', [stat.size, stat.mtime.toISOString(), sourcePath]);
      } else {
        await db.run('UPDATE media SET path = ?, name = ?, ext = ?, mime_type = ?, size = ?, modified_at = ? WHERE path = ?', 
          [outputPath, path.basename(outputPath), ext, getMimeType(ext), stat.size, stat.mtime.toISOString(), sourcePath]);
      }
    } else {
      const stat = fs.statSync(outputPath);
      const parsedPath = path.parse(outputPath);
      await db.run(
        `INSERT INTO media (path, directory_path, name, ext, mime_type, size, modified_at, is_favorite)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [outputPath, parsedPath.dir, parsedPath.base, ext, getMimeType(ext), stat.size, stat.mtime.toISOString(), 0]
      );
    }

    res.json({ success: true, path: outputPath });
  } catch (err) {
    console.error('editMedia error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { serveMedia, getMediaInfo, getMediaMetadata, getMediaList, getMediaTypes, toggleFavorite, getFavoriteCount, editMedia };
