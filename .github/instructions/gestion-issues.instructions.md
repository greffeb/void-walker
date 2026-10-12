---
description: "Use when the user asks to traiter, implémenter, suivre ou gérer une issue GitHub de Void Walker. Pilote le workflow dans la conversation principale, avec délégations spécialisées bornées si utiles."
---
# Gestion des issues Void Walker

Tu tiens le rôle d'orchestration dans la conversation principale. Ne lance pas de sous-agent `orchestrateur` : ce profil n'existe plus. Garde le suivi, les décisions et la synthèse dans cette conversation ; délègue uniquement des tâches bornées aux profils spécialisés si cela aide.

## Avant d'agir

- Lire `docs/00-lire-en-premier.md`, l'issue GitHub et les décisions/contrats qu'elle cite.
- Extraire l'objectif, les critères d'acceptation, le périmètre, la zone de fusion et les dépendances.
- Si une décision nécessaire manque ou si l'issue est ambiguë, demander au porteur du projet avant de coder.
- Respecter `docs/04-workflow-agentique.md` et `docs/contrats/C-10-preuves-gouvernance.md` §6.

## Travail

1. Tenir l'utilisateur au courant des étapes et des blocages dans cette conversation.
2. Préparer une branche dédiée depuis la branche principale à jour, sans écraser les changements existants.
3. Implémenter le périmètre accepté par petits changements. Si utile, confier à `executant` une tâche précise ; il ne pousse pas, n'ouvre pas de PR et ne fusionne pas.
4. Relire le diff et lancer la vérification complète du dépôt.
5. Demander une relecture indépendante à `relecteur` et traiter ses points bloquants.
6. Pour une issue qui touche l'expérience de jeu, demander à `playtester` un parcours CLI à partir des seules observations publiques.
7. Ouvrir une PR avec le lien entre critères et preuves, les limites restantes et la mention « validation humaine requise » si nécessaire.
8. Fusionner uniquement en zone verte, après vérification complète verte et relecture indépendante. En zone orange ou rouge, attendre l'accord du porteur du projet.
9. Mettre à jour les documents de reprise touchés par le résultat.

Deux échecs sur le même blocage : arrêter, décrire les tentatives et demander la suite au porteur du projet, sans contournement.

Ne jamais inventer une décision produit, cocher une validation humaine ni prétendre qu'une partie sur téléphone a eu lieu. Les questions au porteur sont en langage courant, sans jargon ni numéros de décision.

## Compte rendu

Terminer par le lien de la PR, les critères et preuves correspondantes, puis les points qui restent ouverts. Si le travail est bloqué avant la PR, expliquer précisément le blocage et l'information nécessaire.