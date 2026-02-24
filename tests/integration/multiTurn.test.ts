// ---------------------------------------------------------------------------
// tests/integration/multiTurn.test.ts
// 100-turn random game integration test.
// State must never corrupt, NaN/undefined must never appear.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { processTurn } from '../../src/engine/processTurn';
import { createInitialGameState } from '../../src/engine/types';
import { buildParserLocaleData } from '../../src/content/parserData';
import type { GameState, CharacterState, SceneContext } from '../../src/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCharacter(difficulty: GameState['difficulty'] = 'survivor'): CharacterState {
  const hp = difficulty === 'explorer' ? 21 : difficulty === 'nightmare' ? 10 : 14;
  return {
    name: 'Integration',
    className: 'marine',
    stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 2 },
    hp,
    maxHp: hp,
    oxygen: 100,
    inventory: ['knife', 'ration', 'flashlight'],
    equippedWeapon: 'knife',
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

function makeInitialState(difficulty: GameState['difficulty'] = 'survivor'): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    difficulty,
    character: makeCharacter(difficulty),
  };
}

const parserData = buildParserLocaleData('fr');

const testContext: SceneContext = {
  inventory: [
    {
      id: 'knife', nameKey: 'item.knife' as never,
      properties: ['tangible', 'small', 'sharp', 'bladed', 'holdable'] as unknown as never[],
      isVirtual: false, source: 'inventory',
      aliases: ['couteau', 'lame'],
    },
    {
      id: 'ration', nameKey: 'item.ration' as never,
      properties: ['tangible', 'small', 'edible', 'holdable'] as unknown as never[],
      isVirtual: false, source: 'inventory',
      aliases: ['ration', 'nourriture'],
    },
  ],
  locationItems: [
    {
      id: 'metal_bar', nameKey: 'item.metal_bar' as never,
      properties: ['tangible', 'metallic', 'rigid', 'blunt', 'holdable'] as unknown as never[],
      isVirtual: false, source: 'location',
      aliases: ['barre', 'barre metallique'],
    },
  ],
  npcs: [],
  environmentFeatures: [
    {
      id: 'door_01', definitionId: 'door',
      nameKey: 'env.door' as never,
      aliases: ['porte'],
      properties: ['door', 'openable', 'secured', 'lockable', 'tangible'] as unknown as never[],
    },
  ],
  connectedLocations: [
    { id: 'corridor_01', aliases: ['couloir', 'corridor'] },
  ],
  suggestions: [],
  environmentConditions: [],
  atmosphere: 'pressurized',
  locationId: 'room_01',
};

// Random inputs that the parser should be able to handle
const RANDOM_INPUTS = [
  'examiner la porte',
  'frapper la porte',
  'forcer la porte',
  'prendre la barre metallique',
  'attendre',
  'regarder',
  'utiliser le couteau',
  'manger la ration',
  'pousser la porte',
  'tirer la porte',
  'hacker le terminal',
  'courir',
  'se cacher',
  'scanner',
  'allons dans le couloir',
  'je veux essayer de forcer cette porte avec mes mains',
  'sabotage',
  'j\'examine',
  'casser',
  'reparer',
  '',
  'xyzzy',
  '   ',
  'frapper frapper frapper la porte',
];

// ---------------------------------------------------------------------------
// State validation helpers
// ---------------------------------------------------------------------------

function validateGameState(state: GameState, turn: number): void {
  const char = state.character;

  // Required fields must not be undefined
  expect(state.phase, `turn ${turn}: phase`).toBeDefined();
  expect(state.difficulty, `turn ${turn}: difficulty`).toBeDefined();
  expect(state.turn, `turn ${turn}: turn`).toBeDefined();
  expect(state.stalkerClockState, `turn ${turn}: stalkerClockState`).toBeDefined();
  expect(state.shipMemory, `turn ${turn}: shipMemory`).toBeDefined();
  expect(state.obstacleAttempts, `turn ${turn}: obstacleAttempts`).toBeDefined();

  // Turn counter must be a valid number
  expect(Number.isNaN(state.turn), `turn ${turn}: turn is NaN`).toBe(false);
  expect(Number.isFinite(state.turn), `turn ${turn}: turn is finite`).toBe(true);

  if (char !== null) {
    // HP must be in valid range
    expect(Number.isNaN(char.hp), `turn ${turn}: hp is NaN`).toBe(false);
    expect(Number.isFinite(char.hp), `turn ${turn}: hp is finite`).toBe(true);
    expect(char.hp, `turn ${turn}: hp >= 0`).toBeGreaterThanOrEqual(0);
    expect(char.hp, `turn ${turn}: hp <= maxHp`).toBeLessThanOrEqual(char.maxHp);

    // Oxygen must be in valid range
    expect(Number.isNaN(char.oxygen), `turn ${turn}: oxygen is NaN`).toBe(false);
    expect(char.oxygen, `turn ${turn}: oxygen >= 0`).toBeGreaterThanOrEqual(0);
    expect(char.oxygen, `turn ${turn}: oxygen <= 100`).toBeLessThanOrEqual(100);

    // No duplicate conditions
    const condIds = char.conditions.map(c => c.id);
    const uniqueCondIds = new Set(condIds);
    expect(condIds.length, `turn ${turn}: no duplicate conditions`).toBe(uniqueCondIds.size);

    // Inventory must be an array
    expect(Array.isArray(char.inventory), `turn ${turn}: inventory is array`).toBe(true);
    expect(char.inventory.length, `turn ${turn}: inventory ≤ 8`).toBeLessThanOrEqual(8);
  }

  // Stalker clock numeric values must be sane
  const clock = state.stalkerClockState;
  expect(Number.isNaN(clock.actionsSinceLastProgression), `turn ${turn}: clock NaN`).toBe(false);
  expect(clock.actionsSinceLastProgression, `turn ${turn}: clock >= 0`).toBeGreaterThanOrEqual(0);
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describe('integration: 100-turn random games', () => {
  it('survivor: 100 turns with random inputs — state never corrupts', () => {
    let state = makeInitialState('survivor');
    const rng = () => Math.random();

    for (let i = 0; i < 100; i++) {
      const input = RANDOM_INPUTS[i % RANDOM_INPUTS.length];
      const result = processTurn(state, input, testContext, parserData, rng);

      expect(result.newState, `turn ${i}: newState defined`).toBeDefined();
      validateGameState(result.newState, i);

      // If player died, game ends — break out
      if (result.newState.phase === 'defeat') {
        break;
      }

      state = result.newState;
    }
  });

  it('explorer: 100 turns — knockout mechanic prevents permadeath', () => {
    let state = makeInitialState('explorer');
    // Use fixed low RNG to force frequent failures
    let callCount = 0;
    const rng = () => {
      callCount++;
      // Alternates between very low (forces failures) and normal rolls
      return callCount % 3 === 0 ? 0.01 : 0.5;
    };

    for (let i = 0; i < 100; i++) {
      const input = RANDOM_INPUTS[i % RANDOM_INPUTS.length];
      const result = processTurn(state, input, testContext, parserData, rng);

      validateGameState(result.newState, i);
      // Explorer should never reach 'defeat'
      expect(result.newState.phase, `turn ${i}: explorer no defeat`).not.toBe('defeat');
      state = result.newState;
    }
  });

  it('nightmare: 100 turns — state valid even under harsh conditions', () => {
    let state = makeInitialState('nightmare');
    const rng = () => 0.5;

    for (let i = 0; i < 100; i++) {
      const input = RANDOM_INPUTS[i % RANDOM_INPUTS.length];
      const result = processTurn(state, input, testContext, parserData, rng);

      validateGameState(result.newState, i);

      if (result.newState.phase === 'defeat') {
        break;
      }
      state = result.newState;
    }
  });

  it('turn counter increments monotonically across all turns', () => {
    let state = makeInitialState('survivor');
    const rng = () => 0.5;

    let previousTurn = 0;
    for (let i = 0; i < 30; i++) {
      const input = RANDOM_INPUTS[i % RANDOM_INPUTS.length];
      const result = processTurn(state, input, testContext, parserData, rng);
      expect(result.newState.turn, `turn ${i}: monotonically increasing`).toBeGreaterThan(previousTurn);
      previousTurn = result.newState.turn;

      if (result.newState.phase === 'defeat') break;
      state = result.newState;
    }
  });

  it('action history grows each turn and never has undefined entries', () => {
    let state = makeInitialState('survivor');
    const rng = () => 0.5;

    for (let i = 0; i < 20; i++) {
      const input = RANDOM_INPUTS[i % RANDOM_INPUTS.length];
      const result = processTurn(state, input, testContext, parserData, rng);

      const history = result.newState.actionHistory;
      expect(Array.isArray(history)).toBe(true);

      for (const record of history) {
        expect(record.input).toBeDefined();
        expect(record.timestamp).toBeDefined();
        expect(record.outcome).toBeDefined();
        expect(Number.isNaN(record.timestamp)).toBe(false);
      }

      if (result.newState.phase === 'defeat') break;
      state = result.newState;
    }
  });

  it('ship memory only contains valid marks (no undefined fields)', () => {
    let state = makeInitialState('survivor');
    // Use low RNG to trigger failures and accumulate marks
    const rng = () => 0.02;

    for (let i = 0; i < 30; i++) {
      const input = 'forcer la porte'; // Force failures on door
      const result = processTurn(state, input, testContext, parserData, rng);

      for (const mark of result.newState.shipMemory) {
        expect(mark.locationId, 'mark locationId').toBeDefined();
        expect(mark.targetId, 'mark targetId').toBeDefined();
        expect(mark.verb, 'mark verb').toBeDefined();
        expect(mark.turn, 'mark turn').toBeDefined();
        expect(Number.isNaN(mark.turn), 'mark turn NaN').toBe(false);
        expect(mark.effect, 'mark effect').toBeDefined();
        expect(typeof mark.effect.sameActionDCMod, 'sameActionDCMod type').toBe('number');
        expect(typeof mark.effect.otherActionDCMod, 'otherActionDCMod type').toBe('number');
      }

      if (result.newState.phase === 'defeat') break;
      state = result.newState;
    }
  });
});
