// ---------------------------------------------------------------------------
// src/engine/verbs.ts — Verb registry: stat mapping, requirements, i18n keys.
// Verb wording (aliases, conjugated forms) lives in the locale files only.
// ---------------------------------------------------------------------------

import type { StatId } from './types';
import type { PropertyId } from './properties';
import type { EntityState } from './entityState';
import { resistsOpening } from './entityState';
import type { StringKey } from '@i18n/types';

// === VERB ID UNION ===

/** All valid verb identifiers */
export type VerbId =
  // FOR (13)
  | 'STRIKE' | 'PUSH' | 'PULL' | 'LIFT' | 'KICK'
  | 'BREAK' | 'BEND' | 'CUT' | 'FORCE_OPEN' | 'BITE'
  | 'SQUEEZE' | 'IMPROVISE_WEAPON' | 'SACRIFICE' | 'SELF_HARM'
  // DEF (3)
  | 'BLOCK' | 'IMPROVISE_SHIELD' | 'BARRICADE'
  // INT (22)
  | 'READ' | 'HACK' | 'REPAIR' | 'DISASSEMBLE' | 'ASSEMBLE'
  | 'ACTIVATE' | 'DEACTIVATE' | 'REPROGRAM' | 'LOCK' | 'UNLOCK'
  | 'WELD' | 'PLUG' | 'OVERRIDE' | 'SABOTAGE' | 'SET_TRAP'
  | 'IMPROVISE_TOOL' | 'WEDGE' | 'IGNITE' | 'FLOOD' | 'ELECTRIFY'
  | 'TIE' | 'COVER'
  // PER (4)
  | 'EXAMINE' | 'LISTEN' | 'SMELL' | 'SCAN'
  // CHA (14)
  | 'TALK' | 'PERSUADE' | 'INTIMIDATE' | 'DECEIVE' | 'DISTRACT'
  | 'BARTER' | 'SEDUCE' | 'COMMAND' | 'CALM' | 'PROVOKE'
  | 'PLEAD' | 'INTERROGATE' | 'SIGNAL' | 'LURE'
  // AGI (9)
  | 'THROW' | 'SHOOT' | 'CLIMB' | 'JUMP' | 'DODGE'
  | 'SWIM' | 'RUN' | 'HIDE' | 'STACK'
  // Interaction / Auto (12)
  | 'USE' | 'OPEN' | 'CLOSE' | 'TAKE' | 'DROP'
  | 'GIVE' | 'EQUIP' | 'EAT' | 'DRINK' | 'MOVE_TO'
  | 'WAIT' | 'TOUCH'
  // Secret (7) — never suggested, discovered by curiosity alone (decision W)
  | 'PRAY' | 'DANCE' | 'NAME' | 'SING' | 'APOLOGIZE'
  | 'WHISPER' | 'REMEMBER';

/** All valid verb IDs as a runtime array */
export const VERB_IDS: readonly VerbId[] = [
  // FOR (13)
  'STRIKE', 'PUSH', 'PULL', 'LIFT', 'KICK',
  'BREAK', 'BEND', 'CUT', 'FORCE_OPEN', 'BITE',
  'SQUEEZE', 'IMPROVISE_WEAPON', 'SACRIFICE', 'SELF_HARM',
  // DEF (3)
  'BLOCK', 'IMPROVISE_SHIELD', 'BARRICADE',
  // INT (22)
  'READ', 'HACK', 'REPAIR', 'DISASSEMBLE', 'ASSEMBLE',
  'ACTIVATE', 'DEACTIVATE', 'REPROGRAM', 'LOCK', 'UNLOCK',
  'WELD', 'PLUG', 'OVERRIDE', 'SABOTAGE', 'SET_TRAP',
  'IMPROVISE_TOOL', 'WEDGE', 'IGNITE', 'FLOOD', 'ELECTRIFY',
  'TIE', 'COVER',
  // PER (4)
  'EXAMINE', 'LISTEN', 'SMELL', 'SCAN',
  // CHA (14)
  'TALK', 'PERSUADE', 'INTIMIDATE', 'DECEIVE', 'DISTRACT',
  'BARTER', 'SEDUCE', 'COMMAND', 'CALM', 'PROVOKE',
  'PLEAD', 'INTERROGATE', 'SIGNAL', 'LURE',
  // AGI (9)
  'THROW', 'SHOOT', 'CLIMB', 'JUMP', 'DODGE',
  'SWIM', 'RUN', 'HIDE', 'STACK',
  // Interaction / Auto (12)
  'USE', 'OPEN', 'CLOSE', 'TAKE', 'DROP',
  'GIVE', 'EQUIP', 'EAT', 'DRINK', 'MOVE_TO',
  'WAIT', 'TOUCH',
  // Secret (7)
  'PRAY', 'DANCE', 'NAME', 'SING', 'APOLOGIZE',
  'WHISPER', 'REMEMBER',
] as const;

// === VERB REQUIREMENTS ===

/**
 * A requirement clause: target must have ALL properties in this array.
 * Multiple clauses are OR'd together.
 */
export type RequirementClause = readonly PropertyId[];

/** Verb requirements against the target and player tools */
export interface VerbRequirements {
  /** Target must satisfy at least one clause (OR between, AND within) */
  readonly targetProps: readonly RequirementClause[];
  /** Player must have an item with this property (null = no tool needed) */
  readonly requiredToolProp: PropertyId | null;
  /** Axes the target must currently be on, e.g. UNLOCK needs a locked target. */
  readonly requiredState?: Partial<EntityState>;
}

// === VERB ENTRY ===

/** Full definition of a verb */
export interface VerbEntry {
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
  readonly requirements: VerbRequirements;
  readonly difficultyMod: number;
  readonly auto: boolean;
  /** Never suggested, never required. The player has to think of it. */
  readonly secret?: boolean;
}

/** Registry mapping every verb to its definition */
export type VerbRegistry = Readonly<Record<VerbId, VerbEntry>>;

// === VERB REGISTRY ===

export const VERB_REGISTRY: VerbRegistry = {
  // ── FOR (13) ──────────────────────────────────────────────────────────
  STRIKE: {
    nameKey: 'verb.STRIKE', descriptionKey: 'verb.STRIKE.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  PUSH: {
    nameKey: 'verb.PUSH', descriptionKey: 'verb.PUSH.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  PULL: {
    nameKey: 'verb.PULL', descriptionKey: 'verb.PULL.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  LIFT: {
    nameKey: 'verb.LIFT', descriptionKey: 'verb.LIFT.description',
    requirements: { targetProps: [['liftable']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  KICK: {
    nameKey: 'verb.KICK', descriptionKey: 'verb.KICK.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  BREAK: {
    nameKey: 'verb.BREAK', descriptionKey: 'verb.BREAK.description',
    requirements: { targetProps: [['breakable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  BEND: {
    nameKey: 'verb.BEND', descriptionKey: 'verb.BEND.description',
    requirements: { targetProps: [['malleable']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  CUT: {
    nameKey: 'verb.CUT', descriptionKey: 'verb.CUT.description',
    requirements: { targetProps: [['cuttable']], requiredToolProp: 'bladed' },
    difficultyMod: 0, auto: false,
  },
  FORCE_OPEN: {
    nameKey: 'verb.FORCE_OPEN', descriptionKey: 'verb.FORCE_OPEN.description',
    requirements: { targetProps: [['openable']], requiredToolProp: null, requiredState: { lock: 'locked' } },
    difficultyMod: 3, auto: false,
  },
  BITE: {
    nameKey: 'verb.BITE', descriptionKey: 'verb.BITE.description',
    requirements: { targetProps: [['tangible', 'small']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  SQUEEZE: {
    nameKey: 'verb.SQUEEZE', descriptionKey: 'verb.SQUEEZE.description',
    requirements: { targetProps: [['small'], ['soft']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  IMPROVISE_WEAPON: {
    nameKey: 'verb.IMPROVISE_WEAPON', descriptionKey: 'verb.IMPROVISE_WEAPON.description',
    requirements: { targetProps: [['liftable'], ['holdable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  SACRIFICE: {
    nameKey: 'verb.SACRIFICE', descriptionKey: 'verb.SACRIFICE.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  SELF_HARM: {
    nameKey: 'verb.SELF_HARM', descriptionKey: 'verb.SELF_HARM.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 8, auto: false,
  },

  // ── DEF (3) ───────────────────────────────────────────────────────────
  BLOCK: {
    nameKey: 'verb.BLOCK', descriptionKey: 'verb.BLOCK.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  IMPROVISE_SHIELD: {
    nameKey: 'verb.IMPROVISE_SHIELD', descriptionKey: 'verb.IMPROVISE_SHIELD.description',
    requirements: { targetProps: [['holdable', 'rigid']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  BARRICADE: {
    nameKey: 'verb.BARRICADE', descriptionKey: 'verb.BARRICADE.description',
    requirements: { targetProps: [['openable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },

  // ── INT (22) ──────────────────────────────────────────────────────────
  READ: {
    nameKey: 'verb.READ', descriptionKey: 'verb.READ.description',
    requirements: { targetProps: [['readable']], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  HACK: {
    nameKey: 'verb.HACK', descriptionKey: 'verb.HACK.description',
    requirements: { targetProps: [['electronic', 'secured']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  REPAIR: {
    nameKey: 'verb.REPAIR', descriptionKey: 'verb.REPAIR.description',
    requirements: { targetProps: [['mechanical'], ['electronic']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  DISASSEMBLE: {
    nameKey: 'verb.DISASSEMBLE', descriptionKey: 'verb.DISASSEMBLE.description',
    requirements: { targetProps: [['mechanical'], ['electronic']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  ASSEMBLE: {
    nameKey: 'verb.ASSEMBLE', descriptionKey: 'verb.ASSEMBLE.description',
    requirements: { targetProps: [['component']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  ACTIVATE: {
    nameKey: 'verb.ACTIVATE', descriptionKey: 'verb.ACTIVATE.description',
    requirements: { targetProps: [['electronic'], ['mechanical']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  DEACTIVATE: {
    nameKey: 'verb.DEACTIVATE', descriptionKey: 'verb.DEACTIVATE.description',
    requirements: { targetProps: [['electronic'], ['mechanical']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  REPROGRAM: {
    nameKey: 'verb.REPROGRAM', descriptionKey: 'verb.REPROGRAM.description',
    requirements: { targetProps: [['programmable']], requiredToolProp: null },
    difficultyMod: 4, auto: false,
  },
  LOCK: {
    nameKey: 'verb.LOCK', descriptionKey: 'verb.LOCK.description',
    requirements: { targetProps: [['lockable']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  UNLOCK: {
    nameKey: 'verb.UNLOCK', descriptionKey: 'verb.UNLOCK.description',
    requirements: { targetProps: [['lockable']], requiredToolProp: null, requiredState: { lock: 'locked' } },
    difficultyMod: 2, auto: false,
  },
  WELD: {
    nameKey: 'verb.WELD', descriptionKey: 'verb.WELD.description',
    requirements: { targetProps: [['metallic']], requiredToolProp: 'heat_source' },
    difficultyMod: 2, auto: false,
  },
  PLUG: {
    nameKey: 'verb.PLUG', descriptionKey: 'verb.PLUG.description',
    requirements: { targetProps: [['electronic', 'port']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  OVERRIDE: {
    nameKey: 'verb.OVERRIDE', descriptionKey: 'verb.OVERRIDE.description',
    requirements: { targetProps: [['electronic']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  SABOTAGE: {
    nameKey: 'verb.SABOTAGE', descriptionKey: 'verb.SABOTAGE.description',
    requirements: { targetProps: [['mechanical'], ['electronic']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  SET_TRAP: {
    nameKey: 'verb.SET_TRAP', descriptionKey: 'verb.SET_TRAP.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  IMPROVISE_TOOL: {
    nameKey: 'verb.IMPROVISE_TOOL', descriptionKey: 'verb.IMPROVISE_TOOL.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  WEDGE: {
    nameKey: 'verb.WEDGE', descriptionKey: 'verb.WEDGE.description',
    requirements: { targetProps: [['rigid', 'small']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  IGNITE: {
    nameKey: 'verb.IGNITE', descriptionKey: 'verb.IGNITE.description',
    requirements: { targetProps: [['flammable']], requiredToolProp: 'heat_source' },
    difficultyMod: 2, auto: false,
  },
  FLOOD: {
    nameKey: 'verb.FLOOD', descriptionKey: 'verb.FLOOD.description',
    requirements: { targetProps: [], requiredToolProp: 'liquid_source' },
    difficultyMod: 3, auto: false,
  },
  ELECTRIFY: {
    nameKey: 'verb.ELECTRIFY', descriptionKey: 'verb.ELECTRIFY.description',
    requirements: { targetProps: [['conductive']], requiredToolProp: 'power_source' },
    difficultyMod: 3, auto: false,
  },
  TIE: {
    nameKey: 'verb.TIE', descriptionKey: 'verb.TIE.description',
    requirements: { targetProps: [], requiredToolProp: 'flexible' },
    difficultyMod: 1, auto: false,
  },
  COVER: {
    nameKey: 'verb.COVER', descriptionKey: 'verb.COVER.description',
    requirements: { targetProps: [['coverable']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },

  // ── PER (4) ───────────────────────────────────────────────────────────
  EXAMINE: {
    nameKey: 'verb.EXAMINE', descriptionKey: 'verb.EXAMINE.description',
    requirements: { targetProps: [['tangible'], ['visible']], requiredToolProp: null },
    difficultyMod: -3, auto: false,
  },
  LISTEN: {
    nameKey: 'verb.LISTEN', descriptionKey: 'verb.LISTEN.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  SMELL: {
    nameKey: 'verb.SMELL', descriptionKey: 'verb.SMELL.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  SCAN: {
    nameKey: 'verb.SCAN', descriptionKey: 'verb.SCAN.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: 'electronic' },
    difficultyMod: -1, auto: false,
  },

  // ── CHA (14) ──────────────────────────────────────────────────────────
  TALK: {
    nameKey: 'verb.TALK', descriptionKey: 'verb.TALK.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  PERSUADE: {
    nameKey: 'verb.PERSUADE', descriptionKey: 'verb.PERSUADE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  INTIMIDATE: {
    nameKey: 'verb.INTIMIDATE', descriptionKey: 'verb.INTIMIDATE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  DECEIVE: {
    nameKey: 'verb.DECEIVE', descriptionKey: 'verb.DECEIVE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  DISTRACT: {
    nameKey: 'verb.DISTRACT', descriptionKey: 'verb.DISTRACT.description',
    requirements: { targetProps: [['sentient'], ['electronic']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  BARTER: {
    nameKey: 'verb.BARTER', descriptionKey: 'verb.BARTER.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  SEDUCE: {
    nameKey: 'verb.SEDUCE', descriptionKey: 'verb.SEDUCE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  COMMAND: {
    nameKey: 'verb.COMMAND', descriptionKey: 'verb.COMMAND.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  CALM: {
    nameKey: 'verb.CALM', descriptionKey: 'verb.CALM.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  PROVOKE: {
    nameKey: 'verb.PROVOKE', descriptionKey: 'verb.PROVOKE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  PLEAD: {
    nameKey: 'verb.PLEAD', descriptionKey: 'verb.PLEAD.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  INTERROGATE: {
    nameKey: 'verb.INTERROGATE', descriptionKey: 'verb.INTERROGATE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  SIGNAL: {
    nameKey: 'verb.SIGNAL', descriptionKey: 'verb.SIGNAL.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  LURE: {
    nameKey: 'verb.LURE', descriptionKey: 'verb.LURE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },

  // ── AGI (9) ───────────────────────────────────────────────────────────
  THROW: {
    nameKey: 'verb.THROW', descriptionKey: 'verb.THROW.description',
    requirements: { targetProps: [['liftable'], ['small']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  SHOOT: {
    nameKey: 'verb.SHOOT', descriptionKey: 'verb.SHOOT.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: 'ranged' },
    difficultyMod: 0, auto: false,
  },
  CLIMB: {
    nameKey: 'verb.CLIMB', descriptionKey: 'verb.CLIMB.description',
    requirements: { targetProps: [['climbable'], ['large']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  JUMP: {
    nameKey: 'verb.JUMP', descriptionKey: 'verb.JUMP.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  DODGE: {
    nameKey: 'verb.DODGE', descriptionKey: 'verb.DODGE.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  SWIM: {
    nameKey: 'verb.SWIM', descriptionKey: 'verb.SWIM.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  RUN: {
    nameKey: 'verb.RUN', descriptionKey: 'verb.RUN.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  HIDE: {
    nameKey: 'verb.HIDE', descriptionKey: 'verb.HIDE.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  STACK: {
    nameKey: 'verb.STACK', descriptionKey: 'verb.STACK.description',
    requirements: { targetProps: [['liftable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },

  // ── Interaction / Auto (12) ───────────────────────────────────────────
  USE: {
    nameKey: 'verb.USE', descriptionKey: 'verb.USE.description',
    requirements: { targetProps: [['usable']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  OPEN: {
    nameKey: 'verb.OPEN', descriptionKey: 'verb.OPEN.description',
    requirements: { targetProps: [['openable']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  CLOSE: {
    nameKey: 'verb.CLOSE', descriptionKey: 'verb.CLOSE.description',
    requirements: { targetProps: [['openable']], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  TAKE: {
    nameKey: 'verb.TAKE', descriptionKey: 'verb.TAKE.description',
    requirements: { targetProps: [['liftable'], ['small']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  DROP: {
    nameKey: 'verb.DROP', descriptionKey: 'verb.DROP.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  GIVE: {
    nameKey: 'verb.GIVE', descriptionKey: 'verb.GIVE.description',
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  EQUIP: {
    nameKey: 'verb.EQUIP', descriptionKey: 'verb.EQUIP.description',
    requirements: { targetProps: [['equippable']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  EAT: {
    nameKey: 'verb.EAT', descriptionKey: 'verb.EAT.description',
    requirements: { targetProps: [['edible']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  DRINK: {
    nameKey: 'verb.DRINK', descriptionKey: 'verb.DRINK.description',
    requirements: { targetProps: [['liquid'], ['drinkable']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  MOVE_TO: {
    nameKey: 'verb.MOVE_TO', descriptionKey: 'verb.MOVE_TO.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  WAIT: {
    nameKey: 'verb.WAIT', descriptionKey: 'verb.WAIT.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  TOUCH: {
    nameKey: 'verb.TOUCH', descriptionKey: 'verb.TOUCH.description',
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },

  // ── Secret (7) ────────────────────────────────────────────────────────
  // Gestures, not attempts: they always work, they change nothing, and the
  // game never proposes them (decision W).
  PRAY: {
    nameKey: 'verb.PRAY', descriptionKey: 'verb.PRAY.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
  DANCE: {
    nameKey: 'verb.DANCE', descriptionKey: 'verb.DANCE.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
  NAME: {
    nameKey: 'verb.NAME', descriptionKey: 'verb.NAME.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
  SING: {
    nameKey: 'verb.SING', descriptionKey: 'verb.SING.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
  APOLOGIZE: {
    nameKey: 'verb.APOLOGIZE', descriptionKey: 'verb.APOLOGIZE.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
  WHISPER: {
    nameKey: 'verb.WHISPER', descriptionKey: 'verb.WHISPER.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
  REMEMBER: {
    nameKey: 'verb.REMEMBER', descriptionKey: 'verb.REMEMBER.description',
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true, secret: true,
  },
} as const;

/** Verbs the game never proposes: the player has to think of them. */
export const SECRET_VERBS: ReadonlySet<VerbId> = new Set(
  VERB_IDS.filter(v => VERB_REGISTRY[v].secret === true),
);

// === VERB-TO-STAT MAPPING ===

/**
 * Primary stat of every verb. Typed on VerbId so a missing entry is a compile
 * error: USE, OPEN and CLOSE were absent and silently fell back to FOR, making
 * terminals and medkits Strength checks.
 */
export const VERB_STATS: Readonly<Record<VerbId, StatId>> = {
  // FOR (14)
  STRIKE: 'FOR', PUSH: 'FOR', PULL: 'FOR', LIFT: 'FOR',
  KICK: 'FOR', BREAK: 'FOR', BEND: 'FOR', CUT: 'FOR',
  FORCE_OPEN: 'FOR', BITE: 'FOR', SQUEEZE: 'FOR',
  IMPROVISE_WEAPON: 'FOR', SACRIFICE: 'FOR', SELF_HARM: 'FOR',
  // DEF (3)
  BLOCK: 'DEF', IMPROVISE_SHIELD: 'DEF', BARRICADE: 'DEF',
  // INT (22)
  READ: 'INT', HACK: 'INT', REPAIR: 'INT',
  DISASSEMBLE: 'INT', ASSEMBLE: 'INT', ACTIVATE: 'INT',
  DEACTIVATE: 'INT', REPROGRAM: 'INT', LOCK: 'INT',
  UNLOCK: 'INT', WELD: 'INT', PLUG: 'INT',
  OVERRIDE: 'INT', SABOTAGE: 'INT', SET_TRAP: 'INT',
  IMPROVISE_TOOL: 'INT', WEDGE: 'INT', IGNITE: 'INT',
  FLOOD: 'INT', ELECTRIFY: 'INT', TIE: 'INT', COVER: 'INT',
  // PER (4)
  EXAMINE: 'PER', LISTEN: 'PER', SMELL: 'PER', SCAN: 'PER',
  // CHA (14)
  TALK: 'CHA', PERSUADE: 'CHA', INTIMIDATE: 'CHA',
  DECEIVE: 'CHA', DISTRACT: 'CHA', BARTER: 'CHA',
  SEDUCE: 'CHA', COMMAND: 'CHA', CALM: 'CHA',
  PROVOKE: 'CHA', PLEAD: 'CHA', INTERROGATE: 'CHA',
  SIGNAL: 'CHA', LURE: 'CHA',
  // AGI (9)
  THROW: 'AGI', SHOOT: 'AGI', CLIMB: 'AGI', JUMP: 'AGI',
  DODGE: 'AGI', SWIM: 'AGI', RUN: 'AGI', HIDE: 'AGI', STACK: 'AGI',
  // Interaction verbs. USE/OPEN/CLOSE are refined by the target below.
  USE: 'INT', OPEN: 'FOR', CLOSE: 'FOR',
  TAKE: 'AGI', DROP: 'AGI', GIVE: 'CHA', EQUIP: 'AGI',
  EAT: 'FOR', DRINK: 'FOR', MOVE_TO: 'AGI', WAIT: 'PER', TOUCH: 'PER',
  // Secret (7) — never rolled, but the table must stay total.
  PRAY: 'CHA', DANCE: 'AGI', NAME: 'CHA', SING: 'CHA',
  APOLOGIZE: 'CHA', WHISPER: 'CHA', REMEMBER: 'INT',
} as const;

/**
 * Target-dependent stat overrides, evaluated in order — first match wins.
 * Opening an electronic hatch is an Intelligence problem; opening a jammed
 * blast door is a Strength one, and the same verb covers both.
 */
const CONTEXTUAL_VERB_STATS: Partial<Record<VerbId, readonly (readonly [PropertyId, StatId])[]>> = {
  USE: [
    ['electronic', 'INT'],
    ['programmable', 'INT'],
    ['injectable', 'INT'],
    ['readable', 'INT'],
    ['heavy', 'FOR'],
  ],
  OPEN: [
    ['electronic', 'INT'],
    ['programmable', 'INT'],
    ['small', 'AGI'],
  ],
  CLOSE: [
    ['electronic', 'INT'],
    ['programmable', 'INT'],
    ['small', 'AGI'],
  ],
};

/** Resolve the stat a verb rolls against, refined by the target's properties. */
export function getVerbStat(verb: VerbId, targetProps: readonly PropertyId[] = []): StatId {
  const overrides = CONTEXTUAL_VERB_STATS[verb];
  if (overrides) {
    for (const [property, stat] of overrides) {
      if (targetProps.includes(property)) return stat;
    }
  }
  return VERB_STATS[verb];
}

// === MOVEMENT VERBS ===

/** Verbs that cause location change when targeting a connected_location */
export const MOVEMENT_VERBS: ReadonlySet<VerbId> = new Set<VerbId>([
  'MOVE_TO', 'RUN', 'CLIMB',
]);

// === AUTO VERBS ===

/** Verbs that resolve automatically without a dice roll */
export const AUTO_VERBS: ReadonlySet<VerbId> = new Set<VerbId>([
  'TAKE', 'DROP', 'GIVE', 'EQUIP', 'EAT', 'DRINK',
  'MOVE_TO', 'WAIT', 'TOUCH',
]);

/**
 * Whether a verb resolves without a roll against this particular target.
 * OPEN and CLOSE are automatic unless something actually holds the target shut.
 */
export function isAutoVerb(
  verb: VerbId,
  targetProps: readonly PropertyId[] = [],
  targetState: EntityState = {},
): boolean {
  if (AUTO_VERBS.has(verb)) return true;
  if (verb !== 'OPEN' && verb !== 'CLOSE') return false;
  if (resistsOpening(targetState)) return false;
  return !targetProps.includes('sealed') && !targetProps.includes('secured');
}

/** Verbs that only observe. They meet no resistance, so they cannot be refused. */
const OBSERVING_VERBS: ReadonlySet<VerbId> = new Set<VerbId>([
  'EXAMINE', 'READ', 'SCAN', 'LISTEN', 'SMELL',
]);

/**
 * Whether nothing can stand in the way of this verb on this target.
 * Used to requalify scenario rules written with `dc: null` (decision Z): a beat
 * that only delivers information stays guaranteed, an act that overcomes
 * something gets a real check.
 */
export function isUnresistedVerb(
  verb: VerbId,
  targetProps: readonly PropertyId[] = [],
  targetState: EntityState = {},
): boolean {
  return OBSERVING_VERBS.has(verb) || isAutoVerb(verb, targetProps, targetState);
}
