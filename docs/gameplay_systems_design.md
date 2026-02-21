# Void Walker — Gameplay Systems Design

> **Amendement majeur.** Ce document complète le ROADMAP, l'Action Parser Design,
> les Structural Design Decisions et les Design Refinements.
> Il définit tous les systèmes de gameplay manquants.
> Last updated: 2026-02-21 | Status: **PRE-DEVELOPMENT**

---

## Table of Contents

1. [Character Creation System](#1-character-creation-system)
2. [Combat System](#2-combat-system)
3. [Turn Economy & Pacing](#3-turn-economy--pacing)
4. [Status Conditions](#4-status-conditions)
5. [Oxygen System](#5-oxygen-system)
6. [Item Durability](#6-item-durability)
7. [Free Input Creativity Bonus](#7-free-input-creativity-bonus)
8. [Save System](#8-save-system)
9. [French Parser — Lemmatization Strategy](#9-french-parser--lemmatization-strategy)
10. [Nightmare Softlock Escape](#10-nightmare-softlock-escape)
11. [Feature: Ship Memory (Mémoire du Vaisseau)](#11-feature-ship-memory-mémoire-du-vaisseau)
12. [Feature: Black Box (La Boîte Noire)](#12-feature-black-box-la-boîte-noire)
13. [Feature: Secret Verbs (Verbes Secrets)](#13-feature-secret-verbs-verbes-secrets)
14. [Amendments to Existing Documents](#14-amendments-to-existing-documents)

---

## 1. Character Creation System

### 1.1 Six Stats

The old 3-stat system (FOR/INT/CHA) is replaced by 6 stats.
Every stat has a range of **0 to 5** (0 = terrible, 3 = average, 5 = exceptional).

| Stat ID | FR Name | EN Name | Abbr | Governs |
|---------|---------|---------|------|---------|
| `ATK` | Force / Attaque | Strength / Attack | FOR | Melee damage, physical force (STRIKE, PUSH, PULL, BREAK, FORCE_OPEN, LIFT, BEND, BITE, SQUEEZE) |
| `DEF` | Défense | Defense | DEF | Damage reduction, blocking (BLOCK, IMPROVISE_SHIELD, BARRICADE). Reduces incoming damage. |
| `INT` | Intelligence | Intelligence | INT | Technical actions (HACK, REPAIR, REPROGRAM, DISASSEMBLE, SABOTAGE, SCAN, OVERRIDE, WELD, SET_TRAP, PLUG). Puzzle-solving. |
| `CHA` | Charisme | Charisma | CHA | Social actions (PERSUADE, INTIMIDATE, DECEIVE, CALM, COMMAND, SEDUCE, BARTER, INTERROGATE, PLEAD, PROVOKE, LURE). |
| `AGI` | Agilité | Agility | AGI | Speed, evasion (DODGE, RUN, HIDE, CLIMB, JUMP, SWIM, THROW). Initiative in combat. Stealth. |
| `LCK` | Chance | Luck | LCK | Passive bonus: +LCK/2 (rounded down) added to ALL rolls. Also affects loot quality, critical hit/failure thresholds, and random event outcomes. |

### 1.2 How Stats Affect Rolls

The existing D20 system is amended:

```
OLD:  D20 + stat_value  vs  difficulty
NEW:  D20 + primary_stat + floor(LCK / 2)  vs  difficulty
```

Luck is always added as a passive bonus. A player with LCK 4 gets +2 on every roll.
A player with LCK 1 gets +0. LCK 5 gets +2.

This makes LCK a tempting "generalist" stat — it helps everything,
but never as much as the primary stat for a specific action.

### 1.3 Verb-to-Stat Remapping

With 6 stats, verbs are reassigned. Key changes from the old system:

| Old Stat | Verb | New Stat | Rationale |
|----------|------|----------|-----------|
| FOR | DODGE | **AGI** | Dodging is agility, not strength |
| FOR | RUN | **AGI** | Running/fleeing is agility |
| FOR | HIDE | **AGI** | Stealth is agility |
| FOR | CLIMB | **AGI** | Climbing is agility (with FOR override if heavy obstacle) |
| FOR | JUMP | **AGI** | Jumping is agility |
| FOR | SWIM | **AGI** | Swimming is agility |
| FOR | THROW | **AGI** | Throwing accuracy is agility (damage still uses ATK) |
| FOR | BLOCK | **DEF** | Blocking is defense |
| — | IMPROVISE_SHIELD | **DEF** | Shield use is defense |
| — | BARRICADE | **DEF** | Barricading is defense |

Complete remapped verb table:

```typescript
type StatId = 'ATK' | 'DEF' | 'INT' | 'CHA' | 'AGI' | 'LCK';

const VERB_STATS: Record<string, StatId> = {
  // ATK — raw physical force and melee combat
  STRIKE: 'ATK',
  PUSH: 'ATK',
  PULL: 'ATK',
  LIFT: 'ATK',
  KICK: 'ATK',
  BREAK: 'ATK',
  BEND: 'ATK',
  CUT: 'ATK',
  FORCE_OPEN: 'ATK',
  BITE: 'ATK',
  SQUEEZE: 'ATK',
  IMPROVISE_WEAPON: 'ATK',

  // DEF — blocking, shielding, fortifying
  BLOCK: 'DEF',
  IMPROVISE_SHIELD: 'DEF',
  BARRICADE: 'DEF',

  // INT — technical, knowledge, precision
  EXAMINE: 'INT',
  READ: 'INT',
  HACK: 'INT',
  REPAIR: 'INT',
  DISASSEMBLE: 'INT',
  ASSEMBLE: 'INT',
  ACTIVATE: 'INT',
  DEACTIVATE: 'INT',
  REPROGRAM: 'INT',
  LOCK: 'INT',
  UNLOCK: 'INT',
  WELD: 'INT',
  PLUG: 'INT',
  SCAN: 'INT',
  OVERRIDE: 'INT',
  SABOTAGE: 'INT',
  SET_TRAP: 'INT',
  IMPROVISE_TOOL: 'INT',
  WEDGE: 'INT',
  IGNITE: 'INT',
  FLOOD: 'INT',
  ELECTRIFY: 'INT',
  TIE: 'INT',
  COVER: 'INT',
  LISTEN: 'INT',
  SMELL: 'INT',

  // CHA — social, persuasion, deception
  TALK: 'CHA',
  PERSUADE: 'CHA',
  INTIMIDATE: 'CHA',
  DECEIVE: 'CHA',
  DISTRACT: 'CHA',
  BARTER: 'CHA',
  SEDUCE: 'CHA',
  COMMAND: 'CHA',
  CALM: 'CHA',
  PROVOKE: 'CHA',
  PLEAD: 'CHA',
  INTERROGATE: 'CHA',
  SIGNAL: 'CHA',
  LURE: 'CHA',

  // AGI — speed, evasion, stealth, accuracy
  THROW: 'AGI',
  CLIMB: 'AGI',
  JUMP: 'AGI',
  DODGE: 'AGI',
  SWIM: 'AGI',
  RUN: 'AGI',
  HIDE: 'AGI',
  STACK: 'AGI', // Balance and precision
};
```

### 1.4 Three Classes

The player picks one of three classes. Each class has a **fixed stat distribution** (total: 15 points across 6 stats) plus a **starting kit** of items.

```typescript
interface PlayerClass {
  id: string;
  name: LocaleString;
  description: LocaleString;
  flavor: LocaleString;        // One-line "who you are"
  stats: Record<StatId, number>;
  startingHp: number;
  startingItems: string[];     // Item IDs
  passiveAbility: PassiveAbility;
}

const CLASSES: Record<string, PlayerClass> = {

  marine: {
    id: 'marine',
    name: { fr: 'Marine', en: 'Marine' },
    description: {
      fr: 'Soldat d\'élite. Fort en combat, fiable sous le feu. Pas très subtil.',
      en: 'Elite soldier. Strong in combat, reliable under fire. Not very subtle.',
    },
    flavor: {
      fr: '« Mon arme est mon meilleur ami. Mon deuxième meilleur ami, c\'est mon poing. »',
      en: '"My weapon is my best friend. My second best friend is my fist."',
    },
    //         ATK  DEF  INT  CHA  AGI  LCK
    stats: { ATK: 4, DEF: 3, INT: 1, CHA: 1, AGI: 4, LCK: 2 },
    // Total: 15
    startingHp: 14,
    startingItems: ['pistolet_laser', 'couteau', 'ration', 'lampe_torche'],
    passiveAbility: {
      id: 'combat_instinct',
      name: { fr: 'Instinct de combat', en: 'Combat Instinct' },
      effect: 'COMBAT_DAMAGE_BONUS',  // +1 damage on all combat hits
      value: 1,
    },
  },

  engineer: {
    id: 'engineer',
    name: { fr: 'Ingénieur', en: 'Engineer' },
    description: {
      fr: 'Technicien de génie. Répare, pirate, improvise. Fragile en combat.',
      en: 'Brilliant technician. Repairs, hacks, improvises. Fragile in combat.',
    },
    flavor: {
      fr: '« Donnez-moi du ruban adhésif et un câble, je vous fais un réacteur. »',
      en: '"Give me duct tape and a cable, I\'ll build you a reactor."',
    },
    //         ATK  DEF  INT  CHA  AGI  LCK
    stats: { ATK: 1, DEF: 2, INT: 5, CHA: 2, AGI: 2, LCK: 3 },
    // Total: 15
    startingHp: 10,
    startingItems: ['multitool', 'scanner', 'ruban_adhesif', 'cable', 'datapad'],
    passiveAbility: {
      id: 'jury_rig',
      name: { fr: 'Bricoleur né', en: 'Jury-Rig' },
      effect: 'REPAIR_BROKEN_ITEMS', // Can attempt REPAIR on broken items (others can't)
      value: null,
    },
  },

  medic: {
    id: 'medic',
    name: { fr: 'Médecin', en: 'Medic' },
    description: {
      fr: 'Officier médical. Soigne, calme, négocie. Équilibré mais sans spécialité.',
      en: 'Medical officer. Heals, calms, negotiates. Balanced but no specialty.',
    },
    flavor: {
      fr: '« Je suis là pour soigner. Mais j\'ai aussi appris où frapper pour que ça fasse mal. »',
      en: '"I\'m here to heal. But I also learned where to hit so it hurts."',
    },
    //         ATK  DEF  INT  CHA  AGI  LCK
    stats: { ATK: 2, DEF: 2, INT: 3, CHA: 4, AGI: 2, LCK: 2 },
    // Total: 15
    startingHp: 12,
    startingItems: ['trousse_medicale', 'stimulant', 'lampe_torche', 'ration'],
    passiveAbility: {
      id: 'field_medic',
      name: { fr: 'Médecin de terrain', en: 'Field Medic' },
      effect: 'HEALING_BONUS',        // Healing items restore +2 HP
      value: 2,
    },
  },
};
```

### 1.5 Two Bonus Points

After choosing a class, the player distributes **2 bonus points** freely among any stats, with one constraint: **no stat can exceed 5**.

This allows light customization without overwhelming the player.
A Marine can put both points in INT to become a "thinking soldier", or double down on ATK to hit harder.

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

### 1.6 Player Name

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
     │
     ▼
CLASS SELECTION ──────────────────────────────────
│  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ MARINE  │  │INGÉNIEUR│  │ MÉDECIN │       │
│  │         │  │         │  │         │       │
│  │ FOR ████│  │ FOR █   │  │ FOR ██  │       │
│  │ DEF ███ │  │ DEF ██  │  │ DEF ██  │       │
│  │ INT █   │  │ INT █████│  │ INT ███ │       │
│  │ CHA █   │  │ CHA ██  │  │ CHA ████│       │
│  │ AGI ████│  │ AGI ██  │  │ AGI ██  │       │
│  │ LCK ██  │  │ LCK ███ │  │ LCK ██  │       │
│  │         │  │         │  │         │       │
│  │ HP: 14  │  │ HP: 10  │  │ HP: 12  │       │
│  └─────────┘  └─────────┘  └─────────┘       │
─────────────────────────────────────────────────
     │
     ▼
BONUS POINT ALLOCATION (2 points)
│  "Distribuez 2 points bonus"
│  FOR [4] [+]    ← grayed out if already 5
│  DEF [3] [+]
│  INT [1] [+]
│  CHA [1] [+]
│  AGI [4] [+]
│  LCK [2] [+]
│  [Points restants: 2]
│  [Confirmer]
─────────────────────────────────────────────────
     │
     ▼
NAME ENTRY
│  "Votre nom, survivant ?"
│  [________________]  [Nom aléatoire 🎲]
│  [Commencer l'aventure]
─────────────────────────────────────────────────
     │
     ▼
DIFFICULTY SELECTION (Explorer / Survivor / Nightmare)
     │
     ▼
GAME START
```

### 1.8 Display in StatusBar

The status bar shows the 6 stats compactly:

```
 ❤ 12/14  |  🫁 100%  |  FOR 4  DEF 3  INT 1  CHA 1  AGI 4  LCK 2
```

When a stat is relevant to the current action, it highlights:

```
> Pirater le terminal  [INT +5] [LCK +1] → Difficulté 14
```

---

## 2. Combat System

### 2.1 Design Philosophy

Combat uses the **same verb-based action system** as everything else.
There is no separate "combat mode" — the player still types (or selects)
actions freely. The difference is that a **hostile NPC is present** and
**reacts after the player's action**.

This preserves creative agency: the player can STRIKE, but also
DECEIVE, HIDE, THROW an object, HACK the robot, IGNITE something,
or attempt any creative approach.

### 2.2 NPC Combat Stats

```typescript
interface NPCCombatStats {
  maxHp: number;
  hp: number;
  attack: number;           // Damage dealt on hit (base)
  defense: number;          // Flat damage reduction
  dodgeChance: number;      // 0.0 to 0.5 — chance to fully avoid player's attack
  initiative: number;       // Determines NPC reaction speed (for narrative flavor)

  // Weak point system
  weakPoint: WeakPoint;

  // Behavior
  aggressionPattern: AggressionPattern;

  // Flee difficulty
  fleeDC: number;           // DC for the player to successfully RUN
}

interface WeakPoint {
  id: string;
  name: LocaleString;       // e.g., "module de refroidissement exposé"
  discoverMethod: 'examine' | 'scan' | 'combat_hint' | 'lore';
  discovered: boolean;      // Starts false, set true when player discovers it
  targetVerbs: string[];    // Verbs that exploit it: ['STRIKE', 'SABOTAGE', 'SHOOT']
  targetProperties: string[]; // What the weak point "is": ['electronic', 'fragile', 'exposed']
  damageMultiplier: number; // 2.0 to 3.0 — damage multiplied when hit
  narrativeHint: LocaleString; // Hint shown during combat: "Son blindage semble plus fin au niveau des joints..."
  exploitNarrative: LocaleString; // "Vous frappez le module de refroidissement ! Des étincelles jaillissent !"
}

type AggressionPattern =
  | 'aggressive'   // Attacks every turn
  | 'defensive'    // Attacks only if attacked first, otherwise patrols
  | 'ambush'       // High first-strike damage, then weaker
  | 'retreating'   // Flees at low HP
  | 'berserk';     // Gets stronger as HP drops
```

### 2.3 Combat Turn Flow

Combat is **not** a separate game mode. It's the normal turn loop with an
NPC that reacts. The flow:

```
PLAYER ACTION (any verb)
     │
     ▼
ENGINE RESOLVES ACTION (normal pipeline)
     │
     ├─ If action targets the NPC → damage calculation
     ├─ If action targets environment → normal consequences
     └─ If action is non-combat (HIDE, RUN, HACK) → resolve normally
     │
     ▼
NPC REACTION PHASE
     │
     ├─ If NPC is alive AND aggressive → NPC attacks
     ├─ If NPC is stunned/distracted → NPC skips turn
     ├─ If NPC is dead → combat ends
     └─ If player fled successfully → combat ends
     │
     ▼
NARRATIVE OUTPUT (action result + NPC reaction combined)
```

### 2.4 Player Attacks NPC — Damage Calculation

```typescript
interface CombatResult {
  playerHit: boolean;
  damageDealt: number;
  npcDodged: boolean;
  weakPointHit: boolean;
  npcKilled: boolean;
  narrative: string;
}

function resolvePlayerAttack(
  player: PlayerState,
  npc: NPCState,
  verb: string,
  weapon: ItemDefinition | null,
  rollResult: RollResult,       // Already resolved by the dice system
): CombatResult {

  // Step 1: Did the player hit? (from existing roll system)
  if (!rollResult.success) {
    return { playerHit: false, damageDealt: 0, npcDodged: false,
             weakPointHit: false, npcKilled: false, narrative: '' };
  }

  // Step 2: NPC dodge check
  if (Math.random() < npc.combat.dodgeChance) {
    return { playerHit: false, damageDealt: 0, npcDodged: true,
             weakPointHit: false, npcKilled: false, narrative: '' };
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
  damage = Math.max(1, damage - npc.combat.defense); // Always at least 1 damage

  // Step 6: Critical hit bonus (nat 20)
  if (rollResult.natural === 20) {
    damage = Math.floor(damage * 1.5);
  }

  // Step 7: Apply passive abilities
  if (player.passiveAbility.effect === 'COMBAT_DAMAGE_BONUS') {
    damage += player.passiveAbility.value;
  }

  // Step 8: Apply damage
  const npcKilled = (npc.combat.hp - damage) <= 0;

  return { playerHit: true, damageDealt: damage, npcDodged: false,
           weakPointHit, npcKilled, narrative: '' };
}

function calculateBaseDamage(
  player: PlayerState,
  weapon: ItemDefinition | null,
  verb: string,
): number {
  // Unarmed base: ATK value (1-5 damage)
  let base = player.stats.ATK;

  // Weapon bonus
  if (weapon) {
    base += weapon.damageBonus ?? 0;
    // Improvised weapons: half ATK bonus, rounded up
    if (verb === 'IMPROVISE_WEAPON') {
      base = Math.ceil(base * 0.75);
    }
  }

  // Minimum 1 damage before defense
  return Math.max(1, base);
}
```

### 2.5 Weapon Damage Values

Items get a new optional field:

```typescript
interface ItemDefinition {
  // ...existing fields...
  damageBonus?: number;      // Added to ATK for damage. Undefined = 0 (not a weapon)
}

// Examples:
// pistolet_laser:    damageBonus: 4
// couteau:           damageBonus: 2
// barre_metal:       damageBonus: 3
// debris (improvised): damageBonus: 1
// multitool:         damageBonus: 1
// unarmed:           damageBonus: 0 (just ATK stat)
```

### 2.6 NPC Attacks Player

```typescript
function resolveNPCAttack(
  npc: NPCState,
  player: PlayerState,
): NPCAttackResult {
  // NPC "to-hit" roll: D20 + npc.attack vs 10 + player.AGI + player.DEF + floor(player.LCK/2)
  const npcRoll = rollD20();
  const playerDefenseScore = 10 + player.stats.AGI + player.stats.DEF + Math.floor(player.stats.LCK / 2);

  // Player dodge: if player has AGI >= 3, they have a passive dodge chance
  // This is separate from the active DODGE verb (which the player can choose)
  const passiveDodgeChance = player.stats.AGI >= 3 ? 0.1 : 0;

  if (npcRoll + npc.combat.attack < playerDefenseScore) {
    return { hit: false, damage: 0, narrative: '' }; // NPC missed
  }

  if (Math.random() < passiveDodgeChance) {
    return { hit: false, damage: 0, dodged: true, narrative: '' };
  }

  // Damage = NPC attack - player DEF (min 1)
  let damage = Math.max(1, npc.combat.attack - player.stats.DEF);

  // Equipment armor reduces further
  if (player.equippedArmor) {
    damage = Math.max(1, damage - player.equippedArmor.armorValue);
  }

  // Apply difficulty multiplier
  damage = Math.floor(damage * player.difficulty.threatDamageMultiplier);

  return { hit: true, damage, narrative: '' };
}
```

### 2.7 Weak Point Discovery

Players discover weak points through multiple paths:

```typescript
function checkWeakPointDiscovery(
  verb: string,
  npc: NPCState,
  rollResult: RollResult,
): boolean {
  const wp = npc.combat.weakPoint;
  if (wp.discovered) return false; // Already known

  switch (wp.discoverMethod) {
    case 'examine':
      // EXAMINE or SCAN the NPC → auto-discover on success
      if ((verb === 'EXAMINE' || verb === 'SCAN') && rollResult.success) {
        return true;
      }
      break;

    case 'scan':
      // Only SCAN (needs scanner tool) → discover
      if (verb === 'SCAN' && rollResult.success) return true;
      break;

    case 'combat_hint':
      // After 2+ rounds of combat, the narrative drops a hint.
      // After 3+ rounds, auto-discover.
      if (npc.combatRoundsElapsed >= 3) return true;
      break;

    case 'lore':
      // Discovered by reading a specific datapad/terminal elsewhere
      // This is set by scenario events, not combat
      break;
  }
  return false;
}
```

During combat, even before discovery, the narrative drops hints:

```
Round 1: "La créature vous charge. Son blindage semble impénétrable."
Round 2: "Vous remarquez que les plaques sur son flanc gauche bougent
          différemment — une jointure, peut-être ?"
Round 3: "C'est là ! Le module de refroidissement est exposé entre
          les plaques. [Point faible découvert : Module de refroidissement]"
```

UI display when weak point is discovered:

```
⚠ POINT FAIBLE : Module de refroidissement [FRAPPER / SABOTER / TIRER]
```

### 2.8 Fleeing Combat

The player can attempt to flee at any time using RUN/FLEE:

```typescript
function attemptFlee(
  player: PlayerState,
  npc: NPCState,
): FleeResult {
  // Roll: D20 + AGI + floor(LCK/2) vs NPC.fleeDC
  const roll = rollD20();
  const total = roll + player.stats.AGI + Math.floor(player.stats.LCK / 2);
  const success = total >= npc.combat.fleeDC;

  if (success) {
    // Player escapes to the connected room they came from
    return {
      success: true,
      destination: player.previousLocation,
      // NPC remains in its location
      // NPC does NOT get a parting attack (horror = giving the player relief)
      narrative: '', // "Vous sprintez vers la sortie..."
    };
  } else {
    // Failed flee: NPC gets a free attack, but player can try again next turn
    return {
      success: false,
      npcFreeAttack: true,
      narrative: '', // "Vous tentez de fuir mais la créature vous bloque..."
    };
  }
}
```

### 2.9 NPC Examples

```typescript
const NPC_TEMPLATES: Record<string, NPCCombatStats> = {

  security_robot: {
    maxHp: 15, hp: 15,
    attack: 4, defense: 3, dodgeChance: 0.1, initiative: 5,
    fleeDC: 10,
    aggressionPattern: 'aggressive',
    weakPoint: {
      id: 'cooling_module',
      name: { fr: 'Module de refroidissement', en: 'Cooling module' },
      discoverMethod: 'examine',
      discovered: false,
      targetVerbs: ['STRIKE', 'SABOTAGE', 'BREAK'],
      targetProperties: ['electronic', 'fragile', 'exposed'],
      damageMultiplier: 2.5,
      narrativeHint: { fr: 'Son blindage semble plus fin au niveau des joints latéraux...', en: '...' },
      exploitNarrative: { fr: 'Vous frappez le module de refroidissement ! Des étincelles jaillissent !', en: '...' },
    },
  },

  xenomorph: {
    maxHp: 25, hp: 25,
    attack: 7, defense: 2, dodgeChance: 0.3, initiative: 8,
    fleeDC: 14,
    aggressionPattern: 'aggressive',
    weakPoint: {
      id: 'acid_sac',
      name: { fr: 'Poche d\'acide interne', en: 'Internal acid sac' },
      discoverMethod: 'combat_hint',
      discovered: false,
      targetVerbs: ['CUT', 'STRIKE', 'THROW'],
      targetProperties: ['organic', 'soft', 'exposed'],
      damageMultiplier: 3.0,
      narrativeHint: { fr: 'La membrane de son abdomen pulse d\'un liquide verdâtre...', en: '...' },
      exploitNarrative: { fr: 'La poche éclate ! L\'acide corrode la créature de l\'intérieur !', en: '...' },
    },
  },

  wounded_android: {
    maxHp: 8, hp: 5,
    attack: 2, defense: 1, dodgeChance: 0.0, initiative: 2,
    fleeDC: 6,
    aggressionPattern: 'defensive', // Only attacks if provoked
    weakPoint: {
      id: 'exposed_wiring',
      name: { fr: 'Câblage exposé', en: 'Exposed wiring' },
      discoverMethod: 'examine',
      discovered: false,
      targetVerbs: ['HACK', 'OVERRIDE', 'ELECTRIFY'],
      targetProperties: ['electronic', 'conductive'],
      damageMultiplier: 2.0,
      narrativeHint: { fr: 'Des câbles pendent de son bras endommagé...', en: '...' },
      exploitNarrative: { fr: 'Vous court-circuitez son système nerveux central !', en: '...' },
    },
  },

  parasitized_crewmember: {
    maxHp: 12, hp: 12,
    attack: 5, defense: 1, dodgeChance: 0.15, initiative: 6,
    fleeDC: 11,
    aggressionPattern: 'berserk', // Gets stronger as HP drops
    weakPoint: {
      id: 'parasite_node',
      name: { fr: 'Nœud parasitaire', en: 'Parasitic node' },
      discoverMethod: 'scan',
      discovered: false,
      targetVerbs: ['CUT', 'STRIKE'],
      targetProperties: ['organic', 'small', 'exposed'],
      damageMultiplier: 2.5,
      narrativeHint: { fr: 'Sous sa peau, quelque chose pulse de manière non humaine...', en: '...' },
      exploitNarrative: { fr: 'Le parasite se détache en hurlant ! Le corps s\'effondre, libéré.', en: '...' },
    },
  },
};
```

### 2.10 Balancing Knobs

All combat values are centralized for easy tuning:

```typescript
const COMBAT_BALANCE = {
  // Player
  UNARMED_BASE_DAMAGE: 1,           // Before ATK stat
  IMPROVISED_WEAPON_MULTIPLIER: 0.75,
  CRITICAL_HIT_MULTIPLIER: 1.5,
  PASSIVE_DODGE_AGI_THRESHOLD: 3,
  PASSIVE_DODGE_CHANCE: 0.1,

  // NPC
  NPC_HIT_BASE_DC: 10,              // NPC needs D20 + atk >= 10 + player.AGI + player.DEF + LCK bonus
  BERSERK_ATK_BONUS_PER_QUARTER: 1, // +1 atk per 25% HP lost for berserk NPCs
  WEAK_POINT_HINT_ROUND: 2,         // Narrative hint at round N
  WEAK_POINT_AUTO_DISCOVER_ROUND: 3, // Auto-discover at round N

  // Environmental kills
  ENVIRONMENTAL_KILL_MULTIPLIER: 10, // Depressurization, fire, etc. → instant kill
} as const;
```

---

## 3. Turn Economy & Pacing

### 3.1 No Turn Cost

**Actions and movement are free.** The player can explore, examine, move,
and interact without any "action economy" penalty. This preserves the
exploration/horror feel — the player should feel free to wander and
investigate without meta-gaming "is this worth a turn?"

### 3.2 Pacing by Node Progression

Story pacing is driven by **node advancement**, not turn count. The player
progresses through the scenario by resolving obstacles, not by spending
turns. Beat zones (intro → rising → midpoint → escalation → climax)
are tied to nodes, not turns.

### 3.3 Hidden Idle Counter (The Stalker Clock)

To prevent a player from staying indefinitely in one area without
advancing, a hidden counter tracks **actions since last node progression**:

```typescript
interface StalkerClock {
  actionsSinceLastProgression: number;
  warningIssued: boolean;
  threatArrivalIssued: boolean;
}

const STALKER_CLOCK = {
  // Thresholds (scaled by difficulty)
  WARNING_THRESHOLD: { explorer: 20, survivor: 15, nightmare: 10 },
  THREAT_THRESHOLD:  { explorer: 30, survivor: 22, nightmare: 15 },
  KILL_THRESHOLD:    { explorer: 999, survivor: 35, nightmare: 20 }, // Explorer: never

  // What happens at each threshold:
  //   WARNING:  atmospheric narration ("Les couloirs semblent plus sombres...")
  //             + threat director shifts to one tier higher
  //   THREAT:   the main threat appears in the current location
  //             player must fight or flee
  //   KILL:     if STILL idle after threat arrival, instant attack each action
} as const;

function checkStalkerClock(state: GameState): StalkerEvent | null {
  const clock = state.stalkerClock;
  const thresholds = STALKER_CLOCK;
  const diff = state.difficulty.level;

  if (!clock.threatArrivalIssued &&
      clock.actionsSinceLastProgression >= thresholds.THREAT_THRESHOLD[diff]) {
    return {
      type: 'threat_arrival',
      narrative: t('stalker.arrival'), // "Des bruits de pas lourds résonnent..."
      spawnThreat: true,
    };
  }

  if (!clock.warningIssued &&
      clock.actionsSinceLastProgression >= thresholds.WARNING_THRESHOLD[diff]) {
    return {
      type: 'warning',
      narrative: t('stalker.warning'), // "Vous sentez un danger approcher..."
      increaseTension: true,
    };
  }

  return null;
}
```

The stalker clock **resets to 0** whenever the player enters a new
scenario node (advances to a new area on the critical path).

### 3.4 Interaction with Threat Director

The stalker clock feeds into the existing Threat Director system.
When the warning threshold is hit:
- `encounterChance` increases by +0.2
- `aggressiveness` increases by +2
- Narrative hints become more urgent

This creates organic tension without punishing exploration —
the player has 15-20 free actions before anything changes.

---

## 4. Status Conditions

### 4.1 Five Conditions

```typescript
type ConditionId = 'wounded' | 'terrified' | 'cold' | 'poisoned' | 'exhausted';

interface StatusCondition {
  id: ConditionId;
  name: LocaleString;
  icon: string;              // Emoji for UI display
  description: LocaleString;

  // Mechanical effects
  statMalus: Partial<Record<StatId, number>>;  // Flat penalties to stats
  hpDrainPerAction: number;  // HP lost per action (0 = none)
  specialEffect: string | null;

  // Duration
  durationType: 'permanent_until_cured' | 'timed';
  durationActions?: number;   // For timed conditions

  // Cure
  cureMethod: string;        // Item, verb, or condition
}

const CONDITIONS: Record<ConditionId, StatusCondition> = {

  wounded: {
    id: 'wounded',
    name: { fr: 'Blessé', en: 'Wounded' },
    icon: '🩸',
    description: {
      fr: 'Chaque mouvement ravive la douleur. Malus physique.',
      en: 'Every movement reignites the pain. Physical penalty.',
    },
    statMalus: { ATK: -1, AGI: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE trousse_medicale OR USE stimulant',
  },

  terrified: {
    id: 'terrified',
    name: { fr: 'Terrifié', en: 'Terrified' },
    icon: '😱',
    description: {
      fr: 'La peur vous paralyse. Malus à tous les jets.',
      en: 'Fear paralyzes you. Penalty to all rolls.',
    },
    statMalus: { ATK: -1, INT: -1, CHA: -1 },
    hpDrainPerAction: 0,
    specialEffect: 'ALL_ROLLS_MINUS_1', // Additional -1 to ALL rolls (stacks with stat malus)
    durationType: 'timed',
    durationActions: 5,  // Wears off after 5 actions
    cureMethod: 'TIME (5 actions) OR CALM by friendly NPC OR USE stimulant',
  },

  cold: {
    id: 'cold',
    name: { fr: 'Hypothermie', en: 'Hypothermia' },
    icon: '🥶',
    description: {
      fr: 'Le froid engourdit vos membres. Malus dextérité et réflexion.',
      en: 'Cold numbs your limbs. Dexterity and thinking penalty.',
    },
    statMalus: { AGI: -2, INT: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'MOVE_TO warm area OR USE heat_source OR IGNITE something',
  },

  poisoned: {
    id: 'poisoned',
    name: { fr: 'Empoisonné', en: 'Poisoned' },
    icon: '☠️',
    description: {
      fr: 'Le poison ronge votre organisme. Perte de PV régulière.',
      en: 'Poison eats away at you. Regular HP loss.',
    },
    statMalus: { ATK: -1 },
    hpDrainPerAction: 1,  // Lose 1 HP per action taken
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE trousse_medicale OR USE antidote',
  },

  exhausted: {
    id: 'exhausted',
    name: { fr: 'Épuisé', en: 'Exhausted' },
    icon: '😫',
    description: {
      fr: 'Vous n\'en pouvez plus. Tout devient plus difficile.',
      en: 'You\'re spent. Everything becomes harder.',
    },
    statMalus: { ATK: -1, DEF: -1, AGI: -1 },
    hpDrainPerAction: 0,
    specialEffect: null,
    durationType: 'permanent_until_cured',
    cureMethod: 'USE ration OR USE stimulant OR WAIT 3 actions in safe room',
  },
};
```

### 4.2 How Conditions Apply

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

// Called every action:
function tickConditions(state: GameState): GameState {
  let newHp = state.player.hp;
  const remainingConditions: ConditionId[] = [];

  for (const condId of state.player.conditions) {
    const cond = CONDITIONS[condId];

    // HP drain
    newHp -= cond.hpDrainPerAction;

    // Timed expiry
    if (cond.durationType === 'timed') {
      const remaining = state.conditionTimers[condId] - 1;
      if (remaining > 0) {
        remainingConditions.push(condId);
      }
      // else: condition expires, not added back
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

### 4.3 Condition Triggers

| Trigger | Condition Applied |
|---------|------------------|
| HP drops below 30% | `wounded` |
| Encounter with main threat (first time) | `terrified` |
| Critical failure on social/combat roll | `terrified` (50% chance) |
| Depressurized/cold zone for 3+ actions | `cold` |
| Toxic substance contact | `poisoned` |
| 10+ actions without rest in high tension | `exhausted` |
| NPC special attack (poison claw, gas) | `poisoned` |

### 4.4 UI Display

Active conditions show as icons in the status bar:

```
 ❤ 4/14 🩸😱  |  🫁 80%  |  FOR 3↓ DEF 3 INT 0↓ CHA 0↓ AGI 3↓ LCK 2
```

The downward arrow indicates a stat affected by a condition.
Tapping a condition icon shows its name, effect, and cure method.

---

## 5. Oxygen System

### 5.1 Zone-Based O₂ Drain

Oxygen only matters in **specific scenario zones** tagged with the
`low_oxygen` or `depressurized` environmental property. It does NOT
apply globally.

```typescript
interface OxygenState {
  current: number;     // 0 to 100
  max: number;         // Always 100
  drainRate: number;   // Per-action drain in current zone (0 if safe)
  active: boolean;     // Is O₂ relevant in current scenario?
}

const OXYGEN_DRAIN_RATES: Record<string, number> = {
  'pressurized': 0,         // Normal — no drain
  'low_oxygen': 3,          // Slow drain — leak, thin atmosphere
  'depressurized': 8,       // Fast drain — vacuum, hull breach
  'toxic_atmosphere': 5,    // Medium drain — filters working overtime
};
```

### 5.2 O₂ Depletion → HP Drain

When oxygen hits 0, it stays at 0 and HP starts draining instead:

```typescript
function tickOxygen(state: GameState): GameState {
  if (!state.oxygen.active) return state;

  const drain = OXYGEN_DRAIN_RATES[state.currentLocation.atmosphere] ?? 0;
  if (drain === 0) return state;

  let newO2 = state.oxygen.current - drain;
  let newHp = state.player.hp;

  if (newO2 <= 0) {
    newO2 = 0;
    // HP drain: VACUUM_DAMAGE_PER_ACTION when O₂ is 0
    newHp -= BALANCE.VACUUM_HP_DRAIN_PER_ACTION; // Default: 3
  }

  return {
    ...state,
    oxygen: { ...state.oxygen, current: newO2 },
    player: { ...state.player, hp: newHp },
  };
}
```

### 5.3 O₂ Restoration

| Method | Effect |
|--------|--------|
| Enter pressurized zone | O₂ restores to 100 over 3 actions (+33/action) |
| Use O₂ canister item | Instant +50 O₂ |
| Equip EVA suit | Drain rate halved in depressurized zones |
| Repair life support (INT check) | Zone becomes pressurized permanently |

### 5.4 UI

O₂ only shows when relevant (when current scenario has `low_oxygen` or
`depressurized` zones):

```
 ❤ 12/14  |  🫁 67% ▼  |  FOR 4  DEF 3...
```

When O₂ reaches critical (< 20%), it pulses red:

```
 ❤ 12/14  |  🫁 12% ⚠ CRITIQUE  |  FOR 4  DEF 3...
```

Narrative integration:

```
O₂ > 80%: (no mention)
O₂ 50-80%: "Votre respiration devient plus laborieuse."
O₂ 20-50%: "L'air se raréfie. Chaque inspiration est un effort."
O₂ < 20%: "Vos poumons brûlent. Votre vision se trouble."
O₂ = 0%:  "Vous suffoquez. [-3 PV]"
```

---

## 6. Item Durability

### 6.1 Binary State

Items have two states: **intact** or **broken**. No durability counter,
no gradual degradation.

```typescript
interface ItemState {
  id: string;
  broken: boolean;
  repairable: boolean;
}
```

### 6.2 When Items Break

| Trigger | Affected Items |
|---------|---------------|
| Critical failure using the item | Items with `fragile` property |
| Using item as improvised weapon (after 2 uses) | Items NOT tagged `weapon` |
| Environmental damage (fire, acid, depressurization) | Items with `fragile` or `flammable` |
| Thrown item hits hard target | Items with `fragile` |

```typescript
function checkItemBreakage(
  item: ItemDefinition,
  verb: string,
  rollResult: RollResult,
  context: ActionContext,
): boolean {
  // Weapons don't break from normal combat use
  if (item.type === 'weapon' && ['STRIKE', 'CUT', 'THROW'].includes(verb)) {
    return false;
  }

  // Fragile items break on critical failure
  if (item.properties.includes('fragile') && rollResult.natural === 1) {
    return true;
  }

  // Improvised weapons break after 2 combat uses
  if (verb === 'IMPROVISE_WEAPON') {
    const uses = context.itemCombatUses[item.id] ?? 0;
    if (uses >= 2) return true;
  }

  return false;
}
```

### 6.3 Broken Item Behavior

- A broken item **stays in inventory** (it's still a physical object)
- It **cannot be used for its primary function** (broken scanner can't scan)
- It **can still be used creatively** (broken datapad = improvised shield, component)
- Its properties change: gains `broken`, loses `usable`, `powered`, `electronic` (if applicable)
- If `repairable: true`, the Engineer passive ability or a REPAIR action can fix it
- If `repairable: false`, it's permanently broken

### 6.4 Repair Rules

```typescript
function canRepairItem(item: ItemState, player: PlayerState): boolean {
  if (!item.broken) return false;
  if (!item.repairable) return false;

  // Anyone can attempt repair, but Engineer has bonus
  return true;
}

// Repair DC: 12 (base) — Engineer passive = auto-success for simple items
// Non-engineers can try but it's harder (+3 DC)
const REPAIR_DC = {
  base: 12,
  nonEngineerPenalty: 3,
};
```

---

## 7. Free Input Creativity Bonus

### 7.1 The Problem

If suggestion buttons are always optimal, players never type freely.
The core pillar "attempt anything" dies.

### 7.2 The Solution: Creativity Bonus

When the player types a free-text action that is **not one of the
3 suggested actions**, they get a dice bonus:

```typescript
const CREATIVITY_BONUS = {
  DIFFERENT_FROM_SUGGESTIONS: -2,    // DC reduced by 2 (easier)
  NOVEL_VERB_COMBO: -1,             // Additional -1 if verb+target combo never tried
  ABSURD_BUT_POSSIBLE: -3,          // Absurd actions get BIGGER bonus (reward boldness)
  // Note: the absurd difficulty floor (23) still applies BEFORE this bonus
  // So: absurd action = DC 23, then -3 creativity = DC 20. Still hard, but possible.
};
```

### 7.3 UI Feedback

When the player types a creative action, the UI shows the bonus:

```
> "j'utilise le cadavre comme bouclier"
  → IMPROVISE_SHIELD avec [Cadavre] — Créativité ! [DC -2] 🎨
  → D20 + DEF(3) + LCK(+1) vs DC 11 (au lieu de 13)
```

The 🎨 icon and "Créativité !" label make the bonus visible and
rewarding, encouraging more free input.

### 7.4 Detection Logic

```typescript
function isCreativeAction(
  parsedAction: ParsedAction,
  suggestions: SuggestedAction[],
): boolean {
  // Check if the parsed action matches any suggestion
  for (const suggestion of suggestions) {
    if (parsedAction.verb === suggestion.verb &&
        parsedAction.target === suggestion.target) {
      return false; // It's a suggested action, no bonus
    }
  }
  return true; // Different from suggestions = creative
}
```

---

## 8. Save System

### 8.1 Three Slots + Auto-save

```typescript
interface SaveSlot {
  id: 1 | 2 | 3;
  occupied: boolean;
  playerName: string;
  classId: string;
  scenarioId: string;
  progressPercent: number;  // 0-100, based on nodes completed
  difficulty: DifficultyLevel;
  timestamp: number;        // Unix timestamp
  playTime: number;         // Seconds of play
  // The actual game state is stored separately in IndexedDB
}

interface AutoSave {
  slotId: number;           // Which slot this auto-save belongs to
  state: GameState;
  timestamp: number;
}
```

### 8.2 Auto-save Triggers

Auto-save fires on:
- Entering a new scenario node
- After combat resolution
- After item pickup/use
- Every 30 seconds of activity

### 8.3 Save Integrity & Permadeath

In permadeath modes (Survivor, Nightmare), the save is **deleted on death**.
No save-scumming. The auto-save is overwritten after the death screen
with a "dead" state that shows the game over recap but cannot be loaded.

```typescript
function onPlayerDeath(slotId: number): void {
  // Mark the save as dead — it becomes a memorial, not a restore point
  const slot = loadSlot(slotId);
  slot.state = null;  // Game state deleted
  slot.deathRecap = generateDeathRecap(slot);
  slot.occupied = false; // Slot becomes available
  saveSlot(slotId, slot);
}
```

In Explorer mode, death doesn't delete the save (knockout mechanic).

### 8.4 UI

```
┌─────────────────────────────────┐
│ Slot 1: Kira — Marine           │
│ "Épave Stellaire" — 45% — 🟢    │
│ Survivant — 23 min              │
│ [Continuer]  [Supprimer]        │
├─────────────────────────────────┤
│ Slot 2: Vide                    │
│ [Nouvelle partie]               │
├─────────────────────────────────┤
│ Slot 3: Marcus — Ingénieur      │
│ "Ruines Alien" — 12% — ☠️ MORT  │
│ Cauchemar — 8 min               │
│ [Voir récap]  [Nouvelle partie] │
└─────────────────────────────────┘
```

---

## 9. French Parser — Lemmatization Strategy

### 9.1 The Problem

French verb conjugation produces dozens of forms per verb:
"frapper" → frappe, frappes, frappons, frappez, frappent, frappais,
frappait, frappé, frappée, frappant, frapperai...

A simple prefix match is fragile and produces false positives.

### 9.2 Chosen Solution: Snowball Stemmer + Curated Override Table

We use a **two-layer approach**:

**Layer 1 — Curated form table (high priority)**

A hand-built map of the ~300 most common conjugated/inflected forms
for our ~50 game verbs. This catches the forms players actually type.

```typescript
// Manually curated: covers present, past participle, imperative,
// and common informal forms for each game verb
const CURATED_FORMS: Record<string, string> = {
  // STRIKE
  'frappe': 'STRIKE', 'frappes': 'STRIKE', 'frappez': 'STRIKE',
  'frappé': 'STRIKE', 'frappée': 'STRIKE', 'frappant': 'STRIKE',
  'tape': 'STRIKE', 'tapé': 'STRIKE', 'tapez': 'STRIKE',
  'cogné': 'STRIKE', 'cognez': 'STRIKE',
  // HACK
  'pirate': 'HACK', 'piraté': 'HACK', 'piratez': 'HACK',
  'hacke': 'HACK', 'hacké': 'HACK',
  // RUN
  'cours': 'RUN', 'courez': 'RUN', 'couru': 'RUN',
  'fuis': 'RUN', 'fuyez': 'RUN', 'fui': 'RUN',
  // ... ~300 entries total, built during Phase 1-2
};
```

**Layer 2 — Snowball French Stemmer (fallback)**

For forms not in the curated table, we use the Snowball stemmer
algorithm for French. It's a well-established, rules-based stemmer
(no ML, no dictionary, ~200 lines of code, works offline).

```typescript
// npm package: "snowball-stemmers" or manual implementation
// Snowball French stems: "fracassant" → "fracass", "fracasser" → "fracass"
// We pre-stem all verb aliases and match against stemmed player input

import { stem } from './snowball-fr'; // Bundled, ~2KB

const STEMMED_ALIASES: Record<string, string> = {};
// Built at init time:
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

**Layer 3 — Common prefix patterns (catch-all)**

For irregular or creative spellings, simple 4+ character prefix matching
as a last resort. This is the existing system from the action parser design.

### 9.3 Full Resolution Order

```
1. Exact match in CURATED_FORMS         → instant, 100% accurate
2. Exact match in verb aliases (infinitive)  → existing system
3. Snowball stem match                   → good for conjugated forms
4. Prefix match (4+ chars)              → catch-all fallback
5. Semantic fallback (aggressive/movement/question classification)
6. Reformulation prompt                  → "Que tentez-vous exactement ?"
```

### 9.4 Multi-language Extensibility

Snowball has stemmers for 20+ languages. Adding German, Spanish, Italian
later only requires:
1. Import the language's Snowball stemmer
2. Add verb aliases in that language
3. Pre-stem the aliases at build time

The architecture is identical — just swap the stemmer and aliases.

```typescript
type SupportedLocale = 'fr' | 'en' | 'de' | 'es' | 'it'; // Future

const STEMMERS: Record<SupportedLocale, (word: string) => string> = {
  fr: snowballFr,
  en: snowballEn,
  // de: snowballDe, // Future
  // es: snowballEs, // Future
};
```

### 9.5 Input Normalization Pipeline

Before any matching, the input goes through normalization:

```typescript
function normalizeInput(raw: string): string[] {
  return raw
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents for matching
    .replace(/['']/g, ' ')     // Apostrophes → spaces ("l'ennemi" → "l ennemi")
    .replace(/[^a-z0-9 ]/g, '') // Remove punctuation
    .split(/\s+/)              // Split into tokens
    .filter(t => t.length > 1) // Remove single characters
    .filter(t => !STOP_WORDS_FR.has(t)); // Remove "le", "la", "les", "un", "de", "du"...
}
```

---

## 10. Nightmare Softlock Escape

### 10.1 The Problem (Amended)

The original design had Nightmare mode killing the player after
5+ failures without giving agency. This contradicts pillar #1.

### 10.2 Amended Behavior

In Nightmare, after 5+ failures on the same obstacle:

```
Turn 6: WARNING — "Des bruits de pas lourds résonnent."
        The threat director spawns the threat ONE ROOM AWAY.
        Player still has freedom to act.

Turn 7: ARRIVAL — The threat enters the player's room.
        Combat begins. Player has full combat options:
        - Fight (can win if skilled/prepared)
        - Flee (RUN, with fleeDC + 3 because cornered)
        - Creative solution (HIDE, BARRICADE, IGNITE, etc.)
        - Sacrifice item as distraction (THROW + LURE)

Turn 8+: If player is still in the room AND hasn't resolved:
         The threat attacks every turn. Player can still flee.
         There is ALWAYS an exit — fleeing is always possible,
         even if the flee DC is very high.
```

The key change: **the player is never killed without having at least 2 turns
of combat options, including fleeing.**

```typescript
// Flee DC in "cornered" state (triggered by stalker clock)
const CORNERED_FLEE_DC = 16; // Hard but not impossible
// With AGI 4 + LCK bonus 1: need D20 roll of 11+ (55% success)
// With AGI 2 + LCK bonus 0: need D20 roll of 14+ (35% success)
```

---

## 11. Feature: Ship Memory (Mémoire du Vaisseau)

### 11.1 Concept

Every failed action physically marks the environment. The world
remembers what the player attempted. This creates progressive puzzle
transformation rather than simple retry.

### 11.2 Implementation

```typescript
interface EnvironmentMark {
  locationId: string;
  targetId: string;         // What was acted upon
  verb: string;             // What was attempted
  outcome: 'failure' | 'critical_failure';
  mark: EnvironmentMarkEffect;
  turn: number;             // When it happened
}

interface EnvironmentMarkEffect {
  // Physical change to the target
  propertyAdded?: string[];    // e.g., ['damaged_frame'] after failed FORCE_OPEN
  propertyRemoved?: string[];  // e.g., ['sealed'] after partial damage

  // DC modifier for subsequent attempts
  samActionDCMod: number;      // e.g., -2 (easier to force a damaged door)
  otherActionDCMod: number;    // e.g., -1 (damage reveals new approach)

  // Side effects
  noiseGenerated: boolean;     // Increases encounter chance
  newApproachRevealed?: string; // e.g., "maintenance_port" now visible

  // Narrative
  markDescription: LocaleString; // "Des marques de coups déforment le cadre de la porte."
  revisitDescription: LocaleString; // Appended to room description on return
}
```

### 11.3 Mark Catalog

| Failed Action | Target Type | Mark Created |
|--------------|------------|-------------|
| FORCE_OPEN (fail) | door | `damaged_frame`: door -2 DC next force, but +0.1 encounter chance |
| HACK (fail) | terminal | `alert_mode`: terminal locks, but reveals physical `maintenance_port` (-2 DC for OVERRIDE) |
| BREAK (fail) | window | `cracked_glass`: window -3 DC next break, but creaks loudly |
| STRIKE (fail) | NPC | `alerted`: NPC +2 dodge, but other NPCs become `terrified` |
| REPAIR (fail) | machine | `exposed_wiring`: new component visible, ELECTRIFY now possible |
| UNLOCK (fail) | lock | `jammed_pin`: -1 DC unlock, but +3 DC for FORCE_OPEN (jammed tighter) |
| CLIMB (fail) | surface | `worn_grips`: -1 DC climb (you found handholds) |

### 11.4 Integration with Narrative Layer

Ship Memory marks are fed into the narrative composer as an additional
context dimension. When the player revisits a marked location:

```
"Vous revenez dans le couloir médical. Les marques de vos coups
 déforment le cadre de la porte — le métal est tordu, mais la
 serrure tient encore. Peut-être qu'un dernier coup suffirait...
 Ou que ce nouveau port de maintenance pourrait servir."
```

---

## 12. Feature: Black Box (La Boîte Noire)

### 12.1 Concept

After each game (win or lose), a journal entry is auto-generated.
In subsequent games, the player can find a "black box" device
containing the journal from their previous run — turning past
experiences into in-game lore.

### 12.2 Data Structure

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

  // Auto-generated journal (3-5 sentences)
  journalEntry: LocaleString;

  // Key events extracted from the playthrough
  keyEvents: {
    description: LocaleString;
    locationId: string;
    turn: number;
  }[];

  // Useful hints for the next player
  hints: {
    locationId: string;
    dangerType: string;       // 'threat_encountered', 'trap', 'dead_end'
    description: LocaleString;
  }[];
}
```

### 12.3 Journal Generation

At game end, the engine scans the game history and generates a
journal using templates:

```typescript
function generateBlackBoxJournal(history: GameHistory): LocaleString {
  const templates = {
    death: [
      {
        fr: 'Entrée #{entry_num} — {class_name} {player_name}. ' +
            'Arrivé dans {setting_name}, j\'ai survécu {turns} cycles. ' +
            '{key_event_1}. {key_event_2}. ' +
            '{cause_of_death_narrative}. ' +
            'Si quelqu\'un trouve ceci... méfiez-vous de {danger_hint}.',
        en: '...',
      },
      // ...3-4 more templates
    ],
    victory: [
      {
        fr: 'Entrée #{entry_num} — {class_name} {player_name}. ' +
            'J\'ai réussi à m\'échapper de {setting_name} après {turns} cycles. ' +
            '{key_event_1}. {key_event_2}. ' +
            'Le point faible de {threat_name} est {weak_point_hint}. ' +
            'Bonne chance.',
        en: '...',
      },
    ],
  };

  // Fill template with actual game data
  // ...
}
```

### 12.4 In-Game Discovery

In subsequent playthroughs, the engine places a "boîte noire" object
in one of the early-to-mid game locations:

```typescript
interface BlackBoxPlacement {
  // Only placed if a previous run exists with the same scenario
  scenarioMatch: boolean;
  // Placed in a side room (not critical path) during the rising beat
  placementBeat: 'rising';
  // The device itself
  item: {
    id: 'black_box_device',
    type: 'data',
    properties: ['tangible', 'small', 'electronic', 'readable', 'data_storage'],
    name: { fr: 'Boîte noire endommagée', en: 'Damaged black box' },
    description: {
      fr: 'Un enregistreur de vol. La coque est rayée. Quelqu\'un était là avant vous.',
      en: 'A flight recorder. The casing is scratched. Someone was here before you.',
    },
  };
}

// When the player READs or EXAMINEs the black box:
function readBlackBox(entry: BlackBoxEntry): string {
  return entry.journalEntry[currentLocale];
  // The narrative panel displays the journal as a "data log" with
  // a distinctive visual treatment (different font, border, etc.)
}
```

### 12.5 Storage

Black box entries are stored in IndexedDB, separate from save slots.
Maximum 20 entries kept (oldest deleted). They persist across all games.

```typescript
// IndexedDB store: 'blackbox_entries'
// Key: entry.id
// Max: 20 entries (FIFO)
```

---

## 13. Feature: Secret Verbs (Verbes Secrets)

### 13.1 Concept

Hidden verbs that the parser recognizes but that NEVER appear in
suggestion buttons. They reward curious, creative players and
generate word-of-mouth.

### 13.2 Secret Verb Registry

```typescript
interface SecretVerb {
  id: string;
  aliases: { fr: string[]; en: string[] };
  stat: StatId;
  baseDC: number;
  effects: Record<string, SecretVerbEffect>; // context → effect
  discoveryNarrative: LocaleString; // First-time use gets special text
}

const SECRET_VERBS: SecretVerb[] = [

  {
    id: 'PRAY',
    aliases: {
      fr: ['prier', 'implorer les dieux', 'prier le vide', 'méditer'],
      en: ['pray', 'meditate', 'implore the void'],
    },
    stat: 'CHA',
    baseDC: 15,
    effects: {
      'alien_ruins': {
        type: 'activate_mechanism',
        description: { fr: 'Un mécanisme ancien s\'éveille...', en: '...' },
        stateChange: 'reveal_hidden_path',
      },
      'combat_any': {
        type: 'stress_relief',
        description: { fr: 'Un calme étrange vous envahit.', en: '...' },
        removeCondition: 'terrified',
        healAmount: 2,
      },
      'default': {
        type: 'luck_boost',
        description: { fr: 'Le vide ne répond pas... mais vous vous sentez plus serein.', en: '...' },
        tempStatBoost: { LCK: 1, duration: 5 },
      },
    },
    discoveryNarrative: {
      fr: 'Vous joignez les mains dans le silence du vaisseau. Un geste dérisoire, absurde — et pourtant...',
      en: '...',
    },
  },

  {
    id: 'DANCE',
    aliases: {
      fr: ['danser', 'faire une danse', 'bouger en rythme'],
      en: ['dance', 'bust a move', 'groove'],
    },
    stat: 'AGI',
    baseDC: 12,
    effects: {
      'combat_robotic': {
        type: 'confuse_enemy',
        description: {
          fr: 'Vos mouvements erratiques déroutent les algorithmes de prédiction du robot.',
          en: '...',
        },
        enemySkipTurn: true,
        enemyDodgeReduced: 0.2,
      },
      'npc_friendly': {
        type: 'morale_boost',
        description: { fr: 'Un sourire inattendu éclaire le visage de {npc_name}.', en: '...' },
        npcDispositionBoost: 1,
      },
      'default': {
        type: 'stress_relief',
        description: { fr: 'Vous dansez dans le noir. Personne ne regarde. Ça fait du bien.', en: '...' },
        removeCondition: 'terrified',
      },
    },
    discoveryNarrative: {
      fr: 'Dans le silence spatial, vous commencez à bouger. C\'est absurde. C\'est humain.',
      en: '...',
    },
  },

  {
    id: 'NAME',
    aliases: {
      fr: ['nommer', 'baptiser', 'appeler', 'donner un nom'],
      en: ['name', 'christen', 'call it', 'give a name'],
    },
    stat: 'CHA', // Naming is a social act
    baseDC: 5, // Easy — it's a creative reward, not a challenge
    effects: {
      'item': {
        type: 'bond_with_item',
        description: { fr: 'Vous baptisez {target} : "{custom_name}". Ça paraît idiot, mais...', en: '...' },
        // Named items get personalized narrative templates for the rest of the game
        // "Vous brandissez Gertrude (votre barre de métal) face à l'ennemi."
        narrativePersonalization: true,
      },
      'npc_friendly': {
        type: 'deepen_bond',
        description: { fr: '{npc_name} semble touché. « Personne ne m\'avait jamais... »', en: '...' },
        npcLoyaltyBoost: 2,
      },
      'default': {
        type: 'cosmetic',
        description: { fr: 'Vous murmurez un nom dans le silence. Étrangement, ça aide.', en: '...' },
      },
    },
    discoveryNarrative: {
      fr: 'Donner un nom aux choses. Un vieux réflexe humain pour apprivoiser l\'inconnu.',
      en: '...',
    },
  },

  {
    id: 'SING',
    aliases: {
      fr: ['chanter', 'fredonner', 'siffler'],
      en: ['sing', 'hum', 'whistle'],
    },
    stat: 'CHA',
    baseDC: 8,
    effects: {
      'npc_hostile_sentient': {
        type: 'confusion',
        description: { fr: '{npc_name} hésite, déstabilisé par ce comportement inattendu.', en: '...' },
        enemySkipTurn: true,
      },
      'dark_room': {
        type: 'echo_location',
        description: { fr: 'L\'écho vous révèle la taille de la pièce et... quelque chose d\'autre.', en: '...' },
        revealHiddenFeature: true,
      },
      'default': {
        type: 'stress_relief',
        description: { fr: 'Votre voix résonne dans les couloirs vides. Un moment de fragile humanité.', en: '...' },
        removeCondition: 'terrified',
        tempStatBoost: { CHA: 1, duration: 3 },
      },
    },
    discoveryNarrative: {
      fr: 'Dans le vide, personne ne vous entend chanter. Mais vous, vous vous entendez.',
      en: '...',
    },
  },

  {
    id: 'APOLOGIZE',
    aliases: {
      fr: ['s\'excuser', 'demander pardon', 'pardon', 'désolé'],
      en: ['apologize', 'say sorry', 'sorry'],
    },
    stat: 'CHA',
    baseDC: 10,
    effects: {
      'npc_hostile_sentient': {
        type: 'de_escalate',
        description: { fr: 'Vos excuses prennent {npc_name} au dépourvu. L\'hostilité recule d\'un cran.', en: '...' },
        npcDispositionChange: 'hostile_to_neutral',
      },
      'npc_wounded': {
        type: 'comfort',
        description: { fr: '« C\'est... pas ta faute », murmure {npc_name}. Son regard s\'adoucit.', en: '...' },
        npcDispositionChange: 'neutral_to_friendly',
      },
      'default': {
        type: 'cosmetic',
        description: { fr: 'Vous vous excusez auprès du vide. Le vide ne répond pas.', en: '...' },
      },
    },
    discoveryNarrative: {
      fr: 'Les mots sortent avant que vous y pensiez. Parfois, c\'est tout ce qu\'il faut.',
      en: '...',
    },
  },
];
```

### 13.3 First-Use Reward

The first time a player uses a secret verb in a game session,
they get a special narrative + a visual badge in the UI:

```
🔮 VERBE SECRET DÉCOUVERT : PRIER
"Vous joignez les mains dans le silence du vaisseau..."
```

This badge is stored in the Black Box system — future runs can
reference it: "Le journal mentionne que le précédent survivant
a tenté de prier dans les ruines alien..."

### 13.4 Integration with Parser

Secret verbs are loaded into the parser's verb registry with a
`secret: true` flag. The suggestion engine explicitly filters them out:

```typescript
function generateSuggestions(state: GameState): SuggestedAction[] {
  const allPossible = getAllPossibleActions(state);
  // Filter out secret verbs — they should never be suggested
  return allPossible
    .filter(a => !a.verb.secret)
    .sort(byRelevance)
    .slice(0, 3);
}
```

---

## 14. Amendments to Existing Documents

### 14.1 ROADMAP.md Changes

| Section | Change |
|---------|--------|
| **Balance Constants** | Replace 3-stat with 6-stat. Remove XP_PER_LEVEL. Add COMBAT_BALANCE, STALKER_CLOCK, CREATIVITY_BONUS, OXYGEN constants. |
| **Phase 1** | Add stat definitions, class definitions, item `damageBonus` and `repairable` fields. |
| **Phase 2** | Add Snowball FR stemmer, curated form table, normalization pipeline. |
| **Phase 3** | Add combat resolution, NPC attack, weak point system, flee mechanics, status conditions, item breakage. Add oxygen tick. Add stalker clock. |
| **Phase 4** | Add condition-based narrative snippets. Add Ship Memory mark descriptions. Add Black Box journal templates. Add secret verb narratives. |
| **Phase 5** | Add NPC combat stats to scenario definitions. Add weak points per NPC. Add Black Box placement rules. Add Ship Memory mark catalog. |
| **Phase 6** | Add character creation screens (class select, bonus points, name). Add condition icons. Add O₂ display. Add save slot UI. Add creativity bonus indicator. Add weak point indicator. |
| **Phase 8** | Add 3-slot save system with IndexedDB. Add auto-save triggers. Add permadeath save deletion. Add Black Box entry storage. |

### 14.2 action_parser_design.md Changes

| Section | Change |
|---------|--------|
| **1.1 Verb Categories** | 5 categories instead of 4: PHYSICAL(ATK), DEFENSE(DEF), TECHNICAL(INT), SOCIAL(CHA), AGILITY(AGI), CREATIVE(*) |
| **1.2 Verb Registry** | All verbs remapped to new 6-stat system per §1.3 above |
| **3.1 Input Parsing** | Add Snowball stemmer layer per §9 above |
| **3.5 Difficulty Modifiers** | Add creativity bonus, condition malus, LCK passive bonus |
| **NEW §7** | Secret verbs section |

### 14.3 structural_design_decisions.md Changes

| Section | Change |
|---------|--------|
| **Anti-softlock** | Amend Nightmare behavior per §10 — always allow flee |

### 14.4 design_refinements.md Changes

| Section | Change |
|---------|--------|
| **§3 Difficulty** | Add condition effects to difficulty scaling |
| **§3 Death** | Add oxygen death check, condition-based death narratives |
| **Narrative Layer 5** | Expand with 5 condition types per §4 |
| **NEW** | Ship Memory marks as narrative context dimension |

### 14.5 New Balance Constants

```typescript
const BALANCE = {
  // ...existing values, with amendments:

  // Stats (AMENDED)
  STAT_MIN: 0,
  STAT_MAX: 5,
  BONUS_POINTS: 2,
  TOTAL_CLASS_POINTS: 15,

  // Remove:
  // XP_PER_LEVEL: 10,  ← DELETED

  // Combat (NEW)
  COMBAT: {
    UNARMED_BASE_DAMAGE: 1,
    IMPROVISED_WEAPON_MULTIPLIER: 0.75,
    CRITICAL_HIT_MULTIPLIER: 1.5,
    PASSIVE_DODGE_AGI_THRESHOLD: 3,
    PASSIVE_DODGE_CHANCE: 0.1,
    NPC_HIT_BASE_DC: 10,
    BERSERK_ATK_BONUS_PER_QUARTER: 1,
    WEAK_POINT_HINT_ROUND: 2,
    WEAK_POINT_AUTO_DISCOVER_ROUND: 3,
    ENVIRONMENTAL_KILL_MULTIPLIER: 10,
    CORNERED_FLEE_DC: 16,
  },

  // Stalker Clock (NEW)
  STALKER_CLOCK: {
    WARNING: { explorer: 20, survivor: 15, nightmare: 10 },
    THREAT:  { explorer: 30, survivor: 22, nightmare: 15 },
    KILL:    { explorer: 999, survivor: 35, nightmare: 20 },
  },

  // Creativity (NEW)
  CREATIVITY: {
    DIFFERENT_FROM_SUGGESTIONS_BONUS: -2,
    NOVEL_COMBO_BONUS: -1,
    ABSURD_BUT_POSSIBLE_BONUS: -3,
  },

  // Oxygen (AMENDED)
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
  },

  // Conditions (NEW)
  CONDITIONS: {
    WOUNDED_HP_THRESHOLD: 0.3,    // Below 30% HP
    TERRIFIED_DURATION: 5,        // Actions
    COLD_ONSET_ACTIONS: 3,        // Actions in cold zone before condition
    EXHAUSTION_THRESHOLD: 10,     // Actions in high tension without rest
    POISONED_HP_DRAIN: 1,         // Per action
  },

  // Durability (NEW)
  DURABILITY: {
    IMPROVISED_WEAPON_MAX_USES: 2,
    REPAIR_BASE_DC: 12,
    NON_ENGINEER_REPAIR_PENALTY: 3,
  },

  // Save (NEW)
  SAVE: {
    SLOT_COUNT: 3,
    AUTO_SAVE_INTERVAL_MS: 30000,
    BLACK_BOX_MAX_ENTRIES: 20,
  },
} as const;
```

---

> *"Dans le vide, personne ne vous entend lancer un D20."*
> — Void Walker tagline
