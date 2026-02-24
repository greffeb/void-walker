// ---------------------------------------------------------------------------
// tests/unit/engine/types.test.ts — Core type and constant verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  STAT_IDS,
  PLAYER_CLASS_NAMES,
  DIFFICULTY_LEVELS,
  createInitialGameState,
  validateAllocation,
  createCharacterCreationState,
} from '../../../src/engine/types';
import type {
  StatId,
  PlayerClassName,
  DifficultyLevel,
  GameState,
  StatBlock,
} from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';

describe('StatId', () => {
  test('has exactly 7 stats', () => {
    expect(STAT_IDS).toHaveLength(7);
  });

  test('contains FOR, DEF, AGI, INT, PER, CHA, LCK', () => {
    const expected: StatId[] = ['FOR', 'DEF', 'AGI', 'INT', 'PER', 'CHA', 'LCK'];
    expect([...STAT_IDS]).toEqual(expected);
  });

  test('stat block can be created with all stat IDs', () => {
    const stats: StatBlock = {
      FOR: 3, DEF: 2, AGI: 2, INT: 4, PER: 1, CHA: 3, LCK: 2,
    };
    for (const id of STAT_IDS) {
      expect(stats[id]).toBeGreaterThanOrEqual(0);
      expect(stats[id]).toBeLessThanOrEqual(5);
    }
  });
});

describe('PlayerClassName', () => {
  test('has exactly 3 classes', () => {
    expect(PLAYER_CLASS_NAMES).toHaveLength(3);
  });

  test('contains marine, engineer, medic', () => {
    const expected: PlayerClassName[] = ['marine', 'engineer', 'medic'];
    expect([...PLAYER_CLASS_NAMES]).toEqual(expected);
  });
});

describe('DifficultyLevel', () => {
  test('has exactly 3 difficulty levels', () => {
    expect(DIFFICULTY_LEVELS).toHaveLength(3);
  });

  test('contains explorer, survivor, nightmare', () => {
    const expected: DifficultyLevel[] = ['explorer', 'survivor', 'nightmare'];
    expect([...DIFFICULTY_LEVELS]).toEqual(expected);
  });
});

describe('GameState', () => {
  test('createInitialGameState returns valid game state', () => {
    const state: GameState = createInitialGameState();

    expect(state.phase).toBe('title');
    expect(state.difficulty).toBe('survivor');
    expect(state.character).toBeNull();
    expect(state.turn).toBe(0);
    expect(state.scenarioId).toBeNull();
    expect(state.currentBeat).toBe('intro');
    expect(state.stalkerClockState.actionsSinceLastProgression).toBe(0);
    expect(state.stalkerClockState.warningIssued).toBe(false);
    expect(state.stalkerClockState.threatArrivalIssued).toBe(false);
    expect(state.sceneCount).toBe(0);
    expect(state.log).toEqual([]);
    expect(state.shipMemory).toEqual([]);
    expect(state.obstacleAttempts).toEqual({});
    expect(state.secondChanceUsed).toBe(false);
    expect(state.activeCombat).toBeNull();
  });

  test('initial game state is a fresh object each call', () => {
    const state1 = createInitialGameState();
    const state2 = createInitialGameState();
    expect(state1).not.toBe(state2);
    expect(state1).toEqual(state2);
  });
});

describe('BALANCE constants', () => {
  test('difficulty range is valid', () => {
    expect(BALANCE.MIN_DIFFICULTY).toBeLessThan(BALANCE.MAX_DIFFICULTY);
    expect(BALANCE.BASE_DIFFICULTY).toBeGreaterThanOrEqual(BALANCE.MIN_DIFFICULTY);
    expect(BALANCE.BASE_DIFFICULTY).toBeLessThanOrEqual(BALANCE.MAX_DIFFICULTY);
    expect(BALANCE.ABSURD_DIFFICULTY_FLOOR).toBeLessThanOrEqual(BALANCE.MAX_DIFFICULTY);
  });

  test('stat range is valid', () => {
    expect(BALANCE.STAT_MIN).toBe(0);
    expect(BALANCE.STAT_MAX).toBe(5);
    expect(BALANCE.BONUS_POINTS).toBe(2);
    expect(BALANCE.TOTAL_CLASS_POINTS).toBe(18);
  });

  test('inventory slots are defined', () => {
    expect(BALANCE.INVENTORY_SLOTS).toBe(8);
  });

  test('combat constants are present', () => {
    expect(BALANCE.COMBAT.UNARMED_BASE_DAMAGE).toBe(1);
    expect(BALANCE.COMBAT.CRITICAL_HIT_MULTIPLIER).toBe(1.5);
    expect(BALANCE.COMBAT.ENVIRONMENTAL_KILL_MULTIPLIER).toBe(10);
  });

  test('stalker clock thresholds increase with difficulty', () => {
    expect(BALANCE.STALKER_CLOCK.WARNING.nightmare)
      .toBeLessThan(BALANCE.STALKER_CLOCK.WARNING.survivor);
    expect(BALANCE.STALKER_CLOCK.WARNING.survivor)
      .toBeLessThan(BALANCE.STALKER_CLOCK.WARNING.explorer);
  });

  test('oxygen values are defined', () => {
    expect(BALANCE.OXYGEN.MAX).toBe(100);
    expect(BALANCE.OXYGEN.DRAIN_PRESSURIZED).toBe(0);
    expect(BALANCE.OXYGEN.HP_DRAIN_AT_ZERO).toBeGreaterThan(0);
  });

  test('pacing beats sum to approximately 1.0', () => {
    const total =
      BALANCE.BEAT_INTRO +
      BALANCE.BEAT_RISING +
      BALANCE.BEAT_MIDPOINT +
      BALANCE.BEAT_ESCALATION +
      BALANCE.BEAT_CLIMAX +
      BALANCE.BEAT_RESOLUTION;
    expect(total).toBeCloseTo(1.0, 2);
  });

  test('save constants are defined', () => {
    expect(BALANCE.SAVE.SLOT_COUNT).toBe(3);
    expect(BALANCE.SAVE.AUTO_SAVE_INTERVAL_MS).toBe(30_000);
    expect(BALANCE.SAVE.BLACK_BOX_MAX_ENTRIES).toBe(20);
  });
});

describe('validateAllocation()', () => {
  const baseStats: StatBlock = {
    FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 3,
  };

  test('valid allocation of 2 points returns true', () => {
    expect(validateAllocation(baseStats, { LCK: 1, CHA: 1 })).toBe(true);
  });

  test('over-allocation returns false', () => {
    expect(validateAllocation(baseStats, { LCK: 3 })).toBe(false);
  });

  test('under-allocation returns false', () => {
    expect(validateAllocation(baseStats, { LCK: 1 })).toBe(false);
  });

  test('negative bonus returns false', () => {
    expect(validateAllocation(baseStats, { LCK: 3, FOR: -1 })).toBe(false);
  });

  test('would exceed stat max returns false', () => {
    // FOR is already 4, +2 would be 6 > 5
    expect(validateAllocation(baseStats, { FOR: 2 })).toBe(false);
  });

  test('exactly at max is valid', () => {
    // FOR is 4, +1 = 5 which equals STAT_MAX
    expect(validateAllocation(baseStats, { FOR: 1, CHA: 1 })).toBe(true);
  });

  test('empty allocation returns false (must allocate all points)', () => {
    expect(validateAllocation(baseStats, {})).toBe(false);
  });
});

describe('createCharacterCreationState()', () => {
  test('returns correct initial state', () => {
    const state = createCharacterCreationState();
    expect(state.selectedClass).toBeNull();
    expect(state.bonusPointsRemaining).toBe(BALANCE.BONUS_POINTS);
    expect(state.bonusAllocation).toEqual({});
  });
});
