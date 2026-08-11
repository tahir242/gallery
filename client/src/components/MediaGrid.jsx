import { useMemo } from 'react';
import { LayoutGrid, List, Image as ImageIcon } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import MediaCard from './MediaCard';

const ITEMS_PER_PAGE = 100;

const MediaGrid = () => {
  const { getFilteredFiles, viewMode, setViewMode, searchQuery, selectedFolder, scanResult } = useGalleryStore();

  const files = useMemo(() => getFilteredFiles(), [
    getFilteredFiles,
    searchQuery,
    selectedFolder,
    scanResult,
  ]);

  // Show first N items (TODO: add pagination/virtual scroll)
  const displayed = files.slice(0, ITEMS_PER_PAGE);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-surface-500">
          {searchQuery ? (
            <span>
              Showing <span className="text-surface-300 font-medium">{files.length}</span> results
              {' '}for <span className="text-accent-400">"{searchQuery}"</span>
            </span>
          ) : selectedFolder ? (
            <span>
              <span className="text-surface-300 font-medium">{files.length}</span> files in folder
            </span>
          ) : (
            <span>
              <span className="text-surface-300 font-medium">{files.length}</span> media files
            </span>
          )}
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

      {/* Empty state */}
      {files.length === 0 && (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayed.map((file) => (
            <MediaCard key={file.path} file={file} />
          ))}
        </div>
      )}

      {/* List layout */}
      {files.length > 0 && viewMode === 'list' && (
        <div className="flex flex-col gap-1">
          {displayed.map((file) => (
            <ListRow key={file.path} file={file} />
          ))}
        </div>
      )}

      {/* More items notice */}
      {files.length > ITEMS_PER_PAGE && (
        <p className="text-center text-surface-600 text-sm mt-6">
          Showing {ITEMS_PER_PAGE} of {files.length} files
        </p>
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
      <span className="text-xs text-surface-600 hidden md:block truncate max-w-xs">
        {file.directory}
      </span>
      <span className="text-xs text-surface-500 flex-shrink-0 w-16 text-right">
        {formatSize(file.size)}
      </span>
    </button>
  );
};

export default MediaGrid;
