# 17 — Univers des grandes stations : la bible

> **Statut :** document d'auteur, écrit pour la livraison 3 des grandes stations (#209, D-322, D-323). Texte final non validé.
> **Date :** 2026-10-20.
> **Portée :** le cadre commun à toutes les parties, l'incident de la créature, l'équipage, les lieux évoqués hors du plan et les règles d'écriture des documents. Il sert aussi de référence aux écrans de fin et à IA Station.
> **Accès :** comme [08](08-aventure-reference.md) et [09](09-aventure-reference-vide.md), ce document contient les secrets du jeu. Il est **interdit au playtester** censé découvrir la partie.

Conception : [spec des grandes stations](superpowers/specs/2026-10-18-grandes-stations-design.md), §8 et §9. Les textes eux-mêmes vivent dans le contenu : `content/textes/documents.ts` (univers, menace, note de la trousse) et la section `documents` de chaque morceau (`content/morceaux/m-0x.ts`).

## 1. Le cadre

**Le monde.** Une compagnie de transport exploite des stations de transit et de fret, toutes bâties sur le même modèle. On y change de navette, on y décharge des conteneurs, on y attend. C'est un futur proche, industriel et usé : des tôles repeintes, des néons fatigués, du café réchauffé. Rien de rutilant.

**La compagnie** n'a pas de nom dans les textes. L'équipage dit « la compagnie », ou « la boîte ». Ses affiches sont signées « La Direction du transit », d'une politesse de brochure (« Votre sécurité est notre priorité »). Après l'incident, cette politesse sonne faux, et c'est voulu.

**Le passager** est un voyageur en transit, qui attendait sa correspondance, retardée comme tout le reste. Il n'appartient pas à l'équipage, n'est pas spécialiste (D-031) et n'en sait pas plus que le joueur. Il s'est endormi dans un recoin de la station, et personne ne l'a réveillé quand tout le monde est parti. Il est toujours écrit au masculin singulier et vouvoyé.

**IA Station** est la voix de la compagnie : polie, exacte sur les systèmes, muette sur la menace (D-046, D-081). Pour elle, il n'y a jamais eu qu'un « incident technique ». Ses messages ne changent pas dans ce lot. Le décalage entre sa politesse et la panique des notes fait le ton froid et décalé du jeu (C-07 §3).

**Une seule histoire.** Chaque partie se passe dans une station différente, mais l'incident est toujours celui-là : le jeu raconte une seule histoire, que chaque station dispose autrement. Un document ne nomme donc jamais la station où il se trouve.

**Ce qui ne change jamais** d'une partie à l'autre :
- la grammaire des signes : une trace, un bruit, une forme de pièce veulent toujours dire la même chose ;
- l'honnêteté des documents (C-05) ;
- un seul univers, une seule compagnie ;
- le passager et IA Station ;
- le ton.

## 2. L'incident (couche menace)

Les jours sont comptés depuis l'arrivée du conteneur. Les documents en citent les heures, jamais la date entière.

| Jour | Étape | Ce qui se passe |
| --- | --- | --- |
| 1 | — | Le conteneur **CT-4471** arrive par un cargo de transit. Son manifeste est incomplet : « matériel de recherche », expéditeur illisible. Scellé, réfrigéré, il attend au **hangar six** le contrôle sanitaire. Inès, la technicienne, n'a pas le droit de lever les scellés seule : il faut l'inspectrice, qui doit venir avec la navette de relève. La relève est retardée, puis encore retardée. |
| 1 à 18 | — | Le conteneur devient une plaisanterie. Les dockers l'appellent « le frigo du six ». |
| 19 | 1. Premiers signes | Le groupe froid du conteneur tombe en panne dans la soirée. La température intérieure remonte de −18 °C à quelques degrés au-dessus de zéro. La nuit même, l'équipe de nuit entend des coups sourds à l'intérieur. |
| 19 à 23 | 1. Premiers signes | On en rit encore. Rémi Varga, docker, cogne sur la tôle pour faire peur aux nouveaux. Quelque chose cogne en retour. Malik remarque que « ça » cogne quand un chariot passe, et se tait quand tout le monde se tait. |
| Nuit du 23 au 24 | 2. Disparition | Rémi signale des coups au hangar six et part vérifier seul. Il ne répond plus. On retrouve le conteneur ouvert, les scellés arrachés **de l'intérieur**. Les grilles des conduits du hangar sont intactes. Rémi n'est nulle part. |
| 24 | 2. Disparition | Hélène, la cheffe d'escale, découvre que l'expéditeur n'existe pas. Elle interdit d'aller seul au hangar. On fouille. On ne trouve rien. |
| 25, à l'aube | 3. Confinement | La compagnie décrète le confinement, présenté comme une **fuite** dans le secteur fret. IA Station parle d'incident technique. On ferme les portes. |
| 25 à 27 | 3. Confinement | L'équipage apprend les règles à ses dépens (ci-dessous). |
| 27 | 4. Derniers mots | L'évacuation, dans le désordre. Des messages jamais envoyés, des journaux qui s'arrêtent. Le passager dort toujours. |

**Ce que l'équipage a appris.** Ce sont de vrais indices, conformes aux règles du jeu :

| Règle | En jeu | Documents qui la portent |
| --- | --- | --- |
| Elle chasse surtout au bruit. | Un bruit la met en route. | message de Malik, mot de Malik, inscription, enregistreur, main courante, message de Clara |
| Elle repère ce qui bouge devant elle. | Elle perçoit le passager qui se déplace devant elle. | enregistreur |
| Elle ne passe pas par les conduits étroits. | Une liaison étroite lui est fermée (D-044). | terminal de quart, main courante |
| Le froid la ralentit. | Enfermée dans la chambre froide, elle reste ralentie toute la partie, même ressortie (D-166, D-239). | journal sanitaire, relevés d'Inès |
| Elle n'entre jamais dans le feu. | Une pièce en feu lui est fermée (M-01). | note de Bastien |
| Une porte fermée ne l'arrête pas longtemps une fois qu'elle vous cherche. | Elle force les portes (D-279). | note de Bastien, main courante |
| Une porte blindée, elle ne la touche même pas. | Elle ne force jamais une porte blindée fermée (D-292). | journal d'Inès |

Ce que l'équipage **ne sait pas**, et qu'aucun document ne dit : ce qu'elle est, d'où vient le conteneur, ce qu'elle veut. Le mystère reste entier ; c'est voulu (le porteur a refusé le grand mystère sur plusieurs parties).

L'équipage dit « elle », ou « ça ». Personne ne l'appelle « la créature » : ce mot n'appartient qu'au récit du jeu.

Une autre menace (#216, #219) aura plus tard sa propre histoire, dans le même cadre, construite de la même façon.

## 3. L'équipage

Chaque document a un auteur, avec un prénom et un métier, et une voix reconnaissable. Les affiches sont signées par la Direction du transit ; l'inscription n'est pas signée.

| Prénom | Métier | Voix | Documents |
| --- | --- | --- | --- |
| Hélène | cheffe d'escale, elle dirige la station | posée, phrases entières, le « nous » de la responsable ; elle se fissure à peine | annonce d'Hélène, message d'Hélène, note d'Hélène |
| Nadia | cheffe de quart au fret | sèche, abréviations, heures, initiales ; elle tutoie ses dockers | mot pour Rémi, terminal de quart, mot de Nadia |
| Malik | docker | blagueur, phrases courtes, familier, tutoie tout le monde | message de Malik, mot de Malik, bout de carton |
| Inès | technicienne du contrôle sanitaire | précise, mesures et unités ; l'inquiétude passe dans les chiffres | journal sanitaire, relevés d'Inès, journal d'Inès |
| Bastien | mécanicien de maintenance | bourru, pratique, impératif ; il tient à l'ordre | note punaisée, note de Bastien, mot de Bastien, pense-bête |
| Yann | électricien | laconique, codes de circuits, constats | journal de maintenance, note de Yann, fiche volante |
| Odile | infirmière | douce et ferme ; elle vouvoie | mot d'Odile, message d'Odile, papier plié |
| Joël | cuisinier | chaleureux, parle de repas ; père de Lucie | note de Joël, enregistreur |
| Clara | agente d'entretien | directe, humour sec, petits détails concrets | carte postale, note de Clara, note scotchée, message de Clara |
| Sami | agent de sûreté | procédural, puis la peur contenue sous la procédure | message de Sami, main courante, bon de rangement, fiche de prêt |
| Wen | régulateur du trafic des navettes | calme de radio, tendre en privé | message de Wen, journal de Wen |

**Personnes nommées, jamais auteurs.** Rémi Varga, le docker disparu (« R. Varga » dans les journaux). Marc, monteur, qui passe le premier là où c'est dangereux. Lucie, la fille de Joël. Mei, qui attend Wen ailleurs. Agathe, la sœur de Clara.

**Règle d'indépendance.** Un document ne dépend d'aucun autre et ne dit pas d'un autre auteur qu'il est vivant ou mort. Il peut raconter ce qu'un autre a fait (« Bastien a ouvert la cloison »), jamais ce qu'il est devenu. Seul Rémi, qui n'écrit jamais, a disparu. N'importe quelle combinaison de documents reste ainsi cohérente.

## 4. Lieux hors du plan

Les documents évoquent ces lieux comme décor de leur récit. Aucun n'est une pièce où le passager peut aller.

| Lieu | Ce que c'est |
| --- | --- |
| le hangar six (« le six », « hangar 6 » dans un journal) | le hangar de fret où le conteneur a attendu |
| le secteur fret | l'ensemble des hangars, nommé par l'avis de confinement |
| le secteur réfrigéré | les stocks froids, où Inès a mesuré l'effet du froid |
| le poste de sûreté | le bureau de Sami, dont la porte a cédé |
| la boutique de transit | la boutique des voyageurs, où l'on vend du thé |
| la navette de relève | elle n'est jamais arrivée |

Un lieu hors du plan ne porte **jamais** le nom d'une pièce de morceau ou du catalogue. Sont donc exclus des documents, comme lieux : vestibule, quartiers, salle d'embarquement, cabine, atelier, poste incendie, tunnel, palier, salle des pompes, local, réserve, salle de contrôle, salle d'observation, salle de tri, hall de chargement, couloir, coursive, salle panoramique, soute, salle des machines, galerie, magasin, sas, cale, antichambre, chambre froide, entrepôt, et toutes les pièces du catalogue (couchettes, sanitaires, réfectoire, cambuse, infirmerie, buanderie, salle d'outillage, consigne, dépôt, vestiaire, salle de ventilation, plateforme de fret, bureau du fret, laboratoire). Seule exception : le passage caché de M-05 (§6).

## 5. La réserve de documents

Trente-neuf documents, posés à cinq à sept par grande station (spec §8.4). La clé de texte est aussi le nom de l'objet posé.

| Couche | Nombre | Où ils se posent |
| --- | ---: | --- |
| Univers | 8 | pièces du catalogue, selon leurs étiquettes |
| Menace | 12, trois par étape | dans l'ordre du trajet : étapes 1 et 2 au premier tiers, 3 au deuxième, 4 au dernier |
| Morceaux | 10 | pièce qui fait face à l'obstacle, ou une annexe pendue à elle ; seulement si le morceau est là |
| Notes de rangement | 9 | toujours quand leur clé a quitté son morceau ; la note de la trousse, quand une trousse est posée |

**Univers** (la vie d'avant, sans un mot de la menace ni des traces) :

| Puce | Support | Étiquette | Auteur | Ce qu'il dit |
| --- | --- | --- | --- | --- |
| carte postale | note | couchage | Clara | la nuit perpétuelle, les rideaux qui ferment mal, la relève |
| affiche sur l'eau | affiche | eau | Direction | l'eau recyclée sept fois |
| journal de maintenance | journal | outillage | Yann | un quart ordinaire ; le ventilateur du hangar 6 « chante » |
| note punaisée | note | rangement | Bastien | ce qui sort se note, ce qui revient se range |
| affiche de sécurité | affiche | sécurité | Direction | « juste une minute » |
| mot d'Odile | note | soin | Odile | les somnifères, les pansements, l'écharde de Malik |
| note de service | affiche | toutes | Direction | « En cas de doute, n'ouvrez pas » |
| message de Wen | message | toutes | Wen | la relève retardée, le thé pour Mei |

**Menace** (l'incident, sans le mot « station ») :

| Étape | Puce | Support | Auteur | Indice |
| ---: | --- | --- | --- | --- |
| 1 | journal sanitaire | journal | Inès | le froid tombe en panne, les bruits commencent |
| 1 | mot pour Rémi | note | Nadia | « quelque chose a cogné en retour » |
| 1 | message de Malik | message | Malik | le bruit : ça cogne quand on fait du bruit, ça se tait avec nous |
| 2 | terminal de quart | journal | Nadia | la nuit du 23 ; les grilles des conduits intactes |
| 2 | mot de Malik | note | Malik | Rémi n'est pas parti ; c'est lui qui cognait le plus fort |
| 2 | annonce d'Hélène | message | Hélène | l'expéditeur n'existe pas |
| 3 | avis de confinement | affiche | Direction | la « fuite » ; « fermez les portes » |
| 3 | note de Bastien | note | Bastien | « Une porte, elle finit par la forcer ; le feu, jamais » |
| 3 | relevés d'Inès | journal | Inès | le froid l'engourdit, et pour longtemps |
| 4 | inscription | inscription | — | « Elle écoute » |
| 4 | enregistreur | message | Joël | le bruit, et ce qui bouge devant elle |
| 4 | main courante | journal | Sami | la porte forcée, le conduit trop étroit pour elle |

**Morceaux** (une tentative sur l'obstacle, racontée comme un témoignage, sans aucun mot réservé) : les dix chemins. Les deux finals n'en ont pas : leurs objets portent déjà leur mode d'emploi, et IA Station parle dans M-03.

| Morceau | Puce | Support | Auteur | Témoignage |
| --- | --- | --- | --- | --- |
| M-01 | note de Yann | note | Yann | la cloison laissée ouverte, le feu qui passe le seuil |
| M-02 | note de Clara | note | Clara | la caisse sous la grille, le conduit à plat ventre |
| M-04 | message de Sami | message | Sami | l'huile sur le seuil, ce qui les suivait a glissé |
| M-05 | note de Joël | note | Joël | le raccourci de ceux du tri (passage caché, à mots couverts) |
| M-07 | mot de Bastien | note | Bastien | dans le vacarme, rien n'entend, rien ne s'entend |
| M-08 | message d'Odile | message | Odile | la planche a tenu pour Marc, retirée derrière eux |
| M-09 | journal de Wen | journal | Wen | la gravité coupée : ça ne sait pas flotter |
| M-10 | message d'Hélène | message | Hélène | le compresseur, les portes fermées depuis le pupitre, le froid qui mord |
| M-11 | journal d'Inès | journal | Inès | la carte au lecteur, la porte blindée refermée : elle n'a même pas essayé |
| M-12 | message de Clara | message | Clara | le chariot trop lourd pour la main ; un drone de manutention retrouvé et lancé, bruyant ; jeté sur le flanc, redressé et relancé, puis le chariot tiré sur le côté (#270) |

**Notes de rangement** (une par clé déplaçable, et la trousse) :

| Clé | Puce | Auteur | Forme du trou |
| --- | --- | --- | --- |
| bidon (M-01) | note scotchée | Clara | « Il attend {a:piece} » |
| caisse (M-02) | bout de carton | Malik | « jusqu'{a:piece} » |
| bloc (M-03) | fiche volante | Yann | « est {a:piece} » |
| burette (M-04) | pense-bête | Bastien | « dans {le:piece} » |
| combinaison (M-06) | bon de rangement | Sami | « rangée {a:piece} » |
| découpeuse (M-06) | note d'Hélène | Hélène | « ranger {a:piece} » |
| planche (M-08) | mot de Nadia | Nadia | « dans {le:piece} » |
| carte de sécurité (M-11) | fiche de prêt | Sami | « rangée dans {le:piece} » |
| trousse de soin | papier plié | Odile | « de côté, {a:piece} » |

## 6. Règles d'écriture

**Qui écrit.** L'assistant principal écrit la bible et tous les documents (D-243). Un relecteur indépendant relit la qualité et la cohérence avec cette bible (D-116).

**Français.** Français soigné, phrases entières, sans pronom substitué (D-281). Apostrophe typographique (’). Guillemets français avec espaces simples, comme le reste du contenu. Vrai signe moins dans les températures (−18 °C). Le passager n'est jamais nommé dans un document : ils ont été écrits avant son réveil, pour d'autres.

**Supports et voix** (spec §8.4) :

| Support | Libellé affiché | Voix | Forme |
| --- | --- | --- | --- |
| note | Note manuscrite | intime, quelques lignes | paragraphes, signature au prénom |
| journal | Journal de terminal | technique et sèche | lignes « hh:mm  texte » (deux espaces), cinq au plus |
| message | Message enregistré | orale, hachée | didascalies entre crochets, dans le fil du texte |
| inscription | Inscription | une ligne, un choc | deux phrases au plus ; l'appli la met en capitales |
| affiche | Affiche de la compagnie | consignes officielles | titre, consignes, puis la signature « La Direction du transit », seule ou dans une formule de remerciement |

**Longueur.** Une à cinq phrases, ou au plus cinq lignes de journal.

**Nom de puce.** Chacun est unique dans toute la réserve, sans chiffre, et n'est le nom d'aucune pièce ni d'aucun objet. Il dit le support, l'auteur (« mot de Malik », « main courante ») ou le titre d'une affiche (« avis de confinement »), jamais un indice.

**Ligne « où ».** Elle s'accorde avec le libellé du support qu'elle suit (« Note manuscrite · scotchée à la paroi »). Elle est vraie dans toute pièce où le document peut être posé :
- un document de l'univers ne va que dans les pièces du catalogue de ses étiquettes ; sa ligne peut nommer un meuble de ces pièces (« glissée sous le cadre d'une couchette ») ;
- tous les autres peuvent aller dans presque toute pièce, sas, couloir sans gravité et chambre froide compris : leur ligne ne parle que de la paroi, d'un recoin ou de l'objet qui porte le texte, et reste vraie sans gravité (rien de posé au sol).

**Couches et mots réservés** (spec §8.4, `couches.ts`) :
- univers : ni mot de la menace (`créature`, `griff…`, `gueule`, `masse…`), ni vocabulaire des traces (`sang`, `sanglant`, `traînée`, `éventr…`, `renvers…`, `poiss…`, `lacér…`, `douceâtre`, `éclabouss…`) ; attention aux mots qui commencent pareil : « poisson », « renverser », « griffonner » sont exclus ;
- menace : jamais « station » ni ses dérivés (« stationner ») ; on dit « ici », « à bord » ;
- morceaux et notes de rangement : aucun mot réservé, ni de l'univers ni de la menace ni des traces.

**Chiffres.** Permis dans le corps d'un document seulement : heures, températures, codes, numéros (D-323). Jamais dans la puce, la ligne « où » ni la signature. Ailleurs, aucun chiffre à l'écran (12 §1.5).

**Honnêteté** (C-05) :
- un document ne contredit jamais l'état réel ; il raconte le passé et ne dit rien de l'état présent d'une pièce du plan ;
- il ne nomme aucune pièce du plan, sauf la note de rangement par son trou, rempli à l'assemblage avec la vraie pièce, lettre comprise ;
- un indice est toujours vrai : une règle de la créature, une tentative sur un obstacle, la place d'une clé ;
- **exception du passage caché** (D-323) : la note de M-05 en parle à mots couverts, dans le morceau qui le porte ;
- les consignes de la compagnie peuvent mentir à l'équipage (la « fuite ») : c'est un mensonge de l'histoire, pas du jeu.

**Témoignage, pas consigne.** Un document de morceau raconte ce que quelqu'un a fait et ce qui s'est passé. Il ne dit jamais au lecteur quoi faire.

**Notes de rangement.** Le seul trou permis dans un document est la pièce d'une note de rangement (`{le:piece}`, `{de:piece}`, `{a:piece}`), dans son corps. La phrase doit sonner juste avec toutes les pièces où la clé peut aller : « Il attend à la cambuse », « aux sanitaires », « à la buanderie ».

## 7. Pour les écrans de fin et IA Station

- IA Station ne parle jamais de la menace ; pour elle, l'incident est technique, et le passager est un voyageur à évacuer.
- IA Station peut nommer des pièces dans les messages de la face 2 (D-360), même non découvertes, mais jamais la menace, ni la créature, ni les traces, et sans aucun chiffre. Quatre sortes : une porte forcée, du matériel qui ne répond plus (caméra ou capteur), un passage récent, une gêne dans la pièce où elle est. Ton de la compagnie : indirect, administratif, toujours vrai. Une gêne de présence reste vraie quelle que soit la pièce et n'évoque ni le vide ni une porte forcée.
- Le code du post-it de la salle de surveillance (D-356) est la seule suite de chiffres permise hors des documents : c'est un support écrit, comme eux (§6).
- Les écrans de fin racontent la partie du passager, pas l'incident : ils ne citent ni l'équipage, ni le conteneur.
- Un texte qui voudrait un jour évoquer l'incident hors d'un document s'appuie sur la chronologie du §2, sans rien y ajouter qui contredise un document.
