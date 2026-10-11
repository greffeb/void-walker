import type { DefMonde } from '../../engine';

// Monde de test : trois pièces, une porte bruyante, une grille étroite qui laisse passer le son, la créature (#100).
// Le parcours témoin ouvre la porte bruyante : la créature l'entend depuis la soute et s'approche. Aucun gameplay d'AR-01/AR-02.
export const MONDE_TEST: DefMonde = {
  id: 'monde-test',
  depart: 'piece-cabine',
  pieces: [
    { id: 'piece-cabine', nom: 'cabine' },
    { id: 'piece-atelier', nom: 'atelier' },
    { id: 'piece-soute', nom: 'soute' },
  ],
  liaisons: [
    { id: 'liaison-cabine-atelier', nom: 'porte', entre: ['piece-cabine', 'piece-atelier'], ouverte: false, bruyante: true },
    { id: 'liaison-atelier-soute', nom: 'porte', entre: ['piece-atelier', 'piece-soute'], ouverte: true },
    { id: 'liaison-cabine-soute', nom: 'grille', entre: ['piece-cabine', 'piece-soute'], ouverte: false, etroite: true, sonAuTravers: true },
  ],
  objets: [{ id: 'objet-carnet', nom: 'carnet', piece: 'piece-cabine' }],
  creature: { piece: 'piece-soute' },
};
