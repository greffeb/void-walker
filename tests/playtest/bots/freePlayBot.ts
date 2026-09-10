// ---------------------------------------------------------------------------
// tests/playtest/bots/freePlayBot.ts — the player nobody prompted
// ---------------------------------------------------------------------------
// Every other bot here is spoon-fed. The goal bot reads `obstacleSuggestions`,
// so its victory rate measures how well the scene ranks its three lines — not
// whether the game can be played. The random bot draws from a four-verb list
// and fuzz, so it measures nothing at all. Between "told exactly what to do"
// and "mashing keys" sits the actual player, and no instrument covered them.
//
// This one is given the game's verb vocabulary and the names of what is in the
// room, and nothing else. It is never told which verb works on which thing: it
// combines them itself, remembers what it has already wasted a turn on, and
// leans on verbs that have worked before — which is how a player learns that
// lockers respond to being forced. It never reads a suggestion.
// ---------------------------------------------------------------------------

import type { PlaytestBot, BotState, BotScene } from './index';
import { VERB_IDS, SECRET_VERBS, MOVEMENT_VERBS } from '../../../src/engine/verbs';
import { isExcludedFromSuggestions } from '../../../src/engine/suggestions';
import type { VerbId } from '../../../src/engine/verbs';
import { t } from '../../../src/i18n/index';
import type { StringKey } from '../../../src/i18n/types';

/**
 * What a player of the genre reaches for first. These are verb *ids*, so the
 * words still come from the locale — this encodes genre literacy, not French.
 */
const FAMILIAR_VERBS: readonly VerbId[] = [
  'EXAMINE', 'TAKE', 'OPEN', 'FORCE_OPEN', 'PUSH', 'PULL',
  'BREAK', 'HACK', 'UNLOCK', 'USE', 'TALK', 'STRIKE', 'REPAIR', 'READ',
];

/** Share of turns spent on a familiar verb rather than the whole vocabulary. */
const FAMILIAR_SHARE = 0.7;

/** Tries wasted on one pairing before the player concludes it does nothing. */
const TRIES_PER_PAIRING = 2;

/** Turns spent in one room before curiosity gives way to moving on. */
const PATIENCE_PER_ROOM = 12;

/** A verb as the player would type it, or null when the locale has no wording. */
function verbWord(verbId: VerbId): string | null {
  const key = `verb.${verbId}` as StringKey;
  const resolved = t(key);
  if (resolved === key) return null;
  return resolved[0]!.toLowerCase() + resolved.slice(1);
}

/** The verbs worth aiming at a thing: no movement, no easter eggs. */
function buildVocabulary(): { familiar: string[]; whole: string[] } {
  const usable = VERB_IDS.filter(
    id => !MOVEMENT_VERBS.has(id) && !SECRET_VERBS.has(id) && !isExcludedFromSuggestions(id),
  );
  const word = (id: VerbId): string | null => verbWord(id);
  return {
    familiar: FAMILIAR_VERBS.filter(id => usable.includes(id))
      .map(word).filter((w): w is string => w !== null),
    whole: usable.map(word).filter((w): w is string => w !== null),
  };
}

let vocabulary: { familiar: string[]; whole: string[] } | null = null;

interface FreePlayMemory {
  /** Turns wasted on `location|verb|target`. */
  readonly tried: Map<string, number>;
  /** How often a verb has ever produced something, anywhere. */
  readonly verbPayoff: Map<string, number>;
  /** Everything the game has said in each room, folded to lowercase. */
  readonly textSeen: Map<string, string>;
  /** Consecutive turns spent in the current room. */
  turnsHere: number;
  lastLocation: string | null;
  lastTurn: number;
  lastAction: string | null;
  lastHp: number;
}

const memory: FreePlayMemory = {
  tried: new Map(),
  verbPayoff: new Map(),
  textSeen: new Map(),
  turnsHere: 0,
  lastLocation: null,
  lastTurn: -1,
  lastAction: null,
  lastHp: 0,
};

function resetOnNewRun(state: BotState): void {
  if (state.turn !== 0 && state.turn > memory.lastTurn) return;
  memory.tried.clear();
  memory.verbPayoff.clear();
  memory.textSeen.clear();
  memory.turnsHere = 0;
  memory.lastLocation = null;
  memory.lastAction = null;
}

/**
 * Words worth matching in a description: the long ones. "kit" and "pod" match
 * half the ship, but "badge" or "multitool" name one thing.
 */
function distinctiveWords(name: string): string[] {
  return name.toLowerCase().split(/[^a-z\u00e0-\u00ff]+/)
    .filter(w => w.length >= 5);
}

/** True when the room's text has named this thing — the clue a player follows. */
function textMentions(locationId: string, name: string): boolean {
  const seen = memory.textSeen.get(locationId);
  if (seen === undefined || seen.length === 0) return false;
  const words = distinctiveWords(name);
  return words.length > 0 && words.some(w => seen.includes(w));
}

/**
 * Learning, in the only form available without reading the engine: an action
 * that changed the world is worth repeating on other things. HP loss is not a
 * verdict — a fight hurts and still works — so only gains count.
 */
function learnFromLastTurn(state: BotState): void {
  if (memory.lastAction === null) return;
  const verb = memory.lastAction.split(' ')[0]!;
  const movedOn = memory.lastLocation !== state.playerLocationId;
  if (movedOn) {
    memory.verbPayoff.set(verb, (memory.verbPayoff.get(verb) ?? 0) + 1);
  }
}

function pairingKey(locationId: string, action: string): string {
  return `${locationId}|${action}`;
}

function exhausted(locationId: string, action: string): boolean {
  return (memory.tried.get(pairingKey(locationId, action)) ?? 0) >= TRIES_PER_PAIRING;
}

function note(locationId: string, action: string): void {
  const key = pairingKey(locationId, action);
  memory.tried.set(key, (memory.tried.get(key) ?? 0) + 1);
}

export const freePlayBot: PlaytestBot = {
  name: 'free_play',

  makeDecision(
    state: BotState,
    scene: BotScene,
    rng: { float(): number; pick<T>(arr: readonly T[]): T },
  ): string {
    resetOnNewRun(state);
    learnFromLastTurn(state);
    if (memory.lastLocation === state.playerLocationId) memory.turnsHere += 1;
    else { memory.turnsHere = 0; memory.lastLocation = state.playerLocationId; }
    memory.lastTurn = state.turn;
    memory.lastHp = state.playerHp;

    // Remember what the room has told you. This is the only guidance it gets.
    if (scene.lastNarrative.length > 0) {
      const here0 = state.playerLocationId;
      memory.textSeen.set(
        here0,
        `${memory.textSeen.get(here0) ?? ''} ${scene.lastNarrative.toLowerCase()}`,
      );
    }

    vocabulary ??= buildVocabulary();
    const { familiar, whole } = vocabulary;
    const here = state.playerLocationId;

    const remember = (action: string): string => {
      note(here, action);
      memory.lastAction = action;
      return action;
    };

    // Patch yourself up. Not prompted by anything: a player who is bleeding and
    // holding a medkit uses it.
    if (state.playerHp < state.playerMaxHp * 0.4 && scene.healingItemName !== null) {
      return remember(`utiliser ${scene.healingItemName}`);
    }

    // Loose things get picked up. A player does not need to be told.
    const takeable = scene.locationItemNames.filter(
      name => !exhausted(here, `prendre ${name}`),
    );
    if (takeable.length > 0 && rng.float() < 0.8) {
      return remember(`prendre ${rng.pick(takeable)}`);
    }

    // Everything nameable in this room, plus what is in hand.
    const targets = [
      ...scene.environmentFeatureNames,
      ...scene.npcNames,
      ...scene.locationItemNames,
    ];

    // Look before you act, and only once per thing: this is where the text that
    // names the badge comes from in the first place.
    const unlooked = scene.environmentFeatureNames.filter(
      name => (memory.tried.get(pairingKey(here, `examiner ${name}`)) ?? 0) === 0,
    );
    if (unlooked.length > 0 && rng.float() < 0.6) {
      return remember(`examiner ${rng.pick(unlooked)}`);
    }

    // Follow the clue. When the room's own text names something in your hands,
    // that is what a player reaches for.
    if (scene.inventoryItemNames.length > 0 && targets.length > 0) {
      const hinted = scene.inventoryItemNames.filter(item => textMentions(here, item));
      for (const item of hinted) {
        const candidates = targets
          .map(target => `utiliser ${item} sur ${target}`)
          .filter(action => !exhausted(here, action));
        if (candidates.length > 0) return remember(rng.pick(candidates));
      }
    }

    // Move on when the room is spent, or when patience runs out.
    const wantsOut = memory.turnsHere >= PATIENCE_PER_ROOM || targets.length === 0;
    if (scene.connectedLocationAliases.length > 0 && (wantsOut || rng.float() < 0.18)) {
      const unseen = scene.connectedLocationAliases.filter((_, i) => {
        const id = scene.connectedLocationIds[i];
        return id !== undefined && !state.visitedLocationIds.includes(id);
      });
      const pool = unseen.length > 0 ? unseen : scene.connectedLocationAliases;
      return remember(`aller ${rng.pick(pool)}`);
    }
    if (targets.length === 0) return remember('regarder autour');

    // Invent something to try. Verbs that have paid off before come up more
    // often, which is the whole of what this bot knows about the game.
    const candidates: string[] = [];
    for (let attempt = 0; attempt < 24 && candidates.length === 0; attempt++) {
      const pool = rng.float() < FAMILIAR_SHARE ? familiar : whole;
      if (pool.length === 0) break;
      const verb = rng.pick(pool);
      const target = rng.pick(targets);

      // Reach for a tool sometimes — the combination nothing suggested.
      const withTool = scene.inventoryItemNames.length > 0 && rng.float() < 0.25;
      const action = withTool
        ? `utiliser ${rng.pick(scene.inventoryItemNames)} sur ${target}`
        : `${verb} ${target}`;

      if (!exhausted(here, action)) candidates.push(action);
    }

    if (candidates.length === 0) {
      // Nothing new to try here. Leave if there is anywhere to go.
      if (scene.connectedLocationAliases.length > 0) {
        return remember(`aller ${rng.pick(scene.connectedLocationAliases)}`);
      }
      return remember('regarder autour');
    }

    // Prefer the verb that has opened doors before, among what is still untried.
    candidates.sort((a, b) => {
      const payoff = (s: string): number => memory.verbPayoff.get(s.split(' ')[0]!) ?? 0;
      return payoff(b) - payoff(a);
    });
    return remember(candidates[0]!);
  },
};
