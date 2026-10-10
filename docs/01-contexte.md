# Void Walker V2 — contexte

> **Statut :** CADRAGE PARTIEL — les éléments validés sont référencés ; le reste demeure à décider.
> **Mise à jour :** 2026-10-10.

## Produit recherché

Jeu narratif solo d'horreur spatiale, mobile-first, principalement textuel, avec carte et éventuellement des visuels d'objets. Distribution web/PWA, installable sur smartphone. La publication en stores est une extension future, pas la condition de fin du premier lancement PWA.

La priorité est de **résoudre des situations par créativité** : manipuler des objets et l'environnement, découvrir des solutions différentes et constater des conséquences persistantes. L'histoire et la survie soutiennent cette priorité ; elles ne justifient pas de multiplier les systèmes sans décision explicite.

Le joueur utilise des **actions contextuelles composables**, sans parser de texte libre. Le rôle des dés est limité aux situations comportant un risque réel. La durée d'une partie complète, du début à une conclusion, vise **15 à 30 minutes**.

Références : D-001 à D-009 dans le [journal des décisions](03-decisions.md).

## Boucle retenue au deuxième entretien

- **Défaite :** fin de la partie, sans revenir annuler les décisions ; nouvelle partie ensuite (D-013).
- **Temps :** lecture, menus et consultation des objets gratuits ; seules les actions engageantes peuvent coûter du temps (D-014). Le coût exact des observations spécialisées reste à distinguer d'une simple consultation.
- **Espace :** carte de pièces avec positions relatives simples, telles que devant une porte ou derrière un meuble ; pas de grille tactique (D-015).
- **Personnage :** un personnage fixe pour cette version (D-016). Ses capacités et son identité restent à définir.
- **Rejouabilité au lancement :** une famille de scénarios, plusieurs situations générées (D-017), pas trois campagnes à migrer.

## Situations retenues au troisième entretien

- Objectif commun : s'échapper d'un vaisseau ou d'une station (D-018).
- Créativité exemplaire : dépressurisation préparée, sol rendu glissant, caisse utilisée comme marchepied, accès secret découvert derrière un panneau et extinction d'un feu (D-019).
- Risque qualitatif et conséquences connues avant tentative, pas de pourcentage (D-020).
- Santé, consommables et menace réactive ; pas d'échéance globale ni de jauges permanentes de faim, fatigue ou O₂ (D-021).
- Une autosave après chaque action engagée, reprise exacte de la partie active, sans retour sur un ancien tour ni nouveau résultat de dé (D-022).

Les [interactions de référence](07-interactions-reference.md) précisent les modalités proposées, qui ne sont pas encore toutes acceptées.

## Limites retenues au quatrième entretien

Les dangers peuvent se propager simplement par les passages ouverts (D-023). Une tentative peut être recommencée si ses préconditions tiennent toujours, contre de nouveaux coûts et risques (D-024).

Pas de boucle de duel classique : protection, diversion, préparations environnementales et fuite priment (D-025). Les outils agissant sur le décor ne sont pas supprimés par ce choix.

Les menus exposent des manipulations plausibles des éléments connus, pas une liste de solutions ou de résultats secrets (D-026).

## Cinquième entretien : premiers socles acceptés

C-01 et C-05 v0.1 sont acceptés, avec leurs réserves explicites (D-027). L'implémentation et la validation sur téléphone restent à faire.

Le cadre de lancement est une **station spatiale isolée** (D-030). Le personnage fixe possède une santé exprimée par **quelques états de blessure** (D-028), face à **une menace principale persistante** dont l'emplacement et les réactions sont suivis (D-029).

## Aventure de référence désormais conçue

L'[aventure AR-01 v1.0](08-aventure-reference.md) est acceptée comme conception (D-057) : un passager réveillé pendant le confinement doit alimenter puis quitter une capsule, dans six pièces reliées par deux détours. Une assistance automatisée scriptée l'informe sur les systèmes ; une créature organique sensible au bruit réagit dans le monde réel.

Trois parcours témoins sont décrits sur papier : maintenance/circuit, voie normale/bloc/avertisseur, bloc/seuil huilé. Ils doivent être prouvés par le futur moteur ; la durée et l'intérêt se mesureront sur téléphone. La dépressurisation est traitée par une deuxième référence courte, [AR-02](09-aventure-reference-vide.md), acceptée en conception : quatre pièces, combinaison, baie à percer et rustine (D-058 à D-074).

Les [contrats de temps](contrats/C-03-temps-reactions.md) et de [risque/blessure](contrats/C-04-risques-blessures.md) formalisent les règles acceptées pour AR-01. Ils ne remplacent pas les contrats encore absents de génération, sauvegarde et gouvernance.

## Objectif du chantier documentaire

Le livrable de la préparation est un starter pack permettant à d'autres conversations d'exécuter le projet de façon continue, sans reconstruire le contexte et sans inventer des règles manquantes.

Les agents écrivent le code, les tests et les outils. Le porteur du projet décide du produit, examine les preuves et joue les versions candidates sur téléphone. Le workflow s'inspire de Lacets, avec des garanties adaptées à un jeu plutôt qu'à un objet imprimé.

## Leçons du prototype précédent

Un audit local du 09/10/2026 a notamment reproduit :

- actions annoncées comme réussies sans effets persistants ;
- pertes d'objets à inventaire plein et perte de propriétés après ramassage ;
- divergence entre PNJ mondial et PNJ de combat ;
- effets d'obstacles incohérents avec l'intention sociale du joueur ;
- texte narratif et état mécanique qui se contredisent ;
- campagnes de bots couvrant moins de scénarios que leur présentation ne le suggérait ;
- reprise et localisation incomplètes malgré une suite de tests verte.

Conséquence pour la V2 : la présence d'un fichier, d'un registre de verbes ou d'un test unitaire ne prouve pas qu'une interaction fonctionne depuis l'interface jusqu'à sa sauvegarde.

Ces leçons sont reprises ici pour que le kit reste compréhensible sans le code V1. L'audit est une source d'exigences négatives, pas une liste de fonctionnalités à migrer intégralement.

## Contraintes déjà exprimées

- Nouveau dépôt applicatif ; ne pas transformer la V1 en dépendance obligatoire.
- Pas de LLM dans le moteur pour cette version.
- Même produit accessible par interface web et par une CLI de playtest.
- Jeux de référence validés humainement sur téléphone, pas par simple déclaration d'agent.
- Une commande complète de vérification, exécutable localement et en CI.
- Garde-fous de structure et de dépendances ; moteur indépendant des noms de contenu et du texte français.

## À ne pas importer implicitement de la V1

Les éléments suivants sont **non décidés**, et non implicitement requis : caractéristiques détaillées, mémoire du vaisseau, boîte noire, durabilité, nombre de verbes, habillage CRT, musique, comptes, boutique ou système d'extensions.

Les classes, la grille tactique, les chargements annulant une défaite, l'échéance globale et les jauges permanentes de faim/fatigue/O₂ sont écartés du lancement par D-013 à D-021. La défaite définitive et la reprise d'une partie active sont au contraire choisies : ne pas les remettre en question par défaut en reprenant l'ancien code.

L'absence de décision ne vaut pas exclusion définitive. Elle interdit seulement leur implémentation automatique.

## Définition de fin actuellement acceptée

Un **petit jeu complet publié en PWA**, volontairement limité, fiable, fini et rejouable. Ce n'est ni un simple prototype jetable, ni une promesse de simulation universelle.

Une seule famille (D-017), objectif d'évacuation (D-018), station isolée (D-030). Ses variations exactes, le volume de contenu, les plateformes de validation, le budget et les critères de qualité de lancement restent à déterminer avant de rendre cette définition exécutable.
