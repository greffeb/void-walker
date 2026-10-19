# Grandes stations habitées : catalogue, clés dispersées, butin et lore (#202, #205, #206, #207, #209) — conception

> **Statut :** conception relue par quatre relecteurs indépendants (constructeur, code, game design, décisions) ; réponses du porteur du 2026-10-18 et du 2026-10-19 intégrées (§3, annexe A). À approuver par le porteur, avec les deux choix de l'agent D-302 et D-303 et la validation de D-276 et D-279 (§3.3).
> **Zones :** orange pour le moteur, l'assembleur, le format des morceaux, le vérifieur, l'appli et chaque seuil d'équilibrage (montré au porteur avec ses mesures) ; verte pour les textes, les documents et la bible. Le format de sauvegarde ne change pas, et un test le prouve ; sinon, zone rouge et essai manuel.
> **Sources :** issues #202, #205, #206, #207, #209 ; D-008, D-014, D-016, D-031, D-046, D-048, D-051, D-068, D-078, D-079, D-083, D-084, D-098, D-100, D-111, D-119, D-161, D-162, D-169, D-172, D-205 à D-208, D-241 à D-245, D-249, D-252 à D-260, D-265, D-268 à D-270, D-275 à D-281 ; C-02, C-05, C-06, C-07, C-08, C-10 ; 12 §1, §3, §4 ; 13 §3, §7 ; 14 §5 ; maquette `docs/maquette/documents.html`.

## 1. Intention

Le porteur a décrit la partie qu'il veut vivre en 25 minutes. Elle se déroule en trois temps :

1. **L'angoisse.** On explore un lieu mystérieux et inquiétant. Les traces (sang, désordre, odeurs) et les signes réguliers (bruits, documents, messages d'équipiers morts) font croire qu'une embuscade peut venir à tout moment.
2. **La recherche.** On fouille la station pour trouver des « clés » qui ouvrent des « portes » : salles à énigme, obstacles, portes coincées à contourner. La menace reste en fond.
3. **La poursuite.** On tombe sur l'ennemi, ou lui sur nous. Il poursuit, enfonce les portes qu'on ferme derrière soi ; il faut ruser pour le semer, le contourner ou le piéger.

On arrive à l'objectif indemne ou blessé.

Ce lot sert les trois temps :

| Temps | Ce qui le porte |
| --- | --- |
| Angoisse | Pièces sans obstacle (#206) ; traces vraies le long de la piste de la créature ; bruits de station réguliers dans le récit ; documents du lore (#209) dont le récit s'aggrave le long du trajet |
| Recherche | Station deux fois plus grande, au moins deux obstacles matériels et un final (#205) ; clés dispersées dans des pièces plausibles, jamais derrière leur obstacle, avec leur note de rangement devant l'obstacle (#202) ; indices dans les documents |
| Poursuite | Créature placée tard, dans le dernier chemin ou le final ; portes de boucle près d'elle pour tourner autour d'un bloc de pièces ; impasses reconnaissables, qui deviennent des pièges ; butin (#207) pour encaisser un coup de plus ou faire glisser la créature |

La poursuite elle-même existe déjà dans le code. Après le premier contact, la créature entend les pas, suit le passage qu'elle a vu prendre, fouille, et enfonce une porte fermée en deux réactions (D-276, D-279, à valider, §3.3). Ce qui manque, ce sont les boucles : au niveau des morceaux, la station est un arbre, et l'on ne peut que fuir dans une impasse.

**Réussi si :**
- une partie de découverte dure 15 à 20 minutes d'écran allumé (D-280) ;
- un joueur qui connaît tous les morceaux doit encore fouiller et choisir ;
- la difficulté reste celle d'aujourd'hui ;
- presque chaque partie comporte une rencontre ;
- chaque pièce sans obstacle porte quelque chose (§7.3) ;
- le porteur juge l'écriture de qualité.

**Échec même si ça tourne :**
- une station publiée sans preuve, ou une clé derrière la porte qu'elle ouvre ;
- une boucle qui contourne un obstacle, ou une énigme de morceau changée par une porte ajoutée ;
- un document qui ment sur l'état de la station, ou qui nomme une pièce absente ;
- une trace qui ment ;
- des couloirs vides, ou des chemins sans obstacle réel ;
- un butin qui rend un obstacle ou la créature triviale ;
- un mur de texte sur téléphone ;
- une petite station existante qui change, ou une sauvegarde qui reprend sur un autre monde.

## 2. Périmètre

**Dans ce lot :**
- grandes stations (annexes, boucles, trois chemins) et catalogue des pièces sans obstacle ;
- traces en piste et bruits de station ;
- clés dispersées, caisse portable, butin ;
- cadre de l'univers et histoire de la créature, bible, une quarantaine de documents ;
- fiche document dans l'appli et le CLI ;
- preuve par station publiée, mesures par bots.

**Hors du lot :**
- **Grand mystère reconstitué sur plusieurs parties.** Refusé par le porteur : « trop ambitieux et casse gueule niveau faisabilité ». Chaque partie raconte une histoire complète en elle-même.
- Ronde de la créature avant le contact, menaces multiples (#217).
- Objet qui fait du bruit et action « taper » (#218).
- Nouveaux obstacles (#203), missions (#210, #214), autres univers et menaces au tirage (#219, #216).
- Réécriture d'AR-01 et d'AR-02 : l'écart d'identité du passager entre les deux reste à traiter à part.
- Nouvelle direction visuelle de la carte.

## 3. Décisions

### 3.1 Décisions du porteur

Questions posées une à une, en langage courant, avant de coder (Q-204 à Q-219, réponses mot pour mot en annexe A). À consigner dans `docs/03-decisions.md` sous le titre « Décisions validées — grandes stations habitées (#202, #205, #206, #207, #209) », avec les lignes « Modifiée par » ou « Précisée par » sur chaque ancienne entrée.

**D-289 Taille et forme.**
- 22 à 28 pièces dessinées : les morceaux, plus **6 à 10 pièces du catalogue** selon leur poids (§4.1).
- Trois morceaux de chemin plus le final.
- Une seule taille au tirage : les petites stations sortent de NOUVELLE PARTIE.
- Durée visée : 15 à 20 minutes de découverte, 25 à 30 avec de nouveaux obstacles plus tard (#203).
- Modifie : D-119, D-172, D-249, D-255, D-260, D-265 (compte des compositions), C-08 §5. Précise : D-008, D-242 (la condition est jugée remplie par le porteur, sans durée mesurée sur téléphone), D-270.

**D-290 Difficulté.** Un joueur qui découvre meurt deux ou trois fois sur ses quatre premières parties. La difficulté actuelle convient. Le butin compense l'exposition plus longue ; il ne rend pas la partie plus facile. Précise : D-264.

**D-291 Rythme : créature tardive, chemins utiles.**
- La place de la créature est tirée dans le **dernier chemin ou le final**.
- Un chemin dont le seul obstacle est la créature (M-04, M-05, M-07, M-10) n'est tiré que s'il l'accueille : c'est alors le dernier chemin.
- Les autres chemins sont des obstacles matériels (M-01 feu, M-02 grille, M-08 vide, M-09 gravité).
- Précise : D-161, D-162. Tranche la réserve de D-241.

**D-292 Catalogue.**
- Station de transit et de fret, quinze pièces environ, par catégorie (§5).
- Pas d'objet de décor à toucher.
- La créature ne part jamais d'une pièce du catalogue.
- Précise : GE-08, D-206, D-214.

**D-293 Traces en piste.** Les pièces sur le trajet de la créature, de la zone de fret jusqu'à son repaire, portent des traces de plus en plus marquées vers lui. Une pièce calme n'est pas forcément sûre (§5.4). Remplace la règle du rayon proposée le 2026-10-18.

**D-294 Boucles.** Une à trois portes de boucle par station, dès ce lot. Elles ne passent jamais à travers un obstacle ; ce sont des portes ordinaires, que la créature alertée enfonce. Précise : GE-13, D-205, D-207.

**D-295 Clés dispersées.**
- Les objets portables qui résolvent un obstacle sont posés dans une pièce plausible, accessible avant leur obstacle, à distance bornée.
- Leur pièce d'origine reste un tirage possible.
- La caisse devient portable et encombrante dans les grandes stations, et se pousse sous la grille.
- Modifie : C-02 (tableau des objets), D-051, D-083, D-169, D-258, D-269. Tranche : D-244.

**D-296 Butin.**
- Une trousse de soin ou une burette de réserve, dans deux ou trois salles de butin en impasse, zéro ou un objet chacune.
- Rien dans l'interface ne les signale.
- La station reste prouvée sans le butin.
- La table est ouverte aux objets futurs.
- Précise : D-041, D-051, D-084, D-185.

**D-297 Créature avant le contact.** Elle reste immobile avant le premier contact dans ce lot. On mesure le temps sans menace dans les grandes stations, puis on décide d'une ronde chiffres en main (#217). Garde : D-048.

**D-298 Univers.**
- Cadre commun (§8.1) et histoire de la créature (§8.2).
- Pas de grand mystère sur plusieurs parties.
- Précise : D-016, D-030, D-031, D-032, D-046, D-243.

**D-299 Documents.**
- Cinq supports, une à cinq phrases, environ un document toutes les trois ou quatre pièces, indices vrais.
- **Chiffres permis dans les documents seulement** (« ça fait plus log technique »).
- **Indices à mots couverts sur un passage caché**, dans le même morceau.
- Exception à C-07 §2, C-07 §6 et C-06 §5 (§8.4) ; exception à 12 §1.5. D-111 ne s'applique pas aux documents.

**D-300 Affichage.** Fiche document dans la bulle, variante B de la maquette. Précise : 12 §3.5, §4.4.

**D-301 Validations.**
- Les 9 validations sur téléphone restent valables pour les petites stations.
- Chaque morceau doit être joué au moins une fois dans une grande station, au fil des essais du porteur, avant que les grandes stations soient validées.
- Précise : D-098, D-100.

### 3.2 Choix de l'agent, à valider avec ce document

**D-302 Preuve par station publiée.** Les grandes stations sont prouvées une à une, puis publiées dans une liste versionnée. Le jeu ne tire que dans cette liste (§7). Modifie : la limite de D-207 (contrôle structurel de GE-13 en plus de la preuve de jeu), GE-13 (on ne pose pas une porte qui contournerait un obstacle, au lieu de la faire fermer par l'incident).

**D-303 Une branche, trois livraisons, une PR.**
- Une seule suite de travaux sur le moteur, en trois livraisons sur une même branche, dans une même PR, comme pour la carte (#97). La PR est ouverte en brouillon dès la livraison 1, pour un essai sur téléphone si le porteur le souhaite.
- La fusion n'a lieu qu'à la fin : `main` ne voit jamais une grande station qui changerait ensuite sous le même identifiant (§12).

### 3.3 Décisions à valider en même temps

D-276 (créature alertée : poursuit, écoute, fouille) et D-279 (elle force une porte fermée en deux réactions, la porte est détruite) sont codées et fusionnées (PR #198), mais encore « Proposé » dans le journal. La poursuite du lot (portes de boucle enfoncées, indice « une porte fermée ne l'arrête pas longtemps ») repose sur elles.

Le porteur les a décrites comme voulues : « on ferme les portes derrière soi mais il les défonce, super terrifiant ». L'approbation de ce document demande donc aussi leur validation explicite : D-279 modifie D-177 et C-03 §4.3.

## 4. Forme d'une grande station

### 4.1 Composition

Une grande station se compose ainsi :
- le **vestibule** (D-257, inchangé : une seule porte, ni objet, ni document, ni consommable) ;
- **deux chemins matériels**, choisis parmi M-01, M-02, M-08 et M-09 ;
- un **troisième chemin** : soit matériel, soit un chemin dont le seul obstacle est la créature (M-04, M-05, M-07, M-10), qui l'accueille alors ;
- un **final** (M-03 ou M-06, D-253) ;
- **6 à 10 pièces du catalogue**, au nombre de 24 moins les pièces dessinées des morceaux, borné entre 6 et 10 ;
- **une à trois portes de boucle**.

**Taille.** Les morceaux pèsent de 11 à 22 pièces dessinées (vestibule 1 ; M-02 et M-04 2 ; M-01, M-05 et M-03 3 ; M-07 et M-06 4 ; M-08, M-09 et M-10 5 ; carrefour 2). Une station compte donc de 21 à 28 pièces dessinées, et la plupart entre 22 et 26.

**Créature** (D-291). Sa place est tirée parmi celles du troisième chemin et du final. Quand le troisième chemin est de type créature, elle est dans sa pièce.

**Deux formes** :
- **en chaîne** : vestibule, chemin 1, chemin 2, chemin 3, final ;
- **en ordre libre** : vestibule, couloir commun du carrefour, deux branches (les deux chemins matériels), sas, chemin 3, final. Le vestibule donne toujours sur le couloir commun (D-257, D-270, C-08 GP-04). Les deux ordres restent prouvés (G-07, G-08).

Environ une station sur trois est en ordre libre, comme le porteur l'a choisi pour les petites (D-270, Q-198). Si l'ordre libre à trois chemins dépasse le budget de preuve, l'agent revient vers le porteur, sans rien retirer de lui-même.

**Paires.** Toutes les paires de morceaux d'une station doivent être permises par `PAIRES` (chemin–chemin et chemin–final, adjacents ou non), puisqu'ils coexistent. Une paire absente est refusée (D-167).

**Combinatoire indicative**, avant refus des paires et des preuves : en chaîne, 12 couples ordonnés de chemins matériels × 8 troisièmes chemins × 2 finals = 192 ; en ordre libre, 6 × 8 × 2 = 96.

### 4.2 Petites stations : strictement inchangées

Les compositions d'aujourd'hui sortent du tirage de NOUVELLE PARTIE. Elles restent publiées, résolubles par leur identifiant et **strictement inchangées** : même monde, même état initial, mêmes preuves, même menu. Les sauvegardes en cours, les rapports et leur rejeu, les tests, AR-01, AR-02 et les stations de test continuent de fonctionner.

Invariants que le constructeur tient, avec les tests d'empreinte figés (`tools/stations.test.ts`) comme garde-fou :
- **Déclarations à part.** Les nouvelles déclarations des morceaux (pièces accueillantes, coupe et côté avant de l'obstacle, clés déplaçables et leurs étiquettes, emplacements de documents, variante calme d'une description) sont rangées au niveau du `DefMorceau`, jamais dans un `DefPiece` ou un `DefObjet` recopié dans le monde. Sinon, l'assembleur les retire avant de construire une petite station.
- **Catalogue à part.** Les grandes stations ont leur propre liste dans le catalogue. Elles n'entrent pas dans `catalogue.compositions`, que parcourent le tirage des petites stations et `ecartsDuCatalogue`. Il faut deux listes : grandes stations au tirage, et toutes les stations à la résolution.
- **Textes du catalogue à part.** Ils ont leur propre espace de clés, pour ne jamais entrer en conflit avec un morceau ou l'univers (`reunir`, `content/textes/couches.ts:23-25`).
- **Règles de composition à part.** Les invariants de l'assembleur (final en dernier, pas de morceau en double, sortie obligatoire, un lien par morceau dans la recherche de pose) ne s'assouplissent que pour la famille annexe et les grandes stations.
- **Caisse à part.** La caisse portable est une variante de l'objet, et de sa description, propre aux grandes stations. La caisse de M-02 reste déplaçable et non portable dans les petites.

### 4.3 Tirage et identifiants

NOUVELLE PARTIE joue à pile ou face sur le final (D-253), puis tire une grande station de la liste publiée qui a ce final, avec environ un tiers d'ordre libre. REJOUER CETTE STATION garde l'identifiant (D-087).

**Identifiant.**
- Il porte la **version du générateur** : par exemple `g1-` suivi de la composition et d'une petite graine, 40 caractères au plus (`catalogue.ts:600`, `report-service/src/rapport.ts:51`). `construire` refuse tout identifiant plus long.
- La borne de 29 caractères par composition est revue.
- Pour une grande composition, `?station=` tire dans la liste publiée.

**Une grande station d'une version de générateur que le jeu ne sait plus construire :**
- sa sauvegarde est refusée proprement, avec un message clair, sans jamais reprendre sur un autre monde (D-090) ;
- ses rapports sont signalés « version de génération ancienne » par les outils de rejeu.

Toute retouche du catalogue, de la table de butin ou de la réserve de documents qui change les stations publiées augmente la version.

## 5. Le catalogue des pièces sans obstacle (#206)

### 5.1 Un seul type de station

Le catalogue décrit une **station de transit et de fret**. C'est cohérent avec AR-01, avec les morceaux (soute, cale, entrepôt, magasin) et avec l'histoire de la créature, arrivée dans un conteneur.

D'autres types (station minière, de recherche) viendront plus tard comme variantes de la couche univers (#219).

### 5.2 Liste de départ

Quinze pièces environ. Aucun nom ne reprend, même approximativement, celui d'une pièce de morceau (réserve, poste incendie, coursive, atelier, magasin, entrepôt, soute, cabine), ni le mot « quai », réservé à l'embarquement (`content/morceaux/m-05.ts:36-37`). Un contrôle de `check:texts` le vérifie. Les noms tiennent dans leur pièce (PL-04) ; le constructeur ajuste les tailles de tuile.

| Pièce | Catégorie | Forme | Peut recevoir |
| --- | --- | --- | --- |
| couchettes | vie | impasse | document, butin |
| sanitaires | vie | impasse, sur un couloir qui dessert un couchage (GE-10) | document, clé (bidon) |
| réfectoire | vie | passage | document |
| cambuse | vie | impasse | document, butin, clé (bidon) |
| infirmerie | vie | impasse | document, butin |
| buanderie | vie | impasse | document, butin, clé (bidon) |
| outillage | technique | impasse | document, clé (planche, caisse, burette) |
| consigne | technique | impasse | document, butin, clé (planche, caisse, bloc) |
| dépôt | technique | impasse | document, clé (caisse, bloc, planche) |
| vestiaire | technique | impasse | document, clé (combinaison, découpeuse) |
| salle de ventilation | technique | impasse | document, clé (burette) |
| couloir | circulation | couloir : deux à quatre pièces accrochées (GE-11) | document |
| plateforme de fret | fret | passage | document, clé (caisse, bloc) |
| bureau du fret | commandement | impasse | document |
| laboratoire | science | impasse | document, butin |

**Catégories.** Elles complètent GE-08 : vie, technique, circulation, science, commandement, évacuation, et **fret**, ajoutée ici. Les règles d'architecture GE-09 à GE-11 s'appliquent aux pièces du catalogue.

**Étiquettes.** Les colonnes « clé » et « butin » sont des étiquettes de pièce (par exemple `rangement`, `outillage`, `eau`, `securite`, `soin`). Chaque objet déplaçable déclare les étiquettes qui lui conviennent. Aucune règle ne lit un nom de pièce ou d'objet (D-078).

**Formes.**
- Une **impasse** n'a qu'une porte, et rien ne s'y accroche (D-206). Les sanitaires s'accrochent donc à un couloir, jamais à des couchettes.
- Un **passage** peut recevoir une porte de boucle.
- Un **couloir** dessert d'autres pièces.

La forme est une grammaire que le joueur apprend en deux parties : des couchettes, c'est une impasse. Elle se lit dès la ligne « → COUCHETTES », avant d'ouvrir.

### 5.3 La fiche d'une pièce

Chaque pièce porte :
- son nom, sa catégorie, sa forme ;
- sa tuile et son nombre de portes au plus ;
- ses étiquettes ;
- si sa porte est ouverte ou fermée au départ, ou tirée ;
- deux ou trois descriptions **calmes**, écrites à la main en entier (C-07, D-281), sans information mécanique inventée.

Une description calme peut porter un bruit de station lointain : la ventilation qui cogne, un néon qui grésille.

Les traces et le pillage ne sont pas dans la description de la pièce. Ce sont des **phrases à part**, ajoutées à la description par la station (§5.4, §6.6). On n'écrit pas trois fois chaque pièce, et une autre menace apportera ses propres traces.

### 5.4 Les traces suivent la piste (D-293)

**La piste.** L'assembleur trace le plus court chemin entre une **origine** et le repaire, la place de départ de la créature :
- l'origine est une pièce de fret (plateforme de fret si elle est posée) ;
- à défaut, c'est une pièce choisie loin du repaire, en dehors du vestibule.

Ce trajet est **la piste**.

**Deux intensités.** Chaque pièce de la piste reçoit une phrase de trace, tirée de la couche menace (§8.4) :
- **forte** à deux portes ou moins du repaire (sang, traînées, odeur) ;
- **légère** au-delà (griffures sur une porte, désordre, odeur douceâtre).

Les autres pièces n'ont pas de trace. Les seuils sont réglables à la mesure.

**Ce que la piste dit.** Le signe reste vrai, « elle est passée par ici ». Mais une pièce calme n'est pas une pièce sûre : la piste ne dit pas tout, et la peur reste entière.

**Pièces des morceaux.** Plusieurs descriptions de morceaux portent déjà des traces, quelle que soit la place de la créature :
- traînées sombres de la soute (`m-07.ts:43`) ;
- colis éventrés du tri (`m-05.ts:52`) ;
- établis renversés de l'atelier de M-08 (`m-08.ts:51`) ;
- magasin (`m-08.ts:57`) ;
- cartons éventrés de la réserve de M-03 (`m-03.ts:54`).

Dans une grande station, ces pièces utilisent une **variante calme** déclarée par le morceau, et reçoivent les traces de la piste comme les autres. Les petites stations gardent leurs textes.

`check:texts` interdit une liste de mots réservés aux traces (sang, traînée, griffure, éventré, renversé, poisseux…) dans toute description calme utilisée par une grande station.

### 5.5 Bruits de station

**Le principe.** Avant le premier contact, dans une grande station, le récit d'une action engagée reçoit de temps en temps une ligne de bruit de station. Ce sont environ douze variantes de la couche univers : « Quelque part, la coque craque longuement. », « La ventilation s'arrête, puis repart avec un hoquet. ». Ces lignes donnent au premier temps le rythme régulier que voulait le porteur.

**Tirage.**
- Il est déterministe, pur hachage de la graine de partie et du numéro d'action, avec environ une chance sur sept. Rien n'entre dans l'état : ni la preuve, ni le rejeu, ni la sauvegarde ne changent.
- Seulement dans une grande station, pour garder intacts les petites stations et le rejeu de leurs rapports.

**Vocabulaire.** Il est distinct de celui de la créature (raclement, souffle, pas lourds), et le contrôle des couches le vérifie. Un bruit de station n'affiche jamais le repère BRUIT sur une porte.

### 5.6 Rien à toucher pour le décor

Le décor vit dans la description. Les seules puces sont de vrais objets : clés, butin, documents. Chaque puce compte, et le dock ne se remplit pas de leurres.

### 5.7 La créature et le catalogue

Elle ne part jamais d'une pièce du catalogue (D-161). Elle peut y passer et y fouiller une fois alertée.

## 6. Assemblage

### 6.1 Une pièce du catalogue est un petit morceau

Pour réutiliser le format, l'accroche et la pose existants (`DefMorceau`, `DefAccroche`, `rechercherPose`), une pièce du catalogue est un morceau de la nouvelle famille `annexe` :
- une seule pièce ;
- une entrée, aucune sortie ;
- aucune place de créature.

**Ce qui change dans l'assembleur, pour les grandes stations seulement (§4.2) :**
- une annexe n'a pas de sortie ;
- une même annexe peut servir plusieurs fois sous des identifiants d'instance distincts. Les pièces de même nom reçoivent une lettre (D-265, « COULOIR B ») ;
- les annexes ne comptent pas dans les règles « final en dernier » et « le final ne dessert rien ».

**Où une annexe s'accroche.**
- Seulement aux **pièces accueillantes**, que chaque morceau déclare à la main, ou à un couloir du catalogue.
- Sont exclus :
  - le vestibule (une seule porte, D-257) ;
  - les pièces à feu et la chambre froide (D-170 : deux portes) ;
  - la zone sans gravité et les pièces qui la touchent (D-238) ;
  - les bords du vide de M-08 ;
  - la salle des machines ;
  - la salle panoramique ;
  - le sas du carrefour ;
  - l'embarquement et la cabine.
- Jamais plus de six portes par pièce (PL-06).
- La pièce de la créature peut être accueillante : une annexe derrière le repaire devient un pari.

**Porte d'une annexe.** Une impasse a sa porte ouverte ou fermée au départ, selon sa fiche ou par tirage, environ une sur deux. Une annexe ne relie aucun morceau à un autre : elle n'ouvre donc aucun chemin au son entre morceaux (D-252). La porte d'un couloir suit la même règle.

### 6.2 Trois temps de pose (14 §5.3)

1. **Le chemin principal**, par la recherche avec retour en arrière qui existe (GE-05).
2. **Les annexes**, posées une à une sans défaire ce qui est posé : d'abord les couloirs, puis les pièces qui s'y accrochent (GE-11). Une annexe sans place essaie une autre pièce d'accroche, puis une autre annexe.
3. **Les portes de boucle** (§6.4).

Le même identifiant donne la même station : plan, annexes, boucles, piste, clés, butin, documents (GE-06 étendue). Chaque étape tire sur sa propre sous-graine (hachage de la graine et de l'étape), pour qu'un réglage d'une étape ne rebatte pas les autres.

### 6.3 Segments et coupes

**Ce que chaque morceau déclare** à la main, d'après 13 §3 :
- **la coupe de son obstacle** : les liaisons ou les pièces qu'il faut franchir, indépendamment de la place de la créature. Pour un chemin de type créature, c'est la porte d'entrée de la pièce de la créature et ses contournements prévus (le panneau de M-05) ;
- **ses pièces situées avant cette coupe** ; les autres sont après.

Par exemple, M-08 déclare avant : atelier, quartiers, galerie nord ; coupe : le vide.

**Le segment** d'une pièce vaut le rang de son morceau sur le chemin principal, puis son côté. Une annexe prend le segment de la pièce où elle s'accroche. En ordre libre, les deux branches sont deux segments sans ordre entre eux ; le tronc (vestibule, couloir commun et leurs annexes) les précède.

L'assembleur renvoie les segments avec le monde. Le vérifieur, les contrôles et les mesures s'en servent, au lieu du préfixe de morceau des identifiants.

### 6.4 Portes de boucle (GE-13)

**Conditions de pose.** Une porte de boucle :
- relie deux pièces qui se touchent par un mur d'au moins deux cases et ne sont pas déjà reliées ;
- relie deux pièces **du même segment** ;
- ne touche que des pièces de forme couloir ou passage, ou des pièces accueillantes de morceau ;
- ne touche **jamais une impasse ni la pièce de la créature** ;
- ferme un cycle d'**au moins quatre pièces** : dans un triangle, la créature entend les pas et entre directement.

**Nombre et place.** Une à trois portes de boucle, posées d'abord dans le segment du repaire et dans le segment voisin par lequel on fuit, là où la poursuite se joue.

**Comportement.** Ce sont des portes ordinaires, fermées au départ, qu'on ouvre et ferme, et que la créature alertée enfonce (D-279). Une station sans paire possible n'a pas de boucle et reste publiable.

### 6.5 Clés dispersées (#202)

**Objets concernés.** Ce sont les objets portables qui résolvent un obstacle : bidon (M-01), caisse (M-02), bloc (M-03), burette (M-04), combinaison et découpeuse (M-06), planche (M-08).

Les commandes fixes restent à leur place, parce que leur emplacement fait partie de l'énigme (D-068, D-170, D-173, D-238) : interrupteurs, pupitres, console, avertisseur, kit de rustine.

**Déclaration.** Le morceau déclare chacun de ces objets comme **clé déplaçable**, avec ses étiquettes plausibles (§5.2). Sa pièce d'origine reste écrite dans le morceau : c'est là qu'il est dans une petite station.

**Où on la pose.** Dans une grande station, l'assembleur tire la pièce de chaque clé parmi :
- sa pièce d'origine ;
- une pièce du catalogue d'étiquette compatible, accrochée **du côté avant de son propre morceau, ou dans le segment qui le précède immédiatement** ;
- pour les clés du final (bloc, combinaison, découpeuse) : le final ou le segment du dernier chemin.

En ordre libre, la clé d'une branche ne va que du côté avant de sa branche, ou dans le tronc.

**Contraintes du tirage :**
- jamais dans le vestibule (D-257) ;
- jamais deux clés de morceaux différents dans la même pièce. La combinaison et la découpeuse peuvent rester ensemble dans leur pièce d'origine, ou être séparées ;
- **au plus une clé encombrante** (planche, caisse, bloc) déplacée par station ;
- **le bloc**, qui est large, ne se pose que là d'où il rejoint la capsule sans passage étroit. C'est un contrôle « apportable », sur la logique de `apportablesVers` (`engine/sortie.ts:36-55`). Sinon il reste chez lui. Même contrôle pour toute clé large future.

**La serrure d'abord, l'indice ensuite.** Quand une clé quitte son morceau, sa **note de rangement** (§8.4) est toujours posée dans la pièce qui fait face à l'obstacle (poste incendie de M-01, atelier de M-02, galerie nord de M-08, couloir de sécurité de M-06…), ou dans sa pièce d'origine restée vide. Le joueur découvre le besoin devant l'obstacle, puis l'indice transforme le demi-tour en expédition voulue. Ce n'est pas une aide d'interface, c'est du récit.

**La caisse portable** (grandes stations seulement, §4.2). Sa variante est déplaçable, portable et **encombrante** (D-079). Le constructeur assouplit la validation qui refuse un objet à la fois déplaçable et portable (`engine/monde.ts:241`), pour un appui seulement. On la porte, on la pose (sans position), puis on la **déplace** sous la grille. Ce sont deux actions qui existent déjà, et le signal « plus aucune sortie » sait déjà raisonner sur un appui à apporter (`sortie.ts`, `apportablesVers`). Le menu des petites stations ne change pas. La description de cette variante ne dit plus « trop lourde pour être portée ». Elle reste non large, pour passer la grille de M-02 ; le constructeur le vérifie.

**Textes.** Une pièce ne nomme jamais l'objet qu'elle contient, puisqu'il s'affiche en puce. Le constructeur relit les descriptions des morceaux qui le font ; la planche de M-08 respecte déjà cette règle.

### 6.6 Butin (#207)

**Salles de butin.** Deux ou trois pièces du catalogue en impasse, à étiquette butin, sont tirées comme salles de butin. **Au moins une est sur la piste, près du repaire** : le joueur lit la trace et choisit d'y aller ou non. Chaque salle reçoit **zéro ou un** objet, tiré sans remise dans une table du contenu :

| Objet | Qualité | Condition |
| --- | --- | --- |
| trousse de soin | soin, 1 dose | aucune ; rare (aucune station tirée n'a de soin aujourd'hui) |
| burette de réserve | glissant, 1 dose | si M-04 est dans la station, seulement dans un segment après son obstacle (sinon elle le rendrait trivial) |

**La table.**
- Elle donne le poids de chaque entrée et la part de salles vides. Ces seuils d'équilibrage sont montrés au porteur avec les mesures (§11).
- Chaque entrée peut déclarer une condition d'utilité ou de place. Les objets futurs (#218 et suivants) s'y ajoutent en augmentant la version du générateur (§4.3).

**Ce qui n'est pas du butin :**
- le bidon d'eau, qui ne sert qu'au feu de M-01 : inutile sans lui, il rendrait la clé dispersée inutile avec lui ;
- une deuxième planche, qui ferait tomber la créature trop facilement ;
- une deuxième rustine (D-068).

**Invariant.** Un butin n'a **aucune qualité passive** : ni encombrant, ni large, ni appui, pont, source, alimente, deverrouille, capsule, vitrage, machines, gravité, fermeture, avertisseur. Ses seuls effets sont ses actions (soigner, verser). C'est ce qui rend vraie la preuve sans butin (§7.4). Un contrôle structurel vérifie la table.

**Les noms.** Deux objets d'une station ne partagent jamais un nom affiché (NP-04). Un butin a son propre nom (« burette de réserve »).

**Une salle vide n'est pas vide de sens.** Elle reçoit une **phrase de pillage** de la couche univers : casiers vidés, emballages de pansements arrachés, armoire forcée à la pince. Ce vocabulaire est distinct de celui des traces : ni sang, ni odeur, ni griffures. Un document peut aussi dire qui est passé avant. Rien dans l'interface ne signale une salle de butin.

### 6.7 Qui calcule quoi

**Le moteur.** Pour une grande station, l'assembleur reçoit en données :
- les morceaux et leurs déclarations ;
- les annexes ;
- la table de butin ;
- la réserve de documents, sous forme d'emplacements (couche, étape, étiquettes, nom de puce) ;
- les seuils.

Il tire et pose tout ce qui est un objet : annexes, boucles, clés, butin, documents, origine et piste. Il construit le monde et le valide par `validerMonde`. Les règles restent génériques : étiquettes, segments, rangs le long du chemin, jamais un nom (D-078).

**Ce qu'il renvoie avec le monde**, uniquement dans une grande station :
- les segments ;
- l'intensité de trace par pièce ;
- les salles pillées ;
- pour une note de rangement, la pièce qu'elle désigne.

Ces données sont des champs facultatifs, absents des petites stations.

**Le contenu.** Il choisit seulement les textes, par hachage :
- la variante calme de chaque description ;
- les phrases de trace et de pillage ;
- le corps des documents, dont les trous de pièce sont remplis après `numeroter`.

Le contenu continue de n'importer que les types du moteur (`tools/check-imports.ts`) : le catalogue reçoit l'assembleur par injection, comme aujourd'hui.

## 7. Preuve et publication (choix de l'agent, D-302)

### 7.1 Pourquoi changer de méthode

Aujourd'hui, une composition se prouve une seule fois, sur sa station de référence, parce que la graine ne change que le dessin du plan (`tools/verifier-station.ts:528-531`). Dans une grande station, la graine change aussi le graphe de jeu. La preuve par composition ne suffit plus.

### 7.2 Liste de grandes stations publiées

Un outil tire et prouve des grandes stations, puis écrit leurs identifiants dans une **liste publiée**, versionnée dans le contenu. Le jeu ne tire que dans cette liste. `check:stations` échoue si une station de la liste n'est pas prouvée, ou si un contrôle structurel échoue.

**Taille.** Au moins 500 stations, réparties sur les finals, les formes et les compositions. Le constructeur mesure le temps de CI et propose la taille au porteur, dans le budget des lots parallèles actuels.

### 7.3 Contrôles structurels

Ce sont des parcours de graphe, sans recherche d'états, rapides sur chaque station publiée :
- **Clés.** Chaque clé est dans sa pièce d'origine ou dans la zone permise (§6.5) ; une clé large est apportable ; au plus une clé encombrante déplacée.
- **Boucles.** Chaque porte de boucle respecte §6.4.
- **Coupes.** Avec toutes les portes ordinaires ouvertes et la coupe de chaque obstacle tenue fermée, aucune pièce d'après la coupe n'est atteignable depuis le départ. Une boucle ou une annexe ne contourne donc rien (GE-13).
- **Accroches.** Elles ne touchent que des pièces accueillantes ou des couloirs du catalogue.
- **Architecture.** GE-07 à GE-11, PL-01 à PL-07.
- **Vestibule** sans objet, sans document et avec une seule porte.
- **Noms.** Aucun nom affiché en double, objets et documents compris.
- **Butin.** Il respecte l'invariant et les conditions de la table (§6.6). Au moins une salle de butin est sur la piste.
- **Couverture.** Chaque pièce du catalogue porte au moins une chose : un document, une clé, une salle de butin (même vide), un bout de porte de boucle, ou une trace. Sinon, la station reçoit moins d'annexes au tirage, au lieu d'en garder de vides.

### 7.4 Preuve de jeu

Le vérifieur existant cherche une évacuation sans dé ni blessure, avec les vraies règles (D-084, GP-05). Il la cherche **sur la station privée de son butin** : le même monde filtré, avec le même `monde.id`, jamais réassemblé. Une station prouvée sans butin l'est aussi avec, grâce à l'invariant du §6.6 : un butin n'ajoute que ses propres actions. Les documents n'offrent que « regarder », que le vérifieur écarte déjà.

**En ordre libre,** la preuve se fait dans les deux ordres, comme aujourd'hui (G-07, G-08, D-259).

**Si la recherche coûte trop cher**, ce qui est probable avec des clés éloignées, le constructeur la guide : chemin principal, plus un détour vers chaque clé là où l'assembleur l'a posée. Il rejoue ensuite ce témoin avec les vraies règles. Un témoin rejoué jusqu'à l'évacuation, sans dé ni blessure, est une preuve. La priorité de la recherche suit le rang des segments, pas le préfixe des identifiants. Une station sans preuve dans le budget n'est pas publiée.

**Signal « plus aucune sortie ».** `check:sortie` (D-275) couvre aussi les grandes stations publiées, dans le budget de la CI, avec un test par cas nouveau : caisse portable posée loin de la grille, clé posée loin de son obstacle.

**Cache.** Le cache des verdicts est refondu en deux niveaux :
- un dossier dont l'empreinte couvre `engine/` et les outils du vérifieur, sans `content/` ;
- une clé par station, hachage du monde sans ses textes, de la version de la recherche et de ses options.

Une retouche de texte ne relance pas les preuves ; les erreurs de rendu restent à `check:texts`.

**Outils de mesure.** `mesurer-difficulte`, `mesurer-tirages`, la mesure D-241 et `check:sortie` raisonnent aujourd'hui par composition et par préfixe de morceau. Ils sont adaptés à la liste et aux segments.

## 8. Lore (#209)

### 8.1 Le cadre, commun à toutes les parties

- **Le monde** : les stations de transit et d'exploitation d'une même compagnie. Un futur proche, industriel et usé, plus cargo poisseux que vaisseau rutilant.
- **Le passager** : un voyageur en transit, qui n'appartient pas à l'équipage, n'est pas spécialiste (D-031) et n'en sait pas plus que le joueur. Il est toujours écrit au masculin singulier, vouvoyé, comme aujourd'hui.
- **IA Station** : la voix polie de la compagnie, exacte sur les systèmes, muette sur la menace (D-046, D-081). Ses messages ne changent pas dans ce lot. Le décalage entre sa politesse et la panique des notes fait le ton « froid et décalé » (C-07 §3).
- **L'équipage** : chaque document a un auteur, avec un prénom et un métier. Un document ne dépend d'aucun autre et ne dit pas d'un autre auteur qu'il est vivant ou mort. N'importe quelle combinaison reste donc cohérente.

**Ce qui ne change jamais** d'une partie à l'autre :
- la grammaire des signes : une trace, un bruit, une forme de pièce veulent toujours dire la même chose ;
- l'honnêteté des documents (C-05) ;
- un seul univers ;
- le passager et IA Station ;
- le ton.

### 8.2 L'histoire de la créature (couche menace)

**L'incident.** Un conteneur en transit, au manifeste incomplet, est resté des semaines au hangar six, faute de contrôle sanitaire. L'équipage en plaisantait et entendait des bruits. Puis un docker a disparu. Vint ensuite le confinement, présenté comme une « fuite ».

**Ce que l'équipage a appris à ses dépens.** Ce sont de vrais indices, conformes aux règles du jeu :
- elle chasse surtout au bruit, mais repère ce qui bouge devant elle ;
- elle ne passe pas par les conduits étroits ;
- le froid la ralentit ;
- elle n'entre jamais dans le feu ;
- une porte fermée ne l'arrête pas longtemps une fois qu'elle vous cherche (écrit seulement si D-279 est validée).

**Quatre étapes** : premiers signes, disparition, confinement, derniers mots. Chaque document de la menace en porte une. Ils sont posés **dans l'ordre du trajet** : premières étapes près du réveil, dernières près de la fin. L'histoire suit le joueur, et comme la créature est placée tard (D-291), les derniers mots se lisent près de son repaire. La proximité, elle, est dite par les traces.

Une autre menace (#216, #219) aura plus tard sa propre histoire, construite de la même façon, dans le même cadre.

### 8.3 La bible

`docs/17-univers.md` est un document d'auteur, interdit au playtester comme 08 et 09. Il contient :
- le cadre ;
- la chronologie de l'incident ;
- les membres d'équipage (prénom, métier, voix) ;
- les lieux évoqués hors du plan ;
- les règles d'écriture.

Un lieu hors du plan (« le hangar six », « la plateforme deux ») ne porte jamais le nom d'une pièce de morceau ou du catalogue.

La bible sert aussi de référence aux écrans de fin et à IA Station. L'assistant principal l'écrit lui-même (D-243).

### 8.4 Les documents

**Cinq supports**, chacun reconnaissable avant la lecture :

| Support | Voix | Exemples de puce |
| --- | --- | --- |
| Note manuscrite | intime, quelques lignes | Note scotchée, Mot de Malik |
| Journal de terminal | technique et sèche, heures et codes | Terminal de quart |
| Message enregistré | orale, hachée, didascalies entre crochets | Enregistreur |
| Inscription | une ligne, un choc | Inscription |
| Affiche de la compagnie | consignes officielles, ironiques après coup | Affiche |

Chaque document a son propre nom de puce, et une station n'en montre jamais deux du même nom.

**Longueur.** Une à cinq phrases, ou au plus cinq lignes de journal, soit une dizaine de lignes dans la bulle d'un téléphone de 390 px. La règle des deux à quatre phrases de D-111 vaut pour le récit d'une action, pas pour un document.

**Quantité.** Environ un document toutes les trois ou quatre pièces, soit **cinq à sept par station**, jamais au vestibule. La réserve écrite pour ce lot compte une quarantaine de documents :

| Couche | Nombre | Contenu | Place |
| --- | --- | --- | --- |
| Univers | 8 environ | la vie de la station avant l'incident ; affiches | pièces du catalogue, selon leurs étiquettes |
| Menace | 12 environ, 3 par étape | l'incident de la créature | dans l'ordre du trajet, selon l'étape |
| Morceaux | 8 environ | une tentative de franchir l'obstacle, racontée comme un témoignage et non comme une consigne (« Ils ont jeté la planche en travers ; elle a tenu pour Marc. ») | côté avant du morceau, au plus près de l'obstacle, ou dans une annexe de la pièce qui lui fait face ; seulement si ce morceau est dans la station |
| Notes de rangement | 8 environ, une par clé déplaçable et une pour la trousse | « J'ai rangé la planche dans {le:piece}. » | toujours quand une clé quitte son morceau (§6.5) ; facultatives sinon |

**Indices**, toujours vrais :
- les règles de la créature (couche menace) ;
- une tentative sur un obstacle (couche morceau) ;
- la place d'une clé ou d'une trousse : la pièce est remplie à l'assemblage avec la vraie pièce, lettre comprise. C'est vrai par construction.

**Exceptions décidées par le porteur** (D-299) :
- **Passage caché.** Un indice est permis **à mots couverts, dans le morceau qui le porte** (exception à C-07 §2 et C-06 §5). Par exemple, pour M-05 : « Quand le hall est encombré, ceux du tri ont leurs raccourcis. »
- **Pièce hors de vue.** Une note de rangement nomme une pièce hors de vue et ce qu'elle contient (exception à C-06 §5). C'est la parole d'un équipier, vraie au moment de l'assemblage. La lecture n'ajoute rien à ce que sait le passager : aucune connaissance, aucune carte (C-07 §6).

**Honnêteté (C-05).**
- Un document ne contredit jamais l'état réel.
- Il évoque des lieux hors du plan seulement comme décor de son récit.
- Il n'affirme rien sur une pièce du plan, sauf par un trou rempli à l'assemblage.
- Un document de morceau n'apparaît que si ce morceau est dans la station.
- Les traces et le pillage sont des phrases d'état de la pièce où l'on est : elles ne révèlent jamais la position actuelle d'une créature non perçue.

**Couches et fuites de mots** (#219). Le contrôle des fuites (`couches.ts`) est étendu à tous ces textes et aux deux sens.

| Couche | Ce qu'elle contient | Ce qui y est interdit |
| --- | --- | --- |
| Univers | descriptions calmes du catalogue, bruits de station, phrases de pillage, documents univers | mots de la menace, vocabulaire des traces |
| Menace | phrases de trace, documents de la menace | « station » (« à bord », « ici ») |
| Morceaux | documents des morceaux, variantes calmes | tout mot réservé |

**Chiffres.** Ils sont permis dans le corps des documents seulement : heures, dates, codes, numéros (D-299). Ailleurs, la règle « aucun chiffre à l'écran » reste (12 §1.5). Les tests et les captures épargnent le corps d'un document, et lui seul.

**Écriture.** L'assistant principal écrit lui-même la bible, les documents, les descriptions du catalogue, les traces, les phrases de pillage et les bruits de station (D-243). Puis un relecteur indépendant relit la qualité de l'écriture et la cohérence avec la bible (D-116).

Les textes sont en français soigné. Chaque phrase est écrite en entier, sans pronom substitué (D-281).

### 8.5 Format d'un document dans le contenu

Un document est un objet fixe, non portable, sans qualité. On ne peut que le regarder, et c'est gratuit (D-014).

Ses textes vivent dans une section `documents` à part, pas dans les descriptions, qui refusent tout trou. Pour chaque document :
- son nom de puce ;
- son support ;
- une ligne « où » (« scotchée au montant d'une couchette »), vraie dans toute pièce que ses étiquettes autorisent ;
- sa couche ;
- son étape, pour la menace ;
- ses étiquettes ;
- son corps, en paragraphes, ou en lignes horodatées pour un journal.

Le seul trou permis est la pièce d'une note de rangement (rôle `piece`, formes `le`, `de`, `a`).

**Rendu.** Un rendu structuré, commun à l'appli et au CLI (C-06 K-07), remplace la chaîne unique de `rendreConsultation` pour un document. `check:texts` contrôle toute la réserve par ce chemin, sans dépendre d'une station de référence.

## 9. Interface

### 9.1 Fiche document dans la bulle (D-300)

C'est la variante B de `docs/maquette/documents.html`. On touche la puce du document et la bulle s'ouvre, comme pour tout objet. La fiche montre :
- en haut, le support en capitales et la ligne « où » ;
- le document dans la typographie de son support :
  - une note en italique, avec un filet à gauche et la signature à droite ;
  - un journal dans un cadre, sous une barre de titre, avec une colonne d'heures alignées ;
  - un message avec ses didascalies en couleur secondaire ;
  - une inscription en grandes capitales ;
  - une affiche sous un double cadre ;
- des paragraphes et des retours à la ligne ;
- des chiffres permis à l'intérieur du document seulement.

Une fiche longue défile dans la bulle (comportement existant). Le lecteur d'écran lit le support, puis le texte. La pièce remplie par un trou est soulignée en pointillé, sans autre aide.

Lire ne coûte aucune action et n'est pas enregistré.

### 9.2 CLI

« Regarder » un document affiche le support, la ligne « où », puis le corps avec ses retours à la ligne. Rien n'est enregistré, comme aujourd'hui.

### 9.3 Carte et dock

**La carte** garde sa conception (D-205 : glisser, pincer, ouverture centrée). Le constructeur :
- capture une carte de grande station à 390 px et à 320 px ;
- vérifie sur la galerie que les noms restent lisibles au zoom d'ensemble ;
- ajuste les bornes de zoom si nécessaire, puis le montre au porteur.

Aujourd'hui, le plus grand plan demande déjà un zoom de 0,22 pour être vu en entier, et les plans sortent en paysage alors que GE-04 vise le portrait.

**Le dock.** Un couloir à quatre pièces accrochées, plus des objets, fait défiler le dock. C'est à capturer.

### 9.4 Rien n'est signalé

Ni les clés, ni le butin, ni les documents ne portent de marque spéciale dans le dock ou sur la carte. On ne tient pas la main du joueur. La seule information est la forme de la pièce, lisible à son nom (§5.2).

## 10. Créature et tension

**Les règles de la créature ne changent pas** (D-297). Elle part d'une place déclarée par un morceau, désormais tirée tard (D-291). Elle attend sans ronde avant le premier contact, puis poursuit, écoute, fouille et enfonce les portes (D-276, D-279).

La tension du premier temps repose sur :
- la piste et ses traces (§5.4) ;
- les bruits de station réguliers (§5.5) ;
- les documents de la menace (§8.2).

La poursuite se joue autour du repaire, là où sont les boucles (§6.4) et une salle de butin (§6.6).

**Le risque est assumé et mesuré** (§11). Si le temps avant le premier contact est trop long, ou si trop de parties n'ont aucune rencontre, l'agent revient vers le porteur avec les chiffres, avant toute publication dans NOUVELLE PARTIE. La décision sur une ronde vient avec #217.

## 11. Mesures et critères d'acceptation

**Bots, à adapter avant de mesurer :**
- une pièce visitée ne redevient « à voir » que si l'un de ses passages était bloqué et que l'objet pris peut le débloquer ;
- le plafond passe à 600 actions, et les parties « en cours » sont comptées à part ;
- un profil **averti** lit les descriptions et les documents (« regarder » est gratuit) : il reconnaît une trace, évite ces pièces avant le contact et va chercher ce qu'une note de rangement désigne.

**Assemblage.** Sur 1 000 tirages de grandes stations :
- au moins 95 % trouvent un plan ;
- toute station proposée passe les contrôles du §7.3 et compte 21 à 28 pièces dessinées ;
- l'assemblage complet (plan, annexes, boucles, piste, poses) prend moins de 50 ms par station sur PC, preuve non comprise.

Une galerie de plans rendus est jointe à la PR.

**Preuve.** Chaque station publiée est prouvée sans son butin (dans les deux ordres en ordre libre) et passe les contrôles structurels. `check:sortie` la couvre. La taille de la liste et le temps de CI sont consignés dans 13.

**Difficulté**, sur 1 000 tirages dans la liste publiée :
- B2 évacue dans 25 à 35 % des parties avec le butin (29,5 % aujourd'hui sur les petites stations) ;
- l'effet du butin est mesuré, avec et sans : évacuations, coups encaissés, mise hors jeu précoce (D-241). La définition de D-270 est précisée, puisque depuis D-279 la créature peut sortir d'une chambre froide fermée ;
- la répartition du moment de la mort dans la partie est relevée : mourir dans le final ne frustre pas autant qu'au début.

**Rythme et durée :**
- part des parties **sans aucune rencontre** : moins de 10 % visé ;
- actions avant le premier contact : au-delà d'une médiane d'environ 45 actions pour B2, alerte au porteur (§10) ;
- part des poursuites qui empruntent une porte de boucle ;
- actions par partie et pièces visitées, comparées aux petites stations ; cible indicative : deux à trois fois plus d'actions qu'aujourd'hui pour B2 (médiane 52).

**Textes.**
- `check:texts` couvre toutes les pièces du catalogue, les variantes calmes, les phrases de trace, de pillage et de bruit, et tous les documents, par un contrôle direct de la réserve : structure, trous, couches, mots réservés, longueur, noms distincts.
- Il couvre aussi quelques grandes stations par exploration.
- Le relecteur indépendant relit la qualité et la cohérence avec la bible.

**Interface.** Captures à 390 px et 320 px :
- une fiche de chaque support ;
- une carte de grande station ;
- un dock de couloir chargé.

**Compatibilité.**
- Les tests d'empreinte figés des petites stations restent verts.
- Un test prouve que le format de sauvegarde ne change pas.
- Un test prouve qu'une sauvegarde de grande station d'une autre version du générateur est refusée proprement.

**Téléphone :**
- le porteur joue des grandes stations ; la durée d'écran allumé (D-280) est relevée par les rapports, avec une cible de 15 à 20 minutes en découverte ;
- chaque morceau est joué au moins une fois dans une grande station (D-301) ;
- le porteur donne son avis sur l'écriture ;
- la validation est signée, jamais cochée par un agent (D-001, C-10).

## 12. Livraisons (choix de l'agent, D-303)

Une seule branche, une seule PR, trois livraisons dans l'ordre. Jamais deux suites de travaux sur le moteur en parallèle (00, 13 §7, 14 §7).

1. **Grandes stations** (#205, #206) :
   - famille annexe, déclarations des morceaux (accueil, coupes, côtés), segments ;
   - catalogue (tuiles, descriptions calmes, écrites par l'assistant principal) ;
   - pose en trois temps, boucles, composition D-291 ;
   - piste, traces, bruits de station ;
   - identifiants versionnés, liste publiée et preuve, cache refondu ;
   - carte et dock ;
   - bots adaptés et mesures de taille, de rythme et de durée.

   Les clés restent chez elles.
2. **Clés et butin** (#202, #207) : clés déplaçables, caisse portable, table de butin, pillage, preuve sans butin, `check:sortie`, mesures de difficulté.
3. **Lore** (#209) : bible, documents et notes de rangement, rendu structuré, fiche document dans l'appli et le CLI, chiffres dans les documents, contrôles des couches.

La PR est ouverte en brouillon dès la livraison 1. La version du générateur ne change qu'une fois, à la fusion.

## 13. Conséquences

**Ce qui est préservé :**
- les petites stations, leurs sauvegardes et leurs rapports (§4.2) ;
- les 9 validations signées, pour les petites stations (D-301).

**Ce que le porteur doit refaire.** Chaque morceau doit être joué au moins une fois dans une grande station (D-301).

**Décisions et contrats modifiés ou précisés.** Chaque ancienne entrée reçoit sa ligne « Modifiée par » ou « Précisée par ».
- Décisions : D-008, D-041, D-051, D-083, D-098, D-100, D-111, D-119, D-161, D-162, D-169, D-172, D-177, D-185, D-206, D-207, D-214, D-241, D-242, D-244, D-249, D-255, D-258, D-260, D-264, D-265, D-269, D-270.
- Contrats et règles : C-02 (tableau des objets), C-03 §4.3 (avec D-279), C-06 §5, C-07 §2 et §6, C-08 §5 et GP-01, GE-08, GE-13, 12 §1.5.

**Docs à mettre à jour.**
- 03 : D-289 à D-303, statut de D-276 et D-279, index, date ;
- 06 : questions Q-204 à Q-219, et correction du « prochain numéro Q-197 », périmé ;
- 13 : §3 (fiches de M-01, M-02, M-03, M-04, M-06, M-08), §7.1, §7.2, liste « hors #106 » ;
- 14 : §5.3 à §5.6, liste GE-08, GE-13 ;
- 12 : §1.5, §3.5, §4.4 ;
- C-02, C-03, C-06, C-07, C-08 ;
- 02 (phases 3 et 4), 00, 05 (exigence B-077 si utile) ;
- 17, nouvelle.

## 14. Laissé au constructeur

- Tailles des tuiles du catalogue, portes au plus par pièce, ordre de pose des annexes.
- Liste exacte des pièces accueillantes et des coupes de chaque morceau, d'après 13 §3, relue par l'agent principal.
- Représentation exacte des étiquettes, des segments, des emplacements, des champs renvoyés par l'assembleur et du corps d'un document.
- Méthode de preuve guidée par témoin, si la recherche par priorité ne suffit pas.
- Valeurs de départ des seuils, ensuite réglées par la mesure et **montrées au porteur** (zone orange), jamais fixées seules : distance des traces fortes, part des portes d'annexe ouvertes, nombre de boucles, poids et part vide du butin, fréquence des bruits de station, taille de la liste publiée.

## 15. État des lieux (lecture du code du 2026-10-18, `main` à 1f8145c)

Les chiffres ci-dessous sont des mesures locales des lecteurs, à consigner dans 13 avec la livraison 1. `00-lire-en-premier.md` indique encore 55 % d'évacuations pour B2, valeur d'avant D-278 et D-279.

**Taille et rythme.**
- Les stations tirées font 6 à 17 pièces dessinées (7 à 18 avec la cabine, médiane 13), avec 2 ou 3 obstacles et aucun soin.
- Le bot prudent B2 évacue dans 29,5 % des parties, en 52 actions médianes ; le premier contact a lieu vers l'action 29.

**Format et assemblage.**
- Au niveau des morceaux, une station est un arbre, sans morceau en double ni pièce hors morceau (`engine/station.ts:141-176`) ; M-05 et M-10 ont des cycles internes.
- GE-08 à GE-13 ne sont pas codées. Seules les commandes de l'ordre libre sont posées hors de leur morceau (`DefCommande`).

**Preuve et contrôles.**
- La preuve se fait par composition sur une graine de référence, avec un plafond de 150 000 états.
- La recherche par priorité tient à 26 pièces quand un chemin existe ; les preuves d'absence explosent dès 9 à 19 pièces.
- `check:stations` prend 176 s sur un processus, `check:texts` 235 s, borne atteinte partout.

**Créature.** Elle est immobile avant le contact (D-048), et les portes entre morceaux sont fermées au départ (D-252). Alertée, elle poursuit, entend les pas et enfonce les portes en deux réactions.

**Textes et appli.**
- Les descriptions n'acceptent aucun trou, et la fiche d'un objet est un seul paragraphe, qui défile dans la bulle.
- Les captures refusent tout chiffre dans les bulles.
- Il n'existe ni bible ni document ; la créature n'a pas d'origine, et la station pas de nom.

## 16. Risques

- **Coût de la preuve** avec des clés éloignées. La parade est la preuve guidée par témoin ; à mesurer dès la livraison 1 avec les annexes.
- **Temps de CI.** Il est réglé par la taille de la liste et par le cache refondu.
- **Variété réduite par D-291.** Au moins deux obstacles matériels sur quatre possibles reviennent souvent, jusqu'aux nouveaux morceaux de #203.
- **Durée insuffisante.** Si la découverte reste sous 15 minutes, le levier suivant est #203 (nouveaux obstacles), pas plus de couloirs.
- **Calme du premier temps** sans ronde : mesuré, alerte au porteur, puis #217.
- **Lisibilité de la carte** à 28 pièces sur téléphone.
- **Volume d'écriture** : une quarantaine de documents, quarante descriptions, une soixantaine de phrases courtes. L'écriture reste à l'assistant principal (D-243), sur plusieurs séances si besoin.

## Annexe A. Réponses du porteur, mot pour mot

| Question | Réponse |
| --- | --- |
| La partie de 25 minutes idéale | « une partie de 25min idéale. on commence a explorer un endroit mysterieux, inquiétant car des traces (sang, désordre, odeurs) et on entends régulièrement des indices que quelchose ne tourne pas rond dans la station (bruits, lore, messages laissés par des membres de l'équipage morts) , il faut une tension qui pourrait laisser croire qu'on va se faire embusquer a tout moment. […] on ferme les portes derrière soi mais il les défonse, super terrifiant. et enfin on arrive a l'objectif, sain et sauf ou blessé malgré tout » |
| Rôle de l'agent | « n'hésite pas a remetre en question mes choix et envies dans le but de produire un jeu final de qualité, intéressant pour les joueurs, équilibré en difficulté (un peu dur quand meme) » |
| Variété | « le lore va changer selon la mission et la menace (issue 219). mon but étant d'avoir une forte rejouabilité et que chaque partie se ressente différente selon les combinaisons » ; « franchement, tout pourrait changer, j'aime la variété » |
| Grand mystère sur plusieurs parties | « trop ambitieux et casse gueule niveau faisabilité. » |
| Difficulté | « je pense 2 ou 3 fois - la difficulté actuelle est bien pour le moment, mon ressenti. » |
| Taille et durée (trois chemins, une taille) | « rien ne me gène » |
| Butin | « c'est bon pour moi. d'autres objets imaginés dans le futur pourront venir s'y ajouter » |
| Clés dispersées | « la caisse peut bouger, sinon OK » |
| Cadre et histoire de la créature | « c'est bien » |
| Forme des documents | « ok pour des chiffres a l'écran (ça fait plus log technique). ok pour indice passage caché » |
| Catalogue | « ok » |
| Créature immobile avant le contact | « oui » |
| Affichage d'un document | « B, la fiche document dans la bulle. » |
| Taille, après relecture | « 22 à 28 pièces » |
| Rythme de la créature | « Tardive et utile » |
| Traces | « Une piste » |
| Validations | « Gardées » |
