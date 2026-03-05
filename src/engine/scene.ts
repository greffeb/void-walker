// ---------------------------------------------------------------------------
// src/engine/scene.ts — Phase 6B: Scenario-aware SceneContext builder
// ---------------------------------------------------------------------------
// Builds a SceneContext from the current GameState + AssembledScenario.
// Populates scenario-aware suggestions, exit exploration status, and
// Black Box flags. Pure function — no side effects.
// ---------------------------------------------------------------------------

import type { GameState, SceneContext, SceneDescription, ResolvedTarget, NpcInstance, EnvironmentFeatureInstance } from './types';
import type { LocationNode, NarrativeSkin, LocationVisitState, FeatureDefinition, ItemDefinition, FeatureState } from './scenario';
import type { SuggestionCandidate } from './suggestions';
import type { StringKey } from '../i18n/types';
import type { PropertyId } from './properties';
import { generateSuggestions } from './suggestions';
import { getExitsWithStatus } from './backtracking';
import { isItemAvailable, isObstacleResolved } from './backtracking';
import { resolveProperties } from './properties';
import { ITEM_DEFINITIONS } from '../content/items';
import { ENVIRONMENT_FEATURE_DEFINITIONS } from '../content/environments';
import { NPC_DEFINITIONS } from '../content/npcs';
import { t, getLocale } from '../i18n/index';
import { isEnrichedFeature, isEnrichedItem } from './scenario';
import { getFeatureState, isItemRevealed } from './featureState';
import { buildObstacleVerbMap } from '../content/parserData';

// ---------------------------------------------------------------------------
// OBSTACLE VERB → LOCALIZED DISPLAY NAME
// ---------------------------------------------------------------------------

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
    const key = `verb.${verbId}` as StringKey;
    const resolved = t(key);
    if (resolved !== key) return resolved[0]!.toLowerCase() + resolved.slice(1);
  }

  // Step 2: Direct VerbId i18n lookup (e.g. module uses "PUSH" verbatim)
  const directKey = `verb.${verb.toUpperCase()}` as StringKey;
  const directResolved = t(directKey);
  if (directResolved !== directKey) return directResolved[0]!.toLowerCase() + directResolved.slice(1);

  // Step 3: Return verb as-is
  return verb;
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
      return npcState === undefined || (npcState.alive && npcState.locationId === playerLocationId);
    })
    .map(npcDef => npcDefToNpcInstance(npcDef.id));

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
    connectedLocations,
    locationItems,
    npcs,
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

  // --- Scene description for UI and narration ---
  const sceneDescription = buildSceneDescription(node, visitState, connectedLocations, state.featureStates ?? {}, skeletonDescription);

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
  connectedLocations: readonly { id: string; aliases: readonly string[]; displayName?: string; visited?: boolean }[],
  locationItems: readonly ResolvedTarget[],
  npcs: readonly NpcInstance[],
  activeSkin: NarrativeSkin | null,
  playerClass: import('./types').PlayerClassName,
  activeCombatNpcName?: string,
  playerConditions?: readonly string[],
): readonly SuggestionCandidate[] {
  // When in combat, suggest combat-specific actions
  if (activeCombatNpcName) {
    const combatCandidates: Omit<SuggestionCandidate, 'score'>[] = [
      { verbText: 'frapper', targetText: activeCombatNpcName, stat: 'FOR', category: 'obstacle' },
      { verbText: 'tirer sur', targetText: activeCombatNpcName, stat: 'AGI', category: 'obstacle' },
      { verbText: 'fuir', targetText: '', stat: 'AGI', category: 'movement' },
    ];
    return generateSuggestions(combatCandidates, playerClass, activeSkin);
  }

  const candidates: Omit<SuggestionCandidate, 'score'>[] = [];

  // Obstacle paths (highest priority)
  if (!obstacleResolved && node.obstacle) {
    for (const path of node.obstacle.paths) {
      // Resolve target display name — check NPCs first, then features, then fallback
      let targetDisplayName: string;
      if (node.obstacle.targetId) {
        const npcMatch = (node.npcs ?? []).find(n => n.id === node.obstacle!.targetId);
        if (npcMatch) {
          const npcDef = NPC_DEFINITIONS[npcMatch.id];
          targetDisplayName = npcDef ? t(npcDef.nameKey) : resolveDisplayName(`npc.${npcMatch.id}`, npcMatch.id);
        } else {
          const featDef = ENVIRONMENT_FEATURE_DEFINITIONS[node.obstacle.targetId];
          if (featDef) {
            targetDisplayName = t(featDef.nameKey);
          } else {
            targetDisplayName = resolveDisplayName(`env.${node.obstacle.targetId}`, node.obstacle.targetId);
          }
        }
      } else {
        targetDisplayName = node.obstacle.description.fr;
      }
      candidates.push({
        verbText: obstaclVerbToFrench(path.verbs[0] ?? 'examine'),
        targetText: targetDisplayName,
        stat: path.stat,
        category: 'obstacle',
      });
    }
  }

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
      const def = ENVIRONMENT_FEATURE_DEFINITIONS[feat.id];
      const name = def ? t(def.nameKey) : resolveDisplayName(`env.${feat.id}`, feat.id);
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
  featureStates: Readonly<Record<string, FeatureState>>,
  skeletonDescription?: string,
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
        return featureStates[item.revealedBy.featureId] === item.revealedBy.requiredState;
      }
      return !item.hidden;
    })
    .map(item => {
      const def = ITEM_DEFINITIONS[item.id];
      const name = def ? t(def.nameKey) : resolveDisplayName(`item.${item.id}`, item.id);
      return { id: item.id, name };
    });

  // Dropped loot visible in scene description
  const droppedVisible = (visitState?.droppedItems ?? []).map(id => {
    const def = ITEM_DEFINITIONS[id];
    const name = def ? t(def.nameKey) : resolveDisplayName(`item.${id}`, id);
    return { id, name };
  });

  const visibleItems = [...staticVisibleItems, ...droppedVisible];

  // Environment features (use state-based description when available)
  const visibleFeatures = node.features.map(feat => {
    // Get current feature state (from featureStates, fallback to initialState, fallback to 'intact')
    const currentState = featureStates[feat.id] ?? feat.initialState ?? 'intact';

    // Check if the feature definition has a state-based description
    if (feat.descriptions && feat.descriptions[currentState]) {
      // Use the state-based description (e.g. "conduit de ventilation ouvert")
      return { id: feat.id, name: feat.descriptions[currentState].fr };
    }

    // Fall back to registry definition name, then i18n
    const def = ENVIRONMENT_FEATURE_DEFINITIONS[feat.id];
    const name = def ? t(def.nameKey) : resolveDisplayName(`env.${feat.id}`, feat.id);
    return { id: feat.id, name };
  });

  // NPCs present
  const visibleNpcs = (node.npcs ?? []).map(npc => {
    const def = NPC_DEFINITIONS[npc.id];
    const name = def ? t(def.nameKey) : resolveDisplayName(`npc.${npc.id}`, npc.id);
    return { id: npc.id, name };
  });

  // Exits
  const exits = connectedLocations.map(loc => ({
    name: loc.aliases[0] ?? loc.id,
    visited: loc.visited ?? false,
  }));

  return {
    locationName,
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
  if (resolved === i18nKey) return id.replace(/_/g, ' ');
  return resolved;
}

function itemDefToResolvedTarget(id: string, scenarioDef?: ItemDefinition): ResolvedTarget {
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

function npcDefToNpcInstance(id: string): NpcInstance {
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
    properties: ['tangible', 'visible', 'alive'],
    hp: 10,
    bodyParts: [],
  };
}

/**
 * Derive property overrides from a feature's current runtime state.
 * Returns add/remove lists to be merged with base properties.
 */
function deriveStateProperties(
  state: FeatureState | undefined,
): { add: PropertyId[]; remove: PropertyId[] } {
  switch (state) {
    case 'locked':
      return { add: ['locked'], remove: ['open'] };
    case 'open':
      return { add: ['open', 'openable'], remove: ['locked', 'sealed'] };
    case 'closed':
      return { add: ['openable'], remove: ['open'] };
    case 'broken':
    case 'destroyed':
      return { add: ['broken'], remove: ['locked', 'sealed', 'powered'] };
    case 'active':
    case 'activated':
      return { add: ['active', 'powered'], remove: ['inactive', 'unpowered'] };
    case 'inactive':
    case 'offline':
    case 'deactivated':
      return { add: ['unpowered', 'inactive'], remove: ['powered', 'active'] };
    case 'damaged':
      return { add: ['broken'], remove: [] };
    case 'empty':
      return { add: ['open'], remove: ['locked', 'sealed'] };
    case 'repaired':
      return { add: ['powered'], remove: ['broken', 'damaged'] };
    case 'searched':
      return { add: [], remove: ['secured'] };
    default:
      return { add: [], remove: [] };
  }
}

function featureDefToInstance(
  id: string,
  scenarioDef?: FeatureDefinition,
  currentState?: FeatureState,
): EnvironmentFeatureInstance {
  // 1. Check content registry first
  const def = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (def) {
    const frName = t(def.nameKey).toLowerCase();
    const aliases = [id, frName, ...parseAliases(def.aliasesKey)];
    const properties = resolveProperties({
      objectCategory: 'environment',
      baseType: def.type,
      extra_props: def.extra_props,
    });
    return { id, definitionId: id, nameKey: def.nameKey, aliases, properties };
  }

  // 2. Check if scenario definition is enriched
  if (scenarioDef && isEnrichedFeature(scenarioDef) && scenarioDef.featureType) {
    const locale = getLocale();
    const nameKey = `env.${id}` as StringKey;
    const frName = resolveDisplayName(nameKey, id);
    const aliasesFromDef = scenarioDef.aliases ? [...scenarioDef.aliases[locale]] : [];
    const aliases = [id, frName.toLowerCase(), ...aliasesFromDef];

    // Resolve base properties from type, then apply state overrides
    const baseProps = resolveProperties({
      objectCategory: 'environment',
      baseType: scenarioDef.featureType,
      extra_props: scenarioDef.extraProperties ?? [],
      remove_props: scenarioDef.removeProperties ?? [],
    });
    const { add, remove } = deriveStateProperties(currentState ?? scenarioDef.initialState);
    const removeSet = new Set(remove);
    const properties: PropertyId[] = [
      ...baseProps.filter(p => !removeSet.has(p)),
      ...add.filter(p => !baseProps.includes(p)),
    ];

    return { id, definitionId: id, nameKey, aliases, properties };
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
