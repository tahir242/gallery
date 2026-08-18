import { create } from 'zustand';
import {
  startScan as apiStartScan,
  getScanStatus,
  getMedia,
  getMediaTypes,
  toggleFavoriteApi,
  getFavoriteCountApi,
  updateScanExtensions as apiUpdateScanExtensions
} from '../services/api';

const getStoredTheme = () => {
  try { return localStorage.getItem('gallery-theme') || 'dark'; } catch { return 'dark'; }
};

const useGalleryStore = create((set, get) => ({
  currentPath: '',
  scanId: null,
  scanStatus: 'idle',
  scanError: null,
  totalFiles: 0,
  indexedCount: 0,

  files: [],
  page: 1,
  hasMore: false,
  isLoadingMore: false,
  filesError: null,
  filesRequestId: 0,
  totalMatches: 0,
  availableFileTypes: [],

  searchQuery: '',
  selectedFolder: null, // this will hold the path of the selected folder, or 'all' for root
  selectedFileType: '',
  viewMode: 'masonry',
  sortField: 'date',
  sortOrder: 'desc',
  selectedFile: null,
  sidebarOpen: true,
  themePreference: getStoredTheme(),
  metadataPanelOpen: false,
  showFavorites: false,
  totalFavoritesCount: 0,
  scanCompletedAt: 0,

  favorites: new Set(),
  history: [],
  
  _pollInterval: null,

  setCurrentPath: (path) => set({ currentPath: path }),
  setThemePreference: (themePreference) => {
    try { localStorage.setItem('gallery-theme', themePreference); } catch {}
    set({ themePreference });
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleMetadataPanel: () => set((s) => ({ metadataPanelOpen: !s.metadataPanelOpen })),

  setSearchQuery: (q) => { set({ searchQuery: q, page: 1 }); get().loadFiles(true); },
  setSelectedFolder: (folder) => { set({ selectedFolder: folder, selectedFileType: '', page: 1 }); get().loadFiles(true); },
  setSelectedFileType: (ft) => { set({ selectedFileType: ft, page: 1 }); get().loadFiles(true); },
  setSort: (field, order) => { set({ sortField: field, sortOrder: order, page: 1 }); get().loadFiles(true); },
  setShowFavorites: (val) => { set({ showFavorites: val, page: 1 }); get().loadFiles(true); },

  toggleFavorite: async (filePath) => {
    // Optimistic update
    set((s) => {
      const next = new Set(s.favorites);
      let diff = 0;
      let nextFiles = s.files;
      if (next.has(filePath)) {
        next.delete(filePath);
        diff = -1;
        if (s.showFavorites) {
          nextFiles = s.files.filter(f => f.path !== filePath);
        }
      } else {
        next.add(filePath);
        diff = 1;
      }
      return { 
        favorites: next, 
        totalFavoritesCount: Math.max(0, s.totalFavoritesCount + diff),
        files: nextFiles,
        totalMatches: (s.showFavorites && diff < 0) ? Math.max(0, s.totalMatches - 1) : s.totalMatches
      };
    });
    try {
      const res = await toggleFavoriteApi(filePath);
      // Sync back with server state in case of mismatch
      set((s) => {
        const next = new Set(s.favorites);
        let diff = 0;
        let nextFiles = s.files;
        const previouslyHad = next.has(filePath);
        if (res.is_favorite) {
          next.add(filePath);
          diff = previouslyHad ? 0 : 1;
        } else {
          next.delete(filePath);
          diff = previouslyHad ? -1 : 0;
          if (s.showFavorites) {
            nextFiles = s.files.filter(f => f.path !== filePath);
          }
        }
        return { 
          favorites: next, 
          totalFavoritesCount: Math.max(0, s.totalFavoritesCount + diff),
          files: nextFiles,
          totalMatches: (s.showFavorites && diff < 0) ? Math.max(0, s.totalMatches - 1) : s.totalMatches
        };
      });
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      // Revert on error
      set((s) => {
        const next = new Set(s.favorites);
        let diff = 0;
        // Reverting back: we can't easily put it back in `s.files` in the right spot, 
        // so we'll just refresh the files if we're in showFavorites mode to be safe.
        if (next.has(filePath)) {
          next.delete(filePath);
          diff = -1;
        } else {
          next.add(filePath);
          diff = 1;
        }
        
        if (s.showFavorites) {
          get().loadFiles(true); // Hard refresh to ensure consistency if api fails
        }
        
        return { favorites: next, totalFavoritesCount: Math.max(0, s.totalFavoritesCount + diff) };
      });
    }
  },
  isFavorite: (filePath) => get().favorites.has(filePath),
  
  fetchFavoriteCount: async () => {
    try {
      const count = await getFavoriteCountApi(get().currentPath);
      set({ totalFavoritesCount: count });
    } catch (e) {
      console.error('Failed to fetch favorite count', e);
    }
  },
  
  fetchHistory: async () => {
    try {
      const { getHistory } = await import('../services/api');
      const history = await getHistory();
      set({ history });
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  },
  
  deleteHistory: async (path) => {
    try {
      const { deleteHistory } = await import('../services/api');
      await deleteHistory(path);
      get().fetchHistory();
    } catch (e) {
      console.error('Failed to delete history', e);
    }
  },

  resetScan: () => {
    clearInterval(get()._pollInterval);
    set({
      currentPath: '', scanId: null, scanStatus: 'idle', scanError: null,
      totalFiles: 0, indexedCount: 0, directoriesDiscovered: 0, selectedExtensions: [],
      files: [], page: 1, hasMore: false, totalMatches: 0,
      availableFileTypes: [], filesError: null,
      filesRequestId: get().filesRequestId + 1,
      searchQuery: '', selectedFolder: null, selectedFileType: '',
      selectedFile: null, metadataPanelOpen: false, _pollInterval: null,
      showFavorites: false,
    });
  },

  startScanAction: async (rootPath, extensions = []) => {
    clearInterval(get()._pollInterval);

    set({
      currentPath: rootPath,
      scanStatus: 'scanning',
      scanError: null,
      totalFiles: 0,
      indexedCount: 0,
      directoriesDiscovered: 0,
      files: [],
      page: 1,
      hasMore: false,
      totalMatches: 0,
      availableFileTypes: [],
      filesError: null,
      filesRequestId: get().filesRequestId + 1,
      searchQuery: '',
      selectedFolder: 'all',
      selectedFileType: '',
      selectedFile: null,
      metadataPanelOpen: false,
      showFavorites: false,
      totalFavoritesCount: 0,
      selectedExtensions: extensions,
    });

    try {
      const res = await apiStartScan(rootPath, extensions);
      set({ scanId: res.scanId });
      get().fetchHistory();
      get().fetchFavoriteCount();
      
      // Load initial root media immediately
      get().loadFiles(true);

      const interval = setInterval(async () => {
        if (get()._pollInterval !== interval) return;
        try {
          const statusRes = await getScanStatus(res.scanId);
          if (get()._pollInterval !== interval) return;

          set({
            scanStatus: statusRes.status,
            totalFiles: statusRes.files_discovered,
            indexedCount: statusRes.files_indexed,
            directoriesDiscovered: statusRes.directories_discovered,
          });

          if (statusRes.status === 'scanning' && statusRes.files_indexed > 0) {
            if (get().files.length === 0) {
              get().loadFiles(true);
            }
          }

          if (statusRes.status === 'completed' || statusRes.status === 'error') {
            clearInterval(get()._pollInterval);
            set({ _pollInterval: null }); // explicitly clear
            if (statusRes.status === 'error') {
              set({ scanError: statusRes.error_message });
            } else {
              set({ scanCompletedAt: Date.now() });
            }
            get().loadFiles(true);
            get().fetchFavoriteCount();
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1000);
      
      set({ _pollInterval: interval });
    } catch (err) {
      set({ scanStatus: 'error', scanError: `Failed to start scan: ${err.message}` });
    }
  },

  updateExtensionsAction: async (extensions) => {
    const { scanId } = get();
    if (!scanId) return;
    try {
      set({ selectedExtensions: extensions });
      await apiUpdateScanExtensions(scanId, extensions);
      
      // Start polling so we catch the new files being indexed
      clearInterval(get()._pollInterval);
      set({ scanStatus: 'scanning' });
      get().loadFiles(true);

      const interval = setInterval(async () => {
        if (get()._pollInterval !== interval) return;
        try {
          const statusRes = await getScanStatus(scanId);
          if (get()._pollInterval !== interval) return;

          set({
            scanStatus: statusRes.status,
            totalFiles: statusRes.files_discovered,
            indexedCount: statusRes.files_indexed,
            directoriesDiscovered: statusRes.directories_discovered,
          });

          if (statusRes.status === 'scanning' && statusRes.files_indexed > 0) {
             get().loadFiles(true);
          }

          if (statusRes.status === 'completed' || statusRes.status === 'error') {
            clearInterval(get()._pollInterval);
            set({ _pollInterval: null });
            if (statusRes.status === 'error') {
              set({ scanError: statusRes.error_message });
            } else {
              set({ scanCompletedAt: Date.now() });
            }
            get().loadFiles(true);
            get().fetchFavoriteCount();
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1000);
      
      set({ _pollInterval: interval });
    } catch (e) {
      console.error('Failed to update extensions:', e);
    }
  },

  loadFiles: async (reset = false) => {
    const {
      scanId, currentPath, page, searchQuery, selectedFolder, selectedFileType,
      isLoadingMore, hasMore, sortField, sortOrder,
    } = get();

    if (!scanId || !currentPath) return;
    if (!reset && (!hasMore || isLoadingMore)) return;

    const targetPage = reset ? 1 : page + 1;
    const requestId = get().filesRequestId + 1;
    set({ isLoadingMore: true, filesError: null, filesRequestId: requestId });

    try {
      const result = await getMedia({
        directoryPath: selectedFolder === 'all' ? currentPath : selectedFolder,
        ext: selectedFileType,
        search: searchQuery,
        favoritesOnly: get().showFavorites,
        sortField,
        sortOrder,
        page: targetPage,
        limit: 60,
      });

      const getType = (mime) => {
        if (!mime) return 'document';
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
        if (mime.startsWith('audio/')) return 'audio';
        return 'document';
      };

      const mappedFiles = result.files.map(f => ({
        ...f,
        type: getType(f.mime_type),
        directory: f.directory_path
      }));

      set((state) => {
        if (state.filesRequestId !== requestId) return state;
        
        const nextFavorites = new Set(state.favorites);
        mappedFiles.forEach(f => {
          if (f.is_favorite) nextFavorites.add(f.path);
          else nextFavorites.delete(f.path);
        });

        return {
          files: reset ? mappedFiles : [...state.files, ...mappedFiles],
          page: targetPage,
          hasMore: result.hasMore,
          totalMatches: result.totalMatches,
          isLoadingMore: false,
          favorites: nextFavorites,
        };
      });

      if (reset) {
        try {
          const types = await getMediaTypes(selectedFolder === 'all' ? currentPath : selectedFolder);
          set((state) => (state.filesRequestId === requestId ? { availableFileTypes: types } : state));
        } catch (e) {
          // ignore type fetch error
        }
      }
    } catch (err) {
      set((state) =>
        state.filesRequestId === requestId
          ? { isLoadingMore: false, filesError: 'Unable to load media files.' }
          : state
      );
    }
  },
}));

export default useGalleryStore;
