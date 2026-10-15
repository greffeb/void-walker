# L3 (#153) — Baie, passerelle, sans gravité : conception

> **Statut :** approuvé par le porteur le 2026-10-15 (« c'est bon »), après une maquette jetable qu'il avait acceptée (« go ») ; D-263, D-264. Implémenté sur la branche `content/153-baie-passerelle-gravite` ; résultats en 13 §7.6. Zone orange (format des scénarios, ordre de recherche du vérifieur, aucune règle de jeu ni format de sauvegarde changé).
> **Sources :** issue #153 ; 13 §2, §3, §4, §4.1, §7.1, §7.2, §7.5 ; 14 §5.6 ; C-08 ; D-058 à D-074, D-161, D-164, D-165, D-169, D-236 à D-238, D-246, D-249, D-252, D-253, D-260 ; [conception de L2](2026-10-15-premiere-station-tiree-design.md), dont cette livraison reprend le format.

## 1. Intention

Ajouter à la station tirée de L2 le second problème final, la baie (M-06), et deux obstacles de chemin, la passerelle effondrée (M-08) et la zone sans gravité (M-09), puis des stations à deux morceaux de chemin, soit trois obstacles avec le final.

**Réussi si (mots du porteur, 2026-10-15) :** « pouvoir arriver à la capsule ». Toute station tirée se finit par l'évacuation pour qui prépare bien, sans dé ni blessure, et le vérifieur le prouve avant qu'elle soit proposée. **La difficulté se règle plus tard** (même réponse ; après L2, le porteur avait trouvé les stations « trop faciles » : « j'ai juste eu à claquer la porte au nez de la créature »).

**Échec même si ça tourne :** une station proposée sans preuve ; un texte qui nomme une pièce absente ; deux pièces qu'on ne peut pas distinguer à l'écran ; une règle de jeu inventée pour faire tenir un morceau ; une station de L2 qui change ou une partie enregistrée qui ne se reprend plus ; une sauvegarde au format changé.

## 2. Hors périmètre

M-01, M-02, M-04, M-05 (L4) ; ordre libre (L5) ; signal « plus aucune sortie » (L6) ; grandes stations, annexes, objets hors de leur morceau ; lore ; **réglage de la difficulté**, dont la place de la créature plus souvent près du final (D-241) ; écrans de fin ; retrait automatique des validations (D-100 : seules les empreintes sont calculées).

## 3. Morceaux

Même format qu'en L2 (spec L2 §3.1). Les stations de test `m-08`, `m-09` et AR-02 restent écrites en entier, inchangées avec leurs parcours ; les morceaux reprennent leurs pièces et leurs textes, sans leur embarquement d'essai. Choix de l'agent : ne pas refaire `m-08` et `m-09` à partir des morceaux, leurs objets d'essai (touret, burette) et leurs noms de pièces n'étant pas ceux des morceaux.

Mesures de la maquette jetable (§6) : chaque morceau ci-dessous est prouvé dans toutes ses compositions, avec la place de la créature indiquée.

### 3.1 M-06 — Baie et vide (final)

Repris d'AR-02. Pièces :

- **couloir de sécurité** (entrée), porte ouverte vers le local et porte fermée vers la salle panoramique ;
- **local de sécurité** : combinaison, découpeuse, casier mural (indice : « combinaison obligatoire ») ;
- **salle panoramique** : baie (vitrage extérieur), kit de brèche (une rustine) ; porte grippée fermée vers l'embarquement ;
- **salle d'embarquement** : capsule **déjà alimentée**, comme dans AR-02 ; écoutille fermée au départ (D-196) ; cabine en sous-position.

**Place de la créature : l'embarquement, devant la capsule** (fiche, D-249). Le morceau fournit l'évacuation et demande l'accès.

Choix de l'agent :

- L'entrée remplace les cabines du personnel d'AR-02, qui étaient la pièce de réveil. Elle garde la signalétique d'évacuation, qui ne nomme que des pièces du morceau. Le terminal personnel n'y figure pas. Ses descriptions disent les voyants d'air au-dessus des portes : ce sont eux qui annoncent l'air perdu.
- Aucun message d'IA Station propre à la baie ; pas de « présence détectée » : la créature peut être tirée ailleurs (§4.3).

### 3.2 M-08 — Passerelle effondrée (chemin)

Repris de la station de test `m-08` :

- quartiers (entrée), ouverts sur l'atelier (la planche, encombrante) ;
- porte grippée fermée vers la galerie nord ;
- vide (gouffre) entre la galerie nord et la galerie sud ;
- porte fermée vers le magasin ;
- sortie par une porte ordinaire depuis la galerie sud.

**Place de la créature : le magasin, de l'autre côté du vide** (fiche), comme la réserve de la station de test.

Choix de l'agent :

- **Le magasin.** La réserve de la station de test s'appelle ici « magasin », pour ne pas se confondre avec la réserve de M-03 (§4.2).
- **Pas de touret.** Il ne servait qu'à la station de test ; la description de l'atelier est réécrite sans lui.
- **Message d'arrivée gardé.** Celui de la galerie nord (« Passerelle effondrée… ») reste : il ne nomme rien hors du morceau.

### 3.3 M-09 — Zone sans gravité (chemin)

Repris de la station de test `m-09` :

- quartiers (entrée) ;
- porte fermée vers le sas ouest (interrupteur de gravité) ;
- coursive de transfert sans gravité au départ ;
- sas est (interrupteur de gravité) ;
- porte fermée vers la cale ;
- sortie par une porte ordinaire depuis le sas est.

**Place de la créature : la cale, au-delà de la coursive** (fiche), comme la soute de la station de test.

Choix de l'agent :

- **La cale.** La soute de la station de test s'appelle ici « cale », pour ne pas se confondre avec la soute de M-07.
- **Pas de burette.** Elle ne servait qu'au cas MX-04 de la station de test.
- **Clé distincte pour l'interrupteur.** La clé de texte de l'interrupteur de gravité est distincte de celle des machines (M-07).
- **Message d'arrivée gardé.** Celui du sas ouest (« Gravité coupée… ») reste.

### 3.4 Textes par couches

Comme en L2 (spec L2 §6) : socle, univers, menace, morceaux. Les nouveaux textes ne nomment aucune pièce hors de leur morceau ; le contrôle des fuites de couches s'applique aux trois nouveaux morceaux. Textes finals non validés, écrits par les agents (zone verte, D-116).

## 4. Assemblage

### 4.1 Compositions

- Une composition = vestibule, **un ou deux** morceaux de chemin distincts, dans un ordre donné, le final, puis une place de créature tirée parmi celles de ces morceaux (D-161), jamais au départ.
- Chemins possibles : M-07, M-08, M-09, M-10. Finals : M-03, M-06. Soit 4 × 2 × 2 = 16 compositions à un chemin et 12 × 2 × 3 = 72 à deux chemins : **88**.
- Chaque paire de morceaux de la station (chemin–chemin, chemin–final) est lue dans la table des 45 paires ; toute paire refusée ou absente écarte la composition avant tout plan (D-167, G-02). Avec ces six morceaux, seule M-03 + M-06 est refusée, et elle n'arrive jamais : un seul final par station.
- Portes entre morceaux fermées au départ (D-252). L'assembleur de L2 enchaîne déjà autant de morceaux qu'on veut.
- Identifiant : `<chemins>-<final>-<place>`, par exemple `m07-m08-m06-embarquement` ; station : `<composition>-<graine du plan>`, 40 caractères au plus (35 pour la plus longue), minuscules, chiffres et tirets.
- **Les quatre compositions de L2 gardent leur identifiant et donnent exactement la même station à graine égale** : les parties enregistrées et les validations de L2 restent valables. Preuve par l'empreinte du monde.

### 4.2 Noms de pièces et clés de texte

Deux morceaux d'une même station peuvent apporter des pièces de même nom (les quartiers de M-07, M-08, M-09 et M-10, les coursives de M-07 et M-10) :

- **Pièces de même nom affiché : une lettre** (« coursive A », « coursive B »), dans l'ordre des pièces (D-208, comme L2). La lettre se décide sur le nom affiché, plus seulement sur la clé.
- **Une clé de texte propre à deux morceaux d'une même station, avec deux textes différents** (la coursive de M-07 et celle de M-10), devient propre à chacun dans cette station, sans changer les morceaux ni leur empreinte. Aujourd'hui, réunir leurs textes échoue.
- **Places de la créature distinctes** : dans une composition, aucune place ne porte le nom d'une autre, sinon l'identifiant serait ambigu. D'où le magasin (M-08) et la cale (M-09). Un test le vérifie pour tout le catalogue.

M-07, M-10 et M-03 ne changent pas : leurs empreintes restent celles de L2.

### 4.3 Tirage (D-253, D-260)

Pile ou face entre M-03 et M-06, maintenant tous deux disponibles ; puis une composition publiée au hasard parmi celles de ce final ; puis la graine du plan. Une station déjà jouée peut revenir.

Conséquences, sans règle nouvelle (à mesurer, §7) :

- Environ quatre stations sur cinq ont deux chemins, si tout est publié (36 compositions sur 44 par final).
- Dans une station avec la baie, la créature attend devant la capsule une fois sur deux ou sur trois. Ailleurs, la baie peut servir à lui ôter l'air. C'est une question de difficulté, laissée pour plus tard (§1).

### 4.4 Plans

Même poseur qu'en L2 (GE-01 à GE-07). Maquette : **1 000 plans sur 1 000** pour chacune des 32 chaînes de tuiles, 0,54 ms en moyenne, 4,2 ms au pire, sous les 50 ms visés (14 §5.6). Les échecs à quatre tuiles mesurés sur des chaînes sans plan (jusqu'à 58 ms, 14 §5.6) ne se produisent pas avec les vraies tuiles. À remesurer dans `check:stations`.

## 5. Mélanges joués en station assemblée

Chaque cas est un test qui assemble une station du catalogue et la fait jouer par le moteur :

| Cas | Station | Ce que le test montre |
| --- | --- | --- |
| **MX-01** (D-174) | M-09 et M-10, dans un ordre où la créature passe la zone sans gravité | Ralentie par le froid, sa dérive sans gravité se compte sur les réactions qui restent : quatre réactions utiles, une sur deux, comme le test du moteur, mais dans la station assemblée |
| **Planche et bloc** (D-169) | M-08 puis M-03 | Planche en main, le bloc d'énergie est refusé sans coût (encombrant) ; planche posée, il se prend |
| **Vide dans les nouveaux morceaux** (D-246) | M-06 avec chacun de M-07, M-08, M-09, M-10 (au moins deux stations à deux chemins) | Baie percée, portes ouvertes jusqu'en arrière : l'air quitte la salle des machines, les deux bords de la passerelle (par-dessus le vide), la coursive de transfert et la chambre froide ; une créature exposée hors de la panoramique devient inerte |

Choix de l'agent : planche et bloc, et le vide, se jouent depuis le départ par des commandes publiques. MX-01 peut partir d'un état préparé dans la station assemblée (créature ralentie près de la zone), comme le test du moteur, si l'amener là par des commandes demande une longue poursuite ; le test dit pourquoi.

## 6. Vérifieur : le premier risque technique

### 6.1 Mesure (maquette jetable, 2026-10-15)

Sur ce PC, avec le vérifieur de L1 tel quel (recherche en largeur, plafond de 150 000 états), sur 28 des 88 compositions, la mesure ayant été arrêtée faute d'utilité :

- **À un seul chemin**, tout est prouvé sauf la baie avec la créature devant la capsule derrière M-08, M-09 ou M-10, qui atteint le plafond (5 à 6 s). Avec M-07, elle est prouvée en 125 830 états.
- **À deux chemins**, 1 sur 12 est prouvée ; les 11 autres atteignent le plafond, en 5 à 6 s chacune. La largeur essaie tous les chemins courts : dans une station plus longue, leurs combinaisons (portes, objets posés, place de la créature) explosent avant d'atteindre la capsule.

Avec un autre **ordre de recherche** (§6.2), sur **les 88** : toutes prouvées, au plus 4 404 états et 0,28 s, **6,3 s pour tout le catalogue** ; chemins sûrs de 14 à 31 actions, chacun rejoué sans dé ni blessure jusqu'à l'évacuation.

### 6.2 Changement retenu (choix de l'agent)

Le vérifieur développe d'abord les états où le passager est **dans le morceau le plus avancé de la station**, puis, à égalité, dans l'ordre d'arrivée.

- **Ce qui ne change pas :** les règles, les commandes, la clé d'état, le plafond de 150 000 états, le rejeu du témoin et de l'export. Le graphe exploré est le même, seul l'ordre change. Une recherche épuisée donne donc le même verdict « sans sortie sûre » qu'en largeur, et les copies cassées de L1 restent rejetées.
- **Mondes écrits en entier** (AR-01, AR-02, monde de test, `m-08`, `m-09`) : comme leurs pièces ne sont pas rattachées à des morceaux, l'ordre reste celui de la largeur. Leurs résultats de L1 ne changent pas. Les stations de test `m-07` et `m-10`, assemblées depuis L2, suivent le nouvel ordre ; leurs parcours écrits ne changent pas.
- **Ce qui change :** le chemin témoin n'est plus forcément le plus court. Le rapport le dit.

### 6.3 Parades de l'issue

- **Plafond, verdict « non prouvée » :** il existe déjà. Une composition non prouvée n'est jamais publiée.
- **Résultats gardés par empreinte :** pas faits, ce n'est pas nécessaire (6 s). Ce serait risqué aussi : l'empreinte d'un morceau ne couvre pas les règles du moteur, et un verdict gardé deviendrait faux après un changement de règle. Les empreintes restent calculées et affichées par composition (D-100).
- **Job de CI à part :** pas nécessaire. `check:stations` reste dans `verify`.

### 6.4 Contrôle des textes

`check:texts` explore chaque station publiée jusqu'à 50 000 états (environ 20 s chacune, 87 s pour les quatre de L2). Sur 88 stations, il prendrait une demi-heure. Choix de l'agent : il contrôle une **série fixe de stations**, écrite dans le contenu. Un test vérifie que la série couvre :

- chaque morceau ;
- chaque place de la créature ;
- chaque chemin en première et en seconde position ;
- les trois cas du §5.

Six stations suffisent : environ deux minutes. Les mondes écrits en entier restent tous contrôlés.

## 7. Catalogue publié, statistiques

- La liste des compositions publiées, écrite dans le contenu, doit correspondre exactement aux compositions prouvées (comme en L2). Si les 88 sont prouvées, elles sont toutes publiées.
- `check:stations` affiche par composition : le verdict, les états, le temps, la longueur du témoin, les empreintes. Il affiche aussi les plans par chaîne de tuiles, et **les statistiques de 1 000 tirages** :
  - la répartition des deux finals ;
  - les stations à un et à deux chemins ;
  - la fréquence de chaque morceau ;
  - la fréquence de chaque place de la créature.
- Les statistiques sont affichées, pas assertées. Le pile ou face est vérifié par un test à hasard imposé.

## 8. Appli et CLI

Rien de nouveau : NOUVELLE PARTIE, REJOUER, REPRENDRE, `?station=` et `--station` acceptent les nouveaux identifiants. Version publique : la baie entre dans le tirage dès la fusion (D-260).

## 9. Preuves

- Vérification complète verte, `check:stations` compris : 88 compositions et leur tableau, plans, statistiques de tirage, empreintes de M-06, M-08 et M-09.
- Tests du §5 (MX-01, planche et bloc, vide dans les quatre nouveaux morceaux de chemin).
- Les quatre stations de L2 inchangées (empreinte du monde) ; parcours de `m-08`, `m-09`, AR-02 inchangés et verts.
- Captures ciblées : une station à trois obstacles avec la baie, au réveil et sur son plan ; quelques plans des nouvelles chaînes. Version de test.
- Partie CLI d'un playtester aveugle sur une station à trois obstacles avec la baie ; relecture indépendante.
- **Validation humaine requise** sur téléphone : une partie menée au bout pour chacun de M-06, M-08 et M-09 (D-098). La PR donne des liens `?station=` qui en contiennent chacun.

## 10. Documents à mettre à jour

13 §3 (fiches M-06, M-08, M-09 : places et noms), §7.3 (ordre de recherche), nouveau §7.6 (L3 : mesures, statistiques, empreintes) ; 14 §5.6 (plans à quatre tuiles) ; C-08 si le vérifieur y est décrit ; 00-lire-en-premier (reprise) ; 03-décisions (réponses du porteur et détails de l'agent).
