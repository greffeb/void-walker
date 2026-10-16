import { dansLeLot, lireLot, lireOptionsLots, LOT_UNIQUE, sousLot } from './lots';

describe('lots des vérifications longues (#180)', () => {
  const liste = Array.from({ length: 23 }, (_, rang) => rang);

  it('les lots d’un total couvrent toute la liste, chaque élément une fois', () => {
    for (const total of [1, 2, 3, 7, 30]) {
      const lots = Array.from({ length: total }, (_, rang) => dansLeLot(liste, { numero: rang + 1, total }));
      expect(lots.flat().sort((a, b) => a - b)).toEqual(liste);
    }
  });

  it('les sous-lots d’un lot le couvrent exactement : jobs de CI puis processus', () => {
    for (const lot of [LOT_UNIQUE, { numero: 2, total: 3 }]) {
      const sous = Array.from({ length: 4 }, (_, rang) => dansLeLot(liste, sousLot(lot, 4, rang + 1)));
      expect(sous.flat().sort((a, b) => a - b)).toEqual(dansLeLot(liste, lot));
    }
  });

  it('lit --lot et --processus, refuse un lot ou un nombre invalide', () => {
    expect(lireLot('2/3')).toEqual({ numero: 2, total: 3 });
    for (const texte of ['0/3', '4/3', '1', 'a/b']) expect(() => lireLot(texte)).toThrow(RangeError);
    expect(lireOptionsLots(['--lot=2/3', 'x'])).toEqual({ lot: { numero: 2, total: 3 }, parts: 1, reste: ['x'] });
    expect(lireOptionsLots(['--lot=2/3', '--processus=4']).parts).toBe(4);
    expect(lireOptionsLots(['--processus=auto']).parts).toBeGreaterThanOrEqual(1);
    expect(() => lireOptionsLots(['--processus=0'])).toThrow(RangeError);
  });
});
