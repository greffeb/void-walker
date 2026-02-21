# PWA Cache Busting Strategy

This document explains the comprehensive cache-busting implementation for the Void Walker PWA.

## Problem

Progressive Web Apps (PWAs) are designed to cache assets aggressively for offline functionality. While this is great for performance and offline access, it creates a challenge during development and deployment: **browsers may continue serving old cached files even after you deploy a new version**.

This is especially problematic when testing on mobile devices, where clearing cache is more cumbersome than on desktop.

## Our Solution: Three-Layer Cache Busting

We've implemented a comprehensive three-layer approach to ensure users always get the latest version:

### 1. Hash-Based Filenames (Automatic via Vite)

**What it does:** Vite automatically appends content hashes to JavaScript and CSS filenames during build.

**Example:**
- `main.js` → `main.a1b2c3d4.js`
- `styles.css` → `styles.e5f6g7h8.css`

**How it helps:** When the file content changes, the hash changes, forcing the browser to download the new file instead of using the cached version.

**No action needed** - This is built into Vite and works automatically.

---

### 2. Build ID Meta Tags (GitHub Actions)

**What it does:** During the GitHub Actions build process, we inject unique meta tags into `index.html` containing:
- The GitHub run ID (unique per workflow run)
- The GitHub run number (incremental counter)
- The build timestamp

**Implementation:** See `.github/workflows/deploy-pwa.yml` line 43-49:

```yaml
- name: Inject Build ID for cache busting
  working-directory: ./pwa
  run: |
    BUILD_ID="${{ github.run_id }}-${{ github.run_number }}"
    BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    sed -i "s|</head>|<meta name=\"build-id\" content=\"$BUILD_ID\" /><meta name=\"build-time\" content=\"$BUILD_TIME\" /></head>|" dist/index.html
```

**Result in HTML:**
```html
<head>
  ...
  <meta name="build-id" content="12345678-42" />
  <meta name="build-time" content="2024-01-15T14:30:00Z" />
</head>
```

**How it helps:**
- Changes `index.html` content on every build
- Browser sees a "different" file and fetches it
- Allows tracking which build is currently deployed
- Console logs show the current build ID for debugging

---

### 3. Service Worker Update Detection (Aggressive)

**What it does:** Custom service worker registration that:
1. Checks for updates immediately on app load
2. Checks for updates every 60 seconds
3. Automatically prompts the user when a new version is detected
4. Forces a page reload when the user confirms (or after 2 seconds if auto-enabled)

**Implementation:** See `src/registerSW.ts`

**Key features:**

- **Immediate update check:**
  ```typescript
  registration.update(); // Check on load
  ```

- **Periodic checks:**
  ```typescript
  setInterval(() => {
    registration.update();
  }, 60 * 1000); // Every 60 seconds
  ```

- **Update detection:**
  ```typescript
  registration.addEventListener('updatefound', () => {
    // Prompt user or auto-reload
  });
  ```

- **Forced activation:**
  ```typescript
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  ```

**User experience:**
1. You deploy a new version via Claude Code
2. GitHub Actions builds and deploys
3. User opens the PWA on their phone
4. Service worker detects the new version within 60 seconds (or immediately if they just opened it)
5. User sees: "Une nouvelle version est disponible ! Voulez-vous recharger maintenant ?"
6. User clicks OK → Fresh version loads
7. If user clicks Cancel → Next check in 60 seconds

---

## Configuration Details

### Vite PWA Plugin Settings

In `vite.config.ts`, we use these critical settings:

```typescript
VitePWA({
  registerType: 'prompt',          // Prompt user instead of auto-updating
  injectRegister: false,           // We handle registration manually
  workbox: {
    cleanupOutdatedCaches: true,   // Delete old cache versions
    skipWaiting: true,              // Activate new SW immediately
    clientsClaim: true,             // Take control of clients immediately
    runtimeCaching: [
      {
        // HTML files: NetworkFirst (check network, fallback to cache)
        handler: 'NetworkFirst',
        options: {
          expiration: { maxAgeSeconds: 60 * 60 } // 1 hour only
        }
      },
      {
        // API calls: NetworkOnly (never cache)
        handler: 'NetworkOnly'
      }
    ]
  }
})
```

**Why these settings?**

- `skipWaiting: true` - New service worker activates immediately instead of waiting for tabs to close
- `clientsClaim: true` - New service worker takes control of all pages immediately
- `NetworkFirst` for HTML - Always tries to fetch fresh HTML, only uses cache if offline
- `NetworkOnly` for APIs - Never cache LLM responses (they're unique per request)

---

## Testing the Cache Buster

### On Desktop (Chrome DevTools)

1. Open DevTools → Application → Service Workers
2. Check "Update on reload"
3. Click "Update" to manually trigger update check
4. See console logs: `[SW] Checking for updates...`

### On Mobile (Real-World Test)

1. Deploy a change via Claude Code
2. Open the PWA on your phone
3. Within 60 seconds, you should see the update prompt
4. OR: Close the app and reopen it (immediate check)
5. Check build ID: Open browser console and look for `[Cache Buster] Current build: ...`

### Force Clear Everything (Nuclear Option)

If you ever get stuck with a stubborn cache:

```javascript
// Run this in the browser console
import { unregisterAllServiceWorkers } from './src/registerSW';
await unregisterAllServiceWorkers();
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Troubleshooting

### "I deployed but still see the old version"

1. **Wait 60 seconds** - The periodic check might not have run yet
2. **Close and reopen the app** - This triggers an immediate update check
3. **Check the build ID in console** - Make sure the deploy actually happened
4. **Hard refresh** - On mobile: Settings → Clear browser cache for this site

### "The update prompt doesn't appear"

Check these:
1. Is the service worker registered? Console should show `[SW] Service Worker registered`
2. Is there actually a new version? Check GitHub Actions for successful deploy
3. Is the build ID different? Look at the meta tags in the deployed HTML
4. Try manually triggering: `navigator.serviceWorker.ready.then(r => r.update())`

### "It still uses old CSS/JS files"

If the service worker and HTML are updated but assets aren't:
1. The hash-based filenames should handle this automatically
2. Check that Vite is actually building with hashes: `ls -la pwa/dist/assets/`
3. Verify the new `index.html` references the new hashed files

---

## Mobile Development Workflow

With this cache buster in place, your ideal workflow becomes:

1. **Make changes** on your laptop (via Claude Code or manually)
2. **Commit and push** to your branch
3. **GitHub Actions** builds and deploys automatically
4. **Open PWA on phone** (or just wait if already open)
5. **See update prompt** within seconds
6. **Click "OK"** → Fresh version loads
7. **Test immediately** - No more cache frustration!

---

## Performance Impact

**Concerns:** Does checking every 60 seconds hurt performance?

**Answer:** Minimal impact:
- The `registration.update()` call is lightweight (just an HTTP HEAD request)
- Happens in the background, doesn't block UI
- Only downloads if there's actually a new version
- Can adjust interval in `src/registerSW.ts` if needed

**For production:** Consider increasing the interval to 5-15 minutes for deployed apps. During development, 60 seconds is ideal.

---

## Future Enhancements

Possible improvements:

1. **Better UI for update prompt:**
   - Replace `confirm()` with a toast notification
   - Show build version and timestamp
   - Add "Update later" option that reminds in 5 minutes

2. **Update changelog:**
   - Include a `CHANGELOG.md` excerpt in the prompt
   - Show what's new in this version

3. **Smart update timing:**
   - Don't interrupt active gameplay
   - Prompt only when on title screen or between sessions

4. **Analytics:**
   - Track how often users update
   - Monitor update prompt acceptance rate

---

## References

- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [Progressive Web Apps on MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
