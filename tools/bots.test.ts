import { observer, type Observation } from '../engine';
import { botAleatoire, creerBot, jouerAvecBot, optionsJouables, PROFILS, type Bot } from './bots';
import { CATALOGUE } from './catalogue';

// Bots de mesure (#194 §2.3) : ils jouent par le menu public, de façon reproductible.

const entree = CATALOGUE.resoudre('m07-m03-soute-2718281828');
if ('refus' in entree) throw new Error(entree.refus);

describe('bots', () => {
  it('chaque profil finit ses parties avec des commandes du menu, et la même graine rejoue la même partie', () => {
    for (const profil of PROFILS) {
      for (let graine = 0; graine < 4; graine++) {
        const premiere = jouerAvecBot(entree, creerBot(profil, graine), graine);
        const seconde = jouerAvecBot(entree, creerBot(profil, graine), graine);
        expect(seconde.partie.enregistrement).toEqual(premiere.partie.enregistrement);
        expect(premiere.indicateurs.actions).toBeLessThanOrEqual(300);
      }
    }
  });

  it('le prudent et le pressé évacuent une station où la créature ne barre pas le chemin ; aucun ne se jette dans le vide', () => {
    // Sur la soute de M-07, la créature attend sur le chemin : combien survivent y dépend des réglages de difficulté (#194).
    const tri = CATALOGUE.resoudre('m05-m06-tri-2718281828');
    if ('refus' in tri) throw new Error(tri.refus);
    for (const profil of ['prudent', 'presse'] as const) {
      const parties = Array.from({ length: 8 }, (_, graine) => jouerAvecBot(tri, creerBot(profil, graine), graine).indicateurs);
      expect(parties.filter((partie) => partie.issue === 'evacuation').length).toBeGreaterThanOrEqual(2);
      expect(parties.every((partie) => partie.parCause.vide === 0)).toBe(true);
    }
  });

  it("un bot ne reçoit que la vue du joueur : l'observation publique, le récit et l'aperçu", () => {
    const vus: Observation[] = [];
    const espion: Bot = {
      choisir(vue) {
        expect(Object.keys(vue).sort()).toEqual(['apercu', 'evenements', 'observation']);
        vus.push(vue.observation);
        return vus.length > 3 ? null : (optionsJouables(vue.observation)[0]?.commande ?? null);
      },
    };
    const { partie } = jouerAvecBot(entree, espion, 1);
    expect(vus[0]).toEqual(observer(entree.monde, jouerAvecBot(entree, { choisir: () => null }, 1).partie.etat));
    expect(partie.enregistrement.actions).toHaveLength(3);
  });

  it('abandonne au plafond, et le bot aléatoire ne choisit jamais « regarder »', () => {
    const { indicateurs, partie } = jouerAvecBot(entree, botAleatoire(3), 3, 12);
    expect(indicateurs.actions).toBeLessThanOrEqual(12);
    expect(partie.enregistrement.actions.some((action) => action.commande.action === 'regarder')).toBe(false);
  });

  it('refuse un bot qui propose une commande hors du menu', () => {
    expect(() => jouerAvecBot(entree, { choisir: () => ({ action: 'aller', cible: 'nulle-part' }) }, 1)).toThrow(/refusée/);
  });
});
