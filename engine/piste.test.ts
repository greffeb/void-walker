import { jouer, nouvellePartie, observer, type DefMonde } from './index';
import { PISTE_MAX, PISTE_MIN, TRACE_FORTE, tracerPiste } from './piste';

// Piste de la créature (spec 2026-10-18 §5.4) sur un plan de test : une grille de cinq pièces sur cinq, chaque pièce reliée à
// ses voisines ; beaucoup de plus courts chemins, pour éprouver le choix par la graine.

const GRILLE = Array.from({ length: 25 }, (_, rang) => ({ id: `${rang % 5}-${Math.floor(rang / 5)}` }));
const LIAISONS: readonly (readonly [string, string])[] = GRILLE.flatMap(({ id }) => {
  const [x, y] = id.split('-').map(Number) as [number, number];
  return [
    ...(x < 4 ? [[id, `${x + 1}-${y}`] as const] : []),
    ...(y < 4 ? [[id, `${x}-${y + 1}`] as const] : []),
  ];
});
const DEPART = '0-0';
const REPAIRE = '3-3';

function distances(depuis: string): Map<string, number> {
  const vues = new Map([[depuis, 0]]);
  const file = [depuis];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    for (const [a, b] of LIAISONS) {
      const autre = a === piece ? b : b === piece ? a : null;
      if (autre !== null && !vues.has(autre)) {
        vues.set(autre, (vues.get(piece) ?? 0) + 1);
        file.push(autre);
      }
    }
  }
  return vues;
}

const AU_REPAIRE = distances(REPAIRE);

describe('piste de la créature (spec 2026-10-18 §5.4)', () => {
  it('les pièces marquées forment un plus court chemin de l’origine au repaire, de trois à six portes', () => {
    for (let graine = 0; graine < 300; graine++) {
      const piste = tracerPiste(GRILLE, LIAISONS, DEPART, REPAIRE, graine);
      const marquees = [...piste.keys()];
      const origine = marquees.reduce((loin, piece) => ((AU_REPAIRE.get(piece) ?? 0) > (AU_REPAIRE.get(loin) ?? 0) ? piece : loin));
      const longueur = AU_REPAIRE.get(origine) ?? 0;
      expect(longueur).toBeGreaterThanOrEqual(PISTE_MIN);
      expect(longueur).toBeLessThanOrEqual(PISTE_MAX);
      expect(marquees).toHaveLength(longueur + 1);
      const depuisOrigine = distances(origine);
      for (const piece of marquees) expect((depuisOrigine.get(piece) ?? 0) + (AU_REPAIRE.get(piece) ?? 0)).toBe(longueur);
    }
  });

  it('forte à deux portes ou moins du repaire, légère au-delà', () => {
    for (let graine = 0; graine < 50; graine++) {
      for (const [piece, intensite] of tracerPiste(GRILLE, LIAISONS, DEPART, REPAIRE, graine)) {
        expect(intensite).toBe((AU_REPAIRE.get(piece) ?? 0) <= TRACE_FORTE ? 'forte' : 'legere');
      }
    }
  });

  it('jamais la pièce de départ', () => {
    // Le départ est à six portes du repaire : il serait une origine possible.
    for (let graine = 0; graine < 300; graine++) expect(tracerPiste(GRILLE, LIAISONS, DEPART, REPAIRE, graine).has(DEPART)).toBe(false);
  });

  it('préfère une origine étiquetée origine', () => {
    const avecOrigine = GRILLE.map((piece) => (piece.id === '0-4' ? { ...piece, etiquettes: ['origine'] } : piece));
    for (let graine = 0; graine < 50; graine++) expect(tracerPiste(avecOrigine, LIAISONS, DEPART, REPAIRE, graine).has('0-4')).toBe(true);
  });

  it('même graine, même piste ; les graines varient la piste', () => {
    expect([...tracerPiste(GRILLE, LIAISONS, DEPART, REPAIRE, 9)]).toEqual([...tracerPiste(GRILLE, LIAISONS, DEPART, REPAIRE, 9)]);
    const pistes = new Set(Array.from({ length: 30 }, (_, graine) => JSON.stringify([...tracerPiste(GRILLE, LIAISONS, DEPART, REPAIRE, graine)].sort())));
    expect(pistes.size).toBeGreaterThan(5);
  });

  it('un repaire sans voisin assez loin ne marque que lui', () => {
    expect([...tracerPiste([{ id: 'a' }, { id: 'b' }], [['a', 'b']], 'a', 'b', 1)]).toEqual([['b', 'forte']]);
  });
});

describe('regarder une pièce marquée (spec 2026-10-18 §5.4)', () => {
  const monde = (trace?: 'legere' | 'forte'): DefMonde => ({
    id: 'trace',
    depart: 'p-a',
    pieces: [{ id: 'p-a', nom: 'a', ...(trace === undefined ? {} : { trace }) }],
    liaisons: [],
    objets: [],
  });
  const regard = (leMonde: DefMonde) => {
    const partie = nouvellePartie(leMonde, { version: 'test', graine: 1 });
    const option = observer(leMonde, partie.etat).menu.find((candidate) => candidate.action === 'regarder');
    if (option === undefined) throw new Error('Regarder absent.');
    return jouer(leMonde, partie, option.commande);
  };

  it('la consultation de la pièce porte sa trace', () => {
    const resultat = regard(monde('forte'));
    expect(resultat.type === 'consultation' && resultat.consultation.type === 'regarder_piece' ? resultat.consultation.trace : null).toBe('forte');
  });

  it('une pièce sans trace n’en porte aucune : la consultation est la même qu’avant', () => {
    const resultat = regard(monde());
    expect(resultat.type === 'consultation' ? resultat.consultation : null).not.toHaveProperty('trace');
  });
});
