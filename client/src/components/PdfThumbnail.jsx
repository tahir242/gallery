import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';

let pdfjs = null;

const initPdfJs = async () => {
  if (!pdfjs) {
    const pdfjsModule = await import('pdfjs-dist');
    pdfjsModule.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsModule.version}/build/pdf.worker.min.mjs`;
    pdfjs = pdfjsModule;
  }
  return pdfjs;
};

const PdfThumbnail = ({ src, name }) => {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    let renderTask;
    let loadingTask;

    const renderFirstPage = async () => {
      try {
        const pdfAPI = await initPdfJs();
        if (cancelled) return;
        loadingTask = pdfAPI.getDocument({ url: src });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.45 });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d', { alpha: false });
        if (!canvas || !context || cancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = page.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) setStatus('ready');
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
      renderTask?.cancel();
      loadingTask?.destroy();
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
      <canvas
        ref={canvasRef}
        aria-label={`First page preview of ${name}`}
        className={`relative max-h-full max-w-full object-contain rounded-sm bg-white shadow-lg transition-opacity ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default PdfThumbnail;
