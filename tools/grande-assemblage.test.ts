import { describe, expect, it } from 'vitest';
import { assemblerStation, prefixer, type DefMonde, type DefStation } from '../engine';
import { MORCEAUX, PIECES_CATALOGUE } from '../content';
import { CATALOGUE } from './catalogue';

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

describe('clés dispersées (spec 2026-10-18 §6.5)', () => {
  const morceauDe = (piece: string): string => piece.slice(0, piece.indexOf('/'));

  it('sur 300 graines de vraies compositions, chaque clé est chez elle ou dans une pièce du catalogue de sa zone permise', () => {
    const compositions = CATALOGUE.grandes.filter((composition) => composition.refus === null);
    const parForme = [compositions.filter((composition) => composition.forme === 'chaine'), compositions.filter((composition) => composition.forme === 'libre')];
    let stations = 0;
    let cles = 0;
    let deplacees = 0;
    for (let graine = 0; graine < 300; graine++) {
      const liste = parForme[graine % 2] ?? [];
      const composition = liste[Math.floor(graine / 2) % liste.length];
      if (composition === undefined) throw new Error('Aucune grande composition.');
      const station = CATALOGUE.definirGrande(composition.id, graine);
      if ('refus' in station) throw new Error(station.refus);
      const resultat = assemblerStation(station);
      if (resultat.type === 'invalide') throw new Error(`${station.id} : ${resultat.erreurs.join(' ')}`);
      if (resultat.type !== 'station') continue;
      stations++;
      const { monde } = resultat;
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      // Pièce du chemin principal d'où pend une annexe, en remontant les couloirs du catalogue.
      const accrocheDe = new Map(monde.liaisons.filter((liaison) => /^l-a\d+-/.test(liaison.id)).map((liaison) => [liaison.entre[1], liaison.entre[0]]));
      const racine = (piece: string): string => {
        let haut = piece;
        for (let suivante = accrocheDe.get(haut); suivante !== undefined; suivante = accrocheDe.get(haut)) haut = suivante;
        return haut;
      };
      const segmentsAvant = (id: string): (number | undefined)[] => (station.morceaux.find((candidat) => candidat.id === id)?.grande?.avant ?? []).map((piece) => parId.get(prefixer(id, piece))?.segment);
      const carrefour = station.morceaux.find((candidat) => candidat.famille === 'carrefour');
      let encombrantes = 0;
      station.morceaux.forEach((leMorceau, rang) => {
        const accroche = station.accroches?.find((candidate) => candidate.vers === leMorceau.id);
        // La zone qui précède : celle du morceau d'où part son entrée ; une branche de l'ordre libre part du couloir commun.
        const parent = accroche?.depuis ?? station.morceaux[rang - 1]?.id ?? leMorceau.id;
        const branche = carrefour !== undefined && accroche?.depuis === carrefour.id && accroche.piece === carrefour.entree;
        const zones = [...segmentsAvant(leMorceau.id), ...segmentsAvant(parent)];
        for (const [id, declaration] of Object.entries(leMorceau.grande?.cles ?? {})) {
          const objet = monde.objets.find((candidat) => candidat.id === prefixer(leMorceau.id, id));
          const origine = leMorceau.objets.find((candidat) => candidat.id === id)?.piece;
          if (objet === undefined || origine === undefined) throw new Error(`${station.id} : clé ${id} absente.`);
          cles++;
          expect(objet.piece, station.id).not.toBe(monde.depart);
          if (objet.piece === prefixer(leMorceau.id, origine)) continue;
          deplacees++;
          if (objet.encombrant === true) encombrantes++;
          // Instance 'a3-consigne' de l'annexe 'a-consigne'.
          const annexe = PIECES_CATALOGUE.find((candidate) => objet.piece.replace(/^a\d+-/, 'a-') === prefixer(candidate.id, 'p-piece'));
          expect(annexe?.annexe?.etiquettes.some((etiquette) => declaration.etiquettes.includes(etiquette)), `${station.id} : ${objet.id} dans ${objet.piece}`).toBe(true);
          expect(zones, `${station.id} : ${objet.id} dans ${objet.piece}`).toContain(parId.get(objet.piece)?.segment);
          if (branche) expect([leMorceau.id, carrefour.id], `${station.id} : ${objet.id} dans ${objet.piece}`).toContain(morceauDe(racine(objet.piece)));
        }
      });
      expect(encombrantes, station.id).toBeLessThanOrEqual(1);
      const caisse = monde.objets.find((objet) => objet.id === 'm-02/o-caisse');
      if (caisse !== undefined) {
        expect([caisse.portable, caisse.encombrant], station.id).toEqual([true, true]);
        expect(caisse.position, station.id).toBe(caisse.piece === 'm-02/p-atelier' ? 'm-02/pos-centre' : undefined);
      }
    }
    expect(deplacees).toBeGreaterThan(0);
    console.log(`clés dispersées : ${deplacees}/${cles} déplacées (${((deplacees / cles) * 100).toFixed(0)} %) sur ${stations} stations`);
  }, 120_000);
});
