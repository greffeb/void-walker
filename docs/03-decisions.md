# Void Walker V2 — journal des décisions

> **Statut :** JOURNAL ACTIF — seules les entrées « Validé » font autorité.
> **Mise à jour :** 2026-10-11.

## Règles

- **Proposé** : recommandation ou option, interdite à traiter comme exigence acceptée.
- **Validé** : choix explicite du porteur du projet ; indiquer l'origine.
- **Remplacé par D-xxx** : historique conservé, nouvelle décision référencée.
- **À décider** : question ouverte, pas une valeur par défaut.

Une approbation globale du travail ne valide pas automatiquement toutes les options de design évoquées. Les seuils et détails absents ne doivent pas être inventés au moment de coder.

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


