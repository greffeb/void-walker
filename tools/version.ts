import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './repo-files';

/** Version du jeu enregistrée dans les parties : celle de package.json. */
export function versionDuJeu(): string {
  const { version } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { version?: unknown };
  if (typeof version !== 'string') throw new Error('package.json sans version.');
  return version;
}
