import { validerMonde, type DefMonde, type DefObjet } from './monde';

// Un objet à la fois déplaçable et portable n'existe que pour la caisse d'une grande station (spec 2026-10-18 §6.5) : un appui
// encombrant, qu'on porte puis qu'on déplace. Rien d'autre ne l'est.

const MONDE = (objet: DefObjet): DefMonde => ({
  id: 'essai',
  depart: 'salle',
  pieces: [{ id: 'salle', nom: 'salle' }],
  liaisons: [],
  objets: [objet],
});

describe('monde : objet déplaçable et portable (spec §6.5)', () => {
  it('un appui encombrant, déplaçable et portable, est valide : la caisse d’une grande station', () => {
    expect(validerMonde(MONDE({ id: 'caisse', nom: 'caisse', piece: 'salle', deplacable: true, appui: true, encombrant: true }))).toEqual([]);
  });

  it.each<[string, Partial<DefObjet>]>([
    ['sans appui ni encombrant', {}],
    ['encombrant sans appui', { encombrant: true }],
    ['appui sans encombrant', { appui: true }],
  ])('un objet déplaçable et portable %s reste refusé', (_cas, qualites) => {
    expect(validerMonde(MONDE({ id: 'caisse', nom: 'caisse', piece: 'salle', deplacable: true, ...qualites }))).toEqual(['caisse : déplaçable mais portable.']);
  });
});
