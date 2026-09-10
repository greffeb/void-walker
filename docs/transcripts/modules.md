# Transcript — modules de scénario

> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.

---

## `blocked_passage_01` — type `blocked_passage`, tension 2–7

### Peau `low`

- entrée
  > Un couloir ordinaire. Une porte. Elle ne s'ouvre pas.
- retour
  > Vous repassez par là.
- obstacle
  > Elle cède peut-être avec assez de force, ou de finesse.
- ambiance : « L'air est immobile. » · « Un bourdonnement lointain. » · « Silence. » · « Poussiéreux, mais intact. »

### Peau `mid`

- entrée
  > La porte est verrouillée. Et quelque chose approche de l'autre côté.
- retour
  > L'endroit vous semble différent maintenant.
- obstacle
  > Il faut passer. Vite. Trois options se présentent.
- ambiance : « Le métal grince sous vos pieds. » · « Une lumière clignote. » · « Quelque chose a changé ici. » · « Tension dans l'air. »

### Peau `high`

- entrée
  > La porte. Maintenant. Trouvez un moyen.
- retour
  > Chaque seconde compte.
- obstacle
  > Forcez-la. Piratez-la. Rampez. Choisissez maintenant.
- ambiance : « Sang. Frais. » · « Un bruit. Proche. » · « Fuyez ou combattez. » · « Pas le temps. »

### Obstacle sur `blocked_door`

> Une porte massive bloque le passage. Les mécanismes d'ouverture sont grippés ou verrouillés.

- chemin : Forcer la porte
- chemin : Pirater le panneau de sécurité
- chemin : Ramper dans le conduit de maintenance

### Lieu `main` (rôle `passage`)

> Vous voyez autour de vous Porte bloquée, Trappe de ventilation, Panneau de sécurité local.

#### Porte bloquée  `blocked_door`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Alliage renforcé, mécanisme grippé. Des marques de griffes entourent le cadre. Le panneau de contrôle adjacent semble encore alimenté.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > Le battant est écarté, assez pour passer. L'air de l'autre côté est plus froid et sent le métal chaud.
- **OPEN** (état=locked, flag=panel_bypassed, auto)
  - réussite `newState=open`
    > Grâce au panneau court-circuité, la porte s'ouvre sans résistance. Le passage est libre.
- **OPEN** (état=locked, auto)
  - réussite ⚠ `sans newState`
    > La porte est verrouillée. Le mécanisme refuse de répondre. Il faudrait forcer le passage, pirater le panneau de sécurité, ou trouver une autre voie.
- **PUSH/FORCE_OPEN/BREAK** (état=locked, DC 12 FOR)
  - réussite `newState=open`
    > Vous forcez la porte avec un grognement d'effort. Le métal cède dans un crissement strident. Le passage est libre.
  - échec
    > La porte résiste. Vos muscles brûlent mais elle ne bouge pas d'un millimètre. Il faudra une autre approche.
- **HACK/USE/REPAIR** (état=locked, DC 11 INT)
  - réussite `newState=open`
    > Vous court-circuitez le panneau de sécurité. Un déclic, puis la porte coulisse lentement. Le chemin s'ouvre.
  - échec
    > Les circuits crépitent mais le verrouillage tient bon. Le système de sécurité est plus robuste que prévu.

#### Trappe de ventilation  `vent_hatch`

- **initial (closed)** · `openness=closed` · via `descriptions`
  > Au ras du sol, étroite — praticable pour quelqu'un de souple. De l'air circule : elle mène bien de l'autre côté.
- **après newState:open** · `openness=open lock=unlocked` · via `descriptions`
  > Le capot est écarté. Le conduit s'enfonce dans le noir, juste assez large pour les épaules.
- **OPEN** (état=closed, auto)
  - réussite `newState=open`
    > Vous ouvrez la trappe de ventilation. Un courant d'air frais s'échappe du conduit sombre qui s'ouvre devant vous.
- **CLIMB** (état=open, DC 10 AGI)
  - réussite ⚠ `sans newState`
    > Vous vous glissez dans le conduit de ventilation. L'espace est étroit, mais vous parvenez à ramper jusqu'à l'autre côté.
  - échec
    > Le conduit est trop étroit. Vous vous coincez un instant avant de reculer, griffé par les parois métalliques.
- **CLIMB** (état=closed, auto)
  - réussite ⚠ `sans newState`
    > La trappe est fermée. Il faudrait d'abord l'ouvrir.

#### Panneau de sécurité local  `security_panel_local`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Le boîtier est enfoncé, mais certains circuits répondent encore. De quoi court-circuiter un verrouillage, pour qui sait où pincer.
- **après newState:open** · `integrity=damaged openness=open lock=unlocked` · via `descriptions`
  > Le boîtier est enfoncé, mais certains circuits répondent encore. De quoi court-circuiter un verrouillage, pour qui sait où pincer.
- ⚠ **INATTEIGNABLE** `descriptions.open`
  > Court-circuité. Deux fils torsadés à la main tiennent le contact, et le voyant reste obstinément vert.
- **HACK/OVERRIDE/REPAIR** (état=damaged, DC 11 INT)
  - réussite `newState=open` `flagSet=panel_bypassed`
    > Vous court-circuitez le panneau de sécurité. Un voyant passe au vert — le verrouillage de la porte est désactivé. Vous pouvez maintenant l'ouvrir.
  - échec
    > Les circuits crépitent sous vos doigts mais le système résiste. Le verrouillage reste actif.
- **HACK/OVERRIDE/REPAIR** (état=open, auto)
  - réussite ⚠ `sans newState`
    > Le panneau est déjà court-circuité. La porte devrait s'ouvrir maintenant.

---

## `wounded_survivor_01` — type `npc_encounter`, tension 2–6

### Peau `low`

- entrée
  > Une forme humaine dans l'ombre. Elle respire.
- retour
  > Vous repassez par là.
- obstacle
  > Il peut parler si vous l'aidez — ou si vous insistez.
- ambiance : « L'air est immobile. » · « Un bourdonnement lointain. » · « Silence. » · « Poussiéreux, mais intact. »

### Peau `mid`

- entrée
  > Quelqu'un est blessé ici. Votre présence les a alertés.
- retour
  > L'endroit vous semble différent maintenant.
- obstacle
  > Vous pouvez le soigner, négocier, ou prendre ce dont vous avez besoin.
- ambiance : « Le métal grince sous vos pieds. » · « Une lumière clignote. » · « Quelque chose a changé ici. » · « Tension dans l'air. »

### Peau `high`

- entrée
  > Un survivant. Blessé, terrifié. Chaque seconde sans soins les rapproche de la mort.
- retour
  > Chaque seconde compte.
- obstacle
  > Vite. Soignez-le, parlez-lui, ou saisissez ce qu'il faut et partez.
- ambiance : « Sang. Frais. » · « Un bruit. Proche. » · « Fuyez ou combattez. » · « Pas le temps. »

### Obstacle sur `wounded_crew_member`

> Un membre d'équipage blessé. Entre la peur et la souffrance, il possède des informations critiques — si vous pouvez établir le contact.

- chemin : Soigner le blessé
- chemin : Persuader pour obtenir des informations
- chemin : Intimider pour des réponses rapides
- chemin : Fouiller discrètement ses poches

### Lieu `main` (rôle `medical`)

> Vous voyez autour de vous Armoire médicale, Couchette.
> Parmi les débris, vous remarquez Kit médical basique.

#### Armoire médicale  `medical_cabinet`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Verrouillée par un code, mais le panneau est fissuré. Derrière la vitre sale, des boîtes alignées et un flacon couché.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > Ouverte. Les rayons du haut sont vides, ceux du bas ont été fouillés sans ménagement.
- **HACK** (état=locked, DC 9 INT)
  - réussite `newState=open`
    > Vous contournez le digicode en court-circuitant le panneau fissuré. L'armoire s'ouvre avec un déclic. À l'intérieur, un kit médical.
  - échec
    > Le panneau grésille mais le verrou tient bon.
- **FORCE_OPEN** (état=locked, DC 11 FOR)
  - réussite `newState=open`
    > Vous arrachez la porte de l'armoire. Le métal cède sous votre force. Un kit médical tombe sur le sol.
  - échec
    > L'armoire résiste. Construction militaire.

#### Couchette  `cot`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > lit de camp taché de sang

#### Kit médical basique  `medkit_basic`

- examineResult
  > Kit médical de base. Compresses hémostatiques, désinfectant, seringue d'adrénaline. Suffisant pour stabiliser un blessé léger.

---

## `dark_room_01` — type `environmental`, tension 3–8

### Peau `low`

- entrée
  > La lumière est éteinte ici. Vos yeux s'adaptent lentement.
- retour
  > Vous repassez par là.
- obstacle
  > Cherchez de la lumière ou trouvez votre chemin autrement.
- ambiance : « L'air est immobile. » · « Un bourdonnement lointain. » · « Silence. » · « Poussiéreux, mais intact. »

### Peau `mid`

- entrée
  > Obscurité. Quelque chose se déplace dans le noir.
- retour
  > L'endroit vous semble différent maintenant.
- obstacle
  > Réparez, trouvez une torche, ou traversez dans l'obscurité.
- ambiance : « Le métal grince sous vos pieds. » · « Une lumière clignote. » · « Quelque chose a changé ici. » · « Tension dans l'air. »

### Peau `high`

- entrée
  > Noir absolu. Vous ne savez pas ce qui attend là-dedans.
- retour
  > Chaque seconde compte.
- obstacle
  > Maintenant. Dans le noir. Ou rebroussez chemin.
- ambiance : « Sang. Frais. » · « Un bruit. Proche. » · « Fuyez ou combattez. » · « Pas le temps. »

### Obstacle sur `light_fixture`

> Obscurité totale. Vous ne voyez pas à un mètre. Des bruits. Des formes. Peut-être des menaces.

- chemin : Chercher une source de lumière
- chemin : Traverser à tâtons
- chemin : Réparer le réseau électrique
- chemin : Avancer en force, quoi qu'il arrive

### Lieu `main` (rôle `hub`)

> Vous voyez autour de vous Luminaire, Relais d'énergie, Bande luminescente d'urgence.

#### Luminaire  `light_fixture`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > plafonnier brisé pendant du plafond. Le tube est éclaté.
- **après newState:intact** · `integrity=intact activity=inactive power=unpowered` · via `descriptions`
  > plafonnier diffusant une lumière blanche stable.
- **ACTIVATE** (état=broken, flag=power_relay_repaired, auto)
  - réussite `newState=intact`
    > Vous actionnez l'interrupteur. Le plafonnier grésille, puis s'allume. La lumière blanche inonde la pièce — vous pouvez voir à nouveau.
- **ACTIVATE** (état=broken, auto)
  - réussite ⚠ `sans newState`
    > L'interrupteur ne répond pas. Le circuit d'alimentation est coupé — il faudrait réparer le relais d'énergie d'abord.
- **REPAIR** (état=broken, DC 12 INT)
  - réussite `newState=intact`
    > Vous reconnectez les fils du plafonnier et remplacez le tube éclaté avec un segment de la bande d'urgence. La lumière revient — faible mais suffisante.
  - échec
    > Les fils crépitent entre vos doigts. Le tube reste mort. Il faudrait peut-être d'abord rétablir l'alimentation.

#### Relais d'énergie  `power_relay`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > relais d'alimentation endommagé. Des câbles arrachés pendent.
- **après newState:intact** · `integrity=intact` · via `descriptions`
  > relais d'alimentation ronronnant doucement — circuit rétabli.
- **REPAIR** (état=damaged, DC 10 INT)
  - réussite `newState=intact` `flagSet=power_relay_repaired`
    > Vous reconnectez les câbles arrachés du relais. Un cliquetis, puis un ronronnement stable. Le circuit d'alimentation est rétabli — le luminaire peut être activé.
  - échec
    > Un arc électrique vous repousse. Le relais reste inerte. Il faudra réessayer.

#### Bande luminescente d'urgence  `emergency_glow_strip`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Bande luminescente d'urgence au sol. Émet une faible lueur verte — suffisante pour voir vos pieds, pas pour explorer. Elle mène vers la sortie opposée.

#### Lampe de secours  `emergency_flashlight` *(caché)*

- examineResult
  > Lampe torche d'urgence. Batteries faibles mais encore fonctionnelle. Sa lumière révèle les détails de la salle — et potentiellement votre position.

---

## `supply_cache_01` — type `resource_cache`, tension 2–5

### Peau `low`

- entrée
  > Un vieux conteneur de stockage. Il y a peut-être quelque chose d'utile dedans.
- retour
  > Vous repassez par là.
- obstacle
  > Peut-être une serrure simple, peut-être plus.
- ambiance : « L'air est immobile. » · « Un bourdonnement lointain. » · « Silence. » · « Poussiéreux, mais intact. »

### Peau `mid`

- entrée
  > Un conteneur de secours. Fermé à clé. Ce qu'il contient pourrait vous sauver.
- retour
  > L'endroit vous semble différent maintenant.
- obstacle
  > Ouvrez-le vite — force ou technique.
- ambiance : « Le métal grince sous vos pieds. » · « Une lumière clignote. » · « Quelque chose a changé ici. » · « Tension dans l'air. »

### Peau `high`

- entrée
  > Temps compté. Le conteneur est là. Ouvrez-le.
- retour
  > Chaque seconde compte.
- obstacle
  > Forcez ou crochetez. Maintenant.
- ambiance : « Sang. Frais. » · « Un bruit. Proche. » · « Fuyez ou combattez. » · « Pas le temps. »

### Obstacle sur `supply_container`

> Un conteneur de ravitaillement d'urgence. Fermé. Ce qu'il contient pourrait faire la différence.

- chemin : Crocheter ou déchiffrer le verrou
- chemin : Forcer l'ouverture
- chemin : Négocier avec un NPC présent

### Lieu `main` (rôle `storage`)

> Vous voyez autour de vous Conteneur de ravitaillement, Manifeste d'inventaire.

#### Conteneur de ravitaillement  `supply_container`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Scellé. Le verrou est un standard militaire : il cède aux bons outils, ou à assez de force appliquée au bon endroit.
- ⚠ **INATTEIGNABLE** `descriptions.open`
  > Ouvert. Rations entamées, emplacements vides, quelques fournitures éparses — quelqu'un est passé avant vous.

#### Manifeste d'inventaire  `inventory_manifest`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Manifeste d'inventaire affiché sur le côté. Liste le contenu : rations, médicaments, outils, et... une entrée barrée à l'encre noire. Quelqu'un a retiré quelque chose avant vous.

---

## `ambush_01` — type `ambush`, tension 5–9

### Peau `low`

- entrée
  > Quelque chose se déplace dans les ombres devant vous.
- retour
  > Vous repassez par là.
- obstacle
  > Vous avez le temps de choisir votre réponse.
- ambiance : « L'air est immobile. » · « Un bourdonnement lointain. » · « Silence. » · « Poussiéreux, mais intact. »

### Peau `mid`

- entrée
  > Un bruit sec. Une silhouette. L'embuscade est en cours.
- retour
  > L'endroit vous semble différent maintenant.
- obstacle
  > Combat, fuite, ou ruse — vite.
- ambiance : « Le métal grince sous vos pieds. » · « Une lumière clignote. » · « Quelque chose a changé ici. » · « Tension dans l'air. »

### Peau `high`

- entrée
  > Elle jaillit de l'obscurité. L'embuscade. Réagissez maintenant.
- retour
  > Chaque seconde compte.
- obstacle
  > Combat ou fuite. Maintenant. Pas le temps de penser.
- ambiance : « Sang. Frais. » · « Un bruit. Proche. » · « Fuyez ou combattez. » · « Pas le temps. »

### Obstacle sur `ambush_creature`

> Quelque chose vous attendait. L'embuscade est déclenchée. Réagissez.

- chemin : Combattre
- chemin : Fuir
- chemin : Feindre la confiance
- chemin : Utiliser l'environnement

### Lieu `main` (rôle `passage`)

> Vous voyez autour de vous Caisses de couverture, Point d'étranglement, Conduit de ventilation.

#### Caisses de couverture  `cover_crates`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Caisses de cargo empilées. Offrent un couvert décent contre une attaque frontale. Assez lourdes pour bloquer un passage si renversées.

#### Point d'étranglement  `ambush_choke_point`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Goulot d'étranglement naturel entre les structures. Position tactique — un seul adversaire peut passer à la fois. Idéal pour une défense ou un piège.

#### Conduit de ventilation  `ventilation_shaft`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Conduit de ventilation ouvert. Juste assez large pour s'y faufiler. Mais les griffures à l'intérieur suggèrent que la créature l'utilise aussi.

---

## `airlock_malfunction_01` — type `environmental`, tension 4–8

### Peau `low`

- entrée
  > Un sas avec une légère anomalie de pression. Rien d'urgent.
- retour
  > De retour ici.
- obstacle
  > Plusieurs méthodes pour sceller la fuite.
- ambiance : « Calme technique. » · « Systèmes en veille. » · « Bruit de fond. » · « Stable pour l'instant. »

### Peau `mid`

- entrée
  > Le sas présente une brèche active. L'O₂ fuit.
- retour
  > La situation a changé.
- obstacle
  > Vite — soudez, neutralisez le panneau, ou utilisez votre combinaison.
- ambiance : « Alarme lointaine. » · « Pression anormale. » · « Les systèmes montrent des anomalies. » · « Quelque chose cloche. »

### Peau `high`

- entrée
  > Brèche critique. Colmatez maintenant ou asphyxiez.
- retour
  > Plus de temps à perdre.
- obstacle
  > Colmatez ou mourez. Tout de suite.
- ambiance : « Urgence. » · « Ça se dégrade vite. » · « Agissez maintenant. » · « Chaque seconde compte. »

### Obstacle sur `airlock_breach`

> Une brèche dans l'airlock. L'air s'échappe. Si vous ne la colmatez pas, l'atmosphère va se raréfier rapidement.

- chemin : Souder la brèche au chalumeau
- chemin : Activer le protocole d'urgence via le panneau
- chemin : Utiliser la combinaison EVA (succès automatique si disponible)

### Lieu `main` (rôle `airlock`)

> Vous voyez autour de vous Brèche du sas, Point de soudure, Panneau de neutralisation.

#### Brèche du sas  `airlock_breach`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Brèche dans la paroi du sas. L'air s'échappe en sifflant — la dépressurisation est lente mais constante. Le bord est assez régulier pour être soudé.

#### Point de soudure  `weld_point`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Point de soudure possible le long de la brèche. Un chalumeau ou un équipement de soudage pourrait sceller l'ouverture. Travail physique, mais faisable.

#### Panneau de neutralisation  `override_panel`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Panneau de contrôle du protocole d'urgence du sas. Circuit partiellement fonctionnel — un technicien pourrait déclencher la fermeture d'urgence à distance.

---

## `malfunctioning_android_01` — type `npc_encounter`, tension 3–7

### Peau `low`

- entrée
  > Un androïde de maintenance agit de façon erratique dans le couloir.
- retour
  > De retour ici.
- obstacle
  > Parlez-lui, piratez-le, ou trouvez son code d'arrêt.
- ambiance : « Calme technique. » · « Systèmes en veille. » · « Bruit de fond. » · « Stable pour l'instant. »

### Peau `mid`

- entrée
  > L'androïde vous détecte. Son comportement est anormal — il est en boucle d'erreur.
- retour
  > La situation a changé.
- obstacle
  > Raisonnez-le, désactivez-le, ou combattez-le.
- ambiance : « Alarme lointaine. » · « Pression anormale. » · « Les systèmes montrent des anomalies. » · « Quelque chose cloche. »

### Peau `high`

- entrée
  > L'androïde est en mode protection maximale. Il vous attaquera si vous approchez.
- retour
  > Plus de temps à perdre.
- obstacle
  > Neutralisez-le immédiatement — par la parole, le piratage, ou la force.
- ambiance : « Urgence. » · « Ça se dégrade vite. » · « Agissez maintenant. » · « Chaque seconde compte. »

### Obstacle sur `malfunctioning_android`

> Un androïde de service dont la programmation a déraillé. Il considère tout intrus comme une menace. Neutralisez-le ou trouvez un moyen de le contourner.

- chemin : Raisonner avec ses protocoles de sécurité
- chemin : Accéder au port de neutralisation
- chemin : Combattre physiquement
- chemin : Trouver le code d'arrêt dans ses fichiers

### Lieu `main` (rôle `engineering`)

> Vous voyez autour de vous Station androïde, Port de neutralisation, Coupe-circuit.

#### Station androïde  `android_station`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Station de recharge et de maintenance de l'androïde. L'écran de diagnostic affiche des erreurs en cascade — corruption mémoire, boucles logiques, défaillance des protocoles de base.

#### Port de neutralisation  `override_port`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Port de neutralisation d'urgence à l'arrière de la station. Interface standard — si vous pouvez accéder physiquement à l'androïde, vous pourriez le désactiver par ici.

#### Coupe-circuit  `power_shutoff`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Coupe-circuit local. Couperait l'alimentation de toute la section — y compris l'androïde, mais aussi l'éclairage et la ventilation.

#### Code de neutralisation androïde  `android_override_code` *(caché)*

- examineResult
  > Carte mémoire contenant le code d'arrêt d'urgence de l'androïde. Séquence alphanumérique de 12 caractères. Si injectée dans son port de maintenance, arrêt immédiat.

---

## `alien_mechanism_01` — type `terminal_puzzle`, tension 4–8

### Peau `low`

- entrée
  > Un objet alien. Mystérieux, pas immédiatement menaçant.
- retour
  > De retour ici.
- obstacle
  > Prenez le temps de comprendre — ou tentez votre chance.
- ambiance : « Calme technique. » · « Systèmes en veille. » · « Bruit de fond. » · « Stable pour l'instant. »

### Peau `mid`

- entrée
  > Quelque chose pulse dans le mur, à intervalles réguliers. Le rythme change quand vous approchez.
- retour
  > La situation a changé.
- obstacle
  > Déchiffrez, forcez, ou accordez-vous à lui.
- ambiance : « Alarme lointaine. » · « Pression anormale. » · « Les systèmes montrent des anomalies. » · « Quelque chose cloche. »

### Peau `high`

- entrée
  > Le pouls dans le mur s'accélère. La lumière qui en sort éclaire vos mains par saccades.
- retour
  > Plus de temps à perdre.
- obstacle
  > Activez-le. Maintenant. N'importe comment.
- ambiance : « Urgence. » · « Ça se dégrade vite. » · « Agissez maintenant. » · « Chaque seconde compte. »

### Obstacle sur `alien_mechanism`

> Un mécanisme extraterrestre d'une technologie incompréhensible. Il pulse doucement. Il attend quelque chose.

- chemin : Déchiffrer les symboles et activer la séquence
- chemin : Forcer l'activation en brute
- chemin : Attunement psionic avec le mécanisme

### Lieu `main` (rôle `ritual_chamber`)

> Vous voyez autour de vous Mécanisme alien, Panneau de symboles A, Panneau de symboles B, Nœud psionique.

#### Mécanisme alien  `alien_mechanism`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Mécanisme extraterrestre d'une technologie indéchiffrable. Il pulse d'une lumière bleu-violet au rythme d'un battement cardiaque. Il attend quelque chose — un contact, un signal, une volonté.

#### Panneau de symboles A  `symbol_panel_a`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Panneau couvert de symboles alien organisés en spirale. Certains brillent faiblement quand vous les effleurez. Il y a un motif — une séquence logique, peut-être.

#### Panneau de symboles B  `symbol_panel_b`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Second panneau de symboles, complémentaire au premier. Les motifs sont différents mais liés. Ensemble, ils forment peut-être une clé d'activation.

#### Nœud psionique  `psionic_node`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Nœud psionique — un cristal flottant qui vibre à une fréquence sub-sonique. Toucher le cristal provoque un vertige et des visions fugaces d'espaces inconnus.

#### Traducteur universel  `translator_device` *(caché)*

- examineResult
  > Dispositif de traduction alien. Petit, organique, chaud au toucher. En le tenant près des panneaux de symboles, des fragments de sens émergent dans votre esprit.

---

## `containment_breach_01` — type `environmental`, tension 6–9

### Peau `low`

- entrée
  > Une alarme discrète, répétitive, que personne n'a coupée. Derrière la vitre, la lumière bleue vacille.
- retour
  > De retour ici.
- obstacle
  > Signes de problème — le champ peut encore être restauré.
- ambiance : « Calme technique. » · « Systèmes en veille. » · « Bruit de fond. » · « Stable pour l'instant. »

### Peau `mid`

- entrée
  > La brèche est active. L'atmosphère se détériore. Agissez vite.
- retour
  > La situation a changé.
- obstacle
  > Restaurez le confinement, fuyez, ou affrontez ce qui s'est échappé.
- ambiance : « Alarme lointaine. » · « Pression anormale. » · « Les systèmes montrent des anomalies. » · « Quelque chose cloche. »

### Peau `high`

- entrée
  > Confinement rompu. Danger immédiat. Chaque seconde aggrave la situation.
- retour
  > Plus de temps à perdre.
- obstacle
  > Restaurez ou fuyez. L'atmosphère vous tue si vous restez.
- ambiance : « Urgence. » · « Ça se dégrade vite. » · « Agissez maintenant. » · « Chaque seconde compte. »

### Obstacle sur `containment_field`

> Le champ de confinement est tombé. Un spécimen — ou pire — s'est échappé. L'atmosphère est compromise.

- chemin : Restaurer le champ de confinement
- chemin : Évacuer la section avant d'être affecté
- chemin : Combattre le spécimen échappé

### Lieu `main` (rôle `hazard_zone`)

> Vous voyez autour de vous Champ de confinement, Unité de rescellement, Panneau d'évacuation.

#### Champ de confinement  `containment_field`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `examineResult`
  > Champ de confinement électromagnétique — complètement effondré. Les émetteurs sont grillés. Quelque chose de puissant a forcé le passage de l'intérieur.

#### Unité de rescellement  `resealing_unit`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Unité de re-scellement d'urgence. Endommagée mais réparable. Avec les bonnes manipulations, elle pourrait restaurer le champ de confinement à 60% de sa capacité.

#### Panneau d'évacuation  `evacuation_panel`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Panneau d'évacuation de section. Permet de sceller et purger cette zone entière. Solution radicale mais efficace — tout ce qui est à l'intérieur sera exposé au vide.

---

## `power_reroute_dilemma_01` — type `moral_choice`, tension 4–7

### Peau `low`

- entrée
  > La salle bourdonne d'un courant qui ne va plus nulle part. Deux câbles épais montent vers le plafond, et un seul est chaud.
- retour
  > De retour ici.
- obstacle
  > Deux options, un coût moral. Réfléchissez.
- ambiance : « Calme technique. » · « Systèmes en veille. » · « Bruit de fond. » · « Stable pour l'instant. »

### Peau `mid`

- entrée
  > Le panneau est là. Ce que vous choisirez aura des conséquences.
- retour
  > La situation a changé.
- obstacle
  > Portes ou infirmerie. L'une ou l'autre — pas les deux.
- ambiance : « Alarme lointaine. » · « Pression anormale. » · « Les systèmes montrent des anomalies. » · « Quelque chose cloche. »

### Peau `high`

- entrée
  > Un panneau. Un choix. Quelqu'un en paiera le prix.
- retour
  > Plus de temps à perdre.
- obstacle
  > Maintenant. Choisissez. Il n'y a pas de bonne réponse.
- ambiance : « Urgence. » · « Ça se dégrade vite. » · « Agissez maintenant. » · « Chaque seconde compte. »

### Obstacle sur `power_distribution_panel`

> Le panneau de distribution est endommagé. Des circuits prioritaires nécessitent votre attention.

- chemin : Réacheminer vers les portes — votre chemin s'ouvre
- chemin : Réacheminer vers l'infirmerie — le survivant est sauvé
- chemin : Trouver un compromis instable (très difficile)

### Lieu `main` (rôle `control_room`)

> Vous voyez autour de vous Panneau de distribution d'énergie, Circuit d'alimentation infirmerie, Circuit d'alimentation porte.

#### Panneau de distribution d'énergie  `power_distribution_panel`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Panneau de distribution énergétique principal de la section. Deux circuits prioritaires : sas (évacuation) et infirmerie (survie du blessé). L'énergie disponible ne suffit que pour l'un des deux.
- **après newState:intact** · `integrity=intact` · via `examineResult`
  > Panneau de distribution énergétique principal de la section. Deux circuits prioritaires : sas (évacuation) et infirmerie (survie du blessé). L'énergie disponible ne suffit que pour l'un des deux.
- **HACK/IMPROVISE_TOOL** (DC 16 INT)
  - réussite `newState=intact` `flagSet=survivor_saved`
    > Vous trouvez un compromis instable. Les deux circuits sont alimentés — pour l'instant.
  - échec
    > Le panneau résiste à votre tentative de surcharge. Les circuits restent bloqués.

#### Circuit d'alimentation infirmerie  `medbay_feed_circuit`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Circuit d'alimentation de l'infirmerie. Alimenté, le matériel médical peut maintenir le survivant en vie. Déconnecté, les machines s'arrêtent en 3 minutes.

#### Circuit d'alimentation porte  `door_feed_circuit`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Circuit d'alimentation des portes de section. Endommagé mais réparable. S'il est alimenté, les portes s'ouvrent et votre chemin se débloque. Sinon, il faudra trouver un autre passage.
- **après newState:active** · `integrity=damaged activity=active power=powered` · via `examineResult`
  > Circuit d'alimentation des portes de section. Endommagé mais réparable. S'il est alimenté, les portes s'ouvrent et votre chemin se débloque. Sinon, il faudra trouver un autre passage.
- **REPAIR/USE/HACK** (DC 11 INT)
  - réussite `newState=active`
    > Vous réacheminez l'énergie vers les portes. Les machines de l'infirmerie s'éteignent en silence.
  - échec
    > Vous ne parvenez pas à réacheminer le circuit.

---

## `patrol_entity_01` — type `patrol_enemy`, tension 6–10

### Peau `low`

- entrée
  > Quelque chose surveille ce couloir. Son rythme est régulier.
- retour
  > De retour ici.
- obstacle
  > Vous pouvez la contourner — avec soin.
- ambiance : « Tension perceptible. » · « Méfiez-vous. » · « Quelque chose a changé. » · « Ce n'est pas fini. »

### Peau `mid`

- entrée
  > L'entité patrouille. Elle n'a pas encore détecté votre présence.
- retour
  > La menace n'a pas disparu.
- obstacle
  > Furtivité, distraction, ou affrontement direct.
- ambiance : « Du sang frais. » · « Un grondement. » · « Réfléchissez vite. » · « Danger imminent. »

### Peau `high`

- entrée
  > Elle est LÀ. En patrouille. Proche. Attendez ou agissez.
- retour
  > C'est pire qu'avant.
- obstacle
  > Furtivité ou combat. Vite, avant qu'elle revienne.
- ambiance : « Hurlez intérieurement. Agissez. » · « Pas le temps. Bougez. » · « Tout peut finir ici. » · « Survivez. »

### Obstacle sur `patrol_entity`

> Une entité en patrouille. Elle couvre la zone de manière régulière. Passez sous son radar — ou forcez le passage.

- chemin : Se faufiler discrètement
- chemin : Attaquer frontalement
- chemin : Créer une distraction pour l'attirer ailleurs
- chemin : L'attirer dans un autre couloir
- chemin : Poser un piège dans sa trajectoire

### Lieu `main` (rôle `passage`)

> Vous voyez autour de vous Zone de patrouille, Couverture furtive, Point de diversion, Emplacement de piège.

#### Zone de patrouille  `patrol_zone`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Zone de patrouille régulière de l'entité. Les marques au sol — griffures, traînées de mucus — dessinent un circuit prévisible. Elle passe ici toutes les 90 secondes environ.

#### Couverture furtive  `stealth_cover`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Position de couvert discrète entre des panneaux déformés. Assez sombre pour se cacher si l'entité ne vous a pas encore repéré. À utiliser au bon moment.

#### Point de diversion  `distraction_point`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Point où des débris instables pourraient être renversés pour créer du bruit. Suffisant pour attirer l'entité dans une direction opposée.

#### Emplacement de piège  `trap_spot`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Emplacement idéal pour un piège improvisé. Goulot d'étranglement naturel avec des câbles pendants et une structure instable au-dessus. Un bon piège pourrait ralentir ou blesser l'entité.

---

## `flooded_section_01` — type `environmental`, tension 6–9

### Peau `low`

- entrée
  > Une légère accumulation d'eau. La vanne fuit quelque part.
- retour
  > De retour ici.
- obstacle
  > Trouvez la vanne ou traversez avec soin.
- ambiance : « Tension perceptible. » · « Méfiez-vous. » · « Quelque chose a changé. » · « Ce n'est pas fini. »

### Peau `mid`

- entrée
  > La section est à moitié submergée. Des câbles flottent dans l'eau.
- retour
  > La menace n'a pas disparu.
- obstacle
  > Vanne, nage habile, ou réacheminement — mais pas le passage électrifié imprudent.
- ambiance : « Du sang frais. » · « Un grondement. » · « Réfléchissez vite. » · « Danger imminent. »

### Peau `high`

- entrée
  > Inondation. Câbles sous tension. Passage dangereux dans les deux sens.
- retour
  > C'est pire qu'avant.
- obstacle
  > Traversez maintenant. Vite. Prudemment.
- ambiance : « Hurlez intérieurement. Agissez. » · « Pas le temps. Bougez. » · « Tout peut finir ici. » · « Survivez. »

### Obstacle sur `flood_zone`

> La section est noyée sous un mètre d'eau chargée de résidus chimiques. Les câbles électriques immergés rendent le passage du côté force extrêmement dangereux.

- chemin : Trouver et fermer la vanne d'alimentation
- chemin : Nager à travers (risque électrique)
- chemin : Traverser avec agilité en évitant les câbles
- chemin : Réacheminer la plomberie pour drainer la section

### Lieu `main` (rôle `hazard_zone`)

> Vous voyez autour de vous Zone inondée, Contrôle de valve, Reroutage de tuyauterie, Passage submergé.

#### Zone inondée  `flood_zone`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Section entièrement submergée sous un mètre d'eau trouble. Des câbles électriques affleurent la surface — certains crépitent encore. L'eau est chargée de résidus chimiques jaunâtres.

#### Contrôle de valve  `valve_control`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Vanne de contrôle du réseau hydraulique. Située en hauteur, accessible à sec. La fermer couperait l'alimentation en eau de la section, permettant un drainage lent.

#### Reroutage de tuyauterie  `pipe_reroute`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Tuyauterie endommagée — c'est la source de l'inondation. Réacheminer le flux vers le circuit d'évacuation drainerait la zone en quelques minutes.

#### Passage submergé  `submerged_passage`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Passage immergé vers l'autre côté de la section. L'eau est profonde mais le chemin est droit. Les câbles électriques sont le vrai danger.

---

## `survivor_rescue_01` — type `rescue`, tension 5–8

### Peau `low`

- entrée
  > Quelqu'un est piégé ici. Pas de danger immédiat pour vous.
- retour
  > De retour ici.
- obstacle
  > Plusieurs façons de le libérer — force, technique, ou persuasion.
- ambiance : « Tension perceptible. » · « Méfiez-vous. » · « Quelque chose a changé. » · « Ce n'est pas fini. »

### Peau `mid`

- entrée
  > Un survivant est pris au piège. Vous entendez sa voix, faible.
- retour
  > La menace n'a pas disparu.
- obstacle
  > Libérez-le vite — force, piratage, ou paroles apaisantes.
- ambiance : « Du sang frais. » · « Un grondement. » · « Réfléchissez vite. » · « Danger imminent. »

### Peau `high`

- entrée
  > Survivant piégé. Vous avez peu de temps avant que sa situation empire.
- retour
  > C'est pire qu'avant.
- obstacle
  > Libérez-le maintenant. Il n'a plus beaucoup de temps.
- ambiance : « Hurlez intérieurement. Agissez. » · « Pas le temps. Bougez. » · « Tout peut finir ici. » · « Survivez. »

### Obstacle sur `trapped_survivor`

> Un survivant piégé sous des débris ou derrière une porte verrouillée. Libérez-le — il peut devenir un allié temporaire, ou mourir si vous n'agissez pas.

- chemin : Couper les restraintes ou déplacer les débris
- chemin : Pirater la serrure
- chemin : Calmer le survivant et guider sa libération

### Lieu `main` (rôle `quarters`)

> Vous voyez autour de vous Piège de débris, Verrou de contention, Poutre structurelle.

#### Piège de débris  `debris_trap`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Amas de débris métalliques compressant les jambes du survivant. La structure est instable — un mauvais mouvement pourrait provoquer un effondrement supplémentaire.

#### Verrou de contention  `restraint_lock`

- **initial (locked)** · `lock=locked openness=closed` · via `examineResult`
  > Serrure électronique d'une porte de sécurité qui s'est referrée automatiquement lors de l'incident. Le mécanisme est standard — pirattable avec les bons outils.

#### Poutre structurelle  `structural_beam`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Poutre structurelle déformée reposant sur les débris. Principale source de compression. Avec suffisamment de force, elle pourrait être soulevée ou découpée.

---

## `terminal_decrypt_01` — type `terminal_puzzle`, tension 4–8

### Peau `low`

- entrée
  > Un seul poste de travail, au centre d'une pièce vide. L'écran est allumé et n'affiche qu'une ligne.
- retour
  > De retour ici.
- obstacle
  > Cherchez le mot de passe, hackez, ou faites parler quelqu'un.
- ambiance : « Tension perceptible. » · « Méfiez-vous. » · « Quelque chose a changé. » · « Ce n'est pas fini. »

### Peau `mid`

- entrée
  > L'écran attend, patient, depuis soixante-douze heures. Ce qu'il garde n'a pas bougé d'un octet.
- retour
  > La menace n'a pas disparu.
- obstacle
  > Trois approches : perquisition, piratage, social.
- ambiance : « Du sang frais. » · « Un grondement. » · « Réfléchissez vite. » · « Danger imminent. »

### Peau `high`

- entrée
  > Terminal sous haute sécurité. Décryptez ou cherchez un autre moyen.
- retour
  > C'est pire qu'avant.
- obstacle
  > Ouvrez-le. Maintenant. Les données à l'intérieur valent le risque.
- ambiance : « Hurlez intérieurement. Agissez. » · « Pas le temps. Bougez. » · « Tout peut finir ici. » · « Survivez. »

### Obstacle sur `encrypted_terminal`

> Un terminal chiffré à plusieurs couches. La procédure complète : trouver le mot de passe dans les archives, pirater l'accès, ou faire parler un opérateur restant. Révèle des données lore + accès à une Black Box optionnelle.

- chemin : Trouver le mot de passe dans les journaux
- chemin : Pirater directement
- chemin : Faire parler un opérateur ou une IA encore active

### Lieu `main` (rôle `control_room`)

> Vous voyez autour de vous Terminal chiffré, Archive de journaux.

#### Terminal chiffré  `encrypted_terminal`

- **initial (locked)** · `lock=locked openness=closed` · via `examineResult`
  > Terminal haute sécurité avec chiffrement multiniveau. L'écran affiche un curseur clignotant — il attend un mot de passe. Les données à l'intérieur pourraient révéler la vérité sur ce qui s'est passé ici.

#### Archive de journaux  `log_archive`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Archive de journaux de bord sur support physique. Des centaines d'entrées datées. Certaines pages sont arrachées — celles des jours précédant l'incident.

#### Puce de données  `data_chip` *(caché)*

- examineResult
  > Trouvée scotchée sous le terminal. Des journaux non chiffrés — des enregistrements personnels que quelqu'un voulait soustraire à la purge.

---

## `explosive_decompression_risk_01` — type `blocked_passage`, tension 7–10

### Peau `low`

- entrée
  > Un passage avec quelques zones fragilisées. Soyez prudent.
- retour
  > De retour ici.
- obstacle
  > Traversez avec soin — ou trouvez un autre chemin.
- ambiance : « Tension perceptible. » · « Méfiez-vous. » · « Quelque chose a changé. » · « Ce n'est pas fini. »

### Peau `mid`

- entrée
  > Le passage est dangereux. La coque pourrait céder.
- retour
  > La menace n'a pas disparu.
- obstacle
  > Méthode, force brute avec conséquences, ou colmatage préventif.
- ambiance : « Du sang frais. » · « Un grondement. » · « Réfléchissez vite. » · « Danger imminent. »

### Peau `high`

- entrée
  > Risque de décompression explosive immédiat. Un seul faux mouvement.
- retour
  > C'est pire qu'avant.
- obstacle
  > Traversez. Maintenant. Prudemment. Un faux pas et c'est la décompression.
- ambiance : « Hurlez intérieurement. Agissez. » · « Pas le temps. Bougez. » · « Tout peut finir ici. » · « Survivez. »

### Obstacle sur `weakened_hull_section`

> Le passage avant présente un risque de décompression explosive. La coque est fragilisée. Tout mouvement brutal peut provoquer une brèche. Traversez avec méthode — ou acceptez les conséquences.

- chemin : Traverser avec méthode, en testant chaque point d'appui
- chemin : Forcer le passage rapidement (perte O₂/PV)
- chemin : Colmater le point faible pour sécuriser le passage

### Lieu `main` (rôle `airlock`)

> Vous voyez autour de vous Section de coque fragilisée, Marqueurs de passage sûr, Point de scellement.

#### Section de coque fragilisée  `weakened_hull_section`

- **initial (damaged)** · `integrity=damaged` · via `examineResult`
  > Section de coque affincie — l'alliage est presque transparent par endroits. Le vide spatial est visible à travers. Un choc violent pourrait provoquer une décompression explosive instantanée.

#### Marqueurs de passage sûr  `careful_path_markers`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Marqueurs fluorescents tracés au sol par un précédent passage. Ils indiquent les zones sûres où la coque est encore solide. Suivez-les et vous devriez pouvoir traverser sans risque.

#### Point de scellement  `seal_point`

- **initial (intact)** · `integrity=intact` · via `examineResult`
  > Point de colmatage identifiable — la zone la plus fragile de la coque. Avec du matériel de soudure ou de la mousse expansive, cette section pourrait être renforcée pour sécuriser le passage.

