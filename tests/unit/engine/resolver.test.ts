// ---------------------------------------------------------------------------
// tests/unit/engine/resolver.test.ts — Target resolver unit tests
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import { resolveTarget, resolveBodyPart, BODY_PARTS } from '../../../src/engine/resolver';
import type { SceneContext, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance } from '../../../src/engine/types';
import type { PropertyId } from '../../../src/engine/properties';

// === TEST HELPERS ===

function makeTarget(id: string, props: PropertyId[] = [], source: 'inventory' | 'location' = 'location'): ResolvedTarget {
  return {
    id,
    nameKey: `item.${id}`,
    properties: props,
    isVirtual: false,
    source,
  };
}

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

function makeFeature(id: string, aliases: string[], props: PropertyId[] = []): EnvironmentFeatureInstance {
  return {
    id,
    definitionId: id,
    nameKey: `env.${id}`,
    aliases,
    properties: props,
  };
}

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

// === BODY PARTS ===

describe('BODY_PARTS', () => {
  test('defines at least 5 body parts', () => {
    expect(BODY_PARTS.size).toBeGreaterThanOrEqual(5);
  });

  test('each body part has required fields', () => {
    for (const [_id, part] of BODY_PARTS) {
      expect(part.id).toBeTruthy();
      expect(part.nameKey).toBeTruthy();
      expect(Array.isArray(part.aliases)).toBe(true);
      expect(Array.isArray(part.baseProperties)).toBe(true);
    }
  });

  test('contains standard parts: arm, head, leg', () => {
    expect(BODY_PARTS.has('arm')).toBe(true);
    expect(BODY_PARTS.has('head')).toBe(true);
    expect(BODY_PARTS.has('leg')).toBe(true);
  });

  test('alien parts: claw, tail, antenna', () => {
    expect(BODY_PARTS.has('claw')).toBe(true);
    expect(BODY_PARTS.has('tail')).toBe(true);
    expect(BODY_PARTS.has('antenna')).toBe(true);
  });
});

// === BODY PART RESOLUTION ===

describe('resolveBodyPart()', () => {
  const xenomorph = makeNpc('xenomorph', ['xenomorphe', 'alien', 'creature'], ['hostile', 'organic'] as PropertyId[]);
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['hostile', 'robotic', 'metallic'] as PropertyId[]);

  // Body parts with locale-enriched aliases (simulating what content layer injects)
  const bodyPartDefs = [
    { id: 'head', nameKey: 'bodypart.head', aliases: ['tete', 'crane', 'visage', 'face'], baseProperties: ['fragile'] as PropertyId[] },
    { id: 'arm', nameKey: 'bodypart.arm', aliases: ['bras', 'main', 'poing'], baseProperties: ['blunt', 'holdable'] as PropertyId[] },
    { id: 'claw', nameKey: 'bodypart.claw', aliases: ['griffe', 'griffes', 'serre'], baseProperties: ['sharp', 'bladed'] as PropertyId[] },
    { id: 'torso', nameKey: 'bodypart.torso', aliases: ['torse', 'poitrine', 'corps'], baseProperties: ['large'] as PropertyId[] },
  ];

  test('resolves "tete" of xenomorph', () => {
    const result = resolveBodyPart(['tete', 'xenomorphe'], [xenomorph], bodyPartDefs);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('xenomorph_head');
    expect(result?.isVirtual).toBe(true);
    expect(result?.source).toBe('npc_part');
  });

  test('virtual body part inherits NPC material properties', () => {
    const result = resolveBodyPart(['bras', 'robot'], [robot], bodyPartDefs);
    expect(result).not.toBeNull();
    expect(result?.properties).toContain('metallic');
    expect(result?.properties).toContain('attached');
    expect(result?.properties).toContain('tangible');
  });

  test('returns null when no body part found', () => {
    const result = resolveBodyPart(['robot'], [robot], bodyPartDefs);
    expect(result).toBeNull();
  });

  test('returns null when no matching NPC', () => {
    const result = resolveBodyPart(['tete', 'fantome'], [robot], bodyPartDefs);
    expect(result).toBeNull();
  });

  test('alien body part "griffe" resolved on xenomorph', () => {
    const result = resolveBodyPart(['griffe', 'alien'], [xenomorph], bodyPartDefs);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('xenomorph_claw');
    expect(result?.properties).toContain('sharp');
    expect(result?.properties).toContain('organic');
  });
});

// === TARGET RESOLUTION ===

describe('resolveTarget()', () => {
  const pistolet = makeTarget('laser_pistol', ['ranged', 'electronic'] as PropertyId[], 'inventory');
  const medkit = makeTarget('kit_medical', ['healing'] as PropertyId[], 'location');
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['hostile', 'robotic'] as PropertyId[]);
  const door = makeFeature('blast_door', ['porte', 'sas'], ['metallic', 'openable'] as PropertyId[]);

  const ctx = makeContext({
    inventory: [pistolet],
    locationItems: [medkit],
    npcs: [robot],
    environmentFeatures: [door],
  });

  test('resolves inventory item by name', () => {
    const result = resolveTarget(['pistolet'], 'USE', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('laser_pistol');
    expect(result?.source).toBe('inventory');
  });

  test('resolves NPC by alias', () => {
    const result = resolveTarget(['robot'], 'STRIKE', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('security_robot');
    expect(result?.source).toBe('npc');
  });

  test('resolves environment feature by alias', () => {
    const result = resolveTarget(['porte'], 'OPEN', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('blast_door');
    expect(result?.source).toBe('environment');
  });

  test('resolves environment feature by secondary alias', () => {
    const result = resolveTarget(['sas'], 'OPEN', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('blast_door');
  });

  test('returns null for intransitive verb with no tokens', () => {
    const result = resolveTarget([], 'WAIT', ctx);
    expect(result).toBeNull();
  });

  test('falls back to abstract target for unrecognized transitive verb target', () => {
    const result = resolveTarget(['fantome'], 'STRIKE', ctx);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('abstract');
  });

  test('inventory takes priority over location items with same name', () => {
    const invItem = makeTarget('ration', ['edible'] as PropertyId[], 'inventory');
    const locItem = makeTarget('ration', ['edible'] as PropertyId[], 'location');
    const ctxDup = makeContext({
      inventory: [invItem],
      locationItems: [locItem],
    });
    const result = resolveTarget(['ration'], 'EAT', ctxDup);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('inventory');
  });

  test('resolves connected location for movement verbs', () => {
    const ctxWithLoc = makeContext({
      connectedLocations: [{ id: 'corridor_b', aliases: ['corridor', 'couloir'] }],
    });
    const result = resolveTarget(['couloir'], 'MOVE_TO', ctxWithLoc);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('corridor_b');
    expect(result?.source).toBe('connected_location');
  });

  test('filters out verb alias tokens from target matching', () => {
    // "frapper" should not match as a target when the verb is STRIKE
    const result = resolveTarget(['frapper', 'robot'], 'STRIKE', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('security_robot');
  });

  test('filters out conjugated verb forms from target matching', () => {
    // "parle" is a conjugated form of "parler" (TALK alias) — should be stripped
    const npcCtx = makeContext({ npcs: [robot] });
    const result = resolveTarget(['parle', 'robot'], 'TALK', npcCtx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('security_robot');
    expect(result?.source).toBe('npc');
  });
});

// === FRENCH ALIAS RESOLUTION ===

describe('resolveTarget() — French alias support', () => {
  const ai = makeNpc('station_ai', ['ia', 'intelligence', 'artificielle', 'ordinateur', 'ordi', 'station'], []);
  const crew = makeNpc('parasitized_crewmember', ['equipage', 'membre', 'parasite', 'infecte', 'mec', 'type', 'collegue', 'equipier'], ['hostile'] as PropertyId[]);
  const android = makeNpc('wounded_android', ['androide', 'blesse', 'android', 'mec', 'type', 'robot', 'synthetique'], []);
  const xenomorph = makeNpc('xenomorph', ['xenomorphe', 'alien', 'creature', 'monstre', 'bete', 'extraterrestre'], ['hostile'] as PropertyId[]);
  const doorFeature = makeFeature('blast_door', ['porte', 'blindee', 'sas', 'portail', 'lourde'], ['metallic', 'openable'] as PropertyId[]);
  const camera = makeFeature('security_camera', ['camera', 'securite', 'surveillance', 'cam'], []);
  const casier = makeFeature('supply_locker', ['casier', 'ravitaillement', 'armoire', 'placard', 'coffre'], []);

  const ctx = makeContext({
    npcs: [ai, crew, android, xenomorph],
    environmentFeatures: [doorFeature, camera, casier],
  });

  test('resolves "ia" to station_ai', () => {
    const result = resolveTarget(['ia'], 'TALK', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('station_ai');
    expect(result?.source).toBe('npc');
  });

  test('resolves "membre equipage" to parasitized_crewmember', () => {
    const result = resolveTarget(['membre', 'equipage'], 'TALK', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('parasitized_crewmember');
    expect(result?.source).toBe('npc');
  });

  test('resolves "mec" to an NPC (android or crewmember)', () => {
    const result = resolveTarget(['mec'], 'TALK', ctx);
    expect(result).not.toBeNull();
    expect(result?.source).toBe('npc');
  });

  test('resolves "alien" to xenomorph', () => {
    const result = resolveTarget(['alien'], 'STRIKE', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('xenomorph');
    expect(result?.source).toBe('npc');
  });

  test('resolves "porte blindee" to blast_door', () => {
    const result = resolveTarget(['porte', 'blindee'], 'OPEN', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('blast_door');
    expect(result?.source).toBe('environment');
  });

  test('resolves "camera" to security_camera', () => {
    const result = resolveTarget(['camera'], 'EXAMINE', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('security_camera');
    expect(result?.source).toBe('environment');
  });

  test('resolves "armoire" to supply_locker', () => {
    const result = resolveTarget(['armoire'], 'OPEN', ctx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('supply_locker');
    expect(result?.source).toBe('environment');
  });

  test('resolves item with aliases field', () => {
    const canister: ResolvedTarget = {
      id: 'oxygen_canister',
      nameKey: 'item.oxygen_canister',
      properties: ['metallic', 'sealed'] as PropertyId[],
      isVirtual: false,
      source: 'inventory',
      aliases: ['bouteille', 'oxygene', 'bonbonne', 'o2', 'recharge'],
    };
    const itemCtx = makeContext({ inventory: [canister] });
    const result = resolveTarget(['bouteille'], 'USE', itemCtx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('oxygen_canister');
    expect(result?.source).toBe('inventory');
  });

  // Bug B regression: short nameKey-derived alias 'ai' must not absorb 'airlock' via substring
  test('resolves "airlock" to an airlock feature, not station_ai (regression)', () => {
    const airlock = makeFeature('main_airlock', ['airlock', 'sas', 'ecluse'], ['metallic', 'openable'] as PropertyId[]);
    const mixedCtx = makeContext({
      npcs: [ai],
      environmentFeatures: [airlock],
    });
    const result = resolveTarget(['airlock'], 'OPEN', mixedCtx);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBe('station_ai');
    expect(result?.id).toBe('main_airlock');
  });

  // Bug B regression: "securite" prefix must not match security_robot via nameKey token 'security'
  test('resolves "camera securite" to security_camera, not security_robot (regression)', () => {
    const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['hostile', 'robotic', 'metallic'] as PropertyId[]);
    const disambCtx = makeContext({
      npcs: [robot],
      environmentFeatures: [camera],
    });
    const result = resolveTarget(['camera', 'securite'], 'EXAMINE', disambCtx);
    expect(result).not.toBeNull();
    expect(result?.id).not.toBe('security_robot');
    expect(result?.id).toBe('security_camera');
  });
});

// === BODY-PART PRIORITY REGRESSION ===

describe('resolveTarget() — body-part before NPC (regression)', () => {
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['hostile', 'robotic', 'metallic'] as PropertyId[]);
  const xenomorph = makeNpc('xenomorph', ['alien', 'creature'], ['hostile', 'organic'] as PropertyId[]);

  const headDef = {
    id: 'head',
    nameKey: 'bodypart.head' as const,
    aliases: ['tete', 'crane', 'caboche'],
    baseProperties: ['fragile'] as PropertyId[],
  };
  const clawDef = {
    id: 'claw',
    nameKey: 'bodypart.claw' as const,
    aliases: ['griffe', 'serre', 'ongle'],
    baseProperties: ['sharp', 'bladed'] as PropertyId[],
  };

  const bodyCtx = makeContext({
    npcs: [robot, xenomorph],
    bodyParts: [headDef, clawDef],
  });

  // Bug C regression: possessive body-part phrase must resolve to virtual part, not whole NPC
  test('"tete robot" → security_robot_head (not security_robot)', () => {
    const result = resolveTarget(['tete', 'robot'], 'STRIKE', bodyCtx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('security_robot_head');
    expect(result?.source).toBe('npc_part');
    expect(result?.isVirtual).toBe(true);
  });

  test('"griffe alien" → xenomorph_claw (not xenomorph)', () => {
    const result = resolveTarget(['griffe', 'alien'], 'CUT', bodyCtx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('xenomorph_claw');
    expect(result?.source).toBe('npc_part');
  });

  // Ensure plain NPC still resolves when no body-part token present
  test('"robot" alone → security_robot (whole NPC)', () => {
    const result = resolveTarget(['robot'], 'STRIKE', bodyCtx);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('security_robot');
    expect(result?.source).toBe('npc');
  });
});

// === USER FEEDBACK REGRESSIONS (2026-02) ===

describe('resolveTarget() — single-NPC contextual fallback', () => {
  const xenomorph = makeNpc('xenomorph', ['xenomorphe', 'alien', 'creature'], []);

  test('empty target tokens after verb alias filtering + single NPC → NPC (je le frappe)', () => {
    // "je le frappe" → "le" stripped (stop word), "frappe" = STRIKE alias → filtered away → empty target
    const ctx = makeContext({ npcs: [xenomorph] });
    const result = resolveTarget(['frappe'], 'STRIKE', ctx);
    expect(result?.id).toBe('xenomorph');
    expect(result?.source).toBe('npc');
  });

  test('no fallback when 0 NPCs in scene', () => {
    const ctx = makeContext({ npcs: [] });
    const result = resolveTarget(['frappe'], 'STRIKE', ctx);
    // Falls through to abstract environment
    expect(result?.source).toBe('abstract');
  });

  test('no fallback when 2+ NPCs in scene (ambiguous)', () => {
    const robot = makeNpc('security_robot', ['robot'], []);
    const ctx = makeContext({ npcs: [xenomorph, robot] });
    const result = resolveTarget(['frappe'], 'STRIKE', ctx);
    // Cannot determine which NPC → abstract fallback
    expect(result?.source).toBe('abstract');
  });

  test('intransitive verbs still return null with empty target tokens', () => {
    const ctx = makeContext({ npcs: [xenomorph] });
    const result = resolveTarget([], 'WAIT', ctx);
    expect(result).toBeNull();
  });
});

describe('resolveTarget() — generic NPC reference words', () => {
  const genericNpcRefs = new Set(['lui', 'elle', 'eux', 'ennemi', 'enemi', 'adversaire', 'cible', 'creature', 'monstre', 'bete', 'alien']);
  const xenomorph = makeNpc('xenomorph', ['xenomorphe'], []);
  const crew = makeNpc('parasitized_crewmember', ['membre', 'equipage', 'infecte'], []);

  test('"ennemi" with single NPC + genericNpcRefs → resolves to NPC (j\'inspecte l\'ennemi)', () => {
    const ctx = makeContext({ npcs: [xenomorph] });
    const result = resolveTarget(['ennemi'], 'EXAMINE', ctx, genericNpcRefs);
    expect(result?.id).toBe('xenomorph');
    expect(result?.source).toBe('npc');
  });

  test('"enemi" (typo) with single NPC + genericNpcRefs → resolves to NPC', () => {
    const ctx = makeContext({ npcs: [crew] });
    const result = resolveTarget(['enemi'], 'EXAMINE', ctx, genericNpcRefs);
    expect(result?.id).toBe('parasitized_crewmember');
    expect(result?.source).toBe('npc');
  });

  test('"lui" pronoun with single NPC + genericNpcRefs → resolves to NPC (je lui lance un lit)', () => {
    const ctx = makeContext({ npcs: [xenomorph] });
    // "lit" (bed) doesn't match xenomorph, but "lui" is a generic ref
    const result = resolveTarget(['lui', 'lit', 'dessus'], 'THROW', ctx, genericNpcRefs);
    expect(result?.id).toBe('xenomorph');
    expect(result?.source).toBe('npc');
  });

  test('generic ref token ignored when NPC matches by alias (specific match wins)', () => {
    // "alien" is both a generic ref AND a specific alias → NPC resolution happens first
    const ctx = makeContext({ npcs: [xenomorph] });
    const result = resolveTarget(['alien'], 'STRIKE', ctx, genericNpcRefs);
    expect(result?.id).toBe('xenomorph');
    expect(result?.source).toBe('npc');
  });

  test('generic ref without genericNpcRefs parameter → abstract fallback', () => {
    // Without the optional param, no generic-ref resolution
    const ctx = makeContext({ npcs: [xenomorph] });
    const result = resolveTarget(['ennemi'], 'EXAMINE', ctx);
    expect(result?.source).toBe('abstract');
  });

  test('generic ref with 2 NPCs → abstract fallback (ambiguous)', () => {
    const robot = makeNpc('security_robot', ['robot'], []);
    const ctx = makeContext({ npcs: [xenomorph, robot] });
    const result = resolveTarget(['ennemi'], 'EXAMINE', ctx, genericNpcRefs);
    // 2 NPCs → cannot determine which → fallback
    expect(result?.source).toBe('abstract');
  });
});

describe('resolveTarget() — adjacent transposition fuzzy matching', () => {
  const ductTape: ResolvedTarget = {
    id: 'duct_tape',
    nameKey: 'item.duct_tape',
    properties: [],
    isVirtual: false,
    source: 'inventory',
    aliases: ['ruban', 'adhesif', 'scotch', 'rouleau'],
  };

  test('"rouelau" (adjacent transposition of "rouleau") resolves to duct_tape', () => {
    const ctx = makeContext({ inventory: [ductTape] });
    const result = resolveTarget(['rouelau'], 'TAKE', ctx);
    expect(result?.id).toBe('duct_tape');
    expect(result?.source).toBe('inventory');
  });

  test('double-substitution typo (edit distance 2) does not resolve', () => {
    // "rxulbau" differs from "rouleau" at positions 1 AND 4 (not adjacent, not a swap)
    const ctx = makeContext({ inventory: [ductTape] });
    const result = resolveTarget(['rxulbau'], 'TAKE', ctx);
    // edit distance 2, no adjacent swap → should not match
    expect(result?.source).toBe('abstract');
  });
});
