# C-08 — Stations assemblées et fins de partie

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-102 ; assemble D-013, D-017/D-018, D-050, D-054, D-058, D-083 à D-088 ; GP-01 à GP-05 acceptés par D-101.
> **Mise à jour :** 2026-10-14 — cadrage L0, D-257 à D-260 ; conception acceptée, assemblage toujours à implémenter.
> **Implémentation, vérifieur et tests :** fin par évacuation (§4, conditions de D-054, défaite prioritaire) proposée par #103 pour AR-01 ; abandon et son écran de fin proposés par #96 (D-200, côté appli) ; assemblage et vérifieur par L1 à L5 de #106 ; « plus aucune sortie » proposé par L6 (#156, D-275), G-03, G-04 et G-06 testés ; écrans de fin de défaite et d'évacuation proposés par #208 (D-281 à D-286).

## 1. But

Dire ce qu'est une station jouable au lancement, comment elle est assemblée et vérifiée, et comment une partie se termine. Les règles de jeu restent celles de C-01 à C-06.

## 2. Morceaux

Chaque partie combine et place différemment des morceaux écrits à la main et vérifiés à l'avance (D-083). La génération libre de plans et d'objets est exclue du lancement.

- **GP-01 — Contenu d'un morceau :** des pièces, liaisons, objets et effets décrits avec C-02 ; ce qu'il demande pour être franchi ; ce qu'il fournit (accès, objet, alimentation) ; ses points d'attache vers les autres morceaux.
- **GP-02 — Composition d'une station :** une pièce de départ, des morceaux d'obstacle, un embarquement avec capsule, apporté par le morceau final (D-249), une seule créature placée (D-029).
- **GP-03 — Premiers morceaux :** découpés dans AR-01 et AR-02. Le vide cohabite avec le feu et l'huile selon MX-02/MX-03 (D-174), et avec les quatre nouveaux morceaux sans règle de plus (D-246) ; il ne rencontre jamais le bloc, M-03 et M-06 étant tous deux des morceaux finals (D-172).
- **GP-04 — Départ sans danger immédiat :** la pièce de départ laisse lire et explorer avant tout contact (AR-01 §5). Pour les stations assemblées, c'est un vestibule sans danger, sans créature ni objet, avec une porte ordinaire fermée vers la suite, à ouvrir à la main (D-257). En ordre libre, elle donne sur le couloir des deux branches. La sécurité vaut avant la première ouverture, pas comme une immunité permanente ; les actions gardent leur coût ordinaire. Fiche : [13 §8.1](../13-morceaux-lancement.md#81-pièce-de-départ--q-182-d-257).

**Volume du lancement :** dix morceaux, six tirés d'AR-01/AR-02 et quatre nouveaux (D-157/D-158) ; deux ou trois obstacles par station (D-119) ; une seule espèce de créature (D-120).

**Règles d'assemblage :**

- un seul problème final par station, juste avant de partir ; les autres obstacles sont sur le chemin (D-159) ;
- obstacles en chaîne ou à préparer dans l'ordre libre, selon les morceaux (D-160) ; en ordre libre, deux obstacles partent d'un même couloir, à régler tous les deux, dans n'importe quel ordre, avant le final (D-254, D-259) ;
- la créature part d'un endroit prévu par un morceau, tiré au hasard, jamais dans la pièce de départ (D-161) ;
- le problème final se tire d'abord à pile ou face, puis la station au pur hasard parmi celles qui ont ce final ; une station déjà jouée peut revenir (D-162, D-253) ;
- au départ, les portes entre deux morceaux sont fermées (D-252) ;
- deux morceaux qui jouent sur la même chose ne se mélangent que si leur mélange a reçu ses règles ; sinon l'assemblage le refuse (D-167). Les autres se mélangent sans règle de plus (D-248).

Les dix morceaux, leurs deux familles (final, chemin) et leurs fiches sont décrits dans la [conception des morceaux](../13-morceaux-lancement.md), acceptée par D-172 à D-175 ; leurs règles sont dans C-02 §5, C-03 §5.5 et C-04 §3.2. Un onzième morceau de chemin, le sas de sécurité M-11, s'y ajoute (#203, D-290 à D-293), puis un douzième, le chariot et le drone réparable M-12 (#232, D-304 à D-307).

**Compatibilité exhaustive :** [13 §4.1](../13-morceaux-lancement.md#41-table-exhaustive-des-paires-l0-150) énumère les paires du socle, chacune avec sa règle ; avec M-11 et M-12, 66 paires, seule M-03/M-06 est interdite, les deux morceaux étant finals. Une paire permise ne dispense ni du respect des attaches ni du chemin sûr. Toute paire absente ou refusée est écartée par l'assembleur avant le plan ; le défaut de règle pour un futur mélange n'est pas une permission.

**Place de M-01 (D-258) :** la créature peut attendre seulement sur son palier de sortie, jamais dans la galerie en feu ni dans la pièce d'entrée avec l'eau. Les trois pièces appartiennent à M-01 et leurs deux portes intérieures sont fermées au départ ; le palier n'est pas une annexe. Le parcours complet avec cette place reste à prouver en L4 ([13 §8.2](../13-morceaux-lancement.md#82-créature-autour-de-m-01--q-183-d-258)).

**Apports de l'ordre libre (D-259, implémentés en L5, #155) :** chaque branche donne accès à sa commande fixe, au-delà de son obstacle. Les deux commandes déverrouillent chacune une cloison différente ; les deux cloisons sont successives sur l'entrée du final, sans passage qui les contourne. Actionner une commande coûte une action discrète, sans dé ni consommable ; le déverrouillage est acquis pour la partie. Une cloison verrouillée ne s'ouvre pas à la main ; déverrouillée, elle s'ouvre et se ferme normalement, sans ouverture automatique. Chaque branche ramène au couloir commun, pas derrière les cloisons. Les objets restent dans leur morceau ; le final garde son propre problème à résoudre. Les deux ordres doivent permettre une évacuation sans dé ni blessure ; sans l'un ou l'autre des déverrouillages, aucune évacuation ne doit être possible, même avec des dés favorables. Les versions en chaîne et les stations de test existantes ne reçoivent pas ces commandes. Détail des apports des huit morceaux : [13 §8.3](../13-morceaux-lancement.md#83-deux-branches-toutes-deux-utiles--q-184-d-259). Forme implémentée, preuves G-07 et G-08 et mesures : [13 §7.8](../13-morceaux-lancement.md#78-ordre-libre-et-mesures-l5-155).

## 3. Vérification avant de jouer

**Extension M-12 (D-304 à D-307, #232).** Le chariot et le drone ajoutent un douzième morceau de chemin, après M-11. Il est disponible en station d'essai et dans les compositions publiques, à condition que `check:stations` les prouve. L'obstacle matériel reste réel même si la créature est ailleurs ou neutralisée. Une panne réparable ne doit pas produire un faux « plus aucune sortie » : le calcul considère la possibilité de rejoindre le drone, de le remettre en route et d'accomplir la coopération. Il ne suppose pas qu'un passager peut maintenir une poignée dans une pièce tout en poussant dans une autre. M-11 et M-12 se mélangent sans règle de plus (D-248), le blindage de M-11 restant entier.

Toute station assemblée est vérifiée avant d'être proposée (D-084) : il existe au moins un chemin d'évacuation sans dé ni blessure si l'on prépare bien. Une station qui échoue est rejetée, avec un diagnostic ; elle n'est jamais jouée. Un chemin qui passe une fois sous les yeux de la créature grâce à l'action libre du premier contact compte comme sûr (D-250).

- **GP-05 —** Le vérifieur utilise les vraies règles et les vraies commandes, sur l'état complet ; il ne remplace pas la découvrabilité, mesurée par des parties humaines.

## 4. Fins de partie

| Fin | Condition | Source |
| --- | --- | --- |
| Évacuation | Capsule alimentée, passager vivant à bord, écoutille fermée, pas de menace active à bord, départ commandé | D-054 |
| Défaite | Blessures jusqu'à la défaite, ou exposition au vide sans protection | C-04 |
| Abandon | Choisi par le joueur à tout moment | D-085 |

Neutraliser la créature n'est jamais une fin (D-018). Une défaite acquise dans un pas l'emporte sur une évacuation (C-03 §3).

**Plus aucune sortie possible (D-085, D-275).** Après chaque action, le jeu vérifie sur l'état réel s'il reste une évacuation possible. Sinon, il le dit ; la partie continue jusqu'à l'abandon ou la défaite. Une évacuation encore possible au prix d'un coup de dés est une sortie : pas de signal (D-251). Le signal n'est jamais faux et ne nomme jamais la sortie restante. « Possible » se juge sur le chemin seul (D-275) : passages, objets à apporter, commandes des cloisons et énergie de la capsule ; dés, blessures, créature, feu, froid et vide ne ferment aucun chemin, et un passager trop blessé pour passer n'a pas le signal.

**Écran de fin (D-086, D-281 à D-284).** Le récit seulement, fidèle aux faits : la partie racontée par ses moments marquants, puis la cause d'une défaite ou le départ de la capsule ; ni score ni bilan chiffré, ni liste des pièces.

## 5. Rejouer

Après une fin, une nouvelle partie peut reprendre la même station, même état de départ, avec de nouveaux tirages (D-087/D-088). La partie terminée reste terminée (D-013).

À partir de L2, NOUVELLE PARTIE tire une station parmi les compositions vérifiées disponibles, dans la version publique comme dans celle de test (D-260). REJOUER CETTE STATION garde le même départ avec de nouveaux dés ; les aventures de référence restent accessibles par lien. En L2, seul M-03 est disponible : le tirage reste parmi ses compositions vérifiées. Dès que M-03 et M-06 sont disponibles et vérifiés, à partir de L3, pile ou face entre les deux finals puis pur hasard parmi les compositions du final retenu (D-253, exception transitoire D-260). REPRENDRE et les parties en cours restent inchangés. L0 ne modifie aucun de ces boutons dans le jeu.

## 6. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| G-01 | Assemblage sans chemin sûr | Station rejetée avec diagnostic |
| G-02 | Deux morceaux qui jouent sur la même chose, dont le mélange n'a pas encore de règles, tirés ensemble (D-167, D-248) | Assemblage refusé |
| G-03 | Joueur qui consomme la seule ressource indispensable | Signal « plus aucune sortie », partie toujours jouable |
| G-04 | Sortie restante cachée et non découverte | Aucun signal, aucune indication de la sortie |
| G-05 | Rejouer la même station | Même départ, tirages différents |
| G-06 | Créature neutralisée sans départ | Aucune fin déclenchée |
| G-07 | Station en ordre libre préparée dans chacun des deux ordres | Évacuation sans dé ni blessure dans les deux cas (D-259) |
| G-08 | Station en ordre libre sans l'un ou l'autre des déverrouillages | Aucune évacuation possible, même avec des dés favorables (D-259) |

## 7. Réserves

Volume du contenu de lancement, durée 15–30 minutes et diversité réelle seront mesurés, pas déduits du nombre de morceaux.

- Le lancement commence par de petites stations, sans annexes ni boucles ; les grandes viennent seulement si la durée le demande, dans une issue à part (D-242, D-245).
- La part des stations où la créature peut être mise hors jeu ou enfermée (les deux portes de la chambre froide fermées) avant le problème final est mesurée avant toute décision ; la créature placée plus souvent près du final reste en réserve (D-241).
- Dans #106, chaque objet nécessaire à un obstacle reste dans son morceau, à la place prévue par sa fiche ; les objets placés hors de leur morceau, avec une règle de placement à décider, viendront avec les annexes (D-244). Ce que cette règle changera à GP-01 ou aux règles d'assemblage (§2) se décidera avec elle.
