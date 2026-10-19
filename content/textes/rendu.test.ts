import type { Consultation } from '../../engine';
import { reunir } from './couches';
import { rendreConsultation } from './rendu';

// Une pièce marquée par la piste de la créature (spec 2026-10-18 §5.4) : sa description, puis une phrase de trace de la couche
// menace, la même pendant toute la partie.

const DESCRIPTION = 'Une salle nue. Rien de plus.';
const TEXTES = reunir([{ noms: { salle: { texte: 'salle', genre: 'f', nombre: 's', elision: false } }, descriptions: { salle: [DESCRIPTION] }, assistance: {} }]);
const regard = (trace?: 'legere' | 'forte'): Consultation => ({ type: 'regarder_piece', cible: { sorte: 'piece', id: 'e00000001', nom: 'salle' }, ...(trace === undefined ? {} : { trace }) });

describe('trace d’une pièce (spec 2026-10-18 §5.4)', () => {
  it.each(['legere', 'forte'] as const)('trace %s : la description, puis une phrase de trace de cette intensité', (intensite) => {
    const texte = rendreConsultation(TEXTES, regard(intensite), { graine: 3, action: 0 });
    expect(texte.startsWith(`${DESCRIPTION} `)).toBe(true);
    expect(TEXTES.traces[intensite]).toContain(texte.slice(DESCRIPTION.length + 1));
  });

  it('une pièce sans trace garde sa description seule', () => {
    expect(rendreConsultation(TEXTES, regard(), { graine: 3, action: 0 })).toBe(DESCRIPTION);
  });

  it('même partie, même phrase ; une autre partie peut en tirer une autre', () => {
    const premiere = rendreConsultation(TEXTES, regard('forte'), { graine: 3, action: 0 });
    expect(rendreConsultation(TEXTES, regard('forte'), { graine: 3, action: 9 })).toBe(premiere);
    const autres = new Set(Array.from({ length: 30 }, (_, graine) => rendreConsultation(TEXTES, regard('forte'), { graine, action: 0 })));
    expect(autres.size).toBeGreaterThan(1);
  });

  it('chaque phrase de trace est une phrase entière, sans chiffre ni trou', () => {
    for (const phrase of [...TEXTES.traces.legere, ...TEXTES.traces.forte]) {
      expect(phrase).toMatch(/^[A-ZÀ-Ý].*\.$/u);
      expect(phrase).not.toMatch(/[0-9{}]/);
      expect(phrase.split(/[.!?…]+(?:\s|$)/).filter((morceau) => morceau.trim() !== '')).toHaveLength(1);
    }
  });
});
