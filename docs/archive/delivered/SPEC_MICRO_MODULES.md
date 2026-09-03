# Spec — Système de Micro-Modules

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — 46 micro-modules (loot 9 / lore 15 / encounter 10 / ambiance 12).
> Le pool `loot` est sous la cible de la spec (12-15).
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> **Prérequis :** Spec "Un Thème par Skeleton" implémentée
> **Scope :** Nouveau système de pièces adjacentes optionnelles, ajoutées procéduralement aux nœuds du chemin critique
> **Principe :** Enrichir l'exploration sans jamais impacter le chemin critique ni créer de risque anti-softlock

---

## 1. Décisions verrouillées

| Décision | Valeur |
|----------|--------|
| Nom du système | **Micro-Modules** |
| Relation avec le module parent | **100% indépendants** — aucune synergie mécanique avec l'obstacle du nœud parent |
| Visibilité | **~60% ouvertes, ~40% cachées** — les cachées nécessitent un check de Perception |
| Obstacles d'entrée | **Mix** — certaines verrouillées (mini-obstacle à 2 paths), certaines ouvertes |
| Failsafe dans les micro-modules | **Aucun** — l'échec = on n'entre pas / on ne loot pas, ce n'est jamais bloquant |
| Mode Quick (0 modules) | **1-2 micro-modules sur les core nodes** (orientés lore/ambiance) |
| Créature en embuscade | **Oui**, en haute tension, avec **indice sonore/visuel depuis la pièce parente** |
| Fragments de lore | **Indépendants** — chaque fragment raconte un micro-épisode autonome |
| Catégories de support de lore | 4 types avec **impact mécanique** (INT, PER, CHA, gratuit) |
| Pool de contenu | **Pré-écrit** — chaque micro-module est une pièce complètement définie |
| Volume cible | **45-57 micro-modules** au lancement |

---

## 2. Architecture

### 2.1 Concept : Slots de micro-modules

Chaque nœud du chemin critique (core node ou module) possède **0 à 2 slots** de micro-modules. Au moment de l'assemblage du scénario, le système remplit ces slots en piochant dans un pool de micro-modules pré-écrits, filtrés par contexte.

```
Module principal (chemin critique)
  ├── [slot 1] → micro_loot_storage_01 (salle de stockage, verrouillée)
  └── [slot 2] → micro_lore_terminal_03 (bureau, ouvert, hidden)
```

Les micro-modules sont des **dead ends** : une seule sortie, qui ramène au nœud parent. Le joueur entre, interagit (ou pas), et revient.

### 2.2 Interface `MicroModule`

```typescript
interface MicroModule {
  readonly id: string;
  readonly type: MicroModuleType;

  // === Contexte de génération ===
  /** Rôles de la pièce parente compatibles (ex: 'control_room', 'passage') */
  readonly validParentRoles: readonly string[];
  /** Beats dans lesquels ce micro-module peut apparaître */
  readonly validBeats: readonly BeatZone[];
  /** Restriction par skeleton (null/vide = tous) */
  readonly validSkeletons?: readonly string[];

  // === Visibilité ===
  readonly visibility: 'open' | 'hidden';
  /** DC du check passif de Perception si hidden (omis si open) */
  readonly hiddenDC?: number;

  // === Lieu ===
  /** Rôle abstrait du lieu (résolu par le thème du skeleton) */
  readonly locationRole: string;
  readonly features: readonly FeatureDefinition[];
  readonly items?: readonly ItemDefinition[];
  readonly npcs?: readonly NpcDefinition[];
  readonly atmosphere?: AtmosphereType;

  // === Mini-obstacle d'entrée (optionnel) ===
  readonly entryObstacle?: MiniObstacle | null;

  // === Lore (si type === 'lore') ===
  readonly loreData?: MicroModuleLoreData;

  // === Créature (si type === 'encounter' et créature possible) ===
  readonly creatureAmbush?: CreatureAmbushData;

  // === Narration ===
  readonly locale: {
    readonly fr: MicroModuleLocaleData;
  };
}

type MicroModuleType = 'loot' | 'lore' | 'encounter' | 'ambiance';
```

### 2.3 Mini-obstacles

Les mini-obstacles gardent la même structure que les obstacles normaux, mais allégés :

```typescript
interface MiniObstacle {
  readonly type: 'locked_door' | 'jammed_panel' | 'debris' | 'sealed_container';
  /** 2 chemins suffisent (vs 3+ pour les modules du chemin critique) */
  readonly paths: readonly [ObstaclePath, ObstaclePath];
  readonly description: LocaleString;
  // PAS de failsafe — l'échec = le joueur ne peut pas entrer, point.
  // La room est optionnelle, c'est anti-softlock par design.
}
```

### 2.4 Narration locale

```typescript
interface MicroModuleLocaleData {
  /** Description à la première visite */
  readonly description: string;
  /** Indice visible depuis la pièce parente quand hidden + détecté */
  readonly hintText: string;
  /** Description quand le joueur revient */
  readonly revisitDescription: string;
  /** Indice sonore/visuel si créature en embuscade (depuis la pièce parente) */
  readonly creatureWarningHint?: string;
}
```

---

## 3. Système de visibilité

### 3.1 Deux catégories

**Ouvertes (`open`)** — apparaissent immédiatement dans les sorties de la pièce parente. La narration mentionne la porte/passage. Aucun check requis pour savoir qu'elles existent.

**Cachées (`hidden`)** — n'apparaissent PAS dans les sorties par défaut. Trois mécanismes de révélation :

### 3.2 Mécanismes de révélation des pièces cachées

```
Entrée dans la pièce parente
  │
  ├─ 1. Jet passif PER vs hiddenDC
  │     → succès : la sortie apparaît + hintText dans la narration
  │     → échec : la pièce reste invisible (pour l'instant)
  │
  ├─ 2. Action explicite EXAMINER / FOUILLER (tour du joueur)
  │     → jet actif PER vs (hiddenDC - 2)
  │     → succès : révélation
  │     → échec : "Vous ne remarquez rien de particulier"
  │
  └─ 3. Hint system (filet de sécurité)
        → Si le joueur reste 4+ tours dans la pièce parente
           sans avoir trouvé la room cachée
        → Révélation gratuite via le hint system
        → "Vous remarquez une ouverture que vous n'aviez pas vue..."
```

### 3.3 Implémentation du check passif

Le check passif se déclenche **une seule fois**, à la première visite du nœud parent. Il est silencieux — pas de jet de dé visible. Le résultat est stocké dans l'état du jeu.

```typescript
interface MicroModuleState {
  /** ID du micro-module */
  microModuleId: string;
  /** A-t-il été révélé au joueur ? */
  revealed: boolean;
  /** Le joueur l'a-t-il visité ? */
  visited: boolean;
  /** Le check passif a-t-il été tenté ? */
  passiveCheckDone: boolean;
}
```

### 3.4 Ratio et distribution par beat

| Beat | % Open | % Hidden | Logique |
|------|--------|----------|---------|
| intro | 80% | 20% | On guide le joueur, peu de secrets |
| rising | 60% | 40% | L'exploration commence |
| midpoint | 50% | 50% | Équilibre |
| escalation | 40% | 60% | Secrets récompensent le joueur courageux |
| climax | 30% | 70% | Le joueur est censé courir, les trésors sont pour les audacieux |
| resolution | 100% | 0% | Épilogue, tout est ouvert |

---

## 4. Les 4 types de micro-modules

### 4.1 LOOT — Récompense d'exploration

Le joueur trouve un objet utile. Peut être derrière un mini-obstacle.

- **Items proportionnels au beat** : medkit basique en intro, arme improvisée en escalation
- **Certains items UNIQUEMENT trouvables en micro-modules** → récompense l'exploration
- **Pas de lore, pas de NPC** — c'est direct et transactionnel

Exemples :
- Casier de sécurité (verrouillé, INT DC 10) contenant un kit de réparation
- Cadavre dans un placard (ouvert) avec une arme de fortune
- Compartiment caché (hidden, PER DC 12) avec un medkit avancé

### 4.2 LORE — Fragments narratifs

Le joueur découvre un élément de lore autonome. Chaque fragment est un **micro-épisode indépendant** qui enrichit l'univers sans nécessiter les autres fragments.

#### Catégories de support et impact mécanique

| Support | Check requis | Stat | DC typique | Description |
|---------|-------------|------|------------|-------------|
| `data_terminal` | Oui | INT | 10-13 | Terminal informatique, logs corrompus à décrypter |
| `physical_document` | Non | — | — | Papier, carnet, photo — toujours lisible gratuitement |
| `environmental_trace` | Oui | PER | 10-12 | Griffures, traces de sang, symboles gravés — à interpréter |
| `npc_testimony` | Oui | CHA | 10-12 | Un PNJ qui sait quelque chose — convaincre de parler |

```typescript
interface MicroModuleLoreData {
  /** Catégorie de support */
  readonly supportType: LoreSupportType;
  /** Stat requise pour accéder au contenu (null si gratuit) */
  readonly accessStat?: StatName;
  /** DC du check d'accès (null si gratuit) */
  readonly accessDC?: number;
  /** Le texte de lore en cas de succès */
  readonly loreText: LocaleString;
  /** Texte alternatif si le check échoue (aperçu partiel) */
  readonly failureText?: LocaleString;
  /** Alimente le Black Box ? */
  readonly feedsBlackBox: boolean;
}

type LoreSupportType = 'data_terminal' | 'physical_document' | 'environmental_trace' | 'npc_testimony';
```

**Point important** : même en cas d'échec du check d'accès, le joueur obtient un **aperçu partiel** (failureText). Il sait que quelque chose est là, il ne peut juste pas tout lire. Ça évite la frustration et donne envie de revenir avec un personnage plus compétent.

#### Liste de lore par skeleton

Chaque skeleton définit un **pool de fragments de lore** dans lequel les micro-modules lore piochent. Les fragments sont indépendants mais thématiquement cohérents.

```typescript
// Ajout dans CoreSkeleton
interface CoreSkeleton {
  // ... champs existants ...
  /** Pool de fragments de lore pour les micro-modules */
  readonly lorePool: readonly LoreFragment[];
}

interface LoreFragment {
  readonly id: string;
  /** Le texte du fragment */
  readonly text: LocaleString;
  /** Support compatible (peut être affiché sur ce type de support) */
  readonly compatibleSupports: readonly LoreSupportType[];
  /** Beats dans lesquels ce fragment peut apparaître */
  readonly validBeats: readonly BeatZone[];
  /** Alimente le Black Box ? */
  readonly feedsBlackBox: boolean;
}
```

Le système d'assemblage sélectionne un fragment du pool et l'injecte dans le micro-module lore au moment de la génération. Un fragment n'apparaît qu'une seule fois par run.

### 4.3 ENCOUNTER — Rencontre intime

Un NPC secondaire ou un événement interactif. Plus intime et étrange que les encounters du chemin principal.

- **Survivant caché** — en panique, peut devenir allié temporaire (bonus +2 au prochain check) ou complication (attire la créature)
- **Androïde en boucle** — répète les derniers ordres, peut donner un indice ou devenir hostile
- **Animal de l'équipage** — moment d'humanité dans l'horreur
- **Entité mineure** — pas la créature principale, mais quelque chose d'autre

Les encounters de micro-modules ont des conséquences **locales** (bonus temporaire, indice, moment narratif) mais n'impactent pas les conditions de victoire.

### 4.4 AMBIANCE — Pure atmosphère

Zéro mécanique. Pas d'item, pas de NPC, pas d'obstacle, pas de check. Le joueur entre, lit le texte, et repart. Ces pièces existent pour :

- L'horreur (la serre hydroponique où les plantes ont muté en quelque chose)
- Le worldbuilding (la chapelle improvisée avec des noms gravés dans le métal)
- L'émotion (la cabine d'enfant — il y avait des familles à bord ?)
- Le malaise (la pièce qui semble n'avoir jamais été là)

Les micro-modules ambiance sont les plus simples à écrire et les plus impactants pour l'immersion. Ils ne contiennent qu'une description.

---

## 5. Créature en embuscade

### 5.1 Conditions d'activation

La créature peut apparaître dans un micro-module SI :

1. Le scénario possède une créature mobile (pas tous les scénarios)
2. Le threat director est en **haute tension** (niveau ≥ 4 sur 6)
3. Le micro-module est de type `encounter` ou `ambiance` (pas loot — la récompense neutralise l'horreur)
4. Le micro-module a un flag `creatureAmbush` défini

### 5.2 Mécanisme d'avertissement

**Avant que le joueur entre**, la pièce parente affiche un indice :

```
"Un bruit de grattement vient de derrière la porte du [nom de la side room].
Quelque chose remue à l'intérieur."
```

L'indice est défini dans `locale.fr.creatureWarningHint` du micro-module. Il est affiché dans la narration du nœud parent quand :
- Le joueur est dans le nœud parent
- Le threat director a décidé de placer la créature ici
- La side room est visible (revealed ou open)

Le joueur a le **choix** : entrer quand même (courage ou cupidité) ou éviter la pièce.

### 5.3 Données d'embuscade

```typescript
interface CreatureAmbushData {
  /** Tension minimum du threat director pour activer l'embuscade */
  readonly minThreatLevel: number;  // 4, 5, ou 6
  /** Le type de confrontation si le joueur entre */
  readonly confrontationType: 'combat' | 'flee' | 'hide';
  /** DC de la confrontation */
  readonly confrontationDC: number;
  /** Stat utilisée */
  readonly confrontationStat: StatName;
  /** Conséquence de l'échec (dégâts, perte d'item, etc.) */
  readonly failureConsequence: 'damage' | 'item_loss' | 'status_effect';
  /** Montant de dégâts si failureConsequence === 'damage' */
  readonly damageAmount?: number;
}
```

### 5.4 Interaction avec le threat director

Quand le threat director décide de placer la créature dans un micro-module :
- L'encounter aléatoire du threat director est **consommée** (pas de double menace)
- Le compteur de tours depuis la dernière encounter est reset
- Si le joueur n'entre PAS dans la side room, la créature y reste mais le threat director augmente la tension ambiante (bruits, indices visuels dans le nœud parent)

---

## 6. Distribution des slots

### 6.1 Par session length

| Session | Nœuds critiques | Slots totaux | Micro-modules placés | Types favorisés |
|---------|----------------|-------------|---------------------|-----------------|
| Quick (0 modules) | 6 core nodes | 4-6 | 1-2 | lore, ambiance |
| Standard (3-5 modules) | 6 + 3-5 = 9-11 | 10-16 | 6-10 | mix équilibré |
| Extended (8-12 modules) | 6 + 8-12 = 14-18 | 16-24 | 12-18 | mix équilibré |

### 6.2 Règles de placement des slots

```typescript
interface SlotDistribution {
  /** Nombre de slots par nœud (core ou module) */
  slotsPerNode: (node: LocationNode) => 0 | 1 | 2;
}

function computeSlots(node: LocationNode, sessionLength: SessionLength): number {
  // START : 0 slots (prologue, pas d'exploration)
  if (node.coreNodeId === 'start') return 0;

  // RESOLUTION : 0 slots (épilogue)
  if (node.coreNodeId === 'resolution') return 0;

  // BOSS : 0 slots (climax, focus total)
  if (node.coreNodeId === 'boss') return 0;

  // Quick mode : 1 slot max, seulement sur UNLOCK et REVEAL
  if (sessionLength === 'quick') {
    if (node.coreNodeId === 'unlock') return 1;
    if (node.coreNodeId === 'reveal') return 1;  // 50% chance d'être 0
    return 0;
  }

  // Standard/Extended : 0-2 basé sur le beat
  switch (node.beat) {
    case 'intro':       return 1;       // Max 1 en intro
    case 'rising':      return 2;       // Exploration maximale
    case 'midpoint':    return 1;       // Transition
    case 'escalation':  return 1;       // Urgence, peu de side rooms
    case 'climax':      return 0;       // Pas de distraction
    case 'resolution':  return 0;       // Épilogue
    default:            return 1;
  }
}
```

### 6.3 Algorithme de remplissage des slots

```typescript
function fillMicroModuleSlots(
  graph: LocationGraph,
  skeleton: CoreSkeleton,
  allMicroModules: readonly MicroModule[],
  sessionLength: SessionLength,
  rng: RngFn,
): PlacedMicroModule[] {
  const placed: PlacedMicroModule[] = [];
  const usedIds = new Set<string>();
  const usedLoreFragmentIds = new Set<string>();

  for (const node of graph.nodes) {
    const slotCount = computeSlots(node, sessionLength);

    for (let i = 0; i < slotCount; i++) {
      // 1. Filtrer les candidats
      const candidates = allMicroModules.filter(mm => {
        if (usedIds.has(mm.id)) return false;                                  // Pas de doublon
        if (!mm.validParentRoles.includes(node.role ?? '')) return false;       // Rôle compatible
        if (!mm.validBeats.includes(node.beat)) return false;                  // Beat compatible
        if (mm.validSkeletons && !mm.validSkeletons.includes(skeleton.id)) return false; // Skeleton compatible
        if (mm.locationRole && !skeleton.theme.supportedRoles.includes(mm.locationRole)) return false; // Rôle supporté
        return true;
      });

      if (candidates.length === 0) continue;

      // 2. Pondérer par type (varier les types dans un même scénario)
      const typeWeights = computeTypeWeights(placed, node.beat);
      const selected = weightedPick(candidates, typeWeights, rng);

      // 3. Si c'est un micro-module lore, assigner un fragment
      let assignedLoreFragment: LoreFragment | undefined;
      if (selected.type === 'lore' && skeleton.lorePool) {
        const availableFragments = skeleton.lorePool.filter(f =>
          !usedLoreFragmentIds.has(f.id)
          && f.validBeats.includes(node.beat)
          && (selected.loreData?.supportType
            ? f.compatibleSupports.includes(selected.loreData.supportType)
            : true)
        );
        if (availableFragments.length > 0) {
          assignedLoreFragment = rngPick(rng, availableFragments);
          usedLoreFragmentIds.add(assignedLoreFragment.id);
        }
      }

      // 4. Placer
      placed.push({
        microModule: selected,
        parentNodeId: node.id,
        assignedLoreFragment,
        creatureActive: false,  // Déterminé plus tard par le threat director
      });
      usedIds.add(selected.id);
    }
  }

  return placed;
}
```

### 6.4 Pondération des types

Pour éviter 5 salles de loot d'affilée, le système pondère les types en fonction de ce qui a déjà été placé et du beat actuel :

```typescript
function computeTypeWeights(
  alreadyPlaced: PlacedMicroModule[],
  currentBeat: BeatZone,
): Record<MicroModuleType, number> {
  const counts = { loot: 0, lore: 0, encounter: 0, ambiance: 0 };
  for (const p of alreadyPlaced) counts[p.microModule.type]++;

  // Base weights par beat
  const base: Record<BeatZone, Record<MicroModuleType, number>> = {
    intro:      { loot: 2, lore: 3, encounter: 1, ambiance: 4 },
    rising:     { loot: 3, lore: 3, encounter: 2, ambiance: 2 },
    midpoint:   { loot: 2, lore: 4, encounter: 2, ambiance: 2 },
    escalation: { loot: 3, lore: 2, encounter: 3, ambiance: 2 },
    climax:     { loot: 1, lore: 1, encounter: 3, ambiance: 1 },  // Rare, si slot existe
    resolution: { loot: 1, lore: 2, encounter: 1, ambiance: 3 },
  };

  const weights = { ...base[currentBeat] };

  // Réduire le poids des types surreprésentés
  for (const type of Object.keys(weights) as MicroModuleType[]) {
    if (counts[type] >= 3) weights[type] *= 0.3;
    else if (counts[type] >= 2) weights[type] *= 0.6;
  }

  return weights;
}
```

---

## 7. Intégration dans le graphe

### 7.1 Les micro-modules comme nœuds du graphe

Chaque micro-module placé devient un `LocationNode` dans le graphe, avec un edge bidirectionnel vers son nœud parent.

```typescript
// Nouveau champ sur LocationNode
interface LocationNode {
  // ... champs existants ...
  /** Si ce nœud est un micro-module */
  readonly isMicroModule?: boolean;
  /** ID du micro-module source */
  readonly microModuleId?: string;
  /** ID du nœud parent (pour les micro-modules) */
  readonly parentNodeId?: string;
}
```

Les micro-modules sont des **dead ends** dans le graphe : un seul edge vers le parent.

```
parent_node ←→ micro_module_node (dead end)
```

### 7.2 Impact sur la validation du graphe

La validation existante (`validateAssembledScenario`) doit être ajustée :
- Les micro-modules sont exclus du check "chemin critique" (ils ne sont jamais sur le critical path)
- Les micro-modules ne comptent pas dans la validation de la courbe de tension
- Les micro-modules dead-ends ne sont PAS des "orphans" — ils sont connectés à leur parent

### 7.3 Impact sur `getSceneContext`

Quand le joueur est dans un nœud parent :
- Les micro-modules **open** apparaissent dans `connectedLocations`
- Les micro-modules **hidden + revealed** apparaissent dans `connectedLocations`
- Les micro-modules **hidden + non-revealed** sont invisibles

Quand le joueur est dans un micro-module :
- La seule sortie est le nœud parent
- Le threat director peut mettre à jour les indices de créature

---

## 8. Intégration avec le threat director

### 8.1 Activation de l'embuscade de créature

Au début de chaque tour dans un nœud parent, si :
1. Le nœud a un micro-module avec `creatureAmbush` défini
2. Le threat director est au niveau requis (`>= creatureAmbush.minThreatLevel`)
3. Le micro-module est visible (revealed ou open)
4. La créature n'est pas déjà en encounter ailleurs

→ Le threat director **active** l'embuscade :
- Le `creatureWarningHint` est injecté dans la narration du nœud parent
- Le flag `creatureActive` du micro-module est mis à `true`
- L'encounter aléatoire du threat director est consommée (pas de double menace)

### 8.2 Ce qui se passe si le joueur entre

```
Joueur entre dans micro-module avec creatureActive === true
  │
  ├─ Jet de confrontation (stat vs DC défini dans creatureAmbush)
  │    → Succès : le joueur survit, la créature fuit, loot accessible
  │    → Échec : conséquence (dégâts, perte d'item, status effect)
  │              + le joueur est repoussé dans le nœud parent
  │
  └─ Dans les deux cas : la créature quitte la side room
     → Le threat director reset le cooldown d'encounter
```

### 8.3 Ce qui se passe si le joueur n'entre pas

La créature reste dans la side room pendant **3 tours**. Pendant ces tours, des indices sonores sont ajoutés à la narration du nœud parent (grattements, bruits sourds). Après 3 tours, la créature se déplace ailleurs et le micro-module redevient safe.

---

## 9. Volume de contenu

### 9.1 Répartition cible

| Type | Quantité | Répartition par skeleton |
|------|----------|-------------------------|
| Loot | 12-15 | ~5 universels, ~3 par skeleton |
| Lore | 15-20 | ~5 universels, ~5 par skeleton |
| Encounter | 8-10 | ~4 universels, ~2 par skeleton |
| Ambiance | 10-12 | ~4 universels, ~2 par skeleton |
| **Total** | **45-57** | |

### 9.2 Fragments de lore par skeleton

Chaque skeleton a un pool de **15-20 fragments de lore** indépendants :

| Skeleton | Thèmes de lore |
|----------|---------------|
| ESCAPE | Derniers jours de l'équipage, journal du capitaine, rapport d'incident, messages personnels, protocoles d'urgence ignorés |
| INVESTIGATE | Rapports de recherche, emails internes, données expérimentales, notes whistleblower, correspondance corporate |
| RESCUE | Inscriptions alien traduites, observations de terrain, hypothèses xéno-archéologiques, témoignages de premiers explorateurs |

### 9.3 Complexité par type

| Type | Effort par unité | Composants |
|------|-----------------|------------|
| Loot | Faible | 1 description + 1 item + mini-obstacle optionnel |
| Lore | Moyen | 1 description + 1 fragment de lore + check d'accès |
| Encounter | Élevé | 1 description + 1 NPC + dialogue + conséquences |
| Ambiance | Faible | 1 description longue uniquement |

---

## 10. Impact sur les fichiers

### 10.1 Fichiers à créer

| Fichier | Contenu |
|---------|---------|
| `src/engine/microModules.ts` | Types `MicroModule`, `MiniObstacle`, `MicroModuleLoreData`, `CreatureAmbushData`, `PlacedMicroModule`, `MicroModuleState`. Fonctions `fillMicroModuleSlots`, `computeSlots`, `computeTypeWeights`, `revealHiddenMicroModule`, `processPassivePerceptionCheck`. |
| `src/content/microModules/index.ts` | Registry `ALL_MICRO_MODULES`, `getMicroModuleById`. |
| `src/content/microModules/loot.ts` | Micro-modules de type loot (12-15). |
| `src/content/microModules/lore.ts` | Micro-modules de type lore (15-20). |
| `src/content/microModules/encounter.ts` | Micro-modules de type encounter (8-10). |
| `src/content/microModules/ambiance.ts` | Micro-modules de type ambiance (10-12). |
| `tests/unit/engine/microModules.test.ts` | Tests du système de slots, placement, perception, créature. |
| `tests/unit/content/microModules.test.ts` | Validation de chaque micro-module (structure, locale, DC). |

### 10.2 Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/engine/scenario.ts` | Ajouter `MicroModule` et types associés. Ajouter `lorePool` au `CoreSkeleton`. Ajouter `isMicroModule`, `microModuleId`, `parentNodeId` au `LocationNode`. |
| `src/engine/pacing.ts` | Appeler `fillMicroModuleSlots` après `buildLocationGraph`. Ajouter les micro-modules au graphe. Ajuster la validation pour exclure les micro-modules du critical path. |
| `src/engine/scene.ts` | `getSceneContext` filtre les micro-modules hidden non-revealed. Ajoute les micro-modules visible/revealed dans `connectedLocations`. |
| `src/engine/game.ts` | `initGame` initialise les `MicroModuleState[]` dans le game state. |
| `src/engine/processTurn.ts` | Sur entrée dans un nœud parent : déclencher le check passif de perception. Sur entrée dans un micro-module avec créature active : déclencher la confrontation. |
| `src/engine/types.ts` | Ajouter `microModuleStates: MicroModuleState[]` au `GameState`. |
| `src/content/scenarios/escape.ts` | Ajouter `lorePool` avec 15-20 fragments. |
| `src/content/scenarios/investigate.ts` | Idem. |
| `src/content/scenarios/rescue.ts` | Idem. |

### 10.3 Tests à créer/modifier

| Test | Contenu |
|------|---------|
| `tests/unit/engine/microModules.test.ts` | `computeSlots` retourne les bonnes valeurs par beat/session. `fillMicroModuleSlots` ne place pas de doublons. Micro-modules hidden ne sont pas dans les sorties avant révélation. Check passif de perception fonctionne. Créature en embuscade nécessite le bon threat level. |
| `tests/unit/content/microModules.test.ts` | Chaque micro-module a un `locationRole` valide. Locale FR non-vide. Mini-obstacles ont 2 paths. Micro-modules lore ont un `loreData`. |
| `tests/unit/engine/pacing.test.ts` | Le graphe inclut les micro-modules comme nœuds dead-end. La validation exclut les micro-modules du critical path. |
| `tests/stress/scenarioCombinations.test.ts` | Chaque combo skeleton × sessionLength place le bon nombre de micro-modules. |

---

## 11. Ordre d'exécution

1. **Ajouter les types** dans `src/engine/scenario.ts` — `MicroModule`, `MiniObstacle`, `MicroModuleLoreData`, `CreatureAmbushData`, `PlacedMicroModule`, `MicroModuleState`
2. **Créer `src/engine/microModules.ts`** — logique de slots, placement, perception, type weights
3. **Modifier `src/engine/pacing.ts`** — intégrer `fillMicroModuleSlots` dans l'assemblage, ajouter les nœuds au graphe
4. **Modifier `src/engine/scene.ts`** — filtrer les micro-modules dans `getSceneContext`
5. **Modifier `src/engine/processTurn.ts`** — check passif, confrontation créature
6. **Modifier `src/engine/game.ts` / `types.ts`** — state des micro-modules
7. **Créer les fichiers de contenu** — `src/content/microModules/*.ts` (pool pré-écrit)
8. **Ajouter les `lorePool`** dans chaque skeleton
9. **Écrire les tests**
10. **Lancer la suite complète** — 0 échecs

---

## 12. Critères d'acceptation

- [ ] Le type `MicroModule` est défini et exporté
- [ ] `fillMicroModuleSlots` place 1-2 micro-modules en Quick, 6-10 en Standard, 12-18 en Extended
- [ ] Aucun micro-module en doublon dans un même scénario
- [ ] Les micro-modules `hidden` ne sont pas dans `connectedLocations` avant révélation
- [ ] Le check passif de PER se déclenche une seule fois par nœud parent
- [ ] Le hint system révèle les micro-modules cachés après 4+ tours
- [ ] L'action EXAMINER déclenche un check actif (DC-2)
- [ ] Les micro-modules `lore` avec `data_terminal` nécessitent un check INT
- [ ] Les micro-modules `lore` avec `environmental_trace` nécessitent un check PER
- [ ] Les micro-modules `lore` avec `npc_testimony` nécessitent un check CHA
- [ ] Les micro-modules `lore` avec `physical_document` sont gratuits
- [ ] La créature n'apparaît en embuscade que si threat level ≥ `minThreatLevel`
- [ ] Un indice sonore/visuel est affiché dans le nœud parent quand la créature est en embuscade
- [ ] Les micro-modules ne sont jamais sur le chemin critique
- [ ] La validation du graphe ne considère pas les micro-modules comme des orphans
- [ ] Le pool de lore fragments par skeleton contient 15-20 entrées
- [ ] Aucun fragment de lore n'apparaît deux fois dans le même run
- [ ] Tous les tests passent (unit, integration, stress)
- [ ] Le playtest bot peut compléter un scénario Standard avec micro-modules sans blocage
