import { idPublic, jouer, nouvellePartie, observer, reprendrePartie, type CartePublique, type DefMonde, type IdAction, type OptionMenu, type Partie, type PassageCarte, type PieceCarte, type RefObjet, type RefPiece, type RefPosition } from './index';

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

// Une station qui peut perdre son air : la baie a un hublot.
//   ┌───────┬───────┐
//   │  sas  │  baie │   porte sb fermée
//   ├───────┴───────┤
//   │    couloir    │   porte sc fermée ; grille cb non étanche, fermée, entre le couloir et la baie
//   └───────────────┘
const VIDE: DefMonde = {
  id: 'essai-carte-vide',
  depart: 'sas',
  pieces: [
    { id: 'sas', nom: 'sas', plan: { x: 0, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'baie', nom: 'baie', plan: { x: 3, y: 0, largeur: 3, hauteur: 2 } },
    { id: 'couloir', nom: 'couloir', plan: { x: 0, y: 2, largeur: 6, hauteur: 2 } },
  ],
  liaisons: [
    { id: 'sb', nom: 'porte', entre: ['sas', 'baie'], ouverte: false },
    { id: 'sc', nom: 'porte', entre: ['sas', 'couloir'], ouverte: false },
    { id: 'cb', nom: 'grille', entre: ['couloir', 'baie'], ouverte: false, etroite: true, nonEtanche: true },
  ],
  objets: [{ id: 'hublot', nom: 'hublot', piece: 'baie', portable: false, vitrageExterieur: true }],
};

const ref = (id: string, monde: DefMonde = MONDE): RefPiece => ({
  sorte: 'piece',
  id: idPublic(monde.id, id),
  nom: monde.pieces.find((piece) => piece.id === id)?.nom ?? id,
});
const objet = (id: string): RefObjet => ({ sorte: 'objet', id: idPublic(MONDE.id, id), nom: MONDE.objets.find((candidat) => candidat.id === id)?.nom ?? id });
const position = (id: string): RefPosition => ({ sorte: 'position', id: idPublic(MONDE.id, id), nom: id });

function carteDe(courante: Partie, monde: DefMonde = MONDE): CartePublique {
  return observer(monde, courante.etat).carte;
}

function pieceDe(carte: CartePublique, id: string, monde: DefMonde = MONDE): PieceCarte | undefined {
  return carte.pieces.find((vue) => vue.piece.id === idPublic(monde.id, id));
}

function passageDe(carte: CartePublique, id: string): PassageCarte | undefined {
  return carte.passages.find((vue) => vue.id === idPublic(MONDE.id, id));
}

describe('carte publique (14 §3.4)', () => {
  it('K-01 : au réveil, la pièce actuelle et ce que montrent ses sorties, rien d’autre ; la capsule arrimée dehors', () => {
    expect(carteDe(partie())).toEqual({
      pieces: [
        {
          piece: ref('quai'),
          statut: 'actuelle',
          rect: { x: 0, y: 0, largeur: 3, hauteur: 2 },
          regard: 'instant',
          feu: null,
          vide: false,
          creature: null,
          objets: [
            { objet: objet('carnet'), position: null },
            { objet: objet('capsule'), position: null },
          ],
          distance: 0,
        },
        { piece: ref('forge'), statut: 'connue', rect: { x: 3, y: 0, largeur: 3, hauteur: 2 }, regard: null, feu: null, vide: false, creature: null, objets: [], distance: 1 },
        { piece: ref('soute'), statut: 'connue', rect: { x: 0, y: 2, largeur: 3, hauteur: 2 }, regard: null, feu: null, vide: false, creature: null, objets: [], distance: 1 },
      ],
      passages: [
        {
          id: idPublic(MONDE.id, 'qf'),
          nom: 'porte',
          vuDepuis: [ref('quai')],
          entre: [ref('quai'), ref('forge')],
          ouvert: false,
          dessin: 'porte',
          voyant: null,
          emplacement: { type: 'mur', axe: 'v', ligne: 3, rang: 0 },
        },
        {
          id: idPublic(MONDE.id, 'qs'),
          nom: 'porte',
          vuDepuis: [ref('quai')],
          entre: [ref('quai'), ref('soute')],
          ouvert: true,
          dessin: 'porte',
          voyant: null,
          emplacement: { type: 'mur', axe: 'h', ligne: 2, rang: 1 },
        },
      ],
      capsules: [{ objet: objet('capsule'), piece: ref('quai'), pan: { cote: 'haut', debut: 0, fin: 3 } }],
      aBord: null,
    });
  });

  it('K-09 : la forge, connue par sa porte et jamais visitée, porte le feu vu par la porte ouverte', () => {
    expect(pieceDe(carteDe(suite([['ouvrir', 'forge']])), 'forge')).toMatchObject({ statut: 'connue', feu: 'instant', regard: null });
  });

  it('K-12 : un passage sans signalétique montre « ? », puis sa destination une fois franchi ; distance en passages connus', () => {
    const soute = carteDe(suite([['aller', 'soute']]));
    expect(passageDe(soute, 'sl')).toMatchObject({ vuDepuis: [ref('soute')], entre: null, dessin: 'tirets', emplacement: { type: 'mur', axe: 'v', ligne: 3, rang: 2 } });
    expect(pieceDe(soute, 'local')).toBeUndefined();
    const local = carteDe(suite([['aller', 'soute'], ['aller', 'grille']]));
    expect(passageDe(local, 'sl')).toMatchObject({ vuDepuis: [ref('soute'), ref('local')], entre: [ref('soute'), ref('local')] });
    expect(local.pieces.map((vue) => [vue.piece.nom, vue.statut, vue.distance])).toEqual([
      ['quai', 'visitee', 2],
      ['forge', 'connue', 1],
      ['soute', 'visitee', 1],
      ['local', 'actuelle', 0],
    ]);
  });

  it('passage sans signalétique entre deux pièces visitées, jamais franchi : « ? » des deux côtés', () => {
    const froid: DefMonde = { ...MONDE, pieces: MONDE.pieces.map((piece) => (piece.id === 'forge' ? { ...piece, feu: false } : piece)) };
    const fin = suite(
      [
        ['aller', 'soute'],
        ['aller', 'quai'],
        ['ouvrir', 'forge'],
        ['aller', 'forge'],
        ['ouvrir', 'local'],
        ['aller', 'local'],
      ],
      froid,
    );
    expect(passageDe(carteDe(fin, froid), 'sl')).toMatchObject({ vuDepuis: [ref('soute'), ref('local')], entre: null });
  });

  it('sous-position : dans la cabine, la carte reste sur le quai, sans la cabine ni son écoutille (C-02 §2)', () => {
    const carte = carteDe(suite([['aller', 'cabine']]));
    expect(pieceDe(carte, 'quai')?.statut).toBe('actuelle');
    expect(carte.pieces.some((vue) => vue.piece.nom === 'cabine')).toBe(false);
    expect(passageDe(carte, 'qc')).toBeUndefined();
    // La carte dit seulement que le passager est à bord, sans dessiner la cabine.
    expect(carte.aBord).toEqual(ref('cabine'));
  });

  it('créature : marquée là où elle a été vue en dernier, avec son ancienneté ; jamais dans une pièce inconnue (OP-05)', () => {
    const depart = partie();
    const vue = (piece: string, depuis: number): Partie => ({ ...depart, etat: { ...depart.etat, reperes: { vue: { piece, depuis }, entendue: null } } });
    expect(pieceDe(carteDe(vue('soute', 3)), 'soute')?.creature).toBe('moment');
    expect(carteDe(vue('local', 0))).toEqual(carteDe(depart));
  });

  it('voyants (OP-04) : l’air des pièces connues se lit à jour sur les portes étanches d’une station qui peut le perdre', () => {
    const debut = partie(VIDE);
    expect(carteDe(debut, VIDE).passages.map((vue) => vue.voyant)).toEqual(['air', 'air']);
    const perce: Partie = { ...debut, etat: { ...debut.etat, breches: ['hublot'] } };
    const carte = carteDe(perce, VIDE);
    expect(carte.passages.map((vue) => vue.voyant)).toEqual(['vide', 'vide']);
    expect(carte.pieces.map((vue) => [vue.piece.nom, vue.vide])).toEqual([
      ['sas', false],
      ['baie', true],
      ['couloir', true],
    ]);
    expect(carteDe(partie()).passages.every((vue) => vue.voyant === null)).toBe(true);
  });

  it('voyant (VP-03) : une porte dit l’air de la pièce d’en face, pas celui de la pièce d’où on la lit', () => {
    const debut = partie(VIDE);
    // Le passager, en combinaison dans la baie percée, lit la porte du sas : de l'autre côté, le sas a son air.
    const baie: Partie = { ...debut, etat: { ...debut.etat, piece: 'baie', visitees: ['sas', 'baie'], breches: ['hublot'] } };
    const carte = carteDe(baie, VIDE);
    expect(carte.passages.find((vue) => vue.id === idPublic(VIDE.id, 'sb'))?.voyant).toBe('air');
    expect(carte.pieces.map((vue) => [vue.piece.nom, vue.vide])).toEqual([
      ['sas', false],
      ['baie', true],
      ['couloir', true],
    ]);
  });

  it('conduit sans signalétique : son seul bout se voit ; une fois franchi, tout son tracé', () => {
    const CONDUIT: DefMonde = {
      id: 'essai-carte-conduit',
      depart: 'a',
      pieces: [
        { id: 'a', nom: 'a', plan: { x: 0, y: 0, largeur: 2, hauteur: 2 } },
        { id: 'b', nom: 'b', plan: { x: 4, y: 0, largeur: 2, hauteur: 2 } },
      ],
      liaisons: [
        { id: 'ab', nom: 'conduit', entre: ['a', 'b'], ouverte: true, etroite: true, sansSignaletique: true, plan: { trace: [{ x: 2, y: 0 }, { x: 3, y: 0 }] } },
      ],
      objets: [],
    };
    const debut = partie(CONDUIT);
    expect(carteDe(debut, CONDUIT).passages[0]?.emplacement).toEqual({ type: 'mur', axe: 'v', ligne: 2, rang: 0 });
    const passe = jouerGeste(CONDUIT, debut, ['aller', 'conduit']);
    expect(carteDe(passe, CONDUIT).passages[0]?.emplacement).toEqual({ type: 'trace', cases: [{ x: 2, y: 0 }, { x: 3, y: 0 }] });
  });

  it('K-11 : une, deux puis six actions après le dernier regard', () => {
    let courante = suite([['aller', 'soute']]);
    const paliers = [pieceDe(carteDe(courante), 'quai')?.regard];
    for (const geste of [
      ['fermer', 'quai'],
      ['ouvrir', 'quai'],
      ['fermer', 'quai'],
      ['ouvrir', 'quai'],
      ['fermer', 'quai'],
    ] as const) {
      courante = jouerGeste(MONDE, courante, geste);
      paliers.push(pieceDe(carteDe(courante), 'quai')?.regard);
    }
    expect(paliers).toEqual(['instant', 'moment', 'moment', 'moment', 'moment', 'longtemps']);
  });

  it('K-02 : le feu qui gagne une pièce visitée hors de vue n’apparaît qu’au regard suivant', () => {
    const quai = suite([['aller', 'soute'], ['aller', 'quai'], ['fermer', 'soute']]);
    // Le feu gagne la soute derrière sa porte fermée (simulé) : la carte garde l'ancien état.
    const brule: Partie = { ...quai, etat: { ...quai.etat, feu: ['forge', 'soute'] } };
    expect(pieceDe(carteDe(brule), 'soute')?.feu).toBeNull();
    expect(pieceDe(carteDe(jouerGeste(MONDE, brule, ['ouvrir', 'soute'])), 'soute')?.feu).toBe('instant');
  });

  it('K-10 : la carte garde l’ancienne position d’un objet déplacé hors de vue', () => {
    const quai = suite([['aller', 'soute'], ['aller', 'quai']]);
    const deplace: Partie = { ...quai, etat: { ...quai.etat, objets: { ...quai.etat.objets, caisse: { type: 'piece', piece: 'soute', position: 'coin' } } } };
    expect(pieceDe(carteDe(deplace), 'soute')?.objets).toEqual([{ objet: objet('caisse'), position: position('mur') }]);
    expect(pieceDe(carteDe(jouerGeste(MONDE, deplace, ['aller', 'soute'])), 'soute')?.objets).toEqual([{ objet: objet('caisse'), position: position('coin') }]);
  });

  it('K-13 : deux mondes qui ne diffèrent que par une pièce jamais connue donnent la même carte, octet pour octet', () => {
    const plus: DefMonde = {
      ...MONDE,
      pieces: [...MONDE.pieces, { id: 'reserve', nom: 'reserve', plan: { x: 6, y: 0, largeur: 2, hauteur: 2 } }],
      liaisons: [...MONDE.liaisons, { id: 'fr', nom: 'porte', entre: ['forge', 'reserve'], ouverte: false }],
    };
    const gestes: readonly Geste[] = [['aller', 'soute'], ['aller', 'grille']];
    expect(JSON.stringify(carteDe(suite(gestes, plus), plus))).toBe(JSON.stringify(carteDe(suite(gestes))));
    expect(JSON.stringify(carteDe(partie(plus), plus))).toBe(JSON.stringify(carteDe(partie())));
  });

  it('K-05 : vu de son côté caché, un passage caché ne laisse aucune trace sur la carte', () => {
    const sansPanneau: DefMonde = { ...MONDE, liaisons: MONDE.liaisons.filter((liaison) => liaison.id !== 'pn') };
    const gestes: readonly Geste[] = [['aller', 'soute'], ['aller', 'grille']];
    expect(carteDe(suite(gestes))).toEqual(carteDe(suite(gestes, sansPanneau), sansPanneau));
  });

  it('K-08 : la reprise redonne la même carte', () => {
    const fin = suite([['aller', 'soute'], ['aller', 'grille']]);
    const reprise = reprendrePartie(MONDE, JSON.parse(JSON.stringify(fin)) as unknown, VERSION);
    expect(carteDe(reprise)).toEqual(carteDe(fin));
  });
});
