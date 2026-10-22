import { capteurPose, idPublic, jouer, nouvellePartie, observer, validerMonde, type DefMonde, type EtatPartie, type Partie } from './index';

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
