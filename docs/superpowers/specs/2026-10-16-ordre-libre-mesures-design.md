# L5 (#155) — Ordre libre et mesures sur 1 000 tirages : conception

> **Statut :** approuvée par le porteur le 2026-10-16 (D-270), avec ses choix ; précisions apportées pendant l'implémentation au §3.3. Zone orange : le moteur gagne une cloison verrouillée et la commande qui la déverrouille ; aucun format de sauvegarde ne change (la partie se garde comme un journal de commandes, rejoué).
> **Sources :** issue #155 ; 13 §2, §3, §7.1, §7.3, §7.7, §8.1, §8.3 ; 14 §5.6 ; C-08 ; D-084, D-159 à D-162, D-241, D-244, D-249, D-251 à D-254, D-257, D-259, D-264, D-265, D-268 ; [conception de L4](2026-10-16-chemins-ar01-design.md), dont cette livraison reprend le format et l'outillage.

## 1. Intention

1. Ajouter une seconde forme de station, l'**ordre libre** (D-160, D-254, D-259) : deux obstacles partent d'un même couloir, à régler tous les deux, dans l'ordre qu'on veut, avant le problème final. Au fond de chacun, une commande déverrouille l'une des deux cloisons qui mènent au final.
2. Mesurer sur 1 000 tirages la variété et l'équilibre des stations, dont la part où la créature peut être mise hors jeu ou enfermée avant le final (D-241).

**Réussi si :**
- au moins une station en ordre libre est prouvée, publiée et jouable ;
- dans chaque station en ordre libre publiée, les deux ordres de préparation mènent à la capsule sans dé ni blessure ;
- sans l'une des deux commandes, aucune évacuation n'est possible, même avec des dés favorables ;
- sur 1 000 tirages, aucune station non prouvée n'est proposée ;
- le tableau des mesures est dans la PR, dont celle de D-241.

La difficulté reste pour plus tard (D-264).

**Échec même si ça tourne :**
- une station proposée sans preuve ;
- une cloison qu'on peut ouvrir, forcer ou contourner sans sa commande ;
- une branche qu'on peut sauter ;
- un objet nécessaire hors de son morceau (D-244) ;
- une station en chaîne de L2 à L4 qui change ;
- AR-01, AR-02 ou un parcours écrit qui change ;
- une sauvegarde au format changé.

## 2. Hors périmètre

- Signal « plus aucune sortie » (L6).
- Créature placée plus souvent près du final : réserve de D-241, à décider par le porteur sur les mesures.
- Objets hors de leur morceau (D-244), annexes, grandes stations, lore.
- Réglage de la difficulté.

## 3. Forme d'une station en ordre libre

```
vestibule ══porte══ carrefour ══porte══ branche A (morceau de chemin, sans sortie)
                       ║  ╚══porte══ branche B (morceau de chemin, sans sortie)
                  cloison 1 (verrouillée)
                       ║
                      sas
                       ║
                  cloison 2 (verrouillée)
                       ║
                 morceau final (M-03 ou M-06), avec l'embarquement
```

- **Carrefour** : nouveau morceau, propre à l'ordre libre. Il apporte le couloir commun et le sas. Le vestibule donne sur le couloir (13 §8.1). Le couloir dessert les deux branches et la cloison 1 ; le sas est entre les deux cloisons. Ni objet, ni place de créature, ni danger.
- **Branches** : deux morceaux de chemin distincts, pris tels quels. Leur porte de sortie n'existe pas : la branche finit en cul-de-sac dans sa pièce de sortie, et le passager revient au couloir par où il est venu.
- **Commandes** : l'assemblage pose une commande fixe dans la pièce de sortie de chaque branche, « au-delà de l'obstacle » comme le dit le tableau de 13 §8.3 (palier de M-01, salle des pompes de M-02, observation de M-04, hall de M-05, coursive de M-07, bord est de M-08, sas est de M-09, coursive de M-10). La commande de la branche A déverrouille la cloison 1 ; celle de la branche B, la cloison 2.
- **Cloisons** : portes fermées au départ, verrouillées. Elles ne s'ouvrent ni à la main ni autrement tant que leur commande n'a pas été actionnée. Déverrouillées, ce sont des portes ordinaires : elles ne s'ouvrent pas seules.
- **Final** : M-03 ou M-06, inchangés. Le problème final reste à résoudre (13 §8.3).
- **Créature** : une seule, tirée parmi les places des deux branches et du final (D-161), comme en chaîne. Elle n'ouvre jamais de porte.

Les portes entre morceaux sont fermées au départ (D-252), comme en chaîne.

### 3.1 Règles ajoutées au moteur

| Élément | Règle |
| --- | --- |
| Liaison « verrouillée » | Fermée au départ. « Ouvrir » est indisponible, avec la raison « verrouillée », refus sans coût. Rien d'autre ne l'ouvre : ni la créature, ni le vide, ni le feu. Le son, l'air et le feu la traitent comme une porte fermée. |
| Objet « commande de déverrouillage » | Fixe. Nouvelle action **actionner** : une action, sans dé, sans consommable, sans bruit (« action discrète », 13 §8.3). La cloison reste déverrouillée pour toute la partie. Une fois actionnée, la commande disparaît du menu ; la rejouer par une commande directe est refusé (« déjà fait »). |
| Aperçu | SAVOIR annonce « la cloison sera déverrouillée », sans dire où elle est si le passager ne l'a pas vue. |

Aucune autre règle ne change. Ces deux qualités ne servent qu'à l'ordre libre ; les stations en chaîne et les mondes écrits n'en ont pas.

### 3.2 Choix de l'agent

1. **Cloisons portées par le carrefour.** 13 §8.3 dit que les cloisons sont « apportées par l'entrée du morceau final ». Les mettre dans le carrefour donne exactement la même station au joueur et laisse M-03 et M-06 intacts : leurs empreintes ne changent pas, ni les stations en chaîne.
2. **Paires non ordonnées.** La branche A est celle dont le numéro est le plus petit. Échanger A et B n'échange que le rôle des deux cloisons, sans changer la station pour le joueur. On a donc 28 paires × 2 finals × 3 places = **168 compositions** en ordre libre.
3. **Identifiant.** `ol-<A>-<B>-<final>-<place>`, par exemple `ol-m07-m10-m03-soute`. Avec la graine, au plus 38 caractères : il tient dans le champ « monde » de la sauvegarde et du service de rapports (40 au plus).
4. **Tirage inchangé** (D-253) : pile ou face du final, puis pur hasard parmi les compositions publiées de ce final, chaîne et ordre libre confondus. Si toutes les 168 étaient publiées, environ une station sur trois serait en ordre libre (168 sur 492).
5. **Textes.** Noms et descriptions du couloir, du sas, des cloisons et des commandes ; refus « verrouillée ». Un message d'IA Station, à la première arrivée dans le couloir, dit que le sas a deux verrous, chacun levé par une commande au bout d'une aile. Les commandes disent quelle cloison elles lèvent. Écrits par les agents (zone verte, D-116).
6. **Plan.** Le placement des tuiles devient un arbre : chaque morceau s'accroche à la pièce qui le dessert (vestibule au couloir, branches au couloir, final au sas). Mêmes règles, même graine, même budget (GE-01 à GE-07, 14 §5.6). Les stations en chaîne gardent exactement leur plan.

### 3.3 Précisions de l'implémentation (choix de l'agent)

1. **Couloir de 16 cases, sas au bout.** Les branches sont de longues tuiles ; sur les paires les plus longues, un couloir de 8 cases donnait jusqu'à 0 % de plans, un couloir de 16 cases avec le sas au bout en donne 100 %.
2. **Ordre de pose :** le final est posé juste après le carrefour, avant les deux branches. En chaîne, l'ordre et le tirage du plan ne changent pas.
3. **Palier et atelier écartés.** La créature sur le palier de M-01 ou dans l'atelier de M-02 n'est permise que derrière un obstacle qui permet de s'en débarrasser (D-268). En ordre libre, aucune branche n'en précède une autre : ces 28 compositions sont écartées avant tout plan, avec ce motif, au lieu d'atteindre le plafond de la recherche (50 s chacune).
4. **Recherche guidée.** Pour chaque ordre, la recherche développe d'abord les états de l'étape attendue : la branche de la commande à actionner, puis l'autre, puis le final. Même graphe, mêmes transitions, même plafond.
5. **Commande de M-10 dans l'entrepôt.** La pièce de sortie de M-10, la coursive, se rejoint depuis les quartiers sans rien franchir (relevé par la relecture). La commande est posée « après la chambre froide » (13 §8.3), dans l'entrepôt, où attend la créature. Les autres branches la reçoivent dans leur pièce de sortie, au-delà de leur obstacle.
6. **Textes.** Les deux cloisons s'appellent « cloison » ; leur destination les distingue. Les commandes s'appellent « commande du premier verrou du sas » et « commande du second verrou du sas ».

## 4. Preuves de l'ordre libre

1. **Les deux ordres.** Pour chaque composition, le vérifieur cherche deux évacuations sans dé ni blessure : l'une où la commande B n'est jamais actionnée avant la commande A, l'autre dans l'ordre inverse. Les deux témoins sont rejoués par les commandes publiques, export compris. Une composition n'est publiée que si les deux sont trouvés.
2. **Aucune évacuation sans l'une des commandes, même avec des dés favorables.** Preuve sans recherche, donc complète : avec une cloison verrouillée, aucune suite de liaisons, quelles qu'elles soient (étroites, cachées, gouffres, grilles), ne mène du départ à une capsule. On le vérifie pour chaque composition et pour chaque cloison. Un test du moteur explore tout le graphe d'une petite station, toutes commandes sauf la commande et toutes faces de dés comprises, créature et feu présents : la cloison n'est jamais ouverte ni déverrouillée. Une copie où un passage contourne une cloison est rejetée (« une branche pourrait être sautée »).
3. **Une station rejetée**, montrée avec son diagnostic : forcée par `?station=` ou `--station`, elle est refusée « non prouvée : non proposée », et le rapport du vérifieur donne son motif (ex. créature sur le palier sans obstacle d'avant, D-268 ; ou un seul des deux ordres trouvé).

## 5. Mesures sur 1 000 tirages

Nouvelle commande `npm run mesurer:tirages`, hors de `verify` (les tests gardent les seuils). Graine fixe, résultats en tableau Markdown pour la PR et pour 13 §7.8.

| Mesure | Comment |
| --- | --- |
| Fréquences | Sur 1 000 tirages réels : par final, par forme (chaîne à un ou deux chemins, ordre libre), par morceau, par place de la créature. |
| Aucune station non prouvée proposée | Chaque station tirée appartient à une composition prouvée par le vérifieur. |
| Rejets par motif | Sur 1 000 candidats tirés de la même façon, mais parmi toutes les compositions possibles, avant publication : paire refusée, pas de plan, pas de chemin sûr (recherche épuisée), non prouvée (plafond), un seul ordre trouvé. |
| Plans | Au moins 95 % trouvés ; temps par station, moyen et pire, sous 50 ms sur ce PC (14 §5.6). |
| **D-241** | Part des stations tirées où, sans dé ni blessure et **sans entrer dans le morceau final**, la créature peut être mise hors jeu (tombée de la passerelle, ou inerte) ou **enfermée** (dans la chambre froide, ses deux portes fermées). Une recherche qui atteint son plafond compte à part, « indéterminée ». Plus la part où elle ne part pas du morceau final. |

Ces mesures servent au porteur pour décider de la réserve de D-241 ; aucune règle de tirage ne change.

## 6. Contrôle des textes, appli et CLI

- `check:texts` ajoute deux stations en ordre libre à sa série fixe, qui couvrent les cloisons, les commandes et le message du couloir.
- `?station=` et `--station` acceptent les identifiants `ol-…` ; NOUVELLE PARTIE en tire comme les autres.
- Captures : le couloir avec ses deux branches et la cloison verrouillée, une commande actionnée, le plan d'une station en ordre libre.

## 7. Coût de la vérification

Chaque composition en ordre libre demande deux recherches à trois obstacles, avec des retours au couloir. Le temps de `check:stations` augmentera ; il sera mesuré et donné dans la PR. Si le plafond de 150 000 états est atteint, la composition est « non prouvée » et n'est pas proposée, comme aujourd'hui.

## 8. Documents à mettre à jour

13 §3 (fiches : commande en ordre libre), §7.8 (nouveau, mesures), §8.3 (forme retenue) ; 14 §5.6 ; C-02 (deux qualités), C-08 ; journal des décisions ; 00 (reprise).
