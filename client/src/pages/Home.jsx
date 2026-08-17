import { useState, useEffect } from 'react';
import { FolderSearch, Clock, Trash2, HardDrive, AlertCircle, ArrowRight } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';

const Home = ({ onScanComplete }) => {
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState('');
  const {
    scanStatus, scanError,
    history, deleteHistory, fetchHistory, startScanAction,
  } = useGalleryStore();
  
  const isScanning = scanStatus === 'scanning';
  const displayError = localError || scanError;

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleScan = async (pathToScan) => {
    const path = pathToScan || inputValue.trim();
    if (!path) {
      setLocalError('Please enter a directory path');
      return;
    }
    setLocalError('');
    startScanAction(path);
    if (onScanComplete) onScanComplete();
  };

  const handleDelete = (e, path) => {
    e.stopPropagation();
    deleteHistory(path);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.25rem)] px-4 py-12 overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-accent-600/8 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-violet-700/5 blur-[100px]" />

      {/* Hero */}
      <div className="relative text-center mb-10 animate-slide-up" style={{ animationDelay: '0ms' }}>
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[14px] bg-gradient-to-br from-accent-500 to-violet-600 mb-6 shadow-accent-glow mx-auto">
          <FolderSearch size={28} className="text-white" />
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-surface-50 tracking-tight mb-4 text-balance">
          Your media,{' '}
          <span className="bg-gradient-to-r from-accent-400 to-violet-400 bg-clip-text text-transparent">
            beautifully
          </span>{' '}
          organized.
        </h1>
        <p className="text-surface-500 text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
          Browse and search media files from any local or network directory.
        </p>
      </div>

      {/* Input card */}
      <div
        className="relative w-full max-w-xl animate-slide-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="card p-5 sm:p-6">

          <label htmlFor="path-input" className="block text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">
            Directory Path
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="path-input"
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setLocalError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
              placeholder={String.raw`C:\Users\Photos  or  \\server\share\path`}
              className="input-base flex-1 font-mono text-sm"
              disabled={isScanning}
              autoFocus
            />
            <button
              id="scan-btn"
              onClick={() => handleScan()}
              disabled={isScanning || !inputValue.trim()}
              className="btn-primary flex-shrink-0 h-11"
            >
              {isScanning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <FolderSearch size={15} />
                  Scan
                </>
              )}
            </button>
          </div>

          {displayError && (
            <div className="mt-3 flex items-start gap-2 text-red-400 text-sm animate-fade-in">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <p className="mt-3 text-[11px] text-surface-700">
            Supports local paths, UNC paths (\\server\share), and mapped drives.
          </p>
        </div>

        {/* Recent scans */}
        {history && history.length > 0 && (
          <div className="mt-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Clock size={12} className="text-surface-700" />
              <span className="text-[10px] text-surface-700 font-bold uppercase tracking-widest">Recent Scans</span>
            </div>

            <div className="flex flex-col gap-1">
              {history.slice(0, 6).map((session) => (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  className="group flex items-center gap-3 px-4 py-3 rounded-card
                             border border-surface-800/60 hover:border-surface-700
                             hover:bg-surface-900/80 transition-all duration-150
                             text-left w-full cursor-pointer"
                  onClick={() => { setInputValue(session.path); handleScan(session.path); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setInputValue(session.path); handleScan(session.path); } }}
                >
                  <HardDrive size={13} className="text-surface-700 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-300 font-medium truncate group-hover:text-surface-100 transition-colors">
                      {session.label || session.path}
                    </p>
                    {session.label && (
                      <p className="text-[11px] text-surface-700 font-mono truncate">{session.path}</p>
                    )}
                  </div>

                  <span className="text-[11px] text-surface-700 flex-shrink-0 tabular-nums">
                    {(session.fileCount || 0).toLocaleString()} files
                  </span>

                  <ArrowRight size={13} className="text-surface-700 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />

                  <button
                    id={`delete-session-${session.id}`}
                    onClick={(e) => handleDelete(e, session.path)}
                    className="btn-danger p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ml-1"
                    aria-label="Delete session"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decorative grid hint */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.015]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgb(var(--surface-400)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--surface-400)) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
      </div>
    </div>
  );
};

export default Home;
