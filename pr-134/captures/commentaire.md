<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-134/
Commit `da181e6`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-134/captures/01.png?v=da181e6" width="200" alt="Fenêtre d’IA Station en « très grande »">

<details><summary>Texte affiché à chaque étape</summary>

#### Fenêtre d’IA Station en « très grande »

_Récit : 10,5 lignes visibles ; boutons du dock tous visibles._

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

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse par défaut, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-134/captures/02.png?v=da181e6" width="200" alt="AR-01 — Fenêtre d’IA Station : deux messages nouveaux">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Fenêtre d’IA Station : deux messages nouveaux

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

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
Vous portez la burette d’huile.
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
