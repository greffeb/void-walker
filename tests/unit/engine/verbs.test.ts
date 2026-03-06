// ---------------------------------------------------------------------------
// tests/unit/engine/verbs.test.ts — Verb registry verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  VERB_IDS,
  VERB_REGISTRY,
  VERB_STATS,
  AUTO_VERBS,
} from '../../../src/engine/verbs';
import type { VerbId } from '../../../src/engine/verbs';
import { STAT_IDS } from '../../../src/engine/types';

describe('VerbId', () => {
  test('has exactly 78 verbs', () => {
    expect(VERB_IDS).toHaveLength(78);
  });

  test('all verb IDs are uppercase strings', () => {
    for (const id of VERB_IDS) {
      expect(id).toBe(id.toUpperCase());
    }
  });

  test('no duplicate verb ids', () => {
    const unique = new Set(VERB_IDS);
    expect(unique.size).toBe(VERB_IDS.length);
  });
});

describe('VERB_REGISTRY', () => {
  test('every verb has a registry entry', () => {
    for (const id of VERB_IDS) {
      expect(VERB_REGISTRY[id]).toBeDefined();
    }
  });

  test('every verb has at least 2 FR aliases', () => {
    for (const id of VERB_IDS) {
      const entry = VERB_REGISTRY[id];
      expect(entry).toBeDefined();
      if (!entry) return;
      expect(entry.aliases.fr.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('every verb has at least 2 EN aliases', () => {
    for (const id of VERB_IDS) {
      const entry = VERB_REGISTRY[id];
      expect(entry).toBeDefined();
      if (!entry) return;
      expect(entry.aliases.en.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('every verb has a nameKey and descriptionKey', () => {
    for (const id of VERB_IDS) {
      const entry = VERB_REGISTRY[id];
      if (!entry) return;
      expect(typeof entry.nameKey).toBe('string');
      expect(typeof entry.descriptionKey).toBe('string');
      expect(entry.nameKey).toBe(`verb.${id}`);
      expect(entry.descriptionKey).toBe(`verb.${id}.description`);
    }
  });

  test('every verb has a numeric difficultyMod', () => {
    for (const id of VERB_IDS) {
      const entry = VERB_REGISTRY[id];
      if (!entry) return;
      expect(typeof entry.difficultyMod).toBe('number');
    }
  });
});

describe('VERB_STATS', () => {
  test('STRIKE maps to FOR', () => {
    expect(VERB_STATS.STRIKE).toBe('FOR');
  });

  test('SHOOT maps to AGI', () => {
    expect(VERB_STATS.SHOOT).toBe('AGI');
  });

  test('HACK maps to INT', () => {
    expect(VERB_STATS.HACK).toBe('INT');
  });

  test('BLOCK maps to DEF', () => {
    expect(VERB_STATS.BLOCK).toBe('DEF');
  });

  test('PERSUADE maps to CHA', () => {
    expect(VERB_STATS.PERSUADE).toBe('CHA');
  });

  test('EXAMINE maps to PER', () => {
    expect(VERB_STATS.EXAMINE).toBe('PER');
  });

  test('all VERB_STATS values are valid StatIds', () => {
    const validStats = new Set(STAT_IDS);
    for (const [, statId] of Object.entries(VERB_STATS)) {
      expect(validStats.has(statId)).toBe(true);
    }
  });

  test('has exactly 66 stat-mapped verbs', () => {
    expect(Object.keys(VERB_STATS)).toHaveLength(66);
  });
});

describe('AUTO_VERBS', () => {
  test('TAKE is auto', () => {
    expect(AUTO_VERBS.has('TAKE')).toBe(true);
  });

  test('DROP is auto', () => {
    expect(AUTO_VERBS.has('DROP')).toBe(true);
  });

  test('WAIT is auto', () => {
    expect(AUTO_VERBS.has('WAIT')).toBe(true);
  });

  test('EQUIP is auto', () => {
    expect(AUTO_VERBS.has('EQUIP')).toBe(true);
  });

  test('STRIKE is not auto', () => {
    expect(AUTO_VERBS.has('STRIKE')).toBe(false);
  });

  test('HACK is not auto', () => {
    expect(AUTO_VERBS.has('HACK')).toBe(false);
  });

  test('has exactly 9 auto verbs', () => {
    // TAKE, DROP, GIVE, EQUIP, EAT, DRINK, MOVE_TO, WAIT, TOUCH
    // USE, OPEN, CLOSE are interaction verbs but can require rolls
    const autoCount = VERB_IDS.filter((id: VerbId) => AUTO_VERBS.has(id)).length;
    expect(autoCount).toBe(9);
  });
});
