// ---------------------------------------------------------------------------
// src/engine/entityState.ts — Mutable state of objects and features
// ---------------------------------------------------------------------------
// State is what an entity *is doing*, as opposed to a PropertyId which is what
// it *is*. Each axis is independent and closed, so a door can be unlocked and
// still closed — something a single free-form state string could not express.
// ---------------------------------------------------------------------------

import type { StringKey } from '@i18n/types';

export type OpennessState = 'open' | 'closed';
export type LockState = 'locked' | 'unlocked';
export type PowerState = 'powered' | 'unpowered';
export type ActivityState = 'active' | 'inactive';
export type IntegrityState = 'intact' | 'damaged' | 'broken';
export type ContentsState = 'full' | 'searched' | 'empty';
/** Decision C-bis: what a creature is, and how it stands towards the player. */
export type VitalityState = 'alive' | 'wounded' | 'unconscious' | 'dead';
export type DispositionState = 'hostile' | 'neutral' | 'friendly' | 'willing';

/**
 * One value per axis. An absent axis means "not applicable or never stated":
 * a rock has no lock, and a door nobody powered has no power state.
 */
export interface EntityState {
  readonly openness?: OpennessState;
  readonly lock?: LockState;
  readonly power?: PowerState;
  readonly activity?: ActivityState;
  readonly integrity?: IntegrityState;
  readonly contents?: ContentsState;
  readonly vitality?: VitalityState;
  readonly disposition?: DispositionState;
}

/** Nothing stated yet. */
export const DEFAULT_ENTITY_STATE: EntityState = {};

/** Every token content may write in `initialState` or `newState`. */
export type StateId =
  | OpennessState
  | LockState
  | PowerState
  | ActivityState
  | IntegrityState
  | ContentsState
  | VitalityState
  | DispositionState;

export const STATE_IDS: readonly StateId[] = [
  'open', 'closed',
  'locked', 'unlocked',
  'powered', 'unpowered',
  'active', 'inactive',
  'intact', 'damaged', 'broken',
  'full', 'searched', 'empty',
  'alive', 'wounded', 'unconscious', 'dead',
  'hostile', 'neutral', 'friendly', 'willing',
] as const;

/**
 * Apply one token, along with the changes it physically implies: opening a door
 * unlocks it, breaking a machine stops it. Returns a new state.
 */
export function applyStateToken(state: EntityState, token: StateId): EntityState {
  switch (token) {
    case 'open':
      return { ...state, openness: 'open', lock: 'unlocked' };
    case 'closed':
      return { ...state, openness: 'closed' };
    case 'locked':
      return { ...state, lock: 'locked', openness: 'closed' };
    case 'unlocked':
      return { ...state, lock: 'unlocked' };
    case 'powered':
      return { ...state, power: 'powered' };
    case 'unpowered':
      return { ...state, power: 'unpowered', activity: 'inactive' };
    case 'active':
      return { ...state, activity: 'active', power: 'powered' };
    case 'inactive':
      return { ...state, activity: 'inactive' };
    case 'intact':
      return { ...state, integrity: 'intact' };
    case 'damaged':
      return { ...state, integrity: 'damaged' };
    case 'broken':
      return { ...state, integrity: 'broken', activity: 'inactive', power: 'unpowered' };
    case 'full':
      return { ...state, contents: 'full' };
    case 'searched':
      return { ...state, contents: 'searched' };
    case 'empty':
      return { ...state, contents: 'empty' };
    case 'alive':
      return { ...state, vitality: 'alive' };
    case 'wounded':
      return { ...state, vitality: 'wounded' };
    case 'unconscious':
      return { ...state, vitality: 'unconscious' };
    // Death ends every negotiation: a corpse has no stance left to take.
    case 'dead':
      return { ...state, vitality: 'dead', disposition: undefined };
    case 'hostile':
      return { ...state, disposition: 'hostile' };
    case 'neutral':
      return { ...state, disposition: 'neutral' };
    case 'friendly':
      return { ...state, disposition: 'friendly' };
    case 'willing':
      return { ...state, disposition: 'willing' };
  }
}

/** Build a state from a starting token, or the default when none is given. */
export function makeEntityState(token?: StateId): EntityState {
  return token === undefined ? DEFAULT_ENTITY_STATE : applyStateToken(DEFAULT_ENTITY_STATE, token);
}

/** True when the entity matches every axis named in the query. */
export function matchesState(state: EntityState, query: Partial<EntityState>): boolean {
  for (const [axis, expected] of Object.entries(query)) {
    if (expected === undefined) continue;
    if (state[axis as keyof EntityState] !== expected) return false;
  }
  return true;
}

/** The axis each token belongs to. */
const TOKEN_AXIS: Readonly<Record<StateId, keyof EntityState>> = {
  open: 'openness', closed: 'openness',
  locked: 'lock', unlocked: 'lock',
  powered: 'power', unpowered: 'power',
  active: 'activity', inactive: 'activity',
  intact: 'integrity', damaged: 'integrity', broken: 'integrity',
  full: 'contents', searched: 'contents', empty: 'contents',
  alive: 'vitality', wounded: 'vitality', unconscious: 'vitality', dead: 'vitality',
  hostile: 'disposition', neutral: 'disposition', friendly: 'disposition', willing: 'disposition',
};

/** True when the token describes the entity's current value on its own axis. */
export function stateMatchesToken(state: EntityState, token: StateId): boolean {
  return state[TOKEN_AXIS[token]] === token;
}

/**
 * Tokens ordered by narrative salience: a broken door is described as broken
 * rather than closed, so the first matching token wins when picking a description.
 */
export const STATE_TOKEN_SALIENCE: readonly StateId[] = [
  'dead', 'unconscious', 'wounded',
  'broken', 'damaged',
  'hostile', 'friendly', 'willing',
  'locked', 'open',
  'active', 'inactive',
  'empty', 'searched',
  'unpowered', 'powered',
  'closed', 'intact', 'unlocked', 'full',
  'alive', 'neutral',
];

/** True when something physically prevents the entity from being opened. */
export function resistsOpening(state: EntityState): boolean {
  return state.lock === 'locked' || state.integrity === 'broken';
}

// === REGISTRY ===

/** Metadata for a single state token, mirroring the property registry. */
export interface StateMeta {
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
}

/**
 * Every state token must carry i18n keys. No cast here on purpose: a token
 * without translations is a compile error, not a raw key shown to the player.
 */
export const STATE_REGISTRY: Readonly<Record<StateId, StateMeta>> = Object.fromEntries(
  STATE_IDS.map(id => [id, {
    nameKey: `state.${id}`,
    descriptionKey: `state.${id}.description`,
  } satisfies StateMeta]),
) as Readonly<Record<StateId, StateMeta>>;
