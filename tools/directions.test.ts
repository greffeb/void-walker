import { describe, expect, it } from 'vitest';
import { CATALOGUE } from './catalogue';

// Noms qui disent une direction (#296) : le sas de l'ouest est à gauche de celui de l'est, la galerie nord au-dessus de la
// galerie sud, quel que soit le retournement de la tuile.
const NORD = ['ouest', 'est_nord'];
const SUD = ['est', 'ouest_sud'];

describe('directions des noms sur la carte (#296)', () => {
  it('dans chaque grande station publiée avec M-08 ou M-09, l’ouest est à gauche et le nord en haut', () => {
    let vues = 0;
    for (const id of CATALOGUE.publiees.filter((station) => /-m0[89]-/.test(station)).filter((_, rang) => rang % 5 === 0)) {
      const entree = CATALOGUE.resoudre(id);
      if (!('monde' in entree)) throw new Error(`${id} : ${entree.refus}`);
      const plan = (noms: readonly string[]) => entree.monde.pieces.find((piece) => noms.includes(piece.nom))?.plan;
      const [ouest, est, nord, sud] = [plan(['sas_ouest']), plan(['sas_est']), plan(NORD), plan(SUD)];
      if (ouest !== undefined && est !== undefined) expect(ouest.x, id).toBeLessThan(est.x);
      if (nord !== undefined && sud !== undefined) expect(nord.y, id).toBeLessThan(sud.y);
      vues++;
    }
    expect(vues).toBeGreaterThan(0);
  }, 60000);
});
