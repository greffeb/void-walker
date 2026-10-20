# C-06 — Observation, carte et connaissances

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-082 ; assemble D-026, D-040, D-046, D-071, D-075 à D-077, D-080/D-081, C-01, C-03, C-04. Points OP-01 et OP-03 à OP-05 acceptés par D-080 ; OP-02 remplacé par D-081 ; OP-05 amendé par D-141 (ancienneté en mots) ; §4 complété par D-180 et D-181 (aperçu d'un déplacement vers la créature) ; §3 amendé par D-201, D-202 et D-213 (carte en plan de pont, pièces connues dessinées, mémoire), détaillé dans [14 — carte](../14-carte.md) ; §5 précisé par D-323 pour les documents des grandes stations (note de rangement, passage caché à mots couverts).
> **Date :** 2026-10-11.
> **Implémentation et tests :** partiels — vue dans la même pièce, bruits (OP-01) et aperçus D-180/D-181 (PR #112) ; destination inconnue d'un accès sans signalétique, passage caché (OP-03, K-05) et messages prévus de l'assistance (D-081) fusionnés par #103 ; historique d'IA Station, avec le moment de chaque message, proposé par #98 ; voyants d'air des portes et aperçu de l'air perdu ou revenu (AR-02) proposés par #104 ; mémoire du passager et carte publique (K-01, K-02, K-05, K-07 en CLI, K-08 à K-13 de 14 §3.6) proposées par #97, livraison 2 ; écran de la carte proposé par #97, livraison 3, à valider sur téléphone ; documents des grandes stations, dont les notes de rangement, proposés par #209, livraison 3 ([13 §7.14](../13-morceaux-lancement.md#714-grandes-stations-livraison-3-209)).

## 1. But

Fixer ce que le passager sait, comment il l'apprend et ce qui ne lui est jamais montré. [C-01](C-01-actions-observation.md) pose le principe d'une observation publique unique ; ce contrat en détaille le contenu.

La même observation sert la PWA, la CLI, les bots et le joueur LLM externe. Seul le solveur lit l'état complet, dans son propre processus.

## 2. Sources de connaissance

| Source | Ce qu'elle apprend | Source |
| --- | --- | --- |
| Vue directe | Pièce actuelle : éléments perceptibles, positions, état des liaisons visibles ; créature si même pièce sans séparation opaque | C-03 §4.1, AR-01 §11.3 |
| Bruits | Sons d'équipements et de manipulations ; créature qui bouge dans une pièce voisine, situés par le passage | D-077 |
| Signalétique | Noms affichés (pièces, équipements, avertissements) | AR-01 §11.4 |
| Voyants des portes | Présence d'air de l'autre côté d'une porte étanche | D-071 VP-03 |
| Assistance | Messages aux moments prévus, relisibles, exacts sur les systèmes ; aucune réponse à une demande d'état | D-037/D-046/D-081 |
| Découverte | Contenu révélé par une manipulation (panneau, passage) | C-05 §6 |
| Contact | Premier contact annoncé, puis créature vue | C-03 §4.4 |

**OP-01 — Bruits.** Le passager entend ce qui se produit dans sa pièce, et dans une pièce voisine reliée par une liaison qui laisse passer le son : porte ouverte, ou grille même fermée. Le message nomme le passage (« derrière la porte de l'observation »), jamais une position. Rien au-delà de la pièce voisine. Une créature immobile ou neutralisée ne fait pas de bruit.

**Assistance (D-081).** Elle parle seulement aux moments prévus, avec d'éventuels choix prédéfinis ; ses messages restent relisibles. Elle ne répond à aucune demande d'état, ne suit pas la créature après ses alertes et ne révèle pas les accès cachés.

## 3. Carte

- Une pièce apparaît sur la carte quand le passager y est entré (D-075).
- **OP-03 —** Depuis une pièce visitée, chaque sortie vue apparaît comme un passage. Une porte normale porte le nom de sa destination par la signalétique ; cette destination reste non dessinée tant qu'elle n'est pas visitée. Un accès sans signalétique (conduit, passage découvert) n'affiche pas sa destination tant qu'elle n'est pas découverte, en le franchissant ou parce que ce qui est révélé l'indique (AR-01 §11.1).
- Hors de vue, une pièce garde le dernier état vu (D-076) : objets, liaisons, foyer.
- **OP-04 —** L'air des pièces connues, lu sur les voyants des portes étanches, est affiché à jour (D-071, D-081).
- **OP-05 —** Le dernier endroit où la créature a été vue est marqué, avec l'ancienneté dite en mots (« à l'instant », « il y a un moment », « il y a longtemps »), sans nombre d'actions (D-141). Un bruit entendu n'ajoute aucun marqueur de position.

**Amendements du 2026-10-12** ([14 — carte](../14-carte.md) §2 et §3) :

- La carte est un plan de pont : pièces à leur taille, murs communs, portes en ouvertures (D-201).
- OP-03 : la destination nommée d'une porte signalée, vue depuis une pièce visitée, est dessinée en pointillé avec son nom, sans être visitée (D-202). Un accès sans signalétique ne fait toujours pas connaître sa destination.
- Le dernier état vu de chaque pièce (feu, objets, portes, moment du regard) fait partie de l'état sauvegardé ; il se met à jour dans la pièce actuelle et, pour le feu, à travers une porte ouverte (D-213).
- L'observation porte une carte publique limitée à ce que le passager sait, géométrie comprise : la forme d'une pièce inconnue n'y figure jamais (D-213, K-13 de 14 §3.6).

## 4. Menus, aperçus et risques

Les menus proposent des manipulations plausibles des éléments connus (D-026, C-01 §4). Aperçus et niveaux de risque se calculent **uniquement** à partir de ce que le passager sait (C-04 §4.3, D-071 VP-02) :

- un risque de fuite exposée n'est annoncé que pour une créature perçue ;
- aller ou ouvrir vers la pièce où le passager a vu la créature en dernier s'annonce **élevé** si c'était à l'instant ou il y a un moment, **modéré** si c'était il y a longtemps (D-180, seuils de D-151) ; vers celle d'où venait le dernier bruit de la créature, **modéré**, situé par le passage (D-181). Dernière vue et dernier bruit sont gardés à part ; chacun s'efface quand le passager voit cette pièce vide, et voir la créature fait oublier le bruit ;
- l'aperçu d'une brèche nomme les pièces connues qui perdront l'air, pas l'effet sur une créature non perçue ;
- une raison d'indisponibilité ne révèle pas un secret (C-01 §4).

## 5. Ce qui n'est jamais montré

Position d'une créature non perçue ; accès caché non découvert ; état actuel d'une pièce hors de vue, hors systèmes renseignés ; résultat futur d'un dé ; effet secret d'une manipulation ; identifiants internes ou drapeaux. Les identifiants publics restent opaques (C-01 §3).

**Exceptions des documents des grandes stations (D-323).** Un document à lire raconte la parole d'un équipier, non l'état présent de la station :
- **La note de rangement** nomme une pièce hors de vue et ce qu'elle contient, la clé qu'on y a rangée. La pièce est remplie à l'assemblage avec la vraie pièce, lettre comprise : la note est vraie au départ, par construction. Elle ne dit rien de l'état de cette pièce depuis, et sa lecture n'ajoute rien à la carte ni à ce que sait le passager : aucune pièce connue ou dessinée, aucune connaissance (C-07 §6).
- **Un indice à mots couverts** sur un passage caché peut figurer dans le morceau qui le porte (à ce jour, le témoignage de M-05) ; le passage reste à découvrir par la manipulation.

Aucun document ne dit où est une créature non perçue.

## 6. Mémoire et reprise

Ce que le passager a vu, entendu et découvert fait partie de l'état sauvegardé. Une reprise restitue la même carte, les mêmes derniers états vus et les mêmes messages. Rien ne change pendant la fermeture : le temps métier n'avance qu'aux actions (D-014).

## 7. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| K-01 | Début d'AR-01 | Carte : seulement le salon de transit et ses sorties vues |
| K-02 | Le feu gagne une pièce déjà visitée hors de vue | La carte montre l'ancien état jusqu'au prochain regard |
| K-03 | Créature qui bouge derrière une porte ouverte voisine | Bruit situé par cette porte, sans marqueur de position |
| K-04 | Même chose, porte fermée | Aucun bruit |
| K-05 | Deux mondes identiques sauf un passage caché | Mêmes carte, menus et messages avant découverte |
| K-06 | Ouvrir l'interface de l'assistance hors d'un moment prévu | Seulement les messages déjà reçus, aucune réponse d'état |
| K-07 | PWA et CLI sur le même état | Même observation, même texte de fond |
| K-08 | Reprise après fermeture | Même carte et mêmes derniers états vus |

## 8. Réserves

Forme visuelle de la carte, textes, icônes et accessibilité relèvent de la maquette et de C-07. Le format de transport de l'observation relève de l'architecture.
