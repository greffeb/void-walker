/**
 * Service Worker registration with aggressive update detection and cache busting
 *
 * This ensures that when a new version is deployed:
 * 1. The service worker detects the update immediately
 * 2. The app shows a notification to the user
 * 3. On user confirmation (or automatically), the page reloads with fresh content
 */

interface UpdateCallback {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

export function registerSW(callbacks?: UpdateCallback) {
  // Only register service worker in production
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return;
  }

  // Log build information if available
  const buildIdMeta = document.querySelector('meta[name="build-id"]');
  const buildTimeMeta = document.querySelector('meta[name="build-time"]');
  if (buildIdMeta && buildTimeMeta) {
    console.log(
      `[Cache Buster] Current build: ${buildIdMeta.getAttribute('content')} at ${buildTimeMeta.getAttribute('content')}`
    );
  }

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration);

        // Check for updates immediately
        registration.update();

        // Check for updates every 60 seconds (aggressive for dev, adjust for production)
        setInterval(() => {
          console.log('[SW] Checking for updates...');
          registration.update();
        }, 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          console.log('[SW] New version found, installing...');

          installingWorker.addEventListener('statechange', () => {
            console.log('[SW] State changed to:', installingWorker.state);

            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available
                console.log('[SW] New content available, prompting user to refresh');

                if (callbacks?.onNeedRefresh) {
                  callbacks.onNeedRefresh();
                } else {
                  // Auto-reload after 2 seconds if no callback provided
                  console.log('[SW] Auto-reloading in 2 seconds...');
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              } else {
                // Content is cached for offline use
                console.log('[SW] Content cached for offline use');
                callbacks?.onOfflineReady?.();
              }
            }
          });
        });

        // Handle waiting service worker
        if (registration.waiting) {
          console.log('[SW] Service worker waiting, activating immediately');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
      });

    // Handle controller change (when new SW takes over)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[SW] Controller changed, reloading page');
      window.location.reload();
    });
  });
}

/**
 * Utility to force skip waiting and activate new service worker immediately
 */
export function skipWaiting() {
  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

/**
 * Utility to unregister all service workers (useful for debugging)
 */
export async function unregisterAllServiceWorkers() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Unregistered service worker:', registration);
    }
  }
}
