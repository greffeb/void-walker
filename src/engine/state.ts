// ---------------------------------------------------------------------------
// src/engine/state.ts — Immutable state helpers and death resolution
// ---------------------------------------------------------------------------

import type {
  GameState, DifficultyLevel, DeathResult, DeathType,
} from './types';

/**
 * Clamp an HP value to [0, maxHp].
 */
export function clampHp(hp: number, maxHp: number): number {
  return Math.min(maxHp, Math.max(0, hp));
}

/**
 * Apply an HP delta to the character in state, clamping within [0, maxHp].
 * Returns unchanged state if character is null.
 */
export function updateCharacterHp(state: GameState, delta: number): GameState {
  if (state.character === null) return state;
  const newHp = clampHp(state.character.hp + delta, state.character.maxHp);
  return {
    ...state,
    character: { ...state.character, hp: newHp },
  };
}

/**
 * Determine how to handle the player reaching 0 HP.
 * Returns null if the player is still alive (hp > 0).
 */
export function checkDeath(
  hp: number,
  maxHp: number,
  difficulty: DifficultyLevel,
  secondChanceUsed: boolean,
): DeathResult | null {
  if (hp > 0) return null;

  // Explorer: knockout — player is never truly killed
  if (difficulty === 'explorer') {
    return { type: 'knockout', hpRestored: 1 };
  }

  // Survivor: first death triggers second chance
  if (difficulty === 'survivor' && !secondChanceUsed) {
    const restored = Math.max(1, Math.floor(maxHp * 0.25));
    return { type: 'second_chance', hpRestored: restored };
  }

  // Nightmare, or Survivor on 2nd death: true permadeath
  return { type: 'permadeath', hpRestored: 0 };
}

/**
 * Modify the game state according to a death result.
 * - knockout: restore HP to 1, keep playing
 * - second_chance: restore HP, mark second chance used
 * - permadeath: set phase to 'defeat'
 *
 * Returns unchanged state if character is null.
 */
export function applyDeath(state: GameState, result: DeathResult): GameState {
  if (state.character === null) return state;

  const type: DeathType = result.type;

  switch (type) {
    case 'knockout': {
      return {
        ...state,
        character: { ...state.character, hp: result.hpRestored },
      };
    }
    case 'second_chance': {
      return {
        ...state,
        secondChanceUsed: true,
        character: { ...state.character, hp: result.hpRestored },
      };
    }
    case 'permadeath': {
      return {
        ...state,
        phase: 'defeat',
      };
    }
  }
}
