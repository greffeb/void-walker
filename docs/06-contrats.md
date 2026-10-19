# Void Walker V2 — contrats à construire ensemble

> **Statut :** REGISTRE DE CONTRATS ET QUESTIONS — propositions non encore figées sauf référence explicite à une décision validée.
> **Mise à jour :** 2026-10-14.

## 1. Ce qu'est un contrat ferme

Un contrat décrit une règle acceptée avec : identifiant/version, entrées, sorties, préconditions, effets autorisés, erreurs, invariants, exemple normal, contre-exemple et preuve attendue.

Il ne se limite ni à une interface TypeScript ni à « cette fonction doit marcher ». Il exprime aussi ce que l'implémentation ne doit jamais faire. Un agent peut choisir une implémentation dans ces limites ; il ne peut pas changer les limites pour faire passer ses tests.

Les contrats seront détaillés après les arbitrages produit qui leur donnent un sens.

## 2. Catalogue proposé

| Contrat | Question couverte | Éléments déjà choisis | Éléments à arbitrer |
| --- | --- | --- | --- |
| C-01 Actions et options | Que peut-on choisir, et comment ? | Socle v0.1 accepté, D-027 | Confirmation UI détaillée et vocabulaire d'actions |
| C-02 Monde et entités | Qu'est-ce qui existe et où ? | [v1.0 accepté](contrats/C-02-monde-entites.md), D-078 à D-080/D-082 | Format des données (architecture), nouvelles qualités |
| C-03 Tour et temps | Qu'est-ce qui fait avancer le monde ? | v0.2 accepté pour AR-01 et le vide d'AR-02, D-056/D-057/D-074 | Autres contenus et créatures, représentation technique |
| C-04 Risques et résolution | Quand un dé est-il justifié ? | v0.2 accepté pour AR-01 et AR-02, D-055/D-057/D-074 | Calibrage humain et risques hors référence |
| C-05 Conséquences | Comment un succès devient-il un changement réel ? | Socle v0.1 accepté, D-027 ; ordre et vide fixés par C-03 | Sauvegarde détaillée et autres réserves adjacentes |
| C-06 Observation et connaissances | Que sait chaque joueur/adaptateur ? | [v1.0 accepté](contrats/C-06-observation-connaissances.md), D-075 à D-077, D-080 à D-082 | Forme visuelle de la carte, textes des messages |
| C-07 Narration | Que peut affirmer le texte ? | [v1.0 accepté](contrats/C-07-textes.md), D-109 à D-117 | Textes définitifs |
| C-08 Scénarios et fins | Qu'est-ce qui rend une aventure valide ? | [v1.0 accepté](contrats/C-08-stations-fins.md), D-083 à D-088, D-101/D-102, D-156 à D-162 | Conception des dix morceaux |
| C-09 Sauvegarde et replay | Qu'est-ce qui doit rester identique ? | [v1.0 accepté](contrats/C-09-sauvegarde-replay.md), D-022, D-087 à D-092, D-101 à D-103 | Format technique (architecture) |
| C-10 Preuves et gouvernance | Qui peut déclarer une version prête ? | [v1.0 accepté](contrats/C-10-preuves-gouvernance.md), D-010, D-092 à D-108 | Fusion mixte, passage du moteur en vert, budget des agents |

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

### Bloc L — deuxième référence, règles du vide : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-51 Forme d'AR-02 | Courte aventure complète, même famille | D-058 |
| Q-52 Vide sans protection | Défaite immédiate, annoncée comme mortelle | D-059 |
| Q-53 Protection personnelle | Combinaison étanche, une action pour l'enfiler | D-060 |
| Q-54 Propagation | Immédiate dans toute la zone ouverte | D-061 |
| Q-55 Créature exposée | Neutralisation définitive : expulsée ou inerte | D-062 |

### Bloc M — deuxième référence, plan et matériel : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-56 Plan | Quatre pièces, capsule prête, créature à l'embarquement | D-063 |
| Q-57 Outil | Découpeuse de maintenance | D-064 |
| Q-58 Capsule | Elle refait son air quand on la ferme | D-065 |
| Q-59 Baie percée | Réparable avec une rustine d'urgence | D-066 |

### Bloc N — deuxième référence, retour de l'air et rustine : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-60 Retour de l'air | Tout de suite, dès qu'une pièce n'est plus reliée au trou | D-067 |
| Q-61 Rustine | Une seule, près de la baie, une action ; repercer possible | D-068 |
| Q-62 Utilité | Option de plus, jamais obligatoire pour gagner | D-069 |

Les données fixes, précisions et parcours de l'[aventure AR-02](09-aventure-reference-vide.md) sont acceptés par le bloc O.

### Bloc O — acceptation d'AR-02 : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-63 Passer en force | Garder tel quel | D-070 |
| Q-64 Petites règles | VP-01 à VP-04 et VP-06 acceptées ; VP-05 non retenue | D-071 |
| Q-66 Retirer la combinaison | Oui, partout, avec l'avertissement mortel sans air | D-072 |
| Q-67 Combinaison retirée | Gardée sur soi, remise en une action | D-073 |
| Q-65 Validation | AR-02 v1.0 acceptée comme conception, pas comme partie jouée | D-074 |

### Bloc P — monde, carte et connaissances : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-68 Carte au départ | Seulement ce qu'on a visité | D-075 |
| Q-69 Carte hors de vue | Ce qu'on y a vu en dernier | D-076 |
| Q-70 Entendre la créature | Bruits vagues par les portes ouvertes, pièce voisine | D-077 |
| Q-71 Objets interchangeables | Le jeu lit les qualités, pas le nom | D-078 |
| Q-72 Porter des objets | Pas de limite, sauf un seul objet encombrant | D-079 |

### Bloc Q — acceptation de C-02 et C-06 : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-73 Huit petites règles | Sept acceptées ; celle de l'assistance à distance non retenue | D-080 |
| Q-75 Ce que sait l'assistance | Seulement ses messages prévus | D-081 |
| Q-74 Validation | C-02 et C-06 v1.0 acceptés | D-082 |

### Bloc R — stations assemblées et fins : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-76 Variation | Assembler des morceaux écrits à la main | D-083 |
| Q-77 Garantie | Toujours un chemin sûr si l'on prépare bien | D-084 |
| Q-78 Plus aucune sortie | Le jeu le signale mais laisse continuer | D-085 |
| Q-79 Fin de partie | Le récit seulement | D-086 |
| Q-80 Rejouer | Même station relançable | D-087 |

### Bloc S — sauvegarde, export et rapports : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-81 Dés en rejouant | Nouveaux tirages | D-088 |
| Q-82 Parties en cours | Une seule | D-089 |
| Q-83 Mise à jour | Continuer si possible, sinon prévenir | D-090 |
| Q-84 Enregistrement impossible | Prévenir et laisser continuer | D-091 |
| Q-85 Export | Fichier de partie à envoyer | D-092 |
| Q-86 Validation téléphone | Issues GitHub automatiques : partie + commentaire ; bouton « bug » reproductible | D-093 |

### Bloc T — envoi des rapports et authentification : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-87 / Q-90 Qui peut envoyer | Tout le monde, sans compte, comme en V1 | D-095 |
| Q-88 Création de l'issue | Petit service intermédiaire | D-094 |
| Q-89 Ce qui valide | Case « je valide » | D-096 |
| Q-91 Authentification | Code personnel vérifié par le service — remplacé par D-130 | D-097 |

### Bloc U — sens d'une validation sur téléphone : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-92 Ce qu'on valide | Chaque morceau au moins une fois, plus AR-01/AR-02 | D-098 |
| Q-93 Ce qu'il faut avoir fait | Aller au bout, puis juger | D-099 |
| Q-94 Durée | Perdue si l'aventure ou ses parcours automatiques changent | D-100 |

### Bloc V — acceptation de C-08/C-09/C-10 et gouvernance : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-95 Petites règles | Neuf sur dix ; export avant abandon non retenu | D-101 |
| Q-96 Validation | C-08, C-09, C-10 v1.0 acceptés | D-102 |
| Q-97 Partie incompatible | Rien de plus que le message | D-103 |
| Q-98 Tests et doc | Restent en zone verte ; D-012 non retenue | D-104 |
| Q-99 Fusion verte | Orchestrateur, après relecture indépendante | D-105 |
| Q-100 Branche principale | Non protégée | D-106 |
| Q-101 Moteur | Zone orange au début | D-107 |
| Q-102 `script-writer` | Deux rôles : contenu et outils | D-108 |

### Bloc W — textes du jeu : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-103 Langues | Français seulement | D-109 |
| Q-104 Adresse | Vous | D-110 |
| Q-105 Longueur | 2 à 4 phrases par action | D-111 |
| Q-106 Origine des phrases | Écrites à la main, avec des trous | D-112 |
| Q-107 Variété | Quelques variantes | D-113 |
| Q-108 Dé | Non affiché | D-114 |
| Q-109 Petites règles | Cinq sur six ; accord sur chaque texte non retenu | D-115 |
| Q-111 Autonomie | Textes en zone verte, seulement eux | D-116 |
| Q-110 Validation | C-07 v1.0 accepté | D-117 |

### Bloc X — volume du lancement : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-112 Morceaux | Environ 8 | D-118 |
| Q-113 Obstacles par station | 2 ou 3 | D-119 |
| Q-114 Créature | Toujours la même | D-120 |
| Q-115 Problème du départ | Varié selon les morceaux | D-121 |

### Bloc Y — architecture et outillage : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-116 Dépôt | Ce dépôt | D-122 |
| Q-117 Pile technique | Les agents proposent, vous choisissez | D-123 |
| Q-118 Hébergement | GitHub Pages | D-124 |
| Q-119 Service de rapports | Déployable par les agents en autonomie | D-125 |
| Q-120 Agents | Copilot seulement | D-126 |
| Q-122 Déploiement du service | Par les agents eux-mêmes | D-127 |
| Q-123 Forme de Copilot | Éditeur ou terminal sur le PC | D-128 |

### Bloc Z — validation par demande de fusion : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-121 / Q-124 Preuve que c'est vous | PR avec preuves, jeu sur téléphone, retours depuis le téléphone ; option la plus simple à l'usage | D-129, D-130 |
| Q-125 Version de test | Une adresse par PR | D-131 |
| Q-126 Retours | En commentaire de la PR testée | D-132 |

### Bloc AA — pile technique : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-127 Écran | React | D-133 |
| Q-128 Service de rapports | Cloudflare Workers | D-134 |
| Q-129 Captures en PR | Oui, automatiques | D-135 |
| Q-130 / Q-131 Architecture | Dix points acceptés, document validé | D-136 |
| Q-132 Agents au départ | Quatre : orchestrateur, exécutant, relecteur, playtester | D-137 |
| Q-133 Issue de démarrage | Créée tout de suite sur GitHub (#89) | D-138 |

### Bloc AB — assemblage et nouveaux morceaux : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-134 Origine des morceaux | Imaginer plus, quitte à ajouter des règles | D-156 |
| Q-135 Problème du départ | Un seul problème final par station | D-159 |
| Q-136 Ordre des obstacles | En chaîne et en ordre libre | D-160 |
| Q-137 Place de la créature | Tirée parmi les places prévues par les morceaux | D-161 |
| Q-138 Répétition | Pur hasard | D-162 |
| Q-139 Nouveaux morceaux | Machines, passerelle, sans gravité, chambre froide | D-158 |
| Q-140 Combien | 6 anciens + 4 nouveaux | D-157 |
| Q-141 / Q-142 Salle des machines | Vacarme dans les deux sens ; arrêter et relancer, relancer attire | D-163 |
| Q-143 / Q-144 Passerelle | La planche cède sous la créature ; on peut la retirer | D-164 |
| Q-145 à Q-147 Sans gravité | Deux actions pour le passager ; la créature dérive ; interrupteur | D-165 |
| Q-148 / Q-149 Chambre froide | Ralentie pour de bon ; le passager blessé s'il y reste | D-166 |
| Q-150 Mélanges | Tout mélanger, règles au cas par cas | D-167 |
| Q-151 Interrupteurs | Toujours alimentés | D-168 |
| Q-152 Planche | Pièce voisine, encombrante | D-169 |
| Q-153 Chambre froide | Bruit dedans et fermeture à distance, ou poursuite | D-170 |
| Q-154 Détail des morceaux | Les agents proposent, vous validez | D-171 |

### Bloc AC — acceptation de la conception des morceaux : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-155 Familles | Final et chemin | D-172 |
| Q-156 Interrupteur des machines | Un seul, dans la salle | D-173 |
| Q-157 Mélanges | MX-01 à MX-05 acceptées | D-174 |
| Q-158 Validation | Conception des dix morceaux v1.0 | D-175 |

### Bloc AD — règles des nouveaux morceaux, avant de coder #105 : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-159 Durée du bruit de relance et du compresseur | Comme l'avertisseur | D-234 |
| Q-160 Vacarme des machines | Couvre tout pour qui est dedans | D-235 |
| Q-161 Passerelle | Les deux bords s'entendent sans se voir | D-236 |
| Q-162 Traverser sans gravité | Dériver jusqu'à l'autre bout : une action de plus | D-237 |
| Q-163 Interrupteurs de gravité | Dans les pièces aux deux bouts | D-238 |
| Q-164 Créature ralentie | Dès qu'une porte de la chambre se ferme sur elle | D-239 |
| Q-165 Froid | Une blessure à chaque action au-delà de deux | D-240 |

### Bloc AE — point sur les morceaux, avant #106 : répondu

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-166 Créature mise hors jeu dès le premier obstacle | Attendre les mesures ; créature placée plus souvent près du final, en réserve | D-241 |
| Q-167 Taille des stations au lancement | Petites d'abord ; grandes si la durée le demande | D-242 |
| Q-168 Documents à lire (lore) | Oui, version légère ; écriture soignée, par l'assistant principal | D-243 |
| Q-169 Objets placés hors de leur morceau | Plus tard, avec les annexes ; à garder en mémoire | D-244 |

### Bloc AF — découpage et règles d'assemblage de #106 : répondu

Réponse unique du porteur aux douze questions : « Ok pour tes reco ».

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-170 Découpage de #106 | Sept livraisons ; grandes stations à part, si besoin | D-245 |
| Q-171 Air de la baie dans les nouveaux morceaux | Il s'en va comme ailleurs, par-dessus la passerelle aussi | D-246 |
| Q-172 Feu et passerelle | Le feu gagne l'autre bord | D-247 |
| Q-173 Obstacles qui ne jouent pas sur la même chose | Ensemble, sans règle de plus | D-248 |
| Q-174 Final et embarquement | Toujours ensemble | D-249 |
| Q-175 Chemin sûr et premier contact | Compte comme sûr | D-250 |
| Q-176 Sortie qui demande un coup de dés | Reste une sortie | D-251 |
| Q-177 Portes entre morceaux | Fermées au départ | D-252 |
| Q-178 Tirage | Pile ou face du final d'abord | D-253 |
| Q-179 Ordre libre | Oui : deux obstacles depuis un même couloir | D-254 |
| Q-180 Version de test | NOUVELLE PARTIE tire une station | D-255 |
| Q-181 Panneau caché | Contourner la créature par le passage étroit | D-256 |

### Bloc AG — grandes stations habitées : répondu

Questions posées le 2026-10-18, une par une, pour #202, #205, #206, #207 et #209 ; réponses mot pour mot dans l'annexe A de la [conception](superpowers/specs/2026-10-18-grandes-stations-design.md#annexe-a-réponses-du-porteur-mot-pour-mot). Conception approuvée : « J'approuve le document, avec D-302, D-303 et la validation de D-276 et D-279. »

| Question | Réponse utilisateur | Décision |
| --- | --- | --- |
| Q-204 La partie idéale | 25 minutes : traces, bruits, documents, puis la rencontre, la poursuite, les portes défoncées, l'objectif | D-289, D-293, D-294 |
| Q-205 Variété | « franchement, tout pourrait changer, j'aime la variété » | D-298 |
| Q-206 Grand mystère sur plusieurs parties | « trop ambitieux et casse gueule niveau faisabilité. » | D-298 |
| Q-207 Difficulté | Deux ou trois morts sur quatre parties ; la difficulté actuelle convient | D-290 |
| Q-208 Taille et durée | « rien ne me gène » | D-289 |
| Q-209 Butin | Oui, ouvert aux objets futurs | D-296 |
| Q-210 Clés dispersées | « la caisse peut bouger, sinon OK » | D-295 |
| Q-211 Cadre et histoire de la créature | « c'est bien » | D-298 |
| Q-212 Forme des documents | Chiffres à l'écran et indice de passage caché | D-299 |
| Q-213 Catalogue des pièces | « ok » | D-292 |
| Q-214 Créature immobile avant le contact | « oui » | D-297 |
| Q-215 Affichage d'un document | « B, la fiche document dans la bulle. » | D-300 |
| Q-216 Taille, après relecture | 22 à 28 pièces | D-289 |
| Q-217 Rythme de la créature | Tardive et utile | D-291 |
| Q-218 Traces | Une piste | D-293 |
| Q-219 Validations signées | Gardées | D-301 |

## 5. Socles formels acceptés

- [C-01 — Actions et observation publique](contrats/C-01-actions-observation.md) : commandabilité, indisponibilité, secret et parité d'adaptateurs.
- [C-03 — Temps, dangers et réactions](contrats/C-03-temps-reactions.md) : ordre, perceptions et compteurs ; portée AR-01, vide d'AR-02.
- [C-04 — Risques, blessures et soin](contrats/C-04-risques-blessures.md) : états, fuite exposée, résultat partiel et plafond, exposition au vide ; portée AR-01 et AR-02.
- [C-05 — Monde et conséquences cohérentes](contrats/C-05-monde-consequences.md) : identité, déplacement, dangers, effets, persistance et preuves.

- [C-02 — Monde, lieux, liaisons et entités](contrats/C-02-monde-entites.md) : lieux, liaisons et capacités, entités, qualités, port.
- [C-06 — Observation, carte et connaissances](contrats/C-06-observation-connaissances.md) : sources de connaissance, carte, aperçus, secrets, mémoire.

**C-02 et C-06 v1.0** sont acceptés par Q-74 / D-082 ; ils assemblent des décisions validées et les petites règles de D-080/D-081.

**C-08, C-09 et C-10 v1.0** sont acceptés par Q-96 / D-102, avec les règles de D-101 et la gouvernance de D-103 à D-108. Tous les contrats C-01 à C-10 sont acceptés ; C-07 par D-117.

**C-01 et C-05 v0.1 sont acceptés par Q-20 / D-027**. Leurs réserves explicites restent ouvertes ; cette validation ne vaut ni implémentation terminée ni parcours accepté sur téléphone. Les autres invariants proposés dans le registre n'acquièrent pas automatiquement le même statut s'ils ne font pas partie de ces contrats.

**C-03 et C-04 v0.1** extraient les règles acceptées d'AR-01 par Q-48 à Q-50 / D-055 à D-057. Cette portée n'autorise pas de nouveaux dangers ou formats de sauvegarde non arbitrés. Aucun code ni test de ces contrats n'est réalisé.

**C-03 et C-04 v0.2** ajoutent le vide d'AR-02 (D-074), retranscrit sans changement de sens ; C-05 y renvoie.

## 6. Contrats par l'exemple

Voir les [cinq interactions de référence](07-interactions-reference.md). L'intention de chaque situation est validée par D-019. Pour la portée AR-01, leurs modalités applicables sont fixées par AR-01/C-03/C-04 ; la dépressurisation l'est par AR-02/C-03/C-04. Les extensions hors de ces fixtures restent à préciser.

Exemple de traduction en contrat : déplacer une caisse doit changer son emplacement, puis la règle d'accessibilité doit lire cet emplacement. Un texte « vous atteignez la grille » ou un drapeau propre à une salle ne suffit pas à prouver l'interaction générique.

## 7. Prochaine séance de cadrage

1. Traiter les issues de développement #100 à #108, dans l'ordre de leurs dépendances, en parallèle des issues d'interface #92 à #99.
2. Retirer automatiquement une validation quand l'aventure change (D-100) : issue à créer après #108.

Q-01 à Q-219 sont répondus ; le prochain numéro d'entretien est Q-220. Q-197 à Q-200 sont cités dans D-270, Q-201 à Q-203 dans D-275 et [13 §7.9](13-morceaux-lancement.md#79--plus-aucune-sortie--l6-156), Q-204 à Q-219 dans le bloc AG. Les questions posées sur le découpage de #106 sont gardées dans [13 §7.4](13-morceaux-lancement.md#74-questions-posées-au-porteur), celles du cadrage L0 (Q-182 à Q-185) dans [13 §8](13-morceaux-lancement.md#8-cadrage-l0-150-accepté-par-le-porteur), celles de L2 (Q-186, Q-187) dans [13 §7.5](13-morceaux-lancement.md#75-première-station-tirée-l2-152), celles de L3 (Q-188 à Q-192) dans [13 §7.6](13-morceaux-lancement.md#76-baie-passerelle-sans-gravité-l3-153) et celles de L4 (Q-193 à Q-196) dans [13 §7.7](13-morceaux-lancement.md#77-chemins-dar-01-l4-154). Les choix de référence et leurs paramètres sont déjà conservés : ne pas refaire l'entretien par défaut.

### Sujets encore ouverts, sans ordre imposé

- Interactions du vide avec un futur morceau : refusées par défaut tant que leurs règles ne sont pas décidées (D-167, D-248). Pour les dix morceaux actuels, elles sont réglées : feu et huile selon MX-02/MX-03 (D-174), quatre nouveaux morceaux sans règle de plus (D-246) ; le vide ne rencontre jamais le bloc, M-03 et M-06 étant tous deux des morceaux finals (D-172). Ne pas réintroduire un duel ou compagnon physique pour étendre ce cas.
- Transformations d'objets et ressources au-delà des qualités de C-02 ; quoi omettre volontairement.
- Règles et risques hors de la portée d'AR-01 ; information visible sans fuite des secrets.
- Génération, fins, connaissance et cas d'absence de solution.
- Ton, écriture, langues, carte, assets/audio et confort de lecture.
- Appareils de validation, offline, sauvegardes, mises à jour et publication.
- Budget, cadence humaine, services déjà disponibles et contraintes d'exploitation.
- Fusion d'une demande touchant plusieurs zones, passage du moteur en vert, budget des agents, isolation des agents.
- Après le lancement : univers, menaces et objectifs choisis au moment du tirage (exfiltration, extermination, enquête, escorte ; essaim, champignon, savant fou…), pistes de la [roadmap](02-roadmap.md#après-lancement--hors-définition-de-fin-actuelle), non décidées.

On pose les questions en petits blocs. Pas de formulaire de cinquante choix techniques avant d'avoir une boucle de jeu claire.

À la demande du porteur du projet, les questions se formulent en langage courant : situation concrète, options compréhensibles sans numéros de décision ni jargon (« engagement », « précondition », « canonique »). Les documents gardent la précision nécessaire aux agents.
