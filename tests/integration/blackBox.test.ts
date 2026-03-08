// ---------------------------------------------------------------------------
// tests/integration/blackBox.test.ts — Phase 6B integration test
// ---------------------------------------------------------------------------
// Verifies the Black Box round-trip: game → journal generation → placement
// Pure engine test — no IndexedDB. Storage is handled by src/services/.
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateBlackBoxJournal, shouldPlaceBlackBox,
  resetEntryCounter,
} from '../../src/engine/blackbox';
import type { GameHistory, BlackBoxEntry } from '../../src/engine/scenario';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function makeHistory(overrides: Partial<GameHistory> = {}): GameHistory {
  return {
    playerName: 'Soldat Perdu',
    className: 'Marine',
    classId: 'marine',
    skeletonId: 'escape',
    themeId: 'derelict_ship',
    themeName: 'l\'Épave',
    difficulty: 'survivor',
    turnsPlayed: 18,
    keyEvents: [
      {
        turn: 3,
        description: { fr: 'J\'ai trouvé le carnet de bord du capitaine.', en: '' },
        type: 'discovery',
      },
      {
        turn: 12,
        description: { fr: 'Un combat brutal dans la soute.', en: '' },
        type: 'combat',
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Journal generation (death)
// ---------------------------------------------------------------------------

describe('BlackBox: death journal generation', () => {
  beforeEach(() => resetEntryCounter());

  it('generates a valid BlackBoxEntry for a death outcome', () => {
    const history = makeHistory({ causeOfDeath: 'Asphyxiation dans le couloir dépressurisé.' });
    const entry = generateBlackBoxJournal(history, 'death');

    expect(entry.id).toBeTruthy();
    expect(entry.playerName).toBe('Soldat Perdu');
    expect(entry.classId).toBe('marine');
    expect(entry.skeletonId).toBe('escape');
    expect(entry.themeId).toBe('derelict_ship');
    expect(entry.outcome).toBe('death');
    expect(entry.turnsPlayed).toBe(18);
    expect(entry.causeOfDeath).toBe('Asphyxiation dans le couloir dépressurisé.');
  });

  it('journal entry contains player name and class', () => {
    const entry = generateBlackBoxJournal(makeHistory({ causeOfDeath: 'Mort au combat.' }), 'death');
    expect(entry.journalEntry.fr).toContain('Soldat Perdu');
    expect(entry.journalEntry.fr).toContain('Marine');
  });

  it('journal includes turn count', () => {
    const entry = generateBlackBoxJournal(makeHistory({ turnsPlayed: 23 }), 'death');
    expect(entry.journalEntry.fr).toContain('23');
  });

  it('journal includes danger hints', () => {
    const entry = generateBlackBoxJournal(makeHistory(), 'death');
    expect(entry.hints.length).toBeGreaterThan(0);
    expect(entry.hints[0]!.description.fr).toBeTruthy();
  });

  it('selects at most 3 key events', () => {
    const history = makeHistory({
      keyEvents: Array.from({ length: 10 }, (_, i) => ({
        turn: i,
        description: { fr: `Event ${i}`, en: '' },
        type: 'discovery' as const,
      })),
    });
    const entry = generateBlackBoxJournal(history, 'death');
    expect(entry.keyEvents.length).toBeLessThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Journal generation (victory)
// ---------------------------------------------------------------------------

describe('BlackBox: victory journal generation', () => {
  beforeEach(() => resetEntryCounter());

  it('generates a valid BlackBoxEntry for a victory outcome', () => {
    const history = makeHistory({ victoryVerb: 'échapper', causeOfDeath: undefined });
    const entry = generateBlackBoxJournal(history, 'victory');

    expect(entry.outcome).toBe('victory');
    expect(entry.causeOfDeath).toBeUndefined();
    expect(entry.journalEntry.fr).toContain('échapper');
  });

  it('victory journal does not contain a cause of death', () => {
    const entry = generateBlackBoxJournal(makeHistory(), 'victory');
    expect(entry.causeOfDeath).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Placement logic
// ---------------------------------------------------------------------------

describe('BlackBox: placement logic', () => {
  const mockEntry: BlackBoxEntry = {
    id: 'bb_1_escape_derelict_ship',
    timestamp: Date.now(),
    playerName: 'Ancien Soldat',
    classId: 'marine',
    skeletonId: 'escape',
    themeId: 'derelict_ship',
    difficulty: 'survivor',
    outcome: 'death',
    turnsPlayed: 15,
    journalEntry: { fr: 'Je suis mort ici.', en: '' },
    keyEvents: [],
    hints: [],
  };

  it('should not place when no previous entry exists', () => {
    const rng = { float: () => 0.01 }; // very low roll
    expect(shouldPlaceBlackBox(null, 'escape', rng)).toBe(false);
  });

  it('should place death entry at 80% base chance', () => {
    // With float() returning 0.5 (< 0.80), should place
    const rng = { float: () => 0.5 };
    expect(shouldPlaceBlackBox(mockEntry, 'investigate', rng)).toBe(true);
  });

  it('should NOT place death entry when roll is too high (≥ 0.85)', () => {
    const rng = { float: () => 0.90 };
    // 0.90 > 0.85 (0.80 + 0.05 cross-skeleton bonus), should not place
    expect(shouldPlaceBlackBox(mockEntry, 'investigate', rng)).toBe(false);
  });

  it('cross-skeleton bonus applies (+0.05) when skeleton differs', () => {
    // Death chance = 0.80, cross-skeleton bonus = 0.05 → total = 0.85
    // Roll of 0.84 should place (cross-skeleton)
    const rng1 = { float: () => 0.84 };
    expect(shouldPlaceBlackBox(mockEntry, 'investigate', rng1)).toBe(true);

    // Roll of 0.84 should NOT place (same skeleton, threshold only 0.80)
    const rng2 = { float: () => 0.84 };
    expect(shouldPlaceBlackBox(mockEntry, 'escape', rng2)).toBe(false);
  });

  it('victory entries have lower placement chance (30%)', () => {
    const victoryEntry: BlackBoxEntry = { ...mockEntry, outcome: 'victory' };

    // Roll of 0.20 should place (0.20 < 0.30)
    expect(shouldPlaceBlackBox(victoryEntry, 'investigate', { float: () => 0.20 })).toBe(true);

    // Roll of 0.40 should NOT place (0.40 > 0.35)
    expect(shouldPlaceBlackBox(victoryEntry, 'investigate', { float: () => 0.40 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: game → journal → placement
// ---------------------------------------------------------------------------

describe('BlackBox: full round-trip', () => {
  beforeEach(() => resetEntryCounter());

  it('entry ID encodes skeleton and theme', () => {
    const history = makeHistory();
    const entry = generateBlackBoxJournal(history, 'death');
    expect(entry.id).toContain('escape');
    expect(entry.id).toContain('derelict_ship');
  });

  it('two entries from consecutive deaths have different IDs (sequential counter)', () => {
    const h = makeHistory();
    const e1 = generateBlackBoxJournal(h, 'death');
    const e2 = generateBlackBoxJournal(h, 'death');
    expect(e1.id).not.toBe(e2.id);
  });
});
