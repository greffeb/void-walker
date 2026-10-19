import { idPublic, jouer, observer, type DefMonde, type Observation } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { botAleatoire, creerBot, jouerAvecBot, optionsJouables, PLAFOND_ACTIONS, PROFILS, type Bot } from './bots';
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
        expect(premiere.indicateurs.actions).toBeLessThanOrEqual(PLAFOND_ACTIONS);
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
        expect(Object.keys(vue).sort()).toEqual(['apercu', 'evenements', 'observation', 'trace']);
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

  it('plafond de 600 actions par partie (spec 2026-10-18 §11)', () => {
    expect(PLAFOND_ACTIONS).toBe(600);
  });

  it('le profil averti, avant la rencontre, tarde à ouvrir plus loin depuis une pièce marquée d’une trace forte', () => {
    // A ouvre sur B, marquée d'une trace forte ; la porte de B vers C est fermée.
    const monde: DefMonde = {
      id: 'averti',
      depart: 'p-a',
      pieces: [{ id: 'p-a', nom: 'a' }, { id: 'p-b', nom: 'b', trace: 'forte' }, { id: 'p-c', nom: 'c' }],
      liaisons: [
        { id: 'l-a-b', nom: 'porte', entre: ['p-a', 'p-b'], ouverte: true },
        { id: 'l-b-c', nom: 'porte', entre: ['p-b', 'p-c'], ouverte: false },
      ],
      objets: [],
    };
    const station: EntreeMonde = { monde, textes: (MONDES['monde-test'] as EntreeMonde).textes, parcours: [] };
    const ouverture = (profil: 'prudent' | 'averti'): number =>
      jouerAvecBot(station, creerBot(profil, 1), 1, 40).partie.enregistrement.actions.findIndex((action) => action.commande.action === 'ouvrir' && action.commande.cible === idPublic('averti', 'l-b-c'));
    const prudent = ouverture('prudent');
    const averti = ouverture('averti');
    expect(prudent).toBeGreaterThanOrEqual(0);
    expect(averti === -1 || averti > prudent).toBe(true);
  });

  it('une pièce visitée sans rien de bloqué ne redevient pas à voir quand l’inventaire change (spec 2026-10-18 §11)', () => {
    // D, impasse, et X, qui mène à M, sont déjà vues ; l'objet est en N. Revenu en S avec l'objet, il file vers M sans revoir D.
    const monde: DefMonde = {
      id: 'revoir',
      depart: 'p-s',
      pieces: ['s', 'd', 'x', 'm', 'n'].map((nom) => ({ id: `p-${nom}`, nom })),
      liaisons: [['s', 'd'], ['s', 'x'], ['x', 'm'], ['s', 'n']].map(([a, b]) => ({ id: `l-${a}-${b}`, nom: 'porte', entre: [`p-${a}`, `p-${b}`] as const, ouverte: true })),
      objets: [{ id: 'o-outil', nom: 'outil', piece: 'p-n' }],
    };
    const station: EntreeMonde = { monde, textes: (MONDES['monde-test'] as EntreeMonde).textes, parcours: [] };
    // Gestes imposés, puis un bot neuf choisit : son but n'est pas celui d'avant, qu'il garderait jusqu'à l'atteindre.
    let partie = jouerAvecBot(station, { choisir: () => null }, 1).partie;
    for (const [action, cible] of [['aller', 'l-s-d'], ['aller', 'l-s-d'], ['aller', 'l-s-x'], ['aller', 'l-s-x'], ['aller', 'l-s-n'], ['prendre', 'o-outil'], ['aller', 'l-s-n']] as const) {
      const resultat = jouer(monde, partie, { action, cible: idPublic('revoir', cible) });
      if (resultat.type !== 'engagee') throw new Error(`${action} ${cible} refusé.`);
      partie = resultat.partie;
    }
    const choix = creerBot('prudent', 1).choisir({ observation: observer(monde, partie.etat), evenements: [], apercu: () => null, trace: null });
    expect(choix).toEqual({ action: 'aller', cible: idPublic('revoir', 'l-s-x') });
  });

  it('refuse un bot qui propose une commande hors du menu', () => {
    expect(() => jouerAvecBot(entree, { choisir: () => ({ action: 'aller', cible: 'nulle-part' }) }, 1)).toThrow(/refusée/);
  });
});
