// ---------------------------------------------------------------------------
// tests/unit/engine/dice.test.ts — Dice system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  rollD20,
  rollLuckBonus,
  classifyOutcome,
  rollCheck,
  rollDodge,
  rollPassiveDodge,
} from '../../../src/engine/dice';
import type { RngFn } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';

/** Create a deterministic RNG that returns a fixed value */
function fixedRng(value: number): RngFn {
  return () => value;
}

/** Create an RNG that returns values from an array in sequence */
function sequenceRng(values: number[]): RngFn {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

describe('rollD20', () => {
  it('returns 1 when rng returns 0', () => {
    expect(rollD20(fixedRng(0))).toBe(1);
  });

  it('returns 20 when rng returns 0.95', () => {
    expect(rollD20(fixedRng(0.95))).toBe(20);
  });

  it('returns 10 when rng returns ~0.45', () => {
    expect(rollD20(fixedRng(0.45))).toBe(10);
  });

  it('never returns 0 or 21', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollD20(fixedRng(i / 100));
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(20);
    }
  });
});

describe('rollLuckBonus', () => {
  it('returns 0 for LCK 0 regardless of rng', () => {
    expect(rollLuckBonus(0, fixedRng(0.99))).toBe(0);
    expect(rollLuckBonus(0, fixedRng(0))).toBe(0);
  });

  it('returns 0 for negative LCK', () => {
    expect(rollLuckBonus(-1, fixedRng(0.5))).toBe(0);
  });

  it('returns 0 when rng returns 0 for LCK 5', () => {
    expect(rollLuckBonus(5, fixedRng(0))).toBe(0);
  });

  it('returns lck when rng returns just under 1 for LCK 5', () => {
    expect(rollLuckBonus(5, fixedRng(0.99))).toBe(5);
  });

  it('returns values in 0..lck range for LCK 3', () => {
    // rng = 0.0 -> floor(0 * 4) = 0
    expect(rollLuckBonus(3, fixedRng(0))).toBe(0);
    // rng = 0.25 -> floor(0.25 * 4) = 1
    expect(rollLuckBonus(3, fixedRng(0.25))).toBe(1);
    // rng = 0.5 -> floor(0.5 * 4) = 2
    expect(rollLuckBonus(3, fixedRng(0.5))).toBe(2);
    // rng = 0.75 -> floor(0.75 * 4) = 3
    expect(rollLuckBonus(3, fixedRng(0.75))).toBe(3);
  });

  it('has average approximately lck/2 over many rolls', () => {
    const lck = 4;
    const iterations = 10000;
    let sum = 0;
    const rng = () => Math.random();
    for (let i = 0; i < iterations; i++) {
      sum += rollLuckBonus(lck, rng);
    }
    const avg = sum / iterations;
    expect(avg).toBeGreaterThan(lck / 2 - 0.2);
    expect(avg).toBeLessThan(lck / 2 + 0.2);
  });
});

describe('classifyOutcome', () => {
  it('returns crit_success on natural 20 even if total < DC', () => {
    expect(classifyOutcome(20, 15, 25)).toBe('crit_success');
  });

  it('returns crit_failure on natural 1 even if total >= DC', () => {
    expect(classifyOutcome(1, 15, 10)).toBe('crit_failure');
  });

  it('returns success when total >= difficulty', () => {
    expect(classifyOutcome(10, 15, 15)).toBe('success');
    expect(classifyOutcome(10, 16, 15)).toBe('success');
  });

  it('returns failure when total < difficulty', () => {
    expect(classifyOutcome(10, 14, 15)).toBe('failure');
  });

  it('success on exact match (total === difficulty)', () => {
    expect(classifyOutcome(5, 12, 12)).toBe('success');
  });
});

describe('rollCheck', () => {
  it('assembles all components correctly', () => {
    // rng sequence: first call for D20, second for LCK
    // D20: floor(0.5 * 20) + 1 = 11
    // LCK: floor(0.75 * (3 + 1)) = 3
    const rng = sequenceRng([0.5, 0.75]);
    const result = rollCheck('AGI', 4, 3, 13, 0, rng);

    expect(result.natural).toBe(11);
    expect(result.stat).toBe('AGI');
    expect(result.statValue).toBe(4);
    expect(result.luckBonus).toBe(3);
    expect(result.modifier).toBe(0);
    expect(result.total).toBe(11 + 4 + 3); // 18
    expect(result.difficulty).toBe(13);
    expect(result.success).toBe(true);
    expect(result.critical).toBe(false);
    expect(result.fumble).toBe(false);
  });

  it('detects critical success on nat 20', () => {
    // D20: floor(0.95 * 20) + 1 = 20
    // LCK: floor(0 * 1) = 0
    const rng = sequenceRng([0.95, 0]);
    const result = rollCheck('FOR', 2, 0, 25, 0, rng);

    expect(result.natural).toBe(20);
    expect(result.critical).toBe(true);
    expect(result.success).toBe(true);
  });

  it('detects fumble on nat 1', () => {
    // D20: floor(0 * 20) + 1 = 1
    // LCK: floor(0.99 * 6) = 5
    const rng = sequenceRng([0, 0.99]);
    const result = rollCheck('INT', 5, 5, 2, 0, rng);

    expect(result.natural).toBe(1);
    expect(result.fumble).toBe(true);
    expect(result.success).toBe(false);
  });

  it('applies modifier to total', () => {
    // D20: floor(0.5 * 20) + 1 = 11
    // LCK: 0
    const rng = sequenceRng([0.5, 0]);
    const result = rollCheck('CHA', 3, 0, 16, -2, rng);

    expect(result.total).toBe(11 + 3 + 0 + (-2)); // 12
    expect(result.modifier).toBe(-2);
    expect(result.success).toBe(false);
  });

  it('failure when total < difficulty', () => {
    // D20: floor(0.1 * 20) + 1 = 3
    // LCK: floor(0 * 3) = 0
    const rng = sequenceRng([0.1, 0]);
    const result = rollCheck('AGI', 2, 2, 15, 0, rng);

    expect(result.natural).toBe(3);
    expect(result.total).toBe(3 + 2 + 0); // 5
    expect(result.success).toBe(false);
  });
});

describe('rollDodge', () => {
  it('returns true when rng < dodgeChance', () => {
    expect(rollDodge(0.3, fixedRng(0.1))).toBe(true);
  });

  it('returns false when rng >= dodgeChance', () => {
    expect(rollDodge(0.3, fixedRng(0.5))).toBe(false);
  });

  it('returns false for 0% dodge chance', () => {
    expect(rollDodge(0, fixedRng(0))).toBe(false);
  });
});

describe('rollPassiveDodge', () => {
  it('returns false when AGI < threshold', () => {
    expect(rollPassiveDodge(2, fixedRng(0))).toBe(false);
  });

  it('can return true when AGI >= threshold and rng < PASSIVE_DODGE_CHANCE', () => {
    expect(rollPassiveDodge(3, fixedRng(0.05))).toBe(true);
  });

  it('returns false when AGI >= threshold but rng >= PASSIVE_DODGE_CHANCE', () => {
    expect(rollPassiveDodge(4, fixedRng(0.5))).toBe(false);
  });

  it('uses BALANCE threshold correctly', () => {
    const threshold = BALANCE.COMBAT.PASSIVE_DODGE_AGI_THRESHOLD;
    expect(rollPassiveDodge(threshold - 1, fixedRng(0))).toBe(false);
    expect(rollPassiveDodge(threshold, fixedRng(0))).toBe(true);
  });
});
