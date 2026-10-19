import { poserCles, type CleAPoser, type PieceCandidate } from './cles';

// Pose des clés d'une grande station (spec 2026-10-18 §6.5) sur des mondes construits : des clés, des pièces du catalogue
// candidates, la règle de zone et le contrôle « apportable » donnés par l'appelant.

function cle(objet: string, morceau: string, options: Partial<CleAPoser> = {}): CleAPoser {
  return { objet: `${morceau}/${objet}`, morceau, origine: `${morceau}/p-origine`, cle: { etiquettes: ['rangement'] }, encombrante: false, large: false, ...options };
}

function candidate(id: string, segment = 0, etiquettes: readonly string[] = ['rangement']): PieceCandidate {
  return { id, etiquettes, segment, racine: 'm-01/p-poste' };
}

const toutes = (): boolean => true;
const GRAINES = Array.from({ length: 300 }, (_, graine) => graine);

describe('pose des clés (spec 2026-10-18 §6.5)', () => {
  it('tirage uniforme parmi l’origine et les candidates permises ; même graine, même résultat', () => {
    const cles = [cle('o-bidon', 'm-01')];
    const candidates = ['a1-x/p-piece', 'a2-x/p-piece', 'a3-x/p-piece'].map((id) => candidate(id));
    const comptes = new Map<string, number>();
    for (let graine = 0; graine < 4000; graine++) {
      const piece = poserCles(cles, candidates, toutes, toutes, graine).get('m-01/o-bidon') ?? '';
      comptes.set(piece, (comptes.get(piece) ?? 0) + 1);
    }
    expect([...comptes.keys()].sort()).toEqual(['a1-x/p-piece', 'a2-x/p-piece', 'a3-x/p-piece', 'm-01/p-origine']);
    for (const compte of comptes.values()) {
      expect(compte).toBeGreaterThan(800);
      expect(compte).toBeLessThan(1200);
    }
    expect([...poserCles(cles, candidates, toutes, toutes, 17)]).toEqual([...poserCles(cles, candidates, toutes, toutes, 17)]);
  });

  it('jamais une candidate hors des zones permises, ni d’étiquette incompatible', () => {
    const cles = [cle('o-bidon', 'm-01', { cle: { etiquettes: ['eau'] } })];
    const candidates = [candidate('a1-bonne/p-piece', 1, ['eau', 'document']), candidate('a2-loin/p-piece', 3, ['eau']), candidate('a3-seche/p-piece', 1, ['rangement'])];
    const zone = (_cle: CleAPoser, piece: PieceCandidate): boolean => piece.segment <= 1;
    const vues = new Set(GRAINES.map((graine) => poserCles(cles, candidates, zone, toutes, graine).get('m-01/o-bidon')));
    expect([...vues].sort()).toEqual(['a1-bonne/p-piece', 'm-01/p-origine']);
  });

  it('deux clés de morceaux différents jamais dans la même pièce ; combinaison et découpeuse peuvent la partager', () => {
    const seule = [candidate('a1-seule/p-piece')];
    let partagees = 0;
    for (const graine of GRAINES) {
      const autres = poserCles([cle('o-bidon', 'm-01'), cle('o-planche', 'm-08')], seule, toutes, toutes, graine);
      expect(autres.get('m-01/o-bidon') === 'a1-seule/p-piece' && autres.get('m-08/o-planche') === 'a1-seule/p-piece').toBe(false);
      const memes = poserCles([cle('o-combinaison', 'm-06'), cle('o-decoupeuse', 'm-06')], seule, toutes, toutes, graine);
      if (memes.get('m-06/o-combinaison') === 'a1-seule/p-piece' && memes.get('m-06/o-decoupeuse') === 'a1-seule/p-piece') partagees++;
    }
    expect(partagees).toBeGreaterThan(0);
  });

  it('au plus une clé encombrante déplacée', () => {
    const cles = [cle('o-caisse', 'm-02', { encombrante: true }), cle('o-planche', 'm-08', { encombrante: true }), cle('o-bloc', 'm-03', { encombrante: true }), cle('o-bidon', 'm-01')];
    const candidates = Array.from({ length: 8 }, (_, rang) => candidate(`a${rang + 1}-x/p-piece`));
    let deplacees = 0;
    for (const graine of GRAINES) {
      const poses = poserCles(cles, candidates, toutes, toutes, graine);
      const encombrantes = cles.filter((laCle) => laCle.encombrante && poses.get(laCle.objet) !== laCle.origine).length;
      expect(encombrantes).toBeLessThanOrEqual(1);
      deplacees += encombrantes;
    }
    expect(deplacees).toBeGreaterThan(0);
  });

  it('une clé large ne va jamais dans une pièce dont apportable est faux', () => {
    const cles = [cle('o-bloc', 'm-03', { large: true, encombrante: true })];
    const candidates = [candidate('a1-proche/p-piece'), candidate('a2-derriere/p-piece')];
    const apportable = (piece: string): boolean => piece !== 'a2-derriere/p-piece';
    const vues = new Set(GRAINES.map((graine) => poserCles(cles, candidates, toutes, apportable, graine).get('m-03/o-bloc')));
    expect([...vues].sort()).toEqual(['a1-proche/p-piece', 'm-03/p-origine']);
  });
});
