"""Tests for the option generator module."""

import pytest

from void_walker.llm.option_generator import (
    FALLBACK_OPTIONS,
    GenerationOptions,
    format_options_for_prompt,
    select_options,
)


class TestFallbackOptions:
    """Test the predefined fallback options."""
    
    def test_fallback_has_all_categories(self):
        """Verify all required categories exist."""
        required = ["locations", "threats", "npc_types", "clue_types", "item_types", "atmosphere_elements"]
        for category in required:
            assert category in FALLBACK_OPTIONS, f"Missing category: {category}"
    
    def test_locations_count(self):
        """Verify we have at least 100 locations."""
        assert len(FALLBACK_OPTIONS["locations"]) >= 100, "Should have at least 100 locations"
    
    def test_threats_count(self):
        """Verify we have at least 60 threats."""
        assert len(FALLBACK_OPTIONS["threats"]) >= 60, "Should have at least 60 threats"
    
    def test_npc_types_count(self):
        """Verify we have at least 40 NPC types."""
        assert len(FALLBACK_OPTIONS["npc_types"]) >= 40, "Should have at least 40 NPC types"
    
    def test_clue_types_count(self):
        """Verify we have at least 40 clue types."""
        assert len(FALLBACK_OPTIONS["clue_types"]) >= 40, "Should have at least 40 clue types"
    
    def test_locations_are_unique(self):
        """Verify all locations are unique."""
        locations = FALLBACK_OPTIONS["locations"]
        assert len(locations) == len(set(locations)), "Locations should be unique"
    
    def test_threats_are_unique(self):
        """Verify all threats are unique."""
        threats = FALLBACK_OPTIONS["threats"]
        assert len(threats) == len(set(threats)), "Threats should be unique"


class TestSelectOptions:
    """Test the select_options function."""
    
    def test_select_from_fallback(self):
        """Test selecting options from fallback pool."""
        options = select_options()
        
        assert len(options.locations) == 5
        assert len(options.threats) == 5
        assert len(options.npc_types) == 5
        assert len(options.clue_types) == 5
        assert len(options.item_types) == 4
        assert len(options.atmosphere_elements) == 4
    
    def test_select_custom_counts(self):
        """Test selecting custom number of options."""
        options = select_options(
            num_locations=3,
            num_threats=2,
            num_npc_types=2,
            num_clue_types=3,
            num_item_types=2,
            num_atmosphere=2,
        )
        
        assert len(options.locations) == 3
        assert len(options.threats) == 2
        assert len(options.npc_types) == 2
        assert len(options.clue_types) == 3
        assert len(options.item_types) == 2
        assert len(options.atmosphere_elements) == 2
    
    def test_select_randomness(self):
        """Test that selections are random (not always the same)."""
        options1 = select_options()
        options2 = select_options()
        
        # Very unlikely to get the same selections twice
        # (at least one category should differ)
        all_same = (
            options1.locations == options2.locations and
            options1.threats == options2.threats and
            options1.npc_types == options2.npc_types
        )
        # This could theoretically fail, but the probability is astronomically low
        assert not all_same, "Two random selections should differ"
    
    def test_select_from_custom_pool(self):
        """Test selecting from a custom pool."""
        custom_pool = {
            "locations": ["loc_a", "loc_b", "loc_c"],
            "threats": ["threat_a", "threat_b"],
            "npc_types": ["npc_a", "npc_b"],
            "clue_types": ["clue_a"],
            "item_types": ["item_a"],
            "atmosphere_elements": ["atmo_a"],
        }
        
        options = select_options(
            pool=custom_pool,
            num_locations=2,
            num_threats=1,
            num_npc_types=1,
            num_clue_types=1,
            num_item_types=1,
            num_atmosphere=1,
        )
        
        assert len(options.locations) == 2
        assert all(loc in custom_pool["locations"] for loc in options.locations)


class TestGenerationOptions:
    """Test the GenerationOptions dataclass."""
    
    def test_to_dict(self):
        """Test serialization to dict."""
        options = GenerationOptions(
            locations=["loc1", "loc2"],
            threats=["threat1"],
            npc_types=["npc1"],
            clue_types=["clue1"],
            item_types=["item1"],
            atmosphere_elements=["atmo1"],
        )
        
        data = options.to_dict()
        
        assert data["locations"] == ["loc1", "loc2"]
        assert data["threats"] == ["threat1"]
    
    def test_from_dict(self):
        """Test deserialization from dict."""
        data = {
            "locations": ["loc1", "loc2"],
            "threats": ["threat1"],
            "npc_types": ["npc1"],
            "clue_types": ["clue1"],
            "item_types": ["item1"],
            "atmosphere_elements": ["atmo1"],
        }
        
        options = GenerationOptions.from_dict(data)
        
        assert options.locations == ["loc1", "loc2"]
        assert options.threats == ["threat1"]
    
    def test_from_dict_missing_keys(self):
        """Test deserialization handles missing keys."""
        data = {"locations": ["loc1"]}
        
        options = GenerationOptions.from_dict(data)
        
        assert options.locations == ["loc1"]
        assert options.threats == []


class TestFormatOptionsForPrompt:
    """Test the format_options_for_prompt function."""
    
    def test_format_includes_all_categories(self):
        """Test that formatted output includes all categories."""
        options = GenerationOptions(
            locations=["space_station", "asteroid_mine"],
            threats=["alien_parasite", "rogue_ai"],
            npc_types=["survivor", "android"],
            clue_types=["datapad", "audio_log"],
            item_types=["plasma_cutter", "medkit"],
            atmosphere_elements=["flickering_lights", "distant_screams"],
        )
        
        formatted = format_options_for_prompt(options)
        
        assert "SETTING" in formatted
        assert "space_station" in formatted
        assert "MAIN THREAT" in formatted
        assert "alien_parasite" in formatted
        assert "NPC TYPES" in formatted
        assert "survivor" in formatted
        assert "CLUE/EVIDENCE" in formatted
        assert "datapad" in formatted
        assert "SPECIAL ITEMS" in formatted
        assert "plasma_cutter" in formatted
        assert "ATMOSPHERE" in formatted
        assert "flickering_lights" in formatted
    
    def test_format_has_constraint_instruction(self):
        """Test that formatted output indicates mandatory vs suggested elements."""
        options = select_options()
        formatted = format_options_for_prompt(options)
        
        assert "MANDATORY" in formatted
        assert "SUGGESTED" in formatted
        assert "feel free to invent" in formatted
