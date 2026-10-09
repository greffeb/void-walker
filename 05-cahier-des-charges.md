# Void Walker V2 — cahier des charges produit

> **Statut :** VERSION DE TRAVAIL 0.6 — cadrage et AR-01 acceptés en conception ; quatre contrats bornés, starter pack global encore incomplet.
> **Mise à jour :** 2026-10-09.

## 1. Promesse produit

Dans une aventure courte d'horreur spatiale, le joueur observe une situation, manipule des objets et l'environnement avec des actions contextuelles, choisit sa manière de progresser et constate les conséquences de ses décisions. Pour le lancement, son objectif est de s'échapper d'une station spatiale isolée.

**Priorité validée : créativité de résolution.** L'objectif n'est ni une simulation universelle ni un champ texte acceptant des intentions que le moteur ne sait pas appliquer.

## 2. Exigences fondatrices validées

| ID | Exigence | Décision | Preuve à définir ou produire |
| --- | --- | --- | --- |
| B-001 | Jeu solo narratif d'horreur spatiale | D-003 | Aventure de référence et direction narrative |
| B-002 | Mobile-first, texte majoritaire, carte | D-003 | Parcours sur téléphone et revue UI |
| B-003 | Actions contextuelles composables, pas de commandes libres parsées | D-006 | Interaction UI/CLI utilisant une commande structurée identique |
| B-004 | Créativité et solutions concrètes comme priorité | D-005 | Situations de référence à approches réellement distinctes, nombre à décider |
| B-005 | Dés seulement face à un risque réel | D-007 | Catalogue des risques et cas déterministes, à préciser |
| B-006 | Partie complète visée de 15 à 30 minutes | D-008 | Mesure sur parties humaines ; protocole à définir |
| B-007 | Jeu complet, fini et rejouable publié en PWA | D-009 | Critères de lancement à préciser |
| B-008 | Pas de LLM dans la boucle de jeu de cette version | D-004 | Test de dépendances et fonctionnement sans service IA |
| B-009 | Référence acceptée après partie humaine sur téléphone | D-010 | Attestation liée à une version et au journal humain |
| B-010 | Défaite définitive, nouvelle partie plutôt que retour arrière | D-013 | Cycle de fin/reprise à spécifier |
| B-011 | Lecture, menus et consultation gratuits ; actions engageantes seules susceptibles de coûter du temps | D-014 | Classification des actions et test de pause |
| B-012 | Pièces et positions relatives, sans grille tactique | D-015 | Exemples de déplacement, dissimulation et obstruction |
| B-013 | Un personnage fixe, sans création de classe/statistiques | D-016 | État initial et capacités de référence |
| B-014 | Une famille de scénarios avec variations générées au lancement | D-017 | Variations observables et validation des assemblages |
| B-015 | Objectif commun d'évacuation | D-018 | Conditions d'évacuation et conclusions à spécifier |
| B-016 | Les cinq interactions créatives fournies par l'utilisateur sont dans la cible | D-019 | Cas positifs/négatifs dans les interactions de référence |
| B-017 | Risque qualitatif, coûts et conséquences prévisibles présentés au joueur | D-020 | Tests d'observation sans fuite de secrets |
| B-018 | Santé, consommables et menace réactive, sans pression globale de temps/O₂/faim/fatigue | D-021 | Catalogue des ressources et modèle de menace à préciser |
| B-019 | Autosave par action engagée ; reprise active sans nouveau tirage ni ancien tour | D-022 | Tests de fermeture/reprise et d'erreur de stockage |
| B-020 | Propagation simple de dangers selon les passages ouverts | D-023 | Cas de pièces reliées, isolées et effets bornés |
| B-021 | Réessayer reste possible contre de nouveaux coûts/risques, si les préconditions tiennent | D-024 | Tests d'essais successifs et consommables épuisés |
| B-022 | Protection, diversion et fuite, sans boucle de duel classique | D-025 | Scène de menace avec alternatives environnementales |
| B-023 | Manipulations plausibles affichées, sans dévoiler leurs résultats secrets | D-026 | Tests de découverte et d'indisponibilité publique |
| B-024 | Respect des socles contractuels C-01/C-05 v0.1 dans leur portée acceptée | D-027 | Cas d'acceptation des contrats, implémentation non encore réalisée |
| B-025 | Santé par un petit nombre d'états de blessure | D-028 | Transitions et effets à contractualiser |
| B-026 | Une menace principale persistante par partie | D-029 | Perception, emplacement, réaction et persistance à contractualiser |
| B-027 | Station spatiale isolée comme cadre unique de lancement | D-030 | Aventure de référence et variations cohérentes |

### Exigences de la première référence, portée distincte du lancement entier

| ID | Exigence AR-01 | Décision | Preuve future |
| --- | --- | --- | --- |
| B-028 | Passager réveillé, créature organique sonore, assistance de station scriptée | D-031/D-032/D-034/D-037/D-046 | Observations, causalité et dialogues sans accès aux secrets |
| B-029 | Six pièces, circuit bruyant ou bloc transporté, gabarit contraint | D-033/D-035/D-036/D-043/D-044 | Parcours complets et tests négatifs de déplacement |
| B-030 | Un pas par engagement, premier contact annoncé, traque réactive | D-039/D-040/D-048/D-056 | Cas contractuels C-03 et replay |
| B-031 | Santé en trois états actifs, soin d'un état, plafond d'aggravation | D-041/D-053 | Cas contractuels C-04 |
| B-032 | Préparation pouvant supprimer le dé, fuite exposée en succès partiel au D6 | D-042/D-050/D-052/D-055 | Témoins sûrs et branches du jet exposé |
| B-033 | Huile, eau et soin finis, pas de slots/poids ; avertisseur réutilisable | D-045/D-049/D-051 | Conservation, compteurs et découverte |
| B-034 | Évacuation physique : entrer, fermer et lancer | D-054 | Préconditions de conclusion et aucun succès à la simple arrivée |
| B-035 | AR-01 v1.0 comme attentes de conception, non comme partie validée | D-057 | Exécution des trois témoins, puis validation humaine indépendante |

Les preuves « à définir » ne sont ni réalisées ni suffisantes pour lancer toutes les issues. Elles identifient ce qui manque au cadrage.

## 3. Boucle de jeu proposée à détailler

1. Lire l'état perceptible de la pièce et l'objectif connu.
2. Choisir un élément de la scène, de l'inventaire ou un interlocuteur.
3. Choisir une action et ses paramètres éventuels.
4. Confirmer la tentative si elle engage une ressource ou présente un risque, selon règles à décider.
5. Résoudre l'action et ses conséquences persistantes.
6. Afficher le résultat vrai, puis les changements pertinents de la scène.
7. Continuer jusqu'à une conclusion de partie.

La présentation exacte n'est pas acceptée par ce texte : elle sera illustrée par des exemples et une maquette.

## 4. Liberté promise et limites

**Acquis :** le joueur compose des actions, il ne rédige plus leur intention en langage libre.

**Acquis également :** les menus présentent des manipulations plausibles et les blocages connus, sans dévoiler les résultats secrets (D-026). Une option visible n'est pas une promesse de réussite ni un indice automatique de solution.

**À spécifier :** quels objets se combinent, quelles manipulations sont génériques, ce qui exige une règle particulière et les connaissances nécessaires pour voir les options. Le [contrat d'action et d'observation](contrats/C-01-actions-observation.md) fixe le socle accepté (D-027), sans remplir ses réserves par défaut.

Une liste exhaustive visible peut révéler une solution. Une liste trop courte peut donner une fausse impression de liberté. Le contrat de présentation devra distinguer capacités du personnage, connaissances du joueur et secrets du scénario.

Les [interactions de référence](07-interactions-reference.md) expriment cinq besoins concrets : dépressurisation, glissade, accès en hauteur, passage secret et extinction. Elles servent à décider quelles propriétés ont un effet réel, sans établir un catalogue universel par avance.

Répartition D-038 : la dépressurisation sera éprouvée par une deuxième aventure de référence. AR-01 se concentre sur les quatre autres besoins ; ce report de tranche n'est pas une exclusion du lancement.

## 5. Rejouabilité

Une seule famille de scénarios est retenue au lancement (D-017), avec objectif commun d'évacuation (D-018) et situations variables. Les dimensions exactes de variation restent à choisir. Les trois squelettes de la V1 ne deviennent pas des exigences de migration.

Le besoin « chaque partie est différente » doit être traduit en variations observables, pas en promesse mathématique de ne jamais rejouer une combinaison.

La possibilité de perdre est acceptée (D-013). La résolubilité initiale et la réaction à la destruction d'une ressource essentielle restent à spécifier sans rendre automatiquement toute décision récupérable.

## 6. Personnage, risque, espace, temps et échec

Personnage fixe (D-016), pièces avec positions relatives (D-015), actions engageantes seules susceptibles de faire avancer le monde (D-014), défaite définitive (D-013).

Santé, consommables et menace réactive constituent les contraintes choisies (D-021). Aucune échéance globale ni jauge permanente d'O₂, de faim ou de fatigue. Un danger local, comme une pièce dépressurisée, reste dans le périmètre.

Le joueur voit un risque qualitatif et les conséquences prévisibles avant une tentative (D-020). Une nouvelle tentative paie de nouveaux coûts et risques si elle reste possible (D-024). Pas de duel classique : se protéger, détourner, préparer l'environnement ou fuir (D-025).

La propagation des dangers dépend des passages et de leurs capacités (D-023). Pour AR-01, [C-03](contrats/C-03-temps-reactions.md) fixe l'ordre du tour et le feu après deux engagements de connexion laissée ouverte. Les règles du vide restent ouvertes pour AR-02. Le [contrat de cohérence du monde](contrats/C-05-monde-consequences.md) conserve ses invariants transversaux.

Pour AR-01, [C-04](contrats/C-04-risques-blessures.md) fixe indemne/blessé/critique/défaite, soin consommable, aggravation plafonnée et premier réglage de la fuite exposée. La menace persistante est décrite par C-03 et les positions d'AR-01. Aucun de ces paramètres ne doit être généralisé silencieusement à un autre danger ou une autre entité.

Aucun système détaillé de caractéristiques, combat, horloges ou ressources n'est autorisé implicitement. Pas de grille tactique ni de checkpoint annulant une défaite.

## 7. Interface, narration et assets

- Texte et carte requis ; forme spatiale de la carte à préciser.
- Actions contextuelles sélectionnables sur téléphone requises.
- Illustrations d'objets éventuelles, pas encore un volume obligatoire.
- Langues, ton précis, direction visuelle, audio et critères d'accessibilité à arbitrer.
- Une chaîne traduite ne devient pas une commande métier reparsée.

## 8. Sauvegarde, exploitation et publication

La défaite ne peut être annulée par chargement. Une autosave après chaque action engagée permet la reprise exacte d'une partie active (D-022). La compatibilité des sauvegardes, le comportement en cas d'erreur ou d'interruption d'écriture, l'installation hors ligne, les plateformes ciblées, l'hébergement, le budget et les accès publics/privés restent à préciser.

La sortie sur les stores n'est pas requise pour clôturer la première publication PWA. Le projet ne doit néanmoins pas introduire sans raison un choix technique qui rendrait ce futur impossible.

## 9. Exclusions validées et fonctionnalités non décidées

**Exclus pour la version actuelle :** parser de commandes libres, dépendance à un LLM de GM, obligation de publication en stores avant clôture PWA, grille tactique, création de classes, duel classique par attaques répétées, retour arrière annulant une défaite, échéance globale et jauges permanentes de faim/fatigue/O₂.

**Non décidés, donc pas automatiquement autorisés :** comptes, monétisation, analytics, serveur de jeu, campagnes longues, métaprogression, multi-personnages, fabrication libre, durabilité, mode multijoueur.

## 10. Prochaine révision

L'[aventure AR-01 v1.0](08-aventure-reference.md) est acceptée comme référence de conception, avec trois témoins à prouver et ses contrats C-03/C-04 (D-055 à D-057). Les textes de finition, la durée, l'intérêt et la découvrabilité ne sont pas encore validés ; aucun parcours n'a été exécuté.

Prochaine étape proposée : concevoir AR-02 pour la dépressurisation préparée, puis borner les entités, connaissances, conditions de génération/fins, sauvegarde/replay et preuves. Compléter ensuite architecture, périmètre de contenu et issues de lancement. Ne pas construire le moteur sur des inconnues remplacées silencieusement par des valeurs inventées.
