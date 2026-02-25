# Phase 6 — Scenarios & Victory

> **Status:** PENDING
> **Duration:** 2.5 weeks (Week 1: architecture + content, Week 2: systems, Week 2.5: bots + stress)
> **Prerequisites:** Phase 5 complete
> **Reference docs:** `SCENARIO_DESIGN.md` (full doc), `GAME_SYSTEMS.md` (§10 Black Box, §11 Secret Verbs, §9 Save)

---

## Brainstorm Gate — RESOLVED

| Question | Decision |
|----------|----------|
| 3 launch skeletons | **Escape, Investigate, Rescue** (Eliminate + Retrieve post-launch) |
| 15 launch modules | 5 universal + 5 category + 5 complex — all 10 module types covered |
| Narrative skins | 3 per module (low/mid/high) with DC modifier + suggestion priority shift |
| Black Box placement | Cross-skeleton lore, matched by **setting** not skeleton. Death preferred (80%) over victory (30%). Side room in rising beat. |
| Victory alternatives | Primary + alternative per skeleton + 3 emergent types (env kill, containment, self-destruct) — all require multi-turn setup |
| 3 launch settings | **derelict_ship, space_station, alien_ruins** with location role compatibility matrix |
| Skeleton structure | **Expanded to 6 nodes** matching all 6 beats (START → UNLOCK → REVEAL → ESCALATION → BOSS → RESOLUTION) |
| Auto-playtest | Random bot + goal-seeking bot, pure Node, seeded RNG |

---

## 1. Expanded Skeleton — 6-Node Structure

### 1.1 Rationale

The original 4-node skeleton (START → UNLOCK → REVEAL → BOSS) only maps to 4 of 6 story beats. Modules filled the gaps but beat assignment was ambiguous. The expanded 6-node skeleton gives every beat a dedicated anchor node.

### 1.2 Core Skeleton Interface

```typescript
interface CoreSkeleton {
  id: string;
  nameKey: LocaleString;
  nodes: [
    { id: 'start';       role: 'entry';       beat: 'intro' },
    { id: 'unlock';      role: 'gate';        beat: 'rising' },
    { id: 'reveal';      role: 'midpoint';    beat: 'midpoint' },
    { id: 'escalation';  role: 'escalation';  beat: 'escalation' },
    { id: 'boss';        role: 'climax';      beat: 'climax' },
    { id: 'resolution';  role: 'epilogue';    beat: 'resolution' },
  ];

  // Gate progression
  gateItem: string;              // Item ID required to pass UNLOCK node
  gateItemLocation: string;      // Where the gate item is found

  // Narrative pivots
  revelation: string;            // What truth is revealed at REVEAL
  escalationTrigger: string;     // What goes wrong after REVEAL

  // Final challenge
  bossType: 'combat' | 'puzzle' | 'escape' | 'choice';

  // Designed victory paths
  primaryVictory: VictoryCondition;
  alternativeVictory: VictoryCondition;

  // Per-node location definitions (abstract roles — setting provides names)
  nodeLocations: Record<string, NodeLocationDef>;
}

interface NodeLocationDef {
  locationRole: string;          // Abstract role (e.g., 'control_room', 'passage')
  items: ItemDefinition[];       // Items present in this node
  npcs?: NpcDefinition[];        // NPCs present
  features: FeatureDefinition[]; // Environmental features
  exits: string[];               // Connected node IDs
}
```

### 1.3 Module Insertion Segments (4 segments)

```
start → unlock         SEGMENT A  (intro → rising)       — exploration, setup
unlock → reveal        SEGMENT B  (rising → midpoint)    — investigation, rising stakes
reveal → escalation    SEGMENT C  (midpoint → escalation) — things go wrong
escalation → boss      SEGMENT D  (escalation → climax)  — desperate push to the end
```

### 1.4 Session Lengths

```
Quick    (5 min)  → 6 core nodes only, 0 modules       (~10-15 turns)
Standard (30 min) → 6 core + 3-5 modules               (~25-35 turns)
Extended (2 hrs)  → 6 core + 8-12 modules               (~50-80 turns)
```

### 1.5 Weighted Module Distribution

```typescript
const SEGMENT_WEIGHTS: Record<string, number> = {
  'start-unlock':       0.20,   // 0-1 modules typically
  'unlock-reveal':      0.35,   // 1-2 modules (main exploration)
  'reveal-escalation':  0.25,   // 1 module (tension ramps)
  'escalation-boss':    0.20,   // 0-1 modules (urgency, don't pad)
};
```

---

## 2. The Three Launch Skeletons

### 2.1 ESCAPE — "Fuir l'Épave"

**Fantasy:** Dead Space × Alien. Wake up, survive, get out.

```
START: Cryopod Bay (intro, tension 2)
  Wake up alone. Alarms. Emergency lighting.
  Items: emergency_flashlight, medkit_basic
  Features: cryopod (broken), status_terminal, emergency_locker
  
UNLOCK: Security Checkpoint (rising, tension 4)
  Gate item: access_keycard (found in crew_quarters side room)
  Obstacle: locked bulkhead
    Path 1: hack security panel (INT, DC 12)
    Path 2: force the door (FOR, DC 14)
    Path 3: crawl through maintenance vent (AGI, DC 10)
  Failsafe: degraded_bypass (panel shorts out, door opens but sparks — 2 HP)
  
REVEAL: Captain's Quarters (midpoint, tension 6)
  Revelation: The creature is a bio-weapon experiment (Project ORACLE).
  The crew tried to contain it. Failed. You are the last survivor.
  Items: captain_log_datapad, EVA_suit_locker_key
  Features: captain_terminal (readable), viewport (shows ship damage)
  
ESCALATION: Life Support Hub (escalation, tension 8)
  Trigger: Creature has damaged life support. O2 is dropping ship-wide.
  Emergency power failing. Lights flicker and die in sections.
  Player must reach escape pod deck before air runs out.
  Obstacle: reroute life support
    Path 1: repair O2 system (INT, DC 14, buys 10 turns)
    Path 2: seal non-essential sections (INT, DC 12, buys 6 turns)
    Path 3: use EVA suit if found (auto-success, personal O2 only)
  Failsafe: narrative_rescue (backup O2 canister falls from damaged ceiling)
  
BOSS: Cargo Bay / Pod Deck (climax, tension 9-10)
  Boss type: escape
  The creature blocks the escape pod corridor.
  Primary victory: reach escape pod with access_keycard → launch
  Alternative victory: jettison cargo bay → environmental kill
  Emergent: depressurize cargo bay via breaching hull (2-turn setup, FOR 15+)
  
RESOLUTION: Escape Pod / Death (resolution, tension 3)
  Victory: pod launches, view of the ship receding into darkness
  Defeat: last moments narrated, Black Box journal generated
```

### 2.2 INVESTIGATE — "Signal Perdu"

**Fantasy:** Investigate a station gone silent. Uncover a conspiracy.

```
START: Docking Bay (intro, tension 2)
  You've docked with Station Phoebe-7. Silent for 72 hours.
  Your mission: find out what happened. Report back.
  Items: scanner_device, standard_toolkit
  Features: airlock (your ship), cargo_manifest_terminal, docking_clamps
  
UNLOCK: Comms Center (rising, tension 4)
  Gate item: encrypted_data_core (found in server room)
  Obstacle: encrypted terminal
    Path 1: hack the encryption (INT, DC 13)
    Path 2: find override password in director's notes (PER, DC 11)
    Path 3: persuade station AI to grant access (CHA, DC 13)
  Failsafe: alternate_route (maintenance terminal with partial access)
  
REVEAL: Director's Office (midpoint, tension 6)
  Revelation: Director Vasquez deliberately caused the containment failure.
  Insurance fraud: station worth more destroyed. Crew expendable.
  Evidence of cover-up. The "accident" was planned.
  Items: director_keycard, incriminating_files
  Features: director_terminal, wall_safe (breakable), evacuation_map
  
ESCALATION: Reactor Level (escalation, tension 8)
  Trigger: The reactor is destabilizing — consequence of the sabotage.
  Countdown begins (narrative, not real-time). Station AI is hostile:
  it was programmed to destroy evidence. Systems turning against you.
  Obstacle: bypass AI lockdown
    Path 1: disable AI core (INT, DC 15)
    Path 2: destroy AI physical nodes (FOR, DC 13, damages station further)
    Path 3: talk AI down with evidence of Vasquez's betrayal (CHA, DC 16 — hard but elegant)
  Failsafe: threat_escalation (AI activates security drones, but also opens doors to reroute you)
  
BOSS: Emergency Beacon Chamber (climax, tension 9)
  Boss type: puzzle
  The AI has locked down the beacon room. Final security layer.
  Primary victory: upload evidence to emergency beacon → rescue fleet incoming
  Alternative victory: trigger station self-destruct → evidence destroyed but you escape via your docked ship
  Emergent: reroute beacon signal through comms array (requires items from 2+ earlier locations)
  
RESOLUTION: Beacon Signal / Death (resolution, tension 3)
  Victory (beacon): evidence transmitted, rescue and justice incoming
  Victory (self-destruct): you survived, but the truth dies with the station
  Defeat: the truth dies with you — your Black Box is the only witness
```

### 2.3 RESCUE — "Dernier Signal"

**Fantasy:** Someone is alive in there. Get them out.

```
START: Crash Site (intro, tension 2)
  Your shuttle crashed on approach. Hull breached.
  A distress signal pulses from deeper inside.
  Items: emergency_beacon (broken), first_aid_kit
  Features: crashed_shuttle (damaged, some salvageable parts), hull_breach (can be sealed)
  
UNLOCK: Triage Point (rising, tension 4)
  Gate item: medical_stabilizer (found in supply cache nearby)
  Obstacle: collapsed corridor
    Path 1: clear debris manually (FOR, DC 12, slow)
    Path 2: find maintenance detour (PER, DC 11)
    Path 3: use plasma cutter to blast through (INT, DC 10, requires tool)
  Failsafe: degraded_bypass (crawl through unstable rubble, 3 HP damage)
  
REVEAL: Survivor's Location (midpoint, tension 6)
  Find Dr. Okonkwo — wounded but conscious. Former chief scientist.
  Revelation: they know the creature's weakness (sound sensitivity) —
  but also know the only exit route goes through its hunting ground.
  The creature was their experiment. Guilt drives their willingness to help.
  NPC: dr_okonkwo (wounded, disposition: cooperative, requires stabilizer)
  Items: research_notes (creature weakness), sonic_emitter (crafting component)
  
ESCALATION: The Hunt Begins (escalation, tension 8)
  Trigger: You're now escorting a wounded NPC. Movement is slower.
  The creature detects the survivor's blood. Active hunting begins.
  Every room is risk/reward: rush through (risk encounter) or clear first (costs turns/O2).
  NPC needs periodic re-stabilization (every 8 turns without action, condition worsens).
  Obstacle: creature ambush in corridor
    Path 1: fight it off (FOR, DC 14)
    Path 2: use sonic emitter to drive it back (INT, DC 11, if crafted)
    Path 3: sacrifice a resource to distract it (CHA/creative, auto-success, costs item)
  Failsafe: narrative_rescue (NPC shouts the creature's weak spot, giving you advantage)
  
BOSS: Exit Point (climax, tension 9-10)
  Boss type: choice
  The creature corners you at the extraction point. Your shuttle is damaged
  but functional for one short flight.
  Primary victory: escape with survivor alive → escort NPC to shuttle, launch together
  Alternative victory: use survivor as bait OR leave them behind → dark choice, you escape alone
  Emergent: use sonic emitter + environmental acoustics to trap the creature permanently
  
RESOLUTION: Escape with/without survivor (resolution, tension 3)
  Victory + survivor: hopeful ending. NPC shares full research. Their knowledge may save others.
  Victory − survivor: you made it. The weight of the choice follows you.
  Defeat: both die. The rescue becomes another Black Box entry.
```

---

## 3. Fifteen Launch Modules

### 3.1 Module Registry

#### Universal Modules (work in any setting)

| # | ID | Type | Positions | Tension Range | Location Role | Obstacle Summary |
|---|-----|------|-----------|---------------|---------------|-----------------|
| 1 | `blocked_passage_01` | `blocked_passage` | A, B | [2, 7] | passage | Force (FOR 12) / Hack panel (INT 11) / Vent crawl (AGI 10) |
| 2 | `wounded_survivor_01` | `npc_encounter` | A, B | [2, 6] | medical, quarters | Heal (INT 10) / Persuade for info (CHA 11) / Intimidate (CHA 13) / Loot+leave (AGI 9) |
| 3 | `dark_room_01` | `environmental` | A, B, C | [3, 8] | any | Find light (PER 10) / Navigate blind (AGI 12) / Repair lights (INT 11) / Brute force (FOR 13) |
| 4 | `supply_cache_01` | `resource_cache` | A, B | [2, 5] | storage, dead_end | Unlock container (INT 10) / Break open (FOR 12) / Trade with NPC if present (CHA 10) |
| 5 | `ambush_01` | `ambush` | B, C, D | [5, 9] | any | Fight (FOR 13) / Flee (AGI 12) / Bluff (CHA 14) / Use environment (INT 12) |

#### Category Modules (setting family)

| # | ID | Type | Category | Positions | Tension Range | Location Role | Obstacle Summary |
|---|-----|------|----------|-----------|---------------|---------------|-----------------|
| 6 | `airlock_malfunction_01` | `environmental` | space_vessel | B, C | [4, 8] | airlock | Seal breach before O2 depletes. Weld (FOR 13) / Override (INT 12) / EVA suit (auto if available) |
| 7 | `malfunctioning_android_01` | `npc_encounter` | space_vessel, facility | A, B | [3, 7] | engineering, hub | Reason (CHA 12) / Disable (INT 13) / Fight (FOR 14) / Find override code (PER 11) |
| 8 | `alien_mechanism_01` | `terminal_puzzle` | alien | B, C | [4, 8] | ritual_chamber | Decipher symbols (INT 14) / Brute-force activate (FOR 12) / Psionic attunement (CHA 13, LCK bonus) |
| 9 | `containment_breach_01` | `environmental` | facility | C, D | [6, 9] | hazard_zone | Reseal (INT 14) / Evacuate section (AGI 12) / Fight escaped specimen (FOR 15) |
| 10 | `power_reroute_dilemma_01` | `moral_choice` | space_vessel, facility | B | [4, 7] | control_room | Reroute to medbay (saves NPC, locks your path) OR to doors (opens path, NPC dies). No roll — pure choice. |

#### Complex Modules (high tension)

| # | ID | Type | Positions | Tension Range | Location Role | Obstacle Summary |
|---|-----|------|-----------|---------------|---------------|-----------------|
| 11 | `patrol_entity_01` | `patrol_enemy` | C, D | [6, 10] | passage, hub | Stealth past (AGI 14) / Fight (FOR 15) / Distract with item (INT 12) / Lure away (CHA 13) / Set trap (INT 14) |
| 12 | `flooded_section_01` | `environmental` | C, D | [6, 9] | hazard_zone, engineering | Find valve (INT 13) / Swim through (FOR 14, AGI 12) / Reroute pipes (INT 15) / Electric hazard makes FOR path risky |
| 13 | `survivor_rescue_01` | `rescue` | B, C | [5, 8] | medical, quarters | Free trapped NPC. Cut restraints (FOR 11) / Hack lock (INT 12) / Calm them (CHA 10). NPC becomes temp ally or dies. |
| 14 | `terminal_decrypt_01` | `terminal_puzzle` | B, C | [4, 8] | control_room, server_room* | Multi-step: find password in logs (PER 11) → hack (INT 13) → social-engineer NPC (CHA 12). Reveals lore + optional Black Box. |
| 15 | `explosive_decompression_risk_01` | `blocked_passage` | C, D | [7, 10] | passage, airlock | Path forward risks hull breach. Careful (INT+PER 14) / Reckless charge (FOR 12, but costs O2/HP) / Seal behind you (INT 13, no backtrack) |

*`server_room` role not available in alien_ruins — module 14 excluded from that setting via compatibility check.

### 3.2 Module Data Structure

```typescript
interface ScenarioModule {
  id: string;
  type: ModuleType;
  validSegments: ('start-unlock' | 'unlock-reveal' | 'reveal-escalation' | 'escalation-boss')[];
  tensionRange: [number, number];
  compatibility: ModuleCompatibility;

  // Layout
  locations: ModuleLocationDef[];    // 1-3 locations (critical path + optional side rooms)
  sideRooms: ModuleLocationDef[];    // 0-2 optional exploration rooms

  // Content
  npcs?: NpcDefinition[];
  items?: ItemDefinition[];
  obstacle: ObstacleDefinition;

  // Narrative
  skins: [NarrativeSkin, NarrativeSkin, NarrativeSkin];  // low, mid, high
  locationRole: string;              // Abstract role (setting provides concrete name)

  // Locale
  locale: { fr: ModuleLocaleData; en: ModuleLocaleData };
}

interface ModuleLocationDef {
  id: string;
  role: string;                      // Abstract role
  onCriticalPath: boolean;
  features: FeatureDefinition[];
  items?: ItemDefinition[];
}

type ModuleType =
  | 'blocked_passage'
  | 'patrol_enemy'
  | 'npc_encounter'
  | 'terminal_puzzle'
  | 'environmental'
  | 'exploration'
  | 'rescue'
  | 'moral_choice'
  | 'resource_cache'
  | 'ambush';
```

### 3.3 Narrative Skins

Each module ships with 3 skins. The active skin is selected based on the module's assigned tension within the assembled scenario.

```typescript
interface NarrativeSkin {
  tension: 'low' | 'mid' | 'high';
  entryDescription: LocaleString;
  revisitDescription: LocaleString;
  obstacleDescription: LocaleString;
  dcModifier: number;                  // 0, +1, or +2
  suggestedPathPriority: StatId[];     // Which paths surface first in suggestions
  ambientSnippets: LocaleString[];     // 3-4 atmospheric one-liners for variety
}
```

**Skin selection rule:**

```typescript
function selectSkin(module: ScenarioModule, assignedTension: number): NarrativeSkin {
  if (assignedTension <= 4) return module.skins[0];       // low
  if (assignedTension <= 7) return module.skins[1];       // mid
  return module.skins[2];                                  // high
}
```

**Skin tone guidelines:**

| Tier | Narrative Tone | DC Modifier | Suggestion Bias | Sentence Style |
|------|---------------|-------------|-----------------|----------------|
| Low | Exploratory, curious, mild unease | +0 | INT, PER paths first | Longer, descriptive |
| Mid | Urgent, tense, danger escalating | +1 | Mixed, slightly favoring AGI | Medium, purposeful |
| High | Desperate, hunted, time pressure | +2 | FOR, AGI paths first | Short, fragmented, punchy |

---

## 4. Settings & Location Role Compatibility

### 4.1 Launch Settings

```typescript
const LAUNCH_SETTINGS: SettingDefinition[] = [
  {
    id: 'derelict_ship',
    nameKey: { fr: 'Épave Stellaire', en: 'Derelict Ship' },
    categories: ['space_vessel'],
    supportedRoles: [
      'passage', 'control_room', 'storage', 'medical', 'quarters',
      'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
    ],
    // 20+ location names per role (see §4.2)
    features: ['airlock', 'viewport', 'hull_panel', 'life_support', 'cryopod'],
    preferredItems: ['EVA_suit', 'plasma_cutter', 'access_card', 'welding_torch'],
  },
  {
    id: 'space_station',
    nameKey: { fr: 'Station Orbitale', en: 'Space Station' },
    categories: ['facility'],
    supportedRoles: [
      'passage', 'control_room', 'storage', 'medical', 'quarters',
      'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
      'lab', 'server_room',
    ],
    features: ['blast_door', 'observation_deck', 'tram_system', 'containment_field'],
    preferredItems: ['security_badge', 'research_terminal', 'containment_tool', 'access_card'],
  },
  {
    id: 'alien_ruins',
    nameKey: { fr: 'Ruines Extraterrestres', en: 'Alien Ruins' },
    categories: ['alien'],
    supportedRoles: [
      'passage', 'control_room', 'hub', 'dead_end', 'hazard_zone',
      'ritual_chamber', 'organic_growth', 'crystal_cave', 'gravity_well',
    ],
    // NOTE: no storage, medical, quarters, engineering, airlock, lab, server_room
    features: ['crystal_node', 'organic_wall', 'alien_terminal', 'gravity_well', 'bioluminescence'],
    preferredItems: ['translator_device', 'void_shard', 'psionic_amplifier', 'ancient_key'],
  },
];
```

### 4.2 Role Compatibility Matrix

```
Role              derelict_ship  space_station  alien_ruins
────────────────────────────────────────────────────────────
passage           ✓ coursive     ✓ corridor     ✓ tunnel organique
control_room      ✓ passerelle   ✓ ops center   ✓ nexus de contrôle
storage           ✓ soute        ✓ entrepôt     ✗
medical           ✓ infirmerie   ✓ medbay       ✗
quarters          ✓ cabines      ✓ dortoirs     ✗
hub               ✓ carrefour    ✓ atrium       ✓ chambre centrale
dead_end          ✓ cul-de-sac   ✓ impasse      ✓ alcôve cristalline
hazard_zone       ✓ salle moteur ✓ réacteur     ✓ puits gravitationnel
engineering       ✓ machines     ✓ maintenance  ✗
airlock           ✓              ✓              ✗
lab               ✗              ✓              ✗
server_room       ✗              ✓              ✗
ritual_chamber    ✗              ✗              ✓ sanctuaire
organic_growth    ✗              ✗              ✓ zone organique
crystal_cave      ✗              ✗              ✓ grotte cristalline
gravity_well      ✗              ✗              ✓ puits de gravité
```

### 4.3 Module Compatibility Check (updated)

```typescript
function isModuleCompatible(module: ScenarioModule, setting: SettingDefinition): boolean {
  // Layer 1: existing compatibility filter (universal/category/setting)
  if (!passesCompatibilityFilter(module, setting)) return false;

  // Layer 2: every location role the module needs must exist in the setting
  const allRoles = [
    ...module.locations.map(l => l.role),
    ...module.sideRooms.map(l => l.role),
  ];
  for (const role of allRoles) {
    if (!setting.supportedRoles.includes(role)) return false;
  }

  return true;
}
```

---

## 5. Victory Conditions

### 5.1 Victory Condition Types

```typescript
type VictoryCondition =
  // Designed victories (per-skeleton)
  | { type: 'reach_location'; locationId: string; requiredItem?: string }
  | { type: 'defeat_entity'; entityId: string }
  | { type: 'activate_object'; objectId: string; requiredItem?: string }
  | { type: 'escort_alive'; npcId: string; locationId: string }
  // Emergent victories (global, checked every turn)
  | { type: 'environmental_kill'; entityId: string }
  | { type: 'containment'; entityId: string }
  | { type: 'self_destruct' };

type DefeatCondition =
  | { type: 'player_death' }
  | { type: 'npc_death'; npcId: string }        // Rescue skeleton: if survivor dies
  | { type: 'time_expired'; resource: 'o2' }     // Asphyxiation
  | { type: 'objective_destroyed' };              // Evidence destroyed in Investigate
```

### 5.2 Emergent Victory Safeguards

Emergent victories must feel **earned**, not accidental. Every emergent path requires multi-turn deliberate setup.

#### Environmental Kill

The boss entity must be in a location that becomes hazardous (depressurized, flooded, on fire) while the player is NOT in that location (or has protection).

**Safeguards:**

1. **Boss not present until escalation beat.** During intro/rising/midpoint, the creature has no map position. You cannot target what isn't there.
2. **Environmental hazards require multi-turn setup.** Example sequence for depressurization:
   - Turn 1: Shoot/break the viewport → FOR check DC 15+ (viewport has property `reinforced`)
   - Turn 1 result: viewport *cracks* (Ship Memory marks it) but doesn't breach
   - Turn 2: Second action on cracked viewport → FOR DC 10 (weakened) → breach occurs
   - Player must not be in the room OR must have EVA suit
3. **Minimum 2-turn sequence** for any environmental kill path. No single action can trigger it.

#### Containment

Player seals ALL exits from the boss's current location while the boss is inside.

**Safeguards:**

1. Requires sealing N exits (typically 2-3) — that's N separate actions.
2. Boss is actively attacking during this process.
3. Some exits may require specific items or INT checks to seal.
4. Sealed room must remain structurally sound (can't contain + depressurize simultaneously).

#### Self-Destruct

Player finds and activates a self-destruct mechanism, then escapes the blast radius.

**Safeguards:**

1. Self-destruct terminal is in a **specific fixed location** (not always on the critical path).
2. Override safety protocols: INT check DC 16.
3. Confirm activation: narrative moment with moral weight (choice node).
4. Escape blast radius within N turns (depends on distance to exit — typically 3-5 turns).
5. This is practically a mini-quest, not a shortcut.

#### Victory Check — Per Turn

```typescript
function checkVictory(state: GameState, skeleton: CoreSkeleton): VictoryResult | null {
  // 1. Check designed primary victory
  if (evaluateCondition(skeleton.primaryVictory, state)) {
    return { type: 'primary', skeleton: skeleton.id };
  }

  // 2. Check designed alternative victory
  if (evaluateCondition(skeleton.alternativeVictory, state)) {
    return { type: 'alternative', skeleton: skeleton.id };
  }

  // 3. Check emergent victories (global rules)
  const bossEntity = getBossEntity(state);
  if (bossEntity && bossEntity.location) {
    const bossRoom = getLocation(state, bossEntity.location);

    // Environmental kill: boss in hazardous room, player is safe
    if (isLocationLethal(bossRoom) && !isEntityProtected(bossEntity, bossRoom)) {
      if (state.player.locationId !== bossEntity.location || isPlayerProtected(state, bossRoom)) {
        return { type: 'emergent_environmental_kill' };
      }
    }

    // Containment: all exits from boss's room are sealed
    if (areAllExitsSealed(state, bossEntity.location)) {
      return { type: 'emergent_containment' };
    }
  }

  // Self-destruct: triggered and player has escaped
  if (state.selfDestructActive && isPlayerInSafeZone(state)) {
    return { type: 'emergent_self_destruct' };
  }

  return null;
}
```

---

## 6. Threat Director

### 6.1 Overview

The threat director is a per-turn state machine that controls the main antagonist's presence, creating horror pacing through escalating encounters and atmospheric hints.

### 6.2 Threat Director State

```typescript
interface ThreatDirectorState {
  currentBeat: StoryBeat;
  encounterCount: number;
  turnsSinceLastEncounter: number;
  turnsSinceLastHint: number;
  hintHistory: Set<string>;          // No repeated hints within a game
  creatureWounded: boolean;          // Player hurt it → cautious for 5 turns
  creatureEnraged: boolean;          // Player killed its "ally" → +2 aggressiveness
  woundedCooldown: number;           // Turns remaining before wounded creature returns
}
```

### 6.3 Behavior Table

```typescript
const THREAT_BEHAVIORS: Record<StoryBeat, ThreatBehavior> = {
  intro: {
    visibility: 'hidden',
    aggressiveness: 0,
    encounterChance: 0,
    hintChance: 0.2,
    environmentalEffects: [],
    narrativeHints: [
      'eerie_silence', 'flickering_light', 'old_blood_stain',
      'scratch_marks', 'cold_draft', 'distant_hum',
    ],
  },
  rising: {
    visibility: 'hinted',
    aggressiveness: 2,
    encounterChance: 0.05,     // Very rare — jump scare territory
    hintChance: 0.35,
    environmentalEffects: [],
    narrativeHints: [
      'blood_trail', 'distant_scream', 'camera_movement',
      'ventilation_sound', 'broken_barricade', 'claw_marks_fresh',
    ],
  },
  midpoint: {
    visibility: 'glimpsed',
    aggressiveness: 4,
    encounterChance: 0.10,
    hintChance: 0.4,
    environmentalEffects: ['power_fluctuation', 'locked_door'],
    narrativeHints: [
      'shadow_movement', 'camera_static', 'temperature_drop',
      'acid_residue', 'half_eaten_corpse',
    ],
  },
  escalation: {
    visibility: 'present',
    aggressiveness: 7,
    encounterChance: 0.30,
    hintChance: 0.5,
    environmentalEffects: ['power_outage', 'blocked_route', 'environmental_damage'],
    narrativeHints: [
      'heavy_footsteps', 'breathing_sounds', 'alarm_triggered',
      'door_denting', 'scream_cut_short',
    ],
  },
  climax: {
    visibility: 'pursuing',
    aggressiveness: 10,
    encounterChance: 0.80,
    hintChance: 0.0,           // No hints — IT'S HERE
    environmentalEffects: ['ship_shaking', 'fire', 'hull_breach', 'total_darkness'],
    narrativeHints: [],
  },
  resolution: {
    visibility: 'aftermath',
    aggressiveness: 0,
    encounterChance: 0,
    hintChance: 0.1,
    environmentalEffects: [],
    narrativeHints: ['aftermath_silence'],
  },
};
```

### 6.4 Per-Turn Threat Check

```typescript
function threatCheck(
  state: GameState,
  director: ThreatDirectorState,
  rng: RandomGenerator,
): ThreatEvent | null {
  const behavior = THREAT_BEHAVIORS[director.currentBeat];

  // Rule: modules with their own threats suppress random encounters
  if (currentModuleHasThreat(state)) {
    // But narrative hints STILL fire (the bigger threat lurks)
    if (director.turnsSinceLastHint >= 2 && rng.float() < behavior.hintChance * 0.5) {
      return pickUnusedHint(behavior, director, rng);
    }
    return null;
  }

  // Rule: wounded creature avoids player temporarily
  if (director.creatureWounded && director.woundedCooldown > 0) {
    director.woundedCooldown--;
    // Still allow hints about it licking its wounds
    if (rng.float() < 0.3) {
      return { type: 'hint', template: 'creature_wounded_retreat' };
    }
    return null;
  }

  // Pacing rules
  const minTurnsBetweenEncounters = 3;
  const minTurnsBetweenHints = 2;
  const droughtBonus = director.turnsSinceLastEncounter > 8 ? 0.15 : 0;

  // 1. Random encounter check
  if (director.turnsSinceLastEncounter >= minTurnsBetweenEncounters) {
    const effectiveChance = behavior.encounterChance + droughtBonus;
    if (rng.float() < effectiveChance) {
      director.encounterCount++;
      director.turnsSinceLastEncounter = 0;
      return generateEncounter(behavior, director, rng);
    }
  }

  // 2. Environmental effect (escalation+ only)
  if (behavior.aggressiveness >= 5 && rng.float() < 0.3) {
    return {
      type: 'environmental',
      effect: rng.pick(behavior.environmentalEffects),
    };
  }

  // 3. Narrative hint
  if (director.turnsSinceLastHint >= minTurnsBetweenHints && rng.float() < behavior.hintChance) {
    return pickUnusedHint(behavior, director, rng);
  }

  director.turnsSinceLastEncounter++;
  director.turnsSinceLastHint++;
  return null;
}
```

### 6.5 Encounter Intensity by Aggressiveness

```typescript
function generateEncounter(
  behavior: ThreatBehavior,
  director: ThreatDirectorState,
  rng: RandomGenerator,
): ThreatEvent {
  const agg = behavior.aggressiveness + (director.creatureEnraged ? 2 : 0);

  if (agg <= 3) {
    // STALK: creature appears briefly and retreats. No combat. Pure atmosphere.
    return { type: 'encounter', subtype: 'stalk', rounds: 0 };
  }
  if (agg <= 6) {
    // AMBUSH: 50% stalk, 50% quick attack (1 round, creature retreats).
    const subtype = rng.float() < 0.5 ? 'stalk' : 'ambush';
    return { type: 'encounter', subtype, rounds: subtype === 'ambush' ? 1 : 0 };
  }
  if (agg <= 9) {
    // HUNT: full combat. Creature fights until wounded, then retreats.
    // Player can flee after 2 rounds.
    return { type: 'encounter', subtype: 'hunt', rounds: -1, canFlee: true, fleeAfterRounds: 2 };
  }
  // PURSUE: full combat. Creature does NOT retreat. Final confrontation.
  return { type: 'encounter', subtype: 'pursue', rounds: -1, canFlee: false };
}
```

### 6.6 Creature Learning

```typescript
// After player wounds the creature in an encounter:
function onCreatureWounded(director: ThreatDirectorState): void {
  director.creatureWounded = true;
  director.woundedCooldown = 5;  // Avoids player for 5 turns, then returns angrier
}

// When creature returns after being wounded:
function onCreatureReturns(director: ThreatDirectorState): void {
  director.creatureWounded = false;
  director.creatureEnraged = true;  // +2 aggressiveness permanently
}
```

---

## 7. Black Box System

### 7.1 Cross-Skeleton Lore (Updated Design)

Black Box entries are matched by **setting**, not skeleton. A death journal from an Escape run on `derelict_ship` can appear in a subsequent Investigate run on the same ship. This creates shared-universe lore.

### 7.2 Placement Rules

```typescript
interface BlackBoxPlacementConfig {
  matchBy: 'setting';                    // NOT skeleton
  preferDifferentSkeleton: true;         // Cross-skeleton lore is more interesting
  deathPlacementChance: 0.80;            // 80% chance to place a death journal
  victoryPlacementChance: 0.30;          // 30% for victory — death is more atmospheric
  placementSegment: 'start-unlock' | 'unlock-reveal';  // Rising beat
  placementType: 'side_room';            // Never on critical path
  createMinimalRoomIfNeeded: true;       // If no side room exists, create a small one
}
```

### 7.3 Journal Generation

```typescript
function generateBlackBoxJournal(history: GameHistory, outcome: 'victory' | 'death'): BlackBoxEntry {
  // Select 2-3 key events from history (most dramatic moments)
  const keyEvents = selectKeyEvents(history, 3);

  // Generate hints about dangers encountered
  const hints = generateDangerHints(history);

  // Template-based journal generation
  const journal: LocaleString = outcome === 'death'
    ? {
        fr: `Entrée #${nextEntryNumber()} — ${history.className} ${history.playerName}. `
          + `Arrivé dans ${history.settingName}, j'ai survécu ${history.turnsPlayed} cycles. `
          + `${keyEvents.map(e => e.fr).join('. ')}. `
          + `${history.causeOfDeath}. `
          + `Méfiez-vous de ${hints[0]?.fr ?? 'tout'}.`,
        en: '', // EN post-launch
      }
    : {
        fr: `Entrée #${nextEntryNumber()} — ${history.className} ${history.playerName}. `
          + `J'ai réussi à ${history.victoryVerb} après ${history.turnsPlayed} cycles. `
          + `${keyEvents.map(e => e.fr).join('. ')}. `
          + `Conseil : ${hints[0]?.fr ?? 'restez en vie'}.`,
        en: '',
      };

  return {
    id: uuid(),
    timestamp: Date.now(),
    playerName: history.playerName,
    classId: history.classId,
    skeletonId: history.skeletonId,
    settingId: history.settingId,
    difficulty: history.difficulty,
    outcome,
    turnsPlayed: history.turnsPlayed,
    causeOfDeath: outcome === 'death' ? history.causeOfDeath : undefined,
    journalEntry: journal,
    keyEvents,
    hints,
  };
}
```

### 7.4 Storage

IndexedDB via Dexie.js. Separate from save slots. Maximum **20 entries** (FIFO). Persists across all games.

```typescript
// src/services/storage.ts
const BLACK_BOX_MAX = 20;

async function storeBlackBoxEntry(entry: BlackBoxEntry): Promise<void> {
  const count = await db.blackBox.count();
  if (count >= BLACK_BOX_MAX) {
    // Delete oldest entry (FIFO)
    const oldest = await db.blackBox.orderBy('timestamp').first();
    if (oldest) await db.blackBox.delete(oldest.id);
  }
  await db.blackBox.add(entry);
}

async function findBlackBoxForPlacement(
  settingId: string,
  currentSkeletonId: string,
): Promise<BlackBoxEntry | null> {
  // Prefer different skeleton, same setting
  const crossSkeleton = await db.blackBox
    .where('settingId').equals(settingId)
    .and(e => e.skeletonId !== currentSkeletonId)
    .sortBy('timestamp')
    .then(entries => entries[entries.length - 1]); // Most recent

  if (crossSkeleton) return crossSkeleton;

  // Fallback: same skeleton, same setting
  return db.blackBox
    .where('settingId').equals(settingId)
    .sortBy('timestamp')
    .then(entries => entries[entries.length - 1] ?? null);
}
```

---

## 8. Scenario Assembly Algorithm

### 8.1 Full Assembly Pipeline

```typescript
function assembleScenario(
  skeleton: CoreSkeleton,
  sessionLength: 'quick' | 'standard' | 'extended',
  setting: SettingDefinition,
  rng: RandomGenerator,
): AssembledScenario {

  // 1. Determine module count
  const moduleCount = {
    quick: 0,
    standard: rng.intBetween(3, 5),
    extended: rng.intBetween(8, 12),
  }[sessionLength];

  // 2. Get compatible module pool
  const pool = ALL_MODULES.filter(m => isModuleCompatible(m, setting));

  // 3. Distribute modules across segments (weighted)
  const placed: PlacedModule[] = [];
  for (let i = 0; i < moduleCount; i++) {
    const segment = pickWeightedSegment(SEGMENT_WEIGHTS, rng);
    const candidates = pool.filter(m =>
      m.validSegments.includes(segment)
      && !placed.some(p => p.module.id === m.id) // No duplicate modules
    );
    if (candidates.length > 0) {
      const module = rng.pick(candidates);
      placed.push({ module, segment, index: i });
    }
  }

  // 4. Assign tension values to each placed module
  const tensionAssignments = assignTensionValues(skeleton, placed, rng);

  // 5. Select narrative skins based on assigned tension
  for (const pm of placed) {
    pm.activeSkin = selectSkin(pm.module, pm.assignedTension);
  }

  // 6. Build location graph
  const graph = buildLocationGraph(skeleton, placed, setting, rng);

  // 7. Resolve abstract location roles → setting-specific names
  resolveLocationNames(graph, setting, rng);

  // 8. Place Black Box (if applicable)
  const blackBox = await tryPlaceBlackBox(graph, setting, skeleton.id);

  // 9. Validate
  const validation = validateAssembledScenario(graph, skeleton);
  if (!validation.valid) throw new ScenarioValidationError(validation.issues);

  return { skeleton, modules: placed, graph, setting, blackBox };
}
```

### 8.2 Graph Construction

```typescript
function buildLocationGraph(
  skeleton: CoreSkeleton,
  modules: PlacedModule[],
  setting: SettingDefinition,
  rng: RandomGenerator,
): LocationGraph {
  const nodes: LocationNode[] = [];
  const edges: LocationEdge[] = [];

  // Build spine: core nodes in order, with modules inserted between them
  const segments = getSegments(skeleton); // 4 segments

  for (const segment of segments) {
    // Add the segment's start core node
    nodes.push(createNodeFromSkeleton(segment.startNode, setting));

    // Add modules placed in this segment (in order)
    const segmentModules = modules
      .filter(m => m.segment === segment.id)
      .sort((a, b) => a.index - b.index);

    let prevNodeId = segment.startNode.id;
    for (const pm of segmentModules) {
      // Add module's critical path locations
      for (const loc of pm.module.locations) {
        const node = createNodeFromModule(loc, pm, setting);
        nodes.push(node);
        edges.push({ from: prevNodeId, to: node.id, bidirectional: true });
        prevNodeId = node.id;
      }
      // Add module's side rooms (connected to first critical path location)
      for (const side of pm.module.sideRooms) {
        const sideNode = createNodeFromModule(side, pm, setting);
        nodes.push(sideNode);
        edges.push({ from: pm.module.locations[0].id, to: sideNode.id, bidirectional: true });
      }
    }

    // Connect last module/core node to segment end
    edges.push({ from: prevNodeId, to: segment.endNode.id, bidirectional: true });
  }

  // Add final core node (resolution)
  nodes.push(createNodeFromSkeleton(skeleton.nodes[5], setting));

  return { nodes, edges };
}
```

### 8.3 Validation

```typescript
function validateAssembledScenario(
  graph: LocationGraph,
  skeleton: CoreSkeleton,
): ValidationResult {
  const issues: string[] = [];

  // 1. No orphan nodes (every node reachable from start)
  const reachable = bfs(graph, 'start');
  const orphans = graph.nodes.filter(n => !reachable.has(n.id));
  if (orphans.length > 0) {
    issues.push(`Orphan nodes: ${orphans.map(n => n.id).join(', ')}`);
  }

  // 2. Victory reachable: path exists from start to boss
  if (!pathExists(graph, 'start', 'boss')) {
    issues.push('No path from start to boss');
  }

  // 3. Gate item reachable before gate
  if (!isReachableBefore(graph, skeleton.gateItemLocation, 'unlock')) {
    issues.push('Gate item not reachable before unlock node');
  }

  // 4. Tension curve valid
  const tensions = getNodeTensions(graph);
  const curveResult = validateTensionCurve(tensions);
  issues.push(...curveResult.issues);

  // 5. Every obstacle has 3+ resolution paths
  for (const node of graph.nodes) {
    if (node.obstacle && node.obstacle.paths.length < 3) {
      issues.push(`Node ${node.id}: obstacle has only ${node.obstacle.paths.length} paths (need 3+)`);
    }
  }

  // 6. All bidirectional (backtracking supported)
  for (const edge of graph.edges) {
    if (!graph.edges.some(e => e.from === edge.to && e.to === edge.from)) {
      issues.push(`One-way edge: ${edge.from} → ${edge.to}`);
    }
  }

  return { valid: issues.length === 0, issues };
}
```

---

## 9. Auto-Playtest Bot

### 9.1 Architecture

Two bots, both running in pure Node with zero DOM dependencies. Seeded RNG for reproducibility.

```typescript
interface PlaytestBot {
  name: string;
  makeDecision(state: GameState, scene: SceneContext, rng: RandomGenerator): string;
}
```

### 9.2 Random Bot

Catches crashes, infinite loops, and missing templates. Simple but powerful.

```typescript
const randomBot: PlaytestBot = {
  name: 'random',
  makeDecision(state, scene, rng) {
    const roll = rng.float();

    if (roll < 0.60 && scene.suggestions.length > 0) {
      // 60%: pick a random suggestion
      const suggestion = rng.pick(scene.suggestions);
      return formatSuggestionAsInput(suggestion);
    }

    if (roll < 0.80) {
      // 20%: interact with a random visible target
      const targets = [...scene.locationItems, ...scene.npcs.map(npcToTarget), ...scene.environmentFeatures];
      if (targets.length > 0) {
        const target = rng.pick(targets);
        const verb = rng.pick(getApplicableVerbs(target));
        return `${verb.aliases.fr[0]} ${target.nameKey.fr}`;
      }
    }

    if (roll < 0.90 && scene.connectedLocations.length > 0) {
      // 10%: move to a random connected location
      const loc = rng.pick(scene.connectedLocations);
      return `aller ${loc.aliases[0]}`;
    }

    // 10%: completely random input (gibberish, creative, absurd)
    return rng.pick(FUZZ_INPUTS);
  },
};
```

### 9.3 Goal-Seeking Bot

Simulates a "reasonable player." Tests completability.

```typescript
const goalBot: PlaytestBot = {
  name: 'goal_seeker',
  makeDecision(state, scene, rng) {
    // Priority 1: heal if low HP
    if (state.player.hp < state.player.maxHp * 0.3) {
      const healItem = findHealingItem(state.player.inventory);
      if (healItem) return `utiliser ${healItem.nameKey.fr}`;
    }

    // Priority 2: pick up useful items
    const valuableItem = scene.locationItems.find(i => isValuable(i));
    if (valuableItem) return `prendre ${valuableItem.nameKey.fr}`;

    // Priority 3: engage with obstacles (try suggestion that matches best stat)
    if (scene.suggestions.length > 0) {
      const bestSuggestion = pickBestForClass(scene.suggestions, state.player.classId);
      return formatSuggestionAsInput(bestSuggestion);
    }

    // Priority 4: move toward unexplored exits
    const unexplored = scene.connectedLocations.filter(l => !state.visitedLocations.has(l.id));
    if (unexplored.length > 0) return `aller ${rng.pick(unexplored).aliases[0]}`;

    // Priority 5: move toward objective (if known)
    const objectivePath = findPathToObjective(state);
    if (objectivePath) return `aller ${objectivePath.nextStep.aliases[0]}`;

    // Fallback: random explored location
    const explored = scene.connectedLocations.filter(l => state.visitedLocations.has(l.id));
    if (explored.length > 0) return `aller ${rng.pick(explored).aliases[0]}`;

    // Last resort: examine surroundings
    return 'regarder autour';
  },
};
```

### 9.4 Stress Test Runner

```typescript
async function runStressTest(config: StressConfig): Promise<StressReport> {
  const results: PlaythroughResult[] = [];

  for (let i = 0; i < config.runs; i++) {
    const rng = createSeededRng(config.baseSeed + i);
    const skeleton = rng.pick(config.skeletons);
    const setting = rng.pick(config.settings);
    const sessionLength = rng.pick(['quick', 'standard', 'extended'] as const);
    const playerClass = rng.pick(['marine', 'engineer', 'medic'] as const);
    const bot = rng.float() < 0.5 ? randomBot : goalBot;

    const scenario = assembleScenario(skeleton, sessionLength, setting, rng);
    let state = initGame(scenario, playerClass, rng);
    let turns = 0;
    const MAX_TURNS = 200;
    const stuckDetector = new StuckDetector(10); // Same location for 10+ turns = stuck

    while (!isGameOver(state) && turns < MAX_TURNS) {
      const scene = getSceneContext(state);
      const input = bot.makeDecision(state, scene, rng);
      const result = processTurn(state, input);
      state = result.newState;
      turns++;

      stuckDetector.update(state.player.locationId);
      if (stuckDetector.isStuck()) break;
    }

    results.push({
      seed: config.baseSeed + i,
      bot: bot.name,
      skeleton: skeleton.id,
      setting: setting.id,
      sessionLength,
      playerClass,
      outcome: state.victory ? 'victory' : state.defeat ? 'defeat' : 'stuck',
      turns,
      victoryType: state.victoryType ?? null,
      locationsVisited: state.visitedLocations.size,
      itemsUsed: state.itemsUsedCount,
      encountersTriggered: state.encounterCount,
    });
  }

  return analyzeResults(results);
}
```

### 9.5 Stuck Detection

```typescript
class StuckDetector {
  private history: string[] = [];
  private threshold: number;

  constructor(threshold: number) { this.threshold = threshold; }

  update(locationId: string): void {
    this.history.push(locationId);
    if (this.history.length > this.threshold) this.history.shift();
  }

  isStuck(): boolean {
    if (this.history.length < this.threshold) return false;
    return this.history.every(id => id === this.history[0]);
  }
}
```

---

## 10. Backtracking & Free Movement

### 10.1 Rules

All connections are bidirectional. Player can revisit any previously visited location at any time. Progression is gated by **obstacles and items**, not by movement restrictions.

### 10.2 Revisit Behavior

```typescript
interface LocationVisitState {
  firstVisited: number;           // Turn number
  visitCount: number;
  itemsTaken: string[];           // Items no longer present
  featuresChanged: string[];      // Environmental changes that persist
  obstacleResolved: boolean;
  shipMemoryMarks: ShipMemoryMark[];  // Scars from past actions
}
```

On revisit:
- Description switches to past-tense skin (from narrative skins)
- Items already taken are absent
- Environmental changes persist (broken window stays broken)
- Obstacles don't re-activate
- Ship Memory marks are described ("Les traces de vos coups marquent encore la porte.")
- Small chance (10-20%) of new micro-content: threat trace, moved NPC, environmental shift

### 10.3 Progress Indicators

```
> Sorties visibles :
>   ← Couloir principal [déjà exploré]
>   → Salle des machines [inexploré]
>   ↓ Conduit de maintenance [inexploré]
```

Player sees explored vs unexplored but is never told where to go.

---

## 11. Context-Aware Suggestions

### 11.1 Rules

- Always exactly **3 suggestions** displayed
- **Never include secret verbs** (PRAY, DANCE, NAME, etc.)
- Weighted by current context: available targets, player class strengths, obstacle paths
- Skin tension affects priority (see §3.3)

### 11.2 Suggestion Algorithm

```typescript
function generateSuggestions(
  state: GameState,
  scene: SceneContext,
  activeSkin: NarrativeSkin | null,
): ParsedAction[] {
  const candidates: ScoredSuggestion[] = [];

  // Generate candidates from: obstacle paths, item interactions,
  // NPC interactions, movement, environmental features
  candidates.push(...generateObstacleSuggestions(scene));
  candidates.push(...generateItemSuggestions(scene, state));
  candidates.push(...generateNpcSuggestions(scene));
  candidates.push(...generateMovementSuggestions(scene, state));
  candidates.push(...generateEnvironmentSuggestions(scene));

  // Score candidates
  for (const c of candidates) {
    c.score = baseSuggestionScore(c, state);

    // Class bonus: suggestions using the player's primary stat score higher
    if (c.stat && isClassPrimaryStat(state.player.classId, c.stat)) {
      c.score += 2;
    }

    // Skin priority: current narrative skin shifts which stats surface
    if (activeSkin && c.stat && activeSkin.suggestedPathPriority.includes(c.stat)) {
      c.score += 1;
    }
  }

  // Filter out secret verbs
  const filtered = candidates.filter(c => !isSecretVerb(c.verbId));

  // Return top 3 by score, with tiebreaking by variety (avoid 3 of the same type)
  return selectTop3WithVariety(filtered);
}
```

---

## 12. Deliverables — Week by Week

### Week 1: Scenario Architecture & Content Authoring

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Core skeleton data structure (6-node) and loader | `src/engine/scenario.ts` | Unit: skeleton validates (6 nodes, gate item, victory conditions) |
| 2 | Module data structure with compatibility tags + role check | `src/engine/scenario.ts` | Unit: every module has 3+ resolution paths; incompatible modules filtered |
| 3 | Setting definitions with supported role lists | `src/content/settings.ts` | Unit: 3 settings with 20+ location names each; role matrix correct |
| 4 | Scenario assembly algorithm (skeleton + modules by session length) | `src/engine/pacing.ts` | Unit: quick=0, standard=3-5, extended=8-12 modules |
| 5 | Module compatibility filter (universal/category/setting + role check) | `src/engine/pacing.ts` | Unit: alien_ruins modules excluded from derelict_ship; server_room modules excluded from alien_ruins |
| 6 | Location name resolution (abstract roles → setting-specific names) | `src/engine/pacing.ts` | Unit: "passage" in derelict_ship → "Coursive principale" |
| 7 | Tension value assignment + curve validation | `src/engine/pacing.ts` | Unit: no drops > 2, peak ≥ 9, escalation ≥ 8 |
| 8 | Beat zone assignment (modules get beats from segment position) | `src/engine/pacing.ts` | Unit: modules in segment A get intro/rising, segment D gets escalation/climax |
| 9 | Narrative skin selection by assigned tension | `src/engine/pacing.ts` | Unit: tension ≤ 4 → low skin, ≤ 7 → mid, ≥ 8 → high |
| 10 | **Skeleton: ESCAPE** — full content (6 nodes, items, NPCs, features, locale) | `src/content/scenarios/escape.ts` | Unit: validates, gate item reachable, 2 victory paths |
| 11 | **Skeleton: INVESTIGATE** — full content | `src/content/scenarios/investigate.ts` | Unit: validates, gate item reachable, 2 victory paths |
| 12 | **Skeleton: RESCUE** — full content | `src/content/scenarios/rescue.ts` | Unit: validates, gate item reachable, 2 victory paths, NPC escort logic |
| 13 | **15 modules** — full content with 3 skins each, locale strings | `src/content/scenarios/modules/` | Unit: each has 3-5 paths, 3 skins, compatible roles declared |
| 14 | **3 settings** — full location name pools, features, preferred items | `src/content/settings.ts` | Unit: ≥ 20 location names per role per setting |

### Week 2: Systems (Victory, Threat Director, Black Box, Backtracking)

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 15 | Victory condition checker (primary + alternative + emergent) | `src/engine/victory.ts` | Unit: all 7 condition types trigger correctly |
| 16 | Emergent victory safeguards (multi-turn, climax-only, setup requirements) | `src/engine/victory.ts` | Unit: env kill requires 2+ turns; containment requires N sealed exits; self-destruct requires 4+ turns |
| 17 | Graph builder (skeleton + modules → connected location graph) | `src/engine/pacing.ts` | Unit: no orphan nodes, all paths bidirectional |
| 18 | Graph validator (completable, victory reachable, gate item accessible) | `src/engine/pacing.ts` | Unit: every assembled scenario passes all 6 validation checks |
| 19 | Threat director state machine | `src/engine/threat.ts` | Unit: beat transitions update visibility/aggressiveness correctly |
| 20 | Threat director per-turn check (encounters, environmental, hints) | `src/engine/threat.ts` | Unit: encounter chance matches behavior table; pacing rules enforced (3-turn gap) |
| 21 | Threat director × module interaction (suppression + ambient hints) | `src/engine/threat.ts` | Unit: modules with threats suppress random encounters; hints still fire at 50% |
| 22 | Creature learning (wounded cooldown, enraged state) | `src/engine/threat.ts` | Unit: wounded → 5 turns avoidance → returns enraged (+2 agg) |
| 23 | Encounter intensity scaling (stalk/ambush/hunt/pursue) | `src/engine/threat.ts` | Unit: agg ≤ 3 → stalk, ≤ 6 → ambush, ≤ 9 → hunt, 10 → pursue |
| 24 | Backtracking support (free movement, revisit state tracking) | `src/engine/state.ts` | Unit: revisited rooms show past-tense descriptions; items gone; obstacles resolved |
| 25 | Progress indicators (explored vs unexplored exits) | `src/engine/suggestions.ts` | Unit: exits list shows exploration status |
| 26 | Context-aware action suggestions (3 suggestions, skin-weighted, no secrets) | `src/engine/suggestions.ts` | Unit: always 3, never secret, class-biased, skin-prioritized |
| 27 | Black Box entry generation (journal from game history) | `src/engine/blackbox.ts` | Unit: death + victory produce valid journal entries with key events |
| 28 | Black Box placement (cross-skeleton, setting-matched, side room) | `src/engine/blackbox.ts` | Unit: placed only if previous entry exists for setting; creates minimal room if needed |
| 29 | Black Box storage (IndexedDB, max 20, FIFO) | `src/services/storage.ts` | Unit: 21st entry deletes oldest |

### Week 2.5: Bots, Stress Tests, Integration

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 30 | Random playtest bot | `tests/playtest/bots/randomBot.ts` | Unit: always produces valid input string |
| 31 | Goal-seeking playtest bot | `tests/playtest/bots/goalBot.ts` | Unit: prioritizes healing, items, exploration correctly |
| 32 | Stuck detector | `tests/playtest/stuckDetector.ts` | Unit: detects 10-turn same-location loops |
| 33 | Stress test runner (configurable seeds, bots, skeleton/setting combos) | `tests/playtest/stressRunner.ts` | — |
| 34 | **Stress test: 500 auto-playthroughs** | `tests/stress/scenarioWalkthrough.test.ts` | Every playthrough ends (victory or defeat, never stuck) |
| 35 | **Stress test: all skeleton × setting × session length combos** | `tests/stress/scenarioCombinations.test.ts` | All 27 combos (3×3×3) assemble valid scenarios |
| 36 | **Stress test: 100 assembly validations** | `tests/stress/scenarioAssembly.test.ts` | All 100 random assemblies pass graph validation |
| 37 | Integration test: full scenario completion (all 3 skeletons) | `tests/integration/scenarioCompletion.test.ts` | Start-to-end with primary + alternative victory paths |
| 38 | Integration test: emergent victory paths | `tests/integration/emergentVictory.test.ts` | Env kill, containment, self-destruct all achievable |
| 39 | Integration test: Black Box round-trip | `tests/integration/blackBox.test.ts` | Die → journal generated → stored → next game → found in side room → readable |
| 40 | Update CLAUDE.md for Phase 7 | `CLAUDE.md` | — |

---

## 13. Acceptance Criteria

```bash
npm test                    # All unit tests pass
npm run test:stress         # 500 auto-playthroughs complete (0 stuck)
npm run test:stress         # 27 skeleton×setting×session combos valid
npm run test:stress         # 100 random assemblies pass validation
npm run test:integration    # Full scenario completions succeed
npm run test:integration    # Emergent victories achievable
npm run test:integration    # Black Box round-trip works
```

### Statistical Targets for Stress Test Report

```
Victory rate (goal-seeking bot):     ≥ 40% (game is hard but fair)
Victory rate (random bot):           ≥ 10% (possible even by accident)
Stuck rate (both bots):              0%    (HARD REQUIREMENT)
Average turns to completion:         15-40 (standard session)
Average turns to death:              8-25  (deaths should feel meaningful, not instant)
Locations visited (goal bot, std):   ≥ 60% of available locations
Emergent victory rate (goal bot):    ≤ 15% (earned, not easy)
```

---

## 14. Key Design Decisions (Locked In)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Skeletons for launch | 3 (Escape, Investigate, Rescue) | Maximum gameplay variety with minimum content |
| Skeleton structure | 6 nodes (expanded from 4) | Maps cleanly to all 6 story beats |
| Modules for launch | 15 (5 universal + 5 category + 5 complex) | Covers all 10 module types |
| Settings for launch | 3 (derelict_ship, space_station, alien_ruins) | Max aesthetic variety; stress-tests the property system |
| Module narrative skins | 3 per module (low/mid/high) | Tone + DC modifier + suggestion priority shift |
| DC scaling | +1 per tension delta from module base | Keeps difficulty aligned with dramatic intensity |
| Black Box matching | By setting, cross-skeleton preferred | Creates shared-universe lore across different playstyles |
| Black Box max entries | 20 (FIFO) | Manageable storage, always fresh content |
| Emergent victories | 3 types, all multi-turn, climax-only for env kill | Earned, not accidental |
| Threat director | 6-level state machine, per-turn checks | Horror pacing engine with encounter/hint/environmental layers |
| Creature learning | Wounded → 5-turn retreat → enraged return | The creature adapts to the player |
| Module ↔ threat director | Modules with threats suppress random encounters | No double-threat; ambient hints still fire |
| Encounter pacing | Min 3 turns between encounters | Prevents clustering; drought bonus after 8 turns |
| Suggestions | Always 3, no secrets, skin-weighted, class-biased | Guides without spoiling |
| Graph validation | 6 checks on every assembly | Structural completability guarantee |
| Playtest bots | Random + goal-seeking, seeded RNG | Reproducible, catches crashes + completability issues |
| Session lengths | Quick 0 / Standard 3-5 / Extended 8-12 modules | 5 min to 2 hours |

---

## 15. Definition of Done

- [ ] 3 skeletons (6 nodes each), 15 modules (3 skins each), 3 settings: all fully authored with FR locale strings
- [ ] `assembleScenario()` produces valid, completable graphs for all 27 combos
- [ ] Tension curves validated on every assembly
- [ ] Victory conditions: primary + alternative + emergent all testable
- [ ] Emergent victories require multi-turn setup (no single-action wins)
- [ ] Threat director: hints escalate, encounters scale with beat, creature learns
- [ ] Black Box: generates journal, stores in IndexedDB, cross-skeleton placement, max 20
- [ ] Backtracking: free movement, revisit descriptions, persistent environmental changes
- [ ] Suggestions: always 3, never secret, context-weighted, skin-influenced
- [ ] Auto-playtest bots: random + goal-seeking, both functional
- [ ] **500 auto-playthroughs: 0 stuck games**, all end in victory or defeat
- [ ] 100 random assembly validations pass
- [ ] Integration tests pass for all 3 skeletons, all victory types, Black Box round-trip
- [ ] **🏁 ENGINE COMPLETE milestone reached**
- [ ] CLAUDE.md updated for Phase 7

---

> *"Chaque partie raconte une histoire différente. Même si c'est le même vaisseau."*
