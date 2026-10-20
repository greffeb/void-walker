import type { Consultation, Evenement } from '../../engine';
import { MONDES } from '../index';
import { fuitesDuCatalogue, reunir } from './couches';
import { rendreConsultation, rendreEvenements } from './rendu';

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

// Une pièce pillée (spec 2026-10-18 §6.6) : sa description, sa trace s'il y en a une, puis une phrase de pillage de la couche
// univers, la même pendant toute la partie.

const regardPillee = (trace?: 'legere' | 'forte'): Consultation => ({ type: 'regarder_piece', cible: { sorte: 'piece', id: 'e00000001', nom: 'salle' }, pillee: true, ...(trace === undefined ? {} : { trace }) });

describe('pièce pillée (spec 2026-10-18 §6.6)', () => {
  it('sans trace : la description, puis une phrase de pillage', () => {
    const texte = rendreConsultation(TEXTES, regardPillee(), { graine: 3, action: 0 });
    expect(texte.startsWith(`${DESCRIPTION} `)).toBe(true);
    expect(TEXTES.pillages).toContain(texte.slice(DESCRIPTION.length + 1));
  });

  it.each(['legere', 'forte'] as const)('trace %s : la description, la trace, puis le pillage', (intensite) => {
    const texte = rendreConsultation(TEXTES, regardPillee(intensite), { graine: 3, action: 0 });
    expect(texte.startsWith(`${DESCRIPTION} `)).toBe(true);
    const reste = texte.slice(DESCRIPTION.length + 1);
    const trace = TEXTES.traces[intensite].find((phrase) => reste.startsWith(`${phrase} `));
    expect(trace).toBeDefined();
    expect(TEXTES.pillages).toContain(reste.slice((trace?.length ?? 0) + 1));
  });

  it('une pièce non pillée ne dit rien du pillage', () => {
    for (const phrase of TEXTES.pillages) expect(rendreConsultation(TEXTES, regard('forte'), { graine: 3, action: 0 })).not.toContain(phrase);
    expect(rendreConsultation(TEXTES, regard(), { graine: 3, action: 0 })).toBe(DESCRIPTION);
  });

  it('même partie, même phrase de pillage ; une autre partie peut en tirer une autre', () => {
    const premiere = rendreConsultation(TEXTES, regardPillee(), { graine: 3, action: 0 });
    expect(rendreConsultation(TEXTES, regardPillee(), { graine: 3, action: 9 })).toBe(premiere);
    const autres = new Set(Array.from({ length: 30 }, (_, graine) => rendreConsultation(TEXTES, regardPillee(), { graine, action: 0 })));
    expect(autres.size).toBeGreaterThan(1);
  });

  it('au moins six phrases, chacune entière, sans chiffre ni trou, sans mot de trace ni de menace', () => {
    expect(TEXTES.pillages.length).toBeGreaterThanOrEqual(6);
    for (const phrase of TEXTES.pillages) {
      expect(phrase).toMatch(/^[A-ZÀ-Ý].*\.$/u);
      expect(phrase).not.toMatch(/[0-9{}]/);
      expect(phrase.split(/[.!?…]+(?:\s|$)/).filter((morceau) => morceau.trim() !== '')).toHaveLength(1);
    }
    // Mêmes radicaux que le catalogue : la trace dit « elle est passée par ici », le pillage « quelqu'un a pris ».
    expect(fuitesDuCatalogue({ noms: {}, descriptions: { pillage: TEXTES.pillages }, assistance: {} })).toEqual([]);
  });
});

describe('bruit de station et attentes à la suite (spec 2026-10-18 §5.5, D-289)', () => {
  it('à la 5e et à la 10e attente, le texte de la station reste, même si un bruit de station tombe sur la même action', () => {
    for (const attentes of [5, 10] as const) {
      const cle = { graine: 3, action: attentes, attentes };
      expect(rendreEvenements(TEXTES, [{ type: 'attente' }, { type: 'bruit_station' }], cle)).toEqual([TEXTES.attentesLongues[attentes]]);
      expect(rendreEvenements(TEXTES, [{ type: 'attente' }], cle)).toEqual([TEXTES.attentesLongues[attentes]]);
    }
  });

  it('ailleurs, le bruit de station se raconte après l’attente', () => {
    const texte = rendreEvenements(TEXTES, [{ type: 'attente' }, { type: 'bruit_station' }], { graine: 3, action: 4, attentes: 4 });
    expect(texte).toHaveLength(2);
    expect(TEXTES.evenements.bruit_station).toContain(texte[1]);
  });
});

// Poser un appui porté à une position de la pièce (demande du porteur, grandes stations) : « Vous posez la caisse sous la grille. »

const NOMS_POSE = reunir([
  {
    noms: {
      caisse: { texte: 'caisse', genre: 'f', nombre: 's', elision: false },
      sous_grille: { texte: 'sous la grille', genre: 'f', nombre: 's', elision: false },
    },
    descriptions: {},
    assistance: {},
  },
]);
const POSE_SOUS_LA_GRILLE: Evenement = {
  type: 'objet_pose_position',
  objet: { sorte: 'objet', id: 'e00000002', nom: 'caisse' },
  position: { sorte: 'position', id: 'e00000003', nom: 'sous_grille' },
};
const TEXTES_POSE = ['Vous posez {le:objet} {nom:position}. Vos mains sont libres.', 'Vous déposez {le:objet} {nom:position}, bien d’aplomb. Vous gardez les mains libres.'];

describe('pose à une position (demande du porteur, grandes stations)', () => {
  it('le socle donne les deux textes de l’événement, avec l’objet et la position', () => {
    expect(NOMS_POSE.evenements.objet_pose_position).toEqual(TEXTES_POSE);
  });

  it('se raconte avec le nom de l’objet et celui de la position, sous l’une ou l’autre forme', () => {
    const phrases = new Set(Array.from({ length: 30 }, (_, graine) => rendreEvenements(NOMS_POSE, [POSE_SOUS_LA_GRILLE], { graine, action: 0 })[0]));
    expect([...phrases].sort()).toEqual([
      'Vous déposez la caisse sous la grille, bien d’aplomb. Vous gardez les mains libres.',
      'Vous posez la caisse sous la grille. Vos mains sont libres.',
    ]);
  });

  it('AR-01, AR-02 et le monde de test, écrits en entier, reprennent les mêmes textes', () => {
    for (const id of ['ar-01', 'ar-02', 'monde-test']) expect(MONDES[id]?.textes.evenements.objet_pose_position, id).toEqual(TEXTES_POSE);
  });
});
