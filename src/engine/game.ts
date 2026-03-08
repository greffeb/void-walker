// ---------------------------------------------------------------------------
// src/engine/game.ts — Phase 6B: Game initialization and loop helpers
// ---------------------------------------------------------------------------
// Pure functions — no side effects, no DOM, fully testable in Node.
// Single entry point for starting a new game and querying game-over status.
// ---------------------------------------------------------------------------

import type {
  GameState, PlayerClassName, DifficultyLevel, RngFn, CharacterState,
} from './types';
import type { AssembledScenario } from './scenario';
import type { VictoryCheckContext, NpcState } from './victory';
import { createInitialGameState } from './types';
import { createThreatDirector } from './threat';
import { createVisitState } from './backtracking';
import { initMicroModuleStates } from './microModules';
import { CLASSES } from '../content/classes';
import { mapScenarioFlags } from './scenarioFlagMapper';

// ---------------------------------------------------------------------------
// HP MULTIPLIERS BY DIFFICULTY
// ---------------------------------------------------------------------------

const HP_MULTIPLIERS: Readonly<Record<DifficultyLevel, number>> = {
  explorer:  1.25,
  survivor:  1.0,
  nightmare: 0.75,
};

// ---------------------------------------------------------------------------
// initGame — single entry point for starting a new game
// ---------------------------------------------------------------------------

/**
 * Initialize a complete game state from an assembled scenario and player class.
 * This is the single entry point for starting a new game.
 *
 * @param scenario    The fully assembled scenario (from assembleScenario)
 * @param playerClass The chosen player class
 * @param difficulty  The chosen difficulty level
 * @param playerName  The player's chosen name
 * @param rng         Injectable RNG (for future use in randomized starting state)
 */
export function initGame(
  scenario: AssembledScenario,
  playerClass: PlayerClassName,
  difficulty: DifficultyLevel,
  playerName: string,
  _rng: RngFn,
): GameState {
  const classDef = CLASSES[playerClass];

  // Build character state
  const hpMultiplier = HP_MULTIPLIERS[difficulty];
  const maxHp = Math.max(1, Math.round(classDef.startingHp * hpMultiplier));
  const character: CharacterState = {
    name: playerName,
    className: playerClass,
    stats: classDef.baseStats,
    hp: maxHp,
    maxHp,
    oxygen: 100,
    inventory: [...classDef.startingItems],
    equippedWeapon: null,
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };

  // Find start node
  const startNode = scenario.graph.nodes.find(n => n.coreNodeId === 'start');
  if (!startNode) throw new Error('initGame: scenario graph has no start node');
  const startLocationId = startNode.id;

  // Initialize NPC states from all NPC definitions across the graph
  const npcStates: Record<string, NpcState> = {};
  for (const node of scenario.graph.nodes) {
    for (const npcDef of node.npcs ?? []) {
      npcStates[npcDef.id] = {
        id: npcDef.id,
        locationId: node.id,
        alive: true,
      };
    }
  }
  // Also collect NPCs from placed module-level definitions
  for (const placed of scenario.modules) {
    for (const npcDef of placed.module.npcs ?? []) {
      if (!(npcDef.id in npcStates)) {
        // Module-level NPC without a specific node: treat as not-yet-spawned
        npcStates[npcDef.id] = {
          id: npcDef.id,
          locationId: null,
          alive: true,
        };
      }
    }
  }

  // Initialize visitedLocations with the start node
  const visitedLocations = {
    [startLocationId]: createVisitState(0),
  };

  // Initialize featureStates from all feature initialStates across the graph
  const featureStates: Record<string, string> = {};
  for (const node of scenario.graph.nodes) {
    for (const feat of node.features) {
      if (feat.initialState) {
        featureStates[feat.id] = feat.initialState;
      }
    }
  }

  // Initialize micro-module states from placed micro-modules
  const microModuleStates = initMicroModuleStates(scenario.placedMicroModules);

  const base = createInitialGameState();
  return {
    ...base,
    phase: 'playing',
    difficulty,
    character,
    turn: 0,
    scenarioId: scenario.skeleton.id,
    currentBeat: 'intro',
    scenario,
    playerLocationId: startLocationId,
    visitedLocations,
    npcStates,
    threatDirectorState: createThreatDirector('intro'),
    victoryResult: null,
    defeatCondition: null,
    featureStates,
    microModuleStates,
  };
}

// ---------------------------------------------------------------------------
// isGameOver — true if the game has ended (victory OR defeat)
// ---------------------------------------------------------------------------

/**
 * Returns true if the game has ended for any reason:
 * - A victory condition was met (victoryResult is set)
 * - A defeat condition was triggered (defeatCondition is set)
 * - The player has 0 or fewer HP (permadeath / defeat phase)
 */
export function isGameOver(state: GameState): boolean {
  return (
    state.victoryResult !== null ||
    state.defeatCondition !== null ||
    state.phase === 'defeat' ||
    state.phase === 'victory' ||
    (state.character !== null && state.character.hp <= 0)
  );
}

// ---------------------------------------------------------------------------
// buildVictoryCheckContext — minimal snapshot for victory checking
// ---------------------------------------------------------------------------

/**
 * Build the minimal VictoryCheckContext snapshot from the current GameState.
 * Called each turn before checkVictory() and checkAdditionalDefeat().
 *
 * Integrates scenarioFlags via mapScenarioFlags() (Chantier 3, C3-7):
 * abstract flags like 'cargo_jettisoned' are mapped to mechanical effects
 * (lethalLocations, activatedObjects, etc.) that the existing victory system
 * already understands.
 */
export function buildVictoryCheckContext(state: GameState): VictoryCheckContext {
  const baseLethal = [...state.lethalLocations];
  const baseContained = [...state.fullyContainedLocations];
  const baseActivated = [...state.activatedObjects];
  let selfDestruct = state.selfDestructActive;

  // Map scenario flags to mechanical effects (C3-7)
  if (state.scenarioFlags && state.scenarioId) {
    const flagEffects = mapScenarioFlags(state.scenarioFlags, state.scenarioId);
    baseLethal.push(...flagEffects.lethalLocations);
    baseContained.push(...flagEffects.fullyContainedLocations);
    baseActivated.push(...flagEffects.activatedObjects);
    if (flagEffects.selfDestructActive) selfDestruct = true;
  }

  return {
    playerLocationId: state.playerLocationId ?? '',
    playerInventory: state.character?.inventory ?? [],
    npcStates: state.npcStates,
    activatedObjects: baseActivated,
    lethalLocations: baseLethal,
    fullyContainedLocations: baseContained,
    destroyedObjectives: state.destroyedObjectives,
    selfDestructActive: selfDestruct,
  };
}
