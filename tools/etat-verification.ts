import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { FichierVerification } from '../app/verification';
import { isMainModule } from './repo-files';

// Version de test publiée dès le début de la CI (#180) : `verification.json` à côté d'elle, que le jeu lit dans ses options,
// et le commentaire du robot dans la PR, tous deux avec l'état de la vérification automatique du commit publié.

export const MARQUEUR_VERSION = '<!-- void-walker:version-de-test -->';

type Etat = FichierVerification['etat'];

const PHRASES: Readonly<Record<Etat, string>> = {
  en_cours: 'en cours. La version est déjà jouable ; une validation envoyée maintenant ne comptera que si la vérification finit verte.',
  verte: 'verte.',
  echec: 'en échec. Une validation envoyée depuis cette version ne comptera pas.',
};

export function fichierVerification(etat: Etat, commit: string): FichierVerification {
  return { commit, etat };
}

export function ligneEtat(etat: Etat, run = ''): string {
  return `**Vérification automatique :** ${PHRASES[etat]}${run === '' ? '' : ` [Suivre la vérification](${run}).`}`;
}

/**
 * Commentaire du robot. Sans captures (publication, au début de la CI) : adresse, commit, état. Avec le commentaire des
 * captures (bilan, à la fin) : celui-ci, l'état inséré après son adresse et son commit.
 */
export function composerCommentaire({ etat, adresse, commit, run = '', captures = null }: {
  readonly etat: Etat;
  readonly adresse: string;
  readonly commit: string;
  readonly run?: string;
  readonly captures?: string | null;
}): string {
  const etatLigne = ligneEtat(etat, run);
  if (captures !== null && captures.startsWith(MARQUEUR_VERSION)) {
    const lignes = captures.split('\n');
    const apres = lignes.findIndex((ligne) => ligne.startsWith('Commit `'));
    const rang = apres >= 0 ? apres : lignes.findIndex((ligne) => ligne.startsWith('**Adresse :**') || ligne.startsWith('Adresse :'));
    lignes.splice(rang + 1, 0, '', etatLigne);
    return lignes.join('\n');
  }
  const capturesLigne = etat === 'en_cours'
    ? 'Captures : à venir, avec la fin de la vérification.'
    : 'Captures : absentes (job des captures en échec ou annulé, voir la vérification).';
  return [
    MARQUEUR_VERSION,
    '## Version de test',
    '',
    adresse === '' ? 'Adresse : (publication locale)' : `**Adresse :** ${adresse}`,
    commit === '' ? '' : `Commit \`${commit.slice(0, 7)}\``,
    '',
    etatLigne,
    '',
    capturesLigne,
    '',
  ].join('\n');
}

/** `--etat=en_cours|verte|echec --json=<fichier> --commentaire=<fichier> [--captures=<commentaire.md des captures>]`. */
function principal(): void {
  const valeur = (nom: string): string | undefined => process.argv.slice(2).find((argument) => argument.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const etat = valeur('etat');
  if (etat !== 'en_cours' && etat !== 'verte' && etat !== 'echec') throw new Error(`État inconnu : ${etat ?? '(absent)'}.`);
  const commit = process.env.COMMIT ?? '';
  const json = valeur('json');
  if (json !== undefined) writeFileSync(json, `${JSON.stringify(fichierVerification(etat, commit))}\n`);
  const sortie = valeur('commentaire');
  const fichierCaptures = valeur('captures');
  const captures = fichierCaptures !== undefined && existsSync(fichierCaptures) ? readFileSync(fichierCaptures, 'utf8') : null;
  if (sortie !== undefined) writeFileSync(sortie, composerCommentaire({ etat, adresse: process.env.VERSION_URL ?? '', commit, run: process.env.RUN_URL ?? '', captures }));
}

if (isMainModule(import.meta.url)) principal();
