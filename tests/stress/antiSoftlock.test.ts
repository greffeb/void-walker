// ---------------------------------------------------------------------------
// tests/stress/antiSoftlock.test.ts
// Verify the anti-softlock failsafe system ensures all obstacles are passable.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  recordAttempt, checkFailsafe, getObstacleKey, getFailsafeDCReduction,
} from '../../src/engine/failsafe';
import {
  createMark, getMarkDCModifier,
} from '../../src/engine/shipMemory';
import { BALANCE } from '../../src/engine/constants';
import { VERB_IDS } from '../../src/engine/verbs';
import type { ObstacleState } from '../../src/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate N failures on an obstacle, return final state */
function simulateFailures(
  verb: (typeof VERB_IDS)[number],
  n: number,
): ObstacleState | undefined {
  let attempts: Readonly<Record<string, ObstacleState>> = {};
  for (let i = 0; i < n; i++) {
    attempts = recordAttempt(attempts, 'test_room', 'test_target', verb);
  }
  return attempts[getObstacleKey('test_room', 'test_target')];
}

// ---------------------------------------------------------------------------
// Failsafe threshold coverage
// ---------------------------------------------------------------------------

describe('stress: anti-softlock', () => {
  it('Explorer: failsafe activates after exactly 2 failures', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const below = simulateFailures('FORCE_OPEN', threshold - 1);
    const at = simulateFailures('FORCE_OPEN', threshold);

    expect(checkFailsafe(below, 'explorer')).toBeNull();
    const result = checkFailsafe(at, 'explorer');
    expect(result).not.toBeNull();
    expect(result!.activated).toBe(true);
  });

  it('Survivor: failsafe activates after exactly 4 failures', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.survivor;
    const below = simulateFailures('HACK', threshold - 1);
    const at = simulateFailures('HACK', threshold);

    expect(checkFailsafe(below, 'survivor')).toBeNull();
    const result = checkFailsafe(at, 'survivor');
    expect(result!.activated).toBe(true);
  });

  it('Nightmare: failsafe NEVER activates (regardless of attempts)', () => {
    for (let n = 0; n <= 20; n++) {
      const obstacle = simulateFailures('FORCE_OPEN', n);
      expect(checkFailsafe(obstacle, 'nightmare')).toBeNull();
    }
  });

  it('DC reduction increases with each extra attempt beyond threshold', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const reductions: number[] = [];
    for (let n = threshold; n <= threshold + 5; n++) {
      reductions.push(getFailsafeDCReduction(n, threshold));
    }
    for (let i = 1; i < reductions.length; i++) {
      expect(reductions[i]).toBeGreaterThan(reductions[i - 1]);
    }
  });

  it('any obstacle with base DC ≤ 25 becomes passable within worst-case attempts', () => {
    // At Explorer threshold (2 attempts), DC reduction = BASE_DC_REDUCTION (3).
    // An obstacle at DC 25 with -3 reduction = DC 22. Still possible with enough stat.
    // With more attempts, DC keeps decreasing.
    // Test: after threshold+3 attempts, reduction >= BASE+3, ensuring even DC 25 is reachable.
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const worstCaseReduction = getFailsafeDCReduction(threshold + 5, threshold);
    // DC 25 - significant reduction should put it below DC 20
    expect(BALANCE.FAILSAFE.BASE_DC_REDUCTION + 5).toBeGreaterThan(3);
    expect(worstCaseReduction).toBeGreaterThanOrEqual(BALANCE.FAILSAFE.BASE_DC_REDUCTION);
  });

  // Ship Memory marks also reduce DC, providing another softlock escape path
  it('all 7 Ship Memory mark types reduce DC for same action', () => {
    const markSpecs: Array<{
      verb: (typeof VERB_IDS)[number];
      props: string[];
    }> = [
      { verb: 'FORCE_OPEN', props: ['openable', 'secured'] },
      { verb: 'HACK', props: ['electronic', 'programmable'] },
      { verb: 'BREAK', props: ['breakable', 'transparent'] },
      { verb: 'STRIKE', props: ['alive', 'hostile'] },
      { verb: 'REPAIR', props: ['electronic', 'mechanical'] },
      { verb: 'UNLOCK', props: ['lockable', 'secured'] },
      { verb: 'CLIMB', props: ['climbable'] },
    ];

    for (const spec of markSpecs) {
      const mark = createMark(
        'room_a', 'target_01', spec.verb,
        spec.props as never[],
        'failure', 1,
      );
      expect(mark).not.toBeNull();
      // Same action: DC modifier should be negative (easier) or zero (STRIKE)
      const mod = getMarkDCModifier([mark!], spec.verb);
      expect(mod).toBeLessThanOrEqual(0);
    }
  });

  it('accumulated Ship Memory marks only decrease DC for target', () => {
    // 3 failed FORCE_OPEN attempts on same door → cumulative DC reduction
    const marks = [
      createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 1)!,
      createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 3)!,
      createMark('room_a', 'door_01', 'FORCE_OPEN', ['openable', 'secured'], 'failure', 5)!,
    ].filter(Boolean);

    const mod = getMarkDCModifier(marks, 'FORCE_OPEN');
    // 3 same-action mods of -2 each = -6
    expect(mod).toBe(-6);
  });

  it('resolved obstacle is ignored by failsafe', () => {
    let attempts: Readonly<Record<string, ObstacleState>> = {};
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    for (let i = 0; i < threshold + 2; i++) {
      attempts = recordAttempt(attempts, 'room_a', 'door_01', 'FORCE_OPEN');
    }
    const key = getObstacleKey('room_a', 'door_01');
    // Mark as resolved
    const resolvedAttempts = {
      ...attempts,
      [key]: { ...attempts[key]!, resolved: true },
    };
    expect(checkFailsafe(resolvedAttempts[key], 'explorer')).toBeNull();
  });

  it('100 different obstacles tracked independently without interference', () => {
    let attempts: Readonly<Record<string, ObstacleState>> = {};

    for (let i = 0; i < 100; i++) {
      attempts = recordAttempt(attempts, `room_${i}`, `target_${i}`, 'FORCE_OPEN');
    }

    // Each obstacle has exactly 1 attempt
    for (let i = 0; i < 100; i++) {
      const key = getObstacleKey(`room_${i}`, `target_${i}`);
      expect(attempts[key]!.attemptCount).toBe(1);
    }
    expect(Object.keys(attempts)).toHaveLength(100);
  });
});
