import { assourdie, chambreFroide, creatureActive, enFeu, type EtatPartie, type SouvenirPiece } from './etat';
import type { DefMonde } from './monde';
import type { EtatCapteur } from './vocabulaire';

// Salle de surveillance (lot 4) : un terminal à mot de passe révèle la station et lit ses caméras en direct.

/** Ce qu'un détecteur de mouvement lit dans `piece` : hors service, puis brouillé en pièce aveugle, puis la créature, sinon calme (lot 3, lot 4). */
export function lireMouvement(monde: DefMonde, etat: EtatPartie, piece: string, hs: boolean): EtatCapteur {
  if (hs) return 'hs';
  if (assourdie(monde, etat, piece) || chambreFroide(monde, piece)) return 'brouille';
  return creatureActive(etat) && etat.creature?.piece === piece ? 'mouvement' : 'calme';
}

/** Toutes les caméras, dans l'ordre du monde : en panne au départ, ou tombées en cours de partie, elles sont hors service (lot 4). */
export function camerasLues(monde: DefMonde, etat: EtatPartie): readonly { readonly piece: string; readonly etat: EtatCapteur }[] {
  return (monde.cameras ?? []).map(({ piece, hs }) => ({ piece, etat: lireMouvement(monde, etat, piece, hs === true || (etat.camerasHs ?? []).includes(piece)) }));
}

/** La pièce du terminal ; `null` dans un monde sans terminal (lot 4). */
export function salleDeSurveillance(monde: DefMonde): string | null {
  return monde.objets.find((objet) => objet.terminal === true)?.piece ?? null;
}

/**
 * Révélation au terminal (lot 4) : toutes les pièces visitées, toutes les liaisons non cachées découvertes, leur état en mémoire,
 * et pour chaque pièce hors de celle du passager un souvenir du moment avec son feu, sans objet neuf : on garde ceux déjà vus.
 */
export function reveler(monde: DefMonde, etat: EtatPartie): EtatPartie {
  const liaisons = monde.liaisons.filter((liaison) => liaison.cachee === undefined || etat.decouvertes.includes(liaison.id));
  const revelees = liaisons.filter((liaison) => liaison.cachee === undefined);
  const pieces: Record<string, SouvenirPiece> = { ...etat.memoire.pieces };
  for (const { id } of monde.pieces) {
    if (id === etat.piece) continue;
    pieces[id] = { regard: etat.actions, feu: { vu: enFeu(etat, id), actions: etat.actions }, objets: pieces[id]?.objets ?? [] };
  }
  return {
    ...etat,
    visitees: monde.pieces.map((piece) => piece.id),
    decouvertes: liaisons.map((liaison) => liaison.id),
    memoire: { pieces, liaisons: { ...etat.memoire.liaisons, ...Object.fromEntries(revelees.map((liaison) => [liaison.id, etat.liaisons[liaison.id] === true])) } },
  };
}
