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
    // IGNITE on a flammable target → fire
    if (verb === 'IGNITE' && target?.properties.includes('flammable')) {
      consequences.push({ type: 'environment_change', targetId: target.id });
    }
    // ELECTRIFY on conductive target → chain to nearby
    if (verb === 'ELECTRIFY' && target?.properties.includes('conductive')) {
      consequences.push({ type: 'environment_change', targetId: target.id });
    }
    // FLOOD → flooding environment
    if (verb === 'FLOOD' && target) {
      consequences.push({ type: 'environment_change', targetId: target.id });
    }
  }

  // General outcome consequences (only for non-combat actions with a real target)
  if (!attackResult && target !== null) {
    if (outcome === 'failure') {
      consequences.push({ type: 'damage', targetId: 'player', amount: 1 });
    } else if (outcome === 'crit_failure') {
      consequences.push({ type: 'damage', targetId: 'player', amount: 2 });
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
  state: GameState,
  context: SceneContext,
): readonly Consequence[] {
  const chains: Consequence[] = [];

  // environment_change (fire) → atmosphere degrades in toxic zones
  if (consequence.type === 'environment_change') {
    // Fire in a room can cause atmosphere to degrade
    const currentAtmosphere = context.atmosphere;
    if (currentAtmosphere === 'pressurized' || currentAtmosphere === 'low_oxygen') {
      // Fire degrades atmosphere over FIRE_SPREAD_DELAY turns; immediate O2 consequence
      chains.push({ type: 'atmosphere_change', atmosphereType: 'toxic_atmosphere' });
    }
  }

  // atmosphere_change → depressurized causes O2 drain (handled by oxygen tick each turn)
  // No further chain needed here — oxygen.ts reads the atmosphere from state

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
      const newHp = clampHp(state.character.hp - amount, state.character.maxHp);
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

    case 'environment_change':
    case 'atmosphere_change':
    case 'ship_memory_mark':
      // Environmental changes are noted but not stored directly in this minimal
      // engine state (scene state belongs to the UI/content layer).
      // processTurn() uses these to update SceneContext or log narrative hints.
      return state;

    case 'npc_killed':
    case 'npc_flee':
      // NPC state is managed by processTurn() using activeCombat
      return state;

    default:
      return state;
  }
}
