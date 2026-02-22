// ---------------------------------------------------------------------------
// src/content/items.ts — Item definitions
// ---------------------------------------------------------------------------

import type { ItemType } from '../engine/types';
import type { PropertyId } from '../engine/properties';
import { resolveProperties } from '../engine/properties';
import type { StringKey } from '../i18n/types';

// === ITEM DEFINITION ===

export interface ItemDefinition {
  readonly id: string;
  readonly type: ItemType;
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
  readonly aliasesKey: StringKey;
  readonly extra_props: readonly PropertyId[];
  readonly remove_props?: readonly PropertyId[];
  readonly damageBonus?: number;
  readonly armorValue?: number;
  readonly healingValue?: number;
}

// === ITEM LIST ===

const ITEMS_ARRAY: readonly ItemDefinition[] = [
  // --- Weapons ---
  {
    id: 'laser_pistol',
    type: 'weapon',
    nameKey: 'item.laser_pistol',
    descriptionKey: 'item.laser_pistol.description',
    aliasesKey: 'item.laser_pistol.aliases',
    extra_props: ['electronic', 'ranged', 'light_source', 'small'],
    damageBonus: 3,
  },
  {
    id: 'metal_bar',
    type: 'weapon',
    nameKey: 'item.metal_bar',
    descriptionKey: 'item.metal_bar.description',
    aliasesKey: 'item.metal_bar.aliases',
    extra_props: ['metallic', 'rigid', 'blunt', 'heavy'],
    remove_props: ['small'],
    damageBonus: 2,
  },
  {
    id: 'knife',
    type: 'weapon',
    nameKey: 'item.knife',
    descriptionKey: 'item.knife.description',
    aliasesKey: 'item.knife.aliases',
    extra_props: ['metallic', 'sharp', 'bladed', 'small'],
    damageBonus: 1,
  },
  {
    id: 'metal_tube',
    type: 'weapon',
    nameKey: 'item.metal_tube',
    descriptionKey: 'item.metal_tube.description',
    aliasesKey: 'item.metal_tube.aliases',
    extra_props: ['metallic', 'rigid', 'hollow', 'blunt'],
    damageBonus: 1,
  },
  // --- Tools ---
  {
    id: 'datapad',
    type: 'tool',
    nameKey: 'item.datapad',
    descriptionKey: 'item.datapad.description',
    aliasesKey: 'item.datapad.aliases',
    extra_props: ['electronic', 'readable', 'data_storage', 'programmable'],
  },
  {
    id: 'duct_tape',
    type: 'tool',
    nameKey: 'item.duct_tape',
    descriptionKey: 'item.duct_tape.description',
    aliasesKey: 'item.duct_tape.aliases',
    extra_props: ['sticky', 'flexible', 'synthetic'],
  },
  {
    id: 'cable',
    type: 'tool',
    nameKey: 'item.cable',
    descriptionKey: 'item.cable.description',
    aliasesKey: 'item.cable.aliases',
    extra_props: ['flexible', 'conductive', 'synthetic'],
  },
  {
    id: 'scanner',
    type: 'tool',
    nameKey: 'item.scanner',
    descriptionKey: 'item.scanner.description',
    aliasesKey: 'item.scanner.aliases',
    extra_props: ['electronic', 'light_source'],
  },
  {
    id: 'flashlight',
    type: 'tool',
    nameKey: 'item.flashlight',
    descriptionKey: 'item.flashlight.description',
    aliasesKey: 'item.flashlight.aliases',
    extra_props: ['electronic', 'light_source'],
  },
  {
    id: 'multitool',
    type: 'tool',
    nameKey: 'item.multitool',
    descriptionKey: 'item.multitool.description',
    aliasesKey: 'item.multitool.aliases',
    extra_props: ['metallic', 'bladed', 'sharp', 'easily_repairable'],
  },
  {
    id: 'fire_extinguisher',
    type: 'tool',
    nameKey: 'item.fire_extinguisher',
    descriptionKey: 'item.fire_extinguisher.description',
    aliasesKey: 'item.fire_extinguisher.aliases',
    extra_props: ['metallic', 'heavy', 'sealed'],
    remove_props: ['small'],
  },
  {
    id: 'maintenance_key',
    type: 'tool',
    nameKey: 'item.maintenance_key',
    descriptionKey: 'item.maintenance_key.description',
    aliasesKey: 'item.maintenance_key.aliases',
    extra_props: ['metallic', 'mechanical'],
  },
  // --- Consumables ---
  {
    id: 'medical_kit',
    type: 'consumable',
    nameKey: 'item.medical_kit',
    descriptionKey: 'item.medical_kit.description',
    aliasesKey: 'item.medical_kit.aliases',
    extra_props: ['organic_compatible', 'injectable'],
    healingValue: 5,
  },
  {
    id: 'stimulant',
    type: 'consumable',
    nameKey: 'item.stimulant',
    descriptionKey: 'item.stimulant.description',
    aliasesKey: 'item.stimulant.aliases',
    extra_props: ['injectable', 'organic_compatible'],
    healingValue: 3,
  },
  {
    id: 'ration',
    type: 'consumable',
    nameKey: 'item.ration',
    descriptionKey: 'item.ration.description',
    aliasesKey: 'item.ration.aliases',
    extra_props: ['edible', 'organic'],
    healingValue: 1,
  },
  {
    id: 'oxygen_canister',
    type: 'consumable',
    nameKey: 'item.oxygen_canister',
    descriptionKey: 'item.oxygen_canister.description',
    aliasesKey: 'item.oxygen_canister.aliases',
    extra_props: ['metallic', 'sealed', 'heavy'],
    remove_props: ['small'],
  },
  // --- Key Items ---
  {
    id: 'access_card',
    type: 'key_item',
    nameKey: 'item.access_card',
    descriptionKey: 'item.access_card.description',
    aliasesKey: 'item.access_card.aliases',
    extra_props: ['electronic', 'flat', 'data_storage'],
  },
  {
    id: 'eva_suit',
    type: 'key_item',
    nameKey: 'item.eva_suit',
    descriptionKey: 'item.eva_suit.description',
    aliasesKey: 'item.eva_suit.aliases',
    extra_props: ['equippable', 'sealed', 'synthetic', 'heavy'],
    remove_props: ['small'],
    armorValue: 2,
  },
  // --- Misc ---
  {
    id: 'debris',
    type: 'misc',
    nameKey: 'item.debris',
    descriptionKey: 'item.debris.description',
    aliasesKey: 'item.debris.aliases',
    extra_props: ['metallic', 'rigid', 'component', 'breakable'],
  },
  {
    id: 'component_box',
    type: 'misc',
    nameKey: 'item.component_box',
    descriptionKey: 'item.component_box.description',
    aliasesKey: 'item.component_box.aliases',
    extra_props: ['component', 'metallic', 'openable', 'hollow'],
  },
] as const;

/** Ordered list of all item definitions */
export const ITEM_LIST: readonly ItemDefinition[] = ITEMS_ARRAY;

/** Item definitions indexed by ID */
export const ITEM_DEFINITIONS: Readonly<Record<string, ItemDefinition>> = Object.fromEntries(
  ITEMS_ARRAY.map((item) => [item.id, item]),
);

/**
 * Resolves the full property set for a given item ID.
 * Returns empty array if item not found.
 */
export function resolveItemProperties(id: string): readonly PropertyId[] {
  const item = ITEM_DEFINITIONS[id];
  if (!item) return [];
  return resolveProperties({
    objectCategory: 'item',
    baseType: item.type,
    extra_props: item.extra_props,
    remove_props: item.remove_props,
  });
}
