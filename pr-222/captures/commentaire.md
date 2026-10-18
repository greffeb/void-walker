<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-222/
Commit `b774f4b`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-222/captures/01.png?v=b774f4b" width="200" alt="Fin : partie abandonnée (« très grande »)">

<details><summary>Texte affiché à chaque étape</summary>

#### Fin : partie abandonnée (« très grande »)

> Vous en restez là, dans la cabine.

```text

```

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse : `?monde=ar-01`, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-222/captures/02.png?v=b774f4b" width="200" alt="AR-01 — Écran de fin, avant : dernier texte, message de départ, CONTINUER"> <img src="https://greffeb.github.io/void-walker/pr-222/captures/03.png?v=b774f4b" width="200" alt="AR-01 — Écran de fin : évacuation (P-C)">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Écran de fin, avant : dernier texte, message de départ, CONTINUER

_Récit : 25,8 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station.
> « Alimentation confirmée. Écoutille fermée. Départ engagé. »

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de la salle d’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Écran de fin : évacuation (P-C)

> Vous vous êtes réveillé dans le salon de transit. Au pied de la cloison de la baie d’observation, quelque chose a glissé sur l’huile.
> Dans le local énergie, vous avez vu la créature pour la première fois. Vous avez installé le bloc d’énergie dans la capsule de secours.
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station. Vous partez indemne. Vous laissez la créature derrière vous.
> « Alimentation confirmée. Écoutille fermée. Départ engagé. »

```text

```

</details>

### AR-02, parcours P-V1

**AR-02, parcours P-V1 : réussi.**
Adresse : `?monde=ar-02`, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-222/captures/04.png?v=b774f4b" width="200" alt="AR-02 — Écran de fin : évacuation sur la réserve (P-V1)">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-02 — Écran de fin : évacuation sur la réserve (P-V1)

> Vous vous êtes réveillé dans les cabines du personnel. Vous avez enfilé la combinaison étanche.
> Vous avez percé la baie extérieure ; l’air a filé par la brèche. Dans la salle d’embarquement, le vide a figé la créature pour de bon.
> La capsule part sur sa propre réserve. Elle se détache du quai dans un choc sourd. Derrière le hublot, la station s’éloigne. Vous partez indemne.

```text

```

</details>

### Carte (#97)

**Carte (#97) : réussi.**
AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Stations tirées (#152)

**Stations tirées (#152) : réussi.**
`?station=m07-m03-soute-2718281828` : réveil, plan au départ, NOUVELLE PARTIE garde la station. `?station=m08-m09-m06-embarquement-2718281828`, trois obstacles avec la baie (#153) : réveil, plan au départ. `?station=m08-m01-m06-palier-2718281828`, chemins d’AR-01 (#154) : réveil, plan au départ. Adresse nue : station tirée, REJOUER la garde, NOUVELLE PARTIE en tire une autre et mène au réveil, reprise sur sa station, `?monde=ar-01` à part. `?station=m07-m03-inconnue-1` : refusée avec son motif. `?monde=m-08`, planche perdue exprès (#156) : information « plus aucune sortie », puis le rappel, la partie continue.



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Écrans de fin (#208)

**Écrans de fin (#208) : réussi.**
Défaite par la créature jouée geste par geste dans `?monde=monde-test` : dernier texte et CONTINUER, l’écran de fin, la réouverture qui y ramène, REJOUER. Feu, froid et vide : la plus courte partie des bots morte de chaque cause, déposée dans la base de l’appli et reprise depuis l’accueil. Évacuations : fins de P-C (AR-01) et de P-V1 (AR-02) ci-dessus. **Validation humaine requise** sur téléphone, pour chaque fin.

<img src="https://greffeb.github.io/void-walker/pr-222/captures/05.png?v=b774f4b" width="200" alt="Écran de fin, avant : dernier texte de la défaite et CONTINUER (monde de test)"> <img src="https://greffeb.github.io/void-walker/pr-222/captures/06.png?v=b774f4b" width="200" alt="Écran de fin : défaite, créature (monde de test)"> <img src="https://greffeb.github.io/void-walker/pr-222/captures/07.png?v=b774f4b" width="200" alt="Écran de fin : défaite, feu (m01-m05-m03-reserve-596135686)"> <img src="https://greffeb.github.io/void-walker/pr-222/captures/08.png?v=b774f4b" width="200" alt="Écran de fin : défaite, froid (m10-m05-m06-tri-3983954166)"> <img src="https://greffeb.github.io/void-walker/pr-222/captures/09.png?v=b774f4b" width="200" alt="Écran de fin : défaite, vide (ar-02)">

<details><summary>Texte affiché à chaque étape</summary>

#### Écran de fin, avant : dernier texte de la défaite et CONTINUER (monde de test)

_Récit : 25,8 lignes visibles ; boutons du dock tous visibles._

> Carnet · Prendre
> Vous ramassez le carnet. Vos mains tremblent un peu.
> Vous ne sentez presque pas le dernier coup. Le plancher vient à votre rencontre. La lumière de veille grésille encore, très loin.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
La créature est là, tout près de vous.
Vous portez le carnet.
Cette partie est terminée. Elle ne peut pas être reprise.
```

#### Écran de fin : défaite, créature (monde de test)

> Vous vous êtes réveillé dans la cabine. Vous y avez vu la créature pour la première fois.
> Elle vous y a blessé. Puis elle vous a grièvement blessé.
> Vous y êtes mort, sous ses griffes.

```text

```

#### Écran de fin : défaite, feu (m01-m05-m03-reserve-596135686)

> Vous vous êtes réveillé dans le vestibule. Dans le poste incendie, le feu vous a brûlé.
> Puis le feu vous a grièvement brûlé.
> Vous y êtes mort, pris par le feu.

```text

```

#### Écran de fin : défaite, froid (m10-m05-m06-tri-3983954166)

> Vous vous êtes réveillé dans le vestibule. Vous avez bouclé la chambre froide.
> Dans la chambre froide, le froid vous a blessé. Puis le froid vous a grièvement blessé.
> Vous y êtes mort, gagné par le froid.

```text

```

#### Écran de fin : défaite, vide (ar-02)

> Vous vous êtes réveillé dans les cabines du personnel. Vous avez percé la baie extérieure ; l’air a filé par la brèche.
> Vous êtes mort dans la salle panoramique, sans air, exposé au vide.

```text

```

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. Puis la station à trois obstacles avec la baie, `m08-m09-m06-embarquement-2718281828` (#153). Puis les chemins d’AR-01 (#154), M-01, M-02, M-04 et M-05 : `m08-m01-m06-palier-2718281828`, `m04-m02-m03-atelier-2718281828`, `m05-m06-tri-2718281828`. Puis 6 stations tirées par groupe (#153), au hasard à graine fixe : final M-03 à un puis deux chemins, final M-06 à un puis deux chemins. À juger par le porteur avant fusion.



<details><summary>Texte affiché à chaque étape</summary>

</details>
