# Void Walker V2 — point de départ et reprise de conversation

> **Statut :** BOOTSTRAP EN COURS — issue #89 lancée par le porteur du projet le 2026-10-10, branche `bootstrap/89-socle`.
> **Mise à jour :** 2026-10-21 (M-11 et M-12 tirés dans les grandes stations, proposés par la PR de #236, [13 §7.15](13-morceaux-lancement.md#715-m-11-et-m-12-dans-les-grandes-stations-236) ; validation humaine requise).

## Mission de ce dossier

Préparer, avec le porteur du projet, un ensemble autonome de documents Markdown permettant de faire développer le jeu dans d'autres conversations avec GitHub Copilot et des agents spécialisés (D-126).

Le code sera produit par les agents. Le porteur du projet choisit le produit, arbitre les propositions et accepte les preuves, notamment en jouant sur téléphone. Ce kit doit permettre une reprise sans mémoire de la conversation initiale.

Le présent dossier ne modifie ni le prototype précédent ni le projet Lacets. Il sera transféré comme documentation du nouveau dépôt lorsque son cadrage sera suffisamment stable. Aucun dépôt distant, workflow actif ou permission d'agent n'est créé à ce stade.

## Lire dans cet ordre

1. [01 — Contexte et objectif produit](01-contexte.md).
2. [03 — Journal des décisions](03-decisions.md) : utiliser son index pour repérer les décisions liées à l'issue, puis lire ces entrées seulement. Ne pas charger tout l'historique par défaut ; vérifier le statut de chaque décision avant de l'appliquer.
3. [05 — Cahier des charges](05-cahier-des-charges.md).
4. [06 — Contrats et questions ouvertes](06-contrats.md).
5. [02 — Roadmap et portes de validation](02-roadmap.md).
6. [04 — Workflow agentique](04-workflow-agentique.md) pour préparer ou exécuter une issue.
7. [10 — Architecture](10-architecture.md) : pile et organisation acceptées (D-136).

Les besoins créatifs sont illustrés par les [cinq interactions de référence](07-interactions-reference.md). Leurs intentions sont demandées, leurs modalités techniques restent proposées jusqu'à arbitrage.

La [description des écrans](12-interface-ecrans.md) (maquette v1, direction « Phosphore », [PDF](maquette/maquette-ui-v1.pdf)) est la référence de l'interface (D-140 à D-155). Elle sert aux agents d'interface et au graphiste ; ses points encore ouverts sont listés en §9, ses écarts avec l'interface actuelle en §11.

La [carte en plan de pont](14-carte.md) remplace la carte de la maquette (12 §4.8) : écran, mémoire du passager, plans des stations et règles de génération des plans (D-201 à D-214). Conception validée par parties sur maquettes et sur les mesures d'un prototype jetable ; aucune implémentation.

Le [son](15-son.md) précise la section SON de 12 §4.10 : bruitages du terminal, signaux de blessure, de soin et d'alarme, ambiance de bruit brun et de carlingue, trois rails dans les options (D-216 à D-226). Conception validée par parties à l'oreille, sur un [banc d'écoute](maquette/banc-sons.html) ; implémentation proposée.

L'[installation de la PWA](16-installation-pwa.md) (#174, investigation) : le jeu est déjà éligible à l'invite d'installation de Chrome ; bouton seulement sur Chromium, simple explication sur iPhone et Firefox Android. Première livraison : section « INSTALLATION » des options, invite de Chromium et bulles d'aide d'iPhone et de Firefox, validation humaine requise sur téléphone ; le rappel à l'accueil attend le porteur ; aucune décision prise.

[Ajouter un morceau de station](17-ajouter-un-morceau.md) : guide de travail des agents, écrit après M-11 (#203). Tout ce que touche un nouveau morceau (moteur, textes, tirage, tests épinglés, vérifications, documents, PR), dans l'ordre, avec les pièges déjà rencontrés. À lire avant de préparer un morceau.

L'[aventure fixe AR-01 v1.0](08-aventure-reference.md) est **acceptée comme conception** (D-057). Ses trois témoins P-A/P-B/P-C restent à prouver par le moteur, et aucun n'a été joué sur téléphone. Elle contient des secrets et solutions d'auteur : ne pas la transmettre au playtester aveugle.

L'[aventure AR-02](09-aventure-reference-vide.md), courte référence de la dépressurisation, est **acceptée comme conception** (D-074). Ses trois témoins P-V1/P-V2/P-V3 restent à prouver, aucun n'a été joué. Elle contient aussi des solutions d'auteur.

L'[univers des grandes stations](17-univers.md) (#209, D-322) est la bible du lore : le cadre commun, l'incident de la créature, l'équipage, les lieux hors du plan, la réserve de 39 documents et les règles d'écriture. **Document d'auteur, interdit au playtester**, comme 08 et 09 : il contient les secrets du jeu. Texte final non validé par le porteur.

Premiers socles contractuels acceptés (D-027) : [actions et observation](contrats/C-01-actions-observation.md), [cohérence du monde et des conséquences](contrats/C-05-monde-consequences.md). Leurs questions explicitement ouvertes ne sont pas des décisions implicites.

Contrats acceptés dans la portée d'AR-01 et d'AR-02 (D-055 à D-057, D-074) : [temps et réactions](contrats/C-03-temps-reactions.md), [risques et blessures](contrats/C-04-risques-blessures.md). Le vide y a sa propre section ; il n'est pas déduit des règles du feu.

Contrats acceptés pour tout le lancement (D-082, D-102) : [monde et entités](contrats/C-02-monde-entites.md), [observation, carte et connaissances](contrats/C-06-observation-connaissances.md), [stations et fins](contrats/C-08-stations-fins.md), [sauvegarde et replay](contrats/C-09-sauvegarde-replay.md), [preuves, rapports et gouvernance](contrats/C-10-preuves-gouvernance.md). C-07 accepté également (D-117) : [textes du jeu](contrats/C-07-textes.md). Les dix contrats sont acceptés.

La validation humaine est conservée dans le [journal des parties humaines](journal-parties-humaines.md). Il contient deux parties signées par le téléphone du porteur, sur des stations tirées de L2 (M-07 et M-03) ; aucune aventure de référence n'y est encore validée.

## Autorité documentaire

- Une décision **Validée** dans le journal fait autorité. Une proposition de l'assistant n'est pas une décision utilisateur.
- Le cahier des charges décrit les besoins et le périmètre acceptés ; les contrats décrivent leur signification vérifiable.
- La roadmap organise le travail : elle n'autorise pas à inventer un besoin manquant.
- En cas de contradiction entre une décision et sa projection dans un document, signaler l'écart avant de coder. Ne pas sélectionner silencieusement l'interprétation la plus commode.
- Une modification de comportement doit référencer la décision qui l'autorise. Une ancienne décision est remplacée explicitement, pas supprimée.
- Un statut « vérifié automatiquement » n'est pas une acceptation humaine sur téléphone.

## Ce qui est déjà choisi

- Créativité dans la résolution des situations comme priorité de gameplay.
- Actions contextuelles composables, sans texte libre pour commander le personnage.
- Dés seulement face à un risque réel.
- Partie complète visée : 15 à 30 minutes.
- Petit jeu complet et rejouable publié en PWA ; stores possibles ensuite.
- Une famille de scénarios avec plusieurs situations générées au lancement.
- Objectif commun : s'échapper d'une station spatiale isolée, cadre de lancement retenu.
- Un personnage fixe pour la première version ; pas de création de personnage à importer de la V1.
- Pièces avec positions relatives simples, sans grille tactique ni distances au mètre.
- Lire et consulter les menus/objets est gratuit ; seules les actions engageantes peuvent faire avancer le monde.
- Après une défaite, nouvelle partie : pas de retour annulant la mauvaise décision.
- Une autosave par action engagée pour reprendre une partie active, sans rejouer le hasard.
- Santé, consommables et menace réactive ; pas d'échéance globale, de faim/fatigue ni d'O₂ permanent.
- Niveau de risque qualitatif et conséquences prévisibles présentés avant la tentative.
- Propagation simple des dangers par les passages ouverts, selon des règles bornées.
- Deuxième référence courte pour le vide : quatre pièces, même passager, même créature.
- Vide mortel sans combinaison ; il gagne aussitôt tout ce qui est ouvert vers la brèche et quitte toute pièce qui n'y est plus reliée ; créature exposée neutralisée pour de bon.
- Pas de duel classique : protection, diversion, fuite et préparations environnementales.
- Nouvelle tentative autorisée si elle reste possible, en payant de nouveau coûts et risques.
- Menus de manipulations plausibles, sans révéler les effets secrets.
- Santé par quelques états de blessure, pas une jauge détaillée de PV.
- Une menace principale persistante, avec emplacement et réactions aux actes du joueur.
- Thème d'horreur spatiale, texte majoritaire, interface mobile-first et carte.
- Carte construite au fil de l'exploration ; hors de vue, elle garde le dernier état vu.
- On entend vaguement la créature bouger dans la pièce voisine par une porte ouverte.
- L'assistance parle seulement aux moments prévus ; elle ne répond pas aux demandes d'état.
- Stations assemblées à partir de morceaux écrits à la main, chacune vérifiée : toujours un chemin sûr au départ.
- Si plus aucune sortie n'est possible, le jeu le dit et laisse continuer ; fin racontée, sans score ; même station rejouable avec de nouveaux dés.
- Une seule partie en cours ; export d'une partie ; boutons « bug » et « envoyer ma partie » pour tous, via un petit service qui crée les issues GitHub.
- Une fonctionnalité à valider passe par sa PR : preuves de l'agent, version de test par PR, retours et validation signée par le téléphone du porteur du projet en commentaire de la PR.
- Pile : TypeScript, React, Vite, PWA sur GitHub Pages ; service de rapports sur Cloudflare Workers ; captures automatiques dans les PR.
- Valider : aller au bout d'une partie puis juger ; chaque morceau du lancement au moins une fois ; validation perdue si l'aventure ou ses parcours automatiques changent.
- Dépôt : tests et docs en zone verte, fusionnés par l'assistant principal dans son rôle d'orchestration après relecture indépendante ; moteur en zone orange au début ; branche principale non protégée ; deux rôles d'auteur, contenu et outils.
- Textes en français, au vouvoiement, courts, écrits à la main avec quelques variantes ; pas de chiffre de dé affiché ; écrits par les agents en autonomie (zone verte).
- Lancement : dix morceaux (six tirés des aventures, quatre nouveaux : salle des machines, passerelle effondrée, zone sans gravité, chambre froide), 2 ou 3 obstacles et un seul problème final par station, toujours la même créature, stations tirées au hasard.
- Petites stations d'abord, sans annexes ; puis les grandes stations habitées, qui les remplacent au tirage (D-313 à D-327).
- Créature mise hors jeu avant le problème final : on mesure d'abord dans quelle part des stations c'est possible ; la placer plus souvent près du final reste une réserve.
- Lore léger au lancement : quelques documents à lire, qui servent aussi d'indices, écrits avec soin par l'assistant principal lui-même.
- Objets nécessaires placés hors de leur morceau : pas dans #106, avec les annexes plus tard ; à ne pas oublier.
- #106 en sept livraisons (L0 à L6), du cadrage sur le papier au signal « plus aucune sortie » ; grandes stations, si besoin, dans une issue à part.
- Assemblage : le morceau final apporte l'embarquement ; portes fermées entre morceaux au départ ; pile ou face du final, puis pur hasard ; ordre libre possible avec deux obstacles qui partent d'un même couloir ; panneau caché pour contourner la créature.
- Baie, passerelle et sans gravité (L3) : réussie si chaque station mène à la capsule, la difficulté plus tard ; la vérification cherche d'abord vers le fond de la station (D-264, D-265).
- Chemins d'AR-01 (L4) : la créature n'attend sur le palier de la galerie en feu ou dans l'atelier de la grille que derrière un obstacle qui permet de s'en débarrasser ; conception approuvée (D-268, D-269).
- Ordre libre (L5) : un couloir commun, deux branches au fond desquelles une commande lève le verrou d'une cloison du sas, mêlé au tirage au pur hasard ; la mesure de D-241 ne compte que les façons sans dé ni blessure, hors du final ; conception approuvée (D-270).
- Cadrage L0 : vestibule sans danger ni objet au départ ; créature de la galerie en feu seulement sur son palier de sortie ; en ordre libre, chaque branche fournit une commande pour l'une de deux cloisons avant le final ; NOUVELLE PARTIE tire aussi une station dans la version publique à partir de L2, d'abord énergie seule puis pile ou face dès que les deux finals sont disponibles et vérifiés (D-257 à D-260).
- Mélanges : les obstacles qui ne jouent pas sur la même chose vont ensemble sans règle de plus ; l'air et le feu passent par-dessus le vide de la passerelle ; la baie va avec les nouveaux morceaux.
- Chemin sûr : l'action libre du premier contact peut en faire partie ; une sortie qui demande un coup de dés reste une sortie.
- Les règles lisent les qualités des objets, pas leur nom ; port sans limite sauf un seul objet encombrant.
- Vérification au plus court, mêmes preuves (#180) : catalogue prouvé une fois, 100 plans par chemin, CI en jobs parallèles, version de test publiée dès le début avec l'état de la vérification, mode complet facultatif sur le PC ; une validation envoyée pendant la vérification ne compte que si elle finit verte (D-271, D-272).
- Pas de LLM requis dans le jeu ; le rôle éventuel d'un LLM est celui d'un joueur de test externe.
- Développement agentique dans un nouveau dépôt, méthode issue → vérification → revue → preuves.
- Parcours de référence accepté seulement après une partie du porteur du projet sur téléphone.

Ces choix sont détaillés et sourcés par leur origine utilisateur dans le journal des décisions.

## Reprise immédiate

**M-12 — chariot et drone réparable (#232, issu de #203).** Intégration demandée le 20 octobre 2026 dans un worktree séparé de M-11, sur `content/203-m12-drone`. Conception et périmètre : D-304 à D-307, [fiche M-12](13-morceaux-lancement.md#m-12--le-chariot-bloqué-et-le-drone-réparable-232). Station d'essai et tirage public demandés ; le drone garde sa coopération nécessaire et sa panne se récupère sur place en deux gestes. Pictogramme de carte demandé, fondé sur le dernier regard. Les essais de maquette ne sont ni une preuve du vrai moteur ni une validation sur téléphone. Fusion soumise au porteur (moteur/interface).

**Étape terminée :** AR-01 et AR-02 acceptées en conception ; les dix contrats C-01 à C-10 acceptés ; gouvernance, volume du lancement, dépôt, hébergement, agents, circuit de validation par PR et pile technique arbitrés (D-101 à D-135) ; [architecture](10-architecture.md) acceptée (D-136) ; trois profils Copilot spécialisés installés dans `.github/agents/` et gestion des issues guidée dans la conversation principale (D-137, D-199) ; [issue de Bootstrap](11-bootstrap.md) publiée : [#89](https://github.com/greffeb/void-walker/issues/89). Pas de code, de solveur ni de partie humaine exécutée.

**Bootstrap #89, fusionné (PR #90) :** les cinq étapes sont codées. Elles couvrent :

- le kit dans `docs/` et le socle TypeScript ;
- le moteur minimal et le monde de test ;
- la CLI et le rejoueur d'export ;
- l'appli PWA avec sauvegarde IndexedDB et captures ;
- la CI et la publication GitHub Pages.

`npm run verify` est vert en local. Après quatre erreurs réseau lors des délégations à l'exécutant, l'orchestrateur a codé lui-même à la demande du porteur du projet ; un rapport sur l'exécutant reste à traiter. Le relecteur et le playtester ont relu et joué ; leurs remarques sont traitées ou listées dans la PR. Le mode GitHub Pages peut retirer la V1 en ligne (D-139).

**Maquette d'interface :** acceptée (D-140 à D-155) ; issues d'interface #92 à #99 à traiter une par une, en zone orange. #92 (écran de jeu « Phosphore ») est fusionnée ([PR #109](https://github.com/greffeb/void-walker/pull/109)) ; le porteur s'est dit satisfait après un test sur téléphone (retour consigné, non signé). Restent à confirmer : portes, « Regarder autour de vous », intensité des lignes de balayage.

#93 (bulles de composition, fiches et inventaire) est fusionnée ([PR #110](https://github.com/greffeb/void-walker/pull/110)) et close. Faute de données dans le moteur, une partie attend encore : l'affichage des qualités dans la fiche (« [stable] [encombrant] ») ; la qualité « encombrant » n'existe pas encore dans le moteur. L'étape « OÙ ? » et l'action indisponible dans une bulle sont proposées par #103.

#94 (aperçu puis confirmation, moteur et écran) est fusionnée ([PR #111](https://github.com/greffeb/void-walker/pull/111)). Seule la créature vue ou entendue rend un aperçu risqué (D-180, D-181, PR #112) ; les autres dangers arrivent avec #101 et #102. Le porteur a demandé un seul toucher pour prendre, poser et changer de pièce quand rien n'est à craindre, les portes gardant l'aperçu (D-182) : [issue #113](https://github.com/greffeb/void-walker/issues/113), fusionnée ([PR #114](https://github.com/greffeb/void-walker/pull/114)) et close.

#115 (machine à écrire) est fusionnée ([PR #119](https://github.com/greffeb/void-walker/pull/119)) : le nouveau récit s'écrit en 500 ms, puis un curseur clignote lentement (D-186). Le réglage est gardé sur l'appareil ; sa bascule est dans l'écran d'options (#96).

#117 (aperçu allégé) est fusionnée ([PR #118](https://github.com/greffeb/void-walker/pull/118)) : les lignes RISQUE et COÛT n'apparaissent que si elles disent autre chose que « aucun », SAVOIR reste toujours (D-187).

#122 (écran plus compact) est fusionnée ([PR #123](https://github.com/greffeb/void-walker/pull/123)) : boutons de quelques pixels plus bas, dock à sa hauteur et récit d'au moins six lignes, pied de page sur une ligne (D-191).

#98 (IA Station) est proposée par une PR en zone orange, sans fusion avant l'accord du porteur et son essai sur téléphone. La fenêtre d'IA Station est blanche (D-192) : historique des messages reçus, repère de moment, NOUVEAU sur les non-lus, RETOUR. En partie, un lien « [ IA STATION ] parle dans l'écouteur › » remplace la citation ; au réveil elle reste encadrée. Pastille sur IA STATION tant qu'un message n'est pas lu, lus gardés sur l'appareil. Le monde de test reçoit deux messages (réveil, arrivée dans l'atelier). L'effet sonore d'arrivée viendra avec #99.

#96 (options, téléchargement, fin d'abandon) est proposée par une PR en zone orange, sans fusion avant l'accord du porteur et son essai sur téléphone. Options depuis l'accueil (OPTIONS) et le jeu (engrenage) : taille du texte STANDARD / GRANDE / TRÈS GRANDE (récit à 17, 19, 22 px, tout le reste à proportion), lignes de balayage et machine à écrire, gardées sur l'appareil ; « Télécharger ma partie » (l'export qui se rejoue avec `npm run rejouer`) ; abandon confirmé dans la page, qui efface la partie de l'appareil (D-200) et mène à l'écran de fin « Partie abandonnée » ; REJOUER CETTE STATION repart du même départ avec de nouveaux tirages. Version, commit et PR sont passés du bas de l'écran de jeu au bas des options. Restent pour plus tard : son (#99), Signaler un bug et Envoyer ma partie (#107), fins de défaite et d'évacuation.

#97 (carte) : conception écrite et validée par parties ([14 — carte](14-carte.md), D-201 à D-214), après des maquettes au format téléphone et un prototype jetable de génération des plans (1 000 tirages par variante, grandes stations jusqu'à 60 pièces). La carte devient un plan de pont en vert phosphore ; air et créature entrent dans l'issue. Trois livraisons à venir, en zone orange : plans, mémoire, écran. L'assemblage géométrique des stations générées rejoint #106 pour le seul chemin principal (D-245) ; les grandes stations, si la durée des parties le demande, et un catalogue de pièces sans obstacle attendent chacun une issue à part. Livraison 1 (plans) proposée : format, vérifieur et plans des trois mondes, montrés en captures ; mémoire et écran à suivre. Livraison 2 (mémoire et carte publique, commande `carte` de la CLI) proposée. Livraison 3 (écran vert, plan, fiche, liste) proposée, validation humaine requise.

#99 (son) : conception écrite et validée par parties ([15 — son](15-son.md), D-216 à D-226), sons choisis à l'oreille sur un banc d'écoute. Tous les sons sont synthétisés par le jeu, sans fichier ; pas de bande-son pour le moment. Livraison proposée en zone orange : sons synthétisés, trois rails dans les options, vérifiés par tests et dans Chromium ; validation humaine sur téléphone requise.

#107 (rapports) est fusionnée ([PR #141](https://github.com/greffeb/void-walker/pull/141)), zone rouge sauf le déploiement du service par les agents (D-127), interface en orange. Le service tourne sur Cloudflare Workers (`report-service/`, [déploiement](../report-service/README.md)) ; il crée une issue depuis la version publique, un commentaire de la PR depuis une version de test, et applique délai, nombre et doublons. Dans les options, « Signaler un bug » et « Envoyer ma partie » ouvrent un panneau sous leur ligne (D-231) ; ENVOYER MA PARTIE est aussi sur l'écran de fin. Sans réseau, le rapport est gardé et repart seul. `npm run rejouer -- <adresse de l'issue>` rejoue un rapport. La case « je valide » part sans signature : un simple retour jusqu'à #108.

#108 (signature des validations) est proposée par une PR ; la clé publique n'est ajoutée que par le porteur. Dans une version de test, une partie allée au bout peut porter « je valide » (dans les options, ou par ENVOYER MA PARTIE à la fin) ; le téléphone crée sa clé au premier envoi et la signe (D-232). Le robot de la PR (`.github/workflows/validation.yml`) vérifie la signature avec `docs/validation-key.json`, pose l'étiquette `validation-reconnue` et répond ; une clé inconnue reçoit son empreinte et le bloc à ajouter au fichier. La CI signale toute modification de la clé ou du code qui la vérifie par un avertissement et un commentaire du robot dans la PR (PR-10). Le retrait automatique d'une validation quand l'aventure change (D-100) reste à faire dans une issue à part.

#201 (options en sous-menus) est proposée par sa PR en zone orange. Le sommaire des options ne montre plus que trois lignes, « Son et texte », « Rapports » et « Application », puis l'abandon ; la version passe dans « Application » (D-287). Chaque ligne ouvre son sous-menu dans la bulle ambre des menus, sous l'en-tête ; ✕, le voile, Échap ou le retour du téléphone la referment (D-288). Choix faits sur la [maquette](maquette/options-menus.html) ; validation humaine sur téléphone requise. La section « À propos » (#200) se rangera dans ce menu.

**Moteur :** #100 (créature, perception, réactions) est fusionnée ([PR #112](https://github.com/greffeb/void-walker/pull/112)) et close. Choix du porteur consignés : poursuite par le passage vu (D-177), ouïe sans limite tant que le son passe (D-178), apparence proposée par les agents (D-179) ; après son essai de la version de test, aperçu risqué vers la créature vue (D-180) ou entendue (D-181). Quatre relectures ; leurs blocages sont corrigés. Le monde de test fait maintenant venir la créature.

#101 (blessures, soin, fuite exposée) est fusionnée ([PR #116](https://github.com/greffeb/void-walker/pull/116)) et close. Choix consignés : rester sous ses yeux se joue au même dé que la fuite (D-183), l'action qui suit le premier contact est libre (D-184), trousse en main ou dans la pièce (D-185). L'écran montre le badge de santé et, après une défaite, seulement la phrase de fin et NOUVELLE PARTIE, en attendant l'écran de fin.

#102 (feu, huile, avertisseur, caisse sous la grille) est fusionnée ([PR #120](https://github.com/greffeb/void-walker/pull/120)) et close. Choix consignés : le feu brûle à chaque action finie dans une pièce en feu, annoncé certain (D-188) ; la créature n'y entre jamais (D-189) ; l'huile se verse au pied d'une porte, du côté du passager, qui passe toujours par le bord sec (D-190). Nouvelles actions : déplacer, arroser, verser, déclencher ; une commande peut porter un paramètre (position ou passage).

#103 (AR-01 jouable) est fusionnée ([PR #121](https://github.com/greffeb/void-walker/pull/121)). AR-01 devient alors le monde par défaut de l'appli et de la CLI ; depuis L2 (#152), NOUVELLE PARTIE tire une station et AR-01 se joue avec `?monde=ar-01` ou `--monde ar-01` (le monde de test reste jouable avec `?monde=monde-test` ou `--monde monde-test`). Ajouts : grille sans signalétique et panneau caché, bloc trop large pour les conduits, console, installation du bloc, cabine « à bord », départ et fin par évacuation, trois messages d'IA Station, étape « OÙ ? » de la bulle. P-A, P-B et P-C passent dans la vérification complète. Les détails proposés par les agents sont listés à la fin du journal des décisions ; une question reste ouverte sur les récits de plus de quatre phrases quand plusieurs choses arrivent ensemble (D-111).

#104 (AR-02 jouable) est proposée par une PR en zone orange, sans fusion avant l'accord du porteur et son essai sur téléphone. AR-02 se joue avec `?monde=ar-02` ou `--monde ar-02`. Ajouts : combinaison (enfiler, retirer), percer la baie à la découpeuse, reboucher au kit, air perdu et revenu annoncé par les voyants des portes, asphyxie sans combinaison, créature expulsée ou inerte, capsule déjà alimentée. P-V1, P-V2 et P-V3 passent dans la vérification complète ; P-V3 se joue au dé, car se faufiler à côté de la créature n'est pas libre (D-195) ; l'écoutille de la capsule est fermée au départ dans AR-01 et AR-02, l'ouvrir coûte une action (D-196) ; la créature emportée par le vide ne frappe pas, quel que soit le geste (D-194). Les détails proposés par les agents sont listés à la fin du journal des décisions ; plusieurs questions restent ouvertes dans la PR.

#105 (nouveaux morceaux) est proposée par une PR en zone orange, sans fusion avant l'accord du porteur et son essai sur téléphone. Avant de coder, sept points ont été tranchés par le porteur (D-234 à D-240) : relance et compresseur sonnent comme l'avertisseur ; le vacarme des machines couvre tout pour qui est dedans ; les deux bords de la passerelle s'entendent sans se voir ; sans gravité on dérive jusqu'à l'autre bout (une action de plus), la créature deux réactions ; interrupteurs de gravité dans les pièces aux deux bouts ; créature ralentie dès qu'une porte de la chambre froide se ferme sur elle ; le froid blesse à chaque action au-delà de deux. Le moteur gagne l'objet encombrant, le pont fragile, la salle des machines, la gravité commutable et la chambre froide, et les mélanges MX-01, MX-04, MX-05. Quatre stations de test, une par morceau, se jouent avec `?monde=m-07` à `m-10` (ou `--monde`) ; leurs six parcours passent dans la vérification complète : les cinq sûrs des fiches et le risqué de la chambre froide, joué sans dé grâce au premier contact. Les détails proposés par les agents sont listés à la fin du journal des décisions.

**Point sur les morceaux, 2026-10-14 :** après un point d'ensemble avec le porteur (rôle de chaque morceau, outils, équilibre, idées pour plus tard), quatre choix sont consignés (D-241 à D-244) : on mesure d'abord la part des stations où la créature peut être mise hors jeu tôt, puis on décide ; petites stations d'abord ; lore léger au lancement, écrit par l'assistant principal ; objets hors de leur morceau après les annexes. Le découpage de #106 en livraisons L0 à L6 est décrit dans [13 §7](13-morceaux-lancement.md#7-découpage-de-106), avec les écarts relevés dans les documents (G-02 de C-08, exemple de C-02 §5 et critères de 14 §5.6 corrigés) ; le porteur a retenu les douze recommandations qui suivaient (« Ok pour tes reco », D-245 à D-256), découpage compris. Les pistes de l'après-lancement (poste de sécurité, objectifs et menaces en données, univers à brancher au tirage) sont dans la [roadmap](02-roadmap.md#après-lancement--hors-définition-de-fin-actuelle), sans décision.

**L0, cadrage de #106 (#150) :** la [table des 45 paires](13-morceaux-lancement.md#41-table-exhaustive-des-paires-l0-150) est écrite, 44 permises et seule M-03/M-06 interdite. Après relecture indépendante des propositions, le porteur a retenu explicitement les quatre recommandations ([13 §8](13-morceaux-lancement.md#8-cadrage-l0-150-accepté-par-le-porteur), Q-182 à Q-185, D-257 à D-260) : vestibule, palier de sortie de M-01, deux commandes de déverrouillage en ordre libre, tirage public progressif. Les fiches et C-08 sont mis à jour ; aucun code ne change et aucune partie sur téléphone n'est revendiquée. À implémenter et prouver : départ et tirage public en L2, M-01 en L4, commandes et nécessité des deux branches en L5.

**L1, vérifieur de #106 (#151), fusionné ([PR #158](https://github.com/greffeb/void-walker/pull/158)) :** `npm run check:stations`, intégré à `verify`, prouve les six stations de référence et rejoue chaque témoin sans dé, indemne, export compris. Les deux copies cassées sont rejetées ; AR-01 sans eau seule reste faisable. Le mode `--mesurer` énumère toutes les faces ; résultats, plafonds et méthode retenue pour L6 sont dans [13 §7.3](13-morceaux-lancement.md#73-risques-et-écarts-relevés). Le porteur a autorisé le petit accès aux dés dans le moteur. Aucun changement de règle, d'interface, de scénario ni de sauvegarde ; aucune validation sur téléphone revendiquée.

**L2, première station tirée (#152), fusionnée ([PR #160](https://github.com/greffeb/void-walker/pull/160)) :** NOUVELLE PARTIE tire une station parmi quatre compositions (vestibule, M-07 ou M-10 en chemin, M-03 en final), chacune prouvée par `npm run check:stations` à la construction, jamais au tirage ; REJOUER garde la même ; `?station=<id>` dans l'appli et `--station <id>` dans la CLI en forcent une. Chaque station n'a qu'une créature, dont la place est tirée parmi celles de ses morceaux : la soute de M-07, l'entrepôt de M-10 ou la réserve de M-03 (D-161, D-261, D-262). Mesures du catalogue et des plans dans [13 §7.5](13-morceaux-lancement.md#75-première-station-tirée-l2-152) et [14 §5.6](14-carte.md#56-critères-pour-106). Le porteur a mené au bout et signé deux parties sur téléphone (M-07 et M-03, [journal](journal-parties-humaines.md)) ; il les a trouvées « trop faciles », la porte claquée au nez de la créature suffisant. M-10 n'a pas encore été joué sur téléphone.

**L3, baie, passerelle, sans gravité (#153), fusionnée ([PR #168](https://github.com/greffeb/void-walker/pull/168)) :**
- **Contenu.** NOUVELLE PARTIE tire parmi 88 compositions, avec un ou deux morceaux de chemin parmi M-07 à M-10. Elle fait d'abord pile ou face entre l'énergie (M-03) et la baie (M-06).
- **Places de la créature.** Dans la passerelle (M-08), elle attend dans le magasin ; dans la zone sans gravité (M-09), dans la cale ; dans la baie, devant la capsule.
- **Réussite.** Le porteur l'a fixée : chaque station doit mener à la capsule ; la difficulté se règlera plus tard (D-264).
- **Vérification.** Le vérifieur cherche d'abord vers le fond de la station, avec les mêmes règles et le même plafond (D-265). Les 88 compositions sont prouvées en une douzaine de secondes.
- **Mesures.** Les mélanges et les tirages sont dans [13 §7.6](13-morceaux-lancement.md#76-baie-passerelle-sans-gravité-l3-153).
- **Reste à faire.** Une partie au bout sur téléphone pour chacun de M-06, M-08 et M-09 (**validation humaine requise**, D-098) : aucune n'est encore consignée dans le [journal](journal-parties-humaines.md).

**L4, chemins d'AR-01 (#154), fusionnée ([PR #172](https://github.com/greffeb/void-walker/pull/172)) :**
- **Contenu.** Les quatre morceaux de chemin qui restaient, découpés dans AR-01, entrent au tirage : la galerie en feu (M-01), la grille haute et la caisse (M-02), la salle d'observation (M-04), le panneau et le passage caché (M-05). Les dix morceaux sont tous tirables. AR-01 ne change pas.
- **Catalogue.** 368 compositions, dont 324 prouvées et publiées. Les 44 autres placent la créature sur le palier ou dans l'atelier, où elle bouche le seul passage, sans obstacle d'avant pour s'en débarrasser : elles ne sont jamais proposées (D-268). Les 88 compositions de L3 donnent les mêmes stations.
- **Conception.** Approuvée par le porteur, avec les choix des agents (D-269). La réussite reste celle de L3 : arriver à la capsule, la difficulté plus tard (D-264).
- **Vérification.** `check:stations` prend environ deux minutes et demie, `check:texts` environ trois minutes, dans `npm run verify`.
- **Mesures.** Catalogue, plans, tirages, empreintes et mélanges sont dans [13 §7.7](13-morceaux-lancement.md#77-chemins-dar-01-l4-154).
- **Reste à faire.** Une partie au bout sur téléphone pour chacun de M-01, M-02, M-04 et M-05 (**validation humaine requise**, D-098) : aucune n'est encore consignée dans le [journal](journal-parties-humaines.md).

**L5, ordre libre et mesures (#155), fusionnée ([PR #179](https://github.com/greffeb/void-walker/pull/179)) :**
- **Contenu.** Une seconde forme de station : le vestibule donne sur un couloir commun, deux branches en partent, et un sas à deux cloisons verrouillées mène au final. Une commande au fond de chaque branche lève l'un des verrous, dans l'ordre qu'on veut (D-259, D-270). Le moteur gagne la cloison verrouillée et l'action « actionner ».
- **Catalogue.** 536 compositions, dont 464 publiées : 324 en chaîne, inchangées, et 140 en ordre libre, chacune prouvée dans les deux ordres. Les 28 autres placent la créature sur le palier ou dans l'atelier, écartés par D-268.
- **Mesures.** `npm run mesurer:tirages` : fréquences, rejets par motif, plans et part des stations où la créature peut être mise hors jeu ou enfermée avant le final (D-241) : 36,1 % des stations tirées, 10,6 % indéterminées ; 0 station non prouvée proposée ; détail dans [13 §7.8](13-morceaux-lancement.md#78-ordre-libre-et-mesures-l5-155).
- **Reste à faire.** L'accord du porteur, une partie au bout sur téléphone dans une station en ordre libre (**validation humaine requise**, D-098), et sa décision sur la réserve de D-241.

**L6, « plus aucune sortie » (#156), proposée par sa PR en zone orange :**
- **Règle.** Le porteur l'a fixée (D-275) : le signal vient quand on ne peut plus du tout atteindre la capsule et la faire partir. Dés, blessures, créature, feu, froid et vide ne ferment aucun chemin : on peut y laisser la vie sans signal.
- **Calcul.** Un chemin dans le moteur après chaque action (`engine/sortie.ts`), quelques microsecondes sur le PC ; l'observation publique ne porte que « oui ou non ».
- **Écran.** L'information du jeu de 12 §5.2 (CONTINUER À JOUER, TERMINER LA PARTIE), puis le rappel « [ plus aucune sortie possible ] » au-dessus du récit (D-144).
- **Preuve.** `npm run check:sortie` : parties au hasard sur les 470 stations, chaque état comparé à une recherche complète du moteur, 0 désaccord sur 60 640 états ; un test par obstacle. Détail dans [13 §7.9](13-morceaux-lancement.md#79--plus-aucune-sortie--l6-156).
- **Reste à faire.** L'accord du porteur, une sortie perdue exprès sur téléphone, avec le temps par action (**validation humaine requise**, D-098).

**Évaluation de la difficulté ([#194](https://github.com/greffeb/void-walker/issues/194)), outils de mesure :**
- **Parties humaines.** `npm run mesurer:parties -- --depot` relit les rapports envoyés depuis le jeu (issues et commentaires), tire de chaque export l'issue, la santé, les dés lancés et les jets qui ont touché, rejoue la partie si le moteur actuel le permet, et dit ce qu'aurait donné un jet qui touche toujours (`--seuil=6`), à décisions identiques.
- **Bots.** `npm run mesurer:difficulte -- --verdicts=<sortie de check:stations>` fait jouer 1 000 stations tirées, aux mêmes graines, par quatre bots qui ne voient que l'écran du joueur (aléatoire, prudent, pressé, averti), à côté du chemin prouvé ; il rend le rapport de difficulté de #194 §2.4, avec un tableau du rythme. `-- --grandes` mesure les grandes stations publiées ; ajouter `--sans-butin` rejoue les mêmes stations sans leur butin. Hors de `verify`, zone verte : rien ne change au jeu.
- **V1 gardée (D-278, PR #196).** Le jet d'interception touche toujours : le bot prudent évacue 55 % des fois au lieu de 84 %. Un mode facile pourra rendre une esquive à ce dé (piste, sans décision).
- **Durée des parties ([#204](https://github.com/greffeb/void-walker/issues/204), D-280), proposée par sa PR :** chaque rapport qui joint une partie dit sa durée en temps d'écran allumé, du réveil à la fin ; REJOUER repart de zéro ; la durée est gardée sur l'appareil, hors de la sauvegarde. Essai sur téléphone, écran verrouillé, à venir (**validation humaine requise**).
- **Reste à faire.** L'aperçu et les textes d'esquive après V1 ; puis V2 à V4, une par une (#194 §4).

**Écrans de fin ([#208](https://github.com/greffeb/void-walker/issues/208)), proposés par leur PR en zone orange :** à la défaite et à l'évacuation, CONTINUER sous le dernier texte, puis un écran de fin qui raconte la partie par ses moments marquants, relus dans la partie enregistrée : la cause et la pièce d'une défaite, ou le départ, la santé et le sort de la créature ; sans liste des pièces ni chiffre (D-281 à D-286, choisis sur maquettes et sur une démo faite de parties de bots). La CLI affiche le même récit. Essai sur téléphone de chaque fin à venir (**validation humaine requise**).

**Sas de sécurité M-11 ([#203](https://github.com/greffeb/void-walker/issues/203)), proposé par sa PR en zone orange :**
- **Contenu.** Un onzième morceau de chemin : le poste de sécurité donne sur le sas par une porte blindée, verrouillée ; le lecteur du poste la déverrouille une fois pour toutes, carte de sécurité en main, prise au vestiaire. La créature attend dans la remise, fermée ; elle ne force jamais la porte blindée (D-290 à D-293).
- **Catalogue.** 684 compositions, dont 600 publiées (416 en chaîne, 184 en ordre libre) ; 136 publiées contiennent M-11. Détail dans [13 §7.10](13-morceaux-lancement.md#710-sas-de-sécurité-m-11-203).
- **Reste à faire.** L'accord du porteur et une partie au bout sur téléphone avec M-11 (**validation humaine requise**, D-098).

**Grandes stations habitées (#202, #205, #206, #207, #209), livraisons 1 à 3 proposées par leur PR (zone orange, validation humaine requise) :** conception approuvée (D-313 à D-327, [spec](superpowers/specs/2026-10-18-grandes-stations-design.md)). NOUVELLE PARTIE tire une grande station publiée : vestibule, trois chemins et le final, 21 à 28 pièces dont 6 à 10 pièces sans obstacle d'une station de transit et de fret, une à trois portes de boucle, la piste et les traces de la créature, des bruits de station avant la rencontre. Livraison 1 : 542 stations publiées, chacune prouvée ([13 §7.12](13-morceaux-lancement.md#712-grandes-stations-livraison-1-205-206)). **Livraison 2, clés dispersées et butin (D-319, D-320) :** chaque clé (bidon, caisse, bloc, burette, combinaison, découpeuse, planche) peut être posée dans une pièce plausible avant son obstacle, et la caisse devient portable ; deux ou trois salles de butin, vides ou garnies d'une trousse de soin ou d'une burette de réserve, que rien ne signale. 16,2 % des clés sont déplacées, 54,9 % des salles de butin sont vides. La liste est republiée : 539 stations sur 272 des 288 compositions, chacune prouvée sans son butin, et `check:sortie` couvre 5 grandes stations ([13 §7.13](13-morceaux-lancement.md#713-grandes-stations-livraison-2-202-207)). La note de rangement, qui dit où une clé est allée, vient avec le lore (livraison 3, ci-dessous). **Alertes au porteur :** pour le bot prudent, la rencontre arrive tard (96ᵉ action en livraison 1, 106,5 actions en livraison 2, à 92 % de la partie) ; une ronde ou un bruit qui met la créature en route se décidera avec #217 (D-321). **Le critère de difficulté de la conception (spec §11), qui traduit D-314, n'est pas atteint** : le bot prudent évacue 13,0 % des parties avec le butin et 13,8 % sans, pour 25 à 35 % visés. Les poids du butin ne sont pas le levier mesuré, puisque le butin change à peine le résultat des bots. L'hypothèse principale, à vérifier : les abandons au plafond de 600 actions (des bots perdus) montent quand des clés sont déplacées sans indice, 38,5 % des parties contre 24,0 % en livraison 1, sur une autre liste publiée ; la note de rangement arrive avec la livraison 3.

**Livraison 3, lore et documents (D-322 à D-324, [13 §7.14](13-morceaux-lancement.md#714-grandes-stations-livraison-3-209)) :** une bible de l'univers, [17 — univers](17-univers.md), interdite au playtester comme 08 et 09 ; 36 documents à lire (note, journal, message, inscription, affiche), cinq à sept par station, dont la note de rangement qui dit où une clé est allée ; une fiche propre à chaque support dans la bulle, avec la pièce nommée par une note soulignée, et les chiffres permis dans le corps d'un document seulement ; le profil averti des bots lit les documents. À la demande du porteur, « Poser » une caisse portée dans l'atelier de M-02 propose les positions de la pièce, dont « sous la grille » : un seul geste (D-328). La liste est republiée : 538 stations, dont 171 en ordre libre. **Le critère de difficulté n'est toujours pas atteint** : B2 évacue 14,1 % des parties avec le butin (14,4 % sans), pour 25 à 35 % visés ; les abandons de B2 passent de 38,5 % à 32,9 %, mais ceux de B4, qui lit les notes, sont au même niveau (32,6 %) : l'hypothèse des notes de rangement n'est pas confirmée par les bots. La rencontre reste tardive (105 actions, à 92 % de la partie ; #217). Au zoom d'ensemble de la carte, les noms ne se lisent pas : la décision revient au porteur. Aucune partie n'a encore été jouée sur téléphone avec cette livraison.

**M-11 et M-12 dans les grandes stations (#236, D-329, [13 §7.15](13-morceaux-lancement.md#715-m-11-et-m-12-dans-les-grandes-stations-236)), proposés par leur PR (zone orange, validation humaine requise) :** les deux morceaux sont tirés dans les grandes stations, avec la carte de sécurité déplaçable et un témoignage chacun. 1 080 compositions au lieu de 288. La liste est republiée : 2 012 stations sur 1 013 compositions, chacune prouvée ; 73,1 % contiennent M-11 ou M-12. Le bot prudent évacue 15,7 % des parties, toujours loin de la cible de 25 à 35 %. Une partie au bout sur téléphone avec M-11, puis avec M-12, reste à jouer (D-325).

**Prochaine tâche recommandée :** l'essai sur téléphone de la PR des grandes stations (chaque morceau joué au moins une fois dans une grande station, D-325), avec l'avis du porteur sur l'écriture des documents, puis les décisions que la livraison 3 lui laisse : le rythme de la créature (#217), le critère de difficulté non atteint, avant tout réglage des poids du butin, et les noms de la carte au zoom d'ensemble ([13 §7.14](13-morceaux-lancement.md#714-grandes-stations-livraison-3-209)). La difficulté des stations (« trop faciles » en L2) se traite dans [#194](https://github.com/greffeb/void-walker/issues/194) : mesurer d'abord, puis une variable à la fois (D-264). La suite de #106 suit [13 §7](13-morceaux-lancement.md#7-découpage-de-106) (D-245) : les sept livraisons sont les sous-issues [#150](https://github.com/greffeb/void-walker/issues/150) à [#156](https://github.com/greffeb/void-walker/issues/156). L'interface peut avancer en parallèle si elle ne touche pas le moteur. La [conception des dix morceaux](13-morceaux-lancement.md) reste acceptée (D-175), précisée par D-257 à D-260, D-262, D-265 et D-268, modifiée pour M-07 par D-261. Deux issues qui touchent le moteur ne se mènent pas en même temps.

**À ne pas refaire :** l'entretien Q-01 à Q-227 sans besoin de changer un choix. Les identités éditoriales et textes de finition peuvent rester ouverts, mais aucune règle physique, sauvegarde ou permission manquante ne doit être inventée par un agent d'implémentation.

**Façon de poser les questions :** en langage courant, à la demande du porteur du projet. Décrire la situation concrètement ; pas de numéros de décision ni de jargon (« engagement », « précondition », « canonique ») dans les questions. Les documents gardent leur précision.

**Ne pas faire :** code applicatif hors de l'issue #89, correction de la V1, ajout de mécanismes non arbitrés, génération en masse d'issues d'implémentation, promotion d'une proposition au statut validé.

Après chaque bloc de réponses : consigner les décisions explicites, mettre à jour le cahier des charges et les questions, puis demander le prochain bloc utile. Une réponse « à décider » reste ouverte.

## Définition d'un starter pack prêt à transmettre

Le kit sera prêt quand :

- le lancement PWA aura un périmètre concret et une définition de fin ;
- chaque contrat essentiel aura exemples, erreurs et invariants acceptés ;
- une aventure de référence aura des situations et issues attendues, sans prétendre avoir déjà été jouée ;
- la roadmap aura des dépendances et critères de sortie, sans dates inventées ;
- les rôles, permissions, zones de merge et conditions d'arrêt auront été arbitrés ;
- l'issue Bootstrap et les premières issues verticales seront exécutables sans nouvelles décisions produit cachées ;
- les modèles de preuves, de revue, de playtest et de reprise seront fournis ;
- les inconnues restantes seront explicitement non bloquantes et rattachées à une étape future.

La création de nombreux documents vides ne satisfait pas cette définition. Les documents détaillés seront ajoutés à mesure des décisions.

## Entretien documentaire

Un avertissement Markdown de lignes vides en fin du journal des décisions est connu. Après trois corrections infructueuses, le porteur du projet a explicitement choisi de le laisser provisoirement pour poursuivre le cadrage. Les décisions et liens sont lisibles ; ce nettoyage ne doit pas être confondu avec un blocage produit.
