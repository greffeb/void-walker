// ---------------------------------------------------------------------------
// tests/unit/engine/regressions.test.ts — Named regression tests
// NEVER DELETE entries from this file. Add new ones when bugs are fixed.
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { normalizeInput, matchVerb, parseAction } from '../../../src/engine/parser';
import { resolveTarget } from '../../../src/engine/resolver';
import type { SceneContext, NpcInstance, EnvironmentFeatureInstance } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';

function makeNpc(id: string, aliases: string[], props: PropertyId[] = []): NpcInstance {
  return { id, definitionId: id, nameKey: `npc.${id}`, aliases, properties: props, hp: 10 };
}

function makeFeature(id: string, aliases: string[], props: PropertyId[] = []): EnvironmentFeatureInstance {
  return { id, definitionId: id, nameKey: `env.${id}`, aliases, properties: props };
}

function makeContext(overrides: Partial<SceneContext> = {}): SceneContext {
  return {
    inventory: [], locationItems: [], npcs: [], environmentFeatures: [],
    connectedLocations: [], suggestions: [], environmentConditions: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// REG-001: "attaquer" parsed as TIE instead of STRIKE
// Filed: 2026-02-21 | Fixed: 2026-02-21 | parser.ts CURATED_FORMS
// ---------------------------------------------------------------------------
describe('REG-001: attaquer → STRIKE not TIE', () => {
  test('matchVerb("attaquer") → STRIKE via strategy ≤ 2', () => {
    const result = matchVerb(['attaquer'], ['attaquer']);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBeLessThanOrEqual(2);
  });

  test('parseAction("attaquer le robot") verb → STRIKE', () => {
    const ctx = makeContext({ npcs: [makeNpc('security_robot', ['robot'], ['robotic'] as PropertyId[])] });
    const result = parseAction('attaquer le robot', ctx);
    expect('verb' in result && result.verb).toBe('STRIKE');
  });
});

// ---------------------------------------------------------------------------
// REG-002: Environment targets resolved as NPCs via short/prefix alias match
// Filed: 2026-02-21 | Fixed: 2026-02-21 | resolver.ts tokenMatchScore + NPC threshold
// ---------------------------------------------------------------------------
describe('REG-002: environment vs NPC disambiguation', () => {
  const ai = makeNpc('station_ai', ['ia', 'intelligence', 'ordinateur'], []);
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['robotic'] as PropertyId[]);
  const camera = makeFeature('security_camera', ['camera', 'securite', 'surveillance'], []);
  const airlock = makeFeature('main_airlock', ['airlock', 'sas', 'ecluse'], ['metallic'] as PropertyId[]);

  test('"airlock" resolves to main_airlock, not station_ai (short alias "ai" substring bug)', () => {
    const ctx = makeContext({ npcs: [ai], environmentFeatures: [airlock] });
    const result = resolveTarget(['airlock'], 'OPEN', ctx);
    expect(result?.id).toBe('main_airlock');
    expect(result?.source).toBe('environment');
  });

  test('"camera securite" resolves to security_camera, not security_robot (prefix "secu" bug)', () => {
    const ctx = makeContext({ npcs: [robot], environmentFeatures: [camera] });
    const result = resolveTarget(['camera', 'securite'], 'EXAMINE', ctx);
    expect(result?.id).toBe('security_camera');
    expect(result?.source).toBe('environment');
  });
});

// ---------------------------------------------------------------------------
// REG-003: Body-part targeting yields whole NPC instead of virtual part
// Filed: 2026-02-21 | Fixed: 2026-02-21 | resolver.ts priority order (body parts before NPCs)
// ---------------------------------------------------------------------------
describe('REG-003: body-part targeting resolves to virtual part', () => {
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['robotic', 'metallic'] as PropertyId[]);
  const xenomorph = makeNpc('xenomorph', ['alien', 'creature'], ['organic'] as PropertyId[]);
  const headDef = {
    id: 'head', nameKey: 'bodypart.head' as const,
    aliases: ['tete', 'crane'], baseProperties: ['fragile'] as PropertyId[],
  };
  const clawDef = {
    id: 'claw', nameKey: 'bodypart.claw' as const,
    aliases: ['griffe', 'serre'], baseProperties: ['sharp', 'bladed'] as PropertyId[],
  };
  const ctx = makeContext({ npcs: [robot, xenomorph], bodyParts: [headDef, clawDef] });

  test('"tete robot" → security_robot_head (not whole security_robot)', () => {
    const result = resolveTarget(['tete', 'robot'], 'STRIKE', ctx);
    expect(result?.id).toBe('security_robot_head');
    expect(result?.source).toBe('npc_part');
    expect(result?.isVirtual).toBe(true);
  });

  test('"griffe alien" → xenomorph_claw (not whole xenomorph)', () => {
    const result = resolveTarget(['griffe', 'alien'], 'CUT', ctx);
    expect(result?.id).toBe('xenomorph_claw');
    expect(result?.source).toBe('npc_part');
  });
});

// ---------------------------------------------------------------------------
// REG-004: Long/repeated token input causes >50ms parse time
// Filed: 2026-02-21 | Fixed: 2026-02-21 | parser.ts normalizeInput dedup+cap
// ---------------------------------------------------------------------------
describe('REG-004: normalizeInput deduplicates and caps tokens', () => {
  test('1000 repetitions of "robot" deduplicate to 1 token', () => {
    const tokens = normalizeInput('frapper ' + 'robot '.repeat(1000));
    const robotCount = tokens.filter((t) => t === 'robot').length;
    expect(robotCount).toBe(1);
    expect(tokens.length).toBeLessThanOrEqual(30);
  });

  test('50 distinct tokens are capped at 30', () => {
    const words = Array.from({ length: 50 }, (_, i) => `mot${String(i).padStart(2, '0')}`).join(' ');
    const tokens = normalizeInput(words);
    expect(tokens.length).toBeLessThanOrEqual(30);
  });
});
