import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

const commit = process.env.COMMIT ?? process.env.GITHUB_SHA ?? '';

/**
 * Numéro de construction (D-227) : nombre de commits jusqu'à la version publiée. Il ne fait que croître sur la branche
 * principale. Vide sans historique complet (clone superficiel) : un nombre faux serait pire qu'aucun.
 */
function numeroDeConstruction(): string {
  try {
    const git = (...args: string[]): string => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (git('rev-parse', '--is-shallow-repository') !== 'false') return '';
    return git('rev-list', '--count', commit === '' ? 'HEAD' : commit);
  } catch {
    return '';
  }
}

// BASE_PATH : « /void-walker/ » pour la version principale, « /void-walker/pr-<n>/ » pour une version de test (AP-05).
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  root: 'app',
  base,
  define: {
    'import.meta.env.VITE_VERSION': JSON.stringify(version),
    'import.meta.env.VITE_PR_NUMERO': JSON.stringify(process.env.PR_NUMERO ?? ''),
    'import.meta.env.VITE_COMMIT': JSON.stringify(commit),
    'import.meta.env.VITE_BUILD': JSON.stringify(numeroDeConstruction()),
    // Service de rapports (AP-06, D-134) ; SERVICE_RAPPORTS le remplace pour un essai contre un autre Worker.
    'import.meta.env.VITE_SERVICE_RAPPORTS': JSON.stringify(process.env.SERVICE_RAPPORTS ?? 'https://void-walker-rapports.greffe-b.workers.dev/rapports'),
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
      // La page choisit le moment de l'installation (app/miseAJour.ts, D-227) : pas en plein geste du joueur.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Void Walker',
        short_name: 'Void Walker',
        description: 'Récit d’horreur spatiale.',
        lang: 'fr',
        display: 'standalone',
        background_color: '#0a0907',
        theme_color: '#0a0907',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La police IBM Plex Mono est servie par l'appli, y compris hors ligne (12 §2.2).
        // La première installation prend la main tout de suite : la page suivante est servie hors ligne.
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,png,webmanifest,woff2}'],
        globIgnores: ['captures/**'],
        // La version principale ne doit pas servir les versions de test publiées sous elle.
        navigateFallbackDenylist: [/\/pr-\d+\//],
        // « ?monde=<id> » et « ?station=<id> » (monde ou station choisis pour les essais) servent la même page, y compris hors
        // ligne dans une version de test.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^monde$/, /^station$/],
      },
    }),
  ],
});
