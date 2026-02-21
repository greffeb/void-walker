// ---------------------------------------------------------------------------
// tests/unit/content/classes.test.ts — Class definitions verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { CLASSES, CLASS_LIST } from '../../../src/content/classes';
import { STAT_IDS, PLAYER_CLASS_NAMES } from '../../../src/engine/types';
import { BALANCE } from '../../../src/engine/constants';

describe('CLASSES', () => {
  test('has exactly 3 classes', () => {
    expect(Object.keys(CLASSES)).toHaveLength(3);
  });

  test('CLASS_LIST has 3 entries matching CLASSES', () => {
    expect(CLASS_LIST).toHaveLength(3);
    for (const cls of CLASS_LIST) {
      expect(CLASSES[cls.id]).toBe(cls);
    }
  });

  test('every class id matches PLAYER_CLASS_NAMES', () => {
    for (const name of PLAYER_CLASS_NAMES) {
      expect(CLASSES[name]).toBeDefined();
    }
  });

  test('every class base stats sum to TOTAL_CLASS_POINTS (18)', () => {
    for (const name of PLAYER_CLASS_NAMES) {
      const cls = CLASSES[name];
      const total = STAT_IDS.reduce((sum, stat) => sum + cls.baseStats[stat], 0);
      expect(total).toBe(BALANCE.TOTAL_CLASS_POINTS);
    }
  });

  test('no stat exceeds STAT_MAX (5)', () => {
    for (const name of PLAYER_CLASS_NAMES) {
      const cls = CLASSES[name];
      for (const stat of STAT_IDS) {
        expect(cls.baseStats[stat]).toBeLessThanOrEqual(BALANCE.STAT_MAX);
        expect(cls.baseStats[stat]).toBeGreaterThanOrEqual(BALANCE.STAT_MIN);
      }
    }
  });

  test('marine has HP 14', () => {
    expect(CLASSES.marine.startingHp).toBe(14);
  });

  test('engineer has HP 10', () => {
    expect(CLASSES.engineer.startingHp).toBe(10);
  });

  test('medic has HP 12', () => {
    expect(CLASSES.medic.startingHp).toBe(12);
  });

  test('every class has valid nameKey, descriptionKey, flavorKey', () => {
    for (const name of PLAYER_CLASS_NAMES) {
      const cls = CLASSES[name];
      expect(cls.nameKey).toBe(`class.${name}`);
      expect(cls.descriptionKey).toBe(`class.${name}.description`);
      expect(cls.flavorKey).toBe(`class.${name}.flavor`);
    }
  });

  test('every class has a passive ability with valid fields', () => {
    for (const name of PLAYER_CLASS_NAMES) {
      const cls = CLASSES[name];
      expect(typeof cls.passiveAbility.id).toBe('string');
      expect(typeof cls.passiveAbility.nameKey).toBe('string');
      expect(typeof cls.passiveAbility.effect).toBe('string');
    }
  });

  test('every class has starting items', () => {
    for (const name of PLAYER_CLASS_NAMES) {
      const cls = CLASSES[name];
      expect(cls.startingItems.length).toBeGreaterThanOrEqual(2);
    }
  });
});
