import { assourdie, chambreFroide, creatureActive, enFeu, type EtatPartie, type SouvenirPiece } from './etat';
import { CHANCE_DESTRUCTION, CHANCE_PANNE } from './capteur';
import type { DefMonde } from './monde';
import { entier32 } from './rencontre';
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
 * Révélation au terminal (lot 4) : toutes les liaisons non cachées découvertes, leur état en mémoire, et pour chaque pièce hors de
 * celle du passager son feu du moment, rien d'autre : ni regard ni objet neuf, on garde ceux d'une visite. `visitees` ne bouge pas :
 * le regard d'arrivée reste dû ; la carte dessine toute la station d'après `connecte`, une pièce jamais visitée y reste connue.
 */
export function reveler(monde: DefMonde, etat: EtatPartie): EtatPartie {
  const liaisons = monde.liaisons.filter((liaison) => liaison.cachee === undefined || etat.decouvertes.includes(liaison.id));
  const revelees = liaisons.filter((liaison) => liaison.cachee === undefined);
  const pieces: Record<string, SouvenirPiece> = { ...etat.memoire.pieces };
  for (const { id } of monde.pieces) {
    if (id === etat.piece) continue;
    pieces[id] = { ...pieces[id], feu: { vu: enFeu(etat, id), actions: etat.actions } };
  }
  return {
    ...etat,
    decouvertes: liaisons.map((liaison) => liaison.id),
    memoire: { pieces, liaisons: { ...etat.memoire.liaisons, ...Object.fromEntries(revelees.map((liaison) => [liaison.id, etat.liaisons[liaison.id] === true])) } },
  };
}

/**
 * `apres`, avec les caméras qui tombent à cette action ajoutées à `camerasHs`, dans l'ordre du monde (lot 4). Un tirage par caméra
 * qui marche, haché hors journal : destruction si la créature, active et hors traque, est dans sa pièce avant le pas et après ;
 * sinon panne. Aucun événement : la perte ne se voit qu'au poste.
 */
export function abimerCameras(monde: DefMonde, avant: EtatPartie, apres: EtatPartie, graine: number, action: number): EtatPartie {
  const sur = (etat: EtatPartie, piece: string): boolean => creatureActive(etat) && etat.creature?.contact !== true && etat.creature?.piece === piece;
  const touchees = camerasLues(monde, apres)
    .filter(({ piece, etat }) => etat !== 'hs' && entier32(`camera:${graine}:${action}:${piece}`) / 2 ** 32 < (sur(avant, piece) && sur(apres, piece) ? CHANCE_DESTRUCTION : CHANCE_PANNE))
    .map(({ piece }) => piece);
  return touchees.length === 0 ? apres : { ...apres, camerasHs: [...(apres.camerasHs ?? []), ...touchees] };
}
