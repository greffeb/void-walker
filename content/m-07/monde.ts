import type { DefMonde } from '../../engine';

// Station de test M-07 — Salle des machines (docs/13-morceaux-lancement.md §3, D-163, D-173, D-234, D-235).
// Les quartiers ouvrent sur la soute, où attend la créature, et sur la salle des machines ; la porte grippée de la salle mène à
// la coursive, puis à l'embarquement. Les règles lisent les qualités déclarées ici, jamais un nom (D-078).
//
//   soute ══porte══ quartiers ══porte══ salle des machines ══porte grippée══ coursive ══porte══ embarquement ══écoutille══ cabine
export const MONDE_M07: DefMonde = {
  id: 'm-07',
  depart: 'p-quartiers',
  // Plan (14 §4.3) : soute, quartiers, salle des machines et coursive en rang, l'embarquement sous la coursive, contre la coque.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-soute', nom: 'soute', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-machines', nom: 'machines', machines: true, plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-coursive', nom: 'coursive', plan: { x: 12, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 12, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-quartiers-soute', nom: 'porte', entre: ['p-quartiers', 'p-soute'], ouverte: true },
    { id: 'l-quartiers-machines', nom: 'porte', entre: ['p-quartiers', 'p-machines'], ouverte: false },
    { id: 'l-machines-coursive', nom: 'porte_grippee', entre: ['p-machines', 'p-coursive'], ouverte: false, bruyante: true },
    { id: 'l-coursive-embarquement', nom: 'porte', entre: ['p-coursive', 'p-embarquement'], ouverte: true },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-interrupteur', nom: 'interrupteur', piece: 'p-machines', portable: false, machines: 'p-machines' },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-soute' },
  assistance: [
    { id: 'capsule', quand: { type: 'reveil' } },
    { id: 'presence', quand: { type: 'reveil' } },
  ],
};
