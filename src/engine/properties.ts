// ---------------------------------------------------------------------------
// src/engine/properties.ts — Property registry and inheritance system
// ---------------------------------------------------------------------------

import type { StringKey } from '@i18n/types';
import type { ItemType, NPCType, EnvironmentFeatureType } from './types';

// === PROPERTY ID UNION ===

/** All valid property identifiers */
export type PropertyId =
  // Physical (20)
  | 'tangible' | 'visible' | 'small' | 'liftable' | 'holdable'
  | 'heavy' | 'rigid' | 'flexible' | 'soft' | 'fragile'
  | 'breakable' | 'malleable' | 'flat' | 'sharp' | 'blunt'
  | 'pointed' | 'hollow' | 'sealed' | 'transparent' | 'reflective'
  // Material (8)
  | 'metallic' | 'organic' | 'synthetic' | 'conductive'
  | 'flammable' | 'corrosive' | 'toxic' | 'radioactive'
  // Functional (22)
  | 'electronic' | 'mechanical' | 'programmable' | 'powered' | 'unpowered'
  | 'secured' | 'locked' | 'openable' | 'lockable' | 'readable'
  | 'data_storage' | 'usable' | 'equippable' | 'edible' | 'drinkable'
  | 'component' | 'heat_source' | 'light_source' | 'liquid' | 'liquid_source'
  | 'power_source' | 'ranged'
  // Entity (10)
  | 'sentient' | 'alive' | 'robotic' | 'hostile' | 'neutral'
  | 'friendly' | 'willing' | 'wounded' | 'dead' | 'unconscious'
  // Environmental (10)
  | 'dark' | 'lit' | 'pressurized' | 'depressurized' | 'flooded'
  | 'on_fire' | 'zero_g' | 'climbable' | 'cramped' | 'open_space'
  // Additional (implied by verb requirements and item definitions)
  | 'cuttable' | 'large' | 'bladed' | 'injectable' | 'organic_compatible'
  | 'sticky' | 'broken' | 'attached' | 'port' | 'coverable' | 'easily_repairable'
  | 'open' | 'active' | 'inactive' | 'damaged';

/** All valid property IDs as a runtime array */
export const PROPERTY_IDS: readonly PropertyId[] = [
  // Physical
  'tangible', 'visible', 'small', 'liftable', 'holdable',
  'heavy', 'rigid', 'flexible', 'soft', 'fragile',
  'breakable', 'malleable', 'flat', 'sharp', 'blunt',
  'pointed', 'hollow', 'sealed', 'transparent', 'reflective',
  // Material
  'metallic', 'organic', 'synthetic', 'conductive',
  'flammable', 'corrosive', 'toxic', 'radioactive',
  // Functional
  'electronic', 'mechanical', 'programmable', 'powered', 'unpowered',
  'secured', 'locked', 'openable', 'lockable', 'readable',
  'data_storage', 'usable', 'equippable', 'edible', 'drinkable',
  'component', 'heat_source', 'light_source', 'liquid', 'liquid_source',
  'power_source', 'ranged',
  // Entity
  'sentient', 'alive', 'robotic', 'hostile', 'neutral',
  'friendly', 'willing', 'wounded', 'dead', 'unconscious',
  // Environmental
  'dark', 'lit', 'pressurized', 'depressurized', 'flooded',
  'on_fire', 'zero_g', 'climbable', 'cramped', 'open_space',
  // Additional
  'cuttable', 'large', 'bladed', 'injectable', 'organic_compatible',
  'sticky', 'broken', 'attached', 'port', 'coverable', 'easily_repairable',
  'open', 'active', 'inactive', 'damaged',
] as const;

// === PROPERTY METADATA ===

/** Metadata for a single property */
export interface PropertyMeta {
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
}

/** Registry mapping every property to its metadata */
export type PropertyRegistry = Readonly<Record<PropertyId, PropertyMeta>>;

/** Build registry with consistent key naming */
function buildRegistry(): PropertyRegistry {
  const registry: Record<string, PropertyMeta> = {};
  for (const id of PROPERTY_IDS) {
    registry[id] = {
      nameKey: `property.${id}` as StringKey,
      descriptionKey: `property.${id}.description` as StringKey,
    };
  }
  return registry as PropertyRegistry;
}

export const PROPERTY_REGISTRY: PropertyRegistry = buildRegistry();

// === TYPE BASE PROPERTIES (INHERITANCE) ===

/** Base property sets for each object category and type */
export interface TypeBaseProperties {
  readonly item: Readonly<Record<ItemType, readonly PropertyId[]>>;
  readonly npc: Readonly<Record<NPCType, readonly PropertyId[]>>;
  readonly environment: Readonly<Record<EnvironmentFeatureType, readonly PropertyId[]>>;
}

export const TYPE_BASE_PROPERTIES: TypeBaseProperties = {
  item: {
    tool:       ['tangible', 'liftable', 'holdable', 'small', 'usable'],
    weapon:     ['tangible', 'liftable', 'holdable', 'usable'],
    consumable: ['tangible', 'liftable', 'small', 'usable'],
    key_item:   ['tangible', 'liftable', 'small'],
    data:       ['tangible', 'liftable', 'small', 'readable', 'data_storage'],
    misc:       ['tangible', 'liftable'],
  },
  npc: {
    human:    ['tangible', 'visible', 'sentient', 'alive', 'organic'],
    android:  ['tangible', 'visible', 'sentient', 'robotic', 'electronic', 'mechanical', 'metallic'],
    robot:    ['tangible', 'visible', 'robotic', 'electronic', 'mechanical', 'metallic'],
    creature: ['tangible', 'visible', 'alive', 'organic'],
    corpse:   ['tangible', 'visible', 'dead', 'organic', 'heavy'],
    wreck:    ['tangible', 'visible', 'dead', 'metallic', 'heavy', 'component'],
  },
  environment: {
    door:      ['tangible', 'visible', 'openable', 'lockable', 'mechanical', 'breakable', 'metallic'],
    window:    ['tangible', 'visible', 'transparent', 'breakable', 'fragile', 'sealed'],
    terminal:  ['tangible', 'visible', 'electronic', 'readable', 'programmable', 'usable'],
    vent:      ['tangible', 'visible', 'openable', 'climbable', 'cramped', 'hollow'],
    pipe:      ['tangible', 'visible', 'hollow', 'metallic', 'rigid'],
    panel:     ['tangible', 'visible', 'flat', 'metallic', 'breakable', 'component'],
    camera:    ['tangible', 'visible', 'electronic'],
    airlock:   ['tangible', 'visible', 'openable', 'lockable', 'mechanical', 'sealed'],
    container:  ['tangible', 'visible', 'openable', 'hollow', 'liftable'],
    wiring:     ['tangible', 'visible', 'flexible', 'conductive', 'electronic', 'component', 'flammable'],
    mechanical: ['tangible', 'visible', 'mechanical', 'metallic', 'usable'],
  },
} as const;

// === PROPERTY RESOLUTION ===

/** Input for resolving the full property set of an object */
export interface ResolveInput {
  readonly objectCategory: 'item' | 'npc' | 'environment';
  readonly baseType: ItemType | NPCType | EnvironmentFeatureType;
  readonly extra_props?: readonly PropertyId[];
  readonly remove_props?: readonly PropertyId[];
}

/**
 * Resolves the full set of properties for an object by merging
 * base type properties with extra_props and removing remove_props.
 * Returns a deduplicated array.
 */
export function resolveProperties(input: ResolveInput): readonly PropertyId[] {
  let base: readonly PropertyId[] | undefined;

  if (input.objectCategory === 'item') {
    base = TYPE_BASE_PROPERTIES.item[input.baseType as ItemType];
  } else if (input.objectCategory === 'npc') {
    base = TYPE_BASE_PROPERTIES.npc[input.baseType as NPCType];
  } else {
    base = TYPE_BASE_PROPERTIES.environment[input.baseType as EnvironmentFeatureType];
  }

  if (!base) return [];

  const merged = new Set<PropertyId>(base);

  if (input.extra_props) {
    for (const p of input.extra_props) {
      merged.add(p);
    }
  }

  if (input.remove_props) {
    for (const p of input.remove_props) {
      merged.delete(p);
    }
  }

  return [...merged];
}
