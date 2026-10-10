# Void Walker V2 — workflow agentique en préparation

> **Statut :** BROUILLON DE CONTRAT DE TRAVAIL — principes demandés séparés des renforcements proposés.
> **Mise à jour :** 2026-10-10.

## 1. Ce qui est repris de Lacets

Lecture de la configuration et de la méthode locales le 09/10/2026, sans les modifier ni exécuter ses workflows distants.

- L'humain définit le quoi, les agents réalisent le comment et produisent les preuves.
- Une issue bornée, une branche/session de travail et des critères d'acceptation explicites.
- Une commande de vérification commune au local et à la CI.
- Délégation dans un worktree isolé : l'exécutant ne pousse pas, n'ouvre pas de PR et ne merge pas ; l'orchestrateur vérifie et livre.
- Le compte rendu du délégué n'est pas une preuve suffisante : relecture du diff et vérifications indépendantes.
- Une revue contre l'issue et la Definition of Done.
- Deux échecs sur le même blocage conduisent à un arrêt documenté plutôt qu'à un contournement. Transposition exacte à confirmer pour la V2.
- Mise à jour des références générées au statut candidat ; validation physique réservée à l'humain. Pour le jeu : partie sur téléphone.

## 2. Ce qui ne doit pas être copié aveuglément

- Les commandes, identifiants de modèles, versions et options des CLI sont à vérifier dans l'environnement qui exécutera le Bootstrap.
- Les permissions larges de shell et de Node ne constituent pas une isolation de fichiers. Un interdit de lecture dans un prompt ne prive pas réellement un processus de l'accès au disque.
- Le hook de fin de Lacets évite une boucle infinie en laissant s'arrêter après un premier blocage : ce n'est pas une garantie autonome de CI verte.
- Les zones sont décrites dans la méthode ; la présence d'un vrai mécanisme de merge automatique doit être vérifiée séparément, pas supposée.
- La copie examinée contient une décision de ne pas protéger la branche principale. Cela n'est pas importé comme décision de la V2.
- Les PR documentaires peuvent être exclues de CI dans Lacets. Les contrats, permissions et attestations V2 nécessitent au contraire des contrôles adaptés lorsqu'ils changent.
- Les règles anti-spaghetti supplémentaires demandées pour le jeu ne sont pas fournies par la seule configuration ESLint de Lacets.

## 3. Rôles demandés

Les noms suivants sont demandés pour le futur socle, mais aucun agent n'est installé par le kit présent.

| Rôle | Responsabilité proposée | Limite essentielle |
| --- | --- | --- |
| Orchestrateur Copilot | Lire l'issue, préparer la session, déléguer si demandé, vérifier, présenter la PR, fusionner le vert après relecture (D-105, D-126) | Ne décide pas seul d'un changement produit |
| Exécutant Copilot | Implémenter le périmètre accepté, tests et preuves (D-126) | Ni push, ni PR, ni merge en mode délégué |
| `reviewer` | Contrôler diff, contrats et preuves ; chercher des contre-exemples | Pas de correction de production dans la même fonction |
| `spec-writer` | Transformer les choix acceptés en exigences vérifiables | Ne remplace pas une question ouverte par sa préférence |
| `planner` | Découper une décision en issues verticales limitées | Ne crée pas de besoin supplémentaire |
| Auteur de contenu | Écrire morceaux de stations, textes et messages de l'assistance (D-108) | Ne crée ni règle ni qualité non acceptée |
| Auteur d'outils | Écrire vérificateur, bots, export et scripts de CI (D-108) | Ne modifie pas le moteur ni le contenu sous couvert d'outillage |
| `game-designer` | Proposer situations, règles et équilibrage | Les nouvelles règles sont à arbitrer |
| `ui-ux-expert` | Concevoir et vérifier l'expérience mobile | Ne change pas les effets métier pour simplifier l'écran |
| `asset-generator` | Produire des assets conformes à la direction choisie | Licence, provenance, budget et outils à préciser |
| `playtester` | Jouer par la CLI à partir de l'observation publique | Aucun accès aux données cachées du scénario ni au solveur |

Tous les rôles sont tenus par GitHub Copilot, dans l'éditeur ou le terminal du PC du porteur du projet (D-126/D-128). Le relecteur est une autre session, sans le contexte de celle qui a codé.

Une issue ne convoque que les rôles utiles. Multiplier les agents ne remplace ni un contrat ni une preuve indépendante.

## 4. Boucle de travail cible

1. Cadrer l'issue : objectif observable, décisions autorisantes, périmètre, critères, zone et dépendances.
2. Faire accepter l'issue avant lancement ; ne pas poursuivre si une décision indispensable manque.
3. Préparer une branche et un environnement isolés ; ne pas écraser un travail existant.
4. Écrire le plan, puis implémenter par petits changements dans le périmètre.
5. Exécuter la vérification complète, joindre résultats et contre-exemples traités.
6. Faire relire indépendamment ; les écarts bloquants ne deviennent pas des exceptions implicites.
7. Présenter une PR avec critères ↔ preuves (captures, extraits de texte), version et limites des tests ; indiquer « validation humaine requise » si besoin (D-129). La PR est publiée à une adresse de test (D-131).
8. Fusionner selon la zone (C-10 §6) ; les agents d'implémentation ne s'accordent pas eux-mêmes un droit de merge.
9. Le porteur du projet joue la version de test sur téléphone ; ses retours, le fichier de partie et sa validation signée arrivent en commentaire de la PR (D-130, D-132).
10. Mettre à jour décisions, roadmap, journal et prochain point de reprise.

## 5. Zones : demande initiale et arbitrage restant

La demande utilisateur est :

- verte : tests, outils, solveur et documentation, merge automatique ;
- orange : textes, interface, équilibrage et format des scénarios, merge humain sur preuves ;
- rouge : déploiement, format de sauvegarde et IA, merge et test manuels.

**Arbitrage du 2026-10-10 (D-104 à D-107) :** la proposition D-012 n'est pas retenue ; tests, outils, solveur et documentation restent verts, y compris quand ils changent un test, un seuil ou un contrat. L'orchestrateur fusionne le vert après relecture par un autre agent. Le moteur de jeu est orange tant qu'il est jeune. Les textes du jeu passent en vert (D-116). Pas de protection technique de la branche principale. Exception à la zone rouge : les agents déploient eux-mêmes le service de rapports (D-127). Détail dans [C-10 §6](contrats/C-10-preuves-gouvernance.md).

Restent à décider : zone d'une demande de fusion mixte, passage du moteur en vert, budget et reprises des agents.

## 6. Definition of Done, principes acquis

- Résultat conforme à l'issue acceptée, pas simplement « code présent ».
- Commande complète verte, locale et CI.
- Chaque critère dispose d'une preuve correspondant au bon build.
- Effets métier testés depuis la commande publique et reflétés par l'observation.
- Aucun reste-à-faire masqué : blocages et hors-périmètre sont tracés.
- Aucun agent ne prétend avoir exécuté une étape qu'il n'a pas pu exécuter.
- Validation téléphone uniquement à partir d'un retour humain réel.

## 7. Livrables de configuration à préparer après arbitrage

Instruction d'entrée courte, commande d'issue, profils d'agents, permissions/hooks, gabarits d'issue/PR, règles de CI et journal des parties. Le kit fournira leur contenu ou leur spécification sans prétendre qu'un document Markdown suffit à activer une protection technique.

Les opérations distantes, accès aux secrets, publication et installation de nouveaux services ne sont pas autorisés par la seule préparation de ces documents.
