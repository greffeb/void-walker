// ---------------------------------------------------------------------------
// tests/unit/engine/parser.test.ts — Parser unit tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  normalizeInput,
  normalizeInputKeepPrepositions,
  matchVerb,
  generateReformulation,
  parseAction,
} from '../../../src/engine/parser';
import { buildParserLocaleData } from '../../../src/content/parserData';
import type { VerbId } from '../../../src/engine/verbs';
import { VERB_IDS } from '../../../src/engine/verbs';
import type { SceneContext, ParsedAction, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance, ParserLocaleData } from '../../../src/engine/types';
import { isReformulation } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';

// === LOCALE DATA (built once for all tests) ===
const localeData: ParserLocaleData = buildParserLocaleData('fr');

// === TEST HELPERS ===

/** Build a minimal SceneContext for testing */
function makeContext(overrides: Partial<SceneContext> = {}): SceneContext {
  return {
    inventory: [],
    locationItems: [],
    npcs: [],
    environmentFeatures: [],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    ...overrides,
  };
}

/** Build a resolved target for testing */
function makeTarget(id: string, props: PropertyId[] = [], source: 'inventory' | 'location' | 'npc' | 'environment' = 'location'): ResolvedTarget {
  return {
    id,
    nameKey: `item.${id}`,
    properties: props,
    isVirtual: false,
    source,
  };
}

/** Build an NPC instance for testing */
function makeNpc(id: string, aliases: string[], props: PropertyId[] = []): NpcInstance {
  return {
    id,
    definitionId: id,
    nameKey: `npc.${id}`,
    aliases,
    properties: props,
    hp: 10,
  };
}

/** Build an environment feature for testing */
function makeFeature(id: string, aliases: string[], props: PropertyId[] = []): EnvironmentFeatureInstance {
  return {
    id,
    definitionId: id,
    nameKey: `env.${id}`,
    aliases,
    properties: props,
  };
}

// === NORMALIZATION TESTS ===

describe('normalizeInput()', () => {
  test('returns empty array for empty string', () => {
    expect(normalizeInput('')).toEqual([]);
  });

  test('returns empty array for null/undefined input', () => {
    expect(normalizeInput(null as unknown as string)).toEqual([]);
    expect(normalizeInput(undefined as unknown as string)).toEqual([]);
  });

  test('lowercases and strips accents', () => {
    const tokens = normalizeInput('Frapper Ennemi');
    expect(tokens).toContain('frapper');
    expect(tokens).toContain('ennemi');
  });

  test('strips diacritics (é→e, è→e, ê→e, etc.)', () => {
    const tokens = normalizeInput('éxaminer détruire');
    expect(tokens.every((t) => !/[éèêëàâîïôùûç]/.test(t))).toBe(true);
  });

  test('splits apostrophes into separate tokens', () => {
    const tokens = normalizeInput("l'ennemi");
    // After apostrophe→space and single-char filter, 'l' is dropped
    expect(tokens).toContain('ennemi');
    expect(tokens).not.toContain("l'ennemi");
  });

  test('removes punctuation', () => {
    const tokens = normalizeInput('frapper! le robot.');
    expect(tokens).toContain('frapper');
    expect(tokens).toContain('robot');
    expect(tokens.some((t) => t.includes('!'))).toBe(false);
    expect(tokens.some((t) => t.includes('.'))).toBe(false);
  });

  test('removes stop words when stopWords provided', () => {
    const tokens = normalizeInput('je frappe le robot', localeData.stopWords);
    expect(tokens).not.toContain('je');
    expect(tokens).not.toContain('le');
    expect(tokens).toContain('frappe');
    expect(tokens).toContain('robot');
  });

  test('drops single-character tokens', () => {
    const tokens = normalizeInput('a b frappe c d');
    for (const t of tokens) {
      expect(t.length).toBeGreaterThan(1);
    }
  });

  test('handles multiple spaces', () => {
    const tokens = normalizeInput('  frapper   robot  ');
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens).toContain('frapper');
  });

  // Bug D regression: pathological repeated-token input
  test('deduplicates repeated tokens (regression: 1000× "robot")', () => {
    const tokens = normalizeInput('frapper ' + 'robot '.repeat(1000));
    expect(tokens).toContain('robot');
    expect(tokens.filter((t) => t === 'robot').length).toBe(1);
    expect(tokens.length).toBeLessThanOrEqual(30);
  });

  test('caps output at 30 tokens even for varied long input', () => {
    const words = Array.from({ length: 50 }, (_, i) => `mot${i}`).join(' ');
    const tokens = normalizeInput(words);
    expect(tokens.length).toBeLessThanOrEqual(30);
  });
});

describe('normalizeInputKeepPrepositions()', () => {
  test('keeps prepositions like "sur"', () => {
    const tokens = normalizeInputKeepPrepositions('tirer sur le robot');
    expect(tokens).toContain('sur');
    expect(tokens).toContain('le');
  });

  test('still strips accents and lowercases', () => {
    const tokens = normalizeInputKeepPrepositions('Détruire La Porte');
    expect(tokens.every((t) => t === t.toLowerCase())).toBe(true);
  });
});

// === STOP WORDS (from locale data) ===

describe('localeData.stopWords', () => {
  test('contains common articles', () => {
    expect(localeData.stopWords.has('le')).toBe(true);
    expect(localeData.stopWords.has('la')).toBe(true);
    expect(localeData.stopWords.has('les')).toBe(true);
    expect(localeData.stopWords.has('un')).toBe(true);
    expect(localeData.stopWords.has('une')).toBe(true);
  });

  test('contains common pronouns', () => {
    expect(localeData.stopWords.has('je')).toBe(true);
    expect(localeData.stopWords.has('tu')).toBe(true);
    expect(localeData.stopWords.has('il')).toBe(true);
  });

  test('does NOT contain useful verb particles', () => {
    // "sur" and "avec" are useful for compound detection and preposition splitting
    expect(localeData.stopWords.has('sur')).toBe(false);
    expect(localeData.stopWords.has('avec')).toBe(false);
    expect(localeData.stopWords.has('pour')).toBe(false);
    expect(localeData.stopWords.has('dans')).toBe(false);
  });
});

// === VERB FORMS (from locale data, replaces old CURATED_FORMS) ===

describe('localeData.verbForms', () => {
  test('has at least 100 entries', () => {
    expect(localeData.verbForms.size).toBeGreaterThanOrEqual(100);
  });

  test('all values are valid VerbIds', () => {
    const verbSet = new Set<string>(VERB_IDS);
    for (const [_form, verbId] of localeData.verbForms) {
      expect(verbSet.has(verbId)).toBe(true);
    }
  });

  test('maps "frappe" to STRIKE', () => {
    expect(localeData.verbForms.get('frappe')).toBe('STRIKE');
  });

  test('maps "examine" to EXAMINE', () => {
    expect(localeData.verbForms.get('examine')).toBe('EXAMINE');
  });

  test('maps "ouvre" to OPEN', () => {
    expect(localeData.verbForms.get('ouvre')).toBe('OPEN');
  });

  test('maps "pirate" to HACK', () => {
    expect(localeData.verbForms.get('pirate')).toBe('HACK');
  });
});

// === COMPOUND PATTERNS (from locale data) ===

describe('localeData.compoundPatterns', () => {
  test('has at least 20 patterns', () => {
    expect(localeData.compoundPatterns.length).toBeGreaterThanOrEqual(20);
  });

  test('is sorted by token count descending', () => {
    for (let i = 1; i < localeData.compoundPatterns.length; i++) {
      const prev = localeData.compoundPatterns[i - 1];
      const curr = localeData.compoundPatterns[i];
      if (prev && curr) {
        expect(prev.tokens.length).toBeGreaterThanOrEqual(curr.tokens.length);
      }
    }
  });

  test('all verb values are valid VerbIds', () => {
    const verbSet = new Set<string>(VERB_IDS);
    for (const pattern of localeData.compoundPatterns) {
      expect(verbSet.has(pattern.verb)).toBe(true);
    }
  });

  test('contains "tirer sur" → SHOOT', () => {
    const found = localeData.compoundPatterns.some(
      (p) => p.tokens.includes('tirer') && p.tokens.includes('sur') && p.verb === 'SHOOT',
    );
    expect(found).toBe(true);
  });

  test('contains "se cacher" → HIDE', () => {
    const found = localeData.compoundPatterns.some(
      (p) => p.tokens.includes('se') && p.tokens.includes('cacher') && p.verb === 'HIDE',
    );
    expect(found).toBe(true);
  });
});

// === VERB MATCHING ===

describe('matchVerb()', () => {
  test('strategy 1: exact alias match for "frapper"', () => {
    const result = matchVerb(['frapper'], ['frapper'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBe(1);
    expect(result?.confidence).toBe(0.95);
  });

  test('strategy 1: form lookup "frappe" → STRIKE', () => {
    // "frappe" is in verbForms (merged alias + conjugated forms)
    const result = matchVerb(['frappe'], ['frappe'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBe(1);
  });

  test('strategy 5: compound "tirer sur" → SHOOT', () => {
    const result = matchVerb(['tirer', 'sur', 'robot'], ['tirer', 'sur', 'le', 'robot'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('SHOOT');
    expect(result?.strategy).toBe(5);
    expect(result?.isCompound).toBe(true);
  });

  test('strategy 5: compound "se cacher" → HIDE', () => {
    const result = matchVerb(['cacher'], ['se', 'cacher'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('HIDE');
    expect(result?.strategy).toBe(5);
  });

  test('strategy 5: compound "faire feu" → SHOOT', () => {
    const result = matchVerb(['faire', 'feu'], ['faire', 'feu'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('SHOOT');
    expect(result?.strategy).toBe(5);
  });

  test('returns null for gibberish', () => {
    const result = matchVerb(['xyzzy', 'qwerty'], ['xyzzy', 'qwerty'], localeData);
    expect(result).toBeNull();
  });

  test('strategy 3 or 4: stemmed/prefix match for conjugated forms', () => {
    // "examinons" — conjugated form not in curated table but stem-matchable
    const result = matchVerb(['examinons'], ['examinons'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('EXAMINE');
  });

  test('first token wins when multiple verbs match', () => {
    // Two verbs in the input — first should win
    const result = matchVerb(['frapper', 'examiner'], ['frapper', 'examiner'], localeData);
    expect(result).not.toBeNull();
    // Should match the FIRST token's verb
    expect(result?.verb).toBe('STRIKE');
  });

  // Bug A regression: "attaquer" must not be caught by prefix match for TIE ('attacher')
  test('strategy 1: "attaquer" → STRIKE (not TIE, regression)', () => {
    const result = matchVerb(['attaquer'], ['attaquer'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBe(1); // curated form or better
  });

  test('strategy 1: "attaque" → STRIKE', () => {
    const result = matchVerb(['attaque'], ['attaque'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
  });

  test('strategy 1: "attaquez" → STRIKE', () => {
    const result = matchVerb(['attaquez'], ['attaquez'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
  });
});

// === REFORMULATION ===

describe('generateReformulation()', () => {
  test('returns a reformulation object', () => {
    const context = makeContext();
    const result = generateReformulation('blabla', ['blabla'], context, localeData);
    expect(result.type).toBe('reformulation');
    expect(result.rawInput).toBe('blabla');
    expect(result.interpretations.length).toBeGreaterThan(0);
    expect(result.interpretations.length).toBeLessThanOrEqual(3);
  });

  test('produces fallback verbs when no partial match', () => {
    const context = makeContext();
    const result = generateReformulation('xyzzy', ['xyzzy'], context, localeData);
    // Should suggest common verbs as fallback
    expect(result.interpretations.length).toBeGreaterThan(0);
  });

  test('has a French prompt', () => {
    const context = makeContext();
    const result = generateReformulation('quoi', ['quoi'], context, localeData);
    expect(typeof result.prompt).toBe('string');
    expect(result.prompt.length).toBeGreaterThan(0);
  });
});

// === TOP-LEVEL PARSER ===

describe('parseAction()', () => {
  const robot: NpcInstance = makeNpc('security_robot', ['robot', 'sentinelle'], ['hostile', 'robotic', 'electronic', 'metallic'] as PropertyId[]);
  const door: EnvironmentFeatureInstance = makeFeature('blast_door', ['porte', 'sas'], ['metallic', 'mechanical', 'openable', 'locked'] as PropertyId[]);
  const pistolet: ResolvedTarget = makeTarget('laser_pistol', ['ranged', 'electronic'] as PropertyId[], 'inventory');

  function testContext(overrides: Partial<SceneContext> = {}): SceneContext {
    return makeContext({
      npcs: [robot],
      environmentFeatures: [door],
      inventory: [pistolet],
      ...overrides,
    });
  }

  test('parses "frapper le robot"', () => {
    const result = parseAction('frapper le robot', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('STRIKE');
      expect(result.target).not.toBeNull();
      expect(result.target?.id).toBe('security_robot');
    }
  });

  test('parses "examiner la porte"', () => {
    const result = parseAction('examiner la porte', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('EXAMINE');
      expect(result.target).not.toBeNull();
      expect(result.target?.id).toBe('blast_door');
    }
  });

  test('parses "ouvrir le sas" as OPEN or UNLOCK', () => {
    const result = parseAction('ouvrir le sas', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      // "ouvrir" maps to either OPEN or UNLOCK depending on alias resolution order
      expect(['OPEN', 'UNLOCK']).toContain(result.verb);
    }
  });

  test('parses "tirer sur le robot" as SHOOT compound', () => {
    const result = parseAction('tirer sur le robot', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('SHOOT');
      expect(result.verbMatch.isCompound).toBe(true);
      expect(result.target?.id).toBe('security_robot');
    }
  });

  test('parses "attendre" as WAIT', () => {
    const result = parseAction('attendre', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('WAIT');
      expect(result.target).toBeNull(); // intransitive
    }
  });

  test('parses "se cacher" as HIDE', () => {
    const result = parseAction('se cacher', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('HIDE');
    }
  });

  test('returns reformulation for gibberish', () => {
    const result = parseAction('xyzzy plugh', testContext(), localeData);
    expect(isReformulation(result)).toBe(true);
    if (isReformulation(result)) {
      expect(result.interpretations.length).toBeGreaterThan(0);
    }
  });

  test('returns reformulation for empty string', () => {
    const result = parseAction('', testContext(), localeData);
    expect(isReformulation(result)).toBe(true);
  });

  test('returns reformulation for whitespace-only', () => {
    const result = parseAction('   ', testContext(), localeData);
    expect(isReformulation(result)).toBe(true);
  });

  test('preserves rawInput in result', () => {
    const raw = 'Frapper le Robot!!!';
    const result = parseAction(raw, testContext(), localeData);
    if (isReformulation(result)) {
      expect(result.rawInput).toBe(raw);
    } else {
      expect(result.rawInput).toBe(raw);
    }
  });

  test('tokens are lowercase and accent-free', () => {
    const result = parseAction('Détruire Ennemi', testContext(), localeData);
    if (!isReformulation(result)) {
      for (const token of result.tokens) {
        expect(token).toBe(token.toLowerCase());
        expect(token).not.toMatch(/[éèêëàâîïôùûç]/);
      }
    }
  });

  test('detects creative action when different from suggestions', () => {
    const suggestion: ParsedAction = {
      verb: 'EXAMINE' as VerbId,
      target: makeTarget('blast_door'),
      tool: null,
      rawInput: 'examiner porte',
      tokens: ['examiner', 'porte'],
      verbMatch: { verb: 'EXAMINE' as VerbId, strategy: 1, confidence: 1, isCompound: false },
      creative: false,
    };
    const ctx = testContext({ suggestions: [suggestion] });
    const result = parseAction('frapper le robot', ctx, localeData);
    if (!isReformulation(result)) {
      expect(result.creative).toBe(true);
    }
  });

  test('parses "pirater la porte" as HACK', () => {
    const result = parseAction('pirater la porte', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('HACK');
    }
  });

  test('handles accented input: "écouter"', () => {
    const result = parseAction('écouter', testContext(), localeData);
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('LISTEN');
    }
  });
});

// ---------------------------------------------------------------------------
// obstacleVerbMap — i18n-driven obstacle verb → VerbId resolution
// ---------------------------------------------------------------------------

describe('buildParserLocaleData — obstacleVerbMap', () => {
  const dataFr = buildParserLocaleData('fr');
  const dataEn = buildParserLocaleData('en');

  test('map is non-empty', () => {
    expect(dataFr.obstacleVerbMap.size).toBeGreaterThan(0);
  });

  test('heal → USE', () => {
    expect(dataFr.obstacleVerbMap.get('heal')).toBe('USE');
  });

  test('hack → HACK', () => {
    expect(dataFr.obstacleVerbMap.get('hack')).toBe('HACK');
  });

  test('crawl → CLIMB', () => {
    expect(dataFr.obstacleVerbMap.get('crawl')).toBe('CLIMB');
  });

  test('navigate → MOVE_TO', () => {
    expect(dataFr.obstacleVerbMap.get('navigate')).toBe('MOVE_TO');
  });

  test('pray → TOUCH', () => {
    expect(dataFr.obstacleVerbMap.get('pray')).toBe('TOUCH');
  });

  test('sneak → HIDE', () => {
    expect(dataFr.obstacleVerbMap.get('sneak')).toBe('HIDE');
  });

  test('set → SET_TRAP', () => {
    expect(dataFr.obstacleVerbMap.get('set')).toBe('SET_TRAP');
  });

  test('unknown verb returns undefined', () => {
    expect(dataFr.obstacleVerbMap.get('invalidverb')).toBeUndefined();
  });

  test('fr and en locales produce the same mapping (authoring vocab is locale-independent)', () => {
    expect(dataFr.obstacleVerbMap.get('hack')).toBe(dataEn.obstacleVerbMap.get('hack'));
    expect(dataFr.obstacleVerbMap.get('crawl')).toBe(dataEn.obstacleVerbMap.get('crawl'));
    expect(dataFr.obstacleVerbMap.size).toBe(dataEn.obstacleVerbMap.size);
  });

  test('all VerbId values are valid VerbIds', () => {
    for (const [, verbId] of dataFr.obstacleVerbMap) {
      expect(VERB_IDS).toContain(verbId);
    }
  });
});
