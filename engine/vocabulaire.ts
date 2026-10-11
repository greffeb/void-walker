// Vocabulaire public du moteur : commandes, événements, consultations, raisons. Aucun texte.

export const ACTIONS = ['regarder', 'prendre', 'poser', 'ouvrir', 'fermer', 'aller'] as const;
export type IdAction = (typeof ACTIONS)[number];

export const TYPES_EVENEMENT = [
  'reveil',
  'objet_pris',
  'objet_pose',
  'passage_ouvert',
  'passage_ferme',
  'deplacement',
  'piece_decouverte',
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
] as const;
export type RaisonRefus = (typeof RAISONS_REFUS)[number];

/** Raisons qu'un menu peut afficher sur une option indisponible : sous-ensemble des refus. */
export const RAISONS_INDISPONIBILITE = ['ferme'] as const satisfies readonly RaisonRefus[];
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
  | { readonly type: 'piece_decouverte'; readonly piece: RefPiece };

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

export const TYPES_SAVOIR = ['portera', 'laissera', 'ouvrira', 'fermera', 'quittera'] as const;
export type TypeSavoir = (typeof TYPES_SAVOIR)[number];

/** Conséquence connue du passager avant d'agir (C-06 §4) : jamais un secret ni un résultat de dé. */
export type Savoir =
  | { readonly type: 'portera'; readonly objet: RefObjet }
  | { readonly type: 'laissera'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'ouvrira'; readonly passage: RefPassage }
  | { readonly type: 'fermera'; readonly passage: RefPassage }
  | { readonly type: 'quittera'; readonly piece: RefPiece };

export interface Apercu {
  readonly commande: Commande;
  readonly risque: NiveauRisque;
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
  readonly menu: readonly OptionMenu[];
}
