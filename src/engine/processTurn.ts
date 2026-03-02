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
  ActiveCombatState, CombatNPCState,
} from './types';
import { defaultRng, classifyOutcome } from './dice';
import { rollCheck } from './dice';
import { parseAction } from './parser';
import { detectCreativity, calculateDifficulty } from './difficulty';
import { isReformulation } from './types';
import { tickConditions, checkConditionTriggers, addCondition, removeCondition, applyConditionMalus } from './conditions';
import { tickOxygen } from './oxygen';
import { tickStalkerClock, checkStalkerClock, applyStalkerEvent } from './stalkerClock';
import type { VerbId } from './verbs';
import { VERB_STATS, AUTO_VERBS, MOVEMENT_VERBS } from './verbs';
import { buildConsequences, applyConsequences } from './consequences';
import { checkDeath, applyDeath, updateCharacterHp } from './state';
import { addItem } from './inventory';
import { createMark, addMark, getMarksForTarget, getMarkDCModifier } from './shipMemory';
import { recordAttempt, getObstacleKey, checkFailsafe } from './failsafe';
import { resolveNPCAttack, resolvePlayerAttack, attemptFlee, attemptRetreat } from './combat';
import { checkVictory, checkAdditionalDefeat } from './victory';
import { threatCheck, transitionBeat } from './threat';
import { createVisitState, markRevisit, markItemTaken, markItemDropped, markObstacleResolved } from './backtracking';
import { buildVictoryCheckContext } from './game';
import { resolveScenarioInteraction, resolveItemUseOn } from './interactionResolver';
import { setFeatureState, revealItem, unlockExit, setScenarioFlag, unsetScenarioFlag, hasScenarioFlag } from './featureState';
import { isEnrichedItem } from './scenario';
import { removeItem } from './inventory';
import { NPC_DEFINITIONS } from '../content/npcs';

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
    // Count reformulation as an obstacle attempt so failsafe triggers even
    // when the player can't figure out the right command
    let reformState = { ...state, turn: state.turn + 1 };
    if (reformState.scenario !== null && reformState.playerLocationId !== null) {
      const node = reformState.scenario.graph.nodes.find(
        n => n.id === reformState.playerLocationId,
      );
      if (node?.obstacle && node.obstacle.targetId) {
        reformState = {
          ...reformState,
          obstacleAttempts: recordAttempt(
            reformState.obstacleAttempts,
            reformState.playerLocationId,
            node.obstacle.targetId,
            'EXAMINE', // generic verb for reformulation counting
          ),
        };
      }
    }
    return {
      newState: reformState,
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
  let traceDeathResult: string | null = null;
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
  // STEP 4a: Death check after condition + oxygen drain
  // ─────────────────────────────────────────────────────────
  // This catches deaths caused by passive HP loss (conditions, O2 depletion)
  // BEFORE the action is resolved, so dead players don't continue acting.
  if (current.character !== null) {
    const earlyDeathResult = checkDeath(
      current.character.hp,
      current.character.maxHp,
      current.difficulty,
      current.secondChanceUsed,
    );
    if (earlyDeathResult) {
      traceDeathResult = earlyDeathResult.type;
      current = applyDeath(current, earlyDeathResult);
      if (current.phase === 'defeat') {
        return buildResult(
          current, null, input, action.verb, action.target?.id ?? null, 'condition_drain',
          buildFullTrace({
            action, creativityMod, conditionHpDrain, conditionsExpired,
            atmosphere, o2Before, o2After, oxygenHpDrain, isAutoVerb: false,
            statId: null, statValue: 0,
            shipMemoryMod: 0,
            failsafeActivated: false, failsafeDcReduction: 0,
            breakdown: null, effectiveDC: 0,
            outcome: null, consequences: [],
            triggeredConditions: [], deathResult: traceDeathResult,
            npcReacted: false, npcAttackHit: false, npcAttackDamage: 0,
            stalkerClockBefore: current.stalkerClockState.actionsSinceLastProgression,
            stalkerClockAfter: current.stalkerClockState.actionsSinceLastProgression,
            stalkerEventType: null,
          }),
        );
      }
      // If second_chance/knockout: HP restored, continue to action resolution
    }
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
      // Note: check action.tool presence, not action.verb === 'USE', because
      // promoteVerb() may have already changed USE → HACK/SHOOT/CUT.
      // Having a tool means the player wrote "utiliser X sur Y" or "verb X avec Y".
      let interactionResult = { matched: false } as import('./interactionResolver').InteractionResolution;

      if (action.tool) {
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

      // Self-use path: "utiliser <item>" where target is an inventory item.
      // Try useOn with targetId 'self' to allow consumable self-heal etc.
      if (!interactionResult.matched && !action.tool
          && action.target?.source === 'inventory') {
        const selfItemDef = findItemDefInGraph(current, targetId);
        if (selfItemDef && isEnrichedItem(selfItemDef)) {
          interactionResult = resolveItemUseOn(
            targetId, selfItemDef, 'self', current, locationId, rng,
          );
        }
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

        // Mark obstacle resolved if the interaction requests it
        if (interactionResult.resolveObstacle && interactionResult.success
            && current.playerLocationId !== null) {
          const vsKey = current.playerLocationId;
          const existing = current.visitedLocations[vsKey];
          if (existing) {
            current = {
              ...current,
              visitedLocations: {
                ...current.visitedLocations,
                [vsKey]: markObstacleResolved(existing),
              },
            };
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
  let combatHandled = false;

  // ── COMBAT INTERCEPT: Route combat verbs to combat system when in active combat ──
  const COMBAT_ATTACK_VERBS: ReadonlySet<VerbId> = new Set([
    'STRIKE', 'SHOOT', 'KICK', 'CUT', 'THROW', 'BITE',
    'IMPROVISE_WEAPON', 'SABOTAGE', 'HACK', 'ELECTRIFY',
  ]);

  // Route combat verbs at visible NPCs into the combat system even before combat starts.
  // This allows THROW (and other attack verbs) to deal NPC damage via the existing path.
  if (
    !current.activeCombat
    && !scenarioInteractionHandled
    && current.character !== null
    && COMBAT_ATTACK_VERBS.has(action.verb)
    && action.target?.source === 'npc'
  ) {
    const combat = buildCombatFromNpc(action.target.id, current);
    if (combat) {
      current = { ...current, activeCombat: combat };
    }
  }

  if (current.activeCombat && current.character !== null && !scenarioInteractionHandled) {
    const combat = current.activeCombat;
    const npc = combat.npc;
    const effectiveStats = applyConditionMalus(current.character.stats, current.character.conditions);
    const armorValue = 0;
    const difficultyMultiplier = current.difficulty === 'explorer' ? 0.5
      : current.difficulty === 'nightmare' ? 1.5 : 1.0;

    if (COMBAT_ATTACK_VERBS.has(action.verb)) {
      // Player attacks the NPC
      combatHandled = true;
      const statId = VERB_STATS[action.verb] ?? 'FOR';
      const statValue = effectiveStats[statId] ?? 0;
      const lck = effectiveStats['LCK'] ?? 0;
      const dc = 10 + npc.defense; // Base DC 10 + NPC defense
      const roll = rollCheck(statId, statValue, lck, dc, 0, rng);
      diceRoll = roll;
      traceStatId = statId;
      traceStatValue = statValue;
      traceEffectiveDC = dc;
      traceOutcome = classifyOutcome(roll.natural, roll.total, dc);

      const attackResult = resolvePlayerAttack(
        effectiveStats, null, action.verb, npc,
        roll, current.character.className === 'marine' ? 'COMBAT_DAMAGE_BONUS' : '',
        current.character.className === 'marine' ? 1 : null, rng,
      );

      if (attackResult.hit) {
        const newNpcHp = Math.max(0, npc.hp - attackResult.damageDealt);
        if (attackResult.npcKilled || newNpcHp <= 0) {
          // NPC killed → end combat
          current = { ...current, activeCombat: null };
        } else {
          // Update NPC HP in combat state
          current = {
            ...current,
            activeCombat: {
              ...combat,
              npc: { ...npc, hp: newNpcHp },
            },
          };
        }
      }
    } else if (action.verb === 'RUN') {
      // Player attempts to flee combat
      combatHandled = true;
      const fleeResult = attemptFlee(effectiveStats, npc, armorValue, difficultyMultiplier, rng);
      diceRoll = fleeResult.roll;
      traceStatId = 'AGI';
      traceStatValue = effectiveStats['AGI'] ?? 0;
      traceOutcome = classifyOutcome(fleeResult.roll.natural, fleeResult.roll.total, npc.fleeDC);

      if (fleeResult.success) {
        current = { ...current, activeCombat: null };
        // Also move the player if they fled toward a connected location
        if (action.target?.source === 'connected_location') {
          const fleeLocationId = action.target.id;
          const existingFleeVisit = current.visitedLocations[fleeLocationId];
          const updatedFleeVisit = existingFleeVisit
            ? markRevisit(existingFleeVisit)
            : createVisitState(current.turn);
          current = {
            ...current,
            playerLocationId: fleeLocationId,
            visitedLocations: {
              ...current.visitedLocations,
              [fleeLocationId]: updatedFleeVisit,
            },
          };
        }
      } else if (fleeResult.npcFreeAttack?.hit) {
        current = updateCharacterHp(current, -fleeResult.npcFreeAttack.damageDealt);
      }
    } else if (action.verb === 'DODGE' || action.verb === 'BLOCK') {
      // Player retreats / takes defensive stance
      combatHandled = true;
      const retreatResult = attemptRetreat(effectiveStats, npc, rng);
      diceRoll = retreatResult.roll;
      traceStatId = 'AGI';
      traceStatValue = effectiveStats['AGI'] ?? 0;
      traceOutcome = classifyOutcome(retreatResult.roll.natural, retreatResult.roll.total, retreatResult.roll.difficulty);
    }
  }

  if (!isAutoVerb && !scenarioInteractionHandled && !combatHandled) {
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

    // THROW: remove thrown item from inventory and deposit as location loot.
    // The thrown item is the inventory target (no preposition) or the tool (with preposition).
    if (action.verb === 'THROW' && current.character && locationId) {
      const thrownId =
        action.target?.source === 'inventory' ? action.target.id
        : action.tool?.source === 'inventory' ? action.tool.id
        : null;

      if (thrownId && current.character.inventory.includes(thrownId)) {
        const { inventory } = removeItem(current.character.inventory, thrownId);
        current = { ...current, character: { ...current.character, inventory } };

        const vs = current.visitedLocations[locationId];
        const updated = vs
          ? markItemDropped(vs, thrownId)
          : markItemDropped(createVisitState(current.turn), thrownId);
        current = {
          ...current,
          visitedLocations: { ...current.visitedLocations, [locationId]: updated },
        };
      }
    }

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
    // WAIT cures exhaustion — remove the condition if present
    if (action.verb === 'WAIT' && current.character!.conditions.some(c => c.id === 'exhausted')) {
      current = {
        ...current,
        character: {
          ...current.character!,
          conditions: removeCondition(current.character!.conditions, 'exhausted'),
        },
      };
    }
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

  // Stalker event consequences: warning is atmospheric, kill deals HP damage
  let stalkerNarrative = '';
  if (stalkerEvent?.type === 'warning') {
    stalkerNarrative = 'Un bruit derrière vous. Quelque chose se rapproche.';
  } else if (stalkerEvent?.type === 'threat_arrival') {
    stalkerNarrative = 'Une présence hostile se manifeste dans l\'ombre. Le danger est imminent.';
    current = updateCharacterHp(current, -2);
  } else if (stalkerEvent?.type === 'kill') {
    stalkerNarrative = 'L\'ombre frappe sans prévenir. Une douleur fulgurante traverse votre corps.';
    current = updateCharacterHp(current, -5);
  }

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

  // 9a. Movement: if the action is a movement verb, update location and visit state
  if (MOVEMENT_VERBS.has(action.verb) && action.target?.source === 'connected_location') {
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

  // 9b-1. Time-based beat fallback: if stuck in same beat for too many turns,
  // advance the beat to prevent the game from stalling (Issue #18).
  const BEAT_STUCK_THRESHOLD = 15;
  if (current.scenario !== null && current.turn > 0) {
    const BEAT_ORDER: readonly import('./types').StoryBeat[] = [
      'intro', 'rising', 'midpoint', 'escalation', 'climax', 'resolution',
    ];
    const currentBeatIdx = BEAT_ORDER.indexOf(current.currentBeat);
    // Count turns since the beat last changed (approximate: use turn number / threshold)
    const turnsSinceStart = current.turn;
    const expectedBeat = Math.min(BEAT_ORDER.length - 1, Math.floor(turnsSinceStart / BEAT_STUCK_THRESHOLD));
    if (expectedBeat > currentBeatIdx && currentBeatIdx < BEAT_ORDER.length - 1) {
      const nextBeat = BEAT_ORDER[currentBeatIdx + 1]!;
      current = {
        ...current,
        currentBeat: nextBeat,
        threatDirectorState: transitionBeat(current.threatDirectorState, nextBeat),
      };
    }
  }

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
    // Threat event → combat initiation for encounter subtypes that trigger combat.
    // 'stalk' is atmospheric only (rounds = 0). 'ambush', 'hunt', 'pursue' start combat.
    if (
      event?.type === 'encounter' &&
      event.subtype !== 'stalk' &&
      current.activeCombat === null
    ) {
      const combat = buildCombatFromThreat(current, event.subtype);
      if (combat) {
        current = { ...current, activeCombat: combat };
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // STEP 10: Narrative composition (placeholder — Phase 5)
  // ─────────────────────────────────────────────────────────
  // If a scenario interaction provided a narrative override, use it; otherwise standard templates
  // Append stalker event narrative if present
  const baseNarrative = scenarioNarrativeOverride?.fr ?? '';
  const narrative = stalkerNarrative
    ? (baseNarrative ? `${baseNarrative} ${stalkerNarrative}` : stalkerNarrative)
    : baseNarrative;

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

/**
 * Build an ActiveCombatState from a threat encounter event.
 *
 * Strategy:
 * 1. Find the first hostile NPC placed anywhere in the scenario graph
 * 2. Look up NPC_DEFINITIONS for its combat stats
 * 3. If no hostile NPC found in scenario, fall back to 'xenomorph'
 * 4. Apply hpOverride from scenario NpcDefinition if present
 */
function buildCombatFromThreat(
  state: GameState,
  _subtype: import('./scenario').EncounterSubtype,
): ActiveCombatState | null {
  if (!state.scenario) return null;

  // Find a hostile NPC defined in the scenario graph
  let hostileNpcId: string | null = null;
  let hpOverride: number | undefined;
  for (const node of state.scenario.graph.nodes) {
    if (!node.npcs) continue;
    for (const npc of node.npcs) {
      if (npc.disposition === 'hostile') {
        hostileNpcId = npc.id;
        hpOverride = npc.hpOverride;
        break;
      }
    }
    if (hostileNpcId) break;
  }

  // Fall back to xenomorph if no hostile NPC in scenario
  const definitionId = hostileNpcId ?? 'xenomorph';
  const def = NPC_DEFINITIONS[definitionId] ?? NPC_DEFINITIONS['xenomorph'];
  if (!def) return null;

  const maxHp = hpOverride ?? def.hp;
  const npcState: CombatNPCState = {
    definitionId: def.id,
    hp: maxHp,
    maxHp,
    attack: def.attack ?? def.damage,
    defense: def.defense ?? 0,
    dodgeChance: def.dodgeChance,
    fleeDC: def.fleeDC ?? 12,
    aggressionPattern: def.aggressionPattern,
    weakPoint: def.weakPoint ? {
      id: def.weakPoint.id,
      nameKey: def.weakPoint.nameKey,
      discoverMethod: def.weakPoint.discoverMethod,
      targetVerbs: def.weakPoint.targetVerbs,
      targetProperties: def.weakPoint.targetProperties,
      damageMultiplier: def.weakPoint.damageMultiplier,
      hintKey: def.weakPoint.hintKey,
      exploitKey: def.weakPoint.exploitKey,
    } : null,
    weakPointDiscovered: false,
    combatRound: 0,
  };

  return {
    npc: npcState,
    npcInstanceId: definitionId,
    round: 1,
  };
}

/**
 * Build an ActiveCombatState from a specific NPC ID.
 * Used when a combat verb (e.g. THROW) targets an NPC outside of active combat.
 */
function buildCombatFromNpc(npcId: string, state: GameState): ActiveCombatState | null {
  const def = NPC_DEFINITIONS[npcId];
  if (!def) return null;

  let hpOverride: number | undefined;
  if (state.scenario) {
    for (const node of state.scenario.graph.nodes) {
      const npcDef = node.npcs?.find(n => n.id === npcId);
      if (npcDef?.hpOverride) {
        hpOverride = npcDef.hpOverride;
        break;
      }
    }
  }

  const maxHp = hpOverride ?? def.hp;
  const npcState: CombatNPCState = {
    definitionId: def.id,
    hp: maxHp,
    maxHp,
    attack: def.attack ?? def.damage,
    defense: def.defense ?? 0,
    dodgeChance: def.dodgeChance,
    fleeDC: def.fleeDC ?? 12,
    aggressionPattern: def.aggressionPattern,
    weakPoint: def.weakPoint ? {
      id: def.weakPoint.id,
      nameKey: def.weakPoint.nameKey,
      discoverMethod: def.weakPoint.discoverMethod,
      targetVerbs: def.weakPoint.targetVerbs,
      targetProperties: def.weakPoint.targetProperties,
      damageMultiplier: def.weakPoint.damageMultiplier,
      hintKey: def.weakPoint.hintKey,
      exploitKey: def.weakPoint.exploitKey,
    } : null,
    weakPointDiscovered: false,
    combatRound: 0,
  };

  return { npc: npcState, npcInstanceId: npcId, round: 1 };
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
