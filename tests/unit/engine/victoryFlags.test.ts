// ---------------------------------------------------------------------------
// tests/unit/engine/victoryFlags.test.ts — Chantier 3, C3-7
// ---------------------------------------------------------------------------
// Tests that buildVictoryCheckContext integrates scenarioFlags via
// mapScenarioFlags, and that checkVictory resolves correctly.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { buildVictoryCheckContext } from '../../../src/engine/game';
import { createInitialGameState } from '../../../src/engine/types';
import type { GameState } from '../../../src/engine/types';

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

describe('C3-7: buildVictoryCheckContext with scenarioFlags', () => {
  it('cargo_jettisoned flag → lethalLocations includes "boss"', () => {
    const state = makeState({
      scenarioFlags: { cargo_jettisoned: true },
      scenarioId: 'escape',
    });
    const ctx = buildVictoryCheckContext(state);
    expect(ctx.lethalLocations).toContain('boss');
  });

  it('cargo_depressurized flag → lethalLocations includes "boss"', () => {
    const state = makeState({
      scenarioFlags: { cargo_depressurized: true },
      scenarioId: 'escape',
    });
    const ctx = buildVictoryCheckContext(state);
    expect(ctx.lethalLocations).toContain('boss');
  });

  it('no relevant flags → lethalLocations unchanged (empty)', () => {
    const state = makeState({
      scenarioFlags: { some_other_flag: true },
      scenarioId: 'escape',
    });
    const ctx = buildVictoryCheckContext(state);
    expect(ctx.lethalLocations).toEqual([]);
  });

  it('investigate + evidence_transmitted → activatedObjects includes emergency_beacon', () => {
    const state = makeState({
      scenarioFlags: { evidence_transmitted: true },
      scenarioId: 'investigate',
    });
    const ctx = buildVictoryCheckContext(state);
    expect(ctx.activatedObjects).toContain('emergency_beacon');
  });

  it('null scenarioId → no flag effects applied', () => {
    const state = makeState({
      scenarioFlags: { cargo_jettisoned: true },
      scenarioId: null,
    });
    const ctx = buildVictoryCheckContext(state);
    expect(ctx.lethalLocations).toEqual([]);
  });
});
