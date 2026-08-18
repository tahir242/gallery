import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// The worker is already set in PdfViewer, but we can set it here too in case PdfThumbnail loads first.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfThumbnail = ({ src, name }) => {
  const imgRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let blobUrl = null;

    const renderFirstPage = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ 
          url: src,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true
        });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.45 });

        // Render to an offscreen canvas (never in the DOM)
        const offscreen = document.createElement('canvas');
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const context = offscreen.getContext('2d');

        await page.render({ canvasContext: context, viewport }).promise;

        if (cancelled) return;

        // Convert to blob URL and display as <img>
        const blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
        
        // Free canvas memory
        offscreen.width = 0;
        offscreen.height = 0;

        blobUrl = URL.createObjectURL(blob);
        setImgSrc(blobUrl);
        setStatus('ready');
      } catch (error) {
        if (!cancelled && error?.name !== 'RenderingCancelledException') {
          console.error("PDF load error:", error);
          setStatus('error');
        }
      }
    };

    renderFirstPage();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (status === 'error') {
    return (
      <div className="w-full h-full aspect-[3/4] flex flex-col items-center justify-center bg-red-500/5">
        <FileText size={30} className="text-red-300/80 mb-2" />
        <span className="text-xs text-surface-500">Preview unavailable</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full aspect-[3/4] flex items-center justify-center bg-surface-800 p-2">
      {status === 'loading' && <div className="absolute inset-0 skeleton" />}
      {imgSrc && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt={`First page preview of ${name}`}
          draggable={false}
          className={`relative max-h-full max-w-full object-contain rounded-sm bg-white shadow-lg transition-opacity ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

export default PdfThumbnail;
