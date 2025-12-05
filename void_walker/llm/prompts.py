"""
Void Walker - Prompt Templates.

Contains all prompt templates for world generation and gameplay.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from void_walker.config import SESSION_CONFIGS
from void_walker.core.dice import CheckResult, DiceResult
from void_walker.core.state import GameState, NPC, Scenario, SessionProgress
from void_walker.core.guidance import GuidanceSystem

if TYPE_CHECKING:
    from void_walker.llm.option_generator import GenerationOptions


# =============================================================================
# WORLD GENERATION PROMPT
# =============================================================================

WORLD_GEN_PROMPT = """You are generating a scenario for a space horror RPG called "Void Walker".

Create a unique, self-contained scenario with the following parameters:
- Session length: {session_type} ({scene_count} scenes)
- Complexity: {complexity}
{generation_constraints}
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
{{
  "title": "Scenario title in French",
  "setting_type": "derelict_ship|space_station|planetary_colony|asteroid_mine|alien_ruins|research_lab|prison_transport|generation_ship",
  "setting_name": "Name of the location",
  "premise": "2-3 sentences setting up the situation, in French",
  "main_threat": "The primary antagonist/danger",
  "threat_description": "How the threat behaves, what triggers it, its weakness",
  "victory_condition": {{
    "description": "What the player must do to win (primary path), in French",
    "required_items": ["item_id list - can be empty if no items needed"],
    "required_info": ["What knowledge/codes/passwords are needed"],
    "required_location": "location_id where victory is achieved"
  }},
  "alternative_victory": {{
    "description": "Alternative way to win (different approach), in French",
    "required_items": ["item_id list for alternative path"],
    "required_info": ["What knowledge is needed for alternative"],
    "required_location": "location_id where alternative victory is achieved (can be same or different)"
  }},
  "starting_location": "location_id",
  "locations": [
    {{
      "id": "unique_snake_case_id",
      "name": "Location name in French",
      "description": "Atmospheric description in French (2-3 sentences)",
      "connections": ["connected_location_ids"],
      "danger_level": 1-10,
      "items": [
        {{
          "id": "item_id",
          "name": "Item name in French",
          "description": "What it does",
          "item_type": "weapon|tool|consumable|key_item|data",
          "stat_bonus": {{"stat": modifier}} or null
        }}
      ],
      "threats": ["specific dangers here"],
      "secrets": ["secret_ids discoverable here"],
      "is_dead_end": false,
      "required_for_victory": false,
      "is_hidden": false
    }}
  ],
  "npcs": [
    {{
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
    }}
  ],
  "secrets": [
    {{
      "id": "secret_id",
      "description": "What the secret is",
      "location": "location_id",
      "discovery_method": "How to find it (search, examine, hack, etc.)",
      "revelation": "What the player learns, in French",
      "unlocks": "What this enables (new area, NPC trust, item use, etc.)"
    }}
  ],
  "environmental_clues": [
    {{
      "type": "datapad|wall_message|audio_log|physical_evidence",
      "location": "location_id",
      "content": "The actual text/description in French"
    }}
  ],
  "validation": {{
    "critical_path": ["location_id sequence from start to victory"],
    "required_checks": ["What skill checks are mandatory"],
    "estimated_difficulty": "easy|medium|hard",
    "dead_end_justification": {{"location_id": "why this dead-end is worth visiting"}}
  }}
}}

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

OUTPUT RAW JSON ONLY:"""


def build_world_gen_prompt(
    session_type: str = "standard",
    options: GenerationOptions | None = None,
) -> str:
    """
    Build the world generation prompt for a specific session type.
    
    Args:
        session_type: Type of session (quick/standard/extended)
        options: Optional generation options to constrain the scenario
    
    Returns:
        Complete world generation prompt
    """
    config = SESSION_CONFIGS.get(session_type, SESSION_CONFIGS["standard"])
    
    # Build constraints section if options provided
    if options is not None:
        from void_walker.llm.option_generator import format_options_for_prompt
        generation_constraints = format_options_for_prompt(options)
    else:
        generation_constraints = ""
    
    return WORLD_GEN_PROMPT.format(
        session_type=session_type,
        scene_count=config["scenes"],
        complexity=config["complexity"],
        generation_constraints=generation_constraints,
    )


# =============================================================================
# SCENARIO CORRECTION PROMPT
# =============================================================================

SCENARIO_CORRECTION_PROMPT = """You are correcting a scenario for a space horror RPG called "Void Walker".

The following scenario was generated but has validation issues that need to be fixed.
Make MINIMAL changes to fix ONLY the issues listed below.

CURRENT SCENARIO:
{scenario_json}

ISSUES TO FIX:
{issues_list}

CORRECTION INSTRUCTIONS:
{correction_instructions}

RULES:
1. Keep all existing content that is not related to the issues
2. Make the smallest possible changes to fix each issue
3. Maintain all French text and atmosphere
4. Ensure connections are BIDIRECTIONAL after fixes
5. Output the COMPLETE corrected scenario as valid JSON

OUTPUT ONLY THE CORRECTED JSON - no explanations, no markdown:"""


def build_correction_prompt(
    scenario_json: str,
    issues: list,
) -> str:
    """
    Build a prompt to ask the LLM to correct specific scenario issues.
    
    Args:
        scenario_json: The current scenario as JSON string
        issues: List of ValidationIssue objects to fix
    
    Returns:
        Complete correction prompt
    """
    from void_walker.llm.validators import IssueCategory
    
    # Format issues as a numbered list
    issues_list = "\n".join(
        f"{i+1}. [{issue.category.value}] {issue.message}"
        for i, issue in enumerate(issues)
    )
    
    # Build specific correction instructions based on issue categories
    instructions = []
    categories_seen = set()
    
    for issue in issues:
        if issue.category in categories_seen:
            continue
        categories_seen.add(issue.category)
        
        if issue.category == IssueCategory.ONE_WAY_CONNECTION:
            instructions.append(
                "- For one-way connections: Add the missing reverse connection. "
                "If location A has B in its connections, ensure B has A in its connections."
            )
        elif issue.category == IssueCategory.ORPHANED_LOCATION:
            instructions.append(
                "- For orphaned locations: Add connections to link them to the main map. "
                "Connect them to the nearest logical location."
            )
        elif issue.category == IssueCategory.MISSING_ITEM:
            instructions.append(
                "- For missing items: Place the required item in an accessible location "
                "(danger_level <= 7) or give it to an NPC."
            )
        elif issue.category == IssueCategory.MISSING_CONNECTION:
            instructions.append(
                "- For missing connections: Either add the missing location or remove "
                "the reference to it from existing connections."
            )
        elif issue.category == IssueCategory.MISSING_WEAKNESS:
            instructions.append(
                "- For hostile NPCs without weakness: Add a 'weakness' field describing "
                "how the NPC can be defeated or avoided."
            )
    
    correction_instructions = "\n".join(instructions) if instructions else "Fix the issues listed above."
    
    return SCENARIO_CORRECTION_PROMPT.format(
        scenario_json=scenario_json,
        issues_list=issues_list,
        correction_instructions=correction_instructions,
    )


# =============================================================================
# PACING CONTEXT
# =============================================================================

PACING_INSTRUCTIONS = {
    "intro": """
PHASE: INTRODUCTION (scene {current}/{total})
DIRECTIVES:
- Establish the situation briefly and give the player their main objective
- Subtle hints about the threat, no direct confrontation yet
- Target tension: 3-4/10
- Keep narrative CONCISE and ACTION-FOCUSED
""",
    "rising": """
PHASE: RISING ACTION (scene {current}/{total})
DIRECTIVES:
- Exploration and discoveries
- Clues about what happened (datapads, traces, messages)
- Minor obstacles, first signs of the threat
- Possible encounters with survivors/NPCs
- Target tension: 4-6/10, gradually increasing
- Keep narrative CONCISE and ACTION-FOCUSED
""",
    "midpoint": """
PHASE: MIDPOINT (scene {current}/{total})
DIRECTIVES:
- Time for a MAJOR REVELATION or ESCALATION
- Player should understand the true nature of the threat
- Introduce a new objective or important complication
- Target tension: 6-7/10
- Keep narrative CONCISE and ACTION-FOCUSED
""",
    "escalation": """
PHASE: ESCALATION (scene {current}/{total})
DIRECTIVES:
- Direct confrontations with the threat
- Limited resources, time pressure
- Choices have serious consequences
- Set up the climax
- Target tension: 7-8/10
- Keep narrative CONCISE and ACTION-FOCUSED
""",
    "climax": """
PHASE: CLIMAX (scene {current}/{total})
DIRECTIVES:
- Final confrontation or ultimate challenge
- Player must use what they've learned/found
- High difficulties (DC 15+)
- Victory OR defeat possible based on actions
- Target tension: 9-10/10
""",
    "resolution": """
PHASE: RESOLUTION (final scene)
DIRECTIVES:
- Narrate the epilogue based on player's actions
- Brief recap of the journey
- Field "is_ending" MUST be true
- Choose ending_type from: victory, defeat, escape, mystery_solved
""",
}


def build_pacing_context(progress: SessionProgress, scenario: Scenario) -> str:
    """
    Build pacing context for the LLM.
    
    Tells the LLM where we are in the story and what to do about it.
    """
    template = PACING_INSTRUCTIONS.get(progress.story_beat, PACING_INSTRUCTIONS["rising"])
    
    context = template.format(
        current=progress.current_scene,
        total=progress.total_scenes
    )
    
    # Add objective tracking (handle both string and structured victory conditions)
    victory_desc = scenario.get_victory_description()
    context += f"""
MAIN OBJECTIVE: {victory_desc}
OBJECTIVES COMPLETED: {', '.join(progress.objectives_completed) or 'None'}
SECRETS DISCOVERED: {progress.secrets_found}/{len(scenario.secrets)}
"""
    
    # Add proximity warnings for session end
    scenes_remaining = progress.scenes_remaining
    if scenes_remaining <= 3 and progress.story_beat != "resolution":
        context += f"""
⚠️ SESSION END APPROACHING ({scenes_remaining} scenes remaining)
- Actively steer the story toward a conclusion
- Recommended next phase: {"climax" if scenes_remaining > 1 else "resolution"}
- Increase tension and stakes now
"""
    
    return context


# =============================================================================
# DICE CONTEXT
# =============================================================================

def build_dice_context(result: DiceResult | None) -> str:
    """Build context string describing dice roll results."""
    if result is None:
        return ""
    
    outcome_map = {
        CheckResult.CRITICAL_SUCCESS: "CRITICAL SUCCESS (natural 20) - exceptional result",
        CheckResult.SUCCESS: "SUCCESS - action succeeds",
        CheckResult.FAILURE: "FAILURE - action fails with consequences",
        CheckResult.CRITICAL_FAILURE: "CRITICAL FAILURE (natural 1) - catastrophe",
    }
    
    return f"""
DICE RESULT:
- Roll: {result.roll} (die) + {result.stat_value} ({result.stat}) + {result.modifier} (mod) = {result.total}
- Difficulty: {result.difficulty}
- Outcome: {outcome_map[result.outcome]}

IMPORTANT: You MUST narrate a {result.outcome.value}. No partial success on a failure.
"""


# =============================================================================
# GAMEPLAY PROMPT
# =============================================================================

GAMEPLAY_PROMPT_TEMPLATE = """You are the game master of a space horror RPG called "Void Walker".

{pacing_context}

CURRENT SITUATION:
- Location: {location_name} ({location_id})
- HP: {hp}/{max_hp}
- Active threats: {active_threats}
- Available exits: {available_exits}

PLAYER ({player_name}, {player_class}):
- FOR {for_stat} | INT {int_stat} | CHA {cha_stat}
- Inventory: {inventory}

RECENT EVENTS:
{recent_events}

SCENARIO:
- Main threat: {main_threat}
- Visited locations: {visited_locations}

{items_context}

{dice_context}
{guidance_context}

PLAYER ACTION: {player_input}

RESPONSE RULES:
1. Reply ONLY with valid JSON (no text before/after)
2. Narrative in FRENCH, 1-2 sentences MAXIMUM, concise and action-focused (NOT atmospheric prose)
3. Follow the DIRECTIVES for the current phase
4. Fairly evaluate creative actions
5. If action requires a roll, set difficulty (1-20)
6. ABSOLUTELY respect dice results provided
7. CRITICAL: "is_ending" must be FALSE unless phase is "climax" or "resolution"
8. NEVER end the game for a simple exploration action
9. IMPORTANT FOR NARRATIVE: Mark found items with syntax [ITEM:technical_id]narrative description[/ITEM]

NARRATIVE STYLE:
- Be DIRECT and CONCISE. Describe what happens, not the atmosphere.
- BAD: "L'odeur âcre de désinfectant flotte dans l'air, masquant une autre senteur plus subtile..."
- GOOD: "Tu entres dans l'infirmerie. Des lits déserts s'alignent sous un éclairage vacillant."
- Focus on RESULTS of actions, not sensory descriptions

ITEM TAGGING:
If player finds items, integrate them naturally with tags:
- Example: "Tu découvres [ITEM:medkit]une trousse de secours[/ITEM] dans les débris."
- Technical IDs provided below MUST be used in tags
- Every item in "items_added" MUST be tagged

AVAILABLE ITEMS (if applicable):
{items_list}

Expected JSON:
{{
  "narrative": "string (1-2 sentences in FRENCH, concise, with item tags via [ITEM:id]...[/ITEM])",
  "action_type": "exploration|interaction|combat|skill_check|dialogue",
  "requires_roll": boolean,
  "difficulty": null or 1-20,
  "relevant_stat": null or "FOR"|"INT"|"CHA",
  "suggested_modifier": -5 to +5,
  "state_changes": {{
    "hp_change": 0,
    "items_added": [],
    "items_removed": [],
    "location_change": null or "location_id",
    "secrets_discovered": [],
    "objective_completed": null or "string",
    "enemy_defeated": false,
    "creative_solution": false
  }},
  "scene_elements": ["visible/interactive elements - include ALL interactive objects and exits"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "tension_level": 1-10,
  "is_ending": false,
  "ending_type": null
}}

IMPORTANT: Keep "is_ending": false for this scene. The story continues!"""


# =============================================================================
# LOCATION NAME GENERATION PROMPT
# =============================================================================

LOCATION_NAME_PROMPT = """Convert this technical location ID into a proper French location name for a space horror game.

Location ID: {location_id}

Rules:
- Output ONLY the French name, nothing else
- Make it sound natural in French (e.g., "Salle de reproduction alien" not "Alien Breeding Room")
- Keep it concise (2-5 words maximum)
- Match the space horror atmosphere

Examples:
- "conduit_maintenance_interior" -> "Conduit de maintenance"
- "alien_breeding_chamber" -> "Chambre d'incubation alien"
- "cargo_bay_alpha" -> "Baie de chargement Alpha"
- "hidden_laboratory" -> "Laboratoire secret"
- "crew_quarters_deck_2" -> "Quartiers de l'équipage - Pont 2"
- "vent_shaft_access" -> "Accès aux conduits de ventilation"
- "reactor_overflow_tank" -> "Cuve de décharge du réacteur"

Output the French name only:"""


def build_location_name_prompt(location_id: str) -> str:
    """Build prompt to generate a French name for a location ID."""
    return LOCATION_NAME_PROMPT.format(location_id=location_id)


# =============================================================================
# ENVIRONMENT DESCRIPTION PROMPT
# =============================================================================

ENVIRONMENT_PROMPT = """You generate a brief environment description for a space horror RPG.

CURRENT LOCATION: {location_name}
AVAILABLE EXITS (with names):
{exits_list}

INTERACTIVE ELEMENTS IN SCENE:
{scene_elements}

NPCS PRESENT:
{npcs_present}

Generate a SHORT prose paragraph in FRENCH (2-3 sentences max) that:
1. Mentions ALL available exits by their readable names (not IDs)
2. Lists key interactive objects/elements the player can examine or use
3. Notes any NPCs present

STYLE:
- Write as prose, not a list
- Be direct and informative, not atmospheric
- Help the player understand their options
- Example: "Devant toi, le couloir mène vers l'infirmerie et la salle des serveurs. Tu remarques un terminal actif contre le mur et une trappe de ventilation entrouverte."

Reply with ONLY the French prose paragraph, no JSON, no formatting."""


def build_environment_prompt(
    location_name: str,
    exits_with_names: list[tuple[str, str]],
    scene_elements: list[str],
    npcs_present: list[str],
) -> str:
    """
    Build prompt for environment description generation.
    
    Args:
        location_name: Current location name
        exits_with_names: List of (exit_id, exit_name) tuples
        scene_elements: List of interactive elements from last LLM response
        npcs_present: List of NPC names in current location
    
    Returns:
        Complete prompt string
    """
    # Format exits - only show readable names, not IDs
    if exits_with_names:
        exits_list = "\n".join(f"- {name}" for exit_id, name in exits_with_names)
    else:
        exits_list = "- Aucune sortie visible"
    
    # Format scene elements
    if scene_elements:
        elements_str = "\n".join(f"- {elem}" for elem in scene_elements)
    else:
        elements_str = "- Rien de notable"
    
    # Format NPCs
    if npcs_present:
        npcs_str = "\n".join(f"- {npc}" for npc in npcs_present)
    else:
        npcs_str = "- Personne"
    
    return ENVIRONMENT_PROMPT.format(
        location_name=location_name,
        exits_list=exits_list,
        scene_elements=elements_str,
        npcs_present=npcs_str,
    )


def get_exits_with_names(state: GameState) -> list[tuple[str, str]]:
    """
    Get available exits with their human-readable names.
    
    Args:
        state: Current game state
    
    Returns:
        List of (exit_id, exit_name) tuples
    """
    exits_with_names = []
    for exit_id in state.available_exits:
        exit_loc = state.scenario.get_location(exit_id)
        exit_name = exit_loc.name if exit_loc else exit_id
        exits_with_names.append((exit_id, exit_name))
    return exits_with_names


def build_gameplay_prompt(
    state: GameState,
    player_input: str,
    dice_result: DiceResult | None = None,
) -> str:
    """
    Build the complete prompt for a gameplay turn.
    
    Args:
        state: Current game state
        player_input: What the player wants to do
        dice_result: Optional dice roll result to include
    
    Returns:
        Complete prompt string for the LLM
    """
    # Get current location info
    location = state.scenario.get_location(state.current_location)
    location_name = location.name if location else state.current_location
    
    # Build recent events string
    recent_events_str = "\n".join(f"- {e}" for e in state.recent_events[-5:]) or "- Début de session"
    
    # Build inventory string
    inventory_str = ", ".join(item.name for item in state.player.inventory.items) or "Vide"
    
    # Build items context - list all items available in current location and nearby areas
    # Include ID, name, and description to help LLM return proper item data
    items_in_location = []
    if location and location.items:
        items_in_location = [
            f"  - ID: {item.id} | Nom: {item.name} | {item.description or 'Pas de description'}"
            for item in location.items
        ]
    items_context = ""
    if items_in_location:
        items_context = f"Items disponibles à cet endroit:\n" + "\n".join(items_in_location)
    else:
        items_context = ""
    
    # Build items list for the prompt
    items_list = ""
    if items_in_location:
        items_list = "Possible à trouver ici:\n" + "\n".join(items_in_location)
    else:
        items_list = "Aucun item spécifique défini pour cet endroit"
    
    # Build guidance context for stuck players
    guidance = GuidanceSystem(state)
    guidance_context = guidance.build_hint_context()
    
    # Build readable exit names
    exits_with_names = get_exits_with_names(state)
    available_exits_str = ", ".join(f"{name} ({eid})" for eid, name in exits_with_names) or "Aucune"
    
    return GAMEPLAY_PROMPT_TEMPLATE.format(
        pacing_context=build_pacing_context(state.progress, state.scenario),
        location_name=location_name,
        location_id=state.current_location,
        hp=state.player.hp,
        max_hp=state.player.max_hp,
        active_threats=", ".join(state.active_threats) or "Aucune",
        available_exits=available_exits_str,
        player_name=state.player.name,
        player_class=state.player.class_name,
        for_stat=state.player.get_stat("FOR"),
        int_stat=state.player.get_stat("INT"),
        cha_stat=state.player.get_stat("CHA"),
        inventory=inventory_str,
        recent_events=recent_events_str,
        main_threat=state.scenario.main_threat,
        visited_locations=", ".join(state.visited_locations) or "Aucun",
        items_context=items_context,
        items_list=items_list,
        dice_context=build_dice_context(dice_result),
        guidance_context=guidance_context,
        player_input=player_input,
    )


# =============================================================================
# ACTION ASSESSMENT PROMPT (for when we need to check if action requires roll)
# =============================================================================

ACTION_ASSESSMENT_PROMPT = """Tu évalues une action dans un RPG d'horreur spatiale.

CONTEXTE:
- Lieu: {location}
- PV: {hp}/{max_hp}
- Stats: FOR {for_stat} | INT {int_stat} | CHA {cha_stat}
- Inventaire: {inventory}

ACTION: {action}

Évalue si cette action nécessite un jet de dé et quelle serait la difficulté.

Réponds en JSON:
{{
  "requires_roll": boolean,
  "difficulty": null ou 1-20,
  "relevant_stat": null ou "FOR"|"INT"|"CHA",
  "suggested_modifier": -5 à +5,
  "reasoning": "Brève explication"
}}

RÈGLES:
- Actions simples (regarder, marcher) = pas de jet
- Actions risquées ou avec opposition = jet requis
- Difficulté 5-10: facile, 11-15: moyen, 16-20: difficile
- Utilise les bonus d'inventaire pertinents comme modificateur"""


def build_action_assessment_prompt(state: GameState, action: str) -> str:
    """Build prompt to assess if an action requires a roll."""
    inventory_str = ", ".join(item.name for item in state.player.inventory.items) or "Vide"
    
    location = state.scenario.get_location(state.current_location)
    location_name = location.name if location else state.current_location
    
    return ACTION_ASSESSMENT_PROMPT.format(
        location=location_name,
        hp=state.player.hp,
        max_hp=state.player.max_hp,
        for_stat=state.player.get_stat("FOR"),
        int_stat=state.player.get_stat("INT"),
        cha_stat=state.player.get_stat("CHA"),
        inventory=inventory_str,
        action=action,
    )


# =============================================================================
# NPC DIALOGUE PROMPT
# =============================================================================

NPC_DIALOGUE_PROMPT = """Tu génères un dialogue pour un PNJ dans un RPG d'horreur spatiale.

INFORMATIONS SUR LE PNJ:
- Nom: {npc_name}
- Type: {npc_type}
- Description: {npc_description}
- Disposition: {disposition}
- Ce qu'il/elle sait: {knowledge}
- Condition de déclenchement: {trigger_condition}

CONTEXTE DE LA SCÈNE:
- Lieu: {location_name}
- Action du joueur: {player_action}
- Nom du joueur: {player_name}
- Classe du joueur: {player_class}
- Menace principale du scénario: {main_threat}

{first_encounter_instruction}

STYLE:
- Écris en français, à la deuxième personne ("tu")
- Le dialogue doit refléter la disposition du PNJ ({disposition})
- Intègre subtilement les informations que le PNJ connaît si pertinent
- 3-5 paragraphes maximum
- Termine par une réplique du PNJ qui invite à l'interaction

Réponds UNIQUEMENT avec le texte narratif, pas de JSON, pas de formatage spécial."""

NPC_FIRST_ENCOUNTER_INSTRUCTION = """PREMIÈRE RENCONTRE:
C'est la première fois que le joueur rencontre ce PNJ. Tu dois:
1. Décrire son apparition de manière cinématique (d'où il/elle surgit, son apparence physique)
2. Montrer son attitude corporelle et son état émotionnel
3. Donner sa première réplique qui établit sa personnalité"""

NPC_CONTINUED_ENCOUNTER_INSTRUCTION = """RENCONTRE CONTINUE:
Le joueur a déjà rencontré ce PNJ. Continue le dialogue naturellement en répondant à l'action du joueur."""


def build_npc_dialogue_prompt(
    npc: NPC,
    player_action: str,
    state: GameState,
    is_first_encounter: bool,
) -> str:
    """
    Build prompt for NPC dialogue generation.
    
    Args:
        npc: The NPC to generate dialogue for
        player_action: What the player is doing/saying
        state: Current game state
        is_first_encounter: Whether this is the first time meeting this NPC
    
    Returns:
        Complete prompt string for the dialogue LLM
    """
    location = state.scenario.get_location(state.current_location)
    location_name = location.name if location else state.current_location
    
    # Choose instruction based on encounter type
    encounter_instruction = (
        NPC_FIRST_ENCOUNTER_INSTRUCTION if is_first_encounter 
        else NPC_CONTINUED_ENCOUNTER_INSTRUCTION
    )
    
    return NPC_DIALOGUE_PROMPT.format(
        npc_name=npc.name,
        npc_type=npc.npc_type,
        npc_description=npc.description or "Aucune description disponible",
        disposition=npc.disposition,
        knowledge=npc.knowledge or "Rien de particulier",
        trigger_condition=npc.trigger_condition or "Aucune",
        location_name=location_name,
        player_action=player_action,
        player_name=state.player.name,
        player_class=state.player.class_name,
        main_threat=state.scenario.main_threat,
        first_encounter_instruction=encounter_instruction,
    )

