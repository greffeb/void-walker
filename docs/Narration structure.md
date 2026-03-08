
# Restructuration narration

Le schéma actuel de narration offre un texte parfois désorganisé et dur à lire. Le but de ce document est de réorganiser l'ordre des éléments de narration pour le rendre plus naturel à lire en français.

## 1 Old Structure

### 1.1 intro

#### 1.1.1 intro location

| Description | Exemple |
| --- | --- |
| texte | Vous reprenez conscience dans |
| article + nom du lieu | le Couloir d'Accès Principal |
| texte | . |
| description du lieu | L'air est vicié, une lumière rouge clignote au plafond. |

#### 1.1.2 features

| Description | Exemple |
| --- | --- |
| texte | Vous voyez autour de vous |
| article feature₁ | un terminal de sécurité |
| texte | , |
| article feature₂ | une porte verrouillée |
| texte | ainsi que |
| article feature₂ | un conduit de ventilation |
| texte | . |

#### 1.1.3 Items

| Description | Exemple |
| --- | --- |
| texte | Parmi les débris, vous remarquez |
| article item₁ | un couteau |
| texte | ainsi que |
| article item₂ | une trousse médicale |
| texte | . |

#### 1.1.4 NPC

| Description | Exemple |
| --- | --- |
| texte | Vous apercevez |
| nom NPC₁ | un android defectueux |
| texte | ainsi que |
| nom NPC₂ | un membre de l'équipage |
| texte | . |

#### 1.1.4 Sorties (non explorées)

| Description | Exemple |
| --- | --- |
| texte | Vous distinguez une sortie vers |
| nom sortie₁ | la salle de contrôle |
| texte | , |
| nom sortie₂ | le tunnel de maintenance |
| texte | . |

#### 1.1.5 Sorties (déjà visitées)

| Description | Exemple |
| --- | --- |
| texte | Chemin connu vers |
| nom sortie₁ | la salle de contrôle |
| texte | . |

#### 1.1.6 Obstacle (conditionnel)

| Description | Exemple |
| --- | --- |
| Texte en italique/warning | description de l'obstacle bloquant |

#### 1.1.7 Prompt

| Description | Exemple |
| --- | --- |
| Texte | Que faites-vous ? |

### 1.2 ENTRÉE DANS UNE NOUVELLE PIÈCE (enter)

Structure identique mais l'intro change :

| Description | Exemple |
| --- | --- |
| texte | Vous pénétrez dans |
| article + nom du lieu | la salle de contrôle |
| texte | . |

### 1.3 RETOUR DANS UNE PIÈCE DÉJÀ VISITÉE (revisit)

Structure identique mais l'intro change :

| Description | Exemple |
| --- | --- |
| texte | Vous revenez dans |
| article + nom du lieu | la salle de contrôle |
| texte | . |

### 1.4 TEXTE AFFICHÉ APRÈS UNE ACTION (le cœur du système)

| # | Layer | Description | Exemple (FR) | Condition d'apparition |
| --- | ------- | ------------- | -------------- | ------------------------ |
| 1 | **Action Result** | Le résultat direct de l'action du joueur — ce qui s'est passé | "Vos doigts dansent sur le clavier holographique. Les pare-feu tombent un par un — accès accordé." | Toujours présent (100%) |
| 2 | **Sensory Detail** | Détail sensoriel qui ajoute de la texture (son, lumière, odeur, toucher) | "L'écran projette une lueur bleutée sur votre visage, seule source de lumière dans cette salle." | 90% si jet de dé, 50% si auto-succès |
| 3 | **Consequence** | Ce qui change concrètement dans le monde après l'action | "Les données du journal de bord s'affichent. Ce que vous lisez vous glace le sang." | Seulement si un changement d'état a eu lieu (porte ouverte, PV perdus, item obtenu, etc.) |
| 4a | **Atmosphere** | Ambiance environnementale liée au setting et à la tension | "Derrière le mur, les moteurs grondent comme un animal blessé." | Probabilité variable (30–95% selon tension et beat). Divisée par 2 après 4 tours dans la même pièce. Reset si l'environnement change (feu, dépressurisation, NPC entre/sort…) |
| 4b | **Gameplay Hint** | Remplace l'atmosphère — observation subtile pointant vers un élément interactif, jamais un ordre direct | "Un datapad repose sur la console, son écran encore allumé." | Remplace 4a à partir du tour 4+ dans la même pièce. Priorité aux objets liés à la quête |
| 5 | **Player State** | État physique ou mental du personnage | "Votre vision se trouble par moments." | Seulement si PV < 30% ou si une condition est active (wounded, poisoned, terrified…) |
| 6 | **Threat Hint** | Indice de menace envoyé par le threat director pour le pacing horreur | "Quelque chose gratte contre la coque, juste de l'autre côté." | Conditionnel — déclenché par le beat narratif (intro, rising, midpoint, escalation, climax) |
| 7 | **NPC Reaction** | Réaction d'un PNJ présent qui observe l'action du joueur | "« Impressionnant », murmure Kira." (allié, succès critique) / "{npc_name} émet un son qui ressemble à un rire." (hostile, échec) | Seulement si un NPC est présent dans la pièce |

## Assemblage final

Les layers sélectionnées sont jointes par un simple espace (`parts.join(' ')`) en un seul bloc de texte continu. Le nombre de layers affichées dépend du preset narratif :

| Preset | Layers max | Comportement |
| -------- | ----------- | -------------- |
| **Concise** | 3 | Action + les 2 layers optionnelles les mieux scorées |
| **Standard** | 5 | Action + top 4 — la plupart des tours sont complets |
| **Immersive** | 7 | Toutes les layers se déclenchent si leur probabilité passe |

Quand le budget est limité (concise/standard), les layers sont classées par score de pertinence contextuelle. Les premières à sauter sont généralement NPC Reaction et Atmosphere ; les dernières à sauter sont Consequence et Player State.

## 2 New Desired structure

### 2.1 intro (**noeud entry**)

#### 2.1.1 intro scenario

| Description | Exemple | note |
| --- | --- | ---- |  
| texte | Vous vous réveillez seul dans les entrailles d'un vaisseau-cargo en dérive, l'USS Meridian. Votre capsule cryogénique s'est ouverte d'urgence — les 46 autres sont mortes depuis 6 mois.Les alarmes hurlent. L'éclairage de secours peint les couloirs en rouge sang.Quelque chose rôde dans les sections abandonnées — quelque chose qui a tué tout l'équipage. Trouvez un moyen d'atteindre les pods d'évasion. Fuyez. Ne regardez pas en arrière. | core skeleton description key |

#### 2.1.2 intro location

| Description | Exemple | note |
| --- | --- | --- |
| texte | Baie des Capsules Cryogéniques — Vous ouvrez les yeux. Froid mordant. Obscurité presque totale. Le couvercle de votre capsule est ouvert — éjection d'urgence. Autour de vous, 46 autres capsules. Silencieuses. Leurs voyants sont morts depuis longtemps. L'éclairage de secours rougeoie faiblement. | skeleton **entry** description key |

#### 2.1.3 Obstacle (conditionnel)

| Description | Exemple | note |
| --- | --- | --- |
| Texte en italique/warning | une énorme porte blindée vous bloque le passage | **Obstacle du scénario** |

#### 2.1.4 features

| Description | Exemple | note |
| --- | --- | --- |
| texte | Vous voyez autour de vous | - |
| article feature₁ | un terminal de sécurité | **features du scénario** |
| texte | , | - |
| article feature₂ | une porte verrouillée | **features du scénario** |
| texte | ainsi que | - |
| article feature₂ | un conduit de ventilation | **features du scénario** |
| texte | . | - |

#### 2.1.5 Items

| Description | Exemple | note |
| --- | --- | --- |
| texte | Parmi les débris, vous remarquez | - |
| article item₁ | un couteau | **items du scénario** |
| texte | ainsi que | - |
| article item₂ | une trousse médicale | **items du scénario** |
| texte | . | - |

#### 2.1.6 NPC

| Description | Exemple | note |
| --- | --- | --- |
| texte | Vous apercevez |
| nom NPC₁ | un android defectueux | **NPCs du scénario** |
| texte | ainsi que |
| nom NPC₂ | un membre de l'équipage | **NPCs du scénario** |
| texte | . | - |

#### 2.1.7 Sorties (non explorées) (on affiche sauf si un obstacle cache la sortie)

| Description | Exemple | note |
| --- | --- | --- |
| texte | Vous distinguez une sortie vers | - |
| nom sortie₁ | la salle de contrôle | sortie adjacente, scénario ou module |
| texte | , | - |
| nom sortie₂ | le tunnel de maintenance | sortie adjacente, scénario ou module |
| texte | . | - |

#### 2.1.8 Sorties (déjà visitées)

| Description | Exemple | note |
| --- | --- | --- |
| texte | Chemin connu vers | - |
| nom sortie₁ | la salle de contrôle | sortie adjacente, scénario ou module |
| texte | . | - |

#### 2.1.9 Prompt

| Description | Exemple | note |
| --- | --- | --- |
| Texte | Que faites-vous ? | - |

### 2.2 ENTRÉE DANS UN noeud de scénario (enter)

| Description | Exemple | note |
| --- | --- | --- |
| texte | Point de Contrôle de Sécurité — Une cloison blindée barre le couloir,épaisse comme un coffre-fort. Le panneau de sécurité adjacent exige un badge de niveau 3. Des griffures profondes marquent le métal — quelque chose a tenté de forcer le passage depuis l'autre côté. Sans succès. Ou avec succès, justement — impossible de savoir. Une grille de ventilation au plafond offre peut-être une alternative pour ceux qui n\'ont pas peur du noir et des espaces confinés.' | skeleton **role** description key |

puis on affiche le reste de la description de la pièce (features, items, NPCs, sorties) pour rafraîchir la mémoire du joueur et lui rappeler les possibilités d'interaction dans la pièce après son entrée.

On ne répète pas l'intro de la pièce à chaque entrée — elle est affichée une seule fois lors de la première entrée (enter). Les entrées suivantes dans la même pièce (revisit) n'affichent que le texte "Vous revenez dans…" suivi d'un rappel des éléments interactifs de la pièce, sans réafficher l'intro complète.

### 2.2 TEXTE AFFICHÉ APRÈS UNE ACTION (le cœur du système)

| # | Layer | Description | Exemple (FR) | Condition d'apparition | note |
| --- | --- | ------ | --- | --- | --- |
| 1 | **Action** | l'explication de l'action choisie par le joueur | "Vous tentez de pirater le terminal de sécurité." | Toujours présent (100%) | action + target (vous frappez, vous fouillez, vous ouvrez… + le nom de la cible). ou déplacement : vous pénétrez dans… / vous revenez dans… |
| 2 | **Action Result** | Le résultat direct de l'action du joueur — ce qui s'est passé | "Vos doigts dansent sur le clavier holographique. Les pare-feu tombent un par un — accès accordé." | Toujours présent (100%) | dans le cas des entrées dans une nouvelle pièce ou de retour dans une pièce déjà visitée, le texte "vous pénétrez dans…" ou "vous revenez dans…" fait partie du layer 2 (Action result ) pour que ça soit plus fluide et éviter les répétitions. |
| 3 | **Sensory Detail** | Détail sensoriel qui ajoute de la texture (son, lumière, odeur, toucher) | "L'écran projette une lueur bleutée sur votre visage, seule source de lumière dans cette salle." | 90% si jet de dé, 50% si auto-succès | en rapport avec l'action faite (si vous ouvrez une porte, détaillez le son de la porte qui s'ouvre, l'air qui s'engouffre, etc.). s'il n'y a pas de description spécifique a l'action, ne rien mettre (le joueur tente une action absurde) |
| 4 | **Consequence** | Ce qui change concrètement dans le monde après l'action | "Les données du journal de bord s'affichent. Ce que vous lisez vous glace le sang." | Seulement si un changement d'état a eu lieu (porte ouverte, PV perdus, item obtenu, etc.) | attention si la conséquence est spécifiqua a un élément de scanério (datapad avec élément de lore) dans le cas (exemple) du datapad, les vraies données du datapad sont affichées, dans le cas de l'ouverture d'un coffre, son vrai contenu est affiché |
| 5 | **NPC Reaction** | Réaction d'un PNJ présent qui observe l'action du joueur | "« Impressionnant », murmure Kira." (allié, succès critique) / "{npc_name} émet un son qui ressemble à un rire." (hostile, échec) | Seulement si un NPC est présent dans la pièce, pas systématique. | |
| 6a | **Atmosphere** | Ambiance environnementale liée au setting et à la tension | "Derrière le mur, les moteurs grondent comme un animal blessé." | Probabilité variable (30–95% selon tension et beat). Divisée par 2 après 4 tours dans la même pièce. Reset si l'environnement change (feu, dépressurisation, NPC entre/sort…) | |
| 6b | **Gameplay Hint** | Remplace l'atmosphère — observation subtile pointant vers un élément interactif, jamais un ordre direct | "Un datapad repose sur la console, son écran encore allumé." | Remplace 6a à partir du tour 4+ dans la même pièce. Priorité aux objets liés à la quête | doit correspondre a un élément réel pour faire avancer le joueur, pas juste un détail de décor (ex: "le terminal de sécurité clignote, semblant réagir à votre présence" est un hint pour inciter le joueur a interagir avec le terminal) |
| 7 | **Player State** | État physique ou mental du personnage | "Votre vision se trouble par moments." | Seulement si PV < 30% ou si une condition est active (wounded, poisoned, terrified…) | doit être lié a l'état du personnage, pas juste un détail de décor (ex: "vous entendez un bourdonnement dans vos oreilles" est un player state hint que le personnage est blessé) |
| 8 | **Threat Hint** | Indice de menace envoyé par le threat director pour le pacing horreur | "Quelque chose gratte contre la coque, juste de l'autre côté." | Conditionnel — déclenché par le beat narratif (intro, rising, midpoint, escalation, climax) | |

puis on affiche le reste de la description de la pièce (features, items, NPCs, sorties) pour rafraîchir la mémoire du joueur et lui rappeler les possibilités d'interaction dans la pièce après son action.

## extra

lors de la génération procédurale du scenario, il faut bien respecter le noeud 'start' pour l'intro du scenario, et ne pas en faire un noeud comme les autres. c'est lui qui contient le texte d'intro du scenario (le skeleton) et c'est lui qui va définir le thème général du scenario (vaisseau spatial, station spatiale, caverne de cristaux, base alien…).

un scénario généré doit ressembler a ça :

**noeud entry** -> module_1 (beat intro) -> module 2 (beat intro) -> ... -> module n (beat intro) -> **noeud gate** -> module x (beat rising) -> module y (beat rising) -> ... -> module z (beat rising) -> **noeud midpoint** -> module a (beat midpoint) -> module b (beat midpoint) -> ... -> module c (beat midpoint) -> **noeud escalation** -> module m (beat escalation) -> module n (beat escalation) -> ... -> module o (beat escalation) -> **noeud climax** -> module p (beat climax) -> module q (beat climax) -> ... -> module r (beat climax) -> **noeud epilogue**

on retire pour l'instant le système de settings  de scénario (différents types de lieux, caverne de cristaux, station spatiale, etc.) pour se concentrer sur un seul thème (vaisseau spatial) par scénario. on fera un skin par scénario avec quand meme le système de modules de lieu (salle de contrôle, couloir, salle des machines…) pour varier les décors. avec certains modules dans des thèmes génériques (salle de contrôle, couloir) et d'autres plus spécifiques (salle des machines, serre hydroponique, carverne de cristaux, base alien). qu'on mettra uniquement dans les scénarios qui s'y prêtent (pas de serre hydroponique dans un scénario de caverne de cristaux, par exemple).

peut-on avoir des pièces adjacentes qui contiennent des modules non obligatoires ? des modules dead end ? desmodules qui peuvent apporter du loot, des rencontres, etc. je ne veux pas que le scénario soit un couloir linéaire, même si le chemin optimal pour le joueur est de suivre les modules principaux du scénario (entry -> gate -> midpoint -> escalation -> climax -> epilogue), il doit y avoir des possibilités de s'écarter du chemin principal pour explorer des pièces adjacentes, trouver du loot, des rencontres, etc. ces pièces adjacentes peuvent être générées de manière procédurale en fonction du thème du scénario et du module dans lequel elles se trouvent (ex: une pièce adjacente à une salle de contrôle peut être une salle de repos, une infirmerie, etc.).
