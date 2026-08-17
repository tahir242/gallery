import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Folder, FolderOpen, HardDrive, X, Files, Loader2, Heart, Search } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import useBreakpoint from '../hooks/useBreakpoint';
import { getDirectories, searchDirectories } from '../services/api';

/* ─── Tree Node ─────────────────────────────────────────────────────────────── */
const TreeNode = ({ path: nodePath, name, hasChildren, depth = 0, defaultExpanded = false }) => {
  const { selectedFolder, setSelectedFolder, scanCompletedAt } = useGalleryStore();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSelected = selectedFolder === nodePath;
  const isRoot = depth === 0;

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    try {
      const dirs = await getDirectories(nodePath);
      setChildren(dirs);
    } catch (e) {
      console.error("Failed to load subdirectories", e);
    } finally {
      setLoading(false);
    }
  }, [nodePath]);

  const toggle = useCallback(async (e) => {
    if (e) e.stopPropagation();
    if (!isSelected) {
       setSelectedFolder(nodePath);
    } else {
       setSelectedFolder(null); // toggle off
    }

    if (hasChildren) {
      if (!expanded && !children) {
        fetchChildren();
      }
      setExpanded((x) => !x);
    }
  }, [isSelected, nodePath, hasChildren, expanded, children, fetchChildren, setSelectedFolder]);

  useEffect(() => {
    if (defaultExpanded && hasChildren && !children && !loading) {
      fetchChildren();
      setExpanded(true);
    }
  }, [defaultExpanded, hasChildren, children, loading, fetchChildren]);

  useEffect(() => {
    if (expanded && hasChildren) {
      fetchChildren();
    }
  }, [scanCompletedAt, expanded, hasChildren, fetchChildren]);

  return (
    <div className="select-none">
      <button
        id={`folder-${nodePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
        onClick={toggle}
        className={`
          w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm
          transition-all duration-150 group text-left
          ${isSelected
            ? 'bg-accent-500/15 text-accent-300'
            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
          }
        `}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            size={13}
            className={`flex-shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {isRoot ? (
          <HardDrive size={14} className="flex-shrink-0" />
        ) : expanded && hasChildren ? (
          <FolderOpen size={14} className="flex-shrink-0" />
        ) : (
          <Folder size={14} className="flex-shrink-0" />
        )}

        <span className="truncate flex-1 font-medium text-xs">{name}</span>
        
        {loading && <Loader2 size={12} className="animate-spin text-surface-500" />}
      </button>

      {hasChildren && expanded && children && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              path={child.path}
              name={child.name}
              hasChildren={child.hasChildren}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── FolderTree ────────────────────────────────────────────────────────────── */
const FolderTree = () => {
  const { scanStatus, scanCompletedAt, selectedFolder, setSelectedFolder, sidebarOpen, toggleSidebar, currentPath, indexedCount, totalFiles, showFavorites, setShowFavorites, totalFavoritesCount } = useGalleryStore();
  const { isAtLeastLaptop } = useBreakpoint();
  const [rootDirs, setRootDirs] = useState([]);
  const [loadingRoots, setLoadingRoots] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim() || !currentPath) {
      setSearchResults([]);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchDirectories(searchQuery, currentPath);
        if (active) setSearchResults(results);
      } catch (e) {
        console.error("Directory search failed", e);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentPath]);

  useEffect(() => {
    if (!currentPath) {
      setRootDirs([]);
      return;
    }

    let active = true;
    const fetchRoots = async () => {
      setLoadingRoots(true);
      try {
        const dirs = await getDirectories(currentPath);
        if (active) setRootDirs(dirs);
      } catch (e) {
        console.error("Failed to fetch root directories", e);
      } finally {
        if (active) setLoadingRoots(false);
      }
    };
    fetchRoots();
    return () => { active = false; };
  }, [currentPath, scanCompletedAt]);

  if (scanStatus === 'idle') return null;

  return (
    <aside className={`
      flex-shrink-0 border-r border-surface-800 bg-surface-950 flex flex-col h-full
      transition-all duration-300 ease-out
      ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-r-0'}
      ${!isAtLeastLaptop ? 'fixed inset-y-0 left-0 z-40' : 'relative'}
    `}>
      <div className="p-3 pb-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-surface-600 font-medium uppercase tracking-wider px-2">
            Library
          </p>
          {!isAtLeastLaptop && (
            <button onClick={toggleSidebar} className="p-1 text-surface-500 hover:text-surface-300 rounded-md">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-1">
          <button
            id="folder-all"
            onClick={() => {
              setSelectedFolder('all');
              setShowFavorites(false);
            }}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-card text-sm font-medium mb-1
              transition-colors duration-100
              ${selectedFolder === 'all' && !showFavorites
                ? 'bg-accent-500/12 text-accent-400'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
              }
            `}
          >
            <Files size={13} className="flex-shrink-0" />
            <span>All Files</span>
            <span className="ml-auto text-[11px] tabular-nums text-surface-600">
              {((scanStatus === 'scanning' ? indexedCount : totalFiles) || 0).toLocaleString()}
            </span>
          </button>

          <button
            id="folder-favorites"
            onClick={() => {
              setSelectedFolder('all');
              setShowFavorites(true);
            }}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-card text-sm font-medium mb-3
              transition-colors duration-100
              ${selectedFolder === 'all' && showFavorites
                ? 'bg-pink-500/12 text-pink-500'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
              }
            `}
          >
            <Heart size={13} className="flex-shrink-0" />
            <span>Favorites</span>
            <span className="ml-auto text-[11px] tabular-nums text-surface-600">
              {totalFavoritesCount.toLocaleString()}
            </span>
          </button>
        </div>

        <div className="px-2 mt-3 mb-2 relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500" />
          <input 
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-900 border border-surface-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-surface-200 focus:outline-none focus:border-surface-700 placeholder:text-surface-600"
          />
        </div>

        <div className="h-px bg-surface-800/50 mb-3 mx-2" />
        
        <p className="text-xs text-surface-600 font-medium uppercase tracking-wider px-2 mb-2">
          Folders
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {searchQuery.trim() ? (
          <div className="space-y-0.5">
            {searching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={16} className="animate-spin text-surface-600" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(dir => (
                <button
                  key={dir.path}
                  onClick={() => setSelectedFolder(dir.path)}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm
                    transition-colors duration-150 text-left
                    ${selectedFolder === dir.path
                      ? 'bg-accent-500/15 text-accent-300'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                    }
                  `}
                >
                  <Folder size={14} className="flex-shrink-0" />
                  <span className="truncate flex-1 font-medium text-xs">{dir.name}</span>
                </button>
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
          />
        ) : (
          <p className="text-xs text-surface-600 px-2 mt-2">
            {scanStatus === 'scanning' ? 'Discovering folders...' : 'No subfolders found'}
          </p>
        )}
      </div>
    </aside>
  );
};

export default FolderTree;
