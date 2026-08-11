import { useState } from 'react';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import useGalleryStore from './store/galleryStore';

function App() {
  const { scanResult } = useGalleryStore();
  const [view, setView] = useState('home'); // 'home' | 'gallery'

  const handleScanComplete = () => {
    setView('gallery');
  };

  const handleHome = () => {
    setView('home');
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-950">
      <Header onHomeClick={handleHome} />

      {view === 'home' || !scanResult ? (
        <Home onScanComplete={handleScanComplete} />
      ) : (
        <Gallery />
      )}
    </div>
  );
}

export default App;
