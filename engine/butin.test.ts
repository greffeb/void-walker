import { poserButin, type SalleButin } from './butin';
import { jouer, nouvellePartie, observer, type DefMonde, type IntensiteTrace, type TableButin } from './index';

// Salles de butin d'une grande station (spec 2026-10-18 §6.6) sur des impasses construites : la piste, la table et la règle
// « après la coupe » sont données par l'appelant.

interface Impasse {
  readonly id: string;
  readonly etiquettes: readonly string[];
  readonly accroche: string;
  readonly segment: number;
}

const impasse = (id: string, accroche: string, segment = 0, etiquettes: readonly string[] = ['document', 'butin']): Impasse => ({ id: `${id}/p-piece`, etiquettes, accroche, segment });

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
const poser = (graine: number, options: { impasses?: readonly Impasse[]; piste?: ReadonlyMap<string, IntensiteTrace>; table?: TableButin; apresCoupe?: (morceau: string, segment: number) => boolean } = {}): readonly SalleButin[] | null =>
  poserButin(options.impasses ?? IMPASSES, options.piste ?? PISTE, REPAIRE, options.table ?? TABLE, options.apresCoupe ?? toujours, graine);
const exiger = (salles: readonly SalleButin[] | null): readonly SalleButin[] => {
  if (salles === null) throw new Error('Aucune salle de butin.');
  return salles;
};

describe('salles de butin (spec 2026-10-18 §6.6)', () => {
  it('deux ou trois salles distinctes, toutes des impasses d’étiquette butin ; la première accrochée à une pièce forte de la piste', () => {
    const nombres = new Set<number>();
    const premieres = new Set<string>();
    for (const graine of GRAINES) {
      const salles = exiger(poser(graine));
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
    for (const graine of GRAINES) expect(exiger(poser(graine, { impasses }))[0]?.piece).toBe('a2-cambuse/p-piece');
  });

  it('aucune impasse butin accrochée à la piste : pas de plan pour cette graine', () => {
    const impasses = IMPASSES.filter((candidate) => !PISTE.has(candidate.accroche) || !candidate.etiquettes.includes('butin'));
    for (const graine of GRAINES) expect(poser(graine, { impasses })).toBeNull();
  });

  it('moins de candidates que de salles tirées : toutes les candidates, sans plus', () => {
    const impasses = [impasse('a3-infirmerie', 'm-07/p-coursive', 2)];
    for (const graine of GRAINES) expect(exiger(poser(graine, { impasses })).map((salle) => salle.piece)).toEqual(['a3-infirmerie/p-piece']);
  });

  it('objets tirés sans remise selon les poids, la salle vide comprise ; chacun dans sa salle, marqué butin, numéroté', () => {
    const premiers = new Map<string, number>();
    for (let graine = 0; graine < 5000; graine++) {
      const salles = exiger(poser(graine));
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
      for (const salle of exiger(poser(graine, { apresCoupe }))) {
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
