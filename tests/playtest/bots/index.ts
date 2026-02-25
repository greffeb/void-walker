// ---------------------------------------------------------------------------
// tests/playtest/bots/index.ts — Phase 6: Playtest bot interfaces
// ---------------------------------------------------------------------------

import type { PlayerClassName } from '../../../src/engine/types';

// ---------------------------------------------------------------------------
// BOT STATE — minimal view of game state needed by bots
// ---------------------------------------------------------------------------

/** Minimal game state view for bot decision-making */
export interface BotState {
  readonly playerHp: number;
  readonly playerMaxHp: number;
  readonly playerClassId: PlayerClassName;
  readonly playerLocationId: string;
  /** Item IDs in the player's inventory */
  readonly playerInventory: readonly string[];
  /** Location IDs the player has already visited */
  readonly visitedLocationIds: readonly string[];
  readonly turn: number;
  /** True when the game is over */
  readonly isGameOver: boolean;
}

// ---------------------------------------------------------------------------
// BOT SCENE — minimal scene view for bot decision-making
// ---------------------------------------------------------------------------

/** Minimal scene view for bot decision-making */
export interface BotScene {
  /** Text suggestions the bot can use as input */
  readonly suggestions: readonly string[];
  /** Names of items visible in this location */
  readonly locationItemNames: readonly string[];
  /** IDs of items visible in this location */
  readonly locationItemIds: readonly string[];
  /** NPC IDs present in this location */
  readonly npcIds: readonly string[];
  /** IDs of connected locations */
  readonly connectedLocationIds: readonly string[];
  /** Names/aliases of connected locations (for text commands) */
  readonly connectedLocationAliases: readonly string[];
  /** True if a healing item is visible here */
  readonly hasHealingItem: boolean;
  /** True if there is an unresolved obstacle in this location */
  readonly hasObstacle: boolean;
}

// ---------------------------------------------------------------------------
// PLAYTEST BOT INTERFACE
// ---------------------------------------------------------------------------

/** A bot that can produce a player-facing text input for any game state */
export interface PlaytestBot {
  readonly name: string;
  makeDecision(state: BotState, scene: BotScene, rng: { float(): number; pick<T>(arr: readonly T[]): T }): string;
}

// ---------------------------------------------------------------------------
// RNG FACTORY — seeded for reproducibility
// ---------------------------------------------------------------------------

/** Create a reproducible seeded RNG (Lehmer generator) */
export function createSeededRng(seed: number): { float(): number; pick<T>(arr: readonly T[]): T } {
  let s = seed;
  const float = (): number => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(float() * arr.length)]!;
  return { float, pick };
}

// ---------------------------------------------------------------------------
// FUZZ INPUTS — nonsense inputs for the random bot
// ---------------------------------------------------------------------------

export const FUZZ_INPUTS: readonly string[] = [
  'regarder',
  'attendre',
  'examiner le vide',
  'frapper le mur',
  'chanter doucement',
  'tester',
  'allumer quelque chose',
  'ouvrir rien',
  'abc123',
  'zzzz',
];
