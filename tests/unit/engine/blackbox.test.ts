// ---------------------------------------------------------------------------
// tests/unit/engine/blackbox.test.ts — Black Box journal generation tests
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import {
  nextEntryNumber,
  resetEntryCounter,
  selectKeyEvents,
  generateDangerHints,
  generateEntryId,
  buildDeathJournal,
  buildVictoryJournal,
  generateBlackBoxJournal,
  shouldPlaceBlackBox,
  BLACK_BOX_PLACEMENT_CONFIG,
} from '../../../src/engine/blackbox';
import type { GameHistory, KeyEvent, BlackBoxEntry } from '../../../src/engine/scenario';

// ---------------------------------------------------------------------------
// TEST HELPERS
// ---------------------------------------------------------------------------

function makeHistory(overrides: Partial<GameHistory> = {}): GameHistory {
  return {
    playerName: 'Vasquez',
    className: 'Marine',
    classId: 'marine',
    skeletonId: 'escape_the_derelict',
    themeId: 'derelict_ship',
    themeName: 'le Vaisseau Dérelict',
    difficulty: 'survivor',
    turnsPlayed: 12,
    keyEvents: [],
    ...overrides,
  };
}

function makeKeyEvent(
  type: KeyEvent['type'],
  turn: number,
  fr: string,
): KeyEvent {
  return { type, turn, description: { fr, en: '' } };
}

function makeBlackBoxEntry(overrides: Partial<BlackBoxEntry> = {}): BlackBoxEntry {
  return {
    id: 'bb_1_escape_the_derelict_derelict_ship',
    timestamp: Date.now(),
    playerName: 'Vasquez',
    classId: 'marine',
    skeletonId: 'escape_the_derelict',
    themeId: 'derelict_ship',
    difficulty: 'survivor',
    outcome: 'death',
    turnsPlayed: 12,
    journalEntry: { fr: 'Entrée #1', en: '' },
    keyEvents: [],
    hints: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Entry counter
// ---------------------------------------------------------------------------

describe('entry counter', () => {
  beforeEach(() => resetEntryCounter());

  it('starts at 1', () => {
    expect(nextEntryNumber()).toBe(1);
  });

  it('increments monotonically', () => {
    expect(nextEntryNumber()).toBe(1);
    expect(nextEntryNumber()).toBe(2);
    expect(nextEntryNumber()).toBe(3);
  });

  it('resets to 1 after resetEntryCounter', () => {
    nextEntryNumber();
    nextEntryNumber();
    resetEntryCounter();
    expect(nextEntryNumber()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// selectKeyEvents
// ---------------------------------------------------------------------------

describe('selectKeyEvents', () => {
  it('returns all events when count <= maxCount', () => {
    const history = makeHistory({
      keyEvents: [
        makeKeyEvent('discovery', 1, 'Discovered something'),
        makeKeyEvent('combat', 2, 'Combat occurred'),
      ],
    });
    expect(selectKeyEvents(history, 5)).toHaveLength(2);
  });

  it('returns exactly maxCount events when more available', () => {
    const history = makeHistory({
      keyEvents: [
        makeKeyEvent('discovery', 1, 'Found a tool'),
        makeKeyEvent('combat', 2, 'Fought an enemy'),
        makeKeyEvent('choice', 3, 'Made a decision'),
        makeKeyEvent('escape', 4, 'Escaped a danger'),
        makeKeyEvent('death', 5, 'Saw death'),
      ],
    });
    expect(selectKeyEvents(history, 3)).toHaveLength(3);
  });

  it('prioritizes death > combat > choice > discovery > escape', () => {
    const history = makeHistory({
      keyEvents: [
        makeKeyEvent('escape', 1, 'escape'),
        makeKeyEvent('discovery', 2, 'discovery'),
        makeKeyEvent('choice', 3, 'choice'),
        makeKeyEvent('combat', 4, 'combat'),
        makeKeyEvent('death', 5, 'death'),
      ],
    });
    const selected = selectKeyEvents(history, 3);
    const types = selected.map(e => e.type);
    expect(types).toContain('death');
    expect(types).toContain('combat');
    expect(types).toContain('choice');
    expect(types).not.toContain('escape');
    expect(types).not.toContain('discovery');
  });

  it('returns empty array for empty history', () => {
    expect(selectKeyEvents(makeHistory(), 3)).toHaveLength(0);
  });

  it('returns full list if count equals maxCount exactly', () => {
    const history = makeHistory({
      keyEvents: [
        makeKeyEvent('combat', 1, 'c1'),
        makeKeyEvent('combat', 2, 'c2'),
        makeKeyEvent('combat', 3, 'c3'),
      ],
    });
    expect(selectKeyEvents(history, 3)).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// generateDangerHints
// ---------------------------------------------------------------------------

describe('generateDangerHints', () => {
  it('returns at least 1 hint even for empty history', () => {
    const hints = generateDangerHints(makeHistory());
    expect(hints.length).toBeGreaterThanOrEqual(1);
  });

  it('all hints have fr text', () => {
    const hints = generateDangerHints(makeHistory({
      keyEvents: [makeKeyEvent('combat', 1, 'Fought the creature')],
      causeOfDeath: 'Claw wound',
    }));
    for (const h of hints) {
      expect(h.description.fr).toBeTruthy();
    }
  });

  it('includes combat hint when combat event present', () => {
    const hints = generateDangerHints(makeHistory({
      keyEvents: [makeKeyEvent('combat', 1, 'Combat event')],
    }));
    const hasCombatHint = hints.some(h => h.description.fr.includes('combat'));
    expect(hasCombatHint).toBe(true);
  });

  it('includes cause-of-death hint when causeOfDeath present', () => {
    const hints = generateDangerHints(makeHistory({
      causeOfDeath: 'Suffocated',
      keyEvents: [],
    }));
    const hasDeathHint = hints.some(h => h.description.fr.includes('Évitez'));
    expect(hasDeathHint).toBe(true);
  });

  it('returns generic fallback hint when no events and no cause', () => {
    const hints = generateDangerHints(makeHistory({ keyEvents: [], causeOfDeath: undefined }));
    expect(hints).toHaveLength(1);
    expect(hints[0].description.fr).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// generateEntryId
// ---------------------------------------------------------------------------

describe('generateEntryId', () => {
  it('generates a bb_ prefixed ID', () => {
    expect(generateEntryId(1, 'escape_the_derelict', 'derelict_ship')).toMatch(/^bb_/);
  });

  it('includes entry number, skeletonId, and themeId', () => {
    const id = generateEntryId(42, 'my_skeleton', 'my_setting');
    expect(id).toBe('bb_42_my_skeleton_my_setting');
  });

  it('different entry numbers produce different IDs', () => {
    const id1 = generateEntryId(1, 'skel', 'set');
    const id2 = generateEntryId(2, 'skel', 'set');
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// buildDeathJournal
// ---------------------------------------------------------------------------

describe('buildDeathJournal', () => {
  it('returns a LocaleString with fr text', () => {
    const journal = buildDeathJournal(
      makeHistory(),
      1,
      [],
      [{ description: { fr: 'Méfiez-vous des créatures.', en: '' } }],
    );
    expect(journal.fr).toBeTruthy();
  });

  it('includes the player name and class', () => {
    const history = makeHistory({ playerName: 'Ripley', className: 'Ingénieur' });
    const journal = buildDeathJournal(history, 1, [], [{ description: { fr: 'conseil', en: '' } }]);
    expect(journal.fr).toContain('Ripley');
    expect(journal.fr).toContain('Ingénieur');
  });

  it('includes entry number', () => {
    const journal = buildDeathJournal(
      makeHistory(),
      7,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('#7');
  });

  it('includes turns played', () => {
    const journal = buildDeathJournal(
      makeHistory({ turnsPlayed: 23 }),
      1,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('23');
  });

  it('includes key event descriptions', () => {
    const events = [makeKeyEvent('combat', 1, 'J\'ai combattu une horreur')];
    const journal = buildDeathJournal(
      makeHistory(),
      1,
      events,
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('combattu');
  });

  it('includes cause of death when present', () => {
    const history = makeHistory({ causeOfDeath: 'Décompression brutale' });
    const journal = buildDeathJournal(
      history,
      1,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('Décompression brutale');
  });
});

// ---------------------------------------------------------------------------
// buildVictoryJournal
// ---------------------------------------------------------------------------

describe('buildVictoryJournal', () => {
  it('returns a LocaleString with fr text', () => {
    const journal = buildVictoryJournal(
      makeHistory(),
      1,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toBeTruthy();
  });

  it('includes player name, class, and entry number', () => {
    const journal = buildVictoryJournal(
      makeHistory({ playerName: 'Hicks', className: 'Marine' }),
      5,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('Hicks');
    expect(journal.fr).toContain('Marine');
    expect(journal.fr).toContain('#5');
  });

  it('includes victoryVerb when present', () => {
    const journal = buildVictoryJournal(
      makeHistory({ victoryVerb: 's\'échapper' }),
      1,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('s\'échapper');
  });

  it('falls back to "survivre" when no victoryVerb', () => {
    const journal = buildVictoryJournal(
      makeHistory({ victoryVerb: undefined }),
      1,
      [],
      [{ description: { fr: 'conseil', en: '' } }],
    );
    expect(journal.fr).toContain('survivre');
  });
});

// ---------------------------------------------------------------------------
// generateBlackBoxJournal — integration
// ---------------------------------------------------------------------------

describe('generateBlackBoxJournal', () => {
  beforeEach(() => resetEntryCounter());

  it('returns a BlackBoxEntry with correct shape', () => {
    const entry = generateBlackBoxJournal(makeHistory(), 'death', 1);
    expect(entry.id).toBeTruthy();
    expect(entry.playerName).toBe('Vasquez');
    expect(entry.outcome).toBe('death');
    expect(typeof entry.turnsPlayed).toBe('number');
    expect(Array.isArray(entry.keyEvents)).toBe(true);
    expect(Array.isArray(entry.hints)).toBe(true);
    expect(entry.journalEntry.fr).toBeTruthy();
  });

  it('outcome death sets causeOfDeath', () => {
    const history = makeHistory({ causeOfDeath: 'Xenomorph' });
    const entry = generateBlackBoxJournal(history, 'death', 1);
    expect(entry.causeOfDeath).toBe('Xenomorph');
  });

  it('outcome victory has undefined causeOfDeath', () => {
    const history = makeHistory({ causeOfDeath: 'ignored' });
    const entry = generateBlackBoxJournal(history, 'victory', 1);
    expect(entry.causeOfDeath).toBeUndefined();
  });

  it('uses auto-incremented entry number when not provided', () => {
    const e1 = generateBlackBoxJournal(makeHistory(), 'death');
    const e2 = generateBlackBoxJournal(makeHistory(), 'death');
    expect(e1.id).not.toBe(e2.id);
  });

  it('respects explicit entryNum', () => {
    const entry = generateBlackBoxJournal(makeHistory(), 'death', 99);
    expect(entry.id).toContain('99');
    expect(entry.journalEntry.fr).toContain('#99');
  });

  it('limits keyEvents to max 3', () => {
    const history = makeHistory({
      keyEvents: Array.from({ length: 10 }, (_, i) =>
        makeKeyEvent('discovery', i, `event ${i}`),
      ),
    });
    const entry = generateBlackBoxJournal(history, 'death', 1);
    expect(entry.keyEvents.length).toBeLessThanOrEqual(3);
  });

  it('journal fr text differs for death vs victory', () => {
    const deathEntry = generateBlackBoxJournal(makeHistory(), 'death', 1);
    const victoryEntry = generateBlackBoxJournal(makeHistory(), 'victory', 2);
    expect(deathEntry.journalEntry.fr).not.toBe(victoryEntry.journalEntry.fr);
  });
});

// ---------------------------------------------------------------------------
// BLACK_BOX_PLACEMENT_CONFIG
// ---------------------------------------------------------------------------

describe('BLACK_BOX_PLACEMENT_CONFIG', () => {
  it('deathPlacementChance is 0.80', () => {
    expect(BLACK_BOX_PLACEMENT_CONFIG.deathPlacementChance).toBe(0.80);
  });

  it('victoryPlacementChance is 0.30', () => {
    expect(BLACK_BOX_PLACEMENT_CONFIG.victoryPlacementChance).toBe(0.30);
  });

  it('maxEntries is 20', () => {
    expect(BLACK_BOX_PLACEMENT_CONFIG.maxEntries).toBe(20);
  });

  it('matchBy is "theme"', () => {
    expect(BLACK_BOX_PLACEMENT_CONFIG.matchBy).toBe('theme');
  });

  it('placementSegments includes start-unlock and unlock-reveal', () => {
    expect(BLACK_BOX_PLACEMENT_CONFIG.placementSegments).toContain('start-unlock');
    expect(BLACK_BOX_PLACEMENT_CONFIG.placementSegments).toContain('unlock-reveal');
  });
});

// ---------------------------------------------------------------------------
// shouldPlaceBlackBox
// ---------------------------------------------------------------------------

describe('shouldPlaceBlackBox', () => {
  it('returns false when previousEntry is null', () => {
    expect(shouldPlaceBlackBox(null, 'any_skeleton', { float: () => 0 })).toBe(false);
  });

  it('places a death entry with rng below threshold (0.80)', () => {
    const entry = makeBlackBoxEntry({ outcome: 'death' });
    expect(shouldPlaceBlackBox(entry, 'other_skeleton', { float: () => 0.79 })).toBe(true);
  });

  it('does NOT place a death entry when rng at or above threshold', () => {
    const entry = makeBlackBoxEntry({ outcome: 'death' });
    // threshold = 0.80, bonus = 0.05 (different skeleton) → total 0.85
    // rng = 0.86 → should NOT place
    expect(shouldPlaceBlackBox(entry, 'other_skeleton', { float: () => 0.86 })).toBe(false);
  });

  it('places a victory entry with rng below threshold (0.30)', () => {
    const entry = makeBlackBoxEntry({ outcome: 'victory' });
    expect(shouldPlaceBlackBox(entry, 'other_skeleton', { float: () => 0.29 })).toBe(true);
  });

  it('does NOT place a victory entry when rng above threshold', () => {
    const entry = makeBlackBoxEntry({ outcome: 'victory' });
    // threshold = 0.30, bonus = 0.05 → total 0.35; rng = 0.36 → no
    expect(shouldPlaceBlackBox(entry, 'other_skeleton', { float: () => 0.36 })).toBe(false);
  });

  it('cross-skeleton placement has a +0.05 bonus', () => {
    const entry = makeBlackBoxEntry({ outcome: 'death', skeletonId: 'skeleton_a' });
    // death threshold = 0.80; same skeleton → 0.80; rng = 0.81 → no
    expect(shouldPlaceBlackBox(entry, 'skeleton_a', { float: () => 0.81 })).toBe(false);
    // different skeleton → threshold + 0.05 = 0.85; rng = 0.81 → yes
    expect(shouldPlaceBlackBox(entry, 'skeleton_b', { float: () => 0.81 })).toBe(true);
  });
});
