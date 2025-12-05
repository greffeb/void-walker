"""
Void Walker - Save/Load utilities.

State persistence for game saves.
"""

import json
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel

from void_walker.config import SAVES_DIR, SCENARIOS_DIR
from void_walker.core.state import GameState, Scenario


class SaveMetadata(BaseModel):
    """Metadata for a save file."""
    
    session_id: str
    player_name: str
    player_class: str
    scenario_title: str
    turn_number: int
    saved_at: datetime
    hp: int
    max_hp: int


class ScenarioMetadata(BaseModel):
    """Metadata for a saved scenario file."""
    
    title: str
    setting_type: str
    estimated_difficulty: str  # "easy", "medium", "hard", or "Unknown"
    location_count: int
    saved_at: datetime
    file_path: Path


def get_save_path(session_id: str) -> Path:
    """Get the save file path for a session."""
    SAVES_DIR.mkdir(parents=True, exist_ok=True)
    return SAVES_DIR / f"{session_id}.json"


def save_state(state: GameState) -> Path:
    """
    Save game state to file.
    
    Args:
        state: Game state to save
    
    Returns:
        Path to saved file
    """
    save_path = get_save_path(state.session_id)
    
    # Convert state to dict, handling datetime and set
    state_dict = state.model_dump(mode="json")
    
    # Convert sets to lists for JSON serialization
    state_dict["visited_locations"] = list(state.visited_locations)
    state_dict["hallucinated_locations"] = list(state.hallucinated_locations)
    state_dict["npcs_encountered"] = list(state.npcs_encountered)
    
    # Add save timestamp
    state_dict["_saved_at"] = datetime.now().isoformat()
    
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(state_dict, f, indent=2, ensure_ascii=False, default=str)
    
    return save_path


def load_state(session_id: str) -> GameState | None:
    """
    Load game state from file.
    
    Args:
        session_id: Session ID to load
    
    Returns:
        Loaded GameState or None if not found
    """
    save_path = get_save_path(session_id)
    
    if not save_path.exists():
        return None
    
    try:
        with open(save_path, encoding="utf-8") as f:
            data = json.load(f)
        
        # Remove metadata fields
        data.pop("_saved_at", None)
        
        # Convert lists back to sets for set fields
        if "visited_locations" in data:
            data["visited_locations"] = set(data["visited_locations"])
        if "hallucinated_locations" in data:
            data["hallucinated_locations"] = set(data["hallucinated_locations"])
        if "npcs_encountered" in data:
            data["npcs_encountered"] = set(data["npcs_encountered"])
        
        return GameState(**data)
        
    except (json.JSONDecodeError, ValueError) as e:
        # Log error and return None
        from void_walker.utils.logging import get_logger
        logger = get_logger()
        logger.error(f"Failed to load save {session_id}: {e}")
        return None


def delete_save(session_id: str) -> bool:
    """
    Delete a save file.
    
    Args:
        session_id: Session ID to delete
    
    Returns:
        True if deleted, False if not found
    """
    save_path = get_save_path(session_id)
    
    if save_path.exists():
        save_path.unlink()
        return True
    
    return False


def list_saves() -> list[SaveMetadata]:
    """
    List all available save files.
    
    Returns:
        List of save metadata
    """
    SAVES_DIR.mkdir(parents=True, exist_ok=True)
    
    saves = []
    
    for save_file in SAVES_DIR.glob("*.json"):
        try:
            with open(save_file, encoding="utf-8") as f:
                data = json.load(f)
            
            metadata = SaveMetadata(
                session_id=data.get("session_id", save_file.stem),
                player_name=data.get("player", {}).get("name", "Unknown"),
                player_class=data.get("player", {}).get("class_name", "Unknown"),
                scenario_title=data.get("scenario", {}).get("title", "Unknown"),
                turn_number=data.get("turn_number", 0),
                saved_at=datetime.fromisoformat(data.get("_saved_at", datetime.now().isoformat())),
                hp=data.get("player", {}).get("hp", 0),
                max_hp=data.get("player", {}).get("max_hp", 0),
            )
            saves.append(metadata)
            
        except (json.JSONDecodeError, ValueError):
            # Skip invalid save files
            continue
    
    # Sort by save date, newest first
    saves.sort(key=lambda s: s.saved_at, reverse=True)
    return saves


def save_scenario(scenario: Scenario) -> Path:
    """
    Save a generated scenario to the scenarios directory.
    
    Args:
        scenario: The scenario to save
    
    Returns:
        Path to saved scenario file
    """
    SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create filename from scenario title and current date
    # Sanitize title for use in filename
    safe_title = "".join(
        c if c.isalnum() or c in " -_" else "_" 
        for c in scenario.title
    ).strip().replace(" ", "_")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_title}_{timestamp}.json"
    
    save_path = SCENARIOS_DIR / filename
    
    # Convert scenario to dict for JSON serialization
    scenario_dict = scenario.model_dump(mode="json")
    
    # Add metadata
    scenario_dict["_saved_at"] = datetime.now().isoformat()
    scenario_dict["_scenario_name"] = scenario.title
    
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(scenario_dict, f, indent=2, ensure_ascii=False, default=str)
    
    return save_path


def create_session_id() -> str:
    """Create a unique session ID."""
    import uuid
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_uuid = str(uuid.uuid4())[:8]
    return f"session_{timestamp}_{short_uuid}"


def load_scenario(scenario_path: Path) -> Scenario:
    """
    Load a scenario from a JSON file.
    
    Args:
        scenario_path: Path to the scenario JSON file
    
    Returns:
        Loaded Scenario object
    
    Raises:
        FileNotFoundError: If scenario file doesn't exist
        ValueError: If scenario file is invalid
    """
    if not scenario_path.exists():
        raise FileNotFoundError(f"Scenario file not found: {scenario_path}")
    
    try:
        with open(scenario_path, encoding="utf-8") as f:
            data = json.load(f)
        
        # Remove metadata fields that are not part of Scenario model
        data.pop("_saved_at", None)
        data.pop("_scenario_name", None)
        
        return Scenario(**data)
        
    except (json.JSONDecodeError, ValueError) as e:
        raise ValueError(f"Failed to load scenario from {scenario_path}: {e}")


def list_saved_scenarios(limit: int | None = None) -> list[ScenarioMetadata]:
    """
    List all saved scenario files with metadata.
    
    Args:
        limit: Maximum number of scenarios to return (None = all)
    
    Returns:
        List of scenario metadata, sorted by save date (newest first)
    """
    SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)
    
    scenarios = []
    
    for scenario_file in SCENARIOS_DIR.glob("*.json"):
        try:
            with open(scenario_file, encoding="utf-8") as f:
                data = json.load(f)
            
            # Extract metadata without full deserialization
            title = data.get("title", "Unknown Scenario")
            setting_type = data.get("setting_type", "unknown")
            location_count = len(data.get("locations", []))
            
            # Get difficulty from validation field if present
            validation = data.get("validation", {})
            estimated_difficulty = validation.get("estimated_difficulty", "Unknown")
            
            # Parse saved_at timestamp
            saved_at_str = data.get("_saved_at")
            if saved_at_str:
                saved_at = datetime.fromisoformat(saved_at_str)
            else:
                # Fallback to file modification time
                saved_at = datetime.fromtimestamp(scenario_file.stat().st_mtime)
            
            metadata = ScenarioMetadata(
                title=title,
                setting_type=setting_type,
                estimated_difficulty=estimated_difficulty,
                location_count=location_count,
                saved_at=saved_at,
                file_path=scenario_file,
            )
            scenarios.append(metadata)
            
        except (json.JSONDecodeError, ValueError, KeyError):
            # Skip invalid scenario files
            continue
    
    # Sort by save date, newest first
    scenarios.sort(key=lambda s: s.saved_at, reverse=True)
    
    # Apply limit if specified
    if limit is not None:
        scenarios = scenarios[:limit]
    
    return scenarios
