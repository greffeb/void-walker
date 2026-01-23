import { create } from 'zustand';
import type {
  GameState,
  GamePhase,
  Player,
  Scenario,
  GameResponse,
  DiceResult,
  CharacterClass,
  SessionProgress,
  Item
} from '../types/game';
import { CHARACTER_CLASSES } from '../types/game';
import { rollCheck, getRelevantStat, getItemModifier, awardXP } from '../utils/dice';

interface GameStore {
  // State
  phase: GamePhase;
  gameState: GameState | null;
  currentNarrative: string;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  pendingDiceRoll: {
    difficulty: number;
    actionType: string;
    action: string;
  } | null;
  lastDiceResult: DiceResult | null;
  apiKey: string | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setApiKey: (key: string) => void;
  createCharacter: (name: string, characterClass: CharacterClass) => void;
  startGame: (scenario: Scenario) => void;
  setNarrative: (text: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingDiceRoll: (roll: { difficulty: number; actionType: string; action: string } | null) => void;
  performDiceRoll: () => DiceResult | null;
  applyStateChanges: (response: GameResponse) => void;
  advanceScene: () => void;
  reset: () => void;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createInitialProgress(totalScenes: number = 15): SessionProgress {
  return {
    currentScene: 0,
    totalScenes,
    targetMinutes: 30,
    objectivesCompleted: [],
    hintsGiven: 0,
    currentBeat: 'intro'
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  phase: 'title',
  gameState: null,
  currentNarrative: '',
  suggestions: [],
  isLoading: false,
  error: null,
  pendingDiceRoll: null,
  lastDiceResult: null,
  apiKey: localStorage.getItem('google_api_key'),

  // Actions
  setPhase: (phase) => set({ phase }),

  setApiKey: (key) => {
    localStorage.setItem('google_api_key', key);
    set({ apiKey: key });
  },

  createCharacter: (name, characterClass) => {
    const player: Player = {
      name,
      className: characterClass.name,
      stats: { ...characterClass.stats },
      maxHp: characterClass.hp,
      hp: characterClass.hp,
      oxygen: 100,
      inventory: characterClass.startingInventory.map(itemName => ({
        name: itemName,
        description: `Équipement de ${characterClass.name}`,
        itemType: 'tool' as const
      })),
      statProgress: { FOR: 0, INT: 0, CHA: 0 }
    };

    set({
      gameState: {
        sessionId: generateSessionId(),
        player,
        scenario: null as any, // Will be set after generation
        currentLocation: '',
        visitedLocations: [],
        progress: createInitialProgress(),
        recentEvents: [],
        turnNumber: 0,
        startTime: new Date().toISOString()
      },
      phase: 'scenario-generation'
    });
  },

  startGame: (scenario) => {
    const state = get().gameState;
    if (!state) return;

    const startLocation = Object.keys(scenario.locations)[0];

    set({
      gameState: {
        ...state,
        scenario,
        currentLocation: startLocation,
        visitedLocations: [startLocation]
      },
      currentNarrative: scenario.intro,
      phase: 'playing'
    });
  },

  setNarrative: (text) => set({ currentNarrative: text }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setPendingDiceRoll: (roll) => set({ pendingDiceRoll: roll, phase: roll ? 'dice-roll' : 'playing' }),

  performDiceRoll: () => {
    const { gameState, pendingDiceRoll } = get();
    if (!gameState || !pendingDiceRoll) return null;

    const stat = getRelevantStat(pendingDiceRoll.actionType as any);
    const statValue = gameState.player.stats[stat];
    const modifier = getItemModifier(gameState.player, stat);

    const result = rollCheck(statValue, modifier, pendingDiceRoll.difficulty, stat);

    // Award XP on success
    if (result.success) {
      set({
        gameState: {
          ...gameState,
          player: awardXP(gameState.player, stat)
        }
      });
    }

    set({ lastDiceResult: result });
    return result;
  },

  applyStateChanges: (response) => {
    const state = get().gameState;
    if (!state) return;

    let player = { ...state.player };
    let currentLocation = state.currentLocation;
    let visitedLocations = [...state.visitedLocations];

    const changes = response.stateChanges;

    if (changes.hpChange) {
      player.hp = Math.max(0, Math.min(player.maxHp, player.hp + changes.hpChange));
    }

    if (changes.oxygenChange) {
      player.oxygen = Math.max(0, Math.min(100, player.oxygen + changes.oxygenChange));
    }

    if (changes.locationChange) {
      currentLocation = changes.locationChange;
      if (!visitedLocations.includes(currentLocation)) {
        visitedLocations.push(currentLocation);
      }
    }

    if (changes.itemsAdded) {
      player.inventory = [...player.inventory, ...changes.itemsAdded];
    }

    if (changes.itemsRemoved) {
      player.inventory = player.inventory.filter(
        item => !changes.itemsRemoved!.includes(item.name)
      );
    }

    let progress = { ...state.progress };
    if (changes.objectivesCompleted) {
      progress.objectivesCompleted = [
        ...progress.objectivesCompleted,
        ...changes.objectivesCompleted
      ];
    }

    set({
      gameState: {
        ...state,
        player,
        currentLocation,
        visitedLocations,
        progress,
        turnNumber: state.turnNumber + 1,
        recentEvents: [
          response.narrative.slice(0, 200),
          ...state.recentEvents.slice(0, 4)
        ]
      },
      currentNarrative: response.narrative,
      suggestions: response.suggestions,
      phase: response.isEnding ? 'game-over' : 'playing',
      pendingDiceRoll: null,
      lastDiceResult: null
    });
  },

  advanceScene: () => {
    const state = get().gameState;
    if (!state) return;

    const progress = { ...state.progress };
    progress.currentScene += 1;

    // Calculate story beat based on progress
    const percentage = (progress.currentScene / progress.totalScenes) * 100;
    if (percentage < 10) progress.currentBeat = 'intro';
    else if (percentage < 45) progress.currentBeat = 'rising';
    else if (percentage < 55) progress.currentBeat = 'midpoint';
    else if (percentage < 85) progress.currentBeat = 'escalation';
    else if (percentage < 95) progress.currentBeat = 'climax';
    else progress.currentBeat = 'resolution';

    set({
      gameState: {
        ...state,
        progress
      }
    });
  },

  reset: () => set({
    phase: 'title',
    gameState: null,
    currentNarrative: '',
    suggestions: [],
    isLoading: false,
    error: null,
    pendingDiceRoll: null,
    lastDiceResult: null
  })
}));
