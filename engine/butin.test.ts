import { poserButin, type ImpasseButin, type SalleButin } from './butin';
import { jouer, nouvellePartie, observer, type DefMonde, type IntensiteTrace, type TableButin } from './index';

// Salles de butin d'une grande station (spec 2026-10-18 §6.6) sur des impasses construites : la piste, la table, la règle
// « après la coupe », la chaîne d'accroche et la distance au repaire sont données par l'appelant.

const impasse = (id: string, accroches: string | readonly string[], segment = 0, etiquettes: readonly string[] = ['document', 'butin'], distance = 5): ImpasseButin => ({
  id: `${id}/p-piece`,
  etiquettes,
  accroches: typeof accroches === 'string' ? [accroches] : accroches,
  segment,
  distance,
});

const PISTE: ReadonlyMap<string, IntensiteTrace> = new Map([
  ['m-07/p-soute', 'forte'],
  ['m-07/p-coursive', 'forte'],
  ['m-07/p-quartiers', 'legere'],
]);
const REPAIRE = 'm-07/p-soute';

const IMPASSES = [
  impasse('a1-couchettes', 'm-01/p-palier'),
  impasse('a2-cambuse', 'm-07/p-quartiers', 2),
  impasse('a3-infirmerie', 'm-07/p-coursive', 2),
  impasse('a4-consigne', 'm-08/p-est', 1),
  impasse('a5-atelier', 'm-07/p-soute', 2, ['outillage']),
];

const TROUSSE = { id: 'o-trousse', nom: 'trousse', piece: '', soin: 1 };
const BURETTE = { id: 'o-burette-reserve', nom: 'burette de reserve', piece: '', glissant: 1 };
const TABLE: TableButin = {
  entrees: [
    { objet: TROUSSE, poids: 1 },
    { objet: BURETTE, poids: 2, apresCoupeDe: 'm-04' },
  ],
  vide: 2,
  salles: [2, 3],
};

const toujours = (): boolean => true;
const GRAINES = Array.from({ length: 300 }, (_, graine) => graine);
const poser = (graine: number, options: { impasses?: readonly ImpasseButin[]; piste?: ReadonlyMap<string, IntensiteTrace>; table?: TableButin; apresCoupe?: (morceau: string, segment: number) => boolean } = {}): readonly SalleButin[] =>
  poserButin(options.impasses ?? IMPASSES, options.piste ?? PISTE, REPAIRE, options.table ?? TABLE, options.apresCoupe ?? toujours, graine);

describe('salles de butin (spec 2026-10-18 §6.6)', () => {
  it('deux ou trois salles distinctes, toutes des impasses d’étiquette butin ; la première accrochée à une pièce forte de la piste', () => {
    const nombres = new Set<number>();
    const premieres = new Set<string>();
    for (const graine of GRAINES) {
      const salles = poser(graine);
      nombres.add(salles.length);
      expect(new Set(salles.map((salle) => salle.piece)).size).toBe(salles.length);
      for (const salle of salles) expect(IMPASSES.filter((candidate) => candidate.etiquettes.includes('butin')).map((candidate) => candidate.id)).toContain(salle.piece);
      premieres.add(salles[0]?.piece ?? '');
    }
    expect([...nombres].sort()).toEqual([2, 3]);
    // Seule l'infirmerie pend à une pièce forte ; l'atelier, sur le repaire, n'a pas l'étiquette.
    expect([...premieres]).toEqual(['a3-infirmerie/p-piece']);
  });

  it('sans impasse butin accrochée à une pièce forte, la première est accrochée à une pièce légère', () => {
    const impasses = IMPASSES.filter((candidate) => candidate.id !== 'a3-infirmerie/p-piece');
    for (const graine of GRAINES) expect(poser(graine, { impasses })[0]?.piece).toBe('a2-cambuse/p-piece');
  });

  it('une impasse pendue à un couloir du catalogue est sur la piste si la chaîne de ses accroches y mène ; la plus proche trace compte', () => {
    const impasses = [
      // Couloir hors piste, accroché à la coursive (forte) : l'impasse compte comme forte.
      impasse('a6-laboratoire', ['a5-couloir/p-piece', 'm-07/p-coursive'], 2),
      impasse('a2-cambuse', 'm-07/p-quartiers', 2),
      // Couloir marqué léger, accroché à la soute (forte) : la trace la plus proche, légère, compte.
      impasse('a7-buanderie', ['a8-couloir/p-piece', 'm-07/p-soute'], 2),
    ];
    const piste = new Map([...PISTE, ['a8-couloir/p-piece', 'legere' as const]]);
    for (const graine of GRAINES) expect(poser(graine, { impasses, piste })[0]?.piece).toBe('a6-laboratoire/p-piece');
  });

  it('aucune impasse butin sur la piste : la première est la plus proche du repaire, à égalité tirée par la graine', () => {
    const impasses = [
      impasse('a1-couchettes', 'm-01/p-palier', 0, undefined, 4),
      impasse('a4-consigne', 'm-08/p-est', 1, undefined, 2),
      impasse('a9-cambuse', ['a8-couloir/p-piece', 'm-08/p-ouest'], 1, undefined, 2),
      impasse('a5-atelier', 'm-07/p-soute', 2, ['outillage'], 1),
    ];
    const premieres = new Set(GRAINES.map((graine) => poser(graine, { impasses })[0]?.piece));
    expect([...premieres].sort()).toEqual(['a4-consigne/p-piece', 'a9-cambuse/p-piece']);
  });

  it('aucune impasse butin : aucune salle, et la graine garde son plan', () => {
    const impasses = IMPASSES.filter((candidate) => !candidate.etiquettes.includes('butin'));
    for (const graine of GRAINES) expect(poser(graine, { impasses })).toEqual([]);
  });

  it('moins de candidates que de salles tirées : toutes les candidates, sans plus', () => {
    const impasses = [impasse('a3-infirmerie', 'm-07/p-coursive', 2)];
    for (const graine of GRAINES) expect(poser(graine, { impasses }).map((salle) => salle.piece)).toEqual(['a3-infirmerie/p-piece']);
  });

  it('objets tirés sans remise selon les poids, la salle vide comprise ; chacun dans sa salle, marqué butin, numéroté', () => {
    const premiers = new Map<string, number>();
    for (let graine = 0; graine < 5000; graine++) {
      const salles = poser(graine);
      const objets = salles.flatMap((salle) => (salle.objet === null ? [] : [salle.objet]));
      expect(new Set(objets.map((objet) => objet.nom)).size).toBe(objets.length);
      objets.forEach((objet, rang) => {
        expect(objet.id).toBe(`o-butin-${rang + 1}`);
        expect(objet.butin).toBe(true);
      });
      for (const salle of salles) if (salle.objet !== null) expect(salle.objet.piece).toBe(salle.piece);
      const premier = salles[0]?.objet?.nom ?? 'vide';
      premiers.set(premier, (premiers.get(premier) ?? 0) + 1);
    }
    // Première salle : vide 2, trousse 1, burette 2, sur 5.
    expect(premiers.get('vide')).toBeGreaterThan(1800);
    expect(premiers.get('vide')).toBeLessThan(2200);
    expect(premiers.get('trousse')).toBeGreaterThan(800);
    expect(premiers.get('trousse')).toBeLessThan(1200);
    expect(premiers.get('burette de reserve')).toBeGreaterThan(1800);
    expect(premiers.get('burette de reserve')).toBeLessThan(2200);
  });

  it('la burette de réserve ne va que dans une salle au-delà de la coupe de M-04', () => {
    // Seul le segment 1 est après la coupe de M-04 ; la trousse n'a aucune condition.
    const apresCoupe = (morceau: string, segment: number): boolean => morceau === 'm-04' && segment === 1;
    let burettes = 0;
    for (const graine of GRAINES) {
      for (const salle of poser(graine, { apresCoupe })) {
        if (salle.objet?.nom !== 'burette de reserve') continue;
        burettes++;
        expect(IMPASSES.find((candidate) => candidate.id === salle.piece)?.segment).toBe(1);
      }
    }
    expect(burettes).toBeGreaterThan(0);
  });

  it('même graine, même résultat', () => {
    expect(poser(17)).toEqual(poser(17));
    expect(new Set(GRAINES.map((graine) => JSON.stringify(poser(graine)))).size).toBeGreaterThan(10);
  });
});

describe('regarder une salle pillée (spec 2026-10-18 §6.6)', () => {
  const monde = (pillee: boolean): DefMonde => ({
    id: 'pillage',
    depart: 'p-a',
    pieces: [{ id: 'p-a', nom: 'a', ...(pillee ? { pillee: true as const } : {}) }],
    liaisons: [],
    objets: [],
  });
  const regard = (leMonde: DefMonde) => {
    const partie = nouvellePartie(leMonde, { version: 'test', graine: 1 });
    const option = observer(leMonde, partie.etat).menu.find((candidate) => candidate.action === 'regarder');
    if (option === undefined) throw new Error('Regarder absent.');
    return jouer(leMonde, partie, option.commande);
  };

  it('la consultation d’une pièce pillée le dit', () => {
    const resultat = regard(monde(true));
    expect(resultat.type === 'consultation' ? resultat.consultation : null).toMatchObject({ type: 'regarder_piece', pillee: true });
  });

  it('une autre pièce, sans le champ', () => {
    const resultat = regard(monde(false));
    expect(resultat.type === 'consultation' ? resultat.consultation : null).not.toHaveProperty('pillee');
  });
});
