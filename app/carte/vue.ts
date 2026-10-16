import type { CartePublique, PieceCarte, RectPlan } from '../../engine';
import { caracteresParLigne, CASE_PX, couperTexte, LIGNE_PX, MARGE_PX, MOTS_CARTE, placeDuNom } from '../../content';
import { rectCapsule } from './dessin';

// Vue du plan à l'écran (14 §2.3) : position et zoom, gestes, et ce qui tient dans chaque pièce à l'échelle courante (14 §2.4).

/** Position et zoom du plan ; zoom 1 : une case vaut 34 px fois l'échelle du texte. */
export interface Vue {
  readonly zoom: number;
  /** Position de la case (0, 0) du plan dans la zone, en px. */
  readonly x: number;
  readonly y: number;
}

export interface Taille {
  readonly largeur: number;
  readonly hauteur: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface BoitePx {
  readonly gauche: number;
  readonly haut: number;
  readonly largeur: number;
  readonly hauteur: number;
}

/** Zoom maximal : le double de l'échelle de base (14 §2.3) ; borne à juger sur téléphone (14 §9). */
export const ZOOM_MAX = 2;
/** Au-delà de ce déplacement, un toucher devient un glissement : il n'ouvre pas de fiche. */
export const SEUIL_GLISSER_PX = 8;
/** Marge autour de la partie connue vue en entier. */
export const MARGE_VUE_PX = 16;
/** Le texte rétrécit avec le plan jusqu'aux trois quarts de sa taille, avant qu'un nom ne disparaisse (14 §9, retour du porteur). */
export const TEXTE_MIN = 0.75;
/** Cible tactile minimale (12 §7, 14 §2.9), et part du plan gardée à l'écran quand on glisse. */
export const CIBLE_MIN_PX = 44;

/** Étiquettes d'état sur le plan (14 §2.5) ; la pièce actuelle n'en a pas, l'icône du passager la marque (D-273). */
export type Marque = 'feu' | 'vide' | 'creature';

export const TEXTE_MARQUE: Readonly<Record<Marque, string>> = {
  feu: MOTS_CARTE.feu,
  vide: MOTS_CARTE.vide,
  creature: MOTS_CARTE.creature,
};

/** Icônes du plan (14 §2.5, D-273) : le passager dans la pièce actuelle, la créature là où elle a été vue. */
export type Icone = 'joueur' | 'creature';

/** Taille des icônes à la taille de texte STANDARD, par rapport au dessin de base ; elles ne rétrécissent pas au dézoom. */
export const ICONE_ECHELLE = 1.3;
/** Hauteur gardée sous le texte pour chaque icône, en px à la taille STANDARD : sa partie fixe et une marge. */
export const ICONE_HAUTEUR: Readonly<Record<Icone, number>> = { joueur: 30 * ICONE_ECHELLE, creature: 22 * ICONE_ECHELLE };
/** Écart entre le centre de la pièce et chacune des deux icônes quand elles partagent une pièce. */
export const ICONE_ECART = 16 * ICONE_ECHELLE;

export function iconesDe(piece: PieceCarte): Icone[] {
  return [...(piece.statut === 'actuelle' ? (['joueur'] as const) : []), ...(piece.creature === null ? [] : (['creature'] as const))];
}

export interface Etiquettes {
  readonly nom: readonly string[];
  readonly etats: readonly (readonly Marque[])[];
  readonly anciennete: readonly string[];
  /** Taille du texte par rapport à la normale : il suit le plan quand on dézoome, jusqu'à TEXTE_MIN. */
  readonly texte: number;
}

/** Cadre de la partie connue, capsules comprises, en cases ; `null` dans un monde sans plan. */
export function cadreConnu(carte: CartePublique): RectPlan | null {
  const rects = carte.pieces.flatMap((piece) => (piece.rect === null ? [] : [piece.rect]));
  for (const capsule of carte.capsules) {
    const salle = carte.pieces.find((piece) => piece.piece.id === capsule.piece.id)?.rect;
    if (salle !== null && salle !== undefined) rects.push(rectCapsule(salle, capsule.pan));
  }
  if (rects.length === 0) return null;
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  return {
    x,
    y,
    largeur: Math.max(...rects.map((rect) => rect.x + rect.largeur)) - x,
    hauteur: Math.max(...rects.map((rect) => rect.y + rect.hauteur)) - y,
  };
}

/** Zoom minimal : toute la partie connue tient dans la zone ; jamais plus que l'échelle de base (14 §2.3). */
export function zoomMin(cadre: RectPlan, zone: Taille, casePx: number): number {
  const ajuste = Math.min((zone.largeur - 2 * MARGE_VUE_PX) / (cadre.largeur * casePx), (zone.hauteur - 2 * MARGE_VUE_PX) / (cadre.hauteur * casePx));
  return Math.max(0.1, Math.min(1, ajuste));
}

/** À l'ouverture : échelle de base, la pièce actuelle au centre de la zone (14 §2.1, D-205). */
export function vueInitiale(carte: CartePublique, zone: Taille, casePx: number): Vue {
  const centre = carte.pieces.find((piece) => piece.statut === 'actuelle')?.rect ?? cadreConnu(carte);
  if (centre === null || centre === undefined) return { zoom: 1, x: 0, y: 0 };
  return {
    zoom: 1,
    x: zone.largeur / 2 - (centre.x + centre.largeur / 2) * casePx,
    y: zone.hauteur / 2 - (centre.y + centre.hauteur / 2) * casePx,
  };
}

export function glisser(vue: Vue, dx: number, dy: number): Vue {
  return { ...vue, x: vue.x + dx, y: vue.y + dy };
}

/** Pincer, ou molette : zoom autour d'un point de la zone, borné de `min` à ZOOM_MAX. */
export function pincer(vue: Vue, facteur: number, centre: Point, min: number): Vue {
  const zoom = Math.min(ZOOM_MAX, Math.max(min, vue.zoom * facteur));
  const rapport = zoom / vue.zoom;
  return { zoom, x: centre.x - (centre.x - vue.x) * rapport, y: centre.y - (centre.y - vue.y) * rapport };
}

/** Garde au moins une cible du plan dans la zone : on ne le perd jamais en glissant. */
export function borner(vue: Vue, cadre: RectPlan, zone: Taille, casePx: number): Vue {
  const echelle = casePx * vue.zoom;
  const gauche = vue.x + cadre.x * echelle;
  const droite = vue.x + (cadre.x + cadre.largeur) * echelle;
  const haut = vue.y + cadre.y * echelle;
  const bas = vue.y + (cadre.y + cadre.hauteur) * echelle;
  const dx = droite < CIBLE_MIN_PX ? CIBLE_MIN_PX - droite : gauche > zone.largeur - CIBLE_MIN_PX ? zone.largeur - CIBLE_MIN_PX - gauche : 0;
  const dy = bas < CIBLE_MIN_PX ? CIBLE_MIN_PX - bas : haut > zone.hauteur - CIBLE_MIN_PX ? zone.hauteur - CIBLE_MIN_PX - haut : 0;
  return dx === 0 && dy === 0 ? vue : { ...vue, x: vue.x + dx, y: vue.y + dy };
}

/** Ramène dans la zone, avec sa marge, une pièce qui y prend le focus ; inchangée si elle y est déjà (12 §7). */
export function montrer(vue: Vue, boite: BoitePx, zone: Taille): Vue {
  const decalage = (debut: number, taille: number, place: number): number =>
    debut < MARGE_VUE_PX ? MARGE_VUE_PX - debut : debut + taille > place - MARGE_VUE_PX ? Math.max(MARGE_VUE_PX - debut, place - MARGE_VUE_PX - debut - taille) : 0;
  const dx = decalage(boite.gauche, boite.largeur, zone.largeur);
  const dy = decalage(boite.haut, boite.hauteur, zone.hauteur);
  return dx === 0 && dy === 0 ? vue : { ...vue, x: vue.x + dx, y: vue.y + dy };
}

/** Rectangle du plan à l'écran, en px. */
export function enPixels(rect: RectPlan, vue: Vue, casePx: number): BoitePx {
  const echelle = casePx * vue.zoom;
  return { gauche: vue.x + rect.x * echelle, haut: vue.y + rect.y * echelle, largeur: rect.largeur * echelle, hauteur: rect.hauteur * echelle };
}

/** Zone touchable d'une pièce : son rectangle, agrandi autour de son centre jusqu'à 44 px de côté (14 §2.9). */
export function zoneTouchable(boite: BoitePx): BoitePx {
  const largeur = Math.max(CIBLE_MIN_PX, boite.largeur);
  const hauteur = Math.max(CIBLE_MIN_PX, boite.hauteur);
  return { gauche: boite.gauche - (largeur - boite.largeur) / 2, haut: boite.haut - (hauteur - boite.hauteur) / 2, largeur, hauteur };
}


/**
 * Ce qui tient dans la pièce au zoom courant (14 §2.3, §2.4) : le nom d'abord, puis les étiquettes d'état, jamais coupées, puis la
 * place des icônes sous le texte, puis l'ancienneté (D-273). Ce qui ne tient pas disparaît ; murs, motifs et icônes restent. Le texte et la case grandissent ensemble avec la
 * taille du texte : les mesures de PL-04 valent à toutes les tailles. En dézoomant, le texte rétrécit avec le plan jusqu'à TEXTE_MIN :
 * on mesure alors la place dans des cases ramenées à la taille du texte.
 */
export function etiquettes(piece: PieceCarte, nom: string, anciennete: string | null, zoom: number): Etiquettes {
  const texte = Math.min(1, Math.max(TEXTE_MIN, zoom));
  const rien: Etiquettes = { nom: [], etats: [], anciennete: [], texte };
  if (piece.rect === null) return rien;
  const casePx = (CASE_PX * zoom) / texte;
  const place = placeDuNom(nom, piece.rect.largeur, piece.rect.hauteur, casePx);
  if (place === null) return rien;
  const max = caracteresParLigne(piece.rect.largeur * casePx);
  const marques: Marque[] = [
    ...(piece.feu === null ? [] : (['feu'] as const)),
    ...(piece.vide ? (['vide'] as const) : []),
    ...(piece.creature === null ? [] : (['creature'] as const)),
  ];
  let libres = place.libres;
  const etats: Marque[][] = [];
  for (const marque of marques) {
    const longueur = [...TEXTE_MARQUE[marque]].length;
    // Une étiquette ne se coupe jamais : trop large, elle disparaît, le motif de sol reste.
    if (longueur > max) continue;
    const ligne = etats[etats.length - 1];
    const occupee = ligne?.reduce((somme, autre) => somme + [...TEXTE_MARQUE[autre]].length + 1, 0);
    if (ligne !== undefined && occupee !== undefined && occupee + longueur <= max) ligne.push(marque);
    else if (libres > 0) {
      etats.push([marque]);
      libres -= 1;
    }
  }
  const lignes = anciennete === null ? null : couperTexte(anciennete, piece.rect.largeur * casePx);
  if (lignes === null || lignes.length > libres) return { nom: place.lignes, etats, anciennete: [], texte };
  // L'icône passe avant l'ancienneté : une ancienneté qui lui prendrait sa place s'efface (elle reste dans la fiche et la LISTE).
  // Hauteurs ramenées à la taille du texte, comme casePx : l'icône, elle, ne rétrécit pas avec le plan.
  const besoin = Math.max(0, ...iconesDe(piece).map((icone) => ICONE_HAUTEUR[icone])) / texte;
  const sous = piece.rect.hauteur * casePx - MARGE_PX - LIGNE_PX * (place.lignes.length + etats.length + lignes.length);
  return { nom: place.lignes, etats, anciennete: besoin > 0 && sous < besoin ? [] : lignes, texte };
}

/**
 * Centre des icônes d'une pièce, en px (D-273) : au milieu de la place laissée sous le texte, ou de la pièce entière quand aucun texte
 * n'y tient (dézoom). Trop basse, la place garde l'icône collée au mur du bas. Deux icônes se mettent côte à côte, le passager à gauche.
 * `echelle` est l'échelle de la taille du texte (1 à STANDARD).
 */
export function centresIcones(boite: BoitePx, textes: Etiquettes, icones: readonly Icone[], echelle: number): Partial<Record<Icone, Point>> {
  if (icones.length === 0) return {};
  const lignes = textes.nom.length + textes.etats.length + textes.anciennete.length;
  const haut = lignes === 0 ? 0 : (MARGE_PX + LIGNE_PX * lignes) * echelle * textes.texte;
  const besoin = Math.max(...icones.map((icone) => ICONE_HAUTEUR[icone])) * echelle;
  const libre = boite.hauteur - haut;
  const y = boite.haut + (libre >= besoin ? haut + libre / 2 : boite.hauteur - besoin / 2);
  const x = boite.gauche + boite.largeur / 2;
  if (icones.length === 1) return { [icones[0] as Icone]: { x, y } };
  const ecart = ICONE_ECART * echelle;
  return { joueur: { x: x - ecart, y }, creature: { x: x + ecart, y } };
}
