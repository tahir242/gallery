/**
 * Supported media file extensions and their types
 */
const MEDIA_TYPES = {
  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  bmp: 'image',
  tiff: 'image',
  tif: 'image',
  svg: 'image',
  heic: 'image',
  heif: 'image',
  avif: 'image',
  ico: 'image',

  // Documents
  pdf: 'document',

  // Videos
  mp4: 'video',
  mkv: 'video',
  avi: 'video',
  mov: 'video',
  wmv: 'video',
  flv: 'video',
  webm: 'video',
  m4v: 'video',
  mpg: 'video',
  mpeg: 'video',
  '3gp': 'video',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  wma: 'audio',
};

/**
 * Get media type for a file extension
 * @param {string} ext - file extension (without dot)
 * @returns {'image'|'video'|'audio'|null}
 */
const getMediaType = (ext) => {
  return MEDIA_TYPES[ext.toLowerCase()] || null;
};

/**
 * Check if a file extension is a supported media type
 * @param {string} ext - file extension (without dot)
 * @returns {boolean}
 */
const isMediaFile = (ext) => {
  return ext.toLowerCase() in MEDIA_TYPES;
};

/**
 * Get MIME type for serving a file
 * @param {string} ext
 * @returns {string}
 */
const getMimeType = (ext) => {
  const mimeMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    svg: 'image/svg+xml',
    heic: 'image/heic',
    heif: 'image/heif',
    avif: 'image/avif',
    ico: 'image/x-icon',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    webm: 'video/webm',
    m4v: 'video/x-m4v',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    '3gp': 'video/3gpp',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    m4a: 'audio/m4a',
    wma: 'audio/x-ms-wma',
  };
  return mimeMap[ext.toLowerCase()] || 'application/octet-stream';
};

module.exports = { getMediaType, isMediaFile, getMimeType, MEDIA_TYPES };
