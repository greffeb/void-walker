// ---------------------------------------------------------------------------
// src/engine/blackbox.ts — Phase 6: Black Box Journal Generation
// ---------------------------------------------------------------------------
// Pure functions for generating death/victory journals from game history.
// Storage (IndexedDB max-20 FIFO) is handled by src/services/storage.ts.
// ---------------------------------------------------------------------------

import type { BlackBoxEntry, GameHistory, KeyEvent, DangerHint, LocaleString } from './scenario';

// ---------------------------------------------------------------------------
// ENTRY COUNTER — monotone, injectable for tests
// ---------------------------------------------------------------------------

let _entryCounter = 1;

/** Get the next journal entry number and advance the counter. */
export function nextEntryNumber(): number {
  return _entryCounter++;
}

/** Reset the counter (for testing only). */
export function resetEntryCounter(): void {
  _entryCounter = 1;
}

// ---------------------------------------------------------------------------
// KEY EVENT SELECTION
// ---------------------------------------------------------------------------

/**
 * Select the most dramatically impactful events from game history.
 * Priority order: death > combat > choice > discovery > escape.
 */
export function selectKeyEvents(
  history: GameHistory,
  maxCount: number,
): readonly KeyEvent[] {
  if (history.keyEvents.length <= maxCount) return history.keyEvents;

  const PRIORITY: Record<KeyEvent['type'], number> = {
    death: 5,
    combat: 4,
    choice: 3,
    discovery: 2,
    escape: 1,
  };

  return [...history.keyEvents]
    .sort((a, b) => PRIORITY[b.type] - PRIORITY[a.type])
    .slice(0, maxCount);
}

// ---------------------------------------------------------------------------
// DANGER HINTS
// ---------------------------------------------------------------------------

/**
 * Generate context-aware danger hints from game history.
 * Always returns at least 1 hint (generic fallback).
 */
export function generateDangerHints(history: GameHistory): readonly DangerHint[] {
  const hints: DangerHint[] = [];

  for (const event of history.keyEvents) {
    if (event.type === 'combat') {
      hints.push({
        description: {
          fr: 'Restez prudent en combat — chaque échange peut être fatal.',
          en: '',
        },
      });
      break; // One combat hint is enough
    }
  }

  if (history.causeOfDeath) {
    hints.push({
      description: { fr: `Évitez ce qui a tué avant vous.`, en: '' },
    });
  }

  if (hints.length === 0) {
    hints.push({
      description: { fr: 'Méfiez-vous de tout dans ces couloirs.', en: '' },
    });
  }

  return hints;
}

// ---------------------------------------------------------------------------
// JOURNAL GENERATION
// ---------------------------------------------------------------------------

/**
 * Generate a unique Black Box journal entry ID.
 * Format: bb_{counter}_{skeletonId}_{themeId}
 */
export function generateEntryId(
  entryNum: number,
  skeletonId: string,
  themeId: string,
): string {
  return `bb_${entryNum}_${skeletonId}_${themeId}`;
}

/**
 * Build the journal LocaleString for a death outcome.
 * Follows the template from §7.3 of PHASE_6_SCENARIOS_VICTORY.md.
 */
export function buildDeathJournal(
  history: GameHistory,
  entryNum: number,
  keyEvents: readonly KeyEvent[],
  hints: readonly DangerHint[],
): LocaleString {
  const eventSummary = keyEvents.map(e => e.description.fr).filter(Boolean).join('. ');
  const causeClause = history.causeOfDeath ? `${history.causeOfDeath}. ` : '';
  const hintClause = hints[0]?.description.fr ?? 'tout';

  return {
    fr:
      `Entrée #${entryNum} — ${history.className} ${history.playerName}. ` +
      `Arrivé dans ${history.themeName}, j'ai survécu ${history.turnsPlayed} cycles. ` +
      (eventSummary ? `${eventSummary}. ` : '') +
      causeClause +
      `Méfiez-vous de ${hintClause}.`,
    en: '',
  };
}

/**
 * Build the journal LocaleString for a victory outcome.
 */
export function buildVictoryJournal(
  history: GameHistory,
  entryNum: number,
  keyEvents: readonly KeyEvent[],
  hints: readonly DangerHint[],
): LocaleString {
  const eventSummary = keyEvents.map(e => e.description.fr).filter(Boolean).join('. ');
  const victoryVerb = history.victoryVerb ?? 'survivre';
  const hintClause = hints[0]?.description.fr ?? 'restez en vie';

  return {
    fr:
      `Entrée #${entryNum} — ${history.className} ${history.playerName}. ` +
      `J'ai réussi à ${victoryVerb} après ${history.turnsPlayed} cycles. ` +
      (eventSummary ? `${eventSummary}. ` : '') +
      `Conseil : ${hintClause}.`,
    en: '',
  };
}

/**
 * Generate a complete BlackBoxEntry from game history and outcome.
 *
 * Uses up to 3 key events, generates contextual danger hints, and produces
 * a French journal entry following the template in the phase doc.
 */
export function generateBlackBoxJournal(
  history: GameHistory,
  outcome: 'victory' | 'death',
  entryNum?: number,
): BlackBoxEntry {
  const num = entryNum ?? nextEntryNumber();
  const keyEvents = selectKeyEvents(history, 3);
  const hints = generateDangerHints(history);

  const journalEntry: LocaleString =
    outcome === 'death'
      ? buildDeathJournal(history, num, keyEvents, hints)
      : buildVictoryJournal(history, num, keyEvents, hints);

  return {
    id: generateEntryId(num, history.skeletonId, history.themeId),
    timestamp: Date.now(),
    playerName: history.playerName,
    classId: history.classId,
    skeletonId: history.skeletonId,
    themeId: history.themeId,
    difficulty: history.difficulty,
    outcome,
    turnsPlayed: history.turnsPlayed,
    causeOfDeath: outcome === 'death' ? history.causeOfDeath : undefined,
    journalEntry,
    keyEvents,
    hints,
  };
}

// ---------------------------------------------------------------------------
// PLACEMENT LOGIC (pure — service layer handles IndexedDB)
// ---------------------------------------------------------------------------

/** Black Box placement configuration (used by assembly + storage layers). */
export const BLACK_BOX_PLACEMENT_CONFIG = {
  /** Match by theme, not skeleton — enables cross-skeleton lore */
  matchBy: 'theme' as const,
  /** Prefer different skeleton for more interesting cross-lore */
  preferDifferentSkeleton: true,
  /** 80% chance to place a death journal */
  deathPlacementChance: 0.80,
  /** 30% chance to place a victory journal */
  victoryPlacementChance: 0.30,
  /** Only place in early rising segments (discovery hook) */
  placementSegments: ['start-unlock', 'unlock-reveal'] as const,
  /** Never on critical path — always a side room */
  placementType: 'side_room' as const,
  /** Maximum journal entries stored in IndexedDB */
  maxEntries: 20,
} as const;

/**
 * Determine whether a Black Box should be placed in the current game,
 * given the available previous entry for this setting.
 */
export function shouldPlaceBlackBox(
  previousEntry: BlackBoxEntry | null,
  currentSkeletonId: string,
  rng: { float(): number },
): boolean {
  if (previousEntry === null) return false;

  const chance = previousEntry.outcome === 'death'
    ? BLACK_BOX_PLACEMENT_CONFIG.deathPlacementChance
    : BLACK_BOX_PLACEMENT_CONFIG.victoryPlacementChance;

  // Prefer cross-skeleton lore (slightly higher chance if different skeleton)
  const bonus = previousEntry.skeletonId !== currentSkeletonId ? 0.05 : 0;

  return rng.float() < chance + bonus;
}
