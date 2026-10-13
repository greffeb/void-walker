<!-- void-walker:version-de-test -->
## Version de test

**Adresse :** https://greffeb.github.io/void-walker/pr-129/
Commit `4aee181`

Captures d’un navigateur automatique sur téléphone simulé (Pixel 7, 390 × 844 puis 320 px de large ; départ d’AR-01 aussi en 412 × 915). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.

### Parcours du monde de test

**Parcours du monde de test : réussi.**
Adresse : `?monde=monde-test`.
Installation : manifeste présent (icônes 192x192, 512x512, 512x512), service worker actif
Hors ligne : polices chargées : 400 normal, 600 normal ; IBMPlexMono-SemiBold.woff2 (service worker), IBMPlexMono-Regular.woff2 (service worker)

<img src="https://greffeb.github.io/void-walker/pr-129/captures/01.png?v=4aee181" width="200" alt="Accueil sans partie active"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/02.png?v=4aee181" width="200" alt="Réveil — monde-test"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/03.png?v=4aee181" width="200" alt="Accueil avec partie en cours"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/04.png?v=4aee181" width="200" alt="Confirmation du remplacement"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/05.png?v=4aee181" width="200" alt="Départ"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/06.png?v=4aee181" width="200" alt="Bulle « Carnet » ouverte"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/07.png?v=4aee181" width="200" alt="Prendre le carnet"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/08.png?v=4aee181" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/09.png?v=4aee181" width="200" alt="Ouvrir la porte de l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/10.png?v=4aee181" width="200" alt="Après fermeture et réouverture"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/11.png?v=4aee181" width="200" alt="Aperçu « Aller vers › atelier »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/12.png?v=4aee181" width="200" alt="Aller dans l’atelier"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/13.png?v=4aee181" width="200" alt="Inventaire ouvert"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/14.png?v=4aee181" width="200" alt="Inventaire, fiche « Carnet »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/15.png?v=4aee181" width="200" alt="Poser le carnet"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/16.png?v=4aee181" width="200" alt="Hors ligne : reprise, police servie par l’appli"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/17.png?v=4aee181" width="200" alt="Fin du parcours, 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/18.png?v=4aee181" width="200" alt="« → soute » d’un seul toucher, touché deux fois : un seul déplacement"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/19.png?v=4aee181" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », sans risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/20.png?v=4aee181" width="200" alt="Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/21.png?v=4aee181" width="200" alt="Aperçu « Aller vers › atelier », risque connu, sans coût"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/22.png?v=4aee181" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », risque connu, avec un coût"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/23.png?v=4aee181" width="200" alt="Machine à écrire, 0 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/24.png?v=4aee181" width="200" alt="Machine à écrire, 125 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/25.png?v=4aee181" width="200" alt="Machine à écrire, 250 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/26.png?v=4aee181" width="200" alt="Machine à écrire, 375 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/27.png?v=4aee181" width="200" alt="Machine à écrire, 600 ms après le toucher"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/28.png?v=4aee181" width="200" alt="Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier (tout le texte à 22 px)"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/29.png?v=4aee181" width="200" alt="Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/30.png?v=4aee181" width="200" alt="Départ, bulle « Porte de l’atelier », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/31.png?v=4aee181" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px de large"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/32.png?v=4aee181" width="200" alt="Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/33.png?v=4aee181" width="200" alt="Options depuis l’accueil, sans partie"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/34.png?v=4aee181" width="200" alt="Options en cours de partie"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/35.png?v=4aee181" width="200" alt="Options : taille « très grande », lignes de balayage sur [NON], fichier prêt"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/36.png?v=4aee181" width="200" alt="Jeu en « très grande », sans lignes de balayage"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/37.png?v=4aee181" width="200" alt="Bulle en « très grande »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/38.png?v=4aee181" width="200" alt="Fenêtre d’IA Station en « très grande »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/39.png?v=4aee181" width="200" alt="Accueil après rechargement : réglages gardés"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/40.png?v=4aee181" width="200" alt="Options : confirmation d’abandon"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/41.png?v=4aee181" width="200" alt="Fin : partie abandonnée (« très grande »)">

<details><summary>Texte affiché à chaque étape</summary>

#### Accueil sans partie active

> 

```text

```

#### Réveil — monde-test

> Vous vous réveillez dans la cabine, la bouche sèche. Le bourdonnement des ventilateurs remplit le silence. Aucune voix, aucun pas derrière les cloisons.
> « Merci de rester dans votre cabine jusqu’à nouvel ordre. »

```text

```

#### Accueil avec partie en cours

> 

```text

```

#### Confirmation du remplacement

> 

```text

```

#### Départ

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Bulle « Carnet » ouverte

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Prendre le carnet

_Récit : 14,3 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 14,3 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 14,9 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 14,9 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 14,9 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 13,1 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 13,1 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 13,1 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 13,1 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 13,1 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 15,4 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Grille de la soute › Ouvrir », sans risque connu, sans coût

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Aperçu « Aller vers › atelier », risque connu, sans coût

_Récit : 12,5 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 14,3 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

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

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

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
> Un réduit de mousse grise et de métal. La couchette défaite garde encore la forme d’un corps. Le ventilateur souffle un air tiède.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe

_Récit : 12,0 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Une cabine étroite, aux parois capitonnées de mousse grise. La couchette est vide, ses sangles pendent. Une lumière de veille, d’un blanc sale, éclaire le tout.

```text
Vous êtes dans la cabine.
Vous voyez ici un carnet.
La porte de l’atelier est fermée.
La grille de la soute est fermée.
Vous ne portez rien.
```

#### Départ, bulle « Porte de l’atelier », 320 px de large

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

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px de large

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

#### Aperçu « Porte de l’atelier › Ouvrir », 320 px, tout le texte à 22 px

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

#### Options depuis l’accueil, sans partie

> 

```text

```

#### Options en cours de partie

> 

```text

```

#### Options : taille « très grande », lignes de balayage sur [NON], fichier prêt

> 

```text

```

#### Jeu en « très grande », sans lignes de balayage

_Récit : 10,1 lignes visibles ; boutons du dock tous visibles._

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

#### Bulle en « très grande »

_Récit : 10,1 lignes visibles ; boutons du dock tous visibles._

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

#### Fenêtre d’IA Station en « très grande »

_Récit : 10,5 lignes visibles ; boutons du dock tous visibles._

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

#### Accueil après rechargement : réglages gardés

> 

```text

```

#### Options : confirmation d’abandon

> 

```text

```

#### Fin : partie abandonnée (« très grande »)

> 

```text

```

</details>

### AR-01, parcours P-C

**AR-01, parcours P-C : réussi.**
Adresse par défaut, partie neuve, joué geste par geste.

<img src="https://greffeb.github.io/void-walker/pr-129/captures/42.png?v=4aee181" width="200" alt="AR-01 — Réveil : citation IA Station encadrée"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/43.png?v=4aee181" width="200" alt="AR-01 — Départ : IA Station nouvelle"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/44.png?v=4aee181" width="200" alt="AR-01 — Bulle « Caisse », étape « OÙ ? »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/45.png?v=4aee181" width="200" alt="AR-01 — Par « → grille » : « Aller vers · local énergie », lien d’IA Station"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/46.png?v=4aee181" width="200" alt="AR-01 — Fenêtre d’IA Station : deux messages nouveaux"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/47.png?v=4aee181" width="200" alt="AR-01 — Fenêtre d’IA Station après reprise : messages lus"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/48.png?v=4aee181" width="200" alt="AR-01 — Aperçu « Burette d’huile › Verser › Cloison de la baie d’observation »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/49.png?v=4aee181" width="200" alt="AR-01 — Ouvrir la cloison de la baie d’observation : créature à terre"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/50.png?v=4aee181" width="200" alt="AR-01 — Installer le bloc d’énergie dans la capsule"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/51.png?v=4aee181" width="200" alt="AR-01 — Fin : « La capsule s’est détachée. Vous avez quitté la station. », NOUVELLE PARTIE"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/52.png?v=4aee181" width="200" alt="AR-01 — Fin : fenêtre d’IA Station, départ confirmé"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/53.png?v=4aee181" width="200" alt="AR-01 — Départ, 412 × 915"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/54.png?v=4aee181" width="200" alt="AR-01 — Départ, 320 × 568"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/55.png?v=4aee181" width="200" alt="AR-01 — Options en « très grande », 320 × 568"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/56.png?v=4aee181" width="200" alt="AR-01 — Départ en « très grande », 320 × 568"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/57.png?v=4aee181" width="200" alt="AR-01 — En-tête simulé « Salle d’embarquement » et « !! CRITIQUE », très grande, 320 px"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/58.png?v=4aee181" width="200" alt="AR-01 — Bulle « Caisse », étape « OÙ ? », 320 px de large">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-01 — Réveil : citation IA Station encadrée

> Le siège se redresse sans prévenir. Vous êtes dans le salon de transit. Au plafond, les flèches d’embarquement sont rouges. Votre terminal de transit affiche : CONFINEMENT EN COURS.
> « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »

```text

```

#### AR-01 — Départ : IA Station nouvelle

_Récit : 11,8 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un salon de transit aux sièges alignés. Les flèches d’embarquement brillent en rouge au plafond.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Bulle « Caisse », étape « OÙ ? »

_Récit : 13,5 lignes visibles ; boutons du dock tous visibles._

> Burette d’huile · Prendre
> Vous prenez la burette d’huile. Vous l’avez en main.

```text
Vous êtes dans l’atelier maintenance.
Vous voyez ici une caisse, un bidon d’eau et une trousse de soin.
La porte du salon de transit est ouverte.
La grille est fermée.
La caisse est au centre de l’atelier.
Vous portez la burette d’huile.
```

#### AR-01 — Par « → grille » : « Aller vers · local énergie », lien d’IA Station

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Fenêtre d’IA Station : deux messages nouveaux

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Fenêtre d’IA Station après reprise : messages lus

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Aperçu « Burette d’huile › Verser › Cloison de la baie d’observation »

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous passez par la grille. Vous voici dans le local énergie.
> Vous n’étiez encore jamais venu ici.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### AR-01 — Ouvrir la cloison de la baie d’observation : créature à terre

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Cloison de la baie d’observation · Ouvrir
> Vous tirez sur la poignée de la cloison de la baie d’observation. Le passage s’ouvre devant vous.
> Le mécanisme grippé hurle tout du long.
> Une masse surgit par la cloison de la baie d’observation, dérape sur l’huile et s’étale de tout son long.
> La chose est là, plus haute qu’un homme, la peau luisante. Pas d’yeux : une gueule qui hume l’air, des griffes au bout de longs bras. Elle vous a repéré. Vous avez un instant, pas plus.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est ouverte.
Le sol est huilé au pied de la cloison de la baie d’observation.
Le panneau est fermé.
La créature est à terre, tout près de vous ; elle peine à se relever.
Vous portez la burette d’huile et le bloc d’énergie.
```

#### AR-01 — Installer le bloc d’énergie dans la capsule

_Récit : 9,3 lignes visibles ; boutons du dock tous visibles._

> Bloc d’énergie · Installer
> Vous glissez le bloc d’énergie dans son logement, à l’arrière de la capsule de secours. Un voyant vert s’allume.

```text
Vous êtes dans la salle d’embarquement.
Vous voyez ici une capsule de secours.
La cloison de la baie d’observation est fermée.
L’écoutille de la cabine de la capsule est fermée.
Le bloc d’énergie est engagé dans la capsule de secours.
Vous portez la burette d’huile.
```

#### AR-01 — Fin : « La capsule s’est détachée. Vous avez quitté la station. », NOUVELLE PARTIE

_Récit : 23,2 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de la salle d’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Fin : fenêtre d’IA Station, départ confirmé

_Récit : 23,2 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> Le levier descend ; le bloc d’énergie répond. Un choc, puis plus rien ne vous retient à la station.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de la salle d’embarquement est fermée.
Vous portez la burette d’huile.
La capsule s’est détachée. Vous avez quitté la station.
```

#### AR-01 — Départ, 412 × 915

_Récit : 14,4 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Des sièges de transit vissés en rangs, tous vides. Au plafond, les flèches d’embarquement sont rouges.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Départ, 320 × 568

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Regarder autour de vous
> Des sièges de transit vissés en rangs, tous vides. Au plafond, les flèches d’embarquement sont rouges.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Options en « très grande », 320 × 568

> 

```text

```

#### AR-01 — Départ en « très grande », 320 × 568

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Regarder autour de vous
> Des sièges de transit vissés en rangs, tous vides. Au plafond, les flèches d’embarquement sont rouges.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — En-tête simulé « Salle d’embarquement » et « !! CRITIQUE », très grande, 320 px

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Regarder autour de vous
> Des sièges de transit vissés en rangs, tous vides. Au plafond, les flèches d’embarquement sont rouges.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### AR-01 — Bulle « Caisse », étape « OÙ ? », 320 px de large

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Burette d’huile · Prendre
> Vous prenez la burette d’huile. Vous l’avez en main.

```text
Vous êtes dans l’atelier maintenance.
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

<img src="https://greffeb.github.io/void-walker/pr-129/captures/59.png?v=4aee181" width="200" alt="AR-02 — Départ"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/60.png?v=4aee181" width="200" alt="AR-02 — Enfiler la combinaison étanche"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/61.png?v=4aee181" width="200" alt="AR-02 — Aperçu « Baie extérieure › Percer »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/62.png?v=4aee181" width="200" alt="AR-02 — Percer la baie extérieure à la découpeuse"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/63.png?v=4aee181" width="200" alt="AR-02 — Aller dans la salle d’embarquement"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/64.png?v=4aee181" width="200" alt="AR-02 — Fin : « La capsule s’est détachée. Vous avez quitté la station. »">

<details><summary>Texte affiché à chaque étape</summary>

#### AR-02 — Départ

_Récit : 11,1 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un couloir étroit, bordé de portes de cabines closes. Au-dessus de chaque porte étanche, un voyant dit s’il reste de l’air de l’autre côté.

```text
Vous êtes dans les cabines du personnel.
Vous voyez ici un terminal personnel et une signalétique d’évacuation.
La porte du local de sécurité est ouverte.
La porte de la salle panoramique est fermée.
Vous ne portez rien.
```

#### AR-02 — Enfiler la combinaison étanche

_Récit : 14,2 lignes visibles ; boutons du dock tous visibles._

> Combinaison étanche · Enfiler
> Vous enfilez la combinaison étanche et verrouillez le casque. Le joint se plaque ; votre souffle résonne contre la visière.

```text
Vous êtes dans le local de sécurité.
Vous voyez ici un casier mural et une découpeuse de maintenance.
La porte des cabines du personnel est ouverte.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche.
```

#### AR-02 — Aperçu « Baie extérieure › Percer »

_Récit : 11,1 lignes visibles ; boutons du dock tous visibles._

> Aller vers · salle panoramique
> Vous franchissez la porte de la salle panoramique. Vous entrez dans la salle panoramique.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans la salle panoramique.
Vous voyez ici une baie extérieure et un kit de brèche.
La porte des cabines du personnel est ouverte.
La porte grippée de la salle d’embarquement est fermée.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
```

#### AR-02 — Percer la baie extérieure à la découpeuse

_Récit : 11,1 lignes visibles ; boutons du dock tous visibles._

> Baie extérieure · Percer
> Le disque mord dans la baie extérieure. Le verre cède d’un coup ; l’air file par la brèche.
> Les voyants passent au rouge : plus d’air dans les cabines du personnel, le local de sécurité et la salle panoramique.

```text
Vous êtes dans la salle panoramique.
Vous voyez ici une baie extérieure et un kit de brèche.
La porte des cabines du personnel est ouverte.
Le voyant de la porte des cabines du personnel est rouge : plus d’air de l’autre côté.
La porte grippée de la salle d’embarquement est fermée.
Il n’y a plus d’air ici.
La baie extérieure est percée : l’espace est à nu.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
```

#### AR-02 — Aller dans la salle d’embarquement

_Récit : 10,4 lignes visibles ; boutons du dock tous visibles._

> Aller vers · salle d’embarquement
> Vous passez par la porte grippée de la salle d’embarquement. Vous voici dans la salle d’embarquement.
> Vous n’étiez encore jamais venu ici.
> Au sol, une masse plus haute qu’un homme, sans yeux, ne bouge plus.

```text
Vous êtes dans la salle d’embarquement.
Vous voyez ici une capsule de secours.
La porte grippée de la salle panoramique est ouverte.
Le voyant de la porte grippée de la salle panoramique est rouge : plus d’air de l’autre côté.
L’écoutille de la cabine de la capsule est fermée.
Il n’y a plus d’air ici.
Une créature gît ici, inerte.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
```

#### AR-02 — Fin : « La capsule s’est détachée. Vous avez quitté la station. »

_Récit : 23,2 lignes visibles ; boutons du dock tous visibles._

> Pupitre de départ · Lancer
> La capsule part sur sa propre réserve. Elle se détache du quai dans un choc sourd. Derrière le hublot, la station s’éloigne.

```text
Vous êtes dans la cabine de la capsule.
Vous voyez ici un pupitre de départ.
L’écoutille de la salle d’embarquement est fermée.
Le voyant de l’écoutille de la salle d’embarquement est rouge : plus d’air de l’autre côté.
Votre casque est verrouillé : la combinaison étanche vous protège du vide.
Vous portez la combinaison étanche et la découpeuse de maintenance.
La capsule s’est détachée. Vous avez quitté la station.
```

</details>

### Carte (#97)

**Carte (#97) : réussi.**
AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).

<img src="https://greffeb.github.io/void-walker/pr-129/captures/65.png?v=4aee181" width="200" alt="Carte — départ d’AR-01"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/66.png?v=4aee181" width="200" alt="Carte — au local énergie : pièces visitées, connues, panneau « ? »"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/67.png?v=4aee181" width="200" alt="Carte — fiche de l’atelier : état vu, objets vus"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/68.png?v=4aee181" width="200" alt="Carte — vue liste"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/69.png?v=4aee181" width="200" alt="Carte — texte très grand"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/70.png?v=4aee181" width="200" alt="Carte — départ d’AR-02 : voyants d’air">

<details><summary>Texte affiché à chaque étape</summary>

#### Carte — départ d’AR-01

_Récit : 11,8 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Des sièges de transit vissés en rangs, tous vides. Au plafond, les flèches d’embarquement sont rouges.

```text
Vous êtes dans le salon de transit.
Vous voyez ici un poste d’appel et une signalétique d’évacuation.
La porte de l’atelier maintenance est ouverte.
La cloison du local technique est fermée.
Vous ne portez rien.
```

#### Carte — au local énergie : pièces visitées, connues, panneau « ? »

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — fiche de l’atelier : état vu, objets vus

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — vue liste

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — texte très grand

_Récit : 6,0 lignes visibles ; boutons du dock à faire défiler._

> Aller vers · local énergie
> Vous franchissez la grille. Vous entrez dans le local énergie.
> Rien, ici, ne vous est familier.

```text
Vous êtes dans le local énergie.
Vous voyez ici une console de départ, un bloc d’énergie et un test d’avertisseur.
La cloison du local technique est fermée.
La grille de l’atelier maintenance est ouverte.
La cloison de la baie d’observation est fermée.
Le panneau est fermé.
Vous portez la burette d’huile.
```

#### Carte — départ d’AR-02 : voyants d’air

_Récit : 11,1 lignes visibles ; boutons du dock tous visibles._

> Regarder autour de vous
> Un couloir étroit, bordé de portes de cabines closes. Au-dessus de chaque porte étanche, un voyant dit s’il reste de l’air de l’autre côté.

```text
Vous êtes dans les cabines du personnel.
Vous voyez ici un terminal personnel et une signalétique d’évacuation.
La porte du local de sécurité est ouverte.
La porte de la salle panoramique est fermée.
Vous ne portez rien.
```

</details>

### Plans des stations (#97)

**Plans des stations (#97) : réussi.**
Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. À juger par le porteur avant fusion.

<img src="https://greffeb.github.io/void-walker/pr-129/captures/71.png?v=4aee181" width="200" alt="Plan — ar-01"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/72.png?v=4aee181" width="200" alt="Plan — ar-02"> <img src="https://greffeb.github.io/void-walker/pr-129/captures/73.png?v=4aee181" width="200" alt="Plan — monde-test">

<details><summary>Texte affiché à chaque étape</summary>

#### Plan — ar-01

> 

```text

```

#### Plan — ar-02

> 

```text

```

#### Plan — monde-test

> 

```text

```

</details>
