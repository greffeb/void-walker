// ---------------------------------------------------------------------------
// tests/stress/oxygenEdgeCases.test.ts — O2 drain edge cases
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { getDrainRate, tickOxygen, useOxygenCanister } from '../../src/engine/oxygen';
import type { OxygenTickState } from '../../src/engine/oxygen';
import type { AtmosphereType } from '../../src/engine/types';
import { BALANCE } from '../../src/engine/constants';

const ATMOSPHERES: AtmosphereType[] = [
  'pressurized', 'low_oxygen', 'depressurized', 'toxic_atmosphere',
];

describe('Oxygen edge cases stress test', () => {
  test('O2 drain from 100 to 0 in various atmospheres', () => {
    for (const atmo of ATMOSPHERES) {
      const drain = getDrainRate(atmo, false);
      if (drain === 0) continue; // pressurized has no drain

      let state: OxygenTickState = { current: 100, max: 100 };
      let totalHpDrain = 0;
      let ticks = 0;

      while (state.current > 0 && ticks < 200) {
        const { newOxygen, hpDrain } = tickOxygen(state, atmo, false);
        state = newOxygen;
        totalHpDrain += hpDrain;
        ticks++;

        expect(state.current).toBeGreaterThanOrEqual(0);
        expect(state.current).not.toBeNaN();
      }

      expect(state.current).toBe(0);
      expect(totalHpDrain).toBeGreaterThan(0); // must have taken HP damage at 0 O2
    }
  });

  test('pressurized zone restores O2 from 0 to 100', () => {
    let state: OxygenTickState = { current: 0, max: 100 };
    let ticks = 0;

    while (state.current < 100 && ticks < 10) {
      const { newOxygen, hpDrain } = tickOxygen(state, 'pressurized', false);
      state = newOxygen;
      ticks++;
      expect(hpDrain).toBe(0);
      expect(state.current).toBeGreaterThan(0);
    }

    expect(state.current).toBe(100);
  });

  test('EVA suit halves drain in all non-pressurized atmospheres', () => {
    for (const atmo of ATMOSPHERES) {
      const normalDrain = getDrainRate(atmo, false);
      const suitedDrain = getDrainRate(atmo, true);

      if (normalDrain === 0) {
        expect(suitedDrain).toBe(0);
      } else {
        expect(suitedDrain).toBeLessThan(normalDrain);
        expect(suitedDrain).toBe(Math.floor(normalDrain * BALANCE.OXYGEN.EVA_DRAIN_REDUCTION));
      }
    }
  });

  test('O2 canister never exceeds max', () => {
    for (let current = 0; current <= 100; current += 5) {
      const state: OxygenTickState = { current, max: 100 };
      const result = useOxygenCanister(state);
      expect(result.current).toBeLessThanOrEqual(100);
      expect(result.current).toBeGreaterThanOrEqual(current);
    }
  });

  test('HP drain activates exactly at O2 = 0', () => {
    // Just above 0: no HP drain
    const aboveZero = tickOxygen({ current: 1, max: 100 }, 'low_oxygen', false);
    if (aboveZero.newOxygen.current > 0) {
      expect(aboveZero.hpDrain).toBe(0);
    }

    // At 0: HP drain kicks in
    const atZero = tickOxygen({ current: 0, max: 100 }, 'low_oxygen', false);
    expect(atZero.newOxygen.current).toBe(0);
    expect(atZero.hpDrain).toBe(BALANCE.OXYGEN.HP_DRAIN_AT_ZERO);
  });

  test('rapid drain-restore cycles never produce invalid state', () => {
    let state: OxygenTickState = { current: 50, max: 100 };

    for (let i = 0; i < 100; i++) {
      // Drain in depressurized
      const drained = tickOxygen(state, 'depressurized', false);
      state = drained.newOxygen;
      expect(state.current).toBeGreaterThanOrEqual(0);

      // Restore in pressurized
      const restored = tickOxygen(state, 'pressurized', false);
      state = restored.newOxygen;
      expect(state.current).toBeLessThanOrEqual(100);
      expect(state.current).toBeGreaterThanOrEqual(0);
    }
  });
});
