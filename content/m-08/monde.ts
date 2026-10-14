import type { DefMonde } from '../../engine';

// Station de test M-08 — Passerelle effondrée (docs/13-morceaux-lancement.md §3, D-164, D-169, D-236).
// La passerelle, coupée par un vide, se joue comme deux bords reliés par le vide ; la planche est dans l'atelier voisin des
// quartiers, avec un touret de câble, encombrant lui aussi. La créature attend dans la réserve, de l'autre côté du vide.
// Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   atelier ══porte══ quartiers ══porte grippée══ bord ouest ┄┄vide┄┄ bord est ══porte══ embarquement ══écoutille══ cabine
//                                                                         ╚══porte══ réserve
export const MONDE_M08: DefMonde = {
  id: 'm-08',
  depart: 'p-quartiers',
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers' },
    { id: 'p-atelier', nom: 'atelier' },
    { id: 'p-ouest', nom: 'ouest' },
    { id: 'p-est', nom: 'est' },
    { id: 'p-reserve', nom: 'reserve' },
    { id: 'p-embarquement', nom: 'embarquement' },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-quartiers-atelier', nom: 'porte', entre: ['p-quartiers', 'p-atelier'], ouverte: true },
    { id: 'l-quartiers-ouest', nom: 'porte_grippee', entre: ['p-quartiers', 'p-ouest'], ouverte: false, bruyante: true },
    { id: 'l-ouest-est', nom: 'vide', entre: ['p-ouest', 'p-est'], ouverte: true, gouffre: true },
    { id: 'l-est-reserve', nom: 'porte', entre: ['p-est', 'p-reserve'], ouverte: false },
    { id: 'l-est-embarquement', nom: 'porte', entre: ['p-est', 'p-embarquement'], ouverte: false },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-planche', nom: 'planche', piece: 'p-atelier', pont: true, encombrant: true },
    { id: 'o-touret', nom: 'touret', piece: 'p-atelier', encombrant: true },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-reserve' },
  assistance: [
    { id: 'capsule', quand: { type: 'reveil' } },
    { id: 'passerelle', quand: { type: 'arrivee', piece: 'p-ouest' } },
  ],
};
