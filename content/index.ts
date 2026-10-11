// Contenu du jeu : n'utilise que les types du moteur (docs/10-architecture.md §3).
import { MONDE_AR01 } from './ar-01/monde';
import { PARCOURS_AR01 } from './ar-01/parcours';
import { TEXTES_AR01 } from './ar-01/textes';
import { MONDE_TEST } from './monde-test/monde';
import { PARCOURS_MONDE_TEST } from './monde-test/parcours';
import { TEXTES_MONDE_TEST } from './monde-test/textes';
import type { EntreeMonde } from './types';

export const MONDES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_AR01.id]: { monde: MONDE_AR01, textes: TEXTES_AR01, parcours: PARCOURS_AR01 },
  [MONDE_TEST.id]: { monde: MONDE_TEST, textes: TEXTES_MONDE_TEST, parcours: [PARCOURS_MONDE_TEST] },
};

export const MONDE_PAR_DEFAUT = MONDE_AR01.id;

export { analyserGabarit, choisirVariante, ErreurTexte, FORMES, former, remplir } from './textes/gabarit';
export {
  cleEvacuation,
  libelleOption,
  nomDe,
  raconter,
  raconterDerniers,
  rendreApercu,
  rendreAssistance,
  rendreConsultation,
  rendreEvenements,
  rendreObservation,
  rendreRefus,
  texteAssistance,
  type ApercuTexte,
  type CleTexte,
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
  type Nom,
  type TextesMonde,
  type TypeAggravation,
  type TypeRecit,
  type Variantes,
} from './textes/types';
export type { EntreeMonde, EtapeParcours, Parcours } from './types';
