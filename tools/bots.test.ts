import { idPublic, jouer, observer, type DefMonde, type Observation } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { aRevoirIci, botAleatoire, creerBot, jouerAvecBot, optionsJouables, PLAFOND_ACTIONS, PROFILS, type Bot } from './bots';
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
        expect(Object.keys(vue).sort()).toEqual(['apercu', 'consulter', 'evenements', 'observation', 'trace']);
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

  describe('le profil averti lit les documents (#209, spec 2026-10-20 §11)', () => {
    // A ouvre sur B, où une note de rangement désigne C ; B ouvre aussi sur D, qui porte un autre document, et sur E.
    const monde: DefMonde = {
      id: 'docs',
      depart: 'p-a',
      pieces: ['a', 'b', 'c', 'd', 'e'].map((nom) => ({ id: `p-${nom}`, nom })),
      liaisons: [['a', 'b'], ['b', 'c'], ['b', 'd'], ['b', 'e']].map(([a, b]) => ({ id: `l-${a}-${b}`, nom: 'porte', entre: [`p-${a}`, `p-${b}`] as const, ouverte: true })),
      objets: [
        { id: 'o-note', nom: 'note', piece: 'p-b', portable: false, document: true, designe: 'p-c' },
        { id: 'o-lettre', nom: 'lettre', piece: 'p-d', portable: false, document: true },
      ],
    };
    const station: EntreeMonde = { monde, textes: (MONDES['monde-test'] as EntreeMonde).textes, parcours: [] };
    const versC = (profil: 'prudent' | 'averti', graine: number): number =>
      jouerAvecBot(station, creerBot(profil, graine), graine, 40).partie.enregistrement.actions.findIndex((action) => action.commande.action === 'aller' && action.commande.cible === idPublic('docs', 'l-b-c'));

    it('il regarde chaque document à sa première visite de la pièce, et pas une seconde fois ; le prudent ne regarde rien', () => {
      const regardes = (profil: 'prudent' | 'averti'): string[] => {
        const vus: string[] = [];
        const bot = creerBot(profil, 1);
        const espion: Bot = { choisir: (vue) => bot.choisir({ ...vue, consulter: (cible) => (vus.push(cible), vue.consulter(cible)) }) };
        jouerAvecBot(station, espion, 1, 40);
        return vus;
      };
      const averti = regardes('averti');
      for (const document of ['o-note', 'o-lettre']) expect(averti.filter((cible) => cible === idPublic('docs', document))).toHaveLength(1);
      expect(regardes('prudent')).toEqual([]);
    });

    it('après une note de rangement, il va droit vers la pièce qu’elle nomme, plus tôt que le prudent', () => {
      const graines = [0, 1, 2, 3, 4, 5, 6, 7];
      // L'action 0 mène à B, où il lit la note ; l'action 1 est le passage vers C.
      for (const graine of graines) expect(versC('averti', graine), `graine ${String(graine)}`).toBe(1);
      expect(graines.some((graine) => versC('prudent', graine) !== 1)).toBe(true);
    });
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
    const choix = creerBot('prudent', 1).choisir({ observation: observer(monde, partie.etat), evenements: [], apercu: () => null, trace: null, consulter: () => null });
    expect(choix).toEqual({ action: 'aller', cible: idPublic('revoir', 'l-s-x') });
  });

  it('une pièce n’est à revoir que si un passage n’y est ni franchissable ni ouvrable : une porte fermée ne compte pas', () => {
    const pieces = [{ id: 'p-s', nom: 's' }, { id: 'p-a', nom: 'a' }];
    const ici = (liaison: DefMonde['liaisons'][number]): Observation => {
      const monde: DefMonde = { id: 'revoir-ici', depart: 'p-s', pieces, liaisons: [liaison], objets: [] };
      return observer(monde, jouerAvecBot({ monde, textes: (MONDES['monde-test'] as EntreeMonde).textes, parcours: [] }, { choisir: () => null }, 1).partie.etat);
    };
    expect(aRevoirIci(ici({ id: 'l-s-a', nom: 'porte', entre: ['p-s', 'p-a'], ouverte: false }))).toBe(false);
    expect(aRevoirIci(ici({ id: 'l-s-a', nom: 'porte', entre: ['p-s', 'p-a'], ouverte: true }))).toBe(false);
    // Une grille haute, hors de portée sans appui : ni franchissable ni ouvrable d'ici.
    expect(aRevoirIci(ici({ id: 'l-s-a', nom: 'grille', entre: ['p-s', 'p-a'], ouverte: false, haute: 'p-s' }))).toBe(true);
  });

  it('refuse un bot qui propose une commande hors du menu', () => {
    expect(() => jouerAvecBot(entree, { choisir: () => ({ action: 'aller', cible: 'nulle-part' }) }, 1)).toThrow(/refusée/);
  });
});
