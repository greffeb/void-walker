import { nouvellePartie, type Evenement } from '../engine';
import type { EntreeMonde } from '../content';
import { creerBot, jouerAvecBot, type Bot } from './bots';
import { botTemoin } from './bots-reference';
import { CATALOGUE } from './catalogue';
import { estSigne, SuiviRythme } from './rythme-partie';
import { lireTemoins, sansErrance } from './verifier-grandes';

// Rythme et fin d'une partie (mesure 2026-11) : une catégorie par partie, et le diagnostic d'une partie perdue.

const ID = CATALOGUE.publiees[0] ?? '';
const resolue = CATALOGUE.resoudre(ID);
if ('refus' in resolue) throw new Error(resolue.refus);
const grande: EntreeMonde = resolue;
const temoin = lireTemoins()[ID]?.[0] ?? [];
const calme = sansErrance(grande);
// Petite station où la créature attend sur le chemin : sans témoin publié.
const soute = CATALOGUE.resoudre('m07-m03-soute-2718281828');
if ('refus' in soute) throw new Error(soute.refus);
const barree: EntreeMonde = soute;

function mesurer(entree: EntreeMonde, bot: Bot, plafond: number, graine = 1, chemin: typeof temoin | undefined = temoin) {
  const suivi = new SuiviRythme(entree.monde, nouvellePartie(entree.monde, { version: 'bot', graine }), chemin);
  const { indicateurs } = jouerAvecBot(entree, bot, graine, plafond, suivi.noter);
  return { indicateurs, rythme: suivi.resultat(indicateurs, plafond) };
}

const attentiste: Bot = { choisir: ({ observation }) => observation.menu.find((option) => option.action === 'attendre' && option.disponible)?.commande ?? null };

describe('rythme d’une partie', () => {
  it('le chemin prouvé, sans errance : évacuation, à la longueur du témoin, sans coup ni face-à-face', () => {
    const { rythme } = mesurer(calme, botTemoin(temoin), 600);
    expect(rythme).toMatchObject({ fin: 'evacuation', actions: temoin.length, griffes: 0, faceAFace: 0, premierContact: null, sursis: null, perdu: null, attentes: 0 });
    expect(rythme.pieces).toBeGreaterThan(5);
  });

  it('un bot qui ne fait qu’attendre est perdu au plafond : il n’a jamais ouvert la première porte du chemin', () => {
    const { rythme } = mesurer(calme, attentiste, 5);
    expect(rythme).toMatchObject({ fin: 'perdu', actions: 5, attentes: 5, pieces: 1, allersRetours: 0 });
    expect(rythme.perdu).toMatchObject({ morceau: 'vestibule', piecesALaFin: 1, attentesALaFin: 5, raison: 'porte_jamais_ouverte', geste: null });
  });

  it('un bot qui s’arrête avant le plafond est interrompu, pas perdu', () => {
    expect(mesurer(calme, botTemoin(temoin.slice(0, 3)), 600).rythme).toMatchObject({ fin: 'interrompu', actions: 3, perdu: null });
  });

  it('une mort par la créature compte ses griffes et son sursis ; chaque partie a une seule fin, cohérente avec ses indicateurs', () => {
    let tuees = 0;
    for (let graine = 0; graine < 8; graine++) {
      const { indicateurs, rythme } = mesurer(barree, creerBot('casse-cou', graine), 200, graine, undefined);
      expect(rythme.perdu).toBeNull();
      expect(rythme.actions).toBe(indicateurs.actions);
      expect(rythme.fin === 'evacuation').toBe(indicateurs.issue === 'evacuation');
      expect(rythme.fin === 'creature' || rythme.fin === 'environnement').toBe(indicateurs.issue === 'defaite');
      expect(rythme.premierContact).toBe(indicateurs.premierContact);
      expect(rythme.calme).toBeLessThanOrEqual(rythme.actions);
      if (rythme.premierContact !== null) expect(rythme.premierSigne).toBeLessThanOrEqual(rythme.premierContact);
      if (rythme.fin !== 'creature') continue;
      tuees++;
      expect(rythme.griffes).toBeGreaterThanOrEqual(1);
      expect(rythme.sursis).toBe(rythme.actions - (rythme.premierContact ?? 0));
    }
    expect(tuees).toBeGreaterThan(0);
  });

  it('un signe : un bruit, une écoute qui entend, un coup de griffes ; pas une écoute muette ni une brûlure', () => {
    const passage = { sorte: 'passage' } as never;
    const signes: Evenement[] = [{ type: 'bruit_lointain' }, { type: 'traces_fraiches' }, { type: 'ecoute', passage, entendu: 'vague' }, { type: 'defaite', causes: ['griffes'] }];
    const muets: Evenement[] = [{ type: 'ecoute', passage, entendu: 'rien' }, { type: 'aggravation_blesse', causes: ['feu'] }, { type: 'bruit_station' }, { type: 'attente' }];
    expect(signes.map(estSigne)).toEqual([true, true, true, true]);
    expect(muets.map(estSigne)).toEqual([false, false, false, false]);
  });
});
