// ---------------------------------------------------------------------------
// src/content/classes.ts — Player class definitions
// ---------------------------------------------------------------------------

import type { PlayerClass, PlayerClassName } from '../engine/types';

// === CLASS DEFINITIONS ===

export const CLASSES: Readonly<Record<PlayerClassName, PlayerClass>> = {
  marine: {
    id: 'marine',
    nameKey: 'class.marine',
    descriptionKey: 'class.marine.description',
    flavorKey: 'class.marine.flavor',
    baseStats: { FOR: 4, DEF: 3, AGI: 4, INT: 1, PER: 2, CHA: 1, LCK: 3 },
    startingHp: 14,
    startingItems: ['pistolet_laser', 'couteau', 'ration'],
    passiveAbility: {
      id: 'combat_instinct',
      nameKey: 'passive.combat_instinct',
      descriptionKey: 'passive.combat_instinct.description',
      effect: 'COMBAT_DAMAGE_BONUS',
      value: 1,
    },
  },
  engineer: {
    id: 'engineer',
    nameKey: 'class.engineer',
    descriptionKey: 'class.engineer.description',
    flavorKey: 'class.engineer.flavor',
    baseStats: { FOR: 1, DEF: 2, AGI: 2, INT: 5, PER: 3, CHA: 2, LCK: 3 },
    startingHp: 10,
    startingItems: ['multitool', 'datapad', 'cable'],
    passiveAbility: {
      id: 'jury_rig',
      nameKey: 'passive.jury_rig',
      descriptionKey: 'passive.jury_rig.description',
      effect: 'REPAIR_ALL_BROKEN',
      value: null,
    },
  },
  medic: {
    id: 'medic',
    nameKey: 'class.medic',
    descriptionKey: 'class.medic.description',
    flavorKey: 'class.medic.flavor',
    baseStats: { FOR: 2, DEF: 2, AGI: 2, INT: 3, PER: 3, CHA: 4, LCK: 2 },
    startingHp: 12,
    startingItems: ['trousse_medicale', 'stimulant', 'scanner'],
    passiveAbility: {
      id: 'field_medic',
      nameKey: 'passive.field_medic',
      descriptionKey: 'passive.field_medic.description',
      effect: 'HEALING_BONUS',
      value: 2,
    },
  },
} as const;

/** Ordered list of all classes */
export const CLASS_LIST: readonly PlayerClass[] = [
  CLASSES.marine,
  CLASSES.engineer,
  CLASSES.medic,
] as const;
