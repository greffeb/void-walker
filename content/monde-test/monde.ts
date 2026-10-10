import type { DefMonde } from '../../engine';

// Monde de test du Bootstrap (#89) : deux pièces, une porte, un objet portable. Aucun gameplay d'AR-01/AR-02.
export const MONDE_TEST: DefMonde = {
  id: 'monde-test',
  depart: 'piece-cabine',
  pieces: [
    { id: 'piece-cabine', nom: 'cabine' },
    { id: 'piece-atelier', nom: 'atelier' },
  ],
  liaisons: [{ id: 'liaison-cabine-atelier', nom: 'porte', entre: ['piece-cabine', 'piece-atelier'], ouverte: false }],
  objets: [{ id: 'objet-carnet', nom: 'carnet', piece: 'piece-cabine' }],
};
