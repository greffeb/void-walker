// ---------------------------------------------------------------------------
// src/engine/entityState.ts — Mutable state of objects and features
// ---------------------------------------------------------------------------
// State is what an entity *is doing*, as opposed to a PropertyId which is what
// it *is*. Each axis is independent and closed, so a door can be unlocked and
// still closed — something a single free-form state string could not express.
// ---------------------------------------------------------------------------

export type OpennessState = 'open' | 'closed';
export type LockState = 'locked' | 'unlocked';
export type PowerState = 'powered' | 'unpowered';
export type ActivityState = 'active' | 'inactive';
export type IntegrityState = 'intact' | 'damaged' | 'broken';
export type ContentsState = 'full' | 'searched' | 'empty';

/** One value on every axis. */
export interface EntityState {
  readonly openness: OpennessState;
  readonly lock: LockState;
  readonly power: PowerState;
  readonly activity: ActivityState;
  readonly integrity: IntegrityState;
  readonly contents: ContentsState;
}

export const DEFAULT_ENTITY_STATE: EntityState = {
  openness: 'closed',
  lock: 'unlocked',
  power: 'powered',
  activity: 'inactive',
  integrity: 'intact',
  contents: 'full',
};

/** Every token content may write in `initialState` or `newState`. */
export type StateId =
  | OpennessState
  | LockState
  | PowerState
  | ActivityState
  | IntegrityState
  | ContentsState;

export const STATE_IDS: readonly StateId[] = [
  'open', 'closed',
  'locked', 'unlocked',
  'powered', 'unpowered',
  'active', 'inactive',
  'intact', 'damaged', 'broken',
  'full', 'searched', 'empty',
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

/** True when something physically prevents the entity from being opened. */
export function resistsOpening(state: EntityState): boolean {
  return state.lock === 'locked' || state.integrity === 'broken';
}
