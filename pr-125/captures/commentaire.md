<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-125/
Commit `781d9bb`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-Regular.woff2 (service worker), IBMPlexMono-SemiBold.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-125/captures/01.png?v=781d9bb" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/02.png?v=781d9bb" width="200" alt="Bulle « Carnet » ouverte"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/03.png?v=781d9bb" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/04.png?v=781d9bb" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir »"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/05.png?v=781d9bb" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/06.png?v=781d9bb" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/07.png?v=781d9bb" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/08.png?v=781d9bb" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/09.png?v=781d9bb" width="200" alt="Inventaire ouvert"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/10.png?v=781d9bb" width="200" alt="Inventaire, fiche « Carnet »"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/11.png?v=781d9bb" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/12.png?v=781d9bb" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/13.png?v=781d9bb" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/14.png?v=781d9bb" width="200" alt="« → soute » d’un seul toucher, touché deux fois : un seul déplacement"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/15.png?v=781d9bb" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », sans risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/16.png?v=781d9bb" width="200" alt="Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/17.png?v=781d9bb" width="200" alt="Aperçu « Aller vers › atelier », risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/18.png?v=781d9bb" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/19.png?v=781d9bb" width="200" alt="Machine à écrire, 0 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/20.png?v=781d9bb" width="200" alt="Machine à écrire, 125 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/21.png?v=781d9bb" width="200" alt="Machine à écrire, 250 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/22.png?v=781d9bb" width="200" alt="Machine à écrire, 375 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/23.png?v=781d9bb" width="200" alt="Machine à écrire, 600 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/24.png?v=781d9bb" width="200" alt="Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier (tout le texte à 22 px)"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/25.png?v=781d9bb" width="200" alt="Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/26.png?v=781d9bb" width="200" alt="Départ, bulle « Porte de l’atelier », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/27.png?v=781d9bb" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/28.png?v=781d9bb" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Bulle « Carnet » ouverte

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

_Récit : 13,7 lignes visibles ; boutons du dock tous visibles._

> Carnet · Prendre
> Vous prenez le carnet. Le contact est froid sous vos doigts.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Aperçu « Porte de l’atelier › Ouvrir »

_Récit : 13,7 lignes visibles ; boutons du dock tous visibles._

> Carnet · Prendre
> Vous prenez le carnet. Le contact est froid sous vos doigts.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

_Récit : 14,2 lignes visibles ; boutons du dock tous visibles._

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

#### Après fermeture et réouverture

_Récit : 14,2 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 14,2 lignes visibles ; boutons du dock tous visibles._

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

#### Aller dans l’atelier

_Récit : 12,4 lignes visibles ; boutons du dock tous visibles._

> Aller vers · atelier
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.
> Une silhouette se déplie devant vous, plus haute qu’un homme, la peau luisante. Une tête sans yeux se tourne vers vous et s’immobilise. Elle vous a repéré. Il vous reste un instant pour réagir.

```text
Vous êtes dans l’atelier.
Vous voyez ici une trousse de soin.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Inventaire ouvert

_Récit : 12,4 lignes visibles ; boutons du dock tous visibles._

> Aller vers · atelier
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.
> Une silhouette se déplie devant vous, plus haute qu’un homme, la peau luisante. Une tête sans yeux se tourne vers vous et s’immobilise. Elle vous a repéré. Il vous reste un instant pour réagir.

```text
Vous êtes dans l’atelier.
Vous voyez ici une trousse de soin.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Inventaire, fiche « Carnet »

_Récit : 12,4 lignes visibles ; boutons du dock tous visibles._

> Aller vers · atelier
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.
> Une silhouette se déplie devant vous, plus haute qu’un homme, la peau luisante. Une tête sans yeux se tourne vers vous et s’immobilise. Elle vous a repéré. Il vous reste un instant pour réagir.

```text
Vous êtes dans l’atelier.
Vous voyez ici une trousse de soin.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Poser le carnet

_Récit : 12,4 lignes visibles ; boutons du dock tous visibles._

> Carnet · Poser
> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.
> La créature se jette sur vous ; vous vous dérobez de justesse.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet et une trousse de soin.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Hors ligne : reprise, police servie par l’appli

_Récit : 12,4 lignes visibles ; boutons du dock tous visibles._

> Carnet · Poser
> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.
> La créature se jette sur vous ; vous vous dérobez de justesse.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet et une trousse de soin.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Fin du parcours, 320 px de large

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Carnet · Poser
> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.
> La créature se jette sur vous ; vous vous dérobez de justesse.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet et une trousse de soin.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### « → soute » d’un seul toucher, touché deux fois : un seul déplacement

_Récit : 14,7 lignes visibles ; boutons du dock tous visibles._

> Aller vers · soute
> Vous franchissez le seuil et entrez dans la soute. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

```text
Vous êtes dans la soute.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la cabine est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », sans risque connu, avec un coût

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Aller vers › atelier », risque connu, sans coût

_Récit : 11,9 lignes visibles ; boutons du dock tous visibles._

> Porte de l’atelier · Ouvrir
> Vous tirez sur la poignée de la porte de l’atelier. Le passage s’ouvre devant vous.
> La porte de l’atelier a grincé si fort que le bruit a dû porter loin.
> Quelque chose bouge derrière la porte de l’atelier.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », risque connu, avec un coût

_Récit : 13,7 lignes visibles ; boutons du dock tous visibles._

> Porte de l’atelier · Fermer
> Vous fermez la porte de l’atelier. Le joint se plaque contre le cadre avec un bruit mat.
> La créature se jette sur vous ; vous vous dérobez de justesse.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Machine à écrire, 0 ms après le toucher

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 125 ms après le toucher

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 250 ms après le toucher

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 375 ms après le toucher

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 600 ms après le toucher

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier (tout le texte à 22 px)

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe

_Récit : 11,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Départ, bulle « Porte de l’atelier », 320 px de large

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px de large

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse par défaut, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-125/captures/29.png?v=781d9bb" width="200" alt="AR-01 — Départ : parole d’IA Station, pastille sur IA STATION"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/30.png?v=781d9bb" width="200" alt="AR-01 — Bulle « Caisse », étape « OÙ ? »"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/31.png?v=781d9bb" width="200" alt="AR-01 — Par « → grille » : « Aller vers · local énergie », lien d’IA Station"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/32.png?v=781d9bb" width="200" alt="AR-01 — Fenêtre d’IA Station : deux messages nouveaux"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/33.png?v=781d9bb" width="200" alt="AR-01 — Fenêtre d’IA Station après reprise : messages lus"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/34.png?v=781d9bb" width="200" alt="AR-01 — Aperçu « Burette d’huile › Verser › Cloison de la salle d’observation »"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/35.png?v=781d9bb" width="200" alt="AR-01 — Ouvrir la cloison de la salle d’observation : créature à terre"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/36.png?v=781d9bb" width="200" alt="AR-01 — Installer le bloc d’énergie dans la capsule"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/37.png?v=781d9bb" width="200" alt="AR-01 — Fin : « La capsule s’est détachée. Vous avez quitté la station. », NOUVELLE PARTIE"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/38.png?v=781d9bb" width="200" alt="AR-01 — Fin : fenêtre d’IA Station, départ confirmé"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/39.png?v=781d9bb" width="200" alt="AR-01 — Départ, 412 × 915"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/40.png?v=781d9bb" width="200" alt="AR-01 — Départ, 320 × 568"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/41.png?v=781d9bb" width="200" alt="AR-01 — Bulle « Caisse », étape « OÙ ? », 320 px de large">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Départ : parole d’IA Station, pastille sur IA STATION

_Récit : 10,5 lignes visibles ; boutons du dock tous visibles._

> Vous vous réveillez d’un coup, sanglé à votre siège, dans le salon de transit. Les flèches d’embarquement brillent en rouge. Votre terminal de transit affiche : CONFINEMENT EN COURS.
> « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier de service est ouverte.
La cloison de la galerie technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Bulle « Caisse », étape « OÙ ? »

_Récit : 12,8 lignes visibles ; boutons du dock tous visibles._

> Burette d’huile · Prendre
> Vous ramassez la burette d’huile. Vous l’emportez avec vous.

```text
Vous êtes dans l’atelier de service.
Vous voyez ici une caisse, un bidon d’eau et une trousse de soin.
La porte du salon de transit est ouverte.
La grille est fermée.
La caisse est au centre de l’atelier.
Vous portez la burette d’huile.
```

#### AR-01 — Par « → grille » : « Aller vers · local énergie », lien d’IA Station

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison de la galerie technique est fermée.
La grille de l’atelier de service est ouverte.
La cloison de la salle d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Fenêtre d’IA Station : deux messages nouveaux

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison de la galerie technique est fermée.
La grille de l’atelier de service est ouverte.
La cloison de la salle d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Fenêtre d’IA Station après reprise : messages lus

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison de la galerie technique est fermée.
La grille de l’atelier de service est ouverte.
La cloison de la salle d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Aperçu « Burette d’huile › Verser › Cloison de la salle d’observation »

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison de la galerie technique est fermée.
La grille de l’atelier de service est ouverte.
La cloison de la salle d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Ouvrir la cloison de la salle d’observation : créature à terre

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Cloison de la salle d’observation · Ouvrir
> Vous ouvrez la cloison de la salle d’observation. Le passage est dégagé.
> La cloison de la salle d’observation grince longuement ; le bruit a dû porter.
> Quelque chose franchit la cloison de la salle d’observation et part en glissade sur le sol huilé.
> Vous la voyez enfin : plus haute qu’un homme, la peau luisante, une tête sans yeux. Sa gueule hume l’air ; ses griffes raclent le sol. Elle s’est tournée vers vous. Il vous reste un instant pour réagir.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ et un test d’avertisseur.
La cloison de la galerie technique est fermée.
La grille de l’atelier de service est ouverte.
La cloison de la salle d’observation est ouverte.
Le sol est huilé au pied de la cloison de la salle d’observation.
Le panneau est fermé.
La créature est à terre, tout près de vous ; elle peine à se relever.
Vous portez la burette d’huile et le bloc d’énergie.
```

#### AR-01 — Installer le bloc d’énergie dans la capsule

_Récit : 9,8 lignes visibles ; boutons du dock tous visibles._

> Bloc d’énergie · Installer
> Vous engagez le bloc d’énergie dans le connecteur de la capsule de secours. Le verrou s’enclenche avec un déclic.

```text
Vous êtes dans l’embarquement.
Vous voyez ici une capsule de secours.
La cloison de la salle d’observation est fermée.
L’écoutille de la cabine de la capsule est ouverte.
Le bloc d’énergie est engagé dans la capsule de secours.
Vous portez la burette d’huile.
```

#### AR-01 — Fin : « La capsule s’est détachée. Vous avez quitté la station. », NOUVELLE PARTIE

_Récit : 22,4 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de l’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Fin : fenêtre d’IA Station, départ confirmé

_Récit : 22,4 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de l’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Départ, 412 × 915

_Récit : 13,1 lignes visibles ; boutons du dock tous visibles._

> Le siège se redresse sans prévenir. Vous êtes dans le salon de transit. Au plafond, les flèches d’embarquement sont rouges. Votre terminal de transit affiche : CONFINEMENT EN COURS.
> « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier de service est ouverte.
La cloison de la galerie technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Départ, 320 × 568

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Le siège se redresse sans prévenir. Vous êtes dans le salon de transit. Au plafond, les flèches d’embarquement sont rouges. Votre terminal de transit affiche : CONFINEMENT EN COURS.
> « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier de service est ouverte.
La cloison de la galerie technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Bulle « Caisse », étape « OÙ ? », 320 px de large

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Burette d’huile · Prendre
> Vous prenez la burette d’huile. Vous l’avez en main.

```text
Vous êtes dans l’atelier de service.
Vous voyez ici une caisse, un bidon d’eau et une trousse de soin.
La porte du salon de transit est ouverte.
La grille est fermée.
La caisse est au centre de l’atelier.
Vous portez la burette d’huile.
```

</details>

### AR-02, parcours P-V1

**AR-02, parcours P-V1 : réussi.**
Adresse : `?monde=ar-02`, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-125/captures/42.png?v=781d9bb" width="200" alt="AR-02 — Départ"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/43.png?v=781d9bb" width="200" alt="AR-02 — Enfiler la combinaison étanche"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/44.png?v=781d9bb" width="200" alt="AR-02 — Aperçu « Baie extérieure › Percer »"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/45.png?v=781d9bb" width="200" alt="AR-02 — Percer la baie extérieure à la découpeuse"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/46.png?v=781d9bb" width="200" alt="AR-02 — Aller dans l’embarquement"> <img src="https://greffeb.github.io/void-walker/pr-125/captures/47.png?v=781d9bb" width="200" alt="AR-02 — Fin : « La capsule s’est détachée. Vous avez quitté la station. »">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-02 — Départ

_Récit : 10,5 lignes visibles ; boutons du dock tous visibles._

> Une secousse vous tire du sommeil. Vous êtes dans la coursive des cabines, sous un éclairage rouge. Votre terminal personnel clignote.
> « Une capsule de secours est prête au départ, à l’embarquement. »
> « Présence non identifiée détectée à l’embarquement. »

```text
Vous êtes dans la coursive des cabines.
Vous voyez ici un terminal personnel et une signalétique d’évacuation.
La porte du local de sécurité est ouverte.
La porte de la salle panoramique est fermée.
Vous ne portez rien.
```

#### AR-02 — Enfiler la combinaison étanche

_Récit : 13,6 lignes visibles ; boutons du dock tous visibles._

> Combinaison étanche · Enfiler
> Vous vous glissez dans la combinaison étanche et rabattez le casque. Le verrou claque ; le vide ne vous atteindra plus.

```text
Vous êtes dans le local de sécurité.
Vous voyez ici un casier mural et une découpeuse de maintenance.
La porte de la coursive des cabines est ouverte.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche.
```

#### AR-02 — Aperçu « Baie extérieure › Percer »

_Récit : 10,5 lignes visibles ; boutons du dock tous visibles._

> Aller vers · salle panoramique
> Vous passez par la porte de la salle panoramique. Vous voici dans la salle panoramique.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans la salle panoramique.
Vous voyez ici une baie extérieure et un kit de brèche.
La porte de la coursive des cabines est ouverte.
La porte grippée de l’embarquement est fermée.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
```

#### AR-02 — Percer la baie extérieure à la découpeuse

_Récit : 10,5 lignes visibles ; boutons du dock tous visibles._

> Baie extérieure · Percer
> Vous appuyez la découpeuse contre la baie extérieure. Le vitrage éclate ; l’air s’échappe vers l’espace.
> Plus d’air dans la coursive des cabines, le local de sécurité et la salle panoramique : les voyants virent au rouge.

```text
Vous êtes dans la salle panoramique.
Vous voyez ici une baie extérieure et un kit de brèche.
La porte de la coursive des cabines est ouverte.
Le voyant de la porte de la coursive des cabines est rouge : plus d’air de l’autre côté.
La porte grippée de l’embarquement est fermée.
Il n’y a plus d’air ici.
La baie extérieure est percée : l’espace est à nu.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
```

#### AR-02 — Aller dans l’embarquement

_Récit : 11,0 lignes visibles ; boutons du dock tous visibles._

> Aller vers · embarquement
> Vous franchissez la porte grippée de l’embarquement. Vous entrez dans l’embarquement.
> Rien, ici, ne vous est familier.
> Au sol gît une forme inerte, plus haute qu’un homme, une tête sans yeux.

```text
Vous êtes dans l’embarquement.
Vous voyez ici une capsule de secours.
La porte grippée de la salle panoramique est ouverte.
Le voyant de la porte grippée de la salle panoramique est rouge : plus d’air de l’autre côté.
L’écoutille de la cabine de la capsule est ouverte.
Le voyant de l’écoutille de la cabine de la capsule est rouge : plus d’air de l’autre côté.
Il n’y a plus d’air ici.
Une créature gît ici, inerte.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
```

#### AR-02 — Fin : « La capsule s’est détachée. Vous avez quitté la station. »

_Récit : 22,4 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> La capsule part sur sa propre réserve. Elle se détache du quai dans un choc sourd. Derrière le hublot, la station s’éloigne.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de l’embarquement est fermée.
Le voyant de l’écoutille de l’embarquement est rouge : plus d’air de l’autre côté.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
La capsule s’est détachée. Vous avez quitté la station.
```

</details>
