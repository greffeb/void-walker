import { COMPOSITIONS_PUBLIEES, creerCatalogue, MORCEAUX, type EntreeMonde } from '../content';
import { assemblerStation, empreinte } from '../engine';
import { CATALOGUE } from './catalogue';
import { executerParcours } from './rejouer-parcours';
import {
  ecartsDuCatalogue,
  mesurerPlans,
  mesurerTirages,
  stationDeReference,
  verifierCatalogue,
  verifierStation,
  type LigneCatalogue,
} from './verifier-station';

function entree(id: string): EntreeMonde {
  const trouvee = CATALOGUE.mondes[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent.`);
  return trouvee;
}

// Mode complet (#180) : `npm run verify:complet` seulement (VERIFY_COMPLET=1). Ces tests reprouvent le catalogue entier,
// les stations de référence, 1 000 plans par chemin et 1 000 tirages : `check:stations` en fait la preuve dans la CI et
// dans `npm run verify` ; ils restent ici pour le refaire tout en entier, une seconde fois, sur le PC.
const COMPLET = process.env.VERIFY_COMPLET === '1';

describe.runIf(COMPLET)('stations de référence, en entier', () => {
  it.each(['ar-01', 'ar-02', 'm-07', 'm-08', 'm-09', 'm-10', 'm-12'])('%s : témoin trouvé et export rejoué sans dé, indemne', (id) => {
    const monde = entree(id);
    const resultat = verifierStation(monde);
    expect(resultat.verdict).toBe('prouvee');
    if (resultat.parcours === null) throw new Error(resultat.diagnostic);
    const rapport = executerParcours(monde, resultat.parcours, 'verifier-station');
    expect(rapport.erreurs).toEqual([]);
    expect(rapport.lignes).toContain('Aucun dé tiré : oui.');
    expect(resultat.parcours.attendu.sante).toBe('indemne');
  }, 60000);

});

describe.runIf(COMPLET)('catalogue vérifié à la construction (#152), en entier', () => {
  let lignes: LigneCatalogue[] = [];
  beforeAll(() => {
    lignes = verifierCatalogue(CATALOGUE);
  }, 900000);

  it('publiées prouvées, les autres sans sortie sûre : en chaîne, palier ou atelier sans M-04, M-07, M-08, M-10 ni M-12 avant (spec L4 §4, #232) ; en ordre libre, ces places écartées (spec L5 §3.2) ; l’ensemble prouvé égale les compositions publiées', () => {
    const AIDES = ['m-04', 'm-07', 'm-08', 'm-10', 'm-12'];
    const bouchee = ({ forme, chemins, creature }: (typeof CATALOGUE.compositions)[number]): boolean => {
      if (forme !== 'chaine' || (creature !== 'm-01/p-palier' && creature !== 'm-02/p-atelier')) return false;
      return !chemins.slice(0, chemins.indexOf(creature.slice(0, creature.indexOf('/')))).some((chemin) => AIDES.includes(chemin));
    };
    expect(lignes.map((ligne) => [ligne.composition, ligne.verdict])).toEqual(
      CATALOGUE.compositions.map((composition) => [composition.id, composition.refus !== null ? 'refusee' : bouchee(composition) ? 'sans_sortie_sure' : 'prouvee']),
    );
    expect(lignes.filter((ligne) => ligne.verdict === 'prouvee').map((ligne) => ligne.composition)).toEqual(COMPOSITIONS_PUBLIEES);
    for (const ligne of lignes) {
      if (ligne.verdict === 'refusee') {
        expect(ligne).toMatchObject({ etats: 0, graine: null, actions: null });
        expect(ligne.diagnostic).toContain('D-268');
        continue;
      }
      expect(ligne.etats).toBeGreaterThan(0);
      if (ligne.verdict === 'prouvee') expect(ligne.diagnostic).toMatch(/prouvée en \d+ actions/);
      else expect(ligne.diagnostic).toContain('Aucune évacuation sans dé ni blessure');
      // Ordre libre : les deux ordres de préparation prouvés (spec L5 §4.1).
      if (ligne.composition.startsWith('ol-')) expect(ligne.ordres).toEqual(['prouvee', 'prouvee']);
      else expect(ligne.ordres).toBeUndefined();
    }
    expect(ecartsDuCatalogue(lignes, COMPOSITIONS_PUBLIEES, [])).toEqual([]);
  });

  it('536 compositions, 324 prouvées en chaîne et 140 en ordre libre, chacune avec la longueur de son témoin, celle du diagnostic', () => {
    expect(lignes).toHaveLength(536);
    const prouvees = lignes.filter((ligne) => ligne.verdict === 'prouvee');
    expect(prouvees.filter((ligne) => !ligne.composition.startsWith('ol-'))).toHaveLength(324);
    expect(prouvees.filter((ligne) => ligne.composition.startsWith('ol-'))).toHaveLength(140);
    for (const ligne of prouvees) {
      expect(ligne.actions).toBe(Number(/prouvée en (\d+) actions/.exec(ligne.diagnostic)?.[1]));
      expect(ligne.actions).toBeGreaterThanOrEqual(1);
      expect(ligne.actions).toBeLessThanOrEqual(60);
    }
  });

  it('graine de plan vérifiée : la plus petite à partir de 0 qui donne un plan, notée dans la ligne', () => {
    for (const ligne of lignes.filter(({ verdict }) => verdict !== 'refusee')) {
      const { graine } = ligne;
      if (graine === null) throw new Error(`${ligne.composition} sans graine.`);
      for (let avant = 0; avant < graine; avant++) expect(CATALOGUE.construire(ligne.composition, avant)).toHaveProperty('refus');
      const station = CATALOGUE.construire(ligne.composition, graine);
      expect(station).not.toHaveProperty('refus');
      expect(stationDeReference(CATALOGUE, ligne.composition)).toEqual({ graine, entree: station });
    }
  });

  it('une empreinte par morceau inclus, celle du morceau et de ses textes, stable d’un appel à l’autre', () => {
    for (const ligne of lignes.filter(({ verdict }) => verdict !== 'refusee')) {
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

});

describe.runIf(COMPLET)('plans des stations tirées (14 §5.6), 1 000 graines', () => {
  it('sur 1 000 graines, au moins 95 % de plans par chemin ; temps mesurés, non assertés', () => {
    const mesures = mesurerPlans(1000);
    const chaines = [
      ...new Set(CATALOGUE.compositions.map(({ forme, chemins, final }) => ['vestibule', ...(forme === 'libre' ? ['carrefour'] : []), ...chemins, final].join(' + '))),
    ];
    // 128 en chaîne, 56 en ordre libre (28 paires de branches × 2 finals).
    expect(chaines).toHaveLength(128 + 56);
    expect(mesures.map((mesure) => mesure.chemin)).toEqual(chaines);
    expect(chaines).toEqual(
      expect.arrayContaining([
        'vestibule + m-07 + m-03',
        'vestibule + m-10 + m-09 + m-06',
        'vestibule + m-01 + m-02 + m-03',
        'vestibule + m-09 + m-04 + m-06',
        'vestibule + m-05 + m-10 + m-03',
        'vestibule + carrefour + m-07 + m-08 + m-06',
      ]),
    );
    for (const mesure of mesures) {
      expect(mesure.tirages).toBe(1000);
      expect(mesure.trouves).toBeGreaterThanOrEqual(950);
      expect(mesure.msMax).toBeGreaterThanOrEqual(mesure.msMoyenne);
    }
  }, 900000);

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
    expect(Object.keys(chemins).sort()).toEqual(['1', '2']);
    expect((chemins['1'] ?? 0) + (chemins['2'] ?? 0)).toBe(1000);
    expect(Object.keys(morceaux).sort()).toEqual(distincts(publiees.flatMap((composition) => [...composition.chemins, composition.final])));
    // Chaque station compte ses chemins et son final.
    expect(somme(morceaux)).toBe(2 * (chemins['1'] ?? 0) + 3 * (chemins['2'] ?? 0));
    expect(Object.keys(places).sort()).toEqual(distincts(publiees.map((composition) => composition.creature)));
    expect(somme(places)).toBe(1000);
  }, 900000);
});