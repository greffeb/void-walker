# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Void Walker is a space horror RPG with AI-driven game mastering. The game uses Google's Gemini API to dynamically generate unique scenarios and narrate gameplay responses based on player actions. Each session is procedurally generated with a complete story arc from intro to resolution.

**Two versions are available:**
- **CLI** (`/cli`): Terminal-based version using Python + Rich library
- **PWA** (`/pwa`): Mobile-first Progressive Web App using React + TypeScript

Both versions share the same game engine logic, prompts, and content.

## Repository Structure (Mono-repo)

```
void_walker/
├── cli/                      # Python terminal version
│   ├── void_walker/          # Main package
│   │   ├── core/             # Game logic (dice, state, pacing)
│   │   ├── llm/              # LLM client, prompts, parsing
│   │   ├── ui/               # Rich terminal UI
│   │   └── content/          # Classes, items
│   ├── tests/
│   ├── data/                 # Saves, logs, scenarios
│   └── pyproject.toml
├── pwa/                      # TypeScript PWA version
│   ├── src/
│   │   ├── components/       # React UI components
│   │   ├── controllers/      # Game logic (ported from Python)
│   │   ├── services/         # LLM client, storage
│   │   ├── utils/            # Dice, pacing, validators
│   │   ├── types/            # TypeScript interfaces
│   │   └── content/          # Classes, items (from shared)
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── vite.config.ts
├── shared/                   # Shared between CLI and PWA
│   ├── prompts/              # LLM prompt templates (JSON)
│   ├── content/              # Game content (JSON)
│   │   ├── classes.json      # Character classes
│   │   ├── items.json        # Item definitions
│   │   └── settings.json     # Setting types
│   └── design/               # Game design documents
├── docs/                     # Documentation
│   └── PWA_PORT_SPEC.md      # Technical specification
└── CLAUDE.md                 # This file
```

## Development Commands

### CLI Version (Python)

```bash
cd cli

# Setup
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -e ".[dev]"

# Configure API key
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Run game
void-walker                   # Standard 30-minute session
void-walker --session quick   # Quick 5-minute session
void-walker --debug           # Debug mode (verbose logs)

# Testing
pytest                        # Run all tests
pytest -v                     # Verbose output
pytest tests/test_dice.py     # Specific test file

# Linting
ruff check void_walker/       # Check code
ruff check --fix void_walker/ # Auto-fix
ruff format void_walker/      # Format code
```

### PWA Version (TypeScript)

```bash
cd pwa

# Setup
npm install

# Development server (hot reload)
npm run dev                   # http://localhost:5173

# Testing
npm run test                  # Run Vitest tests
npm run test:ui               # Test with UI
npm run test:coverage         # Coverage report

# Linting
npm run lint                  # ESLint check
npm run lint:fix              # Auto-fix
npm run format                # Prettier format

# Build
npm run build                 # Production build
npm run preview               # Preview production build

# Type checking
npm run typecheck             # TypeScript validation
```

### Shared Content Sync

When modifying prompts or content, update the shared files and sync to both versions:

```bash
# After editing shared/content/classes.json
npm run sync:content          # Syncs to pwa/src/content/
python scripts/sync_content.py # Syncs to cli/void_walker/content/
```

## PWA-Specific Configuration

### API Key Handling (Two Options)

#### Option A: Serverless Proxy (Recommended for sharing with friends)

Use a **free Vercel serverless function** to hide your API key:

```
PWA (GitHub Pages) → Vercel Function (your secret key) → Google Gemini API
     Free                    Free                           Your quota
```

**Setup:**

1. Create a Vercel project for the proxy:
```bash
# In a separate folder or /proxy subfolder
mkdir proxy && cd proxy
npm init -y
```

2. Create `api/llm.ts`:
```typescript
// api/llm.ts (Vercel serverless function)
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export default async function handler(req: Request) {
  // Optional: Add origin check to prevent abuse
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'https://yourusername.github.io',
    'http://localhost:5173'
  ];

  if (!allowedOrigins.includes(origin || '')) {
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { prompt, model, maxTokens, temperature } = await req.json();

  const genModel = genAI.getGenerativeModel({ model });
  const result = await genModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature }
  });

  return new Response(JSON.stringify({ text: result.response.text() }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin || '*'
    }
  });
}
```

3. Deploy to Vercel and add secret:
```bash
# Deploy
vercel

# Add your API key as secret (NOT in code!)
vercel env add GOOGLE_API_KEY
# Paste your key when prompted
```

4. Configure PWA to use proxy:
```typescript
// pwa/src/services/llmClient.ts
const API_URL = import.meta.env.PROD
  ? 'https://your-proxy.vercel.app/api/llm'  // Production
  : 'http://localhost:3000/api/llm';          // Dev (optional local proxy)

export async function callLLM(prompt: string, model: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, maxTokens: 2048, temperature: 0.8 })
  });
  return response.json();
}
```

**Benefits:**
- API key is NEVER in the repository
- Key stored in Vercel dashboard (encrypted)
- Friends use the app without needing their own key
- Free tier: unlimited for hobby use
- Optional: Add rate limiting or authentication

#### Option B: Client-side API Key (For personal/dev use only)

For local development or if users provide their own keys:

```typescript
// First launch: Modal prompts user for their API key
// Key stored in localStorage
// Direct calls to Google Generative AI API from browser

// Flow:
// 1. Check localStorage for existing key
// 2. If missing, show ApiKeyModal
// 3. User enters their Google API key
// 4. Store in localStorage
// 5. All LLM calls use this key directly
```

**Note:** This exposes the key in browser storage. Only use for personal development.

#### Hybrid Approach (Best of both worlds)

```typescript
// pwa/src/services/llmClient.ts
export async function callLLM(prompt: string, model: string) {
  // Try proxy first (for shared users)
  const proxyUrl = import.meta.env.VITE_PROXY_URL;

  if (proxyUrl) {
    try {
      return await fetch(proxyUrl, { /* ... */ });
    } catch (e) {
      console.warn('Proxy unavailable, falling back to local key');
    }
  }

  // Fallback to local API key (for dev or power users)
  const localKey = localStorage.getItem('google_api_key');
  if (localKey) {
    return await callGeminiDirectly(prompt, model, localKey);
  }

  throw new Error('No API key available');
}
```

### GitHub Pages Deployment

```bash
cd pwa

# Build for GitHub Pages
npm run build

# Deploy to gh-pages branch
npm run deploy

# Or manual:
# 1. Build creates /pwa/dist/
# 2. Push dist/ to gh-pages branch
# 3. Enable GitHub Pages from gh-pages branch
```

**vite.config.ts** for GitHub Pages:
```typescript
export default defineConfig({
  base: '/void_walker/',  // Repository name
  // ...
});
```

### PWA Features

- **Installable**: Add to home screen on Android
- **Offline**: Cached scenarios playable offline (new scenarios need internet)
- **Responsive**: Portrait-optimized for mobile, works on desktop too

### Browser Testing Workflow

```bash
cd pwa
npm run dev

# Opens http://localhost:5173
# Hot reload on file changes
# Test on mobile: use same WiFi, access http://<your-ip>:5173
```

**Chrome DevTools for mobile testing:**
1. F12 → Toggle Device Toolbar
2. Select device (Pixel 7, iPhone 14, etc.)
3. Test touch interactions

## High-Level Architecture

### Core Game Loop

Both versions follow the same flow:
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

### State Management

**CLI**: `GameState` Pydantic model in `cli/void_walker/core/state.py`
**PWA**: `GameState` TypeScript interface in `pwa/src/types/game.ts`

Single source of truth containing:
- Player stats, HP, inventory, XP progression
- Scenario data (locations, NPCs, secrets, victory conditions)
- Session progress (current scene, story beat, objectives)
- Recent events (compressed for LLM context window)

**Persistence:**
- CLI: JSON files in `data/saves/`
- PWA: IndexedDB via Dexie.js

### Pacing System (Critical Architecture)

The engine deterministically controls story progression while the LLM creates content:

**Story beats:** intro (10%) → rising (35%) → midpoint (10%) → escalation (30%) → climax (10%) → resolution (5%)

Beat transitions are calculated from `current_scene / total_scenes` percentage. Each beat has specific directives injected into the LLM prompt that guide narrative tone, tension level, and difficulty.

**Example:** At 50% progress, engine forces "midpoint" beat, which instructs LLM: "C'est le moment d'une RÉVÉLATION MAJEURE" with tension 6-7/10.

The engine validates LLM responses to prevent premature endings or beat violations.

### Prompt Engineering

Prompts are defined in `shared/prompts/` and loaded by both versions:

**World generation prompt** (`world_gen.json`):
- Creates 6-8 interconnected locations with victory paths
- Validates map coherence (no orphaned locations, dead-ends have rewards)
- Outputs structured JSON with locations, NPCs, secrets, environmental clues

**Gameplay prompt** (`gameplay.json`):
- Combines: pacing context + current state + recent events + player action + optional dice result
- Explicitly instructs LLM to respect dice outcomes: "Tu DOIS narrer un ÉCHEC. Pas de demi-succès."
- Includes proximity warnings when approaching session end

## UI Systems

### CLI UI (Rich Library)

- **Status bar**: HP, O2, location, inventory count, elapsed time
- **Toggleable panels**: Map (`m`), Inventory (`i`), Suggestions (`TAB`)
- **Dice animation**: 2-second suspense animation before revealing result
- **Responsive layout**: Adapts to terminal width (min 120 columns)

### PWA UI (React + Tailwind)

- **StatusBar**: Compact top bar with HP, O2, location
- **NarrativePanel**: Scrollable text with typewriter effect
- **SuggestionButtons**: 3 large touch targets for AI suggestions
- **CustomActionInput**: Collapsible text input for free-form actions
- **MapModal**: Fullscreen spatial grid (swipe to close)
- **InventoryModal**: Bottom sheet with item cards
- **DiceAnimation**: CSS-based 2-second suspense animation

**Design system:**
- Portrait-first layout
- Touch-friendly (min 44px touch targets)
- Muted horror aesthetic (dark grays, subtle reds)
- JetBrains Mono font for sci-fi feel

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

3. **Don't assume synchronous code**:
   - CLI: `asyncio` - LLM calls are `await call_llm(...)`
   - PWA: `async/await` with fetch - all LLM calls are promises

4. **Don't hardcode strings in French**: Use the i18n approach or keep strings in config. This makes future localization possible.

5. **Keep prompts in sync**: When modifying prompts, update `shared/prompts/` and run sync scripts for both versions.

## Testing Strategy

### CLI Tests
- **Dice mechanics** (`test_dice.py`): Probability distributions, critical hits
- **State management** (`test_state.py`): Mutations, progression tracking
- **LLM response parsing** (`test_parser.py`): JSON extraction, validation
- **World generation** (`test_world_gen.py`): Scenario structure, map coherence

### PWA Tests
- **Unit tests** (`*.test.ts`): Dice, pacing, state utilities
- **Component tests** (`*.test.tsx`): React component rendering
- **Integration tests**: Game flow with mocked LLM responses

No integration tests for actual LLM calls (too expensive/slow). Use fallback scenario for local development.

## Debugging

### CLI Debug Mode
```bash
void-walker --debug
```
- Disables animations (instant dice rolls)
- Enables verbose logging to `data/logs/`
- Shows full exception tracebacks
- Logs all LLM prompts and responses

### PWA Debug Mode
```bash
npm run dev
# Open browser DevTools (F12)
```
- Console logs for all state changes
- React DevTools for component inspection
- Network tab for LLM API calls
- Application tab for IndexedDB inspection

**Save files:**
- CLI: `data/saves/{session_id}.json`
- PWA: IndexedDB → VoidWalkerDB → saves table

## Extending the Game

### Adding a New Character Class

1. Edit `shared/content/classes.json`:
```json
{
  "Hacker": {
    "stats": {"FOR": 2, "INT": 5, "CHA": 1},
    "hp": 8,
    "description": "Expert en systèmes informatiques",
    "starting_inventory": ["Deck de piratage", "Clé de chiffrement"]
  }
}
```

2. Run sync scripts:
```bash
npm run sync:content
python scripts/sync_content.py
```

### Modifying Prompts

1. Edit `shared/prompts/*.json`
2. Run sync to propagate changes
3. Test on both CLI and PWA

### Adding New Settings

Edit `shared/content/settings.json` and sync.

## Important Files Reference

### CLI
- **Game loop**: `cli/void_walker/core/game.py:Game.run()`
- **LLM calls**: `cli/void_walker/llm/client.py:call_llm()`
- **Prompt building**: `cli/void_walker/llm/prompts.py:build_gameplay_prompt()`
- **Pacing logic**: `cli/void_walker/core/state.py:SessionProgress.advance_scene()`
- **Dice resolution**: `cli/void_walker/core/dice.py:roll_check()`
- **Response validation**: `cli/void_walker/llm/parser.py:validate_game_response()`

### PWA
- **Game controller**: `pwa/src/controllers/gameController.ts`
- **LLM client**: `pwa/src/services/llmClient.ts`
- **Prompt building**: `pwa/src/services/prompts.ts`
- **Pacing logic**: `pwa/src/utils/pacing.ts`
- **Dice resolution**: `pwa/src/utils/dice.ts`
- **Storage**: `pwa/src/services/storage.ts`
- **Components**: `pwa/src/components/*.tsx`

### Shared
- **Prompts**: `shared/prompts/world_gen.json`, `gameplay.json`
- **Content**: `shared/content/classes.json`, `items.json`, `settings.json`
- **Design docs**: `shared/design/`

## PWA Workflow Tips

### Quick Iteration Cycle

```bash
# Terminal 1: PWA dev server
cd pwa && npm run dev

# Terminal 2: CLI for testing prompts
cd cli && void-walker --debug

# Edit shared/prompts/gameplay.json
# Both versions pick up changes on next run
```

### Testing Mobile UI

1. Run `npm run dev` in pwa/
2. Open Chrome DevTools (F12)
3. Toggle Device Toolbar (Ctrl+Shift+M)
4. Select mobile device preset
5. Interact with touch simulation

### Debugging LLM Responses

```typescript
// In pwa/src/services/llmClient.ts
console.log('Prompt:', prompt);
console.log('Response:', rawResponse);
console.log('Parsed:', parsedResponse);
```

### Testing Without API Key

Both versions have fallback scenarios for testing without LLM calls:
- CLI: `void-walker --offline` (uses `create_fallback_scenario()`)
- PWA: Enable mock mode in settings (uses cached scenario)

## Additional Context

- **PWA Spec**: `docs/PWA_PORT_SPEC.md` - Complete technical specification
- **Original Design**: `void_walker_spec.md` - Original game design vision
- **Game Design**: `shared/design/` - Current design documents

## Quick Reference: Dev Workflow

```bash
# 1. Start PWA dev server
cd pwa && npm run dev

# 2. Make changes to shared content/prompts
edit shared/prompts/gameplay.json

# 3. Changes reflected immediately in PWA (hot reload)
# 4. Test in browser at http://localhost:5173

# 5. When happy, sync to CLI
python scripts/sync_content.py

# 6. Test CLI version
cd cli && void-walker --debug

# 7. Commit both versions together
git add -A && git commit -m "Update gameplay prompts"
```
