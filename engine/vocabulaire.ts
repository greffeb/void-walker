import type { IntensiteTrace } from './monde';
import type { EmplacementPassage, PanCoque, RectPlan } from './plan';

// Vocabulaire public du moteur : commandes, événements, consultations, raisons. Aucun texte.

export const ACTIONS = [
  'regarder',
  'prendre',
  'poser',
  'ouvrir',
  'fermer',
  'aller',
  'soigner',
  'deplacer',
  'arroser',
  'verser',
  'declencher',
  'activer',
  'installer',
  'lancer',
  'enfiler',
  'retirer',
  'percer',
  'reboucher',
  'placer',
  'deriver',
  'arreter',
  'relancer',
  'couper',
  'retablir',
  'boucler',
  'actionner',
  'deverrouiller',
  'surveiller',
  'envoyer',
  'replacer',
  'rearmer',
  'arreter_drone',
  'reprendre_drone',
  'attendre',
] as const;
export type IdAction = (typeof ACTIONS)[number];

/** Chaîne de santé (C-04 §2, D-041) ; « vaincu » conclut la partie (D-013). */
export const SANTES = ['indemne', 'blesse', 'critique', 'vaincu'] as const;
export type Sante = (typeof SANTES)[number];

/**
 * Ce qui blesse : les griffes de la créature au contact (C-04 §4), le feu de la pièce où l'on finit l'action (D-188), le froid
 * de la chambre froide au-delà de deux actions (D-240) ; le vide, sans combinaison, est une défaite hors plafond (C-04 §3.1).
 */
export const CAUSES = ['griffes', 'feu', 'froid', 'vide'] as const;
export type Cause = (typeof CAUSES)[number];

/** Ce que lit le capteur posé : brouillé en pièce aveugle, hors service en panne ou détruit (créature mobile lot 3, D-351). */
export type EtatCapteur = 'calme' | 'mouvement' | 'brouille' | 'hs';

export const TYPES_EVENEMENT = [
  'reveil',
  'objet_pris',
  'objet_pose',
  'passage_ouvert',
  'passage_ouvert_encombre',
  'passage_ferme',
  'deplacement',
  'piece_decouverte',
  'bruit_mecanisme',
  'bruit_creature',
  'pas_entendus',
  'souffle_entendu',
  'bruit_lointain',
  'bruit_proche',
  'poursuite_proche',
  'traces_fraiches',
  'ecoute',
  'ecoute_couverte',
  'ecoute_groupee',
  'ecoute_rappel',
  'capteur_pose',
  'capteur',
  'creature_entre',
  'attente',
  'premier_contact',
  'menace',
  'aggravation_blesse',
  'aggravation_critique',
  'defaite',
  'soin_indemne',
  'soin_blesse',
  'objet_deplace',
  'objet_pose_position',
  'feu_derriere',
  'feu_gagne',
  'feu_eteint',
  'huile_versee',
  'creature_glisse',
  'alarme_declenchee',
  'circuit_active',
  'objet_installe',
  'passage_decouvert',
  'combinaison_enfilee',
  'combinaison_retiree',
  'breche_ouverte',
  'breche_rebouchee',
  'air_perdu',
  'air_revenu',
  'creature_expulsee',
  'creature_inerte',
  'evacuation',
  'assistance',
  'pont_place',
  'pont_cede',
  'derive',
  'machines_arretees',
  'machines_relancees',
  'gravite_coupee',
  'gravite_retablie',
  'chambre_bouclee',
  'bruit_couvert',
  'chute_entendue',
  'cloison_deverrouillee',
  'terminal_deverrouille',
  'terminal_connecte',
  'porte_secouee',
  'porte_enfoncee',
  'bruit_station',
  'drone_envoye',
  'drone_deraille',
  'drone_replace',
  'drone_rearme',
  'drone_arrete',
  'drone_termine',
  'drone_bruit_arrete',
  'obstacle_en_travers',
  'obstacle_degage',
] as const;
export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

export const TYPES_CONSULTATION = ['regarder_piece', 'regarder_objet', 'regarder_passage', 'regarder_document'] as const;
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
  'hors_de_portee',
  'test_en_cours',
  'parametre_absent',
  'trop_large',
  'deja_actif',
  'non_alimentee',
  'non_isolee',
  'creature_a_bord',
  'deja_enfilee',
  'deja_percee',
  'sans_breche',
  'encombre',
  'sans_pont',
  'trop_loin',
  'sans_gravite',
  'deja_fait',
  'verrouillee',
  'enfoncee',
  'sans_carte',
  'sans_mot_de_passe',
  'trop_lourd',
  'encombre_par_obstacle',
] as const;
export type RaisonRefus = (typeof RAISONS_REFUS)[number];

/** Raisons qu'un menu peut afficher sur une option indisponible : sous-ensemble des refus. */
export const RAISONS_INDISPONIBILITE = [
  'ferme',
  'pas_blesse',
  'vide',
  'hors_de_portee',
  'test_en_cours',
  'trop_large',
  'deja_actif',
  'non_alimentee',
  'non_isolee',
  'creature_a_bord',
  'encombre',
  'sans_pont',
  'trop_loin',
  'sans_gravite',
  'verrouillee',
  'enfoncee',
  'sans_carte',
  'sans_mot_de_passe',
  'trop_lourd',
  'encombre_par_obstacle',
] as const satisfies readonly RaisonRefus[];
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

/**
 * Passage vu depuis la pièce du passager : `vers` est la pièce annoncée par la signalétique, ou `null` tant que la
 * destination d'un passage sans signalétique n'est pas découverte (C-06 §3, K-05).
 */
export interface RefPassage {
  readonly encombre?: true;
  readonly sorte: 'passage';
  readonly id: string;
  readonly nom: string;
  readonly ouvert: boolean;
  readonly vers: RefPiece | null;
  /** Faux pour un passage sans signalétique ou caché : sa destination ne s'annonce pas. */
  readonly signale: boolean;
  /** Ouvert sur une pièce en feu : le passager voit les flammes (C-06 §2). */
  readonly feu: boolean;
  /** Sol huilé au pied du passage, de ce côté (C-03 §5.2, D-190). */
  readonly huile: boolean;
  /** Voyant d'une porte étanche : la pièce de l'autre côté est sans air (C-06 OP-04, VP-03). */
  readonly vide: boolean;
  /** Vide d'une passerelle effondrée, sans porte : il se franchit sur un pont posé en travers (D-164). */
  readonly gouffre: boolean;
}

/** Position locale d'une pièce, utile à une action (C-02 §2) : « sous la grille haute », « au centre ». */
export interface RefPosition {
  readonly sorte: 'position';
  readonly id: string;
  readonly nom: string;
}

export type Cible = RefPiece | RefObjet | RefPassage | RefPosition;

/** `parametre` : position ou cible qui complète l'action (C-01 §2, A-03), comme « Caisse › Déplacer › sous la grille ». */
export interface Commande {
  readonly action: string;
  readonly cible: string;
  readonly parametre?: string;
}

/** Ce qu'on perçoit derrière une porte en attendant (D-343) ; `machines` et `froid` sont des pièces aveugles. */
export type Entendu = 'net' | 'vague' | 'rien' | 'machines' | 'froid';
/** Ce que le récit en dit : `Entendu`, plus les redites d'un changement (« toujours », « plus rien »). */
export type EntenduRecit = Entendu | 'toujours' | 'plus_rien';

export type Evenement =
  | { readonly type: 'drone_envoye' | 'drone_deraille' | 'drone_replace' | 'drone_rearme' | 'drone_arrete' | 'drone_termine'; readonly objet: RefObjet }
  | { readonly type: 'drone_bruit_arrete'; readonly passage: RefPassage }
  /** En entrant dans sa pièce : l'obstacle barre encore son passage, ou il est rangé et le passage dégagé (#271). */
  | { readonly type: 'obstacle_en_travers' | 'obstacle_degage'; readonly objet: RefObjet; readonly passage: RefPassage }
  | { readonly type: 'reveil'; readonly piece: RefPiece }
  | { readonly type: 'objet_pris'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'objet_pose'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'passage_ouvert'; readonly passage: RefPassage }
  | { readonly type: 'passage_ouvert_encombre'; readonly passage: RefPassage }
  | { readonly type: 'passage_ferme'; readonly passage: RefPassage }
  | { readonly type: 'deplacement'; readonly passage: RefPassage; readonly piece: RefPiece }
  | { readonly type: 'piece_decouverte'; readonly piece: RefPiece }
  /** Le passager entend son propre geste bruyant. */
  | { readonly type: 'bruit_mecanisme'; readonly passage: RefPassage }
  /** La créature bouge dans une pièce voisine : situé par le passage, jamais par une position (OP-01). */
  | { readonly type: 'bruit_creature'; readonly passage: RefPassage }
  | { readonly type: 'creature_entre'; readonly passage: RefPassage }
  /** Alertée, elle a entendu les pas du passager et le poursuit (D-276). */
  | { readonly type: 'pas_entendus' }
  /** Alertée, elle écoute encore : elle entend le passager immobile et vient (D-276). */
  | { readonly type: 'souffle_entendu' }
  /** Face 2 du dé de rencontre : un bruit lourd, très loin, sans direction (spec créature mobile §3.3). */
  | { readonly type: 'bruit_lointain' }
  /** Face 2 du dé, elle dans une pièce voisine : un bruit proche, situé par le passage qui les sépare, même fermé (spec créature mobile §3.3). */
  | { readonly type: 'bruit_proche'; readonly passage: RefPassage }
  /** En poursuite, sur les talons du passager dans la pièce voisine : situé par le passage de sa piste, même fermé (#258, D-361). */
  | { readonly type: 'poursuite_proche'; readonly passage: RefPassage }
  /** Le passager entre là où elle est passée il y a peu : une trace fraîche, sans direction (spec créature mobile §3.4). */
  | { readonly type: 'traces_fraiches' }
  /** En grande station, en attendant : ce qu'on entend derrière ce passage, seulement si ça change (créature mobile lot 2, D-343). */
  | { readonly type: 'ecoute'; readonly passage: RefPassage; readonly entendu: EntenduRecit }
  /** En attendant dans une salle des machines en marche : le vacarme couvre tout, dit à chaque attente (D-362). */
  | { readonly type: 'ecoute_couverte' }
  /** Plusieurs portes silencieuses dites ensemble ; `toutes` : toutes celles de la pièce, de quatre à douze (D-363). */
  | { readonly type: 'ecoute_groupee'; readonly passages: readonly RefPassage[]; readonly entendu: 'rien' | 'plus_rien'; readonly toutes: boolean }
  /** Les portes non redites n'ont pas changé ; `autres` : une porte au moins vient d'être dite ; `passage` : la seule porte de la pièce (D-362). */
  | { readonly type: 'ecoute_rappel'; readonly autres: boolean; readonly passage?: RefPassage }
  /** Le capteur est posé pour de bon, et dit d'emblée ce qu'il lit (créature mobile lot 3, D-350). */
  | { readonly type: 'capteur_pose'; readonly objet: RefObjet; readonly piece: RefPiece; readonly etat: Exclude<EtatCapteur, 'hs'> }
  /** Le capteur posé change d'état : il bipe, tombe en panne ou est détruit (créature mobile lot 3, D-352). */
  | { readonly type: 'capteur'; readonly etat: EtatCapteur }
  /** `vacarme` : attente dans une salle des machines en marche, où le bruit ne se tait jamais (#251). */
  | { readonly type: 'attente'; readonly vacarme?: true }
  | { readonly type: 'premier_contact' }
  /** Elle le menace sans le blesser : action libre après le premier contact, arrivée sous ses yeux, ou dé favorable (C-04 §4). */
  | { readonly type: 'menace' }
  /** Une aggravation au plus par action, toutes ses causes conservées (C-04 §3, D-053). */
  | { readonly type: 'aggravation_blesse' | 'aggravation_critique' | 'defaite'; readonly causes: readonly Cause[] }
  | { readonly type: 'soin_indemne'; readonly objet: RefObjet }
  | { readonly type: 'soin_blesse'; readonly objet: RefObjet }
  | { readonly type: 'objet_deplace'; readonly objet: RefObjet; readonly position: RefPosition }
  /** Un appui déplaçable porté se pose directement à une position de la pièce : sous la grille, sans passer par le sol (grandes stations). */
  | { readonly type: 'objet_pose_position'; readonly objet: RefObjet; readonly position: RefPosition }
  /** Le passager voit des flammes par le passage qu'il vient d'ouvrir, ou par un passage ouvert dont il ignore la destination. */
  | { readonly type: 'feu_derriere'; readonly passage: RefPassage }
  /** Le feu gagne une pièce que le passager voit et sait nommer : la sienne, ou une voisine par un passage ouvert (C-03 §5.3). */
  | { readonly type: 'feu_gagne'; readonly piece: RefPiece }
  /** Foyer éteint : la pièce, ou le passage seul tant que sa destination est inconnue (C-06 OP-03). */
  | { readonly type: 'feu_eteint'; readonly piece: RefPiece | RefPassage }
  | { readonly type: 'huile_versee'; readonly objet: RefObjet; readonly passage: RefPassage }
  /** La créature glisse sous les yeux du passager, au pied du passage qu'elle franchissait (C-03 §5.2). */
  | { readonly type: 'creature_glisse'; readonly passage: RefPassage }
  | { readonly type: 'alarme_declenchee'; readonly objet: RefObjet }
  /** Le circuit de la console est réarmé : il alimentera sa capsule (AR-01 §11.2). */
  | { readonly type: 'circuit_active'; readonly objet: RefObjet }
  | { readonly type: 'objet_installe'; readonly objet: RefObjet; readonly capsule: RefObjet }
  /** L'ouverture d'un passage caché révèle sa destination (K-05). */
  | { readonly type: 'passage_decouvert'; readonly passage: RefPassage }
  | { readonly type: 'combinaison_enfilee' | 'combinaison_retiree'; readonly objet: RefObjet }
  /** Le vitrage extérieur percé, puis rebouché (C-02 §3, D-066). */
  | { readonly type: 'breche_ouverte' | 'breche_rebouchee'; readonly objet: RefObjet }
  /** Pièces que le passager voit perdre ou retrouver leur air à ce pas : la sienne, ou une voisine par un passage ouvert (C-03 §5.4). */
  | { readonly type: 'air_perdu' | 'air_revenu'; readonly pieces: readonly RefPiece[] }
  /** La créature, sous ses yeux, aspirée hors de la station ou figée par le vide ; inerte, aussi à la découverte du corps (D-062). */
  | { readonly type: 'creature_expulsee' | 'creature_inerte' }
  /** Conclusion de la partie : sources qui alimentaient la capsule, circuit puis bloc. */
  | { readonly type: 'evacuation'; readonly sources: readonly SourceEvacuation[] }
  /** Message de l'IA de la station reçu à ce pas : son texte est écrit à la main, hors du récit (C-07). */
  | { readonly type: 'assistance'; readonly message: string; readonly signe?: SignePublic }
  /** Un pont fragile posé en travers d'un vide (D-164). */
  | { readonly type: 'pont_place'; readonly objet: RefObjet; readonly passage: RefPassage }
  /** La créature s'engage sur le pont fragile : il cède, elle tombe, il est perdu ; entendu depuis l'un des deux bords (D-164, D-236). */
  | { readonly type: 'pont_cede'; readonly objet: RefObjet; readonly passage: RefPassage }
  /** Sans gravité, le passager dérive jusqu'à ce passage de la zone (D-237). */
  | { readonly type: 'derive'; readonly passage: RefPassage }
  /** Les machines de la salle arrêtées, ou relancées dans un grand bruit, depuis leur interrupteur (D-163). */
  | { readonly type: 'machines_arretees' | 'machines_relancees'; readonly objet: RefObjet }
  /** La gravité de la zone coupée ou rétablie depuis un interrupteur (D-165, D-238). */
  | { readonly type: 'gravite_coupee' | 'gravite_retablie'; readonly piece: RefPiece }
  /** Depuis une pièce voisine d'un bord, le passager entend le pont céder et quelque chose tomber, derrière ce passage (D-164, OP-01). */
  | { readonly type: 'chute_entendue'; readonly passage: RefPassage }
  /** Le passager fait un geste bruyant dans une salle des machines en marche : leur vacarme le couvre (D-163). */
  | { readonly type: 'bruit_couvert'; readonly passage: RefPassage }
  /** Le pupitre ferme d'un coup les portes de la chambre froide (D-170, D-239). */
  | { readonly type: 'chambre_bouclee'; readonly objet: RefObjet; readonly piece: RefPiece }
  /** Une commande de déverrouillage actionnée : sa cloison n'est plus verrouillée (D-259). */
  | { readonly type: 'cloison_deverrouillee'; readonly objet: RefObjet }
  /** Le code du post-it tapé au terminal : il reste déverrouillé pour la partie (lot 4). */
  | { readonly type: 'terminal_deverrouille' }
  /** Le mot de passe accepté, le terminal révèle la station et montre ses caméras (lot 4). */
  | { readonly type: 'terminal_connecte' }
  /**
   * Alertée, la créature force une porte fermée sur sa piste : le passager l'entend s'acharner, puis la porte cède et s'ouvre
   * (D-279) ; seulement s'il est dans l'une des deux pièces de la porte.
   */
  | { readonly type: 'porte_secouee' | 'porte_enfoncee'; readonly passage: RefPassage }
  /** Bruit de la station, avant la rencontre, dans une grande station (spec 2026-10-18 §5.5). */
  | { readonly type: 'bruit_station' };

/** Moment prévu où un message d'assistance a été reçu (12 §3.9) : un repère, jamais une heure. */
export type MomentMessage =
  | { readonly type: 'reveil'; readonly piece: RefPiece }
  | { readonly type: 'arrivee'; readonly piece: RefPiece }
  | { readonly type: 'evacuation' }
  /** À la 15e attente de suite où rien ne se passe (#225). */
  | { readonly type: 'patience' }
  /** Sur la face 2 du dé de rencontre, à la place du bruit lointain (lot 4). */
  | { readonly type: 'signe' };

/** Fait vrai que signale IA Station, en références publiques : porte forcée, matériel perdu, passage récent, présence (lot 4). */
export type SignePublic =
  | { readonly sorte: 'porte'; readonly pieces: readonly [RefPiece, RefPiece] }
  | { readonly sorte: 'materiel'; readonly piece: RefPiece; readonly appareil: 'camera' | 'capteur' }
  | { readonly sorte: 'passage' | 'presence'; readonly piece: RefPiece };

export interface MessageRecu {
  readonly message: string;
  readonly moment: MomentMessage;
  readonly signe?: SignePublic;
}

/** Ce qui alimentait la capsule au départ : le circuit réarmé, un bloc installé, ou les deux ; sinon sa propre réserve (AR-02 §5.2). */
export type SourceEvacuation = 'circuit' | 'bloc' | 'reserve';

/** Issue d'une partie terminée. */
export type Issue = 'evacuation' | 'defaite';

export type Consultation =
  | { readonly type: 'regarder_piece'; readonly cible: RefPiece; readonly trace?: IntensiteTrace; readonly pillee?: true }
  | { readonly type: 'regarder_objet'; readonly cible: RefObjet }
  | { readonly type: 'regarder_passage'; readonly cible: RefPassage }
  /** Un document ; `designe` : la pièce que nomme une note de rangement, pour remplir le trou (spec 2026-10-18 §8.5). */
  | { readonly type: 'regarder_document'; readonly cible: RefObjet; readonly designe?: RefPiece };

export interface OptionMenu {
  readonly action: IdAction;
  readonly cible: Cible;
  readonly commande: Commande;
  readonly disponible: boolean;
  readonly raison?: RaisonIndisponibilite;
  /** Position ou cible qui complète l'action (12 §3.5, étape « OÙ ? »). */
  readonly parametre?: RefPosition | RefPassage | RefPiece;
}

/** Échelle de l'aperçu (C-04 §4.3, 12 §3.8) ; « certain » annonce une conséquence sans dé (C-04 §5). */
export const NIVEAUX_RISQUE = ['aucun', 'faible', 'modere', 'eleve', 'mortel', 'certain'] as const;
export type NiveauRisque = (typeof NIVEAUX_RISQUE)[number];

/** Seul coût affiché : « bruyant », ou aucun (D-150). */
export const COUTS = ['aucun', 'bruyant'] as const;
export type Cout = (typeof COUTS)[number];

export const TYPES_SAVOIR = [
  'portera',
  'laissera',
  'ouvrira',
  'fermera',
  'quittera',
  'soignera',
  'videra',
  'deplacera',
  'eteindra',
  'huilera',
  'sonnera',
  'alimentera',
  'installera',
  'partira',
  'protegera',
  'gardera',
  'percera',
  'rebouchera',
  'perdront_air',
  'retrouveront_air',
  'placera',
  'derivera',
  'arreteront',
  'relanceront',
  'coupera',
  'retablira',
  'bouclera',
  'deverrouillera',
  'enverra_drone',
  'replacera_drone',
  'rearmera_drone',
  'arretera_drone',
] as const;
export type TypeSavoir = (typeof TYPES_SAVOIR)[number];

/** Conséquence connue du passager avant d'agir (C-06 §4) : jamais un secret ni un résultat de dé. */
export type Savoir =
  | { readonly type: 'enverra_drone' | 'replacera_drone' | 'rearmera_drone' | 'arretera_drone'; readonly objet: RefObjet }
  | { readonly type: 'portera'; readonly objet: RefObjet }
  | { readonly type: 'laissera'; readonly objet: RefObjet; readonly piece: RefPiece }
  | { readonly type: 'ouvrira'; readonly passage: RefPassage }
  | { readonly type: 'fermera'; readonly passage: RefPassage }
  | { readonly type: 'quittera'; readonly piece: RefPiece }
  | { readonly type: 'soignera' }
  /** Dernière dose : le soin restera vide. */
  | { readonly type: 'videra'; readonly objet: RefObjet }
  | { readonly type: 'deplacera'; readonly objet: RefObjet; readonly position: RefPosition }
  /** La pièce, ou le passage seul tant que sa destination est inconnue (C-06 OP-03). */
  | { readonly type: 'eteindra'; readonly piece: RefPiece | RefPassage }
  | { readonly type: 'huilera'; readonly passage: RefPassage }
  /** L'avertisseur sonnera dans sa pièce, le temps de son cycle (C-03 §5.1). */
  | { readonly type: 'sonnera'; readonly piece: RefPiece }
  /** Le circuit réarmé alimentera cette capsule. */
  | { readonly type: 'alimentera'; readonly objet: RefObjet }
  | { readonly type: 'installera'; readonly objet: RefObjet; readonly capsule: RefObjet }
  /** La capsule partira et la partie se conclura. */
  | { readonly type: 'partira' }
  /** Combinaison enfilée : protégé du vide ; retirée : gardée sur soi, sans protection (D-060, D-072/D-073). */
  | { readonly type: 'protegera' | 'gardera'; readonly objet: RefObjet }
  | { readonly type: 'percera' | 'rebouchera'; readonly objet: RefObjet }
  /** Pièces connues qui perdront ou retrouveront leur air (C-04 §3.1, VP-02) ; rien sur une créature non perçue. */
  | { readonly type: 'perdront_air' | 'retrouveront_air'; readonly pieces: readonly RefPiece[] }
  /** Le pont fragile sera posé en travers de ce vide (D-164). */
  | { readonly type: 'placera'; readonly objet: RefObjet; readonly passage: RefPassage }
  /** Sans gravité, le passager dérivera jusqu'à ce passage ; le franchir demandera une action de plus (D-237). */
  | { readonly type: 'derivera'; readonly passage: RefPassage }
  /** Les machines de cette salle s'arrêteront, ou repartiront dans un grand bruit (D-163). */
  | { readonly type: 'arreteront' | 'relanceront'; readonly piece: RefPiece }
  /** La gravité de cette zone sera coupée, ou rétablie (D-165). */
  | { readonly type: 'coupera' | 'retablira'; readonly piece: RefPiece }
  /** Les portes de cette chambre froide se fermeront (D-170). */
  | { readonly type: 'bouclera'; readonly piece: RefPiece }
  /** La cloison de cette commande ne sera plus verrouillée (D-259). */
  | { readonly type: 'deverrouillera'; readonly objet: RefObjet };

/** Ancienneté d'un regard, dite en mots (D-151) : jamais le nombre d'actions (14 §3.2). */
export const PALIERS = ['instant', 'moment', 'longtemps'] as const;
export type Palier = (typeof PALIERS)[number];

export const TYPES_DANGER = [
  'interception',
  'interception_mortelle',
  'creature_vue_instant',
  'creature_vue_moment',
  'creature_vue_longtemps',
  'creature_entendue',
  'brulure',
  'brulure_mortelle',
  'asphyxie',
  'froid',
  'froid_mortel',
] as const;
export type TypeDanger = (typeof TYPES_DANGER)[number];

/**
 * Danger connu qui justifie le niveau de risque (12 §3.8) : la créature ici, qui peut blesser (C-04 §4.3), ou fatale si le
 * passager est critique ; la créature vue ailleurs, avec l'ancienneté de D-151, ou entendue (D-180, D-181) ; le feu de la
 * pièce où l'action finira, brûlure certaine (D-188).
 */
export type Danger =
  /**
   * `asphyxie` : l'action finira sans combinaison dans une pièce sans air (C-04 §3.1) ; `froid` : elle sera la troisième de suite
   * finie, ou plus, dans la chambre froide (D-240).
   */
  | {
      readonly type: 'interception' | 'interception_mortelle' | 'brulure' | 'brulure_mortelle' | 'asphyxie' | 'froid' | 'froid_mortel';
    }
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

/** Pièce actuelle, visitée, ou connue par une porte sans être visitée (D-202). */
export type StatutPiece = 'actuelle' | 'visitee' | 'connue';

/** Ouverture d'un passage : porte, ou tirets pour une grille, un conduit étroit, un panneau, un passage sans signalétique (14 §2.6). */
export type DessinPassage = 'porte' | 'tirets';

export interface ObjetCarte {
  readonly objet: RefObjet;
  readonly position: RefPosition | null;
  /** Identité d'un objet déjà vu ; aucune position réelle ni phase hors de vue. */
  readonly drone?: true;
}

/**
 * `pret` : au repos, son obstacle vu par le passager ; `trajet` : à l'arrêt dans une pièce, prêt à repartir ou devant une porte
 * fermée ; `roule` : à mi-chemin de la suivante (#270).
 */
export type PhaseDrone = 'veille' | 'pret' | 'trajet' | 'roule' | 'traction' | 'deraille' | 'a_rearmer' | 'arrete' | 'termine';

/** Une pièce que le passager connaît, telle qu'il l'a vue (14 §3.4). */
export interface PieceCarte {
  readonly piece: RefPiece;
  readonly statut: StatutPiece;
  /** Rectangle en cases ; `null` dans un monde sans plan. */
  readonly rect: RectPlan | null;
  /** Ancienneté du dernier regard dans la pièce ; `null` si jamais visitée. */
  readonly regard: Palier | null;
  /** Feu vu au dernier regard qui le montrait, et son ancienneté ; `null` si aucun feu vu (D-213). */
  readonly feu: Palier | null;
  /** Plus d'air, à jour : la pièce du passager, ou lu sur le voyant d'une porte étanche (OP-04). */
  readonly vide: boolean;
  /** La créature a été vue ici en dernier, et quand (D-180) ; `null` sinon. */
  readonly creature: Palier | null;
  /** Ce que lit le capteur posé, à jour même hors de vue ; absent hors de sa pièce (créature mobile lot 3, D-352). */
  readonly capteur?: EtatCapteur;
  /** Objets vus au dernier regard, avec leur position (14 §3.1). */
  readonly objets: readonly ObjetCarte[];
  /** Passages connus depuis la pièce actuelle ; `null` si aucun chemin connu ne l'y relie. Sert à trier, jamais affiché. */
  readonly distance: number | null;
}

/** Un passage vu depuis une pièce visitée (14 §3.4). */
export interface PassageCarte {
  readonly id: string;
  readonly nom: string;
  /** Pièces visitées d'où il a été vu, dans l'ordre du monde. */
  readonly vuDepuis: readonly RefPiece[];
  /** Ses deux pièces quand sa destination est connue ; sinon `null`, un « ? » (OP-03). */
  readonly entre: readonly [RefPiece, RefPiece] | null;
  /** Ouvert au dernier regard. */
  readonly ouvert: boolean;
  readonly dessin: DessinPassage;
  /** Voyant d'une porte étanche, à jour (OP-04) ; `null` sans voyant. */
  readonly voyant: 'air' | 'vide' | null;
  /** Ouverture dans un mur, ou tracé d'un conduit découvert ; `null` dans un monde sans plan. */
  readonly emplacement: EmplacementPassage | null;
}

/** Capsule arrimée dehors, contre le pan de coque de sa salle visitée (14 §2.6). */
export interface CapsuleCarte {
  readonly objet: RefObjet;
  readonly piece: RefPiece;
  readonly pan: PanCoque;
}

/** Carte publique (14 §3.4) : seulement ce que le passager sait, géométrie comprise. */
export interface CartePublique {
  readonly pieces: readonly PieceCarte[];
  readonly passages: readonly PassageCarte[];
  readonly capsules: readonly CapsuleCarte[];
  /** Sous-position où se tient le passager, comme la cabine de la capsule : jamais dessinée, seulement dite (C-02 §2, 14 §3.4). */
  readonly aBord: RefPiece | null;
}

/** Tout ce que le passager sait (C-06) ; seule sortie vers le joueur. */
export interface Observation {
  /** Seulement dans les mondes concernés ; seuls les drones de la pièce actuelle sont renseignés. */
  readonly drones?: readonly { readonly objet: RefObjet; readonly phase: PhaseDrone }[];
  /** Obstacles matériels de la pièce actuelle, rangés ou non, avec le passage qu'ils barrent (#271). */
  readonly obstacles?: readonly { readonly objet: RefObjet; readonly passage: RefPassage; readonly range: boolean }[];
  /** Caméras lues en direct, dans l'ordre du monde : seulement connecté, dans la salle de surveillance (lot 4). */
  readonly cameras?: readonly { readonly piece: RefPiece; readonly etat: EtatCapteur }[];
  readonly piece: RefPiece;
  readonly objets: readonly RefObjet[];
  /** Objets déplaçables de la pièce posés à une position (C-02 §2), comme la caisse sous la grille. */
  readonly placements: readonly { readonly objet: RefObjet; readonly position: RefPosition }[];
  /** Objets installés dans une capsule de la pièce, comme le bloc engagé dans son connecteur. */
  readonly installes: readonly { readonly objet: RefObjet; readonly capsule: RefObjet }[];
  /** Consoles de la pièce dont le circuit est activé. */
  readonly actives: readonly RefObjet[];
  readonly passages: readonly RefPassage[];
  readonly inventaire: readonly RefObjet[];
  readonly visitees: readonly RefPiece[];
  readonly actions: number;
  /** Vue directe : la créature est dans la même pièce, hors de l'alcôve (C-06 §2, AR-01 §11.3). */
  readonly creatureVisible: boolean;
  /** Vue à terre après une glissade : elle ne peut pas l'intercepter tant qu'elle ne s'est pas relevée (C-03 §5.2, AR-01 §11.3). */
  readonly creatureATerre: boolean;
  /** La pièce du passager est en feu (C-03 §5.3). */
  readonly feu: boolean;
  /** La pièce du passager est sans air (C-03 §5.4). */
  readonly sansAir: boolean;
  /** Combinaison portée, enfilée : protégé du vide (D-060). */
  readonly enfilee: RefObjet | null;
  /** Vitrages extérieurs de la pièce percés, puis rebouchés (C-02 §3). */
  readonly percees: readonly RefObjet[];
  readonly rebouchees: readonly RefObjet[];
  /** Le corps inerte de la créature est dans la pièce (D-062). */
  readonly creatureInerte: boolean;
  /** Vue, la créature ralentie par le froid pour toute la partie (D-166). */
  readonly creatureRalentie: boolean;
  /** Vue, ralentie, figée par le froid : sa prochaine réaction est sautée, elle ne peut pas intercepter (MX-01, C-04 §4). */
  readonly creatureEngourdie: boolean;
  /** Ponts fragiles posés en travers d'un vide de la pièce (D-164). */
  readonly ponts: readonly { readonly objet: RefObjet; readonly passage: RefPassage }[];
  /** Ponts fragiles qui ont cédé dans un vide de la pièce : il en reste des débris au bord (D-164). */
  readonly pontsBrises: readonly { readonly objet: RefObjet; readonly passage: RefPassage }[];
  /** Machines de la pièce, en marche ou arrêtées ; `null` hors d'une salle des machines (D-163). */
  readonly machines: 'marche' | 'arret' | null;
  /** Gravité de la pièce, coupée ou rétablie ; `null` hors d'une zone à gravité commutable (D-165). */
  readonly gravite: 'coupee' | 'retablie' | null;
  /** La pièce du passager est une chambre froide (D-166). */
  readonly froid: boolean;
  readonly sante: Sante;
  /** Partie conclue (D-013) : plus aucune action au menu. */
  readonly terminee: boolean;
  /** Comment elle s'est conclue ; `null` tant qu'elle continue. */
  readonly issue: Issue | null;
  /** Plus aucune évacuation possible, quels que soient les dés et les blessures (D-085, D-275) ; ne nomme aucune sortie. */
  readonly sansSortie: boolean;
  /** Messages d'assistance reçus, dans l'ordre, pour les relire. */
  readonly messages: readonly string[];
  readonly menu: readonly OptionMenu[];
  /** La carte : pièces connues, passages vus, capsule, telles que le passager les a vus (14 §3.4). */
  readonly carte: CartePublique;
}
