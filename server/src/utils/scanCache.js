/**
 * In-memory scan cache with TTL.
 * Stores scan results keyed by normalized directory path.
 * Avoids re-scanning on pagination/search requests.
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** @type {Map<string, { data: object, timestamp: number }>} */
const cache = new Map();

/**
 * Store scan result
 * @param {string} key - normalized directory path
 * @param {{ files: Array, folders: string[], folderTree: object }} data
 */
const set = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Retrieve scan result (returns null if missing or expired)
 * @param {string} key
 * @returns {object|null}
 */
const get = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

/**
 * Delete a cache entry
 * @param {string} key
 */
const del = (key) => cache.delete(key);

/**
 * Check if a key exists and is not expired
 * @param {string} key
 * @returns {boolean}
 */
const has = (key) => get(key) !== null;

/**
 * List all cached paths with their timestamps
 * @returns {Array<{ path: string, fileCount: number, cachedAt: Date }>}
 */
const list = () => {
  const now = Date.now();
  const result = [];
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp <= CACHE_TTL_MS) {
      result.push({
        path: key,
        fileCount: entry.data.files.length,
        cachedAt: new Date(entry.timestamp),
      });
    }
  }
  return result;
};

module.exports = { set, get, del, has, list };
