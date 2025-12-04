"""
Void Walker - Dice system.

D20-based resolution system with critical successes/failures.
"""

import random
from enum import Enum

from pydantic import BaseModel


class CheckResult(Enum):
    """Possible outcomes of a dice check."""
    
    CRITICAL_SUCCESS = "critical_success"
    SUCCESS = "success"
    FAILURE = "failure"
    CRITICAL_FAILURE = "critical_failure"


class DiceResult(BaseModel):
    """Complete result of a dice roll."""
    
    roll: int  # The raw d20 roll (1-20)
    stat: str  # Which stat was used (FOR, INT, CHA)
    stat_value: int  # The stat's value
    modifier: int  # Situational modifier
    difficulty: int  # Target difficulty
    total: int  # roll + stat_value + modifier
    outcome: CheckResult
    
    @property
    def is_success(self) -> bool:
        """Check if the roll was a success (including critical)."""
        return self.outcome in (CheckResult.SUCCESS, CheckResult.CRITICAL_SUCCESS)
    
    @property
    def is_critical(self) -> bool:
        """Check if the roll was a critical (success or failure)."""
        return self.outcome in (CheckResult.CRITICAL_SUCCESS, CheckResult.CRITICAL_FAILURE)
    
    def get_outcome_text(self, language: str = "fr") -> str:
        """Get localized outcome text."""
        if language == "fr":
            texts = {
                CheckResult.CRITICAL_SUCCESS: "SUCCÈS CRITIQUE !",
                CheckResult.SUCCESS: "SUCCÈS",
                CheckResult.FAILURE: "ÉCHEC",
                CheckResult.CRITICAL_FAILURE: "ÉCHEC CRITIQUE !",
            }
        else:
            texts = {
                CheckResult.CRITICAL_SUCCESS: "CRITICAL SUCCESS!",
                CheckResult.SUCCESS: "SUCCESS",
                CheckResult.FAILURE: "FAILURE",
                CheckResult.CRITICAL_FAILURE: "CRITICAL FAILURE!",
            }
        return texts[self.outcome]


def roll_d20() -> int:
    """Roll a d20 (1-20)."""
    return random.randint(1, 20)


def roll_check(
    stat_value: int,
    difficulty: int,
    modifier: int = 0,
    stat: str = "FOR",
) -> DiceResult:
    """
    Perform a skill check.
    
    Args:
        stat_value: The relevant stat value (1-5)
        difficulty: Target number to meet or exceed (1-20)
        modifier: Situational modifier (-5 to +5)
        stat: Which stat is being used (FOR, INT, CHA)
    
    Returns:
        DiceResult with complete roll information
    """
    base_roll = roll_d20()
    total = base_roll + stat_value + modifier
    
    # Determine outcome
    if base_roll == 1:
        outcome = CheckResult.CRITICAL_FAILURE
    elif base_roll == 20:
        outcome = CheckResult.CRITICAL_SUCCESS
    elif total >= difficulty:
        outcome = CheckResult.SUCCESS
    else:
        outcome = CheckResult.FAILURE
    
    return DiceResult(
        roll=base_roll,
        stat=stat,
        stat_value=stat_value,
        modifier=modifier,
        difficulty=difficulty,
        total=total,
        outcome=outcome,
    )


def calculate_modifier(
    items: list[str] | None = None,
    conditions: list[str] | None = None,
    environmental: list[str] | None = None,
) -> int:
    """
    Calculate total modifier from various sources.
    
    This is a simplified version - the LLM actually determines
    the modifier based on context.
    
    Args:
        items: Items that might provide bonuses
        conditions: Player conditions (wounded, tired, etc.)
        environmental: Environmental factors (dark, zero-g, etc.)
    
    Returns:
        Total modifier clamped to -5 to +5
    """
    modifier = 0
    
    # Items could provide bonuses (simplified)
    if items:
        modifier += min(len(items), 2)
    
    # Conditions provide penalties (simplified)
    if conditions:
        modifier -= min(len(conditions), 3)
    
    # Environmental factors (simplified)
    if environmental:
        # Could be positive or negative depending on context
        pass
    
    # Clamp to valid range
    return max(-5, min(5, modifier))


def describe_difficulty(difficulty: int) -> str:
    """Get French description of difficulty level."""
    if difficulty <= 5:
        return "Trivial"
    elif difficulty <= 8:
        return "Facile"
    elif difficulty <= 12:
        return "Moyen"
    elif difficulty <= 15:
        return "Difficile"
    elif difficulty <= 18:
        return "Très difficile"
    else:
        return "Presque impossible"


def get_stat_name(stat: str, language: str = "fr") -> str:
    """Get full stat name."""
    if language == "fr":
        names = {
            "FOR": "Force",
            "INT": "Intelligence",
            "CHA": "Charisme",
        }
    else:
        names = {
            "FOR": "Strength",
            "INT": "Intelligence",
            "CHA": "Charisma",
        }
    return names.get(stat.upper(), stat)
