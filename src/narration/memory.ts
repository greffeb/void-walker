// ---------------------------------------------------------------------------
// src/narration/memory.ts — NarrationMemory (anti-repetition buffers)
// ---------------------------------------------------------------------------
// One buffer per layer type, buffer size = 10.
// Tracks recently used template IDs to avoid repetition.
// ---------------------------------------------------------------------------

/** Injectable RNG for testability */
export type MemoryRngFn = () => number;

/** Default random: uniform [0, 1) */
const defaultMemoryRng: MemoryRngFn = () => Math.random();

/** Pick a random element from an array */
function pickRandom<T>(arr: readonly T[], rng: MemoryRngFn): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}

/**
 * Anti-repetition memory system for narrative template selection.
 * Maintains per-layer buffers of recently used template IDs.
 */
export class NarrationMemory {
  private readonly buffers: Map<string, string[]> = new Map();
  private readonly bufferSize: number;
  private readonly rng: MemoryRngFn;

  constructor(bufferSize: number = 10, rng?: MemoryRngFn) {
    this.bufferSize = bufferSize;
    this.rng = rng ?? defaultMemoryRng;
  }

  /**
   * Select a template from a pool, avoiding recently used ones.
   * Falls back to least-recently-used if all have been seen.
   *
   * @param pool - Array of candidates with `id` field
   * @param layerKey - Buffer key (e.g., 'action', 'sensory_derelict_ship')
   * @returns Selected item, or null if pool is empty
   */
  select<T extends { readonly id: string }>(pool: readonly T[], layerKey: string): T | null {
    if (pool.length === 0) return null;

    let buffer = this.buffers.get(layerKey) ?? [];

    // Cap effective buffer to min(bufferSize, 60% of pool) so ≥40% is always available
    // for random pick. This prevents cyclic repetition when pool is small (e.g., 3 snippets).
    const effectiveMax = Math.min(this.bufferSize, Math.max(1, Math.floor(pool.length * 0.6)));
    while (buffer.length > effectiveMax) {
      buffer = buffer.slice(1);
    }

    // Filter out recently used
    const available = pool.filter(t => !buffer.includes(t.id));

    let chosen: T;
    if (available.length === 0) {
      // All exhausted — pick the LEAST recently used (first in buffer = oldest)
      const lruId = buffer[0];
      chosen = pool.find(t => t.id === lruId) ?? pickRandom(pool, this.rng);
    } else {
      chosen = pickRandom(available, this.rng);
    }

    // Update buffer
    const newBuffer = [...buffer, chosen.id];
    if (newBuffer.length > effectiveMax) {
      newBuffer.shift();
    }
    this.buffers.set(layerKey, newBuffer);

    return chosen;
  }

  /**
   * Select a string from a string pool (for snippets without id field).
   * Uses the string itself as its own ID.
   */
  selectString(pool: readonly string[], layerKey: string): string | null {
    if (pool.length === 0) return null;

    const wrapped = pool.map(s => ({ id: s, text: s }));
    const result = this.select(wrapped, layerKey);
    return result?.text ?? null;
  }

  // ── Verb+Target pair tracking ──

  private readonly recentVerbTargetPairs: string[] = [];
  private readonly PAIR_MEMORY_SIZE = 5;

  /**
   * Track a (verb, target) pair. Returns true if this pair was already
   * seen recently (meaning the narration should use a "nothing new" message).
   */
  trackPair(verb: string, targetId: string): boolean {
    const pair = `${verb}:${targetId}`;
    if (this.recentVerbTargetPairs.includes(pair)) {
      return true; // Already seen recently
    }
    this.recentVerbTargetPairs.push(pair);
    if (this.recentVerbTargetPairs.length > this.PAIR_MEMORY_SIZE) {
      this.recentVerbTargetPairs.shift();
    }
    return false;
  }

  /** Reset all buffers (e.g., new game) */
  reset(): void {
    this.buffers.clear();
    this.recentVerbTargetPairs.length = 0;
  }

  /** Reset buffer for a specific layer (e.g., entering new setting) */
  resetLayer(layerKey: string): void {
    this.buffers.delete(layerKey);
  }

  /** Get buffer contents for debugging/testing */
  getBuffer(layerKey: string): readonly string[] {
    return this.buffers.get(layerKey) ?? [];
  }

  /** Get the number of tracked layers */
  get layerCount(): number {
    return this.buffers.size;
  }
}

/** Singleton narration memory instance */
export const narrationMemory = new NarrationMemory();
