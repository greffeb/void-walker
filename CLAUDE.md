# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Void Walker is a terminal-based space horror RPG with AI-driven game mastering. The game uses Google's Gemini API to dynamically generate unique scenarios and narrate gameplay responses based on player actions. Each session is procedurally generated with a complete story arc from intro to resolution.

## Development Commands

### Setup
```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e ".[dev]"

# Configure API key
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY
```

### Running the Game
```bash
# Standard 30-minute session
void-walker

# Or via Python module
python -m void_walker

# Quick 5-minute session
void-walker --session quick

# Extended 2-hour session
void-walker --session extended

# Debug mode (verbose logs, no animations)
void-walker --debug
```

### Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_dice.py

# Run with verbose output
pytest -v

# Run with asyncio debug
pytest -v --log-cli-level=DEBUG
```

### Linting
```bash
# Check code with ruff
ruff check void_walker/

# Auto-fix issues
ruff check --fix void_walker/

# Format code
ruff format void_walker/
```

## High-Level Architecture

### Core Game Loop (void_walker/core/game.py)

The `Game` class orchestrates the entire experience:
1. Character creation → Scenario generation → Game loop → Ending
2. Each turn: Display status → Get input → Process action → Update state
3. Actions may require dice rolls, which trigger a second LLM call for outcome narration

### LLM Integration Strategy

**Two-model approach:**
- `gemini-2.5-pro`: Scenario generation (1 call per session, high quality)
- `gemini-2.5-flash-lite`: Turn-by-turn gameplay (30-100 calls per session, speed critical)
- `gemma-3-27b-it`: Fallback if quotas exceeded

**Two-phase action resolution:**
1. **Assessment phase**: LLM evaluates action, determines if dice roll needed, sets difficulty
2. **Outcome phase** (if roll required): Dice rolled, then LLM narrates based on result

This ensures dice outcomes are respected and prevents "soft failures" where the LLM ignores bad rolls.

### State Management (void_walker/core/state.py)

`GameState` is the single source of truth, containing:
- Player stats, HP, inventory, XP progression
- Scenario data (locations, NPCs, secrets, victory conditions)
- Session progress (current scene, story beat, objectives)
- Recent events (compressed for LLM context window)

State is saved to JSON after each turn in `data/saves/`.

### Pacing System (Critical Architecture)

The engine deterministically controls story progression while the LLM creates content:

**Story beats:** intro (10%) → rising (35%) → midpoint (10%) → escalation (30%) → climax (10%) → resolution (5%)

Beat transitions are calculated from `current_scene / total_scenes` percentage. Each beat has specific directives injected into the LLM prompt (`void_walker/llm/prompts.py`) that guide narrative tone, tension level, and difficulty.

**Example:** At 50% progress, engine forces "midpoint" beat, which instructs LLM: "C'est le moment d'une RÉVÉLATION MAJEURE" with tension 6-7/10.

The engine validates LLM responses to prevent premature endings or beat violations (`validate_game_response` in `void_walker/llm/parser.py`).

### Prompt Engineering (void_walker/llm/prompts.py)

**World generation prompt** (`build_world_gen_prompt`):
- Creates 6-8 interconnected locations with victory paths
- Validates map coherence (no orphaned locations, dead-ends have rewards)
- Outputs structured JSON with locations, NPCs, secrets, environmental clues

**Gameplay prompt** (`build_gameplay_prompt`):
- Combines: pacing context + current state + recent events + player action + optional dice result
- Explicitly instructs LLM to respect dice outcomes: "Tu DOIS narrer un ÉCHEC. Pas de demi-succès."
- Includes proximity warnings when approaching session end

### Response Parsing (void_walker/llm/parser.py)

All LLM responses are JSON-structured with Pydantic validation. The parser:
- Extracts JSON from markdown code blocks if LLM adds them
- Falls back to regex extraction if JSON parsing fails
- Validates required fields and data types
- Logs parse failures for debugging

### UI System (void_walker/ui/)

Built with Rich library for terminal rendering:
- **Status bar**: HP, O2, location, inventory count, elapsed time
- **Toggleable panels**: Map (`m`), Inventory (`i`), Suggestions (`TAB`)
- **Dice animation**: 2-second suspense animation before revealing result
- **Responsive layout**: Adapts to terminal width (min 120 columns)

Color palette is muted horror aesthetic (grays, subtle reds for danger).

## Language Convention

**Critical:** All player-facing text (narration, UI labels, item names, location descriptions) must be in **French**. Engine internals, logs, comments, and this documentation are in **English**.

When adding new content:
- ✓ `"Vous êtes mort."` (player sees this)
- ✓ `logger.info("Player died")` (internal log)
- ✗ `"You are dead."` (wrong language for player)

## Key Design Patterns

### Dice System
D20 + stat (1-5) + modifier (-5 to +5) vs difficulty (1-20)
- Natural 1 = critical failure (regardless of total)
- Natural 20 = critical success (regardless of total)
- On success: Grant XP (10 successes = +1 stat, max 5)

### Inventory System
Flexible schema accommodates LLM-generated items with `item_type`, `stat_bonus`, and `uses` fields. Items can grant situational modifiers (e.g., "Multitool" gives +1 INT for hacking actions).

### Session Ending
The game MUST conclude within the configured scene limit. The pacing system forces progression toward climax and resolution as scenes deplete. LLM can set `is_ending: true` only during "climax" or "resolution" beats.

## Common Pitfalls

1. **Don't ignore dice results**: The two-phase action system exists specifically to prevent LLMs from narrating "partial successes" on failures. Always include `dice_result` in the second prompt.

2. **Don't skip beat validation**: Without `validate_game_response`, LLMs will try to end the story after 2-3 turns. The validator prevents premature endings and enforces tension ranges.

3. **Don't assume synchronous code**: Game loop is async (`asyncio`). LLM calls are `await call_llm(...)`, UI animations are `await animate_dice_roll(...)`.

4. **Don't hardcode strings in French**: Use the i18n approach or keep strings in config. This makes future localization possible.

## Testing Strategy

Tests focus on:
- **Dice mechanics** (`test_dice.py`): Probability distributions, critical hits
- **State management** (`test_state.py`): Mutations, progression tracking
- **LLM response parsing** (`test_parser.py`): JSON extraction, validation
- **World generation** (`test_world_gen.py`): Scenario structure, map coherence

No integration tests for actual LLM calls (too expensive/slow). Use fallback scenario for local development.

## Debugging

**Debug mode** (`--debug`):
- Disables animations (instant dice rolls)
- Enables verbose logging to `data/logs/`
- Shows full exception tracebacks
- Logs all LLM prompts and responses

**Save files**: After each turn, state saved to `data/saves/{session_id}.json`. Load these to inspect game state or resume sessions.

**Log files**: `data/logs/void_walker_{timestamp}.log` contains structured logs of turns, dice rolls, LLM calls, and errors.

## Extending the Game

### Adding a New Character Class
1. Define in `void_walker/content/classes.py`:
```python
"Hacker": {
    "stats": {"FOR": 2, "INT": 5, "CHA": 1},
    "hp": 8,
    "description": "Expert en systèmes informatiques",
    "starting_inventory": ["Deck de piratage", "Clé de chiffrement"]
}
```

### Adding a New Setting Type
1. Add to `SETTING_TYPES` in `void_walker/config.py`
2. Update world generation prompt in `void_walker/llm/prompts.py` to include new type
3. LLM will automatically generate scenarios with the new setting

### Modifying Pacing
Edit `PACING_INSTRUCTIONS` in `void_walker/llm/prompts.py` to change beat directives. Adjust beat thresholds in `SessionProgress._calculate_beat()` if you want different story structure percentages.

## Important Files Reference

- **Game loop**: `void_walker/core/game.py:Game.run()` and `Game._game_turn()`
- **LLM calls**: `void_walker/llm/client.py:call_llm()`
- **Prompt building**: `void_walker/llm/prompts.py:build_gameplay_prompt()`
- **Pacing logic**: `void_walker/core/state.py:SessionProgress.advance_scene()`
- **Dice resolution**: `void_walker/core/dice.py:roll_check()`
- **Response validation**: `void_walker/llm/parser.py:validate_game_response()`
- **Scenario fallback**: `void_walker/llm/world_gen.py:create_fallback_scenario()`

## Additional Context

See `void_walker_spec.md` for the complete original design specification with detailed mechanics, UI mockups, and development phases. The spec is comprehensive but represents the ideal vision; current implementation is in Phase 2-3.
