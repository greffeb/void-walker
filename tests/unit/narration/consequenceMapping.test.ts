// ---------------------------------------------------------------------------
// tests/unit/narration/consequenceMapping.test.ts
// Regression tests for issue #34: fire snippets selected with no fire in scene
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { buildNarrativeContext } from '../../../src/narration/index';
import { composeNarrative, resetComposer, resetAllLocationStates } from '../../../src/narration/composer';
import { NARRATIVE_PRESETS } from '../../../src/narration/types';
import type { TurnResult, SceneContext, GameState } from '../../../src/engine/types';
import { createInitialGameState } from '../../../src/engine/types';
import type { NarrativeContext } from '../../../src/narration/types';

// === HELPERS (mirrors bridge.test.ts) ===

function makeTrace(overrides: Partial<TurnResult['trace']> = {}): TurnResult['trace'] {
  return {
    reformulated: false,
    reformulationPrompt: null,
    parsedVerb: 'REPAIR',
    parsedTarget: 'env.light_fixture',
    parsedTargetName: 'Luminaire',
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
    statId: 'INT',
    effectiveStatValue: 1,
    shipMemoryMod: 0,
    failsafeActivated: false,
    failsafeDcReduction: 0,
    difficultyBreakdown: null,
    effectiveDC: 11,
    outcome: 'failure',
    consequenceTypes: ['damage'],
    consequenceDetails: ['1 damage to player'],
    triggeredConditions: [],
    deathResult: null,
    npcReacted: false,
    npcAttackHit: false,
    npcAttackDamage: 0,
    stalkerClockBefore: 0,
    stalkerClockAfter: 1,
    stalkerEventType: null,
    ...overrides,
  };
}

function makeResult(overrides: Partial<TurnResult> = {}): TurnResult {
  const state = makeGameState();
  return {
    newState: { ...state, turn: state.turn + 1 },
    narrative: '',
    diceRoll: {
      natural: 8,
      stat: 'INT',
      statValue: 1,
      luckBonus: 0,
      modifier: 0,
      total: 9,
      difficulty: 11,
      success: false,
      critical: false,
      fumble: false,
    },
    suggestions: [],
    trace: makeTrace(),
    ...overrides,
  };
}

function makeSceneContext(overrides: Partial<SceneContext> = {}): SceneContext {
  return {
    inventory: [],
    locationItems: [],
    npcs: [],
    environmentFeatures: [
      { id: 'light_fixture', nameKey: 'feature.light_fixture', aliases: [], properties: ['fragile', 'electronic'], isVirtual: false, source: 'location' },
    ],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    locationId: 'dark_room_01_main_0',
    ...overrides,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    turn: 13,
    scenarioId: 'alien_ruins',
    currentBeat: 'rising',
    character: {
      name: 'Joueur',
      playerClass: 'marine',
      stats: { FOR: 3, DEF: 2, AGI: 2, INT: 1, PER: 2, CHA: 1, LCK: 1 },
      hp: 17,
      maxHp: 18,
      oxygen: 100,
      maxOxygen: 100,
      inventory: [],
      equippedWeapon: null,
      equippedArmor: null,
      conditions: [],
      passiveAbility: {
        id: 'combat_damage_bonus',
        nameKey: 'passive.marine.name',
        descriptionKey: 'passive.marine.desc',
        effect: 'COMBAT_DAMAGE_BONUS',
        value: 1,
      },
    },
    ...overrides,
  };
}

// === TESTS ===

describe('consequence type mapping', () => {
  beforeEach(() => {
    resetComposer();
    resetAllLocationStates();
  });

  it('maps damage ConsequenceType to hp_loss stateChangeType', () => {
    const result = makeResult({ trace: makeTrace({ consequenceTypes: ['damage'], consequenceDetails: ['1 damage to player'] }) });
    const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());

    expect(ctx.stateChanges).toHaveLength(1);
    expect(ctx.stateChanges![0]!.type).toBe('hp_loss');
  });

  it('maps environment_change ConsequenceType to generic (no scene context available)', () => {
    const result = makeResult({ trace: makeTrace({ consequenceTypes: ['environment_change'], consequenceDetails: ['room conditions changed'] }) });
    const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());

    expect(ctx.stateChanges![0]!.type).toBe('generic');
  });

  it('maps all supported ConsequenceTypes correctly', () => {
    const cases: Array<[TurnResult['trace']['consequenceTypes'][number], string]> = [
      ['damage', 'hp_loss'],
      ['heal', 'hp_gain'],
      ['condition_add', 'condition_gained'],
      ['condition_remove', 'condition_removed'],
      ['inventory_add', 'item_gained'],
      ['inventory_remove', 'item_lost'],
      ['item_break', 'item_broken'],
      ['ship_memory_mark', 'generic'],
      ['atmosphere_change', 'generic'],
    ];

    for (const [engineType, expectedNarType] of cases) {
      const result = makeResult({ trace: makeTrace({ consequenceTypes: [engineType], consequenceDetails: ['desc'] }) });
      const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());
      expect(ctx.stateChanges![0]!.type, `engine type '${engineType}'`).toBe(expectedNarType);
    }
  });
});

describe('consequence fallback safety', () => {
  beforeEach(() => {
    resetComposer();
    resetAllLocationStates();
  });

  it('fallback for unknown stateChangeType selects only generic snippets, never fire/flood/environment-specific', () => {
    const FIRE_STRINGS = ["L'incendie", 'flammes', 'brèche', 'dépressuris', 'inondé', 'lights_off'];

    // Run many times to catch random selection
    for (let i = 0; i < 30; i++) {
      resetComposer();
      const ctx: NarrativeContext = {
        verb: 'REPAIR',
        verbCategory: 'interaction',
        outcome: 'failure',
        margin: -2,
        target: null,
        targetDisposition: 'neutral',
        toolUsed: null,
        location: { id: 'loc_x', name: 'loc_x', description: '', features: [], conditions: new Set() },
        environmentConditions: new Set<string>(),
        tension: 'mid',
        beat: 'rising',
        settingId: 'alien_ruins',
        playerHpPercent: 0.9,
        playerConditions: new Set<string>(),
        moduleId: '',
        moduleType: 'exploration',
        npcsPresent: [],
        recentEvents: [],
        turnNumber: 13,
        isCreative: false,
        isAbsurd: false,
        stateChanges: [{ type: 'unknown_type_xyz', description: 'test' }],
      };

      const output = composeNarrative(ctx, NARRATIVE_PRESETS.standard);
      for (const fireStr of FIRE_STRINGS) {
        expect(output, `iteration ${i}: output should not contain "${fireStr}"`).not.toContain(fireStr);
      }
    }
  });
});

describe('regression: issue #34 — REPAIR failure on light_fixture', () => {
  beforeEach(() => {
    resetComposer();
    resetAllLocationStates();
  });

  it('does not output fire text when repairing a light_fixture with no fire in scene', () => {
    const result = makeResult();
    const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());

    // Run multiple times to rule out random selection
    for (let i = 0; i < 20; i++) {
      resetComposer();
      const output = composeNarrative(ctx, NARRATIVE_PRESETS.standard);
      expect(output).not.toMatch(/incendie|flammes|fire_started/i);
    }
  });
});
