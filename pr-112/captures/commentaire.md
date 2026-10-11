<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-112/
Commit `d264682`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

**Parcours du monde de test : réussi.**
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-112/captures/01.png?v=d264682" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/02.png?v=d264682" width="200" alt="Bulle « Carnet » ouverte"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/03.png?v=d264682" width="200" alt="Aperçu « Carnet › Prendre »"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/04.png?v=d264682" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/05.png?v=d264682" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/06.png?v=d264682" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/07.png?v=d264682" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/08.png?v=d264682" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/09.png?v=d264682" width="200" alt="Inventaire ouvert"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/10.png?v=d264682" width="200" alt="Inventaire, fiche « Carnet »"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/11.png?v=d264682" width="200" alt="Aperçu « Carnet › Poser »"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/12.png?v=d264682" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/13.png?v=d264682" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/14.png?v=d264682" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/15.png?v=d264682" width="200" alt="Départ, bulle « Carnet », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/16.png?v=d264682" width="200" alt="Aperçu « Carnet › Prendre », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-112/captures/17.png?v=d264682" width="200" alt="Aperçu « Carnet › Prendre », 320 px, tout le texte à 22 px">

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

#### Aperçu « Carnet › Prendre »

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

> > Carnet · Prendre
> Vous ramassez le carnet. Vos mains tremblent un peu.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

> > Porte de l’atelier · Ouvrir
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

> > Porte de l’atelier · Ouvrir
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

> > Porte de l’atelier · Ouvrir
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

> > ALLER VERS · ATELIER
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Inventaire ouvert

> > ALLER VERS · ATELIER
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Inventaire, fiche « Carnet »

> > ALLER VERS · ATELIER
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Aperçu « Carnet › Poser »

> > ALLER VERS · ATELIER
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.
> La chose se redresse lentement, à quelques pas de vous. Pas d’yeux, seulement une gueule entrouverte qui hume l’air. Elle s’est figée dans votre direction. Vous avez un instant, pas plus.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous portez le carnet.
```

#### Poser le carnet

> > Carnet · Poser
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.
> Des griffes fendent l’air à un souffle de votre visage.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Hors ligne : reprise, police servie par l’appli

> > Carnet · Poser
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.
> Des griffes fendent l’air à un souffle de votre visage.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Fin du parcours, 320 px de large

> > Carnet · Poser
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.
> Des griffes fendent l’air à un souffle de votre visage.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
La porte de la soute est ouverte.
La créature est là, tout près de vous.
Vous ne portez rien.
```

#### Départ, bulle « Carnet », 320 px de large

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Carnet › Prendre », 320 px de large

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Carnet › Prendre », 320 px, tout le texte à 22 px

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

</details>
