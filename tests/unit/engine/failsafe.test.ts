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
    const result = checkFailsafe({ obstacle: makeObstacle(1), difficulty: 'explorer' });
    expect(result).toBeNull();
  });

  it('explorer: at threshold → activates degraded_bypass', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const result = checkFailsafe({ obstacle: makeObstacle(threshold), difficulty: 'explorer' });
    expect(result).not.toBeNull();
    expect(result!.activated).toBe(true);
    expect(result!.type).toBe('degraded_bypass');
    expect(result!.dcReduction).toBeGreaterThan(0);
  });

  it('explorer: beyond threshold → still activates with increasing reduction', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const r1 = checkFailsafe({ obstacle: makeObstacle(threshold), difficulty: 'explorer' });
    const r2 = checkFailsafe({ obstacle: makeObstacle(threshold + 2), difficulty: 'explorer' });
    expect(r2!.dcReduction!).toBeGreaterThan(r1!.dcReduction!);
  });

  // --- Survivor (threshold = 4) ---
  it('survivor: below threshold → null', () => {
    const result = checkFailsafe({ obstacle: makeObstacle(3), difficulty: 'survivor' });
    expect(result).toBeNull();
  });

  it('survivor: at threshold → activates', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.survivor;
    const result = checkFailsafe({ obstacle: makeObstacle(threshold), difficulty: 'survivor' });
    expect(result!.activated).toBe(true);
    expect(result!.type).toBe('degraded_bypass');
  });

  // --- Nightmare answers persistence instead of easing it (decision T) ---
  it('nightmare: never softens the obstacle — it sends the predator', () => {
    const below = BALANCE.FAILSAFE.THRESHOLD.nightmare - 1;
    expect(checkFailsafe({ obstacle: makeObstacle(below), difficulty: 'nightmare' })).toBeNull();

    const past = checkFailsafe({ obstacle: makeObstacle(100), difficulty: 'nightmare' });
    expect(past!.type).toBe('threat_escalation');
    expect(past!.escalatesThreat).toBe(true);
    expect(past!.dcReduction).toBeUndefined();
  });

  it('nightmare ignores whatever the module asked for', () => {
    const result = checkFailsafe({
      obstacle: makeObstacle(100),
      difficulty: 'nightmare',
      failsafeType: 'narrative_rescue',
    });
    expect(result!.type).toBe('threat_escalation');
  });

  // --- Already resolved ---
  it('resolved obstacle → null (no further intervention)', () => {
    const threshold = BALANCE.FAILSAFE.THRESHOLD.explorer;
    const result = checkFailsafe({ obstacle: makeObstacle(threshold, true), difficulty: 'explorer' });
    expect(result).toBeNull();
  });

  // --- Undefined obstacle (first attempt) ---
  it('undefined obstacle → null (not enough attempts yet)', () => {
    expect(checkFailsafe({ obstacle: undefined, difficulty: 'explorer' })).toBeNull();
    expect(checkFailsafe({ obstacle: undefined, difficulty: 'survivor' })).toBeNull();
    expect(checkFailsafe({ obstacle: undefined, difficulty: 'nightmare' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// DECISION T — the four declared types finally do four different things
// ---------------------------------------------------------------------------

describe('failsafe types', () => {
  const past: ObstacleState = {
    obstacleKey: 'room_a:door_01',
    attemptCount: 99,
    pathsAttempted: [],
    resolved: false,
  };

  it('degraded_bypass lowers the bar and charges blood for it', () => {
    const result = checkFailsafe({ obstacle: past, difficulty: 'survivor', failsafeType: 'degraded_bypass' });
    expect(result!.dcReduction).toBeGreaterThan(0);
    expect(result!.hpCost).toBe(BALANCE.FAILSAFE.COST.survivor);
    expect(result!.unblocksExit).toBeUndefined();
  });

  it('alternate_route hands over a path the player has not tried', () => {
    const result = checkFailsafe({
      obstacle: past,
      difficulty: 'survivor',
      failsafeType: 'alternate_route',
      untriedPathIds: ['vent', 'hack'],
    });
    expect(result!.type).toBe('alternate_route');
    expect(result!.revealedPathId).toBe('vent');
    // A hint, not a gift: no DC relief, and the obstacle still stands.
    expect(result!.dcReduction).toBeUndefined();
    expect(result!.unblocksExit).toBeUndefined();
  });

  it('alternate_route degrades to a lowered bar when every path has been tried', () => {
    const result = checkFailsafe({
      obstacle: past,
      difficulty: 'survivor',
      failsafeType: 'alternate_route',
      untriedPathIds: [],
    });
    expect(result!.type).toBe('degraded_bypass');
    expect(result!.dcReduction).toBeGreaterThan(0);
  });

  it('narrative_rescue opens the way without granting the win', () => {
    const result = checkFailsafe({ obstacle: past, difficulty: 'survivor', failsafeType: 'narrative_rescue' });
    expect(result!.unblocksExit).toBe(true);
    expect(result!.dcReduction).toBeUndefined();
    expect(result!.hpCost).toBeUndefined();
  });

  it('every type names an i18n hint — an unseen intervention is indistinguishable from luck', () => {
    const types = ['degraded_bypass', 'alternate_route', 'narrative_rescue', 'threat_escalation'] as const;
    for (const failsafeType of types) {
      const result = checkFailsafe({
        obstacle: past,
        difficulty: 'survivor',
        failsafeType,
        untriedPathIds: ['vent'],
      });
      expect(result!.hintKey).toBe(`failsafe.${failsafeType}.hint`);
    }
  });
});
