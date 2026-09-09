// ---------------------------------------------------------------------------
// tests/unit/engine/nature.test.ts — Decision F: natures and property families
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  natureOf, canBear, findUnclassifiedProperties,
  PROPERTY_FAMILY, PROPERTY_FAMILIES, NATURE_BEARS_FAMILY, NATURES,
} from '../../../src/engine/nature';
import type { Nature } from '../../../src/engine/nature';
import { resolveProperties, PROPERTY_IDS } from '../../../src/engine/properties';
import { ITEM_TYPES, NPC_TYPES, ENVIRONMENT_FEATURE_TYPES } from '../../../src/engine/types';
import type { ItemType, NPCType, EnvironmentFeatureType } from '../../../src/engine/types';

// The 23 base types → 5 natures. This table is the specification: the engine
// derives nature from properties, and this test proves the derivation agrees
// with what each archetype is meant to be.
const ITEM_NATURE: Readonly<Record<ItemType, Nature>> = {
  tool: 'inert',
  weapon: 'inert',
  consumable: 'inert',
  key_item: 'inert',
  data: 'data',
  misc: 'inert',
};

const NPC_NATURE: Readonly<Record<NPCType, Nature>> = {
  human: 'organic',
  android: 'machine',
  robot: 'machine',
  creature: 'organic',
  corpse: 'organic',
  wreck: 'inert',
};

const ENVIRONMENT_NATURE: Readonly<Record<EnvironmentFeatureType, Nature>> = {
  door: 'machine',
  window: 'inert',
  terminal: 'machine',
  vent: 'space',
  pipe: 'inert',
  panel: 'inert',
  camera: 'machine',
  airlock: 'machine',
  container: 'inert',
  wiring: 'machine',
  mechanical: 'machine',
};

describe('property families', () => {
  it('classifies every property exactly once', () => {
    expect(findUnclassifiedProperties()).toEqual([]);
    for (const id of PROPERTY_IDS) {
      expect(PROPERTY_FAMILIES).toContain(PROPERTY_FAMILY[id]);
    }
  });

  it('declares no family for a property that does not exist', () => {
    const known = new Set<string>(PROPERTY_IDS);
    for (const key of Object.keys(PROPERTY_FAMILY)) {
      expect(known.has(key)).toBe(true);
    }
  });
});

describe('plausibility matrix', () => {
  it('is total: 5 natures × 7 families', () => {
    expect(NATURES).toHaveLength(5);
    expect(PROPERTY_FAMILIES).toHaveLength(7);
    for (const nature of NATURES) {
      for (const family of PROPERTY_FAMILIES) {
        expect(typeof NATURE_BEARS_FAMILY[nature][family]).toBe('boolean');
      }
    }
  });

  it('lets no nature bear everything — each has something it cannot be', () => {
    for (const nature of NATURES) {
      const borne = PROPERTY_FAMILIES.filter(f => NATURE_BEARS_FAMILY[nature][f]);
      expect(borne.length).toBeLessThan(PROPERTY_FAMILIES.length);
    }
  });
});

describe('natureOf', () => {
  it('agrees with the declared nature of all 23 base types', () => {
    for (const type of ITEM_TYPES) {
      const props = resolveProperties({ objectCategory: 'item', baseType: type });
      expect({ type, nature: natureOf(props) }).toEqual({ type, nature: ITEM_NATURE[type] });
    }
    for (const type of NPC_TYPES) {
      const props = resolveProperties({ objectCategory: 'npc', baseType: type });
      expect({ type, nature: natureOf(props) }).toEqual({ type, nature: NPC_NATURE[type] });
    }
    for (const type of ENVIRONMENT_FEATURE_TYPES) {
      const props = resolveProperties({ objectCategory: 'environment', baseType: type });
      expect({ type, nature: natureOf(props) }).toEqual({ type, nature: ENVIRONMENT_NATURE[type] });
    }
  });

  it('covers all five natures across the base types', () => {
    const seen = new Set<Nature>([
      ...ITEM_TYPES.map(t => ITEM_NATURE[t]),
      ...NPC_TYPES.map(t => NPC_NATURE[t]),
      ...ENVIRONMENT_FEATURE_TYPES.map(t => ENVIRONMENT_NATURE[t]),
    ]);
    expect([...seen].sort()).toEqual([...NATURES].sort());
  });

  it('falls back to inert when nothing identifies the target', () => {
    expect(natureOf([])).toBe('inert');
    expect(natureOf(['tangible', 'visible'])).toBe('inert');
  });

  it('reads a body before a device: an infected crew member is organic', () => {
    expect(natureOf(['organic', 'alive', 'electronic'])).toBe('organic');
  });
});

describe('canBear', () => {
  it('accepts what the nature supports', () => {
    expect(canBear(['organic', 'alive'], 'edible')).toBe(true);
    expect(canBear(['electronic', 'mechanical'], 'programmable')).toBe(true);
  });

  it('refuses what the nature cannot support', () => {
    expect(canBear(['mechanical', 'metallic', 'openable'], 'edible')).toBe(false);
    expect(canBear(['organic', 'alive'], 'programmable')).toBe(false);
  });

  it('accepts anything in a family the target already exhibits', () => {
    // An android is a machine, and machines do not bear `being` properties —
    // but this one is already sentient, so willingness is merely absent.
    expect(canBear(['electronic', 'mechanical', 'sentient'], 'willing')).toBe(true);
    // A door exhibits nothing of the kind.
    expect(canBear(['mechanical', 'metallic', 'openable'], 'willing')).toBe(false);
  });
});
