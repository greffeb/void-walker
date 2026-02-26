// ---------------------------------------------------------------------------
// src/engine/interactionResolver.ts — Chantier 1: Scenario interaction resolution
// ---------------------------------------------------------------------------
// Resolves declarative ScenarioInteraction rules against parsed actions.
// Called by processTurn BEFORE the standard action resolution pipeline.
// ---------------------------------------------------------------------------

import type { GameState, RngFn, Consequence, DiceResult } from './types';
import type { VerbId } from './verbs';
import type { PropertyId } from './properties';
import type {
  ScenarioInteraction, InteractionResult, FeatureState,
  FeatureDefinition, ItemDefinition,
} from './scenario';
import { isEnrichedFeature, isEnrichedItem } from './scenario';
import { getFeatureState, hasScenarioFlag } from './featureState';
import { rollCheck } from './dice';
import { VERB_STATS } from './verbs';

// ---------------------------------------------------------------------------
// RESULT TYPE
// ---------------------------------------------------------------------------

/** Result of attempting to resolve a scenario interaction. */
export interface InteractionResolution {
  /** Whether an interaction was found and resolved. */
  readonly matched: boolean;
  /** Whether the action succeeded (true) or failed (false). */
  readonly success: boolean;
  /** The dice roll result, if a roll was made. Null for auto-success. */
  readonly diceRoll: DiceResult | null;
  /** The InteractionResult to apply (onSuccess or onFailure). */
  readonly result: InteractionResult;
  /** Narrative override text, if any. Null = use standard templates. */
  readonly narrativeOverride: import('./scenario').LocaleString | null;
  /** Updated feature state, if changed. */
  readonly newFeatureState: FeatureState | null;
  /** Consequences to apply via applyConsequences(). */
  readonly consequences: readonly Consequence[];
  /** Item IDs to reveal. */
  readonly itemsToReveal: readonly string[];
  /** Exit to unlock (exitId or null). */
  readonly exitToUnlock: string | null;
  /** Flag to set. */
  readonly flagToSet: string | null;
  /** Flag to unset. */
  readonly flagToUnset: string | null;
  /** Item to consume from inventory. */
  readonly itemToConsume: string | null;
  /** Properties to add to feature runtime. */
  readonly propertiesToAdd: readonly PropertyId[];
  /** Properties to remove from feature runtime. */
  readonly propertiesToRemove: readonly PropertyId[];
}

/** A "no match" result — signals processTurn to use the standard pipeline. */
export const NO_INTERACTION_MATCH: InteractionResolution = {
  matched: false,
  success: false,
  diceRoll: null,
  result: {},
  narrativeOverride: null,
  newFeatureState: null,
  consequences: [],
  itemsToReveal: [],
  exitToUnlock: null,
  flagToSet: null,
  flagToUnset: null,
  itemToConsume: null,
  propertiesToAdd: [],
  propertiesToRemove: [],
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function verbMatches(trigger: VerbId | readonly VerbId[], verb: VerbId): boolean {
  if (Array.isArray(trigger)) {
    return (trigger as readonly VerbId[]).includes(verb);
  }
  return trigger === verb;
}

function buildResolution(
  success: boolean,
  diceRoll: DiceResult | null,
  result: InteractionResult,
  requiredItem?: string,
): InteractionResolution {
  return {
    matched: true,
    success,
    diceRoll,
    result,
    narrativeOverride: result.narrative ?? null,
    newFeatureState: result.newState ?? null,
    consequences: result.consequences ?? [],
    itemsToReveal: result.revealsItems ?? [],
    exitToUnlock: result.revealsExit ?? null,
    flagToSet: result.flagSet ?? null,
    flagToUnset: result.flagUnset ?? null,
    itemToConsume: result.consumeItem === true ? (requiredItem ?? null) : null,
    propertiesToAdd: result.addProperties ?? [],
    propertiesToRemove: result.removeProperties ?? [],
  };
}

// ---------------------------------------------------------------------------
// MAIN RESOLUTION FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Attempt to resolve a parsed action against scenario interactions on a feature.
 *
 * Called by processTurn BEFORE the standard action resolution pipeline.
 * Returns NO_INTERACTION_MATCH if no interaction applies.
 */
export function resolveScenarioInteraction(
  verb: VerbId,
  targetId: string,
  targetDef: FeatureDefinition | ItemDefinition | null,
  state: GameState,
  _locationId: string,
  rng: RngFn,
): InteractionResolution {
  if (targetDef === null) return NO_INTERACTION_MATCH;
  if (!isEnrichedFeature(targetDef)) return NO_INTERACTION_MATCH;

  const interactions = targetDef.interactions;
  if (!interactions || interactions.length === 0) return NO_INTERACTION_MATCH;

  const currentState = getFeatureState(state, targetId, targetDef);

  for (const interaction of interactions) {
    const { trigger } = interaction;

    // 1. Verb check
    if (!verbMatches(trigger.verb, verb)) continue;

    // 2. Required state check
    if (trigger.requiredState !== undefined && currentState !== trigger.requiredState) continue;

    // 3. Required item check
    if (trigger.requiredItem !== undefined) {
      const inv = state.character?.inventory ?? [];
      if (!inv.includes(trigger.requiredItem)) continue;
    }

    // 4. Required flag check
    if (trigger.requiredFlag !== undefined) {
      if (!hasScenarioFlag(state, trigger.requiredFlag)) continue;
    }

    // All conditions met — resolve
    return resolveInteraction(interaction, trigger.requiredItem, state, rng);
  }

  return NO_INTERACTION_MATCH;
}

/**
 * Attempt to resolve a "use item on target" interaction.
 * Called when the parser identifies USE <item> ON <target>.
 */
export function resolveItemUseOn(
  itemId: string,
  itemDef: ItemDefinition,
  targetId: string,
  state: GameState,
  _locationId: string,
  rng: RngFn,
): InteractionResolution {
  if (!isEnrichedItem(itemDef)) return NO_INTERACTION_MATCH;

  const useOnList = itemDef.useOn;
  if (!useOnList || useOnList.length === 0) return NO_INTERACTION_MATCH;

  const match = useOnList.find(u => u.targetId === targetId);
  if (!match) return NO_INTERACTION_MATCH;

  return resolveInteraction(match.interaction, itemId, state, rng);
}

// ---------------------------------------------------------------------------
// INTERNAL — resolve a single matched interaction
// ---------------------------------------------------------------------------

function resolveInteraction(
  interaction: ScenarioInteraction,
  requiredItem: string | undefined,
  state: GameState,
  rng: RngFn,
): InteractionResolution {
  const { trigger, onSuccess, onFailure } = interaction;

  // Auto-success
  if (trigger.dc === null) {
    return buildResolution(true, null, onSuccess, requiredItem);
  }

  // Dice roll
  const statId = trigger.stat ?? (VERB_STATS[trigger.verb as string] ?? 'FOR');
  const statValue = state.character?.stats[statId] ?? 0;
  const lck = state.character?.stats['LCK'] ?? 0;

  const diceRoll = rollCheck(statId, statValue, lck, trigger.dc, 0, rng);
  const success = diceRoll.success;

  if (success) {
    return buildResolution(true, diceRoll, onSuccess, requiredItem);
  }

  // Failure — use onFailure or empty result
  const failureResult: InteractionResult = onFailure ?? {};
  return buildResolution(false, diceRoll, failureResult, requiredItem);
}
