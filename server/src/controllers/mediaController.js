const fs = require('fs');
const path = require('path');
const { getMimeType } = require('../utils/mediaTypes');
const { normalizePath } = require('../utils/scanner');
const { getDb } = require('../db');
const { exiftool } = require('exiftool-vendored');
const sharp = require('sharp');

/**
 * GET /api/media/serve?path=<encoded_file_path>
 * Stream a media file to the client with proper MIME type and range support
 */
const serveMedia = (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const decodedPath = decodeURIComponent(filePath);
  const normalizedPath = normalizePath(decodedPath);

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
const getMediaInfo = (req, res) => {
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }

  const decodedPath = decodeURIComponent(filePath);
  const normalizedPath = normalizePath(decodedPath);

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
      search,
      favoritesOnly,
      sortField = 'modified_at',
      sortOrder = 'desc',
      page = 1,
      limit = 60
    } = req.query;

    let query = `SELECT * FROM media WHERE 1=1`;
    const params = [];

    // Filter by directory path (exact match) OR if omitted, all media
    if (directoryPath) {
      // For recursive, we could do LIKE but prompt said "Do not recursively load the entire directory tree unless necessary".
      // We will only load media exactly in the directoryPath.
      // Wait, "All Files" mode means directoryPath is empty.
      if (directoryPath === 'all') {
        // don't filter by directory
      } else {
        // If we want recursive loading for a selected folder, we do LIKE path + '%'
        query += ` AND directory_path LIKE ?`;
        params.push(directoryPath + '%');
      }
    }

    if (ext) {
      query += ` AND ext = ?`;
      params.push(ext);
    }

    if (search) {
      query += ` AND name LIKE ?`;
      params.push('%' + search + '%');
    }
    
    if (favoritesOnly === 'true') {
      query += ` AND is_favorite = 1`;
    }

    // Determine sort column securely
    const validFields = ['name', 'size', 'modified_at'];
    const validOrders = ['asc', 'desc'];
    
    // Map frontend sort names to DB columns
    let dbSortField = 'modified_at';
    if (sortField === 'date') dbSortField = 'modified_at';
    else if (validFields.includes(sortField)) dbSortField = sortField;

    const dbSortOrder = validOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    query += ` ORDER BY ${dbSortField} ${dbSortOrder}`;

    // Pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = parseInt(limit, 10);
    
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const totalResult = await db.get(countQuery, params);
    
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const files = await db.all(query, params);

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
    const result = await db.get('SELECT COUNT(*) as count FROM media WHERE is_favorite = 1');
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
