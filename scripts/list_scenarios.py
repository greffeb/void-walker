#!/usr/bin/env python
"""List all saved scenarios in the scenarios directory."""

import json
from datetime import datetime
from pathlib import Path

from void_walker.config import SCENARIOS_DIR


def list_scenarios():
    """List all saved scenarios with their metadata."""
    if not SCENARIOS_DIR.exists():
        print("No scenarios directory found.")
        return
    
    scenario_files = sorted(SCENARIOS_DIR.glob("*.json"))
    
    if not scenario_files:
        print(f"No scenarios found in {SCENARIOS_DIR}")
        return
    
    print(f"\n{'='*80}")
    print(f"  SAVED SCENARIOS ({len(scenario_files)} total)")
    print(f"{'='*80}\n")
    
    for i, scenario_file in enumerate(scenario_files, 1):
        try:
            with open(scenario_file, encoding="utf-8") as f:
                data = json.load(f)
            
            title = data.get("title", "Unknown")
            setting_type = data.get("setting_type", "Unknown")
            setting_name = data.get("setting_name", "Unknown")
            saved_at = data.get("_saved_at", "Unknown")
            
            # Parse timestamp if available
            if saved_at != "Unknown":
                try:
                    dt = datetime.fromisoformat(saved_at)
                    saved_at = dt.strftime("%Y-%m-%d %H:%M:%S")
                except (ValueError, TypeError):
                    pass
            
            # Count locations, NPCs, secrets
            num_locations = len(data.get("locations", []))
            num_npcs = len(data.get("npcs", []))
            num_secrets = len(data.get("secrets", []))
            
            print(f"{i}. {title}")
            print(f"   Setting: {setting_name} ({setting_type})")
            print(f"   Content: {num_locations} locations, {num_npcs} NPCs, {num_secrets} secrets")
            print(f"   File: {scenario_file.name}")
            print(f"   Saved: {saved_at}")
            print()
            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"{i}. [ERROR] {scenario_file.name}: {e}\n")


if __name__ == "__main__":
    list_scenarios()
