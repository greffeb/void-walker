import { describe, expect, it } from 'vitest';
import type { DefLiaison, DefObjet, DefPiece } from './monde';
import { ouvrirTerritoire, type PlanTerritoire } from './territoire';

// Territoire de départ des grandes stations (spec créature mobile §territoire) : des portes ouvertes autour du repaire.

// Monde en ligne : p0 (départ) — p1 — p2 — p3 (repaire) — p4 — p5 (en feu).
const porte = (a: number, b: number, champs: Partial<DefLiaison> = {}): DefLiaison => ({ id: `l${a}${b}`, nom: 'porte', entre: [`p${a}`, `p${b}`], ouverte: false, ...champs });
const plan = (champs: { pieces?: DefPiece[]; liaisons?: DefLiaison[]; objets?: DefObjet[] } = {}): PlanTerritoire => ({
  pieces: champs.pieces ?? [0, 1, 2, 3, 4, 5].map((rang): DefPiece => ({ id: `p${rang}`, nom: `p${rang}`, ...(rang === 5 ? { feu: true } : {}) })),
  objets: champs.objets ?? [],
  liaisons: champs.liaisons ?? [porte(0, 1), porte(1, 2), porte(2, 3), porte(3, 4), porte(4, 5)],
  depart: 'p0',
  creature: 'p3',
  segments: new Map([0, 1, 2, 3, 4, 5].map((rang) => [`p${rang}`, rang === 0 ? 0 : 1])),
});
const ouvertes = (liaisons: readonly DefLiaison[]): string[] => liaisons.filter((liaison) => liaison.ouverte).map((liaison) => liaison.id);

describe('ouvrirTerritoire (spec créature mobile §territoire)', () => {
  it('étendue 0 : rien ne change', () => {
    const depart = plan();
    expect(ouvrirTerritoire(depart, 0, 7)).toEqual(depart.liaisons);
  });

  it('étendue 1 : toutes les portes éligibles s’ouvrent, jamais vers le départ ni vers une pièce en feu', () => {
    const rendues = ouvrirTerritoire(plan(), 1, 7);
    expect(ouvertes(rendues).sort()).toEqual(['l12', 'l23', 'l34']);
    // Ouverte, pas enfoncée : la porte se referme encore.
    expect(rendues.find((liaison) => liaison.id === 'l23')).toEqual(porte(2, 3, { ouverte: true }));
  });

  it('même graine : mêmes portes', () => {
    expect(ouvertes(ouvrirTerritoire(plan(), 0.5, 42))).toEqual(ouvertes(ouvrirTerritoire(plan(), 0.5, 42)));
    expect(ouvertes(ouvrirTerritoire(plan(), 0.5, 42))).toHaveLength(2);
  });

  it('aucune porte éligible au bord : on s’arrête sans erreur', () => {
    const depart = plan({ liaisons: [porte(0, 1), porte(1, 2), porte(2, 3, { blindee: true }), porte(3, 4, { etroite: true }), porte(4, 5)] });
    expect(ouvrirTerritoire(depart, 1, 7)).toEqual(depart.liaisons);
  });

  it('une porte ouverte, étroite ou gouffre exceptée, étend déjà le territoire', () => {
    const rendues = ouvrirTerritoire(plan({ liaisons: [porte(0, 1), porte(1, 2), porte(2, 3, { ouverte: true }), porte(3, 4), porte(4, 5)] }), 0.5, 7);
    expect(ouvertes(rendues).sort()).toEqual(['l12', 'l23']);
  });

  it('une porte intérieure d’un morceau reste fermée ; une porte de boucle entre deux de ses pièces s’ouvre (D-293)', () => {
    const pieces = ['p0', 'm-11/p-vestiaire', 'm-11/p-remise', 'm-11/p-poste'].map((id): DefPiece => ({ id, nom: id }));
    const base: PlanTerritoire = {
      pieces,
      objets: [],
      liaisons: [
        { id: 'm-11/l-vestiaire-remise', nom: 'porte', entre: ['m-11/p-vestiaire', 'm-11/p-remise'], ouverte: false },
        { id: 'l-boucle-1', nom: 'porte', entre: ['m-11/p-remise', 'm-11/p-poste'], ouverte: false },
      ],
      depart: 'p0',
      creature: 'm-11/p-remise',
      segments: new Map(pieces.map((piece) => [piece.id, 1])),
    };
    expect(ouvertes(ouvrirTerritoire(base, 1, 7))).toEqual(['l-boucle-1']);
  });

  it('inéligibles : marques de la porte, obstacle, écoutille, pièces sensibles', () => {
    const pieces = (champs: Partial<DefPiece>): DefPiece[] => [0, 1, 2, 3, 4, 5].map((rang): DefPiece => ({ id: `p${rang}`, nom: `p${rang}`, ...(rang === 4 ? champs : {}) }));
    const cas: { liaison?: Partial<DefLiaison>; piece?: Partial<DefPiece>; objet?: Omit<DefObjet, 'id' | 'nom'>; segment0?: true }[] = [
      { liaison: { etroite: true } },
      { liaison: { gouffre: true } },
      { liaison: { blindee: true } },
      { liaison: { verrouillee: true } },
      { liaison: { nonEtanche: true } },
      { liaison: { manoeuvre: 'o-levier' } },
      { liaison: { cachee: 'o-panneau' } },
      { liaison: { haute: 'o-caisse' } },
      { objet: { piece: 'p3', obstacle: { passage: 'l34', rangement: 'p3', maintien: 'p3' } } },
      { objet: { piece: 'p3', capsule: { interieur: 'p4' } } },
      { objet: { piece: 'p4', vitrageExterieur: true } },
      { piece: { feu: true } },
      { piece: { froide: true } },
      { piece: { machines: true } },
      { piece: { gravite: 'coupee' } },
      { segment0: true },
    ];
    for (const { liaison, piece, objet, segment0 } of cas) {
      const base = plan({ pieces: pieces(piece ?? {}), liaisons: [porte(3, 4, liaison)], objets: objet === undefined ? [] : [{ id: 'o-x', nom: 'x', ...objet }] });
      const depart = segment0 === true ? { ...base, segments: new Map([...base.segments, ['p4', 0]]) } : base;
      expect(ouvertes(ouvrirTerritoire(depart, 1, 7)), JSON.stringify(liaison ?? piece ?? objet ?? 'segment 0')).toEqual([]);
    }
  });
});
