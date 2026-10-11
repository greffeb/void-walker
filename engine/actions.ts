import { dangerConnu, type SonEmis } from './creature';
import type { Des } from './des';
import {
  autreCote,
  liaisonsDe,
  objetsDans,
  objetsPortes,
  refObjet,
  refPassage,
  refPiece,
  type EtatPartie,
} from './etat';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { Apercu, Consultation, Evenement, IdAction, RaisonRefus, Sante, Savoir } from './vocabulaire';

export interface Contexte {
  readonly monde: DefMonde;
  readonly etat: EtatPartie;
}

export interface Effet {
  readonly etat: EtatPartie;
  readonly evenements: readonly Evenement[];
  /** Sons produits par l'action, actifs pendant la réaction de ce pas (C-03 §3). */
  readonly sons?: readonly SonEmis[];
  /** Liaison franchie par le passager, que la créature a pu le voir prendre (D-177). */
  readonly franchie?: string;
}

/** Aperçu calculé sur ce que le passager sait seulement (C-06 §4), sans dé ni changement d'état ; `santeApres` si l'action change la santé avant le jet. */
export type Prevision = Omit<Apercu, 'commande'> & { readonly santeApres?: Sante };

interface ActionCommune {
  readonly id: IdAction;
  /** Cibles plausibles proposées au menu, d'après ce que le passager sait (C-01 §4). */
  cibles(contexte: Contexte): readonly string[];
  /** Revérifie une commande dans l'état courant ; `null` si elle peut être jouée. */
  verifier(contexte: Contexte, cible: string): RaisonRefus | null;
}

export interface ActionConsultation extends ActionCommune {
  readonly engage: false;
  consulter(contexte: Contexte, cible: string): Consultation;
}

export interface ActionEngagee extends ActionCommune {
  readonly engage: true;
  prevoir(contexte: Contexte, cible: string): Prevision;
  appliquer(contexte: Contexte, cible: string, des: Des): Effet;
}

export type DefAction = ActionConsultation | ActionEngagee;

function liaisonIci({ monde, etat }: Contexte, cible: string): DefLiaison | undefined {
  return liaisonsDe(monde, etat.piece).find((liaison) => liaison.id === cible);
}

function objetIci({ monde, etat }: Contexte, cible: string): boolean {
  return objetsDans(monde, etat, etat.piece).some((objet) => objet.id === cible);
}

function objetPorte({ monde, etat }: Contexte, cible: string): boolean {
  return objetsPortes(monde, etat).some((objet) => objet.id === cible);
}

/** Hors des repères de la créature (D-180, D-181), les mondes actuels n'ont ni danger connu ni dé : seul le bruit d'un geste s'annonce. */
const SANS_DANGER = { risque: 'aucun', danger: null, cout: 'aucun' } as const;

/** Risque d'un passage vers `piece` : celui de la créature vue ou entendue de l'autre côté, sinon aucun. */
function risqueVers({ monde, etat }: Contexte, piece: string): Pick<Prevision, 'risque' | 'danger'> {
  return dangerConnu(monde, etat, piece) ?? SANS_DANGER;
}

function passageIci(contexte: Contexte, cible: string): DefLiaison {
  const liaison = liaisonIci(contexte, cible);
  if (liaison === undefined) throw new Error(`Liaison absente : ${cible}.`);
  return liaison;
}

function basculer(contexte: Contexte, cible: string, ouverte: boolean): Effet {
  const { monde, etat } = contexte;
  const liaison = indexer(monde).liaisons.get(cible);
  if (liaison === undefined) throw new Error(`Liaison inconnue : ${cible}.`);
  const suivant: EtatPartie = { ...etat, liaisons: { ...etat.liaisons, [cible]: ouverte } };
  const passage = refPassage(monde, suivant, liaison, etat.piece);
  return { etat: suivant, evenements: [{ type: ouverte ? 'passage_ouvert' : 'passage_ferme', passage }] };
}

const regarder: ActionConsultation = {
  id: 'regarder',
  engage: false,
  cibles: (contexte) => {
    const { monde, etat } = contexte;
    return [
      etat.piece,
      ...objetsDans(monde, etat, etat.piece).map((objet) => objet.id),
      ...objetsPortes(monde, etat).map((objet) => objet.id),
      ...liaisonsDe(monde, etat.piece).map((liaison) => liaison.id),
    ];
  },
  verifier: (contexte, cible) =>
    cible === contexte.etat.piece ||
    objetIci(contexte, cible) ||
    objetPorte(contexte, cible) ||
    liaisonIci(contexte, cible) !== undefined
      ? null
      : 'cible_absente',
  consulter: (contexte, cible) => {
    const { monde, etat } = contexte;
    const liaison = liaisonIci(contexte, cible);
    if (liaison !== undefined) return { type: 'regarder_passage', cible: refPassage(monde, etat, liaison, etat.piece) };
    if (cible === etat.piece) return { type: 'regarder_piece', cible: refPiece(monde, cible) };
    return { type: 'regarder_objet', cible: refObjet(monde, cible) };
  },
};

const prendre: ActionEngagee = {
  id: 'prendre',
  engage: true,
  cibles: ({ monde, etat }) => objetsDans(monde, etat, etat.piece).map((objet) => objet.id),
  verifier: (contexte, cible) => (objetIci(contexte, cible) ? null : 'cible_absente'),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'portera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => {
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'passager' } } };
    return { etat: suivant, evenements: [{ type: 'objet_pris', objet: refObjet(monde, cible), piece: refPiece(monde, etat.piece) }] };
  },
};

const poser: ActionEngagee = {
  id: 'poser',
  engage: true,
  cibles: ({ monde, etat }) => objetsPortes(monde, etat).map((objet) => objet.id),
  verifier: (contexte, cible) => (objetPorte(contexte, cible) ? null : 'pas_en_main'),
  prevoir: ({ monde, etat }, cible) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'laissera', objet: refObjet(monde, cible), piece: refPiece(monde, etat.piece) }],
  }),
  appliquer: ({ monde, etat }, cible) => {
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'piece', piece: etat.piece } } };
    return { etat: suivant, evenements: [{ type: 'objet_pose', objet: refObjet(monde, cible), piece: refPiece(monde, etat.piece) }] };
  },
};

const ouvrir: ActionEngagee = {
  id: 'ouvrir',
  engage: true,
  cibles: ({ monde, etat }) =>
    liaisonsDe(monde, etat.piece)
      .filter((liaison) => etat.liaisons[liaison.id] !== true)
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    if (liaisonIci(contexte, cible) === undefined) return 'cible_absente';
    return contexte.etat.liaisons[cible] === true ? 'deja_ouvert' : null;
  },
  prevoir: (contexte, cible) => {
    const liaison = passageIci(contexte, cible);
    return {
      ...SANS_DANGER,
      // Ouvrir sur la pièce où elle a été perçue s'annonce comme y aller (choix du porteur, D-180).
      ...risqueVers(contexte, autreCote(liaison, contexte.etat.piece)),
      // Un mécanisme grippé se voit et s'annonce avant d'ouvrir (AR-01 §13 P-A, AR-02 §10 « porte grippée »).
      cout: liaison.bruyante === true ? 'bruyant' : 'aucun',
      savoir: [{ type: 'ouvrira', passage: refPassage(contexte.monde, contexte.etat, liaison, contexte.etat.piece) }],
    };
  },
  appliquer: (contexte, cible) => {
    const effet = basculer(contexte, cible, true);
    const liaison = passageIci(contexte, cible);
    if (liaison.bruyante !== true) return effet;
    const passage = refPassage(contexte.monde, effet.etat, liaison, contexte.etat.piece);
    return {
      ...effet,
      evenements: [...effet.evenements, { type: 'bruit_mecanisme', passage }],
      sons: [{ piece: contexte.etat.piece, intensite: 'normal' }],
    };
  },
};

const fermer: ActionEngagee = {
  id: 'fermer',
  engage: true,
  cibles: ({ monde, etat }) =>
    liaisonsDe(monde, etat.piece)
      .filter((liaison) => etat.liaisons[liaison.id] === true)
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    if (liaisonIci(contexte, cible) === undefined) return 'cible_absente';
    return contexte.etat.liaisons[cible] === true ? null : 'deja_ferme';
  },
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'fermera', passage: refPassage(contexte.monde, contexte.etat, passageIci(contexte, cible), contexte.etat.piece) }],
  }),
  appliquer: (contexte, cible) => basculer(contexte, cible, false),
};

const aller: ActionEngagee = {
  id: 'aller',
  engage: true,
  cibles: ({ monde, etat }) => liaisonsDe(monde, etat.piece).map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    if (liaisonIci(contexte, cible) === undefined) return 'cible_absente';
    return contexte.etat.liaisons[cible] === true ? null : 'ferme';
  },
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    ...risqueVers(contexte, autreCote(passageIci(contexte, cible), contexte.etat.piece)),
    savoir: [{ type: 'quittera', piece: refPiece(contexte.monde, contexte.etat.piece) }],
  }),
  appliquer: (contexte, cible) => {
    const { monde, etat } = contexte;
    const liaison = liaisonIci(contexte, cible);
    if (liaison === undefined) throw new Error(`Liaison absente : ${cible}.`);
    const arrivee = autreCote(liaison, etat.piece);
    const nouvelle = !etat.visitees.includes(arrivee);
    const suivant: EtatPartie = { ...etat, piece: arrivee, visitees: nouvelle ? [...etat.visitees, arrivee] : etat.visitees };
    const piece = refPiece(monde, arrivee);
    const evenements: Evenement[] = [{ type: 'deplacement', passage: refPassage(monde, etat, liaison, etat.piece), piece }];
    if (nouvelle) evenements.push({ type: 'piece_decouverte', piece });
    return { etat: suivant, evenements, franchie: liaison.id };
  },
};

/** Soin en main ou posé dans la pièce (D-185). */
function soinsAPortee({ monde, etat }: Contexte): DefObjet[] {
  return [...objetsDans(monde, etat, etat.piece), ...objetsPortes(monde, etat)].filter((objet) => objet.soin !== undefined);
}

/** Un soin améliore d'un état et consomme une dose ; indemne, il est indisponible plutôt que gaspillé (C-04 §2). */
const soigner: ActionEngagee = {
  id: 'soigner',
  engage: true,
  cibles: (contexte) => soinsAPortee(contexte).map((objet) => objet.id),
  verifier: (contexte, cible) => {
    if (!soinsAPortee(contexte).some((objet) => objet.id === cible)) return 'cible_absente';
    if ((contexte.etat.doses[cible] ?? 0) === 0) return 'vide';
    return contexte.etat.sante === 'blesse' || contexte.etat.sante === 'critique' ? null : 'pas_blesse';
  },
  prevoir: ({ monde, etat }, cible) => {
    const savoir: Savoir[] = [{ type: 'soignera' }];
    if (etat.doses[cible] === 1) savoir.push({ type: 'videra', objet: refObjet(monde, cible) });
    return { ...SANS_DANGER, savoir, santeApres: etat.sante === 'critique' ? 'blesse' : 'indemne' };
  },
  appliquer: ({ monde, etat }, cible) => {
    const gueri = etat.sante === 'blesse';
    const suivant: EtatPartie = { ...etat, sante: gueri ? 'indemne' : 'blesse', doses: { ...etat.doses, [cible]: (etat.doses[cible] ?? 0) - 1 } };
    return { etat: suivant, evenements: [{ type: gueri ? 'soin_indemne' : 'soin_blesse', objet: refObjet(monde, cible) }] };
  },
};

/** Catalogue unique (C-01 §2) : construit le menu et valide les commandes. */
export const CATALOGUE: Readonly<Record<IdAction, DefAction>> = { regarder, prendre, poser, ouvrir, fermer, aller, soigner };
