import type { EntreeMonde } from '../content';
import { jouer, nouvellePartie, observer, type DefMonde } from '../engine';
import { CATALOGUE } from './catalogue';
import { executerParcours } from './rejouer-parcours';
import { cleEtatRegles, explorerDes, mesurerStation, verifierStation } from './verifier-station';

function entree(id: string): EntreeMonde {
  const trouvee = CATALOGUE.mondes[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent.`);
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