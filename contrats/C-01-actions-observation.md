# C-01 — Actions composables et observation publique

> **Statut :** SOCLE CONTRACTUEL VALIDÉ v0.1 — D-027 ; questions explicitement ouvertes conservées.
> **Date :** 2026-10-09.
> **Choix acquis :** D-006, D-014, D-020, D-024 et D-026 du [journal](../03-decisions.md).

## 1. But

Une seule définition des actions et de ce que le joueur sait, partagée par l'interface PWA, la CLI et les joueurs automatisés. Le menu aide à formuler une intention sans révéler les solutions et sans transformer un texte français en commande métier.

## 2. Commande

Une commande identifie l'action choisie et les entités/positions publiques qui la paramètrent. Les noms traduits servent uniquement à l'affichage. Les noms des champs et le format de transport restent un choix d'architecture, pas un besoin produit à improviser ici.

Le catalogue d'actions doit servir tant à présenter les options qu'à vérifier une commande. Un second catalogue spécifique à la CLI ou au bot est interdit par ce contrat.

## 3. Observation et connaissance

L'observation expose seulement : lieu connu, éléments perceptibles, inventaire, connaissances acquises, état visible du personnage, signes perceptibles de menace, passages connus et manipulations plausibles.

Les identifiants publics sont opaques : ils ne doivent pas encoder « sortie gagnante », « cache secrète » ou une autre information cachée.

Deux mondes identiques du point de vue du personnage produisent les mêmes options publiques, même si l'un possède un passage caché derrière le panneau et pas l'autre. Le panneau propose une manipulation plausible dans les deux cas ; son ouverture peut produire des observations différentes.

Le solveur peut inspecter le monde entier dans son processus d'évaluation. Le playtester ne reçoit pas cet état ni les flags internes.

## 4. Options et indisponibilités

Le menu présente des manipulations plausibles des objets connus, pas uniquement des actions garanties réussies.

- **Précondition publique manquante :** indiquer l'indisponibilité et une raison connue, par exemple « hors de portée ». Ne pas annoncer automatiquement l'objet exact qui résoudrait le problème.
- **Information cachée :** ne pas utiliser ce secret pour montrer une option exclusive ou une raison révélatrice. Une tentative plausible peut découvrir une résistance ou un résultat inattendu.
- **Manipulation hors périmètre :** ne pas l'afficher comme une action prise en charge ; si une commande invalide arrive par un outil, retourner une erreur explicite.
- **Commande périmée :** vérifier à nouveau les préconditions au moment de l'engagement ; un menu affiché avant un changement d'état n'est pas une autorisation persistante.

## 5. Prévisualisation sans engagement

Consulter les menus, changer de cible ou d'outil, lire et consulter les objets ne fait pas avancer le monde, ne consomme pas de ressource et ne tire pas de dé (D-014).

Avant engagement, présenter le niveau de risque et les coûts/dangers connus (D-020). Cette prévisualisation n'est ni le résultat futur du jet ni une révélation des secrets. Le détail visuel et le besoin d'un bouton de confirmation sur chaque famille d'action restent à maqueter.

## 6. Refus et tentative échouée sont distincts

- **Refus technique ou précondition publique invalide :** aucune action du personnage n'a été engagée ; pas de coût, de tour ou de modification cachée.
- **Tentative engagée mais ratée :** appliquer les coûts et risques prévus, puis le résultat observé. Il peut ne pas y avoir d'effet direct sur la cible, mais cela doit être expliqué honnêtement.
- **Nouvel essai :** une nouvelle action, autorisée seulement dans le nouvel état et payant de nouveaux coûts/risques. Une reprise d'application ne transforme jamais un résultat passé en nouvel essai.

## 7. Exemples d'acceptation contractuels

| ID | Étant donné / quand | Attendu |
| --- | --- | --- |
| A-01 | Le joueur ouvre et ferme dix fois les menus | Même monde, mêmes ressources, aucun tirage métier supplémentaire |
| A-02 | Le même panneau existe dans deux mondes ; un passage caché existe dans un seul | Pas de différence révélatrice dans les options avant découverte |
| A-03 | La caisse est sélectionnée, puis une position sous la grille | Commande structurée de déplacement, pas une phrase à parser |
| A-04 | L'action ciblait un objet qui n'est plus disponible au moment d'engager | Refus explicite, aucune consommation ni modification partielle |
| A-05 | La même commande part de la PWA ou de la CLI, avec état et hasard identiques | Même résultat mécanique et même information publique |
| A-06 | Une tentative échoue et reste possible | Nouvel essai proposé avec ses nouveaux coûts, sans annuler les effets précédents |
| A-07 | Le libellé français d'une action est reformulé | Aucun changement de son identité, de ses préconditions ou de son effet |

## 8. À ne pas déduire de ce contrat

Pas d'exhaustivité de simulation promise. Les verbes précis, la quantité d'options, le nombre maximal de taps et les modèles de menace sont à concevoir. Pas de liste de « meilleurs coups » omnisciente utilisée comme unique preuve de jouabilité.

## 9. Validation

Acceptation humaine du socle : **2026-10-09, Q-20, D-027**. Les modalités listées comme ouvertes le restent. Vérification automatique de son implémentation : **non exécutée**. Validation du parcours sur téléphone : **non effectuée**.
