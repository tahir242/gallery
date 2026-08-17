import { useEffect, useRef, useCallback } from 'react';
import {
  LayoutGrid, List, Image as ImageIcon, Loader2,
  Columns3, ChevronDown,
} from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import MediaCard, { MasonryCard } from './MediaCard';
import Masonry from 'react-masonry-css';
import { Tooltip } from './ui/Tooltip';

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── List row ──────────────────────────────────────────────────────────────── */
const ListRow = ({ file }) => {
  const { setSelectedFile } = useGalleryStore();
  const TYPE_COLOR = {
    image:    'text-emerald-400',
    video:    'text-blue-400',
    audio:    'text-purple-400',
    document: 'text-orange-400',
  };

  return (
    <button
      id={`list-row-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
      onClick={() => setSelectedFile(file)}
      className="flex items-center gap-3 sm:gap-4 w-full px-3 py-2.5 rounded-[7px]
                 text-left hover:bg-surface-900/80 transition-colors duration-100 group"
    >
      <span className={`text-[11px] font-mono font-bold uppercase w-9 flex-shrink-0 ${TYPE_COLOR[file.type] || 'text-surface-600'}`}>
        {file.ext}
      </span>
      <span className="flex-1 text-[13px] text-surface-300 truncate group-hover:text-surface-100 transition-colors">
        {file.name}
      </span>
      <Tooltip content={file.directory}>
        <span className="text-[11px] text-surface-700 hidden md:block truncate max-w-[200px] xl:max-w-xs">
          {file.directory}
        </span>
      </Tooltip>
      <span className="text-[11px] text-surface-600 flex-shrink-0 w-16 text-right tabular-nums">
        {formatSize(file.size)}
      </span>
    </button>
  );
};

/* ─── View mode button ──────────────────────────────────────────────────────── */
const ViewBtn = ({ mode, current, icon: Icon, label, onClick }) => (
  <Tooltip content={label}>
    <button
      id={`view-${mode}`}
      onClick={() => onClick(mode)}
      className={`p-1.5 rounded-[5px] transition-colors duration-100 ${
        current === mode
          ? 'bg-accent-600 text-white'
          : 'text-surface-600 hover:text-surface-300'
      }`}
      aria-label={label}
    >
      <Icon size={14} />
    </button>
  </Tooltip>
);

/* ─── MediaGrid ─────────────────────────────────────────────────────────────── */
const breakpointColumnsObj = {
  default: 7,
  1920: 6,
  1536: 5,
  1280: 4,
  1024: 3,
  640: 2
};

const MediaGrid = () => {
  const {
    files,
    viewMode, setViewMode,
    searchQuery,
    selectedFolder,
    selectedFileType, setSelectedFileType,
    availableFileTypes,
    totalMatches,
    hasMore,
    isLoadingMore,
    filesError,
    loadFiles,
    sortField,
    sortOrder,
    setSort,
    scanStatus,
  } = useGalleryStore();

  const observerRef = useRef();

  const lastElementRef = useCallback((node) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) loadFiles();
    }, { rootMargin: '200px' });
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMore, loadFiles]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  /* ── Status label ─────────────────────────────────────────────────────────── */
  const statusLabel = (() => {
    if (searchQuery) return (
      <>
        <span className="text-surface-400 font-semibold tabular-nums">{totalMatches.toLocaleString()}</span>
        {' results for '}
        <span className="text-accent-400">&ldquo;{searchQuery}&rdquo;</span>
      </>
    );
    if (selectedFolder) return (
      <><span className="text-surface-400 font-semibold tabular-nums">{totalMatches.toLocaleString()}</span> files in folder</>
    );
    return (
      <><span className="text-surface-400 font-semibold tabular-nums">{totalMatches.toLocaleString()}</span> media files</>
    );
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-800/60 flex-shrink-0 flex-wrap">

        {/* Status */}
        <div className="flex-1 min-w-0 text-[12px] text-surface-600 truncate">
          {statusLabel}
          {scanStatus === 'scanning' && (
            <span className="ml-2 inline-flex items-center gap-1 text-accent-500">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse-dot" />
              Indexing…
            </span>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">

          {/* File type filter */}
          {availableFileTypes.length > 0 && (
            <div className="relative">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                aria-label="Filter by file type"
                className="appearance-none h-7 pl-2.5 pr-6 rounded-[6px] border border-surface-800
                           bg-surface-900/80 text-[12px] font-medium text-surface-400
                           hover:text-surface-200 hover:border-surface-700
                           focus:outline-none focus:ring-1 focus:ring-accent-500/40
                           cursor-pointer transition-colors [&>option]:bg-surface-900"
              >
                <option value="">All types</option>
                {availableFileTypes.map(({ extension, count }) => (
                  <option key={extension} value={extension}>
                    {extension.toUpperCase()} ({count})
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
            </div>
          )}

          {/* Sort */}
          <div className="relative">
            <select
              value={`${sortField}-${sortOrder}`}
              aria-label="Sort media files"
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSort(field, order);
              }}
              className="appearance-none h-7 pl-2.5 pr-6 rounded-[6px] border border-surface-800
                         bg-surface-900/80 text-[12px] font-medium text-surface-400
                         hover:text-surface-200 hover:border-surface-700
                         focus:outline-none focus:ring-1 focus:ring-accent-500/40
                         cursor-pointer transition-colors [&>option]:bg-surface-900"
            >
              <option value="date-desc">Newest</option>
              <option value="date-asc">Oldest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="size-desc">Largest</option>
              <option value="size-asc">Smallest</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 p-1 rounded-[6px] border border-surface-800 bg-surface-900/80">
            <ViewBtn mode="masonry" current={viewMode} icon={Columns3}      label="Masonry view" onClick={setViewMode} />
            <ViewBtn mode="grid"    current={viewMode} icon={LayoutGrid}    label="Grid view"    onClick={setViewMode} />
            <ViewBtn mode="list"    current={viewMode} icon={List}          label="List view"    onClick={setViewMode} />
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 sm:p-4">

          {/* Error */}
          {filesError && (
            <div role="alert" className="mb-4 rounded-card border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400">
              {filesError}
            </div>
          )}

          {/* Empty state */}
          {files.length === 0 && !isLoadingMore && !filesError && (
            <div className="flex flex-col items-center justify-center text-center py-24 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-surface-900 border border-surface-800 flex items-center justify-center mb-4">
                <ImageIcon size={24} className="text-surface-700" />
              </div>
              <p className="text-surface-400 font-medium text-sm">No media files found</p>
              <p className="text-surface-700 text-xs mt-1">
                {searchQuery || selectedFileType
                  ? 'Try a different filter or search term'
                  : 'This folder contains no media files'}
              </p>
            </div>
          )}

          {/* ── Masonry layout ───────────────────────────────────────────────── */}
          {files.length > 0 && viewMode === 'masonry' && (
            <Masonry
              breakpointCols={breakpointColumnsObj}
              className="masonry-grid pb-8"
              columnClassName="masonry-grid_column"
            >
              {files.map((file, index) => (
                  <div
                    key={`${file.path}-${index}`}
                    className="masonry-item"
                  >
                    <MasonryCard file={file} />
                  </div>
              ))}
            </Masonry>
          )}

          {/* ── Uniform grid layout ──────────────────────────────────────────── */}
          {files.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 pb-8">
              {files.map((file, index) => (
                  <div key={`${file.path}-${index}`}>
                    <MediaCard file={file} />
                  </div>
              ))}
            </div>
          )}

          {/* ── List layout ──────────────────────────────────────────────────── */}
          {files.length > 0 && viewMode === 'list' && (
            <div className="flex flex-col pb-8">
              {/* Header row */}
              <div className="flex items-center gap-3 sm:gap-4 px-3 py-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 w-9 flex-shrink-0">Type</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 flex-1">Name</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 hidden md:block w-48">Path</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 w-16 text-right">Size</span>
              </div>
              <div className="h-px bg-surface-800/50 mb-1" />
              {files.map((file, index) => (
                  <div key={`${file.path}-${index}`}>
                    <ListRow file={file} />
                  </div>
              ))}
            </div>
          )}

          {/* Sentinel element for infinite scroll */}
          {files.length > 0 && hasMore && !isLoadingMore && (
            <div ref={lastElementRef} className="h-1 w-full" />
          )}

          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-8 gap-2">
              <Loader2 className="animate-spin text-surface-600" size={18} />
              <span className="text-surface-600 text-xs">Loading more…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaGrid;
