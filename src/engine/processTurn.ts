// ---------------------------------------------------------------------------
// src/engine/processTurn.ts — 10-step turn execution orchestrator
// ---------------------------------------------------------------------------
// Wires together all Phase 2-4 subsystems into the canonical turn loop:
//
//  1. Parse input → ParsedAction | Reformulation
//  2. Creativity check → DC bonus
//  3. Condition tick → HP drain, timer decrement
//  4. Oxygen tick → O2 drain, HP drain if O2 = 0
//  5. Action resolution → D20 roll + DC calculation
//  6. Consequence application → state changes, condition triggers, death check
//  7. NPC reaction (if activeCombat) → NPC attacks, death check again
//  8. Stalker clock check → increment, threshold events
//  9. Threat director check → placeholder (Phase 5)
// 10. Narrative composition → placeholder (Phase 5)
// ---------------------------------------------------------------------------

import type {
  GameState, TurnResult, SceneContext, ParserLocaleData, RngFn,
  DiceResult, ActionRecord,
} from './types';
import { defaultRng, classifyOutcome } from './dice';
import { rollCheck } from './dice';
import { parseAction } from './parser';
import { detectCreativity, calculateDifficulty } from './difficulty';
import { isReformulation } from './types';
import { tickConditions, checkConditionTriggers, addCondition, applyConditionMalus } from './conditions';
import { tickOxygen } from './oxygen';
import { tickStalkerClock, checkStalkerClock, applyStalkerEvent } from './stalkerClock';
import { VERB_STATS, AUTO_VERBS } from './verbs';
import { buildConsequences, applyConsequences } from './consequences';
import { checkDeath, applyDeath, updateCharacterHp } from './state';
import { createMark, addMark, getMarksForTarget, getMarkDCModifier } from './shipMemory';
import { recordAttempt, getObstacleKey, checkFailsafe } from './failsafe';
import { resolveNPCAttack } from './combat';

/**
 * Process a single player turn through the full 10-step execution order.
 *
 * @param state       Current immutable game state
 * @param input       Raw player input string
 * @param context     Current scene view (must include atmosphere + locationId for Phase 4)
 * @param parserData  Locale-specific parser data
 * @param rng         Injectable RNG (defaults to Math.random)
 */
export function processTurn(
  state: GameState,
  input: string,
  context: SceneContext,
  parserData: ParserLocaleData,
  rng: RngFn = defaultRng,
): TurnResult {
  // Guard: can't process turns when game is not active
  if (state.phase === 'defeat' || state.phase === 'victory' || state.character === null) {
    return {
      newState: state,
      narrative: '',
      diceRoll: null,
      suggestions: [],
    };
  }

  // Convenience aliases
  const char = state.character;
  const atmosphere = context.atmosphere ?? 'pressurized';
  const locationId = context.locationId ?? '';

  // ─────────────────────────────────────────────────────────
  // STEP 1: Parse input → ParsedAction | Reformulation
  // ─────────────────────────────────────────────────────────
  const parseResult = parseAction(input, context, parserData);

  // If ambiguous → return reformulation prompt, no dice roll
  if (isReformulation(parseResult)) {
    return {
      newState: { ...state, turn: state.turn + 1 },
      narrative: parseResult.prompt,
      diceRoll: null,
      suggestions: [],
    };
  }

  const action = parseResult;

  // ─────────────────────────────────────────────────────────
  // STEP 2: Creativity check → DC modifier
  // ─────────────────────────────────────────────────────────
  const _creativityMod = detectCreativity(action, context.suggestions);

  // ─────────────────────────────────────────────────────────
  // STEP 3: Condition tick → HP drain, timer decrement
  // ─────────────────────────────────────────────────────────
  const { updatedConditions, hpDrain: conditionHpDrain } = tickConditions(char.conditions);
  let current: GameState = {
    ...state,
    character: { ...char, conditions: updatedConditions },
  };
  if (conditionHpDrain > 0) {
    current = updateCharacterHp(current, -conditionHpDrain);
  }

  // ─────────────────────────────────────────────────────────
  // STEP 4: Oxygen tick → O2 drain, HP drain if O2 = 0
  // ─────────────────────────────────────────────────────────
  const hasEvaSuit = char.equippedArmor === 'eva_suit';
  const { newOxygen, hpDrain: oxygenHpDrain } = tickOxygen(
    { current: current.character!.oxygen, max: 100 },
    atmosphere,
    hasEvaSuit,
  );
  current = {
    ...current,
    character: { ...current.character!, oxygen: newOxygen.current },
  };
  if (oxygenHpDrain > 0) {
    current = updateCharacterHp(current, -oxygenHpDrain);
  }

  // ─────────────────────────────────────────────────────────
  // STEP 5: Action resolution → D20 roll
  // ─────────────────────────────────────────────────────────
  const isAutoVerb = AUTO_VERBS.has(action.verb);
  let diceRoll: DiceResult | null = null;

  if (!isAutoVerb) {
    const statId = VERB_STATS[action.verb] ?? 'FOR';
    const effectiveStats = applyConditionMalus(current.character!.stats, current.character!.conditions);
    const statValue = effectiveStats[statId] ?? 0;
    const lck = effectiveStats['LCK'] ?? 0;

    // Ship Memory DC modifier for this target
    const targetId = action.target?.id ?? '';
    const targetMarks = locationId && targetId
      ? getMarksForTarget(current.shipMemory, locationId, targetId)
      : [];
    const shipMemoryMod = getMarkDCModifier(targetMarks, action.verb);

    // Failsafe DC reduction (if obstacle has been attempted enough times)
    const obstacleKey = getObstacleKey(locationId, targetId);
    const obstacle = locationId && targetId ? current.obstacleAttempts[obstacleKey] : undefined;
    const failsafeResult = checkFailsafe(obstacle, current.difficulty);
    const failsafeMod = failsafeResult?.dcReduction ? -failsafeResult.dcReduction : 0;

    // Calculate DC
    const breakdown = calculateDifficulty({
      verb: action.verb,
      target: action.target,
      tool: action.tool,
      playerStats: effectiveStats,
      difficultyLevel: current.difficulty,
      creative: action.creative,
      environmentConditions: context.environmentConditions,
      playerConditions: current.character!.conditions.map(c => c.id),
      suggestions: context.suggestions,
    });

    // Total DC with all modifiers (ship memory + failsafe)
    const conditionRollMod = current.character!.conditions.some(
      c => c.id === 'terrified',
    ) ? -1 : 0;

    const totalDC = breakdown.total + shipMemoryMod + failsafeMod;
    const effectiveDC = Math.max(2, Math.min(25, totalDC));

    diceRoll = rollCheck(statId, statValue, lck, effectiveDC, conditionRollMod, rng);

    // ───────────────────────────────────────────────────────
    // STEP 6: Consequence application
    // ───────────────────────────────────────────────────────
    const outcome = classifyOutcome(diceRoll.natural, diceRoll.total, effectiveDC);
    const consequences = buildConsequences(action.verb, action.target, outcome);
    current = applyConsequences(current, consequences, context, rng);

    // Ship Memory: failed actions mark the environment
    if ((outcome === 'failure' || outcome === 'crit_failure') && action.target && locationId) {
      const markOutcome: 'failure' | 'critical_failure' = outcome === 'crit_failure' ? 'critical_failure' : 'failure';
      const mark = createMark(
        locationId,
        action.target.id,
        action.verb,
        action.target.properties,
        markOutcome,
        current.turn,
      );
      if (mark) {
        current = { ...current, shipMemory: addMark(current.shipMemory, mark) };
      }

      // Record obstacle attempt for failsafe tracking
      if (action.target) {
        current = {
          ...current,
          obstacleAttempts: recordAttempt(
            current.obstacleAttempts,
            locationId,
            action.target.id,
            action.verb,
          ),
        };
      }
    }

    // Condition triggers from this action's outcome
    const hp = current.character!.hp;
    const maxHp = current.character!.maxHp;
    const triggeredConditions = checkConditionTriggers(
      hp, maxHp, current.character!.conditions,
      { criticalFailure: outcome === 'crit_failure' },
      rng,
    );
    for (const condId of triggeredConditions) {
      current = {
        ...current,
        character: {
          ...current.character!,
          conditions: addCondition(current.character!.conditions, condId),
        },
      };
    }

    // Death check after player action
    const deathResult = checkDeath(
      current.character!.hp,
      current.character!.maxHp,
      current.difficulty,
      current.secondChanceUsed,
    );
    if (deathResult) {
      current = applyDeath(current, deathResult);
      if (current.phase === 'defeat') {
        return buildResult(current, diceRoll, input, action.verb, action.target?.id ?? null, 'permadeath');
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 7: NPC reaction (if activeCombat present)
  // ─────────────────────────────────────────────────────────
  if (current.activeCombat && current.character !== null) {
    const combat = current.activeCombat;
    const npc = combat.npc;

    // Determine NPC armor value from equippedArmor (simplified: 0 for now)
    const armorValue = 0; // TODO: resolve from item definitions in content layer
    const difficultyMultiplier = current.difficulty === 'explorer' ? 0.5
      : current.difficulty === 'nightmare' ? 1.5 : 1.0;

    const npcAttack = resolveNPCAttack(
      npc.attack,
      npc.aggressionPattern,
      npc.hp,
      npc.maxHp,
      current.character.stats,
      armorValue,
      difficultyMultiplier,
      rng,
    );

    if (npcAttack.hit) {
      current = updateCharacterHp(current, -npcAttack.damageDealt);
    }

    // Update combat round
    current = {
      ...current,
      activeCombat: {
        ...combat,
        round: combat.round + 1,
      },
    };

    // Death check after NPC attack
    if (current.character !== null) {
      const deathResult2 = checkDeath(
        current.character.hp,
        current.character.maxHp,
        current.difficulty,
        current.secondChanceUsed,
      );
      if (deathResult2) {
        current = applyDeath(current, deathResult2);
        if (current.phase === 'defeat') {
          return buildResult(current, diceRoll, input, action.verb, action.target?.id ?? null, 'npc_attack');
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 8: Stalker clock check
  // ─────────────────────────────────────────────────────────
  const newClockState = tickStalkerClock(current.stalkerClockState);
  const stalkerEvent = checkStalkerClock(newClockState, current.difficulty);
  const finalClockState = stalkerEvent
    ? applyStalkerEvent(newClockState, stalkerEvent)
    : newClockState;

  current = { ...current, stalkerClockState: finalClockState };

  // ─────────────────────────────────────────────────────────
  // STEP 9: Threat director check (placeholder — Phase 5)
  // ─────────────────────────────────────────────────────────
  // Future: roll for random encounter based on beat + stalker state

  // ─────────────────────────────────────────────────────────
  // STEP 10: Narrative composition (placeholder — Phase 5)
  // ─────────────────────────────────────────────────────────
  const narrative = ''; // Phase 5: 7-layer narrative composition

  // Increment turn counter
  current = { ...current, turn: current.turn + 1 };

  // Record action in history
  const record: ActionRecord = {
    input,
    parsedVerb: action.verb,
    targetId: action.target?.id ?? null,
    diceResult: diceRoll,
    outcome: diceRoll ? (diceRoll.success ? 'success' : 'failure') : 'auto',
    timestamp: Date.now(),
  };
  current = { ...current, actionHistory: [...current.actionHistory, record] };

  return {
    newState: current,
    narrative,
    diceRoll,
    suggestions: [], // Phase 5: suggestion generation
  };
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function buildResult(
  state: GameState,
  diceRoll: DiceResult | null,
  input: string,
  verb: string,
  targetId: string | null,
  outcome: string,
): TurnResult {
  const record: ActionRecord = {
    input,
    parsedVerb: verb,
    targetId,
    diceResult: diceRoll,
    outcome,
    timestamp: Date.now(),
  };
  const newState = {
    ...state,
    turn: state.turn + 1,
    actionHistory: [...state.actionHistory, record],
  };
  return { newState, narrative: '', diceRoll, suggestions: [] };
}
