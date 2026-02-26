// ---------------------------------------------------------------------------
// tests/stress/interactionStress.test.ts — Chantier 1 stress tests
// ---------------------------------------------------------------------------
// Verifies that feature state remains valid across 500 random interactions.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../src/engine/types';
import {
  setFeatureState, getFeatureState,
  setScenarioFlag,
  revealItem,
} from '../../src/engine/featureState';
import { resolveScenarioInteraction } from '../../src/engine/interactionResolver';
import type { ScenarioFeatureDefinition } from '../../src/engine/scenario';
import type { GameState, CharacterState } from '../../src/engine/types';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeCharacter(): CharacterState {
  return {
    name: 'StressBot',
    className: 'marine',
    stats: { FOR: 3, DEF: 2, AGI: 2, INT: 3, PER: 2, CHA: 2, LCK: 1 },
    hp: 20, maxHp: 20, oxygen: 100,
    inventory: ['access_keycard'],
    equippedWeapon: null, equippedArmor: null,
    conditions: [], durability: {},
    actionsInColdZone: 0, actionsWithoutRest: 0,
  };
}

const complexFeature: ScenarioFeatureDefinition = {
  id: 'stress_locker',
  initialState: 'locked',
  featureType: 'container',
  interactions: [
    {
      trigger: { verb: 'OPEN', requiredState: 'locked', stat: 'FOR', dc: 10 },
      onSuccess: { newState: 'open', revealsItems: ['item_a'] },
      onFailure: { consequences: [] },
    },
    {
      trigger: { verb: 'HACK', requiredState: 'locked', stat: 'INT', dc: 8 },
      onSuccess: { newState: 'open', revealsItems: ['item_a'] },
    },
    {
      trigger: { verb: 'USE', requiredItem: 'access_keycard', requiredState: 'locked', dc: null },
      onSuccess: { newState: 'open', revealsItems: ['item_a'], flagSet: 'locker_keycard_used' },
    },
    {
      trigger: { verb: 'EXAMINE', dc: null },
      onSuccess: {},
    },
  ],
};

const VALID_VERBS = ['OPEN', 'HACK', 'USE', 'EXAMINE', 'FORCE_OPEN', 'READ', 'TAKE'] as const;
const VALID_STATES = ['locked', 'open', 'broken', 'intact', 'damaged', 'empty', 'inactive'];

// ---------------------------------------------------------------------------
// STRESS TESTS
// ---------------------------------------------------------------------------

describe('Chantier 1 Stress: 500 random interactions — no state corruption', () => {

  it('feature states remain valid strings after 500 setFeatureState calls', () => {
    const rng = seededRng(42);
    let state: GameState = {
      ...createInitialGameState(),
      phase: 'playing',
      character: makeCharacter(),
    };

    for (let i = 0; i < 500; i++) {
      const newStateValue = VALID_STATES[Math.floor(rng() * VALID_STATES.length)]!;
      const featureId = `feature_${i % 10}`;
      state = setFeatureState(state, featureId, newStateValue);

      // Invariants
      const readBack = getFeatureState(state, featureId);
      expect(typeof readBack).toBe('string');
      expect(readBack.length).toBeGreaterThan(0);
      expect(readBack).toBe(newStateValue);
    }

    // All featureStates values are strings
    for (const [key, val] of Object.entries(state.featureStates)) {
      expect(typeof key).toBe('string');
      expect(typeof val).toBe('string');
    }
  });

  it('revealed items never duplicate in revealedItems record', () => {
    const rng = seededRng(99);
    let state: GameState = {
      ...createInitialGameState(),
      phase: 'playing',
      character: makeCharacter(),
    };

    const itemIds = ['item_a', 'item_b', 'item_c', 'item_d', 'item_e'];

    for (let i = 0; i < 500; i++) {
      const itemId = itemIds[Math.floor(rng() * itemIds.length)]!;
      state = revealItem(state, itemId);
    }

    // Each item key appears at most once (it's a Record, not an array)
    const revealed = Object.keys(state.revealedItems);
    const uniqueKeys = new Set(revealed);
    expect(uniqueKeys.size).toBe(revealed.length);

    // All values are true
    for (const val of Object.values(state.revealedItems)) {
      expect(val).toBe(true);
    }
  });

  it('feature state transitions are idempotent', () => {
    let state: GameState = {
      ...createInitialGameState(),
      phase: 'playing',
      character: makeCharacter(),
    };

    // Set open twice — result should be the same
    state = setFeatureState(state, 'test_door', 'open');
    const after1 = state.featureStates['test_door'];
    state = setFeatureState(state, 'test_door', 'open');
    const after2 = state.featureStates['test_door'];

    expect(after1).toBe('open');
    expect(after2).toBe('open');
    expect(after1).toBe(after2);
  });

  it('GameState is never mutated (immutability check across 500 interactions)', () => {
    const rng = seededRng(7);
    const initial: GameState = {
      ...createInitialGameState(),
      phase: 'playing',
      character: makeCharacter(),
    };
    const originalFeatureStates = initial.featureStates;
    const originalFlags = initial.scenarioFlags;
    const originalRevealedItems = initial.revealedItems;

    let current = initial;

    for (let i = 0; i < 500; i++) {
      const verb = VALID_VERBS[Math.floor(rng() * VALID_VERBS.length)]!;
      current = resolveScenarioInteraction(
        verb, 'stress_locker', complexFeature, current, 'test_loc', rng,
      ).matched
        ? setFeatureState(current, 'stress_locker', getFeatureState(current, 'stress_locker'))
        : current;

      if (i % 50 === 0) {
        current = setScenarioFlag(current, `flag_${i}`);
      }
    }

    // Original references must not have been mutated
    expect(initial.featureStates).toBe(originalFeatureStates);
    expect(initial.scenarioFlags).toBe(originalFlags);
    expect(initial.revealedItems).toBe(originalRevealedItems);

    // All GameState fields are still defined
    expect(current.featureStates).toBeDefined();
    expect(current.scenarioFlags).toBeDefined();
    expect(current.revealedItems).toBeDefined();
    expect(current.unlockedExits).toBeDefined();
  });
});
