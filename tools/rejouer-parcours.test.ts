import { MONDES, type EntreeMonde, type Parcours } from '../content';
import { executerParcours } from './rejouer-parcours';

const ENTREE = MONDES['monde-test'] as EntreeMonde;
const PARCOURS = ENTREE.parcours[0] as Parcours;
const AR01 = MONDES['ar-01'] as EntreeMonde;

describe('parcours témoin du monde de test', () => {
  it('atteint la fin attendue, refuse sans effet et rejoue l’export à l’identique', () => {
    const rapport = executerParcours(ENTREE, PARCOURS, 'test');
    expect(rapport.erreurs).toEqual([]);
    expect(rapport.exportPartie?.actions.map((entree) => entree.commande.action)).toEqual(['prendre', 'ouvrir', 'aller', 'poser']);
    expect(rapport.lignes.filter((ligne) => ligne.includes('[refus attendu'))).toHaveLength(2);
  });

  it('même graine : même texte, au mot près (NP-03)', () => {
    expect(executerParcours(ENTREE, PARCOURS, 'test', 3).lignes).toEqual(executerParcours(ENTREE, PARCOURS, 'test', 3).lignes);
  });

  it('signale un parcours dont la fin attendue n’est pas atteinte', () => {
    const faux = { ...PARCOURS, attendu: { ...PARCOURS.attendu, piece: 'cabine' } };
    expect(executerParcours(ENTREE, faux, 'test').erreurs).toEqual([expect.stringContaining("État final différent")]);
  });

  it('signale une étape impossible', () => {
    const faux = { ...PARCOURS, etapes: [{ action: 'aller' as const, cible: 'porte', vers: 'atelier' }] };
    expect(executerParcours(ENTREE, faux, 'test').erreurs[0]).toMatch(/option absente ou indisponible/);
  });
});

describe('parcours témoins d’AR-01', () => {
  it.each(AR01.parcours.map((parcours) => [parcours.nom, parcours] as const))('%s : évacuation, indemne, sans dé, export rejoué', (_nom, parcours) => {
    const rapport = executerParcours(AR01, parcours, 'test');
    expect(rapport.erreurs).toEqual([]);
    expect(rapport.lignes).toContain('Aucun dé tiré : oui.');
    // Après la fin, toute commande est refusée sans effet.
    expect(rapport.lignes.some((ligne) => ligne.includes('[refus attendu : jouer après la fin]'))).toBe(true);
  });

  it('signale un parcours qui finit sur une autre santé ou sans évacuation', () => {
    const [premier] = AR01.parcours as [Parcours];
    const sante = { ...premier, attendu: { ...premier.attendu, sante: 'blesse' as const } };
    expect(executerParcours(AR01, sante, 'test').erreurs).toEqual([expect.stringContaining("État final différent")]);
    const inacheve = { ...premier, etapes: premier.etapes.slice(0, -1), attendu: { ...premier.attendu, actions: premier.etapes.length - 1 } };
    expect(executerParcours(AR01, inacheve, 'test').erreurs).toEqual([expect.stringContaining("État final différent")]);
  });
});
