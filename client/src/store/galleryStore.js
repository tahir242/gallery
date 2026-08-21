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

/* ─── Recent files helpers (per root path, max 20) ──────────────────────────── */
const RECENTS_LIMIT = 20;

const getStoredRecents = (rootPath) => {
  try {
    const raw = localStorage.getItem(`gallery-recents-${rootPath}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const persistRecents = (rootPath, items) => {
  try {
    localStorage.setItem(`gallery-recents-${rootPath}`, JSON.stringify(items));
  } catch {}
};

/* ─── Sidebar section collapse helpers ──────────────────────────────────────── */
const getStoredSidebarSections = () => {
  try {
    const raw = localStorage.getItem('gallery-sidebar-sections');
    return raw ? JSON.parse(raw) : { locations: true, library: true, folders: true };
  } catch { return { locations: true, library: true, folders: true }; }
};

const persistSidebarSections = (sections) => {
  try {
    localStorage.setItem('gallery-sidebar-sections', JSON.stringify(sections));
  } catch {}
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
  
  // ── Library & Recents ────────────────────────────────────────────────────────
  activeLibrarySection: 'all', // 'all' | 'image' | 'video' | 'audio' | 'document' | 'favorites' | 'recents'
  mediaType: '',                // '' | 'image' | 'video' | 'audio' | 'document' — maps to mime_type prefix
  recentFiles: [],              // populated from localStorage on first scan load

  // ── Sidebar section collapse state ───────────────────────────────────────────
  sidebarSections: getStoredSidebarSections(), // { locations, library, folders }



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
  setSelectedFolder: (folder) => { set({ selectedFolder: folder, selectedFileType: '', mediaType: '', page: 1 }); get().loadFiles(true); },
  setSelectedFileType: (ft) => { set({ selectedFileType: ft, page: 1 }); get().loadFiles(true); },
  setSort: (field, order) => { set({ sortField: field, sortOrder: order, page: 1 }); get().loadFiles(true); },
  setShowFavorites: (val) => { set({ showFavorites: val, page: 1 }); get().loadFiles(true); },

  // ── Library section navigation ───────────────────────────────────────────────
  setActiveLibrarySection: (section) => {
    const s = get();
    if (section === 'favorites') {
      set({ activeLibrarySection: section, showFavorites: true, selectedFileType: '', mediaType: '', selectedFolder: 'all', page: 1 });
      get().loadFiles(true);
    } else if (section === 'recents') {
      // Load recents from localStorage for current path
      const recents = getStoredRecents(s.currentPath);
      set({ activeLibrarySection: section, recentFiles: recents, showFavorites: false });
    } else if (section === 'all') {
      set({ activeLibrarySection: section, showFavorites: false, selectedFileType: '', mediaType: '', selectedFolder: 'all', page: 1 });
      get().loadFiles(true);
    } else {
      // 'image' | 'video' | 'audio' | 'document' — use mediaType for server mime_type filter
      set({ activeLibrarySection: section, showFavorites: false, selectedFileType: '', mediaType: section, selectedFolder: 'all', page: 1 });
      get().loadFiles(true);
    }
  },

  // ── Recent files tracking ────────────────────────────────────────────────────
  addRecentFile: (file) => {
    const { currentPath, recentFiles, activeLibrarySection } = get();
    if (!currentPath || !file?.path) return;
    // Deduplicate: remove existing entry for same path then prepend
    const filtered = recentFiles.filter(f => f.path !== file.path);
    const updated = [file, ...filtered].slice(0, RECENTS_LIMIT);
    persistRecents(currentPath, updated);
    // Only update state if we're currently on the Recents section (avoid re-renders)
    if (activeLibrarySection === 'recents') {
      set({ recentFiles: updated });
    } else {
      // Still persist but keep state in sync silently
      set({ recentFiles: updated });
    }
  },

  clearRecentFiles: () => {
    const { currentPath } = get();
    if (currentPath) persistRecents(currentPath, []);
    set({ recentFiles: [] });
  },

  // ── Sidebar section toggle (collapse/expand) ─────────────────────────────────
  toggleSidebarSection: (section) => {
    set((s) => {
      const updated = { ...s.sidebarSections, [section]: !s.sidebarSections[section] };
      persistSidebarSections(updated);
      return { sidebarSections: updated };
    });
  },

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
      activeLibrarySection: 'all',
      mediaType: '',
      recentFiles: [],
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
      activeLibrarySection: 'all',
      mediaType: '',
      recentFiles: getStoredRecents(rootPath),
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

          // Load the first batch of results as soon as files start appearing
          if (statusRes.status === 'scanning' && statusRes.files_indexed > 0) {
            if (get().files.length === 0) {
              get().loadFiles(true);
            }
          }

          // Stop polling on any terminal state: completed, error, or cancelled
          if (['completed', 'error', 'cancelled'].includes(statusRes.status)) {
            clearInterval(get()._pollInterval);
            set({ _pollInterval: null });
            if (statusRes.status === 'error') {
              set({ scanError: statusRes.error_message });
            } else if (statusRes.status === 'completed') {
              set({ scanCompletedAt: Date.now() });
              get().loadFiles(true);
              get().fetchFavoriteCount();
            }
            // 'cancelled' means the user switched location — no action needed here
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
      
      // Clear old interval and reset state for the fresh scan
      clearInterval(get()._pollInterval);
      set({ scanStatus: 'scanning', files: [], page: 1, hasMore: false, totalMatches: 0 });
      get().loadFiles(true);

      // Track how many files were indexed at the last loadFiles call so we
      // only reload when meaningful new data has arrived (not every second).
      let lastLoadedCount = 0;

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

          // Throttle: only reload grid when 100+ new files indexed since last load
          const newCount = statusRes.files_indexed || 0;
          if (statusRes.status === 'scanning' && newCount - lastLoadedCount >= 100) {
            lastLoadedCount = newCount;
            get().loadFiles(true);
          }

          // Stop polling on any terminal state
          if (['completed', 'error', 'cancelled'].includes(statusRes.status)) {
            clearInterval(get()._pollInterval);
            set({ _pollInterval: null });
            if (statusRes.status === 'error') {
              set({ scanError: statusRes.error_message });
            } else if (statusRes.status === 'completed') {
              set({ scanCompletedAt: Date.now() });
              get().loadFiles(true);
              get().fetchFavoriteCount();
            }
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
      mediaType, isLoadingMore, hasMore, sortField, sortOrder,
    } = get();

    if (!scanId || !currentPath) return;
    if (!reset && (!hasMore || isLoadingMore)) return;

    const targetPage = reset ? 1 : page + 1;
    const requestId = get().filesRequestId + 1;
    set({ isLoadingMore: true, filesError: null, filesRequestId: requestId });

    try {
      const result = await getMedia({
        directoryPath: selectedFolder === 'all' ? currentPath : selectedFolder,
        ext: selectedFileType || undefined,
        mediaType: mediaType || undefined,
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
