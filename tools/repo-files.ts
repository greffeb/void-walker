import { readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

// Dépendances et sorties générées, ignorées par git (.gitignore).
const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
  'captures',
  '.void-walker',
]);

/** Fichiers sous `root` dont le nom finit par une des extensions, hors dossiers ignorés, triés. */
export function listRepoFiles(root: string, extensions: readonly string[]): string[] {
  const files: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) walk(path);
      } else if (entry.isFile() && extensions.some((extension) => entry.name.endsWith(extension))) {
        files.push(path);
      }
    }
  };
  walk(root);
  return files.sort();
}

/** Chemin relatif à `root`, avec des « / » sur tous les systèmes. */
export function displayPath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}

/** Vrai si le module est le script lancé (et non importé par un test). */
export function isMainModule(moduleUrl: string): boolean {
  const entry = process.argv[1];
  return entry !== undefined && resolve(entry) === fileURLToPath(moduleUrl);
}
