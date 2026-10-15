<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-160/
Commit `847e177`

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



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Stations tirées (#152)

**Stations tirées (#152) : réussi.**
`?station=m07-m03-soute-2718281828` : réveil, plan au départ, NOUVELLE PARTIE garde la station. Adresse nue : station tirée, REJOUER la garde, NOUVELLE PARTIE en tire une autre et mène au réveil, reprise sur sa station, `?monde=ar-01` à part. `?station=m07-m03-inconnue-1` : refusée avec son motif.

<img src="https://greffeb.github.io/void-walker/pr-160/captures/01.png?v=847e177" width="200" alt="Station tirée — réveil : m07-m03-soute-2718281828 par l’adresse"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/02.png?v=847e177" width="200" alt="Station tirée — plan au départ : m07-m03-soute-2718281828"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/03.png?v=847e177" width="200" alt="Station tirée — rejouer : même station m10-m03-entrepot-2334986022, nouveaux tirages"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/04.png?v=847e177" width="200" alt="Station tirée — nouvelle partie : m07-m03-reserve-1260152290 après m10-m03-entrepot-2334986022, écran de réveil"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/05.png?v=847e177" width="200" alt="Station refusée : motif à l’accueil, NOUVELLE PARTIE indisponible">

<details><summary>Texte affiché à chaque étape</summary>

#### Station tirée — réveil : m07-m03-soute-2718281828 par l’adresse

> Une secousse vous tire du sommeil. Vous êtes dans le vestibule, sous un éclairage rouge.
> « Évacuation conseillée. Une capsule de secours vous attend à bord ; merci de la rejoindre dans le calme. »

```text

```

#### Station tirée — plan au départ : m07-m03-soute-2718281828

_Récit : 19,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un vestibule étroit et nu, éclairé de veilleuses. Une seule porte, ordinaire, qui s’ouvre à la main.

```text
Vous êtes dans le vestibule.
Rien ne traîne ici.
La porte des quartiers de l’équipage est fermée.
Vous ne portez rien.
```

#### Station tirée — rejouer : même station m10-m03-entrepot-2334986022, nouveaux tirages

> Vous vous réveillez dans le vestibule, la nuque raide. Les lumières de service sont au rouge.
> « Évacuation conseillée. Une capsule de secours vous attend à bord ; merci de la rejoindre dans le calme. »

```text

```

#### Station tirée — nouvelle partie : m07-m03-reserve-1260152290 après m10-m03-entrepot-2334986022, écran de réveil

> Vous vous réveillez dans le vestibule, la nuque raide. Les lumières de service sont au rouge.
> « Évacuation conseillée. Une capsule de secours vous attend à bord ; merci de la rejoindre dans le calme. »

```text

```

#### Station refusée : motif à l’accueil, NOUVELLE PARTIE indisponible

> 

```text

```

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. Puis 6 stations tirées par chemin (#152), au hasard à graine fixe. À juger par le porteur avant fusion.

<img src="https://greffeb.github.io/void-walker/pr-160/captures/06.png?v=847e177" width="200" alt="Plan — m-07"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/07.png?v=847e177" width="200" alt="Plan — m-10"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/08.png?v=847e177" width="200" alt="Plan — station m07-m03-reserve-2693808113"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/09.png?v=847e177" width="200" alt="Plan — station m07-m03-soute-153480725"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/10.png?v=847e177" width="200" alt="Plan — station m07-m03-reserve-3310584432"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/11.png?v=847e177" width="200" alt="Plan — station m07-m03-soute-3324371142"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/12.png?v=847e177" width="200" alt="Plan — station m07-m03-reserve-2125315136"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/13.png?v=847e177" width="200" alt="Plan — station m07-m03-soute-4287806624"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/14.png?v=847e177" width="200" alt="Plan — station m10-m03-entrepot-5499962"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/15.png?v=847e177" width="200" alt="Plan — station m10-m03-reserve-3903474127"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/16.png?v=847e177" width="200" alt="Plan — station m10-m03-entrepot-1041286950"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/17.png?v=847e177" width="200" alt="Plan — station m10-m03-reserve-3085340724"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/18.png?v=847e177" width="200" alt="Plan — station m10-m03-entrepot-2336241852"> <img src="https://greffeb.github.io/void-walker/pr-160/captures/19.png?v=847e177" width="200" alt="Plan — station m10-m03-reserve-2561984136">

<details><summary>Texte affiché à chaque étape</summary>

#### Plan — m-07

> 

```text

```

#### Plan — m-10

> 

```text

```

#### Plan — station m07-m03-reserve-2693808113

> 

```text

```

#### Plan — station m07-m03-soute-153480725

> 

```text

```

#### Plan — station m07-m03-reserve-3310584432

> 

```text

```

#### Plan — station m07-m03-soute-3324371142

> 

```text

```

#### Plan — station m07-m03-reserve-2125315136

> 

```text

```

#### Plan — station m07-m03-soute-4287806624

> 

```text

```

#### Plan — station m10-m03-entrepot-5499962

> 

```text

```

#### Plan — station m10-m03-reserve-3903474127

> 

```text

```

#### Plan — station m10-m03-entrepot-1041286950

> 

```text

```

#### Plan — station m10-m03-reserve-3085340724

> 

```text

```

#### Plan — station m10-m03-entrepot-2336241852

> 

```text

```

#### Plan — station m10-m03-reserve-2561984136

> 

```text

```

</details>
