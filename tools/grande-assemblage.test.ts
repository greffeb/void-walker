import { describe, expect, it } from 'vitest';
import { assemblerStation, prefixer, type DefMonde, type DefStation } from '../engine';
import { MORCEAUX, PIECES_CATALOGUE } from '../content';

// Assemblage d'une grande station (spec 2026-10-18 §6.2) avec les vrais morceaux et le vrai catalogue : vestibule, M-01, M-08,
// M-07, M-03, créature dans la réserve du final. Les morceaux pèsent 16 pièces dessinées : 8 annexes, 24 pièces en tout.

const morceau = (id: string) => {
  const entree = MORCEAUX[id];
  if (entree === undefined) throw new Error(`Morceau ${id} absent.`);
  return entree.morceau;
};

const MORCEAUX_STATION = ['vestibule', 'm-01', 'm-08', 'm-07', 'm-03'].map(morceau);

function station(graine: number): DefStation {
  return {
    id: `g1-test-${graine}`,
    morceaux: MORCEAUX_STATION,
    creature: 'm-03/p-reserve',
    graine,
    grande: { version: 1, catalogue: PIECES_CATALOGUE, annexes: 8, boucles: 3 },
  };
}

function mondes(nombre: number): DefMonde[] {
  return Array.from({ length: nombre }, (_, graine) => assemblerStation(station(graine))).flatMap((resultat) => (resultat.type === 'station' ? [resultat.monde] : []));
}

const MONDES = mondes(40);
const dessinees = (monde: DefMonde): number => monde.pieces.filter((piece) => piece.plan !== undefined).length;
const accueillantes = new Set(MORCEAUX_STATION.flatMap((leMorceau) => Object.keys(leMorceau.grande?.accueillantes ?? {}).map((piece) => prefixer(leMorceau.id, piece))));

describe('assemblage d’une grande station (spec 2026-10-18 §6.2)', () => {
  it('la plupart des graines donnent une station, chacune de 21 à 28 pièces dessinées', () => {
    expect(MONDES.length).toBeGreaterThanOrEqual(36);
    for (const monde of MONDES) {
      expect(dessinees(monde)).toBeGreaterThanOrEqual(21);
      expect(dessinees(monde)).toBeLessThanOrEqual(28);
    }
  });

  it('même identifiant et même graine, même monde (GE-06 étendue)', () => {
    expect(JSON.stringify(assemblerStation(station(3)))).toBe(JSON.stringify(assemblerStation(station(3))));
  });

  it('chaque annexe s’accroche à une pièce accueillante ou à un couloir du catalogue', () => {
    for (const monde of MONDES) {
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      for (const liaison of monde.liaisons.filter((candidate) => /^l-a\d+-/.test(candidate.id))) {
        const [accroche, annexe] = liaison.entre;
        expect(parId.get(annexe)?.forme).toBeDefined();
        expect(accueillantes.has(accroche) || parId.get(accroche)?.forme === 'couloir').toBe(true);
      }
    }
  });

  it('chaque pièce dessinée a un segment ; une annexe a celui de sa pièce d’accroche', () => {
    for (const monde of MONDES) {
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      for (const piece of monde.pieces.filter((candidate) => candidate.plan !== undefined)) expect(piece.segment).toBeTypeOf('number');
      for (const liaison of monde.liaisons.filter((candidate) => /^l-a\d+-/.test(candidate.id))) {
        const [accroche, annexe] = liaison.entre;
        expect(parId.get(annexe)?.segment).toBe(parId.get(accroche)?.segment);
      }
    }
  });

  it('les portes de boucle sont listées, fermées au départ, et relient deux pièces du même segment', () => {
    let boucles = 0;
    for (const monde of MONDES) {
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      for (const id of monde.boucles ?? []) {
        boucles++;
        const liaison = monde.liaisons.find((candidate) => candidate.id === id);
        expect(liaison?.ouverte).toBe(false);
        const [a, b] = liaison!.entre;
        expect(parId.get(a)?.segment).toBe(parId.get(b)?.segment);
      }
    }
    expect(boucles).toBeGreaterThan(0);
  });

  it('la piste marque le repaire, jamais le départ ; les bruits de station sont activés', () => {
    for (const monde of MONDES) {
      expect(monde.bruitsStation).toBe(true);
      expect(monde.pieces.find((piece) => piece.id === 'm-03/p-reserve')?.trace).toBe('forte');
      expect(monde.pieces.find((piece) => piece.id === monde.depart)?.trace).toBeUndefined();
    }
  });

  it('sans déclaration de grande station, le monde ne porte aucun des nouveaux champs', () => {
    const resultat = assemblerStation({ ...station(3), grande: undefined });
    expect(resultat.type).toBe('station');
    const texte = JSON.stringify(resultat);
    for (const champ of ['segment', 'trace', 'categorie', 'forme', 'boucles', 'bruitsStation', 'accueillantes']) expect(texte).not.toContain(`"${champ}"`);
  });
});

describe('segments : zones entre deux coupes (spec 2026-10-18 §6.3, GE-13)', () => {
  const segment = (monde: DefMonde, piece: string): number | undefined => monde.pieces.find((candidate) => candidate.id === piece)?.segment;

  it('une coupe sépare deux segments ; une porte ordinaire entre deux morceaux, non', () => {
    for (const monde of MONDES) {
      expect(segment(monde, 'm-01/p-poste')).not.toBe(segment(monde, 'm-01/p-palier'));
      expect(segment(monde, 'm-08/p-ouest')).not.toBe(segment(monde, 'm-08/p-est'));
      // Le palier de M-01 et les quartiers de M-08 ne sont séparés que par une porte ordinaire : même côté des obstacles.
      expect(segment(monde, 'm-01/p-palier')).toBe(segment(monde, 'm-08/p-quartiers'));
      expect(segment(monde, 'vestibule/p-vestibule')).toBe(segment(monde, 'm-01/p-poste'));
    }
  });

  it('plus on franchit de coupes, plus le segment est grand', () => {
    for (const monde of MONDES) {
      const ordre = ['vestibule/p-vestibule', 'm-01/p-palier', 'm-08/p-est', 'm-07/p-coursive', 'm-03/p-embarquement'].map((piece) => segment(monde, piece) ?? -1);
      expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
      expect(new Set(ordre).size).toBe(ordre.length);
    }
  });
});
