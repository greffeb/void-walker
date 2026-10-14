import type { DefMonde } from '../../engine';

// Station de test M-09 — Zone sans gravité (docs/13-morceaux-lancement.md §3, D-165, D-168, D-237, D-238).
// La coursive de transfert, gravité coupée au départ, relie deux sas ; chacun porte un interrupteur de la gravité de la coursive.
// La créature attend dans la soute, au-delà de la coursive. Une burette d'huile traîne dans les quartiers (MX-04).
// Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   quartiers ══porte══ sas ouest ══porte══ coursive de transfert ══porte══ sas est ══porte══ embarquement ══écoutille══ cabine
//                                                                                ╚══porte══ soute
export const MONDE_M09: DefMonde = {
  id: 'm-09',
  depart: 'p-quartiers',
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers' },
    { id: 'p-sas-ouest', nom: 'sas_ouest' },
    { id: 'p-transfert', nom: 'transfert', gravite: 'coupee' },
    { id: 'p-sas-est', nom: 'sas_est' },
    { id: 'p-soute', nom: 'soute' },
    { id: 'p-embarquement', nom: 'embarquement' },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-quartiers-sas-ouest', nom: 'porte', entre: ['p-quartiers', 'p-sas-ouest'], ouverte: false },
    { id: 'l-sas-ouest-transfert', nom: 'porte', entre: ['p-sas-ouest', 'p-transfert'], ouverte: true },
    { id: 'l-transfert-sas-est', nom: 'porte', entre: ['p-transfert', 'p-sas-est'], ouverte: true },
    { id: 'l-sas-est-soute', nom: 'porte', entre: ['p-sas-est', 'p-soute'], ouverte: false },
    { id: 'l-sas-est-embarquement', nom: 'porte', entre: ['p-sas-est', 'p-embarquement'], ouverte: false },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-burette', nom: 'burette', piece: 'p-quartiers', glissant: 1 },
    { id: 'o-interrupteur-ouest', nom: 'interrupteur', piece: 'p-sas-ouest', portable: false, gravite: 'p-transfert' },
    { id: 'o-interrupteur-est', nom: 'interrupteur', piece: 'p-sas-est', portable: false, gravite: 'p-transfert' },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-soute' },
  assistance: [
    { id: 'capsule', quand: { type: 'reveil' } },
    { id: 'gravite', quand: { type: 'arrivee', piece: 'p-sas-ouest' } },
  ],
};
