import { poserDocuments, type DocumentPose, type PieceDocument } from './documents';
import { idPublic, jouer, nouvellePartie, observer, type Consultation, type DefMonde, type DefObjet, type OptionMenu } from './index';
import type { EmplacementDocument, ReserveDocuments } from './station';

// Regarder un document (spec 2026-10-18 §8.5) : la seule action possible, gratuite ; une note de rangement rend la pièce qu'elle
// nomme en référence publique, pour remplir le trou à l'affichage.

const monde = (document: DefObjet): DefMonde => ({
  id: 'essai-document',
  depart: 'salle',
  pieces: [
    { id: 'salle', nom: 'salle' },
    { id: 'cave', nom: 'cave' },
  ],
  liaisons: [{ id: 'trappe', nom: 'trappe', entre: ['salle', 'cave'], ouverte: true }],
  objets: [document],
});
const NOTE: DefObjet = { id: 'note', nom: 'note', piece: 'salle', portable: false, document: true };

const regarder = (leMonde: DefMonde, nom: string): { consultation: Consultation | null; actions: number; avant: number } => {
  const partie = nouvellePartie(leMonde, { version: 'test', graine: 1 });
  const option = observer(leMonde, partie.etat).menu.find((candidat) => candidat.action === 'regarder' && candidat.cible.nom === nom);
  if (option === undefined) throw new Error(`Regarder ${nom} absent.`);
  const resultat = jouer(leMonde, partie, option.commande);
  return resultat.type === 'consultation'
    ? { consultation: resultat.consultation, actions: resultat.partie.etat.actions, avant: partie.etat.actions }
    : { consultation: null, actions: -1, avant: partie.etat.actions };
};

describe('regarder un document (spec 2026-10-18 §8.5)', () => {
  it('une note de rangement rend la pièce nommée en référence publique', () => {
    const leMonde = monde({ ...NOTE, designe: 'cave' });
    expect(regarder(leMonde, 'note').consultation).toEqual({
      type: 'regarder_document',
      cible: { sorte: 'objet', id: idPublic('essai-document', 'note'), nom: 'note' },
      designe: { sorte: 'piece', id: idPublic('essai-document', 'cave'), nom: 'cave' },
    });
  });

  it('un document sans pièce désignée ne porte pas de champ designe', () => {
    const { consultation } = regarder(monde(NOTE), 'note');
    expect(consultation).toEqual({ type: 'regarder_document', cible: { sorte: 'objet', id: idPublic('essai-document', 'note'), nom: 'note' } });
    expect(consultation).not.toHaveProperty('designe');
  });

  it('lire ne coûte aucune action', () => {
    const lecture = regarder(monde({ ...NOTE, designe: 'cave' }), 'note');
    expect(lecture.actions).toBe(lecture.avant);
  });

  it('un document n’apparaît dans aucun autre menu que « regarder »', () => {
    const leMonde = monde({ ...NOTE, designe: 'cave' });
    const menu = observer(leMonde, nouvellePartie(leMonde, { version: 'test', graine: 1 }).etat).menu;
    const touchent = (option: OptionMenu): boolean => option.cible.nom === 'note' || option.parametre?.nom === 'note';
    expect(menu.filter(touchent).map((option) => option.action)).toEqual(['regarder']);
  });
});

// Pose des documents d'une grande station (spec 2026-10-18 §8.4) sur des pièces construites : rang depuis le départ, pièce face
// à l'obstacle et annexes pendues à elle (`morceau`), pièces qui ne portent encore rien (`vide`).

const piece = (id: string, rang: number, autres: Partial<PieceDocument> = {}): PieceDocument => ({ id, etiquettes: [], morceau: null, rang, catalogue: false, vide: true, ...autres });
const annexe = (id: string, rang: number, etiquette: string, autres: Partial<PieceDocument> = {}): PieceDocument => piece(id, rang, { etiquettes: [etiquette, 'document'], catalogue: true, ...autres });

const DEPART = 'v/vestibule';
// Rang le plus grand 12 : premier tiers jusqu'à 4, deuxième jusqu'à 8, dernier au-delà. Trois annexes ne portent encore rien.
const PIECES: readonly PieceDocument[] = [
  piece(DEPART, 0),
  piece('m1/poste', 1, { morceau: 'm1' }),
  piece('m1/local', 2),
  piece('m1/galerie', 3),
  piece('m2/atelier', 5, { morceau: 'm2' }),
  piece('m2/pompes', 6),
  piece('m3/fin', 12),
  annexe('a1/p', 4, 'couchage', { vide: false }),
  annexe('a2/p', 2, 'eau', { morceau: 'm1', vide: false }),
  annexe('a3/p', 1, 'outillage'),
  annexe('a4/p', 6, 'rangement', { morceau: 'm2', vide: false }),
  annexe('a5/p', 7, 'securite', { vide: false }),
  annexe('a6/p', 9, 'soin', { vide: false }),
  annexe('a7/p', 10, 'couchage'),
  annexe('a8/p', 11, 'eau'),
];
const ETAPES = [1, 2, 3, 4] as const;
const EMPLACEMENTS: readonly EmplacementDocument[] = [
  ...['couchage', 'eau', 'outillage', 'rangement', 'securite', 'soin', 'document', 'eau'].map((etiquette, indice): EmplacementDocument => ({ id: `univers-${indice}`, couche: 'univers', etiquettes: [etiquette] })),
  ...ETAPES.flatMap((etape) => ['a', 'b', 'c'].map((lettre): EmplacementDocument => ({ id: `menace-${etape}${lettre}`, couche: 'menace', etape }))),
  ...['m1', 'm2', 'm3'].map((morceau): EmplacementDocument => ({ id: `morceau-${morceau}`, couche: 'morceau', morceau })),
  { id: 'rangement-bidon', couche: 'rangement', morceau: 'm1', cle: 'o-bidon' },
  { id: 'rangement-combinaison', couche: 'rangement', morceau: 'm1', cle: 'o-combinaison' },
  { id: 'rangement-caisse', couche: 'rangement', morceau: 'm2', cle: 'o-caisse' },
  { id: 'rangement-trousse', couche: 'rangement', cle: 'butin:soin' },
];
const RESERVE: ReserveDocuments = { emplacements: EMPLACEMENTS, parStation: [5, 7] };
const MORCEAUX: ReadonlySet<string> = new Set(['m1', 'm2']);
type Deplacees = ReadonlyMap<string, { readonly piece: string; readonly face: string; readonly origine: string }>;
const AUCUNE: Deplacees = new Map();
const BIDON: Deplacees = new Map([['m1/o-bidon', { piece: 'a3/p', face: 'm1/poste', origine: 'm1/local' }]]);
const GRAINES = Array.from({ length: 200 }, (_, graine) => graine);

interface Essai {
  readonly reserve?: ReserveDocuments;
  readonly pieces?: readonly PieceDocument[];
  readonly cles?: Deplacees;
  readonly trousse?: string | null;
  readonly morceaux?: ReadonlySet<string>;
}
const poser = (graine: number, essai: Essai = {}): readonly DocumentPose[] =>
  poserDocuments(essai.reserve ?? RESERVE, essai.pieces ?? PIECES, essai.cles ?? AUCUNE, essai.trousse ?? null, essai.morceaux ?? MORCEAUX, DEPART, graine);
const rangDe = (id: string): number => PIECES.find((candidate) => candidate.id === id)?.rang ?? -1;
const tiers = (rang: number): number => (rang * 3 <= 12 ? 0 : rang * 3 <= 24 ? 1 : 2);
const couche = (poses: readonly DocumentPose[], laCouche: EmplacementDocument['couche']): readonly DocumentPose[] => poses.filter((pose) => pose.emplacement.couche === laCouche);

describe('pose des documents (spec 2026-10-18 §8.4)', () => {
  it('le nombre tiré est dans parStation, notes comprises ; les notes obligatoires passent au-delà', () => {
    const nombres = new Set<number>();
    for (const graine of GRAINES) {
      const poses = poser(graine);
      nombres.add(poses.length);
      expect(poses.length).toBeGreaterThanOrEqual(5);
      expect(poses.length).toBeLessThanOrEqual(7);
      const avecNote = poser(graine, { cles: BIDON });
      expect(avecNote.length).toBeGreaterThanOrEqual(5);
      expect(avecNote.length).toBeLessThanOrEqual(7);
    }
    expect([...nombres].sort()).toEqual([5, 6, 7]);
    const cles: Deplacees = new Map([...BIDON, ['m2/o-caisse', { piece: 'a5/p', face: 'm2/atelier', origine: 'm2/pompes' }]]);
    for (const graine of GRAINES) expect(couche(poser(graine, { reserve: { ...RESERVE, parStation: [1, 1] }, cles }), 'rangement').length).toBe(2);
  });

  it('une note par clé déplacée, dans la pièce face, qui désigne la pièce de la clé', () => {
    for (const graine of GRAINES) {
      expect(couche(poser(graine, { cles: BIDON }), 'rangement')).toEqual([{ emplacement: EMPLACEMENTS.find((emplacement) => emplacement.id === 'rangement-bidon'), piece: 'm1/poste', designe: 'a3/p' }]);
      // Une clé restée chez elle : sa note n'est pas posée.
      expect(couche(poser(graine), 'rangement')).toEqual([]);
    }
  });

  it('deux clés du même morceau : la seconde note dans la pièce d’origine restée vide, sinon dans une annexe pendue à la face', () => {
    const chezElle: Deplacees = new Map([...BIDON, ['m1/o-combinaison', { piece: 'a5/p', face: 'm1/poste', origine: 'm1/local' }]]);
    const surLaFace: Deplacees = new Map([
      ['m1/o-bidon', { piece: 'a3/p', face: 'm1/poste', origine: 'm1/poste' }],
      ['m1/o-combinaison', { piece: 'a5/p', face: 'm1/poste', origine: 'm1/poste' }],
    ]);
    for (const graine of GRAINES) {
      expect(couche(poser(graine, { cles: chezElle }), 'rangement').map((pose) => [pose.piece, pose.designe])).toEqual([
        ['m1/poste', 'a3/p'],
        ['m1/local', 'a5/p'],
      ]);
      expect(couche(poser(graine, { cles: surLaFace }), 'rangement').map((pose) => [pose.piece, pose.designe])).toEqual([
        ['m1/poste', 'a3/p'],
        ['a2/p', 'a5/p'],
      ]);
    }
  });

  it('un document de morceau seulement si le morceau est là, dans sa pièce face, sinon dans une annexe pendue à elle', () => {
    let deplaces = 0;
    for (const graine of GRAINES) {
      for (const poses of [poser(graine), poser(graine, { cles: BIDON })]) {
        const morceaux = couche(poses, 'morceau');
        expect(morceaux.map((pose) => pose.emplacement.morceau)).not.toContain('m3');
        for (const pose of morceaux) {
          const morceau = pose.emplacement.morceau ?? '';
          const face = PIECES.find((candidate) => !candidate.catalogue && candidate.morceau === morceau)?.id;
          const prise = poses.some((autre) => autre.emplacement.couche === 'rangement' && autre.piece === face);
          expect(pose.piece).toBe(prise ? PIECES.find((candidate) => candidate.catalogue && candidate.morceau === morceau)?.id : face);
        }
      }
      // La face de m1 porte la note : le document de m1, s'il est posé, va dans l'annexe pendue à elle.
      const deM1 = couche(poser(graine, { cles: BIDON }), 'morceau').find((pose) => pose.emplacement.morceau === 'm1');
      if (deM1 !== undefined) {
        deplaces++;
        expect(deM1.piece).toBe('a2/p');
      }
      expect(couche(poser(graine, { morceaux: new Set() }), 'morceau')).toEqual([]);
    }
    expect(deplaces).toBeGreaterThan(0);
  });

  it('les étapes de la menace suivent le trajet : 1 et 2 au premier tiers, 3 au deuxième, 4 au dernier, au moins une', () => {
    const etapes = new Set<number>();
    for (const graine of GRAINES) {
      const menace = [...couche(poser(graine), 'menace')].sort((a, b) => (a.emplacement.etape ?? 0) - (b.emplacement.etape ?? 0));
      expect(menace.length).toBeGreaterThan(0);
      for (const pose of menace) {
        etapes.add(pose.emplacement.etape ?? 0);
        expect(tiers(rangDe(pose.piece))).toBe(Math.max(0, (pose.emplacement.etape ?? 0) - 2));
      }
      const rangs = menace.map((pose) => rangDe(pose.piece));
      expect([...rangs].sort((a, b) => a - b)).toEqual(rangs);
      expect(new Set(menace.map((pose) => pose.emplacement.etape)).size).toBe(menace.length);
    }
    expect([...etapes].sort()).toEqual([1, 2, 3, 4]);
  });

  it('les documents de l’univers dans une pièce du catalogue d’une étiquette acceptée', () => {
    let univers = 0;
    for (const graine of GRAINES) {
      for (const pose of couche(poser(graine), 'univers')) {
        univers++;
        const ici = PIECES.find((candidate) => candidate.id === pose.piece);
        expect(ici?.catalogue).toBe(true);
        expect(ici?.etiquettes.some((etiquette) => pose.emplacement.etiquettes?.includes(etiquette))).toBe(true);
      }
    }
    expect(univers).toBeGreaterThan(0);
  });

  it('jamais le départ, jamais deux documents dans une pièce, jamais deux fois le même document', () => {
    // Le départ est ici la pièce la plus tentante : du catalogue, vide, de toutes les étiquettes.
    const pieces = PIECES.map((candidate) => (candidate.id === DEPART ? { ...candidate, catalogue: true, etiquettes: ['couchage', 'eau', 'outillage', 'rangement', 'securite', 'soin', 'document'] } : candidate));
    for (const graine of GRAINES) {
      for (const poses of [poser(graine, { pieces, trousse: 'a6/p' }), poser(graine, { pieces, cles: BIDON, trousse: 'a6/p', reserve: { ...RESERVE, parStation: [20, 20] } })]) {
        expect(poses.map((pose) => pose.piece)).not.toContain(DEPART);
        expect(new Set(poses.map((pose) => pose.piece)).size).toBe(poses.length);
        expect(new Set(poses.map((pose) => pose.emplacement.id)).size).toBe(poses.length);
      }
    }
  });

  it('les pièces du catalogue qui ne portent encore rien d’abord', () => {
    // Seule l'annexe du premier tiers qui ne porte rien reçoit, à coup sûr, un document de l'étape 1 ou 2.
    const pieces = PIECES.map((candidate) => (candidate.catalogue && candidate.id !== 'a3/p' ? { ...candidate, vide: false } : candidate));
    for (const graine of GRAINES) expect(poser(graine, { pieces, morceaux: new Set(), reserve: { ...RESERVE, parStation: [2, 2] } }).map((pose) => pose.piece)).toContain('a3/p');
  });

  it('chaque pièce du catalogue qui ne porte rien garde sa place : sans place de reste, tout document la couvre (§7.3)', () => {
    const vides = PIECES.map((candidate) => (candidate.catalogue ? { ...candidate, vide: true } : candidate));
    for (const graine of GRAINES) {
      const poses = poser(graine, { pieces: vides, trousse: 'a6/p' });
      // Huit annexes à couvrir pour cinq à sept documents : la première menace, imposée, peut seule aller ailleurs.
      expect(poses.filter((pose) => !PIECES.find((candidate) => candidate.id === pose.piece)?.catalogue).length).toBeLessThanOrEqual(1);
      expect(couche(poses, 'morceau')).toEqual([]);
    }
    // Trois annexes à couvrir pour sept documents : elles le sont toutes.
    for (const graine of GRAINES) expect(poser(graine, { reserve: { ...RESERVE, parStation: [7, 7] } }).map((pose) => pose.piece)).toEqual(expect.arrayContaining(['a3/p', 'a7/p', 'a8/p']));
  });

  it('la note de la trousse, s’il reste de la place : dans une autre pièce du catalogue, qui désigne la sienne', () => {
    // Que des notes : aucune clé n'a bougé, la place reste à la trousse.
    const notes: ReserveDocuments = { ...RESERVE, emplacements: EMPLACEMENTS.filter((emplacement) => emplacement.couche === 'rangement') };
    for (const graine of GRAINES) {
      const poses = poser(graine, { reserve: notes, trousse: 'a6/p' });
      expect(poses.map((pose) => [pose.emplacement.cle, pose.designe])).toEqual([['butin:soin', 'a6/p']]);
      expect(poses[0]?.piece).not.toBe('a6/p');
      expect(PIECES.find((candidate) => candidate.id === poses[0]?.piece)?.catalogue).toBe(true);
      expect(poser(graine, { reserve: notes })).toEqual([]);
    }
  });

  it('même graine, même pose ; une autre graine en tire une autre', () => {
    expect(JSON.stringify(poser(7, { cles: BIDON, trousse: 'a6/p' }))).toBe(JSON.stringify(poser(7, { cles: BIDON, trousse: 'a6/p' })));
    expect(new Set(GRAINES.map((graine) => JSON.stringify(poser(graine)))).size).toBeGreaterThan(50);
  });
});
