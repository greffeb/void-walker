import { validerMonde, validerMorceau, type DefMonde } from '../engine';
import { creerCatalogue, MONDES, MORCEAUX, type EntreeMonde } from '../content';
import { CATALOGUE } from './catalogue';

// Morceaux écrits à la main et stations de test refaites par l'assembleur (#152, 13 §8, GP-01).

function station(id: string): DefMonde {
  const trouvee: EntreeMonde | undefined = CATALOGUE.mondes[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent du catalogue.`);
  return trouvee.monde;
}

function porte(monde: DefMonde, id: string) {
  const trouvee = monde.liaisons.find((liaison) => liaison.id === id);
  if (trouvee === undefined) throw new Error(`Liaison ${id} absente.`);
  return trouvee;
}

describe('morceaux (13 §8)', () => {
  it('vestibule, M-07, M-10, M-03 et embarquement d’essai, dans cet ordre', () => {
    expect(Object.keys(MORCEAUX)).toEqual(['vestibule', 'm-07', 'm-10', 'm-03', 'essai']);
  });

  it.each(Object.entries(MORCEAUX))('%s : morceau valide, identifiant repris', (id, { morceau }) => {
    expect(morceau.id).toBe(id);
    expect(validerMorceau(morceau)).toEqual([]);
  });

  it('le vestibule n’a ni objet ni place de créature ; sa porte est ordinaire', () => {
    const { morceau } = MORCEAUX.vestibule ?? {};
    expect(morceau).toMatchObject({ famille: 'depart', objets: [], placesCreature: [], sortie: { piece: 'p-vestibule', porte: { nom: 'porte' } } });
    expect(morceau?.sortie?.porte.bruyante).toBeUndefined();
  });

  it('M-03 est un final : capsule non alimentée, console et bloc pour l’alimenter', () => {
    const { morceau } = MORCEAUX['m-03'] ?? {};
    expect(morceau).toMatchObject({ famille: 'final', demande: ['acces'], fournit: ['evacuation'], placesCreature: ['p-reserve'] });
    const capsule = morceau?.objets.find((objet) => objet.capsule !== undefined);
    expect(capsule?.capsule?.alimentee).not.toBe(true);
    expect(morceau?.objets.find((objet) => objet.alimente !== undefined)?.alimente).toBe(capsule?.id);
    expect(morceau?.objets.some((objet) => objet.source === true && objet.large === true && objet.encombrant === true)).toBe(true);
  });

  it('l’embarquement d’essai est un final à la capsule alimentée', () => {
    const { morceau } = MORCEAUX.essai ?? {};
    expect(morceau).toMatchObject({ famille: 'final', demande: ['acces'], fournit: ['evacuation'], placesCreature: [] });
    expect(morceau?.objets.find((objet) => objet.capsule !== undefined)?.capsule?.alimentee).toBe(true);
  });
});

describe('stations de test refaites par l’assembleur', () => {
  it('le catalogue a les mondes fixes plus m-07 et m-10, dans l’ordre d’avant', () => {
    expect(Object.keys(MONDES)).toEqual(['ar-01', 'ar-02', 'monde-test', 'm-08', 'm-09']);
    expect(Object.keys(CATALOGUE.mondes)).toEqual(['ar-01', 'ar-02', 'monde-test', 'm-07', 'm-08', 'm-09', 'm-10']);
    for (const [id, entree] of Object.entries(MONDES)) expect(CATALOGUE.mondes[id]).toBe(entree);
  });

  it.each([
    ['m-07', 'm-07/p-soute', 'l-m-07-essai', true],
    ['m-10', 'm-10/p-entrepot', 'l-m-10-essai', false],
  ] as const)('%s : monde valide, créature en %s, porte de sortie ouverte : %s', (id, creature, sortie, ouverte) => {
    const monde = station(id);
    expect(monde.id).toBe(id);
    expect(validerMonde(monde)).toEqual([]);
    expect(monde.depart).toBe(`${id}/p-quartiers`);
    expect(monde.creature).toEqual({ piece: creature });
    expect(porte(monde, sortie)).toMatchObject({ entre: [`${id}/p-coursive`, 'essai/p-embarquement'], ouverte });
  });

  it('m-07 : mêmes pièces, liaisons et objets qu’avant, dans le même ordre', () => {
    const monde = station('m-07');
    expect(monde.pieces.map((piece) => piece.id)).toEqual(['m-07/p-quartiers', 'm-07/p-soute', 'm-07/p-machines', 'm-07/p-coursive', 'essai/p-embarquement', 'essai/p-cabine']);
    expect(monde.liaisons.map((liaison) => [liaison.id, liaison.nom, liaison.ouverte, liaison.bruyante === true])).toEqual([
      ['m-07/l-quartiers-soute', 'porte', true, false],
      ['m-07/l-quartiers-machines', 'porte', false, false],
      ['m-07/l-machines-coursive', 'porte_grippee', false, true],
      ['l-m-07-essai', 'porte', true, false],
      ['essai/l-embarquement-cabine', 'ecoutille', false, false],
    ]);
    expect(monde.objets.map((objet) => objet.id)).toEqual(['m-07/o-interrupteur', 'essai/o-capsule', 'essai/o-pupitre']);
    expect(monde.assistance).toEqual([
      { id: 'capsule', quand: { type: 'reveil' } },
      { id: 'presence', quand: { type: 'reveil' } },
    ]);
  });

  it('m-10 : mêmes pièces, liaisons et objets qu’avant, dans le même ordre', () => {
    const monde = station('m-10');
    expect(monde.pieces.map((piece) => piece.id)).toEqual([
      'm-10/p-quartiers',
      'm-10/p-antichambre',
      'm-10/p-chambre',
      'm-10/p-entrepot',
      'm-10/p-coursive',
      'essai/p-embarquement',
      'essai/p-cabine',
    ]);
    expect(monde.liaisons.map((liaison) => [liaison.id, liaison.nom, liaison.ouverte, liaison.bruyante === true])).toEqual([
      ['m-10/l-quartiers-antichambre', 'porte', true, false],
      ['m-10/l-antichambre-chambre', 'porte', false, false],
      ['m-10/l-chambre-entrepot', 'porte', true, false],
      ['m-10/l-entrepot-coursive', 'porte', true, false],
      ['m-10/l-quartiers-coursive', 'porte', false, false],
      ['l-m-10-essai', 'porte_grippee', false, true],
      ['essai/l-embarquement-cabine', 'ecoutille', false, false],
    ]);
    expect(monde.objets.map((objet) => objet.id)).toEqual(['m-10/o-fermeture', 'm-10/o-compresseur', 'essai/o-capsule', 'essai/o-pupitre']);
    expect(monde.assistance).toEqual([
      { id: 'capsule', quand: { type: 'reveil' } },
      { id: 'presence', quand: { type: 'reveil' } },
    ]);
  });

  it('un assembleur sans plan est refusé par le catalogue', () => {
    expect(() => creerCatalogue(() => ({ type: 'sans_plan' }))).toThrow(/m-07/);
  });
});
