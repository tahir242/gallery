import FolderTree from '../components/FolderTree';
import MediaGrid from '../components/MediaGrid';
import LightBox from '../components/LightBox';
import useGalleryStore from '../store/galleryStore';
const Gallery = () => {
  return (
    <div className="relative flex flex-1 min-h-0 overflow-hidden">
      {/* Sidebar — always mounted, visibility controlled by transform in FolderTree */}
      <FolderTree />

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <MediaGrid />
      </main>

      {/* Lightbox */}
      <LightBox />
    </div>
  );
};

export default Gallery;
