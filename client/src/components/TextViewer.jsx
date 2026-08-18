import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

const MAX_LINES = 10000;

export const TextViewer = ({ src, name }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lineCount, setLineCount] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchText = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const text = await response.text();
        
        if (isMounted) {
          const lines = text.split('\n');
          setLineCount(lines.length);
          
          if (lines.length > MAX_LINES) {
            setContent(lines.slice(0, MAX_LINES).join('\n'));
            setIsTruncated(true);
          } else {
            setContent(text);
            setIsTruncated(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load text file');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchText();

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div 
      className="relative flex justify-center items-center w-full h-full animate-zoom-in overflow-hidden pt-20 pb-24 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full h-full max-w-5xl bg-[#121212] rounded-card shadow-2xl overflow-hidden flex flex-col relative text-white/80">
        {/* Content Area */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-3 p-6 text-center">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm">{error}</p>
            </div>
          ) : content.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-white/40 italic text-sm">
              Empty file
            </div>
          ) : (
            <div className="w-full h-full">
              <div className="flex min-w-max p-4 text-sm font-mono leading-6">
                {/* Line Numbers */}
                <div 
                  className="flex flex-col text-right pr-4 select-none text-white/30 border-r border-white/10 shrink-0"
                >
                  {Array.from({ length: isTruncated ? MAX_LINES : lineCount }).map((_, i) => (
                    <span key={i} className="min-w-[3ch]">{i + 1}</span>
                  ))}
                </div>
                
                {/* Text Content */}
                <pre className="pl-4 m-0 whitespace-pre text-white/80 tab-size-4">
                  {content}
                </pre>
              </div>
              
              {isTruncated && (
                <div className="sticky bottom-0 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pt-8 pb-4 text-center text-yellow-500/80 text-sm font-medium border-t border-white/5">
                  File truncated to {MAX_LINES} lines
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Info Bar */}
      {!loading && !error && lineCount > 0 && (
        <div 
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-pill px-3 py-1.5 shadow-overlay text-white/70 text-xs font-mono"
        >
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          {isTruncated && ' (truncated)'}
        </div>
      )}
    </div>
  );
};

export default TextViewer;
