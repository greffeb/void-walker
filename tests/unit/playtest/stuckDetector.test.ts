// ---------------------------------------------------------------------------
// tests/unit/playtest/stuckDetector.test.ts — StuckDetector unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { StuckDetector, readProgress, type ProgressSnapshot } from '../../playtest/stuckDetector';
import type { GameState } from '../../../src/engine/types';

function progress(locationsVisited: number, obstaclesResolved = 0, featuresChanged = 0): ProgressSnapshot {
  return { locationsVisited, obstaclesResolved, featuresChanged };
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

  it('forcing something open resets the stall counter', () => {
    // A run spent opening the very container that holds the gate item is not
    // a stalled run.
    const d = new StuckDetector(3);
    d.update(progress(4, 1, 0));
    d.update(progress(4, 1, 0));
    d.update(progress(4, 1, 1));
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
  it('counts visited locations, resolved obstacles and changed features', () => {
    const state = {
      visitedLocations: {
        start: { obstacleResolved: false, featuresChanged: ['emergency_locker'] },
        unlock: { obstacleResolved: true, featuresChanged: [] },
        reveal: { obstacleResolved: true, featuresChanged: ['captain_terminal'] },
      },
    } as unknown as GameState;

    expect(readProgress(state)).toEqual({ locationsVisited: 3, obstaclesResolved: 2, featuresChanged: 2 });
  });

  it('returns zeros on a fresh state', () => {
    const state = { visitedLocations: {} } as unknown as GameState;
    expect(readProgress(state)).toEqual({ locationsVisited: 0, obstaclesResolved: 0, featuresChanged: 0 });
  });
});
