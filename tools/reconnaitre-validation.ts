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
  | { readonly type: 'reconnue'; readonly attestation: Attestation; readonly nom: string; readonly empreinte: string }
  /** Signature valide, mais la vérification automatique du commit signé n'a pas fini au vert : rien n'est encore reconnu (#180). */
  | { readonly type: 'en_attente'; readonly attestation: Attestation; readonly nom: string; readonly empreinte: string; readonly verification: Exclude<EtatCommit, 'verte' | 'echec'> }
  /** Signature valide, mais la vérification automatique du commit signé a échoué : la validation ne compte pas (#180). */
  | { readonly type: 'ecartee'; readonly attestation: Attestation; readonly nom: string; readonly empreinte: string };

/**
 * Vérification automatique d'un commit (#180) : celle du dernier run du workflow des demandes de fusion pour ce commit.
 * `interrompue` : run annulé (un envoi plus récent l'a remplacé) ; `inconnue` : aucun run trouvé.
 */
export type EtatCommit = 'en_cours' | 'verte' | 'echec' | 'interrompue' | 'inconnue';

export const WORKFLOW_VERIFICATION = 'demande-de-fusion.yml';

/** État d'un commit d'après les runs du workflow pour ce commit (API GitHub), le plus récent faisant foi. */
export function etatDesRuns(runs: readonly { readonly status: string; readonly conclusion: string | null; readonly created_at: string; readonly run_attempt?: number }[]): EtatCommit {
  const dernier = [...runs].sort((a, b) => (a.created_at === b.created_at ? (b.run_attempt ?? 1) - (a.run_attempt ?? 1) : a.created_at < b.created_at ? 1 : -1))[0];
  if (dernier === undefined) return 'inconnue';
  if (dernier.status !== 'completed') return 'en_cours';
  if (dernier.conclusion === 'success') return 'verte';
  if (dernier.conclusion === 'failure' || dernier.conclusion === 'timed_out' || dernier.conclusion === 'startup_failure') return 'echec';
  return 'interrompue';
}

/**
 * Décision du porteur (2026-10-16, #180) : une validation signée pendant la vérification de son commit reste valide si
 * cette vérification finit au vert, et n'est pas prise en compte si elle échoue. Le robot attend donc la fin : rien n'est
 * reconnu avant, et il revient sur la validation quand la vérification du commit finit.
 */
export function selonVerification(resultat: Reconnaissance, verification: EtatCommit): Reconnaissance {
  if (resultat.type !== 'reconnue' || verification === 'verte') return resultat;
  const { attestation, nom, empreinte } = resultat;
  return verification === 'echec' ? { type: 'ecartee', attestation, nom, empreinte } : { type: 'en_attente', attestation, nom, empreinte, verification };
}

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

const ATTENTES: Readonly<Record<Extract<Reconnaissance, { type: 'en_attente' }>['verification'], string>> = {
  en_cours: 'est encore en cours',
  interrompue: 'a été interrompue (un envoi plus récent l’a remplacée) : relancez-la (onglet Actions, « Re-run jobs ») pour que la validation compte',
  inconnue: 'est introuvable',
};

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
    case 'en_attente':
      return `${MARQUEUR_ROBOT}\n**Validation en attente** : la [partie](${adresseCommentaire}) est bien signée par « ${resultat.nom} », mais la vérification automatique du commit \`${resultat.attestation.commit.slice(0, 7)}\` ${ATTENTES[resultat.verification]}. Elle sera reconnue si cette vérification finit au vert, et ne comptera pas si elle échoue (#180).`;
    case 'ecartee':
      return `${MARQUEUR_ROBOT}\n**Validation non prise en compte** : la [partie](${adresseCommentaire}) est bien signée par « ${resultat.nom} », mais la vérification automatique du commit \`${resultat.attestation.commit.slice(0, 7)}\` a échoué (#180). Le commentaire reste un simple retour.`;
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
const MARQUEUR_RAPPORT = '<!-- void-walker-rapport v1 -->';

/** Marqueur de la réponse du robot à un commentaire : elle est mise à jour, pas répétée, quand la vérification finit. */
export function marqueurReponse(commentaire: number): string {
  return `<!-- void-walker:validation-de ${commentaire} -->`;
}

/** Commit signé dans un commentaire de rapport ; `null` sans validation lisible. */
export function commitSigne(corps: string): string | null {
  const bloc = extraireValidation(corps) as { attestation?: { commit?: unknown } } | null | undefined;
  const commit = typeof bloc === 'object' && bloc !== null ? bloc.attestation?.commit : undefined;
  return typeof commit === 'string' ? commit : null;
}

interface Commentaire {
  readonly id: number;
  readonly corps: string;
  readonly adresse: string;
}

function etatDuCommit(depot: string, commit: string): EtatCommit {
  const runs = JSON.parse(
    gh('api', `repos/${depot}/actions/workflows/${WORKFLOW_VERIFICATION}/runs?head_sha=${commit}&event=pull_request&per_page=100`, '--jq', '[.workflow_runs[] | {status, conclusion, created_at, run_attempt}]'),
  ) as Parameters<typeof etatDesRuns>[0];
  return etatDesRuns(runs);
}

async function traiter(depot: string, pr: number, commentaire: Commentaire, cles: readonly CleEnregistree[]): Promise<void> {
  const commits = gh('api', `repos/${depot}/pulls/${pr}/commits`, '--paginate', '--jq', '.[].sha').split('\n').filter(Boolean);
  const signe = await reconnaitre({ corps: commentaire.corps, pr, commits, cles });
  const resultat = signe.type === 'reconnue' ? selonVerification(signe, etatDuCommit(depot, signe.attestation.commit)) : signe;
  console.log(`Reconnaissance du commentaire ${commentaire.id} : ${resultat.type}${resultat.type === 'refusee' ? ` (${resultat.raison})` : ''}.`);
  const texte = reponse(resultat, commentaire.adresse);
  if (texte === null) return;
  const marqueur = marqueurReponse(commentaire.id);
  const fichier = join(process.env.RUNNER_TEMP ?? REPO_ROOT, `reponse-validation-${commentaire.id}.md`);
  writeFileSync(fichier, `${texte}\n${marqueur}\n`);
  const existante = gh('api', `repos/${depot}/issues/${pr}/comments`, '--paginate', '--jq', `.[] | select(.user.login == "github-actions[bot]" and (.body | contains("${marqueur}"))) | .id`)
    .split('\n')
    .filter(Boolean)
    .at(-1);
  if (existante === undefined) gh('api', '-X', 'POST', `repos/${depot}/issues/${pr}/comments`, '-F', `body=@${fichier}`);
  else gh('api', '-X', 'PATCH', `repos/${depot}/issues/comments/${existante}`, '-F', `body=@${fichier}`);
  if (resultat.type === 'reconnue') gh('api', '-X', 'POST', `repos/${depot}/issues/${pr}/labels`, '-f', `labels[]=${ETIQUETTE}`);
}

/**
 * Action GitHub : commentaire créé (événement), relance à la main (adresse du commentaire), ou fin de la vérification d'un
 * commit (#180) : chaque validation signée pour ce commit dans ses PR est alors jugée de nouveau.
 */
async function principal(): Promise<void> {
  const depot = process.env.GITHUB_REPOSITORY ?? '';
  const cles = lireCles(readFileSync(join(REPO_ROOT, FICHIER_CLES), 'utf8'));
  const relance = process.env.COMMENTAIRE ?? '';
  if (relance !== '') {
    const trouve = ADRESSE.exec(relance);
    if (trouve === null) throw new Error(`Adresse de commentaire de PR attendue : ${relance}`);
    const id = Number(trouve[2]);
    await traiter(depot, Number(trouve[1]), { id, corps: gh('api', `repos/${depot}/issues/comments/${id}`, '--jq', '.body'), adresse: relance }, cles);
    return;
  }
  const evenement = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH ?? '', 'utf8')) as {
    issue?: { number: number; pull_request?: unknown };
    comment?: { id: number; body: string; html_url: string };
    workflow_run?: { head_sha: string; pull_requests?: readonly { number: number }[] };
  };
  if (evenement.workflow_run !== undefined) {
    const { head_sha: commit, pull_requests: prs = [] } = evenement.workflow_run;
    for (const { number: pr } of prs) {
      // Une ligne JSON par commentaire de rapport, toutes pages confondues.
      const commentaires = gh('api', `repos/${depot}/issues/${pr}/comments`, '--paginate', '--jq', `.[] | select(.body | contains("${MARQUEUR_RAPPORT}")) | {id, body, html_url} | tojson`)
        .split('\n')
        .filter(Boolean)
        .map((ligne) => JSON.parse(ligne) as { id: number; body: string; html_url: string });
      for (const { id, body, html_url } of commentaires) {
        if (commitSigne(body) === commit) await traiter(depot, pr, { id, corps: body, adresse: html_url }, cles);
      }
    }
    return;
  }
  if (evenement.issue?.pull_request === undefined || evenement.comment === undefined) return;
  await traiter(depot, evenement.issue.number, { id: evenement.comment.id, corps: evenement.comment.body, adresse: evenement.comment.html_url }, cles);
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(`Reconnaissance impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    process.exitCode = 1;
  });
}

