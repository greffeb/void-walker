"""
Void Walker - Prompt Templates.

Contains all prompt templates for world generation and gameplay.
"""

from void_walker.config import SESSION_CONFIGS
from void_walker.core.dice import CheckResult, DiceResult
from void_walker.core.state import GameState, Scenario, SessionProgress
from void_walker.core.guidance import GuidanceSystem


# =============================================================================
# WORLD GENERATION PROMPT
# =============================================================================

WORLD_GEN_PROMPT = """You are generating a scenario for a space horror RPG called "Void Walker".

Create a unique, self-contained scenario with the following parameters:
- Session length: {session_type} ({scene_count} scenes)
- Complexity: {complexity}

SCENARIO DESIGN PRINCIPLES:
1. MAP COHERENCE
   - Every location must have at least ONE of: useful item, secret, required passage, or NPC
   - Dead-end locations MUST have high-value rewards (key items, major secrets) to justify the risk
   - The starting location should have 2-3 exits to give player choice
   - Create loops in the map when possible (multiple paths between areas)

2. VICTORY PATH
   - Victory must require 2-4 specific steps (find item X, get info from NPC Y, reach location Z)
   - All required elements must be reachable WITHOUT entering optional high-danger areas
   - Specify exactly what items/information/actions are needed to win
   - Include at least one alternative approach (stealth vs combat, diplomacy vs force)

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
    "description": "What the player must do to win, in French",
    "required_items": ["item_id list - can be empty if no items needed"],
    "required_info": ["What knowledge/codes/passwords are needed"],
    "required_location": "location_id where victory is achieved",
    "alternative_approach": "A different valid way to win"
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
      "required_for_victory": false
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

CRITICAL REQUIREMENTS:
- Output ONLY valid JSON - no markdown, no code blocks, no explanation
- All player-facing text in French
- Include exactly 6-8 interconnected locations
- Include 2-3 NPCs with properly defined behaviors
- Include 3-4 discoverable secrets
- Atmosphere: tense, unsettling, mysterious

OUTPUT RAW JSON ONLY:"""


def build_world_gen_prompt(session_type: str = "standard") -> str:
    """Build the world generation prompt for a specific session type."""
    config = SESSION_CONFIGS.get(session_type, SESSION_CONFIGS["standard"])
    
    return WORLD_GEN_PROMPT.format(
        session_type=session_type,
        scene_count=config["scenes"],
        complexity=config["complexity"],
    )


# =============================================================================
# PACING CONTEXT
# =============================================================================

PACING_INSTRUCTIONS = {
    "intro": """
PHASE: INTRODUCTION (scène {current}/{total})
DIRECTIVES:
- Établis l'atmosphère et la situation initiale
- Donne au joueur son objectif principal
- Indices subtils sur la menace, pas de confrontation directe
- Tension cible: 3-4/10
""",
    "rising": """
PHASE: MONTÉE DRAMATIQUE (scène {current}/{total})
DIRECTIVES:
- Exploration et découvertes
- Indices sur ce qui s'est passé (datapads, traces, messages)
- Obstacles mineurs, premiers signes de la menace
- Rencontres avec survivants/PNJ possibles
- Tension cible: 4-6/10, augmente progressivement
""",
    "midpoint": """
PHASE: POINT MÉDIAN (scène {current}/{total})
DIRECTIVES:
- C'est le moment d'une RÉVÉLATION MAJEURE ou ESCALADE
- Le joueur doit comprendre la vraie nature de la menace
- Introduis un nouvel objectif ou une complication importante
- Tension cible: 6-7/10
""",
    "escalation": """
PHASE: ESCALADE (scène {current}/{total})
DIRECTIVES:
- Confrontations directes avec la menace
- Ressources limitées, pression temporelle
- Les choix ont des conséquences lourdes
- Prépare le terrain pour le climax
- Tension cible: 7-8/10
""",
    "climax": """
PHASE: CLIMAX (scène {current}/{total})
DIRECTIVES:
- Confrontation finale ou défi ultime
- Le joueur doit utiliser ce qu'il a appris/trouvé
- Difficultés élevées (DC 15+)
- Possibilité de victoire OU défaite selon les actions
- Tension cible: 9-10/10
""",
    "resolution": """
PHASE: RÉSOLUTION (scène finale)
DIRECTIVES:
- Narre l'épilogue basé sur le résultat des actions du joueur
- Récapitule brièvement le parcours
- Le champ "is_ending" DOIT être true
- Choisis ending_type parmi: victory, defeat, escape, mystery_solved
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
OBJECTIF PRINCIPAL: {victory_desc}
OBJECTIFS COMPLÉTÉS: {', '.join(progress.objectives_completed) or 'Aucun'}
SECRETS DÉCOUVERTS: {progress.secrets_found}/{len(scenario.secrets)}
"""
    
    # Add proximity warnings for session end
    scenes_remaining = progress.scenes_remaining
    if scenes_remaining <= 3 and progress.story_beat != "resolution":
        context += f"""
⚠️ FIN DE SESSION PROCHE ({scenes_remaining} scènes restantes)
- Dirige activement l'histoire vers une conclusion
- Prochaine phase recommandée: {"climax" if scenes_remaining > 1 else "resolution"}
- Augmente la tension et les enjeux maintenant
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
        CheckResult.CRITICAL_SUCCESS: "SUCCÈS CRITIQUE (20 naturel) - résultat exceptionnel",
        CheckResult.SUCCESS: "SUCCÈS - l'action réussit",
        CheckResult.FAILURE: "ÉCHEC - l'action échoue avec conséquences",
        CheckResult.CRITICAL_FAILURE: "ÉCHEC CRITIQUE (1 naturel) - catastrophe",
    }
    
    return f"""
RÉSULTAT DU DÉ:
- Jet: {result.roll} (dé) + {result.stat_value} ({result.stat}) + {result.modifier} (mod) = {result.total}
- Difficulté: {result.difficulty}
- Résultat: {outcome_map[result.outcome]}

IMPORTANT: Tu DOIS narrer un {result.outcome.value}. Pas de demi-succès sur un échec.
"""


# =============================================================================
# GAMEPLAY PROMPT
# =============================================================================

GAMEPLAY_PROMPT_TEMPLATE = """Tu es le maître de jeu d'un RPG d'horreur spatiale "Void Walker".

{pacing_context}

SITUATION ACTUELLE:
- Lieu: {location_name} ({location_id})
- PV: {hp}/{max_hp}
- Menaces actives: {active_threats}
- Sorties disponibles: {available_exits}

JOUEUR ({player_name}, {player_class}):
- FOR {for_stat} | INT {int_stat} | CHA {cha_stat}
- Inventaire: {inventory}

ÉVÉNEMENTS RÉCENTS:
{recent_events}

SCÉNARIO:
- Menace principale: {main_threat}
- Lieux visités: {visited_locations}

{dice_context}
{guidance_context}

ACTION DU JOUEUR: {player_input}

RÈGLES DE RÉPONSE:
1. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après)
2. Narration en français, 2-4 phrases, atmosphère horrifique
3. Respecte les DIRECTIVES de la phase actuelle
4. Évalue équitablement les actions créatives
5. Si l'action nécessite un jet, définis difficulty (1-20)
6. Respecte ABSOLUMENT les résultats des dés fournis
7. CRITIQUE: "is_ending" doit être FALSE sauf si la phase est "climax" ou "resolution"
8. Ne JAMAIS terminer la partie pour une simple action d'exploration

JSON attendu:
{{
  "narrative": "string (2-4 phrases en français)",
  "action_type": "exploration|interaction|combat|skill_check|dialogue",
  "requires_roll": boolean,
  "difficulty": null ou 1-20,
  "relevant_stat": null ou "FOR"|"INT"|"CHA",
  "suggested_modifier": -5 à +5,
  "state_changes": {{
    "hp_change": 0,
    "items_added": [],
    "items_removed": [],
    "location_change": null ou "location_id",
    "secrets_discovered": [],
    "objective_completed": null ou "string",
    "enemy_defeated": false,
    "creative_solution": false
  }},
  "scene_elements": ["éléments visibles/interactifs"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "tension_level": 1-10,
  "is_ending": false,
  "ending_type": null
}}

IMPORTANT: Garde "is_ending": false pour cette scène. L'histoire continue!"""


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
    
    # Build guidance context for stuck players
    guidance = GuidanceSystem(state)
    guidance_context = guidance.build_hint_context()
    
    return GAMEPLAY_PROMPT_TEMPLATE.format(
        pacing_context=build_pacing_context(state.progress, state.scenario),
        location_name=location_name,
        location_id=state.current_location,
        hp=state.player.hp,
        max_hp=state.player.max_hp,
        active_threats=", ".join(state.active_threats) or "Aucune",
        available_exits=", ".join(state.available_exits) or "Aucune",
        player_name=state.player.name,
        player_class=state.player.class_name,
        for_stat=state.player.get_stat("FOR"),
        int_stat=state.player.get_stat("INT"),
        cha_stat=state.player.get_stat("CHA"),
        inventory=inventory_str,
        recent_events=recent_events_str,
        main_threat=state.scenario.main_threat,
        visited_locations=", ".join(state.visited_locations) or "Aucun",
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
