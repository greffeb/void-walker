// ---------------------------------------------------------------------------
// src/engine/sceneDelta.ts — What changed in the room since last turn
// ---------------------------------------------------------------------------
// The store used to re-print the whole room — every element, every exit, and
// "Que faites-vous ?" — after every single action. Examining a terminal
// answered with the terminal, then the room, then the exits, every turn.
//
// A recap earns its place when something actually moved. This compares two
// SceneDescriptions and says what: a feature in a new state, an item that
// appeared or was picked up, an exit that opened, an NPC that arrived or left.
// Pure, so it is testable without a DOM and reusable by the CLI.
// ---------------------------------------------------------------------------

import type { SceneDescription } from './types';

export interface SceneDelta {
  /** Feature ids whose state description changed. */
  readonly changedFeatures: readonly string[];
  /** Item ids newly visible in the room. */
  readonly appearedItems: readonly string[];
  /** Item ids no longer in the room (taken, or consumed). */
  readonly removedItems: readonly string[];
  /** Exit names that were not listed before. */
  readonly newExits: readonly string[];
  /** NPC ids that arrived. */
  readonly arrivedNpcs: readonly string[];
  /** NPC ids that left. */
  readonly departedNpcs: readonly string[];
  /** True when the obstacle hint appeared or disappeared. */
  readonly obstacleChanged: boolean;
}

export const EMPTY_SCENE_DELTA: SceneDelta = {
  changedFeatures: [],
  appearedItems: [],
  removedItems: [],
  newExits: [],
  arrivedNpcs: [],
  departedNpcs: [],
  obstacleChanged: false,
};

/** True when nothing in the room moved. */
export function isSceneUnchanged(delta: SceneDelta): boolean {
  return delta.changedFeatures.length === 0
    && delta.appearedItems.length === 0
    && delta.removedItems.length === 0
    && delta.newExits.length === 0
    && delta.arrivedNpcs.length === 0
    && delta.departedNpcs.length === 0
    && !delta.obstacleChanged;
}

function missingFrom<T>(source: readonly T[], reference: ReadonlySet<T>): readonly T[] {
  return source.filter(value => !reference.has(value));
}

/**
 * What changed between two views of the same room.
 *
 * Callers must only compare descriptions of the SAME location: across a move,
 * everything differs and the full scene is printed anyway.
 */
export function diffScene(before: SceneDescription, after: SceneDescription): SceneDelta {
  const beforeFeatureState = new Map(before.visibleFeatures.map(f => [f.id, f.stateDescription]));
  const changedFeatures = after.visibleFeatures
    .filter(f => beforeFeatureState.has(f.id) && beforeFeatureState.get(f.id) !== f.stateDescription)
    .map(f => f.id);

  const beforeItems = new Set(before.visibleItems.map(i => i.id));
  const afterItems = new Set(after.visibleItems.map(i => i.id));
  const beforeNpcs = new Set(before.visibleNpcs.map(n => n.id));
  const afterNpcs = new Set(after.visibleNpcs.map(n => n.id));
  const beforeExits = new Set(before.exits.map(e => e.name));

  return {
    changedFeatures,
    appearedItems: missingFrom([...afterItems], beforeItems),
    removedItems: missingFrom([...beforeItems], afterItems),
    newExits: missingFrom(after.exits.map(e => e.name), beforeExits),
    arrivedNpcs: missingFrom([...afterNpcs], beforeNpcs),
    departedNpcs: missingFrom([...beforeNpcs], afterNpcs),
    obstacleChanged: (before.obstacleHint !== null) !== (after.obstacleHint !== null),
  };
}
