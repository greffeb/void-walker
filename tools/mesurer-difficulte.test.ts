import { CAUSES, type Cause } from '../engine';
import { CATALOGUE } from './catalogue';
import { centile, enMarkdown, mesurerDifficulte, type MesureProfil, type MesuresDifficulte } from './mesurer-difficulte';
import type { LigneCatalogue } from './verifier-station';

// Rapport de difficulté (#194 §2.4) : reproductible d'une mesure à l'autre, rendu au format de l'issue. La mesure sur 1 000
// parties se lance à la main (`npm run mesurer:difficulte`) et se publie dans #194.

/** B0 sans recherche : chaque composition « prouvée » en 20 actions. */
const verifier = (_: unknown, composition: { readonly id: string }): LigneCatalogue => ({
  composition: composition.id, verdict: 'prouvee', graine: 0, etats: 1, secondes: 0, actions: 20, diagnostic: '', empreintes: {},
});

const sansCause = (): Record<Cause, number> => Object.fromEntries(CAUSES.map((cause) => [cause, 0])) as Record<Cause, number>;

describe('mesurer:difficulte', () => {
  it('les mêmes graines donnent la même mesure', () => {
    const options = { catalogue: CATALOGUE, parties: 3, verifier, plafond: 120 } as const;
    const premiere = mesurerDifficulte(options);
    const seconde = mesurerDifficulte(options);
    expect({ ...seconde, secondes: 0 }).toEqual({ ...premiere, secondes: 0 });
    expect(premiere.prouve).toEqual({ prouvees: 3, longueurs: [20, 20, 20] });
    for (const mesure of Object.values(premiere.profils)) {
      expect(mesure.parties).toBe(3);
      expect(mesure.evacuations + mesure.defaites + mesure.abandons).toBe(3);
    }
  }, 60000);

  it('mesure les grandes stations publiées : B0 est leur témoin publié, et le rythme de chaque profil', () => {
    const mesure = mesurerDifficulte({ catalogue: CATALOGUE, parties: 20, grandes: true, plafond: 150, profils: ['prudent', 'averti'] });
    expect(mesure.parties).toBe(20);
    expect(mesure.prouve.prouvees).toBe(20);
    expect(mesure.prouve.longueurs.every((longueur) => longueur > 20)).toBe(true);
    for (const profil of ['prudent', 'averti'] as const) {
      const m = mesure.profils[profil];
      expect(m.parties).toBe(20);
      expect(m.piecesVisitees).toHaveLength(20);
      expect(m.actionsAvantContact).toHaveLength(20 - m.sansContact);
      expect(m.defaitesTardives).toBeLessThanOrEqual(m.defaites);
    }
    expect(mesure.grandes).toBe(true);
    expect(enMarkdown(mesure)).toContain('B0 : témoin publié de la station tirée');
  }, 240000);

  it('avec et sans butin : les mêmes stations tirées, sans aucun objet de butin dans les mondes joués', () => {
    const options = { catalogue: CATALOGUE, parties: 20, grandes: true, plafond: 150, profils: ['averti'] } as const;
    const avec = mesurerDifficulte(options);
    const sans = mesurerDifficulte({ ...options, sansButin: true });
    expect(avec.stations?.ids).toHaveLength(20);
    expect(sans.stations?.ids).toEqual(avec.stations?.ids);
    expect(avec.stations?.objetsDeButin).toBeGreaterThan(0);
    expect(sans.stations?.objetsDeButin).toBe(0);
    // Les indicateurs de station se lisent sur la station tirée, butin compris : la mesure sans butin les retrouve.
    expect(sans.stations).toMatchObject({ ...avec.stations, objetsDeButin: 0 });
    expect(avec.stations?.cles).toBeGreaterThan(0);
    expect(avec.stations?.sallesDeButin).toBeGreaterThan(0);
    expect(avec.stations?.clesDeplacees).toBeLessThanOrEqual(avec.stations?.cles ?? 0);
    expect(avec.stations?.sallesVides).toBeLessThanOrEqual(avec.stations?.sallesDeButin ?? 0);
    expect(avec.sansButin).toBeUndefined();
    expect(sans.sansButin).toBe(true);
    for (const mesure of [avec, sans]) {
      const m = mesure.profils.averti;
      expect(m.horsJeuAvantFinal).toBeLessThanOrEqual(m.horsJeu);
      const texte = enMarkdown(mesure);
      expect(texte).toContain('Clés déplacées');
      expect(texte).toContain('Salles vides');
      expect(texte).toContain('Mise hors jeu avant le final');
    }
    expect(enMarkdown(sans)).toContain('butin retiré des mondes joués');
    expect(enMarkdown(avec)).not.toContain('butin retiré');
  }, 240000);

  it('refuse sans butin hors des grandes stations', () => {
    expect(() => mesurerDifficulte({ catalogue: CATALOGUE, parties: 1, sansButin: true })).toThrow(/grandes stations/);
  });

  it('rend le rapport au format de #194', () => {
    const profil: MesureProfil = {
      parties: 10, evacuations: 6, defaites: 3, abandons: 1, actionsEvacuees: [20, 30, 40, 50, 60, 70], des: 15, coups: 9,
      parCause: { ...sansCause(), griffes: 8, feu: 1 }, sansContact: 2, horsJeu: 1, horsJeuAvantFinal: 1, sansSortie: 0,
      actionsAvantContact: [30, 40, 50, 60, 70, 80, 90, 100], piecesVisitees: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28], boucles: 2, defaitesTardives: 2,
      abandonsSansContact: 1, evacueesSansContact: 1, momentsContact: [0.5, 0.75, 0.8],
    };
    const mesures: MesuresDifficulte = {
      variante: 'V0', commit: 'abc1234', graine: 1, parties: 10, compositions: { publiees: 50, tirees: 9 },
      prouve: { prouvees: 10, longueurs: [18, 22] }, profils: { aleatoire: profil, prudent: profil, presse: profil, averti: profil },
      morceaux: { 'm-07': { parties: 4, evacuations: 3, defaites: 1 } }, secondes: 2,
    };
    const texte = enMarkdown(mesures);
    expect(texte).toContain('**Rapport de difficulté** · variante V0 · commit abc1234 · graine de mesure 1 · 10 parties par profil');
    expect(texte).toContain('| B0, chemin prouvé | 100,0 % | 0 % | — | 20,0 ; 22 |');
    expect(texte).toContain('| B2, prudent | 60,0 % | 30,0 % | 10,0 % | 45,0 ; 70 | 1,50 | 0,90 | griffes 8, feu 1 | 20,0 % | 10,0 % | 0,0 % |');
    expect(texte).toContain('| m-07 | 4 | 75,0 % | 25,0 % |');
    // Rythme : médianes, poursuites par une boucle sur les parties avec rencontre, défaites dans la seconde moitié.
    // Jamais de contact sur les parties finies : (2 − 1) sur (10 − 1) ; une évacuation sur six sans rencontre.
    expect(texte).toContain('| B4, averti | 65,0 | 19,0 | 25,0 % | 66,7 % | 11,1 % | 16,7 % | 75 % |');
    expect(texte).not.toContain('Clés déplacées');
    // Grandes stations : indicateurs de station, et mise hors jeu avant le final, une part des parties de chaque profil.
    const grandes = enMarkdown({
      ...mesures, grandes: true, sansButin: true,
      stations: { ids: ['g1-a-1'], cles: 8, clesDeplacees: 3, sallesDeButin: 4, sallesVides: 1, objetsDeButin: 0 },
    });
    expect(grandes).toContain('Clés déplacées : 37,5 % (3 sur 8 clés déclarées)');
    expect(grandes).toContain('Salles vides : 25,0 % (1 sur 4 salles de butin)');
    expect(grandes).toContain('| B2, prudent | 10,0 % |');
  });

  it('centile', () => {
    expect(centile([], 0.9)).toBe(0);
    expect(centile([5, 1, 3, 2, 4], 0.9)).toBe(5);
    expect(centile([5, 1, 3, 2, 4], 0.5)).toBe(3);
  });
});
