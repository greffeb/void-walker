// ---------------------------------------------------------------------------
// src/narration/index.ts — Public API + turn-level narrative bridge
// ---------------------------------------------------------------------------
// This module bridges the engine's TurnResult with the narrative composer.
// The UI/store layer calls processTurn() then narrateForTurn() — keeping
// the engine layer free of narration imports (dependency flows downward).
// ---------------------------------------------------------------------------

import type { TurnResult, SceneContext, GameState } from '../engine/types';
import type { VerbId } from '../engine/verbs';
import type { Locale } from '../i18n/types';
import type {
  NarrativeContext, NarrativeSettings, Outcome, VerbCategory,
  TargetInfo, ItemInfo, NpcInfo, LocationInfo, StateChange,
} from './types';
import { NARRATIVE_PRESETS } from './types';
import { composeNarrative, getVerbCategory } from './composer';
import { getLocale } from '../i18n/index';

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

const DEFAULT_GRAMMAR = { gender: 'M' as const, startsWithVowel: false, plural: false };

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
    name: sceneContext.locationId ?? 'unknown',
    description: '',
    features: sceneContext.environmentFeatures.map(f => f.nameKey),
    conditions: new Set(sceneContext.environmentConditions),
  };

  // Build NPC info from scene context
  const npcs: NpcInfo[] = sceneContext.npcs.map(npc => ({
    id: npc.id,
    name: npc.nameKey,
    disposition: 'neutral' as const,  // Default — will be overridden by scenario data
    grammar: DEFAULT_GRAMMAR,
  }));

  // Build state changes from consequence trace
  const stateChanges: StateChange[] = trace.consequenceDetails.map((desc, i) => ({
    type: trace.consequenceTypes[i] ?? 'generic',
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
    return {
      id: targetId,
      name: targetId,
      type: 'unknown',
      properties: [],
      grammar: DEFAULT_GRAMMAR,
    };
  }

  return {
    id: entity.id,
    name: entity.nameKey,
    type: entity.properties[0] ?? 'unknown',
    properties: entity.properties,
    grammar: DEFAULT_GRAMMAR,
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
    name: item.nameKey,
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

  // Build narrative context from turn data
  const ctx = buildNarrativeContext(result, sceneContext, state);

  // Compose the narrative
  const effectiveSettings = settings ?? NARRATIVE_PRESETS.standard;
  const effectiveLocale = locale ?? getLocale();

  return composeNarrative(ctx, effectiveSettings, undefined, effectiveLocale);
}
