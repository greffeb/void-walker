# Void Walker - Android PWA Port Specification

**Version:** 1.0
**Date:** 2026-01-23
**Status:** Planning Phase

## Executive Summary

This document outlines the technical specification for porting Void Walker from a Python terminal-based game to an Android-compatible Progressive Web App (PWA). The port will maintain all core game mechanics while replacing the CLI interface with a mobile-first, touch-friendly UI optimized for vertical screens.

## Project Goals

1. **Platform**: Android PWA (installable, no APK required)
2. **UI Paradigm**: Touch-based buttons + optional text input
3. **Format**: Vertical mobile layout (portrait-optimized)
4. **Core Preservation**: Maintain all game logic, LLM integration, and pacing systems
5. **Performance**: < 3s initial load, < 500ms action response
6. **Offline**: Support cached scenarios for offline play

## Current Architecture Analysis

### Reusable Components (70%)

All core game logic is **UI-independent** and can be directly ported:

```
✅ Core Logic (void_walker/core/)
├── state.py → types.ts (Pydantic → TypeScript interfaces)
├── dice.py → dice.ts (Pure math, no dependencies)
├── guidance.py → guidance.ts (Pacing system)
└── game.py → gameController.ts (Orchestration logic)

✅ LLM Integration (void_walker/llm/)
├── client.py → llmClient.ts (Async API calls)
├── prompts.py → prompts.ts (Template strings)
├── parser.py → parser.ts (JSON extraction)
├── world_gen.py → worldGen.ts (Scenario generation)
└── validators.py → validators.ts (Response validation)

✅ Content (void_walker/content/)
├── classes.py → classes.ts (Character classes)
└── items.py → items.ts (Item definitions)
```

### Components Requiring Replacement (30%)

All UI components use the Rich terminal library and need web equivalents:

```
❌ UI Layer (void_walker/ui/)
├── terminal.py → N/A (Rich Console → React components)
├── panels.py → Modal/Card components
├── layout.py → CSS Flexbox/Grid
├── input.py → HTML forms + button handlers
├── dice_animation.py → CSS animations
├── text.py → JavaScript text effects
└── spinner.py → Loading components

❌ Persistence (void_walker/utils/)
├── save.py → IndexedDB wrapper
└── logging.py → Console logging + analytics
```

## Technology Stack

### Frontend

**Framework**: React 18+ with TypeScript 5+
- **Rationale**: Best mobile performance, strong TypeScript support, large ecosystem
- **State Management**: Zustand (3KB, simpler than Redux)
- **Styling**: Tailwind CSS + Custom animations
- **Build Tool**: Vite 5+ (fast HMR, optimized builds)

**PWA Features**:
- **Service Worker**: Vite PWA plugin (auto-generated)
- **Manifest**: `manifest.json` for installability
- **Caching**: Workbox for offline scenarios

**Storage**:
- **IndexedDB**: Dexie.js wrapper for game saves
- **LocalStorage**: Settings and preferences (< 5MB)
- **Optional Cloud Sync**: Firebase/Supabase for cross-device saves

### Backend (Optional)

**API Proxy** (Recommended for API key security):
- **Framework**: Next.js API routes or Vercel serverless functions
- **Purpose**: Hide Google API key from client
- **Endpoints**:
  - `POST /api/llm/generate-scenario` → Gemini Pro
  - `POST /api/llm/gameplay` → Gemini Flash
  - `POST /api/llm/validate-intent` → Gemma

**Alternative**: Client-side API key (user-provided, less secure)

### Deployment

- **Hosting**: Vercel (frontend + API routes)
- **Domain**: `voidwalker.app` (example)
- **CDN**: Automatic (Vercel Edge Network)
- **Analytics**: Plausible or Posthog (privacy-focused)

## Mobile-First UI Design

### Layout Structure

```
┌─────────────────────────────┐
│ ❤️ 8  🫁 85%  📍 Pont       │ ← Status Bar (sticky)
│ 🎒 3  ⏱️ 12:34              │
├─────────────────────────────┤
│                             │
│  Narrative Panel            │ ← Main scrollable area
│  (scrollable text)          │   - Fade-in animations
│                             │   - Auto-scroll to bottom
│                             │   - Tap to speed up typewriter
│                             │
├─────────────────────────────┤
│ 🗺️ Carte  📦 Inventaire     │ ← Quick access tabs
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 1. Explorer le pont     │ │ ← Suggestion buttons
│ └─────────────────────────┘ │   (3 AI-generated actions)
│ ┌─────────────────────────┐ │
│ │ 2. Contacter la station │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 3. Vérifier les scanners│ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 💬 Action personnalisée... │ ← Expandable text input
└─────────────────────────────┘   (tap to expand)
```

### Component Specifications

#### 1. StatusBar Component

**Props**:
```typescript
interface StatusBarProps {
  hp: number;
  maxHp: number;
  oxygen: number;
  location: string;
  inventoryCount: number;
  elapsedTime: string;
  tension: number; // 0-10 (affects color)
}
```

**Features**:
- Sticky to top on scroll
- Animated HP/O2 changes (pulse on decrease)
- Color-coded tension indicator (green → yellow → red)
- Compact grid layout (2x3)

**Styling**:
```css
.status-bar {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-family: 'JetBrains Mono', monospace;
}
```

#### 2. NarrativePanel Component

**Props**:
```typescript
interface NarrativePanelProps {
  text: string;
  isLoading: boolean;
  typewriterSpeed?: number; // ms per character (default: 20)
  onComplete?: () => void;
}
```

**Features**:
- Progressive text reveal (typewriter effect)
- Tap to skip/speed up animation
- Fade-in for new paragraphs
- Auto-scroll to bottom
- Loading spinner for LLM calls
- Support for **bold** and *italic* markdown

**Animation**:
```typescript
function useTypewriter(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isComplete };
}
```

#### 3. SuggestionButtons Component

**Props**:
```typescript
interface SuggestionButtonsProps {
  suggestions: string[];
  onSelect: (action: string) => void;
  disabled?: boolean;
}
```

**Features**:
- 3 large touch targets (min 56px height)
- Numbered (1, 2, 3)
- Haptic feedback on tap (if available)
- Disabled state during LLM processing
- Smooth fade-in animation

**Styling**:
```css
.suggestion-btn {
  min-height: 56px;
  padding: 1rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.suggestion-btn:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.1);
}
```

#### 4. CustomActionInput Component

**Props**:
```typescript
interface CustomActionInputProps {
  onSubmit: (action: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

**Features**:
- Collapsible (tap to expand)
- Auto-focus on expand
- Submit on Enter (desktop) or button tap (mobile)
- Character counter (optional)
- Keyboard avoidance (push up when keyboard opens)

**Behavior**:
```typescript
function CustomActionInput({ onSubmit, disabled }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      setValue('');
      setIsExpanded(false);
    }
  };

  return (
    <div className={`custom-input ${isExpanded ? 'expanded' : ''}`}>
      {!isExpanded ? (
        <button onClick={() => setIsExpanded(true)}>
          💬 Action personnalisée...
        </button>
      ) : (
        <>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Que faites-vous ?"
            autoFocus
          />
          <div className="actions">
            <button onClick={() => setIsExpanded(false)}>Annuler</button>
            <button onClick={handleSubmit} disabled={!value.trim()}>
              Envoyer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 5. MapModal Component

**Props**:
```typescript
interface MapModalProps {
  locations: Location[];
  currentLocation: string;
  visitedLocations: string[];
  onClose: () => void;
}
```

**Features**:
- Fullscreen overlay
- Spatial grid visualization (like terminal version)
- Fog of war (unvisited locations dimmed)
- Current location highlighted
- Swipe down to close
- Pinch to zoom (optional)

**Layout**:
```
┌─────────────────────────┐
│ [X] Carte spatiale      │ ← Header
├─────────────────────────┤
│     [Hangar]            │
│        |                │
│     [Pont] ← You        │ ← Spatial grid
│     /    \              │   (ASCII or SVG)
│ [Réacteur] [Médical]    │
│                         │
└─────────────────────────┘
```

#### 6. InventoryModal Component

**Props**:
```typescript
interface InventoryModalProps {
  items: Item[];
  onUse?: (item: Item) => void;
  onClose: () => void;
}
```

**Features**:
- Bottom sheet (slides up from bottom)
- Item cards with descriptions
- Stat bonuses displayed (+1 INT, etc.)
- Consumable items show uses remaining
- Long-press for details

#### 7. DiceAnimation Component

**Props**:
```typescript
interface DiceAnimationProps {
  difficulty: number;
  stat: number;
  modifier: number;
  onComplete: (result: DiceResult) => void;
}
```

**Features**:
- 2-second suspense animation (preserve from terminal)
- CSS-based rolling animation
- Large result display (natural 20 = critical, nat 1 = fail)
- Success/failure color indication
- Haptic feedback on result

**Animation**:
```css
@keyframes dice-roll {
  0%, 100% { transform: rotateX(0) rotateY(0); }
  25% { transform: rotateX(180deg) rotateY(90deg); }
  50% { transform: rotateX(270deg) rotateY(180deg); }
  75% { transform: rotateX(360deg) rotateY(270deg); }
}

.dice {
  width: 80px;
  height: 80px;
  animation: dice-roll 2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Core Logic Port

### TypeScript Type Definitions

Port all Pydantic models to TypeScript interfaces:

**File**: `src/types/game.ts`

```typescript
// Player model
export interface Player {
  name: string;
  className: string;
  stats: {
    FOR: number; // 1-5
    INT: number;
    CHA: number;
  };
  maxHp: number;
  hp: number;
  oxygen: number;
  inventory: Item[];
  statProgress: Record<string, number>; // Track XP per stat
}

// Item model
export interface Item {
  name: string;
  description: string;
  itemType: 'tool' | 'weapon' | 'consumable' | 'keyItem' | 'data';
  statBonus?: {
    stat: 'FOR' | 'INT' | 'CHA';
    bonus: number;
  };
  uses?: number;
}

// Location model
export interface Location {
  name: string;
  description: string;
  connections: string[];
  secrets: string[];
  npcs: string[];
  dangers: string[];
  discovered: boolean;
}

// Scenario model
export interface Scenario {
  title: string;
  intro: string;
  setting: string;
  locations: Record<string, Location>;
  npcs: Record<string, NPC>;
  secrets: string[];
  victoryCondition: string;
}

// Game state (single source of truth)
export interface GameState {
  sessionId: string;
  player: Player;
  scenario: Scenario;
  currentLocation: string;
  visitedLocations: string[];
  progress: SessionProgress;
  recentEvents: string[];
  turnNumber: number;
  startTime: string;
}

// Session progress (pacing)
export interface SessionProgress {
  currentScene: number;
  totalScenes: number;
  targetMinutes: number;
  objectivesCompleted: string[];
  hintsGiven: number;
  currentBeat: 'intro' | 'rising' | 'midpoint' | 'escalation' | 'climax' | 'resolution';
}

// LLM response model
export interface GameResponse {
  narrative: string;
  actionType: 'exploration' | 'social' | 'technical' | 'combat' | 'other';
  requiresRoll: boolean;
  difficulty?: number; // 1-20
  stateChanges: StateChanges;
  suggestions: string[];
  tensionLevel: number; // 0-10
  isEnding: boolean;
}

// State changes from LLM
export interface StateChanges {
  hpChange?: number;
  oxygenChange?: number;
  locationChange?: string;
  itemsAdded?: Item[];
  itemsRemoved?: string[];
  objectivesCompleted?: string[];
}

// Dice result
export interface DiceResult {
  roll: number; // 1-20
  total: number; // roll + stat + modifier
  success: boolean;
  critical: boolean; // Natural 1 or 20
  stat: number;
  modifier: number;
  difficulty: number;
}
```

### Dice Mechanics Port

**File**: `src/utils/dice.ts`

```typescript
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollCheck(
  stat: number, // 1-5
  modifier: number, // -5 to +5
  difficulty: number // 1-20
): DiceResult {
  const roll = rollD20();
  const total = roll + stat + modifier;

  // Natural 1 = critical failure (always fails)
  if (roll === 1) {
    return {
      roll,
      total,
      success: false,
      critical: true,
      stat,
      modifier,
      difficulty
    };
  }

  // Natural 20 = critical success (always succeeds)
  if (roll === 20) {
    return {
      roll,
      total,
      success: true,
      critical: true,
      stat,
      modifier,
      difficulty
    };
  }

  // Standard success check
  return {
    roll,
    total,
    success: total >= difficulty,
    critical: false,
    stat,
    modifier,
    difficulty
  };
}

export function awardXP(
  player: Player,
  stat: 'FOR' | 'INT' | 'CHA'
): Player {
  const progress = { ...player.statProgress };
  progress[stat] = (progress[stat] || 0) + 1;

  // Level up: 10 successes = +1 stat (max 5)
  if (progress[stat] >= 10 && player.stats[stat] < 5) {
    return {
      ...player,
      stats: {
        ...player.stats,
        [stat]: player.stats[stat] + 1
      },
      statProgress: {
        ...progress,
        [stat]: 0 // Reset progress
      }
    };
  }

  return {
    ...player,
    statProgress: progress
  };
}
```

### LLM Client Port

**File**: `src/services/llmClient.ts`

```typescript
interface LLMConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

const MODELS: Record<string, LLMConfig> = {
  'gemini-pro': {
    model: 'gemini-2.5-pro',
    maxTokens: 8192,
    temperature: 0.9
  },
  'gemini-flash': {
    model: 'gemini-2.5-flash-lite',
    maxTokens: 2048,
    temperature: 0.8
  },
  'gemma': {
    model: 'gemma-3-27b-it',
    maxTokens: 2048,
    temperature: 0.8
  }
};

export async function callLLM(
  prompt: string,
  modelKey: 'gemini-pro' | 'gemini-flash' | 'gemma',
  retries: number = 3
): Promise<string> {
  const config = MODELS[modelKey];

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Call backend API proxy (hides API key)
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;

    } catch (error) {
      console.error(`LLM call attempt ${attempt + 1} failed:`, error);

      if (attempt === retries - 1) {
        // Fallback to next model or throw
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }

  throw new Error('LLM call failed after all retries');
}

export async function generateScenario(
  characterClass: string,
  setting: string
): Promise<Scenario> {
  const prompt = buildWorldGenPrompt(characterClass, setting);
  const response = await callLLM(prompt, 'gemini-pro');
  return parseScenarioResponse(response);
}

export async function processAction(
  state: GameState,
  action: string
): Promise<GameResponse> {
  const prompt = buildGameplayPrompt(state, action);
  const response = await callLLM(prompt, 'gemini-flash');
  return parseGameResponse(response);
}

export async function narrateOutcome(
  state: GameState,
  action: string,
  diceResult: DiceResult
): Promise<GameResponse> {
  const prompt = buildOutcomePrompt(state, action, diceResult);
  const response = await callLLM(prompt, 'gemini-flash');
  return parseGameResponse(response);
}
```

### Prompt Templates Port

**File**: `src/services/prompts.ts`

Direct translation of Python prompt strings to TypeScript:

```typescript
export function buildWorldGenPrompt(
  characterClass: string,
  setting: string
): string {
  return `Tu es un maître de jeu expert en horreur spatiale...
(Exact copy of Python prompt with template literals)

{
  "title": "...",
  "intro": "...",
  ...
}`;
}

export function buildGameplayPrompt(
  state: GameState,
  action: string,
  diceResult?: DiceResult
): string {
  const progress = calculateProgress(state.progress);
  const pacing = getPacingInstructions(state.progress.currentBeat);

  return `# Contexte de la partie

${pacing}

## État actuel
- Scène: ${state.progress.currentScene}/${state.progress.totalScenes} (${progress}%)
- Beat: ${state.progress.currentBeat}
- Tension: ${state.tensionLevel}/10
...

## Action du joueur
${action}

${diceResult ? `## Résultat du jet de dé
Roll: ${diceResult.roll} (${diceResult.success ? 'SUCCÈS' : 'ÉCHEC'})
${diceResult.critical ? 'CRITIQUE!' : ''}` : ''}

Réponds en JSON:
{
  "narrative": "...",
  "actionType": "...",
  ...
}`;
}
```

### Game Controller Port

**File**: `src/controllers/gameController.ts`

```typescript
export class GameController {
  private state: GameState;

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  async processAction(action: string): Promise<GameResponse> {
    // Phase 1: Assessment
    const assessment = await processAction(this.state, action);

    // Phase 2: Dice roll if needed
    if (assessment.requiresRoll && assessment.difficulty) {
      const diceResult = await this.handleDiceRoll(
        assessment.actionType,
        assessment.difficulty
      );

      // Phase 3: Narrate outcome
      const outcome = await narrateOutcome(this.state, action, diceResult);

      // Award XP on success
      if (diceResult.success) {
        const stat = this.getRelevantStat(assessment.actionType);
        this.state.player = awardXP(this.state.player, stat);
      }

      this.applyStateChanges(outcome.stateChanges);
      return outcome;
    }

    // No roll needed, apply changes directly
    this.applyStateChanges(assessment.stateChanges);
    return assessment;
  }

  private async handleDiceRoll(
    actionType: string,
    difficulty: number
  ): Promise<DiceResult> {
    const stat = this.getRelevantStat(actionType);
    const statValue = this.state.player.stats[stat];
    const modifier = this.getModifier(stat);

    return rollCheck(statValue, modifier, difficulty);
  }

  private getRelevantStat(actionType: string): 'FOR' | 'INT' | 'CHA' {
    const mapping: Record<string, 'FOR' | 'INT' | 'CHA'> = {
      'combat': 'FOR',
      'exploration': 'FOR',
      'technical': 'INT',
      'social': 'CHA'
    };
    return mapping[actionType] || 'INT';
  }

  private getModifier(stat: 'FOR' | 'INT' | 'CHA'): number {
    // Check inventory for stat-boosting items
    return this.state.player.inventory
      .filter(item => item.statBonus?.stat === stat)
      .reduce((sum, item) => sum + (item.statBonus?.bonus || 0), 0);
  }

  private applyStateChanges(changes: StateChanges): void {
    if (changes.hpChange) {
      this.state.player.hp = Math.max(0, this.state.player.hp + changes.hpChange);
    }

    if (changes.oxygenChange) {
      this.state.player.oxygen = Math.max(0, this.state.player.oxygen + changes.oxygenChange);
    }

    if (changes.locationChange) {
      this.state.currentLocation = changes.locationChange;
      this.state.visitedLocations.push(changes.locationChange);
    }

    if (changes.itemsAdded) {
      this.state.player.inventory.push(...changes.itemsAdded);
    }

    if (changes.itemsRemoved) {
      this.state.player.inventory = this.state.player.inventory.filter(
        item => !changes.itemsRemoved!.includes(item.name)
      );
    }

    if (changes.objectivesCompleted) {
      this.state.progress.objectivesCompleted.push(...changes.objectivesCompleted);
    }

    // Advance scene
    this.state.progress = advanceScene(this.state.progress);
    this.state.turnNumber++;
  }

  getState(): GameState {
    return { ...this.state };
  }
}
```

### Pacing System Port

**File**: `src/utils/pacing.ts`

```typescript
export function advanceScene(progress: SessionProgress): SessionProgress {
  const newProgress = {
    ...progress,
    currentScene: progress.currentScene + 1
  };

  newProgress.currentBeat = calculateBeat(newProgress);
  return newProgress;
}

function calculateBeat(progress: SessionProgress): SessionProgress['currentBeat'] {
  const percentage = (progress.currentScene / progress.totalScenes) * 100;

  if (percentage < 10) return 'intro';
  if (percentage < 45) return 'rising';
  if (percentage < 55) return 'midpoint';
  if (percentage < 85) return 'escalation';
  if (percentage < 95) return 'climax';
  return 'resolution';
}

export function getPacingInstructions(beat: SessionProgress['currentBeat']): string {
  const instructions: Record<SessionProgress['currentBeat'], string> = {
    intro: 'INTRODUCTION: Établis l\'ambiance, présente le danger. Tension: 2-3/10.',
    rising: 'ACTION MONTANTE: Escalade progressive. Découvertes inquiétantes. Tension: 4-5/10.',
    midpoint: 'RÉVÉLATION MAJEURE: Un secret crucial est découvert. Changement de direction. Tension: 6-7/10.',
    escalation: 'ESCALATION: La situation empire. Décisions difficiles. Tension: 7-8/10.',
    climax: 'CLIMAX: Confrontation finale. Tout se joue maintenant. Tension: 9-10/10.',
    resolution: 'RÉSOLUTION: Épilogue. Conséquences des actions. Tension: 3-5/10.'
  };

  return instructions[beat];
}

export function validateGameResponse(
  response: GameResponse,
  progress: SessionProgress
): boolean {
  // Prevent premature endings
  if (response.isEnding) {
    const allowedBeats: SessionProgress['currentBeat'][] = ['climax', 'resolution'];
    if (!allowedBeats.includes(progress.currentBeat)) {
      console.warn('LLM tried to end game prematurely, blocking');
      return false;
    }
  }

  // Validate tension level matches beat
  const expectedTension = getTensionRange(progress.currentBeat);
  if (response.tensionLevel < expectedTension.min || response.tensionLevel > expectedTension.max) {
    console.warn(`Tension level ${response.tensionLevel} outside expected range for ${progress.currentBeat}`);
    // Allow but log warning
  }

  return true;
}

function getTensionRange(beat: SessionProgress['currentBeat']): { min: number; max: number } {
  const ranges: Record<SessionProgress['currentBeat'], { min: number; max: number }> = {
    intro: { min: 2, max: 3 },
    rising: { min: 4, max: 5 },
    midpoint: { min: 6, max: 7 },
    escalation: { min: 7, max: 8 },
    climax: { min: 9, max: 10 },
    resolution: { min: 3, max: 5 }
  };

  return ranges[beat];
}
```

## IndexedDB Save System

**File**: `src/services/storage.ts`

```typescript
import Dexie, { Table } from 'dexie';

export class VoidWalkerDB extends Dexie {
  saves!: Table<GameState, string>;
  scenarios!: Table<Scenario, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('VoidWalkerDB');

    this.version(1).stores({
      saves: 'sessionId, startTime',
      scenarios: 'title, timestamp',
      settings: 'key'
    });
  }
}

export const db = new VoidWalkerDB();

// Save game state
export async function saveGame(state: GameState): Promise<void> {
  await db.saves.put(state);
}

// Load game state
export async function loadGame(sessionId: string): Promise<GameState | undefined> {
  return await db.saves.get(sessionId);
}

// List all saves
export async function listSaves(): Promise<GameState[]> {
  return await db.saves.orderBy('startTime').reverse().toArray();
}

// Delete save
export async function deleteSave(sessionId: string): Promise<void> {
  await db.saves.delete(sessionId);
}

// Save scenario for offline play
export async function saveScenario(scenario: Scenario): Promise<void> {
  await db.scenarios.put({
    ...scenario,
    timestamp: new Date().toISOString()
  } as any);
}

// Load cached scenarios
export async function getCachedScenarios(): Promise<Scenario[]> {
  return await db.scenarios.toArray();
}

// Settings
export async function saveSetting(key: string, value: any): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getSetting(key: string): Promise<any> {
  const result = await db.settings.get(key);
  return result?.value;
}
```

## PWA Configuration

### Manifest.json

```json
{
  "name": "Void Walker",
  "short_name": "VoidWalker",
  "description": "RPG spatial horrifique avec maître de jeu IA",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a1a",
  "background_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment"],
  "screenshots": [
    {
      "src": "/screenshots/gameplay.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ]
}
```

### Service Worker (via Vite PWA Plugin)

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.woff2', 'icons/*.png'],
      manifest: {
        // ... (see above)
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'llm-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
});
```

## Backend API Proxy (Optional)

**File**: `api/llm.ts` (Vercel serverless function)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, model, maxTokens, temperature } = await req.json();

    const genModel = genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature
      }
    });

    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('LLM API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
const MapModal = lazy(() => import('./components/MapModal'));
const InventoryModal = lazy(() => import('./components/InventoryModal'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showMap && <MapModal />}
    </Suspense>
  );
}
```

### Asset Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'game-logic': ['./src/controllers', './src/utils'],
          'ui': ['./src/components']
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true // Remove console.logs in production
      }
    }
  }
});
```

## Testing Strategy

### Unit Tests (Vitest)

**File**: `src/utils/__tests__/dice.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { rollD20, rollCheck, awardXP } from '../dice';

describe('Dice mechanics', () => {
  it('should roll between 1 and 20', () => {
    const rolls = Array.from({ length: 100 }, () => rollD20());
    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...rolls)).toBeLessThanOrEqual(20);
  });

  it('should handle critical success (nat 20)', () => {
    // Mock Math.random to return 20
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = rollCheck(3, 0, 25); // Impossible difficulty
    expect(result.success).toBe(true);
    expect(result.critical).toBe(true);
  });

  it('should award XP and level up stats', () => {
    let player = {
      stats: { FOR: 2, INT: 3, CHA: 2 },
      statProgress: { FOR: 9 }
    };

    player = awardXP(player, 'FOR');
    expect(player.stats.FOR).toBe(3);
    expect(player.statProgress.FOR).toBe(0);
  });
});
```

### Integration Tests

**File**: `src/__tests__/gameFlow.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GameController } from '../controllers/gameController';

describe('Game flow', () => {
  it('should process action and update state', async () => {
    const controller = new GameController(mockInitialState);

    const response = await controller.processAction('Explorer le hangar');

    expect(response.narrative).toBeDefined();
    expect(response.suggestions).toHaveLength(3);

    const newState = controller.getState();
    expect(newState.turnNumber).toBe(1);
  });
});
```

## Deployment Checklist

- [ ] Set up Vercel project
- [ ] Configure environment variables (GOOGLE_API_KEY)
- [ ] Build and test locally (`npm run build`)
- [ ] Test PWA installation on Android device
- [ ] Verify offline functionality
- [ ] Test on multiple screen sizes (360px to 768px width)
- [ ] Lighthouse PWA audit (score > 90)
- [ ] Performance testing (< 3s load time)
- [ ] Analytics setup (Plausible/Posthog)
- [ ] Error monitoring (Sentry)

## Migration Timeline

### Week 1-2: Foundation
- Set up React/TypeScript project
- Port all TypeScript types from Pydantic models
- Port dice mechanics and utility functions
- Set up IndexedDB with Dexie.js

### Week 3-4: Core Logic
- Port LLM client to fetch API
- Port prompt templates
- Port game controller and orchestration
- Port pacing system and validators

### Week 5-6: UI Components
- Build StatusBar component
- Build NarrativePanel with typewriter effect
- Build SuggestionButtons component
- Build CustomActionInput component

### Week 7-8: Modals & Polish
- Build MapModal component
- Build InventoryModal component
- Build DiceAnimation component
- Implement loading states and error handling

### Week 9: PWA Setup
- Configure Vite PWA plugin
- Set up service worker
- Test offline functionality
- Create app icons and screenshots

### Week 10: Testing & Deployment
- Port existing tests to Vitest
- Integration testing
- Lighthouse audit
- Deploy to Vercel
- Beta testing on Android devices

## Open Questions

1. **API Key Strategy**: User-provided vs. backend proxy vs. freemium model?
2. **Cloud Sync**: Should saves sync across devices? (Firebase, Supabase, or none)
3. **Monetization**: Free with ads, premium subscription, or fully free?
4. **Localization**: Support English in addition to French?
5. **Social Features**: Leaderboards, share scenarios, community content?

## Appendix: File Structure

```
void-walker-pwa/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── StatusBar.tsx
│   │   ├── NarrativePanel.tsx
│   │   ├── SuggestionButtons.tsx
│   │   ├── CustomActionInput.tsx
│   │   ├── MapModal.tsx
│   │   ├── InventoryModal.tsx
│   │   └── DiceAnimation.tsx
│   ├── controllers/
│   │   └── gameController.ts
│   ├── services/
│   │   ├── llmClient.ts
│   │   ├── prompts.ts
│   │   ├── parser.ts
│   │   ├── worldGen.ts
│   │   └── storage.ts
│   ├── utils/
│   │   ├── dice.ts
│   │   ├── pacing.ts
│   │   ├── validators.ts
│   │   └── cache.ts
│   ├── types/
│   │   ├── game.ts
│   │   ├── llm.ts
│   │   └── ui.ts
│   ├── content/
│   │   ├── classes.ts
│   │   └── items.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── api/
│   └── llm.ts (Vercel serverless function)
├── tests/
│   ├── dice.test.ts
│   ├── pacing.test.ts
│   └── gameFlow.test.ts
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Conclusion

The Void Walker codebase is exceptionally well-suited for porting to a PWA. The clean separation between game logic and presentation means **70% of the code can be directly translated** from Python to TypeScript with minimal changes. The remaining 30% (UI layer) requires a complete rewrite, but with a clear roadmap and modern web technologies (React, Tailwind, Vite), this is a straightforward 10-week project.

The resulting PWA will maintain all the unique features of the original game (two-phase action resolution, pacing system, dice mechanics) while providing a mobile-first, touch-friendly experience optimized for Android devices.
