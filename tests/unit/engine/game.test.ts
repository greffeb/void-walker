// ---------------------------------------------------------------------------
// tests/unit/engine/game.test.ts — Phase 6B: initGame, isGameOver, buildVictoryCheckContext
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, isGameOver, buildVictoryCheckContext } from '../../../src/engine/game';
import { createInitialGameState } from '../../../src/engine/types';
import { assembleScenario } from '../../../src/engine/pacing';
import { ESCAPE_SKELETON } from '../../../src/content/scenarios/escape';
import { LAUNCH_SETTINGS } from '../../../src/content/settings';
import { ALL_MODULES } from '../../../src/content/scenarios/modules/index';
import type { AssembledScenario } from '../../../src/engine/scenario';
import type { GameState, RngFn } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// TEST UTILITIES
// ---------------------------------------------------------------------------

function fixedRng(v = 0.5): RngFn { return () => v; }

function makeScenario(): AssembledScenario {
  const setting = LAUNCH_SETTINGS[0]!;
  return assembleScenario(ESCAPE_SKELETON, 'quick', setting, ALL_MODULES, fixedRng());
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
      expect(npcState.alive).toBe(true);
    }
  });

  it('builds character with correct class stats', () => {
    const scenario = makeScenario();
    const state = initGame(scenario, 'engineer', 'survivor', 'Eng', fixedRng());
    expect(state.character).not.toBeNull();
    expect(state.character!.className).toBe('engineer');
    expect(state.character!.stats.INT).toBe(5);
  });

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
      npcStates: { creature: { id: 'creature', locationId: 'boss', alive: true } },
    };
    expect(buildVictoryCheckContext(state).npcStates['creature']?.alive).toBe(true);
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
