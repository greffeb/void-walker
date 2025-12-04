"""
Void Walker - Response Parser.

Handles parsing and validation of LLM responses.
"""

from typing import Any

from pydantic import ValidationError

from void_walker.core.state import (
    EnvironmentalClue,
    GameResponse,
    InventoryItem,
    Location,
    NPC,
    Scenario,
    ScenarioValidation,
    Secret,
    SessionProgress,
    StateChanges,
    VictoryCondition,
)
from void_walker.llm.client import ParseError, extract_json


def parse_game_response(response_text: str) -> GameResponse:
    """
    Parse LLM response into GameResponse.
    
    Args:
        response_text: Raw text from LLM
    
    Returns:
        Validated GameResponse
    
    Raises:
        ParseError: If parsing or validation fails
    """
    # Extract JSON from response
    data = extract_json(response_text)
    if data is None:
        raise ParseError(f"Could not extract JSON from response: {response_text[:200]}")
    
    # Parse state_changes separately if present
    if "state_changes" in data and isinstance(data["state_changes"], dict):
        state_changes_data = data["state_changes"]
        
        # Parse items_added if present
        if "items_added" in state_changes_data:
            items = []
            for item_data in state_changes_data["items_added"]:
                if isinstance(item_data, str):
                    items.append(InventoryItem(name=item_data))
                elif isinstance(item_data, dict):
                    items.append(InventoryItem(**item_data))
            state_changes_data["items_added"] = items
        
        data["state_changes"] = StateChanges(**state_changes_data)
    
    # Validate and create GameResponse
    try:
        return GameResponse(**data)
    except ValidationError as e:
        raise ParseError(f"Invalid game response: {e}")


def validate_game_response(
    response: GameResponse,
    progress: SessionProgress,
) -> GameResponse:
    """
    Validate and potentially fix a game response.
    
    Ensures the LLM respects session structure.
    
    Args:
        response: The parsed game response
        progress: Current session progress
    
    Returns:
        Validated (and possibly modified) response
    """
    # CRITICAL: Prevent premature endings aggressively
    # Only allow endings in climax (last 15%) or resolution phase
    min_scenes_for_ending = max(3, int(progress.total_scenes * 0.85))
    
    if response.is_ending:
        if progress.current_scene < min_scenes_for_ending:
            # Too early for any ending
            response.is_ending = False
            response.ending_type = None
        elif progress.story_beat not in ("climax", "resolution"):
            # Wrong story beat for ending
            response.is_ending = False
            response.ending_type = None
    
    # Also check for sneaky "defeat" type endings
    if response.ending_type == "defeat" and progress.current_scene < 2:
        # Never allow defeat on first two scenes
        response.is_ending = False
        response.ending_type = None
    
    # Force ending on final scene
    if progress.current_scene >= progress.total_scenes:
        if not response.is_ending:
            response.is_ending = True
            response.ending_type = response.ending_type or "escape"
            response.narrative += "\n\n[Votre temps est écoulé...]"
    
    # Clamp tension to reasonable range for beat
    tension_ranges = {
        "intro": (2, 5),
        "rising": (4, 7),
        "midpoint": (5, 8),
        "escalation": (6, 9),
        "climax": (8, 10),
        "resolution": (3, 7),
    }
    min_t, max_t = tension_ranges.get(progress.story_beat, (1, 10))
    response.tension_level = max(min_t, min(max_t, response.tension_level))
    
    # Ensure suggestions list has reasonable content
    if not response.suggestions:
        response.suggestions = [
            "Explorer les environs",
            "Examiner l'environnement",
            "Avancer prudemment",
        ]
    
    # Limit suggestions to 3
    response.suggestions = response.suggestions[:3]
    
    return response


def parse_scenario(response_text: str) -> Scenario:
    """
    Parse world generation response into Scenario.
    
    Args:
        response_text: Raw text from LLM
    
    Returns:
        Validated Scenario
    
    Raises:
        ParseError: If parsing or validation fails
    """
    data = extract_json(response_text)
    if data is None:
        raise ParseError(f"Could not extract JSON from response: {response_text[:300]}")
    
    # Parse locations
    locations = []
    for loc_data in data.get("locations", []):
        # Parse items in location
        items = []
        for item_data in loc_data.get("items", []):
            if isinstance(item_data, str):
                items.append(InventoryItem(name=item_data))
            elif isinstance(item_data, dict):
                # Handle stat_bonus being null
                if item_data.get("stat_bonus") is None:
                    item_data["stat_bonus"] = {}
                # Handle null description
                if item_data.get("description") is None:
                    item_data["description"] = ""
                items.append(InventoryItem(**item_data))
        loc_data["items"] = items
        
        # Handle null values for string fields
        if loc_data.get("description") is None:
            loc_data["description"] = ""
        
        # Auto-detect dead-ends
        if "is_dead_end" not in loc_data:
            loc_data["is_dead_end"] = len(loc_data.get("connections", [])) <= 1
        
        locations.append(Location(**loc_data))
    
    # Parse NPCs - allow LLM creative freedom for disposition/type
    npcs = []
    for npc_data in data.get("npcs", []):
        # Auto-generate ID if not provided
        if "id" not in npc_data or npc_data.get("id") is None:
            npc_data["id"] = npc_data.get("name", "unknown").lower().replace(" ", "_")
        # Handle null values for string fields that should default to empty string
        if npc_data.get("knowledge") is None:
            npc_data["knowledge"] = ""
        if npc_data.get("description") is None:
            npc_data["description"] = ""
        npcs.append(NPC(**npc_data))
    
    # Parse secrets
    secrets = []
    for secret_data in data.get("secrets", []):
        # Handle null values for string fields
        if secret_data.get("description") is None:
            secret_data["description"] = ""
        if secret_data.get("revelation") is None:
            secret_data["revelation"] = ""
        secrets.append(Secret(**secret_data))
    
    # Parse victory condition (support both string and structured)
    victory_data = data.get("victory_condition", "Survivre et s'échapper")
    if isinstance(victory_data, dict):
        victory_condition = VictoryCondition(**victory_data)
    else:
        victory_condition = victory_data
    
    # Parse environmental clues (support both string list and structured)
    env_clues = []
    for clue_data in data.get("environmental_clues", []):
        if isinstance(clue_data, str):
            env_clues.append(clue_data)
        elif isinstance(clue_data, dict):
            env_clues.append(EnvironmentalClue(**clue_data))
    
    # Parse validation data if present
    validation = None
    if "validation" in data and isinstance(data["validation"], dict):
        validation = ScenarioValidation(**data["validation"])
    
    # Build scenario
    try:
        return Scenario(
            title=data.get("title", "Sans titre"),
            setting_type=data.get("setting_type", "derelict_ship"),
            setting_name=data.get("setting_name", "Unknown"),
            premise=data.get("premise", ""),
            main_threat=data.get("main_threat", "Unknown threat"),
            threat_description=data.get("threat_description", ""),
            victory_condition=victory_condition,
            starting_location=data.get("starting_location", locations[0].id if locations else "start"),
            locations=locations,
            npcs=npcs,
            secrets=secrets,
            environmental_clues=env_clues,
            validation=validation,
        )
    except (ValidationError, IndexError) as e:
        raise ParseError(f"Invalid scenario data: {e}")


def parse_action_assessment(response_text: str) -> dict[str, Any]:
    """
    Parse action assessment response.
    
    Args:
        response_text: Raw text from LLM
    
    Returns:
        Dictionary with assessment info
    
    Raises:
        ParseError: If parsing fails
    """
    data = extract_json(response_text)
    if data is None:
        # Default to requiring a roll if we can't parse
        return {
            "requires_roll": True,
            "difficulty": 12,
            "relevant_stat": "INT",
            "suggested_modifier": 0,
            "reasoning": "Évaluation par défaut",
        }
    
    return {
        "requires_roll": data.get("requires_roll", True),
        "difficulty": data.get("difficulty", 12),
        "relevant_stat": data.get("relevant_stat", "INT"),
        "suggested_modifier": data.get("suggested_modifier", 0),
        "reasoning": data.get("reasoning", ""),
    }


def summarize_narrative(narrative: str, max_length: int = 100) -> str:
    """
    Create a short summary of a narrative for event history.
    
    Args:
        narrative: Full narrative text
        max_length: Maximum length of summary
    
    Returns:
        Shortened summary
    """
    # Take first sentence or truncate
    sentences = narrative.split(".")
    if sentences:
        summary = sentences[0].strip()
        if len(summary) > max_length:
            summary = summary[:max_length-3] + "..."
        return summary
    
    return narrative[:max_length-3] + "..." if len(narrative) > max_length else narrative
