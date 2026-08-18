import { useEffect, useCallback, useRef, useState } from 'react';
import {
  X, ChevronLeft, ChevronRight,
  Download, ZoomIn, ZoomOut,
  Info, Heart, Copy, Check, FileText,
  RotateCcw, Edit, FileSpreadsheet, Presentation,
} from 'lucide-react';
import useGalleryStore from '../store/galleryStore';
import { getMediaUrl, getMediaMetadataApi } from '../services/api';
import { Tooltip } from './ui/Tooltip';
import ImageEditor from './ImageEditor';
import PdfViewer from './PdfViewer';
import DocxViewer from './DocxViewer';
import SpreadsheetViewer from './SpreadsheetViewer';
import TextViewer from './TextViewer';
import AudioPlayer from './AudioPlayer';


/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const formatSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  } catch {
    return null;
  }
};

/* ─── Toolbar action button ─────────────────────────────────────────────────── */
const ActionBtn = ({ id, onClick, icon: Icon, label, active = false, danger = false, className = '' }) => (
  <Tooltip content={label}>
    <button
      id={id}
      onClick={onClick}
      className={`lightbox-action-btn ${active ? 'text-accent-400 bg-accent-500/15' : ''} ${danger && active ? 'text-red-400 bg-red-500/15' : ''} ${className}`}
      aria-label={label}
    >
      <Icon size={16} />
    </button>
  </Tooltip>
);

/* ─── Metadata panel ────────────────────────────────────────────────────────── */
const MetadataPanel = ({ file, onClose }) => {
  const [extendedData, setExtendedData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    getMediaMetadataApi(file.path)
      .then((data) => {
        // Filter out highly verbose or raw binary tags if needed, but the prompt asks for exhaustive data
        setExtendedData(data);
      })
      .catch((err) => console.error('Failed to load metadata:', err))
      .finally(() => setLoading(false));
  }, [file]);

  const rows = [
    { label: 'Name',      value: file.name },
    { label: 'Type',      value: file.ext?.toUpperCase() },
    { label: 'Size',      value: formatSize(file.size) },
    { label: 'Path',      value: file.path,      mono: true, truncate: false },
    { label: 'Directory', value: file.directory, mono: true },
    { label: 'Modified',  value: formatDate(file.modifiedAt) },
    { label: 'Width',     value: extendedData?.ImageWidth ? `${extendedData.ImageWidth}px` : (file.width ? `${file.width}px` : null) },
    { label: 'Height',    value: extendedData?.ImageHeight ? `${extendedData.ImageHeight}px` : (file.height ? `${file.height}px` : null) },
  ].filter((r) => r.value);

  // Group tags that are useful to display
  const excludeKeys = ['Directory', 'FileAccessDate', 'FileModifyDate', 'FileName', 'FilePath', 'FileSize', 'MIMEType', 'SourceFile', 'errors'];
  
  const extendedRows = extendedData 
    ? Object.entries(extendedData)
        .filter(([k, v]) => !excludeKeys.includes(k) && typeof v !== 'object')
        .map(([k, v]) => ({ label: k, value: String(v) }))
    : [];

  return (
    <div className="metadata-panel flex flex-col w-72 flex-shrink-0 border-l border-white/8 bg-black/70 backdrop-blur-md animate-slide-down overflow-y-auto z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 sticky top-0 bg-black/50 backdrop-blur-md z-10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">File Info</span>
        <button onClick={onClose} className="lightbox-action-btn" aria-label="Close info panel">
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Basic Info */}
        {rows.map(({ label, value, mono, truncate }) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">{label}</p>
            <p className={`text-[12px] text-white/70 leading-relaxed ${mono ? 'font-mono break-all' : ''} ${truncate === false ? '' : 'line-clamp-3'}`}>
              {value}
            </p>
          </div>
        ))}

        <div className="h-px w-full bg-white/10 my-2" />

        {/* Extended EXIF / Metadata */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">Extended Metadata</p>
        
        {loading ? (
          <p className="text-[12px] text-white/40 italic">Loading EXIF data...</p>
        ) : extendedRows.length > 0 ? (
          <div className="flex flex-col gap-3">
            {extendedRows.map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
                <p className="text-[11px] text-white/70 leading-relaxed break-words">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-white/40 italic">No extended metadata available.</p>
        )}
      </div>
    </div>
  );
};

/* ─── LightBox ──────────────────────────────────────────────────────────────── */
import { useShallow } from 'zustand/react/shallow';

const LightBox = () => {
  const { 
    selectedFile, setSelectedFile, files, 
    toggleFavorite, favorites,
    metadataPanelOpen, toggleMetadataPanel,
  } = useGalleryStore(useShallow(s => ({
    selectedFile: s.selectedFile,
    setSelectedFile: s.setSelectedFile,
    files: s.files,
    toggleFavorite: s.toggleFavorite,
    favorites: s.favorites,
    metadataPanelOpen: s.metadataPanelOpen,
    toggleMetadataPanel: s.toggleMetadataPanel
  })));

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [mediaError, setMediaError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(null);
  const closeButtonRef = useRef(null);
  const backdropRef = useRef(null); // for non-passive wheel + touch listeners

  const currentIndex = files.findIndex((f) => f.path === selectedFile?.path);
  const isFav = selectedFile ? favorites.has(selectedFile.path) : false;

  // Reset state on file change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMediaError(false);
    setCopied(false);
    setIsEditing(false);
  }, [selectedFile]);

  // Focus management
  useEffect(() => {
    if (!selectedFile) return undefined;
    const prev = document.activeElement;
    closeButtonRef.current?.focus();
    return () => prev?.focus?.();
  }, [selectedFile]);

  // Safely reset pan when zoom returns to 1 or below
  useEffect(() => {
    if (zoom <= 1 && (pan.x !== 0 || pan.y !== 0)) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom, pan.x, pan.y]);

  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) setSelectedFile(files[currentIndex + 1]);
  }, [currentIndex, files, setSelectedFile]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setSelectedFile(files[currentIndex - 1]);
  }, [currentIndex, files, setSelectedFile]);

  const close = useCallback(() => {
    setSelectedFile(null);
  }, [setSelectedFile]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Copy path to clipboard
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selectedFile?.path || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }, [selectedFile?.path]);

  // Derive isImage BEFORE the early return so hooks below can use it unconditionally
  const isImage = selectedFile?.type === 'image' ?? false;

  // ── Wheel zoom (non-passive) ────────────────────────────────────────────────
  // MUST be above the early return — hooks cannot come after a conditional return.
  // We attach as { passive: false } via useEffect so e.preventDefault() is legal.
  const handleWheel = useCallback((e) => {
    if (e.target.closest('.metadata-panel')) return;
    if (!isImage) return;
    e.preventDefault();
    setZoom((z) => {
      const n = e.deltaY < 0 ? Math.min(z + 0.2, 5) : Math.max(z - 0.2, 0.5);
      return n;
    });
  }, [isImage]);

  // Attach wheel + touch as non-passive so preventDefault() is honoured
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd   = (e) => {
      if (touchStartX.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 60) { delta < 0 ? goNext() : goPrev(); }
      touchStartX.current = null;
    };

    el.addEventListener('wheel',      handleWheel,  { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true  });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true  });

    return () => {
      el.removeEventListener('wheel',      handleWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [handleWheel, goNext, goPrev]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedFile) return;
    const handler = (e) => {
      switch (e.key) {
        case 'Escape':     close(); break;
        case 'ArrowRight': goNext(); break;
        case 'ArrowLeft':  goPrev(); break;
        case '+': case '=': setZoom((z) => Math.min(z + 0.25, 5)); break;
        case '-':           setZoom((z) => Math.max(z - 0.25, 0.5)); break;
        case 'f': case 'F': if (selectedFile) toggleFavorite(selectedFile.path); break;
        case 'i': case 'I': toggleMetadataPanel(); break;
        case 'Tab': {
          const focusable = document.getElementById('lightbox')?.querySelectorAll('button, a[href], video[controls], audio[controls]');
          if (!focusable?.length) return;
          const items = [...focusable];
          const first = items[0];
          const last = items.at(-1);
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          break;
        }
        default: break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedFile, goNext, goPrev, close, toggleFavorite, toggleMetadataPanel]);

  // ── Early exit when no file is selected ────────────────────────────────────
  if (!selectedFile) return null;

  const mediaUrl = getMediaUrl(selectedFile.path);

  const handlePointerDown = (e) => {
    if (zoom > 1 && isImage) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging && zoom > 1 && isImage) {
      setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    }
  };

  const handlePointerUp = () => setIsDragging(false);


  return (
    <div
      id="lightbox"
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview: ${selectedFile.name}`}
      className="lightbox-backdrop"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3
                   bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: counter + filename */}
        <div className="pointer-events-none flex items-center gap-3">
          <span className="text-white/40 text-xs tabular-nums">
            {currentIndex + 1} / {files.length}
          </span>
          <Tooltip content={selectedFile.name}>
            <span className="text-white/70 text-sm font-medium max-w-[200px] sm:max-w-sm truncate">
              {selectedFile.name}
            </span>
          </Tooltip>
        </div>

        {/* Right: action cluster */}
        <div className="flex items-center gap-1 pointer-events-auto">
          {/* Edit */}
          {isImage && (
            <ActionBtn
              id="lightbox-edit"
              onClick={() => setIsEditing(true)}
              icon={Edit}
              label="Edit Image"
            />
          )}

          {/* Favorite */}
          <ActionBtn
            id="lightbox-fav"
            onClick={() => toggleFavorite(selectedFile.path)}
            icon={Heart}
            label={isFav ? 'Remove favorite (F)' : 'Add to favorites (F)'}
            active={isFav}
            danger
          />

          {/* Copy path */}
          <ActionBtn
            id="lightbox-share"
            onClick={handleShare}
            icon={copied ? Check : Copy}
            label={copied ? 'Copied!' : 'Copy path'}
            active={copied}
          />

          {/* Metadata panel */}
          <ActionBtn
            id="lightbox-info"
            onClick={toggleMetadataPanel}
            icon={Info}
            label="File info (I)"
            active={metadataPanelOpen}
          />

          {/* Download */}
          <Tooltip content="Download">
            <a
              id="lightbox-download"
              href={mediaUrl}
              download={selectedFile.name}
              className="lightbox-action-btn"
              aria-label="Download"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} />
            </a>
          </Tooltip>

          {/* Close */}
          <Tooltip content="Close (Esc)">
            <button
              id="lightbox-close"
              ref={closeButtonRef}
              onClick={close}
              className="lightbox-action-btn ml-1 border border-white/10"
              aria-label="Close (Esc)"
            >
              <X size={17} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Main content area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 w-full mt-0">

        {/* ── Media viewer ──────────────────────────────────────────────────── */}
        <div
          className="flex-1 flex items-center justify-center relative min-w-0 overflow-hidden"
          onPointerDown={handlePointerDown}
        >
          {/* Prev arrow */}
          {currentIndex > 0 && (
            <button
              id="lightbox-prev"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-3 z-10 w-10 h-10 rounded-card flex items-center justify-center
                         bg-black/40 hover:bg-black/70 border border-white/10
                         text-white/70 hover:text-white transition-all duration-150 backdrop-blur-sm"
              aria-label="Previous (←)"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Next arrow */}
          {currentIndex < files.length - 1 && (
            <button
              id="lightbox-next"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-3 z-10 w-10 h-10 rounded-card flex items-center justify-center
                         bg-black/40 hover:bg-black/70 border border-white/10
                         text-white/70 hover:text-white transition-all duration-150 backdrop-blur-sm"
              aria-label="Next (→)"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Image */}
          {isImage && (
            <img
              src={mediaUrl}
              alt={selectedFile.name}
              className="max-w-full max-h-full object-contain rounded-[6px] select-none animate-zoom-in"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                transition: isDragging ? 'none' : 'transform 0.12s ease-out',
                touchAction: zoom > 1 ? 'none' : 'auto',
                maxHeight: 'calc(100vh - 80px)',
              }}
              draggable={false}
              onError={() => setMediaError(true)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Video */}
          {selectedFile.type === 'video' && (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-[6px] shadow-2xl animate-zoom-in"
              style={{ maxHeight: 'calc(100vh - 80px)' }}
              onError={() => setMediaError(true)}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Audio */}
          {selectedFile.type === 'audio' && (
            <AudioPlayer
              src={mediaUrl}
              name={selectedFile.name}
            />
          )}

          {/* PDF */}
          {selectedFile.type === 'document' && selectedFile.ext === 'pdf' && (
            <PdfViewer 
              src={mediaUrl} 
              name={selectedFile.name} 
            />
          )}

          {/* Word Documents (.docx) */}
          {selectedFile.type === 'document' && selectedFile.ext === 'docx' && (
            <DocxViewer
              src={mediaUrl}
              name={selectedFile.name}
            />
          )}

          {/* Spreadsheets (.xlsx, .xls, .csv) */}
          {selectedFile.type === 'document' && ['xlsx', 'xls', 'csv'].includes(selectedFile.ext) && (
            <SpreadsheetViewer
              src={mediaUrl}
              name={selectedFile.name}
            />
          )}

          {/* Text files (.txt) */}
          {selectedFile.type === 'document' && selectedFile.ext === 'txt' && (
            <TextViewer
              src={mediaUrl}
              name={selectedFile.name}
            />
          )}

          {/* Unsupported documents (.doc, .ppt, .pptx) — download fallback */}
          {selectedFile.type === 'document' && !['pdf', 'docx', 'xlsx', 'xls', 'csv', 'txt'].includes(selectedFile.ext) && (
            <div
              className="flex flex-col items-center gap-6 p-10 animate-zoom-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
                {['ppt', 'pptx'].includes(selectedFile.ext)
                  ? <Presentation size={48} className="text-orange-400/60" />
                  : <FileText size={48} className="text-white/40" />
                }
              </div>
              <p className="text-white/60 text-sm font-medium max-w-xs text-center truncate">{selectedFile.name}</p>
              <p className="text-white/40 text-xs text-center max-w-sm leading-relaxed">
                Preview not available for .{selectedFile.ext} files.
              </p>
              <a
                href={mediaUrl}
                download={selectedFile.name}
                className="mt-4 px-6 py-2.5 bg-accent-500/20 text-accent-400 border border-accent-500/30 rounded-card hover:bg-accent-500/30 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Download size={16} />
                Download File
              </a>
            </div>
          )}

          {/* Error */}
          {mediaError && (
            <p role="alert" className="absolute top-16 left-1/2 -translate-x-1/2
                                       rounded-card bg-red-500/12 border border-red-500/25
                                       px-4 py-2.5 text-sm text-red-300">
              This media file could not be loaded.
            </p>
          )}

          {/* ── Bottom zoom bar (images only) ─────────────────────────────────── */}
          {isImage && (
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1
                         bg-black/60 backdrop-blur-md border border-white/10 rounded-pill
                         px-2 py-1.5 shadow-overlay"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Tooltip content="Zoom out (-)">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="lightbox-action-btn w-7 h-7"
                  aria-label="Zoom out (-)"
                >
                  <ZoomOut size={13} />
                </button>
              </Tooltip>

              <Tooltip content="Reset zoom">
                <button
                  onClick={resetZoom}
                  className="px-2 text-[11px] font-mono text-white/50 hover:text-white/80 transition-colors min-w-[3rem] text-center"
                  aria-label="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
              </Tooltip>

              <Tooltip content="Zoom in (+)">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
                  className="lightbox-action-btn w-7 h-7"
                  aria-label="Zoom in (+)"
                >
                  <ZoomIn size={13} />
                </button>
              </Tooltip>

              {zoom !== 1 && (
                <Tooltip content="Reset zoom">
                  <button
                    onClick={resetZoom}
                    className="lightbox-action-btn w-7 h-7 border-l border-white/10 ml-1 pl-1 rounded-none"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw size={12} />
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* ── Metadata panel ────────────────────────────────────────────────── */}
        {metadataPanelOpen && (
          <MetadataPanel file={selectedFile} onClose={toggleMetadataPanel} />
        )}
      </div>

      {isEditing && (
        <ImageEditor 
          file={selectedFile} 
          onClose={() => setIsEditing(false)} 
          onSaveSuccess={(newPath) => {
             setIsEditing(false);
             // Close lightbox to let user see grid refresh (could be improved to stay open, but grid needs update anyway)
             close();
          }} 
        />
      )}
    </div>
  );
};

export default LightBox;
