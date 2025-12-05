# Void Walker — Game design specification

A command-line space horror RPG with AI-driven game mastering, procedural generation, and creative player agency.

---

## Table of contents

1. [Vision and core pillars](#1-vision-and-core-pillars)
2. [Technical stack](#2-technical-stack)
3. [LLM integration](#3-llm-integration)
4. [Game mechanics](#4-game-mechanics)
5. [Session structure](#5-session-structure)
6. [UI/UX specification](#6-uiux-specification)
7. [State management](#7-state-management)
8. [Content generation](#8-content-generation)
9. [Prompt templates](#9-prompt-templates)
10. [Project structure](#10-project-structure)
11. [Development phases](#11-development-phases)

---

## 1. Vision and core pillars

### Elevator pitch

Void Walker is a terminal-based space horror RPG where an AI game master creates unique, procedurally-generated stories. Each session is a self-contained adventure with mysteries to solve, threats to survive, and creative freedom for players to attempt any action they can imagine.

### Core pillars

1. **Emergent storytelling**: No two sessions are the same. The AI generates scenarios, NPCs, and plot twists based on player actions.

2. **Creative agency**: Players can attempt anything. "I seduce the corrupted AI with my drone" is a valid action that gets fairly evaluated.

3. **Meaningful consequences**: Dice rolls matter. Failures hurt. Permadeath creates tension.

4. **Atmospheric horror**: Environmental storytelling through datapads, radio transmissions, and signs of past events. Tension over jump scares.

5. **Accessible sessions**: Play for 5 minutes or 2 hours. Stories have proper endings, not arbitrary cutoffs.

### Target experience

- **Tone**: Dead Space meets Alien: Isolation meets tabletop RPG
- **Pacing**: Fast, punchy scenes. Something happens every turn.
- **Language**: French for all player-facing content, English for engine internals
- **Platform**: Any terminal with 120+ columns, Unicode support, 256 colors

---

## 2. Technical stack

### Language and dependencies

```
Language: Python 3.11+
```

**Core dependencies**:
```
google-genai           # Gemini/Gemma API
rich                   # Terminal UI, colors, panels, progress
textual                # TUI framework (optional, for complex layouts)
python-dotenv          # Environment config
pydantic               # Data validation and state models
```

**Development dependencies**:
```
pytest                 # Testing
pytest-asyncio         # Async test support
ruff                   # Linting
```

### API configuration

```python
# .env file
GOOGLE_API_KEY=your_key_here

# Model configuration
MODELS = {
    "world_gen": "gemini-2.5-pro",        # Initial scenario generation
    "gameplay": "gemini-2.5-flash-lite",   # Turn-by-turn narration
    "fallback": "gemma-3-27b-it",          # If flash-lite quota exceeded
}

RATE_LIMITS = {
    "gemini-2.5-pro": {"rpm": 2, "rpd": 50},
    "gemini-2.5-flash-lite": {"rpm": 15, "rpd": 1000},
    "gemma-3-27b-it": {"rpm": 30, "rpd": 14400},
}
```

### Compatibility requirements

- Terminal: 120x30 minimum, 160x40 recommended
- Unicode: Required for box drawing characters
- Colors: 256-color support (TERM=xterm-256color)
- Input: Standard stdin, UTF-8 encoding
- Tested with: kitty, iTerm2, Windows Terminal, VS Code terminal

---

## 3. LLM integration

### Model allocation strategy

| Task | Model | Calls/session | Rationale |
|------|-------|---------------|-----------|
| World generation | gemini-2.5-pro | 1 | Complex creative task, quality matters |
| Gameplay narration | gemini-2.5-flash-lite | 30-100 | Speed critical, benchmarked well |
| Fallback | gemma-3-27b-it | As needed | Quota overflow protection |

### Call budget per session length

| Session | Target turns | API calls | Model budget |
|---------|--------------|-----------|--------------|
| 5 min | 10-15 | ~20 | flash-lite only |
| 30 min | 40-60 | ~80 | flash-lite only |
| 2 hours | 150-200 | ~250 | May need fallback |

### Request structure

Every gameplay LLM call follows this pattern:

```python
async def make_game_call(
    game_state: GameState,
    player_input: str,
    dice_result: DiceResult | None = None
) -> GameResponse:
    """
    Single LLM call for one game turn.
    
    Flow:
    1. If no dice_result: LLM assesses action, returns difficulty
    2. If dice_result provided: LLM narrates outcome
    """
    prompt = build_prompt(game_state, player_input, dice_result)
    response = await call_llm(prompt)
    return parse_response(response)
```

### Response parsing

All gameplay responses must be valid JSON:

```python
class GameResponse(BaseModel):
    narrative: str                    # French, 2-4 sentences
    action_type: Literal["exploration", "interaction", "combat", "skill_check", "dialogue"]
    requires_roll: bool               # Does this action need a dice roll?
    difficulty: int | None            # 1-20 if requires_roll
    relevant_stat: Literal["FOR", "INT", "CHA"] | None
    suggested_modifier: int           # -5 to +5
    state_changes: StateChanges       # HP, inventory, location updates
    scene_elements: list[str]         # Visible/interactable things
    suggestions: list[str]            # 2-3 action suggestions
    tension_level: int                # 1-10, affects UI atmosphere
    is_ending: bool                   # True if story concludes
    ending_type: Literal["victory", "defeat", "escape", "mystery_solved"] | None
```

### Error handling

```python
class LLMError(Exception):
    pass

async def call_with_retry(prompt: str, max_retries: int = 3) -> str:
    for attempt in range(max_retries):
        try:
            response = await call_llm(prompt)
            parsed = json.loads(response)
            return GameResponse(**parsed)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            if extracted := extract_json(response):
                return GameResponse(**extracted)
        except RateLimitError:
            switch_to_fallback_model()
        except Exception as e:
            if attempt == max_retries - 1:
                raise LLMError(f"Failed after {max_retries} attempts: {e}")
            await asyncio.sleep(2 ** attempt)
```

---

## 4. Game mechanics

### Character stats

Three core stats, scale 1-5:

| Stat | Abbrev | Affects |
|------|--------|---------|
| Force | FOR | Physical actions, combat, endurance |
| Intelligence | INT | Hacking, repairs, puzzle-solving, perception |
| Charisme | CHA | Negotiation, deception, robot/AI interaction |

**Starting values by class**:

```python
CLASSES = {
    "Technicien": {"FOR": 2, "INT": 4, "CHA": 2, "hp": 8, "inventory": ["Multitool", "Scanner portable"]},
    "Marine": {"FOR": 4, "INT": 2, "CHA": 2, "hp": 12, "inventory": ["Pistolet laser", "Gilet pare-balles"]},
    "Diplomate": {"FOR": 2, "INT": 2, "CHA": 4, "hp": 8, "inventory": ["Traducteur universel", "Dossier confidentiel"]},
    "Médecin": {"FOR": 2, "INT": 3, "CHA": 3, "hp": 10, "inventory": ["Trousse médicale", "Stimulants"]},
    "Pilote": {"FOR": 3, "INT": 3, "CHA": 2, "hp": 10, "inventory": ["Clés du vaisseau", "Combinaison EVA"]},
}
```

### Stat progression

Stats increase through:

1. **Successful skill checks**: 10 successes using a stat = +1 to that stat (max 5)
2. **Story milestones**: Major achievements grant +1 to player-chosen stat
3. **Environmental learning**: Reading logs, studying tech = INT experience; surviving combat = FOR experience

```python
class StatProgression(BaseModel):
    for_xp: int = 0  # Successes until next FOR increase
    int_xp: int = 0
    cha_xp: int = 0
    xp_threshold: int = 10
```

### Dice system

D20-based resolution:

```python
def roll_check(
    base_roll: int,      # 1-20 from random
    stat_value: int,     # 1-5
    modifier: int,       # -5 to +5 situational
    difficulty: int      # 1-20 set by LLM
) -> CheckResult:
    total = base_roll + stat_value + modifier
    
    if base_roll == 1:
        return CheckResult.CRITICAL_FAILURE
    elif base_roll == 20:
        return CheckResult.CRITICAL_SUCCESS
    elif total >= difficulty:
        return CheckResult.SUCCESS
    else:
        return CheckResult.FAILURE
```

**Result effects**:

| Result | Effect |
|--------|--------|
| Critical success (nat 20) | Best possible outcome, bonus reward |
| Success | Action succeeds as intended |
| Failure | Action fails, minor consequence |
| Critical failure (nat 1) | Catastrophic failure, serious consequence |

### Health and death

- **HP**: Starts at 8-12 based on class
- **Damage sources**: Combat, environmental hazards, failed checks
- **Healing**: Medical items, rest areas, successful medical checks
- **Death**: HP reaches 0 = permadeath, session ends

```python
def apply_damage(player: Player, amount: int, source: str) -> str:
    player.hp = max(0, player.hp - amount)
    if player.hp == 0:
        return f"MORT: {source}"
    return f"-{amount} HP ({source})"
```

### Inventory system

Flexible inventory that accommodates LLM-generated items:

```python
class InventoryItem(BaseModel):
    name: str
    description: str | None = None
    item_type: Literal["weapon", "tool", "consumable", "key_item", "data", "misc"]
    uses: int | None = None      # None = unlimited, number = consumable
    stat_bonus: dict[str, int] = {}  # e.g., {"INT": 2} for a hacking tool
    
class Inventory(BaseModel):
    items: list[InventoryItem]
    max_slots: int = 8
    
    def add(self, item: InventoryItem) -> bool:
        if len(self.items) >= self.max_slots:
            return False
        self.items.append(item)
        return True
        
    def remove(self, item_name: str) -> InventoryItem | None:
        for i, item in enumerate(self.items):
            if item.name.lower() == item_name.lower():
                return self.items.pop(i)
        return None
```

---

## 5. Session structure

### Session length configuration

```python
SESSION_CONFIGS = {
    "quick": {"scenes": 5, "target_minutes": 5, "complexity": "simple"},
    "standard": {"scenes": 15, "target_minutes": 30, "complexity": "medium"},
    "extended": {"scenes": 40, "target_minutes": 120, "complexity": "complex"},
}
```

### Story beat structure

Every session follows this arc:

```
1. INTRO (1-2 scenes)
   - Establish setting
   - Introduce immediate situation
   - Give player initial objective

2. RISING ACTION (40% of scenes)
   - Exploration and discovery
   - Environmental storytelling
   - Minor encounters and obstacles
   - Clues about the main threat

3. MIDPOINT (1-2 scenes)
   - Major revelation or escalation
   - Stakes increase
   - New objective or complication

4. ESCALATION (30% of scenes)
   - Direct confrontations
   - Time pressure or resource scarcity
   - Multiple threats converge

5. CLIMAX (2-3 scenes)
   - Final confrontation or puzzle
   - Player choices determine outcome
   - High difficulty checks

6. RESOLUTION (1 scene)
   - Outcome narration
   - Epilogue based on ending type
   - Final stats display
```

### Scene tracking

```python
class SessionProgress(BaseModel):
    current_scene: int = 0
    total_scenes: int
    story_beat: Literal["intro", "rising", "midpoint", "escalation", "climax", "resolution"]
    objectives_completed: list[str] = []
    secrets_found: int = 0
    enemies_defeated: int = 0
    
    def advance(self) -> None:
        self.current_scene += 1
        self.story_beat = self._calculate_beat()
```

### Victory conditions

Generated per scenario, examples:

- **Escape**: Reach the escape pod / shuttle bay
- **Solve mystery**: Discover what happened to the crew
- **Eliminate threat**: Destroy the source of corruption
- **Rescue**: Find and evacuate survivors
- **Retrieve**: Secure critical data/artifact and escape

### End-game scoring

```python
class SessionScore(BaseModel):
    secrets_found: int           # Hidden logs, areas, items
    creative_solutions: int      # Non-obvious action successes
    enemies_defeated: int
    hp_remaining: int
    items_collected: int
    objectives_completed: int
    total_turns: int
    ending_type: str
    
    def calculate_total(self) -> int:
        base = self.objectives_completed * 100
        bonus = (
            self.secrets_found * 25 +
            self.creative_solutions * 50 +
            self.enemies_defeated * 15 +
            self.hp_remaining * 10 +
            self.items_collected * 5
        )
        multiplier = {"victory": 1.5, "escape": 1.2, "defeat": 0.5}.get(self.ending_type, 1.0)
        return int((base + bonus) * multiplier)
```

---

## 6. UI/UX specification

### Design principles

1. **Negative space**: Let the terminal breathe. Horror lives in emptiness.
2. **Minimal chrome**: No decorative borders during narration. UI appears when needed.
3. **Atmospheric color**: Muted palette with strategic red for danger.
4. **Expandable panels**: Map and inventory on toggle, not always visible.
5. **Smooth animations**: Dice rolls have suspense. Text appears progressively.

### Color palette

```python
COLORS = {
    # Base
    "text": "#888888",           # Muted gray for narration
    "text_bright": "#cccccc",    # Important text
    "background": "#000000",     # Pure black
    
    # Semantic
    "danger": "#ff4444",         # Threats, damage, warnings
    "success": "#44ff44",        # Positive outcomes
    "info": "#44ffff",           # Neutral information
    "highlight": "#ffff44",      # Player prompts, choices
    "item": "#ff8800",           # Items, loot
    
    # UI
    "border": "#333333",         # Subtle borders
    "dim": "#444444",            # Fog of war, unexplored
    "hp_bar": "#ff4444",
    "o2_bar": "#44ffff",
}
```

### Main layout (narrative focus)

```
────────────────────────────────────────────────────────────────────────────────
  HP 8/10 │ O₂ 100% │ ⚔ [Location] │ 🎒 4 objets                [Ship] │ 00:14:32
────────────────────────────────────────────────────────────────────────────────




                    [Narrative text appears here]
                    
                    Centered, with generous margins.
                    
                    Environmental details in dim gray.
                    
                    Threats in subtle red.
                    
                    Interactive elements highlighted.




────────────────────────────────────────────────────────────────────────────────
  Que faites-vous ?
────────────────────────────────────────────────────────────────────────────────
  > _
────────────────────────────────────────────────────────────────────────────────
[TAB] Suggestions  │  [i] Inventaire  │  [m] Carte  │  [?] Aide
```

### Expandable panels

**Map panel** (toggle with `m`):

```
┌─ CARTE ──────────────────────────────────┐
│                                          │
│       ╭───╮   ╭───╮                      │
│       │BRI│───│REA│  ← Danger            │
│       ╰─┬─╯   ╰─┬─╯                      │
│         │       │                        │
│       ╭─┴─╮   ╭─┴─╮                      │
│       │QRT│───│MED│                      │
│       ╰───╯   ╰─┬─╯                      │
│               ╭─┴─╮                      │
│               │KIT│  ← Vous              │
│               ╰───╯                      │
│                                          │
│  █ Vous  ░ Visité  ▒ Danger  ○ Inconnu   │
└──────────────────────────────────────────┘
```

**Inventory panel** (toggle with `i`):

```
┌─ INVENTAIRE (4/8) ───────────────────────┐
│                                          │
│  1. Lampe torche                         │
│     Éclaire les zones sombres            │
│                                          │
│  2. Multitool              [INT +1]      │
│     Réparations, piratage basique        │
│                                          │
│  3. Drone cassé                          │
│     Inopérant, pièces utilisables        │
│                                          │
│  4. Ruban adhésif          [3 uses]      │
│     Mille et un usages                   │
│                                          │
└──────────────────────────────────────────┘
```

**Suggestions panel** (toggle with TAB):

```
┌─ SUGGESTIONS ────────────────────────────┐
│                                          │
│  • Se cacher dans la chambre froide      │
│  • Fouiller les ustensiles               │
│  • Passer par le conduit de ventilation  │
│                                          │
└──────────────────────────────────────────┘
```

### Dice roll animation

2-second animated roll with suspense:

```python
async def animate_dice_roll(final_value: int, stat: str, modifier: int, difficulty: int):
    """
    Display animated dice roll with fake intermediate values.
    Total duration: ~2 seconds
    """
    # Phase 1: Rapid cycling (1 second)
    for _ in range(20):
        fake = random.randint(1, 20)
        display_dice_value(fake, spinning=True)
        await asyncio.sleep(0.05)
    
    # Phase 2: Slowing down (0.7 seconds)
    delays = [0.1, 0.12, 0.15, 0.2, 0.25]
    for delay in delays:
        fake = random.randint(1, 20)
        display_dice_value(fake, spinning=True)
        await asyncio.sleep(delay)
    
    # Phase 3: Final reveal (0.3 seconds)
    await asyncio.sleep(0.3)
    display_dice_value(final_value, spinning=False)
    
    # Show calculation
    total = final_value + stat_value + modifier
    display_calculation(final_value, stat, modifier, total, difficulty)
```

Dice display format:

```
                    ┌─────────┐
                    │  ●   ●  │
                    │    ●    │         [Spinning numbers: 7, 14, 3, 19, 11...]
                    │  ●   ●  │
                    └─────────┘
                    
                    Jet de dé: 17
                    INT (4) + Outil (+2) = +6
                    ─────────────────────
                    Total: 23 vs Difficulté 15
                    
                    ✓ SUCCÈS
```

### Blinking alert text

For high-tension moments, danger warnings:

```python
def blink_text(text: str, color: str = "red") -> str:
    """
    Returns text with ANSI blink escape codes.
    Use sparingly for danger/alerts only.
    """
    # Only blink on tension_level >= 7
    return f"\033[5m\033[31m{text}\033[0m"
```

Usage in narration:
```
Le détecteur de mouvement s'affole.

[ALERTE]  ← Blinking red

Quelque chose approche. Vite.
```

### Quick commands

| Key | Action |
|-----|--------|
| `i` | Toggle inventory panel |
| `m` | Toggle map panel |
| `TAB` | Toggle suggestions |
| `?` or `h` | Help screen |
| `q` | Quit (with confirmation) |
| `Ctrl+C` | Force quit |
| `↑/↓` | Command history |

### Responsive layout

```python
def calculate_layout(term_width: int, term_height: int) -> Layout:
    """
    Adapt UI to terminal size.
    """
    if term_width >= 160:
        # Wide terminal: can show side panels
        narrative_width = 100
        side_panel_width = 40
    elif term_width >= 120:
        # Standard: toggleable panels overlay
        narrative_width = 80
        side_panel_width = 35
    else:
        # Narrow: minimal UI
        narrative_width = term_width - 4
        side_panel_width = term_width - 4
    
    return Layout(
        narrative_width=narrative_width,
        side_panel_width=side_panel_width,
        margin_x=(term_width - narrative_width) // 2,
    )
```

---

## 7. State management

### Game state model

```python
class GameState(BaseModel):
    # Session info
    session_id: str
    session_config: str  # "quick", "standard", "extended"
    started_at: datetime
    
    # Player
    player: Player
    
    # World
    scenario: Scenario
    current_location: str
    visited_locations: set[str]
    discovered_secrets: list[str]
    
    # Progress
    progress: SessionProgress
    turn_number: int
    
    # History (for context)
    recent_events: list[str]  # Last 10 narrations, summarized
    key_npcs_met: list[NPC]
    important_items_found: list[str]
    
    # Meta
    tension_level: int  # 1-10, affects narration tone
    active_threats: list[str]
    available_exits: list[str]

class Player(BaseModel):
    name: str
    class_name: str
    stats: dict[str, int]  # FOR, INT, CHA
    hp: int
    max_hp: int
    inventory: Inventory
    stat_progress: StatProgression

class Scenario(BaseModel):
    title: str
    setting: str  # Ship name, station, etc.
    premise: str  # 2-3 sentence setup
    main_threat: str
    victory_condition: str
    key_locations: list[Location]
    key_npcs: list[NPC]
    secrets: list[Secret]
    
class Location(BaseModel):
    id: str
    name: str
    description: str
    connections: list[str]  # IDs of connected locations
    items: list[InventoryItem]
    threats: list[str]
    secrets: list[str]
    visited: bool = False
```

### Context window management

The system prompt includes compressed state to stay within token limits:

```python
def build_context(state: GameState, max_tokens: int = 2000) -> str:
    """
    Build compressed state for system prompt.
    Prioritize: current situation > recent events > world facts
    """
    sections = []
    
    # Always include: current situation
    sections.append(f"""
SITUATION ACTUELLE:
- Lieu: {state.current_location}
- PV: {state.player.hp}/{state.player.max_hp}
- Menaces actives: {', '.join(state.active_threats) or 'Aucune'}
- Tension: {state.tension_level}/10
""")
    
    # Always include: player capabilities
    sections.append(f"""
JOUEUR ({state.player.name}, {state.player.class_name}):
- FOR {state.player.stats['FOR']} | INT {state.player.stats['INT']} | CHA {state.player.stats['CHA']}
- Inventaire: {', '.join(i.name for i in state.player.inventory.items)}
""")
    
    # Include if space: recent events (last 5)
    if state.recent_events:
        sections.append(f"""
ÉVÉNEMENTS RÉCENTS:
{chr(10).join('- ' + e for e in state.recent_events[-5:])}
""")
    
    # Include if space: world knowledge
    sections.append(f"""
SCÉNARIO:
- Objectif: {state.scenario.victory_condition}
- Menace principale: {state.scenario.main_threat}
- Lieux connus: {', '.join(state.visited_locations)}
""")
    
    return '\n'.join(sections)
```

### State persistence

```python
# State saved to JSON after each turn
def save_state(state: GameState, path: Path) -> None:
    with open(path, 'w') as f:
        json.dump(state.model_dump(), f, indent=2, default=str)

def load_state(path: Path) -> GameState:
    with open(path) as f:
        return GameState(**json.load(f))
```

### Story beat pacing

The LLM needs explicit instructions about where we are in the story arc. The engine controls beat transitions deterministically; the LLM receives pacing directives that guide its narrative output.

#### Beat calculation (engine-controlled)

```python
class SessionProgress(BaseModel):
    current_scene: int = 0
    total_scenes: int
    story_beat: str = "intro"
    objectives_completed: list[str] = []
    secrets_found: int = 0
    enemies_defeated: int = 0
    
    def advance_scene(self) -> None:
        """Called after each meaningful player action."""
        self.current_scene += 1
        self.story_beat = self._calculate_beat()
    
    def _calculate_beat(self) -> str:
        """Determine story beat based on progress percentage."""
        if self.current_scene >= self.total_scenes:
            return "resolution"
        
        progress_pct = self.current_scene / self.total_scenes
        
        if progress_pct < 0.10:
            return "intro"
        elif progress_pct < 0.45:
            return "rising"
        elif progress_pct < 0.55:
            return "midpoint"
        elif progress_pct < 0.85:
            return "escalation"
        else:
            return "climax"
```

#### Pacing context injection

This function builds the pacing directives injected into every gameplay prompt:

```python
def build_pacing_context(progress: SessionProgress, scenario: Scenario) -> str:
    """
    Tell the LLM where we are in the story and what to do about it.
    """
    
    pacing_instructions = {
        "intro": """
PHASE: INTRODUCTION (scène {current}/{total})
DIRECTIVES:
- Établis l'atmosphère et la situation initiale
- Donne au joueur son objectif principal
- Indices subtils sur la menace, pas de confrontation directe
- Tension cible: 3-4/10
""",
        "rising": """
PHASE: MONTÉE DRAMATIQUE (scène {current}/{total})
DIRECTIVES:
- Exploration et découvertes
- Indices sur ce qui s'est passé (datapads, traces, messages)
- Obstacles mineurs, premiers signes de la menace
- Rencontres avec survivants/PNJ possibles
- Tension cible: 4-6/10, augmente progressivement
""",
        "midpoint": """
PHASE: POINT MÉDIAN (scène {current}/{total})
DIRECTIVES:
- C'est le moment d'une RÉVÉLATION MAJEURE ou ESCALADE
- Le joueur doit comprendre la vraie nature de la menace
- Introduis un nouvel objectif ou une complication importante
- Tension cible: 6-7/10
""",
        "escalation": """
PHASE: ESCALADE (scène {current}/{total})
DIRECTIVES:
- Confrontations directes avec la menace
- Ressources limitées, pression temporelle
- Les choix ont des conséquences lourdes
- Prépare le terrain pour le climax
- Tension cible: 7-8/10
""",
        "climax": """
PHASE: CLIMAX (scène {current}/{total})
DIRECTIVES:
- Confrontation finale ou défi ultime
- Le joueur doit utiliser ce qu'il a appris/trouvé
- Difficultés élevées (DC 15+)
- Possibilité de victoire OU défaite selon les actions
- Tension cible: 9-10/10
""",
        "resolution": """
PHASE: RÉSOLUTION (scène finale)
DIRECTIVES:
- Narre l'épilogue basé sur le résultat des actions du joueur
- Récapitule brièvement le parcours
- Le champ "is_ending" DOIT être true
- Choisis ending_type parmi: victory, defeat, escape, mystery_solved
""",
    }
    
    template = pacing_instructions[progress.story_beat]
    
    context = template.format(
        current=progress.current_scene,
        total=progress.total_scenes
    )
    
    # Add objective tracking
    context += f"""
OBJECTIF PRINCIPAL: {scenario.victory_condition}
OBJECTIFS COMPLÉTÉS: {', '.join(progress.objectives_completed) or 'Aucun'}
SECRETS DÉCOUVERTS: {progress.secrets_found}/{len(scenario.secrets)}
"""
    
    # Add proximity warnings for session end
    scenes_remaining = progress.total_scenes - progress.current_scene
    if scenes_remaining <= 3 and progress.story_beat != "resolution":
        context += f"""
⚠️ FIN DE SESSION PROCHE ({scenes_remaining} scènes restantes)
- Dirige activement l'histoire vers une conclusion
- Prochaine phase recommandée: {"climax" if scenes_remaining > 1 else "resolution"}
- Augmente la tension et les enjeux maintenant
"""
    
    return context
```

#### Engine vs LLM control

| Aspect | Controlled by | Notes |
|--------|---------------|-------|
| Scene count | **Engine** | Deterministic based on session config |
| Beat transitions | **Engine** | Calculated from scene progress % |
| Narrative content | **LLM** | Creative, guided by beat directives |
| Tension level | **LLM** | Suggested by beat, LLM sets exact value |
| Difficulty of checks | **LLM** | Higher in climax, lower in intro |
| When `is_ending=true` | **LLM** | But validated by engine |
| Ending type | **LLM** | Based on player success/failure |

#### Response validation

The engine validates LLM responses to ensure session structure is respected:

```python
def validate_response(response: GameResponse, progress: SessionProgress) -> GameResponse:
    """
    Ensure LLM respects session structure.
    Called after parsing every LLM response.
    """
    
    # Prevent premature endings (LLM trying to end story too early)
    if response.is_ending and progress.story_beat not in ("climax", "resolution"):
        response.is_ending = False
        response.ending_type = None
        # Optionally log this for debugging
    
    # Force ending on final scene (LLM didn't end when it should)
    if progress.current_scene >= progress.total_scenes:
        if not response.is_ending:
            response.is_ending = True
            response.ending_type = response.ending_type or "escape"
            response.narrative += "\n\n[Votre temps est écoulé...]"
    
    # Clamp tension to reasonable range for beat
    tension_ranges = {
        "intro": (2, 5),
        "rising": (4, 7),
        "midpoint": (5, 8),
        "escalation": (6, 9),
        "climax": (8, 10),
        "resolution": (3, 7),
    }
    min_t, max_t = tension_ranges.get(progress.story_beat, (1, 10))
    response.tension_level = max(min_t, min(max_t, response.tension_level))
    
    return response
```

#### Complete gameplay prompt with pacing

Here's how the full gameplay prompt is assembled:

```python
def build_gameplay_prompt(
    state: GameState, 
    player_input: str, 
    dice_result: DiceResult | None = None
) -> str:
    """
    Build the complete prompt for a gameplay turn.
    Includes pacing context, game state, and player action.
    """
    
    return f"""Tu es le maître de jeu d'un RPG d'horreur spatiale "Void Walker".

{build_pacing_context(state.progress, state.scenario)}

SITUATION ACTUELLE:
- Lieu: {state.current_location}
- PV: {state.player.hp}/{state.player.max_hp}
- Menaces actives: {', '.join(state.active_threats) or 'Aucune'}
- Sorties disponibles: {', '.join(state.available_exits)}

JOUEUR ({state.player.name}, {state.player.class_name}):
- FOR {state.player.stats['FOR']} | INT {state.player.stats['INT']} | CHA {state.player.stats['CHA']}
- Inventaire: {', '.join(i.name for i in state.player.inventory.items)}

ÉVÉNEMENTS RÉCENTS:
{chr(10).join('- ' + e for e in state.recent_events[-5:])}

SCÉNARIO:
- Menace principale: {state.scenario.main_threat}
- Lieux visités: {', '.join(state.visited_locations)}

{build_dice_context(dice_result) if dice_result else ''}

ACTION DU JOUEUR: {player_input}

RÈGLES DE RÉPONSE:
1. Réponds UNIQUEMENT en JSON valide (pas de texte avant/après)
2. Narration en français, 2-4 phrases, atmosphère horrifique
3. Respecte les DIRECTIVES de la phase actuelle
4. Évalue équitablement les actions créatives
5. Si l'action nécessite un jet, définis difficulty (1-20)
6. Respecte ABSOLUMENT les résultats des dés fournis

JSON attendu:
{{
  "narrative": "string",
  "action_type": "exploration|interaction|combat|skill_check|dialogue",
  "requires_roll": boolean,
  "difficulty": null ou 1-20,
  "relevant_stat": null ou "FOR"|"INT"|"CHA",
  "suggested_modifier": -5 à +5,
  "state_changes": {{...}},
  "scene_elements": ["..."],
  "suggestions": ["..."],
  "tension_level": 1-10,
  "is_ending": boolean,
  "ending_type": null ou "victory"|"defeat"|"escape"|"mystery_solved"
}}"""
```

---

## 8. Content generation

### Setting variety

The world generator can create scenarios in any of these settings:

```python
SETTING_TYPES = [
    "derelict_ship",      # Abandoned vessel drifting in space
    "space_station",      # Orbital station with multiple modules
    "planetary_colony",   # Surface base on hostile world
    "asteroid_mine",      # Mining facility in asteroid belt
    "alien_ruins",        # Ancient extraterrestrial structure
    "research_lab",       # Deep space research installation
    "prison_transport",   # Damaged prisoner ship
    "generation_ship",    # Massive colony vessel
]

THREAT_TYPES = [
    "corrupted_ai",       # Ship AI gone hostile
    "alien_organism",     # Unknown life form
    "infected_crew",      # Biological contamination
    "rogue_robots",       # Security systems malfunction
    "cosmic_horror",      # Reality-bending phenomenon
    "saboteur",           # Human antagonist
    "environmental",      # Ship systems failing
]
```

### Environmental storytelling elements

The LLM should incorporate these narrative devices:

```python
STORYTELLING_ELEMENTS = {
    "datapads": [
        "Journal personnel d'un membre d'équipage",
        "Rapport de maintenance avec notes inquiétantes",
        "Message d'urgence non envoyé",
        "Logs médicaux décrivant des symptômes étranges",
    ],
    "wall_messages": [
        "Graffiti désespéré écrit avec du sang/peinture",
        "Symboles mystérieux gravés",
        "Flèches directionnelles avec avertissements",
        "Compte à rebours ou dates importantes",
    ],
    "radio_comms": [
        "Transmissions fantômes de l'équipage disparu",
        "Signaux de détresse automatiques",
        "Communications interceptées",
        "Voix de l'IA corrompue",
    ],
    "physical_evidence": [
        "Traces de lutte",
        "Équipement abandonné",
        "Barricades improvisées",
        "Cadavres ou restes",
    ],
}
```

### NPC templates

```python
NPC_ARCHETYPES = [
    {"type": "survivor", "disposition": "fearful", "knowledge": "partial"},
    {"type": "android", "disposition": "neutral", "knowledge": "technical"},
    {"type": "hostile", "disposition": "aggressive", "knowledge": "none"},
    {"type": "corrupted", "disposition": "unstable", "knowledge": "cryptic"},
    {"type": "authority", "disposition": "demanding", "knowledge": "full"},
]
```

---

## 9. Prompt templates

### World generation prompt (gemini-2.5-pro)

```
You are generating a scenario for a space horror RPG called "Void Walker".

Create a unique, self-contained scenario with the following parameters:
- Session length: {session_type} ({scene_count} scenes)
- Complexity: {complexity}

Generate a JSON response with this structure:
{
  "title": "Scenario title in French",
  "setting_type": "one of: derelict_ship, space_station, planetary_colony, asteroid_mine, alien_ruins, research_lab, prison_transport, generation_ship",
  "setting_name": "Name of the location (ship name, station name, etc.)",
  "premise": "2-3 sentences setting up the situation, in French",
  "main_threat": "The primary antagonist/danger",
  "threat_description": "How the threat manifests and behaves",
  "victory_condition": "What the player must do to win, in French",
  "starting_location": "Where the player begins",
  "locations": [
    {
      "id": "unique_id",
      "name": "Location name in French",
      "description": "Atmospheric description in French",
      "connections": ["connected_location_ids"],
      "initial_items": ["item names"],
      "potential_threats": ["what dangers might be here"],
      "secrets": ["hidden things to discover"]
    }
  ],
  "key_npcs": [
    {
      "name": "NPC name",
      "type": "survivor/android/hostile/corrupted",
      "location": "location_id",
      "description": "Brief description",
      "knowledge": "What they know that might help the player"
    }
  ],
  "story_secrets": [
    "Major plot revelations the player can discover"
  ],
  "environmental_clues": [
    "Datapads, messages, evidence to scatter through locations"
  ]
}

Requirements:
- All player-facing text in French
- Atmosphere: tense, unsettling, mysterious
- Include 6-12 interconnected locations
- Include 2-4 NPCs (alive or dead)
- Include 3-5 discoverable secrets
- Victory must be achievable but challenging
- Include environmental storytelling (datapads, messages, evidence)
```

### Gameplay prompt (gemini-2.5-flash-lite)

The complete gameplay prompt is defined in **Section 7 > Story beat pacing > Complete gameplay prompt with pacing**.

It includes:
- Pacing context with beat-specific directives
- Current game state (location, HP, threats, inventory)
- Recent events for context continuity
- Scenario information
- Dice results (if applicable)
- Player action
- JSON response schema

### Dice context injection

```python
def build_dice_context(result: DiceResult) -> str:
    if result is None:
        return ""
    
    outcome_map = {
        CheckResult.CRITICAL_SUCCESS: "SUCCÈS CRITIQUE (20 naturel) - résultat exceptionnel",
        CheckResult.SUCCESS: "SUCCÈS - l'action réussit",
        CheckResult.FAILURE: "ÉCHEC - l'action échoue avec conséquences",
        CheckResult.CRITICAL_FAILURE: "ÉCHEC CRITIQUE (1 naturel) - catastrophe",
    }
    
    return f"""
RÉSULTAT DU DÉ:
- Jet: {result.roll} (dé) + {result.stat_value} (stat) + {result.modifier} (mod) = {result.total}
- Difficulté: {result.difficulty}
- Résultat: {outcome_map[result.outcome]}

IMPORTANT: Tu DOIS narrer un {result.outcome.value}. Pas de demi-succès sur un échec.
"""
```

---

## 10. Project structure

```
void-walker/
├── README.md
├── pyproject.toml
├── .env.example
├── .gitignore
│
├── void_walker/
│   ├── __init__.py
│   ├── __main__.py              # Entry point
│   ├── config.py                # Settings, API config
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── game.py              # Main game loop
│   │   ├── state.py             # GameState, Player, etc.
│   │   ├── dice.py              # Dice rolling, checks
│   │   └── progression.py       # XP, stat growth
│   │
│   ├── llm/
│   │   ├── __init__.py
│   │   ├── client.py            # API wrapper, rate limiting
│   │   ├── prompts.py           # Prompt templates
│   │   ├── parser.py            # Response parsing
│   │   └── world_gen.py         # Scenario generation
│   │
│   ├── ui/
│   │   ├── __init__.py
│   │   ├── terminal.py          # Terminal setup, colors
│   │   ├── layout.py            # Screen layout management
│   │   ├── panels.py            # Map, inventory, help panels
│   │   ├── dice_animation.py    # Dice roll animation
│   │   ├── input.py             # Command parsing
│   │   └── text.py              # Text rendering, effects
│   │
│   ├── content/
│   │   ├── __init__.py
│   │   ├── classes.py           # Character classes
│   │   ├── items.py             # Item definitions
│   │   └── settings.py          # Setting templates
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logging.py
│       └── save.py              # State persistence
│
├── tests/
│   ├── __init__.py
│   ├── test_dice.py
│   ├── test_state.py
│   ├── test_parser.py
│   └── test_ui.py
│
└── data/
    ├── saves/                   # Save files
    └── logs/                    # Game logs for debugging
```

### Entry point

```python
# void_walker/__main__.py
import asyncio
from void_walker.core.game import Game
from void_walker.ui.terminal import setup_terminal

def main():
    try:
        setup_terminal()
        game = Game()
        asyncio.run(game.run())
    except KeyboardInterrupt:
        print("\n\nPartie interrompue.")
    finally:
        cleanup_terminal()

if __name__ == "__main__":
    main()
```

### Running the game

```bash
# Development
python -m void_walker

# Or with entry point
void-walker

# Quick session
void-walker --session quick

# Debug mode (verbose logging, no animations)
void-walker --debug
```

---

## 11. Development phases

### Phase 1: Core loop (MVP)

**Goal**: Playable game loop with basic UI

- [ ] Project setup, dependencies
- [ ] LLM client with rate limiting
- [ ] Basic state management
- [ ] Simple terminal UI (no panels)
- [ ] Dice rolling system
- [ ] Single hardcoded scenario for testing
- [ ] Basic game loop: input → LLM → display

**Deliverable**: Can play a full session with one scenario

### Phase 2: World generation

**Goal**: Procedural scenario creation

- [ ] World generation prompt and parsing
- [ ] Multiple setting types
- [ ] NPC system
- [ ] Environmental storytelling integration
- [ ] Session length configuration

**Deliverable**: Every session is unique

### Phase 3: Full UI

**Goal**: Polished terminal experience

- [ ] Responsive layout system
- [ ] Map panel with fog of war
- [ ] Inventory panel
- [ ] Dice animation
- [ ] Blinking alerts
- [ ] Color theming
- [ ] Quick commands

**Deliverable**: Looks and feels like a real game

### Phase 4: Polish

**Goal**: Complete experience

- [ ] Character creation flow
- [ ] Stat progression system
- [ ] End-game scoring and stats
- [ ] Help system
- [ ] Save/load (between sessions for character, not mid-session)
- [ ] Sound effects (terminal bells)
- [ ] Multiple ending types

**Deliverable**: Release-ready

### Phase 5: Extras

**Goal**: Extended features

- [ ] Achievement system
- [ ] Unlockable classes
- [ ] Scenario seeds (shareable codes)
- [ ] Statistics tracking across sessions
- [ ] Claude Code playtest mode (automated testing)

---

## Appendix A: Testing with Claude Code

The game should be playable by Claude Code in agent mode for automated testing:

```python
# void_walker/utils/autoplay.py

class AutoPlayer:
    """
    Automated player for testing.
    Can be driven by another LLM or scripted.
    """
    
    async def decide_action(self, game_state: GameState, suggestions: list[str]) -> str:
        """
        Decide what action to take.
        For testing: randomly choose from suggestions or explore.
        For LLM-driven: ask Claude for optimal play.
        """
        if random.random() < 0.7 and suggestions:
            return random.choice(suggestions)
        else:
            return self._generate_creative_action(game_state)
```

Run automated playtest:
```bash
void-walker --autoplay --sessions 10 --output playtest_log.json
```

---

## Appendix B: Localization notes

All player-facing strings in French:

```python
# void_walker/i18n.py

STRINGS = {
    "prompt": "Que faites-vous ?",
    "roll_success": "SUCCÈS",
    "roll_failure": "ÉCHEC",
    "roll_crit_success": "SUCCÈS CRITIQUE !",
    "roll_crit_failure": "ÉCHEC CRITIQUE !",
    "death": "Vous êtes mort.",
    "victory": "Victoire !",
    "game_over": "Fin de partie",
    "hp": "PV",
    "inventory": "Inventaire",
    "map": "Carte",
    "help": "Aide",
    "quit_confirm": "Quitter la partie ? (o/n)",
    # ... etc
}
```

Engine internals, logs, and debug output remain in English.

---

## Appendix C: Example gameplay transcript

```
────────────────────────────────────────────────────────────────────────────────
  HP 10/10 │ O₂ 100% │ ⚔ Sas d'entrée │ 🎒 2 objets          USS PROMETHEUS │ 00:00:45
────────────────────────────────────────────────────────────────────────────────




                    Le sas s'ouvre dans un grincement métallique.

                    L'air qui s'échappe du vaisseau est vicié, chargé d'une odeur
                    de renfermé et de quelque chose d'autre. Quelque chose de 
                    chimique. Les lumières de secours projettent une lueur rouge
                    intermittente sur les parois.

                    Le couloir principal s'étend devant vous. À gauche, un panneau
                    indique "PONT DE COMMANDEMENT". À droite, "QUARTIERS ÉQUIPAGE".
                    Droit devant, les ténèbres.




────────────────────────────────────────────────────────────────────────────────
  Que faites-vous ?
────────────────────────────────────────────────────────────────────────────────
  > j'allume ma lampe et j'examine les murs pour des traces
────────────────────────────────────────────────────────────────────────────────


                    Le faisceau de ta lampe balaie les parois métalliques.

                    ┌─────────┐
                    │  ●   ●  │
                    │    ●    │        12... 7... 19... 3... 15...
                    │  ●   ●  │
                    └─────────┘
                    
                    Jet de dé: 14
                    INT (4) + Lampe (+1) = +5
                    ─────────────────────
                    Total: 19 vs Difficulté 12
                    
                    ✓ SUCCÈS


                    Ta lampe révèle des marques de griffes profondes sur le métal.
                    Quelque chose a été traîné ici — des traces sombres mènent vers
                    les quartiers. Sur le mur, gravé à la hâte:

                    "NE PAS ALLER AU PONT - ELLE ÉCOUTE"

                    Tu remarques aussi un datapad abandonné au sol, son écran 
                    fissuré mais encore allumé.




────────────────────────────────────────────────────────────────────────────────
  Que faites-vous ?
────────────────────────────────────────────────────────────────────────────────
  > _
```

---

*Document version: 1.1*
*Last updated: 2025-12-04*
*For use with Claude Code*
