// ---------------------------------------------------------------------------
// src/engine/featureState.ts — Chantier 1: Feature state management
// ---------------------------------------------------------------------------
// Pure functions for managing feature states, scenario flags, revealed items,
// and unlocked exits within the immutable GameState.
// ---------------------------------------------------------------------------

import type { GameState } from './types';
import type { FeatureState, FeatureDefinition } from './scenario';
import { isEnrichedFeature } from './scenario';

// ---------------------------------------------------------------------------
// FEATURE STATE
// ---------------------------------------------------------------------------

/**
 * Get the current state of a feature.
 * Returns the runtime state from GameState.featureStates,
 * or the feature's initialState from the definition,
 * or 'intact' as ultimate fallback.
 */
export function getFeatureState(
  state: GameState,
  featureId: string,
  featureDef?: FeatureDefinition,
): FeatureState {
  const runtime = state.featureStates[featureId];
  if (runtime !== undefined) return runtime;
  if (featureDef?.initialState !== undefined) return featureDef.initialState;
  return 'intact';
}

/**
 * Set the state of a feature. Returns new GameState (immutable).
 */
export function setFeatureState(
  state: GameState,
  featureId: string,
  newState: FeatureState,
): GameState {
  return {
    ...state,
    featureStates: { ...state.featureStates, [featureId]: newState },
  };
}

/**
 * Get the appropriate description for a feature based on its current state.
 *
 * Resolution order:
 *   1. ScenarioFeatureDefinition.descriptions[currentState]
 *   2. ScenarioFeatureDefinition.descriptions['default']
 *   3. FeatureDefinition.examineResult (legacy fallback)
 *   4. null (no description available)
 */
export function getFeatureDescription(
  featureDef: FeatureDefinition,
  currentState: FeatureState,
  locale: 'fr' | 'en',
): string | null {
  if (isEnrichedFeature(featureDef)) {
    if (featureDef.descriptions) {
      const stateDesc = featureDef.descriptions[currentState];
      if (stateDesc) return stateDesc[locale];
      const defaultDesc = featureDef.descriptions['default'];
      if (defaultDesc) return defaultDesc[locale];
    }
  }
  if (featureDef.examineResult) {
    return featureDef.examineResult[locale];
  }
  return null;
}

// ---------------------------------------------------------------------------
// SCENARIO FLAGS
// ---------------------------------------------------------------------------

/**
 * Set a scenario flag. Returns new GameState.
 */
export function setScenarioFlag(
  state: GameState,
  flagName: string,
): GameState {
  return {
    ...state,
    scenarioFlags: { ...state.scenarioFlags, [flagName]: true },
  };
}

/**
 * Unset a scenario flag. Returns new GameState.
 */
export function unsetScenarioFlag(
  state: GameState,
  flagName: string,
): GameState {
  const { [flagName]: _removed, ...rest } = state.scenarioFlags;
  return { ...state, scenarioFlags: rest };
}

/**
 * Check if a scenario flag is set.
 */
export function hasScenarioFlag(
  state: GameState,
  flagName: string,
): boolean {
  return state.scenarioFlags[flagName] === true;
}

// ---------------------------------------------------------------------------
// REVEALED ITEMS
// ---------------------------------------------------------------------------

/**
 * Mark an item as revealed. Returns new GameState.
 */
export function revealItem(
  state: GameState,
  itemId: string,
): GameState {
  return {
    ...state,
    revealedItems: { ...state.revealedItems, [itemId]: true },
  };
}

/**
 * Check if an item is revealed (or has no revealedBy constraint).
 * Returns true when no revealedBy constraint exists (always visible).
 */
export function isItemRevealed(
  state: GameState,
  itemDef: { readonly revealedBy?: { readonly featureId: string; readonly requiredState: FeatureState } },
): boolean {
  if (!itemDef.revealedBy) return true;
  return state.revealedItems[itemDef.revealedBy.featureId] === true ||
    getFeatureState(state, itemDef.revealedBy.featureId) === itemDef.revealedBy.requiredState;
}

// ---------------------------------------------------------------------------
// UNLOCKED EXITS
// ---------------------------------------------------------------------------

/**
 * Unlock an exit. Returns new GameState.
 * Key format: `${fromLocationId}:${toLocationId}`
 */
export function unlockExit(
  state: GameState,
  fromLocationId: string,
  toLocationId: string,
): GameState {
  const key = `${fromLocationId}:${toLocationId}`;
  return {
    ...state,
    unlockedExits: { ...state.unlockedExits, [key]: true },
  };
}

/**
 * Check if an exit is unlocked (or was never locked).
 */
export function isExitUnlocked(
  state: GameState,
  fromLocationId: string,
  toLocationId: string,
): boolean {
  const key = `${fromLocationId}:${toLocationId}`;
  return state.unlockedExits[key] === true;
}
