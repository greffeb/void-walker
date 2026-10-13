import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { empreinteCle, empreinteLisible, empreintePartie, estClePublique, verifier, type Attestation, type ClePublique } from '../app/validation';
import { extrairePartie, extraireValidation } from '../report-service/src/rapport';
import { REPO_ROOT, isMainModule } from './repo-files';

// Reconnaissance d'une validation sur téléphone (C-10 §4, AP-07, RP-04) : lancée par l'action GitHub sur chaque
// commentaire de rapport d'une PR. Elle vérifie la signature avec les clés du dépôt (docs/validation-key.json), puis que
// la partie signée est bien celle jointe, finie, et jouée sur un commit de cette PR. Seule elle pose l'étiquette.

export const FICHIER_CLES = 'docs/validation-key.json';
export const ETIQUETTE = 'validation-reconnue';
export const MARQUEUR_ROBOT = '<!-- void-walker:validation -->';

export interface CleEnregistree {
  readonly nom: string;
  readonly cle: ClePublique;
}

export type Reconnaissance =
  /** Pas de « je valide » signé : simple retour, rien à dire (PR-03). */
  | { readonly type: 'aucune' }
  | { readonly type: 'cle_inconnue'; readonly empreinte: string; readonly cle: ClePublique }
  | { readonly type: 'refusee'; readonly raison: string }
  | { readonly type: 'reconnue'; readonly attestation: Attestation; readonly nom: string; readonly empreinte: string };

/** Clés publiques du porteur du projet ; un fichier illisible n'en donne aucune, jamais une clé par défaut. */
export function lireCles(texte: string): CleEnregistree[] {
  const { cles } = JSON.parse(texte) as { cles?: unknown };
  if (!Array.isArray(cles)) throw new Error(`${FICHIER_CLES} : liste « cles » absente.`);
  return cles.map((entree: unknown, index) => {
    const { nom, cle } = (entree ?? {}) as { nom?: unknown; cle?: unknown };
    if (typeof nom !== 'string' || !estClePublique(cle)) throw new Error(`${FICHIER_CLES} : clé ${index + 1} illisible.`);
    if ('d' in cle) throw new Error(`${FICHIER_CLES} : clé ${index + 1} privée, à retirer du dépôt (C-10 §5).`);
    return { nom, cle: { kty: cle.kty, crv: cle.crv, x: cle.x, y: cle.y } };
  });
}

function estAttestation(valeur: unknown): valeur is Attestation {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const a = valeur as Record<string, unknown>;
  return (
    a.format === 'void-walker-validation' &&
    a.v === 1 &&
    typeof a.pr === 'number' &&
    typeof a.commit === 'string' &&
    typeof a.version === 'string' &&
    typeof a.monde === 'string' &&
    typeof a.graine === 'number' &&
    typeof a.actions === 'number' &&
    typeof a.empreinte === 'string' &&
    (a.issue === 'evacuation' || a.issue === 'defaite') &&
    typeof a.partie === 'string' &&
    typeof a.commentaire === 'string'
  );
}

export async function reconnaitre(entree: {
  readonly corps: string;
  readonly pr: number;
  /** Commits de la PR : la version de test signée doit en venir. */
  readonly commits: readonly string[];
  readonly cles: readonly CleEnregistree[];
}): Promise<Reconnaissance> {
  const bloc = extraireValidation(entree.corps);
  if (bloc === null) return { type: 'aucune' };
  const refus = (raison: string): Reconnaissance => ({ type: 'refusee', raison });
  if (typeof bloc !== 'object' || bloc === undefined) return refus('bloc de validation illisible');
  const { attestation, signature, cle } = bloc as Record<string, unknown>;
  if (!estAttestation(attestation) || typeof signature !== 'string' || !estClePublique(cle)) return refus('bloc de validation illisible');

  // La clé citée par le commentaire ne sert qu'à trouver celle du dépôt : c'est celle du dépôt qui vérifie.
  const empreinte = await empreinteCle(cle);
  const connues = await Promise.all(entree.cles.map(async (connue) => ({ ...connue, empreinte: await empreinteCle(connue.cle) })));
  const connue = connues.find((candidate) => candidate.empreinte === empreinte);
  if (connue === undefined) return { type: 'cle_inconnue', empreinte, cle };
  if (!(await verifier(connue.cle, attestation, signature))) return refus('signature invalide');

  if (attestation.pr !== entree.pr) return refus(`signée pour la PR #${attestation.pr}, pas pour celle-ci`);
  if (!entree.commits.includes(attestation.commit)) return refus(`commit ${attestation.commit.slice(0, 7) || '(absent)'} hors de cette PR`);
  const json = await extrairePartie(entree.corps);
  if (json === null) return refus('partie absente');
  const partie = JSON.parse(json) as Record<string, unknown>;
  if ((await empreintePartie(partie)) !== attestation.partie) return refus('la partie jointe n’est pas celle qui a été signée');
  const observation = partie.observation as { terminee?: unknown; issue?: unknown } | undefined;
  if (observation?.terminee !== true || observation.issue !== attestation.issue) return refus('partie non allée au bout (D-099)');
  const actions = Array.isArray(partie.actions) ? partie.actions.length : -1;
  const coherente =
    partie.monde === attestation.monde &&
    partie.version === attestation.version &&
    partie.graine === attestation.graine &&
    partie.empreinte === attestation.empreinte &&
    actions === attestation.actions;
  if (!coherente) return refus('attestation et partie ne concordent pas');
  return { type: 'reconnue', attestation, nom: connue.nom, empreinte };
}

const FINS: Readonly<Record<Attestation['issue'], string>> = { evacuation: 'évacuation', defaite: 'défaite' };

/** Réponse du robot dans la PR ; `null` quand il n'a rien à dire. */
export function reponse(resultat: Reconnaissance, adresseCommentaire: string): string | null {
  switch (resultat.type) {
    case 'aucune':
      return null;
    case 'refusee':
      return `${MARQUEUR_ROBOT}\n**Validation non reconnue** : ${resultat.raison}. Le [commentaire](${adresseCommentaire}) reste un simple retour (C-10 RP-04).`;
    case 'cle_inconnue':
      return [
        MARQUEUR_ROBOT,
        `**Validation non reconnue** : la [partie](${adresseCommentaire}) est signée par une clé que le dépôt ne connaît pas.`,
        '',
        `Empreinte : **${empreinteLisible(resultat.empreinte)}** (\`${resultat.empreinte}\`).`,
        '',
        `Si c'est l'empreinte affichée dans la section VALIDATION des options de votre téléphone, ajoutez ce bloc à la liste \`cles\` de \`${FICHIER_CLES}\` (vous seul : C-10 §5), puis relancez la vérification de ce commentaire : onglet Actions, « Validation sur téléphone », « Run workflow », avec l'adresse du commentaire.`,
        '',
        '```json',
        JSON.stringify({ nom: 'Téléphone du porteur du projet', cle: resultat.cle }, null, 2),
        '```',
      ].join('\n');
    case 'reconnue': {
      const a = resultat.attestation;
      const ligne = `${a.monde.toUpperCase()} · version ${a.version} · commit ${a.commit.slice(0, 7)} · ${FINS[a.issue]} en ${a.actions} actions · [partie](${adresseCommentaire})`;
      return [
        MARQUEUR_ROBOT,
        `**Validation reconnue** (C-10 RP-04), signée par « ${resultat.nom} » (${empreinteLisible(resultat.empreinte)}).`,
        '',
        `- Aventure : ${a.monde.toUpperCase()} (\`${a.monde}\`)`,
        `- Version : ${a.version}, commit \`${a.commit}\``,
        `- Fin : ${FINS[a.issue]}, ${a.actions} actions, graine ${a.graine}`,
        '',
        'Ligne pour le journal des parties humaines (RP-05) :',
        '',
        '```text',
        ligne,
        '```',
      ].join('\n');
    }
  }
}

function gh(...args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

const ADRESSE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/(\d+)#issuecomment-(\d+)$/;

/** Action GitHub : commentaire créé (événement) ou relance à la main (adresse du commentaire). */
async function principal(): Promise<void> {
  const depot = process.env.GITHUB_REPOSITORY ?? '';
  let corps: string;
  let pr: number;
  let adresse: string;
  const relance = process.env.COMMENTAIRE ?? '';
  if (relance !== '') {
    const trouve = ADRESSE.exec(relance);
    if (trouve === null) throw new Error(`Adresse de commentaire de PR attendue : ${relance}`);
    pr = Number(trouve[1]);
    corps = gh('api', `repos/${depot}/issues/comments/${trouve[2]}`, '--jq', '.body');
    adresse = relance;
  } else {
    const evenement = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? '', 'utf8')) as {
      issue: { number: number; pull_request?: unknown };
      comment: { body: string; html_url: string };
    };
    if (evenement.issue.pull_request === undefined) return;
    pr = evenement.issue.number;
    corps = evenement.comment.body;
    adresse = evenement.comment.html_url;
  }
  const commits = gh('api', `repos/${depot}/pulls/${pr}/commits`, '--paginate', '--jq', '.[].sha').split('\n').filter(Boolean);
  const cles = lireCles(readFileSync(join(REPO_ROOT, FICHIER_CLES), 'utf8'));
  const resultat = await reconnaitre({ corps, pr, commits, cles });
  console.log(`Reconnaissance : ${resultat.type}${resultat.type === 'refusee' ? ` (${resultat.raison})` : ''}.`);
  const texte = reponse(resultat, adresse);
  if (texte === null) return;
  const fichier = join(process.env.RUNNER_TEMP ?? REPO_ROOT, 'reponse-validation.md');
  writeFileSync(fichier, texte);
  gh('api', '-X', 'POST', `repos/${depot}/issues/${pr}/comments`, '-F', `body=@${fichier}`);
  if (resultat.type === 'reconnue') gh('api', '-X', 'POST', `repos/${depot}/issues/${pr}/labels`, '-f', `labels[]=${ETIQUETTE}`);
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(`Reconnaissance impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    process.exitCode = 1;
  });
}

