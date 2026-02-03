"""
Void Walker - Scenario Validation Tests.

Tests for scenario validation, issue categorization, and correction logic.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from void_walker.core.state import (
    InventoryItem,
    Location,
    NPC,
    Scenario,
    Secret,
    VictoryCondition,
)
from void_walker.llm.validators import (
    ValidationSeverity,
    IssueCategory,
    ValidationIssue,
    has_blocking_errors,
    get_correctable_errors,
    get_fatal_errors,
    all_errors_correctable,
    issues_to_warning_messages,
    CORRECTABLE_CATEGORIES,
    FATAL_CATEGORIES,
)
from void_walker.llm.world_gen import validate_scenario


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def valid_scenario():
    """Create a valid minimal scenario for testing."""
    return Scenario(
        title="Test Scenario",
        setting_type="derelict_ship",
        setting_name="USS Test",
        premise="A test scenario",
        main_threat="Test threat",
        victory_condition=VictoryCondition(
            description="Find the key and escape",
            required_items=["key_card"],
            required_info=[],
            required_location="exit",
        ),
        starting_location="start",
        locations=[
            Location(
                id="start",
                name="Starting Room",
                description="The beginning",
                connections=["corridor"],
                danger_level=2,
                items=[],
                threats=[],
                secrets=[],
            ),
            Location(
                id="corridor",
                name="Main Corridor",
                description="A long corridor",
                connections=["start", "exit", "storage"],
                danger_level=3,
                items=[],
                threats=[],
                secrets=[],
            ),
            Location(
                id="storage",
                name="Storage Room",
                description="Contains supplies",
                connections=["corridor"],
                danger_level=2,
                items=[InventoryItem(id="key_card", name="Key Card", item_type="key_item")],
                threats=[],
                secrets=["hidden_cache"],
                is_dead_end=True,
            ),
            Location(
                id="exit",
                name="Exit",
                description="The way out",
                connections=["corridor"],
                danger_level=4,
                items=[],
                threats=[],
                secrets=[],
                required_for_victory=True,
            ),
        ],
        npcs=[],
        secrets=[
            Secret(
                id="hidden_cache",
                description="A hidden cache",
                location="storage",
                discovery_method="search",
                revelation="You found supplies",
            ),
        ],
    )


@pytest.fixture
def scenario_with_orphan():
    """Create a scenario with an orphaned location."""
    return Scenario(
        title="Orphan Test",
        setting_type="space_station",
        setting_name="Station X",
        premise="Test",
        main_threat="Threat",
        victory_condition="Escape",
        starting_location="start",
        locations=[
            Location(
                id="start",
                name="Start",
                description="Beginning",
                connections=["middle"],
                danger_level=2,
            ),
            Location(
                id="middle",
                name="Middle",
                description="Middle room",
                connections=["start"],
                danger_level=3,
            ),
            Location(
                id="orphan",
                name="Orphan Room",
                description="Disconnected",
                connections=[],  # No connections at all
                danger_level=5,
            ),
        ],
    )


@pytest.fixture
def scenario_with_one_way():
    """Create a scenario with one-way connections."""
    return Scenario(
        title="One-Way Test",
        setting_type="space_station",
        setting_name="Station Y",
        premise="Test",
        main_threat="Threat",
        victory_condition="Escape",
        starting_location="start",
        locations=[
            Location(
                id="start",
                name="Start",
                description="Beginning",
                connections=["end"],  # Can go to end
                danger_level=2,
            ),
            Location(
                id="end",
                name="End",
                description="Destination",
                connections=[],  # Cannot go back!
                danger_level=3,
            ),
        ],
    )


@pytest.fixture
def scenario_missing_item():
    """Create a scenario with missing required item."""
    return Scenario(
        title="Missing Item Test",
        setting_type="space_station",
        setting_name="Station Z",
        premise="Test",
        main_threat="Threat",
        victory_condition=VictoryCondition(
            description="Find the keycard",
            required_items=["missing_keycard"],  # This item doesn't exist
            required_info=[],
            required_location="exit",
        ),
        starting_location="start",
        locations=[
            Location(
                id="start",
                name="Start",
                description="Beginning",
                connections=["exit"],
                danger_level=2,
            ),
            Location(
                id="exit",
                name="Exit",
                description="The exit",
                connections=["start"],
                danger_level=3,
            ),
        ],
    )


@pytest.fixture
def scenario_hostile_no_weakness():
    """Create a scenario with hostile NPC without weakness."""
    return Scenario(
        title="Hostile Test",
        setting_type="space_station",
        setting_name="Station W",
        premise="Test",
        main_threat="Creature",
        victory_condition="Escape",
        starting_location="start",
        locations=[
            Location(
                id="start",
                name="Start",
                description="Beginning",
                connections=["end"],
                danger_level=2,
            ),
            Location(
                id="end",
                name="End",
                description="Destination",
                connections=["start"],
                danger_level=3,
            ),
        ],
        npcs=[
            NPC(
                id="monster",
                name="Monster",
                npc_type="creature",
                location="end",
                description="A scary monster",
                disposition="hostile",
                weakness=None,  # Missing weakness!
            ),
        ],
    )


# =============================================================================
# VALIDATION MODELS TESTS
# =============================================================================


class TestValidationIssue:
    """Tests for ValidationIssue dataclass."""
    
    def test_issue_string_representation(self):
        """Test __str__ method."""
        issue = ValidationIssue(
            severity=ValidationSeverity.ERROR,
            category=IssueCategory.ORPHANED_LOCATION,
            message="Location 'orphan' is unreachable",
        )
        assert "[ERROR]" in str(issue)
        assert "unreachable" in str(issue)
    
    def test_correctable_issue(self):
        """Test is_correctable property."""
        for category in CORRECTABLE_CATEGORIES:
            issue = ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=category,
                message="Test",
            )
            assert issue.is_correctable
            assert not issue.is_fatal
    
    def test_fatal_issue(self):
        """Test is_fatal property."""
        for category in FATAL_CATEGORIES:
            issue = ValidationIssue(
                severity=ValidationSeverity.ERROR,
                category=category,
                message="Test",
            )
            assert issue.is_fatal
            assert not issue.is_correctable


class TestIssueHelpers:
    """Tests for issue helper functions."""
    
    def test_has_blocking_errors(self):
        """Test has_blocking_errors function."""
        no_errors = [
            ValidationIssue(ValidationSeverity.WARNING, IssueCategory.DEAD_END_NO_REWARD, "warn"),
        ]
        assert not has_blocking_errors(no_errors)
        
        with_errors = [
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ORPHANED_LOCATION, "error"),
        ]
        assert has_blocking_errors(with_errors)
    
    def test_get_correctable_errors(self):
        """Test get_correctable_errors function."""
        issues = [
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ORPHANED_LOCATION, "orphan"),
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.NO_VICTORY_PATH, "fatal"),
            ValidationIssue(ValidationSeverity.WARNING, IssueCategory.DEAD_END_NO_REWARD, "warn"),
        ]
        
        correctable = get_correctable_errors(issues)
        assert len(correctable) == 1
        assert correctable[0].category == IssueCategory.ORPHANED_LOCATION
    
    def test_get_fatal_errors(self):
        """Test get_fatal_errors function."""
        issues = [
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ORPHANED_LOCATION, "orphan"),
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.NO_VICTORY_PATH, "fatal"),
            ValidationIssue(ValidationSeverity.WARNING, IssueCategory.DEAD_END_NO_REWARD, "warn"),
        ]
        
        fatal = get_fatal_errors(issues)
        assert len(fatal) == 1
        assert fatal[0].category == IssueCategory.NO_VICTORY_PATH
    
    def test_all_errors_correctable(self):
        """Test all_errors_correctable function."""
        only_correctable = [
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ORPHANED_LOCATION, "orphan"),
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ONE_WAY_CONNECTION, "one-way"),
        ]
        assert all_errors_correctable(only_correctable)
        
        with_fatal = [
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ORPHANED_LOCATION, "orphan"),
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.NO_VICTORY_PATH, "fatal"),
        ]
        assert not all_errors_correctable(with_fatal)
    
    def test_issues_to_warning_messages(self):
        """Test issues_to_warning_messages function."""
        issues = [
            ValidationIssue(ValidationSeverity.ERROR, IssueCategory.ORPHANED_LOCATION, "error msg"),
            ValidationIssue(ValidationSeverity.WARNING, IssueCategory.DEAD_END_NO_REWARD, "warning 1"),
            ValidationIssue(ValidationSeverity.WARNING, IssueCategory.HIGH_DANGER_VICTORY_PATH, "warning 2"),
        ]
        
        warnings = issues_to_warning_messages(issues)
        assert len(warnings) == 2
        assert "warning 1" in warnings
        assert "warning 2" in warnings
        assert "error msg" not in warnings


# =============================================================================
# VALIDATE_SCENARIO TESTS
# =============================================================================


class TestValidateScenario:
    """Tests for validate_scenario function."""
    
    def test_valid_scenario_passes(self, valid_scenario):
        """Test that a valid scenario has no errors."""
        issues = validate_scenario(valid_scenario)
        errors = [i for i in issues if i.severity == ValidationSeverity.ERROR]
        assert len(errors) == 0
    
    def test_detects_orphaned_location(self, scenario_with_orphan):
        """Test detection of orphaned locations."""
        issues = validate_scenario(scenario_with_orphan)
        orphan_issues = [
            i for i in issues 
            if i.category == IssueCategory.ORPHANED_LOCATION
        ]
        assert len(orphan_issues) == 1
        assert "orphan" in orphan_issues[0].affected_elements
    
    def test_detects_one_way_connection(self, scenario_with_one_way):
        """Test detection of one-way connections."""
        issues = validate_scenario(scenario_with_one_way)
        one_way_issues = [
            i for i in issues 
            if i.category == IssueCategory.ONE_WAY_CONNECTION
        ]
        assert len(one_way_issues) == 1
        assert "start" in one_way_issues[0].affected_elements
        assert "end" in one_way_issues[0].affected_elements
    
    def test_detects_missing_required_item(self, scenario_missing_item):
        """Test detection of missing required items."""
        issues = validate_scenario(scenario_missing_item)
        missing_item_issues = [
            i for i in issues 
            if i.category == IssueCategory.MISSING_ITEM
        ]
        assert len(missing_item_issues) == 1
        assert "missing_keycard" in missing_item_issues[0].affected_elements
    
    def test_detects_hostile_without_weakness(self, scenario_hostile_no_weakness):
        """Test detection of hostile NPCs without weakness."""
        issues = validate_scenario(scenario_hostile_no_weakness)
        weakness_issues = [
            i for i in issues 
            if i.category == IssueCategory.MISSING_WEAKNESS
        ]
        assert len(weakness_issues) == 1
        assert "monster" in weakness_issues[0].affected_elements
    
    def test_detects_too_few_locations(self):
        """Test detection of scenarios with too few locations."""
        scenario = Scenario(
            title="Small",
            setting_type="ship",
            setting_name="Tiny",
            premise="Test",
            main_threat="Threat",
            victory_condition="Win",
            starting_location="only",
            locations=[
                Location(id="only", name="Only", description="Only room", connections=[]),
            ],
        )
        issues = validate_scenario(scenario)
        too_few_issues = [
            i for i in issues 
            if i.category == IssueCategory.TOO_FEW_LOCATIONS
        ]
        assert len(too_few_issues) == 1
    
    def test_detects_missing_start_location(self):
        """Test detection of missing starting location."""
        scenario = Scenario(
            title="No Start",
            setting_type="ship",
            setting_name="Lost",
            premise="Test",
            main_threat="Threat",
            victory_condition="Win",
            starting_location="nonexistent",
            locations=[
                Location(id="a", name="A", description="Room A", connections=["b"]),
                Location(id="b", name="B", description="Room B", connections=["a"]),
                Location(id="c", name="C", description="Room C", connections=["a"]),
            ],
        )
        issues = validate_scenario(scenario)
        start_issues = [
            i for i in issues 
            if i.category == IssueCategory.NO_START_LOCATION
        ]
        assert len(start_issues) == 1
    
    def test_dead_end_warning(self, valid_scenario):
        """Test that dead-ends without rewards generate warnings."""
        # Add a dead-end without rewards
        valid_scenario.locations.append(
            Location(
                id="empty_dead_end",
                name="Empty Room",
                description="Nothing here",
                connections=["corridor"],
                danger_level=2,
                items=[],
                secrets=[],
            )
        )
        # Also add connection from corridor
        for loc in valid_scenario.locations:
            if loc.id == "corridor":
                loc.connections.append("empty_dead_end")
        
        issues = validate_scenario(valid_scenario)
        dead_end_warnings = [
            i for i in issues 
            if i.category == IssueCategory.DEAD_END_NO_REWARD
        ]
        # At least one warning for our empty dead-end
        assert any("Empty Room" in w.message for w in dead_end_warnings)
        assert dead_end_warnings[0].severity == ValidationSeverity.WARNING


# =============================================================================
# CORRECTION PROMPT TESTS
# =============================================================================


class TestCorrectionPrompt:
    """Tests for correction prompt building."""
    
    def test_build_correction_prompt_structure(self):
        """Test that correction prompt has required elements."""
        from void_walker.llm.prompts import build_correction_prompt
        
        issues = [
            ValidationIssue(
                ValidationSeverity.ERROR,
                IssueCategory.ONE_WAY_CONNECTION,
                "One-way connection: 'start' → 'end'",
                affected_elements=["start", "end"],
            ),
        ]
        
        prompt = build_correction_prompt('{"title": "Test"}', issues)
        
        assert "Test" in prompt  # Scenario included
        assert "One-way connection" in prompt  # Issue included
        assert "bidirectional" in prompt.lower()  # Instruction for fix
        assert "JSON" in prompt  # Output format mentioned
    
    def test_correction_prompt_multiple_issues(self):
        """Test correction prompt with multiple issue types."""
        from void_walker.llm.prompts import build_correction_prompt
        
        issues = [
            ValidationIssue(
                ValidationSeverity.ERROR,
                IssueCategory.ONE_WAY_CONNECTION,
                "One-way: A → B",
            ),
            ValidationIssue(
                ValidationSeverity.ERROR,
                IssueCategory.MISSING_ITEM,
                "Item 'key' missing",
            ),
            ValidationIssue(
                ValidationSeverity.ERROR,
                IssueCategory.ORPHANED_LOCATION,
                "Location 'orphan' unreachable",
            ),
        ]
        
        prompt = build_correction_prompt('{}', issues)
        
        # Should have numbered list
        assert "1." in prompt
        assert "2." in prompt
        assert "3." in prompt


# =============================================================================
# INTEGRATION TESTS
# =============================================================================


class TestValidationIntegration:
    """Integration tests for the validation system."""
    
    def test_valid_scenario_roundtrip(self, valid_scenario):
        """Test that valid scenario passes and has correct warnings."""
        issues = validate_scenario(valid_scenario)
        
        # Should have no errors
        errors = [i for i in issues if i.severity == ValidationSeverity.ERROR]
        assert len(errors) == 0
        
        # Can convert to warning messages
        warnings = issues_to_warning_messages(issues)
        # Warnings are acceptable
        assert isinstance(warnings, list)
    
    def test_issue_categorization_consistency(self):
        """Test that all categories are in exactly one set."""
        all_categories = set(IssueCategory)
        categorized = CORRECTABLE_CATEGORIES | FATAL_CATEGORIES
        
        # Warning-only categories (not in correctable or fatal)
        warning_only = {
            IssueCategory.DEAD_END_NO_REWARD,
            IssueCategory.REQUIRED_INFO_NOT_FOUND,
            IssueCategory.HIGH_DANGER_VICTORY_PATH,
        }
        
        assert CORRECTABLE_CATEGORIES & FATAL_CATEGORIES == set()  # No overlap
        assert categorized | warning_only == all_categories  # All accounted for
