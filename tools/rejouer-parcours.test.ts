import { MONDES, type EntreeMonde } from '../content';
import { executerParcours } from './rejouer-parcours';

const ENTREE = Object.values(MONDES)[0] as EntreeMonde;

describe('parcours témoin du monde de test', () => {
  it('atteint la fin attendue, refuse sans effet et rejoue l’export à l’identique', () => {
    const rapport = executerParcours(ENTREE, 'test');
    expect(rapport.erreurs).toEqual([]);
    expect(rapport.exportPartie?.actions.map((entree) => entree.commande.action)).toEqual(['prendre', 'ouvrir', 'aller', 'poser']);
    expect(rapport.lignes.filter((ligne) => ligne.includes('[refus attendu'))).toHaveLength(2);
  });

  it('même graine : même texte ; le texte ne dépend pas des dés (NP-03)', () => {
    expect(executerParcours(ENTREE, 'test', 3).lignes).toEqual(executerParcours(ENTREE, 'test', 3).lignes);
  });

  it('signale un parcours dont la fin attendue n’est pas atteinte', () => {
    const faux = { ...ENTREE, parcours: { ...ENTREE.parcours, attendu: { ...ENTREE.parcours.attendu, piece: 'cabine' } } };
    expect(executerParcours(faux, 'test').erreurs).toEqual([expect.stringContaining("État final différent")]);
  });

  it('signale une étape impossible', () => {
    const faux = { ...ENTREE, parcours: { ...ENTREE.parcours, etapes: [{ action: 'aller' as const, cible: 'porte', vers: 'atelier' }] } };
    expect(executerParcours(faux, 'test').erreurs[0]).toMatch(/option absente ou indisponible/);
  });
});
