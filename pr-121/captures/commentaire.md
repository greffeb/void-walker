<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-121/
Commit `c5d510f`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-121/captures/01.png?v=c5d510f" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/02.png?v=c5d510f" width="200" alt="Bulle « Carnet » ouverte"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/03.png?v=c5d510f" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/04.png?v=c5d510f" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir »"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/05.png?v=c5d510f" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/06.png?v=c5d510f" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/07.png?v=c5d510f" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/08.png?v=c5d510f" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/09.png?v=c5d510f" width="200" alt="Inventaire ouvert"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/10.png?v=c5d510f" width="200" alt="Inventaire, fiche « Carnet »"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/11.png?v=c5d510f" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/12.png?v=c5d510f" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/13.png?v=c5d510f" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/14.png?v=c5d510f" width="200" alt="« → soute » d’un seul toucher, touché deux fois : un seul déplacement"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/15.png?v=c5d510f" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », sans risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/16.png?v=c5d510f" width="200" alt="Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/17.png?v=c5d510f" width="200" alt="Aperçu « Aller vers › atelier », risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/18.png?v=c5d510f" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/19.png?v=c5d510f" width="200" alt="Machine à écrire, 0 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/20.png?v=c5d510f" width="200" alt="Machine à écrire, 125 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/21.png?v=c5d510f" width="200" alt="Machine à écrire, 250 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/22.png?v=c5d510f" width="200" alt="Machine à écrire, 375 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/23.png?v=c5d510f" width="200" alt="Machine à écrire, 600 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/24.png?v=c5d510f" width="200" alt="Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/25.png?v=c5d510f" width="200" alt="Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/26.png?v=c5d510f" width="200" alt="Départ, bulle « Porte de l’atelier », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/27.png?v=c5d510f" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/28.png?v=c5d510f" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Bulle « Carnet » ouverte

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

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

> Aller vers · soute
> Vous passez dans la soute, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.
> Une silhouette se déplie devant vous, plus haute qu’un homme, la peau luisante. Une tête sans yeux se tourne vers vous et s’immobilise. Elle vous a repéré. Il vous reste un instant pour réagir.

```text
Vous êtes dans la soute.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la cabine est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », sans risque connu, avec un coût

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Aller vers › atelier », risque connu, sans coût

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

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier

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

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px de large

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

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

<img src="https://greffeb.github.io/void-walker/pr-121/captures/29.png?v=c5d510f" width="200" alt="AR-01 — Départ : parole d’IA Station"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/30.png?v=c5d510f" width="200" alt="AR-01 — Bulle « Caisse », étape « OÙ ? »"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/31.png?v=c5d510f" width="200" alt="AR-01 — Par « → grille » : « Aller vers · local énergie », parole d’IA Station"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/32.png?v=c5d510f" width="200" alt="AR-01 — Aperçu « Burette d’huile › Verser › Cloison de la salle d’observation »"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/33.png?v=c5d510f" width="200" alt="AR-01 — Ouvrir la cloison de la salle d’observation : créature à terre"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/34.png?v=c5d510f" width="200" alt="AR-01 — Installer le bloc d’énergie dans la capsule"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/35.png?v=c5d510f" width="200" alt="AR-01 — Fin : « La capsule s’est détachée. Vous avez quitté la station. », NOUVELLE PARTIE"> <img src="https://greffeb.github.io/void-walker/pr-121/captures/36.png?v=c5d510f" width="200" alt="AR-01 — Bulle « Caisse », étape « OÙ ? », 320 px de large">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Départ : parole d’IA Station

> Le siège se redresse sans prévenir. Vous êtes dans le salon de transit. Au plafond, les flèches d’embarquement sont rouges. Votre terminal de transit affiche : CONFINEMENT EN COURS.
> « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier de service est ouverte.
La cloison de la galerie technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Bulle « Caisse », étape « OÙ ? »

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

#### AR-01 — Par « → grille » : « Aller vers · local énergie », parole d’IA Station

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.
> « Le circuit de départ se réarme depuis sa console ; son relais est bruyant. Une source locale compatible peut aussi alimenter la capsule. »

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

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.
> « Le circuit de départ se réarme depuis sa console ; son relais est bruyant. Une source locale compatible peut aussi alimenter la capsule. »

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

> Cloison de la salle d’observation · Ouvrir
> Vous tirez sur la poignée de la cloison de la salle d’observation. Le passage s’ouvre devant vous.
> Le mécanisme grippé hurle tout du long.
> Une masse surgit par la cloison de la salle d’observation, dérape sur l’huile et s’étale de tout son long.
> La chose est là, plus haute qu’un homme, la peau luisante. Pas d’yeux : une gueule qui hume l’air, des griffes au bout de longs bras. Elle vous a repéré. Vous avez un instant, pas plus.

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

> Bloc d’énergie · Installer
> Vous glissez le bloc d’énergie dans son logement, à l’arrière de la capsule de secours. Un voyant vert s’allume.

```text
Vous êtes dans l’embarquement.
Vous voyez ici une capsule de secours.
La cloison de la salle d’observation est fermée.
L’écoutille de la cabine de la capsule est ouverte.
Le bloc d’énergie est engagé dans la capsule de secours.
Vous portez la burette d’huile.
```

#### AR-01 — Fin : « La capsule s’est détachée. Vous avez quitté la station. », NOUVELLE PARTIE

> Pupitre de départ · Lancer
> Le bloc d’énergie alimente la capsule. Elle se détache du quai dans un choc sourd. Derrière le hublot, la station s’éloigne.
> « Alimentation confirmée. Écoutille fermée. Départ engagé. »

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de l’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Bulle « Caisse », étape « OÙ ? », 320 px de large

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

</details>
