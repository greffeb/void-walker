import { nouvellePartie, type DefMonde } from '../../engine';
import { carteRevelee } from './revelee';

//   a ══ab fermée══ b ══bc fermée══ c (créature)
const MONDE: DefMonde = {
  id: 'essai-revelee',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'salle_a' },
    { id: 'b', nom: 'salle_b' },
    { id: 'c', nom: 'salle_c' },
  ],
  liaisons: [
    { id: 'ab', nom: 'porte_ab', entre: ['a', 'b'], ouverte: false },
    { id: 'bc', nom: 'porte_bc', entre: ['b', 'c'], ouverte: true },
  ],
  objets: [],
  creature: { piece: 'c' },
};

describe('carte révélée (outil des versions de test)', () => {
  it('montre toutes les pièces, toutes les portes dans leur état réel et la créature vue à l’instant', () => {
    const { etat } = nouvellePartie(MONDE, { version: 'test', graine: 1 });
    const revelee = carteRevelee(MONDE, etat);
    expect(revelee.pieces.map((piece) => piece.piece.nom)).toEqual(['salle_a', 'salle_b', 'salle_c']);
    expect(revelee.passages.map((passage) => [passage.nom, passage.ouvert])).toEqual([
      ['porte_ab', false],
      ['porte_bc', true],
    ]);
    expect(revelee.pieces.find((piece) => piece.piece.nom === 'salle_c')?.creature).toBe('instant');
  });

  it('ne change pas la partie', () => {
    const { etat } = nouvellePartie(MONDE, { version: 'test', graine: 1 });
    const avant = JSON.stringify(etat);
    carteRevelee(MONDE, etat);
    expect(JSON.stringify(etat)).toBe(avant);
  });

  it('porte le capteur posé, à son état réel (créature mobile lot 3)', () => {
    const monde: DefMonde = { ...MONDE, objets: [{ id: 'capteur', nom: 'capteur', piece: 'a', capteur: true }] };
    const { etat } = nouvellePartie(monde, { version: 'test', graine: 1 });
    const pose = { ...etat, objets: { ...etat.objets, capteur: { type: 'capteur' as const, piece: 'c' } } };
    expect(carteRevelee(monde, pose).pieces.find((piece) => piece.piece.nom === 'salle_c')?.capteur).toBe('mouvement');
  });
});
