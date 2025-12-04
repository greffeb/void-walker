# -*- coding: utf-8 -*-
"""Tests for world generation validation."""

import pytest

from void_walker.core.state import (
    InventoryItem,
    Location,
    NPC,
    Scenario,
    Secret,
    VictoryCondition,
)
from void_walker.llm.world_gen import validate_scenario, create_fallback_scenario


class TestValidateScenario:
    """Tests for the validate_scenario function."""
    
    def test_valid_scenario_no_issues(self):
        """A well-formed scenario should have no issues."""
        scenario = create_fallback_scenario()
        issues = validate_scenario(scenario)
        # The fallback scenario should be valid
        assert len(issues) == 0, f"Unexpected issues: {issues}"
    
    def test_detects_missing_starting_location(self):
        """Should detect when starting location doesn't exist."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="nonexistent",
            locations=[
                Location(id="actual", name="Actual", description="test", connections=[])
            ],
        )
        issues = validate_scenario(scenario)
        assert any("nonexistent" in issue for issue in issues)
    
    def test_detects_dead_end_without_rewards(self):
        """Should detect dead-ends that have no rewards."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=["dead_end"]),
                Location(id="dead_end", name="Dead End", description="test", connections=["start"]),
            ],
        )
        issues = validate_scenario(scenario)
        assert any("dead_end" in issue.lower() and "no rewards" in issue.lower() for issue in issues)
    
    def test_dead_end_with_item_is_ok(self):
        """Dead-ends with items should not be flagged."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=["dead_end"]),
                Location(
                    id="dead_end", 
                    name="Dead End", 
                    description="test", 
                    connections=["start"],
                    items=[InventoryItem(name="Reward", item_type="misc")]
                ),
            ],
        )
        issues = validate_scenario(scenario)
        assert not any("dead_end" in issue.lower() and "no rewards" in issue.lower() for issue in issues)
    
    def test_detects_hostile_npc_without_weakness(self):
        """Should detect hostile NPCs without defined weaknesses."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=[]),
            ],
            npcs=[
                NPC(
                    id="enemy",
                    name="Enemy",
                    npc_type="hostile",
                    disposition="hostile",
                    weakness=None,
                ),
            ],
        )
        issues = validate_scenario(scenario)
        assert any("weakness" in issue.lower() for issue in issues)
    
    def test_hostile_npc_with_weakness_is_ok(self):
        """Hostile NPCs with weaknesses should not be flagged."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=[]),
            ],
            npcs=[
                NPC(
                    id="enemy",
                    name="Enemy",
                    npc_type="hostile",
                    disposition="hostile",
                    weakness="Fire",
                ),
            ],
        )
        issues = validate_scenario(scenario)
        assert not any("weakness" in issue.lower() for issue in issues)
    
    def test_detects_orphaned_locations(self):
        """Should detect locations not reachable from start."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=["middle"]),
                Location(id="middle", name="Middle", description="test", connections=["start"]),
                Location(id="orphan", name="Orphan", description="test", connections=[]),
            ],
        )
        issues = validate_scenario(scenario)
        assert any("orphan" in issue.lower() and "not reachable" in issue.lower() for issue in issues)
    
    def test_detects_one_way_connections(self):
        """Should detect connections that aren't bidirectional."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition="Test",
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=["end"]),
                Location(id="end", name="End", description="test", connections=[]),  # Missing back-connection
            ],
        )
        issues = validate_scenario(scenario)
        assert any("one-way" in issue.lower() or "bidirectional" in issue.lower() for issue in issues)
    
    def test_detects_missing_victory_items(self):
        """Should detect when required items aren't placed."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition=VictoryCondition(
                description="Test",
                required_items=["missing_key"],
                required_location="start",
            ),
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=[]),
            ],
        )
        issues = validate_scenario(scenario)
        assert any("missing_key" in issue for issue in issues)
    
    def test_detects_unreachable_victory_location(self):
        """Should detect when victory location can't be reached."""
        scenario = Scenario(
            title="Test",
            setting_type="test",
            setting_name="Test",
            premise="Test",
            main_threat="Test",
            victory_condition=VictoryCondition(
                description="Test",
                required_items=[],
                required_location="goal",
            ),
            starting_location="start",
            locations=[
                Location(id="start", name="Start", description="test", connections=[]),
                Location(id="goal", name="Goal", description="test", connections=[]),  # Disconnected
            ],
        )
        issues = validate_scenario(scenario)
        assert any("no path" in issue.lower() for issue in issues)


class TestFallbackScenario:
    """Tests for the fallback scenario."""
    
    def test_fallback_has_structured_victory(self):
        """Fallback scenario should use structured victory condition."""
        scenario = create_fallback_scenario()
        assert isinstance(scenario.victory_condition, VictoryCondition)
    
    def test_fallback_has_locations(self):
        """Fallback scenario should have locations."""
        scenario = create_fallback_scenario()
        assert len(scenario.locations) >= 5
    
    def test_fallback_has_npcs(self):
        """Fallback scenario should have NPCs."""
        scenario = create_fallback_scenario()
        assert len(scenario.npcs) >= 2
    
    def test_fallback_has_secrets(self):
        """Fallback scenario should have secrets."""
        scenario = create_fallback_scenario()
        assert len(scenario.secrets) >= 4
    
    def test_fallback_npcs_have_ids(self):
        """Fallback NPCs should have IDs."""
        scenario = create_fallback_scenario()
        for npc in scenario.npcs:
            assert npc.id is not None
    
    def test_fallback_hostile_has_weakness(self):
        """Hostile NPCs in fallback should have weaknesses."""
        scenario = create_fallback_scenario()
        hostile_npcs = [npc for npc in scenario.npcs if npc.disposition == "hostile"]
        for npc in hostile_npcs:
            assert npc.weakness is not None, f"Hostile NPC {npc.name} has no weakness"
    
    def test_fallback_has_validation_data(self):
        """Fallback scenario should include validation data."""
        scenario = create_fallback_scenario()
        assert scenario.validation is not None
        assert len(scenario.validation.critical_path) > 0
