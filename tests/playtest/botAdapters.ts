// ---------------------------------------------------------------------------
// tests/playtest/botAdapters.ts — Shared GameState -> bot adapters
// ---------------------------------------------------------------------------

import { isGameOver } from '../../src/engine/game';
import { getSceneContext, formatSuggestionAsInput, sceneHasHealingItem } from '../../src/engine/scene';
import type { GameState } from '../../src/engine/types';
import type { BotState, BotScene } from './bots/index';
import { t } from '../../src/i18n/index';
import { ITEM_DEFINITIONS } from '../../src/content/items';
import type { StringKey } from '../../src/i18n/types';

/** The carried item a bot can drink, named as the player would type it. */
function firstHealingItemName(inventory: readonly string[]): string | null {
  const id = inventory.find(itemId => sceneHasHealingItem([itemId]));
  if (id === undefined) return null;
  return t((ITEM_DEFINITIONS[id]?.nameKey ?? `item.${id}`) as StringKey);
}

/** Convert full GameState into the minimal BotState view. */
export function toBotState(state: GameState): BotState {
  return {
    playerHp: state.character?.hp ?? 0,
    playerMaxHp: state.character?.maxHp ?? 1,
    playerClassId: state.character?.className ?? 'marine',
    playerLocationId: state.playerLocationId ?? '',
    playerInventory: state.character?.inventory ?? [],
    visitedLocationIds: Object.keys(state.visitedLocations),
    turn: state.turn,
    isGameOver: isGameOver(state),
  };
}

/** Convert full GameState into the minimal BotScene view. */
export function toBotScene(state: GameState, lastNarrative = ''): BotScene {
  const ctx = getSceneContext(state);
  const suggestionStrings = (ctx.scenarioSuggestions ?? []).map(formatSuggestionAsInput);
  const locationItemNames = ctx.locationItems.map(i => t(i.nameKey as StringKey));
  const locationItemIds = ctx.locationItems.map(i => i.id);
  const inventoryItemNames = ctx.inventory.map(i => t(i.nameKey as StringKey));
  const npcIds = ctx.npcs.map(n => n.id);
  const npcNames = ctx.npcs.map(n => t(n.nameKey as StringKey));
  const environmentFeatureIds = ctx.environmentFeatures.map(f => f.id);
  const environmentFeatureNames = ctx.environmentFeatures.map(f => t(f.nameKey as StringKey));

  // The acts the scene itself names. The harness used to derive these from
  // feature states and inventory, which re-implemented — badly — what the scene
  // already knows: its key list dropped the marine's knife and the engineer's
  // multitool, the two auto-success keys to the locker holding the gate item.
  const obstacleSuggestions = (ctx.scenarioSuggestions ?? [])
    .filter(c => c.category === 'obstacle')
    .map(formatSuggestionAsInput);

  let hasObstacle = false;
  let obstacleTargetId: string | null = null;
  if (state.scenario !== null && state.playerLocationId !== null) {
    const node = state.scenario.graph.nodes.find(n => n.id === state.playerLocationId);
    const visit = state.visitedLocations[state.playerLocationId];
    const unresolved = visit?.obstacleResolved !== true;
    if (node?.obstacle && unresolved) {
      hasObstacle = true;
      obstacleTargetId = node.obstacle.targetId;
    }
  }

  const walkable = new Set(ctx.walkableLocationIds ?? ctx.connectedLocations.map(l => l.id));
  const walkableExits = ctx.connectedLocations.filter(l => walkable.has(l.id));

  return {
    suggestions: suggestionStrings,
    obstacleSuggestions,
    locationItemNames,
    inventoryItemNames,
    locationItemIds,
    npcIds,
    npcNames,
    environmentFeatureIds,
    environmentFeatureNames,
    connectedLocationIds: walkableExits.map(l => l.id),
    connectedLocationAliases: walkableExits.map(l => l.aliases[0] ?? l.id),
    // What the player can drink right now. This read the *floor* while the act
    // it gates reaches into the *inventory*, and the bot picks a kit up before
    // it is ever hurt — so the flag was false exactly when healing became
    // possible, and no bot ever healed in any run.
    healingItemName: firstHealingItemName(state.character?.inventory ?? []),
    hasObstacle,
    obstacleTargetId,
    lastNarrative,
  };
}
