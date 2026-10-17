import { empreinteEtat, exporter, type DefMonde, type Enregistrement } from '../engine';
import { ATTEINT_JUSQUA, FACES } from '../engine/sante';
import { creerBot, jouerAvecBot } from './bots';
import { CATALOGUE } from './catalogue';
import { desAuSeuil, rejouerPourMesure } from './indicateurs-partie';

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
