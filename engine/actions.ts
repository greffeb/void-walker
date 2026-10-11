import { dangerConnu, type SonEmis } from './creature';
import type { Des } from './des';
import {
  autreCote,
  cleZone,
  decouvrir,
  destinationConnue,
  enFeu,
  horsDePortee,
  huilee,
  liaisonsDe,
  liaisonsVisibles,
  manoeuvrable,
  objetsDans,
  objetsPortes,
  porteLarge,
  refObjet,
  refPassage,
  refPiece,
  refPosition,
  signalee,
  sourcesDe,
  type EtatPartie,
} from './etat';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { Apercu, Consultation, Evenement, IdAction, RaisonRefus, RefPassage, RefPiece, Sante, Savoir, SourceEvacuation } from './vocabulaire';

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
  /** La capsule part, alimentée par ces sources : la conclusion du pas décide si l'évacuation a lieu. */
  readonly evacuation?: readonly SourceEvacuation[];
}

/** Aperçu calculé sur ce que le passager sait seulement (C-06 §4), sans dé ni changement d'état ; `santeApres` si l'action change la santé avant le jet. */
export type Prevision = Omit<Apercu, 'commande'> & { readonly santeApres?: Sante };

interface ActionCommune {
  readonly id: IdAction;
  /** Cibles plausibles proposées au menu, d'après ce que le passager sait (C-01 §4). */
  cibles(contexte: Contexte): readonly string[];
  /** Revérifie une commande dans l'état courant ; `null` si elle peut être jouée. Le paramètre est vérifié à part. */
  verifier(contexte: Contexte, cible: string): RaisonRefus | null;
}

export interface ActionConsultation extends ActionCommune {
  readonly engage: false;
  consulter(contexte: Contexte, cible: string): Consultation;
}

export interface ActionEngagee extends ActionCommune {
  readonly engage: true;
  /** Paramètres possibles pour cette cible (12 §3.5, étape « OÙ ? ») ; absent pour une action sans paramètre. */
  parametres?(contexte: Contexte, cible: string): readonly string[];
  prevoir(contexte: Contexte, cible: string, parametre: string | undefined): Prevision;
  appliquer(contexte: Contexte, cible: string, des: Des, parametre: string | undefined): Effet;
}

export type DefAction = ActionConsultation | ActionEngagee;

/** Liaison que le passager perçoit dans sa pièce : une liaison cachée non découverte n'existe pas de son côté caché (K-05). */
function liaisonIci({ monde, etat }: Contexte, cible: string): DefLiaison | undefined {
  return liaisonsVisibles(monde, etat, etat.piece).find((liaison) => liaison.id === cible);
}

/** Ouverte ou fermée depuis ici : vue, et manoeuvrable de ce côté. */
function manoeuvrableIci(contexte: Contexte, cible: string): DefLiaison | undefined {
  const liaison = liaisonIci(contexte, cible);
  return liaison !== undefined && manoeuvrable(liaison, contexte.etat.piece) ? liaison : undefined;
}

/** Une liaison cachée non découverte se voit de l'autre côté comme un passage fermé, qu'on ne franchit pas (K-05). */
function franchissable(contexte: Contexte, liaison: DefLiaison): boolean {
  return liaison.cachee === undefined || contexte.etat.decouvertes.includes(liaison.id);
}

function objetIci({ monde, etat }: Contexte, cible: string): boolean {
  return objetsDans(monde, etat, etat.piece).some((objet) => objet.id === cible);
}

function objetPorte({ monde, etat }: Contexte, cible: string): boolean {
  return objetsPortes(monde, etat).some((objet) => objet.id === cible);
}

function objet(monde: DefMonde, id: string): DefObjet {
  const trouve = indexer(monde).objets.get(id);
  if (trouve === undefined) throw new Error(`Objet inconnu : ${id}.`);
  return trouve;
}

function exiger<T>(valeur: T | undefined, message: string): T {
  if (valeur === undefined) throw new Error(message);
  return valeur;
}

/** Hors des repères de la créature (D-180, D-181) et du feu (D-188), une action n'a ni danger connu ni dé : seul le bruit d'un geste s'annonce. */
const SANS_DANGER = { risque: 'aucun', danger: null, cout: 'aucun' } as const;

/** Risque d'un passage vers `piece` : celui de la créature vue ou entendue de l'autre côté, sinon aucun. */
function risqueVers({ monde, etat }: Contexte, piece: string): Pick<Prevision, 'risque' | 'danger'> {
  return dangerConnu(monde, etat, piece) ?? SANS_DANGER;
}

/** Risque du passage : sans destination connue, rien ne dit au passager ce qui l'attend derrière (C-06 §4). */
function risquePar(contexte: Contexte, liaison: DefLiaison): Pick<Prevision, 'risque' | 'danger'> {
  return destinationConnue(contexte.etat, liaison) ? risqueVers(contexte, autreCote(liaison, contexte.etat.piece)) : SANS_DANGER;
}

function passageIci(contexte: Contexte, cible: string): DefLiaison {
  return exiger(liaisonIci(contexte, cible), `Liaison absente : ${cible}.`);
}

/** Ouvrir, fermer ou franchir une liaison : déjà dans la pièce, à portée (C-02 §5, 12 §4.5). */
function verifierPassage(contexte: Contexte, cible: string): RaisonRefus | null {
  const liaison = liaisonIci(contexte, cible);
  if (liaison === undefined) return 'cible_absente';
  return horsDePortee(contexte.monde, contexte.etat, liaison, contexte.etat.piece) ? 'hors_de_portee' : null;
}

function basculer(contexte: Contexte, cible: string, ouverte: boolean): Effet {
  const { monde, etat } = contexte;
  const liaison = exiger(indexer(monde).liaisons.get(cible), `Liaison inconnue : ${cible}.`);
  const suivant: EtatPartie = { ...etat, liaisons: { ...etat.liaisons, [cible]: ouverte } };
  const passage = refPassage(monde, suivant, liaison, etat.piece);
  const evenements: Evenement[] = [{ type: ouverte ? 'passage_ouvert' : 'passage_ferme', passage }];
  // Ouvrir sur un foyer le montre (AR-01 P-B pas 4).
  if (passage.feu) evenements.push({ type: 'feu_derriere', passage });
  return { etat: suivant, evenements };
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
      ...liaisonsVisibles(monde, etat, etat.piece).map((liaison) => liaison.id),
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

/** Les objets qui ne se portent pas (caisse, dispositif fixe) ne sont pas proposés (C-02 §4.3). */
function portablesIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.portable !== false);
}

const prendre: ActionEngagee = {
  id: 'prendre',
  engage: true,
  cibles: (contexte) => portablesIci(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => (portablesIci(contexte).some((candidat) => candidat.id === cible) ? null : 'cible_absente'),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'portera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => {
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'passager' } } };
    return { etat: suivant, evenements: [{ type: 'objet_pris', objet: refObjet(monde, cible), piece: refPiece(monde, etat.piece) }] };
  },
};

const poser: ActionEngagee = {
  id: 'poser',
  engage: true,
  cibles: ({ monde, etat }) => objetsPortes(monde, etat).map((porte) => porte.id),
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
  cibles: (contexte) =>
    liaisonsVisibles(contexte.monde, contexte.etat, contexte.etat.piece)
      .filter((liaison) => contexte.etat.liaisons[liaison.id] !== true && manoeuvrable(liaison, contexte.etat.piece))
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    if (manoeuvrableIci(contexte, cible) === undefined) return 'cible_absente';
    return contexte.etat.liaisons[cible] === true ? 'deja_ouvert' : verifierPassage(contexte, cible);
  },
  prevoir: (contexte, cible) => {
    const liaison = passageIci(contexte, cible);
    return {
      ...SANS_DANGER,
      // Ouvrir sur la pièce où elle a été perçue s'annonce comme y aller (choix du porteur, D-180).
      ...risquePar(contexte, liaison),
      // Un mécanisme grippé se voit et s'annonce avant d'ouvrir (AR-01 §13 P-A, AR-02 §10 « porte grippée »).
      cout: liaison.bruyante === true ? 'bruyant' : 'aucun',
      savoir: [{ type: 'ouvrira', passage: refPassage(contexte.monde, contexte.etat, liaison, contexte.etat.piece) }],
    };
  },
  appliquer: (contexte, cible) => {
    const { monde, etat } = contexte;
    const liaison = passageIci(contexte, cible);
    const effet = basculer(contexte, cible, true);
    let suivant = effet.etat;
    const evenements = [...effet.evenements];
    // Ouvrir un passage caché le découvre et révèle sa destination (K-05).
    if (liaison.cachee !== undefined && !etat.decouvertes.includes(liaison.id)) {
      suivant = { ...suivant, decouvertes: decouvrir(monde, suivant, liaison.id) };
      evenements.push({ type: 'passage_decouvert', passage: refPassage(monde, suivant, liaison, etat.piece) });
    }
    if (liaison.bruyante !== true) return { etat: suivant, evenements };
    const passage = refPassage(monde, suivant, liaison, etat.piece);
    return {
      etat: suivant,
      evenements: [...evenements, { type: 'bruit_mecanisme', passage }],
      sons: [{ piece: etat.piece, intensite: 'normal' }],
    };
  },
};

const fermer: ActionEngagee = {
  id: 'fermer',
  engage: true,
  cibles: (contexte) =>
    liaisonsVisibles(contexte.monde, contexte.etat, contexte.etat.piece)
      .filter((liaison) => contexte.etat.liaisons[liaison.id] === true && manoeuvrable(liaison, contexte.etat.piece))
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    if (manoeuvrableIci(contexte, cible) === undefined) return 'cible_absente';
    return contexte.etat.liaisons[cible] === true ? verifierPassage(contexte, cible) : 'deja_ferme';
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
  cibles: (contexte) =>
    liaisonsVisibles(contexte.monde, contexte.etat, contexte.etat.piece)
      .filter((liaison) => franchissable(contexte, liaison))
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    const liaison = liaisonIci(contexte, cible);
    if (liaison === undefined || !franchissable(contexte, liaison)) return 'cible_absente';
    if (contexte.etat.liaisons[cible] !== true) return 'ferme';
    const portee = verifierPassage(contexte, cible);
    if (portee !== null) return portee;
    // Le gabarit d'un passage étroit se voit, même sans destination connue (D-044).
    return liaison.etroite === true && porteLarge(contexte.monde, contexte.etat) ? 'trop_large' : null;
  },
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    ...risquePar(contexte, passageIci(contexte, cible)),
    savoir: [{ type: 'quittera', piece: refPiece(contexte.monde, contexte.etat.piece) }],
  }),
  appliquer: (contexte, cible) => {
    const { monde, etat } = contexte;
    const liaison = passageIci(contexte, cible);
    const arrivee = autreCote(liaison, etat.piece);
    const nouvelle = !etat.visitees.includes(arrivee);
    const suivant: EtatPartie = {
      ...etat,
      piece: arrivee,
      visitees: nouvelle ? [...etat.visitees, arrivee] : etat.visitees,
      // Franchir un passage sans signalétique en apprend la destination, des deux côtés (K-05).
      decouvertes: signalee(liaison) ? etat.decouvertes : decouvrir(monde, etat, liaison.id),
    };
    const piece = refPiece(monde, arrivee);
    const evenements: Evenement[] = [{ type: 'deplacement', passage: refPassage(monde, etat, liaison, etat.piece), piece }];
    if (nouvelle) evenements.push({ type: 'piece_decouverte', piece });
    return { etat: suivant, evenements, franchie: liaison.id };
  },
};

/** Soin en main ou posé dans la pièce (D-185). */
function soinsAPortee({ monde, etat }: Contexte): DefObjet[] {
  return [...objetsDans(monde, etat, etat.piece), ...objetsPortes(monde, etat)].filter((candidat) => candidat.soin !== undefined);
}

/** Un soin améliore d'un état et consomme une dose ; indemne, il est indisponible plutôt que gaspillé (C-04 §2). */
const soigner: ActionEngagee = {
  id: 'soigner',
  engage: true,
  cibles: (contexte) => soinsAPortee(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => {
    if (!soinsAPortee(contexte).some((candidat) => candidat.id === cible)) return 'cible_absente';
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

function deplacablesIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.deplacable === true);
}

/** Pousser un objet au sol vers une autre position de la pièce (C-02 §4.3, AR-01 P-A pas 2) ; geste discret (AR-01 §12). */
const deplacer: ActionEngagee = {
  id: 'deplacer',
  engage: true,
  cibles: (contexte) => deplacablesIci(contexte).map((candidat) => candidat.id),
  parametres: ({ monde, etat }, cible) => {
    const emplacement = etat.objets[cible];
    const actuelle = emplacement?.type === 'piece' ? emplacement.position : undefined;
    return (monde.positions ?? []).filter((position) => position.piece === etat.piece && position.id !== actuelle).map((position) => position.id);
  },
  verifier: (contexte, cible) => (deplacablesIci(contexte).some((candidat) => candidat.id === cible) ? null : 'cible_absente'),
  prevoir: ({ monde }, cible, parametre) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'deplacera', objet: refObjet(monde, cible), position: refPosition(monde, exiger(parametre, 'Position absente.')) }],
  }),
  appliquer: ({ monde, etat }, cible, _des, parametre) => {
    const position = exiger(parametre, 'Position absente.');
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'piece', piece: etat.piece, position } } };
    return { etat: suivant, evenements: [{ type: 'objet_deplace', objet: refObjet(monde, cible), position: refPosition(monde, position) }] };
  },
};

function portesAvec({ monde, etat }: Contexte, qualite: 'extinction' | 'glissant'): DefObjet[] {
  return objetsPortes(monde, etat).filter((candidat) => candidat[qualite] !== undefined);
}

/** Récipient porté et non vide ; posé ou sans la qualité, il n'est pas proposé (C-02 §5). */
function verifierRecipient(contexte: Contexte, cible: string, qualite: 'extinction' | 'glissant'): RaisonRefus | null {
  if (!portesAvec(contexte, qualite).some((candidat) => candidat.id === cible)) return objetPorte(contexte, cible) ? 'cible_absente' : 'pas_en_main';
  return (contexte.etat.doses[cible] ?? 0) === 0 ? 'vide' : null;
}

function savoirDose({ monde, etat }: Contexte, cible: string): Savoir[] {
  return etat.doses[cible] === 1 ? [{ type: 'videra', objet: refObjet(monde, cible) }] : [];
}

/** Foyers à portée (C-03 §5.3) : la pièce du passager, ou une voisine par un passage ouvert, depuis le seuil. */
function foyersAPortee({ monde, etat }: Contexte): string[] {
  const voisines = liaisonsVisibles(monde, etat, etat.piece).filter((liaison) => etat.liaisons[liaison.id] === true && enFeu(etat, autreCote(liaison, etat.piece)));
  return [...(enFeu(etat, etat.piece) ? [etat.piece] : []), ...voisines.map((liaison) => liaison.id)];
}

/** Pièce que l'eau éteindra : la sienne, ou celle derrière le passage choisi. */
function pieceArrosee({ monde, etat }: Contexte, parametre: string): string {
  if (parametre === etat.piece) return parametre;
  return autreCote(exiger(indexer(monde).liaisons.get(parametre), `Liaison inconnue : ${parametre}.`), etat.piece);
}

/** Foyer visé, tel que le passager le connaît : la pièce, ou le passage seul tant que sa destination est inconnue (C-06 OP-03). */
function foyerVise({ monde }: Contexte, etat: EtatPartie, parametre: string): RefPiece | RefPassage {
  const liaison = parametre === etat.piece ? undefined : indexer(monde).liaisons.get(parametre);
  if (liaison === undefined || destinationConnue(etat, liaison)) return refPiece(monde, pieceArrosee({ monde, etat }, parametre));
  return refPassage(monde, etat, liaison, etat.piece);
}

/** Une dose d'extinction adaptée éteint le foyer visé (C-02 §5, AR-01 P-B pas 5). */
const arroser: ActionEngagee = {
  id: 'arroser',
  engage: true,
  cibles: (contexte) => portesAvec(contexte, 'extinction').map((candidat) => candidat.id),
  parametres: foyersAPortee,
  verifier: (contexte, cible) => verifierRecipient(contexte, cible, 'extinction'),
  prevoir: (contexte, cible, parametre) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'eteindra', piece: foyerVise(contexte, contexte.etat, exiger(parametre, 'Foyer absent.')) }, ...savoirDose(contexte, cible)],
  }),
  appliquer: (contexte, cible, _des, parametre) => {
    const { monde, etat } = contexte;
    const vise = exiger(parametre, 'Foyer absent.');
    const piece = pieceArrosee(contexte, vise);
    const suivant: EtatPartie = {
      ...etat,
      doses: { ...etat.doses, [cible]: (etat.doses[cible] ?? 0) - 1 },
      feu: etat.feu.filter((brule) => brule !== piece),
      expositions: etat.expositions.filter((id) => !indexer(monde).liaisons.get(id)?.entre.includes(piece)),
    };
    return { etat: suivant, evenements: [{ type: 'feu_eteint', piece: foyerVise(contexte, suivant, vise) }] };
  },
};

/** Une dose de liquide glissant rend glissant le pied d'un passage de la pièce, de ce côté, même fermé (C-03 §5.2, D-190). */
const verser: ActionEngagee = {
  id: 'verser',
  engage: true,
  cibles: (contexte) => portesAvec(contexte, 'glissant').map((candidat) => candidat.id),
  parametres: ({ monde, etat }) =>
    liaisonsVisibles(monde, etat, etat.piece)
      .filter((liaison) => !huilee(etat, liaison.id, etat.piece))
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => verifierRecipient(contexte, cible, 'glissant'),
  prevoir: (contexte, cible, parametre) => ({
    ...SANS_DANGER,
    savoir: [
      { type: 'huilera', passage: refPassage(contexte.monde, contexte.etat, passageIci(contexte, exiger(parametre, 'Passage absent.')), contexte.etat.piece) },
      ...savoirDose(contexte, cible),
    ],
  }),
  appliquer: (contexte, cible, _des, parametre) => {
    const { monde, etat } = contexte;
    const liaison = passageIci(contexte, exiger(parametre, 'Passage absent.'));
    const huile = [...etat.huile, { liaison: liaison.id, piece: etat.piece }].sort((a, b) => cleZone(a).localeCompare(cleZone(b)));
    const suivant: EtatPartie = { ...etat, doses: { ...etat.doses, [cible]: (etat.doses[cible] ?? 0) - 1 }, huile };
    const passage = refPassage(monde, suivant, liaison, etat.piece);
    return { etat: suivant, evenements: [{ type: 'huile_versee', objet: refObjet(monde, cible), passage }] };
  },
};

/** Réactions couvertes par le son de l'avertisseur : celle de l'activation et les deux suivantes (C-03 §5.1, T-04). */
export const DUREE_ALARME = 3;

function avertisseursIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.avertisseur !== undefined);
}

/** Lancer le test de l'avertisseur (C-03 §5.1) ; « test en cours » tant que le cycle dure. */
const declencher: ActionEngagee = {
  id: 'declencher',
  engage: true,
  cibles: (contexte) => avertisseursIci(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => {
    if (!avertisseursIci(contexte).some((candidat) => candidat.id === cible)) return 'cible_absente';
    return contexte.etat.alarme === null ? null : 'test_en_cours';
  },
  prevoir: ({ monde }, cible) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'sonnera', piece: refPiece(monde, exiger(objet(monde, cible).avertisseur, 'Avertisseur absent.').piece) }],
  }),
  appliquer: ({ monde, etat }, cible) => ({
    etat: { ...etat, alarme: { objet: cible, restant: DUREE_ALARME } },
    evenements: [{ type: 'alarme_declenchee', objet: refObjet(monde, cible) }],
  }),
};

function consolesIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.alimente !== undefined);
}

/** Réarmer le circuit d'une console : il alimentera sa capsule ; le relais claque fort dans la pièce (AR-01 §11.2). */
const activer: ActionEngagee = {
  id: 'activer',
  engage: true,
  cibles: (contexte) => consolesIci(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => {
    if (!consolesIci(contexte).some((candidat) => candidat.id === cible)) return 'cible_absente';
    return contexte.etat.actives.includes(cible) ? 'deja_actif' : null;
  },
  prevoir: ({ monde }, cible) => ({
    ...SANS_DANGER,
    cout: 'bruyant',
    savoir: [{ type: 'alimentera', objet: refObjet(monde, exiger(objet(monde, cible).alimente, 'Capsule absente.')) }],
  }),
  appliquer: ({ monde, etat }, cible) => ({
    etat: { ...etat, actives: monde.objets.filter((candidat) => candidat.id === cible || etat.actives.includes(candidat.id)).map((candidat) => candidat.id) },
    evenements: [{ type: 'circuit_active', objet: refObjet(monde, cible) }],
    sons: [{ piece: etat.piece, intensite: 'fort' }],
  }),
};

function capsuleIci({ monde, etat }: Contexte): DefObjet | undefined {
  return objetsDans(monde, etat, etat.piece).find((candidat) => candidat.capsule !== undefined);
}

function sourcesPortees({ monde, etat }: Contexte): DefObjet[] {
  return objetsPortes(monde, etat).filter((candidat) => candidat.source === true);
}

/** Installer une source portée dans la capsule de la pièce : elle l'alimente (AR-01 §11.2) ; geste discret. */
const installer: ActionEngagee = {
  id: 'installer',
  engage: true,
  cibles: (contexte) => (capsuleIci(contexte) === undefined ? [] : sourcesPortees(contexte).map((candidat) => candidat.id)),
  verifier: (contexte, cible) => {
    if (!sourcesPortees(contexte).some((candidat) => candidat.id === cible)) return objetPorte(contexte, cible) ? 'cible_absente' : 'pas_en_main';
    return capsuleIci(contexte) === undefined ? 'cible_absente' : null;
  },
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    savoir: [
      { type: 'installera', objet: refObjet(contexte.monde, cible), capsule: refObjet(contexte.monde, exiger(capsuleIci(contexte), 'Capsule absente.').id) },
    ],
  }),
  appliquer: (contexte, cible) => {
    const { monde, etat } = contexte;
    const capsule = exiger(capsuleIci(contexte), 'Capsule absente.');
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'installe', dans: capsule.id } } };
    return { etat: suivant, evenements: [{ type: 'objet_installe', objet: refObjet(monde, cible), capsule: refObjet(monde, capsule.id) }] };
  },
};

function pupitresIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.depart !== undefined);
}

/** Lancer la capsule : alimentée, pièce close, créature hors de bord (AR-01 §11.2) ; la conclusion du pas décide. */
const lancer: ActionEngagee = {
  id: 'lancer',
  engage: true,
  cibles: (contexte) => pupitresIci(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => {
    const { monde, etat } = contexte;
    if (!pupitresIci(contexte).some((candidat) => candidat.id === cible)) return 'cible_absente';
    if (sourcesDe(monde, etat, exiger(objet(monde, cible).depart, 'Capsule absente.')).length === 0) return 'non_alimentee';
    if (liaisonsDe(monde, etat.piece).some((liaison) => etat.liaisons[liaison.id] === true)) return 'non_isolee';
    return etat.creature?.piece === etat.piece ? 'creature_a_bord' : null;
  },
  prevoir: () => ({ ...SANS_DANGER, savoir: [{ type: 'partira' }] }),
  appliquer: ({ monde, etat }, cible) => ({
    etat,
    evenements: [],
    evacuation: sourcesDe(monde, etat, exiger(objet(monde, cible).depart, 'Capsule absente.')),
  }),
};

/** Catalogue unique (C-01 §2) : construit le menu et valide les commandes. */
export const CATALOGUE: Readonly<Record<IdAction, DefAction>> = {
  regarder,
  prendre,
  poser,
  ouvrir,
  fermer,
  aller,
  soigner,
  deplacer,
  arroser,
  verser,
  declencher,
  activer,
  installer,
  lancer,
};
