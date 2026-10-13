// Signaux du terminal après une action (15 §2.2, D-218) : on compare ce que le passager voit avant et après.

import type { Observation, Sante } from '../../engine';
import type { Signal } from './recettes';

const GRAVITE: Readonly<Record<Sante, number>> = { indemne: 0, blesse: 1, critique: 2, vaincu: 3 };

/**
 * Une alarme sonne quand le feu ou le vide passe d'absent à présent dans la pièce du passager : il y entre, ou le danger s'y
 * propage ; rester dans le danger ne la fait pas resonner, y revenir si. Résultat dans l'ordre de jeu (15 §2.4).
 */
export function signauxApres(avant: Observation, apres: Observation): Signal[] {
  const signaux: Signal[] = [];
  const memePiece = avant.piece.id === apres.piece.id;
  if (apres.feu && !(memePiece && avant.feu)) signaux.push('alarme-feu');
  if (apres.sansAir && !(memePiece && avant.sansAir)) signaux.push('alarme-vide');
  const ecart = GRAVITE[apres.sante] - GRAVITE[avant.sante];
  if (ecart > 0) signaux.push(GRAVITE[apres.sante] >= GRAVITE.critique ? 'blessure-critique' : 'blessure');
  if (ecart < 0) signaux.push('soin');
  if (apres.messages.length > avant.messages.length) signaux.push('ia');
  return signaux;
}
