# Void Walker — Design Refinements (Pre-Phase 0)

> Answers to 7 critical design questions.
> These decisions amend the Structural Design Decisions document.

---

## 2. Backtracking & Illusion of Freedom

### The Principle

The game is **linear in progression** but **free in movement**. The
player can always walk back to any previously visited location. The
"corridor" is the story progression, not the physical map.

### How It Works

```
PROGRESSION GATES (one-way, story-driven):
  The player cannot REGRESS in story progress.
  Once an obstacle is resolved, it stays resolved.
  Once a core node is reached, the story moves forward.

MOVEMENT (free, bidirectional):
  The player can always go back to any visited room.
  All connections are bidirectional.
  Previously cleared rooms are still explorable.
```

### Map Structure: Spine + Side Rooms

Each module doesn't just add a single room on the main path — it adds
a **small cluster** with optional side rooms:

```
Main path: A ──── B ──── C ──── D
                  │
                  ├── side_room_1 (loot)
                  └── side_room_2 (lore)
```

The player must go through B to progress, but can also explore
side_room_1 and side_room_2 for extra items and story.

```typescript
interface ModuleLayout {
  // The room(s) on the critical path (must traverse to progress)
  criticalPath: LocationDefinition[];
  // Optional side rooms (connected to critical path rooms)
  sideRooms: LocationDefinition[];
  // Which critical path room connects to the previous module's exit
  entryPoint: string;
  // Which critical path room connects to the next module's entry
  exitPoint: string;
}
```

### What Happens When Backtracking

When a player returns to a previously visited room:

```typescript
interface RevisitBehavior {
  // Base description changes to past tense / post-event
  revisitDescription: LocaleString;
  // Items already taken are gone
  // Environmental changes persist (broken window stays broken)
  // NPCs may have moved (but friendly ones stay put)
  // Cleared obstacles don't re-activate
  
  // NEW: small chance of new content on revisit
  revisitEvents?: {
    chance: number;      // 0.0 to 0.3
    type: 'loot_missed' | 'npc_moved_here' | 'threat_trace' | 'environmental_change';
    template: string;
  }[];
}
```

Examples of revisit narration:
```
First visit:  "Le couloir médical est plongé dans la pénombre. Des flacons
               renversés jonchent le sol. Un néon grésille au plafond."

Revisit:      "Vous revenez dans le couloir médical. Les flacons brisés
               craquent sous vos pas. Rien n'a changé — sauf ce sentiment
               d'être observé."
```

### Anti-Frustration: Progress Indicators

The UI subtly indicates which direction leads forward:

```
> Sorties visibles :
>   ← Couloir principal [déjà exploré]
>   → Salle des machines [inexploré]
>   ↓ Conduit de maintenance [inexploré]
```

The player sees "already explored" vs "unexplored" but is never
told "you should go this way." Freedom to choose, gentle nudge forward.

---

## 3. Difficulty Settings & Permadeath

### Three Difficulty Presets

```typescript
type DifficultyLevel = 'explorer' | 'survivor' | 'nightmare';

interface DifficultySettings {
  // Display name
  name: LocaleString;
  description: LocaleString;

  // DC modifier (added to all difficulty checks)
  dcModifier: number;

  // Player HP multiplier
  hpMultiplier: number;

  // Failsafe configuration
  failsafeThreshold: number;    // Failed attempts before failsafe activates
  failsafeEnabled: boolean;     // Can be fully disabled!
  failsafeCost: number;         // HP cost of degraded bypass

  // Threat director modifiers
  threatEncounterMultiplier: number;
  threatDamageMultiplier: number;

  // Resource availability
  healingItemFrequency: number; // 0.0 to 1.0

  // Death behavior
  permadeath: boolean;           // Game over on HP ≤ 0?
  secondChanceEnabled: boolean;  // One free death bailout?
}

const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultySettings> = {
  explorer: {
    name: { fr: 'Explorateur', en: 'Explorer' },
    description: {
      fr: 'Pour profiter de l\'histoire. Échecs rarement fatals.',
      en: 'For the story. Failures are rarely fatal.',
    },
    dcModifier: -2,
    hpMultiplier: 1.5,
    failsafeThreshold: 2,         // Failsafe after just 2 failures
    failsafeEnabled: true,
    failsafeCost: 1,              // Cheap bypass
    threatEncounterMultiplier: 0.5,
    threatDamageMultiplier: 0.5,
    healingItemFrequency: 0.8,
    permadeath: false,            // HP ≤ 0 → knocked out, revive at -1 HP, skip obstacle
    secondChanceEnabled: true,
  },

  survivor: {
    name: { fr: 'Survivant', en: 'Survivor' },
    description: {
      fr: 'L\'expérience classique. Tension réelle, mort possible.',
      en: 'The intended experience. Real tension, death is possible.',
    },
    dcModifier: 0,
    hpMultiplier: 1.0,
    failsafeThreshold: 4,         // 4 failures before failsafe
    failsafeEnabled: true,
    failsafeCost: 3,              // Costly bypass
    threatEncounterMultiplier: 1.0,
    threatDamageMultiplier: 1.0,
    healingItemFrequency: 0.4,
    permadeath: true,             // Dead = dead
    secondChanceEnabled: true,    // One free bailout per game
  },

  nightmare: {
    name: { fr: 'Cauchemar', en: 'Nightmare' },
    description: {
      fr: 'Pour les masochistes. Chaque erreur peut être fatale.',
      en: 'For masochists. Every mistake can be fatal.',
    },
    dcModifier: +2,
    hpMultiplier: 0.75,
    failsafeThreshold: 6,         // 6 failures — almost never triggers
    failsafeEnabled: false,       // NO FAILSAFE. Stuck = game over.
    failsafeCost: 5,              // N/A but if somehow triggered
    threatEncounterMultiplier: 1.5,
    threatDamageMultiplier: 1.5,
    healingItemFrequency: 0.2,
    permadeath: true,
    secondChanceEnabled: false,   // No safety net at all
  },
};
```

### How Death Works

```typescript
function checkDeath(state: GameState): DeathResult | null {
  const diff = state.difficulty;

  if (state.player.hp <= 0) {
    if (!diff.permadeath) {
      // EXPLORER: knocked out, skip current obstacle
      return {
        type: 'knockout',
        narrative: t('death.knockout'), // "Tout devient noir..."
        hpRestored: 1,
        consequence: 'skip_current_obstacle',
      };
    }

    if (diff.secondChanceEnabled && !state.secondChanceUsed) {
      // SURVIVOR first death: dramatic rescue
      return {
        type: 'second_chance',
        narrative: t('death.secondChance'), // "Vous sombrez... mais quelque chose vous retient."
        hpRestored: Math.floor(state.player.maxHp * 0.25),
        consequence: 'mark_second_chance_used',
      };
    }

    // TRUE DEATH: game over
    return {
      type: 'permadeath',
      narrative: null, // Composed by narration layer based on cause of death
      consequence: 'game_over',
    };
  }

  // ALSO check oxygen for space settings
  if (state.player.oxygen !== undefined && state.player.oxygen <= 0) {
    // Same logic but with asphyxiation narrative
    // ...
  }

  return null;
}
```

### Nightmare Mode: What "Stuck = Game Over" Means

In Nightmare, if the player fails all paths on an obstacle AND there's
no failsafe, the threat director accelerates:

```
AFTER 5+ FAILURES ON SAME OBSTACLE (Nightmare only):

Turn 6: "Des bruits de pas lourds résonnent au bout du couloir.
         La créature vous a trouvé."

Turn 7: Forced combat encounter with the main threat.
        Player either wins the combat or dies.

Turn 8: If still stuck, the threat kills the player.
        GAME OVER.
```

This is intentional: Nightmare mode **should** feel unfair. It's the
Dark Souls difficulty — for players who want real stakes.

---

## 4. Modules × Tension Levels

### The Answer: Tension Ranges + Narrative Skins

Each module defines a **tension range** (min/max) it supports. The
assembly algorithm places modules where their range matches the needed
beat. The module's narrative adapts to the actual tension level.

```typescript
interface ScenarioModule {
  id: string;
  type: ModuleType;

  // Tension range this module can operate in
  tensionRange: [number, number]; // e.g., [2, 6] or [5, 9]

  // The obstacle difficulty scales with tension
  obstacle: ScalableObstacle;

  // Narrative has variants for different tension levels
  narrativeTier: 'low' | 'mid' | 'high' | 'any';
  // 'any' = works at any tension (rare, very generic modules)

  // ...
}
```

### Three Tiers of Modules

Instead of writing a module for every tension level, we write modules in
**three tiers** with **narrative skins** that adapt:

```
TIER 1 — LOW TENSION (range [1, 4]) → intro, early rising
  Tone: calm exploration, curiosity, mild unease
  Obstacles: easy to moderate (DC 8-12)
  Examples: locked cabinet, dark corridor, offline terminal

TIER 2 — MID TENSION (range [3, 7]) → rising, midpoint
  Tone: alert, growing danger, urgency
  Obstacles: moderate (DC 10-14)
  Examples: patrol enemy, wounded NPC, blocked passage, puzzle

TIER 3 — HIGH TENSION (range [6, 10]) → escalation, climax
  Tone: desperate, hunted, time pressure
  Obstacles: hard (DC 13-18)
  Examples: active threat, collapsing environment, final gate
```

Note the **overlapping ranges**: Tier 1 [1-4], Tier 2 [3-7], Tier 3 [6-10].
A mid-tier module placed at tension 3 feels like an easy encounter; the
same module at tension 7 feels urgent. The difference is **narration**,
not mechanics.

### How Obstacle Difficulty Scales With Tension

```typescript
interface ScalableObstacle extends ObstacleDefinition {
  // Base DCs defined for the "normal" tension level of the module
  paths: ResolutionPath[];

  // DC is adjusted based on actual tension placement
  // If module is placed at higher tension → DCs increase
  // If placed at lower tension → DCs decrease
  dcScaling: 'linear' | 'steep';
}

function scaleDC(baseDC: number, moduleTension: number, actualTension: number): number {
  const delta = actualTension - moduleTension;
  // ±1 DC per tension level difference
  return Math.max(5, Math.min(20, baseDC + delta));
}
```

Example: "Blocked Airlock" module

```
AT TENSION 3 (rising, calm):
  "Le sas est bloqué. Le mécanisme grince en résistant."
  DC hack: 10 | DC force: 12 | DC vent: 8

AT TENSION 6 (midpoint, urgent):
  "Le sas est scellé — le système de quarantaine s'est déclenché.
   Des lumières rouges clignotent."
  DC hack: 13 | DC force: 15 | DC vent: 11

AT TENSION 9 (climax, desperate):
  "Le sas est verrouillé. Derrière vous, les pas de la créature
   se rapprochent. Il faut passer MAINTENANT."
  DC hack: 16 | DC force: 18 | DC vent: 14
  + Time pressure: if not resolved in 2 turns, threat arrives
```

Same module, same structure, completely different feel.

### Narrative Tier Skins

Each module has 3 narrative skins (low/mid/high tension), containing:

```typescript
interface NarrativeSkin {
  tension: 'low' | 'mid' | 'high';
  // Location descriptions
  descriptions: {
    firstVisit: LocaleString;
    revisit: LocaleString;
  };
  // Obstacle narration
  obstacleIntro: LocaleString;
  // Per-path outcome templates (success, failure, critical...)
  pathTemplates: Record<string, OutcomeTemplates>;
  // Ambient details (one picked randomly per visit)
  ambientDetails: LocaleString[];
  // Sound/atmosphere cue
  atmosphereCue: LocaleString;
}
```

### Module Count Needed Per Tier

```
TIER 1 (low):     8-10 modules  → enough for quick/standard intros
TIER 2 (mid):    12-15 modules  → bulk of standard gameplay
TIER 3 (high):    8-10 modules  → escalation and climax variety

TOTAL: ~30-35 unique modules
```

This is a manageable content volume. Each module has 3 narrative skins,
but the game logic is written once.

---

## 5. Module Genericity × Setting Compatibility

### Three-Layer Module System

```
LAYER 1 — UNIVERSAL MODULES (work in any setting)
  Abstract obstacles that exist everywhere.
  "locked door", "dark room", "collapsed passage",
  "hostile entity", "wounded survivor", "broken terminal"

LAYER 2 — CATEGORY MODULES (work in a setting family)
  Category: space_vessel → derelict_ship, space_station,
                           prison_transport, generation_ship
  Category: planetary    → planetary_colony, asteroid_mine
  Category: alien        → alien_ruins
  Category: facility     → research_lab, space_station

  "airlock malfunction"    → space_vessel only
  "cave-in risk"           → planetary only
  "alien mechanism"        → alien only
  "containment breach"     → facility only

LAYER 3 — SETTING-SPECIFIC MODULES (one setting only)
  "cockpit access"         → derelict_ship, prison_transport
  "crystal resonance trap" → alien_ruins
  "mining drill room"      → asteroid_mine
  "cryo-pod chamber"       → generation_ship
  "zero-g hub"             → space_station
```

### Tag System

```typescript
type SettingCategory = 'space_vessel' | 'planetary' | 'alien' | 'facility';

interface SettingDefinition {
  id: string;
  categories: SettingCategory[];
  // Setting-specific location name pools
  locationNames: LocaleString[];
  // Setting-specific environmental features
  features: string[];
  // Setting-specific items more likely to appear
  preferredItems: string[];
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
      { fr: 'Nexus gravitationnel', en: 'Gravitational Nexus' },
      // ...
    ],
    features: ['crystal_node', 'organic_wall', 'alien_terminal', 'gravity_well'],
    preferredItems: ['translator_device', 'void_shard', 'psionic_amplifier'],
  },
  // ...
};

interface ScenarioModule {
  // ...existing fields...

  // Compatibility tags
  compatibility: {
    universal: boolean;          // Works everywhere?
    categories: SettingCategory[]; // Which categories?
    settings: string[];          // Which specific settings?
    excludeSettings: string[];   // Blacklist (e.g., no "airlock" in alien_ruins)
  };

  // Location names adapt to setting
  // Instead of hardcoding "Airlock Corridor", the module defines a ROLE
  locationRole: string; // 'passage', 'control_room', 'storage', 'hazard_zone'
  // The setting provides the actual name
}
```

### Setting-Aware Module Assembly

```typescript
function getCompatibleModules(
  setting: SettingDefinition,
  tier: 'low' | 'mid' | 'high',
): ScenarioModule[] {
  return ALL_MODULES.filter(module => {
    // Check tier
    if (module.narrativeTier !== tier && module.narrativeTier !== 'any') return false;

    // Check compatibility
    if (module.compatibility.universal) return true;
    if (module.compatibility.settings.includes(setting.id)) return true;
    if (module.compatibility.categories.some(c => setting.categories.includes(c))) return true;

    // Check blacklist
    if (module.compatibility.excludeSettings.includes(setting.id)) return false;

    return false;
  });
}
```

### Location Name Resolution

Modules define abstract **roles**, settings provide concrete **names**:

```typescript
const LOCATION_NAME_POOLS: Record<string, Record<string, LocaleString[]>> = {
  // Role → Setting → Name options
  passage: {
    derelict_ship: [
      { fr: 'Coursive principale', en: 'Main Corridor' },
      { fr: 'Couloir bâbord', en: 'Port Corridor' },
      { fr: 'Passerelle de jonction', en: 'Junction Bridge' },
    ],
    alien_ruins: [
      { fr: 'Tunnel organique', en: 'Organic Tunnel' },
      { fr: 'Passage cristallin', en: 'Crystalline Passage' },
      { fr: 'Boyau membraneux', en: 'Membranous Crawlway' },
    ],
    asteroid_mine: [
      { fr: 'Galerie principale', en: 'Main Gallery' },
      { fr: 'Tunnel de forage', en: 'Drill Tunnel' },
      { fr: 'Veine d\'extraction', en: 'Extraction Vein' },
    ],
  },
  control_room: {
    derelict_ship: [
      { fr: 'Salle de contrôle', en: 'Control Room' },
      { fr: 'Poste de commande auxiliaire', en: 'Auxiliary Bridge' },
    ],
    alien_ruins: [
      { fr: 'Nexus de contrôle', en: 'Control Nexus' },
      { fr: 'Chambre de pilotage alien', en: 'Alien Piloting Chamber' },
    ],
    asteroid_mine: [
      { fr: 'Centre de supervision', en: 'Oversight Center' },
      { fr: 'Poste de contrôle minier', en: 'Mining Control Post' },
    ],
  },
  // ... for each role: passage, control_room, storage,
  //     hazard_zone, medical, quarters, hub, dead_end
};
```

### Distribution Target

```
UNIVERSAL modules:    12-15  (40% of total)
CATEGORY modules:      8-12  (30% of total) — ~2-3 per category
SETTING-SPECIFIC:      8-10  (30% of total) — ~1-2 per setting

TOTAL:                ~30-35 modules

With 8 settings → each setting has access to:
  12-15 universal + 2-6 category + 1-2 specific = 15-23 modules

That's enough for even extended sessions (8-12 modules used per game)
with no repeats within a single playthrough.
```

---

## 6. Content Volume Estimation

### The Question

How much content do we need so that the player feels like every game
is different?

### The Math

A **standard session** uses:
- 1 core skeleton (4 nodes)
- 3-5 modules (each with 1-3 locations)
- ~20-30 turns total
- ~20-30 narrative outputs

For the player to feel variety, they need to play **at least 5 sessions**
before encountering the same module in the same setting. Ideally 10+.

### Content Inventory

```
═══════════════════════════════════════════════════════════
COMPONENT                          QUANTITY    EFFORT
═══════════════════════════════════════════════════════════

CORE SKELETONS                          5      ███░░
  Each = 4 core nodes + victory conditions
  "Escape", "Investigate", "Rescue", "Eliminate", "Retrieve"

MODULES (game logic)                   30      █████
  Universal:       15
  Category-specific: 10
  Setting-specific:   5
  Each = obstacle + 3-5 resolution paths + items/NPCs

MODULE NARRATIVE SKINS                 90      ████████
  30 modules × 3 tension tiers
  Each skin = descriptions, obstacle text, outcome templates
  × 2 languages = 180 skin files (EN can ship later)

ITEMS                                  40      ██░░░
  20 predefined items (tools, weapons, consumables, data)
  20 setting-specific items (2-3 per setting)
  Each = name, description, properties (both languages)

NPC ARCHETYPES                         15      ██░░░
  5 universal types (survivor, android, hostile, authority, creature)
  10 setting-specific variants
  Each = name pool, dialogue lines, behavior rules

SETTINGS                                8      ██░░░
  Already defined. Each needs:
  - Location name pool (20+ names per role × 8 roles)
  - Feature pool
  - Preferred items list
  - Atmospheric descriptions

NARRATIVE TEMPLATES (action outcomes)  ~400    ████████████
  This is the BIG one. Broken down:

  50 verbs × 5 outcomes × 3 tensions = 750 combinations
  NOT all need unique templates — we use fallbacks:
  
  TOP 15 verbs (most used):     15 × 5 × 3 = 225 templates
    STRIKE, THROW, SHOOT, HACK, REPAIR, EXAMINE, PERSUADE,
    INTIMIDATE, HIDE, MOVE_TO, OPEN, BREAK, USE, CLIMB, DODGE

  NEXT 15 verbs (common):       15 × 3 × 2 =  90 templates
    (reduced: 3 outcomes × 2 tensions, fallback to generic for rest)

  REMAINING 20 verbs (rare):    20 × 2 × 1 =  40 templates
    (reduced: success/failure × 1 tension, fallback to generic)

  GENERIC FALLBACKS:             4 × 5 × 3 =  60 templates
    (per verb CATEGORY × outcome × tension)

  ABSURD ACTION templates:                      15 templates
  ENVIRONMENTAL templates:                      20 templates
    (depressurize, fire, flood, power cut, gravity, etc.)

  TOTAL NARRATIVE TEMPLATES:                  ~450 templates

  × 2 languages = ~900 total strings
  (EN can ship after FR, using generic fallbacks initially)

ENVIRONMENTAL CLUES                    50      ███░░
  Datapads, wall messages, audio logs, physical evidence
  10-12 per category, themed per setting
  Each = short paragraph of atmospheric text

REVISIT DESCRIPTIONS                   ~60     ██░░░
  ~2 per unique location role × ~8 roles × ~4 variants
  Short, procedurally enhanced

THREAT DIRECTOR NARRATIVES             40      ██░░░
  Hints, sightings, environmental effects
  ~8 per beat zone (intro through climax)

═══════════════════════════════════════════════════════════
TOTAL UNIQUE CONTENT PIECES:         ~800
TOTAL LOCALIZED STRINGS:           ~1,600 (× 2 languages)
═══════════════════════════════════════════════════════════
```

### Variety Analysis

With this content volume, a player will experience:

```
Session 1:   Skeleton A + modules [3,7,14,22] + setting "derelict_ship"
Session 2:   Skeleton B + modules [1,9,18,25] + setting "alien_ruins"
Session 3:   Skeleton A + modules [5,11,20,28] + setting "space_station"
Session 4:   Skeleton C + modules [2,8,16,23] + setting "asteroid_mine"
Session 5:   Skeleton B + modules [6,12,19,30] + setting "research_lab"

→ After 5 sessions: 0 repeated modules, 1 repeated skeleton (different modules)
→ After 10 sessions: maybe 2-3 repeated modules, but in different settings
                      with different tension levels → feels different
→ After 20+ sessions: modules start repeating, but narrative template
                       variety keeps the text fresh
```

### Priority Order for Content Creation

```
PHASE 5 (MUST HAVE for launch):
  ✅ 3 core skeletons
  ✅ 15 modules (5 universal, 5 mid-tier, 5 high-tier)
  ✅ 225 narrative templates (top 15 verbs, full coverage)
  ✅ 60 generic fallback templates
  ✅ 20 items
  ✅ 3 settings fully fleshed out
  ✅ 10 NPC archetypes

POST-LAUNCH (expand variety):
  📝 +2 core skeletons
  📝 +15 modules (category and setting-specific)
  📝 +200 narrative templates (remaining verbs)
  📝 +20 items
  📝 +5 settings fully fleshed out
  📝 +5 NPC archetypes
  📝 +50 environmental clues
```

---

## 7. Narrative Variety System

### The Problem

The player must never feel like they're reading the same text twice.
Narrative output must adapt to **10+ contextual dimensions** simultaneously.

### The Solution: Layered Template Composition

Instead of writing one template that does everything, we compose the
final narrative from **independent layers** that combine:

```
FINAL NARRATIVE = 
    Action sentence (what happens)
  + Sensory detail  (what the player perceives)
  + Consequence     (what changes in the world)
  + Atmosphere      (mood/environment snippet)
  + Player state    (optional, based on HP/condition)
  + Threat hint     (optional, based on pacing)
```

Each layer is selected independently based on its own context.

### The 12 Context Dimensions

Every narrative output considers these dimensions:

```typescript
interface NarrativeContext {
  // 1. VERB — What action was performed
  verb: VerbId;                    // STRIKE, HACK, PERSUADE...
  verbCategory: VerbCategory;      // physical, technical, social, creative

  // 2. OUTCOME — How the dice resolved
  outcome: Outcome;                // crit_success, success, failure, crit_failure
  margin: number;                  // How much above/below the DC (-10 to +10)

  // 3. TARGET — What was the action applied to
  target: TargetInfo;              // name, type, properties, bodyPart?
  targetDisposition: Disposition;   // hostile, neutral, friendly, inanimate

  // 4. TOOL — What item was used (if any)
  toolUsed: ItemInfo | null;

  // 5. LOCATION — Where it happened
  location: LocationInfo;          // name, description, features, conditions
  environmentConditions: Set<string>; // dark, on_fire, depressurized, etc.

  // 6. TENSION — Current story tension level
  tension: number;                 // 1-10
  beat: BeatZone;                  // intro, rising, midpoint, escalation, climax

  // 7. SETTING — World theme
  settingId: string;               // derelict_ship, alien_ruins, etc.

  // 8. PLAYER STATE — Physical condition
  playerHpPercent: number;         // 0.0 to 1.0
  playerConditions: Set<string>;   // wounded, poisoned, terrified, etc.

  // 9. MODULE CONTEXT — Which scenario module we're in
  moduleId: string;
  moduleType: ModuleType;          // blocked_passage, patrol_enemy, etc.

  // 10. NPC PRESENT — Are NPCs watching/reacting
  npcsPresent: NpcInfo[];

  // 11. HISTORY — What happened recently
  recentEvents: string[];          // Last 3-5 events for continuity
  turnNumber: number;

  // 12. CREATIVITY — Was this a creative/unusual action
  isCreative: boolean;
  isAbsurd: boolean;
}
```

### Template Selection Algorithm

```typescript
function selectTemplate(ctx: NarrativeContext): NarrativeTemplate {
  // PRIORITY 1: Look for a SPECIFIC template matching verb + target type + outcome
  //   e.g., "HACK + electronic + success" → very specific hacking success text
  let template = findTemplate({
    verb: ctx.verb,
    targetType: ctx.target.type,
    outcome: ctx.outcome,
    tension: tensionTier(ctx.tension),
  });

  // PRIORITY 2: Look for verb + outcome (any target)
  if (!template) {
    template = findTemplate({
      verb: ctx.verb,
      outcome: ctx.outcome,
      tension: tensionTier(ctx.tension),
    });
  }

  // PRIORITY 3: Look for verb category + outcome (generic)
  if (!template) {
    template = findTemplate({
      verbCategory: ctx.verbCategory,
      outcome: ctx.outcome,
      tension: tensionTier(ctx.tension),
    });
  }

  // PRIORITY 4: Ultimate fallback (should never reach here in production)
  if (!template) {
    template = GENERIC_FALLBACK[ctx.outcome];
  }

  return template;
}
```

### Layer Composition

```typescript
function composeNarrative(ctx: NarrativeContext): string {
  const parts: string[] = [];

  // ── LAYER 1: ACTION RESULT (mandatory) ──
  const actionTemplate = selectTemplate(ctx);
  parts.push(renderTemplate(actionTemplate, ctx));

  // ── LAYER 2: SENSORY DETAIL (80% chance, skip if auto-success) ──
  if (ctx.outcome !== 'auto_success' && Math.random() < 0.8) {
    const sensory = selectSensoryDetail(ctx);
    if (sensory) parts.push(sensory);
  }

  // ── LAYER 3: CONSEQUENCE (if state changed) ──
  if (ctx.stateChanges && ctx.stateChanges.length > 0) {
    const consequence = selectConsequenceNarrative(ctx);
    if (consequence) parts.push(consequence);
  }

  // ── LAYER 4: ATMOSPHERE (40% chance, based on tension) ──
  if (Math.random() < 0.3 + ctx.tension * 0.05) {
    const atmosphere = selectAtmosphereSnippet(ctx);
    if (atmosphere) parts.push(atmosphere);
  }

  // ── LAYER 5: PLAYER STATE (only if HP critical or condition active) ──
  if (ctx.playerHpPercent < 0.3) {
    parts.push(selectLowHpSnippet(ctx));
  } else if (ctx.playerConditions.size > 0) {
    parts.push(selectConditionSnippet(ctx));
  }

  // ── LAYER 6: THREAT HINT (based on threat director) ──
  const threatHint = getThreatHint(ctx);
  if (threatHint) parts.push(threatHint);

  // ── LAYER 7: NPC REACTION (if NPCs are present and watching) ──
  if (ctx.npcsPresent.length > 0) {
    const npcReaction = selectNpcReaction(ctx);
    if (npcReaction) parts.push(npcReaction);
  }

  return parts.join(' ');
}
```

### Layer Detail: Sensory Details

Sensory details are short phrases (~10-20 words) that add texture.
They're selected based on setting + environment + tension:

```typescript
const SENSORY_POOLS: Record<string, Record<string, LocaleString[]>> = {
  derelict_ship: {
    default: [
      { fr: 'Le néon au-dessus de vous grésille avant de s\'éteindre brièvement.', en: '...' },
      { fr: 'Quelque part, un tuyau fuit. Le goutte-à-goutte résonne dans le silence.', en: '...' },
      { fr: 'L\'air recyclé a un goût métallique désagréable.', en: '...' },
      { fr: 'Le sol vibre légèrement — les moteurs auxiliaires tournent encore.', en: '...' },
    ],
    dark: [
      { fr: 'Votre lampe projette des ombres mouvantes sur les parois.', en: '...' },
      { fr: 'Dans l\'obscurité, chaque son semble amplifié.', en: '...' },
    ],
    on_fire: [
      { fr: 'La chaleur est étouffante. La fumée pique les yeux.', en: '...' },
      { fr: 'Des flammes lèchent le plafond, projetant des lueurs orangées.', en: '...' },
    ],
    depressurized: [
      { fr: 'Le silence du vide est assourdissant.', en: '...' },
      { fr: 'Des débris flottent en apesanteur autour de vous.', en: '...' },
    ],
  },
  alien_ruins: {
    default: [
      { fr: 'Les cristaux sur les murs pulsent doucement, comme un cœur qui bat.', en: '...' },
      { fr: 'L\'architecture semble vivante — les proportions changent quand vous ne regardez pas.', en: '...' },
      { fr: 'Un bourdonnement subsonique fait vibrer vos dents.', en: '...' },
    ],
    // ...
  },
  // ...one block per setting × environment condition
};
```

### Layer Detail: Player State Snippets

Short phrases reflecting the player's physical condition:

```typescript
const LOW_HP_SNIPPETS: LocaleString[] = [
  { fr: 'Chaque mouvement ravive la douleur.', en: 'Every movement reignites the pain.' },
  { fr: 'Votre vision se trouble par moments.', en: 'Your vision blurs intermittently.' },
  { fr: 'Le goût du sang est omniprésent.', en: 'The taste of blood won\'t go away.' },
  { fr: 'Vos mains tremblent. Pas de peur — d\'épuisement.', en: 'Your hands shake. Not from fear — from exhaustion.' },
  { fr: 'Combien de temps encore ?', en: 'How much longer?' },
];

const CONDITION_SNIPPETS: Record<string, LocaleString[]> = {
  wounded: [
    { fr: 'La blessure à votre flanc pulse au rythme de votre cœur.', en: '...' },
  ],
  poisoned: [
    { fr: 'La nausée revient par vagues. Votre corps lutte.', en: '...' },
  ],
  terrified: [
    { fr: 'Vos instincts hurlent de fuir. Vous résistez — pour l\'instant.', en: '...' },
  ],
};
```

### Layer Detail: NPC Reactions

When NPCs are present, they react to the player's action:

```typescript
const NPC_REACTIONS: Record<Disposition, Record<Outcome, LocaleString[]>> = {
  friendly: {
    crit_success: [
      { fr: '{npc_name} hoche la tête avec admiration.', en: '...' },
      { fr: '« Impressionnant », murmure {npc_name}.', en: '...' },
    ],
    failure: [
      { fr: '{npc_name} grimace en vous voyant échouer.', en: '...' },
      { fr: '« Peut-être autrement ? » suggère {npc_name}.', en: '...' },
    ],
    crit_failure: [
      { fr: '{npc_name} détourne le regard, gêné.', en: '...' },
    ],
  },
  hostile: {
    crit_success: [
      { fr: '{npc_name} recule, surpris par votre efficacité.', en: '...' },
    ],
    failure: [
      { fr: '{npc_name} émet un son qui ressemble à un rire.', en: '...' },
      { fr: '{npc_name} profite de votre erreur pour avancer d\'un pas.', en: '...' },
    ],
  },
  // ...
};
```

### Preventing Repetition: The "Recently Used" Buffer

The narrative composer tracks recently used templates and snippets
to avoid repeating the same text:

```typescript
class NarrationMemory {
  // Last N templates used (by their ID)
  private recentTemplateIds: string[] = [];
  private recentSensoryIds: string[] = [];
  private recentAtmosphereIds: string[] = [];
  private readonly bufferSize = 10;

  select(pool: Template[], ctx: NarrativeContext): Template {
    // Filter out recently used
    const available = pool.filter(t => !this.recentTemplateIds.includes(t.id));

    // If all have been used recently, allow repeats but prefer least recent
    if (available.length === 0) {
      return pool[0]; // Least recently used
    }

    // Pick randomly from available (optionally weighted by relevance)
    const chosen = pickRandom(available);
    this.recentTemplateIds.push(chosen.id);
    if (this.recentTemplateIds.length > this.bufferSize) {
      this.recentTemplateIds.shift();
    }
    return chosen;
  }
}
```

### Worked Example: Full Narrative Composition

**Context:** Player hacks a terminal in a dark engine room on a derelict ship,
tension 7 (escalation), HP at 40%, a hostile robot is watching, roll was a
success by margin +3.

```
LAYER 1 (action): "Vos doigts dansent sur le clavier holographique. Les
  pare-feu tombent un par un — accès accordé."
  [verb=HACK, target=terminal, outcome=success, tension=high]

LAYER 2 (sensory): "L'écran projette une lueur bleutée sur votre visage,
  seule source de lumière dans cette salle."
  [setting=derelict_ship, condition=dark]

LAYER 3 (consequence): "Les données du journal de bord s'affichent.
  Ce que vous lisez vous glace le sang."
  [stateChange=data_acquired, module=terminal_puzzle]

LAYER 4 (atmosphere): "Derrière le mur, les moteurs grondent comme
  un animal blessé."
  [setting=derelict_ship, tension=7]

LAYER 5 (player state): "Votre vision se trouble par moments."
  [hp=40%]

LAYER 6 (threat): [skipped — threat director says no hint this turn]

LAYER 7 (NPC reaction): "Le robot sentinelle pivote vers vous. Ses
  capteurs clignotent — il vous a repéré."
  [npc=hostile, outcome=success → player drew attention]
```

**Final output:**
> *Vos doigts dansent sur le clavier holographique. Les pare-feu tombent
> un par un — accès accordé. L'écran projette une lueur bleutée sur
> votre visage, seule source de lumière dans cette salle. Les données du
> journal de bord s'affichent. Ce que vous lisez vous glace le sang.
> Derrière le mur, les moteurs grondent comme un animal blessé. Votre
> vision se trouble par moments. Le robot sentinelle pivote vers vous.
> Ses capteurs clignotent — il vous a repéré.*

Each sentence came from a different pool, selected independently.
Same action in a different context would produce completely different text.

### Template Volume Per Layer

```
LAYER 1 (action):      ~450 templates (see section 6)
LAYER 2 (sensory):     ~120 snippets (8 settings × 5 conditions × 3 each)
LAYER 3 (consequence):  ~60 snippets (20 state change types × 3 variants)
LAYER 4 (atmosphere):   ~80 snippets (8 settings × 10 generic)
LAYER 5 (player state): ~30 snippets (5 conditions × 5 each + 5 low HP)
LAYER 6 (threat hints): ~40 snippets (5 beats × 8 hints)
LAYER 7 (NPC reactions):~50 snippets (5 dispositions × 5 outcomes × 2)
───────────────────────────────────────────────────────────
TOTAL:                  ~830 independent text snippets
× 2 languages:        ~1,660 localized strings
```

Since layers compose independently, the actual combinatorial variety is:

```
450 × 120 × 60 × 80 × 30 × 40 × 50 = astronomically large

Even with constraints reducing actual combinations, the player will
effectively NEVER read the exact same narrative twice.
```

---

## Summary of All Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Language | `t()` system, FR primary, EN secondary, parser always bilingual |
| 2 | Backtracking | Free movement always. Linear progression, free exploration. Revisit narration changes. |
| 3 | Difficulty | 3 presets (Explorer/Survivor/Nightmare). Failsafe threshold scales. Nightmare has no failsafe. Permadeath is real. Second chance on Survivor. |
| 4 | Tension × modules | 3 tiers (low/mid/high) with overlapping ranges. DCs scale with actual tension. 3 narrative skins per module. ~30-35 modules total. |
| 5 | Genericity × settings | 3 layers: universal (40%), category (30%), setting-specific (30%). Tag system. Location names resolved from setting pools via abstract roles. |
| 6 | Content volume | ~800 unique content pieces, ~1,600 localized strings. Launch target: 3 skeletons, 15 modules, 225 templates, 3 settings. |
| 7 | Narrative variety | 7-layer composition system. 12 context dimensions. ~830 independent snippets. Recently-used buffer prevents repetition. Combinatorial variety is effectively infinite. |

### Amendments to ROADMAP.md

| Phase | Addition |
|-------|----------|
| Phase 0 | Add difficulty system types + i18n `t()` |
| Phase 1 | Item/NPC definitions include locale fields |
| Phase 3 | Add failsafe system, difficulty scaling, obstacle state tracking |
| Phase 4 | 7-layer composition system. Sensory/atmosphere/player state/NPC pools. Recently-used buffer. |
| Phase 5 | 3-tier modules with narrative skins. Setting compatibility tags. Location name pools. Threat director. Module assembly with tension validation. |
| Phase 6 | Difficulty selector on character creation. Language switcher in settings. |
