import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';
import { MORCEAU_ESSAI, TEXTES_MORCEAU_ESSAI } from './essai';
import { MORCEAU_M03, TEXTES_MORCEAU_M03 } from './m-03';
import { MORCEAU_M07, TEXTES_MORCEAU_M07 } from './m-07';
import { MORCEAU_M10, TEXTES_MORCEAU_M10 } from './m-10';
import { MORCEAU_VESTIBULE, TEXTES_MORCEAU_VESTIBULE } from './vestibule';

export interface EntreeMorceau {
  readonly morceau: DefMorceau;
  readonly textes: TextesMorceau;
}

/** Morceaux écrits à la main (13 §8), par identifiant : départ, chemins, finals. */
export const MORCEAUX: Readonly<Record<string, EntreeMorceau>> = {
  [MORCEAU_VESTIBULE.id]: { morceau: MORCEAU_VESTIBULE, textes: TEXTES_MORCEAU_VESTIBULE },
  [MORCEAU_M07.id]: { morceau: MORCEAU_M07, textes: TEXTES_MORCEAU_M07 },
  [MORCEAU_M10.id]: { morceau: MORCEAU_M10, textes: TEXTES_MORCEAU_M10 },
  [MORCEAU_M03.id]: { morceau: MORCEAU_M03, textes: TEXTES_MORCEAU_M03 },
  [MORCEAU_ESSAI.id]: { morceau: MORCEAU_ESSAI, textes: TEXTES_MORCEAU_ESSAI },
};
