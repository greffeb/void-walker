// ---------------------------------------------------------------------------
// tests/unit/engine/featureState.test.ts — Chantier 1 feature state tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../../src/engine/types';
import {
  getFeatureState, setFeatureState, getFeatureDescription,
  setScenarioFlag, unsetScenarioFlag, hasScenarioFlag,
  revealItem, isItemRevealed,
  unlockExit, isExitUnlocked,
} from '../../../src/engine/featureState';
import type { FeatureDefinition } from '../../../src/engine/scenario';
import type { ScenarioFeatureDefinition, ScenarioItemDefinition } from '../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<ReturnType<typeof createInitialGameState>> = {}) {
  return { ...createInitialGameState(), ...overrides };
}

const lockedLockerDef: FeatureDefinition = {
  id: 'emergency_locker',
  initialState: 'locked',
};

const enrichedLockerDef: ScenarioFeatureDefinition = {
  id: 'emergency_locker',
  initialState: 'locked',
  featureType: 'container',
  descriptions: {
    locked: { fr: 'L\'armoire est verrouillée.', en: 'The locker is locked.' },
    open: { fr: 'L\'armoire est ouverte.', en: 'The locker is open.' },
    default: { fr: 'Une armoire de secours.', en: 'An emergency locker.' },
  },
};

const legacyDef: FeatureDefinition = {
  id: 'old_panel',
  examineResult: { fr: 'Vieux panneau.', en: 'Old panel.' },
};

// ---------------------------------------------------------------------------
// getFeatureState
// ---------------------------------------------------------------------------

describe('getFeatureState', () => {
  it('returns initialState when no runtime state exists', () => {
    const state = makeState();
    expect(getFeatureState(state, 'emergency_locker', lockedLockerDef)).toBe('locked');
  });

  it('returns runtime state when it exists', () => {
    const state = makeState({ featureStates: { emergency_locker: 'open' } });
    expect(getFeatureState(state, 'emergency_locker', lockedLockerDef)).toBe('open');
  });

  it("returns 'intact' as ultimate fallback when no def or runtime state", () => {
    const state = makeState();
    expect(getFeatureState(state, 'unknown_feature')).toBe('intact');
  });
});

// ---------------------------------------------------------------------------
// setFeatureState
// ---------------------------------------------------------------------------

describe('setFeatureState', () => {
  it('returns new GameState with updated feature state', () => {
    const state = makeState();
    const newState = setFeatureState(state, 'emergency_locker', 'open');
    expect(newState.featureStates['emergency_locker']).toBe('open');
  });

  it('does not mutate the original state', () => {
    const state = makeState();
    const newState = setFeatureState(state, 'emergency_locker', 'open');
    expect(state.featureStates['emergency_locker']).toBeUndefined();
    expect(newState).not.toBe(state);
  });

  it('preserves other feature states', () => {
    const state = makeState({ featureStates: { terminal: 'active' } });
    const newState = setFeatureState(state, 'emergency_locker', 'open');
    expect(newState.featureStates['terminal']).toBe('active');
    expect(newState.featureStates['emergency_locker']).toBe('open');
  });
});

// ---------------------------------------------------------------------------
// getFeatureDescription
// ---------------------------------------------------------------------------

describe('getFeatureDescription', () => {
  it('returns state-specific description from enriched feature', () => {
    const desc = getFeatureDescription(enrichedLockerDef, 'locked', 'fr');
    expect(desc).toBe("L'armoire est verrouillée.");
  });

  it('returns different description for different state', () => {
    const desc = getFeatureDescription(enrichedLockerDef, 'open', 'fr');
    expect(desc).toBe("L'armoire est ouverte.");
  });

  it("falls back to 'default' description when state has no specific entry", () => {
    const desc = getFeatureDescription(enrichedLockerDef, 'broken', 'fr');
    expect(desc).toBe('Une armoire de secours.');
  });

  it('falls back to examineResult for legacy feature definition', () => {
    const desc = getFeatureDescription(legacyDef, 'intact', 'fr');
    expect(desc).toBe('Vieux panneau.');
  });

  it('returns null when no description is available', () => {
    const def: FeatureDefinition = { id: 'bare_wall' };
    expect(getFeatureDescription(def, 'intact', 'fr')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setScenarioFlag / hasScenarioFlag / unsetScenarioFlag
// ---------------------------------------------------------------------------

describe('setScenarioFlag / hasScenarioFlag / unsetScenarioFlag', () => {
  it('setScenarioFlag + hasScenarioFlag round-trip', () => {
    const state = makeState();
    const newState = setScenarioFlag(state, 'bulkhead_unlocked');
    expect(hasScenarioFlag(newState, 'bulkhead_unlocked')).toBe(true);
  });

  it('hasScenarioFlag returns false for unset flag', () => {
    const state = makeState();
    expect(hasScenarioFlag(state, 'some_flag')).toBe(false);
  });

  it('unsetScenarioFlag removes the flag', () => {
    const state = makeState({ scenarioFlags: { bulkhead_unlocked: true } });
    const newState = unsetScenarioFlag(state, 'bulkhead_unlocked');
    expect(hasScenarioFlag(newState, 'bulkhead_unlocked')).toBe(false);
  });

  it('unsetScenarioFlag does not affect other flags', () => {
    const state = makeState({ scenarioFlags: { flag_a: true, flag_b: true } });
    const newState = unsetScenarioFlag(state, 'flag_a');
    expect(hasScenarioFlag(newState, 'flag_b')).toBe(true);
    expect(hasScenarioFlag(newState, 'flag_a')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// revealItem / isItemRevealed
// ---------------------------------------------------------------------------

describe('revealItem / isItemRevealed', () => {
  const constrainedItem: ScenarioItemDefinition = {
    id: 'oxygen_canister',
    revealedBy: { featureId: 'emergency_locker', requiredState: 'open' },
  };

  const unconstrainedItem = { id: 'medkit' };

  it('revealItem + isItemRevealed round-trip via revealedItems', () => {
    const state = makeState();
    const newState = revealItem(state, 'emergency_locker');
    expect(isItemRevealed(newState, constrainedItem)).toBe(true);
  });

  it('isItemRevealed returns true when no revealedBy constraint', () => {
    const state = makeState();
    expect(isItemRevealed(state, unconstrainedItem)).toBe(true);
  });

  it('isItemRevealed returns false when constraint not met', () => {
    const state = makeState();
    expect(isItemRevealed(state, constrainedItem)).toBe(false);
  });

  it('isItemRevealed returns true when featureState matches requiredState', () => {
    const state = makeState({ featureStates: { emergency_locker: 'open' } });
    expect(isItemRevealed(state, constrainedItem)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// unlockExit / isExitUnlocked
// ---------------------------------------------------------------------------

describe('unlockExit / isExitUnlocked', () => {
  it('unlockExit + isExitUnlocked round-trip', () => {
    const state = makeState();
    const newState = unlockExit(state, 'airlock', 'escape_pod');
    expect(isExitUnlocked(newState, 'airlock', 'escape_pod')).toBe(true);
  });

  it('isExitUnlocked returns false for un-unlocked exit', () => {
    const state = makeState();
    expect(isExitUnlocked(state, 'airlock', 'escape_pod')).toBe(false);
  });

  it('unlocked exit key is directional', () => {
    const state = makeState();
    const newState = unlockExit(state, 'A', 'B');
    expect(isExitUnlocked(newState, 'A', 'B')).toBe(true);
    expect(isExitUnlocked(newState, 'B', 'A')).toBe(false);
  });
});
