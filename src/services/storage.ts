// ---------------------------------------------------------------------------
// src/services/storage.ts — IndexedDB persistence via Dexie.js
// ---------------------------------------------------------------------------
// Save/Load game state to 3 slots + auto-save slot 0.
// ---------------------------------------------------------------------------

import Dexie, { type EntityTable } from 'dexie';
import type { GameState, PlayerClassName, DifficultyLevel } from '@engine/types';

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
}

/** Lightweight save slot info for the UI (no full game state). */
export interface SaveSlotInfo {
  readonly slot: number;
  readonly timestamp: number;
  readonly meta: SaveMeta;
}

// ---------------------------------------------------------------------------
// DATABASE
// ---------------------------------------------------------------------------

class VoidWalkerDB extends Dexie {
  saves!: EntityTable<SaveRecord, 'slot'>;

  constructor() {
    super('VoidWalkerDB');
    this.version(1).stores({
      saves: 'slot',
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

/** Load a save from a slot. Returns null if empty. */
export async function loadGame(slot: number): Promise<SaveRecord | null> {
  const record = await getDb().saves.get(slot);
  return record ?? null;
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
  }));
}

/** Check if a specific save slot exists. */
export async function hasSave(slot: number): Promise<boolean> {
  const count = await getDb().saves.where('slot').equals(slot).count();
  return count > 0;
}
