# Void Walker — Parser & Property System Reference

> **Role:** Exhaustive reference for the action parser, verb taxonomy, property system, and resolution pipeline.
> **Audience:** Claude Code during Phase 1, 2, 5.
> **Rule:** Specs here are authoritative. Phase files reference sections; they do not duplicate them.
> **Last updated:** 2026-02-21 | Status: **Phase 1 COMPLETE — data layer built**

---

## Table of Contents

1. [Verb Taxonomy](#1-verb-taxonomy)
2. [Property System](#2-property-system)
3. [Resolution Pipeline](#3-resolution-pipeline)
4. [French Lemmatizer](#4-french-lemmatizer)
5. [Fallback & Reformulation](#5-fallback--reformulation)

---

## 1. Verb Taxonomy

### 1.1 Design Philosophy

The player must feel like they can do **anything**. Instead of hard-coding per-object actions, we use a property-based compatibility system: objects are tagged with properties, verbs check compatibility against those properties. Every new object automatically supports dozens of actions via its properties.

### 1.2 Verb Categories (7-Stat System)

Each verb belongs to a stat category. The stat governs the roll.

| Category | Stat | Description |
|----------|------|-------------|
| PHYSICAL | FOR | Raw strength, melee force |
| DEFENSE | DEF | Blocking, shielding, fortifying |
| TECHNICAL | INT | Knowledge, skill, precision |
| PERCEPTION | PER | Observation, detection, sensory actions |
| SOCIAL | CHA | Persuasion, intimidation, deception |
| AGILITY | AGI | Speed, evasion, stealth, ranged accuracy |
| INTERACTION | — | Auto or context-dependent (TAKE, DROP, USE, etc.) |

### 1.3 Complete Verb Registry

Every verb has: ID, FR/EN aliases, required target properties, governing stat, and base difficulty modifier.

#### FOR Verbs (Physical Force / Melee)

| Verb ID | FR Aliases | EN Aliases | Required Props | Diff Mod |
|---------|-----------|------------|---------------|----------|
| `STRIKE` | frapper, taper, cogner, battre, assommer | hit, strike, punch, beat, bash, slam | `tangible` | 0 |
| `PUSH` | pousser, repousser, bousculer, deplacer | push, shove, move, budge | `tangible` | 0 |
| `PULL` | tirer, arracher, extraire, retirer | pull, yank, rip, extract, tear off | `tangible` | 0 |
| `LIFT` | soulever, porter, lever | lift, carry, raise, hoist | `liftable` | +2 |
| `KICK` | donner un coup de pied, shooter, botter | kick, boot, punt | `tangible` | 0 |
| `BREAK` | casser, briser, fracasser, detruire, defoncer | break, smash, shatter, destroy, bust | `breakable` | +1 |
| `BEND` | tordre, plier, deformer | bend, twist, warp | `malleable` | +2 |
| `CUT` | couper, trancher, tailler, decouper | cut, slice, carve, sever | `cuttable` -- needs `bladed` tool | 0 |
| `FORCE_OPEN` | forcer, enfoncer | force open, bash open, pry open | `openable` + `locked` | +3 |
| `BITE` | mordre, croquer | bite, chew, gnaw | `tangible` + `small` | +1 |
| `SQUEEZE` | serrer, ecraser, comprimer | squeeze, crush, compress | `small` OR `soft` | 0 |
| `IMPROVISE_WEAPON` | utiliser comme arme, s'en servir comme massue | use as weapon, wield, weaponize | `liftable` OR `holdable` | +1 |
| `SACRIFICE` | sacrifier, se sacrifier, offrir | sacrifice, offer, give up | inventory item | varies |

#### DEF Verbs (Blocking / Shielding)

| Verb ID | FR Aliases | EN Aliases | Required Props | Diff Mod |
|---------|-----------|------------|---------------|----------|
| `BLOCK` | bloquer, parer, se proteger | block, parry, shield, guard | `holdable` (optional) | 0 |
| `IMPROVISE_SHIELD` | utiliser comme bouclier, se proteger avec | use as shield, block with | `holdable` + `rigid` | +1 |
| `BARRICADE` | barricader, bloquer, obstruer | barricade, block, obstruct | `openable` (doors) -- needs items | +1 |

#### PER Verbs (Perception / Sensory)

| Verb ID | FR Aliases | EN Aliases | Required Props | Diff Mod |
|---------|-----------|------------|---------------|----------|
| `EXAMINE` | examiner, inspecter, observer, regarder, etudier, fouiller | examine, inspect, look at, study, analyze, search | `tangible` OR `visible` | -3 |
| `LISTEN` | ecouter, tendre l'oreille | listen, hear, eavesdrop | — | -2 |
| `SMELL` | sentir, renifler | smell, sniff | — | -2 |
| `SCAN` | scanner, analyser, detecter | scan, analyze, detect | `tangible` — needs `scanner` tool | -1 |

#### INT Verbs (Technical / Knowledge)

| Verb ID | FR Aliases | EN Aliases | Required Props | Diff Mod |
|---------|-----------|------------|---------------|----------|
| `READ` | lire, dechiffrer, consulter | read, decipher, consult | `readable` | -2 |
| `HACK` | pirater, hacker, cracker, bypasser | hack, crack, bypass, breach | `electronic` + `secured` | +3 |
| `REPAIR` | reparer, rafistoler, bricoler, fixer | repair, fix, patch, mend, restore | `mechanical` OR `electronic` | +1 |
| `DISASSEMBLE` | demonter, desassembler | disassemble, take apart, dismantle | `mechanical` OR `electronic` | +1 |
| `ASSEMBLE` | assembler, combiner, construire, fabriquer | assemble, combine, craft, build, improvise | `component` (needs 2+ items) | +2 |
| `ACTIVATE` | activer, allumer, demarrer | activate, turn on, power up, boot | `electronic` OR `mechanical` | -1 |
| `DEACTIVATE` | desactiver, eteindre, couper | deactivate, turn off, shut down, disable | `electronic` OR `mechanical` | -1 |
| `REPROGRAM` | reprogrammer, reconfigurer | reprogram, reconfigure, rewrite | `programmable` | +4 |
| `LOCK` | verrouiller, fermer a cle | lock, seal, secure | `lockable` | -1 |
| `UNLOCK` | deverrouiller, ouvrir, crocheter | unlock, pick lock, open | `locked` | +2 |
| `WELD` | souder, fusionner, sceller | weld, fuse, seal shut | `metallic` -- needs `heat_source` | +2 |
| `PLUG` | brancher, connecter, raccorder | plug in, connect, jack in | `electronic` + has `port` | 0 |
| `OVERRIDE` | court-circuiter, shunter, contourner | short-circuit, hotwire, override | `electronic` | +3 |
| `SABOTAGE` | saboter, pieger, trafiquer | sabotage, rig, tamper, booby-trap | `mechanical` OR `electronic` | +2 |
| `SET_TRAP` | pieger, tendre un piege | set trap, rig, plant | -- (location) -- needs items | +2 |
| `IMPROVISE_TOOL` | utiliser comme outil | use as tool, improvise, repurpose | `tangible` | +2 |
| `WEDGE` | coincer, caler, bloquer avec | wedge, jam, prop | `rigid` + `small` | +1 |
| `IGNITE` | enflammer, bruler, mettre le feu | ignite, burn, set fire, light | `flammable` -- needs `heat_source` | +2 |
| `FLOOD` | inonder, remplir d'eau, noyer | flood, fill with water | -- (needs `liquid_source`) | +3 |
| `ELECTRIFY` | electrifier, electrocuter | electrify, electrocute | `conductive` + `power_source` | +3 |
| `TIE` | attacher, ligoter, nouer | tie, bind, lash, restrain | needs `flexible` item | +1 |
| `COVER` | couvrir, recouvrir, masquer | cover, conceal, mask, obstruct | `coverable` target + item | 0 |

#### CHA Verbs (Social / Persuasion)

| Verb ID | FR Aliases | EN Aliases | Required Props | Diff Mod |
|---------|-----------|------------|---------------|----------|
| `TALK` | parler, discuter, communiquer | talk, speak, communicate | `sentient` | -2 |
| `PERSUADE` | persuader, convaincre, raisonner | persuade, convince, reason with | `sentient` | +1 |
| `INTIMIDATE` | intimider, menacer, effrayer | intimidate, threaten, scare | `sentient` | +1 |
| `DECEIVE` | mentir, tromper, bluffer, duper | lie, deceive, bluff, trick, con | `sentient` | +2 |
| `DISTRACT` | distraire, detourner l'attention | distract, divert, create diversion | `sentient` OR `electronic` | +1 |
| `BARTER` | troquer, negocier, marchander | trade, barter, negotiate, haggle | `sentient` + `willing` | +1 |
| `SEDUCE` | seduire, charmer, flirter | seduce, charm, flirt, sweet-talk | `sentient` | +3 |
| `COMMAND` | ordonner, commander, diriger | command, order, direct, boss | `sentient` | +2 |
| `CALM` | calmer, rassurer, apaiser | calm, reassure, soothe | `sentient` | +1 |
| `PROVOKE` | provoquer, narguer, insulter | provoke, taunt, insult, challenge | `sentient` | 0 |
| `PLEAD` | supplier, implorer | plead, beg, implore | `sentient` | +1 |
| `INTERROGATE` | interroger, questionner, cuisiner | interrogate, question, grill | `sentient` | +2 |
| `SIGNAL` | signaler, faire signe, alerter | signal, wave, alert, motion | -- | -1 |
| `LURE` | attirer, appater, pieger | lure, bait, draw out | `sentient` target | +2 |

#### AGI Verbs (Speed / Evasion / Ranged)

| Verb ID | FR Aliases | EN Aliases | Required Props | Diff Mod |
|---------|-----------|------------|---------------|----------|
| `THROW` | lancer, jeter, balancer, projeter | throw, toss, hurl, fling, chuck | `liftable` OR `small` | 0 |
| `SHOOT` | tirer, tirer sur, viser, faire feu | shoot, fire, aim, fire at | `tangible` target -- needs `ranged` weapon | 0 |
| `CLIMB` | grimper, escalader, monter | climb, scale, ascend | `climbable` OR `large` | +2 |
| `JUMP` | sauter, bondir, enjamber | jump, leap, vault | -- (environment) | +1 |
| `DODGE` | esquiver, eviter, se baisser | dodge, evade, duck, sidestep | -- (reactive) | 0 |
| `SWIM` | nager, plonger | swim, dive | -- (liquid environment) | +2 |
| `RUN` | courir, sprinter, fuir, s'enfuir | run, sprint, flee, escape | -- (movement) | 0 |
| `HIDE` | se cacher, se planquer, se dissimuler | hide, conceal self, take cover | -- (environment) | +1 |
| `STACK` | empiler, entasser | stack, pile up | `liftable` (multiple) | +1 |

#### Interaction Verbs (Variable Stat)

| Verb ID | FR Aliases | EN Aliases | Required Props | Stat | Diff Mod |
|---------|-----------|------------|---------------|------|----------|
| `USE` | utiliser, employer, se servir de | use, utilize, employ | `usable` | * | 0 |
| `OPEN` | ouvrir | open | `openable` | * | -1 |
| `CLOSE` | fermer | close, shut | `openable` | * | -2 |
| `TAKE` | prendre, ramasser, recuperer, attraper | take, grab, pick up, collect | `liftable` OR `small` | -- | auto |
| `DROP` | poser, lacher, deposer, abandonner | drop, put down, discard, leave | inventory item | -- | auto |
| `GIVE` | donner, offrir, tendre | give, hand over, offer | inventory + `sentient` target | -- | auto |
| `EQUIP` | equiper, porter, enfiler, mettre | equip, wear, put on, don | `equippable` | -- | auto |
| `EAT` | manger, avaler, consommer, devorer | eat, swallow, consume, devour | `edible` OR `small` (absurd) | -- | varies |
| `DRINK` | boire, siroter | drink, sip, gulp | `liquid` OR `drinkable` | -- | auto |
| `MOVE_TO` | aller, se deplacer, marcher, entrer | go, move, walk, enter, head to | location connection | -- | auto |
| `WAIT` | attendre, patienter, rester | wait, stay, remain, hold | -- | -- | auto |
| `TOUCH` | toucher, tater, palper | touch, feel, tap | `tangible` | -- | auto |

**Total: 77 verbs across 7 categories, mapped to 7 stats (FOR, DEF, INT, PER, CHA, AGI + auto interaction).**

---

## 2. Property System

### 2.1 Property Registry

Every game object (item, NPC, environmental feature, body part) is tagged with properties. Properties determine verb compatibility.

#### Physical Properties

| Property | Description | Examples |
|----------|-------------|---------|
| `tangible` | Can be physically interacted with | Almost everything |
| `visible` | Can be seen/observed | Everything except hidden things |
| `small` | One-hand holdable, fits in pocket | Datapad, key card, pistol, stimulant |
| `liftable` | Can be picked up | Items, debris, small furniture |
| `holdable` | Can be gripped and wielded | Tools, weapons, bars, cables |
| `heavy` | Requires significant effort to move | Crates, bodies, machinery |
| `rigid` | Doesn't flex or bend | Metal bars, structural panels |
| `flexible` | Can bend, wrap, tie | Cables, tape, hoses, cloth |
| `soft` | Deforms easily | Flesh, padding, clothing |
| `fragile` | Breaks easily | Glass, screens, thin electronics |
| `breakable` | Can be broken with effort | Most solid objects |
| `malleable` | Can be bent/shaped | Thin metal, wires |
| `flat` | Flat surface | Datapads, panels, cards |
| `sharp` | Has cutting edge | Knives, broken glass, debris |
| `blunt` | Good for impact | Bars, pipes, wrenches |
| `pointed` | Has a tip | Needles, broken antennas |
| `hollow` | Has interior space | Containers, pipes, vents |
| `sealed` | Air/liquid tight | Canisters, suits, sealed rooms |
| `transparent` | Can see through | Windows, visors, glass panels |
| `reflective` | Reflects light/signals | Mirrors, polished metal |

#### Material Properties

| Property | Description |
|----------|-------------|
| `metallic` | Made of metal |
| `organic` | Biological material |
| `synthetic` | Artificial non-metal |
| `conductive` | Conducts electricity |
| `flammable` | Can catch fire |
| `corrosive` | Can dissolve/damage |
| `toxic` | Harmful to health |
| `radioactive` | Emits radiation |

#### Functional Properties

| Property | Description |
|----------|-------------|
| `electronic` | Has electronic components |
| `mechanical` | Has moving parts |
| `programmable` | Can be reprogrammed |
| `powered` / `unpowered` | Power state |
| `secured` | Protected by security |
| `locked` | Physically or digitally locked |
| `openable` | Can be opened/closed |
| `lockable` | Can be locked |
| `readable` | Contains readable info |
| `data_storage` | Stores digital data |
| `usable` | Has a specific use function |
| `equippable` | Can be worn/equipped |
| `edible` | Intended to be eaten |
| `drinkable` | Intended to be drunk |
| `component` | Can be combined with others |
| `heat_source` | Produces heat/fire |
| `light_source` | Produces light |
| `liquid` | Is a liquid |
| `liquid_source` | Can produce liquid |
| `power_source` | Provides electricity |
| `ranged` | Can attack at distance |

#### Entity Properties (NPCs, creatures)

| Property | Description |
|----------|-------------|
| `sentient` | Can think, communicate |
| `alive` | Biological and alive |
| `robotic` | Machine entity |
| `hostile` / `neutral` / `friendly` | Disposition |
| `willing` | Open to negotiation |
| `wounded` | Injured/damaged |
| `dead` | No longer alive/functional |
| `unconscious` | Alive but unresponsive |

#### Environmental Properties (rooms, areas)

| Property | Description |
|----------|-------------|
| `dark` / `lit` | Light state |
| `pressurized` / `depressurized` | Atmosphere state |
| `flooded` | Filled with liquid |
| `on_fire` | Currently burning |
| `zero_g` | No gravity |
| `climbable` | Has surfaces to climb |
| `cramped` | Tight space |
| `open_space` | Large area |

### 2.2 Property Inheritance

Objects inherit properties from their type, then add per-item overrides:

```
ITEM_TYPE -> BASE PROPERTIES

tool        -> tangible, liftable, holdable, small, usable
weapon      -> tangible, liftable, holdable, usable
consumable  -> tangible, liftable, small, usable
key_item    -> tangible, liftable, small
data        -> tangible, liftable, small, readable, data_storage
misc        -> tangible, liftable

NPC_TYPE -> BASE PROPERTIES

human       -> tangible, visible, sentient, alive, organic
android     -> tangible, visible, sentient, robotic, electronic, mechanical, metallic
robot       -> tangible, visible, robotic, electronic, mechanical, metallic
creature    -> tangible, visible, alive, organic
corpse      -> tangible, visible, dead, organic, heavy
wreck       -> tangible, visible, dead, metallic, heavy, component

ENVIRONMENT_FEATURE -> BASE PROPERTIES

door        -> tangible, visible, openable, lockable, mechanical, breakable, metallic
window      -> tangible, visible, transparent, breakable, fragile, sealed
terminal    -> tangible, visible, electronic, readable, programmable, powered/unpowered
vent        -> tangible, visible, openable, climbable, cramped, hollow
pipe        -> tangible, visible, hollow, metallic, rigid
panel       -> tangible, visible, flat, metallic, breakable, component
camera      -> tangible, visible, electronic, powered/unpowered
airlock     -> tangible, visible, openable, lockable, mechanical, sealed
container   -> tangible, visible, openable, hollow, liftable
wiring      -> tangible, visible, flexible, conductive, electronic, component, flammable
```

### 2.3 Per-Item Property Overrides

Each specific item adds its own properties on top of type defaults:

```typescript
const ITEM_DEFINITIONS = {
  laser_pistol: {
    type: 'weapon',
    extra_props: ['electronic', 'heat_source', 'light_source', 'ranged'],
    damageBonus: 4,
  },
  metal_bar: {
    type: 'weapon',
    extra_props: ['metallic', 'rigid', 'blunt', 'heavy', 'conductive'],
    remove_props: ['small'],
    damageBonus: 3,
  },
  knife: {
    type: 'weapon',
    extra_props: ['sharp', 'metallic', 'small'],
    damageBonus: 2,
  },
  datapad: {
    type: 'data',
    extra_props: ['electronic', 'flat', 'fragile', 'light_source', 'component'],
  },
  duct_tape: {
    type: 'consumable',
    extra_props: ['flexible', 'component', 'sticky'],
  },
  cable: {
    type: 'misc',
    extra_props: ['flexible', 'conductive', 'component', 'metallic'],
  },
  debris: {
    type: 'misc',
    extra_props: ['metallic', 'rigid', 'sharp', 'blunt', 'component', 'breakable'],
    damageBonus: 1,
  },
  medical_kit: {
    type: 'consumable',
    extra_props: ['organic_compatible'],
  },
  stimulant: {
    type: 'consumable',
    extra_props: ['injectable', 'organic_compatible'],
  },
  ration: {
    type: 'consumable',
    extra_props: ['edible'],
  },
  scanner: {
    type: 'tool',
    extra_props: ['electronic', 'powered'],
  },
  flashlight: {
    type: 'tool',
    extra_props: ['electronic', 'light_source', 'blunt'],
  },
  multitool: {
    type: 'tool',
    extra_props: ['mechanical', 'sharp', 'metallic', 'component'],
    damageBonus: 1,
  },
  eva_suit: {
    type: 'tool',
    extra_props: ['equippable', 'sealed', 'heavy'],
    remove_props: ['small'],
    armorValue: 2,
  },
  access_card: {
    type: 'key_item',
    extra_props: ['electronic', 'flat'],
  },
};
```

### 2.4 Combinatorial Explosion

With 71 properties, 77 verbs, and type inheritance, each new item automatically supports dozens of verb interactions. A typical item with 8 properties is compatible with 15-25 verbs. Total combinatorial space: **539,000+ unique verb-target-tool combinations** (stress-tested).

---

## 3. Resolution Pipeline

### 3.1 Eight-Step Pipeline

```
PLAYER INPUT: "J'arrache le bras du robot pour m'en servir de massue"

Step 1: TOKENIZE & NORMALIZE
  -> lowercase, remove accents, split, remove stop words
  -> tokens: ['arrache', 'bras', 'robot', 'servir', 'massue']

Step 2: VERB MATCHING
  -> Match tokens against verb registry (see SS4 for lemmatizer)
  -> 'arrache' -> PULL  |  'servir de massue' -> IMPROVISE_WEAPON
  -> Compound action detected: PULL then IMPROVISE_WEAPON

Step 3: TARGET MATCHING
  -> Search current game context:
     1. Inventory items
     2. Location items
     3. NPCs + body parts
     4. Environment features
     5. Connected locations
  -> 'robot' -> robot_npc in current location
  -> 'bras' -> body part of robot -> virtual object robot_arm
     (inherits: mechanical, metallic, holdable, blunt, attached)

Step 4: COMPATIBILITY CHECK
  -> PULL needs `tangible` -> robot_arm is tangible -> COMPATIBLE
  -> IMPROVISE_WEAPON needs `holdable` -> robot_arm is holdable -> COMPATIBLE
  -> `attached` property detected -> adds +3 difficulty to PULL

Step 5: DIFFICULTY CALCULATION
  -> Base: 10
  -> Verb mod: PULL = +0
  -> Target mods: hostile_target(+3) + attached(+3) = +6
  -> Context: none
  -> Final DC: 16

Step 6: STAT SELECTION
  -> PULL -> FOR (from VERB_STATS)
  -> Player rolls: D20 + FOR + floor(LCK/2) vs 16

Step 7: DICE ROLL
  -> D20 + stat + LCK bonus vs DC
  -> Determine: crit_success / success / failure / crit_failure

Step 8: OUTCOME & NARRATION
  -> Select narrative template for verb + outcome + tension
  -> Apply state changes (item added to inventory, NPC damaged, etc.)
  -> Compose 7-layer narrative (see SCENARIO_DESIGN.md SS7)
```

### 3.2 Verb Matching Strategies (Priority Order)

**Strategy 1 -- Exact alias match (fastest)**
Check if any token matches a verb alias exactly.
"frapper" -> STRIKE, "pirater" -> HACK

**Strategy 2 -- Curated form table**
Hand-built map of ~300 conjugated/inflected forms (see SS4.1).
"frappez" -> STRIKE, "pirate" -> HACK

**Strategy 3 -- Snowball stem match**
Pre-stemmed aliases matched against stemmed player input (see SS4.2).
"fracassant" -> stem "fracass" -> near BREAK

**Strategy 4 -- Prefix match (4+ chars)**
Simple prefix matching as catch-all fallback.

**Strategy 5 -- Compound action detection**
Multi-verb patterns:
- "arracher...pour...servir de massue" -> PULL + IMPROVISE_WEAPON
- "tirer sur la vitre" -> SHOOT (not PULL -- "tirer sur" != "tirer")
- "utiliser X pour Y" -> USE_AS pattern

**Strategy 6 -- Semantic fallback**
If no verb matches, classify by intent:
- Aggressive words -> default to STRIKE
- Movement words -> default to MOVE_TO
- Question words -> default to EXAMINE
- Unknown -> reformulation prompt

### 3.3 Target Resolution Order

```
1. Items in player inventory  (highest -- "use MY datapad")
2. Items in current location
3. NPCs in current location   (including body parts)
4. Environmental features
5. Connected locations         (for movement verbs)
6. Abstract targets            ("the air", "the darkness" -> environment)
```

**Body part resolution:** When targeting "le bras du robot":
1. "robot" -> NPC entity in location
2. "bras" -> body part
3. Generate virtual object `robot_arm` with inherited properties + `attached`
4. `attached` adds +3 difficulty to PULL/CUT

### 3.4 Compatibility Check

```
COMPATIBLE if:
  Target has ALL required properties for the verb
  OR target has a valid alternative property set (OR clauses)
  AND no blocking conditions exist

BLOCKING CONDITIONS:
  Verb requires tool player doesn't have (CUT needs bladed, WELD needs heat_source)
  Target is out_of_reach and verb requires tangible
  Target is too_large for verb (can't THROW a cargo container)
  Environmental incompatibility (can't IGNITE in vacuum)

IF INCOMPATIBLE:
  Don't refuse! Increase difficulty dramatically (+5 to +10)
  Or hint: "Vous n'avez rien pour couper avec..."
  Absurd actions allowed but near-impossible (eating metal: DC 25)
```

### 3.5 Difficulty Calculation

```
BASE DIFFICULTY = 10

Verb modifier:            (from verb table, -3 to +4)
Target difficulty:
  willing/cooperative:    -3
  neutral:                 0
  hostile/resistant:      +3
  fortified/armored:      +5

Context modifiers:
  Using appropriate tool: -2
  Using wrong tool:       +2
  No tool when needed:    +5
  In darkness:            +2
  Zero gravity:           +2
  Time pressure:          +2
  Wounded (player):       +1
  Relevant stat >= 4:     -1
  Creative action:        -1 to -3 (see GAME_SYSTEMS.md SS6)
  Absurd action:          +5 to +15

Difficulty modifiers (see GAME_SYSTEMS.md SS12):
  Explorer:               -2
  Survivor:                0
  Nightmare:              +2

Ship Memory marks (see GAME_SYSTEMS.md SS8):
  Same action on marked target:  sameActionDCMod (typically -2)
  Different action on marked:    otherActionDCMod (typically -1)

Condition malus (see GAME_SYSTEMS.md SS3):
  Applied via stat reduction, not DC modification

DIFFICULTY CAPS:
  Minimum: 2 (always some chance of failure)
  Maximum: 25 (always possible with nat 20 + high stat)
  "Auto" actions (TAKE, DROP, MOVE_TO): no roll needed
```

---

## 4. French Lemmatizer

### 4.1 Layer 1 -- Curated Form Table (Highest Priority)

A hand-built map of the ~300 most common conjugated/inflected forms for our ~50 game verbs:

```typescript
const CURATED_FORMS: Record<string, string> = {
  // STRIKE
  'frappe': 'STRIKE', 'frappes': 'STRIKE', 'frappez': 'STRIKE',
  'frappe': 'STRIKE', 'frappee': 'STRIKE', 'frappant': 'STRIKE',
  'tape': 'STRIKE', 'tape': 'STRIKE', 'tapez': 'STRIKE',
  'cogne': 'STRIKE', 'cognez': 'STRIKE',
  // HACK
  'pirate': 'HACK', 'pirate': 'HACK', 'piratez': 'HACK',
  'hacke': 'HACK', 'hacke': 'HACK',
  // RUN
  'cours': 'RUN', 'courez': 'RUN', 'couru': 'RUN',
  'fuis': 'RUN', 'fuyez': 'RUN', 'fui': 'RUN',
  // ... ~300 entries total, built during Phase 1-2
};
```

Covers present tense, past participle, imperative, and common informal forms for each game verb.

### 4.2 Layer 2 -- Snowball French Stemmer (Fallback)

For forms not in the curated table, use the Snowball stemmer algorithm for French. Rules-based, no ML, no dictionary, ~200 lines, works offline.

```typescript
import { stem } from './snowball-fr'; // Bundled, ~2KB

// Pre-stem all verb aliases at init time
const STEMMED_ALIASES: Record<string, string> = {};
for (const [verbId, aliases] of Object.entries(VERB_ALIASES)) {
  for (const alias of aliases) {
    STEMMED_ALIASES[stem(alias)] = verbId;
  }
}

function matchByStem(token: string): string | null {
  const stemmed = stem(token);
  return STEMMED_ALIASES[stemmed] ?? null;
}
```

### 4.3 Layer 3 -- Common Prefix Match (Catch-all)

For irregular or creative spellings, simple 4+ character prefix matching as a last resort.

### 4.4 Full Resolution Order

```
1. Exact match in CURATED_FORMS         -> instant, 100% accurate
2. Exact match in verb aliases (infinitive)  -> existing system
3. Snowball stem match                   -> good for conjugated forms
4. Prefix match (4+ chars)              -> catch-all fallback
5. Semantic fallback (aggressive/movement/question classification)
6. Reformulation prompt                  -> "Que tentez-vous exactement ?"
```

### 4.5 Input Normalization Pipeline

Before any matching, the input goes through normalization:

```typescript
function normalizeInput(raw: string): string[] {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/['']/g, ' ')     // Apostrophes -> spaces ("l'ennemi" -> "l ennemi")
    .replace(/[^a-z0-9 ]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(t => t.length > 1)  // Remove single characters
    .filter(t => !STOP_WORDS_FR.has(t)); // Remove "le", "la", "les", "un", "de", "du"...
}
```

### 4.6 Multi-Language Extensibility

Snowball has stemmers for 20+ languages. Adding a new language requires:
1. Import that language's Snowball stemmer
2. Add verb aliases in that language
3. Pre-stem aliases at build time

Architecture is identical -- just swap the stemmer and alias set.

---

## 5. Fallback & Reformulation

### 5.1 The "Never Refuse" Principle

The parser should **never say "you can't do that."** Instead:

| Situation | Response |
|-----------|----------|
| Verb recognized, target compatible | Normal resolution |
| Verb recognized, target incompatible | Allow with high DC (+5 to +10) + contextual hint |
| Verb recognized, no valid target | "Vous cherchez du regard quelque chose a {verb}..." |
| Verb unrecognized, intent classifiable | Default to closest verb category |
| Nothing recognized | Reformulation prompt (see below) |
| Truly impossible (no physics basis) | "L'idee vous traverse l'esprit, mais meme dans votre etat..." |

### 5.2 Reformulation UX

When the parser can't resolve the action, it presents interpretations:

```
> "je fais le machin avec le truc"

  Que tentez-vous exactement ?
  1. Utiliser [Scanner] sur [Terminal]
  2. Activer [Terminal]
  3. Autre chose (reformulez)
```

The parser generates 2-3 best-guess interpretations based on:
- Items in inventory matching vague references
- Objects in the current location
- Recent successful actions

### 5.3 Absurd Action Templates

For actions that are technically possible but ridiculous:

```
"Ce n'est clairement pas l'utilisation prevue par le fabricant,
 mais vous tentez quand meme de {absurd_action}. {outcome}."

"Meme dans une situation aussi desesperee, {absurd_action}
 reste un choix... audacieux. {outcome}."
```

### 5.4 Environmental Consequence Rules

Certain verb+property combinations trigger environmental changes:

| Verb + Property | Consequence |
|----------------|-------------|
| SHOOT + window/transparent | Depressurize room (if exterior), shattered glass hazard |
| IGNITE + flammable | Room gains `on_fire`, O2 drain starts |
| FLOOD + liquid_source | Room gains `flooded`, electronics short out |
| BREAK + electronic + powered | Sparks, system offline, may unlock/lock doors |
| SABOTAGE + camera/security | Reduced detection, may trigger alarm countdown |

---

> *"Le joueur tape n'importe quoi. Le parser comprend quand meme."*
> -- Parser design motto
