"""Tests for player guidance system."""

import pytest

from void_walker.core.guidance import (
    GuidanceSystem,
    STUCK_THRESHOLD,
    WANDERING_THRESHOLD,
    HINT_COOLDOWN,
)
from void_walker.core.state import (
    GameState,
    InventoryItem,
    Location,
    NPC,
    Player,
    Scenario,
    Secret,
    SessionProgress,
    VictoryCondition,
)


def create_test_scenario() -> Scenario:
    """Create a test scenario with locations, NPCs, and secrets."""
    return Scenario(
        title="Test Scenario",
        setting_type="derelict_ship",
        setting_name="USS Test",
        premise="A test scenario for guidance testing.",
        main_threat="la créature",
        threat_description="A dangerous creature lurks in the shadows.",
        victory_condition=VictoryCondition(
            description="Atteindre la salle de contrôle et activer l'autodestruction",
            required_items=["keycard", "override_chip"],
            required_info=["access_code"],
            required_location="bridge",
            alternative_approach="Trouver une capsule de sauvetage",
        ),
        starting_location="docking_bay",
        locations=[
            Location(
                id="docking_bay",
                name="Baie d'amarrage",
                description="A large docking area.",
                connections=["corridor", "cargo_hold"],
                danger_level=2,
                items=[InventoryItem(name="Lampe torche", id="flashlight")],
                secrets=["secret_panel"],
            ),
            Location(
                id="corridor",
                name="Couloir principal",
                description="A dark corridor.",
                connections=["docking_bay", "bridge", "crew_quarters"],
                danger_level=3,
            ),
            Location(
                id="bridge",
                name="Passerelle",
                description="The ship's bridge.",
                connections=["corridor"],
                danger_level=5,
                required_for_victory=True,
            ),
            Location(
                id="crew_quarters",
                name="Quartiers d'équipage",
                description="Crew sleeping quarters.",
                connections=["corridor"],
                danger_level=2,
                secrets=["hidden_keycard"],
            ),
            Location(
                id="cargo_hold",
                name="Soute",
                description="Cargo storage area.",
                connections=["docking_bay"],
                danger_level=4,
                items=[InventoryItem(name="Override Chip", id="override_chip")],
            ),
        ],
        npcs=[
            NPC(
                id="survivor_1",
                name="Dr. Chen",
                npc_type="survivor",
                location="crew_quarters",
                description="A scared scientist.",
                knowledge="Le code d'accès est 4521. La créature craint la lumière.",
                disposition="fearful",
            ),
            NPC(
                id="android_1",
                name="ARIA",
                npc_type="android",
                location="bridge",
                description="A malfunctioning android.",
                knowledge="Les systèmes de sécurité peuvent être contournés par le panneau B-7.",
                disposition="neutral",
            ),
        ],
        secrets=[
            Secret(
                id="secret_panel",
                description="A hidden maintenance panel.",
                location="docking_bay",
                discovery_method="search",
                revelation="Le panneau révèle un passage vers la salle des machines.",
            ),
            Secret(
                id="hidden_keycard",
                description="A keycard hidden under a mattress.",
                location="crew_quarters",
                discovery_method="examine",
                revelation="La carte donne accès à la passerelle.",
                unlocks="bridge",
            ),
            Secret(
                id="access_code",
                description="The access code for the self-destruct.",
                location="bridge",
                discovery_method="hack",
                revelation="Code: 4521",
            ),
        ],
    )


def create_test_player() -> Player:
    """Create a test player."""
    return Player(
        name="Test Player",
        class_name="Technicien",
        stats={"FOR": 2, "INT": 4, "CHA": 2},
        hp=10,
        max_hp=10,
    )


def create_test_state(
    turns_since_progress: int = 0,
    location_history: list[str] | None = None,
    hints_delivered: list[str] | None = None,
    current_location: str = "docking_bay",
    turn_number: int = 1,
) -> GameState:
    """Create a test game state with configurable guidance fields."""
    scenario = create_test_scenario()
    player = create_test_player()
    
    state = GameState(
        session_id="test_session",
        player=player,
        scenario=scenario,
        current_location=current_location,
        visited_locations={current_location},
        turns_since_progress=turns_since_progress,
        location_history=location_history or [],
        hints_delivered=hints_delivered or [],
        turn_number=turn_number,
    )
    
    # Set available exits based on current location
    loc = scenario.get_location(current_location)
    if loc:
        state.available_exits = loc.connections
    
    return state


class TestGuidanceSystemStuckDetection:
    """Tests for stuck player detection."""
    
    def test_not_stuck_below_threshold(self):
        """Player is not stuck when below threshold."""
        state = create_test_state(turns_since_progress=STUCK_THRESHOLD - 1)
        guidance = GuidanceSystem(state)
        
        assert not guidance.is_stuck()
        assert guidance.get_hint_level() == 0
    
    def test_stuck_at_threshold(self):
        """Player is stuck when at threshold."""
        state = create_test_state(turns_since_progress=STUCK_THRESHOLD)
        guidance = GuidanceSystem(state)
        
        assert guidance.is_stuck()
        assert guidance.get_hint_level() == 1
    
    def test_stuck_above_threshold(self):
        """Player is stuck when above threshold."""
        state = create_test_state(turns_since_progress=STUCK_THRESHOLD + 2)
        guidance = GuidanceSystem(state)
        
        assert guidance.is_stuck()
        assert guidance.get_hint_level() == 2


class TestGuidanceSystemWanderingDetection:
    """Tests for wandering player detection."""
    
    def test_not_wandering_too_few_moves(self):
        """Player is not wandering with fewer than threshold moves."""
        state = create_test_state(
            location_history=["docking_bay", "corridor", "docking_bay"]
        )
        guidance = GuidanceSystem(state)
        
        assert not guidance.is_wandering()
    
    def test_wandering_back_and_forth(self):
        """Player is wandering when moving between only 2 locations."""
        state = create_test_state(
            location_history=[
                "docking_bay",
                "corridor",
                "docking_bay",
                "corridor",
            ]
        )
        guidance = GuidanceSystem(state)
        
        assert guidance.is_wandering()
    
    def test_not_wandering_diverse_movement(self):
        """Player is not wandering when visiting different locations."""
        state = create_test_state(
            location_history=[
                "docking_bay",
                "corridor",
                "crew_quarters",
                "bridge",
            ]
        )
        guidance = GuidanceSystem(state)
        
        assert not guidance.is_wandering()


class TestGuidanceSystemHintLevels:
    """Tests for hint level escalation."""
    
    def test_hint_level_0_no_stagnation(self):
        """No hint when player is progressing."""
        state = create_test_state(turns_since_progress=0)
        guidance = GuidanceSystem(state)
        
        assert guidance.get_hint_level() == 0
    
    def test_hint_level_1_subtle(self):
        """Subtle hint at 5-6 turns without progress."""
        for turns in [5, 6]:
            state = create_test_state(turns_since_progress=turns)
            guidance = GuidanceSystem(state)
            
            assert guidance.get_hint_level() == 1, f"Expected level 1 at {turns} turns"
    
    def test_hint_level_2_moderate(self):
        """Moderate hint at 7-8 turns without progress."""
        for turns in [7, 8]:
            state = create_test_state(turns_since_progress=turns)
            guidance = GuidanceSystem(state)
            
            assert guidance.get_hint_level() == 2, f"Expected level 2 at {turns} turns"
    
    def test_hint_level_3_direct(self):
        """Direct hint at 9+ turns without progress."""
        for turns in [9, 10, 15]:
            state = create_test_state(turns_since_progress=turns)
            guidance = GuidanceSystem(state)
            
            assert guidance.get_hint_level() == 3, f"Expected level 3 at {turns} turns"


class TestGuidanceSystemDynamicHints:
    """Tests for dynamic hint content generation."""
    
    def test_hint_includes_unvisited_exits(self):
        """Hint context includes unvisited exits."""
        state = create_test_state(
            turns_since_progress=5,
            current_location="docking_bay",
        )
        # Only docking_bay is visited, so corridor and cargo_hold are unvisited
        
        guidance = GuidanceSystem(state)
        hint = guidance.build_hint_context()
        
        assert "Couloir principal" in hint or "Soute" in hint
    
    def test_hint_includes_npc_knowledge(self):
        """Hint context includes NPC with knowledge at moderate level."""
        state = create_test_state(
            turns_since_progress=7,  # Level 2
            current_location="crew_quarters",
        )
        
        guidance = GuidanceSystem(state)
        hint = guidance.build_hint_context()
        
        # Should mention Dr. Chen who has knowledge
        assert "Dr. Chen" in hint or "code d'accès" in hint
    
    def test_hint_includes_objective_at_level_3(self):
        """Direct hint includes objective details."""
        state = create_test_state(
            turns_since_progress=9,  # Level 3
        )
        
        guidance = GuidanceSystem(state)
        hint = guidance.build_hint_context()
        
        # Should mention victory condition or missing items
        assert "Objectif" in hint or "keycard" in hint or "override_chip" in hint
    
    def test_no_hint_when_not_stuck(self):
        """No hint context when player is progressing."""
        state = create_test_state(turns_since_progress=2)
        
        guidance = GuidanceSystem(state)
        hint = guidance.build_hint_context()
        
        assert hint == ""


class TestGuidanceSystemProgressReset:
    """Tests for progress tracking reset behavior."""
    
    def test_progress_resets_on_new_location(self):
        """Discovering new location resets stagnation counter."""
        state = create_test_state(turns_since_progress=5)
        
        # Simulate visiting a new location
        from void_walker.core.state import StateChanges
        changes = StateChanges(location_change="corridor")
        
        messages, new_loc, obj_comp, secret_found = state.apply_state_changes(changes)
        
        assert new_loc is True
        assert state.turns_since_progress == 0
    
    def test_progress_resets_on_secret_discovery(self):
        """Discovering a secret resets stagnation counter."""
        state = create_test_state(turns_since_progress=5)
        
        from void_walker.core.state import StateChanges
        changes = StateChanges(secrets_discovered=["secret_panel"])
        
        messages, new_loc, obj_comp, secret_found = state.apply_state_changes(changes)
        
        assert secret_found is True
        assert state.turns_since_progress == 0
    
    def test_progress_resets_on_objective_complete(self):
        """Completing an objective resets stagnation counter."""
        state = create_test_state(turns_since_progress=5)
        
        from void_walker.core.state import StateChanges
        changes = StateChanges(objective_completed="found_keycard")
        
        messages, new_loc, obj_comp, secret_found = state.apply_state_changes(changes)
        
        assert obj_comp is True
        assert state.turns_since_progress == 0
    
    def test_stagnation_increments_without_progress(self):
        """Stagnation counter increments when no progress made."""
        state = create_test_state(turns_since_progress=5)
        
        from void_walker.core.state import StateChanges
        changes = StateChanges()  # No meaningful changes
        
        state.apply_state_changes(changes)
        
        assert state.turns_since_progress == 6
    
    def test_location_history_tracked(self):
        """Location history is updated on state changes."""
        state = create_test_state(
            current_location="docking_bay",
            location_history=[],
        )
        
        from void_walker.core.state import StateChanges
        changes = StateChanges()
        
        state.apply_state_changes(changes)
        
        assert "docking_bay" in state.location_history
    
    def test_location_history_limited_to_10(self):
        """Location history is limited to last 10 entries."""
        state = create_test_state(
            current_location="docking_bay",
            location_history=["loc" + str(i) for i in range(10)],
        )
        
        from void_walker.core.state import StateChanges
        changes = StateChanges()
        
        state.apply_state_changes(changes)
        
        assert len(state.location_history) == 10
        assert state.location_history[-1] == "docking_bay"
        assert "loc0" not in state.location_history


class TestGuidanceStatePersistence:
    """Tests for guidance state save/load cycle."""
    
    def test_guidance_fields_serialize(self):
        """Guidance fields are included in state serialization."""
        state = create_test_state(
            turns_since_progress=7,
            location_history=["loc1", "loc2", "loc3"],
            hints_delivered=["level1_turn5", "level2_turn7"],
        )
        
        # Serialize state
        state_dict = state.model_dump(mode="json")
        
        assert state_dict["turns_since_progress"] == 7
        assert state_dict["location_history"] == ["loc1", "loc2", "loc3"]
        assert state_dict["hints_delivered"] == ["level1_turn5", "level2_turn7"]
    
    def test_guidance_fields_persist_through_save_load(self):
        """Guidance fields survive full save/load cycle."""
        import json
        import tempfile
        from pathlib import Path
        
        state = create_test_state(
            turns_since_progress=7,
            location_history=["loc1", "loc2", "loc3"],
            hints_delivered=["level1_turn5", "level2_turn7"],
        )
        
        # Serialize to JSON (like save_state does)
        state_dict = state.model_dump(mode="json")
        state_dict["visited_locations"] = list(state.visited_locations)
        state_dict["hallucinated_locations"] = list(state.hallucinated_locations)
        
        # Write to temp file with proper encoding
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as f:
            json.dump(state_dict, f, ensure_ascii=False)
            temp_path = f.name
        
        try:
            # Read back
            with open(temp_path, encoding="utf-8") as f:
                loaded_dict = json.load(f)
            
            # Convert sets back
            loaded_dict["visited_locations"] = set(loaded_dict["visited_locations"])
            loaded_dict["hallucinated_locations"] = set(loaded_dict["hallucinated_locations"])
            
            # Recreate state
            loaded_state = GameState(**loaded_dict)
            
            # Verify guidance fields
            assert loaded_state.turns_since_progress == 7
            assert loaded_state.location_history == ["loc1", "loc2", "loc3"]
            assert loaded_state.hints_delivered == ["level1_turn5", "level2_turn7"]
        finally:
            Path(temp_path).unlink()


class TestGameStateHelperMethods:
    """Tests for new helper methods on GameState."""
    
    def test_get_unvisited_exits(self):
        """get_unvisited_exits returns names of unvisited connected locations."""
        state = create_test_state(current_location="docking_bay")
        # Only docking_bay is visited
        
        unvisited = state.get_unvisited_exits()
        
        assert "Couloir principal" in unvisited
        assert "Soute" in unvisited
        assert "Baie d'amarrage" not in unvisited  # Current location
    
    def test_get_unvisited_exits_all_visited(self):
        """get_unvisited_exits returns empty list when all exits visited."""
        state = create_test_state(current_location="docking_bay")
        state.visited_locations.add("corridor")
        state.visited_locations.add("cargo_hold")
        
        unvisited = state.get_unvisited_exits()
        
        assert unvisited == []
    
    def test_get_objective_progress_missing_items(self):
        """get_objective_progress identifies missing required items."""
        state = create_test_state()
        
        progress = state.get_objective_progress()
        
        assert "keycard" in progress["missing_items"]
        assert "override_chip" in progress["missing_items"]
        assert "access_code" in progress["missing_info"]
    
    def test_get_objective_progress_with_items(self):
        """get_objective_progress reflects collected items."""
        state = create_test_state()
        state.player.inventory.add(InventoryItem(name="Keycard", id="keycard"))
        
        progress = state.get_objective_progress()
        
        assert "keycard" not in progress["missing_items"]
        assert "override_chip" in progress["missing_items"]
    
    def test_get_undiscovered_secrets_in_location(self):
        """get_undiscovered_secrets_in_location returns local secrets."""
        state = create_test_state(current_location="docking_bay")
        
        secrets = state.get_undiscovered_secrets_in_location()
        
        assert len(secrets) == 1
        assert secrets[0].id == "secret_panel"
    
    def test_get_undiscovered_secrets_already_found(self):
        """get_undiscovered_secrets_in_location excludes found secrets."""
        state = create_test_state(current_location="docking_bay")
        state.discovered_secrets.append("secret_panel")
        
        secrets = state.get_undiscovered_secrets_in_location()
        
        assert len(secrets) == 0
    
    def test_get_npcs_with_knowledge(self):
        """get_npcs_with_knowledge returns NPCs with knowledge field."""
        state = create_test_state()
        
        npcs = state.get_npcs_with_knowledge()
        
        assert len(npcs) == 2
        npc_names = [npc.name for npc in npcs]
        assert "Dr. Chen" in npc_names
        assert "ARIA" in npc_names
