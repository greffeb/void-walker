// ---------------------------------------------------------------------------
// src/content/npcs.ts — NPC archetype definitions
// ---------------------------------------------------------------------------

import type { NPCType, AggressionPattern } from '../engine/types';
import type { VerbId } from '../engine/verbs';
import type { PropertyId } from '../engine/properties';
import { resolveProperties } from '../engine/properties';
import type { StringKey } from '../i18n/types';

// === WEAK POINT DEFINITION ===

export interface NPCWeakPointDefinition {
  readonly id: string;
  readonly nameKey: StringKey;
  readonly discoverMethod: 'examine' | 'scan' | 'combat_hint' | 'lore';
  readonly targetVerbs: readonly VerbId[];
  readonly targetProperties: readonly PropertyId[];
  readonly damageMultiplier: number;
  readonly hintKey: StringKey;
  readonly exploitKey: StringKey;
}

// === NPC DEFINITION ===

export interface NPCDefinition {
  readonly id: string;
  readonly type: NPCType;
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
  readonly aliasesKey: StringKey;
  readonly extra_props: readonly PropertyId[];
  readonly hp: number;
  readonly damage: number;
  readonly dodgeChance: number;
  readonly aggressionPattern: AggressionPattern;
  /** NPC attack stat for combat rolls (defaults to damage if absent) */
  readonly attack?: number;
  /** NPC defense: flat damage reduction */
  readonly defense?: number;
  /** DC for player to flee this NPC */
  readonly fleeDC?: number;
  /** Weak point definition for combat */
  readonly weakPoint?: NPCWeakPointDefinition;
}

// === NPC LIST ===

const NPCS_ARRAY: readonly NPCDefinition[] = [
  {
    id: 'security_robot',
    type: 'robot',
    nameKey: 'npc.security_robot',
    descriptionKey: 'npc.security_robot.description',
    aliasesKey: 'npc.security_robot.aliases',
    extra_props: ['hostile', 'ranged', 'heavy', 'breakable'],
    hp: 15,
    damage: 3,
    attack: 4,
    defense: 2,
    fleeDC: 10,
    dodgeChance: 0.1,
    aggressionPattern: 'aggressive',
    weakPoint: {
      id: 'cooling_module',
      nameKey: 'wp.cooling_module',
      discoverMethod: 'examine',
      targetVerbs: ['STRIKE', 'SABOTAGE', 'BREAK', 'SHOOT'],
      targetProperties: ['mechanical'],
      damageMultiplier: 2.0,
      hintKey: 'wp.cooling_module.hint',
      exploitKey: 'wp.cooling_module.exploit',
    },
  },
  {
    id: 'xenomorph',
    type: 'creature',
    nameKey: 'npc.xenomorph',
    descriptionKey: 'npc.xenomorph.description',
    aliasesKey: 'npc.xenomorph.aliases',
    extra_props: ['hostile', 'sharp', 'toxic', 'heavy'],
    hp: 20,
    damage: 5,
    attack: 7,
    defense: 2,
    fleeDC: 14,
    dodgeChance: 0.3,
    aggressionPattern: 'ambush',
    weakPoint: {
      id: 'acid_sac',
      nameKey: 'wp.acid_sac',
      discoverMethod: 'combat_hint',
      targetVerbs: ['STRIKE', 'CUT', 'SHOOT', 'THROW'],
      targetProperties: ['organic'],
      damageMultiplier: 2.5,
      hintKey: 'wp.acid_sac.hint',
      exploitKey: 'wp.acid_sac.exploit',
    },
  },
  {
    id: 'wounded_android',
    type: 'android',
    nameKey: 'npc.wounded_android',
    descriptionKey: 'npc.wounded_android.description',
    aliasesKey: 'npc.wounded_android.aliases',
    extra_props: ['wounded', 'neutral', 'easily_repairable'],
    hp: 8,
    damage: 1,
    attack: 2,
    defense: 1,
    fleeDC: 6,
    dodgeChance: 0.05,
    aggressionPattern: 'defensive',
    weakPoint: {
      id: 'exposed_wiring_wp',
      nameKey: 'wp.exposed_wiring_wp',
      discoverMethod: 'examine',
      targetVerbs: ['STRIKE', 'CUT', 'SABOTAGE', 'ELECTRIFY'],
      targetProperties: ['conductive'],
      damageMultiplier: 2.0,
      hintKey: 'wp.exposed_wiring_wp.hint',
      exploitKey: 'wp.exposed_wiring_wp.exploit',
    },
  },
  {
    id: 'parasitized_crewmember',
    type: 'human',
    nameKey: 'npc.parasitized_crewmember',
    descriptionKey: 'npc.parasitized_crewmember.description',
    aliasesKey: 'npc.parasitized_crewmember.aliases',
    extra_props: ['hostile', 'wounded', 'toxic'],
    hp: 10,
    damage: 3,
    attack: 5,
    defense: 1,
    fleeDC: 11,
    dodgeChance: 0.15,
    aggressionPattern: 'berserk',
    weakPoint: {
      id: 'parasite_node',
      nameKey: 'wp.parasite_node',
      discoverMethod: 'scan',
      targetVerbs: ['STRIKE', 'CUT', 'SHOOT'],
      targetProperties: ['organic'],
      damageMultiplier: 2.0,
      hintKey: 'wp.parasite_node.hint',
      exploitKey: 'wp.parasite_node.exploit',
    },
  },
  {
    id: 'station_ai',
    type: 'robot',
    nameKey: 'npc.station_ai',
    descriptionKey: 'npc.station_ai.description',
    aliasesKey: 'npc.station_ai.aliases',
    extra_props: ['programmable', 'secured', 'powered'],
    hp: 1,
    damage: 0,
    attack: 0,
    defense: 0,
    fleeDC: 4,
    dodgeChance: 0.0,
    aggressionPattern: 'defensive',
  },
];

/** Ordered list of all NPC definitions */
export const NPC_LIST: readonly NPCDefinition[] = NPCS_ARRAY;

/** NPC definitions indexed by ID */
export const NPC_DEFINITIONS: Readonly<Record<string, NPCDefinition>> = Object.fromEntries(
  NPCS_ARRAY.map((npc) => [npc.id, npc]),
);

/**
 * Resolves the full property set for a given NPC ID.
 * Returns empty array if NPC not found.
 */
export function resolveNPCProperties(id: string): readonly PropertyId[] {
  const npc = NPC_DEFINITIONS[id];
  if (!npc) return [];
  return resolveProperties({
    objectCategory: 'npc',
    baseType: npc.type,
    extra_props: npc.extra_props,
  });
}
