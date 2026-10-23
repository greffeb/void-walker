import { empreinteEtat, idPublic, jouer, nouvellePartie, rejouer, validerMonde, type DefMonde, type Evenement, type EtatPartie, type Partie } from './index';
import { historique } from './observation';
import { faceRencontre } from './rencontre';
import { SIGNES_ECART, choisirSigne, faitsNeufs, signePermis } from './signes';

// Couloir A-B-C-D-E, rythme 1 : le passager en A, la créature en D, loin. Caméra en panne au départ en C, caméra saine en E ;
// le terminal en B ; la porte A-B est ouverte au départ (lot 4).
const MONDE: DefMonde = {
  id: 'essai-signes',
  depart: 'a',
  pieces: ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, nom: id })),
  liaisons: [
    { id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: true },
    { id: 'bc', nom: 'porte', entre: ['b', 'c'], ouverte: false },
    { id: 'cd', nom: 'porte', entre: ['c', 'd'], ouverte: false },
    { id: 'de', nom: 'porte', entre: ['d', 'e'], ouverte: false },
  ],
  objets: [
    { id: 'terminal', nom: 'terminal', piece: 'b', portable: false, terminal: true, exige: 'post-it' },
    { id: 'post-it', nom: 'post-it', piece: 'a' },
  ],
  cameras: [{ piece: 'c', hs: true }, { piece: 'e' }],
  creature: { piece: 'd' },
  rencontre: { rythme: 1 },
};
const VERSION = 'test-signes';
const attendre = { action: 'attendre', cible: idPublic(MONDE.id, 'a') };
const repos = { indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null };

/** Première graine dont la face de l'action `action` vaut `face`, filtrée par `garde`. */
const graine = (face: number, action: number, garde: (g: number) => boolean = () => true): number => {
  for (let g = 0; g <= 10_000; g++) if (faceRencontre(g, action, 1) === face && garde(g)) return g;
  throw new Error('Aucune graine.');
};
/** Partie à cette graine, juste avant l'action `actions + 1`, la créature posée là. */
const placee = (g: number, piece: string, extra: Partial<EtatPartie> = {}): Partie => {
  const depart = nouvellePartie(MONDE, { version: VERSION, graine: g });
  return { ...depart, etat: { ...depart.etat, creature: { ...repos, piece }, ...extra } };
};
const pas = (partie: Partie): { partie: Partie; evenements: readonly Evenement[] } => {
  const r = jouer(MONDE, partie, attendre);
  if (r.type !== 'engagee') throw new Error(r.type);
  return r;
};
const types = (evenements: readonly Evenement[]): string[] => evenements.map((e) => e.type);

describe('messages d’IA Station sur la face 2 (lot 4)', () => {
  it('le monde d’essai est valide', () => {
    expect(validerMonde(MONDE)).toEqual([]);
  });

  it('face 2, elle loin : IA Station signale sa présence à la place du bruit lointain', () => {
    const { partie, evenements } = pas(placee(graine(2, 1), 'd'));
    expect(evenements).toContainEqual({ type: 'assistance', message: 'signe-1', signe: { sorte: 'presence', piece: { sorte: 'piece', id: idPublic(MONDE.id, 'd'), nom: 'd' } } });
    expect(types(evenements)).not.toContain('bruit_lointain');
    expect(partie.etat.messages.at(-1)).toBe('signe-1');
    expect(partie.etat.signes).toEqual([{ sorte: 'presence', piece: 'd', action: 1 }]);
    expect(historique(MONDE, partie.etat).at(-1)).toEqual({ message: 'signe-1', moment: { type: 'signe' }, signe: { sorte: 'presence', piece: expect.objectContaining({ id: idPublic(MONDE.id, 'd') }) } });
  });

  it('moins de 30 actions après un message, le bruit lointain revient', () => {
    const dit = [{ sorte: 'presence', piece: 'e', action: 1 }] as const;
    const avant = placee(graine(2, SIGNES_ECART), 'd', { actions: SIGNES_ECART - 1, signes: dit });
    expect(signePermis(avant.etat)).toBe(false);
    expect(types(pas(avant).evenements)).toContain('bruit_lointain');
    const apres = placee(graine(2, SIGNES_ECART + 1), 'd', { actions: SIGNES_ECART, signes: dit });
    expect(signePermis(apres.etat)).toBe(true);
    expect(pas(apres).evenements).toContainEqual(expect.objectContaining({ type: 'assistance', message: 'signe-2' }));
  });

  it('après deux messages, plus aucun, même 200 actions plus tard', () => {
    const dits = [{ sorte: 'presence', piece: 'e', action: 1 }, { sorte: 'passage', piece: 'c', action: 40 }] as const;
    const partie = placee(graine(2, 240), 'd', { actions: 239, signes: dits });
    expect(signePermis(partie.etat)).toBe(false);
    const { evenements } = pas(partie);
    expect(types(evenements)).toContain('bruit_lointain');
    expect(types(evenements)).not.toContain('assistance');
  });

  it('une porte forcée pendant la partie est un fait, pas une porte ouverte au départ', () => {
    const depart = placee(0, 'd');
    expect(faitsNeufs(MONDE, depart.etat)).toEqual([{ sorte: 'presence', piece: 'd' }]);
    expect(faitsNeufs(MONDE, { ...depart.etat, enfoncees: ['cd'] })[0]).toEqual({ sorte: 'porte', liaison: 'cd' });
    const g = graine(2, 1, (x) => choisirSigne(faitsNeufs(MONDE, { ...depart.etat, enfoncees: ['cd'] }), x, 1).sorte === 'porte');
    const signe = pas(placee(g, 'd', { enfoncees: ['cd'] })).evenements.find((e) => e.type === 'assistance');
    expect(signe?.type === 'assistance' ? signe.signe : null).toEqual({ sorte: 'porte', liaison: expect.objectContaining({ id: idPublic(MONDE.id, 'cd') }) });
  });

  it('une caméra en panne au départ n’est pas un fait, une caméra perdue en cours de partie en est un', () => {
    const etat = placee(0, 'd').etat;
    expect(faitsNeufs(MONDE, etat).some((f) => f.sorte === 'materiel')).toBe(false);
    expect(faitsNeufs(MONDE, { ...etat, camerasHs: ['e'] })).toContainEqual({ sorte: 'materiel', piece: 'e', appareil: 'camera' });
  });

  it('ses passages encore frais sont des faits, hors de la pièce du passager et de la sienne', () => {
    const etat: EtatPartie = { ...placee(0, 'd').etat, actions: 10, creature: { ...repos, piece: 'd', passages: [{ piece: 'a', action: 9 }, { piece: 'b', action: 3 }, { piece: 'c', action: 10 }] } };
    expect(faitsNeufs(MONDE, etat)).toEqual([{ sorte: 'passage', piece: 'c' }, { sorte: 'presence', piece: 'd' }]);
  });

  it('un même fait n’est jamais redit', () => {
    const signes = [{ sorte: 'presence', piece: 'd', action: 1 }] as const;
    const partie = placee(graine(2, 41), 'd', { actions: 40, signes });
    expect(faitsNeufs(MONDE, partie.etat)).toEqual([]);
    expect(types(pas(partie).evenements)).toContain('bruit_lointain');
    expect(faitsNeufs(MONDE, { ...partie.etat, camerasHs: ['e'], signes: [...signes, { sorte: 'materiel', piece: 'e', appareil: 'camera', action: 2 }] })).toEqual([]);
  });

  it('face 2, elle dans une pièce voisine : le bruit proche, sans message', () => {
    const { partie, evenements } = pas(placee(graine(2, 1), 'b'));
    expect(types(evenements)).toContain('bruit_proche');
    expect(types(evenements)).not.toContain('assistance');
    expect(partie.etat.signes).toBeUndefined();
  });

  it('le rejeu redonne la même empreinte, les mêmes signes et le même historique', () => {
    let trouvee: Partie | null = null;
    for (let g = 0; g < 50 && trouvee === null; g++) {
      let partie = nouvellePartie(MONDE, { version: VERSION, graine: g });
      for (let i = 0; i < 80 && partie.etat.fin === null && partie.etat.sante !== 'vaincu'; i++) partie = pas(partie).partie;
      if ((partie.etat.signes?.length ?? 0) > 0) trouvee = partie;
    }
    if (trouvee === null) throw new Error('Aucune partie avec un message.');
    const { partie } = rejouer(MONDE, trouvee.enregistrement, VERSION);
    expect(empreinteEtat(partie.etat)).toBe(empreinteEtat(trouvee.etat));
    expect(partie.etat.signes).toEqual(trouvee.etat.signes);
    expect(historique(MONDE, partie.etat)).toEqual(historique(MONDE, trouvee.etat));
  });

  it('dans un monde sans rencontre, jamais de signes', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- le même monde, sans dé de rencontre.
    const { rencontre, ...calme } = MONDE;
    let partie = nouvellePartie(calme, { version: VERSION, graine: 3 });
    for (let i = 0; i < 300; i++) {
      const r = jouer(calme, partie, attendre);
      if (r.type !== 'engagee') throw new Error(r.type);
      partie = r.partie;
      expect(partie.etat.signes).toBeUndefined();
    }
  });
});
