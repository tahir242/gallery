import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';

const SearchBar = () => {
  const { searchQuery, setSearchQuery, totalMatches, scanResult } = useGalleryStore();
  const inputRef = useRef(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);

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

  // Sync external search query changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (localQuery !== searchQuery) {
        setSearchQuery(localQuery);
      }
    }, 300); // 300ms debounce
    return () => clearTimeout(timeout);
  }, [localQuery, searchQuery, setSearchQuery]);

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
          placeholder="Search files and folders… (Ctrl+K)"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="input-base pl-9 pr-10 py-2.5 text-sm"
        />
        {localQuery && (
          <button
            id="search-clear"
            onClick={() => setLocalQuery('')}
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
          <span className="text-surface-300 font-medium">{totalMatches}</span>
          {searchQuery && ` of ${scanResult.totalFiles}`} files
        </div>
      )}
    </div>
  );
};

export default SearchBar;
