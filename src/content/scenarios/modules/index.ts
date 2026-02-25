// ---------------------------------------------------------------------------
// src/content/scenarios/modules/index.ts — Module registry
// ---------------------------------------------------------------------------

export { BLOCKED_PASSAGE_01, WOUNDED_SURVIVOR_01, DARK_ROOM_01, SUPPLY_CACHE_01, AMBUSH_01 } from './universal';
export {
  AIRLOCK_MALFUNCTION_01, MALFUNCTIONING_ANDROID_01, ALIEN_MECHANISM_01,
  CONTAINMENT_BREACH_01, POWER_REROUTE_DILEMMA_01,
} from './category';
export {
  PATROL_ENTITY_01, FLOODED_SECTION_01, SURVIVOR_RESCUE_01,
  TERMINAL_DECRYPT_01, EXPLOSIVE_DECOMPRESSION_RISK_01,
} from './complex';

import { BLOCKED_PASSAGE_01, WOUNDED_SURVIVOR_01, DARK_ROOM_01, SUPPLY_CACHE_01, AMBUSH_01 } from './universal';
import {
  AIRLOCK_MALFUNCTION_01, MALFUNCTIONING_ANDROID_01, ALIEN_MECHANISM_01,
  CONTAINMENT_BREACH_01, POWER_REROUTE_DILEMMA_01,
} from './category';
import {
  PATROL_ENTITY_01, FLOODED_SECTION_01, SURVIVOR_RESCUE_01,
  TERMINAL_DECRYPT_01, EXPLOSIVE_DECOMPRESSION_RISK_01,
} from './complex';
import type { ScenarioModule } from '@engine/scenario';

/** All 15 launch modules */
export const ALL_MODULES: readonly ScenarioModule[] = [
  // Universal (5)
  BLOCKED_PASSAGE_01,
  WOUNDED_SURVIVOR_01,
  DARK_ROOM_01,
  SUPPLY_CACHE_01,
  AMBUSH_01,
  // Category (5)
  AIRLOCK_MALFUNCTION_01,
  MALFUNCTIONING_ANDROID_01,
  ALIEN_MECHANISM_01,
  CONTAINMENT_BREACH_01,
  POWER_REROUTE_DILEMMA_01,
  // Complex (5)
  PATROL_ENTITY_01,
  FLOODED_SECTION_01,
  SURVIVOR_RESCUE_01,
  TERMINAL_DECRYPT_01,
  EXPLOSIVE_DECOMPRESSION_RISK_01,
] as const;

/** Look up a module by ID */
export function getModuleById(id: string): ScenarioModule | undefined {
  return ALL_MODULES.find(m => m.id === id);
}
