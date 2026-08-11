import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Info } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import { getMediaUrl } from '../services/api';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LightBox = () => {
  const { selectedFile, setSelectedFile, files } = useGalleryStore();

  const currentIndex = files.findIndex((f) => f.path === selectedFile?.path);

  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) {
      setSelectedFile(files[currentIndex + 1]);
    }
  }, [currentIndex, files, setSelectedFile]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedFile(files[currentIndex - 1]);
    }
  }, [currentIndex, files, setSelectedFile]);

  const close = useCallback(() => setSelectedFile(null), [setSelectedFile]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedFile) return;
    const handler = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedFile, goNext, goPrev, close]);

  if (!selectedFile) return null;

  const mediaUrl = getMediaUrl(selectedFile.path);

  return (
    <div
      id="lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {/* Close */}
      <button
        id="lightbox-close"
        onClick={close}
        className="absolute top-4 right-4 btn-ghost p-2 rounded-lg z-10"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Navigation prev */}
      {currentIndex > 0 && (
        <button
          id="lightbox-prev"
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 btn-ghost p-3 rounded-xl z-10"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigation next */}
      {currentIndex < files.length - 1 && (
        <button
          id="lightbox-next"
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 btn-ghost p-3 rounded-xl z-10"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Media content */}
      <div className="flex flex-col items-center max-w-6xl max-h-screen w-full px-16 py-16 animate-scale-in">
        {selectedFile.type === 'image' && (
          <img
            src={mediaUrl}
            alt={selectedFile.name}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          />
        )}

        {selectedFile.type === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[75vh] rounded-lg shadow-2xl"
          />
        )}

        {selectedFile.type === 'audio' && (
          <div className="w-full max-w-md p-8 card flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center">
              <Info size={32} className="text-accent-400" />
            </div>
            <audio src={mediaUrl} controls className="w-full" />
          </div>
        )}

        {/* File info bar */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="text-surface-200 font-medium">{selectedFile.name}</span>
          <span className="badge badge-surface">{selectedFile.ext.toUpperCase()}</span>
          <span className="text-surface-500">{formatSize(selectedFile.size)}</span>
          <span className="text-surface-600 text-xs hidden sm:block">{currentIndex + 1} / {files.length}</span>

          {/* Download */}
          <a
            id="lightbox-download"
            href={mediaUrl}
            download={selectedFile.name}
            className="btn-ghost px-2 py-1 ml-2"
            title="Download"
          >
            <Download size={15} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LightBox;
