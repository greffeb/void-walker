import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';

const resolve = (p: string): string =>
  fileURLToPath(new URL(p, import.meta.url));

function resolveAppVersion(): string {
  const explicitVersion = process.env.VITE_APP_VERSION?.trim();
  if (explicitVersion) {
    return explicitVersion;
  }

  try {
    const shortSha = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (shortSha) {
      return `build-${shortSha}`;
    }
  } catch {
    // ignore and fallback
  }

  return 'build-unknown';
}

const appVersion = resolveAppVersion();

export default defineConfig({
  base: process.env.VITE_BASE_URL ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'Void Walker',
        short_name: 'Void Walker',
        description: 'RPG d\'horreur spatiale',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@engine': resolve('./src/engine'),
      '@content': resolve('./src/content'),
      '@i18n': resolve('./src/i18n'),
      '@narration': resolve('./src/narration'),
      '@ai': resolve('./src/ai'),
      '@ui': resolve('./src/ui'),
      '@stores': resolve('./src/stores'),
      '@services': resolve('./src/services'),
    },
  },
});
