// ---------------------------------------------------------------------------
// src/content/microModules/ambiance.ts — Ambiance micro-modules (12)
// ---------------------------------------------------------------------------
// ~3 per skeleton. Pure atmosphere — no items, no obstacles,
// no NPCs. Just evocative dead-end rooms.
// ---------------------------------------------------------------------------

import type { MicroModule } from '../../engine/scenario';

const ls = (fr: string) => ({ fr, en: '' });

/** All ambiance micro-modules */
export const AMBIANCE_MICRO_MODULES: readonly MicroModule[] = [
  // === ESCAPE + INVESTIGATE (4) ===
  {
    id: 'mm_ambiance_observation_window',
    type: 'ambiance',
    validParentRoles: ['hub', 'control_room', 'passage', 'quarters'],
    validBeats: ['intro', 'rising', 'midpoint'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_viewport', initialState: 'intact', examineResult: ls('Une grande baie d\'observation. L\'immensité de l\'espace s\'étend devant vous, indifférente.') },
    ],
    locale: {
      fr: {
        description: 'Une alcôve d\'observation avec une large baie vitrée. L\'espace infini s\'étend au dehors, parsemé d\'étoiles froides et distantes.',
        hintText: 'La lumière des étoiles filtre par une baie d\'observation.',
        revisitDescription: 'L\'alcôve d\'observation. Les étoiles n\'ont pas bougé.',
      },
    },
  },
  {
    id: 'mm_ambiance_abandoned_meal',
    type: 'ambiance',
    validParentRoles: ['quarters', 'hub', 'passage'],
    validBeats: ['intro', 'rising'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'quarters',
    features: [
      { id: 'mm_cold_food', initialState: 'intact', examineResult: ls('Un plateau-repas à moitié entamé. La nourriture a séché depuis longtemps. Deux chaises, une seule personne est partie.') },
    ],
    locale: {
      fr: {
        description: 'Un coin repas. Un plateau est posé sur la table, le café encore dans la tasse — froid depuis longtemps. Quelqu\'un est parti au milieu de son repas et n\'est jamais revenu.',
        hintText: 'L\'odeur de nourriture rance provient d\'un coin repas.',
        revisitDescription: 'Le coin repas abandonné. Rien n\'a changé.',
      },
    },
  },
  {
    id: 'mm_ambiance_flickering_lights',
    type: 'ambiance',
    validParentRoles: ['passage', 'dead_end', 'hub', 'hazard_zone'],
    validBeats: ['rising', 'midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_sparking_panel', initialState: 'damaged', examineResult: ls('Un panneau électrique endommagé crépite. Les lumières clignotent au rythme des courts-circuits.') },
    ],
    locale: {
      fr: {
        description: 'Un tronçon de couloir où les lumières agonisent. Chaque clignotement projette des ombres dansantes sur les murs. Le panneau électrique émet des étincelles bleues à intervalles irréguliers.',
        hintText: 'Des lumières clignotent de façon erratique dans un couloir.',
        revisitDescription: 'Le couloir aux lumières mourantes. Elles clignotent toujours.',
      },
    },
  },
  {
    id: 'mm_ambiance_memorial_wall',
    type: 'ambiance',
    validParentRoles: ['hub', 'passage', 'quarters', 'control_room'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_memorial_photos', initialState: 'intact', examineResult: ls('Des photos d\'équipage, des messages d\'adieu, des bougies éteintes. Un mémorial improvisé.') },
    ],
    locale: {
      fr: {
        description: 'Un mur transformé en mémorial de fortune. Des photos d\'équipage, des messages griffonnés et des bougies éteintes. Quelqu\'un a pris le temps d\'honorer les morts.',
        hintText: 'Des bougies éteintes et des photos sont disposées sur un mur.',
        revisitDescription: 'Le mémorial. Les visages des disparus vous regardent en silence.',
      },
    },
  },

  // === ESCAPE (3) ===
  {
    id: 'mm_ambiance_escape_airlock_view',
    type: 'ambiance',
    validParentRoles: ['airlock', 'passage', 'engineering'],
    validBeats: ['rising', 'escalation'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_space_view', initialState: 'intact', examineResult: ls('Le sas donne sur un morceau de coque arrachée. L\'espace flotte, indifférent, au-delà.') },
    ],
    locale: {
      fr: {
        description: 'Un sas d\'observation donne sur une section de coque arrachée. Des débris flottent lentement dans le vide. L\'un d\'eux ressemble à un corps en combinaison.',
        hintText: 'Un sas donne sur le vide spatial et des débris flottants.',
        revisitDescription: 'Le sas d\'observation. Les débris ont dérivé un peu plus loin.',
      },
    },
  },
  {
    id: 'mm_ambiance_escape_cryopod_room',
    type: 'ambiance',
    validParentRoles: ['medical', 'quarters', 'storage'],
    validBeats: ['intro', 'rising', 'midpoint'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'medical',
    features: [
      { id: 'mm_empty_cryopods', initialState: 'intact', examineResult: ls('Douze cryopods. Tous ouverts. Tous vides. Les procédures de réveil ont été déclenchées d\'un coup.') },
    ],
    locale: {
      fr: {
        description: 'Une salle de cryogénie. Les douze pods sont ouverts, le givre encore visible sur les parois internes. Réveil d\'urgence — tout le monde est parti en même temps.',
        hintText: 'De la condensation s\'échappe d\'une salle de cryogénie.',
        revisitDescription: 'La salle de cryogénie. Le givre a fondu.',
      },
    },
  },
  {
    id: 'mm_ambiance_escape_cat_collar',
    type: 'ambiance',
    validParentRoles: ['quarters', 'passage', 'hub'],
    validBeats: ['intro', 'rising'],
    validSkeletons: ['escape'],
    visibility: 'hidden',
    hiddenDC: 10,
    locationRole: 'quarters',
    features: [
      { id: 'mm_pet_collar', initialState: 'intact', examineResult: ls('Un collier de chat avec une médaille gravée "Jonesy". Le collier est intact, mais pas de chat en vue.') },
    ],
    locale: {
      fr: {
        description: 'Un recoin sous une couchette. Un petit collier de chat gît sur le sol, à côté d\'un bol d\'eau vide. La médaille est gravée d\'un nom.',
        hintText: 'Vous entendez un miaulement étouffé... ou était-ce votre imagination ?',
        revisitDescription: 'Le coin du chat disparu. Le bol est toujours vide.',
      },
    },
  },

  // === INVESTIGATE (3) ===
  {
    id: 'mm_ambiance_investigate_test_chamber',
    type: 'ambiance',
    validParentRoles: ['lab', 'hazard_zone', 'server_room'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'lab',
    features: [
      { id: 'mm_empty_cage', initialState: 'destroyed', examineResult: ls('Une cage en acier renforcé, ouverte de l\'intérieur. Les barreaux sont pliés vers l\'extérieur.') },
    ],
    locale: {
      fr: {
        description: 'Une chambre de test. Une cage en acier renforcé a été forcée de l\'intérieur — les barreaux pliés comme du papier. Au sol, des marques de griffes profondes mènent vers le conduit de ventilation.',
        hintText: 'Un accès vers une chambre de test au silence oppressant.',
        revisitDescription: 'La chambre de test. La cage ouverte est un rappel silencieux.',
      },
    },
  },
  {
    id: 'mm_ambiance_investigate_specimen_jars',
    type: 'ambiance',
    validParentRoles: ['lab', 'storage', 'medical'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'storage',
    features: [
      { id: 'mm_specimen_collection', initialState: 'intact', examineResult: ls('Des dizaines de bocaux contenant des spécimens biologiques. Certains ont des formes presque humaines.') },
    ],
    locale: {
      fr: {
        description: 'Un laboratoire de stockage. Des étagères de bocaux contiennent des spécimens flottant dans du formol. Certains semblent vous regarder. L\'un d\'eux est brisé, son contenu absent.',
        hintText: 'Une lumière verdâtre filtre d\'un laboratoire de stockage.',
        revisitDescription: 'Le laboratoire aux spécimens. L\'un des bocaux semble avoir légèrement changé de position.',
      },
    },
  },
  {
    id: 'mm_ambiance_investigate_quarantine',
    type: 'ambiance',
    validParentRoles: ['medical', 'lab', 'passage'],
    validBeats: ['escalation'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'medical',
    features: [
      { id: 'mm_quarantine_sign', initialState: 'intact', examineResult: ls('Un panneau "QUARANTAINE - NIVEAU 4". Le sas est grand ouvert. La quarantaine n\'a pas tenu.') },
    ],
    locale: {
      fr: {
        description: 'Une zone de quarantaine violée. Le sas hermétique est grand ouvert, les voyants passés au rouge. Des combinaisons de protection déchirées gisent au sol.',
        hintText: 'Un voyant rouge de quarantaine clignote près d\'un sas.',
        revisitDescription: 'La quarantaine violée. Le sas reste ouvert, le danger dispersé.',
      },
    },
  },

  // === RESCUE (2) ===
  {
    id: 'mm_ambiance_rescue_crystal_garden',
    type: 'ambiance',
    validParentRoles: ['crystal_cave', 'organic_growth', 'passage'],
    validBeats: ['intro', 'rising', 'midpoint'],
    validSkeletons: ['rescue'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_crystal_formations', initialState: 'intact', examineResult: ls('Des cristaux aux reflets irisés poussent du sol et des murs. Ils émettent un bourdonnement à peine audible.') },
    ],
    locale: {
      fr: {
        description: 'Un jardin de cristaux naturels. Des formations minérales irisées émergent du sol, projetant des arcs-en-ciel sur les parois. L\'air vibre d\'un bourdonnement harmonique — presque apaisant.',
        hintText: 'Des reflets irisés dansent sur les murs depuis une cavité.',
        revisitDescription: 'Le jardin de cristaux. Le bourdonnement harmonique n\'a pas changé.',
      },
    },
  },
  {
    id: 'mm_ambiance_rescue_organic_cocoon',
    type: 'ambiance',
    validParentRoles: ['organic_growth', 'passage', 'dead_end', 'ritual_chamber'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['rescue'],
    visibility: 'hidden',
    hiddenDC: 11,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_bio_cocoon', initialState: 'intact', examineResult: ls('Un cocon biomécanique translucide. À l\'intérieur, une silhouette humanoïde figée dans une pose de sommeil.') },
    ],
    locale: {
      fr: {
        description: 'Un renfoncement organique. Un cocon translucide est suspendu au plafond. À travers la membrane, vous distinguez une silhouette humanoïde immobile — en hibernation ou en transformation.',
        hintText: 'Un murmure biologique s\'échappe d\'un renfoncement dans la paroi.',
        revisitDescription: 'Le cocon. La silhouette à l\'intérieur semble avoir bougé imperceptiblement.',
      },
    },
  },
];
