import { COMPOSITIONS_PUBLIEES, creerCatalogue, MORCEAUX, PAIRES, type EntreeMonde } from '../content';
import { assemblerStation, empreinte, jouer, nouvellePartie, observer, type DefMonde } from '../engine';
import { CATALOGUE } from './catalogue';
import { dansLeLot, LOT_UNIQUE, type Lot } from './lots';
import { executerParcours } from './rejouer-parcours';
import {
  cheminsDesPlans,
  chercherEtat,
  cleEtatRegles,
  ecartsDuCatalogue,
  ecartsDuLot,
  empreintesDe,
  explorerDes,
  mesurerPlans,
  mesurerStation,
  rangsDesMorceaux,
  stationDeReference,
  verifierCatalogue,
  verifierComposition,
  verifierLot,
  verifierStation,
  type CacheVerdicts,
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
describe('catalogue : la preuve de check:stations, outil et règles (#152, #180)', () => {
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
    // Ordre libre : deux recherches, une par ordre, d'un état chacune ; une place écartée (D-268) l'est sans recherche.
    const attendu: [string, LigneCatalogue['verdict'], number][] = CATALOGUE.compositions.map(({ id, forme, chemins, final, refus }) =>
      (chemins.includes('m-07') && final === 'm-03') || refus !== null ? [id, 'refusee', 0] : [id, 'non_prouvee', forme === 'libre' ? 2 : 1],
    );
    expect(attendu.filter(([, verdict]) => verdict === 'refusee')).toHaveLength(50 + 24 + 30);
    expect(sans.map((ligne) => [ligne.composition, ligne.verdict, ligne.etats])).toEqual(attendu);
    for (const ligne of sans.filter(({ verdict }) => verdict === 'refusee')) {
      const composition = CATALOGUE.compositions.find(({ id }) => id === ligne.composition);
      const paire = composition?.chemins.includes('m-07') === true && composition.final === 'm-03';
      expect(ligne).toMatchObject({ graine: null, secondes: 0, diagnostic: paire ? motif : composition?.refus });
    }
    // Ni refusée ni non prouvée n'a de témoin.
    expect(sans.filter((ligne) => ligne.actions !== null)).toEqual([]);
    expect(assembles.filter((id) => id.split('-').includes('m07') && id.split('-').includes('m03'))).toEqual([]);
    expect(ecartsDuCatalogue(sans, COMPOSITIONS_PUBLIEES, [])).toEqual(
      attendu
        .filter(([composition]) => COMPOSITIONS_PUBLIEES.includes(composition))
        .map(([composition, verdict]) => `Composition publiée ${composition} non prouvée (${verdict}).`),
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

/** Compositions bouchées (spec L4 §4) : en chaîne, créature au palier ou à l'atelier sans M-04, M-07, M-08 ni M-10 avant. */
const AIDES = ['m-04', 'm-07', 'm-08', 'm-10'];
function bouchee({ forme, chemins, creature }: (typeof CATALOGUE.compositions)[number]): boolean {
  if (forme !== 'chaine' || (creature !== 'm-01/p-palier' && creature !== 'm-02/p-atelier')) return false;
  return !chemins.slice(0, chemins.indexOf(creature.slice(0, creature.indexOf('/')))).some((chemin) => AIDES.includes(chemin));
}

function cacheMemoire(): CacheVerdicts & { readonly cles: string[] } {
  const valeurs = new Map<string, string>();
  return {
    cles: [],
    lire<T>(cle: string): T | undefined {
      const lu = valeurs.get(cle);
      return lu === undefined ? undefined : (JSON.parse(lu) as T);
    },
    ecrire(cle: string, valeur: unknown): void {
      this.cles.push(cle);
      valeurs.set(cle, JSON.stringify(valeur));
    },
  };
}

describe('publication : ce que check:stations doit prouver (#152, #180)', () => {
  // La preuve du catalogue entier est faite par check:stations seul (#180) : il échoue si une publiée n'est pas prouvée ou si
  // une prouvée n'est pas publiée. Ici, la règle de publication elle-même, sans recherche.
  it('publiées : toutes les compositions permises, sauf les bouchées (palier ou atelier sans aide avant) ; 684 compositions, 416 publiées en chaîne et 184 en ordre libre', () => {
    expect(CATALOGUE.compositions).toHaveLength(684);
    const attendues = CATALOGUE.compositions.filter((composition) => composition.refus === null && !bouchee(composition)).map((composition) => composition.id);
    expect(COMPOSITIONS_PUBLIEES).toEqual(attendues);
    expect(COMPOSITIONS_PUBLIEES.filter((id) => !id.startsWith('ol-'))).toHaveLength(416);
    expect(COMPOSITIONS_PUBLIEES.filter((id) => id.startsWith('ol-'))).toHaveLength(184);
  });

  // Quelques compositions choisies : une chaîne, une bouchée, un ordre libre, une refusée.
  const BOUCHEE = CATALOGUE.compositions.find((composition) => composition.refus === null && bouchee(composition));
  const REFUSEE = CATALOGUE.compositions.find((composition) => composition.refus !== null);
  const CHOISIES = [
    ['m07-m03-soute', 'prouvee'],
    [BOUCHEE?.id ?? '', 'sans_sortie_sure'],
    ['ol-m02-m08-m06-magasin', 'prouvee'],
    [REFUSEE?.id ?? '', 'refusee'],
  ] as const;

  it.each(CHOISIES)('%s : %s, ligne complète (graine la plus petite, empreintes, témoin, ordres)', (id, verdict) => {
    const composition = CATALOGUE.compositions.find((candidate) => candidate.id === id);
    if (composition === undefined) throw new Error(`${id} absente.`);
    const ligne = verifierComposition(CATALOGUE, composition);
    expect(ligne.verdict).toBe(verdict);
    expect(COMPOSITIONS_PUBLIEES.includes(id)).toBe(verdict === 'prouvee');
    if (verdict === 'refusee') {
      expect(ligne).toMatchObject({ etats: 0, graine: null, actions: null });
      expect(ligne.diagnostic).toContain('D-268');
      return;
    }
    expect(ligne.etats).toBeGreaterThan(0);
    const { graine } = ligne;
    if (graine === null) throw new Error(`${id} sans graine.`);
    for (let avant = 0; avant < graine; avant++) expect(CATALOGUE.construire(id, avant)).toHaveProperty('refus');
    const station = CATALOGUE.construire(id, graine);
    if ('refus' in station) throw new Error(station.refus);
    expect(stationDeReference(CATALOGUE, id)).toEqual({ graine, entree: station });
    const inclus = [...new Set(station.monde.pieces.map((piece) => piece.id.slice(0, piece.id.indexOf('/'))))];
    expect(Object.keys(ligne.empreintes)).toEqual(inclus);
    for (const morceau of inclus) expect(ligne.empreintes[morceau]).toBe(empreinte(MORCEAUX[morceau]));
    if (verdict === 'prouvee') {
      expect(ligne.actions).toBe(Number(/prouvée en (\d+) actions/.exec(ligne.diagnostic)?.[1]));
      expect(ligne.actions).toBeGreaterThanOrEqual(1);
    } else {
      expect(ligne.actions).toBeNull();
      expect(ligne.diagnostic).toContain('Aucune évacuation sans dé ni blessure');
    }
    if (id.startsWith('ol-')) expect(ligne.ordres).toEqual(['prouvee', 'prouvee']);
    else expect(ligne.ordres).toBeUndefined();
  }, 120000);

  it('chemins de plans : 162 en chaîne, 72 en ordre libre, chacun mesuré (seuil de 95 % appliqué par check:stations)', () => {
    const chaines = [
      ...new Set(CATALOGUE.compositions.map(({ forme, chemins, final }) => ['vestibule', ...(forme === 'libre' ? ['carrefour'] : []), ...chemins, final].join(' + '))),
    ];
    expect(chaines).toHaveLength(162 + 72);
    const mesures = mesurerPlans(2);
    expect(mesures.map((mesure) => mesure.chemin)).toEqual(chaines);
    expect(cheminsDesPlans().map(([chemin]) => chemin)).toEqual(chaines);
    for (const mesure of mesures) {
      expect(mesure.tirages).toBe(2);
      expect(mesure.msMax).toBeGreaterThanOrEqual(mesure.msMoyenne);
    }
  }, 120000);
});

describe('lots et verdicts gardés de check:stations (#180)', () => {
  /** Catalogue dont la station de `cassee` perd toute porte du départ : plus aucune action, recherche épuisée aussitôt. */
  function catalogueCasse(cassee: string): ReturnType<typeof creerCatalogue> {
    return creerCatalogue((station) => {
      const resultat = assemblerStation(station);
      if (resultat.type !== 'station' || !station.id.startsWith(`${cassee}-`)) return resultat;
      const { monde } = resultat;
      return { ...resultat, monde: { ...monde, liaisons: monde.liaisons.filter((liaison) => !liaison.entre.includes(monde.depart)) } };
    });
  }

  it('une composition publiée cassée exprès fait échouer son lot, quel que soit le partage', () => {
    const cassee = 'm07-m03-soute';
    const catalogue = catalogueCasse(cassee);
    const rang = catalogue.compositions.findIndex((composition) => composition.id === cassee);
    for (const total of [1, 3, 8]) {
      const lot: Lot = { numero: (rang % total) + 1, total };
      // Seule la composition cassée est vérifiée, pour garder le test court ; elle est bien dans le lot que lui donne le partage.
      expect(dansLeLot(catalogue.compositions, lot).map(({ id }) => id)).toContain(cassee);
      const resultat = { mondes: [], lignes: dansLeLot(catalogue.compositions, lot).filter(({ id }) => id === cassee).map((composition) => verifierComposition(catalogue, composition)), plans: [], repris: 0 };
      expect(ecartsDuLot(resultat, lot, catalogue, [cassee])).toEqual([`Composition publiée ${cassee} non prouvée (sans_sortie_sure).`]);
    }
  });

  it('écarts d’un lot : seulement ses compositions ; une publiée absente du catalogue revient au lot 1 ; une station de référence non prouvée', () => {
    const ligne = (composition: string, verdict: LigneCatalogue['verdict']): LigneCatalogue => ({
      composition, verdict, graine: 0, etats: 1, secondes: 0, actions: null, diagnostic: '', empreintes: {},
    });
    const [a, b] = CATALOGUE.compositions;
    if (a === undefined || b === undefined) throw new Error('Catalogue vide.');
    const deux = { numero: 2, total: 2 };
    const vide = { mondes: [], lignes: [], plans: [], repris: 0 };
    expect(ecartsDuLot(vide, LOT_UNIQUE, CATALOGUE, ['inconnue'])).toEqual(['Composition publiée inconnue absente du catalogue.']);
    expect(ecartsDuLot(vide, deux, CATALOGUE, ['inconnue'])).toEqual([]);
    // b est au rang 1 : lot 2 sur 2 ; a n'en est pas.
    expect(ecartsDuLot({ ...vide, lignes: [ligne(b.id, 'sans_sortie_sure')] }, deux, CATALOGUE, [a.id, b.id])).toEqual([`Composition publiée ${b.id} non prouvée (sans_sortie_sure).`]);
    const nonProuvee = { monde: 'm-07', verdict: 'non_prouvee' as const, etats: 1, secondes: 0, diagnostic: 'plafond', parcours: null, ecartes: { des: 0, blessures: 0 } };
    expect(ecartsDuLot({ ...vide, mondes: [nonProuvee] }, LOT_UNIQUE, CATALOGUE, [])).toEqual(['Station de référence m-07 non prouvée (non_prouvee) : plafond']);
  });

  it('cache : la seconde vérification reprend chaque verdict sans recherche, avec le même résultat ; d’autres options ou d’autres morceaux changent la clé', () => {
    const lot: Lot = { numero: 5, total: 60 };
    const cache = cacheMemoire();
    const premier = verifierLot(lot, { tirages: 2, cache });
    expect(premier.repris).toBe(0);
    const total = premier.mondes.length + premier.lignes.length + premier.plans.length;
    expect(total).toBeGreaterThan(0);
    expect(cache.cles).toHaveLength(total);
    const second = verifierLot(lot, { tirages: 2, cache });
    expect(second.repris).toBe(total);
    expect(JSON.parse(JSON.stringify(second))).toEqual({ ...JSON.parse(JSON.stringify(premier)), repris: total });
    // Plafond, nombre de plans : autres clés, rien de repris.
    expect(verifierLot(lot, { tirages: 3, cache, options: { maxEtats: 1 } }).repris).toBe(0);
    // Les clés des compositions portent les empreintes de leurs morceaux.
    for (const composition of dansLeLot(CATALOGUE.compositions, lot)) {
      expect(cache.cles.some((cle) => cle.startsWith(`composition ${composition.id} `) && cle.includes(JSON.stringify(empreintesDe(composition))))).toBe(true);
    }
  }, 120000);
});
