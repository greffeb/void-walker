import { describe, expect, it } from 'vitest';
import { COMPOSITIONS_PUBLIEES } from '../content';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { CATALOGUE } from './catalogue';
import { enMarkdown, formeDe, GRAINE_MESURE, lireVerdicts, motifDuVerdict, type MesuresTirages } from './mesurer-tirages';
import type { LigneCatalogue } from './verifier-station';

// Outil de mesure sur 1 000 tirages (#155, spec L5 §5) : ses classements et son rendu. Les mesures elles-mêmes, qui
// vérifient des centaines de compositions, se lancent à la main (`npm run mesurer:tirages`) et sont reportées dans 13 §7.8.

const ligne = (changement: Partial<LigneCatalogue>): LigneCatalogue => ({
  composition: 'x', verdict: 'prouvee', graine: 0, etats: 1, secondes: 0, actions: 3, diagnostic: '', empreintes: {}, ...changement,
});

describe('mesurer:tirages', () => {
  it('sur 1 000 tirages de NOUVELLE PARTIE, aucune station hors des compositions publiées, donc prouvées', () => {
    let etat = generateurDepuisGraine(GRAINE_MESURE);
    const hasard = (): number => {
      const tirage = suivant(etat);
      etat = tirage.etat;
      return tirage.valeur;
    };
    const formes = new Set<string>();
    for (let rang = 0; rang < 1000; rang++) {
      const station = CATALOGUE.tirer(hasard);
      if ('refus' in station) throw new Error(station.refus);
      const id = station.monde.id.slice(0, station.monde.id.lastIndexOf('-'));
      expect(COMPOSITIONS_PUBLIEES).toContain(id);
      const composition = CATALOGUE.compositions.find((candidate) => candidate.id === id);
      if (composition === undefined) throw new Error(`${id} absente.`);
      formes.add(formeDe(composition));
    }
    expect([...formes].sort()).toEqual(['chaine-deux', 'chaine-un', 'libre']);
  }, 120000);

  it('classe chaque verdict par motif', () => {
    expect(motifDuVerdict(ligne({}))).toBe('acceptee');
    expect(motifDuVerdict(ligne({ verdict: 'sans_sortie_sure' }))).toBe('pas_de_chemin_sur');
    expect(motifDuVerdict(ligne({ verdict: 'non_prouvee' }))).toBe('non_prouvee');
    expect(motifDuVerdict(ligne({ verdict: 'non_prouvee', ordres: ['prouvee', 'non_prouvee'] }))).toBe('un_seul_ordre');
    expect(motifDuVerdict(ligne({ verdict: 'refusee', diagnostic: 'Paire M-03 + M-06 jamais ensemble.' }))).toBe('paire_refusee');
    expect(motifDuVerdict(ligne({ verdict: 'refusee', diagnostic: 'Créature en m-01/p-palier : … (D-268) …' }))).toBe('place_ecartee');
  });

  it('relit les lignes de check:stations, ignore le reste', () => {
    const texte = ['{"composition":"a","verdict":"prouvee"}', 'Plans …', '{"chemin":"vestibule + m-07 + m-03"}', ''].join('\n');
    expect([...lireVerdicts(texte).keys()]).toEqual(['a']);
  });

  it('rend des tableaux Markdown, dont la mesure de D-241', () => {
    const mesures: MesuresTirages = {
      tirages: 10,
      reels: {
        finals: { 'm-03': 6, 'm-06': 4 },
        formes: { libre: 3, 'chaine-deux': 6, 'chaine-un': 1 },
        morceaux: { 'm-07': 2 },
        places: { 'm-07/p-soute': 2 },
        obtenues: 10,
        nonProuvees: [],
        miseHorsJeu: { possible: 4, impossible: 5, indeterminee: 1 },
        horsDuFinal: 7,
        distinctes: 9,
      },
      candidats: {
        motifs: { acceptee: 7, paire_refusee: 1, place_ecartee: 1, pas_de_plan: 0, pas_de_chemin_sur: 1, non_prouvee: 0, un_seul_ordre: 0 },
        plansTrouves: 8,
        plansCherches: 8,
        msMoyenne: 1.5,
        msMax: 4.25,
      },
    };
    const texte = enMarkdown(mesures);
    expect(texte).toContain('| Créature hors jeu ou enfermée possible avant le final (D-241) | 4 sur 10 (40,0 %) ; impossible 5 ; indéterminée 1 |');
    expect(texte).toContain('| Stations non prouvées proposées | 0 |');
    expect(texte).toContain('| place de la créature écartée (D-268) | 1 |');
    expect(texte).toContain('**Plans** : 8 trouvés sur 8 cherchés (100,0 %), 1,50 ms en moyenne et 4,25 ms au plus');
  });
});
