<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-111/
Commit `24351e4`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

**Parcours du monde de test : réussi.**
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-Regular.woff2 (service worker), IBMPlexMono-SemiBold.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-111/captures/01.png?v=24351e4" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/02.png?v=24351e4" width="200" alt="Bulle « Carnet » ouverte"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/03.png?v=24351e4" width="200" alt="Aperçu « Carnet › Prendre »"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/04.png?v=24351e4" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/05.png?v=24351e4" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/06.png?v=24351e4" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/07.png?v=24351e4" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/08.png?v=24351e4" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/09.png?v=24351e4" width="200" alt="Inventaire ouvert"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/10.png?v=24351e4" width="200" alt="Inventaire, fiche « Carnet »"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/11.png?v=24351e4" width="200" alt="Aperçu « Carnet › Poser »"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/12.png?v=24351e4" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/13.png?v=24351e4" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/14.png?v=24351e4" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/15.png?v=24351e4" width="200" alt="Départ, bulle « Carnet », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/16.png?v=24351e4" width="200" alt="Aperçu « Carnet › Prendre », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-111/captures/17.png?v=24351e4" width="200" alt="Aperçu « Carnet › Prendre », 320 px, tout le texte à 22 px">

<details><summary>Texte affiché à chaque étape</summary>

#### Départ

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Bulle « Carnet » ouverte

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Aperçu « Carnet › Prendre »

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

> > Carnet · Prendre
> Vous prenez le carnet. Le contact est froid sous vos doigts.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est fermée.
Vous portez le carnet.
```

#### Ouvrir la porte de l’atelier

> > Porte de l’atelier · Ouvrir
> Vous ouvrez la porte de l’atelier. Un chuintement, et le passage est libre.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Après fermeture et réouverture

> > Porte de l’atelier · Ouvrir
> Vous ouvrez la porte de l’atelier. Un chuintement, et le passage est libre.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Aperçu « Aller vers › atelier »

> > Porte de l’atelier · Ouvrir
> Vous ouvrez la porte de l’atelier. Un chuintement, et le passage est libre.

```text
Vous êtes dans la cabine.
Rien ne traîne ici.
La porte de l’atelier est ouverte.
Vous portez le carnet.
```

#### Aller dans l’atelier

> > ALLER VERS · ATELIER
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Inventaire ouvert

> > ALLER VERS · ATELIER
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Inventaire, fiche « Carnet »

> > ALLER VERS · ATELIER
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Aperçu « Carnet › Poser »

> > ALLER VERS · ATELIER
> Vous passez dans l’atelier, une main sur la cloison. Le plancher vibre faiblement sous vos pieds.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans l’atelier.
Rien ne traîne ici.
La porte de la cabine est ouverte.
Vous portez le carnet.
```

#### Poser le carnet

> > Carnet · Poser
> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

#### Hors ligne : reprise, police servie par l’appli

> > Carnet · Poser
> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

#### Fin du parcours, 320 px de large

> > Carnet · Poser
> Vous posez le carnet au sol, près de la cloison. Vos mains sont libres.

```text
Vous êtes dans l’atelier.
Vous voyez ici un carnet.
La porte de la cabine est ouverte.
Vous ne portez rien.
```

#### Départ, bulle « Carnet », 320 px de large

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Aperçu « Carnet › Prendre », 320 px de large

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

#### Aperçu « Carnet › Prendre », 320 px, tout le texte à 22 px

> Vous ouvrez les yeux dans la cabine. La lumière de veille grésille au plafond, d’un blanc sale. L’air recyclé a un goût de métal. Aucune voix ne vous parvient.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
Vous ne portez rien.
```

</details>
