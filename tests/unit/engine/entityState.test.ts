// ---------------------------------------------------------------------------
// tests/unit/engine/entityState.test.ts — State axes
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  DEFAULT_ENTITY_STATE,
  STATE_IDS,
  applyStateToken,
  makeEntityState,
  matchesState,
  resistsOpening,
  type EntityState,
} from '../../../src/engine/entityState';

describe('applyStateToken', () => {
  test('sets the axis it belongs to and leaves the others alone', () => {
    const state = applyStateToken(DEFAULT_ENTITY_STATE, 'damaged');
    expect(state.integrity).toBe('damaged');
    expect(state.openness).toBe(DEFAULT_ENTITY_STATE.openness);
    expect(state.contents).toBe(DEFAULT_ENTITY_STATE.contents);
  });

  // The single-string model could not express these; a door was 'locked' OR
  // 'open' and the difference between "unlocked" and "open" was lost.
  test('opening implies unlocking', () => {
    const locked = makeEntityState('locked');
    expect(locked.lock).toBe('locked');
    const opened = applyStateToken(locked, 'open');
    expect(opened.openness).toBe('open');
    expect(opened.lock).toBe('unlocked');
  });

  test('unlocking does not open', () => {
    const state = applyStateToken(makeEntityState('locked'), 'unlocked');
    expect(state.lock).toBe('unlocked');
    expect(state.openness).toBe('closed');
  });

  test('breaking stops and unpowers the entity', () => {
    const running = makeEntityState('active');
    expect(running.activity).toBe('active');
    expect(running.power).toBe('powered');

    const wrecked = applyStateToken(running, 'broken');
    expect(wrecked.integrity).toBe('broken');
    expect(wrecked.activity).toBe('inactive');
    expect(wrecked.power).toBe('unpowered');
  });

  test('activating implies power', () => {
    const state = applyStateToken(makeEntityState('unpowered'), 'active');
    expect(state.power).toBe('powered');
  });

  test('cutting power stops activity', () => {
    const state = applyStateToken(makeEntityState('active'), 'unpowered');
    expect(state.activity).toBe('inactive');
  });

  test('every token is handled', () => {
    for (const token of STATE_IDS) {
      expect(() => applyStateToken(DEFAULT_ENTITY_STATE, token), token).not.toThrow();
    }
  });
});

describe('matchesState', () => {
  const door: EntityState = makeEntityState('locked');

  test('matches on a single axis', () => {
    expect(matchesState(door, { lock: 'locked' })).toBe(true);
    expect(matchesState(door, { lock: 'unlocked' })).toBe(false);
  });

  test('requires every named axis', () => {
    expect(matchesState(door, { lock: 'locked', openness: 'closed' })).toBe(true);
    expect(matchesState(door, { lock: 'locked', openness: 'open' })).toBe(false);
  });

  test('an empty query matches anything', () => {
    expect(matchesState(door, {})).toBe(true);
  });
});

describe('resistsOpening', () => {
  test('a locked or broken entity resists, an intact unlocked one does not', () => {
    expect(resistsOpening(makeEntityState('locked'))).toBe(true);
    expect(resistsOpening(makeEntityState('broken'))).toBe(true);
    expect(resistsOpening(makeEntityState('closed'))).toBe(false);
  });
});
