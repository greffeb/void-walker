import type { TextesMonde } from './types';

// Textes des règles des nouveaux morceaux (#105) écrits à la main (C-07) : passerelle, salle des machines, zone sans gravité,
// chambre froide, objet encombrant. Partagés par les mondes : ceux qui n'ont pas ces morceaux ne s'en servent que pour la
// structure commune, les stations de test les racontent tels quels. Texte final non validé.


export const EVENEMENTS_MORCEAUX = {
  pont_place: [
    'Vous couchez {le:objet} en travers du vide. Ses deux bouts reposent sur les bords.',
    'Vous poussez {le:objet} au-dessus du vide jusqu’à l’autre bord. Le passage est à peine plus large qu’un pied.',
  ],
  pont_cede: [
    'Un craquement sec : {le:objet} cède sous un poids énorme, et quelque chose bascule dans le vide.',
    '{Le:objet} se brise avec un claquement de bois mort ; une masse lourde tombe dans le noir, sans un cri.',
  ],
  derive: [
    'Vous poussez sur la paroi et dérivez lentement jusqu’à {le:passage}. Vous vous agrippez à son cadre.',
    'D’une poussée, vous flottez jusqu’à {le:passage}. Vos doigts se referment sur la poignée.',
  ],
  machines_arretees: [
    'Vous basculez {le:objet}. Les machines ralentissent, toussent, puis se taisent.',
    'Vous abaissez {le:objet}. Le vacarme retombe ; un silence épais emplit la salle.',
  ],
  machines_relancees: [
    'Vous relevez {le:objet}. Les machines repartent dans un fracas qui fait trembler les parois.',
    'Vous basculez {le:objet}. Un rugissement de métal emplit la salle et porte loin.',
  ],
  gravite_coupee: [
    'Un déclic : la gravité se coupe dans {le:piece}. Au-delà du seuil, la poussière se met à flotter.',
    'La gravité cesse dans {le:piece}. Un gobelet oublié s’élève lentement du sol.',
  ],
  gravite_retablie: [
    'Un déclic : la gravité revient dans {le:piece}. Ce qui flottait retombe d’un coup.',
    'La gravité revient dans {le:piece}. La poussière s’abat sur le sol.',
  ],
  bruit_couvert: [
    'Le mécanisme grippé grince, mais le vacarme des machines couvre tout.',
    'Le mécanisme grippé hurle ; vous l’entendez à peine dans le fracas des machines.',
  ],
  chambre_bouclee: [
    'Vous appuyez sur {le:objet}. Les portes {de:piece} claquent l’une après l’autre.',
    'Vous enfoncez la commande {de:objet}. Les portes {de:piece} se ferment d’un coup.',
  ],
} as const satisfies Partial<TextesMonde['evenements']>;

export const GELURES: TextesMonde['gelures'] = {
  froid: {
    aggravation_blesse: ['Le froid vous mord jusqu’aux os : vous êtes blessé.'],
    aggravation_critique: ['Vos doigts ne répondent plus, le froid vous engourdit : vous êtes grièvement blessé.'],
    defaite: ['Le froid vous gagne tout entier. Vous glissez contre la paroi givrée. Puis plus rien.'],
  },
  griffes_froid: {
    aggravation_blesse: ['Des griffes, et ce froid qui mord : vous êtes blessé.'],
    aggravation_critique: ['Griffé, transi, vous tenez à peine debout : vous êtes grièvement blessé.'],
    defaite: ['Les griffes vous jettent sur le sol givré. Vous ne vous relevez pas.'],
  },
};

export const REFUS_MORCEAUX = {
  encombre: 'Vous portez déjà un objet encombrant : rien n’a été joué.',
  sans_pont: 'Rien ne permet de franchir ce vide : rien n’a été joué.',
  trop_loin: 'Vous flottez trop loin de ce passage : rien n’a été joué.',
  sans_gravite: 'Sans gravité, rien ne se verse : rien n’a été joué.',
  deja_fait: 'C’est déjà fait : rien n’a été joué.',
} as const satisfies Partial<TextesMonde['refus']>;

export const INDISPONIBILITES_MORCEAUX = {
  encombre: 'Vous avez déjà les bras pris par un objet encombrant.',
  sans_pont: 'Il faut de quoi franchir {le:cible}.',
  trop_loin: 'Sans gravité, il faut d’abord dériver jusqu’à {le:cible}.',
  sans_gravite: 'Sans gravité, {le:cible} ne se verse pas.',
} as const satisfies Partial<TextesMonde['indisponibilites']>;

export const LIBELLES_MORCEAUX = {
  placer: 'Poser {le:cible} en travers {de:passage}',
  deriver: 'Dériver jusqu’à {le:cible}',
  arreter: 'Arrêter les machines',
  relancer: 'Relancer les machines',
  couper: 'Couper la gravité',
  retablir: 'Rétablir la gravité',
  boucler: 'Fermer la chambre depuis {le:cible}',
} as const satisfies Partial<TextesMonde['libelles']>;

export const VERBES_MORCEAUX = {
  placer: 'Poser en travers',
  deriver: 'Dériver',
  arreter: 'Arrêter',
  relancer: 'Relancer',
  couper: 'Couper',
  retablir: 'Rétablir',
  boucler: 'Fermer la chambre',
} as const satisfies Partial<TextesMonde['verbes']>;

export const OBSERVATION_MORCEAUX = {
  creatureRalentie: 'Le givre la couvre ; elle bouge avec lenteur.',
  pont: '{Le:objet} est posé{e:objet} en travers {de:passage}.',
  machinesMarche: 'Les machines tournent dans un vacarme assourdissant : vous n’entendez rien d’autre.',
  machinesArret: 'Les machines sont à l’arrêt.',
  sansGravite: 'Rien ne pèse ici : vous flottez.',
  froid: 'Un froid mordant vous saisit.',
  gouffre: 'Un vide vous sépare {de:vers}.',
} as const satisfies Partial<TextesMonde['observation']>;

/** Regard sur le vide d'une passerelle effondrée (D-164). */
export const PASSAGE_GOUFFRE: TextesMonde['passages']['gouffre'] = [
  'Un vide noir coupe la salle en deux. De l’autre côté, {le:vers}.',
  'Le sol s’arrête net au-dessus du noir. En face, {le:vers}, hors d’atteinte sans quelque chose pour passer.',
];

export const DANGERS_MORCEAUX = {
  froid: 'le froid vous blessera',
  froid_mortel: 'le froid vous blessera, et vous n’y survivrez pas',
} as const satisfies Partial<TextesMonde['apercu']['dangers']>;

export const SAVOIR_MORCEAUX = {
  placera: '{Le:objet} sera posé{e:objet} en travers {de:passage} : on pourra passer.',
  derivera: 'Vous dériverez jusqu’à {le:passage} ; le franchir demandera une action de plus.',
  arreteront: 'Les machines s’arrêteront ; le silence reviendra.',
  relanceront: 'Les machines repartiront dans un grand bruit, qui portera loin.',
  coupera: 'La gravité sera coupée dans {le:piece}.',
  retablira: 'La gravité reviendra dans {le:piece}.',
  bouclera: 'Les portes {de:piece} se fermeront d’un coup.',
} as const satisfies Partial<TextesMonde['apercu']['savoir']>;
