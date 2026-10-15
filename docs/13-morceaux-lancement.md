# Morceaux du lancement — conception

> **Statut :** CONCEPTION ACCEPTÉE v1.0 — cadre D-156 à D-171 ; familles, fiches, règles de mélange MX-01 à MX-05 et parcours acceptés par D-172 à D-175 ; cadrage L0 accepté par D-257 à D-260 (§8) ; places de la créature dans M-07 et M-03 fixées par D-261, qui modifie la fiche M-07, et D-262 (§7.5) ; conception de L3 (M-06, M-08, M-09, stations à deux chemins) approuvée par D-263 et D-264 (§7.6).
> **Mise à jour :** 2026-10-15.
> **Implémentation :** règles des quatre nouveaux morceaux et des mélanges MX-01, MX-04, MX-05 proposées par #105, chacune prouvée dans une station de test (`?monde=m-07` à `m-10`) ; précisions du porteur D-234 à D-240. Assemblage des stations : #106, petites stations d'abord (D-242), objets dans leur morceau (D-244), découpage accepté au §7 (D-245), règles d'assemblage D-246 à D-256 ; L2 fusionnée (PR #160) ; L3 proposée par sa PR (§7.6). **Parties sur téléphone :** deux parties signées en L2, avec M-07 et M-03 ([journal](journal-parties-humaines.md)) ; aucune pour M-06, M-08, M-09, M-10.

Document d'auteur : il contient les solutions. Interdit au playtester (C-01).

## 1. Cadre accepté

- Dix morceaux : six tirés d'AR-01/AR-02, quatre nouveaux (D-157/D-158).
- Une station : une pièce de départ, deux ou trois obstacles dont **un seul problème final**, l'embarquement avec sa capsule, une seule créature (D-119, D-159, GP-02).
- Obstacles en chaîne ou en ordre libre (D-160) ; créature placée à un endroit prévu par un morceau, jamais au départ (D-161) ; tirage du problème final à pile ou face, puis de la station au pur hasard parmi celles qui ont ce final, une station déjà jouée pouvant revenir (D-162, D-253).
- Deux morceaux qui jouent sur la même chose (bruit, ralentissement, neutralisation, air) ne se mélangent qu'une fois leurs règles décidées (D-167) ; les autres se mélangent sans règle de plus (D-248).
- Toujours un chemin sûr au départ, vérifié avant de jouer (D-084).

## 2. Les deux familles de morceaux (D-172)

| Famille | Rôle | Morceaux |
| --- | --- | --- |
| **Final** | Le problème à régler juste avant de partir | M-03 Énergie, M-06 Baie |
| **Chemin** | Obstacles entre le départ et l'embarquement | M-01, M-02, M-04, M-05, M-07, M-08, M-09, M-10 |

Une station = départ → un ou deux morceaux « chemin » → un morceau « final » → embarquement. Le morceau final apporte l'embarquement et sa capsule (D-249) ; au départ, les portes entre deux morceaux sont fermées (D-252) ; le tirage choisit d'abord le final à pile ou face (D-253).

En ordre libre, les deux branches donnent chacune accès à une commande distincte, nécessaire pour déverrouiller l'une des deux cloisons successives avant le final (D-259, §8.3). Ce ne sont pas deux itinéraires interchangeables. À partir de L2, NOUVELLE PARTIE tire une station aussi dans la version publique ; seul le final énergie est disponible en L2, puis le pile ou face s'applique dès que les deux finals sont disponibles et vérifiés (D-260, §8.4).

## 3. Fiches

Chaque fiche donne : les pièces apportées, les objets, les places possibles de la créature (D-161), le chemin sûr et une variante risquée.

La pièce de départ, hors des dix morceaux, est le vestibule de réveil décrit au §8.1 (D-257).

### M-01 — Galerie en feu (AR-01 G)

- **Pièces :** une pièce d'entrée avec le récipient d'eau, une galerie en feu et un palier de sortie ; les deux portes intérieures sont fermées au départ (D-258, §8.2).
- **Créature :** une seule place déclarée, le palier de sortie ; jamais dans la galerie ni dans la pièce avec l'eau (D-258). Le parcours complet avec cette place reste à prouver en L4.
- **Sûr :** prendre l'eau, ouvrir, éteindre depuis le seuil (C-03 §5.3).
- **Risqué :** laisser la porte ouverte deux actions : le feu gagne la pièce voisine.

### M-02 — Grille haute et caisse (AR-01 A–P)

- **Pièces :** un atelier avec une caisse et une grille haute ; un conduit étroit vers une autre pièce.
- **Créature :** peut attendre dans l'atelier ; ne passe jamais le conduit (D-044).
- **Sûr :** déplacer la caisse, ouvrir, traverser.

### M-03 — Énergie (AR-01 P, final)

- **Pièces :** un local avec la console du circuit et le bloc de secours ; la salle d'embarquement et sa capsule (D-249).
- **Créature :** dans la réserve reliée au local, porte ouverte au départ (D-262).
- **Sûr :** isoler le bruit puis réactiver le circuit, ou porter le bloc par les passages normaux et l'installer.

### M-04 — Salle d'observation (AR-01 O)

- **Pièces :** une salle avec alcôve et avertisseur commandé depuis la pièce précédente ; un seuil où l'on peut verser de l'huile, l'huile étant posée dans la pièce précédente.
- **Créature :** sur la zone de passage.
- **Sûr :** test de l'avertisseur puis traversée hors de vue, ou seuil huilé.
- **Risqué :** traverser exposé, un D6 (C-04).

### M-05 — Panneau et passage caché (AR-01 P–E)

- **Pièces :** un panneau de service ouvrable à la main, avec derrière un passage étroit vers une pièce plus loin.
- **Créature :** jamais dans le passage ; elle peut attendre sur le chemin normal, que le passage étroit permet de contourner (D-256).
- **Sûr :** ouvrir le panneau, emprunter le raccourci.

### M-06 — Baie et vide (AR-02, final)

- **Pièces :** un couloir de sécurité en entrée (D-264) ; local de sécurité (combinaison, découpeuse) ; salle panoramique (baie, rustine) ; la créature garde l'embarquement, dont la capsule est déjà alimentée.
- **Créature :** à l'embarquement, devant la capsule.
- **Sûr :** vider l'embarquement ou attirer puis percer (P-V1/P-V2).
- **Risqué :** passer en force (P-V3).

### M-07 — Salle des machines (nouveau, D-163)

- **Pièces :** une salle des machines entre deux pièces, avec un interrupteur.
- **Créature :** dans la soute, ouverte sur la pièce d'entrée, jamais dans la salle des machines (D-261). Dans la salle des machines en marche, le passager n'entend rien venir (D-163, D-235).
- **Sûr :** faire dans la salle les gestes bruyants (ouvrir une porte grippée) : rien ne sort. Ou relancer les machines depuis l'interrupteur de la salle pour attirer la créature, puis repartir par l'autre porte (un seul interrupteur, D-173).
- **Risqué :** entrer sans savoir si elle est là.

### M-08 — Passerelle effondrée (nouveau, D-164/D-169)

- **Pièces :** une salle coupée par un vide ; la planche, encombrante, dans une pièce voisine ; un magasin de l'autre côté.
- **Créature :** de l'autre côté du vide, dans le magasin (D-264).
- **Sûr :** rapporter la planche, la poser, traverser, la retirer derrière soi.
- **Piège :** laisser la planche en place et attirer la créature dessus : elle tombe, la planche est perdue.

### M-09 — Zone sans gravité (nouveau, D-165/D-168)

- **Pièces :** une coursive sans gravité, interrupteur à chaque bout ; une cale au-delà.
- **Créature :** au-delà de la coursive, dans la cale (D-264).
- **Sûr :** traverser en deux actions pendant qu'elle est occupée ailleurs.
- **Idée :** couper la gravité quand elle s'y engage : elle met deux réactions de plus à traverser.

### M-10 — Chambre froide (nouveau, D-166/D-170)

- **Pièces :** une chambre froide à deux portes, un compresseur à l'intérieur ; un pupitre de fermeture dans la pièce voisine, hors de vue.
- **Créature :** dans une pièce voisine de la chambre.
- **Sûr :** déclencher le compresseur, ressortir, fermer depuis le pupitre quand elle est entrée.
- **Risqué :** se faire suivre à travers la chambre et refermer derrière soi ; au-delà de deux actions dedans, une blessure.

## 4. Mélanges

Familles en jeu : bruit (M-03 relais, M-04 avertisseur, M-07, M-10 compresseur), ralentissement (M-04 huile, M-09, M-10), neutralisation (M-06, M-08), air (M-06).

| Mélange | Règle acceptée (D-174, sauf mention) |
| --- | --- |
| Bruits entre eux | Aucune règle nouvelle : un son naît dans une pièce et suit les règles existantes (C-03 §4.2) ; un son né dans la salle des machines en marche n'en sort pas (D-163) |
| **MX-01** Ralentissements entre eux | Ils s'additionnent : le froid fait sauter une réaction sur deux ; les réactions perdues de l'huile et le temps de traversée sans gravité se comptent sur les réactions qui restent |
| Neutralisations entre elles | Aucune règle nouvelle : neutralisée, la créature l'est pour de bon (D-062, D-164) |
| **MX-02** Vide et feu | Le vide éteint un foyer qu'il atteint ; le feu ne gagne pas une pièce sans air |
| **MX-03** Vide et huile | Aucun effet l'un sur l'autre ; l'huile reste glissante |
| **MX-04** Huile sans gravité | Impossible de verser l'huile tant que la gravité est coupée |
| **MX-05** Huile dans la chambre froide | L'huile y reste glissante, sans effet de plus |
| Vide et bloc | Jamais dans la même station : M-03 et M-06 sont tous deux « finals » (D-159) |
| Vide et nouveaux morceaux | L'air s'en va comme ailleurs, par-dessus le vide de la passerelle aussi ; aucune règle de plus pour les machines, la gravité et le froid (D-246) |
| Feu et passerelle | Le feu gagne l'autre bord comme par une porte ouverte ; jamais une pièce sans air (D-247) |
| Morceaux qui ne jouent pas sur la même chose | Aucune règle nouvelle (D-248) |

Avec ces règles, toutes les paires des dix morceaux sont permises, sauf M-03 et M-06, qui ne se rencontrent jamais (D-172). Un futur morceau qui joue sur la même chose qu'un autre reste refusé avec lui tant que leur mélange n'a pas de règles (D-167, D-248).

### 4.1 Table exhaustive des paires (L0, #150)

Chaque paire non ordonnée figure une seule fois : 45 paires, dont 44 permises et une jamais ensemble. Les règles citées sont celles du tableau ci-dessus et du [journal des décisions](03-decisions.md). Cette table autorise une cohabitation, pas une station : chaque composition doit encore respecter les attaches, le nombre d'obstacles et le chemin sûr vérifié (C-08 §2 et §3). L2 la transcrira en données ; aucun code ne change en L0.

| Paire | Verdict | Règle qui la permet, ou motif du refus |
| --- | --- | --- |
| M-01 + M-02 | Permise | Objets et obstacles distincts, sans règle de plus (D-248) |
| M-01 + M-03 | Permise | Feu et énergie, sans règle de plus (D-248) |
| M-01 + M-04 | Permise | Feu et observation/huile/avertisseur, sans règle de plus (D-248) |
| M-01 + M-05 | Permise | Feu et passage caché, sans règle de plus (D-248) |
| M-01 + M-06 | Permise | MX-02 : le vide éteint le feu ; pas de feu dans une pièce sans air (D-174) |
| M-01 + M-07 | Permise | Feu et machines, sans règle de plus (D-248) |
| M-01 + M-08 | Permise | Le feu peut gagner l'autre bord de la passerelle ; pas de feu sans air (D-247) |
| M-01 + M-09 | Permise | Feu et gravité, sans règle de plus (D-248) |
| M-01 + M-10 | Permise | Feu et froid, sans règle de plus (D-248) |
| M-02 + M-03 | Permise | Grille/caisse et énergie, sans règle de plus (D-248) ; le bloc ne passe pas le conduit (D-043) |
| M-02 + M-04 | Permise | Grille/caisse et observation, sans règle de plus (D-248) |
| M-02 + M-05 | Permise | Grille/caisse et passage caché, sans règle de plus (D-248) |
| M-02 + M-06 | Permise | Grille/caisse et baie, sans règle de plus (D-248) |
| M-02 + M-07 | Permise | Grille/caisse et machines, sans règle de plus (D-248) |
| M-02 + M-08 | Permise | Grille/caisse et passerelle, sans règle de plus (D-248) |
| M-02 + M-09 | Permise | Grille/caisse et gravité, sans règle de plus (D-248) |
| M-02 + M-10 | Permise | Grille/caisse et froid, sans règle de plus (D-248) |
| M-03 + M-04 | Permise | Bruits entre eux : relais et avertisseur suivent les règles existantes (§4, D-174) |
| M-03 + M-05 | Permise | Énergie et passage caché, sans règle de plus (D-248) ; le bloc ne passe pas le passage étroit (D-043) |
| M-03 + M-06 | Jamais ensemble | Deux morceaux finals ; un seul final par station (D-159, D-172) |
| M-03 + M-07 | Permise | Bruits entre eux (§4, D-174) ; interrupteur autonome, indépendant de l'énergie (D-168) |
| M-03 + M-08 | Permise | Énergie et passerelle, sans règle de plus (D-248) ; planche et bloc encombrants, un seul porté à la fois (D-169) |
| M-03 + M-09 | Permise | Énergie et gravité, sans règle de plus (D-248) ; interrupteurs autonomes (D-168) |
| M-03 + M-10 | Permise | Bruits entre eux : relais et compresseur suivent les règles existantes (§4, D-174) |
| M-04 + M-05 | Permise | Observation et passage caché, sans règle de plus (D-248) |
| M-04 + M-06 | Permise | MX-03 : vide et huile sans effet l'un sur l'autre (D-174) |
| M-04 + M-07 | Permise | Bruits entre eux : avertisseur et machines suivent les règles existantes (§4, D-174) |
| M-04 + M-08 | Permise | Observation/huile et passerelle, sans règle de plus (D-248) |
| M-04 + M-09 | Permise | MX-01 : ralentissements additionnés ; MX-04 : huile impossible à verser sans gravité (D-174) |
| M-04 + M-10 | Permise | Bruits entre eux ; MX-01 : ralentissements additionnés ; MX-05 : huile toujours glissante dans le froid (D-174) |
| M-05 + M-06 | Permise | Passage caché et baie, sans règle de plus (D-248) |
| M-05 + M-07 | Permise | Passage caché et machines, sans règle de plus (D-248) |
| M-05 + M-08 | Permise | Passage caché et passerelle, sans règle de plus (D-248) |
| M-05 + M-09 | Permise | Passage caché et gravité, sans règle de plus (D-248) |
| M-05 + M-10 | Permise | Passage caché et froid, sans règle de plus (D-248) |
| M-06 + M-07 | Permise | L'air quitte aussi les machines ; aucune règle de plus (D-246) |
| M-06 + M-08 | Permise | L'air passe par-dessus le vide de la passerelle (D-246) ; neutralisations définitives, sans règle de plus (§4, D-174) |
| M-06 + M-09 | Permise | L'air quitte aussi la zone sans gravité ; aucune règle de plus (D-246) |
| M-06 + M-10 | Permise | L'air quitte aussi la chambre froide ; aucune règle de plus (D-246) |
| M-07 + M-08 | Permise | Machines et passerelle, sans règle de plus (D-248) |
| M-07 + M-09 | Permise | Machines et gravité, sans règle de plus (D-248) |
| M-07 + M-10 | Permise | Bruits entre eux : machines et compresseur suivent les règles existantes (§4, D-174) |
| M-08 + M-09 | Permise | Passerelle et gravité, sans règle de plus (D-248) |
| M-08 + M-10 | Permise | Passerelle et froid, sans règle de plus (D-248) |
| M-09 + M-10 | Permise | MX-01 : traversée sans gravité et ralentissement par le froid additionnés (D-174) |

Une paire absente ou refusée n'est pas autorisée par ressemblance avec une ligne existante. Pour un futur morceau qui touche la même chose qu'un autre, une règle acceptée est nécessaire (D-167, D-248). Une ligne permise n'autorise pas à fusionner deux obstacles dans la même pièce ni à ajouter une interaction absente des fiches.

## 5. Parcours à prouver

- Pour chaque morceau : un parcours sûr et, s'il existe, un parcours risqué, joués par le moteur dans une station minimale.
- Pour chaque règle MX acceptée : un cas où les deux morceaux se rencontrent.
- Pour chaque morceau : au moins une validation sur téléphone, dans une station assemblée (D-098).

## 6. Suite

Règles retranscrites dans C-02 §5, C-03 §5.5 et C-04 §3.2. Les textes viendront des agents, en zone verte (D-116). Prochaines issues : découpage des morceaux en données, assembleur et vérifieur de stations ; découpage de #106 accepté au §7 (D-245), règles d'assemblage D-246 à D-256.

À ne pas oublier (D-244) : dans #106, chaque objet nécessaire reste dans son morceau. Les objets placés hors de leur morceau, comme l'eau du feu posée dans une pièce quelconque atteinte avant le feu, viendront avec les annexes ; leur règle de placement reste à décider.

## 7. Découpage de #106

> **Statut :** ACCEPTÉ le 2026-10-14 (D-245) ; règles d'assemblage D-246 à D-256. Cadre : petites stations d'abord (D-242), objets dans leur morceau (D-244), créature tirée au pur hasard parmi les places déclarées par les morceaux (D-161, D-162), mesure de la part des stations où la créature peut être mise hors jeu avant le problème final (D-241).

### 7.1 Livraisons

| Livraison | Contenu | Sortie (preuves) | Zone | Téléphone |
| --- | --- | --- | --- | --- |
| L0 ([#150](https://github.com/greffeb/void-walker/issues/150)) — Cadrage | Table documentaire des 45 paires de morceaux (§4.1), chacune avec la règle qui la permet (§4, D-246 à D-248), refus par défaut pour un futur morceau qui joue sur la même chose qu'un autre (D-167, D-248) ; vestibule, place de la créature de M-01, apports des deux branches et tirage public acceptés (§8, D-257 à D-260) | Documents relus par un autre agent ; réponses Q-182 à Q-185 consignées ; aucun code modifié | Verte | Non |
| L1 ([#151](https://github.com/greffeb/void-walker/issues/151)) — Vérifieur seul | Recherche en largeur sur les vraies règles, par les commandes publiques (GP-05), sans dé ni blessure ; au-delà d'un plafond d'états, la station est « non prouvée » et jamais proposée ; le chemin trouvé est rejoué comme un parcours témoin ; un second mode, qui suit aussi les dés, mesure ce que coûterait le signal « plus aucune sortie » | AR-01, AR-02 et m-07 à m-10 acceptés ; copies cassées exprès rejetées avec diagnostic (G-01) : m-08 sans la planche, AR-01 sans l'eau ni la caisse (sans l'eau seule, AR-01 reste faisable par la grille de maintenance) ; tableau des états et des temps ; méthode du signal choisie par écrit | Verte (outil) | Non |
| L2 ([#152](https://github.com/greffeb/void-walker/issues/152)) — Première station tirée | Format du morceau (famille, attaches, places de la créature, ce qu'il demande et fournit, tuile de plan) avec une empreinte par morceau ; textes rangés par couches (§7.2) ; pièce de départ ; assemblage départ, un morceau de chemin, final avec son embarquement (D-249), portes entre morceaux fermées (D-252), sur une première composition : M-03 en final, M-07 ou M-10 en chemin (bruits entre eux, §4 ; D-250 pour le chemin sûr de M-10) ; paires lues dans la table de L0, toute paire refusée ou absente écartée avant le plan (D-167) ; plan du chemin principal (GE-01 à GE-07) ; compositions vérifiées par L1 à la construction, et non au tirage ; NOUVELLE PARTIE tire au hasard une station parmi elles (D-253, D-255), REJOUER garde la même, un paramètre de test en force une ; m-07 et m-10 refaits à partir des morceaux | G-02 : avec une copie de la table où la paire tirée est retirée exprès, la composition forcée par le paramètre de test est refusée avec son motif ; G-05 ; même graine, même plan ; parcours de m-07 et m-10 inchangés ; tableau des compositions (verdict, états, temps) ; galerie de plans ; captures ; version de test | Orange | Oui : une partie menée au bout par morceau inclus |
| L3 ([#153](https://github.com/greffeb/void-walker/issues/153)) — Baie, passerelle, sans gravité | M-06 en final, M-08 et M-09 en chemin ; vide et nouveaux morceaux (D-246) ; deux morceaux de chemin ; MX-01 et la planche avec le bloc (D-169) rencontrés en station assemblée | Temps de vérification d'une station à trois obstacles (premier risque) ; résultats gardés par empreinte ; statistiques de tirage | Orange | Oui : M-06, M-08, M-09 |
| L4 ([#154](https://github.com/greffeb/void-walker/issues/154)) — Chemins d'AR-01 | M-01, M-02, M-04 (avec sa pièce d'avant : huile et commande de l'avertisseur) et M-05 ; MX-02 à MX-05 et le feu sur la passerelle (D-247) rencontrés en station assemblée | Chaque morceau dans au moins une station vérifiée ; un parcours sûr et, s'il existe, un risqué par morceau | Orange | Oui : les quatre |
| L5 ([#155](https://github.com/greffeb/void-walker/issues/155)) — Ordre libre et mesures | Deux obstacles qui partent d'un même couloir, chacun donnant accès à sa commande de déverrouillage avant le final (D-254, D-259, §8.3) ; 1 000 tirages | Deux ordres de préparation sûrs prouvés ; aucune évacuation possible en omettant l'une des commandes, même avec des dés favorables ; aucune station non vérifiée proposée ; fréquence par morceau, par final et par place de la créature ; rejets classés par motif ; part des stations où la créature peut être mise hors jeu avant le final (D-241) ; une station rejetée avec son diagnostic | Orange | Oui : une station en ordre libre |
| L6 ([#156](https://github.com/greffeb/void-walker/issues/156)) — « Plus aucune sortie » | Calcul après chaque action, selon la méthode choisie en L1 ; une sortie au dé reste une sortie (D-251) ; message, rappel discret (D-144) et textes | G-03, G-04, G-06 ; signal comparé dans les deux sens à la recherche complète sur tous les états atteints : un seul signal faux bloque la livraison ; temps par action mesuré sur téléphone | Orange (moteur) | Oui : une sortie perdue exprès |

**Ordre :** #105 est clos ; L0 et L1 peuvent commencer tout de suite ; L2 attend la table des paires (L0) et le vérifieur (L1) ; puis L3, L4, L5 et L6. L6 touche au moteur, et L2 aussi si l'identifiant de station ne tient pas dans le champ « monde » de la sauvegarde (changer le format de sauvegarde est en zone rouge, C-10 §6). Une livraison qui touche au moteur ne se mène pas en même temps qu'une autre issue moteur ; le travail du lore n'en fait partie que si sa conception demande au moteur plus que « regarder » (D-243, limite).

**Hors #106 :** objets placés hors de leur morceau (D-244) ; annexes, boucles et grandes stations (D-242 ; issue à part si la durée le demande, D-245) ; salles de butin, c'est-à-dire des annexes facultatives où trouver des objets en plus de ceux que demandent les obstacles (piste proposée le 2026-10-14, sans décision) ; documents du lore (D-243) ; créature placée plus souvent près du final, en réserve (D-241) ; écrans de fin de défaite et d'évacuation ; retrait automatique d'une validation quand un morceau change (D-100).

### 7.2 Textes par couches

Pour #106 et pour la suite, les textes d'une station se composeraient de couches, réunies en un seul jeu de textes :

- un socle neutre : refus, libellés, verbes, savoir, aperçus ;
- l'univers : réveil, départ, pièces communes, messages d'IA Station, documents du lore ;
- la menace : la trentaine de clés qui décrivent la créature, ses bruits et ses coups ;
- les morceaux : noms, descriptions et messages d'arrivée propres à chacun.

Un contrôle vérifierait que les mots propres à la menace et à l'univers ne se glissent ni dans le socle ni dans les morceaux. Rien ne se choisit au tirage tant qu'il n'existe qu'un univers et qu'une menace : ce rangement prépare seulement d'autres univers et d'autres menaces, pistes de l'après-lancement ([roadmap](02-roadmap.md)). Un jeu de textes ne change que les phrases : une autre menace demandera ses propres règles dans le moteur.

Les messages d'IA Station et les descriptions de pièces qui nomment une pièce voisine deviennent des gabarits à trous ou sont réécrits ; tels quels, ils seraient faux dans une station assemblée. Exemples : « au-delà de la salle des machines » dans le message de la capsule de m-07 (de même dans m-08 et m-09) ; « Au bout, la salle d'embarquement » dans la coursive de m-07 et « mène à l'embarquement » dans celle de m-10 ; la signalétique de la coursive de départ d'AR-02, « au-delà de la salle panoramique ». La salle panoramique d'AR-02 peut garder sa porte vers l'embarquement : les deux pièces appartiennent à M-06.

### 7.3 Risques et écarts relevés

**Vérifieur L1 (#151), proposé.** `npm run check:stations` cherche en largeur par `observer` et `jouer`, sans utiliser les parcours écrits comme raccourci. Un dé, même favorable, ou une blessure exclut la transition ; le premier contact et son action libre restent permis. Le premier chemin trouvé est converti en `Parcours`, puis `executerParcours` contrôle le menu public, l'évacuation indemne sans dé et le rejeu de l'export. Le rapport JSON contient le témoin, les états, le temps et le diagnostic. La commande est une étape obligatoire de `npm run verify`.

Les étapes générées gardent les identifiants **publics** de cible et de paramètre en plus des noms : deux portes homonymes sans destination connue restent distinguables. Ces champs sont facultatifs, les parcours écrits existants ne changent pas. Limite héritée du contrôle de témoin : il attend au moins une option « aller » indisponible au départ, pour tester le refus sans effet. Les six références et le vestibule fermé prévu en L2 satisfont cette condition ; un monde entièrement ouvert au départ n'est pas couvert par ce contrôle actuel.

La clé conserve toutes les données de règles, dont découvertes, répit, passage gardé, ressources et dangers. Seuls compteur d'actions, générateur, mémoire de carte, repères de perception de la créature, messages reçus et pièces visitées sont ignorés : leurs lectures ne changent que les récits, la carte et les avertissements, pas les commandes disponibles ni les effets physiques. Le journal n'est pas conservé dans chaque nœud ; les parents du chemin sont gardés et les états développés libérés. Le plafond par défaut est de 150 000 états ; atteint, il donne **non prouvée**, jamais « sans sortie sûre ». Le plafond se règle avec `--max-etats=200000` ; un verdict autre que prouvé donne un code de sortie non nul.

Mesure locale indicative, hors démarrage de la commande, contrôle du témoin compris ; les durées ne sont pas des assertions de test :

| Station / copie | Verdict sûr | États | Temps | Actions du témoin |
| --- | --- | ---: | ---: | ---: |
| AR-01 | Prouvée | 101 335 | 3,43 s | 11 |
| AR-02 | Prouvée | 2 155 | 0,10 s | 13 |
| m-07 | Prouvée | 503 | 0,02 s | 9 |
| m-08 | Prouvée | 694 | 0,03 s | 13 |
| m-09 | Prouvée | 7 386 | 0,21 s | 11 |
| m-10 | Prouvée | 804 | 0,03 s | 9 |
| m-08 sans planche | Sans sortie sûre, graphe épuisé | 48 | 0,009 s | — |
| AR-01 sans eau (bidon) ni caisse | Sans sortie sûre, graphe épuisé | 405 | 0,035 s | — |
| AR-01 sans eau seule | Prouvée, maintenance | 57 160 | 2,23 s | 11 |

**Mesure avec les dés.** `npm run check:stations -- --mesurer --max-etats=200000` explore aussi blessure et défaite, jusqu'à épuisement ou au plafond, sans s'arrêter à la première évacuation. Toutes les faces sont énumérées, y compris plusieurs tirages successifs ou conditionnels : ni graine choisie ni seul jet favorable. L'accès facultatif aux dés dans le moteur a été explicitement autorisé par le porteur pour cet outil, sans changement de règle ; **fusion soumise à son accord**. Les journaux de mesure à faces imposées ne sont pas des exports de parties ordinaires ; les témoins sûrs utilisent l'accès normal, sans aucun tirage.

| Station | Graphe | États | Transitions examinées | Temps |
| --- | --- | ---: | ---: | ---: |
| AR-01 | Incomplet, plafond | 200 000 | 667 758 | 7,55 s |
| AR-02 | Incomplet, plafond | 200 000 | 919 331 | 10,55 s |
| m-07 | Complet | 10 662 | 47 644 | 0,54 s |
| m-08 | Complet | 162 192 | 673 336 | 8,70 s |
| m-09 | Incomplet, plafond | 200 000 | 908 385 | 9,82 s |
| m-10 | Incomplet, plafond | 200 000 | 737 068 | 9,08 s |

**Méthode retenue pour L6 : calcul de viabilité par morceau, composé avec les connexions et les états partagés**, pas une recherche complète après chaque action sur téléphone. Ce n'est pas un simple booléen indépendant par morceau : santé, objets portés, créature, bruit, air, feu et passages entre morceaux doivent rester pris en compte. Même sur ce PC, un graphe achevé coûte 8,70 s pour m-08 ; quatre autres dépassent 200 000 états. Les mesures plafonnées sont des bornes basses, pas des graphes complets ni des preuves d'absence de sortie. En L6, le calcul composé devra être comparé dans les deux sens à l'oracle exhaustif sur tous les états concernés (G-03, G-04, G-06), en conservant une sortie au dé comme sortie. Un oracle plafonné ne valide pas cette comparaison : il faudra achever le graphe hors téléphone ou réduire le modèle avec une équivalence démontrée. Le temps par action sera alors mesuré sur téléphone ; aucune performance mobile n'est revendiquée en L1.

Une station à trois obstacles peut coûter bien plus : plafond d'états, vérification à la construction plutôt qu'au tirage, résultats gardés par empreinte en L2/L3. Les grandes stations restent hors du vérifieur exhaustif de L1.

**Ordre de recherche, L3 (#153, D-264).** En largeur, les stations à trois obstacles atteignent presque toutes le plafond de 150 000 états (maquette jetable, 11 sur 12 mesurées), de même que la baie avec la créature devant la capsule derrière M-08, M-09 ou M-10. Le vérifieur développe donc d'abord les états où le passager est dans le morceau le plus avancé de la station, puis, à égalité, dans l'ordre d'arrivée. Le graphe, la clé d'état, les transitions écartées, le plafond et le rejeu du témoin ne changent pas : une recherche épuisée donne le même verdict « sans sortie sûre » qu'en largeur. Le chemin témoin n'est plus forcément le plus court. Un monde écrit en entier, dont les pièces ne sont pas rattachées à un morceau, garde la largeur et ses résultats ci-dessus. Les résultats gardés par empreinte et la vérification dans un job de CI à part n'ont pas été nécessaires (§7.6) ; un verdict gardé deviendrait faux après un changement de règle, l'empreinte d'un morceau ne couvrant pas le moteur.

**Écarts dans les documents :**

1. C-08 G-02 refusait le vide avec le feu, alors que MX-02 (D-174) les réunit et que le moteur le teste : G-02 est réécrit selon D-167.
2. C-02 §5 citait encore « vide et feu » parmi les mélanges sans règle : l'exemple est corrigé, en distinguant la dépressurisation de la baie et le vide de la passerelle.
3. 14 §5.6 demandait à #106 des stations de 10 à 60 pièces : ramené aux petites stations (D-242), avec les mêmes seuils.
4. Passerelle et dépressurisation : le §4 dit « neutralisations entre elles : aucune règle nouvelle », C-02 §5 les dit refusées (détail de l'agent de #105), et le moteur laisse déjà passer l'air et le feu par-dessus le vide de la passerelle, sans décision. Le mot « vide » désigne aussi deux choses : la dépressurisation de M-06 et le gouffre de M-08. Réglé par D-246 (l'air) et D-247 (le feu).
5. Gravité et dépressurisation : « à décider » selon D-165, absent du tableau du §4. Réglé par D-246.
6. Paires sans famille commune (feu et froid, feu et machines, caisse et énergie…) : le §4 ne dit pas si ce sont des mélanges, et D-167 ne vise que les morceaux qui jouent sur la même chose. Refusées par défaut, elles écarteraient M-02 et M-05 de toute station, aucun des deux finals ne partageant de famille avec eux, alors qu'AR-01 (D-057) les réunit déjà avec M-03. Réglé par D-248.
7. Embarquement : le §2 le place après le final, mais la créature de M-06 garde l'embarquement. Réglé par D-249 : le morceau final apporte l'embarquement.
8. M-01 et M-05 disent seulement où la créature n'est jamais ; D-161 demande ses places possibles. Réglé pour M-05 par D-256 ; pour M-01, D-258 retient le seul palier de sortie (§8.2), à prouver en L4.
9. Seul, le panneau caché de M-05 ne bloque rien. Réglé par D-256 : la créature peut attendre sur le chemin normal, et le passage étroit, où elle ne passe pas, permet de la contourner.
10. Le chemin sûr de la chambre froide passe une fois sous les yeux de la créature, grâce à l'action libre qui suit le premier contact (D-184). Réglé par D-250 : il compte comme sûr.
11. L'ordre libre (D-160) n'avait pas de forme décrite. Réglé par D-254 ; les deux apports indispensables sont fixés par D-259 (§8.3), à implémenter et prouver en L5.
12. D-162 dit que les stations se tirent au pur hasard et qu'une station déjà jouée peut revenir ; il ne dit pas si chaque station possible a la même chance. D-241 compte une créature placée plus souvent près du problème final comme une modification de D-162 ; un pile ou face sur le problème final en serait une aussi. Réglé par D-253, qui modifie D-162 : pile ou face du final, puis pur hasard parmi les stations qui ont ce final.
13. Les textes qui nomment une pièce voisine seraient faux dans une station assemblée : §7.2.

### 7.4 Questions posées au porteur

Posées le 2026-10-14, en langage courant, chacune avec la réponse recommandée ; réponse du porteur : « Ok pour tes reco ». Chaque recommandation est retenue : Q-170 à Q-181, D-245 à D-256, dans l'ordre de la liste.

1. Pour assembler les stations, on avancerait par étapes : d'abord régler sur le papier les points encore ouverts et construire l'outil qui prouve qu'une station a bien une sortie, sans rien changer au jeu ; puis une première station tirée au hasard, à essayer sur téléphone ; puis les autres morceaux, par groupes, chacun essayé sur téléphone ; ensuite les obstacles à régler dans l'ordre qu'on veut et les mesures sur mille tirages ; enfin l'annonce « plus aucune sortie ». Si la durée des parties demande un jour de grandes stations, elles se feraient dans une tâche à part, avec les règles qui vont avec (pièces rangées par catégorie, sanitaires près des couchages, couloirs qui desservent plusieurs pièces, portes en boucle). Cette façon d'avancer vous convient-elle ? *Recommandé :* oui.
2. Quand la baie est percée et que l'air s'échappe, que devient l'air dans les pièces des quatre nouveaux morceaux ? *Recommandé :* il s'en va comme partout ailleurs, sans règle de plus : il passe par-dessus le trou de la passerelle, puisque ses deux bords forment une seule salle, et il quitte aussi la salle des machines, la zone sans gravité et la chambre froide. Autre choix : au lancement, la baie n'est jamais tirée avec un nouveau morceau.
3. Un incendie d'un côté de la passerelle effondrée peut-il gagner l'autre bord ? *Recommandé :* oui, comme par une porte restée ouverte, puisque c'est une seule salle ; le feu ne gagne toujours pas une pièce sans air. Autre choix : au lancement, la galerie en feu et la passerelle ne sont jamais tirées ensemble.
4. Deux obstacles qui ne jouent pas sur la même chose, par exemple la galerie en feu et la chambre froide, ou la caisse sous la grille et le local d'énergie, peuvent-ils se retrouver dans la même station sans règle de plus ? *Recommandé :* oui, comme dans la première aventure, qui réunit déjà le feu, la caisse, la salle d'observation, le panneau caché et l'énergie ; seuls les obstacles qui touchent la même chose (bruit, ralentissement, créature mise hors jeu, air) attendent leurs règles de mélange.
5. Le problème final et l'embarquement avec sa capsule vont-ils toujours ensemble, dans le même morceau de station ? *Recommandé :* oui ; c'est déjà le cas de la baie, où la créature attend devant la capsule.
6. Un chemin sans dé ni blessure qui passe une fois sous les yeux de la créature, grâce à l'action libre qui suit la première rencontre, compte-t-il comme sûr ? *Recommandé :* oui ; la règle promet seulement un chemin sans dé ni blessure, et le chemin sûr de la chambre froide en dépend.
7. Quand la seule sortie restante demande un coup de dés, le jeu doit-il dire « plus aucune sortie » ? *Recommandé :* non, une sortie risquée reste une sortie.
8. Au départ, les portes entre deux morceaux sont-elles fermées ? La créature n'en ouvre jamais : elle reste dans sa partie tant que le passager n'ouvre pas. *Recommandé :* fermées, comme les cloisons de la première aventure ; on mesure ensuite.
9. Au tirage, chaque station possible a-t-elle la même chance, ou tire-t-on d'abord à pile ou face le problème final, énergie ou baie ? *Recommandé :* pile ou face d'abord, sinon un final qui accepte moins de voisins sortirait rarement.
10. Il est déjà décidé que certains obstacles se préparent dans l'ordre que le joueur veut. Concrètement, cela peut-il prendre cette forme : deux obstacles qui partent d'un même couloir, à régler tous les deux, dans n'importe quel ordre, avant le problème final ? *Recommandé :* oui, comme l'énergie et l'accès de la première aventure.
11. Dans la version de test, NOUVELLE PARTIE tire-t-elle une station au hasard, les aventures de référence restant jouables par un lien ? *Recommandé :* oui.
12. Le panneau caché ne bloque rien à lui seul. *Recommandé :* la créature peut attendre sur le chemin normal, et le passage étroit derrière le panneau, où elle ne passe jamais, permet de la contourner. Les endroits où elle peut attendre autour de la galerie en feu seront proposés de la même façon, avant la première station qui l'utilise.

### 7.5 Première station tirée L2 (#152)

> **Statut :** fusionné ([PR #160](https://github.com/greffeb/void-walker/pull/160)) après deux parties du porteur sur téléphone, menées au bout et signées (M-07 et M-03, [journal](journal-parties-humaines.md)) ; M-10 n'a pas encore été joué sur téléphone. Conception : [spec L2](superpowers/specs/2026-10-15-premiere-station-tiree-design.md). Depuis L3, la vérification suit l'ordre de recherche du §7.3 : les états et les temps ci-dessous sont ceux de la largeur, les témoins gardent leur longueur.

NOUVELLE PARTIE tire une station parmi quatre compositions publiées : vestibule, M-07 ou M-10 en chemin, M-03 en final. Le porteur a retenu la soute seule pour la créature de M-07 (Q-186, D-261) et une seule pièce voisine pour celle de M-03 (Q-187, D-262) ; la porte de cette pièce, ouverte au départ, vient de la conception qu'il a approuvée (D-262). Choix des agents : cette pièce s'appelle la réserve, pour ne pas la confondre avec la cabine de la capsule ; les pièces de même nom, numérotées (D-208), portent une lettre (coursive A, coursive B) ; une station s'identifie par `<composition>-<graine>`, par exemple `m07-m03-soute-2718281828`.

`npm run check:stations` prouve chaque composition publiée à la construction, jamais au tirage, à la plus petite graine de plan qui donne une station : 0 pour les quatre. Une composition publiée non prouvée, ou prouvée non publiée, fait échouer la commande.

Mesure locale indicative, contrôle du témoin compris ; les durées ne sont pas des assertions de test :

| Composition | Verdict sûr | États | Temps | Actions du témoin |
| --- | --- | ---: | ---: | ---: |
| m07-m03-reserve | Prouvée | 19 195 | 0,90 s | 16 |
| m07-m03-soute | Prouvée | 14 380 | 0,53 s | 15 |
| m10-m03-entrepot | Prouvée | 15 333 | 0,62 s | 14 |
| m10-m03-reserve | Prouvée | 9 502 | 0,47 s | 16 |

Empreinte de chaque morceau, hachage de sa définition et de ses textes (D-100) :

| Morceau | Empreinte |
| --- | --- |
| Vestibule | `1f99a2ef408c3e` |
| M-07 | `1333e4663e79cd` |
| M-10 | `1cf828ac42caea` |
| M-03 | `16cbe101d56cd2` |

**Plans**, sur 1 000 graines par chemin, échecs compris : 1 000 plans sur 1 000 pour chacun des deux chemins, 0,34 ms en moyenne et 2,33 ms au plus avec M-07, 0,33 et 1,69 ms avec M-10 ; le tirage complet du catalogue réussit 1 000 fois sur 1 000, en 0,37 ms en moyenne et 2,96 ms au plus. Seul le taux d'au moins 95 % est asserté (14 §5.6).

**Questions posées au porteur le 2026-10-15**, pendant la conception :

**Q-186, D-261.** « Dans le morceau « salle des machines », où la créature peut-elle attendre au début ? » Précision donnée : « La fiche dit « dans la salle des machines ». Mais cette salle est le seul passage vers la suite : si la créature y est, il n'existe aucune façon de passer sans risque, et la vérification rejette la station. Si elle attend dans la soute à côté des quartiers (comme dans la station de test actuelle), un passage sûr existe (15 actions). » Choix proposés : « Dans la soute seulement, comme la station de test » (recommandé) ou « Soute ou salle des machines ; les cas sans passage sûr sont écartés avant d'être proposés ».

**Réponse du porteur :** « Dans la soute seulement, comme la station de test ».

**Q-187, D-262.** « Dans le morceau final « énergie », dans quelle pièce voisine la créature attend-elle ? » Précision donnée : « La fiche dit « dans une pièce voisine reliée au local », sans dire laquelle. Proposition : le morceau apporte une petite réserve à côté du local, porte ouverte au départ. Remettre la console en marche fait un bruit qui l'attire, sauf si l'on a d'abord fermé cette porte ; porter le bloc d'énergie jusqu'à la capsule ne fait pas de bruit. Passage sûr vérifié avec les deux morceaux de chemin (16 actions). » Choix proposé : « Une réserve, porte ouverte au départ (proposition) », réponse libre permise.

**Réponse du porteur :** « réserve ou cabine ». À la question de précision « Par « réserve ou cabine », voulez-vous dire que la créature peut attendre dans l'une ou l'autre, tirée au hasard ? », il a répondu : « Une seule pièce voisine ; « réserve » ou « cabine », c'est juste son nom ».

**Approbation.** « Le document de conception vous convient-il pour passer au plan de travail ? », avec la liste des choix des agents.

**Réponse du porteur :** « Oui, on passe au plan ». La conception approuvée ([spec L2 §3.5](superpowers/specs/2026-10-15-premiere-station-tiree-design.md#35-m-03--énergie-final)) prévoit la porte de la réserve ouverte au départ (D-262).

### 7.6 Baie, passerelle, sans gravité L3 (#153)

> **Statut :** proposé par la PR de #153 (zone orange), en attente de l'accord du porteur et de parties au bout sur téléphone pour M-06, M-08 et M-09 (**validation humaine requise**, D-098). Conception : [spec L3](superpowers/specs/2026-10-15-baie-passerelle-gravite-design.md), approuvée (D-264) ; réussite fixée par D-263.

NOUVELLE PARTIE tire maintenant parmi **88 compositions** :
- le vestibule ;
- un ou deux morceaux de chemin distincts parmi M-07, M-08, M-09, M-10, dans un ordre donné ;
- le final M-03 ou M-06 ;
- une place de créature parmi celles de ces morceaux.

Il y a 16 compositions à un chemin et 72 à deux. Le tirage fait pile ou face entre les deux finals (D-253, D-260), puis prend une composition au hasard parmi celles de ce final.

Places de la créature :

| Morceau | Place |
| --- | --- |
| M-06 | embarquement |
| M-08 | magasin |
| M-09 | cale |

Choix des agents, approuvés avec la conception (D-264) :
- le magasin et la cale sont renommés pour ne pas se confondre avec la réserve de M-03 et la soute de M-07 ;
- la baie entre par un couloir de sécurité ;
- la passerelle n'a pas de touret, la zone sans gravité pas de burette : ils ne servaient qu'aux stations de test, qui restent écrites en entier ;
- deux pièces de même nom affiché reçoivent une lettre (« quartiers de l'équipage A ») ;
- une clé de texte que deux morceaux d'une station définissent différemment devient propre à chacun.

Les quatre compositions de L2 donnent exactement les mêmes stations, avec la même empreinte du monde, et M-03, M-07, M-10 gardent leurs empreintes.

**Catalogue.** `npm run check:stations` donne une mesure locale indicative, contrôle du témoin compris. Les durées ne sont pas des assertions. Toutes les compositions sont prouvées, à la graine de plan 0.

| Final, chemins | Compositions | États | Actions du témoin | Temps |
| --- | ---: | ---: | ---: | ---: |
| M-03, un | 8 | 326 à 894 | 14 à 19 | 0,40 s en tout |
| M-03, deux | 36 | 445 à 1 040 | 19 à 26 | 2,12 s en tout |
| M-06, un | 8 | 449 à 4 258 | 15 à 24 | 1,70 s en tout |
| M-06, deux | 36 | 568 à 4 404 | 20 à 31 | 7,32 s en tout |

La plus lourde est `m09-m08-m06-embarquement` : 4 404 états, 31 actions, 0,49 s. En largeur, la maquette atteignait le plafond de 150 000 états pour 11 des 12 stations à deux chemins mesurées (§7.3).

**Empreintes** (D-100) :

| Morceau | Empreinte |
| --- | --- |
| M-06 | `1061c0d536f6e0` |
| M-08 | `00e5bdf7553d64` |
| M-09 | `19380e3643cd8f` |

Le vestibule, M-03, M-07 et M-10 gardent celles du §7.5.

**Plans.** Sur 1 000 graines pour chacune des 32 chaînes de morceaux, échecs compris :
- 1 000 plans sur 1 000 pour chaque chaîne ;
- au plus 2,74 ms en moyenne par chaîne, 7,29 ms pour le pire tirage.

**Tirages.** Sur 1 000 tirages complets du catalogue, à graine fixe :

| Mesure | Résultat |
| --- | --- |
| Finals | M-03 521, M-06 479 |
| Nombre de chemins | un 189, deux 811 |
| Morceaux | M-07 481, M-08 441, M-09 446, M-10 443 |
| Places de la créature | soute 178, magasin 148, cale 157, entrepôt 156, réserve 189, embarquement 172 |
| Temps de tirage | 1,08 ms en moyenne, 8,32 ms au plus |

Avec la baie, la créature attend devant la capsule une fois sur deux ou sur trois. Ailleurs, la baie peut servir à lui ôter l'air. C'est une question de difficulté, laissée pour plus tard (D-263).

**Mélanges joués en station assemblée** (§4) :

| Mélange | Station | Résultat |
| --- | --- | --- |
| Planche et bloc (D-169) | `m08-m03-magasin`, depuis le départ, sans dé | Planche en main, le bloc est refusé sans coût ; planche posée, il se prend |
| MX-01 | `m10-m09-m03-entrepot`, depuis un état préparé : créature ralentie au bord de la zone | Sept actions pour traverser, comme le test du moteur |
| Vide (D-246) | Recherches sans dé ni blessure depuis le départ | Voir ci-dessous |

Pour le vide :
- `m07-m09-m06-embarquement` : l'air quitte la salle des machines et la coursive de transfert ;
- `m10-m08-m06-embarquement` : il quitte les deux bords de la passerelle et la chambre froide ;
- `m07-m09-m06-soute` : la créature est rendue inerte hors de la salle panoramique.

Limite : le cas d'une créature derrière une porte fermée, qu'il faut ouvrir sous ses yeux, atteint le plafond de la recherche (magasin, cale, et aussi entrepôt). Il n'est pas couvert par un test.

**Contrôle des textes.** `check:texts` explore six stations fixes, qui couvrent :
- chaque morceau ;
- chaque place de la créature ;
- chaque chemin en première et en seconde position ;
- les trois mélanges.

Ce sont `m07-m03-soute`, `m07-m08-m06-embarquement`, `m08-m07-m03-magasin`, `m09-m10-m06-cale`, `m10-m03-reserve` et `m10-m09-m03-entrepot`. Chacune est parcourue avec son témoin, ce qui fait rendre l'évacuation. Le contrôle prend environ deux minutes seul, trois dans `npm run verify`, contre 87 s en L2.

**Questions posées au porteur le 2026-10-15**, citées mot pour mot :

| Question | Réponse du porteur |
| --- | --- |
| **Q-188, D-263.** « Dans vos deux parties de L2, il vous a suffi de claquer la porte au nez de la créature. Quand vous lancerez une station avec la baie, la passerelle ou la zone sans gravité, qu'est-ce qui vous fera dire « cette livraison est réussie » ? » | « pouvoir arriver a la capsule. (la difficulté on verra plus tard) » |
| **Q-189.** « Je peux mesurer ces deux points tout de suite sur une maquette jetable, sans rien changer au jeu, avant de vous poser d'autres questions. J'y vais ? » Les deux points : places de la créature des fiches et coût de la vérification à trois obstacles. | « go » |
| **Q-190.** « Avant que je l'écrive, voyez-vous quelque chose à corriger ou à ajouter ? » Question posée après le résultat de la maquette et la liste des choix par défaut. | « go » |
| **Q-191, D-264.** « La conception vous convient-elle pour passer au plan de travail ? », avec la liste des choix des agents. | « c'est bon » |
| **Q-192.** « Le plan vous convient-il, et laquelle de ces deux façons préférez-vous ? » Les deux façons : par tâches confiées ou par l'agent seul. | « ok et par taches confinés. a la fin, fait la PR en autonomie et push » |

## 8. Cadrage L0 (#150) accepté par le porteur

> **Statut :** CONCEPTION ACCEPTÉE le 2026-10-14. Après relecture indépendante des propositions, les quatre recommandations ci-dessous ont été soumises au porteur avec leurs détails puis retenues explicitement : Q-182 à Q-185, D-257 à D-260. Elles précisent les fiches et C-08 ; aucun code ne change dans L0. Les preuves moteur et les parties sur téléphone restent à produire dans les livraisons indiquées.

### 8.1 Pièce de départ — Q-182, D-257

**Choix retenu :** un vestibule de réveil, identique dans son rôle pour toutes les stations.

- Une pièce sur le chemin principal, sans danger, sans créature, sans objet nécessaire à un obstacle et sans consommable bonus ; les objets restent dans leur morceau (D-244).
- Une porte ordinaire vers le premier morceau, fermée au départ, manœuvrable à la main ; pas de porte grippée à cet endroit. En ordre libre, elle donne sur le couloir commun qui dessert les deux branches, pas directement sur l'une d'elles.
- Avant la première ouverture de la porte, aucun contact ni danger ne peut atteindre le passager dans ce vestibule. Après cette ouverture, les règles ordinaires s'appliquent aussi à la pièce de départ : aucune protection permanente contre un danger qui y serait entré. Lire, consulter les menus et regarder restent gratuits ; ouvrir puis franchir la porte restent deux actions ordinaires, sans exemption nouvelle aux réactions du monde.
- La description montre la porte et son état, sans nommer une destination encore inconnue ni promettre que toute la station est sûre. Aucun document du lore n'est ajouté par L0 (D-243).
- Parcours à prouver en L2 : état initial sans danger immédiat (GP-04), consultations sans changement du monde, ouverture et sortie possibles ; le chemin sûr de la station complète reste à vérifier pour chaque composition et chaque place de créature.

**Question :** « Au réveil, je recommande un petit vestibule sans danger ni objet, avec une porte fermée vers la suite, que vous ouvrez à la main quand vous êtes prêt. Cela vous convient-il ? »

**Réponse du porteur :** « Oui, ce vestibule ».

### 8.2 Créature autour de M-01 — Q-183, D-258

**Choix retenu :** une seule place déclarée pour commencer, sur un palier de sortie après la galerie, derrière une porte fermée.

- M-01 apporte trois pièces sur le chemin principal : pièce d'entrée avec l'eau, galerie en feu, palier de sortie. Le palier n'est pas une annexe et n'appartient pas au morceau voisin.
- Ses deux portes intérieures sont fermées au départ. La place de la créature est le palier seulement : jamais la galerie, jamais la pièce avec l'eau, jamais le vestibule de départ. Le feu ne gagne pas le palier à travers une porte fermée.
- Le passager peut ainsi prendre l'eau et éteindre le foyer depuis le seuil sans avoir d'abord à prendre l'eau sous les yeux de la créature. Ensuite, le premier contact et les moyens de la station s'appliquent normalement ; aucune immunité n'est ajoutée.
- La place entre dans le même tirage que celles des autres morceaux (D-161, D-241), sans poids particulier. D'autres places demanderaient une proposition distincte, pas un élargissement implicite en L4.
- Parcours à prouver en L4 : eau atteignable avant le feu ; foyer éteint sans dé ni blessure ; évacuation complète sans dé ni blessure avec la créature sur le palier. Si ce dernier point échoue, la composition est rejetée, pas déclarée sûre sur la seule extinction du foyer.

**Question :** « Près de la galerie en feu, je recommande que la créature puisse attendre seulement sur un petit palier après les flammes, derrière une porte fermée, jamais près de l'eau. Cela vous convient-il ? »

**Réponse du porteur :** « Oui, le palier après la galerie ».

### 8.3 Deux branches toutes deux utiles — Q-184, D-259

**Constat :** deux chemins qui rejoignent la même pièce offrent un choix d'itinéraire ; ils ne rendent pas les deux branches nécessaires. Les fiches actuelles ne déclarent pas deux apports indépendants qui obligent à visiter les deux branches avant chacun des deux finals. L'énergie d'AR-01 est le final M-03, pas une branche de chemin (D-172, D-254). Déplacer son bloc ou les outils de M-06 dans une branche contredirait D-244.

**Choix retenu :** chaque branche donne accès à une commande qui déverrouille l'une de deux cloisons successives, sur l'accès commun au final. Ces deux nouveaux verrouillages et ces deux commandes fixes ont été explicitement soumis au porteur comme un ajout, accepté par Q-184 ; ils n'étaient pas contenus dans D-254.

- Le couloir dessert deux morceaux de chemin. Au-delà de l'obstacle de chacun, une commande fixe est accessible par les chemins de ce morceau, pas depuis le couloir. La commande de la première branche déverrouille seulement la première cloison ; l'autre commande seulement la seconde.
- Actionner une commande coûte une action discrète, sans dé ni consommable ; le déverrouillage reste acquis pour la partie. Une cloison verrouillée ne peut pas s'ouvrir à la main ni être contournée ; une fois déverrouillée, elle s'ouvre et se ferme comme une porte ordinaire, sans ouverture automatique.
- Les deux cloisons sont apportées par l'entrée du morceau final et placées en série, sans annexe ni chemin qui les contourne. Les branches ne se rejoignent pas derrière elles ; le passager revient au couloir après chaque préparation. Ce schéma ne crée pas deux chemins interchangeables vers le final.
- Le problème final reste ensuite à résoudre : ni énergie fournie par une branche ni baie déjà traitée. Tous les objets nécessaires restent dans leur morceau. Les commandes seront ajoutées aux fiches pour l'ordre libre seulement, pas aux versions en chaîne ni aux stations de test existantes.

| Morceau de chemin | Ce que sa branche fournit (GP-01) |
| --- | --- |
| M-01 | Accès à sa commande après la galerie, en plus de la gestion normale du feu et de la créature |
| M-02 | Accès à sa commande au débouché du conduit, après la caisse et la grille |
| M-04 | Accès à sa commande au-delà de la zone de passage de l'observation |
| M-05 | Accès à sa commande après le chemin normal ou le passage caché ; aucun itinéraire imposé |
| M-07 | Accès à sa commande de l'autre côté des machines |
| M-08 | Accès à sa commande sur l'autre bord de la passerelle |
| M-09 | Accès à sa commande au-delà de la coursive sans gravité |
| M-10 | Accès à sa commande après la chambre froide ; distincte du pupitre qui ferme la chambre |

Une seule créature reste placée dans toute la station : un morceau de menace peut être plus facile si elle attend ailleurs. Les deux visites et les deux apports restent nécessaires, pas une méthode de résolution imposée ni une rencontre obligatoire dans chaque branche.

**Preuves attendues en L5 :** pour chaque composition publiée, les deux ordres de préparation mènent à une évacuation sans dé ni blessure ; sans l'un ou l'autre des déverrouillages, aucune évacuation n'est possible, même avec des dés favorables. Les retours au couloir, les passages étroits, le port encombrant, les portes et la place unique de la créature font partie de ces preuves. Une paire permise en §4.1 n'est pas automatiquement utilisable en ordre libre. Aucun nouveau type de commande, effet ou état n'est implémenté par L0 ; le travail du moteur et du format reste en zone orange pour L5.

**Question :** « Pour les deux détours à faire dans l'ordre que vous voulez, je recommande une commande au fond de chacun : il faut les deux pour déverrouiller deux cloisons avant le dernier problème. Acceptez-vous cet ajout ? »

**Réponse du porteur :** « Oui, les deux commandes et cloisons ».

### 8.4 NOUVELLE PARTIE dans la version publique — Q-185, D-260

**Choix retenu :** à partir de L2, comme dans la version de test, NOUVELLE PARTIE tire une station parmi les compositions vérifiées disponibles ; REJOUER CETTE STATION garde le même départ avec de nouveaux dés. Les aventures de référence restent accessibles par un lien.

Le tirage suit D-253 : pile ou face entre les finals quand les deux sont disponibles, puis pur hasard parmi les compositions de ce final ; une station déjà jouée peut revenir. L2 ne livrant d'abord que M-03, elle ne peut tirer M-06 : seul le final disponible est alors utilisé, sans prétendre mesurer un équilibre à deux finals. Cette exception transitoire est acceptée par D-260 ; le pile ou face s'applique dès L3, lorsque les deux finals sont disponibles et vérifiés. Aucun effet rétroactif sur une partie en cours ni sur le bouton REPRENDRE.

**Question :** « Dans la version publique aussi, je recommande que NOUVELLE PARTIE tire une station, parmi celles déjà vérifiées, et que REJOUER garde la même. Au premier lot, seule l'énergie sera disponible, puis la baie s'ajoutera. Cela vous convient-il ? »

**Réponse du porteur :** « Oui, avec ce démarrage progressif ».
