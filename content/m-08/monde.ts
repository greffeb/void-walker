import type { DefMonde } from '../../engine';

// Station de test M-08 — Passerelle effondrée (docs/13-morceaux-lancement.md §3, D-164, D-169, D-236).
// La galerie de la passerelle, coupée par un vide, se joue comme deux pièces, ses bords nord et sud, reliées par le vide ; la
// planche est dans l'atelier voisin des quartiers, avec un touret de câble, encombrant lui aussi. La créature attend dans la
// réserve, de l'autre côté du vide.
// Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   atelier ══porte══ quartiers ══porte grippée══ galerie nord ┄┄vide┄┄ galerie sud ══porte══ embarquement ══écoutille══ cabine
//                                                                             ╚══porte══ réserve
export const MONDE_M08: DefMonde = {
  id: 'm-08',
  depart: 'p-quartiers',
  // Plan (14 §4.3) : atelier et quartiers en haut, la galerie coupée en deux par le vide (nord, sud), la réserve à côté de la
  // galerie sud, l'embarquement dessous, contre la coque.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-atelier', nom: 'atelier', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-ouest', nom: 'ouest', plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-est', nom: 'est', plan: { x: 8, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-reserve', nom: 'reserve', plan: { x: 12, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 8, y: 6, largeur: 4, hauteur: 3 } },
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
