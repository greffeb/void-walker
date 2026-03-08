// ---------------------------------------------------------------------------
// src/content/microModules/encounter.ts — Encounter micro-modules (10)
// ---------------------------------------------------------------------------
// ~2-3 per skeleton. Encounter modules feature NPCs, hazards,
// or creature ambushes.
// ---------------------------------------------------------------------------

import type { MicroModule } from '../../engine/scenario';

const ls = (fr: string) => ({ fr, en: '' });

/** All encounter micro-modules */
export const ENCOUNTER_MICRO_MODULES: readonly MicroModule[] = [
  // === ESCAPE + INVESTIGATE (4) ===
  {
    id: 'mm_encounter_wounded_survivor',
    type: 'encounter',
    validParentRoles: ['passage', 'quarters', 'hub', 'dead_end'],
    validBeats: ['rising', 'midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_makeshift_barricade', initialState: 'intact', examineResult: ls('Une barricade de fortune faite de meubles empilés.') },
    ],
    npcs: [
      { id: 'mm_wounded_survivor', disposition: 'friendly', examineResult: ls('Un survivant blessé, une compresse sanglante sur l\'épaule. Il semble soulagé de vous voir.') },
    ],
    entryObstacle: {
      type: 'locked_door',
      description: ls('La porte est barricadée de l\'intérieur. Quelqu\'un crie "Partez !" d\'une voix tremblante.'),
      paths: [
        { id: 'talk_survivor', stat: 'CHA', dc: 10, description: ls('Rassurer le survivant pour qu\'il ouvre.'), verbs: ['parler', 'rassurer', 'convaincre'] },
        { id: 'force_barricade', stat: 'FOR', dc: 12, description: ls('Forcer la barricade.'), verbs: ['forcer', 'pousser', 'enfoncer'] },
      ],
    },
    locale: {
      fr: {
        description: 'Un abri de fortune. Un survivant blessé s\'est barricadé ici. Des emballages de rations vides jonchent le sol — il survit depuis un moment.',
        hintText: 'Vous entendez des gémissements derrière une porte barricadée.',
        revisitDescription: 'L\'abri du survivant. Il semble un peu plus calme.',
      },
    },
  },
  {
    id: 'mm_encounter_creature_lair',
    type: 'encounter',
    validParentRoles: ['dead_end', 'hazard_zone', 'storage', 'passage'],
    validBeats: ['escalation', 'climax'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'hidden',
    hiddenDC: 11,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_nest_remains', initialState: 'intact', examineResult: ls('Des restes organiques et des fragments osseux. Quelque chose niche ici.') },
    ],
    creatureAmbush: {
      minThreatLevel: 4,
      confrontationType: 'flee',
      confrontationDC: 13,
      confrontationStat: 'AGI',
      failureConsequence: 'damage',
      damageAmount: 8,
    },
    locale: {
      fr: {
        description: 'Un espace confiné saturé d\'une odeur fétide. Le sol est jonché de restes organiques. Ceci est un nid.',
        hintText: 'Une forte odeur organique émane d\'un passage étroit...',
        revisitDescription: 'Le nid. L\'odeur est toujours aussi atroce.',
        creatureWarningHint: 'Quelque chose grogne dans les ténèbres du passage étroit.',
      },
    },
  },
  {
    id: 'mm_encounter_panicked_crewmember',
    type: 'encounter',
    validParentRoles: ['passage', 'hub', 'quarters', 'control_room'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'passage',
    features: [
      { id: 'mm_dropped_weapon', initialState: 'intact', examineResult: ls('Une arme improvisée — un tuyau métallique taché de sang.') },
    ],
    npcs: [
      { id: 'mm_panicked_crewmember', disposition: 'hostile', examineResult: ls('Un membre d\'équipage aux yeux exorbités. Il brandit un tuyau métallique dans votre direction, les mains tremblantes.') },
    ],
    entryObstacle: {
      type: 'debris',
      description: ls('"RESTEZ OÙ VOUS ÊTES !" Un membre d\'équipage paniqué vous menace avec un tuyau.'),
      paths: [
        { id: 'calm_crewmember', stat: 'CHA', dc: 11, description: ls('Lever les mains et rassurer le marin.'), verbs: ['parler', 'calmer', 'rassurer'] },
        { id: 'dodge_crewmember', stat: 'AGI', dc: 12, description: ls('Esquiver et désarmer le marin.'), verbs: ['esquiver', 'désarmer'] },
      ],
    },
    locale: {
      fr: {
        description: 'Un tronçon de couloir. Un membre d\'équipage paniqué se tient au milieu, brandissant une arme improvisée. Ses yeux sont fous de terreur.',
        hintText: 'Des cris hystériques proviennent d\'un couloir latéral.',
        revisitDescription: 'Le couloir. Le marin s\'est effondré contre le mur, épuisé.',
      },
    },
  },
  {
    id: 'mm_encounter_environmental_trap',
    type: 'encounter',
    validParentRoles: ['passage', 'hazard_zone', 'engineering', 'dead_end'],
    validBeats: ['midpoint', 'escalation', 'climax'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'hazard_zone',
    features: [
      { id: 'mm_leaking_pipes', initialState: 'active', examineResult: ls('Des conduites endommagées laissent échapper un gaz verdâtre. L\'atmosphère est toxique ici.') },
    ],
    entryObstacle: {
      type: 'jammed_panel',
      description: ls('La pièce est envahie d\'un gaz verdâtre. Des conduites endommagées sifflent de façon menaçante.'),
      paths: [
        { id: 'fix_valve', stat: 'INT', dc: 11, description: ls('Identifier et couper la vanne d\'arrêt.'), verbs: ['réparer', 'couper', 'fermer'] },
        { id: 'force_through_gas', stat: 'FOR', dc: 13, description: ls('Retenir son souffle et traverser en force.'), verbs: ['forcer', 'traverser'] },
      ],
    },
    locale: {
      fr: {
        description: 'Un espace envahi par un gaz verdâtre. Des conduites endommagées sifflent, libérant des vapeurs toxiques dans l\'air confiné.',
        hintText: 'Un sifflement et une odeur chimique proviennent d\'un accès latéral.',
        revisitDescription: 'La zone toxique. Le gaz s\'est partiellement dissipé.',
      },
    },
  },

  // === ESCAPE (2) ===
  {
    id: 'mm_encounter_escape_facehugger_nest',
    type: 'encounter',
    validParentRoles: ['storage', 'engineering', 'dead_end', 'hazard_zone'],
    validBeats: ['escalation', 'climax'],
    validSkeletons: ['escape'],
    visibility: 'hidden',
    hiddenDC: 10,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_organic_pods', initialState: 'intact', examineResult: ls('Des cocons organiques translucides. Quelque chose bouge à l\'intérieur.') },
    ],
    items: [{ id: 'mm_acid_sample', examineResult: ls('Un flacon contenant un échantillon d\'acide organique hautement corrosif.') }],
    creatureAmbush: {
      minThreatLevel: 4,
      confrontationType: 'flee',
      confrontationDC: 14,
      confrontationStat: 'AGI',
      failureConsequence: 'status_effect',
    },
    locale: {
      fr: {
        description: 'Un espace envahi par une matière organique pulsante. Des cocons translucides tapissent les murs. Quelque chose bouge à l\'intérieur.',
        hintText: 'Une substance organique suinte d\'un passage condamné...',
        revisitDescription: 'Le nid. Les cocons vides pendent mollement.',
        creatureWarningHint: 'Vous entendez un bruit humide et rythmique derrière la paroi.',
      },
    },
  },
  {
    id: 'mm_encounter_escape_malfunctioning_android',
    type: 'encounter',
    validParentRoles: ['control_room', 'engineering', 'quarters'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'control_room',
    features: [
      { id: 'mm_android_parts', initialState: 'intact', examineResult: ls('Des pièces d\'androïde éparpillées. Du fluide blanc laiteux tache le sol.') },
    ],
    npcs: [
      { id: 'mm_malfunctioning_android', disposition: 'hostile', examineResult: ls('Un androïde à moitié démonté. Sa tête tourne vers vous avec un mouvement saccadé. "Protocole... confinement... actif."') },
    ],
    entryObstacle: {
      type: 'jammed_panel',
      description: ls('Un androïde endommagé bloque le passage. "Zone... restreinte. Personnel... non autorisé."'),
      paths: [
        { id: 'hack_android', stat: 'INT', dc: 12, description: ls('Trouver la séquence de désactivation.'), verbs: ['pirater', 'désactiver', 'hacker'] },
        { id: 'force_android', stat: 'FOR', dc: 14, description: ls('Arracher le panneau de contrôle de l\'androïde.'), verbs: ['forcer', 'arracher', 'détruire'] },
      ],
    },
    locale: {
      fr: {
        description: 'Un poste de contrôle secondaire. Un androïde endommagé se tient debout, la tête penchée à un angle anormal. Du fluide blanc coule de son cou.',
        hintText: 'Des bruits mécaniques saccadés proviennent d\'un poste de contrôle.',
        revisitDescription: 'Le poste de contrôle. L\'androïde est inactif.',
      },
    },
  },

  // === INVESTIGATE (2) ===
  {
    id: 'mm_encounter_investigate_containment_breach',
    type: 'encounter',
    validParentRoles: ['lab', 'server_room', 'hazard_zone'],
    validBeats: ['escalation', 'climax'],
    validSkeletons: ['investigate'],
    visibility: 'hidden',
    hiddenDC: 12,
    locationRole: 'hazard_zone',
    features: [
      { id: 'mm_broken_containment', initialState: 'destroyed', examineResult: ls('Une cellule de confinement fracturée de l\'intérieur. Du verre renforcé brisé jonche le sol.') },
    ],
    creatureAmbush: {
      minThreatLevel: 5,
      confrontationType: 'combat',
      confrontationDC: 13,
      confrontationStat: 'FOR',
      failureConsequence: 'damage',
      damageAmount: 10,
    },
    locale: {
      fr: {
        description: 'Une cellule de confinement éventrée. Le verre renforcé a cédé de l\'intérieur. Des traces de griffures profondes marquent le métal.',
        hintText: 'Du verre brisé craque sous vos pieds. Quelque chose a forcé un mur...',
        revisitDescription: 'La cellule éventrée. Les marques de griffures témoignent de ce qui s\'est passé.',
        creatureWarningHint: 'Un grattement sinistre résonne dans la cellule brisée.',
      },
    },
  },
  {
    id: 'mm_encounter_investigate_lab_hazard',
    type: 'encounter',
    validParentRoles: ['lab', 'engineering', 'storage'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'lab',
    features: [
      { id: 'mm_spilled_chemicals', initialState: 'active', examineResult: ls('Des réactifs chimiques renversés. Le mélange produit des vapeurs corrosives.') },
    ],
    items: [{ id: 'mm_chemical_sample', examineResult: ls('Un flacon hermétique contenant un échantillon chimique instable.') }],
    entryObstacle: {
      type: 'debris',
      description: ls('Un labo dévasté. Des produits chimiques renversés produisent des fumées corrosives.'),
      paths: [
        { id: 'neutralize_chemicals', stat: 'INT', dc: 11, description: ls('Neutraliser la réaction chimique.'), verbs: ['analyser', 'neutraliser', 'réparer'] },
        { id: 'dodge_chemicals', stat: 'AGI', dc: 13, description: ls('Traverser en évitant les flaques corrosives.'), verbs: ['esquiver', 'traverser'] },
      ],
    },
    locale: {
      fr: {
        description: 'Un laboratoire dévasté. Des flacons brisés et des réactifs renversés forment des flaques fumantes au sol.',
        hintText: 'Des vapeurs chimiques s\'échappent d\'un labo adjacent.',
        revisitDescription: 'Le labo dévasté. Les vapeurs se sont dissipées.',
      },
    },
  },

  // === RESCUE (2) ===
  {
    id: 'mm_encounter_rescue_organic_growth',
    type: 'encounter',
    validParentRoles: ['organic_growth', 'passage', 'dead_end', 'crystal_cave'],
    validBeats: ['escalation', 'climax'],
    validSkeletons: ['rescue'],
    visibility: 'hidden',
    hiddenDC: 11,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_pulsating_mass', initialState: 'active', examineResult: ls('Une masse organique pulsante. Elle réagit à votre présence.') },
    ],
    creatureAmbush: {
      minThreatLevel: 4,
      confrontationType: 'hide',
      confrontationDC: 12,
      confrontationStat: 'AGI',
      failureConsequence: 'status_effect',
    },
    locale: {
      fr: {
        description: 'Une cavité organique. Les parois pulsent comme un cœur géant. Des vrilles bioméchaniques ondulent lentement dans l\'air.',
        hintText: 'Les parois organiques semblent s\'épaissir vers un renfoncement...',
        revisitDescription: 'La cavité organique. Les vrilles sont rétractées.',
        creatureWarningHint: 'Les parois organiques frémissent à votre approche.',
      },
    },
  },
  {
    id: 'mm_encounter_rescue_gravity_anomaly',
    type: 'encounter',
    validParentRoles: ['gravity_well', 'passage', 'hub', 'hazard_zone'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['rescue'],
    visibility: 'open',
    locationRole: 'hazard_zone',
    features: [
      { id: 'mm_gravity_distortion', initialState: 'active', examineResult: ls('L\'espace est déformé ici. Des objets flottent de manière erratique.') },
    ],
    entryObstacle: {
      type: 'debris',
      description: ls('La gravité est chaotique dans cette zone. Des débris flottent et changent de direction sans prévenir.'),
      paths: [
        { id: 'navigate_gravity', stat: 'AGI', dc: 12, description: ls('Naviguer entre les débris flottants.'), verbs: ['esquiver', 'naviguer'] },
        { id: 'read_gravity', stat: 'PER', dc: 11, description: ls('Repérer un motif dans les fluctuations.'), verbs: ['observer', 'analyser'] },
      ],
    },
    locale: {
      fr: {
        description: 'Une zone de perturbation gravitationnelle. Des débris flottent en orbite chaotique. Le sol et le plafond semblent interchangeables.',
        hintText: 'Des objets flottent de manière anormale dans un couloir latéral.',
        revisitDescription: 'La zone de gravité instable. Les fluctuations se sont atténuées.',
      },
    },
  },
];
