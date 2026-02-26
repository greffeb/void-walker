# Chantier 2 — Réécriture Exhaustive du Scénario ESCAPE

> **Référence d'implémentation pour Claude Code**
> **Prérequis** : Chantier 1 terminé (ScenarioFeatureDefinition, ScenarioItemDefinition, ScenarioInteraction, FeatureStateManager, InteractionResolver, processTurn intégré)
> **Durée estimée** : 1 semaine
> **Fichier principal** : `src/content/scenarios/escape.ts`
> **Principes** : Chaque feature a des propriétés, chaque item est typé, chaque interaction est mécanique, zéro softlock

---

## 1. Contexte

### 1.1 État Actuel d'`escape.ts`

Le fichier `src/content/scenarios/escape.ts` contient un `CoreSkeleton` complet avec 6 nœuds, mais les `nodeLocations` utilisent les types legacy :

- **Features** : `{ id, initialState?, examineResult? }` — aucun `featureType`, aucun `properties`, aucun `aliases`, aucune `interactions`
- **Items** : `{ id, hidden?, conditional?, examineResult? }` — aucun `itemType`, aucun `properties`, aucun `aliases`, aucun `useOn`

Conséquence : le moteur ne peut rien faire mécaniquement avec ces éléments. Tout est du texte affiché, rien n'a d'impact sur le GameState.

### 1.2 Objectif

Réécrire intégralement les `nodeLocations` de l'ESCAPE skeleton en utilisant les types enrichis `ScenarioFeatureDefinition` et `ScenarioItemDefinition` du Chantier 1, de sorte que :

1. Chaque feature a un `featureType` → propriétés résolues via `resolveProperties()`
2. Chaque feature a des `aliases` FR/EN → parser les reconnaît
3. Chaque feature interactive a des `interactions` → résolution mécanique (dés, conséquences, changements d'état)
4. Chaque feature a des `descriptions` par état → EXAMINE affiche le bon texte
5. Chaque item a un `itemType` → propriétés résolues
6. Chaque item-clé a un `useOn` → "utiliser X sur Y" fonctionne
7. Les items cachés ont un `revealedBy` → apparaissent quand le conteneur s'ouvre
8. Les 5+ chaînes de progression sont toutes fonctionnelles
9. Zéro softlock possible

### 1.3 Ce Qui Ne Change PAS

- La structure du squelette (6 nœuds, tensions, beats, victory conditions) reste identique
- Les métadonnées du skeleton (`nameKey`, `descriptionKey`, `revelation`, `escalationTrigger`, `bossType`, etc.) restent identiques
- Les `exits` de chaque nœud restent identiques
- Les `locationRole` restent identiques
- Les NPC (si définis) restent identiques

Seuls les `items` et `features` de chaque `NodeLocationDef` sont réécrits.

---

## 2. Inventaire Global des Entités

### 2.1 Tous les Items du Scénario ESCAPE

| ID | Nœud | Type | Caché? | Utilisable sur | Consommé? | Notes |
|----|------|------|--------|----------------|-----------|-------|
| `emergency_flashlight` | START | tool | non | — | non | Lampe torche, utilité narrative + propriété `light_source` |
| `medkit_basic` | START | consumable | non | — | oui (USE) | Soigne 3 HP |
| `access_keycard` | START | key_item | oui (dans `emergency_locker`) | `security_panel` | non | Gate item du scénario |
| `oxygen_canister` | START | consumable | oui (dans `emergency_locker`) | — | oui (USE) | Restaure O₂ |
| `captain_log_datapad` | REVEAL | data | non | — | non | Readable : journal du capitaine |
| `EVA_suit_locker_key` | REVEAL | key_item | oui (dans `captain_terminal`) | `EVA_suit_locker` | non | Clé du casier EVA |
| `eva_suit` | ESCALATION | key_item | oui (dans `EVA_suit_locker`) | — | non | Protection O₂ personnelle |
| `makeshift_weapon` | ESCALATION | weapon | oui (dans `power_conduit` cassé) | — | non | Barre de métal arrachée |

### 2.2 Toutes les Features du Scénario ESCAPE

| ID | Nœud | Type | État init. | Interactive? | Contient | Débloque |
|----|------|------|------------|-------------|----------|----------|
| `cryopod` | START | container | broken | oui (EXAMINE, SEARCH) | — | — |
| `status_terminal` | START | terminal | damaged | oui (READ, HACK) | — | — |
| `emergency_locker` | START | container | locked | **OUI** | `access_keycard`, `oxygen_canister` | — |
| `security_panel` | UNLOCK | panel | active | **OUI** (USE keycard, HACK) | — | → `bulkhead_door` s'ouvre |
| `bulkhead_door` | UNLOCK | door | locked | **OUI** (FORCE, après panel) | — | → exit vers `reveal` |
| `vent_cover` | UNLOCK | vent | intact | **OUI** (OPEN, BREAK, CLIMB) | — | → exit alt vers `reveal` |
| `captain_terminal` | REVEAL | terminal | active | **OUI** (READ, HACK, SEARCH) | `EVA_suit_locker_key` | flag `oracle_revealed` |
| `viewport` | REVEAL | window | intact | oui (EXAMINE) | — | — |
| `EVA_suit_locker` | ESCALATION | container | locked | **OUI** (USE key, FORCE) | `eva_suit` | — |
| `life_support_panel` | ESCALATION | panel | damaged | **OUI** (REPAIR, HACK) | — | flag `o2_stabilized` |
| `o2_reroute_valve` | ESCALATION | mechanical | closed | **OUI** (OPEN, REPAIR) | — | flag `sections_sealed` |
| `power_conduit` | ESCALATION | pipe | damaged | **OUI** (BREAK, REPAIR) | `makeshift_weapon` | — |
| `escape_pod_hatch` | BOSS | door | locked | **OUI** (OPEN+keycard, HACK, FORCE) | — | → exit vers `resolution` |
| `cargo_jettison_lever` | BOSS | mechanical | intact | **OUI** (PULL, ACTIVATE) | — | flag `cargo_jettisoned` → victoire alt |
| `hull_breach_panel` | BOSS | panel | intact | **OUI** (BREAK, HACK) | — | flag `cargo_depressurized` → victoire émergente |
| `pod_viewport` | RESOLUTION | window | intact | oui (EXAMINE) | — | — |

### 2.3 Tous les NPC

| ID | Nœud | Type | HP | Comportement |
|----|------|------|----|-------------|
| `creature_oracle` | BOSS (apparaît à ESCALATION) | hostile | défini dans NPC registry | Bloque corridor pods, combat ou esquive |

---

## 3. Fiches Nœud par Nœud

### 3.1 Nœud START — Baie des Capsules Cryogéniques

**Beat** : intro | **Tension** : 2 | **Atmosphere** : pressurized | **Role** : hub

**Objectif narratif** : Le joueur se réveille, explore, comprend la situation, trouve l'équipement de base et (s'il fouille bien) le badge d'accès.

**Sorties** : `['unlock']`

#### Features

##### `cryopod` — Capsule Cryogénique (décoratif avec SEARCH)

```typescript
{
  id: 'cryopod',
  initialState: 'broken',
  featureType: 'container',
  extraProperties: ['electronic', 'large', 'broken'],
  removeProperties: ['openable', 'lockable'],  // déjà ouverte et cassée
  aliases: {
    fr: ['capsule', 'capsule cryogenique', 'cryopod', 'pod', 'cryo', 'capsule cryo', 'lit', 'caisson'],
    en: ['cryopod', 'pod', 'capsule', 'cryo pod', 'cryo capsule', 'bed'],
  },
  descriptions: {
    broken: {
      fr: 'Votre capsule cryogénique. Le couvercle s\'est ouvert d\'urgence — le voyant indique une coupure de courant il y a 4 heures. Le gel cryogénique a coulé sur le sol, formant une flaque translucide. Les autres capsules sont vides. Depuis longtemps.',
      en: 'Your cryogenic pod. The lid opened on emergency power — the indicator shows a power cut 4 hours ago. Cryogenic gel has pooled on the floor. The other pods are empty. Have been for a while.',
    },
  },
  decorative: true,  // pas d'interaction mécanique critique
}
```

##### `status_terminal` — Terminal de Statut

```typescript
{
  id: 'status_terminal',
  initialState: 'damaged',
  featureType: 'terminal',
  extraProperties: ['damaged', 'breakable'],
  aliases: {
    fr: ['terminal', 'terminal de statut', 'ecran', 'console', 'moniteur', 'ordinateur'],
    en: ['terminal', 'status terminal', 'screen', 'console', 'monitor', 'computer'],
  },
  descriptions: {
    damaged: {
      fr: 'L\'écran clignote entre des bribes de données : "ALERTE CONFINEMENT — NIVEAU 5"... "Équipage : 0/47 actifs"... "Support vie : CRITIQUE". La date affichée montre que 6 mois se sont écoulés depuis votre mise en cryo.',
      en: 'The screen flickers between data fragments: "CONTAINMENT ALERT — LEVEL 5"... "Crew: 0/47 active"... "Life support: CRITICAL".',
    },
    active: {
      fr: 'Le terminal fonctionne de nouveau. Les données défilent : diagnostics système, journaux d\'alertes, carte du vaisseau partiellement corrompue.',
      en: 'The terminal is working again. Data scrolls: system diagnostics, alert logs, partially corrupted ship map.',
    },
  },
  readableContent: {
    fr: '[ JOURNAL SYSTÈME — ENTRÉE AUTOMATIQUE ]\nJ+0h : Coupure réacteur principal. Bascule sur auxiliaire.\nJ+2h : Brèche secteur 4. Équipe d\'endiguement dépêchée.\nJ+3h : Contact perdu avec équipe d\'endiguement.\nJ+4h : ALERTE CONFINEMENT NIVEAU 5 — toutes sections.\nJ+6h : Support vie — basculement mode dégradé.\nJ+168h (7j) : Dernière activité de l\'équipage détectée.\n[ FIN DES ENTRÉES ]',
    en: '[ SYSTEM LOG — AUTO ENTRY ]\nT+0h: Main reactor failure. Switched to auxiliary.\nT+2h: Breach in sector 4. Containment team dispatched.\nT+3h: Lost contact with containment team.\nT+4h: CONTAINMENT ALERT LEVEL 5 — all sections.\nT+6h: Life support — degraded mode.\nT+168h (7d): Last crew activity detected.\n[ END OF ENTRIES ]',
  },
  interactions: [
    // READ — auto-success, affiche le contenu
    {
      trigger: { verb: ['READ', 'EXAMINE_DETAIL', 'HACK', 'SCAN'], dc: null },
      onSuccess: {
        narrative: {
          fr: 'L\'écran stabilise son affichage. Vous parcourez les entrées du journal système. L\'histoire se dessine — coupure réacteur, brèche, équipe perdue, confinement. Le dernier signe de vie de l\'équipage remonte à plus de six mois.',
          en: 'The screen stabilizes. You read through the system log entries. The story unfolds — reactor failure, breach, lost team, containment. The last crew activity was over six months ago.',
        },
        newState: 'active',
        flagSet: 'terminal_read',
      },
    },
    // REPAIR (INT DC 8) — le terminal fonctionne mieux
    {
      trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 8 },
      onSuccess: {
        narrative: {
          fr: 'Quelques connexions ressoudées. L\'écran cesse de clignoter et affiche un plan partiel du vaisseau. La baie des pods d\'évasion est marquée au pont inférieur.',
          en: 'A few reconnected wires. The screen stops flickering and shows a partial ship map. The escape pod deck is marked on the lower level.',
        },
        newState: 'active',
        flagSet: 'ship_map_found',
      },
      onFailure: {
        narrative: {
          fr: 'Un arc électrique vous force à retirer la main. L\'écran continue de clignoter — mais les bribes de données restent lisibles.',
          en: 'An electrical arc forces your hand back. The screen keeps flickering — but the data fragments remain readable.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
  ],
}
```

##### `emergency_locker` — Casier d'Urgence ★ CRITIQUE

Le conteneur principal du nœud START. Contient le gate item (`access_keycard`) et un `oxygen_canister`. C'est le **premier test mécanique** du jeu.

```typescript
{
  id: 'emergency_locker',
  initialState: 'locked',
  featureType: 'container',
  extraProperties: ['metallic', 'lockable'],
  aliases: {
    fr: ['casier', 'casier d\'urgence', 'locker', 'placard', 'armoire', 'casier urgence', 'coffre'],
    en: ['locker', 'emergency locker', 'cabinet', 'storage', 'emergency cabinet'],
  },
  contains: ['access_keycard', 'oxygen_canister'],
  descriptions: {
    locked: {
      fr: 'Casier d\'urgence standard. Le verrou magnétique est actif — un voyant rouge clignotant le confirme. La serrure semble fragilisée par les vibrations du vaisseau. Un outil adapté, de la force brute, ou un peu d\'ingéniosité pourrait en venir à bout.',
      en: 'Standard emergency locker. The magnetic lock is active — a blinking red light confirms it. The lock seems weakened by the ship\'s vibrations. The right tool, brute force, or some ingenuity could break it open.',
    },
    open: {
      fr: 'Le casier d\'urgence est ouvert. L\'intérieur est visible — éclairé par la faible lueur de l\'éclairage de secours.',
      en: 'The emergency locker is open. The interior is visible — lit by the faint glow of emergency lighting.',
    },
    empty: {
      fr: 'Le casier d\'urgence, grand ouvert. Il est vide maintenant.',
      en: 'The emergency locker, wide open. It\'s empty now.',
    },
  },
  interactions: [
    // FORCE_OPEN / BREAK / OPEN (FOR DC 10)
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'OPEN', 'KICK'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 10,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le métal cède dans un crissement. Le verrou magnétique saute — le casier s\'ouvre. À l\'intérieur : un badge d\'accès et une bonbonne d\'oxygène de secours.',
          en: 'The metal gives way with a screech. The magnetic lock breaks — the locker opens. Inside: an access keycard and an emergency oxygen canister.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
      onFailure: {
        narrative: {
          fr: 'La serrure résiste. Vos mains glissent sur le métal froid. Le verrou magnétique tient bon — mais vous sentez du jeu. Un autre essai, peut-être.',
          en: 'The lock holds. Your hands slip on cold metal. The magnetic lock holds — but you feel some give. Another try, maybe.',
        },
      },
    },
    // HACK / UNLOCK (INT DC 8)
    {
      trigger: {
        verb: ['HACK', 'UNLOCK', 'BYPASS', 'REWIRE'],
        requiredState: 'locked',
        stat: 'INT',
        dc: 8,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Vous faites sauter le circuit du verrou magnétique en court-circuitant les bornes. Clic. Le casier s\'ouvre en douceur. Un badge d\'accès et une bonbonne d\'oxygène reposent à l\'intérieur.',
          en: 'You short-circuit the magnetic lock terminals. Click. The locker opens smoothly. An access keycard and an oxygen canister sit inside.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
      onFailure: {
        narrative: {
          fr: 'Un arc électrique vous mord les doigts. Le circuit a résisté — mais le boîtier du verrou fume légèrement.',
          en: 'An electric arc bites your fingers. The circuit held — but the lock housing is slightly smoking.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
    // USE standard_toolkit (auto-success, si le joueur a un outil)
    {
      trigger: {
        verb: 'USE',
        requiredState: 'locked',
        requiredItem: 'standard_toolkit',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La trousse à outils fait le travail. Trois vis, un levier improvisé, et le verrou cède sans résistance. Le casier contient un badge d\'accès et une bonbonne d\'oxygène.',
          en: 'The toolkit does the job. Three screws, an improvised lever, and the lock gives way. The locker holds an access keycard and an oxygen canister.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
    },
    // USE knife / metal_bar (auto-success, outil improvisé)
    {
      trigger: {
        verb: 'USE',
        requiredState: 'locked',
        requiredItem: 'knife',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La lame du couteau s\'insère dans la fente du verrou. Un mouvement sec — le mécanisme cède. Le casier s\'ouvre.',
          en: 'The knife blade slides into the lock slot. A sharp twist — the mechanism gives. The locker opens.',
        },
        revealsItems: ['access_keycard', 'oxygen_canister'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
    },
    // ALREADY OPEN → no interaction (standard pipeline handles EXAMINE)
  ],
}
```

#### Items

##### `emergency_flashlight` — Lampe de Secours

```typescript
{
  id: 'emergency_flashlight',
  itemType: 'tool',
  extraProperties: ['light_source', 'small'],
  aliases: {
    fr: ['lampe', 'lampe torche', 'lampe de secours', 'torche', 'flashlight', 'lampe electrique'],
    en: ['flashlight', 'torch', 'emergency flashlight', 'light', 'lamp'],
  },
  description: {
    fr: 'Une lampe torche de secours standard. La batterie indique 73%. Assez pour éclairer votre chemin dans les sections sombres.',
    en: 'A standard emergency flashlight. Battery at 73%. Enough to light your way through dark sections.',
  },
}
```

##### `medkit_basic` — Kit Médical Basique

```typescript
{
  id: 'medkit_basic',
  itemType: 'consumable',
  extraProperties: ['organic_compatible'],
  aliases: {
    fr: ['kit', 'kit medical', 'medkit', 'trousse', 'trousse medicale', 'soins', 'pansement'],
    en: ['medkit', 'med kit', 'first aid', 'medical kit', 'bandage'],
  },
  description: {
    fr: 'Kit médical d\'urgence. Contient des bandages compressifs, un antiseptique et une dose d\'analgésique. Suffisant pour traiter une blessure légère.',
    en: 'Emergency medical kit. Contains compression bandages, antiseptic, and a painkiller dose. Enough for a minor wound.',
  },
  // Note: USE medkit est géré par le système standard (consumable + healingValue dans le registre)
  // Pas besoin de useOn ici — le registre items.ts a déjà medkit_basic si on l'y ajoute
}
```

##### `access_keycard` — Badge d'Accès ★ GATE ITEM

```typescript
{
  id: 'access_keycard',
  hidden: true,
  itemType: 'key_item',
  extraProperties: ['electronic', 'flat', 'data_storage'],
  aliases: {
    fr: ['badge', 'badge d\'acces', 'keycard', 'carte', 'carte d\'acces', 'badge chen', 'pass', 'badge magnetique'],
    en: ['keycard', 'access keycard', 'access card', 'badge', 'card', 'pass', 'key card'],
  },
  description: {
    fr: 'Un badge d\'accès de niveau 3 — celui du technicien Chen. Encore actif. Il devrait ouvrir la cloison de sécurité.',
    en: 'A level 3 access keycard — Technician Chen\'s. Still active. Should open the security bulkhead.',
  },
  revealedBy: {
    featureId: 'emergency_locker',
    requiredState: 'open',
  },
  useOn: [
    {
      targetId: 'security_panel',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Vous passez le badge sur le lecteur. Bip. Le voyant passe au vert. La cloison blindée gronde — les verrous magnétiques se rétractent un à un. Le passage est libre.',
            en: 'You swipe the badge on the reader. Beep. The indicator turns green. The bulkhead groans — magnetic locks retract one by one. The way is clear.',
          },
          flagSet: 'bulkhead_unlocked',
        },
      },
    },
    {
      targetId: 'escape_pod_hatch',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'Le badge active l\'écoutille du pod. Les joints pneumatiques sifflent — la porte s\'ouvre sur l\'intérieur exigu de la capsule d\'évasion.',
            en: 'The badge activates the pod hatch. Pneumatic seals hiss — the door opens to the cramped escape pod interior.',
          },
          flagSet: 'pod_hatch_open',
        },
      },
    },
  ],
}
```

##### `oxygen_canister` — Bonbonne d'Oxygène

```typescript
{
  id: 'oxygen_canister',
  hidden: true,
  itemType: 'consumable',
  extraProperties: ['metallic', 'sealed', 'heavy'],
  removeProperties: ['small'],
  aliases: {
    fr: ['bonbonne', 'bonbonne d\'oxygene', 'oxygene', 'bouteille', 'bouteille o2', 'bonbonne o2', 'canister'],
    en: ['canister', 'oxygen canister', 'oxygen', 'o2 tank', 'o2 canister', 'tank'],
  },
  description: {
    fr: 'Bonbonne d\'oxygène de secours scellée. La jauge indique un remplissage complet. Utilisable pour restaurer votre réserve d\'O₂ en cas de dépressurisation.',
    en: 'Sealed emergency oxygen canister. Gauge shows full. Can restore your O₂ reserve in case of depressurization.',
  },
  revealedBy: {
    featureId: 'emergency_locker',
    requiredState: 'open',
  },
}
```

---

### 3.2 Nœud UNLOCK — Point de Contrôle de Sécurité

**Beat** : rising | **Tension** : 4 | **Atmosphere** : pressurized | **Role** : control_room

**Objectif narratif** : Le joueur doit traverser la cloison blindée. Trois voies principales + keycard = quatre approches distinctes. C'est l'**obstacle principal** du premier acte.

**Sorties** : `['start', 'reveal']` (bidirectionnel avec start ; reveal est conditionnel — nécessite bulkhead ouvert OU vent traversé)

#### Features

##### `security_panel` — Panneau de Sécurité

```typescript
{
  id: 'security_panel',
  initialState: 'active',
  featureType: 'panel',
  extraProperties: ['electronic', 'secured', 'powered'],
  aliases: {
    fr: ['panneau', 'panneau de securite', 'lecteur', 'lecteur de badge', 'digicode', 'panneau securite', 'terminal de securite'],
    en: ['panel', 'security panel', 'badge reader', 'keypad', 'security terminal'],
  },
  descriptions: {
    active: {
      fr: 'Le panneau de sécurité affiche un lecteur de badge et un digicode. Le système accepte les badges de niveau 3 ou supérieur. Des griffures profondes marquent le métal autour — quelque chose a essayé de l\'arracher.',
      en: 'The security panel shows a badge reader and keypad. The system accepts level 3+ badges. Deep scratches mark the surrounding metal — something tried to tear it off.',
    },
    deactivated: {
      fr: 'Le panneau de sécurité est éteint. Le lecteur de badge ne répond plus. Mais les verrous de la cloison se sont rétractés.',
      en: 'The security panel is dark. The badge reader is dead. But the bulkhead locks have retracted.',
    },
  },
  interactions: [
    // USE access_keycard → auto-success (géré par le useOn de l'item)
    // Note: l'interaction useOn du keycard gère ce cas.
    // Ici on définit les interactions directes sur le panneau lui-même.

    // HACK (INT DC 12)
    {
      trigger: {
        verb: ['HACK', 'BYPASS', 'REWIRE', 'REPROGRAM'],
        requiredState: 'active',
        stat: 'INT',
        dc: 12,
      },
      onSuccess: {
        newState: 'deactivated',
        narrative: {
          fr: 'Vos doigts courent sur le digicode. Combinaison après combinaison — jusqu\'à trouver une faille dans le firmware. Le voyant passe au vert. Les verrous de la cloison claquent en s\'ouvrant.',
          en: 'Your fingers race across the keypad. Combination after combination — until you find a firmware exploit. The indicator turns green. The bulkhead locks slam open.',
        },
        flagSet: 'bulkhead_unlocked',
      },
      onFailure: {
        narrative: {
          fr: 'Le système détecte vos tentatives et verrouille temporairement le digicode. Trente secondes de lockout. Vous entendez quelque chose bouger dans les conduits au-dessus.',
          en: 'The system detects your attempts and temporarily locks the keypad. Thirty-second lockout. You hear something moving in the ducts above.',
        },
        consequences: [{ type: 'condition_add', conditionId: 'terrified' }],
      },
    },
    // BREAK / FORCE_OPEN (FOR DC 14) — détruire le panneau
    {
      trigger: {
        verb: ['BREAK', 'FORCE_OPEN', 'SMASH', 'KICK'],
        requiredState: 'active',
        stat: 'FOR',
        dc: 14,
      },
      onSuccess: {
        newState: 'deactivated',
        narrative: {
          fr: 'Vous arrachez la plaque frontale du panneau. Les fils exposés — un court-circuit volontaire. Étincelles. Le verrou magnétique perd son alimentation. La cloison se déverrouille par défaut.',
          en: 'You rip off the panel\'s face plate. Exposed wires — a deliberate short circuit. Sparks. The magnetic lock loses power. The bulkhead defaults to unlocked.',
        },
        flagSet: 'bulkhead_unlocked',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: 'Le panneau résiste — le métal est plus solide qu\'il n\'y paraît. Vos poings n\'ont fait que des bosses superficielles.',
          en: 'The panel holds — the metal is tougher than it looks. Your fists only left surface dents.',
        },
      },
    },
  ],
}
```

##### `bulkhead_door` — Porte Blindée

```typescript
{
  id: 'bulkhead_door',
  initialState: 'locked',
  featureType: 'door',
  extraProperties: ['heavy', 'sealed'],
  aliases: {
    fr: ['cloison', 'porte blindee', 'cloison blindee', 'porte', 'bulkhead', 'porte de securite', 'sas'],
    en: ['bulkhead', 'door', 'bulkhead door', 'blast door', 'security door'],
  },
  descriptions: {
    locked: {
      fr: 'Porte blindée de 15 centimètres d\'épaisseur. Verrouillage magnétique actif. Aucune force brute ne l\'ouvrira directement — le panneau de sécurité contrôle les verrous. Le conduit de ventilation à côté pourrait offrir un passage alternatif.',
      en: 'Fifteen-centimeter thick armored door. Magnetic lock active. No brute force will open it directly — the security panel controls the locks. The vent duct nearby might offer an alternate passage.',
    },
    open: {
      fr: 'La porte blindée est ouverte. Les verrous magnétiques sont rétractés dans le cadre. Au-delà, le couloir mène vers les quartiers de l\'équipage.',
      en: 'The bulkhead is open. Magnetic locks retracted into the frame. Beyond, the corridor leads to crew quarters.',
    },
  },
  interactions: [
    // La porte s'ouvre quand le flag bulkhead_unlocked est set
    // OPEN (auto-success si flag set)
    {
      trigger: {
        verb: ['OPEN', 'PUSH', 'TRAVERSE', 'ENTER'],
        requiredState: 'locked',
        requiredFlag: 'bulkhead_unlocked',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Les verrous ont été désactivés. La porte blindée coulisse lourdement sur ses rails, révélant le couloir au-delà.',
          en: 'The locks have been deactivated. The bulkhead slides heavily along its rails, revealing the corridor beyond.',
        },
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
    },
    // FORCE_OPEN sans flag → impossible
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'KICK', 'PUSH', 'OPEN'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 20,  // DC très élevé — quasi-impossible sans le flag
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Par un effort surhumain, vous parvenez à tordre suffisamment le cadre pour vous faufiler. Le métal grince et proteste — votre corps aussi.',
          en: 'Through superhuman effort, you manage to bend the frame enough to squeeze through. The metal groans and protests — so does your body.',
        },
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
        consequences: [{ type: 'damage', targetId: 'player', amount: 3 }],
      },
      onFailure: {
        narrative: {
          fr: '15 centimètres d\'acier blindé. Vous n\'avez aucune chance à mains nues — il faut désactiver les verrous depuis le panneau, ou trouver un autre passage.',
          en: '15 centimeters of armored steel. No chance bare-handed — deactivate the locks from the panel, or find another way.',
        },
      },
    },
  ],
}
```

##### `vent_cover` — Grille de Ventilation (Route Alternative)

```typescript
{
  id: 'vent_cover',
  initialState: 'intact',
  featureType: 'vent',
  extraProperties: ['metallic', 'breakable'],
  aliases: {
    fr: ['grille', 'grille de ventilation', 'ventilation', 'conduit', 'bouche d\'aeration', 'grille aeration', 'vent'],
    en: ['vent', 'vent cover', 'grate', 'ventilation', 'duct', 'air duct', 'vent grate'],
  },
  descriptions: {
    intact: {
      fr: 'Grille de ventilation standard. Les vis sont rouillées mais le passage derrière semble assez large pour s\'y glisser. Un courant d\'air froid en sort — il mène quelque part de l\'autre côté de la cloison.',
      en: 'Standard ventilation grate. Rusted screws, but the passage behind seems wide enough to squeeze through. Cold air flows from it — leads somewhere past the bulkhead.',
    },
    open: {
      fr: 'La grille de ventilation a été retirée. Le conduit sombre s\'ouvre béant — assez large pour ramper, pas pour se tenir debout.',
      en: 'The vent cover has been removed. The dark duct gapes open — wide enough to crawl, not to stand.',
    },
  },
  interactions: [
    // OPEN / REMOVE (AGI DC 8) — dévisser
    {
      trigger: {
        verb: ['OPEN', 'REMOVE', 'UNSCREW'],
        requiredState: 'intact',
        stat: 'AGI',
        dc: 8,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Les vis rouillées cèdent une à une. La grille tombe avec un clang métallique. Le conduit de ventilation s\'ouvre devant vous — étroit, sombre, mais praticable.',
          en: 'The rusted screws give way one by one. The grate clangs to the floor. The ventilation duct opens before you — narrow, dark, but passable.',
        },
        removeProperties: ['sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
      onFailure: {
        narrative: {
          fr: 'Les vis sont trop rouillées — vos doigts glissent. La dernière vis refuse de bouger.',
          en: 'The screws are too rusted — your fingers slip. The last screw won\'t budge.',
        },
      },
    },
    // BREAK / KICK (FOR DC 10)
    {
      trigger: {
        verb: ['BREAK', 'KICK', 'FORCE_OPEN', 'SMASH'],
        requiredState: 'intact',
        stat: 'FOR',
        dc: 10,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Un coup de pied bien placé. La grille se tord et se détache du mur. Bruyant — mais efficace. Le conduit est ouvert.',
          en: 'A well-placed kick. The grate bends and detaches from the wall. Noisy — but effective. The duct is open.',
        },
        removeProperties: ['sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
      onFailure: {
        narrative: {
          fr: 'La grille vibre sous le coup mais tient. Vos orteils, eux, protestent.',
          en: 'The grate vibrates from the impact but holds. Your toes, however, protest.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
    // CLIMB (AGI DC 10, si déjà open) — traverser le conduit
    {
      trigger: {
        verb: ['CLIMB', 'CRAWL', 'ENTER', 'TRAVERSE'],
        requiredState: 'open',
        stat: 'AGI',
        dc: 10,
      },
      onSuccess: {
        narrative: {
          fr: 'Vous rampez dans le conduit de ventilation. Sombre. Étroit. Les parois métalliques résonnent sous vos mouvements. Après une dizaine de mètres, vous émergez de l\'autre côté de la cloison.',
          en: 'You crawl through the vent duct. Dark. Tight. Metal walls echo your movements. After ten meters, you emerge on the other side of the bulkhead.',
        },
        // Note: l'exit 'reveal' est déjà débloquée par l'ouverture de la grille
      },
      onFailure: {
        narrative: {
          fr: 'Le conduit se rétrécit. Vous restez coincé un instant — la panique monte — avant de parvenir à reculer.',
          en: 'The duct narrows. You get stuck for a moment — panic rises — before managing to back out.',
        },
        consequences: [{ type: 'condition_add', conditionId: 'terrified' }],
      },
    },
    // USE standard_toolkit (auto-success, si outil disponible)
    {
      trigger: {
        verb: 'USE',
        requiredState: 'intact',
        requiredItem: 'standard_toolkit',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le tournevis de la trousse fait sauter les vis rouillées sans effort. La grille se détache proprement.',
          en: 'The toolkit\'s screwdriver pops the rusted screws effortlessly. The grate comes off cleanly.',
        },
        removeProperties: ['sealed'],
        addProperties: ['open'],
        revealsExit: 'reveal',
      },
    },
  ],
}
```

---

### 3.3 Nœud REVEAL — Quartiers du Capitaine

**Beat** : midpoint | **Tension** : 6 | **Atmosphere** : pressurized | **Role** : quarters

**Objectif narratif** : Le joueur découvre la vérité (Projet ORACLE). Trouve le datapad du capitaine et (s'il fouille le terminal) la clé du casier EVA. Moment pivot de l'histoire.

**Sorties** : `['unlock', 'escalation']`

#### Features

##### `captain_terminal` — Terminal du Capitaine

```typescript
{
  id: 'captain_terminal',
  initialState: 'active',
  featureType: 'terminal',
  extraProperties: ['secured', 'data_storage'],
  aliases: {
    fr: ['terminal', 'terminal du capitaine', 'ordinateur', 'console', 'ecran', 'poste du capitaine'],
    en: ['terminal', 'captain terminal', 'computer', 'console', 'captain computer', 'workstation'],
  },
  descriptions: {
    active: {
      fr: 'Le terminal du capitaine. L\'écran affiche le logo "PROJET ORACLE" en rouge — fichiers classifiés, rapports d\'incidents, journal personnel. Quelqu\'un a essayé d\'effacer les données, mais le processus a été interrompu.',
      en: 'The captain\'s terminal. The screen shows the "PROJECT ORACLE" logo in red — classified files, incident reports, personal log. Someone tried to erase the data, but the process was interrupted.',
    },
    searched: {
      fr: 'Le terminal du capitaine, fouillé. Tous les fichiers accessibles ont été lus. Un tiroir sous la console est entrouvert.',
      en: 'The captain\'s terminal, searched. All accessible files have been read. A drawer under the console is ajar.',
    },
  },
  readableContent: {
    fr: '[ PROJET ORACLE — DOSSIER CAPITAINE REEVES ]\n\nLe spécimen Alpha a été récupéré sur le site de fouilles d\'Éridani-IV.\nOrganisme unique — capacités de régénération cellulaire sans précédent.\nLe consortium veut un prototype d\'arme biologique avant la fin du trimestre.\n\nJ\'ai exprimé mes réserves. On m\'a dit de me taire.\n\n[ DERNIER RAPPORT ]\nLe spécimen s\'est libéré. Trois équipes de confinement éliminées en 6 heures.\nJ\'ai scellé les sections 4 à 7. Ça ne suffira pas.\nSi quelqu\'un lit ceci : fuyez. Ne tentez pas de la combattre. Fuyez.',
    en: '[ PROJECT ORACLE — CAPTAIN REEVES FILE ]\n\nSpecimen Alpha was recovered from the Eridani-IV dig site.\nUnique organism — unprecedented cellular regeneration.\nThe consortium wants a bioweapon prototype by end of quarter.\n\nI raised concerns. Was told to shut up.\n\n[ FINAL REPORT ]\nThe specimen broke free. Three containment teams eliminated in 6 hours.\nI sealed sections 4 through 7. It won\'t be enough.\nIf anyone reads this: run. Don\'t try to fight it. Run.',
  },
  interactions: [
    // READ (auto-success) — lire les fichiers ORACLE
    {
      trigger: { verb: ['READ', 'EXAMINE_DETAIL', 'SCAN'], dc: null },
      onSuccess: {
        narrative: {
          fr: 'Vous parcourez les fichiers du Projet ORACLE. L\'histoire se dévoile — un organisme extraterrestre transformé en arme biologique. Le capitaine Reeves savait. L\'équipage entier a été sacrifié pour un prototype militaire.',
          en: 'You read through the Project ORACLE files. The story unfolds — an alien organism weaponized. Captain Reeves knew. The entire crew was sacrificed for a military prototype.',
        },
        flagSet: 'oracle_revealed',
      },
    },
    // HACK / SEARCH (INT DC 10) — trouver la clé EVA cachée
    {
      trigger: {
        verb: ['HACK', 'SEARCH', 'EXAMINE_DETAIL'],
        requiredState: 'active',
        stat: 'INT',
        dc: 10,
      },
      onSuccess: {
        newState: 'searched',
        narrative: {
          fr: 'En fouillant les fichiers système, vous tombez sur un dossier personnel verrouillé. À l\'intérieur — des photos de famille du capitaine, et dans un tiroir déverrouillé par l\'accès : une petite clé magnétique étiquetée "Casier EVA — Pont 3".',
          en: 'Digging through system files, you find a locked personal folder. Inside — the captain\'s family photos, and in a drawer unlocked by the access: a small magnetic key labeled "EVA Locker — Deck 3".',
        },
        revealsItems: ['EVA_suit_locker_key'],
        flagSet: 'oracle_revealed',
      },
      onFailure: {
        narrative: {
          fr: 'Le système de sécurité résiste à vos tentatives. Vous pouvez lire les rapports ORACLE, mais les fichiers personnels du capitaine restent verrouillés.',
          en: 'The security system resists. You can read the ORACLE reports, but the captain\'s personal files remain locked.',
        },
        flagSet: 'oracle_revealed',
      },
    },
  ],
}
```

##### `viewport` — Hublot d'Observation

```typescript
{
  id: 'viewport',
  initialState: 'intact',
  featureType: 'window',
  extraProperties: ['large', 'transparent', 'rigid'],
  aliases: {
    fr: ['hublot', 'fenetre', 'vitre', 'viewport', 'baie vitree'],
    en: ['viewport', 'window', 'porthole', 'observation window'],
  },
  descriptions: {
    intact: {
      fr: 'Le hublot d\'observation donne sur l\'extérieur. Le vaisseau dérive — des sections entières sont arrachées, exposant des ponts au vide. Des débris flottent dans le silence de l\'espace. Le vaisseau est mourant.',
      en: 'The observation viewport looks outside. The ship drifts — entire sections torn away, decks exposed to vacuum. Debris floats in the silence of space. The ship is dying.',
    },
  },
  decorative: true,
}
```

#### Items

##### `captain_log_datapad` — Datapad du Capitaine

```typescript
{
  id: 'captain_log_datapad',
  itemType: 'data',
  extraProperties: ['electronic', 'readable', 'data_storage', 'small'],
  aliases: {
    fr: ['datapad', 'datapad du capitaine', 'journal', 'tablette', 'journal de bord', 'pad'],
    en: ['datapad', 'captain log', 'captain datapad', 'tablet', 'log', 'pad'],
  },
  description: {
    fr: 'Le dernier journal du Capitaine Reeves. L\'écran affiche la dernière entrée — tremblante, écrite à la hâte.',
    en: 'Captain Reeves\' final log. The screen shows the last entry — shaky, hastily written.',
  },
  readableContent: {
    fr: '[ JOURNAL DU CAPITAINE REEVES — ENTRÉE FINALE ]\n\nProjet ORACLE hors de contrôle. Le spécimen Alpha a éliminé les équipes de confinement. J\'ai scellé les sections 4 à 7.\n\nSi quelqu\'un lit ceci... fuyez.\nNe tentez pas de la combattre.\nFuyez.',
    en: '[ CAPTAIN REEVES LOG — FINAL ENTRY ]\n\nProject ORACLE out of control. Specimen Alpha eliminated containment teams. I sealed sections 4 through 7.\n\nIf anyone reads this... run.\nDon\'t try to fight it.\nRun.',
  },
}
```

##### `EVA_suit_locker_key` — Clé du Casier EVA

```typescript
{
  id: 'EVA_suit_locker_key',
  hidden: true,
  itemType: 'key_item',
  extraProperties: ['small', 'flat'],
  aliases: {
    fr: ['cle', 'cle magnetique', 'cle eva', 'cle du casier', 'petite cle'],
    en: ['key', 'magnetic key', 'eva key', 'locker key', 'small key'],
  },
  description: {
    fr: 'Une petite clé magnétique. L\'étiquette indique "Casier EVA — Pont 3".',
    en: 'A small magnetic key. The label reads "EVA Locker — Deck 3".',
  },
  revealedBy: {
    featureId: 'captain_terminal',
    requiredState: 'searched',
  },
  useOn: [
    {
      targetId: 'EVA_suit_locker',
      interaction: {
        trigger: { verb: 'USE', dc: null },
        onSuccess: {
          narrative: {
            fr: 'La clé magnétique s\'insère parfaitement. Le verrou claque — le casier EVA s\'ouvre, révélant une combinaison spatiale intacte.',
            en: 'The magnetic key fits perfectly. The lock clicks — the EVA locker opens, revealing an intact space suit.',
          },
          revealsItems: ['eva_suit'],
        },
      },
    },
  ],
}
```

---

### 3.4 Nœud ESCALATION — Centre de Survie

**Beat** : escalation | **Tension** : 8 | **Atmosphere** : low_oxygen | **Role** : hazard_zone

**Objectif narratif** : La créature a saboté le support vie. O₂ en chute. Le joueur peut stabiliser (gagner du temps), récupérer la combinaison EVA (solution personnelle), ou foncer vers les pods. Moment de pression maximale avant le climax.

**Sorties** : `['reveal', 'boss']`

#### Features

##### `EVA_suit_locker` — Casier de Combinaison EVA

```typescript
{
  id: 'EVA_suit_locker',
  initialState: 'locked',
  featureType: 'container',
  extraProperties: ['metallic', 'lockable', 'large'],
  aliases: {
    fr: ['casier eva', 'casier de combinaison', 'casier spatial', 'armoire eva', 'casier', 'combinaison'],
    en: ['eva locker', 'suit locker', 'space suit locker', 'eva cabinet', 'locker'],
  },
  contains: ['eva_suit'],
  descriptions: {
    locked: {
      fr: 'Casier de combinaison EVA — verrouillé. La serrure accepte une clé magnétique spécifique. À travers la vitre, vous apercevez une combinaison spatiale intacte.',
      en: 'EVA suit locker — locked. The lock takes a specific magnetic key. Through the glass, you can see an intact space suit.',
    },
    open: {
      fr: 'Le casier EVA est ouvert. La combinaison spatiale est accessible.',
      en: 'The EVA locker is open. The space suit is accessible.',
    },
    empty: {
      fr: 'Le casier EVA, vide. La combinaison a été prise.',
      en: 'The EVA locker, empty. The suit has been taken.',
    },
  },
  interactions: [
    // USE EVA_suit_locker_key (auto-success, géré par le useOn de l'item)
    // FORCE_OPEN (FOR DC 12)
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'SMASH'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 12,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La vitre du casier explose sous le choc. Vous dégagez les éclats — la combinaison EVA est intacte à l\'intérieur.',
          en: 'The locker glass shatters. You clear the shards — the EVA suit inside is intact.',
        },
        revealsItems: ['eva_suit'],
        removeProperties: ['locked'],
        addProperties: ['open', 'broken'],
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
      onFailure: {
        narrative: {
          fr: 'La vitre se fissure mais tient. Le casier est solide.',
          en: 'The glass cracks but holds. The locker is sturdy.',
        },
      },
    },
    // HACK (INT DC 11)
    {
      trigger: {
        verb: ['HACK', 'UNLOCK', 'BYPASS'],
        requiredState: 'locked',
        stat: 'INT',
        dc: 11,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le verrou électronique cède à votre manipulation. Le casier s\'ouvre — la combinaison EVA vous attend.',
          en: 'The electronic lock yields. The locker opens — the EVA suit awaits.',
        },
        revealsItems: ['eva_suit'],
        removeProperties: ['locked'],
        addProperties: ['open'],
      },
      onFailure: {
        narrative: {
          fr: 'Le système de verrouillage résiste. Il faudra la clé ou plus de force.',
          en: 'The lock system resists. You\'ll need the key or more force.',
        },
      },
    },
  ],
}
```

##### `life_support_panel` — Panneau de Support Vie

```typescript
{
  id: 'life_support_panel',
  initialState: 'damaged',
  featureType: 'panel',
  extraProperties: ['electronic', 'broken', 'powered'],
  aliases: {
    fr: ['panneau', 'panneau support vie', 'support vie', 'systeme o2', 'panneau o2', 'controle oxygene'],
    en: ['panel', 'life support', 'life support panel', 'o2 system', 'oxygen control'],
  },
  descriptions: {
    damaged: {
      fr: 'Le panneau de contrôle du support vie est endommagé — des griffures profondes ont arraché des câbles. L\'écran clignote : "O₂ SYSTÈME — DÉFAILLANCE CRITIQUE". La réparation semble possible mais complexe.',
      en: 'The life support control panel is damaged — deep scratches tore out cables. The screen flickers: "O₂ SYSTEM — CRITICAL FAILURE". Repair seems possible but complex.',
    },
    repaired: {
      fr: 'Le panneau de support vie a été réparé. L\'écran affiche "O₂ — STABILISÉ". Le système fonctionne en mode dégradé mais tient.',
      en: 'The life support panel has been repaired. The screen shows "O₂ — STABILIZED". The system runs in degraded mode but holds.',
    },
  },
  interactions: [
    // REPAIR (INT DC 14) — restaurer O₂ pour +10 tours
    {
      trigger: {
        verb: ['REPAIR', 'FIX', 'REWIRE'],
        requiredState: 'damaged',
        stat: 'INT',
        dc: 14,
      },
      onSuccess: {
        newState: 'repaired',
        narrative: {
          fr: 'Câble par câble, vous reconnectez le système. Le ventilateur redémarre — l\'air frais afflue. L\'écran affiche "O₂ STABILISÉ". Vous avez gagné du temps.',
          en: 'Cable by cable, you reconnect the system. The fan restarts — fresh air flows. Screen reads "O₂ STABILIZED". You\'ve bought time.',
        },
        flagSet: 'o2_stabilized',
        removeProperties: ['broken'],
      },
      onFailure: {
        narrative: {
          fr: 'Un câble mal rebranché — étincelles. Le système crashe et redémarre. Toujours en défaillance. Vous toussez dans l\'air qui s\'appauvrit.',
          en: 'A misconnected cable — sparks. The system crashes and restarts. Still failing. You cough in the thinning air.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
  ],
}
```

##### `o2_reroute_valve` — Valve de Reroutage O₂

```typescript
{
  id: 'o2_reroute_valve',
  initialState: 'closed',
  featureType: 'mechanical',
  extraProperties: ['metallic', 'mechanical'],
  removeProperties: ['electronic'],
  aliases: {
    fr: ['valve', 'valve o2', 'vanne', 'valve oxygene', 'reroutage', 'valve de reroutage'],
    en: ['valve', 'o2 valve', 'reroute valve', 'oxygen valve'],
  },
  descriptions: {
    closed: {
      fr: 'Valve de reroutage d\'O₂ — fermée. En la tournant, vous pourriez sceller les sections non-essentielles et concentrer l\'oxygène restant dans les zones habitées.',
      en: 'O₂ reroute valve — closed. Turning it could seal non-essential sections and concentrate remaining oxygen in inhabited zones.',
    },
    open: {
      fr: 'La valve est ouverte. L\'oxygène est rerouté vers les sections essentielles. Des bruits de portes hermétiques qui se ferment résonnent dans les couloirs lointains.',
      en: 'The valve is open. Oxygen rerouted to essential sections. Sounds of hermetic doors sealing echo from distant corridors.',
    },
  },
  interactions: [
    // OPEN / TURN (FOR DC 12) — sceller sections, gagner 6 tours
    {
      trigger: {
        verb: ['OPEN', 'TURN', 'ACTIVATE', 'USE'],
        requiredState: 'closed',
        stat: 'FOR',
        dc: 12,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'La valve résiste puis cède. Un grondement sourd parcourt le vaisseau — les portes hermétiques se ferment dans les sections non-essentielles. L\'air ici semble un peu plus respirable.',
          en: 'The valve resists then gives. A low rumble through the ship — hermetic doors seal in non-essential sections. The air here feels slightly more breathable.',
        },
        flagSet: 'sections_sealed',
      },
      onFailure: {
        narrative: {
          fr: 'La valve est grippée par la corrosion. Vous n\'arrivez pas à la tourner — vos mains glissent sur le métal humide.',
          en: 'The valve is seized by corrosion. You can\'t turn it — hands slip on wet metal.',
        },
      },
    },
  ],
}
```

##### `power_conduit` — Conduit d'Énergie

```typescript
{
  id: 'power_conduit',
  initialState: 'damaged',
  featureType: 'pipe',
  extraProperties: ['conductive', 'broken', 'large'],
  aliases: {
    fr: ['conduit', 'conduit d\'energie', 'tuyau', 'canalisation', 'cable', 'conduit electrique'],
    en: ['conduit', 'power conduit', 'pipe', 'cable', 'power line'],
  },
  contains: ['makeshift_weapon'],
  descriptions: {
    damaged: {
      fr: 'Conduit d\'énergie principal — éventré. Des câbles pendent et des étincelles jaillissent par intermittence. Une barre métallique semble récupérable dans les décombres.',
      en: 'Main power conduit — ripped open. Cables dangle and sparks fly intermittently. A metal bar looks salvageable from the debris.',
    },
    broken: {
      fr: 'Le conduit est complètement détruit. Les câbles sont morts — plus d\'étincelles. La barre métallique a été arrachée.',
      en: 'The conduit is completely destroyed. Cables are dead — no more sparks. The metal bar has been pulled out.',
    },
  },
  interactions: [
    // BREAK / SEARCH (FOR DC 8) — récupérer la barre
    {
      trigger: {
        verb: ['BREAK', 'SEARCH', 'TAKE', 'PULL', 'GRAB'],
        requiredState: 'damaged',
        stat: 'FOR',
        dc: 8,
      },
      onSuccess: {
        newState: 'broken',
        narrative: {
          fr: 'Vous arrachez une barre métallique solide des décombres du conduit. Lourde, rigide — ça fera une arme improvisée acceptable.',
          en: 'You wrench a solid metal bar from the conduit debris. Heavy, rigid — it\'ll make a decent improvised weapon.',
        },
        revealsItems: ['makeshift_weapon'],
      },
      onFailure: {
        narrative: {
          fr: 'Une étincelle vous brûle la main au moment où vous agrippez la barre. Vous lâchez prise.',
          en: 'A spark burns your hand as you grip the bar. You let go.',
        },
        consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
      },
    },
  ],
}
```

#### Items (ESCALATION)

##### `eva_suit` — Combinaison EVA

```typescript
{
  id: 'eva_suit',
  hidden: true,
  itemType: 'key_item',
  extraProperties: ['equippable', 'sealed', 'synthetic', 'heavy'],
  removeProperties: ['small'],
  aliases: {
    fr: ['combinaison', 'combinaison eva', 'combinaison spatiale', 'scaphandre', 'suit'],
    en: ['suit', 'eva suit', 'space suit', 'spacesuit'],
  },
  description: {
    fr: 'Combinaison EVA intacte. Autonomie d\'oxygène personnelle de 30 minutes. Protection contre le vide et les variations de pression.',
    en: 'Intact EVA suit. Personal oxygen autonomy of 30 minutes. Protection against vacuum and pressure changes.',
  },
  revealedBy: {
    featureId: 'EVA_suit_locker',
    requiredState: 'open',
  },
}
```

##### `makeshift_weapon` — Arme Improvisée

```typescript
{
  id: 'makeshift_weapon',
  hidden: true,
  itemType: 'weapon',
  extraProperties: ['metallic', 'rigid', 'blunt', 'heavy'],
  removeProperties: ['small'],
  aliases: {
    fr: ['barre', 'barre metallique', 'barre de metal', 'arme', 'arme improvisee', 'gourdin'],
    en: ['bar', 'metal bar', 'weapon', 'makeshift weapon', 'club', 'improvised weapon'],
  },
  description: {
    fr: 'Une barre métallique arrachée au conduit d\'énergie. Lourde et solide — pas l\'arme la plus élégante, mais elle fera mal.',
    en: 'A metal bar torn from the power conduit. Heavy and solid — not the most elegant weapon, but it\'ll hurt.',
  },
  revealedBy: {
    featureId: 'power_conduit',
    requiredState: 'broken',
  },
}
```

---

### 3.5 Nœud BOSS — Soute / Pont des Pods

**Beat** : climax | **Tension** : 10 | **Atmosphere** : low_oxygen | **Role** : airlock

**Objectif narratif** : La créature ORACLE bloque le chemin vers les pods d'évasion. Le joueur doit soit combattre/esquiver pour atteindre l'écoutille (victoire principale), soit jettison la soute (victoire alternative), soit dépressuriser (victoire émergente).

**Sorties** : `['escalation', 'resolution']` (resolution = conditionnel, nécessite pod_hatch_open)

#### Features

##### `escape_pod_hatch` — Écoutille du Pod d'Évasion

```typescript
{
  id: 'escape_pod_hatch',
  initialState: 'locked',
  featureType: 'door',
  extraProperties: ['electronic', 'sealed', 'heavy'],
  aliases: {
    fr: ['ecoutille', 'ecoutille pod', 'porte du pod', 'pod', 'pod d\'evasion', 'capsule de sauvetage', 'sas pod'],
    en: ['hatch', 'pod hatch', 'escape pod', 'pod door', 'escape hatch'],
  },
  descriptions: {
    locked: {
      fr: 'L\'écoutille du pod d\'évasion. Un lecteur de badge contrôle l\'accès — niveau 3 requis. Au-delà : la capsule de sauvetage. La sortie.',
      en: 'The escape pod hatch. A badge reader controls access — level 3 required. Beyond: the lifeboat. The way out.',
    },
    open: {
      fr: 'L\'écoutille est ouverte. L\'intérieur exigu du pod d\'évasion est visible — un siège, des commandes minimales, un hublot. La liberté.',
      en: 'The hatch is open. The cramped pod interior is visible — a seat, minimal controls, a porthole. Freedom.',
    },
  },
  interactions: [
    // USE access_keycard (auto-success, géré par useOn du keycard)
    // HACK (INT DC 14)
    {
      trigger: {
        verb: ['HACK', 'BYPASS', 'UNLOCK', 'REWIRE'],
        requiredState: 'locked',
        stat: 'INT',
        dc: 14,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le firmware du lecteur cède sous vos doigts experts. L\'écoutille déverrouille — les joints pneumatiques sifflent. Le pod d\'évasion vous attend.',
          en: 'The reader firmware yields to your expert fingers. The hatch unlocks — pneumatic seals hiss. The escape pod awaits.',
        },
        flagSet: 'pod_hatch_open',
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
      },
      onFailure: {
        narrative: {
          fr: 'Le système de sécurité du pod est plus robuste que le reste du vaisseau. Vos tentatives échouent.',
          en: 'The pod\'s security system is more robust than the rest of the ship. Your attempts fail.',
        },
      },
    },
    // FORCE_OPEN (FOR DC 16) — très difficile
    {
      trigger: {
        verb: ['FORCE_OPEN', 'BREAK', 'KICK'],
        requiredState: 'locked',
        stat: 'FOR',
        dc: 16,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Les joints cèdent sous un effort titanesque. L\'écoutille s\'ouvre dans un grincement de métal torturé. Le pod est accessible.',
          en: 'The seals give under titanic effort. The hatch opens with a screech of tortured metal. The pod is accessible.',
        },
        flagSet: 'pod_hatch_open',
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: 'L\'écoutille ne bouge pas d\'un millimètre. Scellée hermétiquement — il faudra un badge ou pirater le lecteur.',
          en: 'The hatch doesn\'t budge. Hermetically sealed — you\'ll need a badge or hack the reader.',
        },
      },
    },
    // OPEN avec flag (auto-success, si déjà déverrouillé par keycard)
    {
      trigger: {
        verb: ['OPEN', 'ENTER', 'TRAVERSE'],
        requiredState: 'locked',
        requiredFlag: 'pod_hatch_open',
        dc: null,
      },
      onSuccess: {
        newState: 'open',
        narrative: {
          fr: 'Le badge a déjà déverrouillé l\'écoutille. Vous poussez — elle s\'ouvre. Le pod d\'évasion est là.',
          en: 'The badge already unlocked the hatch. You push — it opens. The escape pod is there.',
        },
        removeProperties: ['locked', 'sealed'],
        addProperties: ['open'],
        revealsExit: 'resolution',
      },
    },
  ],
}
```

##### `cargo_jettison_lever` — Levier de Largage Cargo ★ VICTOIRE ALTERNATIVE

```typescript
{
  id: 'cargo_jettison_lever',
  initialState: 'intact',
  featureType: 'mechanical',
  extraProperties: ['metallic', 'mechanical'],
  removeProperties: ['electronic'],
  aliases: {
    fr: ['levier', 'levier de largage', 'levier cargo', 'manette', 'ejecteur', 'largage'],
    en: ['lever', 'jettison lever', 'cargo lever', 'eject lever', 'jettison'],
  },
  descriptions: {
    intact: {
      fr: 'Levier de largage d\'urgence de la soute. Protégé par un cache de sécurité rouge. Si la créature est dans la soute quand vous tirez... la soute entière est éjectée dans le vide.',
      en: 'Emergency cargo jettison lever. Protected by a red safety cover. If the creature is in the cargo bay when you pull... the entire bay is ejected into the void.',
    },
    activated: {
      fr: 'Le levier est en position basse. Les portes de la soute se sont ouvertes sur le vide — tout ce qui n\'était pas arrimé a été aspiré.',
      en: 'The lever is in the down position. The cargo bay doors opened to the void — everything unsecured was sucked out.',
    },
  },
  interactions: [
    // PULL / ACTIVATE / USE (FOR DC 10)
    {
      trigger: {
        verb: ['PULL', 'ACTIVATE', 'USE', 'PUSH'],
        requiredState: 'intact',
        stat: 'FOR',
        dc: 10,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Vous arrachez le cache de sécurité et tirez le levier de toutes vos forces. Un grondement assourdissant — les portes de la soute s\'ouvrent sur le vide. Tout est aspiré — y compris la créature. Ses hurlements se perdent dans le silence de l\'espace.',
          en: 'You rip off the safety cover and pull the lever with all your strength. A deafening rumble — the cargo bay doors open to the void. Everything is sucked out — including the creature. Its screams are lost in the silence of space.',
        },
        flagSet: 'cargo_jettisoned',
      },
      onFailure: {
        narrative: {
          fr: 'Le levier résiste — le mécanisme est grippé. Vous sentez qu\'il bouge, mais pas assez.',
          en: 'The lever resists — the mechanism is seized. You feel it move, but not enough.',
        },
      },
    },
  ],
}
```

##### `hull_breach_panel` — Panneau de Brèche Coque ★ VICTOIRE ÉMERGENTE

```typescript
{
  id: 'hull_breach_panel',
  initialState: 'intact',
  featureType: 'panel',
  extraProperties: ['electronic', 'breakable'],
  aliases: {
    fr: ['panneau', 'panneau de breche', 'panneau coque', 'controle decompression', 'systeme breche'],
    en: ['panel', 'breach panel', 'hull panel', 'decompression control', 'hull breach panel'],
  },
  descriptions: {
    intact: {
      fr: 'Panneau de contrôle des joints de coque. L\'écran affiche les zones pressurisées et dépressurisées du vaisseau. Un protocole d\'urgence permet de forcer une décompression localisée.',
      en: 'Hull seal control panel. The screen shows pressurized and depressurized ship zones. An emergency protocol allows forcing a localized decompression.',
    },
    activated: {
      fr: 'Le panneau affiche "DÉCOMPRESSION EN COURS — SOUTE". Les voyants clignotent en rouge. L\'air se raréfie dans la zone.',
      en: 'The panel shows "DECOMPRESSION IN PROGRESS — CARGO BAY". Indicators flash red. Air is thinning in the area.',
    },
  },
  interactions: [
    // HACK / ACTIVATE (INT DC 15) — victoire émergente
    {
      trigger: {
        verb: ['HACK', 'ACTIVATE', 'USE', 'REPROGRAM'],
        requiredState: 'intact',
        stat: 'INT',
        dc: 15,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Vous reprogrammez le protocole d\'urgence pour forcer une brèche localisée dans la soute. Le sifflement de l\'air aspiré emplit la pièce. Dans la soute, la créature lutte contre le vide — puis est arrachée. Silence.',
          en: 'You reprogram the emergency protocol to force a localized breach in the cargo bay. The hiss of escaping air fills the room. In the cargo bay, the creature fights the vacuum — then is torn away. Silence.',
        },
        flagSet: 'cargo_depressurized',
      },
      onFailure: {
        narrative: {
          fr: 'Le système de sécurité bloque votre tentative. Accès refusé — les protocoles anti-décompression sont robustes.',
          en: 'The security system blocks your attempt. Access denied — anti-decompression protocols are robust.',
        },
      },
    },
    // BREAK (FOR DC 13) — détruire le panneau pour forcer la brèche
    {
      trigger: {
        verb: ['BREAK', 'SMASH', 'FORCE_OPEN'],
        requiredState: 'intact',
        stat: 'FOR',
        dc: 13,
      },
      onSuccess: {
        newState: 'activated',
        narrative: {
          fr: 'Vous fracassez le panneau. Les circuits exposés court-circuitent — et déclenchent le protocole de brèche. La soute se dépressurise violemment.',
          en: 'You smash the panel. Exposed circuits short — triggering the breach protocol. The cargo bay depressurizes violently.',
        },
        flagSet: 'cargo_depressurized',
        consequences: [{ type: 'damage', targetId: 'player', amount: 2 }],
      },
      onFailure: {
        narrative: {
          fr: 'Le panneau résiste à vos coups. Le boîtier est renforcé.',
          en: 'The panel withstands your blows. The casing is reinforced.',
        },
      },
    },
  ],
}
```

---

### 3.6 Nœud RESOLUTION — Pod d'Évasion / Vide

**Beat** : resolution | **Tension** : 3 | **Atmosphere** : pressurized | **Role** : passage

**Objectif narratif** : Épilogue. Le joueur est dans le pod. Description finale.

**Sorties** : `[]` (fin du jeu)

#### Features

##### `pod_viewport` — Hublot du Pod

```typescript
{
  id: 'pod_viewport',
  initialState: 'intact',
  featureType: 'window',
  extraProperties: ['transparent', 'small'],
  aliases: {
    fr: ['hublot', 'hublot du pod', 'fenetre', 'vitre'],
    en: ['viewport', 'porthole', 'window', 'pod window'],
  },
  descriptions: {
    intact: {
      fr: 'Depuis le hublot du pod, vous regardez le vaisseau rapetisser dans l\'obscurité. Un point de lumière de moins en moins distinct, avalé par le noir de l\'espace. C\'est fini.',
      en: 'Through the pod\'s porthole, you watch the ship shrink into darkness. A point of light growing dimmer, swallowed by the black of space. It\'s over.',
    },
  },
  decorative: true,
}
```

---

## 4. Matrice de Cohérence

### 4.1 Chaînes d'Items (Clé → Serrure)

| Clé (Item/Action) | Serrure (Feature) | Nœud clé | Nœud serrure | Auto-success? |
|----|---------|-----------|---------------|---------------|
| `access_keycard` | `security_panel` | START | UNLOCK | oui |
| `access_keycard` | `escape_pod_hatch` | START | BOSS | oui |
| `EVA_suit_locker_key` | `EVA_suit_locker` | REVEAL | ESCALATION | oui |
| `standard_toolkit` (registre) | `emergency_locker` | inventaire | START | oui |
| `knife` (registre) | `emergency_locker` | inventaire | START | oui |
| `standard_toolkit` (registre) | `vent_cover` | inventaire | UNLOCK | oui |

### 4.2 Chaînes de Progression (Chemins Critiques)

**Chaîne principale** (Standard path) :
```
START: FORCE/HACK emergency_locker → access_keycard révélé
  → TAKE access_keycard
UNLOCK: USE access_keycard ON security_panel → flag bulkhead_unlocked
  → OPEN bulkhead_door → exit vers REVEAL
REVEAL: READ captain_terminal → flag oracle_revealed
ESCALATION: (optionnel: stabiliser O₂)
BOSS: USE access_keycard ON escape_pod_hatch → flag pod_hatch_open
  → ENTER escape pod → RESOLUTION (victoire)
```

**Chaîne ventilation** (AGI path) :
```
START: même chose pour le keycard
UNLOCK: OPEN/BREAK vent_cover → exit alt vers REVEAL
  → CLIMB vent → traversée
(suite identique)
```

**Chaîne force brute** (FOR path) :
```
UNLOCK: BREAK security_panel (FOR DC 14) → flag bulkhead_unlocked
  → FORCE_OPEN bulkhead_door (DC 20, dur mais possible)
  Ou : BREAK vent_cover (FOR DC 10) → route alternative
```

**Victoire alternative — Largage cargo** :
```
BOSS: PULL cargo_jettison_lever (FOR DC 10) → flag cargo_jettisoned
  → victoire type environmental_kill (créature éjectée)
```

**Victoire émergente — Décompression** :
```
BOSS: HACK hull_breach_panel (INT DC 15)
  OU BREAK hull_breach_panel (FOR DC 13)
  → flag cargo_depressurized → victoire émergente
```

### 4.3 Vérification Anti-Softlock

| Point de blocage potentiel | Solutions | Min. solutions | ✅ |
|---------------------------|-----------|----------------|---|
| `emergency_locker` locked | FORCE (FOR 10), HACK (INT 8), USE toolkit, USE knife | 4 | ✅ |
| `security_panel` active | USE keycard (auto), HACK (INT 12), BREAK (FOR 14) | 3 | ✅ |
| `bulkhead_door` locked | OPEN+flag (auto), FORCE (FOR 20), vent route | 3 | ✅ |
| `vent_cover` intact | OPEN (AGI 8), BREAK (FOR 10), USE toolkit | 3 | ✅ |
| `captain_terminal` active | READ (auto), HACK/SEARCH (INT 10) | 2 | ✅ |
| `EVA_suit_locker` locked | USE key (auto), FORCE (FOR 12), HACK (INT 11) | 3 | ✅ |
| `life_support_panel` damaged | REPAIR (INT 14) | 1 (optionnel) | ✅ |
| `escape_pod_hatch` locked | USE keycard (auto), HACK (INT 14), FORCE (FOR 16) | 3 | ✅ |
| `cargo_jettison_lever` intact | PULL (FOR 10) | 1 (alt victoire) | ✅ |
| `hull_breach_panel` intact | HACK (INT 15), BREAK (FOR 13) | 2 (émergent) | ✅ |

**Résultat** : Aucun obstacle n'a moins de 2 solutions. Les obstacles critiques (ceux qui bloquent la progression) ont tous 3+ solutions. Le failsafe système existant s'applique en plus.

### 4.4 Vérification : Aucun Item Non-Atteignable

| Item | Nœud | Accessible après | Vérification |
|------|------|-------------------|---|
| `emergency_flashlight` | START | immédiat (visible) | ✅ |
| `medkit_basic` | START | immédiat (visible) | ✅ |
| `access_keycard` | START | ouvrir emergency_locker | ✅ |
| `oxygen_canister` | START | ouvrir emergency_locker | ✅ |
| `captain_log_datapad` | REVEAL | immédiat (visible) | ✅ |
| `EVA_suit_locker_key` | REVEAL | HACK/SEARCH captain_terminal | ✅ |
| `eva_suit` | ESCALATION | ouvrir EVA_suit_locker | ✅ |
| `makeshift_weapon` | ESCALATION | BREAK/SEARCH power_conduit | ✅ |

---

## 5. Flags du Scénario

| Flag | Set par | Vérifié par | Effet |
|------|---------|-------------|-------|
| `terminal_read` | READ status_terminal (START) | — | Tracking narratif |
| `ship_map_found` | REPAIR status_terminal (START) | — | Tracking narratif |
| `bulkhead_unlocked` | HACK/BREAK security_panel OU USE keycard ON security_panel | OPEN bulkhead_door | Permet d'ouvrir la cloison |
| `oracle_revealed` | READ/HACK captain_terminal | — | Tracking narratif : le joueur connaît la vérité |
| `o2_stabilized` | REPAIR life_support_panel | processTurn O₂ tick | Réduit/annule la perte d'O₂ |
| `sections_sealed` | OPEN o2_reroute_valve | processTurn O₂ tick | Réduit la perte d'O₂ (moins que stabilized) |
| `pod_hatch_open` | USE keycard ON escape_pod_hatch OU HACK/FORCE hatch | victoire primaire | Permet d'entrer dans le pod |
| `cargo_jettisoned` | PULL cargo_jettison_lever | checkVictory | Victoire alternative (environmental_kill) |
| `cargo_depressurized` | HACK/BREAK hull_breach_panel | checkVictory | Victoire émergente |

---

## 6. Mise à Jour des Fichiers Connexes

### 6.1 `src/content/scenarioNames.ts`

Ce fichier reste pour la rétro-compatibilité mais devient **secondaire** — les `aliases` dans les définitions enrichies ont priorité. Aucune modification nécessaire.

### 6.2 `src/i18n/locales/fr.ts` et `en.ts`

Les clés `env.X` et `item.X` existantes restent pour la rétro-compatibilité. Les descriptions enrichies dans les définitions ont priorité via `getFeatureDescription()`.

Éventuellement ajouter des **clés d'alias** si le pattern i18n est préféré aux aliases inline :

```typescript
// Option A (inline, recommandé — c'est ce que ce chantier utilise)
aliases: { fr: ['casier', 'locker', ...], en: [...] }

// Option B (i18n — existant pour le registre, pas nécessaire pour les scénarios)
aliasesKey: 'env.emergency_locker.aliases'
```

**Décision** : utiliser les aliases inline (Option A) pour les ScenarioFeatureDefinitions. Plus explicite, pas de dépendance sur les fichiers i18n, et cohérent avec le format défini dans le Chantier 1.

### 6.3 `src/engine/victory.ts` — Flags de Victoire

Le `checkVictory()` existant utilise déjà les `VictoryCondition` types. Les nouvelles victoires basées sur flags (`cargo_jettisoned`, `cargo_depressurized`) doivent être vérifiées via `GameState.scenarioFlags`.

**Action** : vérifier que `checkVictory()` a accès à `state.scenarioFlags` et que les conditions `environmental_kill` et `containment` utilisent les flags scénario. Si ce n'est pas le cas, étendre `VictoryCheckContext` avec un champ `scenarioFlags`.

### 6.4 `src/engine/processTurn.ts` — Flags O₂

Les flags `o2_stabilized` et `sections_sealed` doivent être vérifiés pendant le tick O₂ :

```typescript
// Dans le step O₂ tick de processTurn :
if (hasScenarioFlag(state, 'o2_stabilized')) {
  // O₂ drain réduit à 0 ou très faible
} else if (hasScenarioFlag(state, 'sections_sealed')) {
  // O₂ drain réduit de moitié
}
```

---

## 7. Tests

### 7.1 Tests Structurels

**Fichier** : `tests/unit/content/scenarios/escapeEnriched.test.ts`

| # | Test | Assertion |
|---|------|-----------|
| 1 | Toutes les features ont un `featureType` | Sauf `decorative: true` qui peut ne pas en avoir |
| 2 | Toutes les features interactives ont des `interactions` | Au moins 1 interaction |
| 3 | Toutes les features ont des `aliases.fr` | Au moins 2 aliases FR |
| 4 | Toutes les features ont des `descriptions` | Au moins pour `initialState` |
| 5 | Tous les items ont un `itemType` | — |
| 6 | Tous les items ont des `aliases.fr` | Au moins 2 aliases FR |
| 7 | Tous les items cachés ont un `revealedBy` | `hidden: true` → `revealedBy` obligatoire |
| 8 | Gate item (`access_keycard`) a un `useOn` pour `security_panel` | — |
| 9 | Gate item a un `useOn` pour `escape_pod_hatch` | — |
| 10 | Chaque `contains` référence un item qui existe dans le scénario | — |
| 11 | Chaque `revealedBy.featureId` référence une feature qui existe | — |
| 12 | Chaque `useOn.targetId` référence une feature qui existe | — |
| 13 | Chaque interaction `requiredItem` référence un item du scénario ou du registre | — |
| 14 | Chaque interaction `requiredFlag` correspond à un flag documenté | — |

### 7.2 Tests de Cohérence Mécanique

**Fichier** : `tests/integration/escapePlaythrough.test.ts`

| # | Test | Description |
|---|------|-------------|
| 1 | Chaîne principale complète | FORCE locker → TAKE keycard → USE keycard ON panel → OPEN door → READ terminal → USE keycard ON hatch → victoire |
| 2 | Chaîne ventilation | FORCE locker → TAKE keycard → OPEN vent → CLIMB vent → ... → victoire |
| 3 | Chaîne INT pure | HACK locker → TAKE keycard → HACK panel → OPEN door → HACK terminal → HACK hatch → victoire |
| 4 | Victoire alt (largage) | ... → BOSS → PULL lever → flag cargo_jettisoned → checkVictory alt |
| 5 | Victoire émergente (décompression) | ... → BOSS → HACK hull_breach_panel → flag cargo_depressurized → checkVictory emergent |
| 6 | EVA suit path | ... → REVEAL → SEARCH terminal → TAKE key → ESCALATION → USE key ON locker → TAKE suit → protection O₂ |
| 7 | Item non-visible avant container ouvert | BEFORE locker open → access_keycard NOT in locationItems |
| 8 | Feature descriptions changent avec état | locker locked → desc locked ; locker open → desc open |
| 9 | Flags O₂ | REPAIR life_support → o2_stabilized ; OPEN valve → sections_sealed |
| 10 | Failsafe s'applique | 5 échecs sur emergency_locker → DC réduit |

### 7.3 Tests de Stress

**Fichier** : `tests/stress/escapeRandom.test.ts`

| # | Test | Description |
|---|------|-------------|
| 1 | 1000 tours aléatoires sans crash | Random verbs × random targets, GameState toujours valide |
| 2 | 100 playthroughs par chemin | Chaque chaîne de victoire terminée au moins 50 fois sur 100 |
| 3 | 0 softlock sur 10000 runs | Bot aléatoire ne reste jamais bloqué indéfiniment |

---

## 8. Ordre d'Implémentation

```
ÉTAPE 1: Backup & préparation
  ├─ Copier escape.ts → escape.backup.ts (référence)
  └─ Vérifier que tous les tests existants passent

ÉTAPE 2: Réécrire nodeLocations.start
  ├─ Features enrichies : cryopod, status_terminal, emergency_locker
  ├─ Items enrichis : emergency_flashlight, medkit_basic, access_keycard, oxygen_canister
  └─ Tests structurels pour le nœud START

ÉTAPE 3: Réécrire nodeLocations.unlock
  ├─ Features enrichies : security_panel, bulkhead_door, vent_cover
  └─ Tests structurels + test d'intégration chaîne principale (START → UNLOCK)

ÉTAPE 4: Réécrire nodeLocations.reveal
  ├─ Features enrichies : captain_terminal, viewport
  ├─ Items enrichis : captain_log_datapad, EVA_suit_locker_key
  └─ Tests structurels + chaîne START → UNLOCK → REVEAL

ÉTAPE 5: Réécrire nodeLocations.escalation
  ├─ Features enrichies : EVA_suit_locker, life_support_panel, o2_reroute_valve, power_conduit
  ├─ Items enrichis : eva_suit, makeshift_weapon
  └─ Tests + chaîne complète jusqu'à ESCALATION

ÉTAPE 6: Réécrire nodeLocations.boss
  ├─ Features enrichies : escape_pod_hatch, cargo_jettison_lever, hull_breach_panel
  └─ Tests des 3 types de victoire

ÉTAPE 7: Réécrire nodeLocations.resolution
  ├─ Feature : pod_viewport
  └─ Test de playthrough complet (6 nœuds)

ÉTAPE 8: Tests d'intégration complets
  ├─ 10 tests de playthrough (§7.2)
  ├─ Tests de stress (§7.3)
  └─ Vérifier la matrice anti-softlock

ÉTAPE 9: Nettoyage & validation
  ├─ npm run check (lint + types + tests)
  ├─ Supprimer escape.backup.ts
  └─ Mettre à jour CLAUDE.md si nécessaire
```

---

## 9. Critères d'Acceptation

```bash
# Tous les tests passent
npm run check                           # ✅ 0 erreurs

# Tests structurels
npm test -- escapeEnriched              # ✅ 14 tests

# Tests d'intégration (playthroughs)
npm test -- escapePlaythrough           # ✅ 10 tests

# Tests de stress
npm run test:stress -- escapeRandom     # ✅ 1000 tours sans crash, 0 softlock

# Rétro-compatibilité
npm test                                # ✅ TOUS les tests existants passent
```

**Le scénario ESCAPE est "vrai RPG" quand** :

1. ✅ `ouvrir casier` verrouillé → jet FOR DC 10 → succès/échec mécaniques
2. ✅ Casier ouvert → `access_keycard` et `oxygen_canister` apparaissent dans locationItems
3. ✅ `utiliser badge sur panneau` → auto-success → flag `bulkhead_unlocked` set
4. ✅ `lire terminal capitaine` → contenu journal affiché
5. ✅ `ouvrir grille` → nouvel exit vers REVEAL
6. ✅ `utiliser cle sur casier EVA` → combinaison apparaît
7. ✅ Descriptions changent : casier fermé/ouvert/vide
8. ✅ Features décoratives marquées (`viewport`, `pod_viewport`, `cryopod`)
9. ✅ 3 types de victoire testés et fonctionnels
10. ✅ 0 softlock sur 10 000 runs

---

## 10. Hors Périmètre

- ❌ Les scénarios INVESTIGATE et RESCUE (même pattern, après validation ESCAPE)
- ❌ Les modules (ils ont déjà des features/items mais devront être enrichis plus tard)
- ❌ La narration contextuelle avancée (Chantier 5 — le système de templates gère le fallback)
- ❌ Le NPC `creature_oracle` en détail (géré par le système combat existant + NPC registry)
- ❌ Le threat director / stalker clock (déjà implémenté, fonctionne indépendamment)
