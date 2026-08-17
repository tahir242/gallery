import { useCallback, useEffect, useRef, useState } from 'react';
import { Images, Loader2, Menu, Moon, Monitor, PanelLeft, Sun, Search, X, SlidersHorizontal, Image as ImageIcon, Video, FileText, Music, ChevronDown, ChevronUp } from 'lucide-react';
import useGalleryStore from '../../store/galleryStore';
import { Tooltip } from '../ui/Tooltip';

/* ── Theme cycle order ─────────────────────────────────────────────────────── */
const THEMES = ['dark', 'light', 'system'];
const THEME_ICONS = {
  dark:   <Moon size={15} className="text-accent-400" />,
  light:  <Sun  size={15} className="text-amber-400"  />,
  system: <Monitor size={15} className="text-surface-400" />,
};
const THEME_LABELS = { dark: 'Dark', light: 'Light', system: 'System' };

const GROUPS = [
  { id: 'image', label: 'Photos', icon: ImageIcon, exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif', 'avif', 'ico'] },
  { id: 'video', label: 'Videos', icon: Video, exts: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'] },
  { id: 'audio', label: 'Audio', icon: Music, exts: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'] },
  { id: 'document', label: 'Documents', icon: FileText, exts: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'] }
];

/* ── Filter Modal ──────────────────────────────────────────────────────────── */
const FilterModal = ({ onClose }) => {
  const { selectedExtensions, updateExtensionsAction } = useGalleryStore();
  
  const [selectedExts, setSelectedExts] = useState(() => new Set(selectedExtensions || []));
  const [selectedGroups, setSelectedGroups] = useState(() => {
    const s = new Set(selectedExtensions || []);
    const groups = { image: false, video: false, audio: false, document: false };
    GROUPS.forEach(g => {
      groups[g.id] = g.exts.every(e => s.has(e));
    });
    return groups;
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const toggleGroup = (groupId) => {
    const group = GROUPS.find(g => g.id === groupId);
    const isSelected = !selectedGroups[groupId];
    setSelectedGroups(prev => ({ ...prev, [groupId]: isSelected }));
    
    setSelectedExts(prev => {
      const next = new Set(prev);
      if (isSelected) {
        group.exts.forEach(e => next.add(e));
      } else {
        group.exts.forEach(e => next.delete(e));
      }
      return next;
    });
  };

  const toggleExt = (ext, groupId) => {
    setSelectedExts(prev => {
      const next = new Set(prev);
      if (next.has(ext)) next.delete(ext);
      else next.add(ext);
      
      const group = GROUPS.find(g => g.id === groupId);
      const allSelected = group.exts.every(e => next.has(e));
      const noneSelected = group.exts.every(e => !next.has(e));
      
      setSelectedGroups(g => ({
        ...g,
        [groupId]: allSelected ? true : noneSelected ? false : g[groupId]
      }));
      
      return next;
    });
  };

  const handleSave = () => {
    if (selectedExts.size > 0) {
      updateExtensionsAction(Array.from(selectedExts));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-950 border border-surface-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <h2 className="text-sm font-semibold text-surface-100 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-accent-400" />
            File Types
          </h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">
            What should we index?
          </label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {GROUPS.map(group => {
              const Icon = group.icon;
              const isSelected = selectedGroups[group.id];
              return (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
                    isSelected 
                      ? 'bg-accent-500/10 border-accent-500/50 text-accent-400' 
                      : 'bg-surface-900 border-surface-800 text-surface-400 hover:bg-surface-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{group.label}</span>
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced Options
          </button>
          
          {advancedOpen && (
            <div className="mt-3 p-3 bg-surface-900/50 rounded-lg border border-surface-800 space-y-3">
              {GROUPS.map(group => (
                <div key={group.id}>
                  <p className="text-[10px] uppercase font-semibold text-surface-600 mb-1.5">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.exts.map(ext => {
                      const checked = selectedExts.has(ext);
                      return (
                        <button
                          key={ext}
                          onClick={() => toggleExt(ext, group.id)}
                          className={`px-2 py-1 text-[10px] font-mono rounded-md border transition-colors ${
                            checked 
                              ? 'bg-accent-500/10 border-accent-500/30 text-accent-300' 
                              : 'bg-surface-950 border-surface-800 text-surface-500 hover:text-surface-300'
                          }`}
                        >
                          .{ext}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-surface-800 bg-surface-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={selectedExts.size === 0}
            className="btn-primary px-4"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [filterModalOpen, setFilterModalOpen] = useState(false);
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
      
      {filterModalOpen && (
        <FilterModal onClose={() => setFilterModalOpen(false)} />
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
            <Tooltip content={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}>
              <button
                id="sidebar-toggle"
                onClick={toggleSidebar}
                className="btn-icon border border-surface-800 flex-shrink-0"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {sidebarOpen ? <PanelLeft size={16} /> : <Menu size={16} />}
              </button>
            </Tooltip>
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
            <Tooltip content="Filter file types">
              <button
                onClick={() => setFilterModalOpen(true)}
                className="btn-icon border border-surface-800 text-accent-400 hover:bg-accent-500/10 hover:border-accent-500/30"
                aria-label="Filter file types"
              >
                <SlidersHorizontal size={15} />
              </button>
            </Tooltip>
          )}

          {/* Theme cycle button */}
          <Tooltip content={`Theme: ${THEME_LABELS[themePreference]}`}>
            <button
              id="theme-toggle"
              onClick={cycleTheme}
              className="btn-icon border border-surface-800"
              aria-label={`Theme: ${THEME_LABELS[themePreference]}. Click to switch.`}
            >
              {THEME_ICONS[themePreference]}
            </button>
          </Tooltip>
        </div>
      </header>
    </>
  );
};

export default Header;
