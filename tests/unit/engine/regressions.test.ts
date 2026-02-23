// ---------------------------------------------------------------------------
// tests/unit/engine/regressions.test.ts — Named regression tests
// NEVER DELETE entries from this file. Add new ones when bugs are fixed.
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { normalizeInput, matchVerb, parseAction } from '../../../src/engine/parser';
import { resolveTarget } from '../../../src/engine/resolver';
import { buildParserLocaleData } from '../../../src/content/parserData';
import type { SceneContext, NpcInstance, EnvironmentFeatureInstance } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';

const localeData = buildParserLocaleData('fr');

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
    const result = matchVerb(['attaquer'], ['attaquer'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.strategy).toBe(1);
  });

  test('parseAction("attaquer le robot") verb → STRIKE', () => {
    const ctx = makeContext({ npcs: [makeNpc('security_robot', ['robot'], ['robotic'] as PropertyId[])] });
    const result = parseAction('attaquer le robot', ctx, localeData);
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

// ---------------------------------------------------------------------------
// REG-005: "je donne un coup de couteau" → GIVE instead of CUT/STRIKE
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n compound patterns
// ---------------------------------------------------------------------------
describe('REG-005: "donne un coup de couteau" → CUT compound', () => {
  const alien = makeNpc('xenomorph', ['alien', 'creature'], ['organic', 'hostile'] as PropertyId[]);
  const knife = {
    id: 'knife', nameKey: 'item.knife', properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
  };
  const ctx = makeContext({ npcs: [alien], inventory: [knife] });

  test('matchVerb detects compound "donne+coup+couteau" → CUT', () => {
    const fullTokens = ['je', 'donne', 'un', 'coup', 'de', 'couteau'];
    const tokens = ['donne', 'coup', 'couteau'];
    const result = matchVerb(tokens, fullTokens, localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('CUT');
    expect(result?.isCompound).toBe(true);
  });

  test('matchVerb detects compound "donne+coup" → STRIKE', () => {
    const fullTokens = ['je', 'donne', 'un', 'coup'];
    const tokens = ['donne', 'coup'];
    const result = matchVerb(tokens, fullTokens, localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
    expect(result?.isCompound).toBe(true);
  });

  test('parseAction("je donne un coup de couteau à l\'alien") → verb CUT', () => {
    const result = parseAction("je donne un coup de couteau à l'alien", ctx, localeData);
    expect('verb' in result && result.verb).toBe('CUT');
  });
});

// ---------------------------------------------------------------------------
// REG-006: "j'utilise mon pistolet" → USE instead of SHOOT (verb promotion)
// Filed: 2026-07-18 | Fixed: 2026-07-18 | parser.ts promoteVerb()
// ---------------------------------------------------------------------------
describe('REG-006: USE + ranged weapon → SHOOT promotion', () => {
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['robotic'] as PropertyId[]);
  const pistol = {
    id: 'laser_pistol', nameKey: 'item.laser_pistol',
    properties: ['electronic', 'ranged', 'light_source', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['pistolet', 'laser'],
  };
  const ctx = makeContext({ npcs: [robot], inventory: [pistol] });

  test('parseAction("j\'utilise mon pistolet") → verb promoted to SHOOT', () => {
    const result = parseAction("j'utilise mon pistolet", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('SHOOT');
    }
  });

  test('parseAction("utiliser le couteau") → verb promoted to CUT', () => {
    const knife = {
      id: 'knife', nameKey: 'item.knife',
      properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
      isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
    };
    const ctx2 = makeContext({ inventory: [knife] });
    const result = parseAction('utiliser le couteau', ctx2, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('CUT');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-007: "je lance mon couteau sur le membre d'équipage" → target=knife
// Filed: 2026-07-18 | Fixed: 2026-07-18 | parser.ts splitOnPrepositions()
// ---------------------------------------------------------------------------
describe('REG-007: preposition-aware target resolution', () => {
  const crew = makeNpc('crew_member', ['membre', 'equipage', 'membre equipage'], ['sentient', 'human'] as PropertyId[]);
  const knife = {
    id: 'knife', nameKey: 'item.knife',
    properties: ['metallic', 'sharp', 'bladed', 'small'] as PropertyId[],
    isVirtual: false as const, source: 'inventory' as const, aliases: ['couteau'],
  };
  const ctx = makeContext({ npcs: [crew], inventory: [knife] });

  test('parseAction("je lance mon couteau sur le membre d\'équipage") → target=crew, tool=knife', () => {
    const result = parseAction("je lance mon couteau sur le membre d'équipage", ctx, localeData);
    expect('verb' in result).toBe(true);
    if ('verb' in result) {
      expect(result.verb).toBe('THROW');
      expect(result.target?.id).toBe('crew_member');
      expect(result.tool?.id).toBe('knife');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-008: "je poignarde l'alien" → unrecognized verb
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n verb.STRIKE.aliases
// ---------------------------------------------------------------------------
describe('REG-008: "poignarder" recognized as STRIKE', () => {
  const alien = makeNpc('xenomorph', ['alien', 'creature'], ['organic', 'hostile'] as PropertyId[]);
  const ctx = makeContext({ npcs: [alien] });

  test('matchVerb("poignarde") → STRIKE', () => {
    const result = matchVerb(['poignarde'], ['poignarde'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('STRIKE');
  });

  test('parseAction("je poignarde l\'alien") → verb STRIKE', () => {
    const result = parseAction("je poignarde l'alien", ctx, localeData);
    expect('verb' in result && result.verb).toBe('STRIKE');
  });
});

// ---------------------------------------------------------------------------
// REG-009: "j'éclaire la pièce" → unrecognized verb
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n verb.ACTIVATE.aliases
// ---------------------------------------------------------------------------
describe('REG-009: "éclairer" recognized as ACTIVATE', () => {
  test('matchVerb("eclaire") → ACTIVATE', () => {
    const result = matchVerb(['eclaire'], ['eclaire'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('ACTIVATE');
  });

  test('parseAction("j\'éclaire la pièce") → verb ACTIVATE', () => {
    const ctx = makeContext({
      environmentFeatures: [makeFeature('room', ['piece', 'salle'], [])],
    });
    const result = parseAction("j'éclaire la pièce", ctx, localeData);
    expect('verb' in result && result.verb).toBe('ACTIVATE');
  });
});

// ---------------------------------------------------------------------------
// REG-010: "j'accède au terminal" → unrecognized verb
// Filed: 2026-07-18 | Fixed: 2026-07-18 | i18n verb.HACK.aliases
// ---------------------------------------------------------------------------
describe('REG-010: "accéder" recognized as HACK', () => {
  test('matchVerb("accede") → HACK', () => {
    const result = matchVerb(['accede'], ['accede'], localeData);
    expect(result).not.toBeNull();
    expect(result?.verb).toBe('HACK');
  });

  test('parseAction("j\'accède au terminal") → verb HACK', () => {
    const ctx = makeContext({
      environmentFeatures: [makeFeature('terminal', ['terminal', 'console'], ['electronic', 'programmable'] as PropertyId[])],
    });
    const result = parseAction("j'accède au terminal", ctx, localeData);
    expect('verb' in result && result.verb).toBe('HACK');
  });
});

// ---------------------------------------------------------------------------
// REG-011: "j'utilise le terminal" → incompatibility (terminal lacks 'usable')
// Filed: 2026-07-18 | Fixed: 2026-07-18 | properties.ts TYPE_BASE_PROPERTIES
// ---------------------------------------------------------------------------
describe('REG-011: terminal type has usable property', () => {
  // This test is at the properties level — verifying the fix is in place
  test('terminal type includes usable in base properties', async () => {
    const { TYPE_BASE_PROPERTIES } = await import('../../../src/engine/properties');
    expect(TYPE_BASE_PROPERTIES.environment.terminal).toContain('usable');
  });
});
