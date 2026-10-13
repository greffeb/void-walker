<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-137/
Commit `bf840ad`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-137/captures/01.png?v=bf840ad" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/02.png?v=bf840ad" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/03.png?v=bf840ad" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/04.png?v=bf840ad" width="200" alt="Aperçu « Aller vers › atelier », risque connu, sans coût">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

_Récit : 17,7 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Ouvrir la porte de l’atelier

_Récit : 19,4 lignes visibles ; boutons du dock tous visibles._

> Porte de l’atelier · Ouvrir
> Vous tirez sur la poignée de la porte de l’atelier. Le passage s’ouvre devant vous.
> La porte de l’atelier a grincé si fort que le bruit a dû porter loin.
> Quelque chose bouge derrière la porte de l’atelier.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Aperçu « Aller vers › atelier »

_Récit : 19,4 lignes visibles ; boutons du dock tous visibles._

> Porte de l’atelier · Ouvrir
> Vous tirez sur la poignée de la porte de l’atelier. Le passage s’ouvre devant vous.
> La porte de l’atelier a grincé si fort que le bruit a dû porter loin.
> Quelque chose bouge derrière la porte de l’atelier.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Aperçu « Aller vers › atelier », risque connu, sans coût

_Récit : 17,7 lignes visibles ; boutons du dock tous visibles._

> Porte de l’atelier · Ouvrir
> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.
> Le mécanisme grippé a hurlé tout du long ; l’écho met longtemps à mourir.
> Derrière la porte de l’atelier, quelque chose de lourd se déplace.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous ne portez rien.
```

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse par défaut, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-137/captures/05.png?v=bf840ad" width="200" alt="AR-01 — Départ : IA Station nouvelle"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/06.png?v=bf840ad" width="200" alt="AR-01 — Fin : fenêtre d’IA Station, départ confirmé"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/07.png?v=bf840ad" width="200" alt="AR-01 — Départ, 412 × 915"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/08.png?v=bf840ad" width="200" alt="AR-01 — Départ, 320 × 568"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/09.png?v=bf840ad" width="200" alt="AR-01 — Départ en « très grande », 320 × 568">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Départ : IA Station nouvelle

_Récit : 16,9 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un salon de transit aux sièges alignés. Les flèches d’embarquement brillent en rouge au plafond.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Fin : fenêtre d’IA Station, départ confirmé

_Récit : 23,2 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de la salle d’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Départ, 412 × 915

_Récit : 19,5 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un salon de transit aux sièges alignés. Les flèches d’embarquement brillent en rouge au plafond.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Départ, 320 × 568

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Regarder autour de vous
> Un salon de transit aux sièges alignés. Les flèches d’embarquement brillent en rouge au plafond.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Départ en « très grande », 320 × 568

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Regarder autour de vous
> Un salon de transit aux sièges alignés. Les flèches d’embarquement brillent en rouge au plafond.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

</details>

### AR-02, parcours P-V1

**AR-02, parcours P-V1 : réussi.**
Adresse : `?monde=ar-02`, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-137/captures/10.png?v=bf840ad" width="200" alt="AR-02 — Départ">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-02 — Départ

_Récit : 16,9 lignes visibles ; boutons du dock tous visibles._

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

### Carte (#97)

**Carte (#97) : réussi.**
AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).

<img src="https://greffeb.github.io/void-walker/pr-137/captures/11.png?v=bf840ad" width="200" alt="Carte — départ d’AR-01"> <img src="https://greffeb.github.io/void-walker/pr-137/captures/12.png?v=bf840ad" width="200" alt="Carte — départ d’AR-02 : voyants d’air">

<details><summary>Texte affiché à chaque étape</summary>

#### Carte — départ d’AR-01

_Récit : 16,9 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Des sièges de transit vissés en rangs, tous vides. Au plafond, les flèches d’embarquement sont rouges.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### Carte — départ d’AR-02 : voyants d’air

_Récit : 16,9 lignes visibles ; boutons du dock tous visibles._

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

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. À juger par le porteur avant fusion.



<details><summary>Texte affiché à chaque étape</summary>

</details>
