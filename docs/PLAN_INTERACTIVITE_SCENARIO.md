# Plan de Refonte : Du Texte Affiché au Vrai RPG Interactif

## Diagnostic : Le Fossé Fondamental

### Ce qui existe (et fonctionne bien)

Le moteur de jeu possède déjà des fondations solides :

- **77 verbes** avec système de propriétés, alias FR/EN, et résolution par jet de dés
- **Système de propriétés** (42 propriétés) taggant chaque objet pour déterminer la compatibilité verbe/cible
- **Conséquences** : damage, heal, condition_add/remove, inventory_add/remove, item_break, environment_change, npc_killed, npc_flee
- **Backtracking** : suivi des visites, items pris, features changées, obstacles résolus
- **Items du registre principal** (`ITEM_DEFINITIONS`) : 12 items avec propriétés, types, alias — parfaitement intégrés au parser
- **Features du registre principal** (`ENVIRONMENT_FEATURE_DEFINITIONS`) : 10 features avec propriétés et types — parfaitement intégrés au parser
- **Templates narratifs** : 800+ templates couvrant verbe × outcome × tension

### Ce qui NE fonctionne PAS (le fossé)

Les **items et features de scénario** vivent dans un monde parallèle, complètement déconnecté du moteur :

```
REGISTRE PRINCIPAL (fonctionne)          SCÉNARIO (cassé)
─────────────────────────────            ──────────────────
ItemDefinition {                         ItemDefinition {
  id, nameKey, aliases,                    id,
  type, properties[],                      hidden?,
  weight, description                      examineResult: LocaleString
}                                        }

EnvironmentFeatureDefinition {           FeatureDefinition {
  id, nameKey, aliases,                    id,
  type, properties[],                      initialState?,
  description                              examineResult: LocaleString
}                                        }
```

**Conséquences concrètes :**

1. **Le casier d'urgence** (`emergency_locker`) est déclaré `initialState: 'locked'` mais n'a AUCUNE propriété. Le parser ne sait pas qu'il est `openable`, `metallic`, `container`. Quand on fait `ouvrir casier`, le moteur génère un texte de succès générique mais ne fait RIEN : pas d'ouverture réelle, pas de contenu révélé, pas de changement d'état.

2. **La serrure fragilisée** mentionnée dans le `examineResult` n'existe nulle part dans le code. C'est du texte d'ambiance qui ne correspond à aucune mécanique.

3. **L'`access_keycard`** (item caché dans le hub) n'a pas de propriétés scénario. Le joueur ne peut pas `utiliser badge sur panneau` de manière mécanique.

4. **Le `captain_log_datapad`** a un `examineResult` mais pas de propriété `readable`. On ne peut pas `lire datapad` de manière résolue par le parser.

5. **La `vent_cover`** dans le checkpoint devrait ouvrir un passage alternatif. Mais `OPEN vent_cover` ne crée pas de nouvelle connexion dans le graphe.

6. **`environment_change`** est un no-op dans `applyConsequences` : le commentaire dit littéralement *"scene state belongs to the UI/content layer"*.

**En résumé** : On a un moteur RPG sophistiqué d'un côté, et des scénarios qui sont essentiellement des livres dont vous êtes le héros de l'autre. Les deux ne se parlent pas.

---

## Architecture Cible : Le Pont Manquant

### Principe Directeur

Chaque élément de scénario doit être un **citoyen de première classe** du moteur de jeu, avec les mêmes propriétés, alias et interactions que les items/features du registre principal. La différence ? Les éléments de scénario portent en plus des **comportements contextuels** : ce qui se passe quand on les ouvre, ce qu'ils contiennent, ce qu'ils débloquent.

### Nouveau Modèle de Données

```typescript
// ═══════════════════════════════════════════════════════════
// FEATURE DE SCÉNARIO ENRICHIE
// ═══════════════════════════════════════════════════════════

interface ScenarioFeatureDefinition {
  // --- Identité (existant) ---
  id: string;
  initialState: FeatureState;
  
  // --- NOUVEAU : Propriétés du moteur ---
  type: EnvironmentFeatureType;   // 'container' | 'door' | 'terminal' | etc.
  properties: PropertyId[];       // ['openable', 'metallic', 'locked', 'container']
  aliases: { fr: string[]; en: string[] };
  
  // --- NOUVEAU : Descriptions par état ---
  descriptions: {
    [state: string]: LocaleString;  // 'locked', 'open', 'broken', 'empty'...
  };
  // L'ancien examineResult devient descriptions['default'] ou descriptions[initialState]
  
  // --- NOUVEAU : Interactions définies ---
  interactions: ScenarioInteraction[];
  
  // --- NOUVEAU : Contenu (pour les conteneurs) ---
  contains?: string[];            // IDs d'items révélés à l'ouverture
  
  // --- NOUVEAU : Connexion (pour les passages) ---
  revealsExit?: string;           // ID de location débloquée
  
  // --- NOUVEAU : Contenu lisible (pour terminaux/datapads) ---
  readableContent?: LocaleString; // Texte affiché quand on READ
  
  // --- Décoratif ? ---
  decorative?: boolean;           // true = ambiance pure, pas d'interaction mécanique
}

// ═══════════════════════════════════════════════════════════
// INTERACTION DE SCÉNARIO
// ═══════════════════════════════════════════════════════════

interface ScenarioInteraction {
  // Quand déclencher cette interaction ?
  trigger: {
    verb: VerbId | VerbId[];           // 'OPEN', 'HACK', ['FORCE_OPEN', 'BREAK']
    requiredState?: FeatureState;       // 'locked' — seulement si la feature est dans cet état
    requiredItem?: string;              // 'access_keycard' — seulement si le joueur a cet item
    requiredStat?: StatId;              // stat utilisée pour le jet
    dc?: number;                        // difficulté (null = auto-success)
  };
  
  // Que se passe-t-il en cas de succès ?
  onSuccess: {
    newState?: FeatureState;            // La feature passe à cet état
    consequences?: Consequence[];       // inventory_add, environment_change, etc.
    narrative?: LocaleString;           // Texte spécifique (override le template)
    revealsItems?: string[];            // Items qui apparaissent dans la scène
    revealsExit?: string;               // Nouvelle sortie débloquée
    removeProperties?: PropertyId[];    // Ex: retirer 'locked' après ouverture
    addProperties?: PropertyId[];       // Ex: ajouter 'open' après ouverture
    consumeItem?: string;               // L'item requis est consommé (ex: clé à usage unique)
    flagSet?: string;                   // Pose un flag dans le gameState
  };
  
  // Que se passe-t-il en cas d'échec ?
  onFailure?: {
    narrative?: LocaleString;           // Texte spécifique d'échec
    consequences?: Consequence[];       // Dégâts, bruit, etc.
    newState?: FeatureState;            // Ex: 'damaged' après un FORCE_OPEN raté
  };
}

// ═══════════════════════════════════════════════════════════
// ITEM DE SCÉNARIO ENRICHI
// ═══════════════════════════════════════════════════════════

interface ScenarioItemDefinition {
  // --- Identité ---
  id: string;
  hidden?: boolean;
  conditional?: string;
  
  // --- NOUVEAU : Propriétés du moteur ---
  type: ItemType;                 // 'key_item' | 'consumable' | 'tool' | 'data'
  properties: PropertyId[];       // ['small', 'liftable', 'electronic', 'readable']
  aliases: { fr: string[]; en: string[] };
  
  // --- NOUVEAU : Descriptions ---
  description: LocaleString;      // Description à l'examen
  
  // --- NOUVEAU : Contenu lisible ---
  readableContent?: LocaleString; // Pour les datapads, notes, etc.
  
  // --- NOUVEAU : Utilisation contextuelle ---
  useOn?: {                       // Quand on UTILISE cet item SUR une cible
    targetId: string;             // ex: 'security_panel'
    interaction: ScenarioInteraction;
  }[];
}

type FeatureState = 
  | 'intact' | 'damaged' | 'broken' | 'destroyed'
  | 'locked' | 'open' | 'closed'
  | 'active' | 'inactive' | 'offline'
  | 'empty' | 'full'
  | string; // extensible pour cas spéciaux
```

---

## Refonte du Scénario ESCAPE : Exemple Complet

Voici comment le nœud START devrait être défini avec ce nouveau système. Chaque feature et item est exhaustivement décrit avec toutes ses interactions possibles.

### Nœud START — Baie des Capsules Cryogéniques

```typescript
start: {
  locationRole: 'hub',
  
  items: [
    // ─── LAMPE DE SECOURS ───
    {
      id: 'emergency_flashlight',
      type: 'tool',
      properties: ['small', 'liftable', 'usable', 'electronic', 'light_source'],
      aliases: {
        fr: ['lampe', 'torche', 'lampe de secours', 'flashlight', 'lumière'],
        en: ['flashlight', 'torch', 'light', 'lamp'],
      },
      description: {
        fr: 'Une lampe torche de secours standard. La batterie indique 73%. Assez pour éclairer votre chemin dans les sections sombres.',
        en: 'A standard emergency flashlight. Battery shows 73%. Enough to light your way in dark sections.',
      },
    },

    // ─── KIT MÉDICAL ───
    {
      id: 'medkit_basic',
      type: 'consumable',
      properties: ['small', 'liftable', 'usable', 'medical'],
      aliases: {
        fr: ['kit médical', 'medkit', 'trousse', 'soins', 'médicaments', 'kit'],
        en: ['medkit', 'medical kit', 'first aid', 'medicine'],
      },
      description: {
        fr: 'Kit médical d\'urgence. Contient des bandages compressifs, un antiseptique et une dose d\'analgésique. Suffisant pour traiter une blessure légère.',
        en: 'Emergency medical kit. Contains compression bandages, antiseptic, and one dose of painkiller. Enough for a minor wound.',
      },
      // useOn défini globalement pour les medkits — heal 4 HP
    },

    // ─── BADGE D'ACCÈS (CACHÉ) ───
    {
      id: 'access_keycard',
      type: 'key_item',
      hidden: true,  // Trouvable en fouillant (EXAMINE zone / SEARCH)
      properties: ['small', 'liftable', 'electronic', 'key'],
      aliases: {
        fr: ['badge', 'carte', 'badge d\'accès', 'keycard', 'pass', 'carte d\'accès'],
        en: ['keycard', 'badge', 'access card', 'card', 'pass'],
      },
      description: {
        fr: 'Un badge d\'accès de niveau 3 — celui du technicien Chen. Encore actif. Il devrait ouvrir la cloison de sécurité.',
        en: 'A level 3 access badge — technician Chen\'s. Still active. Should open the security bulkhead.',
      },
      useOn: [
        {
          targetId: 'security_panel',
          interaction: {
            trigger: { verb: 'USE', dc: null }, // auto-success
            onSuccess: {
              narrative: {
                fr: 'Le badge bipe. Lumière verte. Le verrou magnétique de la cloison se désengage dans un claquement sourd.',
                en: 'The badge beeps. Green light. The bulkhead\'s magnetic lock disengages with a heavy clunk.',
              },
              flagSet: 'bulkhead_unlocked',
              // Le security_panel réagit à ce flag (voir ci-dessous)
            },
          },
        },
      ],
    },
  ],

  features: [
    // ─── CAPSULE CRYOGÉNIQUE ───
    {
      id: 'cryopod',
      type: 'container',  // techniquement
      initialState: 'broken',
      properties: ['large', 'metallic', 'electronic', 'broken', 'tangible'],
      aliases: {
        fr: ['capsule', 'cryo', 'cryopod', 'capsule cryogénique', 'pod'],
        en: ['cryopod', 'pod', 'capsule', 'cryo chamber'],
      },
      decorative: false,
      descriptions: {
        broken: {
          fr: 'Votre capsule cryogénique. Le couvercle s\'est ouvert d\'urgence — le voyant indique une coupure de courant il y a 4 heures. Le gel cryogénique a coulé sur le sol. Les autres capsules sont vides. Depuis longtemps.',
          en: 'Your cryopod. The lid opened on emergency power — readout shows a power cut 4 hours ago. Cryo gel pooled on the floor. The other pods are empty. Have been for a while.',
        },
      },
      interactions: [
        // EXAMINE → description d'état (géré par le système de descriptions)
        // HACK/REPAIR → 
        {
          trigger: { verb: ['REPAIR', 'HACK'], requiredState: 'broken', requiredStat: 'INT', dc: 16 },
          onSuccess: {
            narrative: {
              fr: 'Vous rétablissez partiellement l\'alimentation. L\'écran de la capsule s\'illumine — journal de maintenance : dernier occupant extrait manuellement il y a 47 jours. Par qui ?',
              en: 'You partially restore power. The pod\'s screen lights up — maintenance log: last occupant manually extracted 47 days ago. By whom?',
            },
            newState: 'damaged', // Réparé partiellement, pas opérationnel
          },
          onFailure: {
            narrative: {
              fr: 'Les circuits sont grillés. Rien à en tirer.',
              en: 'The circuits are fried. Nothing to salvage.',
            },
          },
        },
      ],
    },

    // ─── TERMINAL DE STATUT ───
    {
      id: 'status_terminal',
      type: 'terminal',
      initialState: 'damaged',
      properties: ['electronic', 'readable', 'hackable', 'tangible', 'fixed'],
      aliases: {
        fr: ['terminal', 'écran', 'console', 'terminal de statut', 'moniteur'],
        en: ['terminal', 'screen', 'console', 'status terminal', 'monitor'],
      },
      descriptions: {
        damaged: {
          fr: 'L\'écran clignote entre des bribes de données : "ALERTE CONFINEMENT — NIVEAU 5"... "Équipage : 0/47 actifs"... "Support vie : CRITIQUE". La date affichée montre que 6 mois se sont écoulés depuis votre mise en cryo.',
          en: 'The screen flickers between data fragments: "CONTAINMENT ALERT — LEVEL 5"... "Crew: 0/47 active"... "Life support: CRITICAL". The date shows 6 months have passed since your cryo entry.',
        },
        active: {
          fr: 'Le terminal affiche maintenant un flux de données stable. Vous pouvez naviguer dans les logs du vaisseau.',
          en: 'The terminal now displays a stable data feed. You can browse the ship\'s logs.',
        },
      },
      readableContent: {
        fr: '[ LOG SYSTÈME — USS MERIDIAN ]\n\nJ+0 : Départ nominal. 47 membres d\'équipage en cryo.\nJ+142 : Anomalie détectée en soute C. Protocole de confinement activé.\nJ+143 : Brèche de confinement. 3 victimes. Section 4 scellée.\nJ+147 : Perte de contact avec les équipes de réponse.\nJ+152 : « Dernier log automatique. Support vie dégradé. Aucun signe de vie détecté. »',
        en: '[ SYSTEM LOG — USS MERIDIAN ]\n\nD+0: Nominal departure. 47 crew in cryo.\nD+142: Anomaly detected in Cargo C. Containment protocol engaged.\nD+143: Containment breach. 3 casualties. Section 4 sealed.\nD+147: Lost contact with response teams.\nD+152: "Final automated log. Life support degraded. No life signs detected."',
      },
      interactions: [
        // READ le terminal
        {
          trigger: { verb: 'READ', requiredState: 'damaged', requiredStat: 'PER', dc: 8 },
          onSuccess: {
            narrative: {
              fr: 'Vous plissez les yeux pour lire les données fragmentées qui défilent sur l\'écran endommagé...',
              en: 'You squint to read the fragmented data scrolling across the damaged screen...',
            },
            // Le readableContent est affiché après la narration
          },
        },
        // HACK pour restaurer le terminal
        {
          trigger: { verb: ['HACK', 'REPAIR'], requiredState: 'damaged', requiredStat: 'INT', dc: 12 },
          onSuccess: {
            newState: 'active',
            narrative: {
              fr: 'Vous court-circuitez le module d\'affichage endommagé. L\'écran se stabilise — accès complet aux logs.',
              en: 'You bypass the damaged display module. The screen stabilizes — full log access.',
            },
            addProperties: ['active'],
            removeProperties: ['damaged'],
          },
          onFailure: {
            narrative: {
              fr: 'Un arc électrique vous brûle les doigts. L\'écran vacille puis reprend son clignotement erratique.',
              en: 'An electrical arc burns your fingers. The screen flickers then resumes its erratic blinking.',
            },
            consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
          },
        },
      ],
    },

    // ─── CASIER D'URGENCE ───
    {
      id: 'emergency_locker',
      type: 'container',
      initialState: 'locked',
      properties: ['openable', 'metallic', 'container', 'locked', 'tangible', 'fixed'],
      aliases: {
        fr: ['casier', 'casier d\'urgence', 'locker', 'placard', 'armoire'],
        en: ['locker', 'emergency locker', 'cabinet', 'storage'],
      },
      descriptions: {
        locked: {
          fr: 'Casier d\'urgence standard. Le verrou magnétique est actif mais la serrure semble fragilisée par les vibrations — un outil adapté ou de la force brute pourrait en venir à bout.',
          en: 'Standard emergency locker. The magnetic lock is active but the mechanism looks weakened by vibrations — a proper tool or brute force might work.',
        },
        open: {
          fr: 'Le casier d\'urgence est ouvert. L\'intérieur est visible.',
          en: 'The emergency locker is open. The inside is visible.',
        },
        empty: {
          fr: 'Le casier d\'urgence, grand ouvert. Vide maintenant.',
          en: 'The emergency locker, wide open. Empty now.',
        },
      },
      // CE QUE CONTIENT LE CASIER :
      contains: ['oxygen_canister'],  // Bonbonne d'O2 — utile pour la suite
      interactions: [
        // OUVRIR avec la force (FOR)
        {
          trigger: { verb: ['OPEN', 'FORCE_OPEN', 'BREAK'], requiredState: 'locked', requiredStat: 'FOR', dc: 10 },
          onSuccess: {
            newState: 'open',
            narrative: {
              fr: 'Le métal cède dans un crissement. Le casier s\'ouvre — à l\'intérieur, une bonbonne d\'oxygène de secours, encore scellée.',
              en: 'The metal gives way with a screech. The locker opens — inside, a sealed emergency oxygen canister.',
            },
            revealsItems: ['oxygen_canister'],
            removeProperties: ['locked'],
            addProperties: ['open'],
          },
          onFailure: {
            narrative: {
              fr: 'La serrure résiste. Vos mains glissent sur le métal froid. Le verrou magnétique tient bon — mais vous sentez du jeu. Un autre essai, peut-être.',
              en: 'The lock holds. Your hands slip on the cold metal. The magnetic lock resists — but you feel give. Maybe another try.',
            },
          },
        },
        // CROCHETER / HACKER (INT)
        {
          trigger: { verb: ['HACK', 'UNLOCK'], requiredState: 'locked', requiredStat: 'INT', dc: 8 },
          onSuccess: {
            newState: 'open',
            narrative: {
              fr: 'Vous faites sauter le circuit du verrou magnétique. Clic. Le casier s\'ouvre en douceur. Une bonbonne d\'oxygène repose à l\'intérieur.',
              en: 'You short the magnetic lock circuit. Click. The locker opens smoothly. An oxygen canister rests inside.',
            },
            revealsItems: ['oxygen_canister'],
            removeProperties: ['locked'],
            addProperties: ['open'],
          },
          onFailure: {
            narrative: {
              fr: 'Le circuit vous renvoie un arc. Le verrou reste actif.',
              en: 'The circuit arcs back at you. The lock stays active.',
            },
            consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
          },
        },
        // UTILISER un outil dessus (toolkit si trouvé)
        {
          trigger: { verb: 'USE', requiredState: 'locked', requiredItem: 'standard_toolkit', dc: null },
          onSuccess: {
            newState: 'open',
            narrative: {
              fr: 'La trousse à outils fait le travail. Trois vis, un levier improvisé, et le verrou cède. Le casier contient une bonbonne d\'oxygène.',
              en: 'The toolkit does the job. Three screws, an improvised lever, and the lock gives way. The locker contains an oxygen canister.',
            },
            revealsItems: ['oxygen_canister'],
            removeProperties: ['locked'],
            addProperties: ['open'],
          },
        },
        // EXAMINER quand ouvert → voir le contenu
        {
          trigger: { verb: 'EXAMINE', requiredState: 'open' },
          onSuccess: {
            narrative: {
              fr: 'Le casier est ouvert. Vous y voyez une bonbonne d\'oxygène de secours, prête à être récupérée.',
              en: 'The locker is open. You see an emergency oxygen canister, ready to be taken.',
            },
          },
        },
      ],
    },
  ],
  
  // ITEM CONTENU DANS LE CASIER (révélé à l'ouverture)
  hiddenItems: [
    {
      id: 'oxygen_canister',
      type: 'consumable',
      properties: ['small', 'liftable', 'usable', 'pressurized'],
      aliases: {
        fr: ['bonbonne', 'oxygène', 'bonbonne d\'oxygène', 'O2', 'canister'],
        en: ['canister', 'oxygen', 'oxygen canister', 'O2', 'tank'],
      },
      description: {
        fr: 'Bonbonne d\'oxygène de secours. Capacité : +30% O₂ personnel. Utilisable une seule fois.',
        en: 'Emergency oxygen canister. Capacity: +30% personal O₂. Single use.',
      },
      revealedBy: 'emergency_locker',  // Apparaît quand le casier passe à 'open'
    },
  ],

  exits: ['unlock'],
}
```

---

## Plan de Développement en 5 Chantiers

### Chantier 1 — Le Pont : Feature/Item State Engine (Semaine 1)

**Objectif** : Créer le système qui fait le pont entre les définitions de scénario et le moteur d'actions.

#### 1.1 Nouveau type `ScenarioFeatureDefinition` étendu
- Propriétés (`properties[]`) sur chaque feature de scénario
- Aliases FR/EN sur chaque feature de scénario
- Type (`EnvironmentFeatureType`) sur chaque feature
- Descriptions par état (remplace l'unique `examineResult`)

#### 1.2 Nouveau type `ScenarioItemDefinition` étendu
- Même enrichissement que les features
- Champ `useOn[]` pour les interactions contextuelles (badge sur panneau)
- Champ `readableContent` pour les datapads/notes

#### 1.3 `ScenarioInteraction` — le cœur de la refonte
- Définition déclarative : trigger (verbe + état + item requis + DC) → résultat (nouvel état + conséquences + narration)
- Support des interactions à succès automatique (DC null)
- Support des interactions conditionnelles (flags, items, état de feature)

#### 1.4 Feature State Manager
- `featureStates: Record<string, FeatureState>` dans GameState
- Fonctions pures : `getFeatureState()`, `setFeatureState()`, `getFeatureDescription()`
- Résolution des interactions : quand le parser résout une action sur une feature, le Feature State Manager vérifie les interactions disponibles

#### 1.5 Item Reveal System
- Quand une feature change d'état et a `revealsItems`, les items cachés deviennent visibles dans la scène
- `hiddenItems` dans la définition de location, avec `revealedBy` 
- `revealedItems: Record<string, boolean>` dans le visit state

#### Tests
- Unit : chaque transition d'état feature fonctionne
- Unit : reveal d'items après ouverture de conteneur
- Unit : interaction conditionnelle (item requis)
- Integration : séquence complète ouvrir casier → prendre bonbonne → utiliser bonbonne

---

### Chantier 2 — Refonte de `processTurn` (Semaine 1-2)

**Objectif** : `processTurn` doit maintenant gérer les interactions scénario.

#### 2.1 Étape d'interception scénario dans processTurn
Après le parsing et avant la résolution standard, vérifier si l'action correspond à une `ScenarioInteraction` :

```
processTurn flow révisé :
  1. Parse input → ParsedAction
  2. ★ NOUVEAU: Check scenario interactions ★
     → Si la cible est une feature/item de scénario avec une interaction matching :
       a. Vérifier les conditions (état requis, item requis, flag requis)
       b. Si DC défini → résoudre par jet de dés
       c. Si DC null → auto-success
       d. Appliquer le résultat (newState, consequences, revealsItems, revealsExit)
       e. Générer la narration (spécifique si fournie, sinon template standard)
       f. Mettre à jour featureStates et visitState
     → Sinon : résolution standard existante
  3. [reste du pipeline inchangé]
```

#### 2.2 Résolution des `useOn` (item → cible)
Quand le joueur fait `utiliser badge sur panneau` :
- Le parser détecte USE + access_keycard + security_panel
- Le système vérifie si l'item a un `useOn` ciblant `security_panel`
- Si oui, exécute l'interaction définie

#### 2.3 `environment_change` cesse d'être un no-op
- Les conséquences `environment_change` mettent à jour `featureStates`
- Les conséquences nouvelles : `reveal_item`, `reveal_exit`, `set_flag`, `consume_item`

#### Tests
- Integration : `ouvrir casier` → casier passe en 'open' → bonbonne apparaît
- Integration : `utiliser badge sur panneau` → flag posé → porte débloquée
- Integration : `lire terminal` → contenu affiché
- Stress : 100 tours avec interactions scénario — pas de corruption d'état

---

### Chantier 3 — Écriture Exhaustive du Scénario ESCAPE (Semaine 2-3)

**Objectif** : Un seul scénario parfait vaut mieux que trois scénarios creux.

#### 3.1 Méthodologie d'écriture

Pour CHAQUE nœud du scénario, produire une **fiche complète** :

```
╔═══════════════════════════════════════╗
║  NOEUD: [id] — [nom]                 ║
╠═══════════════════════════════════════╣
║                                       ║
║  FEATURES:                            ║
║  ┌─ [feature_id]                      ║
║  │  Type: [type]                      ║
║  │  État initial: [state]             ║
║  │  Propriétés: [prop1, prop2, ...]   ║
║  │  Aliases FR: [...]                 ║
║  │  Descriptions:                     ║
║  │    locked: "..."                   ║
║  │    open: "..."                     ║
║  │  Contient: [item1, item2]          ║
║  │  Interactions:                     ║
║  │    ├─ OPEN (FOR DC 10) → open      ║
║  │    │  Succès: reveal items, texte  ║
║  │    │  Échec: texte, 1 dégât        ║
║  │    ├─ HACK (INT DC 8) → open       ║
║  │    │  Succès: reveal items, texte  ║
║  │    │  Échec: texte, 1 dégât        ║
║  │    └─ USE+toolkit (auto) → open    ║
║  │       Succès: reveal items, texte  ║
║  └────────────────────────────────────║
║                                       ║
║  ITEMS VISIBLES:                      ║
║  ┌─ [item_id]                         ║
║  │  Type: [type]                      ║
║  │  Propriétés: [...]                 ║
║  │  Description: "..."                ║
║  └────────────────────────────────────║
║                                       ║
║  ITEMS CACHÉS:                        ║
║  ┌─ [item_id]                         ║
║  │  Révélé par: [feature_id]          ║
║  │  Condition: [feature en état X]    ║
║  └────────────────────────────────────║
║                                       ║
║  SORTIES:                             ║
║    → [node_id] (toujours accessible)  ║
║    → [node_id] (requiert: flag X)     ║
║                                       ║
║  COHÉRENCE:                           ║
║  ✓ Chaque item mentionné existe       ║
║  ✓ Chaque clé a une serrure          ║
║  ✓ Chaque serrure a une clé          ║
║  ✓ Chaque passage bloqué a 3+ voies  ║
║  ✓ Aucun softlock possible            ║
╚═══════════════════════════════════════╝
```

#### 3.2 Matrice de Cohérence

Pour le scénario complet, une matrice de vérification croisée :

| Item | Où trouvé | Caché ? | Utilisable sur | Résultat | Consommé ? |
|------|-----------|---------|----------------|----------|------------|
| access_keycard | start (caché) | oui (SEARCH DC 8) | security_panel | débloque bulkhead | non |
| oxygen_canister | emergency_locker | oui (dans casier) | player (USE) | +30% O₂ | oui |
| EVA_suit_locker_key | reveal (caché) | oui (sous papiers) | EVA_suit_locker | débloque combinaison | non |
| captain_log_datapad | reveal (visible) | non | READ (auto) | lore + flag captain_log_read | non |
| emergency_flashlight | start (visible) | non | USE en zone sombre | éclaire zone | non |
| medkit_basic | start (visible) | non | USE sur player | heal 4 HP | oui |

| Feature | Nœud | État initial | Interactions | Résultat | Débloque |
|---------|------|--------------|-------------|----------|----------|
| emergency_locker | start | locked | OPEN/FORCE/HACK/USE+toolkit | open → révèle oxygen_canister | - |
| security_panel | unlock | intact | USE+keycard / HACK | flag bulkhead_unlocked | bulkhead_door |
| bulkhead_door | unlock | locked | (réagit au flag) | open → passage vers reveal | exit vers reveal |
| vent_cover | unlock | intact | OPEN/BREAK (AGI DC 10) | open → passage vers reveal | exit vers reveal (alt) |
| captain_terminal | reveal | intact | READ/HACK | lore complet | - |
| EVA_suit_locker | escalation | locked | USE+key / FORCE | open → EVA suit | EVA suit (survie O₂) |
| life_support_panel | escalation | damaged | REPAIR/HACK | stabilise O₂ | +10 tours |
| escape_pod_hatch | boss | locked | USE+keycard / HACK DC15 | open → résolution | exit vers resolution |
| cargo_jettison_lever | boss | intact | PULL/USE (FOR DC 14) | éjecte soute + créature | victoire alt |

#### 3.3 Chaînes d'Interaction

Documenter les chaînes causales complètes :

```
CHAÎNE 1 — Voie principale :
  start: SEARCH → trouver access_keycard
  start: TAKE access_keycard
  unlock: USE access_keycard ON security_panel → flag bulkhead_unlocked
  unlock: bulkhead_door réagit au flag → exit vers reveal
  reveal: TAKE captain_log_datapad, READ → lore
  reveal: SEARCH → trouver EVA_suit_locker_key
  escalation: USE EVA_suit_locker_key ON EVA_suit_locker → EVA suit
  boss: USE access_keycard ON escape_pod_hatch → exit vers resolution
  resolution: VICTOIRE

CHAÎNE 2 — Voie ventilation :
  start: TAKE emergency_flashlight
  unlock: OPEN vent_cover (AGI DC 10) → exit vers reveal (ventilation)
  [continue normalement depuis reveal]

CHAÎNE 3 — Voie force brute :
  unlock: FORCE_OPEN bulkhead_door (FOR DC 14) → passage direct
  [continue normalement depuis reveal]

CHAÎNE 4 — Victoire alternative :
  boss: LURE créature vers cargo bay
  boss: PULL cargo_jettison_lever → éjecte soute → victoire alt

CHAÎNE 5 — Victoire émergente :
  boss: BREAK hull_breach_panel → dépressurise cargo bay
  [créature dans la soute = victoire émergente]
```

---

### Chantier 4 — Système de Résolution Scénario (Semaine 3)

**Objectif** : Le code qui connecte les interactions déclaratives au moteur.

#### 4.1 `ScenarioInteractionResolver`

```typescript
function resolveScenarioInteraction(
  action: ParsedAction,
  state: GameState,
  interactions: ScenarioInteraction[],
): ScenarioInteractionResult | null {
  // 1. Trouver une interaction matching :
  //    - Verbe correspond
  //    - État requis correspond
  //    - Item requis est dans l'inventaire
  //    - Flag requis est posé
  
  // 2. Résoudre :
  //    - Si dc null → auto-success
  //    - Si dc défini → jet de dés standard
  
  // 3. Retourner :
  //    - Conséquences à appliquer
  //    - Nouveau feature state
  //    - Items à révéler
  //    - Exits à débloquer
  //    - Narration à utiliser
}
```

#### 4.2 `FeatureStateManager`

```typescript
// Dans GameState :
featureStates: Record<string, FeatureState>;
revealedItems: Record<string, boolean>;
unlockedExits: Record<string, boolean>;
scenarioFlags: Record<string, boolean>;
```

#### 4.3 Extension de `getSceneContext`
- Filtrer les items selon `revealedItems`
- Filtrer les exits selon `unlockedExits`
- Utiliser `featureStates` pour les descriptions et propriétés actuelles

#### Tests
- Unit : résolution d'interaction avec DC
- Unit : résolution d'interaction auto-success
- Unit : vérification des conditions (item requis, état requis, flag requis)
- Unit : reveal d'items et d'exits
- Integration : playthrough complet du scénario ESCAPE via les 5 chaînes
- Stress : 1000 tours aléatoires sans corruption

---

### Chantier 5 — Narration Contextuelle des Interactions (Semaine 3-4)

**Objectif** : Chaque interaction produit un texte atmosphérique et informatif.

#### 5.1 Hiérarchie Narrative
1. **Narration spécifique** : définie dans l'interaction (`onSuccess.narrative`) — priorité absolue
2. **Template contextualisé** : template standard enrichi du contexte scénario (état de la feature, item utilisé)
3. **Template générique** : fallback sur les templates existants par verbe × outcome × tension

#### 5.2 Informations Post-Action
Après chaque interaction réussie, le système doit communiquer :
- **Ce qui a changé** : "Le casier est maintenant ouvert."
- **Ce qui est visible** : "Vous apercevez une bonbonne d'oxygène à l'intérieur."
- **Ce qui est possible** : suggestion contextuelle (ex: "prendre bonbonne")

#### 5.3 Descriptions Dynamiques
Quand le joueur EXAMINE une feature, la description dépend de l'état actuel :
- `locked` → description avec indices sur comment ouvrir
- `open` → description du contenu
- `empty` → description post-pillage
- `broken` → description des dégâts

---

## Impact sur le Code Existant

### Ce qui est CONSERVÉ tel quel
- Système de propriétés (`properties.ts`)
- Système de verbes (`verbs.ts`)
- Parser (`parser.ts`)
- Templates narratifs (`actionTemplates.ts`)
- Système de dés (`dice.ts`)
- Conditions, oxygène, stalker clock
- Backtracking (étendu, pas réécrit)
- Combat
- Ship Memory
- Failsafe

### Ce qui est ÉTENDU
- `FeatureDefinition` → `ScenarioFeatureDefinition` (rétro-compatible)
- `ItemDefinition` → `ScenarioItemDefinition` (rétro-compatible)
- `GameState` → +featureStates, +revealedItems, +unlockedExits, +scenarioFlags
- `processTurn` → +étape d'interception scénario
- `getSceneContext` → filtrage dynamique des items/exits
- `LocationVisitState` → +revealedItems tracking
- `applyConsequences` → `environment_change` n'est plus un no-op

### Ce qui est RÉÉCRIT
- `escape.ts` — complètement réécrit avec le nouveau format enrichi
- `scenarioNames.ts` — remplacé par les aliases intégrés aux définitions
- Potentiellement `investigate.ts` et `rescue.ts` (mais après validation du pattern sur ESCAPE)

### Ce qui est NOUVEAU
- `ScenarioInteractionResolver` — cœur de la logique d'interaction
- `FeatureStateManager` — gestion des états de features
- `ScenarioItemResolver` — gestion du useOn
- Matrice de cohérence (outil de validation)
- Playtest bot "interactor" spécialisé dans les interactions scénario

---

## Chronologie Proposée

| Semaine | Chantier | Livrable |
|---------|----------|----------|
| S1 | Chantier 1 + début Chantier 2 | Types enrichis, Feature State Manager, début intégration processTurn |
| S2 | Fin Chantier 2 + Chantier 3 | processTurn scénario-aware, écriture complète ESCAPE |
| S3 | Chantier 4 | ScenarioInteractionResolver, tests d'intégration |
| S4 | Chantier 5 | Narration contextuelle, playtest complet, polish |

**Total : 4 semaines pour un scénario ESCAPE qui fonctionne comme un vrai RPG.**

Les scénarios INVESTIGATE et RESCUE suivront le même pattern une fois le système validé sur ESCAPE.

---

## Critères d'Acceptation Finaux

Le scénario ESCAPE est considéré comme "vrai RPG" quand :

1. ✅ `ouvrir casier` quand il est verrouillé → jet de dés → succès/échec avec conséquences réelles
2. ✅ Le casier ouvert révèle son contenu → le joueur peut PRENDRE les items
3. ✅ `utiliser badge sur panneau` → la porte se débloque mécaniquement
4. ✅ `lire datapad` → le contenu du journal est affiché
5. ✅ `ouvrir grille ventilation` → un nouveau passage apparaît dans les exits
6. ✅ Un item utilisé comme clé est reconnu automatiquement par le moteur
7. ✅ Les descriptions changent selon l'état (casier fermé vs ouvert vs vide)
8. ✅ Aucune feature n'est purement décorative sans que ce soit intentionnel et marqué
9. ✅ Le playtest bot peut terminer le scénario par les 5 chaînes différentes
10. ✅ 0 softlock détecté sur 10 000 runs aléatoires
