// ---------------------------------------------------------------------------
// src/content/microModules/loot.ts — Loot micro-modules (12)
// ---------------------------------------------------------------------------
// ~3 per skeleton. Items proportional to beat.
// ---------------------------------------------------------------------------

import type { MicroModule } from '../../engine/scenario';

const ls = (fr: string) => ({ fr, en: '' });

/** All loot micro-modules */
export const LOOT_MICRO_MODULES: readonly MicroModule[] = [
  // === ESCAPE + INVESTIGATE (5) ===
  {
    id: 'mm_loot_emergency_kit',
    type: 'loot',
    validParentRoles: ['passage', 'control_room', 'hub', 'quarters', 'medical'],
    validBeats: ['intro', 'rising'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'storage',
    features: [
      { id: 'mm_emergency_locker', initialState: 'closed', examineResult: ls('Un casier d\'urgence standard. Le scellé est intact.') },
    ],
    items: [{ id: 'medkit_basic' }],
    entryObstacle: null,
    locale: {
      fr: {
        description: 'Un petit local technique avec un casier d\'urgence au mur. La peinture jaune du marquage de sécurité est à peine visible.',
        hintText: 'Une porte de service avec un marquage d\'urgence jaune.',
        revisitDescription: 'Le local technique. Le casier d\'urgence est ouvert.',
      },
    },
  },
  {
    id: 'mm_loot_corpse_stash',
    type: 'loot',
    validParentRoles: ['passage', 'dead_end', 'quarters', 'hub'],
    validBeats: ['rising', 'midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'dead_end',
    features: [
      { id: 'mm_corpse', initialState: 'intact', examineResult: ls('Un cadavre en combinaison. Les poches contiennent peut-être quelque chose d\'utile.') },
    ],
    items: [{ id: 'pry_bar' }],
    locale: {
      fr: {
        description: 'Un cul-de-sac sombre. Un corps est affalé contre le mur, sa combinaison déchirée. Il serre encore un pied-de-biche dans sa main crispée.',
        hintText: 'Une alcôve sombre. Une odeur métallique en provient.',
        revisitDescription: 'Le cul-de-sac avec le cadavre. Vous avez déjà fouillé les lieux.',
      },
    },
  },
  {
    id: 'mm_loot_locked_cabinet',
    type: 'loot',
    validParentRoles: ['control_room', 'medical', 'engineering', 'storage'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'storage',
    features: [
      { id: 'mm_cabinet', initialState: 'locked', examineResult: ls('Une armoire blindée avec un verrou électronique. Le panneau clignote faiblement.') },
    ],
    items: [{ id: 'repair_kit' }],
    entryObstacle: {
      type: 'locked_door',
      paths: [
        { id: 'hack_cabinet', stat: 'INT', dc: 11, description: ls('Pirater le verrou électronique'), verbs: ['pirater', 'hacker'] },
        { id: 'force_cabinet', stat: 'FOR', dc: 13, description: ls('Forcer l\'armoire avec la force brute'), verbs: ['forcer', 'casser'] },
      ],
      description: ls('L\'armoire est verrouillée par un système électronique.'),
    },
    locale: {
      fr: {
        description: 'Un réduit de stockage. Une armoire blindée occupe tout un mur, son verrou électronique clignote en rouge.',
        hintText: 'Une porte menant à un local de stockage.',
        revisitDescription: 'Le réduit avec l\'armoire blindée, maintenant ouverte.',
      },
    },
  },
  {
    id: 'mm_loot_hidden_compartment',
    type: 'loot',
    validParentRoles: ['quarters', 'control_room', 'passage', 'hub'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'hidden',
    hiddenDC: 13,
    locationRole: 'dead_end',
    features: [
      { id: 'mm_hidden_panel', initialState: 'closed', examineResult: ls('Un panneau de maintenance dissimulé. Derrière, un espace étroit.') },
    ],
    items: [{ id: 'stimulant' }],
    locale: {
      fr: {
        description: 'Un minuscule espace derrière un faux panneau. Quelqu\'un y a caché des provisions d\'urgence.',
        hintText: 'Vous remarquez un panneau de maintenance mal fixé...',
        revisitDescription: 'Le compartiment secret. Les provisions ont été prises.',
      },
    },
  },
  {
    id: 'mm_loot_supply_cache',
    type: 'loot',
    validParentRoles: ['storage', 'engineering', 'hub', 'passage'],
    validBeats: ['intro', 'rising', 'midpoint'],
    validSkeletons: ['escape', 'investigate'],
    visibility: 'open',
    locationRole: 'storage',
    features: [
      { id: 'mm_supply_shelf', initialState: 'intact', examineResult: ls('Des étagères de fournitures. La plupart sont vides ou renversées.') },
    ],
    items: [{ id: 'duct_tape' }],
    locale: {
      fr: {
        description: 'Un petit entrepôt de fournitures. Les étagères sont en désordre, mais certains articles semblent encore utilisables.',
        hintText: 'Une porte ouverte menant à un local de stockage.',
        revisitDescription: 'L\'entrepôt de fournitures. Les étagères sont presque vides.',
      },
    },
  },

  // === ESCAPE SKELETON (3) ===
  {
    id: 'mm_loot_escape_toolbox',
    type: 'loot',
    validParentRoles: ['engineering', 'storage', 'passage'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['escape'],
    visibility: 'open',
    locationRole: 'engineering',
    features: [
      { id: 'mm_toolbox', initialState: 'closed', examineResult: ls('Une boîte à outils de maintenance de bord. Certains outils ont disparu.') },
    ],
    items: [{ id: 'welder' }],
    entryObstacle: {
      type: 'debris',
      paths: [
        { id: 'clear_debris', stat: 'FOR', dc: 10, description: ls('Dégager les débris qui bloquent l\'accès'), verbs: ['dégager', 'pousser'] },
        { id: 'squeeze_through', stat: 'AGI', dc: 11, description: ls('Se faufiler entre les débris'), verbs: ['faufiler', 'ramper'] },
      ],
      description: ls('Des débris encombrent l\'entrée de cette section.'),
    },
    locale: {
      fr: {
        description: 'Un atelier de maintenance encombré de débris. Une boîte à outils rouge est encore fixée au mur.',
        hintText: 'Un accès obstrué par des débris vers un atelier.',
        revisitDescription: 'L\'atelier de maintenance. La boîte à outils est ouverte.',
      },
    },
  },
  {
    id: 'mm_loot_escape_eva_suit',
    type: 'loot',
    validParentRoles: ['airlock', 'storage', 'quarters'],
    validBeats: ['midpoint', 'escalation'],
    validSkeletons: ['escape'],
    visibility: 'hidden',
    hiddenDC: 12,
    locationRole: 'storage',
    features: [
      { id: 'mm_suit_locker', initialState: 'intact', examineResult: ls('Un casier de combinaisons EVA. Un seul semble encore fonctionnel.') },
    ],
    items: [{ id: 'space_suit' }],
    locale: {
      fr: {
        description: 'Un vestiaire EVA oublié. Les casiers sont pour la plupart vides, sauf un dont le voyant vert indique une combinaison opérationnelle.',
        hintText: 'Vous remarquez un passage vers un vestiaire EVA...',
        revisitDescription: 'Le vestiaire EVA. Le casier fonctionnel est ouvert.',
      },
    },
  },

  // === INVESTIGATE SKELETON (2) ===
  {
    id: 'mm_loot_investigate_scanner',
    type: 'loot',
    validParentRoles: ['lab', 'server_room', 'medical', 'control_room'],
    validBeats: ['rising', 'midpoint'],
    validSkeletons: ['investigate'],
    visibility: 'open',
    locationRole: 'lab',
    features: [
      { id: 'mm_research_desk', initialState: 'intact', examineResult: ls('Un bureau de recherche couvert de notes. Un scanner portable est posé dessus.') },
    ],
    items: [{ id: 'scanner' }],
    locale: {
      fr: {
        description: 'Un bureau de recherche annexe. Des notes éparpillées et un scanner portable encore sous tension.',
        hintText: 'Un accès vers un bureau de recherche.',
        revisitDescription: 'Le bureau de recherche. Le scanner a été récupéré.',
      },
    },
  },
  {
    id: 'mm_loot_investigate_keycard',
    type: 'loot',
    validParentRoles: ['quarters', 'control_room', 'hub'],
    validBeats: ['intro', 'rising'],
    validSkeletons: ['investigate'],
    visibility: 'hidden',
    hiddenDC: 11,
    locationRole: 'quarters',
    features: [
      { id: 'mm_desk_drawer', initialState: 'closed', examineResult: ls('Un tiroir de bureau. Un badge d\'accès est coincé sous des papiers.') },
    ],
    items: [{ id: 'keycard' }],
    locale: {
      fr: {
        description: 'Un petit bureau personnel. Les effets personnels sont éparpillés, comme si le propriétaire était parti en hâte.',
        hintText: 'Vous apercevez l\'entrée d\'un bureau...',
        revisitDescription: 'Le bureau personnel. Vous avez déjà fouillé le tiroir.',
      },
    },
  },
];
