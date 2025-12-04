"""Tests for state management models."""

import pytest

from void_walker.core.state import (
    GameState,
    Inventory,
    InventoryItem,
    Location,
    NPC,
    Player,
    Scenario,
    Secret,
    SessionProgress,
    SessionScore,
    StateChanges,
    StatProgression,
)


class TestInventoryItem:
    """Tests for InventoryItem."""
    
    def test_create_basic_item(self):
        """Test creating a basic item."""
        item = InventoryItem(name="Test Item")
        assert item.name == "Test Item"
        assert item.item_type == "misc"
        assert item.uses is None
        assert not item.is_depleted
    
    def test_consumable_item(self):
        """Test consumable items."""
        item = InventoryItem(name="Medkit", item_type="consumable", uses=3)
        
        assert item.uses == 3
        assert not item.is_depleted
        
        # Use the item
        assert item.use()
        assert item.uses == 2
        
        item.use()
        item.use()
        assert item.uses == 0
        assert item.is_depleted
        
        # Can't use depleted item
        assert not item.use()
    
    def test_unlimited_item(self):
        """Test items with unlimited uses."""
        item = InventoryItem(name="Flashlight", item_type="tool")
        
        for _ in range(100):
            assert item.use()
        
        assert not item.is_depleted


class TestInventory:
    """Tests for Inventory."""
    
    def test_empty_inventory(self):
        """Test empty inventory."""
        inv = Inventory()
        assert inv.count == 0
        assert not inv.is_full
    
    def test_add_item(self):
        """Test adding items."""
        inv = Inventory(max_slots=3)
        
        item1 = InventoryItem(name="Item 1")
        item2 = InventoryItem(name="Item 2")
        item3 = InventoryItem(name="Item 3")
        item4 = InventoryItem(name="Item 4")
        
        assert inv.add(item1)
        assert inv.add(item2)
        assert inv.add(item3)
        assert inv.count == 3
        assert inv.is_full
        
        # Can't add when full
        assert not inv.add(item4)
    
    def test_remove_item(self):
        """Test removing items."""
        inv = Inventory()
        item = InventoryItem(name="Test Item")
        inv.add(item)
        
        removed = inv.remove("test item")  # Case insensitive
        assert removed is not None
        assert removed.name == "Test Item"
        assert inv.count == 0
        
        # Remove non-existent item
        assert inv.remove("nonexistent") is None
    
    def test_get_item(self):
        """Test getting items without removal."""
        inv = Inventory()
        item = InventoryItem(name="Flashlight")
        inv.add(item)
        
        found = inv.get("flashlight")
        assert found is not None
        assert found.name == "Flashlight"
        assert inv.count == 1  # Still in inventory
    
    def test_has_item(self):
        """Test checking for items."""
        inv = Inventory()
        inv.add(InventoryItem(name="Key"))
        
        assert inv.has("key")
        assert inv.has("Key")
        assert not inv.has("Door")


class TestPlayer:
    """Tests for Player."""
    
    def test_create_player(self):
        """Test creating a player."""
        player = Player(
            name="Test",
            class_name="Marine",
            stats={"FOR": 4, "INT": 2, "CHA": 2},
            hp=12,
            max_hp=12,
        )
        
        assert player.name == "Test"
        assert player.class_name == "Marine"
        assert player.hp == 12
        assert not player.is_dead
    
    def test_take_damage(self):
        """Test damage mechanics."""
        player = Player(
            name="Test",
            class_name="Marine",
            stats={"FOR": 4, "INT": 2, "CHA": 2},
            hp=10,
            max_hp=10,
        )
        
        msg = player.take_damage(3, "enemy attack")
        assert "-3 HP" in msg
        assert player.hp == 7
        assert not player.is_dead
        
        # Lethal damage
        msg = player.take_damage(10, "explosion")
        assert "MORT" in msg
        assert player.hp == 0
        assert player.is_dead
    
    def test_heal(self):
        """Test healing mechanics."""
        player = Player(
            name="Test",
            class_name="Médecin",
            stats={"FOR": 2, "INT": 3, "CHA": 3},
            hp=5,
            max_hp=10,
        )
        
        healed = player.heal(3)
        assert healed == 3
        assert player.hp == 8
        
        # Can't overheal
        healed = player.heal(10)
        assert healed == 2
        assert player.hp == 10
    
    def test_get_stat_with_bonus(self):
        """Test stat calculation with item bonuses."""
        player = Player(
            name="Test",
            class_name="Technicien",
            stats={"FOR": 2, "INT": 4, "CHA": 2},
            hp=8,
            max_hp=8,
        )
        
        assert player.get_stat("INT") == 4
        
        # Add item with INT bonus
        tool = InventoryItem(name="Tool", stat_bonus={"INT": 2})
        player.inventory.add(tool)
        
        assert player.get_stat("INT") == 6
    
    def test_increase_stat(self):
        """Test stat progression."""
        player = Player(
            name="Test",
            class_name="Pilote",
            stats={"FOR": 3, "INT": 3, "CHA": 2},
            hp=10,
            max_hp=10,
        )
        
        # Increase stat
        assert player.increase_stat("FOR")
        assert player.stats["FOR"] == 4
        
        # Increase to max
        player.stats["FOR"] = 5
        assert not player.increase_stat("FOR")  # Already at max


class TestStatProgression:
    """Tests for StatProgression."""
    
    def test_add_xp(self):
        """Test XP accumulation."""
        prog = StatProgression(xp_threshold=5)
        
        # Add XP without level up
        for _ in range(4):
            assert not prog.add_xp("FOR")
        
        assert prog.for_xp == 4
        
        # Level up
        assert prog.add_xp("FOR")
        assert prog.for_xp == 0  # Reset after level up


class TestSessionProgress:
    """Tests for SessionProgress."""
    
    def test_story_beats(self):
        """Test story beat calculation."""
        prog = SessionProgress(total_scenes=20)
        
        # Starts at intro (0%)
        assert prog.story_beat == "intro"
        
        # After 1 scene (5% < 10%) - still intro
        prog.advance_scene()
        assert prog.story_beat == "intro"
        
        # After 2 scenes (10% >= 10%) - now rising
        prog.advance_scene()
        assert prog.story_beat == "rising"
        
        # After 9 scenes (45% >= 45%) - midpoint
        for _ in range(7):
            prog.advance_scene()
        assert prog.story_beat == "midpoint"
        
        # After 11 scenes (55% >= 55%) - escalation
        for _ in range(2):
            prog.advance_scene()
        assert prog.story_beat == "escalation"
        
        # After 17 scenes (85% >= 85%) - climax
        for _ in range(6):
            prog.advance_scene()
        assert prog.story_beat == "climax"
        
        for _ in range(3):
            prog.advance_scene()
        assert prog.story_beat == "resolution"
    
    def test_scenes_remaining(self):
        """Test scenes remaining calculation."""
        prog = SessionProgress(total_scenes=10)
        assert prog.scenes_remaining == 10
        
        prog.advance_scene()
        prog.advance_scene()
        assert prog.scenes_remaining == 8


class TestSessionScore:
    """Tests for SessionScore."""
    
    def test_score_calculation(self):
        """Test score calculation."""
        score = SessionScore(
            secrets_found=2,
            creative_solutions=1,
            enemies_defeated=3,
            hp_remaining=5,
            items_collected=4,
            objectives_completed=2,
            total_turns=30,
            ending_type="victory",
        )
        
        # Base: 2 * 100 = 200
        # Bonus: 2*25 + 1*50 + 3*15 + 5*10 + 4*5 = 50 + 50 + 45 + 50 + 20 = 215
        # Total before multiplier: 415
        # Victory multiplier: 1.5
        # Final: 622
        total = score.calculate_total()
        assert total == 622
    
    def test_defeat_multiplier(self):
        """Test defeat score penalty."""
        score = SessionScore(
            objectives_completed=1,
            ending_type="defeat",
        )
        
        # Base: 100, multiplier 0.5 = 50
        assert score.calculate_total() == 50


class TestLocation:
    """Tests for Location."""
    
    def test_create_location(self):
        """Test creating a location."""
        loc = Location(
            id="bridge",
            name="Pont de commandement",
            description="The command bridge",
            connections=["corridor", "server_room"],
        )
        
        assert loc.id == "bridge"
        assert len(loc.connections) == 2
        assert not loc.visited


class TestScenario:
    """Tests for Scenario."""
    
    def test_get_location(self):
        """Test finding locations."""
        scenario = Scenario(
            title="Test",
            setting_type="derelict_ship",
            setting_name="USS Test",
            premise="Test premise",
            main_threat="Test threat",
            victory_condition="Survive",
            starting_location="bridge",
            locations=[
                Location(id="bridge", name="Bridge", description=""),
                Location(id="engine", name="Engine", description=""),
            ],
        )
        
        loc = scenario.get_location("bridge")
        assert loc is not None
        assert loc.name == "Bridge"
        
        assert scenario.get_location("nonexistent") is None
    
    def test_get_npc(self):
        """Test finding NPCs."""
        scenario = Scenario(
            title="Test",
            setting_type="derelict_ship",
            setting_name="USS Test",
            premise="Test",
            main_threat="Threat",
            victory_condition="Survive",
            starting_location="start",
            npcs=[
                NPC(name="Dr. Smith", npc_type="survivor"),
                NPC(name="ARIA", npc_type="corrupted"),
            ],
        )
        
        npc = scenario.get_npc("dr. smith")
        assert npc is not None
        assert npc.npc_type == "survivor"


class TestStateChanges:
    """Tests for StateChanges."""
    
    def test_default_values(self):
        """Test default state changes."""
        changes = StateChanges()
        
        assert changes.hp_change == 0
        assert len(changes.items_added) == 0
        assert changes.location_change is None
