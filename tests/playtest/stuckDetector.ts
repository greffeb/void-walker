// ---------------------------------------------------------------------------
// tests/playtest/stuckDetector.ts — Phase 6: Stuck detection for playtest bots
// ---------------------------------------------------------------------------
// Stuck means "no narrative progress", not "did not move": a bot ping-ponging
// between two already-visited rooms makes no progress and must be caught.
// ---------------------------------------------------------------------------

import type { GameState } from '../../src/engine/types';

/** Monotonic progression counters — both only ever increase during a run. */
export interface ProgressSnapshot {
  readonly locationsVisited: number;
  readonly obstaclesResolved: number;
  /**
   * Things the player changed the state of: a locker forced, a door unlocked.
   * Without this, a run that spends its turns opening the very container
   * holding the gate item is scored as stalled, and killed before it can win.
   */
  readonly featuresChanged: number;
}

/** Read the current progression counters from a game state. */
export function readProgress(state: GameState): ProgressSnapshot {
  const visits = Object.values(state.visitedLocations);
  let obstaclesResolved = 0;
  let featuresChanged = 0;
  for (const visit of visits) {
    if (visit.obstacleResolved) obstaclesResolved++;
    featuresChanged += visit.featuresChanged.length;
  }
  return { locationsVisited: visits.length, obstaclesResolved, featuresChanged };
}

function hasProgressed(before: ProgressSnapshot, after: ProgressSnapshot): boolean {
  return (
    after.locationsVisited > before.locationsVisited ||
    after.obstaclesResolved > before.obstaclesResolved ||
    after.featuresChanged > before.featuresChanged
  );
}

/**
 * Detects when a bot has made no narrative progress for N consecutive turns.
 * Progress = reaching a new location OR resolving an obstacle.
 */
export class StuckDetector {
  private readonly threshold: number;
  private last: ProgressSnapshot | null = null;
  private turnsWithoutProgress = 0;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  /** Record this turn's progression counters. */
  update(progress: ProgressSnapshot): void {
    if (this.last !== null && !hasProgressed(this.last, progress)) {
      this.turnsWithoutProgress++;
    } else {
      this.turnsWithoutProgress = 0;
    }
    this.last = progress;
  }

  /** Returns true once the bot has stalled for the full threshold. */
  isStuck(): boolean {
    return this.turnsWithoutProgress >= this.threshold;
  }

  /** Reset the detector (e.g. when entering a context where stalling is expected). */
  reset(): void {
    this.last = null;
    this.turnsWithoutProgress = 0;
  }

  /** Consecutive turns without progress. */
  get turnsSinceProgress(): number {
    return this.turnsWithoutProgress;
  }
}
