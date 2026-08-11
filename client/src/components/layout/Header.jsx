import { Images, Menu, X } from 'lucide-react';
import useGalleryStore from '../../store/galleryStore';

const Header = ({ onHomeClick }) => {
  const { scanResult, toggleSidebar, sidebarOpen, resetScan } = useGalleryStore();

  const handleHome = () => {
    resetScan();
    if (onHomeClick) onHomeClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-800 bg-surface-950/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 max-w-screen-2xl mx-auto">
        {/* Left: Logo + hamburger */}
        <div className="flex items-center">
          <button
            id="home-btn"
            onClick={handleHome}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center shadow-accent-glow">
              <Images size={16} className="text-white" />
            </div>
            <span className="font-semibold text-surface-100 tracking-tight text-base group-hover:text-accent-300 transition-colors">
              Gallery
            </span>
          </button>

          {scanResult && (
            <>
              <div className="h-6 w-px bg-surface-800 mx-4" />
              <button
                id="sidebar-toggle"
                onClick={toggleSidebar}
                className="flex items-center justify-center w-8 h-8 rounded-md border border-surface-800 bg-surface-900 hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
              </button>
            </>
          )}
        </div>

        {/* Right: scan info */}
        {scanResult && (
          <div className="flex items-center gap-4 text-sm text-surface-500">
            <span className="hidden sm:block">
              <span className="text-surface-300 font-medium">{scanResult.fileCount}</span>
              {' '}files
            </span>
            <span className="hidden md:block truncate max-w-xs text-surface-600 font-mono text-xs">
              {scanResult.path}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
