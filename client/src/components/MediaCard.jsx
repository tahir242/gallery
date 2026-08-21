import { useState, useCallback, memo } from 'react';
import { getMediaUrl } from '../services/api';
import useGalleryStore from '../store/galleryStore';
import { Film, Music, Play, FileText, Heart } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import PdfThumbnail from './PdfThumbnail';
import VideoThumbnail from './VideoThumbnail';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ── Shared keyboard handler for div-as-button ───────────────────────────────── */
const onCardKey = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
};

/* ── Placeholder for non-image types ───────────────────────────────────────── */
const TypePlaceholder = ({ file }) => {
  if (file.type === 'video') {
    return <VideoThumbnail src={getMediaUrl(file.path)} name={file.name} />;
  }
  if (file.type === 'audio') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 bg-surface-900 py-8 w-full">
        <Music size={26} className="text-accent-500/50" />
        <span className="text-[10px] text-surface-700 uppercase font-bold tracking-wider">{file.ext}</span>
      </div>
    );
  }
  if (file.type === 'document' && file.ext === 'pdf') {
    return <PdfThumbnail src={getMediaUrl(file.path)} name={file.name} />;
  }
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 bg-surface-900 py-8 w-full">
      <FileText size={22} className="text-surface-700" />
      <span className="text-[10px] text-surface-700 uppercase font-bold tracking-wider">{file.ext}</span>
    </div>
  );
};

/* ── Favorite button ────────────────────────────────────────────────────────── */
// Standalone <button> so it is never nested inside another interactive element.
const FavBtn = ({ isFav, onFav }) => (
  <button
    type="button"
    onClick={onFav}
    className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all duration-150
      ${isFav
        ? 'bg-red-500/80 text-white'
        : 'bg-black/40 backdrop-blur-sm text-white/70 hover:text-red-400 hover:bg-black/60'
      }`}
    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
  >
    <Heart size={12} fill={isFav ? 'currentColor' : 'none'} strokeWidth={2} />
  </button>
);

/* ── MasonryCard — natural aspect ratio, no card border ────────────────────── */
export const MasonryCard = memo(({ file, eagerLoad = false }) => {
  const setSelectedFile = useGalleryStore(s => s.setSelectedFile);
  const toggleFavorite = useGalleryStore(s => s.toggleFavorite);
  const isFav = useGalleryStore(s => s.favorites.has(file.path));
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const mediaUrl = getMediaUrl(file.path);

  const handleClick = useCallback(() => setSelectedFile(file), [file, setSelectedFile]);
  const handleFav = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(file.path);
  }, [file.path, toggleFavorite]);

  const isImage = file.type === 'image' && !imgError;

  return (
    // div role="button" avoids the nested-button HTML violation
    // (FavBtn is a real <button> inside; two <button>s cannot nest)
    <div
      id={`media-card-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={onCardKey(handleClick)}
      className="media-tile group w-full text-left focus-visible:ring-2 focus-visible:ring-accent-400 cursor-pointer"
      aria-label={`Open ${file.name}`}
    >
      {isImage ? (
        <div className="relative w-full">
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton rounded-[8px]" style={{ minHeight: '80px' }} />
          )}
          <img
            src={mediaUrl}
            alt={file.name}
            className={`tile-img rounded-[8px] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            // eagerLoad: disable lazy loading so all masonry columns load in
            // parallel when items are rendered, eliminating the DOM-order delay
            // where column 0 loads before column 1, column 1 before column 2, etc.
            loading={eagerLoad ? 'eager' : 'lazy'}
            draggable={false}
          />
          <div className="tile-overlay rounded-[8px]" />
          <div className="tile-overlay-top rounded-[8px]" />

          {/* Fav button — real <button>, valid here since outer is a div */}
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FavBtn isFav={isFav} onFav={handleFav} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <p className="text-white text-[11px] font-semibold truncate leading-tight drop-shadow">{file.name}</p>
            {file.size > 0 && (
              <p className="text-white/60 text-[10px] mt-0.5">{formatSize(file.size)}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-[8px] overflow-hidden">
          <TypePlaceholder file={file} />
          <div className="tile-overlay rounded-[8px]" />
          <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <p className="text-white text-[11px] font-semibold truncate">{file.name}</p>
          </div>
          <div className="absolute top-1.5 left-1.5">
            <span className="badge-type uppercase">{file.type}</span>
          </div>
          
          <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FavBtn isFav={isFav} onFav={handleFav} />
          </div>
        </div>
      )}
    </div>
  );
});

/* ── MediaCard — uniform grid variant (4:3 aspect ratio) ───────────────────── */
const MediaCard = memo(({ file }) => {
  const setSelectedFile = useGalleryStore(s => s.setSelectedFile);
  const toggleFavorite = useGalleryStore(s => s.toggleFavorite);
  const isFav = useGalleryStore(s => s.favorites.has(file.path));
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const mediaUrl = getMediaUrl(file.path);

  const handleClick = useCallback(() => setSelectedFile(file), [file, setSelectedFile]);
  const handleFav = useCallback((e) => {
    e.stopPropagation();
    toggleFavorite(file.path);
  }, [file.path, toggleFavorite]);

  const isImage = file.type === 'image' && !imgError;

  return (
    <div
      id={`media-card-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={onCardKey(handleClick)}
      className="grid-card group text-left focus-visible:ring-2 focus-visible:ring-accent-400 cursor-pointer"
      aria-label={`Open ${file.name}`}
    >
      <div className="relative w-full h-full">
        {isImage ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={mediaUrl}
              alt={file.name}
              className={`tile-img w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              loading="lazy"
              draggable={false}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypePlaceholder file={file} />
          </div>
        )}

        <div className="tile-overlay" />

        {file.type !== 'image' && (
          <div className="absolute top-2 left-2">
            <span className="badge-type uppercase">{file.type}</span>
          </div>
        )}

        {/* Fav button — valid <button> since outer element is a div */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <FavBtn isFav={isFav} onFav={handleFav} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-white text-[11px] font-semibold truncate">{file.name}</p>
          {file.size > 0 && <p className="text-white/60 text-[10px] mt-0.5">{formatSize(file.size)}</p>}
        </div>
      </div>
    </div>
  );
});

export default MediaCard;
