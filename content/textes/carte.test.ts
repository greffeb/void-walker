import type { CartePublique, RefPiece } from '../../engine';
import { TEXTES_AR01 } from '../ar-01/textes';
import { lignesListeCarte, rendreListeCarte } from './carte';

// Vue LISTE (14 §2.8) sur une carte écrite à la main avec les noms d'AR-01 : le contenu n'importe que les types du moteur.

const piece = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });
const SALON = piece('salon');
const ATELIER = piece('atelier');
const GALERIE = piece('galerie');
const ENERGIE = piece('energie');
const EMBARQUEMENT = piece('embarquement');

const CARTE: CartePublique = {
  pieces: [
    { piece: SALON, statut: 'visitee', rect: null, regard: 'longtemps', feu: null, vide: false, creature: null, objets: [], distance: 1 },
    {
      piece: ATELIER,
      statut: 'actuelle',
      rect: null,
      regard: 'instant',
      feu: null,
      vide: false,
      creature: null,
      objets: [
        { objet: { sorte: 'objet', id: 'e-caisse', nom: 'caisse' }, position: { sorte: 'position', id: 'e-sous-grille', nom: 'sous_grille' } },
        { objet: { sorte: 'objet', id: 'e-burette', nom: 'burette' }, position: null },
      ],
      distance: 0,
    },
    { piece: GALERIE, statut: 'connue', rect: null, regard: null, feu: 'moment', vide: false, creature: null, objets: [], distance: 2 },
    { piece: ENERGIE, statut: 'visitee', rect: null, regard: 'instant', feu: null, vide: false, creature: 'moment', objets: [], distance: 2 },
    { piece: EMBARQUEMENT, statut: 'visitee', rect: null, regard: 'moment', feu: null, vide: true, creature: null, objets: [], distance: 1 },
  ],
  passages: [
    { id: 'e-p1', nom: 'porte', vuDepuis: [SALON, ATELIER], entre: [SALON, ATELIER], ouvert: true, dessin: 'porte', voyant: 'air', emplacement: null },
    { id: 'e-p2', nom: 'grille', vuDepuis: [ATELIER, ENERGIE], entre: null, ouvert: false, dessin: 'tirets', voyant: null, emplacement: null },
    { id: 'e-p3', nom: 'cloison', vuDepuis: [SALON], entre: [SALON, GALERIE], ouvert: false, dessin: 'porte', voyant: null, emplacement: null },
  ],
  capsules: [],
};

describe('vue LISTE de la carte (14 §2.8, D-212)', () => {
  it('ICI, puis les visitées de la plus proche, puis les connues ; positions en mots ici seulement ; aucun chiffre', () => {
    const lignes = lignesListeCarte(rendreListeCarte(TEXTES_AR01, CARTE));
    expect(lignes).toEqual([
      '── ICI ──',
      'ATELIER MAINTENANCE : @ vous',
      'porte du salon de transit : ouvert · AIR',
      'grille : destination ? · fermé',
      'Caisse : sous la grille',
      '── VISITÉES, DE LA PLUS PROCHE ──',
      'SALLE D’EMBARQUEMENT : vu il y a un moment · VIDE ○',
      'SALON DE TRANSIT : vu il y a longtemps',
      'LOCAL ÉNERGIE : vu à l’instant · CRÉATURE, vue il y a un moment · grille : destination ?',
      '── CONNUES, PAS ENCORE VISITÉES ──',
      'LOCAL TECHNIQUE : par sa porte · FEU, vu il y a un moment',
    ]);
    expect(lignes.join(' ')).not.toMatch(/\d/);
  });

  it('un bloc vide le dit', () => {
    expect(lignesListeCarte(rendreListeCarte(TEXTES_AR01, { pieces: [], passages: [], capsules: [] }))).toEqual([
      '── ICI ──',
      'aucune',
      '── VISITÉES, DE LA PLUS PROCHE ──',
      'aucune',
      '── CONNUES, PAS ENCORE VISITÉES ──',
      'aucune',
    ]);
  });
});
