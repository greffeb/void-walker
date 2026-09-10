// ---------------------------------------------------------------------------
// src/engine/interactionResolver.ts — Scenario interaction matching
// ---------------------------------------------------------------------------
// Decision Z: a ScenarioInteraction supplies the *text and the effects*. It no
// longer decides whether the action succeeds — compatibility, DC and the die
// stay with the generic engine. These functions only answer "does a rule apply
// here?", and later "what does it do now that we know the outcome?".
// ---------------------------------------------------------------------------

import type { GameState } from './types';
import type { VerbId } from './verbs';
import type { PropertyId } from './properties';
import type {
  ScenarioInteraction, InteractionResult, FeatureState,
  FeatureDefinition, ItemDefinition,
} from './scenario';
import type { Consequence } from './types';
import { isEnrichedFeature, isEnrichedItem } from './scenario';
import { getFeatureState, hasScenarioFlag } from './featureState';
import { stateMatchesToken } from './entityState';

// ---------------------------------------------------------------------------
// RESULT TYPES
// ---------------------------------------------------------------------------

/** A scenario rule that applies to the current action, before any roll. */
export interface InteractionMatch {
  readonly interaction: ScenarioInteraction;
  /** Item the trigger required, and which onSuccess may consume. */
  readonly requiredItem: string | undefined;
}

/** What a matched interaction does, once the engine has decided the outcome. */
export interface InteractionResolution {
  /** Whether the action succeeded (true) or failed (false). */
  readonly success: boolean;
  /** The InteractionResult to apply (onSuccess or onFailure). */
  readonly result: InteractionResult;
  /** Narrative override text, if any. Null = use standard templates. */
  readonly narrativeOverride: import('./scenario').LocaleString | null;
  /** Updated feature state tokens, applied in order. Empty when unchanged. */
  readonly newFeatureStates: readonly FeatureState[];
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
  /** Whether the interaction requests obstacle resolution. */
  readonly resolveObstacle: boolean;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function verbMatches(trigger: VerbId | readonly VerbId[], verb: VerbId): boolean {
  if (Array.isArray(trigger)) {
    return (trigger as readonly VerbId[]).includes(verb);
  }
  return trigger === verb;
}

// ---------------------------------------------------------------------------
// MATCHING — does a scenario rule apply to this action?
// ---------------------------------------------------------------------------

/**
 * Find the scenario interaction that applies to a verb on a feature.
 * Returns null when the generic pipeline should run unassisted.
 */
export function findScenarioInteraction(
  verb: VerbId,
  targetId: string,
  targetDef: FeatureDefinition | ItemDefinition | null,
  state: GameState,
): InteractionMatch | null {
  if (targetDef === null) return null;
  if (!isEnrichedFeature(targetDef)) return null;

  const interactions = targetDef.interactions;
  if (!interactions || interactions.length === 0) return null;

  const currentState = getFeatureState(state, targetId, targetDef);

  for (const interaction of interactions) {
    const { trigger } = interaction;

    // 1. Verb check
    if (!verbMatches(trigger.verb, verb)) continue;

    // 2. Required state check
    if (trigger.requiredState !== undefined && !stateMatchesToken(currentState, trigger.requiredState)) continue;

    // 3. Required item check
    if (trigger.requiredItem !== undefined) {
      const inv = state.character?.inventory ?? [];
      if (!inv.includes(trigger.requiredItem)) continue;
    }

    // 4. Required flag check
    if (trigger.requiredFlag !== undefined) {
      if (!hasScenarioFlag(state, trigger.requiredFlag)) continue;
    }

    return { interaction, requiredItem: trigger.requiredItem };
  }

  return null;
}

/** `newState` is authored as one token or an ordered list; normalise it. */
export function toStateTokens(newState: FeatureState | readonly FeatureState[] | undefined): readonly FeatureState[] {
  if (newState === undefined) return [];
  return typeof newState === 'string' ? [newState] : newState;
}

/**
 * Find the interaction for "use item on target".
 * Called when the parser identifies USE <item> ON <target>.
 */
export function findItemUseOn(
  itemId: string,
  itemDef: ItemDefinition,
  targetId: string,
): InteractionMatch | null {
  if (!isEnrichedItem(itemDef)) return null;

  const useOnList = itemDef.useOn;
  if (!useOnList || useOnList.length === 0) return null;

  const match = useOnList.find(u => u.targetId === targetId);
  if (!match) return null;

  return { interaction: match.interaction, requiredItem: itemId };
}

// ---------------------------------------------------------------------------
// APPLYING — what the matched rule does, given the engine's verdict
// ---------------------------------------------------------------------------

/** Translate a matched interaction into effects, once the die has spoken. */
export function applyInteractionOutcome(
  match: InteractionMatch,
  success: boolean,
): InteractionResolution {
  const result: InteractionResult = success
    ? match.interaction.onSuccess
    : match.interaction.onFailure ?? {};

  return {
    success,
    result,
    narrativeOverride: result.narrative ?? null,
    newFeatureStates: toStateTokens(result.newState),
    consequences: result.consequences ?? [],
    itemsToReveal: result.revealsItems ?? [],
    exitToUnlock: result.revealsExit ?? null,
    flagToSet: result.flagSet ?? null,
    flagToUnset: result.flagUnset ?? null,
    itemToConsume: result.consumeItem === true ? (match.requiredItem ?? null) : null,
    propertiesToAdd: result.addProperties ?? [],
    propertiesToRemove: result.removeProperties ?? [],
    resolveObstacle: result.resolveObstacle ?? false,
  };
}
