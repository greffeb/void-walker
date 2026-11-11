import { VARIANTES } from './bots';
import { CATALOGUE } from './catalogue';
import { BOTS, ecartApparie, enMarkdown, jouerParties, NOMS, quartiles, type PartieMesuree } from './mesurer-bots';
import { mesurerDifficulte } from './mesurer-difficulte';
import { FINS } from './rythme-partie';

// Mesure des bots (2026-11) : mêmes stations et mêmes graines que `mesurer:difficulte --grandes`, reproductible. La mesure sur
// 1 000 stations se lance à la main (`npm run mesurer:bots`) ; son rapport est dans docs/mesures/.

describe('mesurer:bots', () => {
  const options = { catalogue: CATALOGUE, parties: 6, plafond: 150 } as const;
  const parties = jouerParties({ ...options, bots: ['prudent', 'averti', 'sans-fermer', 'temoin', 'voyant'] });

  it('joue les stations et les graines de mesurer:difficulte : le prudent et l’averti y ont les mêmes issues', () => {
    const reference = mesurerDifficulte({ ...options, grandes: true, profils: ['prudent', 'averti'] });
    for (const profil of ['prudent', 'averti'] as const) {
      const siennes = parties.filter((partie) => partie.bot === profil);
      expect(siennes.map((partie) => partie.station)).toEqual(reference.stations?.ids);
      expect(siennes.filter((partie) => partie.indicateurs.issue === 'evacuation')).toHaveLength(reference.profils[profil].evacuations);
      expect(siennes.filter((partie) => partie.indicateurs.issue === 'defaite')).toHaveLength(reference.profils[profil].defaites);
      expect(siennes.map((partie) => partie.indicateurs.piecesVisitees)).toEqual(reference.profils[profil].piecesVisitees);
    }
  }, 240000);

  it('les mêmes graines donnent la même mesure, et un lot ne joue que ses rangs', () => {
    const sansDuree = (liste: readonly PartieMesuree[]) => liste.map((partie) => ({ ...partie, ms: 0 }));
    const lot = jouerParties({ ...options, bots: ['temoin', 'voyant'], lot: { numero: 2, total: 3 } });
    expect(lot.map((partie) => partie.rang)).toEqual([1, 1, 4, 4]);
    expect(sansDuree(lot)).toEqual(sansDuree(parties.filter((partie) => (partie.bot === 'temoin' || partie.bot === 'voyant') && partie.rang % 3 === 1)));
  });

  it('chaque partie finit dans une catégorie ; les bots de référence ne se perdent pas', () => {
    for (const partie of parties) {
      expect(FINS).toContain(partie.rythme.fin);
      expect(partie.morceaux.length).toBeGreaterThanOrEqual(3);
      if (partie.bot === 'temoin' || partie.bot === 'voyant') expect(['evacuation', 'creature', 'environnement', 'interrompu']).toContain(partie.rythme.fin);
      if (partie.bot === 'temoin' && partie.rythme.fin === 'evacuation') expect(partie.rythme.actions).toBeLessThanOrEqual(partie.temoin);
    }
  });

  it('rend le rapport : une ligne par bot, les gestes comparés à l’averti', () => {
    const rapport = enMarkdown(parties, 'abc1234');
    expect(rapport).toContain('**Mesure des bots** · commit abc1234 · graine de mesure 20261017 · 6 grandes stations');
    for (const bot of ['prudent', 'averti', 'sans-fermer', 'temoin', 'voyant'] as const) expect(rapport).toContain(`| ${NOMS[bot]} |`);
    expect(rapport).not.toContain(NOMS.presse);
    expect(rapport).toContain('### Ce que vaut chaque geste');
    expect(Object.keys(NOMS).sort()).toEqual([...BOTS].sort());
    expect(BOTS).toEqual(expect.arrayContaining(Object.keys(VARIANTES)));
  });

  it('quartiles et écart apparié', () => {
    expect(quartiles([])).toBe('—');
    expect(quartiles([1, 2, 3, 4, 5, 6, 7, 8])).toBe('5 [3–7]');
    const partie = (rang: number, evacuee: boolean) => ({ rang, rythme: { fin: evacuee ? 'evacuation' : 'perdu' } }) as PartieMesuree;
    const base = [partie(0, true), partie(1, false), partie(2, false), partie(3, false)];
    expect(ecartApparie(base, base)).toEqual({ ecart: 0, marge: 0, gagnees: 0, perdues: 0 });
    const mieux = ecartApparie(base, [partie(0, true), partie(1, true), partie(2, true), partie(3, false)]);
    expect(mieux).toMatchObject({ ecart: 50, gagnees: 2, perdues: 0 });
    expect(mieux.marge).toBeCloseTo(49, 0);
  });
});
