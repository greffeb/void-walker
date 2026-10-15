import { MENACE } from './menace';
import type { TextesMonde } from './types';

// Textes des règles des nouveaux morceaux (#105) écrits à la main (C-07) : passerelle, salle des machines, zone sans gravité,
// chambre froide, objet encombrant. Partagés par les mondes : ceux qui n'ont pas ces morceaux ne s'en servent que pour la
// structure commune, les stations de test les racontent tels quels. Ce qui touche à la créature est dans la menace
// (13 §7.2). Texte final non validé.

/** Règles des morceaux sans la créature : socle. */
export const EVENEMENTS_REGLES_MORCEAUX = {
  pont_place: [
    'Vous couchez {le:objet} en travers du vide. Ses deux bouts reposent sur les bords.',
    'Vous poussez {le:objet} au-dessus du vide jusqu’à l’autre bord. Le passage est à peine plus large qu’un pied.',
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
  chute_entendue: [
    'Derrière {le:passage}, un craquement sec, puis le fracas d’une chute dans le noir.',
    'Un bois qui se brise, quelque part derrière {le:passage}, puis plus rien.',
  ],
  bruit_couvert: [
    'Le mécanisme grippé grince, mais le vacarme des machines couvre tout.',
    'Le mécanisme grippé hurle ; vous l’entendez à peine dans le fracas des machines.',
  ],
  chambre_bouclee: [
    'Vous appuyez sur {le:objet}. Un voyant confirme : portes {de:piece} fermées.',
    'Vous enfoncez la commande {de:objet}. Les verrous des portes {de:piece} s’enclenchent.',
  ],
} as const satisfies Partial<TextesMonde['evenements']>;

/** Pour les mondes qui ne sont pas rangés par couches (AR-01, AR-02, monde de test) : règles et créature ensemble. */
export const EVENEMENTS_MORCEAUX = {
  ...EVENEMENTS_REGLES_MORCEAUX,
  pont_cede: MENACE.evenements.pont_cede,
} as const satisfies Partial<TextesMonde['evenements']>;

export const GELURE_FROID = {
  froid: {
    aggravation_blesse: ['Le froid vous mord jusqu’aux os : vous êtes blessé.'],
    aggravation_critique: ['Vos doigts ne répondent plus, le froid vous engourdit : vous êtes grièvement blessé.'],
    defaite: ['Le froid vous gagne tout entier. Vous glissez contre la paroi givrée. Puis plus rien.'],
  },
} as const satisfies Partial<TextesMonde['gelures']>;

export const GELURES: TextesMonde['gelures'] = { ...GELURE_FROID, griffes_froid: MENACE.gelures.griffes_froid };

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

/** Règles des morceaux sans la créature : socle. */
export const OBSERVATION_REGLES_MORCEAUX = {
  pont: '{Le:objet} est posé{e:objet} en travers {de:passage}.',
  pontBrise: '{Le:objet} n’est plus là : au bord {de:passage}, des éclats de bois pendent dans le noir.',
  machinesMarche: 'Les machines tournent dans un vacarme assourdissant : vous n’entendez rien d’autre.',
  machinesArret: 'Les machines sont à l’arrêt.',
  sansGravite: 'Rien ne pèse ici : vous flottez.',
  froid: 'Un froid mordant vous saisit.',
  gouffre: 'Un vide vous sépare {de:vers}.',
} as const satisfies Partial<TextesMonde['observation']>;

/** Pour les mondes qui ne sont pas rangés par couches (AR-01, AR-02, monde de test) : règles et créature ensemble. */
export const OBSERVATION_MORCEAUX = {
  ...OBSERVATION_REGLES_MORCEAUX,
  creatureRalentie: MENACE.observation.creatureRalentie,
  creatureEngourdie: MENACE.observation.creatureEngourdie,
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
  bouclera: 'Les portes {de:piece} seront fermées d’un coup.',
} as const satisfies Partial<TextesMonde['apercu']['savoir']>;
