/**
 * Void Walker PWA - Storage Service
 *
 * IndexedDB persistence using Dexie.js for game saves, scenarios, and settings.
 */

import Dexie, { type Table } from 'dexie';
import type { GameState, Scenario } from '../types/game';

// Types for storage
export interface SaveMetadata {
  sessionId: string;
  playerName: string;
  className: string;
  scenarioTitle: string;
  progress: number; // 0-100 percentage
  currentLocation: string;
  hp: number;
  maxHp: number;
  turnNumber: number;
  savedAt: string;
}

export interface SavedGame {
  sessionId: string;
  state: GameState;
  savedAt: string;
}

export interface ScenarioMetadata {
  id: string; // Generated unique ID
  title: string;
  settingType: string;
  estimatedDifficulty: string;
  locationCount: number;
  savedAt: string;
}

export interface SavedScenario {
  id: string; // Generated unique ID
  scenario: Scenario;
  savedAt: string;
}

export interface AppSettings {
  id: string; // Always 'settings'
  apiKey?: string;
  typewriterSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  autoSave: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  typewriterSpeed: 'normal',
  autoSave: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Database definition
class VoidWalkerDB extends Dexie {
  saves!: Table<SavedGame, string>;
  scenarios!: Table<SavedScenario, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('VoidWalkerDB');

    // Version 1: Initial schema
    this.version(1).stores({
      saves: 'sessionId, savedAt',
      settings: 'id',
    });

    // Version 2: Add scenarios table
    this.version(2).stores({
      saves: 'sessionId, savedAt',
      scenarios: 'id, savedAt',
      settings: 'id',
    });
  }
}

// Singleton instance
const db = new VoidWalkerDB();

// =============================================================================
// GAME SAVES
// =============================================================================

/**
 * Save the current game state.
 */
export async function saveGame(state: GameState): Promise<void> {
  const save: SavedGame = {
    sessionId: state.sessionId,
    state,
    savedAt: new Date().toISOString(),
  };

  await db.saves.put(save);
}

/**
 * Load a saved game by session ID.
 */
export async function loadGame(sessionId: string): Promise<GameState | undefined> {
  const save = await db.saves.get(sessionId);
  return save?.state;
}

/**
 * Get metadata for all saved games (for save list UI).
 */
export async function listSaves(): Promise<SaveMetadata[]> {
  const saves = await db.saves.orderBy('savedAt').reverse().toArray();

  return saves.map(save => {
    const state = save.state;
    const progress = Math.round(
      (state.progress.currentScene / state.progress.totalScenes) * 100
    );

    return {
      sessionId: save.sessionId,
      playerName: state.player.name,
      className: state.player.className,
      scenarioTitle: state.scenario?.title || 'Unknown',
      progress,
      currentLocation: state.currentLocation,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      turnNumber: state.turnNumber,
      savedAt: save.savedAt,
    };
  });
}

/**
 * Delete a saved game.
 */
export async function deleteSave(sessionId: string): Promise<void> {
  await db.saves.delete(sessionId);
}

/**
 * Delete all saved games.
 */
export async function deleteAllSaves(): Promise<void> {
  await db.saves.clear();
}

/**
 * Check if any saves exist.
 */
export async function hasSaves(): Promise<boolean> {
  const count = await db.saves.count();
  return count > 0;
}

// =============================================================================
// SCENARIOS
// =============================================================================

/**
 * Generate a unique ID for a scenario.
 */
function generateScenarioId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `scenario_${timestamp}_${random}`;
}

/**
 * Save a generated scenario for later use.
 */
export async function saveScenario(scenario: Scenario): Promise<string> {
  const id = generateScenarioId();
  const savedScenario: SavedScenario = {
    id,
    scenario,
    savedAt: new Date().toISOString(),
  };

  await db.scenarios.put(savedScenario);
  return id;
}

/**
 * Load a scenario by ID.
 */
export async function loadScenario(id: string): Promise<Scenario | undefined> {
  const saved = await db.scenarios.get(id);
  return saved?.scenario;
}

/**
 * Get metadata for all saved scenarios (for scenario browser UI).
 */
export async function listScenarios(): Promise<ScenarioMetadata[]> {
  const scenarios = await db.scenarios.orderBy('savedAt').reverse().toArray();

  return scenarios.map(saved => {
    const scenario = saved.scenario;
    const locationCount = Object.keys(scenario.locations || {}).length;

    return {
      id: saved.id,
      title: scenario.title || 'Scénario sans titre',
      settingType: scenario.setting || 'unknown',
      estimatedDifficulty: 'medium', // Could be enhanced with validation data
      locationCount,
      savedAt: saved.savedAt,
    };
  });
}

/**
 * Delete a saved scenario.
 */
export async function deleteScenario(id: string): Promise<void> {
  await db.scenarios.delete(id);
}

/**
 * Delete all saved scenarios.
 */
export async function deleteAllScenarios(): Promise<void> {
  await db.scenarios.clear();
}

/**
 * Check if any scenarios exist.
 */
export async function hasScenarios(): Promise<boolean> {
  const count = await db.scenarios.count();
  return count > 0;
}

// =============================================================================
// SETTINGS
// =============================================================================

/**
 * Get application settings.
 */
export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('settings');
  return settings || { ...DEFAULT_SETTINGS };
}

/**
 * Save application settings.
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({
    ...current,
    ...settings,
    id: 'settings',
  });
}

/**
 * Get the stored API key.
 */
export async function getApiKey(): Promise<string | undefined> {
  // First check IndexedDB
  const settings = await getSettings();
  if (settings.apiKey) {
    return settings.apiKey;
  }

  // Fallback to localStorage (for backwards compatibility)
  const localKey = localStorage.getItem('google_api_key');
  if (localKey) {
    // Migrate to IndexedDB
    await saveSettings({ apiKey: localKey });
    return localKey;
  }

  return undefined;
}

/**
 * Save the API key.
 */
export async function saveApiKey(apiKey: string): Promise<void> {
  await saveSettings({ apiKey });
  // Also save to localStorage for backwards compatibility
  localStorage.setItem('google_api_key', apiKey);
}

/**
 * Clear the API key.
 */
export async function clearApiKey(): Promise<void> {
  await saveSettings({ apiKey: undefined });
  localStorage.removeItem('google_api_key');
}

// =============================================================================
// AUTO-SAVE HELPER
// =============================================================================

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedule an auto-save with debouncing.
 */
export function scheduleAutoSave(
  state: GameState,
  delayMs: number = 2000
): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    const settings = await getSettings();
    if (settings.autoSave) {
      try {
        await saveGame(state);
        console.log('Auto-saved game:', state.sessionId);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
    autoSaveTimeout = null;
  }, delayMs);
}

/**
 * Cancel pending auto-save.
 */
export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
}

// =============================================================================
// DATABASE MANAGEMENT
// =============================================================================

/**
 * Get database storage usage (approximate).
 */
export async function getStorageUsage(): Promise<{ saves: number; total: number }> {
  const saves = await db.saves.count();

  // Estimate storage (rough calculation)
  let total = 0;
  await db.saves.each(save => {
    total += JSON.stringify(save).length;
  });

  return {
    saves,
    total: Math.round(total / 1024), // KB
  };
}

/**
 * Export all data for backup.
 */
export async function exportData(): Promise<{
  saves: SavedGame[];
  settings: AppSettings;
}> {
  const saves = await db.saves.toArray();
  const settings = await getSettings();

  return { saves, settings };
}

/**
 * Import data from backup.
 */
export async function importData(data: {
  saves?: SavedGame[];
  settings?: Partial<AppSettings>;
}): Promise<void> {
  if (data.saves && data.saves.length > 0) {
    await db.saves.bulkPut(data.saves);
  }

  if (data.settings) {
    await saveSettings(data.settings);
  }
}
