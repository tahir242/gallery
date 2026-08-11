import { create } from 'zustand';

const useGalleryStore = create((set, get) => ({
  // ─── Scan State ───────────────────────────────────────────────────────────
  currentPath: '',
  scanResult: null,       // { files, folderTree, fileCount, folderCount, ... }
  isScanning: false,
  scanError: null,

  // ─── UI State ─────────────────────────────────────────────────────────────
  searchQuery: '',
  selectedFolder: null,   // null = show all
  viewMode: 'grid',       // 'grid' | 'list'
  selectedFile: null,     // file object for lightbox
  sidebarOpen: true,

  // ─── History ──────────────────────────────────────────────────────────────
  history: [],

  // ─── Actions ──────────────────────────────────────────────────────────────
  setCurrentPath: (path) => set({ currentPath: path }),

  setScanResult: (result) =>
    set({
      scanResult: result,
      isScanning: false,
      scanError: null,
      searchQuery: '',
      selectedFolder: null,
    }),

  setScanError: (error) => set({ scanError: error, isScanning: false }),

  setIsScanning: (val) => set({ isScanning: val, scanError: null }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setSelectedFolder: (folder) => set({ selectedFolder: folder }),

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
    }),

  // ─── Derived / Computed ───────────────────────────────────────────────────
  /**
   * Returns filtered files based on search query and selected folder
   */
  getFilteredFiles: () => {
    const { scanResult, searchQuery, selectedFolder } = get();
    if (!scanResult) return [];

    let files = scanResult.files;

    // Filter by folder
    if (selectedFolder) {
      files = files.filter(
        (f) => f.directory === selectedFolder || f.path.startsWith(selectedFolder)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }

    return files;
  },
}));

export default useGalleryStore;
