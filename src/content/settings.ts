// ---------------------------------------------------------------------------
// src/content/settings.ts — Phase 6: Launch Settings & Location Name Pools
// ---------------------------------------------------------------------------
// 3 launch settings: derelict_ship, space_station, alien_ruins
// Each provides 20+ location names per supported role.
// ---------------------------------------------------------------------------

import type { SettingDefinition, LocaleString } from '@engine/scenario';

// ---------------------------------------------------------------------------
// HELPER — create a LocaleString (EN post-launch)
// ---------------------------------------------------------------------------

function ls(fr: string): LocaleString {
  return { fr, en: '' };
}

// ---------------------------------------------------------------------------
// DERELICT SHIP — Épave Stellaire
// ---------------------------------------------------------------------------

const DERELICT_SHIP: SettingDefinition = {
  id: 'derelict_ship',
  nameKey: { fr: 'Épave Stellaire', en: 'Derelict Ship' },
  categories: ['space_vessel'],
  supportedRoles: [
    'passage', 'control_room', 'storage', 'medical', 'quarters',
    'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
  ],
  locationNames: {
    passage: [
      ls('Coursive principale'), ls('Coursive latérale'), ls('Couloir de service'),
      ls('Couloir résidentiel'), ls('Passage étroit'), ls('Conduit de maintenance'),
      ls('Coursive arrière'), ls('Passerelle suspendue'), ls('Tunnel de câbles'),
      ls('Coursive pressurisée'), ls('Corridor est'), ls('Corridor ouest'),
      ls('Couloir d\'accès'), ls('Passage de secours'), ls('Coursive commerciale'),
      ls('Couloir technique'), ls('Passerelle de communication'), ls('Passage blindé'),
      ls('Coursive de fuite'), ls('Tunnel de survie'), ls('Corridor principal'),
      ls('Passerelle inférieure'),
    ],
    control_room: [
      ls('Passerelle de commandement'), ls('Salle de contrôle principale'),
      ls('Poste de pilotage'), ls('Centre de navigation'), ls('Salle des opérations'),
      ls('Poste de commandement'), ls('Salle de surveillance'), ls('Centre de contrôle'),
      ls('Tableau de bord principal'), ls('Poste de vigie'), ls('Salle de coordination'),
      ls('Centre de gestion'), ls('Poste de contrôle auxiliaire'), ls('Salle des instruments'),
      ls('Centre de commandement tactique'), ls('Poste de navigation avancé'),
      ls('Salle de contrôle de secours'), ls('Centre d\'opérations'),
      ls('Poste de pilotage secondaire'), ls('Salle de contrôle des moteurs'),
      ls('Centre de coordination du vaisseau'), ls('Poste de commandement arrière'),
    ],
    storage: [
      ls('Soute principale'), ls('Soute secondaire'), ls('Cale à provisions'),
      ls('Entrepôt de fret'), ls('Soute de fret'), ls('Compartiment de stockage'),
      ls('Réserve d\'équipement'), ls('Soute d\'armement'), ls('Cale arrière'),
      ls('Soute sous pression'), ls('Entrepôt d\'urgence'), ls('Dépôt de matériel'),
      ls('Soute réfrigérée'), ls('Cale de chargement'), ls('Soute de ravitaillement'),
      ls('Compartiment de réserve'), ls('Dépôt de composants'), ls('Soute avant'),
      ls('Cale à outils'), ls('Soute de matériel médical'), ls('Entrepôt de fret lourd'),
      ls('Cale de stockage secondaire'),
    ],
    medical: [
      ls('Infirmerie principale'), ls('Infirmerie de bord'), ls('Salle de soins'),
      ls('Infirmerie d\'urgence'), ls('Centre médical'), ls('Salle d\'opérations médicales'),
      ls('Poste de premiers secours'), ls('Infirmerie secondaire'), ls('Salle de cryogénie médicale'),
      ls('Centre de traumatologie'), ls('Infirmerie chirurgicale'), ls('Salle de triage'),
      ls('Infirmerie de quarantaine'), ls('Centre de décontamination'), ls('Salle de soins intensifs'),
      ls('Infirmerie de recherche'), ls('Compartiment médical'), ls('Poste de soin d\'urgence'),
      ls('Salle de diagnostic'), ls('Centre de soins avancé'), ls('Infirmerie principale de pont'),
      ls('Salle de médecine d\'urgence'),
    ],
    quarters: [
      ls('Cabines de l\'équipage'), ls('Cabines résidentielles'), ls('Dortoirs de l\'équipage'),
      ls('Quartiers d\'officiers'), ls('Cabines de couchage'), ls('Zone de vie de l\'équipage'),
      ls('Module résidentiel'), ls('Compartiments de repos'), ls('Quartiers du personnel'),
      ls('Cabines de navigation'), ls('Quartiers du capitaine'), ls('Cabines de l\'ingénierie'),
      ls('Quartiers médicaux'), ls('Module de repos'), ls('Cabines visiteurs'),
      ls('Compartiments résidentiels'), ls('Zone de récupération'), ls('Cabines de garde'),
      ls('Quartiers de sécurité'), ls('Module de vie'), ls('Cabines de pont supérieur'),
      ls('Quartiers d\'équipage arrière'),
    ],
    hub: [
      ls('Carrefour des coursives'), ls('Jonction centrale'), ls('Nœud de distribution'),
      ls('Carrefour principal'), ls('Intersection des couloirs'), ls('Carrefour de service'),
      ls('Jonction de maintenance'), ls('Nœud de circulation'), ls('Carrefour d\'urgence'),
      ls('Jonction de sécurité'), ls('Centre de distribution'), ls('Carrefour technique'),
      ls('Nœud central de navigation'), ls('Carrefour des sections'), ls('Jonction des systèmes'),
      ls('Carrefour de commandement'), ls('Nœud d\'aiguillage'), ls('Carrefour de fuite'),
      ls('Jonction pressurisée'), ls('Centre de communication'), ls('Nœud de jonction principal'),
      ls('Carrefour des modules'),
    ],
    dead_end: [
      ls('Cul-de-sac de maintenance'), ls('Impasse technique'), ls('Compartiment sans issue'),
      ls('Alcôve de service'), ls('Renfoncement de câbles'), ls('Cul-de-sac arrière'),
      ls('Impasse blindée'), ls('Compartiment isolé'), ls('Alcôve de stockage'),
      ls('Cul-de-sac résidentiel'), ls('Impasse de service'), ls('Compartiment de secours'),
      ls('Alcôve d\'urgence'), ls('Renfoncement de sécurité'), ls('Cul-de-sac technique'),
      ls('Impasse de navigation'), ls('Compartiment verrouillé'), ls('Alcôve de maintenance'),
      ls('Impasse pressurisée'), ls('Renfoncement aveugle'), ls('Cul-de-sac de câblage'),
      ls('Compartiment de dérivation'),
    ],
    hazard_zone: [
      ls('Salle des moteurs'), ls('Chambre de réacteur'), ls('Compartiment de propulsion'),
      ls('Zone de radiation'), ls('Salle de générateur'), ls('Chambre de fusion'),
      ls('Zone de carburant'), ls('Compartiment de refroidissement'), ls('Salle des turbines'),
      ls('Zone d\'explosion'), ls('Chambre de fission'), ls('Zone de décompression'),
      ls('Salle de pression critique'), ls('Compartiment de plasma'), ls('Zone de fuite de carburant'),
      ls('Chambre de combustion'), ls('Zone de haute tension'), ls('Salle de réfrigération critique'),
      ls('Compartiment de radioactivité'), ls('Zone de risque chimique'),
      ls('Salle des propulseurs principaux'), ls('Chambre d\'éjection des déchets'),
    ],
    engineering: [
      ls('Compartiment technique principal'), ls('Salle de maintenance'), ls('Zone de réparation'),
      ls('Atelier de l\'ingénierie'), ls('Compartiment des systèmes'), ls('Salle des machines'),
      ls('Zone d\'entretien'), ls('Atelier de mécanique'), ls('Compartiment électrique'),
      ls('Salle de l\'ingénierie avancée'), ls('Zone de diagnostic technique'), ls('Atelier de soudure'),
      ls('Compartiment des circuits'), ls('Salle de contrôle des systèmes'),
      ls('Zone de maintenance préventive'), ls('Atelier d\'assemblage'),
      ls('Compartiment de réparation d\'urgence'), ls('Salle des équipements'),
      ls('Zone de mécanique avancée'), ls('Atelier de navigation'),
      ls('Compartiment de l\'ingénierie secondaire'), ls('Salle de diagnostic des pannes'),
    ],
    airlock: [
      ls('Sas principal'), ls('Sas de secours'), ls('Sas d\'embarquement'),
      ls('Sas EVA'), ls('Sas de décontamination'), ls('Sas d\'urgence'),
      ls('Sas de transfert'), ls('Sas d\'amarrage'), ls('Sas secondaire'),
      ls('Sas de fret'), ls('Sas de maintenance extérieure'), ls('Sas de sortie'),
      ls('Sas blindé'), ls('Sas de quarantaine'), ls('Sas de convoyage'),
      ls('Sas d\'accès extérieur'), ls('Sas de pressurisation'), ls('Sas de survie'),
      ls('Sas arrière'), ls('Sas central'), ls('Sas d\'évacuation'),
      ls('Sas de départ EVA'),
    ],
  },
  features: ['airlock', 'viewport', 'hull_panel', 'life_support', 'cryopod', 'emergency_locker', 'status_terminal'],
  preferredItems: ['EVA_suit', 'plasma_cutter', 'access_keycard', 'welding_torch', 'emergency_flashlight', 'medkit_basic'],
};

// ---------------------------------------------------------------------------
// SPACE STATION — Station Orbitale
// ---------------------------------------------------------------------------

const SPACE_STATION: SettingDefinition = {
  id: 'space_station',
  nameKey: { fr: 'Station Orbitale', en: 'Space Station' },
  categories: ['facility'],
  supportedRoles: [
    'passage', 'control_room', 'storage', 'medical', 'quarters',
    'hub', 'dead_end', 'hazard_zone', 'engineering', 'airlock',
    'lab', 'server_room',
  ],
  locationNames: {
    passage: [
      ls('Corridor principal'), ls('Corridor de liaison'), ls('Couloir administratif'),
      ls('Couloir de sécurité'), ls('Couloir d\'accès technique'), ls('Couloir de communication'),
      ls('Corridor résidentiel'), ls('Couloir de recherche'), ls('Corridor de transit'),
      ls('Couloir de maintenance'), ls('Corridor d\'urgence'), ls('Couloir de service'),
      ls('Passerelle de communication'), ls('Couloir de circulation'), ls('Corridor de commandement'),
      ls('Couloir scientifique'), ls('Corridor d\'habitation'), ls('Couloir de logistique'),
      ls('Corridor d\'accès'), ls('Couloir pressurisé'), ls('Corridor de sécurité avancée'),
      ls('Couloir de transit scientifique'),
    ],
    control_room: [
      ls('Centre des opérations'), ls('Salle de commandement'), ls('Centre de contrôle principal'),
      ls('Salle de surveillance avancée'), ls('Centre de coordination'), ls('Poste de commandement orbital'),
      ls('Centre de navigation spatiale'), ls('Salle de gestion des systèmes'),
      ls('Centre des communications'), ls('Poste de contrôle des docks'),
      ls('Salle de contrôle scientifique'), ls('Centre d\'opérations tactiques'),
      ls('Poste de surveillance de la station'), ls('Salle de contrôle de l\'environnement'),
      ls('Centre d\'alerte d\'urgence'), ls('Poste de contrôle des réacteurs'),
      ls('Salle des opérations médicales'), ls('Centre de commandement de sécurité'),
      ls('Poste de contrôle de la gravité'), ls('Salle de dispatch'),
      ls('Centre de contrôle de la station'), ls('Poste de commandement de secours'),
    ],
    storage: [
      ls('Entrepôt principal'), ls('Entrepôt de fret'), ls('Réserve de matériel'),
      ls('Dépôt de fournitures'), ls('Entrepôt de provisions'), ls('Réserve d\'équipement scientifique'),
      ls('Dépôt de carburant'), ls('Entrepôt de sécurité'), ls('Réserve d\'armement'),
      ls('Dépôt de matériel médical'), ls('Entrepôt de pièces détachées'), ls('Réserve de composants'),
      ls('Dépôt de matériel de survie'), ls('Entrepôt de laboratoire'), ls('Réserve de données physiques'),
      ls('Dépôt d\'ingénierie'), ls('Entrepôt de ressources'), ls('Réserve stratégique'),
      ls('Dépôt d\'urgence'), ls('Entrepôt de confinement'), ls('Réserve de données de sécurité'),
      ls('Dépôt de matériel de communication'),
    ],
    medical: [
      ls('Centre médical principal'), ls('Salle d\'opérations médicales'), ls('Infirmerie de la station'),
      ls('Centre de traumatologie avancée'), ls('Salle de soins intensifs'),
      ls('Centre de décontamination médicale'), ls('Infirmerie de quarantaine'),
      ls('Salle de diagnostic avancé'), ls('Centre de chirurgie'), ls('Infirmerie d\'urgence'),
      ls('Salle de recherche médicale'), ls('Centre de génie médical'), ls('Salle de réhabilitation'),
      ls('Centre de soins préventifs'), ls('Infirmerie de recherche'), ls('Salle de triage'),
      ls('Centre médical de sécurité'), ls('Infirmerie d\'isolement'), ls('Salle de soin critique'),
      ls('Centre de médecine expérimentale'), ls('Salle de médecine d\'urgence'),
      ls('Centre de soins de l\'équipe'),
    ],
    quarters: [
      ls('Dortoirs du personnel'), ls('Quartiers des chercheurs'), ls('Module d\'habitation'),
      ls('Chambres du personnel'), ls('Quartiers de commandement'), ls('Dortoirs de sécurité'),
      ls('Module résidentiel'), ls('Chambres visiteurs'), ls('Quartiers scientifiques'),
      ls('Dortoirs d\'équipe'), ls('Module de repos'), ls('Chambres de garde'),
      ls('Quartiers administratifs'), ls('Dortoirs techniques'), ls('Module de vie commune'),
      ls('Chambres de permanent'), ls('Quartiers médicaux'), ls('Dortoirs de maintenance'),
      ls('Module de récupération'), ls('Chambres d\'isolement'), ls('Dortoirs de la sécurité avancée'),
      ls('Quartiers des officiers de la station'),
    ],
    hub: [
      ls('Atrium central'), ls('Hall de distribution'), ls('Carrefour des modules'),
      ls('Jonction principale de la station'), ls('Nœud de circulation'), ls('Atrium de transit'),
      ls('Hall de commandement'), ls('Carrefour des sections'), ls('Jonction des corridors'),
      ls('Atrium scientifique'), ls('Hall d\'accueil'), ls('Carrefour central'),
      ls('Jonction de sécurité'), ls('Atrium résidentiel'), ls('Hall de l\'ingénierie'),
      ls('Carrefour médical'), ls('Jonction administrative'), ls('Atrium technique'),
      ls('Hall de communication'), ls('Carrefour d\'urgence'), ls('Atrium de conférence'),
      ls('Nœud de distribution secondaire'),
    ],
    dead_end: [
      ls('Impasse administrative'), ls('Cul-de-sac de maintenance'), ls('Compartiment isolé'),
      ls('Alcôve scientifique'), ls('Impasse de sécurité'), ls('Couloir sans issue'),
      ls('Compartiment verrouillé'), ls('Alcôve de rangement'), ls('Impasse résidentielle'),
      ls('Cul-de-sac de recherche'), ls('Compartiment de confinement'), ls('Alcôve d\'urgence'),
      ls('Impasse technique'), ls('Cul-de-sac blindé'), ls('Compartiment de sécurité avancée'),
      ls('Alcôve de surveillance'), ls('Impasse de données'), ls('Cul-de-sac pressurisé'),
      ls('Compartiment expérimental'), ls('Alcôve de service'), ls('Impasse de laboratoire'),
      ls('Cul-de-sac de décontamination'),
    ],
    hazard_zone: [
      ls('Zone de réacteur'), ls('Salle du réacteur principal'), ls('Zone de radiation'),
      ls('Compartiment de plasma'), ls('Zone de décontamination industrielle'), ls('Salle de fusion'),
      ls('Zone de risque chimique'), ls('Compartiment de refroidissement critique'),
      ls('Zone de haute tension électrique'), ls('Salle de pression critique'),
      ls('Zone de confinement biologique'), ls('Compartiment de carburant'),
      ls('Zone de décompression d\'urgence'), ls('Salle des systèmes critiques'),
      ls('Zone d\'explosion contrôlée'), ls('Compartiment de traitement des déchets'),
      ls('Zone de contamination'), ls('Salle de neutralisation'), ls('Zone de risque de fuite'),
      ls('Compartiment de sécurité nucléaire'), ls('Zone de confinement de l\'expérience'),
      ls('Salle de neutralisation chimique'),
    ],
    engineering: [
      ls('Section de maintenance principale'), ls('Atelier de réparation'),
      ls('Compartiment technique'), ls('Salle des systèmes d\'ingénierie'),
      ls('Zone de maintenance avancée'), ls('Atelier de mécanique spatiale'),
      ls('Compartiment des générateurs'), ls('Salle de contrôle technique'),
      ls('Zone de diagnostic des systèmes'), ls('Atelier de montage'),
      ls('Compartiment électrique'), ls('Salle de maintenance préventive'),
      ls('Zone d\'entretien des modules'), ls('Atelier de soudure avancée'),
      ls('Compartiment de réparation d\'urgence'), ls('Salle des systèmes de survie'),
      ls('Zone de maintenance des docks'), ls('Atelier de robotique'),
      ls('Compartiment de contrôle automatisé'), ls('Salle de maintenance des sas'),
      ls('Atelier de calibration'), ls('Zone de maintenance des systèmes de vie'),
    ],
    airlock: [
      ls('Sas d\'amarrage principal'), ls('Sas d\'EVA'), ls('Sas de transit'),
      ls('Sas de décontamination'), ls('Sas de sécurité'), ls('Sas de ravitaillement'),
      ls('Sas de fret'), ls('Sas d\'urgence'), ls('Sas d\'accès extérieur'),
      ls('Sas de quarantaine'), ls('Sas de transfert de personnel'), ls('Sas de maintenance extérieure'),
      ls('Sas blindé de sécurité'), ls('Sas de sortie d\'urgence'), ls('Sas de pressurisation'),
      ls('Sas de navigation'), ls('Sas d\'expédition scientifique'), ls('Sas d\'inspection'),
      ls('Sas de survie'), ls('Sas de communication'), ls('Sas de transfert de charge'),
      ls('Sas d\'évacuation de masse'),
    ],
    lab: [
      ls('Laboratoire principal'), ls('Salle de recherche avancée'), ls('Laboratoire de biologie'),
      ls('Salle d\'analyse des données'), ls('Laboratoire de physique'), ls('Salle d\'expérimentation'),
      ls('Laboratoire de chimie'), ls('Salle de test des matériaux'), ls('Laboratoire de xénobiologie'),
      ls('Salle de recherche clinique'), ls('Laboratoire de propulsion'), ls('Salle d\'analyse spectrale'),
      ls('Laboratoire de génétique'), ls('Salle d\'expérimentation robotique'),
      ls('Laboratoire de sécurité biologique'), ls('Salle de recherche en confinement'),
      ls('Laboratoire de simulation'), ls('Salle d\'analyse des signaux'),
      ls('Laboratoire d\'intelligence artificielle'), ls('Salle d\'expérimentation de matière noire'),
      ls('Laboratoire de biochimie'), ls('Salle de recherche xénologique'),
    ],
    server_room: [
      ls('Salle des serveurs'), ls('Centre de traitement des données'),
      ls('Salle des systèmes informatiques'), ls('Centre d\'archivage numérique'),
      ls('Salle de stockage des données'), ls('Centre de l\'IA de la station'),
      ls('Salle de contrôle informatique'), ls('Centre de gestion de la base de données'),
      ls('Salle des communications numériques'), ls('Centre de cybersécurité'),
      ls('Salle des systèmes d\'information'), ls('Centre de calcul'), ls('Salle de récupération de données'),
      ls('Centre de surveillance informatique'), ls('Salle du réseau'),
      ls('Centre de traitement des alertes'), ls('Salle des protocoles de sécurité'),
      ls('Centre des systèmes d\'alerte'), ls('Salle de décryptage'),
      ls('Centre de gestion des accès'), ls('Salle de sauvegarde des données'),
      ls('Centre de traitement des communications'),
    ],
  },
  features: ['blast_door', 'observation_deck', 'tram_system', 'containment_field', 'security_terminal', 'emergency_beacon'],
  preferredItems: ['security_badge', 'research_terminal', 'containment_tool', 'access_keycard', 'encrypted_data_core', 'incriminating_files'],
};

// ---------------------------------------------------------------------------
// ALIEN RUINS — Ruines Extraterrestres
// ---------------------------------------------------------------------------

const ALIEN_RUINS: SettingDefinition = {
  id: 'alien_ruins',
  nameKey: { fr: 'Ruines Extraterrestres', en: 'Alien Ruins' },
  categories: ['alien'],
  supportedRoles: [
    'passage', 'control_room', 'hub', 'dead_end', 'hazard_zone',
    'ritual_chamber', 'organic_growth', 'crystal_cave', 'gravity_well',
  ],
  locationNames: {
    passage: [
      ls('Tunnel organique'), ls('Couloir de spores'), ls('Passage de cristaux'),
      ls('Tunnel de bioluminescence'), ls('Couloir extraterrestre'), ls('Passage de membranes'),
      ls('Tunnel de lianes'), ls('Couloir de pulsations'), ls('Passage de filaments'),
      ls('Tunnel de sang noir'), ls('Couloir de nervures'), ls('Passage de spires'),
      ls('Tunnel de mycètes'), ls('Couloir de résine'), ls('Passage de cheiropodes'),
      ls('Tunnel de membranes pulsantes'), ls('Couloir de chairs'), ls('Passage de cristaux noirs'),
      ls('Tunnel d\'ossements'), ls('Couloir de plaques'), ls('Passage de spores denses'),
      ls('Tunnel de biovaisseaux'),
    ],
    control_room: [
      ls('Nexus de contrôle'), ls('Chambre de commandement extraterrestre'), ls('Nexus de pulsation'),
      ls('Salle du grand nexus'), ls('Centre de contrôle alien'), ls('Nexus de distribution'),
      ls('Chambre de relais'), ls('Nexus de communication'), ls('Centre de pulsation principale'),
      ls('Chambre de gouvernance'), ls('Nexus d\'énergie primaire'), ls('Salle de contrôle des flux'),
      ls('Chambre de commandement suprême'), ls('Nexus de fusion'), ls('Centre de calcul alien'),
      ls('Chambre de l\'entité'), ls('Nexus de contrôle secondaire'), ls('Salle de navigation alien'),
      ls('Centre de coordination psionique'), ls('Nexus de transmission'),
      ls('Chambre de la conscience'), ls('Nexus de l\'ancienne technologie'),
    ],
    hub: [
      ls('Chambre centrale'), ls('Carrefour alien'), ls('Nœud de distribution'),
      ls('Chambre de jonction'), ls('Centre de convergence'), ls('Carrefour des tunnels'),
      ls('Chambre de bifurcation'), ls('Nœud central'), ls('Centre de croisement'),
      ls('Carrefour de cristaux'), ls('Chambre d\'intersection'), ls('Nœud de dispersion'),
      ls('Centre de la ruche'), ls('Carrefour de membranes'), ls('Chambre de communication'),
      ls('Nœud de coordination'), ls('Centre biologique'), ls('Carrefour de spores'),
      ls('Chambre de convergence'), ls('Nœud central de la ruche'), ls('Carrefour des flux'),
      ls('Chambre de distribution alien'),
    ],
    dead_end: [
      ls('Alcôve cristalline'), ls('Impasse organique'), ls('Chambre aveugle'),
      ls('Alcôve de cristaux noirs'), ls('Impasse de membranes'), ls('Chambre dormante'),
      ls('Alcôve de spores'), ls('Impasse de filaments'), ls('Chambre d\'incubation'),
      ls('Alcôve pulsante'), ls('Impasse de chair'), ls('Chambre de gestation'),
      ls('Alcôve de bioluminescence'), ls('Impasse de cristaux'), ls('Chambre d\'absorption'),
      ls('Alcôve de mycorhizes'), ls('Impasse de résine'), ls('Chambre de stockage biologique'),
      ls('Alcôve de capsules'), ls('Impasse de membranes dormantes'),
      ls('Alcôve de cristaux de mémoire'), ls('Chambre d\'œufs'),
    ],
    hazard_zone: [
      ls('Puits gravitationnel'), ls('Zone de distorsion gravitationnelle'), ls('Puits de gravité aberrante'),
      ls('Chambre de flux gravitationnel'), ls('Zone de singularité'), ls('Puits de compression'),
      ls('Zone de déchirement spatial'), ls('Chambre de vide gravitationnel'), ls('Puits de torsion'),
      ls('Zone de gravité inversée'), ls('Puits de collapse'), ls('Zone de trou noir localisé'),
      ls('Chambre de pesanteur nulle'), ls('Puits d\'énergie sombre'), ls('Zone de flux incontrôlé'),
      ls('Chambre de déchirement temporel'), ls('Puits de radiation alien'), ls('Zone de dissolution matière'),
      ls('Chambre de singularité locale'), ls('Puits de néant'), ls('Zone de gravité variable'),
      ls('Puits d\'énergie alien'),
    ],
    ritual_chamber: [
      ls('Sanctuaire principal'), ls('Chambre rituelle'), ls('Sanctuaire de la ruche'),
      ls('Chambre de cérémonie'), ls('Sanctuaire alien primordial'), ls('Chambre de pulsation sacrée'),
      ls('Sanctuaire du grand œil'), ls('Chambre de communion'), ls('Sanctuaire de transformation'),
      ls('Chambre de l\'entité centrale'), ls('Sanctuaire de chair et de cristal'),
      ls('Chambre de vénération'), ls('Sanctuaire de mémoire alien'), ls('Chambre du sacrifice'),
      ls('Sanctuaire de cristaux vivants'), ls('Chambre de la conscience collective'),
      ls('Sanctuaire de l\'embryon'), ls('Chambre de régénération'), ls('Sanctuaire des anciens'),
      ls('Chambre de la reine'), ls('Sanctuaire de l\'éveil'), ls('Chambre d\'invocation'),
    ],
    organic_growth: [
      ls('Zone organique principale'), ls('Chambre de prolifération'), ls('Zone de croissance biologique'),
      ls('Masse de chairs pulsantes'), ls('Zone de prolifération mycologique'),
      ls('Chambre d\'expansion organique'), ls('Zone de tissus vivants'), ls('Masse de spores géantes'),
      ls('Zone de racines pulsantes'), ls('Chambre de progression biologique'),
      ls('Zone de membranes épaisses'), ls('Masse de filaments'), ls('Zone de pulsations biologiques'),
      ls('Chambre de croissance rapide'), ls('Zone de nodules vivants'), ls('Masse d\'organismes coloniaux'),
      ls('Zone de transformation biologique'), ls('Chambre de matière vivante'),
      ls('Zone de prolifération cellulaire'), ls('Masse d\'organismes entrelacés'),
      ls('Zone de chair active'), ls('Chambre de croissance exponentielle'),
    ],
    crystal_cave: [
      ls('Grotte cristalline'), ls('Caverne de cristaux noirs'), ls('Grotte de formation minérale alien'),
      ls('Caverne de géodes vivants'), ls('Grotte de cristaux pulsants'), ls('Caverne de cristaux translucides'),
      ls('Grotte de formations étranges'), ls('Caverne de cristaux lumineux'), ls('Grotte de formations inconnues'),
      ls('Caverne de cristaux géants'), ls('Grotte de cristaux de plasma'), ls('Caverne de structures cristallines'),
      ls('Grotte de formations minérales vivantes'), ls('Caverne de cristaux de mémoire'),
      ls('Grotte de formations de lumière'), ls('Caverne de cristaux sonar'),
      ls('Grotte de cristaux fractals'), ls('Caverne de formations prismatiques'),
      ls('Grotte de cristaux temporels'), ls('Caverne de cristaux dormants'),
      ls('Grotte de cristaux harmoniques'), ls('Caverne de cristaux vivants'),
    ],
    gravity_well: [
      ls('Puits de gravité central'), ls('Chambre de gravité aberrante'), ls('Puits de singularité locale'),
      ls('Zone de distorsion gravitationnelle intense'), ls('Puits de compression spatiale'),
      ls('Chambre de gravité inversée'), ls('Puits d\'attraction centrale'),
      ls('Zone de déchirement gravitationnel'), ls('Puits de force locale'),
      ls('Chambre de flux gravitationnel concentré'), ls('Puits d\'énergie sombre'),
      ls('Zone de gradient gravitationnel'), ls('Puits de torsion espace-temps'),
      ls('Chambre de singularité résiduelle'), ls('Puits de néant gravitationnel'),
      ls('Zone d\'écrasement spatial'), ls('Puits de condensation gravitationnelle'),
      ls('Chambre de vortex'), ls('Puits de champ de gravité alien'), ls('Zone de gravité variable'),
      ls('Puits de singularité en formation'), ls('Chambre de distorsion focalisée'),
    ],
  },
  features: ['crystal_node', 'organic_wall', 'alien_terminal', 'gravity_well', 'bioluminescence', 'psionic_amplifier'],
  preferredItems: ['translator_device', 'void_shard', 'psionic_amplifier', 'ancient_key', 'sonic_emitter', 'research_notes'],
};

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

/** All 3 launch settings */
export const LAUNCH_SETTINGS: readonly SettingDefinition[] = [
  DERELICT_SHIP,
  SPACE_STATION,
  ALIEN_RUINS,
] as const;

/** Look up a setting by ID */
export function getSettingById(id: string): SettingDefinition | undefined {
  return LAUNCH_SETTINGS.find(s => s.id === id);
}

/** All valid setting IDs */
export const SETTING_IDS = ['derelict_ship', 'space_station', 'alien_ruins'] as const;
export type SettingId = typeof SETTING_IDS[number];
