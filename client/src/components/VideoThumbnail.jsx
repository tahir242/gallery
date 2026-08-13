import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

const VideoThumbnail = ({ src, name }) => {
  const [status, setStatus] = useState('loading');
  const videoRef = useRef(null);

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  return (
    <div className="relative w-full h-full aspect-video flex items-center justify-center bg-surface-900 group/video">
      {status === 'loading' && <div className="absolute inset-0 skeleton" />}
      
      <video
        ref={videoRef}
        src={`${src}#t=0.1`}
        preload="metadata"
        muted
        playsInline
        onLoadedData={() => setStatus('ready')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        aria-label={`Video thumbnail for ${name}`}
      />
      
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover/video:bg-black/30 pointer-events-none">
        <div className="w-10 h-10 rounded-full bg-accent-600/60 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg transition-transform scale-95 group-hover/video:scale-105">
          <Play size={18} className="text-white ml-1 shadow-sm" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default VideoThumbnail;
