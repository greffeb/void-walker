// Vocabulaire public du moteur : commandes, événements, consultations, raisons. Aucun texte.

export const ACTIONS = ['regarder', 'prendre', 'poser', 'ouvrir', 'fermer', 'aller', 'soigner'] as const;
export type IdAction = (typeof ACTIONS)[number];

/** Chaîne de santé (C-04 §2, D-041) ; « vaincu » conclut la partie (D-013). */
export const SANTES = ['indemne', 'blesse', 'critique', 'vaincu'] as const;
export type Sante = (typeof SANTES)[number];

/** Ce qui blesse : les griffes de la créature au contact (C-04 §4) ; le feu viendra avec #102. */
export const CAUSES = ['griffes'] as const;
export type Cause = (typeof CAUSES)[number];

export const TYPES_EVENEMENT = [
  'reveil',
  'objet_pris',
  'objet_pose',
  'passage_ouvert',
  'passage_ferme',
  'deplacement',
  'piece_decouverte',
  'bruit_mecanisme',
  'bruit_creature',
  'creature_entre',
  'premier_contact',
  'menace',
  'aggravation_blesse',
  'aggravation_critique',
  'defaite',
  'soin_indemne',
  'soin_blesse',
] as const;
export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

export const TYPES_CONSULTATION = ['regarder_piece', 'regarder_objet', 'regarder_passage'] as const;
export type TypeConsultation = (typeof TYPES_CONSULTATION)[number];

export const RAISONS_REFUS = [
  'commande_invalide',
  'action_inconnue',
  'cible_absente',
  'pas_en_main',
  'deja_ouvert',
  'deja_ferme',
  'ferme',
  'pas_blesse',
  'vide',
  'partie_terminee',
] as const;
export type RaisonRefus = (typeof RAISONS_REFUS)[number];

/** Raisons qu'un menu peut afficher sur une option indisponible : sous-ensemble des refus. */
export const RAISONS_INDISPONIBILITE = ['ferme', 'pas_blesse', 'vide'] as const satisfies readonly RaisonRefus[];
export type RaisonIndisponibilite = (typeof RAISONS_INDISPONIBILITE)[number];

export interface RefPiece {
  readonly sorte: 'piece';
  readonly id: string;
  readonly nom: string;
}

export interface RefObjet {
  readonly sorte: 'objet';
  readonly id: string;
  readonly nom: string;
}

/** Passage vu depuis la pièce du passager : `vers` est la pièce annoncée par la signalétique. */
export interface RefPassage {
  readonly sorte: 'passage';
  readonly id: string;
  readonly nom: string;
  readonly ouvert: boolean;
  readonly vers: RefPiece;
}

export type Cible = RefPiece | RefObjet | RefPassage;

export interface Commande {
  readonly action: string;
  readonly cible: string;
}

export type Evenement =
  | { readonly type: 'reveil'; readonly piece: RefPiece }
  | { readonly type: 'objet_pris'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'objet_pose'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'passage_ouvert'; readonly passage: RefPassage }
  | { readonly type: 'passage_ferme'; readonly passage: RefPassage }
  | { readonly type: 'deplacement'; readonly passage: RefPassage; readonly piece: RefPiece }
  | { readonly type: 'piece_decouverte'; readonly piece: RefPiece }
  /** Le passager entend son propre geste bruyant. */
  | { readonly type: 'bruit_mecanisme'; readonly passage: RefPassage }
  /** La créature bouge dans une pièce voisine : situé par le passage, jamais par une position (OP-01). */
  | { readonly type: 'bruit_creature'; readonly passage: RefPassage }
  | { readonly type: 'creature_entre'; readonly passage: RefPassage }
  /** Une seule fois par partie (C-03 §4.4). */
  | { readonly type: 'premier_contact' }
  /** Elle le menace sans le blesser : action libre après le premier contact, arrivée sous ses yeux, ou dé favorable (C-04 §4). */
  | { readonly type: 'menace' }
  /** Une aggravation au plus par action, toutes ses causes conservées (C-04 §3, D-053). */
  | { readonly type: 'aggravation_blesse' | 'aggravation_critique' | 'defaite'; readonly causes: readonly Cause[] }
  | { readonly type: 'soin_indemne'; readonly objet: RefObjet }
  | { readonly type: 'soin_blesse'; readonly objet: RefObjet };

export type Consultation =
  | { readonly type: 'regarder_piece'; readonly cible: RefPiece }
  | { readonly type: 'regarder_objet'; readonly cible: RefObjet }
  | { readonly type: 'regarder_passage'; readonly cible: RefPassage };

export interface OptionMenu {
  readonly action: IdAction;
  readonly cible: Cible;
  readonly commande: Commande;
  readonly disponible: boolean;
  readonly raison?: RaisonIndisponibilite;
}

/** Échelle de l'aperçu (C-04 §4.3, 12 §3.8) ; « certain » annonce une conséquence sans dé (C-04 §5). */
export const NIVEAUX_RISQUE = ['aucun', 'faible', 'modere', 'eleve', 'mortel', 'certain'] as const;
export type NiveauRisque = (typeof NIVEAUX_RISQUE)[number];

/** Seul coût affiché : « bruyant », ou aucun (D-150). */
export const COUTS = ['aucun', 'bruyant'] as const;
export type Cout = (typeof COUTS)[number];

export const TYPES_SAVOIR = ['portera', 'laissera', 'ouvrira', 'fermera', 'quittera', 'soignera', 'videra'] as const;
export type TypeSavoir = (typeof TYPES_SAVOIR)[number];

/** Conséquence connue du passager avant d'agir (C-06 §4) : jamais un secret ni un résultat de dé. */
export type Savoir =
  | { readonly type: 'portera'; readonly objet: RefObjet }
  | { readonly type: 'laissera'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'ouvrira'; readonly passage: RefPassage }
  | { readonly type: 'fermera'; readonly passage: RefPassage }
  | { readonly type: 'quittera'; readonly piece: RefPiece }
  | { readonly type: 'soignera' }
  /** Dernière dose : le soin restera vide. */
  | { readonly type: 'videra'; readonly objet: RefObjet };

export const TYPES_DANGER = [
  'interception',
  'interception_mortelle',
  'creature_vue_instant',
  'creature_vue_moment',
  'creature_vue_longtemps',
  'creature_entendue',
] as const;
export type TypeDanger = (typeof TYPES_DANGER)[number];

/**
 * Danger connu qui justifie le niveau de risque (12 §3.8) : la créature ici, qui peut blesser (C-04 §4.3), ou fatale si le
 * passager est critique ; la créature vue ailleurs, avec l'ancienneté de D-151, ou entendue (D-180, D-181).
 */
export type Danger =
  | { readonly type: 'interception' | 'interception_mortelle' }
  | { readonly type: 'creature_vue_instant' | 'creature_vue_moment' | 'creature_vue_longtemps'; readonly piece: RefPiece }
  | { readonly type: 'creature_entendue'; readonly passage: RefPassage };

export interface Apercu {
  readonly commande: Commande;
  readonly risque: NiveauRisque;
  /** `null` quand aucun danger n'est connu. */
  readonly danger: Danger | null;
  readonly cout: Cout;
  readonly savoir: readonly Savoir[];
}

/** Tout ce que le passager sait (C-06) ; seule sortie vers le joueur. */
export interface Observation {
  readonly piece: RefPiece;
  readonly objets: readonly RefObjet[];
  readonly passages: readonly RefPassage[];
  readonly inventaire: readonly RefObjet[];
  readonly visitees: readonly RefPiece[];
  readonly actions: number;
  /** Vue directe : la créature est dans la même pièce (C-06 §2). */
  readonly creatureVisible: boolean;
  readonly sante: Sante;
  /** Partie conclue (D-013) : plus aucune action au menu. */
  readonly terminee: boolean;
  readonly menu: readonly OptionMenu[];
}
