// ---------------------------------------------------------------------------
// tests/unit/engine/dice.test.ts — Dice system unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  rollD20,
  critThreshold,
  rollLuckNegation,
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

describe('critThreshold', () => {
  it('is a plain nat 20 without luck', () => {
    expect(critThreshold(0)).toBe(20);
    expect(critThreshold(-1)).toBe(20);
  });

  it('widens by one natural per two points of LCK', () => {
    expect(critThreshold(1)).toBe(20);
    expect(critThreshold(2)).toBe(19);
    expect(critThreshold(4)).toBe(18);
    expect(critThreshold(5)).toBe(18);
  });

  it('never opens a window wider than three faces at max LCK', () => {
    expect(20 - critThreshold(BALANCE.STAT_MAX) + 1).toBeLessThanOrEqual(3);
  });
});

describe('rollLuckNegation', () => {
  it('never triggers without luck', () => {
    expect(rollLuckNegation(0, fixedRng(0))).toBe(false);
    expect(rollLuckNegation(-1, fixedRng(0))).toBe(false);
  });

  it('triggers below the lck/20 threshold and not above it', () => {
    // LCK 4 → 20% chance
    expect(rollLuckNegation(4, fixedRng(0.19))).toBe(true);
    expect(rollLuckNegation(4, fixedRng(0.2))).toBe(false);
  });
});

describe('classifyOutcome', () => {
  it('returns crit_success on natural 20 even if total < DC', () => {
    expect(classifyOutcome(20, 15, 25)).toBe('crit_success');
  });

  it('returns crit_success below 20 when luck widened the window', () => {
    expect(classifyOutcome(18, 15, 25, 18)).toBe('crit_success');
    expect(classifyOutcome(17, 15, 25, 18)).toBe('failure');
  });

  it('returns crit_failure on natural 1 even if total >= DC', () => {
    expect(classifyOutcome(1, 15, 10)).toBe('crit_failure');
  });

  it('demotes a negated natural 1 to the ordinary verdict', () => {
    expect(classifyOutcome(1, 15, 10, 20, true)).toBe('success');
    expect(classifyOutcome(1, 5, 10, 20, true)).toBe('failure');
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
  it('assembles all components correctly, luck excluded from the total', () => {
    // D20: floor(0.5 * 20) + 1 = 11. No second rng draw: only a nat 1 can be negated.
    const rng = sequenceRng([0.5, 0.75]);
    const result = rollCheck('AGI', 4, 3, 13, 0, rng);

    expect(result.natural).toBe(11);
    expect(result.stat).toBe('AGI');
    expect(result.statValue).toBe(4);
    expect(result.critThreshold).toBe(19);
    expect(result.fumbleNegated).toBe(false);
    expect(result.modifier).toBe(0);
    expect(result.total).toBe(11 + 4); // 15 — LCK adds nothing
    expect(result.difficulty).toBe(13);
    expect(result.success).toBe(true);
    expect(result.critical).toBe(false);
    expect(result.fumble).toBe(false);
  });

  it('crits under 20 when LCK widened the window', () => {
    // D20: floor(0.9 * 20) + 1 = 19
    const result = rollCheck('FOR', 0, 2, 25, 0, fixedRng(0.9));
    expect(result.natural).toBe(19);
    expect(result.critThreshold).toBe(19);
    expect(result.critical).toBe(true);
    expect(result.success).toBe(true);
  });

  it('lets LCK demote a natural 1 to a plain failure', () => {
    // D20 = 1, then the negation draw succeeds (0.1 < 4/20)
    const result = rollCheck('FOR', 3, 4, 25, 0, sequenceRng([0, 0.1]));
    expect(result.natural).toBe(1);
    expect(result.fumbleNegated).toBe(true);
    expect(result.fumble).toBe(false);
    expect(result.success).toBe(false);
  });

  it('keeps the fumble when the negation draw fails', () => {
    const result = rollCheck('FOR', 3, 4, 25, 0, sequenceRng([0, 0.9]));
    expect(result.fumbleNegated).toBe(false);
    expect(result.fumble).toBe(true);
  });

  it('requiresCritical makes the total irrelevant', () => {
    // nat 11, total 25 — beats a DC of 10, but an absurd act needs the critical
    const beaten = rollCheck('FOR', 14, 0, 10, 0, fixedRng(0.5), true);
    expect(beaten.total).toBeGreaterThanOrEqual(beaten.difficulty);
    expect(beaten.success).toBe(false);

    const crit = rollCheck('FOR', 0, 0, 10, 0, fixedRng(0.95), true);
    expect(crit.natural).toBe(20);
    expect(crit.success).toBe(true);
  });

  it('detects critical success on nat 20', () => {
    const rng = sequenceRng([0.95, 0]);
    const result = rollCheck('FOR', 2, 0, 25, 0, rng);

    expect(result.natural).toBe(20);
    expect(result.critical).toBe(true);
    expect(result.success).toBe(true);
  });

  it('detects fumble on nat 1', () => {
    // D20 = 1, negation draw 0.99 fails even at LCK 5 (0.99 >= 5/20)
    const rng = sequenceRng([0, 0.99]);
    const result = rollCheck('INT', 5, 5, 2, 0, rng);

    expect(result.natural).toBe(1);
    expect(result.fumble).toBe(true);
    expect(result.success).toBe(false);
  });

  it('applies modifier to total', () => {
    // D20: floor(0.5 * 20) + 1 = 11
    const rng = sequenceRng([0.5, 0]);
    const result = rollCheck('CHA', 3, 0, 16, -2, rng);

    expect(result.total).toBe(11 + 3 + (-2)); // 12
    expect(result.modifier).toBe(-2);
    expect(result.success).toBe(false);
  });

  it('failure when total < difficulty', () => {
    // D20: floor(0.1 * 20) + 1 = 3
    const rng = sequenceRng([0.1, 0]);
    const result = rollCheck('AGI', 2, 2, 15, 0, rng);

    expect(result.natural).toBe(3);
    expect(result.total).toBe(3 + 2); // 5
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
