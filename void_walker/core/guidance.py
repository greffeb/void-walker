"""
Void Walker - Player Guidance System.

Detects stuck/wandering players and generates contextual hints
to help them progress through the scenario.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from void_walker.core.state import GameState, NPC, Secret


# Thresholds for stagnation detection
STUCK_THRESHOLD = 5  # Turns without progress before player is considered stuck
WANDERING_THRESHOLD = 4  # Number of moves to check for circular movement
HINT_COOLDOWN = 3  # Minimum turns between hints of same type


class GuidanceSystem:
    """
    Detects stuck players and generates contextual hints.
    
    Uses moderate thresholds (5 turns) and injects hints directly
    into LLM narrative prompts for seamless player guidance.
    """
    
    def __init__(self, state: GameState) -> None:
        """
        Initialize guidance system with game state.
        
        Args:
            state: Current game state to analyze
        """
        self.state = state
    
    def is_stuck(self) -> bool:
        """
        Check if player is stuck (no progress for STUCK_THRESHOLD turns).
        
        Progress is defined as:
        - Moving to a new valid location
        - Completing an objective
        - Discovering a secret
        
        Returns:
            True if player has made no progress for threshold turns
        """
        return self.state.turns_since_progress >= STUCK_THRESHOLD
    
    def is_wandering(self) -> bool:
        """
        Check if player is wandering in circles.
        
        Detects when player visits only 2 or fewer unique locations
        in their last 4 moves, indicating aimless back-and-forth movement.
        
        Returns:
            True if player appears to be wandering without direction
        """
        history = self.state.location_history
        if len(history) < WANDERING_THRESHOLD:
            return False
        
        recent = history[-WANDERING_THRESHOLD:]
        unique_locations = set(recent)
        return len(unique_locations) <= 2
    
    def get_hint_level(self) -> int:
        """
        Determine appropriate hint intensity based on stagnation severity.
        
        Levels:
        - 0: No hint needed (player is making progress)
        - 1: Subtle hint (5-6 turns without progress)
        - 2: Moderate hint (7-8 turns without progress)
        - 3: Direct hint (9+ turns without progress)
        
        Returns:
            Hint level from 0 to 3
        """
        turns = self.state.turns_since_progress
        
        if turns < STUCK_THRESHOLD:
            return 0
        elif turns <= STUCK_THRESHOLD + 1:  # 5-6 turns
            return 1
        elif turns <= STUCK_THRESHOLD + 3:  # 7-8 turns
            return 2
        else:  # 9+ turns
            return 3
    
    def _get_nearby_npc_with_knowledge(self) -> NPC | None:
        """
        Find an NPC with useful knowledge, preferring those near player.
        
        Returns:
            NPC with knowledge, or None if none available
        """
        npcs = self.state.get_npcs_with_knowledge()
        if not npcs:
            return None
        
        # Prefer NPC in current location
        for npc in npcs:
            if npc.location == self.state.current_location:
                return npc
        
        # Otherwise return any NPC with knowledge
        return npcs[0]
    
    def _get_relevant_secret_hint(self) -> str | None:
        """
        Get a hint about an undiscovered secret.
        
        Prioritizes secrets in current location, then secrets
        related to victory condition.
        
        Returns:
            Hint text about a secret, or None
        """
        # First check current location
        local_secrets = self.state.get_undiscovered_secrets_in_location()
        if local_secrets:
            secret = local_secrets[0]
            return f"quelque chose à découvrir ici ({secret.discovery_method})"
        
        # Check for any undiscovered secrets
        for secret in self.state.scenario.secrets:
            if secret.id not in self.state.discovered_secrets:
                location = self.state.scenario.get_location(secret.location) if secret.location else None
                loc_name = location.name if location else "quelque part"
                return f"un secret à {loc_name}"
        
        return None
    
    def _get_dynamic_hint_content(self) -> dict:
        """
        Build dynamic hint content from scenario data.
        
        Pulls relevant information from NPCs, secrets, and victory
        condition to generate context-specific hints.
        
        Returns:
            Dict with keys: npc_hint, secret_hint, objective_hint, unvisited_exits
        """
        content = {
            "npc_hint": None,
            "secret_hint": None,
            "objective_hint": None,
            "unvisited_exits": [],
        }
        
        # Get unvisited exits
        content["unvisited_exits"] = self.state.get_unvisited_exits()
        
        # Get NPC hint
        npc = self._get_nearby_npc_with_knowledge()
        if npc:
            # Truncate knowledge if too long
            knowledge = npc.knowledge[:100] if npc.knowledge else ""
            content["npc_hint"] = {
                "name": npc.name,
                "knowledge": knowledge,
                "location": npc.location,
            }
        
        # Get secret hint
        content["secret_hint"] = self._get_relevant_secret_hint()
        
        # Get objective progress
        progress = self.state.get_objective_progress()
        if progress["missing_items"] or progress["missing_info"]:
            content["objective_hint"] = {
                "description": progress["victory_description"],
                "missing_items": progress["missing_items"],
                "missing_info": progress["missing_info"],
            }
        
        return content
    
    def build_hint_context(self) -> str:
        """
        Build the hint context string for LLM prompt injection.
        
        Returns French directive text based on hint level,
        using dynamic scenario content for specific hints.
        
        Returns:
            Hint context string to inject into gameplay prompt,
            or empty string if no hint needed
        """
        hint_level = self.get_hint_level()
        
        if hint_level == 0:
            return ""
        
        content = self._get_dynamic_hint_content()
        context_parts = ["\n🧭 PLAYER GUIDANCE (player seems lost):"]
        
        # Level 1: Subtle - just show unvisited locations
        if hint_level >= 1:
            unvisited = content["unvisited_exits"]
            if unvisited:
                context_parts.append(
                    f"- Unexplored accessible locations: {', '.join(unvisited)}"
                )
            
            if hint_level == 1:
                context_parts.append(
                    "DIRECTIVE: Subtly mention an interesting direction "
                    "or detail that draws attention toward an unvisited area."
                )
        
        # Level 2: Moderate - add NPC/secret hints
        if hint_level >= 2:
            if content["npc_hint"]:
                npc = content["npc_hint"]
                context_parts.append(
                    f"- NPC with useful info: {npc['name']} knows '{npc['knowledge']}'"
                )
            
            if content["secret_hint"]:
                context_parts.append(f"- Missed clue: {content['secret_hint']}")
            
            if hint_level == 2:
                context_parts.append(
                    "DIRECTIVE: Include a narrative element that guides the player "
                    "(suspicious noise, blinking light, partial radio message)."
                )
        
        # Level 3: Direct - explicit objective guidance
        if hint_level >= 3:
            if content["objective_hint"]:
                obj = content["objective_hint"]
                context_parts.append(f"- Objective: {obj['description']}")
                if obj["missing_items"]:
                    context_parts.append(
                        f"- Missing items: {', '.join(obj['missing_items'])}"
                    )
                if obj["missing_info"]:
                    context_parts.append(
                        f"- Missing information: {', '.join(obj['missing_info'])}"
                    )
            
            context_parts.append(
                "DIRECTIVE: An NPC, audio recording, emergency message or "
                "player flashback gives an EXPLICIT hint about what to do next. "
                "The player needs direct help to progress."
            )
        
        # Track that we delivered a hint
        hint_id = f"level{hint_level}_turn{self.state.turn_number}"
        if hint_id not in self.state.hints_delivered:
            self.state.hints_delivered.append(hint_id)
        
        return "\n".join(context_parts)
    
    def should_show_hint(self) -> bool:
        """
        Check if a hint should be shown this turn.
        
        Respects hint cooldown to avoid overwhelming player
        with constant hints.
        
        Returns:
            True if hint should be displayed
        """
        if not self.is_stuck():
            return False
        
        # Check cooldown - don't hint if we recently hinted
        if self.state.hints_delivered:
            last_hint = self.state.hints_delivered[-1]
            # Extract turn number from hint ID (format: levelN_turnM)
            try:
                last_turn = int(last_hint.split("_turn")[1])
                if self.state.turn_number - last_turn < HINT_COOLDOWN:
                    return False
            except (IndexError, ValueError):
                pass
        
        return True
