import type { DefMonde } from '../../engine';

// AR-02 — Dépressurisation préparée (docs/09-aventure-reference-vide.md §4, §5) : quatre pièces et la cabine de la capsule.
// Toutes les séparations sont étanches ; la baie est un vitrage extérieur fixe de la salle panoramique.
// Les règles lisent les qualités déclarées ici, jamais un nom ni un identifiant (D-078).
export const MONDE_AR02: DefMonde = {
  id: 'ar-02',
  depart: 'p-coursive',
  pieces: [
    { id: 'p-coursive', nom: 'coursive' },
    { id: 'p-local', nom: 'local' },
    { id: 'p-panoramique', nom: 'panoramique' },
    { id: 'p-embarquement', nom: 'embarquement' },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-coursive-local', nom: 'porte', entre: ['p-coursive', 'p-local'], ouverte: true },
    { id: 'l-coursive-panoramique', nom: 'porte', entre: ['p-coursive', 'p-panoramique'], ouverte: false },
    { id: 'l-panoramique-embarquement', nom: 'porte_grippee', entre: ['p-panoramique', 'p-embarquement'], ouverte: false, bruyante: true },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: true, manoeuvre: 'p-cabine' },
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
