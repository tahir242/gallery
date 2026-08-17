import { useState, useCallback, useEffect } from 'react';
import { ChevronRight, Folder, FolderOpen, HardDrive, X, Files, Loader2, Heart, Search, FileText } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import { Tooltip } from './ui/Tooltip';
import useBreakpoint from '../hooks/useBreakpoint';
import { getDirectories, searchDirectories } from '../services/api';

/* ─── Tree Node ─────────────────────────────────────────────────────────────── */
const TreeNode = ({ path: nodePath, name, hasChildren, fileCount = 0, subdirCount = 0, depth = 0, defaultExpanded = false }) => {
  const { selectedFolder, setSelectedFolder, scanCompletedAt, directoriesDiscovered } = useGalleryStore();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  const isSelected = selectedFolder === nodePath;
  const isRoot = depth === 0;

  const fetchChildren = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const dirs = await getDirectories(nodePath);
      setChildren(dirs);
    } catch (e) {
      console.error("Failed to load subdirectories", e);
    } finally {
      if (!silent) setLoading(false);
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
      fetchChildren(children !== null);
    }
  }, [scanCompletedAt, directoriesDiscovered, expanded, hasChildren, fetchChildren]);

  return (
    <div className="w-full">
      <button
        id={`folder-${nodePath.replace(/[^a-zA-Z0-9]/g, '-')}`}
        onClick={toggle}
        className={`
          w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm
          transition-colors duration-150 group text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-500
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

          {isRoot ? (
            <HardDrive size={14} className="flex-shrink-0 text-accent-400/80 group-hover:text-accent-400 transition-colors" />
          ) : expanded && hasChildren ? (
            <FolderOpen size={14} className="flex-shrink-0 text-accent-400/80 group-hover:text-accent-400 transition-colors" />
          ) : (
            <Folder size={14} className="flex-shrink-0 text-accent-400/80 group-hover:text-accent-400 transition-colors" />
          )}
        </div>

        <span className="whitespace-nowrap font-medium text-xs">{name}</span>
        
        {!isRoot && (
          <div className="flex items-center gap-2 ml-auto pl-3 opacity-40 group-hover:opacity-100 transition-opacity">
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
          {children.map((child) => (
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

/* ─── FolderTree ────────────────────────────────────────────────────────────── */
const FolderTree = () => {
  const { scanStatus, scanCompletedAt, selectedFolder, setSelectedFolder, sidebarOpen, toggleSidebar, currentPath, indexedCount, totalFiles, showFavorites, setShowFavorites, totalFavoritesCount, directoriesDiscovered } = useGalleryStore();
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
      // Don't show loading spinner if we already have roots
      setLoadingRoots((prev) => prev || rootDirs.length === 0);
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
  }, [currentPath, scanCompletedAt, directoriesDiscovered]);

  if (scanStatus === 'idle') return null;

  return (
    <aside className={`
      flex-shrink-0 border-r border-surface-800 bg-surface-950 flex flex-col h-full
      transition-all duration-300 ease-out
      ${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-r-0'}
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
            <div className="ml-auto flex items-center gap-2">
              <Tooltip content="Total Folders">
                <div className="flex items-center gap-1 text-surface-500">
                  <Folder size={10} />
                  <span className="text-[10px] tabular-nums font-medium">{directoriesDiscovered.toLocaleString()}</span>
                </div>
              </Tooltip>
              <Tooltip content="Total Files">
                <div className="flex items-center gap-1 text-surface-500">
                  <FileText size={10} />
                  <span className="text-[10px] tabular-nums font-medium">{((scanStatus === 'scanning' ? indexedCount : totalFiles) || 0).toLocaleString()}</span>
                </div>
              </Tooltip>
            </div>
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
        
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs text-surface-600 font-medium uppercase tracking-wider">
            Folders
          </p>
          {scanStatus === 'scanning' && directoriesDiscovered > 0 && (
            <Tooltip content="Indexed Folders">
              <div className="flex items-center gap-1 text-surface-500">
                <Folder size={10} />
                <span className="text-[10px] tabular-nums font-medium">
                  {directoriesDiscovered.toLocaleString()}
                </span>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-4">
        <div className="min-w-max flex flex-col space-y-0.5 pr-2">
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
                    <Folder size={14} className="flex-shrink-0 text-accent-400/80" />
                    <span className="whitespace-nowrap flex-1 font-medium text-xs">{dir.name}</span>
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
      </div>
    </aside>
  );
};

export default FolderTree;
