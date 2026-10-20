import type { Assembleur, DefAccroche, DefAssistance, DefCommande, DefMonde, DefStation } from '../../engine';
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
import { MORCEAUX, type EntreeMorceau } from '../morceaux';
import { CLOISON_1, cloison2, MORCEAU_CARREFOUR, TEXTES_MORCEAU_CARREFOUR } from '../morceaux/carrefour';
import { MORCEAU_ESSAI, TEXTES_MORCEAU_ESSAI } from '../morceaux/essai';
import { MORCEAU_M07, TEXTES_MORCEAU_M07 } from '../morceaux/m-07';
import { MORCEAU_M10, TEXTES_MORCEAU_M10 } from '../morceaux/m-10';
import { MORCEAU_VESTIBULE, TEXTES_MORCEAU_VESTIBULE } from '../morceaux/vestibule';
import { reunir } from '../textes/couches';
import { DOCUMENTS } from '../textes/documents';
import { ASSISTANCE_STATION } from '../textes/univers';
import type { EntreeMonde } from '../types';
import { court, PAIRES, premierRefus, type LignePaire } from './paires';
import { numeroter, sansConflit } from './textes-station';
import { definirGrande, GRAINE_GRANDE_MAX, prevoirGrandes, VERSION_GENERATEUR, type CompositionGrande, type GrandePrevue } from './grandes';
import { GRANDES_PUBLIEES } from './grandes-publiees';
import { TEXTES_CATALOGUE } from '../catalogue';

export { numeroter, sansConflit } from './textes-station';
export { GRAINE_GRANDE_MAX, VERSION_GENERATEUR, type CompositionGrande } from './grandes';
export { GRANDES_PUBLIEES } from './grandes-publiees';

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

export interface Refus {
  readonly refus: string;
}

/**
 * Vestibule, un ou deux morceaux de chemin distincts dans un ordre donné, un final et la place de la créature dans l'un de
 * ces morceaux (13 §7.1, D-161, spec L3 §4.1). En ordre libre, deux branches qui partent du couloir du carrefour, chacune
 * avec la commande de l'une des deux cloisons du sas (D-259, spec L5 §3).
 */
export interface Composition {
  /** `<chemins>-<final>-<place>`, ex. 'm07-m03-soute', 'm07-m10-m03-soute' ; `ol-<A>-<B>-<final>-<place>` en ordre libre. */
  readonly id: string;
  readonly forme: 'chaine' | 'libre';
  /**
   * Un ou deux morceaux de chemin distincts, dans l'ordre de la station : ['m-07', 'm-10'] ; en ordre libre, les branches A
   * puis B, A au plus petit numéro, sa commande levant la première cloison.
   */
  readonly chemins: readonly string[];
  readonly final: string;
  /** Pièce préfixée, ex. 'm-07/p-soute'. */
  readonly creature: string;
  /**
   * Motif de la première paire refusée de la station, dans l'ordre des morceaux, avant tout plan ; en ordre libre, ou d'une
   * place de la créature écartée (D-268) ; `null` si rien n'est refusé.
   */
  readonly refus: string | null;
}

/** Compositions dont toutes les graines sont prouvées, seules proposées au joueur. */
export const COMPOSITIONS_PUBLIEES: readonly string[] = [
  'm01-m02-m03-reserve',
  'm01-m02-m06-embarquement',
  'm01-m03-reserve',
  'm01-m04-m03-observation',
  'm01-m04-m03-reserve',
  'm01-m04-m06-embarquement',
  'm01-m04-m06-observation',
  'm01-m05-m03-reserve',
  'm01-m05-m03-tri',
  'm01-m05-m06-embarquement',
  'm01-m05-m06-tri',
  'm01-m06-embarquement',
  'm01-m07-m03-reserve',
  'm01-m07-m03-soute',
  'm01-m07-m06-embarquement',
  'm01-m07-m06-soute',
  'm01-m08-m03-magasin',
  'm01-m08-m03-reserve',
  'm01-m08-m06-embarquement',
  'm01-m08-m06-magasin',
  'm01-m09-m03-cale',
  'm01-m09-m03-reserve',
  'm01-m09-m06-cale',
  'm01-m09-m06-embarquement',
  'm01-m10-m03-entrepot',
  'm01-m10-m03-reserve',
  'm01-m10-m06-embarquement',
  'm01-m10-m06-entrepot',
  'm02-m01-m03-reserve',
  'm02-m01-m06-embarquement',
  'm02-m03-reserve',
  'm02-m04-m03-observation',
  'm02-m04-m03-reserve',
  'm02-m04-m06-embarquement',
  'm02-m04-m06-observation',
  'm02-m05-m03-reserve',
  'm02-m05-m03-tri',
  'm02-m05-m06-embarquement',
  'm02-m05-m06-tri',
  'm02-m06-embarquement',
  'm02-m07-m03-reserve',
  'm02-m07-m03-soute',
  'm02-m07-m06-embarquement',
  'm02-m07-m06-soute',
  'm02-m08-m03-magasin',
  'm02-m08-m03-reserve',
  'm02-m08-m06-embarquement',
  'm02-m08-m06-magasin',
  'm02-m09-m03-cale',
  'm02-m09-m03-reserve',
  'm02-m09-m06-cale',
  'm02-m09-m06-embarquement',
  'm02-m10-m03-entrepot',
  'm02-m10-m03-reserve',
  'm02-m10-m06-embarquement',
  'm02-m10-m06-entrepot',
  'm04-m01-m03-observation',
  'm04-m01-m03-palier',
  'm04-m01-m03-reserve',
  'm04-m01-m06-embarquement',
  'm04-m01-m06-observation',
  'm04-m01-m06-palier',
  'm04-m02-m03-atelier',
  'm04-m02-m03-observation',
  'm04-m02-m03-reserve',
  'm04-m02-m06-atelier',
  'm04-m02-m06-embarquement',
  'm04-m02-m06-observation',
  'm04-m03-observation',
  'm04-m03-reserve',
  'm04-m05-m03-observation',
  'm04-m05-m03-reserve',
  'm04-m05-m03-tri',
  'm04-m05-m06-embarquement',
  'm04-m05-m06-observation',
  'm04-m05-m06-tri',
  'm04-m06-embarquement',
  'm04-m06-observation',
  'm04-m07-m03-observation',
  'm04-m07-m03-reserve',
  'm04-m07-m03-soute',
  'm04-m07-m06-embarquement',
  'm04-m07-m06-observation',
  'm04-m07-m06-soute',
  'm04-m08-m03-magasin',
  'm04-m08-m03-observation',
  'm04-m08-m03-reserve',
  'm04-m08-m06-embarquement',
  'm04-m08-m06-magasin',
  'm04-m08-m06-observation',
  'm04-m09-m03-cale',
  'm04-m09-m03-observation',
  'm04-m09-m03-reserve',
  'm04-m09-m06-cale',
  'm04-m09-m06-embarquement',
  'm04-m09-m06-observation',
  'm04-m10-m03-entrepot',
  'm04-m10-m03-observation',
  'm04-m10-m03-reserve',
  'm04-m10-m06-embarquement',
  'm04-m10-m06-entrepot',
  'm04-m10-m06-observation',
  'm05-m01-m03-reserve',
  'm05-m01-m03-tri',
  'm05-m01-m06-embarquement',
  'm05-m01-m06-tri',
  'm05-m02-m03-reserve',
  'm05-m02-m03-tri',
  'm05-m02-m06-embarquement',
  'm05-m02-m06-tri',
  'm05-m03-reserve',
  'm05-m03-tri',
  'm05-m04-m03-observation',
  'm05-m04-m03-reserve',
  'm05-m04-m03-tri',
  'm05-m04-m06-embarquement',
  'm05-m04-m06-observation',
  'm05-m04-m06-tri',
  'm05-m06-embarquement',
  'm05-m06-tri',
  'm05-m07-m03-reserve',
  'm05-m07-m03-soute',
  'm05-m07-m03-tri',
  'm05-m07-m06-embarquement',
  'm05-m07-m06-soute',
  'm05-m07-m06-tri',
  'm05-m08-m03-magasin',
  'm05-m08-m03-reserve',
  'm05-m08-m03-tri',
  'm05-m08-m06-embarquement',
  'm05-m08-m06-magasin',
  'm05-m08-m06-tri',
  'm05-m09-m03-cale',
  'm05-m09-m03-reserve',
  'm05-m09-m03-tri',
  'm05-m09-m06-cale',
  'm05-m09-m06-embarquement',
  'm05-m09-m06-tri',
  'm05-m10-m03-entrepot',
  'm05-m10-m03-reserve',
  'm05-m10-m03-tri',
  'm05-m10-m06-embarquement',
  'm05-m10-m06-entrepot',
  'm05-m10-m06-tri',
  'm07-m01-m03-palier',
  'm07-m01-m03-reserve',
  'm07-m01-m03-soute',
  'm07-m01-m06-embarquement',
  'm07-m01-m06-palier',
  'm07-m01-m06-soute',
  'm07-m02-m03-atelier',
  'm07-m02-m03-reserve',
  'm07-m02-m03-soute',
  'm07-m02-m06-atelier',
  'm07-m02-m06-embarquement',
  'm07-m02-m06-soute',
  'm07-m03-reserve',
  'm07-m03-soute',
  'm07-m04-m03-observation',
  'm07-m04-m03-reserve',
  'm07-m04-m03-soute',
  'm07-m04-m06-embarquement',
  'm07-m04-m06-observation',
  'm07-m04-m06-soute',
  'm07-m05-m03-reserve',
  'm07-m05-m03-soute',
  'm07-m05-m03-tri',
  'm07-m05-m06-embarquement',
  'm07-m05-m06-soute',
  'm07-m05-m06-tri',
  'm07-m06-embarquement',
  'm07-m06-soute',
  'm07-m08-m03-magasin',
  'm07-m08-m03-reserve',
  'm07-m08-m03-soute',
  'm07-m08-m06-embarquement',
  'm07-m08-m06-magasin',
  'm07-m08-m06-soute',
  'm07-m09-m03-cale',
  'm07-m09-m03-reserve',
  'm07-m09-m03-soute',
  'm07-m09-m06-cale',
  'm07-m09-m06-embarquement',
  'm07-m09-m06-soute',
  'm07-m10-m03-entrepot',
  'm07-m10-m03-reserve',
  'm07-m10-m03-soute',
  'm07-m10-m06-embarquement',
  'm07-m10-m06-entrepot',
  'm07-m10-m06-soute',
  'm08-m01-m03-magasin',
  'm08-m01-m03-palier',
  'm08-m01-m03-reserve',
  'm08-m01-m06-embarquement',
  'm08-m01-m06-magasin',
  'm08-m01-m06-palier',
  'm08-m02-m03-atelier',
  'm08-m02-m03-magasin',
  'm08-m02-m03-reserve',
  'm08-m02-m06-atelier',
  'm08-m02-m06-embarquement',
  'm08-m02-m06-magasin',
  'm08-m03-magasin',
  'm08-m03-reserve',
  'm08-m04-m03-magasin',
  'm08-m04-m03-observation',
  'm08-m04-m03-reserve',
  'm08-m04-m06-embarquement',
  'm08-m04-m06-magasin',
  'm08-m04-m06-observation',
  'm08-m05-m03-magasin',
  'm08-m05-m03-reserve',
  'm08-m05-m03-tri',
  'm08-m05-m06-embarquement',
  'm08-m05-m06-magasin',
  'm08-m05-m06-tri',
  'm08-m06-embarquement',
  'm08-m06-magasin',
  'm08-m07-m03-magasin',
  'm08-m07-m03-reserve',
  'm08-m07-m03-soute',
  'm08-m07-m06-embarquement',
  'm08-m07-m06-magasin',
  'm08-m07-m06-soute',
  'm08-m09-m03-cale',
  'm08-m09-m03-magasin',
  'm08-m09-m03-reserve',
  'm08-m09-m06-cale',
  'm08-m09-m06-embarquement',
  'm08-m09-m06-magasin',
  'm08-m10-m03-entrepot',
  'm08-m10-m03-magasin',
  'm08-m10-m03-reserve',
  'm08-m10-m06-embarquement',
  'm08-m10-m06-entrepot',
  'm08-m10-m06-magasin',
  'm09-m01-m03-cale',
  'm09-m01-m03-reserve',
  'm09-m01-m06-cale',
  'm09-m01-m06-embarquement',
  'm09-m02-m03-cale',
  'm09-m02-m03-reserve',
  'm09-m02-m06-cale',
  'm09-m02-m06-embarquement',
  'm09-m03-cale',
  'm09-m03-reserve',
  'm09-m04-m03-cale',
  'm09-m04-m03-observation',
  'm09-m04-m03-reserve',
  'm09-m04-m06-cale',
  'm09-m04-m06-embarquement',
  'm09-m04-m06-observation',
  'm09-m05-m03-cale',
  'm09-m05-m03-reserve',
  'm09-m05-m03-tri',
  'm09-m05-m06-cale',
  'm09-m05-m06-embarquement',
  'm09-m05-m06-tri',
  'm09-m06-cale',
  'm09-m06-embarquement',
  'm09-m07-m03-cale',
  'm09-m07-m03-reserve',
  'm09-m07-m03-soute',
  'm09-m07-m06-cale',
  'm09-m07-m06-embarquement',
  'm09-m07-m06-soute',
  'm09-m08-m03-cale',
  'm09-m08-m03-magasin',
  'm09-m08-m03-reserve',
  'm09-m08-m06-cale',
  'm09-m08-m06-embarquement',
  'm09-m08-m06-magasin',
  'm09-m10-m03-cale',
  'm09-m10-m03-entrepot',
  'm09-m10-m03-reserve',
  'm09-m10-m06-cale',
  'm09-m10-m06-embarquement',
  'm09-m10-m06-entrepot',
  'm10-m01-m03-entrepot',
  'm10-m01-m03-palier',
  'm10-m01-m03-reserve',
  'm10-m01-m06-embarquement',
  'm10-m01-m06-entrepot',
  'm10-m01-m06-palier',
  'm10-m02-m03-atelier',
  'm10-m02-m03-entrepot',
  'm10-m02-m03-reserve',
  'm10-m02-m06-atelier',
  'm10-m02-m06-embarquement',
  'm10-m02-m06-entrepot',
  'm10-m03-entrepot',
  'm10-m03-reserve',
  'm10-m04-m03-entrepot',
  'm10-m04-m03-observation',
  'm10-m04-m03-reserve',
  'm10-m04-m06-embarquement',
  'm10-m04-m06-entrepot',
  'm10-m04-m06-observation',
  'm10-m05-m03-entrepot',
  'm10-m05-m03-reserve',
  'm10-m05-m03-tri',
  'm10-m05-m06-embarquement',
  'm10-m05-m06-entrepot',
  'm10-m05-m06-tri',
  'm10-m06-embarquement',
  'm10-m06-entrepot',
  'm10-m07-m03-entrepot',
  'm10-m07-m03-reserve',
  'm10-m07-m03-soute',
  'm10-m07-m06-embarquement',
  'm10-m07-m06-entrepot',
  'm10-m07-m06-soute',
  'm10-m08-m03-entrepot',
  'm10-m08-m03-magasin',
  'm10-m08-m03-reserve',
  'm10-m08-m06-embarquement',
  'm10-m08-m06-entrepot',
  'm10-m08-m06-magasin',
  'm10-m09-m03-cale',
  'm10-m09-m03-entrepot',
  'm10-m09-m03-reserve',
  'm10-m09-m06-cale',
  'm10-m09-m06-embarquement',
  'm10-m09-m06-entrepot',
  'ol-m01-m02-m03-reserve',
  'ol-m01-m02-m06-embarquement',
  'ol-m01-m04-m03-observation',
  'ol-m01-m04-m03-reserve',
  'ol-m01-m04-m06-embarquement',
  'ol-m01-m04-m06-observation',
  'ol-m01-m05-m03-reserve',
  'ol-m01-m05-m03-tri',
  'ol-m01-m05-m06-embarquement',
  'ol-m01-m05-m06-tri',
  'ol-m01-m07-m03-reserve',
  'ol-m01-m07-m03-soute',
  'ol-m01-m07-m06-embarquement',
  'ol-m01-m07-m06-soute',
  'ol-m01-m08-m03-magasin',
  'ol-m01-m08-m03-reserve',
  'ol-m01-m08-m06-embarquement',
  'ol-m01-m08-m06-magasin',
  'ol-m01-m09-m03-cale',
  'ol-m01-m09-m03-reserve',
  'ol-m01-m09-m06-cale',
  'ol-m01-m09-m06-embarquement',
  'ol-m01-m10-m03-entrepot',
  'ol-m01-m10-m03-reserve',
  'ol-m01-m10-m06-embarquement',
  'ol-m01-m10-m06-entrepot',
  'ol-m02-m04-m03-observation',
  'ol-m02-m04-m03-reserve',
  'ol-m02-m04-m06-embarquement',
  'ol-m02-m04-m06-observation',
  'ol-m02-m05-m03-reserve',
  'ol-m02-m05-m03-tri',
  'ol-m02-m05-m06-embarquement',
  'ol-m02-m05-m06-tri',
  'ol-m02-m07-m03-reserve',
  'ol-m02-m07-m03-soute',
  'ol-m02-m07-m06-embarquement',
  'ol-m02-m07-m06-soute',
  'ol-m02-m08-m03-magasin',
  'ol-m02-m08-m03-reserve',
  'ol-m02-m08-m06-embarquement',
  'ol-m02-m08-m06-magasin',
  'ol-m02-m09-m03-cale',
  'ol-m02-m09-m03-reserve',
  'ol-m02-m09-m06-cale',
  'ol-m02-m09-m06-embarquement',
  'ol-m02-m10-m03-entrepot',
  'ol-m02-m10-m03-reserve',
  'ol-m02-m10-m06-embarquement',
  'ol-m02-m10-m06-entrepot',
  'ol-m04-m05-m03-observation',
  'ol-m04-m05-m03-reserve',
  'ol-m04-m05-m03-tri',
  'ol-m04-m05-m06-embarquement',
  'ol-m04-m05-m06-observation',
  'ol-m04-m05-m06-tri',
  'ol-m04-m07-m03-observation',
  'ol-m04-m07-m03-reserve',
  'ol-m04-m07-m03-soute',
  'ol-m04-m07-m06-embarquement',
  'ol-m04-m07-m06-observation',
  'ol-m04-m07-m06-soute',
  'ol-m04-m08-m03-magasin',
  'ol-m04-m08-m03-observation',
  'ol-m04-m08-m03-reserve',
  'ol-m04-m08-m06-embarquement',
  'ol-m04-m08-m06-magasin',
  'ol-m04-m08-m06-observation',
  'ol-m04-m09-m03-cale',
  'ol-m04-m09-m03-observation',
  'ol-m04-m09-m03-reserve',
  'ol-m04-m09-m06-cale',
  'ol-m04-m09-m06-embarquement',
  'ol-m04-m09-m06-observation',
  'ol-m04-m10-m03-entrepot',
  'ol-m04-m10-m03-observation',
  'ol-m04-m10-m03-reserve',
  'ol-m04-m10-m06-embarquement',
  'ol-m04-m10-m06-entrepot',
  'ol-m04-m10-m06-observation',
  'ol-m05-m07-m03-reserve',
  'ol-m05-m07-m03-soute',
  'ol-m05-m07-m03-tri',
  'ol-m05-m07-m06-embarquement',
  'ol-m05-m07-m06-soute',
  'ol-m05-m07-m06-tri',
  'ol-m05-m08-m03-magasin',
  'ol-m05-m08-m03-reserve',
  'ol-m05-m08-m03-tri',
  'ol-m05-m08-m06-embarquement',
  'ol-m05-m08-m06-magasin',
  'ol-m05-m08-m06-tri',
  'ol-m05-m09-m03-cale',
  'ol-m05-m09-m03-reserve',
  'ol-m05-m09-m03-tri',
  'ol-m05-m09-m06-cale',
  'ol-m05-m09-m06-embarquement',
  'ol-m05-m09-m06-tri',
  'ol-m05-m10-m03-entrepot',
  'ol-m05-m10-m03-reserve',
  'ol-m05-m10-m03-tri',
  'ol-m05-m10-m06-embarquement',
  'ol-m05-m10-m06-entrepot',
  'ol-m05-m10-m06-tri',
  'ol-m07-m08-m03-magasin',
  'ol-m07-m08-m03-reserve',
  'ol-m07-m08-m03-soute',
  'ol-m07-m08-m06-embarquement',
  'ol-m07-m08-m06-magasin',
  'ol-m07-m08-m06-soute',
  'ol-m07-m09-m03-cale',
  'ol-m07-m09-m03-reserve',
  'ol-m07-m09-m03-soute',
  'ol-m07-m09-m06-cale',
  'ol-m07-m09-m06-embarquement',
  'ol-m07-m09-m06-soute',
  'ol-m07-m10-m03-entrepot',
  'ol-m07-m10-m03-reserve',
  'ol-m07-m10-m03-soute',
  'ol-m07-m10-m06-embarquement',
  'ol-m07-m10-m06-entrepot',
  'ol-m07-m10-m06-soute',
  'ol-m08-m09-m03-cale',
  'ol-m08-m09-m03-magasin',
  'ol-m08-m09-m03-reserve',
  'ol-m08-m09-m06-cale',
  'ol-m08-m09-m06-embarquement',
  'ol-m08-m09-m06-magasin',
  'ol-m08-m10-m03-entrepot',
  'ol-m08-m10-m03-magasin',
  'ol-m08-m10-m03-reserve',
  'ol-m08-m10-m06-embarquement',
  'ol-m08-m10-m06-entrepot',
  'ol-m08-m10-m06-magasin',
  'ol-m09-m10-m03-cale',
  'ol-m09-m10-m03-entrepot',
  'ol-m09-m10-m03-reserve',
  'ol-m09-m10-m06-cale',
  'ol-m09-m10-m06-embarquement',
  'ol-m09-m10-m06-entrepot',
];

/** Compositions publiées que `check:texts` explore (spec L3 §6.4, spec L4 §7) ; les deux dernières en ordre libre (spec L5 §6). */
export const COMPOSITIONS_CONTROLEES: readonly string[] = [
  'm01-m03-reserve',
  'm01-m05-m03-tri',
  'm02-m06-embarquement',
  'm02-m07-m06-soute',
  'm04-m09-m06-observation',
  'm05-m08-m03-magasin',
  'm07-m02-m03-atelier',
  'm08-m01-m06-palier',
  'm09-m10-m06-cale',
  'm10-m04-m03-entrepot',
  'ol-m02-m08-m06-magasin',
  'ol-m05-m10-m03-tri',
];

export interface Catalogue {
  /** AR-01, AR-02, monde de test, m-07 à m-10 ; m-07 et m-10 assemblés. */
  readonly mondes: Readonly<Record<string, EntreeMonde>>;
  /** Toutes les compositions possibles : chaque suite d'un ou deux chemins distincts × chaque final × chaque place de ces morceaux, triées. */
  readonly compositions: readonly Composition[];
  /** Station `<composition>-<graine>`, publiée ou non ; refusée si la table la refuse, si la graine est invalide ou sans plan. */
  construire(composition: string, graine: number): EntreeMonde | Refus;
  /** Monde fixe, ou station exacte `<composition>-<graine>` d'une composition publiée. */
  resoudre(id: string): EntreeMonde | Refus;
  /**
   * Final à pile ou face parmi les finals publiés, composition publiée au hasard, graine du plan, dans cet ordre ;
   * `composition` force la composition. `hasard()` rend un entier de 0 à 4294967295.
   */
  tirer(hasard: () => number, composition?: string): EntreeMonde | Refus;
  /** Définition de la station `<composition>-<graine>`, permise par la table, avant assemblage : pour mesurer les plans. */
  definir(composition: string, graine: number): DefStation | Refus;
  /** Grandes stations possibles (spec 2026-10-18 §4.1), hors de `compositions`, triées. */
  readonly grandes: readonly CompositionGrande[];
  /** Grandes stations publiées et prouvées : identifiants complets `g1-…-<graine>` (spec §7.2). */
  readonly publiees: readonly string[];
  /**
   * NOUVELLE PARTIE (D-313) : pile ou face sur le final (D-253), une station sur trois en ordre libre (D-270), puis une grande
   * station publiée au hasard ; `composition` force une grande composition.
   */
  tirerGrande(hasard: () => number, composition?: string): EntreeMonde | Refus;
  /** Grande station exacte, publiée ou non : pour la prouver avant de la publier. */
  construireGrande(composition: string, graine: number): EntreeMonde | Refus;
  /** Définition d’une grande station avant assemblage : pour mesurer les plans. */
  definirGrande(composition: string, graine: number): DefStation | Refus;
}

const AU_REVEIL: readonly DefAssistance[] = [
  { id: 'capsule', quand: { type: 'reveil' } },
  { id: 'presence', quand: { type: 'reveil' } },
];

// Stations de test M-07 et M-10 : le morceau, puis l'embarquement d'essai ; seule la sortie de M-07 est ouverte au départ.
const STATION_M07: DefStation = { id: 'm-07', morceaux: [MORCEAU_M07, MORCEAU_ESSAI], creature: 'm-07/p-soute', graine: 1, sortiesOuvertes: ['m-07'], assistance: AU_REVEIL };
const STATION_M10: DefStation = { id: 'm-10', morceaux: [MORCEAU_M10, MORCEAU_ESSAI], creature: 'm-10/p-entrepot', graine: 1, assistance: AU_REVEIL };

// Station tirée : le réveil, le départ et la longue attente (#225) ; pas de message de présence, qui nommerait la place tirée.
const ASSISTANCE_TIREE: readonly DefAssistance[] = [
  { id: 'reveil', quand: { type: 'reveil' } },
  { id: 'depart', quand: { type: 'evacuation' } },
  { id: 'patience', quand: { type: 'patience' } },
];

/** Celle du moteur (`engine/des.ts`), que le contenu ne peut pas importer. */
const GRAINE_MAX = 0xffffffff;
const ESSAIS_PLAN = 50;
/** Forme d'un monde que le service de rapports accepte (`report-service/src/rapport.ts`). */
const FORME_ID = /^[a-z0-9-]{1,40}$/;
const GRAINE_ECRITE = /^(0|[1-9][0-9]*)$/;
const MAL_FORME = 'identifiant mal formé (minuscules, chiffres et tirets, 40 caractères au plus)';

const graineValide = (graine: number): boolean => Number.isInteger(graine) && graine >= 0 && graine <= GRAINE_MAX;

const VESTIBULE: EntreeMorceau = { morceau: MORCEAU_VESTIBULE, textes: TEXTES_MORCEAU_VESTIBULE };
const CARREFOUR: EntreeMorceau = { morceau: MORCEAU_CARREFOUR, textes: TEXTES_MORCEAU_CARREFOUR };

interface Prevue {
  readonly composition: Composition;
  /** Chemins puis final, sans le vestibule ni le carrefour. */
  readonly morceaux: readonly EntreeMorceau[];
}

/**
 * Places où la créature bouche le seul passage de son morceau : en chaîne, prouvées seulement derrière un obstacle qui permet
 * de s'en débarrasser (D-268). En ordre libre, les deux branches partent du même couloir et aucune ne précède l'autre : ces
 * places y sont écartées avant tout plan (spec L5 §3.2).
 */
const PLACES_DERRIERE_UN_OBSTACLE: readonly string[] = ['m-01/p-palier', 'm-02/p-atelier'];

function refusDePlace(creature: string): string {
  return `Créature en ${creature} : écartée sans recherche. Cette place n’est permise que derrière un obstacle qui permet de s’en débarrasser (D-268) ; en ordre libre, aucune branche ne précède l’autre.`;
}

/**
 * Pièce de la commande d'une branche, « au-delà de son obstacle » (13 §8.3) : sa pièce de sortie, sauf pour M-10, dont la
 * coursive de sortie se rejoint depuis les quartiers sans rien franchir. Sa commande est dans l'entrepôt, après la chambre
 * froide, là où attend la créature (spec L5 §3.3).
 */
const PIECES_COMMANDE: Readonly<Record<string, string>> = { 'm-10': 'p-entrepot' };

/** Le vestibule en tête ; l'embarquement d'essai n'est le final d'aucune composition. */
function prevoir(table: readonly LignePaire[]): Prevue[] {
  const entrees = Object.values(MORCEAUX);
  const chemins = entrees.filter(({ morceau }) => morceau.famille === 'chemin');
  const finals = entrees.filter(({ morceau }) => morceau.famille === 'final' && morceau.id !== MORCEAU_ESSAI.id);
  const suites = (forme: Composition['forme']): EntreeMorceau[][] =>
    forme === 'chaine'
      ? [...chemins.map((chemin) => [chemin]), ...chemins.flatMap((x) => chemins.filter((y) => y !== x).map((y) => [x, y]))]
      : chemins.flatMap((x, rang) => chemins.slice(rang + 1).map((y) => [x, y]));
  const prevues = (['chaine', 'libre'] as const).flatMap((forme) =>
    suites(forme).flatMap((suite) =>
      finals.flatMap((final) => {
        const morceaux = [...suite, final];
        const refus = premierRefus(table, suite.map((chemin) => chemin.morceau), final.morceau);
        return morceaux.flatMap(({ morceau }) =>
          morceau.placesCreature.map((place): Prevue => {
            const nom = morceau.pieces.find((piece) => piece.id === place)?.nom ?? place;
            const id = [...(forme === 'libre' ? ['ol'] : []), ...morceaux.map((entree) => court(entree.morceau)), nom].join('-');
            const creature = `${morceau.id}/${place}`;
            const refusPlace = forme === 'libre' && PLACES_DERRIERE_UN_OBSTACLE.includes(creature) ? refusDePlace(creature) : null;
            const composition = { id, forme, chemins: suite.map((chemin) => chemin.morceau.id), final: final.morceau.id, creature, refus: refus ?? refusPlace };
            return { composition, morceaux };
          }),
        );
      }),
    ),
  );
  return prevues.sort((x, y) => (x.composition.id < y.composition.id ? -1 : 1));
}

/**
 * Station d'une composition pour une graine de plan, et les morceaux dont viennent ses textes. En chaîne : vestibule, chemins,
 * final. En ordre libre (D-259, spec L5 §3) : vestibule, carrefour, branches A et B, final ; les branches s'accrochent au
 * couloir et finissent en cul-de-sac, une commande au-delà de leur obstacle (`PIECES_COMMANDE`) ; le final s'accroche au sas.
 */
function definirStation({ composition, morceaux }: Prevue, graine: number): { readonly station: DefStation; readonly entrees: readonly EntreeMorceau[] } {
  const id = `${composition.id}-${graine}`;
  const commun = { id, creature: composition.creature, graine, assistance: ASSISTANCE_TIREE };
  if (composition.forme === 'chaine') {
    const entrees = sansConflit([VESTIBULE, ...morceaux]);
    return { station: { ...commun, morceaux: entrees.map((entree) => entree.morceau) }, entrees };
  }
  const entrees = sansConflit([VESTIBULE, CARREFOUR, ...morceaux]);
  const [vestibule, carrefour, a, b, final] = entrees.map((entree) => entree.morceau);
  if (vestibule?.sortie === undefined || carrefour?.sortie === undefined || a?.sortie === undefined || b?.sortie === undefined || final === undefined) {
    throw new Error(`Composition ${composition.id} : morceaux de l’ordre libre incomplets.`);
  }
  const porte = { nom: 'porte' };
  const accroches: DefAccroche[] = [
    { depuis: vestibule.id, piece: vestibule.sortie.piece, vers: carrefour.id, porte: vestibule.sortie.porte },
    // Le final avant les branches : accroché au sas, il est le plus contraint à poser (spec L5 §3.2).
    { depuis: carrefour.id, piece: carrefour.sortie.piece, vers: final.id, porte: carrefour.sortie.porte },
    { depuis: carrefour.id, piece: carrefour.entree, vers: a.id, porte },
    { depuis: carrefour.id, piece: carrefour.entree, vers: b.id, porte },
  ];
  const commandes: DefCommande[] = [
    { id: 'o-commande-1', nom: 'commande_1', morceau: a.id, piece: PIECES_COMMANDE[a.id] ?? a.sortie.piece, cloison: CLOISON_1 },
    { id: 'o-commande-2', nom: 'commande_2', morceau: b.id, piece: PIECES_COMMANDE[b.id] ?? b.sortie.piece, cloison: cloison2(final.id) },
  ];
  return { station: { ...commun, morceaux: [vestibule, carrefour, a, b, final], accroches, commandes }, entrees };
}

export function creerCatalogue(
  assembler: Assembleur,
  table: readonly LignePaire[] = PAIRES,
  publiees: readonly string[] = COMPOSITIONS_PUBLIEES,
  grandesPubliees: readonly string[] = GRANDES_PUBLIEES,
): Catalogue {
  const assemblee = (station: DefStation): DefMonde => {
    const resultat = assembler(station);
    if (resultat.type === 'station') return resultat.monde;
    const detail = resultat.type === 'invalide' ? ` : ${resultat.erreurs.join(' ')}` : '.';
    throw new Error(`Station de test ${station.id} non assemblée (${resultat.type})${detail}`);
  };
  const mondes: Readonly<Record<string, EntreeMonde>> = {
    ...REFERENCES,
    [STATION_M07.id]: { monde: assemblee(STATION_M07), textes: reunir([TEXTES_MORCEAU_M07, TEXTES_MORCEAU_ESSAI], MESSAGES_M07), parcours: PARCOURS_M07 },
    ...STATIONS_ECRITES,
    [STATION_M10.id]: { monde: assemblee(STATION_M10), textes: reunir([TEXTES_MORCEAU_M10, TEXTES_MORCEAU_ESSAI], MESSAGES_M10), parcours: PARCOURS_M10 },
  };

  const prevues = prevoir(table);
  const parId = new Map(prevues.map((prevue) => [prevue.composition.id, prevue]));
  const proposees = new Set(publiees);
  // Par identifiant de station ; `null` : pas de plan pour cette graine.
  const memoire = new Map<string, EntreeMonde | Refus | null>();

  const assemblerPrevue = (prevue: Prevue, graine: number): EntreeMonde | Refus | null => {
    const id = `${prevue.composition.id}-${graine}`;
    if (memoire.has(id)) return memoire.get(id) ?? null;
    const { station, entrees } = definirStation(prevue, graine);
    const resultat = assembler(station);
    let obtenu: EntreeMonde | Refus | null = null;
    if (resultat.type === 'station') {
      const textes = reunir(entrees.map((entree) => entree.textes), ASSISTANCE_STATION);
      obtenu = numeroter({ monde: resultat.monde, textes, parcours: [] });
    } else if (resultat.type === 'invalide') obtenu = { refus: `Station ${id} invalide : ${resultat.erreurs.join(' ')}` };
    memoire.set(id, obtenu);
    return obtenu;
  };

  /** Composition connue et permise par la table. */
  const prevueDe = (composition: string): Prevue | Refus => {
    if (!FORME_ID.test(composition)) return { refus: `Composition inconnue : ${MAL_FORME}.` };
    const prevue = parId.get(composition);
    if (prevue === undefined) return { refus: `Composition inconnue : ${composition}.` };
    return prevue.composition.refus === null ? prevue : { refus: prevue.composition.refus };
  };

  /** Composition connue, permise par la table et publiée. */
  const proposable = (composition: string): Prevue | Refus => {
    const prevue = prevueDe(composition);
    if ('refus' in prevue || proposees.has(prevue.composition.id)) return prevue;
    return { refus: `Composition ${prevue.composition.id} non prouvée : non proposée.` };
  };

  const construire = (composition: string, graine: number): EntreeMonde | Refus => {
    const prevue = prevueDe(composition);
    if ('refus' in prevue) return prevue;
    if (!graineValide(graine)) return { refus: `Composition ${composition} : graine de plan invalide (${String(graine)}).` };
    return assemblerPrevue(prevue, graine) ?? { refus: `Station ${composition}-${graine} : aucun plan pour cette graine.` };
  };

  const grandes = prevoirGrandes(table);
  const grandeParId = new Map(grandes.map((prevue) => [prevue.composition.id, prevue]));
  const grandesProposees = new Set(grandesPubliees);

  const assemblerGrande = (prevue: GrandePrevue, graine: number): EntreeMonde | Refus | null => {
    const id = `${prevue.composition.id}-${graine}`;
    if (memoire.has(id)) return memoire.get(id) ?? null;
    const { station, entrees } = definirGrande(prevue, graine);
    const resultat = assembler(station);
    let obtenu: EntreeMonde | Refus | null = null;
    if (resultat.type === 'station') {
      // Les documents de l'univers, de la menace et de la trousse rejoignent les textes de chaque grande station (spec §8.5).
      const textes = reunir([...entrees.map((entree) => entree.textes), TEXTES_CATALOGUE, { noms: {}, descriptions: {}, assistance: {}, documents: DOCUMENTS }], ASSISTANCE_STATION);
      obtenu = numeroter({ monde: resultat.monde, textes, parcours: [] });
    } else if (resultat.type === 'invalide') obtenu = { refus: `Station ${id} invalide : ${resultat.erreurs.join(' ')}` };
    memoire.set(id, obtenu);
    return obtenu;
  };

  const grandeDe = (composition: string): GrandePrevue | Refus => {
    if (!FORME_ID.test(composition)) return { refus: `Composition inconnue : ${MAL_FORME}.` };
    const prevue = grandeParId.get(composition);
    if (prevue === undefined) return { refus: `Composition inconnue : ${composition}.` };
    return prevue.composition.refus === null ? prevue : { refus: prevue.composition.refus };
  };

  const construireGrande = (composition: string, graine: number): EntreeMonde | Refus => {
    const prevue = grandeDe(composition);
    if ('refus' in prevue) return prevue;
    if (!Number.isInteger(graine) || graine < 0 || graine > GRAINE_GRANDE_MAX) return { refus: `Composition ${composition} : graine de plan invalide (${String(graine)}).` };
    return assemblerGrande(prevue, graine) ?? { refus: `Station ${composition}-${graine} : aucun plan pour cette graine.` };
  };

  const definirGrandeId = (composition: string, graine: number): DefStation | Refus => {
    const prevue = grandeDe(composition);
    return 'refus' in prevue ? prevue : definirGrande(prevue, graine).station;
  };

  /** Grande station `g<version>-…-<graine>` : seulement de cette version du générateur, et publiée (spec §4.3). */
  const resoudreGrande = (id: string, version: number): EntreeMonde | Refus => {
    if (version !== VERSION_GENERATEUR) return { refus: 'Station d’une version précédente des stations : la partie ne peut pas être reprise.' };
    if (!grandesProposees.has(id)) return { refus: `Station ${id} non publiée : non proposée.` };
    const tiret = id.lastIndexOf('-');
    return construireGrande(id.slice(0, tiret), Number(id.slice(tiret + 1)));
  };

  const tirerGrande = (hasard: () => number, composition?: string): EntreeMonde | Refus => {
    const tirables = [...grandesProposees].map((id) => ({ id, prevue: grandeParId.get(id.slice(0, id.lastIndexOf('-'))) }));
    let parmi = tirables.filter((tirable) => tirable.prevue !== undefined && (composition === undefined || tirable.prevue.composition.id === composition));
    if (composition === undefined) {
      const finals = [...new Set(parmi.map((tirable) => tirable.prevue?.composition.final))];
      const final = finals[hasard() % Math.max(finals.length, 1)];
      parmi = parmi.filter((tirable) => tirable.prevue?.composition.final === final);
      const libres = parmi.filter((tirable) => tirable.prevue?.composition.forme === 'libre');
      const chaines = parmi.filter((tirable) => tirable.prevue?.composition.forme === 'chaine');
      // Une station sur trois en ordre libre (D-270), quand les deux formes sont publiées.
      if (libres.length > 0 && chaines.length > 0) parmi = hasard() % 3 === 0 ? libres : chaines;
    }
    const tiree = parmi[hasard() % Math.max(parmi.length, 1)];
    return tiree === undefined ? { refus: 'Aucune grande station publiée.' } : resoudre(tiree.id);
  };

  const resoudre = (id: string): EntreeMonde | Refus => {
    const fixe = Object.hasOwn(mondes, id) ? mondes[id] : undefined;
    if (fixe !== undefined) return fixe;
    if (!FORME_ID.test(id)) return { refus: `Station inconnue : ${MAL_FORME}.` };
    const version = /^g(\d+)-/.exec(id);
    if (version !== null) return resoudreGrande(id, Number(version[1]));
    const tiret = id.lastIndexOf('-');
    const composition = id.slice(0, Math.max(tiret, 0));
    if (!parId.has(composition)) return { refus: `Station inconnue : ${id}.` };
    const prevue = proposable(composition);
    if ('refus' in prevue) return prevue;
    const chiffres = id.slice(tiret + 1);
    if (!GRAINE_ECRITE.test(chiffres)) return { refus: `Station ${id} : graine de plan invalide.` };
    return construire(composition, Number(chiffres));
  };

  const tirer = (hasard: () => number, composition?: string): EntreeMonde | Refus => {
    let prevue: Prevue | Refus | undefined;
    if (composition === undefined) {
      const tirables = prevues.filter((candidate) => candidate.composition.refus === null && proposees.has(candidate.composition.id));
      const finals = [...new Set(tirables.map((candidate) => candidate.composition.final))];
      const final = finals[hasard() % finals.length];
      const parmi = tirables.filter((candidate) => candidate.composition.final === final);
      prevue = parmi[hasard() % parmi.length] ?? { refus: 'Aucune composition proposée.' };
    } else prevue = proposable(composition);
    if ('refus' in prevue) return prevue;
    for (let essai = 0; essai < ESSAIS_PLAN; essai++) {
      const graine = hasard();
      if (!graineValide(graine)) return { refus: `Composition ${prevue.composition.id} : graine de plan invalide (${String(graine)}).` };
      const obtenue = assemblerPrevue(prevue, graine);
      if (obtenue !== null) return obtenue;
    }
    return { refus: `Composition ${prevue.composition.id} : aucun plan en ${ESSAIS_PLAN} graines tirées.` };
  };

  const definir = (composition: string, graine: number): DefStation | Refus => {
    const prevue = prevueDe(composition);
    return 'refus' in prevue ? prevue : definirStation(prevue, graine).station;
  };

  return {
    mondes,
    compositions: prevues.map((prevue) => prevue.composition),
    construire,
    resoudre,
    tirer,
    definir,
    grandes: grandes.map((prevue) => prevue.composition),
    publiees: [...grandesPubliees],
    tirerGrande,
    construireGrande,
    definirGrande: definirGrandeId,
  };
}
