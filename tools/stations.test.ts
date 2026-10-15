import {
  assemblerStation,
  empreinte,
  empreinteEtat,
  exporter,
  generateurDepuisGraine,
  jouer,
  nouvellePartie,
  observer,
  validerMonde,
  validerMorceau,
  type Assembleur,
  type DefMonde,
  type DefMorceau,
  type DefStation,
  type Observation,
} from '../engine';
import { suivant } from '../engine/des';
import {
  COMPOSITIONS_PUBLIEES,
  creerCatalogue,
  fuitesDeCouches,
  MONDES,
  MORCEAUX,
  MORCEAUX_TEXTES,
  nomLisible,
  numeroter,
  PAIRES,
  reunir,
  sansConflit,
  type Composition,
  type EntreeMonde,
  type EntreeMorceau,
  type Refus,
  type TextesMorceau,
} from '../content';
import { lireDemande } from '../report-service/src/rapport';
import { CATALOGUE } from './catalogue';
import { stationDeReference } from './verifier-station';

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
  it('vestibule, M-07, M-08, M-09, M-10, M-03, M-06 et embarquement d’essai, dans cet ordre', () => {
    expect(Object.keys(MORCEAUX)).toEqual(['vestibule', 'm-07', 'm-08', 'm-09', 'm-10', 'm-03', 'm-06', 'essai']);
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

describe('M-06, M-08 et M-09 (spec L3 §3.1 à §3.3)', () => {
  function entree(id: string): EntreeMorceau {
    const trouvee = MORCEAUX[id];
    if (trouvee === undefined) throw new Error(`Morceau ${id} absent.`);
    return trouvee;
  }

  it('M-06 : final valide, entrée par le couloir de sécurité, créature à l’embarquement, capsule alimentée, écoutille fermée', () => {
    const { morceau, textes } = entree('m-06');
    expect(validerMorceau(morceau)).toEqual([]);
    expect(morceau).toMatchObject({ famille: 'final', entree: 'p-couloir', placesCreature: ['p-embarquement'], demande: ['acces'], fournit: ['evacuation'] });
    expect(morceau.objets.find((objet) => objet.capsule !== undefined)?.capsule).toEqual({ interieur: 'p-cabine', alimentee: true });
    expect(morceau.liaisons.find((liaison) => liaison.nom === 'ecoutille')).toMatchObject({ entre: ['p-embarquement', 'p-cabine'], ouverte: false });
    expect(textes.noms.couloir_securite).toEqual({ texte: 'couloir de sécurité', genre: 'm', nombre: 's', elision: false });
  });

  it('M-06 : les objets d’AR-02 sans le terminal, la baie dans la panoramique', () => {
    const { morceau } = entree('m-06');
    expect(morceau.objets.map((objet) => [objet.id, objet.piece])).toEqual([
      ['o-signaletique', 'p-couloir'],
      ['o-casier', 'p-local'],
      ['o-combinaison', 'p-local'],
      ['o-decoupeuse', 'p-local'],
      ['o-baie', 'p-panoramique'],
      ['o-kit', 'p-panoramique'],
      ['o-capsule', 'p-embarquement'],
      ['o-pupitre', 'p-cabine'],
    ]);
    expect(morceau.objets.find((objet) => objet.id === 'o-baie')?.vitrageExterieur).toBe(true);
    expect(morceau.objets.some((objet) => objet.nom === 'terminal')).toBe(false);
  });

  it('M-06 : aucun message d’assistance', () => {
    const { morceau, textes } = entree('m-06');
    expect(morceau.assistance ?? []).toEqual([]);
    expect(textes.assistance).toEqual({});
  });

  it('vigilance 5 : aucun texte de m-06 ne parle des cabines du personnel ni du terminal', () => {
    const textes = JSON.stringify(entree('m-06').textes).toLocaleLowerCase('fr');
    for (const mot of ['cabines du personnel', 'terminal']) expect(textes).not.toContain(mot);
  });

  it.each([
    ['m-08', 'p-magasin', 'passerelle', 'p-ouest'],
    ['m-09', 'p-cale', 'gravite', 'p-sas-ouest'],
  ] as const)('%s : chemin valide, créature en %s, message %s à l’arrivée en %s', (id, place, message, piece) => {
    const { morceau, textes } = entree(id);
    expect(validerMorceau(morceau)).toEqual([]);
    expect(morceau).toMatchObject({ famille: 'chemin', entree: 'p-quartiers', placesCreature: [place], demande: [], fournit: ['acces'] });
    expect(morceau.assistance).toEqual([{ id: message, quand: { type: 'arrivee', piece } }]);
    expect(textes.assistance[message]).toBeDefined();
  });

  it.each([
    [
      'm-08',
      [
        [['p-quartiers', 'p-atelier'], 'porte', 'ouverte', false, false],
        [['p-quartiers', 'p-ouest'], 'porte_grippee', 'fermée', true, false],
        [['p-ouest', 'p-est'], 'vide', 'ouverte', false, true],
        [['p-est', 'p-magasin'], 'porte', 'fermée', false, false],
      ],
      { piece: 'p-est', porte: { nom: 'porte' } },
    ],
    [
      'm-09',
      [
        [['p-quartiers', 'p-sas-ouest'], 'porte', 'fermée', false, false],
        [['p-sas-ouest', 'p-transfert'], 'porte', 'ouverte', false, false],
        [['p-transfert', 'p-sas-est'], 'porte', 'ouverte', false, false],
        [['p-sas-est', 'p-cale'], 'porte', 'fermée', false, false],
      ],
      { piece: 'p-sas-est', porte: { nom: 'porte' } },
    ],
    [
      'm-06',
      [
        [['p-couloir', 'p-local'], 'porte', 'ouverte', false, false],
        [['p-couloir', 'p-panoramique'], 'porte', 'fermée', false, false],
        [['p-panoramique', 'p-embarquement'], 'porte_grippee', 'fermée', true, false],
        [['p-embarquement', 'p-cabine'], 'ecoutille', 'fermée', false, false],
      ],
      undefined,
    ],
  ] as const)('%s : liaisons [extrémités, nom, état, bruyante, gouffre] et porte de sortie figées', (id, liaisons, sortie) => {
    const { morceau } = entree(id);
    expect(
      morceau.liaisons.map((liaison) => [liaison.entre, liaison.nom, liaison.ouverte ? 'ouverte' : 'fermée', liaison.bruyante === true, liaison.gouffre === true]),
    ).toEqual(liaisons);
    expect(morceau.sortie).toEqual(sortie);
    expect(morceau.sortie?.porte.bruyante).toBeUndefined();
  });

  it('M-08 : la planche, pont encombrant, est dans l’atelier ; pas de touret', () => {
    const { morceau } = entree('m-08');
    expect(morceau.objets).toEqual([{ id: 'o-planche', nom: 'planche', piece: 'p-atelier', pont: true, encombrant: true }]);
    expect(morceau.objets.some((objet) => objet.nom === 'touret')).toBe(false);
  });

  it('M-09 : deux interrupteurs de gravité, dans les sas, hors de la coursive ; pas de burette', () => {
    const { morceau } = entree('m-09');
    const interrupteurs = morceau.objets.filter((objet) => objet.gravite === 'p-transfert');
    expect(interrupteurs.map((objet) => [objet.nom, objet.piece])).toEqual([
      ['interrupteur_gravite', 'p-sas-ouest'],
      ['interrupteur_gravite', 'p-sas-est'],
    ]);
    expect(morceau.pieces.find((piece) => piece.id === 'p-transfert')?.gravite).toBe('coupee');
    expect(morceau.objets.filter((objet) => objet.piece === 'p-transfert')).toEqual([]);
    expect(morceau.objets.some((objet) => objet.nom === 'burette')).toBe(false);
  });

  it.each([
    ['m-08', ['touret', 'réserve']],
    ['m-09', ['burette', 'soute']],
  ] as const)('vigilance 5 : aucun texte de %s ne garde %j de sa station de test', (id, mots) => {
    const textes = JSON.stringify(entree(id).textes).toLocaleLowerCase('fr');
    for (const mot of mots) expect(textes).not.toContain(mot);
  });

  it('aucun mot de l’univers ni de la menace dans les textes de M-06, M-08 et M-09', () => {
    expect(Object.keys(MORCEAUX_TEXTES)).toEqual(expect.arrayContaining(['m-06', 'm-08', 'm-09']));
    expect(fuitesDeCouches(MORCEAUX_TEXTES)).toEqual([]);
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

// Table des paires, compositions, résolution d'un identifiant et tirage (#152, 13 §4.1, D-253, D-260).

const ID = 'm07-m03-soute-2718281828';
const MONDE_ID = /^[a-z0-9-]{1,40}$/;
const SANS_M03_M07 = PAIRES.filter((ligne) => !(ligne.a === 'M-03' && ligne.b === 'M-07'));

function hasardDepuis(graine: number): () => number {
  let etat = generateurDepuisGraine(graine);
  return () => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
}

function suiteDe(...valeurs: number[]): () => number {
  let rang = 0;
  return () => {
    const valeur = valeurs[rang++];
    if (valeur === undefined) throw new Error('Hasard épuisé.');
    return valeur;
  };
}

function entreeDe(resultat: EntreeMonde | Refus): EntreeMonde {
  if ('refus' in resultat) throw new Error(resultat.refus);
  return resultat;
}

function refusDe(resultat: EntreeMonde | Refus): string {
  if (!('refus' in resultat)) throw new Error(`Station acceptée : ${resultat.monde.id}.`);
  return resultat.refus;
}

const DE_TEST = (station: DefStation): boolean => station.id === 'm-07' || station.id === 'm-10';

/** Assembleur qui note les stations demandées, hors stations de test assemblées à la création du catalogue. */
function espion(repondre: Assembleur = assemblerStation): { readonly appels: DefStation[]; readonly assembler: Assembleur } {
  const appels: DefStation[] = [];
  return {
    appels,
    assembler: (station) => {
      if (DE_TEST(station)) return assemblerStation(station);
      appels.push(station);
      return repondre(station);
    },
  };
}

describe('table des paires (13 §4.1)', () => {
  const NUMEROS = Array.from({ length: 10 }, (_, rang) => `M-${String(rang + 1).padStart(2, '0')}`);

  it('45 paires, chacune une seule fois, dans l’ordre de la table, a < b, chacune avec sa règle', () => {
    expect(PAIRES).toHaveLength(45);
    expect(PAIRES.map((ligne) => `${ligne.a} + ${ligne.b}`)).toEqual(NUMEROS.flatMap((a, rang) => NUMEROS.slice(rang + 1).map((b) => `${a} + ${b}`)));
    for (const ligne of PAIRES) {
      expect(ligne.a < ligne.b).toBe(true);
      expect(ligne.regle).toMatch(/\(.*D-\d{3}.*\)$/);
    }
  });

  it('seule M-03 + M-06 est jamais ensemble', () => {
    expect(PAIRES.filter((ligne) => ligne.verdict === 'jamais')).toEqual([
      { a: 'M-03', b: 'M-06', verdict: 'jamais', regle: 'Deux morceaux finals ; un seul final par station (D-159, D-172)' },
    ]);
    expect(PAIRES.filter((ligne) => ligne.verdict === 'permise')).toHaveLength(44);
  });
});

describe('compositions', () => {
  it('16 compositions à un chemin (2 places), 72 à deux (M-07 à M-10 deux à deux, dans les deux ordres, 3 places), M-03 ou M-06 au bout, triées, sans refus, publiées', () => {
    expect(CATALOGUE.compositions).toEqual([
      { id: 'm07-m03-reserve', chemins: ['m-07'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm07-m03-soute', chemins: ['m-07'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m06-embarquement', chemins: ['m-07'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm07-m06-soute', chemins: ['m-07'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m08-m03-magasin', chemins: ['m-07', 'm-08'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm07-m08-m03-reserve', chemins: ['m-07', 'm-08'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm07-m08-m03-soute', chemins: ['m-07', 'm-08'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m08-m06-embarquement', chemins: ['m-07', 'm-08'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm07-m08-m06-magasin', chemins: ['m-07', 'm-08'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm07-m08-m06-soute', chemins: ['m-07', 'm-08'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m09-m03-cale', chemins: ['m-07', 'm-09'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm07-m09-m03-reserve', chemins: ['m-07', 'm-09'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm07-m09-m03-soute', chemins: ['m-07', 'm-09'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m09-m06-cale', chemins: ['m-07', 'm-09'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm07-m09-m06-embarquement', chemins: ['m-07', 'm-09'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm07-m09-m06-soute', chemins: ['m-07', 'm-09'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m10-m03-entrepot', chemins: ['m-07', 'm-10'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm07-m10-m03-reserve', chemins: ['m-07', 'm-10'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm07-m10-m03-soute', chemins: ['m-07', 'm-10'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm07-m10-m06-embarquement', chemins: ['m-07', 'm-10'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm07-m10-m06-entrepot', chemins: ['m-07', 'm-10'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm07-m10-m06-soute', chemins: ['m-07', 'm-10'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm08-m03-magasin', chemins: ['m-08'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m03-reserve', chemins: ['m-08'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm08-m06-embarquement', chemins: ['m-08'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm08-m06-magasin', chemins: ['m-08'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m07-m03-magasin', chemins: ['m-08', 'm-07'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m07-m03-reserve', chemins: ['m-08', 'm-07'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm08-m07-m03-soute', chemins: ['m-08', 'm-07'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm08-m07-m06-embarquement', chemins: ['m-08', 'm-07'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm08-m07-m06-magasin', chemins: ['m-08', 'm-07'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m07-m06-soute', chemins: ['m-08', 'm-07'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm08-m09-m03-cale', chemins: ['m-08', 'm-09'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm08-m09-m03-magasin', chemins: ['m-08', 'm-09'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m09-m03-reserve', chemins: ['m-08', 'm-09'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm08-m09-m06-cale', chemins: ['m-08', 'm-09'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm08-m09-m06-embarquement', chemins: ['m-08', 'm-09'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm08-m09-m06-magasin', chemins: ['m-08', 'm-09'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m10-m03-entrepot', chemins: ['m-08', 'm-10'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm08-m10-m03-magasin', chemins: ['m-08', 'm-10'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm08-m10-m03-reserve', chemins: ['m-08', 'm-10'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm08-m10-m06-embarquement', chemins: ['m-08', 'm-10'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm08-m10-m06-entrepot', chemins: ['m-08', 'm-10'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm08-m10-m06-magasin', chemins: ['m-08', 'm-10'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm09-m03-cale', chemins: ['m-09'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m03-reserve', chemins: ['m-09'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm09-m06-cale', chemins: ['m-09'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m06-embarquement', chemins: ['m-09'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm09-m07-m03-cale', chemins: ['m-09', 'm-07'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m07-m03-reserve', chemins: ['m-09', 'm-07'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm09-m07-m03-soute', chemins: ['m-09', 'm-07'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm09-m07-m06-cale', chemins: ['m-09', 'm-07'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m07-m06-embarquement', chemins: ['m-09', 'm-07'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm09-m07-m06-soute', chemins: ['m-09', 'm-07'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm09-m08-m03-cale', chemins: ['m-09', 'm-08'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m08-m03-magasin', chemins: ['m-09', 'm-08'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm09-m08-m03-reserve', chemins: ['m-09', 'm-08'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm09-m08-m06-cale', chemins: ['m-09', 'm-08'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m08-m06-embarquement', chemins: ['m-09', 'm-08'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm09-m08-m06-magasin', chemins: ['m-09', 'm-08'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm09-m10-m03-cale', chemins: ['m-09', 'm-10'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m10-m03-entrepot', chemins: ['m-09', 'm-10'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm09-m10-m03-reserve', chemins: ['m-09', 'm-10'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm09-m10-m06-cale', chemins: ['m-09', 'm-10'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm09-m10-m06-embarquement', chemins: ['m-09', 'm-10'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm09-m10-m06-entrepot', chemins: ['m-09', 'm-10'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m03-entrepot', chemins: ['m-10'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m03-reserve', chemins: ['m-10'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm10-m06-embarquement', chemins: ['m-10'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm10-m06-entrepot', chemins: ['m-10'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m07-m03-entrepot', chemins: ['m-10', 'm-07'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m07-m03-reserve', chemins: ['m-10', 'm-07'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm10-m07-m03-soute', chemins: ['m-10', 'm-07'], final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm10-m07-m06-embarquement', chemins: ['m-10', 'm-07'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm10-m07-m06-entrepot', chemins: ['m-10', 'm-07'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m07-m06-soute', chemins: ['m-10', 'm-07'], final: 'm-06', creature: 'm-07/p-soute', refus: null },
      { id: 'm10-m08-m03-entrepot', chemins: ['m-10', 'm-08'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m08-m03-magasin', chemins: ['m-10', 'm-08'], final: 'm-03', creature: 'm-08/p-magasin', refus: null },
      { id: 'm10-m08-m03-reserve', chemins: ['m-10', 'm-08'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm10-m08-m06-embarquement', chemins: ['m-10', 'm-08'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm10-m08-m06-entrepot', chemins: ['m-10', 'm-08'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m08-m06-magasin', chemins: ['m-10', 'm-08'], final: 'm-06', creature: 'm-08/p-magasin', refus: null },
      { id: 'm10-m09-m03-cale', chemins: ['m-10', 'm-09'], final: 'm-03', creature: 'm-09/p-cale', refus: null },
      { id: 'm10-m09-m03-entrepot', chemins: ['m-10', 'm-09'], final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m09-m03-reserve', chemins: ['m-10', 'm-09'], final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm10-m09-m06-cale', chemins: ['m-10', 'm-09'], final: 'm-06', creature: 'm-09/p-cale', refus: null },
      { id: 'm10-m09-m06-embarquement', chemins: ['m-10', 'm-09'], final: 'm-06', creature: 'm-06/p-embarquement', refus: null },
      { id: 'm10-m09-m06-entrepot', chemins: ['m-10', 'm-09'], final: 'm-06', creature: 'm-10/p-entrepot', refus: null },
    ]);
    expect(COMPOSITIONS_PUBLIEES).toEqual(CATALOGUE.compositions.map((composition) => composition.id));
  });

  it('88 compositions : 44 par final, 16 à un chemin, 72 à deux ; aucune ne réunit M-03 et M-06', () => {
    const { compositions } = CATALOGUE;
    expect(compositions).toHaveLength(88);
    for (const final of ['m-03', 'm-06']) expect(compositions.filter((composition) => composition.final === final), final).toHaveLength(44);
    expect(compositions.filter((composition) => composition.chemins.length === 1)).toHaveLength(16);
    expect(compositions.filter((composition) => composition.chemins.length === 2)).toHaveLength(72);
    for (const composition of compositions) {
      const morceaux: string[] = [...composition.chemins, composition.final];
      expect(morceaux.includes('m-03') && morceaux.includes('m-06'), composition.id).toBe(false);
    }
  });

  it('identifiants de composition uniques, triés, minuscules, chiffres et tirets, 29 caractères au plus : avec la graine, 40 au plus', () => {
    const ids = CATALOGUE.compositions.map((composition) => composition.id);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]{1,29}$/);
      expect(`${id}-4294967295`).toMatch(MONDE_ID);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
    expect(COMPOSITIONS_PUBLIEES).toEqual([...COMPOSITIONS_PUBLIEES].sort());
  });

  it('places distinctes : par station, une composition par place, aucune place du même nom affiché qu’une autre', () => {
    const parStation = new Map<string, Composition[]>();
    for (const composition of CATALOGUE.compositions) {
      const cle = [...composition.chemins, composition.final].join(' + ');
      parStation.set(cle, [...(parStation.get(cle) ?? []), composition]);
    }
    expect(parStation.size).toBe(32);
    for (const [cle, compositions] of parStation) {
      const morceaux = cle.split(' + ').map((id) => MORCEAUX[id]);
      const places = morceaux.flatMap((entree) => entree?.morceau.placesCreature.map((place) => `${entree.morceau.id}/${place}`) ?? []);
      expect(compositions.map((composition) => composition.creature).sort(), cle).toEqual([...places].sort());
      const noms = morceaux.flatMap((entree) =>
        (entree?.morceau.placesCreature ?? []).map((place) => {
          const nom = entree?.morceau.pieces.find((piece) => piece.id === place)?.nom ?? place;
          return entree?.textes.noms[nom]?.texte ?? nom;
        }),
      );
      expect(new Set(noms).size, cle).toBe(noms.length);
    }
  });

  it('G-02 : sans la paire M-03 + M-07, ses compositions sont refusées avec le motif de la table, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, SANS_M03_M07);
    const motif = 'Paire M-03 + M-07 absente de la table : refusée par défaut.';
    // Toute station qui passe par M-07 et se termine par M-03 est refusée ; les autres restent, M-07 vers M-06 compris.
    expect(catalogue.compositions.map((composition) => [composition.id, composition.refus])).toEqual(
      CATALOGUE.compositions.map(({ id, chemins, final }) => [id, chemins.includes('m-07') && final === 'm-03' ? motif : null]),
    );
    expect(catalogue.compositions.filter((composition) => composition.refus === motif)).toHaveLength(20);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm07-m03-soute'))).toContain('M-03 + M-07');
    expect(refusDe(catalogue.resoudre('m07-m03-soute-42'))).toContain('M-03 + M-07');
    expect(refusDe(catalogue.construire('m07-m03-soute', 42))).toContain('M-03 + M-07');
    expect(appels).toEqual([]);
    // Le tirage libre ne propose plus que les compositions qui restent.
    const restantes = catalogue.compositions.filter((composition) => composition.refus === null).map((composition) => composition.id);
    const hasard = hasardDepuis(2);
    for (let rang = 0; rang < 20; rang++) expect(restantes).toContain(entreeDe(catalogue.tirer(hasard)).monde.id.replace(/-\d+$/, ''));
  });

  it('G-02 : sans la paire M-07 + M-10, m07-m10-m03-soute est refusée avec le motif de la table, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, PAIRES.filter((ligne) => !(ligne.a === 'M-07' && ligne.b === 'M-10')));
    const motif = 'Paire M-07 + M-10 absente de la table : refusée par défaut.';
    expect(catalogue.compositions.find((composition) => composition.id === 'm07-m10-m03-soute')?.refus).toBe(motif);
    expect(catalogue.compositions.filter((composition) => composition.refus !== null).map((composition) => composition.id)).toEqual([
      'm07-m10-m03-entrepot',
      'm07-m10-m03-reserve',
      'm07-m10-m03-soute',
      'm07-m10-m06-embarquement',
      'm07-m10-m06-entrepot',
      'm07-m10-m06-soute',
      'm10-m07-m03-entrepot',
      'm10-m07-m03-reserve',
      'm10-m07-m03-soute',
      'm10-m07-m06-embarquement',
      'm10-m07-m06-entrepot',
      'm10-m07-m06-soute',
    ]);
    expect(refusDe(catalogue.resoudre('m07-m10-m03-soute-42'))).toBe(motif);
    expect(refusDe(catalogue.construire('m07-m10-m03-soute', 42))).toBe(motif);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm07-m10-m03-soute'))).toBe(motif);
    expect(appels).toEqual([]);
  });

  it('le motif est celui de la première paire refusée : chemin–chemin, puis chaque chemin–final, dans l’ordre de la station', () => {
    const sans = (...paires: string[]) => PAIRES.filter((ligne) => !paires.includes(`${ligne.a} + ${ligne.b}`));
    const refus = (table: typeof PAIRES, id: string) => creerCatalogue(assemblerStation, table).compositions.find((composition) => composition.id === id)?.refus;
    expect(refus(sans('M-07 + M-10', 'M-03 + M-07'), 'm07-m10-m03-soute')).toContain('M-07 + M-10');
    expect(refus(sans('M-03 + M-07', 'M-03 + M-10'), 'm07-m10-m03-soute')).toContain('M-03 + M-07');
    expect(refus(sans('M-03 + M-07', 'M-03 + M-10'), 'm10-m07-m03-soute')).toContain('M-03 + M-10');
  });

  it('une paire jamais ensemble refuse la composition avec sa règle, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const table = PAIRES.map((ligne) => (ligne.a === 'M-03' && ligne.b === 'M-10' ? { ...ligne, verdict: 'jamais' as const, regle: 'Règle d’essai (D-000)' } : ligne));
    const catalogue = creerCatalogue(assembler, table);
    const motif = refusDe(catalogue.resoudre('m10-m03-entrepot-1'));
    expect(motif).toContain('M-03 + M-10');
    expect(motif).toContain('Règle d’essai (D-000)');
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm10-m03-reserve'))).toBe(motif);
    expect(appels).toEqual([]);
  });

  it('une composition possible mais non publiée n’est ni résolue ni tirée ; construire l’assemble quand même', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, PAIRES, ['m07-m03-soute']);
    const motif = 'Composition m10-m03-entrepot non prouvée : non proposée.';
    expect(refusDe(catalogue.resoudre('m10-m03-entrepot-1'))).toBe(motif);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm10-m03-entrepot'))).toBe(motif);
    expect(appels).toEqual([]);
    expect(entreeDe(catalogue.construire('m10-m03-entrepot', 2718281828)).monde.id).toBe('m10-m03-entrepot-2718281828');
    const hasard = hasardDepuis(3);
    for (let rang = 0; rang < 10; rang++) expect(entreeDe(catalogue.tirer(hasard)).monde.id).toMatch(/^m07-m03-soute-/);
  });
});

describe('résolution d’un identifiant', () => {
  const { appels, assembler } = espion();
  const catalogue = creerCatalogue(assembler);

  it('un monde fixe ou une station de test se résout tel quel', () => {
    expect(catalogue.resoudre('ar-01')).toBe(catalogue.mondes['ar-01']);
    expect(catalogue.resoudre('m-07')).toBe(catalogue.mondes['m-07']);
  });

  it.each([
    '',
    'M07-M03-SOUTE-1',
    'm07-m03-soute-4294967296',
    'm07-m03-soute-99999999999',
    'm07-m03-soute-007',
    'm07-m03-soute-',
    'm07-m03-soute',
    'toString',
    '__proto__',
    'constructor',
    'hasOwnProperty-1',
    'm07-m03-inconnue-1',
    `m07-m03-soute-1${'0'.repeat(40)}`,
    'm07-m07-m03-soute-1',
    'm03-m07-m03-soute-1',
    'm07-m10-m07-m03-soute-1',
    'm07-m10-m99-soute-1',
  ])('vigilance 3 : %j est refusé avec un motif, sans exception ni assemblage', (id) => {
    appels.length = 0;
    let resultat: EntreeMonde | Refus | undefined;
    expect(() => (resultat = catalogue.resoudre(id))).not.toThrow();
    expect(refusDe(resultat as EntreeMonde | Refus)).not.toBe('');
    expect(appels).toEqual([]);
  });

  it.each([
    '',
    'M07-M03-SOUTE',
    'toString',
    '__proto__',
    'm07-m03-inconnue',
    ID,
    'm07-m07-m03-soute',
    'm03-m07-m03-soute',
    'm07-m10-m07-m03-soute',
    'm07-m10-m99-soute',
  ])('tirer avec %j : composition refusée, sans assemblage', (composition) => {
    appels.length = 0;
    expect(refusDe(catalogue.tirer(hasardDepuis(1), composition))).not.toBe('');
    expect(appels).toEqual([]);
  });

  it.each([-1, 1.5, 4294967296, Number.NaN])('construire avec la graine %s : refusée, sans assemblage', (graine) => {
    appels.length = 0;
    expect(refusDe(catalogue.construire('m07-m03-soute', graine))).toContain('graine');
    expect(refusDe(catalogue.construire('toString', 1))).not.toBe('');
    expect(appels).toEqual([]);
  });

  it(`${ID} : même objet à chaque fois ; vestibule de départ, créature dans la soute, portes entre morceaux fermées`, () => {
    const premiere = entreeDe(catalogue.resoudre(ID));
    expect(catalogue.resoudre(ID)).toBe(premiere);
    expect(catalogue.construire('m07-m03-soute', 2718281828)).toBe(premiere);
    const { monde, textes, parcours } = premiere;
    expect(monde.id).toBe(ID);
    expect(validerMonde(monde)).toEqual([]);
    expect(monde.depart).toBe('vestibule/p-vestibule');
    expect(monde.creature).toEqual({ piece: 'm-07/p-soute' });
    expect(monde.pieces.map((piece) => piece.id)).toEqual([
      'vestibule/p-vestibule',
      'm-07/p-quartiers',
      'm-07/p-soute',
      'm-07/p-machines',
      'm-07/p-coursive',
      'm-03/p-energie',
      'm-03/p-reserve',
      'm-03/p-embarquement',
      'm-03/p-cabine',
    ]);
    expect(porte(monde, 'l-vestibule-m-07')).toMatchObject({ entre: ['vestibule/p-vestibule', 'm-07/p-quartiers'], ouverte: false });
    expect(porte(monde, 'l-m-07-m-03')).toMatchObject({ entre: ['m-07/p-coursive', 'm-03/p-energie'], ouverte: false });
    expect(monde.assistance).toEqual([
      { id: 'reveil', quand: { type: 'reveil' } },
      { id: 'depart', quand: { type: 'evacuation' } },
      { id: 'energie', quand: { type: 'arrivee', piece: 'm-03/p-energie' } },
    ]);
    expect(parcours).toEqual([]);
    expect(Object.keys(textes.assistance).sort()).toEqual(['depart', 'energie', 'reveil']);
  });

  it.each([
    ['m07-m03-reserve-2718281828', '0b87b46ab7436f'],
    ['m07-m03-soute-2718281828', '1744d5fd8c77e7'],
    ['m10-m03-entrepot-2718281828', '0364dc6678a99e'],
    ['m10-m03-reserve-2718281828', '040d5191c45e93'],
  ])('vigilance 2 : %s, station de L2, est reconstruite à l’identique (empreinte du monde %s)', (id, attendue) => {
    expect(empreinte(entreeDe(catalogue.resoudre(id)).monde)).toBe(attendue);
  });

  it('messages d’IA Station au réveil et au départ : écrits, sans pièce nommée ni présence détectée', () => {
    const { monde, textes } = entreeDe(catalogue.resoudre(ID));
    const noms = monde.pieces.map((piece) => textes.noms[piece.nom]?.texte.toLocaleLowerCase('fr') ?? piece.nom);
    for (const id of ['reveil', 'depart']) {
      const message = textes.assistance[id] ?? '';
      expect(message).not.toBe('');
      expect(message).not.toMatch(/présence|\d|\{/i);
      for (const nom of noms) expect(message.toLocaleLowerCase('fr')).not.toContain(nom);
    }
  });

  it('identifiant exact sans plan : refusé ; au tirage, une nouvelle graine à chaque plan manquant, 50 essais au plus', () => {
    const sansPlan = espion(() => ({ type: 'sans_plan' }));
    const vide = creerCatalogue(sansPlan.assembler);
    expect(refusDe(vide.resoudre('m10-m03-entrepot-5'))).toContain('plan');
    sansPlan.appels.length = 0;
    let tires = 0;
    expect(refusDe(vide.tirer(() => ++tires, 'm07-m03-soute'))).toContain('50');
    expect(tires).toBe(50);
    expect(sansPlan.appels.map((station) => station.graine)).toEqual(Array.from({ length: 50 }, (_, rang) => rang + 1));
  });

  it('le tirage consomme le hasard dans l’ordre : final, composition, puis graine du plan', () => {
    const manque = espion((station) => (station.graine === 7 ? { type: 'sans_plan' } : assemblerStation(station)));
    const tirage = creerCatalogue(manque.assembler);
    // Final : 4 % 2 (m-03) ; composition : 5 % 44 (m07-m09-m03-cale) ; graine 7 sans plan, puis 2718281828.
    expect(entreeDe(tirage.tirer(suiteDe(4, 5, 7, 2718281828))).monde.id).toBe('m07-m09-m03-cale-2718281828');
    expect(manque.appels.map((station) => station.graine)).toEqual([7, 2718281828]);
  });

  it('pile ou face (D-253) : le premier tirage choisit le final, 0 donne M-03, 1 donne M-06', () => {
    const graines = Array.from({ length: 50 }, (_, rang) => rang);
    const finalDe = (resultat: EntreeMonde | Refus): string | undefined => {
      const { id } = entreeDe(resultat).monde;
      return CATALOGUE.compositions.find((composition) => composition.id === id.slice(0, id.lastIndexOf('-')))?.final;
    };
    expect(finalDe(catalogue.tirer(suiteDe(0, 0, ...graines)))).toBe('m-03');
    expect(finalDe(catalogue.tirer(suiteDe(1, 0, ...graines)))).toBe('m-06');
  });
});

describe('stations tirées', () => {
  function porteDuVestibule(vue: Observation, action: 'aller' | 'ouvrir') {
    return vue.menu.find((option) => option.action === action && option.cible.sorte === 'passage' && option.cible.nom === 'porte');
  }

  it.each(COMPOSITIONS_PUBLIEES)('GP-04, %s : rien au vestibule ; regarder est gratuit ; ouvrir puis sortir sans dé', (composition) => {
    const { monde } = entreeDe(CATALOGUE.tirer(hasardDepuis(11), composition));
    const partie = nouvellePartie(monde, { version: 'stations-test', graine: 20261015 });
    const vue = observer(monde, partie.etat);
    expect(partie.etat.piece).toBe('vestibule/p-vestibule');
    expect(monde.objets.filter((objet) => objet.piece === monde.depart)).toEqual([]);
    expect(monde.creature?.piece).not.toBe(monde.depart);
    expect(vue).toMatchObject({ objets: [], creatureVisible: false, sante: 'indemne' });
    expect(porteDuVestibule(vue, 'aller')).toMatchObject({ disponible: false });

    const regards = vue.menu.filter((option) => option.action === 'regarder');
    expect(regards.length).toBeGreaterThan(0);
    for (const regard of regards) {
      const resultat = jouer(monde, partie, regard.commande);
      expect(resultat.type).toBe('consultation');
      expect(empreinteEtat(resultat.partie.etat)).toBe(empreinteEtat(partie.etat));
      expect(resultat.partie.enregistrement.actions).toEqual([]);
    }

    const ouvrir = porteDuVestibule(vue, 'ouvrir');
    expect(ouvrir?.disponible).toBe(true);
    const ouverte = jouer(monde, partie, ouvrir?.commande);
    expect(ouverte).toMatchObject({ type: 'engagee', tirages: [] });
    const aller = porteDuVestibule(observer(monde, ouverte.partie.etat), 'aller');
    expect(aller?.disponible).toBe(true);
    const sortie = jouer(monde, ouverte.partie, aller?.commande);
    expect(sortie).toMatchObject({ type: 'engagee', tirages: [] });
    const [premier] = CATALOGUE.compositions.find(({ id }) => id === composition)?.chemins ?? [];
    expect(sortie.partie.etat.piece).toBe(`${premier ?? ''}/p-quartiers`);
  });

  it('PL-04 : sur 50 stations tirées, chaque nom de pièce tient dans son rectangle', () => {
    const hasard = hasardDepuis(4);
    for (let rang = 0; rang < 50; rang++) {
      const { monde, textes } = entreeDe(CATALOGUE.tirer(hasard));
      for (const piece of monde.pieces) {
        if (piece.plan === undefined) {
          expect(piece.sousPosition).toBe(true);
          continue;
        }
        const texte = textes.noms[piece.nom]?.texte ?? '';
        expect(nomLisible(texte, piece.plan.largeur, piece.plan.hauteur), `${monde.id}, ${piece.id}`).toBe(true);
      }
    }
  });

  it('3 000 tirages : toujours une composition publiée, chacune au moins une fois, identifiant conforme et résoluble', () => {
    const hasard = hasardDepuis(20261015);
    const vues = new Set<string>();
    for (let rang = 0; rang < 3000; rang++) {
      const entree = entreeDe(CATALOGUE.tirer(hasard));
      const { id } = entree.monde;
      expect(id).toMatch(MONDE_ID);
      const composition = id.slice(0, id.lastIndexOf('-'));
      expect(COMPOSITIONS_PUBLIEES).toContain(composition);
      expect(id.slice(composition.length + 1)).toMatch(/^(0|[1-9]\d*)$/);
      expect(CATALOGUE.resoudre(id)).toBe(entree);
      vues.add(composition);
    }
    expect([...vues].sort()).toEqual(COMPOSITIONS_PUBLIEES);
  }, 60000);

  it('vigilance 5 : l’export d’une partie neuve d’une station tirée passe le service de rapports', () => {
    const { monde } = entreeDe(CATALOGUE.tirer(hasardDepuis(5)));
    const partie = exporter(monde, nouvellePartie(monde, { version: '0.1.0', graine: 7 }));
    const demande = { type: 'partie', version: '0.1.0', build: '1', commit: '', pr: 152, commentaire: '', valide: false, partie, ecran: [], validation: null };
    expect(lireDemande(JSON.parse(JSON.stringify(demande)) as unknown)).toMatchObject({ ok: true, demande: { partie: { monde: monde.id } } });
  });

  it('vigilance 4 : l’export d’une partie neuve de m08-m09-m06-embarquement-2718281828 passe le service de rapports', () => {
    const { monde } = entreeDe(CATALOGUE.resoudre('m08-m09-m06-embarquement-2718281828'));
    const partie = exporter(monde, nouvellePartie(monde, { version: '0.1.0', graine: 7 }));
    const demande = { type: 'partie', version: '0.1.0', build: '1', commit: '', pr: 153, commentaire: '', valide: false, partie, ecran: [], validation: null };
    expect(lireDemande(JSON.parse(JSON.stringify(demande)) as unknown)).toMatchObject({
      ok: true,
      demande: { partie: { monde: 'm08-m09-m06-embarquement-2718281828' } },
    });
  });
});

describe('pièces du même nom numérotées (D-208)', () => {
  // Deux chemins de test qui apportent chacun une coursive.
  const chemin = (id: string, nom = 'coursive'): DefMorceau => ({
    id,
    famille: 'chemin',
    pieces: [{ id: 'p-coursive', nom, plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }],
    liaisons: [],
    objets: [],
    entree: 'p-coursive',
    sortie: { piece: 'p-coursive', porte: { nom: 'porte' } },
    placesCreature: ['p-coursive'],
    demande: [],
    fournit: ['acces'],
  });
  const COURSIVE: TextesMorceau = {
    noms: { coursive: { texte: 'coursive', genre: 'f', nombre: 's', elision: false } },
    descriptions: { coursive: ['Une coursive étroite.', 'Un couloir de service.'] },
    assistance: {},
  };

  function deuxCoursives(noms: readonly [string, string] = ['coursive', 'coursive'], propres: TextesMorceau = COURSIVE): EntreeMonde {
    const { vestibule, essai } = MORCEAUX;
    if (vestibule === undefined || essai === undefined) throw new Error('Morceaux absents.');
    for (let graine = 1; graine <= 50; graine++) {
      const morceaux = [vestibule.morceau, chemin('c-a', noms[0]), chemin('c-b', noms[1]), essai.morceau];
      const station: DefStation = { id: 'deux-coursives', morceaux, creature: 'c-a/p-coursive', graine };
      const resultat = assemblerStation(station);
      if (resultat.type === 'station') return { monde: resultat.monde, textes: reunir([vestibule.textes, propres, essai.textes]), parcours: [] };
    }
    throw new Error('Aucun plan pour la station à deux coursives.');
  }

  it('deux coursives deviennent « coursive A » et « coursive B », mêmes genre et descriptions', () => {
    const entree = deuxCoursives();
    const numerotee = numeroter(entree);
    expect(numerotee.monde.pieces.map((piece) => [piece.id, piece.nom])).toEqual([
      ['vestibule/p-vestibule', 'vestibule'],
      ['c-a/p-coursive', 'coursive_a'],
      ['c-b/p-coursive', 'coursive_b'],
      ['essai/p-embarquement', 'embarquement'],
      ['essai/p-cabine', 'cabine'],
    ]);
    expect(numerotee.textes.noms.coursive_a).toEqual({ texte: 'coursive A', genre: 'f', nombre: 's', elision: false });
    expect(numerotee.textes.noms.coursive_b).toEqual({ texte: 'coursive B', genre: 'f', nombre: 's', elision: false });
    expect(numerotee.textes.descriptions.coursive_a).toEqual(COURSIVE.descriptions.coursive);
    expect(numerotee.textes.descriptions.coursive_b).toEqual(COURSIVE.descriptions.coursive);
    expect(validerMonde(numerotee.monde)).toEqual([]);
    expect(entree.monde.pieces[1]?.nom).toBe('coursive');
  });

  it('un nom numéroté tient dans son rectangle et ne contient aucun chiffre (carte, écran de fin)', () => {
    const { monde, textes } = numeroter(deuxCoursives());
    const numerotees = monde.pieces.filter((piece) => piece.id.endsWith('/p-coursive'));
    expect(numerotees).toHaveLength(2);
    for (const piece of numerotees) {
      const texte = textes.noms[piece.nom]?.texte ?? '';
      expect(texte).toMatch(/^coursive [A-Z]$/);
      expect(`${piece.nom} ${texte}`).not.toMatch(/\d/);
      if (piece.plan === undefined) throw new Error(`${piece.id} sans plan.`);
      expect(nomLisible(texte, piece.plan.largeur, piece.plan.hauteur)).toBe(true);
    }
  });

  it('deux clés différentes au même nom affiché reçoivent aussi une lettre, chacune avec sa description', () => {
    const nom = { texte: 'coursive', genre: 'f', nombre: 's', elision: false } as const;
    const propres: TextesMorceau = {
      noms: { coursive_x: nom, coursive_y: nom },
      descriptions: { coursive_x: ['Une coursive étroite.'], coursive_y: ['Un couloir de service.'] },
      assistance: {},
    };
    const { monde, textes } = numeroter(deuxCoursives(['coursive_x', 'coursive_y'], propres));
    const coursives = monde.pieces.filter((piece) => piece.id.endsWith('/p-coursive'));
    expect(coursives.map((piece) => [piece.nom, textes.noms[piece.nom]?.texte, textes.descriptions[piece.nom]])).toEqual([
      ['coursive_x_a', 'coursive A', ['Une coursive étroite.']],
      ['coursive_y_b', 'coursive B', ['Un couloir de service.']],
    ]);
    expect(validerMonde(monde)).toEqual([]);
  });

  it('une station sans doublon reste identique', () => {
    const entree = entreeDe(CATALOGUE.resoudre(ID));
    expect(numeroter(entree)).toBe(entree);
  });
});

describe('clés de texte en conflit entre morceaux (spec L3 §4.2)', () => {
  function morceau(id: string): EntreeMorceau {
    const entree = MORCEAUX[id];
    if (entree === undefined) throw new Error(`Morceau ${id} absent.`);
    return entree;
  }

  it('M-07 et M-10 : coursive devient coursive_m07 et coursive_m10, chacune avec ses textes ; morceaux d’origine inchangés', () => {
    const [m07, m10] = [morceau('m-07'), morceau('m-10')];
    const empreintes = [empreinte(m07), empreinte(m10)];
    expect(() => reunir([m07.textes, m10.textes])).toThrow(/coursive/);
    const [a, b] = sansConflit([m07, m10]);
    if (a === undefined || b === undefined) throw new Error('Morceaux absents.');
    expect(a.morceau.pieces.map((piece) => piece.nom)).toEqual(['quartiers', 'soute', 'machines', 'coursive_m07']);
    expect(b.morceau.pieces.map((piece) => piece.nom)).toEqual(['quartiers', 'antichambre', 'chambre', 'entrepot', 'coursive_m10']);
    expect([a.textes.noms.coursive_m07, a.textes.descriptions.coursive_m07]).toEqual([m07.textes.noms.coursive, m07.textes.descriptions.coursive]);
    expect([b.textes.noms.coursive_m10, b.textes.descriptions.coursive_m10]).toEqual([m10.textes.noms.coursive, m10.textes.descriptions.coursive]);
    expect(a.textes.descriptions.coursive_m07).not.toEqual(b.textes.descriptions.coursive_m10);
    for (const { textes } of [a, b]) expect([Object.hasOwn(textes.noms, 'coursive'), Object.hasOwn(textes.descriptions, 'coursive')]).toEqual([false, false]);
    expect(() => reunir([a.textes, b.textes])).not.toThrow();
    expect([empreinte(m07), empreinte(m10)]).toEqual(empreintes);
  });

  it('sans conflit, chaque morceau est rendu tel quel', () => {
    const entrees = [morceau('vestibule'), morceau('m-07'), morceau('m-03')];
    sansConflit(entrees).forEach((entree, rang) => expect(entree).toBe(entrees[rang]));
  });

  it('une clé renommée garde son nom venu des couches', () => {
    const avecCapsule = (id: string, description: string): EntreeMorceau => ({
      morceau: {
        ...morceau('m-07').morceau,
        id,
        objets: [{ id: 'o-capsule', nom: 'capsule', piece: 'p-coursive', portable: false }],
      },
      textes: { noms: {}, descriptions: { capsule: [description] }, assistance: {} },
    });
    const [a, b] = sansConflit([avecCapsule('c-a', 'Une capsule.'), avecCapsule('c-b', 'Une autre capsule.')]);
    expect(reunir([]).noms.capsule).toBeDefined();
    expect([a?.morceau.objets[0]?.nom, a?.textes.noms.capsule_ca, a?.textes.descriptions.capsule_ca]).toEqual(['capsule_ca', reunir([]).noms.capsule, ['Une capsule.']]);
    expect([b?.morceau.objets[0]?.nom, b?.textes.noms.capsule_cb, b?.textes.descriptions.capsule_cb]).toEqual(['capsule_cb', reunir([]).noms.capsule, ['Une autre capsule.']]);
  });

  it('vigilance 1 : m07-m10-m03-soute se lit « coursive A » puis « coursive B » ; nulle part deux pièces au même nom affiché', () => {
    const { monde, textes } = entreeDe(CATALOGUE.resoudre('m07-m10-m03-soute-2718281828'));
    expect(validerMonde(monde)).toEqual([]);
    const affiche = (id: string): string | undefined => textes.noms[monde.pieces.find((piece) => piece.id === id)?.nom ?? '']?.texte;
    expect([affiche('m-07/p-coursive'), affiche('m-10/p-coursive')]).toEqual(['coursive A', 'coursive B']);
    const references = COMPOSITIONS_PUBLIEES.map((composition) => {
      const reference = stationDeReference(CATALOGUE, composition);
      if ('refus' in reference) throw new Error(reference.refus);
      return reference.entree;
    });
    for (const station of [{ monde, textes }, ...references]) {
      const noms = station.monde.pieces.map((piece) => station.textes.noms[piece.nom]?.texte ?? piece.nom);
      expect(new Set(noms).size, station.monde.id).toBe(noms.length);
    }
  });
});
