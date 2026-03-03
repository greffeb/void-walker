// ---------------------------------------------------------------------------
// src/stores/gameStore.ts — Zustand store: single source of truth for UI
// ---------------------------------------------------------------------------
// Replaces useScenarioLoop. All game state, creation flow, turn pipeline,
// and save/load live here. Components connect via useGame selectors.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { LAUNCH_SKELETONS } from '@content/scenarios';
import { LAUNCH_SETTINGS } from '@content/settings';
import { ALL_MODULES } from '@content/scenarios/modules';
import { CLASSES } from '@content/classes';
import { buildParserLocaleData } from '@content/parserData';
import { assembleScenario } from '@engine/pacing';
import { initGame, isGameOver } from '@engine/game';
import { getSceneContext, formatSuggestionAsInput } from '@engine/scene';
import { processTurn } from '@engine/processTurn';
import { createSeededRng } from '@engine/rng';
import { BALANCE } from '@engine/constants';
import { narrateForTurn, NARRATIVE_PRESETS } from '@narration/index';
import { narrateScene } from '@narration/scene';
import {
  saveGame as saveToDb,
  loadGame as loadFromDb,
  listSaveSlots,
} from '@services/storage';
import type { SaveSlotInfo, SaveMeta } from '@services/storage';
import type {
  GameState, DifficultyLevel, PlayerClassName, StatId,
  RngFn, DiceResult, SceneContext, SceneDescription, TurnDebugTrace,
  ParserLocaleData,
} from '@engine/types';
import type { SuggestionCandidate } from '@engine/suggestions';
import type { NarratedScene } from '@narration/scene';
import { createInitialGameState } from '@engine/types';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

/** Screen routing */
export type ScreenId = 'title' | 'creation' | 'game' | 'end';

/** Character creation step */
export type CreationStep = 'difficulty' | 'class' | 'bonus' | 'name';

/** A single entry in the narrative history */
export interface TurnEntry {
  readonly id: number;
  readonly input: string;
  readonly narrative: string;
  readonly trace: TurnDebugTrace;
  readonly diceRoll: DiceResult | null;
  readonly locationName: string;
  /** Narrated scene intro for the RESULT state (after turn). */
  readonly sceneIntro: NarratedScene | null;
  /** 'enter' = first visit, 'revisit' = returning, null = same room */
  readonly introMode: 'enter' | 'revisit' | null;
}

// ---------------------------------------------------------------------------
// STORE INTERFACE
// ---------------------------------------------------------------------------

export interface GameStore {
  // === SCREEN ROUTING ===
  screen: ScreenId;
  setScreen: (s: ScreenId) => void;

  // === CHARACTER CREATION ===
  creationStep: CreationStep;
  difficulty: DifficultyLevel | null;
  selectedClass: PlayerClassName | null;
  bonusPoints: Partial<Record<StatId, number>>;
  playerName: string;
  setDifficulty: (d: DifficultyLevel) => void;
  selectClass: (c: PlayerClassName) => void;
  setBonusPoint: (stat: StatId, delta: number) => void;
  setPlayerName: (name: string) => void;
  advanceCreation: () => void;
  backCreation: () => void;

  // === GAME STATE (from engine) ===
  gameState: GameState;
  sceneContext: SceneContext | null;
  sceneDescription: SceneDescription | null;

  // === TURN HISTORY ===
  turnHistory: TurnEntry[];
  currentNarrative: string;
  welcomeNarrative: NarratedScene | null;

  // === UI STATE ===
  isProcessingTurn: boolean;
  isDiceAnimating: boolean;
  pendingDiceResult: DiceResult | null;
  pendingNarrative: string | null;
  pendingTurnEntry: TurnEntry | null;
  activeModal: 'map' | 'inventory' | 'settings' | null;
  typewriterComplete: boolean;
  error: string | null;

  // === SUGGESTIONS ===
  suggestions: readonly SuggestionCandidate[];

  // === SAVE SLOTS ===
  saveSlots: SaveSlotInfo[];

  // === SEED (exposed for bug reports) ===
  seed: number;

  // === ACTIONS ===
  startNewGame: () => void;
  quickStart: () => void;
  submitAction: (input: string) => void;
  submitSuggestion: (s: SuggestionCandidate) => void;
  onDiceAnimationComplete: () => void;
  skipTypewriter: () => void;
  setTypewriterComplete: () => void;
  openModal: (m: 'map' | 'inventory' | 'settings') => void;
  closeModal: () => void;
  saveGameToSlot: (slot: number) => Promise<void>;
  loadGameFromSlot: (slot: number) => Promise<void>;
  refreshSaveSlots: () => Promise<void>;
  restart: () => void;
}

// ---------------------------------------------------------------------------
// HELPERS (module-level, not exported)
// ---------------------------------------------------------------------------

function getLocationName(state: GameState): string {
  if (!state.scenario || !state.playerLocationId) return '???';
  const node = state.scenario.graph.nodes.find(n => n.id === state.playerLocationId);
  return node?.nameKey.fr ?? node?.nameKey.en ?? state.playerLocationId ?? '???';
}

function buildSaveMeta(state: GameState): SaveMeta {
  return {
    playerName: state.character?.name ?? 'Inconnu',
    className: state.character?.className ?? 'marine',
    difficulty: state.difficulty,
    turn: state.turn,
    locationName: getLocationName(state),
    hp: state.character?.hp ?? 0,
    maxHp: state.character?.maxHp ?? 0,
  };
}

/** RNG and parser data live outside React as module-level refs */
let _rng: RngFn = () => Math.random();
let _seed = 0;
let _parserData: ParserLocaleData = buildParserLocaleData('fr');

/** Track narrated element IDs per location for suggestion filtering */
let _narratedIds = new Set<string>();
let _currentLocationId: string | null = null;

function allSceneElementIds(desc: SceneDescription): Set<string> {
  const ids = new Set<string>();
  for (const item of desc.visibleItems) ids.add(item.id);
  for (const feat of desc.visibleFeatures) ids.add(feat.id);
  for (const npc of desc.visibleNpcs) ids.add(npc.id);
  return ids;
}

function filterSuggestionsByNarrated(
  suggestions: readonly SuggestionCandidate[],
  narratedIds: Set<string>,
  scene: SceneDescription | undefined,
): readonly SuggestionCandidate[] {
  return suggestions.filter(s => {
    if (s.category === 'movement') return true;
    if (s.category === 'obstacle') return true;
    if (scene) {
      const allEntities = [...scene.visibleItems, ...scene.visibleFeatures, ...scene.visibleNpcs];
      const entity = allEntities.find(e => e.name === s.targetText || e.id === s.targetText);
      if (entity && narratedIds.has(entity.id)) return true;
    }
    return false;
  });
}

// ---------------------------------------------------------------------------
// RANDOM FRENCH NAMES
// ---------------------------------------------------------------------------

const RANDOM_NAMES: readonly string[] = [
  'Alix', 'Bastien', 'Camille', 'Darius', 'Elara', 'Farid',
  'Gaël', 'Héloïse', 'Idriss', 'Jade', 'Kael', 'Léonie',
  'Marceau', 'Noé', 'Oriane', 'Pavel', 'Quinn', 'Raphaël',
  'Solène', 'Théo', 'Ulysse', 'Véga', 'Wren', 'Xéna',
  'Yael', 'Zara',
];

function randomName(): string {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] ?? 'Joueur';
}

/** Flatten NarratedScene tokens to a plain text string for the typewriter. */
function flattenSceneToText(scene: NarratedScene, showIntro: boolean): string {
  const sections = [
    ...(showIntro ? [scene.intro] : []),
    scene.features,
    scene.items,
    scene.npcs,
    scene.exits,
  ].filter(s => s.length > 0);
  const lines = sections.map(tokens => tokens.map(t => t.value).join(''));
  if (scene.obstacle) lines.push(scene.obstacle);
  lines.push(scene.prompt);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// STORE CREATION
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()((set, get) => ({
  // === SCREEN ROUTING ===
  screen: 'title',
  setScreen: (s) => set({ screen: s }),

  // === CHARACTER CREATION ===
  creationStep: 'difficulty',
  difficulty: null,
  selectedClass: null,
  bonusPoints: {},
  playerName: randomName(),

  setDifficulty: (d) => set({ difficulty: d }),

  selectClass: (c) => set({ selectedClass: c }),

  setBonusPoint: (stat, delta) => {
    const { bonusPoints, selectedClass } = get();
    if (!selectedClass) return;
    const classDef = CLASSES[selectedClass];
    const current = bonusPoints[stat] ?? 0;
    const newVal = current + delta;
    if (newVal < 0) return;
    if (classDef.baseStats[stat] + newVal > BALANCE.STAT_MAX) return;
    const totalUsed = Object.values(bonusPoints).reduce<number>((a, b) => a + (b ?? 0), 0);
    if (delta > 0 && totalUsed >= BALANCE.BONUS_POINTS) return;
    set({ bonusPoints: { ...bonusPoints, [stat]: newVal } });
  },

  setPlayerName: (name) => set({ playerName: name }),

  advanceCreation: () => {
    const { creationStep } = get();
    const steps: CreationStep[] = ['difficulty', 'class', 'bonus', 'name'];
    const idx = steps.indexOf(creationStep);
    if (idx < steps.length - 1) {
      set({ creationStep: steps[idx + 1]! });
    }
  },

  backCreation: () => {
    const { creationStep } = get();
    const steps: CreationStep[] = ['difficulty', 'class', 'bonus', 'name'];
    const idx = steps.indexOf(creationStep);
    if (idx > 0) {
      set({ creationStep: steps[idx - 1]! });
    }
  },

  // === GAME STATE ===
  gameState: createInitialGameState(),
  sceneContext: null,
  sceneDescription: null,

  // === TURN HISTORY ===
  turnHistory: [],
  currentNarrative: '',
  welcomeNarrative: null,

  // === UI STATE ===
  isProcessingTurn: false,
  isDiceAnimating: false,
  pendingDiceResult: null,
  pendingNarrative: null,
  pendingTurnEntry: null,
  activeModal: null,
  typewriterComplete: true,
  error: null,

  // === SUGGESTIONS ===
  suggestions: [],

  // === SAVE SLOTS ===
  saveSlots: [],

  // === SEED ===
  seed: 0,

  // === ACTIONS ===

  startNewGame: () => {
    const { difficulty, selectedClass, playerName, bonusPoints } = get();
    if (!difficulty || !selectedClass) return;

    try {
      _seed = Math.floor(Math.random() * 2147483646) + 1;
      _rng = createSeededRng(_seed);
      _parserData = buildParserLocaleData('fr');

      const skeleton = LAUNCH_SKELETONS[Math.floor(_rng() * LAUNCH_SKELETONS.length)]!;
      const setting = LAUNCH_SETTINGS[Math.floor(_rng() * LAUNCH_SETTINGS.length)]!;
      const scenario = assembleScenario(skeleton, 'standard', setting, ALL_MODULES, _rng);

      // Apply bonus points to base stats
      const classDef = CLASSES[selectedClass];
      const baseStats = { ...classDef.baseStats };
      for (const [stat, bonus] of Object.entries(bonusPoints)) {
        if (bonus && bonus > 0) {
          baseStats[stat as StatId] = (baseStats[stat as StatId] ?? 0) + bonus;
        }
      }

      const name = playerName.trim() || 'Joueur';
      const gameState = initGame(scenario, selectedClass, difficulty, name, _rng);

      // Apply custom bonus stats to the game state
      const totalBonusUsed = Object.values(bonusPoints).reduce<number>((a, b) => a + (b ?? 0), 0);
      let finalState = gameState;
      if (totalBonusUsed > 0 && finalState.character) {
        finalState = {
          ...finalState,
          character: {
            ...finalState.character,
            stats: baseStats,
          },
        };
      }

      const sceneContext = getSceneContext(finalState);

      // Build welcome narrative
      let welcomeNarrative: NarratedScene | null = null;
      if (sceneContext.sceneDescription) {
        _narratedIds = allSceneElementIds(sceneContext.sceneDescription);
        _currentLocationId = sceneContext.locationId ?? null;
        try {
          welcomeNarrative = narrateScene(sceneContext.sceneDescription, 'enter', 'fr');
        } catch {
          // Narration failure should not block game start
        }
      }

      // Filter suggestions
      const allSuggestions = sceneContext.scenarioSuggestions ?? [];
      const filtered = filterSuggestionsByNarrated(allSuggestions, _narratedIds, sceneContext.sceneDescription);

      set({
        screen: 'game',
        gameState: finalState,
        sceneContext,
        sceneDescription: sceneContext.sceneDescription ?? null,
        welcomeNarrative,
        suggestions: filtered.slice(0, 2),
        turnHistory: [],
        currentNarrative: '',
        typewriterComplete: true,
        isProcessingTurn: false,
        seed: _seed,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: `Erreur assemblage scénario: ${msg}` });
    }
  },

  quickStart: () => {
    const difficulties: DifficultyLevel[] = ['explorer', 'survivor', 'nightmare'];
    const classes: PlayerClassName[] = ['marine', 'engineer', 'medic'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]!;
    const selectedClass = classes[Math.floor(Math.random() * classes.length)]!;
    const playerName = randomName();

    // Distribute bonus points randomly within stat cap
    const classDef = CLASSES[selectedClass];
    const stats: StatId[] = ['FOR', 'DEF', 'AGI', 'INT', 'PER', 'CHA', 'LCK'];
    const bonusPoints: Partial<Record<StatId, number>> = {};
    let remaining = BALANCE.BONUS_POINTS;
    while (remaining > 0) {
      const stat = stats[Math.floor(Math.random() * stats.length)]!;
      const current = bonusPoints[stat] ?? 0;
      if (classDef.baseStats[stat] + current < BALANCE.STAT_MAX) {
        bonusPoints[stat] = current + 1;
        remaining--;
      }
    }

    set({ difficulty, selectedClass, playerName, bonusPoints });
    get().startNewGame();
  },

  submitAction: (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const store = get();
    if (store.isProcessingTurn || store.isDiceAnimating || !store.typewriterComplete) return;
    if (store.gameState.phase === 'defeat' || store.gameState.phase === 'victory') return;

    set({ isProcessingTurn: true, error: null });

    try {
      const context = getSceneContext(store.gameState);
      const result = processTurn(store.gameState, trimmed, context, _parserData, _rng);

      let narrative = '';
      try {
        narrative = narrateForTurn(result, context, store.gameState, NARRATIVE_PRESETS.standard, 'fr');
      } catch {
        // Narration failure should not block
      }

      const newContext = getSceneContext(result.newState);
      const newLocationId = newContext.locationId ?? null;
      const prevLocationId = _currentLocationId;
      let introMode: 'enter' | 'revisit' | null = null;

      if (newLocationId !== null && newLocationId !== prevLocationId) {
        introMode = (newLocationId in store.gameState.visitedLocations) ? 'revisit' : 'enter';
      }

      // Update narrated IDs
      if (newLocationId !== prevLocationId) {
        if (newContext.sceneDescription) {
          _narratedIds = allSceneElementIds(newContext.sceneDescription);
        } else {
          _narratedIds = new Set();
        }
        _currentLocationId = newLocationId;
      } else {
        const isExamineEnv = result.trace.parsedVerb === 'EXAMINE'
          && result.trace.parsedTarget === 'environment'
          && (result.trace.outcome === 'success' || result.trace.outcome === 'crit_success' || result.trace.isAutoVerb);
        if (isExamineEnv && newContext.sceneDescription) {
          const allIds = allSceneElementIds(newContext.sceneDescription);
          for (const id of allIds) _narratedIds.add(id);
        } else if (result.trace.parsedTarget) {
          _narratedIds.add(result.trace.parsedTarget);
        }
      }

      // Always build scene description; intro line shown only on location change
      let sceneIntro: NarratedScene | null = null;
      if (newContext.sceneDescription) {
        try {
          sceneIntro = narrateScene(newContext.sceneDescription, introMode ?? 'revisit', 'fr');
        } catch {
          // Narration failure should not block
        }
      }

      const entry: TurnEntry = {
        id: result.newState.turn,
        input: trimmed,
        narrative,
        trace: result.trace,
        diceRoll: result.diceRoll,
        locationName: getLocationName(result.newState),
        sceneIntro,
        introMode,
      };

      // Filter suggestions
      const allSuggestions = newContext.scenarioSuggestions ?? [];
      const filtered = filterSuggestionsByNarrated(allSuggestions, _narratedIds, newContext.sceneDescription);

      // Determine if dice animation should play
      const hasDice = result.diceRoll !== null && !result.trace.isAutoVerb;

      if (hasDice) {
        // Dice animation pipeline: show dice first, narrative after
        set({
          isDiceAnimating: true,
          pendingDiceResult: result.diceRoll,
          pendingNarrative: narrative,
          pendingTurnEntry: entry,
          gameState: result.newState,
          sceneContext: newContext,
          sceneDescription: newContext.sceneDescription ?? null,
          suggestions: filtered.slice(0, 2),
          isProcessingTurn: false,
        });
      } else {
        // No dice: typewriter plays first, entry commits to history when done
        const sceneText = sceneIntro
          ? flattenSceneToText(sceneIntro, introMode !== null)
          : '';
        const fullNarrative = sceneText ? `${narrative}\n\n${sceneText}` : narrative;
        const gameOver = isGameOver(result.newState);
        set({
          pendingTurnEntry: entry,
          currentNarrative: fullNarrative,
          typewriterComplete: false,
          gameState: result.newState,
          sceneContext: newContext,
          sceneDescription: newContext.sceneDescription ?? null,
          suggestions: filtered.slice(0, 2),
          isProcessingTurn: false,
          screen: gameOver ? 'end' : store.screen,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      set({ isProcessingTurn: false, error: `Erreur moteur: ${msg}` });
    }
  },

  submitSuggestion: (s) => {
    get().submitAction(formatSuggestionAsInput(s));
  },

  onDiceAnimationComplete: () => {
    const { pendingNarrative, pendingTurnEntry, turnHistory, gameState } = get();
    const gameOver = isGameOver(gameState);
    set({
      isDiceAnimating: false,
      pendingDiceResult: null,
      turnHistory: pendingTurnEntry ? [...turnHistory, pendingTurnEntry] : turnHistory,
      currentNarrative: pendingNarrative ?? '',
      pendingNarrative: null,
      pendingTurnEntry: null,
      typewriterComplete: false,
      screen: gameOver ? 'end' : get().screen,
    });
  },

  skipTypewriter: () => {
    const { pendingTurnEntry, turnHistory } = get();
    set({
      typewriterComplete: true,
      currentNarrative: '',
      ...(pendingTurnEntry ? { turnHistory: [...turnHistory, pendingTurnEntry], pendingTurnEntry: null } : {}),
    });
  },

  setTypewriterComplete: () => {
    const { pendingTurnEntry, turnHistory } = get();
    set({
      typewriterComplete: true,
      currentNarrative: '',
      ...(pendingTurnEntry ? { turnHistory: [...turnHistory, pendingTurnEntry], pendingTurnEntry: null } : {}),
    });
  },

  openModal: (m) => set({ activeModal: m }),
  closeModal: () => set({ activeModal: null }),

  saveGameToSlot: async (slot) => {
    const { gameState } = get();
    await saveToDb({
      slot,
      gameState,
      seed: _seed,
      timestamp: Date.now(),
      meta: buildSaveMeta(gameState),
    });
    await get().refreshSaveSlots();
  },

  loadGameFromSlot: async (slot) => {
    const record = await loadFromDb(slot);
    if (!record) return;

    _seed = record.seed;
    _rng = createSeededRng(_seed);
    // Advance RNG to match turn count (approximate)
    for (let i = 0; i < record.gameState.turn * 10; i++) _rng();

    _parserData = buildParserLocaleData('fr');

    const sceneContext = getSceneContext(record.gameState);
    if (sceneContext.sceneDescription) {
      _narratedIds = allSceneElementIds(sceneContext.sceneDescription);
    }
    _currentLocationId = sceneContext.locationId ?? null;

    const allSuggestions = sceneContext.scenarioSuggestions ?? [];
    const filtered = filterSuggestionsByNarrated(allSuggestions, _narratedIds, sceneContext.sceneDescription);

    set({
      screen: 'game',
      gameState: record.gameState,
      sceneContext,
      sceneDescription: sceneContext.sceneDescription ?? null,
      suggestions: filtered.slice(0, 2),
      turnHistory: [],
      currentNarrative: '',
      welcomeNarrative: null,
      typewriterComplete: true,
      isProcessingTurn: false,
      isDiceAnimating: false,
      seed: record.seed,
      error: null,
    });
  },

  refreshSaveSlots: async () => {
    const slots = await listSaveSlots();
    set({ saveSlots: slots });
  },

  restart: () => {
    _narratedIds = new Set();
    _currentLocationId = null;
    set({
      screen: 'title',
      creationStep: 'difficulty',
      difficulty: null,
      selectedClass: null,
      bonusPoints: {},
      playerName: randomName(),
      gameState: createInitialGameState(),
      sceneContext: null,
      sceneDescription: null,
      turnHistory: [],
      currentNarrative: '',
      welcomeNarrative: null,
      isProcessingTurn: false,
      isDiceAnimating: false,
      pendingDiceResult: null,
      pendingNarrative: null,
      pendingTurnEntry: null,
      activeModal: null,
      typewriterComplete: true,
      suggestions: [],
      error: null,
    });
  },
}));
