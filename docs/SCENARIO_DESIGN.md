# Void Walker — Scenario & Content Design Reference

> **Role:** Exhaustive reference for scenario architecture, pacing, threat director, narrative variety, and content planning.
> **Audience:** Claude Code during Phase 4, 5, 6.
> **Rule:** Specs here are authoritative. Phase files reference sections; they do not duplicate them.
> **Last updated:** 2026-02-21 | Status: **PRE-DEVELOPMENT**

---

## Table of Contents

1. [Modular Scenario Architecture](#1-modular-scenario-architecture)
2. [Settings & Compatibility](#2-settings--compatibility)
3. [Anti-Softlock System](#3-anti-softlock-system)
4. [Backtracking & Free Movement](#4-backtracking--free-movement)
5. [Pacing & Tension](#5-pacing--tension)
6. [Threat Director](#6-threat-director)
7. [Narrative Variety System](#7-narrative-variety-system)
8. [Content Volume Estimates](#8-content-volume-estimates)

---

## 1. Modular Scenario Architecture

### 1.1 Design Goal

Scenarios must be structurally guaranteed completable, variable in length (5 min to 2 hours), varied on replay, and buildable by hand or procedurally.

### 1.2 Core Skeleton + Insertable Modules

```
CORE SKELETON (fixed, handcrafted, tested)
  Minimum viable story: start -> key events -> ending.
  Always 4 nodes. Always completable. The "spine."

MODULES (insertable, interchangeable, randomizable)
  Self-contained mini-encounters that plug between core nodes.
  Add depth, length, and variety.
```

### 1.3 Core Skeleton Structure

```
 [START]  ->  [UNLOCK]  ->  [REVEAL]  ->  [BOSS]  ->  END
  (A)         (B)           (C)           (D)
  INTRO       RISING        MIDPOINT      CLIMAX
```

```typescript
interface CoreSkeleton {
  id: string;
  nodes: [
    { id: 'start';   role: 'entry';    beat: 'intro' },
    { id: 'unlock';  role: 'gate';     beat: 'rising' },
    { id: 'reveal';  role: 'midpoint'; beat: 'midpoint' },
    { id: 'boss';    role: 'climax';   beat: 'climax' },
  ];
  gateItem: string;          // Key item gating progression
  gateItemLocation: string;
  revelation: string;         // What truth is revealed at midpoint
  bossType: 'combat' | 'puzzle' | 'escape' | 'choice';
  primaryVictory: VictoryCondition;
  alternativeVictory: VictoryCondition;
}
```

### 1.4 Module System

```typescript
interface ScenarioModule {
  id: string;
  type: ModuleType;
  validPositions: ('start-unlock' | 'unlock-reveal' | 'reveal-boss')[];
  locations: LocationDefinition[];   // 1-3 locations
  npcs?: NpcDefinition[];
  items?: ItemDefinition[];
  entryFrom: string;
  exitTo: string;
  tension: number;                   // 1-10
  tensionRange: [number, number];    // Min/max tension it supports
  storyRole: string;
  obstacle: ObstacleDefinition;
  narrativeTier: 'low' | 'mid' | 'high' | 'any';
  compatibility: ModuleCompatibility; // See SS2
  locationRole: string;              // Abstract role -> setting provides name
  locale: { fr: ModuleLocaleData; en: ModuleLocaleData };
}

type ModuleType =
  | 'blocked_passage'    // Door/airlock to bypass
  | 'patrol_enemy'       // Enemy to fight/avoid/trick
  | 'npc_encounter'      // Survivor, android, hostile to interact with
  | 'terminal_puzzle'    // Hack/repair/override a system
  | 'environmental'      // Hazard to survive (fire, vacuum, flooding)
  | 'exploration'        // Optional area with loot/lore
  | 'rescue'             // NPC in danger to save (or not)
  | 'moral_choice'       // Dilemma with consequences
  | 'resource_cache'     // Supply stash with risk
  | 'ambush';            // Surprise encounter
```

### 1.5 Scenario Assembly

```
SESSION LENGTH -> MODULE COUNT

Quick    (5 min)  -> Core skeleton only (4 nodes, ~8-12 turns)
Standard (30 min) -> Core + 3-4 modules  (~20-30 turns)
Extended (2 hrs)  -> Core + 8-12 modules (~50-80 turns)
```

```typescript
function assembleScenario(
  skeleton: CoreSkeleton,
  sessionLength: 'quick' | 'standard' | 'extended',
  setting: SettingDefinition,
  rng: RandomGenerator,
): AssembledScenario {
  const moduleCount = {
    quick: 0,
    standard: rng.intBetween(3, 5),
    extended: rng.intBetween(8, 12),
  }[sessionLength];

  const segments = ['start-unlock', 'unlock-reveal', 'reveal-boss'];
  const selectedModules: PlacedModule[] = [];
  const modulePool = getCompatibleModules(setting);

  for (let i = 0; i < moduleCount; i++) {
    const segment = pickWeightedSegment(segments, i, moduleCount);
    const module = pickModule(modulePool, segment, selectedModules, rng);
    if (module) selectedModules.push({ module, segment, position: i });
  }

  const graph = buildGraph(skeleton, selectedModules);
  validateGraph(graph);                    // All paths exist, no orphans
  validateTensionCurve(graph);             // Tension increases properly

  return { skeleton, modules: selectedModules, graph, setting };
}
```

### 1.6 Module Layout: Spine + Side Rooms

Each module adds a small cluster, not just a single room:

```
Main path: A ---- B ---- C ---- D
                  |
                  +-- side_room_1 (loot)
                  +-- side_room_2 (lore)
```

```typescript
interface ModuleLayout {
  criticalPath: LocationDefinition[];  // Must traverse to progress
  sideRooms: LocationDefinition[];     // Optional exploration
  entryPoint: string;                  // Connects to previous module's exit
  exitPoint: string;                   // Connects to next module's entry
}
```

---

## 2. Settings & Compatibility

### 2.1 Three-Layer Module System

```
LAYER 1 -- UNIVERSAL (work in any setting) ~40%
  "locked door", "dark room", "collapsed passage",
  "hostile entity", "wounded survivor", "broken terminal"

LAYER 2 -- CATEGORY (work in a setting family) ~30%
  space_vessel -> "airlock malfunction"
  planetary    -> "cave-in risk"
  alien        -> "alien mechanism"
  facility     -> "containment breach"

LAYER 3 -- SETTING-SPECIFIC (one setting only) ~30%
  derelict_ship -> "cockpit access"
  alien_ruins   -> "crystal resonance trap"
  asteroid_mine -> "mining drill room"
```

### 2.2 Setting Definitions

```typescript
type SettingCategory = 'space_vessel' | 'planetary' | 'alien' | 'facility';

interface SettingDefinition {
  id: string;
  categories: SettingCategory[];
  locationNames: LocaleString[];     // Pool of themed room names
  features: string[];                // Setting-specific environmental features
  preferredItems: string[];          // Items more likely to appear
}

const SETTINGS: Record<string, SettingDefinition> = {
  derelict_ship: {
    categories: ['space_vessel'],
    locationNames: [
      { fr: 'Pont de commandement', en: 'Bridge' },
      { fr: 'Salle des machines', en: 'Engine Room' },
      { fr: 'Infirmerie', en: 'Medical Bay' },
      { fr: 'Soute', en: 'Cargo Hold' },
      { fr: 'Coursive tribord', en: 'Starboard Corridor' },
      // ...20+ options
    ],
    features: ['airlock', 'viewport', 'hull_panel', 'life_support'],
    preferredItems: ['EVA_suit', 'plasma_cutter', 'access_card'],
  },
  alien_ruins: {
    categories: ['alien'],
    locationNames: [
      { fr: 'Chambre des cristaux', en: 'Crystal Chamber' },
      { fr: 'Couloir organique', en: 'Organic Corridor' },
      { fr: 'Sanctuaire central', en: 'Central Sanctum' },
      // ...
    ],
    features: ['crystal_node', 'organic_wall', 'alien_terminal', 'gravity_well'],
    preferredItems: ['translator_device', 'void_shard', 'psionic_amplifier'],
  },
  // space_station, asteroid_mine, research_lab, prison_transport,
  // generation_ship, planetary_colony (8 total)
};
```

### 2.3 Module Compatibility Tags

```typescript
interface ModuleCompatibility {
  universal: boolean;
  categories: SettingCategory[];
  settings: string[];
  excludeSettings: string[];
}

function getCompatibleModules(setting: SettingDefinition): ScenarioModule[] {
  return ALL_MODULES.filter(module => {
    if (module.compatibility.excludeSettings.includes(setting.id)) return false;
    if (module.compatibility.universal) return true;
    if (module.compatibility.settings.includes(setting.id)) return true;
    if (module.compatibility.categories.some(c => setting.categories.includes(c))) return true;
    return false;
  });
}
```

### 2.4 Location Name Resolution

Modules define abstract **roles**, settings provide concrete **names**:

```typescript
const LOCATION_NAME_POOLS: Record<string, Record<string, LocaleString[]>> = {
  passage: {
    derelict_ship: [
      { fr: 'Coursive principale', en: 'Main Corridor' },
      { fr: 'Couloir babord', en: 'Port Corridor' },
    ],
    alien_ruins: [
      { fr: 'Tunnel organique', en: 'Organic Tunnel' },
      { fr: 'Passage cristallin', en: 'Crystalline Passage' },
    ],
    asteroid_mine: [
      { fr: 'Galerie principale', en: 'Main Gallery' },
      { fr: 'Tunnel de forage', en: 'Drill Tunnel' },
    ],
  },
  control_room: {
    derelict_ship: [
      { fr: 'Salle de controle', en: 'Control Room' },
    ],
    alien_ruins: [
      { fr: 'Nexus de controle', en: 'Control Nexus' },
    ],
  },
  // Roles: passage, control_room, storage, hazard_zone,
  //        medical, quarters, hub, dead_end
};
```

Same module, different setting = completely different atmosphere.

### 2.5 Distribution Target

```
UNIVERSAL modules:    12-15  (40% of total)
CATEGORY modules:      8-12  (30%)
SETTING-SPECIFIC:      8-10  (30%)

TOTAL: ~30-35 modules

Per setting access: 15-23 modules (universal + category + specific)
Enough for extended sessions (8-12 modules used) with no repeats.
```

---

## 3. Anti-Softlock System

### 3.1 The Golden Rule

> **Every obstacle MUST have at least 3 resolution paths using different stats.**
> **No single failed roll can make the game unwinnable.**

### 3.2 Obstacle Schema

```typescript
interface ObstacleDefinition {
  id: string;
  description: string;
  paths: ResolutionPath[];           // 3-5 paths, different stats
  failsafe: FailsafeType;
}

interface ResolutionPath {
  method: string;
  verb: string;
  target: string;
  stat: StatId | null;               // null = auto-success
  dc: number | null;
  requires?: string;                 // Required item
  consequence?: string;              // Side effect
  consumesItem?: boolean;
}
```

### 3.3 The Multi-Stat Guarantee

Every obstacle has AT LEAST:
- One **ATK/DEF** path (physical approach)
- One **INT** path (technical approach)
- One **CHA/AGI** path (social, evasive, or creative approach)

### 3.4 Four Failsafe Types

```typescript
type FailsafeType =
  | 'degraded_bypass'     // Find a worse way through (costs HP/resources)
  | 'narrative_rescue'    // Environment creates an opening
  | 'threat_escalation'   // The threat comes to YOU
  | 'alternate_route';    // Reveal a hidden path
```

**Degraded bypass** (most common): After N failed attempts, a guaranteed-success path appears that costs HP, an item, or O2.
```
"Apres plusieurs tentatives, vous remarquez que la paroi est corrodee.
 En forcant, vous passez... mais les bords tranchants vous entaillent. [-3 HP]"
```

**Narrative rescue** (sparingly): Environmental event creates an opening.

**Threat escalation**: The threat advances, making the obstacle irrelevant but creating a worse situation.

**Alternate route**: A previously hidden connection is revealed.

### 3.5 Failsafe Threshold (Scales with Difficulty)

| Difficulty | Threshold | Failsafe Enabled? |
|-----------|-----------|-------------------|
| Explorer | 2 failures | Yes (cheap: -1 HP) |
| Survivor | 4 failures | Yes (costly: -3 HP) |
| Nightmare | 6 failures | **No** (see GAME_SYSTEMS.md SS12.3 for nightmare softlock escape) |

```typescript
function checkFailsafe(obstacle: ObstacleDefinition, state: ObstacleState): FailsafeResult | null {
  if (state.resolved || state.failsafeTriggered) return null;

  const threshold = state.difficulty.failsafeThreshold;
  if (!state.difficulty.failsafeEnabled) return null;

  if (state.failedAttempts >= threshold) {
    return { type: obstacle.failsafe, activated: true };
  }

  // Hint after 3+ different paths attempted and 2+ failures
  if (state.pathsAttempted.size >= 3 && state.failedAttempts >= 2) {
    return { type: obstacle.failsafe, activated: false, hint: true };
  }

  return null;
}
```

### 3.6 Stress Test Guarantee

```typescript
test('ANTI-SOFTLOCK: every obstacle is passable', () => {
  for (const obstacle of ALL_OBSTACLES) {
    const state = createFreshObstacleState(obstacle.id);
    let passed = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      for (const path of obstacle.paths) {
        state.failedAttempts++;
        state.pathsAttempted.add(path.method);
      }
      const failsafe = checkFailsafe(obstacle, state);
      if (failsafe?.activated) { passed = true; break; }
    }
    expect(passed).toBe(true);
  }
});
```

---

## 4. Backtracking & Free Movement

### 4.1 The Principle

The game is **linear in progression** but **free in movement**.

```
PROGRESSION GATES (one-way, story-driven):
  Player cannot REGRESS in story progress.
  Resolved obstacles stay resolved.
  Once a core node is reached, story moves forward.

MOVEMENT (free, bidirectional):
  Player can always go back to any visited room.
  All connections are bidirectional.
  Previously cleared rooms are still explorable.
```

### 4.2 Revisit Behavior

```typescript
interface RevisitBehavior {
  revisitDescription: LocaleString;     // Past-tense description
  // Items already taken are gone
  // Environmental changes persist (broken window stays broken)
  // NPCs may have moved
  // Cleared obstacles don't re-activate

  // Small chance of new content on revisit
  revisitEvents?: {
    chance: number;      // 0.0 to 0.3
    type: 'loot_missed' | 'npc_moved_here' | 'threat_trace' | 'environmental_change';
    template: string;
  }[];
}
```

Examples:
```
First visit:  "Le couloir medical est plonge dans la penombre. Des flacons
               renverses jonchent le sol."

Revisit:      "Vous revenez dans le couloir medical. Les flacons brises
               craquent sous vos pas. Rien n'a change -- sauf ce sentiment
               d'etre observe."
```

### 4.3 Progress Indicators

The UI subtly indicates direction:
```
> Sorties visibles :
>   <- Couloir principal [deja explore]
>   -> Salle des machines [inexplore]
>   v  Conduit de maintenance [inexplore]
```

Player sees "already explored" vs "unexplored" but is never told where to go.

---

## 5. Pacing & Tension

### 5.1 Beat Zones

```typescript
type BeatZone = 'intro' | 'rising' | 'midpoint' | 'escalation' | 'climax' | 'resolution';
```

Core nodes have fixed beats. Modules have beat RANGES they fit into.

### 5.2 Three Tiers of Modules

Instead of per-tension modules, we write in **three tiers** with **narrative skins**:

```
TIER 1 -- LOW TENSION (range [1, 4])
  Tone: calm exploration, curiosity, mild unease
  Obstacles: DC 8-12
  Examples: locked cabinet, dark corridor, offline terminal

TIER 2 -- MID TENSION (range [3, 7])
  Tone: alert, growing danger, urgency
  Obstacles: DC 10-14
  Examples: patrol enemy, wounded NPC, blocked passage

TIER 3 -- HIGH TENSION (range [6, 10])
  Tone: desperate, hunted, time pressure
  Obstacles: DC 13-18
  Examples: active threat, collapsing environment, final gate
```

Note **overlapping ranges**: Tier 1 [1-4], Tier 2 [3-7], Tier 3 [6-10]. A mid-tier module at tension 3 feels easy; at tension 7 feels urgent. Difference is **narration**, not mechanics.

### 5.3 How DCs Scale With Tension

```typescript
interface ScalableObstacle extends ObstacleDefinition {
  paths: ResolutionPath[];
  dcScaling: 'linear' | 'steep';
}

function scaleDC(baseDC: number, moduleTension: number, actualTension: number): number {
  const delta = actualTension - moduleTension;
  return Math.max(5, Math.min(20, baseDC + delta)); // +/-1 DC per tension delta
}
```

Example: "Blocked Airlock" module:
```
AT TENSION 3: "Le sas est bloque. Le mecanisme grince."
  DC hack: 10 | DC force: 12 | DC vent: 8

AT TENSION 6: "Le sas est scelle -- quarantaine declenchee."
  DC hack: 13 | DC force: 15 | DC vent: 11

AT TENSION 9: "Le sas est verrouille. Derriere vous, les pas se rapprochent."
  DC hack: 16 | DC force: 18 | DC vent: 14
  + Time pressure: 2 turns or threat arrives
```

### 5.4 Narrative Tier Skins

Each module has 3 narrative skins (low/mid/high):

```typescript
interface NarrativeSkin {
  tension: 'low' | 'mid' | 'high';
  descriptions: { firstVisit: LocaleString; revisit: LocaleString };
  obstacleIntro: LocaleString;
  pathTemplates: Record<string, OutcomeTemplates>;
  ambientDetails: LocaleString[];
  atmosphereCue: LocaleString;
}
```

### 5.5 Tension Curve Validation

```
Tension
10 |                                          +--+  CLIMAX
 9 |                                       +--+  |
 8 |                                    +--+     |
 7 |                              +-+--+         | ESCALATION
 6 |                    MIDPOINT+-+  +-+         |
 5 |                  +--+     ++      ++        |
 4 |            +-----+  +---++         ++       |
 3 |      +----+   RISING                ++      +--+
 2 |  +--+                                ++       +-- RESOLUTION
 1 |--+  INTRO                             ++
   +-------------------------------------------------- Turns
```

Rules:
- Tension NEVER drops more than 2 between consecutive nodes
- MUST reach 8+ during escalation
- MUST reach 9-10 at climax
- Resolution drops to 3-5

```typescript
function validateTensionCurve(assignments: BeatAssignment[]): ValidationResult {
  const issues: string[] = [];
  for (let i = 1; i < assignments.length; i++) {
    const prev = assignments[i - 1].tension;
    const curr = assignments[i].tension;
    if (curr < prev - 2 && assignments[i].beat !== 'resolution') {
      issues.push(`Tension drops too sharply: ${prev} -> ${curr}`);
    }
  }
  const maxTension = Math.max(...assignments.map(a => a.tension));
  if (maxTension < 9) issues.push(`Peak tension ${maxTension} < 9`);
  return { valid: issues.length === 0, issues };
}
```

---

## 6. Threat Director

### 6.1 Per-Beat Behavior

```typescript
interface ThreatDirector {
  behaviors: Record<BeatZone, ThreatBehavior>;
}

interface ThreatBehavior {
  visibility: 'hidden' | 'hinted' | 'glimpsed' | 'present' | 'pursuing';
  aggressiveness: number;      // 0-10
  environmentalEffects: string[];
  encounterChance: number;     // 0.0-1.0 per turn
  narrativeHints: string[];
}

const DEFAULT_THREAT_DIRECTOR: ThreatDirector = {
  behaviors: {
    intro: {
      visibility: 'hidden', aggressiveness: 0,
      environmentalEffects: [],
      encounterChance: 0,
      narrativeHints: ['eerie_silence', 'distant_sound', 'flickering_light'],
    },
    rising: {
      visibility: 'hinted', aggressiveness: 2,
      environmentalEffects: ['occasional_power_flicker'],
      encounterChance: 0,
      narrativeHints: ['scratch_marks', 'blood_trail', 'broken_equipment'],
    },
    midpoint: {
      visibility: 'glimpsed', aggressiveness: 4,
      environmentalEffects: ['power_fluctuations', 'locked_doors'],
      encounterChance: 0.1,
      narrativeHints: ['shadow_movement', 'distant_scream', 'camera_static'],
    },
    escalation: {
      visibility: 'present', aggressiveness: 7,
      environmentalEffects: ['power_outages', 'blocked_routes', 'environmental_damage'],
      encounterChance: 0.3,
      narrativeHints: ['heavy_footsteps', 'breathing_sounds', 'alarm_triggered'],
    },
    climax: {
      visibility: 'pursuing', aggressiveness: 10,
      environmentalEffects: ['ship_shaking', 'fire', 'hull_breach'],
      encounterChance: 0.8,
      narrativeHints: ['its_here', 'nowhere_to_hide', 'final_stand'],
    },
    resolution: {
      visibility: 'present', aggressiveness: 5,
      environmentalEffects: [],
      encounterChance: 0,
      narrativeHints: ['aftermath'],
    },
  },
};
```

### 6.2 Per-Turn Threat Check

```typescript
function threatCheck(state: GameState, director: ThreatDirector): ThreatEvent | null {
  const beat = state.progress.currentBeat;
  const behavior = director.behaviors[beat];

  // Random encounter
  if (Math.random() < behavior.encounterChance) {
    return generateThreatEncounter(state, behavior);
  }

  // Environmental effects (escalation+)
  if (behavior.aggressiveness >= 5) {
    return generateEnvironmentalEffect(state, behavior);
  }

  // Narrative hint (atmospheric, 40% chance)
  if (behavior.narrativeHints.length > 0 && Math.random() < 0.4) {
    return { type: 'narrative_hint', template: pickRandom(behavior.narrativeHints) };
  }

  return null;
}
```

### 6.3 Stalker Clock Integration

The stalker clock (GAME_SYSTEMS.md SS7) feeds into the threat director. When the warning threshold is hit:
- `encounterChance` +0.2
- `aggressiveness` +2
- Narrative hints become more urgent

---

## 7. Narrative Variety System

### 7.1 The Problem

The player must never feel like they're reading the same text twice. Narrative output must adapt to 12+ contextual dimensions simultaneously.

### 7.2 Seven-Layer Composition

```
FINAL NARRATIVE =
    Layer 1: Action sentence    (what happens)
  + Layer 2: Sensory detail     (what the player perceives)
  + Layer 3: Consequence        (what changes in the world)
  + Layer 4: Atmosphere         (mood/environment snippet)
  + Layer 5: Player state       (optional: HP/condition)
  + Layer 6: Threat hint        (optional: pacing)
  + Layer 7: NPC reaction       (optional: if NPCs present)
```

Each layer is selected independently based on its own context.

### 7.3 The 12 Context Dimensions

```typescript
interface NarrativeContext {
  verb: VerbId;                      // 1. What action
  verbCategory: VerbCategory;
  outcome: Outcome;                  // 2. How dice resolved
  margin: number;                    //    How far above/below DC
  target: TargetInfo;                // 3. What was acted upon
  targetDisposition: Disposition;
  toolUsed: ItemInfo | null;         // 4. Item used
  location: LocationInfo;            // 5. Where
  environmentConditions: Set<string>;
  tension: number;                   // 6. Current tension 1-10
  beat: BeatZone;
  settingId: string;                 // 7. World theme
  playerHpPercent: number;           // 8. Physical condition
  playerConditions: Set<string>;
  moduleId: string;                  // 9. Scenario module
  moduleType: ModuleType;
  npcsPresent: NpcInfo[];            // 10. NPCs watching
  recentEvents: string[];            // 11. Last 3-5 events
  turnNumber: number;
  isCreative: boolean;               // 12. Creative/absurd action
  isAbsurd: boolean;
}
```

### 7.4 Template Selection (Priority Cascade)

```typescript
function selectTemplate(ctx: NarrativeContext): NarrativeTemplate {
  // P1: Specific -- verb + target type + outcome + tension tier
  let template = findTemplate({ verb: ctx.verb, targetType: ctx.target.type,
                                outcome: ctx.outcome, tension: tensionTier(ctx.tension) });

  // P2: Verb + outcome (any target)
  if (!template) template = findTemplate({ verb: ctx.verb, outcome: ctx.outcome,
                                           tension: tensionTier(ctx.tension) });

  // P3: Verb category + outcome (generic)
  if (!template) template = findTemplate({ verbCategory: ctx.verbCategory,
                                           outcome: ctx.outcome, tension: tensionTier(ctx.tension) });

  // P4: Ultimate fallback
  if (!template) template = GENERIC_FALLBACK[ctx.outcome];

  return template;
}
```

### 7.5 Layer Composition

```typescript
function composeNarrative(ctx: NarrativeContext): string {
  const parts: string[] = [];

  // Layer 1: ACTION RESULT (mandatory)
  parts.push(renderTemplate(selectTemplate(ctx), ctx));

  // Layer 2: SENSORY DETAIL (80% chance, skip if auto-success)
  if (ctx.outcome !== 'auto_success' && Math.random() < 0.8) {
    const sensory = selectSensoryDetail(ctx);
    if (sensory) parts.push(sensory);
  }

  // Layer 3: CONSEQUENCE (if state changed)
  if (ctx.stateChanges?.length > 0) {
    const consequence = selectConsequenceNarrative(ctx);
    if (consequence) parts.push(consequence);
  }

  // Layer 4: ATMOSPHERE (30% + 5% per tension level)
  if (Math.random() < 0.3 + ctx.tension * 0.05) {
    const atmosphere = selectAtmosphereSnippet(ctx);
    if (atmosphere) parts.push(atmosphere);
  }

  // Layer 5: PLAYER STATE (only if HP critical or condition active)
  if (ctx.playerHpPercent < 0.3) {
    parts.push(selectLowHpSnippet(ctx));
  } else if (ctx.playerConditions.size > 0) {
    parts.push(selectConditionSnippet(ctx));
  }

  // Layer 6: THREAT HINT (from threat director)
  const threatHint = getThreatHint(ctx);
  if (threatHint) parts.push(threatHint);

  // Layer 7: NPC REACTION (if NPCs present)
  if (ctx.npcsPresent.length > 0) {
    parts.push(selectNpcReaction(ctx));
  }

  return parts.join(' ');
}
```

### 7.6 Sensory Detail Pools

Short phrases (~10-20 words) adding texture, selected by setting + environment + tension:

```typescript
const SENSORY_POOLS: Record<string, Record<string, LocaleString[]>> = {
  derelict_ship: {
    default: [
      { fr: 'Le neon au-dessus de vous gresille avant de s\'eteindre brievement.', en: '...' },
      { fr: 'Quelque part, un tuyau fuit. Le goutte-a-goutte resonne.', en: '...' },
    ],
    dark: [
      { fr: 'Votre lampe projette des ombres mouvantes sur les parois.', en: '...' },
    ],
    depressurized: [
      { fr: 'Le silence du vide est assourdissant.', en: '...' },
    ],
  },
  alien_ruins: {
    default: [
      { fr: 'Les cristaux sur les murs pulsent doucement.', en: '...' },
      { fr: 'Un bourdonnement subsonique fait vibrer vos dents.', en: '...' },
    ],
  },
  // One block per setting x environment condition
};
```

### 7.7 Player State & NPC Reaction Snippets

```typescript
const LOW_HP_SNIPPETS: LocaleString[] = [
  { fr: 'Chaque mouvement ravive la douleur.', en: '...' },
  { fr: 'Votre vision se trouble par moments.', en: '...' },
  { fr: 'Vos mains tremblent. Pas de peur -- d\'epuisement.', en: '...' },
];

const NPC_REACTIONS: Record<Disposition, Record<Outcome, LocaleString[]>> = {
  friendly: {
    crit_success: [{ fr: '{npc_name} hoche la tete avec admiration.', en: '...' }],
    failure: [{ fr: '  Peut-etre autrement ?   suggere {npc_name}.', en: '...' }],
  },
  hostile: {
    failure: [{ fr: '{npc_name} emet un son qui ressemble a un rire.', en: '...' }],
  },
};
```

### 7.8 Anti-Repetition: Recently-Used Buffer

```typescript
class NarrationMemory {
  private recentTemplateIds: string[] = [];
  private recentSensoryIds: string[] = [];
  private recentAtmosphereIds: string[] = [];
  private readonly bufferSize = 10;

  select(pool: Template[], ctx: NarrativeContext): Template {
    const available = pool.filter(t => !this.recentTemplateIds.includes(t.id));
    if (available.length === 0) return pool[0]; // Least recently used
    const chosen = pickRandom(available);
    this.recentTemplateIds.push(chosen.id);
    if (this.recentTemplateIds.length > this.bufferSize) {
      this.recentTemplateIds.shift();
    }
    return chosen;
  }
}
```

### 7.9 Combinatorial Variety

Since layers compose independently:
```
450 x 120 x 60 x 80 x 30 x 40 x 50 = astronomically large
```
The player will effectively NEVER read the exact same narrative twice.

---

## 8. Content Volume Estimates

### 8.1 Content Inventory

```
COMPONENT                          QUANTITY
------------------------------------------------------
Core Skeletons                          5
  "Escape", "Investigate", "Rescue", "Eliminate", "Retrieve"

Modules (game logic)                   30
  Universal: 15 | Category: 10 | Setting-specific: 5
  Each = obstacle + 3-5 paths + items/NPCs

Module Narrative Skins                 90
  30 modules x 3 tension tiers
  x 2 languages = 180 skin files

Items                                  40
  20 predefined + 20 setting-specific

NPC Archetypes                         15
  5 universal + 10 setting-specific

Settings                                8

Narrative Templates (action outcomes) ~450
  Top 15 verbs:     15 x 5 outcomes x 3 tensions = 225
  Next 15 verbs:    15 x 3 x 2 = 90
  Remaining 20:     20 x 2 x 1 = 40
  Generic fallbacks: 4 x 5 x 3 = 60
  Absurd:           15
  Environmental:    20

Environmental Clues                    50
Revisit Descriptions                  ~60
Threat Director Narratives             40

------------------------------------------------------
TOTAL UNIQUE CONTENT PIECES:         ~800
TOTAL LOCALIZED STRINGS:           ~1,600 (x 2 languages)
```

### 8.2 Variety Analysis

```
Session 1: Skeleton A + modules [3,7,14,22] + "derelict_ship"
Session 2: Skeleton B + modules [1,9,18,25] + "alien_ruins"
Session 3: Skeleton A + modules [5,11,20,28] + "space_station"
Session 4: Skeleton C + modules [2,8,16,23] + "asteroid_mine"
Session 5: Skeleton B + modules [6,12,19,30] + "research_lab"

After 5 sessions: 0 repeated modules, 1 repeated skeleton (different modules)
After 10 sessions: 2-3 repeated modules but in different settings/tensions
After 20+ sessions: modules repeat but narrative template variety keeps text fresh
```

### 8.3 Launch Priority

```
MUST HAVE for launch:
  3 core skeletons
  15 modules (5 universal, 5 mid-tier, 5 high-tier)
  225 narrative templates (top 15 verbs, full coverage)
  60 generic fallback templates
  20 items
  3 settings fully fleshed out
  10 NPC archetypes

POST-LAUNCH expansion:
  +2 core skeletons
  +15 modules (category + setting-specific)
  +200 narrative templates (remaining verbs)
  +20 items, +5 settings, +5 NPCs, +50 clues
```

---

> *"Chaque partie raconte une histoire differente. Meme si c'est le meme vaisseau."*
> -- Scenario design motto
