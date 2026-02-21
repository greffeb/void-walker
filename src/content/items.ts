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
    id: 'pistolet_laser',
    type: 'weapon',
    nameKey: 'item.pistolet_laser',
    descriptionKey: 'item.pistolet_laser.description',
    extra_props: ['electronic', 'ranged', 'light_source', 'small'],
    damageBonus: 3,
  },
  {
    id: 'barre_metal',
    type: 'weapon',
    nameKey: 'item.barre_metal',
    descriptionKey: 'item.barre_metal.description',
    extra_props: ['metallic', 'rigid', 'blunt', 'heavy'],
    remove_props: ['small'],
    damageBonus: 2,
  },
  {
    id: 'couteau',
    type: 'weapon',
    nameKey: 'item.couteau',
    descriptionKey: 'item.couteau.description',
    extra_props: ['metallic', 'sharp', 'bladed', 'small'],
    damageBonus: 1,
  },
  {
    id: 'tube_metallique',
    type: 'weapon',
    nameKey: 'item.tube_metallique',
    descriptionKey: 'item.tube_metallique.description',
    extra_props: ['metallic', 'rigid', 'hollow', 'blunt'],
    damageBonus: 1,
  },
  // --- Tools ---
  {
    id: 'datapad',
    type: 'tool',
    nameKey: 'item.datapad',
    descriptionKey: 'item.datapad.description',
    extra_props: ['electronic', 'readable', 'data_storage', 'programmable'],
  },
  {
    id: 'ruban_adhesif',
    type: 'tool',
    nameKey: 'item.ruban_adhesif',
    descriptionKey: 'item.ruban_adhesif.description',
    extra_props: ['sticky', 'flexible', 'synthetic'],
  },
  {
    id: 'cable',
    type: 'tool',
    nameKey: 'item.cable',
    descriptionKey: 'item.cable.description',
    extra_props: ['flexible', 'conductive', 'synthetic'],
  },
  {
    id: 'scanner',
    type: 'tool',
    nameKey: 'item.scanner',
    descriptionKey: 'item.scanner.description',
    extra_props: ['electronic', 'light_source'],
  },
  {
    id: 'lampe_torche',
    type: 'tool',
    nameKey: 'item.lampe_torche',
    descriptionKey: 'item.lampe_torche.description',
    extra_props: ['electronic', 'light_source'],
  },
  {
    id: 'multitool',
    type: 'tool',
    nameKey: 'item.multitool',
    descriptionKey: 'item.multitool.description',
    extra_props: ['metallic', 'bladed', 'sharp', 'easily_repairable'],
  },
  {
    id: 'extincteur',
    type: 'tool',
    nameKey: 'item.extincteur',
    descriptionKey: 'item.extincteur.description',
    extra_props: ['metallic', 'heavy', 'sealed'],
    remove_props: ['small'],
  },
  {
    id: 'cle_de_maintenance',
    type: 'tool',
    nameKey: 'item.cle_de_maintenance',
    descriptionKey: 'item.cle_de_maintenance.description',
    extra_props: ['metallic', 'mechanical'],
  },
  // --- Consumables ---
  {
    id: 'trousse_medicale',
    type: 'consumable',
    nameKey: 'item.trousse_medicale',
    descriptionKey: 'item.trousse_medicale.description',
    extra_props: ['organic_compatible', 'injectable'],
    healingValue: 5,
  },
  {
    id: 'stimulant',
    type: 'consumable',
    nameKey: 'item.stimulant',
    descriptionKey: 'item.stimulant.description',
    extra_props: ['injectable', 'organic_compatible'],
    healingValue: 3,
  },
  {
    id: 'ration',
    type: 'consumable',
    nameKey: 'item.ration',
    descriptionKey: 'item.ration.description',
    extra_props: ['edible', 'organic'],
    healingValue: 1,
  },
  {
    id: 'oxygene_canister',
    type: 'consumable',
    nameKey: 'item.oxygene_canister',
    descriptionKey: 'item.oxygene_canister.description',
    extra_props: ['metallic', 'sealed', 'heavy'],
    remove_props: ['small'],
  },
  // --- Key Items ---
  {
    id: 'carte_acces',
    type: 'key_item',
    nameKey: 'item.carte_acces',
    descriptionKey: 'item.carte_acces.description',
    extra_props: ['electronic', 'flat', 'data_storage'],
  },
  {
    id: 'combinaison_eva',
    type: 'key_item',
    nameKey: 'item.combinaison_eva',
    descriptionKey: 'item.combinaison_eva.description',
    extra_props: ['equippable', 'sealed', 'synthetic', 'heavy'],
    remove_props: ['small'],
    armorValue: 2,
  },
  // --- Data ---
  {
    id: 'debris',
    type: 'misc',
    nameKey: 'item.debris',
    descriptionKey: 'item.debris.description',
    extra_props: ['metallic', 'rigid', 'component', 'breakable'],
  },
  {
    id: 'boite_de_composants',
    type: 'misc',
    nameKey: 'item.boite_de_composants',
    descriptionKey: 'item.boite_de_composants.description',
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
