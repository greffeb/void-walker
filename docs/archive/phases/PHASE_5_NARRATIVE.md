# Phase 5 — Narrative Templates (Complete Spec)

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — mais le volume de contenu reste insuffisant (chantier **P2**).
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Status:** BRAINSTORM COMPLETE — READY FOR IMPLEMENTATION
> **Duration:** 1.5 weeks
> **Prerequisites:** Phase 4 complete
> **Reference docs:** `SCENARIO_DESIGN.md` (SS7), `GAME_SYSTEMS.md` (SS11), `design_refinements.md` (S7)
> **Last updated:** 2026-02-24

---

## Table of Contents

1. [Overview](#1-overview)
2. [7-Layer Composition System](#2-7-layer-composition-system)
3. [Template Slot System](#3-template-slot-system)
4. [French Grammar Engine](#4-french-grammar-engine)
5. [Sensory Detail Pools](#5-sensory-detail-pools)
6. [Secret Verbs](#6-secret-verbs)
7. [Configurable Narrative Length](#7-configurable-narrative-length)
8. [Location-Aware Narration & Gameplay Hints](#8-location-aware-narration--gameplay-hints)
9. [Template Authoring Format](#9-template-authoring-format)
10. [Template ID Naming Convention](#10-template-id-naming-convention)
11. [Anti-Repetition System](#11-anti-repetition-system)
12. [Absurd Action Tone](#12-absurd-action-tone)
13. [Content Volume & Template Counts](#13-content-volume--template-counts)
14. [File Architecture](#14-file-architecture)
15. [Deliverables](#15-deliverables)
16. [Acceptance Criteria](#16-acceptance-criteria)
17. [Key Design Decisions (Locked In)](#17-key-design-decisions-locked-in)

---

## 1. Overview

Every player action produces atmospheric French narrative text through a
template-based composition system. No AI required. The system composes
output from up to 7 independent layers, each selected based on different
contextual dimensions, creating effectively infinite combinatorial variety.

**Core principle:** The narrative system serves two masters simultaneously:
atmospheric immersion AND gameplay guidance. When the player lingers in a
location, atmosphere fades and gameplay hints emerge, subtly directing
attention to actionable elements without breaking immersion.

---

## 2. 7-Layer Composition System

### Layer Order & Probabilities (LOCKED)

| # | Layer | Mandatory? | Probability | Notes |
|---|-------|-----------|-------------|-------|
| 1 | **Action Result** | ✅ Always | 100% | What happened (the core narrative) |
| 2 | **Sensory Detail** | ❌ | 90% rolled actions, 50% auto-success | Texture and immersion |
| 3 | **Consequence** | Conditional | 100% if state changed, 0% otherwise | What changed in the world |
| 4 | **Atmosphere / Gameplay Hint** | ❌ | See below | Environment OR actionable guidance |
| 5 | **Player State** | Conditional | See below | Physical/mental condition |
| 6 | **Threat Hint** | Conditional | From threat director | Pacing and tension |
| 7 | **NPC Reaction** | Conditional | See below | NPC response to action |

### Detailed Probability Rules

**Layer 2 — Sensory Detail:**

```
IF outcome === 'auto_success' → 50% chance
ELSE → 90% chance
```

Rationale: mundane actions (picking up an object) don't need atmosphere,
but any action that required a roll should almost always get texture.

**Layer 4 — Atmosphere / Gameplay Hint:**

```
Base formula: 0.3 + (tension * 0.05)
  → tension 1 = 35%, tension 10 = 80%

Override: IF beat === 'climax' → 95% (forced)

Location cooldown applies (see Section 8):
  → Turn 1 in new room: 100% (first impression)
  → Turn 2-3: normal probability
  → Turn 4+: probability HALVED, replaced by gameplay hints
  → IF environment changes (fire, lights out, etc.): cooldown RESETS
```

**Layer 5 — Player State:**

```
IF playerHpPercent < 0.30 → 80% chance (intense snippets)
ELSE IF playerHpPercent < 0.50 → 30% chance (mild snippets)
ELSE IF playerConditions.size > 0 → 50% chance (condition-specific)
ELSE → 0%
```

This creates gradual degradation rather than a sudden wall of pain narration.
Mild snippets (HP 30-50%): "La fatigue commence à peser."
Intense snippets (HP <30%): "Le goût du sang est omniprésent."

**Layer 7 — NPC Reaction:**

```
IF action directly involves NPC → 100%
ELSE IF outcome is crit_success OR crit_failure → 100%
ELSE IF NPC is passive observer → 65% chance
```

Prevents spam when an NPC follows the player for 10+ turns.

### Layer Budget Cap (LOCKED)

The composer enforces a **maximum layer count per turn**, configurable via
the narrative length setting (see Section 7). When the budget is limited,
the composer scores each optional layer by contextual relevance and picks
the top N.

**Layer priority scoring:**

```typescript
function scoreLayerRelevance(layer: LayerType, ctx: NarrativeContext): number {
  switch (layer) {
    case 'consequence':
      // Always show if state changed — this is gameplay-critical info
      return ctx.stateChanges?.length ? 100 : 0;
    case 'sensory':
      return ctx.outcome === 'auto_success' ? 20 : 60;
    case 'atmosphere':
      return ctx.beat === 'climax' ? 90 : 30 + ctx.tension * 5;
    case 'player_state':
      return ctx.playerHpPercent < 0.3 ? 85 :
             ctx.playerConditions.size > 0 ? 50 : 0;
    case 'threat':
      return threatHintAvailable(ctx) ? 70 : 0;
    case 'npc_reaction':
      // Lower priority — trimmed first in "Efficace" mode
      const directlyInvolved = actionInvolvesNpc(ctx);
      return directlyInvolved ? 75 : 40;
  }
}
```

Consequences and critical player state almost always make the cut.
Atmosphere dominates at climax. NPC reactions get trimmed first in compact mode.

### The 12 Context Dimensions (LOCKED)

Every narrative output considers these dimensions:

```typescript
interface NarrativeContext {
  // 1. VERB — What action was performed
  verb: VerbId;
  verbCategory: VerbCategory;       // physical, technical, social, creative

  // 2. OUTCOME — How the dice resolved
  outcome: Outcome;                  // crit_success, success, partial, failure, crit_failure
  margin: number;                    // How far above/below the DC (-10 to +10)

  // 3. TARGET — What was the action applied to
  target: TargetInfo;                // name, type, properties, bodyPart?, grammar
  targetDisposition: Disposition;    // hostile, neutral, friendly, inanimate

  // 4. TOOL — What item was used (if any)
  toolUsed: ItemInfo | null;

  // 5. LOCATION — Where it happened
  location: LocationInfo;            // name, description, features, conditions
  environmentConditions: Set<string>; // dark, on_fire, depressurized, flooded...

  // 6. TENSION — Current story tension level
  tension: number;                   // 1-10
  beat: BeatZone;                    // intro, rising, midpoint, escalation, climax

  // 7. SETTING — World theme
  settingId: string;                 // derelict_ship, alien_ruins, space_station...

  // 8. PLAYER STATE — Physical condition
  playerHpPercent: number;           // 0.0 to 1.0
  playerConditions: Set<string>;     // wounded, poisoned, terrified...

  // 9. MODULE CONTEXT — Which scenario module we're in
  moduleId: string;
  moduleType: ModuleType;            // blocked_passage, patrol_enemy, puzzle...

  // 10. NPC PRESENT — Are NPCs watching/reacting
  npcsPresent: NpcInfo[];

  // 11. HISTORY — What happened recently
  recentEvents: string[];            // Last 3-5 events for continuity
  turnNumber: number;

  // 12. CREATIVITY — Was this a creative/unusual action
  isCreative: boolean;
  isAbsurd: boolean;

  // STATE CHANGES (from consequence engine)
  stateChanges?: StateChange[];
}
```

### Template Selection Algorithm (Priority Cascade — LOCKED)

```typescript
function selectTemplate(ctx: NarrativeContext): NarrativeTemplate {
  // PRIORITY 1: Specific — verb + target type + outcome + tension tier
  let template = findTemplate({
    verb: ctx.verb,
    targetType: ctx.target.type,
    outcome: ctx.outcome,
    tension: tensionTier(ctx.tension),
  });

  // PRIORITY 2: Verb + outcome (any target)
  if (!template) {
    template = findTemplate({
      verb: ctx.verb,
      outcome: ctx.outcome,
      tension: tensionTier(ctx.tension),
    });
  }

  // PRIORITY 3: Verb category + outcome (generic)
  if (!template) {
    template = findTemplate({
      verbCategory: ctx.verbCategory,
      outcome: ctx.outcome,
      tension: tensionTier(ctx.tension),
    });
  }

  // PRIORITY 4: Ultimate fallback
  if (!template) {
    template = GENERIC_FALLBACK[ctx.outcome];
  }

  return template;
}
```

### Full Composition Function

```typescript
function composeNarrative(ctx: NarrativeContext, settings: NarrativeSettings): string {
  const budget = settings.maxLayers; // 3, 5, or 7
  const candidates: ScoredLayer[] = [];

  // ── LAYER 1: ACTION RESULT (mandatory, always included) ──
  const actionTemplate = selectTemplate(ctx);
  const parts: string[] = [renderTemplate(actionTemplate, ctx)];
  let layersUsed = 1;

  // ── Score all optional layers ──

  // Layer 2: SENSORY DETAIL
  const sensoryProb = ctx.outcome === 'auto_success' ? 0.50 : 0.90;
  if (Math.random() < sensoryProb) {
    candidates.push({
      layer: 'sensory',
      score: scoreLayerRelevance('sensory', ctx),
      render: () => selectSensoryDetail(ctx),
    });
  }

  // Layer 3: CONSEQUENCE
  if (ctx.stateChanges?.length) {
    candidates.push({
      layer: 'consequence',
      score: scoreLayerRelevance('consequence', ctx),
      render: () => selectConsequenceNarrative(ctx),
    });
  }

  // Layer 4: ATMOSPHERE or GAMEPLAY HINT
  const atmosProb = ctx.beat === 'climax' ? 0.95 : 0.3 + ctx.tension * 0.05;
  const locationState = getLocationNarrationState(ctx.location.id);
  const effectiveAtmosProb = locationState.turnsSpentHere >= 4
    ? atmosProb * 0.5
    : locationState.turnsSpentHere === 0
    ? 1.0
    : atmosProb;

  if (Math.random() < effectiveAtmosProb) {
    if (locationState.turnsSpentHere >= 4) {
      // Replace atmosphere with gameplay hint
      candidates.push({
        layer: 'atmosphere',
        score: scoreLayerRelevance('atmosphere', ctx),
        render: () => selectGameplayHint(ctx),
      });
    } else {
      candidates.push({
        layer: 'atmosphere',
        score: scoreLayerRelevance('atmosphere', ctx),
        render: () => selectAtmosphereSnippet(ctx),
      });
    }
  }

  // Layer 5: PLAYER STATE
  const stateProb = ctx.playerHpPercent < 0.30 ? 0.80
    : ctx.playerHpPercent < 0.50 ? 0.30
    : ctx.playerConditions.size > 0 ? 0.50
    : 0;
  if (Math.random() < stateProb) {
    candidates.push({
      layer: 'player_state',
      score: scoreLayerRelevance('player_state', ctx),
      render: () => ctx.playerHpPercent < 0.30
        ? selectLowHpSnippet(ctx)
        : ctx.playerHpPercent < 0.50
        ? selectMildFatigueSnippet(ctx)
        : selectConditionSnippet(ctx),
    });
  }

  // Layer 6: THREAT HINT
  const threatHint = getThreatHint(ctx);
  if (threatHint) {
    candidates.push({
      layer: 'threat',
      score: scoreLayerRelevance('threat', ctx),
      render: () => threatHint,
    });
  }

  // Layer 7: NPC REACTION
  if (ctx.npcsPresent.length > 0) {
    const directlyInvolved = actionInvolvesNpc(ctx);
    const isCrit = ctx.outcome === 'crit_success' || ctx.outcome === 'crit_failure';
    const npcProb = directlyInvolved || isCrit ? 1.0 : 0.65;
    if (Math.random() < npcProb) {
      candidates.push({
        layer: 'npc_reaction',
        score: scoreLayerRelevance('npc_reaction', ctx),
        render: () => selectNpcReaction(ctx),
      });
    }
  }

  // ── Select top layers within budget ──
  const sorted = candidates.sort((a, b) => b.score - a.score);
  const selected = sorted.slice(0, budget - 1); // -1 because action already used

  for (const layer of selected) {
    const text = layer.render();
    if (text) parts.push(text);
  }

  return grammar.postProcess(parts.join(' '));
}
```

---

## 3. Template Slot System

### Available Slots (LOCKED)

| Slot | Resolves to | Example (FR) |
|------|------------|-------------|
| `{actor}` | Player name or "Vous" | "Vous" |
| `{target}` | Bare noun | "terminal" |
| `{def_target}` | Definite article + noun | "le terminal" / "la porte" |
| `{indef_target}` | Indefinite article + noun | "un terminal" / "une porte" |
| `{de_target}` | Contracted de + def article + noun | "du terminal" / "de la porte" |
| `{a_target}` | Contracted à + def article + noun | "au terminal" / "à la porte" |
| `{part_target}` | Partitive article + noun | "du sang" / "de la fumée" |
| `{target_article}` | Just the definite article | "le" / "la" / "l'" / "les" |
| `{target_adj:adj}` | Agreed adjective for target | "endommagé" → "endommagée" (fem) |
| `{target_part}` | Body part / component targeted | "le bras gauche" |
| `{tool_used}` | Item used (bare noun) | "tournevis" |
| `{def_tool}` | Definite article + tool | "le tournevis" |
| `{location}` | Current location name | "la salle des machines" |
| `{direction}` | Directional phrase | "vers le couloir" / "depuis la soute" |
| `{sound}` | Contextual sound | "un craquement sinistre" |
| `{fluid}` | Contextual fluid/substance | "du sang" / "de l'huile" |
| `{damage_desc}` | Damage description | "une fissure béante" |
| `{emotion}` | Emotional state descriptor | "avec détermination" |
| `{npc_name}` | NPC display name | "le Docteur Vasquez" |

### Conditional Block Syntax (LOCKED)

Templates support conditional rendering based on slot availability:

```
{?slot_name:text if slot is present|text if slot is absent}
```

**Examples:**

```
"Vous frappez {def_target}{?tool_used: avec {def_tool}|à mains nues}."
→ With wrench: "Vous frappez le terminal avec la clé à molette."
→ Bare-handed: "Vous frappez le terminal à mains nues."

"{?npc_name:{npc_name} observe la scène.|}"
→ With NPC: "Le Docteur Vasquez observe la scène."
→ No NPC: (empty string, omitted from output)
```

### Edge Case Handling (LOCKED)

**Null tool:** Handled by conditional blocks. No separate armed/unarmed templates
needed — the conditional syntax keeps template count manageable.

**Plural targets:** Templates can use `{def_target}` which auto-resolves to
"les robots" when the target is plural. The grammar engine handles
article selection and adjective agreement for plurals.

**Self-reference detection:** The composer checks if `{npc_name}` and `{target}`
refer to the same entity. If so, it substitutes a pronoun or rephrases:

```typescript
function detectSelfReference(ctx: NarrativeContext): boolean {
  return ctx.npcsPresent.some(npc =>
    npc.id === ctx.target?.id
  );
}
// If self-reference detected, NPC reaction layer is suppressed
// (the action template already describes the NPC interaction)
```

---

## 4. French Grammar Engine

### Architecture (LOCKED — Option B: Engine-Resolved)

Grammar logic lives in a dedicated language module behind an abstract interface.
Template authors write grammar-aware slot prefixes (`{def_target}`, `{a_target}`)
and the engine resolves them automatically. Authors never need to know object genders.

**File structure:**

```
src/
  i18n/
    index.ts                  # t() function, locale loader, active grammar engine
    types.ts                  # StringKey, GrammaticalInfo, GrammarEngine interface
    grammar/
      interface.ts            # Abstract GrammarEngine contract
      fr.ts                   # French implementation (the "béton" engine)
      en.ts                   # English implementation (trivial)
    locales/
      fr.ts                   # French string tables
      en.ts                   # English string tables
```

### GrammarEngine Interface

```typescript
// src/i18n/grammar/interface.ts

export type SlotModifier = 'bare' | 'def' | 'indef' | 'partitive' | 'de' | 'a';

export interface GrammaticalInfo {
  gender: 'M' | 'F' | 'N';     // N = neutral (English, future languages)
  startsWithVowel: boolean;
  plural: boolean;
}

export interface GrammarEngine {
  /** Locale code (e.g., 'fr', 'en') */
  readonly locale: string;

  /** Returns the correct article for a noun */
  article(
    type: 'definite' | 'indefinite' | 'partitive',
    info: GrammaticalInfo
  ): string;

  /** Applies adjective agreement (gender + number) */
  agree(adjective: string, info: GrammaticalInfo): string;

  /** Handles preposition + article contractions */
  contract(preposition: string, article: string): string;

  /** Resolves a grammar-aware slot (e.g., 'def' + 'terminal') */
  resolveSlot(
    modifier: SlotModifier,
    noun: string,
    info: GrammaticalInfo
  ): string;

  /** Language-specific post-processing (elision, spacing, etc.) */
  postProcess(text: string): string;
}
```

### French Implementation

```typescript
// src/i18n/grammar/fr.ts

import type { GrammarEngine, GrammaticalInfo, SlotModifier } from './interface';

/** Irregular adjectives that don't follow standard agreement rules */
const IRREGULAR_ADJECTIVES: Record<string, Record<string, string>> = {
  'beau':    { ms: 'beau',    fs: 'belle',    mp: 'beaux',    fp: 'belles' },
  'nouveau': { ms: 'nouveau', fs: 'nouvelle', mp: 'nouveaux', fp: 'nouvelles' },
  'vieux':   { ms: 'vieux',   fs: 'vieille',  mp: 'vieux',    fp: 'vieilles' },
  'blanc':   { ms: 'blanc',   fs: 'blanche',  mp: 'blancs',   fp: 'blanches' },
  'sec':     { ms: 'sec',     fs: 'sèche',    mp: 'secs',     fp: 'sèches' },
  'épais':   { ms: 'épais',   fs: 'épaisse',  mp: 'épais',    fp: 'épaisses' },
  'long':    { ms: 'long',    fs: 'longue',   mp: 'longs',    fp: 'longues' },
  'gros':    { ms: 'gros',    fs: 'grosse',   mp: 'gros',     fp: 'grosses' },
  'faux':    { ms: 'faux',    fs: 'fausse',   mp: 'faux',     fp: 'fausses' },
  'doux':    { ms: 'doux',    fs: 'douce',    mp: 'doux',     fp: 'douces' },
  'mort':    { ms: 'mort',    fs: 'morte',    mp: 'morts',    fp: 'mortes' },
  'ouvert':  { ms: 'ouvert',  fs: 'ouverte',  mp: 'ouverts',  fp: 'ouvertes' },
  'actif':   { ms: 'actif',   fs: 'active',   mp: 'actifs',   fp: 'actives' },
  'neuf':    { ms: 'neuf',    fs: 'neuve',    mp: 'neufs',    fp: 'neuves' },
  // Add more as needed during content authoring
};

function genderPluralKey(info: GrammaticalInfo): string {
  const g = info.gender === 'F' ? 'f' : 'm';
  const n = info.plural ? 'p' : 's';
  return `${g}${n}`;
}

export class FrenchGrammar implements GrammarEngine {
  readonly locale = 'fr';

  article(
    type: 'definite' | 'indefinite' | 'partitive',
    info: GrammaticalInfo
  ): string {
    if (type === 'definite') {
      if (info.plural) return 'les';
      if (info.startsWithVowel) return "l'";
      return info.gender === 'M' ? 'le' : 'la';
    }
    if (type === 'indefinite') {
      if (info.plural) return 'des';
      return info.gender === 'M' ? 'un' : 'une';
    }
    // partitive
    if (info.plural) return 'des';
    if (info.startsWithVowel) return "de l'";
    return info.gender === 'M' ? 'du' : 'de la';
  }

  contract(preposition: string, article: string): string {
    // Mandatory contractions in French
    if (preposition === 'de' && article === 'le') return 'du';
    if (preposition === 'de' && article === 'les') return 'des';
    if (preposition === 'à' && article === 'le') return 'au';
    if (preposition === 'à' && article === 'les') return 'aux';
    // No contraction with la, l', un, une, des
    if (article === "l'") return `${preposition} l'`;
    return `${preposition} ${article}`;
  }

  agree(adjective: string, info: GrammaticalInfo): string {
    // Check irregular table first
    const key = genderPluralKey(info);
    const irregular = IRREGULAR_ADJECTIVES[adjective];
    if (irregular && irregular[key]) return irregular[key];

    // Regular agreement rules
    let result = adjective;

    // Feminine: add -e (unless already ends in -e)
    if (info.gender === 'F' && !result.endsWith('e')) {
      // Special suffix patterns
      if (result.endsWith('er')) {
        result = result.slice(0, -2) + 'ère';
      } else if (result.endsWith('eux')) {
        result = result.slice(0, -3) + 'euse';
      } else if (result.endsWith('if')) {
        result = result.slice(0, -2) + 'ive';
      } else if (result.endsWith('el')) {
        result = result + 'le';
      } else {
        result = result + 'e';
      }
    }

    // Plural: add -s (unless already ends in -s, -x, -z)
    if (info.plural && !result.match(/[sxz]$/)) {
      if (result.endsWith('au') || result.endsWith('eu')) {
        result = result + 'x';
      } else {
        result = result + 's';
      }
    }

    return result;
  }

  resolveSlot(modifier: SlotModifier, noun: string, info: GrammaticalInfo): string {
    switch (modifier) {
      case 'bare':
        return noun;
      case 'def': {
        const art = this.article('definite', info);
        return info.startsWithVowel && !info.plural ? `${art}${noun}` : `${art} ${noun}`;
      }
      case 'indef':
        return `${this.article('indefinite', info)} ${noun}`;
      case 'partitive': {
        const part = this.article('partitive', info);
        return info.startsWithVowel && !info.plural ? `${part}${noun}` : `${part} ${noun}`;
      }
      case 'de': {
        const defArt = this.article('definite', info);
        return `${this.contract('de', defArt)} ${noun}`;
      }
      case 'a': {
        const defArt = this.article('definite', info);
        return `${this.contract('à', defArt)} ${noun}`;
      }
    }
  }

  postProcess(text: string): string {
    return text
      // Elision: "le arbre" → "l'arbre" (catch any missed by slot resolution)
      .replace(/\b(le|la|de|ne|se|je|me|te|que) ([aeéèêëiîïoôuûüyh])/gi,
        (_, word, vowel) => `${word.slice(0, -1)}'${vowel}`)
      // French typography: space before ; : ! ?
      .replace(/ ?([;:!?])/g, '\u00A0$1')
      // Clean up double spaces
      .replace(/  +/g, ' ')
      // Clean up space after l' or d'
      .replace(/([ld]') /gi, '$1')
      .trim();
  }
}
```

### English Implementation (Placeholder)

```typescript
// src/i18n/grammar/en.ts

export class EnglishGrammar implements GrammarEngine {
  readonly locale = 'en';

  article(type: 'definite' | 'indefinite' | 'partitive', info: GrammaticalInfo): string {
    if (type === 'definite') return 'the';
    if (type === 'partitive') return 'some';
    return info.startsWithVowel ? 'an' : 'a';
  }

  contract(preposition: string, article: string): string {
    return `${preposition} ${article}`;
  }

  agree(adjective: string, _info: GrammaticalInfo): string {
    return adjective; // English adjectives don't agree
  }

  resolveSlot(modifier: SlotModifier, noun: string, info: GrammaticalInfo): string {
    if (modifier === 'bare') return noun;
    if (modifier === 'def') return `the ${noun}`;
    if (modifier === 'indef') return `${info.startsWithVowel ? 'an' : 'a'} ${noun}`;
    if (modifier === 'partitive') return `some ${noun}`;
    if (modifier === 'de') return `of the ${noun}`;
    if (modifier === 'a') return `to the ${noun}`;
    return noun;
  }

  postProcess(text: string): string {
    return text.replace(/  +/g, ' ').trim();
  }
}
```

### Game Object Grammar Metadata (LOCKED)

Every game object carries grammar data per supported language:

```typescript
interface GameObjectDef {
  id: string;
  name: LocaleString;             // { fr: 'terminal', en: 'terminal' }
  grammar: {
    fr: GrammaticalInfo;          // { gender: 'M', startsWithVowel: false, plural: false }
    en: GrammaticalInfo;          // { gender: 'N', startsWithVowel: false, plural: false }
  };
  properties: PropertyTag[];
  // ... other fields
}

// Examples:
// { name: { fr: 'porte' },       grammar: { fr: { gender: 'F', startsWithVowel: false, plural: false } } }
// { name: { fr: 'armure' },      grammar: { fr: { gender: 'F', startsWithVowel: true,  plural: false } } }
// { name: { fr: 'robots' },      grammar: { fr: { gender: 'M', startsWithVowel: false, plural: true  } } }
// { name: { fr: 'écran' },       grammar: { fr: { gender: 'M', startsWithVowel: true,  plural: false } } }
```

### Adding a New Language (Future)

To add a new language (e.g., Spanish):

1. Implement `SpanishGrammar` class conforming to `GrammarEngine` interface
2. Add `es: GrammaticalInfo` to all game objects
3. Add `es: string` to all `LocaleString` values
4. Template structure stays **100% identical** — only slot resolution changes

---

## 5. Sensory Detail Pools

### Pool Sizes (LOCKED — Maximum Variety)

| Pool type | Minimum per pool | Target per pool | Reasoning |
|-----------|:---:|:---:|-----------|
| `default` (per setting) | **8** | **12** | Most-used pool, needs maximum variety |
| Environmental condition (`dark`, `on_fire`, etc.) | **4** | **6** | Active less often, contextually specific |
| Setting × condition combos | **3** | **4** | Very specific, acceptable to repeat sooner |

### Pool Inventory (Launch — 3 Settings)

```
derelict_ship:
  default:          12 snippets
  dark:              6 snippets
  on_fire:           6 snippets
  depressurized:     4 snippets
  flooded:           4 snippets
  time_pressure:     4 snippets
  Subtotal:         36

alien_ruins:
  default:          12 snippets
  dark:              6 snippets
  organic:           4 snippets  (alive/pulsing environment)
  unstable:          4 snippets  (shifting geometry)
  Subtotal:         26

space_station:
  default:          12 snippets
  dark:              6 snippets
  on_fire:           6 snippets
  depressurized:     4 snippets
  alarm:             4 snippets  (klaxons, red lighting)
  Subtotal:         32

TOTAL SENSORY SNIPPETS: ~94 (target: ~120 with buffer for future settings)
```

### Cross-Pool Mixing (LOCKED)

Rather than picking from a single pool, the composer can blend pools for richer
variety. When an environment condition is active, the selection process is:

```typescript
function selectSensoryDetail(ctx: NarrativeContext): string | null {
  const settingPool = SENSORY_POOLS[ctx.settingId];
  if (!settingPool) return null;

  // If an environmental condition is active, pick from the condition pool
  const activeConditions = [...ctx.environmentConditions];
  if (activeConditions.length > 0) {
    const condition = pickRandom(activeConditions);
    const conditionPool = settingPool[condition];
    if (conditionPool?.length) {
      return narrationMemory.select(conditionPool, 'sensory');
    }
  }

  // Otherwise, pick from default pool
  return narrationMemory.select(settingPool.default, 'sensory');
}
```

The condition pool takes priority over default because it's more contextually
relevant. The default pool provides variety when conditions are normal.
Cross-pool mixing happens naturally: consecutive turns might pull from `dark`
then `default` then `on_fire` as conditions change, creating varied texture.

---

## 6. Secret Verbs

### Verb Registry (LOCKED — 9 Secret Verbs)

| Verb | FR Aliases | EN Aliases | Cooldown Scope | DC | Stat |
|------|-----------|------------|---------------|:--:|------|
| PRAY | prier, implorer (dieu/les dieux) | pray | Per-location | 8 | CHA |
| DANCE | danser, bouger (au rythme) | dance | Per-location | 10 | CHA |
| NAME | nommer, baptiser, appeler | name, christen | Per-target (once per entity) | 6 | INT |
| SING | chanter, fredonner | sing, hum | Per-location | 8 | CHA |
| APOLOGIZE | s'excuser, pardon, demander pardon | apologize, say sorry | Per-NPC | 10 | CHA |
| SACRIFICE | sacrifier, offrir, se sacrifier | sacrifice, offer | **Per-scenario (once!)** | Auto-resolve | — |
| WAIT | attendre, patienter, rester | wait, stay | **Unlimited** (diminishing returns) | No roll | — |
| REMEMBER | se souvenir, se rappeler, penser | remember, recall | **Unlimited** (finite pool) | No roll | — |
| WHISPER | chuchoter, murmurer, souffler | whisper, murmur | Per-NPC per location | 8 | CHA |

### Properties

- All secret verbs have `secret: true` flag
- Secret verbs are **NEVER** included in suggestion generation
- Secret verbs use **favorable DCs** (lower than typical), NOT auto-success
- SACRIFICE is the sole exception: its cost (HP/item) IS the price, bypassing the roll

### Cooldown System (LOCKED)

Each secret verb works **once per context**, then locks with a rejection narrative.

```typescript
interface SecretVerbUsage {
  verbId: string;
  scopeKey: string;     // locationId, targetId, npcId, or scenarioId
  timesAttempted: number;
  firstUseTurn: number;
}

function canUseSecretVerb(verbId: string, ctx: NarrativeContext): SecretVerbResult {
  const usage = getSecretVerbUsage(verbId, getScopeKey(verbId, ctx));

  if (!usage || usage.timesAttempted === 0) {
    return { allowed: true };
  }

  // Already used in this scope — return rejection
  return {
    allowed: false,
    rejectionTier: usage.timesAttempted >= 3 ? 'annoyed' : 'blocked',
  };
}
```

### Rejection Narratives (Escalating)

Each secret verb needs **2-3 rejection templates** that escalate across attempts:

| Attempt | Tier | Example (SING) |
|:---:|------|--------------|
| 1st | `works` | *"Votre voix s'élève dans le silence. Les murs semblent absorber le son... puis le renvoyer, transformé."* |
| 2nd | `blocked` | *"Vous essayez de chanter à nouveau, mais les mots meurent dans votre gorge. L'écho a disparu."* |
| 3rd+ | `annoyed` | *"Rien. Le vaisseau a entendu votre chanson. Il n'en veut pas une autre."* |

**Template count:** 9 verbs × 2-3 rejections = **~22 rejection templates**

### Effects Per Verb (LOCKED)

| Verb | Flavor Effect | Situational Effect | Meta-Reward |
|------|--------------|-------------------|-------------|
| PRAY | Moment of calm, brief tension drop | Near religious/alien artifacts: may reveal hidden content | Black Box: "Someone prayed here. The marks suggest they knelt for hours." |
| DANCE | Absurd/funny, NPC reactions vary | Can distract hostile NPC (1 free turn) | Ship Memory: scuff marks on the floor |
| NAME | Emotional beat, bond with object/NPC | Named entities get +1 interaction bonus | Named entities persist across sessions in Black Box |
| SING | Atmospheric, eerie echo effect | Acoustic puzzles, attract/repel creatures | Black Box: "A melody, barely audible, still loops in the intercom." |
| APOLOGIZE | Emotional beat, NPC acknowledgment | NPC disposition +1 tier | Ship Memory: audio log of the apology |
| SACRIFICE | Dramatic, costly | Trade HP or item for guaranteed success on next action | Black Box: "Something was left behind here. Willingly." |
| WAIT | Reveals environmental info | Advances world clock: tension +1, NPCs move, O2 depletes | N/A (tactical tool, not meta) |
| REMEMBER | Pulls Black Box lore | Reveals context-relevant info from previous playthroughs | N/A (IS the meta-reward) |
| WHISPER | Subtle communication beat | Secret message to friendly NPC, may share hidden info | Ship Memory: "Someone whispered here. The words are lost." |

### WAIT — Special Rules (Unlimited, Diminishing)

WAIT works every time but with diminishing returns per location:

| Consecutive WAITs | Effect |
|:---:|---------|
| 1st | Useful info: patrol footsteps + direction, environmental detail |
| 2nd | Minor info: draft from a vent, distant sound, light flicker |
| 3rd | Nothing new: "Le silence s'étire. Rien de nouveau." + tension +1 |
| 4th+ | Just tension: "Chaque seconde qui passe joue contre vous." + tension +1 |

Each WAIT advances the world clock (tension ticks up, NPCs move, oxygen depletes).
This makes WAIT a legitimate tactical tool with real risk-reward.

### REMEMBER — Special Rules (Unlimited, Finite Pool)

REMEMBER always works but pulls from a finite pool of Black Box entries
relevant to the current location/context:

```
Pool full:   "Un flash. Quelqu'un est passé ici avant vous. Ils ont laissé..."
Pool empty:  "Vous fouillez votre mémoire, mais rien d'autre ne remonte."
```

---

## 7. Configurable Narrative Length

### Three Presets (LOCKED)

| Preset ID | Label (FR) | Label (EN) | Max Layers | ~Word Count | Target Audience |
|-----------|-----------|------------|:---:|:---:|--------------|
| `concise` | "Efficace" | "Concise" | 3 | ~40-60 mots | Speed runners, replay-heavy |
| `standard` | "Standard" | "Standard" | 5 | ~60-90 mots | Default for most players |
| `immersive` | "Immersif" | "Immersive" | 7 | ~90-130 mots | First playthrough, atmosphere lovers |

```typescript
interface NarrativeSettings {
  preset: 'concise' | 'standard' | 'immersive';
  maxLayers: 3 | 5 | 7;
}

const NARRATIVE_PRESETS: Record<string, NarrativeSettings> = {
  concise:   { preset: 'concise',   maxLayers: 3 },
  standard:  { preset: 'standard',  maxLayers: 5 },
  immersive: { preset: 'immersive', maxLayers: 7 },
};
```

The setting is exposed in the game options and can be changed mid-session.
The composer uses `maxLayers` as its budget, always including Layer 1 (Action),
then scoring and selecting the most relevant remaining layers.

**In concise mode (3 layers):** Action + the top 2 scored optional layers.
Consequences and critical player state almost always make the cut.
NPC reactions and atmosphere get trimmed first.

**In standard mode (5 layers):** Action + top 4. Most turns feel complete.
Only very low-priority layers get dropped.

**In immersive mode (7 layers):** All layers fire if their probability check passes.
Full cinematic experience.

---

## 8. Location-Aware Narration & Gameplay Hints

### Atmosphere Cooldown (LOCKED)

The composer tracks how long the player has been in the current location
and adjusts atmosphere behavior accordingly:

```typescript
interface LocationNarrationState {
  locationId: string;
  turnsSpentHere: number;
  atmosphereShownCount: number;
  sensoryIdsUsedHere: Set<string>;
  hintsShown: Set<string>;         // Track which hints player has seen
  environmentVersion: number;       // Increments when conditions change
}
```

**Rules:**

| Turns in location | Atmosphere behavior |
|:---:|------------------|
| 1 (first entry) | 100% — first impression, always fires |
| 2-3 | Normal probability (30-80% based on tension) |
| 4+ | Probability **halved**, replaced by gameplay hints |
| Environment changes | Cooldown **resets** (the room is "new" again) |

Environment changes that reset cooldown: fire starts, lights go out,
depressurization, flooding, NPC enters/leaves, explosion, door opens/closes.

### Gameplay Hint System (LOCKED)

When atmosphere fades (turn 4+ in same location), the composer replaces
Layer 4 with **gameplay-relevant observations**. These serve double duty:
atmospheric text AND player guidance.

**Cardinal rule:** Hints are written as **observations, never instructions.**

- ✅ "Un datapad repose sur la console, son écran encore allumé."
- ❌ "Vous pouvez ramasser le datapad sur la console."

```typescript
type HintCategory =
  | 'interactable_item'
  | 'searchable_area'
  | 'exit_visible'
  | 'exit_hidden'
  | 'npc_state'
  | 'environmental_change';

interface GameplayHint {
  id: string;
  category: HintCategory;
  priority: number;
  text: LocaleString;
  entityId: string;          // What object/exit/NPC this hint refers to
  shownToPlayer: boolean;
}
```

### Hint Generation Logic

```typescript
function generateLocationHints(
  ctx: NarrativeContext,
  state: GameState
): GameplayHint[] {
  const hints: GameplayHint[] = [];
  const location = state.currentLocation;

  // 1. Visible items not yet picked up
  for (const item of location.items.filter(i => !i.pickedUp)) {
    hints.push({
      id: `hint_item_${item.id}`,
      category: 'interactable_item',
      priority: item.isQuestRelevant ? 80 : 40,
      text: item.hintDescription,
      entityId: item.id,
      shownToPlayer: false,
    });
  }

  // 2. Searchable areas not yet searched
  for (const area of location.searchableAreas.filter(a => !a.searched)) {
    hints.push({
      id: `hint_search_${area.id}`,
      category: 'searchable_area',
      priority: 50,
      text: area.hintDescription,
      entityId: area.id,
      shownToPlayer: false,
    });
  }

  // 3. Exits
  for (const exit of location.exits) {
    const alreadyMentioned = locationState.hintsShown.has(`hint_exit_${exit.id}`);
    hints.push({
      id: `hint_exit_${exit.id}`,
      category: exit.isHidden ? 'exit_hidden' : 'exit_visible',
      priority: alreadyMentioned ? 10 : 60,
      text: exit.hintDescription,
      entityId: exit.id,
      shownToPlayer: alreadyMentioned,
    });
  }

  // 4. NPC state changes
  for (const npc of ctx.npcsPresent) {
    if (npc.dispositionChanged || npc.healthChanged) {
      hints.push({
        id: `hint_npc_${npc.id}`,
        category: 'npc_state',
        priority: 70,
        text: npc.stateHint,
        entityId: npc.id,
        shownToPlayer: false,
      });
    }
  }

  return hints.sort((a, b) => b.priority - a.priority);
}
```

### Anti-Softlock Escalation

If the player has been stuck (5+ turns in the same location without progress),
the hint system escalates priority:

```typescript
function adjustHintPriority(hint: GameplayHint, turnsStuck: number): number {
  if (turnsStuck < 5) return hint.priority;
  // Escalate quest-relevant items and exits
  if (hint.category === 'interactable_item' && hint.priority >= 60) {
    return hint.priority + (turnsStuck - 4) * 10; // Increasingly urgent
  }
  if (hint.category === 'exit_visible' || hint.category === 'exit_hidden') {
    return hint.priority + (turnsStuck - 4) * 5;
  }
  return hint.priority;
}
```

Hints remain in-world observations — the failsafe doesn't break immersion.
The player just starts noticing actionable elements more prominently.

### Worked Example

Player kills a xenomorph in a room, then lingers:

```
Turn 1 (kill): "La créature s'effondre. Sa carcasse encore fumante jonche
  le sol. L'air est lourd, saturé d'une odeur acide."
  [Action + Consequence + Sensory — full atmosphere]

Turn 2: "Vous reprenez votre souffle. Le silence revient, ponctué par
  le goutte-à-goutte d'un fluide corrosif."
  [Action + Atmosphere]

Turn 3: "..."
  [Player acts on something else]

Turn 4 (lingering): "Un datapad clignote faiblement sur le bureau, à moitié
  enfoui sous des débris."
  [Gameplay hint: interactable item]

Turn 5 (still here): "Plus loin, le couloir de maintenance s'enfonce dans
  l'obscurité. Une trappe au sol semble pouvoir s'ouvrir."
  [Gameplay hint: exits]
```

---

## 9. Template Authoring Format

### Format: TypeScript Objects with Strict Schema (LOCKED)

Templates are stored as typed TypeScript arrays. This provides:

- **Compile-time validation** — misspelled enum values caught instantly
- **IDE autocompletion** — accelerates writing 400+ templates
- **AI-assisted authoring** — Claude Code can generate batches from the type definition
- **Direct import** — no JSON parsing, no runtime validation needed

### Type Definitions

```typescript
// src/narration/types.ts

export interface ActionTemplate {
  id: string;                                    // Follows naming convention (Section 10)
  verb: VerbId | null;                           // null = category-level fallback
  targetType: PropertyTag | null;                // null = any target
  outcome: Outcome;                              // crit_success | success | partial | failure | crit_failure
  tension: 'low' | 'mid' | 'high';
  category: VerbCategory;                        // physical | technical | social | creative
  text: LocaleString;
}

export interface SensorySnippet {
  id: string;
  setting: string;                               // 'derelict_ship' | 'alien_ruins' | ...
  condition: string;                             // 'default' | 'dark' | 'on_fire' | ...
  text: LocaleString;
}

export interface AtmosphereSnippet {
  id: string;
  setting: string;
  tensionTier: 'low' | 'mid' | 'high' | 'climax';
  text: LocaleString;
}

export interface PlayerStateSnippet {
  id: string;
  type: 'low_hp' | 'mild_fatigue' | 'condition';
  condition?: string;                            // 'wounded' | 'poisoned' | 'terrified' | ...
  text: LocaleString;
}

export interface NpcReactionSnippet {
  id: string;
  disposition: Disposition;                      // friendly | hostile | neutral | frightened
  outcome: Outcome;
  text: LocaleString;                            // Uses {npc_name} slot
}

export interface ConsequenceSnippet {
  id: string;
  stateChangeType: string;                       // 'depressurize' | 'fire' | 'item_acquired' | ...
  text: LocaleString;
}

export interface GameplayHintTemplate {
  id: string;
  category: HintCategory;
  text: LocaleString;                            // Uses {slots} for entity names
}

export interface SecretVerbTemplate {
  id: string;
  verb: string;                                  // PRAY, DANCE, etc.
  type: 'discovery' | 'effect' | 'rejection';
  rejectionTier?: 'blocked' | 'annoyed';
  context?: string;                              // 'religious' | 'acoustic' | etc.
  text: LocaleString;
}
```

### Example Template File

```typescript
// src/content/templates/physical.ts

import type { ActionTemplate } from '../../narration/types';

export const PHYSICAL_TEMPLATES: ActionTemplate[] = [
  {
    id: 'physical_strike_any_crit_success_high',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'crit_success',
    tension: 'high',
    category: 'physical',
    text: {
      fr: "Un coup parfait. {def_target} se {target_adj:brisé} sous l'impact{?tool_used: — {def_tool} vibre encore dans votre main|, vos jointures sont en sang, mais ça en valait la peine}.",
      en: "",
    },
  },
  {
    id: 'physical_strike_breakable_success_mid',
    verb: 'STRIKE',
    targetType: 'breakable',
    outcome: 'success',
    tension: 'mid',
    category: 'physical',
    text: {
      fr: "Votre coup atteint {def_target}. {?sound:Un {sound} résonne dans le silence.|L'impact résonne sourdement.}",
      en: "",
    },
  },
  {
    id: 'physical_strike_any_failure_low',
    verb: 'STRIKE',
    targetType: null,
    outcome: 'failure',
    tension: 'low',
    category: 'physical',
    text: {
      fr: "Votre coup effleure {def_target} sans faire de dégâts. {?npc_name:{npc_name} vous observe sans commenter.|}",
      en: "",
    },
  },
  // ... 222 more templates for top 15 physical/technical/social verbs
];
```

### AI Authoring Workflow

1. Define the `ActionTemplate` schema and write **5-10 examples per category** to establish tone
2. Feed schema + examples to Claude Code, generate batches of 20-30 templates
3. Human review: check French quality, horror tone, slot correctness
4. Compiler validates all templates fit the type schema
5. Stress tests confirm full verb × outcome × tension coverage

---

## 10. Template ID Naming Convention

### Convention (LOCKED)

```
{category}_{verb}_{targetType}_{outcome}_{tension}
```

Null/any fields use `any`. Numeric suffix `_NNN` for multiple variants.

### Applied Examples

**Action templates (Layer 1):**

```
physical_strike_any_crit_success_high
physical_strike_breakable_success_mid
physical_throw_small_failure_low
physical_break_electronic_crit_failure_high
technical_hack_electronic_success_mid
technical_repair_mechanical_partial_low
technical_sabotage_any_crit_success_high
social_persuade_any_success_mid
social_intimidate_hostile_failure_high
creative_any_any_success_low                ← category-level fallback
creative_any_any_crit_failure_mid           ← category-level fallback
generic_any_any_failure_any                 ← ultimate fallback
```

**Sensory snippets (Layer 2):**

```
sensory_derelict_ship_default_001
sensory_derelict_ship_default_012          ← 12th variant
sensory_derelict_ship_dark_001
sensory_alien_ruins_default_001
sensory_space_station_on_fire_001
```

**Atmosphere snippets (Layer 4):**

```
atmosphere_derelict_ship_low_001
atmosphere_derelict_ship_high_003
atmosphere_alien_ruins_climax_001
```

**Player state snippets (Layer 5):**

```
condition_low_hp_001
condition_low_hp_005
condition_mild_fatigue_001                 ← NEW: HP 30-50%
condition_mild_fatigue_003
condition_wounded_001
condition_poisoned_001
condition_terrified_002
```

**NPC reaction snippets (Layer 7):**

```
npc_friendly_crit_success_001
npc_friendly_failure_002
npc_hostile_crit_failure_001
npc_neutral_success_001
npc_frightened_crit_success_001
```

**Consequence snippets (Layer 3):**

```
consequence_depressurize_001
consequence_fire_spread_001
consequence_item_acquired_001
consequence_door_opened_001
consequence_npc_killed_001
```

**Secret verb templates:**

```
secret_pray_discovery_001
secret_pray_effect_religious_001
secret_pray_rejection_blocked_001
secret_pray_rejection_annoyed_001
secret_sing_discovery_001
secret_sing_rejection_blocked_001
secret_wait_info_001
secret_wait_diminished_001
secret_wait_nothing_001
secret_remember_blackbox_001
secret_remember_empty_001
secret_sacrifice_discovery_001
secret_sacrifice_rejection_001            ← "Vous avez déjà tout donné."
```

**Gameplay hints:**

```
hint_interactable_item_001
hint_interactable_item_quest_001           ← quest-relevant variant
hint_searchable_area_001
hint_exit_visible_001
hint_exit_hidden_001
hint_npc_state_wounded_001
hint_npc_state_hostile_001
```

---

## 11. Anti-Repetition System

### NarrationMemory (LOCKED)

One buffer **per layer type**, buffer size = 10.

```typescript
class NarrationMemory {
  private buffers: Map<string, string[]> = new Map();
  private readonly bufferSize = 10;

  /**
   * Select a template from a pool, avoiding recently used ones.
   * Falls back to least-recently-used if all have been seen.
   */
  select<T extends { id: string }>(pool: T[], layerKey: string): T | null {
    if (pool.length === 0) return null;

    const buffer = this.buffers.get(layerKey) ?? [];

    // Filter out recently used
    const available = pool.filter(t => !buffer.includes(t.id));

    let chosen: T;
    if (available.length === 0) {
      // All exhausted — pick the LEAST recently used (first in buffer = oldest)
      const lruId = buffer[0];
      chosen = pool.find(t => t.id === lruId) ?? pickRandom(pool);
    } else {
      chosen = pickRandom(available);
    }

    // Update buffer
    buffer.push(chosen.id);
    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }
    this.buffers.set(layerKey, buffer);

    return chosen;
  }

  /** Reset all buffers (e.g., new game) */
  reset(): void {
    this.buffers.clear();
  }

  /** Reset buffer for a specific layer (e.g., entering new setting) */
  resetLayer(layerKey: string): void {
    this.buffers.delete(layerKey);
  }
}
```

**Buffer keys by layer:**

| Layer | Buffer key | Scope |
|-------|-----------|-------|
| Action | `action` | Global |
| Sensory | `sensory_{settingId}` | Per setting |
| Consequence | `consequence` | Global |
| Atmosphere | `atmosphere_{settingId}` | Per setting |
| Player state | `player_state` | Global |
| Threat hint | `threat` | Global |
| NPC reaction | `npc_{dispositionId}` | Per disposition |

Per-setting buffers reset when the player enters a new setting,
ensuring fresh sensory and atmosphere content in each world.

---

## 12. Absurd Action Tone

### Style: Deadpan / Sardonic (LOCKED)

The game treats absurd actions with the **same narrative gravity as serious ones**.
The humor emerges from the contrast between the formal, atmospheric prose and
the ridiculous action being described. Never break the fourth wall.

**Principles:**

- The engine never judges the player's action ("haha that's silly")
- The world reacts seriously to the absurd input
- Descriptions reveal absurdity through **detail**, not commentary
- NPCs react with in-character confusion, not meta-humor
- The dice still decide — an absurd action can crit-succeed and have real consequences

**Examples:**

```
SEDUCE the reinforced door:
  ✅ "Vous murmurez des mots doux à la porte blindée. Elle ne réagit pas.
      Personne ne réagit."
  ❌ "Haha ! Vous essayez de séduire une porte ! C'est drôle !"

EAT the robot arm:
  ✅ "Vous portez le bras mécanique à votre bouche. Le goût de lubrifiant
      et de métal tiède vous donne la nausée. Vos dents n'entament même
      pas l'alliage."
  ❌ "Vous ne pouvez pas manger ça, voyons !"

DANCE in the engine room (crit_success):
  ✅ "Votre corps se met en mouvement. Dans la lueur des moteurs, votre
      ombre dessine des formes étranges sur les murs. Le robot sentinelle
      pivote vers vous, capteurs clignotants — il ne sait pas comment
      interpréter ce qu'il voit. Vous avez 10 secondes d'avance."
  ❌ "You dance, distracting the robot. +1 turn."

THROW the medical kit at the alien:
  ✅ "La trousse de premiers secours percute le xénomorphe en pleine face.
      Des compresses et des seringues explosent dans les airs. La créature
      semble plus offensée que blessée."
```

---

## 13. Content Volume & Template Counts

### Complete Inventory (Updated)

```
LAYER 1 — ACTION TEMPLATES
  Top 15 verbs: 15 × 5 outcomes × 3 tensions        = 225 templates
  Next 15 verbs: fallback to generic                  =  90 templates
  Generic fallbacks: 4 categories × 5 × 3            =  60 templates
  Absurd action templates                             =  15 templates
  Subtotal:                                            390 templates

LAYER 2 — SENSORY SNIPPETS
  3 settings × (12 default + ~20 conditions)          = ~96 snippets
  Target with future settings buffer:                  ~120 snippets

LAYER 3 — CONSEQUENCE SNIPPETS
  20 state change types × 3 variants                  =  60 snippets

LAYER 4 — ATMOSPHERE SNIPPETS
  3 settings × 4 tension tiers × ~6 each             =  ~72 snippets
  Target:                                              ~80 snippets

LAYER 5 — PLAYER STATE SNIPPETS
  Low HP (intense): 8 snippets
  Mild fatigue (HP 30-50%): 6 snippets                ← NEW
  Conditions (5 types × 4 each): 20 snippets
  Subtotal:                                            ~34 snippets

LAYER 6 — THREAT HINTS
  5 beat zones × 8 hints each                         =  40 snippets

LAYER 7 — NPC REACTIONS
  4 dispositions × 5 outcomes × 2-3 variants          =  ~50 snippets

SECRET VERB TEMPLATES                                  ← NEW
  9 verbs × discovery template                        =   9 templates
  9 verbs × 1-2 effect templates                      =  ~14 templates
  9 verbs × 2-3 rejection templates                   =  ~22 templates
  WAIT diminishing returns (4 tiers)                  =   4 templates
  REMEMBER pool empty                                 =   2 templates
  Subtotal:                                            ~51 templates

GAMEPLAY HINT TEMPLATES                                ← NEW
  Item hints: 8 templates
  Searchable area hints: 6 templates
  Exit hints (visible + hidden): 8 templates
  NPC state hints: 6 templates
  Anti-softlock escalated hints: 4 templates
  Subtotal:                                            ~32 templates

═══════════════════════════════════════════════════════════
TOTAL UNIQUE CONTENT PIECES:                         ~929

× 2 languages (FR primary, EN deferred):           ~1,858 localized strings
  (EN ships with generic fallbacks initially)
═══════════════════════════════════════════════════════════
```

### Combinatorial Variety

```
390 × 120 × 60 × 80 × 34 × 40 × 50 = astronomically large

With layer budget cap at 5 and probability filters:
  Effective combinations per turn ≈ hundreds of thousands

Player will effectively NEVER read the exact same narrative twice.
```

---

## 14. File Architecture

### Directory Structure

```
src/
  i18n/
    index.ts                          # t() function, locale loader, getGrammar()
    types.ts                          # StringKey, GrammaticalInfo, GrammarEngine
    grammar/
      interface.ts                    # Abstract GrammarEngine contract
      fr.ts                           # French grammar (articles, accords, contractions)
      en.ts                           # English grammar (trivial placeholder)
    locales/
      fr.ts                           # French string tables
      en.ts                           # English string tables

  narration/
    types.ts                          # All template/snippet type definitions
    templateEngine.ts                 # Slot parser + grammar-aware rendering
    composer.ts                       # 7-layer narrative composition + budget system
    memory.ts                         # NarrationMemory (anti-repetition buffers)
    hints.ts                          # Gameplay hint generator

  content/
    templates/
      physical.ts                     # STRIKE, THROW, BREAK, PUSH, PULL, etc.
      technical.ts                    # HACK, REPAIR, SABOTAGE, etc.
      social.ts                       # PERSUADE, INTIMIDATE, DECEIVE, etc.
      creative.ts                     # Generic fallbacks for creative/unmatched verbs
      absurd.ts                       # Deadpan absurd action templates
      environmental.ts                # Depressurization, fire, flood, power cut consequences
      sensory.ts                      # Sensory detail pools per setting × condition
      atmosphere.ts                   # Atmosphere snippets per setting × tension
      conditions.ts                   # Player state: low HP, mild fatigue, conditions
      npcReactions.ts                 # NPC reaction snippets by disposition × outcome
      threats.ts                      # Threat hint snippets by beat zone
      secrets.ts                      # Secret verb: discovery, effect, rejection templates
      hints.ts                        # Gameplay hint templates

  engine/
    verbs.ts                          # (UPDATE) Add secret: true flag, rejection logic
```

---

## 15. Deliverables

| # | Task | Files | Test Coverage |
|---|------|-------|--------------|
| 1 | Template slot engine with grammar-aware prefixes and conditional blocks | `src/narration/templateEngine.ts` | Unit: all slot types render, conditionals resolve, self-reference detected |
| 2 | French grammar engine (articles, accords, contractions, elision, post-processing) | `src/i18n/grammar/fr.ts`, `interface.ts` | Unit: le/la/l'/les, un/une, du/de la/de l', au/à la, adjective agreement (regular + irregular), postProcess elision |
| 3 | English grammar placeholder | `src/i18n/grammar/en.ts` | Unit: basic article/slot resolution |
| 4 | 7-layer narrative composer with budget system and priority scoring | `src/narration/composer.ts` | Unit: produces 1-7 layers, respects budget, priority cascade works |
| 5 | NarrationMemory (anti-repetition buffers per layer) | `src/narration/memory.ts` | Unit: same template not picked within 10 uses, buffer resets work |
| 6 | Configurable narrative length (3 presets) | `src/narration/composer.ts` | Unit: concise=3 layers, standard=5, immersive=7 |
| 7 | Location-aware atmosphere cooldown | `src/narration/composer.ts` | Unit: turn 1=100%, turn 4+=halved, env change resets |
| 8 | Gameplay hint generator | `src/narration/hints.ts` | Unit: generates hints for items, areas, exits, NPCs; priority sorting; anti-softlock escalation |
| 9 | Action templates: top 15 verbs (225 templates) | `src/content/templates/physical.ts`, `technical.ts`, `social.ts` | Unit: every verb × outcome × tension has ≥1 template |
| 10 | Action templates: next 15 verbs (90 templates, fallback to generic) | Same files | Unit: fallback chain works for uncovered combos |
| 11 | Generic fallback templates (60) | `src/content/templates/creative.ts` | Unit: every category × outcome × tension has fallback |
| 12 | Absurd action templates (15) | `src/content/templates/absurd.ts` | Unit: deadpan tone, valid slot references |
| 13 | Environmental consequence templates (60) | `src/content/templates/environmental.ts` | Unit: depressurize, fire, flood, power cut × 3 variants |
| 14 | Sensory detail pools (~120 snippets) | `src/content/templates/sensory.ts` | Unit: every setting has ≥8 default + condition pools |
| 15 | Atmosphere snippets (~80) | `src/content/templates/atmosphere.ts` | Unit: every setting × tension tier has snippets |
| 16 | Player state snippets (~34) | `src/content/templates/conditions.ts` | Unit: low HP, mild fatigue, wounded, poisoned, terrified |
| 17 | NPC reaction snippets (~50) | `src/content/templates/npcReactions.ts` | Unit: all disposition × outcome combos covered |
| 18 | Threat hint snippets (40) | `src/content/templates/threats.ts` | Unit: all beat zones have hints |
| 19 | Secret verb templates (~51) | `src/content/templates/secrets.ts` | Unit: each verb has discovery + rejection templates |
| 20 | Secret verb cooldown system + parser integration | `src/engine/verbs.ts` (update) | Unit: secret verbs never in suggestions, cooldown works per scope, rejection tiers escalate |
| 21 | WAIT special handling (unlimited, diminishing) | `src/engine/verbs.ts`, `secrets.ts` | Unit: consecutive WAITs produce different info, tension increments |
| 22 | REMEMBER Black Box integration | `src/engine/verbs.ts`, `secrets.ts` | Unit: pulls from finite pool, graceful empty state |
| 23 | Gameplay hint templates (~32) | `src/content/templates/hints.ts` | Unit: all hint categories have templates |
| 24 | Tension-aware template selection (priority cascade) | `src/narration/composer.ts` | Unit: correct template selected per priority level |
| 25 | Template selection with NarrationMemory | `src/narration/composer.ts` | Integration: 20 sequential calls produce varied output |
| 26 | Update CLAUDE.md | `CLAUDE.md` | Accurate for Phase 6 |

---

## 16. Acceptance Criteria

```bash
# All unit tests pass
npm test

# Every verb × outcome combination has template coverage
npm run test:stress

# 20 sequential narratives in same context: 0 exact repeats
npm run test:integration

# French grammar: correct articles, agreements, contractions
npm run test:grammar

# Secret verbs: cooldown works, rejections escalate, WAIT diminishes
npm run test:secrets

# Narrative budget: concise mode ≤ 3 layers, standard ≤ 5, immersive ≤ 7
npm run test:budget

# Location hints: appear after turn 4, escalate after turn 8
npm run test:hints
```

### Human Review Gate

- [ ] Read 20 random narrative outputs aloud — "Does this read like a real space horror RPG?"
- [ ] Read 5 absurd action narratives — "Deadpan and sardonic, never condescending?"
- [ ] Read 5 secret verb discoveries — "Does this feel rewarding? Would I want to find more?"
- [ ] Check French grammar in 10 random outputs — "No broken articles or agreements?"
- [ ] Play 5 turns in the same room — "Do hints guide without being pushy?"
- [ ] Toggle narrative length setting — "Clear difference between Efficace and Immersif?"

---

## 17. Key Design Decisions (Locked In)

All decisions below are **final** and should not be reopened without a new brainstorm session.

| # | Decision | Details |
|---|----------|---------|
| 1 | 7-layer composition | Action + Sensory + Consequence + Atmosphere/Hints + Player state + Threat + NPC |
| 2 | Layer probabilities | Sensory 90%/50%, Atmos 30-80% (95% climax), Player state soft threshold at 50%, NPC 65% passive |
| 3 | Layer budget cap | Configurable: 3/5/7 layers. Priority scoring selects top N. |
| 4 | Template priority cascade | verb+target+outcome+tension → verb+outcome+tension → category+outcome+tension → generic fallback |
| 5 | Anti-repetition buffer | Size 10, per layer type, per-setting for sensory/atmosphere |
| 6 | Grammar engine | Option B: engine-resolved. Dedicated `GrammarEngine` interface per language. |
| 7 | Slot system | Grammar-aware prefixes (def_, indef_, de_, a_, part_) + conditional blocks {?slot:yes\|no} |
| 8 | French primary | All templates FR first. EN structure ready, content deferred post-launch. |
| 9 | Secret verbs | 9 verbs, favorable DC (not auto-success), one-shot per context with escalating rejections |
| 10 | SACRIFICE | Per-scenario, auto-resolve, costs HP or item |
| 11 | WAIT | Unlimited, diminishing returns, advances world clock |
| 12 | REMEMBER | Unlimited, finite Black Box pool per context |
| 13 | Narrative length | 3 presets (Efficace/Standard/Immersif), changeable mid-session |
| 14 | Location cooldown | Turn 1 = 100% atmos, Turn 4+ = halved, env change resets |
| 15 | Gameplay hints | Replace stale atmosphere, written as observations never instructions |
| 16 | Anti-softlock hints | Escalate priority after 5+ turns stuck |
| 17 | Template format | TypeScript objects with strict types, AI-assisted authoring |
| 18 | ID convention | `{category}_{verb}_{targetType}_{outcome}_{tension}` + `_NNN` suffix |
| 19 | Absurd tone | Deadpan / sardonic. Game treats absurd input with full narrative gravity. |
| 20 | Sensory pools | Max variety: 12 default, 4-6 per condition, cross-pool mixing |
| 21 | Player state | Two tiers: mild fatigue (HP 30-50%, 30%), intense (HP <30%, 80%) |
| 22 | NPC spam prevention | 65% for passive observers, 100% for direct involvement or crits |
| 23 | Self-reference detection | Suppress NPC reaction when NPC IS the target |
| 24 | Total content | ~929 unique pieces, ~1,858 localized strings |

---

> *"Chaque phrase est une couche. Chaque couche est un choix. Chaque choix crée un monde unique."*
