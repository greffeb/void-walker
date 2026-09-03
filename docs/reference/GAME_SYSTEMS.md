# Void Walker — Game Systems Reference

> **Statut :** RÉFÉRENCE VIVANTE — décrit le jeu tel qu'il doit être.
> Mettre à jour quand le design change. Fait autorité sur le code.
>
> **Où on en est :** [`docs/STATUS.md`](../STATUS.md) est la source unique de vérité.

> **Role:** Exhaustive reference for all game mechanics.
> **Audience:** Claude Code during Phase 1, 3, 4, 6, 7.
> **Rule:** Specs here are authoritative. Phase files reference sections; they do not duplicate them.

---

## Table of Contents

1. [Character System](#1-character-system)
2. [Combat System](#2-combat-system)
3. [Status Conditions](#3-status-conditions)
4. [Oxygen System](#4-oxygen-system)
5. [Item Durability](#5-item-durability)
6. [Creativity Bonus](#6-creativity-bonus)
7. [Turn Economy & Stalker Clock](#7-turn-economy--stalker-clock)
8. [Ship Memory](#8-ship-memory)
9. [Save System](#9-save-system)
10. [Black Box](#10-black-box)
11. [Secret Verbs](#11-secret-verbs)
12. [Difficulty Presets](#12-difficulty-presets)
13. [Turn Execution Order](#13-turn-execution-order)

---

## 1. Character System

### 1.1 Six Stats

Range: **0 to 5** per stat (0 = terrible, 3 = average, 5 = exceptional).

| Stat | FR Name | EN Name | Governs |
|------|---------|---------|---------|
| `ATK` | Force / Attaque | Strength / Attack | Melee damage, physical force (STRIKE, PUSH, PULL, BREAK, FORCE_OPEN, LIFT, BEND, BITE, SQUEEZE) |
| `DEF` | Defense | Defense | Damage reduction, blocking (BLOCK, IMPROVISE_SHIELD, BARRICADE). Reduces incoming damage. |
| `INT` | Intelligence | Intelligence | Technical actions (HACK, REPAIR, REPROGRAM, DISASSEMBLE, SABOTAGE, SCAN, OVERRIDE, WELD, SET_TRAP, PLUG). Puzzle-solving. |
| `CHA` | Charisme | Charisma | Social actions (PERSUADE, INTIMIDATE, DECEIVE, CALM, COMMAND, SEDUCE, BARTER, INTERROGATE, PLEAD, PROVOKE, LURE). |
| `AGI` | Agilite | Agility | Speed, evasion (DODGE, RUN, HIDE, CLIMB, JUMP, SWIM, THROW, SHOOT). Initiative in combat. Stealth. |
| `LCK` | Chance | Luck | Passive bonus: `+floor(LCK/2)` added to ALL rolls. Also affects loot quality, critical hit/failure thresholds, random event outcomes. |

### 1.2 How Stats Affect Rolls

```
D20 + primary_stat + floor(LCK / 2)  vs  difficulty
```

LCK is always added as a passive bonus. A player with LCK 4 gets +2 on every roll. LCK 1 gets +0. LCK 5 gets +2. This makes LCK a tempting "generalist" stat — it helps everything, but never as much as the primary stat for a specific action.

### 1.3 Verb-to-Stat Mapping

Complete mapping (verbs organized by governing stat):

```typescript
type StatId = 'ATK' | 'DEF' | 'INT' | 'CHA' | 'AGI' | 'LCK';

const VERB_STATS: Record<string, StatId> = {
  // ATK -- raw physical force and melee combat
  STRIKE: 'ATK', PUSH: 'ATK', PULL: 'ATK', LIFT: 'ATK',
  KICK: 'ATK', BREAK: 'ATK', BEND: 'ATK', CUT: 'ATK',
  FORCE_OPEN: 'ATK', BITE: 'ATK', SQUEEZE: 'ATK',
  IMPROVISE_WEAPON: 'ATK', SACRIFICE: 'ATK',

  // DEF -- blocking, shielding, fortifying
  BLOCK: 'DEF', IMPROVISE_SHIELD: 'DEF', BARRICADE: 'DEF',

  // INT -- technical, knowledge, precision
  EXAMINE: 'INT', READ: 'INT', HACK: 'INT', REPAIR: 'INT',
  DISASSEMBLE: 'INT', ASSEMBLE: 'INT', ACTIVATE: 'INT',
  DEACTIVATE: 'INT', REPROGRAM: 'INT', LOCK: 'INT',
  UNLOCK: 'INT', WELD: 'INT', PLUG: 'INT', SCAN: 'INT',
  OVERRIDE: 'INT', SABOTAGE: 'INT', SET_TRAP: 'INT',
  IMPROVISE_TOOL: 'INT', WEDGE: 'INT', IGNITE: 'INT',
  FLOOD: 'INT', ELECTRIFY: 'INT', TIE: 'INT', COVER: 'INT',
  LISTEN: 'INT', SMELL: 'INT',

  // CHA -- social, persuasion, deception
  TALK: 'CHA', PERSUADE: 'CHA', INTIMIDATE: 'CHA',
  DECEIVE: 'CHA', DISTRACT: 'CHA', BARTER: 'CHA',
  SEDUCE: 'CHA', COMMAND: 'CHA', CALM: 'CHA',
  PROVOKE: 'CHA', PLEAD: 'CHA', INTERROGATE: 'CHA',
  SIGNAL: 'CHA', LURE: 'CHA',

  // AGI -- speed, evasion, stealth, accuracy, ranged
  THROW: 'AGI', CLIMB: 'AGI', JUMP: 'AGI', DODGE: 'AGI',
  SWIM: 'AGI', RUN: 'AGI', HIDE: 'AGI', STACK: 'AGI',
  SHOOT: 'AGI',  // Ranged attack -- AGI governs accuracy
};
```

**Key remappings from old 3-stat system:**
- DODGE, RUN, HIDE, CLIMB, JUMP, SWIM, THROW: FOR -> **AGI**
- BLOCK, IMPROVISE_SHIELD, BARRICADE: FOR -> **DEF**
- SHOOT: new verb, **AGI** (ranged attack, accuracy-based)
- SACRIFICE: new verb, **ATK** (context-dependent, see §11)

### 1.4 Three Classes

Each class has a **fixed stat distribution** (total: 15 points) plus a **starting kit** and **passive ability**.

```typescript
interface PlayerClass {
  id: string;
  name: LocaleString;
  description: LocaleString;
  flavor: LocaleString;
  stats: Record<StatId, number>;
  startingHp: number;
  startingItems: string[];
  passiveAbility: PassiveAbility;
}

const CLASSES: Record<string, PlayerClass> = {

  marine: {
    id: 'marine',
    name: { fr: 'Marine', en: 'Marine' },
    description: {
      fr: 'Soldat d\'elite. Fort en combat, fiable sous le feu. Pas tres subtil.',
      en: 'Elite soldier. Strong in combat, reliable under fire. Not very subtle.',
    },
    flavor: {
      fr: '  Mon arme est mon meilleur ami. Mon deuxieme meilleur ami, c\'est mon poing.  ',
      en: '"My weapon is my best friend. My second best friend is my fist."',
    },
    //         ATK  DEF  INT  CHA  AGI  LCK
    stats: { ATK: 4, DEF: 3, INT: 1, CHA: 1, AGI: 4, LCK: 2 },
    startingHp: 14,
    startingItems: ['laser_pistol', 'knife', 'ration', 'flashlight'],
    passiveAbility: {
      id: 'combat_instinct',
      name: { fr: 'Instinct de combat', en: 'Combat Instinct' },
      effect: 'COMBAT_DAMAGE_BONUS',  // +1 damage on all combat hits
      value: 1,
    },
  },

  engineer: {
    id: 'engineer',
    name: { fr: 'Ingenieur', en: 'Engineer' },
    description: {
      fr: 'Technicien de genie. Repare, pirate, improvise. Fragile en combat.',
      en: 'Brilliant technician. Repairs, hacks, improvises. Fragile in combat.',
    },
    flavor: {
      fr: '  Donnez-moi du ruban adhesif et un cable, je vous fais un reacteur.  ',
      en: '"Give me duct tape and a cable, I\'ll build you a reactor."',
    },
    //         ATK  DEF  INT  CHA  AGI  LCK
    stats: { ATK: 1, DEF: 2, INT: 5, CHA: 2, AGI: 2, LCK: 3 },
    startingHp: 10,
    startingItems: ['multitool', 'scanner', 'duct_tape', 'cable', 'datapad'],
    passiveAbility: {
      id: 'jury_rig',
      name: { fr: 'Bricoleur ne', en: 'Jury-Rig' },
      effect: 'REPAIR_ALL_BROKEN',  // Can REPAIR any broken item (others: only easily_repairable)
      value: null,
    },
  },

  medic: {
    id: 'medic',
    name: { fr: 'Medecin', en: 'Medic' },
    description: {
      fr: 'Officier medical. Soigne, calme, negocie. Equilibre mais sans specialite.',
      en: 'Medical officer. Heals, calms, negotiates. Balanced but no specialty.',
    },
    flavor: {
      fr: '  Je suis la pour soigner. Mais j\'ai aussi appris ou frapper pour que ca fasse mal.  ',
      en: '"I\'m here to heal. But I also learned where to hit so it hurts."',
    },
    //         ATK  DEF  INT  CHA  AGI  LCK
    stats: { ATK: 2, DEF: 2, INT: 3, CHA: 4, AGI: 2, LCK: 2 },
    startingHp: 12,
    startingItems: ['medical_kit', 'stimulant', 'flashlight', 'ration'],
    passiveAbility: {
      id: 'field_medic',
      name: { fr: 'Medecin de terrain', en: 'Field Medic' },
      effect: 'HEALING_BONUS',        // Healing items restore +2 HP
      value: 2,
    },
  },
};
```

### 1.5 Two Bonus Points

After choosing a class, the player distributes **2 bonus points** freely among any stats. **No stat can exceed 5.**

```typescript
interface CharacterCreationState {
  selectedClass: string | null;
  bonusPointsRemaining: number;    // Starts at 2
  bonusAllocation: Partial<Record<StatId, number>>;
  // Final stats = class.stats + bonusAllocation
}

function validateAllocation(
  classStats: Record<StatId, number>,
  bonus: Partial<Record<StatId, number>>,
): boolean {
  const totalBonus = Object.values(bonus).reduce((a, b) => a + b, 0);
  if (totalBonus !== 2) return false;
  for (const [stat, bonusVal] of Object.entries(bonus)) {
    if (bonusVal < 0) return false;
    if ((classStats[stat as StatId] + bonusVal) > 5) return false;
  }
  return true;
}
```

### 1.6 Player Name & Creation Result

The player enters a name (or gets a random one). This name appears in Black Box logs of future runs.

```typescript
interface PlayerCreationResult {
  name: string;
  classId: string;
  stats: Record<StatId, number>;  // Class + bonus
  maxHp: number;
  hp: number;
  inventory: string[];
  passiveAbility: PassiveAbility;
}
```

### 1.7 UI Flow

```
TITLE SCREEN
     |
     v
CLASS SELECTION (3 cards with stat bars + HP + passive description)
     |
     v
BONUS POINT ALLOCATION (2 points, +/- buttons, cap at 5)
     |
     v
NAME ENTRY (free text + random name button)
     |
     v
DIFFICULTY SELECTION (Explorer / Survivor / Nightmare)
     |
     v
GAME START
```

### 1.8 Status Bar Display

```
 HP 12/14  |  O2 100%  |  ATK 4  DEF 3  INT 1  CHA 1  AGI 4  LCK 2
```

When a stat is relevant to the current action, it highlights:
```
> Pirater le terminal  [INT +5] [LCK +1] -> Difficulte 14
```

---

## 2. Combat System

### 2.1 Design Philosophy

Combat uses the **same verb-based action system** as everything else. There is no separate "combat mode." The player still types (or selects) actions freely. The difference is that a **hostile NPC is present** and **reacts after the player's action.** The player can STRIKE, but also DECEIVE, HIDE, THROW an object, HACK the robot, IGNITE something, SHOOT from range, or attempt any creative approach.

### 2.2 NPC Combat Stats

```typescript
interface NPCCombatStats {
  maxHp: number;
  hp: number;
  attack: number;           // Damage dealt on hit (base)
  defense: number;          // Flat damage reduction
  dodgeChance: number;      // 0.0 to 0.5
  initiative: number;       // Narrative flavor for reaction speed
  weakPoint: WeakPoint;
  aggressionPattern: AggressionPattern;
  fleeDC: number;           // DC for the player to successfully RUN/flee
}

interface WeakPoint {
  id: string;
  name: LocaleString;
  discoverMethod: 'examine' | 'scan' | 'combat_hint' | 'lore';
  discovered: boolean;
  targetVerbs: string[];     // Verbs that exploit it: ['STRIKE', 'SABOTAGE', 'SHOOT']
  targetProperties: string[];
  damageMultiplier: number;  // 2.0 to 3.0
  narrativeHint: LocaleString;
  exploitNarrative: LocaleString;
}

type AggressionPattern =
  | 'aggressive'   // Attacks every turn
  | 'defensive'    // Attacks only if attacked first
  | 'ambush'       // High first-strike damage, then weaker
  | 'retreating'   // Flees at low HP
  | 'berserk';     // Gets stronger as HP drops
```

### 2.3 Combat Turn Flow

```
PLAYER ACTION (any verb)
     |
     v
ENGINE RESOLVES ACTION (normal pipeline)
     |-- If action targets NPC -> damage calculation
     |-- If action targets environment -> normal consequences
     |-- If non-combat (HIDE, RUN, HACK) -> resolve normally
     |
     v
NPC REACTION PHASE
     |-- If NPC alive AND aggressive -> NPC attacks
     |-- If NPC stunned/distracted -> NPC skips turn
     |-- If NPC dead -> combat ends
     |-- If player fled successfully -> combat ends
     |
     v
NARRATIVE OUTPUT (action result + NPC reaction combined)
```

### 2.4 Player Attacks NPC -- Damage Calculation

```typescript
function resolvePlayerAttack(
  player: PlayerState,
  npc: NPCState,
  verb: string,
  weapon: ItemDefinition | null,
  rollResult: RollResult,
): CombatResult {
  // Step 1: Did the player hit? (from existing roll system)
  if (!rollResult.success) {
    return { playerHit: false, damageDealt: 0, npcDodged: false,
             weakPointHit: false, npcKilled: false };
  }

  // Step 2: NPC dodge check
  if (Math.random() < npc.combat.dodgeChance) {
    return { playerHit: false, damageDealt: 0, npcDodged: true,
             weakPointHit: false, npcKilled: false };
  }

  // Step 3: Calculate base damage
  let damage = calculateBaseDamage(player, weapon, verb);

  // Step 4: Weak point check
  let weakPointHit = false;
  if (npc.combat.weakPoint.discovered && isWeakPointTargeted(verb, npc.combat.weakPoint)) {
    damage = Math.floor(damage * npc.combat.weakPoint.damageMultiplier);
    weakPointHit = true;
  }

  // Step 5: Apply NPC defense
  damage = Math.max(1, damage - npc.combat.defense);

  // Step 6: Critical hit (nat 20)
  if (rollResult.natural === 20) {
    damage = Math.floor(damage * 1.5);
  }

  // Step 7: Passive abilities
  if (player.passiveAbility.effect === 'COMBAT_DAMAGE_BONUS') {
    damage += player.passiveAbility.value;
  }

  // Step 8: Apply damage
  const npcKilled = (npc.combat.hp - damage) <= 0;
  return { playerHit: true, damageDealt: damage, npcDodged: false,
           weakPointHit, npcKilled };
}

function calculateBaseDamage(
  player: PlayerState, weapon: ItemDefinition | null, verb: string,
): number {
  let base = player.stats.ATK;
  if (weapon) {
    base += weapon.damageBonus ?? 0;
    if (verb === 'IMPROVISE_WEAPON') base = Math.ceil(base * 0.75);
  }
  // SHOOT uses AGI for hit chance but ATK for damage base
  if (verb === 'SHOOT' && weapon) {
    base = weapon.damageBonus ?? 0 + Math.floor(player.stats.AGI / 2);
  }
  return Math.max(1, base);
}
```

### 2.5 Weapon Damage Values

```typescript
interface ItemDefinition {
  // ...existing fields...
  damageBonus?: number;  // Added to ATK for damage. Undefined = 0 (not a weapon)
}

// Examples:
// laser_pistol:      damageBonus: 4
// knife:             damageBonus: 2
// metal_bar:         damageBonus: 3
// debris (improvised): damageBonus: 1
// multitool:         damageBonus: 1
// unarmed:           damageBonus: 0 (just ATK stat)
```

### 2.6 Equipment & Armor

Items with `armorValue` reduce incoming damage when equipped:

```typescript
interface EquipableItem extends ItemDefinition {
  armorValue?: number;     // Flat damage reduction from NPC attacks
  slot: 'body' | 'hand';  // Equipment slot
}

// Examples:
// eva_suit:       armorValue: 2, slot: 'body'
// makeshift_armor: armorValue: 1, slot: 'body'
// combat_vest:    armorValue: 3, slot: 'body'
```

Armor stacks with DEF stat: `total_reduction = DEF + armorValue`. A player with DEF 3 wearing combat_vest (armorValue 3) reduces incoming damage by 6.

### 2.7 NPC Attacks Player

```typescript
function resolveNPCAttack(npc: NPCState, player: PlayerState): NPCAttackResult {
  // NPC roll: D20 + npc.attack vs 10 + player.AGI + player.DEF + floor(player.LCK/2)
  const npcRoll = rollD20();
  const playerDefense = 10 + player.stats.AGI + player.stats.DEF
                        + Math.floor(player.stats.LCK / 2);

  // Passive dodge: AGI >= 3 grants 10% passive dodge
  const passiveDodgeChance = player.stats.AGI >= 3 ? 0.1 : 0;

  if (npcRoll + npc.combat.attack < playerDefense) {
    return { hit: false, damage: 0 };
  }

  if (Math.random() < passiveDodgeChance) {
    return { hit: false, damage: 0, dodged: true };
  }

  // Damage = NPC attack - player DEF (min 1)
  let damage = Math.max(1, npc.combat.attack - player.stats.DEF);

  // Equipped armor
  if (player.equippedArmor) {
    damage = Math.max(1, damage - player.equippedArmor.armorValue);
  }

  // Difficulty multiplier
  damage = Math.floor(damage * player.difficulty.threatDamageMultiplier);

  return { hit: true, damage };
}
```

### 2.8 Weak Point Discovery

Players discover weak points through multiple paths:

| Discovery Method | How |
|-----------------|-----|
| `examine` | EXAMINE or SCAN the NPC -> auto-discover on success |
| `scan` | Only SCAN (needs scanner tool) -> discover |
| `combat_hint` | After 2+ rounds: narrative hint. After 3+ rounds: auto-discover |
| `lore` | Set by scenario event (reading a datapad elsewhere) |

Narrative hints escalate during combat:
```
Round 1: "La creature vous charge. Son blindage semble impenetrable."
Round 2: "Vous remarquez que les plaques sur son flanc gauche bougent
          differemment -- une jointure, peut-etre ?"
Round 3: "C'est la ! Le module de refroidissement est expose entre
          les plaques. [Point faible decouvert : Module de refroidissement]"
```

UI when discovered:
```
! POINT FAIBLE : Module de refroidissement [FRAPPER / SABOTER / TIRER]
```

### 2.9 Fleeing Combat

```typescript
function attemptFlee(player: PlayerState, npc: NPCState): FleeResult {
  // Roll: D20 + AGI + floor(LCK/2) vs NPC.fleeDC
  const roll = rollD20();
  const total = roll + player.stats.AGI + Math.floor(player.stats.LCK / 2);
  const success = total >= npc.combat.fleeDC;

  if (success) {
    return {
      success: true,
      destination: player.previousLocation,
      // NPC does NOT get a parting attack (horror = giving relief)
    };
  } else {
    return {
      success: false,
      npcFreeAttack: true,  // Failed flee: NPC gets a free attack
    };
  }
}
```

### 2.10 NPC Templates

```typescript
const NPC_TEMPLATES: Record<string, NPCCombatStats> = {
  security_robot: {
    maxHp: 15, hp: 15, attack: 4, defense: 3, dodgeChance: 0.1,
    initiative: 5, fleeDC: 10, aggressionPattern: 'aggressive',
    weakPoint: {
      id: 'cooling_module', discoverMethod: 'examine',
      targetVerbs: ['STRIKE', 'SABOTAGE', 'BREAK', 'SHOOT'],
      damageMultiplier: 2.5,
    },
  },
  xenomorph: {
    maxHp: 25, hp: 25, attack: 7, defense: 2, dodgeChance: 0.3,
    initiative: 8, fleeDC: 14, aggressionPattern: 'aggressive',
    weakPoint: {
      id: 'acid_sac', discoverMethod: 'combat_hint',
      targetVerbs: ['CUT', 'STRIKE', 'THROW', 'SHOOT'],
      damageMultiplier: 3.0,
    },
  },
  wounded_android: {
    maxHp: 8, hp: 5, attack: 2, defense: 1, dodgeChance: 0.0,
    initiative: 2, fleeDC: 6, aggressionPattern: 'defensive',
    weakPoint: {
      id: 'exposed_wiring', discoverMethod: 'examine',
      targetVerbs: ['HACK', 'OVERRIDE', 'ELECTRIFY'],
      damageMultiplier: 2.0,
    },
  },
  parasitized_crewmember: {
    maxHp: 12, hp: 12, attack: 5, defense: 1, dodgeChance: 0.15,
    initiative: 6, fleeDC: 11, aggressionPattern: 'berserk',
    weakPoint: {
      id: 'parasite_node', discoverMethod: 'scan',
      targetVerbs: ['CUT', 'STRIKE', 'SHOOT'],
      damageMultiplier: 2.5,
    },
  },
};
```

### 2.11 Combat Balance Constants

```typescript
const COMBAT_BALANCE = {
  UNARMED_BASE_DAMAGE: 1,
  IMPROVISED_WEAPON_MULTIPLIER: 0.75,
  CRITICAL_HIT_MULTIPLIER: 1.5,
  PASSIVE_DODGE_AGI_THRESHOLD: 3,
  PASSIVE_DODGE_CHANCE: 0.1,
  NPC_HIT_BASE_DC: 10,
  BERSERK_ATK_BONUS_PER_QUARTER: 1,  // +1 atk per 25% HP lost
  WEAK_POINT_HINT_ROUND: 2,
  WEAK_POINT_AUTO_DISCOVER_ROUND: 3,
  ENVIRONMENTAL_KILL_MULTIPLIER: 10,
  CORNERED_FLEE_DC: 16,
} as const;
```

---

## 3. Status Conditions

### 3.1 Five Conditions

```typescript
type ConditionId = 'wounded' | 'terrified' | 'cold' | 'poisoned' | 'exhausted';

interface StatusCondition {
  id: ConditionId;
  name: LocaleString;
  icon: string;
  description: LocaleString;
  statMalus: Partial<Record<StatId, number>>;
  hpDrainPerAction: number;
  specialEffect: string | null;
  durationType: 'permanent_until_cured' | 'timed';
  durationActions?: number;
  cureMethod: string;
}

const CONDITIONS: Record<ConditionId, StatusCondition> = {
  wounded: {
    id: 'wounded',
    name: { fr: 'Blesse', en: 'Wounded' },
    icon: '!',
    statMalus: { ATK: -1, AGI: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE medical_kit OR USE stimulant',
  },
  terrified: {
    id: 'terrified',
    name: { fr: 'Terrifie', en: 'Terrified' },
    icon: '!!',
    statMalus: { ATK: -1, INT: -1, CHA: -1 },
    hpDrainPerAction: 0,
    specialEffect: 'ALL_ROLLS_MINUS_1',  // Additional -1 to ALL rolls
    durationType: 'timed',
    durationActions: 5,
    cureMethod: 'TIME (5 actions) OR CALM by friendly NPC OR USE stimulant',
  },
  cold: {
    id: 'cold',
    name: { fr: 'Hypothermie', en: 'Hypothermia' },
    icon: '*',
    statMalus: { AGI: -2, INT: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'MOVE_TO warm area OR USE heat_source OR IGNITE something',
  },
  poisoned: {
    id: 'poisoned',
    name: { fr: 'Empoisonne', en: 'Poisoned' },
    icon: 'x',
    statMalus: { ATK: -1 },
    hpDrainPerAction: 1,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE medical_kit OR USE antidote',
  },
  exhausted: {
    id: 'exhausted',
    name: { fr: 'Epuise', en: 'Exhausted' },
    icon: '~',
    statMalus: { ATK: -1, DEF: -1, AGI: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE ration OR USE stimulant OR WAIT 3 actions in safe room',
  },
};
```

### 3.2 Condition Stacking

**Stacking is deliberate.** A player can have multiple conditions simultaneously. Stat penalties accumulate. The minimum stat floor is **0** (never negative).

Example: Wounded (ATK -1, AGI -1) + Exhausted (ATK -1, DEF -1, AGI -1) = ATK -2, DEF -1, AGI -2. A Marine with ATK 4 would drop to ATK 2.

This is intentional for a horror game -- being battered by multiple conditions creates desperation.

```typescript
function applyConditionMalus(
  baseStats: Record<StatId, number>,
  conditions: ConditionId[],
): Record<StatId, number> {
  const modified = { ...baseStats };
  for (const condId of conditions) {
    const cond = CONDITIONS[condId];
    for (const [stat, malus] of Object.entries(cond.statMalus)) {
      modified[stat as StatId] = Math.max(0, modified[stat as StatId] + malus);
    }
  }
  return modified;
}
```

### 3.3 Condition Triggers

| Trigger | Condition |
|---------|-----------|
| HP drops below 30% | `wounded` |
| First encounter with main threat | `terrified` |
| Critical failure on social/combat roll | `terrified` (50% chance) |
| 3+ actions in depressurized/cold zone | `cold` |
| Toxic substance contact | `poisoned` |
| 10+ actions without rest in high tension | `exhausted` |
| NPC special attack (poison claw, gas) | `poisoned` |

### 3.4 Condition Tick (Per Action)

```typescript
function tickConditions(state: GameState): GameState {
  let newHp = state.player.hp;
  const remainingConditions: ConditionId[] = [];

  for (const condId of state.player.conditions) {
    const cond = CONDITIONS[condId];
    newHp -= cond.hpDrainPerAction;

    if (cond.durationType === 'timed') {
      const remaining = state.conditionTimers[condId] - 1;
      if (remaining > 0) remainingConditions.push(condId);
    } else {
      remainingConditions.push(condId);
    }
  }

  return {
    ...state,
    player: { ...state.player, hp: newHp, conditions: remainingConditions },
  };
}
```

### 3.5 UI Display

Active conditions show as icons in the status bar with affected stats marked:
```
 HP 4/14 [Blesse][Terrifie]  |  O2 80%  |  ATK 3v  DEF 3  INT 0v  CHA 0v  AGI 3v  LCK 2
```
Tapping a condition icon shows name, effect, and cure method.

---

## 4. Oxygen System

### 4.1 Zone-Based O2 Drain

Oxygen only matters in **specific zones** tagged with atmosphere properties. Not global.

```typescript
interface OxygenState {
  current: number;     // 0 to 100
  max: number;         // Always 100
  drainRate: number;   // Per-action drain in current zone (0 if safe)
  active: boolean;     // Is O2 relevant in current scenario?
}

const OXYGEN_DRAIN_RATES: Record<string, number> = {
  'pressurized': 0,         // Normal -- no drain
  'low_oxygen': 3,          // Slow drain -- leak, thin atmosphere
  'depressurized': 8,       // Fast drain -- vacuum, hull breach
  'toxic_atmosphere': 5,    // Medium drain -- filters working overtime
};
```

### 4.2 O2 Depletion -> HP Drain

When O2 hits 0, HP drains instead:

```typescript
function tickOxygen(state: GameState): GameState {
  if (!state.oxygen.active) return state;
  const drain = OXYGEN_DRAIN_RATES[state.currentLocation.atmosphere] ?? 0;
  if (drain === 0) return state;

  let newO2 = state.oxygen.current - drain;
  let newHp = state.player.hp;

  if (newO2 <= 0) {
    newO2 = 0;
    newHp -= BALANCE.OXYGEN.HP_DRAIN_AT_ZERO; // Default: 3
  }

  return {
    ...state,
    oxygen: { ...state.oxygen, current: newO2 },
    player: { ...state.player, hp: newHp },
  };
}
```

### 4.3 O2 Restoration

| Method | Effect |
|--------|--------|
| Enter pressurized zone | O2 restores to 100 over 3 actions (+33/action) |
| Use O2 canister item | Instant +50 O2 |
| Equip EVA suit | Drain rate halved in depressurized zones |
| Repair life support (INT check) | Zone becomes pressurized permanently |

### 4.4 O2 UI & Narrative Integration

O2 bar only shows when relevant. Narrative adapts to level:

```
O2 > 80%:  (no mention)
O2 50-80%: "Votre respiration devient plus laborieuse."
O2 20-50%: "L'air se rarefie. Chaque inspiration est un effort."
O2 < 20%:  "Vos poumons brulent. Votre vision se trouble."  [CRITIQUE]
O2 = 0%:   "Vous suffoquez. [-3 PV]"
```

### 4.5 O2 Balance Constants

```typescript
OXYGEN: {
  MAX: 100,
  DRAIN_PRESSURIZED: 0,
  DRAIN_LOW_OXYGEN: 3,
  DRAIN_DEPRESSURIZED: 8,
  DRAIN_TOXIC: 5,
  HP_DRAIN_AT_ZERO: 3,
  RESTORE_RATE_SAFE: 33,
  CANISTER_RESTORE: 50,
  EVA_DRAIN_REDUCTION: 0.5,
}
```

---

## 5. Item Durability

### 5.1 Binary State

Items are either **intact** or **broken**. No durability counter.

```typescript
interface ItemState {
  id: string;
  broken: boolean;
  repairable: boolean;        // Can be repaired at all?
  easily_repairable: boolean; // Non-engineers can repair this?
}
```

### 5.2 Break Triggers

| Trigger | Affected Items |
|---------|---------------|
| Critical failure (nat 1) using the item | Items with `fragile` property |
| Using item as improvised weapon (after 2 uses) | Items NOT tagged `weapon` |
| Environmental damage (fire, acid, depressurization) | Items with `fragile` or `flammable` |
| Thrown item hits hard target | Items with `fragile` |

```typescript
function checkItemBreakage(
  item: ItemDefinition, verb: string, rollResult: RollResult, context: ActionContext,
): boolean {
  if (item.type === 'weapon' && ['STRIKE', 'CUT', 'THROW', 'SHOOT'].includes(verb)) {
    return false; // Weapons don't break from normal use
  }
  if (item.properties.includes('fragile') && rollResult.natural === 1) return true;
  if (verb === 'IMPROVISE_WEAPON') {
    if ((context.itemCombatUses[item.id] ?? 0) >= 2) return true;
  }
  return false;
}
```

### 5.3 Broken Item Behavior

- Stays in inventory (physical object persists)
- Cannot be used for its primary function
- **Can still be used creatively** (broken datapad = improvised shield, component)
- Properties change: gains `broken`, loses `usable`, `powered`, `electronic` (if applicable)

### 5.4 Repair Rules

**Engineer** (passive `REPAIR_ALL_BROKEN`): Can repair **any** broken item with `repairable: true`.
**Non-engineer**: Can only repair items tagged `easily_repairable: true`.

```typescript
function canRepairItem(item: ItemState, player: PlayerState): boolean {
  if (!item.broken) return false;
  if (!item.repairable) return false;

  if (player.passiveAbility.effect === 'REPAIR_ALL_BROKEN') return true;
  return item.easily_repairable;
}

// Repair DC: 12 base. Non-engineers get +3 penalty.
const DURABILITY = {
  IMPROVISED_WEAPON_MAX_USES: 2,
  REPAIR_BASE_DC: 12,
  NON_ENGINEER_REPAIR_PENALTY: 3,
} as const;
```

---

## 6. Creativity Bonus

### 6.1 The Problem

If suggestion buttons are always optimal, players never type freely. The core pillar "attempt anything" dies.

### 6.2 The Solution

When the player types a free-text action that is **not one of the 3 suggested actions**, they get a DC reduction:

```typescript
const CREATIVITY_BONUS = {
  DIFFERENT_FROM_SUGGESTIONS: -2,    // DC reduced by 2 (easier)
  NOVEL_VERB_COMBO: -1,             // Additional -1 if verb+target never tried
  ABSURD_BUT_POSSIBLE: -3,          // Absurd actions get BIGGER bonus (reward boldness)
  // Note: absurd difficulty floor (23) still applies BEFORE this bonus
  // So: absurd action = DC 23, then -3 creativity = DC 20. Still hard, but possible.
} as const;
```

### 6.3 Detection Logic

```typescript
function isCreativeAction(
  parsedAction: ParsedAction,
  suggestions: SuggestedAction[],
): boolean {
  for (const suggestion of suggestions) {
    if (parsedAction.verb === suggestion.verb &&
        parsedAction.target === suggestion.target) {
      return false; // Matches a suggestion -- no bonus
    }
  }
  return true;
}
```

### 6.4 UI Feedback

```
> "j'utilise le cadavre comme bouclier"
  -> IMPROVISE_SHIELD avec [Cadavre] -- Creativite ! [DC -2]
  -> D20 + DEF(3) + LCK(+1) vs DC 11 (au lieu de 13)
```

The creativity label makes the bonus visible and rewarding, encouraging more free input.

---

## 7. Turn Economy & Stalker Clock

### 7.1 No Turn Cost

**Actions and movement are free.** No "action economy." The player explores, examines, moves, and interacts without penalty. This preserves the exploration/horror feel.

### 7.2 Pacing by Node Progression

Story pacing is driven by **node advancement**, not turn count. Beat zones (intro -> rising -> midpoint -> escalation -> climax) are tied to nodes, not turns.

### 7.3 The Stalker Clock (Hidden Idle Counter)

Prevents a player from staying indefinitely in one area without advancing:

```typescript
interface StalkerClock {
  actionsSinceLastProgression: number;
  warningIssued: boolean;
  threatArrivalIssued: boolean;
}

const STALKER_CLOCK = {
  WARNING_THRESHOLD:  { explorer: 20, survivor: 15, nightmare: 10 },
  THREAT_THRESHOLD:   { explorer: 30, survivor: 22, nightmare: 15 },
  KILL_THRESHOLD:     { explorer: 999, survivor: 35, nightmare: 20 },
  // Explorer: never reaches kill threshold
} as const;
```

**Thresholds:**
- **WARNING**: Atmospheric narration ("Les couloirs semblent plus sombres...") + threat director shifts one tier higher.
- **THREAT**: The main threat appears in the current location. Player must fight or flee.
- **KILL**: If still idle after threat arrival, instant attack each action.

```typescript
function checkStalkerClock(state: GameState): StalkerEvent | null {
  const clock = state.stalkerClock;
  const diff = state.difficulty.level;

  if (!clock.threatArrivalIssued &&
      clock.actionsSinceLastProgression >= STALKER_CLOCK.THREAT_THRESHOLD[diff]) {
    return { type: 'threat_arrival', spawnThreat: true };
  }

  if (!clock.warningIssued &&
      clock.actionsSinceLastProgression >= STALKER_CLOCK.WARNING_THRESHOLD[diff]) {
    return { type: 'warning', increaseTension: true };
  }

  return null;
}
```

The stalker clock **resets to 0** when the player enters a new scenario node.

### 7.4 Interaction with Threat Director

When the warning threshold is hit:
- `encounterChance` increases by +0.2
- `aggressiveness` increases by +2
- Narrative hints become more urgent

This creates organic tension without punishing exploration -- the player has 15-20 free actions before anything changes.

---

## 8. Ship Memory

### 8.1 Concept

Every failed action physically marks the environment. The world remembers what the player attempted. This creates progressive puzzle transformation rather than simple retry.

### 8.2 Data Structure

```typescript
interface EnvironmentMark {
  locationId: string;
  targetId: string;
  verb: string;
  outcome: 'failure' | 'critical_failure';
  mark: EnvironmentMarkEffect;
  turn: number;
}

interface EnvironmentMarkEffect {
  propertyAdded?: string[];      // e.g., ['damaged_frame']
  propertyRemoved?: string[];    // e.g., ['sealed']
  sameActionDCMod: number;       // e.g., -2 (easier to force a damaged door)
  otherActionDCMod: number;      // e.g., -1 (damage reveals new approach)
  noiseGenerated: boolean;       // Increases encounter chance
  newApproachRevealed?: string;  // e.g., "maintenance_port" now visible
  markDescription: LocaleString;
  revisitDescription: LocaleString;
}
```

### 8.3 Mark Catalog

| Failed Action | Target | Mark Created |
|--------------|--------|-------------|
| FORCE_OPEN (fail) | door | `damaged_frame`: -2 DC next force, +0.1 encounter chance |
| HACK (fail) | terminal | `alert_mode`: terminal locks, reveals physical `maintenance_port` (-2 DC OVERRIDE) |
| BREAK (fail) | window | `cracked_glass`: -3 DC next break, creaks loudly |
| STRIKE (fail) | NPC | `alerted`: NPC +2 dodge, other NPCs become `terrified` |
| REPAIR (fail) | machine | `exposed_wiring`: new component visible, ELECTRIFY possible |
| UNLOCK (fail) | lock | `jammed_pin`: -1 DC unlock, +3 DC FORCE_OPEN (jammed tighter) |
| CLIMB (fail) | surface | `worn_grips`: -1 DC climb (found handholds) |

### 8.4 Narrative Integration

Ship Memory marks are fed into the narrative composer. On revisit:
```
"Vous revenez dans le couloir medical. Les marques de vos coups
 deforment le cadre de la porte -- le metal est tordu, mais la
 serrure tient encore. Peut-etre qu'un dernier coup suffirait...
 Ou que ce nouveau port de maintenance pourrait servir."
```

---

## 9. Save System

### 9.1 Three Slots + Auto-save

```typescript
interface SaveSlot {
  id: 1 | 2 | 3;
  occupied: boolean;
  playerName: string;
  classId: string;
  scenarioId: string;
  progressPercent: number;  // 0-100, based on nodes completed
  difficulty: DifficultyLevel;
  timestamp: number;
  playTime: number;         // Seconds of play
  // Actual game state stored separately in IndexedDB
}

interface AutoSave {
  slotId: number;
  state: GameState;
  timestamp: number;
}
```

### 9.2 Auto-save Triggers

- Entering a new scenario node
- After combat resolution
- After item pickup/use
- Every 30 seconds of activity

### 9.3 Permadeath & Save Deletion

In permadeath modes (Survivor, Nightmare), the save is **deleted on death**. No save-scumming. The auto-save is overwritten with a "dead" state showing the game-over recap.

```typescript
function onPlayerDeath(slotId: number): void {
  const slot = loadSlot(slotId);
  slot.state = null;  // Game state deleted
  slot.deathRecap = generateDeathRecap(slot);
  slot.occupied = false; // Slot becomes available
  saveSlot(slotId, slot);
}
```

In Explorer mode, death doesn't delete the save (knockout mechanic).

### 9.4 Save UI

```
+-----------------------------------+
| Slot 1: Kira -- Marine            |
| "Epave Stellaire" -- 45%          |
| Survivant -- 23 min               |
| [Continuer]  [Supprimer]          |
+-----------------------------------+
| Slot 2: Vide                      |
| [Nouvelle partie]                 |
+-----------------------------------+
| Slot 3: Marcus -- Ingenieur       |
| "Ruines Alien" -- 12% -- MORT    |
| Cauchemar -- 8 min                |
| [Voir recap]  [Nouvelle partie]   |
+-----------------------------------+
```

### 9.5 Save Balance Constants

```typescript
SAVE: {
  SLOT_COUNT: 3,
  AUTO_SAVE_INTERVAL_MS: 30000,
  BLACK_BOX_MAX_ENTRIES: 20,
}
```

---

## 10. Black Box

### 10.1 Concept

After each game (win or lose), a journal entry is auto-generated. In subsequent games, the player can find a "black box" device containing the journal from their previous run -- turning past experiences into in-game lore.

### 10.2 Data Structure

```typescript
interface BlackBoxEntry {
  id: string;                // UUID
  timestamp: number;
  playerName: string;
  classId: string;
  scenarioId: string;
  settingId: string;
  difficulty: DifficultyLevel;
  outcome: 'victory' | 'death';
  turnsPlayed: number;
  causeOfDeath?: string;     // "xenomorph_attack", "asphyxiation", etc.
  journalEntry: LocaleString;
  keyEvents: {
    description: LocaleString;
    locationId: string;
    turn: number;
  }[];
  hints: {
    locationId: string;
    dangerType: string;
    description: LocaleString;
  }[];
}
```

### 10.3 Journal Generation

At game end, the engine generates a journal from templates:

```typescript
function generateBlackBoxJournal(history: GameHistory): LocaleString {
  // Template examples:
  // Death: "Entree #{n} -- {class} {name}. Arrive dans {setting},
  //         j'ai survecu {turns} cycles. {event_1}. {event_2}.
  //         {cause_of_death}. Mefiez-vous de {danger_hint}."
  // Victory: "Entree #{n} -- {class} {name}. J'ai reussi a m'echapper
  //           de {setting} apres {turns} cycles. {event_1}. {event_2}.
  //           Le point faible de {threat} est {hint}. Bonne chance."
}
```

### 10.4 In-Game Placement

In subsequent playthroughs, the engine places a "boite noire" object in an early-to-mid game side room:

```typescript
interface BlackBoxPlacement {
  scenarioMatch: boolean;       // Only placed if previous run same scenario
  placementBeat: 'rising';      // Early-mid game, side room
  item: {
    id: 'black_box_device',
    type: 'data',
    properties: ['tangible', 'small', 'electronic', 'readable', 'data_storage'],
  };
}
```

When the player READs or EXAMINEs the black box, the journal displays with distinctive visual treatment (different font, border).

### 10.5 Storage

IndexedDB, separate from save slots. Maximum **20 entries** kept (FIFO). Persists across all games.

---

## 11. Secret Verbs

### 11.1 Concept

Hidden verbs the parser recognizes but that **NEVER appear in suggestion buttons**. They reward curious, creative players and generate word-of-mouth.

### 11.2 Registry

```typescript
interface SecretVerb {
  id: string;
  aliases: { fr: string[]; en: string[] };
  stat: StatId;
  baseDC: number;
  effects: Record<string, SecretVerbEffect>;
  discoveryNarrative: LocaleString;
}

const SECRET_VERBS: SecretVerb[] = [
  {
    id: 'PRAY',
    aliases: { fr: ['prier', 'implorer les dieux', 'mediter'], en: ['pray', 'meditate'] },
    stat: 'CHA', baseDC: 15,
    effects: {
      'alien_ruins':    { type: 'activate_mechanism', stateChange: 'reveal_hidden_path' },
      'combat_any':     { type: 'stress_relief', removeCondition: 'terrified', healAmount: 2 },
      'default':        { type: 'luck_boost', tempStatBoost: { LCK: 1, duration: 5 } },
    },
  },
  {
    id: 'DANCE',
    aliases: { fr: ['danser', 'faire une danse'], en: ['dance', 'bust a move', 'groove'] },
    stat: 'AGI', baseDC: 12,
    effects: {
      'combat_robotic': { type: 'confuse_enemy', enemySkipTurn: true, enemyDodgeReduced: 0.2 },
      'npc_friendly':   { type: 'morale_boost', npcDispositionBoost: 1 },
      'default':        { type: 'stress_relief', removeCondition: 'terrified' },
    },
  },
  {
    id: 'NAME',
    aliases: { fr: ['nommer', 'baptiser', 'donner un nom'], en: ['name', 'christen'] },
    stat: 'CHA', baseDC: 5,
    effects: {
      'item':           { type: 'bond_with_item', narrativePersonalization: true },
      'npc_friendly':   { type: 'deepen_bond', npcLoyaltyBoost: 2 },
      'default':        { type: 'cosmetic' },
    },
  },
  {
    id: 'SING',
    aliases: { fr: ['chanter', 'fredonner', 'siffler'], en: ['sing', 'hum', 'whistle'] },
    stat: 'CHA', baseDC: 8,
    effects: {
      'npc_hostile_sentient': { type: 'confusion', enemySkipTurn: true },
      'dark_room':            { type: 'echo_location', revealHiddenFeature: true },
      'default':              { type: 'stress_relief', removeCondition: 'terrified',
                                tempStatBoost: { CHA: 1, duration: 3 } },
    },
  },
  {
    id: 'APOLOGIZE',
    aliases: { fr: ['s\'excuser', 'pardon', 'desole'], en: ['apologize', 'say sorry'] },
    stat: 'CHA', baseDC: 10,
    effects: {
      'npc_hostile_sentient': { type: 'de_escalate', npcDispositionChange: 'hostile_to_neutral' },
      'npc_wounded':          { type: 'comfort', npcDispositionChange: 'neutral_to_friendly' },
      'default':              { type: 'cosmetic' },
    },
  },
  {
    id: 'SACRIFICE',
    aliases: { fr: ['sacrifier', 'se sacrifier', 'offrir'], en: ['sacrifice', 'offer'] },
    stat: 'ATK', baseDC: 14,
    effects: {
      'combat_any':     { type: 'distraction', targetItem: true,
                          effect: 'NPC skips 2 turns while investigating sacrificed item' },
      'alien_ruins':    { type: 'activate_mechanism', stateChange: 'appease_guardian',
                          effect: 'Alien mechanism accepts offering, grants passage' },
      'npc_friendly':   { type: 'inspire', effect: 'NPC gains courage, follows player' },
      'default':        { type: 'item_loss', effect: 'Item destroyed for no benefit' },
    },
  },
];
```

### 11.3 First-Use Reward

First time a player uses a secret verb in a game session:
```
SECRET VERB DISCOVERED : PRAY
"Vous joignez les mains dans le silence du vaisseau..."
```

This badge is stored in the Black Box system for future run references.

### 11.4 Parser Integration

Secret verbs are in the parser's verb registry with `secret: true`. The suggestion engine explicitly filters them out:

```typescript
function generateSuggestions(state: GameState): SuggestedAction[] {
  const allPossible = getAllPossibleActions(state);
  return allPossible
    .filter(a => !a.verb.secret)  // Never suggest secret verbs
    .sort(byRelevance)
    .slice(0, 3);
}
```

---

## 12. Difficulty Presets

### 12.1 Three Presets

```typescript
type DifficultyLevel = 'explorer' | 'survivor' | 'nightmare';

interface DifficultySettings {
  name: LocaleString;
  description: LocaleString;
  dcModifier: number;
  hpMultiplier: number;
  failsafeThreshold: number;
  failsafeEnabled: boolean;
  failsafeCost: number;             // HP cost of degraded bypass
  threatEncounterMultiplier: number;
  threatDamageMultiplier: number;
  healingItemFrequency: number;     // 0.0 to 1.0
  permadeath: boolean;
  secondChanceEnabled: boolean;
}

const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultySettings> = {
  explorer: {
    name: { fr: 'Explorateur', en: 'Explorer' },
    description: { fr: 'Pour profiter de l\'histoire.', en: 'For the story.' },
    dcModifier: -2,
    hpMultiplier: 1.5,
    failsafeThreshold: 2,
    failsafeEnabled: true,
    failsafeCost: 1,
    threatEncounterMultiplier: 0.5,
    threatDamageMultiplier: 0.5,
    healingItemFrequency: 0.8,
    permadeath: false,             // Knockout mechanic instead
    secondChanceEnabled: true,
  },
  survivor: {
    name: { fr: 'Survivant', en: 'Survivor' },
    description: { fr: 'L\'experience classique.', en: 'The intended experience.' },
    dcModifier: 0,
    hpMultiplier: 1.0,
    failsafeThreshold: 4,
    failsafeEnabled: true,
    failsafeCost: 3,
    threatEncounterMultiplier: 1.0,
    threatDamageMultiplier: 1.0,
    healingItemFrequency: 0.4,
    permadeath: true,
    secondChanceEnabled: true,     // One free bailout per game
  },
  nightmare: {
    name: { fr: 'Cauchemar', en: 'Nightmare' },
    description: { fr: 'Pour les masochistes.', en: 'For masochists.' },
    dcModifier: +2,
    hpMultiplier: 0.75,
    failsafeThreshold: 6,
    failsafeEnabled: false,        // NO FAILSAFE
    failsafeCost: 5,
    threatEncounterMultiplier: 1.5,
    threatDamageMultiplier: 1.5,
    healingItemFrequency: 0.2,
    permadeath: true,
    secondChanceEnabled: false,    // No safety net
  },
};
```

### 12.2 How Death Works

```typescript
function checkDeath(state: GameState): DeathResult | null {
  if (state.player.hp <= 0) {
    const diff = state.difficulty;

    if (!diff.permadeath) {
      // EXPLORER: knocked out, skip obstacle
      return { type: 'knockout', hpRestored: 1, consequence: 'skip_current_obstacle' };
    }

    if (diff.secondChanceEnabled && !state.secondChanceUsed) {
      // SURVIVOR first death: dramatic rescue
      return {
        type: 'second_chance',
        hpRestored: Math.floor(state.player.maxHp * 0.25),
        consequence: 'mark_second_chance_used',
      };
    }

    // TRUE DEATH: game over
    return { type: 'permadeath', consequence: 'game_over' };
  }
  return null;
}
```

### 12.3 Nightmare Softlock Escape

In Nightmare, after 5+ failures on the same obstacle (since failsafe is disabled):

```
Turn 6: WARNING -- threat director spawns threat ONE ROOM AWAY.
        Player still has freedom to act.

Turn 7: ARRIVAL -- threat enters player's room. Combat begins.
        Player has full combat options:
        - Fight (can win if skilled/prepared)
        - Flee (RUN, with fleeDC + 3 because cornered)
        - Creative solution (HIDE, BARRICADE, IGNITE, etc.)
        - Sacrifice item as distraction (THROW + LURE)

Turn 8+: If player still in room AND unresolved,
         threat attacks every turn. Player CAN still flee.
         Flee is ALWAYS possible, even if DC is high.
```

**The player is never killed without at least 2 turns of combat options, including fleeing.**

```typescript
const CORNERED_FLEE_DC = 16; // Hard but not impossible
// AGI 4 + LCK 1: need D20 roll of 11+ (55% success)
// AGI 2 + LCK 0: need D20 roll of 14+ (35% success)
```

---

## 13. Turn Execution Order

Every player action follows this exact sequence:

```
1. PLAYER INPUT
   -> Parser converts free text to ParsedAction (verb + target + tool)

2. CREATIVITY CHECK
   -> Is action different from suggestions? Apply creativity bonus to DC

3. CONDITION TICK
   -> Apply condition effects (HP drain for poisoned, timer decrement for terrified)

4. OXYGEN TICK
   -> Apply O2 drain based on current zone atmosphere
   -> If O2 = 0: apply HP drain

5. ACTION RESOLUTION
   -> Roll D20 + primary_stat + floor(LCK/2) vs difficulty
   -> Apply difficulty modifier from DifficultySettings
   -> Check item breakage on critical failure
   -> Calculate combat damage if applicable

6. CONSEQUENCE APPLICATION
   -> Update game state (HP, inventory, environment, Ship Memory marks)
   -> Check condition triggers (wounded, terrified, etc.)
   -> Check death

7. NPC REACTION (if hostile NPC present)
   -> NPC attacks, flees, or acts per aggressionPattern
   -> Apply NPC damage to player
   -> Check death again

8. STALKER CLOCK CHECK
   -> Increment actionsSinceLastProgression
   -> Check warning/threat/kill thresholds
   -> If threshold hit: modify threat director state

9. THREAT DIRECTOR CHECK
   -> Based on current beat zone + stalker state
   -> Roll for random encounter if applicable

10. NARRATIVE COMPOSITION
    -> 7-layer composition (see SCENARIO_DESIGN.md SS7)
    -> Action + Sensory + Consequence + Atmosphere + Player state + Threat hint + NPC reaction
    -> Anti-repetition buffer applied
    -> Final output to player
```

This order ensures that conditions and O2 tick before the action (so the player feels their effects immediately), combat damage is calculated after the action, and narrative is composed last with full context.

---

> *"Dans le vide, personne ne vous entend lancer un D20."*
> -- Void Walker tagline
