import {
  assemblerStation,
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
  MONDES,
  MORCEAUX,
  nomLisible,
  numeroter,
  PAIRES,
  reunir,
  type EntreeMonde,
  type Refus,
  type TextesMorceau,
} from '../content';
import { lireDemande } from '../report-service/src/rapport';
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
  it('les quatre compositions possibles, triées, publiées, sans refus', () => {
    expect(COMPOSITIONS_PUBLIEES).toEqual(['m07-m03-reserve', 'm07-m03-soute', 'm10-m03-entrepot', 'm10-m03-reserve']);
    expect(CATALOGUE.compositions).toEqual([
      { id: 'm07-m03-reserve', chemin: 'm-07', final: 'm-03', creature: 'm-03/p-reserve', refus: null },
      { id: 'm07-m03-soute', chemin: 'm-07', final: 'm-03', creature: 'm-07/p-soute', refus: null },
      { id: 'm10-m03-entrepot', chemin: 'm-10', final: 'm-03', creature: 'm-10/p-entrepot', refus: null },
      { id: 'm10-m03-reserve', chemin: 'm-10', final: 'm-03', creature: 'm-03/p-reserve', refus: null },
    ]);
  });

  it('G-02 : sans la paire M-03 + M-07, ses compositions sont refusées avec le motif de la table, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, SANS_M03_M07);
    const motif = 'Paire M-03 + M-07 absente de la table : refusée par défaut.';
    expect(catalogue.compositions.map((composition) => [composition.id, composition.refus])).toEqual([
      ['m07-m03-reserve', motif],
      ['m07-m03-soute', motif],
      ['m10-m03-entrepot', null],
      ['m10-m03-reserve', null],
    ]);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm07-m03-soute'))).toContain('M-03 + M-07');
    expect(refusDe(catalogue.resoudre('m07-m03-soute-42'))).toContain('M-03 + M-07');
    expect(refusDe(catalogue.construire('m07-m03-soute', 42))).toContain('M-03 + M-07');
    expect(appels).toEqual([]);
    // Le tirage libre ne propose plus que les compositions qui restent.
    const hasard = hasardDepuis(2);
    for (let rang = 0; rang < 20; rang++) expect(entreeDe(catalogue.tirer(hasard)).monde.id).toMatch(/^m10-m03-/);
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
  ])('vigilance 3 : %j est refusé avec un motif, sans exception ni assemblage', (id) => {
    appels.length = 0;
    let resultat: EntreeMonde | Refus | undefined;
    expect(() => (resultat = catalogue.resoudre(id))).not.toThrow();
    expect(refusDe(resultat as EntreeMonde | Refus)).not.toBe('');
    expect(appels).toEqual([]);
  });

  it.each(['', 'M07-M03-SOUTE', 'toString', '__proto__', 'm07-m03-inconnue', ID])('tirer avec %j : composition refusée, sans assemblage', (composition) => {
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
    // Final : 5 % 1 ; composition : 2 % 4 (m10-m03-entrepot) ; graine 7 sans plan, puis 2718281828.
    expect(entreeDe(tirage.tirer(suiteDe(5, 2, 7, 2718281828))).monde.id).toBe('m10-m03-entrepot-2718281828');
    expect(manque.appels.map((station) => station.graine)).toEqual([7, 2718281828]);
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
    expect(sortie.partie.etat.piece).toBe(`${composition.startsWith('m07') ? 'm-07' : 'm-10'}/p-quartiers`);
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

  it('200 tirages : toujours une composition publiée, chacune au moins une fois, identifiant conforme et résoluble', () => {
    const hasard = hasardDepuis(20261015);
    const vues = new Set<string>();
    for (let rang = 0; rang < 200; rang++) {
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
  });

  it('vigilance 5 : l’export d’une partie neuve d’une station tirée passe le service de rapports', () => {
    const { monde } = entreeDe(CATALOGUE.tirer(hasardDepuis(5)));
    const partie = exporter(monde, nouvellePartie(monde, { version: '0.1.0', graine: 7 }));
    const demande = { type: 'partie', version: '0.1.0', build: '1', commit: '', pr: 152, commentaire: '', valide: false, partie, ecran: [], validation: null };
    expect(lireDemande(JSON.parse(JSON.stringify(demande)) as unknown)).toMatchObject({ ok: true, demande: { partie: { monde: monde.id } } });
  });
});

describe('pièces du même nom numérotées (D-208)', () => {
  // Deux chemins de test qui apportent chacun une coursive.
  const chemin = (id: string): DefMorceau => ({
    id,
    famille: 'chemin',
    pieces: [{ id: 'p-coursive', nom: 'coursive', plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }],
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

  function deuxCoursives(): EntreeMonde {
    const { vestibule, essai } = MORCEAUX;
    if (vestibule === undefined || essai === undefined) throw new Error('Morceaux absents.');
    for (let graine = 1; graine <= 50; graine++) {
      const station: DefStation = { id: 'deux-coursives', morceaux: [vestibule.morceau, chemin('c-a'), chemin('c-b'), essai.morceau], creature: 'c-a/p-coursive', graine };
      const resultat = assemblerStation(station);
      if (resultat.type === 'station') return { monde: resultat.monde, textes: reunir([vestibule.textes, COURSIVE, essai.textes]), parcours: [] };
    }
    throw new Error('Aucun plan pour la station à deux coursives.');
  }

  it('deux coursives deviennent « coursive 1 » et « coursive 2 », mêmes genre et descriptions', () => {
    const entree = deuxCoursives();
    const numerotee = numeroter(entree);
    expect(numerotee.monde.pieces.map((piece) => [piece.id, piece.nom])).toEqual([
      ['vestibule/p-vestibule', 'vestibule'],
      ['c-a/p-coursive', 'coursive_1'],
      ['c-b/p-coursive', 'coursive_2'],
      ['essai/p-embarquement', 'embarquement'],
      ['essai/p-cabine', 'cabine'],
    ]);
    expect(numerotee.textes.noms.coursive_1).toEqual({ texte: 'coursive 1', genre: 'f', nombre: 's', elision: false });
    expect(numerotee.textes.noms.coursive_2).toEqual({ texte: 'coursive 2', genre: 'f', nombre: 's', elision: false });
    expect(numerotee.textes.descriptions.coursive_1).toEqual(COURSIVE.descriptions.coursive);
    expect(numerotee.textes.descriptions.coursive_2).toEqual(COURSIVE.descriptions.coursive);
    expect(validerMonde(numerotee.monde)).toEqual([]);
    expect(entree.monde.pieces[1]?.nom).toBe('coursive');
  });

  it('une station sans doublon reste identique', () => {
    const entree = entreeDe(CATALOGUE.resoudre(ID));
    expect(numeroter(entree)).toBe(entree);
  });
});
