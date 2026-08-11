import { create } from 'zustand';
import { fetchFiles } from '../services/api';

const useGalleryStore = create((set, get) => ({
  // ─── Scan State ───────────────────────────────────────────────────────────
  currentPath: '',
  scanResult: null,       // { folderTree, totalFiles, ... } (metadata only)
  isScanning: false,
  scanError: null,

  // ─── File State (Paginated from Server) ───────────────────────────────────
  files: [],
  page: 1,
  hasMore: false,
  isLoadingMore: false,
  totalMatches: 0,

  // ─── UI State ─────────────────────────────────────────────────────────────
  searchQuery: '',
  selectedFolder: null,   // absolute folder path string or null
  viewMode: 'grid',       // 'grid' | 'list'
  selectedFile: null,     // file object for lightbox
  sidebarOpen: true,

  // ─── History ──────────────────────────────────────────────────────────────
  history: [],

  // ─── Actions ──────────────────────────────────────────────────────────────
  setCurrentPath: (path) => set({ currentPath: path }),

  setScanResult: (result) => {
    set({
      scanResult: result,
      isScanning: false,
      scanError: null,
      searchQuery: '',
      selectedFolder: null,
      files: [],
      page: 1,
      hasMore: false,
      totalMatches: 0,
    });
    // Trigger initial file load
    get().loadFiles(true);
  },

  setScanError: (error) => set({ scanError: error, isScanning: false }),

  setIsScanning: (val) => set({ isScanning: val, scanError: null }),

  setSearchQuery: (q) => {
    set({ searchQuery: q, page: 1 });
    get().loadFiles(true);
  },

  setSelectedFolder: (folder) => {
    set({ selectedFolder: folder, page: 1 });
    get().loadFiles(true);
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedFile: (file) => set({ selectedFile: file }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setHistory: (history) => set({ history }),

  resetScan: () =>
    set({
      currentPath: '',
      scanResult: null,
      isScanning: false,
      scanError: null,
      searchQuery: '',
      selectedFolder: null,
      selectedFile: null,
      files: [],
      page: 1,
      hasMore: false,
      totalMatches: 0,
    }),

  // ─── Async Data Fetching ──────────────────────────────────────────────────
  loadFiles: async (reset = false) => {
    const { currentPath, page, searchQuery, selectedFolder, isLoadingMore, hasMore } = get();
    
    if (!currentPath) return;
    if (!reset && (!hasMore || isLoadingMore)) return;

    const targetPage = reset ? 1 : page + 1;
    
    set({ isLoadingMore: true });
    
    try {
      const data = await fetchFiles({
        path: currentPath,
        page: targetPage,
        limit: 50,
        search: searchQuery,
        folder: selectedFolder || '',
      });
      
      set((state) => ({
        files: reset ? data.files : [...state.files, ...data.files],
        page: targetPage,
        hasMore: data.hasMore,
        totalMatches: data.totalMatches,
        isLoadingMore: false,
      }));
    } catch (error) {
      console.error('Failed to load files:', error);
      set({ isLoadingMore: false });
    }
  },
}));

export default useGalleryStore;
