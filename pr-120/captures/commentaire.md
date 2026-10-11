<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-120/
Commit `e391412`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

**Parcours du monde de test : réussi.**
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-Regular.woff2 (service worker), IBMPlexMono-SemiBold.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-120/captures/01.png?v=e391412" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/02.png?v=e391412" width="200" alt="Bulle « Carnet » ouverte"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/03.png?v=e391412" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/04.png?v=e391412" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir »"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/05.png?v=e391412" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/06.png?v=e391412" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/07.png?v=e391412" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/08.png?v=e391412" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/09.png?v=e391412" width="200" alt="Inventaire ouvert"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/10.png?v=e391412" width="200" alt="Inventaire, fiche « Carnet »"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/11.png?v=e391412" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/12.png?v=e391412" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/13.png?v=e391412" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/14.png?v=e391412" width="200" alt="« → soute » d’un seul toucher, touché deux fois : un seul déplacement"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/15.png?v=e391412" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », sans risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/16.png?v=e391412" width="200" alt="Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/17.png?v=e391412" width="200" alt="Aperçu « Aller vers › atelier », risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/18.png?v=e391412" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/19.png?v=e391412" width="200" alt="Machine à écrire, 0 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/20.png?v=e391412" width="200" alt="Machine à écrire, 125 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/21.png?v=e391412" width="200" alt="Machine à écrire, 250 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/22.png?v=e391412" width="200" alt="Machine à écrire, 375 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/23.png?v=e391412" width="200" alt="Machine à écrire, 600 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/24.png?v=e391412" width="200" alt="Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/25.png?v=e391412" width="200" alt="Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/26.png?v=e391412" width="200" alt="Départ, bulle « Porte de l’atelier », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/27.png?v=e391412" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-120/captures/28.png?v=e391412" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Bulle « Carnet » ouverte

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

> Carnet · Prendre
> Vous ramassez le carnet. Vos mains tremblent un peu.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Aperçu « Porte de l’atelier › Ouvrir »

> Carnet · Prendre
> Vous ramassez le carnet. Vos mains tremblent un peu.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

> Porte de l’atelier · Ouvrir
> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.
> Le mécanisme grippé a hurlé tout du long ; l’écho met longtemps à mourir.
> Derrière la porte de l’atelier, quelque chose de lourd se déplace.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Après fermeture et réouverture

> Porte de l’atelier · Ouvrir
> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.
> Le mécanisme grippé a hurlé tout du long ; l’écho met longtemps à mourir.
> Derrière la porte de l’atelier, quelque chose de lourd se déplace.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Aperçu « Aller vers › atelier »

> Porte de l’atelier · Ouvrir
> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.
> Le mécanisme grippé a hurlé tout du long ; l’écho met longtemps à mourir.
> Derrière la porte de l’atelier, quelque chose de lourd se déplace.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Aller dans l’atelier

> Aller vers · atelier
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

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
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

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
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

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
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.
> Des griffes fendent l’air à un souffle de votre visage.

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
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.
> Des griffes fendent l’air à un souffle de votre visage.

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
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.
> Des griffes fendent l’air à un souffle de votre visage.

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

#### Aperçu « Porte de l’atelier › Ouvrir », risque connu, avec un coût

> Porte de l’atelier · Fermer
> Vous refermez la porte de l’atelier. Le silence revient d’un coup.
> Des griffes fendent l’air à un souffle de votre visage.

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
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 125 ms après le toucher

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 250 ms après le toucher

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 375 ms après le toucher

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire, 600 ms après le toucher

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

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

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px de large

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

</details>
