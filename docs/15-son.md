# Void Walker V2 — son : bruitages du terminal et ambiance

> **Statut :** CONCEPTION VALIDÉE PAR PARTIES — choix du porteur du projet du 2026-10-13 consignés par D-216 à D-226 (D-223 à D-226 après l'essai sur téléphone de la PR #130).
> **Date :** 2026-10-13.
> **Issue :** [#99](https://github.com/greffeb/void-walker/issues/99) (bande-son et bruitages d'interface rétro).
> **Références d'écoute :** le [banc des bruitages](maquette/banc-sons.html) (sons choisis à l'oreille, recettes exactes) et la [maquette de la section SON](maquette/options-son.html) (variante A, rail). Les deux pages s'ouvrent dans un navigateur et jouent après un premier toucher.
> **Implémentation :** proposée par la PR de #99 (branche `conception/99-son`), en zone orange ; validation humaine sur téléphone requise (D-129) : premier toucher, arrière-plan, mode silencieux, équilibre des niveaux.
> **Remplace :** la section SON de [12 §4.10](12-interface-ecrans.md) (« Ambiance » COUPÉE / BASSE / NORMALE, « Effets sonores » COUPÉS / ACTIFS) et la partie bande-son de D-153 ; voir §8.

## 1. But

Le terminal fait du bruit, le monde reste muet. Chaque geste dans l'interface a un petit bruit d'ordinateur rétro, esthétique « cassette futurism » (bip, boop, clic, bzzt) ; quelques signaux du terminal doublent une information importante (blessure, soin, alarme, message d'IA Station) ; un fond d'ambiance grave, ponctué de craquements lointains de carlingue, installe la station.

Principes : tout reste compréhensible son coupé, chaque signal double une information écrite (badge de santé, récit, pastille d'IA Station) ; aucun son avant le premier toucher ; aucun fichier son, tout est synthétisé par le jeu ; la créature, les portes, les objets, le feu et le vide ne produisent aucun bruit propre : seul le terminal les signale.

## 2. Catalogue des sons (D-217)

Les noms entre parenthèses sont ceux du banc, où chaque son s'écoute.

### 2.1 Gestes

Règle : **un toucher produit un seul son** ; le son le plus précis remplace le clic.

| Geste | Son |
| --- | --- |
| Toucher un bouton qui ne fait que naviguer : étape dans une bulle, ‹, paramètre, engrenage, boutons de l'accueil, de la fin et des options | Clic (Touche mécanique) |
| Toucher un objet, une sortie ou une puce qui ouvre sa bulle | Bulle, ouverture (Tic double) |
| Fermer une bulle : ✕, ANNULER, toucher hors de la bulle, Échap, retour système | Bulle, fermeture (un tic) |
| Ouvrir INVENTAIRE, CARTE ou IA STATION | Bip feutré, hauteur propre à chacun (§3.2) |
| Refermer INVENTAIRE, CARTE ou IA STATION : leur bouton, ✕, le voile, RETOUR, Échap, retour système (D-226) | Bip feutré de fermeture : plus grave et descendant, même hauteur propre |
| Toucher CONFIRMER, ou toute action jouée d'un seul toucher : prendre ou poser sans risque ni coût, regarder autour, déplacement sans aperçu (D-182) | Confirmer (Déclic validé) |
| Toucher une action indisponible (⊘) | Indisponible (Bz-bzt) |
| Changer un réglage des options : segment, bascule, rail au relâché | Clic, joué au nouveau niveau |

Les autres bulles, et la fiche d'une pièce de la carte, se referment avec le tic des bulles.

### 2.2 Signaux après une action (D-218)

Après chaque action jouée, l'interface compare l'observation d'avant et celle d'après (`Observation` du moteur : `sante`, `feu`, `sansAir`, `messages`).

| Changement | Son |
| --- | --- |
| Santé aggravée jusqu'à « blessé » | Blessure (Parasite) |
| Santé aggravée jusqu'à « critique » | Blessure critique : même recette, hauteur × 0,75, jouée deux fois à 0,32 s d'écart |
| Santé « vaincu » : la partie est perdue (D-225) | Mort (Parasite qui s'éteint), à la place de la blessure critique |
| Santé améliorée | Soin (Bip apaisé) |
| Un feu apparaît à la vue du passager : dans sa pièce (il y entre, le feu s'y propage) ou par un passage ouvert (il ouvre sur une pièce en feu, le feu gagne la voisine) (D-223) | Alarme incendie (Détecteur), une fois |
| Le vide apparaît à la vue du passager de la même façon : dans sa pièce, ou par le voyant d'une porte étanche (D-224) | Alarme vide (Grave pulsé), une fois |
| Première rencontre de la créature (événement `premier_contact` du moteur) (D-224) | Créature (Dissonance) |
| Nombre de messages d'IA Station en hausse | IA Station (Télétype) |
| Évacuation réussie (D-225) | Victoire (Bande qui ralentit) |

Rester dans une pièce en feu, ou devant un passage ouvert sur le feu, ne fait pas resonner l'alarme ; en sortir puis y revenir la fait resonner (« à chaque entrée dans le danger », choix du porteur). Changer de pièce compte comme un passage de faux à vrai quand la nouvelle pièce brûle ou n'a plus d'air. Reprendre une partie enregistrée, ou revenir des options, ne joue aucun signal : il n'y a pas d'observation d'avant. Un refus, une consultation ou un aperçu ne change pas l'observation et ne joue aucun signal.

### 2.3 Crépitement d'écriture

Pendant l'effet machine à écrire (D-186), le crépitement (Bips de caractères) accompagne l'apparition du texte. Il s'arrête net quand le texte est complet ou quand un toucher l'affiche en entier. Il ne joue pas quand le texte est déjà écrit (bulle rouverte, retour d'un autre écran), quand l'effet est réglé sur [NON], ni quand le téléphone demande moins d'animations.

### 2.4 Ordre

Le son du toucher part d'abord, puis le crépitement pendant l'écriture, puis les signaux à la suite, espacés de 250 ms, dans cet ordre : alarme incendie, alarme vide, créature, blessure, mort ou soin, IA Station, victoire. Les signaux attendent la fin de l'écriture ; sans écriture, ou si on la saute, ils partent tout de suite.

### 2.5 Ambiance (D-219)

Un fond continu de bruit brun profond, sous lequel la carlingue travaille : craquements lointains tirés au hasard (Mélange), un toutes les 20 à 60 s. L'ambiance tourne sur tous les écrans, accueil et options compris, dès le premier toucher, pour que le réglage s'entende.

### 2.6 Intro de NOUVELLE PARTIE (D-311)

Chaque pas de l'intro ([12 §4.1 bis](12-interface-ecrans.md#41-bis-intro-de-nouvelle-partie)) a son bruitage, joué sur le rail des effets, sous lequel le fond brun continue (§2.5). Banc d'écoute : la [maquette de l'intro](maquette/intro-generation.html).

| Pas | Son |
| --- | --- |
| Mise sous tension | Interrupteur : coup sourd, ressort, rebond métallique, montée du tube |
| `boot -a --v` | Cliquetis de saisie, un par lettre |
| Deux lignes d'un coup ; une station tirée ; DÉMARRER | Relais ; Confirmer pour DÉMARRER (§2.1) |
| `campaign_mode; console_log(01);` | Touche à ressort flambant, une par lettre |
| Saut d'image | Statique : souffle aigu, crépitements, porteuse radio qui saute de fréquence |
| Défilé des stations ; arrêt | Déclic de bande à chaque plan ; bande qui ralentit puis clac |
| Une ligne | Déclic de relais léger |
| ERREUR : Menace détectée | Blessure (§3.2), recette exacte |
| Station prête | Interrupteur, sans le ronron du tube |

Rien ne sonne quand l'intro est passée d'un toucher, ni quand elle s'affiche d'emblée finie (effet machine à écrire coupé, mouvement réduit).

## 3. Recettes

Les recettes vivent dans `app/son/recettes.ts`, sous forme de données ; elles reprennent exactement les valeurs du [banc](maquette/banc-sons.html), qui fait foi en cas de doute.

### 3.1 Conventions

- **Ton :** oscillateur (carré par défaut, sinus ou triangle sinon) de fréquence f, éventuellement glissée vers une fréquence de fin ; filtre passe-bas facultatif ; modulation d'amplitude carrée facultative (« trém. », en Hz).
- **Souffle :** bruit blanc à travers un passe-bande (par défaut) ou un autre filtre de fréquence f et de facteur Q ; la fréquence du filtre peut glisser jusqu'à une fréquence de fin.
- **Enveloppe :** montée exponentielle en 2 ms pour un ton, 1 ms pour un souffle (sauf mention), tenue, chute exponentielle de min(30 ms, durée / 2) (sauf mention).
- Temps en secondes depuis le départ du son ; « vol » est le niveau crête avant les bus.

### 3.2 Bruitages

| Son | Recette |
| --- | --- |
| Clic | souffle 7 ms, f 3 600, Q 2,5, vol 0,55 ; ton carré 4 ms à 2 400, vol 0,05 |
| Bulle, ouverture | souffle 4 ms, f 3 000, Q 2,5, vol 0,2 ; à 30 ms, souffle 4 ms, f 3 600, Q 2,5, vol 0,16 |
| Bulle, fermeture | souffle 4 ms, f 2 400, Q 2,5, vol 0,18 |
| Bip feutré | ton sinus 90 ms de 660·h à 720·h, vol 0,16, montée 12 ms, chute 50 ms ; h = 1,19 pour INVENTAIRE, 0,84 pour CARTE, 1 pour IA STATION |
| Bip feutré de fermeture | ton sinus 90 ms de 560·h à 500·h, vol 0,16, montée 12 ms, chute 50 ms ; même h |
| Confirmer | souffle 6 ms, f 3 600, Q 2,5, vol 0,35 ; à 25 ms, ton sinus 45 ms à 990, vol 0,08, montée 4 ms |
| Indisponible | deux fois, à 0 et 110 ms : ton carré 70 ms à 120, passe-bas 1 400, vol 0,12, avec souffle 70 ms, f 900, Q 1,2, vol 0,12 |
| IA Station | trois tons carrés 28 ms à 1 600, vol 0,07, à 0, 70 et 140 ms |
| Crépitement | un tic tous les 36 ms × (0,75 à 1,25) tiré au hasard : ton sinus 7 ms à 1 200, 1 500 ou 1 800 au hasard, vol 0,07, chute 4 ms |
| Blessure | souffle 40 ms passe-bas 700·h, Q 1, vol 0,3 ; à 20 ms, ton carré 130 ms à 220·h, passe-bas 1 500, trém. 40, vol 0,09 ; h = 1 (blessé) ou 0,75 (critique, §2.2) |
| Soin | ton sinus 120 ms à 523, vol 0,16, montée 20 ms, chute 60 ms ; à 120 ms, ton sinus 160 ms à 784, vol 0,15, montée 20 ms, chute 100 ms |
| Alarme incendie | six tons carrés 50 ms à 1 400, vol 0,06, chute 10 ms, tous les 90 ms |
| Alarme vide | trois tons carrés 160 ms à 180, passe-bas 1 200, vol 0,14, chute 30 ms, à 0, 260 et 520 ms |
| Créature | deux tons carrés de 700 ms à 233 et 330 (triton), passe-bas 1 600, trém. 8, vol 0,08 chacun, montée 20 ms, chute 200 ms |
| Mort | souffle 60 ms passe-bas 700, Q 1, vol 0,3 ; à 20 ms, ton carré 1,4 s de 220 à 55, passe-bas 1 500, trém. 40, vol 0,12, chute 500 ms |
| Victoire | tons sinus 1,2 s de 440 à 60 (vol 0,16) et de 660 à 90 (vol 0,08), montée 10 ms, chute 250 ms ; souffle 1,2 s, f 3 000 glissant à 200, Q 0,8, vol 0,06 ; à 1,25 s, souffle 30 ms passe-bas 600, vol 0,45 (le clac d'arrêt) |

**Grain cassette :** tous les bruitages passent par une saturation douce (tanh, k = 2,2) puis un passe-bas à 5 200 Hz (Q 0,5). L'ambiance n'y passe pas.

### 3.3 Fond brun

Bruit blanc stéréo (deux voies indépendantes) de 9 s, fabriqué une fois et lu en boucle ; passe-bas 90 Hz (Q 0,5) puis passe-bas 260 Hz (Q 0,5) ; gain 5 ; démarrage en fondu de 0,8 s. La boucle ne s'entend pas : le bruit n'a pas de motif.

### 3.4 Carlingue

Quatre sons, tirés par le Mélange avec les poids Gémissement 2, Craquement 2, Pression 2, Gong 1. Chaque son est placé au hasard entre gauche et droite (panoramique de −0,75 à 0,75), passe en partie direct et en partie par une réverbération de coque.

- **Réverbération de coque :** réponse impulsionnelle stéréo de 3,8 s, fabriquée une fois : bruit filtré de plus en plus sombre, décroissance exp(−1,6 t) ; retour 0,9.
- **Frottement :** suite d'impulsions de bruit (1,2 ms sauf mention, amplitude tirée de 0,4 à 1) dont la cadence (impulsions par seconde) suit une courbe, avec un écart tiré de 0,7 à 1,3 à chaque intervalle ; elle passe par des résonateurs (passe-bandes en parallèle), un passe-bas, une enveloppe (montée sur le premier quart, tenue jusqu'à 60 %, chute jusqu'à la fin).

| Son | Recette |
| --- | --- |
| Gémissement | durée 2,2 à 3,6 s ; cadence de b à h en arche (b 7 à 10, h 16 à 26), ± 2 ; résonateurs 180, 297, 431, 612 × (0,85 à 1,2), Q 22 ; passe-bas 1 400 ; vol 36 ; direct 0,4 |
| Craquement | durée 0,5 à 1,1 s ; cadence 3 à 14 tirée à chaque impulsion ; impulsions de 0,8 ms ; résonateurs 520, 1 310, 2 380 × (0,8 à 1,25), Q 35 ; passe-bas 2 800 ; vol 75 ; direct 0,3 |
| Pression | durée 3 à 4,5 s ; cadence 4 → 10, ± 1 ; impulsions de 2 ms ; résonateurs 70, 113, 182, 260, chacun × (0,9 à 1,1), Q 30 ; passe-bas 700 ; vol 150 ; direct 0,4 ; au départ, un coup sourd : sinus 48 → 34 Hz en 1,4 s, vol 1, chute jusqu'à 1,5 s, direct et réverbéré |
| Gong | un coup de masse : base b de 55 à 82 Hz ; partiels (rapport, niveau, durée) (1 ; 1 ; 5,5 s), (1,48 ; 0,7 ; 4,2), (2,15 ; 0,55 ; 3,4), (2,71 ; 0,4 ; 2,6), (3,6 ; 0,25 ; 1,9), (4,93 ; 0,12 ; 1,3), chacun en deux sinus désaccordés de ± 0,25 Hz × rapport, niveau × 0,6, montée 12 ms ; choc : souffle 50 ms passe-bas 260, Q 0,7, vol 2,5 ; passe-bas 1 000 à 1 400 ; direct 0,35 |

Programmation : après chaque craquement, le suivant est tiré entre 20 et 60 s plus tard. Rien n'est programmé pendant que l'appli est en arrière-plan ni quand l'ambiance est à 0.

### 3.5 Intro de NOUVELLE PARTIE

Recettes de `recetteIntro` (§2.6), avec le grain cassette des bruitages. « ±e » : fréquence décalée au hasard de ± e à chaque fois.

| Son | Recette |
| --- | --- |
| Interrupteur | ton sinus 320 ms de 75 à 32, vol 0,6, chute 250 ms ; souffle 140 ms passe-bas 380, vol 0,6, chute 100 ms ; souffle 25 ms, f 1 900, Q 6, vol 0,5 ; à 55 ms, souffle 20 ms, f 2 400, Q 8, vol 0,25 ; à 20 ms, ton en dents de scie 600 ms à 50, passe-bas 180, vol 0,12, chute 500 ms |
| Station prête | les trois premiers éléments de l'interrupteur |
| Cliquetis | souffle 12 ms, f 4 200 ±15 %, Q 3, vol 0,28 |
| Touche à ressort | souffle 22 ms, f 2 600 ±12 %, Q 9, vol 0,55 ; ton triangle 50 ms à 1 650 ±5 %, vol 0,05, chute 45 ms ; à 14 ms, souffle 35 ms passe-bas 520, vol 0,6 |
| Relais | souffle 30 ms, f 1 250, Q 2, vol 0,45 ; souffle 50 ms passe-bas 220, vol 0,4 ; à 35 ms, souffle 12 ms, f 3 200, Q 4, vol 0,12 |
| Statique | 850 ms : souffle passe-haut 3 000, vol 0,12, chute 150 ms ; tous les 20 à 60 ms, souffle de 10 à 40 ms, f 400 à 5 400, Q 1,5, vol 0,2 à 0,6 ; toutes les 50 ms, ton en dents de scie 50 ms de 300 à 2 100, passe-bas 2 500, vol 0,06 |
| Déclic de bande | souffle 12 ms, f 1 700 ±20 %, Q 4, vol 0,18 |
| Arrêt | ton en dents de scie 400 ms de 420 à 60, passe-bas 900, vol 0,1, chute 300 ms ; souffle 350 ms, f 2 600 glissant à 300, Q 2, vol 0,12 ; à 360 ms, souffle 50 ms passe-bas 240, vol 0,5 |
| Ligne | souffle 18 ms, f 1 400 ±15 %, Q 2, vol 0,22 ; souffle 30 ms passe-bas 220, vol 0,18 |
| Menace | Blessure (§3.2), h = 1 |

## 4. Options › SON (D-220)

Section **── SON ──** entre TAILLE DU TEXTE et AFFICHAGE, trois rails ([maquette A](maquette/options-son.html)) :

| Rail | Détail sous le libellé | Défaut |
| --- | --- | --- |
| Général | — | 80 |
| Effets sonores | bips et clics du terminal | 80 |
| Ambiance | bruit brun et carlingue | 60 (D-223) |

- Valeur de 0 à 100, écrite à droite du libellé en `accent` ; à 0 : « COUPÉE » (général, ambiance) ou « COUPÉS » (effets).
- Rail de 44 px de haut pour le doigt, piste de 6 px, partie active en `accent`, curseur carré.
- Le gain suit le carré de la valeur : gain = (valeur / 100)², pour une pente perçue régulière. Le général multiplie les deux autres.
- Le réglage s'applique pendant le glissé, avec un fondu de 30 ms ; le clic de contrôle part au relâché, au nouveau niveau.
- Gardés sur l'appareil avec les autres réglages, hors de la sauvegarde de partie ; un réglage illisible prend sa valeur par défaut.
- Lecteur d'écran : chaque rail est un curseur natif, lu avec son libellé et sa valeur.

## 5. Cycle de vie et pannes (D-222)

- **Programmation :** un son part 60 ms après sa demande. Sur téléphone, l'horloge audio lue par la page retarde de 10 à 40 ms ; un bruitage de quelques ms programmé plus près tombait dans le passé et restait muet (D-223).
- **Premier toucher :** l'audio s'ouvre pendant le premier toucher (ou la première touche du clavier), n'importe où dans l'appli ; ce toucher joue déjà son son. Avant, l'appli est muette.
- **Arrière-plan :** quand la page est cachée (autre appli, écran verrouillé, onglet caché), l'audio est mis en pause en bloc ; il reprend au retour. Aucun craquement en retard ne part au retour.
- **Niveaux à 0 :** ambiance à 0, le fond et la carlingue s'arrêtent vraiment ; effets à 0, aucun bruitage n'est lancé ; général à 0, tout se tait.
- **Mode silencieux :** le jeu respecte le mode silencieux de l'iPhone et se mélange à l'audio déjà en cours (session audio « ambient » quand le navigateur le permet) ; il n'interrompt jamais la musique du joueur.
- **Pannes :** sans audio dans le navigateur, ou si l'audio refuse de démarrer, le son devient muet ; aucune erreur ne remonte au jeu, aucun message n'apparaît.
- **Hors ligne :** rien n'est téléchargé ; le son marche hors ligne dès que l'appli est installée.
- **Mémoire :** le bruit de base et la réverbération sont fabriqués une seule fois (environ 5 Mo à 48 kHz).

## 6. Architecture

Tout vit dans `app/` ; le moteur et la CLI ne changent pas.

| Fichier | Rôle | Dépend de |
| --- | --- | --- |
| `app/son/recettes.ts` | Les sons du §3, en données ; aucun audio | rien |
| `app/son/declencheurs.ts` | Fonction pure : observations d'avant et d'après → signaux du §2.2, dans l'ordre du §2.4 | vocabulaire du moteur, en lecture |
| `app/son/moteur.ts` | Seul point de contact avec l'audio du navigateur : joue une recette, bus général → effets (grain cassette) et ambiance, fond brun, carlingue, cycle de vie du §5 ; le contexte audio, le hasard et l'horloge lui sont fournis | `recettes.ts` |
| `app/son/contexte.ts` | Branchement React : chaque bouton porte `data-son`, un seul écouteur à la racine de l'App joue `son.geste(…)` ; l'écran annonce un nouveau texte (`son.nouveauTexte`) et le fait taire quand on le saute (`son.taire`) ; les écrans ne savent rien de l'audio | `moteur.ts` |
| `app/reglages.ts` | Trois niveaux de plus (§4) | — |
| `app/EcranOptions.tsx` | Section SON (§4) | `reglages.ts` |

## 7. Tests et preuves

- **Recettes :** chaque son du §2 a sa recette ; un geste dure moins de 300 ms, un signal moins d'1 s (la blessure critique, jouée deux fois, dure 0,47 s), une fin de partie (mort, victoire) moins d'1,5 s, un son de carlingue moins de 6 s (réverbération non comprise) ; niveaux sous un plafond commun ; valeurs du §3.
- **Déclencheurs :** un cas écrit par ligne du §2.2, dont le retour dans une pièce en feu et la reprise d'une partie ; puis des centaines de parties tirées au hasard avec le vrai moteur sur AR-01, AR-02 et le monde de test : à chaque pas, seuls les signaux listés sortent, une alarme sonne si et seulement si le feu ou le vide vient d'apparaître dans la pièce du passager, l'ordre du §2.4 est respecté.
- **Moteur :** avec un faux contexte audio qui enregistre les demandes : rien avant le premier toucher ; pause et reprise ; gains (§4) ; ambiance à 0 arrêtée ; audio absent ou en panne sans erreur ; carlingue sur des milliers de tirages : intervalles de 20 à 60 s, gong une fois sur sept.
- **Écrans :** avec un espion à la place du son : chaque geste du §2.1 joue exactement un son ; le crépitement démarre avec l'écriture et s'arrête à la fin ou au saut ; les rails changent et gardent les réglages.
- `npm run verify` vert ; captures de la section SON au format téléphone ; version de test ; critères ↔ preuves ; validation humaine sur téléphone requise (premier toucher, arrière-plan, mode silencieux, équilibre des niveaux).

## 8. Ce qui change ailleurs

- **12 §4.10 :** la section SON devient celle du §4 ; « Ambiance » COUPÉE / BASSE / NORMALE et « Effets sonores » COUPÉS / ACTIFS sont remplacés (D-220).
- **D-153 :** les bruitages sont créés pour le projet plutôt que pris dans une banque libre de droits (D-216) ; la bande-son fournie est retirée pour le moment (D-221) : pas de curseur « Bande-son » tant qu'il n'y a pas de musique.
- **Précision du porteur du 2026-10-11 (issue #99) :** blessure, soin, alarme incendie et alarme vide s'ajoutent comme signaux du terminal ; le fond brun et la carlingue s'ajoutent comme ambiance (D-218, D-219).
- **Hors périmètre :** voix et synthèse vocale (D-155) ; bande-son (D-221) ; bruits propres aux éléments du monde ; moteur et CLI.

## 9. Crédits

Aucun fichier son tiers. Tous les sons sont synthétisés par le jeu à partir des recettes de `app/son/recettes.ts`, créées pour le projet le 2026-10-13 et choisies à l'oreille par le porteur sur le [banc](maquette/banc-sons.html) ; ils suivent la licence du dépôt.
