import { randomInt } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { MONDE_PAR_DEFAUT, MONDES } from '../content';
import { choisirMonde, executer, type EntreesSorties } from './partie-cli';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

const es: EntreesSorties = {
  lire(chemin) {
    try {
      return readFileSync(chemin, 'utf8');
    } catch {
      return null;
    }
  },
  ecrire(chemin, contenu) {
    mkdirSync(dirname(chemin), { recursive: true });
    const provisoire = `${chemin}.tmp`;
    writeFileSync(provisoire, contenu, 'utf8');
    renameSync(provisoire, chemin);
  },
  graineAleatoire: () => randomInt(0, 0x100000000),
};

const argv = process.argv.slice(2);
const entree = choisirMonde(argv, MONDES, MONDE_PAR_DEFAUT, es);
if (typeof entree === 'string') {
  console.log(entree);
  process.exitCode = 1;
} else {
  const sortie = executer(argv, { monde: entree.monde, textes: entree.textes, version, es });
  console.log(sortie.lignes.join('\n'));
  process.exitCode = sortie.code;
}
