// ---------------------------------------------------------------------------
// src/engine/threat.ts — Phase 6: Threat Director State Machine
// ---------------------------------------------------------------------------
// Pure functions — no side effects, immutable state transitions.
// Called once per turn to generate ThreatEvents (encounter/hint/environmental).
// ---------------------------------------------------------------------------

import type { StoryBeat } from './types';
import type { ThreatBehavior, ThreatDirectorState, ThreatEvent } from './scenario';

// ---------------------------------------------------------------------------
// PACING CONSTANTS
// ---------------------------------------------------------------------------

export const MIN_TURNS_BETWEEN_ENCOUNTERS = 3;
export const MIN_TURNS_BETWEEN_HINTS = 2;
export const DROUGHT_BONUS_THRESHOLD = 8;
export const DROUGHT_BONUS = 0.15;
export const WOUNDED_COOLDOWN_TURNS = 5;
export const WOUNDED_HINT_CHANCE = 0.30;
export const ENV_EFFECT_CHANCE = 0.30;
export const ENV_EFFECT_MIN_AGGRESSIVENESS = 5;
export const MODULE_THREAT_HINT_SUPPRESSION = 0.5;
export const HINT_HISTORY_MAX = 50;

// ---------------------------------------------------------------------------
// RNG INTERFACE — injectable for deterministic tests
// ---------------------------------------------------------------------------

export interface RngFn {
  float(): number;
  pick<T>(arr: readonly T[]): T;
}

// ---------------------------------------------------------------------------
// THREAT BEHAVIORS — per-beat configuration table
// ---------------------------------------------------------------------------

export const THREAT_BEHAVIORS: Readonly<Record<StoryBeat, ThreatBehavior>> = {
  intro: {
    visibility: 'hidden',
    aggressiveness: 0,
    encounterChance: 0,
    hintChance: 0.2,
    environmentalEffects: [],
    narrativeHints: [
      'eerie_silence', 'flickering_light', 'old_blood_stain',
      'scratch_marks', 'cold_draft', 'distant_hum',
    ],
  },
  rising: {
    visibility: 'hinted',
    aggressiveness: 2,
    encounterChance: 0.05,
    hintChance: 0.35,
    environmentalEffects: [],
    narrativeHints: [
      'blood_trail', 'distant_scream', 'camera_movement',
      'ventilation_sound', 'broken_barricade', 'claw_marks_fresh',
    ],
  },
  midpoint: {
    visibility: 'glimpsed',
    aggressiveness: 4,
    encounterChance: 0.10,
    hintChance: 0.4,
    environmentalEffects: ['power_fluctuation', 'locked_door'],
    narrativeHints: [
      'shadow_movement', 'camera_static', 'temperature_drop',
      'acid_residue', 'half_eaten_corpse',
    ],
  },
  escalation: {
    visibility: 'present',
    aggressiveness: 7,
    encounterChance: 0.30,
    hintChance: 0.5,
    environmentalEffects: ['power_outage', 'blocked_route', 'environmental_damage'],
    narrativeHints: [
      'heavy_footsteps', 'breathing_sounds', 'alarm_triggered',
      'door_denting', 'scream_cut_short',
    ],
  },
  climax: {
    visibility: 'pursuing',
    aggressiveness: 10,
    encounterChance: 0.80,
    hintChance: 0.0,
    environmentalEffects: ['ship_shaking', 'fire', 'hull_breach', 'total_darkness'],
    narrativeHints: [],
  },
  resolution: {
    visibility: 'aftermath',
    aggressiveness: 0,
    encounterChance: 0,
    hintChance: 0.1,
    environmentalEffects: [],
    narrativeHints: ['aftermath_silence'],
  },
};

// ---------------------------------------------------------------------------
// FACTORY & TRANSITIONS
// ---------------------------------------------------------------------------

/** Create an initial ThreatDirectorState for a given story beat. */
export function createThreatDirector(beat: StoryBeat): ThreatDirectorState {
  return {
    currentBeat: beat,
    encounterCount: 0,
    turnsSinceLastEncounter: 0,
    turnsSinceLastHint: 0,
    hintHistory: [],
    creatureWounded: false,
    creatureEnraged: false,
    woundedCooldown: 0,
  };
}

/** Transition the threat director to a new story beat. */
export function transitionBeat(
  director: ThreatDirectorState,
  newBeat: StoryBeat,
): ThreatDirectorState {
  return { ...director, currentBeat: newBeat };
}

/** Apply after the player wounds the creature in combat. */
export function onCreatureWounded(director: ThreatDirectorState): ThreatDirectorState {
  return { ...director, creatureWounded: true, woundedCooldown: WOUNDED_COOLDOWN_TURNS };
}

/** Apply when the creature's wounded cooldown expires and it returns. */
export function onCreatureReturns(director: ThreatDirectorState): ThreatDirectorState {
  return { ...director, creatureWounded: false, creatureEnraged: true };
}

// ---------------------------------------------------------------------------
// ENCOUNTER INTENSITY — based on effective aggressiveness
// ---------------------------------------------------------------------------

/**
 * Generate an encounter event scaled to the current aggressiveness level.
 *
 * agg ≤ 3  → stalk (no combat, atmosphere only)
 * agg ≤ 6  → 50% stalk / 50% ambush (1 round)
 * agg ≤ 9  → hunt (full combat, creature retreats when wounded, can flee after 2 rounds)
 * agg 10+  → pursue (full combat, creature does not retreat)
 */
export function generateEncounter(
  behavior: ThreatBehavior,
  director: ThreatDirectorState,
  rng: RngFn,
): ThreatEvent {
  const agg = behavior.aggressiveness + (director.creatureEnraged ? 2 : 0);

  if (agg <= 3) {
    return { type: 'encounter', subtype: 'stalk', rounds: 0 };
  }
  if (agg <= 6) {
    const subtype = rng.float() < 0.5 ? 'stalk' : 'ambush';
    return { type: 'encounter', subtype, rounds: subtype === 'ambush' ? 1 : 0 };
  }
  if (agg <= 9) {
    return { type: 'encounter', subtype: 'hunt', rounds: -1, canFlee: true, fleeAfterRounds: 2 };
  }
  return { type: 'encounter', subtype: 'pursue', rounds: -1, canFlee: false };
}

// ---------------------------------------------------------------------------
// HINT SELECTION — unused hints first, then cycle
// ---------------------------------------------------------------------------

function pickUnusedHint(
  behavior: ThreatBehavior,
  director: ThreatDirectorState,
  rng: RngFn,
): { type: 'hint'; template: string } {
  const available = behavior.narrativeHints.filter(h => !director.hintHistory.includes(h));
  const pool = available.length > 0 ? available : behavior.narrativeHints;
  const template = rng.pick(pool);
  return { type: 'hint', template };
}

// ---------------------------------------------------------------------------
// THREAT CHECK — main per-turn entry point
// ---------------------------------------------------------------------------

/** Result of a per-turn threat check: the event (if any) + updated director state. */
export interface ThreatCheckResult {
  readonly event: ThreatEvent | null;
  readonly updatedDirector: ThreatDirectorState;
}

/**
 * Run the per-turn threat check. Returns an event (encounter / environmental / hint)
 * and the new director state with updated counters.
 *
 * Rules applied (in order):
 * 1. Wounded creature: avoids player (woundedCooldown turns), may give retreat hint
 * 2. Module with own threat: suppresses random encounters, hints fire at 50% rate
 * 3. Random encounter: checked after MIN_TURNS_BETWEEN_ENCOUNTERS gap
 * 4. Environmental effect: escalation+ only, 30% per turn
 * 5. Narrative hint: MIN_TURNS_BETWEEN_HINTS gap, unused-first
 */
export function threatCheck(
  director: ThreatDirectorState,
  moduleHasThreat: boolean,
  rng: RngFn,
): ThreatCheckResult {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const behavior = THREAT_BEHAVIORS[director.currentBeat];

  // --- Rule 1: Wounded creature avoids player ---
  if (director.creatureWounded && director.woundedCooldown > 0) {
    const newCooldown = director.woundedCooldown - 1;
    const afterCooldown: ThreatDirectorState = newCooldown === 0
      ? onCreatureReturns({ ...director, woundedCooldown: 0 })
      : { ...director, woundedCooldown: newCooldown };

    if (rng.float() < WOUNDED_HINT_CHANCE) {
      return {
        event: { type: 'hint', template: 'creature_wounded_retreat' },
        updatedDirector: afterCooldown,
      };
    }
    return { event: null, updatedDirector: afterCooldown };
  }

  // --- Rule 2: Module with own threat suppresses random encounters ---
  if (moduleHasThreat) {
    const newHintCounter = director.turnsSinceLastHint + 1;
    if (
      newHintCounter >= MIN_TURNS_BETWEEN_HINTS &&
      behavior.narrativeHints.length > 0 &&
      rng.float() < behavior.hintChance * MODULE_THREAT_HINT_SUPPRESSION
    ) {
      const hint = pickUnusedHint(behavior, director, rng);
      const newHistory = [...director.hintHistory, hint.template].slice(-HINT_HISTORY_MAX);
      return {
        event: hint,
        updatedDirector: { ...director, turnsSinceLastHint: 0, hintHistory: newHistory },
      };
    }
    return {
      event: null,
      updatedDirector: { ...director, turnsSinceLastHint: newHintCounter },
    };
  }

  // --- Rule 3: Random encounter ---
  if (director.turnsSinceLastEncounter >= MIN_TURNS_BETWEEN_ENCOUNTERS) {
    const droughtBonus = director.turnsSinceLastEncounter > DROUGHT_BONUS_THRESHOLD ? DROUGHT_BONUS : 0;
    const effectiveChance = behavior.encounterChance + droughtBonus;
    if (rng.float() < effectiveChance) {
      const event = generateEncounter(behavior, director, rng);
      return {
        event,
        updatedDirector: {
          ...director,
          encounterCount: director.encounterCount + 1,
          turnsSinceLastEncounter: 0,
          turnsSinceLastHint: director.turnsSinceLastHint + 1,
        },
      };
    }
  }

  // --- Rule 4: Environmental effect (escalation+ only) ---
  if (
    behavior.aggressiveness >= ENV_EFFECT_MIN_AGGRESSIVENESS &&
    behavior.environmentalEffects.length > 0 &&
    rng.float() < ENV_EFFECT_CHANCE
  ) {
    const effect = rng.pick(behavior.environmentalEffects);
    return {
      event: { type: 'environmental', effect },
      updatedDirector: {
        ...director,
        turnsSinceLastEncounter: director.turnsSinceLastEncounter + 1,
        turnsSinceLastHint: director.turnsSinceLastHint + 1,
      },
    };
  }

  // --- Rule 5: Narrative hint ---
  if (
    director.turnsSinceLastHint >= MIN_TURNS_BETWEEN_HINTS &&
    behavior.narrativeHints.length > 0 &&
    rng.float() < behavior.hintChance
  ) {
    const hint = pickUnusedHint(behavior, director, rng);
    const newHistory = [...director.hintHistory, hint.template].slice(-HINT_HISTORY_MAX);
    return {
      event: hint,
      updatedDirector: {
        ...director,
        turnsSinceLastHint: 0,
        turnsSinceLastEncounter: director.turnsSinceLastEncounter + 1,
        hintHistory: newHistory,
      },
    };
  }

  // --- No event this turn ---
  return {
    event: null,
    updatedDirector: {
      ...director,
      turnsSinceLastEncounter: director.turnsSinceLastEncounter + 1,
      turnsSinceLastHint: director.turnsSinceLastHint + 1,
    },
  };
}
