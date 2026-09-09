// ---------------------------------------------------------------------------
// src/engine/locationState.ts — Mutable state of a location
// ---------------------------------------------------------------------------
// A room can catch fire, flood or lose pressure. Those are states of the place,
// independent from each other and from what the room contains. Same design as
// entityState: closed axes, all optional, an absent axis meaning "never stated".
// ---------------------------------------------------------------------------

import type { EnvironmentCondition, AtmosphereType } from './types';
import { BALANCE } from './constants';

export type PressureState = 'pressurized' | 'depressurized';
export type FireState = 'burning' | 'clear';
export type FloodState = 'flooded' | 'dry';
export type LightState = 'lit' | 'dark';
export type GravityState = 'normal' | 'zero_g';
export type AirState = 'breathable' | 'low_oxygen' | 'toxic';

export interface LocationState {
  readonly pressure?: PressureState;
  readonly fire?: FireState;
  readonly flood?: FloodState;
  readonly light?: LightState;
  readonly gravity?: GravityState;
  readonly air?: AirState;
  /** Turn the fire started, so it can spread on a delay rather than instantly. */
  readonly fireSince?: number;
  /** Turn the room turned deadly, so an emergent kill cannot be same-turn. */
  readonly lethalSince?: number;
}

/** Every token content or consequences may write. */
export type LocationStateId =
  | PressureState
  | FireState
  | FloodState
  | LightState
  | GravityState
  | AirState;

export const LOCATION_STATE_IDS: readonly LocationStateId[] = [
  'pressurized', 'depressurized',
  'burning', 'clear',
  'flooded', 'dry',
  'lit', 'dark',
  'normal', 'zero_g',
  'breathable', 'low_oxygen', 'toxic',
] as const;

/**
 * Apply one token, along with what it physically implies: losing pressure kills
 * artificial gravity, smothers a fire and leaves nothing to breathe; flooding
 * puts a fire out.
 */
export function applyLocationToken(
  state: LocationState,
  token: LocationStateId,
  turn = 0,
): LocationState {
  const next = writeAxis(state, token, turn);
  const wasLethal = isLethalLocation(state);
  const isNow = isLethalLocation(next);
  if (isNow && !wasLethal) return { ...next, lethalSince: turn };
  if (!isNow && wasLethal) return { ...next, lethalSince: undefined };
  return next;
}

function writeAxis(state: LocationState, token: LocationStateId, turn: number): LocationState {
  switch (token) {
    case 'pressurized':
      return { ...state, pressure: 'pressurized' };
    case 'depressurized':
      return { ...state, pressure: 'depressurized', gravity: 'zero_g', fire: 'clear', air: undefined };
    case 'burning':
      return { ...state, fire: 'burning', fireSince: state.fire === 'burning' ? state.fireSince : turn };
    case 'clear':
      return { ...state, fire: 'clear', fireSince: undefined };
    case 'flooded':
      return { ...state, flood: 'flooded', fire: 'clear', fireSince: undefined };
    case 'dry':
      return { ...state, flood: 'dry' };
    case 'lit':
      return { ...state, light: 'lit' };
    case 'dark':
      return { ...state, light: 'dark' };
    case 'normal':
      return { ...state, gravity: 'normal' };
    case 'zero_g':
      return { ...state, gravity: 'zero_g' };
    case 'breathable':
      return { ...state, air: 'breathable' };
    case 'low_oxygen':
      return { ...state, air: 'low_oxygen' };
    case 'toxic':
      return { ...state, air: 'toxic' };
  }
}

/** The conditions the difficulty and narration layers read. */
export function deriveConditions(state: LocationState): EnvironmentCondition[] {
  const conditions: EnvironmentCondition[] = [];
  if (state.light === 'dark') conditions.push('dark');
  if (state.gravity === 'zero_g') conditions.push('zero_g');
  if (state.fire === 'burning') conditions.push('on_fire');
  if (state.flood === 'flooded') conditions.push('flooded');
  if (state.pressure === 'depressurized') conditions.push('depressurized');
  return conditions;
}

/** True when the location is lethal to an unprotected player. */
export function isLethalLocation(state: LocationState): boolean {
  return state.pressure === 'depressurized' || state.fire === 'burning';
}

/**
 * True when the room has been deadly long enough for an emergent kill to count.
 * §5.2 safeguard, in two parts: a room that was *born* lethal is scenery, not a
 * trap you set, and a trap must not spring on the turn it was armed.
 */
export function isEstablishedLethal(state: LocationState, turn: number): boolean {
  if (!isLethalLocation(state)) return false;
  if (state.lethalSince === undefined) return false;
  return turn - state.lethalSince >= BALANCE.EMERGENT_VICTORY_MIN_TURNS;
}

/** Starting state of a location, from the atmosphere its node declares. */
export function locationStateFromAtmosphere(atmosphere: AtmosphereType): LocationState {
  switch (atmosphere) {
    case 'depressurized':
      return { pressure: 'depressurized', gravity: 'zero_g' };
    case 'low_oxygen':
      return { pressure: 'pressurized', air: 'low_oxygen' };
    case 'toxic_atmosphere':
      return { pressure: 'pressurized', air: 'toxic' };
    case 'pressurized':
      return { pressure: 'pressurized', air: 'breathable' };
  }
}

/** What the oxygen tracker and the scene description read back. */
export function atmosphereOf(state: LocationState): AtmosphereType {
  if (state.pressure === 'depressurized') return 'depressurized';
  if (state.air === 'toxic') return 'toxic_atmosphere';
  if (state.air === 'low_oxygen') return 'low_oxygen';
  return 'pressurized';
}

/** The location token an authored atmosphere change writes. */
export function atmosphereToken(atmosphere: AtmosphereType): LocationStateId {
  switch (atmosphere) {
    case 'depressurized': return 'depressurized';
    case 'toxic_atmosphere': return 'toxic';
    case 'low_oxygen': return 'low_oxygen';
    case 'pressurized': return 'breathable';
  }
}

// ---------------------------------------------------------------------------
// PROPAGATION — what a fire does to the ship while nobody watches
// ---------------------------------------------------------------------------

/** A door between two locations, all the propagation needs to know. */
export interface LocationLink {
  readonly from: string;
  readonly to: string;
}

/**
 * Advance the world by one turn. A fire left alone fouls the air it burns in,
 * then reaches through to the next room — after FIRE_SPREAD_DELAY turns, which
 * until now was a constant nobody read.
 *
 * Vacuum stops it: a depressurized room has nothing to burn, and a flooded one
 * has already been dealt with.
 */
export function tickLocationStates(
  states: Readonly<Record<string, LocationState>>,
  links: readonly LocationLink[],
  turn: number,
): Readonly<Record<string, LocationState>> {
  const spreading = Object.entries(states).filter(([, s]) =>
    s.fire === 'burning'
    && s.fireSince !== undefined
    && turn - s.fireSince >= BALANCE.FIRE_SPREAD_DELAY,
  );
  if (spreading.length === 0) return states;

  const next: Record<string, LocationState> = { ...states };

  for (const [id, state] of spreading) {
    // A fire that has had time to take hold poisons what is left to breathe.
    if (state.air !== 'toxic' && state.pressure !== 'depressurized') {
      next[id] = applyLocationToken(next[id] ?? state, 'toxic', turn);
    }

    for (const link of links) {
      const neighbourId = neighbourOf(link, id);
      if (neighbourId === undefined) continue;
      const neighbour = next[neighbourId] ?? {};
      if (neighbour.fire === 'burning') continue;
      if (neighbour.pressure === 'depressurized') continue;
      if (neighbour.flood === 'flooded') continue;
      next[neighbourId] = applyLocationToken(neighbour, 'burning', turn);
    }
  }

  return next;
}

function neighbourOf(link: LocationLink, id: string): string | undefined {
  if (link.from === id) return link.to;
  if (link.to === id) return link.from;
  return undefined;
}
