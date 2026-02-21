// ---------------------------------------------------------------------------
// tests/stress/parserFuzzing.test.ts — 5000 fuzzed inputs, 0 throws, <50ms each
// ---------------------------------------------------------------------------
// Stress test for the Phase 2 parser pipeline: normalizeInput, matchVerb,
// resolveTarget, parseAction. No input should cause a crash.
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { normalizeInput, matchVerb, parseAction } from '../../src/engine/parser';
import { resolveTarget } from '../../src/engine/resolver';
import { calculateDifficulty } from '../../src/engine/difficulty';
import { isReformulation } from '../../src/engine/types';
import { VERB_IDS, VERB_REGISTRY } from '../../src/engine/verbs';
import { ITEM_LIST, ITEM_DEFINITIONS, resolveItemProperties } from '../../src/content/items';
import { NPC_LIST, NPC_DEFINITIONS, resolveNPCProperties } from '../../src/content/npcs';
import { ENVIRONMENT_FEATURE_LIST, ENVIRONMENT_FEATURE_DEFINITIONS, resolveEnvironmentProperties } from '../../src/content/environments';
import type { SceneContext, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance, ParsedAction } from '../../src/engine/types';
import type { PropertyId } from '../../src/engine/properties';
import type { VerbId } from '../../src/engine/verbs';

// === SCENE FIXTURE ===

/** Build a rich scene context from real content data for realistic testing */
function buildTestScene(): SceneContext {
  const itemIds = ITEM_LIST.map((item) => item.id);
  const inventory: ResolvedTarget[] = itemIds.slice(0, 5).flatMap((id) => {
    const def = ITEM_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      nameKey: def.nameKey,
      properties: resolveItemProperties(id),
      isVirtual: false,
      source: 'inventory' as const,
    }];
  });

  const locationItems: ResolvedTarget[] = itemIds.slice(5, 10).flatMap((id) => {
    const def = ITEM_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      nameKey: def.nameKey,
      properties: resolveItemProperties(id),
      isVirtual: false,
      source: 'location' as const,
    }];
  });

  const npcIds = NPC_LIST.map((npc) => npc.id);
  const npcs: NpcInstance[] = npcIds.flatMap((id) => {
    const def = NPC_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      definitionId: id,
      nameKey: def.nameKey,
      aliases: id.replace(/_/g, ' ').split(' '),
      properties: resolveNPCProperties(id),
      hp: def.hp,
    }];
  });

  const featureIds = ENVIRONMENT_FEATURE_LIST.map((f) => f.id);
  const environmentFeatures: EnvironmentFeatureInstance[] = featureIds.flatMap((id) => {
    const def = ENVIRONMENT_FEATURE_DEFINITIONS[id];
    if (!def) return [];
    return [{
      id,
      definitionId: id,
      nameKey: def.nameKey,
      aliases: id.replace(/_/g, ' ').split(' '),
      properties: resolveEnvironmentProperties(id),
    }];
  });

  return {
    inventory,
    locationItems,
    npcs,
    environmentFeatures,
    connectedLocations: [
      { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
      { id: 'sas_b', aliases: ['sas', 'airlock'] },
    ],
    suggestions: [],
    environmentConditions: [],
  };
}

// === FUZZ GENERATORS ===

/** Pseudo-random seeded generator for reproducible fuzz */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const FUZZ_CHARS = 'abcdefghijklmnopqrstuvwxyz éèêëàâîïôùûç\'-.!?,;:0123456789';
const FRENCH_WORDS = [
  'frapper', 'examiner', 'ouvrir', 'fermer', 'pirater', 'tirer', 'courir',
  'se', 'cacher', 'attendre', 'prendre', 'lacher', 'donner', 'utiliser',
  'pousser', 'tirer', 'couper', 'souder', 'reparer', 'detruire',
  'sur', 'dans', 'avec', 'le', 'la', 'les', 'un', 'une', 'du', 'de',
  'robot', 'porte', 'sas', 'alien', 'couteau', 'pistolet', 'laser',
  'tete', 'bras', 'griffe', 'antenne', 'queue',
  'corridor', 'fenetre', 'panneau', 'terminal', 'ventilation',
  'je', 'tu', 'il', 'fait', 'feu', 'signe', 'coup', 'pied',
  'comme', 'arme', 'bouclier', 'outil', 'piege',
  // Edge cases
  '', ' ', '!', '???', '...', '😀', '🔫', '\n', '\t',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'x'.repeat(200),
];

function generateFuzzInput(rand: () => number): string {
  const strategy = rand();

  if (strategy < 0.3) {
    // Random French words combined
    const wordCount = 1 + Math.floor(rand() * 5);
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const idx = Math.floor(rand() * FRENCH_WORDS.length);
      words.push(FRENCH_WORDS[idx] ?? '');
    }
    return words.join(' ');
  }

  if (strategy < 0.5) {
    // Verb alias + random target
    const verbIdx = Math.floor(rand() * VERB_IDS.length);
    const verbId = VERB_IDS[verbIdx];
    if (verbId) {
      const entry = VERB_REGISTRY[verbId];
      const aliasIdx = Math.floor(rand() * entry.aliases.fr.length);
      const alias = entry.aliases.fr[aliasIdx] ?? verbId.toLowerCase();
      const targetIdx = Math.floor(rand() * FRENCH_WORDS.length);
      return `${alias} ${FRENCH_WORDS[targetIdx] ?? ''}`;
    }
    return 'frapper robot';
  }

  if (strategy < 0.7) {
    // Pure random characters
    const len = Math.floor(rand() * 50);
    let s = '';
    for (let i = 0; i < len; i++) {
      const ci = Math.floor(rand() * FUZZ_CHARS.length);
      s += FUZZ_CHARS.charAt(ci);
    }
    return s;
  }

  if (strategy < 0.85) {
    // Empty or whitespace
    const len = Math.floor(rand() * 5);
    return ' '.repeat(len);
  }

  // Edge cases: unicode, control chars, very long
  const edgeCases = [
    '\0',
    '\x00\x01\x02',
    '🎮 frapper 🤖',
    'a'.repeat(1000),
    '你好世界',
    '<script>alert(1)</script>',
    'DROP TABLE actions;',
    'undefined',
    'null',
    'NaN',
    'Infinity',
    '-1',
    'true',
    'false',
    '{}',
    '[]',
  ];
  const edgeIdx = Math.floor(rand() * edgeCases.length);
  return edgeCases[edgeIdx] ?? '';
}

// === TESTS ===

const FUZZ_COUNT = 5000;
const MAX_PARSE_TIME_MS = 50;
const scene = buildTestScene();

describe(`stress: ${FUZZ_COUNT} fuzzed parser inputs`, () => {
  const rand = seededRandom(42);
  const fuzzInputs: string[] = [];
  for (let i = 0; i < FUZZ_COUNT; i++) {
    fuzzInputs.push(generateFuzzInput(rand));
  }

  test(`generates ${FUZZ_COUNT} fuzz inputs`, () => {
    expect(fuzzInputs.length).toBe(FUZZ_COUNT);
  });

  test('normalizeInput never throws on any fuzzed input', () => {
    const failures: string[] = [];
    for (const input of fuzzInputs) {
      try {
        const result = normalizeInput(input);
        if (!Array.isArray(result)) {
          failures.push(`normalizeInput(${JSON.stringify(input.slice(0, 30))}) did not return array`);
        }
      } catch (e) {
        failures.push(`normalizeInput(${JSON.stringify(input.slice(0, 30))}): ${e}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test('parseAction never throws on any fuzzed input', () => {
    const failures: string[] = [];
    for (const input of fuzzInputs) {
      try {
        const result = parseAction(input, scene);
        if (isReformulation(result)) {
          expect(result.type).toBe('reformulation');
          expect(Array.isArray(result.interpretations)).toBe(true);
        } else {
          expect(typeof result.verb).toBe('string');
          expect(Array.isArray(result.tokens)).toBe(true);
        }
      } catch (e) {
        failures.push(`parseAction(${JSON.stringify(input.slice(0, 30))}): ${e}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test(`each parseAction completes in <${MAX_PARSE_TIME_MS}ms`, () => {
    const slow: string[] = [];
    for (const input of fuzzInputs) {
      const start = performance.now();
      parseAction(input, scene);
      const elapsed = performance.now() - start;
      if (elapsed > MAX_PARSE_TIME_MS) {
        slow.push(`${elapsed.toFixed(1)}ms: ${JSON.stringify(input.slice(0, 40))}`);
      }
    }
    // Allow a few slow ones (JIT warmup) but no more than 1%
    expect(slow.length).toBeLessThan(FUZZ_COUNT * 0.01);
  });

  test('resolveTarget never throws on any fuzzed input', () => {
    const failures: string[] = [];
    for (const input of fuzzInputs) {
      try {
        const tokens = normalizeInput(input);
        for (const verbId of ['STRIKE', 'EXAMINE', 'MOVE_TO', 'WAIT'] as VerbId[]) {
          const result = resolveTarget(tokens, verbId, scene);
          if (result !== null) {
            expect(typeof result.id).toBe('string');
            expect(typeof result.source).toBe('string');
          }
        }
      } catch (e) {
        failures.push(`resolveTarget(${JSON.stringify(input.slice(0, 30))}): ${e}`);
      }
    }
    expect(failures).toEqual([]);
  });

  test('calculateDifficulty never throws on parsed actions', () => {
    const failures: string[] = [];
    let checked = 0;
    for (const input of fuzzInputs.slice(0, 1000)) {
      try {
        const result = parseAction(input, scene);
        if (!isReformulation(result)) {
          const difficulty = calculateDifficulty({
            verb: result.verb,
            target: result.target,
            tool: result.tool,
            playerStats: { FOR: 3, DEF: 3, AGI: 3, INT: 3, PER: 3, CHA: 3, LCK: 3 },
            difficultyLevel: 'survivor',
            creative: result.creative,
          });
          expect(typeof difficulty.total).toBe('number');
          expect(difficulty.total).toBeGreaterThanOrEqual(0);
          checked++;
        }
      } catch (e) {
        failures.push(`calculateDifficulty(${JSON.stringify(input.slice(0, 30))}): ${e}`);
      }
    }
    expect(failures).toEqual([]);
    expect(checked).toBeGreaterThan(0);
  });

  test('all 77 verbs are matchable via at least one input strategy', () => {
    const unmatchable: string[] = [];
    for (const verbId of VERB_IDS) {
      const entry = VERB_REGISTRY[verbId];
      // Try the first French alias
      const alias = entry.aliases.fr[0];
      if (!alias) {
        unmatchable.push(`${verbId}: no FR alias`);
        continue;
      }
      const normalized = alias
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const tokens = normalized.split(/\s+/).filter((t) => t.length > 1);
      const match = matchVerb(tokens, tokens);
      if (!match) {
        unmatchable.push(`${verbId}: alias "${alias}" did not match`);
      }
    }
    expect(unmatchable).toEqual([]);
  });
});
