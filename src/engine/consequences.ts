// ---------------------------------------------------------------------------
// src/engine/consequences.ts — Consequence engine + chain reactions
// ---------------------------------------------------------------------------
// Converts action outcomes into ordered state changes. Chain reactions are
// resolved recursively up to BALANCE.MAX_CASCADE_DEPTH to prevent infinite
// loops from cyclical environmental interactions.
// ---------------------------------------------------------------------------

import type {
  GameState, Consequence, SceneContext,
  RngFn, ResolvedTarget,
} from './types';
import type { VerbId } from './verbs';
import type { RollOutcome } from './types';
import type { PlayerAttackResult } from './types';
import { BALANCE } from './constants';
import { addCondition, removeCondition } from './conditions';
import { addItem, removeItem } from './inventory';
import { clampHp } from './state';
import { ITEM_DEFINITIONS } from '../content/items';
import { applyStateToken } from './entityState';
import type { LocationStateId } from './locationState';
import { applyLocationToken, atmosphereToken } from './locationState';
import { isNpcAlive } from './victory';

// ---------------------------------------------------------------------------
// EAT tier detection — used by both consequences and narration
// ---------------------------------------------------------------------------

/** Priority-ordered tier for an EAT action based on target properties */
export type EatTier =
  | 'edible'
  | 'drinkable'
  | 'alive'
  | 'oversized'
  | 'toxic'
  | 'sharp'
  | 'inorganic'
  | 'dead_organic'
  | 'generic';

/**
 * Determine what "kind" of object is being eaten.
 * Priority order is intentional: edible first, then safety concerns, then material.
 */
export function getEatTier(target: ResolvedTarget | null): EatTier {
  if (!target) return 'generic';
  const props = target.properties;
  const vitality = target.state?.vitality;
  if (props.includes('edible')) return 'edible';
  if (props.includes('drinkable')) return 'drinkable';
  if (vitality !== undefined && vitality !== 'dead') return 'alive';
  if (props.includes('sentient')) return 'alive';
  if (props.includes('heavy') && !props.includes('small')) return 'oversized';
  if (props.includes('toxic') || props.includes('corrosive') || props.includes('radioactive')) return 'toxic';
  if (props.includes('sharp') || props.includes('bladed') || props.includes('pointed')) return 'sharp';
  if (props.includes('metallic') || props.includes('synthetic') || props.includes('electronic')) return 'inorganic';
  if (vitality === 'dead' && props.includes('organic')) return 'dead_organic';
  return 'generic';
}

// ---------------------------------------------------------------------------
// Consequence building — translate verb × target × outcome → Consequence[]
// ---------------------------------------------------------------------------

/**
 * Determine what state changes should result from an action outcome.
 * Called BEFORE applyConsequences so that the caller can inspect/log them.
 */
export function buildConsequences(
  verb: VerbId,
  target: ResolvedTarget | null,
  outcome: RollOutcome,
  attackResult?: PlayerAttackResult,
): readonly Consequence[] {
  const consequences: Consequence[] = [];

  // Combat-specific consequences (player attack hit)
  if (attackResult) {
    if (attackResult.hit && attackResult.damageDealt > 0) {
      consequences.push({
        type: 'damage',
        targetId: attackResult.npcKilled ? target?.id : target?.id,
        amount: attackResult.damageDealt,
      });
    }
    if (attackResult.npcKilled && target) {
      consequences.push({ type: 'npc_killed', targetId: target.id });
    }
    if (attackResult.itemBroke && attackResult.bonusLoot === null) {
      // item break is handled by processTurn directly via durability
    }
    if (attackResult.bonusLoot) {
      consequences.push({ type: 'inventory_add', itemId: attackResult.bonusLoot.itemId });
    }
  }

  // Outcome-based consequences
  if (outcome === 'crit_success' || outcome === 'success') {
    // IGNITE on a flammable target → the room catches
    if (verb === 'IGNITE' && target?.properties.includes('flammable')) {
      consequences.push({ type: 'environment_change', targetId: target.id, locationState: 'burning' });
    }
    // ELECTRIFY on conductive target → arcs light the place up
    if (verb === 'ELECTRIFY' && target?.properties.includes('conductive')) {
      consequences.push({ type: 'environment_change', targetId: target.id, locationState: 'lit' });
    }
    // FLOOD → flooding environment
    if (verb === 'FLOOD' && target) {
      consequences.push({ type: 'environment_change', targetId: target.id, locationState: 'flooded' });
    }
  }

  // EAT: tier-based consequences (heal for food, damage for dangerous items)
  if (verb === 'EAT') {
    const tier = getEatTier(target);
    if (tier === 'edible') {
      const itemDef = target ? ITEM_DEFINITIONS[target.id] : undefined;
      const healAmount = itemDef?.healingValue ?? 1;
      consequences.push({ type: 'heal', targetId: 'player', amount: healAmount });
      if (target?.id) {
        consequences.push({ type: 'inventory_remove', itemId: target.id });
      }
    } else if (tier === 'toxic') {
      consequences.push({ type: 'damage', targetId: 'player', amount: BALANCE.EAT_TOXIC_DAMAGE, nonLethal: true });
    } else if (tier === 'sharp') {
      consequences.push({ type: 'damage', targetId: 'player', amount: BALANCE.EAT_SHARP_DAMAGE, nonLethal: true });
    }
    // drinkable, alive, oversized, inorganic, dead_organic, generic: no mechanical consequence
    return consequences;
  }

  // SELF_HARM: success = lethal self-damage, failure = 1 HP nonLethal
  if (verb === 'SELF_HARM') {
    if (outcome === 'crit_success' || outcome === 'success') {
      consequences.push({
        type: 'damage', targetId: 'player',
        amount: BALANCE.SELF_HARM_LETHAL_DAMAGE,
      });
    } else if (outcome === 'failure') {
      consequences.push({
        type: 'damage', targetId: 'player',
        amount: BALANCE.FAILURE_DAMAGE, nonLethal: true,
      });
    }
    // crit_failure: no damage at all
    return consequences;
  }

  // USE a healing consumable (medical kit, stimulant, ration…) → restore HP.
  // healingValue is authored on the item definition. On success the item is
  // consumed; a fumbled use keeps the kit so the player can retry. Fixes #85:
  // previously USE fell through to the generic block and only crit_success
  // healed a flat +1, so a plain "functional" success restored nothing.
  if (verb === 'USE' && target) {
    const itemDef = ITEM_DEFINITIONS[target.id];
    const healAmount = itemDef?.healingValue ?? 0;
    if (healAmount > 0) {
      if (outcome === 'crit_success' || outcome === 'success') {
        consequences.push({ type: 'heal', targetId: 'player', amount: healAmount });
        consequences.push({ type: 'inventory_remove', itemId: target.id });
      }
      return consequences;
    }
  }

  // General outcome consequences (only for non-combat actions with a real target).
  // THROW is excluded from self-damage: the thrown object was aimed outward, not at the player.
  // Non-combat failure damage is nonLethal: it cannot reduce HP below 1.
  // Combat/oxygen/scenario interactions handle lethal damage separately.
  if (!attackResult && target !== null && verb !== 'THROW') {
    if (outcome === 'failure') {
      consequences.push({
        type: 'damage', targetId: 'player',
        amount: BALANCE.FAILURE_DAMAGE, nonLethal: true,
      });
    } else if (outcome === 'crit_failure') {
      consequences.push({
        type: 'damage', targetId: 'player',
        amount: BALANCE.CRIT_FAILURE_DAMAGE, nonLethal: true,
      });
    } else if (outcome === 'crit_success') {
      consequences.push({ type: 'heal', targetId: 'player', amount: 1 });
    }
  }

  return consequences;
}

// ---------------------------------------------------------------------------
// Chain reaction builder
// ---------------------------------------------------------------------------

/**
 * Determine secondary consequences triggered by a primary consequence.
 * Keeps depth-of-chain in check.
 */
function resolveChainReactions(
  consequence: Consequence,
  _state: GameState,
  _context: SceneContext,
): readonly Consequence[] {
  const chains: Consequence[] = [];

  // Breaching a room throws everything loose against the walls, and the fire
  // in the next room over finds a new draught. The fire-to-air chain is not
  // here: it is on a delay, and belongs to tickLocationStates.
  if (consequence.type === 'environment_change' && consequence.locationState === 'depressurized') {
    chains.push({
      type: 'damage', targetId: 'player',
      amount: BALANCE.FAILURE_DAMAGE, nonLethal: true,
    });
  }

  return chains;
}

// ---------------------------------------------------------------------------
// Consequence application
// ---------------------------------------------------------------------------

/**
 * Apply an ordered list of consequences to the game state.
 * Recursively resolves chain reactions up to BALANCE.MAX_CASCADE_DEPTH.
 *
 * @param depth - Current chain depth (0 = top-level, max = MAX_CASCADE_DEPTH)
 */
export function applyConsequences(
  state: GameState,
  consequences: readonly Consequence[],
  context: SceneContext,
  rng: RngFn,
  depth = 0,
): GameState {
  if (depth > BALANCE.MAX_CASCADE_DEPTH) return state;

  let current = state;

  for (const c of consequences) {
    current = applySingleConsequence(current, c, context, rng);

    // Resolve chain reactions from this consequence (at depth + 1)
    if (depth < BALANCE.MAX_CASCADE_DEPTH) {
      const chains = resolveChainReactions(c, current, context);
      if (chains.length > 0) {
        current = applyConsequences(current, chains, context, rng, depth + 1);
      }
    }
  }

  return current;
}

// ---------------------------------------------------------------------------
// Single consequence handlers
// ---------------------------------------------------------------------------

/** The one channel through which the world changes (decision U). */
function writeLocationState(
  state: GameState,
  locationId: string,
  token: LocationStateId,
): GameState {
  const before = state.locationStates[locationId] ?? {};
  return {
    ...state,
    locationStates: {
      ...state.locationStates,
      [locationId]: applyLocationToken(before, token, state.turn),
    },
  };
}

function applySingleConsequence(
  state: GameState,
  c: Consequence,
  _context: SceneContext,
  _rng: RngFn,
): GameState {
  if (state.character === null) return state;

  switch (c.type) {
    case 'damage': {
      if (c.targetId !== 'player') return state;
      const amount = c.amount ?? 0;
      let newHp = clampHp(state.character.hp - amount, state.character.maxHp);
      // nonLethal damage cannot reduce HP below 1 (exploration failures).
      // Combat, oxygen, and scenario interactions handle lethal damage separately.
      if (c.nonLethal && newHp < 1) {
        newHp = 1;
      }
      return { ...state, character: { ...state.character, hp: newHp } };
    }

    case 'heal': {
      if (c.targetId !== 'player') return state;
      const amount = c.amount ?? 0;
      const newHp = clampHp(state.character.hp + amount, state.character.maxHp);
      return { ...state, character: { ...state.character, hp: newHp } };
    }

    case 'condition_add': {
      if (!c.conditionId) return state;
      const updated = addCondition(state.character.conditions, c.conditionId);
      return { ...state, character: { ...state.character, conditions: updated } };
    }

    case 'condition_remove': {
      if (!c.conditionId) return state;
      const updated = removeCondition(state.character.conditions, c.conditionId);
      return { ...state, character: { ...state.character, conditions: updated } };
    }

    case 'inventory_add': {
      if (!c.itemId) return state;
      const { inventory } = addItem(state.character.inventory, c.itemId);
      return { ...state, character: { ...state.character, inventory } };
    }

    case 'inventory_remove': {
      if (!c.itemId) return state;
      const { inventory } = removeItem(state.character.inventory, c.itemId);
      return { ...state, character: { ...state.character, inventory } };
    }

    case 'item_break': {
      if (!c.itemId) return state;
      const newDurability = {
        ...state.character.durability,
        [c.itemId]: { broken: true, combatUses: state.character.durability[c.itemId]?.combatUses ?? 0 },
      };
      return { ...state, character: { ...state.character, durability: newDurability } };
    }

    case 'environment_change': {
      const locId = c.locationId ?? state.playerLocationId;
      const token = c.locationState;
      if (locId === null || locId === undefined || token === undefined) return state;
      return writeLocationState(state, locId, token);
    }

    case 'atmosphere_change': {
      const locId = c.locationId ?? state.playerLocationId;
      if (locId === null || locId === undefined || c.atmosphereType === undefined) return state;
      return writeLocationState(state, locId, atmosphereToken(c.atmosphereType));
    }

    case 'npc_killed': {
      const npcId = c.npcId ?? c.targetId;
      if (!npcId) return state;
      const npcState = state.npcStates[npcId];
      if (npcState === undefined || !isNpcAlive(npcState)) return state;
      return {
        ...state,
        npcStates: {
          ...state.npcStates,
          [npcId]: { ...npcState, state: applyStateToken(npcState.state, 'dead') },
        },
      };
    }

    // A creature that breaks off does not stand there waiting: it withdraws
    // through the nearest door, and the fight is over.
    case 'npc_flee': {
      const npcId = c.npcId ?? c.targetId;
      if (!npcId) return state;
      const npcState = state.npcStates[npcId];
      if (npcState === undefined || !isNpcAlive(npcState)) return state;

      const from = npcState.locationId;
      const escape = from !== null && state.scenario !== null
        ? state.scenario.graph.edges.find(e => e.from === from || e.to === from)
        : undefined;
      const destination = escape === undefined || from === null
        ? null
        : (escape.from === from ? escape.to : escape.from);

      return {
        ...state,
        activeCombat: state.activeCombat?.npcInstanceId === npcId ? null : state.activeCombat,
        npcStates: {
          ...state.npcStates,
          [npcId]: { ...npcState, locationId: destination },
        },
      };
    }

    case 'npc_relocate': {
      const npcId = c.npcId ?? c.targetId;
      const locationId = c.locationId;
      if (!npcId || !locationId) return state;
      const npcState = state.npcStates[npcId];
      if (npcState === undefined || !isNpcAlive(npcState)) return state;
      return {
        ...state,
        npcStates: {
          ...state.npcStates,
          [npcId]: { ...npcState, locationId },
        },
      };
    }

    default:
      return state;
  }
}
