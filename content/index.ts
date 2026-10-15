// Contenu du jeu : n'utilise que les types du moteur (docs/10-architecture.md §3).
import { MONDE_AR01 } from './ar-01/monde';
import { PARCOURS_AR01 } from './ar-01/parcours';
import { TEXTES_AR01 } from './ar-01/textes';
import { MONDE_AR02 } from './ar-02/monde';
import { PARCOURS_AR02 } from './ar-02/parcours';
import { TEXTES_AR02 } from './ar-02/textes';
import { MONDE_M07 } from './m-07/monde';
import { PARCOURS_M07 } from './m-07/parcours';
import { TEXTES_M07, TEXTES_PROPRES_M07 } from './m-07/textes';
import { MONDE_M08 } from './m-08/monde';
import { PARCOURS_M08 } from './m-08/parcours';
import { TEXTES_M08, TEXTES_PROPRES_M08 } from './m-08/textes';
import { MONDE_M09 } from './m-09/monde';
import { PARCOURS_M09 } from './m-09/parcours';
import { TEXTES_M09, TEXTES_PROPRES_M09 } from './m-09/textes';
import { MONDE_M10 } from './m-10/monde';
import { PARCOURS_M10 } from './m-10/parcours';
import { TEXTES_M10, TEXTES_PROPRES_M10 } from './m-10/textes';
import { MONDE_TEST } from './monde-test/monde';
import { PARCOURS_MONDE_TEST } from './monde-test/parcours';
import { TEXTES_MONDE_TEST } from './monde-test/textes';
import type { TextesMorceau } from './textes/types';
import type { EntreeMonde } from './types';

export const MONDES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_AR01.id]: { monde: MONDE_AR01, textes: TEXTES_AR01, parcours: PARCOURS_AR01 },
  [MONDE_AR02.id]: { monde: MONDE_AR02, textes: TEXTES_AR02, parcours: PARCOURS_AR02 },
  [MONDE_TEST.id]: { monde: MONDE_TEST, textes: TEXTES_MONDE_TEST, parcours: [PARCOURS_MONDE_TEST] },
  // Stations de test des nouveaux morceaux (#105) : une par morceau, avec les parcours de sa fiche.
  [MONDE_M07.id]: { monde: MONDE_M07, textes: TEXTES_M07, parcours: PARCOURS_M07 },
  [MONDE_M08.id]: { monde: MONDE_M08, textes: TEXTES_M08, parcours: PARCOURS_M08 },
  [MONDE_M09.id]: { monde: MONDE_M09, textes: TEXTES_M09, parcours: PARCOURS_M09 },
  [MONDE_M10.id]: { monde: MONDE_M10, textes: TEXTES_M10, parcours: PARCOURS_M10 },
};

export const MONDE_PAR_DEFAUT = MONDE_AR01.id;

/** Textes propres de chaque station bâtie sur les couches (13 §7.2) : ce que le contrôle de fuites relit avec le socle. */
export const MORCEAUX_TEXTES: Readonly<Record<string, TextesMorceau>> = {
  [MONDE_M07.id]: TEXTES_PROPRES_M07,
  [MONDE_M08.id]: TEXTES_PROPRES_M08,
  [MONDE_M09.id]: TEXTES_PROPRES_M09,
  [MONDE_M10.id]: TEXTES_PROPRES_M10,
};

export { fuitesDeCouches, reunir } from './textes/couches';
export { MENACE, MOTS_MENACE } from './textes/menace';
export { SOCLE } from './textes/socle';
export { TEXTES_STATION_ESSAI } from './textes/station-essai';
export { MOTS_UNIVERS, UNIVERS } from './textes/univers';

export { analyserGabarit, choisirVariante, ErreurTexte, FORMES, former, remplir } from './textes/gabarit';
export { CARACTERE_PX, caracteresParLigne, CASE_PX, couperTexte, LIGNE_PX, MARGE_PX, nomLisible, nomSurPlan, placeDuNom } from './textes/lisibilite';
export {
  cleEvacuation,
  dangersDuRecit,
  libelleOption,
  nomDe,
  nomPassage,
  raconter,
  raconterDerniers,
  rendreApercu,
  rendreAssistance,
  rendreConsultation,
  rendreDangerVu,
  rendreEvenements,
  rendreMoment,
  rendreObservation,
  rendreRefus,
  texteAssistance,
  variantesDe,
  type ApercuTexte,
  type CleTexte,
  type NatureDanger,
  type LibelleOption,
} from './textes/rendu';
export {
  CLES_EVACUATION,
  ROLES_ALLER_SANS_DESTINATION,
  ROLES_DANGER,
  ROLES_EVENEMENT,
  ROLES_INDISPONIBILITE,
  ROLES_LIBELLE,
  ROLES_OBSERVATION,
  ROLES_PASSAGE,
  ROLES_PASSAGE_SANS_DESTINATION,
  ROLES_SAVOIR,
  TYPES_AGGRAVATION,
  type CleEvacuation,
  type Couche,
  type Nom,
  type TextesMonde,
  type TextesMorceau,
  type TypeAggravation,
  type TypeRecit,
  type Variantes,
} from './textes/types';
export type { EntreeMonde, EtapeParcours, Parcours } from './types';
export {
  ANCIENNETES,
  etatsDe,
  ficheDe,
  libellePiece,
  libellePlan,
  lignesListeCarte,
  MOTS_CARTE,
  nomCarte,
  regardDe,
  rendreListeCarte,
  type BlocListe,
  type EntreeListe,
  type FicheTexte,
} from './textes/carte';
