import { CHANCE_DESTRUCTION, CHANCE_PANNE, capteurPose, empreinteEtat, faceRencontre, idPublic, jouer, nouvellePartie, observer, rejouer, tirageCapteur, validerMonde, type DefMonde, type EtatPartie, type Evenement, type Partie } from './index';

// Remise 'r' (départ), coursive 'k', salle des machines 'm', chambre froide 'f', et un cagibi 's' en sous-position sous 'k'.
const MONDE: DefMonde = {
  id: 'essai-capteur',
  depart: 'r',
  pieces: [
    { id: 'r', nom: 'remise' },
    { id: 'k', nom: 'coursive' },
    { id: 'm', nom: 'machines', machines: true },
    { id: 'f', nom: 'froide', froide: true },
    { id: 's', nom: 'cagibi', sousPosition: true },
  ],
  liaisons: [
    { id: 'rk', nom: 'porte', entre: ['r', 'k'], ouverte: true },
    { id: 'km', nom: 'porte', entre: ['k', 'm'], ouverte: true },
    { id: 'kf', nom: 'porte', entre: ['k', 'f'], ouverte: true },
    { id: 'ks', nom: 'trappe', entre: ['k', 's'], ouverte: true },
  ],
  objets: [{ id: 'capteur', nom: 'capteur', piece: 'r', capteur: true }],
  creature: { piece: 'k' },
};
const commande = (action: string, cible: string) => ({ action, cible: idPublic(MONDE.id, cible) });
const debut = (): Partie => nouvellePartie(MONDE, { version: 'test-capteur', graine: 5 });
const porteur = (piece: string): Partie => {
  const { etat } = debut();
  return { ...debut(), etat: { ...etat, piece, objets: { ...etat.objets, capteur: { type: 'passager' } } } };
};
const posé = (piece: string, extra: Partial<EtatPartie> = {}, hs = false): EtatPartie => ({
  ...debut().etat,
  ...extra,
  objets: { capteur: { type: 'capteur', piece, ...(hs ? { hs: true as const } : {}) } },
});
const creatureEn = (piece: string, plus: object = {}): Partial<EtatPartie> => ({ creature: { ...debut().etat.creature!, piece, ...plus } });

describe('capteur posé', () => {
  it('poser le capteur le fixe : ni au sol ni en main, et la pose dit son état', () => {
    const r = jouer(MONDE, porteur('r'), commande('poser', 'capteur'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(r.partie.etat.objets.capteur).toEqual({ type: 'capteur', piece: 'r' });
    expect(r.evenements).toEqual([expect.objectContaining({ type: 'capteur_pose', etat: 'calme' })]);
    expect(observer(MONDE, r.partie.etat).menu.some((o) => o.cible.id === idPublic(MONDE.id, 'capteur'))).toBe(false);
  });
  it('posé dans une sous-position, il tient à la pièce qui l\'ouvre', () => {
    const r = jouer(MONDE, porteur('s'), commande('poser', 'capteur'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(r.partie.etat.objets.capteur).toEqual({ type: 'capteur', piece: 'k' });
  });
  it('capteurPose : null sans capteur posé', () => {
    expect(capteurPose(MONDE, debut().etat)).toBeNull();
    expect(capteurPose(MONDE, porteur('r').etat)).toBeNull();
  });
  it('brouillé en salle des machines en marche, calme à l\'arrêt, brouillé en chambre froide', () => {
    expect(capteurPose(MONDE, posé('m'))?.etat).toBe('brouille');
    expect(capteurPose(MONDE, posé('m', { arretees: ['m'] }))?.etat).toBe('calme');
    expect(capteurPose(MONDE, posé('f'))?.etat).toBe('brouille');
  });
  it('mouvement avec la créature dans la pièce ou son alcôve, calme si elle est inerte ou ailleurs', () => {
    expect(capteurPose(MONDE, posé('k', creatureEn('k')))?.etat).toBe('mouvement');
    expect(capteurPose(MONDE, posé('k', creatureEn('k', { alcove: true })))?.etat).toBe('mouvement');
    expect(capteurPose(MONDE, posé('k', creatureEn('k', { neutralisee: 'inerte' })))?.etat).toBe('calme');
    expect(capteurPose(MONDE, posé('r', creatureEn('k')))?.etat).toBe('calme');
  });
  it('hs dès que la panne est posée, même en pièce aveugle', () => {
    expect(capteurPose(MONDE, posé('m', {}, true))?.etat).toBe('hs');
    expect(capteurPose(MONDE, posé('k', creatureEn('k'), true))).toEqual({ objet: 'capteur', piece: 'k', etat: 'hs' });
  });
  it('validerMonde refuse deux capteurs et un capteur non portable', () => {
    const deux = { ...MONDE, objets: [...MONDE.objets, { id: 'autre', nom: 'autre', piece: 'r', capteur: true as const }] };
    expect(validerMonde(deux)).toContain('capteurs multiples.');
    const fixe = { ...MONDE, objets: [{ id: 'capteur', nom: 'capteur', piece: 'r', capteur: true as const, portable: false }] };
    expect(validerMonde(fixe)).toContain('capteur : capteur à qualités incompatibles.');
    expect(validerMonde(MONDE)).toEqual([]);
  });
});

describe('dans le pas', () => {
  const GRAND: DefMonde = { ...MONDE, rencontre: { rythme: 1 }, objets: [...MONDE.objets, { id: 'inter', nom: 'interrupteur', piece: 'm', machines: 'm', portable: false }] };
  const cote = (monde: DefMonde, etat: EtatPartie, graine: number, action = 'attendre'): { partie: Partie; evenements: readonly Evenement[] } => {
    const base = nouvellePartie(monde, { version: 'test-capteur', graine });
    const partie: Partie = { ...base, etat };
    const option = observer(monde, partie.etat).menu.find((choix) => choix.action === action && choix.disponible);
    if (option === undefined) throw new Error(`Option ${action} absente.`);
    const r = jouer(monde, partie, option.commande);
    if (r.type !== 'engagee') throw new Error(r.type);
    return r;
  };
  const capteurs = (evenements: readonly Evenement[]) => evenements.filter((e) => e.type === 'capteur');
  const graines = (garde: (graine: number) => boolean, combien = 1): number[] => {
    const trouvees: number[] = [];
    for (let graine = 0; graine < 20_000 && trouvees.length < combien; graine++) if (garde(graine)) trouvees.push(graine);
    if (trouvees.length < combien) throw new Error('Pas assez de graines.');
    return trouvees;
  };
  /** Passager en `piece`, capteur posé en `ou`. */
  const etatPose = (piece: string, ou: string, creature: Partial<EtatPartie>, extra: Partial<EtatPartie> = {}): EtatPartie => ({ ...posé(ou, creature), piece, ...extra });
  const sansPanne = (graine: number, action = 1): boolean => tirageCapteur(graine, action) >= CHANCE_DESTRUCTION;
  const estHs = (etat: EtatPartie): boolean => capteurPose(GRAND, etat)?.etat === 'hs';

  it('le tirage est dans [0, 1[ et déterministe', () => {
    for (let g = 0; g < 200; g++) {
      expect(tirageCapteur(g, 3)).toBeGreaterThanOrEqual(0);
      expect(tirageCapteur(g, 3)).toBeLessThan(1);
    }
    expect(tirageCapteur(7, 3)).toBe(tirageCapteur(7, 3));
  });
  it('elle entre dans la pièce du capteur : mouvement ; elle en sort : calme', () => {
    const vers = etatPose('m', 'r', creatureEn('k'));
    const entre = graines((g) => sansPanne(g) && capteurs(cote(GRAND, vers, g).evenements).length > 0)[0]!;
    expect(capteurs(cote(GRAND, vers, entre).evenements)).toEqual([{ type: 'capteur', etat: 'mouvement' }]);
    const depuis = etatPose('m', 'r', creatureEn('r'));
    const sort = graines((g) => sansPanne(g) && capteurs(cote(GRAND, depuis, g).evenements).length > 0)[0]!;
    expect(capteurs(cote(GRAND, depuis, sort).evenements)).toEqual([{ type: 'capteur', etat: 'calme' }]);
  });
  it('rien ne change : aucun événement capteur', () => {
    for (const g of graines((graine) => sansPanne(graine) && faceRencontre(graine, 1, 1) !== 1, 50)) {
      expect(capteurs(cote(GRAND, etatPose('m', 'r', creatureEn('k')), g).evenements)).toEqual([]);
    }
  });
  it('arrêter puis relancer les machines : calme, puis brouillé', () => {
    const g = graines((graine) => sansPanne(graine, 1))[0]!;
    const base = nouvellePartie(GRAND, { version: 'test-capteur', graine: 5 }).etat;
    const depart = etatPose('m', 'm', creatureEn('k', { neutralisee: 'inerte' }), { objets: { ...base.objets, capteur: { type: 'capteur', piece: 'm' } } });
    expect(capteurPose(GRAND, depart)?.etat).toBe('brouille');
    const arret = cote(GRAND, depart, g, 'arreter');
    expect(capteurs(arret.evenements)).toEqual([{ type: 'capteur', etat: 'calme' }]);
    const h = graines((graine) => sansPanne(graine, arret.partie.etat.actions + 1))[0]!;
    const relance = cote(GRAND, arret.partie.etat, h, 'relancer');
    expect(capteurs(relance.evenements)).toEqual([{ type: 'capteur', etat: 'brouille' }]);
  });
  it("détruit avec elle dans la pièce hors traque ; puis plus rien jusqu'à la fin", () => {
    const depart = etatPose('m', 'r', creatureEn('r'));
    const g = graines((graine) => tirageCapteur(graine, 1) < CHANCE_DESTRUCTION && tirageCapteur(graine, 1) >= CHANCE_PANNE && cote(GRAND, depart, graine).partie.etat.creature?.piece === 'r')[0]!;
    const r = cote(GRAND, depart, g);
    expect(r.partie.etat.objets.capteur).toEqual({ type: 'capteur', piece: 'r', hs: true });
    expect(capteurs(r.evenements)).toEqual([{ type: 'capteur', etat: 'hs' }]);
    for (let i = 0; i < 30; i++) {
      const suite = cote(GRAND, { ...r.partie.etat, creature: { ...r.partie.etat.creature!, piece: i % 2 === 0 ? 'k' : 'r' } }, g + i);
      expect(capteurs(suite.evenements)).toEqual([]);
      expect(estHs(suite.partie.etat)).toBe(true);
    }
  });
  it('en traque dans la pièce, même tirage : pas de destruction', () => {
    const depart = etatPose('m', 'r', creatureEn('r', { contact: true }));
    for (const g of graines((graine) => tirageCapteur(graine, 1) < CHANCE_DESTRUCTION && tirageCapteur(graine, 1) >= CHANCE_PANNE && cote(GRAND, depart, graine).partie.etat.creature?.piece === 'r', 30)) {
      const apres = cote(GRAND, depart, g).partie.etat;
      expect(apres.creature?.piece).toBe('r');
      expect(estHs(apres)).toBe(false);
    }
  });
  it('au pas de la pose : ni panne ni destruction, capteur_pose seul', () => {
    const base = nouvellePartie(GRAND, { version: 'test-capteur', graine: 5 }).etat;
    const g = graines((graine) => tirageCapteur(graine, 1) < CHANCE_PANNE)[0]!;
    const etat: EtatPartie = { ...base, piece: 'r', ...creatureEn('r'), objets: { ...base.objets, capteur: { type: 'passager' } } };
    const r = jouer(GRAND, { ...nouvellePartie(GRAND, { version: 'test-capteur', graine: g }), etat }, commande('poser', 'capteur'));
    if (r.type !== 'engagee') throw new Error(r.type);
    expect(estHs(r.partie.etat)).toBe(false);
    expect(r.evenements.filter((e) => e.type === 'capteur_pose' || e.type === 'capteur').map((e) => e.type)).toEqual(['capteur_pose']);
  });
  it('sans rencontre : jamais hs sur 600 actions', () => {
    let etat = etatPose('m', 'r', creatureEn('r'));
    for (let i = 0; i < 600; i++) {
      etat = cote(MONDE, etat, 11 + i).partie.etat;
      expect(capteurPose(MONDE, etat)?.etat).not.toBe('hs');
    }
  });
  it('un pas où le passager est vaincu : ni panne ni événement capteur', () => {
    const depart = etatPose('r', 'r', creatureEn('r', { contact: true }), { sante: 'critique' });
    const g = graines((graine) => tirageCapteur(graine, 1) < CHANCE_PANNE)[0]!;
    const r = cote(GRAND, depart, g);
    expect(r.partie.etat.sante).toBe('vaincu');
    expect(estHs(r.partie.etat)).toBe(false);
    expect(capteurs(r.evenements)).toEqual([]);
  });
  it('rejouer d\'une partie où le capteur est passé hs : même empreinte, encore hs, tirages inchangés par le capteur', () => {
    const g = graines((graine) => tirageCapteur(graine, 3) < CHANCE_PANNE)[0]!;
    const jouerTout = (monde: DefMonde): Partie => {
      let partie = nouvellePartie(monde, { version: 'test-capteur', graine: g });
      const suite = [commande('prendre', 'capteur'), commande('poser', 'capteur'), observer(monde, partie.etat).menu.find((c) => c.action === 'attendre')!.commande];
      for (const cmd of suite) {
        const r = jouer(monde, partie, cmd);
        if (r.type !== 'engagee') throw new Error(r.type);
        partie = r.partie;
      }
      return partie;
    };
    const partie = jouerTout(GRAND);
    expect(estHs(partie.etat)).toBe(true);
    const rejeu = rejouer(GRAND, partie.enregistrement, 'test-capteur').partie;
    expect(empreinteEtat(rejeu.etat)).toBe(empreinteEtat(partie.etat));
    expect(estHs(rejeu.etat)).toBe(true);
    const sans = jouerTout(MONDE);
    expect(partie.enregistrement.actions.map((a) => a.tirages)).toEqual(sans.enregistrement.actions.map((a) => a.tirages));
  });
  it('sur 3 000 graines : environ une panne sur 300 sans elle, une destruction sur huit avec elle', () => {
    const part = (depart: EtatPartie): number => {
      let hs = 0;
      for (let g = 0; g < 3000; g++) if (estHs(cote(GRAND, depart, g).partie.etat)) hs++;
      return hs / 3000;
    };
    const panne = part(etatPose('m', 'r', creatureEn('k')));
    expect(panne).toBeGreaterThan(0.002);
    expect(panne).toBeLessThan(0.005);
    const destruction = part(etatPose('m', 'r', creatureEn('r')));
    expect(destruction).toBeGreaterThan(0.09);
    expect(destruction).toBeLessThan(0.16);
  });
});
