# Void Walker — Action Parser & Emergent Gameplay System

## Design Philosophy

The player must feel like they can do **anything**. But we can't enumerate every possible action
for every possible object. The solution: a **property-based compatibility system**.

Instead of defining "datapad can be read, thrown, hacked...", we say:
- A datapad has properties: `electronic`, `readable`, `small`, `fragile`, `flat`, `data_storage`
- The verb "throw" works on anything `small` or `liftable`
- The verb "read" works on anything `readable`
- The verb "hack" works on anything `electronic`

This way, **every new object automatically supports dozens of actions** just by tagging its properties.
And every creative player action ("I use the datapad as a frisbee to distract the robot")
resolves naturally: datapad is `small` + `flat` → throwable. Target is `npc` → distraction is valid.

---

## 1. Action Verb Taxonomy

### 1.1 Verb Categories

Each verb belongs to a category that determines which stat is tested.

```
PHYSICAL  (FOR) — Actions requiring strength, agility, or physical effort
TECHNICAL (INT) — Actions requiring knowledge, skill, or precision  
SOCIAL    (CHA) — Actions requiring persuasion, intimidation, or deception
CREATIVE  (*)   — Unorthodox actions — stat depends on context
```

### 1.2 Complete Verb Registry

Every verb has: an ID, FR/EN aliases, the required object properties, a primary stat,
and a base difficulty modifier.

#### PHYSICAL Verbs

| Verb ID | FR Aliases | EN Aliases | Required Target Props | Stat | Diff Mod |
|---------|-----------|------------|----------------------|------|----------|
| `STRIKE` | frapper, taper, cogner, battre, assommer, matraquer | hit, strike, punch, beat, bash, slam | `tangible` | FOR | 0 |
| `THROW` | lancer, jeter, balancer, projeter, envoyer | throw, toss, hurl, fling, chuck, lob | `liftable` OR `small` | FOR | 0 |
| `PUSH` | pousser, repousser, bousculer, déplacer | push, shove, move, budge | `tangible` | FOR | 0 |
| `PULL` | tirer, arracher, extraire, retirer | pull, yank, rip, extract, tear off | `tangible` | FOR | 0 |
| `LIFT` | soulever, porter, lever | lift, carry, raise, hoist | `liftable` | FOR | +2 |
| `KICK` | donner un coup de pied, shooter, botter | kick, boot, punt | `tangible` | FOR | 0 |
| `CLIMB` | grimper, escalader, monter | climb, scale, ascend | `climbable` OR `large` | FOR | +2 |
| `JUMP` | sauter, bondir, enjamber | jump, leap, vault | — (environment) | FOR | +1 |
| `DODGE` | esquiver, éviter, se baisser | dodge, evade, duck, sidestep | — (reactive) | FOR | 0 |
| `BLOCK` | bloquer, parer, se protéger, faire bouclier | block, parry, shield, guard | `holdable` (optional) | FOR | 0 |
| `BREAK` | casser, briser, fracasser, détruire, défoncer, exploser | break, smash, shatter, destroy, bust, wreck | `breakable` | FOR | +1 |
| `BEND` | tordre, plier, déformer | bend, twist, warp | `malleable` | FOR | +2 |
| `CUT` | couper, trancher, tailler, découper, inciser | cut, slice, carve, sever | `cuttable` — needs `bladed` tool | FOR | 0 |
| `FORCE_OPEN` | forcer, enfoncer, défoncer | force open, bash open, pry open | `openable` + `locked` | FOR | +3 |
| `BITE` | mordre, croquer, mâcher | bite, chew, gnaw, munch | `tangible` + `small` | FOR | +1 |
| `SQUEEZE` | serrer, écraser, comprimer, presser | squeeze, crush, compress | `small` OR `soft` | FOR | 0 |
| `SWIM` | nager, plonger | swim, dive | — (liquid environment) | FOR | +2 |
| `RUN` | courir, sprinter, fuir, s'enfuir | run, sprint, flee, escape | — (movement) | FOR | 0 |
| `HIDE` | se cacher, se planquer, se dissimuler | hide, conceal self, take cover | — (environment) | FOR | +1 |

#### TECHNICAL Verbs

| Verb ID | FR Aliases | EN Aliases | Required Target Props | Stat | Diff Mod |
|---------|-----------|------------|----------------------|------|----------|
| `EXAMINE` | examiner, inspecter, observer, regarder, étudier, analyser, fouiller, scanner | examine, inspect, look at, study, analyze, scan, search, investigate | `tangible` OR `visible` | INT | -3 |
| `READ` | lire, déchiffrer, consulter | read, decipher, consult | `readable` | INT | -2 |
| `HACK` | pirater, hacker, cracker, bypasser, forcer (le système) | hack, crack, bypass, override, breach | `electronic` + `secured` | INT | +3 |
| `REPAIR` | réparer, rafistoler, remettre en état, bricoler, fixer | repair, fix, patch, mend, restore | `mechanical` OR `electronic` | INT | +1 |
| `DISASSEMBLE` | démonter, désassembler, décomposer, déconstruire | disassemble, take apart, dismantle, strip | `mechanical` OR `electronic` | INT | +1 |
| `ASSEMBLE` | assembler, combiner, bricoler, construire, fabriquer, improviser | assemble, combine, craft, build, improvise, jury-rig, MacGyver | `component` (needs 2+ items) | INT | +2 |
| `ACTIVATE` | activer, allumer, enclencher, démarrer, lancer | activate, turn on, power up, boot, start, enable | `electronic` OR `mechanical` | INT | -1 |
| `DEACTIVATE` | désactiver, éteindre, couper, arrêter | deactivate, turn off, shut down, disable, kill | `electronic` OR `mechanical` | INT | -1 |
| `REPROGRAM` | reprogrammer, reconfigurer, modifier (le code) | reprogram, reconfigure, rewrite, modify code | `programmable` | INT | +4 |
| `LOCK` | verrouiller, fermer à clé, sécuriser | lock, seal, secure | `lockable` | INT | -1 |
| `UNLOCK` | déverrouiller, ouvrir, crocheter | unlock, pick lock, open | `locked` | INT | +2 |
| `WELD` | souder, fusionner, sceller | weld, fuse, seal shut | `metallic` — needs `heat_source` | INT | +2 |
| `PLUG` | brancher, connecter, raccorder | plug in, connect, jack in, wire up | `electronic` + has `port` | INT | 0 |
| `SCAN` | scanner, analyser, détecter | scan, analyze, detect | `tangible` — needs `scanner` tool | INT | -1 |
| `OVERRIDE` | court-circuiter, shunter, contourner | short-circuit, hotwire, override, bypass | `electronic` | INT | +3 |
| `SABOTAGE` | saboter, piéger, trafiquer | sabotage, rig, tamper, booby-trap | `mechanical` OR `electronic` | INT | +2 |
| `BARRICADE` | barricader, bloquer, obstruer | barricade, block, obstruct, seal | `openable` (doors) — needs items | INT | +1 |
| `SET_TRAP` | piéger, tendre un piège, installer | set trap, rig, plant | — (location) — needs items | INT | +2 |

#### SOCIAL Verbs

| Verb ID | FR Aliases | EN Aliases | Required Target Props | Stat | Diff Mod |
|---------|-----------|------------|----------------------|------|----------|
| `TALK` | parler, discuter, communiquer, s'adresser | talk, speak, communicate, address | `sentient` | CHA | -2 |
| `PERSUADE` | persuader, convaincre, raisonner | persuade, convince, reason with | `sentient` | CHA | +1 |
| `INTIMIDATE` | intimider, menacer, effrayer | intimidate, threaten, scare, menace | `sentient` | CHA | +1 |
| `DECEIVE` | mentir, tromper, bluffer, duper, embobiner | lie, deceive, bluff, trick, con, mislead | `sentient` | CHA | +2 |
| `DISTRACT` | distraire, détourner l'attention, faire diversion | distract, divert, create diversion | `sentient` OR `electronic` | CHA | +1 |
| `BARTER` | troquer, négocier, marchander, échanger | trade, barter, negotiate, haggle, deal | `sentient` + `willing` | CHA | +1 |
| `SEDUCE` | séduire, charmer, flirter, enjôler | seduce, charm, flirt, sweet-talk | `sentient` | CHA | +3 |
| `COMMAND` | ordonner, commander, diriger | command, order, direct, boss | `sentient` | CHA | +2 |
| `CALM` | calmer, rassurer, apaiser | calm, reassure, soothe | `sentient` | CHA | +1 |
| `PROVOKE` | provoquer, narguer, insulter, défier | provoke, taunt, insult, challenge, goad | `sentient` | CHA | 0 |
| `PLEAD` | supplier, implorer | plead, beg, implore | `sentient` | CHA | +1 |
| `INTERROGATE` | interroger, questionner, cuisiner | interrogate, question, grill, press | `sentient` | CHA | +2 |

#### INTERACTION Verbs (variable stat)

| Verb ID | FR Aliases | EN Aliases | Required Target Props | Stat | Diff Mod |
|---------|-----------|------------|----------------------|------|----------|
| `USE` | utiliser, employer, se servir de | use, utilize, employ | `usable` | * | 0 |
| `OPEN` | ouvrir | open | `openable` | * | -1 |
| `CLOSE` | fermer | close, shut | `openable` | * | -2 |
| `TAKE` | prendre, ramasser, récupérer, attraper, saisir | take, grab, pick up, collect, snag, snatch | `liftable` OR `small` | — | auto |
| `DROP` | poser, lâcher, déposer, abandonner | drop, put down, discard, leave | inventory item | — | auto |
| `GIVE` | donner, offrir, tendre | give, hand over, offer | inventory item + `sentient` target | — | auto |
| `EQUIP` | équiper, porter, enfiler, mettre | equip, wear, put on, don | `equippable` | — | auto |
| `EAT` | manger, avaler, ingérer, consommer, dévorer | eat, swallow, consume, devour, ingest | `edible` OR `small` (for absurd) | — | varies |
| `DRINK` | boire, siroter | drink, sip, gulp | `liquid` OR `drinkable` | — | auto |
| `MOVE_TO` | aller, se déplacer, marcher, entrer, se diriger | go, move, walk, enter, head to | location connection | — | auto |
| `WAIT` | attendre, patienter, rester | wait, stay, remain, hold | — | — | auto |
| `LISTEN` | écouter, tendre l'oreille | listen, hear, eavesdrop | — | INT | -2 |
| `SMELL` | sentir, renifler | smell, sniff | — | INT | -2 |
| `TOUCH` | toucher, tâter, palper | touch, feel, tap | `tangible` | — | auto |
| `SIGNAL` | signaler, faire signe, alerter | signal, wave, alert, motion | — (communication) | CHA | -1 |

#### CREATIVE / UNORTHODOX Verbs

| Verb ID | FR Aliases | EN Aliases | Required Target Props | Stat | Diff Mod |
|---------|-----------|------------|----------------------|------|----------|
| `IMPROVISE_WEAPON` | utiliser comme arme, s'en servir comme massue | use as weapon, wield, weaponize | `liftable` OR `holdable` | FOR | +1 |
| `IMPROVISE_TOOL` | utiliser comme outil, s'en servir pour | use as tool, improvise, repurpose | `tangible` | INT | +2 |
| `IMPROVISE_SHIELD` | utiliser comme bouclier, se protéger avec | use as shield, block with | `holdable` + `rigid` | FOR | +1 |
| `STACK` | empiler, entasser | stack, pile up | `liftable` (multiple) | FOR | +1 |
| `WEDGE` | coincer, caler, bloquer avec | wedge, jam, prop | `rigid` + `small` | INT | +1 |
| `IGNITE` | enflammer, brûler, mettre le feu, incendier | ignite, burn, set fire, light | `flammable` — needs `heat_source` | INT | +2 |
| `FLOOD` | inonder, remplir d'eau, noyer | flood, fill with water/liquid | — (environment + `liquid_source`) | INT | +3 |
| `ELECTRIFY` | électrifier, électrocuter | electrify, electrocute | `conductive` + `power_source` | INT | +3 |
| `TIE` | attacher, ligoter, nouer, ficeler | tie, bind, lash, restrain | needs `flexible` item (cable, rope) | INT | +1 |
| `COVER` | couvrir, recouvrir, masquer, obstruer | cover, conceal, mask, obstruct | `coverable` target + item | INT | 0 |
| `LURE` | attirer, appâter, piéger | lure, bait, draw out | `sentient` target | CHA | +2 |
| `SACRIFICE` | sacrifier, abandonner | sacrifice, give up, let go | inventory item | — | auto |

---

## 2. Object Property System

### 2.1 Property Registry

Every game object (item, NPC, environmental feature, body part) is tagged with properties.
Properties are **inherited** — a `robot_arm` inherits from `body_part` + `mechanical` + `metallic`.

#### Physical Properties

| Property | Description | Examples |
|----------|-------------|---------|
| `tangible` | Can be physically interacted with | Almost everything |
| `visible` | Can be seen/observed | Everything except hidden things |
| `small` | Can be held in one hand, fits in pocket | Datapad, key card, pistol, stimulant |
| `liftable` | Can be picked up and carried | Items, debris, small furniture |
| `holdable` | Can be gripped and wielded | Tools, weapons, bars, cables |
| `heavy` | Requires significant effort to move | Crates, bodies, machinery |
| `rigid` | Doesn't flex or bend | Metal bars, structural panels |
| `flexible` | Can bend, wrap, tie | Cables, tape, hoses, cloth |
| `soft` | Deforms easily | Flesh, padding, clothing |
| `fragile` | Breaks easily | Glass, screens, thin electronics |
| `breakable` | Can be broken with effort | Most solid objects |
| `malleable` | Can be bent/shaped | Thin metal, wires, soft materials |
| `flat` | Flat surface, can slide, use as tray | Datapads, panels, cards |
| `sharp` | Has cutting edge or point | Knives, broken glass, debris |
| `blunt` | Good for impact | Bars, pipes, wrenches |
| `pointed` | Has a tip | Needles, broken antennas, screwdrivers |
| `hollow` | Has interior space | Containers, pipes, vents |
| `sealed` | Enclosed, air/liquid tight | Canisters, suits, sealed rooms |
| `transparent` | Can see through | Windows, visors, glass panels |
| `reflective` | Reflects light/signals | Mirrors, polished metal, screens |

#### Material Properties

| Property | Description | Examples |
|----------|-------------|---------|
| `metallic` | Made of metal | Hull plating, tools, weapons |
| `organic` | Biological material | Bodies, plants, food, bio-samples |
| `synthetic` | Artificial non-metal | Plastics, polymers, foam |
| `conductive` | Conducts electricity | Metal objects, water, cables |
| `flammable` | Can catch fire | Paper, cloth, fuel, chemicals |
| `corrosive` | Can dissolve/damage | Acid, certain chemicals |
| `toxic` | Harmful to health | Chemicals, contaminated samples |
| `radioactive` | Emits radiation | Reactor elements, certain minerals |

#### Functional Properties

| Property | Description | Examples |
|----------|-------------|---------|
| `electronic` | Has electronic components | Datapads, terminals, robots, doors |
| `mechanical` | Has moving parts | Locks, engines, vents, airlocks |
| `programmable` | Can be reprogrammed | Computers, AI cores, drones |
| `powered` | Currently has power | Active terminals, lit areas |
| `unpowered` | Has no power | Dead systems, dark areas |
| `secured` | Protected by security | Locked doors, encrypted data |
| `locked` | Physically or digitally locked | Doors, containers, files |
| `openable` | Can be opened/closed | Doors, containers, hatches, vents |
| `lockable` | Can be locked | Doors, containers, hatches |
| `readable` | Contains readable info | Datapads, screens, signs, journals |
| `data_storage` | Stores digital data | Datapads, drives, terminals |
| `usable` | Has a specific use function | Tools, consumables, equipment |
| `equippable` | Can be worn/equipped | Suits, armor, helmets |
| `edible` | Intended to be eaten | Rations, food |
| `drinkable` | Intended to be drunk | Water, beverages |
| `component` | Can be combined with others | Cables, tape, debris, chemicals |
| `heat_source` | Produces heat/fire | Torches, welders, lasers, sparks |
| `light_source` | Produces light | Torches, lamps, screens, flares |
| `liquid` | Is a liquid | Water, chemicals, fuel, blood |
| `liquid_source` | Can produce liquid | Pipes, tanks, hydrants |
| `power_source` | Provides electricity | Batteries, generators, power cables |

#### Entity Properties (NPCs, creatures)

| Property | Description | Examples |
|----------|-------------|---------|
| `sentient` | Can think, communicate | Humans, advanced AIs, aliens |
| `alive` | Biological and alive | Crew, survivors, creatures |
| `robotic` | Machine entity | Robots, drones, androids |
| `hostile` | Currently aggressive | Enemies, corrupted AI |
| `neutral` | Neither friendly nor hostile | Wary survivors, passive systems |
| `friendly` | Currently cooperative | Allies, helpful NPCs |
| `willing` | Open to negotiation | Non-hostile sentients |
| `wounded` | Injured/damaged | Hurt NPCs, damaged robots |
| `dead` | No longer alive/functional | Corpses, wrecked robots |
| `unconscious` | Alive but unresponsive | Knocked out NPCs |

#### Environmental Properties (rooms, areas)

| Property | Description | Examples |
|----------|-------------|---------|
| `dark` | No light | Unpowered rooms |
| `lit` | Has light | Powered areas, fires |
| `pressurized` | Has atmosphere | Interior rooms |
| `depressurized` | No atmosphere / vacuum | Breached hull, exterior |
| `flooded` | Filled with liquid | Flooded corridors |
| `on_fire` | Currently burning | Fire zones |
| `zero_g` | No gravity | Certain ship areas, exterior |
| `climbable` | Has surfaces to climb | Ladders, vents, rough walls |
| `cramped` | Tight space | Vents, crawlspaces |
| `open_space` | Large area | Hangars, cargo bays |

### 2.2 Property Inheritance

Objects inherit properties from their type. This means adding a new item only requires
specifying its unique properties — common ones come from the type.

```
ITEM_TYPE → BASE PROPERTIES

tool        → tangible, liftable, holdable, small, usable
weapon      → tangible, liftable, holdable, usable
consumable  → tangible, liftable, small, usable
key_item    → tangible, liftable, small
data        → tangible, liftable, small, readable, data_storage
misc        → tangible, liftable

NPC_TYPE → BASE PROPERTIES

human       → tangible, visible, sentient, alive, organic
android     → tangible, visible, sentient, robotic, electronic, mechanical, metallic
robot       → tangible, visible, robotic, electronic, mechanical, metallic
creature    → tangible, visible, alive, organic
corpse      → tangible, visible, dead, organic, heavy
wreck       → tangible, visible, dead, metallic, heavy, component

ENVIRONMENT_FEATURE → BASE PROPERTIES

door        → tangible, visible, openable, lockable, mechanical, breakable, metallic
window      → tangible, visible, transparent, breakable, fragile, sealed
terminal    → tangible, visible, electronic, readable, programmable, powered/unpowered
vent        → tangible, visible, openable, climbable, cramped, hollow
pipe        → tangible, visible, hollow, metallic, rigid
panel       → tangible, visible, flat, metallic, breakable, component
camera      → tangible, visible, electronic, powered/unpowered
airlock     → tangible, visible, openable, lockable, mechanical, sealed
container   → tangible, visible, openable, hollow, liftable
wiring      → tangible, visible, flexible, conductive, electronic, component, flammable
```

### 2.3 Per-Item Property Overrides

Each specific item adds its own properties on top of type defaults:

```json
{
  "pistolet_laser": {
    "type": "weapon",
    "extra_props": ["electronic", "heat_source", "light_source", "ranged"],
    "remove_props": []
  },
  "barre_metal": {
    "type": "weapon",
    "extra_props": ["metallic", "rigid", "blunt", "heavy", "conductive"],
    "remove_props": ["small"]
  },
  "couteau": {
    "type": "weapon",
    "extra_props": ["sharp", "metallic", "small"],
    "remove_props": []
  },
  "datapad": {
    "type": "data",
    "extra_props": ["electronic", "flat", "fragile", "light_source", "component"],
    "remove_props": []
  },
  "ruban_adhesif": {
    "type": "consumable",
    "extra_props": ["flexible", "component", "sticky"],
    "remove_props": []
  },
  "cable": {
    "type": "misc",
    "extra_props": ["flexible", "conductive", "component", "metallic"],
    "remove_props": []
  },
  "debris": {
    "type": "misc",
    "extra_props": ["metallic", "rigid", "sharp", "blunt", "component", "breakable"],
    "remove_props": []
  },
  "trousse_medicale": {
    "type": "consumable",
    "extra_props": ["organic_compatible"],
    "remove_props": []
  },
  "stimulant": {
    "type": "consumable",
    "extra_props": ["injectable", "organic_compatible"],
    "remove_props": []
  },
  "ration": {
    "type": "consumable",
    "extra_props": ["edible"],
    "remove_props": []
  },
  "scanner": {
    "type": "tool",
    "extra_props": ["electronic", "powered"],
    "remove_props": []
  },
  "lampe_torche": {
    "type": "tool",
    "extra_props": ["electronic", "light_source", "blunt"],
    "remove_props": []
  },
  "multitool": {
    "type": "tool",
    "extra_props": ["mechanical", "sharp", "metallic", "component"],
    "remove_props": []
  },
  "combinaison_eva": {
    "type": "tool",
    "extra_props": ["equippable", "sealed", "heavy"],
    "remove_props": ["small"]
  },
  "carte_acces": {
    "type": "key_item",
    "extra_props": ["electronic", "flat"],
    "remove_props": []
  }
}
```

---

## 3. Action Resolution Pipeline

### 3.1 Input Parsing

Player input goes through this pipeline:

```
"J'arrache le bras du robot pour m'en servir de massue"
                    │
                    ▼
        ┌─────────────────────┐
        │  1. TOKENIZE & NLP  │  Split, normalize, stem
        │     (lightweight)   │  Remove articles, preps
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  2. VERB MATCHING   │  Match tokens to verb registry
        │                     │  → PULL ("arracher") + IMPROVISE_WEAPON ("servir de massue")
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  3. TARGET MATCHING │  Match tokens to game entities
        │                     │  → "bras" → robot_arm (body_part of robot_npc)
        │                     │  → "robot" → robot_npc in current location
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  4. COMPATIBILITY   │  Check verb requirements vs target properties
        │     CHECK           │  PULL needs `tangible` → robot_arm is ✓
        │                     │  IMPROVISE_WEAPON needs `holdable` → arm is ✓
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  5. DIFFICULTY      │  Base 10 + verb modifier + context modifiers
        │     CALCULATION     │  → PULL(+0) + hostile_target(+3) + attached(+3) = 16
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  6. STAT SELECTION  │  Verb primary stat + override rules
        │                     │  → PULL = FOR
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  7. DICE ROLL       │  D20 + stat + modifiers vs difficulty
        └─────────┬───────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  8. OUTCOME &       │  Select narrative template
        │     NARRATION       │  Apply state changes
        └─────────────────────┘
```

### 3.2 Verb Matching Strategy

The parser uses a **priority-based multi-strategy approach**:

**Strategy 1 — Exact alias match (fastest)**
Check if any token matches a verb alias exactly.
"frapper" → STRIKE, "pirater" → HACK

**Strategy 2 — Stem/prefix match**
Check if any token stem matches a verb alias stem.
"fracassant" → "fracass-" → near "casser" → BREAK

**Strategy 3 — Compound action detection**
Detect multi-verb patterns:
- "arracher...pour...servir de massue" → PULL + IMPROVISE_WEAPON
- "tirer sur la vitre" → SHOOT (not PULL — context: "tirer sur" ≠ "tirer")
- "utiliser X pour Y" → USE_AS pattern → check Y's implications

**Strategy 4 — Semantic fallback**
If no verb matches, classify by intent:
- Aggressive words → default to STRIKE
- Movement words → default to MOVE_TO
- Question words → default to EXAMINE
- Completely unknown → ask player to reformulate (rare!)

### 3.3 Target Resolution

Targets are resolved from the **current game context**:

```
Search order:
1. Items in player inventory (highest priority — "use MY datapad")
2. Items in current location
3. NPCs in current location (including body parts)
4. Environmental features of current location
5. Connected locations (for movement)
6. Abstract targets ("the air", "the darkness") → environment
```

**Body part resolution**: When a player targets "le bras du robot", the parser:
1. Identifies "robot" → NPC entity in location
2. Identifies "bras" → body part
3. Generates a virtual object `robot_arm` with properties inherited from the NPC
   (`mechanical`, `metallic`, `holdable`, `blunt`, `attached`)
4. The `attached` property adds +3 difficulty to PULL/CUT actions

### 3.4 Compatibility Check

```
COMPATIBLE if:
  - Target has ALL required properties for the verb
  - OR target has a valid alternative property set (OR clauses)
  - AND no blocking conditions exist

BLOCKING CONDITIONS:
  - Verb requires tool player doesn't have (CUT needs bladed, WELD needs heat_source)
  - Target is `out_of_reach` and verb requires `tangible`
  - Target is `too_large` for verb (can't THROW a cargo container)
  - Environmental incompatibility (can't IGNITE in vacuum)

IF INCOMPATIBLE:
  - Don't refuse! Instead, increase difficulty dramatically (+5 to +10)
  - Or suggest what's wrong: "Vous n'avez rien pour couper avec..."
  - Absurd actions are allowed but near-impossible (eating a metal bar: diff 25)
```

### 3.5 Difficulty Modifiers

```
BASE DIFFICULTY = 10

Verb modifier:           (from verb table, -3 to +4)
Target difficulty:        
  - willing/cooperative:  -3
  - neutral:              0
  - hostile/resistant:    +3
  - fortified/armored:    +5

Context modifiers:
  - Using appropriate tool: -2 (e.g., multitool for REPAIR)
  - Using wrong tool:       +2
  - No tool when needed:    +5
  - In darkness:            +2
  - Zero gravity:           +2
  - Time pressure:          +2
  - Wounded (player):       +1
  - Has relevant stat ≥ 4:  -1
  - Creative/clever action: -1 to -3 (reward creativity!)
  - Absurd action:          +5 to +15

DIFFICULTY CAPS:
  - Minimum: 2 (always some chance of failure)
  - Maximum: 25 (always possible with nat 20)
  - "Auto" actions (TAKE, DROP): no roll needed
```

---

## 4. Narrative Template System

### 4.1 Template Structure

Every outcome is narrated by selecting from a pool of templates. Templates have **slots**
filled by context.

```
Template: "{action_verb_past}, {result_description}. {consequence}."

Slots:
  {actor}          → "Vous" (always in this game)
  {target}         → the resolved target's display name
  {target_part}    → body part / component if applicable
  {tool_used}      → item used, if any
  {location}       → current location name
  {sound}          → contextual sound effect
  {fluid}          → contextual fluid (blood, oil, coolant, sparks)
  {damage_desc}    → description of damage dealt/received
  {emotion}        → contextual emotion word
```

### 4.2 Template Categories

Templates are organized by: `verb_category × outcome × intensity`

Outcomes: `critical_success`, `success`, `partial_success`, `failure`, `critical_failure`
Intensity: `calm`, `tense`, `desperate` (from story beat / tension level)

Example templates for PULL + mechanical target:

**Critical Success (tense):**
```
"D'un geste explosif, vous arrachez {target_part} dans un crissement de métal torturé. 
{fluid_type} gicle des connecteurs rompus. {target} chancelle, déséquilibré par la perte."

"Vos doigts trouvent la jointure faible. Un seul mouvement brutal suffit — {target_part} 
cède avec un CRAC satisfaisant, laissant des filaments de câbles pendre comme des tendons arrachés."
```

**Success:**
```
"Après un effort soutenu, {target_part} finit par céder. Le métal grince en signe de 
protestation, mais la pièce vient. Vous la soupesez — ça fera l'affaire."

"Vous agrippez {target_part} et tirez. Les rivets sautent un par un. Ça résiste, 
puis ça lâche d'un coup. Vous titubez en arrière, {target_part} en main."
```

**Failure:**
```
"Vous tirez de toutes vos forces sur {target_part}, mais l'assemblage tient bon. 
Vos mains glissent. {target} en profite pour {hostile_reaction}."

"Le métal ne bouge pas d'un millimètre. Vos muscles brûlent, votre prise se desserre. 
Il va falloir trouver une autre approche."
```

**Critical Failure:**
```
"Votre main dérape violemment et heurte {nearby_hazard}. La douleur remonte comme 
une décharge. [-{damage} HP]. {target} reste parfaitement intact."

"L'assemblage cède — mais pas là où vous tiriez. Un panneau se détache et vous 
frappe en plein visage. [-{damage} HP]. {target_part} est toujours en place."
```

### 4.3 Absurd Action Templates

For actions that are technically possible but ridiculous:

```
CATEGORY: absurd_attempt

"Vous fixez {target} avec une détermination inquiétante et tentez de {absurd_action}. 
{npc_reaction_if_present}. Contre toute attente... {outcome}."

"Ce n'est clairement pas l'utilisation prévue par le fabricant, mais vous tentez 
quand même de {absurd_action}. {outcome}."

"Même dans une situation aussi désespérée, {absurd_action} reste un choix... audacieux. 
{outcome}."
```

### 4.4 Environmental Consequence Templates

Some actions trigger environmental changes:

```
SHOOT + window/transparent:
  → depressurize room (if exterior)
  → shattered_glass hazard
  → alarm trigger

IGNITE + flammable:
  → room gains `on_fire` property
  → oxygen drain starts
  → spreading danger

FLOOD + liquid_source:
  → room gains `flooded` property
  → electronics short out
  → movement penalty

BREAK + electronic + powered:
  → sparks, potential shock
  → system goes offline
  → may unlock/lock related doors

SABOTAGE + camera/security:
  → reduced detection in area
  → may trigger alarm countdown
  → hostile NPCs investigate
```

---

## 5. Implementation Priority

### Phase 1: Core Data Structures
1. Property enum/registry (all properties listed above)
2. Object type → property inheritance map
3. Verb registry with aliases and requirements
4. Per-item property overrides for all existing items

### Phase 2: Parser Engine
1. Input tokenizer (FR + EN)
2. Verb matcher (exact → stem → compound → fallback)
3. Target resolver (inventory → location → environment)
4. Compatibility checker
5. Difficulty calculator

### Phase 3: Narrative Templates  
1. Template slot system
2. 5-10 templates per verb category × outcome (start with common verbs)
3. Absurd action templates
4. Environmental consequence templates

### Phase 4: Expansion
1. Add more verb aliases as players discover edge cases
2. Add more per-item properties for new items
3. Community feedback → new templates
4. Edge case handling improvements

---

## 6. What This System CAN'T Handle (and what to do about it)

Some player inputs will be too creative or abstract for pattern matching:

- "Je fais semblant d'être mort" → DECEIVE target = environment (unusual)
- "Je chante une berceuse au robot" → CALM + robotic target (unusual combo)
- "Je calcule la trajectoire pour ricocher le débris" → complex physics reasoning

**Fallback strategy:**
1. If verb is recognized but target/combo is unusual → allow it with high difficulty + humorous template
2. If nothing is recognized → present the player with a reformulation prompt:
   "Vous hésitez un instant. Que tentez-vous exactement ?" + suggested interpretations
3. If the action is truly impossible (no physics basis) → "L'idée vous traverse l'esprit, 
   mais même dans votre état, vous réalisez que c'est physiquement impossible."

The key principle: **never say "you can't do that". Say "you can try, but..."**
