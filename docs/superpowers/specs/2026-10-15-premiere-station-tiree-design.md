# L2 (#152) — Première station tirée : conception

> **Statut :** approuvé par le porteur le 2026-10-15, réponses aux deux questions intégrées (§3.3, §3.5, §10). Implémenté sur la branche `content/152-premiere-station`, en attente de PR. Zone orange (format des scénarios, appli, ajout d'un module au moteur sans changement de règle).
> **Sources :** issue #152 ; 13 §2, §3, §4.1, §7, §8 ; 14 §4, §5 ; C-08 ; D-083 à D-088, D-161, D-204, D-208, D-241, D-242, D-245, D-249 à D-253, D-255, D-257, D-260.

## 1. Intention

Une nouvelle partie tire une petite station assemblée de morceaux écrits à la main, prouvée sûre avant d'être proposée : vestibule, un morceau de chemin (M-07 ou M-10), le final M-03 avec son embarquement. C'est la première fois que le jeu ne joue plus une aventure fixe ; le porteur la juge en jouant chaque morceau inclus au bout sur téléphone (D-098).

**Réussi si :** NOUVELLE PARTIE donne des stations différentes, toutes jouables sans dé ni blessure si l'on prépare bien ; REJOUER garde la même ; AR-01, AR-02 et les stations de test restent jouables et leurs parcours inchangés.

**Échec même si ça tourne :** une station proposée sans preuve ; un texte qui nomme une pièce qui n'est pas là ; une règle de jeu inventée pour faire tenir un morceau ; une sauvegarde au format changé.

## 2. Hors périmètre

M-01, M-02, M-04, M-05, M-06, M-08, M-09 ; ordre libre (L5) ; signal « plus aucune sortie » (L6) ; annexes, boucles, grandes stations ; objets hors de leur morceau ; lore ; écrans de fin ; retrait automatique des validations (D-100 : seule l'empreinte est calculée ici).

## 3. Morceaux

### 3.1 Format (GP-01)

Un morceau reprend la forme d'un monde, sans départ ni créature, et ajoute :

- **famille** : départ, chemin ou final ;
- **attache d'entrée** : la pièce par laquelle on y entre (sauf le départ) ;
- **attache de sortie** : la pièce et la porte qui mènent au morceau suivant (sauf le final, qui apporte l'embarquement, D-249) ; la porte est décrite par le morceau (porte ordinaire, porte grippée…), toujours fermée au départ dans une station assemblée (D-252) ;
- **places de la créature** : pièces du morceau où elle peut attendre (D-161) ;
- **ce qu'il demande et ce qu'il fournit** : liste déclarative (accès, évacuation) ; en L2, le final fournit l'évacuation, un chemin fournit l'accès ;
- **tuile de plan** : rectangles de ses pièces en coordonnées locales ; l'assembleur peut la retourner en miroir sur un seul axe, jamais la tourner (GE-02 ; deux miroirs à la fois feraient un demi-tour) ;
- **textes** : noms, descriptions et messages d'arrivée du morceau (§6).

Une **empreinte** par morceau (hachage de sa définition et de ses textes) est calculée et affichée dans le rapport du catalogue, pour le futur retrait des validations (D-100).

### 3.2 Vestibule (départ, D-257)

Une pièce sans danger, sans objet ni créature ; une porte ordinaire fermée vers le premier morceau. Description neutre, sans destination ni promesse.

### 3.3 M-07 — Salle des machines (chemin)

Repris tel quel de la station de test `m-07`, sans son embarquement : quartiers (entrée) ouverts sur une soute, porte fermée vers la salle des machines (interrupteur), porte grippée vers la coursive (sortie, porte ordinaire vers la suite).

**Place de la créature : la soute seulement** (réponse du porteur, 2026-10-15). La fiche dit « dans la salle des machines » ; la station de test la met dans la soute, et les deux parcours sûrs de la fiche supposent qu'elle vient d'ailleurs. Mesure du vérifieur sur une maquette jetable : créature dans la salle des machines, **aucune sortie sûre** (station rejetée) ; dans la soute, prouvée en 15 actions.

### 3.4 M-10 — Chambre froide (chemin)

Repris tel quel de la station de test `m-10`, sans son embarquement : quartiers (entrée) ouverts sur l'antichambre (pupitre de fermeture), chambre froide (compresseur) entre l'antichambre et l'entrepôt, entrepôt ouvert sur la coursive, porte fermée entre quartiers et coursive ; la porte grippée de la coursive est la sortie du morceau. Les quartiers sont nécessaires : c'est par eux que la coursive se rejoint sans traverser la chambre. Place de la créature : l'entrepôt (fiche).

Mesure : prouvée en 14 actions ; le témoin contourne la chambre froide grâce à l'action libre du premier contact (D-250) puis referme la porte grippée derrière lui. C'est déjà vrai dans la station de test (9 actions en L1). Signalé pour les mesures de L5 (D-241), sans changement en L2.

### 3.5 M-03 — Énergie (final)

Local énergie (entrée : console du circuit, bloc d'énergie), salle d'embarquement contre la coque (capsule non alimentée), cabine et pupitre ; écoutille fermée au départ (D-196).

**Pièce voisine de la créature : une réserve** (réponse du porteur, 2026-10-15 : une seule pièce voisine, nommée « réserve » ou « cabine »). Choix de l'agent : « réserve », pour ne pas la confondre avec la cabine de la capsule. Le morceau apporte cette **réserve** reliée au local par une porte ouverte au départ ; la créature y attend. Réarmer la console (relais bruyant) l'attire si l'on n'a pas d'abord fermé cette porte ; porter le bloc jusqu'à la capsule ne fait pas de bruit. La porte entre le local et l'embarquement est fermée au départ. Mesures : prouvée avec M-07 (16 actions) et M-10 (16 actions).

## 4. Assemblage

### 4.1 Composition et table des paires

- Une composition = départ + un morceau de chemin + le final + une place de créature tirée parmi celles des morceaux, jamais au départ (D-161).
- La table des 45 paires de 13 §4.1 est transcrite en données avec son verdict et sa règle. Une paire refusée ou absente écarte la composition **avant** tout plan et toute vérification, avec son motif (D-167, G-02).
- Identifiants préfixés par morceau (`m-07/p-machines`) ; l'identifiant public dépend du monde et de cet identifiant (`idPublic`), donc de la station.
- Portes entre morceaux fermées au départ (D-252) ; portes intérieures selon le morceau.
- Pièces du même type numérotées (D-208) : deux pièces de même nom reçoivent une lettre dans toute la station (« coursive A », « coursive B »). Aucune composition de L2 n'en a ; le mécanisme est en place et testé. Choix de l'agent : des lettres pour tous les types, D-208 citant les deux formes ; des chiffres seraient refusés par les contrôles « aucun chiffre » de la carte et de l'écran de fin.

### 4.2 Plan du chemin principal (GE-01 à GE-07, PL-01 à PL-07)

- Tuiles posées dans l'ordre du chemin ; chaque pièce d'entrée partage avec la pièce de sortie précédente un mur d'au moins deux cases (PL-02) ; la porte se place sur une case de ce mur (GE-01).
- Miroir sur un axe ou aucun (GE-02) ; candidat refusé s'il chevauche, enferme un vide (GE-03), dépasse six portes, ou empiète sur les quatre cases réservées devant une coque (GE-07, dès la pose).
- Préférence pour la proportion de l'écran (largeur ≈ 0,76 × hauteur, GE-04) sans en faire une limite ; recherche avec retour en arrière (GE-05).
- Hasard à graine, sans hasard global : même graine, même plan (GE-06, PL-07).
- Station sans plan : retirée et retirée au sort. Toute station est revalidée par `validerMonde`, qui appelle `validerPlan`.
- Critères mesurés (14 §5.6) : 1 000 tirages, au moins 95 % de plans trouvés, moins de 50 ms par station sur PC, galerie de plans dans la PR.

### 4.3 Où vit le code (choix de l'agent)

- **Moteur** : nouveau module `engine/station.ts` — format du morceau (types) et assembleur (identifiants, portes, créature, plan). Aucune règle de jeu ni format de sauvegarde ne change. Le contenu ne peut appeler que les types du moteur (architecture §3), et la géométrie du plan y est déjà ; la dupliquer dans le contenu serait pire. Aucune autre issue moteur n'est ouverte.
- **Contenu** : données des morceaux, textes, table des paires, catalogue, tirage ; un résolveur qui reçoit l'assembleur du moteur en paramètre, partagé par l'appli, la CLI et les outils.

## 5. Catalogue et tirage

- **Identifiant de station** : `<composition>-<graine du plan>`, par exemple `m07-m03-soute-2718281828`. Il tient dans le champ « monde » de la sauvegarde et de l'export, **format inchangé** ; la station se reconstruit à l'identique depuis lui (même version du jeu). Choix de l'agent : seulement des minuscules, chiffres et tirets, 40 caractères au plus, la forme que le service de rapports accepte pour un monde (`report-service/src/rapport.ts`) ; sinon « Envoyer ma partie » et « je valide » seraient refusés depuis une station tirée.
- **Catalogue vérifié à la construction** : toutes les compositions possibles sont passées au vérifieur de L1 par `npm run check:stations` (dans `verify`), avec verdict, états et temps ; la liste des compositions publiées est écrite dans le contenu et doit correspondre exactement aux compositions prouvées, sinon la vérification échoue. Le tirage ne lance jamais le vérifieur.
- **Tirage (D-253, D-260)** : final d'abord, à pile ou face entre les finals disponibles (un seul en L2 : M-03), puis composition au hasard parmi celles de ce final, puis graine du plan. Une station déjà jouée peut revenir.

## 6. Textes par couches (13 §7.2)

- Quatre couches réunies en un jeu de textes : **socle** neutre (refus, libellés, verbes, savoir, aperçus, règles des dangers et des morceaux), **univers** (réveil, départ, pièces communes : vestibule, embarquement, cabine, capsule ; messages d'IA Station au réveil et au départ), **menace** (les clés qui décrivent la créature, ses bruits et ses coups), **morceaux** (noms, descriptions, messages d'arrivée).
- Chaque couche univers et menace déclare ses mots propres (par exemple « créature », « griffe », « station ») ; un contrôle échoue si l'un d'eux paraît dans le socle ou dans un morceau.
- Les textes communs des stations de test deviennent la réunion socle + univers + menace, sans changer ce qui s'affiche, sauf réécritures ci-dessous.
- Réécrits pour ne plus nommer une pièce voisine : message de la capsule de `m-07`, `m-08`, `m-09` ; coursives de `m-07` et `m-10`.
- Choix de l'agent : AR-01, AR-02 et le monde de test gardent leurs textes ; la signalétique de la coursive de départ d'AR-02 appartient à une pièce qui ne deviendra pas un morceau (le vestibule la remplace) ; elle sera revue en L3 si M-06 la reprend.
- IA Station dans une station tirée : un message au réveil (univers, sans nommer de pièce), le message d'arrivée du local énergie (M-03, celui d'AR-01), le message de départ (univers). Pas de message « présence détectée » : il nommerait la place tirée. Choix de l'agent.

## 7. Appli et CLI

- **Sans paramètre** (version de test et version publique, D-255, D-260) : NOUVELLE PARTIE tire une station ; REJOUER CETTE STATION garde la même station (même plan, même départ) avec de nouveaux dés (D-087, D-088) ; REPRENDRE retrouve la station de la partie enregistrée par son identifiant.
- **`?station=<composition>` ou `?station=<identifiant>`** : force une composition (plan tiré) ou une station exacte ; une composition refusée l'est avec son motif, affiché à l'accueil, et NOUVELLE PARTIE reste indisponible. Partie gardée à part, comme `?monde=`.
- **`?monde=ar-01`, `ar-02`, `monde-test`, `m-07` à `m-10`** : inchangés, chacun avec sa partie à part.
- **CLI** : `nouvelle` tire une station ; `--station <id>` en force une ; `--monde <id>` garde les mondes fixes ; une partie enregistrée reprend sur sa station. `npm run rejouer` reconnaît les identifiants de station.
- Une partie enregistrée avant cette version (AR-01 à l'adresse sans paramètre) se reprend toujours : REPRENDRE retrouve son monde par l'identifiant enregistré, et la version du jeu ne change pas (D-260). Limite : une partie en cours sur `?monde=m-07` ou `?monde=m-10` ne se reprendra pas, leurs identifiants publics changeant avec les préfixes.
- Choix de l'agent : seule la paire entre le morceau de chemin et le final passe par la table ; le vestibule n'est pas l'un des dix morceaux. Une graine de plan sans plan est retirée au sort ; un identifiant exact sans plan est refusé. Prouver une composition vaut pour toutes ses graines de plan, aucune règle ne lisant le plan (D-078).

## 8. Stations de test `m-07` et `m-10`

Refaites à partir des morceaux : le morceau, plus un embarquement d'essai (capsule déjà alimentée, comme aujourd'hui), départ dans les quartiers, créature à sa place actuelle, porte vers l'embarquement dans son état d'aujourd'hui (ouverte pour `m-07`, porte grippée fermée pour `m-10`). Leurs parcours ne changent pas et restent dans la vérification complète. Leur plan vient des tuiles du morceau, posées par l'assembleur avec une graine fixe, et non plus d'un plan dessiné à part.

## 9. Preuves

- G-02 : copie de la table sans la paire M-03 + M-07, `?station=` (et `--station`) refusé avec son motif, avant toute vérification.
- G-05 : même station, même départ, tirages différents.
- Même graine, même plan ; 1 000 tirages : taux de plans, temps par station.
- Parcours de `m-07` et `m-10` inchangés et verts.
- Tableau du catalogue (verdict, états, temps, empreintes) ; galerie de plans ; captures ciblées (station tirée au réveil, plan, REJOUER) ; version de test.
- Partie CLI d'un playtester aveugle sur une station tirée ; relecture indépendante.
- **Validation humaine requise** : une partie au bout sur téléphone par morceau inclus (M-03, M-07, M-10).

## 10. Réponses du porteur (2026-10-15)

1. Salle des machines : la créature attend dans la soute seulement (§3.3).
2. Local énergie : une seule pièce voisine, la réserve, porte ouverte au départ (§3.5).
3. Document approuvé pour passer au plan.
