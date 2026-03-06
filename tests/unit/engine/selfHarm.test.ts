// ---------------------------------------------------------------------------
// tests/unit/engine/selfHarm.test.ts — SELF_HARM verb tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { parseAction } from '../../../src/engine/parser';
import { buildParserLocaleData } from '../../../src/content/parserData';
import { buildConsequences } from '../../../src/engine/consequences';
import { processTurn } from '../../../src/engine/processTurn';
import { createInitialGameState } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';
import type { SceneContext, ParserLocaleData, ParsedAction, GameState, CharacterState } from '../../../src/engine/types';

// === LOCALE DATA (built once for all tests) ===
const localeData: ParserLocaleData = buildParserLocaleData('fr');

// === TEST HELPERS ===

function makeContext(overrides: Partial<SceneContext> = {}): SceneContext {
  return {
    inventory: [],
    locationItems: [],
    npcs: [],
    environmentFeatures: [],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    ...overrides,
  };
}

function makeCharacter(hp = 10, maxHp = 14): CharacterState {
  return {
    name: 'Test',
    className: 'marine',
    stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 2 },
    hp,
    maxHp,
    oxygen: 100,
    inventory: [],
    equippedWeapon: null,
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

function makeState(hp = 10, maxHp = 14): GameState {
  return {
    ...createInitialGameState(),
    phase: 'playing',
    difficulty: 'nightmare',
    character: makeCharacter(hp, maxHp),
  };
}

/** Fixed RNG that always returns the given value */
function fixedRng(value: number) {
  return () => value;
}

// ---------------------------------------------------------------------------
// Parser tests — SELF_HARM compound patterns
// ---------------------------------------------------------------------------

describe('SELF_HARM parser', () => {
  const ctx = makeContext();

  test('"je me tue" resolves to SELF_HARM', () => {
    const result = parseAction('je me tue', ctx, localeData);
    expect('verb' in result).toBe(true);
    expect((result as ParsedAction).verb).toBe('SELF_HARM');
  });

  test('"je me suicide" resolves to SELF_HARM', () => {
    const result = parseAction('je me suicide', ctx, localeData);
    expect('verb' in result).toBe(true);
    expect((result as ParsedAction).verb).toBe('SELF_HARM');
  });

  test('"je me plante un couteau" resolves to SELF_HARM', () => {
    const result = parseAction('je me plante un couteau', ctx, localeData);
    expect('verb' in result).toBe(true);
    expect((result as ParsedAction).verb).toBe('SELF_HARM');
  });

  test('"je me tire dessus" resolves to SELF_HARM', () => {
    const result = parseAction('je me tire dessus', ctx, localeData);
    expect('verb' in result).toBe(true);
    expect((result as ParsedAction).verb).toBe('SELF_HARM');
  });

  test('"en finir" resolves to SELF_HARM', () => {
    const result = parseAction('en finir', ctx, localeData);
    expect('verb' in result).toBe(true);
    expect((result as ParsedAction).verb).toBe('SELF_HARM');
  });
});

// ---------------------------------------------------------------------------
// Consequence tests — SELF_HARM damage outcomes
// ---------------------------------------------------------------------------

describe('SELF_HARM consequences', () => {
  test('success outcome produces lethal damage (999, not nonLethal)', () => {
    const cs = buildConsequences('SELF_HARM', null, 'success');
    const damages = cs.filter(c => c.type === 'damage');
    expect(damages).toHaveLength(1);
    expect(damages[0].amount).toBe(BALANCE.SELF_HARM_LETHAL_DAMAGE);
    expect(damages[0]).not.toHaveProperty('nonLethal', true);
  });

  test('failure outcome produces 1 HP nonLethal damage', () => {
    const cs = buildConsequences('SELF_HARM', null, 'failure');
    const damages = cs.filter(c => c.type === 'damage');
    expect(damages).toHaveLength(1);
    expect(damages[0].amount).toBe(BALANCE.FAILURE_DAMAGE);
    expect(damages[0].nonLethal).toBe(true);
  });

  test('crit_failure outcome produces no damage', () => {
    const cs = buildConsequences('SELF_HARM', null, 'crit_failure');
    const damages = cs.filter(c => c.type === 'damage');
    expect(damages).toHaveLength(0);
  });

  test('crit_success outcome produces lethal damage (999, not nonLethal)', () => {
    const cs = buildConsequences('SELF_HARM', null, 'crit_success');
    const damages = cs.filter(c => c.type === 'damage');
    expect(damages).toHaveLength(1);
    expect(damages[0].amount).toBe(BALANCE.SELF_HARM_LETHAL_DAMAGE);
    expect(damages[0]).not.toHaveProperty('nonLethal', true);
  });
});

// ---------------------------------------------------------------------------
// Integration test — processTurn with SELF_HARM leading to defeat
// ---------------------------------------------------------------------------

describe('SELF_HARM integration', () => {
  test('processTurn with successful SELF_HARM sets phase to defeat', () => {
    const state = makeState(10, 14);
    const ctx = makeContext({ atmosphere: 'pressurized', locationId: 'room_a' });
    // Fixed RNG returning 0.99 => rollD20 = Math.floor(0.99 * 20) + 1 = 20 (nat 20 = crit_success)
    // This guarantees success against DC 18 (BASE_DC 10 + difficultyMod 8)
    const rng = fixedRng(0.99);

    const result = processTurn(state, 'je me tue', ctx, localeData, rng);

    expect(result.newState.phase).toBe('defeat');
  });
});
