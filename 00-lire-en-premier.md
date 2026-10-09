# Void Walker V2 — point de départ et reprise de conversation

> **Statut :** CADRAGE EN COURS — kit documentaire, pas dépôt applicatif prêt à développer.
> **Mise à jour :** 2026-10-09.
> **Autorisation de lancer le Bootstrap :** NON — décisions de gameplay et contrats encore incomplets.

## Mission de ce dossier

Préparer, avec le porteur du projet, un ensemble autonome de documents Markdown permettant de faire développer le jeu dans d'autres conversations avec Claude Code, Copilot CLI et des agents spécialisés.

Le code sera produit par les agents. Le porteur du projet choisit le produit, arbitre les propositions et accepte les preuves, notamment en jouant sur téléphone. Ce kit doit permettre une reprise sans mémoire de la conversation initiale.

Le présent dossier ne modifie ni le prototype précédent ni le projet Lacets. Il sera transféré comme documentation du nouveau dépôt lorsque son cadrage sera suffisamment stable. Aucun dépôt distant, workflow actif ou permission d'agent n'est créé à ce stade.

## Lire dans cet ordre

1. [01 — Contexte et objectif produit](01-contexte.md).
2. [03 — Journal des décisions](03-decisions.md), en distinguant les statuts.
3. [05 — Cahier des charges](05-cahier-des-charges.md).
4. [06 — Contrats et questions ouvertes](06-contrats.md).
5. [02 — Roadmap et portes de validation](02-roadmap.md).
6. [04 — Workflow agentique](04-workflow-agentique.md) pour préparer ou exécuter une issue.

Les besoins créatifs sont illustrés par les [cinq interactions de référence](07-interactions-reference.md). Leurs intentions sont demandées, leurs modalités techniques restent proposées jusqu'à arbitrage.

L'[aventure fixe AR-01 v1.0](08-aventure-reference.md) est **acceptée comme conception** (D-057). Ses trois témoins P-A/P-B/P-C restent à prouver par le moteur, et aucun n'a été joué sur téléphone. Elle contient des secrets et solutions d'auteur : ne pas la transmettre au playtester aveugle.

Premiers socles contractuels acceptés (D-027) : [actions et observation](contrats/C-01-actions-observation.md), [cohérence du monde et des conséquences](contrats/C-05-monde-consequences.md). Leurs questions explicitement ouvertes ne sont pas des décisions implicites.

Contrats acceptés dans la portée d'AR-01 (D-055 à D-057) : [temps et réactions](contrats/C-03-temps-reactions.md), [risques et blessures](contrats/C-04-risques-blessures.md). Les règles du vide ne sont pas déduites de celles-ci.

La validation humaine sera conservée dans le [journal des parties humaines](journal-parties-humaines.md). Il est actuellement vide : aucune partie V2 n'a eu lieu.

## Autorité documentaire

- Une décision **Validée** dans le journal fait autorité. Une proposition de l'assistant n'est pas une décision utilisateur.
- Le cahier des charges décrit les besoins et le périmètre acceptés ; les contrats décrivent leur signification vérifiable.
- La roadmap organise le travail : elle n'autorise pas à inventer un besoin manquant.
- En cas de contradiction entre une décision et sa projection dans un document, signaler l'écart avant de coder. Ne pas sélectionner silencieusement l'interprétation la plus commode.
- Une modification de comportement doit référencer la décision qui l'autorise. Une ancienne décision est remplacée explicitement, pas supprimée.
- Un statut « vérifié automatiquement » n'est pas une acceptation humaine sur téléphone.

## Ce qui est déjà choisi

- Créativité dans la résolution des situations comme priorité de gameplay.
- Actions contextuelles composables, sans texte libre pour commander le personnage.
- Dés seulement face à un risque réel.
- Partie complète visée : 15 à 30 minutes.
- Petit jeu complet et rejouable publié en PWA ; stores possibles ensuite.
- Une famille de scénarios avec plusieurs situations générées au lancement.
- Objectif commun : s'échapper d'une station spatiale isolée, cadre de lancement retenu.
- Un personnage fixe pour la première version ; pas de création de personnage à importer de la V1.
- Pièces avec positions relatives simples, sans grille tactique ni distances au mètre.
- Lire et consulter les menus/objets est gratuit ; seules les actions engageantes peuvent faire avancer le monde.
- Après une défaite, nouvelle partie : pas de retour annulant la mauvaise décision.
- Une autosave par action engagée pour reprendre une partie active, sans rejouer le hasard.
- Santé, consommables et menace réactive ; pas d'échéance globale, de faim/fatigue ni d'O₂ permanent.
- Niveau de risque qualitatif et conséquences prévisibles présentés avant la tentative.
- Propagation simple des dangers par les passages ouverts, selon des règles bornées.
- Pas de duel classique : protection, diversion, fuite et préparations environnementales.
- Nouvelle tentative autorisée si elle reste possible, en payant de nouveau coûts et risques.
- Menus de manipulations plausibles, sans révéler les effets secrets.
- Santé par quelques états de blessure, pas une jauge détaillée de PV.
- Une menace principale persistante, avec emplacement et réactions aux actes du joueur.
- Thème d'horreur spatiale, texte majoritaire, interface mobile-first et carte.
- Pas de LLM requis dans le jeu ; le rôle éventuel d'un LLM est celui d'un joueur de test externe.
- Développement agentique dans un nouveau dépôt, méthode issue → vérification → revue → preuves.
- Parcours de référence accepté seulement après une partie du porteur du projet sur téléphone.

Ces choix sont détaillés et sourcés par leur origine utilisateur dans le journal des décisions.

## Reprise immédiate

**Étape terminée :** conception d'AR-01 acceptée, Q-24 à Q-50 répondues, décisions jusqu'à D-057. Six pièces, trois témoins sur papier (13/18/15 engagements), règles temporelles et de risque extraites vers C-03/C-04. Pas de code, de solveur ni de partie humaine exécutée.

**Prochaine tâche recommandée :** concevoir la deuxième référence du vide (AR-02, D-038) pour borner protection, propagation et effets sur les entités ; elle peut être plus courte et ne doit pas devenir une deuxième famille narrative de lancement. Le document correspondant n'est pas encore créé. Puis compléter C-02/C-06/C-08/C-09/C-10, l'architecture, le contenu de lancement et les issues de Bootstrap.

**À ne pas refaire :** l'entretien Q-01 à Q-50 sans besoin de changer un choix. Les identités éditoriales et textes de finition peuvent rester ouverts, mais aucune règle physique, sauvegarde ou permission manquante ne doit être inventée par un agent d'implémentation.

**Ne pas faire :** bootstrap applicatif, correction de la V1, ajout de mécanismes non arbitrés, génération en masse d'issues d'implémentation, promotion d'une proposition au statut validé.

Après chaque bloc de réponses : consigner les décisions explicites, mettre à jour le cahier des charges et les questions, puis demander le prochain bloc utile. Une réponse « à décider » reste ouverte.

## Définition d'un starter pack prêt à transmettre

Le kit sera prêt quand :

- le lancement PWA aura un périmètre concret et une définition de fin ;
- chaque contrat essentiel aura exemples, erreurs et invariants acceptés ;
- une aventure de référence aura des situations et issues attendues, sans prétendre avoir déjà été jouée ;
- la roadmap aura des dépendances et critères de sortie, sans dates inventées ;
- les rôles, permissions, zones de merge et conditions d'arrêt auront été arbitrés ;
- l'issue Bootstrap et les premières issues verticales seront exécutables sans nouvelles décisions produit cachées ;
- les modèles de preuves, de revue, de playtest et de reprise seront fournis ;
- les inconnues restantes seront explicitement non bloquantes et rattachées à une étape future.

La création de nombreux documents vides ne satisfait pas cette définition. Les documents détaillés seront ajoutés à mesure des décisions.

## Entretien documentaire

Un avertissement Markdown de lignes vides en fin du journal des décisions est connu. Après trois corrections infructueuses, le porteur du projet a explicitement choisi de le laisser provisoirement pour poursuivre le cadrage. Les décisions et liens sont lisibles ; ce nettoyage ne doit pas être confondu avec un blocage produit.
