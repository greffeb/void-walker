<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-90/
Commit `16404b5`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

**Parcours du monde de test : réussi.**
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif

<img src="https://greffeb.github.io/void-walker/pr-90/captures/01.png?v=16404b5" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/02.png?v=16404b5" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/03.png?v=16404b5" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/04.png?v=16404b5" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/05.png?v=16404b5" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/06.png?v=16404b5" width="200" alt="Poser le carnet">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

> Vous ramassez le carnet. Vos mains tremblent un peu.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Après fermeture et réouverture

> Vous appuyez sur le bouton d’ouverture. La porte de l’atelier s’efface dans la cloison.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Aller dans l’atelier

> Vous franchissez le seuil et entrez dans l’atelier. Vos pas résonnent sur le plancher métallique.
> Vous n’aviez encore jamais mis les pieds ici.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Poser le carnet

> Vous déposez le carnet à vos pieds. Vous gardez les mains libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

</details>
