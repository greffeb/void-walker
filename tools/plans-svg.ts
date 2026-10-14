import { emplacementDe, panDeCoque, piecesDeCoque, type DefLiaison, type RectPlan } from '../engine';
import { CASE_PX, LIGNE_PX, MARGE_PX, nomSurPlan, placeDuNom, type EntreeMonde } from '../content';
import { pointsTrace, rectCapsule, segmentOuverture } from '../app/carte/dessin';

// Rendu d'auteur d'un plan (14 §4.3) : toutes les pièces, portes, conduits et capsules d'un monde, pour que le porteur juge les
// plans avant fusion. Ce n'est pas l'écran de la carte : ni mémoire du passager, ni état. Couleurs de D-211.

const COULEURS = { fond: '#050A06', surface: '#0B140D', vert: '#5CFF7A', texte: '#A6F5B0', secondaire: '#62B06D', bordure: '#3E7046' } as const;
/** Cases de marge autour du plan. */
const MARGE_CASES = 1;

function echapper(texte: string): string {
  return texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cadre(rects: readonly RectPlan[]): RectPlan {
  const x = Math.min(...rects.map((rect) => rect.x));
  const y = Math.min(...rects.map((rect) => rect.y));
  const largeur = Math.max(...rects.map((rect) => rect.x + rect.largeur)) - x;
  const hauteur = Math.max(...rects.map((rect) => rect.y + rect.hauteur)) - y;
  return { x, y, largeur, hauteur };
}

/** Grille, conduit étroit, panneau, passage sans signalétique, vide de passerelle : ouverture en tirets (14 §2.6). */
function enTirets(liaison: DefLiaison): boolean {
  return liaison.etroite === true || liaison.nonEtanche === true || liaison.sansSignaletique === true || liaison.cachee !== undefined || liaison.gouffre === true;
}

export function dessinerPlan({ monde, textes }: EntreeMonde): string {
  const pieces = monde.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [{ piece, rect: piece.plan }]));
  if (pieces.length === 0) throw new Error(`${monde.id} : aucun plan.`);
  const capsules = monde.objets.flatMap((objet) => {
    const rect = monde.pieces.find((piece) => piece.id === objet.piece)?.plan;
    const pan = objet.capsule === undefined ? null : panDeCoque(monde, objet.piece);
    return rect === undefined || pan === null ? [] : [rectCapsule(rect, pan)];
  });
  const boite = cadre([...pieces.map(({ rect }) => rect), ...capsules]);
  const px = (cases: number): number => cases * CASE_PX;
  const ox = (x: number): number => px(x - boite.x + MARGE_CASES);
  const oy = (y: number): number => px(y - boite.y + MARGE_CASES);
  const largeur = px(boite.largeur + 2 * MARGE_CASES);
  const hauteur = px(boite.hauteur + 2 * MARGE_CASES);
  const coque = piecesDeCoque(monde);
  const elements: string[] = [];
  for (const { piece, rect } of pieces) {
    const mur = coque.includes(piece.id) ? COULEURS.vert : COULEURS.secondaire;
    elements.push(`<rect x="${ox(rect.x)}" y="${oy(rect.y)}" width="${px(rect.largeur)}" height="${px(rect.hauteur)}" fill="${COULEURS.surface}" stroke="${mur}" stroke-width="2"/>`);
    const nom = textes.noms[piece.nom]?.texte ?? piece.nom;
    const lignes = placeDuNom(nom, rect.largeur, rect.hauteur)?.lignes ?? [nomSurPlan(nom)];
    lignes.forEach((ligne, index) => {
      const y = oy(rect.y) + MARGE_PX + LIGNE_PX * index + 13;
      elements.push(
        `<text x="${ox(rect.x) + MARGE_PX}" y="${y}" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="600" letter-spacing="0.52" fill="${COULEURS.texte}">${echapper(ligne)}</text>`,
      );
    });
  }
  for (const capsule of capsules) {
    elements.push(`<rect x="${ox(capsule.x)}" y="${oy(capsule.y)}" width="${px(capsule.largeur)}" height="${px(capsule.hauteur)}" rx="${CASE_PX / 2}" fill="none" stroke="${COULEURS.vert}" stroke-width="2"/>`);
  }
  for (const liaison of monde.liaisons) {
    const emplacement = emplacementDe(monde, liaison);
    if (emplacement === null) continue;
    if (emplacement.type === 'trace') {
      const points = pointsTrace(emplacement.cases).map(([x, y]) => `${ox(x)},${oy(y)}`).join(' ');
      elements.push(`<polyline points="${points}" fill="none" stroke="${COULEURS.bordure}" stroke-width="2" stroke-dasharray="4 4"/>`);
      continue;
    }
    const { x1, y1, x2, y2 } = segmentOuverture(emplacement);
    const segment = `x1="${ox(x1)}" y1="${oy(y1)}" x2="${ox(x2)}" y2="${oy(y2)}"`;
    elements.push(`<line ${segment} stroke="${COULEURS.fond}" stroke-width="5"/>`);
    if (enTirets(liaison)) elements.push(`<line ${segment} stroke="${COULEURS.secondaire}" stroke-width="2" stroke-dasharray="3 3"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Plan ${echapper(monde.id)}"><rect width="${largeur}" height="${hauteur}" fill="${COULEURS.fond}"/>${elements.join('')}</svg>`;
}
