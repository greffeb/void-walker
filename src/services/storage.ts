// ---------------------------------------------------------------------------
// src/services/storage.ts — IndexedDB persistence via Dexie.js
// ---------------------------------------------------------------------------
// Save/Load game state to 3 slots + auto-save slot 0.
// ---------------------------------------------------------------------------

import Dexie, { type EntityTable } from 'dexie';
import type { GameState, PlayerClassName, DifficultyLevel } from '@engine/types';
import type { Locale } from '@i18n/types';
import type { NarrativePreset } from '@narration/types';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

/** Metadata displayed in save slot UI (no full state needed). */
export interface SaveMeta {
  readonly playerName: string;
  readonly className: PlayerClassName;
  readonly difficulty: DifficultyLevel;
  readonly turn: number;
  readonly locationName: string;
  readonly hp: number;
  readonly maxHp: number;
}

/** A single save record in IndexedDB. */
export interface SaveRecord {
  readonly slot: number;
  readonly gameState: GameState;
  readonly seed: number;
  readonly timestamp: number;
  readonly meta: SaveMeta;
  /** The run ended for good. Kept for the end screen and the black box, but
   *  never loadable again — that is what permadeath means (decision AE). */
  readonly finished?: boolean;
}

/** Lightweight save slot info for the UI (no full game state). */
export interface SaveSlotInfo {
  readonly slot: number;
  readonly timestamp: number;
  readonly meta: SaveMeta;
  readonly finished?: boolean;
}

/** Player-facing settings, persisted across runs. */
export interface AppSettings {
  readonly id: 'settings';
  readonly narrativePreset: NarrativePreset;
  readonly locale: Locale;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'settings',
  narrativePreset: 'standard',
  locale: 'fr',
};

// ---------------------------------------------------------------------------
// DATABASE
// ---------------------------------------------------------------------------

class VoidWalkerDB extends Dexie {
  saves!: EntityTable<SaveRecord, 'slot'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('VoidWalkerDB');
    this.version(1).stores({
      saves: 'slot',
    });
    this.version(2).stores({
      saves: 'slot',
      settings: 'id',
    });
  }
}

let db: VoidWalkerDB | null = null;

function getDb(): VoidWalkerDB {
  if (!db) {
    db = new VoidWalkerDB();
  }
  return db;
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/** Save game state to a slot (0 = auto-save, 1-2 = manual). */
export async function saveGame(record: SaveRecord): Promise<void> {
  await getDb().saves.put(record);
}

/** Load a save from a slot. Returns null if empty, or if the run is over. */
export async function loadGame(slot: number): Promise<SaveRecord | null> {
  const record = await getDb().saves.get(slot);
  if (!record) return null;
  // Decision AE: dying in nightmare used to be undone by reloading.
  return record.finished === true ? null : record;
}

/** Delete a save slot (used for permadeath). */
export async function deleteSave(slot: number): Promise<void> {
  await getDb().saves.delete(slot);
}

/** Get metadata for all occupied save slots. */
export async function listSaveSlots(): Promise<SaveSlotInfo[]> {
  const records = await getDb().saves.toArray();
  return records.map(r => ({
    slot: r.slot,
    timestamp: r.timestamp,
    meta: r.meta,
    finished: r.finished,
  }));
}

/** Check if a specific save slot exists. */
export async function hasSave(slot: number): Promise<boolean> {
  const count = await getDb().saves.where('slot').equals(slot).count();
  return count > 0;
}

// ---------------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------------

/** Player settings, with the defaults filled in. */
export async function getSettings(): Promise<AppSettings> {
  const stored = await getDb().settings.get('settings');
  return { ...DEFAULT_SETTINGS, ...stored, id: 'settings' };
}

/** Persist a change to the player settings. */
export async function saveSettings(patch: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
  const current = await getSettings();
  await getDb().settings.put({ ...current, ...patch, id: 'settings' });
}
