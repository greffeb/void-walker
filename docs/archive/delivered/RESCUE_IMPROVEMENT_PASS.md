# RESCUE "Dernier Signal" — Audit d'Enrichissement Complet

> **Statut :** LIVRÉ — archive historique, ne pas suivre comme plan.
> Livré — passe d'enrichissement du skeleton `rescue`.
>
> **Où on en est :** [`docs/STATUS.md`](../../STATUS.md) est la source unique de vérité.

> Méthodologie identique à ESCAPE et INVESTIGATE : 5 phases systématiques
> Fichier source : `src/content/scenarios/rescue.ts`
> Test file : `tests/unit/content/scenarios/rescueEnriched.test.ts`

---

## Inventaire Complet

### Features (16)

| # | ID | Nœud | Type | État initial | Interactive? | Contient |
|---|-----|------|------|-------------|-------------|----------|
| 1 | `crashed_shuttle` | START | container | damaged | ✅ (EXAMINE, FORCE_OPEN×2, SCAN) | medical_stabilizer |
| 2 | `hull_breach` | START | panel | open | ✅ (REPAIR×2, EXAMINE) | — |
| 3 | `salvageable_parts` | START | container | intact | ✅ (SEARCH, TAKE) | salvage_tool |
| 4 | `emergency_beacon_broken` | START | terminal | broken | ✅ (REPAIR×2, EXAMINE) | — |
| 5 | `collapsed_corridor` | UNLOCK | door | broken | ✅ (FORCE_OPEN×2, EXAMINE, USE plasma) | — |
| 6 | `maintenance_detour_hatch` | UNLOCK | door | closed | ✅ (OPEN×2) | — |
| 7 | `plasma_cutter_rack` | UNLOCK | container | intact | ✅ (TAKE) | plasma_cutter |
| 8 | `survivor_barricade` | REVEAL | panel | intact | ✅ (EXAMINE, BREAK) | — |
| 9 | `research_terminal` | REVEAL | terminal | damaged | ✅ (READ, REPAIR) | — |
| 10 | `acoustic_walls` | ESCALATION | panel | intact | ✅ (EXAMINE) | — |
| 11 | `distraction_rack` | ESCALATION | container | intact | ✅ (TAKE) | distraction_device |
| 12 | `blast_door_partial` | ESCALATION | door | damaged | ✅ (FORCE_OPEN) | — |
| 13 | `shuttle_hatch` | BOSS | door | open | ✅ (ENTER×2, USE bait) | — |
| 14 | `acoustic_trap_point` | BOSS | panel | intact | ✅ (USE sonic, EXAMINE) | — |
| 15 | `extraction_bay_door` | BOSS | door | damaged | ✅ (REPAIR, FORCE_OPEN) | — |
| 16 | `shuttle_cockpit` | RESOLUTION | terminal | active | 🔸 décoratif (ACTIVATE) | — |

### Items (7)

| # | ID | Nœud | Type | Caché? | Révélé par | Utilisable sur |
|---|-----|------|------|--------|-----------|---------------|
| 1 | `first_aid_kit` | START | consumable | non | — | dr_okonkwo (heal 2) |
| 2 | `medical_stabilizer` | START | key_item | ✅ | crashed_shuttle:open | dr_okonkwo (stabilise) |
| 3 | `salvage_tool` | START | tool | ✅ | salvageable_parts:empty | collapsed_corridor, blast_door_partial, extraction_bay_door, hull_breach |
| 4 | `plasma_cutter` | UNLOCK | tool | ✅ | plasma_cutter_rack:empty | collapsed_corridor, creature_hunter |
| 5 | `research_notes` | REVEAL | data | non | — | (READ seulement) |
| 6 | `sonic_emitter_component` | REVEAL | key_item | non | — | creature_hunter, acoustic_trap_point, emergency_beacon_broken |
| 7 | `distraction_device` | ESCALATION | consumable | ✅ | distraction_rack:empty | creature_hunter |

### NPCs (2)

| ID | Nœud | Disposition | HP | Rôle |
|----|------|------------|-----|------|
| `dr_okonkwo` | REVEAL | cooperative | 4 | Survivante à sauver, détient info créature |
| `creature_hunter` | ESCALATION + BOSS | hostile | — | Antagoniste physique, chasseur |

### Flags documentés (26)

```
shuttle_searched, breach_sealed, breach_examined, backup_beacon_active,
corridor_cleared_tool, corridor_plasma_cut, detour_found, noise_made_unlock,
okonkwo_found, okonkwo_trusts, okonkwo_patched, okonkwo_stabilized,
escort_active, acoustic_info_received, project_hunter_read, creature_learns_discovered,
barricade_dismantled, acoustic_potential_noted, creature_repelled_escalation,
creature_distracted, creature_contained, blast_door_widened,
extraction_door_opened, both_in_shuttle, okonkwo_abandoned, okonkwo_used_as_bait
```

---

## PHASE 1 — Audit Objet par Objet (Narratif + Interactions)

### Nœud START — Site de Crash

#### 1. `crashed_shuttle` — ✅ Bien construit

**États** : damaged → open → broken
**Interactions** : 4 (EXAMINE, FORCE_OPEN FOR DC10, FORCE_OPEN+salvage_tool auto, SCAN PER DC9)
**Chaîne** : FORCE_OPEN ou salvage_tool → open → révèle medical_stabilizer

**Problèmes identifiés** :

- 🟡 **Description `open` trop courte** : "La soute de la navette est degagee. Les compartiments de rangement sont accessibles. Le moteur principal est definitivement hors service." — 3 phrases factuelles, manque d'atmosphère (crash récent, fumée, débris flottants)
- 🟡 **Description `broken` orpheline** : "L'epave est completement effondree. Plus rien a recuperer." — Aucune interaction ne mène à cet état. Est-il atteignable ? Si non, supprimer.
- 🟡 **SCAN révèle salvage_tool ET mentionne la boîte noire** mais la boîte noire n'existe pas comme item → faux signal narratif. Soit supprimer la mention, soit créer un item `black_box` décoratif.

**Corrections** :

```typescript
open: {
  fr: "La soute de la navette est dégagée. De la fumée s'échappe encore "
    + "des circuits brûlés. Les compartiments de rangement sont ouverts — "
    + "la plupart vides ou détruits. Le moteur principal est en miettes, "
    + "le réservoir percé. Cette navette ne redécollera jamais.",
},
// broken: SUPPRIMER si aucune interaction ne mène à cet état
// OU ajouter une interaction destructive (BREAK FOR DC impossible)
```

**SCAN — corriger la mention de la boîte noire** :

```typescript
// Option A : supprimer la mention
fr: "Fouillant les débris du cockpit, vous trouvez un outil de récupération "
  + "encore fonctionnel. Le compartiment médical reste bloqué, mais l'outil "
  + "pourrait aider à faire levier.",

// Option B : ajouter un item black_box (tracking/lore, non-consommable)
```

#### 2. `hull_breach` — ✅ Bien construit avec réserves

**États** : open → closed
**Interactions** : 3 (REPAIR INT DC12, REPAIR+salvage_tool auto, EXAMINE)

**Problèmes identifiés** :

- 🟡 **EXAMINE ne set pas `breach_examined`** dans le code source réel — le flag est dans les KNOWN_FLAGS du test mais l'interaction EXAMINE dans rescue.ts ne set aucun flag. La spec Chantier 5 l'a, mais le code ne l'implémente pas.

**⚠️ Vérification requise** : Comparer le code `.ts` réel avec la spec pour confirmer si `breach_examined` est bien set. Si non → ajouter `flagSet: 'breach_examined'` à l'interaction EXAMINE.

- 🟡 **`breach_sealed` est set mais jamais consommé mécaniquement** — il change l'atmosphère (pressurized), ce qui est un effet mécanique réel. C'est correct comme design, mais le flag lui-même ne gate rien d'autre. Acceptable.

#### 3. `salvageable_parts` — ✅ OK

**États** : intact → empty
**Interactions** : 2 (SEARCH PER DC8, TAKE auto)

**Problèmes identifiés** :

- 🟡 **Deux chemins identiques en résultat** — SEARCH (PER DC8) et TAKE (auto) font exactement la même chose : newState:empty + revealsItems:salvage_tool. Le SEARCH ajoute un jet de dé pour rien de plus. Acceptable pour le parser (le joueur peut taper "fouiller" ou "prendre") mais le TAKE devrait peut-être avoir une narration plus brute ("vous ramassez tout ce qui semble utile") vs SEARCH plus détaillé.
- ✅ **Pas de problème bloquant**.

#### 4. `emergency_beacon_broken` — 🔴 Problème de flag `acoustic_info_received`

**États** : broken → active
**Interactions** : 3 (REPAIR+salvage_tool INT DC11, REPAIR+sonic_emitter INT DC9 via item useOn, EXAMINE)

**Problèmes identifiés** :

- ✅ **Le triangle sonique est bien câblé** : sonic_emitter_component a 3 useOn (creature, trap_point, beacon), tous avec `consumeItem: true`. Mutuellement exclusifs. Excellent design.
- 🟡 **`backup_beacon_active` est set mais jamais consommé** — Le flag n'a aucun impact mécanique ou narratif en aval. Pas de texte de résolution qui le mentionne, pas de différence de fin. Le joueur sacrifie son émetteur sonique pour réparer la balise... et ça ne change rien ? C'est un choix sans conséquence visible.

**Fix recommandé** : `backup_beacon_active` devrait affecter la résolution. Au minimum, un texte différent dans shuttle_cockpit ACTIVATE si le flag est set ("Le signal de la balise pulse en arrière-plan — des secours arriveront peut-être"). Idéalement, une condition de victoire variante ou un bonus narratif.

### Nœud UNLOCK — Point de Triage

#### 5. `collapsed_corridor` — ✅ Excellent (4 chemins)

**États** : broken → open
**Interactions** : 4 (FORCE_OPEN FOR DC12 +1dmg, FORCE_OPEN+salvage_tool auto, EXAMINE PER DC11 → detour_found, USE plasma INT DC10 +noise)

**Anti-softlock** : FOR pur (avec coût), outil (auto), détour PER, plasma cutter INT. 4 stats couverts. Excellent.

**Problèmes identifiés** :

- 🟡 **Pas de failsafe bas-DC** — Si le joueur échoue FOR DC12 ET n'a pas d'outil ET échoue PER DC11 ET n'a pas de plasma cutter... il est bloqué. La spec Phase 6 mentionne un failsafe "degraded_bypass (crawl through unstable rubble, 3 HP damage)" mais il n'est **pas implémenté** dans le code.

**Fix 🔴 CRITIQUE** : Ajouter un failsafe. Deux options :

```typescript
// Option A : AGI DC8 ramper dans les décombres (cheap mais douloureux)
{
  trigger: { verb: ['CRAWL', 'CLIMB'], requiredState: 'broken', stat: 'AGI', dc: 8 },
  onSuccess: {
    newState: 'open', // ou pas — le passage existe mais instable
    narrative: {
      fr: "Vous rampez entre les poutres tordues. Le métal mord, "
        + "les débris s'effondrent derrière vous. Trois mètres de terreur pure. "
        + "Mais vous passez.",
    },
    revealsExit: 'unlock_to_reveal',
    consequences: [{ type: 'damage', amount: 3, targetId: 'player' }],
  },
},

// Option B : FOR DC6 après X tours (le métal fatigue)
// Moins bon — le joueur ne sait pas qu'il faut attendre
```

- 🟡 **collapsed_corridor FORCE_OPEN FOR DC12 n'a pas de `revealsExit`** dans le code — seul le path plasma_cutter et salvage_tool ont `revealsExit: 'unlock_to_reveal'`. Le FORCE_OPEN FOR DC12 set juste `newState: 'open'` sans `revealsExit`. **Le joueur dégage le couloir mais ne peut pas passer.**

**Fix 🔴 CRITIQUE** : Ajouter `revealsExit: 'unlock_to_reveal'` au FORCE_OPEN FOR DC12.

#### 6. `maintenance_detour_hatch` — 🟡 Redondance d'interactions

**États** : closed → open
**Interactions** : 2 (OPEN+detour_found flag auto, OPEN auto sans flag)

**Problèmes identifiés** :

- 🟡 **Les deux interactions font exactement la même chose** : OPEN avec `requiredFlag: 'detour_found'` et OPEN sans flag. Le seul différence est la narration ("en silence" vs "résiste un instant"). Si le joueur n'a pas le flag, il peut quand même ouvrir la trappe. Le flag `detour_found` n'est donc **jamais mécaniquement nécessaire**.

**Deux options** :
- **Option A** (recommandée) : Rendre la trappe invisible/cachée sans le flag. La trappe ne devrait pas être interactive avant EXAMINE du couloir. Ajouter `hidden: true` et un système de révélation (ou requiredFlag sur le OPEN sans flag).
- **Option B** : Accepter que le flag est narratif — le joueur peut trouver la trappe sans examiner le couloir, mais c'est moins guidé.

- 🟡 **Même problème CLIMB que ESCAPE** : pas de `movesPlayerTo`. Le joueur ouvre la trappe, la narration dit "il mène de l'autre côté" mais le joueur reste dans UNLOCK. `revealsExit: 'unlock_to_reveal'` est correct ici — le joueur doit ensuite "aller" — mais c'est moins intuitif que pour une porte.

#### 7. `plasma_cutter_rack` — ✅ OK

**États** : intact → empty
**Interactions** : 1 (TAKE auto)
**Simple, fonctionnel.** Le rack contient le plasma_cutter, TAKE le révèle.

**Problème mineur** :
- 🟢 **Description `empty` trop courte** : "Le rack est vide. Le decoupeur a ete pris." — Acceptable pour un container simple.

### Nœud REVEAL — Emplacement de la Survivante

#### 8. `survivor_barricade` — 🔴 Manque d'interactions clés

**États** : intact → broken
**Interactions** : 2 (EXAMINE auto, BREAK FOR DC8)

**Problèmes identifiés** :

- 🔴 **Pas d'interaction OPEN/KNOCK/CALL** — Le joueur arrive devant une barricade derrière laquelle se cache la survivante. Le réflexe naturel est "frapper à la porte", "appeler", "parler". Mais seul BREAK (détruire) et EXAMINE existent. Le joueur CHA n'a aucune option.

**Fix** : Ajouter TALK/CALL/KNOCK CHA DC8 :

```typescript
{
  trigger: { verb: ['TALK', 'CALL', 'KNOCK'], requiredState: 'intact', stat: 'CHA', dc: 8 },
  onSuccess: {
    narrative: {
      fr: "\"Il y a quelqu'un ?\" Silence. Puis une voix, rauque, "
        + "méfiante : \"Qui êtes-vous ? Comment êtes-vous arrivé ici ?\" "
        + "Des bruits de métal — la barricade s'entrouvre.",
    },
    flagSet: 'okonkwo_found',
    // NE PAS détruire la barricade — Okonkwo l'ouvre de l'intérieur
  },
},
```

- 🔴 **`okonkwo_found` n'est jamais set** — Le flag existe dans KNOWN_FLAGS et est requis par medical_stabilizer (`requiredFlag: 'okonkwo_found'`), mais **aucune interaction ne le set** dans le code. Le joueur ne peut jamais utiliser le stabilisateur sur Okonkwo.

**Fix 🔴 CRITIQUE** : `okonkwo_found` doit être set soit par :
- TALK/KNOCK sur la barricade (nouveau)
- TALK sur dr_okonkwo directement (si le NPC est accessible sans flag)
- Automatiquement en entrant dans le nœud REVEAL (via un hook)

La solution la plus propre : set `okonkwo_found` quand le joueur interagit avec la barricade OU parle à Okonkwo pour la première fois.

- 🟡 **BREAK détruit la barricade** — `barricade_dismantled` est set. Mais est-ce que ça blesse/effraye Okonkwo ? Casser la protection d'une survivante blessée devrait avoir des conséquences (Okonkwo hostile/méfiante, ou blessure collatérale). Pas de conséquence actuellement.

**Fix** : Ajouter une conséquence narrative + mécanique au BREAK :

```typescript
// Après BREAK, Okonkwo est méfiante
consequences: [{ type: 'flag_set', flag: 'okonkwo_hostile_start' }],
// ou damage collatéral léger
```

#### 9. `research_terminal` — ✅ Bien construit

**États** : damaged → active
**Interactions** : 2 (READ auto → project_hunter_read, REPAIR INT DC11 → creature_learns_discovered)

**Problèmes identifiés** :

- 🟡 **readableContent existe mais pas d'interaction READ pour l'état `active`** — Après REPAIR, le terminal passe à `active` mais il n'y a pas d'interaction READ pour l'état active. Le joueur ne peut pas relire les données complètes après réparation.
- 🟡 **Pas de HACK alternative** — Seul REPAIR (INT DC11) fait passer à active. Un HACK serait redondant mais cohérent avec les autres terminaux.
- ✅ **`acoustic_info_received` n'est jamais set par le terminal** — Ce flag est documenté dans KNOWN_FLAGS mais n'apparaît sur aucune interaction du research_terminal. Il est censé venir de TALK avec dr_okonkwo (quand elle explique la faiblesse sonore). **Vérifier** que le TALK success d'Okonkwo set bien ce flag.

**Fix pour READ active** :

```typescript
{
  trigger: { verb: 'READ', requiredState: 'active', dc: null },
  onSuccess: {
    narrative: {
      fr: "Les données complètes du Projet Chasseur. Séquences génétiques, "
        + "courbes d'adaptation, rapports d'incidents. Tout est là — "
        + "la preuve que la corporation savait ce qu'elle faisait.",
    },
    flagSet: 'project_hunter_read', // redondant si déjà lu en damaged
  },
},
```

### Nœud ESCALATION — La Traque

#### 10. `acoustic_walls` — 🟡 Trop passif

**États** : intact (seul état)
**Interactions** : 1 (EXAMINE auto → acoustic_potential_noted)

**Problèmes identifiés** :

- 🟡 **Pas d'interaction active** — Les murs acoustiques sont un élément clé pour la victoire émergente (le piège acoustique au BOSS utilise ces murs), mais le joueur ne peut QUE les examiner. Pas de USE, pas de BREAK, pas de REPAIR.
- 🟡 **`acoustic_potential_noted` est set ici mais `acoustic_info_received` (requis par acoustic_trap_point) vient d'ailleurs** — Confusion entre deux flags similaires. Le joueur doit avoir `acoustic_info_received` pour utiliser le piège, mais ce flag n'est set NI par acoustic_walls NI par research_terminal. Il doit venir de TALK Okonkwo — **non vérifié dans le code**.

**Fix recommandé** : Les murs devraient pouvoir être une source alternative d'`acoustic_info_received` pour un joueur INT :

```typescript
{
  trigger: { verb: 'EXAMINE', stat: 'INT', dc: 10 },
  onSuccess: {
    narrative: {
      fr: "Les panneaux sont calibrés pour 15-20 kHz — fréquence de résonance maximale. "
        + "Vous comprenez : un émetteur sonique à cette fréquence, dans cette géométrie, "
        + "créerait une cage acoustique infranchissable. La faiblesse de la créature, "
        + "amplifiée par l'architecture.",
    },
    flagSet: 'acoustic_info_received', // ← AUSSI set ici, pas seulement via Okonkwo
  },
},
// Garder l'EXAMINE auto pour la version narrative simple
{
  trigger: { verb: 'EXAMINE', dc: null },
  onSuccess: {
    narrative: {
      fr: "Panneaux acoustiques spéciaux. Le son rebondit ici de façon étrange — "
        + "amplification naturelle.",
    },
    flagSet: 'acoustic_potential_noted',
  },
},
```

#### 11. `distraction_rack` — ✅ OK

**États** : intact → empty
**Interactions** : 1 (TAKE auto)
**Simple, fonctionnel.** Révèle distraction_device.

#### 12. `blast_door_partial` — 🔴 Manque de chemins

**États** : damaged → open
**Interactions** : 1 (FORCE_OPEN FOR DC13... **mais attendu dans le code**)

**Problèmes identifiés** :

- 🔴 **Le code source ne montre qu'une interaction FORCE_OPEN** — Seul FOR peut ouvrir cette porte. Pas d'INT (REPAIR), pas de tool path (salvage_tool useOn existe dans la spec mais le blast_door lui-même n'a pas d'interaction pour le recevoir).

**Vérification** : Le salvage_tool a un `useOn` vers `blast_door_partial` qui set `blast_door_widened`. Mais le blast_door feature a-t-il une interaction qui consomme ce flag ? Probablement non — les useOn items ne créent pas automatiquement des interactions côté feature.

**Fix 🔴** : Ajouter des chemins INT et tool :

```typescript
// REPAIR INT DC11
{
  trigger: { verb: 'REPAIR', requiredState: 'damaged', stat: 'INT', dc: 11 },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: "Vous trouvez le mécanisme coincé et réalignez les rails. "
        + "La porte coulisse — lentement, mais suffisamment.",
    },
    revealsExit: 'escalation_to_boss',
  },
},
// USE salvage_tool — auto-success
{
  trigger: { verb: ['USE', 'FORCE_OPEN'], requiredState: 'damaged', requiredItem: 'salvage_tool', dc: null },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: "L'outil fait levier dans le mécanisme. La porte s'ouvre "
        + "de 30 centimètres supplémentaires. Assez pour passer.",
    },
    flagSet: 'blast_door_widened',
    revealsExit: 'escalation_to_boss',
  },
},
```

- 🔴 **FORCE_OPEN n'a pas de `revealsExit`** — Même problème que collapsed_corridor. Le joueur force la porte mais ne peut pas la traverser mécaniquement.

**Fix** : Ajouter `revealsExit: 'escalation_to_boss'` au FORCE_OPEN.

- 🟡 **Pas de conséquence onFailure pour FORCE_OPEN** — Forcer une porte blindée devrait avoir un coût en cas d'échec (au minimum narratif, idéalement 1 dmg).

### Nœud BOSS — Point d'Extraction

#### 13. `shuttle_hatch` — ✅ Excellent design moral

**États** : open (reste open)
**Interactions** : 3 (ENTER+escort_active → victoire primaire, ENTER seul → victoire alt, USE CHA DC0 → appât)

**Design moral remarquable** : Le joueur peut entrer seul (abandonner Okonkwo), entrer avec elle (la sauver), ou l'utiliser comme appât (le pire choix moralement). Trois fins distinctes.

**Problèmes identifiés** :

- 🔴 **USE CHA DC0 pour l'appât** — DC 0 signifie auto-succès. Le choix le plus sombre du jeu n'a AUCUNE difficulté ? Le joueur devrait au minimum devoir convaincre Okonkwo (CHA DC14 pour la manipuler, CHA DC8 si elle se sacrifie volontairement par culpabilité).

**Fix** :

```typescript
// Remplacer DC 0 par un vrai choix
{
  trigger: { verb: ['USE', 'SACRIFICE'], requiredFlag: 'escort_active', stat: 'CHA', dc: 14 },
  onSuccess: {
    narrative: {
      fr: "\"Docteur, il faut distraire la créature. C'est vous qu'elle veut.\" "
        + "Le visage d'Okonkwo se décompose. La compréhension, puis la résignation. "
        + "\"Je l'ai créée. C'est ma responsabilité.\" Elle s'avance vers l'ombre.",
    },
    flagSet: 'okonkwo_used_as_bait',
    // NPC meurt → defeat condition non triggée car c'est un choix du joueur ?
  },
  onFailure: {
    narrative: {
      fr: "\"Non. NON ! Je refuse de mourir pour vos lâchetés !\" "
        + "Okonkwo recule, terrifiée. La manipulation a échoué — "
        + "elle ne se sacrifiera pas volontairement.",
    },
  },
},
```

- 🟡 **`both_in_shuttle` flag set mais jamais consommé** — Même problème que `backup_beacon_active`. Le flag est set par ENTER+escort mais rien en aval ne le teste.

- 🟡 **Pas de `revealsExit` cohérent** — Les interactions ENTER set `revealsExit: 'boss_to_resolution'`. C'est correct — mais il faut vérifier que le nœud BOSS a bien `'resolution'` dans ses exits (oui, confirmé).

#### 14. `acoustic_trap_point` — ✅ Bien construit (victoire émergente)

**États** : intact → activated
**Interactions** : 2 (USE sonic+acoustic_info_received → creature_contained, EXAMINE)

**Chaîne complète de la victoire émergente** :
1. REVEAL : TALK Okonkwo → `acoustic_info_received`
2. REVEAL : TAKE sonic_emitter_component
3. BOSS : USE sonic ON acoustic_trap_point → `creature_contained` → victoire émergente

**Problèmes identifiés** :

- 🔴 **`acoustic_info_received` n'est jamais set dans le code visible** — Ce flag est requis par acoustic_trap_point mais aucune interaction du scénario ne le set dans les extraits de code disponibles. Il devrait être set par TALK dr_okonkwo en REVEAL, mais le NPC inline dans nodeLocations n'a que talkSuccess/talkFailure textes — pas de `flagSet`.

**Fix 🔴 CRITIQUE** : S'assurer que le TALK success de dr_okonkwo set `acoustic_info_received`. Si le NPC inline ne supporte pas les flags → il faut soit l'ajouter au système, soit créer une interaction feature dédiée.

- 🟡 **Pas de chemin alternatif sans le flag** — Si le joueur a le composant sonique mais pas le flag `acoustic_info_received`, il ne peut pas utiliser le piège. C'est voulu (il faut PARLER à Okonkwo pour comprendre), mais frustrant si le joueur a lu les research_notes et compris la faiblesse. Le flag `project_hunter_read` devrait aussi permettre l'accès.

**Fix recommandé** :

```typescript
// Accepter AUSSI project_hunter_read comme flag alternatif
{
  trigger: { 
    verb: 'USE', 
    requiredItem: 'sonic_emitter_component', 
    requiredFlag: ['acoustic_info_received', 'project_hunter_read'], // OR logic
    dc: null,
  },
  // ...
},
```

**Note** : Si le système ne supporte pas le OR sur les flags, créer deux interactions identiques avec chacun des flags.

#### 15. `extraction_bay_door` — 🟡 Rôle flou

**États** : damaged → open
**Interactions** : 2 (REPAIR INT DC11, FORCE_OPEN FOR DC14) + salvage_tool useOn

**Problèmes identifiés** :

- 🟡 **Relation avec shuttle_hatch peu claire** — Le joueur doit-il ouvrir extraction_bay_door AVANT d'accéder à shuttle_hatch ? Ou sont-ils indépendants ? Si la porte bloque l'accès à la navette, c'est un gate supplémentaire non documenté. Si non, à quoi sert-elle ?

**Clarification nécessaire** : Si extraction_bay_door est un gate vers shuttle_hatch, ajouter `revealsExit` ou documenter la relation. Si c'est une porte vers RESOLUTION (post-shuttle_hatch), le flow est incohérent car shuttle_hatch a déjà `revealsExit: 'boss_to_resolution'`.

- 🟡 **`extraction_door_opened` set par 3 sources** (REPAIR, FORCE_OPEN, salvage_tool useOn) mais jamais consommé comme flag gate. Il devrait conditionner l'accès à la navette OU la résolution.

- 🟡 **Pas de onFailure pour REPAIR ou FORCE_OPEN** — Pas de conséquence narrative en cas d'échec.

#### 16. `shuttle_cockpit` — 🟡 Décoratif mais incomplet

**États** : active (seul)
**Interactions** : 1 (ACTIVATE auto)
**Décoratif** : `decorative: true`

**Problèmes identifiés** :

- 🟡 **ACTIVATE ne déclenche pas la victoire** — Le texte dit "Vous appuyez sur DECOLLAGE" mais il n'y a pas de `flagSet: 'victory'` ou de condition de victoire mécanique. La victoire est déjà gérée par l'arrivée en RESOLUTION (primaryVictory = escort_alive au locationId 'resolution'). Le cockpit est donc purement narratif.

- 🟡 **Pas de variante narrative selon le contexte** — Le même texte joue que le joueur soit seul (victoire sombre) ou avec Okonkwo (victoire primaire) ou avec la créature piégée (victoire émergente). Trois fins radicalement différentes méritent trois textes différents.

**Fix recommandé** :

```typescript
// ACTIVATE avec escort_active → fin heureuse
{
  trigger: { verb: 'ACTIVATE', requiredFlag: 'both_in_shuttle', dc: null },
  onSuccess: {
    narrative: {
      fr: "Vous appuyez sur DÉCOLLAGE. La Dr. Okonkwo s'agrippe au siège copilote. "
        + "Les moteurs rugissent. La station s'éloigne — avec ses secrets, ses monstres. "
        + "Mais pas ses survivants. Pas cette fois.",
    },
  },
},
// ACTIVATE seul (abandon) → fin sombre
{
  trigger: { verb: 'ACTIVATE', requiredFlag: 'okonkwo_abandoned', dc: null },
  onSuccess: {
    narrative: {
      fr: "Vous appuyez sur DÉCOLLAGE. Seul dans le cockpit. "
        + "La station s'éloigne. Quelque part en bas, une femme que vous avez "
        + "laissée derrière hurle peut-être encore. Vous ne le saurez jamais.",
    },
  },
},
// ACTIVATE avec creature_contained → meilleure fin
{
  trigger: { verb: 'ACTIVATE', requiredFlag: 'creature_contained', dc: null },
  onSuccess: {
    narrative: {
      fr: "Vous appuyez sur DÉCOLLAGE. La créature est confinée — le piège acoustique "
        + "la retiendra pour toujours. La Dr. Okonkwo regarde la station s'éloigner. "
        + "\"C'est fini\", murmure-t-elle. Pour la première fois, elle semble le croire.",
    },
  },
},
// ACTIVATE default → fallback
{
  trigger: { verb: 'ACTIVATE', dc: null },
  onSuccess: {
    narrative: {
      fr: "Vous appuyez sur DÉCOLLAGE. Les moteurs rugissent. "
        + "La station s'éloigne en dessous — avec ses secrets, ses monstres, ses morts.",
    },
  },
},
```

---

## PHASE 2 — Analyse des Flags Orphelins

### Flags SET mais jamais consommés (orphelins)

| Flag | Set par | Consommé par | Problème |
|------|---------|-------------|----------|
| `shuttle_searched` | crashed_shuttle SCAN | RIEN | Tracking only — acceptable |
| `breach_examined` | hull_breach EXAMINE (si implémenté) | RIEN | Lore flag — acceptable |
| `backup_beacon_active` | beacon REPAIR | RIEN | 🔴 Choix sans conséquence — doit affecter la résolution |
| `corridor_cleared_tool` | collapsed_corridor+salvage_tool | RIEN | Tracking — acceptable |
| `corridor_plasma_cut` | collapsed_corridor+plasma | RIEN | Tracking — acceptable |
| `noise_made_unlock` | plasma cutter usage | RIEN | 🟡 Devrait accélérer le stalker clock ou déclencher une rencontre |
| `okonkwo_trusts` | (non trouvé dans le code) | RIEN | 🔴 Présent dans KNOWN_FLAGS mais jamais set |
| `barricade_dismantled` | barricade BREAK | RIEN | 🟡 Devrait avoir une conséquence (perte de protection) |
| `acoustic_potential_noted` | acoustic_walls EXAMINE | RIEN | Tracking — acceptable |
| `creature_learns_discovered` | terminal REPAIR | RIEN | 🟡 Info stratégique sans impact mécanique |
| `blast_door_widened` | salvage_tool useOn blast_door | RIEN | 🟡 Devrait faciliter le passage (or c'est le useOn, pas le feature) |
| `both_in_shuttle` | shuttle_hatch ENTER+escort | RIEN | 🟡 Devrait conditionner le texte de résolution |
| `extraction_door_opened` | extraction_bay_door | RIEN | 🟡 Devrait gater l'accès à la navette |

### Flags REQUIS mais jamais set (orphelins inversés)

| Flag requis | Requis par | Set par | Problème |
|-------------|-----------|---------|----------|
| `acoustic_info_received` | acoustic_trap_point USE | **RIEN dans le code visible** | 🔴 Victoire émergente impossible |
| `okonkwo_found` | medical_stabilizer useOn | **RIEN dans le code visible** | 🔴 Gate item inutilisable |
| `escort_active` | shuttle_hatch ENTER primaire | medical_stabilizer consequences | ✅ Câblé (dans consequences flag_set) |

**Résumé Phase 2** : 2 flags critiques jamais set (`acoustic_info_received`, `okonkwo_found`), 1 flag fantôme jamais set ni consommé (`okonkwo_trusts`), ~8 flags sans consommation mécanique.

---

## PHASE 3 — CoreSkeleton Metadata Enrichment

### 17. `descriptionKey` — 🟡 Trop court, pas de nom de station

**Actuel** : "Un signal de detresse pulse depuis les profondeurs. Quelqu'un est encore en vie. Allez le chercher."

**Enrichi** :

```typescript
descriptionKey: {
  fr: "Station Orbitale Calypso — le signal de détresse pulse depuis 72 heures. "
    + "Votre navette s'est écrasée à l'approche, la coque percée. Quelqu'un est encore "
    + "en vie là-dedans — la Dr. Okonkwo, chercheuse principale du Projet Chasseur. "
    + "Mais quelque chose d'autre vit aussi dans ces couloirs. Quelque chose qui chasse. "
    + "Trouvez la survivante. Stabilisez-la. Sortez-la de là. Avant que le chasseur "
    + "ne vous trouve tous les deux.",
},
```

### 18. `revelation` — 🟡 Factuel, manque d'émotion

**Actuel** : "La Dr. Okonkwo est la chercheuse principale — et la creature etait son experience. Elle connait sa faiblesse : la sensibilite sonore. La culpabilite la rend prete a tout pour aider."

**Enrichi** :

```typescript
revelation: {
  fr: "La Dr. Okonkwo n'est pas une victime innocente — elle est la créatrice de la chose "
    + "qui vous chasse. Projet Chasseur : un organisme synthétique à évolution accélérée, "
    + "conçu comme arme biologique. Elle connaît sa faiblesse — les hautes fréquences "
    + "entre 15 et 20 kHz la désorientent, au-dessus de 20 kHz elle souffre. "
    + "Mais la créature apprend. Elle s'adapte aux stimuli répétés en 3 à 5 expositions. "
    + "Okonkwo porte le poids de 47 morts sur les épaules. Sa culpabilité est votre "
    + "meilleur atout — elle fera tout pour expier. Même mourir.",
},
```

### 19. `escalationTrigger` — 🟡 Trop court, pas de métriques concrètes

**Actuel** : "Vous escortez maintenant une blessee. Les deplacements sont ralentis. La creature a detecte l'odeur du sang. La chasse commence."

**Enrichi** :

```typescript
escalationTrigger: {
  fr: "L'escorte change tout. La Dr. Okonkwo peut marcher, mais lentement — "
    + "chaque déplacement prend deux fois plus de temps. Le sang sur ses bandages "
    + "laisse une piste olfactive que la créature suit comme un fil d'Ariane. "
    + "Vous l'entendez maintenant — des griffes sur le métal, toujours un couloir "
    + "derrière vous. Elle ne fonce plus aveuglément. Elle chasse. Elle apprend "
    + "vos habitudes. Chaque pièce traversée est un calcul : foncer et risquer "
    + "l'embuscade, ou sécuriser d'abord et perdre du temps que vous n'avez pas.",
},
```

### 20. `emergentVictoryHint` — 🟡 Trop vague

**Actuel** : "L'emetteur sonique combine avec l'acoustique de la zone pourrait confiner la creature..."

**Enrichi** :

```typescript
emergentVictoryHint: {
  fr: "Le composant d'émetteur sonique haute fréquence, placé au point de piège acoustique "
    + "dans la baie d'extraction, créerait une cage de résonance infranchissable pour la créature. "
    + "Les parois acoustiques du laboratoire d'Okonkwo amplifient le signal par un facteur 100. "
    + "Il faut avoir compris la faiblesse sonore (via Okonkwo ou le terminal de recherche) "
    + "ET avoir conservé le composant sans l'utiliser sur la créature ou la balise. "
    + "Le piège est permanent — la créature est confinée pour toujours.",
},
```

### 21. Descriptions de nœuds — Toutes à enrichir

**start** — actuel 2 phrases → enrichir à 5 :

```typescript
fr: "Site de Crash. Votre navette s'est écrasée contre le dock d'amarrage de la Station "
  + "Calypso. La coque est percée, le cockpit déformé au-delà de toute réparation. "
  + "De la fumée s'échappe des circuits brûlés. Le moteur principal est en miettes — "
  + "cette navette ne redécollera jamais. Mais la soute arrière contient peut-être "
  + "du matériel récupérable. Un signal de détresse pulse depuis les profondeurs "
  + "de la station — régulier, insistant. Quelqu'un est vivant là-dedans.",
```

**unlock** — actuel 2 phrases → enrichir :

```typescript
fr: "Point de Triage. Zone médicale dévastée — civières renversées, matériel "
  + "chirurgical éparpillé sur le sol. Le couloir principal s'est effondré sous "
  + "le poids des poutres — des tonnes de métal bloquent le passage. Le signal "
  + "de détresse est plus fort ici, juste de l'autre côté. Une trappe de maintenance "
  + "est visible au ras du sol. Un rack contient un découpeur plasma industriel — "
  + "puissant, mais le bruit attirerait l'attention de tout ce qui vit dans ces couloirs.",
```

**reveal** — actuel 3 phrases → enrichir :

```typescript
fr: "Laboratoire de la Dr. Okonkwo. Une barricade méthodique bloque l'entrée — "
  + "mobilier soudé, plaques d'acier, câblage tendu comme des fils de rasoir. "
  + "Derrière, une femme. Blessée. Consciente. Le terminal de recherche clignote "
  + "à côté d'elle, affichant des données fragmentaires du Projet Chasseur. "
  + "Des rations vides indiquent qu'elle survit ici depuis au moins 48 heures. "
  + "Le chemin de sortie passe par le territoire de chasse de la créature.",
```

**escalation** — actuel 2 phrases → enrichir :

```typescript
fr: "Zone de Traque. Les couloirs sont plus étroits ici — visibilité réduite, "
  + "recoins sombres, points d'embuscade. L'air est plus mince aussi, l'oxygène "
  + "se raréfie. Les parois sont recouvertes de panneaux acoustiques — vestiges "
  + "du laboratoire d'Okonkwo. Un rack de diversion contient des grenades flash. "
  + "Une porte blindée partiellement ouverte bloque le passage vers la baie "
  + "d'extraction. Des griffures profondes sur la porte — la créature est passée par là.",
```

**boss** — actuel 2 phrases → enrichir :

```typescript
fr: "Baie d'Extraction. La navette de secours est là — cabossée mais fonctionnelle, "
  + "l'écoutille ouverte, les moteurs en veille. La liberté est à portée de main. "
  + "Mais la créature se dresse entre vous et la navette. Biomasse sombre, griffes "
  + "d'acier, yeux trop intelligents. Elle a senti le sang d'Okonkwo et elle ne "
  + "bougera pas. La géométrie de la baie forme un entonnoir acoustique naturel — "
  + "un détail qui pourrait tout changer si vous avez les bons outils. "
  + "Un choix impossible s'impose. Qui monte dans cette navette ?",
```

**resolution** — actuel 1 phrase → enrichir :

```typescript
fr: "Le cockpit de la navette d'évacuation. Systèmes en ligne, moteurs prêts. "
  + "L'écran affiche les coordonnées de retour vers la flotte. Un seul bouton : "
  + "DÉCOLLAGE. Ce qui s'est passé ensuite — qui est monté, qui est resté, "
  + "ce qui est arrivé à la créature — dépend entièrement de vos choix.",
```

---

## PHASE 4 — Analyse d'Accessibilité par Stat (Boss + Gates)

### Gate Obstacle : collapsed_corridor (UNLOCK)

| Stat | Chemin | DC | Coût | Accessible? |
|------|--------|-----|------|------------|
| FOR | FORCE_OPEN | 12 | 1 dmg | ✅ |
| FOR+tool | FORCE_OPEN+salvage_tool | auto | — | ✅ |
| PER | EXAMINE → detour_found → OPEN trappe | 11 + auto | — | ✅ |
| INT | USE plasma_cutter | 10 | noise | ✅ |
| AGI | **RIEN** | — | — | 🔴 |
| CHA | **RIEN** | — | — | 🔴 |

**Fix** : Le failsafe CRAWL AGI DC8 (proposé en Phase 1 point 5) couvre AGI. CHA n'a pas de chemin — acceptable car le couloir est un obstacle physique, pas social. MAIS le joueur pur CHA doit avoir accès au salvage_tool (SEARCH PER DC8 ou TAKE auto sur salvageable_parts) pour passer → c'est faisable.

### Boss : shuttle_hatch + extraction_bay_door + acoustic_trap_point

**Chemins vers la victoire** :

| Victoire | Prérequis | Chemins stat |
|----------|-----------|-------------|
| **Primaire** (escorte) | okonkwo_stabilized + escort_active + ENTER shuttle | CHA (parler barricade) → USE stabilizer → ENTER |
| **Alternative** (seul) | ENTER shuttle sans escort | Tout stat — auto-accès |
| **Appât** | escort_active + USE/SACRIFICE CHA DC0→14 | CHA DC14 (recommandé) |
| **Émergente** (piège) | acoustic_info_received + sonic_emitter + USE trap_point | INT (examiner murs) ou CHA (parler Okonkwo) |

**extraction_bay_door** — gate vers la navette ?

| Stat | Chemin | DC |
|------|--------|-----|
| INT | REPAIR | 11 |
| FOR | FORCE_OPEN | 14 |
| tool | salvage_tool useOn | auto |
| AGI | **RIEN** | — |
| CHA | **RIEN** | — |
| PER | **RIEN** | — |

**Fix recommandé** : Ajouter un chemin PER (trouver un panneau de maintenance latéral) :

```typescript
{
  trigger: { verb: 'EXAMINE', requiredState: 'damaged', stat: 'PER', dc: 10 },
  onSuccess: {
    narrative: {
      fr: "Vous repérez un panneau de maintenance sur le côté. Les câbles hydrauliques "
        + "sont accessibles — un simple recâblage et la porte devrait s'ouvrir.",
    },
    flagSet: 'bay_door_bypass_found',
  },
},
{
  trigger: { verb: 'REPAIR', requiredState: 'damaged', requiredFlag: 'bay_door_bypass_found', dc: null },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: "Le recâblage fonctionne. La porte s'ouvre silencieusement — "
        + "presque trop facilement.",
    },
    flagSet: 'extraction_door_opened',
  },
},
```

### Résumé Balance Stats RESCUE

| Stat | START | UNLOCK | REVEAL | ESCALATION | BOSS | Total |
|------|-------|--------|--------|------------|------|-------|
| FOR | crashed_shuttle DC10, hull_breach tools | corridor DC12 | barricade DC8 | blast_door DC13 | extraction_door DC14 | 5 |
| INT | hull_breach DC12, beacon DC11 | plasma DC10 | terminal DC11 | — | extraction_door DC11, trap auto | 5 |
| PER | salvageable_parts DC8, crashed_shuttle SCAN DC9 | corridor EXAMINE DC11 | — | — | — (à ajouter) | 3 |
| CHA | — | — | barricade TALK (à ajouter) | — | shuttle choix moral, appât DC14 | 1→2 |
| AGI | — | — (à ajouter failsafe) | — | — | — | 0→1 |
| LCK | — | — | — | — | — | 0 |

**Constat** : FOR et INT sont bien couverts. PER est correct mais concentré en START. CHA est faible (uniquement au BOSS + nouveau TALK barricade). AGI est absent (failsafe couloir à ajouter). LCK est absent (acceptable — le scénario RESCUE est centré sur les choix moraux, pas la chance).

---

## PHASE 5 — Items : Utilité et Consommation

### Matrice d'utilité des items

| Item | Obtention | Utilisable sur | Résultat | Consommé? | Utile? |
|------|----------|---------------|----------|-----------|--------|
| `first_aid_kit` | START (visible) | dr_okonkwo | heal 2 + okonkwo_patched | ✅ oui | ✅ Soins temporaires |
| `medical_stabilizer` | START (caché, crashed_shuttle:open) | dr_okonkwo | okonkwo_stabilized + escort_active | ✅ oui | ✅ Gate item critique |
| `salvage_tool` | START (caché, salvageable_parts:empty) | collapsed_corridor, blast_door, extraction_bay_door, hull_breach | Chemins auto-success | ❌ non | ✅ Multi-usage excellent |
| `plasma_cutter` | UNLOCK (caché, plasma_cutter_rack:empty) | collapsed_corridor, creature_hunter | Coupe obstacles + dégâts créature | ❌ non | ✅ Mais bruyant |
| `research_notes` | REVEAL (visible) | READ seulement | project_hunter_read (info) | ❌ non | 🟡 Lore only — pas d'impact mécanique |
| `sonic_emitter_component` | REVEAL (visible) | creature_hunter, acoustic_trap_point, emergency_beacon | Triangle : combat/piège/balise | ✅ oui | ✅ Design émergent brillant |
| `distraction_device` | ESCALATION (caché, distraction_rack:empty) | creature_hunter | creature_distracted + stalker decrement | ✅ oui | ✅ Survie escalation |

### Problèmes identifiés

- 🟡 **`research_notes` n'a aucun useOn** — `useOn: []` est vide. L'item n'est utilisable sur rien. C'est du lore pur accessible via READ/EXAMINE. Acceptable, mais pourrait être plus utile.

**Fix optionnel** : Permettre USE research_notes ON dr_okonkwo (confronter Okonkwo avec ses propres recherches) ou ON research_terminal (accélérer la réparation).

- 🔴 **`plasma_cutter` useOn `creature_hunter` fait `damage: 4` au... `player`?** — Dans le code : `consequences: [{ type: 'damage', amount: 4, targetId: 'player' }]`. Le plasma cutter touche la créature mais blesse le JOUEUR ? C'est probablement une erreur — `targetId` devrait être `creature_hunter` ou alors c'est un coût narratif (la créature contre-attaque).

**Fix** : Vérifier l'intention. Si c'est un dégât à la créature → `targetId: 'creature_hunter'`. Si c'est un coût au joueur → la narration devrait l'expliquer ("la créature vous griffe en reculant").

- 🟡 **`first_aid_kit` heal cible `player` dans rescue.ts mais `dr_okonkwo` dans la spec** — Le code source montre `consequences: [{ type: 'heal', amount: 2, targetId: 'player' }]` mais la spec Chantier 5 dit `targetId: 'dr_okonkwo'`. Incohérence.

**Fix** : `targetId` devrait être `'dr_okonkwo'` — c'est sur elle qu'on applique les compresses.

---

## Récapitulatif des Corrections

### 🔴 Corrections Critiques (8)

| # | Objet | Problème | Fix |
|---|-------|----------|-----|
| 1 | `collapsed_corridor` FORCE_OPEN | Pas de `revealsExit` — joueur dégage mais ne passe pas | Ajouter `revealsExit: 'unlock_to_reveal'` |
| 2 | `collapsed_corridor` | Pas de failsafe anti-softlock | Ajouter CRAWL AGI DC8 (3 dmg) |
| 3 | `okonkwo_found` flag | Jamais set — medical_stabilizer inutilisable | Ajouter TALK sur barricade ou dr_okonkwo → set flag |
| 4 | `acoustic_info_received` flag | Jamais set — victoire émergente impossible | Ajouter flagSet sur TALK Okonkwo ET/OU EXAMINE acoustic_walls INT DC10 |
| 5 | `survivor_barricade` | Pas d'interaction TALK/KNOCK/CALL — joueur CHA bloqué | Ajouter TALK CHA DC8 → okonkwo_found |
| 6 | `blast_door_partial` FORCE_OPEN | Pas de `revealsExit` — même bug que collapsed_corridor | Ajouter `revealsExit: 'escalation_to_boss'` |
| 7 | `blast_door_partial` | 1 seul chemin (FOR) — joueur INT/CHA bloqué | Ajouter REPAIR INT DC11 + USE salvage_tool auto |
| 8 | `plasma_cutter` useOn creature | `targetId: 'player'` au lieu de `creature_hunter` | Corriger targetId ou documenter le coût |

### 🟡 Corrections Importantes (12)

| # | Objet | Problème | Fix |
|---|-------|----------|-----|
| 9 | `shuttle_hatch` USE appât | DC 0 — auto-succès pour le choix le plus sombre | Monter à CHA DC14 |
| 10 | `shuttle_cockpit` | Même texte quelle que soit la fin | Ajouter 3-4 variantes conditionnelles (escort, seul, piège, appât) |
| 11 | `backup_beacon_active` flag | Set mais jamais consommé — choix sans conséquence | Affecter le texte de résolution |
| 12 | `noise_made_unlock` flag | Set mais jamais consommé | Devrait accélérer le stalker clock |
| 13 | `first_aid_kit` | heal targetId: 'player' au lieu de 'dr_okonkwo' | Corriger targetId |
| 14 | `research_terminal` | Pas de READ pour état active | Ajouter READ active |
| 15 | `acoustic_trap_point` | Seul `acoustic_info_received` accepté | Ajouter `project_hunter_read` comme flag alternatif |
| 16 | `extraction_bay_door` | Pas de chemin PER — rôle flou | Ajouter EXAMINE PER DC10 + clarifier le rôle |
| 17 | `crashed_shuttle` | Description `broken` orpheline + SCAN mentionne boîte noire inexistante | Supprimer broken ou corriger SCAN |
| 18 | `okonkwo_trusts` flag | Dans KNOWN_FLAGS mais jamais set ni consommé | Supprimer du test ou câbler |
| 19 | `survivor_barricade` BREAK | Pas de conséquence sur Okonkwo | Ajouter conséquence (méfiance/hostilité) |
| 20 | Descriptions de nœuds | Toutes trop courtes (1-3 phrases) | Enrichir à 4-6 phrases chacune |

### Nouvelles interactions à créer

- `survivor_barricade` : TALK/KNOCK CHA DC8 → okonkwo_found
- `collapsed_corridor` : CRAWL AGI DC8 → failsafe (3 dmg)
- `blast_door_partial` : REPAIR INT DC11, USE salvage_tool auto
- `acoustic_walls` : EXAMINE INT DC10 → acoustic_info_received (alternatif)
- `research_terminal` : READ (requiredState: active)
- `shuttle_cockpit` : ACTIVATE conditionnel ×3-4 (escort, seul, piège, appât)
- `extraction_bay_door` : EXAMINE PER DC10 → bay_door_bypass_found, REPAIR avec flag auto

### Flags à câbler

| Flag | Action |
|------|--------|
| `okonkwo_found` | Set par TALK barricade ou premier TALK dr_okonkwo |
| `acoustic_info_received` | Set par TALK Okonkwo (dans NPC) ET EXAMINE acoustic_walls INT DC10 |
| `okonkwo_trusts` | Soit câbler (set par TALK CHA DC12 avec Okonkwo), soit supprimer |
| `noise_made_unlock` | Consommer → stalker_clock_increment |
| `backup_beacon_active` | Consommer → variante texte résolution |
| `both_in_shuttle` | Consommer → variante texte shuttle_cockpit |

### Tests à mettre à jour

- `rescueEnriched.test.ts` : Ajouter `bay_door_bypass_found` aux KNOWN_FLAGS
- Vérifier interaction count : blast_door_partial ≥3, survivor_barricade ≥3
- Vérifier shuttle_cockpit interactions ≥4 (variantes conditionnelles)
- Ajouter test : `collapsed_corridor` a `revealsExit` sur FORCE_OPEN FOR DC12

---

## Synthèse

| Métrique | Avant audit | Après corrections |
|----------|------------|-------------------|
| Features | 16 | 16 (pas de nouvelle) |
| Items | 7 | 7 (pas de nouveau) |
| Interactions totales | ~55 | ~67 (+12) |
| Flags actifs | 26 (13 orphelins) | 26+1 (5 orphelins) |
| Chemins boss | 4 | 5+ (ajout PER extraction_bay_door) |
| Stats couverts gate | 3 (FOR/INT/PER) | 4 (FOR/INT/PER/AGI) |
| Bugs bloquants | 5 (revealsExit×2, flags×2, targetId×1) | 0 |
| Fins narratives distinctes | 1 texte générique | 4 textes conditionnels |

**Priorité d'implémentation** :
1. 🔴 `okonkwo_found` + `acoustic_info_received` — sans ces flags, le scénario est injouable
2. 🔴 `revealsExit` manquants sur collapsed_corridor et blast_door_partial — softlocks
3. 🔴 Failsafe AGI couloir + TALK barricade — anti-softlock + CHA coverage
4. 🟡 Variantes texte résolution + fix targetId + blast_door chemins
5. 🟡 CoreSkeleton metadata enrichment + descriptions de nœuds
