import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for large directory scans
  headers: { 'Content-Type': 'application/json' },
});

// ─── Directory API ────────────────────────────────────────────────────────────

/**
 * Scan a directory path
 * @param {string} path - local or UNC path
 * @param {string} [label] - optional display label
 */
export const scanDirectory = (path, label = '') =>
  api.post('/directory/scan', { path, label }).then((r) => r.data);

/**
 * Fetch scan session history
 */
export const getHistory = () =>
  api.get('/directory/history').then((r) => r.data);

/**
 * Delete a scan session
 * @param {string} id
 */
export const deleteSession = (id) =>
  api.delete(`/directory/history/${id}`).then((r) => r.data);

// ─── Media API ────────────────────────────────────────────────────────────────

/**
 * Build a media serve URL for a file path
 * @param {string} filePath
 * @returns {string}
 */
export const getMediaUrl = (filePath) =>
  `/api/media/serve?path=${encodeURIComponent(filePath)}`;

/**
 * Health check
 */
export const healthCheck = () =>
  api.get('/health').then((r) => r.data);

export default api;
