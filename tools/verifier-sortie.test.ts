import { describe, expect, it } from 'vitest';
import { COMPOSITIONS_PUBLIEES, MORCEAUX } from '../content';
import { nouvellePartie, observer, type DefMonde, type EtatPartie } from '../engine';
import { CATALOGUE } from './catalogue';
import { chercherEvacuation, echantillonGrandes, GRANDES_SORTIE } from './verifier-sortie';
import { stationDeReference } from './verifier-station';

// « Plus aucune sortie » (D-085, D-275) : un cas par obstacle qui peut couper le chemin, avec le signal et la recherche complète
// du moteur, qui doivent dire la même chose ; puis les cas G-03, G-04 et G-06 de C-08 ; puis les clés des grandes stations.

function monde(id: string): DefMonde {
  const reference = CATALOGUE.mondes[id];
  if (reference !== undefined) return reference.monde;
  const station = CATALOGUE.publiees.includes(id) ? CATALOGUE.resoudre(id) : stationDeReference(CATALOGUE, id);
  if ('refus' in station) throw new Error(station.refus);
  return 'entree' in station ? station.entree.monde : station.monde;
}

function etat(choisi: DefMonde, changement: Partial<EtatPartie> = {}): EtatPartie {
  const depart = nouvellePartie(choisi, { version: 'sortie-1', graine: 3 }).etat;
  return { ...depart, ...changement, objets: { ...depart.objets, ...changement.objets } };
}

/** Le signal, vérifié contre la recherche complète sur le même état. */
function signal(choisi: DefMonde, courant: EtatPartie): boolean {
  const { sansSortie } = observer(choisi, courant);
  expect(chercherEvacuation(choisi, courant).verdict).toBe(sansSortie ? 'aucune' : 'evacuation');
  return sansSortie;
}

// Chaque cas épuise une recherche complète : quelques secondes seul, davantage pendant toute la suite des tests.
describe('plus aucune sortie', { timeout: 60_000 }, () => {
  it('aucun signal au départ des stations publiées ni des mondes de référence, monde de test sans capsule compris', () => {
    const ids = [...Object.keys(CATALOGUE.mondes), ...COMPOSITIONS_PUBLIEES];
    const signalees = ids.filter((id) => {
      const choisi = monde(id);
      return observer(choisi, etat(choisi)).sansSortie;
    });
    expect(signalees).toEqual([]);
  });

  it('G-03 : la planche tombée du mauvais côté du vide donne le signal, et la partie reste jouable', () => {
    const m08 = monde('m-08');
    const perdue = etat(m08, { piece: 'p-ouest', objets: { 'o-planche': { type: 'perdu', liaison: 'l-ouest-est' } } });
    expect(signal(m08, perdue)).toBe(true);
    const observation = observer(m08, perdue);
    expect(observation.terminee).toBe(false);
    expect(observation.issue).toBeNull();
    expect(observation.menu.some((option) => option.disponible && option.action !== 'regarder')).toBe(true);
    // Passée de l'autre côté, la capsule reste à portée : pas de signal.
    expect(signal(m08, { ...perdue, piece: 'p-est' })).toBe(false);
    // Laissée de l'autre côté, la planche est hors d'atteinte comme si elle était tombée.
    expect(signal(m08, etat(m08, { piece: 'p-ouest', objets: { 'o-planche': { type: 'piece', piece: 'p-est' } } }))).toBe(true);
  });

  it('G-04 : seul le passage caché, non découvert, mène encore à la capsule : aucun signal', () => {
    const m05 = monde('m05-m03-reserve');
    // La porte du hall est fermée pour de bon : il ne reste que le panneau, ni découvert ni nommé.
    const coupee = etat(m05, { piece: 'm-05/p-service', verrous: ['m-05/l-tri-quai'] });
    expect(coupee.decouvertes).not.toContain('m-05/l-service-quai');
    expect(signal(m05, coupee)).toBe(false);
    // Revenu dans la salle de tri, il reste le chemin du local et de son panneau.
    expect(signal(m05, { ...coupee, piece: 'm-05/p-tri' })).toBe(false);
  });

  it('G-06 : créature tombée avec la planche, passager du bon côté : ni fin ni signal', () => {
    const m08 = monde('m-08');
    const depart = etat(m08);
    const tombee = etat(m08, {
      piece: 'p-est',
      creature: depart.creature === null ? null : { ...depart.creature, piece: null, neutralisee: 'tombee' },
      objets: { 'o-planche': { type: 'perdu', liaison: 'l-ouest-est' } },
    });
    const observation = observer(m08, tombee);
    expect(observation.terminee).toBe(false);
    expect(observation.issue).toBeNull();
    expect(signal(m08, tombee)).toBe(false);
  });

  it('cloison de l\'ordre libre dont la commande est hors d\'atteinte : signal', () => {
    const libre = monde('ol-m01-m02-m03-reserve');
    // La commande de la première cloison, derrière elle : rien ne la lève plus.
    const enfermee = etat(libre, { objets: { 'm-01/o-commande-1': { type: 'piece', piece: 'carrefour/p-sas' } } });
    expect(signal(libre, enfermee)).toBe(true);
    expect(signal(libre, etat(libre))).toBe(false);
  });

  it('passage haut sans appui possible : signal', () => {
    const m02 = monde('m02-m03-reserve');
    const sansCaisse = etat(m02, { piece: 'm-02/p-atelier', objets: { 'm-02/o-caisse': { type: 'piece', piece: 'vestibule/p-vestibule' } } });
    expect(signal(m02, sansCaisse)).toBe(true);
    expect(signal(m02, etat(m02, { piece: 'm-02/p-atelier' }))).toBe(false);
  });

  it('capsule sans circuit, bloc trop large pour le seul passage : signal ; bloc déjà installé : aucun', () => {
    const base = monde('m07-m03-soute');
    const sansConsole: DefMonde = { ...base, objets: base.objets.filter((objet) => objet.id !== 'm-03/o-console') };
    expect(signal(sansConsole, etat(sansConsole))).toBe(false);
    const etroit: DefMonde = {
      ...sansConsole,
      liaisons: sansConsole.liaisons.map((liaison) => (liaison.id === 'm-03/l-energie-embarquement' ? { ...liaison, etroite: true } : liaison)),
    };
    expect(signal(etroit, etat(etroit))).toBe(true);
    expect(signal(etroit, etat(etroit, { objets: { 'm-03/o-bloc': { type: 'installe', dans: 'm-03/o-capsule' } } }))).toBe(false);
  });

  it('feu, blessures et créature ne ferment aucun passage (D-275)', () => {
    const m01 = monde('m01-m03-reserve');
    const brulant = etat(m01, { piece: 'm-01/p-poste', sante: 'critique', feu: ['m-01/p-poste', 'm-01/p-galerie', 'm-01/p-palier'] });
    expect(signal(m01, brulant)).toBe(false);
  });

  it('partie finie : jamais de signal', () => {
    const m08 = monde('m-08');
    const perdue = etat(m08, { piece: 'p-ouest', objets: { 'o-planche': { type: 'perdu', liaison: 'l-ouest-est' } } });
    expect(observer(m08, { ...perdue, sante: 'vaincu' }).sansSortie).toBe(false);
  });
});

// Grandes stations (spec 2026-10-18 §7.4) : la caisse et le bloc sur des stations courtes retouchées comme le fait
// l'assembleur, recherche complète comprise ; puis le départ des grandes stations de l'échantillon de check:sortie.
describe('plus aucune sortie : clés des grandes stations', { timeout: 120_000 }, () => {
  it('caisse portable posée loin de la grille : pas de signal tant qu’on peut l’apporter ; signal quand la planche tombée la laisse derrière le vide', () => {
    const base = monde('m08-m02-m03-reserve');
    const grande: DefMonde = { ...base, objets: base.objets.map((objet) => (objet.id === 'm-02/o-caisse' ? { ...objet, portable: true, encombrant: true } : objet)) };
    const loin = { 'm-02/o-caisse': { type: 'piece', piece: 'm-08/p-quartiers' } } as const;
    expect(signal(grande, etat(grande, { objets: loin }))).toBe(false);
    const perdue = { ...loin, 'm-08/o-planche': { type: 'perdu', liaison: 'm-08/l-ouest-est' } } as const;
    expect(signal(grande, etat(grande, { piece: 'm-08/p-est', objets: perdue }))).toBe(true);
  });

  it('bloc dans une pièce d’où il rejoint la capsule sans passage étroit : pas de signal', () => {
    const base = monde('m07-m03-soute');
    const sansConsole: DefMonde = { ...base, objets: base.objets.filter((objet) => objet.id !== 'm-03/o-console') };
    expect(signal(sansConsole, etat(sansConsole, { objets: { 'm-03/o-bloc': { type: 'piece', piece: 'm-03/p-reserve' } } }))).toBe(false);
  });

  it(`échantillon de check:sortie : une station par clé déplacée, puis par chemin absent, au plus ${GRANDES_SORTIE}`, () => {
    const echantillon = echantillonGrandes(CATALOGUE);
    const couvertes = echantillon.flatMap((station) => station.couvre);
    expect(new Set(couvertes).size).toBe(couvertes.length);
    const cles = couvertes.filter((cle) => cle.includes('/'));
    expect([...cles].sort()).toEqual(['m-01/o-bidon', 'm-02/o-caisse', 'm-03/o-bloc', 'm-04/o-burette', 'm-06/o-combinaison', 'm-06/o-decoupeuse', 'm-08/o-planche', 'm-11/o-carte']);
    // Chaque chemin porté par au moins une station de l'échantillon, M-11 et M-12 compris (#236).
    const chemins = Object.values(MORCEAUX).filter(({ morceau }) => morceau.famille === 'chemin').map(({ morceau }) => morceau.id);
    const portes = new Set(echantillon.flatMap(({ station }) => CATALOGUE.grandes.find((composition) => station.startsWith(`${composition.id}-`))?.chemins ?? []));
    for (const chemin of chemins) expect(portes.has(chemin), chemin).toBe(true);
    expect(echantillon.length).toBeLessThanOrEqual(GRANDES_SORTIE);
    for (const { station, couvre } of echantillon) {
      const grande = monde(station);
      // Chaque clé couverte est bien hors de la pièce d'origine que lui donne son morceau.
      for (const cle of couvre.filter((entree) => entree.includes('/'))) {
        const [morceau = '', objet = ''] = cle.split('/');
        const origine = MORCEAUX[morceau]?.morceau.objets.find((candidat) => candidat.id === objet)?.piece;
        expect(origine, cle).toBeDefined();
        expect(grande.objets.find((candidat) => candidat.id === cle)?.piece, `${station} ${cle}`).not.toBe(`${morceau}/${origine}`);
      }
      // Clé posée loin de son obstacle, planche dans une pièce du catalogue comprise : pas de signal au départ, et une évacuation.
      const depart = etat(grande);
      expect(observer(grande, depart).sansSortie, station).toBe(false);
      expect(chercherEvacuation(grande, depart, { elague: true }).verdict, station).toBe('evacuation');
    }
  });
});
