# Spec — Un Thème par Skeleton (Settings Cleanup)

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — commit `a931624`, `SkeletonTheme` embarqué dans `CoreSkeleton`.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Prérequis :** Phase 6 complète
> **Scope :** Modification moteur uniquement — pas de création de contenu module
> **Principe :** Chaque skeleton EST son thème. Le système de settings indépendant disparaît.

---

## 1. Décisions verrouillées

| Décision | Valeur |
|----------|--------|
| Mapping skeleton → thème | ESCAPE = vaisseau spatial délabré, INVESTIGATE = station spatiale, RESCUE = ruines alien |
| Settings indépendants | **Supprimés** — le concept de `SettingDefinition` comme entité séparée disparaît |
| `locationRole` abstrait | **Conservé** — résolution par skeleton au lieu de par setting |
| Modules universels | Gardent des noms génériques, compatibles avec tous les skeletons |
| Modules exclusifs | 5 par skeleton au lancement (15 nouveaux total) — contenu dans une passe séparée |
| Black Box matching | **Cross-skeleton** — le lore d'une partie ESCAPE peut apparaître dans INVESTIGATE |
| Objectif | Chaque skeleton a une identité visuelle/narrative forte et un pool de modules suffisant pour des parties Extended sans répétition |

---

## 2. Ce qui est supprimé

### 2.1 Fichiers à supprimer

| Fichier | Raison |
|---------|--------|
| `src/content/settings.ts` | Remplacé par les données intégrées dans chaque skeleton |
| `tests/unit/content/settings.test.ts` | Tests migrés vers les tests skeleton |
| `tests/stress/scenarioCombinations.test.ts` | La boucle `skeleton × setting × sessionLength` devient `skeleton × sessionLength` seulement |

### 2.2 Types à supprimer

```typescript
// SUPPRIMER de src/engine/scenario.ts :
type SettingCategory = 'space_vessel' | 'planetary' | 'alien' | 'facility';

interface SettingDefinition {
  id: string;
  nameKey: LocaleString;
  categories: SettingCategory[];
  supportedRoles: string[];
  locationNames: Record<string, LocaleString[]>;
}

// SUPPRIMER les exports :
// LAUNCH_SETTINGS, getSettingById, SETTING_IDS
```

### 2.3 Concept supprimé : compatibilité par catégorie

L'ancien système à 3 couches (universal → category → setting-specific) est remplacé par un système à 2 couches :

```
AVANT :  universal | category (space_vessel, alien, facility) | setting-specific
APRÈS :  universal | skeleton-exclusive (escape, investigate, rescue)
```

Le champ `ModuleCompatibility` actuel :
```typescript
// AVANT
interface ModuleCompatibility {
  universal: boolean;
  categories: SettingCategory[];
  settings: string[];
  excludeSettings: string[];
}
```

Devient :
```typescript
// APRÈS
interface ModuleCompatibility {
  universal: boolean;
  /** Si non-universel, liste des skeleton IDs compatibles */
  skeletons: string[];  // ex: ['escape', 'investigate']
}
```

---

## 3. Ce qui est modifié

### 3.1 Le skeleton intègre les données du thème

Le `CoreSkeleton` absorbe les responsabilités du `SettingDefinition` :

```typescript
interface CoreSkeleton {
  // ... champs existants inchangés ...
  id: string;
  nameKey: LocaleString;
  descriptionKey: LocaleString;
  nodes: CoreSkeletonNode[];
  gateItem: string;
  gateItemLocation: string;
  revelation: LocaleString;
  escalationTrigger: LocaleString;
  bossType: 'combat' | 'puzzle' | 'escape' | 'choice';
  primaryVictory: VictoryCondition;
  alternativeVictory: VictoryCondition;
  nodeLocations: Record<string, NodeLocationDef>;

  // === NOUVEAUX CHAMPS (absorbés du setting) ===

  /** Thème visuel/narratif du skeleton */
  theme: SkeletonTheme;
}

interface SkeletonTheme {
  /** ID du thème (ex: 'derelict_ship', 'space_station', 'alien_ruins') */
  id: string;
  /** Nom affiché */
  nameKey: LocaleString;
  /** Rôles de lieu supportés par ce thème */
  supportedRoles: string[];
  /** Pool de noms de lieux par rôle abstrait */
  locationNames: Record<string, LocaleString[]>;
  /** Features environnementales spécifiques au thème */
  features: string[];
  /** Items préférés (plus probable d'apparaître) */
  preferredItems: string[];
}
```

### 3.2 Mapping des thèmes

```
ESCAPE (id: 'escape')
  theme.id: 'derelict_ship'
  Rôles supportés: passage, control_room, storage, medical, quarters,
                   hub, dead_end, hazard_zone, engineering, airlock
  Ambiance: Nostromo, Event Horizon — métal rouillé, néons grésillants,
            alarmes silencieuses, vide spatial visible par les hublots

INVESTIGATE (id: 'investigate')
  theme.id: 'space_station'
  Rôles supportés: passage, control_room, storage, medical, quarters,
                   hub, dead_end, hazard_zone, engineering, airlock,
                   lab, server_room
  Ambiance: Station de recherche, bureaucratie spatiale, secrets
            corporatifs, labos immaculés devenus scènes de crime

RESCUE (id: 'rescue')
  theme.id: 'alien_ruins'
  Rôles supportés: passage, control_room, hub, dead_end, hazard_zone,
                   ritual_chamber, organic_growth, crystal_cave, gravity_well
  Ambiance: Architecture impossible, matériaux organiques, cristaux
            luminescents, gravité instable, technologie incompréhensible
```

### 3.3 Résolution des noms de lieux

L'ancien lookup `role × setting → name[]` devient `role → name[]` directement depuis le skeleton :

```typescript
// AVANT
function resolveLocationName(role: string, setting: SettingDefinition, rng: RngFn): LocaleString {
  const pool = setting.locationNames[role];
  return rngPick(rng, pool);
}

// APRÈS
function resolveLocationName(role: string, skeleton: CoreSkeleton, rng: RngFn): LocaleString {
  const pool = skeleton.theme.locationNames[role];
  return rngPick(rng, pool);
}
```

### 3.4 `assembleScenario` — signature et logique

```typescript
// AVANT
function assembleScenario(
  skeleton: CoreSkeleton,
  sessionLength: SessionLength,
  setting: SettingDefinition,     // ← SUPPRIMÉ
  allModules: ScenarioModule[],
  rng: RngFn,
): AssembledScenario;

// APRÈS
function assembleScenario(
  skeleton: CoreSkeleton,
  sessionLength: SessionLength,
  allModules: ScenarioModule[],
  rng: RngFn,
): AssembledScenario;
```

Changements internes :
1. `isModuleCompatible(module, setting)` → `isModuleCompatible(module, skeleton)`
2. Le filtre vérifie `module.compatibility.universal || module.compatibility.skeletons.includes(skeleton.id)`
3. Le filtre vérifie que le `locationRole` du module est dans `skeleton.theme.supportedRoles`
4. `resolveLocationNames(graph, setting, rng)` → `resolveLocationNames(graph, skeleton, rng)`
5. `buildLocationGraph(skeleton, placed, setting, rng)` → `buildLocationGraph(skeleton, placed, rng)` (le skeleton contient le thème)

### 3.5 `AssembledScenario` — mise à jour

```typescript
// AVANT
interface AssembledScenario {
  skeleton: CoreSkeleton;
  modules: PlacedModule[];
  graph: LocationGraph;
  setting: SettingDefinition;     // ← SUPPRIMÉ
  sessionLength: SessionLength;
}

// APRÈS
interface AssembledScenario {
  skeleton: CoreSkeleton;
  modules: PlacedModule[];
  graph: LocationGraph;
  sessionLength: SessionLength;
  // Le thème est accessible via skeleton.theme
}
```

### 3.6 `isModuleCompatible` — nouvelle logique

```typescript
// APRÈS
function isModuleCompatible(module: ScenarioModule, skeleton: CoreSkeleton): boolean {
  // 1. Vérifier la compatibilité skeleton
  if (!module.compatibility.universal) {
    if (!module.compatibility.skeletons.includes(skeleton.id)) {
      return false;
    }
  }

  // 2. Vérifier que le rôle de lieu est supporté par le thème
  const allModuleRoles = [
    module.locations.map(l => l.role),
    module.sideRooms.map(l => l.role),
  ].flat();

  for (const role of allModuleRoles) {
    if (!skeleton.theme.supportedRoles.includes(role)) {
      return false;
    }
  }

  return true;
}
```

### 3.7 Black Box — matching cross-skeleton

```typescript
// AVANT — matching par setting
function findBlackBoxEntry(setting: SettingDefinition): BlackBoxEntry | null {
  return entries.find(e => e.settingId === setting.id);
}

// APRÈS — matching cross-skeleton (tout est éligible)
function findBlackBoxEntry(skeleton: CoreSkeleton, rng: RngFn): BlackBoxEntry | null {
  // Toutes les entrées sont candidates, quel que soit le skeleton d'origine.
  // Priorité aux entrées du même thème (80%), mais cross-pollination possible (20%).
  const sameTheme = entries.filter(e => e.themeId === skeleton.theme.id);
  const otherTheme = entries.filter(e => e.themeId !== skeleton.theme.id);

  if (sameTheme.length > 0 && rngFloat(rng) < 0.8) {
    return rngPick(rng, sameTheme);
  }
  if (otherTheme.length > 0) {
    return rngPick(rng, otherTheme);
  }
  return sameTheme.length > 0 ? rngPick(rng, sameTheme) : null;
}
```

Note : les entrées Black Box stockent désormais `themeId` au lieu de `settingId`. Même si le matching est cross-skeleton, le `themeId` permet de pondérer en faveur du même univers visuel.

---

## 4. Audit des 15 modules existants

Chaque module doit être re-classifié : universel ou skeleton-exclusive.

### 4.1 Critères de reclassification

Un module est **universel** si :
- Son obstacle est conceptuellement générique (porte bloquée, créature, terminal)
- Son `locationRole` est dans les `supportedRoles` des 3 thèmes
- Sa narration ne dépend pas d'une esthétique spécifique

Un module est **skeleton-exclusive** si :
- Son `locationRole` n'existe que dans certains thèmes (ex: `server_room` → investigate, `ritual_chamber` → rescue)
- Son concept est thématiquement incompatible (ex: airlock → pas dans alien_ruins)

### 4.2 Reclassification attendue

| Module | Type actuel | Nouveau statut | Skeletons | Raison |
|--------|-------------|----------------|-----------|--------|
| `blocked_passage_01` | universal | **universal** | tous | Porte bloquée = générique |
| `wounded_survivor_01` | universal | **universal** | tous | Survivant blessé = générique |
| `dark_room_01` | universal | **universal** | tous | Pièce sombre = générique |
| `supply_cache_01` | universal | **universal** | tous | Cache de ressources = générique |
| `ambush_01` | universal | **universal** | tous | Embuscade = générique |
| `airlock_malfunction_01` | category (space_vessel) | **exclusive** | escape, investigate | Airlock n'existe pas dans alien_ruins |
| `malfunctioning_android_01` | category (space_vessel) | **exclusive** | escape, investigate | Androïde = technologie humaine, pas dans les ruines alien |
| `alien_mechanism_01` | category (alien) | **exclusive** | rescue | Mécanisme alien = ruines alien uniquement |
| `containment_breach_01` | category (facility) | **exclusive** | investigate | Confinement = station de recherche |
| `power_reroute_dilemma_01` | category (space_vessel) | **universal** | tous | Rerouter l'énergie = générique (cristaux alien ont aussi de l'énergie). Adapter la narration. |
| `patrol_entity_01` | complex | **universal** | tous | Créature en patrouille = générique |
| `flooded_section_01` | complex | **exclusive** | escape, investigate | Inondation = tuyauterie, pas dans les ruines alien. Sauf si on le renomme "section submergée" — à évaluer. |
| `survivor_rescue_01` | complex | **universal** | tous | Sauvetage de NPC = générique |
| `terminal_decrypt_01` | complex | **exclusive** | investigate | Rôle `server_room` = station uniquement |
| `explosive_decompression_risk_01` | complex | **exclusive** | escape, investigate | Décompression = vide spatial, pas dans les ruines |

**Résultat de l'audit :**
- 7 modules universels (accessibles aux 3 skeletons)
- 2 modules exclusifs escape + investigate
- 1 module exclusif investigate seul
- 1 module exclusif rescue seul
- 1 module (flooded_section) à évaluer — potentiellement adaptable en universel

### 4.3 Pool par skeleton après audit

| Skeleton | Universels | Exclusifs existants | Total existant | Objectif Extended (8-12) |
|----------|-----------|-------------------|----------------|--------------------------|
| ESCAPE | 7 | 4 (airlock, android, flooded, decompression) | 11 | ✅ Suffisant |
| INVESTIGATE | 7 | 5 (airlock, android, containment, terminal, decompression) | 12 | ✅ Suffisant |
| RESCUE | 7 | 1 (alien_mechanism) | 8 | ⚠️ Juste — les 5 nouveaux modules exclusifs sont critiques |

---

## 5. Structure des 15 nouveaux modules (slots)

Le contenu sera créé dans une passe séparée. Cette spec définit uniquement la **structure attendue** et les **slots** à remplir.

### 5.1 ESCAPE — 5 modules exclusifs (thème vaisseau)

| Slot | Type suggéré | Location Role | Tension Range | Concept indicatif |
|------|-------------|---------------|---------------|-------------------|
| `escape_exclusive_01` | environmental | engineering | [3, 6] | Fuite de réacteur / radiation |
| `escape_exclusive_02` | blocked_passage | airlock | [5, 8] | Sas endommagé, passage EVA risqué |
| `escape_exclusive_03` | moral_choice | quarters | [4, 7] | Cabines de l'équipage, choix sur les survivants |
| `escape_exclusive_04` | exploration | storage | [2, 5] | Soute principale, loot mais risque d'effondrement |
| `escape_exclusive_05` | ambush | hazard_zone | [7, 10] | Zone dépressurisée, créature embusquée |

### 5.2 INVESTIGATE — 5 modules exclusifs (thème station)

| Slot | Type suggéré | Location Role | Tension Range | Concept indicatif |
|------|-------------|---------------|---------------|-------------------|
| `investigate_exclusive_01` | terminal_puzzle | lab | [3, 6] | Labo de recherche, données corrompues |
| `investigate_exclusive_02` | npc_encounter | server_room | [4, 7] | IA de la station, coopérative ou hostile |
| `investigate_exclusive_03` | environmental | lab | [6, 9] | Expérience incontrôlée, confinement biologique |
| `investigate_exclusive_04` | moral_choice | medical | [5, 8] | Patient quarantaine, libérer ou confiner |
| `investigate_exclusive_05` | exploration | server_room | [3, 5] | Archives secrètes, lore profond |

### 5.3 RESCUE — 5 modules exclusifs (thème ruines alien)

| Slot | Type suggéré | Location Role | Tension Range | Concept indicatif |
|------|-------------|---------------|---------------|-------------------|
| `rescue_exclusive_01` | environmental | crystal_cave | [3, 6] | Caverne de cristaux, résonance dangereuse |
| `rescue_exclusive_02` | terminal_puzzle | control_room | [4, 7] | Interface alien, traduire les symboles |
| `rescue_exclusive_03` | npc_encounter | organic_growth | [5, 8] | Entité alien non-hostile, communication empathique |
| `rescue_exclusive_04` | blocked_passage | gravity_well | [6, 9] | Puits gravitationnel, traversée périlleuse |
| `rescue_exclusive_05` | ambush | ritual_chamber | [7, 10] | Gardien des ruines, combat ou rituel d'apaisement |

### 5.4 Exigences structurelles pour les nouveaux modules

Chaque nouveau module DOIT respecter :
- 3+ chemins de résolution utilisant des stats différentes
- Failsafe sur le chemin critique
- 3 skins narratifs (low/mid/high)
- 1-3 locations sur le chemin critique + 0-2 side rooms
- Locale FR complète (entryPrefix, obstaclePrefix, successSuffix, failureSuffix)
- `compatibility.universal = false`, `compatibility.skeletons = [skeleton_id]`

---

## 6. Impact sur les fichiers existants

### 6.1 Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/engine/scenario.ts` | Supprimer `SettingDefinition`, `SettingCategory`. Ajouter `SkeletonTheme` au `CoreSkeleton`. Modifier `ModuleCompatibility`. Supprimer `setting` de `AssembledScenario`. |
| `src/engine/pacing.ts` | Modifier `assembleScenario` (retirer paramètre setting). Modifier `isModuleCompatible`. Modifier `resolveLocationNames`. Modifier `buildLocationGraph`. |
| `src/content/scenarios/escape.ts` | Ajouter `theme: SkeletonTheme` avec les données de `derelict_ship` |
| `src/content/scenarios/investigate.ts` | Ajouter `theme: SkeletonTheme` avec les données de `space_station` |
| `src/content/scenarios/rescue.ts` | Ajouter `theme: SkeletonTheme` avec les données de `alien_ruins` |
| `src/content/scenarios/modules/universal.ts` | Mettre à jour `compatibility` (retirer `categories`, `settings`, `excludeSettings`) |
| `src/content/scenarios/modules/category.ts` | Renommer en `exclusive.ts`. Mettre à jour `compatibility` vers le nouveau format. |
| `src/content/scenarios/modules/complex.ts` | Mettre à jour `compatibility` vers le nouveau format. Certains deviennent universels. |
| `src/content/scenarios/modules/index.ts` | Réorganiser les imports. |
| `src/engine/game.ts` | Mettre à jour `initGame` si elle référence le setting. |
| `src/engine/scene.ts` | Mettre à jour si `getSceneContext` référence le setting. |
| `scripts/diagnose.ts` | Retirer `LAUNCH_SETTINGS`, utiliser directement le skeleton. |
| `scripts/ai-playtest.ts` | Idem. |
| `scripts/testModule.ts` | Idem. |
| `tests/playtest/cli.ts` | Idem. |

### 6.2 Fichiers à supprimer

| Fichier | Raison |
|---------|--------|
| `src/content/settings.ts` | Données absorbées par les skeletons |
| `tests/unit/content/settings.test.ts` | Tests migrés |
| `tests/stress/scenarioCombinations.test.ts` | Remplacé par une version sans setting |

### 6.3 Tests à créer/modifier

| Test | Changement |
|------|-----------|
| `tests/unit/content/scenarios/skeletons.test.ts` | Ajouter validation du `theme` : rôles supportés, 20+ noms par rôle, noms FR non-vides |
| `tests/unit/content/scenarios/modules.test.ts` | Reclassifier les tests de compatibilité. Tester le nouveau `isModuleCompatible(module, skeleton)`. |
| `tests/unit/engine/pacing.test.ts` | Retirer le paramètre setting de tous les appels. |
| `tests/stress/scenarioCombinations.test.ts` | Nouvelle version : `skeleton × sessionLength` uniquement (3 × 3 = 9 combos). |
| `tests/integration/scenarioInteraction.test.ts` | Retirer les refs au setting. |

---

## 7. Ordre d'exécution

1. **Modifier les types** dans `src/engine/scenario.ts` — ajouter `SkeletonTheme`, modifier `ModuleCompatibility`, supprimer `SettingDefinition`
2. **Migrer les données** — copier les `locationNames` de `settings.ts` dans chaque skeleton
3. **Modifier `pacing.ts`** — retirer le paramètre setting, adapter `isModuleCompatible`, `resolveLocationNames`, `buildLocationGraph`
4. **Reclassifier les modules** — mettre à jour le champ `compatibility` de chaque module
5. **Supprimer `settings.ts`** et les fichiers obsolètes
6. **Mettre à jour tous les tests**
7. **Mettre à jour les scripts** (diagnose, playtest, testModule)
8. **Lancer la suite de tests complète** — 0 échecs

---

## 8. Critères d'acceptation

- [ ] `SettingDefinition` n'existe plus nulle part dans le codebase
- [ ] `LAUNCH_SETTINGS` n'existe plus
- [ ] `assembleScenario` ne prend plus de paramètre `setting`
- [ ] Chaque skeleton a un `theme` avec 20+ noms par rôle supporté
- [ ] `isModuleCompatible` fonctionne avec le nouveau système `universal/skeletons`
- [ ] Les 15 modules existants ont une `compatibility` reclassifiée
- [ ] Le Black Box matche cross-skeleton avec pondération thème
- [ ] Tous les tests passent (unit, integration, stress)
- [ ] Les scripts `diagnose.ts`, `ai-playtest.ts`, `testModule.ts` fonctionnent sans setting
- [ ] Une session Extended (8-12 modules) est assemblable pour chaque skeleton
