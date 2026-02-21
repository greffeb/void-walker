# Void Walker — Structural Design Decisions

> These four decisions shape every system in the game.
> They must be resolved BEFORE Phase 0.

---

## 1. Internationalization (i18n)

### Principle

The engine is **language-agnostic**. All player-facing text lives in locale
files. The engine only manipulates string keys, never raw French or English.

### Architecture

```
src/
├── i18n/
│   ├── index.ts          # t() function, locale loader, current locale
│   ├── types.ts          # StringKey type (union of all valid keys)
│   ├── locales/
│   │   ├── fr.ts         # French strings (default, primary)
│   │   └── en.ts         # English strings
│   └── narrative/
│       ├── fr/           # French narrative templates
│       │   ├── physical.ts
│       │   ├── technical.ts
│       │   ├── social.ts
│       │   ├── creative.ts
│       │   └── environmental.ts
│       └── en/           # English narrative templates
│           ├── physical.ts
│           └── ...
```

### The `t()` function

```typescript
// Simple, synchronous, no external library needed.

type Locale = 'fr' | 'en';

let currentLocale: Locale = 'fr';

// UI strings: menus, labels, system messages
const UI_STRINGS: Record<Locale, Record<string, string>> = {
  fr: {
    'ui.play': 'Jouer',
    'ui.inventory': 'Inventaire',
    'ui.map': 'Carte',
    'dice.success': 'SUCCÈS',
    'dice.failure': 'ÉCHEC',
    'dice.criticalSuccess': 'SUCCÈS CRITIQUE !',
    'dice.criticalFailure': 'ÉCHEC CRITIQUE !',
    'game.hp': 'PV',
    'game.oxygen': 'O₂',
    'game.youDied': 'Vous êtes mort.',
    'game.victory': 'Victoire !',
    'parser.reformulate': 'Vous hésitez un instant. Que tentez-vous exactement ?',
    // ...200-300 keys total
  },
  en: {
    'ui.play': 'Play',
    'ui.inventory': 'Inventory',
    'ui.map': 'Map',
    'dice.success': 'SUCCESS',
    'dice.failure': 'FAILURE',
    'dice.criticalSuccess': 'CRITICAL SUCCESS!',
    'dice.criticalFailure': 'CRITICAL FAILURE!',
    'game.hp': 'HP',
    'game.oxygen': 'O₂',
    'game.youDied': 'You are dead.',
    'game.victory': 'Victory!',
    'parser.reformulate': 'You hesitate for a moment. What exactly are you trying to do?',
  },
};

function t(key: string, params?: Record<string, string | number>): string {
  let text = UI_STRINGS[currentLocale]?.[key] ?? UI_STRINGS['fr'][key] ?? `[${key}]`;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
```

### What's localized vs. what's not

| Content | Localized? | How |
|---------|-----------|-----|
| UI labels (menus, buttons, headers) | ✅ Yes | `t('ui.inventory')` |
| System messages (dice, game over) | ✅ Yes | `t('dice.criticalSuccess')` |
| Narrative templates | ✅ Yes | Separate template files per locale |
| Scenario content (descriptions, dialogue) | ✅ Yes | Each scenario has locale-specific text |
| Item names and descriptions | ✅ Yes | Locale field in item definition |
| Verb aliases (parser input) | ✅ Both | Parser always accepts BOTH FR and EN |
| Engine internals, logs, types | ❌ No | Always English |
| Error messages (dev-facing) | ❌ No | Always English |

### Item localization

```typescript
interface ItemDefinition {
  id: string;
  type: ItemType;
  properties: PropertyId[];
  // Localized fields
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  // Gameplay (not localized)
  statBonus?: { stat: StatName; bonus: number };
  uses?: number;
}

// Example
const DATAPAD: ItemDefinition = {
  id: 'datapad',
  type: 'data',
  properties: ['tangible', 'small', 'electronic', 'readable', 'flat', 'fragile'],
  name: { fr: 'Datapad', en: 'Datapad' },
  description: {
    fr: 'Terminal portable avec des données stockées.',
    en: 'Portable terminal with stored data.',
  },
};
```

### Scenario localization

Scenarios have all player-facing text in both languages:

```typescript
interface ScenarioLocaleData {
  title: string;
  premise: string;
  introNarration: string;
  locations: Record<string, {
    name: string;
    description: string;
    firstVisitNarration: string;
  }>;
  npcs: Record<string, {
    name: string;
    description: string;
    dialogueLines: Record<string, string>; // keyed by situation
  }>;
  environmentalClues: Record<string, string>;
  victoryNarration: string;
  defeatNarration: string;
}

interface Scenario {
  id: string;
  // Structure (language-independent)
  graph: ScenarioGraph;
  modules: ModuleSlot[];
  victoryConditions: VictoryCondition[];
  // Localized content
  locale: {
    fr: ScenarioLocaleData;
    en: ScenarioLocaleData;
  };
}
```

### Parser: always bilingual

The action parser ALWAYS accepts both French AND English regardless of
the current display language. This is crucial because players might type
English commands even in French mode, or vice versa. Verb aliases include
both languages at all times.

### Implementation priority

- Phase 0: Set up i18n infrastructure, `t()` function, locale files
- Phase 1-5: All engine output uses string keys
- Phase 4: Narrative templates in FR (primary), EN structure ready
- Phase 6: UI uses `t()` for everything, language switcher in settings
- Post-launch: Complete EN narrative templates

---

## 2. Modular Scenario Architecture

### The Problem

We need scenarios that are:
- Structurally guaranteed to be completable (no softlocks)
- Variable in length (5 min → 2 hours)
- Varied enough to feel unique on replay
- Buildable by hand AND by procedural generation

### The Solution: Core Skeleton + Insertable Modules

A scenario has two layers:

```
CORE SKELETON (fixed, handcrafted, tested)
  The minimum viable story: start → key events → ending
  Always 4-6 nodes. Always completable. The "spine" of the story.

MODULES (insertable, interchangeable, randomizable)
  Self-contained obstacles/encounters that plug into the skeleton
  between any two core nodes. Add depth, length, and variety.
```

### Core Skeleton Structure

Every scenario follows this template:

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌────────┐
│  START   │───→│  UNLOCK  │───→│  REVEAL   │───→│  BOSS  │───→ END
│  (A)     │    │  (B)     │    │  (C)      │    │  (D)   │
│          │    │          │    │           │    │        │
│ Wake up, │    │ Find the │    │ Discover  │    │ Final  │
│ explore  │    │ key item │    │ the truth │    │ fight  │
│ initial  │    │ or solve │    │ about the │    │ or     │
│ area     │    │ first    │    │ threat    │    │ escape │
│          │    │ gate     │    │           │    │        │
└─────────┘    └──────────┘    └───────────┘    └────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  [INTRO]        [RISING]       [MIDPOINT]      [CLIMAX]
  Beat 1         Beat 2          Beat 3          Beat 4
```

In JSON:

```typescript
interface CoreSkeleton {
  id: string;
  // The mandatory nodes (always present, always this order)
  nodes: [
    { id: 'start';   role: 'entry';    beat: 'intro' },
    { id: 'unlock';  role: 'gate';     beat: 'rising' },
    { id: 'reveal';  role: 'midpoint'; beat: 'midpoint' },
    { id: 'boss';    role: 'climax';   beat: 'climax' },
  ];
  // The critical item/key that gates progression
  gateItem: string;        // e.g., 'access_card', 'override_code'
  gateItemLocation: string; // Where the gate item is found
  // The revelation at midpoint
  revelation: string;       // What truth is revealed
  // The final challenge
  bossType: 'combat' | 'puzzle' | 'escape' | 'choice';
  // Victory conditions
  primaryVictory: VictoryCondition;
  alternativeVictory: VictoryCondition;
}
```

### Module System

A module is a **self-contained mini-encounter** that plugs in between
any two core nodes:

```typescript
interface ScenarioModule {
  id: string;
  type: ModuleType;
  // Where this module can be inserted
  validPositions: ('start-unlock' | 'unlock-reveal' | 'reveal-boss')[];
  // What it adds to the scenario
  locations: LocationDefinition[];   // 1-3 locations
  npcs?: NpcDefinition[];            // 0-2 NPCs
  items?: ItemDefinition[];          // 0-3 items
  // How it connects to the skeleton
  entryFrom: string;  // Connects to the previous node/module
  exitTo: string;     // Connects to the next node/module
  // Narrative role
  tension: number;    // 1-10, must fit the beat range
  storyRole: string;  // What this adds to the narrative
  // Resolution (see section 3)
  obstacle: ObstacleDefinition;
  // Localized content
  locale: { fr: ModuleLocaleData; en: ModuleLocaleData };
}

type ModuleType =
  | 'blocked_passage'    // Door/airlock to bypass
  | 'patrol_enemy'       // Enemy to fight/avoid/trick
  | 'npc_encounter'      // Survivor, android, or hostile to interact with
  | 'terminal_puzzle'    // Hack/repair/override a system
  | 'environmental'      // Hazard to survive (fire, vacuum, flooding)
  | 'exploration'        // Optional area with loot/lore
  | 'rescue'             // NPC in danger to save (or not)
  | 'moral_choice'       // Dilemma with consequences
  | 'resource_cache'     // Supply stash with risk
  | 'ambush';            // Surprise encounter
```

### Module Examples

```typescript
const MODULES: ScenarioModule[] = [
  {
    id: 'blocked_airlock_01',
    type: 'blocked_passage',
    validPositions: ['start-unlock', 'unlock-reveal'],
    locations: [{
      id: 'airlock_corridor',
      features: [
        { id: 'airlock_door', type: 'door', properties: ['locked', 'mechanical', 'electronic'] },
        { id: 'vent_shaft', type: 'vent', properties: ['openable', 'climbable', 'cramped'] },
        { id: 'wall_panel', type: 'panel', properties: ['electronic', 'breakable'] },
      ],
    }],
    obstacle: {
      description: 'Blocked airlock',
      paths: [
        { method: 'hack',  verb: 'HACK',  target: 'wall_panel',   stat: 'INT', dc: 12 },
        { method: 'force', verb: 'FORCE_OPEN', target: 'airlock_door', stat: 'FOR', dc: 14 },
        { method: 'crawl', verb: 'CLIMB', target: 'vent_shaft',   stat: 'FOR', dc: 10 },
      ],
    },
    tension: 4,
    storyRole: 'First real obstacle, teaches player that multiple approaches exist',
  },

  {
    id: 'patrol_robot_01',
    type: 'patrol_enemy',
    validPositions: ['unlock-reveal', 'reveal-boss'],
    locations: [{
      id: 'patrol_corridor',
      features: [
        { id: 'security_camera', type: 'camera', properties: ['electronic', 'powered'] },
        { id: 'side_alcove', type: 'environment', properties: ['dark', 'cramped'] },
      ],
    }],
    npcs: [{
      id: 'sentinel_bot',
      type: 'robot',
      disposition: 'hostile',
      properties: ['robotic', 'electronic', 'metallic', 'powered', 'sentient'],
      weakness: 'electrical_vulnerability',
    }],
    obstacle: {
      description: 'Robot sentinel patrolling',
      paths: [
        { method: 'fight',    verb: 'STRIKE',     target: 'sentinel_bot', stat: 'FOR', dc: 14 },
        { method: 'sneak',    verb: 'HIDE',        target: 'side_alcove', stat: 'FOR', dc: 11 },
        { method: 'sabotage', verb: 'SABOTAGE',    target: 'security_camera', stat: 'INT', dc: 12 },
        { method: 'disable',  verb: 'OVERRIDE',    target: 'sentinel_bot', stat: 'INT', dc: 15 },
        { method: 'trick',    verb: 'DISTRACT',    target: 'sentinel_bot', stat: 'CHA', dc: 13 },
      ],
    },
    tension: 6,
    storyRole: 'Direct threat encounter, reveals security is active',
  },

  {
    id: 'wounded_android_01',
    type: 'npc_encounter',
    validPositions: ['start-unlock', 'unlock-reveal'],
    locations: [{
      id: 'medical_bay',
      features: [
        { id: 'med_terminal', type: 'terminal', properties: ['electronic', 'readable'] },
        { id: 'med_cabinet', type: 'container', properties: ['openable', 'locked'] },
      ],
    }],
    npcs: [{
      id: 'android_medic',
      type: 'android',
      disposition: 'neutral',
      properties: ['robotic', 'sentient', 'wounded'],
    }],
    items: [{
      id: 'med_supplies',
      name: { fr: 'Fournitures médicales', en: 'Medical supplies' },
      type: 'consumable',
    }],
    obstacle: {
      description: 'Wounded android, suspicious of you',
      paths: [
        { method: 'persuade', verb: 'PERSUADE', target: 'android_medic', stat: 'CHA', dc: 11 },
        { method: 'heal',    verb: 'USE',      target: 'med_supplies',   stat: 'INT', dc: 9, requires: 'med_supplies' },
        { method: 'intimidate', verb: 'INTIMIDATE', target: 'android_medic', stat: 'CHA', dc: 13 },
        { method: 'hack',    verb: 'HACK',     target: 'android_medic', stat: 'INT', dc: 16 },
        { method: 'ignore',  verb: 'MOVE_TO',  target: 'exit', stat: null, dc: null, consequence: 'miss_ally' },
      ],
    },
    tension: 3,
    storyRole: 'Potential ally, provides lore and possibly an item',
  },
];
```

### Scenario Assembly

```
SESSION LENGTH → NUMBER OF MODULES

Quick    (5 min)  → Core skeleton only (4 nodes, ~8-12 turns)
Standard (30 min) → Core + 3-4 modules  (~20-30 turns)
Extended (2 hrs)  → Core + 8-12 modules (~50-80 turns)
```

Assembly algorithm:

```typescript
function assembleScenario(
  skeleton: CoreSkeleton,
  sessionLength: 'quick' | 'standard' | 'extended',
  setting: SettingTheme,
  rng: RandomGenerator,
): AssembledScenario {

  const moduleCount = {
    quick: 0,
    standard: rng.intBetween(3, 5),
    extended: rng.intBetween(8, 12),
  }[sessionLength];

  // Distribute modules across skeleton segments
  const segments: SkeletonSegment[] = [
    'start-unlock',   // intro → rising
    'unlock-reveal',  // rising → midpoint
    'reveal-boss',    // escalation
  ];

  const selectedModules: PlacedModule[] = [];
  const modulePool = getCompatibleModules(setting);

  for (let i = 0; i < moduleCount; i++) {
    // Pick a segment (weighted: more modules in rising/escalation)
    const segment = pickWeightedSegment(segments, i, moduleCount);

    // Pick a module compatible with this segment
    const module = pickModule(modulePool, segment, selectedModules, rng);
    if (module) {
      selectedModules.push({ module, segment, position: i });
    }
  }

  // Build the final location graph
  const graph = buildGraph(skeleton, selectedModules);

  // Validate: all paths exist, no orphans, victory reachable
  validateGraph(graph);

  return { skeleton, modules: selectedModules, graph, setting };
}
```

### Variety Through Theming

The same skeleton + modules feel different thanks to **setting themes**:

```
"Blocked airlock" module in different settings:
├── Derelict ship:    "Le sas est bloqué par des débris métalliques tordus."
├── Alien ruins:      "Un mécanisme extraterrestre bloque le passage, couvert de symboles."
├── Space station:    "Le panneau de contrôle du sas affiche QUARANTINE en rouge."
├── Asteroid mine:    "Un éboulement bloque le tunnel principal."
└── Research lab:     "La porte de décontamination refuse de s'ouvrir. LEVEL 5 CLEARANCE."
```

Same obstacle, same resolution paths, totally different atmosphere.

---

## 3. Anti-Softlock: Multi-Path Resolution

### The Golden Rule

> **Every obstacle MUST have at least 3 resolution paths using different stats.**
> **No single failed roll can make the game unwinnable.**

### Obstacle Definition

```typescript
interface ObstacleDefinition {
  id: string;
  description: string;

  // Every obstacle has 3-5 paths, using different stats
  paths: ResolutionPath[];

  // What happens if ALL paths have been attempted and failed
  failsafe: FailsafeType;
}

interface ResolutionPath {
  method: string;           // Human-readable description
  verb: VerbId;             // Primary verb
  target: string;           // Target entity
  stat: StatName | null;    // FOR, INT, or CHA (null = auto-success)
  dc: number | null;        // Difficulty (null = auto-success)
  requires?: string;        // Required item (optional)
  consequence?: string;     // Side effect of this path
  consumesItem?: boolean;   // Does it use up the required item?
}
```

### The Three-Stat Guarantee

Every obstacle has AT LEAST:
- One **FOR** path (brute force, physical approach)
- One **INT** path (technical, clever approach)
- One **CHA** or **creative** path (social, unconventional approach)

```typescript
// EXAMPLE: Locked door obstacle

const lockedDoor: ObstacleDefinition = {
  id: 'locked_security_door',
  description: 'Heavy security door, electronically locked',
  paths: [
    // FOR paths
    {
      method: 'Force the door open',
      verb: 'FORCE_OPEN', target: 'security_door',
      stat: 'FOR', dc: 14,
      consequence: 'noise_alert',  // Makes noise, may attract enemies
    },
    // INT paths
    {
      method: 'Hack the lock panel',
      verb: 'HACK', target: 'lock_panel',
      stat: 'INT', dc: 12,
    },
    {
      method: 'Rewire the door circuit',
      verb: 'REPAIR', target: 'door_wiring',
      stat: 'INT', dc: 13,
      requires: 'multitool',
    },
    // CHA/creative paths
    {
      method: 'Convince NPC to open (if present)',
      verb: 'PERSUADE', target: 'nearby_npc',
      stat: 'CHA', dc: 11,
      requires: 'npc_present', // Only available if NPC is in area
    },
    // Environment path (always available)
    {
      method: 'Crawl through ventilation',
      verb: 'CLIMB', target: 'vent_shaft',
      stat: 'FOR', dc: 10,
      consequence: 'cramped_passage', // Lose 1 HP from tight squeeze
    },
  ],
  failsafe: 'degraded_bypass',
};
```

### What Happens When ALL Rolls Fail?

This is the critical question. Four failsafe strategies, chosen per obstacle:

```typescript
type FailsafeType =
  | 'degraded_bypass'     // Find a worse way through (costs HP/resources)
  | 'narrative_rescue'    // Something in the environment creates an opening
  | 'threat_escalation'   // The threat comes to YOU (skip ahead in story)
  | 'alternate_route';    // Reveal a previously hidden path

interface FailsafeDefinition {
  type: FailsafeType;
  // Triggers after N total failed attempts on this obstacle
  triggerAfterFailures: number; // typically 3-5
  // What happens
  effect: FailsafeEffect;
}
```

#### Failsafe 1: Degraded Bypass

> "You can get through, but it'll cost you."

After 3 failed attempts, the engine offers a guaranteed-success path
that costs HP, an item, or oxygen:

```
"Après plusieurs tentatives infructueuses, vous remarquez que la
paroi adjacente est corrodée. En forçant, vous parvenez à créer
une ouverture... mais les bords tranchants vous entaillent le bras.
[-3 HP]"
```

This is the most common failsafe. The player progresses but weaker.

#### Failsafe 2: Narrative Rescue

> "The world intervenes."

An environmental event creates an opening:

```
"Alors que vous êtes sur le point d'abandonner, un grondement
retentit. Le vaisseau tremble. Un panneau se détache du plafond
et percute la porte, la déformant suffisamment pour se glisser
à travers."
```

Used sparingly — feels like deus ex machina if overused.

#### Failsafe 3: Threat Escalation

> "You spent too long here. The threat noticed."

The main threat advances. The door becomes irrelevant because
something worse is happening:

```
"Un crissement métallique résonne derrière vous. La créature
vous a trouvé. Plus le temps de forcer cette porte — il faut
fuir par un autre chemin. MAINTENANT."
```

The player is forced into a different route, the pacing accelerates.
This is great for escalation beats.

#### Failsafe 4: Alternate Route

> "Look harder."

The engine reveals a previously hidden connection:

```
"En examinant les murs autour de la porte, vous remarquez un
léger courant d'air provenant d'une grille au sol. Il y a
un conduit de maintenance en dessous."
```

A new path appears. Higher difficulty than the original paths
but guaranteed to exist.

### The Failure Counter System

```typescript
interface ObstacleState {
  obstacleId: string;
  totalAttempts: number;       // All attempts across all paths
  failedAttempts: number;      // Failed attempts
  pathsAttempted: Set<string>; // Which methods the player tried
  resolved: boolean;           // Has the player gotten past this?
  failsafeTriggered: boolean;
}

function checkFailsafe(obstacle: ObstacleDefinition, state: ObstacleState): FailsafeResult | null {
  if (state.resolved || state.failsafeTriggered) return null;

  const failsafe = obstacle.failsafe;
  const threshold = getFailsafeThreshold(failsafe);

  if (state.failedAttempts >= threshold) {
    return {
      type: failsafe,
      activated: true,
      // Generate the appropriate narrative and state changes
    };
  }

  // ALSO: if player has tried 3+ different paths, suggest the failsafe
  // even before the threshold (gentle hint)
  if (state.pathsAttempted.size >= 3 && state.failedAttempts >= 2) {
    return {
      type: failsafe,
      activated: false,
      hint: getFailsafeHint(failsafe), // "Vous commencez à remarquer que..."
    };
  }

  return null;
}
```

### Critical Anti-Softlock Guarantee

The stress test suite verifies:

```typescript
test('ANTI-SOFTLOCK: every obstacle is passable within 10 attempts', () => {
  for (const obstacle of ALL_OBSTACLES) {
    let state = createFreshObstacleState(obstacle.id);
    let passed = false;

    for (let attempt = 0; attempt < 10; attempt++) {
      // Try each path with worst possible rolls (all nat 1)
      for (const path of obstacle.paths) {
        state.totalAttempts++;
        state.failedAttempts++;
        state.pathsAttempted.add(path.method);
      }

      // Check if failsafe activates
      const failsafe = checkFailsafe(obstacle, state);
      if (failsafe?.activated) {
        passed = true;
        break;
      }
    }

    expect(passed).toBe(true);  // MUST be passable
  }
});
```

---

## 4. Pacing & Tension Through Procedural Scenarios

### The Challenge

Story beats (intro → rising → midpoint → escalation → climax → resolution)
work well with fixed-length scenarios, but when modules are dynamically
inserted, the scenario length varies. How do we keep good pacing?

### Solution: Beat Zones, Not Fixed Percentages

Instead of "midpoint is at 50%", each module and core node is **tagged
with its beat zone**. The assembled scenario's beat progression emerges
from the module ordering.

```typescript
type BeatZone = 'intro' | 'rising' | 'midpoint' | 'escalation' | 'climax' | 'resolution';

// Core nodes have fixed beats
// Modules have a beat RANGE they fit into

interface CoreNode {
  id: string;
  beat: BeatZone; // Always this beat
}

interface ScenarioModule {
  // ...
  beatRange: [BeatZone, BeatZone]; // Min and max beat this module fits
  tension: number;                  // 1-10
}
```

### Module Placement Rules

```typescript
function assignBeats(assembled: AssembledScenario): BeatAssignment[] {
  const assignments: BeatAssignment[] = [];
  const totalNodes = countAllNodes(assembled); // core + module nodes

  // Core nodes anchor the beats
  // Modules between core nodes inherit beat ranges

  // SEGMENT 1: start → unlock = INTRO + RISING
  //   Modules here: tension 2-5, beat 'intro' or 'rising'
  //   First module: always 'intro' beat
  //   Subsequent: transition to 'rising'

  // SEGMENT 2: unlock → reveal = RISING + MIDPOINT
  //   Modules here: tension 4-7, beat 'rising'
  //   Last module before reveal: tension ramps up

  // CORE NODE 'reveal': always 'midpoint' beat, tension 6-7

  // SEGMENT 3: reveal → boss = ESCALATION
  //   Modules here: tension 6-9, beat 'escalation'
  //   Tension must INCREASE across this segment

  // CORE NODE 'boss': always 'climax' beat, tension 9-10

  return assignments;
}
```

### Tension Curve

The engine enforces a **monotonically increasing tension trend** with
local variations:

```
Tension
10 │                                          ╭──╮ CLIMAX
 9 │                                       ╭──╯  │
 8 │                                    ╭──╯     │
 7 │                              ╭─╮──╯        │ ESCALATION
 6 │                    MIDPOINT╭─╯  ╰─╮        │
 5 │                  ╭──╮     ╭╯      ╰╮       │
 4 │            ╭─────╯  ╰───╯         ╰╮      │
 3 │      ╭────╯   RISING                ╰╮     ╰──╮
 2 │  ╭──╯                                ╰╮      ╰── RESOLUTION
 1 │──╯ INTRO                              ╰╮
   └──────────────────────────────────────────────── Turns
```

Rules:
- Tension NEVER decreases by more than 2 points between consecutive nodes
- Tension MUST reach at least 8 during escalation
- Tension MUST reach 9-10 at climax
- Resolution drops to 3-5

```typescript
function validateTensionCurve(assignments: BeatAssignment[]): ValidationResult {
  const issues: string[] = [];

  for (let i = 1; i < assignments.length; i++) {
    const prev = assignments[i - 1].tension;
    const curr = assignments[i].tension;

    // No sudden drops (except intro→resolution transitions)
    if (curr < prev - 2 && assignments[i].beat !== 'resolution') {
      issues.push(`Tension drops too sharply: ${prev} → ${curr} at node ${i}`);
    }
  }

  // Check peak tension
  const maxTension = Math.max(...assignments.map(a => a.tension));
  if (maxTension < 9) {
    issues.push(`Peak tension ${maxTension} is below 9 — climax feels weak`);
  }

  return { valid: issues.length === 0, issues };
}
```

### The Threat Director

The main threat becomes **more active** as the scenario progresses.
This is controlled by a "threat director" that scales with the current beat:

```typescript
interface ThreatDirector {
  // How the main threat behaves at each beat
  behaviors: Record<BeatZone, ThreatBehavior>;
}

interface ThreatBehavior {
  visibility: 'hidden' | 'hinted' | 'glimpsed' | 'present' | 'pursuing';
  aggressiveness: number;    // 0 (passive) to 10 (relentless)
  environmentalEffects: string[]; // What the threat does to the world
  encounterChance: number;   // 0.0 to 1.0 per turn
  narrativeHints: string[];  // Template keys for atmospheric hints
}

const DEFAULT_THREAT_DIRECTOR: ThreatDirector = {
  behaviors: {
    intro: {
      visibility: 'hidden',
      aggressiveness: 0,
      environmentalEffects: [],
      encounterChance: 0,
      narrativeHints: ['eerie_silence', 'distant_sound', 'flickering_light'],
    },
    rising: {
      visibility: 'hinted',
      aggressiveness: 2,
      environmentalEffects: ['occasional_power_flicker'],
      encounterChance: 0,
      narrativeHints: ['scratch_marks', 'blood_trail', 'broken_equipment'],
    },
    midpoint: {
      visibility: 'glimpsed',
      aggressiveness: 4,
      environmentalEffects: ['power_fluctuations', 'locked_doors'],
      encounterChance: 0.1,
      narrativeHints: ['shadow_movement', 'distant_scream', 'camera_static'],
    },
    escalation: {
      visibility: 'present',
      aggressiveness: 7,
      environmentalEffects: ['power_outages', 'blocked_routes', 'environmental_damage'],
      encounterChance: 0.3,
      narrativeHints: ['heavy_footsteps', 'breathing_sounds', 'alarm_triggered'],
    },
    climax: {
      visibility: 'pursuing',
      aggressiveness: 10,
      environmentalEffects: ['ship_shaking', 'fire', 'hull_breach'],
      encounterChance: 0.8,
      narrativeHints: ['its_here', 'nowhere_to_hide', 'final_stand'],
    },
    resolution: {
      visibility: 'present',
      aggressiveness: 5, // decreasing if victory, still high if defeat
      environmentalEffects: [],
      encounterChance: 0,
      narrativeHints: ['aftermath'],
    },
  },
};
```

### Per-Turn Threat Check

Every turn, the engine runs a threat check:

```typescript
function threatCheck(
  state: GameState,
  director: ThreatDirector,
): ThreatEvent | null {
  const beat = state.progress.currentBeat;
  const behavior = director.behaviors[beat];

  // Random encounter check
  if (Math.random() < behavior.encounterChance) {
    return generateThreatEncounter(state, behavior);
  }

  // Environmental effect check (always happens in escalation+)
  if (behavior.aggressiveness >= 5) {
    return generateEnvironmentalEffect(state, behavior);
  }

  // Narrative hint (atmospheric, no game impact)
  if (behavior.narrativeHints.length > 0 && Math.random() < 0.4) {
    return {
      type: 'narrative_hint',
      template: pickRandom(behavior.narrativeHints),
    };
  }

  return null;
}
```

### How It All Fits Together (Example Session)

```
SESSION: Standard (30 min)
SKELETON: "Escape the Derelict"
SETTING: Derelict Ship
MODULES INSERTED: 4

ASSEMBLED SCENARIO:
═══════════════════════════════════════════════════════════

Node 1: START — Bridge (INTRO, tension 2)
  "You wake up on the bridge. Emergency lights. Alarm."
  → Beat: intro
  → Threat: hidden (eerie silence, flickering lights)

Node 2: MODULE — Wounded Android (RISING, tension 3)
  Medical bay. Android needs help. Will share info if healed.
  → Beat: rising
  → Threat: hinted (scratch marks on walls)
  → Obstacle: 5 paths (persuade/heal/intimidate/hack/ignore)

Node 3: MODULE — Blocked Airlock (RISING, tension 4)
  Airlock between sections is jammed.
  → Beat: rising
  → Threat: hinted (blood trail under door)
  → Obstacle: 3 paths (hack/force/vent)

Node 4: UNLOCK — Security Room (RISING→MIDPOINT, tension 5)
  Find the master keycard. Required for progression.
  → Beat: rising
  → Threat: hinted (security feeds show movement)

Node 5: MODULE — Terminal Puzzle (MIDPOINT, tension 6)
  Decrypt the captain's logs. Reveals the truth.
  → Beat: midpoint
  → Threat: glimpsed (SHADOW CROSSES THE SCREEN)
  → Obstacle: 3 paths (hack/repair/find_password_in_logs)

Node 6: REVEAL — Engine Room (MIDPOINT, tension 7)
  REVELATION: The threat is a xenomorph, loose since day one.
  → Beat: midpoint
  → Threat: glimpsed → PRESENT

Node 7: MODULE — Patrol Robot (ESCALATION, tension 8)
  The ship's security bot is active and hostile.
  → Beat: escalation
  → Threat: present (sounds of the creature nearby)
  → Obstacle: 5 paths (fight/sneak/sabotage/disable/distract)

Node 8: BOSS — Cargo Bay (CLIMAX, tension 9-10)
  Final confrontation. Reach the escape pod past the creature.
  → Beat: climax
  → Threat: PURSUING
  → Primary victory: reach escape pod with keycard
  → Alternative victory: jettison cargo bay (kills creature)
  → Emergent: depressurize cargo bay via environment

Node 9: RESOLUTION (tension 4)
  Epilogue narration based on outcome.

═══════════════════════════════════════════════════════════
Total: 9 nodes, ~25-35 turns, 30 minutes estimated
```

---

## Summary of Decisions

| Topic | Decision | Impact |
|-------|----------|--------|
| **Language** | i18n from day 1. `t()` function. FR primary, EN secondary. Parser always bilingual. | Affects every file that outputs text |
| **Scenarios** | Core skeleton (4 nodes) + insertable modules. Session length = number of modules. | Defines content creation pipeline |
| **Anti-softlock** | Every obstacle has 3+ paths (FOR/INT/CHA). Failsafe triggers after N failures. Player is NEVER stuck. | Defines obstacle data schema |
| **Pacing** | Beat zones tagged on nodes. Tension curve validated. Threat director scales with progression. | Defines module placement algorithm |

### Amendments to ROADMAP.md

These decisions require the following changes:

1. **Phase 0**: Add i18n infrastructure (`t()`, locale files, string keys)
2. **Phase 1**: Items, NPCs, features all have `name: { fr, en }` locale fields
3. **Phase 2**: Parser accepts both FR and EN at all times
4. **Phase 3**: Add obstacle state tracking and failsafe system to consequences engine
5. **Phase 4**: Templates organized by locale (`narrative/fr/`, `narrative/en/`)
6. **Phase 5**: Scenarios use core skeleton + module architecture. Threat director system.
7. **Phase 6**: Language switcher in settings. All UI uses `t()`

These decisions are **final** and should not be revisited unless playtesting
reveals fundamental problems.
