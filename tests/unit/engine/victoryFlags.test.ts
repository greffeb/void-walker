// ---------------------------------------------------------------------------
// tests/unit/engine/victoryFlags.test.ts — Decision Y
// ---------------------------------------------------------------------------
// buildVictoryCheckContext reads two separate things, and must not confuse them:
// the world's own state (what is lethal), and what the skeleton declared its
// flags to mean (what is activated, contained, counting down).
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { buildVictoryCheckContext } from '../../../src/engine/game';
import { createInitialGameState } from '../../../src/engine/types';
import { applyLocationToken } from '../../../src/engine/locationState';
import { BALANCE } from '../../../src/engine/constants';
import type { GameState } from '../../../src/engine/types';
import type { CoreSkeleton, ScenarioFlagEffect } from '../../../src/engine/scenario';

function withFlagEffects(effects: readonly ScenarioFlagEffect[]): GameState['scenario'] {
  return {
    skeleton: { id: 'test', flagEffects: effects } as unknown as CoreSkeleton,
    modules: [],
    graph: { nodes: [], edges: [] },
    sessionLength: 'quick',
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    turn: 10,
    difficulty: 'survivor',
    scenarioId: 'escape',
    character: {
      name: 'Test',
      className: 'marine',
      stats: { FOR: 3, DEF: 2, AGI: 2, INT: 1, PER: 2, CHA: 1, LCK: 1 },
      hp: 20,
      maxHp: 25,
      oxygen: 100,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null,
      conditions: [],
      durability: {},
      actionsInColdZone: 0,
      actionsWithoutRest: 0,
    },
    ...overrides,
  };
}

describe('lethality comes from the world, not from a flag', () => {
  it('a depressurized room is lethal, whatever the flags say', () => {
    const state = makeState({
      locationStates: { boss: applyLocationToken({}, 'depressurized', 3) },
    });
    expect(buildVictoryCheckContext(state).lethalLocations).toContain('boss');
  });

  it('a flag alone makes nothing lethal', () => {
    const state = makeState({
      scenarioFlags: { cargo_jettisoned: true },
      scenario: withFlagEffects([]),
    });
    expect(buildVictoryCheckContext(state).lethalLocations).toEqual([]);
  });

  it('separates a trap that has settled from one just sprung', () => {
    const fresh = makeState({
      turn: 5,
      locationStates: { boss: applyLocationToken({}, 'depressurized', 5) },
    });
    expect(buildVictoryCheckContext(fresh).lethalLocations).toContain('boss');
    expect(buildVictoryCheckContext(fresh).establishedLethalLocations).not.toContain('boss');

    const settled = { ...fresh, turn: 5 + BALANCE.EMERGENT_VICTORY_MIN_TURNS };
    expect(buildVictoryCheckContext(settled).establishedLethalLocations).toContain('boss');
  });

  it('a room born in vacuum is scenery, never a trap you set', () => {
    const state = makeState({
      turn: 50,
      locationStates: { boss: { pressure: 'depressurized', gravity: 'zero_g' } },
    });
    expect(buildVictoryCheckContext(state).lethalLocations).toContain('boss');
    expect(buildVictoryCheckContext(state).establishedLethalLocations).toEqual([]);
  });
});

describe('flag effects come from the skeleton declaration', () => {
  it('applies what the skeleton declared', () => {
    const state = makeState({
      scenarioFlags: { evidence_transmitted: true },
      scenario: withFlagEffects([
        { requiresAll: ['evidence_transmitted'], activatesObjects: ['emergency_beacon'] },
      ]),
    });
    expect(buildVictoryCheckContext(state).activatedObjects).toContain('emergency_beacon');
  });

  it('applies nothing when the skeleton declared nothing', () => {
    const state = makeState({
      scenarioFlags: { evidence_transmitted: true },
      scenario: withFlagEffects([]),
    });
    expect(buildVictoryCheckContext(state).activatedObjects).toEqual([]);
  });

  it('reports the furthest beat reached, not the room the player stands in', () => {
    expect(buildVictoryCheckContext(makeState()).beat).toBe('intro');
  });
});
