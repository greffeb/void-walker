// ---------------------------------------------------------------------------
// tests/unit/engine/suggestions.test.ts — Suggestion generation tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  scoreCandidate,
  generateSuggestions,
  selectTop3WithVariety,
  isExcludedFromSuggestions,
  CLASS_PRIMARY_STATS,
  CLASS_STAT_BONUS,
  SKIN_PRIORITY_BONUS,
  MAX_PER_CATEGORY,
  SUGGESTION_EXCLUDED_VERB_IDS,
} from '../../../src/engine/suggestions';
import type { SuggestionCandidate } from '../../../src/engine/suggestions';
import type { NarrativeSkin } from '../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// TEST HELPERS
// ---------------------------------------------------------------------------

function makeCandidate(
  overrides: Partial<Omit<SuggestionCandidate, 'score'>> = {},
): Omit<SuggestionCandidate, 'score'> {
  return {
    verbText: 'examiner',
    targetText: 'le terminal',
    stat: 'INT',
    category: 'obstacle',
    ...overrides,
  };
}

function makeSkin(priority: ('FOR' | 'DEF' | 'AGI' | 'INT' | 'PER' | 'CHA' | 'LCK')[]): NarrativeSkin {
  return {
    tension: 'mid',
    entryDescription: { fr: '', en: '' },
    revisitDescription: { fr: '', en: '' },
    obstacleDescription: { fr: '', en: '' },
    dcModifier: 1,
    suggestedPathPriority: priority,
    ambientSnippets: [],
  };
}

// ---------------------------------------------------------------------------
// isExcludedFromSuggestions
// ---------------------------------------------------------------------------

describe('isExcludedFromSuggestions', () => {
  it('returns true for WAIT (Easter-egg verb)', () => {
    expect(isExcludedFromSuggestions('WAIT')).toBe(true);
  });

  it('returns true for SACRIFICE (special verb)', () => {
    expect(isExcludedFromSuggestions('SACRIFICE')).toBe(true);
  });

  it('returns false for normal verbs', () => {
    expect(isExcludedFromSuggestions('HACK')).toBe(false);
    expect(isExcludedFromSuggestions('STRIKE')).toBe(false);
    expect(isExcludedFromSuggestions('TALK')).toBe(false);
  });

  it('has exactly 3 excluded verbs', () => {
    expect(SUGGESTION_EXCLUDED_VERB_IDS.size).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// CLASS_PRIMARY_STATS
// ---------------------------------------------------------------------------

describe('CLASS_PRIMARY_STATS', () => {
  it('marine primary stats are FOR and DEF', () => {
    expect(CLASS_PRIMARY_STATS.marine).toContain('FOR');
    expect(CLASS_PRIMARY_STATS.marine).toContain('DEF');
  });

  it('engineer primary stats are INT and AGI', () => {
    expect(CLASS_PRIMARY_STATS.engineer).toContain('INT');
    expect(CLASS_PRIMARY_STATS.engineer).toContain('AGI');
  });

  it('medic primary stats are CHA and INT', () => {
    expect(CLASS_PRIMARY_STATS.medic).toContain('CHA');
    expect(CLASS_PRIMARY_STATS.medic).toContain('INT');
  });
});

// ---------------------------------------------------------------------------
// scoreCandidate
// ---------------------------------------------------------------------------

describe('scoreCandidate', () => {
  it('obstacle category has highest base score', () => {
    const obstacleScore = scoreCandidate(makeCandidate({ category: 'obstacle', stat: 'PER' }), 'marine', null);
    const envScore = scoreCandidate(makeCandidate({ category: 'environment', stat: 'PER' }), 'marine', null);
    expect(obstacleScore).toBeGreaterThan(envScore);
  });

  it('class stat bonus adds CLASS_STAT_BONUS when stat matches', () => {
    const baseScore = scoreCandidate(makeCandidate({ category: 'obstacle', stat: 'PER' }), 'marine', null);
    const bonusScore = scoreCandidate(makeCandidate({ category: 'obstacle', stat: 'FOR' }), 'marine', null);
    expect(bonusScore - baseScore).toBe(CLASS_STAT_BONUS);
  });

  it('skin priority bonus adds SKIN_PRIORITY_BONUS when stat in priority list', () => {
    const skin = makeSkin(['INT']);
    const withSkin = scoreCandidate(makeCandidate({ stat: 'INT', category: 'obstacle' }), 'marine', skin);
    const withoutSkin = scoreCandidate(makeCandidate({ stat: 'INT', category: 'obstacle' }), 'marine', null);
    expect(withSkin - withoutSkin).toBe(SKIN_PRIORITY_BONUS);
  });

  it('no skin bonus when stat not in priority list', () => {
    const skin = makeSkin(['FOR', 'AGI']);
    const withSkin = scoreCandidate(makeCandidate({ stat: 'INT', category: 'obstacle' }), 'marine', skin);
    const withoutSkin = scoreCandidate(makeCandidate({ stat: 'INT', category: 'obstacle' }), 'marine', null);
    expect(withSkin).toBe(withoutSkin);
  });

  it('null skin is handled safely', () => {
    expect(() => scoreCandidate(makeCandidate(), 'engineer', null)).not.toThrow();
  });

  it('both bonuses stack', () => {
    // engineer primary: INT, AGI. Skin priority: INT
    const skin = makeSkin(['INT']);
    const score = scoreCandidate(makeCandidate({ stat: 'INT', category: 'obstacle' }), 'engineer', skin);
    const base = scoreCandidate(makeCandidate({ stat: 'PER', category: 'obstacle' }), 'engineer', null);
    expect(score - base).toBe(CLASS_STAT_BONUS + SKIN_PRIORITY_BONUS);
  });
});

// ---------------------------------------------------------------------------
// selectTop3WithVariety
// ---------------------------------------------------------------------------

describe('selectTop3WithVariety', () => {
  it('returns all candidates if 3 or fewer', () => {
    const candidates: SuggestionCandidate[] = [
      { ...makeCandidate(), score: 5 },
      { ...makeCandidate(), score: 3 },
    ];
    expect(selectTop3WithVariety(candidates)).toHaveLength(2);
  });

  it('returns exactly 3 when more available', () => {
    const candidates: SuggestionCandidate[] = Array.from({ length: 6 }, (_, i) => ({
      ...makeCandidate({ category: 'obstacle' }),
      score: 6 - i,
    }));
    expect(selectTop3WithVariety(candidates)).toHaveLength(3);
  });

  it('prioritizes higher scores', () => {
    const candidates: SuggestionCandidate[] = [
      { ...makeCandidate({ category: 'obstacle' }), score: 10 },
      { ...makeCandidate({ category: 'item' }), score: 8 },
      { ...makeCandidate({ category: 'movement' }), score: 6 },
      { ...makeCandidate({ category: 'environment' }), score: 2 },
    ];
    const selected = selectTop3WithVariety(candidates);
    expect(selected).toHaveLength(3);
    const scores = selected.map(s => s.score);
    expect(scores).toContain(10);
    expect(scores).toContain(8);
    expect(scores).toContain(6);
    expect(scores).not.toContain(2);
  });

  it('limits same category to MAX_PER_CATEGORY', () => {
    const candidates: SuggestionCandidate[] = [
      { ...makeCandidate({ category: 'obstacle' }), score: 10 },
      { ...makeCandidate({ category: 'obstacle' }), score: 9 },
      { ...makeCandidate({ category: 'obstacle' }), score: 8 },
      { ...makeCandidate({ category: 'item' }), score: 5 },
    ];
    const selected = selectTop3WithVariety(candidates);
    const obstacleCount = selected.filter(s => s.category === 'obstacle').length;
    expect(obstacleCount).toBeLessThanOrEqual(MAX_PER_CATEGORY);
  });

  it('fills to 3 even if variety is exhausted', () => {
    // Only obstacle candidates available
    const candidates: SuggestionCandidate[] = Array.from({ length: 5 }, (_, i) => ({
      ...makeCandidate({ category: 'obstacle' }),
      score: 5 - i,
    }));
    const selected = selectTop3WithVariety(candidates);
    expect(selected).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// generateSuggestions — integration
// ---------------------------------------------------------------------------

describe('generateSuggestions', () => {
  it('returns at most 3 suggestions', () => {
    const candidates = Array.from({ length: 10 }, (_, i) => ({
      ...makeCandidate({ category: i % 2 === 0 ? 'obstacle' : 'item' }),
    }));
    const result = generateSuggestions(candidates, 'engineer', null);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('returns fewer than 3 when not enough candidates', () => {
    const result = generateSuggestions(
      [makeCandidate(), makeCandidate({ verbText: 'réparer' })],
      'marine',
      null,
    );
    expect(result).toHaveLength(2);
  });

  it('applies class bias — marine favors FOR', () => {
    const candidates = [
      makeCandidate({ stat: 'FOR', category: 'obstacle', verbText: 'forcer' }),
      makeCandidate({ stat: 'INT', category: 'obstacle', verbText: 'pirater' }),
      makeCandidate({ stat: 'CHA', category: 'obstacle', verbText: 'persuader' }),
    ];
    const result = generateSuggestions(candidates, 'marine', null);
    // FOR should rank highest for marine
    expect(result[0].verbText).toBe('forcer');
  });

  it('applies skin priority bias', () => {
    const highTensionSkin = makeSkin(['FOR', 'AGI']); // High tension → FOR/AGI first
    const candidates = [
      makeCandidate({ stat: 'FOR', category: 'obstacle', verbText: 'frapper' }),
      makeCandidate({ stat: 'INT', category: 'obstacle', verbText: 'analyser' }),
      makeCandidate({ stat: 'CHA', category: 'obstacle', verbText: 'persuader' }),
    ];
    const result = generateSuggestions(candidates, 'medic', highTensionSkin);
    // FOR is in skin priority, so even though medic primary is CHA/INT,
    // the skin bias pushes FOR up
    const scores = result.map(r => r.verbText);
    expect(scores[0]).toBe('frapper');
  });

  it('returns empty array for empty input', () => {
    expect(generateSuggestions([], 'marine', null)).toHaveLength(0);
  });

  it('all returned candidates have score property', () => {
    const candidates = [makeCandidate(), makeCandidate({ verbText: 'réparer' })];
    const result = generateSuggestions(candidates, 'engineer', null);
    for (const c of result) {
      expect(typeof c.score).toBe('number');
    }
  });
});
