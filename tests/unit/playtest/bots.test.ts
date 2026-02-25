// ---------------------------------------------------------------------------
// tests/unit/playtest/bots.test.ts — Playtest bot unit tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { randomBot } from '../../playtest/bots/randomBot';
import { goalBot } from '../../playtest/bots/goalBot';
import { createSeededRng } from '../../playtest/bots/index';
import type { BotState, BotScene } from '../../playtest/bots/index';

// ---------------------------------------------------------------------------
// TEST HELPERS
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<BotState> = {}): BotState {
  return {
    playerHp: 10,
    playerMaxHp: 10,
    playerClassId: 'marine',
    playerLocationId: 'room_start',
    playerInventory: [],
    visitedLocationIds: ['room_start'],
    turn: 1,
    isGameOver: false,
    ...overrides,
  };
}

function makeScene(overrides: Partial<BotScene> = {}): BotScene {
  return {
    suggestions: ['examiner le terminal', 'forcer la porte', 'pirater le panneau'],
    locationItemNames: ['kit médical', 'lance-flammes'],
    locationItemIds: ['medkit', 'flamethrower'],
    npcIds: [],
    connectedLocationIds: ['room_b', 'room_c'],
    connectedLocationAliases: ['couloir nord', 'réservoir'],
    hasHealingItem: false,
    hasObstacle: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// RANDOM BOT
// ---------------------------------------------------------------------------

describe('randomBot', () => {
  it('always returns a non-empty string', () => {
    const rng = createSeededRng(42);
    const state = makeState();
    const scene = makeScene();
    for (let i = 0; i < 50; i++) {
      const decision = randomBot.makeDecision(state, scene, rng);
      expect(typeof decision).toBe('string');
      expect(decision.length).toBeGreaterThan(0);
    }
  });

  it('uses suggestions when available', () => {
    // Force rng to always return < 0.60 (picks suggestion)
    const forcedRng = {
      float: () => 0.1,
      pick: <T>(arr: readonly T[]) => arr[0]!,
    };
    const state = makeState();
    const scene = makeScene({ suggestions: ['forcer la porte'] });
    const decision = randomBot.makeDecision(state, scene, forcedRng);
    expect(decision).toBe('forcer la porte');
  });

  it('falls back to fuzz when no suggestions or targets', () => {
    // Force rng to always return > 0.90 (fuzz path)
    const forcedRng = {
      float: () => 0.95,
      pick: <T>(arr: readonly T[]) => arr[0]!,
    };
    const state = makeState();
    const emptyScene = makeScene({
      suggestions: [],
      locationItemNames: [],
      connectedLocationAliases: [],
    });
    const decision = randomBot.makeDecision(state, emptyScene, forcedRng);
    expect(typeof decision).toBe('string');
    expect(decision.length).toBeGreaterThan(0);
  });

  it('produces decisions for 100 seeds without throwing', () => {
    const state = makeState();
    const scene = makeScene();
    for (let i = 0; i < 100; i++) {
      const rng = createSeededRng(i);
      expect(() => randomBot.makeDecision(state, scene, rng)).not.toThrow();
    }
  });

  it('handles empty scene gracefully', () => {
    const emptyScene = makeScene({
      suggestions: [],
      locationItemNames: [],
      locationItemIds: [],
      connectedLocationAliases: [],
    });
    const rng = createSeededRng(999);
    const result = randomBot.makeDecision(makeState(), emptyScene, rng);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// GOAL BOT
// ---------------------------------------------------------------------------

describe('goalBot', () => {
  it('always returns a non-empty string', () => {
    const rng = createSeededRng(42);
    for (let i = 0; i < 50; i++) {
      const decision = goalBot.makeDecision(makeState(), makeScene(), rng);
      expect(typeof decision).toBe('string');
      expect(decision.length).toBeGreaterThan(0);
    }
  });

  it('priority 1: uses healing item when HP is critically low', () => {
    const rng = createSeededRng(42);
    const state = makeState({ playerHp: 2, playerMaxHp: 10 }); // 20% < 30%
    const scene = makeScene({ hasHealingItem: true });
    const decision = goalBot.makeDecision(state, scene, rng);
    expect(decision).toContain('kit médical');
  });

  it('does NOT prioritize healing when HP is fine', () => {
    const rng = createSeededRng(42);
    const state = makeState({ playerHp: 8, playerMaxHp: 10 }); // 80% >= 30%
    const scene = makeScene({ hasHealingItem: true, locationItemNames: ['objet'] });
    const decision = goalBot.makeDecision(state, scene, rng);
    // Should pick up item instead of healing
    expect(decision).toContain('prendre');
  });

  it('priority 2: picks up visible items', () => {
    const rng = createSeededRng(42);
    const state = makeState({ playerHp: 10, playerMaxHp: 10 });
    const scene = makeScene({
      hasHealingItem: false,
      locationItemNames: ['trousseau de clés'],
      suggestions: [],
    });
    const decision = goalBot.makeDecision(state, scene, rng);
    expect(decision).toContain('prendre');
    expect(decision).toContain('trousseau');
  });

  it('priority 3: uses suggestions when no items to pick up', () => {
    const rng = createSeededRng(42);
    const state = makeState();
    const scene = makeScene({
      locationItemNames: [],
      locationItemIds: [],
      suggestions: ['examiner le terminal'],
    });
    const decision = goalBot.makeDecision(state, scene, rng);
    expect(decision).toBe('examiner le terminal');
  });

  it('priority 4: explores unexplored locations', () => {
    const rng = createSeededRng(42);
    const state = makeState({
      visitedLocationIds: ['room_start'],
    });
    const scene = makeScene({
      locationItemNames: [],
      locationItemIds: [],
      suggestions: [],
      connectedLocationIds: ['room_b'],
      connectedLocationAliases: ['couloir nord'],
    });
    const decision = goalBot.makeDecision(state, scene, rng);
    expect(decision).toContain('aller');
  });

  it('falls back to examining surroundings when completely stuck', () => {
    const rng = createSeededRng(42);
    const state = makeState();
    const scene = makeScene({
      suggestions: [],
      locationItemNames: [],
      locationItemIds: [],
      connectedLocationIds: [],
      connectedLocationAliases: [],
      hasHealingItem: false,
    });
    const decision = goalBot.makeDecision(state, scene, rng);
    expect(decision).toBe('regarder autour');
  });

  it('produces decisions for 100 seeds without throwing', () => {
    const state = makeState();
    const scene = makeScene();
    for (let i = 0; i < 100; i++) {
      const rng = createSeededRng(i);
      expect(() => goalBot.makeDecision(state, scene, rng)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// createSeededRng
// ---------------------------------------------------------------------------

describe('createSeededRng', () => {
  it('returns values in [0, 1)', () => {
    const rng = createSeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('same seed produces same sequence', () => {
    const rng1 = createSeededRng(123);
    const rng2 = createSeededRng(123);
    for (let i = 0; i < 10; i++) {
      expect(rng1.float()).toBe(rng2.float());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createSeededRng(1);
    const rng2 = createSeededRng(2);
    const seq1 = Array.from({ length: 5 }, () => rng1.float());
    const seq2 = Array.from({ length: 5 }, () => rng2.float());
    expect(seq1).not.toEqual(seq2);
  });

  it('pick returns an element from the array', () => {
    const rng = createSeededRng(42);
    const arr = ['a', 'b', 'c', 'd'] as const;
    for (let i = 0; i < 20; i++) {
      const result = rng.pick(arr);
      expect(arr).toContain(result);
    }
  });
});
