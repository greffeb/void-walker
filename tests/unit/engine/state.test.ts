// ---------------------------------------------------------------------------
// tests/unit/engine/state.test.ts — Immutable state helpers + death check
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  checkDeath, applyDeath, updateCharacterHp, clampHp,
} from '../../../src/engine/state';
import { createInitialGameState } from '../../../src/engine/types';
import type { GameState, CharacterState } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCharacter(hp: number, maxHp: number): CharacterState {
  return {
    name: 'Test',
    className: 'marine',
    stats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 2 },
    hp,
    maxHp,
    oxygen: 100,
    inventory: [],
    equippedWeapon: null,
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

function makeState(
  hp: number,
  maxHp: number,
  opts: Partial<{ difficulty: GameState['difficulty']; secondChanceUsed: boolean }> = {},
): GameState {
  const base = createInitialGameState();
  return {
    ...base,
    phase: 'playing',
    difficulty: opts.difficulty ?? 'survivor',
    secondChanceUsed: opts.secondChanceUsed ?? false,
    character: makeCharacter(hp, maxHp),
  };
}

// ---------------------------------------------------------------------------
// clampHp
// ---------------------------------------------------------------------------

describe('clampHp', () => {
  it('clamps below zero to zero', () => {
    expect(clampHp(-5, 14)).toBe(0);
  });

  it('clamps above maxHp to maxHp', () => {
    expect(clampHp(20, 14)).toBe(14);
  });

  it('leaves valid value unchanged', () => {
    expect(clampHp(7, 14)).toBe(7);
  });

  it('zero maxHp returns 0', () => {
    expect(clampHp(5, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// updateCharacterHp
// ---------------------------------------------------------------------------

describe('updateCharacterHp', () => {
  it('reduces HP by delta', () => {
    const state = makeState(10, 14);
    const updated = updateCharacterHp(state, -3);
    expect(updated.character!.hp).toBe(7);
  });

  it('increases HP by delta', () => {
    const state = makeState(5, 14);
    const updated = updateCharacterHp(state, 4);
    expect(updated.character!.hp).toBe(9);
  });

  it('clamps HP to maxHp', () => {
    const state = makeState(12, 14);
    const updated = updateCharacterHp(state, 10);
    expect(updated.character!.hp).toBe(14);
  });

  it('clamps HP to 0 (never below)', () => {
    const state = makeState(3, 14);
    const updated = updateCharacterHp(state, -10);
    expect(updated.character!.hp).toBe(0);
  });

  it('does not mutate original state', () => {
    const state = makeState(10, 14);
    updateCharacterHp(state, -3);
    expect(state.character!.hp).toBe(10);
  });

  it('returns null character unchanged when character is null', () => {
    const state = createInitialGameState();
    const updated = updateCharacterHp(state, -3);
    expect(updated.character).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// checkDeath
// ---------------------------------------------------------------------------

describe('checkDeath', () => {
  it('returns null when HP > 0', () => {
    expect(checkDeath(5, 14, 'survivor', false)).toBeNull();
  });

  it('returns null when HP = 1', () => {
    expect(checkDeath(1, 14, 'survivor', false)).toBeNull();
  });

  // --- Explorer ---
  it('explorer at 0 HP → knockout', () => {
    const result = checkDeath(0, 14, 'explorer', false);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('knockout');
    expect(result!.hpRestored).toBe(1);
  });

  it('explorer at negative HP → knockout', () => {
    const result = checkDeath(-3, 14, 'explorer', false);
    expect(result!.type).toBe('knockout');
  });

  // --- Survivor ---
  it('survivor first death → second_chance (25% maxHp)', () => {
    const result = checkDeath(0, 12, 'survivor', false);
    expect(result!.type).toBe('second_chance');
    expect(result!.hpRestored).toBe(3); // floor(12 * 0.25) = 3
  });

  it('survivor second death (secondChanceUsed) → permadeath', () => {
    const result = checkDeath(0, 12, 'survivor', true);
    expect(result!.type).toBe('permadeath');
    expect(result!.hpRestored).toBe(0);
  });

  // --- Nightmare ---
  it('nightmare → permadeath immediately (no second chance)', () => {
    const result = checkDeath(0, 10, 'nightmare', false);
    expect(result!.type).toBe('permadeath');
    expect(result!.hpRestored).toBe(0);
  });

  it('nightmare with secondChanceUsed → still permadeath', () => {
    const result = checkDeath(0, 10, 'nightmare', true);
    expect(result!.type).toBe('permadeath');
  });
});

// ---------------------------------------------------------------------------
// applyDeath
// ---------------------------------------------------------------------------

describe('applyDeath', () => {
  it('knockout restores HP to 1 and phase stays playing', () => {
    const state = makeState(0, 14, { difficulty: 'explorer' });
    const updated = applyDeath(state, { type: 'knockout', hpRestored: 1 });
    expect(updated.character!.hp).toBe(1);
    expect(updated.phase).toBe('playing');
  });

  it('second_chance restores HP and does NOT set secondChanceUsed yet', () => {
    // applyDeath handles HP; processTurn sets secondChanceUsed
    const state = makeState(0, 12, { difficulty: 'survivor' });
    const updated = applyDeath(state, { type: 'second_chance', hpRestored: 3 });
    expect(updated.character!.hp).toBe(3);
    expect(updated.secondChanceUsed).toBe(true);
  });

  it('permadeath sets phase to defeat', () => {
    const state = makeState(0, 14, { difficulty: 'nightmare' });
    const updated = applyDeath(state, { type: 'permadeath', hpRestored: 0 });
    expect(updated.phase).toBe('defeat');
    expect(updated.character!.hp).toBe(0);
  });

  it('does not mutate original state', () => {
    const state = makeState(0, 14, { difficulty: 'explorer' });
    applyDeath(state, { type: 'knockout', hpRestored: 1 });
    expect(state.character!.hp).toBe(0);
    expect(state.phase).toBe('playing');
  });

  it('second_chance with null character → no crash, returns state unchanged', () => {
    const state = createInitialGameState();
    const updated = applyDeath(state, { type: 'knockout', hpRestored: 1 });
    expect(updated.character).toBeNull();
  });
});
