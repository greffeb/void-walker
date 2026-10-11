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

export interface TextesMonde {
  readonly noms: Readonly<Record<string, Nom>>;
  /** Description des pièces et objets, par clé de nom, pour « regarder ». */
  readonly descriptions: Readonly<Record<string, Variantes>>;
  readonly evenements: Readonly<Record<TypeEvenement, Variantes>>;
  readonly passages: { readonly ouvert: Variantes; readonly ferme: Variantes };
  readonly refus: Readonly<Record<RaisonRefus, string>>;
  readonly indisponibilites: Readonly<Record<RaisonIndisponibilite, string>>;
  readonly libelles: Readonly<Record<IdAction, string>>;
  /** Verbe seul, sans trou : options d'une puce et rappel de la dernière action (« > Carnet · Prendre »). */
  readonly verbes: Readonly<Record<IdAction, string>>;
  readonly observation: {
    readonly lieu: string;
    readonly objets: string;
    readonly aucunObjet: string;
    readonly passageOuvert: string;
    readonly passageFerme: string;
    readonly inventaire: string;
    readonly inventaireVide: string;
    /** La créature est dans la pièce, vue par le passager (C-06 §2). */
    readonly creature: string;
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
export const ROLES_EVENEMENT: Readonly<Record<TypeEvenement, readonly string[]>> = {
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
};

export const ROLES_LIBELLE: Readonly<Record<IdAction, readonly string[]>> = {
  regarder: ['cible'],
  prendre: ['cible'],
  poser: ['cible'],
  ouvrir: ['cible', 'vers'],
  fermer: ['cible', 'vers'],
  aller: ['cible', 'vers'],
};

export const ROLES_PASSAGE = ['passage', 'vers'] as const;
export const ROLES_INDISPONIBILITE = ['cible'] as const;

export const ROLES_SAVOIR: Readonly<Record<TypeSavoir, readonly string[]>> = {
  portera: ['objet'],
  laissera: ['objet', 'piece'],
  ouvrira: ['passage'],
  fermera: ['passage'],
  quittera: ['piece'],
};

export const ROLES_DANGER: Readonly<Record<TypeDanger, readonly string[]>> = {
  creature_vue_instant: ['piece'],
  creature_vue_moment: ['piece'],
  creature_vue_longtemps: ['piece'],
  creature_entendue: ['passage'],
};

export const ROLES_OBSERVATION: Readonly<Record<keyof TextesMonde['observation'], readonly string[]>> = {
  lieu: ['piece'],
  objets: ['liste'],
  aucunObjet: [],
  passageOuvert: ['passage'],
  passageFerme: ['passage'],
  inventaire: ['liste'],
  inventaireVide: [],
  creature: [],
};
