# Void Walker V2 — contrats à construire ensemble

> **Statut :** REGISTRE DE CONTRATS ET QUESTIONS — propositions non encore figées sauf référence explicite à une décision validée.
> **Mise à jour :** 2026-10-09.

## 1. Ce qu'est un contrat ferme

Un contrat décrit une règle acceptée avec : identifiant/version, entrées, sorties, préconditions, effets autorisés, erreurs, invariants, exemple normal, contre-exemple et preuve attendue.

Il ne se limite ni à une interface TypeScript ni à « cette fonction doit marcher ». Il exprime aussi ce que l'implémentation ne doit jamais faire. Un agent peut choisir une implémentation dans ces limites ; il ne peut pas changer les limites pour faire passer ses tests.

Les contrats seront détaillés après les arbitrages produit qui leur donnent un sens.

## 2. Catalogue proposé

| Contrat | Question couverte | Éléments déjà choisis | Éléments à arbitrer |
| --- | --- | --- | --- |
| C-01 Actions et options | Que peut-on choisir, et comment ? | Socle v0.1 accepté, D-027 | Confirmation UI détaillée et vocabulaire d'actions |
| C-02 Monde et entités | Qu'est-ce qui existe et où ? | D-015 pièces et positions relatives | Conteneurs, objets composés, identités et propriétés |
| C-03 Tour et temps | Qu'est-ce qui fait avancer le monde ? | v0.1 accepté dans la portée AR-01, D-056/D-057 | Extension au vide et aux autres contenus, représentation technique |
| C-04 Risques et résolution | Quand un dé est-il justifié ? | v0.1 accepté dans la portée AR-01, D-055/D-057 | Calibrage humain et risques hors référence |
| C-05 Conséquences | Comment un succès devient-il un changement réel ? | Socle v0.1 accepté, D-027 ; ordre AR-01 fixé par C-03 | Sauvegarde détaillée, vide et autres réserves adjacentes |
| C-06 Observation et connaissances | Que sait chaque joueur/adaptateur ? | Playtester sans accès caché demandé | Révélations, secrets, indices, parité des interfaces |
| C-07 Narration | Que peut affirmer le texte ? | Jeu sans LLM, D-004 | Composition, grammaire, variations, faits permis |
| C-08 Scénarios et fins | Qu'est-ce qui rend une aventure valide ? | D-017 une famille, D-018 évacuation, D-013 défaite définitive | Forme générée, solutions, échecs irréversibles, solveur |
| C-09 Sauvegarde et replay | Qu'est-ce qui doit rester identique ? | D-013 pas de retour, D-022 autosave par action et reprise exacte | Flux aléatoires, erreurs d'écriture, versions et migrations |
| C-10 Preuves et gouvernance | Qui peut déclarer une version prête ? | D-010 validation téléphone | Statuts, invalidation, intégrité et zones de merge |

## 3. Invariants techniques proposés

Ces formulations sont proposées pour validation, pas encore figées comme API :

- Un objet a une identité d'instance indépendante de son modèle ; deux exemplaires identiques peuvent exister sans se remplacer.
- Une tentative refusée pour précondition invalide n'est jamais racontée comme réussie.
- Un transfert échoué ne détruit pas l'objet à son emplacement d'origine.
- Une modification de texte ou de langue ne change pas l'identité de la commande.
- Toute conséquence racontée comme un fait provient d'un événement réellement appliqué.
- Un décès ou changement de lieu a une seule vérité dans l'état canonique.
- Le passage du temps respecte un contrat commun, quel que soit l'adaptateur ou la famille d'action.
- L'observation du joueur ne révèle pas l'état caché au motif qu'un outil de test en a besoin.
- La relecture d'une même session sur la même version ne dépend pas d'un nombre approximatif de tirages.
- Les modifications du vérificateur ne peuvent pas auto-certifier le comportement qu'elles viennent d'assouplir.

## 4. Registre de questions

### Bloc A — fondations : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-01 Priorité d'expérience | Résoudre les situations par créativité | D-005 |
| Q-02 Interaction | Actions contextuelles composables, sans texte libre | D-006 |
| Q-03 Hasard | Dés seulement face à un risque réel | D-007 |
| Q-04 Durée | 15–30 minutes par partie complète | D-008 |
| Q-05 Arrivée du projet | Petit jeu complet publié en PWA | D-009 |

### Bloc B — règles structurantes : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-06 Échec et reprise | Pas de retour ; nouvelle partie après défaite | D-013 |
| Q-07 Passage du temps | Seulement les actions engageantes ; consultation gratuite | D-014 |
| Q-08 Espace | Pièces avec positions relatives simples | D-015 |
| Q-09 Personnage | Un personnage fixe pour la première version | D-016 |
| Q-10 Variété de lancement | Une famille de scénarios avec situations générées | D-017 |

### Bloc C — situation de référence : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-11 Objectif commun | S'échapper d'un vaisseau ou d'une station | D-018 |
| Q-12 Créativité exemplaire | Dépressurisation, huile/glissade, caisse/marchepied, panneau/passage secret, eau/extinction | D-019 |
| Q-13 Information sur les risques | Niveau de risque et conséquences connues | D-020 |
| Q-14 Ressources essentielles | Santé, consommables et menace réactive | D-021 |
| Q-15 Interruption mobile | Une sauvegarde automatique après chaque action | D-022 |

### Bloc D — profondeur des règles : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-16 Portée des dangers | Propagation simple par passages ouverts | D-023 |
| Q-17 Nouvelle tentative | Oui, en payant de nouveau coûts et risques | D-024 |
| Q-18 Affrontement direct | Seulement se protéger, détourner ou fuir | D-025 |
| Q-19 Options de manipulation | Manipulations plausibles, sans résultat secret annoncé | D-026 |

### Bloc E — acceptation et modèle de lancement : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-20 Premiers contrats | Socles C-01 et C-05 validés, questions ouvertes réservées | D-027 |
| Q-21 Santé | Quelques états de blessure | D-028 |
| Q-22 Menace | Une menace principale persistante par partie | D-029 |
| Q-23 Cadre | Une station spatiale isolée | D-030 |

### Bloc F — aventure de référence, cadre : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-24 Personnage et arrivée | Passager réveillé pendant le confinement | D-031 |
| Q-25 Menace physique | Créature organique sensible au bruit | D-032 |
| Q-26 Objectif matériel | Rétablir l'alimentation du départ | D-033 |
| Q-27 Dose de récit | Voix distante aux messages scriptés | D-034 |

### Bloc G — aventure de référence, carte et approches : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-28 Carte | Conserver les six pièces et les détours comme base | D-035 |
| Q-29 Alimentation | Circuit bruyant ou bloc transportable plus discret | D-036 |
| Q-30 Voix | Assistance automatisée scriptée | D-037 |
| Q-31 Dépressurisation | Réserver ce cas à une deuxième référence | D-038 |

### Bloc H — référence, temps et stratégies : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-32 Unité d'action | Un pas par action élémentaire, consultation gratuite | D-039 |
| Q-33 Premier contact | Avertissement puis une action pour réagir | D-040 |
| Q-34 Blessures | Indemne → blessé → critique → défaite ; soin d'un état | D-041 |
| Q-35 Préparation | Peut supprimer entièrement le jet | D-042 |
| Q-36 Taille du bloc | Trop volumineux pour les accès de maintenance | D-043 |
| Q-37 Créature et conduits | Créature incapable de les franchir, autres chemins possibles | D-044 |
| Q-38 Diversion | Test d'avertisseur réutilisable de P vers O | D-045 |
| Q-39 Assistance | Fiable sur les systèmes, limitée sur la menace | D-046 |

### Bloc I — référence, menace lisible : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-40 Cloisons | La créature ne détruit pas les cloisons fermées dans AR-01 | D-047 |
| Q-41 Comportement | Traque réactive, pas de patrouille permanente | D-048 |
| Q-42 Huile | Glissade certaine puis deux réactions perdues ; danger ensuite connu | D-049 |
| Q-43 Difficulté | Au moins un parcours sûr par préparation, sans jet obligatoire | D-050 |

Les sections 11 à 16 de l'[aventure AR-01](08-aventure-reference.md) portent un état initial précis et trois témoins sur papier, acceptés ensuite par Q-50/D-057. Aucun plan écrit ne devient une référence jouée.

### Bloc J — référence, ressources et sortie : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-44 Ressources | Une eau, une huile non inflammable, un soin, sans slots/poids dans AR-01 | D-051 |
| Q-45 Jet défavorable de fuite | Le personnage passe mais subit une blessure | D-052 |
| Q-46 Cumul | Une aggravation ordinaire maximale par engagement | D-053 |
| Q-47 Départ | Entrer, fermer, lancer avec toutes les conditions physiques | D-054 |

### Bloc K — réglages et acceptation de conception : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-48 Fuite exposée | D6, 4–6 sans aggravation ; 1–3 avec aggravation ; une réaction hostile au maximum | D-055 |
| Q-49 Tour et feu | Action → feu → réaction → conclusion/sauvegarde ; propagation à deux engagements | D-056 |
| Q-50 Référence | AR-01 v1.0 acceptée comme conception, pas comme partie exécutée | D-057 |

## 5. Socles formels acceptés

- [C-01 — Actions et observation publique](contrats/C-01-actions-observation.md) : commandabilité, indisponibilité, secret et parité d'adaptateurs.
- [C-03 — Temps, dangers et réactions](contrats/C-03-temps-reactions.md) : ordre, perceptions et compteurs ; portée AR-01.
- [C-04 — Risques, blessures et soin](contrats/C-04-risques-blessures.md) : états, fuite exposée, résultat partiel et plafond ; portée AR-01.
- [C-05 — Monde et conséquences cohérentes](contrats/C-05-monde-consequences.md) : identité, déplacement, dangers, effets, persistance et preuves.

**C-01 et C-05 v0.1 sont acceptés par Q-20 / D-027**. Leurs réserves explicites restent ouvertes ; cette validation ne vaut ni implémentation terminée ni parcours accepté sur téléphone. Les autres invariants proposés dans le registre n'acquièrent pas automatiquement le même statut s'ils ne font pas partie de ces contrats.

**C-03 et C-04 v0.1** extraient les règles acceptées d'AR-01 par Q-48 à Q-50 / D-055 à D-057. Cette portée n'autorise pas de nouveaux dangers ou formats de sauvegarde non arbitrés. Aucun code ni test de ces contrats n'est réalisé.

## 6. Contrats par l'exemple

Voir les [cinq interactions de référence](07-interactions-reference.md). L'intention de chaque situation est validée par D-019. Pour la portée AR-01, leurs modalités applicables sont fixées par AR-01/C-03/C-04 ; les extensions hors de cette fixture et la dépressurisation restent à préciser.

Exemple de traduction en contrat : déplacer une caisse doit changer son emplacement, puis la règle d'accessibilité doit lire cet emplacement. Un texte « vous atteignez la grille » ou un drapeau propre à une salle ne suffit pas à prouver l'interaction générique.

## 7. Prochaine séance de cadrage

1. Concevoir AR-02, cas de dépressurisation préparée, dans la même famille d'évacuation. Le document n'existe pas encore.
2. Compléter C-02/C-06 à partir des besoins réellement acceptés : identité, relations, connaissances et représentation publique, sans moteur physique universel.
3. Borner C-08/C-09/C-10 : génération/conditions de fin, sauvegarde/replay, critères de preuve et gouvernance.
4. Fixer le volume et les variations du lancement, l'architecture et les issues exécutables ; les profils d'agents et leurs accès ne sont pas encore installés.

Q-01 à Q-50 sont répondus ; les prochains numéros d'entretien commencent à Q-51. Les choix de référence et leurs paramètres sont déjà conservés : ne pas refaire l'entretien par défaut.

### Sujets encore ouverts, sans ordre imposé

- Dépressurisation préparée dans AR-02 ; ne pas réintroduire un duel ou compagnon physique pour étendre ce cas.
- Types d'objets, transformations, inventaire et ressources ; quoi omettre volontairement.
- Règles et risques hors de la portée d'AR-01 ; information visible sans fuite des secrets.
- Génération, fins, connaissance et cas d'absence de solution.
- Ton, écriture, langues, carte, assets/audio et confort de lecture.
- Appareils de validation, offline, sauvegardes, mises à jour et publication.
- Budget, cadence humaine, services déjà disponibles et contraintes d'exploitation.
- Zones de merge et isolation des agents ; sens exact du rôle `script-writer`.

On pose les questions en petits blocs. Pas de formulaire de cinquante choix techniques avant d'avoir une boucle de jeu claire.
