// ---------------------------------------------------------------------------
// src/engine/parser.ts — French natural language parser for player actions
// ---------------------------------------------------------------------------
// 6-strategy verb matching cascade, input normalization, compound detection,
// semantic fallback, and reformulation prompt generation.
// ---------------------------------------------------------------------------

import type { VerbId } from './verbs';
import { VERB_REGISTRY, VERB_IDS } from './verbs';
import { stemFr } from './snowball-fr';
import type {
  VerbMatch,
  VerbMatchStrategy,
  ParsedAction,
  Reformulation,
  ParseResult,
  ResolvedTarget,
  SceneContext,
} from './types';
import { isReformulation } from './types';
import { resolveTarget } from './resolver';
import { checkCompatibility } from './compatibility';

// === FRENCH STOP WORDS ===

/** French stop words — articles, pronouns, prepositions (not verbs or verb particles) */
export const FRENCH_STOP_WORDS: ReadonlySet<string> = new Set([
  // Articles
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  // Pronouns
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'ne', 'ce', 'sa', 'son', 'ma', 'mon', 'mes',
  'ton', 'ta', 'tes', 'ses', 'nos', 'vos', 'leur', 'leurs',
  // Common prepositions (keep "sur", "avec", "pour", "dans" — useful for compound detection)
  'en', 'par', 'qui', 'que', 'pas', 'plus', 'aussi',
  'et', 'ou', 'ni', 'si', 'car',
  // Misc
  'est', 'sont', 'etre', 'avoir', 'fait', 'tres', 'bien',
  'tout', 'tous', 'toute', 'toutes', 'cette', 'ces', 'cet',
]);

// === INPUT NORMALIZATION ===

/**
 * Normalize raw French input into clean tokens.
 * Pipeline: lowercase → strip accents → apostrophe→space → remove punct →
 * split on whitespace → drop single chars → remove stop words
 */
export function normalizeInput(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];

  let text = raw.toLowerCase();

  // Strip diacritics (NFD decompose + remove combining marks)
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Apostrophes → spaces (l'ennemi → l ennemi)
  text = text.replace(/[''ʼ`]/g, ' ');

  // Remove all punctuation except hyphens (keep compound words)
  text = text.replace(/[^\w\s-]/g, '');

  // Split on whitespace
  const rawTokens = text.split(/\s+/).filter((t) => t.length > 0);

  // Drop single-character tokens
  const filtered = rawTokens.filter((t) => t.length > 1);

  // Remove stop words
  const tokens = filtered.filter((t) => !FRENCH_STOP_WORDS.has(t));

  return tokens;
}

/**
 * Normalize with stop words preserved (for compound detection where
 * prepositions like "sur" matter).
 */
export function normalizeInputKeepPrepositions(raw: string): string[] {
  if (!raw || typeof raw !== 'string') return [];

  let text = raw.toLowerCase();
  text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  text = text.replace(/[''ʼ`]/g, ' ');
  text = text.replace(/[^\w\s-]/g, '');

  return text.split(/\s+/).filter((t) => t.length > 1);
}

// === CURATED FORM TABLE ===

/**
 * Maps ~300 conjugated/slang French forms to their verb IDs.
 * Organized by verb category for maintainability.
 */
export const CURATED_FORMS: ReadonlyMap<string, VerbId> = new Map<string, VerbId>([
  // ── FOR verbs ─────────────────────────────────────────
  // STRIKE
  ['frappe', 'STRIKE'], ['frappes', 'STRIKE'], ['frappez', 'STRIKE'],
  ['frappons', 'STRIKE'], ['frappais', 'STRIKE'], ['frappait', 'STRIKE'],
  ['frappant', 'STRIKE'], ['tape', 'STRIKE'], ['tapez', 'STRIKE'],
  ['cogne', 'STRIKE'], ['cognez', 'STRIKE'], ['assomme', 'STRIKE'],
  ['assommez', 'STRIKE'], ['bats', 'STRIKE'], ['battez', 'STRIKE'],
  ['tabasse', 'STRIKE'], ['tabassez', 'STRIKE'],
  // PUSH
  ['pousse', 'PUSH'], ['poussez', 'PUSH'], ['poussons', 'PUSH'],
  ['repousse', 'PUSH'], ['repoussez', 'PUSH'], ['bouscule', 'PUSH'],
  ['bousculez', 'PUSH'], ['deplace', 'PUSH'], ['deplacez', 'PUSH'],
  // PULL
  ['tire', 'PULL'], ['tirez', 'PULL'], ['tirons', 'PULL'],
  ['arrache', 'PULL'], ['arrachez', 'PULL'], ['arrachons', 'PULL'],
  ['extrais', 'PULL'], ['extrait', 'PULL'], ['extrayez', 'PULL'],
  ['retire', 'PULL'], ['retirez', 'PULL'],
  // LIFT
  ['souleve', 'LIFT'], ['soulevez', 'LIFT'], ['soulevons', 'LIFT'],
  ['porte', 'LIFT'], ['portez', 'LIFT'], ['leve', 'LIFT'], ['levez', 'LIFT'],
  // KICK
  ['shoote', 'KICK'], ['shootez', 'KICK'], ['botte', 'KICK'], ['bottez', 'KICK'],
  // BREAK
  ['casse', 'BREAK'], ['cassez', 'BREAK'], ['brise', 'BREAK'], ['brisez', 'BREAK'],
  ['fracasse', 'BREAK'], ['fracassez', 'BREAK'], ['fracassant', 'BREAK'],
  ['detruis', 'BREAK'], ['detruisez', 'BREAK'], ['defonce', 'BREAK'],
  ['defoncez', 'BREAK'],
  // BEND
  ['tords', 'BEND'], ['tordez', 'BEND'], ['plie', 'BEND'], ['pliez', 'BEND'],
  ['deforme', 'BEND'], ['deformez', 'BEND'],
  // CUT
  ['coupe', 'CUT'], ['coupez', 'CUT'], ['tranche', 'CUT'], ['tranchez', 'CUT'],
  ['taille', 'CUT'], ['taillez', 'CUT'], ['decoupe', 'CUT'], ['decoupez', 'CUT'],
  // FORCE_OPEN
  ['force', 'FORCE_OPEN'], ['forcez', 'FORCE_OPEN'],
  ['enfonce', 'FORCE_OPEN'], ['enfoncez', 'FORCE_OPEN'],
  // BITE
  ['mords', 'BITE'], ['mordez', 'BITE'], ['croque', 'BITE'], ['croquez', 'BITE'],
  // SQUEEZE
  ['serre', 'SQUEEZE'], ['serrez', 'SQUEEZE'], ['ecrase', 'SQUEEZE'],
  ['ecrasez', 'SQUEEZE'], ['comprime', 'SQUEEZE'], ['comprimez', 'SQUEEZE'],
  // IMPROVISE_WEAPON
  ['improvise', 'IMPROVISE_WEAPON'],
  // SACRIFICE
  ['sacrifie', 'SACRIFICE'], ['sacrifiez', 'SACRIFICE'],
  ['offre', 'SACRIFICE'], ['offrez', 'SACRIFICE'],

  // ── DEF verbs ─────────────────────────────────────────
  // BLOCK
  ['bloque', 'BLOCK'], ['bloquez', 'BLOCK'], ['pare', 'BLOCK'], ['parez', 'BLOCK'],
  ['protege', 'BLOCK'], ['protegez', 'BLOCK'],
  // IMPROVISE_SHIELD — handled by multi-word alias
  // BARRICADE
  ['barricade', 'BARRICADE'], ['barricadez', 'BARRICADE'],
  ['obstrue', 'BARRICADE'], ['obstruez', 'BARRICADE'],

  // ── INT verbs ─────────────────────────────────────────
  // READ
  ['lis', 'READ'], ['lisez', 'READ'], ['dechiffre', 'READ'],
  ['dechiffrez', 'READ'], ['consulte', 'READ'], ['consultez', 'READ'],
  // HACK
  ['pirate', 'HACK'], ['piratez', 'HACK'], ['hacke', 'HACK'],
  ['hackez', 'HACK'], ['cracke', 'HACK'], ['crackez', 'HACK'],
  ['bypasse', 'HACK'], ['bypassez', 'HACK'],
  // REPAIR
  ['repare', 'REPAIR'], ['reparez', 'REPAIR'], ['rafistole', 'REPAIR'],
  ['rafistolez', 'REPAIR'], ['bricole', 'REPAIR'], ['bricolez', 'REPAIR'],
  ['fixe', 'REPAIR'], ['fixez', 'REPAIR'],
  // DISASSEMBLE
  ['demonte', 'DISASSEMBLE'], ['demontez', 'DISASSEMBLE'],
  ['desassemble', 'DISASSEMBLE'], ['desassemblez', 'DISASSEMBLE'],
  // ASSEMBLE
  ['assemble', 'ASSEMBLE'], ['assemblez', 'ASSEMBLE'],
  ['combine', 'ASSEMBLE'], ['combinez', 'ASSEMBLE'],
  ['construis', 'ASSEMBLE'], ['construisez', 'ASSEMBLE'],
  ['fabrique', 'ASSEMBLE'], ['fabriquez', 'ASSEMBLE'],
  // ACTIVATE
  ['active', 'ACTIVATE'], ['activez', 'ACTIVATE'],
  ['allume', 'ACTIVATE'], ['allumez', 'ACTIVATE'],
  ['demarre', 'ACTIVATE'], ['demarrez', 'ACTIVATE'],
  // DEACTIVATE
  ['desactive', 'DEACTIVATE'], ['desactivez', 'DEACTIVATE'],
  ['eteins', 'DEACTIVATE'], ['eteignez', 'DEACTIVATE'],
  // REPROGRAM
  ['reprogramme', 'REPROGRAM'], ['reprogrammez', 'REPROGRAM'],
  ['reconfigure', 'REPROGRAM'], ['reconfigurez', 'REPROGRAM'],
  // LOCK
  ['verrouille', 'LOCK'], ['verrouillez', 'LOCK'],
  // UNLOCK
  ['deverrouille', 'UNLOCK'], ['deverrouillez', 'UNLOCK'],
  ['crochete', 'UNLOCK'], ['crochetez', 'UNLOCK'],
  // WELD
  ['soude', 'WELD'], ['soudez', 'WELD'],
  ['scelle', 'WELD'], ['scellez', 'WELD'],
  // PLUG
  ['branche', 'PLUG'], ['branchez', 'PLUG'],
  ['connecte', 'PLUG'], ['connectez', 'PLUG'],
  ['raccorde', 'PLUG'], ['raccordez', 'PLUG'],
  // OVERRIDE
  ['court-circuite', 'OVERRIDE'], ['shunt', 'OVERRIDE'], ['shuntez', 'OVERRIDE'],
  ['contourne', 'OVERRIDE'], ['contournez', 'OVERRIDE'],
  // SABOTAGE
  ['sabote', 'SABOTAGE'], ['sabotez', 'SABOTAGE'],
  ['trafique', 'SABOTAGE'], ['trafiquez', 'SABOTAGE'],
  // SET_TRAP
  ['piege', 'SET_TRAP'], ['piegez', 'SET_TRAP'],
  // IMPROVISE_TOOL — handled by multi-word alias
  // WEDGE
  ['coince', 'WEDGE'], ['coincez', 'WEDGE'],
  ['cale', 'WEDGE'], ['calez', 'WEDGE'],
  // IGNITE
  ['enflamme', 'IGNITE'], ['enflammez', 'IGNITE'],
  ['brule', 'IGNITE'], ['brulez', 'IGNITE'],
  // FLOOD
  ['inonde', 'FLOOD'], ['inondez', 'FLOOD'],
  ['noie', 'FLOOD'], ['noyez', 'FLOOD'],
  // ELECTRIFY
  ['electrifie', 'ELECTRIFY'], ['electrifiez', 'ELECTRIFY'],
  ['electrocute', 'ELECTRIFY'], ['electrocutez', 'ELECTRIFY'],
  // TIE
  ['attache', 'TIE'], ['attachez', 'TIE'],
  ['ligote', 'TIE'], ['ligotez', 'TIE'],
  ['noue', 'TIE'], ['nouez', 'TIE'],
  // COVER
  ['couvre', 'COVER'], ['couvrez', 'COVER'],
  ['recouvre', 'COVER'], ['recouvrez', 'COVER'],
  ['masque', 'COVER'], ['masquez', 'COVER'],

  // ── PER verbs ─────────────────────────────────────────
  // EXAMINE
  ['examine', 'EXAMINE'], ['examinez', 'EXAMINE'],
  ['inspecte', 'EXAMINE'], ['inspectez', 'EXAMINE'],
  ['observe', 'EXAMINE'], ['observez', 'EXAMINE'],
  ['regarde', 'EXAMINE'], ['regardez', 'EXAMINE'],
  ['etudie', 'EXAMINE'], ['etudiez', 'EXAMINE'],
  ['fouille', 'EXAMINE'], ['fouillez', 'EXAMINE'],
  // LISTEN
  ['ecoute', 'LISTEN'], ['ecoutez', 'LISTEN'],
  // SMELL
  ['sens', 'SMELL'], ['sentez', 'SMELL'],
  ['renifle', 'SMELL'], ['reniflez', 'SMELL'],
  // SCAN
  ['scanne', 'SCAN'], ['scannez', 'SCAN'],
  ['analyse', 'SCAN'], ['analysez', 'SCAN'],
  ['detecte', 'SCAN'], ['detectez', 'SCAN'],

  // ── CHA verbs ─────────────────────────────────────────
  // TALK
  ['parle', 'TALK'], ['parlez', 'TALK'],
  ['discute', 'TALK'], ['discutez', 'TALK'],
  ['dialogue', 'TALK'], ['dialoguez', 'TALK'],
  // PERSUADE
  ['persuade', 'PERSUADE'], ['persuadez', 'PERSUADE'],
  ['convaincs', 'PERSUADE'], ['convainquez', 'PERSUADE'],
  // INTIMIDATE
  ['intimide', 'INTIMIDATE'], ['intimidez', 'INTIMIDATE'],
  ['menace', 'INTIMIDATE'], ['menacez', 'INTIMIDATE'],
  // DECEIVE
  ['trompe', 'DECEIVE'], ['trompez', 'DECEIVE'],
  ['mens', 'DECEIVE'], ['mentez', 'DECEIVE'],
  ['dupe', 'DECEIVE'], ['dupez', 'DECEIVE'],
  // DISTRACT
  ['distrais', 'DISTRACT'], ['distrayez', 'DISTRACT'],
  ['detourne', 'DISTRACT'], ['detournez', 'DISTRACT'],
  // BARTER
  ['troque', 'BARTER'], ['troquez', 'BARTER'],
  ['echange', 'BARTER'], ['echangez', 'BARTER'],
  ['negocie', 'BARTER'], ['negociez', 'BARTER'],
  // SEDUCE
  ['seduis', 'SEDUCE'], ['seduisez', 'SEDUCE'],
  ['charme', 'SEDUCE'], ['charmez', 'SEDUCE'],
  // COMMAND
  ['commande', 'COMMAND'], ['commandez', 'COMMAND'],
  ['ordonne', 'COMMAND'], ['ordonnez', 'COMMAND'],
  // CALM
  ['calme', 'CALM'], ['calmez', 'CALM'],
  ['apaise', 'CALM'], ['apaisez', 'CALM'],
  // PROVOKE
  ['provoque', 'PROVOKE'], ['provoquez', 'PROVOKE'],
  ['enrage', 'PROVOKE'], ['enragez', 'PROVOKE'],
  // PLEAD
  ['supplie', 'PLEAD'], ['suppliez', 'PLEAD'],
  ['implore', 'PLEAD'], ['implorez', 'PLEAD'],
  // INTERROGATE
  ['interroge', 'INTERROGATE'], ['interrogez', 'INTERROGATE'],
  ['questionne', 'INTERROGATE'], ['questionnez', 'INTERROGATE'],
  // SIGNAL
  ['signale', 'SIGNAL'], ['signalez', 'SIGNAL'],
  // LURE
  ['attire', 'LURE'], ['attirez', 'LURE'],
  ['appate', 'LURE'], ['appatez', 'LURE'],

  // ── AGI verbs ─────────────────────────────────────────
  // THROW
  ['lance', 'THROW'], ['lancez', 'THROW'],
  ['jette', 'THROW'], ['jetez', 'THROW'],
  ['balance', 'THROW'], ['balancez', 'THROW'],
  ['projette', 'THROW'], ['projetez', 'THROW'],
  // SHOOT
  ['vise', 'SHOOT'], ['visez', 'SHOOT'],
  // CLIMB
  ['grimpe', 'CLIMB'], ['grimpez', 'CLIMB'],
  ['escalade', 'CLIMB'], ['escaladez', 'CLIMB'],
  ['monte', 'CLIMB'], ['montez', 'CLIMB'],
  // JUMP
  ['saute', 'JUMP'], ['sautez', 'JUMP'],
  ['bondis', 'JUMP'], ['bondissez', 'JUMP'],
  ['enjambe', 'JUMP'], ['enjambez', 'JUMP'],
  // DODGE
  ['esquive', 'DODGE'], ['esquivez', 'DODGE'],
  ['evite', 'DODGE'], ['evitez', 'DODGE'],
  ['baisse', 'DODGE'],
  // SWIM
  ['nage', 'SWIM'], ['nagez', 'SWIM'],
  ['plonge', 'SWIM'], ['plongez', 'SWIM'],
  // RUN
  ['cours', 'RUN'], ['courez', 'RUN'], ['courons', 'RUN'],
  ['sprinte', 'RUN'], ['sprintez', 'RUN'],
  ['fuis', 'RUN'], ['fuyez', 'RUN'], ['enfuis', 'RUN'],
  // HIDE
  ['cache', 'HIDE'], ['cachez', 'HIDE'],
  ['planque', 'HIDE'], ['planquez', 'HIDE'],
  ['dissimule', 'HIDE'], ['dissimulez', 'HIDE'],
  // STACK
  ['empile', 'STACK'], ['empilez', 'STACK'],
  ['entasse', 'STACK'], ['entassez', 'STACK'],

  // ── Interaction / Auto verbs ──────────────────────────
  // USE
  ['utilise', 'USE'], ['utilisez', 'USE'],
  ['emploie', 'USE'], ['employez', 'USE'],
  // OPEN
  ['ouvre', 'OPEN'], ['ouvrez', 'OPEN'],
  ['debloque', 'OPEN'], ['debloquez', 'OPEN'],
  // CLOSE
  ['ferme', 'CLOSE'], ['fermez', 'CLOSE'],
  ['referme', 'CLOSE'], ['refermez', 'CLOSE'],
  // TAKE
  ['prends', 'TAKE'], ['prenez', 'TAKE'],
  ['ramasse', 'TAKE'], ['ramassez', 'TAKE'],
  ['recupere', 'TAKE'], ['recuperez', 'TAKE'],
  // DROP
  ['pose', 'DROP'], ['posez', 'DROP'],
  ['lache', 'DROP'], ['lachez', 'DROP'],
  ['depose', 'DROP'], ['deposez', 'DROP'],
  // GIVE
  ['donne', 'GIVE'], ['donnez', 'GIVE'],
  // EQUIP
  ['equipe', 'EQUIP'], ['equipez', 'EQUIP'],
  // EAT
  ['mange', 'EAT'], ['mangez', 'EAT'],
  ['avale', 'EAT'], ['avalez', 'EAT'],
  ['consomme', 'EAT'], ['consommez', 'EAT'],
  // DRINK
  ['bois', 'DRINK'], ['buvez', 'DRINK'],
  // MOVE_TO
  ['vais', 'MOVE_TO'], ['allez', 'MOVE_TO'], ['allons', 'MOVE_TO'],
  ['deplace', 'MOVE_TO'], ['rends', 'MOVE_TO'],
  // WAIT
  ['attends', 'WAIT'], ['attendez', 'WAIT'],
  ['patiente', 'WAIT'], ['patientez', 'WAIT'],
  // TOUCH
  ['touche', 'TOUCH'], ['touchez', 'TOUCH'],
  ['tate', 'TOUCH'], ['tatez', 'TOUCH'],
  ['palpe', 'TOUCH'], ['palpez', 'TOUCH'],
]);

// === COMPOUND ACTION PATTERNS ===

/** Multi-word patterns that override single-token verb matching */
export interface CompoundPattern {
  readonly tokens: readonly string[];
  readonly verb: VerbId;
}

/**
 * Compound patterns checked before single-token matching.
 * Longer patterns are checked first (sorted by token count descending).
 */
export const COMPOUND_PATTERNS: readonly CompoundPattern[] = [
  // "tirer sur" → SHOOT (not PULL)
  { tokens: ['tirer', 'sur'], verb: 'SHOOT' },
  { tokens: ['tire', 'sur'], verb: 'SHOOT' },
  { tokens: ['tirez', 'sur'], verb: 'SHOOT' },
  { tokens: ['faire', 'feu'], verb: 'SHOOT' },
  { tokens: ['fait', 'feu'], verb: 'SHOOT' },
  // "se cacher" → HIDE
  { tokens: ['se', 'cacher'], verb: 'HIDE' },
  { tokens: ['se', 'cache'], verb: 'HIDE' },
  { tokens: ['se', 'cachez'], verb: 'HIDE' },
  { tokens: ['se', 'planquer'], verb: 'HIDE' },
  { tokens: ['se', 'planque'], verb: 'HIDE' },
  { tokens: ['se', 'dissimuler'], verb: 'HIDE' },
  // "se proteger" → BLOCK
  { tokens: ['se', 'proteger'], verb: 'BLOCK' },
  { tokens: ['se', 'protege'], verb: 'BLOCK' },
  // "donner un coup de pied" → KICK
  { tokens: ['coup', 'pied'], verb: 'KICK' },
  // "mettre le feu" → IGNITE
  { tokens: ['mettre', 'feu'], verb: 'IGNITE' },
  { tokens: ['mets', 'feu'], verb: 'IGNITE' },
  { tokens: ['mettez', 'feu'], verb: 'IGNITE' },
  // "utiliser comme arme" → IMPROVISE_WEAPON
  { tokens: ['utiliser', 'comme', 'arme'], verb: 'IMPROVISE_WEAPON' },
  { tokens: ['utilise', 'comme', 'arme'], verb: 'IMPROVISE_WEAPON' },
  { tokens: ['utilisez', 'comme', 'arme'], verb: 'IMPROVISE_WEAPON' },
  // "utiliser comme bouclier" → IMPROVISE_SHIELD
  { tokens: ['utiliser', 'comme', 'bouclier'], verb: 'IMPROVISE_SHIELD' },
  { tokens: ['utilise', 'comme', 'bouclier'], verb: 'IMPROVISE_SHIELD' },
  { tokens: ['utilisez', 'comme', 'bouclier'], verb: 'IMPROVISE_SHIELD' },
  // "utiliser comme outil" → IMPROVISE_TOOL
  { tokens: ['utiliser', 'comme', 'outil'], verb: 'IMPROVISE_TOOL' },
  { tokens: ['utilise', 'comme', 'outil'], verb: 'IMPROVISE_TOOL' },
  // "tendre un piege" / "tendre piege" → SET_TRAP
  { tokens: ['tendre', 'piege'], verb: 'SET_TRAP' },
  { tokens: ['tends', 'piege'], verb: 'SET_TRAP' },
  { tokens: ['tendez', 'piege'], verb: 'SET_TRAP' },
  // "fermer a cle" → LOCK
  { tokens: ['fermer', 'cle'], verb: 'LOCK' },
  { tokens: ['ferme', 'cle'], verb: 'LOCK' },
  { tokens: ['fermez', 'cle'], verb: 'LOCK' },
  // "remplir d'eau" → FLOOD
  { tokens: ['remplir', 'eau'], verb: 'FLOOD' },
  { tokens: ['remplis', 'eau'], verb: 'FLOOD' },
  // "se deplacer" → MOVE_TO
  { tokens: ['se', 'deplacer'], verb: 'MOVE_TO' },
  { tokens: ['se', 'rendre'], verb: 'MOVE_TO' },
  // "s'enfuir" → RUN
  { tokens: ['enfuir'], verb: 'RUN' },
  // "se baisser" → DODGE
  { tokens: ['se', 'baisser'], verb: 'DODGE' },
  { tokens: ['se', 'baisse'], verb: 'DODGE' },
  // "tendre l'oreille" → LISTEN
  { tokens: ['tendre', 'oreille'], verb: 'LISTEN' },
  // "detourner attention" → DISTRACT
  { tokens: ['detourner', 'attention'], verb: 'DISTRACT' },
  { tokens: ['detourne', 'attention'], verb: 'DISTRACT' },
  // "faire signe" → SIGNAL
  { tokens: ['faire', 'signe'], verb: 'SIGNAL' },
  { tokens: ['fait', 'signe'], verb: 'SIGNAL' },
  { tokens: ['faites', 'signe'], verb: 'SIGNAL' },
  // "bloquer avec" → WEDGE (context-dependent)
  { tokens: ['bloquer', 'avec'], verb: 'WEDGE' },
].sort((a, b) => b.tokens.length - a.tokens.length) as unknown as readonly CompoundPattern[];

// === PRE-STEMMED ALIAS INDEX ===

/** Pre-stemmed verb aliases for strategy 3 (built once at module load) */
const STEMMED_ALIAS_INDEX: ReadonlyMap<string, VerbId> = (() => {
  const index = new Map<string, VerbId>();
  for (const verbId of VERB_IDS) {
    const entry = VERB_REGISTRY[verbId];
    for (const alias of entry.aliases.fr) {
      // Normalize the alias the same way we'll normalize input
      const normalized = alias
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const stemmed = stemFr(normalized.split(/\s+/)[0] ?? '');
      if (stemmed.length >= 3 && !index.has(stemmed)) {
        index.set(stemmed, verbId);
      }
    }
  }
  return index;
})();

// === SEMANTIC INTENT CLASSIFICATION ===

/** Keywords for semantic fallback (strategy 6) */
const INTENT_KEYWORDS: ReadonlyMap<string, VerbId> = new Map([
  // Aggressive
  ['attaquer', 'STRIKE'], ['agresser', 'STRIKE'], ['combattre', 'STRIKE'],
  ['frapper', 'STRIKE'], ['tuer', 'STRIKE'], ['eliminer', 'STRIKE'],
  ['violence', 'STRIKE'], ['combat', 'STRIKE'], ['guerre', 'STRIKE'],
  ['bagarre', 'STRIKE'], ['baston', 'STRIKE'],
  // Movement
  ['aller', 'MOVE_TO'], ['partir', 'MOVE_TO'], ['marcher', 'MOVE_TO'],
  ['avancer', 'MOVE_TO'], ['reculer', 'MOVE_TO'], ['direction', 'MOVE_TO'],
  // Inspection
  ['voir', 'EXAMINE'], ['chercher', 'EXAMINE'], ['trouver', 'EXAMINE'],
  ['verifier', 'EXAMINE'], ['explorer', 'EXAMINE'],
  // Communication
  ['demander', 'TALK'], ['appeler', 'TALK'], ['crier', 'TALK'],
  ['hurler', 'TALK'], ['chuchoter', 'TALK'],
  // Hiding
  ['fuir', 'RUN'], ['echapper', 'RUN'], ['sauver', 'RUN'],
  // Taking
  ['recuperer', 'TAKE'], ['attraper', 'TAKE'], ['saisir', 'TAKE'],
  ['voler', 'TAKE'],
  // Using
  ['utiliser', 'USE'], ['employer', 'USE'], ['servir', 'USE'],
]);

// === VERB MATCHING ===

/**
 * Check for compound patterns in the full (non-stop-word-filtered) tokens.
 * Returns the matching compound or null.
 */
function matchCompound(fullTokens: readonly string[]): CompoundPattern | null {
  for (const pattern of COMPOUND_PATTERNS) {
    // Check if all pattern tokens appear in order in the input
    let patternIdx = 0;
    for (const token of fullTokens) {
      if (patternIdx < pattern.tokens.length && token === pattern.tokens[patternIdx]) {
        patternIdx++;
      }
      if (patternIdx === pattern.tokens.length) {
        return pattern;
      }
    }
  }
  return null;
}

/**
 * Match a verb from normalized tokens using the 6-strategy cascade.
 * Returns the best match or null if nothing matches.
 *
 * Strategies:
 * 1. Exact alias match
 * 2. Curated form table
 * 3. Snowball stem match
 * 4. Prefix match (4+ chars)
 * 5. Compound action detection
 * 6. Semantic fallback (intent keywords)
 */
export function matchVerb(tokens: readonly string[], fullTokens: readonly string[]): VerbMatch | null {
  // Strategy 5 first: compound detection (highest specificity for multi-word patterns)
  const compound = matchCompound(fullTokens);
  if (compound) {
    return {
      verb: compound.verb,
      strategy: 5 as VerbMatchStrategy,
      confidence: 0.9,
      isCompound: true,
      compoundTokens: compound.tokens,
    };
  }

  // Strategy 1: Exact alias match
  for (const token of tokens) {
    for (const verbId of VERB_IDS) {
      const entry = VERB_REGISTRY[verbId];
      if (entry.aliases.fr.some((alias) => {
        const normalizedAlias = alias
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalizedAlias === token;
      })) {
        return {
          verb: verbId,
          strategy: 1 as VerbMatchStrategy,
          confidence: 1.0,
          isCompound: false,
        };
      }
    }
  }

  // Strategy 2: Curated form table
  for (const token of tokens) {
    const verb = CURATED_FORMS.get(token);
    if (verb) {
      return {
        verb,
        strategy: 2 as VerbMatchStrategy,
        confidence: 0.95,
        isCompound: false,
      };
    }
  }

  // Strategy 3: Snowball stem match
  for (const token of tokens) {
    const stemmed = stemFr(token);
    const verb = STEMMED_ALIAS_INDEX.get(stemmed);
    if (verb) {
      return {
        verb,
        strategy: 3 as VerbMatchStrategy,
        confidence: 0.8,
        isCompound: false,
      };
    }
  }

  // Strategy 4: Prefix match (4+ chars)
  for (const token of tokens) {
    if (token.length < 4) continue;
    const prefix = token.slice(0, 4);
    for (const verbId of VERB_IDS) {
      const entry = VERB_REGISTRY[verbId];
      if (entry.aliases.fr.some((alias) => {
        const normalizedAlias = alias
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalizedAlias.startsWith(prefix) && normalizedAlias.length >= 4;
      })) {
        return {
          verb: verbId,
          strategy: 4 as VerbMatchStrategy,
          confidence: 0.6,
          isCompound: false,
        };
      }
    }
  }

  // Strategy 6: Semantic fallback (intent keywords)
  for (const token of tokens) {
    const verb = INTENT_KEYWORDS.get(token);
    if (verb) {
      return {
        verb,
        strategy: 6 as VerbMatchStrategy,
        confidence: 0.4,
        isCompound: false,
      };
    }
    // Also try stemmed version against intent keywords
    const stemmed = stemFr(token);
    for (const [keyword, verbId] of INTENT_KEYWORDS) {
      const stemmedKeyword = stemFr(keyword);
      if (stemmed === stemmedKeyword) {
        return {
          verb: verbId,
          strategy: 6 as VerbMatchStrategy,
          confidence: 0.3,
          isCompound: false,
        };
      }
    }
  }

  return null;
}

// === REFORMULATION ===

/**
 * Generate a reformulation when the parser can't determine the player's intent.
 * Produces 2-3 best-guess interpretations based on partial matches.
 */
export function generateReformulation(
  rawInput: string,
  tokens: readonly string[],
  context: SceneContext,
): Reformulation {
  const interpretations: ParsedAction[] = [];

  // Try to find partial verb matches and construct interpretations
  const candidateVerbs: VerbId[] = [];

  // Check if any token partially matches a verb alias
  for (const token of tokens) {
    if (token.length < 3) continue;
    for (const verbId of VERB_IDS) {
      const entry = VERB_REGISTRY[verbId];
      if (entry.aliases.fr.some((alias) => {
        const normalizedAlias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalizedAlias.includes(token) || token.includes(normalizedAlias.slice(0, 3));
      })) {
        if (!candidateVerbs.includes(verbId)) {
          candidateVerbs.push(verbId);
        }
      }
    }
    if (candidateVerbs.length >= 3) break;
  }

  // If no partial matches, suggest common verbs
  if (candidateVerbs.length === 0) {
    candidateVerbs.push('EXAMINE', 'STRIKE', 'USE');
  }

  // Build interpretations (max 3)
  for (const verbId of candidateVerbs.slice(0, 3)) {
    const target = resolveTarget(tokens, verbId, context);
    const verbMatch: VerbMatch = {
      verb: verbId,
      strategy: 6 as VerbMatchStrategy,
      confidence: 0.2,
      isCompound: false,
    };
    interpretations.push({
      verb: verbId,
      target,
      tool: null,
      rawInput,
      tokens,
      verbMatch,
      creative: false,
    });
  }

  return {
    type: 'reformulation',
    rawInput,
    interpretations,
    prompt: 'Que tentez-vous exactement ?',
  };
}

// === TOP-LEVEL PARSER ===

/**
 * Parse raw French player input into a `ParsedAction` or `Reformulation`.
 *
 * Pipeline:
 * 1. Normalize input
 * 2. Match verb (6-strategy cascade)
 * 3. If no verb → generate reformulation
 * 4. Resolve target
 * 5. Assemble ParsedAction
 */
export function parseAction(rawInput: string, context: SceneContext): ParseResult {
  if (!rawInput || typeof rawInput !== 'string' || rawInput.trim().length === 0) {
    return generateReformulation(rawInput ?? '', [], context);
  }

  const tokens = normalizeInput(rawInput);
  const fullTokens = normalizeInputKeepPrepositions(rawInput);

  if (tokens.length === 0) {
    return generateReformulation(rawInput, [], context);
  }

  // Match verb
  const verbMatch = matchVerb(tokens, fullTokens);

  if (!verbMatch) {
    return generateReformulation(rawInput, tokens, context);
  }

  // Resolve target
  const target = resolveTarget(tokens, verbMatch.verb, context);

  // Detect creativity (is this different from suggestions?)
  const creative = context.suggestions.length > 0 &&
    !context.suggestions.some((s) =>
      s.verb === verbMatch.verb && s.target?.id === target?.id,
    );

  const action: ParsedAction = {
    verb: verbMatch.verb,
    target,
    tool: null, // Tool resolution is context-dependent, simplified for Phase 2
    rawInput,
    tokens,
    verbMatch,
    creative,
  };

  return action;
}
