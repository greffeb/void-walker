# ESCAPE "Fuir l'Épave" — Passe d'amélioration descriptions FR

> **Objectif** : Appliquer la même méthodologie que pour INVESTIGATE. Chaque objet a une description riche, chaque découverte est concrète, chaque indice est actionable, le boss est équilibré pour toutes les classes.
>
> **Référence de qualité** : `captain_log_datapad` avec sa `readableContent` datée et signée.

---

## 🔴 SECTION 1 — Audit narratif objet par objet

### 1. `status_terminal` — état `active` trop court + pas de readableContent

**Problème** : Quand le terminal est réparé, la description active est tronquée : "Le terminal fonctionne de nouveau." — c'est tout. Le joueur a réparé un terminal endommagé et reçoit une phrase. Aucune `readableContent` n'est définie. Le flag `ship_map_found` est set mais le joueur ne voit rien de concret.

**Corrections** :

#### a) Description état `active` — réécrire :

```typescript
active: {
  fr: 'Le terminal fonctionne — l\'écran affiche le plan du vaisseau et les rapports système. '
    + 'Le diagnostic montre 47 capsules cryogéniques : 46 en défaillance critique (alimentation coupée il y a 6 mois), '
    + '1 éjectée en urgence (la vôtre). Le support vie est en mode minimal. '
    + 'Le pont des pods d\'évasion est marqué au niveau inférieur — '
    + 'mais un point de contrôle de sécurité bloque l\'accès.',
  en: 'Terminal operational — ship layout and system reports on screen. '
    + '47 cryopods: 46 in critical failure, 1 emergency-ejected (yours). '
    + 'Escape pod deck marked on lower level — security checkpoint blocks access.',
},
```

#### b) Ajouter `readableContent` :

```typescript
readableContent: {
  fr: '[ RAPPORT SYSTÈME — USS MERIDIAN ]\n\n'
    + 'CAPSULES CRYOGÉNIQUES : 46/47 en défaillance (coupure alimentation — 6 mois)\n'
    + 'CAPSULE #17 (VOTRE CAPSULE) : éjection d\'urgence il y a 4h03\n'
    + 'ÉQUIPAGE ACTIF : 0/47\n'
    + 'SUPPORT VIE : MODE MINIMAL (37% capacité)\n'
    + 'CONFINEMENT : NIVEAU 5 — ACTIF DEPUIS 6 MOIS\n'
    + 'PONT INFÉRIEUR : PODS D\'ÉVASION (accès via point de contrôle — badge niv. 3 requis)\n\n'
    + '[ DERNIÈRE ENTRÉE AUTOMATIQUE ]\n'
    + '2247-09-15 03:41 — Alerte biologique niveau 5. Protocole ORACLE activé.\n'
    + '2247-09-15 04:12 — Sections 4-7 scellées par le Capitaine Reeves.\n'
    + '2247-09-15 04:58 — Perte de contact avec toutes les équipes de confinement.\n'
    + '2247-09-15 05:30 — Support vie basculé en mode minimal automatique.\n'
    + '[ Plus aucune entrée depuis 6 mois ]',
  en: '[ SYSTEM REPORT — USS MERIDIAN ]\n\n...',
},
```

#### c) Ajouter interaction READ pour état `active` :

```typescript
{
  trigger: { verb: 'READ', requiredState: 'active', dc: null },
  onSuccess: {
    narrative: {
      fr: 'Le rapport système confirme le pire. 47 membres d\'équipage, aucun actif. '
        + 'La dernière activité humaine remonte à 6 mois — une cascade d\'alertes biologiques, '
        + 'des sections scellées, puis le silence. Le plan du vaisseau indique les pods d\'évasion '
        + 'au pont inférieur, derrière un point de contrôle de sécurité.',
      en: 'The system report confirms the worst. 47 crew, none active. Last human activity: 6 months ago.',
    },
  },
},
```

### 2. `captain_terminal` — pas de readableContent propre + état `searched` sans interaction READ

**Problème** : Le captain_terminal a un état `searched` (après SEARCH/HACK pour trouver la clé EVA), mais pas de `readableContent` propre. Le `captain_log_datapad` a du `readableContent` (le journal de Reeves), mais le terminal lui-même ne montre rien quand on le lit directement. De plus, une fois en état `searched`, il n'y a pas d'interaction READ pour relire les logs.

**Corrections** :

#### a) Ajouter `readableContent` au captain_terminal :

```typescript
readableContent: {
  fr: '[ TERMINAL PERSONNEL — CAPITAINE REEVES ]\n\n'
    + 'ENTRÉE 2247-09-14 : Projet ORACLE — Le spécimen Alpha a franchi le confinement de niveau 3. '
    + 'Les biologistes disent que c\'est "prévu dans le protocole d\'adaptation". '
    + 'Je n\'y crois plus. J\'ai ordonné le doublement des gardes.\n\n'
    + 'ENTRÉE 2247-09-15 01:00 : L\'équipe de nuit ne répond plus. Sections 4 et 5 silencieuses. '
    + 'Je vais sceller manuellement. Si ça ne suffit pas, les pods sont notre dernier recours.\n\n'
    + 'ENTRÉE 2247-09-15 03:30 : C\'est une arme. Le spécimen Alpha n\'est pas un "sujet d\'étude" — '
    + 'c\'est une arme biologique commandée par le Commandement. Dossier classifié ORACLE trouvé '
    + 'dans les fichiers du Dr. Nakamura. Nous étions des cobayes. Tous.\n\n'
    + 'ENTRÉE 2247-09-15 04:45 : [ENTRÉE FINALE — voir datapad]',
  en: '[ PERSONAL TERMINAL — CAPTAIN REEVES ]\n\n...',
},
```

#### b) Ajouter interaction READ pour état `searched` :

```typescript
{
  trigger: { verb: 'READ', requiredState: 'searched', dc: null },
  onSuccess: {
    narrative: {
      fr: 'Vous relisez les entrées du terminal. Reeves avait compris : '
        + 'le spécimen Alpha n\'était pas un sujet d\'étude mais une arme biologique '
        + 'commandée par le Commandement. Projet ORACLE. L\'équipage entier servait de terrain de test. '
        + 'La clé EVA que vous avez trouvée était son plan de secours.',
      en: 'You re-read the terminal entries. Reeves had figured it out: Project ORACLE was a weapons program.',
    },
  },
},
```

#### c) Enrichir la description de l'état `active` du captain_terminal :

```typescript
active: {
  fr: 'Le terminal personnel du Capitaine Reeves. L\'écran affiche plusieurs entrées de journal — '
    + 'datées des dernières 48 heures avant la catastrophe. Les entrées deviennent de plus en plus '
    + 'frénétiques. La dernière mentionne un "Projet ORACLE" et un dossier classifié. '
    + 'Le datapad du capitaine repose à côté, séparé du terminal.',
  en: 'Captain Reeves\' personal terminal. Multiple log entries from the last 48 hours before the disaster.',
},
```

#### d) Enrichir la description de l'état `searched` :

```typescript
searched: {
  fr: 'Le terminal du Capitaine Reeves, fouillé. Les tiroirs ont été ouverts — '
    + 'une petite clé magnétique a été trouvée sous des papiers froissés. '
    + 'Les entrées de journal sont toujours lisibles à l\'écran. '
    + 'Le Projet ORACLE hante chaque ligne.',
  en: 'Captain Reeves\' terminal, searched. A small magnetic key found under crumpled papers. '
    + 'The journal entries are still readable on screen.',
},
```

### 3. `life_support_panel` — Une seule interaction (REPAIR INT 14) + état `repaired` trop court

**Problème** : Le panneau de support vie est un obstacle optionnel mais crucial (stabilise l'O₂). Il n'a qu'UNE interaction : REPAIR INT DC14. La matrice anti-softlock dit "1 (optionnel)" — mais c'est quand même un objet important qui ne devrait pas être inaccessible aux classes non-INT. L'état `repaired` est court et ne dit pas ce que le joueur a concrètement gagné.

**Corrections** :

#### a) Enrichir la description `repaired` :

```typescript
repaired: {
  fr: 'Le panneau de support vie a été réparé. L\'écran affiche : '
    + '"O₂ — STABILISÉ — 43% CAPACITÉ". Le ventilateur tourne, l\'air circule. '
    + 'Ce n\'est pas idéal, mais la chute d\'oxygène est stoppée. '
    + 'Vous avez gagné un répit précieux.',
  en: 'Life support panel repaired. Screen shows "O₂ — STABILIZED — 43% CAPACITY". '
    + 'The drop has stopped. You\'ve bought precious time.',
},
```

#### b) Ajouter interaction HACK (INT DC 12) — alternative plus facile mais partielle :

```typescript
{
  trigger: {
    verb: ['HACK', 'BYPASS'],
    requiredState: 'damaged',
    stat: 'INT',
    dc: 12,
  },
  onSuccess: {
    newState: 'repaired',
    narrative: {
      fr: 'Vous ne pouvez pas réparer les câbles arrachés, mais vous pouvez contourner le circuit endommagé. '
        + 'Le système redémarre en mode dégradé — 30% de capacité au lieu de 43%. '
        + 'Mieux que rien. La chute d\'O₂ ralentit considérablement.',
      en: 'You can\'t fix the torn cables, but you can bypass the damaged circuit.',
    },
    flagSet: 'o2_stabilized',
  },
  onFailure: {
    narrative: {
      fr: 'Le circuit est trop endommagé pour un bypass propre. Des étincelles jaillissent. '
        + 'Il faudra une vraie réparation.',
      en: 'The circuit is too damaged for a clean bypass.',
    },
  },
},
```

#### c) Ajouter interaction FORCE (FOR DC 13) — reconnexion musclée :

```typescript
{
  trigger: {
    verb: ['REPAIR', 'FORCE_OPEN'],
    requiredState: 'damaged',
    stat: 'FOR',
    dc: 13,
  },
  onSuccess: {
    newState: 'repaired',
    narrative: {
      fr: 'Vous arrachez les câbles morts, dénudez les fils avec les dents, '
        + 'et reconnectez le circuit à mains nues. Un arc électrique vous mord les doigts — '
        + 'mais le ventilateur redémarre. L\'air afflue. Méthode brute, résultat efficace.',
      en: 'You rip dead cables, strip wires with your teeth, reconnect the circuit bare-handed.',
    },
    flagSet: 'o2_stabilized',
    consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
  },
  onFailure: {
    narrative: {
      fr: 'Les câbles résistent. Un choc électrique vous repousse — '
        + 'le circuit de support vie est plus complexe qu\'il n\'y paraît.',
      en: 'The cables resist. An electric shock pushes you back.',
    },
  },
},
```

### 4. `emergency_locker` — états `open` et `empty` trop courts

**Corrections** :

```typescript
open: {
  fr: 'Le casier d\'urgence est ouvert. L\'éclairage de secours éclaire l\'intérieur : '
    + 'deux emplacements moulés — l\'un pour un badge d\'accès, l\'autre pour une bonbonne d\'oxygène. '
    + 'L\'étiquette "URGENCE — NE PAS RETIRER SAUF ÉVACUATION" est à moitié décollée.',
  en: 'Emergency locker open. Two molded slots inside — one for an access badge, one for an oxygen canister.',
},
empty: {
  fr: 'Le casier d\'urgence, grand ouvert et vide. Les emplacements moulés gardent la forme '
    + 'du badge et de la bonbonne qui s\'y trouvaient. Plus rien d\'utile ici.',
  en: 'Emergency locker, wide open and empty. The molded slots retain the shape of what was inside.',
},
```

### 5. `EVA_suit_locker` — états `open` et `empty` trop courts

**Corrections** :

```typescript
open: {
  fr: 'Le casier EVA est ouvert. La combinaison spatiale blanche repose sur son support, '
    + 'casque intégré et réserve d\'oxygène en place. L\'étiquette indique : '
    + '"Autonomie 30 min — Pression : 1 ATM — Température : -40°C à +120°C".',
  en: 'EVA locker open. White space suit on its mount, helmet and O₂ reserve in place.',
},
empty: {
  fr: 'Le casier EVA, vide. Le support de combinaison nu, les attaches ouvertes. '
    + 'Des fragments de vitre craquent sous vos pieds si vous avez forcé l\'ouverture.',
  en: 'EVA locker, empty. Bare suit mount, open clasps.',
},
```

### 6. `o2_reroute_valve` — descriptions correctes mais `readableContent` manquante pour compréhension

**Problème** : La valve est un objet mécanique — pas de readableContent attendu. Mais les descriptions sont correctes. **Pas de modification nécessaire.** ✅

### 7. `power_conduit` — état `broken` correct, état `repaired` manquant ?

**Problème** : Le conduit a `damaged` et `broken` comme états. Il a aussi un état `repaired` dans la spec. Vérifier qu'une interaction REPAIR existe avec une narrative enrichie.

**Corrections** — enrichir la description `broken` :

```typescript
broken: {
  fr: 'Le conduit est complètement détruit. Les câbles pendent, inertes — '
    + 'plus d\'étincelles, plus de courant. L\'espace où la barre métallique était coincée '
    + 'est vide. Le pont inférieur n\'a plus d\'alimentation de secours.',
  en: 'Conduit completely destroyed. Dead cables hang — no sparks, no current. '
    + 'The space where the metal bar was jammed is empty.',
},
```

### 8. `hull_breach_panel` — description `activated` pourrait être plus dramatique

**Correction** :

```typescript
activated: {
  fr: 'Le panneau affiche "DÉCOMPRESSION EN COURS — SOUTE" en rouge clignotant. '
    + 'À travers les hublots, vous voyez les portes de soute s\'ouvrir — '
    + 'l\'air, les débris, tout est aspiré dans le vide. '
    + 'Si la créature était dans la soute, elle n\'y est plus.',
  en: 'Panel flashes "DECOMPRESSION IN PROGRESS — CARGO BAY". Through the viewports, '
    + 'cargo bay doors open — air and debris sucked into the void.',
},
```

### 9. `bulkhead_door` — manque description `open`

**Correction** — enrichir :

```typescript
locked: {
  fr: 'Cloison blindée de sécurité. Épaisse d\'au moins 15 centimètres d\'acier renforcé. '
    + 'Les verrous magnétiques sont engagés — le voyant du panneau adjacent indique '
    + 'qu\'un badge de niveau 3 ou supérieur est requis. '
    + 'Des griffures profondes marquent le métal côté couloir. '
    + 'Quelque chose a essayé de passer. Quelque chose de gros.',
  en: 'Armored security bulkhead. 15cm of reinforced steel. Magnetic locks engaged — '
    + 'level 3+ badge required. Deep scratches on the corridor side.',
},
open: {
  fr: 'La cloison blindée est ouverte — les verrous magnétiques sont rétractés. '
    + 'Le couloir au-delà s\'enfonce dans l\'obscurité. L\'air qui en provient est '
    + 'plus froid, plus sec. Un silence pesant règne de l\'autre côté.',
  en: 'Bulkhead open — magnetic locks retracted. The corridor beyond stretches into darkness. '
    + 'Colder, drier air. Heavy silence.',
},
```

### 10. `vent_cover` — 🔴 CLIMB ne déplace pas le joueur + descriptions à enrichir

**Problème critique** : Les interactions OPEN (AGI DC8) et BREAK (FOR DC10) ont `revealsExit: 'reveal'` — correct, ça déverrouille la sortie. Mais ensuite il existe une interaction CLIMB/CRAWL (AGI DC10, requiredState: 'open') qui donne une belle narration ("vous rampez dans le conduit... vous émergez de l'autre côté") **sans aucun effet mécanique** — pas de mouvement, pas de `revealsExit` (déjà fait), rien.

Le joueur voit "assez large pour ramper", tape "ramper dans le conduit", reçoit un texte qui dit qu'il traverse... mais il est toujours dans le nœud UNLOCK. C'est un faux signal frustrant — la narration ment sur l'état du jeu.

**Deux options** :

**Option A (recommandée) — CLIMB déplace réellement le joueur** :

L'interaction CLIMB devrait déclencher un déplacement vers le nœud `reveal`. Le système actuel ne supporte pas `movesPlayerTo` dans les interactions scénario, mais c'est le comportement attendu. Si le mouvement automatique n'est pas possible, au minimum la narrative de succès devrait explicitement dire au joueur de se déplacer :

```typescript
// Option A : si movesPlayerTo est supporté
{
  trigger: {
    verb: ['CLIMB', 'CRAWL', 'ENTER', 'TRAVERSE'],
    requiredState: 'open',
    stat: 'AGI',
    dc: 10,
  },
  onSuccess: {
    narrative: {
      fr: 'Vous rampez dans le conduit de ventilation. Sombre. Étroit. '
        + 'Les parois métalliques résonnent sous vos mouvements. '
        + 'Après une dizaine de mètres, vous émergez de l\'autre côté de la cloison.',
      en: 'You crawl through the vent duct. Dark. Narrow. '
        + 'After ten meters, you emerge on the other side of the bulkhead.',
    },
    movesPlayerTo: 'reveal', // ← NÉCESSAIRE — sinon la narration ment
  },
  onFailure: {
    narrative: {
      fr: 'Le conduit est plus étroit que prévu. Vous restez coincé un instant avant de reculer. '
        + 'Il faudra réessayer, ou passer par la cloison.',
      en: 'The duct is narrower than expected. You get stuck before backing out.',
    },
  },
},
```

**Option B (fallback) — Supprimer CLIMB, laisser revealsExit faire le travail** :

Si `movesPlayerTo` n'est pas supporté par le moteur, supprimer l'interaction CLIMB entièrement. Le joueur ouvre la grille → la sortie vers reveal est révélée → le joueur tape "aller" / "avancer" pour traverser normalement. Moins immersif mais mécaniquement honnête.

**⚠️ Vérification moteur requise** : Est-ce que `onSuccess` supporte un champ `movesPlayerTo` ? Si non, il faut soit l'ajouter au moteur (petit ajout dans `processTurn`), soit choisir l'Option B.

**Descriptions à enrichir** :

```typescript
intact: {
  fr: 'Grille de ventilation standard. Les vis sont oxydées — '
    + 'le conduit derrière semble assez large pour s\'y faufiler. '
    + 'Un courant d\'air froid en sort — il mène quelque part de l\'autre côté de la cloison. '
    + 'Une alternative au point de contrôle de sécurité, pour ceux qui n\'ont pas peur '
    + 'des espaces confinés.',
  en: 'Standard vent cover. Oxidized screws — the duct behind looks wide enough to crawl through. '
    + 'Cold air flows from it — leads past the bulkhead.',
},
open: {
  fr: 'La grille de ventilation est ouverte. Le conduit s\'enfonce dans l\'obscurité — '
    + 'étroit, poussiéreux, mais praticable. Des traces de griffures marquent les parois '
    + 'du conduit. Vous n\'êtes pas le premier à passer par là. '
    + 'Le passage mène de l\'autre côté de la cloison blindée.',
  en: 'Vent cover removed. The duct stretches into darkness — narrow, dusty, but passable. '
    + 'Scratch marks on the duct walls. You\'re not the first to come through here.',
},
```

---

## 🟡 SECTION 1B — Flags orphelins

### 11. Flags de tracking inutilisés

| Flag | Set par | Consommé par | Verdict |
|------|---------|-------------|---------|
| `terminal_read` | status_terminal READ | **RIEN** | 🟡 Orphelin |
| `ship_map_found` | status_terminal REPAIR | **RIEN** | 🟡 Orphelin |
| `oracle_revealed` | captain_terminal READ/HACK | **RIEN** | 🔴 Devrait impacter le boss |

**Problème** : Ces flags sont "tracking narratif" mais n'ont AUCUN impact mécanique. C'est du gaspillage. Le plus grave est `oracle_revealed` — le joueur a découvert la vérité sur Projet ORACLE mais cette connaissance ne change rien au boss fight.

**Fix proposé** :

#### `oracle_revealed` → Impact narratif au boss

Ajouter une interaction TALK sur la créature quand le joueur connaît la vérité :

```typescript
// creature_oracle NPC — AJOUTER interaction scénario
// Quand le joueur sait que c'est une arme bio (oracle_revealed), 
// la tentative de communication est plus informée
// → Pas de nouvelle feature, mais le flag devrait modifier 
// la narrative du TALK réussi (variation narrative)
```

**Note** : Le système de TALK NPC actuel ne supporte pas les flags conditionnels. Ce fix nécessite soit une extension du système NPC, soit un contournement via une feature proxy. **Documenter comme amélioration future.**

#### `ship_map_found` → Devrait faciliter la navigation

Le joueur a un plan du vaisseau. Ce flag devrait ajouter un bonus de clarté aux descriptions de navigation. Pas d'impact mécanique immédiat, mais devrait être mentionné dans la narration de déplacement. **Documenter comme amélioration future.**

---

## 🔴 SECTION 2 — CoreSkeleton : Métadonnées narratives

### 12. `descriptionKey` du scénario — Trop court, pas d'objectif clair

**Actuel** :
```typescript
descriptionKey: {
  fr: 'Réveillez-vous seul dans les ruines d\'un vaisseau mourant. Les alarmes hurlent. L\'éclairage de secours rougeoie. Survivez. Fuyez.',
},
```

**Correction** :
```typescript
descriptionKey: {
  fr: 'Vous vous réveillez seul dans les entrailles d\'un vaisseau-cargo en dérive, l\'USS Meridian. '
    + 'Votre capsule cryogénique s\'est ouverte d\'urgence — les 46 autres sont mortes depuis 6 mois. '
    + 'Les alarmes hurlent. L\'éclairage de secours peint les couloirs en rouge sang. '
    + 'Quelque chose rôde dans les sections abandonnées — quelque chose qui a tué tout l\'équipage. '
    + 'Trouvez un moyen d\'atteindre les pods d\'évasion. Fuyez. Ne regardez pas en arrière.',
  en: 'You wake alone in a drifting cargo ship, the USS Meridian. '
    + 'Your cryopod opened on emergency — the other 46 have been dead for 6 months. '
    + 'Something roams the abandoned sections. Reach the escape pods. Run.',
},
```

### 13. `revelation` — Trop factuel, pas de choc émotionnel

**Actuel** :
```typescript
revelation: {
  fr: 'La créature est une arme bio-expérimentale — Projet ORACLE. L\'équipage a tenté de la confiner. Échec. Vous êtes le seul survivant.',
},
```

**Correction** :
```typescript
revelation: {
  fr: 'La créature qui rôde dans le vaisseau n\'est pas un accident. '
    + 'Projet ORACLE — programme d\'armement biologique classifié du Commandement Spatial. '
    + 'Le "Spécimen Alpha" a été délibérément embarqué à bord de l\'USS Meridian '
    + 'pour un test d\'adaptation en environnement confiné. L\'équipage de 47 personnes '
    + 'servait de cobayes involontaires. Le Dr. Nakamura savait. Le Commandement savait. '
    + 'Quand le spécimen a franchi le confinement, le Capitaine Reeves a compris — trop tard. '
    + 'Il a scellé les sections, sacrifié les équipes piégées, '
    + 'et laissé son journal comme dernier témoignage. '
    + 'Vous n\'êtes pas un survivant par chance. Vous êtes le dernier sujet de test.',
  en: 'The creature is no accident. Project ORACLE — classified bioweapons program. '
    + 'Specimen Alpha was deliberately placed aboard the USS Meridian for a confined-environment adaptation test. '
    + 'The crew of 47 were unwitting test subjects. You are the last one.',
},
```

### 14. `escalationTrigger` — Trop court, manque d'urgence concrète

**Actuel** :
```typescript
escalationTrigger: {
  fr: 'La créature a saboté le support vie. L\'O₂ chute dans tout le vaisseau. L\'éclairage s\'éteint par sections.',
},
```

**Correction** :
```typescript
escalationTrigger: {
  fr: 'La créature a appris. Ce n\'est plus un prédateur aveugle — c\'est un chasseur stratégique. '
    + 'Elle a ciblé le système de support vie : les câbles d\'alimentation arrachés '
    + 'avec une précision chirurgicale. L\'O₂ chute dans tout le vaisseau — 3% par minute. '
    + 'L\'éclairage meurt section par section, plongeant les couloirs dans un noir absolu. '
    + 'Votre lampe torche est désormais votre meilleur ami. '
    + 'Il reste peut-être 20 minutes d\'air respirable. '
    + 'Les pods d\'évasion sont au pont inférieur. La créature le sait aussi.',
  en: 'The creature has learned. It targeted life support — cables torn with surgical precision. '
    + 'O₂ drops 3% per minute. Lighting dies section by section. Maybe 20 minutes of breathable air left. '
    + 'The escape pods are on the lower deck. The creature knows it too.',
},
```

### 15. `emergentVictoryHint` — Trop cryptique

**Actuel** :
```typescript
emergentVictoryHint: {
  fr: 'La soute peut être éjectée dans le vide. Si la créature est dedans...',
},
```

**Correction** :
```typescript
emergentVictoryHint: {
  fr: 'La soute possède un système de largage d\'urgence — un levier mécanique, '
    + 'pas de l\'électronique. Mais il y a aussi le panneau de contrôle des joints de coque : '
    + 'forcer une décompression localisée est possible si vous savez pirater le système. '
    + 'Dans les deux cas, si la créature est dans la soute au moment de la manœuvre... '
    + 'le vide spatial ne fait pas de prisonniers.',
  en: 'The cargo bay has both a mechanical jettison lever and a hull breach control panel. '
    + 'If the creature is in the bay when either activates... '
    + 'the void of space takes no prisoners.',
},
```

### 16. Node `descriptionKey` — Tous les nœuds trop courts

```typescript
nodes: [
  {
    id: 'start',
    role: 'entry',
    beat: 'intro',
    tension: 2,
    descriptionKey: {
      fr: 'Baie des Capsules Cryogéniques — Vous ouvrez les yeux. Froid mordant. Obscurité presque totale. '
        + 'Le couvercle de votre capsule est ouvert — éjection d\'urgence. '
        + 'Autour de vous, 46 autres capsules. Silencieuses. Leurs voyants sont morts depuis longtemps. '
        + 'L\'éclairage de secours rougeoie faiblement. Un terminal de statut clignote contre le mur, '
        + 'et un casier d\'urgence attend dans l\'ombre. '
        + 'Vous êtes seul. Et quelque chose a coupé le courant il y a 4 heures.',
      en: 'Cryopod Bay — You open your eyes. Biting cold. Near-total darkness. '
        + '46 other pods, all dead. Emergency lighting glows faintly. '
        + 'A status terminal flickers. An emergency locker waits in the shadows.',
    },
  },
  {
    id: 'unlock',
    role: 'gate',
    beat: 'rising',
    tension: 4,
    descriptionKey: {
      fr: 'Point de Contrôle de Sécurité — Une cloison blindée barre le couloir, '
        + 'épaisse comme un coffre-fort. Le panneau de sécurité adjacent exige un badge de niveau 3. '
        + 'Des griffures profondes marquent le métal — quelque chose a tenté de forcer le passage '
        + 'depuis l\'autre côté. Sans succès. Ou avec succès, justement — impossible de savoir. '
        + 'Une grille de ventilation au plafond offre peut-être une alternative '
        + 'pour ceux qui n\'ont pas peur du noir et des espaces confinés.',
      en: 'Security Checkpoint — An armored bulkhead blocks the corridor. Badge reader demands level 3+. '
        + 'Deep scratches on the metal from the other side. '
        + 'A ceiling vent might offer an alternative route.',
    },
  },
  {
    id: 'reveal',
    role: 'midpoint',
    beat: 'midpoint',
    tension: 6,
    descriptionKey: {
      fr: 'Quartiers du Capitaine — Le bureau personnel du Capitaine Reeves. '
        + 'Des papiers froissés jonchent le sol. Le terminal personnel est encore allumé — '
        + 'les dernières entrées de journal clignotent à l\'écran. '
        + 'Un datapad repose sur le bureau, séparé du terminal, comme s\'il avait été posé là '
        + 'délibérément pour que quelqu\'un le trouve. '
        + 'Le hublot d\'observation montre l\'extérieur : le vaisseau dérive, des sections entières '
        + 'arrachées et exposées au vide. L\'USS Meridian est en train de mourir.',
      en: 'Captain\'s Quarters — Captain Reeves\' office. Crumpled papers on the floor. '
        + 'Personal terminal still on. A datapad on the desk, deliberately placed. '
        + 'Through the viewport: the ship drifts, sections torn away.',
    },
  },
  {
    id: 'escalation',
    role: 'escalation',
    beat: 'escalation',
    tension: 8,
    descriptionKey: {
      fr: 'Centre de Survie — L\'air est rare. Chaque respiration compte. '
        + 'Le panneau de support vie est en miettes — griffures profondes, câbles arrachés. '
        + 'La créature est venue ici en premier. Elle savait ce qu\'elle faisait. '
        + 'Un casier de combinaison EVA est verrouillé contre le mur — '
        + 'la seule protection contre l\'asphyxie progressive. '
        + 'La valve de reroutage O₂ et le conduit d\'énergie principal offrent '
        + 'des options de survie pour ceux qui savent improviser. '
        + 'Le passage vers le pont inférieur est droit devant. Chaque seconde ici vous coûte de l\'air.',
      en: 'Life Support Hub — Air is thin. The life support panel is shredded. '
        + 'An EVA suit locker, an O₂ valve, a power conduit — survival options for those who improvise. '
        + 'The lower deck is straight ahead. Every second here costs air.',
    },
  },
  {
    id: 'boss',
    role: 'climax',
    beat: 'climax',
    tension: 10,
    descriptionKey: {
      fr: 'Soute / Pont des Pods — L\'air est presque irrespirable. '
        + 'L\'écoutille du pod d\'évasion est là, à portée de main — mais un lecteur de badge '
        + 'contrôle l\'accès. Et entre vous et la sortie : la créature. '
        + 'Le Spécimen Alpha, Projet ORACLE. Biomasse noire, griffes d\'acier organique, '
        + 'et une intelligence terrifiante dans ses yeux trop humains. '
        + 'Le levier de largage cargo est à votre gauche. '
        + 'Le panneau de contrôle des joints de coque est à votre droite. '
        + 'Le pod est droit devant. C\'est elle ou vous.',
      en: 'Cargo Bay / Pod Deck — Air nearly gone. The escape pod hatch is right there — '
        + 'but a badge reader controls access. And between you and the exit: the creature. '
        + 'Jettison lever on the left. Hull breach panel on the right. Pod straight ahead.',
    },
  },
  {
    id: 'resolution',
    role: 'epilogue',
    beat: 'resolution',
    tension: 3,
    descriptionKey: {
      fr: 'Pod d\'Évasion — Le sas se referme derrière vous. Le silence. '
        + 'Pas le silence de la mort — le silence de la sécurité. '
        + 'Le pod s\'éjecte avec un souffle pneumatique. '
        + 'Depuis le hublot, vous regardez l\'USS Meridian rapetisser dans l\'obscurité — '
        + 'un point de lumière avalé par le noir de l\'espace. '
        + 'Quelque part là-dedans, le Spécimen Alpha attend le prochain visiteur. '
        + 'Mais pas vous. Plus jamais vous.',
      en: 'Escape Pod — The airlock seals behind you. Silence — not death\'s silence, safety\'s silence. '
        + 'Through the porthole, the USS Meridian shrinks into darkness.',
    },
  },
],
```

---

## 🔴 SECTION 3 — Analyse d'équilibrage du Boss node

### Inventaire complet des chemins

#### Features du boss node :

**`escape_pod_hatch`** (progression principale) :

| # | Chemin | Stat | DC | Prérequis |
|---|--------|------|----|-----------|
| A | USE keycard (via useOn) | — | auto | item: access_keycard |
| B | HACK | INT | 14 | — |
| C | FORCE_OPEN | FOR | 16 | — (2 dmg) |
| D | OPEN avec flag | — | auto | flag: pod_hatch_open |

**`cargo_jettison_lever`** (victoire alternative) :

| # | Chemin | Stat | DC | Prérequis |
|---|--------|------|----|-----------|
| E | PULL | FOR | 10 | — |

**`hull_breach_panel`** (victoire émergente) :

| # | Chemin | Stat | DC | Prérequis |
|---|--------|------|----|-----------|
| F | HACK | INT | 15 | — |
| G | BREAK | FOR | 13 | — (2 dmg) |

### 🔴 Problème 1 : `cargo_jettison_lever` n'a qu'UN chemin (FOR DC 10)

Le levier mécanique est la victoire alternative, mais il n'est accessible qu'à FOR. Un personnage INT/CHA pur ne peut pas l'actionner autrement.

**Fix** : Ajouter des chemins alternatifs :

```typescript
// cargo_jettison_lever — AJOUTER chemin INT
{
  trigger: {
    verb: ['HACK', 'BYPASS', 'REWIRE'],
    requiredState: 'intact',
    stat: 'INT',
    dc: 12,
  },
  onSuccess: {
    newState: 'activated',
    narrative: {
      fr: 'Le levier est mécanique, mais le cache de sécurité est électronique. '
        + 'Vous court-circuitez le verrouillage du cache — il saute. '
        + 'Ensuite, le levier tombe presque tout seul. '
        + 'Les portes de la soute s\'ouvrent sur le vide. '
        + 'La créature hurle — puis le silence.',
      en: 'The lever is mechanical, but the safety cover is electronic. '
        + 'You bypass the cover lock. The lever falls almost by itself.',
    },
    flagSet: 'cargo_jettisoned',
  },
  onFailure: {
    narrative: {
      fr: 'Le verrouillage du cache résiste à votre manipulation. '
        + 'Le mécanisme de sécurité est plus robuste que prévu.',
      en: 'The cover lock resists your attempt.',
    },
  },
},
```

### 🔴 Problème 2 : Aucun chemin CHA dans le boss node

| Stat | Chemins boss node | Verdict |
|------|-------------------|---------|
| INT | HACK hatch DC14, HACK breach DC15, (proposed: HACK lever DC12) | ✅ Bon |
| FOR | FORCE hatch DC16, PULL lever DC10, BREAK breach DC13 | ✅ Excellent |
| CHA | **AUCUN** | 🔴 Manque |
| PER | **AUCUN** | 🔴 Manque |

La créature a TALK success/failure comme NPC, mais aucun impact mécanique. Le CHA est invisible dans le boss.

#### Fix CHA : Distraire la créature (feature interaction ou NPC interaction)

Le plus logique : le joueur peut PARLER à la créature pour créer une ouverture.

```typescript
// Ajouter au NPC creature_oracle (si le système le supporte)
// OU créer une interaction sur escape_pod_hatch :
{
  trigger: {
    verb: 'TALK',
    requiredState: 'locked',
    stat: 'CHA',
    dc: 14,
  },
  onSuccess: {
    narrative: {
      fr: 'Vous parlez. Pas des mots — des sons. Graves, réguliers, comme un battement de cœur. '
        + 'La créature s\'immobilise. Ses yeux trop humains vous fixent avec une curiosité '
        + 'terrifiante. Un instant de flottement — puis elle recule d\'un pas. '
        + 'Juste assez pour que vous atteigniez l\'écoutille. '
        + 'Elle ne vous laisse pas partir — elle vous observe partir.',
      en: 'You speak. Not words — sounds. Low, rhythmic, like a heartbeat. '
        + 'The creature freezes. Its too-human eyes watch with terrifying curiosity. '
        + 'It steps back — just enough for you to reach the hatch.',
    },
    flagSet: 'creature_distracted',
  },
  onFailure: {
    narrative: {
      fr: 'La créature siffle et avance d\'un pas. Votre voix ne fait que l\'agiter. '
        + 'Communiquer avec une arme biologique programmée pour tuer — '
        + 'mauvaise idée, en fin de compte.',
      en: 'The creature hisses and advances. Your voice only agitates it.',
    },
    consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
  },
},
```

**Note** : Le flag `creature_distracted` devrait donner un bonus au prochain jet sur escape_pod_hatch (DC réduit). Mais le système actuel ne supporte pas les bonus conditionnels aux DC. **Alternative** : Ajouter une interaction OPEN sur escape_pod_hatch avec `requiredFlag: 'creature_distracted'` et DC réduit :

```typescript
// escape_pod_hatch — AJOUTER chemin avec créature distraite
{
  trigger: {
    verb: ['OPEN', 'HACK', 'ACTIVATE'],
    requiredState: 'locked',
    requiredFlag: 'creature_distracted',
    stat: 'INT',
    dc: 8, // DC réduit car la créature n'interfère plus
  },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: 'La créature vous observe, immobile. Vos doigts tremblent sur le lecteur — '
        + 'mais cette fois, pas d\'interférence. Le firmware cède. L\'écoutille s\'ouvre. '
        + 'Vous ne regardez pas la créature en entrant dans le pod.',
      en: 'The creature watches, motionless. Your fingers tremble on the reader — '
        + 'but this time, no interference. The hatch opens.',
    },
    flagSet: 'pod_hatch_open',
    revealsExit: 'resolution',
  },
},
```

#### Fix PER : Repérer une faiblesse structurelle dans le boss node

```typescript
// escape_pod_hatch — AJOUTER chemin PER (repérer bypass)
{
  trigger: {
    verb: 'EXAMINE',
    requiredState: 'locked',
    stat: 'PER',
    dc: 12,
  },
  onSuccess: {
    narrative: {
      fr: 'En examinant l\'écoutille de près, vous remarquez que le panneau de maintenance latéral '
        + 'n\'est pas soudé — juste clipsé. Derrière, les câbles du mécanisme de verrouillage '
        + 'sont accessibles. Un court-circuit bien placé suffirait.',
      en: 'The side maintenance panel isn\'t welded — just clipped. '
        + 'Behind it, the locking mechanism cables are accessible.',
    },
    flagSet: 'hatch_bypass_found',
  },
},
// escape_pod_hatch — AJOUTER OPEN avec bypass trouvé
{
  trigger: {
    verb: ['OPEN', 'HACK', 'BYPASS'],
    requiredState: 'locked',
    requiredFlag: 'hatch_bypass_found',
    stat: 'INT',
    dc: 6, // Très facile une fois le bypass repéré
  },
  onSuccess: {
    newState: 'open',
    narrative: {
      fr: 'Le panneau de maintenance se déclipse. Deux fils, un court-circuit — '
        + 'l\'écoutille s\'ouvre en silence. Pas besoin de badge quand on sait regarder.',
      en: 'Maintenance panel unclips. Two wires, one short — the hatch opens silently.',
    },
    flagSet: 'pod_hatch_open',
    revealsExit: 'resolution',
  },
},
```

**Nouveau flag nécessaire** : `hatch_bypass_found`, `creature_distracted` → à ajouter dans `KNOWN_FLAGS` du test.

### 🟡 Problème 3 : `hull_breach_panel` HACK et BREAK n'ont pas d'onFailure avec conséquences

**Actuel** : Le HACK DC15 a un onFailure avec des conséquences (2 dégâts + court-circuit) mais le BREAK DC13 a un onFailure sans conséquences ("le panneau résiste").

**Fix** — Ajouter des conséquences au BREAK :

```typescript
onFailure: {
  narrative: {
    fr: 'Le panneau résiste à vos coups. Un fragment de métal se détache et vous entaille le bras. '
      + 'Le boîtier est plus renforcé qu\'il n\'y paraît.',
    en: 'The panel withstands your blows. A metal fragment cuts your arm.',
  },
  consequences: [{ type: 'damage', targetId: 'player', amount: 1 }],
},
```

### 🟡 Problème 4 : Victoire alternative vs émergente — confusion narrative

**Actuel** :
- `cargo_jettison_lever` PULL → flag `cargo_jettisoned` → victoire `environmental_kill` (alternative)
- `hull_breach_panel` HACK/BREAK → flag `cargo_depressurized` → victoire émergente

Les deux font essentiellement la même chose (vider la soute) mais l'un est "alternatif" et l'autre "émergent". La distinction est correcte mécaniquement (le levier est le chemin documenté, le panneau est le chemin non-documenté) mais les narratives pourraient mieux les différencier.

**Fix narratif pour hull_breach_panel** — la décompression est plus lente, plus dangereuse :

```typescript
// hull_breach_panel HACK onSuccess — narrative enrichie
{
  fr: 'Le protocole de brèche s\'active — les joints de coque de la soute se fissurent volontairement. '
    + 'Ce n\'est pas une éjection franche comme le levier — c\'est une hémorragie lente. '
    + 'L\'air s\'échappe, la pression chute. Vous sentez vos oreilles se boucher. '
    + 'La créature hurle — un son presque humain — avant d\'être aspirée centimètre par centimètre '
    + 'vers la brèche. Ça prend plus longtemps. C\'est pire.',
  en: 'Hull breach protocol activates — a slow hemorrhage, not a clean ejection.',
},
```

### 📊 Résumé : Boss escape après corrections

```
                    ┌─────────────────┐
                    │ creature_oracle  │
                    │   (NPC hostile)  │
                    └────────┬────────┘
                             │
                     TALK CHA DC14
                     → creature_distracted
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────┴────┐        ┌─────┴─────┐       ┌──────┴──────┐
   │ Keycard │        │ Distracted│       │  Direct     │
   │  (auto) │        │ DC réduit │       │ HACK DC14   │
   └────┬────┘        └─────┬─────┘       │ FORCE DC16  │
        │                    │             │ PER→bypass  │
        ▼                    ▼             └──────┬──────┘
   ┌──────────────────────────────────────────────┤
   │            escape_pod_hatch                   │
   │                 → pod                         │
   └──────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────┐
   │  ALTERNATIVES (créature dans la soute)        │
   │                                               │
   │  cargo_jettison_lever    hull_breach_panel    │
   │    PULL FOR DC10           HACK INT DC15      │
   │    HACK INT DC12           BREAK FOR DC13     │
   │    → éjection franche      → décompression    │
   └──────────────────────────────────────────────┘
```

**Chemins par classe après fix :**

| Classe | Stat | Chemin boss principal | Chemins alternatifs |
|--------|------|----------------------|---------------------|
| Marine | FOR | FORCE hatch DC16, PULL lever DC10, BREAK panel DC13 | 3 chemins FOR directs |
| Engineer | INT | HACK hatch DC14, HACK lever DC12, HACK panel DC15 | 3 chemins INT directs |
| Medic | CHA | TALK creature → distraction → hatch DC8 réduit | 1 chemin CHA→INT combo |
| Tout | PER+INT | EXAMINE hatch → bypass → DC6 | 1 chemin PER→INT combo |
| Tout | Item | Keycard → hatch auto | Chemin universel exploration |

---

## 📋 Tableau récapitulatif des modifications

| # | Objet | Type de modif | Priorité |
|---|-------|--------------|----------|
| 1 | `status_terminal` | Réécrire `active`, AJOUTER `readableContent`, AJOUTER interaction READ active | 🔴 Critique |
| 2 | `captain_terminal` | AJOUTER `readableContent`, AJOUTER READ pour `searched`, enrichir `active`/`searched` descriptions | 🔴 Critique |
| 3 | `life_support_panel` | Enrichir `repaired`, AJOUTER HACK INT DC12, AJOUTER FORCE FOR DC13 | 🔴 Critique |
| 4 | `emergency_locker` | Enrichir descriptions `open`/`empty` | 🟡 Important |
| 5 | `EVA_suit_locker` | Enrichir descriptions `open`/`empty` | 🟡 Important |
| 6 | `power_conduit` | Enrichir description `broken` | 🟡 Important |
| 7 | `hull_breach_panel` | Enrichir description `activated`, ajouter onFailure BREAK conséquences | 🟡 Important |
| 8 | `bulkhead_door` | Enrichir descriptions `locked`/`open` | 🟡 Important |
| 9 | `vent_cover` | 🔴 CLIMB ne déplace pas le joueur + enrichir descriptions `intact`/`open` | 🔴 Critique |
| 10 | `CoreSkeleton.descriptionKey` | Réécrire avec nom du vaisseau + contexte complet | 🔴 Critique |
| 11 | `CoreSkeleton.revelation` | Réécrire en texte long avec Projet ORACLE détaillé | 🔴 Critique |
| 12 | `CoreSkeleton.escalationTrigger` | Réécrire avec chiffres concrets (3%/min, 20 min) | 🔴 Critique |
| 13 | `CoreSkeleton.emergentVictoryHint` | Réécrire avec description des deux options (levier + panneau) | 🟡 Important |
| 14 | `CoreSkeleton.nodes[*].descriptionKey` | Réécrire les 6 descriptions de nœuds (4-6 phrases) | 🔴 Critique |
| 15 | `cargo_jettison_lever` | AJOUTER chemin HACK INT DC12 | 🔴 Critique |
| 16 | `escape_pod_hatch` | AJOUTER TALK CHA DC14 → distraction, AJOUTER EXAMINE PER DC12 → bypass, AJOUTER OPEN avec bypass DC6 | 🔴 Critique |
| 17 | `hull_breach_panel` | Enrichir narrative HACK succès (différencier de l'éjection) | 🟡 Important |

### Nouvelles interactions à créer :
- `status_terminal` : READ (requiredState: active)
- `captain_terminal` : READ (requiredState: searched)
- `life_support_panel` : HACK INT DC12, FORCE FOR DC13
- `cargo_jettison_lever` : HACK INT DC12
- `escape_pod_hatch` : TALK CHA DC14 → creature_distracted, OPEN avec creature_distracted DC8, EXAMINE PER DC12 → hatch_bypass_found, OPEN avec hatch_bypass_found DC6
- `vent_cover` : RÉÉCRIRE CLIMB pour ajouter `movesPlayerTo: 'reveal'` (ou supprimer si moteur ne supporte pas)

### Modification moteur potentielle :
- **`movesPlayerTo`** dans `onSuccess` des interactions scénario — si le champ n'existe pas dans le type `InteractionOutcome`, il faut l'ajouter et le câbler dans `processTurn`. Alternative : supprimer l'interaction CLIMB de vent_cover et laisser le joueur se déplacer via la commande de mouvement standard après `revealsExit`.

### Nouveaux flags nécessaires :
- `creature_distracted` — CHA réussie sur la créature → réduit DC hatch
- `hatch_bypass_found` — PER repère le bypass maintenance → réduit DC hatch
- Ajouter à `KNOWN_FLAGS` dans `escapeEnriched.test.ts`

### Flags existants réutilisés :
- `terminal_read`, `ship_map_found` — restent tracking (amélioration future : impact narratif)
- `oracle_revealed` — reste tracking (amélioration future : impact NPC TALK)
- `bulkhead_unlocked`, `o2_stabilized`, `sections_sealed`, `pod_hatch_open`, `cargo_jettisoned`, `cargo_depressurized` — inchangés

### Modifications de tests nécessaires :
- `escapeEnriched.test.ts` : Ajouter `creature_distracted` et `hatch_bypass_found` à `KNOWN_FLAGS`
- Vérifier count interactions `escape_pod_hatch` ≥ 7 (3 existants + 4 nouveaux)
- Vérifier count interactions `cargo_jettison_lever` ≥ 2 (1 existant + 1 nouveau)
- Vérifier count interactions `life_support_panel` ≥ 3 (1 existant + 2 nouveaux)

---

## 🎯 PRINCIPES DIRECTEURS

> **Chaque description doit répondre à : "Qu'est-ce que je vois ? Qu'est-ce que ça signifie ? Qu'est-ce que je peux faire ?"**

> **L'identité d'ESCAPE est physique** : la survie passe par le corps. FOR domine, mais chaque classe doit avoir un chemin viable. Le badge d'accès est le filet de sécurité universel pour l'exploration. CHA et PER passent par des chemins combo (découverte → action facilitée).

> **La créature est un chasseur intelligent, pas un monstre générique** : Projet ORACLE a créé quelque chose de plus terrifiant qu'un animal — quelque chose qui apprend, observe, et cible les systèmes critiques. Les descriptions doivent refléter cette intelligence terrifiante.

> **L'USS Meridian est un personnage** : Le vaisseau en dérive a une présence — le silence, le froid, les griffures sur le métal. Chaque description de nœud doit contribuer au sentiment de claustrophobie et d'isolement.
