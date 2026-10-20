import { describe, expect, it } from 'vitest';
import { assemblerStation, exporter, nouvellePartie, prefixer, type DefMonde, type DefStation, type EmplacementDocument, type ReserveDocuments, type TableButin } from '../engine';
import { MORCEAUX, PIECES_CATALOGUE } from '../content';
import { CATALOGUE } from './catalogue';

// Assemblage d'une grande station (spec 2026-10-18 §6.2) avec les vrais morceaux et le vrai catalogue : vestibule, M-01, M-08,
// M-07, M-03, créature dans la réserve du final. Les morceaux pèsent 16 pièces dessinées : 8 annexes, 24 pièces en tout.

const morceau = (id: string) => {
  const entree = MORCEAUX[id];
  if (entree === undefined) throw new Error(`Morceau ${id} absent.`);
  return entree.morceau;
};

const MORCEAUX_STATION = ['vestibule', 'm-01', 'm-08', 'm-07', 'm-03'].map(morceau);

function station(graine: number): DefStation {
  return {
    id: `g1-test-${graine}`,
    morceaux: MORCEAUX_STATION,
    creature: 'm-03/p-reserve',
    graine,
    grande: { version: 1, catalogue: PIECES_CATALOGUE, annexes: 8, boucles: 3 },
  };
}

function mondes(nombre: number): DefMonde[] {
  return Array.from({ length: nombre }, (_, graine) => assemblerStation(station(graine))).flatMap((resultat) => (resultat.type === 'station' ? [resultat.monde] : []));
}

/** Vraie composition publiable pour cette graine, chaîne et ordre libre en alternance, sans documents. */
function stationReelle(graine: number): DefStation {
  const compositions = CATALOGUE.grandes.filter((composition) => composition.refus === null);
  const liste = compositions.filter((composition) => composition.forme === (graine % 2 === 0 ? 'chaine' : 'libre'));
  const composition = liste[Math.floor(graine / 2) % liste.length];
  if (composition === undefined) throw new Error('Aucune grande composition.');
  const station = CATALOGUE.definirGrande(composition.id, graine);
  if ('refus' in station) throw new Error(station.refus);
  // Le contenu branche la vraie réserve de documents (#209) ; ces tests mesurent le butin, ou injectent leur propre réserve d'essai.
  return station.grande === undefined ? station : { ...station, grande: { ...station.grande, documents: undefined } };
}

const MONDES = mondes(40);
const dessinees = (monde: DefMonde): number => monde.pieces.filter((piece) => piece.plan !== undefined).length;
const accueillantes = new Set(MORCEAUX_STATION.flatMap((leMorceau) => Object.keys(leMorceau.grande?.accueillantes ?? {}).map((piece) => prefixer(leMorceau.id, piece))));

describe('assemblage d’une grande station (spec 2026-10-18 §6.2)', () => {
  it('la plupart des graines donnent une station, chacune de 21 à 28 pièces dessinées', () => {
    expect(MONDES.length).toBeGreaterThanOrEqual(36);
    for (const monde of MONDES) {
      expect(dessinees(monde)).toBeGreaterThanOrEqual(21);
      expect(dessinees(monde)).toBeLessThanOrEqual(28);
    }
  });

  it('même identifiant et même graine, même monde (GE-06 étendue)', () => {
    expect(JSON.stringify(assemblerStation(station(3)))).toBe(JSON.stringify(assemblerStation(station(3))));
  });

  it('chaque annexe s’accroche à une pièce accueillante ou à un couloir du catalogue', () => {
    for (const monde of MONDES) {
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      for (const liaison of monde.liaisons.filter((candidate) => /^l-a\d+-/.test(candidate.id))) {
        const [accroche, annexe] = liaison.entre;
        expect(parId.get(annexe)?.forme).toBeDefined();
        expect(accueillantes.has(accroche) || parId.get(accroche)?.forme === 'couloir').toBe(true);
      }
    }
  });

  it('chaque pièce dessinée a un segment ; une annexe a celui de sa pièce d’accroche', () => {
    for (const monde of MONDES) {
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      for (const piece of monde.pieces.filter((candidate) => candidate.plan !== undefined)) expect(piece.segment).toBeTypeOf('number');
      for (const liaison of monde.liaisons.filter((candidate) => /^l-a\d+-/.test(candidate.id))) {
        const [accroche, annexe] = liaison.entre;
        expect(parId.get(annexe)?.segment).toBe(parId.get(accroche)?.segment);
      }
    }
  });

  it('les portes de boucle sont listées, fermées au départ, et relient deux pièces du même segment', () => {
    let boucles = 0;
    for (const monde of MONDES) {
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      for (const id of monde.boucles ?? []) {
        boucles++;
        const liaison = monde.liaisons.find((candidate) => candidate.id === id);
        expect(liaison?.ouverte).toBe(false);
        const [a, b] = liaison!.entre;
        expect(parId.get(a)?.segment).toBe(parId.get(b)?.segment);
      }
    }
    expect(boucles).toBeGreaterThan(0);
  });

  it('la piste marque le repaire, jamais le départ ; les bruits de station sont activés', () => {
    for (const monde of MONDES) {
      expect(monde.bruitsStation).toBe(true);
      expect(monde.pieces.find((piece) => piece.id === 'm-03/p-reserve')?.trace).toBe('forte');
      expect(monde.pieces.find((piece) => piece.id === monde.depart)?.trace).toBeUndefined();
    }
  });

  it('sans déclaration de grande station, le monde ne porte aucun des nouveaux champs', () => {
    const resultat = assemblerStation({ ...station(3), grande: undefined });
    expect(resultat.type).toBe('station');
    const texte = JSON.stringify(resultat);
    for (const champ of ['segment', 'trace', 'categorie', 'forme', 'boucles', 'bruitsStation', 'accueillantes', 'pillee', 'butin']) expect(texte).not.toContain(`"${champ}"`);
  });
});

describe('segments : zones entre deux coupes (spec 2026-10-18 §6.3, GE-13)', () => {
  const segment = (monde: DefMonde, piece: string): number | undefined => monde.pieces.find((candidate) => candidate.id === piece)?.segment;

  it('une coupe sépare deux segments ; une porte ordinaire entre deux morceaux, non', () => {
    for (const monde of MONDES) {
      expect(segment(monde, 'm-01/p-poste')).not.toBe(segment(monde, 'm-01/p-palier'));
      expect(segment(monde, 'm-08/p-ouest')).not.toBe(segment(monde, 'm-08/p-est'));
      // Le palier de M-01 et les quartiers de M-08 ne sont séparés que par une porte ordinaire : même côté des obstacles.
      expect(segment(monde, 'm-01/p-palier')).toBe(segment(monde, 'm-08/p-quartiers'));
      expect(segment(monde, 'vestibule/p-vestibule')).toBe(segment(monde, 'm-01/p-poste'));
    }
  });

  it('plus on franchit de coupes, plus le segment est grand', () => {
    for (const monde of MONDES) {
      const ordre = ['vestibule/p-vestibule', 'm-01/p-palier', 'm-08/p-est', 'm-07/p-coursive', 'm-03/p-embarquement'].map((piece) => segment(monde, piece) ?? -1);
      expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
      expect(new Set(ordre).size).toBe(ordre.length);
    }
  });
});

describe('clés dispersées (spec 2026-10-18 §6.5)', () => {
  const morceauDe = (piece: string): string => piece.slice(0, piece.indexOf('/'));

  it('sur 300 graines de vraies compositions, chaque clé est chez elle ou dans une pièce du catalogue de sa zone permise', () => {
    let stations = 0;
    let cles = 0;
    let deplacees = 0;
    for (let graine = 0; graine < 300; graine++) {
      const station = stationReelle(graine);
      const resultat = assemblerStation(station);
      if (resultat.type === 'invalide') throw new Error(`${station.id} : ${resultat.erreurs.join(' ')}`);
      if (resultat.type !== 'station') continue;
      stations++;
      const { monde } = resultat;
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      // Pièce du chemin principal d'où pend une annexe, en remontant les couloirs du catalogue.
      const accrocheDe = new Map(monde.liaisons.filter((liaison) => /^l-a\d+-/.test(liaison.id)).map((liaison) => [liaison.entre[1], liaison.entre[0]]));
      const racine = (piece: string): string => {
        let haut = piece;
        for (let suivante = accrocheDe.get(haut); suivante !== undefined; suivante = accrocheDe.get(haut)) haut = suivante;
        return haut;
      };
      const segmentsAvant = (id: string): (number | undefined)[] => (station.morceaux.find((candidat) => candidat.id === id)?.grande?.avant ?? []).map((piece) => parId.get(prefixer(id, piece))?.segment);
      const carrefour = station.morceaux.find((candidat) => candidat.famille === 'carrefour');
      let encombrantes = 0;
      station.morceaux.forEach((leMorceau, rang) => {
        const accroche = station.accroches?.find((candidate) => candidate.vers === leMorceau.id);
        // La zone qui précède : celle du morceau d'où part son entrée ; une branche de l'ordre libre part du couloir commun.
        const parent = accroche?.depuis ?? station.morceaux[rang - 1]?.id ?? leMorceau.id;
        const branche = carrefour !== undefined && accroche?.depuis === carrefour.id && accroche.piece === carrefour.entree;
        const zones = [...segmentsAvant(leMorceau.id), ...segmentsAvant(parent)];
        for (const [id, declaration] of Object.entries(leMorceau.grande?.cles ?? {})) {
          const objet = monde.objets.find((candidat) => candidat.id === prefixer(leMorceau.id, id));
          const origine = leMorceau.objets.find((candidat) => candidat.id === id)?.piece;
          if (objet === undefined || origine === undefined) throw new Error(`${station.id} : clé ${id} absente.`);
          cles++;
          expect(objet.piece, station.id).not.toBe(monde.depart);
          if (objet.piece === prefixer(leMorceau.id, origine)) continue;
          deplacees++;
          if (objet.encombrant === true) encombrantes++;
          // Instance 'a3-consigne' de l'annexe 'a-consigne'.
          const annexe = PIECES_CATALOGUE.find((candidate) => objet.piece.replace(/^a\d+-/, 'a-') === prefixer(candidate.id, 'p-piece'));
          expect(annexe?.annexe?.etiquettes.some((etiquette) => declaration.etiquettes.includes(etiquette)), `${station.id} : ${objet.id} dans ${objet.piece}`).toBe(true);
          expect(zones, `${station.id} : ${objet.id} dans ${objet.piece}`).toContain(parId.get(objet.piece)?.segment);
          if (branche) expect([leMorceau.id, carrefour.id], `${station.id} : ${objet.id} dans ${objet.piece}`).toContain(morceauDe(racine(objet.piece)));
        }
      });
      expect(encombrantes, station.id).toBeLessThanOrEqual(1);
      const caisse = monde.objets.find((objet) => objet.id === 'm-02/o-caisse');
      if (caisse !== undefined) {
        expect([caisse.portable, caisse.encombrant], station.id).toEqual([true, true]);
        expect(caisse.position, station.id).toBe(caisse.piece === 'm-02/p-atelier' ? 'm-02/pos-centre' : undefined);
      }
    }
    expect(deplacees).toBeGreaterThan(0);
    console.log(`clés dispersées : ${deplacees}/${cles} déplacées (${((deplacees / cles) * 100).toFixed(0)} %) sur ${stations} stations`);
  }, 120_000);
});

describe('salles de butin (spec 2026-10-18 §6.6)', () => {
  // Table de test, injectée ici : le contenu branche la vraie plus tard.
  const TABLE: TableButin = {
    entrees: [
      { objet: { id: 'o-trousse', nom: 'trousse', piece: '', soin: 1 }, poids: 1 },
      { objet: { id: 'o-burette-reserve', nom: 'burette de reserve', piece: '', glissant: 1 }, poids: 2, apresCoupeDe: 'm-04' },
    ],
    vide: 2,
    salles: [2, 3],
  };

  /** Portes à franchir depuis `depart` pour chaque pièce atteinte, portes ouvertes ou non, sans les liaisons `sauf`. */
  const distances = (monde: DefMonde, depart: string, sauf: ReadonlySet<string> = new Set()): Map<string, number> => {
    const vues = new Map([[depart, 0]]);
    const file = [depart];
    for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
      for (const liaison of monde.liaisons) {
        if (sauf.has(liaison.id) || !liaison.entre.includes(piece)) continue;
        for (const autre of liaison.entre) {
          if (vues.has(autre)) continue;
          vues.set(autre, (vues.get(piece) ?? 0) + 1);
          file.push(autre);
        }
      }
    }
    return vues;
  };
  const coupesM04 = (station: DefStation): Set<string> => new Set((station.morceaux.find((leMorceau) => leMorceau.id === 'm-04')?.grande?.coupe ?? []).map((coupe) => prefixer('m-04', coupe)));

  it('sur 300 graines de vraies compositions : impasses butin sans clé, la première sur la piste ou au plus près du repaire, burette après M-04, rien d’autre ne change', () => {
    let sansPlanAvant = 0;
    let sansPlanApres = 0;
    let stations = 0;
    let salles = 0;
    let pillees = 0;
    const parNombre = [0, 0, 0, 0];
    const premieres = { directe: 0, couloir: 0, repli: 0, aucune: 0 };
    let burettesM04 = 0;
    for (let graine = 0; graine < 300; graine++) {
      const station = stationReelle(graine);
      // Référence : la station sans table de butin, que le contenu branche désormais dans les vraies stations.
      const sans = assemblerStation({ ...station, grande: Object.fromEntries(Object.entries(station.grande ?? {}).filter(([cle]) => cle !== 'butin')) as unknown as DefStation['grande'] });
      const avec = assemblerStation({ ...station, grande: station.grande === undefined ? undefined : { ...station.grande, butin: TABLE } });
      if (sans.type === 'invalide' || avec.type === 'invalide') throw new Error(`${station.id} : invalide.`);
      if (sans.type !== 'station') sansPlanAvant++;
      if (avec.type !== 'station') sansPlanApres++;
      if (sans.type !== 'station' || avec.type !== 'station') continue;
      stations++;
      const { monde } = avec;
      const parId = new Map(monde.pieces.map((piece) => [piece.id, piece]));
      const accrocheDe = new Map(monde.liaisons.filter((liaison) => /^l-a\d+-/.test(liaison.id)).map((liaison) => [liaison.entre[1], liaison.entre[0]]));
      const butins = monde.objets.filter((objet) => objet.butin === true);
      const vides = monde.pieces.filter((piece) => piece.pillee === true).map((piece) => piece.id);
      const lesSalles = [...butins.map((objet) => objet.piece), ...vides];
      salles += lesSalles.length;
      pillees += vides.length;
      // Deux ou trois, moins si la station n'a pas assez d'impasses butin sans clé.
      expect(lesSalles.length, station.id).toBeLessThanOrEqual(3);
      parNombre[lesSalles.length] = (parNombre[lesSalles.length] ?? 0) + 1;
      // Une salle avec objet n'est pas pillée ; une salle ne reçoit qu'un objet.
      expect(new Set(lesSalles).size, station.id).toBe(lesSalles.length);

      // Candidates : impasses du catalogue d'étiquette butin, sans clé ; chaque salle en est une.
      const candidates = [...accrocheDe.keys()].filter((piece) => {
        const annexe = PIECES_CATALOGUE.find((candidate) => piece.replace(/^a\d+-/, 'a-') === prefixer(candidate.id, 'p-piece'))?.annexe;
        return annexe?.forme === 'impasse' && annexe.etiquettes.includes('butin') && !monde.objets.some((objet) => objet.piece === piece && objet.butin !== true);
      });
      for (const salle of lesSalles) expect(candidates, `${station.id} : ${salle}`).toContain(salle);

      // La première salle : sur la piste par sa chaîne d'accroches (forte d'abord), sinon parmi les plus proches du repaire.
      const chaine = (piece: string): string[] => {
        const haut: string[] = [];
        for (let suivante = accrocheDe.get(piece); suivante !== undefined; suivante = accrocheDe.get(suivante)) haut.push(suivante);
        return haut;
      };
      const trace = (piece: string) => chaine(piece).map((haut) => parId.get(haut)?.trace).find((intensite) => intensite !== undefined);
      const fortes = candidates.filter((piece) => trace(piece) === 'forte');
      const surPiste = fortes.length > 0 ? fortes : candidates.filter((piece) => trace(piece) === 'legere');
      const auRepaire = distances(monde, station.creature);
      const proche = Math.min(...candidates.map((piece) => auRepaire.get(piece) ?? Infinity));
      const preferees = surPiste.length > 0 ? surPiste : candidates.filter((piece) => auRepaire.get(piece) === proche);
      if (candidates.length === 0) {
        expect(lesSalles, station.id).toEqual([]);
        premieres.aucune++;
        continue;
      }
      const premiere = lesSalles.filter((salle) => preferees.includes(salle));
      expect(premiere, station.id).not.toEqual([]);
      if (surPiste.length === 0) premieres.repli++;
      else if (premiere.some((salle) => parId.get(accrocheDe.get(salle) ?? '')?.trace !== undefined)) premieres.directe++;
      else premieres.couloir++;

      // La burette, si M-04 est là, dans une salle qu'on n'atteint pas du départ sans franchir sa coupe, portes ouvertes ou non.
      const burette = butins.find((objet) => objet.nom === 'burette de reserve');
      const coupes = coupesM04(station);
      if (burette !== undefined && coupes.size > 0) {
        burettesM04++;
        expect(distances(monde, monde.depart, coupes).has(burette.piece), `${station.id} : burette dans ${burette.piece}`).toBe(false);
      }

      // Une sous-graine à part : sans le butin, le monde est celui assemblé sans table.
      const sansButin = { ...monde, objets: monde.objets.filter((objet) => objet.butin !== true) };
      expect(JSON.stringify(sansButin, (cle: string, valeur: unknown) => (cle === 'pillee' ? undefined : valeur)), station.id).toBe(JSON.stringify(sans.monde));

      // Rien ne signale une salle de butin : ni l'observation, ni la carte, ni l'export.
      const partie = nouvellePartie(monde, { version: 'test', graine });
      for (const salle of lesSalles) {
        const texte = JSON.stringify(exporter(monde, { ...partie, etat: { ...partie.etat, piece: salle } }));
        for (const champ of ['pillee', 'butin']) expect(texte, `${station.id} : ${salle}`).not.toContain(`"${champ}"`);
      }
    }
    // Le butin ne retire jamais son plan à une graine.
    expect(sansPlanApres).toBe(sansPlanAvant);
    expect(pillees).toBeGreaterThan(0);
    expect(salles).toBeGreaterThan(pillees);
    // La règle « après la coupe de M-04 » a été éprouvée : des burettes posées dans des stations qui ont M-04.
    expect(burettesM04).toBeGreaterThan(0);
    console.log(
      `butin : sans plan ${sansPlanAvant}/300 avant (${(sansPlanAvant / 3).toFixed(1)} %), ${sansPlanApres}/300 après (${(sansPlanApres / 3).toFixed(1)} %) ; ${salles} salles dont ${pillees} pillées sur ${stations} stations ; ` +
        `stations à 0, 1, 2, 3 salles : ${parNombre.join(', ')} ; première salle sur la piste directement ${premieres.directe}, par un couloir ${premieres.couloir}, au plus près du repaire ${premieres.repli}, aucune candidate ${premieres.aucune} ; ` +
        `burettes posées avec M-04 : ${burettesM04}`,
    );
  }, 300_000);

  it('avec M-04, la burette se pose, et seulement dans une salle qu’on n’atteint qu’en franchissant sa coupe', () => {
    const compositions = CATALOGUE.grandes.filter((composition) => composition.refus === null && composition.chemins.includes('m-04'));
    let stations = 0;
    let burettes = 0;
    for (let graine = 0; graine < 150; graine++) {
      const composition = compositions[graine % compositions.length];
      if (composition === undefined) throw new Error('Aucune grande composition avec M-04.');
      const station = CATALOGUE.definirGrande(composition.id, graine);
      if ('refus' in station) throw new Error(station.refus);
      const resultat = assemblerStation({ ...station, grande: station.grande === undefined ? undefined : { ...station.grande, butin: TABLE } });
      if (resultat.type === 'invalide') throw new Error(`${station.id} : ${resultat.erreurs.join(' ')}`);
      if (resultat.type !== 'station') continue;
      stations++;
      const burette = resultat.monde.objets.find((objet) => objet.butin === true && objet.nom === 'burette de reserve');
      if (burette === undefined) continue;
      burettes++;
      expect(distances(resultat.monde, resultat.monde.depart, coupesM04(station)).has(burette.piece), `${station.id} : burette dans ${burette.piece}`).toBe(false);
    }
    expect(burettes).toBeGreaterThan(5);
    console.log(`burette avec M-04 : posée dans ${burettes} stations sur ${stations}`);
  }, 120_000);
});

describe('documents et couverture (spec 2026-10-18 §8.4, §7.3)', () => {
  // Réserve d'essai, injectée ici : le contenu branche la vraie plus tard. Un univers par étiquette du catalogue, trois menaces
  // par étape, un document par morceau, une note par clé déclarée et une pour la trousse.
  const declarees = Object.values(MORCEAUX).flatMap(({ morceau: leMorceau }) => Object.keys(leMorceau.grande?.cles ?? {}).map((cle) => ({ morceau: leMorceau.id, cle })));
  const RESERVE: ReserveDocuments = {
    parStation: [5, 7],
    emplacements: [
      ...['couchage', 'eau', 'outillage', 'rangement', 'securite', 'soin', 'document', 'document'].map((etiquette, indice): EmplacementDocument => ({ id: `essai-univers-${indice}`, couche: 'univers', etiquettes: [etiquette] })),
      ...([1, 2, 3, 4] as const).flatMap((etape) => [0, 1, 2].map((indice): EmplacementDocument => ({ id: `essai-menace-${etape}-${indice}`, couche: 'menace', etape }))),
      ...Object.keys(MORCEAUX).map((id): EmplacementDocument => ({ id: `essai-morceau-${id}`, couche: 'morceau', morceau: id })),
      ...declarees.map(({ morceau: id, cle }): EmplacementDocument => ({ id: `essai-rangement-${id}-${cle}`, couche: 'rangement', morceau: id, cle })),
      { id: 'essai-rangement-trousse', couche: 'rangement', cle: 'butin:soin' },
    ],
  };
  const emplacementDe = new Map(RESERVE.emplacements.map((emplacement) => [emplacement.id, emplacement]));
  const annexesDe = (monde: DefMonde): string[] => monde.liaisons.filter((liaison) => /^l-a\d+-/.test(liaison.id)).map((liaison) => liaison.entre[1]);

  it('sur 300 graines de vraies compositions, chaque pièce du catalogue porte au moins une chose, et chaque clé déplacée sa note', () => {
    let sansPlanAvant = 0;
    let sansPlanApres = 0;
    let stations = 0;
    let reduites = 0;
    let documents = 0;
    let deplacees = 0;
    const durees: number[] = [];
    for (let graine = 0; graine < 300; graine++) {
      const station = stationReelle(graine);
      const sans = assemblerStation(station);
      const debut = performance.now();
      const avec = assemblerStation({ ...station, grande: station.grande === undefined ? undefined : { ...station.grande, documents: RESERVE } });
      durees.push(performance.now() - debut);
      if (sans.type === 'invalide' || avec.type === 'invalide') throw new Error(`${station.id} : invalide.`);
      if (sans.type !== 'station') sansPlanAvant++;
      if (avec.type !== 'station') sansPlanApres++;
      if (sans.type !== 'station' || avec.type !== 'station') continue;
      stations++;
      const { monde } = avec;

      // Couverture (§7.3) : un document, un objet, une salle de butin, un bout de porte de boucle ou une trace.
      const boucles = new Set(monde.boucles ?? []);
      const portent = new Set([
        ...monde.objets.map((objet) => objet.piece),
        ...monde.pieces.filter((piece) => piece.pillee === true || piece.trace !== undefined).map((piece) => piece.id),
        ...monde.liaisons.filter((liaison) => boucles.has(liaison.id)).flatMap((liaison) => liaison.entre),
      ]);
      for (const piece of annexesDe(monde)) expect(portent.has(piece), `${station.id} : ${piece} ne porte rien`).toBe(true);

      const docs = monde.objets.filter((objet) => objet.document === true);
      documents += docs.length;
      expect(docs.length, station.id).toBeGreaterThanOrEqual(5);
      expect(docs.length, station.id).toBeLessThanOrEqual(7);
      expect(docs.map((doc) => doc.piece), station.id).not.toContain(monde.depart);
      expect(new Set(docs.map((doc) => doc.piece)).size, station.id).toBe(docs.length);
      // Une salle pillée n'a plus rien : sa phrase de pillage le dit (C-05), aucun document n'y est posé.
      const pillees = new Set(monde.pieces.filter((piece) => piece.pillee === true).map((piece) => piece.id));
      for (const doc of docs) expect(pillees.has(doc.piece), `${station.id} : ${doc.nom} dans la salle pillée ${doc.piece}`).toBe(false);
      const presents = new Set(station.morceaux.map((leMorceau) => leMorceau.id));
      for (const doc of docs) {
        const emplacement = emplacementDe.get(doc.nom);
        if (emplacement?.couche === 'morceau') expect(presents.has(emplacement.morceau ?? ''), `${station.id} : ${doc.nom}`).toBe(true);
        if (emplacement?.cle === 'butin:soin') expect(monde.objets.find((objet) => objet.soin !== undefined)?.piece, station.id).toBe(doc.designe);
      }
      // Chaque clé déplacée a sa note, qui désigne la pièce où elle est.
      for (const leMorceau of station.morceaux) {
        for (const id of Object.keys(leMorceau.grande?.cles ?? {})) {
          const objet = monde.objets.find((candidat) => candidat.id === prefixer(leMorceau.id, id));
          const origine = leMorceau.objets.find((candidat) => candidat.id === id)?.piece;
          if (objet === undefined || origine === undefined) throw new Error(`${station.id} : clé ${id} absente.`);
          if (objet.piece === prefixer(leMorceau.id, origine)) continue;
          deplacees++;
          expect(docs.find((doc) => doc.nom === `essai-rangement-${leMorceau.id}-${id}`)?.designe, `${station.id} : note de ${id}`).toBe(objet.piece);
        }
      }

      // Une station qui garde ses annexes est celle assemblée sans réserve, aux documents près.
      if (annexesDe(monde).length < annexesDe(sans.monde).length) reduites++;
      else expect(JSON.stringify({ ...monde, objets: monde.objets.filter((objet) => objet.document !== true) }), station.id).toBe(JSON.stringify(sans.monde));
    }
    expect(stations).toBeGreaterThan(0);
    expect(deplacees).toBeGreaterThan(0);
    const moyenne = durees.reduce((total, duree) => total + duree, 0) / durees.length;
    console.log(
      `documents : sans plan ${sansPlanAvant}/300 avant (${(sansPlanAvant / 3).toFixed(1)} %), ${sansPlanApres}/300 après (${(sansPlanApres / 3).toFixed(1)} %) ; ` +
        `${reduites} stations sur ${stations} à moins d'annexes (${((reduites / stations) * 100).toFixed(1)} %) ; ${(documents / stations).toFixed(2)} documents par station ; ` +
        `${deplacees} clés déplacées, chacune avec sa note ; assemblage ${moyenne.toFixed(1)} ms en moyenne, ${Math.max(...durees).toFixed(1)} ms au pire`,
    );
  }, 300_000);
});
