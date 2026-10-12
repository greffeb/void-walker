import type {
  Cout,
  IdAction,
  NiveauRisque,
  RaisonIndisponibilite,
  RaisonRefus,
  TypeDanger,
  TypeEvenement,
  TypeSavoir,
} from '../../engine';

/** Nom affichable (C-07 NP-02) : genre, nombre et élision pour accorder les phrases. */
export interface Nom {
  readonly texte: string;
  readonly genre: 'm' | 'f';
  readonly nombre: 's' | 'p';
  readonly elision: boolean;
}

/** Variantes écrites à la main d'une même phrase (D-113). */
export type Variantes = readonly [string, ...string[]];

export const TYPES_AGGRAVATION = ['aggravation_blesse', 'aggravation_critique', 'defaite'] as const;
export type TypeAggravation = (typeof TYPES_AGGRAVATION)[number];

/**
 * Événements racontés par `evenements` : l'évacuation a ses textes selon les sources (`evacuations`), l'assistance les siens
 * (`assistance`), hors du récit.
 */
export type TypeRecit = Exclude<TypeEvenement, 'evacuation' | 'assistance'>;

/** Sources d'une évacuation, clé de ses textes : circuit seul, bloc seul, les deux, ou la réserve d'une capsule déjà prête (AR-02). */
export const CLES_EVACUATION = ['circuit', 'bloc', 'circuit_bloc', 'reserve'] as const;
export type CleEvacuation = (typeof CLES_EVACUATION)[number];

export interface TextesMonde {
  readonly noms: Readonly<Record<string, Nom>>;
  /** Description des pièces et objets, par clé de nom, pour « regarder ». */
  readonly descriptions: Readonly<Record<string, Variantes>>;
  readonly evenements: Readonly<Record<TypeRecit, Variantes>>;
  /**
   * Aggravations dues au feu (D-188), à la place des textes de griffes de `evenements` : feu seul, ou griffes et feu dans le
   * même pas (une seule aggravation, causes conservées, C-04 §3).
   */
  readonly brulures: Readonly<Record<'feu' | 'griffes_feu', Readonly<Record<TypeAggravation, Variantes>>>>;
  /** Défaite par le vide, sans combinaison dans une pièce sans air (C-04 §3.1), à la place des autres textes de défaite. */
  readonly asphyxie: Variantes;
  /** Départ de la capsule, selon ce qui l'alimentait. */
  readonly evacuations: Readonly<Record<CleEvacuation, Variantes>>;
  /** Messages de l'IA de la station, par identifiant de message du monde : une phrase écrite à la main, sans trou. */
  readonly assistance: Readonly<Record<string, string>>;
  readonly passages: {
    readonly ouvert: Variantes;
    readonly ferme: Variantes;
    /** Passage dont la destination n'est pas connue (C-06 §3, K-05). */
    readonly ouvertSansDestination: Variantes;
    readonly fermeSansDestination: Variantes;
    /** Ajouté au regard d'une porte étanche dont le voyant dit qu'il n'y a plus d'air de l'autre côté (VP-03). */
    readonly voyantVide: string;
  };
  readonly refus: Readonly<Record<RaisonRefus, string>>;
  readonly indisponibilites: Readonly<Record<RaisonIndisponibilite, string>>;
  readonly libelles: Readonly<Record<IdAction, string>>;
  /** Libellé d'« aller » par un passage dont la destination n'est pas connue : nommé par le passage seul. */
  readonly allerSansDestination: string;
  /** Verbe seul, sans trou : options d'une puce et rappel de la dernière action (« > Carnet · Prendre »). */
  readonly verbes: Readonly<Record<IdAction, string>>;
  readonly observation: {
    readonly lieu: string;
    readonly objets: string;
    readonly aucunObjet: string;
    readonly passageOuvert: string;
    readonly passageFerme: string;
    /** Passage ouvert sur une pièce en feu (C-03 §5.3). */
    readonly passageEnFeu: string;
    /** Sol huilé au pied d'un passage, de ce côté (D-190). */
    readonly huile: string;
    /** Objet posé à une position de la pièce (C-02 §2). */
    readonly placement: string;
    /** Objet installé dans une capsule de la pièce. */
    readonly installe: string;
    /** Console de la pièce dont le circuit est activé. */
    readonly active: string;
    /** La pièce du passager est en feu. */
    readonly feu: string;
    /** La pièce du passager n'a plus d'air (C-03 §5.4). */
    readonly sansAir: string;
    /** Voyant d'une porte étanche : plus d'air de l'autre côté (VP-03). */
    readonly passageVide: string;
    /** Combinaison enfilée (D-060). */
    readonly enfilee: string;
    /** Vitrage extérieur percé, ou rebouché, dans la pièce. */
    readonly percee: string;
    readonly rebouchee: string;
    /** Le corps inerte de la créature est dans la pièce (D-062). */
    readonly creatureInerte: string;
    readonly inventaire: string;
    readonly inventaireVide: string;
    /** La créature est dans la pièce, vue par le passager (C-06 §2). */
    readonly creature: string;
    /** La créature, vue à terre après une glissade (C-03 §5.2). */
    readonly creatureATerre: string;
    /** Santé (C-04 §2) ; rien quand il est indemne (12 §3). */
    readonly blesse: string;
    readonly critique: string;
    /** Partie conclue par la défaite (D-013). */
    readonly terminee: string;
    /** Partie conclue par le départ de la capsule. */
    readonly evacuee: string;
    /** Récit court de l'écran de fin après un abandon (12 §4.11), dans la pièce où le passager s'est arrêté. */
    readonly abandon: string;
    /** Repères de moment des messages d'IA Station, sans heure (12 §3.9) : au réveil, à l'arrivée dans une pièce, au départ. */
    readonly momentReveil: string;
    readonly momentArrivee: string;
    readonly momentEvacuation: string;
  };
  /** Aperçu avant confirmation (12 §3.8) : mots du risque, du danger connu et du coût, sans chiffre ; une phrase par chose sue. */
  readonly apercu: {
    readonly risques: Readonly<Record<NiveauRisque, string>>;
    /** Suit le niveau sur la ligne RISQUE (« élevé — … ») : en minuscule, sans point final. */
    readonly dangers: Readonly<Record<TypeDanger, string>>;
    readonly couts: Readonly<Record<Cout, string>>;
    readonly savoir: Readonly<Record<TypeSavoir, string>>;
  };
}

/** Rôles que chaque gabarit peut remplir ; tout autre trou est une erreur (C-07 N-03). */
export const ROLES_EVENEMENT: Readonly<Record<TypeRecit, readonly string[]>> = {
  reveil: ['piece'],
  objet_pris: ['objet', 'piece'],
  objet_pose: ['objet', 'piece'],
  passage_ouvert: ['passage'],
  passage_ferme: ['passage'],
  deplacement: ['passage', 'piece'],
  piece_decouverte: ['piece'],
  bruit_mecanisme: ['passage'],
  bruit_creature: ['passage'],
  creature_entre: ['passage'],
  premier_contact: [],
  menace: [],
  aggravation_blesse: [],
  aggravation_critique: [],
  defaite: [],
  soin_indemne: ['objet'],
  soin_blesse: ['objet'],
  objet_deplace: ['objet', 'position'],
  feu_derriere: ['passage'],
  feu_gagne: ['piece'],
  feu_eteint: ['piece'],
  huile_versee: ['objet', 'passage'],
  creature_glisse: ['passage'],
  alarme_declenchee: ['objet'],
  circuit_active: ['objet'],
  objet_installe: ['objet', 'capsule'],
  // `passage` : le passage sans sa destination ; `vers` : la destination qu'il révèle (NP-04).
  passage_decouvert: ['passage', 'vers'],
  combinaison_enfilee: ['objet'],
  combinaison_retiree: ['objet'],
  breche_ouverte: ['objet'],
  breche_rebouchee: ['objet'],
  // `pieces` : liste des pièces dont l'air change, nommées ensemble.
  air_perdu: ['pieces'],
  air_revenu: ['pieces'],
  creature_expulsee: [],
  creature_inerte: [],
};

export const ROLES_LIBELLE: Readonly<Record<IdAction, readonly string[]>> = {
  regarder: ['cible'],
  prendre: ['cible'],
  poser: ['cible'],
  ouvrir: ['cible', 'vers'],
  fermer: ['cible', 'vers'],
  aller: ['cible', 'vers'],
  soigner: ['cible'],
  deplacer: ['cible', 'position'],
  arroser: ['cible', 'piece'],
  verser: ['cible', 'passage'],
  declencher: ['cible'],
  activer: ['cible'],
  installer: ['cible'],
  lancer: ['cible'],
  enfiler: ['cible'],
  retirer: ['cible'],
  percer: ['cible'],
  reboucher: ['cible'],
};

export const ROLES_ALLER_SANS_DESTINATION = ['cible'] as const;
export const ROLES_PASSAGE = ['passage', 'vers'] as const;
export const ROLES_PASSAGE_SANS_DESTINATION = ['passage'] as const;
export const ROLES_INDISPONIBILITE = ['cible'] as const;

export const ROLES_SAVOIR: Readonly<Record<TypeSavoir, readonly string[]>> = {
  portera: ['objet'],
  laissera: ['objet', 'piece'],
  ouvrira: ['passage'],
  fermera: ['passage'],
  quittera: ['piece'],
  soignera: [],
  videra: ['objet'],
  deplacera: ['objet', 'position'],
  eteindra: ['piece'],
  huilera: ['passage'],
  sonnera: ['piece'],
  alimentera: ['objet'],
  installera: ['objet', 'capsule'],
  partira: [],
  protegera: ['objet'],
  gardera: ['objet'],
  percera: ['objet'],
  rebouchera: ['objet'],
  perdront_air: ['pieces'],
  retrouveront_air: ['pieces'],
};

export const ROLES_DANGER: Readonly<Record<TypeDanger, readonly string[]>> = {
  interception: [],
  interception_mortelle: [],
  creature_vue_instant: ['piece'],
  creature_vue_moment: ['piece'],
  creature_vue_longtemps: ['piece'],
  creature_entendue: ['passage'],
  brulure: [],
  brulure_mortelle: [],
  asphyxie: [],
};

export const ROLES_OBSERVATION: Readonly<Record<keyof TextesMonde['observation'], readonly string[]>> = {
  lieu: ['piece'],
  objets: ['liste'],
  aucunObjet: [],
  passageOuvert: ['passage'],
  passageFerme: ['passage'],
  passageEnFeu: ['passage'],
  huile: ['passage'],
  placement: ['objet', 'position'],
  installe: ['objet', 'capsule'],
  active: ['objet'],
  feu: [],
  sansAir: [],
  passageVide: ['passage'],
  enfilee: ['objet'],
  percee: ['objet'],
  rebouchee: ['objet'],
  creatureInerte: [],
  inventaire: ['liste'],
  inventaireVide: [],
  creature: [],
  creatureATerre: [],
  blesse: [],
  critique: [],
  terminee: [],
  evacuee: [],
  abandon: ['piece'],
  momentReveil: ['piece'],
  momentArrivee: ['piece'],
  momentEvacuation: [],
};
