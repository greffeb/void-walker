// ---------------------------------------------------------------------------
// src/content/npcs.ts — NPC archetype definitions
// ---------------------------------------------------------------------------

import type { NPCType, AggressionPattern } from '../engine/types';
import type { PropertyId } from '../engine/properties';
import { resolveProperties } from '../engine/properties';
import type { StringKey } from '../i18n/types';

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
    dodgeChance: 0.1,
    aggressionPattern: 'aggressive',
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
    dodgeChance: 0.3,
    aggressionPattern: 'ambush',
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
    dodgeChance: 0.05,
    aggressionPattern: 'defensive',
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
    dodgeChance: 0.15,
    aggressionPattern: 'berserk',
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
    dodgeChance: 0.0,
    aggressionPattern: 'defensive',
  },
] as const;

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
