# Chantier 1 — Feature/Item State Engine

> **Référence d'implémentation pour Claude Code**
> **Prérequis** : Phase 6B complète (GameState étendu, processTurn scénario-aware)
> **Durée estimée** : 1 semaine
> **Principes** : État immutable, fonctions pures, rétro-compatible, tests first

---

## 1. Contexte et Diagnostic

### 1.1 Le Fossé Actuel

Le moteur possède **deux systèmes de définition d'entités complètement disjoints** :

**Registre principal** (fonctionne) — fichiers `src/content/items.ts`, `src/content/environments.ts` :

```typescript
// ItemDefinition (src/content/items.ts)
{
  id: 'laser_pistol',
  type: 'weapon',                          // ← type pour résolution de propriétés
  nameKey: 'item.laser_pistol',            // ← clé i18n
  descriptionKey: 'item.laser_pistol.description',
  aliasesKey: 'item.laser_pistol.aliases', // ← aliases FR/EN via i18n
  extra_props: ['electronic', 'ranged'],   // ← propriétés additionnelles
  remove_props: ['small'],
  damageBonus: 3,
}

// EnvironmentFeatureDefinition (src/content/environments.ts)
{
  id: 'blast_door',
  type: 'door',                            // ← type pour résolution
  nameKey: 'env.blast_door',
  descriptionKey: 'env.blast_door.description',
  aliasesKey: 'env.blast_door.aliases',
  extra_props: ['heavy', 'sealed', 'electronic', 'powered'],
}
```

**Définitions scénario** (cassé) — fichier `src/engine/scenario.ts` :

```typescript
// FeatureDefinition (scenario)
{
  id: 'emergency_locker',
  initialState?: 'locked',                 // ← état initial
  examineResult?: { fr: '...', en: '' },   // ← texte unique
  // PAS DE : type, properties, aliases, interactions
}

// ItemDefinition (scenario)
{
  id: 'access_keycard',
  hidden?: true,
  conditional?: string,
  examineResult?: { fr: '...', en: '' },
  // PAS DE : type, properties, aliases
}
```

### 1.2 Conséquences dans le Code

**Fichier `src/engine/scene.ts`** — fonctions `featureDefToInstance()` et `itemDefToResolvedTarget()` :

Quand l'ID n'est pas trouvé dans le registre principal, le code tombe dans un fallback :

```typescript
// scene.ts ligne ~featureDefToInstance (fallback scenario-only)
return {
  id, definitionId: id, nameKey,
  aliases: [id, frName.toLowerCase()],
  properties: ['tangible', 'visible'],  // ← AUCUNE propriété fonctionnelle
};

// scene.ts ligne ~itemDefToResolvedTarget (fallback scenario-only)
return {
  id, nameKey,
  properties: ['tangible', 'liftable', 'small'],  // ← propriétés génériques
  isVirtual: false, source: 'location',
  aliases: [id, frName.toLowerCase()],
};
```

**Fichier `src/engine/consequences.ts`** — `applySingleConsequence()` :

```typescript
case 'environment_change':
case 'atmosphere_change':
case 'ship_memory_mark':
  // Environmental changes are noted but not stored directly
  // (scene state belongs to the UI/content layer).
  return state;  // ← NO-OP
```

**Fichier `src/engine/types.ts`** — `GameState` :

Aucun champ pour stocker l'état des features (`featureStates`), les items révélés, les exits débloqués, ou les flags de scénario.

### 1.3 Objectif du Chantier

Faire en sorte que chaque feature et item de scénario soit un **citoyen de première classe** du moteur, avec :
- Des propriétés résolues via le système existant `resolveProperties()`
- Des aliases reconnus par le parser
- Un état mutable persistant dans `GameState`
- Des interactions déclaratives avec résultats mécaniques réels

---

## 2. Nouveaux Types

### 2.1 `ScenarioFeatureDefinition` — Remplacement de `FeatureDefinition`

**Fichier** : `src/engine/scenario.ts`

La `FeatureDefinition` actuelle est conservée telle quelle pour la rétro-compatibilité mais **étendue** avec des champs optionnels. Le nouveau type complet s'appelle `ScenarioFeatureDefinition`.

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO FEATURE — extends FeatureDefinition with engine integration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * State values for a scenario feature.
 * Extensible — any string is valid, but these are the standard ones.
 */
export type FeatureState =
  | 'intact' | 'damaged' | 'broken' | 'destroyed'
  | 'locked' | 'open' | 'closed'
  | 'active' | 'inactive' | 'offline'
  | 'empty'
  | string; // extensible

/**
 * Extended feature definition for scenario content.
 * All new fields are OPTIONAL to maintain backward compatibility with
 * existing FeatureDefinition instances in skeleton/module code.
 *
 * When the new fields are absent, scene.ts falls back to the existing
 * behavior (generic properties, i18n-based aliases).
 */
export interface ScenarioFeatureDefinition extends FeatureDefinition {
  // --- Engine integration (NEW) ---

  /** Environment feature type for property resolution.
   *  Maps to EnvironmentFeatureType: 'door' | 'terminal' | 'container' | 'vent' | 'panel' | etc.
   *  When provided, resolveProperties({ objectCategory:'environment', baseType }) is used. */
  readonly featureType?: EnvironmentFeatureType;

  /** Additional properties beyond type defaults (same as extra_props in registry). */
  readonly extraProperties?: readonly PropertyId[];

  /** Properties to remove from type defaults (same as remove_props in registry). */
  readonly removeProperties?: readonly PropertyId[];

  /** FR and EN aliases for parser recognition.
   *  When absent, falls back to scenarioNames + i18n key parsing. */
  readonly aliases?: {
    readonly fr: readonly string[];
    readonly en: readonly string[];
  };

  /** Per-state descriptions. Keys are FeatureState values.
   *  Replaces the single `examineResult` with state-aware descriptions.
   *  When present, `examineResult` is ignored. When absent, `examineResult` is used as fallback. */
  readonly descriptions?: Readonly<Record<string, LocaleString>>;

  /** Scenario interactions — the core of this chantier.
   *  Declarative rules: when verb+conditions match → apply results. */
  readonly interactions?: readonly ScenarioInteraction[];

  /** Item IDs that are hidden inside this feature (revealed on state change).
   *  Only relevant for containers. */
  readonly contains?: readonly string[];

  /** When this feature's state changes to a matching value, reveal this exit.
   *  Format: { state: 'open', exitId: 'reveal' } */
  readonly revealsExit?: {
    readonly state: FeatureState;
    readonly exitId: string;
  };

  /** Readable content shown when READ verb succeeds (for terminals, datapads). */
  readonly readableContent?: LocaleString;

  /** If true, this feature is purely decorative (no mechanical interaction expected).
   *  The engine will still allow standard verbs but won't raise "missing interaction" warnings. */
  readonly decorative?: boolean;
}
```

### 2.2 `ScenarioItemDefinition` — Remplacement de `ItemDefinition` (scénario)

**Fichier** : `src/engine/scenario.ts`

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO ITEM — extends scenario ItemDefinition with engine integration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extended item definition for scenario content.
 * All new fields are OPTIONAL for backward compatibility.
 */
export interface ScenarioItemDefinition extends ItemDefinition {
  // --- Engine integration (NEW) ---

  /** Item type for property resolution.
   *  Maps to ItemType: 'tool' | 'weapon' | 'consumable' | 'key_item' | 'data' | 'misc' */
  readonly itemType?: ItemType;

  /** Additional properties beyond type defaults. */
  readonly extraProperties?: readonly PropertyId[];

  /** Properties to remove from type defaults. */
  readonly removeProperties?: readonly PropertyId[];

  /** FR and EN aliases for parser recognition. */
  readonly aliases?: {
    readonly fr: readonly string[];
    readonly en: readonly string[];
  };

  /** Item description shown on EXAMINE (replaces examineResult for consistency). */
  readonly description?: LocaleString;

  /** Readable content for data items (datapads, notes, logs). */
  readonly readableContent?: LocaleString;

  /** Contextual USE interactions — "use this item ON that target".
   *  When the player does `USE <this item> ON <targetId>`, the matching
   *  interaction is resolved instead of the standard action pipeline. */
  readonly useOn?: readonly ItemUseOnDefinition[];

  /** Feature ID that must be in a specific state for this item to be visible.
   *  Used for items hidden inside containers.
   *  Example: { featureId: 'emergency_locker', requiredState: 'open' } */
  readonly revealedBy?: {
    readonly featureId: string;
    readonly requiredState: FeatureState;
  };
}

/**
 * Defines what happens when a scenario item is USED ON a specific target.
 */
export interface ItemUseOnDefinition {
  /** Target feature or item ID. */
  readonly targetId: string;
  /** The interaction to execute. */
  readonly interaction: ScenarioInteraction;
}
```

### 2.3 `ScenarioInteraction` — Le Cœur du Système

**Fichier** : `src/engine/scenario.ts`

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO INTERACTION — declarative action-result rules
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A declarative interaction rule attached to a scenario feature or item.
 *
 * Resolution order:
 *   1. Check trigger.verb matches the parsed action's verb
 *   2. Check trigger.requiredState matches current feature state (if specified)
 *   3. Check trigger.requiredItem is in player inventory (if specified)
 *   4. Check trigger.requiredFlag is set in scenarioFlags (if specified)
 *   5. If trigger.dc is null → auto-success
 *   6. If trigger.dc is a number → standard dice roll using trigger.stat
 *   7. Apply onSuccess or onFailure based on outcome
 *
 * Multiple interactions can exist for the same feature. The FIRST one whose
 * trigger conditions are ALL satisfied is used. Order matters.
 */
export interface ScenarioInteraction {
  /** When this interaction triggers. */
  readonly trigger: InteractionTrigger;
  /** What happens on success (or auto-success). */
  readonly onSuccess: InteractionResult;
  /** What happens on failure. Optional — when absent, the standard action
   *  template system generates the failure narrative. */
  readonly onFailure?: InteractionResult;
}

/**
 * Conditions that must ALL be met for the interaction to activate.
 */
export interface InteractionTrigger {
  /** Verb(s) that trigger this interaction. Single VerbId or array of alternatives. */
  readonly verb: VerbId | readonly VerbId[];

  /** Required feature state. Only checked for feature interactions. */
  readonly requiredState?: FeatureState;

  /** Item ID that must be in the player's inventory.
   *  For "use X on Y" interactions, this is automatically satisfied. */
  readonly requiredItem?: string;

  /** Scenario flag that must be set in GameState.scenarioFlags. */
  readonly requiredFlag?: string;

  /** Stat used for the dice roll.
   *  When absent with a non-null dc, defaults to the verb's standard stat. */
  readonly stat?: StatId;

  /** Difficulty class. null = auto-success (no roll needed). */
  readonly dc: number | null;
}

/**
 * The effects of a successful or failed interaction.
 * All fields are optional — only specify what changes.
 */
export interface InteractionResult {
  /** New state for the feature (mutates GameState.featureStates). */
  readonly newState?: FeatureState;

  /** Standard consequences to apply (damage, heal, inventory_add, etc.). */
  readonly consequences?: readonly Consequence[];

  /** Narrative text override. When provided, replaces the template-generated text.
   *  When absent, the standard narrative composer is used. */
  readonly narrative?: LocaleString;

  /** Item IDs that become visible in the current location.
   *  Added to GameState.revealedItems. */
  readonly revealsItems?: readonly string[];

  /** Exit ID that becomes available from the current location.
   *  Added to GameState.unlockedExits. */
  readonly revealsExit?: string;

  /** Properties to ADD to the feature (mutates the runtime property set). */
  readonly addProperties?: readonly PropertyId[];

  /** Properties to REMOVE from the feature. */
  readonly removeProperties?: readonly PropertyId[];

  /** Scenario flag to set in GameState.scenarioFlags. */
  readonly flagSet?: string;

  /** Scenario flag to unset. */
  readonly flagUnset?: string;

  /** If true, the requiredItem is consumed (removed from inventory). */
  readonly consumeItem?: boolean;
}
```

### 2.4 Type Guards et Utilitaires

**Fichier** : `src/engine/scenario.ts`

```typescript
/**
 * Type guard: does this FeatureDefinition have enriched scenario data?
 */
export function isEnrichedFeature(
  def: FeatureDefinition,
): def is ScenarioFeatureDefinition {
  const d = def as ScenarioFeatureDefinition;
  return d.featureType !== undefined
    || d.interactions !== undefined
    || d.aliases !== undefined
    || d.descriptions !== undefined;
}

/**
 * Type guard: does this ItemDefinition have enriched scenario data?
 */
export function isEnrichedItem(
  def: ItemDefinition,
): def is ScenarioItemDefinition {
  const d = def as ScenarioItemDefinition;
  return d.itemType !== undefined
    || d.aliases !== undefined
    || d.useOn !== undefined;
}
```

---

## 3. Extensions de GameState

### 3.1 Nouveaux Champs

**Fichier** : `src/engine/types.ts` — ajouter dans l'interface `GameState`

```typescript
// === Chantier 1 additions ===

/** Per-feature mutable state. Key = featureId, value = current FeatureState.
 *  Initialized from each feature's `initialState` at game start.
 *  Updated by ScenarioInteraction results via setFeatureState(). */
readonly featureStates: Readonly<Record<string, string>>;

/** Items revealed by container openings or other interactions.
 *  Key = itemId, value = true when revealed.
 *  Only items with `revealedBy` in their definition are tracked here.
 *  Items WITHOUT `revealedBy` are always visible (existing behavior). */
readonly revealedItems: Readonly<Record<string, boolean>>;

/** Exits unlocked by interactions.
 *  Key = composite `${fromLocationId}:${toLocationId}`, value = true.
 *  An exit is available if: (a) it's in the graph edges AND (b) it's NOT
 *  in the lockedExits set, OR it IS in unlockedExits. */
readonly unlockedExits: Readonly<Record<string, boolean>>;

/** Scenario-wide flags set by interactions.
 *  Key = flag name (string), value = true when set.
 *  Checked by InteractionTrigger.requiredFlag. */
readonly scenarioFlags: Readonly<Record<string, boolean>>;
```

### 3.2 Mise à Jour de `createInitialGameState()`

**Fichier** : `src/engine/types.ts`

Ajouter les valeurs par défaut dans la factory :

```typescript
featureStates: {},
revealedItems: {},
unlockedExits: {},
scenarioFlags: {},
```

### 3.3 Mise à Jour de `initGame()`

**Fichier** : `src/engine/game.ts`

Lors de l'initialisation d'une partie, peupler `featureStates` à partir du scénario assemblé :

```typescript
// Dans initGame(), après l'assemblage du scénario :

// Initialize featureStates from all features in all location nodes
const featureStates: Record<string, string> = {};
for (const node of scenario.graph.nodes) {
  for (const feat of node.features) {
    if (feat.initialState) {
      featureStates[feat.id] = feat.initialState;
    }
  }
}
// → mettre dans le GameState retourné
```

---

## 4. Feature State Manager

### 4.1 Nouveau Fichier : `src/engine/featureState.ts`

Fonctions pures pour manipuler l'état des features dans GameState.

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// src/engine/featureState.ts — Feature state management (pure functions)
// ═══════════════════════════════════════════════════════════════════════════

import type { GameState } from './types';
import type { FeatureState, ScenarioFeatureDefinition, FeatureDefinition, LocaleString } from './scenario';

/**
 * Get the current state of a feature.
 * Returns the runtime state from GameState.featureStates,
 * or the feature's initialState from the definition,
 * or 'intact' as ultimate fallback.
 */
export function getFeatureState(
  state: GameState,
  featureId: string,
): FeatureState;

/**
 * Set the state of a feature. Returns new GameState (immutable).
 */
export function setFeatureState(
  state: GameState,
  featureId: string,
  newState: FeatureState,
): GameState;

/**
 * Get the appropriate description for a feature based on its current state.
 *
 * Resolution order:
 *   1. ScenarioFeatureDefinition.descriptions[currentState]
 *   2. ScenarioFeatureDefinition.descriptions['default']
 *   3. FeatureDefinition.examineResult (legacy fallback)
 *   4. null (no description available)
 */
export function getFeatureDescription(
  featureDef: FeatureDefinition,
  currentState: FeatureState,
  locale: 'fr' | 'en',
): string | null;

/**
 * Set a scenario flag. Returns new GameState.
 */
export function setScenarioFlag(
  state: GameState,
  flagName: string,
): GameState;

/**
 * Unset a scenario flag. Returns new GameState.
 */
export function unsetScenarioFlag(
  state: GameState,
  flagName: string,
): GameState;

/**
 * Check if a scenario flag is set.
 */
export function hasScenarioFlag(
  state: GameState,
  flagName: string,
): boolean;

/**
 * Mark an item as revealed. Returns new GameState.
 */
export function revealItem(
  state: GameState,
  itemId: string,
): GameState;

/**
 * Check if an item is revealed (or has no revealedBy constraint).
 */
export function isItemRevealed(
  state: GameState,
  itemDef: { readonly revealedBy?: { readonly featureId: string; readonly requiredState: FeatureState } },
): boolean;

/**
 * Unlock an exit. Returns new GameState.
 * Key format: `${fromLocationId}:${toLocationId}`
 */
export function unlockExit(
  state: GameState,
  fromLocationId: string,
  toLocationId: string,
): GameState;

/**
 * Check if an exit is unlocked (or was never locked).
 */
export function isExitUnlocked(
  state: GameState,
  fromLocationId: string,
  toLocationId: string,
): boolean;
```

### 4.2 Notes d'Implémentation

- Toutes les fonctions sont **pures** : elles retournent un nouvel objet, jamais de mutation.
- Pattern standard du projet : `{ ...state, featureStates: { ...state.featureStates, [id]: newValue } }`.
- Les fonctions `get*` ne modifient jamais l'état.
- `isItemRevealed` retourne `true` si l'item n'a pas de champ `revealedBy` (comportement actuel préservé).

---

## 5. Mise à Jour de `scene.ts` — Résolution Enrichie

### 5.1 `featureDefToInstance()` — Remplacement du Fallback

**Fichier** : `src/engine/scene.ts`

Actuellement, quand un ID de feature n'est pas dans `ENVIRONMENT_FEATURE_DEFINITIONS`, le code retourne des propriétés génériques. Il faut maintenant vérifier si la définition du scénario est enrichie.

```typescript
function featureDefToInstance(
  id: string,
  featureDef?: FeatureDefinition,   // ← nouveau paramètre optionnel
  currentState?: FeatureState,       // ← état actuel depuis GameState.featureStates
): EnvironmentFeatureInstance {
  // 1. Check registre principal (existant, inchangé)
  const registryDef = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (registryDef) {
    // ... code existant inchangé ...
  }

  // 2. ★ NOUVEAU : Check si la définition scénario est enrichie
  if (featureDef && isEnrichedFeature(featureDef)) {
    const enriched = featureDef as ScenarioFeatureDefinition;
    
    // Résoudre les propriétés via le système standard
    const baseProperties = enriched.featureType
      ? resolveProperties({
          objectCategory: 'environment',
          baseType: enriched.featureType,
          extra_props: enriched.extraProperties ?? [],
          remove_props: enriched.removeProperties ?? [],
        })
      : ['tangible', 'visible'] as PropertyId[];
    
    // Ajuster les propriétés selon l'état actuel
    // Ex: si état = 'locked', ajouter 'locked' ; si état = 'open', retirer 'locked', ajouter 'open'
    const stateProperties = deriveStateProperties(currentState ?? enriched.initialState);
    const properties = mergeProperties(baseProperties, stateProperties);
    
    // Résoudre les aliases
    const locale = getCurrentLocale(); // 'fr' ou 'en'
    const aliasesFromDef = enriched.aliases
      ? [...enriched.aliases[locale]]
      : [];
    const nameKey = `env.${id}` as StringKey;
    const frName = resolveDisplayName(nameKey, id);
    const aliases = [id, frName.toLowerCase(), ...aliasesFromDef];
    
    return { id, definitionId: id, nameKey, aliases, properties };
  }

  // 3. Fallback existant (scenario-only sans enrichissement)
  const nameKey = `env.${id}` as StringKey;
  const frName = resolveDisplayName(nameKey, id);
  return {
    id, definitionId: id, nameKey,
    aliases: [id, frName.toLowerCase()],
    properties: ['tangible', 'visible'],
  };
}
```

### 5.2 `itemDefToResolvedTarget()` — Même Pattern

Même approche pour les items de scénario enrichis.

### 5.3 `deriveStateProperties()` — Nouvelle Fonction Helper

```typescript
/**
 * Derive additional properties from the current state of a feature.
 * These properties are ADDED to (or REMOVED from) the base properties.
 */
function deriveStateProperties(
  state: FeatureState | undefined,
): { add: PropertyId[]; remove: PropertyId[] } {
  switch (state) {
    case 'locked':
      return { add: ['locked'], remove: ['open'] };
    case 'open':
      return { add: ['open', 'openable'], remove: ['locked', 'sealed'] };
    case 'closed':
      return { add: ['openable'], remove: ['locked', 'open'] };
    case 'broken':
    case 'destroyed':
      return { add: ['broken'], remove: ['locked', 'sealed', 'powered'] };
    case 'active':
      return { add: ['powered', 'active'], remove: ['unpowered', 'inactive'] };
    case 'inactive':
    case 'offline':
      return { add: ['unpowered'], remove: ['powered', 'active'] };
    case 'damaged':
      return { add: ['broken', 'easily_repairable'], remove: [] };
    case 'empty':
      return { add: ['open'], remove: ['locked', 'sealed'] };
    default:
      return { add: [], remove: [] };
  }
}
```

### 5.4 Filtrage des Items par `revealedBy`

Dans `getSceneContext()`, filtrer les items dont le `revealedBy` n'est pas satisfait :

```typescript
// Dans getSceneContext(), lors de la construction de locationItems :
const locationItems: ResolvedTarget[] = node.items
  .filter(item => isItemAvailable(visitState, item.id))
  .filter(item => {
    // ★ NOUVEAU : check revealedBy constraint
    if (isEnrichedItem(item)) {
      const enriched = item as ScenarioItemDefinition;
      if (enriched.revealedBy) {
        return isItemRevealed(state, enriched);
      }
    }
    return true; // pas de contrainte → toujours visible
  })
  .map(item => scenarioItemToResolvedTarget(item));
```

### 5.5 Filtrage des Exits par `unlockedExits`

Dans `getSceneContext()`, les exits conditionnels (nécessitant un flag ou un état de feature) sont filtrés :

```typescript
// DÉCISION : Les exits verrouillés sont gérés via les obstacles existants.
// Un exit est "verrouillé" quand l'obstacle du nœud cible n'est pas résolu.
// Le nouveau système ajoute un mécanisme complémentaire :
// certaines features (portes, grilles) peuvent RÉVÉLER de nouvelles exits
// via revealsExit dans leur interaction onSuccess.
// Ces exits dynamiques sont stockées dans GameState.unlockedExits.
```

---

## 6. Interaction Resolver

### 6.1 Nouveau Fichier : `src/engine/interactionResolver.ts`

Ce fichier contient la logique de résolution des interactions scénario.

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// src/engine/interactionResolver.ts — Scenario interaction resolution
// ═══════════════════════════════════════════════════════════════════════════

import type { GameState, RngFn, Consequence } from './types';
import type { VerbId } from './verbs';
import type { PropertyId } from './properties';
import type {
  ScenarioInteraction, InteractionResult, FeatureState,
  ScenarioFeatureDefinition, ScenarioItemDefinition,
  FeatureDefinition, ItemDefinition,
  LocaleString,
} from './scenario';
import { isEnrichedFeature, isEnrichedItem } from './scenario';

// === TYPES ===

/** Result of attempting to resolve a scenario interaction. */
export interface InteractionResolution {
  /** Whether an interaction was found and resolved. */
  readonly matched: boolean;

  /** Whether the action succeeded (true), failed (false), or was auto-success (true). */
  readonly success: boolean;

  /** The dice roll result, if a roll was made. Null for auto-success. */
  readonly diceRoll: import('./types').DiceResult | null;

  /** The InteractionResult to apply (onSuccess or onFailure). */
  readonly result: InteractionResult;

  /** The narrative override, if any. Null means use standard templates. */
  readonly narrativeOverride: LocaleString | null;

  /** Updated feature state, if changed. */
  readonly newFeatureState: FeatureState | null;

  /** Consequences to apply via applyConsequences(). */
  readonly consequences: readonly Consequence[];

  /** Items to reveal. */
  readonly itemsToReveal: readonly string[];

  /** Exit to unlock. */
  readonly exitToUnlock: string | null;

  /** Flag to set. */
  readonly flagToSet: string | null;

  /** Flag to unset. */
  readonly flagToUnset: string | null;

  /** Item to consume from inventory. */
  readonly itemToConsume: string | null;

  /** Properties to add to feature runtime. */
  readonly propertiesToAdd: readonly PropertyId[];

  /** Properties to remove from feature runtime. */
  readonly propertiesToRemove: readonly PropertyId[];
}

/** A "no match" result — signals processTurn to use the standard pipeline. */
export const NO_INTERACTION_MATCH: InteractionResolution = {
  matched: false,
  success: false,
  diceRoll: null,
  result: {},
  narrativeOverride: null,
  newFeatureState: null,
  consequences: [],
  itemsToReveal: [],
  exitToUnlock: null,
  flagToSet: null,
  flagToUnset: null,
  itemToConsume: null,
  propertiesToAdd: [],
  propertiesToRemove: [],
};

// === RESOLUTION ===

/**
 * Attempt to resolve a parsed action against scenario interactions.
 *
 * Called by processTurn BEFORE the standard action resolution pipeline.
 * If this returns matched=true, processTurn uses the InteractionResolution
 * instead of the standard dice→consequence→narrative flow.
 *
 * @param verb        The parsed verb from the player's action
 * @param targetId    The resolved target's ID
 * @param targetDef   The feature/item definition from the scenario graph
 * @param state       Current game state (for checking flags, inventory, feature states)
 * @param locationId  Current player location ID
 * @param rng         Injectable RNG
 * @returns           InteractionResolution (matched=false if no interaction found)
 */
export function resolveScenarioInteraction(
  verb: VerbId,
  targetId: string,
  targetDef: FeatureDefinition | ItemDefinition | null,
  state: GameState,
  locationId: string,
  rng: RngFn,
): InteractionResolution;

/**
 * Attempt to resolve a "use item on target" interaction.
 *
 * Called when the parser identifies USE <item> ON <target>.
 *
 * @param itemId      The item being used (from player's inventory)
 * @param itemDef     The item's definition from the scenario
 * @param targetId    The target feature/item ID
 * @param state       Current game state
 * @param locationId  Current player location ID
 * @param rng         Injectable RNG
 */
export function resolveItemUseOn(
  itemId: string,
  itemDef: ItemDefinition,
  targetId: string,
  state: GameState,
  locationId: string,
  rng: RngFn,
): InteractionResolution;
```

### 6.2 Algorithme de Résolution

```
resolveScenarioInteraction(verb, targetId, targetDef, state, locationId, rng):

  1. Si targetDef est null ou n'est pas enrichi → return NO_INTERACTION_MATCH

  2. Obtenir la liste d'interactions:
     - Si targetDef est un ScenarioFeatureDefinition → interactions = targetDef.interactions
     - Sinon → return NO_INTERACTION_MATCH

  3. Pour chaque interaction dans l'ordre:
     a. Vérifier trigger.verb: le verb parsé correspond-il ?
        - trigger.verb peut être un VerbId unique ou un tableau
        - Si non → passer à l'interaction suivante
     
     b. Vérifier trigger.requiredState (si spécifié):
        - currentState = getFeatureState(state, targetId)
        - Si currentState !== trigger.requiredState → passer
     
     c. Vérifier trigger.requiredItem (si spécifié):
        - Si item pas dans state.character.inventory → passer
     
     d. Vérifier trigger.requiredFlag (si spécifié):
        - Si !hasScenarioFlag(state, trigger.requiredFlag) → passer
     
     e. TOUTES les conditions remplies → résoudre:
        - Si trigger.dc === null → auto-success, prendre onSuccess
        - Si trigger.dc est un nombre:
          • stat = trigger.stat ?? VERB_STATS[verb]
          • Faire rollCheck(stat, trigger.dc, rng)
          • Si succès/crit_success → prendre onSuccess
          • Si échec/crit_failure → prendre onFailure (ou résultat vide)
     
     f. Construire InteractionResolution depuis le résultat choisi
     
     g. return la résolution (première interaction qui match = celle utilisée)

  4. Aucune interaction n'a matché → return NO_INTERACTION_MATCH
```

### 6.3 Notes d'Implémentation Critiques

- L'**ordre des interactions dans le tableau** est significatif : la première qui match gagne.
- Cela permet des **priorités** : une interaction avec `requiredItem` avant une sans (la clé est prioritaire sur la force brute).
- Le dice roll utilise exactement le même `rollCheck()` que le système standard.
- Les conséquences retournées sont appliquées par le même `applyConsequences()` existant.
- Si `onFailure` est absent et que l'action échoue, `matched` est quand même `true` mais `result` est vide → processTurn utilise les templates narratifs standards pour l'échec.

---

## 7. Intégration dans `processTurn`

### 7.1 Point d'Insertion

**Fichier** : `src/engine/processTurn.ts`

Après le parsing (étape 1) et avant la résolution standard (étape 5), insérer une **étape d'interception scénario** :

```
processTurn flow révisé:

  1.  Parse input → ParsedAction | Reformulation
  2.  Creativity check → DC modifier
  3.  Condition tick → HP drain
  4.  Oxygen tick → O2 drain
  
  4b. ★ NOUVEAU: Scenario interaction check ★
      Si state.scenario !== null ET action.target !== null:
        a. Trouver la définition de la cible dans le nœud actuel
           (parcourir node.features et node.items)
        b. Appeler resolveScenarioInteraction(verb, targetId, targetDef, state, locationId, rng)
        c. Si matched === true:
           - Appliquer newFeatureState via setFeatureState()
           - Appliquer consequences via applyConsequences()
           - Appliquer revealsItems via revealItem()
           - Appliquer revealsExit via unlockExit()
           - Appliquer flagSet/flagUnset via setScenarioFlag()/unsetScenarioFlag()
           - Appliquer consumeItem via removeItem()
           - Stocker narrativeOverride pour l'étape 10
           - SAUTER les étapes 5-6 (résolution standard) → aller directement à 7
        d. Si matched === false → continuer le pipeline standard

  5.  Action resolution → D20 roll (standard pipeline, inchangé)
  6.  Consequence application (standard, inchangé)
  7.  NPC reaction
  8.  Stalker clock
  9.  Threat director
  10. Narrative composition
      → Si narrativeOverride est non-null : utiliser ce texte
      → Sinon : composer via le système standard
```

### 7.2 Recherche de la Définition Cible

Pour trouver la définition de la cible dans le nœud actuel :

```typescript
function findTargetDefinition(
  state: GameState,
  targetId: string,
): { type: 'feature'; def: FeatureDefinition } | { type: 'item'; def: ItemDefinition } | null {
  if (!state.scenario || !state.playerLocationId) return null;
  
  const node = state.scenario.graph.nodes.find(n => n.id === state.playerLocationId);
  if (!node) return null;
  
  // Chercher dans les features
  const featureDef = node.features.find(f => f.id === targetId);
  if (featureDef) return { type: 'feature', def: featureDef };
  
  // Chercher dans les items
  const itemDef = node.items.find(i => i.id === targetId);
  if (itemDef) return { type: 'item', def: itemDef };
  
  return null;
}
```

### 7.3 Gestion du `USE <item> ON <target>`

Le parser peut identifier des actions composées (verbe + outil). Quand le verbe est `USE` et qu'un outil est spécifié :

```typescript
// Dans le step 4b, avant resolveScenarioInteraction :
if (action.verb === 'USE' && action.tool) {
  // Chercher un useOn matching sur l'item en main
  const itemNode = findItemDefinitionAnywhere(state, action.tool.id);
  if (itemNode && isEnrichedItem(itemNode)) {
    const result = resolveItemUseOn(
      action.tool.id, itemNode, action.target.id, state, locationId, rng
    );
    if (result.matched) {
      // ... appliquer les résultats ...
    }
  }
}
```

---

## 8. Exports et Barrel

### 8.1 `src/engine/index.ts` — Nouveaux Exports

```typescript
// === Chantier 1: Feature/Item State Engine ===
export {
  getFeatureState, setFeatureState, getFeatureDescription,
  setScenarioFlag, unsetScenarioFlag, hasScenarioFlag,
  revealItem, isItemRevealed,
  unlockExit, isExitUnlocked,
} from './featureState';

export {
  resolveScenarioInteraction, resolveItemUseOn,
  NO_INTERACTION_MATCH,
  type InteractionResolution,
} from './interactionResolver';

export {
  isEnrichedFeature, isEnrichedItem,
  type ScenarioFeatureDefinition, type ScenarioItemDefinition,
  type ScenarioInteraction, type InteractionTrigger, type InteractionResult,
  type FeatureState, type ItemUseOnDefinition,
} from './scenario';
```

### 8.2 `CLAUDE.md` — Mise à Jour

Ajouter dans la section "Key Types" :

```
- `ScenarioFeatureDefinition`: Extended feature with type, properties, aliases, interactions
- `ScenarioItemDefinition`: Extended item with type, properties, aliases, useOn
- `ScenarioInteraction`: Declarative trigger→result rule
- `InteractionResolution`: Result of scenario interaction resolution
- `FeatureState`: String state of a feature ('locked', 'open', 'broken', etc.)
```

Ajouter dans la section "Key Files" :

```
- `src/engine/featureState.ts` — Pure functions for feature/flag/reveal state management
- `src/engine/interactionResolver.ts` — Scenario interaction matching and resolution
```

---

## 9. Plan de Tests

### 9.1 Tests Unitaires

**Fichier** : `tests/unit/engine/featureState.test.ts`

| # | Test | Assertion |
|---|------|-----------|
| 1 | `getFeatureState` returns initialState when no runtime state exists | `=== 'locked'` |
| 2 | `getFeatureState` returns runtime state when it exists | `=== 'open'` |
| 3 | `getFeatureState` returns 'intact' as ultimate fallback | `=== 'intact'` |
| 4 | `setFeatureState` returns new GameState with updated feature | new state has `featureStates[id] === 'open'` |
| 5 | `setFeatureState` does not mutate original state | original unchanged |
| 6 | `getFeatureDescription` returns state-specific description | correct text for 'locked' vs 'open' |
| 7 | `getFeatureDescription` falls back to examineResult | legacy behavior preserved |
| 8 | `setScenarioFlag` / `hasScenarioFlag` round-trip | flag is set |
| 9 | `unsetScenarioFlag` removes flag | flag is unset |
| 10 | `revealItem` / `isItemRevealed` round-trip | item revealed |
| 11 | `isItemRevealed` returns true when no revealedBy constraint | always visible |
| 12 | `unlockExit` / `isExitUnlocked` round-trip | exit unlocked |
| 13 | `deriveStateProperties` for 'locked' | adds 'locked', removes 'open' |
| 14 | `deriveStateProperties` for 'open' | adds 'open', removes 'locked', 'sealed' |
| 15 | `deriveStateProperties` for 'broken' | adds 'broken', removes 'locked', 'sealed', 'powered' |

**Fichier** : `tests/unit/engine/interactionResolver.test.ts`

| # | Test | Assertion |
|---|------|-----------|
| 1 | Returns `NO_INTERACTION_MATCH` when targetDef is null | matched === false |
| 2 | Returns `NO_INTERACTION_MATCH` when targetDef has no interactions | matched === false |
| 3 | Matches interaction by verb | matched === true |
| 4 | Matches interaction with verb array (any match) | matched === true |
| 5 | Rejects interaction when verb doesn't match | matched === false (moves to next) |
| 6 | Respects requiredState condition | only matches when state matches |
| 7 | Respects requiredItem condition | only matches when item in inventory |
| 8 | Respects requiredFlag condition | only matches when flag set |
| 9 | Auto-success when dc is null | success === true, diceRoll === null |
| 10 | Dice roll when dc is a number | diceRoll is non-null |
| 11 | Returns onSuccess result on success | correct newState, consequences, etc. |
| 12 | Returns onFailure result on failure | correct consequences |
| 13 | Returns empty result when onFailure absent and roll fails | matched === true, result empty |
| 14 | First matching interaction wins (priority order) | specific interaction before generic |
| 15 | Interaction with requiredItem prioritized over without | key before brute force |
| 16 | `resolveItemUseOn` matches useOn definition | matched === true |
| 17 | `resolveItemUseOn` returns NO_MATCH when no useOn for target | matched === false |

**Fichier** : `tests/unit/engine/scenarioTypes.test.ts`

| # | Test | Assertion |
|---|------|-----------|
| 1 | `isEnrichedFeature` true when featureType present | true |
| 2 | `isEnrichedFeature` true when interactions present | true |
| 3 | `isEnrichedFeature` false for legacy FeatureDefinition | false |
| 4 | `isEnrichedItem` true when itemType present | true |
| 5 | `isEnrichedItem` false for legacy ItemDefinition | false |
| 6 | `ScenarioFeatureDefinition` extends `FeatureDefinition` structurally | type check passes |

### 9.2 Tests d'Intégration

**Fichier** : `tests/integration/scenarioInteraction.test.ts`

| # | Test | Description |
|---|------|-------------|
| 1 | Open locked container → items revealed | OPEN emergency_locker (FOR DC 10) → oxygen_canister appears |
| 2 | Hack locked container → items revealed | HACK emergency_locker (INT DC 8) → same result |
| 3 | Use item on target → flag set | USE access_keycard ON security_panel → bulkhead_unlocked flag |
| 4 | Read terminal → readable content returned | READ status_terminal → log content in narrative |
| 5 | Feature state persists across turns | Open locker turn 1, examine turn 2 → 'open' description |
| 6 | Revealed item can be taken | After locker opened → TAKE oxygen_canister → in inventory |
| 7 | Already-open container skips open interaction | Open locker, then open again → no interaction match (already open) |
| 8 | Exit revealed by interaction | OPEN vent_cover → new exit appears in connectedLocations |
| 9 | Failed interaction applies failure consequences | FORCE_OPEN fails → player takes 1 damage |
| 10 | Scene.ts resolves enriched feature properties | emergency_locker has 'openable', 'metallic', 'container' |
| 11 | Scene.ts resolves enriched item properties | access_keycard has 'electronic', 'key', 'small' |
| 12 | Standard pipeline still works for non-enriched targets | Legacy features → generic properties, standard resolution |

### 9.3 Tests de Stress

**Fichier** : `tests/stress/interactionStress.test.ts`

| # | Test | Description |
|---|------|-------------|
| 1 | 500 random interactions: no state corruption | GameState always valid after any interaction |
| 2 | All feature states remain valid strings | Never undefined/null/NaN |
| 3 | Revealed items don't duplicate | Same item never in revealedItems twice |
| 4 | Feature state transitions are idempotent | setFeatureState('open') twice = same result |

---

## 10. Ordre d'Implémentation

Séquence exacte pour Claude Code :

```
ÉTAPE 1: Types (scenario.ts)
  ├─ Ajouter FeatureState type
  ├─ Ajouter ScenarioFeatureDefinition (extends FeatureDefinition)
  ├─ Ajouter ScenarioItemDefinition (extends ItemDefinition)
  ├─ Ajouter ScenarioInteraction, InteractionTrigger, InteractionResult
  ├─ Ajouter ItemUseOnDefinition
  ├─ Ajouter isEnrichedFeature(), isEnrichedItem() type guards
  └─ Tests: scenarioTypes.test.ts (6 tests)

ÉTAPE 2: GameState extensions (types.ts)
  ├─ Ajouter featureStates, revealedItems, unlockedExits, scenarioFlags à GameState
  ├─ Mettre à jour createInitialGameState()
  └─ Vérifier que tous les tests existants passent (ces champs sont {} par défaut)

ÉTAPE 3: Feature State Manager (featureState.ts)
  ├─ Implémenter toutes les fonctions pures
  └─ Tests: featureState.test.ts (15 tests)

ÉTAPE 4: Interaction Resolver (interactionResolver.ts)
  ├─ Implémenter resolveScenarioInteraction()
  ├─ Implémenter resolveItemUseOn()
  └─ Tests: interactionResolver.test.ts (17 tests)

ÉTAPE 5: Scene.ts enrichi
  ├─ Modifier featureDefToInstance() pour gérer les enriched features
  ├─ Modifier itemDefToResolvedTarget() pour gérer les enriched items
  ├─ Ajouter deriveStateProperties()
  ├─ Ajouter filtrage revealedBy dans getSceneContext()
  └─ Vérifier que tous les tests existants passent toujours

ÉTAPE 6: processTurn integration
  ├─ Ajouter l'étape 4b (scenario interaction check)
  ├─ Câbler la résolution d'interaction dans le flow
  ├─ Gérer le USE <item> ON <target>
  └─ Tests: scenarioInteraction.test.ts (12 tests d'intégration)

ÉTAPE 7: initGame update
  ├─ Peupler featureStates depuis le scénario assemblé
  └─ Vérifier les tests d'initialisation

ÉTAPE 8: Exports et CLAUDE.md
  ├─ Mettre à jour src/engine/index.ts
  ├─ Mettre à jour CLAUDE.md
  └─ Tests de stress (4 tests)

ÉTAPE 9: Validation finale
  ├─ npm run check (lint + types + tests)
  ├─ npm run test:stress
  └─ Tous les tests existants passent (rétro-compatibilité)
```

---

## 11. Critères d'Acceptation

```bash
# Tous les tests passent
npm run check                   # ✅ lint + type-check + unit tests

# Nouveaux tests
npm test -- featureState        # ✅ 15 tests
npm test -- interactionResolver # ✅ 17 tests
npm test -- scenarioTypes       # ✅ 6 tests
npm test -- scenarioInteraction # ✅ 12 tests d'intégration

# Stress
npm run test:stress             # ✅ 500 interactions random sans corruption

# Rétro-compatibilité
npm test                        # ✅ TOUS les tests existants passent (0 régression)
```

---

## 12. Hors Périmètre (Chantiers Suivants)

Ce chantier ne couvre PAS :

- ❌ La réécriture du scénario ESCAPE avec le nouveau format (→ Chantier 3)
- ❌ La narration contextuelle des interactions (→ Chantier 5)
- ❌ Les scénarios INVESTIGATE et RESCUE (→ après validation ESCAPE)
- ❌ Le système de hints/suggestions basé sur les interactions disponibles
- ❌ Le système de Ship Memory pour les interactions scénario

Ce chantier LIVRE l'infrastructure. Le chantier suivant (Chantier 2) intègre processTurn, puis le Chantier 3 réécrit ESCAPE pour exploiter cette infrastructure.

---

## 13. Fichiers Touchés (Résumé)

| Fichier | Action | Détail |
|---------|--------|--------|
| `src/engine/scenario.ts` | ÉTENDU | +FeatureState, +ScenarioFeatureDefinition, +ScenarioItemDefinition, +ScenarioInteraction, +InteractionTrigger, +InteractionResult, +ItemUseOnDefinition, +type guards |
| `src/engine/types.ts` | ÉTENDU | +featureStates, +revealedItems, +unlockedExits, +scenarioFlags dans GameState + createInitialGameState() |
| `src/engine/featureState.ts` | NOUVEAU | Fonctions pures de gestion d'état |
| `src/engine/interactionResolver.ts` | NOUVEAU | Logique de résolution d'interactions |
| `src/engine/scene.ts` | MODIFIÉ | featureDefToInstance enrichi, itemDefToResolvedTarget enrichi, filtrage revealedBy, deriveStateProperties |
| `src/engine/processTurn.ts` | MODIFIÉ | Étape 4b d'interception scénario |
| `src/engine/game.ts` | MODIFIÉ | initGame() peuple featureStates |
| `src/engine/index.ts` | ÉTENDU | Nouveaux exports |
| `CLAUDE.md` | MIS À JOUR | Nouveaux types et fichiers documentés |
| `tests/unit/engine/featureState.test.ts` | NOUVEAU | 15 tests |
| `tests/unit/engine/interactionResolver.test.ts` | NOUVEAU | 17 tests |
| `tests/unit/engine/scenarioTypes.test.ts` | NOUVEAU | 6 tests |
| `tests/integration/scenarioInteraction.test.ts` | NOUVEAU | 12 tests |
| `tests/stress/interactionStress.test.ts` | NOUVEAU | 4 tests |
