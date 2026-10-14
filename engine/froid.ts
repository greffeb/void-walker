import { chambreFroide, creatureActive, liaisonsDe, type EtatPartie } from './etat';
import type { DefMonde } from './monde';

// Chambre froide (C-03 §5.5, C-04 §3.2) : étape 3 du pas, après le vide et le feu, avant toute réaction de la créature.

/** Actions de suite qu'on peut finir dans la chambre froide sans blessure (D-166) ; au-delà, une à chaque action (D-240). */
export const ACTIONS_SANS_GELURE = 2;

export interface Froid {
  readonly etat: EtatPartie;
  /** Le passager finit l'action dans la chambre froide au-delà de deux actions de suite : une aggravation (D-240). */
  readonly gelure: boolean;
}

/**
 * Compte les actions de suite finies par le passager dans une chambre froide, remis à zéro dehors (D-240). La créature active
 * dans une chambre froide dont une porte s'est fermée pendant ce pas est ralentie pour toute la partie (D-166, D-239) ; engourdie
 * aussitôt, elle saute la réaction de ce pas.
 */
export function actualiserFroid(monde: DefMonde, avant: EtatPartie, etat: EtatPartie): Froid {
  const froid = chambreFroide(monde, etat.piece) ? avant.froid + 1 : 0;
  let suite: EtatPartie = { ...etat, froid };
  const creature = suite.creature;
  if (creature !== null && creatureActive(suite) && creature.piece !== null && creature.ralentie === undefined && chambreFroide(monde, creature.piece)) {
    const refermee = liaisonsDe(monde, creature.piece).some((liaison) => avant.liaisons[liaison.id] === true && suite.liaisons[liaison.id] !== true);
    if (refermee) suite = { ...suite, creature: { ...creature, ralentie: { saute: true } } };
  }
  return { etat: suite, gelure: froid > ACTIONS_SANS_GELURE };
}
