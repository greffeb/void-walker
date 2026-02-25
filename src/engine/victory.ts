// ---------------------------------------------------------------------------
// src/engine/victory.ts — Phase 6: Victory & Defeat Condition Checker
// ---------------------------------------------------------------------------
// Pure functions — no side effects, no GameState dependency.
// Called once per turn with a minimal VictoryCheckContext snapshot.
// ---------------------------------------------------------------------------

import type { CoreSkeleton, VictoryCondition, DefeatCondition, VictoryResult } from './scenario';

// ---------------------------------------------------------------------------
// NPC STATE — minimal view of an NPC needed for victory checks
// ---------------------------------------------------------------------------

export interface NpcState {
  readonly id: string;
  readonly locationId: string | null;
  readonly alive: boolean;
}

// ---------------------------------------------------------------------------
// VICTORY CHECK CONTEXT — minimal game-state snapshot
// ---------------------------------------------------------------------------

/**
 * Everything the victory checker needs, extracted from GameState.
 * Computed externally each turn before calling checkVictory().
 */
export interface VictoryCheckContext {
  /** Player's current location ID */
  readonly playerLocationId: string;
  /** Item IDs currently in the player's inventory */
  readonly playerInventory: readonly string[];
  /** NPC states keyed by NPC ID */
  readonly npcStates: Readonly<Record<string, NpcState>>;
  /** Object/feature IDs that have been activated (e.g. emergency_beacon) */
  readonly activatedObjects: readonly string[];
  /** Location IDs currently lethally hazardous (depressurized, toxic, etc.) */
  readonly lethalLocations: readonly string[];
  /** Location IDs where ALL graph exits are currently sealed */
  readonly fullyContainedLocations: readonly string[];
  /** Key objective IDs that have been permanently destroyed */
  readonly destroyedObjectives: readonly string[];
  /**
   * True when a self-destruct sequence has been activated AND
   * the player has reached a safe zone. This encodes both triggers.
   */
  readonly selfDestructActive: boolean;
}

// ---------------------------------------------------------------------------
// EVALUATE SINGLE VICTORY CONDITION
// ---------------------------------------------------------------------------

/** Returns true if the given VictoryCondition is currently satisfied. */
export function evaluateVictoryCondition(
  condition: VictoryCondition,
  ctx: VictoryCheckContext,
): boolean {
  switch (condition.type) {
    case 'reach_location':
      return (
        ctx.playerLocationId === condition.locationId &&
        (condition.requiredItem === undefined || ctx.playerInventory.includes(condition.requiredItem))
      );

    case 'defeat_entity': {
      const npc = ctx.npcStates[condition.entityId];
      return npc !== undefined && !npc.alive;
    }

    case 'activate_object':
      return (
        ctx.activatedObjects.includes(condition.objectId) &&
        (condition.requiredItem === undefined || ctx.playerInventory.includes(condition.requiredItem))
      );

    case 'escort_alive': {
      const npc = ctx.npcStates[condition.npcId];
      return npc?.alive === true && npc.locationId === condition.locationId;
    }

    case 'environmental_kill': {
      const npc = ctx.npcStates[condition.entityId];
      return (
        npc?.alive === true &&
        npc.locationId !== null &&
        ctx.lethalLocations.includes(npc.locationId) &&
        // Player must not be in the same room (or they'd die too)
        ctx.playerLocationId !== npc.locationId
      );
    }

    case 'containment': {
      const npc = ctx.npcStates[condition.entityId];
      return (
        npc?.alive === true &&
        npc.locationId !== null &&
        ctx.fullyContainedLocations.includes(npc.locationId)
      );
    }

    case 'self_destruct':
      return ctx.selfDestructActive;
  }
}

// ---------------------------------------------------------------------------
// EVALUATE DEFEAT CONDITION
// ---------------------------------------------------------------------------

/**
 * Returns the first satisfied additional defeat condition, or null.
 * Note: player_death and time_expired are handled externally (HP/O2 tracking).
 */
export function evaluateDefeatCondition(
  condition: DefeatCondition,
  ctx: VictoryCheckContext,
): boolean {
  switch (condition.type) {
    case 'player_death':
      return false; // Handled externally via HP

    case 'npc_death': {
      const npc = ctx.npcStates[condition.npcId];
      return npc !== undefined && !npc.alive;
    }

    case 'time_expired':
      return false; // Handled externally via O2 tracker

    case 'objective_destroyed':
      return ctx.destroyedObjectives.length > 0;
  }
}

// ---------------------------------------------------------------------------
// CHECK VICTORY — main per-turn entry point
// ---------------------------------------------------------------------------

/**
 * Checks all victory conditions in priority order:
 * 1. Designed primary victory
 * 2. Designed alternative victory
 * 3. Emergent: environmental kill (boss in lethal room, player safe)
 * 4. Emergent: containment (all exits sealed)
 * 5. Emergent: self-destruct (triggered + player escaped)
 *
 * Returns the first satisfied VictoryResult, or null if none are met.
 */
export function checkVictory(
  ctx: VictoryCheckContext,
  skeleton: CoreSkeleton,
): VictoryResult | null {
  // 1. Designed primary
  if (evaluateVictoryCondition(skeleton.primaryVictory, ctx)) {
    return { type: 'primary', skeletonId: skeleton.id };
  }

  // 2. Designed alternative
  if (evaluateVictoryCondition(skeleton.alternativeVictory, ctx)) {
    return { type: 'alternative', skeletonId: skeleton.id };
  }

  // 3. Emergent: environmental kill
  // Any living entity in a lethal location (when player is not there) counts.
  for (const npc of Object.values(ctx.npcStates)) {
    if (
      npc.alive &&
      npc.locationId !== null &&
      ctx.lethalLocations.includes(npc.locationId) &&
      ctx.playerLocationId !== npc.locationId
    ) {
      return { type: 'emergent_environmental_kill', skeletonId: skeleton.id };
    }
  }

  // 4. Emergent: containment
  for (const npc of Object.values(ctx.npcStates)) {
    if (
      npc.alive &&
      npc.locationId !== null &&
      ctx.fullyContainedLocations.includes(npc.locationId)
    ) {
      return { type: 'emergent_containment', skeletonId: skeleton.id };
    }
  }

  // 5. Emergent: self-destruct
  if (ctx.selfDestructActive) {
    return { type: 'emergent_self_destruct', skeletonId: skeleton.id };
  }

  return null;
}

// ---------------------------------------------------------------------------
// CHECK DEFEAT — additional skeleton-specific conditions
// ---------------------------------------------------------------------------

/**
 * Returns the first triggered additional defeat condition, or null.
 * Standard player_death and time_expired are handled by callers.
 */
export function checkAdditionalDefeat(
  ctx: VictoryCheckContext,
  conditions: readonly DefeatCondition[],
): DefeatCondition | null {
  for (const condition of conditions) {
    if (evaluateDefeatCondition(condition, ctx)) return condition;
  }
  return null;
}
