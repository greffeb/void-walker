import type {
  Cout,
  EntenduRecit,
  IntensiteTrace,
  IdAction,
  Issue,
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
 * (`assistance`), hors du récit ; l'écoute dit ce qu'elle entend selon `ecoute`.
 */
export type TypeRecit = Exclude<TypeEvenement, 'evacuation' | 'assistance' | 'ecoute'>;

/** Sources d'une évacuation, clé de ses textes : circuit seul, bloc seul, les deux, ou la réserve d'une capsule déjà prête (AR-02). */
export const CLES_EVACUATION = ['circuit', 'bloc', 'circuit_bloc', 'reserve'] as const;
export type CleEvacuation = (typeof CLES_EVACUATION)[number];

/**
 * Moments marquants que l'écran de fin peut raconter (12 §4.11, D-281), par clé : une blessure se dit selon sa gravité et ses
 * causes, comme les textes d'aggravation (le feu l'emporte sur le froid) ; le feu éteint, selon qu'on sait nommer sa pièce.
 */
export const CLES_MOMENT = [
  'premier_contact',
  'creature_expulsee',
  'creature_inerte',
  'blesse_griffes',
  'blesse_feu',
  'blesse_froid',
  'blesse_griffes_feu',
  'blesse_griffes_froid',
  'critique_griffes',
  'critique_feu',
  'critique_froid',
  'critique_griffes_feu',
  'critique_griffes_froid',
  'pont_cede',
  'chute_entendue',
  'creature_glisse',
  'porte_enfoncee',
  'soin',
  'feu_eteint',
  'feu_eteint_derriere',
  'breche_ouverte',
  'passage_decouvert',
  'combinaison_enfilee',
  'alarme_declenchee',
  'circuit_active',
  'objet_installe',
  'pont_place',
  'chambre_bouclee',
  'cloison_deverrouillee',
  'machines_arretees',
  'gravite_coupee',
] as const;
export type CleMoment = (typeof CLES_MOMENT)[number];

/** Ce qui a tué, clé de la dernière phrase d'une défaite (D-282) : le vide l'emporte sur tout, puis le feu sur le froid. */
export const CLES_MORT = ['griffes', 'feu', 'froid', 'vide', 'griffes_feu', 'griffes_froid'] as const;
export type CleMort = (typeof CLES_MORT)[number];

/**
 * Une phrase du récit de fin, écrite à la main en entier sous chaque forme dont le récit a besoin (D-281) : `ailleurs` nomme la
 * pièce ({le:piece}), `ici` suit une phrase qui l'a déjà nommée ; les formes `…Reprise` suivent une phrase qui a nommé la
 * créature (« elle », « l' », « ses »). Sans `ailleurs`, le moment ne dit pas de pièce ; sans reprise, il ne nomme pas la
 * créature. Le jeu choisit une forme, il ne remplace jamais un mot par un pronom.
 */
export interface PhraseFin {
  readonly ici: string;
  readonly ailleurs?: string;
  readonly iciReprise?: string;
  readonly ailleursReprise?: string;
}

/** Les cinq supports d'un document à lire (spec 2026-10-18 §8.4). */
export type SupportDocument = 'note' | 'journal' | 'message' | 'inscription' | 'affiche';

/**
 * Textes d'un document des grandes stations (spec §8.5), dans la section `documents` à part : les descriptions refusent tout trou.
 * Le seul trou permis est la pièce d'une note de rangement : `{le:piece}`, `{de:piece}` ou `{a:piece}`.
 */
export interface TexteDocument {
  /** Nom de puce affiché, avec genre, nombre et élision ; sans chiffre. */
  readonly puce: Nom;
  readonly support: SupportDocument;
  /** Ligne « où », vraie dans toute pièce que les étiquettes du document autorisent. */
  readonly ou: string;
  /** Paragraphes ; pour un journal, lignes « hh:mm  texte » (deux espaces). */
  readonly corps: readonly string[];
  /** Note : prénom de l'auteur. */
  readonly signature?: string;
}

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
  /**
   * Aggravations dues au froid de la chambre froide (D-240), à la place des textes de griffes : froid seul, ou griffes et froid
   * dans le même pas. Le feu, s'il est aussi en cause, garde ses textes.
   */
  readonly gelures: Readonly<Record<'froid' | 'griffes_froid', Readonly<Record<TypeAggravation, Variantes>>>>;
  /** Défaite par le vide, sans combinaison dans une pièce sans air (C-04 §3.1), à la place des autres textes de défaite. */
  readonly asphyxie: Variantes;
  /** Phrase ajoutée au regard d’une pièce sur la piste de la créature (spec 2026-10-18 §5.4), couche menace. */
  readonly traces: Readonly<Record<IntensiteTrace, Variantes>>;
  /** Phrase ajoutée au regard d’une pièce pillée avant le joueur (spec 2026-10-18 §6.6), couche univers, après la trace s’il y en a une. */
  readonly pillages: Variantes;
  /** Ce que le passager entend derrière un passage en attendant (lot 2 de la créature mobile), par résultat ; couche menace. */
  readonly ecoute: Readonly<Record<EntenduRecit, Variantes>>;
  /** Phrase d'attente qui précède une écoute, à la place de celle de `evenements.attente`. */
  readonly attenteEcoute: Variantes;
  /** Phrase d'attente dans une salle des machines en marche : le vacarme, jamais le silence (#251). */
  readonly attenteVacarme: Variantes;
  /** Attente seule à raconter, 5e et 10e de suite (#225). */
  readonly attentesLongues: Readonly<Record<5 | 10, string>>;
  /** Départ de la capsule, selon ce qui l'alimentait. */
  readonly evacuations: Readonly<Record<CleEvacuation, Variantes>>;
  /** Messages de l'IA de la station, par identifiant de message du monde : une phrase écrite à la main, sans trou. */
  readonly assistance: Readonly<Record<string, string>>;
  /**
   * Documents des grandes stations, par clé de nom du document (spec §8.5) ; la réunion des textes ajoute chaque puce à `noms` sous
   * la même clé, pour que `nomDe` traite un document comme tout objet.
   */
  readonly documents: Readonly<Record<string, TexteDocument>>;
  /** Étiquette du support d'un document, que l'appli met en capitales (spec §8.4, §9.1). */
  readonly supports: Readonly<Record<SupportDocument, string>>;
  readonly passages: {
    readonly ouvert: Variantes;
    readonly ferme: Variantes;
    /** Passage dont la destination n'est pas connue (C-06 §3, K-05). */
    readonly ouvertSansDestination: Variantes;
    readonly fermeSansDestination: Variantes;
    /** Ajouté au regard d'une porte étanche dont le voyant dit qu'il n'y a plus d'air de l'autre côté (VP-03). */
    readonly voyantVide: string;
    /** Regard sur le vide d'une passerelle effondrée, sans porte (D-164). */
    readonly gouffre: Variantes;
  };
  readonly refus: Readonly<Record<RaisonRefus, string>>;
  readonly indisponibilites: Readonly<Record<RaisonIndisponibilite, string>>;
  readonly libelles: Readonly<Record<IdAction, string>>;
  /** Libellé d'« aller » par un passage dont la destination n'est pas connue : nommé par le passage seul. */
  readonly allerSansDestination: string;
  /** Libellé de « poser » à une position de la pièce (la caisse d'une grande station), nommée comme dans celui de « déplacer ». */
  readonly poserAPosition: string;
  /** Verbe seul, sans trou : options d'une puce et rappel de la dernière action (« > Carnet · Prendre »). */
  readonly verbes: Readonly<Record<IdAction, string>>;
  readonly observation: {
    readonly drone_veille: string;
    readonly drone_trajet: string;
    readonly drone_maintien: string;
    readonly drone_deraille: string;
    readonly drone_a_rearmer: string;
    readonly drone_arrete: string;
    readonly drone_termine: string;
    readonly poigneeTenue: string;
    readonly freinSerre: string;
    readonly freinDesserre: string;
    readonly passageEncombre: string;
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
    /** Vue, la créature ralentie par le froid (D-166) ; figée, quand sa prochaine réaction sera sautée (MX-01). */
    readonly creatureRalentie: string;
    readonly creatureEngourdie: string;
    /** Pont fragile posé en travers d'un vide de la pièce (D-164). */
    readonly pont: string;
    /** Pont fragile qui a cédé dans un vide de la pièce : ses débris au bord (D-164). */
    readonly pontBrise: string;
    /** Salle des machines, machines en marche ou arrêtées (D-163). */
    readonly machinesMarche: string;
    readonly machinesArret: string;
    /** Gravité coupée dans la pièce (D-165). */
    readonly sansGravite: string;
    /** Chambre froide (D-166). */
    readonly froid: string;
    /** Vide d'une passerelle effondrée, à la place de « ouvert » : il sépare de la pièce d'en face (D-164). */
    readonly gouffre: string;
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
    /** Plus aucune évacuation possible (D-085, D-275) : ne nomme aucune sortie. */
    readonly sansSortie: string;
    /** Récit court de l'écran de fin après un abandon (12 §4.11), dans la pièce où le passager s'est arrêté. */
    readonly abandon: string;
    /** Repères de moment des messages d'IA Station, sans heure (12 §3.9) : au réveil, à l'arrivée dans une pièce, au départ, après une longue attente. */
    readonly momentReveil: string;
    readonly momentArrivee: string;
    readonly momentEvacuation: string;
    readonly momentPatience: string;
  };
  /** Écran de fin (12 §4.11, D-281 à D-283) : titres, puis le récit de la partie, phrase par phrase. */
  readonly fin: {
    readonly titres: Readonly<Record<'abandon' | Issue, string>>;
    /** Première phrase du récit, dans la pièce du réveil. */
    readonly reveil: string;
    readonly moments: Readonly<Record<CleMoment, PhraseFin>>;
    /** Dernière phrase d'une défaite : la pièce et ce qui a tué (D-282). */
    readonly morts: Readonly<Record<CleMort, PhraseFin>>;
    /** Santé au départ de la capsule (D-283). */
    readonly sante: Readonly<Record<'indemne' | 'blesse' | 'critique', string>>;
    /** Ce que le passager sait de la créature au départ, si aucun moment ne l'a mise hors jeu (D-283). */
    readonly creature: Readonly<Record<'laissee' | 'entendue' | 'jamais', string>>;
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

type Partiel<T> = { readonly [K in keyof T]?: T[K] extends string | Variantes | Nom ? T[K] : Partiel<T[K]> };

/** Part d'un jeu de textes que d'autres couches complètent (13 §7.2) : socle, univers ou menace. */
export type Couche = Partiel<TextesMonde>;

/** Textes propres à un morceau (13 §7.2) : noms, descriptions et messages d'arrivée. */
export interface TextesMorceau {
  readonly noms: Readonly<Record<string, Nom>>;
  readonly descriptions: Readonly<Record<string, Variantes>>;
  readonly assistance: Readonly<Record<string, string>>;
  /**
   * Descriptions qui remplacent les leurs dans une grande station (spec 2026-10-18 §5.4, §6.5) : celles des pièces, calmes et sans
   * trace, et les variantes d'une description d'objet que la grande station change (la caisse portable de M-02).
   */
  readonly calmes?: Readonly<Record<string, Variantes>>;
  /** Documents que porte la station (spec 2026-10-18 §8.5) : leurs puces rejoignent `noms` à la réunion des textes. */
  readonly documents?: Readonly<Record<string, TexteDocument>>;
}

/** Rôles que chaque gabarit peut remplir ; tout autre trou est une erreur (C-07 N-03). */
export const ROLES_EVENEMENT: Readonly<Record<TypeRecit, readonly string[]>> = {
  drone_envoye: ['objet'],
  drone_maintient: ['objet'],
  drone_deraille: ['objet'],
  drone_replace: ['objet'],
  drone_rearme: ['objet'],
  drone_arrete: ['objet'],
  drone_termine: ['objet'],
  drone_bruit_arrete: ['passage'],
  poignee_tenue: ['objet'],
  poignee_lachee: ['objet'],
  passage_ouvert_encombre: ['passage'],
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
  pas_entendus: [],
  souffle_entendu: [],
  bruit_lointain: [],
  bruit_proche: ['passage'],
  traces_fraiches: [],
  ecoute_couverte: [],
  attente: [],
  bruit_station: [],
  premier_contact: [],
  menace: [],
  aggravation_blesse: [],
  aggravation_critique: [],
  defaite: [],
  soin_indemne: ['objet'],
  soin_blesse: ['objet'],
  objet_deplace: ['objet', 'position'],
  objet_pose_position: ['objet', 'position'],
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
  pont_place: ['objet', 'passage'],
  pont_cede: ['objet', 'passage'],
  derive: ['passage'],
  machines_arretees: ['objet'],
  machines_relancees: ['objet'],
  gravite_coupee: ['piece'],
  gravite_retablie: ['piece'],
  chambre_bouclee: ['objet', 'piece'],
  bruit_couvert: ['passage'],
  chute_entendue: ['passage'],
  cloison_deverrouillee: ['objet'],
  porte_secouee: ['passage'],
  porte_enfoncee: ['passage'],
};

export const ROLES_LIBELLE: Readonly<Record<IdAction, readonly string[]>> = {
  envoyer: ['cible'],
  tenir: ['cible'],
  lacher: ['cible'],
  replacer: ['cible'],
  rearmer: ['cible'],
  arreter_drone: ['cible'],
  reprendre_drone: ['cible'],
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
  // `passage` : le vide visé ; `piece` : la pièce derrière lui, ou le vide seul si elle est inconnue.
  placer: ['cible', 'passage', 'piece'],
  deriver: ['cible', 'vers'],
  arreter: ['cible'],
  relancer: ['cible'],
  couper: ['cible'],
  retablir: ['cible'],
  boucler: ['cible'],
  actionner: ['cible'],
  attendre: [],
};

/** Rôles des phrases de fin, en plus de `piece` pour leur forme `ailleurs` (D-281). */
export const ROLES_MOMENT: Readonly<Record<CleMoment, readonly string[]>> = {
  premier_contact: [],
  creature_expulsee: [],
  creature_inerte: [],
  blesse_griffes: [],
  blesse_feu: [],
  blesse_froid: [],
  blesse_griffes_feu: [],
  blesse_griffes_froid: [],
  critique_griffes: [],
  critique_feu: [],
  critique_froid: [],
  critique_griffes_feu: [],
  critique_griffes_froid: [],
  pont_cede: ['objet'],
  chute_entendue: ['passage'],
  creature_glisse: ['passage'],
  porte_enfoncee: ['passage'],
  soin: ['objet'],
  // `lieu` : la pièce du foyer éteint, ou le passage derrière lequel il brûlait tant que sa destination est inconnue.
  feu_eteint: ['lieu'],
  feu_eteint_derriere: ['lieu'],
  breche_ouverte: ['objet'],
  passage_decouvert: [],
  combinaison_enfilee: ['objet'],
  alarme_declenchee: ['objet'],
  circuit_active: ['objet'],
  objet_installe: ['objet', 'capsule'],
  pont_place: ['objet'],
  // `lieu` : la chambre bouclée, la zone dont la gravité est coupée.
  chambre_bouclee: ['lieu'],
  cloison_deverrouillee: ['objet'],
  machines_arretees: [],
  gravite_coupee: ['lieu'],
};

export const ROLES_ALLER_SANS_DESTINATION = ['cible'] as const;
export const ROLES_POSER_A_POSITION = ['cible', 'position'] as const;
export const ROLES_PASSAGE = ['passage', 'vers'] as const;
export const ROLES_PASSAGE_SANS_DESTINATION = ['passage'] as const;
export const ROLES_INDISPONIBILITE = ['cible'] as const;

export const ROLES_SAVOIR: Readonly<Record<TypeSavoir, readonly string[]>> = {
  enverra_drone: ['objet'],
  tiendra: ['objet'],
  lachera: ['objet'],
  replacera_drone: ['objet'],
  rearmera_drone: ['objet'],
  arretera_drone: ['objet'],
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
  placera: ['objet', 'passage'],
  derivera: ['passage'],
  arreteront: ['piece'],
  relanceront: ['piece'],
  coupera: ['piece'],
  retablira: ['piece'],
  bouclera: ['piece'],
  deverrouillera: ['objet'],
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
  froid: [],
  froid_mortel: [],
};

export const ROLES_OBSERVATION: Readonly<Record<keyof TextesMonde['observation'], readonly string[]>> = {
  drone_veille: ['objet'],
  drone_trajet: ['objet'],
  drone_maintien: ['objet'],
  drone_deraille: ['objet'],
  drone_a_rearmer: ['objet'],
  drone_arrete: ['objet'],
  drone_termine: ['objet'],
  poigneeTenue: ['objet'],
  freinSerre: ['objet'],
  freinDesserre: ['objet'],
  passageEncombre: ['passage'],
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
  creatureRalentie: [],
  creatureEngourdie: [],
  pont: ['objet', 'passage'],
  pontBrise: ['objet', 'passage'],
  machinesMarche: [],
  machinesArret: [],
  sansGravite: [],
  froid: [],
  gouffre: ['passage', 'vers'],
  inventaire: ['liste'],
  inventaireVide: [],
  creature: [],
  creatureATerre: [],
  blesse: [],
  critique: [],
  terminee: [],
  evacuee: [],
  sansSortie: [],
  abandon: ['piece'],
  momentReveil: ['piece'],
  momentArrivee: ['piece'],
  momentEvacuation: [],
  momentPatience: [],
};
