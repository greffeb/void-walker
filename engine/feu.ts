import { autreCote, enFeu, liaisonsDe, refPiece, type EtatPartie } from './etat';
import type { DefMonde } from './monde';
import type { Evenement } from './vocabulaire';

// Feu confiné et propagation (C-03 §5.3, D-056) : étape 3 du pas, après les effets de l'action.

/**
 * Une liaison ouverte entre un foyer et une pièce sans feu est exposée à chaque fin d'action ; à la deuxième fin d'action
 * consécutive, la pièce voisine prend feu. Fermer le lien ou éteindre la source interrompt l'exposition. Les sources sont
 * celles du début de l'étape : une pièce nouvellement en feu ne propage pas dans la même étape, et une pièce au plus
 * s'enflamme par mise à jour.
 */
export function actualiserFeu(
  monde: DefMonde,
  etat: EtatPartie,
): { etat: EtatPartie; evenements: Evenement[]; gagnee?: { readonly piece: string; readonly source: string } } {
  const exposees: string[] = [];
  let gagnee: { piece: string; source: string } | null = null;
  for (const liaison of monde.liaisons) {
    if (etat.liaisons[liaison.id] !== true) continue;
    const [a, b] = liaison.entre;
    if (enFeu(etat, a) === enFeu(etat, b)) continue;
    const [source, cible] = enFeu(etat, a) ? [a, b] : [b, a];
    if (etat.expositions.includes(liaison.id) && (gagnee === null || gagnee.piece === cible)) {
      gagnee ??= { piece: cible, source };
    } else {
      exposees.push(liaison.id);
    }
  }
  if (gagnee === null) return { etat: { ...etat, expositions: exposees }, evenements: [] };
  const piece = gagnee.piece;
  const feu = monde.pieces.filter((candidate) => candidate.id === piece || enFeu(etat, candidate.id)).map((candidate) => candidate.id);
  // Les liaisons qui menaient à la pièce gagnée ne l'exposent plus : elle brûle.
  const suite: EtatPartie = { ...etat, feu, expositions: exposees.filter((id) => !monde.liaisons.some((l) => l.id === id && l.entre.includes(piece))) };
  return {
    etat: suite,
    evenements: voitLaPiece(monde, suite, piece) ? [{ type: 'feu_gagne', piece: refPiece(monde, piece) }] : [],
    gagnee,
  };
}

/** Le passager voit une pièce : la sienne, ou une voisine par un passage ouvert. */
export function voitLaPiece(monde: DefMonde, etat: EtatPartie, piece: string): boolean {
  return piece === etat.piece || liaisonsDe(monde, etat.piece).some((liaison) => etat.liaisons[liaison.id] === true && autreCote(liaison, etat.piece) === piece);
}

/** Finir l'action dans une pièce en feu blesse, à l'arrivée comme à chaque action passée dedans (D-188). */
export function brule(etat: EtatPartie): boolean {
  return enFeu(etat, etat.piece);
}
