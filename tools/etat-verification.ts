import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { FichierVerification } from '../app/verification';
import type { Catalogue } from '../content';
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

/** Identifiants de la ligne « Tester : id ; id » du corps de la PR, dans l'ordre, sans doublon ; un morceau de phrase est ignoré. */
export function aTester(corps: string): string[] {
  const ligne = /^Tester\s*:\s*(.+)$/im.exec(corps)?.[1] ?? '';
  const ids = ligne.split(';').map((id) => id.trim().replace(/^`|`$/g, '').toLowerCase()).filter((id) => /^[a-z0-9-]+$/.test(id));
  return [...new Set(ids)];
}

/** Hasard fixe, pour savoir si le jeu tirerait un plan d'une composition. */
function hasardFixe(): () => number {
  let etat = 2718281828;
  return () => (etat = (Math.imul(etat, 1664525) + 1013904223) >>> 0);
}

/**
 * Liens de la version de test vers chaque identifiant à tester, comme le jeu lit l'adresse (`demandeDe`, `preparerLancement`) :
 * un monde fixe par `?monde=`, une composition (un plan tiré à chaque nouvelle partie) ou une station exacte par `?station=` ;
 * un identifiant que le jeu refuserait est montré avec son motif, sans lien.
 */
export function liensDeTest(ids: readonly string[], adresse: string, catalogue: Catalogue): string[] {
  if (ids.length === 0) return [];
  const lignes = ids.map((id) => {
    if (Object.hasOwn(catalogue.mondes, id)) return `- [${id}](${adresse}?monde=${id})`;
    const composition = catalogue.compositions.some((candidate) => candidate.id === id);
    const obtenu = composition ? catalogue.tirer(hasardFixe(), id) : catalogue.resoudre(id);
    if ('refus' in obtenu) return `- \`${id}\` : refusé par le jeu (${obtenu.refus})`;
    return `- [${id}](${adresse}?station=${id})${composition ? ', un plan tiré à chaque nouvelle partie' : ''}`;
  });
  return ['**À tester :**', ...lignes];
}

/**
 * Commentaire du robot. Sans captures (publication, au début de la CI) : adresse, commit, état. Avec le commentaire des
 * captures (bilan, à la fin) : celui-ci, l'état inséré après son adresse et son commit. Les liens à tester suivent l'état.
 */
export function composerCommentaire({ etat, adresse, commit, run = '', captures = null, liens = [] }: {
  readonly etat: Etat;
  readonly adresse: string;
  readonly commit: string;
  readonly run?: string;
  readonly captures?: string | null;
  readonly liens?: readonly string[];
}): string {
  const etatLigne = ligneEtat(etat, run);
  const liensLignes = liens.length === 0 ? [] : ['', ...liens];
  if (captures !== null && captures.startsWith(MARQUEUR_VERSION)) {
    const lignes = captures.split('\n');
    const apres = lignes.findIndex((ligne) => ligne.startsWith('Commit `'));
    const rang = apres >= 0 ? apres : lignes.findIndex((ligne) => ligne.startsWith('**Adresse :**') || ligne.startsWith('Adresse :'));
    lignes.splice(rang + 1, 0, '', etatLigne, ...liensLignes);
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
    ...liensLignes,
    '',
    capturesLigne,
    '',
  ].join('\n');
}

/**
 * `--etat=en_cours|verte|echec --json=<fichier> --commentaire=<fichier> [--captures=<commentaire.md des captures>]` ; les liens
 * à tester viennent de la ligne « Tester : » de `PR_BODY`.
 */
async function principal(): Promise<void> {
  const valeur = (nom: string): string | undefined => process.argv.slice(2).find((argument) => argument.startsWith(`--${nom}=`))?.slice(nom.length + 3);
  const etat = valeur('etat');
  if (etat !== 'en_cours' && etat !== 'verte' && etat !== 'echec') throw new Error(`État inconnu : ${etat ?? '(absent)'}.`);
  const commit = process.env.COMMIT ?? '';
  const json = valeur('json');
  if (json !== undefined) writeFileSync(json, `${JSON.stringify(fichierVerification(etat, commit))}\n`);
  const sortie = valeur('commentaire');
  const fichierCaptures = valeur('captures');
  const captures = fichierCaptures !== undefined && existsSync(fichierCaptures) ? readFileSync(fichierCaptures, 'utf8') : null;
  if (sortie === undefined) return;
  const adresse = process.env.VERSION_URL ?? '';
  const ids = aTester(process.env.PR_BODY ?? '');
  // Le catalogue n'est chargé que si la PR demande des liens : il assemble les stations de test.
  const liens = ids.length === 0 ? [] : liensDeTest(ids, adresse, (await import('./catalogue')).CATALOGUE);
  writeFileSync(sortie, composerCommentaire({ etat, adresse, commit, run: process.env.RUN_URL ?? '', captures, liens }));
}

if (isMainModule(import.meta.url)) await principal();
