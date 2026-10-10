// Contenu du jeu : n'utilise que les types du moteur (docs/10-architecture.md §3).
import { MONDE_TEST } from './monde-test/monde';
import { PARCOURS_MONDE_TEST } from './monde-test/parcours';
import { TEXTES_MONDE_TEST } from './monde-test/textes';
import type { EntreeMonde } from './types';

export const MONDES: Readonly<Record<string, EntreeMonde>> = {
  [MONDE_TEST.id]: { monde: MONDE_TEST, textes: TEXTES_MONDE_TEST, parcours: PARCOURS_MONDE_TEST },
};

export const MONDE_PAR_DEFAUT = MONDE_TEST.id;

export { analyserGabarit, choisirVariante, ErreurTexte, FORMES, former, remplir } from './textes/gabarit';
export {
  libelleOption,
  nomDe,
  rendreConsultation,
  rendreEvenements,
  rendreObservation,
  rendreRefus,
  type CleTexte,
  type LibelleOption,
} from './textes/rendu';
export {
  ROLES_EVENEMENT,
  ROLES_INDISPONIBILITE,
  ROLES_LIBELLE,
  ROLES_OBSERVATION,
  ROLES_PASSAGE,
  type Nom,
  type TextesMonde,
  type Variantes,
} from './textes/types';
export type { EntreeMonde, EtapeParcours, Parcours } from './types';
