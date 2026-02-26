// ---------------------------------------------------------------------------
// tests/unit/engine/oxygenFlags.test.ts — Chantier 3, C3-6
// ---------------------------------------------------------------------------
// Tests that scenario flags (o2_stabilized, sections_sealed) affect O₂ drain.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { processTurn } from '../../../src/engine/processTurn';
import { createInitialGameState } from '../../../src/engine/types';
import type { GameState, SceneContext, ParserLocaleData } from '../../../src/engine/types';
import { buildParserLocaleData } from '../../../src/content/parserData';

// Fixed RNG that always returns 0.5 → D20 roll = 11
const fixedRng = () => 0.5;

function makeParserData(): ParserLocaleData {
  return buildParserLocaleData('fr');
}

function makeMinimalSceneContext(atmosphere: string = 'low_oxygen'): SceneContext {
  return {
    inventory: [],
    locationItems: [],
    npcs: [],
    environmentFeatures: [],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    atmosphere,
    locationId: 'start',
    scenarioSuggestions: [],
    hasBlackBox: false,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    turn: 1,
    difficulty: 'survivor',
    scenarioId: 'escape',
    character: {
      name: 'Test',
      className: 'marine',
      stats: { FOR: 3, DEF: 2, AGI: 2, INT: 1, PER: 2, CHA: 1, LCK: 1 },
      hp: 20,
      maxHp: 25,
      oxygen: 80,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null,
      conditions: [],
      durability: {},
      actionsInColdZone: 0,
      actionsWithoutRest: 0,
    },
    // Minimal scenario to trigger flag checks
    scenario: {
      skeleton: {
        id: 'escape',
        name: { fr: 'Test', en: 'Test' },
        nodes: [],
        primaryVictory: { type: 'reach_location', locationId: 'resolution' },
        alternativeVictory: { type: 'reach_location', locationId: 'resolution' },
        additionalDefeatConditions: [],
      },
      modules: [],
      graph: {
        nodes: [{
          id: 'start',
          nameKey: { fr: 'Start', en: 'Start' },
          features: [],
          items: [],
          npcs: [],
          atmosphere: 'low_oxygen',
          isCoreNode: true,
          coreNodeId: 'start',
          beat: 'intro',
        }],
        edges: [],
      },
      setting: { id: 'derelict_ship', name: { fr: 'T', en: 'T' }, locationNames: {} },
      sessionLength: 'quick',
    } as unknown as import('../../../src/engine/scenario').AssembledScenario,
    playerLocationId: 'start',
    visitedLocations: { start: { visitCount: 1, firstVisitTurn: 0, itemsTaken: [], featuresChanged: [], obstacleResolved: false } },
    ...overrides,
  };
}

describe('C3-6: Oxygen tick with scenario flags', () => {
  it('no flags + low_oxygen atmosphere → O₂ drains normally', () => {
    const state = makeGameState({ scenarioFlags: {} });
    const ctx = makeMinimalSceneContext('low_oxygen');
    const result = processTurn(state, 'attendre', ctx, makeParserData(), fixedRng);
    // O₂ should drain (low_oxygen = -5 per tick)
    expect(result.trace.o2After).toBeLessThan(result.trace.o2Before);
  });

  it('o2_stabilized flag → atmosphere treated as pressurized → no drain', () => {
    const state = makeGameState({ scenarioFlags: { o2_stabilized: true } });
    const ctx = makeMinimalSceneContext('low_oxygen');
    const result = processTurn(state, 'attendre', ctx, makeParserData(), fixedRng);
    // With o2_stabilized, effective atmosphere = pressurized → O₂ restores (+2)
    expect(result.trace.o2After).toBeGreaterThanOrEqual(result.trace.o2Before);
  });

  it('sections_sealed flag + depressurized → downgrades to low_oxygen drain rate', () => {
    const state = makeGameState({ scenarioFlags: { sections_sealed: true } });
    const ctx = makeMinimalSceneContext('depressurized');
    const result = processTurn(state, 'attendre', ctx, makeParserData(), fixedRng);
    // depressurized → low_oxygen (downgraded). low_oxygen drains -5, not -10
    // O₂ should still drain, but less than depressurized would
    expect(result.trace.o2After).toBeLessThan(result.trace.o2Before);
    // Verify it's not the full depressurized drain
    const depressurizedDrain = 10; // depressurized drain rate
    const actualDrain = result.trace.o2Before - result.trace.o2After;
    expect(actualDrain).toBeLessThan(depressurizedDrain);
  });

  it('sections_sealed flag + low_oxygen → upgrades to pressurized → no drain', () => {
    const state = makeGameState({ scenarioFlags: { sections_sealed: true } });
    const ctx = makeMinimalSceneContext('low_oxygen');
    const result = processTurn(state, 'attendre', ctx, makeParserData(), fixedRng);
    // low_oxygen → pressurized (downgraded one level). No drain.
    expect(result.trace.o2After).toBeGreaterThanOrEqual(result.trace.o2Before);
  });
});
