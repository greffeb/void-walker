import { jouer, nouvellePartie, observer, type Observation, type Partie } from '../../engine';
import { MONDES, type EntreeMonde } from '../../content';
import { CATALOGUE } from '../catalogue';
import { SIGNAUX, type Signal } from './recettes';
import { signauxApres } from './declencheurs';

const { monde } = MONDES['monde-test'] as EntreeMonde;
const base: Observation = observer(monde, nouvellePartie(monde, { version: 'test', graine: 1 }).etat);
const ailleurs = (observation: Observation): Observation => ({ ...observation, piece: { ...observation.piece, id: `${observation.piece.id}-ailleurs` } });

/** Feux vus par le passager : sa pièce, et chaque passage ouvert sur une pièce en feu, depuis la pièce où il se tient. */
const feuxVus = (observation: Observation): string[] => [
  ...(observation.feu ? [`piece:${observation.piece.id}`] : []),
  ...observation.passages.filter((passage) => passage.feu).map((passage) => `passage:${observation.piece.id}:${passage.id}`),
];

/** Vides vus : la pièce du passager, et chaque voyant de porte étanche qui annonce une pièce sans air. */
const videsVus = (observation: Observation): string[] => [
  ...(observation.sansAir ? [`piece:${observation.piece.id}`] : []),
  ...observation.passages.filter((passage) => passage.vide).map((passage) => `passage:${observation.piece.id}:${passage.id}`),
];

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

  it('feu découvert par un passage ouvert : alarme, une fois ; de nouveau en entrant dans la pièce en feu (point 3 de l’essai)', () => {
    const passage = base.passages[0];
    if (passage === undefined) throw new Error('Passage attendu au départ du monde de test.');
    const voitLeFeu: Observation = { ...base, passages: base.passages.map((vu) => (vu.id === passage.id ? { ...vu, ouvert: true, feu: true } : vu)) };
    expect(signauxApres(base, voitLeFeu)).toEqual(['alarme-feu']);
    expect(signauxApres(voitLeFeu, voitLeFeu)).toEqual([]);
    expect(signauxApres(voitLeFeu, ailleurs({ ...base, feu: true }))).toEqual(['alarme-feu']);
    expect(signauxApres(voitLeFeu, base)).toEqual([]);
  });

  it('vide découvert par le voyant d’une porte : alarme, une fois ; de nouveau en entrant dans la pièce sans air (comme le feu)', () => {
    const passage = base.passages[0];
    if (passage === undefined) throw new Error('Passage attendu au départ du monde de test.');
    const voitLeVide: Observation = { ...base, passages: base.passages.map((vu) => (vu.id === passage.id ? { ...vu, vide: true } : vu)) };
    expect(signauxApres(base, voitLeVide)).toEqual(['alarme-vide']);
    expect(signauxApres(voitLeVide, voitLeVide)).toEqual([]);
    expect(signauxApres(voitLeVide, ailleurs({ ...base, sansAir: true }))).toEqual(['alarme-vide']);
    expect(signauxApres(voitLeVide, base)).toEqual([]);
  });

  it('créature : la Dissonance à la première rencontre seulement (événement premier_contact du moteur)', () => {
    const enVue: Observation = { ...base, creatureVisible: true };
    expect(signauxApres(base, enVue, [{ type: 'premier_contact' }])).toEqual(['creature']);
    expect(signauxApres(base, enVue)).toEqual([]);
    expect(signauxApres(enVue, ailleurs(enVue))).toEqual([]);
  });

  it('vide : mêmes règles que le feu', () => {
    const sansAir = { ...base, sansAir: true };
    expect(signauxApres(ailleurs(base), sansAir)).toEqual(['alarme-vide']);
    expect(signauxApres(base, sansAir)).toEqual(['alarme-vide']);
    expect(signauxApres(sansAir, sansAir)).toEqual([]);
    expect(signauxApres(ailleurs({ ...base, sansAir: true }), sansAir)).toEqual(['alarme-vide']);
  });

  it('santé : blessé, puis critique (version critique), puis vaincu (la mort, D-225) ; amélioration : soin', () => {
    const sante = (etat: Observation['sante']): Observation => ({ ...base, sante: etat });
    expect(signauxApres(sante('indemne'), sante('blesse'))).toEqual(['blessure']);
    expect(signauxApres(sante('indemne'), sante('critique'))).toEqual(['blessure-critique']);
    expect(signauxApres(sante('blesse'), sante('critique'))).toEqual(['blessure-critique']);
    expect(signauxApres(sante('critique'), sante('vaincu'))).toEqual(['mort']);
    expect(signauxApres(sante('critique'), sante('blesse'))).toEqual(['soin']);
    expect(signauxApres(sante('blesse'), sante('indemne'))).toEqual(['soin']);
  });

  it('fin de partie : la mort remplace la blessure critique ; la victoire à l’évacuation (D-225)', () => {
    expect(signauxApres({ ...base, sante: 'critique' }, { ...base, sante: 'vaincu', issue: 'defaite' })).toEqual(['mort']);
    expect(signauxApres(base, { ...base, sante: 'vaincu', issue: 'defaite' })).toEqual(['mort']);
    expect(signauxApres(base, { ...base, issue: 'evacuation', terminee: true })).toEqual(['victoire']);
    expect(signauxApres({ ...base, issue: 'evacuation' }, { ...base, issue: 'evacuation' })).toEqual([]);
  });

  it('IA Station : un message de plus', () => {
    expect(signauxApres({ ...base, messages: [] }, { ...base, messages: ['un'] })).toEqual(['ia']);
    expect(signauxApres({ ...base, messages: ['un'] }, { ...base, messages: ['un'] })).toEqual([]);
  });

  it('capteur : tout changement d’état sonne, le dépôt non (créature mobile lot 3)', () => {
    expect(signauxApres(base, base, [{ type: 'capteur', etat: 'mouvement' }])).toEqual(['capteur']);
    expect(signauxApres(base, base, [{ type: 'capteur', etat: 'hs' }])).toEqual(['capteur']);
    expect(signauxApres(base, base, [{ type: 'capteur_pose', objet: { sorte: 'objet', id: 'c', nom: 'capteur' }, piece: { sorte: 'piece', id: 'p', nom: 'pièce' }, etat: 'calme' }])).toEqual([]);
  });

  it('plusieurs à la fois : alarme incendie, alarme vide, santé, IA Station (15 §2.4)', () => {
    const apres: Observation = { ...base, feu: true, sansAir: true, sante: 'blesse', messages: [...base.messages, 'nouveau'] };
    expect(signauxApres(ailleurs(base), apres, [{ type: 'premier_contact' }])).toEqual(['alarme-feu', 'alarme-vide', 'creature', 'blessure', 'ia']);
  });

  // Exhaustif : 600 parties ; la machine de la PR est plusieurs fois plus lente qu'un poste.
  it('parties tirées au hasard dans les trois mondes : signaux justes, ordonnés, et chacun rencontré', { timeout: 30_000 }, () => {
    const vus = new Set<Signal>();
    for (const entree of Object.values(CATALOGUE.mondes)) {
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
          const signaux = signauxApres(avant, apres, resultat.evenements);
          // Ordonnés, sans doublon, au plus un signal de santé.
          expect(signaux).toEqual(SIGNAUX.filter((signal) => signaux.includes(signal)));
          expect(signaux.filter((signal) => signal === 'blessure' || signal === 'blessure-critique' || signal === 'soin').length).toBeLessThanOrEqual(1);
          // Une alarme si et seulement si le danger vient d'apparaître là où se trouve le passager.
          const feuxAvant = feuxVus(avant);
          expect(signaux.includes('alarme-feu')).toBe(feuxVus(apres).some((feu) => !feuxAvant.includes(feu)));
          const videsAvant = videsVus(avant);
          expect(signaux.includes('alarme-vide')).toBe(videsVus(apres).some((vide) => !videsAvant.includes(vide)));
          expect(signaux.includes('creature')).toBe(resultat.evenements.some((evenement) => evenement.type === 'premier_contact'));
          expect(signaux.includes('ia')).toBe(apres.messages.length > avant.messages.length);
          expect(signaux.includes('mort')).toBe(apres.sante === 'vaincu' && avant.sante !== 'vaincu');
          expect(signaux.includes('blessure-critique') && apres.sante === 'vaincu').toBe(false);
          for (const signal of signaux) vus.add(signal);
          partie = resultat.partie;
        }
      }
    }
    // La victoire demande une évacuation, que le hasard n'atteint pas : les parcours témoins la jouent.
    for (const entree of Object.values(CATALOGUE.mondes)) {
      for (const parcours of entree.parcours) {
        let partie: Partie = nouvellePartie(entree.monde, { version: 't', graine: 20261010 });
        for (const etape of parcours.etapes) {
          const avant = observer(entree.monde, partie.etat);
          const option = avant.menu.find(
            (choix) =>
              choix.action === etape.action &&
              choix.cible.nom === etape.cible &&
              (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)) &&
              (etape.parametre === undefined || choix.parametre?.nom === etape.parametre),
          );
          if (option === undefined) break;
          const resultat = jouer(entree.monde, partie, option.commande);
          if (resultat.type !== 'engagee') break;
          for (const signal of signauxApres(avant, observer(entree.monde, resultat.partie.etat), resultat.evenements)) vus.add(signal);
          partie = resultat.partie;
        }
      }
    }
    // Le capteur n'est dans aucun monde publié du hasard : son test dédié le couvre.
    expect([...vus].sort()).toEqual(SIGNAUX.filter((signal) => signal !== 'capteur').sort());
  });
});
