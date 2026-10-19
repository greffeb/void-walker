import { describe, expect, it } from 'vitest';
import { poserAnnexes, type AnnexePosee } from './annexes';
import { chevauchent, murCommun, type RectPlan } from './plan';
import type { CategoriePiece, DefAnnexe, DefMorceau } from './station';

// Pose des annexes (spec 2026-10-18 §6.1, §6.2, GE-09 à GE-11) sur un chemin principal de test : trois pièces accueillantes en
// ligne, une de vie, une technique, une de circulation.

function annexe(id: string, largeur: number, hauteur: number, declaration: DefAnnexe): DefMorceau {
  return {
    id,
    famille: 'annexe',
    pieces: [{ id: 'p-piece', nom: `cat_${id}`, plan: { x: 0, y: 0, largeur, hauteur } }],
    liaisons: [],
    objets: [],
    entree: 'p-piece',
    placesCreature: [],
    demande: [],
    fournit: [],
    annexe: declaration,
  };
}

const CATALOGUE: readonly DefMorceau[] = [
  annexe('a-couloir', 8, 2, { categorie: 'circulation', forme: 'couloir', etiquettes: [], porte: 'tiree' }),
  annexe('a-couchettes', 4, 3, { categorie: 'vie', forme: 'impasse', etiquettes: ['couchage'], porte: 'tiree' }),
  annexe('a-sanitaires', 3, 3, { categorie: 'vie', forme: 'impasse', etiquettes: [], porte: 'tiree', surCouloirDe: 'couchage' }),
  annexe('a-cambuse', 3, 3, { categorie: 'vie', forme: 'impasse', etiquettes: [], porte: 'fermee' }),
  annexe('a-refectoire', 6, 3, { categorie: 'vie', forme: 'passage', etiquettes: [], porte: 'ouverte' }),
  annexe('a-outillage', 4, 3, { categorie: 'technique', forme: 'impasse', etiquettes: [], porte: 'tiree' }),
  annexe('a-depot', 4, 3, { categorie: 'technique', forme: 'impasse', etiquettes: [], porte: 'fermee' }),
  annexe('a-laboratoire', 4, 3, { categorie: 'science', forme: 'impasse', etiquettes: [], porte: 'tiree' }),
];

const PRINCIPALES = new Map<string, RectPlan>([
  ['m/p-vie', { x: 0, y: 0, largeur: 4, hauteur: 3 }],
  ['m/p-technique', { x: 4, y: 0, largeur: 4, hauteur: 3 }],
  ['m/p-circulation', { x: 8, y: 0, largeur: 4, hauteur: 3 }],
]);
const PORTES = new Map([['m/p-vie', 1], ['m/p-technique', 2], ['m/p-circulation', 1]]);
const ACCUEILLANTES = new Map<string, CategoriePiece>([['m/p-vie', 'vie'], ['m/p-technique', 'technique'], ['m/p-circulation', 'circulation']]);

function poser(graine: number, nombre = 8, principales = PRINCIPALES, accueillantes = ACCUEILLANTES): readonly AnnexePosee[] | null {
  return poserAnnexes(principales, PORTES, accueillantes, new Set(), CATALOGUE, nombre, graine);
}

function exiger(graine: number): readonly AnnexePosee[] {
  const pose = poser(graine);
  if (pose === null) throw new Error(`Aucune pose pour la graine ${graine}.`);
  return pose;
}

const declaration = (posee: AnnexePosee): DefAnnexe => posee.annexe.annexe!;
const pieceDe = (posee: AnnexePosee): string => `${posee.instance}/p-piece`;

describe('pose des annexes (spec 2026-10-18 §6.2)', () => {
  it('pose exactement le nombre demandé quand la place le permet', () => {
    for (let graine = 0; graine < 50; graine++) expect(poser(graine)?.length ?? 8).toBe(8);
  });

  it('même graine, même pose ; deux graines, deux poses (GE-06)', () => {
    expect(exiger(7)).toEqual(exiger(7));
    expect(JSON.stringify(exiger(7))).not.toBe(JSON.stringify(exiger(8)));
  });

  it('aucune annexe ne chevauche une autre pièce, et chacune touche sa pièce d’accroche par un mur d’au moins deux cases', () => {
    for (let graine = 0; graine < 50; graine++) {
      const pose = poser(graine);
      if (pose === null) continue;
      const rects = new Map<string, RectPlan>([...PRINCIPALES, ...pose.map((posee) => [pieceDe(posee), posee.rect] as const)]);
      const tous = [...rects.values()];
      tous.forEach((a, i) => tous.slice(i + 1).forEach((b) => expect(chevauchent(a, b)).toBe(false)));
      for (const posee of pose) {
        const mur = murCommun(rects.get(posee.accroche)!, posee.rect);
        expect(mur).not.toBeNull();
        expect(mur!.fin - mur!.debut).toBeGreaterThanOrEqual(2);
        expect(posee.rangPorte).toBeGreaterThanOrEqual(mur!.debut);
        expect(posee.rangPorte).toBeLessThan(mur!.fin);
      }
    }
  });

  it('aucune pièce ne dépasse six portes (PL-06)', () => {
    for (let graine = 0; graine < 50; graine++) {
      const portes = new Map(PORTES);
      for (const posee of poser(graine) ?? []) {
        portes.set(posee.accroche, (portes.get(posee.accroche) ?? 0) + 1);
        portes.set(pieceDe(posee), (portes.get(pieceDe(posee)) ?? 0) + 1);
      }
      for (const nombre of portes.values()) expect(nombre).toBeLessThanOrEqual(6);
    }
  });

  it('une impasse ou un passage ne reçoit rien ; un couloir reçoit de deux à quatre pièces (GE-11)', () => {
    for (let graine = 0; graine < 50; graine++) {
      const pose = poser(graine);
      if (pose === null) continue;
      const parPiece = new Map(pose.map((posee) => [pieceDe(posee), posee]));
      for (const posee of pose) {
        const accroche = parPiece.get(posee.accroche);
        if (accroche !== undefined) expect(declaration(accroche).forme).toBe('couloir');
      }
      for (const couloir of pose.filter((posee) => declaration(posee).forme === 'couloir')) {
        const servies = pose.filter((posee) => posee.accroche === pieceDe(couloir)).length;
        expect(servies).toBeGreaterThanOrEqual(2);
        expect(servies).toBeLessThanOrEqual(4);
      }
    }
  });

  it('les sanitaires sont sur un couloir qui dessert des couchettes (GE-10)', () => {
    let vus = 0;
    for (let graine = 0; graine < 80; graine++) {
      const pose = poser(graine) ?? [];
      for (const sanitaires of pose.filter((posee) => posee.annexe.id === 'a-sanitaires')) {
        vus++;
        expect(pose.some((posee) => posee.instance === sanitaires.accroche.split('/')[0] && declaration(posee).forme === 'couloir')).toBe(true);
        expect(pose.some((posee) => posee.accroche === sanitaires.accroche && declaration(posee).etiquettes.includes('couchage'))).toBe(true);
      }
    }
    expect(vus).toBeGreaterThan(0);
  });

  it('une annexe de vie n’est jamais accrochée à une pièce technique (GE-09)', () => {
    for (let graine = 0; graine < 50; graine++) {
      for (const posee of poser(graine) ?? []) if (declaration(posee).categorie === 'vie') expect(posee.accroche).not.toBe('m/p-technique');
    }
  });

  it('au plus deux fois la même annexe, sauf le couloir ; un couloir jusqu’à sept annexes, deux au-delà', () => {
    for (let graine = 0; graine < 50; graine++) {
      for (const [nombre, couloirs] of [[7, 1], [8, 2]] as const) {
        const pose = poser(graine, nombre);
        if (pose === null) continue;
        expect(pose.filter((posee) => declaration(posee).forme === 'couloir')).toHaveLength(couloirs);
        const comptes = new Map<string, number>();
        for (const posee of pose) comptes.set(posee.annexe.id, (comptes.get(posee.annexe.id) ?? 0) + 1);
        for (const [id, compte] of comptes) if (id !== 'a-couloir') expect(compte).toBeLessThanOrEqual(2);
      }
    }
  });

  it('la porte suit la déclaration : ouverte, fermée, ou tirée', () => {
    const pose = Array.from({ length: 50 }, (_, graine) => poser(graine) ?? []).flat();
    for (const posee of pose) {
      if (declaration(posee).porte === 'ouverte') expect(posee.ouverte).toBe(true);
      if (declaration(posee).porte === 'fermee') expect(posee.ouverte).toBe(false);
    }
    const tirees = pose.filter((posee) => declaration(posee).porte === 'tiree');
    expect(tirees.some((posee) => posee.ouverte)).toBe(true);
    expect(tirees.some((posee) => !posee.ouverte)).toBe(true);
  });

  it('null quand moins de six annexes tiennent', () => {
    // Une seule pièce accueillante, cernée de toutes parts : aucune annexe ne peut s'y accrocher.
    const cernee = new Map<string, RectPlan>([['m/p-centre', { x: 4, y: 3, largeur: 4, hauteur: 3 }]]);
    for (const [x, y] of [[0, 0], [4, 0], [8, 0], [0, 3], [8, 3], [0, 6], [4, 6], [8, 6]] as const) cernee.set(`m/p-${x}-${y}`, { x, y, largeur: 4, hauteur: 3 });
    expect(poser(1, 8, cernee, new Map([['m/p-centre', 'circulation']]))).toBeNull();
  });

});
