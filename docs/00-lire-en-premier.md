# Void Walker V2 — point de départ et reprise de conversation

> **Statut :** BOOTSTRAP EN COURS — issue #89 lancée par le porteur du projet le 2026-10-10, branche `bootstrap/89-socle`.
> **Mise à jour :** 2026-10-14 (#105, nouveaux morceaux, proposée).

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

L'[aventure fixe AR-01 v1.0](08-aventure-reference.md) est **acceptée comme conception** (D-057). Ses trois témoins P-A/P-B/P-C restent à prouver par le moteur, et aucun n'a été joué sur téléphone. Elle contient des secrets et solutions d'auteur : ne pas la transmettre au playtester aveugle.

L'[aventure AR-02](09-aventure-reference-vide.md), courte référence de la dépressurisation, est **acceptée comme conception** (D-074). Ses trois témoins P-V1/P-V2/P-V3 restent à prouver, aucun n'a été joué. Elle contient aussi des solutions d'auteur.

Premiers socles contractuels acceptés (D-027) : [actions et observation](contrats/C-01-actions-observation.md), [cohérence du monde et des conséquences](contrats/C-05-monde-consequences.md). Leurs questions explicitement ouvertes ne sont pas des décisions implicites.

Contrats acceptés dans la portée d'AR-01 et d'AR-02 (D-055 à D-057, D-074) : [temps et réactions](contrats/C-03-temps-reactions.md), [risques et blessures](contrats/C-04-risques-blessures.md). Le vide y a sa propre section ; il n'est pas déduit des règles du feu.

Contrats acceptés pour tout le lancement (D-082, D-102) : [monde et entités](contrats/C-02-monde-entites.md), [observation, carte et connaissances](contrats/C-06-observation-connaissances.md), [stations et fins](contrats/C-08-stations-fins.md), [sauvegarde et replay](contrats/C-09-sauvegarde-replay.md), [preuves, rapports et gouvernance](contrats/C-10-preuves-gouvernance.md). C-07 accepté également (D-117) : [textes du jeu](contrats/C-07-textes.md). Les dix contrats sont acceptés.

La validation humaine sera conservée dans le [journal des parties humaines](journal-parties-humaines.md). Il est actuellement vide : aucune partie V2 n'a eu lieu.

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
- Les règles lisent les qualités des objets, pas leur nom ; port sans limite sauf un seul objet encombrant.
- Pas de LLM requis dans le jeu ; le rôle éventuel d'un LLM est celui d'un joueur de test externe.
- Développement agentique dans un nouveau dépôt, méthode issue → vérification → revue → preuves.
- Parcours de référence accepté seulement après une partie du porteur du projet sur téléphone.

Ces choix sont détaillés et sourcés par leur origine utilisateur dans le journal des décisions.

## Reprise immédiate

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

#97 (carte) : conception écrite et validée par parties ([14 — carte](14-carte.md), D-201 à D-214), après des maquettes au format téléphone et un prototype jetable de génération des plans (1 000 tirages par variante, grandes stations jusqu'à 60 pièces). La carte devient un plan de pont en vert phosphore ; air et créature entrent dans l'issue. Trois livraisons à venir, en zone orange : plans, mémoire, écran. L'assemblage géométrique des stations générées rejoint #106 ; un catalogue de pièces sans obstacle attend une issue à part. Livraison 1 (plans) proposée : format, vérifieur et plans des trois mondes, montrés en captures ; mémoire et écran à suivre. Livraison 2 (mémoire et carte publique, commande `carte` de la CLI) proposée. Livraison 3 (écran vert, plan, fiche, liste) proposée, validation humaine requise.

#99 (son) : conception écrite et validée par parties ([15 — son](15-son.md), D-216 à D-226), sons choisis à l'oreille sur un banc d'écoute. Tous les sons sont synthétisés par le jeu, sans fichier ; pas de bande-son pour le moment. Livraison proposée en zone orange : sons synthétisés, trois rails dans les options, vérifiés par tests et dans Chromium ; validation humaine sur téléphone requise.

#107 (rapports) est fusionnée ([PR #141](https://github.com/greffeb/void-walker/pull/141)), zone rouge sauf le déploiement du service par les agents (D-127), interface en orange. Le service tourne sur Cloudflare Workers (`report-service/`, [déploiement](../report-service/README.md)) ; il crée une issue depuis la version publique, un commentaire de la PR depuis une version de test, et applique délai, nombre et doublons. Dans les options, « Signaler un bug » et « Envoyer ma partie » ouvrent un panneau sous leur ligne (D-231) ; ENVOYER MA PARTIE est aussi sur l'écran de fin. Sans réseau, le rapport est gardé et repart seul. `npm run rejouer -- <adresse de l'issue>` rejoue un rapport. La case « je valide » part sans signature : un simple retour jusqu'à #108.

#108 (signature des validations) est proposée par une PR ; la clé publique n'est ajoutée que par le porteur. Dans une version de test, une partie allée au bout peut porter « je valide » (dans les options, ou par ENVOYER MA PARTIE à la fin) ; le téléphone crée sa clé au premier envoi et la signe (D-232). Le robot de la PR (`.github/workflows/validation.yml`) vérifie la signature avec `docs/validation-key.json`, pose l'étiquette `validation-reconnue` et répond ; une clé inconnue reçoit son empreinte et le bloc à ajouter au fichier. La CI signale toute modification de la clé ou du code qui la vérifie par un avertissement et un commentaire du robot dans la PR (PR-10). Le retrait automatique d'une validation quand l'aventure change (D-100) reste à faire dans une issue à part.

**Moteur :** #100 (créature, perception, réactions) est fusionnée ([PR #112](https://github.com/greffeb/void-walker/pull/112)) et close. Choix du porteur consignés : poursuite par le passage vu (D-177), ouïe sans limite tant que le son passe (D-178), apparence proposée par les agents (D-179) ; après son essai de la version de test, aperçu risqué vers la créature vue (D-180) ou entendue (D-181). Quatre relectures ; leurs blocages sont corrigés. Le monde de test fait maintenant venir la créature.

#101 (blessures, soin, fuite exposée) est fusionnée ([PR #116](https://github.com/greffeb/void-walker/pull/116)) et close. Choix consignés : rester sous ses yeux se joue au même dé que la fuite (D-183), l'action qui suit le premier contact est libre (D-184), trousse en main ou dans la pièce (D-185). L'écran montre le badge de santé et, après une défaite, seulement la phrase de fin et NOUVELLE PARTIE, en attendant l'écran de fin.

#102 (feu, huile, avertisseur, caisse sous la grille) est fusionnée ([PR #120](https://github.com/greffeb/void-walker/pull/120)) et close. Choix consignés : le feu brûle à chaque action finie dans une pièce en feu, annoncé certain (D-188) ; la créature n'y entre jamais (D-189) ; l'huile se verse au pied d'une porte, du côté du passager, qui passe toujours par le bord sec (D-190). Nouvelles actions : déplacer, arroser, verser, déclencher ; une commande peut porter un paramètre (position ou passage).

#103 (AR-01 jouable) est fusionnée ([PR #121](https://github.com/greffeb/void-walker/pull/121)). AR-01 devient le monde par défaut de l'appli et de la CLI (le monde de test reste jouable avec `?monde=monde-test` ou `--monde monde-test`). Ajouts : grille sans signalétique et panneau caché, bloc trop large pour les conduits, console, installation du bloc, cabine « à bord », départ et fin par évacuation, trois messages d'IA Station, étape « OÙ ? » de la bulle. P-A, P-B et P-C passent dans la vérification complète. Les détails proposés par les agents sont listés à la fin du journal des décisions ; une question reste ouverte sur les récits de plus de quatre phrases quand plusieurs choses arrivent ensemble (D-111).

#104 (AR-02 jouable) est proposée par une PR en zone orange, sans fusion avant l'accord du porteur et son essai sur téléphone. AR-02 se joue avec `?monde=ar-02` ou `--monde ar-02`. Ajouts : combinaison (enfiler, retirer), percer la baie à la découpeuse, reboucher au kit, air perdu et revenu annoncé par les voyants des portes, asphyxie sans combinaison, créature expulsée ou inerte, capsule déjà alimentée. P-V1, P-V2 et P-V3 passent dans la vérification complète ; P-V3 se joue au dé, car se faufiler à côté de la créature n'est pas libre (D-195) ; l'écoutille de la capsule est fermée au départ dans AR-01 et AR-02, l'ouvrir coûte une action (D-196) ; la créature emportée par le vide ne frappe pas, quel que soit le geste (D-194). Les détails proposés par les agents sont listés à la fin du journal des décisions ; plusieurs questions restent ouvertes dans la PR.

#105 (nouveaux morceaux) est proposée par une PR en zone orange, sans fusion avant l'accord du porteur et son essai sur téléphone. Avant de coder, sept points ont été tranchés par le porteur (D-234 à D-240) : relance et compresseur sonnent comme l'avertisseur ; le vacarme des machines couvre tout pour qui est dedans ; les deux bords de la passerelle s'entendent sans se voir ; sans gravité on dérive jusqu'à l'autre bout (une action de plus), la créature deux réactions ; interrupteurs de gravité dans les pièces aux deux bouts ; créature ralentie dès qu'une porte de la chambre froide se ferme sur elle ; le froid blesse à chaque action au-delà de deux. Le moteur gagne l'objet encombrant, le pont fragile, la salle des machines, la gravité commutable et la chambre froide, et les mélanges MX-01, MX-04, MX-05. Quatre stations de test, une par morceau, se jouent avec `?monde=m-07` à `m-10` (ou `--monde`) ; leurs sept parcours sûrs passent dans la vérification complète. Les détails proposés par les agents sont listés à la fin du journal des décisions.

**Prochaine tâche recommandée :** après le retour du porteur sur #105, assemblage des stations (#106) ; #98 touche un peu le moteur (lecture seule de l'historique des messages). L'interface (#95 à #99) peut avancer en parallèle si elle ne touche pas le moteur. La [conception des dix morceaux](13-morceaux-lancement.md) est acceptée (D-175). Issues de développement créées, dans l'ordre : moteur [#100](https://github.com/greffeb/void-walker/issues/100), [#101](https://github.com/greffeb/void-walker/issues/101), [#102](https://github.com/greffeb/void-walker/issues/102) ; AR-01 [#103](https://github.com/greffeb/void-walker/issues/103) ; AR-02 [#104](https://github.com/greffeb/void-walker/issues/104) ; nouveaux morceaux [#105](https://github.com/greffeb/void-walker/issues/105) ; stations [#106](https://github.com/greffeb/void-walker/issues/106) ; rapports [#107](https://github.com/greffeb/void-walker/issues/107) ; signature [#108](https://github.com/greffeb/void-walker/issues/108). Deux issues qui touchent le moteur ne se mènent pas en même temps.

**À ne pas refaire :** l'entretien Q-01 à Q-165 sans besoin de changer un choix. Les identités éditoriales et textes de finition peuvent rester ouverts, mais aucune règle physique, sauvegarde ou permission manquante ne doit être inventée par un agent d'implémentation.

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
