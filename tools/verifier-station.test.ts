import { COMPOSITIONS_PUBLIEES, creerCatalogue, MORCEAUX, PAIRES, type EntreeMonde } from '../content';
import { assemblerStation, empreinte, jouer, nouvellePartie, observer, type DefMonde } from '../engine';
import { CATALOGUE } from './catalogue';
import { executerParcours } from './rejouer-parcours';
import {
  chercherEtat,
  cleEtatRegles,
  ecartsDuCatalogue,
  explorerDes,
  mesurerPlans,
  mesurerStation,
  mesurerTirages,
  rangsDesMorceaux,
  stationDeReference,
  verifierCatalogue,
  verifierStation,
  type LigneCatalogue,
  type MesurePlans,
} from './verifier-station';

function entree(id: string): EntreeMonde {
  const trouvee = CATALOGUE.mondes[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent.`);
  return trouvee;
}

function resolue(id: string): EntreeMonde {
  const trouvee = CATALOGUE.resoudre(id);
  if ('refus' in trouvee) throw new Error(trouvee.refus);
  return trouvee;
}

function station(changements: Partial<DefMonde> = {}): EntreeMonde {
  return {
    ...entree('m-07'),
    monde: {
      id: 'verifieur-test',
      depart: 'a',
      pieces: [{ id: 'a', nom: 'quartiers' }, { id: 'quai', nom: 'embarquement' }, { id: 'cabine', nom: 'cabine', sousPosition: true }],
      liaisons: [
        { id: 'porte', nom: 'porte', entre: ['a', 'quai'], ouverte: false },
        { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: false },
      ],
      objets: [
        { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine', alimentee: true } },
        { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'capsule' },
      ],
      ...changements,
    },
  };
}

describe('recherche bornée par les commandes publiques', () => {
  it('trouve un chemin minimal, converti en parcours et rejoué sans dé ni blessure', () => {
    const monde = station();
    const resultat = verifierStation(monde);
    expect(resultat.verdict).toBe('prouvee');
    expect(resultat.parcours?.etapes.map((etape) => etape.action)).toEqual(['ouvrir', 'aller', 'ouvrir', 'aller', 'fermer', 'lancer']);
    expect(resultat.parcours?.attendu).toMatchObject({ actions: 6, issue: 'evacuation', sante: 'indemne', sansDe: true });
    expect(resultat.etats).toBeGreaterThan(0);
    expect(resultat.secondes).toBeGreaterThanOrEqual(0);
    expect(resultat.parcours).not.toBeNull();
    if (resultat.parcours === null) throw new Error('Témoin absent.');
    expect(executerParcours(monde, resultat.parcours, 'verifier-station').erreurs).toEqual([]);
  });

  it('une exploration épuisée sans capsule n’est pas une preuve', () => {
    const resultat = verifierStation(station({ objets: [] }));
    expect(resultat.verdict).toBe('sans_sortie_sure');
    expect(resultat.parcours).toBeNull();
    expect(resultat.diagnostic).toContain('Aucune évacuation sans dé ni blessure');
  });

  it('distingue deux portes homonymes dont les destinations sont encore inconnues', () => {
    const initiale = station();
    const monde = {
      ...initiale,
      monde: {
        ...initiale.monde,
        pieces: [...initiale.monde.pieces, { id: 'impasse', nom: 'coursive' }],
        liaisons: [
          { id: 'l-impasse', nom: 'porte', entre: ['a', 'impasse'] as const, ouverte: false, sansSignaletique: true },
          ...initiale.monde.liaisons.map((liaison) => liaison.id === 'porte' ? { ...liaison, sansSignaletique: true } : liaison),
        ],
      },
    };
    const resultat = verifierStation(monde);
    expect(resultat.verdict).toBe('prouvee');
    expect(resultat.parcours?.etapes).toHaveLength(6);
    if (resultat.parcours === null) throw new Error(resultat.diagnostic);
    expect(executerParcours(monde, resultat.parcours, 'verifier-station').erreurs).toEqual([]);
  });

  it('le plafond donne non prouvée, jamais sans sortie sûre', () => {
    const resultat = verifierStation(station(), { maxEtats: 1 });
    expect(resultat.verdict).toBe('non_prouvee');
    expect(resultat.etats).toBe(1);
    expect(resultat.parcours).toBeNull();
    expect(resultat.diagnostic).toContain('plafond');
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('refuse un plafond invalide (%s)', (maxEtats) => {
    expect(() => verifierStation(station(), { maxEtats })).toThrow(RangeError);
  });

  it('écarte une évacuation qui nécessite un dé, même favorable', () => {
    expect(verifierStation(station({ creature: { piece: 'quai' } })).verdict).toBe('sans_sortie_sure');
  });

  it('autorise le premier contact et son action de répit', () => {
    const monde = station({ creature: { piece: 'quai' } });
    const ouverte = { ...monde, monde: { ...monde.monde, liaisons: monde.monde.liaisons.map((liaison) => liaison.id === 'ecoutille' ? { ...liaison, ouverte: true } : liaison) } };
    expect(verifierStation(ouverte).verdict).toBe('prouvee');
  });

  it('écarte une blessure certaine, même sans aucun dé', () => {
    const monde = station();
    const brulante = { ...monde, monde: { ...monde.monde, pieces: monde.monde.pieces.map((piece) => piece.id === 'quai' ? { ...piece, feu: true } : piece) } };
    expect(verifierStation(brulante).verdict).toBe('sans_sortie_sure');
  });
});

describe('d’abord le morceau le plus avancé (L3 §6.2)', () => {
  const SOUTE = 'm07-m03-soute-2718281828';

  it('rang du morceau de chaque pièce, dans l’ordre de la station', () => {
    const rang = rangsDesMorceaux(resolue(SOUTE).monde);
    expect(['vestibule/p-vestibule', 'm-07/p-soute', 'm-03/p-cabine'].map(rang)).toEqual([0, 1, 2]);
  });

  it('monde écrit en entier, sans préfixe : toutes ses pièces au rang 0', () => {
    const { monde } = entree('ar-01');
    const rang = rangsDesMorceaux(monde);
    expect(monde.pieces.map((piece) => rang(piece.id))).toEqual(monde.pieces.map(() => 0));
  });

  it('trouve un état demandé en station assemblée, journal vidé', () => {
    const recherche = chercherEtat(resolue(SOUTE), (etat) => etat.piece === 'm-03/p-energie');
    expect(recherche.issue).toBe('trouve');
    expect(recherche.partie?.etat.piece).toBe('m-03/p-energie');
    expect(recherche.partie?.etat.sante).toBe('indemne');
    expect(recherche.partie?.enregistrement.actions).toEqual([]);
    expect(recherche.etats).toBeGreaterThan(1);
  });

  it('un but jamais atteint épuise la recherche', () => {
    const recherche = chercherEtat(station(), () => false);
    expect(recherche.issue).toBe('epuise');
    expect(recherche.partie).toBeNull();
    expect(recherche.etats).toBeGreaterThan(1);
  });

  it('le plafond interrompt la recherche sans conclure', () => {
    expect(chercherEtat(station(), () => false, { maxEtats: 1 })).toEqual({ issue: 'plafond', partie: null, etats: 1 });
  });

  it('développe d’abord le morceau le plus avancé, même quand un état demandé est plus proche dans un autre', () => {
    // En largeur, ou rang le plus bas d'abord, la recherche atteint d'abord m-a/reduit (2 pas) ; ici m-b/fond (3 pas, rang 1).
    const monde = station({
      depart: 'm-a/depart',
      pieces: [
        { id: 'm-a/depart', nom: 'quartiers' },
        { id: 'm-b/sas', nom: 'sas' },
        { id: 'm-b/couloir', nom: 'couloir' },
        { id: 'm-b/fond', nom: 'fond' },
        { id: 'm-a/annexe', nom: 'annexe' },
        { id: 'm-a/reduit', nom: 'reduit' },
      ],
      liaisons: [
        { id: 'l-sas', nom: 'porte_sas', entre: ['m-a/depart', 'm-b/sas'], ouverte: true },
        { id: 'l-couloir', nom: 'porte_couloir', entre: ['m-b/sas', 'm-b/couloir'], ouverte: true },
        { id: 'l-fond', nom: 'porte_fond', entre: ['m-b/couloir', 'm-b/fond'], ouverte: true },
        { id: 'l-annexe', nom: 'porte_annexe', entre: ['m-a/depart', 'm-a/annexe'], ouverte: true },
        { id: 'l-reduit', nom: 'porte_reduit', entre: ['m-a/annexe', 'm-a/reduit'], ouverte: true },
      ],
      objets: [],
    });
    expect(['m-a/reduit', 'm-b/fond'].map(rangsDesMorceaux(monde.monde))).toEqual([0, 1]);
    const recherche = chercherEtat(monde, (etat) => etat.piece === 'm-a/reduit' || etat.piece === 'm-b/fond');
    expect(recherche.issue).toBe('trouve');
    expect(recherche.partie?.etat.piece).toBe('m-b/fond');
  });

  it('station assemblée sans console ni bloc de M-03 : l’épuisement vaut toujours sans sortie sûre', () => {
    const originale = resolue(SOUTE);
    const retires = ['m-03/o-console', 'm-03/o-bloc'];
    expect(retires.every((id) => originale.monde.objets.some((objet) => objet.id === id))).toBe(true);
    const casse = { ...originale, monde: { ...originale.monde, objets: originale.monde.objets.filter((objet) => !retires.includes(objet.id)) } };
    const resultat = verifierStation(casse);
    expect(resultat.verdict).toBe('sans_sortie_sure');
    expect(resultat.parcours).toBeNull();
  }, 60000);
});

describe('clé des données de règles', () => {
  const monde = station().monde;
  const etat = nouvellePartie(monde, { version: 'test', graine: 1 }).etat;

  it('ignore uniquement les compteurs, hasard et données de présentation', () => {
    const autre = {
      ...etat,
      actions: 90,
      generateur: { a: 1, b: 2, c: 3, d: 4 },
      visitees: ['a', 'quai'],
      messages: ['deja-recu'],
      reperes: { vue: { piece: 'quai', depuis: 6 }, entendue: null },
      memoire: { pieces: {}, liaisons: { porte: true } },
    };
    expect(cleEtatRegles(autre)).toBe(cleEtatRegles(etat));
  });

  it('garde les découvertes, la santé et les portes qui modifient les actions', () => {
    for (const autre of [
      { ...etat, decouvertes: ['porte'] },
      { ...etat, sante: 'blesse' as const },
      { ...etat, liaisons: { ...etat.liaisons, porte: true } },
    ]) expect(cleEtatRegles(autre)).not.toBe(cleEtatRegles(etat));
  });

  it('les données ignorées ne changent ni les commandes ni leurs effets physiques', () => {
    const initiale = nouvellePartie(monde, { version: 'test', graine: 1 });
    const variante = { ...initiale, etat: { ...etat, actions: 20, visitees: ['a', 'quai'], reperes: { vue: { piece: 'quai', depuis: 4 }, entendue: null } } };
    const menu = observer(monde, etat).menu;
    expect(observer(monde, variante.etat).menu).toEqual(menu);
    for (const option of menu) {
      const avant = jouer(monde, initiale, option.commande, { lancer: () => 6 });
      const apres = jouer(monde, variante, option.commande, { lancer: () => 6 });
      expect(apres.type).toBe(avant.type);
      expect(cleEtatRegles(apres.partie.etat)).toBe(cleEtatRegles(avant.partie.etat));
    }
  });

  it('conserve contact, répit et passage gardé de la créature', () => {
    const depart = nouvellePartie(station({ creature: { piece: 'quai' } }).monde, { version: 'test', graine: 1 }).etat;
    if (depart.creature === null) throw new Error('Créature absente.');
    for (const changement of [{ contact: true }, { repit: true }, { garde: 'porte' }]) {
      expect(cleEtatRegles({ ...depart, creature: { ...depart.creature, ...changement } })).not.toBe(cleEtatRegles(depart));
    }
  });
});

describe('mesure exhaustive, tous les résultats de dés', () => {
  it('énumère les six faces, pas un jet chanceux ou une graine', () => {
    expect(explorerDes((des) => des.lancer(6))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('énumère aussi deux dés successifs de tailles différentes', () => {
    expect(explorerDes((des) => [des.lancer(2), des.lancer(3)])).toEqual([[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3]]);
  });

  it('respecte un deuxième dé conditionnel', () => {
    expect(explorerDes((des) => des.lancer(2) === 1 ? 0 : des.lancer(3))).toEqual([0, 1, 2, 3]);
  });

  it('ne transforme pas une erreur du moteur en résultat du graphe', () => {
    expect(() => explorerDes(() => { throw new Error('défaut'); })).toThrow('défaut');
  });

  it('explore le graphe entier, dont les issues au dé et les défaites', () => {
    const monde = station({ creature: { piece: 'quai' } });
    expect(verifierStation(monde).verdict).toBe('sans_sortie_sure');
    const rapport = mesurerStation(monde);
    expect(rapport.verdict).toBe('complete');
    expect(rapport.evacuations).toBeGreaterThan(0);
    expect(rapport.defaites).toBeGreaterThan(0);
    expect(rapport.branchesDes).toBeGreaterThan(0);
    expect(rapport.etats).toBeGreaterThan(rapport.evacuations + rapport.defaites);
  });

  it('ne prétend pas avoir mesuré le graphe entier au plafond', () => {
    const rapport = mesurerStation(station(), { maxEtats: 1 });
    expect(rapport.verdict).toBe('non_prouvee');
    expect(rapport.etats).toBe(1);
    expect(rapport.diagnostic).toContain('plafond');
  });
});

describe('stations de référence et contre-exemples G-01', () => {
  it.each(['ar-01', 'ar-02', 'm-07', 'm-08', 'm-09', 'm-10'])('%s : témoin trouvé et export rejoué sans dé, indemne', (id) => {
    const monde = entree(id);
    const resultat = verifierStation(monde);
    expect(resultat.verdict).toBe('prouvee');
    if (resultat.parcours === null) throw new Error(resultat.diagnostic);
    const rapport = executerParcours(monde, resultat.parcours, 'verifier-station');
    expect(rapport.erreurs).toEqual([]);
    expect(rapport.lignes).toContain('Aucun dé tiré : oui.');
    expect(resultat.parcours.attendu.sante).toBe('indemne');
  }, 60000);

  it.each([
    ['m-08', ['planche']],
    ['ar-01', ['bidon', 'caisse']],
  ] as const)('%s sans ses ressources indispensables est rejeté avec diagnostic', (id, noms) => {
    const originale = entree(id);
    const casse = { ...originale, monde: { ...originale.monde, objets: originale.monde.objets.filter((objet) => !noms.some((nom) => objet.nom === nom)) } };
    const resultat = verifierStation(casse);
    expect(resultat.verdict).toBe('sans_sortie_sure');
    expect(resultat.diagnostic).toContain('Aucune évacuation sans dé ni blessure');
    expect(resultat.parcours).toBeNull();
  });

  it('AR-01 sans eau seule reste faisable par la maintenance', () => {
    const originale = entree('ar-01');
    const sansEau = { ...originale, monde: { ...originale.monde, objets: originale.monde.objets.filter((objet) => objet.nom !== 'bidon') } };
    expect(verifierStation(sansEau).verdict).toBe('prouvee');
  }, 60000);
});

describe('catalogue vérifié à la construction (#152)', () => {
  let lignes: LigneCatalogue[] = [];
  beforeAll(() => {
    lignes = verifierCatalogue(CATALOGUE);
  }, 300000);

  it('toutes les compositions possibles sont prouvées ; l’ensemble prouvé égale les compositions publiées', () => {
    expect(lignes.map((ligne) => [ligne.composition, ligne.verdict])).toEqual(CATALOGUE.compositions.map((composition) => [composition.id, 'prouvee']));
    expect(lignes.filter((ligne) => ligne.verdict === 'prouvee').map((ligne) => ligne.composition)).toEqual(COMPOSITIONS_PUBLIEES);
    for (const ligne of lignes) {
      expect(ligne.etats).toBeGreaterThan(0);
      expect(ligne.diagnostic).toMatch(/prouvée en \d+ actions/);
    }
    expect(ecartsDuCatalogue(lignes, COMPOSITIONS_PUBLIEES, [])).toEqual([]);
  });

  it('88 compositions prouvées, chacune avec la longueur de son témoin, celle du diagnostic', () => {
    expect(lignes).toHaveLength(88);
    for (const ligne of lignes) {
      expect(ligne.verdict).toBe('prouvee');
      expect(ligne.actions).toBe(Number(/prouvée en (\d+) actions/.exec(ligne.diagnostic)?.[1]));
      expect(ligne.actions).toBeGreaterThanOrEqual(1);
      expect(ligne.actions).toBeLessThanOrEqual(60);
    }
  });

  it('graine de plan vérifiée : la plus petite à partir de 0 qui donne un plan, notée dans la ligne', () => {
    for (const ligne of lignes) {
      const { graine } = ligne;
      if (graine === null) throw new Error(`${ligne.composition} sans graine.`);
      for (let avant = 0; avant < graine; avant++) expect(CATALOGUE.construire(ligne.composition, avant)).toHaveProperty('refus');
      const station = CATALOGUE.construire(ligne.composition, graine);
      expect(station).not.toHaveProperty('refus');
      expect(stationDeReference(CATALOGUE, ligne.composition)).toEqual({ graine, entree: station });
    }
  });

  it('une empreinte par morceau inclus, celle du morceau et de ses textes, stable d’un appel à l’autre', () => {
    for (const ligne of lignes) {
      const station = CATALOGUE.construire(ligne.composition, ligne.graine ?? 0);
      if ('refus' in station) throw new Error(station.refus);
      const inclus = [...new Set(station.monde.pieces.map((piece) => piece.id.slice(0, piece.id.indexOf('/'))))];
      expect(Object.keys(ligne.empreintes)).toEqual(inclus);
      for (const id of inclus) expect(ligne.empreintes[id]).toBe(empreinte(MORCEAUX[id]));
    }
    // Table vide : tout est refusé, sans vérification ; les empreintes restent les mêmes.
    const refusees = verifierCatalogue(creerCatalogue(assemblerStation, []));
    expect(refusees.map((ligne) => [ligne.verdict, ligne.empreintes])).toEqual(lignes.map((ligne) => ['refusee', ligne.empreintes]));
  });

  it('G-02 : sans la paire M-03 + M-07, ses compositions sont refusées avec le motif de la table, sans assemblage ni vérification', () => {
    const assembles: string[] = [];
    const table = PAIRES.filter((ligne) => !(ligne.a === 'M-03' && ligne.b === 'M-07'));
    const catalogue = creerCatalogue((station) => {
      assembles.push(station.id);
      return assemblerStation(station);
    }, table);
    const motif = 'Paire M-03 + M-07 absente de la table : refusée par défaut.';
    const sans = verifierCatalogue(catalogue, { maxEtats: 1 });
    // Toute station qui passe par M-07 et se termine par M-03 est refusée ; les autres, M-07 vers M-06 compris, vérifiées sur un état,
    // restent non prouvées.
    const attendu: [string, LigneCatalogue['verdict'], number][] = CATALOGUE.compositions.map(({ id, chemins, final }) =>
      chemins.includes('m-07') && final === 'm-03' ? [id, 'refusee', 0] : [id, 'non_prouvee', 1],
    );
    expect(attendu.filter(([, verdict]) => verdict === 'refusee')).toHaveLength(20);
    expect(sans.map((ligne) => [ligne.composition, ligne.verdict, ligne.etats])).toEqual(attendu);
    for (const ligne of sans.filter(({ verdict }) => verdict === 'refusee')) expect(ligne).toMatchObject({ graine: null, secondes: 0, diagnostic: motif });
    // Ni refusée ni non prouvée n'a de témoin.
    expect(sans.filter((ligne) => ligne.actions !== null)).toEqual([]);
    expect(assembles.filter((id) => id.split('-').includes('m07') && id.split('-').includes('m03'))).toEqual([]);
    expect(ecartsDuCatalogue(sans, COMPOSITIONS_PUBLIEES, [])).toEqual(
      attendu.map(([composition, verdict]) => `Composition publiée ${composition} non prouvée (${verdict}).`),
    );
  });

  it('écarts : publiée non prouvée ou absente, prouvée non publiée, moins de 95 % de plans', () => {
    const ligne = (composition: string, verdict: LigneCatalogue['verdict']): LigneCatalogue => ({
      composition, verdict, graine: 0, etats: 1, secondes: 0, actions: null, diagnostic: '', empreintes: {},
    });
    const plans = (trouves: number): MesurePlans => ({ chemin: 'vestibule + m-07 + m-03', tirages: 1000, trouves, msMoyenne: 0, msMax: 0 });
    expect(ecartsDuCatalogue([ligne('a', 'prouvee'), ligne('b', 'sans_sortie_sure')], ['a'], [plans(950)])).toEqual([]);
    expect(ecartsDuCatalogue([ligne('a', 'sans_sortie_sure')], ['a'], [])).toEqual(['Composition publiée a non prouvée (sans_sortie_sure).']);
    expect(ecartsDuCatalogue([], ['a'], [])).toEqual(['Composition publiée a absente du catalogue.']);
    expect(ecartsDuCatalogue([ligne('b', 'prouvee')], [], [])).toEqual(['Composition b prouvée mais non publiée.']);
    expect(ecartsDuCatalogue([], [], [plans(949)])).toEqual(['Plans vestibule + m-07 + m-03 : 949 trouvés sur 1000, moins de 95 %.']);
  });
});

describe('plans des stations tirées (14 §5.6)', () => {
  it('sur 1 000 graines, au moins 95 % de plans par chemin ; temps mesurés, non assertés', () => {
    const mesures = mesurerPlans(1000);
    expect(mesures.map((mesure) => mesure.chemin)).toEqual([
      'vestibule + m-07 + m-03',
      'vestibule + m-07 + m-06',
      'vestibule + m-07 + m-08 + m-03',
      'vestibule + m-07 + m-08 + m-06',
      'vestibule + m-07 + m-09 + m-03',
      'vestibule + m-07 + m-09 + m-06',
      'vestibule + m-07 + m-10 + m-03',
      'vestibule + m-07 + m-10 + m-06',
      'vestibule + m-08 + m-03',
      'vestibule + m-08 + m-06',
      'vestibule + m-08 + m-07 + m-03',
      'vestibule + m-08 + m-07 + m-06',
      'vestibule + m-08 + m-09 + m-03',
      'vestibule + m-08 + m-09 + m-06',
      'vestibule + m-08 + m-10 + m-03',
      'vestibule + m-08 + m-10 + m-06',
      'vestibule + m-09 + m-03',
      'vestibule + m-09 + m-06',
      'vestibule + m-09 + m-07 + m-03',
      'vestibule + m-09 + m-07 + m-06',
      'vestibule + m-09 + m-08 + m-03',
      'vestibule + m-09 + m-08 + m-06',
      'vestibule + m-09 + m-10 + m-03',
      'vestibule + m-09 + m-10 + m-06',
      'vestibule + m-10 + m-03',
      'vestibule + m-10 + m-06',
      'vestibule + m-10 + m-07 + m-03',
      'vestibule + m-10 + m-07 + m-06',
      'vestibule + m-10 + m-08 + m-03',
      'vestibule + m-10 + m-08 + m-06',
      'vestibule + m-10 + m-09 + m-03',
      'vestibule + m-10 + m-09 + m-06',
    ]);
    for (const mesure of mesures) {
      expect(mesure.tirages).toBe(1000);
      expect(mesure.trouves).toBeGreaterThanOrEqual(950);
      expect(mesure.msMax).toBeGreaterThanOrEqual(mesure.msMoyenne);
    }
  }, 300000);

  it('1 000 tirages complets, retirages compris : chaque tirage donne une station ; finals, chemins, morceaux et places comptés', () => {
    const mesure = mesurerTirages(1000);
    expect(mesure).toMatchObject({ tirages: 1000, reussis: 1000 });
    expect(mesure.msMax).toBeGreaterThanOrEqual(mesure.msMoyenne);
    const { finals, chemins, morceaux, places } = mesure;
    const somme = (table: Readonly<Record<string, number>>): number => Object.values(table).reduce((total, nombre) => total + nombre, 0);
    const publiees = CATALOGUE.compositions.filter((composition) => COMPOSITIONS_PUBLIEES.includes(composition.id));
    const distincts = (ids: readonly string[]): string[] => [...new Set(ids)].sort();

    expect(Object.keys(finals).sort()).toEqual(['m-03', 'm-06']);
    expect((finals['m-03'] ?? 0) + (finals['m-06'] ?? 0)).toBe(1000);
    for (const nombre of Object.values(finals)) {
      expect(nombre).toBeGreaterThanOrEqual(400);
      expect(nombre).toBeLessThanOrEqual(600);
    }
    expect(Object.keys(chemins).sort()).toEqual(['1', '2']);
    expect((chemins['1'] ?? 0) + (chemins['2'] ?? 0)).toBe(1000);
    expect(Object.keys(morceaux).sort()).toEqual(distincts(publiees.flatMap((composition) => [...composition.chemins, composition.final])));
    // Chaque station compte ses chemins et son final.
    expect(somme(morceaux)).toBe(2 * (chemins['1'] ?? 0) + 3 * (chemins['2'] ?? 0));
    expect(Object.keys(places).sort()).toEqual(distincts(publiees.map((composition) => composition.creature)));
    expect(somme(places)).toBe(1000);
  }, 300000);
});