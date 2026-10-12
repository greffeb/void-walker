import type { DefMonde } from '../../engine';

// AR-02 — Dépressurisation préparée (docs/09-aventure-reference-vide.md §4, §5) : quatre pièces et la cabine de la capsule.
// Toutes les séparations sont étanches ; la baie est un vitrage extérieur fixe de la salle panoramique.
// Les règles lisent les qualités déclarées ici, jamais un nom ni un identifiant (D-078).
export const MONDE_AR02: DefMonde = {
  id: 'ar-02',
  depart: 'p-coursive',
  // Plan (14 §4.3) : local de sécurité, cabines du personnel et salle panoramique en rang, la salle d'embarquement sous la
  // panoramique ; la baie et la capsule donnent sur la coque.
  pieces: [
    { id: 'p-coursive', nom: 'coursive', plan: { x: 3, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-local', nom: 'local', plan: { x: 0, y: 0, largeur: 3, hauteur: 3 } },
    { id: 'p-panoramique', nom: 'panoramique', plan: { x: 7, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 7, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-coursive-local', nom: 'porte', entre: ['p-coursive', 'p-local'], ouverte: true },
    { id: 'l-coursive-panoramique', nom: 'porte', entre: ['p-coursive', 'p-panoramique'], ouverte: false },
    { id: 'l-panoramique-embarquement', nom: 'porte_grippee', entre: ['p-panoramique', 'p-embarquement'], ouverte: false, bruyante: true },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-terminal', nom: 'terminal', piece: 'p-coursive', portable: false },
    { id: 'o-signaletique', nom: 'signaletique', piece: 'p-coursive', portable: false },
    { id: 'o-casier', nom: 'casier', piece: 'p-local', portable: false },
    { id: 'o-combinaison', nom: 'combinaison', piece: 'p-local', protection: true },
    { id: 'o-decoupeuse', nom: 'decoupeuse', piece: 'p-local', perce: true },
    { id: 'o-baie', nom: 'baie', piece: 'p-panoramique', portable: false, vitrageExterieur: true },
    { id: 'o-kit', nom: 'kit', piece: 'p-panoramique', portable: false, rebouche: 1 },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-embarquement' },
  assistance: [
    { id: 'capsule', quand: { type: 'reveil' } },
    { id: 'presence', quand: { type: 'reveil' } },
  ],
};
