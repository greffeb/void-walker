# C-06 — Observation, carte et connaissances

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-082 ; assemble D-026, D-040, D-046, D-071, D-075 à D-077, D-080/D-081, C-01, C-03, C-04. Points OP-01 et OP-03 à OP-05 acceptés par D-080 ; OP-02 remplacé par D-081 ; OP-05 amendé par D-141 (ancienneté en mots).
> **Date :** 2026-10-10.
> **Implémentation et tests :** absents.

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

## 4. Menus, aperçus et risques

Les menus proposent des manipulations plausibles des éléments connus (D-026, C-01 §4). Aperçus et niveaux de risque se calculent **uniquement** à partir de ce que le passager sait (C-04 §4.3, D-071 VP-02) :

- un risque de fuite exposée n'est annoncé que pour une créature perçue ;
- l'aperçu d'une brèche nomme les pièces connues qui perdront l'air, pas l'effet sur une créature non perçue ;
- une raison d'indisponibilité ne révèle pas un secret (C-01 §4).

## 5. Ce qui n'est jamais montré

Position d'une créature non perçue ; accès caché non découvert ; état actuel d'une pièce hors de vue, hors systèmes renseignés ; résultat futur d'un dé ; effet secret d'une manipulation ; identifiants internes ou drapeaux. Les identifiants publics restent opaques (C-01 §3).

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
