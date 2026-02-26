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
  GameState, TurnResult, TurnDebugTrace, SceneContext, ParserLocaleData, RngFn,
  DiceResult, ActionRecord, DifficultyBreakdown, Consequence, ConsequenceType,
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
import { addItem } from './inventory';
import { createMark, addMark, getMarksForTarget, getMarkDCModifier } from './shipMemory';
import { recordAttempt, getObstacleKey, checkFailsafe } from './failsafe';
import { resolveNPCAttack } from './combat';
import { checkVictory, checkAdditionalDefeat } from './victory';
import { threatCheck, transitionBeat } from './threat';
import { createVisitState, markRevisit, markItemTaken } from './backtracking';
import { buildVictoryCheckContext } from './game';
import { resolveScenarioInteraction, resolveItemUseOn } from './interactionResolver';
import { setFeatureState, revealItem, unlockExit, setScenarioFlag, unsetScenarioFlag, hasScenarioFlag } from './featureState';
import { isEnrichedItem } from './scenario';
import { removeItem } from './inventory';

// ---------------------------------------------------------------------------
// Empty trace factory — used for early returns
// ---------------------------------------------------------------------------

function emptyTrace(atmosphere: string, o2: number): TurnDebugTrace {
  return {
    reformulated: false,
    reformulationPrompt: null,
    parsedVerb: null,
    parsedTarget: null,
    parsedTargetName: null,
    parseStrategy: 0,
    parseCreative: false,
    creativityMod: 0,
    conditionHpDrain: 0,
    conditionsExpired: [],
    atmosphere,
    o2Before: o2,
    o2After: o2,
    oxygenHpDrain: 0,
    isAutoVerb: false,
    statId: null,
    effectiveStatValue: 0,
    shipMemoryMod: 0,
    failsafeActivated: false,
    failsafeDcReduction: 0,
    difficultyBreakdown: null,
    effectiveDC: 0,
    outcome: null,
    consequenceTypes: [],
    consequenceDetails: [],
    triggeredConditions: [],
    deathResult: null,
    npcReacted: false,
    npcAttackHit: false,
    npcAttackDamage: 0,
    stalkerClockBefore: 0,
    stalkerClockAfter: 0,
    stalkerEventType: null,
  };
}

// ---------------------------------------------------------------------------
// Consequence detail formatter
// ---------------------------------------------------------------------------

function formatConsequenceDetail(c: Consequence): string {
  switch (c.type) {
    case 'damage': return `damage ${c.amount ?? '?'} to ${c.targetId ?? 'player'}`;
    case 'heal': return `heal ${c.amount ?? '?'} to ${c.targetId ?? 'player'}`;
    case 'condition_add': return `add condition: ${c.conditionId ?? '?'}`;
    case 'condition_remove': return `remove condition: ${c.conditionId ?? '?'}`;
    case 'inventory_add': return `add item: ${c.itemId ?? '?'}`;
    case 'inventory_remove': return `remove item: ${c.itemId ?? '?'}`;
    case 'item_break': return `item broken: ${c.targetId ?? '?'}`;
    case 'environment_change': return `environment change on ${c.targetId ?? '?'}`;
    case 'ship_memory_mark': return `ship memory mark on ${c.targetId ?? '?'}`;
    case 'atmosphere_change': return `atmosphere → ${c.atmosphereType ?? '?'}`;
    case 'npc_killed': return `npc killed: ${c.targetId ?? '?'}`;
    case 'npc_flee': return `npc fled: ${c.targetId ?? '?'}`;
    default: return c.type;
  }
}

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
  const atmosphere = context.atmosphere ?? 'pressurized';
  const locationId = context.locationId ?? '';
  const o2Initial = state.character?.oxygen ?? 100;

  // Guard: can't process turns when game is not active
  if (state.phase === 'defeat' || state.phase === 'victory' || state.character === null) {
    return {
      newState: state,
      narrative: '',
      diceRoll: null,
      suggestions: [],
      trace: emptyTrace(atmosphere, o2Initial),
    };
  }

  // Convenience aliases
  const char = state.character;

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
      trace: {
        ...emptyTrace(atmosphere, o2Initial),
        reformulated: true,
        reformulationPrompt: parseResult.prompt,
      },
    };
  }

  const action = parseResult;

  // ─────────────────────────────────────────────────────────
  // STEP 2: Creativity check → DC modifier
  // ─────────────────────────────────────────────────────────
  const creativityMod = detectCreativity(action, context.suggestions);

  // ─────────────────────────────────────────────────────────
  // STEP 3: Condition tick → HP drain, timer decrement
  // ─────────────────────────────────────────────────────────
  const prevConditionIds = new Set(char.conditions.map(c => c.id));
  const { updatedConditions, hpDrain: conditionHpDrain } = tickConditions(char.conditions);
  const newConditionIds = new Set(updatedConditions.map(c => c.id));
  const conditionsExpired = char.conditions
    .filter(c => prevConditionIds.has(c.id) && !newConditionIds.has(c.id))
    .map(c => c.id);

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
  const hasEvaSuit = char.equippedArmor === 'eva_suit'
    || char.inventory.includes('eva_suit');

  // Adjust effective atmosphere based on scenario flags (C3-6)
  let effectiveAtmosphere = atmosphere;
  if (state.scenario !== null) {
    if (hasScenarioFlag(state, 'o2_stabilized')) {
      // Life support repaired → zone becomes pressurized
      effectiveAtmosphere = 'pressurized';
    } else if (hasScenarioFlag(state, 'sections_sealed')) {
      // Sections sealed → downgrade drain by one level
      if (effectiveAtmosphere === 'depressurized') {
        effectiveAtmosphere = 'low_oxygen';
      } else if (effectiveAtmosphere === 'low_oxygen') {
        effectiveAtmosphere = 'pressurized';
      }
    }
  }

  const o2Before = current.character!.oxygen;
  const { newOxygen, hpDrain: oxygenHpDrain } = tickOxygen(
    { current: o2Before, max: 100 },
    effectiveAtmosphere,
    hasEvaSuit,
  );
  const o2After = newOxygen.current;
  current = {
    ...current,
    character: { ...current.character!, oxygen: o2After },
  };
  if (oxygenHpDrain > 0) {
    current = updateCharacterHp(current, -oxygenHpDrain);
  }

  // ─────────────────────────────────────────────────────────
  // STEP 4b: Scenario interaction check
  // ─────────────────────────────────────────────────────────
  // Called BEFORE standard resolution. If a ScenarioInteraction matches,
  // its results are applied and steps 5-6 are skipped.
  // ─────────────────────────────────────────────────────────
  let scenarioNarrativeOverride: import('./scenario').LocaleString | null = null;
  let scenarioInteractionHandled = false;

  if (current.scenario !== null && action.target !== null) {
    const targetId = action.target.id;
    const node = current.playerLocationId !== null
      ? current.scenario.graph.nodes.find(n => n.id === current.playerLocationId)
      : undefined;

    if (node) {
      // Try "use item on target" first (USE <item> ON <target>)
      let interactionResult = { matched: false } as import('./interactionResolver').InteractionResolution;

      if (action.verb === 'USE' && action.tool) {
        const toolId = action.tool.id;
        // Look for the item definition in the scenario graph nodes
        const toolItemDef = findItemDefInGraph(current, toolId);
        if (toolItemDef && isEnrichedItem(toolItemDef)) {
          interactionResult = resolveItemUseOn(
            toolId, toolItemDef, targetId, current, locationId, rng,
          );
        }
      }

      // Fall through to feature interaction if useOn didn't match
      if (!interactionResult.matched) {
        const featureDef = node.features.find(f => f.id === targetId) ?? null;
        interactionResult = resolveScenarioInteraction(
          action.verb, targetId, featureDef, current, locationId, rng,
        );
      }

      if (interactionResult.matched) {
        scenarioInteractionHandled = true;
        scenarioNarrativeOverride = interactionResult.narrativeOverride;

        // Apply feature state change
        if (interactionResult.newFeatureState !== null) {
          current = setFeatureState(current, targetId, interactionResult.newFeatureState);
        }

        // Apply consequences (damage, heal, etc.)
        if (interactionResult.consequences.length > 0) {
          current = applyConsequences(current, interactionResult.consequences, context, rng);
        }

        // Reveal items
        for (const itemId of interactionResult.itemsToReveal) {
          current = revealItem(current, itemId);
        }

        // Unlock exit (stored in unlockedExits — key is locationId:exitId for now)
        if (interactionResult.exitToUnlock !== null && current.playerLocationId !== null) {
          current = unlockExit(current, current.playerLocationId, interactionResult.exitToUnlock);
        }

        // Set/unset flags
        if (interactionResult.flagToSet !== null) {
          current = setScenarioFlag(current, interactionResult.flagToSet);
        }
        if (interactionResult.flagToUnset !== null) {
          current = unsetScenarioFlag(current, interactionResult.flagToUnset);
        }

        // Consume required item from inventory
        if (interactionResult.itemToConsume !== null && current.character !== null) {
          const { inventory: newInventory } = removeItem(
            current.character.inventory, interactionResult.itemToConsume,
          );
          current = { ...current, character: { ...current.character, inventory: newInventory } };
        }

        // Death check after interaction consequences
        if (current.character !== null) {
          const interactionDeathResult = checkDeath(
            current.character.hp, current.character.maxHp, current.difficulty, current.secondChanceUsed,
          );
          if (interactionDeathResult) {
            current = applyDeath(current, interactionDeathResult);
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 5: Action resolution → D20 roll
  // ─────────────────────────────────────────────────────────
  const isAutoVerb = AUTO_VERBS.has(action.verb);
  let diceRoll: DiceResult | null = null;

  // Trace data for step 5 (populated if not auto-verb)
  let traceStatId: import('./types').StatId | null = null;
  let traceStatValue = 0;
  let traceShipMemoryMod = 0;
  let traceFailsafeActivated = false;
  let traceFailsafeDcReduction = 0;
  let traceDifficultyBreakdown: DifficultyBreakdown | null = null;
  let traceEffectiveDC = 0;
  let traceOutcome: import('./types').RollOutcome | null = null;
  let traceConsequences: readonly Consequence[] = [];
  let traceTriggeredConditions: readonly string[] = [];
  let traceDeathResult: string | null = null;

  if (!isAutoVerb && !scenarioInteractionHandled) {
    const statId = VERB_STATS[action.verb] ?? 'FOR';
    const effectiveStats = applyConditionMalus(current.character!.stats, current.character!.conditions);
    const statValue = effectiveStats[statId] ?? 0;
    const lck = effectiveStats['LCK'] ?? 0;

    traceStatId = statId;
    traceStatValue = statValue;

    // Ship Memory DC modifier for this target
    const targetId = action.target?.id ?? '';
    const targetMarks = locationId && targetId
      ? getMarksForTarget(current.shipMemory, locationId, targetId)
      : [];
    const shipMemoryMod = getMarkDCModifier(targetMarks, action.verb);
    traceShipMemoryMod = shipMemoryMod;

    // Failsafe DC reduction (if obstacle has been attempted enough times)
    const obstacleKey = getObstacleKey(locationId, targetId);
    const obstacle = locationId && targetId ? current.obstacleAttempts[obstacleKey] : undefined;
    const failsafeResult = checkFailsafe(obstacle, current.difficulty);
    const failsafeMod = failsafeResult?.dcReduction ? -failsafeResult.dcReduction : 0;
    traceFailsafeActivated = failsafeResult?.activated ?? false;
    traceFailsafeDcReduction = failsafeResult?.dcReduction ?? 0;

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
    traceDifficultyBreakdown = breakdown;

    // Total DC with all modifiers (ship memory + failsafe)
    const conditionRollMod = current.character!.conditions.some(
      c => c.id === 'terrified',
    ) ? -1 : 0;

    const totalDC = breakdown.total + shipMemoryMod + failsafeMod;
    const effectiveDC = Math.max(2, Math.min(25, totalDC));
    traceEffectiveDC = effectiveDC;

    diceRoll = rollCheck(statId, statValue, lck, effectiveDC, conditionRollMod, rng);

    // ───────────────────────────────────────────────────────
    // STEP 6: Consequence application
    // ───────────────────────────────────────────────────────
    const outcome = classifyOutcome(diceRoll.natural, diceRoll.total, effectiveDC);
    traceOutcome = outcome;

    const consequences = buildConsequences(action.verb, action.target, outcome);
    traceConsequences = consequences;
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
    // Increment actionsWithoutRest (WAIT resets it; all other verbs increment)
    const newActionsWithoutRest = action.verb === 'WAIT'
      ? 0
      : current.character!.actionsWithoutRest + 1;
    current = {
      ...current,
      character: { ...current.character!, actionsWithoutRest: newActionsWithoutRest },
    };
    const triggeredConditions = checkConditionTriggers(
      hp, maxHp, current.character!.conditions,
      {
        criticalFailure: outcome === 'crit_failure',
        actionsWithoutRest: newActionsWithoutRest,
        firstThreatEncounter: state.activeCombat?.round === 1,
      },
      rng,
    );
    traceTriggeredConditions = triggeredConditions;
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
      traceDeathResult = deathResult.type;
      current = applyDeath(current, deathResult);
      if (current.phase === 'defeat') {
        return buildResult(
          current, diceRoll, input, action.verb, action.target?.id ?? null, 'permadeath',
          buildFullTrace({
            action, creativityMod, conditionHpDrain, conditionsExpired,
            atmosphere, o2Before, o2After, oxygenHpDrain, isAutoVerb,
            statId: traceStatId, statValue: traceStatValue,
            shipMemoryMod: traceShipMemoryMod,
            failsafeActivated: traceFailsafeActivated, failsafeDcReduction: traceFailsafeDcReduction,
            breakdown: traceDifficultyBreakdown, effectiveDC: traceEffectiveDC,
            outcome: traceOutcome, consequences: traceConsequences,
            triggeredConditions: traceTriggeredConditions, deathResult: traceDeathResult,
            npcReacted: false, npcAttackHit: false, npcAttackDamage: 0,
            stalkerClockBefore: current.stalkerClockState.actionsSinceLastProgression,
            stalkerClockAfter: current.stalkerClockState.actionsSinceLastProgression,
            stalkerEventType: null,
          }),
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 7: NPC reaction (if activeCombat present)
  // ─────────────────────────────────────────────────────────
  let npcReacted = false;
  let npcAttackHit = false;
  let npcAttackDamage = 0;

  if (current.activeCombat && current.character !== null) {
    npcReacted = true;
    const combat = current.activeCombat;
    const npc = combat.npc;

    const armorValue = 0;
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

    npcAttackHit = npcAttack.hit;
    npcAttackDamage = npcAttack.hit ? npcAttack.damageDealt : 0;

    if (npcAttack.hit) {
      current = updateCharacterHp(current, -npcAttack.damageDealt);
    }

    current = {
      ...current,
      activeCombat: {
        ...combat,
        round: combat.round + 1,
      },
    };

    if (current.character !== null) {
      const deathResult2 = checkDeath(
        current.character.hp,
        current.character.maxHp,
        current.difficulty,
        current.secondChanceUsed,
      );
      if (deathResult2) {
        traceDeathResult = deathResult2.type;
        current = applyDeath(current, deathResult2);
        if (current.phase === 'defeat') {
          return buildResult(
            current, diceRoll, input, action.verb, action.target?.id ?? null, 'npc_attack',
            buildFullTrace({
              action, creativityMod, conditionHpDrain, conditionsExpired,
              atmosphere, o2Before, o2After, oxygenHpDrain, isAutoVerb,
              statId: traceStatId, statValue: traceStatValue,
              shipMemoryMod: traceShipMemoryMod,
              failsafeActivated: traceFailsafeActivated, failsafeDcReduction: traceFailsafeDcReduction,
              breakdown: traceDifficultyBreakdown, effectiveDC: traceEffectiveDC,
              outcome: traceOutcome, consequences: traceConsequences,
              triggeredConditions: traceTriggeredConditions, deathResult: traceDeathResult,
              npcReacted, npcAttackHit, npcAttackDamage,
              stalkerClockBefore: current.stalkerClockState.actionsSinceLastProgression,
              stalkerClockAfter: current.stalkerClockState.actionsSinceLastProgression,
              stalkerEventType: null,
            }),
          );
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 8: Stalker clock check
  // ─────────────────────────────────────────────────────────
  const stalkerClockBefore = current.stalkerClockState.actionsSinceLastProgression;
  const newClockState = tickStalkerClock(current.stalkerClockState);
  const stalkerEvent = checkStalkerClock(newClockState, current.difficulty);
  const finalClockState = stalkerEvent
    ? applyStalkerEvent(newClockState, stalkerEvent)
    : newClockState;
  const stalkerClockAfter = finalClockState.actionsSinceLastProgression;

  current = { ...current, stalkerClockState: finalClockState };

  // ─────────────────────────────────────────────────────────
  // STEP 9: Phase 6B — movement, visit tracking, victory/defeat, threat
  // ─────────────────────────────────────────────────────────

  const syncBeatFromCurrentLocation = (s: GameState): GameState => {
    if (s.scenario === null || s.playerLocationId === null) return s;
    const node = s.scenario.graph.nodes.find(n => n.id === s.playerLocationId);
    if (!node?.isCoreNode || node.beat === s.currentBeat) return s;
    return {
      ...s,
      currentBeat: node.beat,
      threatDirectorState: transitionBeat(s.threatDirectorState, node.beat),
    };
  };

  // 9a. Movement: if the action is MOVE_TO, update location and visit state
  if (action.verb === 'MOVE_TO' && action.target?.source === 'connected_location') {
    const newLocationId = action.target.id;
    const existingVisit = current.visitedLocations[newLocationId];
    const updatedVisit = existingVisit
      ? markRevisit(existingVisit)
      : createVisitState(current.turn);
    current = {
      ...current,
      playerLocationId: newLocationId,
      visitedLocations: {
        ...current.visitedLocations,
        [newLocationId]: updatedVisit,
      },
    };
  }

  // 9b. Keep beat/threat director aligned with the player's current core node.
  current = syncBeatFromCurrentLocation(current);

  // 9b-2. Item tracking: TAKE is an auto-verb — always succeeds immediately
  if (
    action.verb === 'TAKE' &&
    action.target?.source === 'location' &&
    action.target.id &&
    current.playerLocationId !== null &&
    current.character !== null
  ) {
    const itemId = action.target.id;
    const locId = current.playerLocationId;
    // Add to inventory (deduplication guard)
    if (!current.character.inventory.includes(itemId)) {
      const { inventory: newInventory } = addItem(current.character.inventory, itemId);
      current = { ...current, character: { ...current.character, inventory: newInventory } };
    }
    // Mark item as taken in visit state so it no longer appears in the scene
    const existingVisit = current.visitedLocations[locId];
    if (existingVisit) {
      current = {
        ...current,
        visitedLocations: {
          ...current.visitedLocations,
          [locId]: markItemTaken(existingVisit, itemId),
        },
        itemsUsedCount: current.itemsUsedCount + 1,
      };
    }
  }

  // 9c. Victory / defeat check (only when a scenario is active)
  if (current.scenario !== null && current.victoryResult === null && current.defeatCondition === null) {
    const victoryCtx = buildVictoryCheckContext(current);
    const victoryResult = checkVictory(victoryCtx, current.scenario.skeleton);
    if (victoryResult !== null) {
      current = { ...current, victoryResult, phase: 'victory' };
    } else {
      const defeatCondition = checkAdditionalDefeat(
        victoryCtx,
        current.scenario.skeleton.additionalDefeatConditions ?? [],
      );
      if (defeatCondition !== null) {
        current = { ...current, defeatCondition, phase: 'defeat' };
      }
    }
  }

  // 9d. Threat director check
  if (current.scenario !== null && current.phase === 'playing') {
    const currentNode = current.playerLocationId !== null
      ? current.scenario.graph.nodes.find(n => n.id === current.playerLocationId)
      : undefined;
    const moduleHasThreat = currentNode?.moduleId !== undefined;

    const threatRng = {
      float: rng,
      pick: <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!,
    };
    const { updatedDirector, event } = threatCheck(
      current.threatDirectorState,
      moduleHasThreat,
      threatRng,
    );
    current = {
      ...current,
      threatDirectorState: updatedDirector,
      encounterCount: event?.type === 'encounter'
        ? current.encounterCount + 1
        : current.encounterCount,
    };
    // Threat event is surfaced via TurnResult (narrative layer handles rendering)
    void event; // consumed by narrative layer (Phase 5/7)
  }

  // ─────────────────────────────────────────────────────────
  // STEP 10: Narrative composition (placeholder — Phase 5)
  // ─────────────────────────────────────────────────────────
  // If a scenario interaction provided a narrative override, use it; otherwise standard templates
  const narrative = scenarioNarrativeOverride?.fr ?? ''; // Phase 5: 7-layer narrative composition

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

  const trace = buildFullTrace({
    action, creativityMod, conditionHpDrain, conditionsExpired,
    atmosphere, o2Before, o2After, oxygenHpDrain, isAutoVerb,
    statId: traceStatId, statValue: traceStatValue,
    shipMemoryMod: traceShipMemoryMod,
    failsafeActivated: traceFailsafeActivated, failsafeDcReduction: traceFailsafeDcReduction,
    breakdown: traceDifficultyBreakdown, effectiveDC: traceEffectiveDC,
    outcome: traceOutcome, consequences: traceConsequences,
    triggeredConditions: traceTriggeredConditions, deathResult: traceDeathResult,
    npcReacted, npcAttackHit, npcAttackDamage,
    stalkerClockBefore, stalkerClockAfter,
    stalkerEventType: stalkerEvent?.type ?? null,
    scenarioInteractionMatched: scenarioInteractionHandled,
    scenarioNarrativeOverride: scenarioNarrativeOverride,
  });

  return {
    newState: current,
    narrative,
    diceRoll,
    suggestions: [],
    trace,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface TraceInputs {
  readonly action: ReturnType<typeof parseAction> extends infer R ? Exclude<R, { readonly prompt: string }> : never;
  readonly creativityMod: number;
  readonly conditionHpDrain: number;
  readonly conditionsExpired: readonly string[];
  readonly atmosphere: string;
  readonly o2Before: number;
  readonly o2After: number;
  readonly oxygenHpDrain: number;
  readonly isAutoVerb: boolean;
  readonly statId: string | null;
  readonly statValue: number;
  readonly shipMemoryMod: number;
  readonly failsafeActivated: boolean;
  readonly failsafeDcReduction: number;
  readonly breakdown: DifficultyBreakdown | null;
  readonly effectiveDC: number;
  readonly outcome: string | null;
  readonly consequences: readonly Consequence[];
  readonly triggeredConditions: readonly string[];
  readonly deathResult: string | null;
  readonly npcReacted: boolean;
  readonly npcAttackHit: boolean;
  readonly npcAttackDamage: number;
  readonly stalkerClockBefore: number;
  readonly stalkerClockAfter: number;
  readonly stalkerEventType: string | null;
  readonly scenarioInteractionMatched?: boolean;
  readonly scenarioNarrativeOverride?: import('./scenario').LocaleString | null;
}

function buildFullTrace(t: TraceInputs): TurnDebugTrace {
  return {
    reformulated: false,
    reformulationPrompt: null,
    parsedVerb: t.action.verb,
    parsedTarget: t.action.target?.id ?? null,
    parsedTargetName: t.action.target?.nameKey ?? null,
    parseStrategy: t.action.verbMatch.strategy,
    parseCreative: t.action.creative,
    creativityMod: t.creativityMod,
    conditionHpDrain: t.conditionHpDrain,
    conditionsExpired: t.conditionsExpired,
    atmosphere: t.atmosphere,
    o2Before: t.o2Before,
    o2After: t.o2After,
    oxygenHpDrain: t.oxygenHpDrain,
    isAutoVerb: t.isAutoVerb,
    statId: (t.statId as import('./types').StatId | null),
    effectiveStatValue: t.statValue,
    shipMemoryMod: t.shipMemoryMod,
    failsafeActivated: t.failsafeActivated,
    failsafeDcReduction: t.failsafeDcReduction,
    difficultyBreakdown: t.breakdown,
    effectiveDC: t.effectiveDC,
    outcome: (t.outcome as import('./types').RollOutcome | null),
    consequenceTypes: t.consequences.map(c => c.type) as readonly ConsequenceType[],
    consequenceDetails: t.consequences.map(formatConsequenceDetail),
    triggeredConditions: t.triggeredConditions,
    deathResult: (t.deathResult as import('./types').DeathType | null),
    npcReacted: t.npcReacted,
    npcAttackHit: t.npcAttackHit,
    npcAttackDamage: t.npcAttackDamage,
    stalkerClockBefore: t.stalkerClockBefore,
    stalkerClockAfter: t.stalkerClockAfter,
    stalkerEventType: t.stalkerEventType,
    scenarioInteractionMatched: t.scenarioInteractionMatched,
    scenarioNarrativeOverride: t.scenarioNarrativeOverride,
  };
}

/**
 * Find an ItemDefinition for a given item ID anywhere in the assembled scenario graph.
 * Searches all node item lists. Used by step 4b for USE <item> ON <target>.
 */
function findItemDefInGraph(
  state: GameState,
  itemId: string,
): import('./scenario').ItemDefinition | null {
  if (!state.scenario) return null;
  for (const node of state.scenario.graph.nodes) {
    const found = node.items.find(i => i.id === itemId);
    if (found) return found;
  }
  return null;
}

function buildResult(
  state: GameState,
  diceRoll: DiceResult | null,
  input: string,
  verb: string,
  targetId: string | null,
  outcome: string,
  trace: TurnDebugTrace,
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
  return { newState, narrative: '', diceRoll, suggestions: [], trace };
}
