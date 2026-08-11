import { useEffect, useRef, useCallback } from 'react';
import { LayoutGrid, List, Image as ImageIcon, Loader2 } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import MediaCard from './MediaCard';

const MediaGrid = () => {
  const { 
    files, 
    viewMode, 
    setViewMode, 
    searchQuery, 
    selectedFolder, 
    totalMatches,
    hasMore,
    isLoadingMore,
    loadFiles,
    sortField,
    sortOrder,
    setSort
  } = useGalleryStore();

  const observer = useRef();

  const lastElementRef = useCallback((node) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadFiles();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadFiles]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-surface-500">
          {searchQuery ? (
            <span>
              Showing <span className="text-surface-300 font-medium">{totalMatches}</span> results
              {' '}for <span className="text-accent-400">"{searchQuery}"</span>
            </span>
          ) : selectedFolder ? (
            <span>
              <span className="text-surface-300 font-medium">{totalMatches}</span> files in folder
            </span>
          ) : (
            <span>
              <span className="text-surface-300 font-medium">{totalMatches}</span> media files
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center bg-surface-900 border border-surface-800 rounded-lg p-1 px-2">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSort(field, order);
              }}
              className="bg-transparent text-sm text-surface-300 hover:text-surface-100 focus:outline-none cursor-pointer [&>option]:bg-surface-900"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-lg p-1">
            <button
              id="view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-accent-600 text-white' : 'text-surface-500 hover:text-surface-300'}`}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              id="view-list"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-accent-600 text-white' : 'text-surface-500 hover:text-surface-300'}`}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {files.length === 0 && !isLoadingMore && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
            <ImageIcon size={28} className="text-surface-600" />
          </div>
          <p className="text-surface-400 font-medium">No media files found</p>
          <p className="text-surface-600 text-sm mt-1">
            {searchQuery ? 'Try a different search term' : 'This folder contains no media files'}
          </p>
        </div>
      )}

      {/* Grid layout */}
      {files.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
          {files.map((file, index) => {
            const isLast = index === files.length - 1;
            return (
              <div key={`${file.path}-${index}`} ref={isLast ? lastElementRef : null}>
                <MediaCard file={file} />
              </div>
            );
          })}
        </div>
      )}

      {/* List layout */}
      {files.length > 0 && viewMode === 'list' && (
        <div className="flex flex-col gap-1 pb-8">
          {files.map((file, index) => {
            const isLast = index === files.length - 1;
            return (
              <div key={`${file.path}-${index}`} ref={isLast ? lastElementRef : null}>
                <ListRow file={file} />
              </div>
            );
          })}
        </div>
      )}

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="animate-spin text-accent-500" size={24} />
          <span className="ml-2 text-surface-400 text-sm">Loading more files...</span>
        </div>
      )}
    </div>
  );
};

// ─── List row view ─────────────────────────────────────────────────────────────
const ListRow = ({ file }) => {
  const { setSelectedFile } = useGalleryStore();
  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeColor = {
    image: 'text-emerald-400',
    video: 'text-blue-400',
    audio: 'text-purple-400',
  };

  return (
    <button
      id={`list-row-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
      onClick={() => setSelectedFile(file)}
      className="flex items-center gap-4 px-4 py-3 rounded-lg border border-transparent
                 hover:border-surface-800 hover:bg-surface-900
                 transition-all duration-150 text-left group w-full"
    >
      <span className={`text-xs font-mono font-medium uppercase w-8 flex-shrink-0 ${typeColor[file.type] || 'text-surface-500'}`}>
        {file.ext}
      </span>
      <span className="flex-1 text-sm text-surface-200 truncate group-hover:text-white transition-colors">
        {file.name}
      </span>
      <span className="text-xs text-surface-600 hidden md:block truncate max-w-xs" title={file.directory}>
        {file.directory}
      </span>
      <span className="text-xs text-surface-500 flex-shrink-0 w-16 text-right">
        {formatSize(file.size)}
      </span>
    </button>
  );
};

export default MediaGrid;
