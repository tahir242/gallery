import { useState, useEffect } from 'react';
import { FolderSearch, Clock, Trash2, HardDrive, AlertCircle } from 'lucide-react';
import { scanDirectory, getHistory, deleteSession } from '../services/api';
import useGalleryStore from '../store/galleryStore';

const Home = ({ onScanComplete }) => {
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState('');
  const { isScanning, setIsScanning, setScanResult, setScanError, setCurrentPath, history, setHistory } = useGalleryStore();

  useEffect(() => {
    // Load history on mount
    getHistory()
      .then(({ sessions }) => setHistory(sessions))
      .catch(() => {});
  }, []);

  const handleScan = async (pathToScan) => {
    const path = pathToScan || inputValue.trim();
    if (!path) {
      setLocalError('Please enter a directory path');
      return;
    }
    setLocalError('');
    setCurrentPath(path);
    setIsScanning(true);

    try {
      const result = await scanDirectory(path);
      setScanResult(result);
      if (onScanComplete) onScanComplete();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Scan failed';
      setScanError(msg);
      setLocalError(msg);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteSession(id);
      setHistory(history.filter((s) => s._id !== id));
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent-600/15 border border-accent-500/25 mb-6 shadow-accent-glow">
          <FolderSearch size={36} className="text-accent-400" />
        </div>
        <h1 className="text-4xl font-bold text-surface-50 tracking-tight mb-3">
          Gallery
        </h1>
        <p className="text-surface-400 text-lg max-w-md mx-auto leading-relaxed">
          Browse and search media files from any local or network directory
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-2xl animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="card p-6">
          <label htmlFor="path-input" className="block text-sm font-medium text-surface-300 mb-2">
            Directory Path
          </label>

          <div className="flex gap-2">
            <input
              id="path-input"
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setLocalError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
              placeholder="\\server\share\path  or  C:\Users\Photos"
              className="input-base flex-1 font-mono text-sm"
              disabled={isScanning}
              autoFocus
            />
            <button
              id="scan-btn"
              onClick={() => handleScan()}
              disabled={isScanning || !inputValue.trim()}
              className="btn-primary flex-shrink-0"
            >
              {isScanning ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <FolderSearch size={16} />
                  Scan
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {localError && (
            <div className="mt-3 flex items-start gap-2 text-red-400 text-sm animate-fade-in">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* Hints */}
          <p className="mt-3 text-xs text-surface-600">
            Supports UNC paths (\\server\share), local paths (C:\folder), and mapped drives
          </p>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Clock size={14} className="text-surface-600" />
              <span className="text-xs text-surface-600 font-medium uppercase tracking-wider">Recent Scans</span>
            </div>
            <div className="flex flex-col gap-1">
              {history.slice(0, 8).map((session) => (
                <div
                  key={session._id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl
                             border border-surface-800 hover:border-surface-700 hover:bg-surface-900
                             transition-all duration-150 cursor-pointer"
                  onClick={() => { setInputValue(session.path); handleScan(session.path); }}
                >
                  <HardDrive size={14} className="text-surface-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-300 font-medium truncate">{session.label}</p>
                    <p className="text-xs text-surface-600 font-mono truncate">{session.path}</p>
                  </div>
                  <span className="text-xs text-surface-600 flex-shrink-0">{session.fileCount} files</span>
                  <button
                    id={`delete-session-${session._id}`}
                    onClick={(e) => handleDelete(e, session._id)}
                    className="btn-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
