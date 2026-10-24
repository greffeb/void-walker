import {
  aRaconter,
  recitEcoute,
  ecouterPortes,
  empreinteEtat,
  faceEcoute,
  faceRencontre,
  jouer,
  nouvellePartie,
  observer,
  rejouer,
  type DefMonde,
  type EtatPartie,
  type Evenement,
  type Partie,
} from './index';

// Pièce du joueur 'a' ; portes : af (fermée, vers f), ao (ouverte, vers o), am (vers la salle des machines m), ac (vers la chambre froide c).
const MONDE: DefMonde = {
  id: 'essai-ecoute',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'salle_a' },
    { id: 'f', nom: 'salle_f' },
    { id: 'o', nom: 'salle_o' },
    { id: 'm', nom: 'salle_m', machines: true },
    { id: 'c', nom: 'salle_c', froide: true },
  ],
  liaisons: [
    { id: 'af', nom: 'porte_af', entre: ['a', 'f'], ouverte: false },
    { id: 'ao', nom: 'porte_ao', entre: ['a', 'o'], ouverte: true },
    { id: 'am', nom: 'porte_am', entre: ['a', 'm'], ouverte: false },
    { id: 'ac', nom: 'porte_ac', entre: ['a', 'c'], ouverte: false },
  ],
  objets: [],
  creature: { piece: 'f' },
};

function etatAvec(creature: Partial<NonNullable<EtatPartie['creature']>> | null, changement: Partial<EtatPartie> = {}): EtatPartie {
  const base = nouvellePartie(MONDE, { version: 'ecoute-1', graine: 7 }).etat;
  return { ...base, ...changement, creature: creature === null ? null : { ...base.creature!, ...creature } };
}

const ACTIONS = Array.from({ length: 600 }, (_, i) => i);
const jets = (etat: EtatPartie, liaison: string): string[] => ACTIONS.map((i) => ecouterPortes(MONDE, etat, 7, i)[liaison]!);

describe('ecouterPortes', () => {
  it('jamais net sans elle ; vague parfois ; le reste est rien', () => {
    const etat = etatAvec({ piece: 'o' });
    const vus = new Set(ACTIONS.map((graine) => ecouterPortes(MONDE, etat, graine, 1)['af']));
    expect([...vus].sort()).toEqual(['rien', 'vague']);
  });
  it('sans elle, la porte répond pareil à chaque action de la partie (D-344, revue finale)', () => {
    const etat = etatAvec({ piece: 'o' });
    for (const graine of [0, 1, 7, 42, 1234]) {
      const face = faceEcoute(graine, undefined, 'af');
      const attendu = face <= 1 ? 'vague' : 'rien';
      expect(new Set(ACTIONS.map((i) => ecouterPortes(MONDE, etat, graine, i)['af']))).toEqual(new Set([attendu]));
    }
  });
  it('porte fermée avec elle : net et vague, environ la moitié de net', () => {
    const r = jets(etatAvec({ piece: 'f' }), 'af');
    expect(new Set(r)).toEqual(new Set(['net', 'vague', 'rien']));
    const part = r.filter((x) => x === 'net').length / r.length;
    expect(part).toBeGreaterThan(0.4);
    expect(part).toBeLessThan(0.6);
  });
  it('porte ouverte avec elle : jamais rien, et la même porte change de table en s\'ouvrant', () => {
    const ouverte = etatAvec({ piece: 'f' }, { liaisons: { ...etatAvec(null).liaisons, af: true } });
    const r = jets(ouverte, 'af');
    expect(r).not.toContain('rien');
    expect(r).toContain('net');
    expect(jets(etatAvec({ piece: 'f' }), 'af')).toContain('rien');
  });
  it('machines et froid constants', () => {
    const etat = etatAvec({ piece: 'f' });
    expect(new Set(jets(etat, 'am'))).toEqual(new Set(['machines']));
    expect(new Set(jets(etat, 'ac'))).toEqual(new Set(['froid']));
  });
  it('inerte : jamais net ; alcôve : présente', () => {
    expect(jets(etatAvec({ piece: 'f', neutralisee: 'inerte' }), 'af')).not.toContain('net');
    expect(jets(etatAvec({ piece: 'f', alcove: true }), 'af')).toContain('net');
  });
  it('dans une salle des machines en marche : rien à entendre', () => {
    expect(ecouterPortes(MONDE, etatAvec({ piece: 'f' }, { piece: 'm' }), 7, 1)).toEqual({});
  });
  it('déterministe', () => {
    const etat = etatAvec({ piece: 'f' });
    expect(ecouterPortes(MONDE, etat, 7, 42)).toEqual(ecouterPortes(MONDE, etat, 7, 42));
    expect(faceEcoute(7, 42, 'af')).toBe(faceEcoute(7, 42, 'af'));
  });
});

describe('aRaconter (lot 2, maquette ecouter.html)', () => {
  it('première attente : tout', () => {
    expect(aRaconter(undefined, { a: 'rien', m: 'machines' })).toEqual([{ liaison: 'a', entendu: 'rien' }, { liaison: 'm', entendu: 'machines' }]);
  });
  it('rien de changé : rien ; machines et froid jamais redits', () => {
    expect(aRaconter({ a: 'rien', m: 'machines', f: 'froid' }, { a: 'rien', m: 'machines', f: 'froid' })).toEqual([]);
  });
  it('net redit en « toujours » ; net puis rien : « plus rien »', () => {
    expect(aRaconter({ a: 'net' }, { a: 'net' })).toEqual([{ liaison: 'a', entendu: 'toujours' }]);
    expect(aRaconter({ a: 'net' }, { a: 'rien' })).toEqual([{ liaison: 'a', entendu: 'plus_rien' }]);
    expect(aRaconter({ a: 'vague' }, { a: 'rien' })).toEqual([{ liaison: 'a', entendu: 'plus_rien' }]);
  });
  it('autre changement et liaison nouvelle : tels quels', () => {
    expect(aRaconter({ a: 'rien' }, { a: 'vague', b: 'net' })).toEqual([{ liaison: 'a', entendu: 'vague' }, { liaison: 'b', entendu: 'net' }]);
  });
});

describe('recitEcoute (#261, #266)', () => {
  it('première attente : les silences ensemble, les autres à part', () => {
    expect(recitEcoute(undefined, { a: 'rien', b: 'rien', c: 'vague' })).toEqual([
      { sorte: 'groupe', liaisons: ['a', 'b'], entendu: 'rien', toutes: false },
      { sorte: 'une', liaison: 'c', entendu: 'vague' },
    ]);
    expect(recitEcoute(undefined, { a: 'rien', m: 'machines' })).toEqual([
      { sorte: 'une', liaison: 'a', entendu: 'rien' },
      { sorte: 'une', liaison: 'm', entendu: 'machines' },
    ]);
  });
  it('toutes à partir de quatre, de quatre à douze', () => {
    expect(recitEcoute(undefined, { a: 'rien', b: 'rien', c: 'rien', d: 'rien' })).toEqual([{ sorte: 'groupe', liaisons: ['a', 'b', 'c', 'd'], entendu: 'rien', toutes: true }]);
    expect(recitEcoute(undefined, { a: 'rien', b: 'rien', c: 'rien' })).toEqual([{ sorte: 'groupe', liaisons: ['a', 'b', 'c'], entendu: 'rien', toutes: false }]);
    const treize = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`l${i}`, 'rien' as const]));
    expect(recitEcoute(undefined, treize)).toEqual([expect.objectContaining({ sorte: 'groupe', toutes: false })]);
  });
  it('rien de changé : le rappel ; une porte change : elle, puis les autres', () => {
    expect(recitEcoute({ a: 'rien', b: 'vague' }, { a: 'rien', b: 'vague' })).toEqual([{ sorte: 'rappel', autres: false }]);
    expect(recitEcoute({ a: 'rien', b: 'rien' }, { a: 'net', b: 'rien' })).toEqual([{ sorte: 'une', liaison: 'a', entendu: 'net' }, { sorte: 'rappel', autres: true }]);
  });
  it('une seule porte inchangée : le rappel la nomme', () => {
    expect(recitEcoute({ a: 'vague' }, { a: 'vague' })).toEqual([{ sorte: 'rappel', autres: false, liaison: 'a' }]);
  });
  it('toutes les portes dites : pas de rappel', () => {
    expect(recitEcoute({ a: 'net' }, { a: 'net' })).toEqual([{ sorte: 'une', liaison: 'a', entendu: 'toujours' }]);
  });
  it('plusieurs « plus rien » ensemble, jamais toutes', () => {
    expect(recitEcoute({ a: 'net', b: 'vague', c: 'rien' }, { a: 'rien', b: 'rien', c: 'rien' })).toEqual([
      { sorte: 'groupe', liaisons: ['a', 'b'], entendu: 'plus_rien', toutes: false },
      { sorte: 'rappel', autres: true },
    ]);
  });
});

describe('dans le pas', () => {
  const GRAND: DefMonde = { ...MONDE, rencontre: { rythme: 1 } };
  const VERSION = 'ecoute-1';
  /** Premières graines dont le dé de rencontre ne bouge ni ne signale rien (faces 3 à 6) sur `actions` actions, filtrées par `garde`. */
  const grainesCalmes = (combien: number, actions: number, garde: (graine: number) => boolean = () => true): number[] => {
    const trouvees: number[] = [];
    for (let graine = 0; graine <= 20_000 && trouvees.length < combien; graine++) {
      const calme = Array.from({ length: actions }, (_, i) => faceRencontre(graine, i + 1, 1) ?? 0).every((face) => face >= 3);
      if (calme && garde(graine)) trouvees.push(graine);
    }
    if (trouvees.length < combien) throw new Error('Pas assez de graines.');
    return trouvees;
  };
  const graineCalme = (actions: number, garde?: (graine: number) => boolean): number => grainesCalmes(1, actions, garde)[0]!;
  /** Joue l'option du menu `action` sur la cible nommée `nom` (passage nommé par lui-même ou sa destination). */
  const pas = (monde: DefMonde, partie: Partie, action: string, nom: string): { partie: Partie; evenements: readonly Evenement[] } => {
    const option = observer(monde, partie.etat).menu.find(
      (choix) => choix.action === action && choix.disponible && (choix.cible.nom === nom || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === nom)),
    );
    if (option === undefined) throw new Error(`Option ${action} ${nom} absente.`);
    const resultat = jouer(monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
    return resultat;
  };
  const attendre = (monde: DefMonde, partie: Partie) => pas(monde, partie, 'attendre', monde.pieces.find((p) => p.id === partie.etat.piece)?.nom ?? '');
  // Porte fermée avec elle derrière : net 1-3, vague 4-5, rien 6 ; porte ouverte sans elle : vague 1, rien 2-6.
  const resultatAf = (face: number): string => (face <= 3 ? 'net' : face <= 5 ? 'vague' : 'rien');
  const resultatAo = (face: number): string => (face === 1 ? 'vague' : 'rien');
  // Elle loin, dans 'l', derrière 'f' : aucune porte de 'a' ne l'a derrière elle.
  const LOIN: DefMonde = {
    ...GRAND,
    pieces: [...GRAND.pieces, { id: 'l', nom: 'salle_l' }],
    liaisons: [...GRAND.liaisons, { id: 'fl', nom: 'porte_fl', entre: ['f', 'l'], ouverte: false }],
    creature: { piece: 'l' },
  };

  it('première attente : une écoute par porte, l’attente en tête', () => {
    const graine = graineCalme(1);
    const { evenements } = attendre(GRAND, nouvellePartie(GRAND, { version: VERSION, graine }));
    expect(evenements[0]).toEqual({ type: 'attente' });
    const ecoutes = evenements.slice(1);
    expect(ecoutes.map((e) => e.type)).toEqual(['ecoute', 'ecoute', 'ecoute', 'ecoute']);
    expect(ecoutes.map((e) => (e.type === 'ecoute' ? [e.passage.nom, e.entendu] : null))).toEqual([
      ['porte_af', resultatAf(faceEcoute(graine, 1, 'af'))],
      ['porte_ao', resultatAo(faceEcoute(graine, undefined, 'ao'))],
      ['porte_am', 'machines'],
      ['porte_ac', 'froid'],
    ]);
  });

  it('deuxième attente sans changement : l’attente et le rappel', () => {
    // Seule la porte qui l'a derrière elle tire à chaque action ; la porte ouverte sans elle ne change pas (D-344).
    const graine = graineCalme(2, (g) => {
      const af = [1, 2].map((a) => resultatAf(faceEcoute(g, a, 'af')));
      return af[0] !== 'net' && af[0] === af[1];
    });
    const premier = attendre(GRAND, nouvellePartie(GRAND, { version: VERSION, graine }));
    const second = attendre(GRAND, premier.partie);
    expect(second.evenements).toEqual([{ type: 'attente' }, { type: 'ecoute_rappel', autres: false }]);
    expect(second.partie.etat.ecoutees).toEqual(premier.partie.etat.ecoutees);
  });

  it('sans elle derrière aucune porte : après la première, chaque attente rend l’attente et le rappel (#261)', () => {
    for (const graine of grainesCalmes(5, 12)) {
      let partie = attendre(LOIN, nouvellePartie(LOIN, { version: VERSION, graine })).partie;
      for (let i = 0; i < 11; i++) {
        const suivant = attendre(LOIN, partie);
        expect(suivant.evenements).toEqual([{ type: 'attente' }, { type: 'ecoute_rappel', autres: false }]);
        partie = suivant.partie;
      }
    }
  });

  it('face 2 dans la pièce voisine : le bruit proche, pas d’écoute, la dernière écoute gardée ; le bruit lointain écoute', () => {
    const proche = grainesCalmes(1, 1, (g) => faceRencontre(g, 2, 1) === 2)[0]!;
    const premier = attendre(GRAND, nouvellePartie(GRAND, { version: VERSION, graine: proche }));
    const second = attendre(GRAND, premier.partie);
    expect(second.evenements.map((e) => e.type)).toEqual(['attente', 'bruit_proche']);
    expect(second.partie.etat.ecoutees).toEqual(premier.partie.etat.ecoutees);
    const lointain = grainesCalmes(1, 0, (g) => faceRencontre(g, 1, 1) === 2)[0]!;
    // IA Station a déjà dit ses deux messages : le bruit lointain reste (lot 4).
    const loin = nouvellePartie(LOIN, { version: VERSION, graine: lointain });
    const muette = { ...loin, etat: { ...loin.etat, signes: [{ sorte: 'presence', piece: 'a', action: 0 }, { sorte: 'presence', piece: 'b', action: 0 }] as const } };
    const { evenements } = attendre(LOIN, muette);
    // Les portes silencieuses se disent ensemble (D-363) : une écoute ou un groupe par phrase.
    const types = (liste: readonly Evenement[]): string[] => liste.map((e) => (e.type === 'ecoute_groupee' ? 'ecoute' : e.type));
    expect(types(evenements).slice(0, 3)).toEqual(['attente', 'bruit_lointain', 'ecoute']);
    expect(new Set(types(evenements).slice(2))).toEqual(new Set(['ecoute']));
    // Sinon, il parle à la place du bruit lointain, et l'écoute suit de même.
    const dits = types(attendre(LOIN, loin).evenements);
    expect(dits.slice(0, 3)).toEqual(['attente', 'assistance', 'ecoute']);
    expect(new Set(dits.slice(2))).toEqual(new Set(['ecoute']));
  });

  it('un net pose le repère BRUIT sur sa porte, et se redit « toujours »', () => {
    const graine = graineCalme(2, (g) => resultatAf(faceEcoute(g, 1, 'af')) === 'net' && resultatAf(faceEcoute(g, 2, 'af')) === 'net');
    const premier = attendre(GRAND, nouvellePartie(GRAND, { version: VERSION, graine }));
    expect(premier.partie.etat.reperes.entendue).toEqual({ piece: 'f', par: 'af' });
    const second = attendre(GRAND, premier.partie);
    expect(second.evenements).toContainEqual(expect.objectContaining({ type: 'ecoute', entendu: 'toujours' }));
    expect(second.partie.etat.reperes.entendue).toEqual({ piece: 'f', par: 'af' });
  });

  it('attendre, aller, attendre : l’écoute est oubliée en bougeant, puis tout est redit', () => {
    const graine = graineCalme(3);
    const premier = attendre(GRAND, nouvellePartie(GRAND, { version: VERSION, graine }));
    expect(premier.partie.etat.ecoutees).toBeDefined();
    const parti = pas(GRAND, premier.partie, 'aller', 'salle_o');
    expect(parti.partie.etat).not.toHaveProperty('ecoutees');
    const ailleurs = attendre(GRAND, parti.partie);
    expect(ailleurs.evenements.map((e) => e.type)).toEqual(['attente', 'ecoute']);
    expect(ailleurs.evenements.some((e) => e.type === 'ecoute_rappel')).toBe(false);
  });

  it('sans rencontre : rien ne change', () => {
    const { partie, evenements } = attendre(MONDE, nouvellePartie(MONDE, { version: VERSION, graine: 7 }));
    expect(evenements).toEqual([{ type: 'attente' }]);
    expect(partie.etat).not.toHaveProperty('ecoutees');
  });

  it('rejouer dix attentes : même empreinte, mêmes tirages que sans rencontre', () => {
    const graine = graineCalme(10);
    const dix = (monde: DefMonde): Partie => {
      let partie = nouvellePartie(monde, { version: VERSION, graine });
      for (let i = 0; i < 10; i++) partie = attendre(monde, partie).partie;
      return partie;
    };
    const grande = dix(GRAND);
    const rejouee = rejouer(GRAND, grande.enregistrement, VERSION).partie;
    expect(empreinteEtat(rejouee.etat)).toBe(empreinteEtat(grande.etat));
    expect(grande.enregistrement.actions.map((e) => e.tirages)).toEqual(dix(MONDE).enregistrement.actions.map((e) => e.tirages));
  });

  it('attendre, regarder, attendre : Regarder ne coûte rien, l’écoute est gardée, le rappel vient (#261)', () => {
    const graine = graineCalme(2, (g) => resultatAf(faceEcoute(g, 1, 'af')) === resultatAf(faceEcoute(g, 2, 'af')) && resultatAf(faceEcoute(g, 1, 'af')) !== 'net');
    const premier = attendre(GRAND, nouvellePartie(GRAND, { version: VERSION, graine }));
    const regard = observer(GRAND, premier.partie.etat).menu.find((choix) => choix.action === 'regarder' && choix.disponible);
    if (regard === undefined) throw new Error('Regarder absent.');
    const vu = jouer(GRAND, premier.partie, regard.commande);
    expect(vu.type).toBe('consultation');
    const second = attendre(GRAND, vu.partie);
    expect(second.evenements).toEqual([{ type: 'attente' }, { type: 'ecoute_rappel', autres: false }]);
  });

  it('dans une salle des machines en marche : « le vacarme couvre tout » à chaque attente', () => {
    const machines: DefMonde = { ...GRAND, depart: 'm' };
    const premier = attendre(machines, nouvellePartie(machines, { version: VERSION, graine: graineCalme(2) }));
    expect(premier.evenements).toEqual([{ type: 'attente', vacarme: true }, { type: 'ecoute_couverte' }]);
    expect(attendre(machines, premier.partie).evenements).toEqual([{ type: 'attente', vacarme: true }, { type: 'ecoute_couverte' }]);
  });
});
