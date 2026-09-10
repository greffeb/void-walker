// ---------------------------------------------------------------------------
// tests/unit/engine/sceneDelta.test.ts — A recap has to earn its place
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { diffScene, isSceneUnchanged, EMPTY_SCENE_DELTA } from '../../../src/engine/sceneDelta';
import type { SceneDescription } from '../../../src/engine/types';

const room: SceneDescription = {
  locationName: 'Centre de coordination',
  locationDescription: 'Le cœur nerveux de la station.',
  obstacleHint: null,
  visibleItems: [{ id: 'medkit', name: 'trousse de soins' }],
  visibleFeatures: [
    { id: 'terminal', name: 'terminal de communications', stateDescription: 'Verrouillé.' },
    { id: 'notes', name: 'bloc-notes', stateDescription: null },
  ],
  visibleNpcs: [],
  exits: [{ name: 'atrium technique', visited: true }],
};

describe('diffScene', () => {
  it('a turn that moved nothing produces no recap', () => {
    expect(isSceneUnchanged(diffScene(room, room))).toBe(true);
  });

  it('the empty delta is unchanged', () => {
    expect(isSceneUnchanged(EMPTY_SCENE_DELTA)).toBe(true);
  });

  it('notices a feature whose state description changed', () => {
    const after: SceneDescription = {
      ...room,
      visibleFeatures: [
        { id: 'terminal', name: 'terminal de communications', stateDescription: 'Déverrouillé.' },
        { id: 'notes', name: 'bloc-notes', stateDescription: null },
      ],
    };
    const delta = diffScene(room, after);
    expect(delta.changedFeatures).toEqual(['terminal']);
    expect(isSceneUnchanged(delta)).toBe(false);
  });

  it('does not report a feature whose name is the same and state untouched', () => {
    expect(diffScene(room, { ...room }).changedFeatures).toEqual([]);
  });

  it('notices an item appearing and an item taken', () => {
    const after = { ...room, visibleItems: [{ id: 'keycard', name: 'badge' }] };
    const delta = diffScene(room, after);
    expect(delta.appearedItems).toEqual(['keycard']);
    expect(delta.removedItems).toEqual(['medkit']);
  });

  it('notices an exit that opened, and ignores one already known', () => {
    const after = {
      ...room,
      exits: [{ name: 'atrium technique', visited: true }, { name: 'sas blindé', visited: false }],
    };
    expect(diffScene(room, after).newExits).toEqual(['sas blindé']);
    expect(diffScene(room, room).newExits).toEqual([]);
  });

  it('notices an NPC arriving and leaving', () => {
    const withNpc = { ...room, visibleNpcs: [{ id: 'kira', name: 'Kira' }] };
    expect(diffScene(room, withNpc).arrivedNpcs).toEqual(['kira']);
    expect(diffScene(withNpc, room).departedNpcs).toEqual(['kira']);
  });

  it('notices an obstacle appearing or being resolved', () => {
    const blocked = { ...room, obstacleHint: 'Une cloison barre le couloir.' };
    expect(diffScene(room, blocked).obstacleChanged).toBe(true);
    expect(diffScene(blocked, room).obstacleChanged).toBe(true);
    expect(diffScene(blocked, blocked).obstacleChanged).toBe(false);
  });

  it('a feature that disappears is not reported as changed', () => {
    // Only features present in both views can have changed state.
    const after = { ...room, visibleFeatures: [room.visibleFeatures[1]!] };
    expect(diffScene(room, after).changedFeatures).toEqual([]);
  });

  it('excludes the feature the action just targeted — its own narrative already said what changed', () => {
    const after: SceneDescription = {
      ...room,
      visibleFeatures: [
        { id: 'terminal', name: 'terminal de communications', stateDescription: 'Déverrouillé.' },
        { id: 'notes', name: 'bloc-notes', stateDescription: 'Déjà lu.' },
      ],
    };
    // Only "notes" was acted on this turn: "terminal" changed too (a side effect) and still shows up.
    expect(diffScene(room, after, 'notes').changedFeatures).toEqual(['terminal']);
    // Acting on "terminal" instead hides it, since terminal is the only thing that changed.
    expect(diffScene(room, after, 'terminal').changedFeatures).toEqual(['notes']);
  });
});
