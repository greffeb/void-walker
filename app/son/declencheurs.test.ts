import { jouer, nouvellePartie, observer, type Observation, type Partie } from '../../engine';
import { MONDES, type EntreeMonde } from '../../content';
import { SIGNAUX, type Signal } from './recettes';
import { signauxApres } from './declencheurs';

const { monde } = MONDES['monde-test'] as EntreeMonde;
const base: Observation = observer(monde, nouvellePartie(monde, { version: 'test', graine: 1 }).etat);
const ailleurs = (observation: Observation): Observation => ({ ...observation, piece: { ...observation.piece, id: `${observation.piece.id}-ailleurs` } });

function lcg(graine: number): () => number {
  let etat = graine >>> 0;
  return () => {
    etat = (Math.imul(etat, 1664525) + 1013904223) >>> 0;
    return etat / 2 ** 32;
  };
}

describe('signaux après une action (15 §2.2, D-218)', () => {
  it('rien ne change : aucun signal', () => {
    expect(signauxApres(base, base)).toEqual([]);
  });

  it('feu : en entrant dans une pièce en feu, ou quand il gagne la pièce ; pas en y restant ; de nouveau en y revenant', () => {
    const enFeu = { ...base, feu: true };
    expect(signauxApres(ailleurs(base), enFeu)).toEqual(['alarme-feu']);
    expect(signauxApres(base, enFeu)).toEqual(['alarme-feu']);
    expect(signauxApres(enFeu, enFeu)).toEqual([]);
    expect(signauxApres(enFeu, ailleurs(base))).toEqual([]);
    expect(signauxApres(ailleurs({ ...base, feu: true }), enFeu)).toEqual(['alarme-feu']);
  });

  it('vide : mêmes règles que le feu', () => {
    const sansAir = { ...base, sansAir: true };
    expect(signauxApres(ailleurs(base), sansAir)).toEqual(['alarme-vide']);
    expect(signauxApres(base, sansAir)).toEqual(['alarme-vide']);
    expect(signauxApres(sansAir, sansAir)).toEqual([]);
    expect(signauxApres(ailleurs({ ...base, sansAir: true }), sansAir)).toEqual(['alarme-vide']);
  });

  it('santé : blessé, puis critique ou vaincu (version critique) ; amélioration : soin', () => {
    const sante = (etat: Observation['sante']): Observation => ({ ...base, sante: etat });
    expect(signauxApres(sante('indemne'), sante('blesse'))).toEqual(['blessure']);
    expect(signauxApres(sante('indemne'), sante('critique'))).toEqual(['blessure-critique']);
    expect(signauxApres(sante('blesse'), sante('critique'))).toEqual(['blessure-critique']);
    expect(signauxApres(sante('critique'), sante('vaincu'))).toEqual(['blessure-critique']);
    expect(signauxApres(sante('critique'), sante('blesse'))).toEqual(['soin']);
    expect(signauxApres(sante('blesse'), sante('indemne'))).toEqual(['soin']);
  });

  it('IA Station : un message de plus', () => {
    expect(signauxApres({ ...base, messages: [] }, { ...base, messages: ['un'] })).toEqual(['ia']);
    expect(signauxApres({ ...base, messages: ['un'] }, { ...base, messages: ['un'] })).toEqual([]);
  });

  it('plusieurs à la fois : alarme incendie, alarme vide, santé, IA Station (15 §2.4)', () => {
    const apres: Observation = { ...base, feu: true, sansAir: true, sante: 'blesse', messages: [...base.messages, 'nouveau'] };
    expect(signauxApres(ailleurs(base), apres)).toEqual(['alarme-feu', 'alarme-vide', 'blessure', 'ia']);
  });

  // Exhaustif : 600 parties ; la machine de la PR est plusieurs fois plus lente qu'un poste.
  it('parties tirées au hasard dans les trois mondes : signaux justes, ordonnés, et chacun rencontré', { timeout: 30_000 }, () => {
    const vus = new Set<Signal>();
    for (const entree of Object.values(MONDES)) {
      for (let graine = 1; graine <= 200; graine += 1) {
        const hasard = lcg(graine);
        let partie: Partie = nouvellePartie(entree.monde, { version: 't', graine });
        for (let pas = 0; pas < 120; pas += 1) {
          const avant = observer(entree.monde, partie.etat);
          if (avant.terminee) break;
          const options = avant.menu.filter((option) => option.disponible);
          const option = options[Math.floor(hasard() * options.length)];
          if (option === undefined) break;
          const resultat = jouer(entree.monde, partie, option.commande);
          if (resultat.type !== 'engagee') continue;
          const apres = observer(entree.monde, resultat.partie.etat);
          const signaux = signauxApres(avant, apres);
          // Ordonnés, sans doublon, au plus un signal de santé.
          expect(signaux).toEqual(SIGNAUX.filter((signal) => signaux.includes(signal)));
          expect(signaux.filter((signal) => signal === 'blessure' || signal === 'blessure-critique' || signal === 'soin').length).toBeLessThanOrEqual(1);
          // Une alarme si et seulement si le danger vient d'apparaître là où se trouve le passager.
          const memePiece = avant.piece.id === apres.piece.id;
          expect(signaux.includes('alarme-feu')).toBe(apres.feu && !(memePiece && avant.feu));
          expect(signaux.includes('alarme-vide')).toBe(apres.sansAir && !(memePiece && avant.sansAir));
          expect(signaux.includes('ia')).toBe(apres.messages.length > avant.messages.length);
          for (const signal of signaux) vus.add(signal);
          partie = resultat.partie;
        }
      }
    }
    expect([...vus].sort()).toEqual([...SIGNAUX].sort());
  });
});
