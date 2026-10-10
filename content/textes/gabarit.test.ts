import { analyserGabarit, choisirVariante, ErreurTexte, former, remplir } from './gabarit';
import type { Nom } from './types';

const PORTE: Nom = { texte: 'porte', genre: 'f', nombre: 's', elision: false };
const ATELIER: Nom = { texte: 'atelier', genre: 'm', nombre: 's', elision: true };
const CARNET: Nom = { texte: 'carnet', genre: 'm', nombre: 's', elision: false };
const OUTILS: Nom = { texte: 'outils', genre: 'm', nombre: 'p', elision: false };

describe('formes des noms (C-07 NP-02)', () => {
  it('accorde articles, contractions et élision', () => {
    expect([PORTE, ATELIER, CARNET, OUTILS].map((nom) => former('le', nom))).toEqual(['la porte', 'l’atelier', 'le carnet', 'les outils']);
    expect([PORTE, ATELIER, CARNET, OUTILS].map((nom) => former('de', nom))).toEqual(['de la porte', 'de l’atelier', 'du carnet', 'des outils']);
    expect([PORTE, ATELIER, CARNET, OUTILS].map((nom) => former('a', nom))).toEqual(['à la porte', 'à l’atelier', 'au carnet', 'aux outils']);
    expect([PORTE, ATELIER, CARNET, OUTILS].map((nom) => former('un', nom))).toEqual(['une porte', 'un atelier', 'un carnet', 'des outils']);
    expect([PORTE, CARNET, OUTILS].map((nom) => `ouvert${former('e', nom)}`)).toEqual(['ouverte', 'ouvert', 'ouverts']);
  });

  it('met la majuscule demandée', () => {
    expect(former('Le', ATELIER)).toBe('L’atelier');
    expect(former('A', PORTE)).toBe('À la porte');
    expect(former('Nom', ATELIER)).toBe('Atelier');
  });
});

describe('gabarits', () => {
  it('remplit les rôles, y compris une liste', () => {
    expect(remplir('{Le:objet} est dans {le:piece}.', { objet: CARNET, piece: ATELIER })).toBe('Le carnet est dans l’atelier.');
    expect(remplir('Vous voyez {un:liste}.', { liste: [CARNET, PORTE, OUTILS] })).toBe('Vous voyez un carnet, une porte et des outils.');
    expect(remplir('{Un:liste}.', { liste: [CARNET] })).toBe('Un carnet.');
  });

  it('refuse un rôle sans valeur, une forme inconnue ou une accolade isolée, sans rien afficher', () => {
    expect(() => remplir('Vous prenez {le:objet}.', {})).toThrow(ErreurTexte);
    expect(() => remplir('Vous prenez {du:objet}.', { objet: CARNET })).toThrow(/Forme inconnue/);
    expect(() => remplir('Vous prenez {objet}.', { objet: CARNET })).toThrow(/Accolade/);
  });

  it('analyse statiquement les gabarits (C-07 N-03)', () => {
    expect(analyserGabarit('Vous prenez {le:objet}.', ['objet'])).toEqual([]);
    expect(analyserGabarit('Vous prenez {le:clef}.', ['objet'])).toEqual(['rôle inconnu « clef »']);
    expect(analyserGabarit('Vous prenez {la:objet}.', ['objet'])).toEqual(['forme inconnue « la »']);
    expect(analyserGabarit('Vous prenez {objet}.', ['objet'])).toEqual(['accolade isolée']);
    expect(analyserGabarit('  ', [])).toEqual(['texte vide']);
  });
});

describe('variantes (C-07 NP-03)', () => {
  it('même clé, même variante ; toutes les variantes atteignables', () => {
    const variantes = ['a', 'b', 'c'] as const;
    expect(choisirVariante(variantes, '1:2:0:objet_pris')).toBe(choisirVariante(variantes, '1:2:0:objet_pris'));
    const vues = new Set(Array.from({ length: 60 }, (_, index) => choisirVariante(variantes, `cle-${index}`)));
    expect(vues).toEqual(new Set(variantes));
  });
});
