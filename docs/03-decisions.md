# Void Walker V2 — journal des décisions

> **Statut :** JOURNAL ACTIF — seules les entrées « Validé » font autorité.
> **Mise à jour :** 2026-10-15.

## Règles

- **Proposé** : recommandation ou option, interdite à traiter comme exigence acceptée.
- **Validé** : choix explicite du porteur du projet ; indiquer l'origine.
- **Remplacé par D-xxx** : historique conservé, nouvelle décision référencée.
- **À décider** : question ouverte, pas une valeur par défaut.

Une approbation globale du travail ne valide pas automatiquement toutes les options de design évoquées. Les seuils et détails absents ne doivent pas être inventés au moment de coder.

## Index par domaine

Cet index sert à trouver les décisions liées à une tâche ; il ne remplace pas leur texte. Les plages indiquent les identifiants concernés, pas leur statut : vérifiez chaque entrée avant d'appliquer une règle. Le lien mène au début du bloc ; utilisez la recherche du document sur l'identifiant précis cité par l'issue ou le contrat.

| Domaine | Décisions |
| --- | --- |
| Vision, périmètre et règles générales | [D-001 à D-030](#d-001--développement-agentique-arbitrage-produit-humain) |
| Aventure de référence AR-01 | [D-031 à D-057](#d-031--passager-réveillé-pendant-le-confinement) |
| Aventure de référence AR-02 | [D-058 à D-074](#d-058--ar-02--courte-aventure-complète-de-la-même-famille), [D-193 à D-196](#d-193--le-passage-en-force-dar-02-se-joue-sans-dé) |
| Monde, observation et connaissances | [D-075 à D-082](#d-075--la-carte-montre-seulement-ce-quon-a-visité) |
| Stations, génération et fins | [D-083 à D-087](#d-083--variation-par-assemblage-de-morceaux-écrits-à-la-main), [D-118 à D-121](#d-118--environ-huit-morceaux-au-lancement), [D-156 à D-175](#d-156--de-nouveaux-morceaux-peuvent-apporter-de-nouvelles-règles), [D-234 à D-240](#d-234--relance-des-machines-et-compresseur--un-bruit-comme-lavertisseur), [D-241 à D-244](#d-241--créature-mise-hors-jeu-tôt--on-mesure-avant-de-décider), [D-245 à D-256](#d-245--découpage-de-106-accepté--grandes-stations-dans-une-issue-à-part), [D-257 à D-260](#d-257--un-vestibule-de-réveil-sans-danger-immédiat), [D-261 à D-262](#d-261--m-07--la-créature-attend-seulement-dans-la-soute), [D-264 à D-265](#d-264--l3--réussie-si-chaque-station-mène-à-la-capsule-la-difficulté-plus-tard), [D-268 à D-269](#d-268--l4--créature-sur-le-palier-ou-dans-latelier-seulement-derrière-un-obstacle-qui-permet-de-sen-débarrasser) |
| Sauvegarde, export et rapports | [D-088 à D-103](#d-088--nouveaux-tirages-en-rejouant-une-station), [D-200](#d-200--abandonner-efface-la-partie-de-lappareil), [D-231 à D-232](#d-231--le-rapport-sécrit-dans-un-panneau-ouvert-sous-sa-ligne-des-options) |
| Gouvernance, agents et architecture | [D-104 à D-108](#d-104--tests-et-documentation-restent-en-zone-verte), [D-122 à D-139](#d-122--la-v2-se-développe-dans-le-dépôt-existant), [D-199](#d-199--lorchestration-des-issues-reste-dans-la-conversation-principale), [D-227](#d-227--mise-à-jour-de-lappli-installée--numéro-de-construction) |
| Textes du jeu | [D-109 à D-117](#d-109--français-seulement-au-lancement), [D-243](#d-243--un-lore-léger-au-lancement-écrit-avec-soin-par-lassistant-principal) |
| Interface et interactions d'écran | [D-140 à D-155](#d-140--maquette-dinterface-v1-et-direction--phosphore-), [D-176](#d-176--une-couleur-par-menu--cyan-pour-linventaire), [D-182](#d-182--une-seule-touche-quand-rien-nest-à-craindre-sauf-pour-les-portes), [D-186 à D-187](#d-186--le-nouveau-texte-sécrit-à-la-machine-puis-un-curseur-clignote), [D-191 à D-192](#d-191--écran-plus-compact-boutons-toujours-visibles-six-lignes-de-récit-au-moins), [D-197 à D-198](#d-197--nouveaux-noms-de-pièces-dans-ar-01-et-ar-02), [D-229 à D-230](#d-229--les-portes-se-manœuvrent-depuis--se-déplacer-vers-), [D-233](#d-233--le-danger-apparu-sannonce-en-rouge-triangle-clignotant-avec-son-alarme), [D-263](#d-263--ia-station-sannonce-sur-son-bouton-plus-dans-le-récit) |
| Créature, blessures et dangers | [D-177 à D-181](#d-177--la-créature-suit-le-passage-quelle-vous-a-vu-prendre), [D-183 à D-190](#d-183--rester-sous-ses-yeux-se-joue-au-même-dé-que-la-fuite) |
| Carte et géométrie des stations | [D-201 à D-215](#d-201--la-carte-est-un-plan-de-pont) |
| Son | [D-216 à D-226](#d-216--bruitages-synthétisés-pour-le-projet) |

Statuts particuliers à ne pas manquer : D-011 et D-012 sont des propositions (D-012 n'a pas été retenue) ; D-097, D-152 et D-193 sont remplacées ; le volume de D-118 est remplacé par D-157. Les précisions partielles apportées à d'autres décisions sont indiquées dans leur entrée.

## Décisions validées

### D-001 — Développement agentique, arbitrage produit humain

- Date / statut : 2026-10-09 / **Validé**.
- Origine : demande utilisateur de faire développer 100 % du jeu par développement agentique.
- Décision : les agents produisent le code et les preuves ; le porteur du projet arbitre le produit et accepte les résultats selon les zones à préciser.
- Limite : cela n'autorise pas un agent à inventer une partie humaine, une validation ou une décision de contenu.

### D-002 — Nouveau dépôt et méthode issue/preuves inspirée de Lacets

- Date / statut : 2026-10-09 / **Validé**.
- Origine : Phase 0 demandée par l'utilisateur, puis mise à disposition de Lacets.
- Décision : repartir dans un nouveau dépôt, avec Bootstrap, commande complète de vérification en CI, workflow d'issues et revue.
- Limite : le nouveau dépôt n'est pas encore créé ; les permissions, zones et configurations précises restent à arbitrer.

### D-003 — Horreur spatiale, texte et mobile-first

- Date / statut : 2026-10-09 / **Validé**.
- Origine : demande initiale du projet, non remplacée.
- Décision : jeu narratif solo d'horreur spatiale, texte majoritaire, carte, web/PWA pour smartphone ; assets d'objets envisageables.
- Limite : style visuel, niveau de détail de la carte, audio et volume d'assets non décidés.

### D-004 — Pas de LLM dans le jeu pour cette version

- Date / statut : 2026-10-09 / **Validé**.
- Origine : demande utilisateur de rester sans LLM pour l'instant.
- Décision : la boucle de jeu ne dépend pas d'un LLM. Un LLM peut servir de joueur de test via un harnais séparé.
- Limite : aucune intégration IA de production n'est autorisée par cette décision.

### D-005 — Créativité comme priorité de gameplay

- Date / statut : 2026-10-09 / **Validé**.
- Origine : entretien, question « Expérience centrale ».
- Décision : « Résoudre les situations par créativité » prime en cas de conflit entre objectifs de gameplay.
- Sens : manipuler objets et environnement, trouver plusieurs solutions concrètes.
- Écarté comme priorité dominante : histoire à décisions fortes ou gestion de survie. Ces dimensions ne sont pas exclues.

### D-006 — Actions contextuelles composables, sans texte libre

- Date / statut : 2026-10-09 / **Validé**.
- Origine : entretien, question « Interaction du joueur ».
- Décision : sélectionner un élément, une action puis éventuellement un outil ou une destination. Les actions sont structurées, pas reparsées depuis leur libellé traduit.
- Écarté pour la V2 : parser les commandes libres du joueur.
- Limite : présentation exacte, options désactivées et frontières de connaissance à spécifier.

### D-007 — Dés seulement face à un risque réel

- Date / statut : 2026-10-09 / **Validé**.
- Origine : entretien, question « Place du hasard ».
- Décision : actions ordinaires déterministes ; incertitude réservée aux tentatives risquées.
- Limite : type de dé, probabilité, information affichée, succès partiel et règle de répétition non décidés.

### D-008 — Partie complète de 15 à 30 minutes

- Date / statut : 2026-10-09 / **Validé**.
- Origine : entretien, question « Durée d'une partie ».
- Décision : durée cible du début à une conclusion, pas durée maximale d'ouverture de l'application.
- Limite : politique de sauvegarde, interruptions et mesure sur joueur novice à préciser.

### D-009 — Petit jeu complet publié en PWA

- Date / statut : 2026-10-09 / **Validé**.
- Origine : entretien, question « Arrivée du projet ».
- Décision : le chantier doit aboutir à un petit jeu fini, fiable et rejouable publié en PWA, pas seulement un prototype privé.
- Écarté du périmètre de fin actuel : obligation de sortie sur les stores.
- Limite : nombre de familles de scénarios et quantité de contenu encore à décider.

### D-010 — Validation des références sur téléphone

- Date / statut : 2026-10-09 / **Validé**.
- Origine : exigence explicite de l'utilisateur dans la Phase 0.
- Décision : un parcours de référence ne passe validé qu'après une partie de l'utilisateur sur téléphone.
- Limite : format de preuve, protection des attestations et conditions d'invalidation à spécifier. Aucun parcours V2 n'est encore validé.

## Propositions non arbitrées

### D-011 — Cadrage puis réduire, prouver, migrer

- Date / statut : 2026-10-09 / **Proposé**.
- Décision proposée : préciser les contrats avant Bootstrap ; construire une aventure écrite à la main avant génération ; migrer seulement les éléments utiles de la V1.
- Pourquoi : ne pas reproduire les systèmes isolés qui n'ont jamais été validés ensemble.
- À confirmer : périmètre de la première aventure et contenu final à livrer.

### D-012 — Zones par risque de changement, pas seulement par dossier

- Date / statut : 2026-10-09 / **Proposé, non retenu par D-104** (2026-10-10).
- Décision proposée : une modification d'oracle, de seuil, de contrat, de permission ou d'attestation humaine ne devient pas verte parce qu'elle se trouve dans les tests, outils ou docs.
- Pourquoi : empêcher qu'un agent fasse passer son changement en affaiblissant la définition de réussite.
- Origine utilisateur à préserver : verte pour tests/outils/solveur/docs ; orange pour textes/UI/équilibrage/format de scénarios ; rouge pour déploiement/sauvegarde/IA. Les exceptions proposées doivent être validées explicitement.

## Décisions validées — deuxième entretien

### D-013 — Défaite définitive pour la partie en cours

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-06 « Pas de retour : nouvelle partie après défaite ».
- Décision : pas de retour arrière pour annuler une mauvaise décision ; la défaite conclut cette partie.
- Écarté : checkpoint de reprise après défaite et chargements libres permettant de recommencer une décision.
- Limite : la sauvegarde pour interrompre puis reprendre une partie encore active est distincte et reste à préciser.

### D-014 — Le temps avance uniquement pour les actions engageantes

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-07 « Seulement les actions qui engagent le personnage ».
- Décision : lire, ouvrir les menus et consulter les objets sont gratuits ; une manipulation ou un déplacement peut coûter du temps. Aucune pression en temps réel pendant la lecture.
- Limite : les durées, les observations actives et la nature de la pression éventuelle restent à spécifier. Cette décision ne crée pas une horloge supplémentaire.

### D-015 — Pièces et positions relatives simples

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-08 « Pièces avec positions relatives simples ».
- Décision : le monde comporte des pièces et des relations spatiales simples à l'intérieur, par exemple devant une porte ou derrière un meuble.
- Écarté : grille tactique et distances au mètre pour cette version.
- Limite : déplacement d'objets entre pièces, contraintes de taille et interactions spatiales à définir par exemples.

### D-016 — Un personnage fixe

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-09 « Un personnage fixe pour la première version ».
- Décision : même personnage de départ, sans choix de classes ou répartition de statistiques dans le périmètre initial. La variété vient des scénarios et objets.
- Limite : identité, capacités, équipement de départ et effets des conditions non décidés. « Fixe » ne signifie pas invulnérable ni incapable d'évoluer pendant une partie.

### D-017 — Une famille de scénarios procéduraux au lancement

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-10 « Une famille de scénarios, plusieurs situations générées ».
- Décision : objectif général commun, avec variation possible des lieux, ressources, contraintes et solutions dans une seule famille.
- Écarté : deux ou trois familles obligatoires avant publication ; aventure fixe comme seul contenu final.
- Limite : une aventure fixe reste possible comme instrument de référence avant génération. Objectif général et dimensions exactes de variation à arrêter.

## Décisions validées — troisième entretien

### D-018 — Objectif commun : s'échapper

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-11 « S'échapper d'un vaisseau ou d'une station ».
- Décision : la famille de lancement vise l'évacuation d'un lieu spatial dangereux ; préparer, rétablir ou trouver une voie de sortie constitue la progression.
- Limite : lieu précis, personnage, conditions de départ et moyens d'évacuation encore à concevoir. Neutraliser une menace n'est pas automatiquement une victoire d'évacuation.

### D-019 — Cinq interactions créatives de référence

- Date / statut : 2026-10-09 / **Validé sur l'intention**.
- Origine : exemples libres fournis par l'utilisateur à Q-12.
- Décision : le périmètre doit permettre les situations suivantes : détériorer une vitre de station pour provoquer une dépressurisation, avec nécessité de se protéger et effet possible sur un ennemi ; répandre de l'huile pour faire glisser un ennemi ; déplacer une caisse sous une grille pour atteindre l'aération ; ouvrir un panneau de contrôle pour découvrir un passage secret ; arroser un feu pour l'éteindre.
- Limite : les matériaux, vulnérabilités, consommations, propagation, coûts, chances et conditions précises restent à contractualiser. Ce ne sont pas des effets universels sur tout objet nommé « vitre », « ennemi » ou « feu ».
- Référence : [situations de référence](07-interactions-reference.md), qui séparent ces intentions validées des modalités proposées.

### D-020 — Risque qualitatif et conséquences connues avant tentative

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-13 « Niveau de risque et conséquences connues ».
- Décision : exposer au joueur un niveau de risque et les coûts/dangers prévisibles, sans pourcentage exact. Les secrets du monde ne sont pas révélés par cette présentation.
- Limite : libellés, niveaux, confirmation et frontière entre risque connu et surprise à préciser.

### D-021 — Santé, consommables et menace réactive

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-14 « Santé, consommables et menace réactive ».
- Décision : les actes et déplacements exposent au danger ; pas d'échéance globale ni de faim, fatigue ou jauge d'O₂ permanente pour le lancement.
- Limite : santé chiffrée ou états, consommables précis et comportement de menace encore à définir. Le danger local de dépressurisation de D-019 n'exige pas une jauge d'O₂ globale.

### D-022 — Une autosave après chaque action engagée

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-15 « Une sauvegarde automatique, après chaque action ».
- Décision : une partie active se reprend au dernier état engagé ; pas de chargement d'un ancien tour ni de relance d'un résultat de dé. La fermeture de l'application n'est pas une défaite.
- Limite : gestion d'erreur de stockage, interruption pendant l'écriture et compatibilité entre versions doivent être spécifiées et testées. Aucun anti-triche contre la modification manuelle des données n'est demandé.

## Décisions validées — quatrième entretien

### D-023 — Propagation simple par passages ouverts

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-16 « Propagation simple par passages ouverts ».
- Décision : l'état des connexions et portes influe sur la propagation du feu et de la dépressurisation. Les règles sont bornées et peuvent différer entre ces dangers, sans simulateur de fluides.
- Limite : rythme de propagation, étanchéité, ordre des effets et protection exacte restent à spécifier. « Porte fermée » ne définit pas encore à elle seule toutes ses capacités protectrices.

### D-024 — Nouvelle tentative contre nouveaux coûts et risques

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-17 « Oui, en payant de nouveau les coûts et risques ».
- Décision : une tentative ratée peut être recommencée si elle reste possible dans le nouvel état ; elle expose de nouveau au temps, aux consommations éventuelles et aux réactions prévues. Pas de jet gratuit par rechargement.
- Limite : le changement du monde peut retirer une possibilité ; la décision ne garantit ni nombre illimité d'essais ni diminution automatique de difficulté après répétition.

### D-025 — Pas de duel : protection, diversion et fuite

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-18 « Seulement se protéger, détourner ou fuir ».
- Décision : ne pas construire une boucle de duel où des attaques répétées permettent d'éliminer la menace. Les réactions du joueur privilégient protection, diversion, préparation environnementale et fuite.
- Articulation avec D-019 : un outil ou un tir peut agir sur l'environnement dans le cas de la vitre ; la neutralisation environnementale reste possible. Cela ne crée pas une action d'attaque directe universelle ni un équipement de départ obligatoire.
- Limite : comportement de la menace, moyens de protection et résolution de ses effets à définir.

### D-026 — Menus de manipulations plausibles sans dévoiler les résultats secrets

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-19 « Manipulations plausibles, sans annoncer leur résultat secret ».
- Décision : présenter les manipulations appropriées aux éléments connus (examiner, ouvrir, déplacer, utiliser avec…). Expliquer les blocages connus sans annoncer les résultats cachés. Les menus ne sont pas une liste des seules solutions gagnantes.
- Écarté : tous les verbes sur tous les objets ; liste des seules actions immédiatement réussissables.
- Limite : le contrat d'observation doit préciser l'usage des connaissances et les raisons publiques d'indisponibilité.

## Décisions validées — cinquième entretien

### D-027 — Acceptation des socles C-01 et C-05 v0.1

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-20 « Valider le socle proposé » après présentation des deux documents.
- Décision : les obligations de [C-01](contrats/C-01-actions-observation.md) et [C-05](contrats/C-05-monde-consequences.md) deviennent le socle contractuel accepté.
- Portée : commandes structurées, préconditions revérifiées, observation sans fuite de secrets, effets vrais, identité/conservation des objets, parité des adaptateurs et reprise cohérente.
- Réserves : les questions explicitement ouvertes dans les documents le restent, notamment coûts, dégâts, probabilités internes, ordre du tour, détails d'écriture de sauvegarde et critères de fin. Cette acceptation ne certifie aucune implémentation ni partie sur téléphone.

### D-028 — Santé par états de blessure

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-21 « Quelques états de blessure ».
- Décision : représenter la santé par un petit nombre d'états plutôt que par un calcul détaillé de points de vie.
- Limite : les noms, le nombre d'états, leurs malus éventuels et transitions de soin restent à proposer et accepter. Les exemples de labels de la question ne constituent pas une liste définitive.

### D-029 — Une menace principale persistante par partie

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-22 « Une menace principale persistante par partie ».
- Décision : la menace possède un emplacement et réagit aux actes du joueur ; sa continuité persiste pendant la partie. Variations possibles dans un cadre borné.
- Écarté : plusieurs ennemis indépendants comme exigence de lancement ; pression purement narrative sans entité.
- Limite : espèce/type, capacités, perception, déplacements, signaux publics et variabilité exacts à définir.

### D-030 — Une station spatiale isolée au lancement

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-23 « Une station spatiale isolée ».
- Décision : concentrer le contenu du lancement sur une station, ses secteurs, sas, conduits et systèmes, avec géographie variable.
- Écarté : deux habillages station/vaisseau à livrer immédiatement.
- Limite : nom, ton visuel, incident, identité du personnage et rôle de la menace à concevoir. La mention historique « vaisseau ou station » de D-018 est restreinte à une station pour ce lancement.

## Décisions validées — aventure de référence, premier entretien

### D-031 — Passager réveillé pendant le confinement

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-24 « Passager réveillé pendant le confinement ».
- Portée : personnage fixe de l'aventure AR-01.
- Décision : le joueur découvre la situation en tant que passager, pas spécialiste de maintenance. Les manipulations doivent être compréhensibles par les indices et outils montrés.
- Limite : identité, équipement initial et histoire personnelle non choisis ; aucune compétence technique cachée n'est justifiée par cette décision.

### D-032 — Créature organique sensible au bruit pour la référence

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-25 « Une créature organique sensible au bruit ».
- Portée : menace principale d'AR-01, conformément à D-029.
- Décision : présence physique persistante et sensible aux sons, permettant des indices et diversions. L'emplacement reste réel, pas un effet narratif arbitraire.
- Limite : perception exacte, vulnérabilités, rythme de déplacement et aspect non choisis. « Organique » n'est pas une implémentation suffisante de toutes ces règles.

### D-033 — Alimentation du départ comme objectif matériel

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-26 « Rétablir l'alimentation du départ ».
- Portée : objectif d'évacuation d'AR-01.
- Décision : atteindre la capsule ne suffit pas ; il faut rendre son départ alimenté, par acheminement ou réaffectation d'énergie selon des approches à préciser.
- Écarté comme obstacle final principal : mécanisme d'arrimage ou badge arbitraire ajouté en plus.
- Limite : les deux solutions proposées dans l'aventure ne sont pas encore acceptées par cette seule réponse.

### D-034 — Voix distante aux échanges scriptés

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-27 « Une voix distante aux messages scriptés ».
- Portée : récit de l'aventure AR-01.
- Décision : quelques échanges à choix prédéfinis, sans LLM ni compagnon physique à déplacer.
- Limite : identité, fiabilité, connaissance, mode de communication et moments de dialogue encore ouverts.

## Décisions validées — aventure de référence, carte et approches

### D-035 — Carte de base à six pièces conservée pour AR-01

- Date / statut : 2026-10-09 / **Validé comme base**.
- Origine : réponse Q-28 « Oui, conserver cette carte comme base ».
- Décision : salon de transit, atelier, galerie technique, local énergie, salle d'observation, embarquement ; voie S–G–P et détour A–P, voie P–O–E et passage caché P–E selon le diagramme d'AR-01.
- Limite : placements, portes, distances abstraites et états initiaux restent à éprouver. Une approbation de carte n'est pas une preuve de résolubilité ou une validation téléphone.

### D-036 — Deux solutions d'alimentation distinctes

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-29 « Oui, deux solutions avec ces contreparties ».
- Décision : rétablir le circuit de station, bruyant, ou apporter un bloc de secours, plus discret mais demandant davantage de manipulations. Chaque approche doit fonctionner sans accomplir l'autre.
- Limite : durées et coûts exacts, bruit physique et portage encore à préciser. Pas de nouveau circuit obligatoire ou clé unique ajoutée implicitement.

### D-037 — Assistance automatisée comme voix de la station

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-30 « Une assistance automatisée de la station ».
- Décision : la voix choisie en D-034 est une assistance de bord à messages et choix scriptés, sans modèle génératif.
- Limite : quantité de dialogue, fiabilité et canaux d'information encore à préciser. Le rôle fictionnel de machine n'autorise pas une intégration IA de production.

### D-038 — Dépressurisation éprouvée dans une deuxième référence

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-31 « Réserver ce cas à une deuxième référence ».
- Décision : ne pas imposer la dépressurisation préparée R-01 dans AR-01. Le besoin reste dans la cible du jeu et doit recevoir une deuxième référence avant d'être déclaré livré.
- Limite : les règles du vide et leurs protections demeurent ouvertes ; ne pas les supprimer du cahier des charges ni les implémenter partiellement dans une action décorative d'AR-01.

## Décisions validées — aventure de référence, temps et stratégies

### D-039 — Un pas par action élémentaire engagée dans AR-01

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-32 « Oui, un pas par action élémentaire ».
- Décision : déplacement, manipulation et autres engagements élémentaires coûtent un pas ; lecture et consultation restent gratuites. Déplacer l'appui, ouvrir une grille et la traverser sont des engagements distincts.
- Limite : la liste exacte des actions et l'ordre interne d'un pas seront spécifiés. Pas de durée variable introduite sans besoin arbitré.

### D-040 — Premier contact : avertissement et occasion de réagir

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-33 « Oui, avertissement puis une action de réaction ».
- Décision : la première rencontre avec la créature doit donner un signal clair et une action au joueur avant sa première conséquence hostile. La lecture gratuite ne consomme pas cette occasion.
- Limite : règles de poursuite continue, perte de contact et éventuel nouvel avertissement à préciser. Ne pas transformer chaque changement de pièce en invulnérabilité gratuite.

### D-041 — Blessures et soin de la référence

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-34 « Oui, ces trois états actifs et cette règle de soin ».
- Décision : indemne → blessé → critique → défaite. Un incident ordinaire aggrave d'un état ; un soin consommable améliore d'un état et ne remet pas la menace à zéro. Pas de malus de mobilité en cascade dans AR-01.
- Limite : quantité de soins, cumul éventuel d'incidents dans un pas et dangers exceptionnels restent à définir. Les règles du vide seront traitées dans la deuxième référence.

### D-042 — Une préparation complète peut supprimer le dé

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-35 « Oui : bien préparer peut éviter le jet ».
- Décision : sans source de risque résiduelle, une manipulation correctement préparée réussit sans tirage. La préparation ne se limite pas à modifier une probabilité.
- Limite : être certain de réaliser l'effet matériel n'immunise pas contre une réaction indépendante de la menace si le joueur reste exposé ; l'information avant engagement doit distinguer les deux.

### D-043 — Bloc transportable mais incompatible avec les passages étroits

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-36 « Oui, accepter cette contrepartie ».
- Décision : le bloc de secours d'AR-01 se transporte par les accès normaux mais ne passe pas dans les deux accès de maintenance. Sa taille et la contrainte sont perceptibles avant transport.
- Pourquoi : différencier circuit bruyant + raccourci et bloc discret + voie normale, sans imposer deux étapes équivalentes.
- Limite : le bloc peut être déposé et le plan changé. Aucun poids, pénalité de mains ou sacrifice d'objet implicite.

### D-044 — La créature ne passe pas dans les conduits d'AR-01

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-37 « Oui, les conduits offrent un vrai contournement ».
- Décision : la taille de cette créature lui interdit les accès de maintenance. Elle peut atteindre une destination par un autre parcours réellement praticable ; pas de téléportation.
- Limite : cette règle concerne les capacités de cette entité et ces passages, pas une interdiction globale pour tous les futurs ennemis.

### D-045 — Avertisseur de station utilisable pour une diversion distante

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-38 « Oui, un équipement réutilisable de la station ».
- Décision : une commande visible dans P déclenche un test sonore en O ; elle coûte une action. L'équipement est réutilisable et son effet sonore existe même si la créature n'est pas entendante/présente à cet instant.
- Limite : ce n'est pas une commande « déplacer l'ennemi ». Durée, perception et priorités de réaction sont à définir. La créature ne devient pas omnisciente du lieu d'activation du contrôleur.

### D-046 — Assistance exacte sur les systèmes, limitée sur la menace

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-39 « Fiable sur les systèmes, limitée sur la menace ».
- Décision : informations électriques et procédures exactes ; ton froid et décalé ; pas de connaissance totale de ce qui rôde. Le doute narratif ne repose pas sur des contradictions arbitraires de l'état du jeu.
- Limite : messages et indices précis à écrire, sans révélation omnisciente des passages cachés.

## Décisions validées — aventure de référence, lisibilité de la menace

### D-047 — Cloisons protectrices non destructibles par la créature dans AR-01

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-40 « Oui, pas de destruction de porte dans AR-01 ».
- Décision : une cloison correctement fermée retient la créature. Fermer coûte une action ; l'entité reste de l'autre côté ou cherche une autre voie réellement praticable. Pas de jauge de résistance ni de destruction automatique de porte dans cette référence.
- Limite : ne pas généraliser à tous les matériaux du contenu futur ; navigation, perception et propagation gardent des capacités distinctes.

### D-048 — Traque réactive, sans patrouille permanente

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-41 « Traque réactive, sans patrouille permanente ».
- Décision : déplacement en réaction à un son perçu ou à un joueur détecté ; pas de patrouille ni d'horloge qui fait apparaître la menace arbitrairement. L'absence de réaction ne réinitialise pas son emplacement.
- Limite : priorités de perception, mémoire des sons et budget de déplacement par réaction à fixer dans la proposition de référence.

### D-049 — Sol huilé préparé : glissade et deux réactions perdues

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-42 « Oui, un ralentissement certain et court ».
- Décision : une créature qui se précipite réellement sur le sol huilé glisse sans dé et perd ses deux réactions suivantes. La position du liquide compte ; une cible distante ou immobile n'est pas affectée.
- Limite : après cette première glissade, la créature connaît ce danger ; pas de même chute répétée gratuitement. Le liquide ne disparaît pas pour autant. Le comportement prudent suivant sera spécifié.

### D-050 — Au moins un parcours sûr par préparation

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-43 « Oui, un parcours sûr par préparation ».
- Décision : il doit exister au départ un parcours d'évacuation sans blessure ni jet obligatoire si correctement préparé. La découverte de ce parcours peut demander de l'observation et de la compréhension.
- Limite : existence à prouver par le futur moteur/solveur, découvrabilité à vérifier sur téléphone. Les mauvaises décisions et autres tentatives peuvent toujours exposer au risque ou mener à la défaite.

## Décisions validées — aventure de référence, ressources et conclusion

### D-051 — Trois consommables et inventaire simple dans AR-01

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-44 « Oui, ce petit ensemble suffit pour AR-01 ».
- Décision : une dose d'eau adaptée au foyer, une dose de lubrifiant glissant explicitement non inflammable dans cette fixture, un soin. Pas de gestion de poids ni cases d'inventaire dans AR-01 ; caisse au sol, gabarit du bloc toujours contraignant.
- Limite : ne pas généraliser l'inflammabilité de ce lubrifiant à tous les liquides futurs. Consommations et contenants restent persistants, sans régénération automatique.

### D-052 — Fuite exposée : franchissement avec blessure en cas de jet défavorable

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-45 « Il passe, mais subit une blessure ».
- Décision : une tentative de franchissement possible mais exposée change de position même lorsque le jet est défavorable ; dans ce cas une aggravation de blessure est appliquée. La menace peut encore réagir dans les engagements ultérieurs selon la topologie.
- Limite : ne pas confondre risque et précondition impossible. Une porte fermée, un gabarit incompatible ou une destination invalide ne sont pas franchis grâce à ce résultat. Probabilité et articulation avec la réaction du même pas à fixer.

### D-053 — Au plus une aggravation ordinaire par engagement dans AR-01

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-46 « Oui, une aggravation maximale par engagement ».
- Décision : si des dangers ordinaires se cumulent, leurs causes sont conservées mais le personnage n'aggrave sa blessure que d'un état au maximum pour cet engagement.
- Limite : la protection n'efface pas les dangers persistants ; les engagements suivants peuvent aggraver de nouveau. Les dangers exceptionnels du vide feront l'objet de la deuxième référence.

### D-054 — Départ en trois engagements et conditions physiques

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-47 « Oui, trois gestes explicites pour le départ ».
- Décision : entrer, fermer l'écoutille, lancer. Victoire seulement pour une capsule alimentée, un personnage vivant à bord, une cabine isolée sans menace active à bord et un départ effectivement commandé.
- Limite : la pièce d'embarquement n'est pas une victoire, une fermeture n'élimine pas magiquement un adversaire présent, et une défaite ne devient pas une victoire dans la même transition.

## Décisions validées — acceptation d'AR-01 comme conception

### D-055 — Réglage initial du risque de fuite exposée

- Date / statut : 2026-10-09 / **Validé comme paramètre de référence**.
- Origine : réponse Q-48 « Oui, ce réglage de référence suffit ».
- Décision : un D6 ; 4–6 = franchissement sans aggravation due à cette interception ; 1–3 = franchissement avec une aggravation. Un seul jet résout l'interception et consomme la réaction de cette menace pour cet engagement ; pas de seconde attaque ni déplacement supplémentaire dans le même pas.
- Portée : risque résiduel d'une fuite exposée d'AR-01, non d'une action impossible. Interface qualitative, parcours préparés sans ce jet, plafond de D-053 conservé pour les causes combinées.
- Limite : valeur à éprouver et éventuellement rééquilibrer par décision explicite ; pas un équilibre universel imposé à la génération ou à la deuxième référence.

### D-056 — Ordre de tour et délai de propagation d'AR-01

- Date / statut : 2026-10-09 / **Validé pour AR-01**.
- Origine : réponse Q-49 « Oui, cet ordre et ce délai sont lisibles ».
- Décision : action → mise à jour des dangers → une réaction de menace → conclusion et sauvegarde. Une ouverture compte comme premier engagement exposant le lien au feu ; propagation après deux fins d'engagement consécutives de lien resté ouvert.
- Effet : l'extinction au pas suivant intervient avant la deuxième étape environnementale ; la lecture gratuite ne consomme pas cette fenêtre. Pas de propagation à travers plusieurs pièces dans la même mise à jour.
- Limite : pas de règle d'O₂ ou de vide implicitement déduite de cet ordre ; ce sera le contrat de la deuxième référence.

### D-057 — AR-01 v1.0 acceptée comme référence de conception

- Date / statut : 2026-10-09 / **Conception validée, exécution non vérifiée**.
- Origine : réponse Q-50 « Oui, référence de conception acceptée », avec Q-48/Q-49.
- Décision : accepter les placements, positions, canaux sonores, rythme de l'avertisseur, règles locales et conditions finales décrits par AR-01, ainsi que les trois parcours témoins P-A/P-B/P-C (13/18/15 engagements) comme attentes à prouver par le futur moteur.
- Organisation : les règles temporelles et de risque sont retranscrites dans C-03 et C-04 ; AR-01 reste la référence des données fixes et des parcours. Cette extraction ne crée pas de nouvelle règle.
- Réserves : le texte narratif reste un brouillon éditorial ; durée, intérêt, découvrabilité, équilibrage et implémentation ne sont pas validés. Aucune case de partie humaine ou de référence exécutée ne doit être cochée par un agent.
- Limite : une contradiction trouvée par implémentation/revue doit revenir en arbitrage, pas être cachée par une mutation de scénario, un affaiblissement de test ou une fausse attestation. Cette décision ne lance pas automatiquement le Bootstrap ni ne termine le starter pack global.

## Décisions validées — deuxième référence, règles du vide

### D-058 — AR-02 : courte aventure complète de la même famille

- Date / statut : 2026-10-09 / **Validé**.
- Origine : réponse Q-51 « Courte aventure complète, même famille ».
- Décision : la deuxième référence exigée par D-038 est une aventure courte et complète, du départ à l'évacuation, d'environ quatre pièces, avec le même passager et le même type de créature sensible au bruit. Seules les règles du vide sont nouvelles ; feu, huile et bloc en sont absents pour isoler leurs interactions.
- Conséquence : les règles acceptées d'AR-01 qui ne concernent ni le feu, ni l'huile, ni le bloc (temps, réactions, blessures, fuite exposée, départ) sont reprises plutôt que réinventées ; leur application précise à AR-02 sera confirmée avec sa conception.
- Limite : ni deuxième famille narrative ni variante de la carte d'AR-01. Carte, objets, outil et parcours restent à accepter. Les interactions du vide avec feu, huile ou bloc ne sont pas définies : ne pas les combiner par extrapolation.

### D-059 — Vide sans protection : défaite immédiate annoncée

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-52 « Défaite immédiate, annoncée comme mortelle ».
- Décision : un passager exposé au vide sans protection est vaincu, hors du plafond d'aggravation de D-053. Toute action connue pour l'y exposer est présentée comme mortelle sans protection avant engagement.
- Cadre de la question : dans la référence, seul le joueur peut ouvrir une brèche ; aucune rupture aléatoire.
- Limite : forme de l'avertissement et éventuelle confirmation à maqueter (C-01). Pas de jauge d'O₂ (D-021). Découvrabilité du danger à vérifier sur téléphone.

### D-060 — Combinaison étanche comme protection personnelle

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-53 « Combinaison étanche, un engagement pour l'enfiler ».
- Décision : enfiler la combinaison coûte un engagement ; elle protège entièrement du vide, exposition et aspiration comprises. Pas de jauge d'air dans la référence.
- Cadre de la question : une cloison étanche fermée sépare deux pièces de pression différente ; se cacher derrière une caisse ne protège jamais du vide.
- Limite : emplacement, nombre d'exemplaires et retrait éventuel restent à fixer. Aucun malus implicite de mobilité, de bruit ou de manipulation.

### D-061 — Propagation immédiate du vide dans la zone ouverte

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-54 « Immédiate dans toute la zone ouverte ».
- Décision : au pas de la brèche, la pièce percée et tout ce qui communique avec elle par un passage ouvert ou non étanche passent au vide. Ouvrir plus tard un passage entre vide et zone pressurisée étend aussitôt le vide. Se préparer consiste à fermer avant.
- Différence assumée avec le feu : ni délai de deux engagements ni limite d'une pièce par mise à jour ; D-056 reste propre au feu.
- Limite : l'étanchéité de chaque passage est une donnée de contenu. Retour de l'air, réparation et effets sur les objets non décidés.

### D-062 — Créature exposée au vide : neutralisation définitive

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-55 « Neutralisation définitive ».
- Décision : dans la pièce percée, la créature est aspirée et expulsée de la station ; atteinte ailleurs par la propagation, elle reste inerte sur place. Dans les deux cas, plus aucune réaction.
- Rappels : neutraliser n'est pas évacuer (D-018) ; l'état est persistant et unique (C-05) ; cette neutralisation environnementale ne crée pas de duel (D-025).
- Limite : vaut pour cette créature organique ; une entité résistante ou une autre menace aura sa propre règle. Effet du corps inerte sur les passages non décidé.

## Décisions validées — deuxième référence, plan et matériel

### D-063 — Plan d'AR-02 : quatre pièces, capsule prête, créature à l'embarquement

- Date / statut : 2026-10-09 / **Validé comme base**.
- Origine : réponse Q-56 « Oui, ce plan me va ».
- Décision : coursive de départ ; local de sécurité avec combinaison et outil ; salle panoramique avec une grande baie extérieure ; embarquement avec une capsule déjà alimentée, où la créature attend au départ. Au réveil, l'assistance signale une présence non identifiée à l'embarquement. La porte entre salle panoramique et embarquement est grippée : l'ouvrir fait du bruit.
- Approches présentées : percer la baie pendant que la créature est derrière la porte fermée, puis ouvrir pour vider l'embarquement de son air ; ou ouvrir la porte bruyante pour l'attirer dans la salle, puis percer pour l'aspirer. Passer en force reste possible, au risque d'une blessure.
- Limite : pas de problème d'énergie ni de passage de contournement. États exacts des portes, positions, parcours et textes restent à détailler dans AR-02 puis à accepter.

### D-064 — Découpeuse de maintenance pour percer la baie

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-57 « Une découpeuse de maintenance ».
- Décision : la baie se perce avec une découpeuse de maintenance, en une action, avec une réussite sûre ; une étiquette sur l'outil prévient du risque de dépressurisation. Pas d'outil ressemblant à une arme.
- Limite : aucune action d'attaque contre la créature n'est créée (D-025). Effet de l'outil sur d'autres matériaux non défini.

### D-065 — La capsule refait son air quand on la ferme

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-58 « Oui, elle refait son air quand on la ferme ».
- Décision : si l'embarquement perd son air pendant que l'écoutille est ouverte, la capsule reste utilisable et retrouve son air une fois fermée. Les deux façons d'utiliser le vide restent sans risque.
- Limite : les conditions de départ d'AR-01 (D-054) sont reprises par D-058 ; aucun verrou de lancement supplémentaire.

### D-066 — Rustine d'urgence : la baie percée peut être rebouchée

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-59 « Oui, avec une rustine d'urgence ».
- Décision : un objet et une action de plus permettent de reboucher la brèche, puis de refaire l'air. Précise la réparation laissée ouverte par D-061.
- Limite : nombre, emplacement, manière dont l'air revient et possibilité de repercer à préciser. La neutralisation de la créature reste définitive (D-062).

## Décisions validées — deuxième référence, retour de l'air et rustine

### D-067 — L'air revient dès qu'une pièce n'est plus reliée au trou

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-60 « Oui, tout de suite ».
- Décision : seul ce qui est relié à une brèche ouverte, par des passages ouverts ou non étanches, est sans air. Une pièce qui n'y est plus reliée, parce qu'une porte a été refermée ou la baie rebouchée, retrouve son air aussitôt. Refermer une porte derrière soi rend donc l'air à ce qui est derrière.
- Articulation : la capsule fermée (D-065) est un cas de cette règle ; l'extension immédiate de D-061 part toujours d'une zone reliée à une brèche ouverte. La créature neutralisée le reste (D-062).
- Limite : moment exact dans le pas et présentation au joueur proposés dans AR-02, à accepter.

### D-068 — Une seule rustine, près de la baie ; repercer reste possible

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-61 « Oui ».
- Décision : une seule rustine, rangée près de la baie ; reboucher prend une action, sans risque ; la découpeuse peut repercer ensuite. Pas de deuxième rustine.
- Pourquoi : la trouver près de la baie aide à comprendre que celle-ci peut céder.
- Limite : forme du rangement et texte d'indice à préciser dans AR-02.

### D-069 — Rustine facultative pour gagner

- Date / statut : 2026-10-09 / **Validé pour AR-02**.
- Origine : réponse Q-62 « Oui, c'est une option de plus ».
- Décision : aucun parcours gagnant d'AR-02 ne dépend de la rustine ; elle rend l'air à la salle et sera testée comme option.
- Conséquence : aucun verrou de lancement ni retrait forcé de combinaison n'est ajouté pour la rendre nécessaire.

## Décisions validées — acceptation d'AR-02 comme conception

### D-070 — Passage en force conservé dans AR-02

- Date / statut : 2026-10-10 / **Validé pour AR-02**.
- Origine : réponse Q-63 « Garder tel quel ».
- Décision : le parcours en force (8 actions, un D6 de fuite exposée, au pire une blessure) reste possible. C'est un vrai choix, plus court mais risqué, comme dans AR-01.
- Limite : il ne sert pas de témoin des règles du vide. Pas de risque supplémentaire ajouté pour le décourager.

### D-071 — Précisions du vide VP-01 à VP-04 et VP-06

- Date / statut : 2026-10-10 / **Validé pour AR-02**.
- Origine : réponse Q-64, cinq précisions cochées sur six.
- Décision : quand l'air part, la créature n'a pas le temps de réagir (VP-01) ; avant d'agir, le jeu indique les pièces connues qui perdent ou retrouvent l'air et « mortel » sans combinaison, sans révéler la créature (VP-02) ; l'état d'air des pièces connues est public par les voyants des portes et l'assistance (VP-03) ; le vide ne déplace pas les objets, le corps inerte ne bloque pas le passage (VP-04) ; pas de règle de son propre au vide dans AR-02 (VP-06).
- Non retenu : VP-05, interdiction de retirer la combinaison, remplacée par D-072.

### D-072 — La combinaison peut être retirée partout

- Date / statut : 2026-10-10 / **Validé pour AR-02**.
- Origine : réponse Q-66 « Oui, partout, avec l'avertissement habituel ».
- Décision : retirer la combinaison coûte une action et reste possible partout ; dans une pièce sans air, l'option est annoncée mortelle comme les autres expositions (D-059).
- Limite : aucun parcours gagnant n'en a besoin.

### D-073 — Combinaison retirée gardée sur soi

- Date / statut : 2026-10-10 / **Validé pour AR-02**.
- Origine : réponse Q-67 « On la garde sur soi et on peut la remettre (une action) ».
- Décision : la combinaison retirée reste avec le passager ; la remettre coûte une action. Pas d'objet perdu ni de manipulation supplémentaire.

### D-074 — AR-02 v1.0 acceptée comme référence de conception

- Date / statut : 2026-10-10 / **Conception validée, exécution non vérifiée**.
- Origine : réponse Q-65 « Oui, on valide », avec Q-63/Q-64/Q-66/Q-67.
- Décision : accepter les pièces, passages, objets, connaissances de départ et précisions d'AR-02, ainsi que les parcours P-V1/P-V2/P-V3 (12/12/8 engagements) comme attentes à prouver par le futur moteur.
- Organisation : les règles du vide sont retranscrites dans C-03, C-04 et C-05 ; AR-02 reste la référence des données fixes et des parcours. Cette extraction ne crée pas de nouvelle règle.
- Réserves : textes, durée, intérêt, découvrabilité et implémentation non validés. Aucune partie humaine ni référence exécutée ne doit être cochée par un agent.
- Limite : une contradiction trouvée par implémentation ou revue revient en arbitrage, sans mutation de scénario ni affaiblissement de test.

## Décisions validées — monde, carte et connaissances

### D-075 — La carte montre seulement ce qu'on a visité

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-68 « Seulement ce qu'on a visité ».
- Décision : pas de plan d'évacuation complet au départ ; la carte se dessine au fil de l'exploration.
- Limite : signalétique des portes, sorties vues mais non franchies et rôle de l'assistance à préciser dans C-06. Les noms connus par la signalétique (AR-01 §11.4) ne dessinent pas une pièce sur la carte.

### D-076 — Hors de vue, la carte garde le dernier état vu

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-69 « Non : ce qu'on y a vu en dernier ».
- Décision : une pièce où le passager n'est pas affiche ce qu'il y a vu en dernier, pas son état réel. Les voyants des portes et l'assistance complètent pour l'air et les systèmes (D-046, D-071).
- Limite : la liste exacte des systèmes renseignés à distance est à préciser dans C-06.

### D-077 — Bruits vagues de la créature par les portes ouvertes

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-70 « Oui, des bruits vagues par les portes ouvertes ».
- Décision : quand la créature bouge dans une pièce voisine reliée par une porte ouverte, le passager entend un bruit situé par le passage (« derrière la porte de l'observation »), sans sa position exacte.
- Limite : rien au-delà de la pièce voisine ; une créature immobile ou neutralisée ne fait pas ce bruit. Le cas d'une grille fermée, qui laisse passer le son dans AR-01, est à confirmer dans C-06.

### D-078 — Les règles lisent les qualités des objets, pas leur nom

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-71 « Oui : le jeu regarde les qualités, pas le nom ».
- Décision : un objet qui possède la qualité requise (appui stable, liquide glissant, moyen d'extinction adapté…) produit le même effet qu'un autre ; chaque qualité est déclarée dans les données de l'objet.
- Limite : seules les qualités et effets déjà acceptés existent ; une nouvelle qualité, ou une combinaison non arbitrée comme l'inflammabilité, demande une décision.

### D-079 — Pas de limite de port, sauf un seul objet encombrant

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-72 « Pas de limite, sauf un seul objet encombrant à la fois ».
- Décision : les petits objets se portent sans limite ; un objet encombrant, comme le bloc d'énergie, se porte un seul à la fois. Étend D-051 au-delà d'AR-01.
- Limite : « encombrant » est une qualité déclarée ; le gabarit des passages étroits (D-043) reste une contrainte distincte. Pas de poids ni de cases.

## Décisions validées — acceptation de C-02 et C-06

### D-080 — Petites règles du monde et de la carte

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-73, sept règles cochées sur huit.
- Décision : changer de place dans une pièce ne coûte pas d'action à part (MP-01) ; on pose un objet porté n'importe où en une action (MP-02) ; ramasser un deuxième objet encombrant est refusé sans échange automatique (MP-03) ; on entend aussi à travers une grille fermée, comme la créature (OP-01) ; une porte normale indique le nom de sa pièce, qui n'apparaît sur la carte qu'une fois visitée (OP-03) ; l'air lu sur les voyants reste à jour sur la carte (OP-04) ; la carte marque où la créature a été vue en dernier et depuis combien d'actions (OP-05).
- Non retenu : OP-02, informations de l'assistance à distance, remplacé par D-081.
- Amendement : « depuis combien d'actions » d'OP-05 est remplacé par une ancienneté en mots (D-141).

### D-081 — L'assistance parle seulement aux moments prévus

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-75 « Moins : seulement ses messages prévus ».
- Décision : l'assistance ne répond à aucune demande d'état. Elle parle aux moments prévus, avec d'éventuels choix prédéfinis (D-034) ; ses messages restent relisibles et exacts sur les systèmes (D-046).
- Remplace : la mention de l'assistance comme source d'état d'air à la demande dans D-071 (VP-03) et D-076. L'air à distance se lit sur les voyants des portes étanches.
- Limite : contenu et moments des messages restent à écrire par aventure.

### D-082 — C-02 et C-06 v1.0 acceptés

- Date / statut : 2026-10-10 / **Contrats validés, implémentation absente**.
- Origine : réponse Q-74 « Oui, on valide », avec Q-73/Q-75.
- Décision : [C-02](contrats/C-02-monde-entites.md) et [C-06](contrats/C-06-observation-connaissances.md) deviennent des contrats acceptés, avec MP-01 à MP-03, OP-01, OP-03 à OP-05 et la règle d'assistance de D-081.
- Limite : format des données, forme visuelle de la carte et textes relèvent de l'architecture, de la maquette et de C-07. Aucun test ni implémentation n'est revendiqué.

## Décisions validées — scénarios générés et fins

### D-083 — Variation par assemblage de morceaux écrits à la main

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-76 « Assembler des morceaux écrits à la main ».
- Décision : chaque partie du lancement combine et place différemment des morceaux conçus et vérifiés à l'avance — pièces, obstacles, solutions. La génération libre de plans et d'objets est écartée pour le lancement.
- Limite : nombre de morceaux, règles d'assemblage et variations observables restent à fixer. Les morceaux n'utilisent que les lieux, liaisons, qualités et règles acceptés (C-02 à C-06).

### D-084 — Toujours un chemin sûr au départ

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-77 « Toujours un chemin sûr si l'on prépare bien ».
- Décision : toute station assemblée est vérifiée avant d'être jouée ; elle offre au moins un chemin d'évacuation sans dé ni blessure si l'on prépare bien. Étend D-050 à tout le lancement.
- Limite : aucune garantie après les choix du joueur ; découvrabilité à mesurer sur téléphone.

### D-085 — Plus aucune sortie possible : le jeu le signale, la partie continue

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-78 « Le jeu le signale mais laisse continuer ».
- Décision : après chaque action, le jeu vérifie s'il reste une évacuation possible ; sinon, il le dit. Le joueur peut continuer à errer et abandonner quand il veut.
- Conséquence assumée : le signal est calculé sur l'état réel ; son absence indique qu'une sortie existe encore, éventuellement cachée. Il ne nomme jamais cette sortie.
- Limite : abandonner reste possible à tout moment. Méthode de vérification et texte du signal relèvent de l'architecture et de C-07 ; le signal ne doit jamais être faux.

### D-086 — Fin de partie : le récit seulement

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-79 « Rien de plus que le récit ».
- Décision : pas de score ni de bilan chiffré ; le texte de fin raconte ce qui s'est réellement passé (AR-01 §14.1).
- Limite : le récit ne contient aucun fait non appliqué (C-05).

### D-087 — Rejouer la même station depuis le début

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-80 « Oui, on peut relancer la même station ».
- Décision : après une fin, on peut relancer une nouvelle partie sur la même station, avec le même état de départ.
- Limite : ce n'est pas un retour en arrière (D-013) ; la partie terminée reste terminée. Traitement des dés à préciser.

## Décisions validées — sauvegarde, export et rapports

### D-088 — Nouveaux tirages en rejouant une station

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-81 « Nouveaux tirages ».
- Décision : relancer la même station (D-087) produit de nouveaux résultats de dés. Connaître les lieux aide ; connaître les dés à l'avance, non.
- Limite : le replay d'une partie existante, lui, rejoue exactement ses tirages enregistrés (C-05 E-08).

### D-089 — Une seule partie en cours

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-82 « Une seule à la fois ».
- Décision : une seule sauvegarde automatique, reprise au dernier geste (D-022). Pas d'emplacements multiples.

### D-090 — Mise à jour : continuer si possible, sinon prévenir

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-83 « Continuer si possible, sinon prévenir ».
- Décision : après une mise à jour, la partie en cours reprend si la nouvelle version le permet ; sinon le jeu le dit et propose une nouvelle partie.
- Limite : le critère de compatibilité relève de l'architecture ; une reprise ne doit jamais produire un état incohérent ou un nouveau tirage pour une action passée.

### D-091 — Enregistrement impossible : prévenir et laisser continuer

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-84 « Prévenir et laisser continuer ».
- Décision : si l'enregistrement échoue, le jeu le signale et laisse jouer ; une fermeture ferait alors perdre les dernières actions.
- Limite : ne jamais annoncer « sauvegardé » sans écriture réussie ; l'avertissement reste visible tant que la partie n'est pas enregistrée ; une action déjà résolue n'est pas rejouée avec un nouveau tirage lors d'une nouvelle tentative d'écriture (C-05 §7).

### D-092 — Export d'une partie

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-85 « Oui, un fichier de partie à envoyer ».
- Décision : une partie peut être exportée sous forme d'un fichier qui la rejoue entièrement ; il sert aux rapports de bug et aux validations sur téléphone.

### D-093 — Envoi de partie et bouton « bug » vers des issues GitHub

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse libre à Q-86 : « création automatique d'une issue github avec partie exportée + emplacement pour commentaire joueur. il faut aussi un bouton "bug" qui crée une issue github avec un moyen fiable pour l'agent de reproduire la situation + commentaire ».
- Décision : envoyer sa partie crée une issue GitHub contenant la partie exportée et le commentaire du joueur. Un bouton « bug » crée une issue contenant de quoi reproduire la situation de façon fiable, plus un commentaire.
- Limite : contenu exact et modèle d'issue à préciser dans C-10.

### D-094 — Envoi par un petit service intermédiaire, sur le modèle de la V1

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-88 « Le jeu l'envoie seul via un petit service en ligne », et référence à la V1 (commit 8e7e453) en réponse à Q-87.
- Décision : le jeu envoie le rapport à un service intermédiaire qui crée l'issue avec sa propre clé GitHub, comme le script Google de la V1 (journal dans une feuille, issue avec reproduction). Aucun compte GitHub n'est demandé au joueur.
- Limite : la clé GitHub reste uniquement côté service, jamais dans le jeu. Hébergement et technologie à arbitrer avec l'architecture ; reprise du script V1 possible, pas obligatoire.

### D-095 — Boutons de rapport pour tous les joueurs

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses Q-87 (V1 sans compte) et Q-90 « Tout le monde, même la version publique ».
- Décision : les boutons « bug » et « envoyer ma partie » existent aussi dans la version publique.
- Limite : limites anti-abus requises (nombre de rapports, délai, doublons), comme en V1 ; elles doivent aussi être appliquées côté service, pas seulement dans le jeu.

### D-096 — Case « je valide » dans l'envoi

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-89 « Vous cochez « je valide » avant d'envoyer ».
- Décision : une partie envoyée ne vaut validation d'une aventure que si la case « je valide cette aventure » est cochée ; sinon c'est un simple retour.

### D-097 — Code personnel pour authentifier une validation

- Date / statut : 2026-10-10 / **Remplacé par D-130** (signature par le téléphone).
- Origine : réponse Q-91 « Un code personnel saisi dans le jeu ».
- Décision : la validation n'est reconnue que si le code personnel du porteur du projet, saisi dans le jeu, est vérifié par le service.
- Limite : le code n'est jamais dans le jeu, le dépôt ou une issue ; il est transmis chiffré (HTTPS) dans le corps de la requête, pas dans l'adresse ; le service seul le vérifie. Les agents ne disposent pas du code et ne marquent jamais une validation eux-mêmes.

## Décisions validées — sens d'une validation sur téléphone

### D-098 — Chaque morceau validé au moins une fois

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-92 « Chaque morceau, au moins une fois ».
- Décision : en plus d'AR-01 et AR-02, chaque morceau du contenu de lancement doit avoir été joué et validé au moins une fois sur téléphone, dans une station assemblée.
- Limite : une même partie peut valider plusieurs morceaux qu'elle traverse ; la liste des morceaux couverts est portée par l'issue de validation.

### D-099 — Valider : aller au bout, puis juger

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-93 « Aller au bout, puis votre jugement ».
- Décision : une partie terminée, gagnée ou perdue, peut valider ; c'est le jugement du porteur du projet qui décide si l'aventure tient. Une défaite « juste » peut valider.
- Limite : un abandon n'est pas une partie allée au bout.

### D-100 — Une validation se perd si l'aventure change

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-94 « Perdue si l'aventure change ».
- Décision : modifier l'aventure ou le morceau lui-même (pièces, liaisons, objets, parcours) annule sa validation. Une correction du moteur qui ne change pas les résultats de ses parcours automatiques la conserve.
- Limite : un changement de résultat d'un parcours automatique annule aussi la validation. La détection doit être automatique ; un agent ne décide pas seul qu'une modification est sans effet.

## Décisions validées — acceptation de C-08, C-09 et C-10

### D-101 — Petites règles des stations, de la sauvegarde et des rapports

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-95, neuf règles cochées sur dix.
- Décision : GP-01/GP-02 (composition d'une station), GP-03 (premiers morceaux tirés d'AR-01/AR-02, vide séparé du feu, de l'huile et du bloc), GP-04 (jamais de créature dans la pièce de départ), GP-05 (vérification par les vraies règles, sans remplacer les parties humaines), SP-01/SP-02 (contenu de la sauvegarde, action jamais appliquée deux fois), SP-04/SP-05 (export anonyme et sans effet sur la partie), RP-01/RP-02 (contenu des issues), RP-03 (anti-abus côté service, rapport gardé pour réessayer), RP-04/RP-05 (étiquette de validation posée par le service seul, journal limité à ces issues).
- Non retenu : SP-03, export proposé avant d'abandonner une partie incompatible ; reste à discuter.

### D-102 — C-08, C-09 et C-10 v1.0 acceptés

- Date / statut : 2026-10-10 / **Contrats validés, implémentation absente**.
- Origine : réponse Q-96 « Oui, on valide », avec Q-95.
- Décision : [C-08](contrats/C-08-stations-fins.md), [C-09](contrats/C-09-sauvegarde-replay.md) et [C-10](contrats/C-10-preuves-gouvernance.md) deviennent des contrats acceptés, avec les règles de D-101.
- Réserves : SP-03 ouvert ; gouvernance du dépôt (C-10 §6) arbitrée séparément. Aucun test, service ni implémentation n'est revendiqué.

## Décisions validées — gouvernance du dépôt

### D-103 — Partie incompatible : message et nouvelle partie, rien de plus

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-97 « Rien de plus ».
- Décision : quand une mise à jour empêche de continuer, le jeu affiche le message et propose une nouvelle partie (D-090) ; l'ancienne partie est perdue. Ni export proposé ni rapport automatique. Clôt SP-03.

### D-104 — Tests et documentation restent en zone verte

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-98 « Vert si c'est dans les tests ou la doc ».
- Décision : conformément à la demande initiale, les modifications de tests, outils, solveur et documentation sont en zone verte, y compris quand elles changent un test, un seuil ou un contrat. La proposition D-012 n'est pas retenue.
- Garde-fou restant : la relecture indépendante de D-105 avant toute fusion automatique.

### D-105 — Fusion verte par l'orchestrateur après relecture indépendante

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-99 « L'orchestrateur, après une relecture indépendante ».
- Décision : en zone verte, l'orchestrateur fusionne après vérifications vertes et relecture par un agent relecteur différent de celui qui a codé.
- Limite : orange et rouge restent soumis à l'accord ou au test manuel du porteur du projet (04 §5).

### D-106 — Branche principale non protégée

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-100 « Non ».
- Décision : pas de protection technique de la branche principale dans le nouveau dépôt.
- Limite : la règle de travail reste qu'un exécutant délégué ne pousse pas et que l'orchestrateur fusionne après vérification (04 §1, D-105) ; elle n'est pas imposée techniquement.

### D-107 — Moteur de jeu en zone orange au début

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-101 « Orange : votre accord ».
- Décision : tant que le moteur est jeune, chaque modification du moteur attend l'accord du porteur du projet sur preuves.
- Limite : le moment où le moteur passe en zone verte demandera une décision explicite.

### D-108 — Deux rôles distincts pour le contenu et les outils

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-102 « Deux rôles séparés ».
- Décision : un rôle d'auteur de contenu (morceaux de stations, textes, messages de l'assistance) et un rôle d'auteur d'outils (vérificateur, bots, export, scripts de CI) remplacent le rôle ambigu `script-writer`.
- Limite : noms exacts des profils à fixer lors de leur configuration.

## Décisions validées — textes du jeu

### D-109 — Français seulement au lancement

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-103 « Français seulement ».
- Décision : un seul texte, en français, à écrire et relire pour le lancement.
- Limite : une autre langue pourra venir plus tard par une nouvelle décision ; aucune obligation de la préparer maintenant.

### D-110 — Le texte vouvoie le joueur

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-104 « Vous ».
- Décision : le texte s'adresse au joueur à la deuxième personne du pluriel (« Vous ouvrez la grille »), comme les brouillons des aventures.

### D-111 — Textes courts après une action

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-105 « Court : 2 à 4 phrases par action ».
- Décision : deux à quatre phrases après une action, lisibles d'un coup d'œil sur téléphone ; plus long seulement aux moments forts (réveil, premier contact, fin).

### D-112 — Phrases écrites à la main, avec des trous

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-106 « Phrases écrites à la main, avec des trous ».
- Décision : chaque situation a ses phrases rédigées ; le moteur ne remplit que des trous (nom d'objet, de pièce). Pas de phrases composées par le moteur.
- Pourquoi : leçon de la V1, dont le texte de liaison assemblé par le moteur était mauvais.

### D-113 — Quelques variantes de phrases, sans effet sur le jeu

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-107 « Quelques variantes ».
- Décision : une même situation peut avoir plusieurs formulations pour éviter la répétition ; le choix n'influence jamais les dés ni le jeu.

### D-114 — Le résultat du dé n'est pas affiché

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-108 « Non, seulement ce qui arrive ».
- Décision : le texte dit ce qui arrive, sans chiffre de dé. Le niveau de risque qualitatif reste annoncé avant l'action (D-020).
- Limite : le tirage reste enregistré dans la sauvegarde et l'export (C-09) ; seul l'affichage est concerné.

## Décisions validées — acceptation de C-07

### D-115 — Petites règles des textes

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-109, cinq règles cochées sur six.
- Décision : un événement visible, une phrase, avec contrôle automatique (NP-01) ; trous remplis de noms affichables et accordés (NP-02) ; variantes reproductibles, sans dés (NP-03) ; un nom par chose partout (NP-04) ; aucune affirmation non perçue par le passager (NP-05).
- Non retenu : NP-06, accord du porteur du projet sur chaque texte, remplacé par D-116.

### D-116 — Les textes passent en zone verte

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse libre à Q-109 « je laisse les agents développer en autonomie », précisée par Q-111 « Seulement les textes ».
- Décision : les agents écrivent les textes en autonomie ; ils sont fusionnés en zone verte, par l'orchestrateur après relecture indépendante (D-105). Remplace la place des textes en zone orange (04 §5).
- Limite : interface, équilibrage, format des scénarios et moteur restent en zone orange. Les validations sur téléphone restent celles du porteur du projet.

### D-117 — C-07 v1.0 accepté

- Date / statut : 2026-10-10 / **Contrat validé, implémentation absente**.
- Origine : réponse Q-110 « Oui, on valide », avec Q-109/Q-111.
- Décision : [C-07](contrats/C-07-textes.md) devient un contrat accepté, avec NP-01 à NP-05 et D-116. Tous les contrats C-01 à C-10 sont désormais acceptés.
- Limite : textes définitifs, nom de la station et titre public restent à écrire. Aucune implémentation revendiquée.

## Décisions validées — volume du lancement

### D-118 — Environ huit morceaux au lancement

- Date / statut : 2026-10-10 / **Validé, volume remplacé par D-157** (dix morceaux).
- Origine : réponse Q-112 « Petit : environ 8 morceaux ».
- Décision : le contenu de lancement compte environ huit morceaux, de quoi faire une dizaine de stations vraiment différentes ; d'autres pourront être ajoutés après.
- Limite : chaque morceau doit être validé sur téléphone au moins une fois (D-098).

### D-119 — Deux ou trois obstacles par station

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-113 « 2 ou 3 obstacles ».
- Décision : une station assemblée comporte deux ou trois obstacles, pour viser 15 à 30 minutes (D-008).
- Limite : la durée réelle se mesure sur téléphone.

### D-120 — Une seule espèce de créature au lancement

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-114 « Toujours la même créature sensible au bruit ».
- Décision : la menace du lancement est toujours la créature organique sensible au bruit d'AR-01/AR-02 ; sa place et les pièces changent selon la station. Ses règles (C-03, C-04) s'appliquent telles quelles.

### D-121 — Le problème à régler pour partir varie selon les morceaux

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-115 « Varié, selon les morceaux ».
- Décision : selon les morceaux tirés, le départ peut demander de rétablir l'énergie, d'ouvrir un accès ou d'écarter la créature. L'évacuation reste l'objectif commun (D-018).

## Décisions validées — architecture et outillage

### D-122 — La V2 se développe dans le dépôt existant

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-116 « Ici, dans ce dépôt ».
- Décision : le code de la V2 vit dans le dépôt GitHub `greffeb/void_walker`, où se trouve déjà ce kit ; le kit en devient la documentation. L'historique de la V1 reste consultable.
- Remplace : la partie « nouveau dépôt » de D-002. La méthode issue/preuves de D-002 reste valable.

### D-123 — Les agents proposent la pile technique, le porteur du projet choisit

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-117 « Les agents proposent, vous validez ».
- Décision : la pile technique du jeu fait l'objet d'une proposition comparée par les agents, puis d'un choix explicite du porteur du projet.
- Limite : les contraintes acceptées s'imposent à la proposition : PWA mobile, hors LLM, moteur partagé par l'appli, la CLI et les bots (C-01), replay exact (C-09), hébergement GitHub Pages (D-124).

### D-124 — Jeu hébergé sur GitHub Pages

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-118 « GitHub Pages, comme la V1 ».
- Décision : la PWA est publiée sur GitHub Pages depuis le dépôt, comme la V1.

### D-125 — Service de rapports déployable par les agents en autonomie

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse libre à Q-119 : « il faut que les agents puissent le déployer en autonomie (mises a jour) ».
- Décision : le service intermédiaire de D-094 doit pouvoir être mis à jour et redéployé par les agents sans intervention du porteur du projet.
- Tension à arbitrer : un agent qui modifie librement le service pourrait aussi lui faire accepter une fausse validation (D-097). La protection des validations est à décider.

### D-126 — Copilot seulement

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse libre à Q-120 : « que copilot ».
- Décision : GitHub Copilot assure tous les rôles d'agent ; Claude Code n'est plus prévu comme orchestrateur. Remplace la répartition Claude Code / Copilot CLI de 04 §3.
- Limite : la relecture indépendante de D-105 reste exigée, par une autre session Copilot au profil de relecteur, sans le contexte de celle qui a codé. Forme exacte de Copilot (GitHub, CLI, éditeur) à préciser.

### D-127 — Les agents déploient eux-mêmes le service de rapports

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-122 « Les agents le déploient eux-mêmes », et réponse libre à Q-121 : les agents mettent à jour le service en même temps qu'une nouvelle fonctionnalité du jeu qui a besoin de remonter des informations par les issues.
- Décision : une évolution du jeu qui change les rapports met à jour le service dans le même travail ; les agents disposent des accès de déploiement du service.
- Limite : la clé GitHub du service se limite à la création d'issues sur ce dépôt.

### D-128 — Copilot dans l'éditeur ou le terminal, sur le PC du porteur du projet

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-123 « Copilot dans l'éditeur ou le terminal, sur votre PC ».
- Décision : les agents Copilot travaillent sur la machine du porteur du projet (éditeur ou terminal), pas comme agent autonome dans le cloud GitHub.

## Décisions validées — validation par demande de fusion

### D-129 — Une fonctionnalité à valider passe par sa PR

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse libre à Q-124 : l'agent ouvre une PR, y montre les preuves (captures d'écran, extraits de texte) et indique que la fonctionnalité demande une validation humaine ; le porteur du projet joue sur téléphone puis donne ses retours, avec un fichier de partie venant du téléphone pour la reproductibilité.
- Décision : une fonctionnalité qui demande une validation humaine est présentée dans sa PR avec ses preuves et la mention « validation humaine requise ». Le porteur du projet la joue sur téléphone ; ses retours, avec le fichier de la partie, viennent du téléphone.
- Limite : les preuves d'agent (captures, extraits) restent du niveau « vérifié automatiquement » ; seule la validation signée du téléphone vaut validation (C-10).

### D-130 — Validation signée par le téléphone

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse libre à Q-124 « option 1 ou 2, le plus simple à l'usage pour moi » ; la signature ne demande rien à taper.
- Décision : le jeu crée une fois, sur le téléphone du porteur du projet, une clé qui ne quitte jamais l'appareil ; chaque « je valide » est signé avec elle. Le dépôt conserve la partie publique de la clé et la vérification se fait automatiquement. Remplace le code personnel de D-097.
- Pourquoi : les agents peuvent modifier et déployer le service (D-127) sans pouvoir fabriquer une validation ni lire un secret de validation.
- Limite : changer la clé publique (nouveau téléphone, données effacées) est fait par le porteur du projet ; tout changement de ce fichier est signalé par la CI.

### D-131 — Une version de test par PR

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-125 « Oui, une adresse de test par PR ».
- Décision : chaque PR est publiée à une adresse de test distincte, dont le lien est posté dans la PR ; elle est supprimée après fusion ou fermeture. La version publique ne change pas.

### D-132 — Les retours d'une version de test arrivent dans sa PR

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-126 « En commentaire de la PR testée ».
- Décision : depuis une version de test, l'envoi de partie et le bouton « bug » publient un commentaire sur la PR correspondante : fichier de partie, commentaire et, le cas échéant, validation signée.
- Limite : depuis la version publique, les rapports créent toujours des issues (D-093/D-095).

## Décisions validées — pile technique

### D-133 — Interface en React

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-127 « React », sur proposition comparée (D-123).
- Décision : l'écran du jeu est construit avec React ; le reste de la pile commune proposée est TypeScript, Vite et PWA sur GitHub Pages, avec un moteur séparé de l'écran.
- Limite : le code de la V1 n'est pas repris pour autant ; seul ce qui sert les contrats peut être migré (D-011, proposé).

### D-134 — Service de rapports sur Cloudflare Workers

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-128 « Cloudflare Workers ».
- Décision : le service intermédiaire (D-094) tourne sur Cloudflare Workers, déployé par les agents (D-127) ; la clé GitHub y est stockée en secret non relisible.
- Limite : un compte Cloudflare est à créer par le porteur du projet. Le script Google de la V1 n'est pas repris.

### D-135 — Captures automatiques dans les PR

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-129 « Oui, captures automatiques ».
- Décision : un robot joue les parcours sur un écran de téléphone simulé et joint captures et texte affiché à la PR.
- Limite : ces captures sont des preuves du niveau « vérifié automatiquement », jamais une validation humaine.

### D-136 — Architecture v1.0 acceptée

- Date / statut : 2026-10-10 / **Validé, implémentation absente**.
- Origine : réponses Q-130, dix points cochés sur dix, et Q-131 « Oui, on valide ».
- Décision : [l'architecture](10-architecture.md) devient la référence du Bootstrap, avec AP-01 à AP-10 : moteur isolé et règles d'import vérifiées ; générateur de dés propre à la partie ; sauvegarde IndexedDB par action ; clé de signature non exportable ; publication principale et `/pr-<numéro>/` ; service sécurisé et limité ; reconnaissance des validations par une action GitHub ; commande unique de vérification ; captures automatiques ; CI par PR et publication sur la branche principale.
- Limite : les bibliothèques secondaires restent au choix des agents dans ces règles. Le changement du mode de publication GitHub Pages et la création du compte Cloudflare sont à faire au Bootstrap.

## Décisions validées — démarrage

### D-137 — Quatre agents Copilot au départ

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-132 « Le minimum : 4 agents ».
- Décision : orchestrateur, exécutant, relecteur et playtester sont installés comme profils Copilot du dépôt (`.github/agents/`). Les autres rôles de 04 §3 seront ajoutés quand une issue en aura besoin.

### D-138 — Issue de démarrage créée directement sur GitHub

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-133 « La créer tout de suite sur GitHub ».
- Décision : le texte de l'issue de Bootstrap est conservé dans le kit et publié immédiatement comme issue du dépôt.
- Limite : publier l'issue n'autorise pas son exécution sans lancement explicite par le porteur du projet.

### D-139 — La V1 en ligne peut disparaître au Bootstrap

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse du porteur du projet « ok pour virer l'ancienne version en ligne », à la question sur le changement du mode de publication GitHub Pages.
- Décision : le Bootstrap (#89) peut changer le mode de publication GitHub Pages même si la V1 publiée cesse d'être accessible ; après fusion, le monde de test V2 la remplace à la racine (AP-05).
- Limite : l'historique Git de la V1 reste consultable (D-122).

## Décisions validées — interface

### D-140 — Maquette d'interface v1 et direction « Phosphore »

- Date / statut : 2026-10-10 / **Validé, implémentation absente**.
- Origine : revue écran par écran de la maquette (choix cités en [12 §8](12-interface-ecrans.md)), puis « design a bien travaillé » et demande de consigner ces choix.
- Décision : [la description des écrans](12-interface-ecrans.md) et sa [maquette PDF](maquette/maquette-ui-v1.pdf) deviennent la référence de l'interface. Les éléments marqués [Validé] et les choix du tableau 12 §8 font autorité : direction « Phosphore » (terminal ambre, IBM Plex Mono), accueil à trois boutons, réveil texte seul, IA Station en modale, santé affichée seulement si le personnage n'est pas indemne, composition en bulle par-dessus l'écran, aperçu puis confirmation pour toute action engageante, déplacements compris, coûts « bruyant », « long », « périlleux », ancienneté d'un état vu en mots, personnage masculin.
- Limite : les éléments [Proposé] restent ajustables par l'agent d'interface s'il garde l'intention. Le sens mécanique de « long » et « périlleux » reste à décider : ces étiquettes ne s'affichent pas avant (remplacé par D-150 : supprimées). Les seuils entre « à l'instant », « il y a un moment » et « il y a longtemps » restent à fixer (fixés par D-151). L'interface est en zone orange (C-10 §6).

### D-141 — Dernière position vue de la créature en mots

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse en revue de maquette « on va essayer de garder du texte ».
- Décision : sur la carte, le dernier endroit où la créature a été vue est indiqué en mots, avec l'échelle des états vus (« vue ici à l'instant », « il y a un moment », « il y a longtemps »), sans nombre d'actions. Remplace la seconde moitié d'OP-05 accepté par D-080 ; un bruit n'ajoute toujours aucun marqueur.

### D-142 — Rapports : dans les options, partout, avec commentaire

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses « Partout, y compris la version publique », « Oui, dans les options », « Oui, champ de commentaire facultatif ».
- Décision : « Signaler un bug » et « Envoyer ma partie » sont rangés dans les options, accessibles depuis l'accueil et le jeu, dans toutes les versions (confirme D-095). Un commentaire écrit facultatif peut accompagner un rapport.
- Limite : ce champ ne commande jamais le personnage (D-006 inchangée). L'idée d'un envoi réservé au débogage est écartée.

### D-143 — Blessure localisée seulement dans le récit

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Seulement dans le récit, l'encadré dit juste BLESSÉ ».
- Décision : l'encadré « ce qui change » et le badge disent seulement l'état (blessé, critique). Une précision comme « l'épaule » n'apparaît que dans le récit et n'a aucun effet de jeu (C-04).

### D-144 — Rappel discret quand plus aucune sortie n'est possible

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Oui, rappel discret ».
- Décision : après « Continuer à jouer », un rappel discret « plus aucune sortie possible » reste en tête du récit jusqu'à la fin de la partie (D-085 : il ne nomme aucune sortie).

### D-145 — Confirmer avant de remplacer une partie en cours

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Oui, elle remplace l'ancienne après confirmation ».
- Décision : « Nouvelle partie » alors qu'une partie est en cours demande une confirmation ; la nouvelle partie remplace alors l'ancienne, qui est perdue (D-089).

### D-146 — Des bulles ancrées partout

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Bulles ancrées sur l'élément touché, partout ».
- Décision : fiches d'objet, choix d'action et aperçus, déplacement compris, s'ouvrent dans une bulle ancrée sur l'élément touché. Le panneau bas de la maquette est abandonné.

### D-147 — Un passage sans signalétique rejoint « Se déplacer vers » une fois ouvert

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Oui, une fois ouverte seulement », à propos de la grille haute.
- Décision : un passage comme la grille haute apparaît dans « Se déplacer vers » quand il est ouvert ; avant, il n'est qu'un objet de la pièce. Sa destination n'est pas affichée tant qu'elle n'est pas découverte (OP-03).
- Modification partielle : une fois ouvert, il reste dans « Se déplacer vers », même refermé (D-229).

### D-148 — Ambiance sonore et voix d'IA Station au lancement

- Date / statut : 2026-10-10 / **Validé, contenu à produire**.
- Origine : réponse « Ambiance et voix d'IA Station ».
- Décision : le lancement comporte une ambiance sonore et une voix pour les messages d'IA Station, chacune réglable dans les options.
- Limite : tout reste lisible sans le son ; la voix dit exactement le texte écrit. La façon de produire la voix (enregistrement ou synthèse), les sons précis et leurs licences restent à décider. Aucun LLM (D-004).
- Remplacement partiel : pas de voix, un effet sonore à l'arrivée d'un message (D-155).

### D-149 — Pas d'import de partie au lancement

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Non, pas au lancement ».
- Décision : la gestion des sauvegardes se limite au téléchargement de la partie (C-09 §5). Réimporter une partie téléchargée n'est pas proposé au lancement.

### D-150 — Un seul coût affiché : « bruyant »

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses « Supprimer l'étiquette [long] » et « Supprimer l'étiquette, le niveau de risque suffit ».
- Décision : les étiquettes « long » et « périlleux » sont supprimées de l'aperçu. Le coût affiché est « bruyant » ou « aucun » ; le danger passe par le niveau de risque. Remplace sur ce point D-140.

### D-151 — Seuils de l'ancienneté d'un état vu

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « À l'instant : 1 action ; un moment : 2 à 5 ; longtemps : 6 et plus ».
- Décision : compté en actions confirmées depuis la dernière vue, « à l'instant » vaut 1 action au plus, « il y a un moment » 2 à 5, « il y a longtemps » 6 et plus. Valable pour les états de pièce et pour la créature (D-141).

### D-152 — Voix d'IA Station par la synthèse vocale du téléphone

- Date / statut : 2026-10-10 / **Remplacé par D-155**.
- Origine : réponse « Synthèse vocale du téléphone, en direct ».
- Décision : les messages d'IA Station sont lus par la synthèse vocale française du téléphone, mot pour mot. Pas de fichiers de voix.
- Limite : la voix dépend de l'appareil ; sans voix française disponible, le message reste en texte seul, sans erreur. Précise D-148.

### D-153 — Bruitages libres de droits et bande-son fournie

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « sons libres de droit pour les bip boop clic clac + soundtrack fournie ».
- Décision : les bruitages d'interface et d'ambiance (bips, clics) sont des sons libres de droits dont la source et la licence sont notées dans le dépôt. La bande-son est fournie par le porteur du projet.
- Limite : un agent n'ajoute pas de musique de lui-même. Précise D-148.

### D-154 — Inventaire dans une bulle

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse « Bouton INVENTAIRE : une bulle liste les objets portés, toucher un objet ouvre ses actions ».
- Décision : le bouton INVENTAIRE ouvre une bulle (D-146) qui liste les objets portés, l'objet encombrant signalé ; toucher un objet ouvre la même composition d'action que dans la pièce. Ouvrir l'inventaire est gratuit (D-014).

### D-155 — IA Station sans voix : un effet sonore

- Date / statut : 2026-10-10 / **Validé**.
- Origine : « changement de plan pour l'IA, pas de synthèse vocale. juste un effet sonore ».
- Décision : un message d'IA Station n'est pas lu à voix haute ; son arrivée est signalée par un effet sonore, choisi parmi les bruitages libres de droits (D-153). Remplace D-152 et la partie « voix » de D-148.
- Limite : le message reste un texte ; le lien dans le récit et la pastille signalent aussi son arrivée sans le son.

## Décisions validées — assemblage et morceaux du lancement

### D-156 — De nouveaux morceaux peuvent apporter de nouvelles règles

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-134 « Imaginer plus, quitte à ajouter des règles ».
- Décision : en plus des six morceaux tirés d'AR-01/AR-02 (galerie en feu, grille haute et caisse, local énergie, salle d'observation, panneau et passage caché, salle panoramique et baie), le lancement accueille des morceaux nouveaux qui ajoutent leurs propres règles.
- Limite : chaque nouvelle règle est arbitrée explicitement avant implémentation (D-163 à D-166) ; aucune ne s'invente au codage.

### D-157 — Dix morceaux au lancement

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-140 « 6 anciens + 3 ou 4 nouveaux », puis choix de quatre nouveaux (Q-139).
- Décision : six morceaux tirés des aventures de référence et quatre nouveaux, soit dix. Remplace le volume « environ huit » de D-118 ; le reste de D-118 (validation de chaque morceau, D-098) s'applique.

### D-158 — Quatre nouveaux morceaux

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-139, quatre idées cochées.
- Décision : salle des machines bruyante, passerelle effondrée, zone sans gravité, chambre froide. Leurs règles sont fixées par D-163 à D-166.
- Non retenus : cuisine (lancer un objet), coursive obscure, monte-charge.

### D-159 — Un seul problème final par station

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-135 « Un seul problème final par station ».
- Décision : une station a un seul problème à régler juste avant de partir (énergie, créature devant la capsule, accès…) ; les autres obstacles sont sur le chemin. Précise D-121.

### D-160 — Obstacles en chaîne et en ordre libre

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-136 « Mélange : en chaîne et en ordre libre ».
- Décision : dans une station, certains obstacles se franchissent l'un après l'autre, d'autres se préparent dans l'ordre que le joueur veut, comme l'énergie et l'accès d'AR-01.

### D-161 — Place de départ de la créature prévue par les morceaux

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-137 « Tirée parmi les places prévues par les morceaux ».
- Décision : chaque morceau déclare les endroits où la créature peut attendre ; l'assemblage en tire un seul, jamais dans la pièce de départ (GP-04).

### D-162 — Les stations se tirent au pur hasard

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-138 « Pur hasard ».
- Décision : une nouvelle partie peut retomber sur une station déjà jouée, même deux fois de suite. Le choix délibéré « rejouer cette station » reste disponible (D-087).
- Modifiée par D-253 : le problème final se tire d'abord à pile ou face, puis la station au pur hasard parmi celles qui ont ce final ; une station déjà jouée peut toujours revenir.

### D-163 — Salle des machines bruyante

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses Q-141 « Le vacarme couvre tout, dans les deux sens » et Q-142 « Arrêter et relancer ; relancer attire ».
- Décision : machines en marche, aucun bruit fait dans la salle n'en sort, et le passager qui s'y trouve n'entend pas la créature bouger dans les pièces voisines ; la vue reste normale si elle entre. Arrêter ou relancer les machines coûte une action chacun ; arrêtées, la salle est ordinaire ; les relancer produit un grand bruit qui attire la créature, comme le test de l'avertisseur.
- Limite : intensité et durée du bruit de relance à fixer avec le morceau, sans en faire une diversion garantie (C-03 §5.1).

### D-164 — Passerelle effondrée

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses Q-143 « La planche cède, elle tombe » et Q-144 « Oui, on peut la retirer derrière soi ».
- Décision : une planche ou une échelle posée sur le vide permet au passager de traverser. Si la créature s'y engage, la planche cède : la créature tombe et est neutralisée pour de bon, et la planche est perdue, coupant de nouveau le passage. Le passager peut retirer la planche derrière lui en une action.
- Limite : neutraliser n'est pas évacuer (D-018) ; une planche brisée peut retirer une voie au joueur, sans garantie de retour (D-084/D-085).

### D-165 — Zone sans gravité

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses Q-145 « Traverser prend deux actions », Q-146 « Elle traverse très lentement » et Q-147 « Oui, on peut la couper et la rétablir ».
- Décision : sans gravité, traverser la zone coûte deux actions au passager ; la créature y dérive et met deux réactions de plus pour la traverser. Un interrupteur coupe ou rétablit la gravité, en une action.
- Limite : besoin éventuel d'énergie pour l'interrupteur et cohabitation avec le vide à décider.

### D-166 — Chambre froide

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponses Q-148 « Enfermée une fois, ralentie pour de bon » et Q-149 « Y rester trop longtemps blesse ».
- Décision : si la créature entre dans la chambre froide et que la porte se referme derrière elle, elle est ralentie pour toute la partie : elle n'agit plus qu'une réaction sur deux. Le passager qui y reste plus de deux actions de suite subit une blessure.
- Limite : cohabitation avec l'huile et les autres ralentissements à décider ; la blessure suit le plafond d'une aggravation par action (C-04).

### D-167 — Tout mélange de morceaux possible, une fois ses règles décidées

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-150 « Tout mélanger, règles au cas par cas ».
- Décision : des morceaux qui jouent sur la même chose (bruit, ralentissement, neutralisation, air) peuvent se retrouver dans une même station, à condition que leur mélange ait reçu ses règles.
- Limite : tant qu'un mélange n'a pas de règles décidées, l'assemblage le refuse ; GP-03 (vide séparé du feu, de l'huile et du bloc) reste en vigueur jusque-là.

### D-168 — Interrupteurs autonomes

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-151 « Ils marchent toujours ».
- Décision : les interrupteurs des machines et de la gravité ont leur propre alimentation ; ils ne dépendent pas du morceau d'énergie.

### D-169 — Planche dans une pièce voisine, encombrante

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-152 « Dans une pièce voisine, encombrante ».
- Décision : la planche de la passerelle se trouve dans une pièce voisine du vide et doit être rapportée ; elle est encombrante (D-079), donc impossible à porter en même temps que le bloc d'énergie.

### D-170 — Deux façons d'enfermer la créature dans la chambre froide

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-153 « Les deux ».
- Décision : un compresseur bruyant à l'intérieur l'attire et la porte se ferme depuis un pupitre dans la pièce voisine, hors de sa vue ; ou bien le passager se fait suivre, ressort par une autre porte et referme derrière elle.
- Limite : la chambre froide a donc deux portes ; la blessure du passager au-delà de deux actions s'applique (D-166).

### D-171 — Les agents proposent le détail des morceaux

- Date / statut : 2026-10-10 / **Validé**.
- Origine : réponse Q-154 « Les agents proposent, vous validez ».
- Décision : plan, objets, places de la créature, parcours à prouver et règles de mélange des dix morceaux sont proposés par les agents dans un document, relu puis validé par questions, comme AR-01 et AR-02.

## Décisions validées — conception des morceaux

### D-172 — Deux familles de morceaux

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponse Q-155 « Oui, c'est bien ».
- Décision : les morceaux « final » (M-03 Énergie, M-06 Baie) portent le problème à régler juste avant de partir ; les huit autres sont des morceaux « chemin ». Une station enchaîne départ, un ou deux morceaux de chemin, un morceau final et l'embarquement.

### D-173 — Un seul interrupteur dans la salle des machines

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponse Q-156 « Non, un seul interrupteur dans la salle ».
- Décision : l'interrupteur des machines se trouve uniquement dans la salle ; pour attirer la créature en relançant les machines, il faut y être.

### D-174 — Règles de mélange MX-01 à MX-05

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponse Q-157, cinq règles cochées sur cinq.
- Décision : les ralentissements s'additionnent (MX-01) ; le vide éteint un foyer qu'il atteint et le feu ne gagne pas une pièce sans air (MX-02) ; vide et huile n'ont aucun effet l'un sur l'autre (MX-03) ; impossible de verser l'huile tant que la gravité est coupée (MX-04) ; l'huile reste glissante dans la chambre froide, sans effet de plus (MX-05).
- Conséquence : GP-03 est levé pour le feu et l'huile ; vide et bloc ne se rencontrent jamais, M-03 et M-06 étant tous deux des morceaux finals.

### D-175 — Conception des dix morceaux v1.0 acceptée

- Date / statut : 2026-10-11 / **Conception validée, exécution non vérifiée**.
- Origine : réponse Q-158 « Oui, on valide », avec Q-155 à Q-157.
- Décision : [la conception des morceaux](13-morceaux-lancement.md) devient le plan de travail : fiches, places de la créature et parcours à prouver (un parcours sûr par morceau, un cas par mélange accepté, une partie sur téléphone par morceau). Les règles des nouveaux morceaux et des mélanges sont retranscrites dans C-02, C-03 et C-04, sans changement de sens.
- Réserves : textes, durée et intérêt non mesurés ; aucune partie humaine revendiquée.

## Décisions validées — interface (suite)

### D-176 — Une couleur par menu : cyan pour l'inventaire

- Date / statut : 2026-10-11 / **Validé**.
- Origine : demande du porteur du projet sur la version de test de la PR #109, avec une capture : « le menu d'inventaire […] dans une pop-up, une sorte d'info-bulle, couleur cyan », puis « cyan (adapté à l'esthétique cassette futurism phosphore) » ; « l'infobulle doit se placer par-dessus les éléments existants ».
- Décision : la bulle d'inventaire (D-154) est cyan, posée au-dessus du bouton INVENTAIRE sans le cacher, par-dessus l'écran ; « Dans la pièce » et « Se déplacer vers » restent visibles dessous ; toucher en dehors la referme. Chaque menu peut avoir sa propre couleur. Remplace sur ce point la règle « tout l'écran reste dans la gamme ambre » de 12 §2.1 (D-140) : l'écran de jeu reste ambre.
- Limite : blanc pour la carte et vert pour l'IA du vaisseau sont des pistes du porteur du projet, pas encore décidées. Chaque couleur garde les seuils de contraste de 12 §7 et n'est jamais la seule porteuse d'une information (12 §2.6).

## Décisions validées — créature (#100)

### D-177 — La créature suit le passage qu'elle vous a vu prendre

- Date / statut : 2026-10-11 / **Validé**.
- Origine : question de la relecture de #100 ; réponse « Elle vous suit par la porte qu'elle vous a vu prendre, une pièce par action ».
- Décision : quand le passager quitte la pièce où la créature le voit, sa réaction de cette action est de le voir partir. À l'action suivante, elle franchit ce même passage s'il est encore ouvert et assez large ; elle ne sait pas où il va ensuite. Une porte refermée ou un passage étroit l'arrête, même si un autre chemin existe ; elle garde alors cet indice. Précise C-03 §4.3 et la limite de D-040.
- Rappel (C-04 §4.2, pas une réponse du porteur) : la fuite exposée et son jet (#101) se résoudront pendant l'action de départ et consommeront cette réaction.

### D-178 — La créature entend aussi loin que le son passe

- Date / statut : 2026-10-11 / **Validé**.
- Origine : question de la relecture de #100 ; réponse « Aussi loin que les portes ouvertes et les grilles le laissent passer ».
- Décision : un bruit atteint la créature à travers toute suite de liaisons qui laissent passer le son (ouvertes, ou grilles même fermées), sans limite de distance, comme dans AR-01 P-A (le son de P passerait par E vers O). Le passager, lui, n'entend la créature que dans la pièce voisine (OP-01).

### D-179 — Les agents proposent l'apparence de la créature

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponse « Oui, les agents proposent une apparence et la gardent partout ».
- Décision : les textes peuvent décrire la créature ; l'apparence proposée est gardée partout : plus haute qu'un homme, peau luisante, tête sans yeux, gueule qui hume l'air, griffes. Précise l'aspect laissé ouvert par D-032.
- Limite : textes en zone verte (D-116).

### D-180 — Aller ou ouvrir là où l'on a vu la créature est annoncé risqué

- Date / statut : 2026-10-11 / **Validé**.
- Origine : retour du porteur sur la version de test de la PR #112 (« aller dans une pièce où on sait que la créature y était il y a peu devrait avertir le joueur »), puis réponses : « Risque élevé si vue à l'instant ou il y a un moment, modéré si il y a longtemps » ; pièce revue vide : « Plus d'avertissement » ; ouvrir une porte vers elle : « Oui, même niveau que pour y aller ».
- Décision : l'aperçu d'un déplacement, ou de l'ouverture d'une porte, vers la pièce où le passager a vu la créature en dernier annonce un risque **élevé** si c'était « à l'instant » ou « il y a un moment », **modéré** si c'était « il y a longtemps » (seuils de D-151). Le danger suit le niveau sur la ligne RISQUE (12 §3.8). L'avertissement disparaît quand le passager voit cette pièce vide.
- Limite : calculé sur ce que le passager sait seulement (C-06 §4) ; une créature jamais perçue n'est pas annoncée.

### D-181 — Un bruit entendu derrière une porte avertit aussi

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponses « Oui : risque modéré, « quelque chose bougeait derrière cette porte » » ; vue puis entendue ailleurs : « Les deux : élevé là où vue, modéré là où entendue » ; avec le temps : « Non : modéré tant que vous n'avez pas vu la pièce » ; entendue puis vue ailleurs : « Le bruit est oublié : on sait maintenant où elle est ».
- Décision : aller ou ouvrir vers la pièce d'où venait le dernier bruit de la créature s'annonce **modéré**, avec le passage derrière lequel il a été entendu. La dernière vue et le dernier bruit sont gardés chacun à part : un bruit entendu après l'avoir vue laisse les deux pièces signalées ; la voir après l'avoir entendue fait oublier le bruit. Le bruit ne s'oublie pas avec le temps ; il s'efface aussi quand le passager voit cette pièce. Si une vue « il y a longtemps » et un bruit concernent la même pièce, le niveau est le même et c'est le bruit, plus récent, qui est dit [détail de l'agent].
- Limite : sur la carte, un bruit n'ajoute toujours aucune marque (OP-05) ; seul l'aperçu en tient compte.

### D-182 — Une seule touche quand rien n'est à craindre, sauf pour les portes

- Date / statut : 2026-10-11 / **Validé** (implémenté par #113).
- Origine : retour du porteur (« pas la peine de demander confirmation pour ramasser ou poser un objet si aucun risque connu ou aucun coût, ça alourdit l'interface, pareil pour passer d'une pièce à une autre »), puis réponse « Garder la confirmation pour les portes ».
- Décision : prendre, poser et changer de pièce se jouent d'un seul toucher quand l'aperçu annonce « aucun risque connu » et aucun coût. Dès qu'il y a un risque connu ou un coût, l'aperçu et CONFIRMER restent. Ouvrir et fermer une porte passent toujours par l'aperçu. Remplace sur ce point « toute action engageante passe par un aperçu » (12 §1.3, D-140).
- Modification partielle : le bouton « Se déplacer vers » ouvre d'abord la bulle du passage ; c'est la ligne du déplacement qui se joue d'un seul toucher (D-229).

### D-183 — Rester sous ses yeux se joue au même dé que la fuite

- Date / statut : 2026-10-11 / **Validé**.
- Origine : question de #101 (rester dans la pièce de la créature après le premier contact), réponse « Un dé comme la fuite : une chance sur deux d'être blessé ».
- Décision : quand le passager commence une action dans la pièce de la créature après le premier contact, un seul D6 enregistré résout son interception, qu'il parte (fuite exposée, D-052) ou qu'il reste : de 1 à 3, une aggravation ; de 4 à 6, rien (D-055). Ce jet est sa réaction du pas : ni seconde attaque ni déplacement en plus (C-04 §4.2).
- Limite : l'aperçu l'annonce « élevé », « mortel » si le passager est critique [détail de l'agent, selon l'échelle de 12 §3.8]. Entrer dans sa pièce ou la voir entrer ne déclenche pas le dé ce pas-là : une menace seulement (C-03 §4.3) [détail de l'agent].

### D-184 — L'action qui suit le premier contact est libre

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponse « Libre : ni dé ni blessure pour cette action-là, quelle qu'elle soit ».
- Décision : juste après le premier contact, la première action du passager ne tire aucun dé et ne blesse pas, qu'il fuie ou qu'il reste (C-03 §4.4). S'il reste, elle menace ; s'il part, elle le voit partir (D-177).
- Limite : une seule fois par partie, comme le premier contact.

### D-185 — Se soigner avec la trousse en main ou posée dans la pièce

- Date / statut : 2026-10-11 / **Validé**.
- Origine : réponse « En main ou posée dans la pièce ».
- Décision : « Se soigner » vise une trousse portée ou posée dans la pièce du passager. Une dose améliore d'un état (C-04 §2) ; vide, la trousse reste un objet et l'action est indisponible (« La trousse de soin est vide. ») ; indemne, l'action est indisponible (« Vous n'êtes pas blessé. »).
- Limite : le monde de test a une trousse à une dose dans l'atelier ; le nombre de soins d'AR-01 reste celui de son contenu (D-051).

### D-186 — Le nouveau texte s'écrit à la machine, puis un curseur clignote

- Date / statut : 2026-10-11 / **Validé** (implémenté par #115).
- Origine : demande du porteur (« à chaque fois que du nouveau texte s'affiche, je veux un effet machine à écrire. Quelque chose d'assez rapide, juste pour montrer qu'il y a du nouveau texte, genre 500 ms pour tout afficher, puis un curseur bloc qui clignote lentement à la fin du texte »), puis réponses « Tout nouveau texte : récit, messages de l'IA, bruit entendu », « Un seul curseur, à la fin du dernier texte apparu », « Les boutons marchent normalement, le texte finit de s'afficher d'un coup », « Réglage « Effet machine à écrire » dans les options, et coupé si le téléphone demande moins d'animations ».
- Décision : tout nouveau texte (récit et rappel, ligne de bruit, messages d'IA Station, réveil) apparaît caractère par caractère, dans l'ordre de lecture, en 500 ms au total quelle que soit sa longueur. Ensuite un curseur bloc `▮` clignote lentement à la fin du dernier texte apparu ; un seul curseur à l'écran. Pendant l'écriture, toucher un bouton agit normalement et affiche le texte en entier. Un texte déjà affiché n'est pas réécrit (bulle rouverte, retour d'un autre écran). Réglage « Effet machine à écrire [OUI] / [NON] », gardé sur l'appareil hors de la sauvegarde ; sur [NON] ou si le téléphone demande moins d'animations, le texte apparaît d'un coup et le curseur ne clignote pas.
- Limite : affichage seulement, ni temps de jeu ni tirage (C-03). Le lecteur d'écran reçoit le texte entier une fois, jamais lettre par lettre, et ne lit pas le curseur. La place du texte final est réservée dès le début : la mise en page ne bouge pas. Cadence du clignotement [détail de l'agent] : 1,6 s par cycle, à juger sur téléphone.

### D-187 — L'aperçu ne dit pas « aucun »

- Date / statut : 2026-10-11 / **Validé** (implémenté par #117).
- Origine : demande du porteur (« ne pas afficher "Risque aucun risque connu" et ne pas afficher "Coût aucun". N'afficher les infos risque et coût que s'il y a autre chose que "aucun" »).
- Décision : dans l'aperçu de l'appli, la ligne RISQUE n'apparaît que s'il y a un risque connu (ou un danger connu annoncé), la ligne COÛT que s'il y a un coût (`[bruyant]`). Sinon la ligne disparaît entièrement, libellé et valeur, aussi pour le lecteur d'écran. SAVOIR reste toujours affiché : un aperçu sans risque ni coût montre seulement SAVOIR, puis ANNULER / CONFIRMER. Précise 12 §3.8 et D-150.
- Limite : l'aperçu calculé par le moteur ne change pas ; la CLI garde ses trois lignes. Le un seul toucher (D-182) se décide toujours sur l'aperçu du moteur, pas sur ce qui est affiché.

### D-188 — Le feu brûle à chaque action finie dans une pièce en feu

- Date / statut : 2026-10-11 / **Validé** (implémenté par #102).
- Origine : réponses du porteur « Possible, une blessure certaine annoncée avant » (entrer dans une pièce en feu) et « Une blessure certaine quand il arrive, puis une à chaque action tant que vous y restez » (le feu gagne la pièce du passager).
- Décision : finir une action dans une pièce en feu provoque une aggravation certaine, cause « feu », sans dé : en y entrant, quand le feu la gagne, puis à chaque action tant que le passager y reste. Éteindre la pièce où l'on est, ou en sortir, évite la brûlure de cette action. L'aperçu l'annonce « certain » (« mortel » comme danger quand le passager est critique) dès que le passager voit le foyer en cause : sa pièce, ou une voisine par un passage ouvert.
- Limite : avec les griffes dans le même pas, une seule aggravation, causes conservées (C-04 §3, D-053). Le feu n'abîme pas les objets (C-03 §5.3).

### D-189 — La créature n'entre jamais dans une pièce en feu

- Date / statut : 2026-10-11 / **Validé** (implémenté par #102).
- Origine : réponse du porteur « Elle ne traverse jamais une pièce en feu, elle contourne ou attend ».
- Décision : une liaison vers une pièce en feu n'est pas praticable pour la créature. Elle passe par un autre chemin s'il existe, sinon elle attend du côté où elle est en gardant son indice.
- Limite [détail de l'agent] : si le feu gagne la pièce où elle se trouve, elle n'est pas blessée et peut en sortir ; rien n'est décidé de plus.

### D-190 — L'huile au pied d'une porte, du côté du passager

- Date / statut : 2026-10-11 / **Validé** (implémenté par #102).
- Origine : réponse du porteur « Au pied d'une porte, de votre côté ; elle glisse en franchissant cette porte vers vous ; vous passez toujours par le bord sec sans glisser ».
- Décision : verser une dose de liquide glissant rend glissant le pied d'un passage de la pièce, du côté du passager, même fermé (AR-01 §11.3). La créature qui franchit ce passage sans connaître ce sol glisse là où il se trouve ; sa réaction s'arrête et les deux suivantes sont perdues ; elle connaît ensuite ce sol et le franchit prudemment, en deux réactions (C-03 §5.2). Glissée, elle ne peut pas intercepter. Le passager passe toujours par le bord sec, sans glisser ni dé.
- Limite [détail de l'agent] : un sol huilé du côté qu'elle quitte compte aussi ; elle y glisse sans changer de pièce.

### D-191 — Écran plus compact, boutons toujours visibles, six lignes de récit au moins

- Date / statut : 2026-10-12 / **Validé** (implémenté par #122).
- Origine : demande du porteur (« tout compresser légèrement verticalement, seulement quelques pixels pour chaque bouton » ; « la ligne séparatrice entre les boutons et le texte [doit pouvoir] bouger, que les boutons soient toujours visibles avec une zone sécurisée de minimum 6 lignes pour le texte » ; pied de page « V0.1.0 · e27d220 · test PR #121 », qui tenait sur deux lignes sur son téléphone), puis réponses « la ligne se place toute seule » et « si les boutons ne tiennent pas, ce sont eux qui défilent ».
- Décision : la limite entre le récit et le dock se place toute seule. Le dock prend la hauteur qu'il faut pour montrer tous ses boutons ; le récit garde le reste, jamais moins de six lignes de texte à sa taille, texte agrandi compris. Seulement si les boutons ne tiennent pas à côté de ces six lignes, le dock défile. Les boutons perdent quelques pixels de hauteur, jamais sous 44 px. Le pied de page devient « V<version> · <commit> · test PR #<n> ». Remplace la règle « dock d'au plus 45 %, récit d'au moins un tiers » (12 §3.1).
- Limite [détail de l'agent] : hauteurs retenues, à juger sur téléphone : en-tête 56 px, puces et déplacements 46, navigation 48, lignes de bulle 44, boutons principaux et ANNULER / CONFIRMER 50 ; écarts entre boutons 6 px ; marges du récit 12 px en haut et en bas (le minimum vaut six lignes plus ces marges), marge basse du dock 8 px. Tailles de texte inchangées. Pas de limite déplaçable au doigt.

### D-192 — IA Station dans une fenêtre blanche ; en partie, un lien seulement

- Date / statut : 2026-10-12 / **Validé** (proposé par #98).
- Origine : demande du porteur au lancement de #98 (« ia station dans une modale couleur blanc (meme vibes que le menu inventaire en cyan) »), puis réponses « Seulement le lien « [ IA STATION ] parle dans l'écouteur › » ; on lit le message en ouvrant la fenêtre », « Nouveau : pastille au départ jusqu'à ce que la fenêtre soit ouverte », « Blanc froid, à peine bleuté (écran LCD, cockpit) ».
- Décision : la fenêtre d'IA Station (12 §3.9) est blanche, comme l'inventaire est cyan (D-176) : contour, titre, NOUVEAU et RETOUR en blanc froid à peine bleuté, citations en blanc, fond presque noir. Pour cette fenêtre, elle remplace le fond `surface-2`, le contour `texte`, le titre `accent` et l'italique `signal`. En cours de partie, un message qui arrive ne s'écrit plus dans le récit : seul le lien « [ IA STATION ] parle dans l'écouteur › » l'annonce, et il se lit dans la fenêtre. Au réveil, la citation reste encadrée sous le récit (12 §4.2) et le message compte pourtant comme nouveau : pastille sur IA STATION jusqu'à l'ouverture de la fenêtre.
- Remplace : la piste « vert pour l'IA du vaisseau » de D-176. Le blanc étant pris, la couleur de la carte (autre piste de D-176) reste à choisir.
- Limite [détail de l'agent] : à juger sur téléphone : jetons `blanc` #EEF6F8, `blanc-texte` #DCE8EC, `blanc-secondaire` #8C9CA2, `blanc-surface` #0A0E0F ; repères « au réveil · <pièce> », « en arrivant · <pièce> », « au départ de la capsule » ; lien en `signal`, 14 px, à la fin du récit ; IA STATION à la troisième place de la navigation, CARTE viendra au milieu ; pastille de la couleur du bouton (ambre). Les messages lus sont gardés sur l'appareil à côté de la partie, par identifiant, ni dans l'export ni dans le rejeu ; une partie d'un autre monde ou d'une autre graine les ignore. À la fin de la partie, le lien reste le seul accès à la fenêtre, la navigation ayant disparu.

### D-193 — Le passage en force d'AR-02 se joue sans dé

- Date / statut : 2026-10-12 / **Remplacée par D-195**.
- Origine : question de #104 (au pas 4 de P-V3, le D6 de D-070 contre l'action libre de D-184), réponse « Geste libre : pas de dé, on corrige le document d'AR-02 ».
- Décision : l'action libre qui suit le premier contact (D-184) s'applique aussi à AR-02. Au pas 4 de P-V3, B → E se joue sans dé ni blessure ; le parcours finit indemne. AR-02 §7 et §8 sont corrigés.
- Limite : précise D-070, qui garde le passage en force comme vrai choix, sans le dé qu'il annonçait. Rester ou repasser sous ses yeux après cette action se joue au dé (D-183).

### D-194 — La créature que le vide atteint ne frappe pas, quel que soit le geste

- Date / statut : 2026-10-12 / **Validé** (#104).
- Origine : question de #104 (RSK-11 ne vise que « percer »), réponse « Non : le vide l'emporte avant qu'elle frappe, quel que soit le geste ».
- Décision : la créature expulsée ou rendue inerte par le vide pendant un pas n'intercepte pas et ne menace pas ce pas-là, que l'air parte en perçant, en ouvrant ou en fermant, même sous les yeux du passager après l'action libre : ni dé ni blessure, et l'aperçu ne l'annonce pas.
- Limite : exception à D-183 et à l'ordre de C-03 §3 pour ce seul cas ; étend RSK-11 et VP-01.

### D-195 — Se faufiler à côté d'elle n'est pas libre

- Date / statut : 2026-10-12 / **Validé** (#104).
- Origine : partie du porteur sur AR-02 (« on peut gagner en allant directement dans la capsule sans jamais être embêté par la créature » ; « si on ouvre la porte, la créature devrait nous attendre juste derrière »), puis réponse « Se faufiler à côté d'elle n'est pas libre ».
- Décision : quand la créature entre dans la pièce du passager au premier contact, elle se tient devant le passage qu'elle vient de franchir. Pendant l'action libre qui suit (D-184), franchir ce passage-là se joue au dé de D-183 (de 1 à 3, une aggravation), annoncé « élevé » dans l'aperçu ; toute autre action reste libre. Au pas 4 de P-V3, le D6 de D-070 revient.
- Remplace : D-193.
- Limite : si c'est le passager qui entre dans sa pièce, rien ne change ; l'action libre reste entière.

### D-196 — L'écoutille de la capsule est fermée au départ

- Date / statut : 2026-10-12 / **Validé** (#104).
- Origine : même partie ; proposition du porteur « on n'a qu'à fermer l'écoutille, l'ouvrir coûte une action, ce qui laisse le temps à la créature d'attaquer », pour AR-01 et AR-02.
- Décision : dans AR-01 et AR-02, l'écoutille de la capsule est fermée au début de la partie. Elle s'ouvre et se ferme à la main, depuis l'embarquement comme depuis la cabine, une action chaque fois. Les parcours témoins gagnent une action « ouvrir l'écoutille » : P-A/P-B/P-C 14/19/16, P-V1/P-V2/P-V3 13/13/9.
- Remplace : « l'écoutille ne se manœuvre que de l'intérieur » (détail de l'agent pour #103) et « écoutille ouverte » d'AR-01 et AR-02.
- Limite : seule, elle ne suffit pas : refermer la porte derrière soi retient toujours la créature, d'où D-195.

### D-197 — Nouveaux noms de pièces dans AR-01 et AR-02

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demande du porteur, liste de pièces renommées ; « quai d'embarquement » remplacé par « salle d'embarquement », les phrases du jeu disant « dans » la pièce.
- Décision : dans AR-01, l'atelier de service devient « atelier maintenance », la galerie technique « local technique », la salle d'observation « baie d'observation », l'embarquement « salle d'embarquement ». Dans AR-02, la coursive des cabines devient « cabines du personnel », l'embarquement « salle d'embarquement ».
- Remplace : les noms de pièces correspondants de D-035 et de D-063.
- Limite : noms affichés seulement ; les repères d'auteur (A, G, O, E, C) et les clés internes du contenu ne changent pas.

### D-198 — Les encarts d'IA Station dans le récit sont en blanc froid

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demande du porteur (« les petits inserts de l'IA du vaisseau, colorés en blanc froid, même couleur que la pop-up du menu IA du vaisseau »).
- Décision : l'encadré de parole d'IA Station (12 §4.2) et le lien « [ IA STATION ] parle dans l'écouteur › » (12 §3.3) prennent les couleurs de la fenêtre d'IA Station (D-192) : contour `blanc`, fond `blanc-surface`, étiquette `blanc-secondaire`, citation et texte du lien `blanc-texte`.
- Remplace : pour ces deux éléments, le contour `bordure`, l'étiquette `texte-secondaire` et le texte `signal` (12 §3.3, D-192).
- Limite [détail de l'agent] : lien pressé sur fond `blanc-secondaire`, texte `blanc-surface`. À juger sur téléphone.

### D-199 — L'orchestration des issues reste dans la conversation principale

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demande du porteur du projet : l'agent orchestrateur plante souvent ; ne pas l'utiliser comme sous-agent, mais garder ses consignes pour gérer les issues.
- Décision : l'assistant principal tient le rôle d'orchestration dans la conversation de l'issue en suivant `.github/instructions/gestion-issues.instructions.md`. Le profil `orchestrateur` n'est pas installé dans `.github/agents/`. Les profils `executant`, `relecteur` et `playtester` restent disponibles pour les délégations spécialisées utiles.
- Remplace : D-137 pour l'installation du profil orchestrateur ; les trois profils spécialisés de D-137 restent installés.
- Limite : l'assistant principal peut déléguer des tâches bornées aux profils spécialisés, mais ne délègue pas la conduite complète du workflow d'issue.

### D-200 — Abandonner efface la partie de l'appareil

- Date / statut : 2026-10-12 / **Validé** (proposé par #96).
- Origine : question pendant #96 (« Quand le joueur abandonne, que doit devenir la partie ? »), réponse du porteur « A. Effacée du téléphone ».
- Décision : ABANDONNER, confirmé dans les options, retire la partie en cours et ses messages lus de l'appareil, puis montre l'écran de fin « Partie abandonnée » (12 §4.11). L'abandon est un geste de l'appli, pas une commande du moteur : il n'entre ni dans le journal, ni dans l'export, ni dans le rejeu, et la CLI ne le propose pas. Rouvrir le jeu après un abandon mène à l'accueil, sans partie à reprendre. L'écran de fin n'apparaît qu'une fois l'effacement réussi ; si l'appareil le refuse, le jeu le dit et la partie reste en cours.
- Précise : C-08 §4 pour la fin par abandon ; D-013 et D-089 inchangées.
- Limite : fermer le jeu sur l'écran de fin le fait disparaître. Le futur « Envoyer ma partie » de cet écran (12 §4.11) ne pourra envoyer que la partie encore affichée.

## Décisions validées — carte (#97)

Choix faits le 2026-10-12 sur maquettes et sur les mesures d'un prototype jetable ; conception complète dans [14 — carte en plan de pont](14-carte.md).

### D-201 — La carte est un plan de pont

- Date / statut : 2026-10-12 / **Validé**.
- Origine : choix du porteur entre trois formes maquettées (« franchement le C, plan de pont c'est celui qui me plait le plus »).
- Décision : la carte dessine le plan réel de la station : pièces à leur taille, murs communs, portes en ouvertures. Les stations générées produisent ce plan en s'assemblant ; une station impossible à dessiner est refusée.
- Remplace : la forme de la carte de 12 §4.8 (boîtes reliées par un double trait, maquette P08).
- Limite : la géométrie sert l'affichage ; les règles du jeu lisent toujours des positions relatives simples (D-015).

### D-202 — Les pièces connues par une porte sont dessinées en pointillé

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demande du porteur au lancement de #97 (« affiche les pièces non visitées adjacentes aux pièces déjà visitées en pointillé »), confirmée.
- Décision : une pièce non visitée, destination nommée d'une porte signalée vue depuis une pièce visitée, est dessinée en entier, en pointillé, avec son nom. Un passage sans signalétique ne fait toujours pas connaître sa destination.
- Remplace : « cette destination reste non dessinée tant qu'elle n'est pas visitée » d'OP-03 (C-06 §3, 12 §4.8) et la limite de D-075 sur les noms connus par la signalétique.

### D-203 — L'air et la créature entrent dans #97

- Date / statut : 2026-10-12 / **Validé**.
- Origine : confirmation du porteur ; le moteur a désormais le vide (#104) et la créature (#100).
- Décision : feu, vide et créature figurent sur la carte dès #97.
- Remplace : le hors-périmètre de l'issue #97 (voyants d'air et créature « à brancher » plus tard).

### D-204 — Plans générés par tuiles dessinées, portes souples

- Date / statut : 2026-10-12 / **Validé**.
- Origine : réponse du porteur (« tuiles dessinées mais il faut faire attention à l'emplacement des portes et autres passages. Si c'est trop rigide, on arrivera pas à assembler des pièces »), puis validation des règles mesurées par le prototype.
- Décision : chaque morceau porte son plan en cases ; la porte entre deux morceaux se place n'importe où sur un mur commun d'au moins deux cases ; une tuile peut être retournée en miroir, jamais tournée ; aucun vide enfermé entre les pièces ; même graine, même plan (14 §5.2).
- Limite : mesures d'un prototype jetable à tuiles approximatives (14 §6) ; les vraies tuiles se dessinent avec les morceaux (#105, #106).

### D-205 — Grandes stations et carte qui défile

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demande du porteur (« Pense qu'il faut aussi gérer des grosses station de 20 salles (voir plus) (quitte a faire défiler au doigt si le plan doit être zoomé) »), puis choix « Ouverte centrée sur moi » et « Pincer pour zoomer ».
- Décision : une station peut compter 20 pièces et plus ; elle se construit en trois temps : chemin principal, annexes posées une à une, portes de boucle. La carte garde une échelle lisible et défile au doigt ; elle s'ouvre centrée sur la pièce actuelle et se pince pour zoomer, sans bouton recentrer ni vue d'ensemble.
- Limite : taille des stations et durée de partie (D-008) restent à mesurer.

### D-206 — Petites pièces en cul-de-sac

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demande du porteur (« pouvoir gérer des petites pièces Adjacentes en cul de sac a une seule porte (local technique, placard à balai, cabine d'équipage, salle de bain, wc) »).
- Décision : ces pièces n'ont qu'une porte et rien ne s'y accroche ; elles sont assez grandes pour leur nom complet (14 §4.2, PL-04).

### D-207 — Règles de cohérence des stations

- Date / statut : 2026-10-12 / **Validé**.
- Origine : demandes du porteur (pièces vitrées, sas et capsules vers l'extérieur ; « sanitaires a couté des cabines et dortoirs, pas de passage par les salles des machines obligatoire pour aller aux WC » ; « des "couloirs" qui connectent jusqu'a 6 salles » ; plusieurs zones de vie et techniques « reliées ensembles en plusieurs points »), validation des règles du prototype, et précision : « il est possible de devoir passer par des pièces de vie pour avancer dans l'histoire ».
- Décision : coque dégagée, avec quatre cases libres devant vitres, sas extérieurs et capsules ; pièces de vie atteintes depuis le départ sans traverser de pièce technique, pour l'architecture seulement, pas pour le chemin imposé par l'incident ; WC et salles de bain sur un couchage ou sur un couloir qui en dessert un ; couloirs en grappes, six portes au plus par pièce ; plusieurs zones reliées en plusieurs points, possibles mais jamais obligatoires (14 §5.4).
- Limite : liste des catégories et règles complémentaires à écrire avec le catalogue des pièces ; c'est le vérifieur de jeu (GP-05) qui garantit qu'une porte de boucle ne contourne pas un obstacle.

### D-208 — Pièces du même type numérotées

- Date / statut : 2026-10-12 / **Validé**.
- Origine : réponse du porteur « Numérotées ».
- Décision : dans une station, les pièces du même type portent un numéro (CABINE 3, COULOIR B), le même dans le récit, le dock, la carte et la fiche (NP-04).

### D-209 — États sur la carte : motif de sol et étiquette

- Date / statut : 2026-10-12 / **Validé**.
- Origine : choix du porteur « C · Les deux » sur maquettes.
- Décision : le feu (hachures, étiquette FEU), le vide (points, VIDE ○) et la créature (losange, CRÉATURE) portent un motif de sol et une étiquette en vidéo inverse ; l'ancienneté suit en mots et s'efface faute de place dans une petite pièce ; la pièce actuelle porte « @ VOUS ».
- Précise : la forme du marqueur de créature laissée à maquetter par D-141 : un losange.

### D-210 — Fiche d'une pièce : état vu et objets vus

- Date / statut : 2026-10-12 / **Validé**.
- Origine : réponse du porteur sur maquette (« État vu, Objets vus »).
- Décision : toucher une pièce visitée ouvre sa fiche, gratuite, dans une bulle ancrée : états vus avec leur ancienneté, objets vus au dernier regard ; ni ancienneté seule ni passages. La carte ne déplace jamais le passager.

### D-211 — La carte en vert phosphore

- Date / statut : 2026-10-12 / **Validé**.
- Origine : choix du porteur « B · Vert phosphore » sur maquettes.
- Décision : l'écran de la carte a ses propres jetons verts (14 §2.2), comme l'inventaire est cyan (D-176) et IA Station blanche (D-192).
- Remplace : « la couleur de la carte (autre piste de D-176) reste à choisir » (D-192).
- Limite : valeurs à juger sur téléphone.

### D-212 — Vue LISTE de la plus proche ; positions en mots dans la liste seulement

- Date / statut : 2026-10-12 / **Validé**.
- Origine : réponses du porteur « De la plus proche » et « Non, liste seulement ».
- Décision : la vue LISTE range les pièces visitées par nombre de passages connus depuis la pièce actuelle ; les positions en mots (ICI) n'apparaissent que dans la vue LISTE.
- Remplace : « Sous le plan, ── ICI ── » de 12 §4.8 et le point 4 du périmètre de l'issue #97.

### D-213 — Mémoire de la carte

- Date / statut : 2026-10-12 / **Validé**.
- Origine : validation par le porteur de la conception « Ce que le moteur garde ».
- Décision : l'état sauvegardé garde, par pièce, le dernier état vu (feu, objets, portes, moment du regard), mis à jour dans la pièce actuelle et, pour le feu, à travers une porte ouverte. La carte publique ne contient que ce que le passager sait, géométrie comprise (14 §3).
- Précise : D-076 et OP-05 ; OP-04 inchangé (air à jour par les voyants).

### D-214 — #97 en trois livraisons ; géométrie générée dans #106

- Date / statut : 2026-10-12 / **Validé**.
- Origine : validation par le porteur du découpage proposé.
- Décision : #97 se livre en trois PR : plans, mémoire, écran (14 §7). L'assemblage géométrique des stations générées rejoint #106. Un catalogue de pièces sans obstacle fera l'objet d'une issue à part, créée avec l'accord du porteur.
- Limite : chaque livraison est en zone orange ; l'écran demande un essai sur téléphone.
- Modifiée par D-245 : #106 ne dessine que le chemin principal ; annexes, boucles et grandes stations iront dans une issue à part, si la durée le demande.

### D-215 — La carte s'ouvre en bulle, comme l'inventaire

- Date / statut : 2026-10-13 / **Validé**.
- Origine : retour du porteur sur la PR #129 après essai sur téléphone (« afficher la carte dans une info bulle comme celle de l'inventaire », cohérence des trois boutons du bas).
- Décision : la carte s'ouvre dans une bulle posée au-dessus de la navigation, avec de petites marges, l'écran de jeu visible derrière un voile et une flèche vers CARTE. Elle se ferme par ✕, le voile, CARTE, Échap ou le retour système.
- Remplace : « La carte occupe tout l'écran » et le bouton FERMER LA CARTE (14 §2.1, D-201 pour la forme de l'écran seulement).

## Décisions validées — son (#99)

Choix faits le 2026-10-13 à l'oreille, sur le [banc des bruitages](maquette/banc-sons.html) et la [maquette de la section SON](maquette/options-son.html) ; conception complète dans [15 — son](15-son.md). Ils précisent la demande du porteur du 2026-10-11 consignée dans l'issue #99 (« bruits informatique rétro cassette futurism. Bzzt, clic, bip, boop. Que des bruits d'interface ») et la modifient là où D-218 et D-219 le disent.

### D-216 — Bruitages synthétisés pour le projet

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur « j'aimerais que tu me proposes les sons toi » ; proposition retenue de sons synthétisés plutôt que tirés d'une banque ; « option 1, synthèse en direct ».
- Décision : tous les sons sont synthétisés par le jeu au moment de les jouer, à partir de recettes écrites pour le projet (15 §3) ; aucun fichier son n'est ajouté. Les crédits notent « créé pour le projet » (15 §9).
- Précise : D-153 (« sons libres de droits dont la source et la licence sont notées »).

### D-217 — Catalogue des sons ; un toucher, un son

- Date / statut : 2026-10-13 / **Validé**.
- Origine : choix du porteur sur le banc (clic A Touche mécanique, bulle C Tic double, confirmer D Déclic validé, indisponible B Bz-bzt, IA Station A Télétype, inventaire · carte · IA Station C Bip feutré avec une hauteur propre à chacun, crépitement C Bips de caractères), après deux tours pour adoucir bulle, confirmer et les panneaux ; validation de la partie « déclencheurs ».
- Décision : chaque geste joue le son de 15 §2.1, et un seul : le son le plus précis remplace le clic. Toute action jouée d'un seul toucher (D-182) joue « confirmer ». Le crépitement accompagne l'effet machine à écrire et s'arrête avec lui (15 §2.3).
- Précise : D-155 (l'arrivée d'un message d'IA Station joue le Télétype).

### D-218 — Blessure, soin et alarmes : des signaux du terminal

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur « propose-moi aussi des sons pour : blessure, soin, alarme incendie, alarme vide » ; choix C Parasite, B Bip apaisé, B Détecteur, A Grave pulsé ; « le feu ou le vide pour la première fois dans la pièce où je me trouve (ou quand le feu se propage dans notre salle) » ; « option 1 » (l'alarme resonne à chaque entrée).
- Décision : ces quatre sons sont des signaux du terminal, pas des bruits du monde. La blessure sonne quand la santé s'aggrave (plus grave et deux fois à « critique » ou « vaincu »), le soin quand elle s'améliore ; une alarme sonne une fois quand le feu ou le vide passe de absent à présent dans la pièce du passager, qu'il y entre ou que le danger s'y propage, et resonne à chaque nouvelle entrée. Ordre et espacement en 15 §2.4. Aucun signal à la reprise d'une partie.
- Modifie : la précision du 2026-10-11 qui excluait tout son lié au feu et au vide ; le monde reste sans bruit propre.

### D-219 — Ambiance : bruit brun et carlingue qui travaille

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demandes du porteur « une option pour avoir un bruit blanc / marron deep bass », « avec le brun profond ça fait vraiment effet », « des bruits lointains de tôle qui craque, comme un sous-marin », « un gong lointain sourd, un seul coup sur la coque » ; choix A Brun profond, E Mélange, rythme rare ; « impec ».
- Décision : l'ambiance est un fond continu de bruit brun profond, sous lequel la carlingue travaille : gémissement, craquement, pression ou gong lointain, tirés au hasard (le gong deux fois plus rare), un toutes les 20 à 60 s, à gauche ou à droite, dans une réverbération de coque (15 §2.5, §3.3, §3.4). Elle tourne sur tous les écrans dès le premier toucher.
- Modifie : la précision du 2026-10-11 (« seulement des bruits d'interface ») pour l'ambiance.

### D-220 — Options › SON : trois rails

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur « un slider général, et des sliders soundtrack, effets sonores, et ambiance » ; choix « A rail » sur maquettes ; niveaux du bilan « général 80 · effets 80 · ambiance 30 ».
- Décision : la section SON des options a trois rails de 0 à 100 : Général, Effets sonores, Ambiance, par défaut 80, 80 et 30 ; à 0, « COUPÉE » ou « COUPÉS ». Ils s'appliquent immédiatement et sont gardés sur l'appareil (15 §4).
- Remplace : « Ambiance » COUPÉE / BASSE / NORMALE et « Effets sonores » COUPÉS / ACTIFS (12 §4.10, détail de D-148).
- Modifiée par D-223 : ambiance à 60 par défaut.

### D-221 — Pas de bande-son pour le moment

- Date / statut : 2026-10-13 / **Validé**.
- Origine : « tu sais quoi, on vire la bande son pour le moment ». Auparavant, à l'aveugle sur un extrait, le porteur n'avait pas distingué l'AAC 64 kbit/s (environ 13 Mo pour le morceau entier) de l'original à 192 kbit/s (40 Mo) : « on peut mettre la plus compressée ».
- Décision : #99 ne livre pas de bande-son ; pas de curseur « Bande-son » tant qu'il n'y a pas de musique. Le fichier du porteur reste hors du dépôt.
- Limite : si la bande-son revient, la compression AAC 64 kbit/s est la piste retenue ; le morceau commence par environ 5 s presque silencieuses et finit sur 14 s de silence, à traiter pour une boucle sans coupure.
- Suspend : la partie bande-son de D-153 et le point 2 du périmètre de l'issue #99.

### D-222 — Son : premier toucher, arrière-plan, mode silencieux

- Date / statut : 2026-10-13 / **Validé**.
- Origine : validation de la partie « cycle de vie » ; « option 1 » pour le mode silencieux.
- Décision : aucun son avant le premier toucher ; pause en bloc quand l'appli passe en arrière-plan, reprise au retour, sans rattrapage ; le jeu respecte le mode silencieux de l'iPhone et se mélange à l'audio du joueur sans l'interrompre ; sans audio disponible, le jeu reste muet sans erreur (15 §5).

### D-223 — Son : réglages après l'essai sur téléphone

- Date / statut : 2026-10-13 / **Validé**.
- Origine : essai du porteur sur téléphone de la version de test de la PR #130 : « j'ai dû monter ambiance à 60 » ; « en ouvrant la cloison du local technique, je me serais attendu à entendre l'alarme incendie car je découvre qu'une pièce est en feu » ; des clics qui « ne s'entendent pas toujours ».
- Décision : l'ambiance vaut 60 par défaut. L'alarme incendie sonne aussi quand un feu apparaît par un passage ouvert depuis la pièce du passager (il ouvre sur une pièce en feu, ou le feu gagne la voisine), une fois, et de nouveau à chaque nouvelle vue du danger. Un son part 60 ms après sa demande, pour qu'un bruitage court ne tombe pas dans le passé sur téléphone (15 §5).
- Modifie : D-220 (défaut de l'ambiance) et D-218 (alarme incendie).

### D-224 — Vide vu par un voyant ; la créature à la première rencontre

- Date / statut : 2026-10-13 / **Validé**.
- Origine : réponses du porteur après l'essai sur téléphone : « le vide, comme le feu » ; « créature, j'aime bien Dissonance, et à la première rencontre ». Choix fait sur le banc d'écoute.
- Décision : l'alarme vide sonne aussi quand le voyant d'une porte étanche révèle une pièce sans air, aux mêmes règles que le feu (D-223). Un signal « créature » (Dissonance, 15 §3.2) sonne une seule fois, à la première rencontre que le moteur annonce ; il passe après les alarmes et avant la santé (15 §2.4).
- Modifie : D-218. Les sons de la mort et de la victoire sont choisis par D-225.

### D-225 — Sons de la mort et de la victoire

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur après l'essai sur téléphone (« il manque un son pour la victoire (fin de transmission) et pour la mort (3e dégât, boop long) ») ; « pour la mort, fais des variantes de blessure Parasite » ; « victoire, essaye un effet magnétoscope qu'on arrête » ; choix sur le banc : mort A Parasite qui s'éteint, victoire C Bande qui ralentit. Le crépitement entendu sans rien faire (« ça fait crépitement bug analog ») est accepté tel quel.
- Décision : quand la santé passe à « vaincu », le signal « mort » remplace la blessure critique ; quand l'évacuation réussit, le signal « victoire » part en dernier (15 §2.2, §2.4, §3.2).

### D-226 — Un son plus grave pour refermer les trois menus

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur après l'essai sur téléphone : « un 2e bruitage pour pouvoir fermer les menus inventaire, carte et IA Station, une variante plus grave pour la fermeture de ces menus ».
- Décision : refermer l'inventaire, la carte ou IA Station joue le Bip feutré de fermeture, plus grave et descendant, à la hauteur propre à chaque menu (15 §2.1, §3.2), quel que soit le geste : leur bouton, ✕, le voile, RETOUR, Échap ou le retour système. Les autres bulles gardent le tic.
- Modifie : D-217.

### D-227 — Mise à jour de l'appli installée ; numéro de construction

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur : « forcer la mise à jour de la PWA une fois qu'elle est ajoutée sur l'écran d'accueil du téléphone. Soit ça se fait automatiquement, ça serait idéal. Soit on rajoute un bouton dans le menu du jeu » ; « sur l'écran d'options, un numéro de version : un numéro qui s'incrémente, le numéro du dernier commit, ou les deux ».
- Décision : le jeu installé se met à jour seul, et un bouton des options force la mise à jour. Le pied de page des options porte les deux numéros : « V<version> (<construction>) · <commit> · test PR #<n> », où la construction est le nombre de commits de la version publiée, qui ne fait que croître sur la branche principale.
- Limite [détail de l'agent] : la nouvelle version est cherchée au lancement, à chaque retour dans l'appli et toutes les demi-heures au premier plan. Prête, elle s'installe aussitôt (le jeu redémarre sur l'accueil, la partie est gardée, D-022) si le joueur n'a pas encore touché l'écran depuis le lancement ou le retour dans l'appli ; sinon au prochain retour, ou par « ▸ Chercher une mise à jour » / « ▸ Installer la nouvelle version » dans la section MISE À JOUR des options. Sans réseau, la recherche automatique se tait ; le bouton dit qu'il n'a pas pu vérifier. Sans historique complet (clone superficiel), le numéro de construction est omis. Modifie le format du pied de page de D-191.

### D-228 — IA Station en bulle comme l'inventaire et la carte

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur : « le même esthétique que l'inventaire et que la carte, c'est-à-dire une bulle qui se met par-dessus l'écran avec une petite flèche au-dessus du bouton » ; précision : « retirer le bouton retour et le remplacer par une croix comme les autres menus ».
- Décision : le menu IA Station reprend la présentation de l'inventaire et de la carte : bulle superposée au-dessus de la navigation, flèche vers son bouton et même voile. Une croix dans l'en-tête remplace le bouton RETOUR. Le blanc et les messages reçus restent inchangés. Le porteur précise ensuite qu'un deuxième appui sur IA STATION doit fermer la bulle comme pour INVENTAIRE et CARTE ; il joue le son de fermeture du menu (D-226).
- Modifie : la présentation de la modale de 12 §3.9 ; la couleur blanche de D-192 est conservée. Aucun essai sur téléphone n'est attesté ici.

### D-229 — Les portes se manœuvrent depuis « Se déplacer vers »

- Date / statut : 2026-10-13 / **Validé**.
- Origine : proposition du porteur : « retirer les boutons dédiés pour les différentes portes et de le déplacer dans un sous-menu quand on clique sur un des boutons pour "se déplacer vers" […] ça libérerait de la place […] ça éviterait aussi de chercher où se trouve le bouton pour ouvrir telle porte » ; réponses « Toujours le sous-menu » et, pour les grilles, « il faut qu'ils restent des objets "dans la pièce" jusqu'à ce qu'on découvre qu'il y a un passage derrière. Ensuite ils se comportent comme une porte (refermable ou non) ».
- Décision : les portes n'ont plus de puce dans « Dans la pièce ». Chaque bouton « → DESTINATION » ouvre la bulle du passage : sa fiche, puis « ▸ Aller dans l'atelier » (indisponible avec sa raison si la porte est fermée), puis « ▸ Ouvrir » ou « ▸ Fermer ». Le bouton ouvre toujours la bulle, même quand le déplacement se jouerait d'un seul toucher ; dans la bulle, la ligne du déplacement garde le seul toucher de D-182. Un passage sans signalétique reste une puce tant que le passager ne l'a pas ouvert ; une fois ouvert, il rejoint « Se déplacer vers » et y reste, même refermé.
- Limite [détail de l'agent] : un bouton dont le déplacement est impossible (porte fermée, objet trop large) se voit au contour pointillé, sans fond, et son nom accessible porte la raison (« atelier, La porte de l'atelier est fermée. ») ; il reste activable. Un passage qui s'ouvre sans permettre d'y passer (le panneau vu du local énergie d'AR-01) reste une puce. Un passage déjà ouvert se retrouve dans les commandes enregistrées de la partie, sans changer le moteur.
- Modifie : D-147 (le passage reste dans « Se déplacer vers » une fois refermé), D-182 (un toucher de plus pour changer de pièce), 12 §3.4, §3.6 et §4.3.

### D-230 — Boutons « Se déplacer vers » sur deux colonnes, raison lue seulement

- Date / statut : 2026-10-13 / **Validé**.
- Origine : demande du porteur : « réduire la taille des boutons de destination pour qu'ils puissent rentrer sur deux colonnes » ; « retirer le texte qui indique que la cloison est fermée […] le garder pour la prise en charge de l'accessibilité. Le but final étant de récupérer de l'espace d'écran ».
- Décision : les boutons « → DESTINATION » se rangent sur deux colonnes, comme les puces, et sur une seule quand deux ne tiennent plus. La raison d'un déplacement impossible n'est pas écrite sur le bouton : le contour pointillé le signale, le lecteur d'écran lit la raison avec le nom ; elle reste écrite dans la bulle du passage (12 §3.7).
- Modifie : 12 §3.4 (boutons pleine largeur) et §3.6.

### D-231 — Le rapport s'écrit dans un panneau ouvert sous sa ligne des options

- Date / statut : 2026-10-13 / **Validé**.
- Origine : choix « A » du porteur sur la maquette comparée [rapports](maquette/rapports.html) (A : dans les options ; B : écran dédié).
- Décision : toucher « ▸ Signaler un bug » ou « ▸ Envoyer ma partie » ouvre, sous la ligne, un panneau : commentaire facultatif, ce qui est joint, ANNULER et ENVOYER ; un seul ouvert à la fois, comme la confirmation d'abandon. Une fois le rapport envoyé ou gardé sur le téléphone, le panneau se referme et laisse son retour sous la ligne. Dans une version de test, l'envoi de partie porte la case « je valide » (D-096, D-132), sans valeur de validation tant qu'elle n'est pas signée (#108).
- Précise : 12 §4.10 et §4.11 (ENVOYER MA PARTIE de l'écran de fin ouvre le même panneau).

### D-232 — La clé de validation se crée seule ; les options montrent son empreinte

- Date / statut : 2026-10-14 / **Validé**.
- Origine : choix « Automatique » du porteur, sur deux présentations comparées (création automatique ou bouton de création).
- Décision : le téléphone crée sa clé de validation au premier « je valide » envoyé, sans geste de plus. Dans les versions de test, une section VALIDATION des options montre « Clé de ce téléphone » et son empreinte en quatre groupes (« 7F3A·91C2·0B4E·D815 »), à comparer avec celle que cite le robot de la PR ; avant la première validation, « pas encore créée : elle le sera au premier « je valide » envoyé ». Quand une validation arrive signée par une clé que le dépôt ne connaît pas, le robot de la PR répond avec son empreinte et le bloc à ajouter à `docs/validation-key.json` ; le porteur l'ajoute lui-même (C-10 §5).

### D-233 — Le danger apparu s'annonce en rouge, triangle clignotant, avec son alarme

- Date / statut : 2026-10-13 / **Validé** ; étendu au vide le 2026-10-14.
- Origine : demande du porteur après une partie d'AR-01 (#138) : en ouvrant la porte du local technique sur le feu, « une alarme sonore se déclenche et convient, mais aucun indicateur visuel ne signale le danger » ; « ajouter une petite icône d'attention (triangle avec point d'exclamation), avec un clignotement rapide, devant le texte décrivant le danger, en rouge ». Puis : « Tu me fais pareil pour le vide, en même temps que l'alarme ».
- Décision : chaque fois qu'une alarme du feu ou du vide sonne (D-218, D-223, D-224), la ligne du récit qui décrit ce danger s'écrit en rouge, précédée d'un petit triangle d'attention rouge qui clignote vite ; le texte, lui, reste fixe. En mouvement réduit, le triangle est fixe. Les alarmes sonores ne changent pas. Seule exception rouge de l'écran de jeu.
- Limite [détail de l'agent] : la ligne signalée est la phrase du récit qui annonce le danger (flammes derrière un passage, feu qui gagne une pièce, air perdu) ; quand aucune ne le fait (on entre dans une pièce sans air ou en feu, un voyant rouge ou des flammes apparaissent par un passage), la ligne de « Regarder autour de vous » qui le décrit est ajoutée au récit : celle de la pièce du passager si elle est touchée (« Il n'y a plus d'air ici. »), sinon une par passage. Rien n'est signalé sans alarme. La reprise d'une partie montre les mêmes lignes. « Regarder autour de vous » et les fiches ne portent pas le repère. Rouge `#FF5A4A` (6,5:1 sur `fond`) ; triangle dessiné, 1 em, présent dès le départ (aucun décalage pendant l'écriture à la machine) ; deux éclats par seconde, sous le seuil de trois (WCAG 2.3.1) ; le lecteur d'écran lit « Attention » puis la phrase, une seule fois.
- Modifie : 12 §2.1 (pas de rouge dans l'écran de jeu) et §3.3.

## Décisions validées — règles des nouveaux morceaux (#105)

Questions posées avant de coder #105, sur des points que D-163 à D-170 laissaient ouverts ; réponses du porteur du projet le 2026-10-14, à chaque fois l'option recommandée.

### D-234 — Relance des machines et compresseur : un bruit comme l'avertisseur

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-159 « Comme l'avertisseur ».
- Décision : relancer les machines et déclencher le compresseur de la chambre froide produisent chacun un bruit fort qui dure comme le test de l'avertisseur : la réaction de l'action qui le lance et les deux suivantes (C-03 §5.1). Pendant ce temps, il l'emporte sur les autres pistes de la créature, sauf si elle voit le passager (C-03 §4.2).
- Précise : la limite de D-163 (intensité et durée de la relance) et le compresseur de D-170.

### D-235 — Machines en marche, le vacarme couvre tout pour qui est dedans

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-160 « Le vacarme couvre tout ».
- Décision : en plus de D-163, la créature qui se trouve dans la salle des machines en marche n'entend rien de ce qui se passe hors de la salle, et un bruit ne traverse pas la salle d'une porte à l'autre. Seul le bruit de la relance en sort (D-163, D-234).

### D-236 — Passerelle : deux bords qui s'entendent sans se voir

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-161 « Non, on s'entend seulement ».
- Décision : les deux bords de la salle coupée par le vide se jouent comme deux pièces voisines, reliées par le vide. Le son passe par-dessus le vide ; la vue non, il fait trop sombre. Pour attirer la créature sur la planche, on fait du bruit, ou elle a vu le passager partir par là (D-177).
- Précise : D-164.

### D-237 — Sans gravité, on dérive jusqu'à l'autre bout

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-162 « Dériver à l'autre bout ».
- Décision : gravité coupée, entrer dans la zone coûte une action, comme d'habitude. En ressortir par une autre porte que celle par où l'on est entré en coûte deux : dériver jusqu'à cette porte, puis la franchir. Ressortir par où l'on est entré en coûte une. La créature, elle, met deux réactions de plus pour dériver jusqu'à l'autre porte.
- Précise : D-165 et C-04 §3.2.

### D-238 — Interrupteurs de gravité dans les pièces aux deux bouts

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-163 « Dans les pièces aux deux bouts ».
- Décision : au départ, la gravité de la zone est coupée. Un interrupteur se trouve dans chaque pièce qui touche la zone, hors de la zone : on peut couper la gravité pendant que la créature s'y engage, sans y être soi-même.
- Précise : D-165 et la fiche M-09 (« interrupteur à chaque bout »).

### D-239 — La créature est ralentie dès qu'une porte de la chambre froide se ferme sur elle

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-164 « Une porte se ferme sur elle ».
- Décision : dès qu'une porte de la chambre froide se ferme pendant que la créature est dedans, au pupitre ou à la main en ressortant par l'autre porte, elle est ralentie pour toute la partie. Le pupitre ferme les deux portes de la chambre d'un coup.
- Précise : D-166 et D-170.

### D-240 — Le froid blesse à chaque action au-delà de deux

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-165 « Une blessure à chaque action de plus ».
- Décision : comme le feu (D-188), le passager est blessé à la troisième action de suite qu'il finit dans la chambre froide, puis encore à chaque action qu'il y finit ; c'est annoncé avant d'agir. Ressortir remet le compte à zéro.
- Précise : D-166 et C-04 §3.2.

## Décisions validées — point sur les morceaux, avant #106

Questions posées après un point d'ensemble sur les morceaux, leurs outils et la suite du jeu ; réponses du porteur du projet le 2026-10-14, citées mot pour mot dans chaque entrée, avec leurs réserves et conditions.

### D-241 — Créature mise hors jeu tôt : on mesure avant de décider

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-166 « (c), avec (b) en réserve » : (c) attendre les mesures, (b) une créature placée plus souvent près du problème final.
- Décision : si la créature est neutralisée ou enfermée dès le premier obstacle (tombée de la passerelle, ou enfermée dans la chambre froide, les deux portes fermées), la suite de la station n'a plus de menace. Seulement ralentie, une porte fermée à la main et l'autre restée ouverte, elle peut encore sortir : elle reste une menace, plus lente (D-166, D-239). On ne change rien au tirage pour l'instant : #106 mesure, sur ses tirages, la part des stations où la créature peut être neutralisée ou enfermée avant le problème final, et celle où elle ne part pas du morceau final. Le porteur décide sur ces mesures et sur ses parties.
- Limite : la réserve, une créature placée plus souvent près du problème final, modifierait D-161, D-162 et C-08 §2 ; elle demandera une décision explicite.

### D-242 — Petites stations d'abord, grandes si la durée le demande

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-167 « ok pour ta reco ».
- Décision : le lancement commence par de petites stations, environ six à dix pièces : départ, un ou deux morceaux de chemin, un morceau final et l'embarquement, sans annexes ni boucles. Les grandes stations (annexes, boucles, vingt pièces et plus) viennent avant la publication seulement si la durée mesurée des parties (15 à 30 minutes, D-008) le demande.
- Précise : D-205, qui reste possible.
- Limite : #106 assemble d'abord ces petites stations. Que #106 s'arrête au plan du chemin principal (GE-01 à GE-07) et que les annexes, les boucles et GE-08 à GE-13 passent dans une issue à part n'est pas décidé : c'est une proposition du découpage de #106 ([13 §7](13-morceaux-lancement.md#7-découpage-de-106), question 1 du §7.4). D-214 reste inchangée tant que le porteur n'a pas répondu ; s'il accepte, une nouvelle entrée portera « Modifie : D-214 ».
- Précisée par D-245 : le porteur a accepté ; #106 ne dessine que le chemin principal, et les grandes stations iront dans une issue à part.

### D-243 — Un lore léger au lancement, écrit avec soin par l'assistant principal

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-168 « oui, mais attention a l'écrIture qui doit etre de qualité c'est toi qui va le faire ».
- Décision : le lancement accueille un lore léger : quelques documents à lire dans la station (journaux de bord, notes, messages, écrans), écrits à la main, qui donnent de la profondeur à l'histoire et servent aussi d'indices pour découvrir les solutions. L'assistant principal, celui qui tient la conversation avec le porteur, les écrit lui-même, avec une exigence de qualité d'écriture ; il ne les délègue pas à un exécutant. Lire reste gratuit (D-014).
- Précise : D-116 ; ces textes restent en zone verte, fusionnés après relecture indépendante.
- Limite : la forme (nombre de documents par station, longueur, place, ce qu'un document peut révéler, effet éventuel de la lecture sur ce que sait le passager) se décide avant d'écrire, dans une conception à part. C-07 s'applique, et aucun document ne contredit l'état réel (C-05). Brancher plus tard d'autres univers, menaces ou objectifs au moment du tirage n'est pas décidé : c'est une piste de l'après-lancement ([roadmap](02-roadmap.md)).

### D-244 — Objets nécessaires hors de leur morceau : après les annexes, sans les oublier

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-169 « ok, mais a bien garder en mémoire ».
- Décision : dans #106, chaque objet nécessaire à un obstacle reste dans son morceau, à la place prévue par sa fiche. Les objets placés hors de leur morceau, comme l'eau du feu posée dans une pièce quelconque atteinte avant le feu, viendront avec les annexes (D-242).
- Limite : à garder en mémoire ; le point est inscrit dans la [roadmap](02-roadmap.md), dans [13 §6](13-morceaux-lancement.md#6-suite), dans [14 §7](14-carte.md#7-découpage) et dans [C-08 §7](contrats/C-08-stations-fins.md#7-réserves). La règle de placement reste à décider ; proposition de l'agent, que le porteur n'a pas tranchée : un objet nécessaire se poserait toujours dans la partie de la station qu'on peut atteindre avant l'obstacle qui le demande, jamais derrière, et le vérifieur le confirmerait.

## Décisions validées — découpage et règles d'assemblage de #106

Douze questions du découpage proposé de #106 ([13 §7.4](13-morceaux-lancement.md#74-questions-posées-au-porteur)), posées le 2026-10-14 ; réponse du porteur du projet le même jour : « Ok pour tes reco ». Chaque entrée reprend donc la réponse recommandée.

### D-245 — Découpage de #106 accepté ; grandes stations dans une issue à part

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-170 « Ok pour tes reco ».
- Décision : #106 avance par les sept livraisons de [13 §7](13-morceaux-lancement.md#7-découpage-de-106) : cadrage sur le papier (L0), vérifieur seul (L1), première station tirée (L2), autres morceaux par groupes (L3, L4), ordre libre et mesures sur 1 000 tirages (L5), signal « plus aucune sortie » (L6). #106 ne dessine que le chemin principal (GE-01 à GE-07). Si la durée des parties demande un jour de grandes stations (D-242), elles se feront dans une issue à part, avec annexes, boucles et GE-08 à GE-13, créée avec l'accord du porteur.
- Modifie : D-214 ; l'assemblage géométrique des stations générées ne rejoint plus #106 que pour le chemin principal.
- Précise : la limite de D-242, qui laissait ouverts l'arrêt de #106 au chemin principal et le passage des annexes, des boucles et de GE-08 à GE-13 dans une issue à part ; D-205 reste possible.
- Limite : chaque livraison garde la zone et l'essai sur téléphone indiqués en 13 §7.1 (D-098).

### D-246 — L'air de la baie gagne aussi les nouveaux morceaux, sans règle de plus

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-171 « Ok pour tes reco ».
- Décision : quand la baie est percée, l'air s'en va des pièces des quatre nouveaux morceaux comme partout ailleurs (D-061). Il passe par-dessus le vide de la passerelle, dont les deux bords forment une seule salle, et il quitte aussi la salle des machines, la zone sans gravité et la chambre froide. Aucune règle de plus : sans combinaison, le passager y meurt ; exposée, la créature y est neutralisée pour de bon, comme ailleurs (D-059, D-062).
- Précise : D-165 (cohabitation avec le vide), D-174 et C-02 §5. La baie peut donc sortir avec chacun des quatre nouveaux morceaux.

### D-247 — Le feu passe par-dessus le vide de la passerelle

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-172 « Ok pour tes reco ».
- Décision : un incendie sur un bord de la passerelle peut gagner l'autre bord, comme par une porte restée ouverte (C-03 §5.3), puisque c'est une seule salle. Le feu ne gagne toujours pas une pièce sans air (MX-02). La galerie en feu et la passerelle peuvent donc sortir ensemble.
- Précise : D-164, D-174 et C-02 §5.

### D-248 — Les obstacles qui ne jouent pas sur la même chose se mélangent sans règle de plus

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-173 « Ok pour tes reco ».
- Décision : deux morceaux qui ne touchent pas la même chose (bruit, ralentissement, neutralisation, air), par exemple la galerie en feu et la chambre froide, ou la caisse sous la grille et le local d'énergie, peuvent se retrouver dans une même station sans règle de plus, comme dans AR-01. Seuls les morceaux qui touchent la même chose attendent leurs règles de mélange.
- Précise : D-167 et C-08 §2.
- Conséquence : avec les règles de mélange de 13 §4 (D-174 : bruits entre eux, neutralisations entre elles, MX-01 à MX-05), D-246 et D-247, toutes les paires des dix morceaux sont permises, sauf M-03 et M-06 : tous deux finals, ils ne se rencontrent jamais (D-172). Un futur morceau qui joue sur la même chose qu'un autre reste refusé avec lui tant que leur mélange n'a pas de règles (D-167).

### D-249 — Le morceau final apporte l'embarquement et sa capsule

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-174 « Ok pour tes reco ».
- Décision : le problème final et l'embarquement avec sa capsule vont toujours ensemble, dans le même morceau, comme la baie où la créature attend devant la capsule. Une station enchaîne donc la pièce de départ, un ou deux morceaux de chemin, puis le morceau final avec son embarquement.
- Précise : D-172 et 13 §2.

### D-250 — L'action libre du premier contact peut faire partie d'un chemin sûr

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-175 « Ok pour tes reco ».
- Décision : un chemin sans dé ni blessure qui passe une fois sous les yeux de la créature, grâce à l'action libre qui suit le premier contact (D-184), compte comme sûr pour la vérification d'une station. Le chemin sûr de la chambre froide en dépend.
- Précise : D-084 et C-08 §3.
- Limite : une seule fois par partie, comme le premier contact (D-184).

### D-251 — Une sortie qui demande un coup de dés reste une sortie

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-176 « Ok pour tes reco ».
- Décision : tant qu'une évacuation reste possible au prix d'un coup de dés, le jeu ne dit pas « plus aucune sortie ». Le signal ne vient que si aucune évacuation n'est possible, quels que soient les dés.
- Précise : D-085 et C-08 §4.

### D-252 — Portes fermées entre les morceaux au départ

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-177 « Ok pour tes reco ».
- Décision : au départ, les portes qui relient deux morceaux sont fermées, comme les cloisons d'AR-01. La créature n'en ouvrant jamais, elle reste dans sa partie de la station tant que le passager n'ouvre pas.
- Limite : l'effet sur la menace est mesuré ensuite (D-241). [Détail de l'agent] La porte entre la pièce de départ et le premier morceau suit la même règle ; les portes intérieures d'un morceau gardent l'état prévu par sa fiche. La comparaison avec AR-01 vaut pour trois de ses quatre cloisons : celle de l'observation vers l'embarquement y est ouverte au départ (08 §11.1, O–E). Entre M-04 et l'embarquement apporté par le morceau final (D-249), elle serait fermée : sur une copie d'AR-01 où elle l'est, P-B et P-C demandent une action de plus, l'ouvrir, et restent sans dé ni blessure (essai de l'agent du 2026-10-14).

### D-253 — Au tirage, pile ou face entre les deux problèmes finals

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-178 « Ok pour tes reco ».
- Décision : une nouvelle station tire d'abord à pile ou face son problème final, énergie ou baie, puis, au pur hasard, une station parmi celles qui ont ce final. Les deux finals sortent ainsi aussi souvent l'un que l'autre, quel que soit le nombre de stations possibles avec chacun.
- Modifie : D-162 ; les stations n'ont plus toutes la même chance : le problème final se tire d'abord à pile ou face, puis la station au pur hasard parmi celles qui ont ce final. Une station déjà jouée peut toujours revenir, même deux fois de suite.
- Exception transitoire précisée par D-260 : en L2, seul M-03 est disponible ; le pile ou face s'applique lorsque les deux finals sont disponibles et vérifiés, à partir de L3.

### D-254 — Ordre libre : deux obstacles qui partent d'un même couloir

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-179 « Ok pour tes reco ».
- Décision : les obstacles à préparer « dans l'ordre que le joueur veut » peuvent prendre cette forme : deux obstacles qui partent d'un même couloir, à régler tous les deux, dans n'importe quel ordre, avant le problème final, comme l'énergie et l'accès d'AR-01.
- Précise : D-160.
- Limite : ce qui rend chaque branche nécessaire (un accès, un objet ou une alimentation que le morceau fournit, GP-01) se propose en L0 et se valide avant L5. [Détail de l'agent] L'exemple, repris de D-160 et accepté tel quel, montre seulement deux préparations menées dans l'ordre qu'on veut : dans les morceaux, l'énergie d'AR-01 est devenue le final M-03 (D-172), qui vient après les deux branches. Les deux branches sont donc deux morceaux de chemin.
- Précisée par D-259 : chaque branche donne accès à une commande distincte, qui déverrouille l'une de deux cloisons successives avant le final ; ajout explicitement accepté en L0.

### D-255 — Version de test de #106 : NOUVELLE PARTIE tire une station

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-180 « Ok pour tes reco ».
- Décision : dans la version de test de #106, NOUVELLE PARTIE tire une station au hasard ; les aventures de référence restent jouables par un lien.
- Limite : la question ne portait que sur la version de test ; ce que fait NOUVELLE PARTIE dans la version publique reste à décider. [Détail de l'agent] La question est à poser au porteur avant la fusion de L2, la première livraison où NOUVELLE PARTIE tire une station, puisqu'une fusion publie le jeu (AP-10).
- Question publique réglée par D-260 : même fonctionnement à partir de L2, avec le démarrage progressif accepté.

### D-256 — Le panneau caché sert à contourner la créature

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-181 « Ok pour tes reco ».
- Décision : dans M-05, la créature peut attendre sur le chemin normal ; le passage étroit derrière le panneau, où elle ne passe jamais, permet de la contourner. Les endroits où elle peut attendre autour de la galerie en feu (M-01) seront proposés de la même façon, avant la première station qui l'utilise.
- Précise : D-161, D-171 et les fiches M-01 et M-05.

## Décisions validées — cadrage L0 de #106 (#150)

Les quatre propositions de [13 §8](13-morceaux-lancement.md#8-cadrage-l0-150-accepté-par-le-porteur) ont été relues indépendamment, puis soumises au porteur le 2026-10-14, avec leurs recommandations et leurs détails. Il a sélectionné explicitement les quatre réponses citées ci-dessous, sans commentaire complémentaire. Il s'agit d'un accord de conception ; aucun code ni parcours humain n'est ajouté par L0.

### D-257 — Un vestibule de réveil sans danger immédiat

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-182 « Oui, ce vestibule ».
- Décision : la pièce de départ est un vestibule sans danger immédiat, sans créature ni objet, avec une porte ordinaire fermée vers la suite, à ouvrir à la main. En ordre libre, elle donne sur le couloir commun des deux branches. Les objets nécessaires restent dans leur morceau (D-244). Avant la première ouverture, le passager peut lire et consulter sans être atteint par un danger ; après cette ouverture, la pièce n'a aucune protection spéciale. Ouvrir puis franchir restent deux actions ordinaires, sans exemption aux réactions.
- Précise : GP-04 et le détail de D-252 sur la porte de départ ; fiche [13 §8.1](13-morceaux-lancement.md#81-pièce-de-départ--q-182-d-257).
- Limite : à implémenter et prouver en L2 ; aucun document du lore ni consommable bonus ajouté au départ.

### D-258 — M-01 : la créature attend seulement sur le palier après la galerie

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-183 « Oui, le palier après la galerie ».
- Décision : M-01 apporte trois pièces sur le chemin principal : pièce d'entrée avec l'eau, galerie en feu, palier de sortie, avec les deux portes intérieures fermées au départ. Sa seule place déclarée pour la créature est le palier, jamais la galerie ni la pièce avec l'eau. Ce palier appartient à M-01, pas au morceau voisin ni à une annexe. La place participe au tirage ordinaire, sans poids particulier ; aucune deuxième créature n'est ajoutée.
- Précise : D-161, D-171, D-256 et la fiche M-01 ; détails et preuves [13 §8.2](13-morceaux-lancement.md#82-créature-autour-de-m-01--q-183-d-258).
- Limite : en L4, prouver une évacuation complète sans dé ni blessure avec cette place, pas seulement l'accès à l'eau et l'extinction. Une composition qui échoue est rejetée ; d'autres places exigeraient un autre accord.

### D-259 — Ordre libre : deux commandes pour deux cloisons avant le final

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-184 « Oui, les deux commandes et cloisons » ; l'ajout de deux commandes fixes et de deux verrouillages a été présenté explicitement, avec son coût et son effet.
- Décision : en ordre libre seulement, chacun des deux morceaux de chemin donne accès, au-delà de son obstacle, à une commande distincte ; chacune déverrouille l'une de deux cloisons successives sur l'entrée commune du final. Actionner une commande coûte une action discrète, sans dé ni consommable ; le déverrouillage reste acquis pour la partie. Une cloison verrouillée ne s'ouvre pas à la main ; une fois déverrouillée, elle s'ouvre et se ferme normalement, sans ouverture automatique. Les deux cloisons appartiennent au final ; aucun chemin ne les contourne. Après chaque préparation, on revient au couloir commun ; les deux branches ne se rejoignent pas derrière les cloisons.
- Précise : D-160, D-254 et GP-01. Les deux visites et les deux apports sont nécessaires, pas un itinéraire imposé dans chaque morceau ni une rencontre dans chaque branche : la créature reste unique. Les objets restent dans leur morceau (D-244) et le problème final reste à résoudre après les deux préparations. Apports des huit morceaux et preuves : [13 §8.3](13-morceaux-lancement.md#83-deux-branches-toutes-deux-utiles--q-184-d-259).
- Limite : à implémenter et prouver en L5, en zone orange pour le moteur et le format ; aucun changement des versions en chaîne ni des stations de test existantes. Pour chaque composition publiée, les deux ordres doivent permettre une évacuation sans dé ni blessure ; omettre l'un ou l'autre des déverrouillages doit rendre toute évacuation impossible, même avec des dés favorables. Une paire permise n'est pas automatiquement une composition en ordre libre valide.

### D-260 — Version publique : une station tirée aussi, avec un démarrage progressif

- Date / statut : 2026-10-14 / **Validé**.
- Origine : réponse Q-185 « Oui, avec ce démarrage progressif ».
- Décision : à partir de L2, dans la version publique comme dans celle de test, NOUVELLE PARTIE tire une station parmi les compositions vérifiées disponibles. REJOUER CETTE STATION conserve le même départ avec de nouveaux dés ; les aventures de référence restent jouables par lien. REPRENDRE et les parties en cours ne changent pas.
- Précise : D-255 et C-08 §5 ; [13 §8.4](13-morceaux-lancement.md#84-nouvelle-partie-dans-la-version-publique--q-185-d-260).
- Modifie temporairement D-253 : en L2, seul le final énergie M-03 est disponible ; on tire parmi ses compositions vérifiées, sans tirer une baie absente. Dès que les deux finals sont disponibles et vérifiés, à partir de L3, le tirage commence par le pile ou face énergie/baie, puis choisit au pur hasard parmi les compositions de ce final ; une station déjà jouée peut toujours revenir.
- Limite : L0 reste documentaire ; aucune modification immédiate de la version publique et aucun équilibre entre deux finals revendiqué avant L3.

## Décisions validées — L2 de #106 (#152)

Deux questions sur la place de la créature dans M-07 et M-03 ont été posées au porteur le 2026-10-15, pendant la conception de L2, puis la conception lui a été soumise ; ses réponses sont citées ci-dessous, mot pour mot dans [13 §7.5](13-morceaux-lancement.md#75-première-station-tirée-l2-152). Elles sont implémentées sur la branche de L2 ; aucune partie sur téléphone n'est revendiquée.

### D-261 — M-07 : la créature attend seulement dans la soute

- Date / statut : 2026-10-15 / **Validé**.
- Origine : réponse Q-186 « Dans la soute seulement, comme la station de test ».
- Contexte : la question rappelait que la fiche plaçait la créature dans la salle des machines, seul passage vers la suite : avec elle dans cette salle, aucun passage sans risque n'existe et la vérification rejette la station ; avec elle dans la soute, un passage sûr existe (15 actions). Mesure faite par les agents avec le vérifieur sur une maquette jetable [détail de l'agent].
- Décision : dans M-07, la créature attend seulement dans la soute, comme dans la station de test, jamais dans la salle des machines.
- Modifie : la fiche M-07 acceptée par D-175, qui disait « dans la salle des machines » ([13 §3](13-morceaux-lancement.md#m-07--salle-des-machines-nouveau-d-163)) ; la place reste déclarée par le morceau (D-161).

### D-262 — M-03 : une seule pièce voisine, porte ouverte au départ

- Date / statut : 2026-10-15 / **Validé**.
- Origine : réponse Q-187 « réserve ou cabine », précisée « Une seule pièce voisine ; « réserve » ou « cabine », c'est juste son nom », pour la pièce unique ; approbation de la conception de L2 le 2026-10-15 (« Oui, on passe au plan »), dont la proposition prévoyait la porte ouverte au départ.
- Décision : M-03 apporte une seule pièce voisine où la créature attend, reliée au local énergie par une porte ouverte au départ. Cette pièce s'appelle la réserve, pour ne pas la confondre avec la cabine de la capsule [détail de l'agent].
- Précise : D-161 et la fiche M-03 ([13 §3](13-morceaux-lancement.md#m-03--énergie-ar-01-p-final)).

### D-263 — IA Station s'annonce sur son bouton, plus dans le récit

- Date / statut : 2026-10-15 / **Validé** pour le retrait du lien et la variante « ! » ; durée des pulsations [détail de l'agent] ; validation sur téléphone à venir (zone orange).
- Origine : retour du porteur du 2026-10-13 (#139) : ne plus afficher « [IA STATION] parle dans l'écouteur » dans le corps du texte, attirer plutôt l'attention sur le bouton IA STATION par un « ! » clignotant à la place du carré fixe, ou une icône « i » cerclée dans un angle ; « deux pulsations rapides, puis une pause d'une seconde, en boucle ». Variante : « un gros ! bien gras qui est par dessus le bouton » (2026-10-15) ; « En tout début et fin de partie, on laisse intégré au récit ».
- Décision : en cours de partie, le récit n'a plus de lien ni d'espace réservé pour IA Station ; un message non lu s'annonce par un gros « ! » gras posé à cheval sur le bord haut, côté droit du bouton IA STATION, à la place du carré fixe. Seul ce repère s'anime : deux pulsations rapides, puis une pause d'une seconde, en boucle ; en mouvement réduit il est fixe et visible. Au début (citation encadrée au réveil, 12 §4.2) et à la fin de la partie, IA Station reste dans le récit : à la fin, la navigation ayant disparu, le message de départ s'écrit en entier dans le même encadré, sans lien (retour du porteur du 2026-10-15 : « il faut écrire le message « Écoutille fermée, alimentation confirmée. Départ engagé ; bon voyage. » là-dedans à la place »). Le fonctionnement des non-lus (D-192), le son d'arrivée, l'historique et la citation du réveil ne changent pas.
- Limite [détail de l'agent] : cycle de 1,5 s : l'opacité du « ! » descend à 0,2 pendant 0,2 s, deux fois, dans les 0,5 premières secondes (deux éclats, sous le seuil de trois par seconde, WCAG 2.3.1), puis il reste plein une seconde ; il ne disparaît jamais tout à fait. Il est hors du flux : le bouton garde sa place, sa taille et sa zone tactile, et il ne reçoit pas le toucher. Le lecteur d'écran lit toujours « IA Station, nouveau message », une fois, sans annonce à chaque pulsation ; le repère lui est masqué. Couleur `accent`, fond `fond` pour ne pas être coupé par le contour du bouton. La variante « i » cerclé a été essayée, puis retirée : elle aurait demandé un cercle, contraire aux angles droits de la feuille de style.
- Remplace, pour l'écran de jeu en cours de partie : le lien dans le récit et le carré fixe de #98 (D-192). Modifie : 12 §2.6, §3.3, §4.0, §4.7. Conséquence : à l'écran de fin, la fenêtre d'IA Station n'est plus accessible ; le message de départ y est cité en entier, l'historique reste dans la partie.

## Décisions validées — L3 de #106 (#153)

Questions posées au porteur le 2026-10-15, pendant la conception de L3 ; ses réponses sont citées mot pour mot dans [13 §7.6](13-morceaux-lancement.md#76-baie-passerelle-sans-gravité-l3-153). Elles sont implémentées sur la branche de L3 ; aucune partie sur téléphone de M-06, M-08 ou M-09 n'est revendiquée.

### D-264 — L3 : réussie si chaque station mène à la capsule, la difficulté plus tard

- Date / statut : 2026-10-15 / **Validé**.
- Origine : réponse Q-188 « pouvoir arriver a la capsule. (la difficulté on verra plus tard) », à la question de ce qui ferait dire que la livraison est réussie. La question rappelait son retour de L2 : les stations étaient trop faciles, il suffisait de claquer la porte au nez de la créature.
- Décision : L3 est réussie si toute station tirée qui contient la baie, la passerelle ou la zone sans gravité peut se finir à la capsule, sans dé ni blessure pour qui prépare bien, prouvé avant d'être proposé. Le réglage de la difficulté se traite plus tard, hors de L3.
- Limite : L3 n'ajoute aucune règle de difficulté ; la créature placée plus souvent près du final reste une réserve (D-241).

### D-265 — L3 : conception approuvée, recherche vers le fond de la station

- Date / statut : 2026-10-15 / **Validé**.
- Origine :
  - Q-189 « go » : maquette jetable acceptée ;
  - Q-190 « go » : aucune correction aux choix par défaut annoncés ;
  - Q-191 « c'est bon » : approbation de la [conception L3](superpowers/specs/2026-10-15-baie-passerelle-gravite-design.md) et de la liste des choix des agents.
- Décision :
  - **Vérifieur :** il développe d'abord les états du morceau le plus avancé de la station, sur le même graphe et sous le même plafond. Sans résultats gardés par empreinte ni job de CI à part. Le témoin n'est plus forcément le plus court.
  - **Places de la créature :** celles des fiches. La réserve de M-08 devient le magasin, la soute de M-09 la cale ; M-06 garde l'embarquement.
  - **M-06 :** il entre par un couloir de sécurité.
  - **Stations :** à un ou deux chemins, soit 88 compositions.
  - **Noms :** une lettre par nom affiché ; une clé de texte en conflit devient propre à chaque morceau.
  - **Textes :** `check:texts` contrôle une série fixe de six stations.
- Précise :
  - D-161 et les fiches M-06, M-08, M-09 ([13 §3](13-morceaux-lancement.md#3-fiches)) ;
  - D-208 (lettres) ;
  - D-253 et D-260 (pile ou face dès L3) ;
  - les parades de l'issue #153 ([13 §7.3](13-morceaux-lancement.md#73-risques-et-écarts-relevés)).
- Limite : la fusion reste soumise à l'accord du porteur (zone orange) et à une partie au bout sur téléphone pour M-06, M-08 et M-09 (D-098).

## Décisions validées — écoutille au pupitre (#159)

### D-266 — L'écoutille s'ouvre et se ferme aussi depuis le pupitre de départ

- Date / statut : 2026-10-15 / **Validé** pour l'emplacement ; validation sur téléphone à venir (zone orange).
- Origine : issue #159 du porteur : dans la cabine, fermer l'écoutille demandait de toucher « Salle d'embarquement », « cohérent avec le fonctionnement des portes dans le reste du jeu, mais ce n'est pas intuitif dans ce cas précis ». Réponse à la question de l'emplacement : « Au-dessus de Lancer ».
- Décision : la bulle du pupitre de départ offre « ▸ Fermer l'écoutille » (ou « ▸ Ouvrir l'écoutille »), au-dessus de « ▸ Lancer », dans l'ordre de sa notice. Le bouton « → SALLE D'EMBARQUEMENT » ne change pas : « Aller », puis « Ouvrir » ou « Fermer ». Les deux lignes jouent la même commande sur la même écoutille : un seul état, que les deux endroits montrent toujours pareil. Le moteur, ses règles et ses textes ne changent pas.
- Limite [détail de l'agent] : c'est la seule option rangée à deux places de l'écran (12 §3.4) ; le fil de l'aperçu nomme l'écoutille, pas le pupitre. Toutes les cabines n'ont qu'une porte ; une cabine à deux portes demanderait de revoir la règle.

## Décisions validées — portes en ligne

### D-267 — Une ligne par salle voisine, la porte se manœuvre d'un toucher

- Date / statut : 2026-10-16 / **Validé** sur [maquette](maquette/portes.html) ; validation sur téléphone à venir.
- Origine : retour du porteur : « c'est super laborieux de naviguer quand on est devant une porte fermée […] ça fait 5 appuis de boutons pour se trouver dans la pièce suivante » ; « on utilise beaucoup les mécaniques des portes pour gérer les menaces ». Choix sur la maquette comparée : lignes et commande de porte (A) avec repères de danger (D), « pas besoin de bulle de confirmation », commande « état » (forme 2) plutôt que l'interrupteur I / O ou le verbe ; puis réponses une à une : « message et petit son refus », « on supprime la fiche : le repère de danger sur la ligne reprend le voyant », « nom sur toute la largeur, pas de commande », repères VIDE, FEU et BRUIT, BRUIT jusqu'à l'action suivante, FEU seulement vu, « nom = dériver », « jamais d'aperçu ».
- Décision : « Se déplacer vers » montre une ligne par passage connu, sur une colonne. À gauche, le nom de la salle (« → ATELIER »), plein si on peut passer, en pointillé sinon ; à droite, la commande de la porte, qui dit son état avec un témoin : « □ FERMÉE », « ■ OUVERTE ».
  - Toucher le nom joue le déplacement d'un seul toucher, sans aperçu ni confirmation, même avec un risque connu ou un coût. Si le passage est impossible (porte fermée, objet trop large, pas de pont), rien n'est joué : le récit dit la raison et le son « indisponible » retentit. Sans gravité, loin du passage, le même toucher fait « Dériver jusqu'à… » (D-237) ; au bord, il fait passer.
  - Toucher l'état ouvre ou ferme la porte d'un seul toucher, sans aperçu ni confirmation ; le récit dit ce qui se passe. Une porte qu'on ne peut pas manœuvrer montre sa commande grisée avec sa raison (12 §3.7).
  - Un passage sans porte à manœuvrer (vide d'une passerelle, passage toujours ouvert) n'a pas de commande : son nom prend toute la largeur.
  - La ligne porte un repère quand le moteur le sait : « VIDE » (voyant d'une porte étanche, plus d'air de l'autre côté), « FEU » (flammes vues par la porte ouverte ; il disparaît quand la porte se ferme), « BRUIT » (la créature a bougé derrière ce passage ; il disparaît à l'action suivante). L'huile au pied d'une porte n'a pas de repère.
  - Plus de bulle de passage ni de fiche « regarder le passage » : l'état et les repères la remplacent.
- Inchangé : un passage sans signalétique reste une puce tant qu'il n'a pas été ouvert (D-147) ; le pupitre de départ offre toujours l'écoutille au-dessus de « Lancer » (D-266) ; le moteur, ses règles et ses textes ne changent pas : c'est un rangement de l'écran.
- Limite [détail de l'agent] : sans aperçu, le coût d'un déplacement ou d'une manœuvre (bruyant, long, périlleux) n'est plus annoncé avant ; seuls les repères et le récit préviennent. L'écoutille au pupitre s'ouvre et se ferme aussi d'un toucher, comme sur sa ligne. Une commande indisponible garde son état écrit, grisé et en pointillé ; sa raison est lue par le lecteur d'écran, faute de place sur 112 px. BRUIT survit à un refus (toucher une salle fermée ne joue aucune action). Le lecteur d'écran lit le nom avec ses repères (« atelier, fermée, vide ») et la commande comme un bouton à bascule (« Porte de l'atelier, fermée »).
- Modifie : D-182 (plus d'aperçu pour les portes ni pour les déplacements), D-229 (plus de bulle de passage), D-230 (une colonne, raison dite dans le récit), D-266 (la ligne de l'écoutille suit la nouvelle forme), 12 §3.4 à §3.6 et §4.3.

## Décisions validées — L4 de #106 (#154)

Questions posées au porteur le 2026-10-16, pendant la conception de L4 ; ses réponses sont citées mot pour mot dans [13 §7.7](13-morceaux-lancement.md#77-chemins-dar-01-l4-154). Elles sont implémentées sur la branche de L4 ; aucune partie sur téléphone de M-01, M-02, M-04 ou M-05 n'est revendiquée. La réussite reste celle de D-264 : à Q-193, le porteur a répondu « 154 », compris comme un feu vert sans autre critère.

### D-268 — L4 : créature sur le palier ou dans l'atelier seulement derrière un obstacle qui permet de s'en débarrasser

- Date / statut : 2026-10-16 / **Validé**.
- Origine : réponse Q-194 « c'est bon ». La question montrait, dans la maquette jetable, la créature sur le palier ou dans l'atelier bouchant le seul passage.
- Décision :
  - M-01 garde sa place sur le palier (D-258), M-02 la sienne dans l'atelier (fiche) ;
  - une composition où la créature y bouche le seul passage n'est pas prouvée, donc jamais proposée ;
  - mesuré en L4 : 44 compositions sur 368, toutes avec la créature sur le palier ou dans l'atelier, sans M-04, M-07, M-08 ni M-10 avant.
- Précise : D-258 et la fiche M-02 ([13 §3](13-morceaux-lancement.md#3-fiches)).
- Limite : ces deux places sortent plus rarement au tirage, 22 et 17 fois sur 1 000 ([13 §7.7](13-morceaux-lancement.md#77-chemins-dar-01-l4-154)). La difficulté reste pour plus tard (D-264).

### D-269 — L4 : conception approuvée

- Date / statut : 2026-10-16 / **Validé**.
- Origine :
  - Q-195 « yes » : approbation de la [conception L4](superpowers/specs/2026-10-16-chemins-ar01-design.md) et de la liste des choix des agents ;
  - Q-196 : même façon de faire qu'en L3, tâches confiées une à une, chacune relue, puis PR et push en autonomie.
- Décision :
  - **Pièces :** celles de la conception ; chaque morceau porte ses objets, l'eau dans M-01, l'huile et la commande de l'avertisseur dans M-04 (D-244).
  - **Noms affichés** [détail de l'agent] : la conception les laissait « à finaliser » ; retenus après relecture, sans nouvelle question au porteur : M-01 « poste incendie », « tunnel technique », « palier » ; M-02 « atelier maintenance », « salle des pompes » ; M-04 « salle de contrôle », « salle d'observation » ; M-05 « local de service », « salle de tri », « hall de chargement ».
  - **Observation hors coque :** la salle d'observation n'est pas posée contre la coque.
  - **Sortie de M-04 fermée** (D-252) : la conception prévoyait la preuve sur une copie d'AR-01 ; P-B et P-C s'y jouent avec une action de plus [détail de l'agent pour le résultat].
  - **Vérification :** la vérification complète reste dans `npm run verify`, sans résultats gardés ni job de CI à part. Le porteur a accepté « environ une minute et demie » ; la mesure est au-delà : `check:stations` environ 2 min 30, le catalogue prouvé une seconde fois dans les tests, `verify` environ 9 min en local. **Point ouvert**, posé au porteur dans la PR.
  - **Textes** [détail de l'agent pour le nombre] : `check:texts` contrôle une série fixe, de dix stations.
  - **Preuves :** captures des nouvelles stations et liens de validation avec la créature dans le morceau.
- Limite : la fusion reste soumise à l'accord du porteur (zone orange) et à une partie au bout sur téléphone pour M-01, M-02, M-04 et M-05 (D-098).

Détails de l'agent pour #174 (installation de la PWA), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : seule l'étape A de [16](16-installation-pwa.md) est livrée, une section « INSTALLATION » des options, sans rappel à l'accueil (12 §4.1 reste tel qu'il est validé) ; sur Chrome, Edge et les autres Chromium le bouton ouvre la boîte d'installation du navigateur, et après un refus il disparaît, l'événement du navigateur ne servant qu'une fois ; Safari sur iPhone et iPad et Firefox sur Android n'ont qu'une bulle d'aide à quatre étapes, les noms des boutons d'iPhone étant ceux du guide français d'Apple et ceux de Firefox ceux que le porteur a donnés (leur traduction française n'est pas confirmée) ; les autres navigateurs d'iPhone (Chrome, Edge, Firefox) ne reçoivent rien, leurs menus n'ayant pas été vérifiés ; rien dans une version de test ni dans l'appli déjà installée ; l'installation est gardée dans `localStorage` (`void-walker:installation`) quand le navigateur l'annonce ou au premier lancement depuis l'écran d'accueil, ce qui n'aide pas sur iPhone où l'appli installée a son stockage à part ; trois tests de `tools/check-texts.test.ts` sont accélérés, parce que l'un d'eux frôlait son délai de 5 s sur le serveur de vérification et faisait échouer la PR sans rapport avec elle : celui des messages d'IA Station ne prouve plus que la station dont il a besoin (9 s, puis 0,1 s) et les deux qui relisent les dix stations contrôlées partagent leur preuve (28 s, puis 19 s) ; la seconde preuve du test des témoins est gardée, c'est son objet ; aucun essai sur téléphone n'est attesté.

Détails de l'agent pour #154 (chemins d'AR-01), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : le dossier `.superpowers` est ignoré par les contrôles du dépôt ; les récits « arroser » et « déplacer » du socle sont réécrits en deux phrases (D-111), et l'extinction est racontée sans supposer d'air ; dans `m10-m02-m03-atelier`, le témoin attire la créature vers l'entrepôt de M-10, où elle reste, sans l'enfermer dans la chambre froide ; MX-02 se joue depuis un état préparé, tunnel rallumé, car on ne traverse pas le tunnel en feu sans blessure et rien ne le rallume une fois arrosé ; le cas « pas de feu sans air » n'est pas atteignable en jeu, car l'air se règle avant le feu.

Détails de l'agent pour #108 (signature des validations), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : clé ECDSA P-256 créée par WebCrypto, privée non exportable, gardée dans une base IndexedDB à part, commune à la version publique et aux versions de test d'une même adresse (un iPhone garde à part l'appli installée et Safari : deux clés possibles, d'où une liste de clés dans le fichier) ; « je valide » n'est offert que pour une partie allée au bout (D-099), depuis une version de test : dans les options pour une partie finie, et par ENVOYER MA PARTIE, ajouté sous NOUVELLE PARTIE à la fin d'une victoire ou d'une défaite ; jamais après un abandon ; l'attestation signée lie la PR, le commit, la version, le monde, la graine, le nombre d'actions, l'empreinte de l'état final, la fin obtenue, l'empreinte de la partie jointe et le commentaire ; le robot refuse une signature étrangère, une autre PR, un commit qui n'est pas dans la PR, une partie changée ou non finie ; il répond dans la PR (reconnue, refusée avec sa raison, ou clé inconnue) et pose l'étiquette `validation-reconnue` ; une case cochée sans signature ne reçoit pas de réponse ; le robot tourne toujours sur le code de la branche principale et se relance à la main après l'ajout d'une clé ; la CI signale toute modification de la clé ou du code qui la vérifie (`app/validation.ts`, `tools/reconnaitre-validation.ts`, le workflow et son script de surveillance) par un avertissement et, dans une PR, par un commentaire du robot, sans échec (d'abord en échec ; le porteur a trouvé la croix rouge trompeuse) ; le panneau d'envoi montre l'empreinte de la clé sous « je valide », car l'écran de fin n'a pas d'options (retour du porteur après essai) ; la réponse du robot donne la ligne à recopier dans le journal des parties humaines.

Détails de l'agent pour #107 (service de rapports), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : limites du service par appareil (adresse hachée avec un sel tiré par le service, oubliée en un jour) : 20 s entre deux rapports, 6 par heure, 20 par jour ; 100 rapports par jour pour tout le service ; un rapport identique (même partie au même point, même commentaire) est un doublon pendant 24 h, rendu comme déjà reçu ; le jeu attend lui aussi 20 s entre deux envois ; au plus 10 rapports gardés sur l'appareil, renvoyés au lancement, au retour du réseau et à l'ouverture des options, le service qui refuse un rapport l'efface de la file ; commentaire limité à 1 000 caractères, rendu inerte dans un bloc de code (ni mention, ni lien, ni image) ; l'issue de bug joint aussi le texte affiché à l'écran ; un bug peut être signalé sans partie en cours, avec son seul commentaire ; « Envoyer ma partie » est offert pour une partie finie comme en cours ; une version de test dont la PR est fermée envoie une issue qui cite la PR ; les issues portent les étiquettes `rapport-bug` et `rapport-partie` ; une partie trop longue pour GitHub est jointe compressée ; seules la version publiée, les versions de test et les essais locaux (`localhost:5173`, `localhost:4173`) peuvent envoyer ; textes des retours écrits par l'agent.

Détails de l'agent pour #96 (options, téléchargement, fin d'abandon), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : toutes les tailles de texte suivent le réglage dans la même proportion que le récit (17, 19, 22 px) ; les puces du dock passent sur une colonne quand deux ne tiennent plus (texte agrandi sur un écran étroit), jamais plus de deux ; INVENTAIRE et IA STATION se coupent à la syllabe avec un trait d'union s'ils ne tiennent pas ; badge et engrenage passent sous un nom de pièce trop long ; « le jeu est en pause » seulement quand une partie est en cours ; l'engrenage disparaît à la fin d'une partie, comme la navigation ; REJOUER CETTE STATION et NOUVELLE PARTIE font la même chose tant qu'il n'y a qu'une station par monde (#106) ; fichier `void-walker-<monde>-<AAAA-MM-JJ-HHMM>.json`, retour « Fichier prêt : <nom> » dès que le navigateur l'a reçu, sans savoir s'il l'a rangé ; phrase d'aperçu de la taille et récit court d'abandon (« Vous en restez là, dans <pièce>. ») écrits par l'agent ; un appareil qui refuse de garder les réglages est signalé dans les options ; pas encore de section SON ni de Signaler un bug / Envoyer ma partie (#99, #107).

Détails de l'agent pour #102, à revoir par le porteur au besoin : chaque pièce exposée deux fois de suite prend feu dans la même mise à jour, sans enchaînement (C-03 §5.3 ; l'aperçu ne dépend ainsi d'aucune liaison cachée) ; l'eau s'utilise sur la pièce du passager ou sur une voisine par un passage ouvert ; déplacer la caisse est un geste discret (AR-01 §12) ; le test de l'avertisseur s'annonce sans coût, le son étant émis dans une autre pièce ; sortir de l'alcôve coûte une réaction à la créature, comme y entrer (C-03 §4.3) ; un bruit fait dans sa propre pièce l'en fait sortir ; à terre après une glissade, elle est montrée comme telle au passager.

Détails de l'agent pour #103 (AR-01 jouable), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : la destination de la grille A–P reste inconnue jusqu'à son premier franchissement, et aucun texte ne nomme une pièce vue seulement par un passage à destination inconnue (OP-03) ; le panneau P–E n'existe pas vu de l'embarquement avant sa découverte, se voit « panneau » sans destination ni « aller » depuis le local énergie, et l'ouvrir le découvre, l'ouvre et révèle sa destination (AR-01 §11.1, §15.4, K-05) ; une découverte ne s'oublie pas ; l'écoutille ne se manœuvre que de l'intérieur (remplacé par D-196) ; la cabine est une sous-position (C-02 §2) : ni découverte ni carte ; le bloc porté rend indisponibles les passages étroits, « trop large », sans être déposé (C-02 §6) ; installé, il ne se retire plus ; la console réarmée le reste et son relais est un bruit fort ; le départ est indisponible capsule non alimentée, cabine ouverte, ou créature à bord ; le deuxième message d'IA Station arrive à la première entrée dans le local énergie (« en consultant l'énergie », AR-01 §15.2) ; les messages d'IA Station se lisent à part du récit et ne comptent pas dans ses deux à quatre phrases ; le récit d'une action où plusieurs choses arrivent ensemble (feu qui gagne, blessure, menace) peut dépasser quatre phrases : le contrôle le signale en avertissement hors des pas des parcours témoins, en attendant l'arbitrage du porteur (D-111).

Détails de l'agent pour #104 (AR-02 jouable), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : la baie est un objet fixe « vitrage extérieur », pas un passage ; percer demande la découpeuse en main et ne vise qu'un vitrage extérieur de la pièce ; la combinaison s'enfile depuis la pièce ou la main, et peut aussi se prendre ; enfilée, elle protège jusqu'à ce qu'on la retire, et ne se pose pas sans l'avoir retirée ; les voyants d'une porte disent l'air de l'autre côté, porte ouverte ou fermée, si sa destination est connue ; les annonces d'air perdu ou revenu nomment les mêmes pièces connues que l'aperçu ; l'aperçu de percer, d'ouvrir ou de reboucher nomme les pièces connues (visitées, ou nommées par une porte de la pièce) qui perdront ou retrouveront l'air ; la créature exposée au vide est expulsée par la brèche si elle est dans la pièce percée, sinon inerte sur place ; un corps inerte découvert ne compte pas comme premier contact et s'annonce à chaque arrivée dans sa pièce ; s'il gisait dans la cabine, il bloquerait le départ comme la créature (cas impossible dans AR-02) ; la créature que le vide atteint à ce pas n'intercepte pas (devenu D-194) ; P-V3 passe sans dé (devenu D-193, puis remplacé par D-195 : un dé) ; les options impossibles (enfiler deux fois, percer une baie percée, reboucher sans brèche) sont absentes du menu et refusées sans coût ; les voyants comptent pour toute liaison visible à destination connue, grille comprise (pas de grille dans AR-02) ; la capsule d'AR-02 part sur sa propre réserve ; aucun message d'IA Station au départ ; AR-01 et le monde de test reçoivent des textes courts pour les nouvelles clés.

Détails de l'agent pour #105 (nouveaux morceaux), proposés dans la PR et à revoir par le porteur ; aucun n'est une décision : les deux bords de la passerelle sont deux pièces reliées par une liaison « vide », toujours ouverte, sans porte à ouvrir ni fermer ; que l'air et le feu passent aussi le vide n'est pas décidé (seul le son l'est, D-236), et ces mélanges restent refusés par l'assemblage (remplacé par D-246 et D-247 : l'air et le feu passent le vide, et la passerelle peut sortir avec la baie comme avec la galerie en feu) ; un vide sur des flammes se raconte comme tout passage ouvert sur le feu ; on ne verse pas d'huile au bord du vide, seulement au pied d'une porte (D-190) ; le pont se pose par « Poser en travers » (le vide visé en paramètre) et se reprend par « Prendre » de l'un ou l'autre bord ; sans pont, « aller » est indisponible (« Il faut de quoi franchir le vide ») ; la créature tombe au moment de s'engager, sauf si elle glisse sur une huile de son côté avant ; tombée, elle n'a plus de place dans la station et la planche est perdue ; le passager l'entend s'il se tient sur l'un des deux bords, ou d'une pièce voisine de l'un d'eux par un passage qui laisse passer le son (retour du porteur après une partie de M-08 : rien ne disait ce qui s'était passé) ; revenu sur un bord, il voit que la planche n'est plus là, des éclats de bois au bord du vide ; un touret de câble, encombrant, est rangé avec la planche dans la station de test ; sans gravité, la dérive est une action à part, « Dériver jusqu'à… », offerte vers chaque passage sauf celui au bord duquel on se tient, et « aller » vers un autre passage reste indisponible, « il faut d'abord dériver » ; ouvrir et fermer les portes de la zone ne demandent pas de dériver ; la créature arrivée par un passage s'y tient, et si la gravité revient pendant qu'elle dérive, elle franchit dès la réaction suivante ; à mi-dérive, elle peut encore repartir aussitôt par le passage d'où elle vient ; couper ou rétablir la gravité et arrêter les machines sont des gestes discrets ; les machines tournent au départ ; les arrêter fait taire une relance en cours ; dans la salle des machines en marche, un geste bruyant ne s'annonce plus « bruyant » et se raconte couvert par le vacarme, et la créature qui s'y trouve n'entend rien, pas même un bruit né dans la salle, sauf la relance ; le compresseur se déclenche comme l'avertisseur, son bruit né dans sa propre pièce, et s'annonce « bruyant » ; plusieurs bruits forts peuvent courir ensemble, un par dispositif ; le pupitre de fermeture, « Fermer la chambre depuis… », ferme toutes les portes de la chambre et ne les rouvre pas ; il est toujours offert, pour ne rien dire de portes que le passager n'a pas vues, et son récit dit seulement que les verrous s'enclenchent ; ralentie, la créature saute aussitôt la réaction du pas où la porte se ferme, puis une sur deux ; une interception prend sa réaction et la suivante est sautée ; pendant la réaction sautée elle ne peut pas intercepter, et l'aperçu le reflète ; vue, elle est décrite couverte de givre, « figée un instant » avant une réaction sautée ; le froid compte les actions finies dans la chambre, l'entrée comprise, et s'annonce « certain » à partir de la troisième ; avec le feu dans le même pas, les textes de brûlure l'emportent ; le bloc d'AR-01 est déclaré encombrant (C-02 §5), sans effet sur ses parcours ; les stations de test M-07 à M-10 ont un plan de pont simple, dessiné par l'agent, et chacune a une capsule déjà alimentée pour aller au bout ; dans M-10, la créature, voisine de la chambre comme le veut la fiche, y entre au pas où le compresseur démarre : le parcours au compresseur passe par le premier contact, et ressortir par l'autre porte est libre (D-184) ; le parcours risqué de la fiche (se faire suivre) y passe aussi sans dé grâce au premier contact, et se jouerait au dé ensuite ; les textes des nouvelles règles sont partagés par tous les mondes, ceux des stations de test aussi ; ils sont écrits par l'agent.
