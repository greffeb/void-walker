// ---------------------------------------------------------------------------
// tests/unit/engine/failsafe.test.ts — Anti-softlock failsafe system
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  getObstacleKey, recordAttempt, resolveObstacle,
  checkFailsafe, getFailsafeDCReduction,
} from '../../../src/engine/failsafe';
import { BALANCE } from '../../../src/engine/constants';
import type { ObstacleState } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// getObstacleKey
// ---------------------------------------------------------------------------

describe('getObstacleKey', () => {
  it('combines locationId and targetId with :', () => {
    expect(getObstacleKey('room_a', 'door_01')).toBe('room_a:door_01');
  });

  it('is deterministic', () => {
    const k1 = getObstacleKey('corridor_b', 'terminal_02');
    const k2 = getObstacleKey('corridor_b', 'terminal_02');
    expect(k1).toBe(k2);
  });
});

// ---------------------------------------------------------------------------
// recordAttempt
// ---------------------------------------------------------------------------

describe('recordAttempt', () => {
  it('creates a new ObstacleState on first attempt', () => {
    const result = recordAttempt({}, 'room_a', 'door_01', 'FORCE_OPEN');
    const key = getObstacleKey('room_a', 'door_01');
    expect(result[key]).toBeDefined();
    expect(result[key]!.attemptCount).toBe(1);
    expect(result[key]!.pathsAttempted).toContain('FORCE_OPEN');
    expect(result[key]!.resolved).toBe(false);
  });

  it('increments attemptCount on repeated attempts', () => {
    let attempts = recordAttempt({}, 'room_a', 'door_01', 'FORCE_OPEN');
    attempts = recordAttempt(attempts, 'room_a', 'door_01', 'BREAK');
    const key = getObstacleKey('room_a', 'door_01');
    expect(attempts[key]!.attemptCount).toBe(2);
  });

  it('accumulates pathsAttempted', () => {
    let attempts = recordAttempt({}, 'room_a', 'door_01', 'FORCE_OPEN');
    attempts = recordAttempt(attempts, 'room_a', 'door_01', 'BREAK');
    attempts = recordAttempt(attempts, 'room_a', 'door_01', 'HACK');
    const key = getObstacleKey('room_a', 'door_01');
    expect(attempts[key]!.pathsAttempted).toHaveLength(3);
    expect(attempts[key]!.pathsAttempted).toContain('FORCE_OPEN');
    expect(attempts[key]!.pathsAttempted).toContain('BREAK');
    expect(attempts[key]!.pathsAttempted).toContain('HACK');
  });

  it('does not add duplicate verbs to pathsAttempted', () => {
    let attempts = recordAttempt({}, 'room_a', 'door_01', 'FORCE_OPEN');
    attempts = recordAttempt(attempts, 'room_a', 'door_01', 'FORCE_OPEN');
    const key = getObstacleKey('room_a', 'door_01');
    expect(attempts[key]!.attemptCount).toBe(2);
    // pathsAttempted tracks unique verbs only
    expect(attempts[key]!.pathsAttempted).toHaveLength(1);
  });

  it('tracks different obstacles independently', () => {
    let attempts = recordAttempt({}, 'room_a', 'door_01', 'FORCE_OPEN');
    attempts = recordAttempt(attempts, 'room_b', 'window_01', 'BREAK');
    const k1 = getObstacleKey('room_a', 'door_01');
    const k2 = getObstacleKey('room_b', 'window_01');
    expect(attempts[k1]!.attemptCount).toBe(1);
    expect(attempts[k2]!.attemptCount).toBe(1);
  });

  it('does not mutate original attempts record', () => {
    const original = {};
    recordAttempt(original, 'room_a', 'door_01', 'FORCE_OPEN');
    expect(Object.keys(original)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// resolveObstacle
// ---------------------------------------------------------------------------

describe('resolveObstacle', () => {
  it('marks obstacle as resolved', () => {
    let attempts = recordAttempt({}, 'room_a', 'door_01', 'FORCE_OPEN');
    const key = getObstacleKey('room_a', 'door_01');
    attempts = resolveObstacle(attempts, key);
    expect(attempts[key]!.resolved).toBe(true);
  });

  it('no-ops on unknown key', () => {
    const result = resolveObstacle({}, 'room_a:door_99');
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getFailsafeDCReduction
// ---------------------------------------------------------------------------

describe('getFailsafeDCReduction', () => {
  it('at threshold returns BASE_DC_REDUCTION', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const reduction = getFailsafeDCReduction(threshold, threshold);
    expect(reduction).toBe(BALANCE.FAILSAFE.BASE_DC_REDUCTION);
  });

  it('each extra attempt beyond threshold increases DC reduction', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.survivor;
    const base = getFailsafeDCReduction(threshold, threshold);
    const extra1 = getFailsafeDCReduction(threshold + 1, threshold);
    const extra2 = getFailsafeDCReduction(threshold + 2, threshold);
    expect(extra1).toBeGreaterThan(base);
    expect(extra2).toBeGreaterThan(extra1);
  });
});

// ---------------------------------------------------------------------------
// checkFailsafe
// ---------------------------------------------------------------------------

describe('checkFailsafe', () => {
  function makeObstacle(attemptCount: number, resolved = false): ObstacleState {
    return {
      obstacleKey: 'room_a:door_01',
      attemptCount,
      pathsAttempted: [],
      resolved,
    };
  }

  // --- Explorer (threshold = 2) ---
  it('explorer: below threshold → null', () => {
    const result = checkFailsafe(makeObstacle(1), 'explorer');
    expect(result).toBeNull();
  });

  it('explorer: at threshold → activates degraded_bypass', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const result = checkFailsafe(makeObstacle(threshold), 'explorer');
    expect(result).not.toBeNull();
    expect(result!.activated).toBe(true);
    expect(result!.type).toBe('degraded_bypass');
    expect(result!.dcReduction).toBeGreaterThan(0);
  });

  it('explorer: beyond threshold → still activates with increasing reduction', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const r1 = checkFailsafe(makeObstacle(threshold), 'explorer');
    const r2 = checkFailsafe(makeObstacle(threshold + 2), 'explorer');
    expect(r2!.dcReduction!).toBeGreaterThan(r1!.dcReduction!);
  });

  // --- Survivor (threshold = 4) ---
  it('survivor: below threshold → null', () => {
    const result = checkFailsafe(makeObstacle(3), 'survivor');
    expect(result).toBeNull();
  });

  it('survivor: at threshold → activates', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.survivor;
    const result = checkFailsafe(makeObstacle(threshold), 'survivor');
    expect(result!.activated).toBe(true);
    expect(result!.type).toBe('degraded_bypass');
  });

  // --- Nightmare (failsafe DISABLED) ---
  it('nightmare: never activates regardless of attempts', () => {
    expect(checkFailsafe(makeObstacle(1), 'nightmare')).toBeNull();
    expect(checkFailsafe(makeObstacle(10), 'nightmare')).toBeNull();
    expect(checkFailsafe(makeObstacle(100), 'nightmare')).toBeNull();
  });

  // --- Already resolved ---
  it('resolved obstacle → null (no further intervention)', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const result = checkFailsafe(makeObstacle(threshold, true), 'explorer');
    expect(result).toBeNull();
  });

  // --- Undefined obstacle (first attempt) ---
  it('undefined obstacle → null (not enough attempts yet)', () => {
    expect(checkFailsafe(undefined, 'explorer')).toBeNull();
    expect(checkFailsafe(undefined, 'survivor')).toBeNull();
    expect(checkFailsafe(undefined, 'nightmare')).toBeNull();
  });
});
