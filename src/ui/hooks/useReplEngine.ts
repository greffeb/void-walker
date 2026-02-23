// ---------------------------------------------------------------------------
// src/ui/hooks/useReplEngine.ts — Web REPL engine hook
// ---------------------------------------------------------------------------
// Full game loop for parser/combat testing: character creation, exploration
// (parser + difficulty + dice), and combat (attack, flee, retreat, weak pts).
// All state managed via useReducer — no Zustand dependency yet.
// ---------------------------------------------------------------------------

import { useReducer, useCallback } from 'react';
import { t } from '@i18n/index';
import type { StringKey } from '@i18n/types';
import { CLASSES, CLASS_LIST } from '@content/classes';
import { buildDefaultScene, buildChaosScene, NPC_DEFINITIONS } from '@content/sceneBuilder';
import { ITEM_DEFINITIONS, type ItemDefinition } from '@content/items';
import { buildParserLocaleData } from '@content/parserData';
import {
  parseAction, calculateDifficulty, rollCheck, classifyOutcome,
  resolvePlayerAttack, attemptFlee, attemptRetreat,
  checkWeakPointAutoDiscover, shouldShowWeakPointHint, canDiscoverWeakPoint,
  isReformulation,
} from '@engine/index';
import { VERB_REGISTRY, VERB_STATS, VERB_IDS, AUTO_VERBS, type VerbId } from '@engine/verbs';
import { BALANCE } from '@engine/constants';
import type {
  StatId, PlayerClassName, CombatNPCState, WeakPoint,
  CharacterState, ParsedAction, SceneContext, DiceResult,
} from '@engine/types';

// === TYPES ===

/** Line types for coloring in the terminal */
export type LineType = 'system' | 'info' | 'input' | 'success' | 'error' | 'warning' | 'combat' | 'dice';

/** A single line emitted to the terminal */
export interface ReplLine {
  readonly text: string;
  readonly type: LineType;
}

/** REPL operating mode */
export type ReplMode = 'title' | 'exploration' | 'combat';

/** Complete REPL state */
export interface ReplState {
  readonly lines: readonly ReplLine[];
  readonly mode: ReplMode;
  readonly character: CharacterState | null;
  readonly scene: SceneContext;
  readonly combat: CombatNPCState | null;
  readonly turnCount: number;
}

/** Public interface returned by the hook */
export interface ReplEngine {
  readonly state: ReplState;
  readonly submitInput: (input: string) => void;
}

// === HELPERS ===

/** Safe translation wrapper for dynamic keys (casts to StringKey) */
function ts(key: string): string {
  return t(key as StringKey);
}

/** Verb sets for flee/retreat detection (mapped from VerbId aliases) */
const FLEE_VERBS: ReadonlySet<VerbId> = new Set(['RUN', 'SWIM']);
const RETREAT_VERBS: ReadonlySet<VerbId> = new Set(['DODGE', 'HIDE']);

/** Discovery verbs for weak points */
const DISCOVERY_VERBS: ReadonlySet<VerbId> = new Set(['EXAMINE', 'SCAN']);

/** Combat-capable NPC IDs (have attack > 0 and are hostile) */
const COMBAT_NPC_IDS: readonly string[] = [
  'security_robot', 'xenomorph', 'parasitized_crewmember', 'wounded_android',
];

/** Get a weapon definition from inventory item IDs */
function getWeapon(
  equippedId: string | null,
): Pick<ItemDefinition, 'damageBonus' | 'type'> | null {
  if (!equippedId) return null;
  const def = ITEM_DEFINITIONS[equippedId];
  if (!def || def.type !== 'weapon') return null;
  return def;
}

/** Get primary stat for a verb via VERB_STATS lookup */
function getVerbStat(verb: VerbId): StatId {
  return (VERB_STATS[verb] as StatId | undefined) ?? 'FOR';
}

// === REDUCER ===

type ReplAction =
  | { type: 'ADD_LINES'; lines: ReplLine[] }
  | { type: 'SET_MODE'; mode: ReplMode }
  | { type: 'SET_CHARACTER'; character: CharacterState }
  | { type: 'UPDATE_CHARACTER'; updates: Partial<CharacterState> }
  | { type: 'SET_COMBAT'; combat: CombatNPCState | null }
  | { type: 'UPDATE_COMBAT'; updates: Partial<CombatNPCState> }
  | { type: 'SET_SCENE'; scene: SceneContext }
  | { type: 'TICK_TURN' };

function replReducer(state: ReplState, action: ReplAction): ReplState {
  switch (action.type) {
    case 'ADD_LINES':
      return { ...state, lines: [...state.lines, ...action.lines] };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'SET_CHARACTER':
      return { ...state, character: action.character };
    case 'UPDATE_CHARACTER': {
      if (!state.character) return state;
      return { ...state, character: { ...state.character, ...action.updates } };
    }
    case 'SET_COMBAT':
      return { ...state, combat: action.combat };
    case 'UPDATE_COMBAT': {
      if (!state.combat) return state;
      return { ...state, combat: { ...state.combat, ...action.updates } };
    }
    case 'SET_SCENE':
      return { ...state, scene: action.scene };
    case 'TICK_TURN':
      return { ...state, turnCount: state.turnCount + 1 };
    default:
      return state;
  }
}

// === INITIAL STATE ===

function createInitialReplState(): ReplState {
  return {
    lines: [
      { text: '══════════════════════════════════════', type: 'system' },
      { text: '        VOID WALKER — PLAYTEST REPL', type: 'system' },
      { text: '══════════════════════════════════════', type: 'system' },
      { text: '', type: 'info' },
      { text: 'Choisissez votre classe :', type: 'system' },
      ...CLASS_LIST.map((cls) =>
        ({ text: `  /class ${cls.id} — ${ts(cls.nameKey)} : ${ts(cls.descriptionKey)}`, type: 'info' as const }),
      ),
      { text: '', type: 'info' },
      { text: 'Tapez /help pour la liste des commandes.', type: 'info' },
    ],
    mode: 'title',
    character: null,
    scene: buildDefaultScene(),
    combat: null,
    turnCount: 0,
  };
}

// === HOOK ===

export function useReplEngine(): ReplEngine {
  const [state, dispatch] = useReducer(replReducer, undefined, createInitialReplState);

  const emit = useCallback((text: string, type: LineType = 'info'): void => {
    dispatch({ type: 'ADD_LINES', lines: [{ text, type }] });
  }, []);

  const emitMany = useCallback((lines: ReplLine[]): void => {
    dispatch({ type: 'ADD_LINES', lines });
  }, []);

  const submitInput = useCallback((raw: string) => {
    const input = raw.trim();
    if (!input) return;

    // Echo the input
    emit(`> ${input}`, 'input');

    // Slash commands
    if (input.startsWith('/')) {
      handleSlashCommand(input, state, dispatch, emit, emitMany);
      return;
    }

    // Mode-based processing
    if (state.mode === 'title') {
      emit("Choisissez d'abord une classe avec /class marine|engineer|medic", 'warning');
      return;
    }

    if (state.mode === 'combat' && state.combat) {
      processCombatInput(input, state, dispatch, emit, emitMany);
      return;
    }

    if (state.mode === 'exploration') {
      processExplorationInput(input, state, dispatch, emit, emitMany);
      return;
    }
  }, [state, emit, emitMany]);

  return { state, submitInput };
}

// === CHARACTER CREATION ===

function createCharacter(className: PlayerClassName): CharacterState {
  const cls = CLASSES[className];
  const hp = cls.startingHp;
  return {
    name: `Testeur_${className}`,
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

function createCombatNPC(npcId: string): CombatNPCState {
  const def = NPC_DEFINITIONS[npcId];
  if (!def) {
    // Fallback: security robot
    return createCombatNPC('security_robot');
  }
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

// === SLASH COMMANDS ===

function handleSlashCommand(
  input: string,
  state: ReplState,
  dispatch: React.Dispatch<ReplAction>,
  emit: (text: string, type?: LineType) => void,
  emitMany: (lines: ReplLine[]) => void,
): void {
  const parts = input.toLowerCase().split(/\s+/);
  const cmd = parts[0] ?? '';

  switch (cmd) {
    case '/help':
      emitMany([
        { text: '── Commandes ──', type: 'system' },
        { text: '/class <marine|engineer|medic> — Choisir une classe', type: 'info' },
        { text: '/combat [npc_id] — Lancer un combat', type: 'info' },
        { text: '/scene — Recharger la scène par défaut', type: 'info' },
        { text: '/chaos — Scène aléatoire (conditions)', type: 'info' },
        { text: '/stats — Afficher les stats du personnage', type: 'info' },
        { text: '/verbs — Lister les verbes disponibles', type: 'info' },
        { text: '/heal — Restaurer PV et oxygène', type: 'info' },
        { text: '/debug — Info debug (scène, inventaire)', type: 'info' },
        { text: '/help — Cette aide', type: 'info' },
        { text: '', type: 'info' },
        { text: 'En exploration : tapez une action en français (ex: "examiner le robot")', type: 'info' },
        { text: 'En combat : tapez un verbe d\'attaque, "fuir" ou "reculer"', type: 'info' },
      ]);
      break;

    case '/class': {
      const className = (parts[1] ?? '') as PlayerClassName;
      if (!['marine', 'engineer', 'medic'].includes(className)) {
        emit('Usage : /class marine|engineer|medic', 'warning');
        return;
      }
      const char = createCharacter(className);
      dispatch({ type: 'SET_CHARACTER', character: char });
      dispatch({ type: 'SET_MODE', mode: 'exploration' });
      const cls = CLASSES[className];
      emitMany([
        { text: '', type: 'info' },
        { text: `═══ ${ts(cls.nameKey).toUpperCase()} ═══`, type: 'system' },
        { text: ts(cls.descriptionKey), type: 'info' },
        { text: `PV: ${char.hp}/${char.maxHp} | O₂: ${char.oxygen}%`, type: 'info' },
        { text: `Stats: FOR:${char.stats.FOR} DEF:${char.stats.DEF} AGI:${char.stats.AGI} INT:${char.stats.INT} PER:${char.stats.PER} CHA:${char.stats.CHA} LCK:${char.stats.LCK}`, type: 'info' },
        { text: `Inventaire: ${char.inventory.map((id) => ts(ITEM_DEFINITIONS[id]?.nameKey ?? `item.${id}`)).join(', ')}`, type: 'info' },
        { text: '', type: 'info' },
        { text: 'Mode exploration activé. Tapez une action en français.', type: 'success' },
      ]);
      break;
    }

    case '/combat': {
      if (!state.character) {
        emit('Créez un personnage d\'abord avec /class', 'warning');
        return;
      }
      const npcId = parts[1] ?? COMBAT_NPC_IDS[0] ?? 'security_robot';
      const npc = createCombatNPC(npcId);
      const npcDef = NPC_DEFINITIONS[npcId];
      dispatch({ type: 'SET_COMBAT', combat: npc });
      dispatch({ type: 'SET_MODE', mode: 'combat' });
      emitMany([
        { text: '', type: 'info' },
        { text: '╔══════════════════════════════╗', type: 'combat' },
        { text: `║  COMBAT : ${npcDef ? ts(npcDef.nameKey).toUpperCase() : npcId.toUpperCase()}`, type: 'combat' },
        { text: '╚══════════════════════════════╝', type: 'combat' },
        { text: `PV ennemi: ${npc.hp}/${npc.maxHp} | ATK: ${npc.attack} | DEF: ${npc.defense}`, type: 'combat' },
        { text: `Pattern: ${npc.aggressionPattern} | Esquive: ${Math.floor(npc.dodgeChance * 100)}%`, type: 'combat' },
        { text: npc.weakPoint ? `Point faible: ??? (${npc.weakPoint.discoverMethod})` : 'Pas de point faible connu', type: 'info' },
        { text: '', type: 'info' },
        { text: 'Actions : attaquer (verbe), "fuir", "reculer", "examiner"', type: 'info' },
      ]);
      break;
    }

    case '/scene':
      dispatch({ type: 'SET_SCENE', scene: buildDefaultScene() });
      emit('Scène par défaut rechargée.', 'success');
      break;

    case '/chaos':
      dispatch({ type: 'SET_SCENE', scene: buildChaosScene() });
      emit('Scène chaos chargée (conditions aléatoires).', 'success');
      break;

    case '/stats': {
      if (!state.character) {
        emit('Pas de personnage actif.', 'warning');
        return;
      }
      const ch = state.character;
      emitMany([
        { text: `── ${ch.name} (${ch.className}) ──`, type: 'system' },
        { text: `PV: ${ch.hp}/${ch.maxHp} | O₂: ${ch.oxygen}%`, type: 'info' },
        { text: `FOR:${ch.stats.FOR} DEF:${ch.stats.DEF} AGI:${ch.stats.AGI} INT:${ch.stats.INT} PER:${ch.stats.PER} CHA:${ch.stats.CHA} LCK:${ch.stats.LCK}`, type: 'info' },
        { text: `Arme: ${ch.equippedWeapon ? ts(ITEM_DEFINITIONS[ch.equippedWeapon]?.nameKey ?? `item.${ch.equippedWeapon}`) : 'aucune'}`, type: 'info' },
        { text: `Inventaire: ${ch.inventory.map((id) => ts(ITEM_DEFINITIONS[id]?.nameKey ?? `item.${id}`)).join(', ')}`, type: 'info' },
        { text: `Conditions: ${ch.conditions.length > 0 ? ch.conditions.join(', ') : 'aucune'}`, type: 'info' },
      ]);
      break;
    }

    case '/verbs': {
      const grouped: Record<string, string[]> = {};
      for (const vid of VERB_IDS) {
        const stat = getVerbStat(vid);
        if (!grouped[stat]) grouped[stat] = [];
        grouped[stat].push(vid);
      }
      emitMany([
        { text: '── Verbes par stat ──', type: 'system' },
        ...Object.entries(grouped).map(([stat, verbs]) =>
          ({ text: `${stat}: ${verbs.join(', ')}`, type: 'info' as const }),
        ),
        { text: `Auto: ${[...AUTO_VERBS].join(', ')}`, type: 'info' },
      ]);
      break;
    }

    case '/heal':
      if (!state.character) {
        emit('Pas de personnage actif.', 'warning');
        return;
      }
      dispatch({
        type: 'UPDATE_CHARACTER',
        updates: {
          hp: state.character.maxHp,
          oxygen: BALANCE.OXYGEN.MAX,
          conditions: [],
        },
      });
      emit('PV et O₂ restaurés, conditions retirées.', 'success');
      break;

    case '/debug': {
      const sc = state.scene;
      emitMany([
        { text: '── Debug Scène ──', type: 'system' },
        { text: `Inventaire: ${sc.inventory.map((t) => t.id).join(', ')}`, type: 'info' },
        { text: `Lieu: ${sc.locationItems.map((t) => t.id).join(', ')}`, type: 'info' },
        { text: `NPCs: ${sc.npcs.map((n) => n.id).join(', ')}`, type: 'info' },
        { text: `Environnement: ${sc.environmentFeatures.map((f) => f.id).join(', ')}`, type: 'info' },
        { text: `Conditions: ${sc.environmentConditions.length > 0 ? sc.environmentConditions.join(', ') : 'aucune'}`, type: 'info' },
        { text: `Combat: ${state.combat ? `${state.combat.definitionId} (${state.combat.hp}/${state.combat.maxHp})` : 'non'}`, type: 'info' },
      ]);
      break;
    }

    default:
      emit(`Commande inconnue : ${cmd}. Tapez /help`, 'warning');
  }
}

// === EXPLORATION INPUT ===

function processExplorationInput(
  input: string,
  state: ReplState,
  dispatch: React.Dispatch<ReplAction>,
  emit: (text: string, type?: LineType) => void,
  emitMany: (lines: ReplLine[]) => void,
): void {
  if (!state.character) return;

  const parsed = parseAction(input, state.scene, buildParserLocaleData('fr'));

  // Reformulation
  if (isReformulation(parsed)) {
    emitMany([
      { text: `Entrée ambiguë : "${input}"`, type: 'warning' },
      { text: parsed.prompt, type: 'info' },
      ...parsed.interpretations.map((interp, i) =>
        ({ text: `  ${i + 1}. ${interp.verb} → ${interp.target?.id ?? '???'}`, type: 'info' as const }),
      ),
    ]);
    return;
  }

  // Successful parse
  const action: ParsedAction = parsed;
  const verb = action.verb;
  const targetName = action.target ? ts(action.target.nameKey) : '—';

  emit(`[PARSE] Verbe: ${verb} | Cible: ${targetName} | Stratégie: ${action.verbMatch.strategy} | Créatif: ${action.creative ? 'oui' : 'non'}`, 'info');

  // Auto verbs (no roll needed)
  if (AUTO_VERBS.has(verb)) {
    emit(`✓ Action automatique : ${ts(VERB_REGISTRY[verb].nameKey)} → ${targetName}`, 'success');
    dispatch({ type: 'TICK_TURN' });
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
    environmentConditions: state.scene.environmentConditions,
    playerConditions: [...state.character.conditions],
    suggestions: [...state.scene.suggestions],
  });

  const stat: StatId = getVerbStat(verb);
  const statValue = state.character.stats[stat];

  // Roll
  const roll: DiceResult = rollCheck(stat, statValue, state.character.stats.LCK, diff.total, 0);
  const outcome = classifyOutcome(roll.natural, roll.total, diff.total);

  // Display difficulty breakdown
  emit(`[DC] Base:${diff.base} Verbe:${diff.verbMod} Compat:${diff.compatibilityPenalty} Ctx:${diff.contextMods} Créa:${diff.creativityMod} Preset:${diff.difficultyPresetMod} → Total:${diff.total}`, 'info');

  // Display roll
  const rollDetails = `D20(${roll.natural}) + ${stat}(${statValue}) + LCK(${roll.luckBonus}) = ${roll.total} vs DC ${diff.total}`;

  switch (outcome) {
    case 'crit_success':
      emitMany([
        { text: `🎲 ${rollDetails}`, type: 'dice' },
        { text: `★ SUCCÈS CRITIQUE ! ${ts(VERB_REGISTRY[verb].nameKey)} sur ${targetName}`, type: 'success' },
      ]);
      break;
    case 'success':
      emitMany([
        { text: `🎲 ${rollDetails}`, type: 'dice' },
        { text: `✓ Succès : ${ts(VERB_REGISTRY[verb].nameKey)} sur ${targetName}`, type: 'success' },
      ]);
      break;
    case 'failure':
      emitMany([
        { text: `🎲 ${rollDetails}`, type: 'dice' },
        { text: `✗ Échec : ${ts(VERB_REGISTRY[verb].nameKey)} sur ${targetName}`, type: 'error' },
      ]);
      break;
    case 'crit_failure':
      emitMany([
        { text: `🎲 ${rollDetails}`, type: 'dice' },
        { text: `💀 ÉCHEC CRITIQUE ! ${ts(VERB_REGISTRY[verb].nameKey)} sur ${targetName}`, type: 'error' },
      ]);
      break;
  }

  if (diff.details.length > 0) {
    emit(`  Détails: ${diff.details.join(', ')}`, 'info');
  }

  dispatch({ type: 'TICK_TURN' });
}

// === COMBAT INPUT ===

function processCombatInput(
  input: string,
  state: ReplState,
  dispatch: React.Dispatch<ReplAction>,
  emit: (text: string, type?: LineType) => void,
  emitMany: (lines: ReplLine[]) => void,
): void {
  if (!state.character || !state.combat) return;

  const npc = state.combat;
  const char = state.character;

  // Parse the action
  const parsed = parseAction(input, state.scene, buildParserLocaleData('fr'));
  if (isReformulation(parsed)) {
    emit(`Entrée ambiguë. Essayez : frapper, tirer, fuir, reculer, examiner...`, 'warning');
    return;
  }

  const action: ParsedAction = parsed;
  const verb = action.verb;

  // --- FLEE ---
  if (FLEE_VERBS.has(verb)) {
    const armorVal = char.equippedArmor ? (ITEM_DEFINITIONS[char.equippedArmor]?.armorValue ?? 0) : 0;
    const result = attemptFlee(char.stats, npc, armorVal, 1.0);

    if (result.success) {
      emitMany([
        { text: `🎲 D20(${result.roll.natural}) + AGI(${char.stats.AGI}) + LCK(${result.roll.luckBonus}) = ${result.roll.total} vs DC ${npc.fleeDC}`, type: 'dice' },
        { text: '✓ Fuite réussie ! Vous échappez au combat.', type: 'success' },
      ]);
      dispatch({ type: 'SET_COMBAT', combat: null });
      dispatch({ type: 'SET_MODE', mode: 'exploration' });
    } else {
      const lines: ReplLine[] = [
        { text: `🎲 D20(${result.roll.natural}) + AGI(${char.stats.AGI}) + LCK(${result.roll.luckBonus}) = ${result.roll.total} vs DC ${npc.fleeDC}`, type: 'dice' },
        { text: '✗ Fuite échouée ! L\'ennemi attaque...', type: 'error' },
      ];
      if (result.npcFreeAttack?.hit) {
        const dmg = result.npcFreeAttack.damageDealt;
        lines.push({ text: `  L'ennemi inflige ${dmg} dégâts ! (PV: ${char.hp} → ${Math.max(0, char.hp - dmg)})`, type: 'combat' });
        dispatch({ type: 'UPDATE_CHARACTER', updates: { hp: Math.max(0, char.hp - dmg) } });
      } else if (result.npcFreeAttack?.dodged) {
        lines.push({ text: '  Vous esquivez l\'attaque de représailles !', type: 'success' });
      } else if (result.npcFreeAttack) {
        lines.push({ text: '  L\'ennemi rate son attaque de représailles.', type: 'info' });
      }
      emitMany(lines);
    }
    dispatch({ type: 'TICK_TURN' });
    checkPlayerDeath(state, dispatch, emit);
    return;
  }

  // --- RETREAT ---
  if (RETREAT_VERBS.has(verb)) {
    const result = attemptRetreat(char.stats, npc);
    if (result.success) {
      emitMany([
        { text: `🎲 D20(${result.roll.natural}) + AGI(${char.stats.AGI}) + LCK(${result.roll.luckBonus}) = ${result.roll.total} vs DC ${Math.max(1, npc.fleeDC - BALANCE.COMBAT.RETREAT_DC_REDUCTION)}`, type: 'dice' },
        { text: '✓ Repli réussi ! Vous gagnez de la distance.', type: 'success' },
      ]);
    } else {
      emitMany([
        { text: `🎲 D20(${result.roll.natural}) + AGI(${char.stats.AGI}) + LCK(${result.roll.luckBonus}) = ${result.roll.total} vs DC ${Math.max(1, npc.fleeDC - BALANCE.COMBAT.RETREAT_DC_REDUCTION)}`, type: 'dice' },
        { text: '✗ Repli échoué ! Vous restez à portée.', type: 'error' },
      ]);
    }
    advanceCombatRound(npc, char, state, dispatch, emit, emitMany);
    return;
  }

  // --- WEAK POINT DISCOVERY ---
  if (DISCOVERY_VERBS.has(verb) && npc.weakPoint && !npc.weakPointDiscovered) {
    const hasScannerTool = char.inventory.includes('scanner');
    if (canDiscoverWeakPoint(verb, npc.weakPoint, hasScannerTool)) {
      dispatch({ type: 'UPDATE_COMBAT', updates: { weakPointDiscovered: true } });
      emitMany([
        { text: `★ Point faible découvert : ${ts(npc.weakPoint.nameKey)} !`, type: 'success' },
        { text: `  ${ts(npc.weakPoint.exploitKey)}`, type: 'info' },
        { text: `  Verbes efficaces : ${npc.weakPoint.targetVerbs.join(', ')}`, type: 'info' },
      ]);
      advanceCombatRound(npc, char, state, dispatch, emit, emitMany);
      return;
    }
  }

  // --- ATTACK ---
  const weapon = getWeapon(char.equippedWeapon);
  const stat: StatId = getVerbStat(verb);
  const statValue = char.stats[stat];

  // Difficulty for combat action
  const diff = calculateDifficulty({
    verb,
    target: action.target,
    tool: action.tool,
    playerStats: char.stats,
    difficultyLevel: 'survivor',
    creative: action.creative,
    environmentConditions: state.scene.environmentConditions,
    playerConditions: [...char.conditions],
  });

  const roll: DiceResult = rollCheck(stat, statValue, char.stats.LCK, diff.total, 0);

  // Get passive effect for damage calculation
  const cls = CLASSES[char.className];
  const passiveEffect = cls.passiveAbility.effect;
  const passiveValue = cls.passiveAbility.value;

  const attackResult = resolvePlayerAttack(
    char.stats, weapon, verb, npc, roll,
    passiveEffect, passiveValue,
  );

  // Display roll
  const rollStr = `🎲 D20(${roll.natural}) + ${stat}(${statValue}) + LCK(${roll.luckBonus}) = ${roll.total} vs DC ${diff.total}`;

  if (!attackResult.hit) {
    if (attackResult.npcDodged) {
      emitMany([
        { text: rollStr, type: 'dice' },
        { text: `✗ L'ennemi esquive votre ${ts(VERB_REGISTRY[verb].nameKey)} !`, type: 'warning' },
      ]);
    } else {
      emitMany([
        { text: rollStr, type: 'dice' },
        { text: `✗ Raté ! ${ts(VERB_REGISTRY[verb].nameKey)} échoue.`, type: 'error' },
      ]);
    }
  } else {
    const newHp = Math.max(0, npc.hp - attackResult.damageDealt);
    const critTag = attackResult.critical ? ' ★ CRITIQUE' : '';
    const wpTag = attackResult.weakPointHit ? ' [Point faible !]' : '';

    emitMany([
      { text: rollStr, type: 'dice' },
      { text: `✓ Touché !${critTag}${wpTag} ${attackResult.damageDealt} dégâts. (Ennemi PV: ${npc.hp} → ${newHp})`, type: 'combat' },
    ]);

    if (attackResult.bonusLoot) {
      emit(`  ★ Loot bonus : ${ts(ITEM_DEFINITIONS[attackResult.bonusLoot.itemId]?.nameKey ?? `item.${attackResult.bonusLoot.itemId}`)}`, 'success');
    }

    dispatch({ type: 'UPDATE_COMBAT', updates: { hp: newHp } });

    if (attackResult.npcKilled) {
      emitMany([
        { text: '', type: 'info' },
        { text: '════════════════════════', type: 'success' },
        { text: '  VICTOIRE !', type: 'success' },
        { text: '════════════════════════', type: 'success' },
      ]);
      dispatch({ type: 'SET_COMBAT', combat: null });
      dispatch({ type: 'SET_MODE', mode: 'exploration' });
      dispatch({ type: 'TICK_TURN' });
      return;
    }
  }

  // Advance round (NPC counterattack, weak point hints, etc.)
  const updatedNpc: CombatNPCState = {
    ...npc,
    hp: Math.max(0, npc.hp - (attackResult.hit ? attackResult.damageDealt : 0)),
  };
  advanceCombatRound(updatedNpc, char, state, dispatch, emit, emitMany);
}

// === COMBAT ROUND ADVANCE ===

function advanceCombatRound(
  npc: CombatNPCState,
  char: CharacterState,
  state: ReplState,
  dispatch: React.Dispatch<ReplAction>,
  emit: (text: string, type?: LineType) => void,
  emitMany: (lines: ReplLine[]) => void,
): void {
  const round = npc.combatRound;

  // Weak point auto-discover
  if (npc.weakPoint && !npc.weakPointDiscovered) {
    if (checkWeakPointAutoDiscover(round)) {
      dispatch({ type: 'UPDATE_COMBAT', updates: { weakPointDiscovered: true } });
      emitMany([
        { text: `★ Après ${round} rounds, vous remarquez un point faible : ${ts(npc.weakPoint.nameKey)} !`, type: 'success' },
        { text: `  ${ts(npc.weakPoint.exploitKey)}`, type: 'info' },
      ]);
    } else if (shouldShowWeakPointHint(round)) {
      emit(`  💡 Indice : ${ts(npc.weakPoint.hintKey)}`, 'warning');
    }
  }

  // NPC counterattack (simplified: always attacks if aggressive/berserk)
  const npcAtk = npc.attack;
  const npcRoll = Math.floor(Math.random() * 20) + 1;
  const playerDef = 10 + char.stats.AGI + char.stats.DEF;
  const npcTotal = npcRoll + npcAtk;

  if (npcTotal > playerDef) {
    const rawDmg = Math.max(1, npcAtk - char.stats.DEF);
    const armorVal = char.equippedArmor ? (ITEM_DEFINITIONS[char.equippedArmor]?.armorValue ?? 0) : 0;
    const dmg = Math.max(1, rawDmg - armorVal);
    const newHp = Math.max(0, char.hp - dmg);
    emit(`⚔ L'ennemi attaque ! D20(${npcRoll})+ATK(${npcAtk})=${npcTotal} vs DEF ${playerDef} → ${dmg} dégâts (PV: ${char.hp} → ${newHp})`, 'combat');
    dispatch({ type: 'UPDATE_CHARACTER', updates: { hp: newHp } });
  } else {
    emit(`⚔ L'ennemi attaque ! D20(${npcRoll})+ATK(${npcAtk})=${npcTotal} vs DEF ${playerDef} → Raté !`, 'info');
  }

  // Advance round
  dispatch({ type: 'UPDATE_COMBAT', updates: { combatRound: round + 1 } });
  dispatch({ type: 'TICK_TURN' });

  // Check player death
  checkPlayerDeath(state, dispatch, emit);
}

// === DEATH CHECK ===

function checkPlayerDeath(
  state: ReplState,
  dispatch: React.Dispatch<ReplAction>,
  emit: (text: string, type?: LineType) => void,
): void {
  if (state.character && state.character.hp <= 0) {
    emit('', 'info');
    emit('═══════════════════════', 'error');
    emit('  VOUS ÊTES MORT', 'error');
    emit('═══════════════════════', 'error');
    emit('Tapez /class pour recommencer.', 'info');
    dispatch({ type: 'SET_COMBAT', combat: null });
    dispatch({ type: 'SET_MODE', mode: 'title' });
  }
}
