import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW, skipWaiting } from './registerSW'
import { UpdateNotification } from './components/UpdateNotification'

// Track if we're showing the update notification
let updateNotificationRoot: ReturnType<typeof createRoot> | null = null;

// Register service worker with update detection
registerSW({
  onNeedRefresh: () => {
    console.log('[Update] New version available! Showing notification...');

    // Show update notification banner
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'update-notification';
    document.body.appendChild(notificationContainer);

    updateNotificationRoot = createRoot(notificationContainer);
    updateNotificationRoot.render(
      <UpdateNotification
        onRefresh={() => {
          console.log('[Update] User clicked refresh or auto-refresh triggered');
          // Skip waiting and reload immediately
          skipWaiting();
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }}
      />
    );
  },
  onOfflineReady: () => {
    console.log('[SW] App ready to work offline!');
  },
});

// Display build information in console
declare const __BUILD_ID__: string;
declare const __BUILD_TIME__: string;

console.log(`[Build] Version: ${__BUILD_ID__}`);
console.log(`[Build] Time: ${__BUILD_TIME__}`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
