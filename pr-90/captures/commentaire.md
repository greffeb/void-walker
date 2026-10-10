<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-90/
Commit `95f8560`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

**Parcours du monde de test : réussi.**
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif

<img src="https://greffeb.github.io/void-walker/pr-90/captures/01.png?v=95f8560" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/02.png?v=95f8560" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/03.png?v=95f8560" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/04.png?v=95f8560" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/05.png?v=95f8560" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-90/captures/06.png?v=95f8560" width="200" alt="Poser le carnet">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

> Vous prenez le carnet. Le contact est froid sous vos doigts.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

> Vous ouvrez la porte de l’atelier. Un chuintement, et le passage est libre.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Après fermeture et réouverture

> Vous ouvrez la porte de l’atelier. Un chuintement, et le passage est libre.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Aller dans l’atelier

> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Poser le carnet

> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

</details>
