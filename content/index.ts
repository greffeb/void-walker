// Contenu du jeu : n'utilise que les types du moteur (docs/10-architecture.md §3).
import { MESSAGES_M07 } from './m-07/textes';
import { TEXTES_PROPRES_M08 } from './m-08/textes';
import { TEXTES_PROPRES_M09 } from './m-09/textes';
import { MESSAGES_M10 } from './m-10/textes';
import { MORCEAUX } from './morceaux';
import type { TextesMorceau } from './textes/types';

export { CATALOGUE_PIECES, PIECES_CATALOGUE, TABLE_BUTIN, TEXTES_CATALOGUE } from './catalogue';
export { MORCEAUX, type EntreeMorceau } from './morceaux';
export {
  COMPOSITIONS_CONTROLEES,
  COMPOSITIONS_PUBLIEES,
  creerCatalogue,
  GRAINE_GRANDE_MAX,
  GRANDES_PUBLIEES,
  VERSION_GENERATEUR,
  type CompositionGrande,
  MONDES,
  numeroter,
  sansConflit,
  type Catalogue,
  type Composition,
  type Refus,
} from './stations/catalogue';
export { PAIRES, type LignePaire } from './stations/paires';

/**
 * Textes propres que le contrôle de fuites relit avec le socle (13 §7.2) : ceux des morceaux, puis ceux qui n'appartiennent
 * qu'à une station de test.
 */
export const MORCEAUX_TEXTES: Readonly<Record<string, TextesMorceau>> = {
  ...Object.fromEntries(Object.entries(MORCEAUX).map(([id, { textes }]) => [id, textes])),
  'station m-07': { noms: {}, descriptions: {}, assistance: MESSAGES_M07 },
  'station m-08': TEXTES_PROPRES_M08,
  'station m-09': TEXTES_PROPRES_M09,
  'station m-10': { noms: {}, descriptions: {}, assistance: MESSAGES_M10 },
};

export { FIN, fuitesDeCouches, fuitesDuCatalogue, reunir } from './textes/couches';
export { rendreDocument, texteDocument, type DocumentRendu, type LigneDocument } from './textes/document';
export { DOCUMENTS, EMPLACEMENTS_DOCUMENTS, RESERVE_DOCUMENTS } from './textes/documents';
export { cleMort, MOMENTS_MAX, raconterFin, type FinDePartie, type RecitFin } from './textes/fin';
export { MENACE, MOTS_MENACE, MOTS_TRACES } from './textes/menace';
export { SOCLE } from './textes/socle';
export { TEXTES_STATION_ESSAI } from './textes/station-essai';
export { ASSISTANCE_STATION, MOTS_UNIVERS, UNIVERS } from './textes/univers';

export { analyserGabarit, choisirVariante, ErreurTexte, FORMES, former, remplir } from './textes/gabarit';
export { CARACTERE_PX, caracteresParLigne, CASE_PX, couperTexte, LIGNE_PX, MARGE_PX, nomLisible, nomSurPlan, placeDuNom } from './textes/lisibilite';
export {
  alertesMenace,
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
  CLES_MOMENT,
  CLES_MORT,
  ROLES_ALLER_SANS_DESTINATION,
  ROLES_DANGER,
  ROLES_EVENEMENT,
  ROLES_INDISPONIBILITE,
  ROLES_LIBELLE,
  ROLES_MOMENT,
  ROLES_OBSERVATION,
  ROLES_PASSAGE,
  ROLES_PASSAGE_SANS_DESTINATION,
  ROLES_SAVOIR,
  TYPES_AGGRAVATION,
  type CleEvacuation,
  type CleMoment,
  type CleMort,
  type Couche,
  type Nom,
  type PhraseFin,
  type SupportDocument,
  type TexteDocument,
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
