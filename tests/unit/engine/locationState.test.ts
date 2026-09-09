// ---------------------------------------------------------------------------
// tests/unit/engine/locationState.test.ts — Location environment axes
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  LOCATION_STATE_IDS,
  applyLocationToken,
  atmosphereOf,
  deriveConditions,
  isLethalLocation,
  locationStateFromAtmosphere,
  tickLocationStates,
} from '../../../src/engine/locationState';
import { BALANCE } from '../../../src/engine/constants';

describe('applyLocationToken', () => {
  test('every token is handled', () => {
    for (const token of LOCATION_STATE_IDS) {
      expect(() => applyLocationToken({}, token), token).not.toThrow();
    }
  });

  test('losing pressure kills artificial gravity and smothers fire', () => {
    const burning = applyLocationToken({ pressure: 'pressurized' }, 'burning');
    const breached = applyLocationToken(burning, 'depressurized');
    expect(breached.pressure).toBe('depressurized');
    expect(breached.gravity).toBe('zero_g');
    expect(breached.fire).toBe('clear');
  });

  test('flooding puts a fire out', () => {
    const state = applyLocationToken(applyLocationToken({}, 'burning'), 'flooded');
    expect(state.flood).toBe('flooded');
    expect(state.fire).toBe('clear');
  });

  test('axes are independent', () => {
    const state = applyLocationToken(applyLocationToken({}, 'dark'), 'flooded');
    expect(state.light).toBe('dark');
    expect(state.flood).toBe('flooded');
  });
});

describe('deriveConditions', () => {
  // Audit P1-11: the narration described fires and floods that changed no DC,
  // because EnvironmentCondition only knew about dark, zero-g and time pressure.
  test('fire and flooding now produce conditions', () => {
    expect(deriveConditions({ fire: 'burning' })).toContain('on_fire');
    expect(deriveConditions({ flood: 'flooded' })).toContain('flooded');
  });

  test('a depressurized room is also weightless', () => {
    const conditions = deriveConditions(applyLocationToken({}, 'depressurized'));
    expect(conditions).toContain('depressurized');
    expect(conditions).toContain('zero_g');
  });

  test('an unremarkable room has no condition', () => {
    expect(deriveConditions({ pressure: 'pressurized', light: 'lit' })).toEqual([]);
  });
});

describe('isLethalLocation', () => {
  test('vacuum and fire are lethal, a dark flooded room is not', () => {
    expect(isLethalLocation({ pressure: 'depressurized' })).toBe(true);
    expect(isLethalLocation({ fire: 'burning' })).toBe(true);
    expect(isLethalLocation({ light: 'dark', flood: 'flooded' })).toBe(false);
  });
});

describe('locationStateFromAtmosphere', () => {
  test('a depressurized node starts in vacuum and weightless', () => {
    const state = locationStateFromAtmosphere('depressurized');
    expect(state.pressure).toBe('depressurized');
    expect(state.gravity).toBe('zero_g');
  });

  test('every other atmosphere starts pressurized', () => {
    for (const atmosphere of ['pressurized', 'low_oxygen', 'toxic_atmosphere'] as const) {
      expect(locationStateFromAtmosphere(atmosphere).pressure, atmosphere).toBe('pressurized');
    }
  });

  test('round-trips through the air axis, so the oxygen tracker still reads it', () => {
    for (const atmosphere of ['pressurized', 'low_oxygen', 'toxic_atmosphere', 'depressurized'] as const) {
      expect(atmosphereOf(locationStateFromAtmosphere(atmosphere)), atmosphere).toBe(atmosphere);
    }
  });
});

// ---------------------------------------------------------------------------
// PROPAGATION — P4-4 and P4-5
// ---------------------------------------------------------------------------

describe('tickLocationStates', () => {
  const corridor = [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }];

  test('a fresh fire stays put — FIRE_SPREAD_DELAY is a real delay, not a comment', () => {
    const states = { a: applyLocationToken({ pressure: 'pressurized' }, 'burning', 0) };
    for (let turn = 0; turn < BALANCE.FIRE_SPREAD_DELAY; turn++) {
      const next = tickLocationStates(states, corridor, turn);
      expect(next['b']?.fire, `turn ${turn}`).toBeUndefined();
    }
  });

  test('a fire left alone reaches the next room and fouls its own air', () => {
    const states = {
      a: applyLocationToken({ pressure: 'pressurized', air: 'breathable' }, 'burning', 0),
      b: { pressure: 'pressurized' as const, air: 'breathable' as const },
    };
    const next = tickLocationStates(states, corridor, BALANCE.FIRE_SPREAD_DELAY);
    expect(next['a']?.air).toBe('toxic');
    expect(next['b']?.fire).toBe('burning');
  });

  test('vacuum and water stop it', () => {
    const states = {
      a: applyLocationToken({ pressure: 'pressurized' }, 'burning', 0),
      b: { pressure: 'depressurized' as const },
      c: { pressure: 'pressurized' as const, flood: 'flooded' as const },
    };
    const next = tickLocationStates(states, [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }], 99);
    expect(next['b']?.fire).toBeUndefined();
    expect(next['c']?.fire).toBeUndefined();
  });

  test('returns the same object when nothing burns, so the state keeps its identity', () => {
    const states = { a: { pressure: 'pressurized' as const } };
    expect(tickLocationStates(states, corridor, 99)).toBe(states);
  });
});
