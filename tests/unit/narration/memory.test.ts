// ---------------------------------------------------------------------------
// tests/unit/narration/memory.test.ts — NarrationMemory anti-repetition tests
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { NarrationMemory } from '../../../src/narration/memory';

describe('NarrationMemory', () => {
  let mem: NarrationMemory;
  const pool = [
    { id: 'a', text: 'Alpha' },
    { id: 'b', text: 'Beta' },
    { id: 'c', text: 'Gamma' },
    { id: 'd', text: 'Delta' },
    { id: 'e', text: 'Epsilon' },
  ];

  // Deterministic RNG: returns values from 0, 0.01, 0.02, ...
  let rngCounter: number;
  function deterministicRng(): number {
    return (rngCounter++ % 100) / 100;
  }

  beforeEach(() => {
    rngCounter = 0;
    mem = new NarrationMemory(3, deterministicRng); // buffer size 3
  });

  describe('select', () => {
    it('returns null for empty pool', () => {
      expect(mem.select([], 'test')).toBeNull();
    });

    it('returns an item from the pool', () => {
      const result = mem.select(pool, 'test');
      expect(result).not.toBeNull();
      expect(pool.some(p => p.id === result!.id)).toBe(true);
    });

    it('tracks selected items in buffer', () => {
      mem.select(pool, 'test');
      expect(mem.getBuffer('test').length).toBe(1);
    });

    it('avoids recently used items', () => {
      // Select 3 items (buffer size = 3)
      const seen = new Set<string>();
      for (let i = 0; i < 3; i++) {
        const result = mem.select(pool, 'test');
        expect(result).not.toBeNull();
        seen.add(result!.id);
      }
      // All 3 should be different
      expect(seen.size).toBe(3);
    });

    it('when buffer is full, evicts oldest items', () => {
      // Fill the buffer (size 3)
      for (let i = 0; i < 3; i++) {
        mem.select(pool, 'test');
      }
      expect(mem.getBuffer('test').length).toBe(3);

      // Select again — buffer should still be size 3
      mem.select(pool, 'test');
      expect(mem.getBuffer('test').length).toBe(3);
    });

    it('uses LRU fallback when all items are in buffer', () => {
      // Pool of 3 items, buffer of 3
      const smallPool = [pool[0], pool[1], pool[2]];
      for (let i = 0; i < 3; i++) {
        mem.select(smallPool, 'test');
      }
      // All 3 are now in buffer
      expect(mem.getBuffer('test').length).toBe(3);

      // Next select should return the LRU item (first in buffer)
      const lruId = mem.getBuffer('test')[0];
      const result = mem.select(smallPool, 'test');
      expect(result).not.toBeNull();
      expect(result!.id).toBe(lruId);
    });

    it('maintains separate buffers for different layer keys', () => {
      mem.select(pool, 'layer_a');
      mem.select(pool, 'layer_b');
      expect(mem.getBuffer('layer_a').length).toBe(1);
      expect(mem.getBuffer('layer_b').length).toBe(1);
    });
  });

  describe('selectString', () => {
    const strings = ['alpha', 'beta', 'gamma', 'delta'];

    it('returns null for empty pool', () => {
      expect(mem.selectString([], 'test')).toBeNull();
    });

    it('returns a string from the pool', () => {
      const result = mem.selectString(strings, 'test');
      expect(result).not.toBeNull();
      expect(strings).toContain(result);
    });
  });

  describe('reset', () => {
    it('clears all buffers', () => {
      mem.select(pool, 'layer_a');
      mem.select(pool, 'layer_b');
      mem.reset();
      expect(mem.getBuffer('layer_a')).toEqual([]);
      expect(mem.getBuffer('layer_b')).toEqual([]);
      expect(mem.layerCount).toBe(0);
    });
  });

  describe('resetLayer', () => {
    it('clears only the specified layer', () => {
      mem.select(pool, 'layer_a');
      mem.select(pool, 'layer_b');
      mem.resetLayer('layer_a');
      expect(mem.getBuffer('layer_a')).toEqual([]);
      expect(mem.getBuffer('layer_b').length).toBe(1);
    });
  });

  describe('injectable RNG', () => {
    it('always picks first item with rng returning 0', () => {
      const zeroRng = () => 0;
      const mem0 = new NarrationMemory(10, zeroRng);

      // First call with rng=0 should pick arr[floor(0 * length)] = arr[0]
      const result = mem0.select(pool, 'test');
      expect(result!.id).toBe('a');
    });

    it('picks different items with different RNG values', () => {
      const highRng = () => 0.99;
      const memHigh = new NarrationMemory(10, highRng);

      const result = memHigh.select(pool, 'test');
      // floor(0.99 * 5) = 4 → 'e'
      expect(result!.id).toBe('e');
    });
  });

  describe('10-use anti-repetition guarantee', () => {
    it('does not repeat within buffer size window', () => {
      const bufferSize = 10;
      const largePool = Array.from({ length: 20 }, (_, i) => ({
        id: `item_${i}`,
        text: `Text ${i}`,
      }));

      let counter = 0;
      const seqRng = () => (counter++ * 7 % 100) / 100; // varied RNG
      const largeMem = new NarrationMemory(bufferSize, seqRng);

      const results: string[] = [];
      for (let i = 0; i < bufferSize; i++) {
        const r = largeMem.select(largePool, 'test');
        results.push(r!.id);
      }

      // Check no duplicates within the first bufferSize selections
      const unique = new Set(results);
      expect(unique.size).toBe(bufferSize);
    });
  });
});
