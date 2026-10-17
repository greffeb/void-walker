import { empreinteEtat, exporter, type DefMonde, type Enregistrement } from '../engine';
import { creerBot, jouerAvecBot } from './bots';
import { CATALOGUE } from './catalogue';
import { desAuSeuil, rejouerPourMesure } from './indicateurs-partie';

// Indicateurs de difficulté (#194 §1) et contrefactuel du seuil d'esquive (#194 §2.1).

const entree = CATALOGUE.resoudre('m07-m03-soute-2718281828');
if ('refus' in entree) throw new Error(entree.refus);
const station: DefMonde = entree.monde;

/** Partie du bot pressé, graine 1 : deux jets ratés (6 puis 4), évacuation indemne. */
const { partie, indicateurs } = jouerAvecBot(entree, creerBot('presse', 1), 1);
const enregistrement: Enregistrement = partie.enregistrement;

describe('indicateurs de partie', () => {
  it('comptent les dés, les coups, le premier contact et la fin', () => {
    expect(indicateurs.issue).toBe('evacuation');
    expect(indicateurs.des).toBe(2);
    expect(enregistrement.actions.flatMap((entreeJournal) => entreeJournal.tirages)).toEqual([6, 4]);
    expect(indicateurs.coups).toBe(0);
    expect(indicateurs.sante).toBe('indemne');
    expect(indicateurs.premierContact).not.toBeNull();
    expect(indicateurs.actions).toBe(enregistrement.actions.length);
  });

  it('le rejeu sans seuil retrouve la partie et ses indicateurs', () => {
    const rejeu = rejouerPourMesure(station, enregistrement, empreinteEtat(partie.etat));
    expect(rejeu.identique).toBe(true);
    expect(rejeu.divergence).toBeNull();
    expect(rejeu.indicateurs).toEqual(indicateurs);
  });

  it('au seuil 6, chaque jet touche : deux coups de griffes, même commandes', () => {
    const rejeu = rejouerPourMesure(station, enregistrement, undefined, 6);
    expect(rejeu.indicateurs.coups).toBe(2);
    expect(rejeu.indicateurs.parCause.griffes).toBe(2);
    expect(rejeu.indicateurs.sante).toBe('critique');
    expect(rejeu.divergence).toBeNull();
  });

  it('au seuil 0, aucun jet ne touche', () => {
    const blesse = jouerAvecBot(entree, creerBot('presse', 2), 2);
    expect(blesse.indicateurs.parCause.griffes).toBe(1);
    const rejeu = rejouerPourMesure(station, blesse.partie.enregistrement, undefined, 0);
    expect(rejeu.indicateurs.parCause.griffes).toBe(0);
    expect(rejeu.indicateurs.sante).toBe('indemne');
  });

  it('une partie qui se conclut plus tôt laisse des actions non jouées', () => {
    const rejeu = rejouerPourMesure(station, jouerAvecBot(entree, creerBot('presse', 5), 5).partie.enregistrement, undefined, 6);
    expect(rejeu.indicateurs.issue).toBe('defaite');
    expect(rejeu.nonJouees).toBeGreaterThan(0);
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

  it('relit un tirage au nouveau seuil : 1 s’il touche, la plus haute face sinon', () => {
    const des = desAuSeuil([2, 5, 6], 5);
    expect([des.lancer(6), des.lancer(6), des.lancer(6)]).toEqual([1, 1, 6]);
    expect(() => des.lancer(6)).toThrow(/sans tirage/);
  });
});
