import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, Repeat, SkipBack, SkipForward, Loader2, AlertCircle } from 'lucide-react';

const formatTime = (time) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioPlayer = ({ src, name }) => {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (!isRepeat) {
        setIsPlaying(false);
      }
    };
    const handleError = (e) => {
      console.error('Audio playback error', e);
      setError('Failed to load audio file.');
      setIsLoading(false);
    };
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isRepeat]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space key for play/pause, but only if we're not focusing an input
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isLoading, error]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current || error || isLoading) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleProgressClick = (e) => {
    if (!progressRef.current || !audioRef.current || error) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (amount) => {
    if (!audioRef.current || error) return;
    audioRef.current.currentTime = Math.max(0, Math.min(currentTime + amount, duration));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="flex flex-col items-center justify-center w-full h-full px-6 pt-20 pb-24 animate-zoom-in text-white"
      onClick={(e) => e.stopPropagation()}
    >
      <audio 
        ref={audioRef} 
        src={src} 
        loop={isRepeat}
        preload="metadata"
      />

      <div className="w-full max-w-md p-8 flex flex-col items-center">
        {/* Album Art Placeholder */}
        <div className="w-32 h-32 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
          ) : error ? (
            <AlertCircle className="w-12 h-12 text-red-500" />
          ) : (
            <Music className="w-16 h-16 text-gray-500" />
          )}
          {isPlaying && !isLoading && !error && (
            <div className="absolute inset-0 bg-accent-500/10 animate-pulse mix-blend-overlay"></div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-8 w-full">
          <h2 className="text-xl font-bold truncate px-4" title={name}>
            {name || 'Unknown Audio'}
          </h2>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-8 w-full">
          <button 
            onClick={() => handleSkip(-10)}
            className="p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            disabled={!!error || isLoading}
            aria-label="Skip backward 10 seconds"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={!!error || isLoading}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none focus:ring-4 focus:ring-accent-500/50 ${
              error || isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-accent-500 hover:bg-accent-600 hover:scale-105 active:scale-95 text-white'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button 
            onClick={() => handleSkip(10)}
            className="p-3 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            disabled={!!error || isLoading}
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3 mb-6">
          <span className="text-xs text-gray-400 font-medium w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative group"
          >
            <div 
              className="absolute top-0 left-0 h-full bg-accent-500 rounded-full group-hover:bg-accent-400 transition-colors"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Playhead handle */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>

          <span className="text-xs text-gray-400 font-medium w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Bottom Controls: Volume & Repeat */}
        <div className="flex items-center justify-between w-full text-gray-400">
          <div className="flex items-center gap-2 group">
            <button 
              onClick={toggleMute}
              className="p-2 hover:text-white transition-colors rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 rounded-full bg-white/10 cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100"
              style={{ accentColor: 'var(--color-accent-500, #3b82f6)' }}
              aria-label="Volume"
            />
          </div>

          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-2 transition-colors rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 ${
              isRepeat ? 'text-accent-500' : 'hover:text-white'
            }`}
            aria-label={isRepeat ? 'Disable repeat' : 'Enable repeat'}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
