import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getMediaUrl = (filePath) =>
  `/api/media/serve?path=${encodeURIComponent(filePath)}`;

export const healthCheck = () =>
  api.get('/health').then((r) => r.data);

export const startScan = (path, extensions) =>
  api.post('/directory/scan', { path, extensions }).then(r => r.data);

export const updateScanExtensions = (scanId, extensions) =>
  api.put(`/directory/scan/${scanId}/extensions`, { extensions }).then(r => r.data);

export const getScanStatus = (scanId) =>
  api.get(`/directory/scan/${scanId}/status`).then(r => r.data);

export const getDirectories = (parentPath) =>
  api.get('/directory/list', { params: { parentPath } }).then(r => r.data.directories);

export const searchDirectories = (q, root) =>
  api.get('/directory/search', { params: { q, root } }).then(r => r.data.directories);

export const getMedia = (params) =>
  api.get('/media/list', { params }).then(r => r.data);

export const getMediaTypes = (directoryPath) =>
  api.get('/media/types', { params: { directoryPath } }).then(r => r.data);

export const getHistory = () =>
  api.get('/directory/history').then(r => r.data);

export const deleteHistory = (path) =>
  api.delete('/directory/history', { data: { path } }).then(r => r.data);

export const toggleFavoriteApi = (path) =>
  api.post('/media/favorite', { path }).then(r => r.data);

export const getFavoriteCountApi = () =>
  api.get('/media/favorites/count').then(r => r.data.count);

export const getMediaMetadataApi = (path) =>
  api.get('/media/metadata', { params: { path } }).then(r => r.data);
