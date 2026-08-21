import { useEffect, useRef, useCallback, memo, useState } from 'react';
import {
  LayoutGrid, List, Image as ImageIcon, Loader2,
  Columns3, ChevronDown,
} from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import MediaCard, { MasonryCard } from './MediaCard';
import Masonry from 'react-masonry-css';
import { Tooltip } from './ui/Tooltip';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useShallow } from 'zustand/react/shallow';

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── List row ──────────────────────────────────────────────────────────────── */
const ListRow = memo(({ file }) => {
  const setSelectedFile = useGalleryStore(s => s.setSelectedFile);
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
});

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

/* ─── Masonry breakpoints ───────────────────────────────────────────────────── */
const breakpointColumnsObj = {
  default: 7,
  1920: 6,
  1536: 5,
  1280: 4,
  1024: 3,
  640: 2,
};

/* ─── Masonry View ──────────────────────────────────────────────────────────── */
//
// Root causes of the "delayed column loading" bug (now fixed):
//
// 1. loading="lazy" on <img> inside overflow-y-auto: The browser loads images
//    in DOM order within each scroll container. react-masonry-css places
//    column 0's items first in the DOM, then column 1's, then column 2's.
//    The browser gives lower priority to later columns, so column N images
//    load noticeably later than column 0 images at the same scroll position.
//
//    FIX: Remove loading="lazy" from MasonryCard images. The items themselves
//    only appear in the DOM once fetched (via infinite scroll), so we want
//    them to load immediately when rendered. Lazy loading is handled at the
//    item level (infinite scroll / IntersectionObserver), not image level.
//    The MasonryCard now receives an `eagerLoad` prop that switches off lazy.
//
// 2. Sentinel IntersectionObserver has no `root`: Without a root, the
//    observer uses the document viewport. The rootMargin: '300px' expands
//    the VIEWPORT rectangle. But because the scroll container is
//    overflow-y-auto, it clips the sentinel's visible rect. The effective
//    pre-fetch window is nearly zero — the sentinel fires only when the
//    tallest masonry column has almost fully scrolled through. New items
//    then appear almost exactly at the user's scroll position, with no
//    time for images to load before they're visible.
//
//    FIX: Pass the scroll container element as `root` to the observer.
//    With a proper root, rootMargin works correctly against the scroll
//    container's edge, giving a true 1200px pre-fetch window. New items
//    are fetched 1200px before the user reaches them, so their images
//    have time to fully load before they become visible.
//
const MasonryView = ({ files, hasMore, isLoadingMore, loadFiles, isRecents }) => {
  const scrollRef  = useRef(null);
  const sentinelRef = useRef(null);

  // Infinite scroll:
  // - root: scroll container → rootMargin is measured against container edge
  // - rootMargin: '1200px' → fetch new page 1200px before user reaches bottom
  //   This gives images plenty of time to load before they're visible.
  useEffect(() => {
    if (isRecents || !hasMore || isLoadingMore) return;
    const sentinel = sentinelRef.current;
    const scrollEl = scrollRef.current;
    if (!sentinel || !scrollEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadFiles();
      },
      {
        root: scrollEl,          // ← correct root: the scroll container
        rootMargin: '0px 0px 1200px 0px', // ← pre-fetch 1200px before bottom
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadFiles, isRecents]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-3 sm:p-4">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="masonry-grid pb-8"
          columnClassName="masonry-grid_column"
        >
          {files.map((file, index) => (
            <div key={`${file.path}-${index}`} className="masonry-item">
              {/* eagerLoad=true disables loading="lazy" on the image so all
                  columns load in parallel at the same time instead of in
                  DOM order (column 0 first, column N last). */}
              <MasonryCard file={file} eagerLoad />
            </div>
          ))}
        </Masonry>

        {/* Sentinel for infinite scroll */}
        {!isRecents && (
          <div ref={sentinelRef} className="h-1 w-full" />
        )}

        {isLoadingMore && !isRecents && (
          <div className="flex justify-center items-center py-8 gap-2">
            <Loader2 className="animate-spin text-surface-600" size={18} />
            <span className="text-surface-600 text-xs">Loading more…</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Column count (for grid / list virtualizer) ────────────────────────────── */
const useColumnCount = (containerWidth, viewMode) => {
  if (viewMode === 'list') return 1;
  if (containerWidth >= 1536) return 6;
  if (containerWidth >= 1024) return 5;
  if (containerWidth >= 768)  return 4;
  if (containerWidth >= 480)  return 3;
  return 2;
};

/* ─── Virtualised Grid / List ───────────────────────────────────────────────── */
const VirtualizedGrid = memo(({ files, viewMode, hasMore, isLoadingMore, loadFiles, isRecents }) => {
  const scrollRef    = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isList   = viewMode === 'list';
  const columns  = useColumnCount(containerWidth, viewMode);

  const rows = isList
    ? files.map(f => [f])
    : files.reduce((acc, file, i) => {
        const ri = Math.floor(i / columns);
        if (!acc[ri]) acc[ri] = [];
        acc[ri].push(file);
        return acc;
      }, []);

  const estimateSize = useCallback(
    () => isList ? 44 : 200,
    [isList]
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: 3,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    if (isRecents || !hasMore || isLoadingMore) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= rows.length - 5) loadFiles();
  }, [virtualItems, rows.length, hasMore, isLoadingMore, loadFiles, isRecents]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-3 sm:p-4">
        {isList && files.length > 0 && (
          <>
            <div className="flex items-center gap-3 sm:gap-4 px-3 py-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 w-9 flex-shrink-0">Type</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 flex-1">Name</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 hidden md:block w-48">Path</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-surface-700 w-16 text-right">Size</span>
            </div>
            <div className="h-px bg-surface-800/50 mb-1" />
          </>
        )}

        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualItems.map((virtualRow) => {
            const rowFiles = rows[virtualRow.index];
            if (!rowFiles) return null;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isList && (
                  <div className="pb-0.5">
                    <ListRow file={rowFiles[0]} />
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div
                    className="grid gap-2 sm:gap-3 pb-2"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {rowFiles.map((file, i) => (
                      <div key={`${file.path}-${i}`}>
                        <MediaCard file={file} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isLoadingMore && !isRecents && (
          <div className="flex justify-center items-center py-8 gap-2">
            <Loader2 className="animate-spin text-surface-600" size={18} />
            <span className="text-surface-600 text-xs">Loading more…</span>
          </div>
        )}

        {files.length > 0 && <div className="h-8" />}
      </div>
    </div>
  );
});

/* ─── MediaGrid ─────────────────────────────────────────────────────────────── */
const MediaGrid = () => {
  const {
    files, viewMode, setViewMode, searchQuery, selectedFolder,
    selectedFileType, setSelectedFileType, availableFileTypes,
    totalMatches, hasMore, isLoadingMore, filesError, loadFiles,
    sortField, sortOrder, setSort, scanStatus,
    activeLibrarySection, recentFiles,
  } = useGalleryStore(useShallow(s => ({
    files: s.files,
    viewMode: s.viewMode,
    setViewMode: s.setViewMode,
    searchQuery: s.searchQuery,
    selectedFolder: s.selectedFolder,
    selectedFileType: s.selectedFileType,
    setSelectedFileType: s.setSelectedFileType,
    availableFileTypes: s.availableFileTypes,
    totalMatches: s.totalMatches,
    hasMore: s.hasMore,
    isLoadingMore: s.isLoadingMore,
    filesError: s.filesError,
    loadFiles: s.loadFiles,
    sortField: s.sortField,
    sortOrder: s.sortOrder,
    setSort: s.setSort,
    scanStatus: s.scanStatus,
    activeLibrarySection: s.activeLibrarySection,
    recentFiles: s.recentFiles,
  })));

  const isRecents    = activeLibrarySection === 'recents';
  const displayFiles = isRecents ? recentFiles : files;

  const CATEGORY_EXTS = {
    image:    new Set(['jpg','jpeg','png','gif','webp','bmp','tiff','tif','svg','heic','heif','avif','ico']),
    video:    new Set(['mp4','mkv','avi','mov','wmv','flv','webm','m4v','mpg','mpeg','3gp']),
    audio:    new Set(['mp3','wav','flac','aac','ogg','m4a','wma']),
    document: new Set(['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','csv']),
  };

  const filteredFileTypes = (() => {
    const categorySet = CATEGORY_EXTS[activeLibrarySection];
    if (!categorySet) return availableFileTypes;
    return availableFileTypes.filter(({ extension }) => categorySet.has(extension));
  })();

  useEffect(() => {
    if (selectedFileType && !filteredFileTypes.some(ft => ft.extension === selectedFileType)) {
      setSelectedFileType('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLibrarySection]);

  const statusLabel = (() => {
    if (isRecents) return (
      <><span className="text-surface-400 font-semibold tabular-nums">{displayFiles.length}</span> recently opened</>
    );
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

        <div className="flex-1 min-w-0 text-[12px] text-surface-600 truncate">
          {statusLabel}
          {scanStatus === 'scanning' && (
            <span className="ml-2 inline-flex items-center gap-1 text-accent-500">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse-dot" />
              Indexing…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">

          {!isRecents && filteredFileTypes.length > 0 && (
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
                {filteredFileTypes.map(({ extension, count }) => (
                  <option key={extension} value={extension}>
                    {extension.toUpperCase()} ({count})
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-surface-600 pointer-events-none" />
            </div>
          )}

          {!isRecents && (
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
          )}

          <div className="flex items-center gap-0.5 p-1 rounded-[6px] border border-surface-800 bg-surface-900/80">
            <ViewBtn mode="masonry" current={viewMode} icon={Columns3}   label="Masonry view" onClick={setViewMode} />
            <ViewBtn mode="grid"    current={viewMode} icon={LayoutGrid}  label="Grid view"    onClick={setViewMode} />
            <ViewBtn mode="list"    current={viewMode} icon={List}        label="List view"    onClick={setViewMode} />
          </div>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {filesError && !isRecents && (
        <div role="alert" className="mx-4 mt-3 rounded-card border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400 flex-shrink-0">
          {filesError}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {displayFiles.length === 0 && !isLoadingMore && !filesError && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-surface-900 border border-surface-800 flex items-center justify-center mb-4">
            <ImageIcon size={24} className="text-surface-700" />
          </div>
          <p className="text-surface-400 font-medium text-sm">
            {isRecents ? 'No recently opened files' : 'No media files found'}
          </p>
          <p className="text-surface-700 text-xs mt-1">
            {isRecents
              ? 'Open files in the gallery to see them here'
              : searchQuery || selectedFileType
                ? 'Try a different filter or search term'
                : 'This folder contains no media files'}
          </p>
        </div>
      )}

      {/* ── Masonry: react-masonry-css preserves natural stagger layout ──────── */}
      {displayFiles.length > 0 && viewMode === 'masonry' && (
        <MasonryView
          files={displayFiles}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadFiles={loadFiles}
          isRecents={isRecents}
        />
      )}

      {/* ── Grid / List: row virtualizer for memory efficiency ───────────────── */}
      {displayFiles.length > 0 && (viewMode === 'grid' || viewMode === 'list') && (
        <VirtualizedGrid
          files={displayFiles}
          viewMode={viewMode}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          loadFiles={loadFiles}
          isRecents={isRecents}
        />
      )}

      {isLoadingMore && displayFiles.length === 0 && (
        <div className="flex-1 flex justify-center items-center gap-2">
          <Loader2 className="animate-spin text-surface-600" size={18} />
          <span className="text-surface-600 text-xs">Loading…</span>
        </div>
      )}
    </div>
  );
};

export default MediaGrid;
