// Signaux du terminal après une action (15 §2.2, D-218) : on compare ce que le passager voit avant et après.

import type { Evenement, Observation, Sante } from '../../engine';
import type { Signal } from './recettes';

const GRAVITE: Readonly<Record<Sante, number>> = { indemne: 0, blesse: 1, critique: 2, vaincu: 3 };

type Passage = Observation['passages'][number];

/** Danger en vue du passager : dans sa pièce, et par les passages qui le montrent. */
export interface DangerVu {
  readonly ici: boolean;
  readonly passages: readonly Passage[];
}

/**
 * Dangers que le passager voit, depuis la pièce où il se tient : sa pièce, et chaque passage qui le montre (porte ouverte sur le
 * feu, C-06 §2 ; voyant d'une porte étanche pour le vide, OP-04).
 */
function dangerVu(observation: Observation, nature: 'feu' | 'vide'): DangerVu {
  return nature === 'feu'
    ? { ici: observation.feu, passages: observation.passages.filter((passage) => passage.feu) }
    : { ici: observation.sansAir, passages: observation.passages.filter((passage) => passage.vide) };
}

/** Un danger qui n'était pas en vue l'est maintenant : sa pièce, s'il y entre ou si le danger l'y rejoint, ou un passage. */
function apparu(avant: Observation, apres: Observation, nature: 'feu' | 'vide'): DangerVu {
  const vuAvant = dangerVu(avant, nature);
  const vu = dangerVu(apres, nature);
  const memePiece = avant.piece.id === apres.piece.id;
  const dejaVu = (passage: Passage): boolean => memePiece && vuAvant.passages.some((ancien) => ancien.id === passage.id);
  return { ici: vu.ici && !(memePiece && vuAvant.ici), passages: vu.passages.filter((passage) => !dejaVu(passage)) };
}

/** Dangers apparus à la vue du passager pendant ce pas : ceux qui font sonner l'alarme et que le récit signale (D-218, D-233). */
export function dangersApparus(avant: Observation, apres: Observation): { readonly feu: DangerVu; readonly vide: DangerVu } {
  return { feu: apparu(avant, apres, 'feu'), vide: apparu(avant, apres, 'vide') };
}

export const enVue = (danger: DangerVu): boolean => danger.ici || danger.passages.length > 0;

/**
 * Une alarme sonne quand le feu ou le vide apparaît à la vue du passager : dans sa pièce (il y entre, le danger s'y propage) ou
 * par un passage (porte ouverte sur le feu, voyant d'une porte étanche pour le vide) (D-218, D-223, D-224). Rester devant le
 * danger ne la fait pas resonner, y revenir si. La créature sonne à la première rencontre, que le moteur annonce (D-224).
 * Ordre de jeu : 15 §2.4.
 */
export function signauxApres(avant: Observation, apres: Observation, evenements: readonly Evenement[] = []): Signal[] {
  const signaux: Signal[] = [];
  const dangers = dangersApparus(avant, apres);
  if (enVue(dangers.feu)) signaux.push('alarme-feu');
  if (enVue(dangers.vide)) signaux.push('alarme-vide');
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
