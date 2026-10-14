import type { DefMonde } from '../../engine';

// Station de test M-10 — Chambre froide (docs/13-morceaux-lancement.md §3, D-166, D-170, D-234, D-239, D-240).
// La chambre froide a deux portes : vers l'antichambre, où se trouve le pupitre de fermeture, et vers l'entrepôt, où attend la
// créature. L'entrepôt donne aussi sur la coursive, dont la porte grippée mène à l'embarquement. Les règles lisent les qualités
// déclarées ici, jamais un nom (D-078).
//
//   quartiers ══porte══ antichambre ══porte══ chambre froide ══porte══ entrepôt
//       ╚══porte══ coursive ═══════════════════porte════════════════════╝
//                    ╚══porte grippée══ embarquement ══écoutille══ cabine
export const MONDE_M10: DefMonde = {
  id: 'm-10',
  depart: 'p-quartiers',
  // Plan (14 §4.3) : antichambre, chambre froide et entrepôt en haut ; quartiers et coursive dessous ; l'embarquement sous la
  // coursive, contre la coque.
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-antichambre', nom: 'antichambre', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-chambre', nom: 'chambre', froide: true, plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-entrepot', nom: 'entrepot', plan: { x: 8, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-coursive', nom: 'coursive', plan: { x: 4, y: 3, largeur: 8, hauteur: 3 } },
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 4, y: 6, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-quartiers-antichambre', nom: 'porte', entre: ['p-quartiers', 'p-antichambre'], ouverte: true },
    { id: 'l-antichambre-chambre', nom: 'porte', entre: ['p-antichambre', 'p-chambre'], ouverte: false },
    { id: 'l-chambre-entrepot', nom: 'porte', entre: ['p-chambre', 'p-entrepot'], ouverte: true },
    { id: 'l-entrepot-coursive', nom: 'porte', entre: ['p-entrepot', 'p-coursive'], ouverte: true },
    { id: 'l-quartiers-coursive', nom: 'porte', entre: ['p-quartiers', 'p-coursive'], ouverte: false },
    { id: 'l-coursive-embarquement', nom: 'porte_grippee', entre: ['p-coursive', 'p-embarquement'], ouverte: false, bruyante: true },
    { id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false },
  ],
  objets: [
    { id: 'o-fermeture', nom: 'fermeture', piece: 'p-antichambre', portable: false, fermeture: 'p-chambre' },
    { id: 'o-compresseur', nom: 'compresseur', piece: 'p-chambre', portable: false, avertisseur: { piece: 'p-chambre' } },
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  creature: { piece: 'p-entrepot' },
  assistance: [
    { id: 'capsule', quand: { type: 'reveil' } },
    { id: 'presence', quand: { type: 'reveil' } },
  ],
};
