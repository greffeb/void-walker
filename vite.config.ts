import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// BASE_PATH : « /void-walker/ » pour la version principale, « /void-walker/pr-<n>/ » pour une version de test (AP-05).
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  root: 'app',
  base,
  define: {
    'import.meta.env.VITE_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_PR_NUMERO': JSON.stringify(process.env.PR_NUMERO ?? ''),
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: 'Void Walker',
        short_name: 'Void Walker',
        description: 'Récit d’horreur spatiale.',
        lang: 'fr',
        display: 'standalone',
        background_color: '#0b0d10',
        theme_color: '#0b0d10',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
        globIgnores: ['captures/**'],
        // La version principale ne doit pas servir les versions de test publiées sous elle.
        navigateFallbackDenylist: [/\/pr-\d+\//],
      },
    }),
  ],
});
