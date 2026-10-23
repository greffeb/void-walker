import { CHANCE_DESTRUCTION, CHANCE_PANNE, abimerCameras, camerasLues, empreinteEtat, capteurPose, carte, idPublic, jouer, lireMouvement, nouvellePartie, observer, salleDeSurveillance, validerMonde, type DefMonde, type EtatPartie, type Partie } from './index';
import { entier32 } from './rencontre';

// Salle de surveillance (départ, avec le terminal et une cabine), coursive, remise (caméra, créature), salle des machines (caméra),
// cambuse (post-it) ; un passage caché entre la coursive et la remise.
const MONDE: DefMonde = {
  id: 'essai-surveillance',
  depart: 'surveillance',
  pieces: [
    { id: 'surveillance', nom: 'surveillance' },
    { id: 'coursive', nom: 'coursive' },
    { id: 'remise', nom: 'remise' },
    { id: 'machines', nom: 'machines', machines: true },
    { id: 'cambuse', nom: 'cambuse' },
    { id: 'cabine', nom: 'cabine', sousPosition: true },
  ],
  liaisons: [
    { id: 'l-sc', nom: 'porte', entre: ['surveillance', 'coursive'], ouverte: true },
    { id: 'l-cr', nom: 'porte', entre: ['coursive', 'remise'], ouverte: false },
    { id: 'l-cm', nom: 'porte', entre: ['coursive', 'machines'], ouverte: false },
    { id: 'l-cc', nom: 'porte', entre: ['coursive', 'cambuse'], ouverte: false },
    { id: 'l-cache', nom: 'panneau', entre: ['coursive', 'remise'], ouverte: false, cachee: 'coursive' },
    { id: 'l-cab', nom: 'trappe', entre: ['surveillance', 'cabine'], ouverte: true },
  ],
  objets: [
    { id: 'terminal', nom: 'terminal', piece: 'surveillance', portable: false, terminal: true, exige: 'post-it' },
    { id: 'post-it', nom: 'post-it', piece: 'cambuse' },
    { id: 'inter', nom: 'interrupteur', piece: 'machines', machines: 'machines', portable: false },
  ],
  cameras: [{ piece: 'remise' }, { piece: 'machines' }],
  creature: { piece: 'remise' },
};
const pub = (id: string): string => idPublic(MONDE.id, id);
const commande = (action: string, cible: string) => ({ action, cible: pub(cible) });
const debut = (monde: DefMonde = MONDE): Partie => nouvellePartie(monde, { version: 'test-surveillance', graine: 7 });
const avec = (partie: Partie, extra: Partial<EtatPartie>): Partie => ({ ...partie, etat: { ...partie.etat, ...extra } });
const porteur = (piece: string, objet: string): Partie => {
  const partie = debut();
  return avec(partie, { piece, objets: { ...partie.etat.objets, [objet]: { type: 'passager' } } });
};
const connecte = (): Partie => {
  const r = jouer(MONDE, porteur('surveillance', 'post-it'), commande('surveiller', 'terminal'));
  if (r.type !== 'engagee') throw new Error(r.type);
  return r.partie;
};

describe('terminal de surveillance', () => {
  it('sans le post-it, le terminal se refuse et le temps ne passe pas', () => {
    const r = jouer(MONDE, debut(), commande('surveiller', 'terminal'));
    expect(r).toEqual(expect.objectContaining({ type: 'refus', raison: 'sans_mot_de_passe' }));
    expect(r.partie.etat.actions).toBe(0);
    expect(observer(MONDE, debut().etat).menu).toContainEqual(expect.objectContaining({ action: 'surveiller', disponible: false, raison: 'sans_mot_de_passe' }));
  });

  it('post-it en main, la connexion révèle toute la station sauf le passage caché', () => {
    const r = jouer(MONDE, porteur('surveillance', 'post-it'), commande('surveiller', 'terminal'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(r.evenements).toContainEqual({ type: 'terminal_connecte' });
    expect(r.partie.etat.connecte).toBe(true);
    expect(r.partie.etat.actions).toBe(1);
    expect(r.partie.etat.visitees).toEqual(['surveillance']);
    const dessinees = MONDE.pieces.filter((p) => p.sousPosition !== true).map((p) => pub(p.id));
    expect(carte(MONDE, r.partie.etat).pieces.map((p) => p.piece.id)).toEqual(dessinees);
    expect(r.partie.etat.decouvertes).toEqual(['l-sc', 'l-cr', 'l-cm', 'l-cc', 'l-cab']);
    expect(r.partie.etat.decouvertes).not.toContain('l-cache');
    expect(observer(MONDE, r.partie.etat).cameras).toEqual([
      { piece: expect.objectContaining({ id: pub('remise') }), etat: 'mouvement' },
      { piece: expect.objectContaining({ id: pub('machines') }), etat: 'brouille' },
    ]);
  });

  it('les caméras ne se voient que dans la salle, sous-position comprise', () => {
    const partie = connecte();
    expect(observer(MONDE, { ...partie.etat, piece: 'cabine' }).cameras).toHaveLength(2);
    const r = jouer(MONDE, partie, commande('aller', 'l-sc'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(r.partie.etat.piece).toBe('coursive');
    expect(r.evenements).toContainEqual(expect.objectContaining({ type: 'piece_decouverte' }));
    expect(r.partie.etat.visitees).toEqual(['surveillance', 'coursive']);
    expect(observer(MONDE, r.partie.etat).cameras).toBeUndefined();
    expect(observer(MONDE, porteur('surveillance', 'post-it').etat).cameras).toBeUndefined();
  });

  it('une caméra en panne au départ ou en cours de partie reste hs, même en pièce aveugle', () => {
    const panne: DefMonde = { ...MONDE, cameras: [{ piece: 'remise' }, { piece: 'machines', hs: true }] };
    expect(camerasLues(panne, debut(panne).etat)).toEqual([
      { piece: 'remise', etat: 'mouvement' },
      { piece: 'machines', etat: 'hs' },
    ]);
    expect(camerasLues(MONDE, { ...debut().etat, camerasHs: ['remise'] })[0]).toEqual({ piece: 'remise', etat: 'hs' });
  });

  it('machines relancées dans la pièce d\'une caméra : brouillé, jamais calme', () => {
    const arretees = avec(connecte(), { piece: 'machines', arretees: ['machines'] });
    expect(camerasLues(MONDE, arretees.etat)[1]).toEqual({ piece: 'machines', etat: 'calme' });
    const r = jouer(MONDE, arretees, commande('relancer', 'inter'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(camerasLues(MONDE, r.partie.etat)[1]).toEqual({ piece: 'machines', etat: 'brouille' });
  });

  it('une porte enfoncée après la connexion reste fermée sur la carte, jusqu\'au prochain surveiller', () => {
    const partie = connecte();
    const forcee = avec(partie, { liaisons: { ...partie.etat.liaisons, 'l-cr': true }, enfoncees: ['l-cr'] });
    const passage = (etat: EtatPartie) => carte(MONDE, etat).passages.find((p) => p.id === pub('l-cr'));
    expect(passage(forcee.etat)?.ouvert).toBe(false);
    const r = jouer(MONDE, forcee, commande('surveiller', 'terminal'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(passage(r.partie.etat)?.ouvert).toBe(true);
  });

  it('le passage caché n\'apparaît ni sur la carte ni dans les passages', () => {
    const partie = connecte();
    expect(carte(MONDE, partie.etat).passages.map((p) => p.id)).not.toContain(pub('l-cache'));
    const r = jouer(MONDE, partie, commande('aller', 'l-sc'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(observer(MONDE, r.partie.etat).passages.map((p) => p.id)).not.toContain(pub('l-cache'));
    expect(carte(MONDE, r.partie.etat).passages.map((p) => p.id)).not.toContain(pub('l-cache'));
  });

  it('la carte ne montre aucun objet d\'une pièce jamais regardée, mais le feu d\'une pièce en feu', () => {
    const r = jouer(MONDE, avec(porteur('surveillance', 'post-it'), { feu: ['cambuse'] }), commande('surveiller', 'terminal'));
    if (r.type !== 'engagee') throw new Error(r.type);
    const pieces = carte(MONDE, r.partie.etat).pieces;
    const piece = (id: string) => pieces.find((p) => p.piece.id === pub(id));
    expect(piece('machines')?.objets).toEqual([]);
    expect(piece('machines')?.feu).toBeNull();
    expect(piece('cambuse')?.feu).not.toBeNull();
    expect(piece('surveillance')?.objets).toEqual([{ objet: expect.objectContaining({ id: pub('terminal') }), position: null }]);
  });

  it('un souvenir plus riche garde ses objets', () => {
    const partie = porteur('surveillance', 'post-it');
    const vu = avec(partie, { memoire: { ...partie.etat.memoire, pieces: { ...partie.etat.memoire.pieces, machines: { regard: 0, objets: [{ objet: 'inter' }] } } } });
    const r = jouer(MONDE, vu, commande('surveiller', 'terminal'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(r.partie.etat.memoire.pieces.machines).toEqual({ regard: 0, feu: { vu: false, actions: 0 }, objets: [{ objet: 'inter' }] });
  });

  it('lireMouvement suit la règle du capteur, que capteurPose reprend', () => {
    const etat = debut().etat;
    expect(lireMouvement(MONDE, etat, 'remise', false)).toBe('mouvement');
    expect(lireMouvement(MONDE, etat, 'remise', true)).toBe('hs');
    expect(lireMouvement(MONDE, etat, 'machines', false)).toBe('brouille');
    expect(lireMouvement(MONDE, etat, 'cambuse', false)).toBe('calme');
    expect(capteurPose(MONDE, etat)).toBeNull();
  });

  it('salleDeSurveillance : la pièce du terminal, ou null', () => {
    expect(salleDeSurveillance(MONDE)).toBe('surveillance');
    expect(salleDeSurveillance({ ...MONDE, objets: [], cameras: [] })).toBeNull();
  });

  it('un monde sans terminal garde un état sans champ nouveau', () => {
    const etat = debut().etat;
    expect('connecte' in etat).toBe(false);
    expect('camerasHs' in etat).toBe(false);
  });

  it('validerMonde : un terminal fixe à mot de passe, des caméras hors de sa salle', () => {
    expect(validerMonde(MONDE)).toEqual([]);
    const terminal = MONDE.objets[0]!;
    expect(validerMonde({ ...MONDE, objets: [...MONDE.objets, { ...terminal, id: 'terminal-2' }] })).toContain('terminaux multiples.');
    expect(validerMonde({ ...MONDE, objets: [{ ...terminal, portable: true }, ...MONDE.objets.slice(1)] })).toContain('terminal : terminal à qualités incompatibles.');
    expect(validerMonde({ ...MONDE, objets: [{ ...terminal, exige: undefined }, ...MONDE.objets.slice(1)] })).toContain('terminal : terminal à qualités incompatibles.');
    expect(validerMonde({ ...MONDE, objets: [{ ...terminal, appui: true }, ...MONDE.objets.slice(1)] })).toContain('terminal : terminal à qualités incompatibles.');
    expect(validerMonde({ ...MONDE, cameras: [{ piece: 'surveillance' }] })).toContain('surveillance : caméra dans la salle de surveillance.');
    expect(validerMonde({ ...MONDE, cameras: [{ piece: 'nulle-part' }] })).toContain('nulle-part : caméra dans une pièce inconnue.');
    expect(validerMonde({ ...MONDE, cameras: [{ piece: 'remise' }, { piece: 'remise' }] })).toContain('remise : caméra en double.');
    expect(validerMonde({ ...MONDE, objets: MONDE.objets.slice(1) })).toContain('caméras sans terminal.');
  });
});

describe('dans le pas', () => {
  const GRAND: DefMonde = { ...MONDE, rencontre: { rythme: 1 } };
  const tirage = (graine: number, action: number, piece: string): number => entier32(`camera:${graine}:${action}:${piece}`) / 2 ** 32;
  const creatureEn = (piece: string, plus: object = {}): Partial<EtatPartie> => ({ creature: { ...debut().etat.creature!, piece, ...plus } });
  const etatAvec = (extra: Partial<EtatPartie>): EtatPartie => ({ ...debut().etat, piece: 'surveillance', ...extra });
  const graine = (garde: (g: number) => boolean): number => {
    for (let g = 0; g < 20_000; g++) if (garde(g)) return g;
    throw new Error('Pas de graine.');
  };

  it('créature dans la remise hors traque, avant et après : destruction ; en traque, même tirage : rien', () => {
    const g = graine((x) => tirage(x, 1, 'remise') < CHANCE_DESTRUCTION && tirage(x, 1, 'remise') >= CHANCE_PANNE && tirage(x, 1, 'machines') >= CHANCE_PANNE);
    const libre = etatAvec(creatureEn('remise'));
    expect(abimerCameras(GRAND, libre, libre, g, 1).camerasHs).toEqual(['remise']);
    const traque = etatAvec(creatureEn('remise', { contact: true }));
    expect(abimerCameras(GRAND, traque, traque, g, 1).camerasHs).toBeUndefined();
    const entree = etatAvec(creatureEn('coursive'));
    expect(abimerCameras(GRAND, entree, libre, g, 1).camerasHs).toBeUndefined();
  });

  it("une caméra déjà hors service ne tire pas ; les pièces touchées gardent l'ordre du monde", () => {
    const g = graine((x) => tirage(x, 1, 'remise') < CHANCE_PANNE && tirage(x, 1, 'machines') < CHANCE_PANNE);
    const etat = etatAvec(creatureEn('coursive'));
    expect(abimerCameras(GRAND, etat, etat, g, 1).camerasHs).toEqual(['remise', 'machines']);
    const deja = etatAvec({ ...creatureEn('coursive'), camerasHs: ['remise'] });
    expect(abimerCameras(GRAND, deja, deja, g, 1).camerasHs).toEqual(['remise', 'machines']);
  });

  it('dans jouer : la panne tombe sans événement, et le pas qui finit la partie ne tire rien', () => {
    const g = graine((x) => tirage(x, 1, 'remise') < CHANCE_PANNE);
    const attendre = (etat: EtatPartie) => {
      const partie: Partie = { ...nouvellePartie(GRAND, { version: 'test-surveillance', graine: g }), etat };
      const r = jouer(GRAND, partie, observer(GRAND, etat).menu.find((c) => c.action === 'attendre' && c.disponible)!.commande);
      if (r.type !== 'engagee') throw new Error(r.type);
      return r;
    };
    const normal = attendre(etatAvec(creatureEn('coursive', { neutralisee: 'inerte' })));
    expect(normal.partie.etat.camerasHs).toEqual(expect.arrayContaining(['remise']));
    expect(normal.evenements.map((e) => e.type)).not.toContain('capteur');
    const fin = attendre(etatAvec({ ...creatureEn('surveillance', { contact: true }), sante: 'critique' }));
    expect(fin.partie.etat.sante).toBe('vaincu');
    expect(fin.partie.etat.camerasHs).toBeUndefined();
  });

  it('sans rencontre : jamais de camerasHs sur 600 actions', () => {
    let etat = debut().etat;
    for (let i = 0; i < 600; i++) {
      const r = jouer(MONDE, { ...nouvellePartie(MONDE, { version: 'test-surveillance', graine: 11 + i }), etat }, observer(MONDE, etat).menu.find((c) => c.action === 'attendre' && c.disponible)!.commande);
      if (r.type !== 'engagee') throw new Error(r.type);
      etat = r.partie.etat;
      expect(etat.camerasHs).toBeUndefined();
    }
  });

  it('sur 3 000 graines : une panne sur 300 environ en une action sans créature dans la pièce', () => {
    const etat = etatAvec(creatureEn('coursive'));
    let pannes = 0;
    for (let g = 0; g < 3000; g++) pannes += abimerCameras(GRAND, etat, etat, g, 1).camerasHs?.length ?? 0;
    // Deux caméras par graine : la part se compte par tirage.
    expect(pannes / 6000).toBeGreaterThan(0.002);
    expect(pannes / 6000).toBeLessThan(0.005);
  });

  it('un monde sans rencontre a la même empreinte avec ou sans caméra, sur 80 actions', () => {
    const jouerTout = (monde: DefMonde): string => {
      let partie = nouvellePartie(monde, { version: 'test-surveillance', graine: 7 });
      for (let i = 0; i < 80; i++) {
        const r = jouer(monde, partie, observer(monde, partie.etat).menu.find((c) => c.action === 'attendre' && c.disponible)!.commande);
        if (r.type !== 'engagee') throw new Error(r.type);
        partie = r.partie;
      }
      return empreinteEtat(partie.etat);
    };
    const sansCameras: DefMonde = { ...MONDE, cameras: [] };
    expect(jouerTout(MONDE)).toBe(jouerTout(sansCameras));
  });
});
