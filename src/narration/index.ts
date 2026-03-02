// ---------------------------------------------------------------------------
// src/narration/index.ts — Public API + turn-level narrative bridge
// ---------------------------------------------------------------------------
// This module bridges the engine's TurnResult with the narrative composer.
// The UI/store layer calls processTurn() then narrateForTurn() — keeping
// the engine layer free of narration imports (dependency flows downward).
// ---------------------------------------------------------------------------

import type { TurnResult, SceneContext, SceneDescription, GameState, ConsequenceType } from '../engine/types';
import type { VerbId } from '../engine/verbs';
import type { Locale, StringKey } from '../i18n/types';
import type { GrammaticalInfo } from '../i18n/grammar/interface';
import type { LocationNode } from '../engine/scenario';
import type {
  NarrativeContext, NarrativeSettings, Outcome, VerbCategory,
  TargetInfo, ItemInfo, NpcInfo, LocationInfo, StateChange,
} from './types';
import { NARRATIVE_PRESETS } from './types';
import { composeNarrative, getVerbCategory } from './composer';
import { getLocale, t } from '../i18n/index';
import { narrationMemory } from './memory';

export { composeNarrative, resetComposer } from './composer';
export { renderTemplate, renderTemplateWithSlots, getGrammarEngine, detectSelfReference } from './templateEngine';
export { NarrationMemory } from './memory';
export { selectGameplayHint, resetHintMemory } from './hints';
export type { NarrativeContext, NarrativeSettings, NarrativePreset } from './types';
export { NARRATIVE_PRESETS } from './types';

// === OUTCOME MAPPING ===

/** Map engine RollOutcome to narrative Outcome */
function mapOutcome(trace: TurnResult['trace']): Outcome {
  if (trace.isAutoVerb) return 'auto_success';
  if (!trace.outcome) return 'auto_success';
  return trace.outcome as Outcome;
}

// === DEFAULT GRAMMAR INFO ===

const DEFAULT_GRAMMAR: GrammaticalInfo = { gender: 'M', startsWithVowel: false, plural: false };

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'é', 'è', 'ê', 'ë', 'â', 'î', 'ô', 'û', 'ù']);
/** Aspirated-h words: no elision ("le hasard", not "l'hasard") */
const ASPIRATED_H = new Set([
  'hasard', 'haut', 'haute', 'hauts', 'hautes', 'hauteur',
  'honte', 'hors', 'hurler', 'hibou', 'haricot', 'haricots',
  'héros', 'hache', 'haches', 'hamac', 'hamacs', 'hangar', 'hangars',
  'harpon', 'harpons', 'haine', 'hameau', 'hameaux', 'harpe',
  'haie', 'haies', 'hall', 'halls', 'halte', 'hamster',
  'handicap', 'harem', 'hareng', 'harengs', 'harnais',
  'hussard', 'hutte', 'huttes', 'hublot', 'hublots',
]);
const FEMININE_SUFFIXES = [
  'tion', 'sion', 'ure', 'ée', 'ie', 'ise', 'ade', 'ande', 'ence', 'ance',
  'esse', 'euse', 'trice', 'ette', 'elle', 'ine', 'ère',
  'ule', 'mpe', 'sse', 'nce', 'che', 'rte', 'lle', 'tte', 'ive',
];
/** Known feminine French nouns (first word of compound names).
 * Covers common game objects not caught by suffix heuristic. */
const KNOWN_FEMININE_NOUNS = new Set([
  'capsule', 'lampe', 'salle', 'porte', 'armoire', 'valve', 'brèche',
  'couchette', 'navette', 'trousse', 'combinaison', 'station', 'clé',
  'torche', 'carte', 'console', 'entité', 'créature', 'inscription',
  'baie', 'paroi', 'cloison', 'cabine', 'soute', 'passerelle',
  'issue', 'sortie', 'entrée', 'zone', 'chambre', 'caverne',
  'mine', 'grotte', 'fissure', 'table', 'chaise', 'boîte',
  'caisse', 'coque', 'bouteille', 'fiole', 'seringue', 'pilule',
  'antenne', 'alarme', 'sirène',
]);
const PLURAL_MARKERS = ['s', 'x'];

/**
 * Detect basic grammatical info from a French noun phrase.
 * Not perfect but far better than always defaulting to masculine.
 */
function detectGrammar(frenchName: string): GrammaticalInfo {
  if (!frenchName) return DEFAULT_GRAMMAR;
  const lower = frenchName.toLowerCase().trim();
  const firstChar = lower[0] ?? '';
  const firstWord = lower.split(/\s+/)[0] ?? '';
  // Vowels elide; mute-h words elide too ("l'homme"), but aspirated-h words don't ("le hasard")
  const startsWithVowel = VOWELS.has(firstChar)
    || (firstChar === 'h' && !ASPIRATED_H.has(firstWord));

  // Detect gender from the FIRST noun word (skip articles/adjectives)
  const words = lower.split(/\s+/);
  // In French compound names like "kit médical", the main noun is usually the first word
  const mainWord = words[0] ?? '';
  let gender: 'M' | 'F' = 'M';
  // Check known feminine nouns first (exact match)
  if (KNOWN_FEMININE_NOUNS.has(mainWord)) {
    gender = 'F';
  } else {
    for (const suffix of FEMININE_SUFFIXES) {
      if (mainWord.endsWith(suffix)) {
        gender = 'F';
        break;
      }
    }
  }

  // Detect plural from the main word
  const lastChar = mainWord[mainWord.length - 1] ?? '';
  const plural = PLURAL_MARKERS.includes(lastChar) && mainWord.length > 2;

  return { gender, startsWithVowel, plural };
}

// === CONSEQUENCE TYPE MAPPING ===

/** Translate engine ConsequenceType to narration stateChangeType vocabulary. */
function mapConsequenceType(type: ConsequenceType): string {
  switch (type) {
    case 'damage':           return 'hp_loss';
    case 'heal':             return 'hp_gain';
    case 'condition_add':    return 'condition_gained';
    case 'condition_remove': return 'condition_removed';
    case 'inventory_add':    return 'item_gained';
    case 'inventory_remove': return 'item_lost';
    case 'item_break':       return 'item_broken';
    default:                 return 'generic';
  }
}

// === CONTEXT BUILDER ===

/**
 * Build a NarrativeContext from a TurnResult + SceneContext.
 * This is the bridge between the engine output and the narration system.
 */
export function buildNarrativeContext(
  result: TurnResult,
  sceneContext: SceneContext,
  state: GameState,
): NarrativeContext {
  const trace = result.trace;
  const verb: VerbId = trace.parsedVerb ?? 'WAIT';
  const verbCategory: VerbCategory = getVerbCategory(verb);
  const outcome: Outcome = mapOutcome(trace);

  // Margin: how far above/below DC
  const margin = trace.difficultyBreakdown
    ? (result.diceRoll?.total ?? 0) - trace.effectiveDC
    : 0;

  // Build target info from scene context
  const targetInfo = buildTargetInfo(trace.parsedTarget, sceneContext);

  // Build tool info (first equipped weapon or null)
  const toolInfo = buildToolInfo(sceneContext, state);

  // Build location info
  const locationInfo: LocationInfo = {
    id: sceneContext.locationId ?? '',
    name: sceneContext.sceneDescription?.locationDescription ?? sceneContext.locationId ?? 'unknown',
    description: '',
    features: sceneContext.environmentFeatures.map(f => f.nameKey),
    conditions: new Set(sceneContext.environmentConditions),
  };

  // Build NPC info from scene context
  const npcs: NpcInfo[] = sceneContext.npcs.map(npc => ({
    id: npc.id,
    name: t(npc.nameKey as StringKey),
    disposition: 'neutral' as const,  // Default — will be overridden by scenario data
    grammar: DEFAULT_GRAMMAR,
  }));

  // Build state changes from consequence trace
  const stateChanges: StateChange[] = trace.consequenceDetails.map((desc, i) => ({
    type: mapConsequenceType(trace.consequenceTypes[i] ?? 'damage'),
    description: desc,
  }));

  // Derive player conditions
  const playerConditions = new Set(
    state.character?.conditions.map(c => c.id) ?? [],
  );

  // Derive environment conditions
  const envConditions = new Set(sceneContext.environmentConditions);

  // Player HP percentage
  const playerHpPercent = state.character
    ? state.character.hp / state.character.maxHp
    : 1.0;

  return {
    verb,
    verbCategory,
    outcome,
    margin,
    target: targetInfo,
    targetDisposition: 'neutral',
    toolUsed: toolInfo,
    location: locationInfo,
    environmentConditions: envConditions,
    tension: beatToTension(state.currentBeat),
    beat: state.currentBeat,
    settingId: state.scenarioId ?? 'derelict_ship',
    playerHpPercent,
    playerConditions,
    moduleId: '',
    moduleType: 'exploration',
    npcsPresent: npcs,
    recentEvents: trace.consequenceDetails,
    turnNumber: state.turn,
    isCreative: trace.parseCreative,
    isAbsurd: trace.parseCreative && trace.parseStrategy >= 5,
    stateChanges,
  };
}

/** Derive numeric tension from story beat */
function beatToTension(beat: string): number {
  switch (beat) {
    case 'intro': return 2;
    case 'rising': return 4;
    case 'midpoint': return 5;
    case 'escalation': return 7;
    case 'climax': return 9;
    case 'resolution': return 3;
    default: return 5;
  }
}

/** Build TargetInfo from scene context + target ID */
function buildTargetInfo(
  targetId: string | null,
  sceneContext: SceneContext,
): TargetInfo | null {
  if (!targetId) return null;

  // Check connected locations first (for MOVE_TO targets)
  const connectedLoc = sceneContext.connectedLocations.find(loc => loc.id === targetId);
  if (connectedLoc) {
    // Use displayName (French nameKey) if available, else first alias
    const name = connectedLoc.displayName ?? connectedLoc.aliases[0] ?? targetId.replace(/_/g, ' ');
    const grammar = detectGrammar(name);
    return {
      id: targetId,
      name,
      type: 'location',
      properties: [],
      grammar,
    };
  }

  // Search all scene entities for a match
  const allEntities = [
    ...sceneContext.locationItems,
    ...sceneContext.inventory,
    ...sceneContext.environmentFeatures.map(f => ({
      id: f.id,
      nameKey: f.nameKey,
      aliases: f.aliases,
      properties: f.properties,
      isVirtual: false,
      source: 'environment' as const,
    })),
    ...sceneContext.npcs.map(n => ({
      id: n.id,
      nameKey: n.nameKey,
      aliases: n.aliases,
      properties: n.properties,
      isVirtual: false,
      source: 'npc' as const,
    })),
  ];

  const entity = allEntities.find(e => e.id === targetId);
  if (!entity) {
    // Try i18n lookup for common entity prefixes before falling back to raw ID
    for (const prefix of ['item', 'npc', 'env'] as const) {
      const key = `${prefix}.${targetId}` as StringKey;
      const resolved = t(key);
      if (resolved !== key) {
        const grammar = detectGrammar(resolved);
        return {
          id: targetId,
          name: resolved,
          type: 'unknown',
          properties: [],
          grammar,
        };
      }
    }
    // Final fallback: humanize the raw ID
    return {
      id: targetId,
      name: targetId.replace(/_/g, ' '),
      type: 'unknown',
      properties: [],
      grammar: DEFAULT_GRAMMAR,
    };
  }

  const resolvedName = t(entity.nameKey as StringKey);
  const grammar = detectGrammar(resolvedName);

  return {
    id: entity.id,
    name: resolvedName,
    type: entity.properties[0] ?? 'unknown',
    properties: entity.properties,
    grammar,
  };
}

/** Build tool info from the currently equipped tool */
function buildToolInfo(
  sceneContext: SceneContext,
  state: GameState,
): ItemInfo | null {
  const equippedTool = state.character?.equippedWeapon;
  if (!equippedTool) return null;

  const item = sceneContext.inventory.find(i => i.id === equippedTool);
  if (!item) return null;

  return {
    id: item.id,
    name: t(item.nameKey as StringKey),
    grammar: DEFAULT_GRAMMAR,
  };
}

// === PUBLIC NARRATIVE FUNCTION ===

/**
 * Generate narrative text for a completed turn.
 *
 * Call this AFTER processTurn() — it takes the result, scene context,
 * and returns a complete narrative string with grammar-correct French.
 *
 * @param result - The TurnResult from processTurn()
 * @param sceneContext - The same SceneContext passed to processTurn()
 * @param state - The game state BEFORE the turn (for deriving context)
 * @param settings - Optional narrative length preset
 * @param locale - Optional locale override
 * @returns Composed narrative string
 */
export function narrateForTurn(
  result: TurnResult,
  sceneContext: SceneContext,
  state: GameState,
  settings?: NarrativeSettings,
  locale?: Locale,
): string {
  // If the turn was reformulated (ambiguous), return the reformulation prompt as-is
  if (result.trace.reformulated) {
    return result.narrative;
  }

  // If the game is over, return empty
  if (result.newState.phase === 'defeat' || result.newState.phase === 'victory') {
    return result.narrative || '';
  }

  // C3-8: If a scenario interaction produced a narrative override, use it directly
  if (result.trace.scenarioInteractionMatched && result.trace.scenarioNarrativeOverride) {
    const override = result.trace.scenarioNarrativeOverride;
    const effectiveLocale = locale ?? getLocale();
    return effectiveLocale === 'fr' ? override.fr : (override.en || override.fr);
  }

  // Special case: EXAMINE on abstract environment target → rich scene description
  const isExamineEnvironment = result.trace.parsedVerb === 'EXAMINE'
    && result.trace.parsedTarget === 'environment'
    && sceneContext.sceneDescription;
  const isSuccessful = result.trace.outcome === 'success'
    || result.trace.outcome === 'crit_success'
    || result.trace.isAutoVerb;

  if (isExamineEnvironment && isSuccessful) {
    return buildExamineEnvironmentNarrative(sceneContext.sceneDescription);
  }

  // Anti-repetition: detect repeated EXAMINE/SCAN on same target
  const EXAMINE_LIKE: ReadonlySet<VerbId> = new Set(['EXAMINE', 'SCAN', 'LISTEN', 'SMELL', 'READ']);
  const parsedVerb = result.trace.parsedVerb ?? 'WAIT';
  const parsedTarget = result.trace.parsedTarget ?? '';
  if (EXAMINE_LIKE.has(parsedVerb) && parsedTarget) {
    const isRepeat = narrationMemory.trackPair(parsedVerb, parsedTarget);
    if (isRepeat) {
      return 'Vous ne remarquez rien de nouveau.';
    }
  }

  // Build narrative context from turn data
  const ctx = buildNarrativeContext(result, sceneContext, state);

  // Compose the narrative
  const effectiveSettings = settings ?? NARRATIVE_PRESETS.standard;
  const effectiveLocale = locale ?? getLocale();

  let narrative = composeNarrative(ctx, effectiveSettings, undefined, effectiveLocale);

  // Append revelation content for EXAMINE/TALK on scenario entities
  if (isSuccessful || result.trace.outcome === 'failure' || result.trace.outcome === 'crit_failure') {
    const revealText = getRevealContent(
      result.trace.parsedVerb ?? 'WAIT',
      result.trace.parsedTarget ?? '',
      isSuccessful,
      sceneContext.locationId ?? '',
      state,
      effectiveLocale,
    );
    if (revealText) {
      narrative = narrative ? `${narrative} ${revealText}` : revealText;
    }
  }

  return narrative;
}

// === EXAMINE ENVIRONMENT — rich scene description ===

/**
 * Build a detailed scene description when the player examines the environment.
 * Lists location flavor, obstacle, items, features, NPCs, and exits.
 */
function buildExamineEnvironmentNarrative(scene: SceneDescription): string {
  const parts: string[] = [];

  // Location flavor
  parts.push(`Vous observez les lieux. ${scene.locationDescription}`);

  // Obstacle hint
  if (scene.obstacleHint) {
    parts.push(scene.obstacleHint);
  }

  // Visible items
  if (scene.visibleItems.length > 0) {
    const itemNames = scene.visibleItems.map(i => i.name).join(', ');
    parts.push(`Vous remarquez : ${itemNames}.`);
  }

  // Environment features
  if (scene.visibleFeatures.length > 0) {
    const featureNames = scene.visibleFeatures.map(f => f.name).join(', ');
    parts.push(`L'environnement présente : ${featureNames}.`);
  }

  // NPCs
  if (scene.visibleNpcs.length > 0) {
    const npcNames = scene.visibleNpcs.map(n => n.name).join(', ');
    parts.push(`Présences : ${npcNames}.`);
  }

  // Exits
  if (scene.exits.length > 0) {
    const exitDescs = scene.exits.map(e =>
      e.visited ? `${e.name} [exploré]` : `${e.name} [inexploré]`,
    );
    parts.push(`Sorties : ${exitDescs.join(', ')}.`);
  }

  return parts.join(' ');
}

// === REVELATION SYSTEM — scenario-aware content reveals ===

/** Verbs that trigger entity-specific revelation content */
const EXAMINE_VERBS = new Set<VerbId>([
  'EXAMINE', 'SCAN', 'READ', 'LISTEN', 'SMELL',
]);

const TALK_VERBS = new Set<VerbId>([
  'TALK', 'PERSUADE', 'INTERROGATE', 'PLEAD', 'CALM',
]);

/**
 * Get scenario-specific revelation content for EXAMINE/TALK actions.
 * Searches the current location in the assembled scenario for the target
 * entity and returns its examineResult or talkSuccess/talkFailure text.
 */
function getRevealContent(
  verb: VerbId,
  targetId: string,
  isSuccessful: boolean,
  locationId: string,
  state: GameState,
  locale: Locale,
): string | null {
  if (!targetId || !state.scenario) return null;

  const node = findLocationNode(state.scenario.graph.nodes, locationId);
  if (!node) return null;

  const localeKey = locale === 'en' ? 'en' : 'fr';

  // EXAMINE verbs → check items, features, obstacle target
  if (EXAMINE_VERBS.has(verb) && isSuccessful) {
    // Check items
    const item = node.items.find(i => i.id === targetId);
    if (item?.examineResult) {
      return item.examineResult[localeKey] || item.examineResult.fr;
    }

    // Check features
    const feature = node.features.find(f => f.id === targetId);
    if (feature?.examineResult) {
      return feature.examineResult[localeKey] || feature.examineResult.fr;
    }

    // Check obstacle target
    if (node.obstacle && node.obstacle.targetId === targetId && node.obstacle.resolveReveal) {
      return node.obstacle.resolveReveal[localeKey] || node.obstacle.resolveReveal.fr;
    }

    // Check NPCs (examining an NPC gives basic info)
    const npc = (node.npcs ?? []).find(n => n.id === targetId);
    if (npc?.talkSuccess) {
      // EXAMINE on NPC gives a hint of dialogue potential
      return null; // Only TALK reveals dialogue
    }
  }

  // TALK verbs → check NPC dialogue
  if (TALK_VERBS.has(verb)) {
    const npc = (node.npcs ?? []).find(n => n.id === targetId);
    if (npc) {
      if (isSuccessful && npc.talkSuccess) {
        return npc.talkSuccess[localeKey] || npc.talkSuccess.fr;
      }
      if (!isSuccessful && npc.talkFailure) {
        return npc.talkFailure[localeKey] || npc.talkFailure.fr;
      }
    }
  }

  return null;
}

/** Find a LocationNode by ID in the scenario graph */
function findLocationNode(
  nodes: readonly LocationNode[],
  locationId: string,
): LocationNode | null {
  return nodes.find(n => n.id === locationId) ?? null;
}
