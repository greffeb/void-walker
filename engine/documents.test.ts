import { idPublic, jouer, nouvellePartie, observer, type Consultation, type DefMonde, type DefObjet, type OptionMenu } from './index';

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
