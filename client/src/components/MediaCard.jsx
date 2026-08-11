import { useState, useCallback } from 'react';
import { getMediaUrl } from '../services/api';
import useGalleryStore from '../store/galleryStore';
import { Film, Music, ImageOff, Play } from 'lucide-react';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaCard = ({ file }) => {
  const { setSelectedFile } = useGalleryStore();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const mediaUrl = getMediaUrl(file.path);

  const handleClick = useCallback(() => {
    setSelectedFile(file);
  }, [file, setSelectedFile]);

  const renderThumbnail = () => {
    if (file.type === 'image' && !imgError) {
      return (
        <>
          {!imgLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          <img
            src={mediaUrl}
            alt={file.name}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </>
      );
    }

    if (file.type === 'video') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-800">
          <div className="w-12 h-12 rounded-full bg-accent-600/20 border border-accent-500/30 flex items-center justify-center mb-2">
            <Play size={20} className="text-accent-400 ml-0.5" />
          </div>
          <Film size={16} className="text-surface-500" />
        </div>
      );
    }

    if (file.type === 'audio') {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-800">
          <Music size={28} className="text-accent-400/60 mb-1" />
        </div>
      );
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
        <ImageOff size={24} className="text-surface-600" />
      </div>
    );
  };

  return (
    <button
      id={`media-card-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`}
      onClick={handleClick}
      className="group relative block w-full rounded-xl overflow-hidden border border-surface-800
                 hover:border-accent-500/40 hover:shadow-card-hover
                 transition-all duration-200 animate-fade-in focus:outline-none
                 focus:ring-2 focus:ring-accent-500/50 bg-surface-900"
      style={{ aspectRatio: '4/3' }}
      title={file.name}
    >
      {/* Thumbnail area */}
      <div className="relative w-full h-full overflow-hidden">
        {renderThumbnail()}

        {/* Type badge */}
        {file.type !== 'image' && (
          <div className="absolute top-2 left-2">
            <span className="badge badge-accent text-xs">
              {file.type}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-surface-950/0 to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white text-xs font-medium truncate">{file.name}</p>
            {file.size > 0 && (
              <p className="text-surface-400 text-xs mt-0.5">{formatSize(file.size)}</p>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

export default MediaCard;
