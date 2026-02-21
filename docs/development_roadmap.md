# Void Walker — Development Methodology & Roadmap

## Philosophy: Test-Driven Game Development

Every system is built in this order:
1. **Define the contract** (types, interfaces, expected behavior)
2. **Write the tests** (unit + stress + edge cases)
3. **Implement until tests pass**
4. **Playtest manually** to validate "feel"
5. **Refactor** with test safety net

Nothing ships without tests. Nothing gets refactored without tests passing.

---

## Tech Stack (Clean Start)

```
Framework:     React 18 + TypeScript 5 (strict mode)
Build:         Vite 5
State:         Zustand
Testing:       Vitest + @testing-library/react
Stress tests:  Vitest with custom combinatorial generators
Storage:       IndexedDB via Dexie.js
Styling:       Tailwind CSS
PWA:           vite-plugin-pwa
Deployment:    GitHub Pages or Cloudflare Pages (free)
AI (optional): Gemini Flash via Cloudflare Worker proxy
```

### Project Structure (New)

```
void-walker/
├── src/
│   ├── engine/                 # Pure game logic (ZERO UI dependencies)
│   │   ├── properties.ts       # Property registry & inheritance
│   │   ├── verbs.ts            # Verb registry & aliases
│   │   ├── parser.ts           # Action parser (input → structured action)
│   │   ├── resolver.ts         # Target resolver (tokens → game entities)
│   │   ├── compatibility.ts    # Verb × property compatibility checker
│   │   ├── difficulty.ts       # Difficulty calculator
│   │   ├── dice.ts             # Dice rolling & resolution
│   │   ├── state.ts            # Game state types & transitions
│   │   ├── inventory.ts        # Inventory management
│   │   ├── pacing.ts           # Story beat progression
│   │   ├── consequences.ts     # Action → world state changes
│   │   ├── victory.ts          # Victory/defeat condition checker
│   │   ├── scenario.ts         # Scenario types & loader
│   │   └── index.ts            # Public API: processAction(state, input) → newState
│   │
│   ├── content/                # Game data (JSON + types)
│   │   ├── items.ts            # Item definitions with properties
│   │   ├── verbs.ts            # Verb definitions with aliases
│   │   ├── settings.ts         # Setting themes & pools
│   │   ├── templates.ts        # Narrative templates
│   │   ├── scenarios/          # Pre-built scenario JSONs
│   │   └── generated/          # Procedural generation pools
│   │
│   ├── narration/              # Text generation (no LLM needed)
│   │   ├── templates.ts        # Template engine with slots
│   │   ├── french.ts           # French text utilities (articles, accords)
│   │   └── composer.ts         # Assembles final narrative from outcome
│   │
│   ├── ai/                     # Optional AI enhancement layer
│   │   ├── client.ts           # API client with fallback
│   │   ├── narrator.ts         # AI-enhanced narration
│   │   └── suggestions.ts      # AI-generated action suggestions
│   │
│   ├── ui/                     # React components
│   │   ├── App.tsx
│   │   ├── screens/            # Full-screen views
│   │   ├── components/         # Reusable UI parts
│   │   └── hooks/              # Custom React hooks
│   │
│   ├── stores/                 # Zustand stores
│   │   └── gameStore.ts
│   │
│   └── services/               # PWA services
│       ├── storage.ts          # IndexedDB persistence
│       └── pwa.ts              # Service worker, install prompt
│
├── tests/
│   ├── unit/                   # Fast, isolated tests
│   │   ├── engine/
│   │   │   ├── properties.test.ts
│   │   │   ├── verbs.test.ts
│   │   │   ├── parser.test.ts
│   │   │   ├── resolver.test.ts
│   │   │   ├── compatibility.test.ts
│   │   │   ├── difficulty.test.ts
│   │   │   ├── dice.test.ts
│   │   │   ├── consequences.test.ts
│   │   │   ├── victory.test.ts
│   │   │   └── pacing.test.ts
│   │   ├── narration/
│   │   │   ├── templates.test.ts
│   │   │   └── french.test.ts
│   │   └── content/
│   │       └── items.test.ts
│   │
│   ├── stress/                 # Combinatorial & exhaustive tests
│   │   ├── all-verbs-all-items.test.ts
│   │   ├── parser-fuzzing.test.ts
│   │   ├── scenario-walkthrough.test.ts
│   │   ├── edge-cases.test.ts
│   │   └── generators/         # Test data generators
│   │       ├── itemGenerator.ts
│   │       ├── stateGenerator.ts
│   │       └── inputGenerator.ts
│   │
│   ├── integration/            # Multi-system tests
│   │   ├── full-turn.test.ts
│   │   ├── multi-turn.test.ts
│   │   ├── scenario-completion.test.ts
│   │   └── emergent-victory.test.ts
│   │
│   └── playtest/               # Semi-automated playtest helpers
│       ├── interactive-cli.ts   # CLI tool to playtest without UI
│       ├── replay.ts           # Replay a recorded session
│       └── record.ts           # Record a play session for replay
│
├── scripts/
│   ├── stress-test.sh          # Run full stress test suite
│   ├── playtest.sh             # Launch interactive playtest CLI
│   └── coverage-report.sh      # Generate coverage report
│
└── vitest.config.ts
```

---

## Testing Strategy

### Level 1 — Unit Tests (run on every save, < 2 seconds)

Each module has its own test file. Tests are pure functions, no mocking needed
because the engine has ZERO side effects.

```typescript
// tests/unit/engine/compatibility.test.ts

describe('Verb-Property Compatibility', () => {
  test('THROW requires liftable OR small', () => {
    const datapad = resolveProperties('datapad'); // small, electronic, readable...
    const cargo = resolveProperties('cargo_container'); // heavy, large, metallic...

    expect(isCompatible(Verb.THROW, datapad)).toBe(true);
    expect(isCompatible(Verb.THROW, cargo)).toMatchObject({
      compatible: false,
      reason: 'too_heavy',
      suggestion: 'Cet objet est bien trop lourd pour être lancé.'
    });
  });

  test('HACK requires electronic + secured', () => {
    const terminal = resolveProperties('terminal', { powered: true, secured: true });
    const metalBar = resolveProperties('barre_metal');

    expect(isCompatible(Verb.HACK, terminal)).toBe(true);
    expect(isCompatible(Verb.HACK, metalBar)).toMatchObject({
      compatible: false,
      reason: 'not_electronic'
    });
  });

  test('incompatible actions still allowed at extreme difficulty', () => {
    const metalBar = resolveProperties('barre_metal');
    const result = resolveAction(Verb.EAT, metalBar);

    // Not refused! Just very hard.
    expect(result.allowed).toBe(true);
    expect(result.difficulty).toBeGreaterThanOrEqual(23);
    expect(result.absurd).toBe(true);
  });
});
```

```typescript
// tests/unit/engine/parser.test.ts

describe('Action Parser', () => {
  test('simple verb recognition (FR)', () => {
    expect(parseVerb('frapper le robot')).toContain(Verb.STRIKE);
    expect(parseVerb('pirater le terminal')).toContain(Verb.HACK);
    expect(parseVerb('lire le datapad')).toContain(Verb.READ);
  });

  test('simple verb recognition (EN)', () => {
    expect(parseVerb('hit the robot')).toContain(Verb.STRIKE);
    expect(parseVerb('hack the terminal')).toContain(Verb.HACK);
  });

  test('compound actions', () => {
    const result = parseInput('arracher le bras du robot pour m\'en servir de massue');
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].verb).toBe(Verb.PULL);
    expect(result.actions[0].target).toBe('robot_arm');
    expect(result.actions[1].verb).toBe(Verb.IMPROVISE_WEAPON);
  });

  test('contextual disambiguation: "tirer"', () => {
    // "tirer sur" = SHOOT, "tirer" (alone) = PULL
    expect(parseVerb('tirer sur la vitre')).toContain(Verb.SHOOT);
    expect(parseVerb('tirer la porte')).toContain(Verb.PULL);
    expect(parseVerb('tirer le levier')).toContain(Verb.PULL);
  });

  test('absurd but valid input', () => {
    const result = parseInput('manger le robot');
    expect(result.actions[0].verb).toBe(Verb.EAT);
    expect(result.actions[0].target).toBeDefined();
    expect(result.absurd).toBe(true);
  });

  test('unrecognizable input triggers reformulation', () => {
    const result = parseInput('je médite sur le sens de la vie');
    expect(result.needsReformulation).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
```

### Level 2 — Stress Tests (run on demand, 10-60 seconds)

These are the **exhaustive combinatorial tests** you asked for.

```typescript
// tests/stress/all-verbs-all-items.test.ts

import { ALL_VERBS } from '../../src/engine/verbs';
import { generateAllItems } from '../generators/itemGenerator';
import { generateGameStates } from '../generators/stateGenerator';

describe('STRESS: Every verb × every item × multiple states', () => {
  // Generate 1000+ items (all predefined + randomly generated with random property combos)
  const items = generateAllItems({ count: 1000, includeRandom: true });
  const verbs = Object.values(ALL_VERBS);

  // Generate diverse game states
  const states = generateGameStates({
    count: 10,
    variations: [
      'empty_inventory',
      'full_inventory',
      'low_hp',
      'dark_room',
      'depressurized_room',
      'hostile_npc_present',
      'friendly_npc_present',
      'zero_gravity',
      'on_fire_room',
      'cramped_vent',
    ]
  });

  test.each(verbs)('verb %s never throws on any item', (verb) => {
    for (const item of items) {
      for (const state of states) {
        // This must NEVER throw. It can return incompatible, absurd,
        // or impossible — but it must always return a valid result.
        expect(() => {
          const result = resolveAction(verb, item, state);

          // Basic sanity checks on every result
          expect(result).toHaveProperty('allowed');
          expect(result).toHaveProperty('difficulty');
          expect(typeof result.difficulty).toBe('number');
          expect(result.difficulty).toBeGreaterThanOrEqual(1);
          expect(result.difficulty).toBeLessThanOrEqual(30);

          if (result.requiresRoll) {
            expect(result.stat).toBeDefined();
            expect(['FOR', 'INT', 'CHA']).toContain(result.stat);
          }

          // Narrative template must exist for this combination
          if (result.allowed) {
            expect(result.templateKey).toBeDefined();
          }
        }).not.toThrow();
      }
    }
  });

  test('no verb × item combination produces undefined state changes', () => {
    for (const verb of verbs) {
      for (const item of items.slice(0, 100)) { // Sample for speed
        const state = states[0];
        const result = resolveAction(verb, item, state);

        if (result.allowed && result.stateChanges) {
          // HP changes must be bounded
          if (result.stateChanges.hpChange) {
            expect(result.stateChanges.hpChange).toBeGreaterThanOrEqual(-20);
            expect(result.stateChanges.hpChange).toBeLessThanOrEqual(20);
          }
          // Oxygen changes must be bounded
          if (result.stateChanges.oxygenChange) {
            expect(result.stateChanges.oxygenChange).toBeGreaterThanOrEqual(-100);
            expect(result.stateChanges.oxygenChange).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });
});
```

```typescript
// tests/stress/parser-fuzzing.test.ts

import { generateRandomInputs } from '../generators/inputGenerator';

describe('STRESS: Parser fuzzing', () => {
  // Generate 5000 random player inputs including:
  // - Valid FR sentences
  // - Valid EN sentences
  // - Mixed FR/EN
  // - Typos and misspellings
  // - Empty strings, special characters, emojis
  // - Very long inputs
  // - Injection attempts ("}, {hack: true}")
  // - Numbers only
  // - Repeated words
  const inputs = generateRandomInputs({ count: 5000 });

  test('parser never throws on any input', () => {
    for (const input of inputs) {
      expect(() => {
        const result = parseInput(input);
        // Must always return a valid ParseResult
        expect(result).toHaveProperty('actions');
        expect(Array.isArray(result.actions)).toBe(true);
      }).not.toThrow();
    }
  });

  test('parser handles edge cases gracefully', () => {
    const edgeCases = [
      '',                          // empty
      '   ',                       // whitespace only
      '!@#$%^&*()',               // special chars
      'a'.repeat(10000),           // very long
      '🔥🗡️💀',                   // emoji only
      'frapper frapper frapper',   // repeated verb
      '{"hack": true}',           // JSON injection
      '<script>alert(1)</script>', // XSS attempt
      'null undefined NaN',        // JS keywords
      'je je je je je',           // stuttering
    ];

    for (const input of edgeCases) {
      const result = parseInput(input);
      expect(result).toBeDefined();
      expect(result.actions.length).toBeGreaterThanOrEqual(0);
    }
  });
});
```

```typescript
// tests/stress/generators/itemGenerator.ts

import { ALL_PROPERTIES, PropertyId } from '../../../src/engine/properties';

export interface GeneratedItem {
  id: string;
  name: string;
  nameFr: string;
  properties: Set<PropertyId>;
  type: string;
}

/**
 * Generate a large pool of items for stress testing.
 *
 * Includes:
 * - All predefined game items (from content/items.ts)
 * - Randomly generated items with random property combinations
 * - Edge case items (zero properties, all properties, contradictory properties)
 */
export function generateAllItems(opts: {
  count: number;
  includeRandom: boolean;
}): GeneratedItem[] {
  const items: GeneratedItem[] = [];

  // 1. All predefined items
  items.push(...getAllPredefinedItems());

  // 2. Random items with random property subsets
  if (opts.includeRandom) {
    const allProps = Object.values(ALL_PROPERTIES);
    const remaining = opts.count - items.length;

    for (let i = 0; i < remaining; i++) {
      const propCount = Math.floor(Math.random() * 15) + 1;
      const props = new Set<PropertyId>();
      for (let j = 0; j < propCount; j++) {
        props.add(allProps[Math.floor(Math.random() * allProps.length)].id);
      }
      items.push({
        id: `random_item_${i}`,
        name: `Random Item ${i}`,
        nameFr: `Objet aléatoire ${i}`,
        properties: props,
        type: 'misc',
      });
    }

    // 3. Edge case items
    items.push({
      id: 'edge_no_props',
      name: 'Void Object',
      nameFr: 'Objet du vide',
      properties: new Set(),
      type: 'misc',
    });
    items.push({
      id: 'edge_all_props',
      name: 'Omniproperty Object',
      nameFr: 'Objet omni-propriétés',
      properties: new Set(allProps.map(p => p.id)),
      type: 'misc',
    });
    items.push({
      id: 'edge_contradictory',
      name: 'Paradox Object',
      nameFr: 'Objet paradoxal',
      properties: new Set(['small', 'heavy', 'rigid', 'flexible', 'fragile', 'breakable'] as PropertyId[]),
      type: 'misc',
    });
  }

  return items;
}
```

### Level 3 — Integration Tests (run before commits, 5-30 seconds)

Test complete game turns and multi-turn sequences.

```typescript
// tests/integration/full-turn.test.ts

describe('Full Turn Integration', () => {
  test('standard action: examine item in room', () => {
    const state = createTestState({
      location: 'bridge',
      locationItems: [ITEMS.datapad],
    });

    const result = processTurn(state, 'examiner le datapad');

    expect(result.newState.player.hp).toBe(state.player.hp); // no damage
    expect(result.narrative).toBeTruthy();
    expect(result.narrative.length).toBeGreaterThan(20);
    expect(result.diceRoll).toBeNull(); // EXAMINE is auto-success
    expect(result.suggestions).toHaveLength(3);
  });

  test('combat action: attack hostile NPC', () => {
    const state = createTestState({
      location: 'corridor',
      npcs: [{ ...NPC_TEMPLATES.hostile_robot, location: 'corridor' }],
    });

    const result = processTurn(state, 'frapper le robot');

    expect(result.diceRoll).not.toBeNull();
    expect(result.diceRoll!.stat).toBe('FOR');
    expect(result.narrative).toBeTruthy();
    // State must reflect outcome
    if (result.diceRoll!.success) {
      // Robot should take damage or be affected
      expect(result.stateChanges).toBeDefined();
    }
  });

  test('creative action: use datapad as shield', () => {
    const state = createTestState({
      inventory: [ITEMS.datapad],
      locationNpcs: [NPC_TEMPLATES.hostile_robot],
    });

    const result = processTurn(state, 'utiliser le datapad comme bouclier');

    expect(result.parsed.verb).toBe(Verb.IMPROVISE_SHIELD);
    expect(result.parsed.absurd).toBe(false); // datapad is flat, holdable → valid shield
    expect(result.diceRoll).not.toBeNull();
  });
});
```

```typescript
// tests/integration/emergent-victory.test.ts

describe('Emergent Victory Conditions', () => {
  /**
   * Scenario: "Escape the Derelict"
   * Standard victory: Find keycard → unlock airlock → escape
   * Emergent victory: Depressurize the bridge → kills all threats → walk to airlock
   */
  test('player can trigger victory by killing threat through environment', () => {
    const scenario = loadTestScenario('escape_derelict');
    let state = initializeGame(scenario);

    // Player goes to bridge (has window with `transparent`, `breakable`, `sealed`)
    state = processTurn(state, 'aller au pont de commandement').newState;

    // Player shoots the window
    // Bridge is connected to exterior → depressurization
    const shootResult = processTurn(state, 'tirer sur la vitre avec le pistolet');

    // If roll succeeds...
    if (shootResult.diceRoll?.success) {
      state = shootResult.newState;

      // Bridge should now be depressurized
      expect(getLocationProperty(state, 'bridge', 'depressurized')).toBe(true);

      // The monster (organic, alive) in the bridge should be dead
      const monster = findNpc(state, 'creature_alpha');
      if (monster && monster.location === 'bridge') {
        expect(monster.alive).toBe(false);
      }

      // Main threat eliminated → check if victory condition is satisfiable
      const victoryCheck = checkVictoryConditions(state);
      // The "kill main threat" alternative victory should be triggered
      expect(victoryCheck.alternativeVictoryAvailable).toBe(true);
    }
  });

  test('environmental chain reactions propagate correctly', () => {
    const scenario = loadTestScenario('escape_derelict');
    let state = initializeGame(scenario);

    // Go to engine room, sabotage cooling system
    state = processTurn(state, 'aller à la salle des machines').newState;
    const sabotage = processTurn(state, 'saboter le système de refroidissement');

    if (sabotage.diceRoll?.success) {
      state = sabotage.newState;

      // Engine room should be heating up (on_fire or overheating)
      expect(
        getLocationProperty(state, 'engine_room', 'on_fire') ||
        getLocationProperty(state, 'engine_room', 'overheating')
      ).toBe(true);

      // After several turns, connected rooms should be affected
      for (let i = 0; i < 3; i++) {
        state = processTurn(state, 'attendre').newState;
      }

      // Adjacent corridor should have environmental warnings
      const corridor = getLocation(state, 'main_corridor');
      expect(corridor.environmentalHazards.length).toBeGreaterThan(0);
    }
  });
});
```

### Level 4 — Playtest Tools (manual, on demand)

```typescript
// tests/playtest/interactive-cli.ts

/**
 * Interactive CLI for playtesting without UI.
 *
 * Usage: npx tsx tests/playtest/interactive-cli.ts [scenario_name]
 *
 * Features:
 * - Type any action in the terminal
 * - See parsed action, dice roll, outcome, narrative
 * - Debug mode: show all properties, compatibility checks, difficulty calc
 * - Record mode: save session for replay tests
 * - God mode: auto-succeed all rolls (test narrative variety)
 * - Chaos mode: random dice results (test failure paths)
 */

import readline from 'readline';

const MODES = {
  normal: 'Normal gameplay',
  debug: 'Show all engine internals',
  record: 'Record session for replay',
  god: 'All rolls succeed (test narratives)',
  chaos: 'Random outcomes (test edge cases)',
};

async function main() {
  const scenario = loadScenario(process.argv[2] || 'escape_derelict');
  let state = initializeGame(scenario);
  let mode = process.argv[3] || 'debug';

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\n=== VOID WALKER PLAYTEST ===`);
  console.log(`Scenario: ${scenario.title}`);
  console.log(`Mode: ${MODES[mode]}`);
  console.log(`Type "help" for commands\n`);

  printNarrative(state.currentNarrative);

  const prompt = () => {
    rl.question('\n> ', (input) => {
      if (input === 'quit') { rl.close(); return; }
      if (input === 'help') { printHelp(); prompt(); return; }
      if (input === 'state') { printState(state); prompt(); return; }
      if (input === 'map') { printMap(state); prompt(); return; }
      if (input === 'inv') { printInventory(state); prompt(); return; }
      if (input.startsWith('mode ')) { mode = input.split(' ')[1]; prompt(); return; }

      const result = processTurn(state, input, { mode });
      state = result.newState;

      if (mode === 'debug') {
        console.log('\n--- PARSE ---');
        console.log(JSON.stringify(result.parsed, null, 2));
        console.log('\n--- COMPATIBILITY ---');
        console.log(JSON.stringify(result.compatibility, null, 2));
        console.log('\n--- DIFFICULTY ---');
        console.log(`Base:10 + verb:${result.verbMod} + context:${result.contextMod} = ${result.totalDifficulty}`);
      }

      if (result.diceRoll) {
        console.log(`\n🎲 D20: ${result.diceRoll.natural} + ${result.diceRoll.stat}(${result.diceRoll.statValue}) + ${result.diceRoll.modifier} = ${result.diceRoll.total} vs DC ${result.totalDifficulty}`);
        console.log(result.diceRoll.success ? '✅ SUCCESS' : '❌ FAILURE');
        if (result.diceRoll.natural === 20) console.log('⭐ CRITICAL SUCCESS!');
        if (result.diceRoll.natural === 1) console.log('💀 CRITICAL FAILURE!');
      }

      console.log('');
      printNarrative(result.narrative);

      if (result.suggestions.length > 0) {
        console.log('\nSuggestions:');
        result.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      }

      if (result.isEnding) {
        console.log(`\n=== FIN: ${result.endingType} ===`);
        rl.close();
        return;
      }

      prompt();
    });
  };

  prompt();
}
```

---

## Consequences & Emergent Scenario Impact

This is the system that makes "shooting the window kills the monster" work.

### World State Layer

Every location and entity has a **mutable state** that actions can modify:

```typescript
interface LocationState {
  // Environmental conditions (can change during gameplay)
  conditions: Set<EnvironmentalCondition>;
  // e.g.: 'pressurized', 'powered', 'lit', 'intact', 'locked'
  //       'depressurized', 'unpowered', 'dark', 'on_fire', 'flooded', 'breached'

  // Items currently present (can change)
  items: Item[];

  // NPCs currently present (can move, die)
  npcs: NpcState[];

  // Environmental features and their state
  features: Map<string, FeatureState>;
  // e.g.: 'bridge_window' → { intact: true, properties: [...] }
  //        After shooting: { intact: false, properties: [..., 'breached'] }

  // Active hazards
  hazards: Hazard[];
}

interface NpcState {
  id: string;
  alive: boolean;
  hp: number;
  location: string;
  disposition: Disposition;
  conditions: Set<NpcCondition>;
  // e.g.: 'conscious', 'wounded', 'stunned', 'restrained'
}
```

### Consequence Rules Engine

Every action outcome triggers a **consequence check**. Consequences are defined
as rules: `if (action + target + outcome + context) → world state change`.

```typescript
// Consequence rules — these are the "physics" of the game world

const CONSEQUENCE_RULES: ConsequenceRule[] = [
  // === DEPRESSURIZATION ===
  {
    id: 'breach_sealed_exterior',
    trigger: {
      verbs: [Verb.BREAK, Verb.SHOOT, Verb.STRIKE],
      targetProps: ['sealed', 'transparent'], // windows, viewports
      outcomeMin: 'success',
      targetFeatureConnectsTo: 'exterior', // or 'vacuum'
    },
    effects: [
      { type: 'add_condition', target: 'current_location', condition: 'depressurized' },
      { type: 'add_condition', target: 'current_location', condition: 'breached' },
      { type: 'remove_condition', target: 'current_location', condition: 'pressurized' },
      { type: 'add_hazard', target: 'current_location', hazard: 'vacuum_exposure' },
      // Kill all organic entities without EVA suit
      { type: 'apply_to_npcs', filter: { props: ['organic', 'alive'], lacks: ['sealed'] },
        effect: { type: 'kill', cause: 'vacuum' } },
      // Player takes damage unless in EVA suit
      { type: 'player_damage', amount: 5, perTurn: true,
        unless: { playerHasItem: { property: 'sealed' } } }, // EVA suit
      // Narrative trigger
      { type: 'force_narrative', template: 'depressurization_event' },
    ],
    cascades: [
      // Connected rooms with open doors also depressurize
      { condition: 'connected_rooms_with_open_doors', applyEffects: 'breach_propagation' },
    ],
  },

  // === FIRE ===
  {
    id: 'ignite_flammable',
    trigger: {
      verbs: [Verb.IGNITE, Verb.SHOOT], // laser can ignite
      targetProps: ['flammable'],
      outcomeMin: 'success',
    },
    effects: [
      { type: 'add_condition', target: 'current_location', condition: 'on_fire' },
      { type: 'add_hazard', target: 'current_location', hazard: 'fire',
        damage: 2, perTurn: true },
      { type: 'modify_condition', target: 'current_location',
        remove: 'oxygen_normal', add: 'oxygen_depleting' },
    ],
    cascades: [
      // Fire spreads to connected rooms after 3 turns
      { delay: 3, condition: 'connected_rooms_with_flammable',
        applyEffects: 'fire_spread' },
    ],
  },

  // === ELECTRONICS ===
  {
    id: 'destroy_electronic',
    trigger: {
      verbs: [Verb.BREAK, Verb.SHOOT, Verb.SABOTAGE, Verb.OVERRIDE],
      targetProps: ['electronic', 'powered'],
      outcomeMin: 'success',
    },
    effects: [
      { type: 'modify_feature', set: { powered: false, broken: true } },
      { type: 'add_hazard_chance', hazard: 'electrical_spark', chance: 0.3 },
    ],
    // Chain: destroying a security camera might disable security in linked areas
    triggers: [
      { condition: 'target_is_security', effect: 'reduce_security_level' },
      { condition: 'target_is_power_node', effect: 'cut_power_to_zone' },
      { condition: 'target_is_life_support', effect: 'oxygen_drain_zone' },
    ],
  },

  // === SABOTAGE / OBSTRUCTION ===
  {
    id: 'cover_sensor',
    trigger: {
      verbs: [Verb.COVER, Verb.SABOTAGE],
      targetProps: ['electronic', 'sensor'], // cameras, motion detectors
      itemUsedProps: ['sticky', 'flexible', 'coverable_material'], // tape, gum, cloth
      outcomeMin: 'success',
    },
    effects: [
      { type: 'modify_feature', set: { functional: false, obstructed: true } },
      { type: 'reduce_detection', zone: 'current_location', amount: 50 },
    ],
  },

  // === NPC DEATH → SCENARIO IMPACT ===
  {
    id: 'main_threat_eliminated',
    trigger: {
      condition: 'npc_killed',
      npcRole: 'main_threat', // tagged in scenario data
    },
    effects: [
      { type: 'unlock_alternative_victory', victoryId: 'threat_eliminated' },
      { type: 'modify_global', key: 'threat_level', value: 0 },
      { type: 'force_narrative', template: 'threat_eliminated_event' },
    ],
  },

  // === ITEM IMPROVISATION RESULTS ===
  {
    id: 'detach_body_part',
    trigger: {
      verbs: [Verb.PULL, Verb.CUT],
      targetType: 'body_part',
      targetParentProps: ['robotic'], // pulling arm off a robot
      outcomeMin: 'success',
    },
    effects: [
      // Create a new improvised item from the body part
      { type: 'create_item', template: {
          name: '{target_part_name}',
          nameFr: '{target_part_name_fr}',
          type: 'weapon',
          properties: ['metallic', 'blunt', 'holdable', 'heavy', 'improvised'],
          description: 'Un membre arraché de {target_name}. Lourd et contondant.',
        }
      },
      // Damage/weaken the source NPC
      { type: 'damage_npc', target: 'parent_npc', amount: 3 },
      { type: 'add_npc_condition', target: 'parent_npc', condition: 'weakened' },
    ],
  },
];
```

### Victory Condition Checking

Scenarios define multiple ways to win, including emergent ones:

```typescript
interface ScenarioVictoryConditions {
  // Standard victory path (what the scenario is designed around)
  primary: {
    description: string;
    requirements: VictoryRequirement[];
    // e.g.: [{ type: 'has_item', item: 'keycard' },
    //        { type: 'at_location', location: 'airlock' }]
  };

  // Alternative paths (pre-designed alternatives)
  alternatives: {
    id: string;
    description: string;
    requirements: VictoryRequirement[];
    // e.g.: "Destroy the alien queen" → requires main_threat dead
  }[];

  // Emergent triggers (unlocked by consequence rules at runtime)
  emergent: {
    id: string;
    description: string;
    unlockedBy: string; // consequence rule ID
    requirements: VictoryRequirement[];
  }[];

  // Defeat conditions
  defeat: {
    description: string;
    conditions: DefeatCondition[];
    // e.g.: hp <= 0, oxygen <= 0, all_exits_blocked
  }[];
}

/**
 * Check all victory/defeat conditions after every turn.
 * This is what makes "shooting the window kills the monster" work as a win condition.
 */
function checkEndConditions(state: GameState): EndConditionResult {
  const scenario = state.scenario;

  // Check defeat first
  if (state.player.hp <= 0) return { ended: true, type: 'defeat', cause: 'death' };
  if (state.player.oxygen <= 0) return { ended: true, type: 'defeat', cause: 'asphyxiation' };

  // Check primary victory
  if (allRequirementsMet(scenario.victory.primary.requirements, state)) {
    return { ended: true, type: 'victory', path: 'primary' };
  }

  // Check alternatives
  for (const alt of scenario.victory.alternatives) {
    if (allRequirementsMet(alt.requirements, state)) {
      return { ended: true, type: 'victory', path: alt.id };
    }
  }

  // Check emergent (unlocked at runtime by consequence rules)
  for (const emergent of state.unlockedEmergentVictories) {
    if (allRequirementsMet(emergent.requirements, state)) {
      return { ended: true, type: 'victory', path: emergent.id, emergent: true };
    }
  }

  return { ended: false };
}
```

---

## Development Phases (Revised)

### Phase 0 — Project Bootstrap (Day 1)
- [ ] Init Vite + React + TypeScript project
- [ ] Configure Vitest with coverage
- [ ] Set up folder structure (as above)
- [ ] Configure CI: `npm test` runs unit tests, `npm run test:stress` runs stress
- [ ] Write first test: `expect(true).toBe(true)` — verify pipeline works
- **Playtest gate:** `npm test` passes ✅

### Phase 1 — Property System + Verb Registry (Week 1)
- [ ] Implement `properties.ts` (all properties, inheritance by type)
- [ ] Implement `verbs.ts` (all verbs, aliases FR+EN, requirements)
- [ ] Implement `compatibility.ts` (verb × properties check)
- [ ] Unit tests for every property type inheritance
- [ ] Unit tests for every verb's required properties
- [ ] **Stress test:** 1000 items × all verbs → no crashes, all return valid results
- **Playtest gate:** run stress test, review any "surprising" results

### Phase 2 — Action Parser (Week 2)
- [ ] Implement tokenizer (FR + EN, stemming, article removal)
- [ ] Implement verb matcher (exact → stem → compound → fallback)
- [ ] Implement target resolver (inventory → location → environment → body parts)
- [ ] Implement difficulty calculator
- [ ] Unit tests for each parser strategy
- [ ] **Stress test:** 5000 random inputs → parser never throws
- [ ] **Stress test:** 200 curated "creative player inputs" → correct parsing
- **Playtest gate:** interactive CLI, type actions, see parsed results

### Phase 3 — Dice & State Engine (Week 2-3)
- [ ] Implement `dice.ts` (D20 + stat + modifier vs difficulty)
- [ ] Implement `state.ts` (GameState transitions, immutable updates)
- [ ] Implement `inventory.ts` (add/remove/use items)
- [ ] Implement `consequences.ts` (consequence rules engine)
- [ ] Unit tests for dice edge cases (nat 1, nat 20, modifiers)
- [ ] Unit tests for every consequence rule
- [ ] **Integration test:** full turn pipeline (parse → resolve → roll → consequences → new state)
- **Playtest gate:** interactive CLI with dice rolls and state changes

### Phase 4 — Narrative Templates (Week 3-4)
- [ ] Implement template engine with slots
- [ ] Write templates for top 15 verbs × 5 outcomes × 3 intensities = ~225 base templates
- [ ] Implement French text utilities (articles, accords grammaticaux)
- [ ] Absurd action templates
- [ ] Environmental consequence templates
- [ ] Unit tests: every template renders without empty slots
- [ ] **Stress test:** all verb × outcome combinations have at least one template
- **Playtest gate:** interactive CLI with full narrative output

### Phase 5 — Scenarios & Victory System (Week 4-5)
- [ ] Define scenario JSON schema
- [ ] Implement procedural scenario generator (modular graph assembly)
- [ ] Write 5 handcrafted scenarios with multiple victory paths
- [ ] Implement victory/defeat condition checker
- [ ] Implement pacing system (story beats, scene progression)
- [ ] **Integration test:** automated full playthrough of each scenario
- [ ] **Integration test:** emergent victory paths work
- [ ] **Stress test:** 100 random playthroughs per scenario → all end properly
- **Playtest gate:** play full sessions in CLI, try creative strategies

### Phase 6 — UI (Week 5-7)
- [ ] StatusBar, NarrativePanel, SuggestionButtons, ActionInput
- [ ] DiceRoll animation
- [ ] MapModal, InventoryModal
- [ ] Mobile-first responsive layout
- [ ] Component tests with @testing-library/react
- **Playtest gate:** play on phone, test touch interactions

### Phase 7 — AI Enhancement Layer (Week 7-8)
- [ ] Cloudflare Worker proxy for Gemini Flash
- [ ] AI narrator (replace template text when available)
- [ ] AI suggestions (enhance suggestion quality)
- [ ] Graceful degradation: AI down → templates seamlessly take over
- [ ] Rate limiting & quota management
- **Playtest gate:** play with AI on, play with AI off, compare experience

### Phase 8 — Polish & Launch (Week 8-10)
- [ ] PWA configuration (offline support, install prompt)
- [ ] Save/load game state
- [ ] Scenario browser
- [ ] Sound effects (optional)
- [ ] Performance optimization
- [ ] Lighthouse audit
- **Playtest gate:** give to 5 testers, collect feedback

---

## Test Commands

```bash
# Run unit tests (fast, on every save)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run stress tests (slow, before commits)
npm run test:stress

# Run integration tests
npm run test:integration

# Run ALL tests
npm run test:all

# Generate coverage report
npm run test:coverage

# Launch playtest CLI
npm run playtest

# Launch playtest in debug mode
npm run playtest:debug

# Launch playtest in god mode (all rolls succeed)
npm run playtest:god

# Launch playtest in chaos mode (random outcomes)
npm run playtest:chaos
```

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Default: unit tests only (fast)
    include: ['tests/unit/**/*.test.ts'],

    // Named configs for different test levels
    projects: [
      {
        name: 'unit',
        include: ['tests/unit/**/*.test.ts'],
        testTimeout: 5000,
      },
      {
        name: 'stress',
        include: ['tests/stress/**/*.test.ts'],
        testTimeout: 120000, // 2 minutes for combinatorial tests
      },
      {
        name: 'integration',
        include: ['tests/integration/**/*.test.ts'],
        testTimeout: 30000,
      },
    ],

    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/narration/**', 'src/content/**'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
```

---

## Non-Regression Guarantees

Every bug found → write a test that reproduces it → fix it → test stays forever.

```typescript
// tests/unit/engine/regressions.test.ts

describe('Regressions', () => {
  test('BUG-001: "tirer" should be SHOOT when followed by "sur"', () => {
    // Was incorrectly parsed as PULL
    expect(parseVerb('tirer sur le monstre')).toContain(Verb.SHOOT);
    expect(parseVerb('tirer la porte')).toContain(Verb.PULL);
  });

  test('BUG-002: throwing item should remove it from inventory', () => {
    const state = createTestState({ inventory: [ITEMS.debris] });
    const result = processTurn(state, 'lancer les débris sur le robot');
    if (result.diceRoll?.success || !result.diceRoll) {
      expect(result.newState.player.inventory).not.toContainEqual(
        expect.objectContaining({ id: 'debris' })
      );
    }
  });

  test('BUG-003: depressurization should not kill player in EVA suit', () => {
    const state = createTestState({
      inventory: [ITEMS.combinaison_eva],
      equipped: ['combinaison_eva'],
    });
    applyConsequence(state, 'depressurization');
    expect(state.player.hp).toBe(state.player.maxHp); // no damage
  });
});
```
