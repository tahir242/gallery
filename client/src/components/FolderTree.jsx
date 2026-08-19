import { useState, useCallback, useEffect } from 'react';
import {
  ChevronRight, Folder, FolderOpen, HardDrive, X, Files,
  Loader2, Heart, Search, FileText, Image as ImageIcon, Video,
  Music, Clock, MapPin, ChevronDown, Trash2,
} from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import { Tooltip } from './ui/Tooltip';
import useBreakpoint from '../hooks/useBreakpoint';
import { getDirectories, searchDirectories } from '../services/api';
import { useShallow } from 'zustand/react/shallow';

/* ═══════════════════════════════════════════════════════════════════════════════
   TREE NODE
   ═══════════════════════════════════════════════════════════════════════════════ */
const TreeNode = ({
  path: nodePath, name, hasChildren, fileCount = 0,
  subdirCount = 0, depth = 0, defaultExpanded = false, isRootNode = false,
}) => {
  const selectedFolder   = useGalleryStore(s => s.selectedFolder);
  const setSelectedFolder = useGalleryStore(s => s.setSelectedFolder);
  const scanCompletedAt   = useGalleryStore(s => s.scanCompletedAt);
  const directoriesDiscovered = useGalleryStore(s => s.directoriesDiscovered);

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [children, setChildren] = useState(null);
  const [loading, setLoading]   = useState(false);

  const isSelected = selectedFolder === nodePath;

  const fetchChildren = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dirs = await getDirectories(nodePath);
      setChildren(dirs);
    } catch (e) {
      console.error('Failed to load subdirectories', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [nodePath]);

  const toggle = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!isSelected) {
      setSelectedFolder(nodePath);
    } else {
      setSelectedFolder(null);
    }
    if (hasChildren) {
      if (!expanded && !children) fetchChildren();
      setExpanded(x => !x);
    }
  }, [isSelected, nodePath, hasChildren, expanded, children, fetchChildren, setSelectedFolder]);

  useEffect(() => {
    if (defaultExpanded && hasChildren && !children && !loading) {
      fetchChildren();
      setExpanded(true);
    }
  }, [defaultExpanded, hasChildren, children, loading, fetchChildren]);

  useEffect(() => {
    if (expanded && hasChildren) fetchChildren(children !== null);
  }, [scanCompletedAt, directoriesDiscovered, expanded, hasChildren, fetchChildren]);

  return (
    <div className="w-full">
      <button
        id={`folder-${nodePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
        onClick={toggle}
        className={`
          w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm
          transition-colors duration-150 group text-left outline-none
          focus-visible:ring-2 focus-visible:ring-accent-500
          ${isSelected
            ? 'bg-accent-500/15 text-accent-300'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasChildren ? (
            <ChevronRight
              size={13}
              className={`flex-shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
            />
          ) : (
            <span className="w-3 flex-shrink-0" />
          )}

          {isRootNode ? (
            <HardDrive size={14} className="flex-shrink-0 text-accent-400/80 group-hover:text-accent-400 transition-colors" />
          ) : expanded && hasChildren ? (
            <FolderOpen size={14} className="flex-shrink-0 text-accent-400/80 group-hover:text-accent-400 transition-colors" />
          ) : (
            <Folder size={14} className="flex-shrink-0 text-accent-400/80 group-hover:text-accent-400 transition-colors" />
          )}
        </div>

        <span className="whitespace-nowrap font-medium text-xs truncate flex-1">{name}</span>

        {!isRootNode && (
          <div className="flex items-center gap-2 ml-auto pl-3 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {subdirCount > 0 && (
              <Tooltip content={`${subdirCount.toLocaleString()} subfolders`}>
                <div className="flex items-center gap-1 text-surface-500">
                  <Folder size={10} />
                  <span className="text-[10px] tabular-nums font-medium">{subdirCount.toLocaleString()}</span>
                </div>
              </Tooltip>
            )}
            {fileCount > 0 && (
              <Tooltip content={`${fileCount.toLocaleString()} files`}>
                <div className="flex items-center gap-1 text-surface-500">
                  <FileText size={10} />
                  <span className="text-[10px] tabular-nums font-medium">{fileCount.toLocaleString()}</span>
                </div>
              </Tooltip>
            )}
          </div>
        )}

        {loading && (
          <div className="ml-2 flex-shrink-0">
            <Loader2 size={12} className="animate-spin text-surface-500" />
          </div>
        )}
      </button>

      {hasChildren && expanded && children && (
        <div className="w-full">
          {children.map(child => (
            <TreeNode
              key={child.path}
              path={child.path}
              name={child.name}
              hasChildren={child.hasChildren}
              fileCount={child.fileCount}
              subdirCount={child.subdirCount}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SECTION HEADER — collapsible
   ═══════════════════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ label, expanded, onToggle, rightSlot }) => (
  <div className="flex items-center justify-between px-2 mb-1 mt-3 first:mt-0 group/sec">
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-600 hover:text-surface-400 transition-colors"
    >
      <ChevronDown
        size={11}
        className={`transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}
      />
      {label}
    </button>
    {rightSlot}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   LIBRARY ITEM — single row in the Library section
   ═══════════════════════════════════════════════════════════════════════════════ */
const LIBRARY_ITEMS = [
  { id: 'all',      label: 'All Media',  Icon: Files,     color: 'text-accent-400'  },
  { id: 'image',    label: 'Images',     Icon: ImageIcon, color: 'text-emerald-400' },
  { id: 'video',    label: 'Videos',     Icon: Video,     color: 'text-blue-400'    },
  { id: 'audio',    label: 'Audios',     Icon: Music,     color: 'text-purple-400'  },
  { id: 'document', label: 'Documents',  Icon: FileText,  color: 'text-orange-400'  },
  { id: 'favorites',label: 'Favorites',  Icon: Heart,     color: 'text-pink-400'    },
  { id: 'recents',  label: 'Recents',    Icon: Clock,     color: 'text-yellow-400'  },
];

const LibraryItem = ({ item, isActive, onClick, badge }) => {
  const { Icon, label, color } = item;
  return (
    <button
      id={`library-${item.id}`}
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-colors duration-100 group
        ${isActive
          ? item.id === 'favorites'
            ? 'bg-pink-500/12 text-pink-400'
            : 'bg-accent-500/12 text-accent-400'
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
        }
      `}
    >
      <Icon
        size={13}
        className={`flex-shrink-0 ${isActive ? (item.id === 'favorites' ? 'text-pink-400' : 'text-accent-400') : color} transition-colors`}
      />
      <span className="flex-1 text-left">{label}</span>
      {badge != null && (
        <span className="text-[10px] tabular-nums text-surface-600 ml-auto">{badge.toLocaleString()}</span>
      )}
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   LOCATION ITEM — single row in the Locations section
   ═══════════════════════════════════════════════════════════════════════════════ */
const LocationItem = ({ session, isCurrent, onSelect, onDelete }) => (
  <div className="group/loc relative">
    <button
      id={`location-${session.id}`}
      onClick={() => onSelect(session)}
      className={`
        w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-colors duration-100 pr-7
        ${isCurrent
          ? 'bg-accent-500/12 text-accent-300'
          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
        }
      `}
    >
      <HardDrive size={12} className="flex-shrink-0 text-surface-500" />
      <div className="flex-1 min-w-0 text-left">
        <p className="truncate">{session.label || session.path.split(/[/\\]/).filter(Boolean).pop() || session.path}</p>
        {session.label && (
          <p className="text-[10px] text-surface-700 font-mono truncate">{session.path}</p>
        )}
      </div>
      {session.fileCount > 0 && (
        <span className="text-[10px] text-surface-700 flex-shrink-0 tabular-nums ml-1">
          {session.fileCount.toLocaleString()}
        </span>
      )}
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(session); }}
      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-surface-700
                 opacity-0 group-hover/loc:opacity-100 hover:text-red-400 hover:bg-red-500/10
                 transition-all duration-100"
      aria-label="Remove location"
    >
      <Trash2 size={11} />
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   FOLDER TREE (main sidebar)
   ═══════════════════════════════════════════════════════════════════════════════ */
const FolderTree = () => {
  const {
    scanStatus, scanCompletedAt, selectedFolder, setSelectedFolder,
    sidebarOpen, toggleSidebar, currentPath, indexedCount, totalFiles,
    totalFavoritesCount, directoriesDiscovered,
    history, deleteHistory, startScanAction,
    activeLibrarySection, setActiveLibrarySection, recentFiles,
    sidebarSections, toggleSidebarSection,
  } = useGalleryStore(useShallow(s => ({
    scanStatus:             s.scanStatus,
    scanCompletedAt:        s.scanCompletedAt,
    selectedFolder:         s.selectedFolder,
    setSelectedFolder:      s.setSelectedFolder,
    sidebarOpen:            s.sidebarOpen,
    toggleSidebar:          s.toggleSidebar,
    currentPath:            s.currentPath,
    indexedCount:           s.indexedCount,
    totalFiles:             s.totalFiles,
    totalFavoritesCount:    s.totalFavoritesCount,
    directoriesDiscovered:  s.directoriesDiscovered,
    history:                s.history,
    deleteHistory:          s.deleteHistory,
    startScanAction:        s.startScanAction,
    activeLibrarySection:   s.activeLibrarySection,
    setActiveLibrarySection:s.setActiveLibrarySection,
    recentFiles:            s.recentFiles,
    sidebarSections:        s.sidebarSections,
    toggleSidebarSection:   s.toggleSidebarSection,
  })));

  const { isAtLeastLaptop } = useBreakpoint();

  // Folder tree state
  const [rootDirs, setRootDirs]       = useState([]);
  const [loadingRoots, setLoadingRoots] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]     = useState(false);

  /* ── Folder search debounce ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!folderSearch.trim() || !currentPath) {
      setSearchResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchDirectories(folderSearch, currentPath);
        if (active) setSearchResults(results);
      } catch (e) {
        console.error('Directory search failed', e);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [folderSearch, currentPath]);

  /* ── Root directories fetch ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentPath) { setRootDirs([]); return; }
    let active = true;
    const fetchRoots = async () => {
      setLoadingRoots(prev => prev || rootDirs.length === 0);
      try {
        const dirs = await getDirectories(currentPath);
        if (active) setRootDirs(dirs);
      } catch (e) {
        console.error('Failed to fetch root directories', e);
      } finally {
        if (active) setLoadingRoots(false);
      }
    };
    fetchRoots();
    return () => { active = false; };
  }, [currentPath, scanCompletedAt, directoriesDiscovered]);

  if (scanStatus === 'idle') return null;

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  const handleSelectLocation = (session) => {
    startScanAction(session.path, session.selectedExtensions || []);
  };

  const handleDeleteLocation = (session) => {
    deleteHistory(session.path);
  };

  const totalFilesCount = (scanStatus === 'scanning' ? indexedCount : totalFiles) || 0;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <aside className={`
      flex-shrink-0 border-r border-surface-800 bg-surface-950 flex flex-col h-full
      transition-all duration-300 ease-out
      ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-r-0'}
      ${!isAtLeastLaptop ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
    `}>

      {/* ── Sidebar header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-surface-600" />
          <p className="text-[11px] text-surface-500 font-semibold uppercase tracking-widest truncate max-w-[140px]" title={currentPath}>
            {currentPath.split(/[/\\]/).filter(Boolean).pop() || currentPath}
          </p>
        </div>
        {!isAtLeastLaptop && (
          <button onClick={toggleSidebar} className="p-1 text-surface-500 hover:text-surface-300 rounded-md">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0">

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1 — LOCATIONS
            ════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          label="Locations"
          expanded={sidebarSections.locations}
          onToggle={() => toggleSidebarSection('locations')}
        />

        {sidebarSections.locations && (
          <div className="space-y-0.5 mb-2">
            {!history || history.length === 0 ? (
              <p className="text-[11px] text-surface-700 px-3 py-1">No recent locations</p>
            ) : (
              history.map(session => (
                <LocationItem
                  key={session.id}
                  session={session}
                  isCurrent={currentPath === session.path}
                  onSelect={handleSelectLocation}
                  onDelete={handleDeleteLocation}
                />
              ))
            )}
          </div>
        )}

        <div className="h-px bg-surface-800/40 mx-1 my-1" />

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2 — LIBRARY
            ════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          label="Library"
          expanded={sidebarSections.library}
          onToggle={() => toggleSidebarSection('library')}
        />

        {sidebarSections.library && (
          <div className="space-y-0.5 mb-2">
            {LIBRARY_ITEMS.map(item => {
              let badge = undefined;
              if (item.id === 'favorites') badge = totalFavoritesCount;
              if (item.id === 'all')       badge = totalFilesCount;
              if (item.id === 'recents')   badge = recentFiles.length || undefined;

              return (
                <LibraryItem
                  key={item.id}
                  item={item}
                  isActive={activeLibrarySection === item.id}
                  badge={badge}
                  onClick={() => {
                    setActiveLibrarySection(item.id);
                    // On mobile, close sidebar after selecting
                    if (!isAtLeastLaptop) toggleSidebar();
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="h-px bg-surface-800/40 mx-1 my-1" />

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3 — FOLDERS
            ════════════════════════════════════════════════════════════════ */}
        <SectionHeader
          label="Folders"
          expanded={sidebarSections.folders}
          onToggle={() => toggleSidebarSection('folders')}
          rightSlot={
            scanStatus === 'scanning' && directoriesDiscovered > 0 ? (
              <Tooltip content="Indexed Folders">
                <div className="flex items-center gap-1 text-surface-600">
                  <Folder size={10} />
                  <span className="text-[10px] tabular-nums font-medium">
                    {directoriesDiscovered.toLocaleString()}
                  </span>
                </div>
              </Tooltip>
            ) : null
          }
        />

        {sidebarSections.folders && (
          <>
            {/* Folder search */}
            <div className="px-1 mb-2 relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Search folders…"
                value={folderSearch}
                onChange={e => setFolderSearch(e.target.value)}
                className="w-full bg-surface-900 border border-surface-800 rounded-md py-1.5 pl-7 pr-3
                           text-xs text-surface-200 focus:outline-none focus:border-surface-700
                           placeholder:text-surface-600"
              />
            </div>

            {/* Tree */}
            <div className="min-w-0 flex flex-col space-y-0.5 pb-4">
              {folderSearch.trim() ? (
                <div className="space-y-0.5">
                  {searching ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 size={16} className="animate-spin text-surface-600" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(dir => (
                      <TreeNode
                        key={dir.path}
                        path={dir.path}
                        name={dir.name}
                        hasChildren={dir.hasChildren}
                        fileCount={dir.fileCount}
                        subdirCount={dir.subdirCount}
                        depth={0}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-surface-600 px-2 mt-2">No matching folders</p>
                  )}
                </div>
              ) : loadingRoots ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 size={16} className="animate-spin text-surface-600" />
                </div>
              ) : rootDirs.length > 0 ? (
                <TreeNode
                  path={currentPath}
                  name={currentPath.split(/[/\\]/).filter(Boolean).pop() || currentPath}
                  hasChildren={true}
                  depth={0}
                  defaultExpanded={true}
                  isRootNode={true}
                />
              ) : (
                <p className="text-xs text-surface-600 px-2 mt-2">
                  {scanStatus === 'scanning' ? 'Discovering folders…' : 'No subfolders found'}
                </p>
              )}
            </div>
          </>
        )}

      </div>
    </aside>
  );
};

export default FolderTree;
