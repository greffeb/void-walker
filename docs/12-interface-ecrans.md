# Void Walker V2 — interface : description des écrans

> **Statut :** MAQUETTE v1 ACCEPTÉE — D-140 ; choix de revue et réponses aux questions consignés par D-140 à D-155 le 2026-10-10. Aucune implémentation, aucune partie jouée, aucune validation téléphone.
> **Mise à jour :** 2026-10-20 (§3.5, §4.4 et §4.6 : fiche d'un document et « Poser » avec « OÙ ? », #209, D-324, D-328 ; §4.11, écrans de fin, #208, D-281 à D-286).
> **Public :** orchestrateur, exécutant et relecteur pour toute issue d'interface (`app/`, zone orange : fusion après accord du porteur du projet, C-10 §6) ; profils `ui-ux-expert` et `asset-generator` (graphiste) de [04 §3](04-workflow-agentique.md) quand ils seront installés (D-137).
> **Base de comparaison :** branche principale après le Bootstrap #89 (monde de test, interface minimale). Les écarts entre ce document et l'interface actuelle sont listés en §11.
> **Maquette de référence :** [maquette-ui-v1.pdf](maquette/maquette-ui-v1.pdf), 13 écrans exportés du canevas « Void Walker — UI » sur claude.ai. Le PDF montre encore le panneau bas et la bordure `#6B5530` : ce document prime. Il se suffit à lui-même : un agent qui ne voit pas la maquette doit pouvoir reproduire chaque écran.

## 0. Comment lire ce document

Chaque choix porte un marqueur :

- **[Validé]** — demandé ou approuvé explicitement par le porteur du projet pendant la revue de maquette (voir §8).
- **[Proposé]** — choix de la maquette, non contesté mais non arbitré. L'agent UI peut l'ajuster s'il conserve l'intention et le justifie dans sa PR ; un changement d'intention repasse par le porteur du projet.
- **[Ouvert]** — à arbitrer avant implémentation. Ne pas trancher seul (voir §9).

Les contrats C-01 à C-10 et le [journal des décisions](03-decisions.md) priment sur ce document. En cas d'écart, le signaler (§9) au lieu de choisir silencieusement.

Les textes cités viennent de la maquette (salon de transit, atelier de service). Ce sont des exemples, pas des textes finaux ([C-07 §6](contrats/C-07-textes.md)). Les vrais noms viennent des stations et suivent NP-04 : un objet porte le même nom partout.

## 1. Principes transverses

1. **Téléphone en portrait, une main.** Référence 390 × 844 px CSS. Mise en page fluide en largeur (320 à 430 px) ; la zone de récit absorbe les variations de hauteur jusqu'à six lignes, puis le dock défile (D-191). Pas de fausse barre d'état. [Validé]
2. **Le pouce agit en bas, l'œil lit en haut.** Tout ce qui agit (objets, déplacements, navigation, confirmation) est dans la moitié basse. En haut, un seul contrôle, rarement utilisé : l'engrenage des options. [Validé]
3. **Gratuit ou engageant** (D-014, [C-01 §5](contrats/C-01-actions-observation.md)). Ouvrir une fiche, une bulle, la carte, IA Station ou les options n'a aucun effet sur le monde. Annuler est toujours possible, sans effet. Une action engageante passe par un aperçu puis CONFIRMER ; prendre, poser et changer de pièce se jouent d'un seul toucher quand l'aperçu n'annoncerait ni risque connu ni coût ; ouvrir et fermer une porte gardent toujours l'aperçu. [Validé D-182, remplaçant « toute action engageante, déplacement compris, passe par un aperçu »] Exception : « Poser » un objet déplaçable dans une pièce qui a des positions demande d'abord où le poser (§3.5, D-328).
4. **Un nom par chose** (NP-04). Même libellé dans le récit, le dock, la bulle, la carte et le rappel d'action. Les puces d'objet affichent le nom avec une majuscule initiale (« Burette d'huile ») ; titres de pièce et boutons de déplacement passent en capitales par le style uniquement ; le nom enregistré (en minuscules, avec genre et élision, NP-02) reste identique.
5. **Aucun chiffre de jeu.** Ni points de vie, ni pourcentage, ni dé, ni score, ni niveau, ni compteur d'actions. Le marqueur de créature de la carte est lui aussi écrit en mots (§4.8). [Validé] Exception : les chiffres écrits dans un document trouvé dans la station (journal, relevé, étiquette), qui font partie du décor et jamais du jeu (D-323, livraison 3 des grandes stations).
6. **Jamais la couleur seule.** Chaque état est porté par un mot et une forme (§2.6).
7. **Taille du texte réglable**, trois niveaux (§4.10). [Validé]
8. **Textes** en français, au vouvoiement, deux à quatre phrases après une action (C-07). Le personnage est un homme : accords au masculin (« Vous êtes blessé »). [Validé]

## 2. Direction artistique « Phosphore » [Validé]

Terminal CRT ambre, police à chasse fixe, sobre. La lecture prime : l'effet rétro ne doit jamais coûter de lisibilité.

### 2.1 Couleurs

| Jeton | Valeur | Usage | Contraste sur `fond` |
| --- | --- | --- | --- |
| `fond` | `#0A0907` | Fond de tous les écrans | — |
| `surface` | `#14100A` | Bulle de composition | — |
| `surface-2` | `#110E09` | Modale IA Station (remplacé par `blanc-surface`, D-192) | — |
| `texte` | `#F4C27A` | Texte courant, puces, boutons secondaires | 12,2:1 |
| `accent` | `#FFB23F` | Titres de pièce, titres de bulle, bordure de bulle, badge de santé, éléments actifs | 11,1:1 |
| `texte-secondaire` | `#B08850` | Rappels, positions, libellés, raisons d'indisponibilité | 6,1:1 |
| `signal` | `#FFD08A` | Bruits perçus, paroles d'IA Station dans le récit | 13,9:1 |
| `bordure` | `#76603A` | Contours des puces et boutons | 3,3:1 |
| `séparateur` | `#4A3A20` | Filets décoratifs seulement | 1,8:1 |

- **Vidéo inverse :** texte `#0A0907` sur fond `texte` ou `accent` (12,2:1 et 11,1:1). Réservée à l'action principale, à l'élément sélectionné et aux étiquettes d'état.
- **Voiles :** `rgba(10, 9, 7, 0.35)` derrière une bulle, `rgba(10, 9, 7, 0.55)` derrière une modale.
- **Bordure :** `#76603A` (3,3:1 sur `fond`, 3,2:1 sur `surface`) respecte le seuil de 3:1 des composants (WCAG 1.4.11). Elle remplace le `#6B5530` de la maquette (2,8:1), que le canevas utilise encore. [Validé]
- Pas de dégradé décoratif. Pas de rouge ni de vert : l'écran de jeu reste dans la gamme ambre. Exception (D-176) : chaque menu peut avoir sa couleur ; la bulle d'inventaire est cyan, la fenêtre d'IA Station blanche (D-192), la carte verte (D-211, jetons en [14 §2.2](14-carte.md)). Exception (D-233) : la phrase d'un danger apparu s'écrit en rouge `alerte` `#FF5A4A` (6,5:1 sur `fond`), précédée d'un triangle d'attention (§3.3). Sur la carte, le même rouge dessine l'œil de la créature vue (D-273, [14 §2.5](14-carte.md)).

| Jeton | Valeur | Usage | Contraste sur `cyan-surface` |
| --- | --- | --- | --- |
| `cyan` | `#4FE6F0` | Contour, titre et puce choisie de la bulle d'inventaire | 12,4:1 |
| `cyan-texte` | `#A6F6FA` | Texte de la bulle d'inventaire | 15,4:1 |
| `cyan-secondaire` | `#3AA7AE` | Contours des puces et raisons dans la bulle | 6,5:1 |
| `cyan-surface` | `#061416` | Fond de la bulle d'inventaire | — |

Blanc froid à peine bleuté de la fenêtre d'IA Station (D-192), valeurs à juger sur téléphone :

| Jeton | Valeur | Usage | Contraste sur `blanc-surface` |
| --- | --- | --- | --- |
| `blanc` | `#EEF6F8` | Contour, titre, NOUVEAU et RETOUR de la fenêtre | 17,7:1 |
| `blanc-texte` | `#DCE8EC` | Citations de la fenêtre | 15,5:1 |
| `blanc-secondaire` | `#8C9CA2` | Repères de moment, sous-titre, filets | 6,8:1 |
| `blanc-surface` | `#0A0E0F` | Fond de la fenêtre | — |

### 2.2 Typographie

Une seule famille : **IBM Plex Mono** (licence OFL, Google Fonts), en 400, 600 et 400 italique. À embarquer dans la PWA pour le jeu hors ligne. [Proposé]

| Style | Taille / graisse | Détails |
| --- | --- | --- |
| Titre d'accueil | 40 / 600 | Capitales, interlettrage 0,06 em, `accent`, sur deux lignes |
| Titre de pièce | 17 / 600 | Capitales, interlettrage 0,04 em, `accent` |
| Position | 13 / 400 | `texte-secondaire`, préfixe « > » |
| Rappel d'action | 14 / 400 | `texte-secondaire`, préfixe « > » |
| Récit | 17 / 400, interligne 1,6 | 19 ou 22 selon le réglage |
| Bruit perçu | 15 / 400 italique, interligne 1,5 | `signal` |
| Titre de section | 13 / 400 | `texte-secondaire`, forme « ── DANS LA PIÈCE ──── » |
| Puce d'objet | 15 / 400 | Préfixe « ▸ » |
| Bouton de déplacement | 15 / 600 | Capitales, vidéo inverse, préfixe « → » |
| Navigation | 13 / 400 | Capitales, interlettrage 0,04 em |
| Bouton principal | 15–16 / 600 | Capitales, interlettrage 0,06 em |
| Petit texte | 12 / 400 | Étiquettes, qualités, horodatages ; jamais en dessous |

### 2.3 Lignes de balayage

Lignes horizontales sur tout l'écran : 1 px noir à 22 % d'opacité toutes les 3 px (`repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 1px, transparent 1px 3px)`). Couche non interactive (`pointer-events: none`), masquée aux lecteurs d'écran, désactivable dans les options. Ni scintillement ni distorsion. Toute animation future respecte `prefers-reduced-motion`. [Proposé]

### 2.4 Glyphes du terminal

| Glyphe | Sens |
| --- | --- |
| `>` | Rappel d'action, position, horodatage d'un message |
| `▸` | Élément manipulable : objet, action disponible |
| `→` | Se déplacer vers, passage |
| `↑` | Sur la carte : sortie vers une pièce non visitée |
| `⊘` | Action indisponible ; action dangereuse dans les options |
| `[ … ]` | Étiquette : qualités `[stable]`, coûts `[bruyant]`, interlocuteur `[ IA STATION ]`, destination inconnue `[→ ?]` |
| `── TITRE ──` | Titre de section |
| `▮` | Curseur décoratif (titre d'accueil) ; curseur clignotant à la fin du dernier texte apparu (§3.3, D-186) |
| `!` / `!!` | Blessé / critique |
| `‹` / `✕` | Étape précédente / annuler, dans une bulle |

### 2.5 Icônes

Deux icônes seulement, au trait (1,8 px), 20 à 22 px, couleur du texte : **engrenage** (options) et **oreille** (bruit perçu). La barre de navigation et les boutons n'ont pas de pictogramme ; le reste passe par les glyphes. [Validé]

### 2.6 Information sans couleur

| Information | Mot | Forme |
| --- | --- | --- |
| Santé | BLESSÉ / CRITIQUE | « ! » plein inversé / « !! » contour ; rien si indemne |
| Nouveau message | « nouveau message » lu par le lecteur d'écran, une fois ; NOUVEAU dans l'historique | « ! » gras à cheval sur le bord haut de IA STATION, côté droit, qui pulse (fixe en mouvement réduit) [Validé D-263] |
| Élément sélectionné | — | Vidéo inverse |
| Action indisponible | Raison (« hors de portée ») | « ⊘ », filet pointillé |
| Air derrière une porte étanche | AIR / VIDE | « ● » plein / « ○ » vide |
| Risque | aucun connu, faible, modéré, élevé, mortel | Mot en gras dans l'aperçu |
| Pièce actuelle sur la carte | « vous êtes ici » | Double trait |
| Dernier état vu | « vu il y a un moment » | Texte dans la pièce |

### 2.7 Formes et espacements

Angles droits partout (rayon 0). Bordures de 1 px. La bulle a une bordure `accent` et un halo de 4 px couleur `fond` ; pas d'ombre douce. Marges latérales 16 px, gouttières 6 à 8 px, pas de 4 px. Cibles tactiles : au moins 44 × 44 px, lignes de liste 44, puces 46, boutons de déplacement 46, navigation 48, boutons principaux 50 (D-191 : quelques pixels de moins partout, jamais sous 44).

## 3. Composants réutilisables

### 3.1 Structure de l'écran de jeu

De haut en bas, en colonne : en-tête de pièce (environ 56 px), zone de récit (prend la place restante et défile), dock « Dans la pièce », barre de navigation. Les lignes de balayage couvrent le tout. La limite entre le récit et le dock se place toute seule : le dock prend la hauteur qu'il faut pour montrer tous ses boutons, le récit garde le reste et jamais moins de six lignes de texte, à sa taille (texte agrandi compris). Seulement si les boutons ne tiennent pas à côté de ces six lignes, le dock défile. Pas de limite déplaçable au doigt. [Validé D-191]

### 3.2 En-tête de pièce

- **À gauche :** nom de la pièce (style « titre de pièce »), avec la position en dessous : « > devant la porte du Salon de transit ». Pas de préfixe « Vous : ». [Validé]
- **À droite :** le badge de santé s'il y a lieu, puis le bouton Options (engrenage, 44 × 44, libellé accessible « Options »). L'engrenage remplace le menu hamburger. [Validé]
- Filet `séparateur` en bas.

**Badge de santé.** Absent si le personnage est indemne. [Validé] Blessé : « ! BLESSÉ » en vidéo inverse sur `accent`. Critique : « !! CRITIQUE » en `accent` sur `fond`, contour de 2 px. Hauteur 32 px, `role="status"`, libellé « État : blessé ». La défaite n'a pas de badge : elle mène à l'écran de fin. [Proposé pour la forme]

### 3.3 Zone de récit

Dans cet ordre :

1. **Rappel de la dernière action**, en `texte-secondaire` : objet · action · paramètre, par exemple « > Caisse · Déplacer · sous la grille haute ». [Validé] Pour un déplacement : « > ALLER VERS · ATELIER DE SERVICE ». Pour l'arrivée dans le jeu : « > REGARDER AUTOUR DE VOUS ».
2. **Récit** : deux à quatre phrases (C-07). Quand l'alarme du feu ou du vide sonne, la ligne qui décrit ce danger s'écrit en rouge `alerte`, précédée d'un petit triangle d'attention qui clignote deux fois par seconde, fixe en mouvement réduit ; le texte ne clignote pas. Si aucune phrase du récit ne décrit le danger (entrée dans une pièce sans air, voyant rouge apparu), la ligne de « Regarder autour de vous » qui le décrit est ajoutée. Le lecteur d'écran lit « Attention » avant la ligne. [Validé D-233]
3. **Ligne de bruit** : icône oreille, puis une phrase en italique `signal`, par exemple « Quelque chose bouge derrière la porte du Salon de transit. » [Validé] Le texte nomme le passage, jamais une position (OP-01). Sans bruit : même ligne en `texte-secondaire`, « Vous n'entendez rien de particulier. » [Proposé]
4. **Message d'IA Station** : rien dans le récit en cours de partie. Un message qui arrive s'annonce par le repère du bouton IA STATION (§3.9, §4.3) ; il se lit dans la modale (§3.9). Au réveil et à la fin de la partie, la navigation n'étant pas (encore ou plus) là, le message est cité en entier sous le récit, dans l'encadré d'IA Station (§4.2). Aucun lien « parle dans l'écouteur ». [Validé D-192, D-263 : le lien du récit est retiré ; à la fin, le message de départ s'écrit à sa place]
5. **Encadré « Ce qui change »** après une action dont l'effet est notable (§3.10).

**Machine à écrire** [Validé D-186] : tout nouveau texte (rappel, récit, bruit, parole d'IA Station au réveil et à la fin) s'écrit caractère par caractère, dans l'ordre de lecture, en 500 ms au total. Puis un curseur `▮` clignote lentement à la fin du dernier texte apparu ; un seul curseur à l'écran. Toucher un bouton pendant l'écriture agit normalement et affiche le texte en entier. Un texte déjà affiché n'est pas réécrit. Le lecteur d'écran reçoit le texte entier une fois ; le curseur lui est masqué. La place du texte final est réservée dès le début.

### 3.4 Dock « Dans la pièce »

- Filet pointillé au-dessus. Pas de consigne « Touchez pour agir ». [Validé]
- Titre « ── DANS LA PIÈCE ── ».
- **Puces d'objet** sur deux colonnes : « ▸ Nom », hauteur 46 px minimum, contour `bordure`, retour à la ligne permis (« Bidon d'eau d'extinction »). Toucher une puce ouvre la bulle de composition (§3.5). Ordre : celui de la description de la pièce. [Proposé]
- Titre « ── SE DÉPLACER VERS ── » (remplace « Sorties »). [Validé]
- **Lignes de salle** : une par passage connu, sur une colonne, hauteur 48 px. À gauche, le nom en vidéo inverse, « → NOM DE LA DESTINATION » ; à droite, la commande de la porte (112 px), qui dit son état avec un témoin : « □ FERMÉE », « ■ OUVERTE ». Les portes n'ont pas de puce dans « Dans la pièce ». [Validé D-267, [maquette](maquette/portes.html)]
- **Toucher le nom** : le déplacement se joue d'un seul toucher, sans aperçu, même avec un risque connu ou un coût. Sans gravité, loin du passage, il fait « Dériver jusqu'à… » ; au bord, il fait passer. [Validé D-267]
- **Toucher l'état** : la porte s'ouvre ou se ferme d'un seul toucher, sans aperçu ; le récit dit ce qui se passe. Lue comme un bouton à bascule : « Porte de l'atelier, fermée ». Une porte qu'on ne peut pas manœuvrer montre sa commande grisée, pointillée, avec sa raison (§3.7). [Validé D-267]
- **Déplacement impossible** (porte fermée, objet porté trop large, pas de pont) : le nom est en pointillé, sans fond, et reste activable ; le toucher ne joue rien, le récit dit la raison et le son « indisponible » retentit. [Validé D-267]
- **Passage sans porte à manœuvrer** (vide d'une passerelle, passage toujours ouvert) : pas de commande, le nom prend toute la largeur. [Validé D-267]
- **Repères de danger** sur la ligne, à droite du nom, petites capitales encadrées, filet gauche couleur danger : « VIDE » (voyant d'une porte étanche), « FEU » (vu par la porte ouverte, disparaît quand elle se ferme), « BRUIT » (la créature a bougé derrière, disparaît à l'action suivante). Le lecteur d'écran les lit avec le nom. Pas d'autre voyant d'air : l'air reste sur la carte. [Validé D-267]
- **Passage sans signalétique** (grille haute, conduit) : il rejoint « Se déplacer vers » une fois ouvert, et y reste même refermé ; avant, il n'est qu'une puce d'objet. Tant que sa destination n'est pas découverte, le bouton porte le nom du passage, « → GRILLE HAUTE » (OP-03). [Validé D-147, D-229]

### 3.5 Bulle de composition

Superposition légère, pas une grande modale. [Validé] Le porteur du projet en a esquissé le modèle dans la maquette : petit menu d'actions près de l'objet touché.

- **Ouverture :** toucher une puce d'objet. Les lignes de « Se déplacer vers » n'ouvrent plus de bulle (D-267). La puce passe en vidéo inverse. L'écran reste visible derrière un voile de 35 %.
- **Placement :** au-dessus de la puce touchée, avec une flèche (losange de 12 px) qui la pointe. Alignée à gauche pour la colonne de gauche, à droite pour celle de droite, à 16 px des bords. Elle ne sort jamais de l'écran ; si la place manque au-dessus, elle s'ouvre en dessous. [Proposé]
- **Largeur qui suit l'étape :** environ 230 px pour les actions, 300 pour le paramètre, pleine largeur moins les marges pour l'aperçu.
- **En-tête :**
  - « ‹ » étape précédente (44 × 44), à partir de la deuxième étape ;
  - le fil de la composition en `accent` 15/600 : « CAISSE », puis « CAISSE › DÉPLACER », puis « CAISSE › DÉPLACER › sous la grille haute » ;
  - à la première étape, les qualités de l'objet sous le nom : « [stable] [encombrant] » (c'est la fiche, gratuite) ;
  - « ✕ » annuler (44 × 44).
- **Étape 1, action :** une ligne par manipulation plausible, « ▸ Déplacer », « ▸ Monter dessus », « ▸ Prendre », hauteur 44 px, filets entre les lignes. Les actions indisponibles restent visibles (§3.7).
- **Étape 2, paramètre :** libellé « OÙ ? », puis une ligne par position ou cible. Selon l'action, le libellé peut devenir « SUR QUOI ? » ou « AVEC QUOI ? ». [Proposé] Une action sans paramètre saute cette étape. « Poser » un objet déplaçable dans une pièce qui a des positions (la caisse, dans l'atelier de M-02) passe aussi par « OÙ ? » : un seul geste pose la caisse « sous la grille », sans « Poser » puis « Déplacer ». [Proposé D-328, sur demande du porteur]
- **Étape 3, aperçu** (§3.8), puis deux boutons : ANNULER (un tiers de la largeur, contour) et CONFIRMER (deux tiers, vidéo inverse).
- **Un seul toucher :** prendre ou poser sans risque connu ni coût n'a pas d'aperçu : toucher la ligne joue l'action et referme la bulle. Le lecteur d'écran lit « Prendre, sans confirmation ». Ouvrir ou fermer une porte n'en a jamais, même dans une bulle (l'écoutille au pupitre). [Validé D-182, D-267] Exception : « Poser » un objet déplaçable dans une pièce qui a des positions a un paramètre, donc l'étape « OÙ ? » ; les autres objets gardent leur toucher unique. [Proposé D-328, sur demande du porteur]
- **Pupitre de départ :** sa bulle offre aussi « ▸ Fermer l'écoutille » ou « ▸ Ouvrir l'écoutille », au-dessus de « ▸ Lancer » ; mêmes options que le bouton du bas, seule exception à la place unique de §3.4. [Validé D-266]
- **Fiche d'un document :** note, journal, message, inscription ou affiche, un document est un objet fixe dont la puce ouvre une bulle sans action ni confirmation. La fiche montre le support en capitales et la ligne « où » en tête, puis le corps dans la typographie du support ; la pièce nommée par une note de rangement est soulignée en pointillé. Lire est gratuit (D-014) et rien n'est enregistré. Détail au §4.4. [Validé D-324, variante B de la [maquette](maquette/documents.html)]
- **Fermer sans effet :** « ✕ », ANNULER, toucher hors de la bulle, retour système. [Proposé]
- La phrase « Rien ne se passe avant confirmation » est retirée. [Validé]

### 3.6 Bulles partout

Fiches d'objet, choix d'action et aperçus, déplacement compris, utilisent la bulle de §3.5, ancrée sur l'élément touché. Le panneau bas de la maquette (poste d'appel, aperçu de déplacement) est abandonné. [Validé D-146]

- Une fiche longue (poste d'appel) prend toute la largeur moins les marges et défile à l'intérieur de la bulle si besoin. [Proposé]

### 3.7 Action indisponible

Selon [C-01 §4](contrats/C-01-actions-observation.md) : l'option reste visible avec une raison publique courte. [Validé]

- Ligne en `texte-secondaire` : « ⊘ Ouvrir » à gauche, raison à droite (« hors de portée »), filet pointillé.
- Pas de texte barré : le barré n'a pas été compris. [Validé]
- Non activable (`disabled`, `aria-disabled`). Le lecteur d'écran lit « Ouvrir, indisponible : hors de portée ».
- La raison ne nomme jamais l'objet qui résoudrait le problème et ne révèle aucun secret.

### 3.8 Aperçu d'action

Grille de deux colonnes : libellé en capitales `texte-secondaire`, puis valeur.

| Ligne | Contenu | Exemple |
| --- | --- | --- |
| RISQUE | Niveau en gras `accent`, puis le danger connu ; ligne absente s'il n'y a aucun risque connu | « **faible** — effort, aucune blessure attendue » |
| COÛT | `[bruyant]` ; ligne absente s'il n'y a aucun coût | « [bruyant] » |
| SAVOIR | Une ou deux phrases sur les conséquences connues ; toujours affiché | « La caisse restera sous la grille haute. La porte du Salon de transit est ouverte : le bruit peut porter. » |

- Les lignes RISQUE et COÛT n'apparaissent que si elles disent autre chose que « aucun » : ni « aucun risque connu » ni « coût aucun » à l'écran, ni pour le lecteur d'écran. Un aperçu sans risque ni coût montre seulement SAVOIR, puis ANNULER / CONFIRMER. Le un seul toucher se décide toujours sur l'aperçu du moteur, pas sur ce qui est affiché (D-182). La CLI garde ses trois lignes. [Validé D-187]
- Seul coût affiché : `[bruyant]`. Les étiquettes `[long]` et `[périlleux]` de la maquette sont supprimées ; le danger passe par le niveau de risque. [Validé D-150]
- Échelle de risque : aucun risque connu, faible, modéré, élevé, mortel (C-04 §3.1 pour le vide). Une conséquence sans dé s'annonce comme certaine (C-04 §5), par exemple « certain : vous serez blessé ». [Proposé]
- Ni pourcentage ni chiffre (C-04 §4.3). L'aperçu ne se calcule que sur ce que le passager sait (C-06 §4).

### 3.9 Modale IA Station

Nom affiché « IA Station » (remplace « assistance »). C'est une bulle avec une croix de fermeture dans l'en-tête, comme les autres menus. [Validé D-228, remplaçant le bouton « Retour »] Elle est blanche, comme l'inventaire est cyan (§2.1). [Validé D-192, remplaçant `surface-2`, `texte`, `accent` et `signal` dans cette modale]

- Même bulle superposée que l'inventaire et la carte : voile de 35 %, à 16 px des côtés et 12 px au-dessus de la navigation, flèche vers le bouton IA STATION. Hauteur au plus de 60 % de l'écran et 420 px. Contour 1 px `blanc`, fond `blanc-surface`. [Validé D-228, remplaçant le voile de 55 % et la boîte à 24 px du bas]
- En-tête : « [ IA STATION ] » en `blanc` 17/600, puis « messages reçus dans l'écouteur » en 12 `blanc-secondaire`.
- Historique chronologique, le plus récent en bas, qui défile. Chaque message a un repère de moment, sans heure : « > au réveil · Salon de transit ». Un message non lu porte l'étiquette NOUVEAU en vidéo inverse. Le texte est en italique `blanc-texte`, entre guillemets.
- Ouvrir la modale fait passer tous les messages reçus en lus ; NOUVEAU reste affiché jusqu'à sa fermeture. Le message du réveil compte comme nouveau, bien qu'il soit cité au réveil. [Validé D-192]
- En haut à droite : croix de fermeture. Un deuxième appui sur IA STATION ferme la bulle, comme pour INVENTAIRE et CARTE, avec le son de fermeture. Toucher le voile ferme aussi ; Échap et le retour système gardent le même effet. [Validé D-228]
- **Repère sur le bouton** tant qu'un message reste non lu : « ! » gras `accent` posé à cheval sur le bord haut de IA STATION, côté droit, hors du flux (le bouton ne bouge pas). Deux pulsations rapides, puis une pause d'une seconde ; fixe et visible en mouvement réduit. Le bouton et son libellé ne clignotent jamais ; le lecteur d'écran lit « IA Station, nouveau message » une fois. [Validé D-263]
- Pas de question ni de réponse sur l'état du monde (D-081, cas K-06).

### 3.10 Encadré « Ce qui change »

Cadre de 1 px `accent`, titre « CE QUI CHANGE » en 12 `texte-secondaire`.

- Ligne d'état si la santé change : « ÉTAT : indemne → BLESSÉ », le nouvel état en vidéo inverse.
- Puis une ligne par changement observable : « La poignée de la grille haute a bougé d'un cran. »
- Seulement quand l'effet est notable (santé, objet déplacé ou cassé, passage ouvert). [Proposé]

### 3.11 Carte d'information du jeu

C'est la voix du système, distincte du récit et d'IA Station, et rare. Fond `texte` plein, texte `fond`, petit titre « INFORMATION DU JEU », titre en capitales 20/600, boutons inversés à l'intérieur. Utilisée pour « plus aucune sortie possible » (§5.2). Peut servir aussi pour l'échec d'enregistrement et la partie incompatible. [Proposé]

### 3.12 Boutons et contrôles

| Type | Apparence | Exemples |
| --- | --- | --- |
| Principal | Vidéo inverse, 50 px | CONFIRMER, REPRENDRE LA PARTIE |
| Secondaire | Contour `texte` | ANNULER, NOUVELLE PARTIE, FERMER |
| Discret | Contour `bordure`, ou texte souligné | OPTIONS, ENVOYER MA PARTIE (fin) |
| Danger | Contour pointillé `accent`, « ⊘ » | Abandonner la partie en cours |
| Groupe segmenté | Boutons radio, valeur active en vidéo inverse | Taille du texte, son |
| Bascule | Valeur « [OUI] » / « [NON] » à droite du libellé | Lignes de balayage |

Tous sont de vrais boutons ou liens, accessibles au clavier et au lecteur d'écran.

## 4. Écrans du parcours

### 4.0 Navigation

| Depuis | Élément touché | Vers |
| --- | --- | --- |
| Accueil | REPRENDRE LA PARTIE | Écran de jeu, état enregistré |
| Accueil | NOUVELLE PARTIE | Réveil |
| Accueil | OPTIONS | Options |
| Réveil | REGARDER AUTOUR DE VOUS | Écran de jeu, pièce de départ |
| Écran de jeu | Puce d'objet | Bulle de composition (ou fiche longue) |
| Écran de jeu | Bouton « → destination » | Aperçu de déplacement |
| Écran de jeu | CARTE | Carte |
| Écran de jeu | IA STATION | Modale IA Station |
| Écran de jeu | Engrenage | Options |
| Aperçu | CONFIRMER | Écran de jeu, résultat de l'action |
| Aperçu, bulle, fiche | ANNULER, ✕, voile | Écran de jeu, inchangé |
| Carte | FERMER LA CARTE | Écran de jeu |
| IA Station | Croix, IA STATION, voile | Écran de jeu |
| Options | MENU PRINCIPAL / REPRENDRE LA PARTIE | Accueil / écran de jeu |
| Options | ABANDONNER (après confirmation) | Fin (abandon) |
| Plus aucune sortie | TERMINER LA PARTIE | Fin (abandon), puis menu principal |
| Écran de jeu, partie finie | CONTINUER | Fin (défaite ou évacuation) |
| Fin | REJOUER CETTE STATION / NOUVELLE PARTIE | Réveil |
| Fin | MENU PRINCIPAL | Accueil |

### 4.1 Accueil

Seulement le titre et trois boutons. Pas de sous-titre. [Validé]

- **Haut :** « VOID » et « WALKER▮ » sur deux lignes (style « titre d'accueil »), à environ 120 px du haut. Nom provisoire du jeu.
- **Bas**, dans la zone du pouce, empilés, à 16 px des côtés, 10 px d'écart, 32 px du bas :
  1. **REPRENDRE LA PARTIE**, principal. Reprend exactement l'état enregistré (C-09). Visible seulement s'il y a une partie en cours (D-089). [Proposé] Si la dernière partie s'est terminée par une défaite, on arrive sur son écran de fin (C-09 S-05).
  2. **NOUVELLE PARTIE**, secondaire. Mène au réveil. S'il n'y a pas de partie en cours, ce bouton devient le principal. [Proposé] Si une partie est en cours, une confirmation s'ouvre dans la page : « Une partie est en cours. La nouvelle partie la remplacera. », ANNULER / COMMENCER. [Validé D-145 ; libellés Proposés]
  3. **OPTIONS**, discret.
- Signaler un bug, envoyer et télécharger la partie sont dans les options. [Validé]

### 4.2 Réveil

Texte seul et un bouton. [Validé]

- **Haut :** « > SALON DE TRANSIT_ » en 13 `texte-secondaire`.
- **Récit long** (autorisé au réveil, D-111), 17 px, interligne 1,65, qui défile si besoin. Le texte du terminal de transit (« CONFINEMENT EN COURS ») est en vidéo inverse.
- **Parole d'IA Station** encadrée, en blanc froid comme la modale (D-198) : contour `blanc`, fond `blanc-surface`, étiquette « [ IA STATION ] » en 12/600 `blanc-secondaire`, citation en italique `blanc-texte`. Ce message entre dans l'historique de la modale.
- **Bas :** REGARDER AUTOUR DE VOUS, principal, pleine largeur. Lire étant gratuit, ce bouton n'engage rien.

Texte d'exemple :

> Le siège se redresse sans prévenir. Au plafond, les flèches d'embarquement sont rouges. Votre terminal de transit affiche : CONFINEMENT EN COURS.
> Puis une voix calme, dans l'écouteur du siège :
> [ IA STATION ] « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »
> Le diagnostic se termine par le carillon habituel d'une annonce d'embarquement. Personne ne se lève.

### 4.3 Écran de jeu, état de départ : Salon de transit

- **En-tête :** SALON DE TRANSIT, « > à votre siège ». Pas de badge (indemne). Engrenage.
- **Récit :** « > REGARDER AUTOUR DE VOUS », puis : « Les flèches d'embarquement restent rouges. Le carillon s'est tu. Dans les autres sièges, personne ne bouge. » Ligne de bruit vide : « Vous n'entendez rien de particulier. »
- **Dock :** ▸ Poste d'appel, ▸ Signalétique d'évacuation. SE DÉPLACER VERS : → ATELIER DE SERVICE, → GALERIE TECHNIQUE.
- **Navigation :** INVENTAIRE · CARTE · IA STATION.

**Déplacement** : toucher « → ATELIER DE SERVICE » fait passer d'un seul toucher, sans aperçu (D-267, remplace D-182 et D-229 sur ce point).

- Bulle ancrée sur le bouton (§3.6, D-146 ; la maquette montre encore un panneau bas) : « ‹ », « ALLER VERS › », puis « ATELIER DE SERVICE » en `accent` 19/600.
- SAVOIR seul, sans ligne RISQUE ni COÛT (aucun risque connu, aucun coût, D-187) : « Vous quitterez le Salon de transit. »
- Boutons ANNULER / CONFIRMER. Pas de phrase « Rien ne se passe avant confirmation ». [Validé]
- CONFIRMER fait le déplacement et mène à l'écran de la pièce d'arrivée.

### 4.4 Fiche d'objet : Poste d'appel

Consultation gratuite (D-014). Elle s'ouvre en touchant la puce, dans une bulle large ancrée sur elle (§3.6, D-146 ; la maquette montre encore un panneau bas).

- **Titre :** « POSTE D'APPEL » en `accent` 19/600.
- **Qualités** en étiquettes : « [fixé au mur] [alimenté] [haut-parleur grésillant] ». Ce sont des qualités déclarées de l'objet (B-044), rédigées pour le joueur.
- **Ce qu'on lit**, dans un cadre « L'ÉCRAN AFFICHE : », sous forme de tableau à deux colonnes, l'état en toutes lettres (pas de texte barré [Validé]) :

  | Poste | État |
  | --- | --- |
  | GALERIE TECHNIQUE | ligne coupée |
  | SALLE D'OBSERVATION | ligne coupée |
  | EMBARQUEMENT | ligne coupée |
  | **LOCAL ÉNERGIE** | **aucune réponse** (en gras `accent`) |

- **Actions plausibles :** « ▸ Appeler un poste », « ▸ Écouter le haut-parleur ».
- **FERMER**, secondaire, pleine largeur.
- Pas de mention « Consulter ne fait rien avancer ». [Validé]

**Variante : fiche d'un document** (grandes stations, #209). [Validé D-324 pour la variante B de la [maquette](maquette/documents.html) ; la typographie en détail est [Proposé]] Un document est un objet fixe, sans qualité : on ne peut que le lire. Sa puce est une puce ordinaire du dock, sans marque. La bulle n'a ni qualités en étiquettes ni action, et lire est gratuit et n'est pas enregistré (D-014).

- **Titre :** le nom de la puce, en `accent` 19/600.
- **En tête, deux lignes :** le support en capitales par le style (note manuscrite, journal de terminal, message enregistré, inscription, affiche de la compagnie), puis la ligne « où » en casse normale, séparée du support par un point médian décoratif que le lecteur d'écran ne lit pas.
- **Le corps, dans la typographie de son support :**

  | Support | Typographie |
  | --- | --- |
  | Note | italique, filet pointillé à gauche, signature à droite |
  | Journal | cadre sous une barre de titre qui reprend le nom de la puce ; colonne d'heures alignée, une ligne par entrée |
  | Message | un paragraphe par segment de parole ; didascalies, entre crochets, en couleur secondaire |
  | Inscription | grandes capitales espacées, légèrement penchées (à plat en mouvement réduit) ; le texte est écrit en casse normale, c'est le style qui le met en capitales |
  | Affiche | double cadre ; la première ligne est le titre, la dernière le pied |

- **Pièce soulignée :** dans une note de rangement, le nom de la pièce désignée est souligné en pointillé partout où il apparaît dans le corps, mot entier seulement. Ni la ligne « où » ni la signature ne sont soulignées, et aucune autre aide ne s'y ajoute : la lecture n'ajoute rien à la carte ni aux connaissances du passager (C-06 §5, exception de D-323).
- **Chiffres :** heures, températures et codes sont permis dans le corps seulement (§1.5) ; jamais dans le titre, le support, la ligne « où » ni la signature.
- **Défilement :** une fiche longue défile dans la bulle (§3.6) ; rien n'indique à l'œil qu'elle défile. [Ouvert, à juger sur téléphone]
- **Lecteur d'écran :** la fiche est la description de la bulle ; il lit le support, la ligne « où », le corps, puis la signature, sans relire le titre de la barre du journal.
- **CLI :** « Regarder » affiche le support, la ligne « où », le corps ligne à ligne (journal : heure, deux espaces, texte), puis la signature.

### 4.5 Écran de jeu : Atelier de service

- **En-tête :** ATELIER DE SERVICE, « > devant la porte du Salon de transit ».
- **Récit :** « > ALLER VERS · ATELIER DE SERVICE », puis : « La porte de l'atelier coulisse à moitié, puis se bloque. L'air sent l'huile froide. Au fond, la grille haute est fermée ; sa poignée est bien au-dessus de votre tête. »
- **Bruit :** « Quelque chose bouge derrière la porte du Salon de transit. »
- **Dock :** ▸ Caisse, ▸ Grille haute, ▸ Bidon d'eau d'extinction, ▸ Burette d'huile, ▸ Trousse de soin. SE DÉPLACER VERS : → SALON DE TRANSIT.
- **Bulle de la grille haute** (exemple d'actions indisponibles), ancrée sur la colonne de droite :
  - en-tête « GRILLE HAUTE », « [fermée] [poignée en hauteur] » ;
  - « ⊘ Ouvrir — hors de portée » ;
  - « ⊘ Tirer la poignée — hors de portée » ;
  - « ▸ Écouter ».

### 4.6 Composer une action : Caisse → Déplacer → sous la grille haute

Parcours de référence du prototype (cas A-03 de C-01).

1. Toucher « ▸ Caisse ». La puce passe en vidéo inverse ; la bulle s'ouvre au-dessus. Fil : CAISSE, « [stable] [encombrant] ». Lignes : ▸ Déplacer, ▸ Monter dessus, ▸ Prendre.
2. Toucher « Déplacer ». Fil : CAISSE › DÉPLACER. « OÙ ? » : ▸ sous la grille haute, ▸ devant la porte du Salon de transit, ▸ au centre de l'atelier.
3. Toucher « sous la grille haute ». Fil : CAISSE › DÉPLACER › sous la grille haute. Aperçu :
   - RISQUE : **faible** — effort, aucune blessure attendue ;
   - COÛT : [bruyant] (la maquette montre aussi [long], supprimé, D-150) ;
   - SAVOIR : La caisse restera sous la grille haute. La porte du Salon de transit est ouverte : le bruit peut porter.
4. CONFIRMER envoie une commande structurée (objet, action, position publique), jamais une phrase. Le moteur résout l'action et enregistre la partie (C-09 SP-02). ANNULER, « ✕ » ou toucher le voile referment sans effet.

Variante pour « Poser » (D-328), dans une grande station : la caisse portée dans l'atelier de M-02 se met sous la grille d'un seul geste. INVENTAIRE › Caisse › Poser ouvre « OÙ ? » (▸ sous la grille, ▸ au centre de la pièce) ; fil « CAISSE › POSER › sous la grille », aperçu « La caisse sera sous la grille. », CONFIRMER ; la grille propose aussitôt « Ouvrir ». Dans une autre pièce, « Poser » reste d'un seul toucher.

### 4.7 Écran de jeu après l'action

- **En-tête :** position mise à jour, « > sous la grille haute ».
- **Récit :** « > Caisse · Déplacer · sous la grille haute » [Validé], puis : « La caisse racle le sol sur toute la longueur de l'atelier. Elle s'arrête sous la grille haute, stable. Le bruit a dû porter loin. »
- **Bruit :** « Derrière la porte du Salon de transit, le mouvement s'est arrêté. »
- **IA Station :** aucun lien dans le récit en cours de partie ; « ! » sur le bord de IA STATION dans la navigation tant que le message n'est pas lu (D-263).
- Dock et navigation comme en §4.5.

### 4.8 Carte

> **Remplacé le 2026-10-12** par la [carte en plan de pont](14-carte.md) (D-201 à D-212) : plan réel de la station en vert phosphore, pièces connues en pointillé, états en motif et étiquette, fiche au toucher, vue LISTE avec les positions en mots. La description ci-dessous reste comme trace de la maquette P08 ; en cas d'écart, le document 14 prime.

Le porteur du projet trouve la carte « pas mal » et la reverra plus tard. [Validé en l'état, à retravailler] Règles de fond : [C-06 §3](contrats/C-06-observation-connaissances.md).

- **En-tête :** « CARTE // RELEVÉ » en `accent` 17/600. À droite, LISTE (44 px) bascule entre plan et liste. La vue liste donne la même information en texte, pour les lecteurs d'écran et les grandes tailles de texte. [Validé]
- **Plan**, environ 430 px de haut, sans grille ni distance (D-015) :
  - **Pièce visitée :** rectangle à trait plein `texte-secondaire` de 2 px, nom en capitales 14/600. Une pièce n'apparaît qu'une fois visitée (D-075).
  - **Pièce actuelle :** double trait `accent` de 3 px, avec « vous êtes ici ».
  - **Liaison entre deux pièces visitées :** deux traits parallèles.
  - **Sortie vue vers une pièce non visitée :** étiquette « [↑ GALERIE TECHNIQUE] » reliée par un pointillé. La pièce n'est pas dessinée (OP-03). La flèche suit la direction de la sortie.
  - **Porte étanche :** sous l'étiquette, « porte étanche · voyant AIR ● » (étiquette en vidéo inverse) ou « VIDE ○ ». Valeur tenue à jour (OP-04).
  - **Passage sans signalétique** (la grille haute, qui est bien un passage [Validé]) : « [→ ?] » relié par un pointillé, sans destination tant qu'elle n'est pas découverte (OP-03).
  - **Pièce hors de vue :** son dernier état vu, en 12 `texte-secondaire` dans le rectangle, par exemple « vu il y a un moment · flèches rouges » (D-076). Un incendie vu s'écrirait « feu ». L'ancienneté se dit en mots, jamais en chiffres : « vu à l'instant », « vu il y a un moment », « vu il y a longtemps ». [Validé] Seuils, en actions confirmées depuis la dernière vue : à l'instant = 1 au plus, il y a un moment = 2 à 5, il y a longtemps = 6 et plus. [Validé D-151]
  - **Dans la pièce actuelle :** les repères utiles, « GRILLE HAUTE fermée », « @ VOUS », « [■] Caisse ».
- **Sous le plan**, « ── ICI ── », puis les positions en mots : « VOUS ........ sous la grille haute », « CAISSE ...... sous la grille haute ».
- **Légende :** « [↑ NOM] sortie vue, pièce non visitée », « [→ ?] passage, destination inconnue », « AIR ● / VIDE ○ voyant de porte étanche ».
- **Bas :** FERMER LA CARTE, secondaire, pleine largeur.
- **Ne pas reproduire :** la maquette écrit « mouvement entendu » dans le salon. C'est contraire à OP-05 et à C-06 §5 : un bruit n'ajoute aucune marque de position sur la carte.
- **Créature vue :** le dernier endroit où elle a été vue est marqué dans la pièce, en mots, avec la même échelle que les états vus : « créature vue ici à l'instant », « … il y a un moment », « … il y a longtemps ». Pas de nombre d'actions. [Validé D-141, OP-05 amendé] La forme graphique du marqueur reste à maquetter.

### 4.9 IA Station

Modale décrite en §3.9. Historique d'exemple :

| Repère | Message |
| --- | --- |
| > au réveil · Salon de transit | « Une capsule de secours est disponible. Son circuit de départ ne répond pas. » |
| > en quittant le Salon de transit | « Vous quittez la zone d'embarquement. Ce déplacement a été noté. » |
| > Atelier de service — NOUVEAU | « Un bruit inhabituel a été enregistré dans l'Atelier de service. Merci de regagner votre siège. » |

Ton froid, calme, un peu décalé ; exact sur les systèmes ; ne dit jamais où est la créature (D-046, D-081).

### 4.10 Options

Écran accessible depuis l'accueil (OPTIONS) et depuis le jeu (engrenage). Il regroupe la taille du texte, le signalement de bug, la gestion de la sauvegarde, le son et l'abandon de la partie en cours. [Validé] Rangé en trois sous-menus (#201) : maquette [options-menus](maquette/options-menus.html). [Validé D-287, D-288]

- **En-tête :** « OPTIONS » en `accent` 17/600, puis « le jeu est en pause » en 12.
- **Sommaire**, qui défile si besoin : trois lignes, chacune avec son détail en dessous, puis l'abandon. [Validé D-287]
  - « ▸ Son et texte », « taille du texte, son, affichage » ;
  - « ▸ Rapports », « signaler un bug, envoyer ou télécharger ma partie » (« signaler un bug, envoyer ma partie » pour une partie finie, « signaler un bug » sans partie) ;
  - « ▸ Application », « installation, mise à jour, version » (« mise à jour, version » quand le navigateur ne permet pas d'installer le jeu) ;
  - « ⊘ Abandonner la partie en cours », bouton danger. Il ouvre une confirmation dans la page : « Abandonner ? Cette partie ne pourra pas être reprise. », ANNULER / ABANDONNER. ABANDONNER mène à l'écran de fin, version abandon (C-08 §4).
- **Sous-menu en bulle** : toucher une ligne ouvre la bulle ambre des menus (§2.7), titrée « SON ET TEXTE », « RAPPORTS » ou « APPLICATION », avec ✕. Elle survole le sommaire voilé, sous l'en-tête, sans flèche ; sa hauteur suit son contenu jusqu'au bas, au-delà il défile. ✕, le voile, Échap et le retour du téléphone la referment ; le focus revient sur la ligne touchée. [Validé D-288]
- **Son et texte**, par sections :
  1. **── TAILLE DU TEXTE ──** : groupe segmenté STANDARD / GRANDE / TRÈS GRANDE, puis un aperçu d'une phrase de récit à la taille choisie (17, 19 ou 22 px). [Validé]
  2. **── SON ──** : trois rails de 0 à 100, « Général » 80, « Effets sonores » 80, « Ambiance » 60 par défaut (D-223) ; à 0, « COUPÉE » ou « COUPÉS ». [Validé D-220, remplaçant « Ambiance » COUPÉE / BASSE / NORMALE et « Effets sonores » COUPÉS / ACTIFS] Bruitages du terminal synthétisés pour le projet (D-216, D-217), signaux de blessure, de soin et d'alarme (D-218), ambiance de bruit brun et de carlingue (D-219), pas de bande-son pour le moment (D-221) : détail dans [15 — son](15-son.md). IA Station n'a pas de voix : un effet sonore signale l'arrivée d'un message (D-155). Tout reste lisible sans le son.
  3. **── AFFICHAGE ──** : « Lignes de balayage [OUI] / [NON] ». [Proposé] « Effet machine à écrire [OUI] / [NON] », [OUI] par défaut ; sur [NON], texte immédiat et curseur fixe. [Validé D-186]
- **Rapports** :
  1. « ▸ Signaler un bug », avec « la partie en cours est jointe ». La partie est jointe automatiquement (RP-01). [Validé]
  2. « ▸ Envoyer ma partie », avec « partie et commentaire », dans toutes les versions (D-095, D-142). [Validé]
  3. « ▸ Télécharger ma partie », avec en dessous « fichier enregistré sur le téléphone ». C'est l'export de C-09 §5 : le fichier qui rejoue la partie. [Validé]
  4. **── VALIDATION ──**, dans les versions de test seulement : la clé du téléphone (D-232).
  - Pas d'import de partie au lancement (D-149).
- **Application**, par sections :
  1. **── INSTALLATION ── [Proposé, #174, [16](16-installation-pwa.md)]** : « ▸ Installer le jeu », avec en dessous « s’ouvre en plein écran, sans la barre du navigateur ». Sur Chrome, Edge et les autres navigateurs qui le permettent, le bouton ouvre la boîte d’installation du navigateur ; retour « Jeu installé. Cherchez-le sur votre écran d’accueil. » ou « Installation refusée. Le menu du navigateur permet de la relancer. ». Sur Safari (iPhone, iPad) et Firefox (Android), qui ne laissent pas la page lancer l’installation, la ligne dit « marche à suivre pour iPhone et iPad » ou « pour Firefox » et ouvre une bulle « INSTALLER LE JEU » de quatre étapes (3.5, voile, ✕ et Échap). Absente ailleurs et dans l’appli déjà installée ; présente dans les versions de test, dont le nom d’appli porte le numéro de PR.
  2. **── MISE À JOUR ──** : « ▸ Chercher une mise à jour », ou « ▸ Installer la nouvelle version » quand elle est prête, avec en dessous « le jeu redémarre, la partie est gardée » ; retour « Le jeu est à jour. », « Une nouvelle version est prête. » ou « Impossible de vérifier. Le téléphone est-il connecté ? ». Le jeu se met aussi à jour seul. Absente sans service worker. [Validé D-227]
  3. **Pied de page :** « V0.1.0 (365) · e27d220 · test PR #121 » : version, numéro de construction, commit, PR des versions de test ; puis, dans une version de test, l'état de la vérification automatique (#180). [Validé D-191, D-227, D-287]
- **Bas, fixe :** MENU PRINCIPAL (secondaire) et REPRENDRE LA PARTIE (principal), au-dessus du voile : utilisables bulle ouverte (D-288).
- **Sans partie en cours :** masquer Télécharger, Abandonner et REPRENDRE LA PARTIE. [Proposé]
- Les réglages sont conservés sur l'appareil, hors de la sauvegarde de partie. [Proposé]

### 4.11 Fin de partie

Récit seulement, ni score ni étoiles (D-086). [Validé] Maquettes : [fins.html](maquette/fins.html).

- **Arrivée** [Validé D-286] : à l'action qui finit la partie (défaite ou évacuation), l'écran de jeu reste avec son dernier texte, rouge, brouillage et sons compris ; le dock laisse la place à un seul bouton CONTINUER (principal), sans navigation ni engrenage. CONTINUER mène à l'écran de fin. L'abandon y mène directement (§4.10, §5.2). Rouvrir le jeu après une défaite ou une évacuation mène directement à l'écran de fin (C-09 S-05).
- **Haut :** « > FIN DE LA PARTIE_ » en 13 `texte-secondaire`, à 56 px du haut.
- **Titre** en `accent` 24/600, qui reçoit le focus :
  - abandon : « Partie abandonnée. » ;
  - défaite : « Vous n'avez pas atteint la capsule. » ;
  - évacuation : « La capsule s'est détachée. »
- **Récit de la partie** [Validé D-281], 17 px, écrit à la machine (D-186), en paragraphes séparés : le réveil et le premier moment marquant ; les autres moments, trois au plus en tout, dans l'ordre de la partie ; puis la fin.
  - Défaite : la dernière phrase dit la pièce et la cause (créature, feu, froid, vide, ou la créature avec le feu ou le froid), en `accent` [Validé D-282] : « Vous êtes mort dans la salle des pompes, sous ses griffes. »
  - Évacuation : le texte de départ selon ce qui alimentait la capsule, la santé, puis ce que le passager sait de la créature [Validé D-283] ; dessous, le message de départ d'IA Station en entier, dans l'encadré du réveil (D-263).
  - Abandon : « Vous en restez là, dans {le:piece}. »
  - Chaque phrase est écrite à la main en entier sous chacune de ses formes : pièce redite ou non, créature nommée ou reprise (« elle », « l' », « ses »). Aucun pronom n'est substitué par le jeu.
- **Sous un filet pointillé**, pour l'abandon et la défaite : « Cette partie est terminée. Elle ne peut pas être reprise. » (D-013). Pas de liste des pièces visitées, aucun chiffre ni durée [Validé D-284].
- **Boutons :**
  - REJOUER CETTE STATION, principal : même état de départ, nouveaux tirages (D-087, D-088). Pas de mention « même station, nouveaux dés ». [Validé]
  - NOUVELLE PARTIE, secondaire.
  - En dessous, discrets : ENVOYER MA PARTIE (avec « je valide » dans une version de test, sauf après un abandon, D-099) et MENU PRINCIPAL. Pas d'« Exporter ». [Validé]
- **Missions** : quand il y en aura d'autres (#210), une phrase de la mission dira si son objectif est rempli (D-285).

Récit d'exemple, défaite (partie de bot, station `m02-m06-embarquement`) :

> Vous vous êtes réveillé dans le vestibule. Dans la salle panoramique, vous avez vu la créature pour la première fois.
>
> Dans le local de sécurité, elle vous a blessé. Dans le couloir de sécurité, elle vous a grièvement blessé.
>
> Vous êtes mort dans la salle des pompes, sous ses griffes.

## 5. Autres états maquettés

### 5.1 Résultat d'une action risquée

Exemple : « Caisse · Monter dessus · atteindre la poignée de la grille haute », annoncée « risque élevé ».

- **En-tête :** ATELIER DE SERVICE, « > au sol, près de la caisse », badge « ! BLESSÉ », engrenage.
- **Récit :**
  - rappel « > Caisse · Monter dessus · atteindre la poignée de la grille haute » ;
  - en dessous, en 13 `texte-secondaire` : « risque annoncé : élevé » (la maquette ajoute « · [périlleux] », supprimé, D-150) ;
  - récit : « Vous montez sur la caisse et tendez le bras. Vos doigts accrochent la poignée : elle cède d'un cran. Puis la caisse bascule. Votre épaule heurte le sol, et la douleur vous coupe le souffle. »
- **Ce qui change :**
  - « ÉTAT : indemne → BLESSÉ » ; l'épaule n'est dite que dans le récit (D-143) ;
  - « La poignée de la grille haute a bougé d'un cran. » ;
  - « La caisse est renversée sous la grille haute. »
- **Bruit :** « Le choc résonne longtemps dans l'atelier. »
- **Bas :** CONTINUER, principal. Il ramène à l'écran de jeu normal.
- Aucun chiffre de dé, nulle part (C-07 N-04).

### 5.2 Plus aucune sortie possible

Selon C-08 §4 : le jeu le dit honnêtement, ne nomme jamais une sortie restante et laisse continuer.

- **En-tête :** badge « !! CRITIQUE » (cas d'exemple).
- **Récit :** « > Grille haute · Écouter », puis : « Derrière la grille haute, un long sifflement, puis plus rien. Dans le salon, les flèches d'embarquement s'éteignent une à une. »
- **Carte d'information du jeu** (§3.11), en bas, à la place du dock :
  - « INFORMATION DU JEU » ;
  - « PLUS AUCUNE SORTIE POSSIBLE. » ;
  - « Plus aucun chemin ne mène à une capsule de secours. Vous pouvez continuer à jouer et explorer la station. » ;
  - CONTINUER À JOUER (principal, inversé dans la carte) : la carte disparaît et le jeu reprend. Il revient ensuite au joueur d'abandonner depuis les options. [Validé] Un rappel discret « [ plus aucune sortie possible ] » reste en tête du récit jusqu'à la fin de la partie. [Validé D-144]
  - TERMINER LA PARTIE (secondaire). C'est un abandon : il mène à l'écran de fin « Partie abandonnée » (§4.11), puis au menu principal par MENU PRINCIPAL. [Validé] Sous le bouton, remplacer « retour au menu principal » de la maquette par « la partie s'arrête ici ». [Proposé]

## 6. États encore à maquetter

| État | Ce qu'il doit montrer | Source |
| --- | --- | --- |
| Inventaire | Bulle ouverte par INVENTAIRE : objets portés, l'objet encombrant (un seul à la fois) signalé ; toucher un objet ouvre la même composition que dans la pièce | D-079, B-045, D-154 |
| Signaler un bug | Commentaire du joueur, partie jointe, envoi au service, rapport gardé sans réseau | C-10 RP-01, RP-03, PR-01 |
| Envoyer ma partie | Partie complète, commentaire, case « je valide » dans les versions de test | C-10 RP-02, D-130, D-132 |
| Échec d'enregistrement | Avertissement visible et persistant, jeu possible, jamais « sauvegardé » à tort | C-09 §3, S-02 |
| Partie incompatible après mise à jour | Message, puis nouvelle partie proposée ; l'ancienne est perdue | C-09 §4, S-04 |
| Confirmation de nouvelle partie | Confirmation dans la page quand une partie est en cours (§4.1) | D-089, D-145 |
| Premier contact et créature vue | Annonce du premier contact, créature dans la pièce, choix de protection, de diversion ou de fuite | C-03 §4.4, D-025 |
| Risque mortel | Aperçu « mortel » (vide sans combinaison), pièces connues qui perdent l'air | C-04 §3.1, D-071 |
| Créature sur la carte | Forme du marqueur du dernier endroit où elle a été vue (texte en mots, §4.8) | C-06 OP-05, D-141 |
| Carte en vue liste | Même information que le plan, en texte | §4.8 |
| Téléchargement de partie | Retour visible : fichier prêt ou échec | C-09 SP-05 |
| Pièce en feu | Dernier état vu « feu » sur la carte, aperçu des risques du foyer | C-03, D-076 |

## 7. Accessibilité : liste de contrôle

- Contraste du texte d'au moins 4,5:1, et d'au moins 3:1 pour les contours de contrôles (§2.1, bordure à corriger).
- Cibles tactiles d'au moins 44 × 44 px (§2.7). Tout est utilisable d'une main ; aucun geste obligatoire (glisser, appui long) sans équivalent en simple toucher.
- Aucune information portée par la seule couleur (§2.6).
- Trois tailles de texte ; aucune troncature à « très grande » : le texte passe à la ligne, et le dock comme les bulles défilent.
- Vrais éléments HTML : `button`, `a`, groupes radio. Libellés accessibles sur les boutons à icône (« Options »). Annonce des changements du récit au lecteur d'écran (zone `aria-live` polie). Badge de santé en `role="status"`.
- Ordre de lecture : en-tête, récit, bruit, dock, navigation. Dans une bulle ou une modale, le focus y entre, y reste, puis revient sur l'élément d'origine à la fermeture.
- Lignes de balayage désactivables. Pas d'animation non désactivable. `prefers-reduced-motion` respecté. Machine à écrire désactivable, coupée en mouvement réduit ; texte annoncé en entier, jamais lettre par lettre (D-186).
- Langue du document `fr`.

## 8. Choix du porteur du projet pendant la revue de maquette

Revue du 2026-10-10. Ces choix sont consignés dans le [journal des décisions](03-decisions.md) par D-140 à D-149.

| Sujet | Choix | Origine (réponse du porteur du projet) |
| --- | --- | --- |
| Direction artistique | Phosphore (terminal ambre) | « je suis plus attiré par B phosphore » |
| Choix d'interface de la première maquette | Acceptés, sauf retours ci-dessous : pouce en bas, aperçu puis confirmation, composition en trois étapes, indisponibles visibles avec raison, jamais la couleur seule, voix distinctes, carte en plan et en liste, encadré « ce qui change », taille du texte | « bien a part mes retours précédents » |
| Accueil | Seulement REPRENDRE LA PARTIE, NOUVELLE PARTIE et OPTIONS ; pas de sous-titre | « laisser que les boutons "reprendre la partie" et "nouvelle partie" et mettre un bouton "options" » |
| Options | Taille de police, signalement de bug, gestion des sauvegardes, son, abandon de la partie en cours | « réglages comme la taille de police, signalement de bug, gestion des sauvegardes, réglages du son, abandon de la partie en cours » |
| Réveil | Texte seul, un bouton REGARDER AUTOUR DE VOUS | « bien d'avoir que du texte pour faire "intro" et un seul bouton » |
| Assistance | Renommée « IA Station » ; modale ; un seul bouton « Retour » | « renommer l'assistance par "IA Station" », « a mettre comme modale », « bouton nommé "retour" seulement » |
| Santé | Rien quand le personnage est indemne ; affichée seulement s'il est blessé ou pire | « n'afficher du status que si il est blessé ou autre » |
| En-tête | Pas de « Vous : » ; engrenage au lieu du menu hamburger | « retire le "vous:" », « remplacer le bouton de menu hamburger par un engrenage » |
| Récit | Rappel de la dernière action et ligne de bruit avec l'oreille conservés | « bien le rappel de la dernière action », « bien le rappel sur l'état sonore avec la petite oreille » |
| Dock | Pas de « Touchez pour agir » ; « Sorties » devient « Se déplacer vers » ; pas de voyant d'air sur les boutons | « retire le texte "touchez pour agir" », « remplace le texte "sorties" par "se déplacer vers" », « retirer l'indicateur "air" » |
| Navigation | Trois boutons sans pictogramme | « bien les trois boutons en bas sans picto » |
| Fiche | Pas de « Consulter ne fait rien avancer » ; pas de lignes barrées | « retire "Consulter ne fait rien avancer" », « je comprends pas ce que signifie les lignes rayées » |
| Composition | Superposition sur l'écran principal, pas une grande modale ; modèle esquissé à la main dans la maquette | « intégrer ça en superposition par dessus l'écran principal, pas une grosse modale » |
| Aperçus | Pas de « Rien ne se passe avant confirmation » | « retirer "Rien ne se passe avant confirmation" », « retire aussi » |
| Fin | Sans « même station, nouveaux dés » ni « Exporter » | « retire le texte "meme station, nouveaux dés" », « retire exporter » |
| Personnage | Un homme | « homme » |
| Grille haute | C'est un passage | « oui ça le sera, un passage » |
| Déplacement | Aperçu et confirmation | « oui, aperçu et confirmation » |
| Coûts | bruyant, long, périlleux ; puis « long » et « périlleux » supprimés (D-150) | « bruyant long perilleux » |
| Ancienneté d'un état vu | En mots : « à l'instant », « il y a un moment », « il y a longtemps » | « bien » |
| Message d'IA Station | Lien dans le récit et pastille sur la navigation | « lien et pastille bien » |
| Exporter, envoyer, bug | Exporter = télécharger sur le téléphone ; Envoyer ma partie, d'abord vu comme fonction de débogage, reste pour tous (D-142) ; Signaler un bug joint la partie automatiquement | « exporter veux dire télécharger sur téléphone, envoyer sera une feature de débug, et signaler un bug joindra la partie automatiquement » |
| Plus aucune sortie | « Terminer » revient au menu principal ; si l'on continue, c'est au joueur d'abandonner | « terminer reviens au menu principal, si on continue de jouer c'est au joueur d'abandonner » |
| Rejouer une station | Même plan et mêmes positions d'objets, nouveaux dés | « oui » |
| Terminer la partie | Passe par l'écran de fin « Partie abandonnée » avant le menu principal | « oui » (second passage) |
| Créature sur la carte | En mots, pas de nombre d'actions | « on va essayer de garder du texte » |
| Bordure | `#76603A` | « ok pour la bordure » |
| « long » et « périlleux » | Sens à définir plus tard, puis supprimés (D-150) | « j'y réfléchirai plus tard » |

## 9. Écarts et questions

Réponses du porteur du projet du 2026-10-10, consignées dans le journal.

1. **« Envoyer ma partie »** — dans toutes les versions, y compris publique (D-142, confirme D-095). Elle porte aussi la case « je valide » des versions de test (D-132).
2. **Signaler un bug dans les options** — accepté (D-142).
3. **Commentaire écrit dans les rapports** — champ facultatif accepté ; il ne commande jamais le personnage (D-142).
4. **« Terminer la partie »** — passe par l'écran de fin « Partie abandonnée » (C-08 §4, D-086, §5.2).
5. **Marqueur de la créature** — en mots, sans nombre d'actions ; OP-05 amendé (D-141).
6. **« long » et « périlleux »** — supprimés ; seul « bruyant » reste (D-150).
7. **Panneau bas ou bulle** — bulles ancrées partout (D-146, §3.6).
8. **La grille haute dans « Se déplacer vers »** — seulement une fois ouverte (D-147, §3.4).
9. **Son** — ambiance au lancement (D-148) ; IA Station sans voix, un effet sonore à l'arrivée d'un message (D-155) ; bruitages libres de droits et bande-son fournie (D-153). Précisé le 2026-10-13 ([15 — son](15-son.md), D-216 à D-226) : bruitages synthétisés pour le projet, signaux de blessure, de soin et d'alarme, ambiance de bruit brun et de carlingue, trois rails dans les options ; bande-son retirée pour le moment.
10. **Blessure localisée** — seulement dans le récit (D-143).
11. **Rappel de « plus aucune sortie »** — gardé, discret (D-144).
12. **Confirmation avant une nouvelle partie** — oui, elle remplace l'ancienne (D-145, §4.1).
13. **Import d'une partie téléchargée** — pas au lancement (D-149).
14. **Seuils de l'ancienneté** — 1 action au plus / 2 à 5 / 6 et plus (D-151, §4.8).
15. **Inventaire** — bulle ouverte par le bouton INVENTAIRE (D-154). Reste à maquetter en détail par l'agent d'interface, dans ce cadre.

## 10. Correspondance avec la maquette

| Artboard du canevas | Section |
| --- | --- |
| `B-jeu`, `B-carte` | Planches de la direction Phosphore, avant revue (référence de style seulement) |
| `P01-Accueil` | §4.1 |
| `P02-Reveil` | §4.2 |
| `P03-Salon` | §4.3, aperçu de déplacement compris |
| `P04-Poste` | §4.4 |
| `P05-Atelier` | §4.5, bulle de la grille haute comprise |
| `P06-Composer` | §4.6 |
| `P07-Resultat` | §4.7 |
| `P08-Carte` | §4.8 |
| `P09-Assistance` | §4.9, IA Station |
| `P10-Fin` | §4.11, avec réglage abandon, défaite ou évacuation |
| `E1-Risque` | §5.1 |
| `E2-Impasse` | §5.2 |
| `E3-Reglages` | §4.10, options |
| `Main`, `A-carte`, `C-jeu`, `C-carte` | Directions non retenues (Transit, Rapport) : ne pas implémenter |

## 11. Écarts avec l'interface actuelle (Bootstrap #89)

État relevé sur la branche principale après la fusion du Bootstrap : `app/App.tsx`, `app/styles.css`, `content/monde-test/textes.ts`, `engine/vocabulaire.ts`. L'interface y est volontairement minimale (monde de test, hors carte et hors créature). Ce tableau dit ce qu'une issue d'interface devra changer ; il n'autorise pas à le faire hors d'une issue acceptée.

| Sujet | Interface actuelle | Ce document | Remarque |
| --- | --- | --- | --- |
| Style | Police système, palette bleu-gris (`#0b0d10`, `#9fb4c8`), coins arrondis | Phosphore : IBM Plex Mono, palette ambre, angles droits, lignes de balayage (§2) | Racine à 17 px, déjà conforme au récit |
| Démarrage | La partie démarre ou reprend directement | Accueil d'abord : REPRENDRE, NOUVELLE PARTIE, OPTIONS (§4.1) | — |
| Réveil | Texte de réveil dans le récit du premier écran | Écran d'introduction séparé, un seul bouton (§4.2) | — |
| En-tête | « Void Walker » sur chaque écran | Nom de la pièce et position, badge de santé, engrenage (§3.2) | — |
| Situation | Bloc de phrases : « Vous êtes dans la cabine. Vous voyez ici un carnet. La porte est fermée. Vous portez… » | Pièce dans l'en-tête, objets et passages dans le dock (§3.4) | Garder ces phrases pour la CLI et le lecteur d'écran ; le récit reste identique à la CLI (C-06 K-07) |
| Menu | Liste plate de toutes les options : « Regarder la cabine », « Prendre le carnet », « Aller dans l'atelier »… | Options regroupées par objet : toucher l'objet ouvre la bulle (§3.5) ; passages dans « Se déplacer vers » | Le moteur fournit déjà la cible de chaque option : le regroupement relève de l'écran seul |
| Regarder | Bouton comme les autres | Consultation gratuite : c'est la fiche de la bulle, pas une action à confirmer | Déjà une consultation côté moteur (`regarder_*`) |
| Confirmation | Toucher une option l'exécute aussitôt | Aperçu (risque, coût, savoir) puis CONFIRMER, sauf prendre, poser et changer de pièce sans risque connu ni coût, joués d'un seul toucher (§3.8, D-182) | Le moteur ne fournit pas encore d'aperçu : il faudra une issue moteur + écran |
| Indisponible | Bouton grisé, raison en dessous (« La porte est fermée. ») | « ⊘ », raison courte à droite, filet pointillé (§3.7) | Raison publique déjà fournie par le moteur |
| Sauvegarde | Ligne permanente « Partie sauvegardée · 3 action(s) » | Pas de compteur d'actions affiché (§1) ; réussite discrète ou silencieuse, échec toujours visible et persistant (§6) | Garder les attributs `data-testid="sauvegarde"`, `data-actions`, `data-etat` utilisés par les captures (AP-09) |
| Pied de page | Dans le sous-menu Application des options, en petit, en bas : « V0.1.0 (365) · e27d220 · test PR #121 » (#96, D-191, D-227, D-287) ; plus sur l'écran de jeu | Dans les options, en petit, en bas de l'écran [Proposé] | Le numéro de PR reste visible dans les versions de test |
| Reprise impossible | Message d'erreur technique brut, puis « Commencer une nouvelle partie » | Carte d'information du jeu en langage courant (§3.11) ; le détail technique part dans le rapport de bug [Proposé] | C-09 §4 |
| Noms d'objets | Enregistrés en minuscules, avec genre et élision | Puces avec une majuscule initiale à l'affichage (« Carnet ») ; le récit garde l'article et la minuscule | NP-02, NP-04 |
| Accessibilité | Récit en `aria-live="polite"`, boutons natifs | Conforme ; ajouter la gestion du focus des bulles et modales (§7) | — |
| Absents | Carte, son, rapports (options et fin d'abandon : #96, D-200 ; fins de défaite et d'évacuation : #208, D-281 à D-286) | Décrits ici | Hors périmètre du Bootstrap ; une issue chacun. Santé : #101 ; IA Station : #98 |
