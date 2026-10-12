import {
  chevauchent,
  cleCase,
  emplacementDe,
  murCommun,
  ouvertureVers,
  panDeCoque,
  panLibre,
  piecesDeCoque,
  rangParDefaut,
  validerPlan,
  videsEnfermes,
  type RectPlan,
} from './plan';
import { nouvellePartie, validerMonde, type DefLiaison, type DefMonde, type DefPiece } from './index';

// Géométrie du plan de pont (docs/14-carte.md §4) : y croît vers le bas, comme à l'écran.

const r = (x: number, y: number, largeur: number, hauteur: number): RectPlan => ({ x, y, largeur, hauteur });

describe('géométrie du plan (14 §4.1)', () => {
  it('deux pièces côte à côte ont un mur commun, dans un sens comme dans l’autre ; un coin ou un écart ne suffit pas', () => {
    expect(murCommun(r(0, 0, 4, 3), r(4, 1, 3, 3))).toEqual({ axe: 'v', ligne: 4, debut: 1, fin: 3 });
    expect(murCommun(r(4, 1, 3, 3), r(0, 0, 4, 3))).toEqual({ axe: 'v', ligne: 4, debut: 1, fin: 3 });
    expect(murCommun(r(0, 0, 4, 3), r(1, 3, 2, 2))).toEqual({ axe: 'h', ligne: 3, debut: 1, fin: 3 });
    expect(murCommun(r(0, 0, 2, 2), r(2, 2, 2, 2))).toBeNull();
    expect(murCommun(r(0, 0, 2, 2), r(3, 0, 2, 2))).toBeNull();
  });

  it('la porte se place au milieu du mur commun, côté début quand il a un nombre pair de cases', () => {
    expect(rangParDefaut({ axe: 'v', ligne: 4, debut: 0, fin: 3 })).toBe(1);
    expect(rangParDefaut({ axe: 'h', ligne: 3, debut: 4, fin: 8 })).toBe(5);
    expect(rangParDefaut({ axe: 'h', ligne: 6, debut: 8, fin: 10 })).toBe(8);
  });

  it('chevauchement : une case partagée suffit ; un mur partagé ne compte pas (PL-01)', () => {
    expect(chevauchent(r(0, 0, 3, 3), r(2, 2, 3, 3))).toBe(true);
    expect(chevauchent(r(0, 0, 3, 3), r(3, 0, 3, 3))).toBe(false);
  });

  it('ouverture dans le mur d’une pièce vers une case voisine ; rien vers un coin', () => {
    const piece = r(2, 2, 3, 2);
    expect(ouvertureVers(piece, { x: 1, y: 3 })).toEqual({ type: 'mur', axe: 'v', ligne: 2, rang: 3 });
    expect(ouvertureVers(piece, { x: 5, y: 2 })).toEqual({ type: 'mur', axe: 'v', ligne: 5, rang: 2 });
    expect(ouvertureVers(piece, { x: 3, y: 1 })).toEqual({ type: 'mur', axe: 'h', ligne: 2, rang: 3 });
    expect(ouvertureVers(piece, { x: 4, y: 4 })).toEqual({ type: 'mur', axe: 'h', ligne: 4, rang: 4 });
    expect(ouvertureVers(piece, { x: 1, y: 1 })).toBeNull();
    expect(ouvertureVers(piece, { x: 3, y: 3 })).toBeNull();
  });

  it('vide enfermé : une cour entourée de pièces est refusée case par case ; un renfoncement ouvert passe (PL-03)', () => {
    const haut = r(0, 0, 6, 2);
    const gauche = r(0, 2, 2, 2);
    const droite = r(4, 2, 2, 2);
    const bas = r(0, 4, 6, 2);
    expect(videsEnfermes([haut, gauche, droite, bas])).toEqual([
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
    ]);
    expect(videsEnfermes([haut, gauche, bas])).toEqual([]);
    expect(videsEnfermes([])).toEqual([]);
  });

  it('pan de coque : le plus long, d’au moins deux cases, avec quatre cases libres devant ; à égalité, haut, droite, bas, gauche (PL-05)', () => {
    const piece = r(0, 0, 4, 3);
    expect(panLibre(piece, new Set())).toEqual({ cote: 'haut', debut: 0, fin: 4 });
    const voisins = new Set([cleCase(0, -1), cleCase(1, -1), cleCase(2, -1), cleCase(3, -1), cleCase(4, 0), cleCase(4, 1), cleCase(4, 2)]);
    expect(panLibre(piece, voisins)).toEqual({ cote: 'bas', debut: 0, fin: 4 });
    // Une case occupée à quatre cases de profondeur coupe encore le pan.
    const loin = new Set([cleCase(0, -4), cleCase(5, 1), cleCase(1, 5), cleCase(-4, 0)]);
    expect(panLibre(r(0, 0, 2, 2), loin)).toBeNull();
    loin.delete(cleCase(-4, 0));
    expect(panLibre(r(0, 0, 2, 2), loin)).toEqual({ cote: 'gauche', debut: 0, fin: 2 });
  });
});

// Trois pièces en L et une cabine : la plus petite station qui passe le vérifieur.
//   ┌───┬───┐
//   │ a │ b │   b contre la coque, cabine k à bord de b
//   ├───┼───┘
//   │ c │
//   └───┘
const PLAN: DefMonde = {
  id: 'essai-plan',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'a', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'b', nom: 'b', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 }, coque: true },
    { id: 'c', nom: 'c', plan: { x: 0, y: 2, largeur: 3, hauteur: 2 } },
    { id: 'k', nom: 'k', sousPosition: true },
  ],
  liaisons: [
    { id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: true },
    { id: 'ac', nom: 'porte', entre: ['a', 'c'], ouverte: false, plan: { rang: 0 } },
    { id: 'bk', nom: 'ecoutille', entre: ['b', 'k'], ouverte: false },
  ],
  objets: [],
};

function avecPieces(monde: DefMonde, changements: Readonly<Record<string, Partial<DefPiece>>>, ajouts: readonly DefPiece[] = []): DefMonde {
  return { ...monde, pieces: [...monde.pieces.map((piece) => ({ ...piece, ...changements[piece.id] })), ...ajouts] };
}

function avecLiaisons(monde: DefMonde, changements: Readonly<Record<string, Partial<DefLiaison>>>, ajouts: readonly DefLiaison[] = []): DefMonde {
  return { ...monde, liaisons: [...monde.liaisons.map((liaison) => ({ ...liaison, ...changements[liaison.id] })), ...ajouts] };
}

function liaison(monde: DefMonde, id: string): DefLiaison {
  const trouvee = monde.liaisons.find((candidate) => candidate.id === id);
  if (trouvee === undefined) throw new Error(`Liaison ${id} absente.`);
  return trouvee;
}

describe('vérifieur du plan (14 §4.2)', () => {
  it('un plan correct passe ; portes au milieu ou fixées, rien pour la cabine', () => {
    expect(validerMonde(PLAN)).toEqual([]);
    expect(emplacementDe(PLAN, liaison(PLAN, 'ab'))).toEqual({ type: 'mur', axe: 'v', ligne: 3, rang: 0 });
    expect(emplacementDe(PLAN, liaison(PLAN, 'ac'))).toEqual({ type: 'mur', axe: 'h', ligne: 2, rang: 0 });
    expect(emplacementDe(PLAN, liaison(PLAN, 'bk'))).toBeNull();
    expect(panDeCoque(PLAN, 'b')).toEqual({ cote: 'haut', debut: 3, fin: 6 });
  });

  it('un monde sans aucun plan reste valide (tests du moteur) ; un plan de liaison seul est refusé', () => {
    const sansPlan: DefMonde = { ...PLAN, pieces: PLAN.pieces.map((piece) => ({ id: piece.id, nom: piece.nom, sousPosition: piece.sousPosition })) };
    expect(validerMonde({ ...sansPlan, liaisons: PLAN.liaisons.map((lien) => ({ ...lien, plan: undefined })) })).toEqual([]);
    expect(validerMonde(sansPlan)).toContain('ac : plan de liaison sans plan des pièces.');
  });

  it('tout ou rien : une pièce oubliée rend le monde injouable', () => {
    const oubli = avecPieces(PLAN, { c: { plan: undefined } });
    expect(validerMonde(oubli)).toContain('c : pièce sans plan, alors que d’autres en ont un.');
    expect(() => nouvellePartie(oubli, { version: 'v', graine: 1 })).toThrow('pièce sans plan');
  });

  it('rectangle en cases entières, deux cases au moins de chaque côté', () => {
    expect(validerMonde(avecPieces(PLAN, { c: { plan: { x: 0, y: 2, largeur: 1, hauteur: 2 } } }))).toContain(
      'c : rectangle invalide (cases entières, au moins 2 × 2).',
    );
    expect(validerMonde(avecPieces(PLAN, { c: { plan: { x: 0, y: 2.5, largeur: 3, hauteur: 2 } } }))).toContain(
      'c : rectangle invalide (cases entières, au moins 2 × 2).',
    );
  });

  it('PL-01 : deux pièces qui se chevauchent', () => {
    expect(validerMonde(avecPieces(PLAN, { c: { plan: { x: 1, y: 1, largeur: 3, hauteur: 2 } } }))).toContain('a et c : pièces qui se chevauchent (PL-01).');
  });

  it('PL-02 : un coin ne fait pas un mur commun', () => {
    const coin = avecPieces(PLAN, { c: { plan: { x: 3, y: 2, largeur: 3, hauteur: 2 } } });
    expect(validerMonde(coin)).toContain('ac : ni mur commun ni tracé de conduit (PL-02).');
    expect(() => nouvellePartie(coin, { version: 'v', graine: 1 })).toThrow('PL-02');
  });

  it('PL-02 : une porte fixée va de la première à la dernière case du mur commun, pas au-delà', () => {
    expect(validerMonde(avecLiaisons(PLAN, { ac: { plan: { rang: 2 } } }))).toEqual([]);
    expect(validerMonde(avecLiaisons(PLAN, { ac: { plan: { rang: 3 } } }))).toContain('ac : porte hors du mur commun (PL-02).');
    expect(validerMonde(avecLiaisons(PLAN, { ac: { plan: { rang: -1 } } }))).toContain('ac : porte hors du mur commun (PL-02).');
  });

  it('deux liaisons à la même ouverture sont refusées', () => {
    const double = avecLiaisons(PLAN, {}, [{ id: 'ab2', nom: 'porte', entre: ['b', 'a'], ouverte: false }]);
    expect(validerMonde(double)).toContain('ab et ab2 : même ouverture.');
  });

  it('PL-02 : un conduit relie deux pièces sans mur commun par des cases libres et contiguës', () => {
    const conduit: DefMonde = {
      id: 'essai-conduit',
      depart: 'a',
      pieces: [
        { id: 'a', nom: 'a', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'b', nom: 'b', plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } },
      ],
      liaisons: [{ id: 'ab', nom: 'conduit', entre: ['a', 'b'], ouverte: false, plan: { trace: [{ x: 2, y: 0 }, { x: 3, y: 0 }] } }],
      objets: [],
    };
    expect(validerMonde(conduit)).toEqual([]);
    expect(emplacementDe(conduit, liaison(conduit, 'ab'))).toEqual({ type: 'trace', cases: [{ x: 2, y: 0 }, { x: 3, y: 0 }] });
    const casse = (trace: readonly { x: number; y: number }[]): string[] => validerMonde(avecLiaisons(conduit, { ab: { plan: { trace } } }));
    expect(casse([{ x: 2, y: 0 }, { x: 3, y: 1 }])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(casse([{ x: 2, y: 0 }])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(casse([{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(casse([])).toContain('ab : tracé de conduit invalide (PL-02).');
    expect(validerMonde(avecLiaisons(conduit, { ab: { plan: { rang: 0, trace: [{ x: 2, y: 0 }, { x: 3, y: 0 }] } } }))).toContain('ab : porte et tracé à la fois.');
    expect(validerMonde(avecLiaisons(conduit, { ab: { plan: undefined } }))).toContain('ab : ni mur commun ni tracé de conduit (PL-02).');
  });

  it('une sous-position n’a jamais de plan, ni sa liaison', () => {
    expect(validerMonde(avecPieces(PLAN, { k: { plan: { x: 6, y: 0, largeur: 2, hauteur: 2 } } }))).toContain('k : sous-position avec un plan.');
    expect(validerMonde(avecLiaisons(PLAN, { bk: { plan: { rang: 0 } } }))).toContain('bk : plan d’une liaison vers une sous-position.');
  });

  it('PL-03 : une cour intérieure est refusée', () => {
    const cour: DefMonde = {
      id: 'essai-cour',
      depart: 'n',
      pieces: [
        { id: 'n', nom: 'n', plan: { x: 0, y: 0, largeur: 6, hauteur: 2 } },
        { id: 'o', nom: 'o', plan: { x: 0, y: 2, largeur: 2, hauteur: 2 } },
        { id: 'e', nom: 'e', plan: { x: 4, y: 2, largeur: 2, hauteur: 2 } },
        { id: 's', nom: 's', plan: { x: 0, y: 4, largeur: 6, hauteur: 2 } },
      ],
      liaisons: [],
      objets: [],
    };
    expect(validerMonde(cour)).toEqual([
      'Vide enfermé entre les pièces en (2, 2) (PL-03).',
      'Vide enfermé entre les pièces en (3, 2) (PL-03).',
      'Vide enfermé entre les pièces en (2, 3) (PL-03).',
      'Vide enfermé entre les pièces en (3, 3) (PL-03).',
    ]);
  });

  it('PL-05 : une pièce à vitrage extérieur entourée de pièces n’a pas de coque dégagée', () => {
    const croix: DefMonde = {
      id: 'essai-croix',
      depart: 'centre',
      pieces: [
        { id: 'centre', nom: 'centre', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'est', nom: 'est', plan: { x: 2, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'sud', nom: 'sud', plan: { x: 0, y: 2, largeur: 2, hauteur: 2 } },
        { id: 'ouest', nom: 'ouest', plan: { x: -2, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'nord', nom: 'nord', plan: { x: 0, y: -2, largeur: 2, hauteur: 2 } },
      ],
      liaisons: [],
      objets: [{ id: 'hublot', nom: 'hublot', piece: 'centre', portable: false, vitrageExterieur: true }],
    };
    expect(piecesDeCoque(croix)).toEqual(['centre']);
    expect(validerMonde(croix)).toEqual(['centre : pièce de coque sans pan dégagé (PL-05).']);
  });

  it('pièces de coque : déclarées, à vitrage extérieur ou d’embarquement d’une capsule, dans l’ordre du monde', () => {
    const capsule = { ...PLAN, objets: [{ id: 'capsule', nom: 'capsule', piece: 'a', portable: false, capsule: { interieur: 'k' } }] };
    expect(piecesDeCoque(PLAN)).toEqual(['b']);
    expect(piecesDeCoque(avecLiaisons(capsule, {}, [{ id: 'ak', nom: 'ecoutille', entre: ['a', 'k'], ouverte: false }]))).toEqual(['a', 'b']);
  });

  it('PL-06 : sept portes sur une même pièce, c’est trop', () => {
    const voisines: DefPiece[] = [
      ...[0, 2, 4, 6].map((x) => ({ id: `h${x}`, nom: 'voisine', plan: { x, y: -2, largeur: 2, hauteur: 2 } })),
      ...[0, 2, 4].map((x) => ({ id: `b${x}`, nom: 'voisine', plan: { x, y: 2, largeur: 2, hauteur: 2 } })),
    ];
    const etoile: DefMonde = {
      id: 'essai-etoile',
      depart: 'hub',
      pieces: [{ id: 'hub', nom: 'hub', plan: { x: 0, y: 0, largeur: 8, hauteur: 2 } }, ...voisines],
      liaisons: voisines.map((voisine) => ({ id: `l-${voisine.id}`, nom: 'porte', entre: ['hub', voisine.id] as const, ouverte: true })),
      objets: [],
    };
    expect(validerMonde(etoile)).toEqual(['hub : 7 portes, six au plus (PL-06).']);
  });

  it('PL-07 : le plan ne dépend que du monde', () => {
    const copie = JSON.parse(JSON.stringify(PLAN)) as DefMonde;
    expect(validerPlan(copie)).toEqual(validerPlan(PLAN));
    expect(PLAN.liaisons.map((lien) => emplacementDe(copie, lien))).toEqual(PLAN.liaisons.map((lien) => emplacementDe(PLAN, lien)));
  });
});
