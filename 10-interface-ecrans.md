# Void Walker V2 — interface : description des écrans

> **Statut :** MAQUETTE v1 — direction « Phosphore » choisie et retours écran par écran du porteur du projet intégrés le 2026-10-10. Aucune implémentation, aucune partie jouée, aucune validation téléphone.
> **Mise à jour :** 2026-10-10.
> **Public :** agents `ui-ux-expert`, `asset-generator` (graphiste) et exécutants chargés de l'interface PWA.
> **Maquette de référence :** canevas « Void Walker — UI » sur claude.ai (privé tant que le porteur du projet ne l'a pas partagé). Ce document se suffit à lui-même : un agent qui ne voit pas la maquette doit pouvoir reproduire chaque écran.

## 0. Comment lire ce document

Chaque choix porte un marqueur :

- **[Validé]** — demandé ou approuvé explicitement par le porteur du projet pendant la revue de maquette (voir §8).
- **[Proposé]** — choix de la maquette, non contesté mais non arbitré. L'agent UI peut l'ajuster s'il conserve l'intention et le justifie dans sa PR ; un changement d'intention repasse par le porteur du projet.
- **[Ouvert]** — à arbitrer avant implémentation. Ne pas trancher seul (voir §9).

Les contrats C-01 à C-10 et le [journal des décisions](03-decisions.md) priment sur ce document. En cas d'écart, le signaler (§9) au lieu de choisir silencieusement.

Les textes cités viennent de la maquette (salon de transit, atelier de service). Ce sont des exemples, pas des textes finaux ([C-07 §6](contrats/C-07-textes.md)). Les vrais noms viennent des stations et suivent NP-04 : un objet porte le même nom partout.

## 1. Principes transverses

1. **Téléphone en portrait, une main.** Référence 390 × 844 px CSS. Mise en page fluide en largeur (320 à 430 px) ; la zone de récit absorbe les variations de hauteur. Pas de fausse barre d'état. [Validé]
2. **Le pouce agit en bas, l'œil lit en haut.** Tout ce qui agit (objets, déplacements, navigation, confirmation) est dans la moitié basse. En haut, un seul contrôle, rarement utilisé : l'engrenage des options. [Validé]
3. **Gratuit ou engageant** (D-014, [C-01 §5](contrats/C-01-actions-observation.md)). Ouvrir une fiche, une bulle, la carte, IA Station ou les options n'a aucun effet sur le monde. Seul le bouton CONFIRMER d'un aperçu engage une action. Annuler est toujours possible, sans effet. Toute action engageante, déplacement compris, passe par un aperçu puis une confirmation. [Validé]
4. **Un nom par chose** (NP-04). Même libellé dans le récit, le dock, la bulle, la carte et le rappel d'action. Les puces d'objet gardent la casse du nom (« Burette d'huile ») ; titres de pièce et boutons de déplacement passent en capitales par le style uniquement, le nom enregistré reste identique.
5. **Aucun chiffre de jeu.** Ni points de vie, ni pourcentage, ni dé, ni score, ni niveau. Exception contractuelle à cadrer : le marqueur de créature de OP-05 (§9).
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
| `surface-2` | `#110E09` | Panneau bas, modale IA Station | — |
| `texte` | `#F4C27A` | Texte courant, puces, boutons secondaires | 12,2:1 |
| `accent` | `#FFB23F` | Titres de pièce, titres de bulle, bordure de bulle, badge de santé, éléments actifs | 11,1:1 |
| `texte-secondaire` | `#B08850` | Rappels, positions, libellés, raisons d'indisponibilité | 6,1:1 |
| `signal` | `#FFD08A` | Bruits perçus, paroles d'IA Station | 13,9:1 |
| `bordure` | `#6B5530` | Contours des puces et boutons | 2,8:1 |
| `séparateur` | `#4A3A20` | Filets décoratifs seulement | 1,8:1 |

- **Vidéo inverse :** texte `#0A0907` sur fond `texte` ou `accent` (12,2:1 et 11,1:1). Réservée à l'action principale, à l'élément sélectionné et aux étiquettes d'état.
- **Voiles :** `rgba(10, 9, 7, 0.35)` derrière une bulle, `rgba(10, 9, 7, 0.55)` derrière une modale ou sous un panneau bas.
- **Bordure trop faible :** `#6B5530` est sous le seuil de 3:1 des composants (WCAG 1.4.11). Utiliser `#76603A` (3,3:1 sur `fond`, 3,2:1 sur `surface`). [Proposé]
- Pas de dégradé décoratif. Pas de rouge ni de vert : tout l'écran reste dans la gamme ambre.

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
| `▮` | Curseur décoratif (titre d'accueil) |
| `!` / `!!` | Blessé / critique |
| `‹` / `✕` | Étape précédente / annuler, dans une bulle |

### 2.5 Icônes

Deux icônes seulement, au trait (1,8 px), 20 à 22 px, couleur du texte : **engrenage** (options) et **oreille** (bruit perçu). La barre de navigation et les boutons n'ont pas de pictogramme ; le reste passe par les glyphes. [Validé]

### 2.6 Information sans couleur

| Information | Mot | Forme |
| --- | --- | --- |
| Santé | BLESSÉ / CRITIQUE | « ! » plein inversé / « !! » contour ; rien si indemne |
| Nouveau message | « nouveau message » lu par le lecteur d'écran ; NOUVEAU dans l'historique | Carré plein 8 px près de IA STATION |
| Élément sélectionné | — | Vidéo inverse |
| Action indisponible | Raison (« hors de portée ») | « ⊘ », filet pointillé |
| Air derrière une porte étanche | AIR / VIDE | « ● » plein / « ○ » vide |
| Risque | aucun connu, faible, modéré, élevé, mortel | Mot en gras dans l'aperçu |
| Pièce actuelle sur la carte | « vous êtes ici » | Double trait |
| Dernier état vu | « vu il y a un moment » | Texte dans la pièce |

### 2.7 Formes et espacements

Angles droits partout (rayon 0). Bordures de 1 px. La bulle a une bordure `accent` et un halo de 4 px couleur `fond` ; pas d'ombre douce. Marges latérales 16 px, gouttières 6 à 8 px, pas de 4 px. Cibles tactiles : au moins 44 × 44 px, lignes de liste 48, puces 50, boutons de déplacement 50, navigation 52, boutons principaux 54 à 58.

## 3. Composants réutilisables

### 3.1 Structure de l'écran de jeu

De haut en bas, en colonne : en-tête de pièce (environ 64 px), zone de récit (prend la place restante et défile), dock « Dans la pièce », barre de navigation. Les lignes de balayage couvrent le tout. Le dock défile s'il déborde ; il ne prend pas plus d'environ 45 % de la hauteur, pour que le récit garde au moins un tiers de l'écran. [Proposé]

### 3.2 En-tête de pièce

- **À gauche :** nom de la pièce (style « titre de pièce »), avec la position en dessous : « > devant la porte du Salon de transit ». Pas de préfixe « Vous : ». [Validé]
- **À droite :** le badge de santé s'il y a lieu, puis le bouton Options (engrenage, 44 × 44, libellé accessible « Options »). L'engrenage remplace le menu hamburger. [Validé]
- Filet `séparateur` en bas.

**Badge de santé.** Absent si le personnage est indemne. [Validé] Blessé : « ! BLESSÉ » en vidéo inverse sur `accent`. Critique : « !! CRITIQUE » en `accent` sur `fond`, contour de 2 px. Hauteur 32 px, `role="status"`, libellé « État : blessé ». La défaite n'a pas de badge : elle mène à l'écran de fin. [Proposé pour la forme]

### 3.3 Zone de récit

Dans cet ordre :

1. **Rappel de la dernière action**, en `texte-secondaire` : objet · action · paramètre, par exemple « > Caisse · Déplacer · sous la grille haute ». [Validé] Pour un déplacement : « > ALLER VERS · ATELIER DE SERVICE ». Pour l'arrivée dans le jeu : « > REGARDER AUTOUR DE VOUS ».
2. **Récit** : deux à quatre phrases (C-07).
3. **Ligne de bruit** : icône oreille, puis une phrase en italique `signal`, par exemple « Quelque chose bouge derrière la porte du Salon de transit. » [Validé] Le texte nomme le passage, jamais une position (OP-01). Sans bruit : même ligne en `texte-secondaire`, « Vous n'entendez rien de particulier. » [Proposé]
4. **Lien IA Station**, seulement quand un message vient d'arriver : cadre pointillé, « [ IA STATION ] parle dans l'écouteur › ». Ouvre la modale (§3.9). [Validé]
5. **Encadré « Ce qui change »** après une action dont l'effet est notable (§3.10).

### 3.4 Dock « Dans la pièce »

- Filet pointillé au-dessus. Pas de consigne « Touchez pour agir ». [Validé]
- Titre « ── DANS LA PIÈCE ── ».
- **Puces d'objet** sur deux colonnes : « ▸ Nom », hauteur 50 px minimum, contour `bordure`, retour à la ligne permis (« Bidon d'eau d'extinction »). Toucher une puce ouvre la bulle de composition (§3.5). Ordre : celui de la description de la pièce. [Proposé]
- Titre « ── SE DÉPLACER VERS ── » (remplace « Sorties »). [Validé]
- **Boutons de déplacement** : un par passage connu, pleine largeur, vidéo inverse, « → NOM DE LA DESTINATION ». Pas de voyant d'air sur ces boutons : il reste sur la carte. [Validé] Toucher un bouton ouvre l'aperçu de déplacement (§4.3).

### 3.5 Bulle de composition

Superposition légère, pas une grande modale. [Validé] Le porteur du projet en a esquissé le modèle dans la maquette : petit menu d'actions près de l'objet touché.

- **Ouverture :** toucher une puce d'objet. La puce passe en vidéo inverse. L'écran reste visible derrière un voile de 35 %.
- **Placement :** au-dessus de la puce touchée, avec une flèche (losange de 12 px) qui la pointe. Alignée à gauche pour la colonne de gauche, à droite pour celle de droite, à 16 px des bords. Elle ne sort jamais de l'écran ; si la place manque au-dessus, elle s'ouvre en dessous. [Proposé]
- **Largeur qui suit l'étape :** environ 230 px pour les actions, 300 pour le paramètre, pleine largeur moins les marges pour l'aperçu.
- **En-tête :**
  - « ‹ » étape précédente (44 × 44), à partir de la deuxième étape ;
  - le fil de la composition en `accent` 15/600 : « CAISSE », puis « CAISSE › DÉPLACER », puis « CAISSE › DÉPLACER › sous la grille haute » ;
  - à la première étape, les qualités de l'objet sous le nom : « [stable] [encombrant] » (c'est la fiche, gratuite) ;
  - « ✕ » annuler (44 × 44).
- **Étape 1, action :** une ligne par manipulation plausible, « ▸ Déplacer », « ▸ Monter dessus », « ▸ Prendre », hauteur 48 px, filets entre les lignes. Les actions indisponibles restent visibles (§3.7).
- **Étape 2, paramètre :** libellé « OÙ ? », puis une ligne par position ou cible. Selon l'action, le libellé peut devenir « SUR QUOI ? » ou « AVEC QUOI ? ». [Proposé] Une action sans paramètre saute cette étape.
- **Étape 3, aperçu** (§3.8), puis deux boutons : ANNULER (un tiers de la largeur, contour) et CONFIRMER (deux tiers, vidéo inverse).
- **Fermer sans effet :** « ✕ », ANNULER, toucher hors de la bulle, retour système. [Proposé]
- La phrase « Rien ne se passe avant confirmation » est retirée. [Validé]

### 3.6 Panneau bas

Utilisé dans la maquette pour la fiche longue (poste d'appel) et pour l'aperçu de déplacement. Il remplace le dock et la navigation : bord supérieur de 2 px `accent`, fond `surface-2`, récit voilé à 55 % au-dessus. Choisir entre ce panneau et la bulle reste à décider (§9). [Ouvert]

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
| RISQUE | Niveau en gras `accent`, puis le danger connu | « **faible** — effort, aucune blessure attendue » |
| COÛT | Étiquettes `[bruyant]`, `[long]`, `[périlleux]`, ou « aucun » | « [bruyant] [long] » |
| SAVOIR | Une ou deux phrases sur les conséquences connues | « La caisse restera sous la grille haute. La porte du Salon de transit est ouverte : le bruit peut porter. » |

- Les trois coûts sont validés. [Validé] Leur sens mécanique reste à définir (§9).
- Échelle de risque : aucun risque connu, faible, modéré, élevé, mortel (C-04 §3.1 pour le vide). Une conséquence sans dé s'annonce comme certaine (C-04 §5), par exemple « certain : vous serez blessé ». [Proposé]
- Ni pourcentage ni chiffre (C-04 §4.3). L'aperçu ne se calcule que sur ce que le passager sait (C-06 §4).

### 3.9 Modale IA Station

Nom affiché « IA Station » (remplace « assistance »). C'est une modale, avec un seul bouton « Retour ». [Validé]

- Voile de 55 % sur l'écran de jeu. Boîte ancrée en bas, à 16 px des côtés et 24 px du bas, 600 px de haut au plus. Contour 1 px `texte`, fond `surface-2`.
- En-tête : « [ IA STATION ] » en `accent` 17/600, puis « messages reçus dans l'écouteur » en 12.
- Historique chronologique, le plus récent en bas, qui défile. Chaque message a un repère de moment, sans heure : « > au réveil · Salon de transit ». Un message non lu porte l'étiquette NOUVEAU en vidéo inverse. Le texte est en italique `signal`, entre guillemets.
- En bas : RETOUR. Toucher le voile ferme aussi.
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
| Principal | Vidéo inverse, 54 à 58 px | CONFIRMER, REPRENDRE LA PARTIE |
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
| Écran de jeu | IA STATION ou lien « parle dans l'écouteur » | Modale IA Station |
| Écran de jeu | Engrenage | Options |
| Aperçu | CONFIRMER | Écran de jeu, résultat de l'action |
| Aperçu, bulle, fiche | ANNULER, ✕, voile | Écran de jeu, inchangé |
| Carte | FERMER LA CARTE | Écran de jeu |
| IA Station | RETOUR, voile | Écran de jeu |
| Options | MENU PRINCIPAL / REPRENDRE LA PARTIE | Accueil / écran de jeu |
| Options | ABANDONNER (après confirmation) | Fin (abandon) |
| Plus aucune sortie | TERMINER LA PARTIE | Menu principal (§9) |
| Fin | REJOUER CETTE STATION / NOUVELLE PARTIE | Réveil |
| Fin | MENU PRINCIPAL | Accueil |

### 4.1 Accueil

Seulement le titre et trois boutons. Pas de sous-titre. [Validé]

- **Haut :** « VOID » et « WALKER▮ » sur deux lignes (style « titre d'accueil »), à environ 120 px du haut. Nom provisoire du jeu.
- **Bas**, dans la zone du pouce, empilés, à 16 px des côtés, 10 px d'écart, 32 px du bas :
  1. **REPRENDRE LA PARTIE**, principal. Reprend exactement l'état enregistré (C-09). Visible seulement s'il y a une partie en cours (D-089). [Proposé] Si la dernière partie s'est terminée par une défaite, on arrive sur son écran de fin (C-09 S-05).
  2. **NOUVELLE PARTIE**, secondaire. Mène au réveil. S'il n'y a pas de partie en cours, ce bouton devient le principal. [Proposé] La confirmation avant d'écraser une partie en cours reste à décider. [Ouvert]
  3. **OPTIONS**, discret.
- Signaler un bug, envoyer et télécharger la partie sont dans les options. [Validé]

### 4.2 Réveil

Texte seul et un bouton. [Validé]

- **Haut :** « > SALON DE TRANSIT_ » en 13 `texte-secondaire`.
- **Récit long** (autorisé au réveil, D-111), 17 px, interligne 1,65, qui défile si besoin. Le texte du terminal de transit (« CONFINEMENT EN COURS ») est en vidéo inverse.
- **Parole d'IA Station** encadrée : contour `bordure`, étiquette « [ IA STATION ] » en 12/600 `texte-secondaire`, citation en italique `signal`. Ce message entre dans l'historique de la modale.
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

**Aperçu de déplacement** : toucher « → ATELIER DE SERVICE ». [Validé : aperçu et confirmation pour se déplacer]

- Dans la maquette, c'est un panneau bas (§3.6) : « ALLER VERS › », puis « ATELIER DE SERVICE » en `accent` 19/600.
- RISQUE : aucun risque connu. COÛT : aucun. SAVOIR : « Vous quitterez le Salon de transit. »
- Boutons ANNULER / CONFIRMER. Pas de phrase « Rien ne se passe avant confirmation ». [Validé]
- CONFIRMER fait le déplacement et mène à l'écran de la pièce d'arrivée.

### 4.4 Fiche d'objet : Poste d'appel

Consultation gratuite (D-014). Elle s'ouvre en touchant la puce. Dans la maquette, c'est un panneau bas sur le salon voilé.

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
   - COÛT : [bruyant] [long] ;
   - SAVOIR : La caisse restera sous la grille haute. La porte du Salon de transit est ouverte : le bruit peut porter.
4. CONFIRMER envoie une commande structurée (objet, action, position publique), jamais une phrase. Le moteur résout l'action et enregistre la partie (C-09 SP-02). ANNULER, « ✕ » ou toucher le voile referment sans effet.

### 4.7 Écran de jeu après l'action

- **En-tête :** position mise à jour, « > sous la grille haute ».
- **Récit :** « > Caisse · Déplacer · sous la grille haute » [Validé], puis : « La caisse racle le sol sur toute la longueur de l'atelier. Elle s'arrête sous la grille haute, stable. Le bruit a dû porter loin. »
- **Bruit :** « Derrière la porte du Salon de transit, le mouvement s'est arrêté. »
- **Lien IA Station :** « [ IA STATION ] parle dans l'écouteur › ». Carré « nouveau message » sur IA STATION dans la navigation.
- Dock et navigation comme en §4.5.

### 4.8 Carte

Le porteur du projet trouve la carte « pas mal » et la reverra plus tard. [Validé en l'état, à retravailler] Règles de fond : [C-06 §3](contrats/C-06-observation-connaissances.md).

- **En-tête :** « CARTE // RELEVÉ » en `accent` 17/600. À droite, LISTE (44 px) bascule entre plan et liste. La vue liste donne la même information en texte, pour les lecteurs d'écran et les grandes tailles de texte. [Validé]
- **Plan**, environ 430 px de haut, sans grille ni distance (D-015) :
  - **Pièce visitée :** rectangle à trait plein `texte-secondaire` de 2 px, nom en capitales 14/600. Une pièce n'apparaît qu'une fois visitée (D-075).
  - **Pièce actuelle :** double trait `accent` de 3 px, avec « vous êtes ici ».
  - **Liaison entre deux pièces visitées :** deux traits parallèles.
  - **Sortie vue vers une pièce non visitée :** étiquette « [↑ GALERIE TECHNIQUE] » reliée par un pointillé. La pièce n'est pas dessinée (OP-03). La flèche suit la direction de la sortie.
  - **Porte étanche :** sous l'étiquette, « porte étanche · voyant AIR ● » (étiquette en vidéo inverse) ou « VIDE ○ ». Valeur tenue à jour (OP-04).
  - **Passage sans signalétique** (la grille haute, qui est bien un passage [Validé]) : « [→ ?] » relié par un pointillé, sans destination tant qu'elle n'est pas découverte (OP-03).
  - **Pièce hors de vue :** son dernier état vu, en 12 `texte-secondaire` dans le rectangle, par exemple « vu il y a un moment · flèches rouges » (D-076). Un incendie vu s'écrirait « feu ». L'ancienneté se dit en mots, jamais en chiffres : « vu à l'instant », « vu il y a un moment », « vu il y a longtemps ». [Validé] Les seuils entre ces mots restent à fixer. [Ouvert]
  - **Dans la pièce actuelle :** les repères utiles, « GRILLE HAUTE fermée », « @ VOUS », « [■] Caisse ».
- **Sous le plan**, « ── ICI ── », puis les positions en mots : « VOUS ........ sous la grille haute », « CAISSE ...... sous la grille haute ».
- **Légende :** « [↑ NOM] sortie vue, pièce non visitée », « [→ ?] passage, destination inconnue », « AIR ● / VIDE ○ voyant de porte étanche ».
- **Bas :** FERMER LA CARTE, secondaire, pleine largeur.
- **Ne pas reproduire :** la maquette écrit « mouvement entendu » dans le salon. C'est contraire à OP-05 et à C-06 §5 : un bruit n'ajoute aucune marque de position sur la carte.
- **À maquetter :** le marqueur du dernier endroit où la créature a été vue (OP-05, §9).

### 4.9 IA Station

Modale décrite en §3.9. Historique d'exemple :

| Repère | Message |
| --- | --- |
| > au réveil · Salon de transit | « Une capsule de secours est disponible. Son circuit de départ ne répond pas. » |
| > en quittant le Salon de transit | « Vous quittez la zone d'embarquement. Ce déplacement a été noté. » |
| > Atelier de service — NOUVEAU | « Un bruit inhabituel a été enregistré dans l'Atelier de service. Merci de regagner votre siège. » |

Ton froid, calme, un peu décalé ; exact sur les systèmes ; ne dit jamais où est la créature (D-046, D-081).

### 4.10 Options

Écran accessible depuis l'accueil (OPTIONS) et depuis le jeu (engrenage). Il regroupe la taille du texte, le signalement de bug, la gestion de la sauvegarde, le son et l'abandon de la partie en cours. [Validé]

- **En-tête :** « OPTIONS » en `accent` 17/600, puis « le jeu est en pause » en 12.
- **Contenu qui défile**, par sections :
  1. **── TAILLE DU TEXTE ──** : groupe segmenté STANDARD / GRANDE / TRÈS GRANDE, puis un aperçu d'une phrase de récit à la taille choisie (17, 19 ou 22 px). [Validé]
  2. **── SON ──** : « Ambiance » COUPÉE / BASSE / NORMALE ; « Voix d'IA Station » COUPÉE / ACTIVE. [Validé pour la présence de réglages de son ; Proposé pour leur détail] L'audio n'est pas encore arbitré (05 §7).
  3. **── AFFICHAGE ──** : « Lignes de balayage [OUI] / [NON] ». [Proposé]
  4. **── PARTIE ──** :
     - « ▸ Télécharger ma partie », avec en dessous « fichier enregistré sur le téléphone ». C'est l'export de C-09 §5 : le fichier qui rejoue la partie. [Validé]
     - « ▸ Signaler un bug », avec « la partie en cours est jointe ». La partie est jointe automatiquement (RP-01). [Validé]
     - « ▸ Envoyer ma partie », avec « débogage ». [Validé, mais écart avec C-10, voir §9]
     - « ⊘ Abandonner la partie en cours », bouton danger. Il ouvre une confirmation dans la page : « Abandonner ? Cette partie ne pourra pas être reprise. », ANNULER / ABANDONNER. ABANDONNER mène à l'écran de fin, version abandon (C-08 §4).
- **Bas, fixe :** MENU PRINCIPAL (secondaire) et REPRENDRE LA PARTIE (principal).
- **Sans partie en cours :** masquer Télécharger, Abandonner et REPRENDRE LA PARTIE. [Proposé]
- Les réglages sont conservés sur l'appareil, hors de la sauvegarde de partie. [Proposé]

### 4.11 Fin de partie

Récit seulement, ni score ni étoiles (D-086). [Validé]

- **Haut :** « > FIN DE LA PARTIE_ » en 13 `texte-secondaire`, à 56 px du haut.
- **Titre** en `accent` 24/600 :
  - abandon : « Partie abandonnée. » ;
  - défaite : « Vous n'avez pas atteint la capsule. » ;
  - évacuation : « La capsule s'est détachée. »
- **Récit de fin** (plus long, D-111), 17 px. Les paragraphes sont séparés.
- **Sous un filet pointillé :** « PIÈCES VISITÉES : Salon de transit, Atelier de service » [Proposé ; liste en mots, sans chiffre]. Pour l'abandon et la défaite, ajouter « Cette partie est terminée. Elle ne peut pas être reprise. » (D-013).
- **Boutons :**
  - REJOUER CETTE STATION, principal : même état de départ, nouveaux tirages (D-087, D-088). Pas de mention « même station, nouveaux dés ». [Validé]
  - NOUVELLE PARTIE, secondaire.
  - En dessous, discrets : ENVOYER MA PARTIE et MENU PRINCIPAL. Pas d'« Exporter ». [Validé]

Récit d'exemple, défaite :

> Vous avez quitté votre siège quand personne d'autre ne bougeait. Vous avez lu le poste d'appel, rejoint l'atelier, traîné une caisse sous la grille haute.
>
> Le bruit a porté. Ce qui bougeait derrière la porte du Salon de transit est venu.
>
> Dans l'écouteur, IA Station a annoncé la fin de l'embarquement.

## 5. Autres états maquettés

### 5.1 Résultat d'une action risquée

Exemple : « Caisse · Monter dessus · atteindre la poignée de la grille haute », annoncée « risque élevé ».

- **En-tête :** ATELIER DE SERVICE, « > au sol, près de la caisse », badge « ! BLESSÉ », engrenage.
- **Récit :**
  - rappel « > Caisse · Monter dessus · atteindre la poignée de la grille haute » ;
  - en dessous, en 13 `texte-secondaire` : « risque annoncé : élevé · [périlleux] » ;
  - récit : « Vous montez sur la caisse et tendez le bras. Vos doigts accrochent la poignée : elle cède d'un cran. Puis la caisse bascule. Votre épaule heurte le sol, et la douleur vous coupe le souffle. »
- **Ce qui change :**
  - « ÉTAT : indemne → BLESSÉ (épaule) » ;
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
  - CONTINUER À JOUER (principal, inversé dans la carte) : la carte disparaît et le jeu reprend. Il revient ensuite au joueur d'abandonner depuis les options. [Validé] Un rappel discret « [ plus aucune sortie possible ] » reste en tête du récit. [Proposé]
  - TERMINER LA PARTIE (secondaire), avec « retour au menu principal ». [Validé, mais voir §9]

## 6. États encore à maquetter

| État | Ce qu'il doit montrer | Source |
| --- | --- | --- |
| Inventaire | Objets portés, l'objet encombrant (un seul à la fois), fiche gratuite de chaque objet, actions possibles depuis l'inventaire | D-079, B-045 |
| Signaler un bug | Commentaire du joueur, partie jointe, envoi au service, rapport gardé sans réseau | C-10 RP-01, RP-03, PR-01 |
| Envoyer ma partie | Partie complète, commentaire, case « je valide » dans les versions de test | C-10 RP-02, D-130, D-132 |
| Échec d'enregistrement | Avertissement visible et persistant, jeu possible, jamais « sauvegardé » à tort | C-09 §3, S-02 |
| Partie incompatible après mise à jour | Message, puis nouvelle partie proposée ; l'ancienne est perdue | C-09 §4, S-04 |
| Confirmation de nouvelle partie | Si une partie est en cours (à décider) | D-089 |
| Premier contact et créature vue | Annonce du premier contact, créature dans la pièce, choix de protection, de diversion ou de fuite | C-03 §4.4, D-025 |
| Risque mortel | Aperçu « mortel » (vide sans combinaison), pièces connues qui perdent l'air | C-04 §3.1, D-071 |
| Créature sur la carte | Marqueur du dernier endroit où elle a été vue | C-06 OP-05 |
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
- Lignes de balayage désactivables. Pas d'animation non désactivable. `prefers-reduced-motion` respecté.
- Langue du document `fr`.

## 8. Choix du porteur du projet pendant la revue de maquette

Revue du 2026-10-10. Ces choix ne sont **pas encore consignés** dans le [journal des décisions](03-decisions.md). Un agent ne doit pas les y promouvoir lui-même ; le porteur du projet les fera consigner.

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
| Coûts | bruyant, long, périlleux | « bruyant long perilleux » |
| Ancienneté d'un état vu | En mots : « à l'instant », « il y a un moment », « il y a longtemps » | « bien » |
| Message d'IA Station | Lien dans le récit et pastille sur la navigation | « lien et pastille bien » |
| Exporter, envoyer, bug | Exporter = télécharger sur le téléphone ; Envoyer = fonction de débogage ; Signaler un bug joint la partie automatiquement | « exporter veux dire télécharger sur téléphone, envoyer sera une feature de débug, et signaler un bug joindra la partie automatiquement » |
| Plus aucune sortie | « Terminer » revient au menu principal ; si l'on continue, c'est au joueur d'abandonner | « terminer reviens au menu principal, si on continue de jouer c'est au joueur d'abandonner » |
| Rejouer une station | Même plan et mêmes positions d'objets, nouveaux dés | « oui » |

## 9. Écarts et questions à arbitrer avant implémentation

1. **« Envoyer ma partie », fonction de débogage.** D-095 et C-10 §3 placent « bug » et « envoyer ma partie » dans toutes les versions, y compris publique. D-132 et RP-02 font aussi passer par cet envoi la case « je valide » signée depuis une version de test. Le bouton doit-il exister dans la version publique, ou seulement dans les versions de test ?
2. **Signaler un bug dans les options.** Le premier cahier de la maquette voulait des boutons « toujours accessibles ». Ils sont maintenant à deux touchers, dans les options, depuis l'accueil comme depuis le jeu. Est-ce acceptable ?
3. **Commentaire écrit dans les rapports.** RP-01 et RP-02 prévoient un commentaire du joueur. L'interdiction de saisie libre (D-006) vise la commande du personnage. Un champ de commentaire est-il accepté pour les rapports ?
4. **« Terminer la partie » après « plus aucune sortie ».** C-08 §4 fait de l'abandon une fin, et D-086 veut un récit de fin. Faut-il montrer l'écran de fin « Partie abandonnée » avant le menu principal, ou revenir directement au menu ?
5. **Marqueur de la créature (OP-05).** Le contrat accepté demande le dernier endroit où la créature a été vue, « avec le nombre d'actions écoulées depuis ». C'est un chiffre affiché. Faut-il l'écrire ainsi (« vue ici il y a 3 actions ») ou le dire en mots, comme les états vus (§8), ce qui modifierait OP-05 ?
6. **Sens de « long » et de « périlleux ».** Aucun contrat ne dit ce qu'est une action longue (plus d'un pas de jeu ?), ni en quoi « périlleux » diffère du niveau de risque. À définir avant d'afficher ces étiquettes.
7. **Panneau bas ou bulle.** La fiche du poste d'appel et l'aperçu de déplacement utilisent un panneau bas ; la composition utilise une bulle. Faut-il les unifier en bulles ancrées sur l'élément touché ?
8. **La grille haute dans « Se déplacer vers ».** C'est un passage (§8). Doit-elle aussi apparaître dans le dock comme déplacement, par exemple « → GRILLE HAUTE » sans destination, en plus de sa puce d'objet ?
9. **Son.** Des réglages de son sont prévus, mais l'audio n'est pas arbitré (05 §7). Quels sons existent au lancement ?
10. **Blessure localisée.** « (épaule) » est narratif. C-04 ne connaît pas de blessure localisée : la garder dans l'encadré, ou ne la mettre que dans le récit ?
11. **Rappel persistant de « plus aucune sortie ».** Faut-il garder le rappel discret en tête du récit après CONTINUER À JOUER ?
12. **Confirmation avant une nouvelle partie** quand une partie est en cours (§4.1).
13. **Gestion des sauvegardes.** Avec une seule partie (D-089), elle se limite à « Télécharger ma partie ». Faut-il aussi importer une partie exportée, pour la revoir par exemple ? Rien n'est décidé.

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
