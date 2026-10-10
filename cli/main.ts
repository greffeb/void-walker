import { randomInt } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { MONDE_PAR_DEFAUT, MONDES } from '../content';
import { executer, type EntreesSorties } from './partie-cli';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
const entree = MONDES[MONDE_PAR_DEFAUT];
if (entree === undefined) throw new Error(`Monde inconnu : ${MONDE_PAR_DEFAUT}.`);

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

const sortie = executer(process.argv.slice(2), { monde: entree.monde, textes: entree.textes, version, es });
console.log(sortie.lignes.join('\n'));
process.exitCode = sortie.code;
