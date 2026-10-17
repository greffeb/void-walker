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

  it('rend le rapport au format de #194', () => {
    const profil: MesureProfil = {
      parties: 10, evacuations: 6, defaites: 3, abandons: 1, actionsEvacuees: [20, 30, 40, 50, 60, 70], des: 15, coups: 9,
      parCause: { ...sansCause(), griffes: 8, feu: 1 }, sansContact: 2, horsJeu: 1, sansSortie: 0,
    };
    const mesures: MesuresDifficulte = {
      variante: 'V0', commit: 'abc1234', graine: 1, parties: 10, compositions: { publiees: 50, tirees: 9 },
      prouve: { prouvees: 10, longueurs: [18, 22] }, profils: { aleatoire: profil, prudent: profil, presse: profil },
      morceaux: { 'm-07': { parties: 4, evacuations: 3, defaites: 1 } }, secondes: 2,
    };
    const texte = enMarkdown(mesures);
    expect(texte).toContain('**Rapport de difficulté** · variante V0 · commit abc1234 · graine de mesure 1 · 10 parties par profil');
    expect(texte).toContain('| B0, chemin prouvé | 100,0 % | 0 % | — | 20,0 ; 22 |');
    expect(texte).toContain('| B2, prudent | 60,0 % | 30,0 % | 10,0 % | 45,0 ; 70 | 1,50 | 0,90 | griffes 8, feu 1 | 20,0 % | 10,0 % | 0,0 % |');
    expect(texte).toContain('| m-07 | 4 | 75,0 % | 25,0 % |');
  });

  it('centile', () => {
    expect(centile([], 0.9)).toBe(0);
    expect(centile([5, 1, 3, 2, 4], 0.9)).toBe(5);
    expect(centile([5, 1, 3, 2, 4], 0.5)).toBe(3);
  });
});
