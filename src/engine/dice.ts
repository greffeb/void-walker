// ---------------------------------------------------------------------------
// src/engine/dice.ts — Dice rolling, LCK bonus, outcome classification
// ---------------------------------------------------------------------------
// Foundation for all resolution: D20 + stat + random LCK vs DC.
// All functions are pure with injectable RNG for testability.
// ---------------------------------------------------------------------------

import type { StatId, DiceResult, RollOutcome, RngFn } from './types';
import { BALANCE } from './constants';

/** Default RNG using Math.random */
export const defaultRng: RngFn = () => Math.random();

/**
 * Roll a D20. Returns 1–20.
 */
export function rollD20(rng: RngFn = defaultRng): number {
  return Math.floor(rng() * 20) + 1;
}

/**
 * Roll a random LCK bonus from 0 to lck inclusive.
 * LCK is swingy: expected value = lck/2, preserving balance while adding variance.
 * LCK 0 always returns 0. LCK 3 returns 0, 1, 2, or 3 uniformly.
 */
export function rollLuckBonus(lck: number, rng: RngFn = defaultRng): number {
  if (lck <= 0) return 0;
  return Math.floor(rng() * (lck + 1));
}

/**
 * Classify the outcome of a roll based on natural value and total vs DC.
 * Natural 20 = crit_success (regardless of total vs DC).
 * Natural 1 = crit_failure (regardless of total vs DC).
 * Otherwise success/failure based on total >= difficulty.
 */
export function classifyOutcome(natural: number, total: number, difficulty: number): RollOutcome {
  if (natural === 20) return 'crit_success';
  if (natural === 1) return 'crit_failure';
  if (total >= difficulty) return 'success';
  return 'failure';
}

/**
 * Perform a full skill check: D20 + statValue + randomLCK + modifier vs DC.
 * Returns a complete DiceResult.
 */
export function rollCheck(
  stat: StatId,
  statValue: number,
  lck: number,
  difficulty: number,
  modifier: number = 0,
  rng: RngFn = defaultRng,
): DiceResult {
  const natural = rollD20(rng);
  const luckBonus = rollLuckBonus(lck, rng);
  const total = natural + statValue + luckBonus + modifier;
  const outcome = classifyOutcome(natural, total, difficulty);

  return {
    natural,
    stat,
    statValue,
    luckBonus,
    modifier,
    total,
    difficulty,
    success: outcome === 'crit_success' || outcome === 'success',
    critical: natural === 20,
    fumble: natural === 1,
  };
}

/**
 * Roll for NPC dodge. Returns true if the NPC dodges.
 */
export function rollDodge(dodgeChance: number, rng: RngFn = defaultRng): boolean {
  return rng() < dodgeChance;
}

/**
 * Roll for passive player dodge (AGI >= threshold grants PASSIVE_DODGE_CHANCE).
 * Returns true if the player dodges.
 */
export function rollPassiveDodge(agi: number, rng: RngFn = defaultRng): boolean {
  if (agi < BALANCE.COMBAT.PASSIVE_DODGE_AGI_THRESHOLD) return false;
  return rng() < BALANCE.COMBAT.PASSIVE_DODGE_CHANCE;
}
