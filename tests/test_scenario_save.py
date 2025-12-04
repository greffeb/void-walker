"""Tests for scenario saving functionality."""

import json
from pathlib import Path

import pytest

from void_walker.config import SCENARIOS_DIR
from void_walker.llm.world_gen import create_fallback_scenario
from void_walker.utils.save import save_scenario


def test_save_scenario():
    """Test that scenarios are saved correctly."""
    # Create a test scenario
    scenario = create_fallback_scenario()
    
    # Save the scenario
    save_path = save_scenario(scenario)
    
    # Verify file was created
    assert save_path.exists()
    assert save_path.parent == SCENARIOS_DIR
    
    # Verify filename format
    assert scenario.title.replace(" ", "_") in save_path.stem
    assert save_path.suffix == ".json"
    
    # Verify content
    with open(save_path, encoding="utf-8") as f:
        saved_data = json.load(f)
    
    assert saved_data["title"] == scenario.title
    assert saved_data["_scenario_name"] == scenario.title
    assert "_saved_at" in saved_data
    
    # Cleanup
    save_path.unlink()


def test_save_scenario_sanitizes_filename():
    """Test that scenario titles with special characters are sanitized."""
    scenario = create_fallback_scenario()
    scenario.title = "Test: Scenario/With\\Special*Chars?"
    
    save_path = save_scenario(scenario)
    
    # Verify no special characters in filename (except underscore and hyphen)
    assert all(c.isalnum() or c in "._- " for c in save_path.stem)
    
    # Cleanup
    save_path.unlink()


def test_scenarios_directory_created():
    """Test that scenarios directory is created if it doesn't exist."""
    # This is implicitly tested by save_scenario
    # Just verify the directory exists after save
    scenario = create_fallback_scenario()
    save_path = save_scenario(scenario)
    
    assert SCENARIOS_DIR.exists()
    assert SCENARIOS_DIR.is_dir()
    
    # Cleanup
    save_path.unlink()
