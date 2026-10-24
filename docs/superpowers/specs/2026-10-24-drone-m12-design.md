# M-12 refondu : le chariot trop lourd et le drone à retrouver (#270, #271) — conception

> **Statut :** proposition, à approuver par le porteur. Conversation du 2026-10-24 ; réponses du porteur citées en annexe A.
> **Zones :** orange pour le moteur (drone), le format des morceaux, l'assembleur des stations, le vérificateur et le catalogue ; verte pour les textes et la bible.
> **Sources :** issues #270 et #271 (rapports de partie, station `g3-ol-m08-m12-m01-m03-reserve-0`) ; D-084, D-268, D-304 à D-307, D-319 ; C-03, C-06, C-07 ; [13 §3 M-12](../../13-morceaux-lancement.md) ; [grandes stations](2026-10-18-grandes-stations-design.md) §6.5.

## 1. Intention

Deux retours de partie disent la même chose : M-12 donne la solution avant le problème, puis explique mal le problème.

- #270 : « On peut envoyer le drone tenir la poignée sans savoir ce que c'est ni ce que ça fait. » On entre par l'atelier du drone, et son menu propose déjà d'aller tenir le frein.
- #271 : « Lorsqu'on bouge le chariot, rien ne nous dit que ça permet d'accéder à la nouvelle pièce. »

Le porteur juge aussi le mécanisme peu naturel : un frein qu'un drone doit tenir n'est « pas évident à comprendre du premier abord ». Un chariot trop lourd, que seul un drone de manutention peut tirer, l'est.

La partie voulue :

1. On arrive au palier. Le texte dit clairement que le chariot barre le passage vers la pièce voisine, celle par où l'on avance vers la capsule ou vers l'une des deux branches de l'ordre libre.
2. Le menu du chariot ne permet pas de le pousser. Sa description dit qu'il est trop lourd pour être bougé à la main et qu'il faut un drone de manutention.
3. Le joueur comprend qu'il ne s'en sortira pas seul. Il revient vers un drone qu'il a déjà croisé sans comprendre son rôle, ou il explore pour en trouver un. Le drone n'est pas toujours au même endroit.
4. Il met le drone en route. Le drone roule seul jusqu'au chariot, en faisant du bruit, et s'arrête devant chaque porte fermée. Le joueur doit lui ouvrir le passage tout en protégeant son trajet de la créature.
5. Le chariot tiré sur le côté, le passage est clairement libre.

**Réussi si :**
- un joueur qui n'a pas vu le chariot ne voit dans le menu du drone aucune action qui parle du chariot ;
- un joueur arrivé au palier sait, sans fouiller dans les menus, qu'il ne pourra pas passer tant que le chariot est là, et qu'il lui faut un drone ;
- d'une partie à l'autre, le drone n'est pas toujours au même endroit ;
- une fois le chariot dégagé, le joueur sait qu'il peut passer ;
- le trajet du drone pose un vrai choix : ouvrir une porte pour lui, c'est aussi laisser passer son bruit.

## 2. Buts, non-buts, anti-buts

**Buts :**
- un chariot qui bloque une porte nécessaire pour avancer, avec des textes clairs ;
- un drone qui, dans les grandes stations, peut se trouver n'importe où avant le chariot, y compris derrière l'obstacle d'un autre morceau ;
- un drone qui roule seul à travers la station et attend devant les portes fermées.

**Non-buts :**
- le drone n'ouvre aucune porte, ne transporte rien, ne combat pas et ne suit pas le passager ;
- le passager ne porte jamais le drone : « Sinon, autant ramasser une pince par terre pour maintenir le frein. » ;
- aucun nouvel objet ni consommable ;
- aucune réécriture de la créature : elle entend le drone et le renverse comme aujourd'hui.

**Anti-buts (échec même si le code marche) :**
- le menu du drone annonce le chariot avant que le joueur l'ait vu ;
- un message prévient que le drone est bloqué ou renversé : le joueur le voit sur la carte, sans qu'on lui tienne la main ;
- un drone posé là où il ne peut pas rejoindre le chariot, ou derrière le chariot ;
- une station publiée qui ne se prouve plus (D-084).

## 3. Ce que le porteur a décidé

### 3.1 Le chariot

- Il bloque une porte qu'il faut franchir pour avancer : la porte qui mène vers la suite de la station, c'est-à-dire la capsule, le morceau suivant ou l'une des deux branches de l'ordre libre.
- Il ne se pousse pas à la main. La raison est dans le monde : il est trop lourd, seul un drone de manutention peut le tirer.
- **Le frein et la poignée disparaissent.** Il n'y a plus de geste « tenir », plus de maintien à distance, plus de coopération à deux endroits. Le drone fait seul tout le travail sur le chariot.
- Les textes, en arrivant au palier, disent que le chariot barre le passage vers la pièce voisine. Une fois le chariot dégagé, ils disent que le passage est libre (#271).

### 3.2 Le drone

- **Activation.** On peut toujours le regarder. L'action qui l'envoie vers le chariot n'apparaît qu'une fois le chariot vu par le passager. Avant, aucune action ne parle du chariot.
- **Trajet.** Il roule seul jusqu'au chariot, sans que le passager l'accompagne. Rails au plafond ou roues, le choix ne change que le texte.
- **Portes.** Devant une porte fermée, il s'arrête et attend que le passager l'ouvre. Il ne l'ouvre jamais lui-même.
- **Bruit.** Il fait du bruit en roulant et en tirant le chariot, avec les règles de son ordinaires (C-03 §4.2).
- **Panne.** La créature qui l'entend peut le renverser, sur le trajet comme au palier. Le passager doit alors aller le remettre en route là où il est tombé, en deux gestes (D-305 conservée).
- **Arrêt.** Le bouton d’arrêt est conservé (`arreter_drone`, `reprendre_drone`). Dans sa pièce, le passager peut le faire taire, puis le relancer, pour protéger son trajet quand la créature approche.
- **Vitesse.** Le drone met deux actions du monde pour passer d'une pièce à la suivante ; le passager n'en met qu'une. Le joueur peut donc le suivre ou le rattraper pour l'arrêter.
- **Placement.** Dans une grande station, il peut être loin du morceau, derrière d'autres obstacles comme le sas de sécurité (M-11), dans n'importe quelle pièce accessible avant le chariot. Il ne peut jamais être placé à un endroit d'où il devrait franchir un passage infranchissable pour lui : la passerelle au-dessus du vide (M-08), la grille haute (M-02) ou, par prudence, un panneau caché ou étroit (M-05). Ce sont les passages que le rail refuse déjà (`validerDrones` : gouffre, étroit, haut, caché).
- **Carte.** Son pictogramme vert reste celui de D-307.

## 4. Mes choix (à contester à la lecture)

1. **Chemin du drone.** Il prend le plus court chemin parmi les passages qu'il peut franchir, que les portes soient ouvertes ou fermées. Il avance d'une pièce toutes les deux actions engagées du monde (§3.2), et s'arrête devant la première porte fermée de ce chemin. Il ne cherche pas de détour par une porte ouverte. Le joueur peut ainsi prévoir son trajet sur la carte. Les égalités se départagent dans l'ordre fixe du monde.
2. **Portes verrouillées.** Une porte qui exige une carte ou une commande est une porte fermée comme une autre : le drone attend que le passager l'ouvre.
3. **Dangers.** Le feu, le vide, le froid et la gravité coupée n'arrêtent pas le drone (D-306 conservée). Le seul obstacle qu'il ne franchit jamais est son propre chariot.
4. **Silence à l'arrêt.** Il ne fait pas de bruit en veille, devant une porte fermée, arrêté par le bouton, renversé ni une fois sa tâche finie. Il fait du bruit pendant ses deux actions de déplacement d'une pièce à l'autre. Arrêté puis relancé, il reprend son trajet là où il était.
5. **Traction.** Arrivé au palier, il tire le chariot dans son logement latéral à l'action suivante, en faisant du bruit, puis sa tâche est finie. S'il est renversé avant, le chariot ne bouge pas.
6. **Aucun message à distance.** On ne raconte rien de ce qui se passe hors de la pièce du passager (C-06 §5). Il reste deux exceptions, qui existent déjà : le bruit qui s'arrête quand on l'entend (`drone_bruit_arrete`) et le pictogramme sur la carte.
7. **« Le chariot est vu ».** Il suffit d'être passé dans la pièce du palier. L'information vient de l'état rejoué et ne change pas le format de sauvegarde, si l'état le permet déjà. Sinon, le constructeur le signale.
8. **Placement dans une grande station.** C'est plus large que les clés dispersées (D-319), qui restent dans la zone avant de leur morceau et du précédent :
   - la pièce d'origine du drone, dans M-12, reste un tirage possible ;
   - les autres candidates sont toutes les pièces de la station atteignables avant le chariot : annexes, pièces des autres morceaux, vestibule, place de la créature, dans n'importe quelle zone ;
   - elles peuvent se trouver derrière l'obstacle d'un morceau précédent, ou dans l'autre branche de l'ordre libre ;
   - les étiquettes d'annexe ne s'appliquent pas ;
   - une pièce peut accueillir à la fois le drone et une clé ;
   - seule condition : un chemin vers le palier que le drone peut franchir (§3.2) ;
   - le tirage est uniforme, sur une sous-graine propre ;
   - aucune borne de distance a priori, puisque le porteur accepte « même loin du morceau ». Le constructeur mesure la durée des parties et la montre au porteur. Une borne n'est ajoutée que si le porteur la demande.
9. **Placement dans une petite station.** M-12 est aussi tiré dans les petites stations (`m01-m12-m03-reserve`, etc.). Le même tirage s'applique, sur la graine de la station : le drone change de pièce à chaque partie, petites stations comprises (choix du porteur, annexe A). Faute de candidate, le drone reste dans sa pièce d'origine.
10. **Le morceau rétrécit.** Il reste une pièce d'entrée, le palier du chariot, la réserve où la créature peut attendre (place inchangée), la pièce d'origine du drone et le quai, derrière le chariot. Le poste de commande et la galerie de détour disparaissent. Le quai reste, parce qu'en ordre libre c'est là qu'est posée la commande de cloison de la branche (`PIECES_COMMANDE … ?? sortie.piece`, `content/stations/catalogue.ts`) : le chariot bloque donc l'avancée en chaîne comme en ordre libre, ce que demande le porteur. Contrainte : l'entrée n'est pas la pièce du drone, pour qu'on ne le découvre pas forcément avant le palier.
11. **Carte.** Le code suit déjà en direct, hors de vue, un drone envoyé (`engine/carte.ts`, phases « trajet » et « maintien »). Ce suivi reste valable pour toute la tâche : en route, devant une porte fermée, en train de tirer le chariot et renversé, jusqu'à ce que la tâche soit finie. Le joueur voit ainsi sur la carte l'endroit où son drone s'est arrêté ou est tombé, comme décrit au porteur, sans qu'aucun message l'en prévienne. D-307 est précisée dans ce sens.
12. **Preuve.** Une grande station publiée est prouvée avec la place de drone que sa graine tire, comme pour les clés. Une petite station vaut pour toutes ses graines : elle est prouvée avec **chacune** de ses places de drone possibles, et n'est publiée que si toutes se prouvent. Le porteur accepte que `check:stations` dure plus longtemps ; la durée mesurée est donnée dans la PR.
13. **Textes.** Le drone est un drone de manutention à roues. Les gestes de panne deviennent « redresser » et « relancer », et ne parlent plus de rail. Le message de Clara et la bible (`docs/17-univers.md`) sont réécrits pour le chariot trop lourd. Tous ces textes restent à faire valider par le porteur (C-07).

## 5. Décisions touchées

- **D-304 remplacée** : la coopération à deux endroits disparaît. Le chariot ne se déplace qu'avec le drone.
- **D-305 précisée** : la panne en deux gestes est conservée ; « replacer sur le rail » devient « redresser ».
- **D-306 modifiée** : le drone n'est plus un équipement local. Il traverse la station, mais ne transporte rien, n'ouvre rien et ne combat pas.
- **D-307 précisée** : le pictogramme est conservé, et le drone envoyé reste suivi hors de vue jusqu'à la fin de sa tâche, renversé compris (§4.11). Sa limite sur M-01 et M-02 doit être prouvée à nouveau : le bruit du drone attirait la créature en arrière, et ce n'est peut-être plus vrai avec le nouveau trajet.
- **D-319 élargie** pour le drone : non portable, placé hors de la zone avant de son morceau, avec un chemin franchissable.
- Les nouvelles décisions prennent les numéros libres au moment de la PR. D-365 est la dernière dans `main` au 2026-10-24 ; vérifier les PR ouvertes.

## 6. Preuves et conséquences

- `check:stations` prouve chaque station publiée avec M-12 : chaque place possible pour une petite station, la place tirée pour une grande (§4.12).
- Le tirage du drone change les grandes stations publiées : `VERSION_GENERATEUR` augmente et `publier:grandes` est relancé (plus d'une heure, en arrière-plan).
- Les petites stations avec M-12 sont prouvées à nouveau, et la liste de D-268 et D-307 réexaminée.
- Il faut un parcours de référence (`content/m-12/parcours.ts`), réécrit avec l'ordre « chariot vu, puis drone, portes ouvertes, chariot dégagé ».
- Il faut des tests du moteur pour : l'action absente avant que le chariot soit vu, le déplacement en deux actions, l'arrêt et la reprise du trajet, l'attente devant une porte fermée, la reprise du trajet après ouverture, le bruit en route, le renversement en route, et l'absence de traction une fois renversé.
- **Sauvegarde** : les phases du drone changent (« maintien » disparaît, la traction apparaît). Une partie en cours avec M-12 enregistrée avant cette version risque de ne pas se reprendre. Il faut le dire dans la PR et suivre la règle déjà appliquée aux changements de journal.
- Il faut des captures des étapes au palier et au drone.
- Il faut une partie sur téléphone, que seul le porteur fait : elle n'est jamais déclarée par un agent.

## 7. Laissé au constructeur

- Le découpage en commits et en livraisons ; le format exact des qualités du drone et du chariot dans `DefObjet`. On garde des règles qui lisent des qualités, jamais des noms.
- Le calcul du plus court chemin, et sa place dans le moteur ; le moteur reste sans dépendance.
- La mesure de durée des parties avec le nouveau placement, montrée au porteur (§4.8).
- La disposition exacte des pièces restantes de M-12, dans les contraintes du §4.10.
- Écarter au tirage les places d'où un drone qui ne fait jamais de détour resterait bloqué (porte qui ne se manœuvre que d'un côté, par exemple), ou les laisser refuser par le vérificateur.
- Le plafond d'états du vérificateur pour M-12 (aujourd'hui 600 000, D-307), s'il doit changer ; à dire dans la PR.

## Annexe A. Réponses du porteur, mot pour mot

- « la première pièce dans laquelle on arrive, c'est la pièce où il y a le drone. […] On arrive devant la solution sans avoir compris quel était le problème. »
- « une fois qu'on va dans la pièce du chariot, c'est pas très clair et pas bien expliqué que le chariot bloque le passage »
- « Le drone pourrait se retrouver dans d'autres pièces de la station, même loin du morceau. »
- « Soit toute la station est équipée de rails au plafond, soit on transforme le drone en un drone roulant. Mais en tout cas, on ne doit pas le transporter nous-mêmes. »
- « C'est une bonne idée, ça, de devoir ouvrir le passage au drone. Vu qu'il fait du bruit, il faut arriver à protéger son parcours. »
- « il faut que le palier du chariot soit une "porte fermée" qui bloque le passage […] Que ce soit l'accès direct à la capsule ou bien une des deux branches du choix libre. »
- « on pourrait plutôt dire que le chariot ne peut pas être poussé à la main et qu'il y a besoin d'un drone de manutention pour tirer le chariot qui est beaucoup trop lourd »
- « rien n'empêche ce drone de se trouver derrière d'autres portes, telles que le sas de sécurité. […] Peut-être pas la passerelle qui a la planche fragile, et pas la grille »
- Sur la description résumée : « ça paraît bien ».
- « On peut mettre un bouton d'arrêt, mais par contre, il faut s'assurer de pouvoir le suivre ou bien le rattraper. Peut-être que le drone peut mettre deux actions à bouger pendant que nous, on n'en met qu'une seule. »
- Sur les petites stations, entre une pièce fixe, une place fixe par combinaison et une place qui change à chaque partie (vérification plus longue) : « Change à chaque partie ».
