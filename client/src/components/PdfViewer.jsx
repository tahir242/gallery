import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getResolvedPDFJS } from 'unpdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Hand, MousePointer2, AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Renders a single PDF page to an offscreen canvas and returns a Blob URL.
 * The canvas is never placed in the DOM — it's purely temporary.
 * This prevents ALL canvas-related crashes, white screens, and black screens.
 */
const renderPageToBlob = async (pdfDoc, pageNum, scale = 2) => {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  // Create a temporary offscreen canvas (NOT in the DOM)
  const offscreen = document.createElement('canvas');
  offscreen.width = viewport.width;
  offscreen.height = viewport.height;
  const ctx = offscreen.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;

  // Convert the rendered canvas to a blob URL
  const blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
  const url = URL.createObjectURL(blob);

  // Return the blob URL and the base (unscaled) dimensions for CSS sizing
  const unscaled = page.getViewport({ scale: 1 });
  return {
    url,
    baseWidth: unscaled.width,
    baseHeight: unscaled.height,
  };
};

const PdfViewer = ({ src, name }) => {
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [status, setStatus] = useState('loading'); // 'loading' | 'rendering' | 'ready' | 'error'

  const [pageImageUrl, setPageImageUrl] = useState(null);
  const [baseDims, setBaseDims] = useState({ width: 600, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [fitZoom, setFitZoom] = useState(1);

  const [isPanning, setIsPanning] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const currentBlobUrl = useRef(null); // Track for cleanup

  // ── 1. Load the PDF document ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      try {
        setStatus('loading');
        const pdfAPI = await getResolvedPDFJS();
        const loadingTask = pdfAPI.getDocument({ url: src });
        const loadedPdf = await loadingTask.promise;
        if (cancelled) return;

        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
        setPageInput('1');
      } catch (err) {
        console.error('Failed to load PDF', err);
        if (!cancelled) setStatus('error');
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [src]);

  // ── 2. Render current page to image ──────────────────────────────
  useEffect(() => {
    if (!pdf) return;

    let cancelled = false;

    const render = async () => {
      try {
        setStatus('rendering');

        const result = await renderPageToBlob(pdf, currentPage, 2);
        if (cancelled) return;

        // Revoke old blob URL to free memory
        if (currentBlobUrl.current) {
          URL.revokeObjectURL(currentBlobUrl.current);
        }
        currentBlobUrl.current = result.url;

        setPageImageUrl(result.url);
        setBaseDims({ width: result.baseWidth, height: result.baseHeight });

        // Calculate fit-to-window zoom on first page load
        if (containerRef.current) {
          const padX = 40;
          const padY = 160;
          const cW = containerRef.current.clientWidth - padX;
          const cH = containerRef.current.clientHeight - padY;
          if (cW > 0 && cH > 0) {
            const fit = Math.min(Math.max(Math.min(cW / result.baseWidth, cH / result.baseHeight), 0.25), 3);
            setFitZoom(fit);
            if (currentPage === 1 && zoom === 1) {
              setZoom(fit);
            }
          }
        }

        setStatus('ready');
      } catch (err) {
        console.error('Failed to render page', err);
        if (!cancelled) setStatus('error');
      }
    };

    render();

    return () => { cancelled = true; };
  }, [pdf, currentPage]);

  // ── 3. Cleanup blob URLs on unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) {
        URL.revokeObjectURL(currentBlobUrl.current);
        currentBlobUrl.current = null;
      }
    };
  }, []);

  // ── 4. CTRL + Mouse Wheel zoom ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom((prev) => {
          const delta = e.deltaY < 0 ? 0.1 : -0.1;
          return Math.min(4, Math.max(0.25, prev + delta));
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // ── Panning ──────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (isPanning && containerRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setScrollStart({
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (isDragging && isPanning && containerRef.current) {
      containerRef.current.scrollLeft = scrollStart.x - (e.clientX - dragStart.x);
      containerRef.current.scrollTop = scrollStart.y - (e.clientY - dragStart.y);
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // ── Page navigation ──────────────────────────────────────────────
  const handlePageSubmit = (e) => {
    e.preventDefault();
    let p = parseInt(pageInput, 10);
    if (!isNaN(p)) {
      p = Math.max(1, Math.min(totalPages, p));
      setCurrentPage(p);
      setPageInput(p.toString());
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const jumpPrev = () => {
    const p = Math.max(1, currentPage - 1);
    setCurrentPage(p);
    setPageInput(p.toString());
  };

  const jumpNext = () => {
    const p = Math.min(totalPages, currentPage + 1);
    setCurrentPage(p);
    setPageInput(p.toString());
  };

  const resetZoom = useCallback(() => {
    if (containerRef.current && baseDims.width > 0) {
      const padX = 40;
      const padY = 160;
      const cW = containerRef.current.clientWidth - padX;
      const cH = containerRef.current.clientHeight - padY;
      if (cW > 0 && cH > 0) {
        const fit = Math.min(Math.max(Math.min(cW / baseDims.width, cH / baseDims.height), 0.25), 3);
        setFitZoom(fit);
        setZoom(fit);
      }
    }
  }, [baseDims]);

  // ── Error state ──────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-transparent rounded-[6px] gap-3">
        <AlertCircle className="text-red-400" size={32} />
        <span className="text-white/70">Failed to load PDF</span>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div
      className="relative flex w-full h-full animate-zoom-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Viewer area ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto flex justify-center items-center w-full h-full ${
          isPanning ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="pt-20 pb-24 px-4 flex flex-col items-center min-w-max min-h-max">
          {(status === 'loading' || status === 'rendering') && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {pageImageUrl && (
            <img
              src={pageImageUrl}
              alt={`Page ${currentPage} of ${name}`}
              draggable={false}
              className="shadow-2xl select-none"
              style={{
                width: `${baseDims.width * zoom}px`,
                height: `${baseDims.height * zoom}px`,
                opacity: status === 'ready' || status === 'rendering' ? 1 : 0,
                transition: 'width 0.05s ease-out, height 0.05s ease-out',
                imageRendering: zoom > 2 ? 'pixelated' : 'auto',
              }}
            />
          )}
        </div>
      </div>

      {/* ── Bottom Control Bar ─────────────────────────────────────────── */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1
                   bg-black/60 backdrop-blur-md border border-white/10 rounded-pill
                   px-2 py-1.5 shadow-overlay"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={jumpPrev}
          disabled={currentPage <= 1}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 rounded-full hover:bg-white/10 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        <form onSubmit={handlePageSubmit} className="flex items-center gap-1 mx-1">
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageSubmit}
            className="w-8 bg-transparent text-sm text-center text-white/80 focus:text-white focus:outline-none"
          />
          <span className="text-white/40 text-sm">/ {totalPages || '-'}</span>
        </form>

        <button
          onClick={jumpNext}
          disabled={currentPage >= totalPages}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 rounded-full hover:bg-white/10 transition-colors"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          disabled={zoom <= 0.25}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>

        <span className="px-2 text-[11px] font-mono text-white/50 min-w-[2.5rem] text-center pointer-events-none">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          disabled={zoom >= 4}
          className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>

        {Math.round(zoom * 100) !== Math.round(fitZoom * 100) && (
          <button
            onClick={resetZoom}
            className="w-7 h-7 flex items-center justify-center text-white/70 hover:text-white transition-colors border-l border-white/10 ml-1"
            title="Reset zoom"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
