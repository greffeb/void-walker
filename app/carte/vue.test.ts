import type { CartePublique, PieceCarte, RectPlan, RefPiece } from '../../engine';
import { borner, cadreConnu, centresIcones, CIBLE_MIN_PX, enPixels, etiquettes, glisser, iconesDe, MARGE_VUE_PX, montrer, pincer, vueInitiale, ZOOM_MAX, zoneTouchable, zoomMin } from './vue';

const ref = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });

function piece(nom: string, rect: RectPlan | null, autres: Partial<PieceCarte> = {}): PieceCarte {
  return { piece: ref(nom), statut: 'visitee', rect, regard: 'instant', feu: null, vide: false, creature: null, objets: [], distance: 1, ...autres };
}

const CARTE: CartePublique = {
  pieces: [
    piece('salon', { x: 0, y: 0, largeur: 4, hauteur: 3 }),
    piece('atelier', { x: 4, y: 0, largeur: 4, hauteur: 3 }, { statut: 'actuelle', distance: 0 }),
    piece('embarquement', { x: 6, y: 6, largeur: 4, hauteur: 3 }),
  ],
  passages: [],
  capsules: [{ objet: { sorte: 'objet', id: 'e-capsule', nom: 'capsule' }, piece: ref('embarquement'), pan: { cote: 'bas', debut: 6, fin: 10 } }],
  aBord: null,
};

const ZONE = { largeur: 390, hauteur: 600 };

describe('vue du plan (14 §2.3)', () => {
  it('les trois présences conservent chacune leur centre, sans icône fantôme', () => {
    const drone = { objet: { sorte: 'objet', id: 'e-drone', nom: 'caisse' } as const, position: null, drone: true as const };
    const vue = piece('atelier', { x: 0, y: 0, largeur: 4, hauteur: 3 }, { statut: 'actuelle', creature: 'instant', objets: [drone] });
    const icones = iconesDe(vue);
    expect(icones).toEqual(['joueur', 'creature', 'drone']);
    const centres = centresIcones({ gauche: 0, haut: 0, largeur: 136, hauteur: 102 }, { nom: [], etats: [], anciennete: [], texte: 1 }, icones, 1);
    expect(Object.keys(centres)).toEqual(['joueur', 'creature', 'drone']);
    expect(new Set(Object.values(centres).map((centre) => centre?.x)).size).toBe(3);
    const seul = centresIcones({ gauche: 0, haut: 0, largeur: 136, hauteur: 102 }, { nom: [], etats: [], anciennete: [], texte: 1 }, ['drone'], 1);
    expect(seul).toEqual({ drone: { x: 68, y: 51 } });
  });

  it('cadre de la partie connue, capsule arrimée comprise ; aucun sans plan', () => {
    expect(cadreConnu(CARTE)).toEqual({ x: 0, y: 0, largeur: 10, hauteur: 11 });
    expect(cadreConnu({ ...CARTE, pieces: CARTE.pieces.map((vue) => ({ ...vue, rect: null })), capsules: [] })).toBeNull();
  });

  it('s’ouvre à l’échelle de base, centrée sur la pièce actuelle (D-205)', () => {
    expect(vueInitiale(CARTE, ZONE, 34)).toEqual({ zoom: 1, x: 195 - 6 * 34, y: 300 - 1.5 * 34 });
  });

  it('se pince de la vue de toute la partie connue jusqu’au double de l’échelle de base', () => {
    const min = zoomMin({ x: 0, y: 0, largeur: 20, hauteur: 30 }, ZONE, 34);
    expect(min).toBeCloseTo((390 - 32) / (20 * 34));
    expect(zoomMin({ x: 0, y: 0, largeur: 4, hauteur: 3 }, ZONE, 34)).toBe(1);
    const vue = { zoom: 1, x: 0, y: 0 };
    expect(pincer(vue, 2, { x: 100, y: 50 }, min)).toEqual({ zoom: 2, x: -100, y: -50 });
    expect(pincer(vue, 10, { x: 0, y: 0 }, min).zoom).toBe(ZOOM_MAX);
    expect(pincer(vue, 0.01, { x: 0, y: 0 }, min).zoom).toBeCloseTo(min);
  });

  it('glisser déplace le plan, qui ne quitte jamais tout à fait l’écran', () => {
    const cadre = { x: 0, y: 0, largeur: 10, hauteur: 11 };
    expect(glisser({ zoom: 1, x: 10, y: 10 }, -30, 5)).toEqual({ zoom: 1, x: -20, y: 15 });
    expect(borner({ zoom: 1, x: -1000, y: 0 }, cadre, ZONE, 34)).toEqual({ zoom: 1, x: CIBLE_MIN_PX - 340, y: 0 });
    expect(borner({ zoom: 1, x: 0, y: 0 }, cadre, ZONE, 34)).toEqual({ zoom: 1, x: 0, y: 0 });
  });

  it('une pièce qui prend le focus hors de l’écran y est ramenée, sans bouger si elle est déjà visible (12 §7)', () => {
    const vue = { zoom: 1, x: 0, y: 0 };
    const dehors = { gauche: 500, haut: -80, largeur: 136, hauteur: 102 };
    expect(montrer(vue, dehors, ZONE)).toEqual({ zoom: 1, x: 390 - MARGE_VUE_PX - 636, y: MARGE_VUE_PX + 80 });
    expect(montrer(vue, { gauche: 20, haut: 20, largeur: 136, hauteur: 102 }, ZONE)).toBe(vue);
  });

  it('une pièce se touche sur au moins 44 × 44 px, même réduite (14 §2.9)', () => {
    const boite = enPixels({ x: 1, y: 2, largeur: 2, hauteur: 2 }, { zoom: 0.5, x: 10, y: 20 }, 34);
    expect(boite).toEqual({ gauche: 27, haut: 54, largeur: 34, hauteur: 34 });
    expect(zoneTouchable(boite)).toEqual({ gauche: 22, haut: 49, largeur: 44, hauteur: 44 });
  });

  it('étiquettes : le nom, puis les états entiers, puis l’ancienneté, selon la place au zoom courant (14 §2.4)', () => {
    const energie = piece('energie', { x: 0, y: 0, largeur: 4, hauteur: 3 }, { feu: 'moment' });
    expect(etiquettes(energie, 'local énergie', 'vu il y a un moment', 1)).toEqual({
      nom: ['LOCAL ÉNERGIE'],
      etats: [['feu']],
      anciennete: ['vu il y a un', 'moment'],
      texte: 1,
    });
    // L'icône passe avant l'ancienneté (D-273) : avec la créature, l'ancienneté lui laisserait trop peu de place et s'efface.
    const vueIci = { ...energie, creature: 'moment' } as const;
    expect(etiquettes(vueIci, 'local énergie', 'vu il y a un moment', 1)).toEqual({ nom: ['LOCAL ÉNERGIE'], etats: [['feu', 'creature']], anciennete: [], texte: 1 });
    // Plus haute d'une case, la pièce garde les deux.
    expect(etiquettes({ ...vueIci, rect: { x: 0, y: 0, largeur: 4, hauteur: 4 } }, 'local énergie', 'vu il y a un moment', 1).anciennete).toEqual(['vu il y a un', 'moment']);
    // Très réduit, « ÉNERGIE » ne tient plus, même en petit : plus aucun texte ; motif et icônes restent dessinés.
    expect(etiquettes(energie, 'local énergie', 'vu il y a un moment', 0.4)).toEqual({ nom: [], etats: [], anciennete: [], texte: 0.75 });
    // Deux cases : le nom, une ligne d'état ; « CRÉATURE » est trop large et disparaît, l'œil reste. Pas d'étiquette pour le passager.
    const cabine = piece('cabine', { x: 0, y: 0, largeur: 2, hauteur: 2 }, { statut: 'actuelle', vide: true, creature: 'instant' });
    expect(etiquettes(cabine, 'cabine', null, 1)).toEqual({ nom: ['CABINE'], etats: [['vide']], anciennete: [], texte: 1 });
  });

  it('en dézoomant, le texte rétrécit avec le plan jusqu’aux trois quarts avant qu’un nom ne disparaisse (retour du porteur, 14 §9)', () => {
    const salle = piece('embarquement', { x: 0, y: 0, largeur: 4, hauteur: 3 });
    expect(etiquettes(salle, 'salle d’embarquement', null, 0.9)).toMatchObject({ nom: ['SALLE', 'D’EMBARQUEMENT'], texte: 0.9 });
    expect(etiquettes(salle, 'salle d’embarquement', null, 0.75)).toMatchObject({ nom: ['SALLE', 'D’EMBARQUEMENT'], texte: 0.75 });
    expect(etiquettes(salle, 'salle d’embarquement', null, 0.6)).toMatchObject({ nom: [], texte: 0.75 });
    expect(etiquettes(salle, 'salle d’embarquement', null, 2)).toMatchObject({ texte: 1 });
  });
});
