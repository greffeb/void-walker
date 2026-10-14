# C-02 — Monde, lieux, liaisons et entités

> **Statut :** CONTRAT ACCEPTÉ v1.1 — D-082 ; assemble D-015, D-043/D-044, D-047, D-051, D-061, D-067, D-072/D-073, D-078 à D-080, AR-01 et AR-02. Points MP-01 à MP-03 acceptés par D-080. v1.1 : qualités et propriétés des morceaux du lancement (D-175).
> **Date :** 2026-10-10.
> **Implémentation et tests :** positions locales, qualités appui stable, soin, extinction adaptée et liquide glissant par dose, objets déplaçables non portables, dispositif fixe (avertisseur), liaison haute, foyer et sol glissant (§2, §4.3, §4.4, §5, W-01) dans le moteur depuis #102 ; sous-position « à bord », liaison sans signalétique ou cachée, manœuvre d'un seul côté, gabarit large, source d'énergie, capsule, console et pupitre (§2, §3, §4.3, §5, W-03) proposés par #103 ; liaison non étanche, vitrage extérieur, combinaison, découpeuse et rustine (AR-02) proposés par #104 ; encombrant (MP-03, W-02), pont fragile, salle des machines, gravité commutable et chambre froide (§5) proposés par #105 ; plan de pont des pièces et des liaisons (14 §4) proposé par #97, livraison 1.

## 1. But et portée

Décrire ce qui existe dans une partie et où, de façon assez précise pour qu'un agent n'invente ni lieu, ni capacité, ni état. Les références [AR-01](../08-aventure-reference.md) et [AR-02](../09-aventure-reference-vide.md) fournissent les cas concrets ; ce contrat en donne la forme commune.

Ce n'est pas un moteur physique universel. Les invariants d'identité et de conséquences de [C-05](C-05-monde-consequences.md) s'appliquent ; ce que le joueur en sait relève de [C-06](C-06-observation-connaissances.md).

## 2. Lieux et positions

- **Pièce :** unité de la carte (D-015). Pas de grille ni de distance au mètre.
- **Sous-position fermée :** espace rattaché à une pièce par une liaison, sans être une pièce d'exploration ; exemple : « à bord » de la capsule (AR-01 §4, AR-02 §4).
- **Position locale :** repère utile à une action ou à la vue, comme « seuil côté P », « alcôve », « bord sec », « sous la grille », « devant la baie ». Une pièce n'a que les positions dont ses actions ont besoin.
- **Séparation opaque interne :** coupe la vue entre positions d'une même pièce (paroi de l'alcôve, AR-01 §11.3).
- **Plan de pont (D-201, D-204) :** chaque pièce peut porter un rectangle en cases, chaque liaison une porte fixée ou le tracé d'un conduit, une pièce la mention « contre la coque » ; format et vérifieur en [14 §4](../14-carte.md). Les cases servent au dessin seulement : aucune grille ni distance n'est affichée (D-015), aucune règle ne lit le plan.

**MP-01 —** Se déplacer entre positions d'une même pièce fait partie de l'action qui en a besoin ; ce n'est pas une action séparée (AR-01 §11.3, C-03 §2).

## 3. Liaisons

Une liaison relie deux lieux : deux pièces, une pièce et une sous-position, ou une pièce et l'extérieur (baie). Elle a un seul état, vu des deux côtés.

| Propriété | Valeurs utilisées par les références | Source |
| --- | --- | --- |
| Nature | Cloison, porte étanche, grille, panneau, écoutille, baie extérieure | AR-01 §11.1, AR-02 §5.1 |
| État | Ouverte / fermée ; baie intacte / percée / rebouchée | AR-01, D-066 |
| Traversée | Passage du personnage quand ouverte, selon conditions (appui pour la grille) | AR-01 §11.1 |
| Gabarit | Normal ou étroit ; l'étroit refuse le bloc et la créature | D-043/D-044 |
| Son | Passe ou non ; grille fermée : passe | AR-01 §11.1, C-03 §4.1 |
| Feu | Conduit quand ouverte | C-03 §5.3 |
| Étanchéité | Étanche quand fermée, ou jamais étanche (grille, conduit) | D-061 |
| Bruit d'ouverture | Discret ou normal (porte grippée) | AR-01 P–O, AR-02 B–E |
| Manipulation | Côtés depuis lesquels on ouvre ou ferme | AR-01 §11.1 |
| Connaissance | Connue ou cachée jusqu'à découverte | AR-01 P–E, D-075 |

Les capacités sont portées par la liaison et lues par chaque règle (déplacement, son, feu, air) ; pas de graphe séparé par règle (C-03 §4.1). Une cloison fermée retient la créature dans les références (D-047).

## 4. Entités

### 4.1 Passager

Emplacement ; santé (C-04) ; objets portés ; combinaison portée ou non (D-072/D-073) ; connaissances (C-06) ; avertissement de premier contact déjà reçu ou non (C-03 §4.4).

### 4.2 Créature

Emplacement ; état actif, inerte ou expulsée (D-062) ; gabarit large ; réactions perdues restantes (C-03 §5.2) ; indices perçus non encore inspectés ; dangers connus (huile) ; premier contact déjà annoncé. Une créature inerte ou expulsée ne réagit plus jamais ; expulsée, elle n'a plus d'emplacement dans la station.

### 4.3 Objets

| Catégorie | Exemples | Ce qui est suivi |
| --- | --- | --- |
| Portable | Récipients d'eau et d'huile, soin, découpeuse, combinaison retirée | Identité, modèle, qualités, doses restantes, emplacement |
| Portable encombrant | Bloc d'énergie | Idem ; un seul porté à la fois (D-079) |
| Déplaçable non portable | Caisse | Position au sol |
| Dispositif fixe | Console, test d'avertisseur, casier, kit de rustine, capsule | États et cycles propres (alimentation, test en cours, contenu) |

Un récipient vidé reste un objet vide persistant (D-051). Un objet a toujours un seul emplacement : position dans une pièce, porté par le passager, rangé dans un dispositif, ou installé (bloc dans la capsule).

### 4.4 Effets posés dans le monde

Sol glissant à une position (AR-01) ; foyer et ses compteurs d'exposition par liaison (C-03 §5.3) ; brèche (AR-02). Ce sont des états du monde, pas des objets portables.

## 5. Qualités

Les règles lisent des qualités déclarées, jamais un nom ou un modèle (D-078). Qualités utilisées par les références :

| Qualité | Effet accepté | Porteur de référence |
| --- | --- | --- |
| Appui stable | Rend atteignable une liaison haute quand placé dessous | Caisse |
| Liquide glissant, par dose | Rend une position glissante (C-03 §5.2) ; l'huile d'AR-01 est en plus déclarée non inflammable (D-051) | Huile |
| Extinction adaptée, par dose | Éteint un foyer compatible à portée | Eau |
| Soin, par dose | Améliore d'un état (C-04) | Soin |
| Source d'énergie compatible | Alimente la capsule une fois installée | Bloc |
| Perce un vitrage extérieur | Crée une brèche, réussite sûre (D-064) | Découpeuse |
| Protection contre le vide | Protège entièrement quand portée (D-060) | Combinaison |
| Rebouche une brèche, par usage | Supprime la brèche (D-066/D-068) | Rustine |
| Encombrant | Un seul porté à la fois (D-079) | Bloc, planche |
| Gabarit large | Refusé par les liaisons étroites (D-043) | Bloc, créature |
| Pont fragile | Posé sur un vide, laisse passer le passager ; cède sous la créature et se perd (D-164) ; encombrant (D-169) | Planche |

Propriétés de pièce ajoutées par les morceaux du lancement (D-175) : pièce bruyante à machines commutables (D-163), gravité commutable (D-165), chambre froide (D-166). Les deux bords d'une salle coupée par un vide sont deux pièces reliées par le vide : le son passe, la vue non (D-236) ; sans porte, il ne se franchit que sur un pont posé (D-164). Que l'air ou le feu passent aussi le vide n'est pas décidé : dans le moteur, le vide est un passage toujours ouvert [détail de l'agent], et les mélanges de la passerelle avec le feu ou le vide restent refusés par l'assemblage (D-167, D-174). Interrupteurs des machines et de la gravité, pupitre de fermeture de la chambre froide : dispositifs fixes (D-168, D-173, D-238, D-239).

Une qualité absente de cette table n'existe pas encore. En ajouter une, ou combiner deux qualités sans règle acceptée (par exemple huile et feu, ou le vide de la passerelle avec la dépressurisation), demande une décision. Le vide et le feu ont leur règle depuis MX-02 (D-174).

## 6. Port et transferts

- Prendre, déposer, installer, enfiler, retirer : une action chacune (D-039).
- **MP-02 —** Tout objet porté peut être déposé à la position actuelle du passager, en une action ; il y reste.
- Un transfert refusé laisse l'objet à son origine, avec une raison publique (C-05 §4) : deuxième objet encombrant, gabarit trop large, destination invalide.
- **MP-03 —** Ramasser un objet encombrant alors qu'on en porte déjà un est refusé sans coût ; pas d'échange automatique.

## 7. Invariants

- Une entité a un seul emplacement à la fois ; aucune duplication ni disparition silencieuse.
- Une dose consommée ne revient pas ; rien ne se régénère seul.
- Une liaison a le même état des deux côtés.
- Une capacité est une donnée de la liaison ou de l'objet, pas un test sur le nom d'une pièce ou d'un modèle.
- Neutralisée, la créature ne redevient jamais active.

## 8. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| W-01 | Un autre objet « appui stable » placé sous la grille | Grille atteignable comme avec la caisse |
| W-02 | Ramasser un deuxième objet encombrant | Refus sans coût, les deux objets restent où ils étaient |
| W-03 | Bloc porté devant un conduit étroit | Refus de traversée, bloc toujours porté |
| W-04 | Déposer puis reprendre un récipient à moitié utilisé | Même instance, mêmes doses |
| W-05 | Fermer une cloison d'un côté | Fermée vu des deux côtés, pour son, feu, air et traversée |
| W-06 | Créature expulsée, sauvegarde reprise | Toujours sans emplacement, aucune réaction |

## 9. Réserves

Format des données, identifiants internes et outillage d'édition relèvent de l'architecture. Les variations générées (C-08) ne pourront utiliser que les lieux, liaisons et qualités de ce contrat ou d'une extension acceptée.
