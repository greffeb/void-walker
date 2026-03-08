// ---------------------------------------------------------------------------
// src/content/microModules/lore.ts — Lore micro-modules (15)
// ---------------------------------------------------------------------------
// ~3-4 per skeleton. Each needs loreData with support type.
// ---------------------------------------------------------------------------

import type { MicroModule } from '../../engine/scenario';

const ls = (fr: string): { fr: string; en: string } => ({ fr, en: '' });

/** All lore micro-modules */
export const LORE_MICRO_MODULES: readonly MicroModule[] = [
  // === ESCAPE + INVESTIGATE (5) ===
  {
    id: 'mm_lore_terminal_logs',
    type: 'lore',
    validParentRoles: ['control_room', 'hub', 'engineering', 'lab', 'server_room'],
    validBeats: ['rising', 'midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'control_room',
    features: [
      { id: 'mm_data_terminal', initialState: 'active', examineResult: ls('Un terminal encore actif. Les logs système défilent à l\'écran.') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 11,
      loreText: ls('Les logs révèlent une séquence d\'alertes ignorées. Quelqu\'un a délibérément désactivé les capteurs de proximité six heures avant l\'incident.'),
      failureText: ls('L\'écran affiche des données corrompues. Vous distinguez des timestamps mais pas le contenu des messages.'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un poste de travail isolé. L\'écran du terminal clignote faiblement, des lignes de texte défilent automatiquement.',
        hintText: 'Un terminal actif derrière une porte latérale.',
        revisitDescription: 'Le poste de travail. Le terminal affiche toujours les mêmes données.',
      },
    },
  },
  {
    id: 'mm_lore_personal_effects',
    type: 'lore',
    validParentRoles: ['quarters', 'medical', 'passage', 'hub'],
    validBeats: ['intro', 'rising', 'midpoint'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'quarters',
    features: [
      { id: 'mm_personal_photo', initialState: 'intact', examineResult: ls('Une photo de famille collée au mur. Au dos, un message : "On revient bientôt."') },
    ],
    loreData: {
      supportType: 'physical_document',
      loreText: ls('Un carnet personnel. Les dernières entrées parlent de bruits dans les murs et de cauchemars partagés par tout l\'équipage. La dernière page est arrachée.'),
      feedsBlackBox: false,
    },
    locale: {
      fr: {
        description: 'Une cabine personnelle. Le lit est défait, des effets personnels sont éparpillés. Un carnet est posé sur la table de nuit.',
        hintText: 'Une porte de cabine entrouverte.',
        revisitDescription: 'La cabine personnelle. Le carnet est toujours sur la table.',
      },
    },
  },
  {
    id: 'mm_lore_bloodstains',
    type: 'lore',
    validParentRoles: ['passage', 'dead_end', 'hub', 'hazard_zone'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'hidden',
    hiddenDC: 12,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_bloodstains', initialState: 'intact', examineResult: ls('Des traces de sang séché forment un motif sur le sol. Comme si quelqu\'un avait rampé.') },
    ],
    loreData: {
      supportType: 'environmental_trace',
      accessStat: 'PER',
      accessDC: 11,
      loreText: ls('Les traces de griffures sur le mur racontent une histoire : quelqu\'un a tenté de s\'échapper en rampant. Les marques s\'arrêtent brusquement au milieu du couloir.'),
      failureText: ls('Des traces sombres sur le sol et les murs. Difficile de déterminer ce qui s\'est passé ici.'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un recoin sombre du couloir. Des traces sombres maculent le sol et les murs. L\'air a une odeur de cuivre.',
        hintText: 'Vous remarquez des traces sombres menant vers une alcôve...',
        revisitDescription: 'L\'alcôve aux traces de sang. Rien n\'a changé.',
      },
    },
  },
  {
    id: 'mm_lore_emergency_recording',
    type: 'lore',
    validParentRoles: ['control_room', 'hub', 'engineering', 'passage'],
    validBeats: ['rising', 'midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'control_room',
    features: [
      { id: 'mm_recorder', initialState: 'active', examineResult: ls('Un enregistreur d\'urgence. Le voyant rouge indique un message en attente.') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 10,
      loreText: ls('"Ici Dr. Vasquez, protocole urgence Sigma-7. Si vous entendez ceci... ne faites pas confiance aux systèmes automatiques. Ils sont compromis. Repeat—" L\'enregistrement se coupe dans un cri.'),
      failureText: ls('L\'enregistrement est trop dégradé pour être compris. Vous captez des bribes : "...protocole... compromis..."'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un poste de communication d\'urgence. L\'enregistreur clignote en rouge, signalant un message non lu.',
        hintText: 'Un poste de communication avec un voyant rouge.',
        revisitDescription: 'Le poste de communication. L\'enregistrement a déjà été écouté.',
      },
    },
  },
  {
    id: 'mm_lore_survivor_note',
    type: 'lore',
    validParentRoles: ['quarters', 'passage', 'storage', 'dead_end'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'hidden',
    hiddenDC: 14,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_scratched_wall', initialState: 'intact', examineResult: ls('Des mots gravés dans le métal du mur. Écrits avec un objet pointu.') },
    ],
    loreData: {
      supportType: 'environmental_trace',
      accessStat: 'PER',
      accessDC: 12,
      loreText: ls('Gravés dans le métal : "JOUR 7 — Plus de radio. Plus d\'eau. J\'entends ÇA dans les conduits. Si vous lisez ceci, NE DESCENDEZ PAS AU NIVEAU -2."'),
      failureText: ls('Des marques dans le métal. Certaines ressemblent à des lettres mais vous ne parvenez pas à les déchiffrer.'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un cul-de-sac. Le mur du fond est couvert de griffures et de marques. Certaines semblent intentionnelles.',
        hintText: 'Vous remarquez des griffures étranges sur un mur...',
        revisitDescription: 'Le cul-de-sac aux inscriptions. Les mots gravés sont toujours là.',
      },
    },
  },

  // === ESCAPE (4) ===
  {
    id: 'mm_lore_escape_captain_log',
    type: 'lore',
    validParentRoles: ['control_room', 'quarters'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'control_room',
    features: [
      { id: 'mm_captain_terminal', initialState: 'active', examineResult: ls('Le terminal du capitaine. Le journal de bord est toujours accessible.') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 12,
      loreText: ls('"Journal du Cpt. Moreau, J-2 : Le fret de la cale 7 émet des lectures biologiques anormales. Weyland-Mori refuse d\'ouvrir une enquête. Je note pour le rapport." L\'entrée suivante est corrompue.'),
      failureText: ls('Le journal est protégé par un chiffrement partiel. Vous ne lisez que des fragments : "...cale 7... anormales... refuse..."'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Le bureau privé du capitaine. Son terminal est encore actif, le journal de bord affiché à l\'écran.',
        hintText: 'Un accès vers le bureau du capitaine.',
        revisitDescription: 'Le bureau du capitaine. Le terminal affiche toujours le journal.',
      },
    },
  },
  {
    id: 'mm_lore_escape_incident_report',
    type: 'lore',
    validParentRoles: ['engineering', 'control_room', 'storage'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape'],
    visibility: 'hidden',
    hiddenDC: 13,
    locationRole: 'engineering',
    features: [
      { id: 'mm_sealed_report', initialState: 'intact', examineResult: ls('Un dossier physique avec un tampon "CONFIDENTIEL". Les pages sont froissées.') },
    ],
    loreData: {
      supportType: 'physical_document',
      loreText: ls('Rapport d\'incident #447 : "Rupture de confinement biologique, cale 7. L\'échantillon XB-9 a franchi trois couches d\'isolation. Protocole d\'incinération recommandé. REFUSÉ par directive corporative."'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un réduit d\'archivage. Des dossiers physiques sont empilés sur des étagères métalliques. Un dossier rouge attire l\'attention.',
        hintText: 'Vous apercevez des classeurs dans une pièce attenante...',
        revisitDescription: 'Le réduit d\'archivage. Le dossier confidentiel a été lu.',
      },
    },
  },
  {
    id: 'mm_lore_escape_distress_call',
    type: 'lore',
    validParentRoles: ['control_room', 'hub'],
    validBeats: ['escalation'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'control_room',
    features: [
      { id: 'mm_comm_relay', initialState: 'active', examineResult: ls('Un relais de communication. Un appel de détresse tourne en boucle.') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 13,
      loreText: ls('"Mayday, mayday, ici USCSS Nostromo-7. L\'équipage est décimé. La créature est dans le système de ventilation. Envoyez des secours. Position—" Le signal se brouille avant les coordonnées.'),
      failureText: ls('L\'appel de détresse est trop parasité. Vous distinguez "mayday" et "créature" mais le reste est inaudible.'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Une cabine de communication. Un appel de détresse tourne en boucle, la voix désespérée se répète inlassablement.',
        hintText: 'Vous entendez une voix étouffée provenant d\'une cabine...',
        revisitDescription: 'La cabine de communication. L\'appel de détresse continue de tourner.',
      },
    },
  },
  {
    id: 'mm_lore_escape_personal_message',
    type: 'lore',
    validParentRoles: ['quarters', 'passage'],
    validBeats: ['intro', 'rising'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'quarters',
    features: [
      { id: 'mm_tablet', initialState: 'intact', examineResult: ls('Une tablette personnelle. L\'écran fissuré affiche encore un message vidéo.') },
    ],
    loreData: {
      supportType: 'physical_document',
      loreText: ls('Un message vidéo non envoyé : une femme souriante dit au revoir à ses enfants. "Encore deux semaines et maman rentre. Soyez sages." La date est d\'il y a trois mois.'),
      feedsBlackBox: false,
    },
    locale: {
      fr: {
        description: 'Un coin repos entre deux couchettes. Une tablette avec un écran fissuré est posée sur un oreiller.',
        hintText: 'Une cabine avec la porte entrebâillée.',
        revisitDescription: 'Le coin repos. La tablette affiche toujours le même message.',
      },
    },
  },

  // === INVESTIGATE (3) ===
  {
    id: 'mm_lore_investigate_research_data',
    type: 'lore',
    validParentRoles: ['lab', 'server_room', 'control_room'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'lab',
    features: [
      { id: 'mm_research_terminal', initialState: 'active', examineResult: ls('Un terminal de recherche. Les données expérimentales sont partiellement accessibles.') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 12,
      loreText: ls('Données du Protocole Lazarus : "Sujet 7 montre une régénération cellulaire 400% supérieure à la normale. Effets secondaires : agressivité extrême, mutations osseuses. Note : NE PAS réveiller le Sujet 8."'),
      failureText: ls('Les données sont cryptées. Vous interceptez des mots-clés : "Protocole Lazarus", "régénération", "mutations".'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un laboratoire annexe. Les écrans des moniteurs de recherche clignotent dans la pénombre.',
        hintText: 'Un accès vers un laboratoire secondaire.',
        revisitDescription: 'Le laboratoire annexe. Les écrans affichent toujours les mêmes données.',
      },
    },
  },
  {
    id: 'mm_lore_investigate_whistleblower',
    type: 'lore',
    validParentRoles: ['quarters', 'control_room', 'hub'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['investigate'],
    visibility: 'hidden',
    hiddenDC: 13,
    locationRole: 'quarters',
    features: [
      { id: 'mm_hidden_drive', initialState: 'intact', examineResult: ls('Un disque de stockage caché sous le matelas. Il porte une étiquette : "ASSURANCE".') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 13,
      loreText: ls('Un témoignage anonyme enregistré clandestinement : "La direction sait. Les sujets de test sont des membres d\'équipage involontaires. J\'ai les preuves. Si je disparais, cherchez le serveur B7."'),
      failureText: ls('Le disque est partiellement corrompu. Vous entendez des bribes : "...la direction sait... involontaires..."'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Une cabine au désordre suspect. Quelqu\'un a fouillé les lieux — tiroirs ouverts, matelas retourné.',
        hintText: 'Vous remarquez qu\'une cabine a été fouillée récemment...',
        revisitDescription: 'La cabine fouillée. Le disque "ASSURANCE" a été récupéré.',
      },
    },
  },
  {
    id: 'mm_lore_investigate_emails',
    type: 'lore',
    validParentRoles: ['control_room', 'server_room', 'lab'],
    validBeats: ['escalation'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'server_room',
    features: [
      { id: 'mm_email_server', initialState: 'active', examineResult: ls('Un serveur de messagerie. Les emails internes n\'ont pas été effacés.') },
    ],
    loreData: {
      supportType: 'data_terminal',
      accessStat: 'INT',
      accessDC: 14,
      loreText: ls('Email du Dr. Chen au Directeur Park : "Sujet 8 est RÉVEILLÉ. Je vous avais prévenu. Le confinement ne tiendra pas. Procédure d\'évacuation lancée." Réponse de Park : "Évacuation annulée. Trop d\'investissement pour abandonner."'),
      failureText: ls('Le serveur résiste au piratage. Vous ne lisez qu\'un fragment : "RÉVEILLÉ... confinement ne tiendra pas... Évacuation annulée."'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Une salle serveur secondaire. Les indicateurs clignotent, la température est élevée.',
        hintText: 'Un accès vers une salle serveur.',
        revisitDescription: 'La salle serveur. Les emails sont toujours affichés.',
      },
    },
  },

  // === RESCUE (3) ===
  {
    id: 'mm_lore_rescue_alien_inscription',
    type: 'lore',
    validParentRoles: ['passage', 'ritual_chamber', 'organic_growth', 'crystal_cave'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['rescue'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_alien_glyphs', initialState: 'intact', examineResult: ls('Des glyphes alien gravés dans la matière organique. Ils semblent suivre un motif répétitif.') },
    ],
    loreData: {
      supportType: 'environmental_trace',
      accessStat: 'PER',
      accessDC: 11,
      loreText: ls('Les glyphes racontent une histoire en images : une espèce construisant, prospérant, puis confrontée à quelque chose venu de l\'intérieur. Les derniers symboles montrent une fuite massive.'),
      failureText: ls('Les glyphes sont trop abstraits pour être déchiffrés. Vous reconnaissez des formes vaguement humanoïdes mais le sens vous échappe.'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Une alcôve dans la matière organique. Les parois sont couvertes de glyphes luminescents qui pulsent faiblement.',
        hintText: 'Des glyphes luminescents brillent dans une alcôve.',
        revisitDescription: 'L\'alcôve aux glyphes. Ils pulsent toujours au même rythme.',
      },
    },
  },
  {
    id: 'mm_lore_rescue_explorer_journal',
    type: 'lore',
    validParentRoles: ['passage', 'hub', 'dead_end'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['rescue'],
    visibility: 'hidden',
    hiddenDC: 12,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_explorer_pack', initialState: 'intact', examineResult: ls('Un sac à dos d\'exploration humain. Il contient un journal de terrain.') },
    ],
    loreData: {
      supportType: 'physical_document',
      loreText: ls('Journal de l\'Explorateur Ikeda : "Jour 12 — La structure est VIVANTE. Les murs changent de configuration la nuit. Je retrouve des passages là où il n\'y en avait pas. Je commence à douter de ma propre mémoire."'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un cul-de-sac où un sac à dos d\'exploration humain gît abandonné. Son propriétaire n\'est nulle part.',
        hintText: 'Vous remarquez un équipement humain dans un recoin...',
        revisitDescription: 'Le cul-de-sac avec le sac d\'exploration. Le journal a été lu.',
      },
    },
  },
  {
    id: 'mm_lore_rescue_npc_testimony',
    type: 'lore',
    validParentRoles: ['hub', 'passage', 'control_room'],
    validBeats: ['escalation'],
    validSkeletons: ['rescue'],
    visibility: 'open',
    locationRole: 'hub',
    features: [
      { id: 'mm_npc_survivor', initialState: 'intact', examineResult: ls('Un survivant recroquevillé dans un coin. Il marmonne des phrases incompréhensibles.') },
    ],
    npcs: [{ id: 'mm_traumatized_survivor', disposition: 'neutral', examineResult: ls('Un explorateur en état de choc. Ses yeux sont vitreux.') }],
    loreData: {
      supportType: 'npc_testimony',
      accessStat: 'CHA',
      accessDC: 12,
      loreText: ls('"Ils... ils ne sont pas morts. L\'entité les a... absorbés. J\'ai vu le Dr. Ikeda fondu dans le mur. Il respirait encore. Il m\'a dit de courir." Le survivant se tait, les yeux perdus dans le vide.'),
      failureText: ls('Le survivant vous regarde sans vous voir. Il marmonne des bribes : "...absorbés... respirait encore..." mais refuse de parler.'),
      feedsBlackBox: true,
    },
    locale: {
      fr: {
        description: 'Un espace de repos improvisé. Un survivant est recroquevillé dans un coin, enveloppé dans une couverture de survie. Il tremble.',
        hintText: 'Vous entendez quelqu\'un murmurer dans une pièce adjacente.',
        revisitDescription: 'Le survivant est toujours là, mais il ne parle plus.',
      },
    },
  },
];
