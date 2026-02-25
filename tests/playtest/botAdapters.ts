// ---------------------------------------------------------------------------
// tests/playtest/botAdapters.ts — Shared GameState -> bot adapters
// ---------------------------------------------------------------------------

import { isGameOver } from '../../src/engine/game';
import { getSceneContext, formatSuggestionAsInput, sceneHasHealingItem } from '../../src/engine/scene';
import type { GameState } from '../../src/engine/types';
import type { BotState, BotScene } from './bots/index';

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
export function toBotScene(state: GameState): BotScene {
  const ctx = getSceneContext(state);
  const suggestionStrings = (ctx.scenarioSuggestions ?? []).map(formatSuggestionAsInput);
  const locationItemNames = ctx.locationItems.map(i => i.nameKey);
  const locationItemIds = ctx.locationItems.map(i => i.id);
  const npcIds = ctx.npcs.map(n => n.id);
  const npcNames = ctx.npcs.map(n => n.nameKey);
  const environmentFeatureIds = ctx.environmentFeatures.map(f => f.id);
  const environmentFeatureNames = ctx.environmentFeatures.map(f => f.nameKey);

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

  return {
    suggestions: suggestionStrings,
    locationItemNames,
    locationItemIds,
    npcIds,
    npcNames,
    environmentFeatureIds,
    environmentFeatureNames,
    connectedLocationIds: ctx.connectedLocations.map(l => l.id),
    connectedLocationAliases: ctx.connectedLocations.map(l => l.aliases[0] ?? l.id),
    hasHealingItem: sceneHasHealingItem(locationItemIds),
    hasObstacle,
    obstacleTargetId,
  };
}
