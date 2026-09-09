// ---------------------------------------------------------------------------
// src/engine/difficulty.ts — Difficulty calculation and creativity detection
// ---------------------------------------------------------------------------
// Computes the total DC for an action, applying all context modifiers,
// verb modifiers, creativity bonuses, and difficulty preset adjustments.
// ---------------------------------------------------------------------------

import type { VerbId } from './verbs';
import { VERB_REGISTRY, AUTO_VERBS, VERB_STATS } from './verbs';
import type { PropertyId } from './properties';
import { checkCompatibility } from './compatibility';
import type { ActionSeverity } from './compatibility';
import { BALANCE } from './constants';
import type {
  DifficultyBreakdown,
  DifficultyInput,
  DifficultyLevel,
  DifficultyLine,
  ParsedAction,
  ResolvedTarget,
  StatBlock,
  StatId,
  EnvironmentCondition,
} from './types';
import type { StringKey } from '@i18n/types';

// === DIFFICULTY PRESET MODIFIERS ===

const DIFFICULTY_PRESET_MODS: Readonly<Record<DifficultyLevel, number>> = {
  explorer: -2,
  survivor: 0,
  nightmare: 2,
};

// === CREATIVITY DETECTION ===

/**
 * Detect how creative an action is relative to the current suggestions.
 * Returns a negative DC modifier (bonus for creativity).
 *
 * - Different verb+target from all suggestions: DIFFERENT_FROM_SUGGESTIONS_BONUS (-2)
 * - Novel verb+target combo never seen: NOVEL_COMBO_BONUS (-1)
 */
export function detectCreativity(
  action: ParsedAction,
  suggestions: readonly ParsedAction[],
): number {
  if (suggestions.length === 0) {
    return 0; // No suggestions to compare against, no creativity bonus
  }

  // Check if action matches any suggestion
  const matchesSuggestion = suggestions.some(
    (s) => s.verb === action.verb && s.target?.id === action.target?.id,
  );

  if (matchesSuggestion) {
    return 0; // Following a suggestion, no creativity bonus
  }

  // Different from all suggestions
  let bonus = BALANCE.CREATIVITY.DIFFERENT_FROM_SUGGESTIONS_BONUS;

  // Check if verb itself is different from all suggestion verbs
  const sameVerbDiffTarget = suggestions.some((s) => s.verb === action.verb);
  if (!sameVerbDiffTarget) {
    // Completely novel verb — additional bonus
    bonus += BALANCE.CREATIVITY.NOVEL_COMBO_BONUS;
  }

  return bonus;
}

// === TARGET DISPOSITION ===

/** Get target disposition modifier based on properties */
function getTargetDispositionMod(
  target: ResolvedTarget | null,
  targetDefense: number | undefined,
): { mod: number; detail: string } {
  if (!target) return { mod: 0, detail: '' };

  const props = new Set(target.properties);
  const disposition = target.state?.disposition;

  if (disposition === 'friendly' || disposition === 'willing') {
    return { mod: BALANCE.CONTEXT_MODIFIERS.COOPERATIVE_TARGET, detail: 'Cible coopérative' };
  }
  // An NPC you are striking is already priced by its defense; charging the
  // hostility surcharge on top would bill the same thing twice.
  if (disposition === 'hostile' && targetDefense === undefined) {
    return { mod: BALANCE.CONTEXT_MODIFIERS.HOSTILE_TARGET, detail: 'Cible hostile' };
  }
  if (props.has('secured') && target.state?.lock === 'locked') {
    return { mod: BALANCE.CONTEXT_MODIFIERS.FORTIFIED_TARGET, detail: 'Cible fortifiée' };
  }

  return { mod: 0, detail: '' };
}

// === TOOL MODIFIER ===

/** Get tool-related modifier */
function getToolMod(
  verb: VerbId,
  tool: ResolvedTarget | null,
): { mod: number; detail: string } {
  const entry = VERB_REGISTRY[verb];
  const requiredProp = entry.requirements.requiredToolProp;

  if (!requiredProp) {
    return { mod: 0, detail: '' };
  }

  if (!tool) {
    return {
      mod: BALANCE.CONTEXT_MODIFIERS.NO_TOOL_WHEN_NEEDED,
      detail: `Outil requis manquant (${requiredProp})`,
    };
  }

  const toolProps = new Set(tool.properties);
  if (toolProps.has(requiredProp)) {
    return {
      mod: BALANCE.CONTEXT_MODIFIERS.APPROPRIATE_TOOL,
      detail: 'Outil approprié',
    };
  }

  return {
    mod: BALANCE.CONTEXT_MODIFIERS.WRONG_TOOL,
    detail: 'Outil inadapté',
  };
}

// === ENVIRONMENT MODIFIERS ===

/** Get environment condition modifiers */
function getEnvironmentMods(
  conditions: readonly EnvironmentCondition[],
): { mod: number; details: string[] } {
  let mod = 0;
  const details: string[] = [];

  for (const condition of conditions) {
    switch (condition) {
      case 'dark':
        mod += BALANCE.CONTEXT_MODIFIERS.IN_DARKNESS;
        details.push('Obscurité');
        break;
      case 'zero_g':
        mod += BALANCE.CONTEXT_MODIFIERS.ZERO_GRAVITY;
        details.push('Apesanteur');
        break;
      case 'time_pressure':
        mod += BALANCE.CONTEXT_MODIFIERS.TIME_PRESSURE;
        details.push('Pression temporelle');
        break;
      case 'on_fire':
        mod += BALANCE.CONTEXT_MODIFIERS.ON_FIRE;
        details.push('Incendie');
        break;
      case 'flooded':
        mod += BALANCE.CONTEXT_MODIFIERS.FLOODED;
        details.push('Inondation');
        break;
      case 'depressurized':
        mod += BALANCE.CONTEXT_MODIFIERS.DEPRESSURIZED;
        details.push('Dépressurisation');
        break;
    }
  }

  return { mod, details };
}

// === PLAYER CONDITION MODIFIERS ===

/** Get player condition modifiers */
function getPlayerConditionMods(
  verb: VerbId,
  playerStats: StatBlock,
  playerConditions: readonly string[],
): { mod: number; details: string[] } {
  let mod = 0;
  const details: string[] = [];

  // Wounded penalty
  if (playerConditions.includes('wounded')) {
    mod += BALANCE.CONTEXT_MODIFIERS.WOUNDED_PLAYER;
    details.push('Joueur blessé');
  }

  // Terrified penalty (DC +1) — replaces the roll modifier in processTurn
  if (playerConditions.includes('terrified')) {
    mod += BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER;
    details.push('terrified');
  }

  // High relevant stat bonus
  const statId = VERB_STATS[verb] as StatId | undefined;
  if (statId) {
    const statValue = playerStats[statId];
    if (statValue >= BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_THRESHOLD) {
      mod += BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_BONUS;
      details.push(`${statId} élevé`);
    }
  }

  return { mod, details };
}

// === MAIN DIFFICULTY CALCULATOR ===

/**
 * Calculate the total difficulty (DC) for an action.
 * Returns a breakdown with every modifier explained.
 *
 * Formula: BASE(10) + verbMod + compatPenalty + contextMods + creativityMod + presetMod
 * Clamped to [MIN_DIFFICULTY, MAX_DIFFICULTY] (2-25)
 */
export function calculateDifficulty(input: DifficultyInput): DifficultyBreakdown {
  const details: string[] = [];

  // Base difficulty
  const base = input.baseOverride ?? BALANCE.BASE_DIFFICULTY;
  details.push(`Base: ${base}`);

  // Auto verbs have DC 0
  if (AUTO_VERBS.has(input.verb)) {
    return {
      base: 0,
      verbMod: 0,
      compatibilityPenalty: 0,
      contextMods: 0,
      creativityMod: 0,
      difficultyPresetMod: 0,
      total: 0,
      details: ['Action automatique (DC 0)'],
      namedLines: [],
      severity: 'compatible',
      requiresCritical: false,
    };
  }

  // Verb modifier
  const verbEntry = VERB_REGISTRY[input.verb];
  const verbMod = verbEntry.difficultyMod;
  if (verbMod !== 0) {
    details.push(`Verbe (${input.verb}): ${verbMod > 0 ? '+' : ''}${verbMod}`);
  }

  // Compatibility penalty. A scenario rule that matched is compatible by
  // construction: the author already decided this act means something here.
  let compatibilityPenalty = 0;
  let requiresCritical = false;
  let compatSeverity: ActionSeverity = 'compatible';
  if (input.target && input.target.source !== 'abstract' && input.vouchedByScenario !== true) {
    const compat = checkCompatibility({
      verbId: input.verb,
      targetProps: input.target.properties,
      playerToolProps: input.tool?.properties ?? [],
      targetState: input.target.state,
    });
    // The missing tool is priced once, by getToolMod, which tells apart an
    // appropriate tool, a wrong one and none at all.
    compatibilityPenalty = compat.propertyPenalty;
    requiresCritical = compat.requiresCritical;
    compatSeverity = compat.severity;
    if (compatibilityPenalty > 0) {
      details.push(`Incompatibilité: +${compatibilityPenalty}${compat.failedClause ? ` (${compat.failedClause})` : ''}`);
    }
    if (requiresCritical) {
      details.push(`Action absurde (${compat.nature}) : seul un critique peut la porter`);
    }
  }

  // Context modifiers
  let contextMods = 0;

  // Target disposition
  const disposition = getTargetDispositionMod(input.target, input.targetDefense);
  if (disposition.mod !== 0) {
    contextMods += disposition.mod;
    details.push(`${disposition.detail}: ${disposition.mod > 0 ? '+' : ''}${disposition.mod}`);
  }

  // Tool
  const toolResult = getToolMod(input.verb, input.tool);
  if (toolResult.mod !== 0) {
    contextMods += toolResult.mod;
    details.push(`${toolResult.detail}: ${toolResult.mod > 0 ? '+' : ''}${toolResult.mod}`);
  }

  // Environment conditions
  const envResult = getEnvironmentMods(input.environmentConditions ?? []);
  if (envResult.mod !== 0) {
    contextMods += envResult.mod;
    for (const d of envResult.details) {
      details.push(`${d}: +${BALANCE.CONTEXT_MODIFIERS.IN_DARKNESS}`);
    }
  }

  // Player conditions
  const playerResult = getPlayerConditionMods(
    input.verb,
    input.playerStats,
    input.playerConditions ?? [],
  );
  if (playerResult.mod !== 0) {
    contextMods += playerResult.mod;
    for (const d of playerResult.details) {
      details.push(`${d}: ${playerResult.mod > 0 ? '+' : ''}${playerResult.mod}`);
    }
  }

  // Attached target bonus (body parts)
  if (input.target?.properties.includes('attached' as PropertyId)) {
    const attachedBonus = 3;
    contextMods += attachedBonus;
    details.push(`Cible attachée: +${attachedBonus}`);
  }

  // NPC defense — combat is not a separate DC system (decision S)
  const targetDefense = input.targetDefense ?? 0;
  if (targetDefense !== 0) {
    contextMods += targetDefense;
    details.push(`Défense de la cible: +${targetDefense}`);
  }

  // Creativity modifier
  let creativityMod = 0;
  if (input.creative && input.suggestions && input.suggestions.length > 0) {
    creativityMod = detectCreativity(
      {
        verb: input.verb,
        target: input.target,
        tool: input.tool,
        rawInput: '',
        tokens: [],
        verbMatch: { verb: input.verb, strategy: 1, confidence: 1, isCompound: false },
        creative: true,
      },
      input.suggestions,
    );
    if (creativityMod !== 0) {
      details.push(`Créativité: ${creativityMod}`);
    }
  }

  // Absurd actions carry no DC surcharge: the critical requirement is the whole
  // cost. Piling a penalty on top would punish the same thing twice.
  if (requiresCritical) {
    compatibilityPenalty = 0;
  }

  // Difficulty preset modifier
  const difficultyPresetMod = DIFFICULTY_PRESET_MODS[input.difficultyLevel];
  if (difficultyPresetMod !== 0) {
    details.push(`Difficulté (${input.difficultyLevel}): ${difficultyPresetMod > 0 ? '+' : ''}${difficultyPresetMod}`);
  }

  // Compute total
  const rawTotal = base + verbMod + compatibilityPenalty + contextMods + creativityMod + difficultyPresetMod;

  // Clamp
  const total = Math.max(
    BALANCE.MIN_DIFFICULTY,
    Math.min(BALANCE.MAX_DIFFICULTY, rawTotal),
  );

  if (rawTotal !== total) {
    details.push(`Clampé: ${rawTotal} → ${total} [${BALANCE.MIN_DIFFICULTY}-${BALANCE.MAX_DIFFICULTY}]`);
  }

  details.push(`Total: ${total}`);

  // === NAMED LINES FOR UI DECOMPOSITION ===
  const namedLines: DifficultyLine[] = [];

  // 1. Base line: verb nameKey + combined base+verbMod+preset
  const baseTotal = base + verbMod + difficultyPresetMod;
  namedLines.push({
    labelKey: VERB_REGISTRY[input.verb].nameKey,
    value: baseTotal,
    category: 'base',
  });

  // 2. Incompatibility
  if (compatibilityPenalty > 0) {
    namedLines.push({
      labelKey: 'dice.modifier.incompatible',
      value: compatibilityPenalty,
      category: 'penalty',
    });
  }

  // 3. Tool
  if (toolResult.mod !== 0) {
    const toolKey: StringKey = toolResult.mod < 0
      ? 'dice.modifier.toolAdapted'
      : toolResult.mod >= 5
        ? 'dice.modifier.noTool'
        : 'dice.modifier.toolWrong';
    namedLines.push({
      labelKey: toolKey,
      value: toolResult.mod,
      category: toolResult.mod < 0 ? 'bonus' : 'penalty',
    });
  }

  // 4. Environment — one line per active condition
  const envKeyMap: Partial<Record<EnvironmentCondition, StringKey>> = {
    dark:          'dice.modifier.dark',
    zero_g:        'dice.modifier.zeroG',
    time_pressure: 'dice.modifier.timePressure',
    on_fire:       'dice.modifier.onFire',
    flooded:       'dice.modifier.flooded',
    depressurized: 'dice.modifier.depressurized',
  };
  const envModMap: Readonly<Record<EnvironmentCondition, number>> = {
    dark:          BALANCE.CONTEXT_MODIFIERS.IN_DARKNESS,
    zero_g:        BALANCE.CONTEXT_MODIFIERS.ZERO_GRAVITY,
    time_pressure: BALANCE.CONTEXT_MODIFIERS.TIME_PRESSURE,
    on_fire:       BALANCE.CONTEXT_MODIFIERS.ON_FIRE,
    flooded:       BALANCE.CONTEXT_MODIFIERS.FLOODED,
    depressurized: BALANCE.CONTEXT_MODIFIERS.DEPRESSURIZED,
  };
  for (const condition of input.environmentConditions ?? []) {
    const key = envKeyMap[condition];
    if (key) {
      namedLines.push({ labelKey: key, value: envModMap[condition], category: 'penalty' });
    }
  }

  // 5. Target disposition
  if (disposition.mod !== 0) {
    const normalizedDetail = disposition.detail.toLowerCase();
    let dispKey: StringKey = 'dice.modifier.targetHostile';
    if (normalizedDetail.includes('coopérative') || normalizedDetail.includes('cooperative')) {
      dispKey = 'dice.modifier.targetCooperative';
    } else if (normalizedDetail.includes('fortifié') || normalizedDetail.includes('fortified') || normalizedDetail.includes('blindée') || normalizedDetail.includes('armored')) {
      dispKey = 'dice.modifier.targetArmored';
    }
    namedLines.push({
      labelKey: dispKey,
      value: disposition.mod,
      category: disposition.mod > 0 ? 'penalty' : 'bonus',
    });
  }

  // 6. Attached target (body parts)
  if (input.target?.properties.includes('attached' as PropertyId)) {
    namedLines.push({
      labelKey: 'dice.modifier.targetAttached',
      value: 3,
      category: 'penalty',
    });
  }

  // 6b. NPC defense
  if (targetDefense !== 0) {
    namedLines.push({
      labelKey: 'dice.modifier.targetDefense',
      value: targetDefense,
      category: 'penalty',
    });
  }

  // 7. Player conditions
  if (input.playerConditions?.includes('wounded')) {
    namedLines.push({
      labelKey: 'dice.modifier.wounded',
      value: BALANCE.CONTEXT_MODIFIERS.WOUNDED_PLAYER,
      category: 'penalty',
    });
  }
  if (input.playerConditions?.includes('terrified')) {
    namedLines.push({
      labelKey: 'dice.modifier.terrified',
      value: BALANCE.CONTEXT_MODIFIERS.TERRIFIED_PLAYER,
      category: 'penalty',
    });
  }

  // 8. High stat bonus
  const nlStatId = VERB_STATS[input.verb] as StatId | undefined;
  if (nlStatId && input.playerStats[nlStatId] >= BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_THRESHOLD) {
    namedLines.push({
      labelKey: 'dice.modifier.highStat',
      labelParams: { stat: nlStatId },
      value: BALANCE.CONTEXT_MODIFIERS.HIGH_RELEVANT_STAT_BONUS,
      category: 'bonus',
    });
  }

  // 9. Creativity
  if (creativityMod !== 0) {
    namedLines.push({
      labelKey: 'dice.modifier.creative',
      value: creativityMod,
      category: 'bonus',
    });
  }

  // NOTE: Ship Memory injected AFTER calculateDifficulty() in processTurn.ts
  // NOTE: Failsafe is NEVER shown in the UI

  return {
    base,
    verbMod,
    compatibilityPenalty,
    contextMods,
    creativityMod,
    difficultyPresetMod,
    total,
    details,
    namedLines,
    severity: compatSeverity,
    requiresCritical,
  };
}
