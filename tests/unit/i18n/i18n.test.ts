// ---------------------------------------------------------------------------
// tests/unit/i18n/i18n.test.ts — i18n system verification
// ---------------------------------------------------------------------------

import { describe, test, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale, resetLocale } from '../../../src/i18n';
import type { StringKey } from '../../../src/i18n';

beforeEach(() => {
  resetLocale();
});

describe('t() function', () => {
  test('returns French by default', () => {
    expect(t('ui.play')).toBe('Jouer');
  });

  test('returns French for all stat names', () => {
    expect(t('stat.FOR')).toBe('Force');
    expect(t('stat.AGI')).toBe('Agilité');
    expect(t('stat.INT')).toBe('Intelligence');
    expect(t('stat.PER')).toBe('Perception');
    expect(t('stat.CHA')).toBe('Charisme');
    expect(t('stat.LCK')).toBe('Chance');
  });

  test('returns English when locale override is passed', () => {
    expect(t('ui.play', 'en')).toBe('Play');
    expect(t('stat.FOR', 'en')).toBe('Strength');
    expect(t('stat.LCK', 'en')).toBe('Luck');
  });

  test('returns French class names', () => {
    expect(t('class.marine')).toBe('Marine');
    expect(t('class.engineer')).toBe('Ingénieur');
    expect(t('class.medic')).toBe('Médecin');
  });

  test('returns French difficulty names', () => {
    expect(t('difficulty.explorer')).toBe('Explorateur');
    expect(t('difficulty.survivor')).toBe('Survivant');
    expect(t('difficulty.nightmare')).toBe('Cauchemar');
  });

  test('returns French UI strings', () => {
    expect(t('ui.newGame')).toBe('Nouvelle partie');
    expect(t('ui.settings')).toBe('Paramètres');
    expect(t('ui.loading')).toBe('Chargement...');
  });

  test('returns French game strings', () => {
    expect(t('game.hp')).toBe('PV');
    expect(t('game.oxygen')).toBe('Oxygène');
    expect(t('game.critical')).toBe('Critique !');
  });
});

describe('setLocale / getLocale', () => {
  test('default locale is fr', () => {
    expect(getLocale()).toBe('fr');
  });

  test('setLocale switches active locale', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('ui.play')).toBe('Play');
  });

  test('setLocale back to fr restores French', () => {
    setLocale('en');
    setLocale('fr');
    expect(t('ui.play')).toBe('Jouer');
  });

  test('resetLocale restores default', () => {
    setLocale('en');
    resetLocale();
    expect(getLocale()).toBe('fr');
    expect(t('ui.play')).toBe('Jouer');
  });
});

describe('locale consistency', () => {
  test('all keys used in French locale are also in English', () => {
    // This test ensures both locales have the same keys
    // by checking a representative sample
    const keys: StringKey[] = [
      'ui.play', 'ui.newGame', 'ui.settings',
      'stat.FOR', 'stat.AGI', 'stat.INT', 'stat.PER', 'stat.CHA', 'stat.LCK',
      'class.marine', 'class.engineer', 'class.medic',
      'difficulty.explorer', 'difficulty.survivor', 'difficulty.nightmare',
      'game.hp', 'game.oxygen', 'game.success', 'game.failure',
    ];

    for (const key of keys) {
      const fr = t(key, 'fr');
      const en = t(key, 'en');
      // Both should return a non-empty string that is not the key itself
      expect(fr).not.toBe('');
      expect(en).not.toBe('');
      expect(fr).not.toBe(key);
      expect(en).not.toBe(key);
    }
  });
});
