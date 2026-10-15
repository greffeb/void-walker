import { validerMonde, type DefMonde } from './index';
import { poserTuiles } from './pose';
import { assemblerStation, prefixer, validerMorceau, type DefMorceau, type DefStation, type ResultatAssemblage } from './station';

// Morceaux de test : un départ d'une pièce, un chemin qui porte toutes les sortes de références, un final avec embarquement.

const DEPART: DefMorceau = {
  id: 'vestibule',
  famille: 'depart',
  pieces: [{ id: 'p-vestibule', nom: 'vestibule', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }],
  liaisons: [],
  objets: [],
  entree: 'p-vestibule',
  sortie: { piece: 'p-vestibule', porte: { nom: 'porte' } },
  placesCreature: [],
  demande: [],
  fournit: [],
};

const CHEMIN: DefMorceau = {
  id: 'couloir',
  famille: 'chemin',
  pieces: [
    { id: 'p-quartiers', nom: 'quartiers', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-machines', nom: 'machines', machines: true, plan: { x: 4, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-zone', nom: 'zone', gravite: 'coupee', plan: { x: 0, y: 3, largeur: 4, hauteur: 3 } },
    { id: 'p-froide', nom: 'chambre_froide', froide: true, plan: { x: 4, y: 3, largeur: 4, hauteur: 3 } },
  ],
  liaisons: [
    { id: 'l-quartiers-machines', nom: 'porte', entre: ['p-quartiers', 'p-machines'], ouverte: false, haute: 'p-quartiers' },
    { id: 'l-quartiers-zone', nom: 'porte', entre: ['p-quartiers', 'p-zone'], ouverte: true, manoeuvre: 'p-quartiers' },
    { id: 'l-zone-froide', nom: 'porte', entre: ['p-zone', 'p-froide'], ouverte: false, cachee: 'p-zone' },
  ],
  objets: [
    { id: 'o-interrupteur', nom: 'interrupteur', piece: 'p-machines', portable: false, machines: 'p-machines' },
    { id: 'o-gravite', nom: 'interrupteur_gravite', piece: 'p-quartiers', portable: false, gravite: 'p-zone' },
    { id: 'o-fermeture', nom: 'pupitre_fermeture', piece: 'p-zone', portable: false, fermeture: 'p-froide' },
    { id: 'o-alarme', nom: 'alarme', piece: 'p-quartiers', portable: false, avertisseur: { piece: 'p-zone', alcove: true } },
    { id: 'o-caisse', nom: 'caisse', piece: 'p-quartiers', position: 'pos-porte', portable: false, deplacable: true, appui: true },
  ],
  positions: [
    { id: 'pos-porte', nom: 'sous_la_porte', piece: 'p-quartiers', sous: 'l-quartiers-machines' },
    { id: 'pos-coin', nom: 'coin', piece: 'p-quartiers' },
  ],
  entree: 'p-quartiers',
  sortie: { piece: 'p-machines', porte: { nom: 'porte_grippee', bruyante: true } },
  placesCreature: ['p-froide'],
  demande: [],
  fournit: ['acces'],
  assistance: [{ id: 'machines', quand: { type: 'arrivee', piece: 'p-machines' } }],
};

const FINAL: DefMorceau = {
  id: 'fin',
  famille: 'final',
  pieces: [
    { id: 'p-embarquement', nom: 'embarquement', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } },
    { id: 'p-cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [{ id: 'l-embarquement-cabine', nom: 'ecoutille', entre: ['p-embarquement', 'p-cabine'], ouverte: false }],
  objets: [
    { id: 'o-capsule', nom: 'capsule', piece: 'p-embarquement', portable: false, capsule: { interieur: 'p-cabine', alimentee: true } },
    { id: 'o-console', nom: 'console', piece: 'p-embarquement', portable: false, alimente: 'o-capsule' },
    { id: 'o-pupitre', nom: 'pupitre', piece: 'p-cabine', portable: false, depart: 'o-capsule' },
  ],
  entree: 'p-embarquement',
  placesCreature: ['p-embarquement'],
  demande: [],
  fournit: ['evacuation'],
  assistance: [{ id: 'depart', quand: { type: 'evacuation' } }],
};

/** Couloir bordé de six pièces : la porte vers le morceau suivant serait sa septième (PL-06), aucun plan possible. */
const ETOILE: DefMorceau = {
  id: 'etoile',
  famille: 'chemin',
  pieces: [
    { id: 'p-couloir', nom: 'couloir', plan: { x: 0, y: 2, largeur: 6, hauteur: 2 } },
    { id: 'p-1', nom: 'cabine', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
    { id: 'p-2', nom: 'cabine', plan: { x: 2, y: 0, largeur: 2, hauteur: 2 } },
    { id: 'p-3', nom: 'cabine', plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } },
    { id: 'p-4', nom: 'cabine', plan: { x: 0, y: 4, largeur: 2, hauteur: 2 } },
    { id: 'p-5', nom: 'cabine', plan: { x: 2, y: 4, largeur: 2, hauteur: 2 } },
    { id: 'p-6', nom: 'cabine', plan: { x: 4, y: 4, largeur: 2, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'l-1', nom: 'porte', entre: ['p-couloir', 'p-1'], ouverte: true },
    { id: 'l-2', nom: 'porte', entre: ['p-couloir', 'p-2'], ouverte: true },
    { id: 'l-3', nom: 'porte', entre: ['p-couloir', 'p-3'], ouverte: true },
    { id: 'l-4', nom: 'porte', entre: ['p-couloir', 'p-4'], ouverte: true },
    { id: 'l-5', nom: 'porte', entre: ['p-couloir', 'p-5'], ouverte: true },
    { id: 'l-6', nom: 'porte', entre: ['p-couloir', 'p-6'], ouverte: true },
  ],
  objets: [],
  entree: 'p-1',
  sortie: { piece: 'p-couloir', porte: { nom: 'porte' } },
  placesCreature: ['p-6'],
  demande: [],
  fournit: ['acces'],
};

const STATION: DefStation = {
  id: 'essai-station',
  morceaux: [DEPART, CHEMIN, FINAL],
  creature: 'couloir/p-froide',
  graine: 7,
  assistance: [{ id: 'reveil', quand: { type: 'reveil' } }],
};

function monde(resultat: ResultatAssemblage): DefMonde {
  if (resultat.type !== 'station') throw new Error(`Station attendue : ${JSON.stringify(resultat)}`);
  return resultat.monde;
}

function sansPlan<T extends { readonly plan?: unknown }>(entite: T): T {
  const copie = { ...entite };
  delete (copie as { plan?: unknown }).plan;
  return copie;
}

/** Le monde sans aucun champ `plan`, ni sur les pièces ni sur les liaisons. */
function sansPlans(produit: DefMonde): DefMonde {
  return { ...produit, pieces: produit.pieces.map(sansPlan), liaisons: produit.liaisons.map(sansPlan) };
}

function erreurs(resultat: ResultatAssemblage): readonly string[] {
  if (resultat.type !== 'invalide') throw new Error(`Station invalide attendue : ${resultat.type}`);
  return resultat.erreurs;
}

describe('format du morceau', () => {
  it('les morceaux de test sont valides', () => {
    expect(validerMorceau(DEPART)).toEqual([]);
    expect(validerMorceau(CHEMIN)).toEqual([]);
    expect(validerMorceau(FINAL)).toEqual([]);
  });

  it.each<[string, DefMorceau]>([
    ['liaison qui porte un plan', { ...FINAL, liaisons: [{ ...FINAL.liaisons[0]!, plan: { rang: 1 } }] }],
    ['pièce dessinée sans plan', { ...DEPART, pieces: [{ id: 'p-vestibule', nom: 'vestibule' }] }],
    ['sous-position avec un plan', { ...FINAL, pieces: [FINAL.pieces[0]!, { id: 'p-cabine', nom: 'cabine', sousPosition: true, plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } }] }],
    ['entrée inconnue', { ...DEPART, entree: 'p-nulle' }],
    ['place de créature inconnue', { ...FINAL, placesCreature: ['p-nulle'] }],
    ['final avec une sortie', { ...FINAL, sortie: { piece: 'p-embarquement', porte: { nom: 'porte' } } }],
    ['chemin sans sortie', { ...CHEMIN, sortie: undefined }],
    ['départ sans sortie', { ...DEPART, sortie: undefined }],
    ['sortie depuis une pièce inconnue', { ...CHEMIN, sortie: { piece: 'p-nulle', porte: { nom: 'porte' } } }],
    ['porte de sortie haute', { ...CHEMIN, sortie: { piece: 'p-machines', porte: { nom: 'porte', haute: 'p-machines' } } }],
    ['final qui ne fournit pas l’évacuation', { ...FINAL, fournit: [] }],
  ])('refuse : %s, d’une seule erreur', (_cas, morceau) => {
    const trouvees = validerMorceau(morceau);
    expect(trouvees).toHaveLength(1);
    expect(trouvees[0]).toMatch(new RegExp(`^${morceau.id}`));
  });

  it('préfixe un identifiant par son morceau', () => {
    expect(prefixer('m-07', 'p-soute')).toBe('m-07/p-soute');
  });
});

describe('assemblage d’une station', () => {
  it('préfixe chaque identifiant et chaque référence, relie les morceaux par des portes fermées, garde l’ordre des morceaux', () => {
    const attendu: DefMonde = {
      id: 'essai-station',
      depart: 'vestibule/p-vestibule',
      pieces: [
        { id: 'vestibule/p-vestibule', nom: 'vestibule' },
        { id: 'couloir/p-quartiers', nom: 'quartiers' },
        { id: 'couloir/p-machines', nom: 'machines', machines: true },
        { id: 'couloir/p-zone', nom: 'zone', gravite: 'coupee' },
        { id: 'couloir/p-froide', nom: 'chambre_froide', froide: true },
        { id: 'fin/p-embarquement', nom: 'embarquement' },
        { id: 'fin/p-cabine', nom: 'cabine', sousPosition: true },
      ],
      liaisons: [
        { nom: 'porte', id: 'l-vestibule-couloir', entre: ['vestibule/p-vestibule', 'couloir/p-quartiers'], ouverte: false },
        {
          id: 'couloir/l-quartiers-machines',
          nom: 'porte',
          entre: ['couloir/p-quartiers', 'couloir/p-machines'],
          ouverte: false,
          haute: 'couloir/p-quartiers',
        },
        { id: 'couloir/l-quartiers-zone', nom: 'porte', entre: ['couloir/p-quartiers', 'couloir/p-zone'], ouverte: true, manoeuvre: 'couloir/p-quartiers' },
        { id: 'couloir/l-zone-froide', nom: 'porte', entre: ['couloir/p-zone', 'couloir/p-froide'], ouverte: false, cachee: 'couloir/p-zone' },
        { nom: 'porte_grippee', bruyante: true, id: 'l-couloir-fin', entre: ['couloir/p-machines', 'fin/p-embarquement'], ouverte: false },
        { id: 'fin/l-embarquement-cabine', nom: 'ecoutille', entre: ['fin/p-embarquement', 'fin/p-cabine'], ouverte: false },
      ],
      objets: [
        { id: 'couloir/o-interrupteur', nom: 'interrupteur', piece: 'couloir/p-machines', portable: false, machines: 'couloir/p-machines' },
        { id: 'couloir/o-gravite', nom: 'interrupteur_gravite', piece: 'couloir/p-quartiers', portable: false, gravite: 'couloir/p-zone' },
        { id: 'couloir/o-fermeture', nom: 'pupitre_fermeture', piece: 'couloir/p-zone', portable: false, fermeture: 'couloir/p-froide' },
        { id: 'couloir/o-alarme', nom: 'alarme', piece: 'couloir/p-quartiers', portable: false, avertisseur: { piece: 'couloir/p-zone', alcove: true } },
        {
          id: 'couloir/o-caisse',
          nom: 'caisse',
          piece: 'couloir/p-quartiers',
          position: 'couloir/pos-porte',
          portable: false,
          deplacable: true,
          appui: true,
        },
        { id: 'fin/o-capsule', nom: 'capsule', piece: 'fin/p-embarquement', portable: false, capsule: { interieur: 'fin/p-cabine', alimentee: true } },
        { id: 'fin/o-console', nom: 'console', piece: 'fin/p-embarquement', portable: false, alimente: 'fin/o-capsule' },
        { id: 'fin/o-pupitre', nom: 'pupitre', piece: 'fin/p-cabine', portable: false, depart: 'fin/o-capsule' },
      ],
      positions: [
        { id: 'couloir/pos-porte', nom: 'sous_la_porte', piece: 'couloir/p-quartiers', sous: 'couloir/l-quartiers-machines' },
        { id: 'couloir/pos-coin', nom: 'coin', piece: 'couloir/p-quartiers' },
      ],
      creature: { piece: 'couloir/p-froide' },
      assistance: [
        { id: 'reveil', quand: { type: 'reveil' } },
        { id: 'machines', quand: { type: 'arrivee', piece: 'couloir/p-machines' } },
        { id: 'depart', quand: { type: 'evacuation' } },
      ],
    };
    // Strict : aucune clé laissée à `undefined`. Le plan se vérifie à part (« plan de la station »).
    expect(sansPlans(monde(assemblerStation(STATION)))).toStrictEqual(attendu);
  });

  it('produit un monde qui passe validerMonde', () => {
    const produit = monde(assemblerStation(STATION));
    expect(validerMonde(produit)).toEqual([]);
    expect(produit.id).toBe(STATION.id);
    expect(produit.depart).toBe(prefixer(DEPART.id, DEPART.entree));
    expect(produit.creature?.piece).toBe(STATION.creature);
  });

  it('le premier morceau peut être un chemin : le départ est son entrée', () => {
    const produit = monde(assemblerStation({ ...STATION, morceaux: [CHEMIN, FINAL] }));
    expect(produit.depart).toBe('couloir/p-quartiers');
    expect(produit.liaisons.map((liaison) => liaison.id)).toEqual([
      'couloir/l-quartiers-machines',
      'couloir/l-quartiers-zone',
      'couloir/l-zone-froide',
      'l-couloir-fin',
      'fin/l-embarquement-cabine',
    ]);
  });

  it('ouvre au départ la porte de sortie des morceaux de `sortiesOuvertes`, et elle seule', () => {
    const produit = monde(assemblerStation({ ...STATION, sortiesOuvertes: ['couloir'] }));
    const ouverte = (id: string): boolean | undefined => produit.liaisons.find((liaison) => liaison.id === id)?.ouverte;
    expect(ouverte('l-couloir-fin')).toBe(true);
    expect(ouverte('l-vestibule-couloir')).toBe(false);
  });

  it('les références de pièce d’une porte de sortie se préfixent par le morceau qui la décrit', () => {
    const chemin: DefMorceau = { ...CHEMIN, sortie: { piece: 'p-machines', porte: { nom: 'ecoutille', manoeuvre: 'p-machines' } } };
    const produit = monde(assemblerStation({ ...STATION, morceaux: [DEPART, chemin, FINAL] }));
    expect(produit.liaisons.find((liaison) => liaison.id === 'l-couloir-fin')).toStrictEqual({
      nom: 'ecoutille',
      manoeuvre: 'couloir/p-machines',
      id: 'l-couloir-fin',
      entre: ['couloir/p-machines', 'fin/p-embarquement'],
      ouverte: false,
      plan: { rang: expect.any(Number) },
    });
  });

  it('une demande est satisfaite par un morceau précédent', () => {
    const final: DefMorceau = { ...FINAL, demande: ['acces'] };
    expect(assemblerStation({ ...STATION, morceaux: [DEPART, CHEMIN, final] }).type).toBe('station');
  });
});

describe('plan de la station', () => {
  it('chaque pièce dessinée reçoit son rectangle posé, chaque porte entre morceaux son rang, et le monde passe validerMonde', () => {
    const produit = monde(assemblerStation(STATION));
    const pose = poserTuiles(STATION.morceaux, STATION.graine);
    if (pose === null) throw new Error('Plan attendu.');
    const dessinees = produit.pieces.filter((piece) => piece.sousPosition !== true);
    expect(dessinees.map((piece) => piece.id).sort()).toEqual([...pose.rects.keys()].sort());
    expect(Object.fromEntries(dessinees.map((piece) => [piece.id, piece.plan]))).toStrictEqual(Object.fromEntries(pose.rects));
    expect(produit.pieces.filter((piece) => piece.sousPosition === true)).toStrictEqual([{ id: 'fin/p-cabine', nom: 'cabine', sousPosition: true }]);
    const portes = ['l-couloir-fin', 'l-vestibule-couloir'];
    expect([...pose.portes.keys()].sort()).toEqual(portes);
    for (const liaison of produit.liaisons) {
      if (portes.includes(liaison.id)) expect(liaison.plan).toStrictEqual({ rang: pose.portes.get(liaison.id) });
      else expect(liaison).not.toHaveProperty('plan');
    }
    expect(validerMonde(produit)).toEqual([]);
  });

  it('la graine ne change que le plan : même monde, à l’identifiant et au plan près, pour des graines aux plans différents', () => {
    const plan = (produit: DefMonde): string => JSON.stringify([produit.pieces.map((piece) => piece.plan), produit.liaisons.map((liaison) => liaison.plan)]);
    const reference = monde(assemblerStation({ ...STATION, id: 'essai-7', graine: 7 }));
    const autres = Array.from({ length: 50 }, (_, graine) => monde(assemblerStation({ ...STATION, id: `essai-${graine}`, graine })));
    expect(autres.some((autre) => plan(autre) !== plan(reference))).toBe(true);
    // Comparaison profonde, ordre des tableaux compris.
    for (const autre of autres) expect({ ...sansPlans(autre), id: reference.id }).toStrictEqual(sansPlans(reference));
  });

  it('aucun plan possible : station sans plan', () => {
    const morceaux = [DEPART, ETOILE, FINAL];
    expect(poserTuiles(morceaux, STATION.graine)).toBeNull();
    expect(assemblerStation({ ...STATION, morceaux, creature: 'etoile/p-6' })).toStrictEqual({ type: 'sans_plan' });
  });
});

describe('station refusée, avec son motif', () => {
  it('créature hors des places des morceaux', () => {
    expect(erreurs(assemblerStation({ ...STATION, creature: 'couloir/p-quartiers' }))).toEqual([
      'Créature hors des places des morceaux : couloir/p-quartiers.',
    ]);
  });

  it('créature dans la pièce de départ', () => {
    const chemin: DefMorceau = { ...CHEMIN, placesCreature: ['p-quartiers', 'p-froide'] };
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [chemin, FINAL], creature: 'couloir/p-quartiers' }))).toEqual([
      'Créature dans la pièce de départ : couloir/p-quartiers.',
    ]);
  });

  it('dernier morceau qui n’est pas un final', () => {
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [DEPART, CHEMIN] }))).toEqual(['couloir : dernier morceau qui n’est pas un final.']);
  });

  it('final avant le dernier morceau', () => {
    const autre: DefMorceau = { ...FINAL, id: 'fin-2' };
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [DEPART, CHEMIN, FINAL, autre] }))).toEqual(['fin : final avant le dernier morceau.']);
  });

  it('demande qu’aucun morceau précédent ne fournit, même s’il la fournit lui-même', () => {
    const final: DefMorceau = { ...FINAL, demande: ['acces'] };
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [DEPART, final], creature: 'fin/p-embarquement' }))).toEqual([
      'fin : demande acces, qu’aucun morceau précédent ne fournit.',
    ]);
    const chemin: DefMorceau = { ...CHEMIN, demande: ['acces'] };
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [DEPART, chemin, FINAL] }))).toEqual([
      'couloir : demande acces, qu’aucun morceau précédent ne fournit.',
    ]);
  });

  it('morceau invalide', () => {
    const chemin: DefMorceau = { ...CHEMIN, entree: 'p-nulle' };
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [DEPART, chemin, FINAL] }))).toEqual(validerMorceau(chemin));
    expect(validerMorceau(chemin)).toHaveLength(1);
  });

  it('station sans morceau', () => {
    expect(erreurs(assemblerStation({ ...STATION, morceaux: [] }))).toEqual(['Station sans morceau.']);
  });

  it('monde assemblé que validerMonde refuse : identifiants d’assistance non préfixés, donc en double', () => {
    const doublon = assemblerStation({ ...STATION, assistance: [{ id: 'machines', quand: { type: 'reveil' } }] });
    expect(erreurs(doublon)).toEqual(['machines : message d\'assistance en double.']);
  });
});
