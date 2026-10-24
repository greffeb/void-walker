# Void Walker V2 — carte en plan de pont

> **Statut :** CONCEPTION VALIDÉE PAR PARTIES — choix du porteur du projet du 2026-10-12 consignés par D-201 à D-214 ; document à relire par le porteur avant le plan d'implémentation.
> **Date :** 2026-10-12.
> **Issues :** [#97](https://github.com/greffeb/void-walker/issues/97) (carte) pour les §2 à §4 ; [#106](https://github.com/greffeb/void-walker/issues/106) (stations assemblées) pour le §5, petites stations d'abord et chemin principal seulement (D-242, D-245).
> **Implémentation :** livraison 1 (format du plan, vérifieur PL-01 à PL-07, plans d'AR-01, d'AR-02 et du monde de test, captures) proposée par #97 ; livraison 2 (mémoire du passager, carte publique, commande `carte` de la CLI) proposée ; livraison 3 (écran) proposée, à valider sur téléphone par le porteur. Un prototype jetable, hors dépôt, a mesuré la génération des plans (§6) ; aucun de ses fichiers n'est conservé.
> **Remplace :** la forme de la carte de [12 §4.8](12-interface-ecrans.md) (boîtes reliées de la maquette P08) et la règle « destination non dessinée » d'OP-03 dans [C-06 §3](contrats/C-06-observation-connaissances.md) ; voir §8.

## 1. But

La carte se construit au fil de l'exploration. Elle montre le plan réel de la station tel que le passager le connaît : la pièce actuelle, les pièces visitées, les pièces connues par une porte, et le dernier état vu de chacune. Les stations générées produisent ce plan en même temps qu'elles s'assemblent : une station impossible à dessiner est refusée, comme une station sans chemin sûr (D-084).

Principes repris sans changement : ouvrir la carte est gratuit (D-014) ; ni grille ni distance affichées (D-015) ; seulement ce qui a été visité ou vu (D-075, élargi par D-202) ; hors de vue, le dernier état vu (D-076) ; l'air tenu à jour par les voyants des portes (OP-04) ; la créature en mots (D-141) avec les seuils de D-151 ; aucun chiffre (12 §1) ; jamais la couleur seule (12 §2.6) ; un bruit ne laisse aucune marque (OP-05).

## 2. Ce que le joueur voit

### 2.1 Accès

- Bouton **CARTE** au milieu de la barre de navigation, entre INVENTAIRE et IA STATION (D-192).
- La carte s'ouvre dans une bulle posée au-dessus de la navigation, comme l'inventaire : petites marges sur le pourtour, l'écran de jeu visible derrière un voile, flèche vers CARTE (D-215). Titre « CARTE // RELEVÉ » ; à droite, **LISTE** bascule vers la vue liste (titre « CARTE // LISTE », bouton **PLAN** pour revenir), puis **✕**. ✕, le voile ou un nouveau toucher sur CARTE la referment.
- Ouvrir, parcourir et fermer la carte n'ont aucun effet sur le monde (D-014).
- À l'ouverture, le plan est centré sur la pièce actuelle (D-205).

### 2.2 Couleurs : vert phosphore (D-211)

La carte a sa propre couleur, comme le cyan de l'inventaire (D-176) et le blanc d'IA Station (D-192). Valeurs à juger sur téléphone :

| Jeton | Valeur | Usage | Contraste sur `vert-fond` |
| --- | --- | --- | --- |
| `vert-fond` | `#050A06` | Fond de l'écran de la carte | — |
| `vert-surface` | `#0B140D` | Sol des pièces visitées, bulle de fiche | — |
| `vert` | `#5CFF7A` | Titre, pièce actuelle, icône du passager, étiquettes FEU et CRÉATURE | 15,2:1 |
| `vert-texte` | `#A6F5B0` | Noms des pièces, texte courant, boutons | 15,5:1 |
| `vert-secondaire` | `#62B06D` | Murs des pièces visitées, ancienneté, titres de section, œil de la créature vue il y a longtemps | 7,6:1 |
| `vert-signal` | `#DDFFB8` | Vide : points, étiquette | 18,1:1 |
| `vert-bordure` | `#3E7046` | Murs en pointillé des pièces connues, contour du bouton LISTE | 3,4:1 |
| `vert-separateur` | `#1F3A24` | Filets décoratifs seulement | 1,6:1 |
| `alerte` | `#FF5A4A` | Œil de la créature seulement (D-273), le rouge du danger apparu (12 §2.6) | 6,5:1 (6,1:1 sur `vert-surface`) |

Vidéo inverse pour les étiquettes d'état : `vert-fond` sur `vert` (15,2:1) ou sur `vert-signal` (18,1:1). Les lignes de balayage et la police (IBM Plex Mono) sont celles du jeu (12 §2.2, §2.3).

### 2.3 Échelle et gestes

- Une case du plan vaut **34 px** à la taille de texte STANDARD. L'échelle suit le réglage de taille du texte dans la même proportion que le récit : 34, 38 et 44 px par case pour 17, 19 et 22 px.
- **Glisser** un doigt fait parcourir le plan ; **pincer** zoome, de la vue de toute la partie connue jusqu'au double de l'échelle de base. Bornes exactes à juger sur téléphone.
- En dézoomant, le texte rétrécit avec le plan jusqu'aux trois quarts de sa taille ; au-delà, un nom ou une étiquette qui ne tient plus dans sa pièce disparaît ; les murs, les motifs de sol et les icônes restent visibles (§2.5). Seuil choisi après l'essai du porteur sur téléphone (§9).
- Ni bouton « recentrer » ni « vue d'ensemble » : la carte s'ouvre centrée et se pince (D-205).
- En mouvement réduit (`prefers-reduced-motion`), aucun glissement animé.

### 2.4 Pièces

| Pièce | Dessin | Texte |
| --- | --- | --- |
| Actuelle | Murs de 3 px en `vert`, sol `vert-surface`, icône du passager (§2.5) | Nom en `vert` |
| Visitée | Murs de 2 px en `vert-secondaire`, sol `vert-surface` | Nom en capitales 13/600 `vert-texte` ; « vu il y a un moment » en 12 `vert-secondaire` |
| Connue, pas encore visitée (D-202) | Contour entier en pointillé `vert-bordure`, sans sol | Nom en `vert-secondaire` |

- Une pièce connue non visitée est la destination nommée d'une porte signalée, vue depuis une pièce visitée (§3.3). Son contour entier est dessiné, taille comprise.
- Dans une pièce, l'ordre de priorité est : nom, puis états (§2.5, jamais coupés), puis la place des icônes, puis ancienneté (D-273). L'ancienneté passe à la ligne ou s'efface faute de place ; elle reste lisible dans la vue LISTE.
- Les pièces du même type sont numérotées dans une station (D-208) : CABINE 1, CABINE 2, COULOIR A.

### 2.5 États (D-209)

Chaque état est porté par un motif de sol **et** une étiquette en vidéo inverse : lisible de près, repérable de loin quand la carte est réduite.

| État | Source | Motif | Étiquette |
| --- | --- | --- | --- |
| Feu | Souvenir : foyer vu dans la pièce, ou par une porte ouverte (D-213) | Hachures obliques `vert` à 22 % | **FEU**, puis l'ancienneté du regard |
| Vide | À jour : voyant d'une porte étanche (OP-04) | Points `vert-signal` | **VIDE ○** |
| Créature | Dernière vue (OP-05, D-141 ; repère de D-180) | Œil rouge `alerte` (D-273), voir ci-dessous | **CRÉATURE**, puis « vue il y a un moment » |

Ancienneté en mots (D-151) : « à l'instant » (1 action au plus), « il y a un moment » (2 à 5), « il y a longtemps » (6 et plus). Aucun nombre d'actions n'est affiché ni transmis à l'écran.

Icônes (D-273) :

| Icône | Dessin | Animation | Mouvement réduit |
| --- | --- | --- | --- |
| Passager, pièce actuelle | Point plein `vert` | Trois ondes radar qui s'élargissent en s'estompant | Deux anneaux fixes autour du point |
| Créature, à l'instant ou il y a un moment | Œil `alerte` : contour et pupille pleins | L'intérieur clignote, un cycle toutes les 2 s | Intérieur plein, fixe |
| Créature, il y a longtemps | Œil `vert-secondaire`, intérieur vide | Aucune | Aucune |
| Drone observé (D-307, #232) | Petite tête mécanique verte en pixels, œil central et pince ; dernier emplacement observé | Aucune | Aucune |
| Capteur posé, calme (D-352) | Losange : contour et point `vert` | Aucune | Aucune |
| Capteur posé, mouvement (D-352) | Losange plein `alerte`, point, deux ondes de chaque côté | Aucune | Aucune |
| Capteur posé, brouillé (D-352) | Losange en pointillés `vert-secondaire`, sans point ni onde | Aucune | Aucune |
| Capteur posé, panne ou détruit (D-352) | Losange barré d'une diagonale | Aucune | Aucune |

- Place : au centre de la place laissée sous le texte de la pièce ; au centre de la pièce quand aucun texte n'y tient ; côte à côte, le passager à gauche, si les deux partagent une pièce. Une ancienneté qui prendrait la place de l'icône s'efface du plan.
- Taille : fixe au dézoom, elle suit la taille du texte. L'icône marque la pièce, pas une position : les positions restent en mots dans la vue LISTE (§2.8).
- Jamais la couleur seule : l'œil garde sa forme et l'étiquette CRÉATURE ; le clignotement ne porte aucune information que le texte ne donne pas.
- Le drone se déduit des objets mémorisés, jamais de sa position actuelle cachée. Une pièce seulement connue ne reçoit pas son pictogramme. Sa présence reste accessible par le libellé de la pièce et sa fiche.
- Le capteur (D-350 à D-352) marque la pièce où il est posé, qu'elle soit visitée ou non : le passager l'a fixé lui-même, la carte en donne l'état réel à chaque lecture, y compris pièce hors de vue, comme la carte révélée des versions de test. La forme dit l'état sans la couleur (ondes, pointillés, barre). La vue LISTE, la fiche de la pièce et la commande `carte` de la CLI le disent en mots : « CAPTEUR : calme », « CAPTEUR : MOUVEMENT », « CAPTEUR : brouillé », « CAPTEUR : plus de signal ». « Calme » n'est jamais affiché dans une pièce aveugle.
- **« ! » sur CARTE** (D-352) : à chaque changement d'état du capteur, un « ! » vert à cheval sur le bord de CARTE, comme celui d'IA STATION (D-263) ; il s'éteint à l'ouverture de la carte et ne se rallume pas à la pose. Il ne survit ni aux options ni au rechargement.
- Avec trois présences, chaque symbole conserve son propre centre. Dans les petites pièces au dézoom, les trois dessins sont réduits ensemble pour tenir dans la pièce ; les cas à une ou deux présences restent inchangés (détail de réalisation de D-307, à vérifier sur téléphone).

### 2.6 Portes et passages

- Une porte est une **ouverture** dans le mur commun, bordée de deux petits taquets. Fermée au dernier regard, une **barre** claire et épaisse la bouche (D-355).
- Porte étanche : son **voyant** n'est pas dessiné sur le plan (D-355). L'air qu'il donne, tenu à jour dès que la destination est connue (OP-04, détails de #104), se lit par le motif et l'étiquette VIDE de la pièce, dans sa fiche et dans la vue LISTE.
- Grille, conduit étroit, panneau : ouverture en tirets.
- Passage sans signalétique à destination inconnue : ouverture en tirets et « **?** ». Ce passage ne fait pas connaître la pièce d'en face (OP-03). Si cette pièce est connue par ailleurs, la géométrie peut laisser deviner la destination ; aucun texte ne la nomme.
- Passage caché non découvert : rien, de chaque côté, même de celui où le panneau se voit, puisqu'il ne se distingue pas d'un panneau ordinaire (K-05, AR-01 §11.1). Découvert, il se dessine comme les autres.
- Conduit sans mur commun (§4.1) : tracé en pointillé à travers le vide, une fois découvert.
- Capsule : dessinée arrimée dehors, contre le mur de coque de sa salle d'embarquement, une fois cette salle visitée. La cabine, sous-position, n'est jamais dessinée (C-02 §2).

### 2.7 Fiche d'une pièce (D-210)

- Toucher une pièce visitée l'entoure et ouvre sa **fiche** dans une bulle ancrée (12 §3.6, D-146), sur un voile. Gratuit. ✕, un toucher ailleurs ou FERMER LA CARTE la referment.
- Contenu : le nom ; « ── ÉTAT VU ── » avec les états (§2.5) et leur ancienneté ; « ── OBJETS VUS ── » avec les objets vus au dernier regard (« ▸ Burette d'huile », NP-04). Rien d'autre.
- Toucher une pièce connue non visitée : son nom, « pas encore visitée », et VIDE ○ si son voyant le dit.
- La carte ne déplace jamais le passager : pas de « aller ici ».

### 2.8 Vue LISTE (D-212)

Même information que le plan, en texte ; c'est l'équivalent complet pour les lecteurs d'écran et les grandes tailles de texte. Trois blocs :

1. **ICI** : la pièce actuelle (« @ vous ») ; ses passages, avec destination ou « destination ? », ouvert ou fermé, AIR ou VIDE pour une porte étanche ; les **positions en mots** du passager et des objets placés (« VOUS ......... sous la grille »). Les positions ne sont données qu'ici.
2. **VISITÉES, DE LA PLUS PROCHE** : par nombre de passages connus depuis la pièce actuelle, puis du regard le plus récent au plus ancien ; pour chaque pièce : nom, ancienneté, états, passages à destination inconnue.
3. **CONNUES, PAS ENCORE VISITÉES** : nom, « par sa porte », VIDE si le voyant le dit.

### 2.9 Accessibilité

- Le plan porte un libellé accessible (« Plan de la station ; vous êtes dans le local de sécurité ») et renvoie à la vue LISTE.
- Une pièce touchable fait au moins 44 × 44 px (une pièce de 2 × 2 cases fait 68 px à l'échelle de base).
- Focus : la fiche le prend à l'ouverture et le rend à la pièce à la fermeture (12 §7).

### 2.10 Ce qui n'apparaît jamais

Pièce inconnue, forme comprise ; passage caché non découvert ; destination d'un passage sans signalétique non franchi ; état actuel d'une pièce hors de vue, sauf l'air des voyants ; marque de bruit ; chiffre (distance, nombre d'actions, échelle).

## 3. Mémoire du passager et carte publique

### 3.1 Souvenirs

L'état sauvegardé garde, pour chaque pièce dont le passager a vu quelque chose, un **souvenir** :

- le nombre d'actions confirmées au moment du dernier regard ;
- le feu vu ou non ;
- les objets vus dans la pièce (au sol, posés à une position, installés), avec leur position ;
- pour chaque liaison perçue de la pièce, ouverte ou fermée.

Mise à jour : au réveil, puis à la fin de chaque action, pour la pièce actuelle (vue directe, C-06 §2). Un passage ouvert sur une pièce en feu, vu depuis la pièce actuelle, met aussi à jour le feu de la pièce d'en face, visitée ou non (D-213). La dernière vue de la créature reste celle des repères de D-180.

### 3.2 Ancienneté

Différence entre le nombre d'actions confirmées et celui du souvenir, traduite en palier (§2.5). La carte publique transmet le palier (`instant`, `moment`, `longtemps`), jamais le nombre.

### 3.3 Pièces connues

- **Visitées** : celles où le passager est entré.
- **Connues, non visitées** : destination d'une liaison signalée perçue depuis une pièce visitée ; destination d'un passage sans signalétique une fois découverte.
- **Jamais** : une sous-position ; une pièce derrière un passage caché non découvert ; la destination d'un passage sans signalétique non découvert.

### 3.4 Carte publique

L'observation (C-01, C-06 §1) reçoit une partie `carte`, avec les mêmes identifiants publics opaques et les mêmes clés de nom :

- **pièces** : pour chaque pièce connue, sa référence, son statut (`actuelle`, `visitee`, `connue`), son rectangle en cases, le palier d'ancienneté du dernier regard, le feu vu et son palier, le vide lu sur un voyant, la créature vue ici et son palier, les objets vus, et la distance en passages connus depuis la pièce actuelle ;
- **passages** : pour chaque liaison perçue depuis une pièce visitée, sa référence, ses deux pièces (destination `null` si inconnue), son dernier état vu, sa sorte (porte, porte étanche avec voyant, grille, conduit, panneau) et son emplacement sur le plan (mur et case, ou tracé du conduit) ;
- **capsule** : son emplacement sur la coque, si sa salle d'embarquement est visitée ;
- **ici** : les positions du passager et des objets placés dans la pièce actuelle.

La forme ou l'emplacement d'une pièce ou d'un passage inconnus ne figurent jamais dans l'observation : l'écran ne peut rien laisser fuir.

### 3.5 Sauvegarde, rejeu, ligne de commande

- Les souvenirs font partie de l'état sauvegardé à chaque action (C-09) ; un rejeu ou une reprise redonnent la même carte (K-08).
- Rien ne change pendant la fermeture (D-014).
- La CLI affiche la carte en liste (commande `carte`), au contenu de la vue LISTE (K-07).

### 3.6 Exemples à prouver

Ceux de C-06 §7 (K-01, K-02, K-05, K-07, K-08) restent valables. S'y ajoutent :

| ID | Cas | Attendu |
| --- | --- | --- |
| K-09 | Porte ouverte sur une pièce en feu jamais visitée | La pièce, connue par la porte, porte FEU sur la carte |
| K-10 | Objet déplacé hors de vue par une règle du monde | Fiche et liste gardent l'ancienne position jusqu'au prochain regard |
| K-11 | Une, deux puis six actions après un regard | « à l'instant », « il y a un moment », « il y a longtemps » |
| K-12 | Passage sans signalétique franchi | « ? » avant, destination dessinée et nommée après |
| K-13 | Deux mondes qui ne diffèrent que par une pièce jamais connue | Même carte publique, octet pour octet |

## 4. Plans des stations

### 4.1 Format

- Chaque pièce porte un rectangle en cases entières (`x`, `y`, largeur et hauteur d'au moins 2). Dans un monde, toutes les pièces en ont un, ou aucune.
- Une porte se place au milieu du mur commun des deux pièces ; l'auteur peut fixer sa case.
- Une liaison sans mur commun (conduit) porte un tracé : une suite de cases libres et contiguës qui touche les deux pièces.
- Une sous-position (cabine) n'a pas de rectangle.
- Les pièces de coque sont celles qui portent un vitrage extérieur, la salle d'embarquement d'une capsule, et un sas extérieur.

### 4.2 Vérifieur

| ID | Règle |
| --- | --- |
| PL-01 | Aucune pièce n'en chevauche une autre. |
| PL-02 | Toute liaison a un mur commun d'au moins une case (deux entre morceaux, §5.2), ou un tracé de conduit valide. |
| PL-03 | Aucun vide n'est enfermé entre les pièces. |
| PL-04 | Chaque nom tient dans sa pièce à 34 px par case, avec la place d'une ligne d'état : 13 px en 600 avec un interlettrage de 0,04 em, soit 8,32 px par caractère ; marges de 8 px ; lignes de 17 px. |
| PL-05 | Une pièce de coque a un pan de mur d'au moins deux cases donnant sur au moins quatre cases libres, que rien ne vient occuper. |
| PL-06 | Une pièce a au plus six portes. |
| PL-07 | Le plan ne dépend que du monde, et de la graine pour une station générée. |

### 4.3 Plans d'AR-01, d'AR-02 et du monde de test

Dessinés à la main dans la livraison 1 (§7) et montrés au porteur en captures avant fusion. Contraintes :

- **AR-01** : le panneau caché entre le local énergie et la salle d'embarquement passe par un mur commun ou un conduit ; la baie d'observation et la salle d'embarquement touchent la coque ; les noms de D-197 tiennent.
- **AR-02** : la salle panoramique, dont la baie peut être percée, et la salle d'embarquement touchent la coque.
- **Monde de test** : un plan simple, pour les tests du moteur.

## 5. Génération des plans (#106)

### 5.1 Tuiles dessinées (D-204)

Chaque morceau (C-08 GP-01) porte son plan : ses pièces en cases, ses portes internes, et ses pièces d'entrée et de sortie, qui servent de points d'attache. Les pièces sans obstacle (couloirs, cabines, réfectoire…) et les petites pièces sont aussi des tuiles.

### 5.2 Assemblage

| ID | Règle |
| --- | --- |
| GE-01 | Porte souple : la porte entre deux tuiles se place n'importe où sur un mur commun d'au moins deux cases. |
| GE-02 | Une tuile peut être retournée en miroir, jamais tournée. |
| GE-03 | Un emboîtement qui enferme un vide est refusé, et un autre est essayé. |
| GE-04 | L'assembleur vise la proportion de l'écran (largeur ≈ 0,76 × hauteur), sans limite de taille : la carte défile. |
| GE-05 | Le chemin principal se cherche avec retour en arrière ; une station sans plan est retirée et retirée au sort, comme une station sans chemin sûr. |
| GE-06 | Même graine, même plan. |

### 5.3 Grandes stations et petites pièces (D-205, D-206, D-313)

Les grandes stations (#205, D-313) comptent 22 à 28 pièces dessinées (21 quand une pièce du catalogue ne trouve pas sa place), et seules elles sortent au tirage. Une petite station n'a que le premier temps ci-dessous. Une grande station se construit en trois temps, chacun sur sa propre sous-graine (même graine, même plan, GE-06) :

1. le chemin principal (départ, trois morceaux de chemin, final, embarquement), par recherche ;
2. les annexes, pièces du catalogue (D-316), posées une à une sans défaire ce qui est posé : les couloirs d'abord, chacun avec ses deux premières pièces ; puis deux passages posés exprès pour qu'une porte de boucle puisse fermer un cycle (les connecteurs) ; puis les autres. Une annexe sans place essaie une autre pièce d'accroche ;
3. les portes de boucle, une à trois, entre des pièces qui se touchent déjà (GE-13, D-318). Une graine où aucune ne trouve sa place n'a pas de plan.

Vient ensuite la piste de la créature (D-317). Une annexe s'accroche à une pièce qu'un morceau déclare accueillante, avec sa catégorie, ou à un couloir du catalogue.

Les **pièces en impasse** (couchettes, sanitaires, cambuse, consigne…) n'ont qu'une porte : rien ne s'y accroche et aucune boucle n'y mène.

### 5.4 Cohérence (D-207)

| ID | Règle |
| --- | --- |
| GE-07 | Coque dégagée (PL-05), réservée dès la pose de la pièce. |
| GE-08 | Chaque pièce a une catégorie : vie, technique, circulation, science, commandement, évacuation, fret (D-316). Une pièce de morceau qui accueille une annexe déclare la sienne ; chaque pièce du catalogue a la sienne. |
| GE-09 | Architecture : toute pièce de couchage ou sanitaire s'atteint depuis le départ sans traverser de pièce technique, toutes portes supposées ouvertes. Cette règle ne vaut pas pour le chemin imposé par l'incident : l'histoire peut passer par des pièces de vie et imposer un détour par la technique. |
| GE-10 | WC et salle de bain s'ouvrent sur un couchage, ou sur un couloir qui en dessert un. |
| GE-11 | Un couloir posé attire deux à quatre pièces ; six portes au plus (PL-06). |
| GE-12 | Une station peut compter plusieurs zones de vie, techniques, scientifiques ou de commandement, reliées en plusieurs points, sans sas obligatoire. C'est possible, jamais obligatoire. |
| GE-13 | Une porte de boucle relie deux pièces d'une même zone de jeu : celle qu'on parcourt sans franchir une coupe (l'obstacle déclaré par un morceau, ou une cloison verrouillée). Elle ferme un cycle d'au moins quatre pièces et ne mène ni à une impasse ni au repaire. Un contrôle structurel vérifie qu'aucune porte ne contourne un obstacle, puis la preuve de jeu de chaque station publiée (D-326) : une porte qui contournerait un obstacle n'est pas posée. |

### 5.5 Noms des pièces répétées (D-208)

Dans une station, les pièces du même nom sont désignées par une lettre, dans l'ordre des pièces (COULOIR A, COULOIR B ; BUREAU DU FRET A), avec le même nom partout : récit, dock, carte, fiche (NP-04). D-208 parlait de numéros ; la lettre est celle des stations assemblées depuis L3.

### 5.6 Critères pour #106

Petites stations d'abord (D-242) : sur 1 000 tirages, toute station proposée a un plan qui passe PL-01 à PL-07 et GE-01 à GE-07 (D-245) ; au moins 95 % des tirages trouvent un plan ; moins de 50 ms par station sur PC ; même graine, même plan ; une galerie de plans rendus est jointe à la PR.

Dans la vérification (#180, D-271), `check:stations` mesure 100 graines par chemin de tuiles, avec le même seuil : au moins 95 % de plans trouvés par chemin, sinon la vérification échoue. Les 1 000 graines par chemin et les 1 000 tirages complets du catalogue restent mesurés à la demande : `npm run verify:complet` (ou `npm run check:stations -- --complet`) et `npm run mesurer:tirages`. Les mesures ci-dessous ont été prises sur 1 000 graines.

Mesures locales de L2 (#152), sans assertion de temps : sur 1 000 tirages par chemin (vestibule, M-07 ou M-10, M-03), 1 000 plans sur 1 000, 0,34 et 0,33 ms en moyenne, 2,33 et 1,69 ms au plus, échecs compris ([13 §7.5](13-morceaux-lancement.md#75-première-station-tirée-l2-152)). Une recherche sans plan s'arrête au budget de pose de 2 000 candidats évalués. Mesuré sur des chaînes de tuiles de test qui n'ont aucun plan, pas sur les morceaux réels : à trois tuiles, un échec coûte environ 16 ms en moyenne et 25 ms au plus ; à quatre, environ 44 ms en moyenne et jusqu'à 58 ms, au-delà des 50 ms visés. À reprendre en L3, dont les stations auront quatre tuiles.

Mesures locales de L3 (#153), sans assertion de temps ([13 §7.6](13-morceaux-lancement.md#76-baie-passerelle-sans-gravité-l3-153)) :
- 32 chaînes de tuiles : vestibule, un ou deux morceaux de chemin parmi M-07 à M-10, M-03 ou M-06 ;
- sur 1 000 graines par chaîne : 1 000 plans sur 1 000 pour chacune, au plus 2,74 ms en moyenne pour une chaîne, 7,29 ms pour le pire tirage ;
- sur 1 000 tirages complets du catalogue : 1 000 stations, 1,08 ms en moyenne et 8,32 ms au plus.

Mesures locales de L4 (#154), sans assertion de temps ([13 §7.7](13-morceaux-lancement.md#77-chemins-dar-01-l4-154)) :
- 128 chaînes de tuiles : vestibule, un ou deux morceaux de chemin parmi les huit, M-03 ou M-06 ;
- sur 1 000 graines par chaîne : 1 000 plans sur 1 000 pour chacune, au plus 2,06 ms en moyenne pour une chaîne, 10,42 ms pour le pire tirage ;
- sur 1 000 tirages complets du catalogue : 1 000 stations, 0,80 ms en moyenne et 5,21 ms au plus.

Mesures locales de L5 (#155), ordre libre, sans assertion de temps ([13 §7.8](13-morceaux-lancement.md#78-ordre-libre-et-mesures-l5-155)) :
- 56 chaînes de tuiles en arbre : vestibule, carrefour (couloir de 16 cases et sas au bout), final accroché au sas, puis deux branches accrochées au couloir ;
- sur 1 000 graines par chaîne : au moins 987 plans (M-07 et M-10 avec M-06), au plus 3,3 ms en moyenne pour une chaîne ;
- les 128 chaînes de L4 gardent leur plan pour chaque graine : l'ordre de pose et le tirage sont ceux d'avant L5.

Les échecs de pose mesurés sur des chaînes sans plan ne se produisent pas avec les vraies tuiles.

Grandes stations (#205, D-313) : critères de la [conception](superpowers/specs/2026-10-18-grandes-stations-design.md#11-mesures-et-critères-dacceptation), mesures dans [13 §7.12](13-morceaux-lancement.md#712-grandes-stations-livraison-1-205-206). Une galerie de plans rendus est jointe à la PR par les captures. Livraison 3 : au zoom d'ensemble d'une grande station, les noms des pièces ne se lisent pas sur les captures à 390 et 320 px, et le plan ouvert centré sur le passager sort du cadre à gauche ; les bornes de zoom n'ont pas changé, la décision revient au porteur ([13 §7.14](13-morceaux-lancement.md#714-grandes-stations-livraison-3-209)).

## 6. Ce que le prototype a mesuré

Prototype jetable du 2026-10-12 : tuiles approximatives des dix morceaux d'après leurs fiches, assembleur géométrique seul (sans règles de jeu).

Petites stations (départ, un ou deux obstacles, final, embarquement), 1 000 tirages :

| Placement des portes entre tuiles | En chaîne | En boucle |
| --- | --- | --- |
| Rigide (mur et case fixés) | 78 % | 0 % |
| Rigide, tuiles tournées | 91 % | 0 % |
| Souple (GE-01) | 100 % | 96 % |

Tourner les tuiles rendait 86 % des plans illisibles ; le miroir ne coûte rien. Refuser les vides enfermés (18 % des plans sinon) ne coûte rien. Réglage final : 98 % de plans trouvés, tous lisibles, environ 780 plans différents sur 1 000 tirages, moins d'une milliseconde par station.

Grandes stations, méthode en trois temps, 100 tirages par taille :

| Taille | Plan trouvé | Petites pièces | Plan à 34 px par case | Temps |
| --- | --- | --- | --- | --- |
| 20 pièces | 100 % | 3 | ≈ 690 × 650 px | 1 ms |
| 30 pièces | 100 % | 6 | ≈ 870 × 760 px | 3 ms |
| 40 pièces | 100 % | 9 | ≈ 1 020 × 870 px | 5 ms |
| 60 pièces | 100 % | 15 | ≈ 1 290 × 1 050 px | 13 ms |

L'assembleur naïf, qui remettait tout en cause pour placer une annexe, ne trouvait un plan que pour 15 % des stations de 20 pièces.

Cohérence, 100 tirages par taille de 10 à 40 pièces : avec GE-07 à GE-11, 100 % de plans trouvés, 100 % des règles tenues (contre 8 à 98 % sans elles), 20 ms au pire. Par zones (GE-12) : 100 % de plans, deux à quatre zones, 17 ms au pire.

Limites : les tuiles sont des approximations ; seule la géométrie est vérifiée, sans chemin sûr ni mélange de morceaux ; la règle de zone des boucles est une approximation que le vérifieur de jeu doit garantir.

## 7. Découpage

| Livraison | Contenu | Zone |
| --- | --- | --- |
| #97 — 1. Plans | Format (§4.1), vérifieur (§4.2), plans d'AR-01, d'AR-02 et du monde de test, captures des plans | Orange |
| #97 — 2. Mémoire | Souvenirs, carte publique, sauvegarde, commande `carte` de la CLI (§3), exemples K | Orange (moteur) |
| #97 — 3. Écran | Tout le §2, captures sur téléphone simulé ; **validation humaine requise** | Orange |
| #106 | Assemblage géométrique des stations générées (§5), avec les morceaux ; petites stations d'abord (D-242) ; chemin principal seulement (GE-01 à GE-06 du §5.2 et GE-07 du §5.4, D-245) ; découpage dans [13 §7](13-morceaux-lancement.md#7-découpage-de-106) | Orange |
| #206 | Catalogue des pièces sans obstacle : plans, catégories, textes, numérotation (D-316) | Livraison 1 des grandes stations |
| #205 (D-313) | Grandes stations : annexes, boucles, GE-08 à GE-13 (§5.3, §5.4), preuve par station publiée (D-326) | Livraison 1 des grandes stations |
| #202 | Objets nécessaires placés hors de leur morceau (D-244, D-319) | Livraison 2 des grandes stations |

Ordre : 1, puis 2, puis 3. Deux issues qui touchent le moteur ne se mènent pas en même temps.

## 8. Décisions et documents touchés

- Journal : D-201 à D-214 ; précisé par D-242 (petites stations d'abord) et D-244 (objets hors de leur morceau) ; D-214 modifiée par D-245 (#106 ne dessine que le chemin principal).
- [C-06 §3](contrats/C-06-observation-connaissances.md) : OP-03 amendé par D-202 (pièces connues dessinées) ; souvenirs et carte publique par D-213.
- [12 §4.8](12-interface-ecrans.md) : forme de la carte remplacée par ce document (D-201) ; jetons verts ajoutés en §2.1 (D-211).
- Issue #97 : périmètre élargi à l'air et à la créature (D-203) ; positions en mots dans la vue LISTE seulement (D-212) ; trois livraisons (D-214).

## 9. Points ouverts

- Bornes du zoom et seuil de disparition des noms : à juger sur téléphone.
- Lisibilité de la carte à 28 pièces sur téléphone : à juger par le porteur (grandes stations, livraison 1).
- Durée d'une grande station (15 à 20 minutes de découverte, D-313) : à mesurer sur téléphone (D-280).
