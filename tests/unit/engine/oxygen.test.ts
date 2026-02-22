// ---------------------------------------------------------------------------
// tests/unit/engine/oxygen.test.ts — Oxygen system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { getDrainRate, tickOxygen, useOxygenCanister } from '../../../src/engine/oxygen';
import type { OxygenTickState } from '../../../src/engine/oxygen';
import { BALANCE } from '../../../src/engine/constants';

function makeO2(current: number = 100, max: number = 100): OxygenTickState {
  return { current, max };
}

describe('getDrainRate', () => {
  it('returns 0 for pressurized', () => {
    expect(getDrainRate('pressurized', false)).toBe(0);
  });

  it('returns correct drain for low_oxygen', () => {
    expect(getDrainRate('low_oxygen', false)).toBe(BALANCE.OXYGEN.DRAIN_LOW_OXYGEN);
  });

  it('returns correct drain for depressurized', () => {
    expect(getDrainRate('depressurized', false)).toBe(BALANCE.OXYGEN.DRAIN_DEPRESSURIZED);
  });

  it('returns correct drain for toxic_atmosphere', () => {
    expect(getDrainRate('toxic_atmosphere', false)).toBe(BALANCE.OXYGEN.DRAIN_TOXIC);
  });

  it('EVA suit halves drain (floored)', () => {
    const normal = getDrainRate('depressurized', false);
    const suited = getDrainRate('depressurized', true);
    expect(suited).toBe(Math.floor(normal * BALANCE.OXYGEN.EVA_DRAIN_REDUCTION));
  });

  it('EVA suit does not change pressurized (already 0)', () => {
    expect(getDrainRate('pressurized', true)).toBe(0);
  });
});

describe('tickOxygen', () => {
  it('restores O2 in pressurized zones', () => {
    const { newOxygen, hpDrain } = tickOxygen(makeO2(50), 'pressurized', false);
    expect(newOxygen.current).toBe(50 + BALANCE.OXYGEN.RESTORE_RATE_SAFE);
    expect(hpDrain).toBe(0);
  });

  it('caps O2 at max when restoring', () => {
    const { newOxygen } = tickOxygen(makeO2(90), 'pressurized', false);
    expect(newOxygen.current).toBe(100);
  });

  it('drains O2 in low_oxygen zones', () => {
    const { newOxygen, hpDrain } = tickOxygen(makeO2(50), 'low_oxygen', false);
    expect(newOxygen.current).toBe(50 - BALANCE.OXYGEN.DRAIN_LOW_OXYGEN);
    expect(hpDrain).toBe(0);
  });

  it('drains O2 in depressurized zones', () => {
    const { newOxygen } = tickOxygen(makeO2(50), 'depressurized', false);
    expect(newOxygen.current).toBe(50 - BALANCE.OXYGEN.DRAIN_DEPRESSURIZED);
  });

  it('applies HP drain when O2 reaches 0', () => {
    const { newOxygen, hpDrain } = tickOxygen(makeO2(5), 'depressurized', false);
    expect(newOxygen.current).toBe(0);
    expect(hpDrain).toBe(BALANCE.OXYGEN.HP_DRAIN_AT_ZERO);
  });

  it('O2 never goes below 0', () => {
    const { newOxygen } = tickOxygen(makeO2(2), 'depressurized', false);
    expect(newOxygen.current).toBe(0);
  });

  it('EVA suit reduces drain in depressurized zones', () => {
    const noSuit = tickOxygen(makeO2(50), 'depressurized', false);
    const withSuit = tickOxygen(makeO2(50), 'depressurized', true);
    expect(withSuit.newOxygen.current).toBeGreaterThan(noSuit.newOxygen.current);
  });
});

describe('useOxygenCanister', () => {
  it('restores CANISTER_RESTORE O2', () => {
    const result = useOxygenCanister(makeO2(30));
    expect(result.current).toBe(30 + BALANCE.OXYGEN.CANISTER_RESTORE);
  });

  it('caps at max', () => {
    const result = useOxygenCanister(makeO2(80));
    expect(result.current).toBe(100);
  });

  it('works at 0', () => {
    const result = useOxygenCanister(makeO2(0));
    expect(result.current).toBe(BALANCE.OXYGEN.CANISTER_RESTORE);
  });
});
