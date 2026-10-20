# Morceaux du lancement — conception

> **Statut :** CONCEPTION ACCEPTÉE v1.0 — cadre D-156 à D-171 ; familles, fiches, règles de mélange MX-01 à MX-05 et parcours acceptés par D-172 à D-175 ; cadrage L0 accepté par D-257 à D-260 (§8) ; places de la créature dans M-07 et M-03 fixées par D-261, qui modifie la fiche M-07, et D-262 (§7.5) ; conception de L3 (M-06, M-08, M-09, stations à deux chemins) approuvée par D-264 et D-265 (§7.6) ; conception de L4 (M-01, M-02, M-04, M-05) approuvée par D-268 et D-269 (§7.7) ; conception de L5 (ordre libre, mesures) approuvée par D-270 (§7.8) ; M-11, sas de sécurité (#203), fixé par D-290 à D-293 et proposé par sa PR en zone orange (§7.10).
> **Mise à jour :** 2026-10-20.
> **Implémentation :** règles des quatre nouveaux morceaux et des mélanges MX-01, MX-04, MX-05 proposées par #105, chacune prouvée dans une station de test (`?monde=m-07` à `m-10`) ; précisions du porteur D-234 à D-240. Assemblage des stations : #106, petites stations d'abord (D-242), objets dans leur morceau (D-244), découpage accepté au §7 (D-245), règles d'assemblage D-246 à D-256 ; L2 fusionnée (PR #160) ; L3 fusionnée (PR #168) ; L4 fusionnée (PR #172) ; L5 proposée par sa PR (§7.8) ; M-11 proposé par la PR de #203 (§7.10). **Parties sur téléphone :** deux parties signées en L2, avec M-07 et M-03 ([journal](journal-parties-humaines.md)) ; aucune consignée pour les neuf autres morceaux.

Document d'auteur : il contient les solutions. Interdit au playtester (C-01).

## 1. Cadre accepté

- Socle de dix morceaux : six tirés d'AR-01/AR-02, quatre nouveaux (D-157/D-158). M-11, sas de sécurité, a rejoint la branche principale par #231. M-12 ajoute le chariot et le drone réparable (D-304 à D-307, #232).
- Une station : une pièce de départ, deux ou trois obstacles dont **un seul problème final**, l'embarquement avec sa capsule, une seule créature (D-119, D-159, GP-02).
- Obstacles en chaîne ou en ordre libre (D-160) ; créature placée à un endroit prévu par un morceau, jamais au départ (D-161) ; tirage du problème final à pile ou face, puis de la station au pur hasard parmi celles qui ont ce final, une station déjà jouée pouvant revenir (D-162, D-253).
- Deux morceaux qui jouent sur la même chose (bruit, ralentissement, neutralisation, air) ne se mélangent qu'une fois leurs règles décidées (D-167) ; les autres se mélangent sans règle de plus (D-248).
- Toujours un chemin sûr au départ, vérifié avant de jouer (D-084).

## 2. Les deux familles de morceaux (D-172)

| Famille | Rôle | Morceaux |
| --- | --- | --- |
| **Final** | Le problème à régler juste avant de partir | M-03 Énergie, M-06 Baie |
| **Chemin** | Obstacles entre le départ et l'embarquement | M-01, M-02, M-04, M-05, M-07, M-08, M-09, M-10, M-11, M-12 |

Une station = départ → un ou deux morceaux « chemin » → un morceau « final » → embarquement. Le morceau final apporte l'embarquement et sa capsule (D-249) ; au départ, les portes entre deux morceaux sont fermées (D-252) ; le tirage choisit d'abord le final à pile ou face (D-253).

En ordre libre, les deux branches donnent chacune accès à une commande distincte, nécessaire pour déverrouiller l'une des deux cloisons successives avant le final (D-259, §8.3). Ce ne sont pas deux itinéraires interchangeables. À partir de L2, NOUVELLE PARTIE tire une station aussi dans la version publique ; seul le final énergie est disponible en L2, puis le pile ou face s'applique dès que les deux finals sont disponibles et vérifiés (D-260, §8.4).

## 3. Fiches

Chaque fiche donne : les pièces apportées, les objets, les places possibles de la créature (D-161), le chemin sûr et une variante risquée.

La pièce de départ, hors des dix morceaux, est le vestibule de réveil décrit au §8.1 (D-257).

### M-01 — Galerie en feu (AR-01 G)

- **Pièces :** le poste incendie, en entrée, avec le bidon d'eau (une dose) ; le tunnel technique, en feu au départ ; le palier, d'où part la sortie. Les deux cloisons intérieures sont fermées au départ (D-258, §8.2), comme la cloison de sortie (D-252).
- **Créature :** une seule place déclarée, le palier ; jamais dans le tunnel ni dans le poste incendie (D-258). Elle y bouche le seul passage : une station qui l'y place n'est prouvée, donc proposée, que derrière M-04, M-07, M-08 ou M-10 (D-268, §7.7).
- **Sûr :** prendre l'eau, ouvrir, éteindre depuis le seuil, traverser (C-03 §5.3).
- **Risqué :** laisser la porte ouverte deux actions : le feu gagne la pièce voisine.

### M-02 — Grille haute et caisse (AR-01 A–P)

- **Pièces :** l'atelier maintenance, en entrée, nom repris d'AR-01, avec la caisse au centre et une position sous la grille ; la salle des pompes, au-delà du conduit, d'où part la sortie. La grille est haute côté atelier, étroite, sans signalétique, laisse passer le son et est fermée au départ, comme dans AR-01.
- **Créature :** peut attendre dans l'atelier ; ne passe jamais le conduit (D-044). Elle y bouche le seul passage : une station qui l'y place n'est prouvée, donc proposée, que derrière M-04, M-07, M-08 ou M-10 (D-268, §7.7).
- **Sûr :** déplacer la caisse sous la grille, ouvrir, traverser.

### M-03 — Énergie (AR-01 P, final)

- **Pièces :** un local avec la console du circuit et le bloc de secours ; la salle d'embarquement et sa capsule (D-249).
- **Créature :** dans la réserve reliée au local, porte ouverte au départ (D-262).
- **Sûr :** isoler le bruit puis réactiver le circuit, ou porter le bloc par les passages normaux et l'installer.

### M-04 — Salle d'observation (AR-01 O)

- **Pièces :** la salle de contrôle, en entrée, avec la burette d'huile (une dose) et la commande du test de l'avertisseur ; la salle d'observation, avec l'alcôve et l'émetteur, d'où part la sortie. Entre elles, une cloison bruyante, fermée ; la cloison de sortie est fermée aussi (D-252). L'observation n'est pas posée contre la coque (D-269) ; le seuil où verser l'huile est celui de la cloison bruyante.
- **Créature :** dans la salle d'observation, sur la zone de passage.
- **Sûr :** test de l'avertisseur puis traversée hors de vue, ou seuil huilé.
- **Risqué :** traverser exposé, un D6 (C-04).

### M-05 — Panneau et passage caché (AR-01 P–E)

- **Pièces :** le local de service, en entrée, avec le panneau de service ; la salle de tri, sur le chemin normal ; le hall de chargement, d'où part la sortie. Deux portes fermées au départ : local–salle de tri et salle de tri–hall. Le panneau, fermé, ouvrable à la main, mène par un passage étroit du local au hall ; il est caché vu du hall.
- **Créature :** jamais dans le passage ; elle attend dans la salle de tri, sur le chemin normal, que le passage étroit permet de contourner (D-256).
- **Sûr :** ouvrir le panneau, emprunter le raccourci.

### M-06 — Baie et vide (AR-02, final)

- **Pièces :** un couloir de sécurité en entrée (D-265) ; local de sécurité (combinaison, découpeuse) ; salle panoramique (baie, rustine) ; la créature garde l'embarquement, dont la capsule est déjà alimentée.
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
- **Créature :** de l'autre côté du vide, dans le magasin (D-265).
- **Sûr :** rapporter la planche, la poser, traverser, la retirer derrière soi.
- **Piège :** laisser la planche en place et attirer la créature dessus : elle tombe, la planche est perdue.

### M-09 — Zone sans gravité (nouveau, D-165/D-168)

- **Pièces :** une coursive sans gravité, interrupteur à chaque bout ; une cale au-delà.
- **Créature :** au-delà de la coursive, dans la cale (D-265).
- **Sûr :** traverser en deux actions pendant qu'elle est occupée ailleurs.
- **Idée :** couper la gravité quand elle s'y engage : elle met deux réactions de plus à traverser.

### M-10 — Chambre froide (nouveau, D-166/D-170)

- **Pièces :** une chambre froide à deux portes, un compresseur à l'intérieur ; un pupitre de fermeture dans la pièce voisine, hors de vue.
- **Créature :** dans une pièce voisine de la chambre.
- **Sûr :** déclencher le compresseur, ressortir, fermer depuis le pupitre quand elle est entrée.
- **Risqué :** se faire suivre à travers la chambre et refermer derrière soi ; au-delà de deux actions dedans, une blessure.

### M-11 — Sas de sécurité (nouveau, #203)

- **Pièces :** le poste de sécurité, en entrée, avec le lecteur de carte, fixe ; le vestiaire, porte ouverte, avec la carte de sécurité ; la remise, au-delà du vestiaire, porte fermée ; le sas de sécurité, derrière la porte blindée, verrouillée, d'où part la sortie (D-290 à D-293).
- **Créature :** une seule place, la remise, porte fermée au départ ; on n'a pas besoin de l'ouvrir (D-293). Elle ne force jamais la porte blindée (D-292).
- **Sûr :** prendre la carte au vestiaire, revenir au poste, actionner le lecteur carte en main (le verrou est levé pour la partie, D-291), ouvrir la porte blindée et passer.
- **Risqué :** ouvrir la remise et réveiller la créature, puis se réfugier derrière la porte blindée refermée, qu'elle ne peut pas enfoncer.

### M-12 — Le chariot bloqué et le drone réparable (#232)

- **But :** dégager un chariot qui barre le chemin vers la suite. Il faut maintenir une poignée au poste pendant que le passager pousse au palier : deux lieux, deux rôles.
- **Pièces :** atelier du drone, galerie de détour, poste, palier du chariot, réserve et quai de sortie. Le plan distingue le trajet du passager et le trajet local du drone ; aucune commande ne téléporte un objet à travers une porte fermée.
- **Créature :** place prévue dans la réserve. Une fermeture peut gagner du temps après la rencontre ; elle ne garantit pas une protection permanente. L'ouverture de la porte de réserve et les autres passages sont décrits dans le contenu.
- **Demande / fournit :** coopération avec le drone ; accès durable une fois le chariot rangé. Sans drone en maintien, le passager ne peut pas tenir la poignée et pousser ailleurs. Il n'y a pas la manivelle autonome de la première maquette.
- **Drone :** activation locale, trajet de manutention puis maintien bruyant. Il ne combat pas, ne ramasse rien et ne devient pas un compagnon universel. La tâche se termine quand le chariot est déplacé.
- **Panne récupérable :** une attaque le sort du rail, interrompt le maintien et coupe le moteur. Deux gestes sur place : replacer, puis réarmer/relancer. Aucun consommable ; les dangers continuent pendant ces gestes.
- **Préparation sûre à prouver :** isoler le bruit de la réserve avant la mise en route, déléguer le maintien, rejoindre le palier, pousser et poursuivre la station.
- **Variante risquée à prouver :** après une rencontre ou une panne, reprendre la coopération en utilisant le plan, les portes et le répit réel. Le coût en blessures dépend de C-04, pas des résultats déterministes de la maquette.
- **Carte :** pictogramme vert du drone dans son dernier emplacement observé, sans déplacement omniscient hors de vue (D-307).
- **État des preuves :** conception retenue pour intégration ; tests, parcours complets, vérification du catalogue, relecture et partie sur téléphone doivent être fournis par la PR. Les essais de maquette ne valident pas une partie du vrai jeu.

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

Avec ces règles, toutes les paires des onze morceaux sont permises, sauf M-03 et M-06, qui ne se rencontrent jamais (D-172). M-11 ne joue sur aucune de ces familles : ses dix paires sont permises sans règle de plus (D-248, D-290). Un futur morceau qui joue sur la même chose qu'un autre reste refusé avec lui tant que leur mélange n'a pas de règles (D-167, D-248).

Pour M-12 (D-306), le bruit suit la même sélection et le même masquage que les équipements existants ; aucun changement des priorités générales de la créature. L'huile, le froid et la gravité gardent leurs effets sur ses réactions. Les équipements de M-12 ne sont pas détruits par le feu ou le vide ; le passager, lui, garde tous ses risques. Le chariot est une obstruction de déplacement, pas une cloison étanche : les autres canaux conservent les qualités déclarées de la liaison. La permission d'une paire ne remplace jamais la preuve d'une station complète. M-11/M-12 gardent leurs règles indépendantes (D-248), notamment le blindage de M-11 ; leurs compositions doivent être prouvées ensemble sur la branche principale actualisée.

### 4.1 Table exhaustive des paires (L0, #150)

Chaque paire non ordonnée figure une seule fois : 55 paires, dont 54 permises et une jamais ensemble (les dix lignes de M-11 ajoutées par #203, D-290). Les règles citées sont celles du tableau ci-dessus et du [journal des décisions](03-decisions.md). Cette table autorise une cohabitation, pas une station : chaque composition doit encore respecter les attaches, le nombre d'obstacles et le chemin sûr vérifié (C-08 §2 et §3). L2 la transcrira en données ; aucun code ne change en L0.

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
| M-01 + M-11 | Permise | Feu et sas de sécurité, sans règle de plus (D-248) |
| M-02 + M-03 | Permise | Grille/caisse et énergie, sans règle de plus (D-248) ; le bloc ne passe pas le conduit (D-043) |
| M-02 + M-04 | Permise | Grille/caisse et observation, sans règle de plus (D-248) |
| M-02 + M-05 | Permise | Grille/caisse et passage caché, sans règle de plus (D-248) |
| M-02 + M-06 | Permise | Grille/caisse et baie, sans règle de plus (D-248) |
| M-02 + M-07 | Permise | Grille/caisse et machines, sans règle de plus (D-248) |
| M-02 + M-08 | Permise | Grille/caisse et passerelle, sans règle de plus (D-248) |
| M-02 + M-09 | Permise | Grille/caisse et gravité, sans règle de plus (D-248) |
| M-02 + M-10 | Permise | Grille/caisse et froid, sans règle de plus (D-248) |
| M-02 + M-11 | Permise | Grille/caisse et sas de sécurité, sans règle de plus (D-248) |
| M-03 + M-04 | Permise | Bruits entre eux : relais et avertisseur suivent les règles existantes (§4, D-174) |
| M-03 + M-05 | Permise | Énergie et passage caché, sans règle de plus (D-248) ; le bloc ne passe pas le passage étroit (D-043) |
| M-03 + M-06 | Jamais ensemble | Deux morceaux finals ; un seul final par station (D-159, D-172) |
| M-03 + M-07 | Permise | Bruits entre eux (§4, D-174) ; interrupteur autonome, indépendant de l'énergie (D-168) |
| M-03 + M-08 | Permise | Énergie et passerelle, sans règle de plus (D-248) ; planche et bloc encombrants, un seul porté à la fois (D-169) |
| M-03 + M-09 | Permise | Énergie et gravité, sans règle de plus (D-248) ; interrupteurs autonomes (D-168) |
| M-03 + M-10 | Permise | Bruits entre eux : relais et compresseur suivent les règles existantes (§4, D-174) |
| M-03 + M-11 | Permise | Énergie et sas de sécurité, sans règle de plus (D-248) |
| M-04 + M-05 | Permise | Observation et passage caché, sans règle de plus (D-248) |
| M-04 + M-06 | Permise | MX-03 : vide et huile sans effet l'un sur l'autre (D-174) |
| M-04 + M-07 | Permise | Bruits entre eux : avertisseur et machines suivent les règles existantes (§4, D-174) |
| M-04 + M-08 | Permise | Observation/huile et passerelle, sans règle de plus (D-248) |
| M-04 + M-09 | Permise | MX-01 : ralentissements additionnés ; MX-04 : huile impossible à verser sans gravité (D-174) |
| M-04 + M-10 | Permise | Bruits entre eux ; MX-01 : ralentissements additionnés ; MX-05 : huile toujours glissante dans le froid (D-174) |
| M-04 + M-11 | Permise | Observation/huile/avertisseur et sas de sécurité, sans règle de plus (D-248) |
| M-05 + M-06 | Permise | Passage caché et baie, sans règle de plus (D-248) |
| M-05 + M-07 | Permise | Passage caché et machines, sans règle de plus (D-248) |
| M-05 + M-08 | Permise | Passage caché et passerelle, sans règle de plus (D-248) |
| M-05 + M-09 | Permise | Passage caché et gravité, sans règle de plus (D-248) |
| M-05 + M-10 | Permise | Passage caché et froid, sans règle de plus (D-248) |
| M-05 + M-11 | Permise | Passage caché et sas de sécurité, sans règle de plus (D-248) |
| M-06 + M-07 | Permise | L'air quitte aussi les machines ; aucune règle de plus (D-246) |
| M-06 + M-08 | Permise | L'air passe par-dessus le vide de la passerelle (D-246) ; neutralisations définitives, sans règle de plus (§4, D-174) |
| M-06 + M-09 | Permise | L'air quitte aussi la zone sans gravité ; aucune règle de plus (D-246) |
| M-06 + M-10 | Permise | L'air quitte aussi la chambre froide ; aucune règle de plus (D-246) |
| M-06 + M-11 | Permise | Baie et sas de sécurité, sans règle de plus (D-248) |
| M-07 + M-08 | Permise | Machines et passerelle, sans règle de plus (D-248) |
| M-07 + M-09 | Permise | Machines et gravité, sans règle de plus (D-248) |
| M-07 + M-10 | Permise | Bruits entre eux : machines et compresseur suivent les règles existantes (§4, D-174) |
| M-07 + M-11 | Permise | Machines et sas de sécurité, sans règle de plus (D-248) |
| M-08 + M-09 | Permise | Passerelle et gravité, sans règle de plus (D-248) |
| M-08 + M-10 | Permise | Passerelle et froid, sans règle de plus (D-248) |
| M-08 + M-11 | Permise | Passerelle et sas de sécurité, sans règle de plus (D-248) |
| M-09 + M-10 | Permise | MX-01 : traversée sans gravité et ralentissement par le froid additionnés (D-174) |
| M-09 + M-11 | Permise | Gravité et sas de sécurité, sans règle de plus (D-248) |
| M-10 + M-11 | Permise | Froid et sas de sécurité, sans règle de plus (D-248) |

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
| L6 ([#156](https://github.com/greffeb/void-walker/issues/156)) — « Plus aucune sortie » | Calcul après chaque action : un chemin vers la capsule (D-275, §7.9) ; une sortie au dé reste une sortie (D-251) ; message, rappel discret (D-144) et textes | G-03, G-04, G-06 ; un test par obstacle et des parties au hasard comparés à la recherche complète, au lieu de « tous les états atteints », infaisable (D-275) : un seul signal faux bloque la livraison ; temps par action mesuré sur téléphone | Orange (moteur) | Oui : une sortie perdue exprès |

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

**Ordre de recherche, L3 (#153, D-265).** En largeur, les stations à trois obstacles atteignent presque toutes le plafond de 150 000 états (maquette jetable, 11 sur 12 mesurées), de même que la baie avec la créature devant la capsule derrière M-08, M-09 ou M-10. Le vérifieur développe donc d'abord les états où le passager est dans le morceau le plus avancé de la station, puis, à égalité, dans l'ordre d'arrivée. Le graphe, la clé d'état, les transitions écartées, le plafond et le rejeu du témoin ne changent pas : une recherche épuisée donne le même verdict « sans sortie sûre » qu'en largeur. Le chemin témoin n'est plus forcément le plus court. Un monde écrit en entier, dont les pièces ne sont pas rattachées à un morceau, garde la largeur et ses résultats ci-dessus. Les résultats gardés par empreinte et la vérification dans un job de CI à part n'ont pas été nécessaires (§7.6) ; un verdict gardé deviendrait faux après un changement de règle, l'empreinte d'un morceau ne couvrant pas le moteur.

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

> **Statut :** fusionné ([PR #168](https://github.com/greffeb/void-walker/pull/168)) ; aucune partie sur téléphone n'est consignée pour M-06, M-08 et M-09 dans le [journal](journal-parties-humaines.md). Conception : [spec L3](superpowers/specs/2026-10-15-baie-passerelle-gravite-design.md), approuvée (D-265) ; réussite fixée par D-264. Depuis L4, le catalogue compte 368 compositions et `check:texts` contrôle dix stations (§7.7) ; les chiffres ci-dessous sont ceux de L3.

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

Choix des agents, approuvés avec la conception (D-265) :
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
| M-06 | `1f3f876a0661cf` |
| M-08 | `1e3f11862eb5b2` |
| M-09 | `13abdc1f1f2757` |

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

Avec la baie, la créature attend devant la capsule une fois sur deux ou sur trois. Ailleurs, la baie peut servir à lui ôter l'air. C'est une question de difficulté, laissée pour plus tard (D-264).

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
| **Q-188, D-264.** « Dans vos deux parties de L2, il vous a suffi de claquer la porte au nez de la créature. Quand vous lancerez une station avec la baie, la passerelle ou la zone sans gravité, qu'est-ce qui vous fera dire « cette livraison est réussie » ? » | « pouvoir arriver a la capsule. (la difficulté on verra plus tard) » |
| **Q-189.** « Je peux mesurer ces deux points tout de suite sur une maquette jetable, sans rien changer au jeu, avant de vous poser d'autres questions. J'y vais ? » Les deux points : places de la créature des fiches et coût de la vérification à trois obstacles. | « go » |
| **Q-190.** « Avant que je l'écrive, voyez-vous quelque chose à corriger ou à ajouter ? » Question posée après le résultat de la maquette et la liste des choix par défaut. | « go » |
| **Q-191, D-265.** « La conception vous convient-elle pour passer au plan de travail ? », avec la liste des choix des agents. | « c'est bon » |
| **Q-192.** « Le plan vous convient-il, et laquelle de ces deux façons préférez-vous ? » Les deux façons : par tâches confiées ou par l'agent seul. | « ok et par taches confinés. a la fin, fait la PR en autonomie et push » |

### 7.7 Chemins d'AR-01 L4 (#154)

> **Statut :** fusionné ([PR #172](https://github.com/greffeb/void-walker/pull/172)) ; aucune partie au bout sur téléphone n'est consignée pour M-01, M-02, M-04 et M-05 dans le [journal](journal-parties-humaines.md) (**validation humaine requise**, D-098). Conception : [spec L4](superpowers/specs/2026-10-16-chemins-ar01-design.md), approuvée (D-269) ; réussite celle de L3 (D-264).

Les quatre morceaux de chemin qui restaient sont découpés dans AR-01 et entrent au tirage. Les dix morceaux sont tous tirables. AR-01 reste écrite en entier et ne change pas, parcours compris.

NOUVELLE PARTIE tire maintenant parmi **324 compositions publiées**, sur 368 possibles :
- le vestibule ;
- un ou deux morceaux de chemin distincts parmi les huit, dans un ordre donné ;
- le final M-03 ou M-06 ;
- une place de créature parmi celles de ces morceaux.

Il y a 32 compositions à un chemin et 336 à deux. Le tirage ne change pas : pile ou face entre les deux finals, puis une composition publiée au hasard parmi celles de ce final.

Pièces et places de la créature (fiches du §3) :

| Morceau | Pièces, de l'entrée à la sortie | Place |
| --- | --- | --- |
| M-01 | poste incendie, tunnel technique (en feu), palier | palier |
| M-02 | atelier maintenance, salle des pompes | atelier maintenance |
| M-04 | salle de contrôle, salle d'observation | salle d'observation |
| M-05 | local de service, salle de tri, hall de chargement | salle de tri |

Choix des agents, approuvés avec la conception (D-269), sauf mention :
- chaque morceau porte ses objets (D-244) : l'eau dans M-01, l'huile et la commande de l'avertisseur dans M-04 ;
- la salle d'observation n'est pas posée contre la coque : avec la coque, la chaîne M-09 → M-04 → M-06 n'avait aucun plan dans la maquette ;
- la sortie de M-04 est fermée (D-252), alors qu'elle est ouverte dans AR-01 ;
- la vérification complète reste dans `npm run verify`, sans résultats gardés ni job de CI à part ; le porteur a accepté « environ une minute et demie », la mesure est au-delà (ci-dessous), point ouvert posé dans la PR ;
- `check:texts` contrôle une série fixe, de dix stations [détail de l'agent pour le nombre] ;
- les noms affichés sont écrits à la main, finalisés à la relecture des textes, sans nouvelle question au porteur (tableau ci-dessus) [détail de l'agent].

Les 88 compositions de L3 donnent exactement les mêmes stations à la graine 2718281828 : l'empreinte du monde le prouve, pour chacune et pour leur ensemble. Aucune règle ne lit la graine hors du plan.

**Sortie de M-04 fermée.** AR-01 garde sa cloison ouverte. Sur une copie d'AR-01 où elle est fermée, P-B et P-C se jouent avec une action de plus, ouvrir la cloison juste avant de sortir de l'observation : 20 et 17 actions, sans dé ni blessure, export rejoué. Dans une station, les deux chemins sûrs de M-04 restent prouvés, chacun seul : test de l'avertisseur, ou seuil huilé.

**Catalogue.** `npm run check:stations` donne une mesure locale indicative, contrôle du témoin compris. Les durées ne sont pas des assertions. Toutes les compositions sont vérifiées à la graine de plan 0.

| Final, chemins | Prouvées | Sans sortie sûre | États des prouvées | Actions du témoin | Temps des prouvées |
| --- | ---: | ---: | ---: | ---: | ---: |
| M-03, un | 14 | 2 | 326 à 1 827 | 13 à 19 | 0,54 s en tout |
| M-03, deux | 148 | 20 | 347 à 32 982 | 17 à 34 | 10,73 s en tout |
| M-06, un | 14 | 2 | 449 à 13 481 | 14 à 24 | 2,89 s en tout |
| M-06, deux | 148 | 20 | 470 à 33 385 | 18 à 35 | 37,92 s en tout |

La plus lourde des prouvées est `m08-m01-m06-palier` : 33 385 états, 35 actions, 2,18 s.

Dans `npm run verify`, le 2026-10-16 sur ce PC : `check:stations` 147 s, `check:texts` 181 s, tests 192 s (dont le catalogue prouvé une seconde fois par `tools/verifier-station.test.ts`) ; la vérification complète prend environ neuf minutes, toutes étapes vertes. C'est plus que la minute et demie annoncée au porteur pour `check:stations` : point ouvert.

**Les 44 compositions sans sortie sûre** placent toutes la créature sur le palier de M-01 ou dans l'atelier de M-02, sans M-04, M-07, M-08 ni M-10 avant elle : 22 par final. Elle y bouche le seul passage. Le vérifieur épuise la recherche sans trouver d'évacuation sans dé ni blessure ; elles ne sont jamais proposées (D-268). Entre parenthèses, les états explorés :
- **palier :**
  - M-01 seul, ou en premier devant n'importe quel autre chemin (309) ;
  - derrière M-02 (3 986), M-05 (24 955) ou M-09 (**124 356**, 8 à 9 s) ;
- **atelier :**
  - M-02 seul, ou en premier devant n'importe quel autre chemin (9) ;
  - derrière M-01 (881), M-05 (504) ou M-09 (2 112).

Ces 44 prennent 22,5 s en tout. Derrière M-09, la recherche s'épuise à 124 356 états, sous le plafond de 150 000 : une petite extension de M-09 ou de M-01 pourrait la faire passer à « non prouvée », sans changer ce qui est proposé.

Une composition rejetée, forcée par `?station=` ou `--station`, est refusée avec le motif « non prouvée : non proposée ». Elle n'est jamais tirée.

**Empreintes** (D-100) :

| Morceau | Empreinte |
| --- | --- |
| M-01 | `07a232404192a1` |
| M-02 | `12d855443102bb` |
| M-04 | `16f2dbba8d913d` |
| M-05 | `0bb43c849c0f7f` |

Le vestibule, M-03, M-07 et M-10 gardent celles du §7.5 ; M-06, M-08 et M-09 celles du §7.6.

**Plans.** Sur 1 000 graines pour chacune des 128 chaînes de morceaux, échecs compris :
- 1 000 plans sur 1 000 pour chaque chaîne ;
- au plus 2,06 ms en moyenne par chaîne, 10,42 ms pour le pire tirage.

**Tirages.** Sur 1 000 tirages complets du catalogue, à graine fixe :

| Mesure | Résultat |
| --- | --- |
| Finals | M-03 521, M-06 479 |
| Nombre de chemins | un 83, deux 917 |
| Morceaux | M-01 185, M-02 166, M-04 274, M-05 265, M-07 244, M-08 262, M-09 266, M-10 255 |
| Places de la créature | palier 22, atelier 17, observation 87, salle de tri 104, soute 90, magasin 81, cale 109, entrepôt 87, réserve 224, embarquement 179 |
| Temps de tirage | 0,80 ms en moyenne, 5,21 ms au plus |

Le palier et l'atelier sortent rarement : seules les compositions qui les placent derrière un obstacle utile sont publiées (D-268). C'est une question de difficulté, laissée pour plus tard (D-264).

**Parcours joués en station assemblée** (spec L4 §9). Chacun part du départ, par les commandes publiques, sans dé ni blessure sauf le risqué :

| Morceau | Station | Résultat |
| --- | --- | --- |
| M-01, sûr | `m01-m03-reserve` | Prendre l'eau, ouvrir, éteindre le tunnel depuis le seuil, traverser jusqu'au palier |
| M-01, risqué | `m01-m03-reserve` | Cloison du tunnel laissée ouverte : le feu gagne le poste incendie (D-188) |
| M-01, créature sur le palier | `m07-m01-m03-palier` | Prouvée |
| M-02, sûr | `m02-m03-reserve` | Caisse sous la grille, ouvrir, traverser jusqu'à la salle des pompes |
| M-02, créature dans l'atelier | `m10-m02-m03-atelier` | Prouvée ; le témoin attire la créature hors de l'atelier, vers l'entrepôt de M-10, où elle reste |
| M-04, sûr | `m04-m03-observation` | Test de l'avertisseur, puis traversée ; ou seuil huilé, puis traversée |
| M-04, risqué | `m04-m03-observation` | Traverser exposé : au moins un dé |
| M-05, sûr | `m05-m03-tri` | Ouvrir le panneau, passer au hall sans entrer dans la salle de tri |
| Panneau vu du local | `m05-m03-tri` | Panneau fermé, sans destination, sans « aller » |
| Panneau vu du hall | `m05-m03-reserve` | Arrivé par la salle de tri, le hall ne montre pas le panneau |
| Bloc d'énergie au passage étroit | `m02-m03-reserve`, `m05-m03-reserve` | Grille ou panneau ouvert : « aller » indisponible, trop large, essai refusé sans coût |

Le panneau vu du hall se prouve sur `m05-m03-reserve` : avec la créature dans la salle de tri, la recherche atteint son plafond avant d'arriver au hall par ce chemin. La règle ne dépend pas de la place de la créature.

**Mélanges joués en station assemblée** (§4) :

| Mélange | Station | Résultat |
| --- | --- | --- |
| MX-02 | `m01-m06-embarquement`, depuis un état préparé : tunnel rallumé, passager équipé dans la panoramique | Baie percée, portes ouvertes jusqu'au tunnel : l'air s'en va, le feu s'éteint à l'instant où l'air le gagne. Le palier, déjà sans air, ne prend pas feu ; la garde « pas de feu sans air » du moteur n'est pas atteinte en jeu, l'air se réglant avant le feu |
| MX-03 | `m04-m06-embarquement` | L'huile versée au seuil reste glissante quand l'air s'en va |
| MX-04 | `m04-m09-m03-reserve` | Burette en main, dans la pièce sans gravité de M-09 : verser est impossible, refusé sans coût ; gravité rétablie : verser est possible |
| MX-05 | `m04-m10-m03-reserve` | L'huile versée dans la chambre froide reste glissante |
| Feu et passerelle (D-247) | `m08-m01-m03-reserve` | Le feu du tunnel gagne le poste incendie, puis le bord sud de la passerelle par la porte ouverte, et l'autre bord par-dessus le vide |

L'état préparé de MX-02 a une raison : on ne traverse pas le tunnel en feu sans blessure, et rien ne le rallume une fois arrosé. Le cas « le feu ne gagne pas une pièce sans air » n'est pas atteignable en jeu : à chaque action, l'air se règle avant le feu, et le foyer s'éteint avant de pouvoir gagner une pièce sans air. Aucune règle n'est ajoutée au moteur.

**Contrôle des textes.** `check:texts` explore dix stations fixes, qui couvrent :
- chaque morceau ;
- chaque place de la créature, palier et atelier compris ;
- chaque chemin en première et en seconde position ;
- les morceaux des mélanges du §5 réunis dans une même station : M-01 et M-06, M-04 avec M-06, M-09 ou M-10, et M-08 puis M-01.

Ce sont `m01-m03-reserve`, `m01-m05-m03-tri`, `m02-m06-embarquement`, `m02-m07-m06-soute`, `m04-m09-m06-observation`, `m05-m08-m03-magasin`, `m07-m02-m03-atelier`, `m08-m01-m06-palier`, `m09-m10-m06-cale` et `m10-m04-m03-entrepot`. Chacune est parcourue avec son témoin. Le contrôle prend environ trois minutes, comme en L3. Avec sa borne de 50 000 états par station, il n'exerce pas MX-02 ni MX-03 : leurs cas sont prouvés par leurs tests.

Les récits « arroser » et « déplacer » du socle n'avaient qu'une phrase ; ils en ont deux (D-111). L'extinction est racontée sans supposer d'air. Des récits de plus de quatre phrases restent signalés en avertissement autour du feu, comme dans AR-01 ; la question reste ouverte (D-111).

**Questions posées au porteur le 2026-10-16**, citées mot pour mot :

| Question | Réponse du porteur |
| --- | --- |
| **Q-193.** « Pour la livraison précédente, vous aviez dit que ce serait réussi si l'on pouvait « arriver à la capsule », la difficulté se réglant plus tard. Je pars sur la même chose ici. Ces quatre morceaux viennent de la première aventure : attendez-vous autre chose en les retrouvant dans une station tirée au hasard ? » | « 154 » — compris comme un feu vert pour #154, sans autre critère ; la réussite reste celle de D-264, sans nouvelle décision. |
| **Q-194, D-268.** « Vous convient-il que la créature n'attende sur le palier ou dans l'atelier que dans les stations où un obstacle d'avant permet de s'en débarrasser ? Sinon, voulez-vous qu'elle attende ailleurs dans ces deux morceaux ? » Contexte donné : la maquette jetable montrait la créature sur le palier ou dans l'atelier bouchant le seul passage ; ces stations ne restent que derrière la salle des machines, la passerelle, la chambre froide ou l'observation (16 sur 56 dans la maquette). | « c'est bon » |
| **Q-195, D-269.** « La conception vous convient-elle pour passer au plan de travail ? », avec la liste des choix des agents (noms des pièces, observation hors coque, vérification d'environ une minute et demie acceptée, série fixe pour le contrôle des textes, liens de validation avec la créature dans le morceau). | « yes » |
| **Q-196.** « Le plan vous convient-il, et on garde la même façon de faire ? » (tâches confiées une à une, chacune relue, puis PR et push en autonomie) | « oui, travaille en autonomie je vais me coucher, fait la PR quand tu a fini » |

### 7.8 Ordre libre et mesures L5 (#155)

> **Statut :** proposé par la PR de #155 (zone orange), en attente de l'accord du porteur et d'une partie au bout sur téléphone dans une station en ordre libre (**validation humaine requise**, D-098). Conception : [spec L5](superpowers/specs/2026-10-16-ordre-libre-mesures-design.md), approuvée (D-270).

**Forme.** Le vestibule donne sur un couloir commun. Deux branches en partent, deux morceaux de chemin qui finissent en cul-de-sac. Au bout du couloir, un sas entre deux cloisons verrouillées mène au final. Au fond de chaque branche, au-delà de son obstacle, une commande lève le verrou d'une cloison : dans sa pièce de sortie, sauf pour M-10, où elle est dans l'entrepôt, après la chambre froide (la coursive de sortie se rejoint des quartiers sans rien franchir, relevé par la relecture) [détail de l'agent]. La commande de la branche A (le plus petit numéro) lève le premier verrou, celle de la branche B le second. Le couloir, le sas et les cloisons forment le **carrefour**, un morceau à part ; M-03 et M-06 ne changent pas. L'IA Station prévient à la première arrivée dans le couloir.

**Moteur.** Deux qualités nouvelles (C-02 §5) : la cloison verrouillée, que rien n'ouvre avant sa commande (« Ouvrir » indisponible, refus sans coût), et la commande de déverrouillage, qu'on **actionne** en une action discrète, sans dé, une seule fois. Une fois levée, la cloison est une porte ordinaire. Un monde sans cloison verrouillée garde exactement le même état.

**Catalogue.** NOUVELLE PARTIE tire maintenant parmi **464 compositions publiées** sur 536 :
- 324 en chaîne, inchangées depuis L4 ;
- 140 en ordre libre sur 168 : 28 paires de branches × 2 finals × 3 places de la créature.

Les 28 autres placent la créature sur le palier de M-01 ou dans l'atelier de M-02. Ces places ne sont permises que derrière un obstacle qui permet de s'en débarrasser (D-268), et en ordre libre aucune branche n'en précède une autre : elles sont écartées avant tout plan, avec ce motif [détail de l'agent]. La recherche atteignait sinon son plafond, à 50 s chacune.

Le tirage ne change pas (D-253, Q-198) : pile ou face entre les finals, puis une composition publiée au hasard parmi celles de ce final.

**Preuves (G-07, G-08).**
- Chaque composition en ordre libre est vérifiée deux fois : une recherche où la seconde commande n'est jamais actionnée avant la première, une autre dans l'ordre inverse. Toutes deux mènent à l'évacuation sans dé ni blessure, témoin et export rejoués. Les 140 sont prouvées dans les deux ordres.
- Chaque cloison, verrouillée, coupe à elle seule toute capsule du départ : aucune suite de liaisons, quelles qu'elles soient, ne la contourne. Sans l'une des commandes, aucune évacuation n'est donc possible, même avec des dés favorables. Un test du moteur le confirme en explorant tout le graphe d'une petite station, toutes faces de dés comprises : aucune action, aucun dé, ni la créature ni le feu n'ouvrent une cloison verrouillée. Une copie où un passage contourne une cloison est rejetée : « une branche pourrait être sautée ».
- La recherche de chaque ordre développe d'abord la branche de la commande attendue, puis l'autre, puis le final [détail de l'agent] : même graphe, mêmes transitions, même plafond.

Mesure du serveur de développement, plus lent que le PC du porteur ; les durées ne sont pas des assertions :

| Final, ordre libre | Prouvées | États (deux ordres) | Actions du témoin | Temps des prouvées |
| --- | ---: | ---: | ---: | ---: |
| M-03 | 70 | 1 086 à 9 787 | 27 à 41 | 28,1 s en tout |
| M-06 | 70 | 1 408 à 27 784 | 28 à 45 | 104,0 s en tout |

La plus lourde est `ol-m01-m09-m06-embarquement` : 27 784 états pour les deux ordres. Sur ce serveur, la vérification des compositions prend 189 s en chaîne et 132 s en ordre libre.

**Station rejetée, avec son diagnostic.** `ol-m01-m07-m03-palier`, forcée par `?station=ol-m01-m07-m03-palier-1` ou `--station`, est refusée : « Créature en m-01/p-palier : écartée sans recherche. Cette place n’est permise que derrière un obstacle qui permet de s’en débarrasser (D-268) ; en ordre libre, aucune branche ne précède l’autre. » Avant cette règle, sa vérification atteignait le plafond dans les deux ordres : 300 000 états, « Recherche interrompue au plafond de 150000 états : évacuation non prouvée. »

**Plans.** Couloir de 16 cases, sas au bout ; le final est posé avant les branches [détail de l'agent]. Un couloir de 8 cases donnait jusqu'à 0 % de plans sur les paires les plus longues. Sur 1 000 graines pour chacune des 56 chaînes en ordre libre : au moins 987 plans (M-07 et M-10 avec M-06), 999,8 en moyenne, au plus 3,1 ms en moyenne par chaîne et 41 ms pour le pire tirage. Les 128 chaînes en chaîne gardent 1 000 plans sur 1 000 et le même plan pour la même graine.

**Mesures sur 1 000 tirages** (`npm run mesurer:tirages`, D-241, Q-199) :

Mesures du 2026-10-16 sur ce serveur ; graine fixe, les mêmes à chaque mesure ; 1 465 s, surtout pour D-241.

*Tirages réels* (NOUVELLE PARTIE, 1 000 tirages) : 1 000 stations, 399 compositions distinctes.

| Mesure | Résultat |
| --- | --- |
| Finals | M-03 524, M-06 476 |
| Formes | une chaîne à un chemin 53, à deux 638, ordre libre 309 |
| Morceaux | M-01 186, M-02 169, M-04 265, M-05 240, M-07 289, M-08 266, M-09 254, M-10 278 ; M-03 524, M-06 476 |
| Places de la créature | palier 15, atelier 20, observation 96, salle de tri 90, soute 123, magasin 86, cale 92, entrepôt 99, réserve 186, embarquement 193 |
| Stations non prouvées proposées | **0** |
| **D-241 :** créature mise hors jeu ou enfermée possible avant le final, sans dé ni blessure, sans entrer dans le final | **361 sur 1 000 (36,1 %)** ; impossible 533 ; indéterminée 106 (plafond de 150 000 états) |
| Créature hors du morceau final au départ | 621 sur 1 000 (62,1 %) |

*Candidats* (1 000 tirages de la même façon, mais parmi les 536 compositions possibles, avant publication) :

| Motif | Candidats |
| --- | ---: |
| acceptés | 864 |
| paire refusée | 0 |
| place de la créature écartée en ordre libre (D-268) | 59 |
| pas de plan | 0 |
| pas de chemin sûr (palier ou atelier en chaîne, D-268) | 77 |
| non prouvée (plafond) | 0 |
| un seul des deux ordres prouvé | 0 |

*Plans* (14 §5.6) : 941 trouvés sur 941 cherchés, 2,05 ms en moyenne et 8,58 ms au plus par station, textes compris.

Lecture de D-241 :
- Les moyens qui comptent sont la planche de la passerelle (la créature tombe), la chambre froide bouclée et la baie, mais la baie est toujours dans le final et ne compte donc jamais.
- « Indéterminée » regroupe surtout les stations où la créature part du final, avec la passerelle ou la chambre froide avant : il faudrait l'en faire sortir puis l'attirer au piège. La recherche s'arrête au plafond avant de trancher.
- La part réelle est donc entre 36,1 % et 46,7 %.

Ces chiffres servent au porteur pour décider de la réserve de D-241 (créature plus souvent près du final) ; rien ne change au tirage.

**Contrôle des textes.** `check:texts` ajoute deux stations en ordre libre, une par final : `ol-m02-m08-m06-magasin` et `ol-m05-m10-m03-tri`. Elles couvrent le couloir, le sas, les cloisons, les commandes et le message d'IA Station ; aucune erreur.

**Empreinte** du carrefour (D-100) : `0ed685a51936e5`. Les dix morceaux gardent les leurs.

**Questions posées au porteur le 2026-10-16**, citées mot pour mot :

| Question | Réponse du porteur |
| --- | --- |
| **Q-197, D-270.** « Pour l'ordre libre, je propose : le vestibule donne sur un couloir ; deux ailes en partent, chacune avec son obstacle ; au fond de chaque aile, une commande lève un verrou. Les deux verrous sont sur deux cloisons l'une derrière l'autre, entre le couloir et le problème final. Une commande se manœuvre en une action, sans bruit ni dé. L'IA Station prévient en arrivant dans le couloir. Les deux cloisons appartiennent au couloir, ce qui laisse les morceaux finals inchangés. Cette conception vous convient-elle ? » | « Oui, on y va (Recommandé) » |
| **Q-198, D-270.** « Au tirage, les stations en ordre libre se mêleraient aux autres au pur hasard, comme aujourd'hui : environ une station sur trois serait en ordre libre (si toutes sont prouvées). Ça vous va ? » | « Au hasard, ~1 sur 3 (Recommandé) » |
| **Q-199, D-270.** « Pour « la créature peut être mise hors jeu ou enfermée avant le problème final », je compte seulement les manières sans dé ni blessure, sans entrer dans le morceau final. Ça vous va ? » | « Sans dé ni blessure (Recommandé) » |
| **Q-200, D-270.** « Comment voulez-vous que je travaille ensuite ? » | « En autonomie, puis PR (Recommandé) » |

### 7.9 « Plus aucune sortie » L6 (#156)

> **Statut :** proposé par la PR de #156 (zone orange), en attente de l'accord du porteur et d'une sortie perdue exprès sur téléphone (**validation humaine requise**, D-098). Règle et preuve fixées par D-275.

**Pourquoi la méthode a changé.** La méthode de §7.3 demandait de comparer le signal à la recherche complète, dés compris, sur tous les états atteints. Mesure du 2026-10-16 : 24 compositions publiées, une sur vingt, dépassent toutes 300 000 états avant la fin de cette recherche (12 à 22 s chacune), et la plus petite, `m07-m03-soute`, dépasse 1,5 million d'états sans finir dans 4 Go de mémoire. Sans créature ni dangers, `m01-m02-m03-reserve` compte encore 1 094 528 états (51 s). Posée au porteur, la question a reçu une autre réponse : le signal est une question de chemin (D-275).

**Calcul** (`engine/sortie.ts`, `sortiePossible`). Les pièces que le passager peut atteindre, de proche en proche, à partir de l'état réel : une porte fermée s'ouvre si on la manœuvre de ce côté ; un passage haut demande un appui qui peut être placé dessous ; un vide demande un pont posé ou à apporter de ce côté ; une cloison verrouillée s'ouvre si sa commande est dans une pièce atteinte ; un passage caché ne se franchit pas de son côté caché avant d'être découvert, et de l'autre côté l'ouvrir le découvre ; un objet large ne passe pas un passage étroit. Puis une capsule est-elle possible : son pupitre atteint, sa cabine close ou que l'on peut clore de l'intérieur, et de l'énergie (réserve, circuit activé ou console atteinte, source installée ou à apporter). Les dés, les blessures, la créature, le feu, le froid et le vide n'entrent pas dans le calcul. Un monde sans capsule à lancer, comme le monde de test, n'a jamais le signal. L'observation publique porte seulement `sansSortie` ; la situation lue par le lecteur d'écran et la CLI ajoute « Plus aucun chemin ne mène à une capsule de secours. ».

**Temps par action.** 3 à 4 µs par calcul sur le PC (moyenne de 20 000 calculs, au départ de `ol-m01-m08-m06-embarquement`, `m01-m02-m03-reserve` et `ol-m05-m09-m06-embarquement`), pour 14 à 21 µs pour toute l'observation. Mesure sur téléphone : **à faire par le porteur**.

**Preuve.** `npm run check:sortie`, dans `verify` et en quatre lots dans la CI : sur les six mondes de référence et les 464 compositions publiées, quatre parties au hasard de 80 actions au plus (sans se blesser tant qu'un autre geste l'évite) ; à chaque pas, en plus, chaque planche encore là supposée tombée dans chaque vide. Chaque état distinct est comparé à une recherche complète du vrai moteur, sur le même état sans créature, feu, froid, brèche ni blessure. Le signal ne doit jamais se retirer dans une partie. Résultat du 2026-10-16 : 470 stations, **60 640 états comparés, dont 9 175 avec le signal, 0 désaccord**, 159 s sur 16 processus. `tools/verifier-sortie.test.ts` garde un cas par obstacle, dans les deux sens, contre la même recherche : planche tombée ou laissée du mauvais côté (G-03), passage caché seul restant (G-04), créature tombée avec la planche (G-06), commande de cloison hors d'atteinte, passage haut sans appui, bloc trop large pour le seul passage vers la capsule ou déjà installé, feu et blessure grave sans signal.

**Écran** (12 §5.2). À la première action qui fait perdre la dernière sortie, l'information du jeu : « INFORMATION DU JEU », « PLUS AUCUNE SORTIE POSSIBLE. », « Plus aucun chemin ne mène à une capsule de secours. Vous pouvez continuer à jouer et explorer la station. », CONTINUER À JOUER, TERMINER LA PARTIE (un abandon) et « la partie s'arrête ici ». Ensuite, le rappel « [ plus aucune sortie possible ] » au-dessus du récit, jusqu'à la fin de la partie (D-144).

**Questions posées au porteur le 2026-10-16**, citées mot pour mot :

| Question | Réponse du porteur |
| --- | --- |
| **Q-201, D-275.** « Pour l'annonce « plus aucune sortie », l'issue demande de vérifier que le jeu ne se trompe jamais. […] La vérification « sur tout » n'est donc pas faisable telle quelle. Comment voulez-vous qu'on prouve que l'annonce ne se trompe jamais ? » | Réponse libre, citée dans D-275 |
| **Q-202, D-275.** « Oui, c'est possible et simple : un calcul de chemin […]. Arriver à la capsule ne suffit pas : elle doit aussi pouvoir partir […]. Et certains passages ne se ferment pas, mais tuent : le feu brûle à chaque action, le froid aussi. Que doit compter le calcul ? » | « chemin + capsule seulement. on laisse le joueur prendre des dégâts jusqu'a la mort, c'est plus intéressant que de lui couper l'herbe sous le pied » |
| **Q-203, D-275.** « Comment vérifier que ce calcul ne se trompe pas ? » | « Tests par obstacle + parties au hasard » |

### 7.10 Sas de sécurité M-11 (#203)

> **Statut :** proposé par la PR de #203 (zone orange : moteur, format des morceaux), en attente de l'accord du porteur et d'une partie au bout sur téléphone avec M-11 (**validation humaine requise**, D-098). Règles fixées par D-290 à D-293 ; fiche au §3.

**Moteur.** Deux qualités (C-02 §5) : `blindee` sur une liaison, que `forcable` (`engine/creature.ts`) écarte toujours ; `exige` sur une commande de déverrouillage, que `actionner` (`engine/actions.ts`) refuse sans l'objet en main (`sans_carte`), et que `sortiePossible` (`engine/sortie.ts`) ne compte que si l'objet est à portée. `validerMonde` refuse une porte blindée qui n'est pas une porte pleine, et un `exige` hors d'une commande ou vers un objet inconnu ou non portable.

**Catalogue** (`check:stations` du 2026-10-20, 8 processus, 449 s). 684 compositions, dont 600 publiées : 416 en chaîne et 184 en ordre libre (avant : 536, dont 464). 148 contiennent M-11 : 136 publiées ; les 12 autres placent la créature sur le palier de M-01 ou dans l'atelier de M-02 sans obstacle d'avant pour s'en débarrasser (D-268, D-293) : 4 écartées sans recherche en ordre libre, 6 sans sortie sûre, 2 non prouvées. Plans : 100 tirages sur 100 posés pour chaque chemin mesuré avec M-11.

**Plan.** Poste et vestiaire en haut, sas et remise dessous (tuile de 8 × 6) : seule forme essayée qui pose toutes les chaînes, y compris M-09 puis M-11 puis M-06.

**Ordre libre.** La porte blindée est verrouillée, mais ce n'est pas une cloison du carrefour : la preuve des deux ordres (§7.8) ne lit que les cloisons du carrefour (`cloisonsDuCarrefour`, `tools/verifier-station.ts`).

**Questions posées au porteur le 2026-10-20**, résumées ; les réponses sont citées mot pour mot :

| Question | Réponse du porteur |
| --- | --- |
| **Q-204, D-290.** Le sas de sécurité reste-t-il dans une station d'essai, ou entre-t-il aussi dans le tirage de NOUVELLE PARTIE ? | « Aussi dans le tirage public » |
| **Q-205, D-291.** Comment la carte ouvre-t-elle la porte blindée : un lecteur qui lève le verrou une fois pour toutes, ou autre chose ? | « Lecteur, une fois pour toutes » |
| **Q-206, D-293.** Où attend la créature dans ce morceau ? | « Pièce à part, fermée » |

### 7.11 Chariot et drone M-12 (#232)

**Conception retenue pour intégration, validation sur téléphone à venir.** La maquette V3 a permis d'essayer la coopération puis une panne récupérable. Elle ne prouve ni les réactions du vrai moteur, ni le passage des stations générées. L'intégration reprend la branche principale contenant M-11 et suit [17 — Ajouter un morceau](17-ajouter-un-morceau.md).

Questions consignées lors de l'intégration du 20 octobre, à partir des échanges des 19 et 20 octobre :

| Question | Choix du porteur | Décision |
| --- | --- | --- |
| Q-207 — Coopération nécessaire ou alternative consommant un objet utile ? | « Coopération nécessaire dans cette situation » | D-304 |
| Q-208 — Commander plus près ou explorer une panne réparable ? | « Explorer une panne réparable du drone » | D-305 |
| Q-209 — Remise en route sur place ou retour à l'atelier ? | « Remise en route sur place en deux gestes » | D-305 |
| Q-210 — Station d'essai seule ou aussi tirage public ? | « Station d'essai et tirage aléatoire dès cette PR » | D-307 |
| Q-211 — Autres causes de panne ou seulement la créature pour le premier lot ? | « Seule la créature fait dérailler le drone pour ce premier lot » | D-306 |

Le pictogramme de carte est une demande directe, accompagnée d'une référence visuelle, pas une question supplémentaire (D-307).

**Points de preuve avant publication :**

- états/empreintes et rejeux des anciens mondes préservés ; états du drone bornés dans la recherche ;
- vraie coopération, remise sur rail puis réarmement, sans faux signal de sortie perdue ;
- objets indispensables inclus dans l'élagage de `verifier-sortie`, commandes de carrefour seules comptées pour l'ordre libre ;
- place de créature et clés de textes sans collision avec M-03 et M-11 ; aucun état changeant ni solution révélée par une description statique ;
- liste publique régénérée et chaque composition publiée prouvée ; nombres dérivés des formules de [17 §4](17-ajouter-un-morceau.md#4-tests-qui-épinglent-des-nombres), pas d'une valeur reçue dans un test ;
- plan et pictogramme, parcours CLI public, contrôle des textes et vérification complète.

La preuve de jeu de chaque composition publiée (`check:stations`), le signal « plus aucune sortie » (`check:sortie`) et les mesures de plans sont attendus de la CI de la PR de #232, trop longs pour le PC du porteur : aucune preuve de catalogue M-12 n'est revendiquée avant ce résultat.

**Catalogue après M-12 (calculé, tests verts sur le PC ; preuve de jeu attendue de la CI).** Avec 10 chemins et 2 finals : 66 paires, 65 permises ; 850 compositions, 580 en chaîne (40 à un chemin, 540 à deux) et 270 en ordre libre. 754 publiées : 520 en chaîne, 234 en ordre libre ; 154 contiennent M-12 (104 en chaîne, 50 en ordre libre). Les non publiées le sont pour les raisons déjà en vigueur : paire M-03/M-06, créature qui bouche le seul passage sans obstacle qui permette de s'en débarrasser (D-268), places écartées en ordre libre. M-12 ne figure pas parmi les obstacles qui permettent de se débarrasser de la créature. La liste est régénérée depuis la règle de publication, puis vérifiée par le test qui la compare au catalogue.

**Coût mesuré sur le PC du porteur.** Prouver une station M-12 coûte plus cher qu'une autre : 2,3 à 4 s pour une chaîne qui commence par M-12, jusqu'à 20 s pour certains ordres libres (`ol-m11-m12-m06-embarquement`), contre moins d'une seconde pour la plupart des stations. Deux tests de `check-texts-stations` prouvent toute la liste contrôlée en 30 s : avec `ol-m11-m12-m06-stockage` (12,5 s) et `m08-m01-m06-palier` (20 à 35 s, déjà lourde sur `main`), le premier a pris 39 s en CI. La liste contrôlée garde la même couverture avec des compositions moins coûteuses : `ol-m05-m12-m03-tri` (1,1 s) pour M-12 en second, `m08-m01-m06-magasin` pour M-08 puis M-01, `m10-m01-m06-palier` pour la créature sur le palier de M-01. Sur le PC, les deux tests passent en 20 s. Les textes des stations M-12 contrôlées passent `check:texts` sans erreur. Le test du message chiffré prouve la première station contrôlée, la moins coûteuse, avec la même assertion.

**Poursuite après la rencontre (station d'essai, recherche exhaustive du 20 octobre).** Après avoir réveillé la créature dans la réserve, le chariot peut encore être rangé indemne (16 gestes), mais aucune évacuation n'est possible sans blessure : la créature alertée suit le passager jusqu'à l'embarquement. En acceptant les coups, une évacuation existe en 16 gestes, santé critique : fermer la réserve, envoyer le drone, rejoindre le palier par le poste, pousser, puis fuir vers la capsule. La rencontre se paie donc, comme le voulait la maquette ; à confirmer par le porteur.

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

**Forme retenue en L5** (§7.8, D-270) : le couloir et le sas forment un morceau à part, le carrefour, qui porte les deux cloisons ; la commande est posée dans la pièce de sortie de la branche.

**Preuves attendues en L5 :** pour chaque composition publiée, les deux ordres de préparation mènent à une évacuation sans dé ni blessure ; sans l'un ou l'autre des déverrouillages, aucune évacuation n'est possible, même avec des dés favorables. Les retours au couloir, les passages étroits, le port encombrant, les portes et la place unique de la créature font partie de ces preuves. Une paire permise en §4.1 n'est pas automatiquement utilisable en ordre libre. Aucun nouveau type de commande, effet ou état n'est implémenté par L0 ; le travail du moteur et du format reste en zone orange pour L5.

**Question :** « Pour les deux détours à faire dans l'ordre que vous voulez, je recommande une commande au fond de chacun : il faut les deux pour déverrouiller deux cloisons avant le dernier problème. Acceptez-vous cet ajout ? »

**Réponse du porteur :** « Oui, les deux commandes et cloisons ».

### 8.4 NOUVELLE PARTIE dans la version publique — Q-185, D-260

**Choix retenu :** à partir de L2, comme dans la version de test, NOUVELLE PARTIE tire une station parmi les compositions vérifiées disponibles ; REJOUER CETTE STATION garde le même départ avec de nouveaux dés. Les aventures de référence restent accessibles par un lien.

Le tirage suit D-253 : pile ou face entre les finals quand les deux sont disponibles, puis pur hasard parmi les compositions de ce final ; une station déjà jouée peut revenir. L2 ne livrant d'abord que M-03, elle ne peut tirer M-06 : seul le final disponible est alors utilisé, sans prétendre mesurer un équilibre à deux finals. Cette exception transitoire est acceptée par D-260 ; le pile ou face s'applique dès L3, lorsque les deux finals sont disponibles et vérifiés. Aucun effet rétroactif sur une partie en cours ni sur le bouton REPRENDRE.

**Question :** « Dans la version publique aussi, je recommande que NOUVELLE PARTIE tire une station, parmi celles déjà vérifiées, et que REJOUER garde la même. Au premier lot, seule l'énergie sera disponible, puis la baie s'ajoutera. Cela vous convient-il ? »

**Réponse du porteur :** « Oui, avec ce démarrage progressif ».
