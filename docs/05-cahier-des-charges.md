# Void Walker V2 — cahier des charges produit

> **Statut :** VERSION DE TRAVAIL 0.8 — AR-01 et AR-02 acceptées en conception ; quatre contrats bornés, starter pack global encore incomplet.
> **Mise à jour :** 2026-10-14.

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

### Exigences de la deuxième référence, consacrée au vide

| ID | Exigence AR-02 | Décision | Preuve future |
| --- | --- | --- | --- |
| B-036 | Courte aventure complète : quatre pièces, même passager, même créature ; seul le vide est nouveau | D-058/D-063 | Parcours complets d'AR-02 |
| B-037 | Vide mortel sans combinaison, annoncé avant l'action ; combinaison enfilée en une action | D-059/D-060 | Aperçu « mortel », cas de défaite et témoins protégés |
| B-038 | Sans air = relié à une brèche ouverte par un passage ouvert ou non étanche ; effet immédiat dans les deux sens ; capsule fermée de nouveau pressurisée | D-061/D-065/D-067 | Portes ouvertes ou fermées, capsule, reprise |
| B-039 | Créature exposée neutralisée pour de bon, expulsée ou inerte, sans victoire automatique | D-062 | Persistance après retour de l'air et après reprise |
| B-040 | Découpeuse à réussite sûre ; une rustine facultative près de la baie ; repercer possible | D-064/D-066/D-068/D-069 | Consommation, réparation et nouvelle brèche |
| B-041 | AR-02 v1.0 acceptée comme conception : trois parcours, passage en force conservé, combinaison retirable et remise | D-070 à D-074 | Exécution des témoins, puis partie sur téléphone |

### Exigences de monde et de connaissance, valables pour tout le lancement

| ID | Exigence | Décision | Preuve future |
| --- | --- | --- | --- |
| B-042 | Carte construite au fil de l'exploration ; hors de vue, dernier état vu | D-075/D-076 | Cas K-01/K-02 de C-06 |
| B-043 | Bruits vagues de la créature qui bouge dans la pièce voisine, par une porte ouverte | D-077 | Cas K-03/K-04 de C-06 |
| B-044 | Règles fondées sur les qualités déclarées des objets, jamais sur leur nom | D-078 | Cas W-01 de C-02 |
| B-045 | Port sans limite, sauf un seul objet encombrant à la fois | D-079 | Cas W-02 de C-02 |
| B-046 | Petites règles de monde et de carte de C-02/C-06 (dépôt, objet encombrant, grille, nom des portes, voyants, dernière position vue) | D-080 | Cas d'acceptation de C-02/C-06 |
| B-047 | Assistance limitée à ses messages prévus, relisibles, sans réponse d'état | D-081 | Cas K-06 de C-06 |

### Exigences de stations, sauvegarde et rapports

| ID | Exigence | Décision | Preuve future |
| --- | --- | --- | --- |
| B-048 | Stations assemblées à partir de morceaux écrits à la main, vérifiées avant de jouer : toujours un chemin sûr | D-083/D-084 | Cas G-01/G-02 de C-08 |
| B-049 | Plus aucune sortie : signal exact, partie continuée, abandon possible | D-085 | Cas G-03/G-04 de C-08 |
| B-050 | Fin racontée sans score ; même station rejouable avec de nouveaux dés | D-086 à D-088 | Cas G-05 de C-08 |
| B-051 | Une seule partie en cours ; mise à jour compatible ou annoncée ; échec d'enregistrement signalé sans bloquer | D-089 à D-091 | Cas S-01 à S-05 de C-09 |
| B-052 | Export d'une partie rejouable à l'identique | D-092 | Cas S-03/S-06 de C-09 |
| B-053 | Boutons « bug » et « envoyer ma partie » pour tous, sans compte, via un service qui crée les issues GitHub, avec anti-abus | D-093 à D-095 | Cas PR-01/PR-02/PR-06 de C-10 |
| B-054 | Validation téléphone : case « je valide » signée par le téléphone du porteur du projet ; aucun secret de validation dans le jeu, le dépôt ou le service | D-096/D-130 | Cas PR-03 à PR-05 et PR-10 de C-10 |
| B-055 | Validation = partie allée au bout puis jugement ; chaque morceau au moins une fois ; perdue si l'aventure ou ses parcours automatiques changent | D-098 à D-100 | Cas PR-07/PR-08 de C-10 |
| B-056 | Partie incompatible après mise à jour : message et nouvelle partie | D-103 | Cas S-04 de C-09 |
| B-057 | Zones de fusion : tests/docs verts fusionnés après relecture indépendante ; moteur orange au début ; branche principale non protégée | D-104 à D-107 | Configuration du dépôt et des agents au Bootstrap |
| B-058 | Textes en français, vouvoiement, 2 à 4 phrases, écrits à la main avec trous et variantes ; aucun chiffre de dé | D-109 à D-114 | Cas N-01 à N-07 de C-07 |
| B-059 | Textes écrits par les agents en autonomie, fusionnés après relecture indépendante, sous les règles NP-01 à NP-05 | D-115/D-116 | Contrôles automatiques de C-07 |
| B-060 | Lancement : dix morceaux, 2 ou 3 obstacles par station, une seule espèce de créature, un seul problème final ; créature placée selon les morceaux ; stations tirées au hasard | D-118 à D-121, D-156 à D-162 | Liste des morceaux, stations assemblées et durée mesurée |
| B-061 | Dépôt existant, PWA sur GitHub Pages, pile technique proposée par les agents et choisie par le porteur du projet | D-122 à D-124 | Proposition d'architecture acceptée |
| B-062 | Validation par PR : preuves de l'agent, version de test par PR, retours et validation signée en commentaire | D-129 à D-132 | Cas PR-09 de C-10 |
| B-063 | Service de rapports mis à jour et déployé par les agents ; agents GitHub Copilot sur le PC du porteur du projet | D-125 à D-128 | Configuration au Bootstrap |
| B-064 | React pour l'écran, Cloudflare Workers pour le service, captures automatiques jointes aux PR | D-133 à D-135 | Bootstrap et première PR avec captures |
| B-065 | Architecture AP-01 à AP-10 respectée : moteur isolé, dés enregistrés, sauvegarde par action, signature, versions de test, commande unique | D-136 | Vérification complète au Bootstrap |
| B-066 | Quatre nouveaux morceaux : salle des machines, passerelle effondrée, zone sans gravité, chambre froide, avec leurs règles | D-158, D-163 à D-166, D-168 à D-170 | Conception des morceaux, puis parcours témoins |
| B-067 | Mélange de morceaux autorisé seulement une fois ses règles décidées ; détail des morceaux proposé par les agents et validé | D-167, D-171 | Document de conception des morceaux accepté |
| B-068 | Dix morceaux en deux familles (final, chemin), mélanges MX-01 à MX-05, un seul interrupteur des machines | D-172 à D-175 | Parcours sûr par morceau, cas par mélange, partie sur téléphone par morceau |
| B-069 | Créature mise hors jeu avant le problème final : mesurée avant toute décision ; placement plus souvent près du final gardé en réserve | D-241 | Statistiques de tirage de #106 et parties du porteur |
| B-070 | Petites stations d'abord (six à dix pièces, sans annexes) ; grandes stations seulement si la durée des parties le demande | D-242 | Durée mesurée sur téléphone ; grandes stations si besoin |
| B-071 | Lore léger au lancement : quelques documents à lire, écrits à la main par l'assistant principal lui-même avec une exigence de qualité d'écriture, qui servent aussi d'indices | D-243 | Conception du lore acceptée, contrôles de C-07, relecture indépendante avant fusion (D-105, D-116) |
| B-072 | Objets nécessaires placés hors de leur morceau : après les annexes, à ne pas oublier | D-244 | Règle de placement décidée, puis vérifieur de stations |
| B-073 | #106 en sept livraisons, plan du chemin principal seulement ; grandes stations dans une issue à part si la durée le demande | D-245 | Preuves des livraisons L0 à L6 (13 §7.1) |
| B-074 | Mélanges : l'air et le feu passent le vide de la passerelle ; la baie va avec les nouveaux morceaux ; les obstacles qui ne jouent pas sur la même chose se mélangent sans règle de plus | D-246 à D-248 | Cas de mélange en station assemblée (L3, L4) |
| B-075 | Assemblage : le final apporte l'embarquement ; portes fermées entre morceaux au départ ; pile ou face du final, puis pur hasard ; ordre libre depuis un même couloir ; le panneau caché contourne la créature | D-249, D-252 à D-254, D-256 | Assembleur, statistiques de tirage, parties sur téléphone |
| B-076 | Chemin sûr pouvant passer par l'action libre du premier contact ; une sortie au dé reste une sortie ; NOUVELLE PARTIE tire une station dans la version de test | D-250, D-251, D-255 | Vérifieur (L1), signal (L6), version de test (L2) |

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

Répartition D-038 : la dépressurisation sera éprouvée par une deuxième aventure de référence. AR-01 se concentre sur les quatre autres besoins ; ce report de tranche n'est pas une exclusion du lancement. Cette deuxième référence, [AR-02](09-aventure-reference-vide.md), est acceptée en conception : courte aventure complète de quatre pièces (D-058, D-074).

## 5. Rejouabilité

Une seule famille de scénarios est retenue au lancement (D-017), avec objectif commun d'évacuation (D-018) et situations variables. Les dimensions exactes de variation restent à choisir. Les trois squelettes de la V1 ne deviennent pas des exigences de migration.

Le besoin « chaque partie est différente » doit être traduit en variations observables, pas en promesse mathématique de ne jamais rejouer une combinaison.

La possibilité de perdre est acceptée (D-013). La résolubilité initiale et la réaction à la destruction d'une ressource essentielle restent à spécifier sans rendre automatiquement toute décision récupérable.

## 6. Personnage, risque, espace, temps et échec

Personnage fixe (D-016), pièces avec positions relatives (D-015), actions engageantes seules susceptibles de faire avancer le monde (D-014), défaite définitive (D-013).

Santé, consommables et menace réactive constituent les contraintes choisies (D-021). Aucune échéance globale ni jauge permanente d'O₂, de faim ou de fatigue. Un danger local, comme une pièce dépressurisée, reste dans le périmètre.

Le joueur voit un risque qualitatif et les conséquences prévisibles avant une tentative (D-020). Une nouvelle tentative paie de nouveaux coûts et risques si elle reste possible (D-024). Pas de duel classique : se protéger, détourner, préparer l'environnement ou fuir (D-025).

La propagation des dangers dépend des passages et de leurs capacités (D-023). Pour AR-01, [C-03](contrats/C-03-temps-reactions.md) fixe l'ordre du tour et le feu après deux engagements de connexion laissée ouverte. Les règles du vide sont fixées pour AR-02 par D-059 à D-074 et retranscrites dans C-03/C-04 : mortel sans combinaison, vide immédiat dans tout ce qui est ouvert vers la brèche, air de retour dès qu'une pièce n'y est plus reliée. Le [contrat de cohérence du monde](contrats/C-05-monde-consequences.md) conserve ses invariants transversaux.

Pour AR-01, [C-04](contrats/C-04-risques-blessures.md) fixe indemne/blessé/critique/défaite, soin consommable, aggravation plafonnée et premier réglage de la fuite exposée. La menace persistante est décrite par C-03 et les positions d'AR-01. Aucun de ces paramètres ne doit être généralisé silencieusement à un autre danger ou une autre entité.

Aucun système détaillé de caractéristiques, combat, horloges ou ressources n'est autorisé implicitement. Pas de grille tactique ni de checkpoint annulant une défaite.

## 7. Interface, narration et assets

- Texte et carte requis ; carte en plan et en liste, décrite par la [maquette v1](12-interface-ecrans.md) (D-140).
- Actions contextuelles sélectionnables sur téléphone requises : bulles ancrées, aperçu puis confirmation (D-140, D-146).
- Illustrations d'objets éventuelles, pas encore un volume obligatoire.
- Français seulement (D-109) ; direction visuelle « Phosphore » et liste d'accessibilité de 12 §7 (D-140) ; ambiance sonore (D-148) : bruitages libres de droits et bande-son fournie (D-153) ; IA Station sans voix, signalée par un effet sonore (D-155).
- Une chaîne traduite ne devient pas une commande métier reparsée.

## 8. Sauvegarde, exploitation et publication

La défaite ne peut être annulée par chargement. Une autosave après chaque action engagée permet la reprise exacte d'une partie active (D-022). La compatibilité des sauvegardes, le comportement en cas d'erreur ou d'interruption d'écriture, l'installation hors ligne, les plateformes ciblées, l'hébergement, le budget et les accès publics/privés restent à préciser.

La sortie sur les stores n'est pas requise pour clôturer la première publication PWA. Le projet ne doit néanmoins pas introduire sans raison un choix technique qui rendrait ce futur impossible.

## 9. Exclusions validées et fonctionnalités non décidées

**Exclus pour la version actuelle :** parser de commandes libres, dépendance à un LLM de GM, obligation de publication en stores avant clôture PWA, grille tactique, création de classes, duel classique par attaques répétées, retour arrière annulant une défaite, échéance globale et jauges permanentes de faim/fatigue/O₂.

**Non décidés, donc pas automatiquement autorisés :** comptes, monétisation, analytics, serveur de jeu, campagnes longues, métaprogression, multi-personnages, fabrication libre, durabilité, mode multijoueur.

## 10. Prochaine révision

L'[aventure AR-01 v1.0](08-aventure-reference.md) est acceptée comme référence de conception, avec trois témoins à prouver et ses contrats C-03/C-04 (D-055 à D-057). Les textes de finition, la durée, l'intérêt et la découvrabilité ne sont pas encore validés ; aucun parcours n'a été exécuté.

Prochaine étape proposée : borner les entités, connaissances, conditions de génération/fins, sauvegarde/replay et preuves. Compléter ensuite architecture, périmètre de contenu et issues de lancement. Ne pas construire le moteur sur des inconnues remplacées silencieusement par des valeurs inventées.
