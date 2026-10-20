<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-233/
Commit `27d956f`

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



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Stations tirées (#152)

**Stations tirées (#152) : réussi.**
`?station=m07-m03-soute-2718281828` : réveil, plan au départ, NOUVELLE PARTIE garde la station. `?station=m08-m09-m06-embarquement-2718281828`, trois obstacles avec la baie (#153) : réveil, plan au départ. `?station=m08-m01-m06-palier-2718281828`, chemins d’AR-01 (#154) : réveil, plan au départ. Adresse nue : station tirée, REJOUER la garde, NOUVELLE PARTIE en tire une autre et mène au réveil, reprise sur sa station, `?monde=ar-01` à part. `?station=m07-m03-inconnue-1` : refusée avec son motif. `?monde=m-08`, planche perdue exprès (#156) : information « plus aucune sortie », puis le rappel, la partie continue.

<img src="https://greffeb.github.io/void-walker/pr-233/captures/01.png?v=27d956f" width="200" alt="M12 — drone renversé, réparation possible"> <img src="https://greffeb.github.io/void-walker/pr-233/captures/02.png?v=27d956f" width="200" alt="Carte — drone renversé observé au poste"> <img src="https://greffeb.github.io/void-walker/pr-233/captures/03.png?v=27d956f" width="200" alt="M12 — chariot rangé par le passager, coopération accomplie">

<details><summary>Texte affiché à chaque étape</summary>

#### M12 — drone renversé, réparation possible

_Récit : 12,6 lignes visibles ; boutons du dock tous visibles._

> Aller vers · poste de commande
> Vous passez par la porte du poste de commande. Vous voici dans le poste de commande.
> Vous n’étiez encore jamais venu ici.
> La chose est là, plus haute qu’un homme, la peau luisante. Pas d’yeux : une gueule qui hume l’air, des griffes au bout de longs bras. Elle vous a repéré. Vous avez un instant, pas plus.

```text
Vous êtes dans le poste de commande.
Vous voyez ici un drone de manutention et une poignée de frein.
La porte de l’atelier de manutention est ouverte.
La porte du palier du chariot est ouverte.
La porte de la réserve de manutention est ouverte.
Le drone de manutention est renversé hors du rail, moteur coupé, son voyant de sécurité allumé.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Carte — drone renversé observé au poste

_Récit : 12,6 lignes visibles ; boutons du dock tous visibles._

> Aller vers · poste de commande
> Vous passez par la porte du poste de commande. Vous voici dans le poste de commande.
> Vous n’étiez encore jamais venu ici.
> La chose est là, plus haute qu’un homme, la peau luisante. Pas d’yeux : une gueule qui hume l’air, des griffes au bout de longs bras. Elle vous a repéré. Vous avez un instant, pas plus.

```text
Vous êtes dans le poste de commande.
Vous voyez ici un drone de manutention et une poignée de frein.
La porte de l’atelier de manutention est ouverte.
La porte du palier du chariot est ouverte.
La porte de la réserve de manutention est ouverte.
Le drone de manutention est renversé hors du rail, moteur coupé, son voyant de sécurité allumé.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### M12 — chariot rangé par le passager, coopération accomplie

_Récit : 13,3 lignes visibles ; boutons du dock tous visibles._

> Chariot · Déplacer · dans son logement latéral
> Vous poussez le chariot dans son logement latéral. Il faut peser de tout votre poids.
> Quelque chose bouge derrière la porte du poste de commande.

```text
Vous êtes dans le palier du chariot.
Vous êtes grièvement blessé.
Vous voyez ici un chariot.
La porte de la galerie de service est ouverte.
La porte du poste de commande est ouverte.
La porte du quai de transfert est ouverte.
Le chariot est dans son logement latéral.
Vous ne portez rien.
```

</details>

### Écrans de fin (#208)

**Écrans de fin (#208) : réussi.**
Défaite par la créature jouée geste par geste dans `?monde=monde-test` : dernier texte et CONTINUER, l’écran de fin, la réouverture qui y ramène, REJOUER. Feu, froid et vide : la plus courte partie des bots morte de chaque cause, déposée dans la base de l’appli et reprise depuis l’accueil. Évacuations : fins de P-C (AR-01) et de P-V1 (AR-02) ci-dessus. **Validation humaine requise** sur téléphone, pour chaque fin.



<details><summary>Texte affiché à chaque étape</summary>

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. Puis la station à trois obstacles avec la baie, `m08-m09-m06-embarquement-2718281828` (#153). Puis les chemins d’AR-01 (#154), M-01, M-02, M-04 et M-05 : `m08-m01-m06-palier-2718281828`, `m04-m02-m03-atelier-2718281828`, `m05-m06-tri-2718281828`. Puis l’ordre libre, `ol-m07-m10-m03-soute-2718281828` (#155), le sas de sécurité M-11, `m11-m03-remise-2718281828` (#203), et le chariot avec son drone M-12, `m12-m03-stockage-2718281828` (#232). Puis 6 stations tirées par groupe (#153), au hasard à graine fixe : final M-03 à un puis deux chemins, final M-06 à un puis deux chemins. À juger par le porteur avant fusion.

<img src="https://greffeb.github.io/void-walker/pr-233/captures/04.png?v=27d956f" width="200" alt="Plan — chariot et drone m12-m03-stockage-2718281828">

<details><summary>Texte affiché à chaque étape</summary>

#### Plan — chariot et drone m12-m03-stockage-2718281828

> 

```text

```

</details>
