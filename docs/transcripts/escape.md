# Transcript — Fuir l'Épave (`escape`)

> Généré par `npx tsx scripts/narrative-transcript.ts`. Ne pas éditer à la main.
> `⚠` marque un texte que le joueur ne peut pas atteindre, ou un nom manquant.

## Intro du scénario

> Vous vous réveillez seul dans les entrailles d'un vaisseau-cargo en dérive, l'USS Meridian. Votre capsule cryogénique s'est ouverte d'urgence — les 46 autres sont mortes depuis 6 mois. Les alarmes hurlent. L'éclairage de secours peint les couloirs en rouge sang. Quelque chose rôde dans les sections abandonnées — quelque chose qui a tué tout l'équipage. Trouvez un moyen d'atteindre les pods d'évasion. Fuyez. Ne regardez pas en arrière.

---

## Nœud `start` — rôle `entry`, beat `intro`, tension 2

*Nom de lieu tiré parmi :* « Carrefour des coursives » · « Jonction centrale » · « Nœud de distribution » · « Carrefour principal » · « Intersection des couloirs » · « Carrefour de service » · « Jonction de maintenance » · « Nœud de circulation » · « Carrefour d'urgence » · « Jonction de sécurité » · « Centre de distribution » · « Carrefour technique » · « Nœud central de navigation » · « Carrefour des sections » · « Jonction des systèmes » · « Carrefour de commandement » · « Nœud d'aiguillage » · « Carrefour de fuite » · « Jonction pressurisée » · « Centre de communication » · « Nœud de jonction principal » · « Carrefour des modules »

### Ce que le joueur lit en entrant

> Vous ouvrez les yeux. Froid mordant, obscurité presque totale. Le couvercle de votre capsule est ouvert — éjection d'urgence. Autour de vous, quarante-six autres capsules, silencieuses, leurs voyants morts depuis longtemps. L'éclairage de secours rougeoie faiblement. Vous êtes seul, et quelque chose a coupé le courant il y a quatre heures.

> Vous voyez autour de vous Capsule cryogénique, Terminal de statut, Casier d'urgence.
> Parmi les débris, vous remarquez Lampe de secours, Kit médical basique.

*Sorties :* unlock

### Éléments

#### Capsule cryogénique  `cryopod`

- **initial (broken)** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Le couvercle s'est ouvert d'urgence — le voyant indique une coupure de courant il y a quatre heures. Le gel a coulé sur le sol en une flaque translucide.

#### Terminal de statut  `status_terminal`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > L'écran clignote entre des bribes : « ALERTE CONFINEMENT — NIVEAU 5 »… « Équipage : 0/47 actifs »… « Support vie : CRITIQUE ». La date affichée a six mois d'avance sur vos souvenirs.
- **après newState:active** · `integrity=damaged activity=active power=powered` · via `descriptions`
  > L'écran clignote entre des bribes : « ALERTE CONFINEMENT — NIVEAU 5 »… « Équipage : 0/47 actifs »… « Support vie : CRITIQUE ». La date affichée a six mois d'avance sur vos souvenirs.
- ⚠ **INATTEIGNABLE** `descriptions.active`
  > Le plan du vaisseau s'affiche. Diagnostic : quarante-six capsules en défaillance depuis six mois, une éjectée en urgence. Les pods sont au niveau inférieur, derrière un point de contrôle.
- `readableContent` (718 car.)
- **READ/EXAMINE/SCAN** (état=active, auto)
  - réussite ⚠ `sans newState` `flagSet=terminal_read`
    > Le rapport système confirme le pire. 47 membres d'équipage, aucun actif. La dernière activité humaine remonte à 6 mois — une cascade d'alertes biologiques, des sections scellées, puis le silence. Le plan du vaisseau indique les pods d'évasion au pont inférieur, derrière un point de contrôle de sécurité.
- **READ/EXAMINE/HACK/SCAN** (auto)
  - réussite `newState=active` `flagSet=terminal_read`
    > L'écran stabilise son affichage. Vous parcourez les entrées du journal système. L'histoire se dessine — coupure réacteur, brèche, équipe perdue, confinement. Le dernier signe de vie de l'équipage remonte à plus de six mois.
- **REPAIR** (état=damaged, DC 8 INT)
  - réussite `newState=active` `flagSet=ship_map_found`
    > Quelques connexions ressoudées. L'écran cesse de clignoter et affiche un plan partiel du vaisseau. La baie des pods d'évasion est marquée au pont inférieur.
  - échec
    > Un arc électrique vous force à retirer la main. L'écran continue de clignoter — mais les bribes de données restent lisibles.

#### Casier d'urgence  `emergency_locker`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Le verrou magnétique est actif, un voyant rouge le confirme. La serrure a travaillé avec les vibrations du vaisseau : elle ne tiendra pas contre un outil adapté, ni contre assez de force.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > L'éclairage de secours éclaire l'intérieur : deux emplacements moulés, l'un pour un badge, l'autre pour une bonbonne d'oxygène. L'étiquette « NE PAS RETIRER SAUF ÉVACUATION » pend à moitié décollée.
- ⚠ **INATTEIGNABLE** `descriptions.empty`
  > Grand ouvert, et vide. Les emplacements moulés gardent la forme de ce qui s'y trouvait.
- **FORCE_OPEN/BREAK/OPEN/KICK** (état=locked, DC 10 FOR)
  - réussite `newState=open`
    > Le métal cède dans un crissement. Le verrou magnétique saute — le casier s'ouvre. À l'intérieur : un badge d'accès et une bonbonne d'oxygène de secours.
  - échec
    > La serrure résiste. Vos mains glissent sur le métal froid. Le verrou magnétique tient bon — mais vous sentez du jeu. Un autre essai, peut-être.
- **HACK/UNLOCK** (état=locked, DC 8 INT)
  - réussite `newState=open`
    > Vous faites sauter le circuit du verrou magnétique en court-circuitant les bornes. Clic. Le casier s'ouvre en douceur. Un badge d'accès et une bonbonne d'oxygène reposent à l'intérieur.
  - échec
    > Un arc électrique vous mord les doigts. Le circuit a résisté — mais le boîtier du verrou fume légèrement.
- **USE** (état=locked, objet=standard_toolkit, auto)
  - réussite `newState=open`
    > La trousse à outils fait le travail. Trois vis, un levier improvisé, et le verrou cède sans résistance. Le casier contient un badge d'accès et une bonbonne d'oxygène.
- **USE** (état=locked, objet=knife, auto)
  - réussite `newState=open`
    > La lame du couteau s'insère dans la fente du verrou. Un mouvement sec — le mécanisme cède. Le casier s'ouvre.

### Objets

#### Lampe de secours  `emergency_flashlight`

- description
  > Une lampe torche de secours standard. La batterie indique 73%. Assez pour éclairer votre chemin dans les sections sombres.

#### Kit médical basique  `medkit_basic`

- description
  > Kit médical d'urgence. Contient des bandages compressifs, un antiseptique et une dose d'analgésique. Suffisant pour traiter une blessure légère.
- **USE sur `self`** ⚠ `sans newState`
  > Vous appliquez les bandages compressifs et l'antiseptique sur vos blessures. La dose d'analgésique atténue la douleur.

#### Badge d'accès  `access_keycard` *(caché)*

- description
  > Niveau 3, au nom du technicien Chen. Encore actif — de quoi ouvrir une cloison de sécurité.
- **USE sur `security_panel`** `newState=inactive` `flagSet=bulkhead_unlocked`
  > Vous passez le badge sur le lecteur. Bip. Le voyant passe au vert. La cloison blindée gronde — les verrous magnétiques se rétractent un à un. Le passage est libre.
- **USE sur `escape_pod_hatch`** `newState=open` `flagSet=pod_hatch_open`
  > Le badge active l'écoutille du pod. Les joints pneumatiques sifflent — la porte s'ouvre sur l'intérieur exigu de la capsule d'évasion.

#### Bouteille d'oxygène  `oxygen_canister` *(caché)*

- description
  > Bonbonne d'oxygène de secours scellée. La jauge indique un remplissage complet. Utilisable pour restaurer votre réserve d'O₂ en cas de dépressurisation.

---

## Nœud `unlock` — rôle `gate`, beat `rising`, tension 4

*Nom de lieu tiré parmi :* « Passerelle de commandement » · « Salle de contrôle principale » · « Poste de pilotage » · « Centre de navigation » · « Salle des opérations » · « Poste de commandement » · « Salle de surveillance » · « Centre de contrôle » · « Tableau de bord principal » · « Poste de vigie » · « Salle de coordination » · « Centre de gestion » · « Poste de contrôle auxiliaire » · « Salle des instruments » · « Centre de commandement tactique » · « Poste de navigation avancé » · « Salle de contrôle de secours » · « Centre d'opérations » · « Poste de pilotage secondaire » · « Salle de contrôle des moteurs » · « Centre de coordination du vaisseau » · « Poste de commandement arrière »

### Ce que le joueur lit en entrant

> Le couloir s'arrête net sur une paroi épaisse comme un coffre-fort. Des griffures profondes marquent le métal, côté couloir : quelque chose a tenté de forcer le passage depuis l'autre côté. Sans succès. Ou avec succès, justement — impossible de savoir de quel côté la chose se trouvait quand elle a renoncé.

> Vous voyez autour de vous Panneau de sécurité, Porte blindée, Grille de ventilation.

*Sorties :* start, reveal

### Éléments

#### Panneau de sécurité  `security_panel`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Un lecteur de badge et un digicode. Le système n'accepte rien en dessous du niveau 3. Des griffures profondes marquent le métal autour : quelque chose a essayé de l'arracher.
- **après newState:inactive** · `activity=inactive power=powered` · via `descriptions`
  > L'écran est éteint, le lecteur ne répond plus. Mais les verrous de la cloison se sont rétractés.
- **HACK/REPROGRAM** (état=active, DC 12 INT)
  - réussite `newState=inactive` `flagSet=bulkhead_unlocked`
    > Vos doigts courent sur le digicode. Combinaison après combinaison — jusqu'à trouver une faille dans le firmware. Le voyant passe au vert. Les verrous de la cloison claquent en s'ouvrant.
  - échec
    > Le système détecte vos tentatives et verrouille temporairement le digicode. Trente secondes de lockout. Vous entendez quelque chose bouger dans les conduits au-dessus.
- **BREAK/FORCE_OPEN/KICK** (état=active, DC 14 FOR)
  - réussite `newState=inactive` `flagSet=bulkhead_unlocked`
    > Vous arrachez la plaque frontale du panneau. Les fils exposés — un court-circuit volontaire. Étincelles. Le verrou magnétique perd son alimentation. La cloison se déverrouille par défaut.
  - échec
    > Le panneau résiste — le métal est plus solide qu'il n'y paraît. Vos poings n'ont fait que des bosses superficielles.

#### Porte blindée  `bulkhead_door`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Quinze centimètres d'acier, verrous magnétiques engagés. Le panneau adjacent exige un niveau 3. Les griffures sont du côté couloir : quelque chose a essayé de passer.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > Les verrous sont rétractés. Le couloir au-delà s'enfonce dans l'obscurité, et l'air qui en vient est plus froid, plus sec. Un silence épais règne de l'autre côté.
- **OPEN/PUSH/MOVE_TO** (état=locked, flag=bulkhead_unlocked, auto)
  - réussite `newState=open`
    > Les verrous ont été désactivés. La porte blindée coulisse lourdement sur ses rails, révélant le couloir au-delà.
- **FORCE_OPEN/BREAK/KICK/PUSH/OPEN** (état=locked, DC 20 FOR)
  - réussite `newState=open`
    > Par un effort surhumain, vous parvenez à tordre suffisamment le cadre pour vous faufiler. Le métal grince et proteste — votre corps aussi.
  - échec
    > 15 centimètres d'acier blindé. Vous n'avez aucune chance à mains nues — il faut désactiver les verrous depuis le panneau, ou trouver un autre passage.

#### Grille de ventilation  `vent_cover`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Les vis sont oxydées, et le conduit derrière semble assez large pour s'y faufiler. Un courant d'air froid en sort : il vient de l'autre côté de la cloison.
- **après newState:open** · `integrity=intact openness=open lock=unlocked` · via `descriptions`
  > Le conduit s'enfonce dans le noir — étroit, poussiéreux, praticable. Des griffures marquent les parois. Vous n'êtes pas le premier à passer par là.
- **OPEN** (état=intact, DC 8 AGI)
  - réussite `newState=open`
    > Les vis rouillées cèdent une à une. La grille tombe avec un clang métallique. Le conduit de ventilation s'ouvre devant vous — étroit, sombre, mais praticable.
  - échec
    > Les vis sont trop rouillées — vos doigts glissent. La dernière vis refuse de bouger.
- **BREAK/KICK/FORCE_OPEN** (état=intact, DC 10 FOR)
  - réussite `newState=open`
    > Un coup de pied bien placé. La grille se tord et se détache du mur. Bruyant — mais efficace. Le conduit est ouvert.
  - échec
    > La grille vibre sous le coup mais tient. Vos orteils, eux, protestent.
- **USE** (état=intact, objet=standard_toolkit, auto)
  - réussite `newState=open`
    > Le tournevis de la trousse fait sauter les vis rouillées sans effort. La grille se détache proprement.

---

## Nœud `reveal` — rôle `midpoint`, beat `midpoint`, tension 6

*Nom de lieu tiré parmi :* « Cabines de l'équipage » · « Cabines résidentielles » · « Dortoirs de l'équipage » · « Quartiers d'officiers » · « Cabines de couchage » · « Zone de vie de l'équipage » · « Module résidentiel » · « Compartiments de repos » · « Quartiers du personnel » · « Cabines de navigation » · « Quartiers du capitaine » · « Cabines de l'ingénierie » · « Quartiers médicaux » · « Module de repos » · « Cabines visiteurs » · « Compartiments résidentiels » · « Zone de récupération » · « Cabines de garde » · « Quartiers de sécurité » · « Module de vie » · « Cabines de pont supérieur » · « Quartiers d'équipage arrière »

### Ce que le joueur lit en entrant

> Le bureau personnel du Capitaine Reeves. Des papiers froissés jonchent le sol, comme si quelqu'un avait cherché quelque chose en vitesse — ou voulu qu'on croie cela. Par la paroi vitrée, l'extérieur : le vaisseau dérive, des sections entières arrachées et exposées au vide. L'USS Meridian est en train de mourir.

> Vous voyez autour de vous Terminal du capitaine, Hublot d'observation.
> Parmi les débris, vous remarquez Datapad du capitaine.

*Sorties :* unlock, escalation

### Éléments

#### Terminal du capitaine  `captain_terminal`

- **initial (active)** · `activity=active power=powered` · via `descriptions`
  > Des entrées de journal, datées des quarante-huit heures avant la catastrophe, de plus en plus frénétiques. La dernière mentionne un « Projet ORACLE » et un dossier classifié.
- **après newState:searched** · `activity=active power=powered contents=searched` · via `descriptions`
  > Les tiroirs sont ouverts, une petite clé magnétique a été trouvée sous des papiers froissés. Les entrées restent lisibles à l'écran, et le Projet ORACLE hante chaque ligne.
- `readableContent` (748 car.)
- **READ/EXAMINE/SCAN** (état=searched, auto)
  - réussite ⚠ `sans newState` `flagSet=oracle_revealed`
    > Vous relisez les entrées du terminal. Reeves avait compris : le spécimen Alpha n'était pas un sujet d'étude mais une arme biologique commandée par le Commandement. Projet ORACLE. L'équipage entier servait de terrain de test. La clé EVA que vous avez trouvée était son plan de secours.
- **READ/EXAMINE/SCAN** (auto)
  - réussite ⚠ `sans newState` `flagSet=oracle_revealed`
    > Vous parcourez les fichiers du Projet ORACLE. L'histoire se dévoile — un organisme extraterrestre transformé en arme biologique. Le capitaine Reeves savait. L'équipage entier a été sacrifié pour un prototype militaire.
- **HACK/EXAMINE** (état=active, DC 10 INT)
  - réussite `newState=searched` `flagSet=oracle_revealed`
    > En fouillant les fichiers système, vous tombez sur un dossier personnel verrouillé. À l'intérieur — des photos de famille du capitaine, et dans un tiroir déverrouillé par l'accès : une petite clé magnétique étiquetée "Casier EVA — Pont 3".
  - échec
    > Le système de sécurité résiste à vos tentatives. Vous pouvez lire les rapports ORACLE, mais les fichiers personnels du capitaine restent verrouillés.

#### Hublot d'observation  `viewport`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Dehors, le vaisseau dérive : des sections entières arrachées, des ponts ouverts au vide. Des débris flottent dans le silence.

### Objets

#### Datapad du capitaine  `captain_log_datapad`

- description
  > Le dernier journal du Capitaine Reeves. L'écran affiche la dernière entrée — tremblante, écrite à la hâte.

#### Clé du casier EVA  `EVA_suit_locker_key` *(caché)*

- description
  > Une petite clé magnétique. L'étiquette indique "Casier EVA — Pont 3".
- **USE sur `EVA_suit_locker`** ⚠ `sans newState`
  > La clé magnétique s'insère parfaitement. Le verrou claque — le casier EVA s'ouvre, révélant une combinaison spatiale intacte.

---

## Nœud `escalation` — rôle `escalation`, beat `escalation`, tension 8

*Nom de lieu tiré parmi :* « Compartiment technique principal » · « Salle de maintenance » · « Zone de réparation » · « Atelier de l'ingénierie » · « Compartiment des systèmes » · « Salle des machines » · « Zone d'entretien » · « Atelier de mécanique » · « Compartiment électrique » · « Salle de l'ingénierie avancée » · « Zone de diagnostic technique » · « Atelier de soudure » · « Compartiment des circuits » · « Salle de contrôle des systèmes » · « Zone de maintenance préventive » · « Atelier d'assemblage » · « Compartiment de réparation d'urgence » · « Salle des équipements » · « Zone de mécanique avancée » · « Atelier de navigation » · « Compartiment de l'ingénierie secondaire » · « Salle de diagnostic des pannes »

### Ce que le joueur lit en entrant

> L'air est rare. Chaque respiration compte, et vous les comptez. Les machines qui tenaient cette section en vie sont en miettes — griffures profondes, câbles arrachés. La créature est venue ici en premier, et elle savait ce qu'elle faisait. Le passage vers le pont inférieur est droit devant.

> Vous voyez autour de vous Casier de combinaison EVA, Panneau de support vie, Valve de reroutage O₂, Conduit d'énergie.

*Sorties :* reveal, boss

### Éléments

#### Casier de combinaison EVA  `EVA_suit_locker`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Verrouillé, et la serrure n'accepte qu'une clé magnétique précise. À travers la vitre, une combinaison spatiale intacte sur son support.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > La combinaison blanche repose sur son support, casque et réserve d'oxygène en place. L'étiquette annonce trente minutes d'autonomie.
- ⚠ **INATTEIGNABLE** `descriptions.empty`
  > Le support est nu, les attaches pendent ouvertes. Du verre craque sous vos pieds si vous avez forcé l'ouverture.
- **FORCE_OPEN/BREAK** (état=locked, DC 12 FOR)
  - réussite `newState=open`
    > La vitre du casier explose sous le choc. Vous dégagez les éclats — la combinaison EVA est intacte à l'intérieur.
  - échec
    > La vitre se fissure mais tient. Le casier est solide.
- **HACK/UNLOCK** (état=locked, DC 11 INT)
  - réussite `newState=open`
    > Le verrou électronique cède à votre manipulation. Le casier s'ouvre — la combinaison EVA vous attend.
  - échec
    > Le système de verrouillage résiste. Il faudra la clé ou plus de force.

#### Panneau de support vie  `life_support_panel`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Des griffures profondes ont arraché les câbles. L'écran clignote : « O₂ SYSTÈME — DÉFAILLANCE CRITIQUE ». Réparable, mais pas simplement.
- **après newState:intact** · `integrity=intact` · via `descriptions`
  > L'écran affiche « O₂ — STABILISÉ — 43 % CAPACITÉ ». Le ventilateur tourne, l'air circule. Ce n'est pas idéal, mais la chute est stoppée.
- **REPAIR** (état=damaged, DC 14 INT)
  - réussite `newState=intact` `flagSet=o2_stabilized`
    > Câble par câble, vous reconnectez le système. Le ventilateur redémarre — l'air frais afflue. L'écran affiche "O₂ STABILISÉ". Vous avez gagné du temps.
  - échec
    > Un câble mal rebranché — étincelles. Le système crashe et redémarre. Toujours en défaillance. Vous toussez dans l'air qui s'appauvrit.
- **HACK/UNLOCK** (état=damaged, DC 12 INT)
  - réussite `newState=intact` `flagSet=o2_stabilized`
    > Vous ne pouvez pas réparer les câbles arrachés, mais vous pouvez contourner le circuit endommagé. Le système redémarre en mode dégradé — 30% de capacité au lieu de 43%. Mieux que rien. La chute d'O₂ ralentit considérablement.
  - échec
    > Le circuit est trop endommagé pour un bypass propre. Des étincelles jaillissent. Il faudra une vraie réparation.
- **FORCE_OPEN/REPAIR** (état=damaged, DC 13 FOR)
  - réussite `newState=intact` `flagSet=o2_stabilized`
    > Vous arrachez les câbles morts, dénudez les fils avec les dents, et reconnectez le circuit à mains nues. Un arc électrique vous mord les doigts — mais le ventilateur redémarre. L'air afflue. Méthode brute, résultat efficace.
  - échec
    > Les câbles résistent. Un choc électrique vous repousse — le circuit de support vie est plus complexe qu'il n'y paraît.

#### Valve de reroutage O₂  `o2_reroute_valve`

- **initial (closed)** · `openness=closed` · via `descriptions`
  > Valve de reroutage d'O₂ — fermée. En la tournant, vous pourriez sceller les sections non-essentielles et concentrer l'oxygène restant dans les zones habitées.
- **après newState:open** · `openness=open lock=unlocked` · via `descriptions`
  > La valve est ouverte. L'oxygène est rerouté vers les sections essentielles. Des bruits de portes hermétiques qui se ferment résonnent dans les couloirs lointains.
- **OPEN/USE/ACTIVATE** (état=closed, DC 12 FOR)
  - réussite `newState=open` `flagSet=sections_sealed`
    > La valve résiste puis cède. Un grondement sourd parcourt le vaisseau — les portes hermétiques se ferment dans les sections non-essentielles. L'air ici semble un peu plus respirable.
  - échec
    > La valve est grippée par la corrosion. Vous n'arrivez pas à la tourner — vos mains glissent sur le métal humide.

#### Conduit d'énergie  `power_conduit`

- **initial (damaged)** · `integrity=damaged` · via `descriptions`
  > Éventré. Des câbles pendent, des étincelles jaillissent par intermittence. Une barre métallique semble récupérable dans les décombres.
- **après newState:broken** · `integrity=broken activity=inactive power=unpowered` · via `descriptions`
  > Les câbles pendent, inertes — plus d'étincelles, plus de courant. L'emplacement de la barre métallique est vide, et le pont inférieur n'a plus d'alimentation de secours.
- **BREAK/TAKE/PULL** (état=damaged, DC 8 FOR)
  - réussite `newState=broken`
    > Vous arrachez une barre métallique solide des décombres du conduit. Lourde, rigide — ça fera une arme improvisée acceptable.
  - échec
    > Une étincelle vous brûle la main au moment où vous agrippez la barre. Vous lâchez prise.

### Objets

#### Combinaison EVA  `eva_suit` *(caché)*

- description
  > Intacte. Trente minutes d'oxygène propre, et de quoi tenir contre le vide et les écarts de pression.

#### Arme improvisée  `makeshift_weapon` *(caché)*

- description
  > Une barre métallique arrachée au conduit d'énergie. Lourde et solide — pas l'arme la plus élégante, mais elle fera mal.

---

## Nœud `boss` — rôle `climax`, beat `climax`, tension 10

*Nom de lieu tiré parmi :* « Sas principal » · « Sas de secours » · « Sas d'embarquement » · « Sas EVA » · « Sas de décontamination » · « Sas d'urgence » · « Sas de transfert » · « Sas d'amarrage » · « Sas secondaire » · « Sas de fret » · « Sas de maintenance extérieure » · « Sas de sortie » · « Sas blindé » · « Sas de quarantaine » · « Sas de convoyage » · « Sas d'accès extérieur » · « Sas de pressurisation » · « Sas de survie » · « Sas arrière » · « Sas central » · « Sas d'évacuation » · « Sas de départ EVA »

### Ce que le joueur lit en entrant

> L'air est presque irrespirable. La sortie est là, à quelques mètres, et entre elle et vous : la créature. Le Spécimen Alpha, Projet ORACLE. Biomasse noire, griffes d'acier organique, et dans ses yeux trop humains une intelligence qui prend son temps. C'est elle ou vous.

> Vous voyez autour de vous Écoutille du pod d'évasion, Levier de largage cargo, Panneau de brèche coque.

*Sorties :* escalation, resolution

### Éléments

#### Écoutille du pod d'évasion  `escape_pod_hatch`

- **initial (locked)** · `lock=locked openness=closed` · via `descriptions`
  > Un lecteur de badge contrôle l'accès, niveau 3 requis. Au-delà : la capsule de sauvetage. La sortie.
- **après newState:open** · `lock=unlocked openness=open` · via `descriptions`
  > L'écoutille est ouverte. L'intérieur exigu du pod d'évasion est visible — un siège, des commandes minimales, un hublot. La liberté.
- **HACK/UNLOCK/REPROGRAM** (état=locked, DC 14 INT)
  - réussite `newState=open` `flagSet=pod_hatch_open`
    > Le firmware du lecteur cède sous vos doigts experts. L'écoutille déverrouille — les joints pneumatiques sifflent. Le pod d'évasion vous attend.
  - échec
    > Le système de sécurité du pod est plus robuste que le reste du vaisseau. Vos tentatives échouent.
- **FORCE_OPEN/BREAK/KICK** (état=locked, DC 16 FOR)
  - réussite `newState=open` `flagSet=pod_hatch_open`
    > Les joints cèdent sous un effort titanesque. L'écoutille s'ouvre dans un grincement de métal torturé. Le pod est accessible.
  - échec
    > L'écoutille ne bouge pas d'un millimètre. Scellée hermétiquement — il faudra un badge ou pirater le lecteur.
- **OPEN/MOVE_TO** (état=locked, flag=pod_hatch_open, auto)
  - réussite `newState=open`
    > Le badge a déjà déverrouillé l'écoutille. Vous poussez — elle s'ouvre. Le pod d'évasion est là.
- **TALK** (état=locked, DC 14 CHA)
  - réussite ⚠ `sans newState` `flagSet=creature_distracted`
    > Vous parlez. Pas des mots — des sons. Graves, réguliers, comme un battement de cœur. La créature s'immobilise. Ses yeux trop humains vous fixent avec une curiosité terrifiante. Un instant de flottement — puis elle recule d'un pas. Juste assez pour que vous atteigniez l'écoutille. Elle ne vous laisse pas partir — elle vous observe partir.
  - échec
    > La créature siffle et avance d'un pas. Votre voix ne fait que l'agiter. Communiquer avec une arme biologique programmée pour tuer — mauvaise idée, en fin de compte.
- **OPEN/HACK/ACTIVATE** (état=locked, flag=creature_distracted, DC 8 INT)
  - réussite `newState=open` `flagSet=pod_hatch_open`
    > La créature vous observe, immobile. Vos doigts tremblent sur le lecteur — mais cette fois, pas d'interférence. Le firmware cède. L'écoutille s'ouvre. Vous ne regardez pas la créature en entrant dans le pod.
- **EXAMINE** (état=locked, DC 12 PER)
  - réussite ⚠ `sans newState` `flagSet=hatch_bypass_found`
    > En examinant l'écoutille de près, vous remarquez que le panneau de maintenance latéral n'est pas soudé — juste clipsé. Derrière, les câbles du mécanisme de verrouillage sont accessibles. Un court-circuit bien placé suffirait.
- **OPEN/HACK/ACTIVATE** (état=locked, flag=hatch_bypass_found, DC 6 INT)
  - réussite `newState=open` `flagSet=pod_hatch_open`
    > Le panneau de maintenance se déclipse. Deux fils, un court-circuit — l'écoutille s'ouvre en silence. Pas besoin de badge quand on sait regarder.

#### Levier de largage cargo  `cargo_jettison_lever`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Levier de largage d'urgence de la soute. Protégé par un cache de sécurité rouge. Si la créature est dans la soute quand vous tirez... la soute entière est éjectée dans le vide.
- **après newState:active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > Le levier est en position basse. Les portes de la soute se sont ouvertes sur le vide — tout ce qui n'était pas arrimé a été aspiré.
- **PULL/ACTIVATE/USE/PUSH** (état=intact, DC 10 FOR)
  - réussite `newState=active` `flagSet=cargo_jettisoned`
    > Vous arrachez le cache de sécurité et tirez le levier de toutes vos forces. Un grondement assourdissant — les portes de la soute s'ouvrent sur le vide. Tout est aspiré — y compris la créature. Ses hurlements se perdent dans le silence de l'espace.
  - échec
    > Le levier résiste — le mécanisme est grippé. Vous sentez qu'il bouge, mais pas assez.
- **HACK/UNLOCK** (état=intact, DC 12 INT)
  - réussite `newState=active` `flagSet=cargo_jettisoned`
    > Le levier est mécanique, mais le cache de sécurité est électronique. Vous court-circuitez le verrouillage du cache — il saute. Ensuite, le levier tombe presque tout seul. Les portes de la soute s'ouvrent sur le vide. La créature hurle — puis le silence.
  - échec
    > Le verrouillage du cache résiste à votre manipulation. Le mécanisme de sécurité est plus robuste que prévu.

#### Panneau de brèche coque  `hull_breach_panel`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Panneau de contrôle des joints de coque. L'écran affiche les zones pressurisées et dépressurisées du vaisseau. Un protocole d'urgence permet de forcer une décompression localisée.
- **après newState:active** · `integrity=intact activity=active power=powered` · via `descriptions`
  > « DÉCOMPRESSION EN COURS — SOUTE », en rouge clignotant. Par les hublots, les portes de soute s'ouvrent : l'air, les débris, tout part dans le vide.
- **HACK/ACTIVATE/USE/REPROGRAM** (état=intact, DC 15 INT)
  - réussite `newState=active` `flagSet=cargo_depressurized`
    > Le protocole de brèche s'active — les joints de coque de la soute se fissurent volontairement. Ce n'est pas une éjection franche comme le levier — c'est une hémorragie lente. L'air s'échappe, la pression chute. Vous sentez vos oreilles se boucher. La créature hurle — un son presque humain — avant d'être aspirée centimètre par centimètre vers la brèche. Ça prend plus longtemps. C'est pire.
  - échec
    > Le système de sécurité bloque votre tentative. Accès refusé — les protocoles anti-décompression sont robustes.
- **BREAK/FORCE_OPEN** (état=intact, DC 13 FOR)
  - réussite `newState=active` `flagSet=cargo_depressurized`
    > Vous fracassez le panneau. Les circuits exposés court-circuitent — et déclenchent le protocole de brèche. La soute se dépressurise violemment.
  - échec
    > Le panneau résiste à vos coups. Un fragment de métal se détache et vous entaille le bras. Le boîtier est plus renforcé qu'il n'y paraît.

---

## Nœud `resolution` — rôle `epilogue`, beat `resolution`, tension 3

*Nom de lieu tiré parmi :* « Coursive principale » · « Coursive latérale » · « Couloir de service » · « Couloir résidentiel » · « Passage étroit » · « Conduit de maintenance » · « Coursive arrière » · « Passerelle suspendue » · « Tunnel de câbles » · « Coursive pressurisée » · « Corridor est » · « Corridor ouest » · « Couloir d'accès » · « Passage de secours » · « Coursive commerciale » · « Couloir technique » · « Passerelle de communication » · « Passage blindé » · « Coursive de fuite » · « Tunnel de survie » · « Corridor principal » · « Passerelle inférieure »

### Ce que le joueur lit en entrant

> Le sas se referme derrière vous. Le silence — pas celui de la mort, celui de la sécurité. Le pod s'éjecte avec un souffle pneumatique, et l'USS Meridian rapetisse dans l'obscurité jusqu'à n'être qu'un point de lumière avalé par le noir. Quelque part là-dedans, le Spécimen Alpha attend le prochain visiteur. Plus jamais vous.

> Vous voyez autour de vous Hublot du pod.

*Sorties :* boss

### Éléments

#### Hublot du pod  `pod_viewport`

- **initial (intact)** · `integrity=intact` · via `descriptions`
  > Le vaisseau rapetisse dans l'obscurité, un point de lumière de moins en moins distinct. C'est fini.

