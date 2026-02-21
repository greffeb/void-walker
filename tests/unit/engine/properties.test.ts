// ---------------------------------------------------------------------------
// tests/unit/engine/properties.test.ts — Property registry verification
// ---------------------------------------------------------------------------

import { describe, test, expect } from 'vitest';
import {
  PROPERTY_IDS,
  PROPERTY_REGISTRY,
  TYPE_BASE_PROPERTIES,
  resolveProperties,
} from '../../../src/engine/properties';
import type { PropertyId } from '../../../src/engine/properties';
import { ITEM_TYPES, NPC_TYPES, ENVIRONMENT_FEATURE_TYPES } from '../../../src/engine/types';

describe('PropertyId', () => {
  test('has at least 70 properties', () => {
    expect(PROPERTY_IDS.length).toBeGreaterThanOrEqual(70);
  });

  test('every property id is a non-empty string', () => {
    for (const id of PROPERTY_IDS) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
  });

  test('no duplicate property ids', () => {
    const unique = new Set(PROPERTY_IDS);
    expect(unique.size).toBe(PROPERTY_IDS.length);
  });
});

describe('PROPERTY_REGISTRY', () => {
  test('every property in PROPERTY_IDS has a registry entry', () => {
    for (const id of PROPERTY_IDS) {
      expect(PROPERTY_REGISTRY[id]).toBeDefined();
    }
  });

  test('every registry entry has a nameKey and descriptionKey', () => {
    for (const id of PROPERTY_IDS) {
      const entry = PROPERTY_REGISTRY[id];
      expect(entry).toBeDefined();
      if (!entry) return;
      expect(typeof entry.nameKey).toBe('string');
      expect(typeof entry.descriptionKey).toBe('string');
      expect(entry.nameKey).toBe(`property.${id}`);
      expect(entry.descriptionKey).toBe(`property.${id}.description`);
    }
  });
});

describe('TYPE_BASE_PROPERTIES — items', () => {
  test('tool inherits tangible, liftable, holdable, small, usable', () => {
    const props = TYPE_BASE_PROPERTIES.item.tool;
    expect(props).toContain('tangible');
    expect(props).toContain('liftable');
    expect(props).toContain('holdable');
    expect(props).toContain('small');
    expect(props).toContain('usable');
  });

  test('weapon inherits tangible, liftable, holdable, usable', () => {
    const props = TYPE_BASE_PROPERTIES.item.weapon;
    expect(props).toContain('tangible');
    expect(props).toContain('liftable');
    expect(props).toContain('holdable');
    expect(props).toContain('usable');
  });

  test('all item types have base properties', () => {
    for (const type of ITEM_TYPES) {
      const props = TYPE_BASE_PROPERTIES.item[type];
      expect(props).toBeDefined();
      expect(props.length).toBeGreaterThan(0);
    }
  });
});

describe('TYPE_BASE_PROPERTIES — npcs', () => {
  test('human npc inherits sentient, alive, organic, tangible, visible', () => {
    const props = TYPE_BASE_PROPERTIES.npc.human;
    expect(props).toContain('sentient');
    expect(props).toContain('alive');
    expect(props).toContain('organic');
    expect(props).toContain('tangible');
    expect(props).toContain('visible');
  });

  test('all npc types have base properties', () => {
    for (const type of NPC_TYPES) {
      const props = TYPE_BASE_PROPERTIES.npc[type];
      expect(props).toBeDefined();
      expect(props.length).toBeGreaterThan(0);
    }
  });
});

describe('TYPE_BASE_PROPERTIES — environment', () => {
  test('door inherits openable, lockable, mechanical, breakable, metallic', () => {
    const props = TYPE_BASE_PROPERTIES.environment.door;
    expect(props).toContain('openable');
    expect(props).toContain('lockable');
    expect(props).toContain('mechanical');
    expect(props).toContain('breakable');
    expect(props).toContain('metallic');
  });

  test('all environment feature types have base properties', () => {
    for (const type of ENVIRONMENT_FEATURE_TYPES) {
      const props = TYPE_BASE_PROPERTIES.environment[type];
      expect(props).toBeDefined();
      expect(props.length).toBeGreaterThan(0);
    }
  });
});

describe('resolveProperties()', () => {
  test('returns base type props when no extras or removals', () => {
    const resolved = resolveProperties({
      objectCategory: 'item',
      baseType: 'tool',
    });
    expect(resolved).toContain('tangible');
    expect(resolved).toContain('usable');
    expect(resolved).toContain('small');
  });

  test('merges base type props with extra_props', () => {
    const resolved = resolveProperties({
      objectCategory: 'item',
      baseType: 'tool',
      extra_props: ['electronic', 'powered'],
    });
    expect(resolved).toContain('tangible');
    expect(resolved).toContain('usable');
    expect(resolved).toContain('electronic');
    expect(resolved).toContain('powered');
  });

  test('remove_props removes a property from the base set', () => {
    const resolved = resolveProperties({
      objectCategory: 'item',
      baseType: 'weapon',
      extra_props: ['metallic', 'rigid', 'blunt', 'heavy', 'conductive'],
      remove_props: ['small'],
    });
    expect(resolved).not.toContain('small');
    expect(resolved).toContain('metallic');
  });

  test('returns no duplicates', () => {
    const resolved = resolveProperties({
      objectCategory: 'item',
      baseType: 'tool',
      extra_props: ['tangible'], // already in base
    });
    const count = resolved.filter((p: PropertyId) => p === 'tangible').length;
    expect(count).toBe(1);
  });

  test('result contains only valid PropertyIds', () => {
    const propSet = new Set<string>(PROPERTY_IDS);
    const resolved = resolveProperties({
      objectCategory: 'item',
      baseType: 'tool',
      extra_props: ['electronic', 'mechanical'],
    });
    for (const p of resolved) {
      expect(propSet.has(p)).toBe(true);
    }
  });

  test('works for npc type', () => {
    const resolved = resolveProperties({
      objectCategory: 'npc',
      baseType: 'human',
      extra_props: ['hostile'],
    });
    expect(resolved).toContain('sentient');
    expect(resolved).toContain('hostile');
  });

  test('works for environment type', () => {
    const resolved = resolveProperties({
      objectCategory: 'environment',
      baseType: 'terminal',
      extra_props: ['powered'],
    });
    expect(resolved).toContain('electronic');
    expect(resolved).toContain('readable');
    expect(resolved).toContain('powered');
  });
});
