// ---------------------------------------------------------------------------
// src/engine/failsafe.ts — Anti-softlock failsafe system
// ---------------------------------------------------------------------------
// Tracks repeated attempts on obstacles and intervenes to prevent the player
// from being permanently blocked. Nightmare mode uses threat escalation
// instead of DC reductions.
// ---------------------------------------------------------------------------

import type { ObstacleState, FailsafeResult, FailsafeType, DifficultyLevel } from './types';
import type { VerbId } from './verbs';
import { BALANCE } from './constants';

/**
 * Build the composite key used to identify an obstacle.
 */
export function getObstacleKey(locationId: string, targetId: string): string {
  return `${locationId}:${targetId}`;
}

/**
 * Record a failed attempt on an obstacle.
 * Increments attempt count, adds verb to pathsAttempted (unique set).
 * Returns a new attempts record (immutable).
 */
export function recordAttempt(
  attempts: Readonly<Record<string, ObstacleState>>,
  locationId: string,
  targetId: string,
  verb: VerbId,
): Readonly<Record<string, ObstacleState>> {
  const key = getObstacleKey(locationId, targetId);
  const existing = attempts[key];

  if (!existing) {
    const newObstacle: ObstacleState = {
      obstacleKey: key,
      attemptCount: 1,
      pathsAttempted: [verb],
      resolved: false,
    };
    return { ...attempts, [key]: newObstacle };
  }

  const alreadyTried = existing.pathsAttempted.includes(verb);
  return {
    ...attempts,
    [key]: {
      ...existing,
      attemptCount: existing.attemptCount + 1,
      pathsAttempted: alreadyTried ? existing.pathsAttempted : [...existing.pathsAttempted, verb],
    },
  };
}

/**
 * Mark an obstacle as successfully resolved (no further failsafe interventions).
 */
export function resolveObstacle(
  attempts: Readonly<Record<string, ObstacleState>>,
  key: string,
): Readonly<Record<string, ObstacleState>> {
  const existing = attempts[key];
  if (!existing) return attempts;
  return { ...attempts, [key]: { ...existing, resolved: true } };
}

/**
 * Calculate the DC reduction to grant at a given attempt count.
 * Increases linearly with each extra attempt beyond threshold.
 */
export function getFailsafeDCReduction(attemptCount: number, threshold: number): number {
  const extra = Math.max(0, attemptCount - threshold);
  return BALANCE.FAILSAFE.BASE_DC_REDUCTION + extra;
}

/** What the failsafe check needs to know. */
export interface FailsafeInput {
  readonly obstacle: ObstacleState | undefined;
  readonly difficulty: DifficultyLevel;
  /** The intervention the module author chose. Defaults to degraded_bypass. */
  readonly failsafeType?: FailsafeType;
  /** Obstacle paths the player has not tried yet — the raw material of alternate_route. */
  readonly untriedPathIds?: readonly string[];
}

/**
 * Check whether the failsafe should activate for a given obstacle.
 *
 * Returns null if the obstacle was never attempted, is already resolved, or the
 * attempt count is still below the difficulty's threshold.
 *
 * Past the threshold, the intervention is the one the module declared. The four
 * kinds do genuinely different things: one lowers the bar and charges blood for
 * it, one hands you a handle you had not tried, one opens the way without
 * giving you the prize, and one answers your noise with a predator.
 */
export function checkFailsafe(input: FailsafeInput): FailsafeResult | null {
  const { obstacle, difficulty } = input;

  if (!obstacle) return null;
  if (obstacle.resolved) return null;

  const threshold = BALANCE.FAILSAFE.THRESHOLD[difficulty];
  if (obstacle.attemptCount < threshold) return null;

  // Nightmare never softens an obstacle. Persistence is answered, not rewarded.
  const type: FailsafeType = BALANCE.FAILSAFE.ENABLED[difficulty]
    ? (input.failsafeType ?? 'degraded_bypass')
    : 'threat_escalation';

  switch (type) {
    case 'alternate_route': {
      const revealedPathId = input.untriedPathIds?.[0];
      // Nothing left to reveal: fall back to lowering the bar.
      if (revealedPathId === undefined) break;
      return {
        type: 'alternate_route',
        activated: true,
        revealedPathId,
        hintKey: 'failsafe.alternate_route.hint',
      };
    }

    case 'narrative_rescue':
      return {
        type: 'narrative_rescue',
        activated: true,
        unblocksExit: true,
        hintKey: 'failsafe.narrative_rescue.hint',
      };

    case 'threat_escalation':
      return {
        type: 'threat_escalation',
        activated: true,
        escalatesThreat: true,
        hintKey: 'failsafe.threat_escalation.hint',
      };

    case 'degraded_bypass':
      break;
  }

  return {
    type: 'degraded_bypass',
    activated: true,
    dcReduction: getFailsafeDCReduction(obstacle.attemptCount, threshold),
    hpCost: BALANCE.FAILSAFE.COST[difficulty],
    hintKey: 'failsafe.degraded_bypass.hint',
  };
}
