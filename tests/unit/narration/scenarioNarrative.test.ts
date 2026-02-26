// ---------------------------------------------------------------------------
// tests/unit/narration/scenarioNarrative.test.ts — Chantier 3, C3-8
// ---------------------------------------------------------------------------
// Tests that narrateForTurn uses scenario interaction narrative overrides.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { narrateForTurn } from '../../../src/narration/index';
import { createInitialGameState } from '../../../src/engine/types';
import type { TurnResult, SceneContext, GameState } from '../../../src/engine/types';

function makeSceneContext(): SceneContext {
  return {
    inventory: [],
    locationItems: [],
    npcs: [],
    environmentFeatures: [],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    atmosphere: 'pressurized',
    locationId: 'start',
    scenarioSuggestions: [],
    hasBlackBox: false,
  };
}

function makeGameState(): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    turn: 1,
    difficulty: 'survivor',
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
  };
}

function makeTrace(overrides: Partial<TurnResult['trace']> = {}): TurnResult['trace'] {
  return {
    reformulated: false,
    reformulationPrompt: null,
    parsedVerb: 'OPEN',
    parsedTarget: 'locker',
    parsedTargetName: null,
    parseStrategy: 1,
    parseCreative: false,
    creativityMod: 0,
    conditionHpDrain: 0,
    conditionsExpired: [],
    atmosphere: 'pressurized',
    o2Before: 100,
    o2After: 100,
    oxygenHpDrain: 0,
    isAutoVerb: false,
    statId: 'FOR',
    effectiveStatValue: 3,
    shipMemoryMod: 0,
    failsafeActivated: false,
    failsafeDcReduction: 0,
    difficultyBreakdown: null,
    effectiveDC: 10,
    outcome: 'success',
    consequenceTypes: [],
    consequenceDetails: [],
    triggeredConditions: [],
    deathResult: null,
    npcReacted: false,
    npcAttackHit: false,
    npcAttackDamage: 0,
    stalkerClockBefore: 0,
    stalkerClockAfter: 0,
    stalkerEventType: null,
    ...overrides,
  };
}

describe('C3-8: narrateForTurn scenario narrative override', () => {
  it('uses FR narrative override when scenarioInteractionMatched + override present', () => {
    const result: TurnResult = {
      newState: makeGameState(),
      narrative: '',
      diceRoll: null,
      suggestions: [],
      trace: makeTrace({
        scenarioInteractionMatched: true,
        scenarioNarrativeOverride: {
          fr: 'Le métal cède dans un crissement.',
          en: 'The metal gives way with a screech.',
        },
      }),
    };

    const output = narrateForTurn(result, makeSceneContext(), makeGameState(), undefined, 'fr');
    expect(output).toBe('Le métal cède dans un crissement.');
  });

  it('uses EN narrative override when locale is en', () => {
    const result: TurnResult = {
      newState: makeGameState(),
      narrative: '',
      diceRoll: null,
      suggestions: [],
      trace: makeTrace({
        scenarioInteractionMatched: true,
        scenarioNarrativeOverride: {
          fr: 'Le métal cède.',
          en: 'The metal gives way.',
        },
      }),
    };

    const output = narrateForTurn(result, makeSceneContext(), makeGameState(), undefined, 'en');
    expect(output).toBe('The metal gives way.');
  });

  it('falls back to standard composition when matched but no override', () => {
    const result: TurnResult = {
      newState: makeGameState(),
      narrative: '',
      diceRoll: null,
      suggestions: [],
      trace: makeTrace({
        scenarioInteractionMatched: true,
        scenarioNarrativeOverride: undefined,
      }),
    };

    // Should not crash and should return something (standard composition)
    const output = narrateForTurn(result, makeSceneContext(), makeGameState());
    expect(typeof output).toBe('string');
  });

  it('uses standard composition when scenarioInteractionMatched is false', () => {
    const result: TurnResult = {
      newState: makeGameState(),
      narrative: '',
      diceRoll: null,
      suggestions: [],
      trace: makeTrace({
        scenarioInteractionMatched: false,
      }),
    };

    // Should not crash; returns standard composition
    const output = narrateForTurn(result, makeSceneContext(), makeGameState());
    expect(typeof output).toBe('string');
  });
});
