import { former, nomDe, type TextesMonde } from '../content';
import {
  ACTIONS,
  CATALOGUE,
  type Cible,
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
  /** « Dans la pièce » : objets puis passages, sans le déplacement. */
  readonly piece: readonly Groupe[];
  readonly autour: OptionMenu | undefined;
  /** « Se déplacer vers » : un bouton par passage connu. */
  readonly deplacements: readonly OptionMenu[];
  /** Objets portés, ouverts par le bouton INVENTAIRE. */
  readonly inventaire: readonly Groupe[];
}

function grouper(cibles: readonly (RefObjet | RefPassage)[], options: readonly OptionMenu[]): Groupe[] {
  return cibles
    .map((cible) => ({ cible, options: options.filter((option) => option.cible.id === cible.id) }))
    .filter((groupe) => groupe.options.length > 0);
}

/** Range chaque option du menu moteur à une seule place de l'écran (12 §3.4). */
export function composerDock(observation: Observation): Dock {
  const autres = observation.menu.filter((option) => option.action !== 'aller');
  return {
    piece: grouper([...observation.objets, ...observation.passages], autres),
    autour: autres.find((option) => option.cible.sorte === 'piece'),
    deplacements: observation.menu.filter((option) => option.action === 'aller'),
    inventaire: grouper(observation.inventaire, autres),
  };
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

/** Destination d'un bouton « Se déplacer vers » ; les capitales viennent du style. */
export function nomDestination(textes: TextesMonde, option: OptionMenu): string {
  return nomDe(textes, option.cible.sorte === 'passage' ? option.cible.vers : option.cible).texte;
}

/** Dernière action rappelée en tête du récit (12 §3.3). */
export type Rappel =
  | { readonly type: 'cible'; readonly action: IdAction; readonly cible: RefObjet | RefPassage }
  | { readonly type: 'deplacement'; readonly vers: RefPiece }
  | { readonly type: 'autour' };

export function rappelDe({ action, cible }: OptionMenu): Rappel {
  if (cible.sorte === 'piece') return { type: 'autour' };
  if (cible.sorte === 'passage' && action === 'aller') return { type: 'deplacement', vers: cible.vers };
  return { type: 'cible', action, cible };
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
  return cible === undefined ? null : { type: 'cible', action: commande.action, cible };
}

export interface TexteRappel {
  readonly texte: string;
  /** Capitales par le style seulement (12 §1.4) : déplacement et regard autour de soi. */
  readonly capitales: boolean;
}

/** « Carnet · Prendre », « Aller vers · atelier » ou « Regarder autour de vous ». */
export function texteRappel(textes: TextesMonde, rappel: Rappel): TexteRappel {
  switch (rappel.type) {
    case 'autour':
      return { texte: REGARDER_AUTOUR, capitales: true };
    case 'deplacement':
      return { texte: `${textes.verbes.aller} · ${nomDe(textes, rappel.vers).texte}`, capitales: true };
    case 'cible':
      return { texte: `${nomPuce(textes, rappel.cible)} · ${textes.verbes[rappel.action]}`, capitales: false };
  }
}
