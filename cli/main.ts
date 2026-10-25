import { randomInt } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { assemblerStation } from '../engine';
import { creerCatalogue } from '../content';
import { AIDE, analyserArguments, choisirEntree, executer, type EntreesSorties } from './partie-cli';

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
// L'aide ne charge ni la partie enregistrée ni une station : elle doit marcher même quand la partie ne se reprend plus (#282).
const entree = (analyserArguments(argv).positionnels[0] ?? 'aide') === 'aide' ? null : choisirEntree(argv, creerCatalogue(assemblerStation), es);
if (entree === null) {
  console.log(AIDE.join('\n'));
} else if (typeof entree === 'string') {
  console.log(entree);
  process.exitCode = 1;
} else {
  const sortie = executer(argv, { monde: entree.monde, textes: entree.textes, version, es });
  console.log(sortie.lignes.join('\n'));
  process.exitCode = sortie.code;
}
