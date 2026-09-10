// ---------------------------------------------------------------------------
// tests/integration/winBySuggestions.test.ts — Is the game readable?
// ---------------------------------------------------------------------------
// `winByPlaying` proves a route exists. It does not prove the game ever *names*
// that route: the sequence there was written by someone who had read the
// content. This one types nothing of its own — every input comes from the
// suggestions the scene itself offers. If it cannot win, then neither can a
// first-time player, and the 0/250 of the random bot is a property of the game
// rather than of the bot.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, isGameOver } from '../../src/engine/game';
import { getSceneContext, formatSuggestionAsInput } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { ESCAPE_SKELETON } from '../../src/content/scenarios/escape';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { createSeededRng } from '../../src/engine/rng';
import type { GameState } from '../../src/engine/types';

const parserData = buildParserLocaleData('fr');

const MAX_TURNS = 120;
const SEEDS = [3, 7, 11, 19, 23, 31, 37, 41] as const;

/** Reading order: the eye starts at the top and rarely reaches the bottom. */
function readingOrderPick(count: number, roll: number): number {
  if (count <= 1) return 0;
  if (roll < 0.5) return 0;
  if (roll < 0.8 || count === 2) return 1;
  return Math.min(2, count - 1);
}

interface Reading {
  readonly won: boolean;
  readonly turns: number;
  readonly seed: number;
  readonly endedBy: 'victory' | 'game over' | 'no suggestion' | 'turn limit';
  readonly hp: number;
  readonly location: string;
  /** Every distinct line the game offered, across the whole run. */
  readonly offered: ReadonlySet<string>;
  readonly transcript: readonly string[];
}

/**
 * Plays a whole game reading only what the screen proposes.
 *
 * The pick is weighted toward the top of the list, because that is how a list
 * gets read; it is not always-first, which would measure the ranking alone.
 * Either way the test can only ever type a line the game itself offered.
 */
function playByReadingTheScreen(seed: number): Reading {
  const rng = createSeededRng(seed);
  const scenario = assembleScenario(ESCAPE_SKELETON, 'quick', ALL_MODULES, rng);
  let state: GameState = initGame(scenario, 'marine', 'survivor', 'Kael', rng, { FOR: 1, INT: 1 });

  const offered = new Set<string>();
  const transcript: string[] = [];
  let turns = 0;
  let endedBy: Reading['endedBy'] = 'turn limit';

  while (turns < MAX_TURNS) {
    if (isGameOver(state)) { endedBy = 'game over'; break; }
    const context = getSceneContext(state);
    const lines = (context.scenarioSuggestions ?? []).map(formatSuggestionAsInput);
    for (const line of lines) offered.add(line);
    if (lines.length === 0) { endedBy = 'no suggestion'; break; }

    const input = lines[readingOrderPick(lines.length, rng())]!;
    const result = processTurn(state, input, context, parserData, rng);
    state = result.newState;
    transcript.push(`${input} -> [${state.playerLocationId ?? '?'}] ${result.trace.outcome ?? '-'}`);
    turns++;
  }

  const won = state.victoryResult !== null;
  if (won) endedBy = 'victory';
  return {
    won, turns, seed, endedBy,
    hp: state.character?.hp ?? 0,
    location: state.playerLocationId ?? '?',
    offered, transcript,
  };
}

describe('a game won by reading the screen', () => {
  it('names a way into the container holding the gate item', () => {
    // The badge is sealed in the emergency locker. If no suggestion ever says
    // how to open it, the only route to victory is one the player must guess.
    const readings = SEEDS.map(playByReadingTheScreen);
    const namesTheLocker = readings.some(r =>
      [...r.offered].some(line => /casier/i.test(line) && !/^examiner/i.test(line)),
    );

    expect(
      namesTheLocker,
      `Aucune suggestion ne propose d'ouvrir le casier. Lignes offertes :\n`
        + [...new Set(readings.flatMap(r => [...r.offered]))].join('\n'),
    ).toBe(true);
  });

  it('can be won without typing anything the game did not offer', () => {
    const readings = SEEDS.map(playByReadingTheScreen);
    const wins = readings.filter(r => r.won);
    const summary = readings
      .map(r => `  graine ${r.seed}: ${r.endedBy} en ${r.turns} tours, ${r.hp} PV, a [${r.location}]`)
      .join('\n');

    // Measured 1/8 (seed 11, 26 turns, 7 HP left); three more reach the boss
    // node and die there. Ratchet: raise this as the game improves, never lower
    // it. Before the suggestions named a way into the locker it was 0/8, and
    // the word "forcer" appeared nowhere in a single one of the eight games.
    expect(
      wins.length,
      `Victoires insuffisantes en ne tapant que les suggestions.\n${summary}\n`
        + `Derniere partie :\n${readings[readings.length - 1]!.transcript.join('\n')}`,
    ).toBeGreaterThanOrEqual(1);
  });
});
