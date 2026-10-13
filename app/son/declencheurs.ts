// Signaux du terminal après une action (15 §2.2, D-218) : on compare ce que le passager voit avant et après.

import type { Observation, Sante } from '../../engine';
import type { Signal } from './recettes';

const GRAVITE: Readonly<Record<Sante, number>> = { indemne: 0, blesse: 1, critique: 2, vaincu: 3 };

/** Feux que le passager voit : sa pièce, et chaque passage ouvert sur une pièce en feu (C-06 §2), depuis la pièce où il se tient. */
function feuxVus(observation: Observation): string[] {
  const ici = observation.piece.id;
  return [...(observation.feu ? [`piece:${ici}`] : []), ...observation.passages.filter((passage) => passage.feu).map((passage) => `passage:${ici}:${passage.id}`)];
}

/**
 * L'alarme incendie sonne quand un feu apparaît à la vue du passager : dans sa pièce (il y entre, le feu s'y propage) ou par un
 * passage ouvert (il ouvre sur une pièce en feu, le feu gagne la voisine) (D-218, D-223). L'alarme vide sonne quand le vide passe
 * d'absent à présent dans sa pièce. Rester devant le danger ne la fait pas resonner, y revenir si. Ordre de jeu : 15 §2.4.
 */
export function signauxApres(avant: Observation, apres: Observation): Signal[] {
  const signaux: Signal[] = [];
  const memePiece = avant.piece.id === apres.piece.id;
  const feuxAvant = feuxVus(avant);
  if (feuxVus(apres).some((feu) => !feuxAvant.includes(feu))) signaux.push('alarme-feu');
  if (apres.sansAir && !(memePiece && avant.sansAir)) signaux.push('alarme-vide');
  const ecart = GRAVITE[apres.sante] - GRAVITE[avant.sante];
  if (ecart > 0) signaux.push(GRAVITE[apres.sante] >= GRAVITE.critique ? 'blessure-critique' : 'blessure');
  if (ecart < 0) signaux.push('soin');
  if (apres.messages.length > avant.messages.length) signaux.push('ia');
  return signaux;
}
