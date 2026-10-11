# C-04 — Risques, blessures et soin — socle AR-01 et AR-02

> **Statut :** CONTRAT DE CONCEPTION VALIDÉ v0.4, PORTÉE AR-01, AR-02 ET MORCEAUX DU LANCEMENT — D-041/D-042/D-052/D-053/D-055/D-057 ; vide D-059/D-060/D-072/D-073/D-074 ; morceaux D-165/D-166/D-175 ; interception et soin précisés par D-183 à D-185.
> **Date :** 2026-10-11.
> **Implémentation :** §2 à §4 et RSK-01 à RSK-09 (#101) ; vide, feu et morceaux absents. **Calibrage humain et validation téléphone :** non réalisés.

## 1. Portée

Ce contrat formalise les règles acceptées pour la première [aventure de référence](../08-aventure-reference.md). Le [temps et le budget de réaction](C-03-temps-reactions.md) relèvent de C-03 ; l'observation publique relève de C-01.

Un risque est une incertitude réelle sur une tentative possible, pas un moyen de franchir une précondition impossible. Une préparation complète qui élimine la source de risque supprime le jet. Un effet certain reste soumis aux dangers indépendants si le joueur s'y expose.

## 2. États de santé

| État avant incident ordinaire | Après une aggravation | Après un soin utile |
| --- | --- | --- |
| Indemne | Blessé | Pas d'amélioration possible ; indisponibilité publique plutôt que consommation implicite |
| Blessé | Critique | Indemne |
| Critique | Défaite | Blessé |
| Défaite | Partie terminée | Pas d'action de soin après conclusion |

Le soin utile coûte un engagement et consomme la ressource correspondante. Il n'efface pas l'historique et ne réinitialise pas la menace. Aucun malus de déplacement en cascade selon les blessures dans AR-01 : le personnage critique peut encore agir pour s'échapper.

L'indisponibilité d'un soin sans amélioration découle de C-01 (précondition publique manquante) ; une éventuelle action de gaspillage volontaire, si ajoutée, aurait un autre contrat explicite. Ne pas la créer par défaut.

## 3. Une aggravation maximale par engagement

Les conséquences ordinaires de feu et de menace gardent leurs causes, mais produisent au plus **une aggravation** pour le même engagement. Une source déjà traitée ne provoque pas une seconde sanction cachée plus loin dans la boucle.

Le soin s'applique comme effet du geste engagé avant les expositions suivantes. Si le joueur reste à découvert, une aggravation peut suivre ce soin dans le même pas ; le résultat doit montrer les deux événements sans annoncer une sécurité fictive.

Un état de défaite acquis est terminal. Le plafond n'efface pas les dangers persistants ; le prochain engagement peut de nouveau aggraver une blessure. L'exposition au vide n'est pas une aggravation ordinaire : voir §3.1.

### 3.1 Exposition au vide — AR-02

Un passager sans combinaison dans une pièce sans air ([C-03 §5.4](C-03-temps-reactions.md)) à la mise à jour des dangers est vaincu, hors plafond, sans jet (D-059). La combinaison protège entièrement ; l'enfiler, la retirer ou la remettre coûte une action, et retirée elle reste avec le passager (D-060/D-072/D-073).

Toute action connue pour exposer le passager — percer, ouvrir vers une zone sans air, retirer la combinaison sans air — est annoncée « mortel » avant engagement. L'aperçu nomme les pièces connues qui perdent ou retrouvent l'air, jamais l'effet sur une créature non perçue (D-071).

### 3.2 Chambre froide et sans gravité — morceaux du lancement

Le passager qui reste plus de deux actions de suite dans la chambre froide subit une aggravation ordinaire, soumise au plafond d'une par action (D-166). Traverser une zone sans gravité lui coûte deux actions, sans blessure (D-165). Ces coûts sont annoncés avant l'action, comme tout danger connu (D-020).

## 4. Franchissement exposé

### 4.1 Préconditions

Le trajet est physiquement praticable pour le personnage et ce qu'il porte. Une créature est en mesure d'intercepter la position franchie ; la préparation n'a pas retiré ce risque.

Porte fermée, gabarit incompatible, objet absent, commande périmée : refus selon C-01, pas de jet de fuite qui contourne la validation. Préparation efficace — créature séparée, hors de vue sur le trajet ou temporairement incapable de réagir — peut rendre le franchissement certain.

### 4.2 Résolution de référence

| D6 enregistré | Résultat mécanique |
| --- | --- |
| 4, 5 ou 6 | Franchissement accompli, sans aggravation due à cette interception |
| 1, 2 ou 3 | Franchissement accompli, une aggravation ordinaire |

Le jet résout l'interception **avant le changement de position** au sens de la validation ; son résultat contient ensuite le déplacement et l'aggravation éventuelle comme une transition cohérente. Sur résultat défavorable, le personnage ne reste pas immobile : D-052 exige le succès partiel.

Ce jet consomme la réaction hostile de cette créature pour l'engagement, même si aucune blessure ne résulte. Ni attaque supplémentaire ni déplacement supplémentaire dans ce même pas. La poursuite pourra reprendre au prochain engagement avec des indices réellement acquis, sans connaître la nouvelle position par magie.

**Rester sous ses yeux (D-183).** Une action faite dans la pièce de la créature, après le premier contact, se résout au même D6, que le passager parte ou reste. L'action qui suit immédiatement le premier contact est libre, sans dé ni blessure (D-184).

Si le joueur critique subit l'aggravation, sa destination est enregistrée et la partie conclut en défaite. Une arrivée en embarquement ne le transforme pas en survivant après coup.

### 4.3 Information affichée

Risque qualitatif et danger connu, par exemple « risque élevé : blessure possible ». Pas de pourcentage dans le menu. L'affichage du résultat de dé, s'il est présenté, doit refléter le tirage enregistré ; aucune animation ne retouche le résultat.

Cette indication n'est pas un radar : les options et estimations ne dévoilent pas une créature encore non perceptible. Une découverte à l'engagement suit le modèle de contact de C-03, sans donner rétroactivement au joueur une information qu'il ne pouvait pas connaître.

## 5. Conséquences certaines et nouvelle tentative

Rester exposé à un incident dont les conditions sont réunies ou entrer sans protection dans un foyer peut avoir une conséquence certaine, annoncée comme telle. Ne pas inventer un dé de consolation pour un effet déterministe.

Une nouvelle tentative est un nouvel engagement dans le nouvel état, avec ses coûts et risques (D-024). Une simple répétition ne diminue pas gratuitement la difficulté et ne recrée pas des consommables. Recharger l'application n'est jamais une nouvelle tentative : même état, événement et résultat déjà enregistrés.

## 6. Attentes de test, non exécutées

| ID | Cas | Attente |
| --- | --- | --- |
| RSK-01 | Même franchissement préparé, flux RNG différents | Pas de dé nécessaire, même effet matériel |
| RSK-02 | Fuite exposée avec D6 = 1 puis D6 = 6, sur deux fixtures distinctes | Destination atteinte dans les deux ; aggravation uniquement dans la première |
| RSK-03 | Bloc trop large au conduit, D6 favorable disponible | Refus sans tirage, sans perte/dépôt de bloc et sans déplacement |
| RSK-04 | Interception et foyer provoquent chacun un incident dans un pas | Causes conservées, une seule aggravation ordinaire |
| RSK-05 | Fuite résolue, créature avec réaction nominalement disponible | Pas de seconde attaque ni mouvement gratuit après le même jet |
| RSK-06 | Personnage blessé, soin utile, zone sûre | Indemne, ressource consommée, mémoire et position de la menace inchangées par le soin |
| RSK-07 | Personnage critique, franchissement avec D6 = 1 | Déplacement enregistré puis défaite ; aucune victoire d'arrivée |
| RSK-08 | Reprise après un résultat défavorable | Blessure et destination conservées, pas de nouveau D6 |
| RSK-09 | Consultation répétée du risque | Zéro engagement, aucun tirage métier consommé, aucune fuite d'état caché |
| RSK-10 | Percer sans combinaison | Aperçu « mortel », aucun dé ; défaite si engagé |
| RSK-11 | Percer en combinaison, créature dans la pièce | Aucune aggravation du passager, aucun dé |

Les fixtures de tests doivent identifier leurs injections d'état. Les témoins complets d'AR-01 restent à exécuter depuis une nouvelle partie, sans modifier le monde à la main pour obtenir le résultat attendu.

## 7. Calibrage et limites

Le seuil du D6 est un **paramètre accepté pour les essais**, pas une mesure du plaisir ou de la difficulté humaine. Toute modification ultérieure requiert une décision d'équilibrage, une nouvelle mesure et l'évaluation de l'impact sur les références acceptées.

Aucune classe, statistique cachée, chance, dégâts numériques, soin automatique sur critique, table d'échec universelle ou mécanique de duel n'est ajoutée par ce contrat. Les risques d'autres familles d'action ne sont pas tous ramenés arbitrairement à ce D6.
