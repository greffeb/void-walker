import { emplacementDe, panDeCoque, piecesDeCoque, validerMonde, type DefMonde } from '../engine';
import { MONDES, nomLisible, type EntreeMonde } from '../content';

// Plans dessinés à la main (14 §4.3) : AR-01, AR-02, le monde de test et les stations de test des morceaux (#105) passent le
// vérifieur et les contraintes de leur fiche.

function entree(id: string): EntreeMonde {
  const trouvee = MONDES[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent.`);
  return trouvee;
}

function liaison(monde: DefMonde, id: string) {
  const trouvee = monde.liaisons.find((candidate) => candidate.id === id);
  if (trouvee === undefined) throw new Error(`Liaison ${id} absente.`);
  return trouvee;
}

describe('plans des stations (14 §4.3)', () => {
  it.each(['monde-test', 'ar-01', 'ar-02', 'm-07', 'm-08', 'm-09', 'm-10'])('%s : plan valide, chaque pièce dessinée, chaque nom lisible, chaque liaison placée', (id) => {
    const { monde, textes } = entree(id);
    expect(validerMonde(monde)).toEqual([]);
    for (const piece of monde.pieces) {
      if (piece.sousPosition === true) {
        expect(piece.plan).toBeUndefined();
        continue;
      }
      const plan = piece.plan;
      if (plan === undefined) throw new Error(`${piece.id} sans plan.`);
      expect(nomLisible(textes.noms[piece.nom]?.texte ?? '', plan.largeur, plan.hauteur)).toBe(true);
    }
    for (const lien of monde.liaisons) {
      const versCabine = lien.entre.some((piece) => monde.pieces.find((candidate) => candidate.id === piece)?.sousPosition === true);
      expect(emplacementDe(monde, lien) === null).toBe(versCabine);
    }
  });

  it('AR-01 : le panneau caché passe par un mur commun ; la baie d’observation et la salle d’embarquement touchent la coque', () => {
    const { monde } = entree('ar-01');
    expect(emplacementDe(monde, liaison(monde, 'l-energie-embarquement'))).toEqual({ type: 'mur', axe: 'h', ligne: 6, rang: 6 });
    expect(piecesDeCoque(monde)).toEqual(['p-observation', 'p-embarquement']);
    expect(panDeCoque(monde, 'p-embarquement')).toEqual({ cote: 'bas', debut: 6, fin: 10 });
  });

  it('AR-02 : la salle panoramique, dont la baie peut être percée, et la salle d’embarquement touchent la coque', () => {
    const { monde } = entree('ar-02');
    expect(piecesDeCoque(monde)).toEqual(['p-panoramique', 'p-embarquement']);
    expect(panDeCoque(monde, 'p-panoramique')).toEqual({ cote: 'haut', debut: 7, fin: 11 });
    expect(panDeCoque(monde, 'p-embarquement')).toEqual({ cote: 'bas', debut: 7, fin: 11 });
  });
});
