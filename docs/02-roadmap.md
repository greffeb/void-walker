# Void Walker V2 — roadmap proposée

> **Statut :** PROPOSITION DE SÉQUENCEMENT — pas un planning accepté ni une autorisation d'exécution.
> **Mise à jour :** 2026-10-14.

## Règles de lecture

Cette roadmap mène jusqu'à un petit jeu complet publié en PWA. Les dates et charges ne sont pas estimées tant que le périmètre de lancement n'est pas arbitré.

Une étape sort par des **preuves**, pas par une déclaration « implémenté ». Les décisions fonctionnelles proviennent du [cahier des charges](05-cahier-des-charges.md) et du [journal](03-decisions.md).

Le cadrage ci-dessous précède la Phase 0 demandée par le porteur du projet. Il évite qu'un agent de Bootstrap décide lui-même du jeu à construire.

## Préparation — présente conversation

- [x] Examiner la méthode agentique de Lacets.
- [x] Fixer la priorité créative, l'interaction, le rôle général des dés, la durée et l'objectif de publication.
- [x] Arbitrer défaite, temps, espace, personnage et nombre de familles de scénarios.
- [x] Choisir reprise mobile, présentation du risque, contraintes principales et objectif d'évacuation.
- [x] Arbitrer propagation simple, tentatives répétées, absence de duel et principe des menus.
- [x] Accepter C-01/C-05 v0.1 avec réserves ; choisir santé par états, menace persistante unique et station isolée.
- [ ] Préciser les règles des cinq interactions demandées et les variations de la famille de scénarios.
- [x] Décrire et faire accepter en conception la boucle et l'[aventure AR-01 v1.0](08-aventure-reference.md), sans preuve d'exécution revendiquée.
- [x] Extraire les règles acceptées d'AR-01 dans C-03/C-04 (temps, réactions, risque et blessures).
- [x] Spécifier la deuxième référence pour la dépressurisation préparée (D-038) : [AR-02 v1.0](09-aventure-reference-vide.md) acceptée en conception (D-074), règles retranscrites dans C-03/C-04, sans preuve d'exécution revendiquée.
- [x] Spécifier les contrats essentiels et leurs contre-exemples : C-01 à C-10 acceptés (D-117), sans implémentation.
- [ ] Arrêter le périmètre du lancement, les exclusions et critères de qualité — volume fixé (D-118 à D-121), règles d'assemblage et liste des morceaux à faire.
- [x] Arbitrer les pouvoirs des agents, zones de merge et preuves humaines (D-096 à D-108) ; restent la fusion mixte, le passage du moteur en vert et le budget des agents.
- [x] Préparer les instructions de reprise, l'issue Bootstrap, les profils spécialisés et l'instruction de gestion des issues dans la conversation principale : [#89](https://github.com/greffeb/void-walker/issues/89), `.github/agents/`, `.github/instructions/gestion-issues.instructions.md` (D-137/D-138/D-199). Premières issues verticales à venir.

**Sortie :** starter pack cohérent, accepté par le porteur du projet et explicitement marqué prêt pour Bootstrap.

## Phase 0 — socle agentique, nouveau dépôt

Intentions déjà demandées :

- commande unique couvrant lint, typecheck, tests, solveur, parcours de référence et build ;
- même commande exécutée en CI ;
- gestion d'une issue avec GitHub Copilot dans la conversation principale (D-126/D-199), délégation spécialisée contrôlée et revue indépendante ;
- rôles spécialisés, permissions, hooks et gabarits d'issues/PR ;
- garde-fous anti-spaghetti et séparation du moteur et du contenu ;
- journal des parties humaines et statut de référence réservé à la validation téléphone.

**Proposition à arbitrer :** la vérification du solveur et du replay porte d'abord sur un minuscule monde de test réellement exécutable. Un stub qui retourne toujours vrai n'est pas un contrôle. Le Bootstrap ne construit pas en même temps tout le gameplay.

**Sortie proposée :** une issue complète a traversé le workflow, un contrôle volontairement cassé bloque la CI, aucune preuve humaine n'a été fabriquée, les parcours initiaux restent candidats.

## Phase 1 — contrat d'interaction et tranche verticale

- Petite scène écrite à la main, utilisable sur téléphone et dans la CLI.
- Une interaction d'objet complète, avec précondition, coût, effets, texte et relecture.
- Actions composables issues du même catalogue pour l'UI et les outils.
- Invariants et preuves positives/négatives sur l'état du monde.

**Sortie proposée :** le porteur du projet peut expliquer sur téléphone ce qu'il a fait, ce qui a changé et pourquoi. Aucune prétention de rejouabilité complète à ce stade.

## Phase 2 — aventure de référence complète

- Base de conception disponible : AR-01 v1.0 (D-057) ; AR-02, consacrée au vide, acceptée en conception (D-074). Les étapes ci-dessous sont des réalisations futures, pas cochées par l'acceptation du document.
- Début, objectif, obstacles, solutions distinctes et conclusions définis ensemble.
- Règles de hasard, échec, temps et personnage acceptées et raccordées.
- Sauvegarde/reprise et replay vérifiables.
- Parité d'observation entre UI, bots et joueur LLM externe.

**Sortie proposée :** aventure complète de la durée cible, parcours vérifiés automatiquement puis acceptés sur téléphone. La génération n'est pas utilisée pour masquer un problème de gameplay fondamental.

## Phase 3 — génération procédurale contrôlée

- Étendue de variation conforme à la décision de lancement.
- Validation des prérequis et recherche de chemins dans l'espace d'état supporté.
- Assemblages négatifs rejetés ou explicitement diagnostiqués.
- Campagnes stratifiées de bots et lecture humaine de situations variées.

**Plan accepté le 2026-10-14 (D-245) :** #106 en livraisons L0 à L6 ([13 §7](13-morceaux-lancement.md#7-découpage-de-106)) : petites stations d'abord (D-242), objets dans leur morceau (D-244), mesure de la part des stations où la créature peut être mise hors jeu avant le problème final (D-241). Hors #106 : le catalogue des pièces sans obstacle, issue à part à créer avec l'accord du porteur (D-214) ; seulement si la durée des parties le demande (D-242), les grandes stations dans une issue à part (annexes, boucles, vérifieur par morceaux, D-245), puis les objets placés hors de leur morceau (D-244). Piste sans décision, proposée le 2026-10-14 : des salles de butin, c'est-à-dire des annexes facultatives où trouver des objets en plus de ceux que demandent les obstacles ; elles supposent les annexes et pourraient servir de premier réglage de la difficulté.

**Sortie proposée :** diversité utile mesurée, pas seulement diversité de noms ; pas de revendication « toujours gagnable » après toute action du joueur.

## Phase 4 — contenu de lancement et expérience mobile

- Volume et familles de scénarios conformes au périmètre accepté.
- Texte exact, lisible, sans information mécanique inventée.
- Visuels et audio selon périmètre ; provenance et licences documentées.
- Accessibilité, ergonomie des actions composées, installation et reprise sur appareils ciblés.
- Équilibrage après correction des contrats, pas en compensation des bugs.
- Lore léger (D-243) : une conception d'abord (nombre de documents, longueur, place, ce qu'un document peut révéler, effet éventuel de la lecture sur ce que sait le passager), puis des documents écrits par l'assistant principal. Lire reste gratuit (D-014). Lus par « regarder », qui ne coûte rien et montre déjà la description d'un objet, les documents ne touchent pas au moteur ; si la conception retient une action à part ou un effet de la lecture, ce travail touche au moteur et ne se mène pas en même temps qu'une autre issue moteur [détail de l'agent].
- Mesures : bots sur 1 000 stations et parties du porteur ; durée, difficulté, part des stations où la créature peut être mise hors jeu tôt (D-241).

**Sortie proposée :** contenu fini, cohérence et expérience acceptées, critères de lancement satisfaits.

## Phase 5 — publication PWA et clôture

- Déploiement approuvé manuellement ; contrôles et preuves attachés au build livré.
- Installation, hors ligne, mise à jour et sauvegardes vérifiés sur plateformes convenues.
- Documentation de support, collecte des problèmes et procédure de reprise.
- Bilan de lancement et backlog futur séparé des engagements de cette version.

**Sortie :** petit jeu complet publié et accepté, conformément à D-009. Les seuils exacts de clôture restent à spécifier.

## Après lancement — hors définition de fin actuelle

Stores mobiles, IA de narration, contenu supplémentaire, nouvelles mécaniques et métaprogression ne sont pas automatiquement autorisés. Ils devront faire l'objet d'un nouveau cadrage.

Pistes proposées le 2026-10-14, dans cet ordre, sans décision :

1. **Poste de sécurité**, nouveau morceau inspiré de Duskers : portes motorisées commandées à distance, détecteurs de mouvement. À brider, car la créature n'ouvre jamais une porte : fermer à distance serait une arme très puissante.
2. **Objectif en données**, puis exfiltration (évacuer avec un objet à emporter), puis extermination (neutraliser deviendrait une fin, ce qui modifierait D-018).
3. **Menace en données** (sens, gabarit, portes, peurs, vitesse), puis dangers qui se propagent comme le feu (essaim de nanobots, champignon), variantes de la créature (robot, alien qui ouvre les portes), IA corrompue, qui suppose le poste de sécurité.
4. **Enquête**, qui repose sur les documents du lore.
5. **Personnages non joueurs**, puis escorte, coéquipier ou savant fou : le plus coûteux.

Univers, menace et objectif pourraient alors se choisir au tirage (par exemple exfiltration et essaim de nanobots, extermination et champignon, escorte et savant fou), à deux conditions : les textes rangés par couches ([13 §7.2](13-morceaux-lancement.md#72-textes-par-couches)) et des règles propres à chaque menace dans le moteur ; un jeu de textes ne change que les phrases. Piste de méthode, non décidée : chaque nouvelle mécanique passerait par les canaux communs (son, air, feu, gravité, portes), pour que les mélanges restent tenables. Plusieurs pistes touchent des décisions validées (une seule famille de scénarios D-017, évacuation D-018, pas d'échéance globale D-021, une menace principale qui a un emplacement et réagit aux actes du joueur D-029, une station spatiale isolée D-030, une seule créature D-120) : elles demanderont un nouveau cadrage.
