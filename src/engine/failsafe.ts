// ---------------------------------------------------------------------------
// src/engine/failsafe.ts — Anti-softlock failsafe system
// ---------------------------------------------------------------------------
// Tracks repeated attempts on obstacles and intervenes to prevent the player
// from being permanently blocked. Nightmare mode uses threat escalation
// instead of DC reductions.
// ---------------------------------------------------------------------------

import type { ObstacleState, FailsafeResult, DifficultyLevel } from './types';
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

/**
 * Check whether the failsafe should activate for a given obstacle.
 *
 * Returns null if:
 * - difficulty is 'nightmare' (failsafe disabled; stalker clock escalates instead)
 * - obstacle is undefined (never attempted)
 * - obstacle is resolved (already bypassed)
 * - attempt count is below threshold
 *
 * Otherwise returns a FailsafeResult describing the intervention.
 */
export function checkFailsafe(
  obstacle: ObstacleState | undefined,
  difficulty: DifficultyLevel,
): FailsafeResult | null {
  // Nightmare: failsafe never activates
  if (!BALANCE.FAILSAFE.ENABLED[difficulty]) return null;

  if (!obstacle) return null;
  if (obstacle.resolved) return null;

  const threshold = BALANCE.FAILSAFE.THRESHOLD[difficulty];
  if (obstacle.attemptCount < threshold) return null;

  const dcReduction = getFailsafeDCReduction(obstacle.attemptCount, threshold);

  return {
    type: 'degraded_bypass',
    activated: true,
    dcReduction,
    hintKey: 'failsafe.degraded_bypass.hint',
  };
}
