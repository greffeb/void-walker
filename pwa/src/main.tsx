import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from './registerSW'

// Register service worker with update detection
registerSW({
  onNeedRefresh: () => {
    // Show a simple notification that new content is available
    console.log('New version available! Reloading in 3 seconds...');

    // You can replace this with a toast notification if you add a toast library
    const shouldUpdate = confirm(
      'Une nouvelle version est disponible ! Voulez-vous recharger maintenant ?'
    );

    if (shouldUpdate) {
      window.location.reload();
    }
  },
  onOfflineReady: () => {
    console.log('App ready to work offline!');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
