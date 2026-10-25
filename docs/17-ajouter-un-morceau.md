# 17 — Ajouter un morceau de station : guide pour les agents

> **Statut :** GUIDE DE TRAVAIL, zone verte (documentation). Écrit après M-11, sas de sécurité (#203). Il ne crée aucune règle : en cas d'écart, les décisions **Validé** de [03](03-decisions.md), les contrats et [13 — morceaux](13-morceaux-lancement.md) l'emportent ; corriger alors ce guide.
> **Mise à jour :** 2026-10-20.

Ce guide liste tout ce que touche l'ajout d'un morceau, dans l'ordre où le faire, avec les pièges déjà rencontrés. Exemple complet : la PR de #203 (`content/morceaux/m-11.ts` et les 28 fichiers modifiés avec lui).

## 1. Avant d'écrire du code

1. **Lire** [00](00-lire-en-premier.md), puis dans [03](03-decisions.md) : D-156 à D-175 (cadre et familles), D-248 (mélanges sans règle), D-252 (portes entre morceaux fermées), D-259 (ordre libre), D-268 (créature qui bouche le seul passage), D-279 (porte forcée par la créature), D-290 à D-293 (M-11). Lire [13](13-morceaux-lancement.md) §2 à §4.1 et C-02 §5.
2. **Classer l'idée.** Famille `chemin` (obstacle entre le départ et l'embarquement) ou `final` (apporte l'embarquement et sa capsule, D-249). Un nouveau final change bien plus de choses (regex des captures, `CHEMINS`/finals des tests, formules) : le dire au porteur avant.
3. **Chercher ce qui existe.** Une qualité de C-02 §5 qui fait déjà l'affaire évite de toucher au moteur (zone orange). Liste des qualités : `engine/monde.ts`, `DefPiece`, `DefLiaison`, `DefObjet`.
4. **Famille de mélange** (13 §4) : bruit, ralentissement, neutralisation, air. Un morceau qui joue sur la même chose qu'un autre est **refusé avec lui** tant que leur mélange n'a pas de règle acceptée (D-167, D-248). Ne pas inventer la règle : la proposer au porteur.
5. **Questions au porteur**, en langage courant, sans numéro de décision ni jargon, une option recommandée chacune. Celles qu'il faut presque toujours poser :
   - Le morceau entre-t-il au tirage public (NOUVELLE PARTIE), ou seulement dans une station d'essai ?
   - Où attend la créature (une seule place ou plusieurs) ; porte ouverte ou fermée au départ ?
   - Le détail de la mécanique nouvelle (une fois pour toutes ou à chaque fois ; ce qui reste dans l'inventaire ; ce que la créature peut ou ne peut pas faire).
   - Les mélanges avec les morceaux de la même famille, s'il y en a.
6. **Numéros.** Prochain D-xxx : fin de [03](03-decisions.md). Prochain Q-xxx : [06](06-contrats.md), paragraphe « Q-01 à Q-… sont répondus ». **Vérifier les autres copies de travail** (`git worktree list`) : deux morceaux préparés en parallèle prennent les mêmes numéros ; celui qui fusionne en second renumérote.

## 2. Moteur, seulement si une qualité nouvelle est nécessaire (zone orange)

Chaque qualité nouvelle doit atteindre **tous** ces points ; en oublier un ne se voit souvent qu'au bout de 20 minutes de vérification.

| Où | Quoi |
| --- | --- |
| `engine/monde.ts` | Champ dans `DefLiaison` / `DefObjet` / `DefPiece`, avec son commentaire (#issue, décision). Contrôle dans `validerMonde`, message d'erreur exact (`` `${id} : …` ``). |
| `engine/station.ts`, `objetDe` / `liaisonDe` / `porteDe` | **Préfixer** toute référence à un identifiant du morceau (`...ref(morceau, 'champ', objet.champ)`). Oublié, le monde assemblé est invalide (« objet inconnu »). |
| `engine/actions.ts` | Garde de l'action (`verifier`) : rendre une `RaisonRefus` ; `cibles` garde l'option au menu si elle doit rester visible mais indisponible. |
| `engine/vocabulaire.ts` | Nouvelle raison : à la fin de `RAISONS_REFUS` **et** de `RAISONS_INDISPONIBILITE` si le menu doit l'afficher (sinon `observation.ts` lève une erreur). Nouvel événement : `TYPES_EVENEMENT`. |
| `engine/creature.ts` | Si la créature doit en tenir compte : `praticable` (passer), `forcable` (forcer une porte fermée, D-279). |
| `engine/sortie.ts`, `sortiePossible` | Le calcul « plus aucune sortie » (D-275) doit savoir franchir l'obstacle : sinon l'annonce ment, et `check:sortie` le trouve. Exemple : une cloison ne se lève que si sa commande est atteinte **et** sa carte à portée (`aPortee`). |
| `tools/verifier-sortie.ts`, `chercherEvacuation` | En mode `elague`, seuls les gestes sur les objets « utiles » sont gardés (pont, appui, source, carte d'un lecteur). **Un objet indispensable au chemin doit y être ajouté**, sinon la recherche retombe sur la recherche complète et ne finit plus (M-11 : plus de 2 min par station en ordre libre au lieu de 12 s). |
| `tools/verifier-station.ts`, `tools/check-texts.ts`, `tools/check-texts-stations.test.ts` | Si la qualité réutilise `verrouillee` : l'ordre libre ne compte que les cloisons du carrefour (`cloisonsDuCarrefour`), et `verifierLibre` ne garde que les commandes qui les déverrouillent ; ne jamais compter `verrouillee === true` à la main. |
| Tests | `engine/verrous.test.ts`, `engine/creature.test.ts`, ou un fichier de la qualité : fixture propre, noms de rôle (aucune règle ne lit un nom, D-078) ; cas refusé (partie inchangée, `toBe`), cas réussi, effet sur la créature, messages de `validerMonde`, `sortiePossible` vrai et faux. |
| Docs | C-02 §5 (paragraphe de la qualité, ligne « Implémentation et tests » en tête), décision dans 03. |

Un état nouveau dans `EtatPartie` touche aussi la sauvegarde et le rejeu (C-09), `cleEtatRegles` et les empreintes : le signaler au porteur avant.

## 3. Le morceau

### 3.1 Fichier `content/morceaux/m-NN.ts`

Modèle : `m-10.ts` ou `m-11.ts`. En tête, un commentaire avec le schéma des pièces et des portes, et « Texte final non validé. » au-dessus des textes.

- `DefMorceau` (`engine/station.ts`) : `id: 'm-NN'`, `famille`, `pieces`, `liaisons` intérieures **sans `plan`**, `objets`, `entree`, `sortie: { piece, porte: { nom } }` (absente pour un final ; jamais `haute`), `placesCreature`, `demande`, `fournit` (`['acces']` pour un chemin).
- **Plan :** chaque pièce (sauf sous-position) a un `plan` en coordonnées de tuile (`x`, `y`, `largeur`, `hauteur`) ; deux pièces reliées par une porte doivent avoir un mur commun. La forme de la tuile décide si l'assembleur pose toutes les chaînes : mesurer (§5) et viser 100 % ; sous 95 % pour un chemin, changer la forme. M-11 : la forme « sas à droite » échouait sur M-09 puis M-11 puis M-06 ; « sas dessous » passe partout.
- **Identifiants de composition :** `<chemins>-<final>-<nom de la pièce de la créature>`, préfixés par `ol-` en ordre libre (`m11-m03-remise`, `ol-m07-m11-m06-soute`). Le nom de la place doit être **différent** de celui des places des autres morceaux qui peuvent se trouver dans la même station (`reserve` est pris par M-03 : M-11 a pris `remise`), sinon deux compositions ont le même identifiant.
- **Créature :** une place qui bouche le seul passage du morceau n'est proposée que derrière un obstacle qui permet de s'en débarrasser (D-268). Si c'est le cas, l'ajouter à `PLACES_DERRIERE_UN_OBSTACLE` (`content/stations/catalogue.ts`) et à la règle `bouchee` des tests. Si le morceau **permet** de s'en débarrasser, l'ajouter à `AIDES` (et le dire dans la décision). `AIDES` et `bouchee` sont recopiés dans **trois** tests, à changer ensemble : `tools/verifier-station.test.ts`, `tools/stations.test.ts`, `tools/catalogue-complet.test.ts`.
- **Ordre libre :** la commande de la branche est posée dans la pièce de sortie du morceau (`sortie.piece`), sauf exception dans `PIECES_COMMANDE`. Elle doit être **au-delà de l'obstacle** (13 §8.3) : si la pièce de sortie se rejoint sans rien franchir, ajouter l'exception.

### 3.2 Textes du morceau (C-07)

`TEXTES_MORCEAU_MNN: TextesMorceau` dans le même fichier : `noms`, `descriptions`, `assistance` (souvent `{}`).

- Chaque `Nom` : `texte`, `genre`, `nombre`, `elision` (« l'atelier » : `true`).
- Deux variantes au moins par description (D-113), au vouvoiement, courtes, écrites à la main, sans chiffre ni identifiant.
- **Mots interdits** dans un morceau (contrôle `fuitesDeCouches`) : tout mot qui **commence par** `station`, `créature`, `griff`, `gueule` ou `masse` (`MOTS_UNIVERS`, `MOTS_MENACE`).
- **Clés :** une clé de nom ou de description déjà prise par un autre morceau avec un autre texte est renommée par `sansConflit` ; préférer une clé propre (`controle` est à M-04, `sas` au carrefour, `reserve` à M-03).
- **Une description ne décrit pas un état** qui change en partie (voyant rouge, poignée absente, « entre deux portes » alors qu'en ordre libre la pièce est en cul-de-sac). Elle ne nomme ni une pièce voisine ni la solution.
- **Textes communs :** les événements (`cloison_deverrouillee`, etc.), refus et indisponibilités sont partagés par tous les morceaux, dans `content/textes/morceaux.ts` (`EVENEMENTS_REGLES_MORCEAUX`, `REFUS_MORCEAUX`, `INDISPONIBILITES_MORCEAUX`). Un nouvel objet qui réutilise un événement doit **convenir à la phrase existante** (« Vous tournez le lecteur de carte jusqu'en butée » ne convenait pas : la phrase a été réécrite). Un refus ne se raconte pas comme une tentative (C-07 §2) : « … : rien n'a été joué. »
- Nouvelle raison de refus : un texte dans `REFUS_MORCEAUX` et, si le menu l'affiche, dans `INDISPONIBILITES_MORCEAUX`, où le seul rôle permis est `{le:cible}` (`ROLES_INDISPONIBILITE`) ; `tools/check-texts.ts` contrôle le gabarit de chaque raison.
- Nouvel événement : texte dans le socle (`content/textes/socle.ts` ou `EVENEMENTS_REGLES_MORCEAUX`) et dans les mondes écrits en entier s'il peut y arriver (`content/ar-01`, `ar-02`, `monde-test`, `EVENEMENTS_MORCEAUX`) ; ses rôles dans `content/textes/types.ts` (`ROLES_EVENEMENT`, `ROLES_MOMENT`) ; son moment de fin dans `content/textes/fin.ts` s'il doit compter.

### 3.3 Brancher le morceau

- `content/morceaux/index.ts` : importer, puis ajouter l'entrée `[MORCEAU_MNN.id]` après le morceau précédent.
- `content/stations/paires.ts` : une ligne par morceau existant, `a < b` (`'M-01'` … `'M-NN'`), à sa place dans l'ordre ; règle sur le modèle `'<obstacle de l'autre> et <obstacle du nouveau>, sans règle de plus (D-248)'`. Mettre à jour le commentaire `'M-01' à 'M-NN'`.
- `content/stations/catalogue.ts` :
  - `COMPOSITIONS_PUBLIEES` : liste triée, **régénérée** par un script jetable (`tools/tmp-*.ts`, supprimé ensuite) qui imprime `CATALOGUE.compositions.filter((c) => c.refus === null && !bouchee(c)).map((c) => c.id)` avec la règle `bouchee` du test (§3.1). Ne jamais la recopier à la main.
  - `COMPOSITIONS_CONTROLEES` : ajouter une chaîne et un ordre libre avec le nouveau morceau, à leur place triée. **Choisir les moins coûteuses à prouver** qui gardent la couverture du test : deux tests de `check-texts-stations` prouvent toute la liste en 30 s, et M-12 l'a fait dépasser en CI (39 s). Mesurer le coût de chaque candidate avec `verifierStation`/`verifierLibre` (script jetable) ; un ordre libre peut coûter dix fois plus qu'un autre.
- `tools/captures.ts` : une constante `STATION_<NOM> = '<composition>-2718281828'` dessinée dans `capturerPlans` (`Plan — <titre> ${STATION_…}`) et citée dans le commentaire « plans ». Le motif `FORME_STATION` n'accepte que les finals `m03`/`m06` : l'étendre pour un nouveau final.

## 4. Tests qui épinglent des nombres

Mettre à jour avec les nouvelles valeurs, puis **vérifier par le calcul** (ne pas recopier la valeur reçue sans la comprendre). C'est un ajout de morceau, pas un affaiblissement : le dire dans la PR.

| Fichier | Ce qui change |
| --- | --- |
| `tools/stations.test.ts` | Liste de `MORCEAUX` ; table des paires (`NUMEROS`, nombre de paires, permises) ; `CHEMINS` ; nombre de compositions, en chaîne (par final, à un chemin, à deux), en ordre libre ; places écartées en ordre libre ; tirages (3 000 → 5 000 pour M-11, assez pour voir chaque composition publiée une fois). |
| `tools/verifier-station.test.ts` | Total, publiées en chaîne et en ordre libre ; G-02, nombre de refus sans la paire M-03 + M-07 (`50 + 24 + 30` après M-11 : chaînes M-07 → M-03, ordres libres M-07 et M-03, places écartées en ordre libre sans ces derniers) ; nombre de chemins de plans (`162 + 72`) ; `AIDES` et `bouchee` si besoin. |
| `tools/ordre-libre.test.ts` | Nombre d'ordres libres publiés. |
| `tools/couches.test.ts` | Clés de `MORCEAUX_TEXTES`. |
| `tools/check-texts-stations.test.ts` | Liste `COMPOSITIONS_CONTROLEES`. |
| `tools/catalogue-complet.test.ts`, `tools/check-texts.test.ts` | Toute valeur que l'ajout change. |

Formules, avec C chemins, F finals, p(m) places de la créature du morceau m :

- paires : (C + F)(C + F − 1) / 2 ; permises : toutes moins M-03/M-06 et les refus de la table ;
- en chaîne : suites d'un chemin (C) et de deux chemins ordonnés (C(C − 1)), chacune × F finals, chaque composition une fois par place des morceaux de la station ;
- en ordre libre : paires non ordonnées de chemins (C(C − 1)/2) × F × places ;
- M-11 (C = 9, F = 2, une place par morceau) : 55 paires, 54 permises ; en chaîne 9 × 2 × 2 + 72 × 2 × 3 = 468 ; en ordre libre 36 × 2 × 3 = 216 ; 684 au total ; 600 publiées (416 + 184).

## 5. Vérifier

Commandes, dans la copie de travail. Durées mesurées sur le PC du porteur (Windows, 8 processus) après M-11 :

| Commande | Ce qu'elle prouve | Durée |
| --- | --- | --- |
| `npx vitest run engine` | Règles du moteur | 1 à 2 min |
| `npm run check:stations` | Chaque composition publiée est prouvée sans dé ni blessure ; lignes `{"chemin":…,"trouves":…}` : plans posés sur 100 tirages par chemin | 7 à 8 min sans cache ; quelques secondes avec |
| `npm run check:sortie` | « Plus aucune sortie » ne se trompe jamais | environ 20 min |
| `npm run check:texts` | Textes complets, sans fuite, sur les mondes et les compositions contrôlées | 4 à 5 min |
| `npm run mesurer:tirages` | Fréquences, rejets, plans, part des stations où la créature peut être mise hors jeu (D-241), à reporter dans 13 | quelques minutes |
| `npm run verify` | Tout, dans l'ordre | 40 min et plus |

Lire le rapport de `check:stations` (sortie JSON, une ligne par composition) : compter les verdicts du nouveau morceau (`prouvee`, `refusee`, `sans_sortie_sure`, `non_prouvee`) et expliquer chaque composition non publiée (D-268 le plus souvent). Une composition **publiée non prouvée** est un blocage : arrêter et rapporter au porteur.

Leçons de M-12 (#232) :

- **« Prouvée mais non publiée »** : le nouveau morceau permet peut-être de se débarrasser de la créature (M-12 l'attire en arrière avec le bruit du drone). Le vérifier sur toutes ses compositions bouchées, puis l'ajouter à `AIDES` (trois tests) et le dire au porteur, plutôt que de deviner à l'avance.
- **Un objet tiré à l'assemblage** (le drone de #270) : une petite station vaut pour toutes ses graines, donc pour chaque place possible (`verifierChaquePlace`). Exclure d'emblée ce qui ne peut pas se prouver (départ vide GP-04, repaire, cloisons de l'ordre libre) ; une composition qui ne se prouve pas pour une place sort du tirage (`SANS_PREUVE_DRONE`), avec l'accord du porteur.
- **Une règle qui lit les pièces visitées** est invisible au solveur, dont la clé d'état les ignore : la faire vivre dans l'état des règles (la phase « prêt » du drone), sinon le rejeu du témoin échoue.
- **`non_prouvee` au plafond** (150 000 états, `MAX_ETATS`) : ce n'est pas une impasse. Relancer la composition avec un plafond plus haut (`verifierStation(entree, { maxEtats })`). Si elle se prouve, relever le plafond pour les seules compositions du morceau (`PLAFONDS_ELARGIS`, `tools/verifier-station.ts`) : relever le plafond de tout le catalogue changerait le verdict d'autres compositions bouchées et la liste publiée.

**Partie en ligne de commande** : `npm run cli -- nouvelle --station <composition>-<graine> --partie ../essai.json`, puis `npm run cli -- jouer <n> --partie ../essai.json` : sans `--station`, la partie enregistrée reprend sa station. Ne jamais passer la composition sans graine (`--station m11-m03-remise`) : chaque appel tire un autre plan et la partie ne se reprend plus. Jouer le chemin sûr et regarder chaque texte nouveau (descriptions, refus, indisponibilité, événement).

### Pièges de l'environnement (Windows)

- Node n'est pas dans le `PATH` du shell : `export PATH="C:/tools/nodejs/node-v24.22.0-win-x64;$PATH"` (séparateur `;`, chemin à la Windows). Dans un script Python, appeler `node.exe` par son chemin complet.
- `timeout` du shell ne tue pas les processus enfants de `tsx` : préférer un `subprocess` Python avec `taskkill /F /T`.
- La copie de travail a des fins de ligne CRLF : `RP-05` (journal des parties) et `tools/verify.test.ts` (étapes de la CI) échouent en local, pas dans la CI.
- Sous charge, quelques tests longs dépassent leur délai de 30 s (`check-texts-stations`, `app/ecran`, `app/son/declencheurs`) ; `m08-m01-m06-palier` seul prend environ 20 s à prouver, sur `main` aussi. Relancer le fichier seul avant de conclure ; c'est la CI qui fait foi.
- Une nouvelle copie de travail (`git worktree add`) demande `npm ci`.

## 6. Documents à mettre à jour

| Document | Quoi |
| --- | --- |
| [03 — décisions](03-decisions.md) | Une section « Décisions validées — <morceau> (#issue) » en fin de fichier, une décision par réponse du porteur (origine citée mot pour mot) ; les choix de l'agent en « Limite [détail de l'agent] ». Ajouter la plage à la ligne « Stations, génération et fins » de l'index. |
| [13 — morceaux](13-morceaux-lancement.md) | Statut et « Implémentation » en tête ; §2 famille ; §3 fiche (pièces, créature, sûr, risqué) ; §4 phrase sur les paires ; §4.1 lignes de la table et compte ; nouvelle sous-section §7.x : moteur, catalogue (compositions, publiées, non publiées et pourquoi, plans), questions et réponses. |
| [C-02](contrats/C-02-monde-entites.md) §5 | Qualité nouvelle, ligne « Implémentation et tests ». |
| [C-08](contrats/C-08-stations-fins.md) | Nombre de morceaux et de paires. |
| [06 — contrats](06-contrats.md) | « Q-01 à Q-… sont répondus ; le prochain numéro … », renvoi à 13 §7.x. |
| [00 — lire en premier](00-lire-en-premier.md) | Un paragraphe « <morceau> (#issue), proposé par sa PR en zone orange » : contenu, catalogue, reste à faire. |

## 7. PR

- Une issue, une branche (`content/<issue>-<nom>`), une PR, en **zone orange** : pas de fusion avant l'accord du porteur et sa partie au bout sur téléphone avec le morceau (**validation humaine requise** ; aucune case cochée par un agent).
- Corps : ce qui change pour le joueur ; tableau critères ↔ preuves ; tests mis à jour et pourquoi ; limites à confirmer (mélanges sans règle, choix de l'agent) ; ligne `Captures : Plan — <titre>` ; ligne `Tester : m-NN ; <composition avec la créature dans le morceau>` (ex. `Tester : m-12 ; m12-m03-stockage`), d'où le robot tire les liens cliquables de la version de test pour la partie sur téléphone.
- Faire relire le diff par un agent indépendant avant de pousser ; traiter les points bloquants, citer les autres dans la PR.
- `gh` n'est pas installé sur le PC : écrire le corps de PR dans un fichier que le porteur peut ouvrir (par exemple `C:\Users\greffebe\Personal\pr-<issue>.md`) et lui donner l'adresse `https://github.com/greffeb/void-walker/compare/main...<branche>?expand=1`.
