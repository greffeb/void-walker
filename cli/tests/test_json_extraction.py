"""Test JSON extraction with real-world LLM outputs."""

import asyncio
import sys
sys.path.insert(0, "c:/dev/void_walker")

from void_walker.llm.client import extract_json


# Sample responses that might cause issues
TEST_RESPONSES = [
    # Clean JSON
    ('{"title": "Test", "value": 123}', True, "Clean JSON"),
    
    # JSON with markdown code block
    ('```json\n{"title": "Test", "value": 123}\n```', True, "Markdown block"),
    
    # JSON with text before and after
    ('Here is the JSON:\n{"title": "Test", "value": 123}\n\nDone!', True, "Text around"),
    
    # JSON with newlines inside (like the user's error)
    ('```json\n{\n  "title": "L\'Écho du Silence",\n  "setting_type": "derelict_ship",\n  "setting_name": "Le \'Styx\'"\n}\n```', True, "Multiline with escapes"),
    
    # JSON truncated mid-string (the problematic case)
    ('```json\n{"title": "L\'Écho du Silence", "premise": "Le vaisseau de transport', False, "Truncated"),
    
    # JSON with escaped characters
    ('{"title": "Test \\"quoted\\" text", "value": 123}', True, "Escaped quotes"),
    
    # Nested JSON
    ('{"outer": {"inner": {"deep": true}}, "array": [1, 2, 3]}', True, "Nested"),
]


def test_extraction():
    """Run extraction tests."""
    print("Testing JSON extraction...\n")
    
    passed = 0
    failed = 0
    
    for response, should_work, name in TEST_RESPONSES:
        result = extract_json(response)
        success = (result is not None) == should_work
        
        if success:
            print(f"✓ {name}")
            passed += 1
        else:
            print(f"✗ {name}")
            print(f"  Response: {response[:50]}...")
            print(f"  Expected: {'should parse' if should_work else 'should fail'}")
            print(f"  Got: {result}")
            failed += 1
    
    print(f"\n{passed}/{passed + failed} tests passed")
    return failed == 0


if __name__ == "__main__":
    test_extraction()
