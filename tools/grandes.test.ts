import { describe, expect, it } from 'vitest';
import { assemblerStation, RYTHME_RENCONTRE, type DefMonde } from '../engine';
import { ETENDUE_TERRITOIRE, MORCEAUX, VERSION_GENERATEUR, type CompositionGrande } from '../content';
import { CATALOGUE } from './catalogue';

// Grandes stations (spec 2026-10-18 §4, D-313, D-315) : deux chemins matériels, un troisième chemin, un final ; la créature
// dans le troisième chemin ou le final ; un chemin dont le seul obstacle est la créature seulement s'il l'accueille.

const MONDE_ID = /^[a-z0-9-]{1,40}$/;
const obstacle = (morceau: string): string | undefined => MORCEAUX[morceau]?.morceau.grande?.obstacle;
const morceauDe = (piece: string): string => piece.slice(0, piece.indexOf('/'));
const dessinees = (ids: readonly string[]): number =>
  ids.reduce((total, id) => total + (MORCEAUX[id]?.morceau.pieces.filter((piece) => piece.plan !== undefined).length ?? 0), 0);
const morceauxDe = (composition: CompositionGrande): string[] => ['vestibule', ...(composition.forme === 'libre' ? ['carrefour'] : []), ...composition.chemins, composition.final];

describe('compositions des grandes stations (D-313, D-315)', () => {
  const { grandes } = CATALOGUE;

  it('720 en chaîne et 360 en ordre libre, avant refus des paires', () => {
    expect(grandes.filter((composition) => composition.forme === 'chaine')).toHaveLength(720);
    expect(grandes.filter((composition) => composition.forme === 'libre')).toHaveLength(360);
  });

  it('deux chemins matériels, puis un troisième ; la créature dans le troisième chemin ou le final', () => {
    for (const composition of grandes) {
      const [a, b, c] = composition.chemins;
      expect(composition.chemins, composition.id).toHaveLength(3);
      expect([obstacle(a!), obstacle(b!)], composition.id).toEqual(['materiel', 'materiel']);
      expect([c, composition.final], composition.id).toContain(morceauDe(composition.creature));
      // Un chemin dont le seul obstacle est la créature n'est tiré que s'il l'accueille.
      if (obstacle(c!) === 'creature') expect(morceauDe(composition.creature), composition.id).toBe(c);
    }
  });

  it('identifiants g<version>-…, uniques, triés, de 40 caractères au plus avec la graine 9999', () => {
    const ids = grandes.map((composition) => composition.id);
    for (const id of ids) {
      expect(id.startsWith(`g${VERSION_GENERATEUR}-`)).toBe(true);
      expect(`${id}-9999`).toMatch(MONDE_ID);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
    expect(CATALOGUE.compositions.some((composition) => composition.id.startsWith('g'))).toBe(false);
  });

  it('annexes : 24 moins les pièces dessinées des morceaux, de 6 à 10, sans dépasser 28 pièces dessinées', () => {
    for (const composition of grandes) {
      const base = dessinees(morceauxDe(composition));
      expect(composition.annexes, composition.id).toBe(Math.min(10, 28 - base, Math.max(6, 24 - base)));
    }
    // Seul un ordre libre avec M-12 et deux chemins de cinq pièces descend à cinq annexes.
    expect(new Set(grandes.map((composition) => composition.annexes))).toEqual(new Set([5, 6, 7, 8, 9, 10]));
  });

  it('ordre libre : le vestibule donne sur le couloir commun, le troisième chemin suit le sas, la seconde cloison mène à lui', () => {
    const composition = grandes.find((candidate) => candidate.forme === 'libre' && candidate.refus === null);
    if (composition === undefined) throw new Error('Aucune grande composition en ordre libre.');
    const station = CATALOGUE.definirGrande(composition.id, 0);
    if ('refus' in station) throw new Error(station.refus);
    const [a, b, c] = composition.chemins;
    expect(station.accroches?.map(({ depuis, piece, vers }) => `${depuis}/${piece} → ${vers}`)).toEqual([
      'vestibule/p-vestibule → carrefour',
      `carrefour/p-sas → ${c}`,
      `${c}/${MORCEAUX[c!]?.morceau.sortie?.piece} → ${composition.final}`,
      `carrefour/p-couloir → ${a}`,
      `carrefour/p-couloir → ${b}`,
    ]);
    expect(station.commandes?.map((commande) => [commande.morceau, commande.cloison])).toEqual([
      [a, 'carrefour/l-cloison-1'],
      [b, `l-carrefour-${c}`],
    ]);
  });

  // Une graine sans porte de boucle n'a pas de plan (D-318) : une sur deux environ ; la publication les saute sans les prouver.
  it('assemblage : chaque plan a une à trois portes de boucle et 21 à 28 pièces dessinées ; au moins 35 % de plans, moins de 50 ms par station en moyenne', () => {
    const echantillon = grandes.filter((composition, rang) => composition.refus === null && rang % 4 === 0);
    let essais = 0;
    let plans = 0;
    let total = 0;
    let pire = 0;
    for (const composition of echantillon) {
      for (let graine = 0; graine < 10; graine++) {
        const station = CATALOGUE.definirGrande(composition.id, graine);
        if ('refus' in station) throw new Error(station.refus);
        const debut = performance.now();
        const resultat = assemblerStation(station);
        const ms = performance.now() - debut;
        essais++;
        total += ms;
        pire = Math.max(pire, ms);
        if (resultat.type === 'invalide') throw new Error(`${station.id} : ${resultat.erreurs.join(' ')}`);
        if (resultat.type !== 'station') continue;
        plans++;
        const nombre = resultat.monde.pieces.filter((piece) => piece.plan !== undefined).length;
        // Spec §4.1 : `piecesMin` écarte les graines que la couverture des documents ferait tomber sous 21 pièces.
        expect(nombre, station.id).toBeGreaterThanOrEqual(21);
        expect(nombre, station.id).toBeLessThanOrEqual(28);
        expect(resultat.monde.boucles?.length ?? 0, station.id).toBeGreaterThanOrEqual(1);
        expect(resultat.monde.boucles?.length ?? 0, station.id).toBeLessThanOrEqual(3);
      }
    }
    // 45 % de plans sans M-11 ni M-12, 33 % avec eux (#236) ; la publication saute les graines sans plan.
    expect(plans / essais).toBeGreaterThanOrEqual(0.35);
    expect(total / essais).toBeLessThan(50);
    console.log(`grandes stations : ${plans}/${essais} plans, ${(total / essais).toFixed(1)} ms en moyenne, ${pire.toFixed(1)} ms au pire`);
  }, 120_000);

  it('territoire de départ (spec créature mobile §territoire) : portes ouvertes loin des pièces sensibles et du segment 0, dé de rencontre posé', () => {
    const echantillon = grandes.filter((composition) => composition.refus === null).filter((_, rang) => rang % 37 === 0);
    let stations = 0;
    let ouvertes = 0;
    for (const composition of echantillon) {
      for (let graine = 0; graine < 10 && stations < 20; graine++) {
        const station = CATALOGUE.definirGrande(composition.id, graine);
        if ('refus' in station) throw new Error(station.refus);
        const resultat = assemblerStation(station);
        if (resultat.type !== 'station') continue;
        const sans = assemblerStation({ ...station, grande: { ...station.grande!, etendue: 0 } });
        if (sans.type !== 'station') throw new Error(`${station.id} : plan perdu sans territoire.`);
        stations++;
        const monde: DefMonde = resultat.monde;
        expect(station.grande?.etendue, station.id).toBe(ETENDUE_TERRITOIRE);
        expect(monde.rencontre, station.id).toEqual({ rythme: RYTHME_RENCONTRE });
        // Les portes que le territoire a ouvertes : fermées dans le même plan sans territoire.
        const fermees = new Set(sans.monde.liaisons.filter((liaison) => !liaison.ouverte).map((liaison) => liaison.id));
        const pieces = new Map(monde.pieces.map((piece) => [piece.id, piece]));
        for (const liaison of monde.liaisons.filter((candidate) => candidate.ouverte && fermees.has(candidate.id))) {
          ouvertes++;
          for (const id of liaison.entre) {
            const piece = pieces.get(id)!;
            expect(id, `${station.id} ${liaison.id}`).not.toBe(monde.depart);
            expect({ feu: piece.feu, froide: piece.froide, machines: piece.machines, gravite: piece.gravite }, `${station.id} ${liaison.id}`).toEqual({});
            expect(piece.segment ?? 0, `${station.id} ${liaison.id}`).toBeGreaterThan(0);
          }
        }
        break;
      }
    }
    expect(stations).toBe(20);
    expect(ouvertes).toBeGreaterThan(0);
  }, 60_000);

  it('construireGrande rend une station complète, textes du catalogue compris, aux noms de pièces tous différents', () => {
    const composition = grandes.find((candidate) => candidate.refus === null);
    const graine = Array.from({ length: 50 }, (_, rang) => rang).find((rang) => !('refus' in CATALOGUE.construireGrande(composition!.id, rang)))!;
    const entree = CATALOGUE.construireGrande(composition!.id, graine);
    if ('refus' in entree) throw new Error(entree.refus);
    expect(entree.monde.id).toBe(`${composition!.id}-${graine}`);
    const noms = entree.monde.pieces.map((piece) => entree.textes.noms[piece.nom]?.texte);
    expect(noms.every((nom) => nom !== undefined)).toBe(true);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it('resoudre : une version précédente du générateur est refusée avec son message ; une g1 non publiée aussi', () => {
    const composition = grandes.find((candidate) => candidate.refus === null)!;
    const ancienne = CATALOGUE.resoudre(`g0-${composition.id.slice(3)}-1`);
    expect('refus' in ancienne && ancienne.refus).toBe('Station d’une version précédente des stations : la partie ne peut pas être reprise.');
    const nonPubliee = CATALOGUE.resoudre(`${composition.id}-9998`);
    expect('refus' in nonPubliee).toBe(true);
  });

  it('le capteur dans le butin : au plus un par station, et sur 0,1 à 0,9 des 200 premières publiées (créature mobile lot 3)', () => {
    const premieres = CATALOGUE.publiees.slice(0, 200);
    let avecCapteur = 0;
    for (const id of premieres) {
      const entree = CATALOGUE.resoudre(id);
      if ('refus' in entree) throw new Error(entree.refus);
      const capteurs = entree.monde.objets.filter((objet) => objet.capteur === true).length;
      expect(capteurs, id).toBeLessThanOrEqual(1);
      avecCapteur += capteurs;
    }
    // la part suit les graines publiées, pas seulement les poids (0,16 mesuré sur les 200 premières publiées, 0,19 sur 400, 2026-10-23)
    expect(premieres).toHaveLength(200);
    expect(avecCapteur / premieres.length).toBeGreaterThanOrEqual(0.1);
    expect(avecCapteur / premieres.length).toBeLessThanOrEqual(0.9);
  }, 120_000);
});
