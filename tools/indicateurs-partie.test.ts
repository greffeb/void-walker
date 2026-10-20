import { empreinteEtat, exporter, idPublic, nouvellePartie, type DefMonde, type Enregistrement, type EtatPartie, type Evenement } from '../engine';
import { ATTEINT_JUSQUA, FACES } from '../engine/sante';
import { creerBot, jouerAvecBot } from './bots';
import { CATALOGUE } from './catalogue';
import { desAuSeuil, rejouerPourMesure, SuiviPartie } from './indicateurs-partie';

// Indicateurs de difficulté (#194 §1) et contrefactuel du seuil d'esquive (#194 §2.1). Les attentes valent quel que soit le
// seuil du moteur : celui du jeu (D-055) ou celui d'une variante à l'essai.

const entree = CATALOGUE.resoudre('m07-m03-soute-2718281828');
if ('refus' in entree) throw new Error(entree.refus);
const station: DefMonde = entree.monde;

/** Partie du bot pressé, graine 1 : au moins un jet d'interception. */
const { partie, indicateurs } = jouerAvecBot(entree, creerBot('presse', 1), 1);
const enregistrement: Enregistrement = partie.enregistrement;
const tirages = enregistrement.actions.flatMap((entreeJournal) => entreeJournal.tirages);

/** Partie du bot pressé, graine 0 : défaite sous les griffes, avec ce seuil comme avec celui du jeu. */
const defaite = jouerAvecBot(entree, creerBot('presse', 0), 0);

describe('indicateurs de partie', () => {
  it('comptent les dés, les coups, le premier contact et la fin', () => {
    expect(tirages.length).toBeGreaterThan(0);
    expect(indicateurs.des).toBe(tirages.length);
    expect(indicateurs.parCause.griffes).toBe(tirages.filter((tirage) => tirage <= ATTEINT_JUSQUA).length);
    expect(indicateurs.premierContact).not.toBeNull();
    expect(indicateurs.actions).toBe(enregistrement.actions.length);
    expect(['evacuation', 'defaite']).toContain(indicateurs.issue);
    expect(defaite.indicateurs).toMatchObject({ issue: 'defaite', sante: 'vaincu', coups: 3 });
  });

  it('le rejeu sans seuil retrouve la partie et ses indicateurs', () => {
    const rejeu = rejouerPourMesure(station, enregistrement, empreinteEtat(partie.etat));
    expect(rejeu.identique).toBe(true);
    expect(rejeu.divergence).toBeNull();
    expect(rejeu.indicateurs).toEqual(indicateurs);
  });

  it('au seuil 6, chaque jet touche, avec les mêmes commandes', () => {
    const rejeu = rejouerPourMesure(station, enregistrement, undefined, 6);
    expect(rejeu.divergence).toBeNull();
    expect(rejeu.indicateurs.des).toBeGreaterThan(0);
    expect(rejeu.indicateurs.parCause.griffes).toBe(rejeu.indicateurs.des);
  });

  it('au seuil 0, aucun jet ne touche ; sans face qui rate, le moteur ne peut pas le rejouer', () => {
    const rejeu = rejouerPourMesure(station, defaite.partie.enregistrement, undefined, 0);
    if (ATTEINT_JUSQUA >= FACES) {
      expect(rejeu.divergence?.motif).toMatch(/aucun jet raté/);
      return;
    }
    expect(rejeu.divergence).toBeNull();
    expect(rejeu.indicateurs.parCause.griffes).toBe(0);
    expect(rejeu.indicateurs.issue).not.toBe('defaite');
  });

  it('une partie conclue ne joue pas les actions de trop du journal', () => {
    const { actions } = defaite.partie.enregistrement;
    const derniere = actions.at(-1);
    if (derniere === undefined) throw new Error('Partie vide.');
    const rejeu = rejouerPourMesure(station, { ...defaite.partie.enregistrement, actions: [...actions, derniere] });
    expect(rejeu.indicateurs.issue).toBe('defaite');
    expect(rejeu.nonJouees).toBe(1);
    expect(rejeu.identique).toBe(false);
  });

  it('signale la première action qui ne se rejoue pas', () => {
    const actions = [...enregistrement.actions];
    actions[1] = { commande: { action: 'aller', cible: 'inconnue' }, tirages: [] };
    const rejeu = rejouerPourMesure(station, { ...enregistrement, actions });
    expect(rejeu.identique).toBe(false);
    expect(rejeu.divergence?.action).toBe(2);
    expect(rejeu.indicateurs.actions).toBe(1);
  });

  it("signale un état final différent de l'export", () => {
    const fichier = exporter(station, partie);
    expect(rejouerPourMesure(station, fichier, '00000000000000').identique).toBe(false);
  });

  it('relit un tirage au nouveau seuil : 1 s’il touche, la première face qui rate sinon', () => {
    const des = desAuSeuil([2, 5, 6], 5);
    expect([des.lancer(6), des.lancer(6)]).toEqual([1, 1]);
    if (ATTEINT_JUSQUA >= FACES) expect(() => des.lancer(6)).toThrow(/aucun jet raté/);
    else expect(des.lancer(6)).toBe(ATTEINT_JUSQUA + 1);
    expect(() => des.lancer(6)).toThrow(/sans tirage/);
  });
});

describe('indicateurs des grandes stations (spec 2026-10-18 §11)', () => {
  // Deux pièces aux segments 0 et 2, reliées par une porte de boucle.
  const monde: DefMonde = {
    id: 'indicateurs',
    depart: 'p-a',
    pieces: [{ id: 'p-a', nom: 'a', segment: 0 }, { id: 'p-b', nom: 'b', segment: 2 }],
    liaisons: [{ id: 'l-boucle-1', nom: 'porte', entre: ['p-a', 'p-b'], ouverte: true }],
    objets: [],
    boucles: ['l-boucle-1'],
  };
  const depart = nouvellePartie(monde, { version: 'indicateurs', graine: 1 });
  const passage = { sorte: 'passage', id: idPublic('indicateurs', 'l-boucle-1'), nom: 'porte', vers: null } as unknown as Extract<Evenement, { type: 'deplacement' }>['passage'];
  const piece = { sorte: 'piece', id: idPublic('indicateurs', 'p-b'), nom: 'b' } as const;

  it('une partie sans rencontre le dit, et compte les pièces visitées', () => {
    const suivi = new SuiviPartie(monde, depart);
    suivi.noter([], [], depart.etat);
    expect(suivi.resultat()).toMatchObject({ sansContact: true, boucleEnPoursuite: false, avancementDefaite: null, piecesVisitees: 1 });
  });

  it('une porte de boucle franchie après la rencontre compte pour une poursuite par une boucle ; avant, non', () => {
    const avant = new SuiviPartie(monde, depart);
    avant.noter([{ type: 'deplacement', passage, piece }], [], depart.etat);
    expect(avant.resultat().boucleEnPoursuite).toBe(false);
    const apres = new SuiviPartie(monde, depart);
    apres.noter([{ type: 'premier_contact' }], [], depart.etat);
    apres.noter([{ type: 'deplacement', passage, piece }], [], depart.etat);
    expect(apres.resultat()).toMatchObject({ sansContact: false, boucleEnPoursuite: true });
  });

  describe('mise hors jeu avant le final (D-241)', () => {
    // Le final est le morceau de la capsule ; la créature est expulsée à l'action où `expulsee` est vrai.
    const decor: DefMonde = {
      id: 'final',
      depart: 'm-a/p-a',
      pieces: [{ id: 'm-a/p-a', nom: 'a' }, { id: 'm-f/p-f', nom: 'f' }, { id: 'm-f/p-int', nom: 'int', sousPosition: true }],
      liaisons: [{ id: 'l', nom: 'porte', entre: ['m-a/p-a', 'm-f/p-f'], ouverte: true }, { id: 'l-int', nom: 'sas', entre: ['m-f/p-f', 'm-f/p-int'], ouverte: true }],
      objets: [{ id: 'm-f/o-capsule', nom: 'capsule', piece: 'm-f/p-f', portable: false, capsule: { interieur: 'm-f/p-int' } }],
    };
    const debut = nouvellePartie(decor, { version: 'final', graine: 1 });
    const expulsee = { piece: null, neutralisee: 'expulsee' } as unknown as EtatPartie['creature'];
    const suivre = (pas: readonly { piece: string; expulsee: boolean }[]): ReturnType<SuiviPartie['resultat']> => {
      const suivi = new SuiviPartie(decor, debut);
      for (const { piece, expulsee: horsJeu } of pas) suivi.noter([], [], { ...debut.etat, piece, creature: horsJeu ? expulsee : null });
      return suivi.resultat();
    };

    it('avant l’entrée dans le final : oui', () => {
      expect(suivre([{ piece: 'm-a/p-a', expulsee: true }, { piece: 'm-f/p-f', expulsee: true }])).toMatchObject({ horsJeu: 1, horsJeuAvantFinal: true });
    });

    it('à l’action même de l’entrée, ou après : non', () => {
      expect(suivre([{ piece: 'm-f/p-f', expulsee: true }]).horsJeuAvantFinal).toBe(false);
      expect(suivre([{ piece: 'm-f/p-f', expulsee: false }, { piece: 'm-f/p-f', expulsee: true }]).horsJeuAvantFinal).toBe(false);
    });

    it('jamais hors jeu : non ; hors jeu sans être entré dans le final : oui', () => {
      expect(suivre([{ piece: 'm-a/p-a', expulsee: false }]).horsJeuAvantFinal).toBe(false);
      expect(suivre([{ piece: 'm-a/p-a', expulsee: true }]).horsJeuAvantFinal).toBe(true);
    });
  });

  it('l’avancement de la défaite : le segment de la pièce de la mort, rapporté au plus avancé', () => {
    const suivi = new SuiviPartie(monde, depart);
    suivi.noter([], [], { ...depart.etat, piece: 'p-b', sante: 'vaincu' });
    expect(suivi.resultat().avancementDefaite).toBe(1);
  });
});
