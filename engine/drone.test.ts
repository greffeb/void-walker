import { validerMonde, type DefMonde } from './monde';
import { avecDroneEn, cheminDrone, placesDuDrone } from './drone';

// Noms et identifiants sans rapport avec le morceau : seules les qualités font règle.
// a (départ, drone) ─ b ─ c ─ d (obstacle z en travers de df) ─ f ; c ─ e (créature) ; b ┄ d fermée ; a ≈ g (vide) ; b ▣ h (cloison
// que déverrouille k, posé en f, au-delà de l'obstacle).
const MONDE: DefMonde = {
  id: 'essai-drone', depart: 'a',
  pieces: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id, nom: id })),
  liaisons: [
    { id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: true },
    { id: 'bc', nom: 'porte', entre: ['b', 'c'], ouverte: true },
    { id: 'cd', nom: 'porte', entre: ['c', 'd'], ouverte: true },
    { id: 'ce', nom: 'porte', entre: ['c', 'e'], ouverte: true },
    { id: 'bd', nom: 'porte', entre: ['b', 'd'], ouverte: false },
    { id: 'df', nom: 'porte', entre: ['d', 'f'], ouverte: true },
    { id: 'ag', nom: 'vide', entre: ['a', 'g'], ouverte: true, gouffre: true },
    { id: 'bh', nom: 'porte', entre: ['b', 'h'], ouverte: false, verrouillee: true },
  ],
  positions: [
    { id: 'barre', nom: 'barre', piece: 'd' },
    { id: 'range', nom: 'range', piece: 'd' },
  ],
  objets: [
    { id: 'x', nom: 'x', piece: 'a', portable: false, drone: { obstacle: 'z' } },
    { id: 'z', nom: 'z', piece: 'd', portable: false, deplacable: true, position: 'barre', obstacle: { passage: 'df', rangement: 'range' } },
    { id: 'k', nom: 'k', piece: 'f', portable: false, deverrouille: 'bh' },
  ],
  creature: { piece: 'e' },
};
const avecObjets = (objets: DefMonde['objets']): DefMonde => ({ ...MONDE, objets });

describe('chemin et places du drone', () => {
  it('valide le monde', () => {
    expect(validerMonde(MONDE)).toEqual([]);
  });
  it('le chemin le plus court passe par les portes fermées, jamais par le vide', () => {
    expect(cheminDrone(MONDE, 'x', 'a')).toEqual(['ab', 'bd']);
    expect(cheminDrone(MONDE, 'x', 'e')).toEqual(['ce', 'cd']);
    expect(cheminDrone(MONDE, 'x', 'd')).toEqual([]);
    expect(cheminDrone(MONDE, 'x', 'g')).toBeNull();
  });
  it('places : avant l’obstacle, sans vide ni cloison qu’on n’ouvre qu’au-delà', () => {
    expect(placesDuDrone(MONDE, 'x')).toEqual(['a', 'b', 'c', 'e']);
  });
  it('une cloison qu’on déverrouille avant l’obstacle ouvre une place', () => {
    const monde = avecObjets(MONDE.objets.map((objet) => (objet.id === 'k' ? { ...objet, piece: 'c' } : objet)));
    expect(placesDuDrone(monde, 'x')).toEqual(['a', 'b', 'c', 'e', 'h']);
  });
  it('avecDroneEn déplace le drone sans position', () => {
    expect(avecDroneEn(MONDE, 'x', 'e').objets.find((objet) => objet.id === 'x')?.piece).toBe('e');
  });
  it('diagnostics des qualités', () => {
    const [drone, obstacle, commande] = MONDE.objets as [DefMonde['objets'][number], DefMonde['objets'][number], DefMonde['objets'][number]];
    expect(validerMonde(avecObjets([{ ...drone, drone: { obstacle: 'k' } }, obstacle, commande]))).toEqual(
      expect.arrayContaining(['x : obstacle du drone inconnu ou sans qualité.', 'z : obstacle sans drone.']),
    );
    expect(validerMonde(avecObjets([{ ...drone, piece: 'g' }, obstacle, commande]))).toEqual(expect.arrayContaining(['x : aucun chemin de drone vers son obstacle.']));
    expect(validerMonde(avecObjets([{ ...drone, portable: true }, obstacle, commande]))).toEqual(expect.arrayContaining(['x : dispositif de maintien portable.']));
  });
});
