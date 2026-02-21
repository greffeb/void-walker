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
      expect(part.aliases.length).toBeGreaterThan(0);
      expect(Array.isArray(part.baseProperties)).toBe(true);
    }
  });

  test('contains standard parts: bras, tete, jambe', () => {
    expect(BODY_PARTS.has('bras')).toBe(true);
    expect(BODY_PARTS.has('tete')).toBe(true);
    expect(BODY_PARTS.has('jambe')).toBe(true);
  });

  test('alien parts: griffe, queue, antenne', () => {
    expect(BODY_PARTS.has('griffe')).toBe(true);
    expect(BODY_PARTS.has('queue')).toBe(true);
    expect(BODY_PARTS.has('antenne')).toBe(true);
  });
});

// === BODY PART RESOLUTION ===

describe('resolveBodyPart()', () => {
  const xenomorph = makeNpc('xenomorph', ['xenomorphe', 'alien', 'creature'], ['hostile', 'organic'] as PropertyId[]);
  const robot = makeNpc('security_robot', ['robot', 'sentinelle'], ['hostile', 'robotic', 'metallic'] as PropertyId[]);

  test('resolves "tete" of xenomorph', () => {
    const result = resolveBodyPart(['tete', 'xenomorphe'], [xenomorph]);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('xenomorph_tete');
    expect(result?.isVirtual).toBe(true);
    expect(result?.source).toBe('npc_part');
  });

  test('virtual body part inherits NPC material properties', () => {
    const result = resolveBodyPart(['bras', 'robot'], [robot]);
    expect(result).not.toBeNull();
    expect(result?.properties).toContain('metallic');
    expect(result?.properties).toContain('attached');
    expect(result?.properties).toContain('tangible');
  });

  test('returns null when no body part found', () => {
    const result = resolveBodyPart(['robot'], [robot]);
    expect(result).toBeNull();
  });

  test('returns null when no matching NPC', () => {
    const result = resolveBodyPart(['tete', 'fantome'], [robot]);
    expect(result).toBeNull();
  });

  test('alien body part "griffe" resolved on xenomorph', () => {
    const result = resolveBodyPart(['griffe', 'alien'], [xenomorph]);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('xenomorph_griffe');
    expect(result?.properties).toContain('sharp');
    expect(result?.properties).toContain('organic');
  });
});

// === TARGET RESOLUTION ===

describe('resolveTarget()', () => {
  const pistolet = makeTarget('pistolet_laser', ['ranged', 'electronic'] as PropertyId[], 'inventory');
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
    expect(result?.id).toBe('pistolet_laser');
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
});
