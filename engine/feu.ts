import { autreCote, destinationConnue, enFeu, liaisonsDe, liaisonsVisibles, refPassage, refPiece, type EtatPartie } from './etat';
import type { DefMonde } from './monde';
import type { Evenement } from './vocabulaire';

// Feu confiné et propagation (C-03 §5.3, D-056) : étape 3 du pas, après les effets de l'action.

/** Pièce que le feu gagne, et la liaison par laquelle il passe. */
export interface Embrasement {
  readonly piece: string;
  readonly liaison: string;
}

/**
 * Une liaison ouverte entre un foyer et une pièce sans feu est exposée à chaque fin d'action ; à la deuxième fin d'action
 * consécutive, la pièce voisine prend feu. Fermer le lien ou éteindre la source interrompt l'exposition. Les sources sont
 * celles du début de l'étape : une pièce nouvellement en feu ne propage pas dans la même étape (pas d'enchaînement).
 */
export function actualiserFeu(monde: DefMonde, etat: EtatPartie): { etat: EtatPartie; evenements: Evenement[]; gagnees: Embrasement[] } {
  const exposees: string[] = [];
  const gagnees: Embrasement[] = [];
  for (const liaison of monde.liaisons) {
    if (etat.liaisons[liaison.id] !== true) continue;
    const [a, b] = liaison.entre;
    if (enFeu(etat, a) === enFeu(etat, b)) continue;
    const cible = enFeu(etat, a) ? b : a;
    if (etat.expositions.includes(liaison.id)) gagnees.push({ piece: cible, liaison: liaison.id });
    else exposees.push(liaison.id);
  }
  if (gagnees.length === 0) return { etat: { ...etat, expositions: exposees }, evenements: [], gagnees };
  const nouvelles = new Set(gagnees.map((gagnee) => gagnee.piece));
  const feu = monde.pieces.filter((piece) => nouvelles.has(piece.id) || enFeu(etat, piece.id)).map((piece) => piece.id);
  // Les liaisons qui menaient à une pièce gagnée ne l'exposent plus : elle brûle.
  const expositions = exposees.filter((id) => !monde.liaisons.some((liaison) => liaison.id === id && liaison.entre.some((piece) => nouvelles.has(piece))));
  const suite: EtatPartie = { ...etat, feu, expositions };
  const evenements = feu.filter((piece) => nouvelles.has(piece)).flatMap((piece) => feuVu(monde, suite, piece));
  return { etat: suite, evenements, gagnees };
}

/**
 * Ce que le passager voit d'une pièce qui prend feu : la pièce nommée, la sienne ou une voisine par un passage ouvert dont il
 * connaît la destination ; sinon les flammes derrière ce passage, sans nommer la pièce (C-06 OP-03).
 */
function feuVu(monde: DefMonde, etat: EtatPartie, piece: string): Evenement[] {
  if (piece === etat.piece) return [{ type: 'feu_gagne', piece: refPiece(monde, piece) }];
  const ouvertes = liaisonsVisibles(monde, etat, etat.piece).filter(
    (liaison) => etat.liaisons[liaison.id] === true && autreCote(liaison, etat.piece) === piece,
  );
  if (ouvertes.some((liaison) => destinationConnue(etat, liaison))) return [{ type: 'feu_gagne', piece: refPiece(monde, piece) }];
  const [par] = ouvertes;
  return par === undefined ? [] : [{ type: 'feu_derriere', passage: refPassage(monde, etat, par, etat.piece) }];
}

/** Le passager voit une pièce : la sienne, ou une voisine par un passage ouvert. */
export function voitLaPiece(monde: DefMonde, etat: EtatPartie, piece: string): boolean {
  return piece === etat.piece || liaisonsDe(monde, etat.piece).some((liaison) => etat.liaisons[liaison.id] === true && autreCote(liaison, etat.piece) === piece);
}

/** Finir l'action dans une pièce en feu blesse, à l'arrivée comme à chaque action passée dedans (D-188). */
export function brule(etat: EtatPartie): boolean {
  return enFeu(etat, etat.piece);
}
