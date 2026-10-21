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

// Un document est un objet fixe, non portable, sans qualité : on ne peut que le regarder (spec 2026-10-18 §8.5).

const MONDE_DOCUMENTS = (objet: DefObjet): DefMonde => ({
  id: 'essai',
  depart: 'salle',
  pieces: [
    { id: 'salle', nom: 'salle' },
    { id: 'cave', nom: 'cave' },
  ],
  liaisons: [{ id: 'trappe', nom: 'trappe', entre: ['salle', 'cave'], ouverte: true }],
  objets: [objet],
});
const DOCUMENT: DefObjet = { id: 'note', nom: 'note', piece: 'salle', portable: false, document: true };

describe('monde : documents (spec §8.5)', () => {
  it('un document fixe est valide, avec ou sans pièce désignée', () => {
    expect(validerMonde(MONDE_DOCUMENTS(DOCUMENT))).toEqual([]);
    expect(validerMonde(MONDE_DOCUMENTS({ ...DOCUMENT, designe: 'cave' }))).toEqual([]);
  });

  it('un document portable est refusé', () => {
    expect(validerMonde(MONDE_DOCUMENTS({ id: 'note', nom: 'note', piece: 'salle', document: true }))).toEqual(['note : document portable.']);
    expect(validerMonde(MONDE_DOCUMENTS({ ...DOCUMENT, portable: true }))).toEqual(['note : document portable.']);
  });

  it.each<[string, Partial<DefObjet>]>([
    ['encombrant', { encombrant: true }],
    ['large', { large: true }],
    ['appui', { appui: true }],
    ['pont', { pont: true }],
    ['source', { source: true }],
    ['alimente', { alimente: 'note' }],
    ['deverrouille', { deverrouille: 'trappe' }],
    ['capsule', { capsule: { interieur: 'cave' } }],
    ['vitrageExterieur', { vitrageExterieur: true }],
    ['machines', { machines: 'salle' }],
    ['gravite', { gravite: 'cave' }],
    ['fermeture', { fermeture: 'cave' }],
    ['avertisseur', { avertisseur: { piece: 'cave' } }],
    ['soin', { soin: 1 }],
    ['glissant', { glissant: 1 }],
    ['extinction', { extinction: 1 }],
    ['protection', { protection: true }],
    ['perce', { perce: true }],
    ['rebouche', { rebouche: 1 }],
    ['deplacable', { deplacable: true }],
    ['position', { position: 'centre' }],
    ['butin', { butin: true }],
    ['depart', { depart: 'note' }],
  ])('un document porteur de la qualité « %s » est refusé', (champ, qualite) => {
    expect(validerMonde(MONDE_DOCUMENTS({ ...DOCUMENT, ...qualite }))).toContain(`note : document porteur de ${champ}.`);
  });

  it('une pièce désignée sans être un document, ou absente du monde, est refusée', () => {
    expect(validerMonde(MONDE_DOCUMENTS({ id: 'caisse', nom: 'caisse', piece: 'salle', designe: 'cave' }))).toEqual(['caisse : désigne une pièce sans être un document.']);
    expect(validerMonde(MONDE_DOCUMENTS({ ...DOCUMENT, designe: 'nulle-part' }))).toEqual(['note : pièce désignée inconnue nulle-part.']);
  });
});

describe('monde : rencontre (spec créature mobile)', () => {
  const base = MONDE({ id: 'caisse', nom: 'caisse', piece: 'salle' });
  it.each([0, 1.5])('refuse le rythme %s', (rythme) => {
    expect(validerMonde({ ...base, rencontre: { rythme } })).toContain('Rencontre : rythme invalide.');
  });
  it('accepte un rythme entier positif', () => {
    expect(validerMonde({ ...base, rencontre: { rythme: 3 } })).toEqual([]);
  });
});
