/**
 * Void Walker PWA - Prompt Templates
 *
 * Contains all prompt templates for world generation and gameplay.
 * Ported from cli/void_walker/llm/prompts.py
 */

import type { GameState, SessionProgress, DiceResult, Scenario } from '../types/game';

// Session configurations
export const SESSION_CONFIGS = {
  quick: { scenes: 5, targetMinutes: 5, complexity: 'simple' },
  standard: { scenes: 15, targetMinutes: 30, complexity: 'medium' },
  extended: { scenes: 40, targetMinutes: 120, complexity: 'complex' },
} as const;

export type SessionType = keyof typeof SESSION_CONFIGS;

// =============================================================================
// WORLD GENERATION PROMPT
// =============================================================================

const WORLD_GEN_PROMPT = `You are generating a scenario for a space horror RPG called "Void Walker".

Create a unique, self-contained scenario with the following parameters:
- Session length: {sessionType} ({sceneCount} scenes)
- Complexity: {complexity}

SCENARIO DESIGN PRINCIPLES:
1. MAP COHERENCE
   - Every location must have at least ONE of: useful item, secret, required passage, or NPC
   - Dead-end locations MUST have high-value rewards (key items, major secrets) to justify the risk
   - The starting location should have 2-3 exits to give player choice
   - Create loops in the map when possible (multiple paths between areas)
   - ALL connections must be BIDIRECTIONAL: if A connects to B, then B must connect to A
   - Use is_hidden=true for SECRET rooms (ventilation shafts, hidden access hatches, rooms behind false walls)
   - Hidden rooms are invisible on the map until discovered via a linked secret (secret.unlocks = location_id)

2. VICTORY PATH
   - Victory must require 2-4 specific steps (find item X, get info from NPC Y, reach location Z)
   - All required elements must be reachable WITHOUT entering optional high-danger areas
   - Specify exactly what items/information/actions are needed to win
   - Provide TWO victory conditions: a primary path and an alternative approach

3. RISK/REWARD BALANCE
   - danger_level 1-3: Safe exploration, minor loot
   - danger_level 4-6: Moderate risk, useful items or secrets
   - danger_level 7-10: High risk, critical items or major revelations
   - The most dangerous areas should contain the best rewards

4. NPC DESIGN
   - Hostile NPCs must have: trigger_condition, patrol_area, can_be_neutralized (bool), weakness
   - Friendly NPCs must have: what they want in exchange for help
   - All NPCs should have information or items the player might need

5. ITEM PLACEMENT
   - Place items that directly help with the main threat
   - Include at least one "creative tool" (duct tape, chemicals, broken device) for emergent solutions
   - Key items should never be in the highest-danger areas

Generate a JSON response with this EXACT structure:
{
  "title": "Scenario title in French",
  "setting_type": "derelict_ship|space_station|planetary_colony|asteroid_mine|alien_ruins|research_lab|prison_transport|generation_ship",
  "setting_name": "Name of the location",
  "premise": "2-3 sentences setting up the situation, in French",
  "main_threat": "The primary antagonist/danger",
  "threat_description": "How the threat behaves, what triggers it, its weakness",
  "victory_condition": {
    "description": "What the player must do to win (primary path), in French",
    "required_items": ["item_id list - can be empty if no items needed"],
    "required_info": ["What knowledge/codes/passwords are needed"],
    "required_location": "location_id where victory is achieved"
  },
  "alternative_victory": {
    "description": "Alternative way to win (different approach), in French",
    "required_items": ["item_id list for alternative path"],
    "required_info": ["What knowledge is needed for alternative"],
    "required_location": "location_id where alternative victory is achieved (can be same or different)"
  },
  "starting_location": "location_id",
  "locations": [
    {
      "id": "unique_snake_case_id",
      "name": "Location name in French",
      "description": "Atmospheric description in French (2-3 sentences)",
      "connections": ["connected_location_ids"],
      "danger_level": 1-10,
      "items": [
        {
          "id": "item_id",
          "name": "Item name in French",
          "description": "What it does",
          "item_type": "weapon|tool|consumable|key_item|data",
          "stat_bonus": {"stat": modifier} or null
        }
      ],
      "threats": ["specific dangers here"],
      "secrets": ["secret_ids discoverable here"],
      "is_dead_end": false,
      "required_for_victory": false,
      "is_hidden": false
    }
  ],
  "npcs": [
    {
      "id": "npc_id",
      "name": "NPC name",
      "npc_type": "survivor|android|hostile|corrupted|creature",
      "location": "location_id",
      "patrol_area": ["location_ids they move between"] or null,
      "description": "Brief description in French",
      "knowledge": "What they know that helps the player",
      "has_item": "item_id or null",
      "disposition": "friendly|fearful|neutral|hostile|unpredictable",
      "trigger_condition": "What makes them attack/help/flee (for non-friendly)",
      "weakness": "How they can be defeated/avoided (for hostile)",
      "can_be_neutralized": true,
      "is_alive": true
    }
  ],
  "secrets": [
    {
      "id": "secret_id",
      "description": "What the secret is",
      "location": "location_id",
      "discovery_method": "How to find it (search, examine, hack, etc.)",
      "revelation": "What the player learns, in French",
      "unlocks": "What this enables (new area, NPC trust, item use, etc.)"
    }
  ],
  "environmental_clues": [
    {
      "type": "datapad|wall_message|audio_log|physical_evidence",
      "location": "location_id",
      "content": "The actual text/description in French"
    }
  ],
  "validation": {
    "critical_path": ["location_id sequence from start to victory"],
    "required_checks": ["What skill checks are mandatory"],
    "estimated_difficulty": "easy|medium|hard",
    "dead_end_justification": {"location_id": "why this dead-end is worth visiting"}
  }
}

VALIDATION BEFORE OUTPUT:
Before outputting, verify:
- Every dead-end has a reward worth the risk
- Victory is achievable without entering danger_level 8+ areas
- At least one path exists from start to victory location
- All required_items are placed in accessible locations
- Hostile NPCs have defined weaknesses
- The map has no orphaned locations (all connected to main graph)
- ALL connections are bidirectional (if A→B then B→A)

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON - no markdown, no code blocks, no explanation
- All player-facing text in French
- Include exactly 6-8 interconnected locations
- Include 2-3 NPCs with properly defined behaviors
- Include 3-4 discoverable secrets
- Atmosphere: tense, unsettling, mysterious

OUTPUT RAW JSON ONLY:`;

export function buildWorldGenPrompt(sessionType: SessionType = 'standard'): string {
  const config = SESSION_CONFIGS[sessionType];

  return WORLD_GEN_PROMPT
    .replace('{sessionType}', sessionType)
    .replace('{sceneCount}', String(config.scenes))
    .replace('{complexity}', config.complexity);
}

// =============================================================================
// PACING CONTEXT
// =============================================================================

const PACING_INSTRUCTIONS: Record<string, string> = {
  intro: `
PHASE: INTRODUCTION (scene {current}/{total})
DIRECTIVES:
- Establish the situation briefly and give the player their main objective
- Subtle hints about the threat, no direct confrontation yet
- Target tension: 3-4/10
- Keep narrative CONCISE and ACTION-FOCUSED
`,
  rising: `
PHASE: RISING ACTION (scene {current}/{total})
DIRECTIVES:
- Exploration and discoveries
- Clues about what happened (datapads, traces, messages)
- Minor obstacles, first signs of the threat
- Possible encounters with survivors/NPCs
- Target tension: 4-6/10, gradually increasing
- Keep narrative CONCISE and ACTION-FOCUSED
`,
  midpoint: `
PHASE: MIDPOINT (scene {current}/{total})
DIRECTIVES:
- Time for a MAJOR REVELATION or ESCALATION
- Player should understand the true nature of the threat
- Introduce a new objective or important complication
- Target tension: 6-7/10
- Keep narrative CONCISE and ACTION-FOCUSED
`,
  escalation: `
PHASE: ESCALATION (scene {current}/{total})
DIRECTIVES:
- Direct confrontations with the threat
- Limited resources, time pressure
- Choices have serious consequences
- Set up the climax
- Target tension: 7-8/10
- Keep narrative CONCISE and ACTION-FOCUSED
`,
  climax: `
PHASE: CLIMAX (scene {current}/{total})
DIRECTIVES:
- Final confrontation or ultimate challenge
- Player must use what they've learned/found
- High difficulties (DC 15+)
- Victory OR defeat possible based on actions
- Target tension: 9-10/10
`,
  resolution: `
PHASE: RESOLUTION (final scene)
DIRECTIVES:
- Narrate the epilogue based on player's actions
- Brief recap of the journey
- Field "is_ending" MUST be true
- Choose ending_type from: victory, defeat, escape, mystery_solved
`,
};

export function buildPacingContext(progress: SessionProgress, scenario: Scenario): string {
  const template = PACING_INSTRUCTIONS[progress.currentBeat] || PACING_INSTRUCTIONS.rising;

  let context = template
    .replace('{current}', String(progress.currentScene))
    .replace('{total}', String(progress.totalScenes));

  // Add objective tracking
  context += `
MAIN OBJECTIVE: ${scenario.victoryCondition}
OBJECTIVES COMPLETED: ${progress.objectivesCompleted.join(', ') || 'None'}
`;

  // Add proximity warnings for session end
  const scenesRemaining = progress.totalScenes - progress.currentScene;
  if (scenesRemaining <= 3 && progress.currentBeat !== 'resolution') {
    context += `
⚠️ SESSION END APPROACHING (${scenesRemaining} scenes remaining)
- Actively steer the story toward a conclusion
- Recommended next phase: ${scenesRemaining > 1 ? 'climax' : 'resolution'}
- Increase tension and stakes now
`;
  }

  return context;
}

// =============================================================================
// DICE CONTEXT
// =============================================================================

export function buildDiceContext(result: DiceResult | null): string {
  if (!result) return '';

  const outcomeMap: Record<string, string> = {
    'critical_success': 'CRITICAL SUCCESS (natural 20) - exceptional result',
    'success': 'SUCCESS - action succeeds',
    'failure': 'FAILURE - action fails with consequences',
    'critical_failure': 'CRITICAL FAILURE (natural 1) - catastrophe',
  };

  const outcome = result.critical
    ? (result.success ? 'critical_success' : 'critical_failure')
    : (result.success ? 'success' : 'failure');

  return `
DICE RESULT:
- Roll: ${result.roll} (die) + ${result.statValue} (${result.stat}) + ${result.modifier} (mod) = ${result.total}
- Difficulty: ${result.difficulty}
- Outcome: ${outcomeMap[outcome]}

IMPORTANT: You MUST narrate a ${outcome.replace('_', ' ')}. No partial success on a failure.
`;
}

// =============================================================================
// GAMEPLAY PROMPT
// =============================================================================

const GAMEPLAY_PROMPT_TEMPLATE = `You are the game master of a space horror RPG called "Void Walker".

{pacingContext}

CURRENT SITUATION:
- Location: {locationName} ({locationId})
- HP: {hp}/{maxHp}
- Active threats: {activeThreats}
- Available exits: {availableExits}

PLAYER ({playerName}, {playerClass}):
- FOR {forStat} | INT {intStat} | CHA {chaStat}
- Inventory: {inventory}

RECENT EVENTS:
{recentEvents}

SCENARIO:
- Main threat: {mainThreat}
- Visited locations: {visitedLocations}

{diceContext}

PLAYER ACTION: {playerInput}

RESPONSE RULES:
1. Reply ONLY with valid JSON (no text before/after)
2. Narrative in FRENCH, 1-2 sentences MAXIMUM, concise and action-focused (NOT atmospheric prose)
3. Follow the DIRECTIVES for the current phase
4. Fairly evaluate creative actions
5. If action requires a roll, set difficulty (1-20)
6. ABSOLUTELY respect dice results provided
7. CRITICAL: "is_ending" must be FALSE unless phase is "climax" or "resolution"
8. NEVER end the game for a simple exploration action

NARRATIVE STYLE:
- Be DIRECT and CONCISE. Describe what happens, not the atmosphere.
- BAD: "L'odeur âcre de désinfectant flotte dans l'air, masquant une autre senteur plus subtile..."
- GOOD: "Tu entres dans l'infirmerie. Des lits déserts s'alignent sous un éclairage vacillant."
- Focus on RESULTS of actions, not sensory descriptions

Expected JSON:
{
  "narrative": "string (1-2 sentences in FRENCH, concise)",
  "action_type": "exploration|interaction|combat|skill_check|dialogue",
  "requires_roll": boolean,
  "difficulty": null or 1-20,
  "relevant_stat": null or "FOR"|"INT"|"CHA",
  "suggested_modifier": -5 to +5,
  "state_changes": {
    "hp_change": 0,
    "items_added": [],
    "items_removed": [],
    "location_change": null or "location_id",
    "secrets_discovered": [],
    "objective_completed": null or "string",
    "enemy_defeated": false,
    "creative_solution": false
  },
  "scene_elements": ["visible/interactive elements - include ALL interactive objects and exits"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "tension_level": 1-10,
  "is_ending": false,
  "ending_type": null
}

IMPORTANT: Keep "is_ending": false for this scene. The story continues!`;

export function buildGameplayPrompt(
  state: GameState,
  playerInput: string,
  diceResult: DiceResult | null = null
): string {
  // Get current location info
  const currentLocation = state.scenario?.locations[state.currentLocation];
  const locationName = currentLocation?.name || state.currentLocation;

  // Build recent events string
  const recentEventsStr = state.recentEvents.slice(0, 5)
    .map(e => `- ${e}`)
    .join('\n') || '- Début de session';

  // Build inventory string
  const inventoryStr = state.player.inventory
    .map(item => item.name)
    .join(', ') || 'Vide';

  // Build available exits
  const exits = currentLocation?.connections || [];
  const availableExitsStr = exits.map(exitId => {
    const exitLoc = state.scenario?.locations[exitId];
    return exitLoc?.name || exitId;
  }).join(', ') || 'Aucune';

  // Build active threats
  const activeThreats = currentLocation?.dangers?.join(', ') || 'Aucune';

  return GAMEPLAY_PROMPT_TEMPLATE
    .replace('{pacingContext}', buildPacingContext(state.progress, state.scenario))
    .replace('{locationName}', locationName)
    .replace('{locationId}', state.currentLocation)
    .replace('{hp}', String(state.player.hp))
    .replace('{maxHp}', String(state.player.maxHp))
    .replace('{activeThreats}', activeThreats)
    .replace('{availableExits}', availableExitsStr)
    .replace('{playerName}', state.player.name)
    .replace('{playerClass}', state.player.className)
    .replace('{forStat}', String(state.player.stats.FOR))
    .replace('{intStat}', String(state.player.stats.INT))
    .replace('{chaStat}', String(state.player.stats.CHA))
    .replace('{inventory}', inventoryStr)
    .replace('{recentEvents}', recentEventsStr)
    .replace('{mainThreat}', state.scenario?.victoryCondition || 'Unknown')
    .replace('{visitedLocations}', state.visitedLocations.join(', ') || 'Aucun')
    .replace('{diceContext}', buildDiceContext(diceResult))
    .replace('{playerInput}', playerInput);
}

// =============================================================================
// ACTION ASSESSMENT PROMPT
// =============================================================================

const ACTION_ASSESSMENT_PROMPT = `Tu évalues une action dans un RPG d'horreur spatiale.

CONTEXTE:
- Lieu: {location}
- PV: {hp}/{maxHp}
- Stats: FOR {forStat} | INT {intStat} | CHA {chaStat}
- Inventaire: {inventory}

ACTION: {action}

Évalue si cette action nécessite un jet de dé et quelle serait la difficulté.

Réponds en JSON:
{
  "requires_roll": boolean,
  "difficulty": null ou 1-20,
  "relevant_stat": null ou "FOR"|"INT"|"CHA",
  "suggested_modifier": -5 à +5,
  "reasoning": "Brève explication"
}

RÈGLES:
- Actions simples (regarder, marcher) = pas de jet
- Actions risquées ou avec opposition = jet requis
- Difficulté 5-10: facile, 11-15: moyen, 16-20: difficile
- Utilise les bonus d'inventaire pertinents comme modificateur`;

export function buildActionAssessmentPrompt(state: GameState, action: string): string {
  const inventoryStr = state.player.inventory
    .map(item => item.name)
    .join(', ') || 'Vide';

  const currentLocation = state.scenario?.locations[state.currentLocation];
  const locationName = currentLocation?.name || state.currentLocation;

  return ACTION_ASSESSMENT_PROMPT
    .replace('{location}', locationName)
    .replace('{hp}', String(state.player.hp))
    .replace('{maxHp}', String(state.player.maxHp))
    .replace('{forStat}', String(state.player.stats.FOR))
    .replace('{intStat}', String(state.player.stats.INT))
    .replace('{chaStat}', String(state.player.stats.CHA))
    .replace('{inventory}', inventoryStr)
    .replace('{action}', action);
}
