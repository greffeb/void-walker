// ---------------------------------------------------------------------------
// src/content/scenarios/rescue.ts — RESCUE skeleton: "Dernier Signal"
// ---------------------------------------------------------------------------
// Fantasy: Someone is alive in there. Get them out.
// 6 core nodes, gate item: medical_stabilizer, boss type: choice
// ---------------------------------------------------------------------------

import type { CoreSkeleton } from '@engine/scenario';

export const RESCUE_SKELETON: CoreSkeleton = {
  id: 'rescue',
  nameKey: { fr: 'Dernier Signal', en: 'Last Signal' },
  descriptionKey: {
    fr: 'Un signal de détresse pulse depuis les profondeurs. Quelqu\'un est encore en vie. Allez le chercher.',
    en: 'A distress signal pulses from the depths. Someone is still alive. Go get them.',
  },

  nodes: [
    {
      id: 'start',
      role: 'entry',
      beat: 'intro',
      tension: 2,
      descriptionKey: {
        fr: 'Site de Crash — Votre navette s\'est écrasée à l\'approche. Coque percée. Un signal de détresse pulse depuis l\'intérieur.',
        en: 'Crash Site — Your shuttle crashed on approach. Hull breached. A distress signal pulses from deeper inside.',
      },
    },
    {
      id: 'unlock',
      role: 'gate',
      beat: 'rising',
      tension: 4,
      descriptionKey: {
        fr: 'Point de Triage — Un couloir effondré bloque le passage. Il faut un stabilisateur médical pour soigner la survivante — et un chemin pour y arriver.',
        en: 'Triage Point — A collapsed corridor blocks the way. Need a medical stabilizer to treat the survivor — and a path to reach her.',
      },
    },
    {
      id: 'reveal',
      role: 'midpoint',
      beat: 'midpoint',
      tension: 6,
      descriptionKey: {
        fr: 'Emplacement de la Survivante — La Dr. Okonkwo. Blessée, consciente. Elle connaît la faiblesse de la créature. Et l\'unique chemin de sortie traverse son territoire de chasse.',
        en: 'Survivor\'s Location — Dr. Okonkwo. Wounded but conscious. She knows the creature\'s weakness. And the only exit goes through its hunting ground.',
      },
    },
    {
      id: 'escalation',
      role: 'escalation',
      beat: 'escalation',
      tension: 8,
      descriptionKey: {
        fr: 'La Traque — Vous escortez une blessée. Chaque déplacement est calculé. La créature a détecté le sang de la Dr. Okonkwo.',
        en: 'The Hunt Begins — You\'re escorting a wounded NPC. Movement is calculated. The creature has detected Dr. Okonkwo\'s blood.',
      },
    },
    {
      id: 'boss',
      role: 'climax',
      beat: 'climax',
      tension: 10,
      descriptionKey: {
        fr: 'Point d\'Extraction — La navette est en vue. La créature vous coupe la route. Un choix impossible s\'impose.',
        en: 'Exit Point — The shuttle is in sight. The creature cuts you off. An impossible choice looms.',
      },
    },
    {
      id: 'resolution',
      role: 'epilogue',
      beat: 'resolution',
      tension: 3,
      descriptionKey: {
        fr: 'Décollage — La navette décolle. Ce qui s\'est passé ensuite dépend de vos choix.',
        en: 'Liftoff — The shuttle takes off. What happened next depends on your choices.',
      },
    },
  ],

  gateItem: 'medical_stabilizer',
  gateItemLocation: 'start',

  revelation: {
    fr: 'La Dr. Okonkwo est la chercheuse principale — et la créature était son expérience. Elle connaît sa faiblesse : la sensibilité sonore. La culpabilité la rend prête à tout pour aider.',
    en: 'Dr. Okonkwo is the lead researcher — and the creature was her experiment. She knows its weakness: sound sensitivity. Guilt makes her ready to help at any cost.',
  },
  escalationTrigger: {
    fr: 'Vous escortez maintenant une blessée. Les déplacements sont ralentis. La créature a détecté l\'odeur du sang. La chasse commence.',
    en: 'You\'re now escorting a wounded NPC. Movement is slower. The creature has detected the scent of blood. The hunt begins.',
  },

  bossType: 'choice',

  primaryVictory: {
    type: 'escort_alive',
    npcId: 'dr_okonkwo',
    locationId: 'resolution',
  },
  alternativeVictory: {
    type: 'reach_location',
    locationId: 'resolution',
  },
  emergentVictoryHint: {
    fr: 'L\'émetteur sonique combiné avec l\'acoustique de la zone pourrait confiner la créature...',
    en: 'The sonic emitter combined with the zone\'s acoustics could permanently trap the creature...',
  },

  nodeLocations: {
    start: {
      locationRole: 'dead_end',
      items: [
        { id: 'first_aid_kit', examineResult: { fr: 'Trousse de premiers soins récupérée de la navette. Contient des compresses, du désinfectant et un garrot. Pas suffisant pour stabiliser une blessure grave, mais utile en urgence.', en: '' } },
        { id: 'medical_stabilizer', hidden: true, examineResult: { fr: 'Stabilisateur médical de niveau hospitalier. Ce dispositif peut maintenir un patient en état stable pendant plusieurs heures — exactement ce qu\'il faut pour la survivante blessée.', en: '' } },
      ],
      features: [
        { id: 'crashed_shuttle', initialState: 'damaged', examineResult: { fr: 'Votre navette, écrasée à l\'approche. Le cockpit est déformé mais la soute arrière est accessible. Le moteur principal est hors service — il faudra trouver une autre navette pour s\'en sortir.', en: '' } },
        { id: 'hull_breach', initialState: 'open', examineResult: { fr: 'Une brèche béante dans la coque extérieure. Les bords sont déchiquetés vers l\'intérieur — l\'impact venait de dehors. La structure autour est fragilisée mais le passage est stable.', en: '' } },
        { id: 'salvageable_parts', initialState: 'intact', examineResult: { fr: 'Pièces récupérables éparpillées dans les débris : câblage, composants électroniques, outils. De quoi improviser des réparations ou fabriquer un outil de fortune.', en: '' } },
        { id: 'emergency_beacon_broken', initialState: 'broken', examineResult: { fr: 'La balise de détresse de la navette — endommagée dans le crash. Le circuit d\'émission est intact mais l\'antenne est brisée. Avec les bonnes pièces, elle pourrait être réparée.', en: '' } },
      ],
      exits: ['unlock'],
    },
    unlock: {
      locationRole: 'medical',
      items: [],
      features: [
        { id: 'collapsed_corridor', initialState: 'broken', examineResult: { fr: 'Le couloir s\'est effondré sous le poids des débris. Des poutres métalliques bloquent le passage principal. Un détour par la maintenance est possible, ou un découpeur plasma pourrait ouvrir la voie.', en: '' } },
        { id: 'maintenance_detour_hatch', initialState: 'intact', examineResult: { fr: 'Trappe d\'accès vers les conduits de maintenance. Étroite mais praticable. Elle contourne l\'effondrement principal et mène de l\'autre côté.', en: '' } },
        { id: 'plasma_cutter_rack', initialState: 'intact', examineResult: { fr: 'Rack contenant un découpeur plasma industriel. Puissant assez pour couper à travers les poutres effondrées, mais le bruit attirerait l\'attention de tout prédateur dans les parages.', en: '' } },
      ],
      exits: ['start', 'reveal'],
    },
    reveal: {
      locationRole: 'medical',
      items: [
        { id: 'research_notes', examineResult: { fr: 'Notes de recherche de la Dr. Okonkwo. Détaillent les expériences sur le "Projet Chasseur" — une créature modifiée génétiquement. Point clé : sensibilité acoustique extrême. Les hautes fréquences la désorientent.', en: '' } },
        { id: 'sonic_emitter_component', examineResult: { fr: 'Composant d\'émetteur sonique haute fréquence. Utilisé dans les expériences de la Dr. Okonkwo. Combiné avec l\'acoustique d\'une zone confinée, il pourrait neutraliser ou piéger la créature.', en: '' } },
      ],
      npcs: [
        { id: 'dr_okonkwo', disposition: 'cooperative', hpOverride: 4, talkSuccess: { fr: '"Merci d\'être venu. Je suis la Dr. Okonkwo — chercheuse principale. C\'est ma créature. Mon expérience. Je sais, c\'est ma faute. Mais je connais sa faiblesse : les hautes fréquences. Le son la désoriente, la rend vulnérable. Il y a un composant d\'émetteur sonique dans mon labo. Utilisez-le. Et par pitié, sortez-moi d\'ici."', en: '' }, talkFailure: { fr: 'La Dr. Okonkwo vous regarde avec méfiance. "Qui êtes-vous ? Comment puis-je savoir que vous n\'êtes pas envoyé par la corporation pour me faire taire ?" Elle se recroqueville derrière sa barricade. Il faudra gagner sa confiance.', en: '' } },
      ],
      features: [
        { id: 'survivor_barricade', initialState: 'intact', examineResult: { fr: 'Une barricade improvisée avec du mobilier et des plaques métalliques. Quelqu\'un s\'est retranché ici — et a survécu. Des traces de sang mènent derrière.', en: '' } },
        { id: 'research_terminal', initialState: 'damaged', examineResult: { fr: 'Terminal de recherche partiellement détruit. Les données récupérables montrent des résultats d\'expériences génétiques — la créature était un succès scientifique. Un échec éthique.', en: '' } },
      ],
      exits: ['unlock', 'escalation'],
    },
    escalation: {
      locationRole: 'passage',
      items: [],
      npcs: [
        { id: 'creature_hunter', disposition: 'hostile', talkSuccess: { fr: 'La créature réagit à votre voix — un frémissement parcourt son corps. Elle hésite, inclinant la tête. Les hautes fréquences de votre voix semblent la perturber momentanément.', en: '' }, talkFailure: { fr: 'Un grondement sourd est la seule réponse. La créature bondit en avant, toutes griffes dehors. Parler ne sert à rien — seul le son calibré l\'atteint.', en: '' } },
      ],
      features: [
        { id: 'acoustic_walls', initialState: 'intact', examineResult: { fr: 'Les parois de cette zone sont recouvertes de panneaux acoustiques — restes du laboratoire de la Dr. Okonkwo. Un émetteur sonique fonctionnerait ici avec une efficacité maximale grâce à la réverbération.', en: '' } },
        { id: 'distraction_rack', initialState: 'intact', examineResult: { fr: 'Rack contenant des grenades flash et des générateurs de bruit. Utiles pour créer une diversion et détourner la créature de votre chemin.', en: '' } },
        { id: 'blast_door_partial', initialState: 'damaged', examineResult: { fr: 'Porte blindée partiellement ouverte. La créature a forcé le passage — les marques de griffes témoignent d\'une force effrayante. Le mécanisme est coincé à mi-course.', en: '' } },
      ],
      exits: ['reveal', 'boss'],
    },
    boss: {
      locationRole: 'airlock',
      items: [],
      npcs: [
        { id: 'creature_hunter', disposition: 'hostile', talkSuccess: { fr: 'La créature vous fixe, respirant lourdement. Votre voix a déclenché quelque chose — un souvenir du labo, peut-être. Elle hésite. Un instant de répit.', en: '' }, talkFailure: { fr: 'La créature rugit, rejetant toute tentative de communication. Ses yeux sont fixés sur la Dr. Okonkwo derrière vous. C\'est elle qu\'elle veut.', en: '' } },
      ],
      features: [
        { id: 'shuttle_hatch', initialState: 'open', examineResult: { fr: 'L\'écoutille de la navette d\'évacuation. Le système est fonctionnel — la navette peut décoller dès que tout le monde est à bord. Ou dès que vous décidez qui monte.', en: '' } },
        { id: 'acoustic_trap_point', initialState: 'intact', examineResult: { fr: 'Point idéal pour un piège acoustique. La géométrie de la zone concentrerait les ondes sonores comme un amplificateur naturel. Avec l\'émetteur sonique, vous pourriez confiner la créature ici.', en: '' } },
        { id: 'extraction_bay_door', initialState: 'damaged', examineResult: { fr: 'Porte de la baie d\'extraction. Le mécanisme est endommagé mais réparable. De l\'autre côté, la navette attend.', en: '' } },
      ],
      exits: ['escalation', 'resolution'],
    },
    resolution: {
      locationRole: 'hub',
      items: [],
      features: [
        { id: 'shuttle_cockpit', initialState: 'intact', examineResult: { fr: 'Le cockpit de la navette d\'évacuation. Les systèmes sont en ligne, les moteurs prêts pour le décollage. L\'écran principal affiche les coordonnées de retour vers la flotte.', en: '' } },
      ],
      exits: ['boss'],
    },
  },

  additionalDefeatConditions: [
    { type: 'npc_death', npcId: 'dr_okonkwo' },
  ],
};
