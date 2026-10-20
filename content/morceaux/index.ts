import type { DefMorceau } from '../../engine';
import type { TextesMorceau } from '../textes/types';
import { MORCEAU_CARREFOUR, TEXTES_MORCEAU_CARREFOUR } from './carrefour';
import { MORCEAU_ESSAI, TEXTES_MORCEAU_ESSAI } from './essai';
import { MORCEAU_M01, TEXTES_MORCEAU_M01 } from './m-01';
import { MORCEAU_M02, TEXTES_MORCEAU_M02 } from './m-02';
import { MORCEAU_M03, TEXTES_MORCEAU_M03 } from './m-03';
import { MORCEAU_M04, TEXTES_MORCEAU_M04 } from './m-04';
import { MORCEAU_M05, TEXTES_MORCEAU_M05 } from './m-05';
import { MORCEAU_M06, TEXTES_MORCEAU_M06 } from './m-06';
import { MORCEAU_M07, TEXTES_MORCEAU_M07 } from './m-07';
import { MORCEAU_M08, TEXTES_MORCEAU_M08 } from './m-08';
import { MORCEAU_M09, TEXTES_MORCEAU_M09 } from './m-09';
import { MORCEAU_M10, TEXTES_MORCEAU_M10 } from './m-10';
import { MORCEAU_M11, TEXTES_MORCEAU_M11 } from './m-11';
import { MORCEAU_VESTIBULE, TEXTES_MORCEAU_VESTIBULE } from './vestibule';

export interface EntreeMorceau {
  readonly morceau: DefMorceau;
  readonly textes: TextesMorceau;
}

/** Morceaux écrits à la main (13 §8), par identifiant : départ, chemins, carrefour de l'ordre libre, finals. */
export const MORCEAUX: Readonly<Record<string, EntreeMorceau>> = {
  [MORCEAU_VESTIBULE.id]: { morceau: MORCEAU_VESTIBULE, textes: TEXTES_MORCEAU_VESTIBULE },
  [MORCEAU_M01.id]: { morceau: MORCEAU_M01, textes: TEXTES_MORCEAU_M01 },
  [MORCEAU_M02.id]: { morceau: MORCEAU_M02, textes: TEXTES_MORCEAU_M02 },
  [MORCEAU_M04.id]: { morceau: MORCEAU_M04, textes: TEXTES_MORCEAU_M04 },
  [MORCEAU_M05.id]: { morceau: MORCEAU_M05, textes: TEXTES_MORCEAU_M05 },
  [MORCEAU_M07.id]: { morceau: MORCEAU_M07, textes: TEXTES_MORCEAU_M07 },
  [MORCEAU_M08.id]: { morceau: MORCEAU_M08, textes: TEXTES_MORCEAU_M08 },
  [MORCEAU_M09.id]: { morceau: MORCEAU_M09, textes: TEXTES_MORCEAU_M09 },
  [MORCEAU_M10.id]: { morceau: MORCEAU_M10, textes: TEXTES_MORCEAU_M10 },
  [MORCEAU_M11.id]: { morceau: MORCEAU_M11, textes: TEXTES_MORCEAU_M11 },
  [MORCEAU_CARREFOUR.id]: { morceau: MORCEAU_CARREFOUR, textes: TEXTES_MORCEAU_CARREFOUR },
  [MORCEAU_M03.id]: { morceau: MORCEAU_M03, textes: TEXTES_MORCEAU_M03 },
  [MORCEAU_M06.id]: { morceau: MORCEAU_M06, textes: TEXTES_MORCEAU_M06 },
  [MORCEAU_ESSAI.id]: { morceau: MORCEAU_ESSAI, textes: TEXTES_MORCEAU_ESSAI },
};
