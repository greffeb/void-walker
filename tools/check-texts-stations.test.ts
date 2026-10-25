import { assemblerStation } from '../engine';
import { COMPOSITIONS_CONTROLEES, COMPOSITIONS_PUBLIEES, creerCatalogue } from '../content';
import { CATALOGUE } from './catalogue';
import { entreeAControler, entreesAControler, verifierTextes } from './check-texts';
import { executerParcours } from './rejouer-parcours';
import { cloisonsDuCarrefour, stationDeReference, verifierLibre, verifierStation } from './verifier-station';

// Stations tirées que check:texts contrôle (spec L3 §6.4, L5 §6), à part des autres tests des textes : vitest lance les
// fichiers en parallèle (#180).

/** Ces tests parcourent tous les états atteignables : plusieurs secondes sur la machine de vérification de GitHub. */
const EXHAUSTIF = { timeout: 30_000 };

/**
 * Les stations contrôlées du catalogue, prouvées une fois : y toucher coûte une dizaine de secondes, et deux tests les relisent
 * sans les modifier. Un test qui n'en veut qu'une appelle `entreeAControler`.
 */
let controleesDuCatalogue: ReturnType<typeof entreesAControler> | undefined;
function entreesControlees(): ReturnType<typeof entreesAControler> {
  controleesDuCatalogue ??= entreesAControler(CATALOGUE);
  return controleesDuCatalogue;
}

describe('contrôle des textes des stations tirées (C-07)', () => {
  it('relit les mondes du catalogue, puis une station par composition contrôlée, publiée, à la graine vérifiée par check:stations', EXHAUSTIF, () => {
    const entrees = entreesControlees();
    const fixes = Object.keys(CATALOGUE.mondes);
    expect(entrees.slice(0, fixes.length).map(([id]) => id)).toEqual(fixes);
    const stations = entrees.slice(fixes.length);
    expect(stations).toHaveLength(COMPOSITIONS_CONTROLEES.length);
    expect(COMPOSITIONS_CONTROLEES).toEqual([
      'm01-m03-reserve',
      'm01-m05-m03-tri',
      'm02-m06-embarquement',
      'm02-m07-m06-soute',
      'm04-m09-m06-observation',
      'm05-m08-m03-magasin',
      'm07-m02-m03-atelier',
      'm08-m01-m06-magasin',
      'm09-m10-m06-cale',
      'm10-m01-m06-palier',
      'm10-m04-m03-entrepot',
      'm11-m03-remise',
      'm12-m03-stockage',
      'ol-m02-m08-m06-magasin',
      'ol-m05-m10-m03-tri',
      'ol-m05-m12-m03-reserve',
      'ol-m07-m11-m06-soute',
    ]);
    expect(COMPOSITIONS_PUBLIEES).toEqual(expect.arrayContaining([...COMPOSITIONS_CONTROLEES]));
    stations.forEach(([id, entree], rang) => {
      const composition = COMPOSITIONS_CONTROLEES[rang] ?? '';
      const reference = stationDeReference(CATALOGUE, composition);
      if ('refus' in reference || 'refus' in entree) throw new Error(`${composition} sans station.`);
      expect(id).toBe(`${composition}-${reference.graine}`);
      expect(entree.monde).toBe(reference.entree.monde);
      expect(entree.textes).toBe(reference.entree.textes);
      expect(entree.monde.assistance?.map((message) => message.id)).toEqual(expect.arrayContaining(['reveil', 'depart']));
    });
  });

  it('chaque station contrôlée a exactement un parcours : le témoin de check:stations, qui se rejoue jusqu’à l’évacuation', EXHAUSTIF, () => {
    const stations = entreesControlees().slice(Object.keys(CATALOGUE.mondes).length);
    expect(stations).toHaveLength(COMPOSITIONS_CONTROLEES.length);
    for (const [id, entree] of stations) {
      if ('refus' in entree) throw new Error(`${id} : ${entree.refus}`);
      expect(entree.parcours, id).toHaveLength(1);
      const [parcours] = entree.parcours;
      if (parcours === undefined) throw new Error(`${id} sans parcours.`);
      const libre = cloisonsDuCarrefour(entree.monde).length > 0;
      expect(parcours, id).toEqual((libre ? verifierLibre : verifierStation)({ ...entree, parcours: [] }).parcours);
      expect(parcours.attendu.issue, id).toBe('evacuation');
      expect(executerParcours(entree, parcours, 'check-texts-test').erreurs, id).toEqual([]);
    }
  });

  it('une station contrôlée sans évacuation prouvée est refusée, sans parcours', () => {
    // Vestibule sans porte : aucune action, recherche épuisée aussitôt.
    const coupe = creerCatalogue((station) => {
      const resultat = assemblerStation(station);
      if (resultat.type !== 'station' || station.id === 'm-07' || station.id === 'm-10') return resultat;
      const { monde } = resultat;
      return { ...resultat, monde: { ...monde, liaisons: monde.liaisons.filter((liaison) => !liaison.entre.includes(monde.depart)) } };
    });
    const stations = entreesAControler(coupe).slice(Object.keys(coupe.mondes).length);
    expect(stations.map(([, entree]) => ('refus' in entree ? entree.refus : null))).toEqual(
      COMPOSITIONS_CONTROLEES.map(() => expect.stringMatching(/^Évacuation non prouvée/)),
    );
  });

  it('les compositions contrôlées, publiées, couvrent chaque morceau, chaque place, chaque chemin en premier et en second, et les paires à surveiller', () => {
    const controlees = COMPOSITIONS_CONTROLEES.map((id) => {
      const composition = CATALOGUE.compositions.find((candidate) => candidate.id === id);
      if (composition === undefined) throw new Error(`${id} absente du catalogue.`);
      return composition;
    });
    expect(COMPOSITIONS_PUBLIEES).toEqual(expect.arrayContaining([...COMPOSITIONS_CONTROLEES]));
    const tous = <T>(liste: readonly T[]): T[] => [...new Set(liste)].sort();
    const morceaux = (compositions: typeof CATALOGUE.compositions): string[] => tous(compositions.flatMap((composition) => [...composition.chemins, composition.final]));
    expect(morceaux(controlees)).toEqual(morceaux(CATALOGUE.compositions));
    expect(tous(controlees.map((composition) => composition.creature))).toEqual(tous(CATALOGUE.compositions.map((composition) => composition.creature)));
    const chemins = tous(CATALOGUE.compositions.flatMap((composition) => composition.chemins));
    expect(tous(controlees.map((composition) => composition.chemins[0]))).toEqual(chemins);
    expect(tous(controlees.flatMap((composition) => composition.chemins.slice(1)))).toEqual(chemins);
    const reunit = (a: string, b: string): boolean => controlees.some((composition) => [...composition.chemins, composition.final].includes(a) && [...composition.chemins, composition.final].includes(b));
    expect(reunit('m-09', 'm-10'), 'M-09 + M-10').toBe(true);
    expect(reunit('m-08', 'm-03'), 'M-08 + M-03').toBe(true);
    for (const chemin of ['m-07', 'm-08', 'm-09', 'm-10']) expect(reunit('m-06', chemin), `M-06 + ${chemin}`).toBe(true);
    expect(reunit('m-01', 'm-06'), 'M-01 + M-06').toBe(true);
    for (const autre of ['m-06', 'm-09', 'm-10']) expect(reunit('m-04', autre), `M-04 + ${autre}`).toBe(true);
    expect(
      controlees.some((composition) => composition.chemins.join() === 'm-08,m-01'),
      'M-08 puis M-01',
    ).toBe(true);
    const places = controlees.map((composition) => composition.creature);
    expect(places).toEqual(expect.arrayContaining(['m-01/p-palier', 'm-02/p-atelier']));
    // Ordre libre (spec L5 §6) : une station par final, cloisons, commandes et message du couloir.
    expect(tous(controlees.filter((composition) => composition.forme === 'libre').map((composition) => composition.final))).toEqual(['m-03', 'm-06']);
  });

  it('un message d’IA Station chiffré dans une station tirée fait échouer le contrôle', () => {
    // Une seule station suffit : la première, la moins coûteuse à prouver, sans prouver les autres (une station M-12 coûte bien
    // plus que le délai du test).
    const [, entree] = entreeAControler(CATALOGUE, COMPOSITIONS_CONTROLEES[0] ?? '');
    if ('refus' in entree) throw new Error('Station absente.');
    const chiffre = { ...entree, textes: { ...entree.textes, assistance: { ...entree.textes.assistance, depart: 'Départ dans 3 secondes.' } } };
    expect(verifierTextes(chiffre)).toContain('assistance « depart » : chiffre dans « Départ dans 3 secondes. ».');
  });
});
