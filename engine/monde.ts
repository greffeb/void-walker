import { hacher } from './hachage';
import { validerPlan, type PlanLiaison, type RectPlan } from './plan';

// Forme commune d'un monde (C-02). `nom` est une clé publique vers le texte ; `id` reste interne.
// Les règles lisent des qualités déclarées, jamais un nom (D-078).

export interface DefPiece {
  readonly id: string;
  readonly nom: string;
  /** Foyer présent au départ (C-02 §4.4, C-03 §5.3). */
  readonly feu?: boolean;
  /** Sous-position fermée d'une pièce, comme une cabine « à bord » : ni découverte ni carte (C-02 §2, C-06 §3). */
  readonly sousPosition?: boolean;
  /** Rectangle sur le plan de pont (14 §4.1) ; toutes les pièces dessinées d'un monde en ont un, ou aucune. */
  readonly plan?: RectPlan;
  /** Contre la coque sans vitrage déclaré, comme une baie d'observation (14 §4.1) : PL-05 s'y applique. */
  readonly coque?: boolean;
}

export interface DefLiaison {
  readonly id: string;
  readonly nom: string;
  readonly entre: readonly [string, string];
  readonly ouverte: boolean;
  /** Trop étroite pour un gabarit large, comme la créature (C-02 §3, D-044). */
  readonly etroite?: boolean;
  /** Laisse passer le son même fermée, comme une grille (C-02 §3, OP-01). */
  readonly sonAuTravers?: boolean;
  /** Mécanisme grippé : l'ouvrir fait un bruit normal dans la pièce de celui qui l'ouvre (C-02 §3). */
  readonly bruyante?: boolean;
  /** Hors de portée depuis cette pièce sans un appui stable placé dessous (C-02 §5, AR-01 §11.1 A–P). */
  readonly haute?: string;
  /** Aucune signalétique : la destination reste inconnue tant que le passager ne l'a pas franchie (C-06 §3). */
  readonly sansSignaletique?: boolean;
  /**
   * Pièce depuis laquelle la liaison est invisible avant sa découverte (K-05) ; une liaison cachée est aussi sans
   * signalétique. De l'autre côté, on la voit comme un passage fermé sans destination.
   */
  readonly cachee?: string;
  /** Seule pièce d'où l'on peut l'ouvrir ou la fermer, comme une écoutille manoeuvrée de l'intérieur. */
  readonly manoeuvre?: string;
  /** Jamais étanche, même fermée, comme une grille ou un conduit : le vide la traverse (C-02 §3, D-061). */
  readonly nonEtanche?: boolean;
  /** Porte fixée dans le mur commun, ou tracé d'un conduit sans mur commun (14 §4.1). */
  readonly plan?: PlanLiaison;
}

/** Position locale d'une pièce (C-02 §2) ; `sous` : la liaison haute qu'un appui placé ici rend atteignable. */
export interface DefPosition {
  readonly id: string;
  readonly nom: string;
  readonly piece: string;
  readonly sous?: string;
}

/** Avertisseur commandé à distance (C-03 §5.1) : son émetteur est dans l'alcôve, derrière une paroi opaque, de `piece`. */
export interface DefAvertisseur {
  readonly piece: string;
}

export interface DefObjet {
  readonly id: string;
  readonly nom: string;
  readonly piece: string;
  /** Position de départ dans la pièce, pour un objet déplaçable. */
  readonly position?: string;
  /** Faux pour un objet qui ne se porte pas : caisse au sol, dispositif fixe (C-02 §4.3). */
  readonly portable?: boolean;
  /** Se déplace au sol entre les positions de sa pièce (C-02 §4.3). */
  readonly deplacable?: boolean;
  /** Qualité « appui stable » (C-02 §5). */
  readonly appui?: boolean;
  /** Qualité « soin, par dose » (C-02 §5) : nombre de doses au départ. */
  readonly soin?: number;
  /** Qualité « extinction adaptée, par dose » (C-02 §5). */
  readonly extinction?: number;
  /** Qualité « liquide glissant, par dose » (C-02 §5). */
  readonly glissant?: number;
  readonly avertisseur?: DefAvertisseur;
  /** Trop large pour une liaison étroite, porté ou non (C-02 §3, D-044). */
  readonly large?: boolean;
  /** Source d'énergie qui peut s'installer dans une capsule et l'alimenter. */
  readonly source?: boolean;
  /** Capsule d'évacuation : `interieur` est la pièce où l'on monte à bord ; `alimentee` : déjà prête, sur sa réserve (AR-02 §5.2). */
  readonly capsule?: { readonly interieur: string; readonly alimentee?: boolean };
  /** Console dont le circuit, une fois activé, alimente cette capsule. */
  readonly alimente?: string;
  /** Pupitre qui lance cette capsule. */
  readonly depart?: string;
  /**
   * Vitrage extérieur de sa pièce, fixe : percé, il ouvre une brèche sur l'espace (C-02 §3, D-061). La baie est portée ici
   * par un objet fixe, à portée depuis sa seule pièce, plutôt que par une liaison vers un extérieur.
   */
  readonly vitrageExterieur?: boolean;
  /** Qualité « perce un vitrage extérieur », réussite sûre (C-02 §5, D-064). */
  readonly perce?: boolean;
  /** Qualité « protection contre le vide », quand elle est enfilée (C-02 §5, D-060). */
  readonly protection?: boolean;
  /** Qualité « rebouche une brèche, par usage » (C-02 §5, D-066) : nombre d'usages au départ. */
  readonly rebouche?: number;
}

/** La créature du lancement (D-120) : une seule, de gabarit large, sensible au bruit (C-02 §4.2). */
export interface DefCreature {
  readonly piece: string;
}

/** Message de l'IA de la station, délivré une fois : au réveil, à la première arrivée dans une pièce, ou au départ. */
export interface DefAssistance {
  readonly id: string;
  readonly quand: { readonly type: 'reveil' } | { readonly type: 'arrivee'; readonly piece: string } | { readonly type: 'evacuation' };
}

export interface DefMonde {
  readonly id: string;
  readonly depart: string;
  readonly pieces: readonly DefPiece[];
  readonly liaisons: readonly DefLiaison[];
  readonly objets: readonly DefObjet[];
  readonly positions?: readonly DefPosition[];
  readonly creature?: DefCreature;
  readonly assistance?: readonly DefAssistance[];
}

export interface IndexMonde {
  readonly pieces: ReadonlyMap<string, DefPiece>;
  readonly liaisons: ReadonlyMap<string, DefLiaison>;
  readonly objets: ReadonlyMap<string, DefObjet>;
  readonly positions: ReadonlyMap<string, DefPosition>;
  readonly versPublic: ReadonlyMap<string, string>;
  readonly versInterne: ReadonlyMap<string, string>;
}

/** Identifiant public opaque (C-01 §3) : ne dépend que du monde et de l'entité elle-même. */
export function idPublic(monde: string, idInterne: string): string {
  return `e${hacher(`${monde}/${idInterne}`).slice(-8)}`;
}

/** Doses de l'objet, quelle que soit sa qualité par dose ; un objet n'en porte qu'une. */
export function dosesDe(objet: DefObjet): number | undefined {
  return objet.soin ?? objet.extinction ?? objet.glissant ?? objet.rebouche;
}

function dosesValides(doses: number | undefined): boolean {
  return doses === undefined || (Number.isInteger(doses) && doses >= 1);
}

export function validerMonde(monde: DefMonde): string[] {
  const erreurs: string[] = [];
  const vus = new Set<string>();
  const publics = new Map<string, string>();
  const positions = monde.positions ?? [];
  const entites = [...monde.pieces, ...monde.liaisons, ...monde.objets, ...positions];
  for (const entite of entites) {
    if (entite.id === '') erreurs.push('Identifiant vide.');
    if (entite.nom === '') erreurs.push(`${entite.id} : nom vide.`);
    if (vus.has(entite.id)) erreurs.push(`${entite.id} : identifiant en double.`);
    vus.add(entite.id);
    const publicId = idPublic(monde.id, entite.id);
    const autre = publics.get(publicId);
    if (autre !== undefined && autre !== entite.id) erreurs.push(`${entite.id} et ${autre} : même identifiant public.`);
    publics.set(publicId, entite.id);
  }
  const pieces = new Set(monde.pieces.map((piece) => piece.id));
  if (!pieces.has(monde.depart)) erreurs.push(`Départ inconnu : ${monde.depart}.`);
  if (monde.pieces.some((piece) => piece.id === monde.depart && piece.feu === true)) erreurs.push('Feu dans la pièce de départ.');
  if (monde.pieces.some((piece) => piece.id === monde.depart && piece.sousPosition === true)) erreurs.push('Départ dans une sous-position.');
  const liaisons = new Map(monde.liaisons.map((liaison) => [liaison.id, liaison]));
  for (const liaison of monde.liaisons) {
    const [a, b] = liaison.entre;
    if (!pieces.has(a) || !pieces.has(b)) erreurs.push(`${liaison.id} : pièce inconnue.`);
    if (a === b) erreurs.push(`${liaison.id} : relie une pièce à elle-même.`);
    if (liaison.haute !== undefined && !liaison.entre.includes(liaison.haute)) erreurs.push(`${liaison.id} : haute d'une pièce qu'elle ne relie pas.`);
    if (liaison.cachee !== undefined && !liaison.entre.includes(liaison.cachee)) erreurs.push(`${liaison.id} : cachée d'une pièce qu'elle ne relie pas.`);
    if (liaison.cachee !== undefined && liaison.ouverte) erreurs.push(`${liaison.id} : cachée mais ouverte au départ.`);
    if (liaison.manoeuvre !== undefined && !liaison.entre.includes(liaison.manoeuvre)) erreurs.push(`${liaison.id} : manoeuvrée d'une pièce qu'elle ne relie pas.`);
  }
  const positionsConnues = new Map(positions.map((position) => [position.id, position]));
  const objets = new Map(monde.objets.map((objet) => [objet.id, objet]));
  for (const position of positions) {
    if (!pieces.has(position.piece)) erreurs.push(`${position.id} : pièce inconnue ${position.piece}.`);
    if (position.sous !== undefined && liaisons.get(position.sous)?.haute !== position.piece) {
      erreurs.push(`${position.id} : sous une liaison qui n'est pas haute de ce côté.`);
    }
  }
  for (const objet of monde.objets) {
    if (!pieces.has(objet.piece)) erreurs.push(`${objet.id} : pièce inconnue ${objet.piece}.`);
    for (const doses of [objet.soin, objet.extinction, objet.glissant, objet.rebouche]) if (!dosesValides(doses)) erreurs.push(`${objet.id} : doses invalides.`);
    if ([objet.soin, objet.extinction, objet.glissant, objet.rebouche].filter((doses) => doses !== undefined).length > 1) {
      erreurs.push(`${objet.id} : plus d'une qualité par dose.`);
    }
    if (objet.vitrageExterieur === true && objet.portable !== false) erreurs.push(`${objet.id} : vitrage portable.`);
    if (objet.rebouche !== undefined && objet.portable !== false) erreurs.push(`${objet.id} : kit de rustine portable.`);
    if (objet.protection === true && objet.portable === false) erreurs.push(`${objet.id} : protection qui ne se porte pas.`);
    if (objet.deplacable === true && objet.portable !== false) erreurs.push(`${objet.id} : déplaçable mais portable.`);
    if (objet.position !== undefined && positionsConnues.get(objet.position)?.piece !== objet.piece) erreurs.push(`${objet.id} : position hors de sa pièce.`);
    if (objet.position !== undefined && objet.deplacable !== true) erreurs.push(`${objet.id} : position sans être déplaçable.`);
    if (objet.avertisseur !== undefined) {
      if (!pieces.has(objet.avertisseur.piece)) erreurs.push(`${objet.id} : émetteur dans une pièce inconnue.`);
      if (objet.portable !== false) erreurs.push(`${objet.id} : avertisseur portable.`);
    }
    if (objet.capsule !== undefined) {
      const interieur = objet.capsule.interieur;
      if (!pieces.has(interieur)) erreurs.push(`${objet.id} : intérieur inconnu ${interieur}.`);
      if (interieur === objet.piece) erreurs.push(`${objet.id} : intérieur dans la pièce de la capsule.`);
      if (!monde.liaisons.some((liaison) => liaison.entre.includes(interieur) && liaison.entre.includes(objet.piece))) {
        erreurs.push(`${objet.id} : aucune liaison vers son intérieur.`);
      }
      if (objet.portable !== false) erreurs.push(`${objet.id} : capsule portable.`);
    }
    if (objet.alimente !== undefined) {
      if (objets.get(objet.alimente)?.capsule === undefined) erreurs.push(`${objet.id} : alimente autre chose qu'une capsule.`);
      if (objet.portable !== false) erreurs.push(`${objet.id} : console portable.`);
    }
    if (objet.depart !== undefined) {
      const capsule = objets.get(objet.depart)?.capsule;
      if (capsule === undefined) erreurs.push(`${objet.id} : lance autre chose qu'une capsule.`);
      else if (capsule.interieur !== objet.piece) erreurs.push(`${objet.id} : pupitre hors de l'intérieur de sa capsule.`);
      if (objet.portable !== false) erreurs.push(`${objet.id} : pupitre portable.`);
    }
  }
  const messages = new Set<string>();
  for (const message of monde.assistance ?? []) {
    if (message.id === '') erreurs.push('Message d\'assistance sans identifiant.');
    if (messages.has(message.id)) erreurs.push(`${message.id} : message d'assistance en double.`);
    messages.add(message.id);
    if (message.quand.type === 'arrivee' && !pieces.has(message.quand.piece)) erreurs.push(`${message.id} : pièce inconnue ${message.quand.piece}.`);
  }
  if (monde.creature !== undefined) {
    if (!pieces.has(monde.creature.piece)) erreurs.push(`Créature : pièce inconnue ${monde.creature.piece}.`);
    if (monde.creature.piece === monde.depart) erreurs.push('Créature dans la pièce de départ (GP-04).');
    if (monde.pieces.some((piece) => piece.id === monde.creature?.piece && piece.feu === true)) erreurs.push('Créature dans une pièce en feu.');
  }
  // Un plan impossible à dessiner rend le monde injouable, comme une station sans chemin sûr (14 §1).
  erreurs.push(...validerPlan(monde));
  return erreurs;
}

const index = new WeakMap<DefMonde, IndexMonde>();

export function indexer(monde: DefMonde): IndexMonde {
  const existant = index.get(monde);
  if (existant !== undefined) return existant;
  const erreurs = validerMonde(monde);
  if (erreurs.length > 0) throw new Error(`Monde ${monde.id} invalide : ${erreurs.join(' ')}`);
  const positions = monde.positions ?? [];
  const versPublic = new Map<string, string>();
  const versInterne = new Map<string, string>();
  for (const entite of [...monde.pieces, ...monde.liaisons, ...monde.objets, ...positions]) {
    const publicId = idPublic(monde.id, entite.id);
    versPublic.set(entite.id, publicId);
    versInterne.set(publicId, entite.id);
  }
  const resultat: IndexMonde = {
    pieces: new Map(monde.pieces.map((piece) => [piece.id, piece])),
    liaisons: new Map(monde.liaisons.map((liaison) => [liaison.id, liaison])),
    objets: new Map(monde.objets.map((objet) => [objet.id, objet])),
    positions: new Map(positions.map((position) => [position.id, position])),
    versPublic,
    versInterne,
  };
  index.set(monde, resultat);
  return resultat;
}
