# C-08 — Stations assemblées et fins de partie

> **Statut :** CONTRAT ACCEPTÉ v1.0 — D-102 ; assemble D-013, D-017/D-018, D-050, D-054, D-058, D-083 à D-088 ; GP-01 à GP-05 acceptés par D-101.
> **Date :** 2026-10-10.
> **Implémentation, vérifieur et tests :** fin par évacuation (§4, conditions de D-054, défaite prioritaire) proposée par #103 pour AR-01 ; abandon et son écran de fin proposés par #96 (D-200, côté appli) ; « plus aucune sortie », écrans de fin de défaite et d'évacuation, assemblage et vérifieur absents.

## 1. But

Dire ce qu'est une station jouable au lancement, comment elle est assemblée et vérifiée, et comment une partie se termine. Les règles de jeu restent celles de C-01 à C-06.

## 2. Morceaux

Chaque partie combine et place différemment des morceaux écrits à la main et vérifiés à l'avance (D-083). La génération libre de plans et d'objets est exclue du lancement.

- **GP-01 — Contenu d'un morceau :** des pièces, liaisons, objets et effets décrits avec C-02 ; ce qu'il demande pour être franchi ; ce qu'il fournit (accès, objet, alimentation) ; ses points d'attache vers les autres morceaux.
- **GP-02 — Composition d'une station :** une pièce de départ, des morceaux d'obstacle, un embarquement avec capsule, apporté par le morceau final (D-249), une seule créature placée (D-029).
- **GP-03 — Premiers morceaux :** découpés dans AR-01 et AR-02. Le vide cohabite avec le feu et l'huile selon MX-02/MX-03 (D-174), et avec les quatre nouveaux morceaux sans règle de plus (D-246) ; il ne rencontre jamais le bloc, M-03 et M-06 étant tous deux des morceaux finals (D-172).
- **GP-04 — Départ sans danger immédiat :** la pièce de départ laisse lire et explorer avant tout contact (AR-01 §5).

**Volume du lancement :** dix morceaux, six tirés d'AR-01/AR-02 et quatre nouveaux (D-157/D-158) ; deux ou trois obstacles par station (D-119) ; une seule espèce de créature (D-120).

**Règles d'assemblage :**

- un seul problème final par station, juste avant de partir ; les autres obstacles sont sur le chemin (D-159) ;
- obstacles en chaîne ou à préparer dans l'ordre libre, selon les morceaux (D-160) ; l'ordre libre : deux obstacles qui partent d'un même couloir, à régler tous les deux avant le final (D-254) ;
- la créature part d'un endroit prévu par un morceau, tiré au hasard, jamais dans la pièce de départ (D-161) ;
- le problème final se tire d'abord à pile ou face, puis la station au pur hasard parmi celles qui ont ce final ; une station déjà jouée peut revenir (D-162, D-253) ;
- au départ, les portes entre deux morceaux sont fermées (D-252) ;
- deux morceaux qui jouent sur la même chose ne se mélangent que si leur mélange a reçu ses règles ; sinon l'assemblage le refuse (D-167). Les autres se mélangent sans règle de plus (D-248).

Les dix morceaux, leurs deux familles (final, chemin) et leurs fiches sont décrits dans la [conception des morceaux](../13-morceaux-lancement.md), acceptée par D-172 à D-175 ; leurs règles sont dans C-02 §5, C-03 §5.5 et C-04 §3.2.

## 3. Vérification avant de jouer

Toute station assemblée est vérifiée avant d'être proposée (D-084) : il existe au moins un chemin d'évacuation sans dé ni blessure si l'on prépare bien. Une station qui échoue est rejetée, avec un diagnostic ; elle n'est jamais jouée. Un chemin qui passe une fois sous les yeux de la créature grâce à l'action libre du premier contact compte comme sûr (D-250).

- **GP-05 —** Le vérifieur utilise les vraies règles et les vraies commandes, sur l'état complet ; il ne remplace pas la découvrabilité, mesurée par des parties humaines.

## 4. Fins de partie

| Fin | Condition | Source |
| --- | --- | --- |
| Évacuation | Capsule alimentée, passager vivant à bord, écoutille fermée, pas de menace active à bord, départ commandé | D-054 |
| Défaite | Blessures jusqu'à la défaite, ou exposition au vide sans protection | C-04 |
| Abandon | Choisi par le joueur à tout moment | D-085 |

Neutraliser la créature n'est jamais une fin (D-018). Une défaite acquise dans un pas l'emporte sur une évacuation (C-03 §3).

**Plus aucune sortie possible (D-085).** Après chaque action, le jeu vérifie sur l'état réel s'il reste une évacuation possible. Sinon, il le dit ; la partie continue jusqu'à l'abandon ou la défaite. Une évacuation encore possible au prix d'un coup de dés est une sortie : pas de signal (D-251). Le signal n'est jamais faux et ne nomme jamais la sortie restante.

**Écran de fin (D-086).** Le récit seulement, fidèle aux faits ; ni score ni bilan chiffré.

## 5. Rejouer

Après une fin, une nouvelle partie peut reprendre la même station, même état de départ, avec de nouveaux tirages (D-087/D-088). La partie terminée reste terminée (D-013).

## 6. Exemples à prouver

| ID | Cas | Attendu |
| --- | --- | --- |
| G-01 | Assemblage sans chemin sûr | Station rejetée avec diagnostic |
| G-02 | Deux morceaux dont le mélange n'a pas encore de règles, tirés ensemble (D-167) | Assemblage refusé |
| G-03 | Joueur qui consomme la seule ressource indispensable | Signal « plus aucune sortie », partie toujours jouable |
| G-04 | Sortie restante cachée et non découverte | Aucun signal, aucune indication de la sortie |
| G-05 | Rejouer la même station | Même départ, tirages différents |
| G-06 | Créature neutralisée sans départ | Aucune fin déclenchée |

## 7. Réserves

Volume du contenu de lancement, durée 15–30 minutes et diversité réelle seront mesurés, pas déduits du nombre de morceaux.

- Le lancement commence par de petites stations, sans annexes ni boucles ; les grandes viennent seulement si la durée le demande, dans une issue à part (D-242, D-245).
- La part des stations où la créature peut être mise hors jeu ou enfermée (les deux portes de la chambre froide fermées) avant le problème final est mesurée avant toute décision ; la créature placée plus souvent près du final reste en réserve (D-241).
- Dans #106, chaque objet nécessaire à un obstacle reste dans son morceau, à la place prévue par sa fiche ; les objets placés hors de leur morceau, avec une règle de placement à décider, viendront avec les annexes (D-244). Ce que cette règle changera à GP-01 ou aux règles d'assemblage (§2) se décidera avec elle.
