// ---------------------------------------------------------------------------
// src/ui/hooks/useScenarioLoop.ts — Real scenario game loop for playtest
// ---------------------------------------------------------------------------
// Replaces useNarrativeLoop: persistent GameState, real scenario assembly,
// victory/defeat, suggestions, and per-turn bug reporting.
// ---------------------------------------------------------------------------

import { useReducer, useCallback, useRef } from 'react';
import { LAUNCH_SKELETONS } from '@content/scenarios';
import { LAUNCH_SETTINGS } from '@content/settings';
import { ALL_MODULES } from '@content/scenarios/modules';
import { CLASS_LIST } from '@content/classes';
import { buildParserLocaleData } from '@content/parserData';
import { assembleScenario } from '@engine/pacing';
import { initGame, isGameOver } from '@engine/game';
import { getSceneContext, formatSuggestionAsInput } from '@engine/scene';
import { processTurn } from '@engine/processTurn';
import { createSeededRng } from '@engine/rng';
import { createInitialGameState } from '@engine/types';
import { narrateForTurn, NARRATIVE_PRESETS } from '@narration/index';
import type {
  GameState, DifficultyLevel, PlayerClassName,
  TurnDebugTrace, DiceResult, SceneContext, SceneDescription, RngFn,
} from '@engine/types';
import type { SuggestionCandidate } from '@engine/suggestions';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ScenarioPhase =
  | 'difficulty_select'
  | 'class_select'
  | 'playing'
  | 'victory'
  | 'defeat';

/** Lightweight snapshot of the scene at turn time (for bug reports). */
export interface SceneSnapshot {
  readonly locationId: string;
  readonly items: readonly string[];
  readonly npcs: readonly string[];
  readonly features: readonly string[];
  readonly exits: readonly string[];
  readonly conditions: readonly string[];
  readonly suggestions: readonly string[];
}

export interface TurnEntry {
  readonly id: number;
  readonly input: string;
  readonly narrative: string;
  readonly trace: TurnDebugTrace;
  readonly diceRoll: DiceResult | null;
  readonly locationName: string;
  readonly reported: boolean;
  readonly sceneSnapshot: SceneSnapshot;
  readonly resultScene: SceneDescription | null;
  /** 'enter' = first visit, 'revisit' = returning, null = same room */
  readonly introMode: 'enter' | 'revisit' | null;
}

export interface ScenarioLoopState {
  readonly phase: ScenarioPhase;
  readonly difficulty: DifficultyLevel;
  readonly gameState: GameState;
  readonly sceneContext: SceneContext | null;
  readonly turnHistory: readonly TurnEntry[];
  readonly feedbackCount: number;
  readonly seed: number;
  readonly error: string | null;
}

export interface ScenarioLoop {
  readonly state: ScenarioLoopState;
  readonly classList: typeof CLASS_LIST;
  readonly selectDifficulty: (d: DifficultyLevel) => void;
  readonly selectClass: (c: PlayerClassName) => void;
  readonly submitInput: (input: string) => void;
  readonly submitSuggestion: (suggestion: SuggestionCandidate) => void;
  readonly markReported: (turnId: number) => void;
  readonly restart: () => void;
  readonly suggestions: readonly SuggestionCandidate[];
  readonly locationName: string;
  readonly sceneDescription: SceneDescription | null;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getLocationName(state: GameState): string {
  if (!state.scenario || !state.playerLocationId) return '???';
  const node = state.scenario.graph.nodes.find(n => n.id === state.playerLocationId);
  return node?.nameKey.fr ?? node?.nameKey.en ?? state.playerLocationId ?? '???';
}

function buildSceneSnapshot(context: SceneContext): SceneSnapshot {
  return {
    locationId: context.locationId ?? '',
    items: context.locationItems.map(i => i.id),
    npcs: context.npcs.map(n => n.id),
    features: context.environmentFeatures.map(f => f.id),
    exits: context.connectedLocations.map(l => l.id),
    conditions: [...context.environmentConditions],
    suggestions: (context.scenarioSuggestions ?? []).map(s => formatSuggestionAsInput(s)),
  };
}

// ---------------------------------------------------------------------------
// REDUCER
// ---------------------------------------------------------------------------

type LoopAction =
  | { type: 'SELECT_DIFFICULTY'; difficulty: DifficultyLevel }
  | { type: 'START_GAME'; gameState: GameState; sceneContext: SceneContext; seed: number }
  | { type: 'TURN_RESULT'; gameState: GameState; sceneContext: SceneContext; entry: TurnEntry }
  | { type: 'MARK_REPORTED'; turnId: number }
  | { type: 'RESTART' }
  | { type: 'SET_ERROR'; error: string };

function reducer(state: ScenarioLoopState, action: LoopAction): ScenarioLoopState {
  switch (action.type) {
    case 'SELECT_DIFFICULTY':
      return { ...state, difficulty: action.difficulty, phase: 'class_select', error: null };

    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        gameState: action.gameState,
        sceneContext: action.sceneContext,
        seed: action.seed,
        turnHistory: [],
        error: null,
      };

    case 'TURN_RESULT': {
      const gameOver = isGameOver(action.gameState);
      const phase: ScenarioPhase = gameOver
        ? (action.gameState.victoryResult !== null || action.gameState.phase === 'victory'
          ? 'victory'
          : 'defeat')
        : 'playing';
      return {
        ...state,
        phase,
        gameState: action.gameState,
        sceneContext: action.sceneContext,
        turnHistory: [...state.turnHistory, action.entry],
        error: null,
      };
    }

    case 'MARK_REPORTED':
      return {
        ...state,
        feedbackCount: state.feedbackCount + 1,
        turnHistory: state.turnHistory.map(e =>
          e.id === action.turnId ? { ...e, reported: true } : e,
        ),
      };

    case 'RESTART':
      return createInitialState();

    case 'SET_ERROR':
      return { ...state, error: action.error };
  }
}

// ---------------------------------------------------------------------------
// INITIAL STATE
// ---------------------------------------------------------------------------

function createInitialState(): ScenarioLoopState {
  return {
    phase: 'difficulty_select',
    difficulty: 'survivor',
    gameState: createInitialGameState(),
    sceneContext: null,
    turnHistory: [],
    feedbackCount: 0,
    seed: 0,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

/** Extract all element IDs from a SceneDescription. */
function allSceneElementIds(desc: SceneDescription): Set<string> {
  const ids = new Set<string>();
  for (const item of desc.visibleItems) ids.add(item.id);
  for (const feat of desc.visibleFeatures) ids.add(feat.id);
  for (const npc of desc.visibleNpcs) ids.add(npc.id);
  return ids;
}

/** Filter suggestions to only reference narrated elements (+ exits which are always allowed). */
function filterSuggestionsByNarrated(
  suggestions: readonly SuggestionCandidate[],
  narratedIds: Set<string>,
  scene: SceneDescription | undefined,
): readonly SuggestionCandidate[] {
  return suggestions.filter(s => {
    // Movement suggestions are always allowed
    if (s.category === 'movement') return true;
    // Obstacle suggestions are always allowed (they are the room's main challenge)
    if (s.category === 'obstacle') return true;
    // For item/npc suggestions: check if the target ID has been narrated
    // Match by checking if narrated set contains any item/npc/feature whose name matches
    if (scene) {
      const allEntities = [
        ...scene.visibleItems,
        ...scene.visibleFeatures,
        ...scene.visibleNpcs,
      ];
      const entity = allEntities.find(e => e.name === s.targetText || e.id === s.targetText);
      if (entity && narratedIds.has(entity.id)) return true;
    }
    return false;
  });
}

export function useScenarioLoop(): ScenarioLoop {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const rngRef = useRef<RngFn>(() => Math.random());
  const parserDataRef = useRef(buildParserLocaleData('fr'));
  /** Tracks which element IDs have been narrated to the player in the current location. */
  const narratedIdsRef = useRef<Set<string>>(new Set());
  /** Tracks the current location ID to detect location changes. */
  const currentLocationRef = useRef<string | null>(null);

  const selectDifficulty = useCallback((difficulty: DifficultyLevel) => {
    dispatch({ type: 'SELECT_DIFFICULTY', difficulty });
  }, []);

  const selectClass = useCallback((className: PlayerClassName) => {
    const seed = Math.floor(Math.random() * 2147483646) + 1;
    const rng = createSeededRng(seed);
    rngRef.current = rng;

    try {
      // Pick random skeleton and setting
      const skeleton = LAUNCH_SKELETONS[Math.floor(rng() * LAUNCH_SKELETONS.length)]!;
      const setting = LAUNCH_SETTINGS[Math.floor(rng() * LAUNCH_SETTINGS.length)]!;

      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, rng);
      const gameState = initGame(scenario, className, state.difficulty, 'Joueur', rng);
      const sceneContext = getSceneContext(gameState);

      // Mark all starting location elements as narrated (welcome message lists them)
      if (sceneContext.sceneDescription) {
        narratedIdsRef.current = allSceneElementIds(sceneContext.sceneDescription);
        currentLocationRef.current = sceneContext.locationId ?? null;
      }

      dispatch({ type: 'START_GAME', gameState, sceneContext, seed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'SET_ERROR', error: `Erreur assemblage scenario: ${msg}` });
    }
  }, [state.difficulty]);

  const doTurn = useCallback((input: string) => {
    if (state.phase !== 'playing' || !state.sceneContext) return;

    try {
      const context = getSceneContext(state.gameState);
      const result = processTurn(state.gameState, input, context, parserDataRef.current, rngRef.current);

      let narrative = '';
      try {
        narrative = narrateForTurn(
          result,
          context,
          state.gameState,
          NARRATIVE_PRESETS.standard,
          'fr',
        );
      } catch {
        // Narration failure should not block the game loop
        narrative = '';
      }

      const newContext = getSceneContext(result.newState);

      // Update narrated IDs based on what this turn revealed
      const newLocationId = newContext.locationId ?? null;
      const prevLocationId = currentLocationRef.current;
      let introMode: 'enter' | 'revisit' | null = null;
      if (newLocationId !== null && newLocationId !== prevLocationId) {
        introMode = (newLocationId in state.gameState.visitedLocations) ? 'revisit' : 'enter';
      }
      if (newLocationId !== prevLocationId) {
        // Location changed: reset narrated IDs and mark all new location elements
        if (newContext.sceneDescription) {
          narratedIdsRef.current = allSceneElementIds(newContext.sceneDescription);
        } else {
          narratedIdsRef.current = new Set();
        }
        currentLocationRef.current = newLocationId;
      } else {
        // Same location: check if EXAMINE environment → narrate all elements
        const isExamineEnv = result.trace.parsedVerb === 'EXAMINE'
          && result.trace.parsedTarget === 'environment'
          && (result.trace.outcome === 'success' || result.trace.outcome === 'crit_success' || result.trace.isAutoVerb);
        if (isExamineEnv && newContext.sceneDescription) {
          const allIds = allSceneElementIds(newContext.sceneDescription);
          for (const id of allIds) narratedIdsRef.current.add(id);
        } else if (result.trace.parsedTarget) {
          // Only the action target becomes narrated
          narratedIdsRef.current.add(result.trace.parsedTarget);
        }
      }

      const entry: TurnEntry = {
        id: result.newState.turn,
        input,
        narrative,
        trace: result.trace,
        diceRoll: result.diceRoll,
        locationName: getLocationName(result.newState),
        reported: false,
        sceneSnapshot: buildSceneSnapshot(context),
        resultScene: newContext.sceneDescription ?? null,
        introMode,
      };

      dispatch({ type: 'TURN_RESULT', gameState: result.newState, sceneContext: newContext, entry });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'SET_ERROR', error: `Erreur moteur: ${msg}` });
    }
  }, [state.phase, state.sceneContext, state.gameState]);

  const submitInput = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    doTurn(trimmed);
  }, [doTurn]);

  const submitSuggestion = useCallback((suggestion: SuggestionCandidate) => {
    doTurn(formatSuggestionAsInput(suggestion));
  }, [doTurn]);

  const markReported = useCallback((turnId: number) => {
    dispatch({ type: 'MARK_REPORTED', turnId });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  // Derive suggestions from scene context (top 2), filtered by narrated elements
  const allSuggestions = state.sceneContext?.scenarioSuggestions ?? [];
  const sceneDesc = state.sceneContext?.sceneDescription;
  const filtered = filterSuggestionsByNarrated(allSuggestions, narratedIdsRef.current, sceneDesc);
  const suggestions: readonly SuggestionCandidate[] = filtered.slice(0, 2);

  const locationName = getLocationName(state.gameState);
  const sceneDescription = sceneDesc ?? null;

  return {
    state,
    classList: CLASS_LIST,
    selectDifficulty,
    selectClass,
    submitInput,
    submitSuggestion,
    markReported,
    restart,
    suggestions,
    locationName,
    sceneDescription,
  };
}
