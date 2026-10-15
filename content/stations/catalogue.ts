import type { Assembleur, DefAssistance, DefMonde, DefStation } from '../../engine';
import { MONDE_AR01 } from '../ar-01/monde';
import { PARCOURS_AR01 } from '../ar-01/parcours';
import { TEXTES_AR01 } from '../ar-01/textes';
import { MONDE_AR02 } from '../ar-02/monde';
import { PARCOURS_AR02 } from '../ar-02/parcours';
import { TEXTES_AR02 } from '../ar-02/textes';
import { PARCOURS_M07 } from '../m-07/parcours';
import { MESSAGES_M07 } from '../m-07/textes';
import { MONDE_M08 } from '../m-08/monde';
import { PARCOURS_M08 } from '../m-08/parcours';
import { TEXTES_M08 } from '../m-08/textes';
import { MONDE_M09 } from '../m-09/monde';
import { PARCOURS_M09 } from '../m-09/parcours';
import { TEXTES_M09 } from '../m-09/textes';
import { PARCOURS_M10 } from '../m-10/parcours';
import { MESSAGES_M10 } from '../m-10/textes';
import { MONDE_TEST } from '../monde-test/monde';
import { PARCOURS_MONDE_TEST } from '../monde-test/parcours';
import { TEXTES_MONDE_TEST } from '../monde-test/textes';
import { MORCEAU_ESSAI, TEXTES_MORCEAU_ESSAI } from '../morceaux/essai';
import { MORCEAU_M07, TEXTES_MORCEAU_M07 } from '../morceaux/m-07';
import { MORCEAU_M10, TEXTES_MORCEAU_M10 } from '../morceaux/m-10';
import { reunir } from '../textes/couches';
import type { EntreeMonde } from '../types';

// Catalogue des mondes jouables (#152) : les mondes écrits en entier, et les stations assemblées depuis les morceaux. Le
// contenu n'importe que les types du moteur (docs/10-architecture.md §3) : l'assembleur lui est donné.

const REFERENCES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_AR01.id]: { monde: MONDE_AR01, textes: TEXTES_AR01, parcours: PARCOURS_AR01 },
  [MONDE_AR02.id]: { monde: MONDE_AR02, textes: TEXTES_AR02, parcours: PARCOURS_AR02 },
  [MONDE_TEST.id]: { monde: MONDE_TEST, textes: TEXTES_MONDE_TEST, parcours: [PARCOURS_MONDE_TEST] },
};

// Stations de test des nouveaux morceaux (#105) encore écrites en entier, avec les parcours de leur fiche.
const STATIONS_ECRITES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_M08.id]: { monde: MONDE_M08, textes: TEXTES_M08, parcours: PARCOURS_M08 },
  [MONDE_M09.id]: { monde: MONDE_M09, textes: TEXTES_M09, parcours: PARCOURS_M09 },
};

/** Mondes écrits en entier, sans assemblage. */
export const MONDES: Readonly<Record<string, EntreeMonde>> = { ...REFERENCES, ...STATIONS_ECRITES };

export interface Catalogue {
  /** AR-01, AR-02, monde de test, m-07 à m-10 ; m-07 et m-10 assemblés. */
  readonly mondes: Readonly<Record<string, EntreeMonde>>;
}

const AU_REVEIL: readonly DefAssistance[] = [
  { id: 'capsule', quand: { type: 'reveil' } },
  { id: 'presence', quand: { type: 'reveil' } },
];

// Stations de test M-07 et M-10 : le morceau, puis l'embarquement d'essai ; seule la sortie de M-07 est ouverte au départ.
const STATION_M07: DefStation = { id: 'm-07', morceaux: [MORCEAU_M07, MORCEAU_ESSAI], creature: 'm-07/p-soute', graine: 1, sortiesOuvertes: ['m-07'], assistance: AU_REVEIL };
const STATION_M10: DefStation = { id: 'm-10', morceaux: [MORCEAU_M10, MORCEAU_ESSAI], creature: 'm-10/p-entrepot', graine: 1, assistance: AU_REVEIL };

export function creerCatalogue(assembler: Assembleur): Catalogue {
  const assemblee = (station: DefStation): DefMonde => {
    const resultat = assembler(station);
    if (resultat.type === 'station') return resultat.monde;
    const detail = resultat.type === 'invalide' ? ` : ${resultat.erreurs.join(' ')}` : '.';
    throw new Error(`Station de test ${station.id} non assemblée (${resultat.type})${detail}`);
  };
  return {
    mondes: {
      ...REFERENCES,
      [STATION_M07.id]: { monde: assemblee(STATION_M07), textes: reunir([TEXTES_MORCEAU_M07, TEXTES_MORCEAU_ESSAI], MESSAGES_M07), parcours: PARCOURS_M07 },
      ...STATIONS_ECRITES,
      [STATION_M10.id]: { monde: assemblee(STATION_M10), textes: reunir([TEXTES_MORCEAU_M10, TEXTES_MORCEAU_ESSAI], MESSAGES_M10), parcours: PARCOURS_M10 },
    },
  };
}
