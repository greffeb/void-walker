import type { DefMonde } from '../../engine';

// Monde de test : trois pièces, une porte bruyante, une grille étroite qui laisse passer le son, la créature (#100), une trousse de soin (#101).
// Le parcours témoin ouvre la porte bruyante : la créature l'entend depuis la soute et s'approche. Aucun gameplay d'AR-01/AR-02.
export const MONDE_TEST: DefMonde = {
  id: 'monde-test',
  depart: 'piece-cabine',
  // Plan (14 §4.3) : cabine et atelier côte à côte, la soute en dessous, touchant les deux.
  pieces: [
    { id: 'piece-cabine', nom: 'cabine', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'piece-atelier', nom: 'atelier', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'piece-soute', nom: 'soute', plan: { x: 0, y: 2, largeur: 6, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'liaison-cabine-atelier', nom: 'porte', entre: ['piece-cabine', 'piece-atelier'], ouverte: false, bruyante: true },
    { id: 'liaison-atelier-soute', nom: 'porte', entre: ['piece-atelier', 'piece-soute'], ouverte: true },
    { id: 'liaison-cabine-soute', nom: 'grille', entre: ['piece-cabine', 'piece-soute'], ouverte: false, etroite: true, sonAuTravers: true },
  ],
  objets: [
    { id: 'objet-carnet', nom: 'carnet', piece: 'piece-cabine' },
    { id: 'objet-trousse', nom: 'trousse', piece: 'piece-atelier', soin: 1 },
  ],
  creature: { piece: 'piece-soute' },
  // IA Station (#98) : un message au réveil, un autre à la première arrivée dans l'atelier.
  assistance: [
    { id: 'reveil', quand: { type: 'reveil' } },
    { id: 'atelier', quand: { type: 'arrivee', piece: 'piece-atelier' } },
  ],
};
