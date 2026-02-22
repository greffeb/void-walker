// ---------------------------------------------------------------------------
// src/content/sceneBuilder.ts — Scene construction helpers for REPL & tests
// ---------------------------------------------------------------------------
// Extracted from tests/playtest/cli.ts to be shared between CLI and Web REPL.
// Lives in content layer: imports from engine + i18n, never from UI.
// ---------------------------------------------------------------------------

import { BODY_PARTS } from '../engine/resolver';
import { ITEM_LIST, ITEM_DEFINITIONS, resolveItemProperties } from './items';
import { NPC_LIST, NPC_DEFINITIONS, resolveNPCProperties } from './npcs';
import {
  ENVIRONMENT_FEATURE_LIST,
  ENVIRONMENT_FEATURE_DEFINITIONS,
  resolveEnvironmentProperties,
} from './environments';
import { getEntityAliases } from './helpers';
import type {
  SceneContext,
  ResolvedTarget,
  NpcInstance,
  EnvironmentFeatureInstance,
  BodyPartDefinition,
  EnvironmentCondition,
} from '../engine/types';
import type { StringKey } from '../i18n/types';

// === ITEM RESOLUTION ===

/**
 * Resolve an item ID into a ResolvedTarget with properties and aliases.
 */
function resolveItem(
  id: string,
  source: 'inventory' | 'location',
): ResolvedTarget | null {
  const def = ITEM_DEFINITIONS[id];
  if (!def) return null;
  return {
    id,
    nameKey: def.nameKey,
    properties: resolveItemProperties(id),
    isVirtual: false,
    source,
    aliases: [
      ...getEntityAliases(def.aliasesKey, def.nameKey),
      ...id.replace(/_/g, ' ').split(' '),
    ],
  };
}

/**
 * Resolve a list of item IDs into ResolvedTargets.
 */
function resolveItems(
  ids: readonly string[],
  source: 'inventory' | 'location',
): ResolvedTarget[] {
  return ids.flatMap((id) => {
    const resolved = resolveItem(id, source);
    return resolved ? [resolved] : [];
  });
}

// === NPC RESOLUTION ===

/**
 * Resolve all NPCs into NpcInstances.
 */
function resolveAllNPCs(): NpcInstance[] {
  return NPC_LIST.flatMap((npcDef) => {
    const def = NPC_DEFINITIONS[npcDef.id];
    if (!def) return [];
    return [{
      id: npcDef.id,
      definitionId: npcDef.id,
      nameKey: def.nameKey,
      aliases: [
        ...getEntityAliases(def.aliasesKey, def.nameKey),
        ...npcDef.id.replace(/_/g, ' ').split(' '),
      ],
      properties: resolveNPCProperties(npcDef.id),
      hp: def.hp,
    }];
  });
}

// === ENVIRONMENT FEATURE RESOLUTION ===

/**
 * Resolve all environment features into EnvironmentFeatureInstances.
 */
function resolveAllEnvironmentFeatures(): EnvironmentFeatureInstance[] {
  return ENVIRONMENT_FEATURE_LIST.flatMap((fDef) => {
    const def = ENVIRONMENT_FEATURE_DEFINITIONS[fDef.id];
    if (!def) return [];
    return [{
      id: fDef.id,
      definitionId: fDef.id,
      nameKey: def.nameKey,
      aliases: [
        ...getEntityAliases(def.aliasesKey, def.nameKey),
        ...fDef.id.replace(/_/g, ' ').split(' '),
      ],
      properties: resolveEnvironmentProperties(fDef.id),
    }];
  });
}

// === BODY PARTS RESOLUTION ===

/**
 * Build body part definitions with locale-aware aliases.
 */
function resolveBodyParts(): BodyPartDefinition[] {
  return [...BODY_PARTS.entries()].map(([_id, def]) => ({
    id: def.id,
    nameKey: def.nameKey,
    aliases: getEntityAliases(
      `${def.nameKey}.aliases` as StringKey,
      def.nameKey as StringKey,
    ),
    baseProperties: [...def.baseProperties],
  }));
}

// === DEFAULT CONNECTED LOCATIONS ===

const DEFAULT_CONNECTED_LOCATIONS = [
  { id: 'corridor_a', aliases: ['corridor', 'couloir'] },
  { id: 'sas_b', aliases: ['sas', 'airlock', 'sas-b'] },
  { id: 'infirmerie', aliases: ['infirmerie', 'medbay'] },
] as const;

// === SCENE BUILDERS ===

/**
 * Build a default scene with all available content.
 * Inventory: first 5 items, location: next 5, all NPCs, all features.
 */
export function buildDefaultScene(): SceneContext {
  const itemIds = ITEM_LIST.map((item) => item.id);
  const inventory = resolveItems(itemIds.slice(0, 5), 'inventory');
  const locationItems = resolveItems(itemIds.slice(5, 10), 'location');

  return {
    inventory,
    locationItems,
    npcs: resolveAllNPCs(),
    environmentFeatures: resolveAllEnvironmentFeatures(),
    connectedLocations: [...DEFAULT_CONNECTED_LOCATIONS],
    suggestions: [],
    environmentConditions: [],
    bodyParts: resolveBodyParts(),
  };
}

/**
 * Build a scene with random environment conditions (dark, zero-g, time pressure).
 */
export function buildChaosScene(): SceneContext {
  const scene = buildDefaultScene();
  const conditions: EnvironmentCondition[] = [];
  if (Math.random() > 0.5) conditions.push('dark');
  if (Math.random() > 0.7) conditions.push('zero_g');
  if (Math.random() > 0.6) conditions.push('time_pressure');
  return { ...scene, environmentConditions: conditions };
}

/**
 * Build a scene from specific inventory/location item IDs (for custom scenarios).
 */
export function buildCustomScene(options: {
  readonly inventoryIds: readonly string[];
  readonly locationIds: readonly string[];
  readonly conditions?: readonly EnvironmentCondition[];
}): SceneContext {
  return {
    inventory: resolveItems(options.inventoryIds, 'inventory'),
    locationItems: resolveItems(options.locationIds, 'location'),
    npcs: resolveAllNPCs(),
    environmentFeatures: resolveAllEnvironmentFeatures(),
    connectedLocations: [...DEFAULT_CONNECTED_LOCATIONS],
    suggestions: [],
    environmentConditions: options.conditions ? [...options.conditions] : [],
    bodyParts: resolveBodyParts(),
  };
}

// Re-export useful content for consumers
export { ITEM_LIST } from './items';
export { NPC_LIST, NPC_DEFINITIONS } from './npcs';
export type { NPCDefinition } from './npcs';
