// ---------------------------------------------------------------------------
// src/engine/scenarioFlagMapper.ts — Chantier 3: Scenario flag → mechanic mapping
// ---------------------------------------------------------------------------
// Converts abstract scenario flags into mechanical effects that existing
// systems (victory, defeat) understand. Each skeleton defines its own mappings.
// Pure function — no side effects.
// ---------------------------------------------------------------------------

/**
 * Mechanical effects derived from scenario flags.
 * These are merged into VictoryCheckContext by buildVictoryCheckContext().
 */
export interface FlagEffects {
  readonly lethalLocations: readonly string[];
  readonly fullyContainedLocations: readonly string[];
  readonly activatedObjects: readonly string[];
  readonly selfDestructActive: boolean;
}

const EMPTY_EFFECTS: FlagEffects = {
  lethalLocations: [],
  fullyContainedLocations: [],
  activatedObjects: [],
  selfDestructActive: false,
};

/**
 * Map scenario flags to mechanical effects for the victory/defeat check.
 *
 * Each skeleton can define its own flag→effect mappings.
 * Called by buildVictoryCheckContext() each turn.
 *
 * @param flags      Current scenario flags (from GameState.scenarioFlags)
 * @param skeletonId Current skeleton ID (from GameState.scenarioId)
 * @returns Mechanical effects to merge into VictoryCheckContext
 */
export function mapScenarioFlags(
  flags: Readonly<Record<string, boolean>> | undefined,
  skeletonId: string | null,
): FlagEffects {
  if (!flags || !skeletonId) return EMPTY_EFFECTS;

  const lethalLocations: string[] = [];
  const fullyContainedLocations: string[] = [];
  const activatedObjects: string[] = [];
  let selfDestructActive = false;

  switch (skeletonId) {
    case 'escape':
      if (flags['cargo_jettisoned'] || flags['cargo_depressurized']) {
        lethalLocations.push('boss');
      }
      break;

    case 'investigate':
      // Primary victory: evidence transmitted via beacon
      if (flags['evidence_transmitted']) {
        activatedObjects.push('emergency_beacon');
      }
      // Alternative victory: reactor killed + shuttle escape route
      if (flags['reactor_killed'] && (flags['shuttle_released'] || flags['clamps_sabotaged'])) {
        selfDestructActive = true;
      }
      break;

    case 'rescue':
      // Emergent victory: creature contained via sonic emitter + acoustic trap
      if (flags['creature_contained']) {
        fullyContainedLocations.push('boss');
      }
      break;
  }

  return { lethalLocations, fullyContainedLocations, activatedObjects, selfDestructActive };
}
