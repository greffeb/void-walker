# Créature mobile, information et difficulté — conception

> **Statut :** conception issue de la discussion avec le porteur du 2026-10-21, relue par un constructeur ; réponses du porteur intégrées le même jour. Approuvée par le porteur le 2026-10-21. **Lot 4** (poste de surveillance §4.3, messages d’IA Station §4.5) : réécrit après les maquettes du 2026-10-23, relu par un constructeur, tranché par le porteur sur maquette ; livré au lot 4. Décisions consignées dans 03 : D-330 à D-342 (liste en §12) ; lot 2 (écoute) : D-343 à D-347 ; lot 3 (capteur) : D-350 à D-354 ; lot 4 (salle de surveillance, carte révélée, caméras, fenêtre, messages d'IA Station) : D-355 à D-359.
> **Zones :** orange pour le moteur, le vérifieur, le format des morceaux, l'appli et chaque seuil d'équilibrage ; rouge pour la sauvegarde, dont le format change (§9).
> **Sources :** discussion du 2026-10-21 ; issues #216, #217, #241 ; D-161, D-177, D-178, D-180, D-181, D-241, D-275, D-276, D-279 ; C-03 ; 17 §1 et §7 (IA Station).

## 1. Intention

Le porteur aime explorer une grande station : le lore, les messages, les traces aux murs. Ce qui ne marche pas, c'est la créature :

- **elle est prévisible** : sa place est fixe par morceau, et on l'apprend par cœur (dans la baie, elle attend toujours dans la salle d'embarquement) ;
- **la prudence ne rapporte rien** : rien ne permet de savoir ce qu'il y a derrière une porte fermée, donc on ouvre au hasard ;
- **la rencontre n'est pas une décision** : quand on sait où elle est, on encaisse un coup, on ferme et on part.

La partie visée ressemble à un **puzzle d'information**, sur le modèle de *Duskers* (la référence du porteur). Savoir coûte quelque chose (du temps, du matériel, du bruit) et rapporte quelque chose. L'information n'est jamais complète : un capteur lâche, une pièce reste aveugle, et il faut alors prendre un risque calculé ou inventer un détour. Le meilleur moment, c'est d'avoir **manipulé la menace** : ouvrir une porte, attendre qu'elle passe, refermer derrière elle. Si on a mal combiné ses actions, la partie bascule en **poursuite**, ce qui existe déjà.

Le porteur sait que ces outils rendront le jeu plus facile. Le réglage de difficulté (§7) est là pour compenser.

## 2. Objectifs, non-objectifs, anti-objectifs

**Réussi si :**
- on ne peut plus savoir par cœur où se trouve la créature dans un morceau donné ;
- avant d'ouvrir une porte, le joueur a toujours au moins un moyen, payant ou risqué, d'apprendre quelque chose sur ce qu'il y a derrière ;
- un joueur prudent évite plus souvent la rencontre qu'un joueur pressé, et le sent ;
- il devient possible de contourner ou d'enfermer la créature par les portes, et ça arrive en partie réelle ;
- une partie dure au moins autant qu'aujourd'hui ; un peu plus long convient, plus court non.

**Non-objectifs :**
- **Campagne ou progression sauvegardée entre parties.** Refusée : elle demanderait un lore plus vaste, une direction et un choix des stations. Au plus, un réglage à « Nouvelle partie ».
- **Directeur d'IA** à la *Alien: Isolation*. Écarté par le porteur, trop lourd pour des parties de dix minutes.
- **Nouvelles menaces** (#216). Elles viendront plus tard ; ce lot ne prépare que ce qui est indispensable (§8).
- **Blessures plus dures.** Le nombre de coups est déjà assez dur. Une blessure durable reste une option possible pour un mode « hardcore ».

**Échec même si ça tourne :**
- la créature tombe sur le joueur sans aucun signe possible avant, alors qu'il a été prudent ;
- un indice qui ment, sauf dans les cas annoncés (§4.1, machines) ;
- un indice qui tient la main : on ne dit jamais « la créature est derrière cette porte » (mémoire porteur « ne pas tenir la main ») ;
- IA Station qui nomme la menace (17 §7) ;
- une station publiée qu'un tirage de dés rend impossible (§10) ;
- une sauvegarde existante qui casse sans être signalée.

## 3. La créature se déplace

### 3.1 Son territoire

- Au départ, **certaines portes sont déjà ouvertes** ou **forcées** pendant l'incident. Le lore le justifie : sas bloqué ouvert, porte défoncée.
- Le **territoire** est l'ensemble des pièces reliées à la créature par des passages ouverts. Il est recalculé à chaque pas : une porte que le joueur ouvre l'agrandit, une porte qu'il ferme le réduit, une porte forcée reste ouverte (D-279).
- La créature **n'ouvre jamais une porte**. Elle en force une seulement :
  - **lentement** si elle entend un bruit derrière (nombre de réactions en paramètre, plus que les deux de la poursuite) ;
  - **vite** en poursuite, comme aujourd'hui (D-279).
- Une porte forcée au départ est un **signe** à lire, au même titre qu'une trace.
- **Étendue du territoire : à trouver en jouant** (porteur). Elle peut couvrir la seconde moitié de la station, environ 75 %, ou toute la station. Le premier lot en fait un paramètre et la règle se fixe après des essais sur téléphone. D-315 (créature tardive), D-316 et les chemins tirés seulement s'ils l'accueillent (M-04, M-05, M-07, M-10) tiennent jusqu'à cet essai. On les révise ensuite si l'étendue retenue les contredit.
- **Choix de l'agent : qui ouvre les portes au départ.** Chaque morceau déclare les portes qui *peuvent* être ouvertes ou forcées au départ, ce qui garde le lore cohérent. Le tirage en ouvre plus ou moins selon la difficulté (§7).
- **Choix de l'agent : ce qui la fait forcer lentement une porte avant le contact.** Seuls les bruits forts (relance des machines, avertisseur, drone, chute d'objet) le font. Les pas du joueur ne le font pas, comme aujourd'hui avant le contact (D-276). Le joueur prudent garde ainsi le contrôle des portes qu'il ferme.

### 3.2 Comment elle bouge

- **Départ tiré au hasard** parmi les pièces de son territoire, et non plus à la place fixe du morceau. D-161 tient toujours : jamais dans la pièce de départ.
- **Dé de rencontre** (d6), lancé toutes les N actions du joueur (N en paramètre, §7) :
  - **1** : elle passe dans une pièce voisine de son territoire, tirée au hasard ;
  - **2** : un **signe** se produit (§4.5) ;
  - **3 à 6** : rien.
- Elle laisse des **traces fraîches** dans les pièces qu'elle traverse. Elles vieillissent ensuite, et le joueur peut y lire un passage récent. Les traces actuelles du lot grandes stations restent.
- **Le bruit garde la priorité.** Les règles d'ouïe et de poursuite ne changent pas (D-177, D-178, D-276) : elle va vers ce qu'elle entend, puis reste sur place jusqu'au prochain jet.
- Le rythme reste **lent**, une pièce de temps en temps, pour que la créature reste lisible et qu'un capteur ait le temps de servir.
- **Remplace D-048** (pas de patrouille sans alerte) : le porteur veut qu'elle bouge d'elle-même.
- **La pièce du joueur fait partie du tirage** (porteur). Si le joueur reste dans une pièce dont la porte est ouverte sur le territoire et attend, la créature peut passer par là. Elle n'arrive jamais sans signe : pour entrer, elle doit d'abord se trouver dans la pièce voisine, où le joueur l'entend bouger par la porte ouverte (OP-01). Son entrée suit les règles actuelles d'une créature qui entre dans la pièce du joueur.
- **Choix de l'agent : le dé se tait pendant la traque.** Après le premier contact, la traque de D-276 (oreille ouverte, fouille) gouverne seule. Le dé reprend quand la créature a perdu la piste. Il y a deux régimes, avant et pendant la traque, et pas de fusion.

### 3.3 Le contact ne change pas

- **Le joueur la surprend** (il entre sans bruit dans sa pièce) : il a une action gratuite, sans dégât, pour reculer et refermer. Elle tente ensuite de forcer la porte.
- **Elle le surprend** (elle était derrière une porte bruyante) : elle entre aussitôt et frappe à l'action suivante. Seule l'huile versée à l'avance sur le seuil évite le coup.

## 4. L'information

### 4.1 Écouter à une porte

- Action nouvelle. Elle coûte une action, donc du temps.
- **Interface tranchée sur maquette (Q-2, 2026-10-22, D-343) : ni bouton par porte, ni « Regarder ».** ATTENDRE écoute à toutes les portes, ouvertes comme fermées, dans les grandes stations. Les deux pistes ci-dessous sont gardées pour l'historique. Chaque porte garde une seule ligne, comme aujourd'hui (`[SALLE DES MACHINES][OUVRIR]`), et l'écoute ne doit pas prendre toute la place. Deux pistes :
  - **un bouton par porte** sur la même ligne : `[SALLE DES MACHINES][OUVRIR][ÉCOUTER]` ;
  - **réutiliser « Regarder »** : une seule action écoute toutes les portes fermées de la pièce, et le résultat est résumé dans la narration.
  La seconde piste coûte moins de place et une seule action pour toutes les portes. Le jet se fait alors porte par porte, dans la même action.
- **Jet de perception.** Trois résultats possibles :
  - **net** : on entend quelque chose bouger ;
  - **vague** : peut-être quelque chose ;
  - **rien**.
  Le texte reste au ton du jeu et ne nomme jamais la créature.
- **Machines en marche** dans la pièce voisine ou dans celle du joueur : le résultat peut **tromper**, on entend quelque chose qui n'y est pas. C'est le seul mensonge autorisé, et il a une cause visible.
- **Pièce aveugle** derrière la porte (§4.4) : on n'entend que les machines ou le silence du froid, et le jet n'a pas lieu.
- Écouter est silencieux : l'action ne fait pas perdre l'initiative du §3.3.
- **Choix de l'agent : l'aperçu de risque.** Un résultat « net » compte comme un bruit entendu derrière la porte et déclenche l'avertissement actuel (D-181). « Vague », le bip d'un capteur ou un mouvement vu au poste ne changent pas l'aperçu : le joueur fait lui-même le lien, pour ne pas lui tenir la main.

### 4.2 Capteurs (butin)

Consigné par D-350 à D-353. Précisé avec le porteur le 2026-10-22 sur maquettes ([capteur.html](../../maquette/capteur.html), puis [capteur-carte.html](../../maquette/capteur-carte.html), variante E retenue), lot 3.

- Objet trouvé dans les pièces à fouiller : **au plus un par station** (porteur, « déjà pas mal comme bonus »), une ligne de la table de butin.
- **Usage visé** (porteur) : manipuler la créature. On pose un capteur dans un cul-de-sac, on en laisse la porte ouverte, on s'éloigne ; quand le capteur dit qu'elle y est, on revient fermer pour l'enfermer.
- **Pose** : dans la pièce où se trouve le joueur, pour une action. Le terminal l'annonce (« CAPTEUR : EN SERVICE. ») et la carte le montre. Un capteur posé l'est **pour de bon** : on ne le ramasse pas.
- **Sur la carte** (porteur, variante E de [capteur-carte.html](../../maquette/capteur-carte.html), préférée au bandeau de la variante B) : une icône dans la pièce du capteur, un losange qui change selon l'état : **calme** (contour et point verts), **MOUVEMENT** (rouge plein, avec des ondes) tant que la créature est dans sa pièce, **brouillé** (contour en pointillés, sans point), **panne** (barré). En ouvrant la carte, le joueur sait donc si elle y est **encore**.
- **« ! » sur le bouton CARTE** à chaque changement d'état, comme celui d'IA STATION (D-263), en vert ; il s'éteint quand on ouvre la carte. Pas de « ! » à la pose.
- **Bip** : chaque changement d'état est dit une fois dans le récit (« Votre terminal bipe deux fois. CAPTEUR : MOUVEMENT. »), comme l'écoute ne redit que ce qui change (D-346).
- Un capteur peut **tomber en panne**. La panne **s'annonce** (« CAPTEUR : PLUS DE SIGNAL. ») et reste barrée jusqu'à la fin. La probabilité est un réglage de difficulté.
- **La créature peut détruire un capteur** de la pièce où elle se trouve. Il s'affiche comme une panne : le joueur ne sait pas lequel des deux.
- **Pièce aveugle** (porteur) : on peut y poser le capteur, mais il est **brouillé** tant que la pièce l'est (machines en marche, chambre froide). C'est un quatrième état, temporaire : il redevient calme ou MOUVEMENT quand les machines s'arrêtent. « Calme » n'est jamais affiché dans une pièce aveugle.
- **Choix de l'agent** : la destruction se tire sur un dé à part (haché `capteur:<graine>:<action>`, comme celui de rencontre), quand la créature reste dans la pièce du capteur (chance en paramètre de difficulté) ; le capteur ne capte que la créature, pas le joueur ; le bip ne s'entend pas, il n'attire rien.

### 4.3 Poste de surveillance (#241)

> **Lot 4, tranché par le porteur sur maquette le 2026-10-23** ([poste.html](../../maquette/poste.html), variante A). Remplace la première version de ce paragraphe (énigme ou clé laissée au constructeur, « capteurs de la station » à zones grises).

**À quoi il sert (porteur).** « Juste un moyen de révéler toute la carte d'un coup », avec des caméras qui disent, tant qu'on regarde, si certaines pièces ont la menace dedans. On peut y attendre plusieurs tours pour voir si quelque chose bouge. Il donne la seconde moitié de la partie : on découvre d'abord le lore et les ressources, puis on prépare la sortie.

**La salle.**
- Une **salle à part**, qui n'est pas le poste de sécurité de M-11 (porteur). Dans **20 % des grandes stations publiées** (porteur), une seule par station.
- **Choix de l'agent : son nom à l'écran est « salle de surveillance »**, pour ne pas la confondre avec le « poste de sécurité » de M-11. C'est une pièce du catalogue (`content/catalogue/pieces.ts`, catégorie `commandement`, en impasse), avec un **terminal** fixe.
- Elle n'est jamais sur le chemin obligé : la preuve des stations (§10) ne la compte pas.

**Le mot de passe.**
- Utiliser le terminal sans le mot de passe : l'écran de connexion s'allume et demande un mot de passe. Le récit dit seulement qu'il manque, jamais où le chercher (mémoire porteur « ne pas tenir la main »).
- Le mot de passe est écrit sur un **post-it**, posé **au hasard dans une autre pièce** de la station (porteur), comme les clés dispersées des grandes stations. Le joueur le **garde** dans son inventaire.
- Post-it en main, utiliser le terminal connecte le joueur : il ne tape rien, le code du post-it suffit (« Vous tapez le code du post-it. »). La connexion vaut pour toute la partie.
- **Choix de l'agent :** le code est une suite de lettres et de chiffres sur le post-it (« garde — K7-ORION »). Ces chiffres sont permis : le post-it est un support écrit, comme un document (17-univers §6). Le post-it n'est pas un document de la réserve : c'est un objet, comme une clé.

**Ce que montre le terminal (variante A).**
- Une **fenêtre plein cadre**, comme la carte, titrée « SURVEILLANCE » avec un repère « ● DIRECT ». En bas : une ligne pour le dernier changement, puis deux commandes, **ATTENDRE** et **QUITTER**.
- **Le plan entier** de la station, portes, feu et vide d'air compris, tel qu'il est au moment de la connexion. Le brouillard est levé **pour de bon** : après QUITTER, la carte ordinaire reste révélée toute la partie.
- **Les caméras de la station**, en direct, tant que la fenêtre est ouverte. Une caméra est un **carré avec un objectif**, distinct du losange du capteur du joueur, avec les mêmes quatre états (D-351, D-352) : calme (contour vert et objectif), mouvement (plein rouge et ondes), brouillée (pointillés, pièce aveugle), panne (barrée).
- **Le capteur du joueur** (lot 3) garde son losange, sur le plan du poste comme sur la carte.
- **ATTENDRE** est l'attente ordinaire : une action, le dé de rencontre tourne, la créature peut bouger. Les caméras qui changent le disent sur la ligne du bas (« REMISE : MOUVEMENT. » en rouge, comme le bip du capteur). Tout autre événement du pas (bruit proche, écoute aux portes, entrée de la créature) s'écrit sur la même ligne ou ferme la fenêtre ; le choix revient au constructeur, mais aucun avertissement ne doit être masqué par la fenêtre.
- **QUITTER** ferme la fenêtre, sans coûter d'action. Utiliser le terminal de nouveau la rouvre, et remet le plan à jour.

**Les portes restent figées (porteur).** La carte révélée montre les portes **telles que le poste les a vues**, jusqu'à ce que le joueur repasse devant ou revienne au terminal. Une porte forcée plus tard, loin du joueur, reste dessinée fermée : la carte peut être dépassée, mais elle ne ment pas. **Choix de l'agent :** la connexion écrit toute la station dans la mémoire du passager (`engine/memoire.ts`, 14 §3.1), pièces et liaisons, à l'heure de la consultation. La carte ordinaire n'a rien d'autre à apprendre : ce que le passager voit ensuite remplace ce souvenir, comme aujourd'hui.

**Précisions de l'agent, après la relecture du constructeur :**
- **Comme la carte révélée des versions de test** (`app/carte/revelee.ts`) : toutes les pièces deviennent connues et toutes les liaisons découvertes, donc les boutons « Se déplacer vers » nomment aussi leur destination. Mais ce n'est pas une option de test : c'est une règle : la connexion (`connecte`) écrit `decouvertes` et la mémoire des liaisons, et la carte dessine alors toute la station ; `visitees` ne change pas, pour garder le regard automatique à l'arrivée (D-356).
- **Un passage caché reste caché** (M-05, `cachee`) : le plan de la compagnie ne le connaît pas, et l'énigme de M-05 tient. Une porte sans signalétique apparaît comme une porte.
- **Contenu des pièces (porteur) : rien, sauf le feu et le vide d'air.** Ni clés, ni butin, ni post-it, ni documents : il faut aller voir sur place. Le feu apparaît sur le plan tel qu'il est à la consultation, puis reste figé comme les portes (souvenir de la pièce, D-213). Le vide suit la règle actuelle : le voyant d'une porte étanche est tenu à jour dès que sa destination est connue (14, OP-04), ce qui est le cas de toutes après le poste. Le constructeur reprend les repères de la carte actuelle (14).
- **Le post-it et la salle** : la salle est une impasse du catalogue déjà posée, et le post-it va dans une autre annexe ; ni l'un ni l'autre n'est dans la pièce de départ de la créature ni dans le segment de la capsule, et le post-it jamais dans une pièce qui garde une clé (le poste doit servir à la seconde moitié de la partie). La part de 20 % est un tirage par identifiant de station, pas par graine (D-355) ; le test de la liste publiée l'accepte entre 15 et 25 %, comme pour le capteur.
- **Les homonymes** sont déjà numérotés à l'assemblage (`numeroter`, « Coursive A / B ») : IA Station et la fenêtre du poste reprennent ces noms.

**Les caméras (porteur).**
- Une caméra dans **environ une pièce sur trois**, jamais dans la salle de surveillance elle-même. **Un tiers** d'entre elles sont **en panne au départ**. Ces deux parts sont des paramètres, que le réglage de difficulté du lot 5 fera varier.
- **La créature peut détruire une caméra**, comme le capteur (D-353, même tirage hors journal). Une caméra détruite s'affiche comme une caméra en panne. **Choix de l'agent :** une caméra peut aussi tomber en panne en cours de partie, au même seuil que le capteur. Sans cela, une caméra perdue voudrait toujours dire « elle est passée là », et le message « Matériel » tiendrait la main.
- Une caméra ne voit que la créature, jamais le passager. Elle dit « MOUVEMENT », jamais « la créature ». Dans une pièce aveugle, elle est brouillée.
- Hors de la fenêtre du poste, les caméras ne se voient nulle part : ni sur la carte, ni dans le récit, ni par un « ! ». Seul IA Station peut signaler une caméra perdue (§4.5).
- Les caméras n'existent que dans les stations qui ont une salle de surveillance.

**Ce que le poste ne fait jamais.** Il ne montre jamais la créature directement. On ne la voit que si une caméra ou le capteur, en état de marche, est dans sa pièce. Un mouvement vu au poste ne change pas l'aperçu de risque (§4.1).

### 4.4 Pièces aveugles

- Salle des machines en marche et chambre froide (porteur). D'autres pourront s'ajouter après essai.
- On ne peut ni écouter à leur porte ni y faire marcher un capteur. Ce sont elles qui obligent à prendre des risques.

### 4.5 Les signes

La face 2 du dé de rencontre produit un signe, tiré parmi :
- **un bruit lointain**, vague, sans direction précise (D-077) ;
- **une trace fraîche** dans une pièce que le joueur traversera ;
- **un message d'IA Station**, exact sur les systèmes et muet sur la menace (17 §1 et §7). Par exemple : *« Porte 4-B, secteur fret : anomalie d'intégrité détectée. Une intervention de maintenance a été planifiée. Merci de votre patience. »* Ces messages sont fiables et toujours indirects.

Le signe porte sur un événement réel, comme une porte forcée, un capteur détruit ou un passage récent. Il ne ment jamais.

**Les messages d'IA Station, lot 4 (porteur, sur maquette le 2026-10-23, [ia-signes.html](../../maquette/ia-signes.html)).**
- IA Station **peut nommer des pièces** (porteur). Elle ne nomme jamais la menace et ne donne aucun chiffre (12 §1.5). L'exemple « Porte 4-B » devient donc « Porte entre la remise et la coursive B ».
- Quatre sortes de messages, toutes gardées par le porteur. Chacune porte sur un fait vrai au moment où elle parle :
  - **Porte** : une porte que la créature a vraiment forcée plus tôt. « Porte entre la remise et la coursive B : intégrité compromise. Une intervention de maintenance a été planifiée. Merci de votre patience. »
  - **Matériel** : une caméra ou le capteur du joueur qui ne répond plus, sans dire si c'est une panne ou une destruction (D-353). « Caméra de la remise : liaison perdue. Un technicien sera dépêché dès que possible. »
  - **Passage** : une pièce où la créature est passée il y a peu (dans la fraîcheur des traces, `FRAICHEUR`). « Cambuse : détecteur de présence déclenché, puis rétabli. Aucune action n'est requise. »
  - **Présence** : une gêne dans la pièce où elle se trouve en ce moment. « Dortoir : obstruction de la ventilation signalée. Merci de ne pas encombrer les bouches d'aération. » C'est au joueur de faire le lien.
- **Rareté (porteur) :** « pas plus de 1 toutes les 5 min », soit **un ou deux messages par partie en grande station**. **Choix de l'agent :** au moins **30 actions** entre deux messages, et **au plus deux** par partie. Les deux sont des paramètres.
- **Quand elle parle (choix de l'agent).** Sur la face 2, aux mêmes conditions que le signe actuel (hors traque, créature active, pas dans la pièce du joueur, joueur hors d'une salle des machines en marche). Si la créature est dans une pièce voisine, le bruit proche garde la priorité, comme aujourd'hui. Sinon, quand un message est permis (écart et plafond), IA Station parle **à la place** du bruit lourd ; sinon, le bruit lourd reste. La sorte est tirée au hasard, hors journal (D-334), parmi celles qui ont un fait vrai à dire ; « Présence » et « Passage » en ont toujours un, « Porte » et « Matériel » seulement après l'événement. Un même fait n'est pas annoncé deux fois. Les portes forcées et les caméras en panne **dès le départ** ne sont pas des faits à annoncer : IA Station ne signale que ce qui change pendant la partie.
- **Pièces pas encore découvertes (choix de l'agent).** IA Station peut les nommer : elle connaît la station (le porteur : « l'IA peut citer des pièces »). Le nom ne s'ajoute pas à la carte : le joueur doit trouver la pièce lui-même.
- **Partout où il y a une créature mobile**, avec ou sans salle de surveillance. Sans caméra ni capteur posé, il n'y a pas de message « Matériel ».
- **Affichage :** le système d'aujourd'hui (D-263) : un « ! » sur IA STATION, le son d'arrivée, et le message en tête de la fenêtre, marqué « nouveau ». Rien dans le récit.
- Le message compte comme un signe perçu à l'écran de fin, comme le bruit lointain (D-334). Il ne change pas l'aperçu de risque.
- **Choix de l'agent :** pour « Présence », une petite liste de gênes au ton de la compagnie (ventilation, éclairage, capteur de porte, pression), tirée au hasard, toutes vraies quelle que soit la pièce. Les textes sont écrits par l'assistant principal et restent à valider par le porteur.

### 4.6 Drone éclaireur (butin)

> **Reporté** par le porteur le 2026-10-22 (D-354) : le lot 3 ne livre que les capteurs. Ses deux usages (explorer une zone ouverte, servir d'appât) tirent en sens contraire sur le bruit ; à reprendre plus tard.

- Objet rare, distinct du drone de maintenance sur rail de M-12.
- On l'envoie dans une pièce voisine par une porte ouverte ou entrouverte (règle de passage à préciser), puis on le pilote **pendant un nombre limité d'actions**, jusqu'à épuisement de la batterie.
- Il rapporte le **mouvement** dans la pièce où il se trouve. Il ne fonctionne pas en pièce aveugle.
- Il **fait du bruit** (porteur) : il sert d'appât, et la créature peut le détruire (comme le drone de M-12, C-03 §5.5).
- Piloter le drone coûte des actions du joueur : le temps passe et le dé de rencontre tourne.

## 5. Contact et poursuite

Rien ne change (§3.3, D-276, D-279). La seule nouveauté est la vitesse lente pour forcer une porte vers un bruit, hors poursuite (§3.1).

## 6. Une partie type, pour vérifier que tout s'emboîte

1. On explore et on lit le lore. Des traces, de plus en plus fraîches, montrent qu'une chose circule. Une porte défoncée au départ fait comprendre qu'il existe une zone ouverte.
2. On ramasse deux capteurs. On en pose un à l'entrée de la zone ouverte. Un bip, plus tard : quelque chose est passé.
3. On écoute à une porte : vague. Le joueur passe ailleurs.
4. On trouve la salle de surveillance ; le terminal demande un mot de passe. Plus tard, un post-it dans la cambuse donne le code. Connecté, le plan entier apparaît, et une caméra détecte un mouvement dans la cuisine voisine de l'embarquement.
5. On fait du bruit dans la cuisine par le drone. Elle y va. On ferme la porte de la cuisine derrière elle et on traverse l'embarquement.
6. En cas d'échec : poursuite, portes, huile, comme aujourd'hui.

## 7. Difficulté

Un **réglage à « Nouvelle partie »** : Facile, Normal, Difficile. Il ne change que des paramètres de génération et de règle, jamais le tirage des morceaux. Aucune mesure de difficulté station par station n'est nécessaire.

| Paramètre | Facile | Normal | Difficile |
| --- | --- | --- | --- |
| Capteurs et drones à trouver | nombreux | quelques-uns | rares |
| Caméras de la station en panne au départ | peu | un tiers | la plupart |
| Panne des capteurs du joueur | rare | occasionnelle | fréquente |
| Actions entre deux jets du dé (N) | grand | moyen | petit |
| Taille du territoire de départ | petite | moyenne | grande |
| Nombre de créatures (grandes stations) | 1 | 1 | 2 à 3 (§8) |

Les valeurs chiffrées sont des seuils d'équilibrage, montrés au porteur avec leurs mesures.

**Choix de l'agent : un seul catalogue pour les trois réglages.** Une même graine donne le même plan dans les trois réglages. La preuve (§10) se fait dans le réglage le plus dur, avec le plus grand territoire et le plus de créatures. Les paramètres ne vont que dans un sens en devenant plus faciles, donc la preuve vaut aussi pour les réglages plus faciles. Une seule liste publiée, un seul temps de publication.

Une option « hardcore » avec blessures durables, par exemple une blessure qui laisse une trace de sang que la créature suit, peut venir plus tard. Elle est hors du lot.

La taille de la station **n'est pas** un levier de difficulté. Avec une créature qui bouge, une petite station est plus serrée, donc pas forcément plus facile. La taille ne change que la longueur de la partie.

## 8. Moteur : ce qu'on prépare pour la suite

- **Plusieurs créatures dans l'état de partie.** Aujourd'hui, l'état n'en connaît qu'une (`etat.creature`, [engine/creature.ts](../../../engine/creature.ts)). On passe à une liste dès ce lot, même s'il n'y a qu'un élément en Facile et Normal. En Difficile, sur une grande station, il y a 2 ou 3 créatures (#217), chacune avec son territoire. Le joueur ne sait pas combien il y en a, et les bruits restent vagues. L'ordre des réactions entre créatures est laissé au constructeur, mais il doit être déterministe (C-03 §3).
- **Comportement en paramètres** : rythme du dé, vitesse pour forcer une porte lentement ou vite, territoire de départ. C'est le premier pas vers la « menace en données » de #216. On ne va pas plus loin : les sens, les peurs ou l'ouverture des portes viendront avec la première nouvelle menace.

## 9. Sauvegarde

L'état de partie change : liste de créatures, dé de rencontre, capteurs posés, batterie du drone, portes vues au poste, réglage de difficulté. Au lot 4 : terminal connecté, caméras détruites, messages d'IA Station déjà dits (heure du dernier, faits annoncés) ; les caméras et leurs pannes de départ viennent de la station publiée, donc de `VERSION_GENERATEUR`. Le format de sauvegarde change donc. Une partie en cours sauvegardée avant la mise à jour est **refusée et supprimée**, sans migration (porteur : le jeu est en développement, pas en production). C'est la zone rouge : essai manuel sur téléphone.

## 10. Preuve des stations

Aujourd'hui, chaque station publiée est prouvée faisable : un chemin sûr existe vers la capsule. Avec une créature qui bouge au dé, il faut prouver que la station reste faisable **quel que soit le tirage**.

Garantie proposée, sur le plan seul : **entre le joueur et le territoire de départ, le chemin vers la capsule a toujours une porte fermée que le joueur peut garder fermée, ou un détour qui évite le territoire.** C'est la piste la plus simple à prouver. Le constructeur peut en proposer une meilleure, avec ses mesures (part des stations rejetées, part où la capsule est dans le territoire).

C'est le point le plus délicat du lot. Il doit être réglé avant toute publication.

## 11. Questions ouvertes pour le porteur

- **Q-1** Étendue du territoire : à fixer après essai sur téléphone (§3.1).
- **Q-3** Poste de surveillance et messages d'IA Station : **tranchés le 2026-10-23 sur maquettes** ([poste.html](../../maquette/poste.html), [ia-signes.html](../../maquette/ia-signes.html)) : §4.3 et §4.5.
- **Q-2** Interface de l'écoute : **tranchée le 2026-10-22 sur maquette** ([ecouter.html](../../maquette/ecouter.html)) : pas de bouton Écouter, ATTENDRE écoute à toutes les portes (D-343 à D-347, §4.1).

## 12. Décisions à consigner après approbation

1. La créature a un territoire : les pièces reliées par des passages ouverts, recalculé à chaque pas (§3.1).
2. Certaines portes sont ouvertes ou forcées au départ (§3.1).
3. La créature n'ouvre jamais une porte ; elle en force une lentement vers un bruit, vite en poursuite (§3.1, précise D-279).
4. Départ tiré dans le territoire, plus de place fixe par morceau (§3.2, remplace les places des morceaux).
5. Dé de rencontre : 1 déplacement, 2 signe, sinon rien, toutes les N actions ; remplace D-048 (§3.2).
6. Écouter à une porte, avec jet de perception et mensonge possible près des machines (§4.1).
7. Capteurs et drone éclaireur trouvés comme butin (§4.2, §4.6). Capteur livré au lot 3 : D-350 à D-353 ; drone éclaireur reporté : D-354.
8. Poste de sécurité : plan, portes au moment de la consultation, capteurs ; jamais la créature directement (§4.3, #241). Livré au lot 4 comme « salle de surveillance » : D-355 à D-358.
9. Pièces aveugles (§4.4).
10. Signes de la face 2, dont les messages techniques d'IA Station (§4.5). Messages livrés au lot 4 : D-359.
11. Difficulté par un réglage à « Nouvelle partie », sans progression sauvegardée (§7).
12. Plusieurs créatures en Difficile sur les grandes stations ; état de partie en liste dès ce lot (§8).
13. Les sauvegardes d'avant la mise à jour sont refusées et supprimées (§9).

## 13. Laissé au constructeur

- Le découpage en lots. Ordre suggéré : (1) territoire, déplacement, dé, écoute et preuve ; (2) capteurs et drone éclaireur ; (3) poste de sécurité ; (4) réglage de difficulté ; (5) plusieurs créatures.
- Les valeurs de départ des paramètres, à mesurer par bots puis à montrer au porteur.
- Les textes, au ton du jeu et courts pour le téléphone.
- **Les écrans** (écouter, bip du capteur, pilotage du drone, terminal du poste, choix de difficulté) passent d'abord par des maquettes de téléphone montrées au porteur, avec ses questions une par une, **avant tout code d'interface** (pratique du porteur).
- Les sons des nouvelles actions, dans le système de #99.
