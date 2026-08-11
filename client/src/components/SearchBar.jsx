import { useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';

const SearchBar = () => {
  const { searchQuery, setSearchQuery, getFilteredFiles, scanResult } = useGalleryStore();
  const inputRef = useRef(null);

  // Keyboard shortcut: Ctrl+K to focus
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const filteredCount = getFilteredFiles().length;

  return (
    <div className="relative flex items-center gap-3">
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none"
        />
        <input
          id="search-input"
          ref={inputRef}
          type="text"
          placeholder="Search files… (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-base pl-9 pr-10 py-2.5 text-sm"
        />
        {searchQuery && (
          <button
            id="search-clear"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Results count */}
      {scanResult && (
        <div className="flex-shrink-0 text-sm text-surface-500">
          <span className="text-surface-300 font-medium">{filteredCount}</span>
          {searchQuery && ` of ${scanResult.fileCount}`} files
        </div>
      )}
    </div>
  );
};

export default SearchBar;
