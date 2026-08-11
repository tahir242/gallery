import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Info, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import { getMediaUrl } from '../services/api';

const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const LightBox = () => {
  const { selectedFile, setSelectedFile, files } = useGalleryStore();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const currentIndex = files.findIndex((f) => f.path === selectedFile?.path);

  // Reset zoom and pan on file change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedFile]);

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
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 5));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedFile, goNext, goPrev, close]);

  if (!selectedFile) return null;

  const mediaUrl = getMediaUrl(selectedFile.path);
  const isImage = selectedFile.type === 'image';

  const handleWheel = (e) => {
    if (!isImage) return;
    setZoom((z) => {
      const newZoom = e.deltaY < 0 ? Math.min(z + 0.25, 5) : Math.max(z - 0.25, 0.5);
      if (newZoom <= 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1 && isImage) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1 && isImage) {
      setPan({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(z => Math.min(z + 0.25, 5));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(z => {
      const newZoom = Math.max(z - 0.25, 0.5);
      if (newZoom <= 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleResetZoom = (e) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      id="lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/95 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && close()}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close */}
      <button
        id="lightbox-close"
        onClick={close}
        className="absolute top-4 right-4 btn-ghost p-2 rounded-lg z-10 bg-surface-900/50 hover:bg-surface-800"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Navigation prev */}
      {currentIndex > 0 && (
        <button
          id="lightbox-prev"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 btn-ghost p-3 rounded-xl z-10 bg-surface-900/50 hover:bg-surface-800"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Navigation next */}
      {currentIndex < files.length - 1 && (
        <button
          id="lightbox-next"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 btn-ghost p-3 rounded-xl z-10 bg-surface-900/50 hover:bg-surface-800"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Media content */}
      <div 
        className="flex flex-col items-center justify-center w-full h-full px-16 py-16 overflow-hidden animate-scale-in pointer-events-none"
      >
        {isImage && (
          <img
            src={mediaUrl}
            alt={selectedFile.name}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'auto',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            draggable={false}
          />
        )}

        {selectedFile.type === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-lg shadow-2xl pointer-events-auto"
          />
        )}

        {selectedFile.type === 'audio' && (
          <div className="w-full max-w-md p-8 card flex flex-col items-center gap-6 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center">
              <Info size={32} className="text-accent-400" />
            </div>
            <audio src={mediaUrl} controls className="w-full" />
          </div>
        )}

        {/* File info bar & Zoom controls */}
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-sm bg-surface-900/80 backdrop-blur border border-surface-800 px-6 py-3 rounded-full pointer-events-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-surface-200 font-medium max-w-[200px] truncate" title={selectedFile.name}>{selectedFile.name}</span>
          <span className="badge badge-surface">{selectedFile.ext.toUpperCase()}</span>
          <span className="text-surface-500 hidden sm:block">{formatSize(selectedFile.size)}</span>
          <span className="text-surface-600 text-xs hidden sm:block">{currentIndex + 1} / {files.length}</span>

          {isImage && (
            <div className="flex items-center gap-1 border-l border-surface-700 pl-4 ml-2">
              <button onClick={handleZoomOut} className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors" title="Zoom Out (-)">
                <ZoomOut size={16} />
              </button>
              <button onClick={handleResetZoom} className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors w-12 text-center text-xs font-mono" title="Reset Zoom">
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={handleZoomIn} className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors" title="Zoom In (+)">
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          {/* Download */}
          <a
            id="lightbox-download"
            href={mediaUrl}
            download={selectedFile.name}
            className="btn-ghost px-2 py-1 ml-2 border-l border-surface-700 pl-4 rounded-none"
            title="Download"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LightBox;
