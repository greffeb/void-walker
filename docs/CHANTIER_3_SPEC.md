# Chantier 3 — Câblage Bout-en-Bout

> **Référence d'implémentation pour Claude Code**
> **Prérequis** : Chantier 1 terminé (types, featureState, interactionResolver), Chantier 2 terminé (ESCAPE enrichi)
> **Durée estimée** : 1 semaine
> **Nature** : intégration pure — aucun nouveau système, que du câblage entre systèmes existants
> **Principes** : Zéro régression, chaque point de câblage testé individuellement avant l'intégration complète

---

## 1. Le Problème

Après les Chantiers 1 et 2, trois systèmes sont complets mais déconnectés :

```
┌──────────────────────────┐     ┌──────────────────────────┐     ┌───────────────────────┐
│ CHANTIER 1 — Infra       │     │ CHANTIER 2 — Contenu     │     │ EXISTANT — Moteur     │
│                          │     │                          │     │                       │
│ ScenarioFeatureDefinition│     │ ESCAPE_SKELETON enrichi  │     │ processTurn() 10 steps│
│ ScenarioItemDefinition   │     │ 16 features interactives │     │ getSceneContext()     │
│ ScenarioInteraction      │     │ 8 items typés            │     │ checkVictory()        │
│ featureState.ts (pur)    │     │ interactions déclaratives │     │ tickOxygen()          │
│ interactionResolver.ts   │     │ flags scénario           │     │ narrateForTurn()      │
│ isEnrichedFeature/Item() │     │ revealedBy / contains    │     │ buildVictoryCheckCtx()│
└──────────────────────────┘     └──────────────────────────┘     └───────────────────────┘
         │                                │                                │
         └────────────────────────────────┼────────────────────────────────┘
                                          │
                               ★ CHANTIER 3 : CÂBLAGE ★
```

**9 points de câblage identifiés.** Chacun est un gap précis entre deux systèmes qui doivent communiquer.

---

## 2. Les 9 Points de Câblage

### Vue d'Ensemble

| # | Gap | Fichier(s) modifié(s) | Systèmes connectés |
|---|-----|-----------------------|--------------------|
| C3-1 | scene.ts ne résout pas les features/items enrichis | `src/engine/scene.ts` | SceneDef enrichies → SceneContext |
| C3-2 | scene.ts ne filtre pas les items par `revealedBy` | `src/engine/scene.ts` | featureState → visibilité items |
| C3-3 | scene.ts ne résout pas les aliases enrichis | `src/engine/scene.ts` | aliases inline → parser |
| C3-4 | processTurn ne route pas vers interactionResolver | `src/engine/processTurn.ts` | step 4b → interactionResolver |
| C3-5 | processTurn n'applique pas les résultats d'interaction | `src/engine/processTurn.ts` | InteractionResolution → GameState |
| C3-6 | tickOxygen ignore les flags scénario (o2_stabilized, etc.) | `src/engine/oxygen.ts` ou `processTurn.ts` | scenarioFlags → drain O₂ |
| C3-7 | buildVictoryCheckContext ignore scenarioFlags | `src/engine/game.ts` + `victory.ts` | scenarioFlags → victoire |
| C3-8 | narrateForTurn ignore narrativeOverride des interactions | `src/narration/index.ts` | InteractionResolution → narration |
| C3-9 | initGame ne peuple pas featureStates depuis le scénario | `src/engine/game.ts` | assemblage → GameState initial |

---

## 3. Détail de Chaque Point de Câblage

### C3-1 — scene.ts : Résolution des Propriétés Enrichies

**Fichier** : `src/engine/scene.ts`
**Fonctions** : `featureDefToInstance()`, `itemDefToResolvedTarget()`

**État actuel** :
```typescript
// featureDefToInstance() — aujourd'hui :
function featureDefToInstance(id: string): EnvironmentFeatureInstance {
  // 1. Check registre principal (ENVIRONMENT_FEATURE_DEFINITIONS)
  const def = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (def) { /* résolution complète via registre */ }
  
  // 2. Fallback : scenario-only → propriétés génériques
  return {
    properties: ['tangible', 'visible'],  // ← PROBLÈME : aucune propriété fonctionnelle
    aliases: [id, frName.toLowerCase()],  // ← PROBLÈME : pas d'aliases enrichis
  };
}
```

**Câblage requis** :
```typescript
function featureDefToInstance(
  id: string,
  scenarioDef?: ScenarioFeatureDefinition,  // ★ NOUVEAU paramètre
  currentState?: FeatureState,               // ★ NOUVEAU paramètre
): EnvironmentFeatureInstance {
  // 1. Check registre principal (inchangé)
  const def = ENVIRONMENT_FEATURE_DEFINITIONS[id];
  if (def) { /* résolution complète via registre — inchangé */ }
  
  // 2. ★ NOUVEAU : Check si définition scénario enrichie
  if (scenarioDef && isEnrichedFeature(scenarioDef)) {
    const baseType = scenarioDef.featureType ?? 'generic';
    const properties = resolveProperties({
      objectCategory: 'environment',
      baseType,
      extra_props: scenarioDef.extraProperties ?? [],
      remove_props: scenarioDef.removeProperties ?? [],
    });
    
    // Ajuster propriétés selon l'état actuel
    const stateProps = deriveStateProperties(currentState ?? scenarioDef.initialState ?? 'intact');
    const finalProperties = applyStateProperties(properties, stateProps);
    
    // Résoudre aliases
    const locale = getLocale();
    const inlineAliases = locale === 'fr'
      ? (scenarioDef.aliases?.fr ?? [])
      : (scenarioDef.aliases?.en ?? []);
    const aliases = [id, ...inlineAliases];
    
    // nameKey : préférer le scenarioNames, sinon env.{id}
    const nameKey = `env.${id}` as StringKey;
    
    return { id, definitionId: id, nameKey, aliases, properties: finalProperties };
  }
  
  // 3. Fallback existant (inchangé)
  // ...
}
```

**Même pattern pour `itemDefToResolvedTarget()`** :
```typescript
function itemDefToResolvedTarget(
  id: string,
  scenarioDef?: ScenarioItemDefinition,  // ★ NOUVEAU paramètre
): ResolvedTarget {
  // 1. Check registre principal (inchangé)
  // 2. ★ NOUVEAU : Check si définition scénario enrichie
  if (scenarioDef && isEnrichedItem(scenarioDef)) {
    const baseType = scenarioDef.itemType ?? 'generic';
    const properties = resolveProperties({
      objectCategory: 'item',
      baseType,
      extra_props: scenarioDef.extraProperties ?? [],
      remove_props: scenarioDef.removeProperties ?? [],
    });
    const locale = getLocale();
    const inlineAliases = locale === 'fr'
      ? (scenarioDef.aliases?.fr ?? [])
      : (scenarioDef.aliases?.en ?? []);
    const aliases = [id, ...inlineAliases];
    const nameKey = `item.${id}` as StringKey;
    return { id, nameKey, properties, isVirtual: false, source: 'location', aliases };
  }
  // 3. Fallback existant (inchangé)
}
```

**Impact sur `getSceneContext()`** : le caller doit passer les définitions scénario aux fonctions de résolution. Modifier la boucle qui itère sur `node.features` et `node.items` pour passer le `FeatureDefinition` / `ItemDefinition` brut depuis le graph :

```typescript
// Avant (actuel) :
const environmentFeatures = node.features.map(feat => featureDefToInstance(feat.id));

// Après :
const environmentFeatures = node.features.map(feat => {
  const currentState = getFeatureState(state, feat.id);
  return featureDefToInstance(feat.id, feat as ScenarioFeatureDefinition, currentState);
});
```

**Nouvelle fonction utilitaire `deriveStateProperties()`** (dans `featureState.ts`, définie par Chantier 1) :
```typescript
export function deriveStateProperties(state: FeatureState): { add: PropertyId[]; remove: PropertyId[] } {
  switch (state) {
    case 'locked':     return { add: ['locked'], remove: ['open'] };
    case 'open':       return { add: ['open', 'openable'], remove: ['locked', 'sealed'] };
    case 'broken':     return { add: ['broken'], remove: ['locked', 'sealed', 'powered'] };
    case 'active':     return { add: ['powered', 'active'], remove: ['unpowered', 'inactive'] };
    case 'inactive':   return { add: ['unpowered', 'inactive'], remove: ['powered', 'active'] };
    case 'damaged':    return { add: ['broken'], remove: [] };
    case 'empty':      return { add: ['open'], remove: ['locked', 'sealed'] };
    case 'closed':     return { add: ['openable'], remove: ['open'] };
    case 'deactivated': return { add: ['unpowered'], remove: ['powered', 'active'] };
    case 'repaired':   return { add: ['powered'], remove: ['broken', 'damaged'] };
    case 'searched':   return { add: [], remove: ['secured'] };
    case 'activated':  return { add: ['active', 'powered'], remove: ['inactive'] };
    default:           return { add: [], remove: [] };
  }
}

function applyStateProperties(
  base: readonly PropertyId[],
  delta: { add: PropertyId[]; remove: PropertyId[] },
): PropertyId[] {
  const result = base.filter(p => !delta.remove.includes(p));
  for (const p of delta.add) {
    if (!result.includes(p)) result.push(p);
  }
  return result;
}
```

**Tests** : 6 tests unitaires
1. Feature enrichie avec `featureType:'container'` → propriétés résolues incluent `'container'`, `'openable'`
2. Feature enrichie `locked` → propriétés incluent `'locked'`, pas `'open'`
3. Feature enrichie `open` → propriétés incluent `'open'`, pas `'locked'`
4. Item enrichi avec `itemType:'weapon'` → propriétés résolues incluent `'weapon'`
5. Feature sans enrichissement → fallback `['tangible', 'visible']` (inchangé)
6. Item sans enrichissement → fallback `['tangible', 'liftable', 'small']` (inchangé)

---

### C3-2 — scene.ts : Filtrage Items par `revealedBy`

**Fichier** : `src/engine/scene.ts`
**Fonction** : `getSceneContext()` — boucle de filtrage des items

**État actuel** :
```typescript
// Actuel : filtre seulement par "item déjà pris"
const locationItems = node.items
  .filter(item => isItemAvailable(visitState, item.id))
  .map(item => itemDefToResolvedTarget(item.id));
```

**Câblage requis** :
```typescript
const locationItems = node.items
  .filter(item => {
    // Filtre existant : pas déjà pris
    if (!isItemAvailable(visitState, item.id)) return false;
    
    // ★ NOUVEAU : filtre par revealedBy
    if (isEnrichedItem(item)) {
      if (!isItemRevealed(state, item as ScenarioItemDefinition)) return false;
    } else if (item.hidden) {
      // Legacy hidden items : vérifier revealedItems dans GameState
      if (!state.revealedItems?.[item.id]) return false;
    }
    
    return true;
  })
  .map(item => itemDefToResolvedTarget(item.id, item as ScenarioItemDefinition));
```

**La fonction `isItemRevealed()`** (Chantier 1, dans `featureState.ts`) :
```typescript
export function isItemRevealed(
  state: GameState,
  itemDef: ScenarioItemDefinition,
): boolean {
  // Si pas de contrainte revealedBy → toujours visible
  if (!itemDef.revealedBy) return true;
  
  // Si explicitement révélé dans le state
  if (state.revealedItems?.[itemDef.id]) return true;
  
  // Vérifier si la feature source a le bon état
  const featureState = getFeatureState(state, itemDef.revealedBy.featureId);
  return featureState === itemDef.revealedBy.requiredState;
}
```

**Tests** : 4 tests unitaires
1. Item sans `revealedBy` → toujours visible
2. Item avec `revealedBy: { featureId: 'locker', requiredState: 'open' }`, locker `locked` → invisible
3. Item avec `revealedBy: { featureId: 'locker', requiredState: 'open' }`, locker `open` → visible
4. Item explicitement révélé dans `state.revealedItems` → visible même si feature pas dans le bon état

---

### C3-3 — scene.ts : Résolution des Aliases Enrichis

**Couvert par C3-1** — les aliases inline sont résolus dans `featureDefToInstance()` et `itemDefToResolvedTarget()` modifiés. Pas de fichier supplémentaire nécessaire.

**Impact parser** : aucune modification. Le parser utilise déjà le champ `aliases` des `ResolvedTarget` et `EnvironmentFeatureInstance`. En injectant les bons aliases dans ces structures, le parser les reconnaît automatiquement.

**Test spécifique** : 2 tests
1. Parser reconnaît `"ouvrir casier"` quand `emergency_locker` a `aliases.fr: ['casier', ...]`
2. Parser reconnaît `"badge"` quand `access_keycard` a `aliases.fr: ['badge', ...]`

---

### C3-4 — processTurn : Routage vers InteractionResolver (Step 4b)

**Fichier** : `src/engine/processTurn.ts`
**Position** : entre Step 4 (oxygen tick) et Step 5 (action resolution standard)

**État actuel** : Steps 1-4 → Step 5 (dés) → Step 6 (conséquences) — aucune interception scénario.

**Câblage requis** — nouveau Step 4b :

```typescript
  // ─────────────────────────────────────────────────────────
  // STEP 4b: ★ Scenario interaction check ★
  // ─────────────────────────────────────────────────────────
  let scenarioInteractionMatched = false;
  let scenarioNarrativeOverride: LocaleString | null = null;
  
  if (state.scenario !== null && action.target !== null) {
    const node = state.scenario.graph.nodes.find(n => n.id === locationId);
    
    if (node) {
      // Trouver la définition cible dans le nœud
      const targetId = action.target.id;
      const featureDef = node.features.find(f => f.id === targetId);
      const itemDef = node.items.find(i => i.id === targetId);
      
      // Cas 1 : Action sur une feature enrichie
      if (featureDef && isEnrichedFeature(featureDef)) {
        const resolution = resolveScenarioInteraction(
          action.verb,
          targetId,
          featureDef as ScenarioFeatureDefinition,
          current,  // GameState après O₂ tick
          locationId,
          rng,
        );
        
        if (resolution.matched) {
          scenarioInteractionMatched = true;
          current = applyInteractionResolution(current, resolution, locationId);
          scenarioNarrativeOverride = resolution.narrativeOverride;
          
          // Populer le trace avec les infos d'interaction
          traceOutcome = resolution.success ? 'success' : 'failure';
          if (resolution.diceRoll) {
            diceRoll = resolution.diceRoll;
          }
          traceConsequences = resolution.result.consequences ?? [];
        }
      }
      
      // Cas 2 : USE <item inventaire> ON <target>
      // Détecté quand verb='USE' et action.tool est set
      if (!scenarioInteractionMatched && action.verb === 'USE' && action.tool) {
        const toolId = action.tool.id;
        const toolItemDef = findItemDefInScenario(state.scenario, toolId);
        
        if (toolItemDef && isEnrichedItem(toolItemDef) && toolItemDef.useOn) {
          const useOnMatch = toolItemDef.useOn.find(u => u.targetId === targetId);
          
          if (useOnMatch) {
            const resolution = resolveItemUseOn(
              toolId,
              useOnMatch,
              targetId,
              current,
              locationId,
              rng,
            );
            
            if (resolution.matched) {
              scenarioInteractionMatched = true;
              current = applyInteractionResolution(current, resolution, locationId);
              scenarioNarrativeOverride = resolution.narrativeOverride;
              traceOutcome = resolution.success ? 'success' : 'failure';
              if (resolution.diceRoll) diceRoll = resolution.diceRoll;
              traceConsequences = resolution.result.consequences ?? [];
            }
          }
        }
      }
    }
  }
  
  // ─────────────────────────────────────────────────────────
  // STEP 5: Action resolution (SAUTÉ si scenarioInteractionMatched)
  // ─────────────────────────────────────────────────────────
  if (!scenarioInteractionMatched) {
    // ... code existant Step 5 inchangé ...
  }
```

**Nouvelle fonction helper** `applyInteractionResolution()` (dans `processTurn.ts` ou un nouveau `src/engine/interactionApply.ts`) :

```typescript
function applyInteractionResolution(
  state: GameState,
  resolution: InteractionResolution,
  locationId: string,
): GameState {
  let current = state;
  
  // 1. Appliquer newFeatureState
  if (resolution.newFeatureState !== null && resolution.targetId) {
    current = setFeatureState(current, resolution.targetId, resolution.newFeatureState);
  }
  
  // 2. Appliquer consequences via applyConsequences existant
  if (resolution.consequences.length > 0) {
    const context = getSceneContext(current);
    current = applyConsequences(current, resolution.consequences, context, defaultRng);
  }
  
  // 3. Révéler items
  for (const itemId of resolution.itemsToReveal) {
    current = revealItem(current, itemId);
  }
  
  // 4. Débloquer exit
  if (resolution.exitToUnlock !== null) {
    current = unlockExit(current, locationId, resolution.exitToUnlock);
  }
  
  // 5. Set/Unset flags
  if (resolution.flagToSet !== null) {
    current = setScenarioFlag(current, resolution.flagToSet);
  }
  if (resolution.flagToUnset !== null) {
    current = unsetScenarioFlag(current, resolution.flagToUnset);
  }
  
  // 6. Consommer item si nécessaire
  if (resolution.itemToConsume !== null) {
    const { inventory } = removeItem(current.character!.inventory, resolution.itemToConsume);
    current = { ...current, character: { ...current.character!, inventory } };
  }
  
  // 7. Modifier propriétés dynamiques de la feature
  // (Stockées dans un champ runtime, pas dans la définition statique)
  // Note : les propriétés dérivées de l'état sont recalculées via deriveStateProperties
  // au prochain appel de getSceneContext(). Les addProperties/removeProperties de
  // l'interaction enrichissent le delta au-delà de ce que l'état seul implique.
  
  return current;
}
```

**Nouvelle fonction helper** `findItemDefInScenario()` :
```typescript
function findItemDefInScenario(
  scenario: AssembledScenario,
  itemId: string,
): ScenarioItemDefinition | null {
  for (const node of scenario.graph.nodes) {
    const found = node.items.find(i => i.id === itemId);
    if (found) return found as ScenarioItemDefinition;
  }
  return null;
}
```

**Tests** : 8 tests unitaires
1. Feature enrichie avec interaction matching → `scenarioInteractionMatched = true`, Step 5 sauté
2. Feature enrichie sans interaction matching → `scenarioInteractionMatched = false`, Step 5 exécuté
3. Feature non enrichie → `scenarioInteractionMatched = false`, Step 5 exécuté
4. `USE item ON feature` avec `useOn` match → résolution scénario
5. `USE item ON feature` sans `useOn` → pipeline standard
6. `applyInteractionResolution` : `newFeatureState` appliqué dans GameState
7. `applyInteractionResolution` : `revealItem` ajoute dans `revealedItems`
8. `applyInteractionResolution` : `flagSet` ajoute dans `scenarioFlags`

---

### C3-5 — processTurn : Application des Résultats d'Interaction

**Couvert par C3-4** — `applyInteractionResolution()` gère tous les effets. Pas de point de câblage séparé nécessaire.

Le **Step 6** (conséquences standard) est sauté quand `scenarioInteractionMatched = true`, puisque les conséquences sont déjà appliquées dans `applyInteractionResolution()`. Le Step 7 (NPC reaction) continue normalement — un NPC pourrait réagir à une interaction scénario (bruit d'ouverture de porte, etc.).

**Point d'attention** : si `resolution.consequences` contient des `damage` ou `condition_add`, ils sont appliqués via `applyConsequences()` qui est la même fonction que Step 6. La death check doit se faire après.

```typescript
  // Après Step 4b, si scenarioInteractionMatched :
  if (scenarioInteractionMatched) {
    // Death check (même code que Step 6)
    const deathCheck = checkDeath(current);
    if (deathCheck.isDead) {
      current = applyDeath(current, deathCheck.reason);
      traceDeathResult = deathCheck.reason;
    }
    // → sauter Step 5 et Step 6 → aller à Step 7 (NPC reaction)
  }
```

---

### C3-6 — Oxygen Tick : Flags Scénario

**Fichier** : `src/engine/processTurn.ts` (modification du Step 4, pas d'oxygen.ts)
**Raison** : `tickOxygen()` est une fonction pure qui ne dépend que de `AtmosphereType` + `hasEvaSuit`. Les flags scénario sont un concept de plus haut niveau. Le câblage se fait dans processTurn.

**État actuel** :
```typescript
  // STEP 4: Oxygen tick
  const hasEvaSuit = char.equippedArmor === 'eva_suit';
  const { newOxygen, hpDrain: oxygenHpDrain } = tickOxygen(
    { current: o2Before, max: 100 },
    atmosphere,
    hasEvaSuit,
  );
```

**Câblage requis** :
```typescript
  // STEP 4: Oxygen tick (★ with scenario flag awareness)
  const hasEvaSuit = char.equippedArmor === 'eva_suit'
    || char.inventory.includes('eva_suit');  // ★ EVA suit dans inventaire aussi
  
  // ★ Déterminer l'atmosphère effective selon les flags scénario
  let effectiveAtmosphere = atmosphere;
  if (state.scenario !== null) {
    if (hasScenarioFlag(state, 'o2_stabilized')) {
      // Le support vie est réparé → zone redevient pressurized
      effectiveAtmosphere = 'pressurized';
    } else if (hasScenarioFlag(state, 'sections_sealed')) {
      // Sections scellées → réduire le drain (low_oxygen au lieu de depressurized)
      if (effectiveAtmosphere === 'depressurized') {
        effectiveAtmosphere = 'low_oxygen';
      } else if (effectiveAtmosphere === 'low_oxygen') {
        effectiveAtmosphere = 'pressurized';
      }
    }
  }
  
  const { newOxygen, hpDrain: oxygenHpDrain } = tickOxygen(
    { current: o2Before, max: 100 },
    effectiveAtmosphere,  // ★ atmosphère ajustée
    hasEvaSuit,
  );
```

**Logique** :
- `o2_stabilized` (REPAIR life_support_panel, INT DC 14) → atmosphère devient `pressurized` → O₂ se restore
- `sections_sealed` (OPEN o2_reroute_valve, FOR DC 12) → downgrade d'un cran : `depressurized` → `low_oxygen`, `low_oxygen` → `pressurized`
- EVA suit → le check existant `hasEvaSuit` fonctionne, mais il faut aussi vérifier l'inventaire (pas seulement `equippedArmor`)

**Alternative considérée** : modifier `tickOxygen()` pour accepter un `drainModifier`. Rejeté — trop de couplage. L'ajustement de l'atmosphère en amont est plus propre et ne modifie pas la signature de `tickOxygen()`.

**Tests** : 4 tests unitaires
1. Flag `o2_stabilized` + atmosphère `low_oxygen` → drain = 0 (pressurized)
2. Flag `sections_sealed` + atmosphère `depressurized` → drain = `low_oxygen` rate
3. Flag `sections_sealed` + atmosphère `low_oxygen` → drain = 0 (pressurized)
4. Aucun flag + atmosphère `low_oxygen` → drain = standard (inchangé)

---

### C3-7 — Victory Check : Intégration des scenarioFlags

**Fichiers** : `src/engine/game.ts`, `src/engine/victory.ts`

**État actuel de `VictoryCheckContext`** :
```typescript
export interface VictoryCheckContext {
  readonly playerLocationId: string;
  readonly playerInventory: readonly string[];
  readonly npcStates: Readonly<Record<string, NpcState>>;
  readonly activatedObjects: readonly string[];
  readonly lethalLocations: readonly string[];
  readonly fullyContainedLocations: readonly string[];
  readonly destroyedObjectives: readonly string[];
  readonly selfDestructActive: boolean;
  // ← PAS de scenarioFlags
}
```

**Problème** : Les victoires alternatives et émergentes d'ESCAPE sont basées sur des flags (`cargo_jettisoned`, `cargo_depressurized`), pas sur les champs existants (`lethalLocations`, `fullyContainedLocations`).

**Deux options** :

**Option A — Mapper les flags vers les champs existants** (préféré) :

Le flag `cargo_jettisoned` signifie "la soute est devenue létale" → mapper vers `lethalLocations`. Le flag `cargo_depressurized` → même chose. Pas besoin d'étendre VictoryCheckContext.

```typescript
// Dans buildVictoryCheckContext() :
export function buildVictoryCheckContext(state: GameState): VictoryCheckContext {
  // Champs existants
  let lethalLocations = [...state.lethalLocations];
  let fullyContainedLocations = [...state.fullyContainedLocations];
  
  // ★ NOUVEAU : mapper scenarioFlags vers les champs existants
  if (state.scenarioFlags) {
    if (state.scenarioFlags['cargo_jettisoned'] || state.scenarioFlags['cargo_depressurized']) {
      // La soute (boss node) est devenue létale
      if (!lethalLocations.includes('boss')) {
        lethalLocations.push('boss');
      }
    }
  }
  
  return {
    playerLocationId: state.playerLocationId ?? '',
    playerInventory: state.character?.inventory ?? [],
    npcStates: state.npcStates,
    activatedObjects: state.activatedObjects,
    lethalLocations,
    fullyContainedLocations,
    destroyedObjectives: state.destroyedObjectives,
    selfDestructActive: state.selfDestructActive,
  };
}
```

**Avantage** : `checkVictory()` et `evaluateVictoryCondition()` restent inchangés. Le type `environmental_kill` fonctionne déjà avec `lethalLocations`. Zéro modification de `victory.ts`.

**Inconvénient** : le mapping est hardcodé pour ESCAPE. Pour INVESTIGATE et RESCUE, il faudra ajouter des mappings similaires.

**Solution propre** : faire le mapping dans un fichier dédié `src/engine/scenarioFlagMapper.ts` :

```typescript
// src/engine/scenarioFlagMapper.ts

export interface FlagEffects {
  lethalLocations: string[];
  fullyContainedLocations: string[];
  activatedObjects: string[];
  selfDestructActive: boolean;
}

/**
 * Mapper les scenarioFlags vers les effets mécaniques pour le victory check.
 * Chaque skeleton peut définir ses propres mappings.
 */
export function mapScenarioFlags(
  flags: Readonly<Record<string, boolean>>,
  skeletonId: string,
): FlagEffects {
  const effects: FlagEffects = {
    lethalLocations: [],
    fullyContainedLocations: [],
    activatedObjects: [],
    selfDestructActive: false,
  };
  
  switch (skeletonId) {
    case 'escape':
      if (flags['cargo_jettisoned'] || flags['cargo_depressurized']) {
        effects.lethalLocations.push('boss');
      }
      break;
      
    case 'investigate':
      // (À définir quand INVESTIGATE sera enrichi)
      if (flags['beacon_activated']) {
        effects.activatedObjects.push('emergency_beacon');
      }
      if (flags['self_destruct_activated']) {
        effects.selfDestructActive = true;
      }
      break;
      
    case 'rescue':
      // (À définir quand RESCUE sera enrichi)
      break;
  }
  
  return effects;
}
```

Puis dans `buildVictoryCheckContext()` :
```typescript
export function buildVictoryCheckContext(state: GameState): VictoryCheckContext {
  const baseLethal = [...state.lethalLocations];
  const baseContained = [...state.fullyContainedLocations];
  const baseActivated = [...state.activatedObjects];
  let selfDestruct = state.selfDestructActive;
  
  // ★ Mapper les flags scénario
  if (state.scenarioFlags && state.scenarioId) {
    const flagEffects = mapScenarioFlags(state.scenarioFlags, state.scenarioId);
    baseLethal.push(...flagEffects.lethalLocations);
    baseContained.push(...flagEffects.fullyContainedLocations);
    baseActivated.push(...flagEffects.activatedObjects);
    if (flagEffects.selfDestructActive) selfDestruct = true;
  }
  
  return {
    playerLocationId: state.playerLocationId ?? '',
    playerInventory: state.character?.inventory ?? [],
    npcStates: state.npcStates,
    activatedObjects: baseActivated,
    lethalLocations: baseLethal,
    fullyContainedLocations: baseContained,
    destroyedObjectives: state.destroyedObjectives,
    selfDestructActive: selfDestruct,
  };
}
```

**Tests** : 5 tests unitaires
1. Flag `cargo_jettisoned` → `lethalLocations` inclut `'boss'`
2. Flag `cargo_depressurized` → `lethalLocations` inclut `'boss'`
3. Aucun flag → `lethalLocations` inchangé
4. `checkVictory()` + `cargo_jettisoned` + creature dans boss → victoire alternative
5. `checkVictory()` + `cargo_depressurized` + creature dans boss → victoire émergente

---

### C3-8 — Narrative Bridge : Override par Interaction Scénario

**Fichier** : `src/narration/index.ts`
**Fonction** : `narrateForTurn()`

**État actuel** : `narrateForTurn()` construit toujours un `NarrativeContext` et appelle `composeNarrative()` qui sélectionne des templates génériques.

**Câblage requis** : quand une interaction scénario a produit un `narrativeOverride`, l'utiliser à la place de la composition standard.

**Problème** : `narrateForTurn()` reçoit un `TurnResult` mais n'a pas accès au `narrativeOverride` de l'interaction. Il faut transporter cette information.

**Solution** : étendre `TurnDebugTrace` avec un champ optionnel :

```typescript
// Dans src/engine/types.ts — TurnDebugTrace :
export interface TurnDebugTrace {
  // ... champs existants ...
  
  // ★ NOUVEAU : narrative override from scenario interaction
  readonly scenarioNarrativeOverride?: LocaleString | null;
  readonly scenarioInteractionMatched?: boolean;
}
```

Peuplé dans processTurn (Step 4b) :
```typescript
// Dans le trace final :
scenarioNarrativeOverride: scenarioNarrativeOverride,
scenarioInteractionMatched: scenarioInteractionMatched,
```

Puis dans `narrateForTurn()` :
```typescript
export function narrateForTurn(
  result: TurnResult,
  sceneContext: SceneContext,
  state: GameState,
  settings?: NarrativeSettings,
  locale?: Locale,
): string {
  // ... guards existants (reformulated, defeat, victory) ...
  
  // ★ NOUVEAU : si interaction scénario avec override narratif
  if (result.trace.scenarioInteractionMatched && result.trace.scenarioNarrativeOverride) {
    const override = result.trace.scenarioNarrativeOverride;
    const effectiveLocale = locale ?? getLocale();
    const baseText = effectiveLocale === 'fr' ? override.fr : (override.en || override.fr);
    
    // Optionnel : ajouter des couches atmosphériques par-dessus l'override
    // Pour le moment, retourner l'override brut — les couches additionnelles
    // seront ajoutées dans un chantier narratif futur
    return baseText;
  }
  
  // ★ NOUVEAU : si interaction scénario sans override → composer avec le résultat
  if (result.trace.scenarioInteractionMatched && !result.trace.scenarioNarrativeOverride) {
    // Pas d'override explicite → fallback sur la composition standard
    // La composition utilisera le verb + target + outcome pour générer du texte
  }
  
  // ... composition standard existante (inchangée) ...
}
```

**Décision** : les overrides narratifs des interactions scénario sont **complets** — ils remplacent toute la composition. C'est voulu : les textes du Chantier 2 sont soigneusement écrits pour chaque interaction et ne doivent pas être dilués par des templates génériques. Les couches atmosphériques pourront être ajoutées ultérieurement.

**Tests** : 3 tests unitaires
1. `scenarioInteractionMatched: true` + `scenarioNarrativeOverride` présent → retourne l'override FR
2. `scenarioInteractionMatched: true` + pas d'override → composition standard
3. `scenarioInteractionMatched: false` → composition standard (inchangé)

---

### C3-9 — initGame : Peuplement des Nouveaux Champs GameState

**Fichier** : `src/engine/game.ts`
**Fonction** : `initGame()`

**État actuel** : `initGame()` crée un `GameState` avec les champs Chantier 1 initialisés à `{}` dans `createInitialGameState()`. Mais il ne les peuple pas depuis le scénario assemblé.

**Câblage requis** :

```typescript
export function initGame(
  scenario: AssembledScenario,
  playerClass: PlayerClassName,
  difficulty: DifficultyLevel,
  playerName: string,
  rng: RngFn,
): GameState {
  // ... code existant (character, NPC states, etc.) ...
  
  // ★ NOUVEAU : Peupler featureStates depuis le scénario
  const featureStates: Record<string, string> = {};
  for (const node of scenario.graph.nodes) {
    for (const feat of node.features) {
      if (feat.initialState) {
        featureStates[feat.id] = feat.initialState;
      }
    }
  }
  
  // ★ NOUVEAU : revealedItems, unlockedExits, scenarioFlags initialisés vides
  // (déjà fait dans createInitialGameState(), mais on s'assure)
  
  const base = createInitialGameState();
  return {
    ...base,
    // ... champs existants ...
    featureStates,       // ★ NOUVEAU
    revealedItems: {},   // ★ NOUVEAU (confirmé vide au départ)
    unlockedExits: {},   // ★ NOUVEAU
    scenarioFlags: {},   // ★ NOUVEAU
  };
}
```

**Tests** : 3 tests unitaires
1. `initGame()` → `featureStates['emergency_locker'] === 'locked'`
2. `initGame()` → `featureStates['cryopod'] === 'broken'`
3. `initGame()` → `revealedItems`, `unlockedExits`, `scenarioFlags` sont des objets vides

---

## 4. Nouveau Fichier : `src/engine/scenarioFlagMapper.ts`

Seul nouveau fichier du Chantier 3. Responsabilité unique : convertir les flags scénario abstraits en effets mécaniques que les systèmes existants comprennent.

```typescript
// src/engine/scenarioFlagMapper.ts

export interface FlagEffects {
  readonly lethalLocations: readonly string[];
  readonly fullyContainedLocations: readonly string[];
  readonly activatedObjects: readonly string[];
  readonly selfDestructActive: boolean;
}

const EMPTY_EFFECTS: FlagEffects = {
  lethalLocations: [],
  fullyContainedLocations: [],
  activatedObjects: [],
  selfDestructActive: false,
};

export function mapScenarioFlags(
  flags: Readonly<Record<string, boolean>> | undefined,
  skeletonId: string | null,
): FlagEffects {
  if (!flags || !skeletonId) return EMPTY_EFFECTS;
  
  const lethalLocations: string[] = [];
  const fullyContainedLocations: string[] = [];
  const activatedObjects: string[] = [];
  let selfDestructActive = false;
  
  switch (skeletonId) {
    case 'escape':
      if (flags['cargo_jettisoned'] || flags['cargo_depressurized']) {
        lethalLocations.push('boss');
      }
      break;
    case 'investigate':
      if (flags['beacon_activated']) activatedObjects.push('emergency_beacon');
      if (flags['self_destruct_activated']) selfDestructActive = true;
      break;
    case 'rescue':
      // (Futur)
      break;
  }
  
  return { lethalLocations, fullyContainedLocations, activatedObjects, selfDestructActive };
}
```

**Tests** : `tests/unit/engine/scenarioFlagMapper.test.ts` — 6 tests
1. null/undefined → EMPTY_EFFECTS
2. escape + cargo_jettisoned → boss dans lethalLocations
3. escape + cargo_depressurized → boss dans lethalLocations
4. escape + aucun flag → vide
5. investigate + beacon_activated → beacon dans activatedObjects
6. skeleton inconnu → EMPTY_EFFECTS

---

## 5. Fichiers Modifiés — Résumé des Changements

| Fichier | Nature | Lignes estimées |
|---------|--------|-----------------|
| `src/engine/scene.ts` | MODIFIÉ — C3-1, C3-2, C3-3 | +60 lignes |
| `src/engine/processTurn.ts` | MODIFIÉ — C3-4, C3-5, C3-6 | +80 lignes |
| `src/engine/game.ts` | MODIFIÉ — C3-7, C3-9 | +30 lignes |
| `src/engine/types.ts` | MODIFIÉ — 2 champs trace | +3 lignes |
| `src/narration/index.ts` | MODIFIÉ — C3-8 | +15 lignes |
| `src/engine/scenarioFlagMapper.ts` | **NOUVEAU** — C3-7 | ~45 lignes |
| `src/engine/index.ts` | MODIFIÉ — exports | +3 lignes |

**Total** : ~236 lignes de code nouveau, 1 fichier nouveau, 6 fichiers modifiés.

---

## 6. Plan de Tests

### 6.1 Tests Unitaires par Point de Câblage

| Fichier test | Points couverts | # Tests |
|-------------|-----------------|---------|
| `tests/unit/engine/sceneEnriched.test.ts` | C3-1, C3-2, C3-3 | 12 |
| `tests/unit/engine/processTurnScenario.test.ts` | C3-4, C3-5 | 8 |
| `tests/unit/engine/oxygenFlags.test.ts` | C3-6 | 4 |
| `tests/unit/engine/scenarioFlagMapper.test.ts` | C3-7 | 6 |
| `tests/unit/narration/scenarioNarrative.test.ts` | C3-8 | 3 |
| `tests/unit/engine/initGameEnriched.test.ts` | C3-9 | 3 |

**Total unitaire : 36 tests**

### 6.2 Tests d'Intégration End-to-End

**Fichier** : `tests/integration/escapeEndToEnd.test.ts`

Ce fichier teste des **playthroughs complets** du scénario ESCAPE en utilisant la vraie chaîne `initGame() → getSceneContext() → processTurn() → narrateForTurn()`.

| # | Test | Description | Vérifie |
|---|------|-------------|---------|
| 1 | **Playthrough principal complet** | init → FORCE locker → TAKE keycard → MOVE unlock → USE keycard ON panel → OPEN door → MOVE reveal → READ terminal → MOVE escalation → MOVE boss → USE keycard ON hatch → MOVE resolution | C3-1 à C3-9, victoire primaire |
| 2 | **Playthrough ventilation** | ... → OPEN vent → CLIMB vent → ... | C3-1 (vent properties), C3-4 (interaction vent) |
| 3 | **Playthrough INT pur** | HACK locker → HACK panel → HACK hatch | C3-4 (dés sur interactions enrichies) |
| 4 | **Victoire alternative** | ... → BOSS → PULL lever → checkVictory | C3-7 (flag → lethalLocations → environmental_kill) |
| 5 | **Victoire émergente** | ... → BOSS → HACK hull_breach → checkVictory | C3-7 (flag → lethalLocations → emergent) |
| 6 | **Items cachés apparaissent** | Locker locked → keycard NOT in scene. FORCE locker → keycard IN scene | C3-2 (revealedBy filtering) |
| 7 | **Descriptions changent avec état** | EXAMINE locker (locked) → desc locked. FORCE locker → EXAMINE locker (open) → desc open | C3-1 (state-aware descriptions) |
| 8 | **Flags O₂** | ESCALATION (low_oxygen) → drain. REPAIR life_support → o2_stabilized → drain = 0 | C3-6 |
| 9 | **Narrative override** | FORCE locker (success) → narrative = l'override FR, pas une template générique | C3-8 |
| 10 | **Parser reconnaît aliases** | "ouvrir le casier" → target = emergency_locker | C3-3 |
| 11 | **initGame peuple featureStates** | Après initGame → emergency_locker = 'locked', cryopod = 'broken' | C3-9 |
| 12 | **State persiste entre tours** | FORCE locker → état 'open'. Tour suivant → état toujours 'open' | C3-4 + C3-1 |

**Total intégration : 12 tests**

### 6.3 Tests de Stress

**Fichier** : `tests/stress/escapeFullStress.test.ts`

| # | Test | Description |
|---|------|-------------|
| 1 | **500 tours random sans crash** | Verbs aléatoires × targets aléatoires, GameState jamais corrompu |
| 2 | **100 playthroughs par chemin** | Bot guide : chaîne principale × 100, vent × 100, victoire alt × 100 |
| 3 | **Aucun softlock** | Bot aléatoire × 1000, jamais bloqué plus de 20 tours au même endroit |
| 4 | **featureStates toujours valides** | Après chaque tour, toutes les valeurs de featureStates sont des strings non-vides |
| 5 | **scenarioFlags ne contiennent que des booléens** | Après chaque tour, toutes les valeurs sont true |

**Total stress : 5 tests**

### 6.4 Résumé

```
Tests unitaires     :  36
Tests intégration   :  12
Tests stress        :   5
─────────────────────────
TOTAL               :  53 nouveaux tests
```

---

## 7. Ordre d'Implémentation

```
ÉTAPE 1: featureState.ts — deriveStateProperties + applyStateProperties
  ├─ Fonctions pures, zéro dépendance
  └─ 3 tests unitaires (locked→props, open→props, broken→props)

ÉTAPE 2: scenarioFlagMapper.ts (nouveau fichier)
  ├─ Fonctions pures, zéro dépendance
  └─ 6 tests unitaires

ÉTAPE 3: scene.ts — C3-1 (résolution enrichie)
  ├─ Modifier featureDefToInstance() + itemDefToResolvedTarget()
  ├─ Modifier getSceneContext() pour passer les définitions
  └─ 6 tests unitaires

ÉTAPE 4: scene.ts — C3-2 (filtrage revealedBy)
  ├─ Modifier la boucle de filtrage items dans getSceneContext()
  └─ 4 tests unitaires

ÉTAPE 5: types.ts — Étendre TurnDebugTrace
  ├─ 2 champs optionnels
  └─ Vérifier que tous les tests existants passent

ÉTAPE 6: processTurn.ts — C3-4 (Step 4b)
  ├─ Nouveau Step 4b + applyInteractionResolution()
  ├─ findItemDefInScenario()
  └─ 8 tests unitaires

ÉTAPE 7: processTurn.ts — C3-6 (O₂ flags)
  ├─ Modification du Step 4
  └─ 4 tests unitaires

ÉTAPE 8: game.ts — C3-7 (buildVictoryCheckContext + scenarioFlags)
  ├─ Intégrer mapScenarioFlags()
  └─ 5 tests unitaires

ÉTAPE 9: game.ts — C3-9 (initGame peuple featureStates)
  ├─ Boucle d'initialisation
  └─ 3 tests unitaires

ÉTAPE 10: narration/index.ts — C3-8 (narrative override)
  ├─ Guard dans narrateForTurn()
  └─ 3 tests unitaires

ÉTAPE 11: Tests d'intégration end-to-end
  └─ 12 tests de playthrough

ÉTAPE 12: Tests de stress
  └─ 5 tests de stress

ÉTAPE 13: Validation finale
  ├─ npm run check
  ├─ npm run test:stress
  ├─ TOUS les tests existants passent
  └─ Mettre à jour CLAUDE.md + exports
```

---

## 8. Critères d'Acceptation

### 8.1 Critères Techniques

```bash
npm run check                                      # ✅ 0 erreurs
npm test -- sceneEnriched                           # ✅ 12 tests
npm test -- processTurnScenario                     # ✅ 8 tests
npm test -- oxygenFlags                             # ✅ 4 tests
npm test -- scenarioFlagMapper                      # ✅ 6 tests
npm test -- scenarioNarrative                       # ✅ 3 tests
npm test -- initGameEnriched                        # ✅ 3 tests
npm test -- escapeEndToEnd                          # ✅ 12 tests
npm run test:stress -- escapeFullStress             # ✅ 5 tests stress
npm test                                            # ✅ TOUS tests existants passent
```

### 8.2 Critères Fonctionnels — "Le Jeu Marche"

Ces critères peuvent être vérifiés manuellement via le CLI playtest ou automatiquement via les tests E2E :

| # | Critère | Commande test (conceptuelle) | ✅ |
|---|---------|--------|---|
| 1 | "ouvrir casier" → jet FOR DC 10 → succès = items révélés | processTurn("ouvrir casier") | ✅ |
| 2 | "prendre badge" → badge dans inventaire | processTurn("prendre badge") | ✅ |
| 3 | "utiliser badge sur panneau" → flag `bulkhead_unlocked` set | processTurn("utiliser badge sur panneau") | ✅ |
| 4 | "ouvrir porte" (avec flag) → exit vers reveal débloqué | processTurn("ouvrir porte") | ✅ |
| 5 | "lire terminal" → contenu ORACLE affiché, pas une template | processTurn("lire terminal") | ✅ |
| 6 | Narrative = l'override FR de l'interaction, pas générique | narrateForTurn() check | ✅ |
| 7 | Item invisible quand conteneur fermé, visible quand ouvert | getSceneContext() check | ✅ |
| 8 | Feature descriptions changent avec l'état | getFeatureDescription() check | ✅ |
| 9 | O₂ drain réduit après REPAIR life_support | processTurn O₂ step check | ✅ |
| 10 | PULL lever → victoire alternative déclenchée | checkVictory() check | ✅ |

### 8.3 Le Test Ultime

```
Lancer un playthrough complet ESCAPE via le CLI playtest :
  1. Se réveiller dans START
  2. "examiner casier" → description locked
  3. "forcer le casier" → jet FOR DC 10 → "Le métal cède..."
  4. "prendre le badge" → badge dans inventaire
  5. "aller au checkpoint" → UNLOCK
  6. "utiliser badge sur panneau" → "Bip. Le voyant passe au vert."
  7. "ouvrir la porte" → passage vers REVEAL
  8. "lire le terminal" → Projet ORACLE révélé
  9. ... → ESCALATION → BOSS
  10. "utiliser badge sur écoutille" → pod ouvert
  11. "entrer dans le pod" → RESOLUTION → VICTOIRE
  
Le tout avec des narratives FR spécifiques à chaque interaction,
pas des templates génériques. Les items apparaissent au bon moment.
Les descriptions changent. Les flags pilotent la mécanique.
```

---

## 9. Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|-----------|
| `getSceneContext()` performance dégradée (résolution enrichie) | Latence perceptible | Le nombre de features par nœud est ≤ 5, résolution O(1) via registre. Negligeable. |
| Régression parser : nouveaux aliases créent des conflits | Faux positifs parsing | Les aliases sont spécifiques (pas de mots génériques comme "chose"). Tests parser existants détectent les régressions. |
| `processTurn` Step 4b trop complexe | Maintenabilité | Extraire `applyInteractionResolution()` comme fonction séparée. Step 4b ne fait que du dispatch. |
| scenarioFlagMapper hardcode les mappings par skeleton | Scalabilité | Acceptable pour 3 skeletons. Si > 5, migrer vers des déclarations dans les CoreSkeleton eux-mêmes. |
| Ordre des interactions : première qui match gagne | Edge case surprenant | Documenté dans le Chantier 1. Les interactions sont ordonnées par spécificité décroissante dans le Chantier 2. Tests d'intégration vérifient l'ordre. |

---

## 10. Hors Périmètre

- ❌ Réécriture d'INVESTIGATE et RESCUE avec le format enrichi (→ Chantier futur, même pattern que C2)
- ❌ Enrichissement des 15 modules (→ Chantier futur, parallélisable)
- ❌ Couches atmosphériques par-dessus les overrides narratifs (→ Chantier narratif)
- ❌ Ship Memory pour les interactions scénario (→ Extension future)
- ❌ Suggestions context-aware basées sur les interactions disponibles (→ Extension future, utilise les interactions pour générer des hints)
- ❌ Description de scène context-aware (getSceneDescription enrichi avec états) (→ Extension future)
- ❌ readableContent affiché par le système READ (→ Extension future, nécessite un hook dans processTurn pour les verbes READ/EXAMINE_DETAIL sur features avec readableContent)

---

## 11. Post-Chantier 3 : Le Premier Playthrough Complet

Après les 3 chantiers, le pipeline complet est :

```
Joueur tape "ouvrir le casier"
  ↓
parseAction() reconnaît "casier" via aliases enrichis → verb=OPEN, target=emergency_locker
  ↓
Step 4b: resolveScenarioInteraction(OPEN, emergency_locker, featureDef, state)
  ↓ match trigger: verb=OPEN, requiredState=locked, stat=FOR, dc=10
  ↓
rollCheck(FOR, dc=10) → succès
  ↓
InteractionResolution: { matched:true, success:true, newFeatureState:'open',
                         revealsItems:['access_keycard','oxygen_canister'] }
  ↓
applyInteractionResolution(state, resolution)
  ├─ setFeatureState(state, 'emergency_locker', 'open')
  ├─ revealItem(state, 'access_keycard')
  └─ revealItem(state, 'oxygen_canister')
  ↓
narrateForTurn() → "Le métal cède dans un crissement. Le verrou magnétique
                     saute — le casier s'ouvre. À l'intérieur : un badge
                     d'accès et une bonbonne d'oxygène de secours."
  ↓
UI affiche la narration + items visibles mis à jour
```

**C'est le moment où Void Walker devient un vrai RPG.**
