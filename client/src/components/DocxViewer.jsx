import React, { useEffect, useState } from 'react';
import mammoth from 'mammoth';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

const DocxViewer = ({ src, name }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndConvert = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(src);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const arrayBuffer = await response.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        if (isMounted) {
          setHtmlContent(result.value);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading docx:', err);
          setError('Could not load document.');
          setIsLoading(false);
        }
      }
    };

    if (src) {
      fetchAndConvert();
    } else {
      setIsLoading(false);
      setError('No source provided.');
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div
      className="relative flex justify-center items-center w-full h-full animate-zoom-in overflow-hidden pt-20 pb-24 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-4xl h-full bg-white rounded-lg shadow-2xl overflow-auto custom-scrollbar">
        {/* Document Content */}
        <div className="p-10 sm:p-16 text-black">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 font-medium text-sm">Rendering document...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <div className="text-center">
                <p className="text-red-600 font-medium mb-1">Failed to load document</p>
                <p className="text-red-500/80 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <style dangerouslySetInnerHTML={{ __html: `
                .docx-content h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
                .docx-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                .docx-content h3 { font-size: 1.25em; }
                .docx-content ul, .docx-content ol { margin-bottom: 1em; padding-left: 2em; }
                .docx-content ul { list-style-type: disc; }
                .docx-content ol { list-style-type: decimal; }
                .docx-content a { color: #2563eb; text-decoration: underline; }
                .docx-content img { max-width: 100%; height: auto; }
              `}} />
              <div 
                className="docx-content text-gray-800 max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocxViewer;
