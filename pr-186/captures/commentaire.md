<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-186/
Commit `fcf2d00`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-Regular.woff2 (service worker), IBMPlexMono-SemiBold.woff2 (service worker)



<details><summary>Texte affiché à chaque étape</summary>

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse : `?monde=ar-01`, partie neuve, joué geste par geste.



<details><summary>Texte affiché à chaque étape</summary>

</details>

### AR-02, parcours P-V1

**AR-02, parcours P-V1 : réussi.**
Adresse : `?monde=ar-02`, partie neuve, joué geste par geste.



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Carte (#97)

**Carte (#97) : réussi.**
AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).

<img src="https://greffeb.github.io/void-walker/pr-186/captures/01.png?v=fcf2d00" width="200" alt="Carte — départ d’AR-01"> <img src="https://greffeb.github.io/void-walker/pr-186/captures/02.png?v=fcf2d00" width="200" alt="Carte — au local énergie : pièces visitées, connues, panneau « ? »"> <img src="https://greffeb.github.io/void-walker/pr-186/captures/03.png?v=fcf2d00" width="200" alt="Carte — fiche de l’atelier : état vu, objets vus"> <img src="https://greffeb.github.io/void-walker/pr-186/captures/04.png?v=fcf2d00" width="200" alt="Carte — vue liste"> <img src="https://greffeb.github.io/void-walker/pr-186/captures/05.png?v=fcf2d00" width="200" alt="Carte — texte très grand"> <img src="https://greffeb.github.io/void-walker/pr-186/captures/06.png?v=fcf2d00" width="200" alt="Carte — départ d’AR-02 : voyants d’air">

<details><summary>Texte affiché à chaque étape</summary>

#### Carte — départ d’AR-01

_Récit : 15,2 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un salon de transit aux sièges alignés. Les flèches d’embarquement brillent en rouge au plafond.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### Carte — au local énergie : pièces visitées, connues, panneau « ? »

_Récit : 10,9 lignes visibles ; boutons du dock tous visibles._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — fiche de l’atelier : état vu, objets vus

_Récit : 10,9 lignes visibles ; boutons du dock tous visibles._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — vue liste

_Récit : 10,9 lignes visibles ; boutons du dock tous visibles._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — texte très grand

_Récit : 6,3 lignes visibles ; boutons du dock tous visibles._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — départ d’AR-02 : voyants d’air

_Récit : 15,2 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un couloir étroit, bordé de portes de cabines closes. Au-dessus de chaque porte étanche, un voyant dit s’il reste de l’air de l’autre côté.

```text
Vous êtes dans les cabines du personnel.
Vous voyez ici un terminal personnel et une signalétique d’évacuation.
La porte du local de sécurité est ouverte.
La porte de la salle panoramique est fermée.
Vous ne portez rien.
```

</details>

### Stations tirées (#152)

**Stations tirées (#152) : réussi.**
`?station=m07-m03-soute-2718281828` : réveil, plan au départ, NOUVELLE PARTIE garde la station. `?station=m08-m09-m06-embarquement-2718281828`, trois obstacles avec la baie (#153) : réveil, plan au départ. `?station=m08-m01-m06-palier-2718281828`, chemins d’AR-01 (#154) : réveil, plan au départ. Adresse nue : station tirée, REJOUER la garde, NOUVELLE PARTIE en tire une autre et mène au réveil, reprise sur sa station, `?monde=ar-01` à part. `?station=m07-m03-inconnue-1` : refusée avec son motif.



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. Puis la station à trois obstacles avec la baie, `m08-m09-m06-embarquement-2718281828` (#153). Puis les chemins d’AR-01 (#154), M-01, M-02, M-04 et M-05 : `m08-m01-m06-palier-2718281828`, `m04-m02-m03-atelier-2718281828`, `m05-m06-tri-2718281828`. Puis 6 stations tirées par groupe (#153), au hasard à graine fixe : final M-03 à un puis deux chemins, final M-06 à un puis deux chemins. À juger par le porteur avant fusion.



<details><summary>Texte affiché à chaque étape</summary>

</details>
