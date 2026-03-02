// ---------------------------------------------------------------------------
// src/engine/verbs.ts — Verb registry with aliases, stat mapping, requirements
// ---------------------------------------------------------------------------

import type { StatId } from './types';
import type { PropertyId } from './properties';
import type { StringKey } from '@i18n/types';

// === VERB ID UNION ===

/** All valid verb identifiers */
export type VerbId =
  // FOR (13)
  | 'STRIKE' | 'PUSH' | 'PULL' | 'LIFT' | 'KICK'
  | 'BREAK' | 'BEND' | 'CUT' | 'FORCE_OPEN' | 'BITE'
  | 'SQUEEZE' | 'IMPROVISE_WEAPON' | 'SACRIFICE'
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
  | 'WAIT' | 'TOUCH';

/** All valid verb IDs as a runtime array */
export const VERB_IDS: readonly VerbId[] = [
  // FOR (13)
  'STRIKE', 'PUSH', 'PULL', 'LIFT', 'KICK',
  'BREAK', 'BEND', 'CUT', 'FORCE_OPEN', 'BITE',
  'SQUEEZE', 'IMPROVISE_WEAPON', 'SACRIFICE',
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
}

// === VERB ENTRY ===

/** Full definition of a verb */
export interface VerbEntry {
  readonly nameKey: StringKey;
  readonly descriptionKey: StringKey;
  readonly aliases: {
    readonly fr: readonly string[];
    readonly en: readonly string[];
  };
  readonly requirements: VerbRequirements;
  readonly difficultyMod: number;
  readonly auto: boolean;
}

/** Registry mapping every verb to its definition */
export type VerbRegistry = Readonly<Record<VerbId, VerbEntry>>;

// === VERB REGISTRY ===

export const VERB_REGISTRY: VerbRegistry = {
  // ── FOR (13) ──────────────────────────────────────────────────────────
  STRIKE: {
    nameKey: 'verb.STRIKE', descriptionKey: 'verb.STRIKE.description',
    aliases: {
      fr: ['frapper', 'taper', 'cogner', 'battre', 'assommer'],
      en: ['hit', 'strike', 'punch', 'beat', 'bash', 'slam'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  PUSH: {
    nameKey: 'verb.PUSH', descriptionKey: 'verb.PUSH.description',
    aliases: {
      fr: ['pousser', 'repousser', 'bousculer', 'deplacer'],
      en: ['push', 'shove', 'move', 'budge'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  PULL: {
    nameKey: 'verb.PULL', descriptionKey: 'verb.PULL.description',
    aliases: {
      fr: ['tirer', 'arracher', 'extraire', 'retirer'],
      en: ['pull', 'yank', 'rip', 'extract'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  LIFT: {
    nameKey: 'verb.LIFT', descriptionKey: 'verb.LIFT.description',
    aliases: {
      fr: ['soulever', 'porter', 'lever'],
      en: ['lift', 'carry', 'raise', 'hoist'],
    },
    requirements: { targetProps: [['liftable']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  KICK: {
    nameKey: 'verb.KICK', descriptionKey: 'verb.KICK.description',
    aliases: {
      fr: ['donner un coup de pied', 'shooter', 'botter'],
      en: ['kick', 'boot', 'punt'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  BREAK: {
    nameKey: 'verb.BREAK', descriptionKey: 'verb.BREAK.description',
    aliases: {
      fr: ['casser', 'briser', 'fracasser', 'detruire', 'defoncer'],
      en: ['break', 'smash', 'shatter', 'destroy', 'bust'],
    },
    requirements: { targetProps: [['breakable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  BEND: {
    nameKey: 'verb.BEND', descriptionKey: 'verb.BEND.description',
    aliases: {
      fr: ['tordre', 'plier', 'deformer'],
      en: ['bend', 'twist', 'warp'],
    },
    requirements: { targetProps: [['malleable']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  CUT: {
    nameKey: 'verb.CUT', descriptionKey: 'verb.CUT.description',
    aliases: {
      fr: ['couper', 'trancher', 'tailler', 'decouper'],
      en: ['cut', 'slice', 'carve', 'sever'],
    },
    requirements: { targetProps: [['cuttable']], requiredToolProp: 'bladed' },
    difficultyMod: 0, auto: false,
  },
  FORCE_OPEN: {
    nameKey: 'verb.FORCE_OPEN', descriptionKey: 'verb.FORCE_OPEN.description',
    aliases: {
      fr: ['forcer', 'enfoncer'],
      en: ['force open', 'bash open', 'pry open'],
    },
    requirements: { targetProps: [['openable', 'locked']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  BITE: {
    nameKey: 'verb.BITE', descriptionKey: 'verb.BITE.description',
    aliases: {
      fr: ['mordre', 'croquer'],
      en: ['bite', 'chew', 'gnaw'],
    },
    requirements: { targetProps: [['tangible', 'small']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  SQUEEZE: {
    nameKey: 'verb.SQUEEZE', descriptionKey: 'verb.SQUEEZE.description',
    aliases: {
      fr: ['serrer', 'ecraser', 'comprimer'],
      en: ['squeeze', 'crush', 'compress'],
    },
    requirements: { targetProps: [['small'], ['soft']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  IMPROVISE_WEAPON: {
    nameKey: 'verb.IMPROVISE_WEAPON', descriptionKey: 'verb.IMPROVISE_WEAPON.description',
    aliases: {
      fr: ['utiliser comme arme', 'improviser une arme'],
      en: ['use as weapon', 'wield', 'weaponize'],
    },
    requirements: { targetProps: [['liftable'], ['holdable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  SACRIFICE: {
    nameKey: 'verb.SACRIFICE', descriptionKey: 'verb.SACRIFICE.description',
    aliases: {
      fr: ['sacrifier', 'se sacrifier', 'offrir'],
      en: ['sacrifice', 'offer', 'give up'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },

  // ── DEF (3) ───────────────────────────────────────────────────────────
  BLOCK: {
    nameKey: 'verb.BLOCK', descriptionKey: 'verb.BLOCK.description',
    aliases: {
      fr: ['bloquer', 'parer', 'se proteger'],
      en: ['block', 'parry', 'shield', 'guard'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  IMPROVISE_SHIELD: {
    nameKey: 'verb.IMPROVISE_SHIELD', descriptionKey: 'verb.IMPROVISE_SHIELD.description',
    aliases: {
      fr: ['utiliser comme bouclier', 'se proteger avec'],
      en: ['use as shield', 'block with'],
    },
    requirements: { targetProps: [['holdable', 'rigid']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  BARRICADE: {
    nameKey: 'verb.BARRICADE', descriptionKey: 'verb.BARRICADE.description',
    aliases: {
      fr: ['barricader', 'bloquer', 'obstruer'],
      en: ['barricade', 'block', 'obstruct'],
    },
    requirements: { targetProps: [['openable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },

  // ── INT (22) ──────────────────────────────────────────────────────────
  READ: {
    nameKey: 'verb.READ', descriptionKey: 'verb.READ.description',
    aliases: {
      fr: ['lire', 'dechiffrer', 'consulter'],
      en: ['read', 'decipher', 'consult'],
    },
    requirements: { targetProps: [['readable']], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  HACK: {
    nameKey: 'verb.HACK', descriptionKey: 'verb.HACK.description',
    aliases: {
      fr: ['pirater', 'hacker', 'cracker', 'bypasser'],
      en: ['hack', 'crack', 'bypass', 'breach'],
    },
    requirements: { targetProps: [['electronic', 'secured']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  REPAIR: {
    nameKey: 'verb.REPAIR', descriptionKey: 'verb.REPAIR.description',
    aliases: {
      fr: ['reparer', 'rafistoler', 'bricoler', 'fixer'],
      en: ['repair', 'fix', 'patch', 'mend'],
    },
    requirements: { targetProps: [['mechanical'], ['electronic']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  DISASSEMBLE: {
    nameKey: 'verb.DISASSEMBLE', descriptionKey: 'verb.DISASSEMBLE.description',
    aliases: {
      fr: ['demonter', 'desassembler'],
      en: ['disassemble', 'take apart', 'dismantle'],
    },
    requirements: { targetProps: [['mechanical'], ['electronic']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  ASSEMBLE: {
    nameKey: 'verb.ASSEMBLE', descriptionKey: 'verb.ASSEMBLE.description',
    aliases: {
      fr: ['assembler', 'combiner', 'construire', 'fabriquer'],
      en: ['assemble', 'combine', 'build', 'craft'],
    },
    requirements: { targetProps: [['component']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  ACTIVATE: {
    nameKey: 'verb.ACTIVATE', descriptionKey: 'verb.ACTIVATE.description',
    aliases: {
      fr: ['activer', 'allumer', 'demarrer'],
      en: ['activate', 'turn on', 'start', 'power up'],
    },
    requirements: { targetProps: [['electronic'], ['mechanical']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  DEACTIVATE: {
    nameKey: 'verb.DEACTIVATE', descriptionKey: 'verb.DEACTIVATE.description',
    aliases: {
      fr: ['desactiver', 'eteindre', 'couper'],
      en: ['deactivate', 'turn off', 'shut down'],
    },
    requirements: { targetProps: [['electronic'], ['mechanical']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  REPROGRAM: {
    nameKey: 'verb.REPROGRAM', descriptionKey: 'verb.REPROGRAM.description',
    aliases: {
      fr: ['reprogrammer', 'reconfigurer'],
      en: ['reprogram', 'reconfigure', 'recode'],
    },
    requirements: { targetProps: [['programmable']], requiredToolProp: null },
    difficultyMod: 4, auto: false,
  },
  LOCK: {
    nameKey: 'verb.LOCK', descriptionKey: 'verb.LOCK.description',
    aliases: {
      fr: ['verrouiller', 'fermer a cle'],
      en: ['lock', 'secure', 'bolt'],
    },
    requirements: { targetProps: [['lockable']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  UNLOCK: {
    nameKey: 'verb.UNLOCK', descriptionKey: 'verb.UNLOCK.description',
    aliases: {
      fr: ['deverrouiller', 'ouvrir', 'crocheter'],
      en: ['unlock', 'pick', 'open lock'],
    },
    requirements: { targetProps: [['locked']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  WELD: {
    nameKey: 'verb.WELD', descriptionKey: 'verb.WELD.description',
    aliases: {
      fr: ['souder', 'fusionner', 'sceller'],
      en: ['weld', 'fuse', 'seal'],
    },
    requirements: { targetProps: [['metallic']], requiredToolProp: 'heat_source' },
    difficultyMod: 2, auto: false,
  },
  PLUG: {
    nameKey: 'verb.PLUG', descriptionKey: 'verb.PLUG.description',
    aliases: {
      fr: ['brancher', 'connecter', 'raccorder'],
      en: ['plug', 'connect', 'hook up'],
    },
    requirements: { targetProps: [['electronic', 'port']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  OVERRIDE: {
    nameKey: 'verb.OVERRIDE', descriptionKey: 'verb.OVERRIDE.description',
    aliases: {
      fr: ['court-circuiter', 'shunter', 'contourner'],
      en: ['override', 'short-circuit', 'bypass'],
    },
    requirements: { targetProps: [['electronic']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  SABOTAGE: {
    nameKey: 'verb.SABOTAGE', descriptionKey: 'verb.SABOTAGE.description',
    aliases: {
      fr: ['saboter', 'pieger', 'trafiquer'],
      en: ['sabotage', 'booby-trap', 'tamper'],
    },
    requirements: { targetProps: [['mechanical'], ['electronic']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  SET_TRAP: {
    nameKey: 'verb.SET_TRAP', descriptionKey: 'verb.SET_TRAP.description',
    aliases: {
      fr: ['pieger', 'tendre un piege'],
      en: ['set trap', 'lay trap', 'booby-trap'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  IMPROVISE_TOOL: {
    nameKey: 'verb.IMPROVISE_TOOL', descriptionKey: 'verb.IMPROVISE_TOOL.description',
    aliases: {
      fr: ['utiliser comme outil', 'improviser un outil'],
      en: ['use as tool', 'improvise tool'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  WEDGE: {
    nameKey: 'verb.WEDGE', descriptionKey: 'verb.WEDGE.description',
    aliases: {
      fr: ['coincer', 'caler', 'bloquer avec'],
      en: ['wedge', 'jam', 'brace'],
    },
    requirements: { targetProps: [['rigid', 'small']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  IGNITE: {
    nameKey: 'verb.IGNITE', descriptionKey: 'verb.IGNITE.description',
    aliases: {
      fr: ['enflammer', 'bruler', 'mettre le feu'],
      en: ['ignite', 'burn', 'set fire'],
    },
    requirements: { targetProps: [['flammable']], requiredToolProp: 'heat_source' },
    difficultyMod: 2, auto: false,
  },
  FLOOD: {
    nameKey: 'verb.FLOOD', descriptionKey: 'verb.FLOOD.description',
    aliases: {
      fr: ['inonder', 'remplir d\'eau', 'noyer'],
      en: ['flood', 'fill with water', 'drown'],
    },
    requirements: { targetProps: [], requiredToolProp: 'liquid_source' },
    difficultyMod: 3, auto: false,
  },
  ELECTRIFY: {
    nameKey: 'verb.ELECTRIFY', descriptionKey: 'verb.ELECTRIFY.description',
    aliases: {
      fr: ['electrifier', 'electrocuter'],
      en: ['electrify', 'electrocute', 'shock'],
    },
    requirements: { targetProps: [['conductive']], requiredToolProp: 'power_source' },
    difficultyMod: 3, auto: false,
  },
  TIE: {
    nameKey: 'verb.TIE', descriptionKey: 'verb.TIE.description',
    aliases: {
      fr: ['attacher', 'ligoter', 'nouer'],
      en: ['tie', 'bind', 'restrain'],
    },
    requirements: { targetProps: [], requiredToolProp: 'flexible' },
    difficultyMod: 1, auto: false,
  },
  COVER: {
    nameKey: 'verb.COVER', descriptionKey: 'verb.COVER.description',
    aliases: {
      fr: ['couvrir', 'recouvrir', 'masquer'],
      en: ['cover', 'conceal', 'hide'],
    },
    requirements: { targetProps: [['coverable']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },

  // ── PER (4) ───────────────────────────────────────────────────────────
  EXAMINE: {
    nameKey: 'verb.EXAMINE', descriptionKey: 'verb.EXAMINE.description',
    aliases: {
      fr: ['examiner', 'inspecter', 'observer', 'regarder', 'etudier', 'fouiller'],
      en: ['examine', 'inspect', 'look at', 'study', 'search'],
    },
    requirements: { targetProps: [['tangible'], ['visible']], requiredToolProp: null },
    difficultyMod: -3, auto: false,
  },
  LISTEN: {
    nameKey: 'verb.LISTEN', descriptionKey: 'verb.LISTEN.description',
    aliases: {
      fr: ['ecouter', 'tendre l\'oreille'],
      en: ['listen', 'hear', 'eavesdrop'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  SMELL: {
    nameKey: 'verb.SMELL', descriptionKey: 'verb.SMELL.description',
    aliases: {
      fr: ['sentir', 'renifler'],
      en: ['smell', 'sniff', 'scent'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  SCAN: {
    nameKey: 'verb.SCAN', descriptionKey: 'verb.SCAN.description',
    aliases: {
      fr: ['scanner', 'analyser', 'detecter'],
      en: ['scan', 'analyze', 'detect'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: 'electronic' },
    difficultyMod: -1, auto: false,
  },

  // ── CHA (14) ──────────────────────────────────────────────────────────
  TALK: {
    nameKey: 'verb.TALK', descriptionKey: 'verb.TALK.description',
    aliases: {
      fr: ['parler', 'discuter', 'dialoguer'],
      en: ['talk', 'speak', 'converse'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  PERSUADE: {
    nameKey: 'verb.PERSUADE', descriptionKey: 'verb.PERSUADE.description',
    aliases: {
      fr: ['persuader', 'convaincre'],
      en: ['persuade', 'convince', 'sway'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  INTIMIDATE: {
    nameKey: 'verb.INTIMIDATE', descriptionKey: 'verb.INTIMIDATE.description',
    aliases: {
      fr: ['intimider', 'menacer'],
      en: ['intimidate', 'threaten', 'menace'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  DECEIVE: {
    nameKey: 'verb.DECEIVE', descriptionKey: 'verb.DECEIVE.description',
    aliases: {
      fr: ['tromper', 'mentir', 'duper'],
      en: ['deceive', 'lie', 'trick'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  DISTRACT: {
    nameKey: 'verb.DISTRACT', descriptionKey: 'verb.DISTRACT.description',
    aliases: {
      fr: ['distraire', 'detourner l\'attention'],
      en: ['distract', 'divert', 'draw away'],
    },
    requirements: { targetProps: [['sentient'], ['electronic']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  BARTER: {
    nameKey: 'verb.BARTER', descriptionKey: 'verb.BARTER.description',
    aliases: {
      fr: ['troquer', 'echanger', 'negocier'],
      en: ['barter', 'trade', 'negotiate'],
    },
    requirements: { targetProps: [['sentient', 'willing']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  SEDUCE: {
    nameKey: 'verb.SEDUCE', descriptionKey: 'verb.SEDUCE.description',
    aliases: {
      fr: ['seduire', 'charmer'],
      en: ['seduce', 'charm', 'flirt'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 3, auto: false,
  },
  COMMAND: {
    nameKey: 'verb.COMMAND', descriptionKey: 'verb.COMMAND.description',
    aliases: {
      fr: ['commander', 'ordonner'],
      en: ['command', 'order', 'direct'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  CALM: {
    nameKey: 'verb.CALM', descriptionKey: 'verb.CALM.description',
    aliases: {
      fr: ['calmer', 'apaiser'],
      en: ['calm', 'soothe', 'pacify'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  PROVOKE: {
    nameKey: 'verb.PROVOKE', descriptionKey: 'verb.PROVOKE.description',
    aliases: {
      fr: ['provoquer', 'enrager'],
      en: ['provoke', 'taunt', 'goad'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  PLEAD: {
    nameKey: 'verb.PLEAD', descriptionKey: 'verb.PLEAD.description',
    aliases: {
      fr: ['supplier', 'implorer'],
      en: ['plead', 'beg', 'implore'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  INTERROGATE: {
    nameKey: 'verb.INTERROGATE', descriptionKey: 'verb.INTERROGATE.description',
    aliases: {
      fr: ['interroger', 'questionner'],
      en: ['interrogate', 'question', 'grill'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  SIGNAL: {
    nameKey: 'verb.SIGNAL', descriptionKey: 'verb.SIGNAL.description',
    aliases: {
      fr: ['signaler', 'faire signe'],
      en: ['signal', 'wave', 'gesture'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  LURE: {
    nameKey: 'verb.LURE', descriptionKey: 'verb.LURE.description',
    aliases: {
      fr: ['attirer', 'appater'],
      en: ['lure', 'bait', 'entice'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },

  // ── AGI (9) ───────────────────────────────────────────────────────────
  THROW: {
    nameKey: 'verb.THROW', descriptionKey: 'verb.THROW.description',
    aliases: {
      fr: ['lancer', 'jeter', 'balancer', 'projeter'],
      en: ['throw', 'hurl', 'toss', 'fling'],
    },
    requirements: { targetProps: [['liftable'], ['small']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  SHOOT: {
    nameKey: 'verb.SHOOT', descriptionKey: 'verb.SHOOT.description',
    aliases: {
      fr: ['tirer', 'tirer sur', 'viser', 'faire feu'],
      en: ['shoot', 'fire', 'aim', 'blast'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: 'ranged' },
    difficultyMod: 0, auto: false,
  },
  CLIMB: {
    nameKey: 'verb.CLIMB', descriptionKey: 'verb.CLIMB.description',
    aliases: {
      fr: ['grimper', 'escalader', 'monter'],
      en: ['climb', 'scale', 'ascend'],
    },
    requirements: { targetProps: [['climbable'], ['large']], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  JUMP: {
    nameKey: 'verb.JUMP', descriptionKey: 'verb.JUMP.description',
    aliases: {
      fr: ['sauter', 'bondir', 'enjamber'],
      en: ['jump', 'leap', 'vault'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  DODGE: {
    nameKey: 'verb.DODGE', descriptionKey: 'verb.DODGE.description',
    aliases: {
      fr: ['esquiver', 'eviter', 'se baisser'],
      en: ['dodge', 'evade', 'duck'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  SWIM: {
    nameKey: 'verb.SWIM', descriptionKey: 'verb.SWIM.description',
    aliases: {
      fr: ['nager', 'plonger'],
      en: ['swim', 'dive', 'wade'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 2, auto: false,
  },
  RUN: {
    nameKey: 'verb.RUN', descriptionKey: 'verb.RUN.description',
    aliases: {
      fr: ['courir', 'sprinter', 'fuir', 's\'enfuir'],
      en: ['run', 'sprint', 'flee', 'dash'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  HIDE: {
    nameKey: 'verb.HIDE', descriptionKey: 'verb.HIDE.description',
    aliases: {
      fr: ['se cacher', 'se planquer', 'se dissimuler'],
      en: ['hide', 'conceal yourself', 'take cover'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },
  STACK: {
    nameKey: 'verb.STACK', descriptionKey: 'verb.STACK.description',
    aliases: {
      fr: ['empiler', 'entasser'],
      en: ['stack', 'pile up'],
    },
    requirements: { targetProps: [['liftable']], requiredToolProp: null },
    difficultyMod: 1, auto: false,
  },

  // ── Interaction / Auto (12) ───────────────────────────────────────────
  USE: {
    nameKey: 'verb.USE', descriptionKey: 'verb.USE.description',
    aliases: {
      fr: ['utiliser', 'employer'],
      en: ['use', 'employ', 'apply'],
    },
    requirements: { targetProps: [['usable']], requiredToolProp: null },
    difficultyMod: 0, auto: false,
  },
  OPEN: {
    nameKey: 'verb.OPEN', descriptionKey: 'verb.OPEN.description',
    aliases: {
      fr: ['ouvrir', 'debloquer'],
      en: ['open', 'unseal'],
    },
    requirements: { targetProps: [['openable']], requiredToolProp: null },
    difficultyMod: -1, auto: false,
  },
  CLOSE: {
    nameKey: 'verb.CLOSE', descriptionKey: 'verb.CLOSE.description',
    aliases: {
      fr: ['fermer', 'refermer'],
      en: ['close', 'shut'],
    },
    requirements: { targetProps: [['openable']], requiredToolProp: null },
    difficultyMod: -2, auto: false,
  },
  TAKE: {
    nameKey: 'verb.TAKE', descriptionKey: 'verb.TAKE.description',
    aliases: {
      fr: ['prendre', 'ramasser', 'recuperer'],
      en: ['take', 'pick up', 'grab'],
    },
    requirements: { targetProps: [['liftable'], ['small']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  DROP: {
    nameKey: 'verb.DROP', descriptionKey: 'verb.DROP.description',
    aliases: {
      fr: ['poser', 'lacher', 'deposer'],
      en: ['drop', 'put down', 'discard'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  GIVE: {
    nameKey: 'verb.GIVE', descriptionKey: 'verb.GIVE.description',
    aliases: {
      fr: ['donner', 'offrir'],
      en: ['give', 'hand over', 'offer'],
    },
    requirements: { targetProps: [['sentient']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  EQUIP: {
    nameKey: 'verb.EQUIP', descriptionKey: 'verb.EQUIP.description',
    aliases: {
      fr: ['equiper', 'porter'],
      en: ['equip', 'wear', 'wield'],
    },
    requirements: { targetProps: [['equippable']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  EAT: {
    nameKey: 'verb.EAT', descriptionKey: 'verb.EAT.description',
    aliases: {
      fr: ['manger', 'avaler', 'consommer'],
      en: ['eat', 'consume', 'devour'],
    },
    requirements: { targetProps: [['edible'], ['small']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  DRINK: {
    nameKey: 'verb.DRINK', descriptionKey: 'verb.DRINK.description',
    aliases: {
      fr: ['boire', 'avaler'],
      en: ['drink', 'sip', 'gulp'],
    },
    requirements: { targetProps: [['liquid'], ['drinkable']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  MOVE_TO: {
    nameKey: 'verb.MOVE_TO', descriptionKey: 'verb.MOVE_TO.description',
    aliases: {
      fr: ['aller', 'se deplacer', 'se rendre'],
      en: ['go', 'move to', 'walk to'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  WAIT: {
    nameKey: 'verb.WAIT', descriptionKey: 'verb.WAIT.description',
    aliases: {
      fr: ['attendre', 'patienter'],
      en: ['wait', 'stay', 'hold'],
    },
    requirements: { targetProps: [], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
  TOUCH: {
    nameKey: 'verb.TOUCH', descriptionKey: 'verb.TOUCH.description',
    aliases: {
      fr: ['toucher', 'tater', 'palper'],
      en: ['touch', 'feel', 'poke'],
    },
    requirements: { targetProps: [['tangible']], requiredToolProp: null },
    difficultyMod: 0, auto: true,
  },
} as const;

// === VERB-TO-STAT MAPPING ===

/** Maps stat-based verbs to their primary stat. Auto/interaction verbs are excluded. */
export const VERB_STATS: Readonly<Record<string, StatId>> = {
  // FOR (13)
  STRIKE: 'FOR', PUSH: 'FOR', PULL: 'FOR', LIFT: 'FOR',
  KICK: 'FOR', BREAK: 'FOR', BEND: 'FOR', CUT: 'FOR',
  FORCE_OPEN: 'FOR', BITE: 'FOR', SQUEEZE: 'FOR',
  IMPROVISE_WEAPON: 'FOR', SACRIFICE: 'FOR',
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
} as const;

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
