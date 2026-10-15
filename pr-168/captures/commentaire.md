<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-168/
Commit `6491f29`

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
`?station=m07-m03-soute-2718281828` : réveil, plan au départ, NOUVELLE PARTIE garde la station. `?station=m08-m09-m06-embarquement-2718281828`, trois obstacles avec la baie (#153) : réveil, plan au départ. Adresse nue : station tirée, REJOUER la garde, NOUVELLE PARTIE en tire une autre et mène au réveil, reprise sur sa station, `?monde=ar-01` à part. `?station=m07-m03-inconnue-1` : refusée avec son motif.

<img src="https://greffeb.github.io/void-walker/pr-168/captures/01.png?v=6491f29" width="200" alt="Station tirée — réveil : m08-m09-m06-embarquement-2718281828 par l’adresse"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/02.png?v=6491f29" width="200" alt="Station tirée — plan au départ : m08-m09-m06-embarquement-2718281828">

<details><summary>Texte affiché à chaque étape</summary>

#### Station tirée — réveil : m08-m09-m06-embarquement-2718281828 par l’adresse

> Vous vous réveillez dans le vestibule, la nuque raide. Les lumières de service sont au rouge.
> « Évacuation conseillée. Une capsule de secours vous attend à bord ; merci de la rejoindre dans le calme. »

```text

```

#### Station tirée — plan au départ : m08-m09-m06-embarquement-2718281828

_Récit : 19,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un vestibule étroit et nu, éclairé de veilleuses. Une seule porte, ordinaire, qui s’ouvre à la main.

```text
Vous êtes dans le vestibule.
Rien ne traîne ici.
La porte des quartiers de l’équipage A est fermée.
Vous ne portez rien.
```

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. Puis la station à trois obstacles avec la baie, `m08-m09-m06-embarquement-2718281828` (#153). Puis 6 stations tirées par groupe (#153), au hasard à graine fixe : final M-03 à un puis deux chemins, final M-06 à un puis deux chemins. À juger par le porteur avant fusion.

<img src="https://greffeb.github.io/void-walker/pr-168/captures/03.png?v=6491f29" width="200" alt="Plan — station à trois obstacles avec la baie m08-m09-m06-embarquement-2718281828"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/04.png?v=6491f29" width="200" alt="Plan — station m07-m03-soute-153480725"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/05.png?v=6491f29" width="200" alt="Plan — station m07-m03-reserve-3324371142"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/06.png?v=6491f29" width="200" alt="Plan — station m07-m03-reserve-4287806624"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/07.png?v=6491f29" width="200" alt="Plan — station m08-m03-magasin-3903474127"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/08.png?v=6491f29" width="200" alt="Plan — station m10-m03-entrepot-3085340724"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/09.png?v=6491f29" width="200" alt="Plan — station m09-m03-cale-2561984136"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/10.png?v=6491f29" width="200" alt="Plan — station m07-m10-m03-reserve-1638218205"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/11.png?v=6491f29" width="200" alt="Plan — station m08-m10-m03-entrepot-3238780293"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/12.png?v=6491f29" width="200" alt="Plan — station m07-m10-m03-reserve-3589933839"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/13.png?v=6491f29" width="200" alt="Plan — station m09-m10-m03-cale-964814693"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/14.png?v=6491f29" width="200" alt="Plan — station m08-m10-m03-entrepot-1677363388"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/15.png?v=6491f29" width="200" alt="Plan — station m07-m08-m03-reserve-2163627620"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/16.png?v=6491f29" width="200" alt="Plan — station m09-m06-embarquement-2743013245"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/17.png?v=6491f29" width="200" alt="Plan — station m09-m06-embarquement-587356569"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/18.png?v=6491f29" width="200" alt="Plan — station m07-m06-embarquement-4101260484"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/19.png?v=6491f29" width="200" alt="Plan — station m07-m06-soute-3686510202"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/20.png?v=6491f29" width="200" alt="Plan — station m09-m06-cale-395500186"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/21.png?v=6491f29" width="200" alt="Plan — station m07-m06-soute-1987621361"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/22.png?v=6491f29" width="200" alt="Plan — station m09-m10-m06-embarquement-1193124495"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/23.png?v=6491f29" width="200" alt="Plan — station m07-m09-m06-soute-1627563425"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/24.png?v=6491f29" width="200" alt="Plan — station m09-m10-m06-entrepot-516184640"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/25.png?v=6491f29" width="200" alt="Plan — station m10-m09-m06-entrepot-207826972"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/26.png?v=6491f29" width="200" alt="Plan — station m09-m07-m06-cale-1557217872"> <img src="https://greffeb.github.io/void-walker/pr-168/captures/27.png?v=6491f29" width="200" alt="Plan — station m09-m08-m06-magasin-770728849">

<details><summary>Texte affiché à chaque étape</summary>

#### Plan — station à trois obstacles avec la baie m08-m09-m06-embarquement-2718281828

> 

```text

```

#### Plan — station m07-m03-soute-153480725

> 

```text

```

#### Plan — station m07-m03-reserve-3324371142

> 

```text

```

#### Plan — station m07-m03-reserve-4287806624

> 

```text

```

#### Plan — station m08-m03-magasin-3903474127

> 

```text

```

#### Plan — station m10-m03-entrepot-3085340724

> 

```text

```

#### Plan — station m09-m03-cale-2561984136

> 

```text

```

#### Plan — station m07-m10-m03-reserve-1638218205

> 

```text

```

#### Plan — station m08-m10-m03-entrepot-3238780293

> 

```text

```

#### Plan — station m07-m10-m03-reserve-3589933839

> 

```text

```

#### Plan — station m09-m10-m03-cale-964814693

> 

```text

```

#### Plan — station m08-m10-m03-entrepot-1677363388

> 

```text

```

#### Plan — station m07-m08-m03-reserve-2163627620

> 

```text

```

#### Plan — station m09-m06-embarquement-2743013245

> 

```text

```

#### Plan — station m09-m06-embarquement-587356569

> 

```text

```

#### Plan — station m07-m06-embarquement-4101260484

> 

```text

```

#### Plan — station m07-m06-soute-3686510202

> 

```text

```

#### Plan — station m09-m06-cale-395500186

> 

```text

```

#### Plan — station m07-m06-soute-1987621361

> 

```text

```

#### Plan — station m09-m10-m06-embarquement-1193124495

> 

```text

```

#### Plan — station m07-m09-m06-soute-1627563425

> 

```text

```

#### Plan — station m09-m10-m06-entrepot-516184640

> 

```text

```

#### Plan — station m10-m09-m06-entrepot-207826972

> 

```text

```

#### Plan — station m09-m07-m06-cale-1557217872

> 

```text

```

#### Plan — station m09-m08-m06-magasin-770728849

> 

```text

```

</details>
