// ---------------------------------------------------------------------------
// src/engine/scene.ts — Phase 6B: Scenario-aware SceneContext builder
// ---------------------------------------------------------------------------
// Builds a SceneContext from the current GameState + AssembledScenario.
// Populates scenario-aware suggestions, exit exploration status, and
// Black Box flags. Pure function — no side effects.
// ---------------------------------------------------------------------------

import type { GameState, SceneContext, SceneDescription, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance } from './types';
import type { LocationNode, NarrativeSkin, LocationVisitState } from './scenario';
import type { SuggestionCandidate } from './suggestions';
import { generateSuggestions } from './suggestions';
import { getExitsWithStatus } from './backtracking';
import { isItemAvailable, isObstacleResolved } from './backtracking';
import { ITEM_DEFINITIONS } from '../content/items';
import { ENVIRONMENT_FEATURE_DEFINITIONS } from '../content/environments';
import { NPC_DEFINITIONS } from '../content/npcs';
import { getScenarioNameFr } from '../content/scenarioNames';
import { t } from '../i18n/index';

// ---------------------------------------------------------------------------
// HEALING ITEM IDs — items that count as healing for bot scene detection
// ---------------------------------------------------------------------------

const HEALING_ITEM_IDS = new Set([
  'medkit_basic', 'medical_kit', 'stimulant', 'first_aid_kit', 'health_pack',
]);

// ---------------------------------------------------------------------------
// MAIN ENTRY POINT
// ---------------------------------------------------------------------------

/**
 * Build a complete SceneContext from the current GameState.
 *
 * When a scenario is loaded (`state.scenario !== null` and
 * `state.playerLocationId !== null`), the context is scenario-aware:
 * - `locationItems` reflects which items are still present (not taken)
 * - `npcs` reflects which NPCs are still alive
 * - `connectedLocations` is tagged with visit status
 * - `scenarioSuggestions` is populated from the current obstacle's paths
 * - `hasBlackBox` is set if the location has a journal
 *
 * Falls back to an empty context when no scenario is active (for legacy
 * unit tests that pass their own SceneContext directly to processTurn).
 */
export function getSceneContext(state: GameState): SceneContext {
  if (state.scenario === null || state.playerLocationId === null) {
    return buildEmptyContext();
  }

  const { scenario, playerLocationId } = state;
  const { graph } = scenario;

  const node = graph.nodes.find(n => n.id === playerLocationId);
  if (!node) return buildEmptyContext();

  // --- Items: exclude taken ones ---
  const visitState = state.visitedLocations[playerLocationId];
  const locationItems: ResolvedTarget[] = node.items
    .filter(item => isItemAvailable(visitState, item.id))
    .map(item => itemDefToResolvedTarget(item.id));

  // --- Inventory ---
  const inventory: ResolvedTarget[] = (state.character?.inventory ?? []).map(
    id => inventoryItemToResolvedTarget(id),
  );

  // --- NPCs: only alive ones in this location ---
  const npcs: NpcInstance[] = (node.npcs ?? [])
    .filter(npcDef => {
      const npcState = state.npcStates[npcDef.id];
      return npcState === undefined || (npcState.alive && npcState.locationId === playerLocationId);
    })
    .map(npcDef => npcDefToNpcInstance(npcDef.id));

  // --- Environment features ---
  const environmentFeatures: EnvironmentFeatureInstance[] = node.features.map(
    feat => featureDefToInstance(feat.id),
  );

  // --- Connected locations with exploration status ---
  const visitedIds = Object.keys(state.visitedLocations);
  const exits = getExitsWithStatus(playerLocationId, graph.edges, visitedIds);
  const connectedLocations = exits.map(exit => {
    const exitNode = graph.nodes.find(n => n.id === exit.locationId);
    return {
      id: exit.locationId,
      aliases: exitNode ? getLocationAliases(exitNode) : [exit.locationId],
      visited: exit.visited,
    };
  });

  // --- Scenario suggestions from obstacle paths ---
  const obstacleResolved = isObstacleResolved(visitState);
  const activeSkin = node.activeSkin ?? null;
  const playerClass = state.character?.className ?? 'marine';
  const scenarioSuggestions = buildSuggestionCandidates(
    node,
    obstacleResolved,
    connectedLocations,
    locationItems,
    npcs,
    activeSkin,
    playerClass,
  );

  // --- Scene description for UI and narration ---
  const sceneDescription = buildSceneDescription(node, visitState, connectedLocations);

  return {
    inventory,
    locationItems,
    npcs,
    environmentFeatures,
    connectedLocations,
    suggestions: [],           // ParsedAction[] remains empty; parser uses its own resolution
    environmentConditions: node.atmosphere === 'depressurized' ? ['zero_g'] : [],
    atmosphere: node.atmosphere,
    locationId: playerLocationId,
    scenarioSuggestions,
    hasBlackBox: node.hasBlackBox === true,
    sceneDescription,
  };
}

// ---------------------------------------------------------------------------
// BUILD SUGGESTION CANDIDATES — from obstacle paths + movement + items
// ---------------------------------------------------------------------------

function buildSuggestionCandidates(
  node: LocationNode,
  obstacleResolved: boolean,
  connectedLocations: readonly { id: string; aliases: readonly string[]; visited?: boolean }[],
  locationItems: readonly ResolvedTarget[],
  npcs: readonly NpcInstance[],
  activeSkin: NarrativeSkin | null,
  playerClass: import('./types').PlayerClassName,
): readonly SuggestionCandidate[] {
  const candidates: Omit<SuggestionCandidate, 'score'>[] = [];

  // Obstacle paths (highest priority)
  if (!obstacleResolved && node.obstacle) {
    for (const path of node.obstacle.paths) {
      candidates.push({
        verbText: path.verbs[0] ?? 'examiner',
        targetText: node.obstacle.description.fr,
        stat: path.stat,
        category: 'obstacle',
      });
    }
  }

  // Location items
  for (const item of locationItems) {
    candidates.push({
      verbText: 'prendre',
      targetText: item.nameKey,
      stat: 'INT',
      category: 'item',
    });
  }

  // NPCs
  for (const npc of npcs) {
    candidates.push({
      verbText: 'examiner',
      targetText: npc.nameKey,
      stat: 'PER',
      category: 'npc',
    });
  }

  // Movement — unexplored exits first
  const unexplored = connectedLocations.filter(l => !l.visited);
  const exploredLocs = connectedLocations.filter(l => l.visited);
  for (const loc of [...unexplored, ...exploredLocs].slice(0, 3)) {
    candidates.push({
      verbText: 'aller',
      targetText: loc.aliases[0] ?? loc.id,
      stat: 'AGI',
      category: 'movement',
    });
  }

  return generateSuggestions(candidates, playerClass, activeSkin);
}

// ---------------------------------------------------------------------------
// SCENE DESCRIPTION — structured data for UI display and narration
// ---------------------------------------------------------------------------

function buildSceneDescription(
  node: LocationNode,
  visitState: LocationVisitState | undefined,
  connectedLocations: readonly { id: string; aliases: readonly string[]; visited?: boolean }[],
): SceneDescription {
  const isFirstVisit = visitState === undefined || visitState.visitCount <= 1;
  const obstacleResolved = isObstacleResolved(visitState);

  // Location description from skin (entry/revisit) or core node descriptionKey
  let locationDescription = '';
  if (node.activeSkin) {
    locationDescription = isFirstVisit
      ? node.activeSkin.entryDescription.fr
      : node.activeSkin.revisitDescription.fr;
  }
  // Fall back to core node descriptionKey if no skin or empty skin text
  if (!locationDescription && node.coreNodeId) {
    // Core nodes have descriptionKey from skeleton — already stored on the node
    // The node doesn't carry descriptionKey directly; use nameKey as minimal fallback
    locationDescription = node.nameKey.fr;
  }
  if (!locationDescription) {
    locationDescription = node.nameKey.fr;
  }

  // Obstacle hint
  const obstacleHint = (!obstacleResolved && node.obstacle)
    ? node.obstacle.description.fr
    : null;

  // Visible items (not taken, not hidden)
  const visibleItems = node.items
    .filter(item => !item.hidden && isItemAvailable(visitState, item.id))
    .map(item => {
      const def = ITEM_DEFINITIONS[item.id];
      const name = def ? t(def.nameKey) : getScenarioNameFr(item.id);
      return { id: item.id, name };
    });

  // Environment features
  const visibleFeatures = node.features.map(feat => {
    const def = ENVIRONMENT_FEATURE_DEFINITIONS[feat.id];
    const name = def ? t(def.nameKey) : getScenarioNameFr(feat.id);
    return { id: feat.id, name };
  });

  // NPCs present
  const visibleNpcs = (node.npcs ?? []).map(npc => {
    const def = NPC_DEFINITIONS[npc.id];
    const name = def ? t(def.nameKey) : getScenarioNameFr(npc.id);
    return { id: npc.id, name };
  });

  // Exits
  const exits = connectedLocations.map(loc => ({
    name: loc.aliases[0] ?? loc.id,
    visited: loc.visited ?? false,
  }));

  return {
    locationDescription,
    obstacleHint,
    visibleItems,
    visibleFeatures,
    visibleNpcs,
    exits,
  };
}

// ---------------------------------------------------------------------------
// HELPERS — convert scenario definitions to engine types
// ---------------------------------------------------------------------------

function itemDefToResolvedTarget(id: string): ResolvedTarget {
  return {
    id,
    nameKey: id,
    properties: [],
    isVirtual: false,
    source: 'location',
    aliases: [id],
  };
}

function inventoryItemToResolvedTarget(id: string): ResolvedTarget {
  return {
    id,
    nameKey: id,
    properties: [],
    isVirtual: false,
    source: 'inventory',
    aliases: [id],
  };
}

function npcDefToNpcInstance(id: string): NpcInstance {
  return {
    id,
    definitionId: id,
    nameKey: id,
    aliases: [id],
    properties: [],
    hp: 10,
  };
}

function featureDefToInstance(id: string): EnvironmentFeatureInstance {
  return {
    id,
    definitionId: id,
    nameKey: id,
    aliases: [id],
    properties: [],
  };
}

function getLocationAliases(node: LocationNode): readonly string[] {
  const fr = node.nameKey.fr;
  return fr ? [fr.toLowerCase()] : [node.id];
}

// ---------------------------------------------------------------------------
// EMPTY CONTEXT — fallback when no scenario loaded
// ---------------------------------------------------------------------------

function buildEmptyContext(): SceneContext {
  return {
    inventory: [],
    locationItems: [],
    npcs: [],
    environmentFeatures: [],
    connectedLocations: [],
    suggestions: [],
    environmentConditions: [],
    atmosphere: 'pressurized',
    locationId: undefined,
    scenarioSuggestions: [],
    hasBlackBox: false,
  };
}

// ---------------------------------------------------------------------------
// BOT SCENE BUILDER — convert SceneContext to BotScene for stress tests
// ---------------------------------------------------------------------------

/** Checks if any item in a list is a known healing item */
export function sceneHasHealingItem(itemIds: readonly string[]): boolean {
  return itemIds.some(id => HEALING_ITEM_IDS.has(id));
}

/** Format a SuggestionCandidate as a playable text input */
export function formatSuggestionAsInput(candidate: SuggestionCandidate): string {
  return `${candidate.verbText} ${candidate.targetText}`;
}
