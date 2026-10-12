import { idPublic, jouer, nouvellePartie, observer, reprendrePartie, type DefMonde, type IdAction, type OptionMenu, type Partie } from './index';

// Mémoire du passager et carte publique (docs/14-carte.md §3) : fixtures synthétiques avec plan ; les noms ne servent qu'à
// retrouver les options du menu (D-078).
//
//   ┌───────┬───────┐
//   │ quai  │ forge │   forge en feu ; porte qf fermée ; capsule au quai, cabine à bord par l'écoutille qc
//   ├───────┼───────┤
//   │ soute │ local │   porte qs ouverte ; grille sl sans signalétique, ouverte ; porte lf fermée ; panneau pn caché côté local
//   └───────┴───────┘
const MONDE: DefMonde = {
  id: 'essai-carte',
  depart: 'quai',
  pieces: [
    { id: 'quai', nom: 'quai', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'forge', nom: 'forge', feu: true, plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'soute', nom: 'soute', plan: { x: 0, y: 2, largeur: 3, hauteur: 2 } },
    { id: 'local', nom: 'local', plan: { x: 3, y: 2, largeur: 3, hauteur: 2 } },
    { id: 'cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'qf', nom: 'porte', entre: ['quai', 'forge'], ouverte: false },
    { id: 'qs', nom: 'porte', entre: ['quai', 'soute'], ouverte: true },
    { id: 'sl', nom: 'grille', entre: ['soute', 'local'], ouverte: true, etroite: true, sansSignaletique: true },
    { id: 'lf', nom: 'porte', entre: ['local', 'forge'], ouverte: false },
    { id: 'pn', nom: 'panneau', entre: ['local', 'forge'], ouverte: false, cachee: 'local', plan: { rang: 5 } },
    { id: 'qc', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: true },
  ],
  positions: [
    { id: 'mur', nom: 'mur', piece: 'soute' },
    { id: 'coin', nom: 'coin', piece: 'soute' },
  ],
  objets: [
    { id: 'carnet', nom: 'carnet', piece: 'quai' },
    { id: 'caisse', nom: 'caisse', piece: 'soute', position: 'mur', portable: false, deplacable: true },
    { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine' } },
  ],
};

const VERSION = 'essai-carte';

type Geste = readonly [IdAction, string];

function partie(monde: DefMonde = MONDE): Partie {
  return nouvellePartie(monde, { version: VERSION, graine: 7 });
}

/** Joue l'option du menu dont la cible, ou la destination d'un passage, porte ce nom. */
function jouerGeste(monde: DefMonde, courante: Partie, [action, nom]: Geste): Partie {
  const nomme = (cible: OptionMenu['cible']): boolean => cible.nom === nom || (cible.sorte === 'passage' && cible.vers?.nom === nom);
  const option = observer(monde, courante.etat).menu.find((choix) => choix.action === action && choix.disponible && nomme(choix.cible));
  if (option === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  const resultat = jouer(monde, courante, option.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat.partie;
}

function suite(gestes: readonly Geste[], monde: DefMonde = MONDE, depart: Partie = partie(monde)): Partie {
  return gestes.reduce((courante, geste) => jouerGeste(monde, courante, geste), depart);
}

describe('mémoire du passager (14 §3.1)', () => {
  it('au réveil : la pièce de départ, ses objets et ses liaisons perçues ; le feu d’en face seulement par un passage ouvert', () => {
    const { memoire } = partie().etat;
    expect(memoire.pieces.quai).toEqual({ regard: 0, feu: { vu: false, actions: 0 }, objets: [{ objet: 'carnet' }, { objet: 'capsule' }] });
    // La soute se voit par sa porte ouverte : pas de feu. La forge, derrière une porte fermée, reste sans souvenir.
    expect(memoire.pieces.soute).toEqual({ feu: { vu: false, actions: 0 } });
    expect(memoire.pieces.forge).toBeUndefined();
    expect(memoire.liaisons).toEqual({ qf: false, qs: true, qc: true });
  });

  it('à la fin de chaque action, la pièce actuelle remplace son souvenir ; les autres gardent le leur', () => {
    const { memoire } = suite([['aller', 'soute']]).etat;
    expect(memoire.pieces.soute).toEqual({ regard: 1, feu: { vu: false, actions: 1 }, objets: [{ objet: 'caisse', position: 'mur' }] });
    expect(memoire.pieces.quai).toEqual({ regard: 0, feu: { vu: false, actions: 1 }, objets: [{ objet: 'carnet' }, { objet: 'capsule' }] });
    expect(memoire.liaisons).toMatchObject({ qs: true, sl: true });
  });

  it('K-09 : une porte ouverte sur une pièce en feu jamais visitée en fait voir le feu (D-213)', () => {
    const { memoire } = suite([['ouvrir', 'forge']]).etat;
    expect(memoire.pieces.forge).toEqual({ feu: { vu: true, actions: 1 } });
    expect(memoire.liaisons.qf).toBe(true);
  });

  it('des flammes vues par un passage sans signalétique ne font connaître aucune pièce (OP-03)', () => {
    const brulant: DefMonde = { ...MONDE, pieces: MONDE.pieces.map((piece) => (piece.id === 'local' ? { ...piece, feu: true } : piece)) };
    expect(suite([['aller', 'soute']], brulant).etat.memoire.pieces.local).toBeUndefined();
  });

  it('K-10 : un objet emporté hors de vue reste dans le souvenir jusqu’au prochain regard', () => {
    const soute = suite([['aller', 'soute']]);
    // Une règle du monde emporte le carnet hors de vue (simulé).
    const emporte: Partie = { ...soute, etat: { ...soute.etat, objets: { ...soute.etat.objets, carnet: { type: 'piece', piece: 'local' } } } };
    expect(emporte.etat.memoire.pieces.quai?.objets).toEqual([{ objet: 'carnet' }, { objet: 'capsule' }]);
    expect(jouerGeste(MONDE, emporte, ['aller', 'quai']).etat.memoire.pieces.quai?.objets).toEqual([{ objet: 'capsule' }]);
  });

  it('un regard gratuit ou une action refusée ne touchent pas la mémoire (D-014)', () => {
    const depart = partie();
    const regarder = observer(MONDE, depart.etat).menu.find((choix) => choix.action === 'regarder');
    if (regarder === undefined) throw new Error('Regarder absent du menu.');
    expect(jouer(MONDE, depart, regarder.commande).partie).toBe(depart);
    expect(jouer(MONDE, depart, { action: 'aller', cible: idPublic(MONDE.id, 'lf') }).partie).toBe(depart);
  });

  it('K-08 : la mémoire se rejoue et se reprend à l’identique', () => {
    const fin = suite([['aller', 'soute'], ['aller', 'grille']]);
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(fin)) as unknown, VERSION);
    expect(reprise.etat.memoire).toEqual(fin.etat.memoire);
  });
});
