# Scenario Saving Feature

## Overview

Void Walker automatically saves every successfully generated scenario to the `data/scenarios/` directory. This provides a permanent archive of all generated content for review, reuse, and analysis.

## How It Works

1. **Automatic Saving**: When a scenario is successfully generated and validated, it's automatically saved to disk
2. **Unique Filenames**: Each scenario file uses the format `{scenario_title}_{timestamp}.json`
3. **Safe Storage**: The save operation is wrapped in a try-catch to ensure scenario generation never fails due to save errors

## File Format

Each scenario file is a JSON document containing:
- Complete scenario data (locations, NPCs, secrets, victory conditions)
- Metadata fields:
  - `_saved_at`: ISO timestamp of when the scenario was saved
  - `_scenario_name`: Original scenario title

## Benefits

### For Players
- Review past scenarios you've played
- Share interesting scenarios with other players
- Replay favorite scenarios

### For Developers
- Analyze generated scenarios for quality and balance
- Build a dataset of successful scenario patterns
- Debug and improve the generation system
- Track evolution of scenario quality over time

### For Game Masters
- Use generated scenarios as inspiration
- Modify saved scenarios for custom games
- Build a library of tested adventures

## Usage

### Listing Scenarios

Run the included script to see all saved scenarios:

```bash
python scripts/list_scenarios.py
```

### Loading a Scenario

Scenarios can be loaded programmatically:

```python
import json
from pathlib import Path
from void_walker.config import SCENARIOS_DIR

# Load a specific scenario
scenario_path = SCENARIOS_DIR / "Le_Dernier_Signal_20251204_153045.json"
with open(scenario_path) as f:
    scenario_data = json.load(f)

print(f"Title: {scenario_data['title']}")
print(f"Locations: {len(scenario_data['locations'])}")
```

### Cleaning Up

To remove old scenarios:

```bash
# Remove all scenarios
rm data/scenarios/*.json

# Remove scenarios older than a certain date
# (manual file management)
```

## Implementation Details

### Code Location

- **Config**: `void_walker/config.py` - `SCENARIOS_DIR` constant
- **Save Function**: `void_walker/utils/save.py` - `save_scenario()` function
- **Integration**: `void_walker/llm/world_gen.py` - `generate_scenario()` function

### Filename Sanitization

Special characters in scenario titles are automatically sanitized:
- Non-alphanumeric characters (except spaces, hyphens, underscores) are replaced with underscores
- Spaces are converted to underscores
- The timestamp ensures uniqueness even for scenarios with identical titles

### Error Handling

Scenario saving uses defensive programming:
- The scenarios directory is created if it doesn't exist
- Save failures are logged but don't interrupt scenario generation
- Invalid characters in filenames are safely handled

## Testing

Run the test suite to verify the feature:

```bash
pytest tests/test_scenario_save.py -v
```

Tests cover:
- Basic scenario saving
- Filename sanitization
- Directory creation
- Metadata preservation

## Future Enhancements

Potential improvements to this feature:

- **Scenario Browser UI**: In-game interface to browse and load saved scenarios
- **Tagging System**: Add tags to categorize scenarios by theme, difficulty, etc.
- **Export/Import**: Share scenarios between installations
- **Statistics**: Analyze scenario characteristics and patterns
- **Versioning**: Track when scenarios are modified or replayed
