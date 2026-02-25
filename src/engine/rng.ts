// ---------------------------------------------------------------------------
// src/engine/rng.ts — Seeded RNG for deterministic game sessions
// ---------------------------------------------------------------------------
// Park-Miller LCG (same algorithm as tests/playtest/bots).
// Produces a standard RngFn (() => number in [0, 1)) from a numeric seed.
// ---------------------------------------------------------------------------

import type { RngFn } from './types';

/**
 * Create a seeded random number generator (Park-Miller LCG).
 * Returns a standard RngFn compatible with all engine functions.
 */
export function createSeededRng(seed: number): RngFn {
  let s = seed;
  return (): number => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
