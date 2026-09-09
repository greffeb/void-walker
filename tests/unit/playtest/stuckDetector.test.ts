// ---------------------------------------------------------------------------
// tests/unit/playtest/stuckDetector.test.ts — StuckDetector unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { StuckDetector, readProgress, type ProgressSnapshot } from '../../playtest/stuckDetector';
import type { GameState } from '../../../src/engine/types';

function progress(locationsVisited: number, obstaclesResolved = 0): ProgressSnapshot {
  return { locationsVisited, obstaclesResolved };
}

describe('StuckDetector', () => {
  it('is not stuck before the threshold of stalled turns is reached', () => {
    const d = new StuckDetector(5);
    for (let i = 0; i < 4; i++) d.update(progress(1));
    expect(d.isStuck()).toBe(false);
  });

  it('detects stuck after threshold turns without progress', () => {
    const d = new StuckDetector(5);
    for (let i = 0; i < 6; i++) d.update(progress(1));
    expect(d.isStuck()).toBe(true);
  });

  it('reaching a new location resets the stall counter', () => {
    const d = new StuckDetector(3);
    d.update(progress(1));
    d.update(progress(1));
    d.update(progress(1));
    d.update(progress(2)); // new location — progress!
    expect(d.isStuck()).toBe(false);
    expect(d.turnsSinceProgress).toBe(0);
  });

  it('resolving an obstacle resets the stall counter', () => {
    const d = new StuckDetector(3);
    d.update(progress(4, 0));
    d.update(progress(4, 0));
    d.update(progress(4, 1)); // obstacle resolved — progress!
    expect(d.turnsSinceProgress).toBe(0);
  });

  // The whole point of the rewrite: position-based detection missed this case.
  it('detects a bot ping-ponging between two already-visited rooms', () => {
    const d = new StuckDetector(4);
    d.update(progress(2)); // in room A
    for (let i = 0; i < 10; i++) {
      d.update(progress(2)); // A → B → A → B … no NEW location
    }
    expect(d.isStuck()).toBe(true);
  });

  it('reset clears the stall counter', () => {
    const d = new StuckDetector(2);
    for (let i = 0; i < 5; i++) d.update(progress(1));
    expect(d.isStuck()).toBe(true);
    d.reset();
    expect(d.isStuck()).toBe(false);
    expect(d.turnsSinceProgress).toBe(0);
  });
});

describe('readProgress', () => {
  it('counts visited locations and resolved obstacles', () => {
    const state = {
      visitedLocations: {
        start: { obstacleResolved: false },
        unlock: { obstacleResolved: true },
        reveal: { obstacleResolved: true },
      },
    } as unknown as GameState;

    expect(readProgress(state)).toEqual({ locationsVisited: 3, obstaclesResolved: 2 });
  });

  it('returns zeros on a fresh state', () => {
    const state = { visitedLocations: {} } as unknown as GameState;
    expect(readProgress(state)).toEqual({ locationsVisited: 0, obstaclesResolved: 0 });
  });
});
