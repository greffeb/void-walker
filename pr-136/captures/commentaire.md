<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-136/
Commit `68f47d1`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)



<details><summary>Texte affiché à chaque étape</summary>

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse par défaut, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-136/captures/01.png?v=68f47d1" width="200" alt="AR-01 — Avant ouverture du panneau, local énergie"> <img src="https://greffeb.github.io/void-walker/pr-136/captures/02.png?v=68f47d1" width="200" alt="AR-01 — Sorties après le panneau, deux colonnes"> <img src="https://greffeb.github.io/void-walker/pr-136/captures/03.png?v=68f47d1" width="200" alt="AR-01 — Sorties après le panneau, texte très grand et dock défilant"> <img src="https://greffeb.github.io/void-walker/pr-136/captures/04.png?v=68f47d1" width="200" alt="AR-01 — Sorties après le panneau, très grand, dock défilé sur les déplacements">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Avant ouverture du panneau, local énergie

_Récit : 7,3 lignes visibles ; boutons du dock tous visibles._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous ne portez rien.
```

#### AR-01 — Sorties après le panneau, deux colonnes

_Récit : 6,2 lignes visibles ; boutons du dock tous visibles._

> Panneau · Ouvrir
> Vous ouvrez le panneau. Le passage est dégagé.
> Derrière le panneau s’ouvre un accès de service étroit, vers la salle d’embarquement ; sur un relevé fixé à l’entrée, le réseau d’urgence avait demandé le maintien de cet accès d’évacuation.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau de la salle d’embarquement est ouvert.
Vous ne portez rien.
```

#### AR-01 — Sorties après le panneau, texte très grand et dock défilant

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Panneau · Ouvrir
> Vous tirez sur la poignée du panneau. Le passage s’ouvre devant vous.
> Derrière le panneau, un accès de service étroit mène vers la salle d’embarquement ; un relevé y est fixé : le réseau d’urgence avait demandé de garder cet accès d’évacuation, que le confinement masquait.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau de la salle d’embarquement est ouvert.
Vous ne portez rien.
```

#### AR-01 — Sorties après le panneau, très grand, dock défilé sur les déplacements

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Panneau · Ouvrir
> Vous tirez sur la poignée du panneau. Le passage s’ouvre devant vous.
> Derrière le panneau, un accès de service étroit mène vers la salle d’embarquement ; un relevé y est fixé : le réseau d’urgence avait demandé de garder cet accès d’évacuation, que le confinement masquait.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau de la salle d’embarquement est ouvert.
Vous ne portez rien.
```

</details>

### AR-02, parcours P-V1

**AR-02, parcours P-V1 : réussi.**
Adresse : `?monde=ar-02`, partie neuve, joué geste par geste.



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Carte (#97)

**Carte (#97) : réussi.**
AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. À juger par le porteur avant fusion.



<details><summary>Texte affiché à chaque étape</summary>

</details>
