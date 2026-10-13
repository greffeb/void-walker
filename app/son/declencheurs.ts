// Signaux du terminal après une action (15 §2.2, D-218) : on compare ce que le passager voit avant et après.

import type { Evenement, Observation, Sante } from '../../engine';
import type { Signal } from './recettes';

const GRAVITE: Readonly<Record<Sante, number>> = { indemne: 0, blesse: 1, critique: 2, vaincu: 3 };

/**
 * Dangers que le passager voit, depuis la pièce où il se tient : sa pièce, et chaque passage qui le montre (porte ouverte sur le
 * feu, C-06 §2 ; voyant d'une porte étanche pour le vide, OP-04).
 */
function dangersVus(observation: Observation, ici: boolean, parPassage: (passage: Observation['passages'][number]) => boolean): string[] {
  const piece = observation.piece.id;
  return [...(ici ? [`piece:${piece}`] : []), ...observation.passages.filter(parPassage).map((passage) => `passage:${piece}:${passage.id}`)];
}

const feuxVus = (observation: Observation): string[] => dangersVus(observation, observation.feu, (passage) => passage.feu);
const videsVus = (observation: Observation): string[] => dangersVus(observation, observation.sansAir, (passage) => passage.vide);

/** Un danger qui n'était pas en vue l'est maintenant. */
function apparait(avant: readonly string[], apres: readonly string[]): boolean {
  return apres.some((danger) => !avant.includes(danger));
}

/**
 * Une alarme sonne quand le feu ou le vide apparaît à la vue du passager : dans sa pièce (il y entre, le danger s'y propage) ou
 * par un passage (porte ouverte sur le feu, voyant d'une porte étanche pour le vide) (D-218, D-223, D-224). Rester devant le
 * danger ne la fait pas resonner, y revenir si. La créature sonne à la première rencontre, que le moteur annonce (D-224).
 * Ordre de jeu : 15 §2.4.
 */
export function signauxApres(avant: Observation, apres: Observation, evenements: readonly Evenement[] = []): Signal[] {
  const signaux: Signal[] = [];
  if (apparait(feuxVus(avant), feuxVus(apres))) signaux.push('alarme-feu');
  if (apparait(videsVus(avant), videsVus(apres))) signaux.push('alarme-vide');
  if (evenements.some((evenement) => evenement.type === 'premier_contact')) signaux.push('creature');
  const ecart = GRAVITE[apres.sante] - GRAVITE[avant.sante];
  // La mort remplace la blessure critique (D-225).
  if (apres.sante === 'vaincu' && avant.sante !== 'vaincu') signaux.push('mort');
  else if (ecart > 0) signaux.push(GRAVITE[apres.sante] >= GRAVITE.critique ? 'blessure-critique' : 'blessure');
  else if (ecart < 0) signaux.push('soin');
  if (apres.messages.length > avant.messages.length) signaux.push('ia');
  if (apres.issue === 'evacuation' && avant.issue !== 'evacuation') signaux.push('victoire');
  return signaux;
}
