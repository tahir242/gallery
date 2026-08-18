import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Table2, AlertCircle, Loader2 } from 'lucide-react';

const SpreadsheetViewer = ({ src, name }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSpreadsheet = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error('Failed to fetch spreadsheet');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (isMounted) {
          setWorkbook(wb);
          if (wb.SheetNames.length > 0) {
            setActiveSheet(wb.SheetNames[0]);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading spreadsheet:', err);
          setError(err.message || 'Failed to load spreadsheet');
          setLoading(false);
        }
      }
    };

    if (src) {
      loadSpreadsheet();
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  const getSheetData = () => {
    if (!workbook || !activeSheet) return [];
    const worksheet = workbook.Sheets[activeSheet];
    if (!worksheet) return [];
    // Get array of arrays for the sheet rows
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  };

  const sheetData = getSheetData();
  // Ensure we at least have header row structure if data is present but sparse
  const numCols = sheetData.length > 0 ? Math.max(...sheetData.map(row => row.length)) : 0;
  
  return (
    <div
      className="relative flex justify-center items-center w-full h-full animate-zoom-in overflow-hidden pt-20 pb-24 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full h-full max-w-[95vw] bg-white rounded-card shadow-2xl overflow-auto custom-scrollbar flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-accent-500 animate-spin mb-4" />
              <p className="text-gray-500 font-medium tracking-wide">Loading spreadsheet...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center text-red-500 bg-red-50 px-8 py-6 rounded-2xl">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="font-semibold text-lg mb-2 text-red-600">Error Loading File</p>
              <p className="text-sm opacity-90 max-w-md text-center">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && workbook && (
          <>
            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-white">
              {sheetData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Table2 className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-gray-500">This sheet is empty</p>
                </div>
              ) : (
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        {/* Row Numbers Column Header */}
                        <th className="w-14 border-b border-r border-gray-300 bg-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-600 sticky left-0 z-20 shadow-[1px_0_0_0_#d1d5db]">
                          #
                        </th>
                        {/* Actual Data Headers (First Row) */}
                        {Array.from({ length: numCols }).map((_, colIndex) => {
                          const headerCell = sheetData[0][colIndex];
                          return (
                            <th 
                              key={`header-${colIndex}`}
                              className="border-b border-r border-gray-300 bg-gray-100 px-4 py-2.5 text-left text-sm font-semibold text-gray-800 whitespace-nowrap"
                            >
                              {headerCell !== undefined && headerCell !== null ? String(headerCell) : ''}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {sheetData.slice(1).map((row, rowIndex) => (
                        <tr 
                          key={`row-${rowIndex}`} 
                          className="hover:bg-blue-50 transition-colors even:bg-gray-50/70"
                        >
                          {/* Row Number */}
                          <td className="border-b border-r border-gray-200 bg-gray-100/80 px-3 py-2 text-center text-xs font-medium text-gray-500 sticky left-0 z-10 shadow-[1px_0_0_0_#e5e7eb] w-14">
                            {rowIndex + 2}
                          </td>
                          {/* Data Cells */}
                          {Array.from({ length: numCols }).map((_, colIndex) => {
                            const cellData = row[colIndex];
                            return (
                              <td 
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="border-b border-r border-gray-200 px-4 py-2 text-sm text-gray-700 whitespace-pre-wrap min-w-[100px] max-w-sm break-words"
                              >
                                {cellData !== undefined && cellData !== null ? String(cellData) : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Bottom Tab Bar */}
      {!loading && !error && workbook && workbook.SheetNames.length > 1 && (
        <div 
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-pill px-2 py-1.5 shadow-overlay max-w-[80vw] overflow-x-auto custom-scrollbar"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {workbook.SheetNames.map((sheetName) => (
            <button
              key={sheetName}
              onClick={() => setActiveSheet(sheetName)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeSheet === sheetName
                  ? 'bg-accent-500 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpreadsheetViewer;
