// ---------------------------------------------------------------------------
// src/engine/backtracking.ts — Phase 6: Location Visit State + Backtracking
// ---------------------------------------------------------------------------
// Pure functions — immutable state transitions.
// Tracks what the player has done in each location across revisits.
// ---------------------------------------------------------------------------

import type { LocationVisitState } from './scenario';

// ---------------------------------------------------------------------------
// VISIT STATE FACTORY & TRANSITIONS
// ---------------------------------------------------------------------------

/** Create a fresh visit state for a location first entered on the given turn. */
export function createVisitState(firstVisited: number): LocationVisitState {
  return {
    firstVisited,
    visitCount: 1,
    itemsTaken: [],
    featuresChanged: [],
    obstacleResolved: false,
    droppedItems: [],
  };
}

/** Record that the player dropped/threw an item in this location (becomes loot). */
export function markItemDropped(
  state: LocationVisitState,
  itemId: string,
): LocationVisitState {
  if (state.droppedItems.includes(itemId)) return state;
  return { ...state, droppedItems: [...state.droppedItems, itemId] };
}

/** Record a re-entry to a previously visited location. */
export function markRevisit(state: LocationVisitState): LocationVisitState {
  return { ...state, visitCount: state.visitCount + 1 };
}

/** Record that the player picked up an item from this location. */
export function markItemTaken(
  state: LocationVisitState,
  itemId: string,
): LocationVisitState {
  if (state.itemsTaken.includes(itemId)) return state;
  return { ...state, itemsTaken: [...state.itemsTaken, itemId] };
}

/** Record that an environmental feature changed state (e.g. door opened, window cracked). */
export function markFeatureChanged(
  state: LocationVisitState,
  featureId: string,
): LocationVisitState {
  if (state.featuresChanged.includes(featureId)) return state;
  return { ...state, featuresChanged: [...state.featuresChanged, featureId] };
}

/** Record that the location's obstacle was resolved (doesn't re-activate on revisit). */
export function markObstacleResolved(state: LocationVisitState): LocationVisitState {
  if (state.obstacleResolved) return state;
  return { ...state, obstacleResolved: true };
}

// ---------------------------------------------------------------------------
// VISIT STATE QUERIES
// ---------------------------------------------------------------------------

/** True if the location has been visited at least once. */
export function hasBeenVisited(state: LocationVisitState | undefined): boolean {
  return state !== undefined;
}

/** True if the specified item is still present (not yet taken). */
export function isItemAvailable(
  state: LocationVisitState | undefined,
  itemId: string,
): boolean {
  if (state === undefined) return true; // Never visited → all items present
  return !state.itemsTaken.includes(itemId);
}

/** True if the specified feature has been changed during a previous visit. */
export function isFeatureChanged(
  state: LocationVisitState | undefined,
  featureId: string,
): boolean {
  if (state === undefined) return false;
  return state.featuresChanged.includes(featureId);
}

/** True if the obstacle has already been resolved. */
export function isObstacleResolved(state: LocationVisitState | undefined): boolean {
  return state?.obstacleResolved === true;
}

// ---------------------------------------------------------------------------
// EXITS — explored vs unexplored progress indicator
// ---------------------------------------------------------------------------

/** One exit from a location, tagged with its exploration status. */
export interface ExitInfo {
  /** The destination location ID */
  readonly locationId: string;
  /** True if the destination has been visited at least once */
  readonly visited: boolean;
}

/**
 * Returns all exits from a location, each tagged with whether the destination
 * has been explored. Used to render the "exits visible:" progress indicator.
 */
export function getExitsWithStatus(
  locationId: string,
  edges: readonly { readonly from: string; readonly to: string }[],
  visitedLocationIds: readonly string[],
): readonly ExitInfo[] {
  return edges
    .filter(e => e.from === locationId)
    .map(e => ({
      locationId: e.to,
      visited: visitedLocationIds.includes(e.to),
    }));
}

/**
 * Returns exits split into two groups for display:
 *   - unexplored (shown first — discovery hook)
 *   - explored (shown second — backtracking reference)
 */
export function categorizeExits(exits: readonly ExitInfo[]): {
  unexplored: readonly ExitInfo[];
  explored: readonly ExitInfo[];
} {
  return {
    unexplored: exits.filter(e => !e.visited),
    explored: exits.filter(e => e.visited),
  };
}
