import type { CartePublique, PieceCarte, RectPlan, RefPiece } from '../../engine';
import { borner, cadreConnu, CIBLE_MIN_PX, enPixels, etiquettes, glisser, pincer, vueInitiale, ZOOM_MAX, zoneTouchable, zoomMin } from './vue';

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

  it('une pièce se touche sur au moins 44 × 44 px, même réduite (14 §2.9)', () => {
    const boite = enPixels({ x: 1, y: 2, largeur: 2, hauteur: 2 }, { zoom: 0.5, x: 10, y: 20 }, 34);
    expect(boite).toEqual({ gauche: 27, haut: 54, largeur: 34, hauteur: 34 });
    expect(zoneTouchable(boite)).toEqual({ gauche: 22, haut: 49, largeur: 44, hauteur: 44 });
  });

  it('étiquettes : le nom, puis les états entiers, puis l’ancienneté, selon la place au zoom courant (14 §2.4)', () => {
    const energie = piece('energie', { x: 0, y: 0, largeur: 4, hauteur: 3 }, { feu: 'moment', creature: 'moment' });
    expect(etiquettes(energie, 'local énergie', 'vu il y a un moment', 1)).toEqual({
      nom: ['LOCAL ÉNERGIE'],
      etats: [['feu', 'creature']],
      anciennete: ['vu il y a un', 'moment'],
    });
    // À mi-échelle, « ÉNERGIE » ne tient plus : plus aucun texte ; motif et losange restent dessinés.
    expect(etiquettes(energie, 'local énergie', 'vu il y a un moment', 0.5)).toEqual({ nom: [], etats: [], anciennete: [] });
    // Deux cases : le nom, deux lignes d'état ; « CRÉATURE » est trop large et disparaît.
    const cabine = piece('cabine', { x: 0, y: 0, largeur: 2, hauteur: 2 }, { statut: 'actuelle', vide: true, creature: 'instant' });
    expect(etiquettes(cabine, 'cabine', null, 1)).toEqual({ nom: ['CABINE'], etats: [['vous'], ['vide']], anciennete: [] });
  });
});
