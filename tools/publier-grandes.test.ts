import { describe, expect, it } from 'vitest';
import { VERSION_GENERATEUR } from '../content';
import { verifierDiversite } from './publier-grandes';

describe('protection des variantes publiées', () => {
  it('refuse une composition perdue même si une autre gagne des stations', () => {
    expect(() => verifierDiversite(['g3-a-0', 'g3-b-0'], ['g4-a-0', 'g4-a-1'], 2)).toThrow(`g${VERSION_GENERATEUR}-b`);
  });

  it('refuse la perte d’une variante après un changement de version, pas la réduction demandée explicitement', () => {
    const avant = ['g3-a-0', 'g3-a-1'];
    expect(() => verifierDiversite(avant, ['g4-a-7'], 2)).toThrow(`g${VERSION_GENERATEUR}-a`);
    verifierDiversite(avant, ['g4-a-7'], 1);
    verifierDiversite(avant, ['g4-a-7', 'g4-a-8'], 2);
  });

  it('un doublon ne remplace pas une variante distincte', () => {
    expect(() => verifierDiversite(['g3-a-0', 'g3-a-1'], ['g4-a-7', 'g4-a-7'], 2)).toThrow(`g${VERSION_GENERATEUR}-a`);
  });
});
