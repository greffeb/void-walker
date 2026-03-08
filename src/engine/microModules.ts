// ---------------------------------------------------------------------------
// src/engine/microModules.ts — Micro-Module System
// ---------------------------------------------------------------------------
// Pure functions for micro-module slot computation, placement, visibility,
// perception checks, creature ambush lifecycle, and graph node generation.
// Zero side effects, zero DOM deps — fully testable in Node.js.
// ---------------------------------------------------------------------------

import type {
  MicroModule,
  MicroModuleType,
  PlacedMicroModule,
  MicroModuleState,
  LoreFragment,
  LocationNode,
  LocationEdge,
  LocationGraph,
  CoreSkeleton,
  SessionLength,
} from './scenario';
import type { StoryBeat, GameState, RngFn } from './types';
import { BALANCE } from './constants';
import { resolveLocationName } from './pacing';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function rngPick<T>(rng: RngFn, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Roll a d20 using the RNG. Returns 1–20. */
function rollD20(rng: RngFn): number {
  return 1 + Math.floor(rng() * 20);
}

// ---------------------------------------------------------------------------
// SLOT COMPUTATION — how many micro-module slots per node
// ---------------------------------------------------------------------------

const MM = BALANCE.MICRO_MODULES;

/**
 * Determine how many micro-module slots a given node provides.
 * Based on spec §6.2: start/resolution/boss = 0, quick mode capped, beat-based.
 */
export function computeSlots(
  node: LocationNode,
  sessionLength: SessionLength,
): 0 | 1 | 2 {
  // Start, resolution, boss: never have micro-modules
  if (node.coreNodeId === 'start') return 0;
  if (node.coreNodeId === 'resolution') return 0;
  if (node.coreNodeId === 'boss') return 0;

  // Quick mode: 1 slot only on unlock/reveal core nodes
  if (sessionLength === 'quick') {
    if (node.coreNodeId === 'unlock') return 1;
    if (node.coreNodeId === 'reveal') return 1;
    return 0;
  }

  // Standard/Extended: beat-based
  switch (node.beat) {
    case 'intro': return 1;
    case 'rising': return 2;
    case 'midpoint': return 1;
    case 'escalation': return 1;
    case 'climax': return 0;
    case 'resolution': return 0;
    default: return 1;
  }
}

// ---------------------------------------------------------------------------
// TYPE WEIGHT COMPUTATION — prevent monotonous type distribution
// ---------------------------------------------------------------------------

/**
 * Compute selection weights per micro-module type, dampening over-represented types.
 * Spec §6.4: base weights per beat + overrepresentation reduction.
 */
export function computeTypeWeights(
  alreadyPlaced: readonly PlacedMicroModule[],
  currentBeat: StoryBeat,
): Record<MicroModuleType, number> {
  const counts: Record<MicroModuleType, number> = { loot: 0, lore: 0, encounter: 0, ambiance: 0 };
  for (const p of alreadyPlaced) counts[p.microModule.type]++;

  const base = MM.TYPE_WEIGHTS[currentBeat];
  const weights: Record<MicroModuleType, number> = { ...base };

  for (const type of ['loot', 'lore', 'encounter', 'ambiance'] as const) {
    if (counts[type] >= MM.OVERREP_HEAVY_THRESHOLD) {
      weights[type] *= MM.OVERREP_HEAVY_FACTOR;
    } else if (counts[type] >= MM.OVERREP_LIGHT_THRESHOLD) {
      weights[type] *= MM.OVERREP_LIGHT_FACTOR;
    }
  }

  return weights;
}

// ---------------------------------------------------------------------------
// WEIGHTED PICK — select a micro-module from candidates using type weights
// ---------------------------------------------------------------------------

/**
 * Weighted random selection from candidates based on type weights.
 */
export function weightedPick(
  candidates: readonly MicroModule[],
  weights: Record<MicroModuleType, number>,
  rng: RngFn,
): MicroModule {
  const weighted = candidates.map(c => ({ module: c, weight: Math.max(weights[c.type], 0.01) }));
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * totalWeight;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.module;
  }
  return weighted[weighted.length - 1]!.module;
}

// ---------------------------------------------------------------------------
// FILL MICRO-MODULE SLOTS — main placement algorithm (spec §6.3)
// ---------------------------------------------------------------------------

/**
 * Fill micro-module slots across the location graph.
 * Returns an array of placed micro-modules (no duplicates, respects context filters).
 */
export function fillMicroModuleSlots(
  graph: LocationGraph,
  skeleton: CoreSkeleton,
  allMicroModules: readonly MicroModule[],
  sessionLength: SessionLength,
  rng: RngFn,
): readonly PlacedMicroModule[] {
  const placed: PlacedMicroModule[] = [];
  const usedIds = new Set<string>();
  const usedLoreFragmentIds = new Set<string>();

  for (const node of graph.nodes) {
    // Skip micro-module nodes (they can't host sub-micro-modules)
    if (node.isMicroModule) continue;

    const slotCount = computeSlots(node, sessionLength);

    for (let i = 0; i < slotCount; i++) {
      // 1. Filter candidates
      const candidates = allMicroModules.filter(mm => {
        if (usedIds.has(mm.id)) return false;
        if (!mm.validParentRoles.includes(node.role)) return false;
        if (!mm.validBeats.includes(node.beat)) return false;
        if (mm.validSkeletons && mm.validSkeletons.length > 0 && !mm.validSkeletons.includes(skeleton.id)) return false;
        if (mm.locationRole && !skeleton.theme.supportedRoles.includes(mm.locationRole)) return false;
        return true;
      });

      if (candidates.length === 0) continue;

      // 2. Weighted type selection
      const typeWeights = computeTypeWeights(placed, node.beat);
      const selected = weightedPick(candidates, typeWeights, rng);

      // 3. If lore type, assign a lore fragment from the skeleton's pool
      let assignedLoreFragment: LoreFragment | undefined;
      if (selected.type === 'lore' && skeleton.lorePool && skeleton.lorePool.length > 0) {
        const availableFragments = skeleton.lorePool.filter(f =>
          !usedLoreFragmentIds.has(f.id)
          && f.validBeats.includes(node.beat)
          && (selected.loreData?.supportType
            ? f.compatibleSupports.includes(selected.loreData.supportType)
            : true),
        );
        if (availableFragments.length > 0) {
          assignedLoreFragment = rngPick(rng, availableFragments);
          usedLoreFragmentIds.add(assignedLoreFragment.id);
        }
      }

      // 4. Place
      placed.push({
        microModule: selected,
        parentNodeId: node.id,
        assignedLoreFragment,
        creatureActive: false,
      });
      usedIds.add(selected.id);
    }
  }

  return placed;
}

// ---------------------------------------------------------------------------
// BUILD GRAPH NODES — convert placed micro-modules into LocationNodes + edges
// ---------------------------------------------------------------------------

/**
 * Build LocationNode[] and LocationEdge[] for all placed micro-modules.
 * Each micro-module becomes a dead-end node with one bidirectional edge to its parent.
 */
export function buildMicroModuleNodes(
  placed: readonly PlacedMicroModule[],
  skeleton: CoreSkeleton,
  parentNodes: readonly LocationNode[],
  rng: RngFn,
  usedNames: Set<string>,
): { readonly nodes: readonly LocationNode[]; readonly edges: readonly LocationEdge[] } {
  const nodes: LocationNode[] = [];
  const edges: LocationEdge[] = [];

  const parentMap = new Map<string, LocationNode>();
  for (const n of parentNodes) parentMap.set(n.id, n);

  for (const pm of placed) {
    const parent = parentMap.get(pm.parentNodeId);
    if (!parent) continue;

    const nodeId = `mm_${pm.microModule.id}_${pm.parentNodeId}`;
    const nameKey = resolveLocationName(pm.microModule.locationRole, skeleton, rng, usedNames);

    const node: LocationNode = {
      id: nodeId,
      nameKey,
      role: pm.microModule.locationRole,
      beat: parent.beat,
      tension: parent.tension,
      isCoreNode: false,
      onCriticalPath: false,
      items: pm.microModule.items ?? [],
      npcs: pm.microModule.npcs,
      features: pm.microModule.features,
      obstacle: pm.microModule.entryObstacle ? {
        targetId: `mm_obstacle_${pm.microModule.id}`,
        paths: [...pm.microModule.entryObstacle.paths],
        description: pm.microModule.entryObstacle.description,
        blocksExit: false,
      } : undefined,
      atmosphere: pm.microModule.atmosphere ?? 'pressurized',
      isMicroModule: true,
      microModuleId: pm.microModule.id,
      parentNodeId: pm.parentNodeId,
    };

    nodes.push(node);
    edges.push({
      from: pm.parentNodeId,
      to: nodeId,
      bidirectional: true,
    });
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// INIT MICRO-MODULE STATES — create initial runtime state for each placed mm
// ---------------------------------------------------------------------------

/**
 * Initialize MicroModuleState records for all placed micro-modules.
 * 'open' modules are immediately revealed; 'hidden' modules start unrevealed.
 */
export function initMicroModuleStates(
  placed: readonly PlacedMicroModule[],
): Readonly<Record<string, MicroModuleState>> {
  const states: Record<string, MicroModuleState> = {};
  for (const pm of placed) {
    states[pm.microModule.id] = {
      microModuleId: pm.microModule.id,
      revealed: pm.microModule.visibility === 'open',
      visited: false,
      passiveCheckDone: false,
      creatureActive: false,
      creatureTurnsRemaining: 0,
    };
  }
  return states;
}

// ---------------------------------------------------------------------------
// PASSIVE PERCEPTION CHECK — silent d20 on first visit to parent node
// ---------------------------------------------------------------------------

/**
 * Process passive Perception checks for all hidden micro-modules at a parent node.
 * Silent — no dice result shown to the player.
 * Only runs once per parent node (checks passiveCheckDone flag).
 */
export function processPassivePerceptionCheck(
  state: GameState,
  parentNodeId: string,
  perStat: number,
  rng: RngFn,
): GameState {
  const scenario = state.scenario;
  if (!scenario) return state;

  const placed = (scenario.placedMicroModules ?? []).filter(pm => pm.parentNodeId === parentNodeId);
  if (placed.length === 0) return state;

  let newStates = { ...state.microModuleStates };
  let changed = false;

  for (const pm of placed) {
    const mmState = newStates[pm.microModule.id];
    if (!mmState) continue;
    if (mmState.passiveCheckDone) continue;
    if (pm.microModule.visibility !== 'hidden') continue;
    if (!pm.microModule.hiddenDC) continue;

    const roll = rollD20(rng);
    const total = roll + perStat;
    const revealed = total >= pm.microModule.hiddenDC;

    newStates = {
      ...newStates,
      [pm.microModule.id]: {
        ...mmState,
        passiveCheckDone: true,
        revealed: revealed || mmState.revealed,
      },
    };
    changed = true;
  }

  if (!changed) return state;
  return { ...state, microModuleStates: newStates };
}

// ---------------------------------------------------------------------------
// ACTIVE PERCEPTION CHECK — explicit EXAMINE/SEARCH (DC - 2)
// ---------------------------------------------------------------------------

/**
 * Process an active search for hidden micro-modules at the current parent node.
 * DC is reduced by ACTIVE_PER_DC_REDUCTION (2).
 * Returns updated state + list of newly revealed micro-module IDs.
 */
export function processActivePerceptionCheck(
  state: GameState,
  parentNodeId: string,
  perStat: number,
  rng: RngFn,
): { readonly newState: GameState; readonly revealed: readonly string[] } {
  const scenario = state.scenario;
  if (!scenario) return { newState: state, revealed: [] };

  const placed = (scenario.placedMicroModules ?? []).filter(pm => pm.parentNodeId === parentNodeId);
  const revealedIds: string[] = [];
  let newStates = { ...state.microModuleStates };

  for (const pm of placed) {
    const mmState = newStates[pm.microModule.id];
    if (!mmState) continue;
    if (mmState.revealed) continue;
    if (pm.microModule.visibility !== 'hidden') continue;
    if (!pm.microModule.hiddenDC) continue;

    const dc = pm.microModule.hiddenDC - MM.ACTIVE_PER_DC_REDUCTION;
    const roll = rollD20(rng);
    const total = roll + perStat;

    if (total >= dc) {
      newStates = {
        ...newStates,
        [pm.microModule.id]: {
          ...mmState,
          revealed: true,
          passiveCheckDone: true,
        },
      };
      revealedIds.push(pm.microModule.id);
    }
  }

  return {
    newState: { ...state, microModuleStates: newStates },
    revealed: revealedIds,
  };
}

// ---------------------------------------------------------------------------
// REVEAL HIDDEN MICRO-MODULE — direct reveal (e.g. hint system)
// ---------------------------------------------------------------------------

/** Directly reveal a micro-module (mark revealed: true). */
export function revealHiddenMicroModule(
  state: GameState,
  microModuleId: string,
): GameState {
  const mmState = state.microModuleStates[microModuleId];
  if (!mmState || mmState.revealed) return state;

  return {
    ...state,
    microModuleStates: {
      ...state.microModuleStates,
      [microModuleId]: { ...mmState, revealed: true },
    },
  };
}

// ---------------------------------------------------------------------------
// HINT REVEAL — auto-reveal after N turns in parent node (spec §3.2, rule 3)
// ---------------------------------------------------------------------------

/**
 * If the player has spent ≥ HINT_REVEAL_TURN_THRESHOLD turns in a parent node,
 * auto-reveal all hidden unrevealed micro-modules attached to that node.
 * Returns updated state + list of revealed IDs.
 */
export function checkHintReveal(
  state: GameState,
  parentNodeId: string,
): { readonly newState: GameState; readonly revealed: readonly string[] } {
  const scenario = state.scenario;
  if (!scenario) return { newState: state, revealed: [] };

  const visitState = state.visitedLocations[parentNodeId];
  if (!visitState) return { newState: state, revealed: [] };

  // Check: have we been here long enough?
  const turnsHere = visitState.visitCount;
  if (turnsHere < MM.HINT_REVEAL_TURN_THRESHOLD) {
    return { newState: state, revealed: [] };
  }

  const placed = (scenario.placedMicroModules ?? []).filter(pm => pm.parentNodeId === parentNodeId);
  const revealedIds: string[] = [];
  let newStates = { ...state.microModuleStates };

  for (const pm of placed) {
    const mmState = newStates[pm.microModule.id];
    if (!mmState || mmState.revealed) continue;
    if (pm.microModule.visibility !== 'hidden') continue;

    newStates = {
      ...newStates,
      [pm.microModule.id]: { ...mmState, revealed: true, passiveCheckDone: true },
    };
    revealedIds.push(pm.microModule.id);
  }

  if (revealedIds.length === 0) return { newState: state, revealed: [] };
  return { newState: { ...state, microModuleStates: newStates }, revealed: revealedIds };
}

// ---------------------------------------------------------------------------
// CREATURE AMBUSH — activation, tick, confrontation
// ---------------------------------------------------------------------------

/** Activate a creature ambush in a micro-module. Sets creatureActive + linger timer. */
export function activateCreatureAmbush(
  state: GameState,
  microModuleId: string,
): GameState {
  const mmState = state.microModuleStates[microModuleId];
  if (!mmState) return state;

  return {
    ...state,
    microModuleStates: {
      ...state.microModuleStates,
      [microModuleId]: {
        ...mmState,
        creatureActive: true,
        creatureTurnsRemaining: MM.CREATURE_LINGER_TURNS,
      },
    },
  };
}

/** Tick all creature ambushes — decrement timer, deactivate at 0. */
export function tickCreatureAmbush(
  state: GameState,
): GameState {
  let newStates = { ...state.microModuleStates };
  let changed = false;

  for (const [id, mmState] of Object.entries(newStates)) {
    if (!mmState.creatureActive) continue;
    const remaining = mmState.creatureTurnsRemaining - 1;
    if (remaining <= 0) {
      newStates = { ...newStates, [id]: { ...mmState, creatureActive: false, creatureTurnsRemaining: 0 } };
    } else {
      newStates = { ...newStates, [id]: { ...mmState, creatureTurnsRemaining: remaining } };
    }
    changed = true;
  }

  if (!changed) return state;
  return { ...state, microModuleStates: newStates };
}

/**
 * Resolve a creature confrontation when the player enters a micro-module
 * with an active ambush. Returns updated state + outcome.
 */
export function resolveCreatureConfrontation(
  state: GameState,
  microModuleId: string,
  rng: RngFn,
): { readonly newState: GameState; readonly success: boolean; readonly consequence?: string } {
  const scenario = state.scenario;
  if (!scenario) return { newState: state, success: false };

  const placed = scenario.placedMicroModules.find(pm => pm.microModule.id === microModuleId);
  if (!placed?.microModule.creatureAmbush) return { newState: state, success: false };

  const ambush = placed.microModule.creatureAmbush;
  const character = state.character;
  if (!character) return { newState: state, success: false };

  // Roll confrontation
  const statValue = character.stats[ambush.confrontationStat] ?? 0;
  const roll = rollD20(rng);
  const total = roll + statValue;
  const success = total >= ambush.confrontationDC;

  // Deactivate creature regardless of outcome
  const mmState = state.microModuleStates[microModuleId];
  let newState: GameState = {
    ...state,
    microModuleStates: {
      ...state.microModuleStates,
      [microModuleId]: {
        ...(mmState ?? { microModuleId, revealed: true, visited: true, passiveCheckDone: true, creatureActive: false, creatureTurnsRemaining: 0 }),
        creatureActive: false,
        creatureTurnsRemaining: 0,
      },
    },
  };

  if (!success) {
    // Apply failure consequence
    switch (ambush.failureConsequence) {
      case 'damage': {
        const dmg = ambush.damageAmount ?? 3;
        const hp = Math.max(0, character.hp - dmg);
        newState = {
          ...newState,
          character: { ...character, hp },
        };
        break;
      }
      case 'item_loss': {
        // Drop the last item from inventory
        if (character.inventory.length > 0) {
          const newInventory = character.inventory.slice(0, -1);
          newState = {
            ...newState,
            character: { ...character, inventory: newInventory },
          };
        }
        break;
      }
      case 'status_effect': {
        // Apply wounded condition if not already present
        const conditions = character.conditions ?? [];
        if (!conditions.some(c => c.id === 'wounded')) {
          const woundedCondition: { readonly id: 'wounded'; readonly remainingActions: null } = {
            id: 'wounded',
            remainingActions: null,
          };
          newState = {
            ...newState,
            character: { ...character, conditions: [...conditions, woundedCondition] },
          };
        }
        break;
      }
    }

    // Push player back to parent node
    newState = { ...newState, playerLocationId: placed.parentNodeId };
  }

  return {
    newState,
    success,
    consequence: success ? undefined : ambush.failureConsequence,
  };
}

// ---------------------------------------------------------------------------
// MARK VISITED — update micro-module state when player enters
// ---------------------------------------------------------------------------

/** Mark a micro-module as visited. */
export function markMicroModuleVisited(
  state: GameState,
  microModuleId: string,
): GameState {
  const mmState = state.microModuleStates[microModuleId];
  if (!mmState || mmState.visited) return state;

  return {
    ...state,
    microModuleStates: {
      ...state.microModuleStates,
      [microModuleId]: { ...mmState, visited: true },
    },
  };
}

// ---------------------------------------------------------------------------
// FIND MICRO-MODULE NODE ID — utility to map microModuleId to graph node ID
// ---------------------------------------------------------------------------

/** Get the graph node ID for a placed micro-module. */
export function getMicroModuleNodeId(microModuleId: string, parentNodeId: string): string {
  return `mm_${microModuleId}_${parentNodeId}`;
}

/** Find placed micro-modules at a given parent node. */
export function getMicroModulesAtParent(
  scenario: { readonly placedMicroModules: readonly PlacedMicroModule[] },
  parentNodeId: string,
): readonly PlacedMicroModule[] {
  return (scenario.placedMicroModules ?? []).filter(pm => pm.parentNodeId === parentNodeId);
}
