"""Tests for response parsing."""

import pytest

from void_walker.core.state import GameResponse, SessionProgress
from void_walker.llm.client import extract_json
from void_walker.llm.parser import (
    parse_game_response,
    summarize_narrative,
    validate_game_response,
    ParseError,
)


class TestExtractJson:
    """Tests for JSON extraction."""
    
    def test_extract_pure_json(self):
        """Test extracting pure JSON."""
        text = '{"key": "value", "number": 42}'
        result = extract_json(text)
        
        assert result is not None
        assert result["key"] == "value"
        assert result["number"] == 42
    
    def test_extract_json_with_markdown(self):
        """Test extracting JSON from markdown code block."""
        text = '''Here is the response:
```json
{"narrative": "Test narrative", "action_type": "exploration"}
```
That's all.'''
        
        result = extract_json(text)
        assert result is not None
        assert result["narrative"] == "Test narrative"
    
    def test_extract_json_with_text_around(self):
        """Test extracting JSON from text with preamble."""
        text = 'Here is my response: {"data": "test"} and some more text'
        result = extract_json(text)
        
        assert result is not None
        assert result["data"] == "test"
    
    def test_extract_nested_json(self):
        """Test extracting nested JSON."""
        text = '{"outer": {"inner": "value"}, "list": [1, 2, 3]}'
        result = extract_json(text)
        
        assert result is not None
        assert result["outer"]["inner"] == "value"
        assert result["list"] == [1, 2, 3]
    
    def test_extract_invalid_json(self):
        """Test handling invalid JSON."""
        text = "This is not JSON at all"
        result = extract_json(text)
        
        assert result is None
    
    def test_extract_malformed_json(self):
        """Test handling malformed JSON."""
        text = '{"key": "value"'  # Missing closing brace
        result = extract_json(text)
        
        assert result is None


class TestParseGameResponse:
    """Tests for game response parsing."""
    
    def test_parse_valid_response(self):
        """Test parsing a valid game response."""
        json_text = '''{
            "narrative": "Vous examinez le couloir sombre.",
            "action_type": "exploration",
            "requires_roll": false,
            "difficulty": null,
            "relevant_stat": null,
            "suggested_modifier": 0,
            "state_changes": {
                "hp_change": 0,
                "items_added": [],
                "items_removed": [],
                "location_change": null
            },
            "scene_elements": ["couloir", "portes"],
            "suggestions": ["examiner les portes", "avancer"],
            "tension_level": 4,
            "is_ending": false,
            "ending_type": null
        }'''
        
        response = parse_game_response(json_text)
        
        assert isinstance(response, GameResponse)
        assert response.narrative == "Vous examinez le couloir sombre."
        assert response.action_type == "exploration"
        assert not response.requires_roll
        assert response.tension_level == 4
    
    def test_parse_response_with_roll(self):
        """Test parsing response requiring a roll."""
        json_text = '''{
            "narrative": "Vous tentez de pirater le terminal.",
            "action_type": "skill_check",
            "requires_roll": true,
            "difficulty": 15,
            "relevant_stat": "INT",
            "suggested_modifier": 2,
            "state_changes": {},
            "scene_elements": [],
            "suggestions": [],
            "tension_level": 6,
            "is_ending": false,
            "ending_type": null
        }'''
        
        response = parse_game_response(json_text)
        
        assert response.requires_roll
        assert response.difficulty == 15
        assert response.relevant_stat == "INT"
        assert response.suggested_modifier == 2
    
    def test_parse_response_with_items(self):
        """Test parsing response with item changes."""
        json_text = '''{
            "narrative": "Vous trouvez une trousse médicale.",
            "action_type": "exploration",
            "requires_roll": false,
            "state_changes": {
                "items_added": [
                    {"name": "Trousse médicale", "item_type": "consumable", "uses": 3}
                ]
            },
            "scene_elements": [],
            "suggestions": [],
            "tension_level": 3,
            "is_ending": false
        }'''
        
        response = parse_game_response(json_text)
        
        assert len(response.state_changes.items_added) == 1
        assert response.state_changes.items_added[0].name == "Trousse médicale"
        assert response.state_changes.items_added[0].uses == 3
    
    def test_parse_invalid_response(self):
        """Test handling invalid response."""
        with pytest.raises(ParseError):
            parse_game_response("Not valid JSON at all")


class TestValidateGameResponse:
    """Tests for response validation."""
    
    def test_prevent_premature_ending(self):
        """Test that premature endings are prevented."""
        response = GameResponse(
            narrative="Test",
            action_type="exploration",
            is_ending=True,
            ending_type="victory",
            tension_level=5,
        )
        
        progress = SessionProgress(total_scenes=20, current_scene=5)
        progress.story_beat = "rising"
        
        validated = validate_game_response(response, progress)
        
        # Should have removed the ending
        assert not validated.is_ending
        assert validated.ending_type is None
    
    def test_allow_ending_in_climax(self):
        """Test that endings are allowed in climax."""
        response = GameResponse(
            narrative="Test",
            action_type="exploration",
            is_ending=True,
            ending_type="victory",
            tension_level=9,
        )
        
        progress = SessionProgress(total_scenes=20, current_scene=18)
        progress.story_beat = "climax"
        
        validated = validate_game_response(response, progress)
        
        assert validated.is_ending
        assert validated.ending_type == "victory"
    
    def test_force_ending_at_end(self):
        """Test that ending is forced when scenes run out."""
        response = GameResponse(
            narrative="Test",
            action_type="exploration",
            is_ending=False,
            tension_level=5,
        )
        
        progress = SessionProgress(total_scenes=10, current_scene=11)
        
        validated = validate_game_response(response, progress)
        
        assert validated.is_ending
        assert validated.ending_type == "escape"  # Default
    
    def test_clamp_tension_to_beat(self):
        """Test that tension is clamped to appropriate range."""
        response = GameResponse(
            narrative="Test",
            action_type="exploration",
            tension_level=10,  # Too high for intro
        )
        
        progress = SessionProgress(total_scenes=20)
        progress.story_beat = "intro"
        
        validated = validate_game_response(response, progress)
        
        # Should be clamped to intro range (2-5)
        assert 2 <= validated.tension_level <= 5
    
    def test_add_default_suggestions(self):
        """Test that empty suggestions get defaults."""
        response = GameResponse(
            narrative="Test",
            action_type="exploration",
            suggestions=[],
            tension_level=5,
        )
        
        progress = SessionProgress(total_scenes=20)
        
        validated = validate_game_response(response, progress)
        
        assert len(validated.suggestions) > 0


class TestSummarizeNarrative:
    """Tests for narrative summarization."""
    
    def test_short_narrative(self):
        """Test that short narratives are preserved."""
        narrative = "You enter the room."
        summary = summarize_narrative(narrative)
        
        assert summary == "You enter the room"
    
    def test_long_narrative(self):
        """Test that long narratives are truncated."""
        narrative = "A" * 200
        summary = summarize_narrative(narrative, max_length=50)
        
        assert len(summary) <= 50
        assert summary.endswith("...")
    
    def test_multi_sentence(self):
        """Test that only first sentence is kept."""
        narrative = "First sentence. Second sentence. Third sentence."
        summary = summarize_narrative(narrative)
        
        assert summary == "First sentence"
