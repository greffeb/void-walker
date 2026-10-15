import { former, nomDe, type TextesMonde } from '../content';
import {
  ACTIONS,
  apercu,
  CATALOGUE,
  type Cible,
  type DefMonde,
  type IdAction,
  type Observation,
  type OptionMenu,
  type Partie,
  type RefObjet,
  type RefPassage,
  type RefPiece,
} from '../engine';

// Organisation de l'écran de jeu (docs/12-interface-ecrans.md §3), sans React : partagée par l'appli et les captures.

/** Regard sur la pièce elle-même : libellé du réveil et rappel de l'arrivée (12 §3.3, §4.2). */
export const REGARDER_AUTOUR = 'Regarder autour de vous';

/** Une puce du dock et les options de sa cible. */
export interface Groupe {
  readonly cible: RefObjet | RefPassage;
  readonly options: readonly OptionMenu[];
}

export interface Dock {
  /** « Dans la pièce » : objets, et passages qui ne se savent pas encore passages (D-147). */
  readonly piece: readonly Groupe[];
  readonly autour: OptionMenu | undefined;
  /** « Se déplacer vers » : un bouton par passage connu, qui ouvre sa bulle : fiche, aller, ouvrir ou fermer (D-229). */
  readonly deplacements: readonly Deplacement[];
  /** Objets portés, ouverts par le bouton INVENTAIRE. */
  readonly inventaire: readonly Groupe[];
}

/** Bouton « Se déplacer vers » : le passage, ses options (« Aller » en tête) et le déplacement qui le nomme. */
export interface Deplacement extends Groupe {
  readonly cible: RefPassage;
  readonly aller: OptionMenu;
}

function grouper(cibles: readonly (RefObjet | RefPassage)[], options: readonly OptionMenu[]): Groupe[] {
  return cibles
    .map((cible) => ({ cible, options: options.filter((option) => option.cible.id === cible.id) }))
    .filter((groupe) => groupe.options.length > 0);
}

/**
 * Range chaque option du menu moteur à une seule place de l'écran (12 §3.4). `ouverts` : passages que le passager a déjà
 * ouverts, retrouvés dans l'enregistrement (`passagesOuverts`) ; refermés, ils restent des passages (D-229).
 */
export function composerDock(observation: Observation, ouverts: readonly string[] = []): Dock {
  const deplacements = observation.passages.flatMap((passage): Deplacement[] => {
    const options = observation.menu.filter((option) => option.cible.id === passage.id);
    const aller = options.find((option) => option.action === 'aller');
    if (aller === undefined || !connuCommePassage(passage, ouverts)) return [];
    return [{ cible: passage, aller, options: [aller, ...options.filter((option) => option !== aller)] }];
  });
  const autres = observation.menu.filter((option) => option.action !== 'aller' && !deplacements.some((deplacement) => deplacement.options.includes(option)));
  return {
    piece: grouper([...observation.objets, ...observation.passages], autres),
    autour: autres.find((option) => option.cible.sorte === 'piece'),
    deplacements,
    inventaire: grouper(observation.inventaire, autres),
  };
}

/**
 * Un passage sans signalétique reste un objet de la pièce tant que le passager ne l'a pas ouvert ; ensuite il se range avec
 * les portes, même refermé (D-147, D-229).
 */
function connuCommePassage(passage: RefPassage, ouverts: readonly string[]): boolean {
  return passage.signale || passage.ouvert || passage.vers !== null || ouverts.includes(passage.id);
}

/** Passages que le passager a ouverts au moins une fois, d'après les commandes enregistrées. */
export function passagesOuverts(partie: Partie): string[] {
  return partie.enregistrement.actions.flatMap(({ commande }) => (commande.action === 'ouvrir' ? [commande.cible] : []));
}

/** Première étape d'une bulle (12 §3.5) : la consultation est la fiche, gratuite (D-014) ; le reste, les actions. */
export interface Composition {
  readonly fiche: OptionMenu | undefined;
  readonly actions: readonly OptionMenu[];
}

export function composer(groupe: Groupe): Composition {
  return {
    fiche: groupe.options.find((option) => !CATALOGUE[option.action].engage),
    actions: groupe.options.filter((option) => CATALOGUE[option.action].engage),
  };
}

/**
 * Lignes de l'étape 1 : une par action, même quand elle a plusieurs paramètres. Jouable si l'un d'eux l'est ;
 * sinon la première option, avec sa raison (12 §3.7).
 */
export function lignesActions(actions: readonly OptionMenu[]): OptionMenu[] {
  const lignes: OptionMenu[] = [];
  for (const option of actions) {
    const rang = lignes.findIndex((ligne) => ligne.action === option.action);
    if (rang === -1) lignes.push(option);
    else if (option.disponible && lignes[rang]?.disponible === false) lignes[rang] = option;
  }
  return lignes;
}

/** Étape d'une bulle (12 §3.5) : la fiche et les actions, puis « OÙ ? » si l'action a un paramètre, puis l'aperçu. */
export type Etape =
  | { readonly type: 'fiche' }
  | { readonly type: 'parametre'; readonly action: IdAction; readonly options: readonly OptionMenu[] }
  | { readonly type: 'apercu'; readonly option: OptionMenu; readonly avecParametre: boolean };

/** Étape atteinte par l'action et le paramètre choisis ; un choix qui n'est plus jouable ramène à la fiche. */
export function etapeBulle(groupe: Groupe, action: IdAction | null, parametre: string | null): Etape {
  const jouables = composer(groupe).actions.filter((option) => option.action === action && option.disponible);
  const [premiere] = jouables;
  if (action === null || premiere === undefined) return { type: 'fiche' };
  if (premiere.parametre === undefined) return { type: 'apercu', option: premiere, avecParametre: false };
  if (parametre === null) return { type: 'parametre', action, options: jouables };
  const option = jouables.find((jouable) => jouable.parametre?.id === parametre);
  return option === undefined ? { type: 'fiche' } : { type: 'apercu', option, avecParametre: true };
}

/** Choix qui mènent à l'étape d'avant (« ‹ ») : de l'aperçu à « OÙ ? » ou aux actions, de « OÙ ? » aux actions ; `null` à la fiche. */
export function precedente(etape: Etape): { readonly action: IdAction | null; readonly parametre: null } | null {
  if (etape.type === 'fiche') return null;
  return { action: etape.type === 'apercu' && etape.avecParametre ? etape.option.action : null, parametre: null };
}

/**
 * Nom d'un paramètre, dans la ligne « OÙ ? », le fil et le rappel : la position telle qu'on la dit (« sous la grille »),
 * le passage par son nom de puce (« Cloison de la salle d'observation », « Grille » tant que sa destination est inconnue),
 * la pièce par son nom, comme la destination d'un déplacement.
 */
export function nomParametre(textes: TextesMonde, parametre: NonNullable<OptionMenu['parametre']>): string {
  return parametre.sorte === 'passage' ? nomPuce(textes, parametre) : nomDe(textes, parametre).texte;
}

/** Les portes gardent toujours l'aperçu (D-182). */
const UN_TOUCHER: readonly IdAction[] = ['prendre', 'poser', 'aller'];

/** Prendre, poser ou changer de pièce se joue d'un seul toucher quand l'aperçu n'annonce ni risque, ni danger, ni coût (D-182). */
export function unToucher(monde: DefMonde, partie: Partie, option: OptionMenu): boolean {
  if (!option.disponible || !UN_TOUCHER.includes(option.action)) return false;
  const resultat = apercu(monde, partie, option.commande);
  if (resultat.type !== 'apercu') return false;
  const { risque, danger, cout } = resultat.apercu;
  return risque === 'aucun' && danger === null && cout === 'aucun';
}

/** Marge aux bords de l'écran et écart laissé à la flèche entre la bulle et sa puce (12 §2.7, §3.5). */
export const MARGE_BULLE = 16;
export const ECART_BULLE = 12;

export interface Placement {
  readonly cote: 'dessus' | 'dessous';
  /** Distance entre la bulle et le bord bas de l'écran (dessus) ou son bord haut (dessous). */
  readonly bord: number;
  readonly hauteurMax: number;
  /** Pointe de la flèche, depuis le bord gauche de la bulle. */
  readonly fleche: number;
}

/** Au-dessus de la puce si la bulle y tient, sinon dessous ; du côté le plus grand si aucun ne suffit : elle défile. */
export function placerBulle(
  ancre: { readonly haut: number; readonly bas: number; readonly centre: number },
  bulle: { readonly gauche: number; readonly largeur: number; readonly hauteur: number },
  hauteurEcran: number,
): Placement {
  const dessus = ancre.haut - ECART_BULLE - MARGE_BULLE;
  const dessous = hauteurEcran - ancre.bas - ECART_BULLE - MARGE_BULLE;
  const cote = bulle.hauteur <= dessus || (bulle.hauteur > dessous && dessus >= dessous) ? 'dessus' : 'dessous';
  return {
    cote,
    bord: cote === 'dessus' ? hauteurEcran - ancre.haut + ECART_BULLE : ancre.bas + ECART_BULLE,
    hauteurMax: Math.max(0, cote === 'dessus' ? dessus : dessous),
    fleche: Math.min(Math.max(ancre.centre - bulle.gauche, ECART_BULLE), bulle.largeur - ECART_BULLE),
  };
}

/** Nom affiché sur une puce : majuscule initiale, même nom que dans le récit (NP-04, 12 §1.4). */
export function nomPuce(textes: TextesMonde, cible: Cible): string {
  return former('Nom', nomDe(textes, cible));
}

/** Destination d'un bouton « Se déplacer vers », ou le passage lui-même tant qu'elle est inconnue ; les capitales viennent du style. */
export function nomDestination(textes: TextesMonde, option: OptionMenu): string {
  return nomDe(textes, option.cible.sorte === 'passage' ? (option.cible.vers ?? option.cible) : option.cible).texte;
}

/** Fil d'une bulle (12 §3.5, §4.3) : « Carnet », « Carnet › Prendre », « Caisse › Déplacer › sous la grille », « Aller vers › atelier ». */
export function filBulle(textes: TextesMonde, cible: Cible, option?: OptionMenu): string {
  if (option?.action === 'aller') return `${textes.verbes.aller} › ${nomDestination(textes, option)}`;
  const nom = nomPuce(textes, cible);
  if (option === undefined) return nom;
  const parametre = option.parametre === undefined ? '' : ` › ${nomParametre(textes, option.parametre)}`;
  return `${nom} › ${textes.verbes[option.action]}${parametre}`;
}

/** Dernière action rappelée en tête du récit (12 §3.3). */
export type Rappel =
  | { readonly type: 'cible'; readonly action: IdAction; readonly cible: RefObjet | RefPassage; readonly parametre?: OptionMenu['parametre'] }
  | { readonly type: 'deplacement'; readonly vers: RefPiece }
  | { readonly type: 'autour' };

export function rappelDe({ action, cible, parametre }: OptionMenu): Rappel {
  // Une position n'est jamais la cible d'une option, seulement son paramètre.
  if (cible.sorte === 'piece' || cible.sorte === 'position') return { type: 'autour' };
  if (cible.sorte === 'passage' && action === 'aller' && cible.vers !== null) return { type: 'deplacement', vers: cible.vers };
  return parametre === undefined ? { type: 'cible', action, cible } : { type: 'cible', action, cible, parametre };
}

function estAction(action: string): action is IdAction {
  return (ACTIONS as readonly string[]).includes(action);
}

/** Après une reprise : rappel de la dernière action engagée, retrouvée par sa commande enregistrée. */
export function rappelRepris(partie: Partie, observation: Observation): Rappel | null {
  const commande = partie.enregistrement.actions.at(-1)?.commande;
  if (commande === undefined || !estAction(commande.action)) return null;
  if (commande.action === 'aller') return { type: 'deplacement', vers: observation.piece };
  const cible = [...observation.objets, ...observation.inventaire, ...observation.passages].find((ref) => ref.id === commande.cible);
  if (cible === undefined) return null;
  if (commande.parametre === undefined) return { type: 'cible', action: commande.action, cible };
  // Le paramètre tel qu'on le voit maintenant : la pièce, un de ses passages ou une position où un objet est posé.
  const parametres = [observation.piece, ...observation.passages, ...observation.placements.map((placement) => placement.position)];
  const parametre = parametres.find((ref) => ref.id === commande.parametre);
  return parametre === undefined ? { type: 'cible', action: commande.action, cible } : { type: 'cible', action: commande.action, cible, parametre };
}

export interface TexteRappel {
  readonly texte: string;
  /** Capitales par le style seulement (12 §1.4) : déplacement et regard autour de soi. */
  readonly capitales: boolean;
}

/** « Carnet · Prendre », « Caisse · Déplacer · sous la grille », « Aller vers · atelier » ou « Regarder autour de vous ». */
export function texteRappel(textes: TextesMonde, rappel: Rappel): TexteRappel {
  switch (rappel.type) {
    case 'autour':
      return { texte: REGARDER_AUTOUR, capitales: true };
    case 'deplacement':
      return { texte: `${textes.verbes.aller} · ${nomDe(textes, rappel.vers).texte}`, capitales: true };
    case 'cible': {
      const parametre = rappel.parametre === undefined ? '' : ` · ${nomParametre(textes, rappel.parametre)}`;
      return { texte: `${nomPuce(textes, rappel.cible)} · ${textes.verbes[rappel.action]}${parametre}`, capitales: false };
    }
  }
}
