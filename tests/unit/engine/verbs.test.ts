// ---------------------------------------------------------------------------
// tests/unit/engine/verbs.test.ts — Verb registry verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  VERB_IDS,
  VERB_REGISTRY,
  VERB_STATS,
  AUTO_VERBS,
  getVerbStat,
  isAutoVerb,
} from '../../../src/engine/verbs';
import type { VerbId } from '../../../src/engine/verbs';
import { buildParserLocaleData } from '../../../src/content/parserData';
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

  test('every verb has at least 2 forms in each locale', () => {
    for (const locale of ['fr', 'en'] as const) {
      const countByVerb = new Map<VerbId, number>();
      for (const [, verbId] of buildParserLocaleData(locale).verbForms) {
        countByVerb.set(verbId, (countByVerb.get(verbId) ?? 0) + 1);
      }
      for (const id of VERB_IDS) {
        expect(countByVerb.get(id) ?? 0, `${locale}: verb ${id}`).toBeGreaterThanOrEqual(2);
      }
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

  test('every verb is stat-mapped', () => {
    expect(Object.keys(VERB_STATS)).toHaveLength(VERB_IDS.length);
    for (const id of VERB_IDS) {
      expect(VERB_STATS[id], `verb ${id}`).toBeDefined();
    }
  });
});

// Audit P1-2: USE, OPEN and CLOSE were absent from VERB_STATS and silently fell
// back to FOR, making terminals and medkits Strength checks.
describe('getVerbStat', () => {
  test('USE on an electronic target is an INT check, not FOR', () => {
    expect(getVerbStat('USE', ['electronic', 'programmable'])).toBe('INT');
  });

  test('USE on an injectable medkit is an INT check', () => {
    expect(getVerbStat('USE', ['injectable', 'organic_compatible'])).toBe('INT');
  });

  test('USE on a heavy mechanical target stays a FOR check', () => {
    expect(getVerbStat('USE', ['mechanical', 'heavy'])).toBe('FOR');
  });

  test('OPEN on an electronic hatch is INT, on a blast door FOR', () => {
    expect(getVerbStat('OPEN', ['electronic', 'openable'])).toBe('INT');
    expect(getVerbStat('OPEN', ['metallic', 'openable'])).toBe('FOR');
  });

  test('falls back to the verb default with no target', () => {
    expect(getVerbStat('HACK')).toBe('INT');
    expect(getVerbStat('STRIKE')).toBe('FOR');
  });
});

describe('isAutoVerb', () => {
  test('OPEN resolves without a roll when nothing holds the target shut', () => {
    expect(isAutoVerb('OPEN', ['openable'])).toBe(true);
    expect(isAutoVerb('CLOSE', ['openable'])).toBe(true);
  });

  test('OPEN requires a roll when the target is locked, sealed or secured', () => {
    expect(isAutoVerb('OPEN', ['openable'], { lock: 'locked' })).toBe(false);
    expect(isAutoVerb('OPEN', ['openable'], { integrity: 'broken' })).toBe(false);
    expect(isAutoVerb('OPEN', ['openable', 'sealed'])).toBe(false);
    expect(isAutoVerb('OPEN', ['openable', 'secured'])).toBe(false);
  });

  test('unconditional auto verbs stay auto', () => {
    expect(isAutoVerb('TAKE', [])).toBe(true);
    expect(isAutoVerb('WAIT', [])).toBe(true);
  });

  test('rolled verbs are never auto', () => {
    expect(isAutoVerb('HACK', ['electronic'])).toBe(false);
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
