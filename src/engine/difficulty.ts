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
import { BALANCE } from './constants';
import type {
  DifficultyBreakdown,
  DifficultyInput,
  DifficultyLevel,
  ParsedAction,
  ResolvedTarget,
  StatBlock,
  StatId,
  EnvironmentCondition,
} from './types';

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
 * - Absurd but possible: ABSURD_BUT_POSSIBLE_BONUS (-3)
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

/** Check if an action is absurd (incompatible verb+target with high penalty) */
function isAbsurdAction(verb: VerbId, target: ResolvedTarget | null): boolean {
  if (!target || target.source === 'abstract') return true;
  const compat = checkCompatibility({
    verbId: verb,
    targetProps: target.properties,
    playerToolProps: [],
  });
  return compat.difficultyPenalty >= BALANCE.CONTEXT_MODIFIERS.ABSURD_MIN_BONUS;
}

// === TARGET DISPOSITION ===

/** Get target disposition modifier based on properties */
function getTargetDispositionMod(target: ResolvedTarget | null): { mod: number; detail: string } {
  if (!target) return { mod: 0, detail: '' };

  const props = new Set(target.properties);

  if (props.has('friendly') || props.has('willing')) {
    return { mod: BALANCE.CONTEXT_MODIFIERS.COOPERATIVE_TARGET, detail: 'Cible coopérative' };
  }
  if (props.has('hostile')) {
    return { mod: BALANCE.CONTEXT_MODIFIERS.HOSTILE_TARGET, detail: 'Cible hostile' };
  }
  if (props.has('secured') && props.has('locked')) {
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
  const base = BALANCE.BASE_DIFFICULTY;
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
    };
  }

  // Verb modifier
  const verbEntry = VERB_REGISTRY[input.verb];
  const verbMod = verbEntry.difficultyMod;
  if (verbMod !== 0) {
    details.push(`Verbe (${input.verb}): ${verbMod > 0 ? '+' : ''}${verbMod}`);
  }

  // Compatibility penalty
  let compatibilityPenalty = 0;
  if (input.target && input.target.source !== 'abstract') {
    const compat = checkCompatibility({
      verbId: input.verb,
      targetProps: input.target.properties,
      playerToolProps: input.tool?.properties ?? [],
    });
    compatibilityPenalty = compat.difficultyPenalty;
    if (compatibilityPenalty > 0) {
      details.push(`Incompatibilité: +${compatibilityPenalty}${compat.failedClause ? ` (${compat.failedClause})` : ''}`);
    }
  }

  // Context modifiers
  let contextMods = 0;

  // Target disposition
  const disposition = getTargetDispositionMod(input.target);
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

  // Absurd action check
  if (isAbsurdAction(input.verb, input.target)) {
    const absurdBonus = BALANCE.CREATIVITY.ABSURD_BUT_POSSIBLE_BONUS;
    creativityMod += absurdBonus;
    details.push(`Action absurde mais possible: ${absurdBonus}`);
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

  return {
    base,
    verbMod,
    compatibilityPenalty,
    contextMods,
    creativityMod,
    difficultyPresetMod,
    total,
    details,
    namedLines: [],
  };
}
