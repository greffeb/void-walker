# C-03 — Temps, dangers et réactions — socle AR-01 et AR-02

> **Statut :** CONTRAT DE CONCEPTION VALIDÉ v0.4, PORTÉE AR-01, AR-02 ET MORCEAUX DU LANCEMENT — D-039/D-040/D-047 à D-050/D-056/D-057 ; vide D-058/D-061/D-062/D-065/D-067/D-071/D-074 ; morceaux D-163 à D-166, D-168, D-170, D-173 à D-175, précisés par D-234 à D-239 ; air et feu par-dessus le vide de la passerelle D-246/D-247 ; poursuite et ouïe D-177/D-178 ; créature alertée D-276 et D-279, validées le 2026-10-18 ; errance, signe, traces fraîches et forçage lent des grandes stations D-330 à D-334 (§4.5), validés le 2026-10-21.
> **Date :** 2026-10-14.
> **Implémentation et vérification exécutable :** créature, perception, réaction et premier contact (§2 à §4, T-01, T-07, T-09) dans le moteur depuis #100 ; avertisseur, glissade et feu (§5.1 à §5.3, T-02 à T-06, T-08, T-10) depuis #102 ; vide, brèche, rustine et retour de l'air (§5.4, T-11 à T-14, T-18) depuis #104 ; morceaux du lancement et mélanges (§5.5, T-15 à T-17) proposés par #105, dans quatre stations de test. Pas d'attestation de partie humaine.

## 1. Portée et sources de vérité

Ce texte extrait les règles temporelles acceptées de l'[aventure AR-01](../08-aventure-reference.md). AR-01 porte ses pièces, positions, objets, propriétés de connexions et parcours attendus ; C-03 porte l'ordre et le sens de leurs réactions. Les [risques et blessures](C-04-risques-blessures.md) sont définis dans C-04.

La portée n'est pas une simulation universelle : d'autres créatures et les effets non présents dans les références devront avoir leurs règles. Les constantes d'équilibrage appartiendront aux données de règles, pas à des tests sur un nom de pièce dans le moteur.

## 2. Unité d'engagement

- Une action élémentaire du personnage coûte un pas de temps : déplacement significatif, transfert, manipulation, soin, test sonore, geste de départ.
- Déplacer l'appui, ouvrir la grille, la traverser sont trois engagements. L'approche d'une poignée à portée n'ajoute pas silencieusement un quatrième geste.
- Lecture, consultation, changement d'option, prévisualisation, animation, fermeture de l'application : aucun temps métier, aucune consommation ni RNG métier.
- Une commande dont la précondition publique/technique échoue est refusée sans engagement. Une tentative risquée effectivement engagée paie ses coûts, même si elle ne procure pas le résultat idéal.
- Le compteur de tour correspond aux engagements appliqués, pas au nombre de requêtes UI/CLI, de lectures ou de réponses de l'assistance.

## 3. Transition d'un pas

1. **Valider à nouveau** la commande dans l'état courant, selon C-01. Pas de mutation partielle pour un refus.
2. **Résoudre l'action** : effet matériel, déplacement, consommation et éventuel jet de risque résiduel. L'interception éventuelle est traitée selon C-04, pas évitée en déplaçant le joueur avant de la vérifier.
3. **Actualiser les dangers** depuis le nouvel état du monde : une extinction ou une fermeture décidée à l'étape 2 compte déjà. Appliquer les expositions suivant C-04.
4. **Résoudre une réaction de menace au maximum** : perceptions réelles, mouvement, inspection, interruption ou incident. Si le budget a été consommé par l'interception, aucune seconde réaction de la même menace.
5. **Conclure et enregistrer** : vérifier défaite/évacuation sur le résultat complet, priorité à une défaite acquise ; sauvegarder état, événements et tirages puis afficher le résultat engagé selon C-05. La stratégie technique de crash/écriture reste à compléter dans C-09.

Une défaite acquise n'est pas annulée par un effet ultérieur ou un test de victoire dans le même pas. Le résultat de sauvegarde est honnête : animation terminée n'est pas preuve d'écriture réussie.

## 4. Canaux et connaissance de la menace

### 4.1 Perceptions physiques

Le moteur distingue : lien de déplacement, gabarit autorisé, canal sonore, canal de feu et visibilité locale. Les mêmes connexions existent pour tous les lecteurs ; leur capacité dépend du type d'effet, pas d'un deuxième graphe incompatible.

Dans AR-01, la vision est limitée à une même pièce sans séparation opaque entre positions. Les indices acoustiques passent par les connexions qui les autorisent. Pas de vision à travers les pièces ni de connaissance de la position globale cachée du joueur.

**Portée de l'ouïe (D-178).** Un bruit atteint la créature par toute suite de liaisons qui laissent passer le son, sans limite de distance ; le passager n'entend la créature que dans la pièce voisine (OP-01).

### 4.2 Priorités de réaction

1. Joueur effectivement visible et interceptable.
2. Son actif perçu de plus forte intensité ; à égalité, événement le plus récent, puis identifiant d'événement stable.
3. Dernier indice effectivement perçu et non encore inspecté.
4. En l'absence d'indice : attendre au même emplacement.

Un son ne prend pas le pas sur un joueur visible. Un équipement dont le test a été déclenché produit son effet sonore, pas un événement « ennemi distrait » garanti. L'intensité des équipements précis est une donnée d'AR-01.

### 4.3 Une réaction, un changement significatif

Une réaction peut franchir au plus une liaison normale, effectuer un repositionnement local, inspecter une source ou produire un incident au contact. Mouvement vers une nouvelle pièce et attaque à l'arrivée ne constituent pas deux actions gratuites dans la même réaction.

Le chemin sonore vers une origine peut être impraticable pour le gabarit de la créature. Elle tente une voie réellement praticable ou rejoint le côté accessible d'une séparation bloquante. Une cloison fermée d'AR-01 la retient ; aucun saut par conduit ni téléportation. Seule exception : alertée, elle force une porte ordinaire fermée sur sa piste (D-279, ci-dessous).

Après inspection d'une source silencieuse, sans nouvel indice, la créature reste là. Ni patrouille permanente ni retour artificiel à son emplacement initial (D-048, remplacée par D-334 dans un monde à `rencontre` : voir §4.5). Réaction au stimulus n'implique pas suivi omniscient de la trajectoire réelle du joueur.

**Départ vu (D-177).** Si le passager quitte la pièce où elle le voit, sa réaction est de le voir partir ; à l'action suivante, elle franchit ce même passage s'il est encore ouvert et assez large, sans savoir où il va ensuite. Avant l'alerte, un passage étroit l'arrête, même si un autre chemin existe ; elle garde alors cet indice.

**Créature alertée (D-276, D-279).** Après le premier contact, elle entend les pas du passager par toute suite de liaisons qui laisse passer le son et va vers lui par le plus court chemin praticable ; elle garde l'oreille ouverte trois actions ; arrivée au bout de sa piste sans le trouver, elle fouille une pièce voisine. Quand sa piste passe par une porte fermée, elle la force : deux réactions de suite sur la même porte, puis la porte cède, s'ouvre et ne ferme plus. Ne se forcent pas : passage étroit, vide, cloison encore verrouillée, écoutille manœuvrée de l'intérieur, panneau caché, passage hors de portée, porte vers une pièce en feu.

### 4.4 Premier contact

Première détection directement menaçante dans la partie : signal public clair, sans sanction hostile immédiate ; le joueur dispose de son engagement suivant pour réagir. Lire ne consomme pas cette occasion. Entrée dans sa pièce, elle se tient devant le passage qu'elle vient de franchir : s'y faufiler pendant cet engagement se joue au dé (C-04 §4, D-195).

L'avertissement est mémorisé, pas recréé à chaque changement de pièce. Une séparation qui retire effectivement le contact empêche ses conséquences ; elle ne réinitialise ni position ni souvenirs de la créature.

### 4.5 Errance, signe, traces fraîches et forçage lent (mondes à `rencontre`)

Cette section ne vaut que dans un monde qui déclare `rencontre` (les grandes stations, D-330 à D-334 ; [conception](../superpowers/specs/2026-10-21-creature-mobile-design.md) §3). AR-01, AR-02 et les petites stations ne l'ont pas : §4.3 et la phrase « Ni patrouille permanente » y restent telles quelles (D-048).

- **Territoire.** Les pièces que la créature atteint par des passages ouverts et praticables pour son gabarit, recalculées à chaque pas. Elle n'ouvre jamais une porte. Ni vide de passerelle, même avec un pont posé, ni pièce en feu.
- **Dé de rencontre** (D-334). Toutes les N actions du passager (`RYTHME_RENCONTRE`), un d6 haché sur la graine et le numéro d'action, hors journal : 1, elle passe dans une pièce voisine de son territoire (au plus un passage, comme §4.3) ; 2, un signe, sans lieu ni nom (`bruit_lointain`) ; 3 à 6, rien. Il se tait pendant la traque (oreille ouverte, indice, forçage en cours, fouille à faire) ; D-276 gouverne seul, puis le dé reprend.
- **Jamais sans signe.** Elle n'entre pas dans la pièce du passager sans s'être tenue d'abord dans la pièce voisine, où il l'entend par la porte ouverte. Son entrée suit ensuite les règles actuelles (répit au premier contact D-184, avertissement §4.4). Un signe ne ment jamais, ne dit pas où elle est et ne change pas l'aperçu de risque (D-180, D-181).
- **Traces fraîches.** Chaque pièce qu'elle quitte garde l'heure de son départ ; la lecture d'une trace récente (`FRAICHEUR` actions) dit qu'elle est passée là, pas où elle est allée. La pièce où elle se trouve se voit.
- **Forçage lent.** Alertée par un bruit fort qui lui parvient (D-178 inchangé : une porte fermée l'arrête sauf `sonAuTravers`), elle force une porte fermée sur sa piste en `REACTIONS_FORCER_LENT` réactions avant le contact, contre deux en poursuite (D-279). Les pas du passager n'y suffisent pas avant le contact (D-276). La porte cédée reste ouverte.
- **Sans errance, la preuve.** Le monde sans errance (`sansErrance`) garde les règles d'avant et sert de preuve ; l'errance est bornée par les règles ci-dessus.

Valeurs d'équilibrage à mesurer, non figées : `RYTHME_RENCONTRE` 3, `FRAICHEUR` 6, `REACTIONS_FORCER_LENT` 4, `ETENDUE_TERRITOIRE` 0,5.

## 5. Cycles particuliers acceptés pour AR-01

### 5.1 Avertisseur

Le son reste actif pendant la réaction de l'engagement d'activation et les deux réactions suivantes. Les réactions ont lieu à chaque engagement, indépendamment du temps de lecture.

La créature rejoint sa source physique si elle la perçoit et n'a pas un joueur visible prioritaire. Si elle est initialement dans la même pièce, le déplacement vers l'alcôve est un repositionnement local. Une fois à la source active elle y recherche ; à l'extinction, elle conserve son emplacement et réévalue ses indices au pas suivant.

Relancer pendant le cycle ne le prolonge pas : « test en cours » est une indisponibilité publique. Après le cycle, un nouveau test est possible contre un nouvel engagement. Aucun dysfonctionnement aléatoire ni résistance cachée à la diversion ajouté pour punir la réutilisation.

La durée du son n'est pas une promesse de durée de sécurité. Le joueur peut rester hors de vue plus longtemps ou se rendre visible plus tôt. La géométrie et l'état réel, non un buff abstrait de distraction, décident.

### 5.2 Première glissade sur une zone huilée

La créature qui se précipite sur une zone huilée encore inconnue glisse à l'endroit réellement traversé. Sa réaction en cours s'arrête ; les **deux réactions suivantes** sont perdues. Le compteur n'est pas consommé une fois supplémentaire au moment de poser l'effet.

La zone, son emplacement et la connaissance acquise sont persistants. Une nouvelle traversée de la même zone connue est prudente : une réaction pour s'y engager, une suivante pour la franchir, sans nouvelle chute gratuite. Fermer puis rouvrir une porte ne recrée pas une zone inconnue.

Le joueur connaissant le bord sec défini dans AR-01 peut franchir prudemment pendant son déplacement normal. Cela n'efface pas l'huile ni ne l'immunise contre un autre danger.

### 5.3 Feu confiné et propagation

Un foyer gagne une pièce voisine après **deux fins d'engagement consécutives** où une connexion conductrice de feu reste ouverte depuis la source. Fermer le lien ou éteindre la source interrompt cette exposition. L'ouverture est le premier engagement compté.

La propagation utilise les sources présentes au début de l'étape environnementale, après les effets de l'action. Une pièce nouvellement en feu ne re-propage pas dans cette même étape. Les passages de maintenance participent selon leurs capacités déclarées, pas selon leur présence dans un parcours conseillé.

Ouvrir puis éteindre au pas suivant permet l'extinction avant la deuxième mise à jour. Ouvrir puis effectuer un autre engagement peut laisser le feu gagner la pièce du joueur. La lecture intermédiaire ne change pas le résultat.

AR-01 n'ajoute à cela ni destruction de tout l'équipement, ni fumées/O₂, ni décompte global. La portée d'extinction depuis un seuil protégé relève des positions de la fixture, pas d'une commande à distance sans justification.

### 5.4 Vide — AR-02

[AR-02](../09-aventure-reference-vide.md) reprend les règles ci-dessus pour la même créature (D-058), sans feu ni huile ni avertisseur, et ajoute le vide.

- **État d'air :** une pièce est sans air si et seulement si elle est reliée à une brèche ouverte par des passages ouverts ou non étanches. Ni valeur intermédiaire, ni délai, ni limite d'une pièce par mise à jour, contrairement au feu (D-061/D-067).
- **Moment :** percer, reboucher, ouvrir ou fermer sont l'effet de l'action (étape 2). L'état d'air est recalculé et les expositions appliquées à l'étape 3, avant toute réaction (étape 4) : une créature atteinte n'agit pas dans ce pas (D-071).
- **Créature exposée :** dans la pièce percée, expulsée et sans position dans la station ; ailleurs, inerte sur place, sans bloquer le passage. Définitif, même si l'air revient (D-062/D-071).
- **Capsule :** écoutille fermée, elle n'est plus reliée à la brèche et retrouve son air (D-065).
- **Bornes :** le vide ne déplace aucun objet ; aucune règle de son propre au vide dans AR-02 (D-071). L'exposition du passager relève de C-04 §3.1.

### 5.5 Morceaux du lancement

Règles des nouveaux morceaux de la [conception des morceaux](../13-morceaux-lancement.md) (D-175) :

- **Salle des machines (D-163, D-173).** Machines en marche, aucun son né dans la salle n'en sort, et le passager qui s'y trouve n'entend pas la créature bouger dans les pièces voisines ; la vue reste normale. L'interrupteur, uniquement dans la salle, arrête ou relance les machines en une action ; la relance produit un grand bruit entendu hors de la salle, comme le test de l'avertisseur.
- **Passerelle (D-164).** Une créature qui s'engage sur la planche tombe : elle est neutralisée pour de bon et la planche est perdue.
- **Sans gravité (D-165, D-168).** Gravité coupée, la créature met deux réactions de plus pour traverser la zone. L'interrupteur fonctionne toujours (une action).
- **Chambre froide (D-166, D-170).** Si la créature y entre et que la porte se referme derrière elle, elle n'agit plus qu'une réaction sur deux pour toute la partie.

**Précisions du porteur (D-234 à D-240).** La relance des machines et le compresseur sonnent fort le temps de trois réactions, comme le test de l'avertisseur (§5.1). Machines en marche, la créature dans la salle n'entend rien du dehors et aucun bruit ne traverse la salle. Les deux bords de la passerelle s'entendent sans se voir. Gravité coupée, ressortir de la zone par une autre porte que celle d'entrée demande au passager de dériver jusqu'à elle (une action), à la créature deux réactions ; les interrupteurs de gravité sont dans les pièces qui touchent la zone. La créature est ralentie dès qu'une porte de la chambre froide se ferme pendant qu'elle est dedans ; le pupitre ferme les deux portes d'un coup.

**Mélanges (D-174).** Les ralentissements s'additionnent : le froid saute une réaction sur deux ; réactions perdues (huile) et traversée sans gravité se comptent sur les réactions qui restent (MX-01). Le vide éteint un foyer qu'il atteint, et le feu ne gagne pas une pièce sans air (MX-02). Vide et huile s'ignorent (MX-03). L'huile ne se verse pas gravité coupée (MX-04) et reste glissante dans la chambre froide (MX-05). L'air et le feu passent par-dessus le vide de la passerelle, toujours ouvert, comme par un passage ouvert ; l'air quitte la salle des machines, la zone sans gravité et la chambre froide comme toute autre pièce (D-246, D-247).

### 5.6 Coopération et drone réparable M-12

D-304 à D-306 : le drone exécute un trajet local puis maintient une commande pendant les gestes suivants du passager. Lire, consulter, ouvrir un menu ou recevoir un refus ne font avancer ni son déplacement ni sa tâche. Le maintien permet au passager de pousser le chariot ailleurs ; le passage reste dégagé lorsque la tâche est terminée.

Le bruit du déplacement et du maintien est un son fort soumis à §4.1 et §4.2 : ni localisation omnisciente de la créature, ni priorité artificielle aux pas. Les autres sources sonores gardent leurs règles ; les machines peuvent couvrir le bruit. Si la créature atteint le drone et réagit contre cette source, elle peut le faire dérailler en une réaction. Arriver puis attaquer ne constitue pas une double réaction gratuite. Un passager effectivement visible reste prioritaire.

Le déraillement coupe le moteur et relâche la commande. La remise sur rail et le réarmement sont deux engagements distincts ; entre les deux, le frein n'est pas desserré. Les réactions, dés et blessures restent ceux de C-04. Réparer ne soigne pas et ne suspend pas la menace. Les règles de C-03/C-04 priment sur les simplifications de la maquette de conception.

## 6. Attentes de test, non exécutées

| ID | Mise en situation | Attente |
| --- | --- | --- |
| T-01 | Dix lectures/menus entre deux engagements | Aucun compteur, ressource, danger ou RNG métier avancé |
| T-02 | Ouvrir S–G puis éteindre depuis le seuil | Foyer éteint avant seconde propagation, aucune extension à S |
| T-03 | Ouvrir S–G puis engager un autre geste sans fermer/éteindre | Le lien atteint sa deuxième exposition ; seule la pièce voisine peut nouvellement s'enflammer |
| T-04 | Activer le test sonore | Réactions 0, 1, 2 couvertes par le son ; expiration après 2, pas avant sa résolution |
| T-05 | Faire glisser la créature | Réaction 0 interrompue, 1 et 2 sautées, capacité retrouvée à 3 |
| T-06 | Réutiliser le même seuil après glissade | Danger connu, aucune remise à deux réactions perdues par simple réouverture |
| T-07 | Source entendue mais lien trop étroit | Aucun passage du gabarit incompatible, origine perçue conservée |
| T-08 | Résoudre une fuite exposée selon C-04 | Une seule résolution hostile de cette menace dans cet engagement |
| T-09 | Joueur séparé ou non visible | Aucun accès caché à sa nouvelle position pour décider la réaction |
| T-10 | Sauvegarder/reprendre entre deux réactions perdues | Même nombre de réactions restantes, sans remise à zéro ni doublon |
| T-11 | Percer avec deux portes ouvertes en chaîne | Les trois pièces sans air dans la même mise à jour |
| T-12 | Refermer une porte après la brèche | Pièces situées derrière de nouveau avec air à cette mise à jour |
| T-13 | Percer au pas qui suit l'entrée de la créature dans la pièce | Expulsée avant sa réaction, aucune attaque |
| T-14 | Reboucher après neutralisation puis reprendre la sauvegarde | Air revenu, créature toujours expulsée ou inerte |
| T-15 | Ouvrir une porte grippée dans la salle des machines en marche | Aucun son hors de la salle |
| T-16 | Relancer les machines | Grand bruit perçu par la créature voisine |
| T-17 | Créature enfermée une fois dans la chambre froide, puis glissée sur l'huile | Une réaction sur deux, et deux réactions perdues comptées sur celles qui restent |
| T-18 | Le vide atteint une pièce en feu | Foyer éteint, aucune propagation dans la pièce sans air |

Ces tests utiliseront des états initiaux explicitement qualifiés et les vraies commandes métier. Des fixtures de compteur ne démontrent pas à elles seules la jouabilité d'un parcours complet.

## 7. Réserves

C-03 n'autorise pas à coder le nom « O » ou « avertisseur d'AR-01 » dans le moteur. Les capacités et stimuli doivent porter la règle. Les formats exacts, primitives exposées, stratégies d'indexation et contraintes de génération sont à préciser dans l'architecture et C-02/C-06/C-08.

Les règles sont acceptées comme conception de référence par Q-49/Q-50 ; performance, expérience humaine, intérêt des délais et fonctionnement effectif restent à mesurer. Pas de statut « validé sur téléphone ».
