# Void Walker

A terminal-based space horror RPG with AI-driven game mastering, procedural generation, and creative player agency.

## Features

- **Emergent Storytelling**: AI-generated unique scenarios every session
- **Creative Agency**: Attempt any action - the AI evaluates fairly
- **Meaningful Consequences**: D20-based dice system with real stakes
- **Atmospheric Horror**: Environmental storytelling through datapads, radio transmissions, and evidence.
- **Flexible Sessions**: Play for 5 minutes or 2 hours
- **Scenario Archive**: All successfully generated scenarios are automatically saved to `data/scenarios/` for future use

## Requirements

- Python 3.11+
- Terminal with 120+ columns, Unicode support, 256 colors
- Google AI API key (Gemini)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd void_walker

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

## Usage

```bash
# Start the game
void-walker

# Quick session (5 minutes)
void-walker --session quick

# Standard session (30 minutes)
void-walker --session standard

# Extended session (2 hours)
void-walker --session extended

# Debug mode
void-walker --debug

# Fast playtest mode (skips menus, uses latest scenario)
void-walker --fast
```

## Controls

| Key | Action |
|-----|--------|
| `i` | Toggle inventory |
| `m` | Toggle map |
| `TAB` | Show suggestions |
| `?` | Help |
| `q` | Quit |

## License

MIT License
