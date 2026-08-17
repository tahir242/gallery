import { useEffect, useState } from 'react';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Toast from './components/Toast';
import useGalleryStore from './store/galleryStore';

function App() {
  const { scanStatus, themePreference } = useGalleryStore();
  const [view, setView] = useState('home'); // 'home' | 'gallery'

  const handleScanComplete = () => setView('gallery');
  const handleHome = () => setView('home');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark =
        themePreference === 'dark' ||
        (themePreference === 'system' && media.matches);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themePreference]);

  const isGalleryVisible = view === 'gallery' && scanStatus !== 'idle';

  return (
    <div className={`flex flex-col bg-surface-950 ${isGalleryVisible ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header onHomeClick={handleHome} />

      {!isGalleryVisible ? (
        <Home onScanComplete={handleScanComplete} />
      ) : (
        <Gallery />
      )}

      {/* Global toast layer */}
      <Toast />
    </div>
  );
}

export default App;
