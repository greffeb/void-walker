// ---------------------------------------------------------------------------
// src/engine/scene.ts — Phase 6B: Scenario-aware SceneContext builder
// ---------------------------------------------------------------------------
// Builds a SceneContext from the current GameState + AssembledScenario.
// Populates scenario-aware suggestions, exit exploration status, and
// Black Box flags. Pure function — no side effects.
// ---------------------------------------------------------------------------

import type { GameState, SceneContext, SceneDescription, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance } from './types';
import type { LocationNode, NarrativeSkin, LocationVisitState, FeatureDefinition, ItemDefinition, InteractionResult } from './scenario';
import type { VerbId } from './verbs';
import type { SuggestionCandidate } from './suggestions';
import type { StringKey } from '../i18n/types';
import { generateSuggestions, isExcludedFromSuggestions } from './suggestions';
import { getExitsWithStatus } from './backtracking';
import { isItemAvailable, isObstacleResolved, isMovementOnlyPath } from './backtracking';
import { resolveProperties } from './properties';
import { ITEM_DEFINITIONS } from '../content/items';
import { ENVIRONMENT_FEATURE_DEFINITIONS } from '../content/environments';
import { featureDisplayName, itemDisplayName, npcDisplayName, displayNameOrId } from '../content/featureNames';
import { NPC_DEFINITIONS } from '../content/npcs';
import { t, getLocale } from '../i18n/index';
import { isEnrichedFeature, isEnrichedItem } from './scenario';
import type { EntityState } from './entityState';
import { makeEntityState, stateMatchesToken } from './entityState';
import { getFeatureState, isItemRevealed, pickStateDescription, isExitUnlocked } from './featureState';
import { deriveConditions, locationStateFromAtmosphere, atmosphereOf } from './locationState';
import { isNpcAlive } from './victory';
import { buildObstacleVerbMap } from '../content/parserData';
import { MOVEMENT_VERBS, getVerbStat } from './verbs';

// ---------------------------------------------------------------------------
// OBSTACLE VERB → LOCALIZED DISPLAY NAME
// ---------------------------------------------------------------------------

/** A VerbId as the player would type it, or null when the locale has no wording. */
function verbIdToDisplay(verbId: string): string | null {
  const key = `verb.${verbId}` as StringKey;
  const resolved = t(key);
  if (resolved === key) return null;
  return resolved[0]!.toLowerCase() + resolved.slice(1);
}

/**
 * Map an English obstacle path verb to a localized display string for suggestions.
 * The mapping (English authoring verb → VerbId → localized name) lives in
 * 'parser.obstacleVerbs' in the i18n locale files — no hardcoded strings here.
 */
function obstaclVerbToFrench(verb: string): string {
  const lower = verb.toLowerCase();

  // Step 1: Lookup in obstacleVerbMap → VerbId → localized name via t()
  const verbId = buildObstacleVerbMap(getLocale()).get(lower);
  if (verbId) {
    const resolved = verbIdToDisplay(verbId);
    if (resolved !== null) return resolved;
  }

  // Step 2: Direct VerbId i18n lookup (e.g. module uses "PUSH" verbatim)
  const directResolved = verbIdToDisplay(verb.toUpperCase());
  if (directResolved !== null) return directResolved;

  // Step 3: Return verb as-is
  return verb;
}

/**
 * Pick the verb a suggestion should display for an obstacle path, and say
 * whether it may name the obstacle's target.
 *
 * A path lists several wordings of the same attempt, and the first one is not
 * always usable as an instruction. `verbs: ['move', 'go', 'navigate']` describes
 * feeling your way across a dark room; paired with the obstacle's target it read
 * "se deplacer Luminaire", which the parser rightly takes as walking — so the
 * suggestion could never reach the obstacle it was advertising.
 */
function pickSuggestionVerb(verbs: readonly string[]): { verbText: string; namesTarget: boolean } {
  const map = buildObstacleVerbMap(getLocale());
  if (isMovementOnlyPath(verbs, map)) {
    // Every wording is a movement: keep it, but do not point it at an object.
    return { verbText: obstaclVerbToFrench(verbs[0] ?? 'examine'), namesTarget: false };
  }
  for (const verb of verbs) {
    const verbId = map.get(verb.toLowerCase());
    if (verbId === undefined) continue;
    if (MOVEMENT_VERBS.has(verbId)) continue;
    // A verb the game never proposes stays unproposed, even when a module
    // names it on a path (decision W).
    if (isExcludedFromSuggestions(verbId)) continue;
    return { verbText: obstaclVerbToFrench(verb), namesTarget: true };
  }
  const first = verbs[0] ?? 'examine';
  return { verbText: obstaclVerbToFrench(first), namesTarget: true };
}

// ---------------------------------------------------------------------------
// SHUT FEATURES — the acts a scenario rule will actually answer to
// ---------------------------------------------------------------------------

/** True when succeeding at this rule moves the game, rather than just describing it. */
function interactionAdvances(result: InteractionResult): boolean {
  return result.newState !== undefined
    || (result.revealsItems?.length ?? 0) > 0
    || result.revealsExit !== undefined
    || result.flagSet !== undefined
    || result.resolveObstacle === true;
}

/**
 * True when the rule's gain has already been taken. Without this the scene kept
 * proposing a terminal the player had already read, forever.
 */
function nothingLeftToGain(
  result: InteractionResult,
  instance: EnvironmentFeatureInstance,
  scenarioFlags: Readonly<Record<string, boolean>>,
): boolean {
  const stateReached = result.newState === undefined
    || stateMatchesToken(instance.state, result.newState);
  const flagTaken = result.flagSet !== undefined && scenarioFlags[result.flagSet] === true;
  if (result.flagSet !== undefined) return flagTaken && stateReached;
  return result.newState !== undefined && stateReached;
}

/** Standing in one of these kills you — the engine's own `isLethalLocation`. */
const LETHAL_LOCATION_STATES: ReadonlySet<string> = new Set(['depressurized', 'burning']);

/**
 * True when succeeding at this act makes the room the player is standing in
 * lethal. The cargo jettison lever vents the bay the player is in; it carries a
 * new state and a flag, so it read as progress and was proposed beside the acts
 * that win the game. The player may still pull it — the engine never refuses —
 * but the game will not suggest it.
 */
function killsTheDoer(result: InteractionResult, nodeId: string): boolean {
  return (result.consequences ?? []).some(
    c => c.type === 'environment_change'
      && c.locationState !== undefined
      && LETHAL_LOCATION_STATES.has(c.locationState)
      && (c.locationId === undefined || c.locationId === nodeId),
  );
}

/** The verb of a trigger, as an instruction: never a movement, never a secret. */
function pickInteractionVerb(trigger: VerbId | readonly VerbId[]): VerbId | null {
  const verbs = Array.isArray(trigger) ? trigger as readonly VerbId[] : [trigger as VerbId];
  for (const verbId of verbs) {
    if (MOVEMENT_VERBS.has(verbId)) continue;
    if (isExcludedFromSuggestions(verbId)) continue;
    return verbId;
  }
  return null;
}

/** Display name of an item, whichever registry holds it. */
function itemDisplayName(id: string): string {
  const def = ITEM_DEFINITIONS[id];
  return def ? t(def.nameKey) : resolveDisplayName(`item.${id}`, id);
}

/** Every carried item, with the scenario definition when one placed it. */
function carriedItemDefinitions(
  graph: import('./scenario').LocationGraph,
  inventory: readonly string[],
): { id: string; def?: ItemDefinition }[] {
  return inventory.map(id => {
    for (const node of graph.nodes) {
      const def = node.items.find(i => i.id === id);
      if (def) return { id, def };
    }
    return { id };
  });
}

/**
 * What the player may do, right now, to the shut things in this room.
 *
 * Until this existed the scene only ever offered `examiner` for a feature: every
 * real verb came from `node.obstacle.paths`, and core nodes carry no obstacle.
 * The locker holding the gate item was therefore never once named as openable
 * across eight full games — and a route the game never mentions is a route the
 * player has to guess. Each candidate is read from the feature's own trigger, so
 * a rule that cannot fire is never advertised.
 */
function buildShutFeatureCandidates(
  node: LocationNode,
  features: readonly EnvironmentFeatureInstance[],
  carriedItems: readonly { id: string; def?: ItemDefinition }[],
  scenarioFlags: Readonly<Record<string, boolean>>,
): Omit<SuggestionCandidate, 'score'>[] {
  const candidates: Omit<SuggestionCandidate, 'score'>[] = [];
  const useVerb = verbIdToDisplay('USE');
  const targetPreposition = t('parser.prepositions.target').split(',')[0]?.trim();
  const carriedItemIds = carriedItems.map(i => i.id);

  const useOnText = (itemId: string, featureName: string): string =>
    `${itemDisplayName(itemId)} ${targetPreposition} ${featureName}`;

  for (const def of node.features) {
    if (!isEnrichedFeature(def) || !def.interactions) continue;
    const instance = features.find(f => f.id === def.id);
    if (!instance) continue;
    const featureName = t(instance.nameKey as StringKey);

    for (const { trigger, onSuccess } of def.interactions) {
      if (!interactionAdvances(onSuccess)) continue;
      if (nothingLeftToGain(onSuccess, instance, scenarioFlags)) continue;
      if (killsTheDoer(onSuccess, node.id)) continue;
      if (trigger.requiredState !== undefined
          && !stateMatchesToken(instance.state, trigger.requiredState)) continue;
      if (trigger.requiredFlag !== undefined && scenarioFlags[trigger.requiredFlag] !== true) continue;
      if (trigger.requiredItem !== undefined && !carriedItemIds.includes(trigger.requiredItem)) continue;

      const verbId = pickInteractionVerb(trigger.verb);
      if (verbId === null) continue;
      const verbText = verbIdToDisplay(verbId);
      if (verbText === null) continue;

      const stat = trigger.stat ?? getVerbStat(verbId, instance.properties);

      // A rule gated on an item is proposed as using that item, so the player
      // learns what the thing in their hands is for.
      if (trigger.requiredItem !== undefined && useVerb !== null && targetPreposition) {
        candidates.push({
          verbText: useVerb,
          targetText: useOnText(trigger.requiredItem, featureName),
          stat,
          category: 'obstacle',
          equipped: true,
        });
        continue;
      }

      candidates.push({
        verbText, targetText: featureName, stat, category: 'obstacle',
        equipped: trigger.requiredFlag !== undefined,
      });
    }
  }

  // What the things in your hands are for. These rules hang off the *item*, not
  // the feature, which is why the badge — the whole point of the scenario — was
  // never once proposed: the reader forced the pod hatch instead and lost.
  if (useVerb !== null && targetPreposition) {
    for (const { id: itemId, def } of carriedItems) {
      if (def === undefined || !isEnrichedItem(def) || !def.useOn) continue;
      for (const { targetId, interaction } of def.useOn) {
        const instance = features.find(f => f.id === targetId);
        if (!instance) continue;
        if (!interactionAdvances(interaction.onSuccess)) continue;
        if (nothingLeftToGain(interaction.onSuccess, instance, scenarioFlags)) continue;
        if (killsTheDoer(interaction.onSuccess, node.id)) continue;

        candidates.push({
          verbText: useVerb,
          targetText: useOnText(itemId, t(instance.nameKey as StringKey)),
          stat: interaction.trigger.stat ?? getVerbStat('USE', instance.properties),
          category: 'obstacle',
          equipped: true,
        });
      }
    }
  }

  return candidates;
}

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

  // --- Items: exclude taken ones and unrevealed (revealedBy) items ---
  const visitState = state.visitedLocations[playerLocationId];
  const staticLocationItems: ResolvedTarget[] = node.items
    .filter(item => isItemAvailable(visitState, item.id))
    .filter(item => {
      if (isEnrichedItem(item) && item.revealedBy) {
        return isItemRevealed(state, item);
      }
      return true;
    })
    .map(item => itemDefToResolvedTarget(item.id, item));

  // Dropped loot: items thrown/dropped by the player that haven't been re-taken
  const playerInventory = state.character?.inventory ?? [];
  const droppedLoot: ResolvedTarget[] = (visitState?.droppedItems ?? [])
    .filter(id => !playerInventory.includes(id))
    .map(id => itemDefToResolvedTarget(id));

  const locationItems: ResolvedTarget[] = [...staticLocationItems, ...droppedLoot];

  // --- Inventory ---
  const inventory: ResolvedTarget[] = (state.character?.inventory ?? []).map(
    id => inventoryItemToResolvedTarget(id),
  );

  // --- NPCs: only alive ones in this location ---
  const npcs: NpcInstance[] = (node.npcs ?? [])
    .filter(npcDef => {
      const npcState = state.npcStates[npcDef.id];
      return npcState === undefined || (isNpcAlive(npcState) && npcState.locationId === playerLocationId);
    })
    .map(npcDef => npcDefToNpcInstance(npcDef.id, state.npcStates[npcDef.id]?.state ?? {}));

  // The thing you are fighting is here, whatever the node declares. Combat can
  // be opened by the threat director against an entity no node lists, and the
  // scene then offered "frapper <name>" for someone the player could not name.
  const fighting = state.activeCombat?.npcInstanceId;
  if (fighting !== undefined && !npcs.some(n => n.id === fighting)) {
    npcs.push(npcDefToNpcInstance(fighting, state.npcStates[fighting]?.state ?? {}));
  }

  // --- Environment features ---
  const environmentFeatures: EnvironmentFeatureInstance[] = node.features.map(
    feat => featureDefToInstance(feat.id, feat, getFeatureState(state, feat.id, feat)),
  );

  // --- Connected locations with exploration status ---
  const visitedIds = Object.keys(state.visitedLocations);
  const exits = getExitsWithStatus(playerLocationId, graph.edges, visitedIds);
  const allConnectedLocations = exits.map(exit => {
    const exitNode = graph.nodes.find(n => n.id === exit.locationId);
    return {
      id: exit.locationId,
      aliases: exitNode ? getLocationAliases(exitNode) : [exit.locationId],
      displayName: exitNode?.nameKey.fr ?? undefined,
      visited: exit.visited,
    };
  })
    // Filter out hidden micro-module exits that are not yet revealed
    .filter(loc => {
      const exitNode = graph.nodes.find(n => n.id === loc.id);
      if (!exitNode?.isMicroModule || !exitNode.microModuleId) return true;
      const mmState = (state.microModuleStates ?? {})[exitNode.microModuleId];
      return mmState?.revealed ?? false;
    });

  // --- Obstacle gate: hide unvisited exits when obstacle is unresolved ---
  // When the current node has an unresolved obstacle, the player must deal
  // with it before progressing. Only already-visited locations (backtracking)
  // remain accessible. This filters exits for the parser, suggestions, and
  // scene description simultaneously.
  const obstacleResolved = isObstacleResolved(visitState);
  const hasUnresolvedObstacle = !obstacleResolved && !!node.obstacle;
  const connectedLocations = hasUnresolvedObstacle
    ? allConnectedLocations.filter(loc => loc.visited)
    : allConnectedLocations;
  // A sealed way stays nameable — the engine answers "still sealed" and the
  // player learns there is a door — but it is never *suggested*, because a list
  // of three lines has no room for one that cannot work yet.
  const walkableLocations = connectedLocations.filter(loc => {
    const edge = graph.edges.find(e => e.from === playerLocationId && e.to === loc.id);
    return edge?.locked !== true || isExitUnlocked(state, playerLocationId, loc.id);
  });
  const activeSkin = node.activeSkin ?? null;
  const playerClass = state.character?.className ?? 'marine';
  // Derive combat NPC display name if in active combat
  const combatNpcName = state.activeCombat
    ? t((`npc.${state.activeCombat.npcInstanceId}`) as StringKey)
    : undefined;
  const activeCombatNpcName = combatNpcName && combatNpcName !== `npc.${state.activeCombat?.npcInstanceId}`
    ? combatNpcName
    : state.activeCombat ? state.activeCombat.npcInstanceId.replace(/_/g, ' ') : undefined;

  const scenarioSuggestions = buildSuggestionCandidates(
    node,
    obstacleResolved,
    walkableLocations,
    locationItems,
    npcs,
    environmentFeatures,
    carriedItemDefinitions(graph, state.character?.inventory ?? []),
    state.scenarioFlags ?? {},
    activeSkin,
    playerClass,
    activeCombatNpcName,
    state.character?.conditions.map(c => c.id),
  );

  // --- Skeleton node description (first visit only) ---
  // CoreSkeletonNode.descriptionKey contains rich scene-setting text for each story beat.
  // Inject it on the first visit to skeleton nodes so the player gets narrative context.
  let skeletonDescription: string | undefined;
  if (node.coreNodeId) {
    const visitCount = visitState?.visitCount ?? 0;
    if (visitCount <= 1) {
      const skeletonNode = scenario.skeleton.nodes.find(n => n.id === node.coreNodeId);
      skeletonDescription = skeletonNode?.descriptionKey.fr;
    }
  }

  // --- Scenario intro: shown once, on first visit to start node only ---
  let scenarioIntro: string | undefined;
  if (node.coreNodeId === 'start') {
    const visitCount = visitState?.visitCount ?? 0;
    if (visitCount <= 1) {
      scenarioIntro = scenario.skeleton.descriptionKey?.fr;
    }
  }

  // --- Scene description for UI and narration ---
  const sceneDescription = buildSceneDescription(node, visitState, connectedLocations, state.featureStates ?? {}, skeletonDescription, scenarioIntro);

  // The node's declared atmosphere is only a starting point: fire, breaches and
  // scenario consequences move it afterwards (decision U).
  const currentLocationState = state.locationStates?.[node.id]
    ?? locationStateFromAtmosphere(node.atmosphere);

  return {
    inventory,
    locationItems,
    npcs,
    environmentFeatures,
    connectedLocations,
    suggestions: [],           // ParsedAction[] remains empty; parser uses its own resolution
    walkableLocationIds: walkableLocations.map(l => l.id),
    environmentConditions: deriveConditions(currentLocationState),
    atmosphere: atmosphereOf(currentLocationState),
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
  connectedLocations: readonly { id: string; aliases: readonly string[]; displayName?: string; visited?: boolean }[],
  locationItems: readonly ResolvedTarget[],
  npcs: readonly NpcInstance[],
  environmentFeatures: readonly EnvironmentFeatureInstance[],
  carriedItems: readonly { id: string; def?: ItemDefinition }[],
  scenarioFlags: Readonly<Record<string, boolean>>,
  activeSkin: NarrativeSkin | null,
  playerClass: import('./types').PlayerClassName,
  activeCombatNpcName?: string,
  playerConditions?: readonly string[],
): readonly SuggestionCandidate[] {
  // When in combat, suggest combat-specific actions — and always a way out.
  // A bare "fuir" names no destination, which the parser rejects outright, so
  // the only escape line the scene offered did nothing at all: a reader who met
  // the boss stayed there until the turn limit, whatever they picked. The way
  // out includes the door: at the boss node the act that ends the game is
  // opening the pod, and hiding it behind the fight made victory unreachable.
  if (activeCombatNpcName) {
    const combatCandidates: Omit<SuggestionCandidate, 'score'>[] = [
      { verbText: 'frapper', targetText: activeCombatNpcName, stat: 'FOR', category: 'obstacle' },
      { verbText: 'tirer sur', targetText: activeCombatNpcName, stat: 'AGI', category: 'obstacle' },
      ...buildShutFeatureCandidates(node, environmentFeatures, carriedItems, scenarioFlags),
    ];
    // Unexplored first: fleeing forward is how a chase ends somewhere new.
    const escapes = [
      ...connectedLocations.filter(l => !l.visited),
      ...connectedLocations.filter(l => l.visited),
    ].slice(0, 2);
    for (const [index, loc] of escapes.entries()) {
      combatCandidates.push({
        verbText: index === 0 ? 'fuir' : 'aller',
        targetText: loc.aliases[0] ?? loc.id,
        stat: 'AGI',
        category: 'movement',
      });
    }
    if (escapes.length === 0) {
      combatCandidates.push({ verbText: 'fuir', targetText: '', stat: 'AGI', category: 'movement' });
    }
    return generateSuggestions(combatCandidates, playerClass, activeSkin);
  }

  const candidates: Omit<SuggestionCandidate, 'score'>[] = [];

  // Obstacle paths (highest priority)
  if (!obstacleResolved && node.obstacle) {
    for (const path of node.obstacle.paths) {
      // Resolve target display name — check NPCs first, then features, then fallback
      const obstacleTargetId = node.obstacle.targetId;
      let targetDisplayName: string;
      if (obstacleTargetId) {
        const isNpc = (node.npcs ?? []).some(n => n.id === obstacleTargetId);
        const resolved = isNpc ? npcDisplayName(obstacleTargetId) : featureDisplayName(obstacleTargetId);
        targetDisplayName = displayNameOrId(resolved, obstacleTargetId);
      } else {
        targetDisplayName = node.obstacle.description.fr;
      }
      const suggestionVerb = pickSuggestionVerb(path.verbs);
      candidates.push({
        verbText: suggestionVerb.verbText,
        targetText: suggestionVerb.namesTarget ? targetDisplayName : '',
        stat: path.stat,
        category: 'obstacle',
      });
    }
  }

  // Shut things, and what this player can currently do about them
  candidates.push(...buildShutFeatureCandidates(node, environmentFeatures, carriedItems, scenarioFlags));

  // Location items
  for (const item of locationItems) {
    candidates.push({
      verbText: 'prendre',
      targetText: t(item.nameKey as StringKey),
      stat: 'INT',
      category: 'item',
    });
  }

  // NPCs
  for (const npc of npcs) {
    candidates.push({
      verbText: 'examiner',
      targetText: t(npc.nameKey as StringKey),
      stat: 'PER',
      category: 'npc',
    });
  }

  // Environment features — suggest examining/interacting with them
  if (node.features) {
    for (const feat of node.features) {
      const name = displayNameOrId(featureDisplayName(feat.id), feat.id);
      candidates.push({
        verbText: 'examiner',
        targetText: name,
        stat: 'PER',
        category: 'environment',
      });
    }
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

  // Contextual: suggest WAIT when exhausted (WAIT cures exhaustion)
  if (playerConditions?.includes('exhausted')) {
    candidates.push({
      verbText: 'se reposer',
      targetText: '',
      stat: 'DEF',
      category: 'environment',
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
  featureStates: Readonly<Record<string, EntityState>>,
  skeletonDescription?: string,
  scenarioIntro?: string,
): SceneDescription {
  const isFirstVisit = visitState === undefined || visitState.visitCount <= 1;
  const obstacleResolved = isObstacleResolved(visitState);

  // Location name — always the actual location name from the node
  const locationName = node.nameKey.fr;

  // Location flavor text: on first visit to a skeleton node, use the skeleton's rich description.
  // Otherwise use the skin's entry/revisit description.
  let locationDescription = '';
  if (skeletonDescription) {
    locationDescription = skeletonDescription;
  } else if (node.activeSkin) {
    if (obstacleResolved && node.obstacle) {
      // Obstacle has been dealt with — use the generic revisit description
      locationDescription = node.activeSkin.revisitDescription.fr;
    } else {
      locationDescription = isFirstVisit
        ? node.activeSkin.entryDescription.fr
        : node.activeSkin.revisitDescription.fr;
    }
  }

  // Obstacle hint
  const obstacleHint = (!obstacleResolved && node.obstacle)
    ? node.obstacle.description.fr
    : null;

  // Visible items (not taken, not hidden, not behind a locked revealedBy gate)
  const staticVisibleItems = node.items
    .filter(item => {
      if (!isItemAvailable(visitState, item.id)) return false;
      if (isEnrichedItem(item) && item.revealedBy) {
        const gate = featureStates[item.revealedBy.featureId];
        return gate !== undefined && stateMatchesToken(gate, item.revealedBy.requiredState);
      }
      return !item.hidden;
    })
    .map(item => ({ id: item.id, name: displayNameOrId(itemDisplayName(item.id), item.id) }));

  // Dropped loot visible in scene description
  const droppedVisible = (visitState?.droppedItems ?? []).map(id => (
    { id, name: displayNameOrId(itemDisplayName(id), id) }
  ));

  const visibleItems = [...staticVisibleItems, ...droppedVisible];

  // Environment features. The name is what the scene enumerates and highlights;
  // the state description is what an EXAMINE reveals. Conflating the two is how
  // a whole paragraph ended up rendered as an object's name.
  const visibleFeatures = node.features.map(feat => {
    const currentState = featureStates[feat.id] ?? makeEntityState(feat.initialState);
    const stateDescription = pickStateDescription(feat.descriptions, currentState);
    const name = displayNameOrId(featureDisplayName(feat.id), feat.id);
    return { id: feat.id, name, stateDescription: stateDescription?.fr ?? null };
  });

  // NPCs present
  const visibleNpcs = (node.npcs ?? []).map(npc => (
    { id: npc.id, name: displayNameOrId(npcDisplayName(npc.id), npc.id) }
  ));

  // Exits
  const exits = connectedLocations.map(loc => ({
    name: loc.aliases[0] ?? loc.id,
    visited: loc.visited ?? false,
  }));

  return {
    locationName,
    locationDescription,
    scenarioIntro,
    obstacleHint,
    visibleItems,
    visibleFeatures,
    visibleNpcs,
    exits,
  };
}

// ---------------------------------------------------------------------------
// HELPERS — convert scenario definitions to engine types
// Checks content registries first (ITEM_DEFINITIONS, NPC_DEFINITIONS,
// ENVIRONMENT_FEATURE_DEFINITIONS), then falls back to i18n keys for
// scenario-only entities. Never returns raw IDs as nameKey.
// ---------------------------------------------------------------------------

/** Parse comma-separated aliases from an i18n key, returns empty if key missing */
function parseAliases(aliasesKey: StringKey): readonly string[] {
  const raw = t(aliasesKey);
  if (!raw || raw === aliasesKey) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/** Get the French display name for an i18n key, falling back to humanized ID */
function resolveDisplayName(i18nKey: string, id: string): string {
  const resolved = t(i18nKey as StringKey);
  // t() returns the key itself when missing — detect that
  if (resolved === i18nKey) return displayNameOrId(null, id);
  return resolved;
}

function itemDefToResolvedTarget(id: string, scenarioDef?: ItemDefinition): ResolvedTarget {
  const def = ITEM_DEFINITIONS[id];
  if (def) {
    // Decision AA: the two registries merge instead of one silently winning.
    // The generic entry gives the type and the i18n keys; a scenario placing it
    // may still add its own aliases and properties.
    const enriched = scenarioDef !== undefined && isEnrichedItem(scenarioDef) ? scenarioDef : undefined;
    const frName = t(def.nameKey).toLowerCase();
    const aliases = [
      id, frName, ...parseAliases(def.aliasesKey),
      ...(enriched?.aliases ? enriched.aliases[getLocale()] : []),
    ];
    const properties = resolveProperties({
      objectCategory: 'item',
      baseType: def.type,
      extra_props: [...def.extra_props, ...(enriched?.extraProperties ?? [])],
      remove_props: [...(def.remove_props ?? []), ...(enriched?.removeProperties ?? [])],
    });
    return { id, nameKey: def.nameKey, properties, isVirtual: false, source: 'location', aliases };
  }
  // Scenario-only item — check for enriched definition
  if (scenarioDef && isEnrichedItem(scenarioDef) && scenarioDef.itemType) {
    const locale = getLocale();
    const nameKey = `item.${id}` as StringKey;
    const frName = resolveDisplayName(nameKey, id);
    const aliasesFromDef = scenarioDef.aliases ? [...scenarioDef.aliases[locale]] : [];
    const aliases = [id, frName.toLowerCase(), ...aliasesFromDef];
    const properties = resolveProperties({
      objectCategory: 'item',
      baseType: scenarioDef.itemType,
      extra_props: scenarioDef.extraProperties ?? [],
      remove_props: scenarioDef.removeProperties ?? [],
    });
    return { id, nameKey, properties, isVirtual: false, source: 'location', aliases };
  }
  // Fallback: scenario-only item with no enriched data
  const nameKey = `item.${id}` as StringKey;
  const frName = resolveDisplayName(nameKey, id);
  return {
    id,
    nameKey,
    properties: ['tangible', 'liftable', 'small'],
    isVirtual: false,
    source: 'location',
    aliases: [id, frName.toLowerCase()],
  };
}

function inventoryItemToResolvedTarget(id: string): ResolvedTarget {
  const def = ITEM_DEFINITIONS[id];
  if (def) {
    const frName = t(def.nameKey).toLowerCase();
    const aliases = [id, frName, ...parseAliases(def.aliasesKey)];
    const properties = resolveProperties({
      objectCategory: 'item',
      baseType: def.type,
      extra_props: def.extra_props,
      remove_props: def.remove_props,
    });
    return { id, nameKey: def.nameKey, properties, isVirtual: false, source: 'inventory', aliases };
  }
  const nameKey = `item.${id}` as StringKey;
  const frName = resolveDisplayName(nameKey, id);
  return {
    id,
    nameKey,
    properties: ['tangible', 'liftable', 'small'],
    isVirtual: false,
    source: 'inventory',
    aliases: [id, frName.toLowerCase()],
  };
}

function npcDefToNpcInstance(id: string, currentState: EntityState = {}): NpcInstance {
  const def = NPC_DEFINITIONS[id];
  if (def) {
    const frName = t(def.nameKey).toLowerCase();
    const aliases = [id, frName, ...parseAliases(def.aliasesKey)];
    const properties = resolveProperties({
      objectCategory: 'npc',
      baseType: def.type,
      extra_props: def.extra_props,
    });
    return {
      id,
      definitionId: id,
      nameKey: def.nameKey,
      aliases,
      properties,
      state: currentState,
      hp: def.hp,
      bodyParts: [],
    };
  }
  // Scenario-only NPC → use i18n key + aliases key
  const nameKey = `npc.${id}` as StringKey;
  const aliasesKey = `npc.${id}.aliases` as StringKey;
  const frName = resolveDisplayName(nameKey, id);
  const aliases = [id, frName.toLowerCase(), ...parseAliases(aliasesKey)];
  return {
    id,
    definitionId: id,
    nameKey,
    aliases,
    properties: ['tangible', 'visible'],
    state: currentState,
    hp: 10,
    bodyParts: [],
  };
}

function featureDefToInstance(
  id: string,
  scenarioDef?: FeatureDefinition,
  currentState: EntityState = {},
): EnvironmentFeatureInstance {
  // 1. Check content registry first
  const def = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (def) {
    // Decision AA: merge, do not override. A scenario placing a generic feature
    // may still add aliases and properties of its own.
    const enriched = scenarioDef !== undefined && isEnrichedFeature(scenarioDef) ? scenarioDef : undefined;
    const frName = t(def.nameKey).toLowerCase();
    const aliases = [
      id, frName, ...parseAliases(def.aliasesKey),
      ...(enriched?.aliases ? enriched.aliases[getLocale()] : []),
    ];
    const properties = resolveProperties({
      objectCategory: 'environment',
      baseType: def.type,
      extra_props: [...def.extra_props, ...(enriched?.extraProperties ?? [])],
      remove_props: enriched?.removeProperties ?? [],
    });
    return { id, definitionId: id, nameKey: def.nameKey, aliases, properties, state: currentState };
  }

  // 2. Check if scenario definition is enriched
  if (scenarioDef && isEnrichedFeature(scenarioDef) && scenarioDef.featureType) {
    const locale = getLocale();
    const nameKey = `env.${id}` as StringKey;
    const frName = resolveDisplayName(nameKey, id);
    const aliasesFromDef = scenarioDef.aliases ? [...scenarioDef.aliases[locale]] : [];
    const aliases = [id, frName.toLowerCase(), ...aliasesFromDef];

    // Properties describe what the feature is; its state travels separately.
    const properties = resolveProperties({
      objectCategory: 'environment',
      baseType: scenarioDef.featureType,
      extra_props: scenarioDef.extraProperties ?? [],
      remove_props: scenarioDef.removeProperties ?? [],
    });

    return { id, definitionId: id, nameKey, aliases, properties, state: currentState };
  }

  // 3. Fallback: scenario-only feature without enriched data
  const nameKey = `env.${id}` as StringKey;
  const frName = resolveDisplayName(nameKey, id);
  // Check if i18n has aliases for this feature (env.X.aliases)
  const i18nAliases = parseAliases(`env.${id}.aliases` as StringKey);
  return {
    id,
    definitionId: id,
    nameKey,
    aliases: [id, frName.toLowerCase(), ...i18nAliases],
    properties: ['tangible', 'visible'],
    state: currentState,
  };
}

function getLocationAliases(node: LocationNode): readonly string[] {
  const fr = node.nameKey.fr;
  if (!fr) return [node.id];
  const lower = fr.toLowerCase();
  const aliases: string[] = [lower, node.id];
  // Split compound names: "Soute principale" → ["soute principale", "soute", "principale"]
  const words = lower.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    if (!aliases.includes(word)) aliases.push(word);
  }
  return aliases;
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
