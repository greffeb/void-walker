import { nouvellePartie, observer, validerMonde, type DefMonde, type EtatPartie } from './index';

// « Plus aucune sortie » dans une grande station (D-275, spec 2026-10-18 §7.4) : clés posées loin de leur obstacle, sur un
// monde construit. Dépôt, soute et cale jouent les pièces du catalogue ; aucune règle ne lit un nom (D-078).
//
//   dépôt ══porte══ ouest ┄┄vide┄┄ atelier ══grille (haute côté atelier, étroite)══ pompes ══porte══ embarquement ══écoutille══ cabine
//                                                                                    ║╚══porte══ soute
//                                                                                    ╚══trappe (étroite)══ cale
const MONDE: DefMonde = {
  id: 'essai-sortie',
  depart: 'ouest',
  pieces: ['depot', 'ouest', 'atelier', 'pompes', 'embarquement', 'cabine', 'soute', 'cale'].map((id) => ({ id, nom: id })),
  liaisons: [
    { id: 'l-depot', nom: 'porte_depot', entre: ['depot', 'ouest'], ouverte: true },
    { id: 'l-vide', nom: 'vide', entre: ['ouest', 'atelier'], ouverte: true, gouffre: true },
    { id: 'l-grille', nom: 'grille', entre: ['atelier', 'pompes'], ouverte: false, etroite: true, haute: 'atelier' },
    { id: 'l-embarquement', nom: 'porte_embarquement', entre: ['pompes', 'embarquement'], ouverte: true },
    { id: 'l-ecoutille', nom: 'ecoutille', entre: ['embarquement', 'cabine'], ouverte: true, manoeuvre: 'cabine' },
    { id: 'l-soute', nom: 'porte_soute', entre: ['pompes', 'soute'], ouverte: true },
    { id: 'l-cale', nom: 'trappe', entre: ['pompes', 'cale'], ouverte: true, etroite: true },
  ],
  positions: [{ id: 'pos-sous-grille', nom: 'sous_grille', piece: 'atelier', sous: 'l-grille' }],
  objets: [
    { id: 'planche', nom: 'planche', piece: 'ouest', pont: true, encombrant: true },
    // La caisse d'une grande station : portable, encombrante, sans position une fois ôtée de sa pièce d'origine.
    { id: 'caisse', nom: 'caisse', piece: 'depot', deplacable: true, appui: true, encombrant: true },
    { id: 'bloc', nom: 'bloc', piece: 'soute', large: true, encombrant: true, source: true },
    { id: 'capsule', nom: 'capsule', piece: 'embarquement', portable: false, capsule: { interieur: 'cabine' } },
    { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'capsule' },
  ],
};

function etat(changement: Partial<EtatPartie> = {}): EtatPartie {
  const depart = nouvellePartie(MONDE, { version: 'sortie-1', graine: 3 }).etat;
  return { ...depart, ...changement, objets: { ...depart.objets, ...changement.objets } };
}

const signal = (courant: EtatPartie): boolean => observer(MONDE, courant).sansSortie;

describe('plus aucune sortie : clés d’une grande station', () => {
  it('le monde est valide', () => {
    expect(validerMonde(MONDE)).toEqual([]);
  });

  it('caisse portable posée loin de la grille : pas de signal tant qu’on peut l’apporter ; signal quand elle ne peut plus revenir', () => {
    expect(signal(etat())).toBe(false);
    // Passé de l'autre côté du vide, la planche en pont derrière soi : on peut repasser chercher la caisse.
    expect(signal(etat({ piece: 'atelier', objets: { planche: { type: 'pont', liaison: 'l-vide' } } }))).toBe(false);
    // La planche tombée, la caisse reste au dépôt : la grille est hors de portée pour de bon.
    expect(signal(etat({ piece: 'atelier', objets: { planche: { type: 'perdu', liaison: 'l-vide' } } }))).toBe(true);
    // Apportée avant la chute et posée sans position : on la pousse encore sous la grille.
    expect(signal(etat({ piece: 'atelier', objets: { planche: { type: 'perdu', liaison: 'l-vide' }, caisse: { type: 'piece', piece: 'atelier' } } }))).toBe(false);
  });

  it('clé posée loin de son obstacle (planche dans une pièce du catalogue) : pas de signal au départ', () => {
    expect(signal(etat({ objets: { planche: { type: 'piece', piece: 'depot' }, caisse: { type: 'piece', piece: 'ouest' } } }))).toBe(false);
  });

  it('bloc dans une pièce d’où il rejoint la capsule sans passage étroit : pas de signal ; derrière un passage étroit : signal', () => {
    expect(signal(etat({ piece: 'pompes' }))).toBe(false);
    expect(signal(etat({ piece: 'pompes', objets: { bloc: { type: 'piece', piece: 'cale' } } }))).toBe(true);
  });
});
