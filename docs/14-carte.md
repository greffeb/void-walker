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
| `vert` | `#5CFF7A` | Titre, pièce actuelle, étiquettes FEU et CRÉATURE, losange | 15,2:1 |
| `vert-texte` | `#A6F5B0` | Noms des pièces, texte courant, boutons | 15,5:1 |
| `vert-secondaire` | `#62B06D` | Murs des pièces visitées, ancienneté, titres de section | 7,6:1 |
| `vert-signal` | `#DDFFB8` | Vide : points, étiquette, voyant | 18,1:1 |
| `vert-bordure` | `#3E7046` | Murs en pointillé des pièces connues, contour du bouton LISTE | 3,4:1 |
| `vert-separateur` | `#1F3A24` | Filets décoratifs seulement | 1,6:1 |

Vidéo inverse pour les étiquettes d'état : `vert-fond` sur `vert` (15,2:1) ou sur `vert-signal` (18,1:1). Les lignes de balayage et la police (IBM Plex Mono) sont celles du jeu (12 §2.2, §2.3).

### 2.3 Échelle et gestes

- Une case du plan vaut **34 px** à la taille de texte STANDARD. L'échelle suit le réglage de taille du texte dans la même proportion que le récit : 34, 38 et 44 px par case pour 17, 19 et 22 px.
- **Glisser** un doigt fait parcourir le plan ; **pincer** zoome, de la vue de toute la partie connue jusqu'au double de l'échelle de base. Bornes exactes à juger sur téléphone.
- En dézoomant, le texte rétrécit avec le plan jusqu'aux trois quarts de sa taille ; au-delà, un nom ou une étiquette qui ne tient plus dans sa pièce disparaît ; les murs, les motifs de sol et le losange restent visibles (§2.5). Seuil choisi après l'essai du porteur sur téléphone (§9).
- Ni bouton « recentrer » ni « vue d'ensemble » : la carte s'ouvre centrée et se pince (D-205).
- En mouvement réduit (`prefers-reduced-motion`), aucun glissement animé.

### 2.4 Pièces

| Pièce | Dessin | Texte |
| --- | --- | --- |
| Actuelle | Murs de 3 px en `vert`, sol `vert-surface` | Nom en `vert`, repère « @ VOUS » |
| Visitée | Murs de 2 px en `vert-secondaire`, sol `vert-surface` | Nom en capitales 13/600 `vert-texte` ; « vu il y a un moment » en 12 `vert-secondaire` |
| Connue, pas encore visitée (D-202) | Contour entier en pointillé `vert-bordure`, sans sol | Nom en `vert-secondaire` |

- Une pièce connue non visitée est la destination nommée d'une porte signalée, vue depuis une pièce visitée (§3.3). Son contour entier est dessiné, taille comprise.
- Dans une pièce, l'ordre de priorité est : nom, puis états (§2.5, jamais coupés), puis ancienneté. L'ancienneté passe à la ligne ou s'efface faute de place ; elle reste lisible dans la vue LISTE.
- Les pièces du même type sont numérotées dans une station (D-208) : CABINE 1, CABINE 2, COULOIR A.

### 2.5 États (D-209)

Chaque état est porté par un motif de sol **et** une étiquette en vidéo inverse : lisible de près, repérable de loin quand la carte est réduite.

| État | Source | Motif | Étiquette |
| --- | --- | --- | --- |
| Feu | Souvenir : foyer vu dans la pièce, ou par une porte ouverte (D-213) | Hachures obliques `vert` à 22 % | **FEU**, puis l'ancienneté du regard |
| Vide | À jour : voyant d'une porte étanche (OP-04) | Points `vert-signal` | **VIDE ○** |
| Créature | Dernière vue (OP-05, D-141 ; repère de D-180) | Losange `vert` avec un point, dans un coin de la pièce | **CRÉATURE**, puis « vue il y a un moment » |

Ancienneté en mots (D-151) : « à l'instant » (1 action au plus), « il y a un moment » (2 à 5), « il y a longtemps » (6 et plus). Aucun nombre d'actions n'est affiché ni transmis à l'écran.

### 2.6 Portes et passages

- Une porte est une **ouverture** dans le mur commun. Fermée au dernier regard, elle est barrée d'un trait fin.
- Porte étanche : un **voyant** dans l'ouverture, plein ● pour l'air, vide ○ pour le vide, tenu à jour dès que la destination est connue (OP-04, détails de #104).
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

### 5.3 Grandes stations et petites pièces (D-205, D-206)

Une station peut compter 20 pièces et plus. Au lancement, on commence par de petites stations, sans annexes ni boucles (D-242) : seul le premier temps ci-dessous sert aux petites stations ; les deux autres attendent que la durée des parties demande de grandes stations. Ils iront dans une issue à part, créée avec l'accord du porteur si la durée le demande (D-245). Une grande station se construit en trois temps :

1. le chemin principal (départ, obstacles, final, embarquement), par recherche ;
2. les annexes, posées une à une sans défaire ce qui est posé ; une annexe sans place essaie une autre pièce d'accroche ;
3. les portes de boucle, entre des pièces qui se touchent déjà (GE-13).

Les **petites pièces** (placard à balai, WC, salle de bain, cabine d'équipage, local technique) n'ont qu'une porte : rien ne s'y accroche.

### 5.4 Cohérence (D-207)

| ID | Règle |
| --- | --- |
| GE-07 | Coque dégagée (PL-05), réservée dès la pose de la pièce. |
| GE-08 | Chaque pièce a une catégorie : vie, technique, circulation, science, commandement, évacuation. La liste se complète avec le catalogue des pièces. |
| GE-09 | Architecture : toute pièce de couchage ou sanitaire s'atteint depuis le départ sans traverser de pièce technique, toutes portes supposées ouvertes. Cette règle ne vaut pas pour le chemin imposé par l'incident : l'histoire peut passer par des pièces de vie et imposer un détour par la technique. |
| GE-10 | WC et salle de bain s'ouvrent sur un couchage, ou sur un couloir qui en dessert un. |
| GE-11 | Un couloir posé attire deux à quatre pièces ; six portes au plus (PL-06). |
| GE-12 | Une station peut compter plusieurs zones de vie, techniques, scientifiques ou de commandement, reliées en plusieurs points, sans sas obligatoire. C'est possible, jamais obligatoire. |
| GE-13 | Une porte de boucle relie deux pièces d'une même zone de jeu, du même côté des obstacles. Le vérifieur de jeu (GP-05) prouve qu'aucune porte ne contourne un obstacle ; sinon, l'incident doit la fermer (porte bloquée, feu, vide, gravats). |

### 5.5 Noms des pièces répétées (D-208)

Dans une station, les pièces du même type sont numérotées (CABINE 1, CABINE 2 ; COULOIR A, COULOIR B), avec le même nom partout : récit, dock, carte, fiche (NP-04).

### 5.6 Critères pour #106

Petites stations d'abord (D-242) : sur 1 000 tirages, toute station proposée a un plan qui passe PL-01 à PL-07 et GE-01 à GE-07 (D-245) ; au moins 95 % des tirages trouvent un plan ; moins de 50 ms par station sur PC ; même graine, même plan ; une galerie de plans rendus est jointe à la PR.

Mesures locales de L2 (#152), sans assertion de temps : sur 1 000 tirages par chemin (vestibule, M-07 ou M-10, M-03), 1 000 plans sur 1 000, 0,34 et 0,33 ms en moyenne, 2,33 et 1,69 ms au plus, échecs compris ([13 §7.5](13-morceaux-lancement.md#75-première-station-tirée-l2-152)). Une recherche sans plan s'arrête au budget de pose de 2 000 candidats évalués. Mesuré sur des chaînes de tuiles de test qui n'ont aucun plan, pas sur les morceaux réels : à trois tuiles, un échec coûte environ 16 ms en moyenne et 25 ms au plus ; à quatre, environ 44 ms en moyenne et jusqu'à 58 ms, au-delà des 50 ms visés. À reprendre en L3, dont les stations auront quatre tuiles.

Mesures locales de L3 (#153), sans assertion de temps ([13 §7.6](13-morceaux-lancement.md#76-baie-passerelle-sans-gravité-l3-153)) :
- 32 chaînes de tuiles : vestibule, un ou deux morceaux de chemin parmi M-07 à M-10, M-03 ou M-06 ;
- sur 1 000 graines par chaîne : 1 000 plans sur 1 000 pour chacune, au plus 2,74 ms en moyenne pour une chaîne, 7,29 ms pour le pire tirage ;
- sur 1 000 tirages complets du catalogue : 1 000 stations, 1,08 ms en moyenne et 8,32 ms au plus.

Mesures locales de L4 (#154), sans assertion de temps ([13 §7.7](13-morceaux-lancement.md#77-chemins-dar-01-l4-154)) :
- 128 chaînes de tuiles : vestibule, un ou deux morceaux de chemin parmi les huit, M-03 ou M-06 ;
- sur 1 000 graines par chaîne : 1 000 plans sur 1 000 pour chacune, au plus 2,06 ms en moyenne pour une chaîne, 10,42 ms pour le pire tirage ;
- sur 1 000 tirages complets du catalogue : 1 000 stations, 0,80 ms en moyenne et 5,21 ms au plus.

Les échecs de pose mesurés sur des chaînes sans plan ne se produisent pas avec les vraies tuiles.

Hors #106 : pour les grandes stations, dans l'issue à part prévue si la durée le demande (D-245), sur 1 000 tirages par taille (10 à 60 pièces), toute station proposée a un plan qui passe PL-01 à PL-07 et GE-07 à GE-11 ; au moins 95 % des tirages trouvent un plan ; moins de 50 ms par station sur PC ; une galerie de plans rendus est jointe à la PR.

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
| Nouvelle issue | Catalogue des pièces sans obstacle et des petites pièces : plans, catégories, textes, numérotation | À créer avec l'accord du porteur |
| Nouvelle issue (D-245) | Grandes stations : annexes, boucles, GE-08 à GE-13 (§5.3, §5.4), vérifieur par morceaux ; seulement si la durée des parties le demande (D-242) | À créer avec l'accord du porteur |
| Nouvelle issue, après les annexes | Objets nécessaires placés hors de leur morceau, avec une règle de placement à décider ; à ne pas oublier (D-244) | À créer avec l'accord du porteur |

Ordre : 1, puis 2, puis 3. Deux issues qui touchent le moteur ne se mènent pas en même temps.

## 8. Décisions et documents touchés

- Journal : D-201 à D-214 ; précisé par D-242 (petites stations d'abord) et D-244 (objets hors de leur morceau) ; D-214 modifiée par D-245 (#106 ne dessine que le chemin principal).
- [C-06 §3](contrats/C-06-observation-connaissances.md) : OP-03 amendé par D-202 (pièces connues dessinées) ; souvenirs et carte publique par D-213.
- [12 §4.8](12-interface-ecrans.md) : forme de la carte remplacée par ce document (D-201) ; jetons verts ajoutés en §2.1 (D-211).
- Issue #97 : périmètre élargi à l'air et à la créature (D-203) ; positions en mots dans la vue LISTE seulement (D-212) ; trois livraisons (D-214).

## 9. Points ouverts

- Bornes du zoom et seuil de disparition des noms : à juger sur téléphone.
- Liste complète des catégories et des règles de cohérence : à écrire avec le catalogue des pièces (§5.4).
- Taille des stations et durée de partie (15 à 30 minutes, D-008) : un réglage à mesurer, pas une limite technique. Petites stations d'abord, grandes seulement si la durée le demande (D-242).
