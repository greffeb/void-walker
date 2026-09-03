# Méthodologie de Test des Modules

> **Statut :** MÉTHODOLOGIE ACTIVE — à suivre pour ce type de travail.
>
> **Où on en est :** [`docs/STATUS.md`](../STATUS.md) est la source unique de vérité.

> Document de référence pour tester chaque module individuellement et valider toutes les interactions possibles.
> Créé suite au debugging du Module 1 (blocked_passage_01).

---

## Table des matières

1. [Leçons apprises](#leçons-apprises)
2. [Checklist de validation](#checklist-de-validation)
3. [Tests par module](#tests-par-module)
4. [Commandes de test](#commandes-de-test)
5. [Patterns de correction](#patterns-de-correction)

---

## Leçons apprises

### 1. Types de features

| Type | Comportement | Utilisation |
|------|-------------|-------------|
| `string` simple | Décoratif uniquement, non-interactif | Ambiance, description |
| `ScenarioFeatureDefinition` complet | Interactif avec verbes, états, DC | Obstacles, objets clés |

**Erreur fréquente :** Une feature définie comme simple string ne peut pas être ouverte/utilisée, même si sa description suggère une interaction.

**Solution :** Convertir en `ScenarioFeatureDefinition` avec :
```typescript
{
  id: 'feature_id',
  nameKey: 'scenario.features.feature_name' as StringKey,
  aliases: ['alias1', 'alias2'],
  featureType: 'mechanism', // ou 'container', 'passage', etc.
  defaultState: 'closed',
  descriptions: {
    closed: 'Description fermée',
    open: 'Description ouverte'
  },
  interactions: [
    {
      verbs: ['OPEN'],
      dc: 8,
      stat: 'FOR',
      outcome: { stateChange: 'open' }
    }
  ]
}
```

### 2. Chaînes d'interactions

#### Pattern OPEN → CLIMB (passages alternatifs)
```typescript
interactions: [
  {
    verbs: ['OPEN'],
    trigger: 'always', // Peut toujours essayer d'ouvrir
    dc: 8,
    stat: 'AGI',
    outcome: { stateChange: 'open' }
  },
  {
    verbs: ['CLIMB', 'CRAWL'],
    trigger: 'isOpen', // Seulement quand ouvert
    dc: 10,
    stat: 'AGI',
    outcome: { 
      flagSet: 'vent_traversed',
      resolvesObstacle: true
    }
  },
  {
    verbs: ['CLIMB', 'CRAWL'],
    trigger: 'isClosed', // Indice si fermé
    outcome: {
      hint: 'La trappe est fermée. Il faudrait d\'abord l\'ouvrir.'
    }
  }
]
```

#### Pattern HACK → FLAG → UNLOCK (validation croisée)
```typescript
// Panneau de contrôle
{
  id: 'security_panel',
  interactions: [
    {
      verbs: ['HACK', 'OVERRIDE'],
      dc: 11,
      stat: 'INT',
      outcome: {
        stateChange: 'bypassed',
        flagSet: 'panel_bypassed' // ← Pose le flag
      }
    }
  ]
}

// Porte verrouillée
{
  id: 'locked_door',
  interactions: [
    {
      verbs: ['OPEN'],
      trigger: { requiredFlag: 'panel_bypassed' }, // ← Vérifie le flag
      outcome: {
        stateChange: 'open',
        resolvesObstacle: true,
        autoSuccess: true
      }
    },
    {
      verbs: ['OPEN'],
      trigger: 'always',
      outcome: {
        hint: 'La porte est verrouillée électroniquement.'
      }
    }
  ]
}
```

### 3. Parser et composés français

**Problème :** Le parser ne reconnaît pas naturellement "passer par la trappe" ou "rentrer dans le conduit".

**Solution :** Ajouter des patterns composés dans `src/i18n/locales/fr.ts` :

```typescript
'parser.compounds': `
  CLIMB:passer+par
  CLIMB:se+faufiler+dans
  CLIMB:ramper+dans
  CLIMB:rentrer+dans
  CLIMB:entrer+dans
  OPEN:ouvrir+la
  USE:utiliser+le
`
```

**Format :** `VERB_ID:mot1+mot2+mot3`

### 4. Descriptions dynamiques par état

**Problème :** Après avoir ouvert la trappe, la scène dit toujours "trappe de ventilation" au lieu de "trappe de ventilation ouverte".

**Solution :** Utiliser l'objet `descriptions` avec des clés d'état :
```typescript
descriptions: {
  closed: 'Une trappe de ventilation au plafond',
  open: 'La trappe de ventilation ouverte révèle un conduit étroit'
}
```

Le `buildSceneDescription()` utilise automatiquement `descriptions[currentState]`.

### 5. Examine vs Résolution

**Problème :** Examiner un obstacle ne devrait pas le résoudre, seulement donner des indices.

**Solution :**
1. Ne pas inclure `EXAMINE` dans la liste des verbes de résolution
2. Définir `examineResult` séparément :
```typescript
{
  interactions: [
    {
      verbs: ['HACK', 'OVERRIDE'], // PAS 'EXAMINE'
      dc: 11,
      stat: 'INT',
      outcome: { resolvesObstacle: true }
    }
  ],
  examineResult: 'Le panneau semble vulnérable à un court-circuit...'
}
```

### 6. Voies de résolution multiples

Chaque obstacle doit offrir au moins 2-3 voies :

| Stat | Verbes typiques | Exemple |
|------|-----------------|---------|
| FOR | PUSH, FORCE_OPEN, BREAK | Enfoncer une porte |
| AGI | CLIMB, CRAWL, DODGE | Passer par ventilation |
| INT | HACK, OVERRIDE, REPAIR | Court-circuiter |
| PER | SEARCH, SCAN, DETECT | Trouver passage caché |
| CHA | PERSUADE, INTIMIDATE | Convaincre PNJ |

---

## Checklist de validation

### Pour chaque module :

- [ ] **Structure** : Toutes les features interactives sont des `ScenarioFeatureDefinition` complètes
- [ ] **États** : Chaque feature a un `defaultState` et des `descriptions` par état
- [ ] **Transitions** : Les changements d'état (`stateChange`) sont cohérents
- [ ] **Multi-voies** : Au moins 2 stats différentes permettent de résoudre l'obstacle
- [ ] **Indices** : Examiner donne des hints sans résoudre
- [ ] **Parser** : Les formulations françaises naturelles sont reconnues
- [ ] **Flags** : Les interactions croisées utilisent `flagSet`/`requiredFlag`
- [ ] **Narration** : Les descriptions changent selon l'état

### Pour chaque interaction :

- [ ] Le verbe est reconnu (avec aliases)
- [ ] Le DC est approprié (8-15 selon difficulté)
- [ ] Le stat utilisé est logique
- [ ] Le `trigger` est correct (always/isOpen/isClosed/requiredFlag)
- [ ] L'`outcome` produit l'effet attendu
- [ ] Un hint est fourni si l'action échoue ou n'est pas disponible

---

## Tests par module

### Module 1 : blocked_passage_01 (Passage bloqué)

**Objectif :** Rejoindre la zone suivante malgré une porte bloquée.

**Features :**
- `blocked_door` : Porte bloquée/soudée
- `vent_hatch` : Trappe de ventilation
- `security_panel_local` : Panneau de contrôle

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `pousser la porte` / `enfoncer la porte` | Jet FOR DC12, si réussi → porte ouverte | FOR |
| 2 | `forcer la porte` | Jet FOR DC12 | FOR |
| 3 | `hacker le panneau` / `court-circuiter le panneau` | Jet INT DC11, si réussi → flag panel_bypassed | INT |
| 4 | `ouvrir la porte` (après hack) | Succès auto → porte ouverte | - |
| 5 | `ouvrir la trappe` | Succès auto → trappe ouverte | - |
| 6 | `passer par le conduit` / `ramper dans le conduit` | Jet AGI DC10, si réussi → obstacle franchi | AGI |
| 7 | `se faufiler dans la trappe` | Jet AGI (si ouverte) | AGI |

#### Tests d'examen

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | `examiner la porte` | Indices sur structure, mentions du panneau |
| 2 | `inspecter le panneau` | Indices sur vulnérabilité électronique |
| 3 | `regarder la trappe` | Description du conduit visible |

#### Tests de parser

| # | Input utilisateur | Verbe attendu |
|---|-------------------|---------------|
| 1 | `pousser la porte` | PUSH |
| 2 | `enfoncer la porte` | FORCE_OPEN |
| 3 | `défoncer la porte` | BREAK |
| 4 | `hacker le panneau` | HACK |
| 5 | `pirater le panneau` | HACK |
| 6 | `court-circuiter le panneau` | OVERRIDE |
| 7 | `ouvrir la trappe` | OPEN |
| 8 | `passer par le conduit` | CLIMB |
| 9 | `ramper dans le conduit` | CLIMB |
| 10 | `se faufiler dans la ventilation` | CLIMB |
| 11 | `rentrer dans le conduit` | CLIMB |
| 12 | `traverser le conduit` | CLIMB |

#### Tests d'état

| # | Séquence | État final attendu |
|---|----------|-------------------|
| 1 | ouvrir trappe → examiner trappe | Description "ouverte" |
| 2 | hacker panneau → ouvrir porte | Flag posé + porte ouverte |
| 3 | forcer porte (échec) → examiner porte | Toujours fermée, indices visibles |

---

### Module 2 : wounded_survivor_01 (Survivant Blessé)

**Objectif :** Établir un contact avec un membre d'équipage blessé pour obtenir des informations.

**Features :**
- `medical_cabinet` : Armoire médicale verrouillée (ScenarioFeatureDefinition avec HACK/FORCE_OPEN)
- `cot` : Lit de camp taché de sang (ScenarioFeatureDefinition)
- `wounded_crew_member` : PNJ blessé (disposition neutre, examineResult défini)

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `soigner le blessé` / `utiliser medkit sur blessé` | Jet INT DC10, si réussi → confiance gagnée | INT |
| 2 | `parler au blessé` / `persuader Torres` | Jet CHA DC11, si réussi → informations obtenues | CHA |
| 3 | `intimider le blessé` / `menacer Torres` | Jet CHA DC13, si réussi → informations rapides | CHA |
| 4 | `voler le blessé` / `fouiller discrètement` | Jet AGI DC9, si réussi → loot + partir | AGI |

#### Tests d'examen

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | `examiner armoire` | Description de l'armoire verrouillée, indices sur contenu médical |
| 2 | `examiner lit` | Description du lit taché, soins récents |
| 3 | `regarder le blessé` | État visible, examineResult affiché |

#### ✅ Résultat des tests (2026-03-02)

**Status :** PASSÉ

**Corrections appliquées :**
1. Features converties en ScenarioFeatureDefinition (medical_cabinet, cot)
2. `examineResult` ajouté à l'interface NpcDefinition + implémenté pour le PNJ
3. parser.obstacleVerbs : EXAMINE:loot → HIDE:loot (correction du mapping)
4. Descriptions sans articles (corrige "une une armoire")
5. grammar.feature_articles['env.cot'] : 'une' → 'un' (lit = masculin)
6. Synchronisation FR/EN des obstacleVerbs

**Résolution testée :**
- ✓ `soigner le blesse` → INT DC10, sorties révélées après succès
- ✓ `parler au blesse` → CHA DC11, talkFailure affiché si échec
- ✓ `intimider le blesse` → CHA DC13
- ✓ `voler le blesse` → AGI DC9 (via verb HIDE)
- ✓ Navigation post-résolution fonctionnelle

**Issue connue (hors scope module) :**
- La narration affiche "Vous utilisez le Membre d'équipage blessé" au lieu de "Vous soignez..." car `soigner` est mappé sur verb USE. Templates HEAL à créer (Phase narrative future).

---

### Module 3 : dark_room_01 (Salle Plongée dans le Noir)

**Objectif :** Traverser ou éclairer une salle dans l'obscurité totale.

**Features :**
- `light_fixture` : Plafonnier brisé (broken → functional)
- `power_relay` : Relais d'alimentation (damaged → functional)
- `emergency_glow_strip` : Bande luminescente (décor)
- `emergency_flashlight` : Lampe torche cachée

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `chercher lumière` / `fouiller` | Jet PER DC10, si réussi → trouve lampe | PER |
| 2 | `traverser à tâtons` / `avancer` | Jet AGI DC12 | AGI |
| 3 | `réparer le plafonnier` | Jet INT DC12, si réussi → lumière directe | INT |
| 4 | `réparer le relais` | Jet INT DC10, si réussi → flag power_relay_repaired | INT |
| 5 | `activer le plafonnier` (après relais) | Succès auto si flag posé | - |
| 6 | `avancer en force` | Jet FOR DC13 | FOR |

#### Tests de chaîne d'état

| # | Séquence | Attendu |
|---|----------|---------|
| 1 | réparer relais → activer plafonnier | Lumière rétablie (2 étapes) |
| 2 | réparer plafonnier directement | Possible mais DC12 |
| 3 | trouver lampe → utiliser | Alternative sans réparation |

#### ✅ Résultat des tests (2026-03-03)

**Status :** PASSÉ

**Corrections appliquées :**
1. Descriptions sans articles (corrige "un un plafonnier", "un un relais")

**Résolution testée :**
- ✓ `reparer relais` + `activer plafonnier` → chain INT DC10 + auto → obstacle résolu, sorties révélées
- ✓ `reparer plafonnier` direct → INT DC12 → obstacle résolu
- ✓ `chercher lumiere` → PER DC10 → obstacle résolu
- ✓ Navigation post-résolution fonctionnelle

**Issues connues (hors scope module) :**
- Les paths intransitifs (`traverser`, `avancer en force`) ciblent "environment" virtuel et ne résolvent pas l'obstacle. Architecture des obstacle.paths à revoir pour actions sans cible explicite.
- Description post-résolution parfois tronquée ("un luminaire" au lieu de description complète)

---

### Module 4 : supply_cache_01 (Cache de Ravitaillement)

**Objectif :** Ouvrir un conteneur de ravitaillement d'urgence.

**Features :**
- `supply_container` : Conteneur scellé (locked → open)
- `inventory_manifest` : Manifeste de contenu

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `crocheter conteneur` / `pirater verrou` | Jet INT DC10 | INT |
| 2 | `forcer conteneur` / `casser verrou` | Jet FOR DC12 | FOR |
| 3 | `négocier avec PNJ` (si présent) | Jet CHA DC10 | CHA |

---

### Module 5 : ambush_01 (Embuscade)

**Objectif :** Survivre à une embuscade par une créature hostile.

**Features :**
- `cover_crates` : Couvert tactique
- `ambush_choke_point` : Point d'étranglement
- `ventilation_shaft` : Conduit d'évasion
- `ambush_creature` : Créature hostile

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `attaquer la créature` | Jet FOR DC13 | FOR |
| 2 | `fuir` / `s'échapper` | Jet AGI DC12 | AGI |
| 3 | `feinter` / `bluffer` | Jet CHA DC14 | CHA |
| 4 | `utiliser environnement` / `renverser caisses` | Jet INT DC12 | INT |

---

### Module 6 : airlock_malfunction_01 (Défaillance du Sas)

**Objectif :** Colmater une brèche atmosphérique dans un sas.

**Features :**
- `airlock_breach` : Brèche active
- `weld_point` : Point de soudure
- `override_panel` : Panneau de commande

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `souder la brèche` / `colmater` | Jet FOR DC13 | FOR |
| 2 | `activer protocole urgence` | Jet INT DC12 | INT |
| 3 | `utiliser combinaison EVA` (si possédée) | Succès auto | - |

---

### Module 7 : malfunctioning_android_01 (Androïde Défaillant)

**Objectif :** Neutraliser un androïde dont la programmation a déraillé.

**Features :**
- `android_station` : Station de maintenance
- `override_port` : Port de neutralisation
- `power_shutoff` : Coupe-circuit
- `malfunctioning_android` : Androïde hostile (peut être raisonné)

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `raisonner avec l'androïde` / `parler` | Jet CHA DC12 | CHA |
| 2 | `désactiver via port` / `pirater` | Jet INT DC13 | INT |
| 3 | `combattre physiquement` | Jet FOR DC14 | FOR |
| 4 | `trouver code d'arrêt` / `chercher fichiers` | Jet PER DC11 | PER |

---

### Module 8 : alien_mechanism_01 (Mécanisme Extraterrestre)

**Objectif :** Activer ou comprendre un mécanisme alien.

**Features :**
- `alien_mechanism` : Mécanisme central pulsant
- `symbol_panel_a` / `symbol_panel_b` : Panneaux de symboles
- `psionic_node` : Nœud psionique
- `translator_device` : Traducteur alien (caché)

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `déchiffrer symboles` / `étudier mécanisme` | Jet INT DC14 | INT |
| 2 | `forcer l'activation` / `appuyer` | Jet FOR DC12 | FOR |
| 3 | `se concentrer` / `attunement psionique` | Jet CHA DC13 | CHA |

#### Tests de salle latérale

| # | Action | Attendu |
|---|--------|---------|
| 1 | `aller grotte latérale` | Accès à side_study |
| 2 | `examiner inscriptions` | Indices pour résolution |
| 3 | `prendre traducteur` | Facilite déchiffrage |

---

### Module 9 : containment_breach_01 (Brèche de Confinement)

**Objectif :** Gérer une brèche de confinement avec atmosphère toxique.

**Features :**
- `containment_field` : Champ effondré
- `resealing_unit` : Unité de re-scellement
- `evacuation_panel` : Panneau d'évacuation (solution radicale)

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `restaurer confinement` / `réparer` | Jet INT DC14 | INT |
| 2 | `évacuer` / `fuir la section` | Jet AGI DC12 | AGI |
| 3 | `combattre spécimen` (si présent) | Jet FOR DC15 | FOR |

---

### Module 10 : power_reroute_dilemma_01 (Dilemme du Réacheminement)

**Objectif :** Choix moral entre sauver un survivant ou ouvrir votre chemin.

**Features :**
- `power_distribution_panel` : Panneau de distribution (choix central)
- `medbay_feed_circuit` : Circuit infirmerie (vie du survivant)
- `door_feed_circuit` : Circuit portes (votre progression)

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `réacheminer vers portes` | Jet INT DC11 → portes ouvertes MAIS survivant meurt | INT |
| 2 | `pirater panneau` (compromis INT DC16) | Les deux circuits alimentés | INT |

⚠️ **Module à dilemme moral** — le choix a des conséquences narratives.

---

### Module 11 : patrol_entity_01 (Entité en Patrouille)

**Objectif :** Passer une zone patrouillée par une entité hostile.

**Features :**
- `patrol_zone` : Zone de patrouille régulière (90s)
- `stealth_cover` : Position de couvert
- `distraction_point` : Point de distraction
- `trap_spot` : Emplacement pour piège
- `patrol_entity` : Entité hostile

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `se faufiler` / `se cacher` | Jet AGI DC14 | AGI |
| 2 | `attaquer` | Jet FOR DC15 (risqué) | FOR |
| 3 | `créer distraction` / `lancer objet` | Jet INT DC12 | INT |
| 4 | `attirer ailleurs` / `appeler` | Jet CHA DC13 | CHA |
| 5 | `poser piège` | Jet INT DC14 | INT |

---

### Module 12 : flooded_section_01 (Section Inondée)

**Objectif :** Traverser une section submergée avec câbles électriques.

**Features :**
- `flood_zone` : Zone inondée (1m d'eau)
- `valve_control` : Vanne de contrôle
- `pipe_reroute` : Tuyauterie endommagée
- `submerged_passage` : Passage immergé

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `fermer vanne` / `couper eau` | Jet INT DC13 → drainage | INT |
| 2 | `nager à travers` (force brute) | Jet FOR DC14 (risque électrique) | FOR |
| 3 | `traverser en évitant câbles` | Jet AGI DC12 | AGI |
| 4 | `réacheminer plomberie` | Jet INT DC15 (drainage complet) | INT |

---

### Module 13 : survivor_rescue_01 (Sauvetage Survivant Piégé)

**Objectif :** Libérer un survivant piégé sous des débris.

**Features :**
- `debris_trap` : Débris métalliques
- `restraint_lock` : Serrure électronique
- `structural_beam` : Poutre déformée
- `trapped_survivor` : Survivant piégé (Reyes)

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `couper restraintes` / `déplacer débris` | Jet FOR DC11 | FOR |
| 2 | `pirater serrure` | Jet INT DC12 | INT |
| 3 | `calmer survivant` / `guider` | Jet CHA DC10 | CHA |

---

### Module 14 : terminal_decrypt_01 (Décryptage de Terminal)

**Objectif :** Accéder aux données d'un terminal chiffré.

**Features :**
- `encrypted_terminal` : Terminal haute sécurité
- `log_archive` : Archive de journaux
- `data_chip` : Puce de données (cachée)
- **Salle latérale server_side** : `backup_server`, `physical_log_binder`, `access_password_note`

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `trouver mot de passe` / `fouiller journaux` | Jet PER DC11 | PER |
| 2 | `pirater directement` | Jet INT DC13 | INT |
| 3 | `parler à IA` / `interroger opérateur` | Jet CHA DC12 | CHA |

#### Tests de salle latérale

| # | Action | Attendu |
|---|--------|---------|
| 1 | `aller salle serveurs` | Accès à server_side |
| 2 | `examiner classeur` | Mot de passe visible |
| 3 | `prendre note` | Facilite décryptage |

---

### Module 15 : explosive_decompression_risk_01 (Risque Décompression)

**Objectif :** Traverser une section avec coque fragilisée.

**Features :**
- `weakened_hull_section` : Coque affincie (vide visible)
- `careful_path_markers` : Marqueurs fluorescents
- `seal_point` : Point de colmatage

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | `suivre marqueurs` / `traverser prudemment` | Jet AGI DC12 | AGI |
| 2 | `colmater brèche` / `souder` | Jet INT DC14 ou FOR DC13 | INT/FOR |
| 3 | `forcer passage` (dangereux) | Jet FOR DC15 + risque décompression | FOR |

---

## Commandes de test

### Lancer le testeur de module

```bash
# Lister tous les modules disponibles
npm run testModule

# Test interactif du module N (1-15)
npm run testModule -- 1   # Module blocked_passage_01
npm run testModule -- 2   # Module wounded_survivor_01
npm run testModule -- 3   # Module dark_room_01
npm run testModule -- 4   # Module supply_cache_01
npm run testModule -- 5   # Module ambush_01
npm run testModule -- 6   # Module airlock_malfunction_01
npm run testModule -- 7   # Module malfunctioning_android_01
npm run testModule -- 8   # Module alien_mechanism_01
npm run testModule -- 9   # Module containment_breach_01
npm run testModule -- 10  # Module power_reroute_dilemma_01
npm run testModule -- 11  # Module patrol_entity_01
npm run testModule -- 12  # Module flooded_section_01
npm run testModule -- 13  # Module survivor_rescue_01
npm run testModule -- 14  # Module terminal_decrypt_01
npm run testModule -- 15  # Module explosive_decompression_risk_01
```

### Session interactive

En session, commandes disponibles :
- **Actions normales** : `examiner la porte`, `pousser la trappe`, etc.
- **`quit`** : Quitter et voir le rapport
- **`help`** : Afficher l'aide
- **`look`** : Redécrire la scène actuelle

### Test automatisé avec pipe

```bash
# Séquence de commandes via pipe
echo -e "action1\naction2\nquit" | npx tsx scripts/testModule.ts 1

# Exemples de voies complètes pour Module 1
# Voie FOR
echo -e "pousser la porte\nquit" | npx tsx scripts/testModule.ts 1

# Voie INT (panneau → porte)
echo -e "hacker le panneau\nouvrir la porte\nquit" | npx tsx scripts/testModule.ts 1

# Voie AGI (trappe → conduit)
echo -e "ouvrir la trappe\npasser par le conduit\nquit" | npx tsx scripts/testModule.ts 1
```

### Vérification rapide du parser

```bash
npm run playtest:debug
# Puis taper une action pour voir le parsing détaillé
```

### Tests unitaires et validation

```bash
# Gate complète (obligatoire avant commit)
npm run check

# Tests unitaires seulement
npm test

# Tests de stress (combinaisons scénarios)
npm run test:stress

# Playthroughs automatisés (100 parties)
npm run playtest:auto:100
```

---

## Patterns de correction

### Erreur : Feature non-interactive

**Symptôme :** "Je ne vois pas de [feature] ici" ou action ignorée

**Diagnostic :**
```typescript
// MAUVAIS - string simple
features: ['vent_hatch']

// BON - définition complète
features: [{
  id: 'vent_hatch',
  nameKey: 'scenario.features.vent_hatch',
  // ... interactions
}]
```

### Erreur : Verbe non reconnu

**Symptôme :** "Je ne comprends pas cette action"

**Diagnostic :**
1. Vérifier `verb.VERB_ID.aliases` dans `fr.ts`
2. Pour verbes composés, ajouter dans `parser.compounds`

**Correction :**
```typescript
// Dans fr.ts
'verb.CLIMB.aliases': 'grimper,escalader,ramper,se faufiler,traverser',
'parser.compounds': `
  CLIMB:passer+par
  CLIMB:rentrer+dans
`
```

### Erreur : État ne change pas

**Symptôme :** Description reste la même après action réussie

**Diagnostic :**
1. Vérifier que `outcome.stateChange` est défini
2. Vérifier que `descriptions[newState]` existe

**Correction :**
```typescript
interactions: [{
  verbs: ['OPEN'],
  outcome: { stateChange: 'open' } // ← Doit matcher une clé de descriptions
}],
descriptions: {
  closed: '...',
  open: '...' // ← Cette clé doit exister
}
```

### Erreur : Flag non reconnu

**Symptôme :** "requiredFlag" ne débloque pas l'action

**Diagnostic :**
1. Vérifier que `flagSet` est identique à `requiredFlag`
2. Vérifier l'ordre des interactions (flag doit être posé avant check)

**Correction :**
```typescript
// Feature A : pose le flag
outcome: { flagSet: 'my_flag' }

// Feature B : vérifie le flag
trigger: { requiredFlag: 'my_flag' } // ← Même nom exactement
```

### Erreur : Examine résout l'obstacle

**Symptôme :** Regarder un obstacle le résout sans jet

**Diagnostic :**
1. Vérifier que `EXAMINE` n'est pas dans les verbes de résolution
2. Définir `examineResult` séparément

**Correction :**
```typescript
{
  interactions: [
    { verbs: ['HACK', 'USE'], /* ... */ } // PAS 'EXAMINE'
  ],
  examineResult: 'Vous remarquez que...' // Séparé
}
```

---

## Template de test pour nouveau module

```markdown
### Module N : [module_id] ([Nom])

**Objectif :** [Description courte]

**Features :**
- `feature_1` : [Description]
- `feature_2` : [Description]

#### Tests de résolution

| # | Action | Résultat attendu | Stat |
|---|--------|------------------|------|
| 1 | | | |

#### Tests d'examen

| # | Action | Résultat attendu |
|---|--------|------------------|
| 1 | | |

#### Tests de parser

| # | Input utilisateur | Verbe attendu |
|---|-------------------|---------------|
| 1 | | |

#### Tests d'état

| # | Séquence | État final attendu |
|---|----------|-------------------|
| 1 | | |
```

---

## Résumé des règles d'or

1. **Jamais de feature interactive en simple string** — toujours `ScenarioFeatureDefinition`
2. **Toujours 2+ voies de résolution** — FOR/AGI/INT minimum
3. **Examiner donne des indices, jamais de résolution**
4. **States + descriptions dynamiques** — la scène reflète les changements
5. **Parser compounds pour le français** — "passer par", "rentrer dans"
6. **Flags pour interactions croisées** — panneau → porte
7. **Tester chaque formulation naturelle** — pas seulement les verbes anglais

---

*Document généré le 2026-03-03 suite au debugging de blocked_passage_01*
