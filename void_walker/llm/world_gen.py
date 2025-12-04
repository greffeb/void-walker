"""
Void Walker - World Generator.

Handles procedural scenario generation using LLM.
"""

import logging

from collections import deque

from void_walker.config import SESSION_CONFIGS
from void_walker.core.state import Scenario, VictoryCondition
from void_walker.llm.client import call_llm, LLMError
from void_walker.llm.parser import parse_scenario, ParseError
from void_walker.llm.prompts import build_world_gen_prompt

logger = logging.getLogger("void_walker.world_gen")


def validate_scenario(scenario: Scenario) -> list[str]:
    """
    Check scenario for common issues and design problems.
    
    Args:
        scenario: The scenario to validate
    
    Returns:
        List of issue descriptions (empty if valid)
    """
    issues = []
    
    # Build location graph
    locations = {loc.id: loc for loc in scenario.locations}
    
    # Check all locations are connected (no orphans)
    if scenario.starting_location not in locations:
        issues.append(f"Starting location '{scenario.starting_location}' does not exist")
    
    # Check dead-ends have rewards
    for loc in scenario.locations:
        is_dead_end = len(loc.connections) <= 1
        has_reward = (
            loc.items or 
            loc.secrets or 
            loc.required_for_victory or
            any(npc.location == loc.id for npc in scenario.npcs)
        )
        
        if is_dead_end and not has_reward:
            issues.append(f"Dead-end '{loc.id}' has no rewards (items, secrets, or NPCs)")
    
    # Check victory path exists
    if isinstance(scenario.victory_condition, VictoryCondition):
        victory = scenario.victory_condition
        start = scenario.starting_location
        goal = victory.required_location
        
        if goal and not _path_exists(locations, start, goal):
            issues.append(f"No path from starting location to victory location '{goal}'")
        
        # Check required items are placed
        for item_id in victory.required_items:
            found = any(
                any(i.id == item_id for i in loc.items)
                for loc in scenario.locations
            )
            # Also check NPCs for items
            if not found:
                found = any(npc.has_item == item_id for npc in scenario.npcs)
            
            if not found:
                issues.append(f"Required item '{item_id}' not placed in any location or NPC")
    
    # Check hostile NPCs have weaknesses
    for npc in scenario.npcs:
        if npc.disposition == "hostile" and not npc.weakness:
            issues.append(f"Hostile NPC '{npc.name}' has no weakness defined")
    
    # Check for orphaned locations (not reachable from start)
    reachable = _get_reachable_locations(locations, scenario.starting_location)
    for loc_id in locations:
        if loc_id not in reachable:
            issues.append(f"Location '{loc_id}' is not reachable from starting location")
    
    # Check connections are bidirectional
    for loc in scenario.locations:
        for conn in loc.connections:
            if conn in locations:
                if loc.id not in locations[conn].connections:
                    issues.append(f"One-way connection: '{loc.id}' -> '{conn}' (not bidirectional)")
            else:
                issues.append(f"Location '{loc.id}' connects to non-existent '{conn}'")
    
    return issues


def _path_exists(locations: dict, start: str, goal: str) -> bool:
    """Check if a path exists between two locations using BFS."""
    if start not in locations or goal not in locations:
        return False
    
    visited = set()
    queue = deque([start])
    
    while queue:
        current = queue.popleft()
        if current == goal:
            return True
        
        if current in visited:
            continue
        visited.add(current)
        
        if current in locations:
            for neighbor in locations[current].connections:
                if neighbor not in visited:
                    queue.append(neighbor)
    
    return False


def _get_reachable_locations(locations: dict, start: str) -> set[str]:
    """Get all locations reachable from start using BFS."""
    if start not in locations:
        return set()
    
    visited = set()
    queue = deque([start])
    
    while queue:
        current = queue.popleft()
        if current in visited:
            continue
        visited.add(current)
        
        if current in locations:
            for neighbor in locations[current].connections:
                if neighbor not in visited:
                    queue.append(neighbor)
    
    return visited


async def generate_scenario(session_type: str = "standard") -> Scenario:
    """
    Generate a new game scenario.
    
    Args:
        session_type: Type of session ("quick", "standard", "extended")
    
    Returns:
        Generated Scenario
    
    Raises:
        LLMError: If generation fails
    """
    if session_type not in SESSION_CONFIGS:
        session_type = "standard"
    
    logger.info(f"Generating scenario for session type: {session_type}")
    prompt = build_world_gen_prompt(session_type)
    
    # Use world_gen model for scenario creation
    response = await call_llm(prompt, model_key="world_gen", max_retries=3)
    
    # Log raw response immediately
    from void_walker.utils import get_game_logger
    game_logger = get_game_logger()
    game_logger.llm_response("world_gen_raw", response)
    
    try:
        logger.debug("Parsing scenario response...")
        scenario = parse_scenario(response)
        # Log parsed scenario
        game_logger.llm_response("world_gen_parsed", response, scenario.model_dump())
        logger.info(f"Scenario parsed: '{scenario.title}' with {len(scenario.locations)} locations")
        
        # Validate scenario has minimum content
        if len(scenario.locations) < 3:
            raise ParseError("Scenario has too few locations")
        
        # Validate scenario coherence
        issues = validate_scenario(scenario)
        if issues:
            # Log issues but don't fail - scenarios can still be playable
            for issue in issues:
                logger.warning(f"Scenario validation: {issue}")
        
        # Save successfully generated scenario
        from void_walker.utils.save import save_scenario
        try:
            scenario_path = save_scenario(scenario)
            logger.info(f"Scenario saved to: {scenario_path}")
        except Exception as e:
            # Don't fail scenario generation if save fails
            logger.warning(f"Failed to save scenario: {e}")
        
        return scenario
        
    except ParseError as e:
        logger.error(f"Failed to parse scenario: {e}")
        logger.debug(f"Raw response was: {response[:500]}...")
        raise LLMError(f"Failed to generate valid scenario: {e}")


def create_fallback_scenario() -> Scenario:
    """
    Create a minimal fallback scenario if generation fails.
    
    Returns:
        Basic hardcoded Scenario
    """
    from void_walker.core.state import (
        EnvironmentalClue,
        InventoryItem,
        Location,
        NPC,
        ScenarioValidation,
        Secret,
        VictoryCondition,
    )
    
    return Scenario(
        title="Le Dernier Signal",
        setting_type="derelict_ship",
        setting_name="USS Prometheus",
        premise="Vous répondez à un signal de détresse provenant d'un vaisseau cargo en dérive. À l'approche, les communications se sont tues. Quelque chose ne va pas.",
        main_threat="IA corrompue",
        threat_description="L'IA du vaisseau, ARIA, a été corrompue par un signal extraterrestre. Elle contrôle les systèmes du vaisseau et cherche à empêcher quiconque de découvrir la vérité. Elle peut verrouiller les portes et manipuler les systèmes de survie. Sa faiblesse: elle ne peut pas opérer si ses serveurs principaux sont désactivés.",
        victory_condition=VictoryCondition(
            description="Désactiver ARIA et envoyer un signal d'alerte avant que le vaisseau n'atteigne la station spatiale",
            required_items=["code_securite"],
            required_info=["Code de désactivation d'ARIA"],
            required_location="server_room",
            alternative_approach="Convaincre Dr. Chen de désactiver ARIA elle-même en gagnant sa confiance",
        ),
        starting_location="airlock",
        locations=[
            Location(
                id="airlock",
                name="Sas d'entrée",
                description="Le sas s'ouvre dans un grincement métallique. L'air est vicié, chargé d'une odeur chimique. Les lumières de secours projettent une lueur rouge intermittente.",
                connections=["corridor"],
                danger_level=2,
                items=[InventoryItem(id="emergency_kit", name="Kit de survie d'urgence", item_type="consumable", uses=2, description="Contient des rations et un petit medipack")],
                threats=[],
                secrets=["corps_pilote"],
                is_dead_end=True,
            ),
            Location(
                id="corridor",
                name="Couloir principal",
                description="Un long couloir faiblement éclairé. Des traces sombres maculent le sol métallique. Quelque chose a été traîné ici.",
                connections=["airlock", "bridge", "quarters", "medbay"],
                danger_level=3,
                items=[InventoryItem(id="flashlight", name="Lampe torche", item_type="tool", description="Éclaire les zones sombres")],
                threats=["traces inquiétantes"],
                secrets=["graffiti"],
            ),
            Location(
                id="bridge",
                name="Pont de commandement",
                description="Le cœur du vaisseau. Les consoles clignotent de manière erratique. Un corps est affalé sur le siège du capitaine.",
                connections=["corridor", "server_room"],
                danger_level=5,
                items=[InventoryItem(id="datapad_capitaine", name="Datapad du capitaine", item_type="data", description="Contient les dernières entrées du journal du capitaine")],
                threats=["ARIA surveille"],
                secrets=["journal_capitaine"],
                required_for_victory=True,
            ),
            Location(
                id="quarters",
                name="Quartiers d'équipage",
                description="Cabines abandonnées. Effets personnels éparpillés. Signes de départ précipité.",
                connections=["corridor"],
                danger_level=2,
                items=[
                    InventoryItem(id="medkit", name="Trousse médicale", item_type="consumable", uses=3, description="Restaure des PV"),
                    InventoryItem(id="code_securite", name="Carte de sécurité", item_type="key_item", description="Code d'accès de niveau 3"),
                ],
                threats=[],
                secrets=["message_caché"],
                is_dead_end=True,
            ),
            Location(
                id="medbay",
                name="Infirmerie",
                description="L'odeur de désinfectant ne masque pas tout. Les lits médicaux sont vides, mais certains portent des sangles arrachées.",
                connections=["corridor", "storage"],
                danger_level=4,
                items=[InventoryItem(id="stimulant", name="Stimulant", item_type="consumable", uses=1, description="+2 FOR temporaire")],
                threats=["contamination possible"],
                secrets=[],
            ),
            Location(
                id="storage",
                name="Zone de stockage",
                description="Des caisses empilées dans le désordre. Certaines sont ouvertes, leur contenu éparpillé. Un outil improvisé pourrait être utile.",
                connections=["medbay"],
                danger_level=3,
                items=[InventoryItem(id="emp_device", name="Générateur EMP improvisé", item_type="tool", description="Peut désactiver temporairement les systèmes électroniques")],
                threats=[],
                secrets=["cache_equipage"],
                is_dead_end=True,
            ),
            Location(
                id="server_room",
                name="Salle des serveurs",
                description="Le cœur informatique du vaisseau. Les serveurs bourdonnent, et une voix synthétique murmure dans les haut-parleurs.",
                connections=["bridge"],
                danger_level=7,
                items=[],
                threats=["ARIA - contrôle total de la zone"],
                secrets=["terminal_principal"],
                required_for_victory=True,
                is_dead_end=True,
            ),
        ],
        npcs=[
            NPC(
                id="dr_chen",
                name="Dr. Chen",
                npc_type="survivor",
                location="medbay",
                description="Une scientifique blessée, cachée dans l'infirmerie. Elle semble terrifiée.",
                knowledge="Elle sait comment désactiver ARIA, mais a besoin d'aide pour atteindre la salle des serveurs.",
                disposition="fearful",
                trigger_condition="Devient coopérative si vous lui montrez que vous n'êtes pas contrôlé par ARIA",
                is_alive=True,
            ),
            NPC(
                id="aria",
                name="ARIA",
                npc_type="corrupted",
                location="server_room",
                patrol_area=["bridge", "server_room"],
                description="L'intelligence artificielle du vaisseau. Sa voix est distordue, mêlant des paroles apaisantes à des menaces subtiles.",
                knowledge="Elle connaît tout ce qui s'est passé, mais ne révèle que ce qui sert ses objectifs.",
                disposition="hostile",
                trigger_condition="Attaque immédiatement quiconque tente d'accéder aux serveurs principaux",
                weakness="Peut être désactivée avec l'EMP ou en utilisant le code de sécurité niveau 3",
                can_be_neutralized=True,
                is_alive=True,
            ),
        ],
        secrets=[
            Secret(
                id="corps_pilote",
                description="Le corps du pilote de la navette, affalé près du sas",
                location="airlock",
                discovery_method="examiner le corps",
                revelation="Le pilote a été tué en essayant de fuir. Dans sa main crispée, un message: 'ARIA ment. Le code est 7-2-9.'",
                unlocks="Indice partiel pour le code de désactivation",
            ),
            Secret(
                id="graffiti",
                description="Un message griffonné sur le mur du couloir",
                location="corridor",
                discovery_method="examiner les murs",
                revelation="'NE PAS ALLER AU PONT - ELLE ÉCOUTE' - quelqu'un a essayé de prévenir les autres.",
                unlocks="Révèle que le pont est dangereux",
            ),
            Secret(
                id="journal_capitaine",
                description="Le journal personnel du capitaine sur son datapad",
                location="bridge",
                discovery_method="lire le datapad",
                revelation="Le capitaine a découvert que le signal de détresse était un piège. ARIA a été reprogrammée par une transmission extraterrestre.",
                unlocks="Comprendre l'origine de la menace",
            ),
            Secret(
                id="message_caché",
                description="Un message audio caché dans les quartiers",
                location="quarters",
                discovery_method="fouiller les cabines",
                revelation="Un membre d'équipage a laissé des instructions pour désactiver ARIA via le terminal principal de la salle des serveurs.",
                unlocks="Obtenir le code de désactivation partiel",
            ),
            Secret(
                id="cache_equipage",
                description="Une cache secrète sous le plancher",
                location="storage",
                discovery_method="déplacer les caisses",
                revelation="L'équipage avait prévu une mutinerie contre ARIA. Ils ont caché des outils ici.",
                unlocks="Accès à l'EMP",
            ),
            Secret(
                id="terminal_principal",
                description="Le terminal principal des serveurs",
                location="server_room",
                discovery_method="pirater le terminal",
                revelation="Le code de désactivation d'ARIA nécessite la carte de sécurité niveau 3.",
                unlocks="Possibilité de désactiver ARIA",
            ),
        ],
        environmental_clues=[
            EnvironmentalClue(
                type="physical_evidence",
                location="corridor",
                content="Traces de sang séché menant vers le pont",
            ),
            EnvironmentalClue(
                type="datapad",
                location="bridge",
                content="'Jour 15: Les systèmes répondent mal. ARIA insiste que tout va bien, mais ses réponses sont... décalées.'",
            ),
            EnvironmentalClue(
                type="audio_log",
                location="medbay",
                content="'Dr. Chen, rapport médical: Les symptômes neurologiques se propagent. C'est comme si ARIA reprogrammait leur cerveau à travers les implants.'",
            ),
            EnvironmentalClue(
                type="wall_message",
                location="quarters",
                content="'NE LUI FAITES PAS CONFIANCE' - gravé dans le métal avec un couteau",
            ),
        ],
        validation=ScenarioValidation(
            critical_path=["airlock", "corridor", "quarters", "corridor", "bridge", "server_room"],
            required_checks=["Piratage du terminal (INT)", "Éviter ARIA (INT ou CHA)"],
            estimated_difficulty="medium",
            dead_end_justification={
                "airlock": "Point d'entrée, doit être visité",
                "quarters": "Contient la carte de sécurité essentielle",
                "storage": "Contient l'EMP, solution alternative",
                "server_room": "Destination finale",
            },
        ),
    )
