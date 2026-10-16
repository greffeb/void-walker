// Rapports des joueurs (C-10 §3, AP-06) : lecture de la demande envoyée par le jeu, puis issue ou commentaire GitHub.
// Rien ne vient du joueur sans être borné : tout texte libre est rendu dans un bloc de code, sans mention ni lien actif.

export type TypeRapport = 'bug' | 'partie';

/** Ce que le jeu envoie (POST, corps JSON). La partie est l'export de C-09 §5, gardé tel quel pour être rejoué. */
export interface Demande {
  readonly type: TypeRapport;
  readonly version: string;
  readonly build: string;
  readonly commit: string;
  /** Numéro de la PR d'une version de test (D-132) ; `null` pour la version publique. */
  readonly pr: number | null;
  readonly commentaire: string;
  /** Case « je valide » (D-096), seulement pour un envoi de partie ; jamais une validation sans signature (C-10 §4). */
  readonly valide: boolean;
  /** Export de la partie ; absent pour un bug signalé sans partie en cours. */
  readonly partie: PartieJointe | null;
  /** Texte affiché à l'écran au moment du rapport (RP-01). */
  readonly ecran: readonly string[];
  /**
   * « Je valide » signé par le téléphone (C-10 §4) : recopié tel quel pour le robot de la PR, qui seul le vérifie
   * (AP-07) ; le service ne décide jamais d'une validation.
   */
  readonly validation: Readonly<Record<string, unknown>> | null;
}

/** Ce que le service lit de l'export ; le reste est recopié sans être interprété. */
export interface PartieJointe {
  readonly monde: string;
  readonly graine: number;
  readonly actions: number;
  readonly empreinte: string;
  readonly brut: Readonly<Record<string, unknown>>;
}

export const TAILLE_MAX_DEMANDE = 200_000;
export const COMMENTAIRE_MAX = 1000;
const LIGNES_ECRAN_MAX = 60;
const LIGNE_ECRAN_MAX = 2000;
/** Limite de GitHub pour le corps d'une issue ou d'un commentaire, avec une marge. */
export const CORPS_MAX = 65_000;

export type Lecture = { readonly ok: true; readonly demande: Demande } | { readonly ok: false; readonly raison: string };

const VERSION = /^[0-9A-Za-z.+-]{1,32}$/;
const BUILD = /^[0-9]{0,9}$/;
const COMMIT = /^[0-9a-f]{0,40}$/;
const MONDE = /^[a-z0-9-]{1,40}$/;
const EMPREINTE = /^[0-9A-Za-z_-]{1,128}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{40,200}$/;
const COORDONNEE = /^[A-Za-z0-9_-]{43}$/;
const VALIDATION_MAX = 4000;

/** Forme du bloc signé, sans le vérifier : la signature, la clé publique, et une attestation de taille bornée. */
function lireValidation(valeur: unknown): Readonly<Record<string, unknown>> | string {
  if (!objet(valeur)) return 'validation illisible';
  const { attestation, signature, cle } = valeur;
  if (!objet(attestation) || JSON.stringify(attestation).length > VALIDATION_MAX) return 'attestation illisible';
  if (typeof signature !== 'string' || !SIGNATURE.test(signature)) return 'signature illisible';
  if (!objet(cle) || cle.kty !== 'EC' || cle.crv !== 'P-256') return 'clé illisible';
  if (typeof cle.x !== 'string' || !COORDONNEE.test(cle.x) || typeof cle.y !== 'string' || !COORDONNEE.test(cle.y)) return 'clé illisible';
  return { attestation, signature, cle: { kty: cle.kty, crv: cle.crv, x: cle.x, y: cle.y } };
}

function objet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
}

function lirePartie(valeur: unknown): PartieJointe | string {
  if (!objet(valeur)) return 'partie illisible';
  const { monde, graine, actions, empreinte, observation, version } = valeur;
  if (typeof monde !== 'string' || !MONDE.test(monde)) return 'monde illisible';
  if (typeof version !== 'string' || !VERSION.test(version)) return 'version de la partie illisible';
  if (typeof graine !== 'number' || !Number.isInteger(graine) || graine < 0) return 'graine illisible';
  if (!Array.isArray(actions)) return 'actions illisibles';
  if (typeof empreinte !== 'string' || !EMPREINTE.test(empreinte)) return 'empreinte illisible';
  if (!objet(observation)) return 'observation illisible';
  return { monde, graine, actions: actions.length, empreinte, brut: valeur };
}

/** Valide la demande ; un refus dit pourquoi, sans jamais recopier le contenu reçu. */
export function lireDemande(donnees: unknown): Lecture {
  const refus = (raison: string): Lecture => ({ ok: false, raison });
  if (!objet(donnees)) return refus('demande illisible');
  const { type, version, build = '', commit = '', pr = null, commentaire = '', valide = false, partie = null, ecran = [], validation = null } = donnees;
  if (type !== 'bug' && type !== 'partie') return refus('type inconnu');
  if (typeof version !== 'string' || !VERSION.test(version)) return refus('version illisible');
  if (typeof build !== 'string' || !BUILD.test(build)) return refus('numéro de construction illisible');
  if (typeof commit !== 'string' || !COMMIT.test(commit)) return refus('commit illisible');
  if (pr !== null && (typeof pr !== 'number' || !Number.isInteger(pr) || pr <= 0 || pr > 1_000_000)) return refus('PR illisible');
  if (typeof commentaire !== 'string' || [...commentaire].length > COMMENTAIRE_MAX) return refus('commentaire trop long');
  if (typeof valide !== 'boolean') return refus('case « je valide » illisible');
  if (valide && type !== 'partie') return refus('« je valide » seulement pour un envoi de partie');
  if (!Array.isArray(ecran) || ecran.length > LIGNES_ECRAN_MAX) return refus('écran illisible');
  if (!ecran.every((ligne): ligne is string => typeof ligne === 'string' && ligne.length <= LIGNE_ECRAN_MAX)) return refus('écran illisible');
  let jointe: PartieJointe | null = null;
  if (partie !== null) {
    const lue = lirePartie(partie);
    if (typeof lue === 'string') return refus(lue);
    jointe = lue;
  }
  if (type === 'partie' && jointe === null) return refus('partie absente');
  let signee: Readonly<Record<string, unknown>> | null = null;
  if (validation !== null) {
    if (!valide || pr === null) return refus('validation seulement avec « je valide », depuis une version de test');
    const lue = lireValidation(validation);
    if (typeof lue === 'string') return refus(lue);
    signee = lue;
  }
  return {
    ok: true,
    demande: { type, version, build, commit, pr, commentaire: commentaire.trim(), valide, partie: jointe, ecran, validation: signee },
  };
}

/** Empreinte d'un rapport : deux envois identiques ont la même, quel que soit l'ordre des champs du JSON (RP-03). */
export async function empreinteRapport(demande: Demande): Promise<string> {
  const cle = JSON.stringify([
    demande.type,
    demande.pr,
    demande.commentaire,
    demande.valide,
    demande.partie?.monde ?? null,
    demande.partie?.graine ?? null,
    demande.partie?.actions ?? null,
    demande.partie?.empreinte ?? null,
    demande.partie === null ? demande.ecran : null,
  ]);
  return hacher(cle);
}

export async function hacher(texte: string): Promise<string> {
  const octets = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte)));
  return [...octets].map((octet) => octet.toString(16).padStart(2, '0')).join('');
}

/** Bloc de code dont la clôture est plus longue que toute suite d'accents graves du texte : rien n'y est interprété. */
export function blocCode(texte: string, langage = ''): string {
  const plusLongue = Math.max(0, ...[...texte.matchAll(/`+/g)].map((suite) => suite[0].length));
  const cloture = '`'.repeat(Math.max(3, plusLongue + 1));
  return `${cloture}${langage}\n${texte}\n${cloture}`;
}

/** Export compressé en gzip puis en base64, quand le JSON ne tient pas dans le corps d'une issue. */
export async function compresser(texte: string): Promise<string> {
  const flux = new Blob([texte]).stream().pipeThrough(new CompressionStream('gzip'));
  const octets = new Uint8Array(await new Response(flux).arrayBuffer());
  let binaire = '';
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire).replace(/.{1,76}/g, '$&\n').trimEnd();
}

export const MARQUEUR = '<!-- void-walker-rapport v1 -->';

/** Titres des sections relues par `extrairePartie` et `extraireValidation`. */
const TITRE_COMMENTAIRE = '### Commentaire du joueur';
const TITRE_REJEU = '### Rejouer';
const TITRE_VALIDATION = '### Validation signée';

export interface Composition {
  readonly titre: string;
  readonly corps: string;
  readonly etiquettes: readonly string[];
}

/** Langage du bloc de code qui porte la validation signée ; le robot de la PR le cherche. */
export const LANGAGE_VALIDATION = 'void-walker-validation';

function caseValide(demande: Demande): string {
  if (!demande.valide) return 'non cochée';
  return demande.validation === null ? 'cochée, sans signature (simple retour, C-10 RP-04)' : 'cochée, signée par le téléphone';
}

function versionAffichee(demande: Demande): string {
  return `${demande.version}${demande.build === '' ? '' : ` (${demande.build})`}${demande.commit === '' ? '' : ` · ${demande.commit.slice(0, 7)}`}`;
}

/**
 * Issue (version publique) ou commentaire de PR (version de test, D-132) : RP-01 pour un bug, RP-02 pour un envoi de
 * partie. `prFermee` : la PR d'une version de test n'est plus ouverte, le rapport devient une issue qui la cite.
 */
export async function composer(demande: Demande, options: { readonly enCommentaire: boolean; readonly prFermee?: boolean } = { enCommentaire: false }): Promise<Composition> {
  const { partie } = demande;
  const nature = demande.type === 'bug' ? 'Bug signalé' : 'Partie envoyée';
  const lieu = partie === null ? 'sans partie' : `${partie.monde} · action ${partie.actions}`;
  const titre = `${nature} · ${lieu} · V${versionAffichee(demande)}`;
  const origine = demande.pr === null ? 'version publique' : `version de test de la PR #${demande.pr}${options.prFermee === true ? ' (fermée)' : ''}`;

  const lignes: string[] = [MARQUEUR, `**${nature}** depuis le jeu (${origine}).`, ''];
  lignes.push('| | |', '| --- | --- |', `| Version | ${versionAffichee(demande)} |`);
  if (partie !== null) {
    lignes.push(`| Monde | ${partie.monde} |`, `| Actions jouées | ${partie.actions} |`, `| Graine | ${partie.graine} |`);
  }
  if (demande.type === 'partie') lignes.push(`| Case « je valide » | ${caseValide(demande)} |`);
  lignes.push('', TITRE_COMMENTAIRE, '', demande.commentaire === '' ? '_Aucun._' : blocCode(demande.commentaire, 'text'));
  if (demande.validation !== null) {
    lignes.push(
      '',
      TITRE_VALIDATION,
      '',
      'Reconnue seulement par le robot de la PR, avec la clé enregistrée dans le dépôt (C-10 §4).',
      '',
      blocCode(JSON.stringify(demande.validation), LANGAGE_VALIDATION),
    );
  }
  if (demande.ecran.length > 0) lignes.push('', '### Écran affiché', '', blocCode(demande.ecran.join('\n'), 'text'));

  const tete = lignes.join('\n');
  if (partie === null) return { titre, corps: tete, etiquettes: [demande.type === 'bug' ? 'rapport-bug' : 'rapport-partie'] };

  const rejeu = [
    '',
    TITRE_REJEU,
    '',
    options.enCommentaire
      ? 'Copier l’adresse de ce commentaire, puis : `npm run rejouer -- <adresse du commentaire>`.'
      : 'Depuis le dépôt, à la version indiquée : `npm run rejouer -- <adresse de cette issue>`.',
    '',
  ].join('\n');
  const json = JSON.stringify(partie.brut);
  const enClair = `${tete}\n${rejeu}\n<details><summary>Partie exportée (JSON)</summary>\n\n${blocCode(json, 'json')}\n\n</details>\n`;
  const etiquettes = [demande.type === 'bug' ? 'rapport-bug' : 'rapport-partie'];
  if (enClair.length <= CORPS_MAX) return { titre, corps: enClair, etiquettes };
  const compresse = `${tete}\n${rejeu}\nPartie exportée, compressée (gzip puis base64) :\n\n${blocCode(await compresser(json), 'gzip-base64')}\n`;
  if (compresse.length <= CORPS_MAX) return { titre, corps: compresse, etiquettes };
  throw new ErreurTaille();
}

/**
 * Section `titre` d'un rapport, jusqu'au titre suivant, cherchée après le bloc du commentaire du joueur : ce qu'il a écrit,
 * titres et blocs de code compris, n'est jamais lu comme une section (#183). `null` si la section manque.
 */
function section(corps: string, titre: string): string | null {
  const texte = apresCommentaire(corps.replace(/\r\n/g, '\n'));
  const debut = texte.indexOf(`\n${titre}\n`);
  if (debut === -1) return null;
  const fin = texte.indexOf('\n### ', debut + 1);
  return texte.slice(debut, fin === -1 ? undefined : fin);
}

/** Texte qui suit le commentaire du joueur. Sa clôture est plus longue que toute suite d'accents graves qu'il contient. */
function apresCommentaire(texte: string): string {
  const entete = `\n${TITRE_COMMENTAIRE}\n\n`;
  const debut = texte.indexOf(entete);
  if (debut === -1) return texte;
  const reste = texte.slice(debut + entete.length);
  const ouverture = /^(`{3,})text\n/.exec(reste);
  if (ouverture?.[1] === undefined) return reste;
  const fin = reste.indexOf(`\n${ouverture[1]}\n`, ouverture[0].length - 1);
  return fin === -1 ? '' : reste.slice(fin + ouverture[1].length + 1);
}

/**
 * Inverse de `composer` pour les agents (PR-02) : l'export JSON d'une issue ou d'un commentaire de rapport, qu'il soit en
 * clair ou compressé. `null` si le texte n'est pas un rapport avec partie.
 */
export async function extrairePartie(corps: string): Promise<string | null> {
  if (!corps.includes(MARQUEUR)) return null;
  const texte = section(corps, TITRE_REJEU);
  if (texte === null) return null;
  const clair = /^(`{3,})json\n([\s\S]*?)\n\1$/m.exec(texte);
  if (clair?.[2] !== undefined) return clair[2];
  const compresse = /^(`{3,})gzip-base64\n([\s\S]*?)\n\1$/m.exec(texte);
  if (compresse?.[2] === undefined) return null;
  const binaire = atob(compresse[2].replace(/\s+/g, ''));
  const octets = Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
  const flux = new Blob([octets]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(flux).text();
}

/** Bloc de validation signée d'un rapport, tel que recopié ; `null` s'il n'y en a pas. Le robot de la PR seul le juge. */
export function extraireValidation(corps: string): unknown {
  if (!corps.includes(MARQUEUR)) return null;
  const texte = section(corps, TITRE_VALIDATION);
  if (texte === null) return null;
  const bloc = new RegExp(`^(\`{3,})${LANGAGE_VALIDATION}\\n([\\s\\S]*?)\\n\\1$`, 'm').exec(texte);
  if (bloc?.[2] === undefined) return null;
  try {
    return JSON.parse(bloc[2]) as unknown;
  } catch {
    return undefined;
  }
}

export class ErreurTaille extends Error {
  constructor() {
    super('Rapport trop grand pour GitHub.');
  }
}
