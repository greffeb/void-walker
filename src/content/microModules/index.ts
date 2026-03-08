// ---------------------------------------------------------------------------
// src/content/microModules/index.ts — Micro-module registry
// ---------------------------------------------------------------------------

import type { MicroModule } from '../../engine/scenario';
import { LOOT_MICRO_MODULES } from './loot';
import { LORE_MICRO_MODULES } from './lore';
import { ENCOUNTER_MICRO_MODULES } from './encounter';
import { AMBIANCE_MICRO_MODULES } from './ambiance';

/** Complete pool of all micro-modules (49 total) */
export const ALL_MICRO_MODULES: readonly MicroModule[] = [
  ...LOOT_MICRO_MODULES,
  ...LORE_MICRO_MODULES,
  ...ENCOUNTER_MICRO_MODULES,
  ...AMBIANCE_MICRO_MODULES,
];

/** Lookup a micro-module by id */
export function getMicroModuleById(id: string): MicroModule | undefined {
  return ALL_MICRO_MODULES.find(m => m.id === id);
}

// Re-export individual pools for direct access
export { LOOT_MICRO_MODULES } from './loot';
export { LORE_MICRO_MODULES } from './lore';
export { ENCOUNTER_MICRO_MODULES } from './encounter';
export { AMBIANCE_MICRO_MODULES } from './ambiance';
