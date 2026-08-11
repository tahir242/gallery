const fs = require('fs');
const path = require('path');
const { getMimeType } = require('../utils/mediaTypes');
const { normalizePath, checkAccess } = require('../utils/scanner');

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

module.exports = { serveMedia, getMediaInfo };
