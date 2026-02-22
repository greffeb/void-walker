// ---------------------------------------------------------------------------
// tests/unit/engine/parser.test.ts — Parser unit tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  normalizeInput,
  normalizeInputKeepPrepositions,
  CURATED_FORMS,
  COMPOUND_PATTERNS,
  matchVerb,
  generateReformulation,
  parseAction,
  FRENCH_STOP_WORDS,
} from '../../../src/engine/parser';
import type { VerbId } from '../../../src/engine/verbs';
import { VERB_IDS } from '../../../src/engine/verbs';
import type { SceneContext, ParsedAction, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance } from '../../../src/engine/types';
import { isReformulation } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';

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

  test('removes stop words', () => {
    const tokens = normalizeInput('je frappe le robot');
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

// === STOP WORDS ===

describe('FRENCH_STOP_WORDS', () => {
  test('contains common articles', () => {
    expect(FRENCH_STOP_WORDS.has('le')).toBe(true);
    expect(FRENCH_STOP_WORDS.has('la')).toBe(true);
    expect(FRENCH_STOP_WORDS.has('les')).toBe(true);
    expect(FRENCH_STOP_WORDS.has('un')).toBe(true);
    expect(FRENCH_STOP_WORDS.has('une')).toBe(true);
  });

  test('contains common pronouns', () => {
    expect(FRENCH_STOP_WORDS.has('je')).toBe(true);
    expect(FRENCH_STOP_WORDS.has('tu')).toBe(true);
    expect(FRENCH_STOP_WORDS.has('il')).toBe(true);
  });

  test('does NOT contain useful verb particles', () => {
    // "sur" and "avec" are useful for compound detection
    expect(FRENCH_STOP_WORDS.has('sur')).toBe(false);
    expect(FRENCH_STOP_WORDS.has('avec')).toBe(false);
    expect(FRENCH_STOP_WORDS.has('pour')).toBe(false);
    expect(FRENCH_STOP_WORDS.has('dans')).toBe(false);
  });
});

// === CURATED FORMS ===

describe('CURATED_FORMS', () => {
  test('has at least 100 entries', () => {
    expect(CURATED_FORMS.size).toBeGreaterThanOrEqual(100);
  });

  test('all values are valid VerbIds', () => {
    const verbSet = new Set<string>(VERB_IDS);
    for (const [_form, verbId] of CURATED_FORMS) {
      expect(verbSet.has(verbId)).toBe(true);
    }
  });

  test('maps "frappe" to STRIKE', () => {
    expect(CURATED_FORMS.get('frappe')).toBe('STRIKE');
  });

  test('maps "examine" to EXAMINE', () => {
    expect(CURATED_FORMS.get('examine')).toBe('EXAMINE');
  });

  test('maps "ouvre" to OPEN', () => {
    expect(CURATED_FORMS.get('ouvre')).toBe('OPEN');
  });

  test('maps "pirate" to HACK', () => {
    expect(CURATED_FORMS.get('pirate')).toBe('HACK');
  });
});

// === COMPOUND PATTERNS ===

describe('COMPOUND_PATTERNS', () => {
  test('has at least 20 patterns', () => {
    expect(COMPOUND_PATTERNS.length).toBeGreaterThanOrEqual(20);
  });

  test('is sorted by token count descending', () => {
    for (let i = 1; i < COMPOUND_PATTERNS.length; i++) {
      const prev = COMPOUND_PATTERNS[i - 1];
      const curr = COMPOUND_PATTERNS[i];
      if (prev && curr) {
        expect(prev.tokens.length).toBeGreaterThanOrEqual(curr.tokens.length);
      }
    }
  });

  test('all verb values are valid VerbIds', () => {
    const verbSet = new Set<string>(VERB_IDS);
    for (const pattern of COMPOUND_PATTERNS) {
      expect(verbSet.has(pattern.verb)).toBe(true);
    }
  });

  test('contains "tirer sur" → SHOOT', () => {
    const found = COMPOUND_PATTERNS.some(
      (p) => p.tokens.includes('tirer') && p.tokens.includes('sur') && p.verb === 'SHOOT',
    );
    expect(found).toBe(true);
  });

  test('contains "se cacher" → HIDE', () => {
    const found = COMPOUND_PATTERNS.some(
      (p) => p.tokens.includes('se') && p.tokens.includes('cacher') && p.verb === 'HIDE',
    );
    expect(found).toBe(true);
  });
});

// === VERB MATCHING ===

describe('matchVerb()', () => {
  test('strategy 1: exact alias match for "frapper"', () => {
    const result = matchVerb(['frapper'], ['frapper']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBe(1);
    expect(result?.confidence).toBe(1.0);
  });

  test('strategy 2: curated form "frappe" → STRIKE', () => {
    // "frappe" is in CURATED_FORMS but also might match alias depending on registry
    // The point is it resolves to STRIKE
    const result = matchVerb(['frappe'], ['frappe']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBeLessThanOrEqual(2);
  });

  test('strategy 5: compound "tirer sur" → SHOOT', () => {
    const result = matchVerb(['tirer', 'sur', 'robot'], ['tirer', 'sur', 'le', 'robot']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('SHOOT');
    expect(result?.strategy).toBe(5);
    expect(result?.isCompound).toBe(true);
  });

  test('strategy 5: compound "se cacher" → HIDE', () => {
    const result = matchVerb(['cacher'], ['se', 'cacher']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('HIDE');
    expect(result?.strategy).toBe(5);
  });

  test('strategy 5: compound "faire feu" → SHOOT', () => {
    const result = matchVerb(['faire', 'feu'], ['faire', 'feu']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('SHOOT');
    expect(result?.strategy).toBe(5);
  });

  test('returns null for gibberish', () => {
    const result = matchVerb(['xyzzy', 'qwerty'], ['xyzzy', 'qwerty']);
    expect(result).toBeNull();
  });

  test('strategy 3 or 4: stemmed/prefix match for conjugated forms', () => {
    // "examinons" — conjugated form not in curated table but stem-matchable
    const result = matchVerb(['examinons'], ['examinons']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('EXAMINE');
  });

  test('first token wins when multiple verbs match', () => {
    // Two verbs in the input — first should win
    const result = matchVerb(['frapper', 'examiner'], ['frapper', 'examiner']);
    expect(result).not.toBeNull();
    // Should match the FIRST token's verb
    expect(result?.verb).toBe('STRIKE');
  });

  // Bug A regression: "attaquer" must not be caught by prefix match for TIE ('attacher')
  test('strategy 2: "attaquer" → STRIKE (not TIE, regression)', () => {
    const result = matchVerb(['attaquer'], ['attaquer']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBeLessThanOrEqual(2); // curated form or better
  });

  test('strategy 2: "attaque" → STRIKE', () => {
    const result = matchVerb(['attaque'], ['attaque']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
  });

  test('strategy 2: "attaquez" → STRIKE', () => {
    const result = matchVerb(['attaquez'], ['attaquez']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
  });
});

// === REFORMULATION ===

describe('generateReformulation()', () => {
  test('returns a reformulation object', () => {
    const context = makeContext();
    const result = generateReformulation('blabla', ['blabla'], context);
    expect(result.type).toBe('reformulation');
    expect(result.rawInput).toBe('blabla');
    expect(result.interpretations.length).toBeGreaterThan(0);
    expect(result.interpretations.length).toBeLessThanOrEqual(3);
  });

  test('produces fallback verbs when no partial match', () => {
    const context = makeContext();
    const result = generateReformulation('xyzzy', ['xyzzy'], context);
    // Should suggest common verbs as fallback
    expect(result.interpretations.length).toBeGreaterThan(0);
  });

  test('has a French prompt', () => {
    const context = makeContext();
    const result = generateReformulation('quoi', ['quoi'], context);
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
    const result = parseAction('frapper le robot', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('STRIKE');
      expect(result.target).not.toBeNull();
      expect(result.target?.id).toBe('security_robot');
    }
  });

  test('parses "examiner la porte"', () => {
    const result = parseAction('examiner la porte', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('EXAMINE');
      expect(result.target).not.toBeNull();
      expect(result.target?.id).toBe('blast_door');
    }
  });

  test('parses "ouvrir le sas" as OPEN or UNLOCK', () => {
    const result = parseAction('ouvrir le sas', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      // "ouvrir" maps to either OPEN or UNLOCK depending on alias resolution order
      expect(['OPEN', 'UNLOCK']).toContain(result.verb);
    }
  });

  test('parses "tirer sur le robot" as SHOOT compound', () => {
    const result = parseAction('tirer sur le robot', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('SHOOT');
      expect(result.verbMatch.isCompound).toBe(true);
      expect(result.target?.id).toBe('security_robot');
    }
  });

  test('parses "attendre" as WAIT', () => {
    const result = parseAction('attendre', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('WAIT');
      expect(result.target).toBeNull(); // intransitive
    }
  });

  test('parses "se cacher" as HIDE', () => {
    const result = parseAction('se cacher', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('HIDE');
    }
  });

  test('returns reformulation for gibberish', () => {
    const result = parseAction('xyzzy plugh', testContext());
    expect(isReformulation(result)).toBe(true);
    if (isReformulation(result)) {
      expect(result.interpretations.length).toBeGreaterThan(0);
    }
  });

  test('returns reformulation for empty string', () => {
    const result = parseAction('', testContext());
    expect(isReformulation(result)).toBe(true);
  });

  test('returns reformulation for whitespace-only', () => {
    const result = parseAction('   ', testContext());
    expect(isReformulation(result)).toBe(true);
  });

  test('preserves rawInput in result', () => {
    const raw = 'Frapper le Robot!!!';
    const result = parseAction(raw, testContext());
    if (isReformulation(result)) {
      expect(result.rawInput).toBe(raw);
    } else {
      expect(result.rawInput).toBe(raw);
    }
  });

  test('tokens are lowercase and accent-free', () => {
    const result = parseAction('Détruire Ennemi', testContext());
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
    const result = parseAction('frapper le robot', ctx);
    if (!isReformulation(result)) {
      expect(result.creative).toBe(true);
    }
  });

  test('parses "pirater la porte" as HACK', () => {
    const result = parseAction('pirater la porte', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('HACK');
    }
  });

  test('handles accented input: "écouter"', () => {
    const result = parseAction('écouter', testContext());
    expect(isReformulation(result)).toBe(false);
    if (!isReformulation(result)) {
      expect(result.verb).toBe('LISTEN');
    }
  });
});
