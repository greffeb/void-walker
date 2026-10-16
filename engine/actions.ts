import { dangerConnu, type SonEmis } from './creature';
import type { Des } from './des';
import {
  assourdie,
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
  objetsEnMain,
  objetsPortes,
  pontsDe,
  pontSur,
  porteLarge,
  protectionEnfilee,
  refObjet,
  refPassage,
  refPiece,
  refPosition,
  sansGravite,
  signalee,
  sourcesDe,
  verrouillee,
  type Alarme,
  type EtatPartie,
} from './etat';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { Apercu, Consultation, Cout, Evenement, IdAction, RaisonRefus, RefPassage, RefPiece, Sante, Savoir, SourceEvacuation } from './vocabulaire';

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

/** Ouverte ou fermée depuis ici : vue, et manoeuvrable de ce côté ; un vide de passerelle n'a pas de porte (D-164). */
function manoeuvrableIci(contexte: Contexte, cible: string): DefLiaison | undefined {
  const liaison = liaisonIci(contexte, cible);
  return liaison !== undefined && liaison.gouffre !== true && manoeuvrable(liaison, contexte.etat.piece) ? liaison : undefined;
}

/** Une liaison cachée non découverte se voit de l'autre côté comme un passage fermé, qu'on ne franchit pas (K-05). */
function franchissable(contexte: Contexte, liaison: DefLiaison): boolean {
  return liaison.cachee === undefined || contexte.etat.decouvertes.includes(liaison.id);
}

function objetIci({ monde, etat }: Contexte, cible: string): boolean {
  return [...objetsDans(monde, etat, etat.piece), ...pontsDe(monde, etat, etat.piece)].some((objet) => objet.id === cible);
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

/** Un geste bruyant s'annonce ; dans une salle des machines en marche, leur vacarme le couvre et rien n'en sort (D-163). */
function bruit({ monde, etat }: Contexte): Cout {
  return assourdie(monde, etat, etat.piece) ? 'aucun' : 'bruyant';
}

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
  if (verrouillee(contexte.etat, cible)) return 'verrouillee';
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
      ...pontsDe(monde, etat, etat.piece).map((objet) => objet.id),
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

/**
 * Les objets qui ne se portent pas (caisse, dispositif fixe) ne sont pas proposés (C-02 §4.3) ; un pont posé sur un vide de la
 * pièce se reprend de l'un ou l'autre bord (D-164).
 */
function portablesIci({ monde, etat }: Contexte): DefObjet[] {
  return [...objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.portable !== false), ...pontsDe(monde, etat, etat.piece)];
}

/** Un seul objet encombrant porté à la fois : en ramasser un second est refusé sans coût (D-079, MP-03). */
function encombre({ monde, etat }: Contexte, cible: DefObjet): boolean {
  return cible.encombrant === true && objetsPortes(monde, etat).some((porte) => porte.encombrant === true);
}

const prendre: ActionEngagee = {
  id: 'prendre',
  engage: true,
  cibles: (contexte) => portablesIci(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => {
    const candidat = portablesIci(contexte).find((objetIci) => objetIci.id === cible);
    if (candidat === undefined) return 'cible_absente';
    return encombre(contexte, candidat) ? 'encombre' : null;
  },
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'portera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => {
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'passager' } } };
    return { etat: suivant, evenements: [{ type: 'objet_pris', objet: refObjet(monde, cible), piece: refPiece(monde, etat.piece) }] };
  },
};

const poser: ActionEngagee = {
  id: 'poser',
  engage: true,
  // La combinaison enfilée se retire d'abord (détail de l'agent, #104 ; retirer : D-072).
  cibles: ({ monde, etat }) => objetsEnMain(monde, etat).map((porte) => porte.id),
  verifier: ({ monde, etat }, cible) => (objetsEnMain(monde, etat).some((porte) => porte.id === cible) ? null : 'pas_en_main'),
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
      .filter((liaison) => contexte.etat.liaisons[liaison.id] !== true && manoeuvrableIci(contexte, liaison.id) !== undefined)
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
      cout: liaison.bruyante === true ? bruit(contexte) : 'aucun',
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
    // Le son est émis quand même : la règle du vacarme, pas le geste, décide qu'il ne sort pas de la salle (D-163).
    const couvert = assourdie(monde, etat, etat.piece);
    return {
      etat: suivant,
      evenements: [...evenements, { type: couvert ? 'bruit_couvert' : 'bruit_mecanisme', passage }],
      sons: [{ piece: etat.piece, intensite: 'normal' }],
    };
  },
};

const fermer: ActionEngagee = {
  id: 'fermer',
  engage: true,
  cibles: (contexte) =>
    liaisonsVisibles(contexte.monde, contexte.etat, contexte.etat.piece)
      .filter((liaison) => contexte.etat.liaisons[liaison.id] === true && manoeuvrableIci(contexte, liaison.id) !== undefined)
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
    if (liaison.etroite === true && porteLarge(contexte.monde, contexte.etat)) return 'trop_large';
    // Un vide ne se franchit que sur un pont posé en travers (D-164).
    if (liaison.gouffre === true && pontSur(contexte.monde, contexte.etat, liaison.id) === undefined) return 'sans_pont';
    // Sans gravité, il faut d'abord dériver jusqu'à un autre passage que celui par où l'on est entré (D-237).
    return sansGravite(contexte.etat, contexte.etat.piece) && contexte.etat.bord !== liaison.id ? 'trop_loin' : null;
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
    const nouvelle = indexer(monde).pieces.get(arrivee)?.sousPosition !== true && !etat.visitees.includes(arrivee);
    const suivant: EtatPartie = {
      ...etat,
      piece: arrivee,
      visitees: nouvelle ? [...etat.visitees, arrivee] : etat.visitees,
      // Franchir un passage sans signalétique en apprend la destination, des deux côtés (K-05).
      decouvertes: signalee(liaison) ? etat.decouvertes : decouvrir(monde, etat, liaison.id),
      // Dans une zone à gravité commutable, on se tient au bord du passage par où l'on est entré (D-237).
      bord: indexer(monde).pieces.get(arrivee)?.gravite === undefined ? null : liaison.id,
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
  // Au pied d'une porte (D-190) : pas au bord du vide d'une passerelle, mélange non décidé (D-174).
  parametres: ({ monde, etat }) =>
    liaisonsVisibles(monde, etat, etat.piece)
      .filter((liaison) => liaison.gouffre !== true && !huilee(etat, liaison.id, etat.piece))
      .map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    const raison = verifierRecipient(contexte, cible, 'glissant');
    // Gravité coupée, l'huile ne se verse pas (MX-04).
    return raison ?? (sansGravite(contexte.etat, contexte.etat.piece) ? 'sans_gravite' : null);
  },
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

/**
 * Réactions couvertes par le son de l'avertisseur, du compresseur ou de la relance des machines : celle de l'activation et les
 * deux suivantes (C-03 §5.1, T-04, D-234).
 */
export const DUREE_ALARME = 3;

/** Lance le bruit fort de ce dispositif ; un seul en cours par dispositif, dans l'ordre du monde. */
function sonner(monde: DefMonde, alarmes: readonly Alarme[], objetId: string): Alarme[] {
  const suivantes = [...alarmes.filter((alarme) => alarme.objet !== objetId), { objet: objetId, restant: DUREE_ALARME }];
  const rang = (alarme: Alarme): number => monde.objets.findIndex((candidat) => candidat.id === alarme.objet);
  return suivantes.sort((a, b) => rang(a) - rang(b));
}

function avertisseursIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.avertisseur !== undefined);
}

/**
 * Lancer le test de l'avertisseur (C-03 §5.1), ou le compresseur (D-170, D-234) ; « test en cours » tant que son cycle dure. Un
 * émetteur dans la pièce même du passager rend le geste bruyant ; dans une autre pièce, sans coût (détail de #102).
 */
const declencher: ActionEngagee = {
  id: 'declencher',
  engage: true,
  cibles: (contexte) => avertisseursIci(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => {
    if (!avertisseursIci(contexte).some((candidat) => candidat.id === cible)) return 'cible_absente';
    return contexte.etat.alarmes.some((alarme) => alarme.objet === cible) ? 'test_en_cours' : null;
  },
  prevoir: (contexte, cible) => {
    const emetteur = exiger(objet(contexte.monde, cible).avertisseur, 'Avertisseur absent.').piece;
    return {
      ...SANS_DANGER,
      cout: emetteur === contexte.etat.piece ? bruit(contexte) : 'aucun',
      savoir: [{ type: 'sonnera', piece: refPiece(contexte.monde, emetteur) }],
    };
  },
  appliquer: ({ monde, etat }, cible) => ({
    etat: { ...etat, alarmes: sonner(monde, etat.alarmes, cible) },
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
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    cout: bruit(contexte),
    savoir: [{ type: 'alimentera', objet: refObjet(contexte.monde, exiger(objet(contexte.monde, cible).alimente, 'Capsule absente.')) }],
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

/** Protections à portée : dans la pièce (le casier) ou en main, tant qu'aucune n'est enfilée (AR-02 §5.2). */
function protectionsAPortee({ monde, etat }: Contexte): DefObjet[] {
  return [...objetsDans(monde, etat, etat.piece), ...objetsEnMain(monde, etat)].filter((candidat) => candidat.protection === true);
}

/** Enfiler une combinaison, depuis le casier ou en main : une action, protection complète, sans jauge (D-060, D-073). */
const enfiler: ActionEngagee = {
  id: 'enfiler',
  engage: true,
  cibles: (contexte) =>
    protectionEnfilee(contexte.monde, contexte.etat) === undefined ? protectionsAPortee(contexte).map((candidat) => candidat.id) : [],
  verifier: (contexte, cible) => {
    if (protectionEnfilee(contexte.monde, contexte.etat) !== undefined) return 'deja_enfilee';
    return protectionsAPortee(contexte).some((candidat) => candidat.id === cible) ? null : 'cible_absente';
  },
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'protegera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => ({
    etat: { ...etat, objets: { ...etat.objets, [cible]: { type: 'passager', enfile: true } } },
    evenements: [{ type: 'combinaison_enfilee', objet: refObjet(monde, cible) }],
  }),
};

/** Retirer la combinaison : une action, partout, gardée sur soi ; sans air, l'aperçu l'annonce mortel (D-072, D-073). */
const retirer: ActionEngagee = {
  id: 'retirer',
  engage: true,
  cibles: ({ monde, etat }) => {
    const enfilee = protectionEnfilee(monde, etat);
    return enfilee === undefined ? [] : [enfilee.id];
  },
  verifier: ({ monde, etat }, cible) => (protectionEnfilee(monde, etat)?.id === cible ? null : 'cible_absente'),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'gardera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => ({
    etat: { ...etat, objets: { ...etat.objets, [cible]: { type: 'passager' } } },
    evenements: [{ type: 'combinaison_retiree', objet: refObjet(monde, cible) }],
  }),
};

function vitragesIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.vitrageExterieur === true);
}

function outilEnMain({ monde, etat }: Contexte): boolean {
  return objetsEnMain(monde, etat).some((candidat) => candidat.perce === true);
}

/** Ajoute ou retire `id` d'une liste tenue dans l'ordre du monde. */
function basculerDans(monde: DefMonde, liste: readonly string[], id: string, present: boolean): string[] {
  return monde.objets.filter((candidat) => (candidat.id === id ? present : liste.includes(candidat.id))).map((candidat) => candidat.id);
}

/**
 * Percer un vitrage extérieur de la pièce avec un outil en main : une action, réussite sûre, sans dé ni bruit (D-064) ; le
 * vide se résout à la mise à jour des dangers du même pas (VP-01). Repercer après la rustine reste possible (D-068).
 */
const percer: ActionEngagee = {
  id: 'percer',
  engage: true,
  cibles: (contexte) =>
    outilEnMain(contexte) ? vitragesIci(contexte).filter((candidat) => !contexte.etat.breches.includes(candidat.id)).map((candidat) => candidat.id) : [],
  verifier: (contexte, cible) => {
    if (!vitragesIci(contexte).some((candidat) => candidat.id === cible) || !outilEnMain(contexte)) return 'cible_absente';
    return contexte.etat.breches.includes(cible) ? 'deja_percee' : null;
  },
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'percera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => ({
    etat: { ...etat, breches: basculerDans(monde, etat.breches, cible, true), rebouchees: basculerDans(monde, etat.rebouchees, cible, false) },
    evenements: [{ type: 'breche_ouverte', objet: refObjet(monde, cible) }],
  }),
};

function kitsIci({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.rebouche !== undefined);
}

/** Brèche de la pièce que la rustine refermera. */
function brecheIci({ monde, etat }: Contexte): DefObjet | undefined {
  return vitragesIci({ monde, etat }).find((candidat) => etat.breches.includes(candidat.id));
}

/** Reboucher la brèche de la pièce depuis le kit : une action, sans risque, une rustine consommée (D-066, D-068). */
const reboucher: ActionEngagee = {
  id: 'reboucher',
  engage: true,
  cibles: (contexte) => (brecheIci(contexte) === undefined ? [] : kitsIci(contexte).map((candidat) => candidat.id)),
  verifier: (contexte, cible) => {
    if (!kitsIci(contexte).some((candidat) => candidat.id === cible)) return 'cible_absente';
    if ((contexte.etat.doses[cible] ?? 0) === 0) return 'vide';
    return brecheIci(contexte) === undefined ? 'sans_breche' : null;
  },
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    savoir: [
      { type: 'rebouchera', objet: refObjet(contexte.monde, exiger(brecheIci(contexte), 'Brèche absente.').id) },
      ...savoirDose(contexte, cible),
    ],
  }),
  appliquer: (contexte, cible) => {
    const { monde, etat } = contexte;
    const breche = exiger(brecheIci(contexte), 'Brèche absente.').id;
    const suivant: EtatPartie = {
      ...etat,
      doses: { ...etat.doses, [cible]: (etat.doses[cible] ?? 0) - 1 },
      breches: basculerDans(monde, etat.breches, breche, false),
      rebouchees: basculerDans(monde, etat.rebouchees, breche, true),
    };
    return { etat: suivant, evenements: [{ type: 'breche_rebouchee', objet: refObjet(monde, breche) }] };
  },
};

/** Vides de la pièce sans pont posé en travers (D-164). */
function videsLibres({ monde, etat }: Contexte): DefLiaison[] {
  return liaisonsVisibles(monde, etat, etat.piece).filter((liaison) => liaison.gouffre === true && pontSur(monde, etat, liaison.id) === undefined);
}

function pontsEnMain({ monde, etat }: Contexte): DefObjet[] {
  return objetsEnMain(monde, etat).filter((candidat) => candidat.pont === true);
}

/** Poser un pont fragile en main en travers d'un vide de la pièce : une action ; on le reprend par « prendre » (D-164). */
const placer: ActionEngagee = {
  id: 'placer',
  engage: true,
  cibles: (contexte) => (videsLibres(contexte).length === 0 ? [] : pontsEnMain(contexte).map((candidat) => candidat.id)),
  parametres: (contexte) => videsLibres(contexte).map((liaison) => liaison.id),
  verifier: (contexte, cible) => {
    if (!pontsEnMain(contexte).some((candidat) => candidat.id === cible)) return objetPorte(contexte, cible) ? 'cible_absente' : 'pas_en_main';
    return videsLibres(contexte).length === 0 ? 'cible_absente' : null;
  },
  prevoir: (contexte, cible, parametre) => ({
    ...SANS_DANGER,
    savoir: [
      {
        type: 'placera',
        objet: refObjet(contexte.monde, cible),
        passage: refPassage(contexte.monde, contexte.etat, passageIci(contexte, exiger(parametre, 'Vide absent.')), contexte.etat.piece),
      },
    ],
  }),
  appliquer: (contexte, cible, _des, parametre) => {
    const { monde, etat } = contexte;
    const liaison = passageIci(contexte, exiger(parametre, 'Vide absent.'));
    const suivant: EtatPartie = { ...etat, objets: { ...etat.objets, [cible]: { type: 'pont', liaison: liaison.id } } };
    return { etat: suivant, evenements: [{ type: 'pont_place', objet: refObjet(monde, cible), passage: refPassage(monde, suivant, liaison, etat.piece) }] };
  },
};

/** Passages vers lesquels le passager peut dériver : gravité coupée, tous sauf celui au bord duquel il se tient (D-237). */
function deriveVers(contexte: Contexte): DefLiaison[] {
  const { monde, etat } = contexte;
  if (!sansGravite(etat, etat.piece)) return [];
  return liaisonsVisibles(monde, etat, etat.piece).filter((liaison) => liaison.id !== etat.bord && franchissable(contexte, liaison));
}

/** Sans gravité, se pousser jusqu'à un autre passage de la zone : une action, avant de pouvoir le franchir (D-237). */
const deriver: ActionEngagee = {
  id: 'deriver',
  engage: true,
  cibles: (contexte) => deriveVers(contexte).map((liaison) => liaison.id),
  verifier: (contexte, cible) => (deriveVers(contexte).some((liaison) => liaison.id === cible) ? null : 'cible_absente'),
  prevoir: (contexte, cible) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'derivera', passage: refPassage(contexte.monde, contexte.etat, passageIci(contexte, cible), contexte.etat.piece) }],
  }),
  appliquer: (contexte, cible) => {
    const { monde, etat } = contexte;
    return {
      etat: { ...etat, bord: cible },
      evenements: [{ type: 'derive', passage: refPassage(monde, etat, passageIci(contexte, cible), etat.piece) }],
    };
  },
};

/** Ajoute ou retire `id` d'une liste de pièces tenue dans l'ordre du monde. */
function basculerPiece(monde: DefMonde, liste: readonly string[], id: string, present: boolean): string[] {
  return monde.pieces.filter((piece) => (piece.id === id ? present : liste.includes(piece.id))).map((piece) => piece.id);
}

/** Interrupteurs des machines de la pièce dont les machines sont en marche (`marche`) ou arrêtées. */
function interrupteursMachines({ monde, etat }: Contexte, marche: boolean): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.machines !== undefined && etat.arretees.includes(candidat.machines) !== marche);
}

function verifierInterrupteur(trouves: readonly DefObjet[], tous: readonly DefObjet[], cible: string): RaisonRefus | null {
  if (trouves.some((candidat) => candidat.id === cible)) return null;
  return tous.some((candidat) => candidat.id === cible) ? 'deja_fait' : 'cible_absente';
}

/** Arrêter les machines depuis leur interrupteur : une action, la salle redevient ordinaire et le bruit d'une relance cesse (D-163). */
const arreter: ActionEngagee = {
  id: 'arreter',
  engage: true,
  cibles: (contexte) => interrupteursMachines(contexte, true).map((candidat) => candidat.id),
  verifier: (contexte, cible) => verifierInterrupteur(interrupteursMachines(contexte, true), interrupteursMachines(contexte, false), cible),
  prevoir: ({ monde }, cible) => ({
    ...SANS_DANGER,
    savoir: [{ type: 'arreteront', piece: refPiece(monde, exiger(objet(monde, cible).machines, 'Salle absente.')) }],
  }),
  appliquer: ({ monde, etat }, cible) => {
    const salle = exiger(objet(monde, cible).machines, 'Salle absente.');
    return {
      etat: { ...etat, arretees: basculerPiece(monde, etat.arretees, salle, true), alarmes: etat.alarmes.filter((alarme) => alarme.objet !== cible) },
      evenements: [{ type: 'machines_arretees', objet: refObjet(monde, cible) }],
    };
  },
};

/** Relancer les machines : une action, un grand bruit qui sort de la salle et dure comme le test de l'avertisseur (D-163, D-234). */
const relancer: ActionEngagee = {
  id: 'relancer',
  engage: true,
  cibles: (contexte) => interrupteursMachines(contexte, false).map((candidat) => candidat.id),
  verifier: (contexte, cible) => verifierInterrupteur(interrupteursMachines(contexte, false), interrupteursMachines(contexte, true), cible),
  prevoir: ({ monde }, cible) => ({
    ...SANS_DANGER,
    cout: 'bruyant',
    savoir: [{ type: 'relanceront', piece: refPiece(monde, exiger(objet(monde, cible).machines, 'Salle absente.')) }],
  }),
  appliquer: ({ monde, etat }, cible) => {
    const salle = exiger(objet(monde, cible).machines, 'Salle absente.');
    return {
      etat: { ...etat, arretees: basculerPiece(monde, etat.arretees, salle, false), alarmes: sonner(monde, etat.alarmes, cible) },
      evenements: [{ type: 'machines_relancees', objet: refObjet(monde, cible) }],
    };
  },
};

/** Interrupteurs de gravité de la pièce dont la zone a sa gravité (`retablie`) ou non. */
function interrupteursGravite({ monde, etat }: Contexte, retablie: boolean): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.gravite !== undefined && sansGravite(etat, candidat.gravite) !== retablie);
}

function basculerGravite(cible: string, coupee: boolean): (contexte: Contexte) => Effet {
  return ({ monde, etat }) => {
    const zone = exiger(objet(monde, cible).gravite, 'Zone absente.');
    return {
      etat: { ...etat, apesanteur: basculerPiece(monde, etat.apesanteur, zone, coupee) },
      evenements: [{ type: coupee ? 'gravite_coupee' : 'gravite_retablie', piece: refPiece(monde, zone) }],
    };
  };
}

/** Couper la gravité de la zone depuis un interrupteur d'une pièce qui la touche : une action, toujours alimenté (D-165, D-168). */
const couper: ActionEngagee = {
  id: 'couper',
  engage: true,
  cibles: (contexte) => interrupteursGravite(contexte, true).map((candidat) => candidat.id),
  verifier: (contexte, cible) => verifierInterrupteur(interrupteursGravite(contexte, true), interrupteursGravite(contexte, false), cible),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'coupera', piece: refPiece(monde, exiger(objet(monde, cible).gravite, 'Zone absente.')) }] }),
  appliquer: (contexte, cible) => basculerGravite(cible, true)(contexte),
};

const retablir: ActionEngagee = {
  id: 'retablir',
  engage: true,
  cibles: (contexte) => interrupteursGravite(contexte, false).map((candidat) => candidat.id),
  verifier: (contexte, cible) => verifierInterrupteur(interrupteursGravite(contexte, false), interrupteursGravite(contexte, true), cible),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'retablira', piece: refPiece(monde, exiger(objet(monde, cible).gravite, 'Zone absente.')) }] }),
  appliquer: (contexte, cible) => basculerGravite(cible, false)(contexte),
};

/** Portes de la chambre que le pupitre peut fermer : toutes, sauf un vide de passerelle, qui n'en a pas. */
function portesDe(monde: DefMonde, piece: string): DefLiaison[] {
  return liaisonsDe(monde, piece).filter((liaison) => liaison.gouffre !== true);
}

function pupitresFermeture({ monde, etat }: Contexte): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.fermeture !== undefined);
}

/**
 * Pupitre de fermeture : une action, les portes de la chambre froide se ferment d'un coup, hors de vue de qui est dedans (D-170,
 * D-239). Toujours offert : son option ne dit rien de portes que le passager n'a pas vues (C-01 §4, C-06 §5) ; déjà fermées,
 * elles le restent.
 */
const boucler: ActionEngagee = {
  id: 'boucler',
  engage: true,
  cibles: (contexte) => pupitresFermeture(contexte).map((candidat) => candidat.id),
  verifier: (contexte, cible) => (pupitresFermeture(contexte).some((candidat) => candidat.id === cible) ? null : 'cible_absente'),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'bouclera', piece: refPiece(monde, exiger(objet(monde, cible).fermeture, 'Chambre absente.')) }] }),
  appliquer: ({ monde, etat }, cible) => {
    const chambre = exiger(objet(monde, cible).fermeture, 'Chambre absente.');
    const fermees = Object.fromEntries(portesDe(monde, chambre).map((liaison) => [liaison.id, false]));
    return {
      etat: { ...etat, liaisons: { ...etat.liaisons, ...fermees } },
      evenements: [{ type: 'chambre_bouclee', objet: refObjet(monde, cible), piece: refPiece(monde, chambre) }],
    };
  },
};

/** Commandes de déverrouillage de la pièce dont la cloison est encore verrouillée (`verrouillees`), ou déjà levée. */
function commandesIci({ monde, etat }: Contexte, verrouillees: boolean): DefObjet[] {
  return objetsDans(monde, etat, etat.piece).filter((candidat) => candidat.deverrouille !== undefined && verrouillee(etat, candidat.deverrouille) === verrouillees);
}

/** Actionner une commande de déverrouillage : une action discrète, sa cloison n'est plus verrouillée pour la partie (D-259). */
const actionner: ActionEngagee = {
  id: 'actionner',
  engage: true,
  cibles: (contexte) => commandesIci(contexte, true).map((candidat) => candidat.id),
  verifier: (contexte, cible) => verifierInterrupteur(commandesIci(contexte, true), commandesIci(contexte, false), cible),
  prevoir: ({ monde }, cible) => ({ ...SANS_DANGER, savoir: [{ type: 'deverrouillera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => {
    const cloison = exiger(objet(monde, cible).deverrouille, 'Cloison absente.');
    return {
      etat: { ...etat, verrous: (etat.verrous ?? []).filter((id) => id !== cloison) },
      evenements: [{ type: 'cloison_deverrouillee', objet: refObjet(monde, cible) }],
    };
  },
};

/** Attendre : un tour sans rien faire, la créature réagit une fois et les dangers se propagent comme à toute action (D-274). */
const attendre: ActionEngagee = {
  id: 'attendre',
  engage: true,
  cibles: ({ etat }) => [etat.piece],
  verifier: ({ etat }, cible) => (cible === etat.piece ? null : 'cible_absente'),
  prevoir: () => ({ ...SANS_DANGER, savoir: [] }),
  appliquer: ({ etat }) => ({ etat, evenements: [{ type: 'attente' }] }),
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
  enfiler,
  retirer,
  percer,
  reboucher,
  placer,
  deriver,
  arreter,
  relancer,
  couper,
  retablir,
  boucler,
  actionner,
  attendre,
};
