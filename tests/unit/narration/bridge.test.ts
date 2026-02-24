// ---------------------------------------------------------------------------
// tests/unit/narration/bridge.test.ts — Narration bridge (index.ts) tests
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { buildNarrativeContext, narrateForTurn } from '../../../src/narration/index';
import { resetComposer, resetAllLocationStates } from '../../../src/narration/composer';
import type { TurnResult, SceneContext, GameState } from '../../../src/engine/types';
import { createInitialGameState } from '../../../src/engine/types';

// === HELPERS ===

function makeTrace(overrides: Partial<TurnResult['trace']> = {}): TurnResult['trace'] {
  return {
    reformulated: false,
    reformulationPrompt: null,
    parsedVerb: 'STRIKE',
    parsedTarget: 'terminal_1',
    parsedTargetName: 'terminal',
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
      natural: 15,
      stat: 'FOR',
      statValue: 3,
      luckBonus: 0,
      modifier: 0,
      total: 18,
      difficulty: 10,
      success: true,
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
    locationItems: [
      {
        id: 'terminal_1',
        nameKey: 'terminal',
        aliases: ['console', 'écran'],
        properties: ['electronic'],
        isVirtual: false,
        source: 'location',
      },
    ],
    npcs: [],
    environmentFeatures: [],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    locationId: 'loc_bridge',
    ...overrides,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    turn: 5,
    scenarioId: 'escape_derelict',
    currentBeat: 'rising',
    character: {
      name: 'Erika',
      playerClass: 'marine',
      stats: { FOR: 3, DEF: 2, AGI: 2, INT: 1, PER: 2, CHA: 1, LCK: 1 },
      hp: 20,
      maxHp: 25,
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

describe('buildNarrativeContext', () => {
  it('builds a valid NarrativeContext from turn result', () => {
    const result = makeResult();
    const scene = makeSceneContext();
    const state = makeGameState();

    const ctx = buildNarrativeContext(result, scene, state);

    expect(ctx.verb).toBe('STRIKE');
    expect(ctx.outcome).toBe('success');
    expect(ctx.settingId).toBe('escape_derelict');
    expect(ctx.playerHpPercent).toBe(20 / 25);
    expect(ctx.beat).toBe('rising');
    expect(ctx.turnNumber).toBe(5);
  });

  it('maps auto verbs to auto_success outcome', () => {
    const result = makeResult({
      trace: makeTrace({ isAutoVerb: true, outcome: null }),
    });
    const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());
    expect(ctx.outcome).toBe('auto_success');
  });

  it('builds target info from scene context', () => {
    const result = makeResult();
    const scene = makeSceneContext();
    const state = makeGameState();

    const ctx = buildNarrativeContext(result, scene, state);

    expect(ctx.target).not.toBeNull();
    expect(ctx.target?.id).toBe('terminal_1');
    expect(ctx.target?.name).toBe('terminal');
  });

  it('handles missing target gracefully', () => {
    const result = makeResult({
      trace: makeTrace({ parsedTarget: null }),
    });
    const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());
    expect(ctx.target).toBeNull();
  });

  it('builds NPC info from scene context', () => {
    const scene = makeSceneContext({
      npcs: [{
        id: 'npc_kira',
        definitionId: 'kira_def',
        nameKey: 'Kira',
        aliases: ['ingénieure'],
        properties: ['human'],
        hp: 10,
      }],
    });
    const ctx = buildNarrativeContext(makeResult(), scene, makeGameState());
    expect(ctx.npcsPresent.length).toBe(1);
    expect(ctx.npcsPresent[0].name).toBe('Kira');
  });

  it('builds state changes from consequence trace', () => {
    const result = makeResult({
      trace: makeTrace({
        consequenceTypes: ['hp_loss'],
        consequenceDetails: ['Vous perdez 3 PV'],
      }),
    });
    const ctx = buildNarrativeContext(result, makeSceneContext(), makeGameState());
    expect(ctx.stateChanges).toHaveLength(1);
    expect(ctx.stateChanges![0].type).toBe('hp_loss');
  });

  it('derives tension from story beat', () => {
    const beats = [
      { beat: 'intro', expected: 2 },
      { beat: 'rising', expected: 4 },
      { beat: 'midpoint', expected: 5 },
      { beat: 'escalation', expected: 7 },
      { beat: 'climax', expected: 9 },
      { beat: 'resolution', expected: 3 },
    ] as const;

    for (const { beat, expected } of beats) {
      const state = makeGameState({ currentBeat: beat });
      const ctx = buildNarrativeContext(makeResult(), makeSceneContext(), state);
      expect(ctx.tension).toBe(expected);
    }
  });
});

describe('narrateForTurn', () => {
  beforeEach(() => {
    resetComposer();
    resetAllLocationStates();
  });

  it('returns a non-empty French narrative string', () => {
    const result = makeResult();
    const scene = makeSceneContext();
    const state = makeGameState();

    const narrative = narrateForTurn(result, scene, state, undefined, 'fr');
    expect(narrative.length).toBeGreaterThan(0);
    expect(typeof narrative).toBe('string');
  });

  it('returns existing narrative for reformulated results', () => {
    const result = makeResult({
      narrative: 'Que vouliez-vous dire ?',
      trace: makeTrace({ reformulated: true, reformulationPrompt: 'clarify' }),
    });
    const narrative = narrateForTurn(result, makeSceneContext(), makeGameState());
    expect(narrative).toBe('Que vouliez-vous dire ?');
  });

  it('returns empty string for defeat state', () => {
    const defeatedState = makeGameState({ phase: 'defeat' as GameState['phase'] });
    const result = makeResult({
      newState: defeatedState,
      narrative: '',
    });
    const narrative = narrateForTurn(result, makeSceneContext(), makeGameState());
    expect(narrative).toBe('');
  });
});
