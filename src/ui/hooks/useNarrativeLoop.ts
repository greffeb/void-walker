// ---------------------------------------------------------------------------
// src/ui/hooks/useNarrativeLoop.ts — Narrative playtest game loop
// ---------------------------------------------------------------------------
// Wraps processTurn() + narrateForTurn() to produce immersive narrative
// output. Maintains persistent GameState across turns.
// ---------------------------------------------------------------------------

import { useReducer, useCallback } from 'react';
import { CLASSES, CLASS_LIST } from '@content/classes';
import { ITEM_DEFINITIONS } from '@content/items';
import { NPC_DEFINITIONS } from '@content/npcs';
import { buildParserLocaleData } from '@content/parserData';
import { generateSituation, type Situation } from '@content/situationGenerator';
import { processTurn } from '@engine/processTurn';
import { createInitialGameState } from '@engine/types';
import { BALANCE } from '@engine/constants';
import { narrateForTurn, NARRATIVE_PRESETS } from '@narration/index';
import type {
  GameState, CharacterState, TurnDebugTrace, DifficultyLevel, DiceResult,
  PlayerClassName, ActiveCombatState, SceneContext,
} from '@engine/types';

// === TYPES ===

export type LoopPhase =
  | 'difficulty_select'
  | 'class_select'
  | 'playing'
  | 'post_turn'
  | 'defeat';

export interface NarrativeLoopState {
  readonly loopPhase: LoopPhase;
  readonly difficulty: DifficultyLevel;
  readonly gameState: GameState;
  readonly situation: Situation | null;
  readonly lastTrace: TurnDebugTrace | null;
  readonly lastDiceRoll: DiceResult | null;
  readonly lastInput: string;
  readonly lastNarration: string | null;
  readonly error: string | null;
  readonly feedbackCount: number;
}

export interface NarrativeLoop {
  readonly state: NarrativeLoopState;
  readonly classList: typeof CLASS_LIST;
  readonly selectDifficulty: (d: DifficultyLevel) => void;
  readonly selectClass: (c: PlayerClassName) => void;
  readonly submitInput: (input: string) => void;
  readonly retryInput: () => void;
  readonly nextSituation: () => void;
  readonly submitFeedback: (thumbs: 'up' | 'down', comment?: string) => void;
}

// === ACTIVE COMBAT BUILDER ===

function buildActiveCombat(situation: Situation): ActiveCombatState | null {
  if (situation.type !== 'combat' || !situation.npcId) return null;
  const npcDef = NPC_DEFINITIONS[situation.npcId];
  if (!npcDef) return null;
  return {
    npc: {
      definitionId: npcDef.id,
      hp: npcDef.hp,
      maxHp: npcDef.hp,
      attack: npcDef.attack ?? npcDef.damage,
      defense: npcDef.defense ?? 0,
      dodgeChance: npcDef.dodgeChance,
      fleeDC: npcDef.fleeDC ?? 10,
      aggressionPattern: npcDef.aggressionPattern,
      weakPoint: npcDef.weakPoint ?? null,
      weakPointDiscovered: false,
      combatRound: 0,
    },
    npcInstanceId: npcDef.id,
    round: 1,
  };
}

// === CHARACTER CREATION ===

function createCharacter(className: PlayerClassName, difficulty: DifficultyLevel): CharacterState {
  const cls = CLASSES[className];
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
  | { type: 'TURN_RESULT'; newGameState: GameState; trace: TurnDebugTrace; diceRoll: DiceResult | null; input: string; narration: string }
  | { type: 'NEXT_SITUATION'; situation: Situation }
  | { type: 'RETRY_INPUT' }
  | { type: 'INCREMENT_FEEDBACK' }
  | { type: 'SET_ERROR'; error: string };

function loopReducer(state: NarrativeLoopState, action: LoopAction): NarrativeLoopState {
  switch (action.type) {
    case 'SELECT_DIFFICULTY':
      return { ...state, difficulty: action.difficulty, loopPhase: 'class_select', error: null };

    case 'SELECT_CLASS': {
      const character = createCharacter(action.className, state.difficulty);
      const situation = generateSituation(character.inventory);
      const gameState: GameState = {
        ...createInitialGameState(),
        phase: 'playing',
        difficulty: state.difficulty,
        character,
        activeCombat: buildActiveCombat(situation),
      };
      return {
        ...state,
        loopPhase: 'playing',
        gameState,
        situation,
        lastTrace: null,
        lastDiceRoll: null,
        lastInput: '',
        lastNarration: null,
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
        lastNarration: action.narration,
        error: null,
      };
    }

    case 'NEXT_SITUATION':
      return {
        ...state,
        loopPhase: 'playing',
        situation: action.situation,
        gameState: {
          ...state.gameState,
          activeCombat: buildActiveCombat(action.situation),
        },
        lastTrace: null,
        lastDiceRoll: null,
        lastInput: '',
        lastNarration: null,
        error: null,
      };

    case 'INCREMENT_FEEDBACK':
      return { ...state, feedbackCount: state.feedbackCount + 1 };

    case 'RETRY_INPUT':
      return {
        ...state,
        loopPhase: 'playing',
        lastTrace: null,
        lastDiceRoll: null,
        lastInput: '',
        lastNarration: null,
        error: null,
      };

    case 'SET_ERROR':
      return { ...state, error: action.error };
  }
}

// === INITIAL STATE ===

function createInitialLoopState(): NarrativeLoopState {
  return {
    loopPhase: 'difficulty_select',
    difficulty: 'survivor',
    gameState: createInitialGameState(),
    situation: null,
    lastTrace: null,
    lastDiceRoll: null,
    lastInput: '',
    lastNarration: null,
    error: null,
    feedbackCount: 0,
  };
}

// === HOOK ===

export function useNarrativeLoop(): NarrativeLoop {
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

    const enrichedScene: SceneContext = {
      ...state.situation.scene,
      locationId: state.situation.id,
      atmosphere: 'pressurized' as const,
    };
    const parserData = buildParserLocaleData('fr');

    try {
      const result = processTurn(state.gameState, trimmed, enrichedScene, parserData);

      // Generate narrative text via the Phase 5 narration bridge
      let narration = '';
      try {
        narration = narrateForTurn(
          result,
          enrichedScene,
          state.gameState,
          NARRATIVE_PRESETS.standard,
          'fr',
        );
      } catch {
        // Narration failure should not block the game loop
        narration = '';
      }

      dispatch({
        type: 'TURN_RESULT',
        newGameState: result.newState,
        trace: result.trace,
        diceRoll: result.diceRoll,
        input: trimmed,
        narration,
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

  const retryInput = useCallback(() => {
    dispatch({ type: 'RETRY_INPUT' });
  }, []);

  const submitFeedback = useCallback((_thumbs: 'up' | 'down', _comment?: string) => {
    dispatch({ type: 'INCREMENT_FEEDBACK' });
  }, []);

  return {
    state,
    classList: CLASS_LIST,
    selectDifficulty,
    selectClass,
    submitInput,
    retryInput,
    nextSituation,
    submitFeedback,
  };
}
