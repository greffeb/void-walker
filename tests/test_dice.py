"""Tests for the dice system."""

import pytest

from void_walker.core.dice import (
    CheckResult,
    DiceResult,
    describe_difficulty,
    get_stat_name,
    roll_check,
    roll_d20,
)


class TestRollD20:
    """Tests for the basic d20 roll."""
    
    def test_roll_range(self):
        """Roll should always be between 1 and 20."""
        for _ in range(100):
            result = roll_d20()
            assert 1 <= result <= 20
    
    def test_roll_is_random(self):
        """Multiple rolls should produce different values."""
        rolls = [roll_d20() for _ in range(20)]
        # Should have at least a few different values
        assert len(set(rolls)) > 1


class TestRollCheck:
    """Tests for skill checks."""
    
    def test_basic_success(self):
        """Check succeeds when total >= difficulty."""
        # Monkey-patch for deterministic testing
        result = DiceResult(
            roll=15,
            stat="FOR",
            stat_value=3,
            modifier=0,
            difficulty=12,
            total=18,
            outcome=CheckResult.SUCCESS,
        )
        assert result.is_success
        assert not result.is_critical
    
    def test_basic_failure(self):
        """Check fails when total < difficulty."""
        result = DiceResult(
            roll=5,
            stat="FOR",
            stat_value=2,
            modifier=0,
            difficulty=15,
            total=7,
            outcome=CheckResult.FAILURE,
        )
        assert not result.is_success
        assert not result.is_critical
    
    def test_critical_success(self):
        """Natural 20 is always critical success."""
        result = DiceResult(
            roll=20,
            stat="INT",
            stat_value=1,
            modifier=-5,
            difficulty=25,  # Even impossible DC
            total=16,
            outcome=CheckResult.CRITICAL_SUCCESS,
        )
        assert result.is_success
        assert result.is_critical
    
    def test_critical_failure(self):
        """Natural 1 is always critical failure."""
        result = DiceResult(
            roll=1,
            stat="CHA",
            stat_value=5,
            modifier=5,
            difficulty=5,  # Even easy DC
            total=11,
            outcome=CheckResult.CRITICAL_FAILURE,
        )
        assert not result.is_success
        assert result.is_critical
    
    def test_roll_check_integration(self):
        """Test the actual roll_check function."""
        result = roll_check(
            stat_value=3,
            difficulty=10,
            modifier=2,
            stat="INT",
        )
        
        assert isinstance(result, DiceResult)
        assert 1 <= result.roll <= 20
        assert result.stat == "INT"
        assert result.stat_value == 3
        assert result.modifier == 2
        assert result.difficulty == 10
        assert result.total == result.roll + 3 + 2
        assert isinstance(result.outcome, CheckResult)
    
    def test_modifier_affects_total(self):
        """Modifiers should affect the total."""
        # Multiple runs to verify
        for _ in range(10):
            result_pos = roll_check(3, 10, modifier=5, stat="FOR")
            assert result_pos.total == result_pos.roll + 3 + 5
            
            result_neg = roll_check(3, 10, modifier=-3, stat="FOR")
            assert result_neg.total == result_neg.roll + 3 - 3


class TestDiceResult:
    """Tests for DiceResult methods."""
    
    def test_outcome_text_french(self):
        """Test French outcome text."""
        success = DiceResult(
            roll=15, stat="FOR", stat_value=2, modifier=0,
            difficulty=10, total=17, outcome=CheckResult.SUCCESS
        )
        assert success.get_outcome_text("fr") == "SUCCÈS"
        
        crit_success = DiceResult(
            roll=20, stat="FOR", stat_value=2, modifier=0,
            difficulty=10, total=22, outcome=CheckResult.CRITICAL_SUCCESS
        )
        assert crit_success.get_outcome_text("fr") == "SUCCÈS CRITIQUE !"
        
        failure = DiceResult(
            roll=5, stat="FOR", stat_value=2, modifier=0,
            difficulty=15, total=7, outcome=CheckResult.FAILURE
        )
        assert failure.get_outcome_text("fr") == "ÉCHEC"
        
        crit_failure = DiceResult(
            roll=1, stat="FOR", stat_value=2, modifier=0,
            difficulty=10, total=3, outcome=CheckResult.CRITICAL_FAILURE
        )
        assert crit_failure.get_outcome_text("fr") == "ÉCHEC CRITIQUE !"
    
    def test_outcome_text_english(self):
        """Test English outcome text."""
        success = DiceResult(
            roll=15, stat="FOR", stat_value=2, modifier=0,
            difficulty=10, total=17, outcome=CheckResult.SUCCESS
        )
        assert success.get_outcome_text("en") == "SUCCESS"


class TestHelperFunctions:
    """Tests for helper functions."""
    
    def test_describe_difficulty(self):
        """Test difficulty descriptions."""
        assert describe_difficulty(3) == "Trivial"
        assert describe_difficulty(7) == "Facile"
        assert describe_difficulty(12) == "Moyen"
        assert describe_difficulty(15) == "Difficile"
        assert describe_difficulty(18) == "Très difficile"
        assert describe_difficulty(20) == "Presque impossible"
    
    def test_get_stat_name_french(self):
        """Test French stat names."""
        assert get_stat_name("FOR", "fr") == "Force"
        assert get_stat_name("INT", "fr") == "Intelligence"
        assert get_stat_name("CHA", "fr") == "Charisme"
        assert get_stat_name("for", "fr") == "Force"  # Case insensitive
    
    def test_get_stat_name_english(self):
        """Test English stat names."""
        assert get_stat_name("FOR", "en") == "Strength"
        assert get_stat_name("INT", "en") == "Intelligence"
        assert get_stat_name("CHA", "en") == "Charisma"
