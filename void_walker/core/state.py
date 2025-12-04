"""
Void Walker - Core state management module.

Contains all Pydantic models for game state: Player, Inventory, Scenario, etc.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# Item types
ItemType = Literal["weapon", "tool", "consumable", "key_item", "data", "misc"]


class InventoryItem(BaseModel):
    """A single item in the player's inventory."""
    
    id: str | None = None  # Unique identifier for key items
    name: str
    description: str | None = None
    item_type: ItemType = "misc"
    uses: int | None = None  # None = unlimited, number = consumable
    stat_bonus: dict[str, int] = Field(default_factory=dict)  # e.g., {"INT": 2}
    
    def use(self) -> bool:
        """Use the item. Returns False if item is depleted."""
        if self.uses is None:
            return True
        if self.uses > 0:
            self.uses -= 1
            return True
        return False
    
    @property
    def is_depleted(self) -> bool:
        """Check if consumable item is depleted."""
        return self.uses is not None and self.uses <= 0


class Inventory(BaseModel):
    """Player's inventory with slot management."""
    
    items: list[InventoryItem] = Field(default_factory=list)
    max_slots: int = 8
    
    def add(self, item: InventoryItem) -> bool:
        """Add an item. Returns False if inventory is full."""
        if len(self.items) >= self.max_slots:
            return False
        self.items.append(item)
        return True
    
    def remove(self, item_name: str) -> InventoryItem | None:
        """Remove and return an item by name."""
        for i, item in enumerate(self.items):
            if item.name.lower() == item_name.lower():
                return self.items.pop(i)
        return None
    
    def get(self, item_name: str) -> InventoryItem | None:
        """Get an item by name without removing it."""
        for item in self.items:
            if item.name.lower() == item_name.lower():
                return item
        return None
    
    def has(self, item_name: str) -> bool:
        """Check if player has an item."""
        return self.get(item_name) is not None
    
    @property
    def count(self) -> int:
        """Number of items in inventory."""
        return len(self.items)
    
    @property
    def is_full(self) -> bool:
        """Check if inventory is full."""
        return len(self.items) >= self.max_slots


class StatProgression(BaseModel):
    """Tracks experience towards stat increases."""
    
    for_xp: int = 0  # Successes until next FOR increase
    int_xp: int = 0
    cha_xp: int = 0
    xp_threshold: int = 10
    
    def add_xp(self, stat: str, amount: int = 1) -> bool:
        """
        Add XP to a stat. Returns True if stat should increase.
        """
        stat = stat.upper()
        if stat == "FOR":
            self.for_xp += amount
            if self.for_xp >= self.xp_threshold:
                self.for_xp = 0
                return True
        elif stat == "INT":
            self.int_xp += amount
            if self.int_xp >= self.xp_threshold:
                self.int_xp = 0
                return True
        elif stat == "CHA":
            self.cha_xp += amount
            if self.cha_xp >= self.xp_threshold:
                self.cha_xp = 0
                return True
        return False


class Player(BaseModel):
    """Player character state."""
    
    name: str
    class_name: str
    stats: dict[str, int] = Field(default_factory=lambda: {"FOR": 2, "INT": 2, "CHA": 2})
    hp: int = 10
    max_hp: int = 10
    inventory: Inventory = Field(default_factory=Inventory)
    stat_progress: StatProgression = Field(default_factory=StatProgression)
    
    def take_damage(self, amount: int, source: str = "unknown") -> str:
        """Apply damage to player. Returns status message."""
        self.hp = max(0, self.hp - amount)
        if self.hp == 0:
            return f"MORT: {source}"
        return f"-{amount} HP ({source})"
    
    def heal(self, amount: int) -> int:
        """Heal player. Returns actual amount healed."""
        old_hp = self.hp
        self.hp = min(self.max_hp, self.hp + amount)
        return self.hp - old_hp
    
    @property
    def is_dead(self) -> bool:
        """Check if player is dead."""
        return self.hp <= 0
    
    def get_stat(self, stat: str) -> int:
        """Get a stat value, including any item bonuses."""
        base = self.stats.get(stat.upper(), 0)
        bonus = sum(
            item.stat_bonus.get(stat.upper(), 0) 
            for item in self.inventory.items
        )
        return base + bonus
    
    def increase_stat(self, stat: str, amount: int = 1) -> bool:
        """Increase a stat. Returns False if already at max (5)."""
        stat = stat.upper()
        if stat in self.stats and self.stats[stat] < 5:
            self.stats[stat] = min(5, self.stats[stat] + amount)
            return True
        return False


class NPC(BaseModel):
    """Non-player character."""
    
    id: str | None = None  # Unique identifier
    name: str
    npc_type: str = "survivor"  # survivor, android, hostile, corrupted, creature, or LLM-generated
    location: str | None = None
    patrol_area: list[str] | None = None  # Locations they move between
    description: str = ""
    knowledge: str | None = ""  # What they know that might help the player (can be null)
    has_item: str | None = None  # Item ID they carry
    disposition: str = "neutral"  # friendly, fearful, neutral, hostile, unpredictable
    trigger_condition: str | None = None  # What makes them attack/help/flee
    weakness: str | None = None  # How they can be defeated/avoided
    can_be_neutralized: bool = True  # Whether they can be dealt with non-lethally
    is_alive: bool = True


class Secret(BaseModel):
    """A discoverable secret in the scenario."""
    
    id: str
    description: str
    location: str | None = None
    discovery_method: str = "search"  # How to find it (search, examine, hack, etc.)
    discovered: bool = False
    revelation: str = ""  # What the player learns when discovering this
    unlocks: str | None = None  # What this enables (new area, NPC trust, item use, etc.)


class Location(BaseModel):
    """A location in the game world."""
    
    id: str
    name: str
    description: str
    connections: list[str] = Field(default_factory=list)  # IDs of connected locations
    danger_level: int = 1  # 1-10 danger rating
    items: list[InventoryItem] = Field(default_factory=list)
    threats: list[str] = Field(default_factory=list)
    secrets: list[str] = Field(default_factory=list)  # Secret IDs
    is_dead_end: bool = False  # True if only one connection
    required_for_victory: bool = False  # True if must visit to win
    visited: bool = False


class VictoryCondition(BaseModel):
    """Structured victory condition for a scenario."""
    
    description: str  # What the player must do to win
    required_items: list[str] = Field(default_factory=list)  # Item IDs needed
    required_info: list[str] = Field(default_factory=list)  # Knowledge/codes needed
    required_location: str | None = None  # Where victory is achieved
    alternative_approach: str | None = None  # Different valid way to win


class EnvironmentalClue(BaseModel):
    """An environmental clue that provides atmosphere and hints."""
    
    type: str = "physical_evidence"  # datapad, wall_message, audio_log, physical_evidence
    location: str | None = None
    content: str  # The actual text/description


class ScenarioValidation(BaseModel):
    """Validation data for scenario coherence."""
    
    critical_path: list[str] = Field(default_factory=list)  # Location sequence to victory
    required_checks: list[str] = Field(default_factory=list)  # Mandatory skill checks
    estimated_difficulty: str = "medium"  # easy, medium, hard
    dead_end_justification: dict[str, str] = Field(default_factory=dict)  # Why dead-ends are worth it


class Scenario(BaseModel):
    """A generated game scenario."""
    
    title: str
    setting_type: str  # e.g., "derelict_ship"
    setting_name: str  # e.g., "USS Prometheus"
    premise: str  # 2-3 sentence setup
    main_threat: str
    threat_description: str = ""
    victory_condition: str | VictoryCondition  # String for backwards compat, or structured
    starting_location: str
    locations: list[Location] = Field(default_factory=list)
    npcs: list[NPC] = Field(default_factory=list)
    secrets: list[Secret] = Field(default_factory=list)
    environmental_clues: list[str | EnvironmentalClue] = Field(default_factory=list)
    validation: ScenarioValidation | None = None  # Optional validation data
    
    def get_location(self, location_id: str) -> Location | None:
        """Get a location by ID."""
        for loc in self.locations:
            if loc.id == location_id:
                return loc
        return None
    
    def get_npc(self, name: str) -> NPC | None:
        """Get an NPC by name."""
        for npc in self.npcs:
            if npc.name.lower() == name.lower():
                return npc
        return None
    
    def get_npc_by_id(self, npc_id: str) -> NPC | None:
        """Get an NPC by ID."""
        for npc in self.npcs:
            if npc.id == npc_id:
                return npc
        return None
    
    def get_victory_description(self) -> str:
        """Get victory condition as a string."""
        if isinstance(self.victory_condition, VictoryCondition):
            return self.victory_condition.description
        return self.victory_condition


class SessionProgress(BaseModel):
    """Tracks progress through the game session."""
    
    current_scene: int = 0
    total_scenes: int = 15
    story_beat: Literal["intro", "rising", "midpoint", "escalation", "climax", "resolution"] = "intro"
    objectives_completed: list[str] = Field(default_factory=list)
    secrets_found: int = 0
    enemies_defeated: int = 0
    
    def advance_scene(self) -> None:
        """Advance to next scene and update story beat."""
        self.current_scene += 1
        self.story_beat = self._calculate_beat()
    
    def maybe_advance_scene(
        self,
        new_valid_location: bool = False,
        objective_completed: bool = False,
        secret_found: bool = False,
    ) -> bool:
        """
        Conditionally advance scene based on meaningful events.
        
        Only advances if at least one significant event occurred:
        - Player moved to a new valid location (not hallucinated)
        - An objective was completed
        - A secret was discovered
        
        Returns:
            True if scene was advanced, False otherwise
        """
        if new_valid_location or objective_completed or secret_found:
            self.advance_scene()
            return True
        return False
    
    def _calculate_beat(self) -> Literal["intro", "rising", "midpoint", "escalation", "climax", "resolution"]:
        """Determine story beat based on progress percentage."""
        if self.current_scene >= self.total_scenes:
            return "resolution"
        
        progress_pct = self.current_scene / self.total_scenes
        
        if progress_pct < 0.10:
            return "intro"
        elif progress_pct < 0.45:
            return "rising"
        elif progress_pct < 0.55:
            return "midpoint"
        elif progress_pct < 0.85:
            return "escalation"
        else:
            return "climax"
    
    @property
    def scenes_remaining(self) -> int:
        """Number of scenes remaining."""
        return max(0, self.total_scenes - self.current_scene)


class SessionScore(BaseModel):
    """End-game scoring."""
    
    secrets_found: int = 0
    creative_solutions: int = 0
    enemies_defeated: int = 0
    hp_remaining: int = 0
    items_collected: int = 0
    objectives_completed: int = 0
    total_turns: int = 0
    ending_type: str = "defeat"
    
    def calculate_total(self) -> int:
        """Calculate final score."""
        base = self.objectives_completed * 100
        bonus = (
            self.secrets_found * 25 +
            self.creative_solutions * 50 +
            self.enemies_defeated * 15 +
            self.hp_remaining * 10 +
            self.items_collected * 5
        )
        multiplier = {"victory": 1.5, "escape": 1.2, "defeat": 0.5, "mystery_solved": 1.3}.get(
            self.ending_type, 1.0
        )
        return int((base + bonus) * multiplier)


class StateChanges(BaseModel):
    """Changes to apply to game state after a turn."""
    
    hp_change: int = 0
    items_added: list[InventoryItem] = Field(default_factory=list)
    items_removed: list[str] = Field(default_factory=list)
    location_change: str | None = None
    secrets_discovered: list[str] = Field(default_factory=list)
    npcs_updated: list[dict] = Field(default_factory=list)
    objective_completed: str | None = None
    enemy_defeated: bool = False
    creative_solution: bool = False


class GameResponse(BaseModel):
    """Parsed response from the LLM for a game turn."""
    
    narrative: str  # French, 2-4 sentences
    action_type: Literal["exploration", "interaction", "combat", "skill_check", "dialogue"]
    requires_roll: bool = False
    difficulty: int | None = None  # 1-20 if requires_roll
    relevant_stat: Literal["FOR", "INT", "CHA"] | None = None
    suggested_modifier: int = 0  # -5 to +5
    state_changes: StateChanges = Field(default_factory=StateChanges)
    scene_elements: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)  # 2-3 action suggestions
    tension_level: int = 5  # 1-10
    is_ending: bool = False
    ending_type: Literal["victory", "defeat", "escape", "mystery_solved"] | None = None


class GameState(BaseModel):
    """Complete game state."""
    
    # Session info
    session_id: str
    session_config: str = "standard"  # "quick", "standard", "extended"
    started_at: datetime = Field(default_factory=datetime.now)
    
    # Player
    player: Player
    
    # World
    scenario: Scenario
    current_location: str
    visited_locations: set[str] = Field(default_factory=set)
    discovered_secrets: list[str] = Field(default_factory=list)
    
    # Hallucinated locations (LLM-invented, not in scenario)
    hallucinated_locations: set[str] = Field(default_factory=set)
    current_hallucinated_location: str | None = None  # Set when in a hallucinated zone
    last_valid_location: str | None = None  # For returning from hallucinated zones
    
    # Progress
    progress: SessionProgress = Field(default_factory=SessionProgress)
    turn_number: int = 0
    
    # History (for context)
    recent_events: list[str] = Field(default_factory=list)  # Last 10 narrations, summarized
    key_npcs_met: list[str] = Field(default_factory=list)  # NPC names
    important_items_found: list[str] = Field(default_factory=list)
    
    # Meta
    tension_level: int = 3  # 1-10, affects narration tone
    active_threats: list[str] = Field(default_factory=list)
    available_exits: list[str] = Field(default_factory=list)
    
    model_config = {"arbitrary_types_allowed": True}
    
    def add_event(self, event: str, max_events: int = 10) -> None:
        """Add a recent event, keeping only the last N events."""
        self.recent_events.append(event)
        if len(self.recent_events) > max_events:
            self.recent_events = self.recent_events[-max_events:]
    
    def visit_location(self, location_id: str) -> bool:
        """
        Mark a location as visited.
        
        Returns:
            True if this is a valid location, False if hallucinated
        """
        # Check if this is a valid location in the scenario
        location = self.scenario.get_location(location_id)
        
        if location:
            # Valid location - clear any hallucination state
            self.current_hallucinated_location = None
            self.last_valid_location = location_id
            self.visited_locations.add(location_id)
            self.current_location = location_id
            location.visited = True
            self.available_exits = location.connections
            return True
        else:
            # Hallucinated location - track it but don't update exits
            self.hallucinated_locations.add(location_id)
            self.current_hallucinated_location = location_id
            # Save last valid location if not already saved
            if self.last_valid_location is None:
                self.last_valid_location = self.current_location
            self.current_location = location_id
            # Keep available_exits unchanged so player can go back
            return False
    
    @property
    def is_in_hallucinated_location(self) -> bool:
        """Check if player is currently in a hallucinated (non-existent) location."""
        return self.current_hallucinated_location is not None
    
    def apply_state_changes(self, changes: StateChanges) -> tuple[list[str], bool, bool, bool]:
        """
        Apply state changes and return messages plus event flags.
        
        Returns:
            Tuple of (messages, new_valid_location, objective_completed, secret_found)
        """
        messages = []
        new_valid_location = False
        objective_completed = False
        secret_found = False
        
        # HP changes
        if changes.hp_change != 0:
            if changes.hp_change < 0:
                msg = self.player.take_damage(-changes.hp_change)
                messages.append(msg)
            else:
                healed = self.player.heal(changes.hp_change)
                if healed > 0:
                    messages.append(f"+{healed} HP")
        
        # Items added
        for item in changes.items_added:
            if self.player.inventory.add(item):
                messages.append(f"Obtenu: {item.name}")
                self.important_items_found.append(item.name)
            else:
                messages.append(f"Inventaire plein, impossible de prendre: {item.name}")
        
        # Items removed
        for item_name in changes.items_removed:
            if self.player.inventory.remove(item_name):
                messages.append(f"Perdu: {item_name}")
        
        # Location change
        if changes.location_change:
            was_valid = self.visit_location(changes.location_change)
            if was_valid:
                new_valid_location = True
                messages.append(f"Déplacement: {changes.location_change}")
            else:
                messages.append(f"[Zone non cartographiée: {changes.location_change}]")
        
        # Secrets discovered
        for secret_id in changes.secrets_discovered:
            if secret_id not in self.discovered_secrets:
                self.discovered_secrets.append(secret_id)
                self.progress.secrets_found += 1
                secret_found = True
                messages.append("Secret découvert!")
        
        # Objective completed
        if changes.objective_completed:
            if changes.objective_completed not in self.progress.objectives_completed:
                self.progress.objectives_completed.append(changes.objective_completed)
                objective_completed = True
                messages.append(f"Objectif accompli: {changes.objective_completed}")
        
        # Enemy defeated
        if changes.enemy_defeated:
            self.progress.enemies_defeated += 1
        
        # Creative solution
        if changes.creative_solution:
            messages.append("Solution créative!")
        
        return messages, new_valid_location, objective_completed, secret_found
