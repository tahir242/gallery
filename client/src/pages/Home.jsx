import { useState, useEffect } from 'react';
import { FolderSearch, Clock, Trash2, HardDrive, AlertCircle, ArrowRight, Image as ImageIcon, Video, FileText, Music, ChevronDown, ChevronUp } from 'lucide-react';
import useGalleryStore from '../store/galleryStore';

const GROUPS = [
  { id: 'image', label: 'Photos', icon: ImageIcon, exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif', 'svg', 'heic', 'heif', 'avif', 'ico'] },
  { id: 'video', label: 'Videos', icon: Video, exts: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp'] },
  { id: 'audio', label: 'Audio', icon: Music, exts: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'] },
  { id: 'document', label: 'Documents', icon: FileText, exts: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'] }
];

const Home = ({ onScanComplete }) => {
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState('');
  const [selectedGroups, setSelectedGroups] = useState({ image: true, video: true, audio: false, document: false });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedExts, setSelectedExts] = useState(new Set([...GROUPS[0].exts, ...GROUPS[1].exts]));

  const {
    scanStatus, scanError,
    history, deleteHistory, fetchHistory, startScanAction,
  } = useGalleryStore();
  
  const isScanning = scanStatus === 'scanning';
  const displayError = localError || scanError;

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleGroup = (groupId) => {
    const group = GROUPS.find(g => g.id === groupId);
    const isSelected = !selectedGroups[groupId];
    setSelectedGroups(prev => ({ ...prev, [groupId]: isSelected }));
    
    setSelectedExts(prev => {
      const next = new Set(prev);
      if (isSelected) {
        group.exts.forEach(e => next.add(e));
      } else {
        group.exts.forEach(e => next.delete(e));
      }
      return next;
    });
  };

  const toggleExt = (ext, groupId) => {
    setSelectedExts(prev => {
      const next = new Set(prev);
      if (next.has(ext)) next.delete(ext);
      else next.add(ext);
      
      // Update group status if all or none selected
      const group = GROUPS.find(g => g.id === groupId);
      const allSelected = group.exts.every(e => next.has(e));
      const noneSelected = group.exts.every(e => !next.has(e));
      
      setSelectedGroups(g => ({
        ...g,
        [groupId]: allSelected ? true : noneSelected ? false : g[groupId] // keep current if mixed
      }));
      
      return next;
    });
  };

  const handleScan = async (pathToScan, sessionExts) => {
    const path = pathToScan || inputValue.trim();
    if (!path) {
      setLocalError('Please enter a directory path');
      return;
    }
    
    const extsToUse = sessionExts ? sessionExts : Array.from(selectedExts);
    
    if (extsToUse.length === 0) {
      setLocalError('Please select at least one file type to index');
      return;
    }
    setLocalError('');
    startScanAction(path, extsToUse);
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
      <div className="relative text-center mb-8 animate-slide-up" style={{ animationDelay: '0ms' }}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[14px] bg-gradient-to-br from-accent-500 to-violet-600 mb-5 shadow-accent-glow mx-auto">
          <FolderSearch size={24} className="text-white" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-surface-50 tracking-tight mb-3 text-balance">
          Your media,{' '}
          <span className="bg-gradient-to-r from-accent-400 to-violet-400 bg-clip-text text-transparent">
            beautifully
          </span>{' '}
          organized.
        </h1>
        <p className="text-surface-500 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Where are your files located?
        </p>
      </div>

      {/* Input card */}
      <div
        className="relative w-full max-w-xl animate-slide-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="card p-5 sm:p-6 mb-4">

          <div className="flex flex-col gap-3 sm:flex-row mb-6">
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
              disabled={isScanning || !inputValue.trim() || selectedExts.size === 0}
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
          
          <div className="mb-2">
            <label className="block text-xs font-semibold text-surface-500 uppercase tracking-widest mb-3">
              What should we look for?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {GROUPS.map(group => {
                const Icon = group.icon;
                const isSelected = selectedGroups[group.id];
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-150 ${
                      isSelected 
                        ? 'bg-accent-500/10 border-accent-500/50 text-accent-400' 
                        : 'bg-surface-900 border-surface-800 text-surface-400 hover:bg-surface-800'
                    }`}
                  >
                    <Icon size={20} className="mb-2" />
                    <span className="text-xs font-medium">{group.label}</span>
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
            >
              {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Advanced Options
            </button>
            
            {advancedOpen && (
              <div className="mt-3 p-3 bg-surface-900/50 rounded-lg border border-surface-800 space-y-3">
                {GROUPS.map(group => (
                  <div key={group.id}>
                    <p className="text-[10px] uppercase font-semibold text-surface-600 mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.exts.map(ext => {
                        const checked = selectedExts.has(ext);
                        return (
                          <button
                            key={ext}
                            onClick={() => toggleExt(ext, group.id)}
                            className={`px-2 py-1 text-[10px] font-mono rounded-md border transition-colors ${
                              checked 
                                ? 'bg-accent-500/10 border-accent-500/30 text-accent-300' 
                                : 'bg-surface-950 border-surface-800 text-surface-500 hover:text-surface-300'
                            }`}
                          >
                            .{ext}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {displayError && (
            <div className="mt-3 flex items-start gap-2 text-red-400 text-sm animate-fade-in">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{displayError}</span>
            </div>
          )}
        </div>

        {/* Recent scans */}
        {history && history.length > 0 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-2 px-1 mt-2">
              <Clock size={12} className="text-surface-700" />
              <span className="text-[10px] text-surface-700 font-bold uppercase tracking-widest">Recent Scans</span>
            </div>

            <div className="flex flex-col gap-1">
              {history.slice(0, 4).map((session) => (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  className="group flex items-center gap-3 px-4 py-3 rounded-card
                             border border-surface-800/60 hover:border-surface-700
                             hover:bg-surface-900/80 transition-all duration-150
                             text-left w-full cursor-pointer"
                  onClick={() => { setInputValue(session.path); handleScan(session.path, session.selectedExtensions); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setInputValue(session.path); handleScan(session.path, session.selectedExtensions); } }}
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
