// ---------------------------------------------------------------------------
// src/ui/utils/mapVisibility.ts — Fog-of-war visibility logic
// ---------------------------------------------------------------------------
// Computes which rooms are visible/adjacent/hidden based on the player's
// exploration history.  Pure functions, no side effects.
// ---------------------------------------------------------------------------

import type { MapLocationData } from './mapLayout';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

/** How a room should be rendered on the map canvas */
export type RoomVisibility = 'current' | 'visited' | 'adjacent' | 'hidden';

export interface VisibilityState {
  /** Rooms the player is currently in or has visited */
  readonly visible: ReadonlySet<string>;
  /** Rooms connected to any visited room but not yet visited */
  readonly adjacent: ReadonlySet<string>;
  /** Per-room classification for rendering */
  readonly status: Readonly<Record<string, RoomVisibility>>;
}

// ---------------------------------------------------------------------------
// COMPUTATION
// ---------------------------------------------------------------------------

/**
 * Compute the fog-of-war state for the map.
 *
 * @param currentLocationId - Room the player is currently in
 * @param visitedLocationIds - All location IDs the player has ever visited
 * @param locations - Map data keyed by location ID (connections + name)
 * @param hiddenExits - Set of "from:to" edge keys that should NOT reveal
 *   their target as adjacent (obstacle-blocked / locked exits)
 * @returns Full visibility classification for every room
 */
export function computeVisibility(
  currentLocationId: string,
  visitedLocationIds: ReadonlySet<string>,
  locations: Record<string, MapLocationData>,
  hiddenExits: ReadonlySet<string> = new Set(),
): VisibilityState {
  // The visible set includes both the current location and all previously visited
  const visible = new Set<string>(visitedLocationIds);
  visible.add(currentLocationId);

  // Adjacent = connected to any visible room but not yet visited themselves
  // Skip connections that are behind an unresolved obstacle or locked exit
  const adjacent = new Set<string>();
  for (const locId of visible) {
    const loc = locations[locId];
    if (!loc) continue;
    for (const connId of loc.connections) {
      if (!visible.has(connId)) {
        const edgeKey = `${locId}:${connId}`;
        if (!hiddenExits.has(edgeKey)) {
          adjacent.add(connId);
        }
      }
    }
  }

  // Build per-room status
  const status: Record<string, RoomVisibility> = {};
  for (const locId of Object.keys(locations)) {
    if (locId === currentLocationId) {
      status[locId] = 'current';
    } else if (visible.has(locId)) {
      status[locId] = 'visited';
    } else if (adjacent.has(locId)) {
      status[locId] = 'adjacent';
    } else {
      status[locId] = 'hidden';
    }
  }

  return { visible, adjacent, status };
}

/**
 * Check whether a connector between two rooms should be rendered.
 * A connector is visible only if BOTH endpoints are visible (visited/current).
 * No connector to a "?" room.
 */
export function isConnectorVisible(
  from: string,
  to: string,
  visibility: VisibilityState,
): boolean {
  const fromStatus = visibility.status[from];
  const toStatus = visibility.status[to];
  return (fromStatus === 'current' || fromStatus === 'visited')
    && (toStatus === 'current' || toStatus === 'visited');
}

/**
 * Check whether a connector leads from a visible room to an adjacent (?) room.
 * These connectors can be rendered as faded hints.
 */
export function isConnectorToAdjacent(
  from: string,
  to: string,
  visibility: VisibilityState,
): boolean {
  const fromStatus = visibility.status[from];
  const toStatus = visibility.status[to];

  return (
    ((fromStatus === 'current' || fromStatus === 'visited') && toStatus === 'adjacent')
    || ((toStatus === 'current' || toStatus === 'visited') && fromStatus === 'adjacent')
  );
}
