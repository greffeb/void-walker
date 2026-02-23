// ---------------------------------------------------------------------------
// src/ui/hooks/useGameLoop.ts — New game loop hook
// ---------------------------------------------------------------------------
// Situation → User Input → Resolution → Feedback → Next Situation
// Replaces the old REPL engine with a streamlined game loop.
// ---------------------------------------------------------------------------

import { useReducer, useCallback } from 'react';
import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import { CLASSES, CLASS_LIST } from '@content/classes';
import { ITEM_DEFINITIONS } from '@content/items';
import { NPC_DEFINITIONS } from '@content/npcs';
import { buildParserLocaleData } from '@content/parserData';
import { generateSituation, type Situation } from '@content/situationGenerator';
import {
  parseAction, calculateDifficulty, rollCheck, classifyOutcome,
  resolvePlayerAttack, attemptFlee,
  isReformulation,
} from '@engine/index';
import { VERB_REGISTRY, VERB_STATS, AUTO_VERBS, type VerbId } from '@engine/verbs';
import { BALANCE } from '@engine/constants';
import type {
  StatId, PlayerClassName, CombatNPCState, WeakPoint,
  CharacterState, ParsedAction, DiceResult, RollOutcome,
} from '@engine/types';

// === TYPES ===

/** Phase of the game loop for a single turn */
export type TurnPhase =
  | 'class_select'
  | 'situation'
  | 'resolution'
  | 'feedback';

/** Resolution data from processing a player action */
export interface ResolutionData {
  readonly input: string;
  readonly verb: VerbId;
  readonly verbName: string;
  readonly targetName: string;
  readonly targetId: string;
  readonly stat: StatId;
  readonly statValue: number;
  readonly diceResult: DiceResult;
  readonly dc: number;
  readonly outcome: RollOutcome;
  readonly outcomeLabel: string;
  readonly difficultyDetails: string[];
  readonly difficultyBreakdown: {
    readonly base: number;
    readonly verbMod: number;
    readonly compatibilityPenalty: number;
    readonly contextMods: number;
    readonly creativityMod: number;
    readonly presetMod: number;
    readonly total: number;
  };
  /** Combat-specific data */
  readonly combat: CombatResolution | null;
  /** Whether the action was creative (different from suggestions) */
  readonly creative: boolean;
  /** Whether this was an auto-action (no roll needed) */
  readonly auto: boolean;
}

/** Combat resolution details */
export interface CombatResolution {
  readonly hit: boolean;
  readonly npcDodged: boolean;
  readonly damageDealt: number;
  readonly critical: boolean;
  readonly weakPointHit: boolean;
  readonly npcKilled: boolean;
  readonly npcName: string;
  readonly npcHpBefore: number;
  readonly npcHpAfter: number;
  readonly fled: boolean;
  readonly fleeSuccess: boolean;
}

/** Feedback report data */
export interface FeedbackReport {
  readonly situationId: string;
  readonly situationType: string;
  readonly situationDescription: string;
  readonly locationName: string;
  readonly playerInput: string;
  readonly parsedVerb: string;
  readonly parsedTarget: string;
  readonly diceNatural: number;
  readonly diceTotal: number;
  readonly dc: number;
  readonly outcome: string;
  readonly playerClass: string;
  readonly thumbs: 'up' | 'down';
  readonly comment: string;
  readonly timestamp: number;
}

/** Complete game loop state */
export interface GameLoopState {
  readonly phase: TurnPhase;
  readonly character: CharacterState | null;
  readonly situation: Situation | null;
  readonly resolution: ResolutionData | null;
  readonly combat: CombatNPCState | null;
  readonly turnCount: number;
  readonly feedback: FeedbackReport[];
  readonly error: string | null;
}

/** Public interface returned by the hook */
export interface GameLoop {
  readonly state: GameLoopState;
  readonly selectClass: (className: PlayerClassName) => void;
  readonly submitAction: (input: string) => void;
  readonly submitFeedback: (thumbs: 'up' | 'down', comment?: string) => void;
  readonly nextSituation: () => void;
  readonly classList: typeof CLASS_LIST;
}

// === HELPERS ===

function ts(key: string): string {
  return t(key as StringKey);
}

function getVerbStat(verb: VerbId): StatId {
  return (VERB_STATS[verb] as StatId | undefined) ?? 'FOR';
}

function getOutcomeLabel(outcome: RollOutcome): string {
  switch (outcome) {
    case 'crit_success': return 'SUCCES CRITIQUE';
    case 'success': return 'SUCCES';
    case 'failure': return 'ECHEC';
    case 'crit_failure': return 'ECHEC CRITIQUE';
  }
}

// === CHARACTER CREATION ===

function createCharacter(className: PlayerClassName): CharacterState {
  const cls = CLASSES[className];
  const hp = cls.startingHp;
  return {
    name: `Joueur`,
    className,
    stats: { ...cls.baseStats },
    hp,
    maxHp: hp,
    oxygen: BALANCE.OXYGEN.MAX,
    inventory: [...cls.startingItems],
    equippedWeapon: cls.startingItems.find((id) => {
      const def = ITEM_DEFINITIONS[id];
      return def?.type === 'weapon';
    }) ?? null,
    equippedArmor: null,
    conditions: [],
  };
}

// === COMBAT NPC FACTORY ===

function createCombatNPC(npcId: string): CombatNPCState | null {
  const def = NPC_DEFINITIONS[npcId];
  if (!def) return null;
  const wp: WeakPoint | null = def.weakPoint
    ? {
        id: def.weakPoint.id,
        nameKey: def.weakPoint.nameKey,
        discoverMethod: def.weakPoint.discoverMethod,
        targetVerbs: [...def.weakPoint.targetVerbs],
        targetProperties: [...def.weakPoint.targetProperties],
        damageMultiplier: def.weakPoint.damageMultiplier,
        hintKey: def.weakPoint.hintKey,
        exploitKey: def.weakPoint.exploitKey,
      }
    : null;

  return {
    definitionId: npcId,
    hp: def.hp,
    maxHp: def.hp,
    attack: def.attack ?? def.damage,
    defense: def.defense ?? 0,
    dodgeChance: def.dodgeChance,
    fleeDC: def.fleeDC ?? 12,
    aggressionPattern: def.aggressionPattern,
    weakPoint: wp,
    weakPointDiscovered: false,
    combatRound: 1,
  };
}

// === REDUCER ===

type GameAction =
  | { type: 'SELECT_CLASS'; className: PlayerClassName }
  | { type: 'SET_SITUATION'; situation: Situation; combat: CombatNPCState | null }
  | { type: 'SET_RESOLUTION'; resolution: ResolutionData; combat: CombatNPCState | null; character: CharacterState }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_FEEDBACK'; report: FeedbackReport }
  | { type: 'NEXT_TURN' };

function gameReducer(state: GameLoopState, action: GameAction): GameLoopState {
  switch (action.type) {
    case 'SELECT_CLASS': {
      const character = createCharacter(action.className);
      const situation = generateSituation(character.inventory);
      const combat = situation.npcId ? createCombatNPC(situation.npcId) : null;
      return {
        ...state,
        phase: 'situation',
        character,
        situation,
        combat,
        resolution: null,
        error: null,
        turnCount: 0,
      };
    }
    case 'SET_SITUATION':
      return {
        ...state,
        phase: 'situation',
        situation: action.situation,
        combat: action.combat,
        resolution: null,
        error: null,
      };
    case 'SET_RESOLUTION':
      return {
        ...state,
        phase: 'resolution',
        resolution: action.resolution,
        combat: action.combat,
        character: action.character,
        error: null,
        turnCount: state.turnCount + 1,
      };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'ADD_FEEDBACK':
      return {
        ...state,
        phase: 'feedback',
        feedback: [...state.feedback, action.report],
      };
    case 'NEXT_TURN': {
      if (!state.character) return state;
      const situation = generateSituation(state.character.inventory);
      const combat = situation.npcId ? createCombatNPC(situation.npcId) : null;
      return {
        ...state,
        phase: 'situation',
        situation,
        combat,
        resolution: null,
        error: null,
      };
    }
    default:
      return state;
  }
}

// === INITIAL STATE ===

function createInitialState(): GameLoopState {
  return {
    phase: 'class_select',
    character: null,
    situation: null,
    resolution: null,
    combat: null,
    turnCount: 0,
    feedback: [],
    error: null,
  };
}

// === HOOK ===

export function useGameLoop(): GameLoop {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const selectClass = useCallback((className: PlayerClassName) => {
    dispatch({ type: 'SELECT_CLASS', className });
  }, []);

  const submitAction = useCallback((raw: string) => {
    const input = raw.trim();
    if (!input || !state.character || !state.situation) return;

    const parsed = parseAction(input, state.situation.scene, buildParserLocaleData('fr'));

    // Handle ambiguous input
    if (isReformulation(parsed)) {
      dispatch({
        type: 'SET_ERROR',
        error: `Commande ambigue. ${parsed.prompt} Essayez d'etre plus precis.`,
      });
      return;
    }

    const action: ParsedAction = parsed;
    const verb = action.verb;
    const stat: StatId = getVerbStat(verb);
    const statValue = state.character.stats[stat];
    const targetName = action.target ? ts(action.target.nameKey) : 'inconnu';
    const targetId = action.target?.id ?? 'unknown';

    // Auto verbs (no roll needed)
    if (AUTO_VERBS.has(verb)) {
      const autoResolution: ResolutionData = {
        input,
        verb,
        verbName: ts(VERB_REGISTRY[verb].nameKey),
        targetName,
        targetId,
        stat,
        statValue,
        diceResult: {
          natural: 0, stat, statValue, luckBonus: 0,
          modifier: 0, total: 0, difficulty: 0,
          success: true, critical: false, fumble: false,
        },
        dc: 0,
        outcome: 'success',
        outcomeLabel: 'ACTION AUTOMATIQUE',
        difficultyDetails: [],
        difficultyBreakdown: {
          base: 0, verbMod: 0, compatibilityPenalty: 0,
          contextMods: 0, creativityMod: 0, presetMod: 0, total: 0,
        },
        combat: null,
        creative: false,
        auto: true,
      };
      dispatch({
        type: 'SET_RESOLUTION',
        resolution: autoResolution,
        combat: state.combat,
        character: state.character,
      });
      return;
    }

    // Difficulty calculation
    const diff = calculateDifficulty({
      verb,
      target: action.target,
      tool: action.tool,
      playerStats: state.character.stats,
      difficultyLevel: 'survivor',
      creative: action.creative,
      environmentConditions: state.situation.scene.environmentConditions,
      playerConditions: [...state.character.conditions],
      suggestions: [...state.situation.scene.suggestions],
    });

    // Roll
    const roll: DiceResult = rollCheck(stat, statValue, state.character.stats.LCK, diff.total, 0);
    const outcome = classifyOutcome(roll.natural, roll.total, diff.total);

    // Combat resolution
    let combatData: CombatResolution | null = null;
    let updatedCombat = state.combat;
    let updatedChar = state.character;

    if (state.combat && state.situation.type === 'combat') {
      const npcDef = NPC_DEFINITIONS[state.combat.definitionId];
      const npcName = npcDef ? ts(npcDef.nameKey) : state.combat.definitionId;

      // Flee attempt
      const FLEE_VERBS: ReadonlySet<VerbId> = new Set(['RUN', 'SWIM']);
      if (FLEE_VERBS.has(verb)) {
        const armorVal = state.character.equippedArmor
          ? (ITEM_DEFINITIONS[state.character.equippedArmor]?.armorValue ?? 0) : 0;
        const fleeResult = attemptFlee(state.character.stats, state.combat, armorVal, 1.0);
        combatData = {
          hit: false,
          npcDodged: false,
          damageDealt: 0,
          critical: false,
          weakPointHit: false,
          npcKilled: false,
          npcName,
          npcHpBefore: state.combat.hp,
          npcHpAfter: state.combat.hp,
          fled: true,
          fleeSuccess: fleeResult.success,
        };
        if (!fleeResult.success && fleeResult.npcFreeAttack?.hit) {
          const dmg = fleeResult.npcFreeAttack.damageDealt;
          updatedChar = { ...state.character, hp: Math.max(0, state.character.hp - dmg) };
        }
        if (fleeResult.success) {
          updatedCombat = null;
        }
      } else {
        // Attack
        const weapon = state.character.equippedWeapon
          ? ITEM_DEFINITIONS[state.character.equippedWeapon] ?? null
          : null;
        const weaponData = weapon?.type === 'weapon' ? weapon : null;
        const cls = CLASSES[state.character.className];

        const attackResult = resolvePlayerAttack(
          state.character.stats, weaponData, verb, state.combat, roll,
          cls.passiveAbility.effect, cls.passiveAbility.value,
        );

        const npcHpAfter = Math.max(0, state.combat.hp - (attackResult.hit ? attackResult.damageDealt : 0));

        combatData = {
          hit: attackResult.hit,
          npcDodged: attackResult.npcDodged,
          damageDealt: attackResult.hit ? attackResult.damageDealt : 0,
          critical: attackResult.critical,
          weakPointHit: attackResult.weakPointHit,
          npcKilled: attackResult.npcKilled,
          npcName,
          npcHpBefore: state.combat.hp,
          npcHpAfter,
          fled: false,
          fleeSuccess: false,
        };

        updatedCombat = attackResult.npcKilled
          ? null
          : { ...state.combat, hp: npcHpAfter, combatRound: state.combat.combatRound + 1 };

        // NPC counterattack (if alive)
        if (updatedCombat && !attackResult.npcKilled) {
          const npcRoll = Math.floor(Math.random() * 20) + 1;
          const playerDef = 10 + state.character.stats.AGI + state.character.stats.DEF;
          const npcTotal = npcRoll + updatedCombat.attack;
          if (npcTotal > playerDef) {
            const armorVal = state.character.equippedArmor
              ? (ITEM_DEFINITIONS[state.character.equippedArmor]?.armorValue ?? 0) : 0;
            const rawDmg = Math.max(1, updatedCombat.attack - state.character.stats.DEF);
            const dmg = Math.max(1, rawDmg - armorVal);
            updatedChar = { ...state.character, hp: Math.max(0, state.character.hp - dmg) };
          }
        }
      }
    }

    const resolution: ResolutionData = {
      input,
      verb,
      verbName: ts(VERB_REGISTRY[verb].nameKey),
      targetName,
      targetId,
      stat,
      statValue,
      diceResult: roll,
      dc: diff.total,
      outcome,
      outcomeLabel: getOutcomeLabel(outcome),
      difficultyDetails: [...diff.details],
      difficultyBreakdown: {
        base: diff.base,
        verbMod: diff.verbMod,
        compatibilityPenalty: diff.compatibilityPenalty,
        contextMods: diff.contextMods,
        creativityMod: diff.creativityMod,
        presetMod: diff.difficultyPresetMod,
        total: diff.total,
      },
      combat: combatData,
      creative: action.creative,
      auto: false,
    };

    dispatch({
      type: 'SET_RESOLUTION',
      resolution,
      combat: updatedCombat,
      character: updatedChar,
    });
  }, [state.character, state.situation, state.combat]);

  const submitFeedback = useCallback((thumbs: 'up' | 'down', comment?: string) => {
    if (!state.situation || !state.resolution || !state.character) return;

    const report: FeedbackReport = {
      situationId: state.situation.id,
      situationType: state.situation.type,
      situationDescription: state.situation.description,
      locationName: state.situation.locationName,
      playerInput: state.resolution.input,
      parsedVerb: state.resolution.verb,
      parsedTarget: state.resolution.targetId,
      diceNatural: state.resolution.diceResult.natural,
      diceTotal: state.resolution.diceResult.total,
      dc: state.resolution.dc,
      outcome: state.resolution.outcome,
      playerClass: state.character.className,
      thumbs,
      comment: comment ?? '',
      timestamp: Date.now(),
    };

    dispatch({ type: 'ADD_FEEDBACK', report });
  }, [state.situation, state.resolution, state.character]);

  const nextSituation = useCallback(() => {
    dispatch({ type: 'NEXT_TURN' });
  }, []);

  return {
    state,
    selectClass,
    submitAction,
    submitFeedback,
    nextSituation,
    classList: CLASS_LIST,
  };
}
