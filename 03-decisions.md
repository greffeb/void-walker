# Void Walker V2 — journal des décisions

> **Statut :** JOURNAL ACTIF — seules les entrées « Validé » font autorité.
> **Mise à jour :** 2026-10-09.

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

- Date / statut : 2026-10-09 / **Proposé**.
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


