// ---------------------------------------------------------------------------
// src/content/environments.ts — Environment feature definitions
// ---------------------------------------------------------------------------

import type { EnvironmentFeatureType } from '../engine/types';
import type { PropertyId } from '../engine/properties';
import { resolveProperties } from '../engine/properties';
import type { StringKey } from '../i18n/types';

// === ENVIRONMENT FEATURE DEFINITION ===

export interface EnvironmentFeatureDefinition {
  readonly id: string;
  readonly type: EnvironmentFeatureType;
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
  readonly aliasesKey: StringKey;
  readonly extra_props: readonly PropertyId[];
  readonly powerState?: 'powered' | 'unpowered';
}

// === ENVIRONMENT FEATURE LIST ===

const FEATURES_ARRAY: readonly EnvironmentFeatureDefinition[] = [
  {
    id: 'blast_door',
    type: 'door',
    nameKey: 'env.blast_door',
    descriptionKey: 'env.blast_door.description',
    aliasesKey: 'env.blast_door.aliases',
    extra_props: ['heavy', 'sealed', 'electronic', 'powered'],
    powerState: 'powered',
  },
  {
    id: 'observation_window',
    type: 'window',
    nameKey: 'env.observation_window',
    descriptionKey: 'env.observation_window.description',
    aliasesKey: 'env.observation_window.aliases',
    extra_props: ['large', 'rigid'],
  },
  {
    id: 'command_terminal',
    type: 'terminal',
    nameKey: 'env.command_terminal',
    descriptionKey: 'env.command_terminal.description',
    aliasesKey: 'env.command_terminal.aliases',
    extra_props: ['secured', 'powered', 'data_storage'],
    powerState: 'powered',
  },
  {
    id: 'maintenance_vent',
    type: 'vent',
    nameKey: 'env.maintenance_vent',
    descriptionKey: 'env.maintenance_vent.description',
    aliasesKey: 'env.maintenance_vent.aliases',
    extra_props: ['metallic', 'breakable'],
  },
  {
    id: 'coolant_pipe',
    type: 'pipe',
    nameKey: 'env.coolant_pipe',
    descriptionKey: 'env.coolant_pipe.description',
    aliasesKey: 'env.coolant_pipe.aliases',
    extra_props: ['liquid_source', 'sealed', 'breakable'],
  },
  {
    id: 'access_panel',
    type: 'panel',
    nameKey: 'env.access_panel',
    descriptionKey: 'env.access_panel.description',
    aliasesKey: 'env.access_panel.aliases',
    extra_props: ['electronic', 'openable', 'lockable'],
    powerState: 'powered',
  },
  {
    id: 'security_camera',
    type: 'camera',
    nameKey: 'env.security_camera',
    descriptionKey: 'env.security_camera.description',
    aliasesKey: 'env.security_camera.aliases',
    extra_props: ['powered', 'breakable', 'small'],
    powerState: 'powered',
  },
  {
    id: 'main_airlock',
    type: 'airlock',
    nameKey: 'env.main_airlock',
    descriptionKey: 'env.main_airlock.description',
    aliasesKey: 'env.main_airlock.aliases',
    extra_props: ['heavy', 'electronic', 'powered'],
    powerState: 'powered',
  },
  {
    id: 'supply_locker',
    type: 'container',
    nameKey: 'env.supply_locker',
    descriptionKey: 'env.supply_locker.description',
    aliasesKey: 'env.supply_locker.aliases',
    extra_props: ['metallic', 'lockable', 'breakable'],
  },
  {
    id: 'exposed_wiring',
    type: 'wiring',
    nameKey: 'env.exposed_wiring',
    descriptionKey: 'env.exposed_wiring.description',
    aliasesKey: 'env.exposed_wiring.aliases',
    extra_props: ['powered', 'broken'],
    powerState: 'powered',
  },
] as const;

/** Ordered list of all environment feature definitions */
export const ENVIRONMENT_FEATURE_LIST: readonly EnvironmentFeatureDefinition[] = FEATURES_ARRAY;

/** Environment feature definitions indexed by ID */
export const ENVIRONMENT_FEATURE_DEFINITIONS: Readonly<Record<string, EnvironmentFeatureDefinition>> =
  Object.fromEntries(FEATURES_ARRAY.map((f) => [f.id, f]));

/**
 * Resolves the full property set for a given environment feature ID.
 * Returns empty array if feature not found.
 */
export function resolveEnvironmentProperties(id: string): readonly PropertyId[] {
  const feature = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (!feature) return [];
  return resolveProperties({
    objectCategory: 'environment',
    baseType: feature.type,
    extra_props: feature.extra_props,
  });
}
