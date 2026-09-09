// ---------------------------------------------------------------------------
// tests/unit/engine/game.test.ts — Phase 6B: initGame, isGameOver, buildVictoryCheckContext
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, isGameOver, buildVictoryCheckContext, rollBonusAllocation } from '../../../src/engine/game';
import { createInitialGameState } from '../../../src/engine/types';
import { assembleScenario } from '../../../src/engine/pacing';
import { ESCAPE_SKELETON } from '../../../src/content/scenarios/escape';
import { ALL_MODULES } from '../../../src/content/scenarios/modules/index';
import { CLASSES } from '../../../src/content/classes';
import { BALANCE } from '../../../src/engine/constants';
import { createSeededRng } from '../../../src/engine/rng';
import type { AssembledScenario } from '../../../src/engine/scenario';
import type { GameState, RngFn, StatId } from '../../../src/engine/types';

const STAT_IDS: readonly StatId[] = ['FOR', 'DEF', 'AGI', 'INT', 'PER', 'CHA', 'LCK'];

// ---------------------------------------------------------------------------
// TEST UTILITIES
// ---------------------------------------------------------------------------

function fixedRng(v = 0.5): RngFn { return () => v; }

function makeScenario(): AssembledScenario {
  return assembleScenario(ESCAPE_SKELETON, 'quick', ALL_MODULES, fixedRng());
}

// ---------------------------------------------------------------------------
// initGame
// ---------------------------------------------------------------------------

describe('initGame()', () => {
  it('returns phase=playing', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'Test', fixedRng());
    expect(state.phase).toBe('playing');
  });

  it('places player at the start node', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'Test', fixedRng());
    const startNode = scenario.graph.nodes.find(n => n.coreNodeId === 'start');
    expect(state.playerLocationId).toBe(startNode!.id);
  });

  it('initializes visitedLocations with the start node', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'Test', fixedRng());
    const startNode = scenario.graph.nodes.find(n => n.coreNodeId === 'start')!;
    expect(state.visitedLocations[startNode.id]).toBeDefined();
    expect(state.visitedLocations[startNode.id]!.visitCount).toBe(1);
  });

  it('initializes threat director at intro beat', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'Test', fixedRng());
    expect(state.threatDirectorState.currentBeat).toBe('intro');
    expect(state.threatDirectorState.encounterCount).toBe(0);
  });

  it('initializes npcStates from graph NPC definitions', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'Test', fixedRng());
    // All NPCs in the graph start alive
    for (const npcState of Object.values(state.npcStates)) {
      expect(npcState.state.vitality).toBe('alive');
    }
  });

  it('builds character with correct class stats', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'engineer', 'survivor', 'Eng', fixedRng(), { PER: 1, CHA: 1 });
    expect(state.character).not.toBeNull();
    expect(state.character!.className).toBe('engineer');
    expect(state.character!.stats.INT).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Bonus point allocation (decision H)
// ---------------------------------------------------------------------------

describe('initGame() — nobody starts on raw class stats', () => {
  it('spends the player\'s own allocation', () => {
    const state = initGame(makeScenario(), 'medic', 'survivor', 'M', fixedRng(), { CHA: 1, LCK: 1 });
    expect(state.character!.stats.CHA).toBe(CLASSES.medic.baseStats.CHA + 1);
    expect(state.character!.stats.LCK).toBe(CLASSES.medic.baseStats.LCK + 1);
  });

  it('rolls a valid allocation when the caller supplies none', () => {
    // An automated playthrough allocates like a player would.
    const state = initGame(makeScenario(), 'marine', 'survivor', 'B', createSeededRng(7));
    const spent = STAT_IDS.reduce(
      (sum, stat) => sum + (state.character!.stats[stat] - CLASSES.marine.baseStats[stat]),
      0,
    );
    expect(spent).toBe(BALANCE.BONUS_POINTS);
  });

  it('a rolled allocation never breaks the stat cap', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const state = initGame(makeScenario(), 'marine', 'survivor', 'B', createSeededRng(seed));
      for (const stat of STAT_IDS) {
        expect(state.character!.stats[stat]).toBeLessThanOrEqual(BALANCE.STAT_MAX);
      }
    }
  });

  it('the same seed gives the same character', () => {
    const a = initGame(makeScenario(), 'engineer', 'survivor', 'B', createSeededRng(42));
    const b = initGame(makeScenario(), 'engineer', 'survivor', 'B', createSeededRng(42));
    expect(a.character!.stats).toEqual(b.character!.stats);
  });

  it('refuses an allocation that does not spend every point', () => {
    expect(() => initGame(makeScenario(), 'marine', 'survivor', 'X', fixedRng(), {}))
      .toThrow(/allocation/);
    expect(() => initGame(makeScenario(), 'marine', 'survivor', 'X', fixedRng(), { LCK: 1 }))
      .toThrow(/allocation/);
  });

  it('refuses an allocation that breaks the stat cap', () => {
    // Marine FOR is 4, +2 would be 6.
    expect(() => initGame(makeScenario(), 'marine', 'survivor', 'X', fixedRng(), { FOR: 2 }))
      .toThrow(/allocation/);
  });

  it('rollBonusAllocation stops when every stat is capped', () => {
    const capped = { FOR: 5, DEF: 5, AGI: 5, INT: 5, PER: 5, CHA: 5, LCK: 5 };
    expect(rollBonusAllocation(capped, fixedRng())).toEqual({});
  });
});

describe('initGame() — remaining', () => {
  it('applies HP multiplier for explorer difficulty', () => {
    const scenario = makeScenario();
    const survivor = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const explorer = initGame(scenario, 'marine', 'explorer', 'T', fixedRng());
    expect(explorer.character!.maxHp).toBeGreaterThan(survivor.character!.maxHp);
  });

  it('applies HP multiplier for nightmare difficulty', () => {
    const scenario = makeScenario();
    const survivor = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    const nightmare = initGame(scenario, 'marine', 'nightmare', 'T', fixedRng());
    expect(nightmare.character!.maxHp).toBeLessThan(survivor.character!.maxHp);
  });

  it('initializes with no victory or defeat', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    expect(state.victoryResult).toBeNull();
    expect(state.defeatCondition).toBeNull();
  });

  it('stores scenario reference', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    expect(state.scenario).toBe(scenario);
  });

  it('stores scenarioId from skeleton', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'marine', 'survivor', 'T', fixedRng());
    expect(state.scenarioId).toBe(scenario.skeleton.id);
  });
});

// ---------------------------------------------------------------------------
// isGameOver
// ---------------------------------------------------------------------------

describe('isGameOver()', () => {
  it('false for fresh game state', () => {
    expect(isGameOver(createInitialGameState())).toBe(false);
  });

  it('true when phase is defeat', () => {
    const state: GameState = { ...createInitialGameState(), phase: 'defeat' };
    expect(isGameOver(state)).toBe(true);
  });

  it('true when phase is victory', () => {
    const state: GameState = { ...createInitialGameState(), phase: 'victory' };
    expect(isGameOver(state)).toBe(true);
  });

  it('true when victoryResult is set', () => {
    const state: GameState = {
      ...createInitialGameState(),
      victoryResult: { type: 'primary', skeletonId: 'escape' },
    };
    expect(isGameOver(state)).toBe(true);
  });

  it('true when defeatCondition is set', () => {
    const state: GameState = {
      ...createInitialGameState(),
      defeatCondition: { type: 'player_death' },
    };
    expect(isGameOver(state)).toBe(true);
  });

  it('true when character hp is 0', () => {
    const base = createInitialGameState();
    const state: GameState = {
      ...base,
      character: {
        name: 'T', className: 'marine',
        stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 3 },
        hp: 0, maxHp: 14, oxygen: 100, inventory: [],
        equippedWeapon: null, equippedArmor: null, conditions: [],
        durability: {}, actionsInColdZone: 0, actionsWithoutRest: 0,
      },
    };
    expect(isGameOver(state)).toBe(true);
  });

  it('false when character hp is 1', () => {
    const base = createInitialGameState();
    const state: GameState = {
      ...base,
      character: {
        name: 'T', className: 'marine',
        stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 3 },
        hp: 1, maxHp: 14, oxygen: 100, inventory: [],
        equippedWeapon: null, equippedArmor: null, conditions: [],
        durability: {}, actionsInColdZone: 0, actionsWithoutRest: 0,
      },
    };
    expect(isGameOver(state)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildVictoryCheckContext
// ---------------------------------------------------------------------------

describe('buildVictoryCheckContext()', () => {
  it('extracts playerLocationId', () => {
    const state: GameState = { ...createInitialGameState(), playerLocationId: 'boss' };
    expect(buildVictoryCheckContext(state).playerLocationId).toBe('boss');
  });

  it('uses empty string when playerLocationId is null', () => {
    const state = createInitialGameState();
    expect(buildVictoryCheckContext(state).playerLocationId).toBe('');
  });

  it('extracts player inventory', () => {
    const base = createInitialGameState();
    const state: GameState = {
      ...base,
      character: {
        name: 'T', className: 'marine',
        stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 3 },
        hp: 14, maxHp: 14, oxygen: 100, inventory: ['access_keycard', 'knife'],
        equippedWeapon: null, equippedArmor: null, conditions: [],
        durability: {}, actionsInColdZone: 0, actionsWithoutRest: 0,
      },
    };
    expect(buildVictoryCheckContext(state).playerInventory).toContain('access_keycard');
  });

  it('extracts npcStates', () => {
    const state: GameState = {
      ...createInitialGameState(),
      npcStates: { creature: { id: 'creature', locationId: 'boss', state: { vitality: 'alive' } } },
    };
    expect(buildVictoryCheckContext(state).npcStates['creature']?.state.vitality).toBe('alive');
  });

  it('extracts all boolean/array fields', () => {
    const state: GameState = {
      ...createInitialGameState(),
      activatedObjects: ['beacon'],
      lethalLocations: ['cargo_bay'],
      fullyContainedLocations: ['boss'],
      destroyedObjectives: ['evidence'],
      selfDestructActive: true,
    };
    const ctx = buildVictoryCheckContext(state);
    expect(ctx.activatedObjects).toContain('beacon');
    expect(ctx.lethalLocations).toContain('cargo_bay');
    expect(ctx.fullyContainedLocations).toContain('boss');
    expect(ctx.destroyedObjectives).toContain('evidence');
    expect(ctx.selfDestructActive).toBe(true);
  });
});
