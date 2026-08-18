import { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  X, Save, CopyPlus, Crop as CropIcon, Image as ImageIcon, 
  SlidersHorizontal, Download, FlipHorizontal, FlipVertical,
  Monitor, Square, RectangleHorizontal, Smartphone, Undo2, RotateCcw, RotateCw
} from 'lucide-react';
import { getMediaUrl, editMediaApi } from '../services/api';

const ImageEditor = ({ file, onClose, onSaveSuccess }) => {
  const [activeTab, setActiveTab] = useState('crop'); 
  
  // Crop & Transform State
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(undefined);
  
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  
  const [previewSrc, setPreviewSrc] = useState(getMediaUrl(file.path));
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Zoom State
  const [zoom, setZoom] = useState(1);
  const [baseDim, setBaseDim] = useState({ w: 0, h: 0 });

  // New state for Previewing the Crop
  const [croppedSrc, setCroppedSrc] = useState(null);
  const [showCropPreview, setShowCropPreview] = useState(false);

  // Adjustments State
  const defaultAdjustments = { brightness: 100, saturation: 100, blur: 0 };
  const [adjustments, setAdjustments] = useState(defaultAdjustments);

  // Export State
  const [format, setFormat] = useState('png');
  const [resize, setResize] = useState({ width: '', height: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const imgRef = useRef(null);

  // Generate cropped preview when switching tabs or clicking Preview
  useEffect(() => {
    if ((activeTab !== 'crop' || showCropPreview) && completedCrop && completedCrop.width > 0 && imgRef.current) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      canvas.toBlob((blob) => {
        if (blob) setCroppedSrc(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.95);
    } else {
      setCroppedSrc(null);
    }
  }, [activeTab, showCropPreview, completedCrop]);

  useEffect(() => {
    if (activeTab === 'crop') {
      setShowCropPreview(false);
    }
  }, [activeTab]);

  // Generate a physical rotated/flipped preview using Canvas so ReactCrop works perfectly
  useEffect(() => {
    let active = true;
    
    if (rotate === 0 && !flipH && !flipV) {
      setPreviewSrc(getMediaUrl(file.path));
      setIsPreviewLoading(false);
      return;
    }
    
    setIsPreviewLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!active) return;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (rotate === 90 || rotate === 270) {
        canvas.width = img.naturalHeight;
        canvas.height = img.naturalWidth;
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      
      canvas.toBlob((blob) => {
        if (!active) return;
        if (blob) {
          setPreviewSrc(URL.createObjectURL(blob));
        }
        setIsPreviewLoading(false);
      }, 'image/jpeg', 0.95);
    };
    img.src = getMediaUrl(file.path);

    return () => { active = false; };
  }, [rotate, flipH, flipV, file.path]);


  const handleImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    setResize({
      width: Math.round(e.currentTarget.naturalWidth),
      height: Math.round(e.currentTarget.naturalHeight),
    });
    
    // Save base dimensions for 1x zoom calculations
    if (zoom === 1) {
      setBaseDim({ w: e.currentTarget.width, h: e.currentTarget.height });
    }
    
    // Only apply aspect ratio automatically if one is selected
    if (aspect) {
      handleAspectClick(aspect, e.currentTarget);
    }
  };

  const handleAspectClick = (newAspect, imageElement = imgRef.current) => {
    setAspect(newAspect);
    if (!imageElement) return;
    
    if (newAspect) {
      const { width, height } = imageElement;
      let cropWidth = width * 0.8;
      let cropHeight = cropWidth / newAspect;
      if (cropHeight > height * 0.8) {
        cropHeight = height * 0.8;
        cropWidth = cropHeight * newAspect;
      }
      setCrop({
        unit: 'px',
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      });
    }
  };

  const resetEdits = () => {
    setAspect(undefined);
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setAdjustments(defaultAdjustments);
    setZoom(1);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleRotate = (dir) => {
    setRotate((prev) => {
      let next = prev + dir;
      if (next >= 360) next = 0;
      if (next < 0) next = 270;
      return next;
    });
  };

  const handleSave = async (saveMode) => {
    if (isSaving) return;
    setIsSaving(true);
    setError('');

    try {
      const operations = {
        format,
        rotate,
        flipH,
        flipV,
        adjustments
      };

      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0 && imgRef.current) {
        // We calculate crop against the CURRENT preview image (which is already rotated/flipped)
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

        let finalX = Math.round(completedCrop.x * scaleX);
        let finalY = Math.round(completedCrop.y * scaleY);
        let finalW = Math.round(completedCrop.width * scaleX);
        let finalH = Math.round(completedCrop.height * scaleY);

        const maxW = imgRef.current.naturalWidth;
        const maxH = imgRef.current.naturalHeight;

        // Strict clamping to prevent "bad extract area" rounding errors
        if (finalX < 0) finalX = 0;
        if (finalY < 0) finalY = 0;
        if (finalX + finalW > maxW) finalW = maxW - finalX;
        if (finalY + finalH > maxH) finalH = maxH - finalY;

        operations.crop = {
          x: finalX,
          y: finalY,
          width: finalW,
          height: finalH,
        };
      }

      if (resize.width && resize.height) {
        const w = parseInt(resize.width, 10);
        const h = parseInt(resize.height, 10);
        if (w > 0 || h > 0) {
           operations.resize = { width: w, height: h };
        }
      }

      const result = await editMediaApi({
        path: file.path,
        operations,
        saveMode,
      });

      if (result.success) {
        onSaveSuccess(result.path);
      } else {
        setError(result.error || 'Failed to save image.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate CSS filter string for live preview (Transforms are baked into the canvas preview!)
  const filterStyle = `brightness(${adjustments.brightness}%) saturate(${adjustments.saturation}%) blur(${adjustments.blur}px)`;

  const imgScaleStyle = zoom === 1 ? {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 250px)',
    objectFit: 'contain'
  } : {
    width: `${baseDim.w * zoom}px`,
    height: `${baseDim.h * zoom}px`,
    maxWidth: 'none',
    maxHeight: 'none'
  };

  const containerRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleWheel = (e) => {
    // Zoom via mouse wheel (holding Ctrl is common for browser zoom, but let's just use raw wheel to zoom if they want)
    // Actually, usually users just wheel to zoom when they are in an image editor.
    // If they want to scroll vertically, they use wheel. 
    // Let's require Ctrl key or just make wheel zoom natively? The user said "zoom through mouse wheel".
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom(z => Math.max(1, Math.min(4, z + delta)));
  };

  const handlePointerDown = (e) => {
    // Don't pan if they are grabbing a crop handle or drawing a crop box!
    if (e.target.closest('.ReactCrop__drag-handle') || e.target.closest('.ReactCrop__crop-selection')) return;
    
    if (zoom > 1 && containerRef.current) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (isPanning && containerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      containerRef.current.scrollLeft = panStart.scrollLeft - dx;
      containerRef.current.scrollTop = panStart.scrollTop - dy;
    }
  };

  const handlePointerUp = (e) => {
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Add non-passive wheel listener for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(z => Math.max(1, Math.min(4, z + delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col animate-fade-in select-none">
      <style>{`
        /* Professional Cropper UI Overrides */
        
        /* Hide default mask because we use box-shadow on the selection for a perfect mask */
        .ReactCrop__crop-mask {
          display: none !important;
        }
        
        /* Crop selection border and mask */
        .ReactCrop__crop-selection {
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
          background-image: none !important; /* Remove marching ants that causes dimming */
          box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.8) !important;
          transition: border-color 0.2s ease;
        }
        .ReactCrop--active .ReactCrop__crop-selection {
          border-color: rgba(255, 255, 255, 1) !important;
        }

        /* Rule of Thirds Grid - Only visible when dragging */
        .ReactCrop__crop-selection::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            linear-gradient(to right, transparent 33.33%, rgba(255,255,255,0.4) 33.33%, rgba(255,255,255,0.4) calc(33.33% + 1px), transparent calc(33.33% + 1px), transparent 66.66%, rgba(255,255,255,0.4) 66.66%, rgba(255,255,255,0.4) calc(66.66% + 1px), transparent calc(66.66% + 1px)),
            linear-gradient(to bottom, transparent 33.33%, rgba(255,255,255,0.4) 33.33%, rgba(255,255,255,0.4) calc(33.33% + 1px), transparent calc(33.33% + 1px), transparent 66.66%, rgba(255,255,255,0.4) 66.66%, rgba(255,255,255,0.4) calc(66.66% + 1px), transparent calc(66.66% + 1px));
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .ReactCrop--active .ReactCrop__crop-selection::after {
          opacity: 1;
        }

        /* Hide default ugly dots */
        .ReactCrop__drag-handle::after {
          display: none !important;
        }

        /* Create iOS/Lightroom style L-shaped corner handles */
        .ReactCrop__drag-handle {
          width: 20px !important;
          height: 20px !important;
          background: transparent !important;
          border: 0 !important;
        }
        .ReactCrop__drag-handle.ord-nw {
          border-top: 3px solid white !important;
          border-left: 3px solid white !important;
          transform: translate(-2px, -2px) !important;
        }
        .ReactCrop__drag-handle.ord-ne {
          border-top: 3px solid white !important;
          border-right: 3px solid white !important;
          transform: translate(2px, -2px) !important;
        }
        .ReactCrop__drag-handle.ord-sw {
          border-bottom: 3px solid white !important;
          border-left: 3px solid white !important;
          transform: translate(-2px, 2px) !important;
        }
        .ReactCrop__drag-handle.ord-se {
          border-bottom: 3px solid white !important;
          border-right: 3px solid white !important;
          transform: translate(2px, 2px) !important;
        }

        /* Make sure crop boundary handles scale properly */
        .ReactCrop {
          max-width: ${zoom === 1 ? '100%' : 'none'};
        }
      `}</style>

      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/50 z-10 backdrop-blur-md shrink-0">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10" title="Cancel">
          <X size={20} />
        </button>
        <span className="text-white/80 font-medium text-sm hidden sm:block">Edit Image</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full mr-2">
            <button onClick={() => setZoom(Math.max(1, zoom - 0.5))} className="text-white/50 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6" style={{display: 'none'}}/><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"/></svg></button>
            <input 
              type="range" min="1" max="4" step="0.1" value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-16 sm:w-24 h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
            <button onClick={() => setZoom(Math.min(4, zoom + 0.5))} className="text-white/50 hover:text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/></svg></button>
            <span className="text-[10px] font-mono text-white/50 w-6 tabular-nums">{Math.round(zoom * 100)}%</span>
          </div>

          {activeTab === 'crop' && completedCrop && (
            <button onClick={() => setShowCropPreview(!showCropPreview)} className="text-white/80 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5 p-2 rounded-full hover:bg-white/10 shrink-0">
              {showCropPreview ? 'Edit Crop' : 'Preview Crop'}
            </button>
          )}
          <button onClick={resetEdits} className="text-accent-400 hover:text-accent-300 transition-colors text-sm font-medium flex items-center gap-1.5 p-2 -mr-2 rounded-full hover:bg-accent-500/10 shrink-0">
            <Undo2 size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Main Edit Area - Scrollable for Zoom */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`flex-1 w-full h-full relative ${zoom > 1 ? 'overflow-auto cursor-grab active:cursor-grabbing' : 'overflow-hidden flex items-center justify-center p-4'}`}
      >
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm shadow-xl animate-slide-in-top">
            {error}
          </div>
        )}
        
        <div 
          className={`relative transition-opacity duration-200 ${isPreviewLoading ? 'opacity-50' : 'opacity-100'} ${zoom > 1 ? 'm-auto w-max h-max p-8' : 'flex items-center justify-center w-full h-full'} pointer-events-none`}
        >
          {activeTab !== 'crop' ? (
            <img
              src={croppedSrc || previewSrc}
              alt="Preview"
              className="pointer-events-auto"
              draggable={false}
              style={{ 
                filter: filterStyle, 
                transition: 'filter 0.1s ease', 
                display: 'block',
                ...imgScaleStyle 
              }}
            />
          ) : showCropPreview && croppedSrc ? (
            <img
              src={croppedSrc}
              alt="Cropped preview"
              className="pointer-events-auto"
              draggable={false}
              style={{ 
                filter: filterStyle, 
                transition: 'filter 0.1s ease', 
                display: 'block',
                ...imgScaleStyle 
              }}
            />
          ) : (
            <div className="pointer-events-auto">
              <ReactCrop
                crop={crop}
                aspect={aspect}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="shadow-2xl"
                style={{ maxWidth: zoom === 1 ? '100%' : 'none', maxHeight: zoom === 1 ? 'calc(100vh - 250px)' : 'none' }}
              >
                <img
                  src={previewSrc}
                  alt="Edit preview"
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{ 
                    filter: filterStyle, 
                    transition: 'filter 0.1s ease',
                    display: 'block',
                    ...imgScaleStyle
                  }}
                />
              </ReactCrop>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Panel */}
      <div className="w-full bg-[#111111] border-t border-white/5 pb-safe z-10">
        
        {/* Sub-tools Area */}
        <div className="h-[100px] flex items-center justify-center px-4 md:px-8 border-b border-white/5">
          {activeTab === 'crop' && (
            <div className="flex items-center gap-4 md:gap-6 overflow-x-auto w-full max-w-3xl justify-start md:justify-center pb-2 md:pb-0 scrollbar-none px-2">
              <ToolBtn active={aspect === undefined} onClick={() => handleAspectClick(undefined)} icon={CropIcon} label="Free" />
              <ToolBtn active={aspect === 1} onClick={() => handleAspectClick(1)} icon={Square} label="Square" />
              <ToolBtn active={aspect === 16/9} onClick={() => handleAspectClick(16/9)} icon={Monitor} label="16:9" />
              <ToolBtn active={aspect === 4/3} onClick={() => handleAspectClick(4/3)} icon={RectangleHorizontal} label="4:3" />
              <ToolBtn active={aspect === 9/16} onClick={() => handleAspectClick(9/16)} icon={Smartphone} label="9:16" />
              
              <div className="w-px h-8 bg-white/10 shrink-0 mx-1" />
              
              <ToolBtn active={false} onClick={() => handleRotate(-90)} icon={RotateCcw} label="Left" />
              <ToolBtn active={false} onClick={() => handleRotate(90)} icon={RotateCw} label="Right" />
              
              <div className="w-px h-8 bg-white/10 shrink-0 mx-1" />
              
              <ToolBtn active={flipH} onClick={() => setFlipH(!flipH)} icon={FlipHorizontal} label="Flip H" />
              <ToolBtn active={flipV} onClick={() => setFlipV(!flipV)} icon={FlipVertical} label="Flip V" />
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="flex flex-col gap-3 w-full max-w-md">
              <Slider label="Brightness" value={adjustments.brightness} min={0} max={200} onChange={(v) => setAdjustments(a => ({...a, brightness: v}))} />
              <Slider label="Saturation" value={adjustments.saturation} min={0} max={200} onChange={(v) => setAdjustments(a => ({...a, saturation: v}))} />
              <Slider label="Blur" value={adjustments.blur} min={0} max={20} step={0.5} onChange={(v) => setAdjustments(a => ({...a, blur: v}))} />
            </div>
          )}

          {activeTab === 'export' && (
            <div className="flex items-center justify-center gap-6 w-full max-w-3xl overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <div className="flex flex-col gap-1.5 shrink-0">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Format</span>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-500 outline-none">
                  <option value="png" className="bg-[#111] text-white">PNG</option>
                  <option value="jpeg" className="bg-[#111] text-white">JPEG</option>
                  <option value="webp" className="bg-[#111] text-white">WebP</option>
                </select>
              </div>
              <div className="w-px h-8 bg-white/10 shrink-0" />
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Width (px)</span>
                  <input type="number" value={resize.width} onChange={(e) => setResize({ ...resize, width: e.target.value })} placeholder="Auto" className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-500 outline-none placeholder:text-white/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Height (px)</span>
                  <input type="number" value={resize.height} onChange={(e) => setResize({ ...resize, height: e.target.value })} placeholder="Auto" className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-500 outline-none placeholder:text-white/20" />
                </div>
              </div>
              <div className="w-px h-8 bg-white/10 shrink-0" />
              <div className="flex items-center gap-2 shrink-0 pt-4">
                <button onClick={() => handleSave('replace')} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <Save size={16} /> Replace
                </button>
                <button onClick={() => handleSave('saveAs')} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <CopyPlus size={16} /> Save as New
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Tab Bar */}
        <div className="flex items-center justify-center gap-2 p-3 bg-black/40">
          <TabBtn active={activeTab === 'crop'} onClick={() => setActiveTab('crop')} icon={CropIcon} label="Crop" />
          <TabBtn active={activeTab === 'adjust'} onClick={() => setActiveTab('adjust')} icon={SlidersHorizontal} label="Adjust" />
          <TabBtn active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={Download} label="Export" />
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ────────────────────────────────────────────────────────── */

const TabBtn = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 w-20 py-2 rounded-xl transition-all duration-200
      ${active ? 'text-accent-400 bg-white/5' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
  >
    <Icon size={20} className={active ? 'drop-shadow-[0_0_8px_rgba(var(--color-accent-400),0.5)]' : ''} />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);

const ToolBtn = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 shrink-0 transition-colors
      ${active ? 'text-accent-400' : 'text-white/50 hover:text-white'}`}
  >
    <div className={`p-3 rounded-full transition-colors ${active ? 'bg-accent-500/15' : 'bg-white/5 hover:bg-white/10'}`}>
      <Icon size={18} />
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const Slider = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="flex items-center gap-4">
    <span className="text-xs text-white/60 w-16 text-right shrink-0">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none outline-none 
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white 
                 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
    />
    <span className="text-xs font-mono text-white/80 w-8 tabular-nums">{value}</span>
  </div>
);

export default ImageEditor;
