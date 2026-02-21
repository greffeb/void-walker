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
  StatName
} from '../types/game';
import { rollCheck, getItemModifier, awardXP } from '../utils/dice';
import { initializeLLM, getLLMClient, callLLM, LLMError } from '../services/llmClient';
import { buildWorldGenPrompt, buildGameplayPrompt, SESSION_CONFIGS, type SessionType } from '../services/prompts';
import { parseScenario, parseGameResponse, summarizeNarrative } from '../services/parser';
import { validateGameResponse, calculateStoryBeat } from '../services/validators';
import { saveGame, loadGame, listSaves, deleteSave, scheduleAutoSave, getApiKey, type SaveMetadata } from '../services/storage';

interface GameStore {
  // State
  phase: GamePhase;
  gameState: GameState | null;
  currentNarrative: string;
  suggestions: string[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  pendingDiceRoll: {
    difficulty: number;
    actionType: string;
    action: string;
    relevantStat: StatName;
    modifier: number;
  } | null;
  lastDiceResult: DiceResult | null;
  apiKey: string | null;
  saves: SaveMetadata[];
  sessionType: SessionType;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setApiKey: (key: string) => void;
  loadApiKey: () => Promise<void>;
  setSessionType: (type: SessionType) => void;
  createCharacter: (name: string, characterClass: CharacterClass) => void;
  generateScenario: () => Promise<void>;
  startGame: (scenario: Scenario) => void;
  processAction: (action: string) => Promise<void>;
  narrateOutcome: (result: DiceResult) => Promise<void>;
  setNarrative: (text: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingDiceRoll: (roll: { difficulty: number; actionType: string; action: string; relevantStat: StatName; modifier: number } | null) => void;
  performDiceRoll: () => DiceResult | null;
  applyStateChanges: (response: GameResponse) => void;
  advanceScene: () => void;
  loadSavedGame: (sessionId: string) => Promise<void>;
  saveCurrentGame: () => Promise<void>;
  deleteSavedGame: (sessionId: string) => Promise<void>;
  refreshSaves: () => Promise<void>;
  reset: () => void;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createInitialProgress(sessionType: SessionType = 'standard'): SessionProgress {
  const config = SESSION_CONFIGS[sessionType];
  return {
    currentScene: 0,
    totalScenes: config.scenes,
    targetMinutes: config.targetMinutes,
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
  isGenerating: false,
  error: null,
  pendingDiceRoll: null,
  lastDiceResult: null,
  apiKey: localStorage.getItem('google_api_key'),
  saves: [],
  sessionType: 'standard',

  // Actions
  setPhase: (phase) => set({ phase }),

  setApiKey: (key) => {
    localStorage.setItem('google_api_key', key);
    initializeLLM(key);
    set({ apiKey: key });
  },

  loadApiKey: async () => {
    const key = await getApiKey();
    if (key) {
      initializeLLM(key);
      set({ apiKey: key });
    }
  },

  setSessionType: (type) => set({ sessionType: type }),

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

    const { sessionType } = get();

    set({
      gameState: {
        sessionId: generateSessionId(),
        player,
        scenario: null as unknown as Scenario,
        currentLocation: '',
        visitedLocations: [],
        progress: createInitialProgress(sessionType),
        recentEvents: [],
        turnNumber: 0,
        startTime: new Date().toISOString()
      },
      phase: 'scenario-generation'
    });
  },

  generateScenario: async () => {
    // Guard against double invocation (React StrictMode double-fires effects)
    if (get().isGenerating) return;
    set({ isGenerating: true, error: null });

    const { apiKey, sessionType, gameState } = get();

    if (!apiKey) {
      set({ error: 'Clé API non configurée', phase: 'api-key-setup', isGenerating: false });
      return;
    }

    if (!gameState) {
      set({ error: 'État de jeu non initialisé', isGenerating: false });
      return;
    }

    try {
      const client = getLLMClient();
      if (!client.isInitialized()) {
        initializeLLM(apiKey);
      }

      // Build world generation prompt
      const prompt = buildWorldGenPrompt(sessionType);

      // Call LLM for scenario generation (use pro model)
      const response = await callLLM(prompt, 'world_gen', 3);

      // Parse the response into a Scenario
      const scenario = parseScenario(response);

      // Auto-save the generated scenario
      try {
        const { saveScenario: saveScenarioToDb } = await import('../services/storage');
        await saveScenarioToDb(scenario);
        console.log('Scenario auto-saved:', scenario.title);
      } catch (saveError) {
        console.warn('Failed to auto-save scenario:', saveError);
        // Don't fail scenario generation if save fails
      }

      // Start the game with the generated scenario
      const startLocation = Object.keys(scenario.locations)[0];

      set({
        gameState: {
          ...gameState,
          scenario,
          currentLocation: startLocation,
          visitedLocations: [startLocation]
        },
        currentNarrative: scenario.intro,
        suggestions: [
          'Explorer les environs',
          'Examiner votre équipement',
          'Chercher des indices'
        ],
        phase: 'playing',
        isGenerating: false
      });
    } catch (error) {
      console.error('Scenario generation failed:', error);
      const errorMessage = error instanceof LLMError
        ? error.message
        : 'Erreur lors de la génération du scénario';
      set({
        error: errorMessage,
        isGenerating: false
      });
    }
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

  processAction: async (action: string) => {
    const { gameState, apiKey } = get();

    if (!gameState || !apiKey) {
      set({ error: 'État de jeu ou clé API manquant' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const client = getLLMClient();
      if (!client.isInitialized()) {
        initializeLLM(apiKey);
      }

      // Build gameplay prompt
      const prompt = buildGameplayPrompt(gameState, action);

      // Call LLM
      const response = await callLLM(prompt, 'gameplay', 3);

      // Parse response
      let gameResponse = parseGameResponse(response);

      // Validate and fix response
      gameResponse = validateGameResponse(gameResponse, gameState.progress, gameState);

      // Check if dice roll is required
      if (gameResponse.requiresRoll && gameResponse.difficulty) {
        const stat = gameResponse.relevantStat || 'INT';
        const modifier = gameResponse.suggestedModifier || 0;

        set({
          pendingDiceRoll: {
            difficulty: gameResponse.difficulty,
            actionType: gameResponse.actionType,
            action,
            relevantStat: stat,
            modifier: modifier + getItemModifier(gameState.player, stat)
          },
          currentNarrative: gameResponse.narrative,
          phase: 'dice-roll',
          isLoading: false
        });
      } else {
        // No roll required, apply changes directly
        get().applyStateChanges(gameResponse);
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Action processing failed:', error);
      const errorMessage = error instanceof LLMError
        ? error.message
        : 'Erreur lors du traitement de l\'action';
      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  narrateOutcome: async (result: DiceResult) => {
    const { gameState, apiKey, pendingDiceRoll } = get();

    if (!gameState || !apiKey || !pendingDiceRoll) {
      set({ error: 'État incomplet pour narrer le résultat' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const client = getLLMClient();
      if (!client.isInitialized()) {
        initializeLLM(apiKey);
      }

      // Build gameplay prompt with dice result
      const prompt = buildGameplayPrompt(gameState, pendingDiceRoll.action, result);

      // Call LLM
      const response = await callLLM(prompt, 'gameplay', 3);

      // Parse response
      let gameResponse = parseGameResponse(response);

      // Validate and fix response
      gameResponse = validateGameResponse(gameResponse, gameState.progress, gameState);

      // Apply state changes
      get().applyStateChanges(gameResponse);

      set({
        phase: 'playing',
        pendingDiceRoll: null,
        lastDiceResult: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Outcome narration failed:', error);
      const errorMessage = error instanceof LLMError
        ? error.message
        : 'Erreur lors de la narration du résultat';
      set({
        error: errorMessage,
        isLoading: false
      });
    }
  },

  setNarrative: (text) => set({ currentNarrative: text }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setPendingDiceRoll: (roll) => set({ pendingDiceRoll: roll, phase: roll ? 'dice-roll' : 'playing' }),

  performDiceRoll: () => {
    const { gameState, pendingDiceRoll } = get();
    if (!gameState || !pendingDiceRoll) return null;

    const stat = pendingDiceRoll.relevantStat;
    const statValue = gameState.player.stats[stat];
    const modifier = pendingDiceRoll.modifier;

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
    progress.currentScene += 1;
    progress.currentBeat = calculateStoryBeat(progress.currentScene, progress.totalScenes);

    if (changes.objectivesCompleted) {
      progress.objectivesCompleted = [
        ...progress.objectivesCompleted,
        ...changes.objectivesCompleted
      ];
    }

    // Add to recent events
    const eventSummary = summarizeNarrative(response.narrative);
    const recentEvents = [eventSummary, ...state.recentEvents.slice(0, 4)];

    const newGameState: GameState = {
      ...state,
      player,
      currentLocation,
      visitedLocations,
      progress,
      turnNumber: state.turnNumber + 1,
      recentEvents
    };

    set({
      gameState: newGameState,
      currentNarrative: response.narrative,
      suggestions: response.suggestions,
      phase: response.isEnding ? 'game-over' : 'playing',
      pendingDiceRoll: null,
      lastDiceResult: null
    });

    // Schedule auto-save
    scheduleAutoSave(newGameState);
  },

  advanceScene: () => {
    const state = get().gameState;
    if (!state) return;

    const progress = { ...state.progress };
    progress.currentScene += 1;
    progress.currentBeat = calculateStoryBeat(progress.currentScene, progress.totalScenes);

    set({
      gameState: {
        ...state,
        progress
      }
    });
  },

  loadSavedGame: async (sessionId: string) => {
    set({ isLoading: true, error: null });

    try {
      const savedState = await loadGame(sessionId);
      if (!savedState) {
        throw new Error('Sauvegarde introuvable');
      }

      set({
        gameState: savedState,
        currentNarrative: savedState.recentEvents[0] || '',
        suggestions: [
          'Continuer l\'exploration',
          'Vérifier l\'inventaire',
          'Examiner les environs'
        ],
        phase: 'playing',
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load game:', error);
      set({
        error: error instanceof Error ? error.message : 'Erreur de chargement',
        isLoading: false
      });
    }
  },

  saveCurrentGame: async () => {
    const { gameState } = get();
    if (!gameState) return;

    try {
      await saveGame(gameState);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  },

  deleteSavedGame: async (sessionId: string) => {
    try {
      await deleteSave(sessionId);
      await get().refreshSaves();
    } catch (error) {
      console.error('Failed to delete save:', error);
    }
  },

  refreshSaves: async () => {
    try {
      const saves = await listSaves();
      set({ saves });
    } catch (error) {
      console.error('Failed to refresh saves:', error);
    }
  },

  reset: () => set({
    phase: 'title',
    gameState: null,
    currentNarrative: '',
    suggestions: [],
    isLoading: false,
    isGenerating: false,
    error: null,
    pendingDiceRoll: null,
    lastDiceResult: null
  })
}));
