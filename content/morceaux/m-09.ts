import type { DefMorceau } from '../../engine';
import { TEXTES_PROPRES_M09 } from '../m-09/textes';
import { repris } from '../textes/couches';
import type { TextesMorceau } from '../textes/types';

// M-09 — Zone sans gravité (13 §3, D-165, D-168, D-237, D-238), morceau de chemin. Les quartiers mènent au sas ouest ; la
// coursive de transfert, gravité coupée au départ, le relie au sas est, et chaque sas a un interrupteur de la gravité de la
// coursive. Le sas est donne sur la cale, où attend la créature, et sur le morceau suivant. Les règles lisent les qualités
// déclarées ici, jamais un nom (D-078).
//
//   quartiers ══porte══ sas ouest ══porte══ coursive de transfert ══porte══ sas est ══porte══ cale
//                                                                              ╚══porte══ (suite)
export const MORCEAU_M09: DefMorceau = {
  id: 'm-09',
  famille: 'chemin',
  // Tuile (14 §4.3) : quartiers, sas ouest, coursive de transfert, sas est et cale en rang.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-sas-ouest', nom: 'sas_ouest', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-transfert', nom: 'transfert', gravite: 'coupee', plan: { x: 8, y: 0, largeur: 6, hauteur: 3 } },
    { id: 'p-sas-est', nom: 'sas_est', plan: { x: 14, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-cale', nom: 'cale', plan: { x: 18, y: 0, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-quartiers-sas-ouest', nom: 'porte', entre: ['p-quartiers', 'p-sas-ouest'], ouverte: false },
    { id: 'l-sas-ouest-transfert', nom: 'porte', entre: ['p-sas-ouest', 'p-transfert'], ouverte: true },
    { id: 'l-transfert-sas-est', nom: 'porte', entre: ['p-transfert', 'p-sas-est'], ouverte: true },
    { id: 'l-sas-est-cale', nom: 'porte', entre: ['p-sas-est', 'p-cale'], ouverte: false },
  ],
  objets: [
    { id: 'o-interrupteur-ouest', nom: 'interrupteur_gravite', piece: 'p-sas-ouest', portable: false, gravite: 'p-transfert' },
    { id: 'o-interrupteur-est', nom: 'interrupteur_gravite', piece: 'p-sas-est', portable: false, gravite: 'p-transfert' },
  ],
  entree: 'p-quartiers',
  sortie: { piece: 'p-sas-est', porte: { nom: 'porte' } },
  placesCreature: ['p-cale'],
  demande: [],
  fournit: ['acces'],
  assistance: [{ id: 'gravite', quand: { type: 'arrivee', piece: 'p-sas-ouest' } }],
};

// Textes du morceau (C-07) : sas, interrupteur et message d'arrivée repris de la station de test M-09, l'interrupteur sous une
// clé distincte de celui des machines. La coursive de transfert et la cale sont écrites pour ce morceau ; la description de la
// coursive tait sa gravité, qui change en cours de partie, et l'observation la dit. Texte final non validé.
export const TEXTES_MORCEAU_M09: TextesMorceau = {
  noms: {
    sas_ouest: repris(TEXTES_PROPRES_M09.noms, 'sas_ouest'),
    transfert: repris(TEXTES_PROPRES_M09.noms, 'transfert'),
    sas_est: repris(TEXTES_PROPRES_M09.noms, 'sas_est'),
    cale: { texte: 'cale', genre: 'f', nombre: 's', elision: false },
    interrupteur_gravite: repris(TEXTES_PROPRES_M09.noms, 'interrupteur'),
  },
  descriptions: {
    sas_ouest: repris(TEXTES_PROPRES_M09.descriptions, 'sas_ouest'),
    transfert: [
      'Une longue coursive tapissée de poignées, jusqu’au plafond. Une ligne de vie court d’un sas à l’autre.',
      'Un tube de métal, des barreaux tout du long, sur chaque paroi. Aux deux bouts, la porte d’un sas.',
    ],
    sas_est: repris(TEXTES_PROPRES_M09.descriptions, 'sas_est'),
    cale: [
      'Une cale basse sous des poutrelles nues. Des conteneurs sanglés s’alignent contre les parois.',
      'Des conteneurs arrimés par des sangles, des filets tendus sous le plafond. Dans un coin, un conteneur cabossé.',
    ],
    interrupteur_gravite: repris(TEXTES_PROPRES_M09.descriptions, 'interrupteur'),
  },
  assistance: {
    gravite: repris(TEXTES_PROPRES_M09.assistance, 'gravite'),
  },
};
