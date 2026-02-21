# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Void Walker is a space horror RPG with AI-driven game mastering. The game uses Google's Gemini API to dynamically generate unique scenarios and narrate gameplay responses based on player actions. Each session is procedurally generated with a complete story arc from intro to resolution.

The game is a **Progressive Web App (PWA)** using React + TypeScript, optimized for mobile devices.

## Repository Structure

```
void_walker/
├── pwa/                      # Progressive Web App
│   ├── src/
│   │   ├── components/       # React UI components
│   │   ├── services/         # LLM client, storage, prompts
│   │   ├── stores/           # Zustand state management
│   │   ├── utils/            # Dice, pacing, validators
│   │   └── types/            # TypeScript interfaces
│   ├── public/
│   └── package.json
├── shared/                   # Shared content definitions
│   └── content/              # Classes, items, settings (JSON)
├── docs/                     # Documentation
│   └── PWA_MISSING_FEATURES.md  # Features to implement
└── archived/                 # Archived CLI version (reference only)
```

## Development Commands

```bash
cd pwa

# Install dependencies
npm install

# Development server (hot reload)
npm run dev                   # http://localhost:5173

# Testing
npm run test                  # Run Vitest tests
npm run test:coverage         # Coverage report

# Linting
npm run lint                  # ESLint check
npm run lint:fix              # Auto-fix

# Build
npm run build                 # Production build
npm run preview               # Preview production build

# Type checking
npm run typecheck             # TypeScript validation
```

## API Key Handling

The PWA uses client-side API key storage:
1. First launch shows ApiKeySetup modal
2. User enters their Google API key
3. Key stored in IndexedDB
4. All LLM calls use this key directly

For sharing with friends, consider setting up a Vercel serverless proxy (see archived CLI docs for example).

## High-Level Architecture

### Core Game Loop

1. Character creation → Scenario generation → Game loop → Ending
2. Each turn: Display status → Get input → Process action → Update state
3. Actions may require dice rolls, which trigger a second LLM call for outcome narration

### LLM Integration Strategy

**Two-phase action resolution:**
1. **Assessment phase**: LLM evaluates action, determines if dice roll needed, sets difficulty
2. **Outcome phase** (if roll required): Dice rolled, then LLM narrates based on result

This ensures dice outcomes are respected and prevents "soft failures" where the LLM ignores bad rolls.

### State Management

**Zustand store** in `pwa/src/stores/gameStore.ts`

Single source of truth containing:
- Player stats, HP, inventory, XP progression
- Scenario data (locations, NPCs, secrets, victory conditions)
- Session progress (current scene, story beat, objectives)
- Recent events (compressed for LLM context window)

**Persistence:** IndexedDB via Dexie.js in `pwa/src/services/storage.ts`

### Pacing System (Critical Architecture)

The engine deterministically controls story progression while the LLM creates content:

**Story beats:** intro (10%) → rising (35%) → midpoint (10%) → escalation (30%) → climax (10%) → resolution (5%)

Beat transitions are calculated from `current_scene / total_scenes` percentage. Each beat has specific directives injected into the LLM prompt that guide narrative tone, tension level, and difficulty.

The engine validates LLM responses to prevent premature endings or beat violations.

## UI Components

- **StatusBar**: Compact top bar with HP, O2, location, progress
- **NarrativePanel**: Scrollable text with typewriter effect
- **SuggestionButtons**: 3 large touch targets for AI suggestions
- **CustomActionInput**: Text input for free-form actions
- **MapModal**: Fullscreen spatial grid
- **InventoryModal**: Bottom sheet with item cards
- **DiceRoll**: 2-second suspense animation

**Design system:**
- Portrait-first layout
- Touch-friendly (min 44px touch targets)
- Muted horror aesthetic (dark grays, subtle reds)

## Language Convention

**Critical:** All player-facing text (narration, UI labels, item names, location descriptions) must be in **French**. Engine internals, logs, comments, and this documentation are in **English**.

When adding new content:
- ✓ `"Vous êtes mort."` (player sees this)
- ✓ `console.log("Player died")` (internal log)
- ✗ `"You are dead."` (wrong language for player)

## Key Design Patterns

### Dice System
D20 + stat (1-5) + modifier (-5 to +5) vs difficulty (1-20)
- Natural 1 = critical failure (regardless of total)
- Natural 20 = critical success (regardless of total)
- On success: Grant XP (10 successes = +1 stat, max 5)

### Inventory System
Flexible schema accommodates LLM-generated items with `itemType`, `statBonus`, and `uses` fields. Items can grant situational modifiers (e.g., "Multitool" gives +1 INT for hacking actions).

### Session Ending
The game MUST conclude within the configured scene limit. The pacing system forces progression toward climax and resolution as scenes deplete. LLM can set `isEnding: true` only during "climax" or "resolution" beats.

## Common Pitfalls

1. **Don't ignore dice results**: The two-phase action system exists specifically to prevent LLMs from narrating "partial successes" on failures. Always include dice result in the second prompt.

2. **Don't skip beat validation**: Without validation, LLMs will try to end the story after 2-3 turns. The validator prevents premature endings and enforces tension ranges.

3. **All LLM calls are async**: Use `async/await` with all LLM-related functions.

4. **Don't hardcode strings in French**: Keep strings in config for future localization.

## Important Files Reference

- **Game store**: `pwa/src/stores/gameStore.ts`
- **LLM client**: `pwa/src/services/llmClient.ts`
- **Prompt building**: `pwa/src/services/prompts.ts`
- **Response parsing**: `pwa/src/services/parser.ts`
- **Validation**: `pwa/src/services/validators.ts`
- **Dice resolution**: `pwa/src/utils/dice.ts`
- **Storage**: `pwa/src/services/storage.ts`
- **Game types**: `pwa/src/types/game.ts`

## Debugging

```bash
npm run dev
# Open browser DevTools (F12)
```
- Console logs for all state changes
- React DevTools for component inspection
- Network tab for LLM API calls
- Application tab for IndexedDB inspection

**Save data:** IndexedDB → VoidWalkerDB → saves/scenarios/settings tables

## Testing Mobile UI

1. Run `npm run dev` in pwa/
2. Open Chrome DevTools (F12)
3. Toggle Device Toolbar (Ctrl+Shift+M)
4. Select mobile device preset
5. Interact with touch simulation

## Missing Features

See `docs/PWA_MISSING_FEATURES.md` for CLI features not yet implemented in the PWA, prioritized for future work.

## Shared Content

Game content is defined in `shared/content/`:
- `classes.json` - Character class definitions
- `items.json` - Item templates
- `settings.json` - Setting types, storytelling elements, NPC archetypes

Currently the PWA has hardcoded content in `pwa/src/types/game.ts`. Future work: load from shared JSON.

## Quick Reference

```bash
# Start dev server
cd pwa && npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Type check
npm run typecheck
```
