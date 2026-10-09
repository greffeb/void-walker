# Void Walker V2 — interactions créatives de référence

> **Statut :** INTENTIONS VALIDÉES — modalités AR-01 acceptées par D-057 ; extensions et dépressurisation encore à cadrer. Aucune partie humaine V2.
> **Mise à jour :** 2026-10-09.

## 1. Rôle de ces exemples

Les cinq situations ci-dessous proviennent du porteur du projet (D-019). Elles permettent de choisir un petit ensemble de règles qui se combinent réellement, sans créer d'emblée 85 verbes ou une simulation universelle.

**Validé :** l'intention et l'effet général demandés. **Proposé :** préconditions, limites et critères techniques ci-dessous. Aucun nombre de dégâts, délai ou probabilité n'est fixé ici.

Pour R-02 à R-05 dans AR-01, les données fixes de l'[aventure acceptée](08-aventure-reference.md) et les contrats [C-03](contrats/C-03-temps-reactions.md)/[C-04](contrats/C-04-risques-blessures.md) font désormais autorité sur les propositions correspondantes de ce document. Les autres usages, matériaux ou entités ne sont pas implicitement couverts.

Ces cas sont des futurs tests de contrat, pas encore une aventure complète ni des parcours validés sur téléphone. La première aventure pourra en combiner une sélection cohérente ; leur présence simultanée dans chaque partie n'est pas requise.

**Répartition décidée :** AR-01 couvre R-02 à R-05 ; R-01 (dépressurisation préparée) est reportée à une deuxième référence par D-038. Son besoin de lancement n'est pas supprimé par cette répartition.

## 2. R-01 — Dépressurisation préparée

### R-01 — Intention utilisateur

Une action sur la vitre de la station, avec un appareil adapté ou un tir, peut créer une brèche et dépressuriser la pièce. Cela peut neutraliser un ennemi ; le joueur doit préparer sa protection.

### R-01 — Contrat proposé

- La vitre sépare la pièce du vide extérieur : un vitrage intérieur ne produit pas automatiquement le même effet.
- L'action doit réellement endommager cette séparation, selon ses propriétés et l'outil ; tous les outils thermiques ou projectiles ne sont pas des clés universelles.
- La brèche change la pression du lieu. Une règle de danger applique ensuite les conséquences aux entités exposées selon leur protection et leur vulnérabilité.
- L'état de protection doit exister avant l'exposition ; il ne peut pas être inventé par la narration après le jet.
- La portée vers d'autres pièces tient compte des passages ouverts (D-023). Fermer une séparation protectrice et être simplement derrière une caisse ne doivent pas être confondus.
- Neutraliser l'ennemi ne remplit pas à lui seul l'objectif d'évacuation : les conditions de sortie restent à satisfaire.

### R-01 — Preuves attendues

Résultat vrai et persistant sur la séparation, la pièce, le joueur et l'ennemi ; différences entre protégé/non protégé, vitre extérieure/intérieure, ennemi vulnérable/résistant ; état conservé après fermeture et reprise de l'application.

### R-01 — Limites à décider

Types de protection, conséquence exacte de l'exposition, moment de résolution, propagation et moyens alternatifs. Aucun calcul de fluide ni jauge permanente d'O₂ n'est imposé par l'exemple.

## 3. R-02 — Sol glissant

### R-02 — Intention utilisateur

Répandre de l'huile au sol doit pouvoir faire glisser un ennemi.

### R-02 — Contrat proposé

- Le liquide est transféré ou consommé selon une quantité abstraite à décider ; il ne reste pas disponible à l'infini.
- La position visée devient glissante ; l'effet n'agit pas arbitrairement sur tout ennemi dans la pièce.
- Une entité qui traverse cette position évalue le risque selon son mode de déplacement et ses capacités. Une entité flottante ne glisse pas parce qu'elle porte le même identifiant de type « ennemi ».
- Une chute ou un ralentissement produit un changement de position, disponibilité d'action ou état explicitement défini ; pas une phrase sans effet.
- Le joueur peut aussi être concerné s'il emprunte le même passage, sauf protection/capacité pertinente.

### R-02 — Preuves attendues

Différence entre traverser le sol traité ou l'éviter ; persistance du liquide ; absence de duplication ; effet réellement exploitable pour s'échapper ou agir.

### R-02 — Limites à décider

Glissade certaine ou risquée, durée, nettoyage, visibilité du danger et réactions de la menace. L'inflammabilité de l'huile n'est pas automatiquement ajoutée au périmètre : si elle est montrée ou exploitée, elle doit aussi être contractualisée.

## 4. R-03 — Caisse comme marchepied

### R-03 — Intention utilisateur

Déplacer une caisse sous une grille d'aération pour s'y hisser et passer dans le conduit.

### R-03 — Contrat proposé

- La caisse est déplaçable et offre un appui approprié ; position et capacité d'appui sont des propriétés du monde.
- Déplacer la caisse change son emplacement, sans duplication ni apparition d'une seconde caisse dans l'inventaire.
- La présence de l'appui sous l'accès rend la grille atteignable. « Atteignable », « ouverte » et « franchissable » restent distincts.
- Si la grille est encore fixée ou verrouillée, l'appui ne l'ouvre pas magiquement.
- Un autre objet ayant les capacités requises peut servir d'appui, sans test codé sur le nom du modèle de caisse.
- Retirer l'appui fait recalculer l'accès, sauf changement du monde justifiant autrement son maintien.

### R-03 — Preuves attendues

Avant/après déplacement ; appui incorrect/refus sans perte ; grille fermée/ouverte ; autre appui équivalent ; même état dans UI, CLI et replay.

## 5. R-04 — Panneau et passage secret

### R-04 — Intention utilisateur

Ouvrir un panneau de contrôle peut révéler un passage secret.

### R-04 — Contrat proposé

- Le panneau peut être manipulé sans que le menu annonce d'avance « découvrir le passage secret ».
- Le passage existe dans le scénario généré avant la découverte ; il n'est pas inventé après chaque ouverture ou chaque rechargement.
- L'ouverture rend son existence perceptible si le scénario a placé cet accès derrière ce panneau.
- L'observation, la carte et les commandes disponibles reflètent alors la même découverte.
- Un panneau sans passage révèle son contenu réel : la même action n'est pas un générateur universel de raccourcis.
- Refermer le panneau ne fait pas oublier au personnage ce qu'il a découvert ; accès physique et connaissance restent distincts.

### R-04 — Preuves attendues

Pas de fuite avant découverte ; révélation atteignable via commande publique ; passage utilisable après conditions requises ; persistance de la connaissance ; absence de doublon après réouverture.

## 6. R-05 — Éteindre un feu

### R-05 — Intention utilisateur

Arroser le feu doit réellement l'éteindre.

### R-05 — Contrat proposé

- Le cas de référence utilise un feu déclaré compatible avec le moyen d'extinction disponible. L'exemple ne prétend pas que l'eau convient à tous les incendies possibles.
- L'application retire ou réduit l'état de feu selon une règle bornée, avec consommation du moyen utilisé.
- Les dégâts ou obstacles dus au feu cessent une fois ce dernier éteint ; un éventuel dommage déjà subi par la pièce n'est pas annulé rétroactivement.
- Le texte, la carte et les actions lisent cet état ; le narrateur ne continue pas à décrire un feu actif.
- Arroser plusieurs fois une zone déjà éteinte ne procure pas de récompense gratuite ou de nouvelle extinction fictive.

### R-05 — Preuves attendues

Feu actif/éteint, ressource suffisante/insuffisante, propagation selon D-023, conséquences antérieures conservées, voie rendue praticable si rien d'autre ne l'obstrue.

## 7. Socle commun proposé

Ces cinq besoins font apparaître un petit modèle commun :

- objets et entités identifiables, propriétés de capacité et états mutables distincts ;
- pièces, positions relatives, passages et séparations ;
- consommation/transfert, déplacement et exposition à un danger ;
- accessibilité physique distincte de la connaissance du personnage ;
- événement vrai → observation → texte ;
- mêmes commandes et effets pour UI, CLI, bots et sauvegarde/replay.

Le solveur pourra utiliser l'état complet pour vérifier des chemins ; le playtester devra apprendre les passages et propriétés à partir de l'observation publique uniquement.

## 8. Questions bloquant la version normative

D-023 à D-026 ont fixé la portée générale des dangers, le réessai payant, l'absence de duel et les options plausibles. D-031 à D-057 fixent maintenant les modalités bornées d'AR-01 : coûts élémentaires, états de santé, menace, feu et premiers risques. R-01 et les extensions hors de cette fixture restent à concevoir avant implémentation.

Les tests négatifs sont aussi importants que les réussites : refuser honnêtement une manipulation impossible n'est pas un manque de liberté ; annoncer son succès sans effet l'est.
