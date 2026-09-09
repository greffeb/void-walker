// ---------------------------------------------------------------------------
// src/engine/featureState.ts — Chantier 1: Feature state management
// ---------------------------------------------------------------------------
// Pure functions for managing feature states, scenario flags, revealed items,
// and unlocked exits within the immutable GameState.
// ---------------------------------------------------------------------------

import type { GameState } from './types';
import type { FeatureDefinition, LocaleString } from './scenario';
import type { EntityState, StateId } from './entityState';
import { applyStateToken, makeEntityState, stateMatchesToken, STATE_TOKEN_SALIENCE } from './entityState';

// ---------------------------------------------------------------------------
// FEATURE STATE
// ---------------------------------------------------------------------------

/**
 * Current state of a feature: the runtime value if it has ever changed,
 * otherwise the one derived from its `initialState`.
 */
export function getFeatureState(
  state: GameState,
  featureId: string,
  featureDef?: FeatureDefinition,
): EntityState {
  return state.featureStates[featureId] ?? makeEntityState(featureDef?.initialState);
}

/**
 * Apply a state token to a feature. Other axes are preserved, so unlocking a
 * door no longer erases the fact that it is still closed.
 */
export function setFeatureState(
  state: GameState,
  featureId: string,
  token: StateId,
  featureDef?: FeatureDefinition,
): GameState {
  const current = getFeatureState(state, featureId, featureDef);
  return {
    ...state,
    featureStates: { ...state.featureStates, [featureId]: applyStateToken(current, token) },
  };
}

/**
 * The entry describing the most salient state the feature has an entry for.
 * A broken door reads as broken rather than closed.
 */
export function pickStateDescription(
  descriptions: Readonly<Partial<Record<StateId, LocaleString>>> | undefined,
  state: EntityState,
): LocaleString | undefined {
  if (!descriptions) return undefined;
  for (const token of STATE_TOKEN_SALIENCE) {
    if (!stateMatchesToken(state, token)) continue;
    const found = descriptions[token];
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * Get the appropriate description for a feature based on its current state.
 *
 * Resolution order:
 *   1. the most salient state the feature has a description for
 *   2. FeatureDefinition.examineResult (legacy fallback)
 *   3. null (no description available)
 */
export function getFeatureDescription(
  featureDef: FeatureDefinition,
  currentState: EntityState,
  locale: 'fr' | 'en',
): string | null {
  const stateDesc = pickStateDescription(featureDef.descriptions, currentState);
  if (stateDesc) return stateDesc[locale];
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
  itemDef: { readonly revealedBy?: { readonly featureId: string; readonly requiredState: StateId } },
): boolean {
  if (!itemDef.revealedBy) return true;
  return state.revealedItems[itemDef.revealedBy.featureId] === true ||
    stateMatchesToken(getFeatureState(state, itemDef.revealedBy.featureId), itemDef.revealedBy.requiredState);
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
