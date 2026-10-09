# C-05 — Monde, effets persistants et conséquences cohérentes

> **Statut :** SOCLE CONTRACTUEL VALIDÉ v0.1 — D-027 ; questions explicitement ouvertes conservées.
> **Date :** 2026-10-09.
> **Choix acquis :** D-013 à D-026 selon leur portée dans le [journal](../03-decisions.md).

## 1. But

Un changement existe dans le monde avant d'être raconté. Aucun chemin particulier — scénario, manipulation générique, réaction de menace ou danger — ne maintient une seconde vérité sur le même objet.

## 2. Identité et propriétés

- Une instance possède une identité stable, indépendante du nom affiché et du modèle de contenu.
- Deux exemplaires d'un même modèle peuvent exister ; les collisions ne se corrigent pas en supprimant silencieusement un exemplaire.
- Transporter, déposer ou recharger un objet conserve sa définition, ses propriétés et son identité.
- Capacités relativement stables et états mutables sont distincts : « support utilisable » n'est pas « déjà placé sous la grille ».
- Un objet déplacé ne possède qu'un emplacement/containment cohérent à la fois. Les relations spatiales restent simples, conformément à D-015.

Ces obligations ne prescrivent pas un moteur ECS ou une bibliothèque particulière.

## 3. Effets appliqués, pas récit d'intention

Chaque règle de résolution produit des changements explicites : déplacement, consommation, état de passage, exposition, découverte ou état d'entité. Un même mécanisme les applique et vérifie leurs invariants.

La narration centrale décrit uniquement ce résultat appliqué. Les variations de style n'ajoutent ni objet, ni ouverture, ni soin, ni neutralisation. Une action sans effet direct l'annonce ; une erreur de validation n'est pas un « succès créatif » de secours.

Un échec peut avoir des effets réels, conformément à la règle concernée ; il n'implique pas automatiquement une perte de santé universelle. Un critique n'implique pas automatiquement un soin ou un butin.

## 4. Transferts et chaînes bornées

Un transfert valide l'origine et la destination avant toute suppression. Si la destination refuse l'objet, le monde conserve l'objet à l'origine et fournit une raison publique.

Un effet indirect lit les changements précédents : caisse déplacée → grille atteignable ; brèche ouverte → pression modifiée → exposition ; feu éteint → obstacle de feu supprimé.

Une chaîne ne peut pas s'arrêter silencieusement en laissant un demi-état. La validation rejette les cycles non supportés ou le moteur produit un diagnostic contrôlé. La taille et les règles de propagation sont bornées ; le seuil exact est à définir avec des cas, pas choisi pour rendre arbitrairement des tests verts.

## 5. Dangers et menace

Le feu et la pression consultent les mêmes passages et séparations que la navigation. Leur propagation simple prend en compte les passages ouverts (D-023) et les capacités de protection explicites.

Une huile au sol concerne les entités qui traversent la position ; une exposition ne touche pas une entité distante simplement parce qu'elle est « l'ennemi du scénario ».

L'état de la menace — emplacement, exposition, état de fonctionnement — est canonique. Une neutralisation persistante ne se réinitialise pas parce que le joueur change de pièce ou recharge. Aucun module de duel indépendant n'est ajouté (D-025).

Pour AR-01, le rythme du feu, le timing de l'exposition et l'ordre action/danger/réaction sont désormais fixés par [C-03](C-03-temps-reactions.md) et [C-04](C-04-risques-blessures.md), selon D-055 à D-057. Les dangers hors de cette portée, notamment le vide, restent ouverts et ne doivent pas être implémentés par extrapolation silencieuse.

## 6. Connaissance et objectif

Un passage découvert reste connu, même si une porte est refermée. Sa connaissance ne suffit pas à le rendre physiquement franchissable.

Neutraliser la menace n'est pas une victoire automatique : la famille choisie demande une évacuation (D-018). Le moteur doit distinguer changement du monde et satisfaction des conditions de fin. Les conditions fixes d'AR-01 sont acceptées dans l'[aventure de référence](../08-aventure-reference.md), section 14 ; leur généralisation aux scénarios générés reste à spécifier dans C-08.

Une défaite conclut la partie, sans chargement d'un ancien état pour l'annuler (D-013). La perte irréversible de toutes les voies d'évacuation exige une règle de conclusion explicite encore à choisir, plutôt qu'une partie silencieusement bloquée.

## 7. Engagement, sauvegarde et observation

L'objectif de D-022 est une action enregistrée une seule fois et une reprise cohérente. Proposition technique : préparer le nouvel état et le résultat, les persister comme une unité cohérente, puis présenter l'action comme engagée. Empêcher un second engagement concurrent sur une version périmée.

Si le stockage échoue, ne pas annoncer « sauvegardé ». Conserver l'identité et le résultat de l'action pour une éventuelle reprise d'écriture ; réessayer une écriture n'est pas refaire le jet.

Les garanties exactes face à un crash au milieu de l'écriture relèvent de C-09 et doivent tenir compte des capacités réelles du navigateur. Aucun fichier Markdown ne garantit à lui seul une persistance atomique.

## 8. Exemples d'acceptation contractuels

| ID | Cas | Attendu |
| --- | --- | --- |
| E-01 | Déplacer une caisse puis reprendre la sauvegarde | Même instance au nouvel emplacement, appui recalculé correctement |
| E-02 | Ramasser avec destination pleine | Objet non perdu, résultat refusé sans faux succès |
| E-03 | Ouvrir un panneau contenant un passage caché | Découverte et options cohérentes ; réouverture sans doublon |
| E-04 | Créer une brèche dans une séparation extérieure | État de pression et exposition des seules entités concernées |
| E-05 | Même brèche avec protection différente | Conséquences différentes expliquées par la règle, pas par un texte improvisé |
| E-06 | Éteindre un feu compatible | Danger retiré, moyen consommé selon règle ; dommages antérieurs conservés |
| E-07 | Neutraliser une menace et quitter/revenir | Elle reste dans l'état résultant, sans réinitialisation implicite |
| E-08 | Rejouer une session sur la même version avec les mêmes tirages | Mêmes changements et même conclusion ; aucune approximation du RNG |
| E-09 | Une écriture de sauvegarde échoue | Erreur honnête ; ni duplication d'action ni nouveau jet lors d'une reprise d'écriture |
| E-10 | Un template textuel est remplacé | Aucun effet mécanique créé, retiré ou modifié |

## 9. Validation

Acceptation humaine du socle : **2026-10-09, Q-20, D-027**. C-03/C-04 précisent désormais la portée AR-01 par D-055 à D-057 ; les autres réserves, notamment C-08/C-09, restent ouvertes. Implémentation et tests : **absents**. L'acceptation de ces obligations ne prétend pas qu'elles sont déjà vérifiées dans la V2.
