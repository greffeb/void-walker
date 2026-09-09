// ---------------------------------------------------------------------------
// tests/integration/winByPlaying.test.ts — A game won without cheating
// ---------------------------------------------------------------------------
// Every other completion test reached victory by writing the winning state:
// `scenarioCompletion` teleports the player to the resolution node and injects
// the gate item, `emergentVictory` arms the trap through the world but starts
// next to it. None of them proves the game can be finished by typing.
//
// This one types. No state is written, no item is granted, no location is set:
// it forces the locker, takes the badge, walks the graph and reaches the pod.
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { initGame, isGameOver } from '../../src/engine/game';
import { getSceneContext } from '../../src/engine/scene';
import { processTurn } from '../../src/engine/processTurn';
import { assembleScenario } from '../../src/engine/pacing';
import { buildParserLocaleData } from '../../src/content/parserData';
import { ESCAPE_SKELETON } from '../../src/content/scenarios/escape';
import { ALL_MODULES } from '../../src/content/scenarios/modules/index';
import { createSeededRng } from '../../src/engine/rng';
import type { GameState, RngFn } from '../../src/engine/types';

const parserData = buildParserLocaleData('fr');

interface Session {
  state: GameState;
  readonly rng: RngFn;
  readonly transcript: string[];
}

function play(session: Session, input: string): void {
  const context = getSceneContext(session.state);
  const result = processTurn(session.state, input, context, parserData, session.rng);
  session.state = result.newState;
  session.transcript.push(
    `${input} -> [${session.state.playerLocationId ?? '?'}] ${result.trace.parsedVerb ?? '?'}/${result.trace.outcome ?? '-'}`,
  );
}

/** Repeat an action until a condition holds, the way a player retries. */
function playUntil(
  session: Session,
  input: string,
  done: (s: GameState) => boolean,
  maxTries: number,
): void {
  for (let i = 0; i < maxTries && !done(session.state) && !isGameOver(session.state); i++) {
    play(session, input);
  }
}

function startSession(seed: number): Session {
  const rng = createSeededRng(seed);
  const scenario = assembleScenario(ESCAPE_SKELETON, 'quick', ALL_MODULES, rng);
  return {
    state: initGame(scenario, 'marine', 'survivor', 'Kael', rng, { FOR: 1, INT: 1 }),
    rng,
    transcript: [],
  };
}

/**
 * The route a player takes. The badge unlocks; it does not open — the content
 * says so ("Vous poussez — elle s'ouvre"), so each door takes two acts.
 */
function playTheEscape(session: Session): void {
  playUntil(
    session,
    'forcer le casier',
    s => s.featureStates['emergency_locker']?.openness === 'open',
    10,
  );
  play(session, 'prendre le badge');

  play(session, 'aller unlock');
  play(session, 'utiliser le badge sur le panneau de securite');
  playUntil(
    session,
    'ouvrir la cloison blindee',
    s => s.playerLocationId !== 'unlock',
    4,
  );
  play(session, 'aller reveal');
  play(session, 'aller escalation');
  play(session, 'aller boss');
  play(session, 'utiliser le badge sur le sas de la capsule');
  playUntil(
    session,
    'ouvrir le sas de la capsule',
    s => s.featureStates['escape_pod_hatch']?.openness === 'open',
    6,
  );
  play(session, 'aller resolution');
}

describe('a game won by playing it', () => {
  it('reaches the escape pod without a single state injection', () => {
    const session = startSession(7);
    playTheEscape(session);

    expect(session.state.victoryResult, session.transcript.join('\n')).not.toBeNull();
    expect(session.state.phase).toBe('victory');
    expect(session.state.victoryResult?.type).toBe('primary');
  });

  it('the badge was earned, not granted', () => {
    const session = startSession(7);
    const startingInventory = [...(session.state.character?.inventory ?? [])];
    expect(startingInventory).not.toContain('access_keycard');

    playTheEscape(session);

    expect(session.state.character?.inventory).toContain('access_keycard');
    // The badge only exists once the locker has been forced.
    expect(session.state.featureStates['emergency_locker']?.openness).toBe('open');
  });

  it('the player walked every node of the route', () => {
    const session = startSession(7);
    playTheEscape(session);

    for (const node of ['start', 'unlock', 'reveal', 'escalation', 'boss', 'resolution']) {
      expect(Object.keys(session.state.visitedLocations)).toContain(node);
    }
  });

  it('the same route wins on other seeds', () => {
    // A win that only works on one seed is a coincidence, not a path.
    const wins = [3, 7, 11, 19, 23].filter(seed => {
      const session = startSession(seed);
      playTheEscape(session);
      return session.state.victoryResult !== null;
    });
    expect(wins.length).toBeGreaterThanOrEqual(4);
  });
});
