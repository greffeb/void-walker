import { describe, expect, it } from 'vitest';
import type { Catalogue } from '../content';
import { CATALOGUE } from './catalogue';
import { ecartsDesGrandes, lireTemoins, publierGrandes, temoinValable, verifierGrande, verifierPubliee, verifierPublieesDuLot } from './verifier-grandes';
import { rangsDesSegments } from './verifier-station';

// Preuve des grandes stations (spec 2026-10-18 §7, D-302) : contrôles, puis témoin du chemin principal rejoué dans la grande
// station, ou recherche directe ; en ordre libre, les deux ordres.

const CHAINE = 'g1-m01-m02-m09-m06-cale';
const LIBRE = 'g1-ol-m01-m02-m09-m06-cale';

describe('preuve des grandes stations (spec 2026-10-18 §7.4)', () => {
  it('rangsDesSegments suit le segment des pièces d’une grande station', () => {
    const entree = CATALOGUE.construireGrande(CHAINE, 0);
    if ('refus' in entree) throw new Error(entree.refus);
    const rang = rangsDesSegments(entree.monde);
    for (const piece of entree.monde.pieces) expect(rang(piece.id)).toBe(piece.segment);
  });

  it('une grande station en chaîne est prouvée', () => {
    const ligne = verifierGrande(CATALOGUE, `${CHAINE}-0`);
    expect(ligne.verdict, JSON.stringify(ligne)).toBe('prouvee');
    expect(ligne.actions).toBeGreaterThan(0);
  });

  it('une grande station en ordre libre est prouvée dans les deux ordres', () => {
    const ligne = verifierGrande(CATALOGUE, `${LIBRE}-0`);
    expect(ligne.ordres).toEqual(['prouvee', 'prouvee']);
    expect(ligne.verdict).toBe('prouvee');
  }, 120_000);

  it('une station qui échoue un contrôle est écartée, sans recherche', () => {
    const fautif: Catalogue = {
      ...CATALOGUE,
      construireGrande: (composition, graine) => {
        const entree = CATALOGUE.construireGrande(composition, graine);
        if ('refus' in entree) return entree;
        return { ...entree, monde: { ...entree.monde, pieces: entree.monde.pieces.map((piece) => (piece.id === entree.monde.depart ? { ...piece, trace: 'forte' as const } : piece)) } };
      },
    };
    const ligne = verifierGrande(fautif, `${CHAINE}-0`);
    expect(ligne.verdict).toBe('ecartee');
    expect(ligne.etats).toBe(0);
  });

  it('un témoin interrompu n’est pas une preuve', () => {
    const entree = CATALOGUE.construireGrande(CHAINE, 0);
    if ('refus' in entree) throw new Error(entree.refus);
    expect(temoinValable(entree, [])).toBe(false);
  });

  it('publierGrandes ne garde que des stations prouvées, triées, sans doublon', () => {
    const trois: Catalogue = { ...CATALOGUE, grandes: CATALOGUE.grandes.filter((composition) => [CHAINE, 'g1-m02-m01-m09-m06-cale', 'g1-m01-m09-m04-m03-observation'].includes(composition.id)) };
    const { publiees, temoins } = publierGrandes(trois, 1, 4);
    expect(publiees.length).toBeGreaterThanOrEqual(2);
    expect(new Set(publiees).size).toBe(publiees.length);
    expect(publiees).toEqual([...publiees].sort());
    for (const id of publiees) expect(verifierPubliee(trois, id, temoins[id]).verdict).toBe('prouvee');
  }, 120_000);

  it('une station publiée se vérifie par le rejeu de ses témoins ; un témoin tronqué ne prouve rien', () => {
    const ligne = verifierGrande(CATALOGUE, `${CHAINE}-0`);
    const temoins = ligne.temoins ?? [];
    expect(verifierPubliee(CATALOGUE, `${CHAINE}-0`, temoins).verdict).toBe('prouvee');
    expect(verifierPubliee(CATALOGUE, `${CHAINE}-0`, temoins.map((pas) => pas.slice(0, -1))).verdict).toBe('non_prouvee');
    expect(verifierPubliee(CATALOGUE, `${CHAINE}-0`, undefined).verdict).toBe('non_prouvee');
  });

  it('ordre libre : deux témoins du même ordre ne suffisent pas (G-07)', () => {
    const ligne = verifierGrande(CATALOGUE, `${LIBRE}-0`);
    const [premier, second] = ligne.temoins ?? [];
    expect(verifierPubliee(CATALOGUE, `${LIBRE}-0`, [premier!, second!]).verdict).toBe('prouvee');
    expect(verifierPubliee(CATALOGUE, `${LIBRE}-0`, [premier!, premier!]).verdict).toBe('non_prouvee');
  }, 120_000);
});

describe('liste publiée des grandes stations (spec 2026-10-18 §7.2, D-270)', () => {
  it('au moins 500 stations, environ un tiers en ordre libre, chacune avec ses témoins ; un dixième prouvé par leur rejeu (check:stations les rejoue toutes)', () => {
    const temoins = lireTemoins();
    const { publiees } = CATALOGUE;
    expect(publiees.length).toBeGreaterThanOrEqual(500);
    const libres = publiees.filter((id) => id.startsWith('g1-ol-')).length / publiees.length;
    expect(libres).toBeGreaterThan(0.25);
    expect(libres).toBeLessThan(0.4);
    expect(Object.keys(temoins).sort()).toEqual([...publiees]);
    const lignes = verifierPublieesDuLot({ numero: 1, total: 10 });
    expect(ecartsDesGrandes(lignes)).toEqual([]);
  }, 600_000);
});
