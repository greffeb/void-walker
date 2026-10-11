<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-109/
Commit `83c24b8`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

**Parcours du monde de test : réussi.**
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-109/captures/01.png?v=83c24b8" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/02.png?v=83c24b8" width="200" alt="« Carnet » déplié"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/03.png?v=83c24b8" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/04.png?v=83c24b8" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/05.png?v=83c24b8" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/06.png?v=83c24b8" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/07.png?v=83c24b8" width="200" alt="Inventaire ouvert, « Carnet » déplié"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/08.png?v=83c24b8" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/09.png?v=83c24b8" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/10.png?v=83c24b8" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-109/captures/11.png?v=83c24b8" width="200" alt="Départ, « Carnet » déplié, 320 px de large">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### « Carnet » déplié

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

> > Carnet · Prendre
> Vous ramassez le carnet. Vos mains tremblent un peu.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

> > Porte de l’atelier · Ouvrir
> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Après fermeture et réouverture

> > Porte de l’atelier · Ouvrir
> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Aller dans l’atelier

> > ALLER VERS · ATELIER
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Inventaire ouvert, « Carnet » déplié

> > ALLER VERS · ATELIER
> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Poser le carnet

> > Carnet · Poser
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

#### Hors ligne : reprise, police servie par l’appli

> > Carnet · Poser
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

#### Fin du parcours, 320 px de large

> > Carnet · Poser
> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

#### Départ, « Carnet » déplié, 320 px de large

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

</details>
