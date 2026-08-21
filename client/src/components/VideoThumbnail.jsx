import { useState, useRef, useEffect, useCallback } from 'react';
import { Play } from 'lucide-react';

const VideoThumbnail = ({ src, name }) => {
  const [status, setStatus] = useState('idle'); // idle → loading → ready/error
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Reset when src changes
  useEffect(() => {
    setStatus('idle');
    setIsVisible(false);
  }, [src]);

  // IntersectionObserver: only load video src when card enters the viewport.
  // When it leaves, clear src so the browser releases the decode buffer,
  // HTTP connection, and media pipeline — preventing multi-GB memory leaks.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setStatus('loading');
        } else {
          setIsVisible(false);
          setStatus('idle');
          // Clear src so the browser frees decode buffers immediately
          if (videoRef.current) {
            videoRef.current.src = '';
            videoRef.current.load();
          }
        }
      },
      // 600px pre-load distance: large enough that videos in all masonry columns
      // have time to load before the user scrolls to them.
      { rootMargin: '600px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  const handleLoaded = useCallback(() => setStatus('ready'), []);
  const handleError  = useCallback(() => setStatus('error'),  []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full aspect-video flex items-center justify-center bg-surface-900 group/video"
    >
      {/* Skeleton while not yet loaded */}
      {(status === 'idle' || status === 'loading') && (
        <div className="absolute inset-0 skeleton" />
      )}

      {/* Video element — src only assigned when visible to prevent memory leak */}
      <video
        ref={videoRef}
        src={isVisible ? `${src}#t=0.1` : undefined}
        preload={isVisible ? 'metadata' : 'none'}
        muted
        playsInline
        onLoadedData={handleLoaded}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        aria-label={`Video thumbnail for ${name}`}
      />

      {/* Play overlay — always visible */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover/video:bg-black/30 pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-accent-600/60 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg transition-transform scale-95 group-hover/video:scale-105">
          <Play size={18} className="text-white ml-1 shadow-sm" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default VideoThumbnail;
