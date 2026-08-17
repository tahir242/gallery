import { useCallback, useEffect, useRef, useState } from 'react';
import { Images, Loader2, Menu, Moon, Monitor, PanelLeft, Sun, Search, X } from 'lucide-react';
import useGalleryStore from '../../store/galleryStore';

/* ── Theme cycle order ─────────────────────────────────────────────────────── */
const THEMES = ['dark', 'light', 'system'];
const THEME_ICONS = {
  dark:   <Moon size={15} className="text-accent-400" />,
  light:  <Sun  size={15} className="text-amber-400"  />,
  system: <Monitor size={15} className="text-surface-400" />,
};
const THEME_LABELS = { dark: 'Dark', light: 'Light', system: 'System' };

/* ── Mobile search overlay ─────────────────────────────────────────────────── */
const MobileSearchOverlay = ({ onClose }) => {
  const { searchQuery, setSearchQuery } = useGalleryStore();
  const [local, setLocal] = useState(searchQuery);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== searchQuery) setSearchQuery(local);
    }, 300);
    return () => clearTimeout(t);
  }, [local, searchQuery, setSearchQuery]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-surface-950/95 backdrop-blur-sm flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800">
        <Search size={16} className="text-surface-500 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Search files and folders…"
          className="flex-1 bg-transparent text-surface-100 placeholder-surface-600 text-sm outline-none"
          aria-label="Search"
        />
        <button onClick={() => { setLocal(''); }} className="btn-icon" aria-label="Clear">
          {local ? <X size={15} /> : null}
        </button>
        <button onClick={onClose} className="btn-icon" aria-label="Close search">
          <X size={17} />
        </button>
      </div>
    </div>
  );
};

/* ── Header ─────────────────────────────────────────────────────────────────── */
const Header = ({ onHomeClick }) => {
  const {
    scanStatus,
    indexedCount,
    totalFiles,
    toggleSidebar,
    sidebarOpen,
    resetScan,
    themePreference,
    setThemePreference,
    searchQuery,
    setSearchQuery,
    totalMatches,
  } = useGalleryStore();

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const searchRef = useRef(null);

  const handleHome = useCallback(() => {
    resetScan();
    if (onHomeClick) onHomeClick();
  }, [resetScan, onHomeClick]);

  const cycleTheme = useCallback(() => {
    const idx = THEMES.indexOf(themePreference);
    setThemePreference(THEMES[(idx + 1) % THEMES.length]);
  }, [themePreference, setThemePreference]);

  // Sync external search changes
  useEffect(() => { setLocalSearch(searchQuery); }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== searchQuery) setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, searchQuery, setSearchQuery]);

  // Ctrl+K global focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setMobileSearchOpen(true);
        } else {
          searchRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {mobileSearchOpen && (
        <MobileSearchOverlay onClose={() => setMobileSearchOpen(false)} />
      )}

      {/*
        3-column layout:
          LEFT   — Logo column, w-60 to match the sidebar width exactly
          CENTER — flex-1: sidebar toggle + search bar (search capped, not full-width)
          RIGHT  — actions: indexing / file count / theme
      */}
      <header className="topbar h-13 flex items-center gap-0">

        {/* ── LEFT: Logo — same width as sidebar (w-60 = 240px) ───────────── */}
        <div className="w-60 flex-shrink-0 flex items-center px-4">
          <button
            id="home-btn"
            onClick={handleHome}
            className="flex items-center gap-2.5 group"
            aria-label="Gallery home"
          >
            <div className="grid h-8 w-8 place-items-center rounded-[8px] bg-gradient-to-br from-accent-500 to-violet-600 shadow-accent-glow">
              <Images size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-surface-100 tracking-tight text-[15px] group-hover:text-accent-400 transition-colors">
              Gallery
            </span>
          </button>
        </div>

        {/* ── CENTER: flex-1 — sidebar toggle + search (not stretched to edges) ── */}
        <div className="flex flex-1 items-center gap-2 min-w-0 px-0 sm:px-5">

          {/* Sidebar toggle */}
          {scanStatus !== 'idle' && (
            <button
              id="sidebar-toggle"
              onClick={toggleSidebar}
              className="btn-icon border border-surface-800 flex-shrink-0"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeft size={16} /> : <Menu size={16} />}
            </button>
          )}

          {/* Desktop search — capped width, not edge-to-edge */}
          {scanStatus !== 'idle' && (
            <div className="hidden sm:flex relative w-full max-w-xl min-w-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none"
              />
              <input
                id="header-search"
                ref={searchRef}
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search files… (Ctrl+K)"
                aria-label="Search media files"
                className="w-full bg-surface-900/60 border border-surface-800 rounded-card
                           pl-9 pr-10 py-2 text-sm text-surface-200 placeholder-surface-600
                           focus:outline-none focus:ring-1 focus:ring-accent-500/50 focus:border-accent-500/40
                           transition-all duration-200"
              />
              {localSearch && (
                <>
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[11px] text-surface-600 font-medium tabular-nums">
                    {totalMatches}
                  </span>
                  <button
                    id="header-search-clear"
                    onClick={() => setLocalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Actions ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 px-4">

          {/* Mobile search icon */}
          {scanStatus !== 'idle' && (
            <button
              id="mobile-search-btn"
              onClick={() => setMobileSearchOpen(true)}
              className="sm:hidden btn-icon border border-surface-800"
              aria-label="Open search"
            >
              <Search size={16} />
            </button>
          )}

          {/* Indexing indicator */}
          {scanStatus === 'scanning' && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-tile bg-accent-500/10 border border-accent-500/20">
              <Loader2 size={11} className="animate-spin text-accent-400" />
              <span className="text-[11px] text-accent-400 font-medium">Indexing…</span>
            </div>
          )}

          {scanStatus !== 'idle' && (
            <div className="hidden md:block text-xs text-surface-600 px-1">
              <span className="text-surface-400 font-medium tabular-nums">
                {(scanStatus === 'scanning' ? indexedCount : totalFiles).toLocaleString()}
              </span> files
            </div>
          )}

          {/* Theme cycle button */}
          <button
            id="theme-toggle"
            onClick={cycleTheme}
            className="btn-icon border border-surface-800"
            aria-label={`Theme: ${THEME_LABELS[themePreference]}. Click to switch.`}
            title={`Theme: ${THEME_LABELS[themePreference]}`}
          >
            {THEME_ICONS[themePreference]}
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;
