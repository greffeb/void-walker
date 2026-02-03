import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Generate unique build ID on each build for cache busting
const buildId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
const buildTime = new Date().toISOString();

console.log(`[Build] ID: ${buildId}, Time: ${buildTime}`);

// Plugin to inject build ID into HTML
function injectBuildIdPlugin(): Plugin {
  return {
    name: 'inject-build-id',
    transformIndexHtml(html) {
      return html
        .replace('__BUILD_ID__', buildId)
        .replace('__BUILD_TIME__', buildTime);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectBuildIdPlugin(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.svg', 'scenarios/*.json'],
      // Inject service worker registration into index.html
      injectRegister: false, // We handle registration manually in registerSW.ts
      manifest: {
        name: 'Void Walker',
        short_name: 'VoidWalker',
        description: 'RPG spatial horrifique avec IA',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/void-walker/',
        start_url: '/void-walker/',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        // Clean up old caches on activation
        cleanupOutdatedCaches: true,
        // Handle SKIP_WAITING message from client
        skipWaiting: true,
        // Claim clients immediately
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
        // Exclude certain files from precaching if needed
        navigateFallback: null, // Don't use navigate fallback to avoid caching issues
        runtimeCaching: [
          {
            // Never cache the Gemini API
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'gemini-api',
            }
          },
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Network-first strategy for HTML files
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 // 1 hour - short cache for HTML
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Allow access from mobile devices on same network
    port: 5173,
  },
  base: '/void-walker/', // For GitHub Pages deployment
  define: {
    '__BUILD_ID__': JSON.stringify(buildId),
    '__BUILD_TIME__': JSON.stringify(buildTime),
  }
})
