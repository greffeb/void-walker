import { describe, expect, it } from 'vitest';
import { poserBoucles, type BouclePosee, type PieceBouclable } from './boucles';
import { murCommun, type RectPlan } from './plan';

// Portes de boucle (spec 2026-10-18 §6.4, GE-13) sur un plan de test : deux rangées de quatre pièces, reliées en arbre ; chaque
// paire voisine non reliée est une boucle possible si elle ferme un cycle d'au moins quatre pièces.
//
//   A0 ── A1 ── A2 ── A3
//   │
//   B0 ── B1 ── B2 ── B3

const rect = (x: number, y: number): RectPlan => ({ x, y, largeur: 4, hauteur: 3 });

function pieces(segmentB = 1, bouclables: readonly string[] = ['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B2', 'B3']): PieceBouclable[] {
  return ['A', 'B'].flatMap((rangee, y) =>
    [0, 1, 2, 3].map((x) => {
      const id = `${rangee}${x}`;
      return { id, rect: rect(4 * x, 3 * y), segment: rangee === 'A' ? 1 : segmentB, bouclable: bouclables.includes(id) };
    }),
  );
}

const ARBRE: readonly (readonly [string, string])[] = [
  ['A0', 'A1'],
  ['A1', 'A2'],
  ['A2', 'A3'],
  ['A0', 'B0'],
  ['B0', 'B1'],
  ['B1', 'B2'],
  ['B2', 'B3'],
];

const PORTES = new Map<string, number>();

function boucles(graine: number, options: { segmentB?: number; repaire?: string; voulues?: number; bouclables?: readonly string[]; liaisons?: readonly (readonly [string, string])[] } = {}): readonly BouclePosee[] {
  return poserBoucles(pieces(options.segmentB, options.bouclables), options.liaisons ?? ARBRE, PORTES, options.repaire ?? 'Z', options.voulues ?? 3, graine);
}

/** Plus court chemin, en liaisons, dans le graphe donné. */
function distance(liaisons: readonly (readonly [string, string])[], de: string, vers: string): number {
  const vues = new Map([[de, 0]]);
  const file = [de];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    for (const [a, b] of liaisons) {
      const autre = a === piece ? b : b === piece ? a : null;
      if (autre !== null && !vues.has(autre)) {
        vues.set(autre, (vues.get(piece) ?? 0) + 1);
        file.push(autre);
      }
    }
  }
  return vues.get(vers) ?? Infinity;
}

describe('portes de boucle (spec 2026-10-18 §6.4)', () => {
  it('relie deux pièces voisines par un mur d’au moins deux cases, non reliées, avec la porte sur ce mur', () => {
    const rects = new Map(pieces().map((piece) => [piece.id, piece.rect]));
    for (let graine = 0; graine < 30; graine++) {
      for (const boucle of boucles(graine)) {
        const [a, b] = boucle.entre;
        const mur = murCommun(rects.get(a)!, rects.get(b)!);
        expect(mur).not.toBeNull();
        expect(mur!.fin - mur!.debut).toBeGreaterThanOrEqual(2);
        expect(boucle.rang).toBeGreaterThanOrEqual(mur!.debut);
        expect(boucle.rang).toBeLessThan(mur!.fin);
        expect(ARBRE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))).toBe(false);
      }
    }
  });

  it('ferme toujours un cycle d’au moins quatre pièces', () => {
    for (let graine = 0; graine < 30; graine++) {
      const posees = boucles(graine);
      expect(posees.length).toBeGreaterThan(0);
      for (const boucle of posees) expect(distance(ARBRE, ...boucle.entre)).toBeGreaterThanOrEqual(3);
    }
  });

  it('refuse un triangle : deux voisines reliées à une même troisième', () => {
    // A1 et B1, voisines, sont toutes deux reliées à A0 : une porte entre elles fermerait un triangle.
    const liaisons = [['A0', 'A1'], ['A0', 'B1'], ['A0', 'B0']] as const;
    for (let graine = 0; graine < 20; graine++) {
      for (const boucle of boucles(graine, { liaisons })) expect(distance(liaisons, ...boucle.entre)).toBeGreaterThanOrEqual(3);
    }
  });

  it('relie seulement deux pièces du même segment', () => {
    for (let graine = 0; graine < 30; graine++) {
      for (const boucle of boucles(graine, { segmentB: 2 })) expect(boucle.entre.every((piece) => piece.startsWith('A')) || boucle.entre.every((piece) => piece.startsWith('B'))).toBe(true);
    }
  });

  it('jamais le repaire, jamais une pièce non bouclable', () => {
    for (let graine = 0; graine < 30; graine++) {
      for (const boucle of boucles(graine, { repaire: 'B3', bouclables: ['A0', 'A1', 'A2', 'A3', 'B0', 'B1', 'B3'] })) {
        expect(boucle.entre).not.toContain('B3');
        expect(boucle.entre).not.toContain('B2');
      }
    }
  });

  it('au plus le nombre voulu, aucune si rien ne convient', () => {
    for (let graine = 0; graine < 30; graine++) expect(boucles(graine, { voulues: 1 }).length).toBeLessThanOrEqual(1);
    expect(boucles(1, { bouclables: [] })).toEqual([]);
  });

  it('préfère le segment du repaire', () => {
    const avecRepaire = (graine: number): readonly BouclePosee[] => poserBoucles(pieces(2), ARBRE, PORTES, 'B0', 1, graine);
    // B0 est le repaire, au segment 2 : la seule boucle va dans la rangée B tant qu'une paire y convient.
    for (let graine = 0; graine < 30; graine++) for (const boucle of avecRepaire(graine)) expect(boucle.entre.every((piece) => piece.startsWith('B'))).toBe(true);
  });

  it('jamais plus de six portes à une pièce', () => {
    const pleines = new Map(pieces().map((piece) => [piece.id, 6]));
    expect(poserBoucles(pieces(), ARBRE, pleines, 'Z', 3, 1)).toEqual([]);
  });

  it('identifiants l-boucle-1, l-boucle-2… ; même graine, mêmes boucles', () => {
    expect(boucles(4)).toEqual(boucles(4));
    boucles(4).forEach((boucle, rang) => expect(boucle.id).toBe(`l-boucle-${rang + 1}`));
  });
});
