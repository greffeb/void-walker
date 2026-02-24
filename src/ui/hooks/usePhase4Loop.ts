// ---------------------------------------------------------------------------
// src/ui/hooks/usePhase4Loop.ts — Phase 4 debug game loop
// ---------------------------------------------------------------------------
// Wraps the real processTurn() orchestrator, maintains persistent GameState,
// and exposes the full TurnDebugTrace for the debug playtest UI.
// ---------------------------------------------------------------------------

import { useReducer, useCallback } from 'react';
import { CLASSES, CLASS_LIST } from '@content/classes';
import { ITEM_DEFINITIONS } from '@content/items';
import { buildParserLocaleData } from '@content/parserData';
import { generateSituation, type Situation } from '@content/situationGenerator';
import { processTurn } from '@engine/processTurn';
import { createInitialGameState } from '@engine/types';
import { BALANCE } from '@engine/constants';
import type {
  GameState, CharacterState, TurnDebugTrace, DifficultyLevel, DiceResult,
  PlayerClassName,
} from '@engine/types';

// === TYPES ===

export type LoopPhase =
  | 'difficulty_select'
  | 'class_select'
  | 'playing'
  | 'post_turn'
  | 'defeat';

export interface Phase4LoopState {
  readonly loopPhase: LoopPhase;
  readonly difficulty: DifficultyLevel;
  readonly gameState: GameState;
  readonly situation: Situation | null;
  readonly lastTrace: TurnDebugTrace | null;
  readonly lastDiceRoll: DiceResult | null;
  readonly lastInput: string;
  readonly error: string | null;
  readonly feedbackCount: number;
}

export interface Phase4Loop {
  readonly state: Phase4LoopState;
  readonly classList: typeof CLASS_LIST;
  readonly selectDifficulty: (d: DifficultyLevel) => void;
  readonly selectClass: (c: PlayerClassName) => void;
  readonly submitInput: (input: string) => void;
  readonly nextSituation: () => void;
  readonly submitFeedback: (thumbs: 'up' | 'down', comment?: string) => void;
}

// === CHARACTER CREATION ===

function createCharacter(className: PlayerClassName, difficulty: DifficultyLevel): CharacterState {
  const cls = CLASSES[className];
  // Explorer gets a small HP bonus for easier play
  const hpBonus = difficulty === 'explorer' ? 2 : 0;
  const hp = cls.startingHp + hpBonus;
  return {
    name: 'Joueur',
    className,
    stats: { ...cls.baseStats },
    hp,
    maxHp: hp,
    oxygen: BALANCE.OXYGEN.MAX,
    inventory: [...cls.startingItems],
    equippedWeapon: cls.startingItems.find((id) => {
      const def = ITEM_DEFINITIONS[id];
      return def?.type === 'weapon';
    }) ?? null,
    equippedArmor: null,
    conditions: [],
    durability: {},
    actionsInColdZone: 0,
    actionsWithoutRest: 0,
  };
}

// === REDUCER ===

type LoopAction =
  | { type: 'SELECT_DIFFICULTY'; difficulty: DifficultyLevel }
  | { type: 'SELECT_CLASS'; className: PlayerClassName }
  | { type: 'TURN_RESULT'; newGameState: GameState; trace: TurnDebugTrace; diceRoll: DiceResult | null; input: string }
  | { type: 'NEXT_SITUATION'; situation: Situation }
  | { type: 'INCREMENT_FEEDBACK' }
  | { type: 'SET_ERROR'; error: string };

function loopReducer(state: Phase4LoopState, action: LoopAction): Phase4LoopState {
  switch (action.type) {
    case 'SELECT_DIFFICULTY':
      return { ...state, difficulty: action.difficulty, loopPhase: 'class_select', error: null };

    case 'SELECT_CLASS': {
      const character = createCharacter(action.className, state.difficulty);
      const gameState: GameState = {
        ...createInitialGameState(),
        phase: 'playing',
        difficulty: state.difficulty,
        character,
      };
      const situation = generateSituation(character.inventory);
      return {
        ...state,
        loopPhase: 'playing',
        gameState,
        situation,
        lastTrace: null,
        lastDiceRoll: null,
        lastInput: '',
        error: null,
      };
    }

    case 'TURN_RESULT': {
      const newPhase: LoopPhase =
        action.newGameState.phase === 'defeat' ? 'defeat' : 'post_turn';
      return {
        ...state,
        loopPhase: newPhase,
        gameState: action.newGameState,
        lastTrace: action.trace,
        lastDiceRoll: action.diceRoll,
        lastInput: action.input,
        error: null,
      };
    }

    case 'NEXT_SITUATION':
      return {
        ...state,
        loopPhase: 'playing',
        situation: action.situation,
        lastTrace: null,
        lastDiceRoll: null,
        lastInput: '',
        error: null,
      };

    case 'INCREMENT_FEEDBACK':
      return { ...state, feedbackCount: state.feedbackCount + 1 };

    case 'SET_ERROR':
      return { ...state, error: action.error };
  }
}

// === INITIAL STATE ===

function createInitialLoopState(): Phase4LoopState {
  return {
    loopPhase: 'difficulty_select',
    difficulty: 'survivor',
    gameState: createInitialGameState(),
    situation: null,
    lastTrace: null,
    lastDiceRoll: null,
    lastInput: '',
    error: null,
    feedbackCount: 0,
  };
}

// === HOOK ===

export function usePhase4Loop(): Phase4Loop {
  const [state, dispatch] = useReducer(loopReducer, undefined, createInitialLoopState);

  const selectDifficulty = useCallback((difficulty: DifficultyLevel) => {
    dispatch({ type: 'SELECT_DIFFICULTY', difficulty });
  }, []);

  const selectClass = useCallback((className: PlayerClassName) => {
    dispatch({ type: 'SELECT_CLASS', className });
  }, []);

  const submitInput = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed || !state.situation || state.loopPhase !== 'playing') return;

    const enrichedScene = {
      ...state.situation.scene,
      locationId: state.situation.id,
      atmosphere: 'pressurized' as const,
    };
    const parserData = buildParserLocaleData('fr');

    try {
      const result = processTurn(state.gameState, trimmed, enrichedScene, parserData);
      dispatch({
        type: 'TURN_RESULT',
        newGameState: result.newState,
        trace: result.trace,
        diceRoll: result.diceRoll,
        input: trimmed,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'SET_ERROR', error: `Erreur moteur: ${msg}` });
    }
  }, [state.gameState, state.situation, state.loopPhase]);

  const nextSituation = useCallback(() => {
    if (!state.gameState.character) return;
    const situation = generateSituation(state.gameState.character.inventory);
    dispatch({ type: 'NEXT_SITUATION', situation });
  }, [state.gameState.character]);

  const submitFeedback = useCallback((_thumbs: 'up' | 'down', _comment?: string) => {
    dispatch({ type: 'INCREMENT_FEEDBACK' });
  }, []);

  return {
    state,
    classList: CLASS_LIST,
    selectDifficulty,
    selectClass,
    submitInput,
    nextSituation,
    submitFeedback,
  };
}
