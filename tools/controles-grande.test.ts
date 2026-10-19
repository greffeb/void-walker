import { describe, expect, it } from 'vitest';
import type { DefMonde, DefStation } from '../engine';
import type { CompositionGrande, EntreeMonde } from '../content';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { controlerGrande } from './controles-grande';
import { CATALOGUE } from './catalogue';

// Contrôles structurels des grandes stations (spec 2026-10-18 §7.3) : parcours de graphe, sans recherche d'états.

interface Construite {
  readonly entree: EntreeMonde;
  readonly station: DefStation;
}

function construire(composition: string, graine: number): Construite | null {
  const entree = CATALOGUE.construireGrande(composition, graine);
  const station = CATALOGUE.definirGrande(composition, graine);
  return 'refus' in entree || 'refus' in station ? null : { entree, station };
}

function premiere(filtre: (composition: CompositionGrande) => boolean): Construite {
  for (const composition of CATALOGUE.grandes.filter((candidate) => candidate.refus === null && filtre(candidate))) {
    for (let graine = 0; graine < 20; graine++) {
      const construite = construire(composition.id, graine);
      if (construite !== null) return construite;
    }
  }
  throw new Error('Aucune grande station pour ce filtre.');
}

const modifier = ({ entree, station }: Construite, monde: (monde: DefMonde) => DefMonde): Construite => ({ entree: { ...entree, monde: monde(entree.monde) }, station });

describe('contrôles structurels des grandes stations (spec 2026-10-18 §7.3)', () => {
  it.each([
    ['chaîne, M-08', (composition: CompositionGrande) => composition.forme === 'chaine' && composition.chemins.includes('m-08')],
    ['chaîne, M-10 en troisième', (composition: CompositionGrande) => composition.forme === 'chaine' && composition.chemins[2] === 'm-10'],
    ['chaîne, final M-06', (composition: CompositionGrande) => composition.forme === 'chaine' && composition.final === 'm-06'],
    ['ordre libre', (composition: CompositionGrande) => composition.forme === 'libre'],
    ['ordre libre, M-05 en troisième', (composition: CompositionGrande) => composition.forme === 'libre' && composition.chemins[2] === 'm-05'],
  ])('%s : une station construite passe tous les contrôles', (_cas, filtre) => {
    const { entree, station } = premiere(filtre);
    expect(controlerGrande(entree, station)).toEqual([]);
  });

  it('une boucle à travers la coupe de M-08 est signalée', () => {
    const construite = premiere((composition) => composition.chemins.includes('m-08'));
    const fautive = modifier(construite, (monde) => ({
      ...monde,
      liaisons: [...monde.liaisons, { id: 'l-boucle-9', nom: 'porte', entre: ['m-08/p-quartiers', 'm-08/p-magasin'], ouverte: false }],
      boucles: [...(monde.boucles ?? []), 'l-boucle-9'],
    }));
    expect(controlerGrande(fautive.entree, fautive.station).some((ecart) => /coupe/i.test(ecart))).toBe(true);
  });

  it('une annexe accrochée à la chambre froide est signalée', () => {
    const construite = premiere((composition) => composition.chemins.includes('m-10'));
    const fautive = modifier(construite, (monde) => {
      const porte = monde.liaisons.find((liaison) => /^l-a\d+-/.test(liaison.id));
      if (porte === undefined) throw new Error('Aucune annexe.');
      return { ...monde, liaisons: monde.liaisons.map((liaison) => (liaison === porte ? { ...liaison, entre: ['m-10/p-chambre', liaison.entre[1]] } : liaison)) };
    });
    expect(controlerGrande(fautive.entree, fautive.station).some((ecart) => /accroch/.test(ecart))).toBe(true);
  });

  it('une trace dans le vestibule est signalée', () => {
    const construite = premiere(() => true);
    const fautive = modifier(construite, (monde) => ({ ...monde, pieces: monde.pieces.map((piece) => (piece.id === monde.depart ? { ...piece, trace: 'legere' as const } : piece)) }));
    expect(controlerGrande(fautive.entree, fautive.station).some((ecart) => /trace/.test(ecart))).toBe(true);
  });

  it('propriété : sur 1 000 tirages, toute grande station construite passe tous les contrôles', () => {
    const tirables = CATALOGUE.grandes.filter((composition) => composition.refus === null);
    let alea = generateurDepuisGraine(20261019);
    const tirer = (faces: number): number => {
      const tirage = suivant(alea);
      alea = tirage.etat;
      return tirage.valeur % faces;
    };
    let controlees = 0;
    for (let rang = 0; rang < 1000; rang++) {
      const composition = tirables[tirer(tirables.length)]!;
      const construite = construire(composition.id, tirer(10_000));
      if (construite === null) continue;
      controlees++;
      expect(controlerGrande(construite.entree, construite.station), construite.entree.monde.id).toEqual([]);
    }
    expect(controlees).toBeGreaterThanOrEqual(950);
  }, 300_000);
});
