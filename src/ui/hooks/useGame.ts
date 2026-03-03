// ---------------------------------------------------------------------------
// src/ui/hooks/useGame.ts — Lightweight Zustand selectors for UI components
// ---------------------------------------------------------------------------
// Components import these instead of reaching into the store directly.
// ---------------------------------------------------------------------------

import { useShallow } from 'zustand/shallow';
import { useGameStore } from '@stores/gameStore';
import type { GameStore } from '@stores/gameStore';

// === SCREEN ===

export function useScreen(): GameStore['screen'] {
  return useGameStore(s => s.screen);
}

// === CREATION ===

export function useCreation(): {
  step: GameStore['creationStep'];
  difficulty: GameStore['difficulty'];
  selectedClass: GameStore['selectedClass'];
  bonusPoints: GameStore['bonusPoints'];
  playerName: GameStore['playerName'];
  setDifficulty: GameStore['setDifficulty'];
  selectClass: GameStore['selectClass'];
  setBonusPoint: GameStore['setBonusPoint'];
  setPlayerName: GameStore['setPlayerName'];
  advance: GameStore['advanceCreation'];
  back: GameStore['backCreation'];
  startNewGame: GameStore['startNewGame'];
} {
  return useGameStore(useShallow(s => ({
    step: s.creationStep,
    difficulty: s.difficulty,
    selectedClass: s.selectedClass,
    bonusPoints: s.bonusPoints,
    playerName: s.playerName,
    setDifficulty: s.setDifficulty,
    selectClass: s.selectClass,
    setBonusPoint: s.setBonusPoint,
    setPlayerName: s.setPlayerName,
    advance: s.advanceCreation,
    back: s.backCreation,
    startNewGame: s.startNewGame,
  })));
}

// === GAME STATE ===

export function useGameState(): {
  gameState: GameStore['gameState'];
  sceneContext: GameStore['sceneContext'];
  sceneDescription: GameStore['sceneDescription'];
  suggestions: GameStore['suggestions'];
} {
  return useGameStore(useShallow(s => ({
    gameState: s.gameState,
    sceneContext: s.sceneContext,
    sceneDescription: s.sceneDescription,
    suggestions: s.suggestions,
  })));
}

// === GAME ACTIONS ===

export function useGameActions(): {
  submitAction: GameStore['submitAction'];
  submitSuggestion: GameStore['submitSuggestion'];
  restart: GameStore['restart'];
  openModal: GameStore['openModal'];
  closeModal: GameStore['closeModal'];
} {
  return useGameStore(useShallow(s => ({
    submitAction: s.submitAction,
    submitSuggestion: s.submitSuggestion,
    restart: s.restart,
    openModal: s.openModal,
    closeModal: s.closeModal,
  })));
}

// === UI STATE ===

export function useUIState(): {
  isProcessingTurn: boolean;
  isDiceAnimating: boolean;
  pendingDiceResult: GameStore['pendingDiceResult'];
  activeModal: GameStore['activeModal'];
  typewriterComplete: boolean;
  error: GameStore['error'];
} {
  return useGameStore(useShallow(s => ({
    isProcessingTurn: s.isProcessingTurn,
    isDiceAnimating: s.isDiceAnimating,
    pendingDiceResult: s.pendingDiceResult,
    activeModal: s.activeModal,
    typewriterComplete: s.typewriterComplete,
    error: s.error,
  })));
}

// === NARRATIVE ===

export function useNarrative(): {
  turnHistory: GameStore['turnHistory'];
  currentNarrative: string;
  welcomeNarrative: GameStore['welcomeNarrative'];
  typewriterComplete: boolean;
  skipTypewriter: GameStore['skipTypewriter'];
  setTypewriterComplete: GameStore['setTypewriterComplete'];
} {
  return useGameStore(useShallow(s => ({
    turnHistory: s.turnHistory,
    currentNarrative: s.currentNarrative,
    welcomeNarrative: s.welcomeNarrative,
    typewriterComplete: s.typewriterComplete,
    skipTypewriter: s.skipTypewriter,
    setTypewriterComplete: s.setTypewriterComplete,
  })));
}

// === DICE ===

export function useDice(): {
  isDiceAnimating: boolean;
  pendingDiceResult: GameStore['pendingDiceResult'];
  onDiceAnimationComplete: GameStore['onDiceAnimationComplete'];
} {
  return useGameStore(useShallow(s => ({
    isDiceAnimating: s.isDiceAnimating,
    pendingDiceResult: s.pendingDiceResult,
    onDiceAnimationComplete: s.onDiceAnimationComplete,
  })));
}

// === SAVE/LOAD ===

export function useSaveLoad(): {
  saveSlots: GameStore['saveSlots'];
  saveGameToSlot: GameStore['saveGameToSlot'];
  loadGameFromSlot: GameStore['loadGameFromSlot'];
  refreshSaveSlots: GameStore['refreshSaveSlots'];
} {
  return useGameStore(useShallow(s => ({
    saveSlots: s.saveSlots,
    saveGameToSlot: s.saveGameToSlot,
    loadGameFromSlot: s.loadGameFromSlot,
    refreshSaveSlots: s.refreshSaveSlots,
  })));
}
