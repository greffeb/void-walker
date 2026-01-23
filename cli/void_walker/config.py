"""
Void Walker - Configuration module.

Contains settings, API configuration, model definitions, and rate limits.
"""

from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings


# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
SAVES_DIR = DATA_DIR / "saves"
LOGS_DIR = DATA_DIR / "logs"
SCENARIOS_DIR = DATA_DIR / "scenarios"


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    google_api_key: str = Field(default="", description="Google AI API key")
    debug: bool = Field(default=False, description="Enable debug mode")
    log_level: str = Field(default="INFO", description="Logging level")
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8"
    }


# Model configuration
MODELS: dict[str, str] = {
    "world_gen": "gemini-2.5-pro",        # Initial scenario generation
    "gameplay": "gemini-2.5-flash-lite",   # Turn-by-turn narration
    "fallback": "gemma-3-27b-it",          # If flash-lite quota exceeded
    "intent": "gemma-3-27b-it",            # Fast intent validation
    "dialogue": "gemma-3-27b-it",          # NPC dialogue generation
}

# Rate limits per model
RATE_LIMITS: dict[str, dict[str, int]] = {
    "gemini-2.5-pro": {"rpm": 2, "rpd": 50},
    "gemini-2.5-flash-lite": {"rpm": 15, "rpd": 1000},
    "gemma-3-27b-it": {"rpm": 30, "rpd": 14400},
}

# Session configurations
SESSION_CONFIGS: dict[str, dict] = {
    "quick": {"scenes": 5, "target_minutes": 5, "complexity": "simple"},
    "standard": {"scenes": 15, "target_minutes": 30, "complexity": "medium"},
    "extended": {"scenes": 40, "target_minutes": 120, "complexity": "complex"},
}

# Terminal requirements
TERMINAL_MIN_WIDTH = 120
TERMINAL_MIN_HEIGHT = 30
TERMINAL_RECOMMENDED_WIDTH = 160
TERMINAL_RECOMMENDED_HEIGHT = 40

# Color palette
COLORS: dict[str, str] = {
    # Base
    "text": "#888888",           # Muted gray for narration
    "text_bright": "#cccccc",    # Important text
    "background": "#000000",     # Pure black
    
    # Semantic
    "danger": "#ff4444",         # Threats, damage, warnings
    "success": "#44ff44",        # Positive outcomes
    "info": "#44ffff",           # Neutral information
    "highlight": "#ffff44",      # Player prompts, choices
    "item": "#ff8800",           # Items, loot
    
    # UI
    "border": "#333333",         # Subtle borders
    "dim": "#444444",            # Fog of war, unexplored
    "hp_bar": "#ff4444",
    "o2_bar": "#44ffff",
}

# Stat types
StatType = Literal["FOR", "INT", "CHA"]

# Action types
ActionType = Literal["exploration", "interaction", "combat", "skill_check", "dialogue"]

# Ending types
EndingType = Literal["victory", "defeat", "escape", "mystery_solved"]

# Story beats
StoryBeat = Literal["intro", "rising", "midpoint", "escalation", "climax", "resolution"]

# Setting types for world generation
SETTING_TYPES: list[str] = [
    "derelict_ship",      # Abandoned vessel drifting in space
    "space_station",      # Orbital station with multiple modules
    "planetary_colony",   # Surface base on hostile world
    "asteroid_mine",      # Mining facility in asteroid belt
    "alien_ruins",        # Ancient extraterrestrial structure
    "research_lab",       # Deep space research installation
    "prison_transport",   # Damaged prisoner ship
    "generation_ship",    # Massive colony vessel
]

# Threat types
THREAT_TYPES: list[str] = [
    "corrupted_ai",       # Ship AI gone hostile
    "alien_organism",     # Unknown life form
    "infected_crew",      # Biological contamination
    "rogue_robots",       # Security systems malfunction
    "cosmic_horror",      # Reality-bending phenomenon
    "saboteur",           # Human antagonist
    "environmental",      # Ship systems failing
]


def get_settings() -> Settings:
    """Get application settings singleton."""
    return Settings()
