import FolderTree from '../components/FolderTree';
import SearchBar from '../components/SearchBar';
import MediaGrid from '../components/MediaGrid';
import LightBox from '../components/LightBox';
import useGalleryStore from '../store/galleryStore';

const Gallery = () => {
  const { sidebarOpen } = useGalleryStore();

  return (
    <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <FolderTree />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 h-full flex flex-col">
          {/* Search bar */}
          <div className="mb-5">
            <SearchBar />
          </div>

          {/* Media grid */}
          <MediaGrid />
        </div>
      </main>

      {/* Lightbox */}
      <LightBox />
    </div>
  );
};

export default Gallery;
