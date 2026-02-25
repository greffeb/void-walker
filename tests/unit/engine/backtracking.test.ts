// ---------------------------------------------------------------------------
// tests/unit/engine/backtracking.test.ts — Location visit state tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  createVisitState,
  markRevisit,
  markItemTaken,
  markFeatureChanged,
  markObstacleResolved,
  hasBeenVisited,
  isItemAvailable,
  isFeatureChanged,
  isObstacleResolved,
  getExitsWithStatus,
  categorizeExits,
} from '../../../src/engine/backtracking';

// ---------------------------------------------------------------------------
// createVisitState
// ---------------------------------------------------------------------------

describe('createVisitState', () => {
  it('creates state with correct initial values', () => {
    const state = createVisitState(5);
    expect(state.firstVisited).toBe(5);
    expect(state.visitCount).toBe(1);
    expect(state.itemsTaken).toHaveLength(0);
    expect(state.featuresChanged).toHaveLength(0);
    expect(state.obstacleResolved).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// markRevisit
// ---------------------------------------------------------------------------

describe('markRevisit', () => {
  it('increments visitCount', () => {
    const s = createVisitState(1);
    const s2 = markRevisit(s);
    expect(s2.visitCount).toBe(2);
    const s3 = markRevisit(s2);
    expect(s3.visitCount).toBe(3);
  });

  it('does not mutate original', () => {
    const s = createVisitState(1);
    markRevisit(s);
    expect(s.visitCount).toBe(1);
  });

  it('preserves other fields', () => {
    const s = { ...createVisitState(3), obstacleResolved: true };
    const s2 = markRevisit(s);
    expect(s2.obstacleResolved).toBe(true);
    expect(s2.firstVisited).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// markItemTaken
// ---------------------------------------------------------------------------

describe('markItemTaken', () => {
  it('adds item to itemsTaken', () => {
    const s = createVisitState(1);
    const s2 = markItemTaken(s, 'medkit');
    expect(s2.itemsTaken).toContain('medkit');
  });

  it('does not duplicate items', () => {
    const s = createVisitState(1);
    const s2 = markItemTaken(markItemTaken(s, 'medkit'), 'medkit');
    expect(s2.itemsTaken.filter(i => i === 'medkit')).toHaveLength(1);
  });

  it('accumulates multiple different items', () => {
    const s = createVisitState(1);
    const s2 = markItemTaken(markItemTaken(s, 'medkit'), 'keycard');
    expect(s2.itemsTaken).toContain('medkit');
    expect(s2.itemsTaken).toContain('keycard');
  });

  it('does not mutate original', () => {
    const s = createVisitState(1);
    markItemTaken(s, 'medkit');
    expect(s.itemsTaken).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// markFeatureChanged
// ---------------------------------------------------------------------------

describe('markFeatureChanged', () => {
  it('adds feature to featuresChanged', () => {
    const s = createVisitState(1);
    const s2 = markFeatureChanged(s, 'door');
    expect(s2.featuresChanged).toContain('door');
  });

  it('does not duplicate features', () => {
    const s = createVisitState(1);
    const s2 = markFeatureChanged(markFeatureChanged(s, 'door'), 'door');
    expect(s2.featuresChanged.filter(f => f === 'door')).toHaveLength(1);
  });

  it('does not mutate original', () => {
    const s = createVisitState(1);
    markFeatureChanged(s, 'door');
    expect(s.featuresChanged).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// markObstacleResolved
// ---------------------------------------------------------------------------

describe('markObstacleResolved', () => {
  it('sets obstacleResolved to true', () => {
    const s = createVisitState(1);
    const s2 = markObstacleResolved(s);
    expect(s2.obstacleResolved).toBe(true);
  });

  it('is idempotent', () => {
    const s = createVisitState(1);
    const s2 = markObstacleResolved(markObstacleResolved(s));
    expect(s2.obstacleResolved).toBe(true);
  });

  it('returns same reference when already resolved', () => {
    const s = { ...createVisitState(1), obstacleResolved: true };
    expect(markObstacleResolved(s)).toBe(s);
  });
});

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

describe('hasBeenVisited', () => {
  it('false for undefined (never visited)', () => {
    expect(hasBeenVisited(undefined)).toBe(false);
  });

  it('true for any visit state', () => {
    expect(hasBeenVisited(createVisitState(1))).toBe(true);
  });
});

describe('isItemAvailable', () => {
  it('true for undefined state (item present)', () => {
    expect(isItemAvailable(undefined, 'medkit')).toBe(true);
  });

  it('true when item not in itemsTaken', () => {
    const s = createVisitState(1);
    expect(isItemAvailable(s, 'medkit')).toBe(true);
  });

  it('false when item has been taken', () => {
    const s = markItemTaken(createVisitState(1), 'medkit');
    expect(isItemAvailable(s, 'medkit')).toBe(false);
  });
});

describe('isFeatureChanged', () => {
  it('false for undefined state', () => {
    expect(isFeatureChanged(undefined, 'door')).toBe(false);
  });

  it('false when feature not changed', () => {
    const s = createVisitState(1);
    expect(isFeatureChanged(s, 'door')).toBe(false);
  });

  it('true when feature was changed', () => {
    const s = markFeatureChanged(createVisitState(1), 'door');
    expect(isFeatureChanged(s, 'door')).toBe(true);
  });
});

describe('isObstacleResolved', () => {
  it('false for undefined state', () => {
    expect(isObstacleResolved(undefined)).toBe(false);
  });

  it('false when not yet resolved', () => {
    expect(isObstacleResolved(createVisitState(1))).toBe(false);
  });

  it('true when obstacle was resolved', () => {
    expect(isObstacleResolved(markObstacleResolved(createVisitState(1)))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getExitsWithStatus
// ---------------------------------------------------------------------------

const SAMPLE_EDGES = [
  { from: 'start', to: 'unlock' },
  { from: 'start', to: 'side_room' },
  { from: 'unlock', to: 'reveal' },
  { from: 'unlock', to: 'start' },
];

describe('getExitsWithStatus', () => {
  it('returns only exits FROM the given location', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, []);
    expect(exits).toHaveLength(2);
    expect(exits.every(e => e.locationId !== 'start')).toBe(true);
  });

  it('marks unvisited exits correctly', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, []);
    for (const exit of exits) {
      expect(exit.visited).toBe(false);
    }
  });

  it('marks visited exits correctly', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, ['unlock', 'side_room']);
    for (const exit of exits) {
      expect(exit.visited).toBe(true);
    }
  });

  it('mixes visited and unvisited', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, ['unlock']);
    const unlock = exits.find(e => e.locationId === 'unlock');
    const side = exits.find(e => e.locationId === 'side_room');
    expect(unlock?.visited).toBe(true);
    expect(side?.visited).toBe(false);
  });

  it('returns empty array for location with no exits', () => {
    const exits = getExitsWithStatus('nowhere', SAMPLE_EDGES, []);
    expect(exits).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// categorizeExits
// ---------------------------------------------------------------------------

describe('categorizeExits', () => {
  it('splits exits into unexplored and explored', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, ['unlock']);
    const { unexplored, explored } = categorizeExits(exits);
    expect(explored).toHaveLength(1);
    expect(explored[0].locationId).toBe('unlock');
    expect(unexplored).toHaveLength(1);
    expect(unexplored[0].locationId).toBe('side_room');
  });

  it('all unexplored when nothing visited', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, []);
    const { unexplored, explored } = categorizeExits(exits);
    expect(unexplored).toHaveLength(2);
    expect(explored).toHaveLength(0);
  });

  it('all explored when everything visited', () => {
    const exits = getExitsWithStatus('start', SAMPLE_EDGES, ['unlock', 'side_room']);
    const { unexplored, explored } = categorizeExits(exits);
    expect(unexplored).toHaveLength(0);
    expect(explored).toHaveLength(2);
  });
});
