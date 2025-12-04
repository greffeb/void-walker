"""
Void Walker - Save/Load utilities.

State persistence for game saves.
"""

import json
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel

from void_walker.config import SAVES_DIR
from void_walker.core.state import GameState


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
    
    # Convert set to list for JSON serialization
    state_dict["visited_locations"] = list(state.visited_locations)
    
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
        
        # Convert visited_locations back to set
        if "visited_locations" in data:
            data["visited_locations"] = set(data["visited_locations"])
        
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


def create_session_id() -> str:
    """Create a unique session ID."""
    import uuid
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    short_uuid = str(uuid.uuid4())[:8]
    return f"session_{timestamp}_{short_uuid}"
