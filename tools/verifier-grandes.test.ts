import { describe, expect, it, vi } from 'vitest';
import { jouer, nouvellePartie, observer } from '../engine';
import type { Catalogue, EntreeMonde, EtapeParcours } from '../content';
import { CATALOGUE } from './catalogue';
import {
  ecartsDesGrandes,
  lireTemoins,
  publierGrandes,
  rejouerTemoin,
  reparerTemoin,
  sansButin,
  temoinValable,
  verifierGrande,
  verifierPubliee,
  verifierPublieesDuLot,
  type LigneGrande,
  type PasTemoin,
} from './verifier-grandes';
import { trouverOption } from './rejouer-parcours';
import { rangsDesSegments } from './verifier-station';

// Preuve des grandes stations (spec 2026-10-18 §7, D-303) : contrôles, puis témoin du chemin principal rejoué dans la grande
// station privée de son butin, tel quel ou réparé, ou recherche directe ; en ordre libre, les deux ordres.

// Les contrôles de grande station, neutralisés le temps d'un test qui sert au rejeu un monde qu'ils refuseraient.
const controles = vi.hoisted(() => ({ neutres: false }));
vi.mock('./controles-grande', async (importOriginal) => {
  const reels = await importOriginal<typeof import('./controles-grande')>();
  return { ...reels, controlerGrande: (...arguments_: Parameters<typeof reels.controlerGrande>) => (controles.neutres ? [] : reels.controlerGrande(...arguments_)) };
});

/** Première graine qui donne un plan : une graine sur deux environ n'en a pas (aucune porte de boucle, D-295). */
function avecPlan(composition: string): string {
  const graine = Array.from({ length: 50 }, (_, rang) => rang).find((rang) => !('refus' in CATALOGUE.construireGrande(composition, rang)));
  if (graine === undefined) throw new Error(`${composition} : aucun plan sur 50 graines.`);
  return `${composition}-${graine}`;
}

const CHAINE = 'g1-m01-m02-m09-m06-cale';
const STATION = avecPlan(CHAINE);
const LIBRE = avecPlan('g1-ol-m01-m02-m09-m06-cale');
const graineDe = (station: string): number => Number(station.slice(station.lastIndexOf('-') + 1));

function construite(station: string): EntreeMonde {
  const entree = CATALOGUE.construireGrande(station.slice(0, station.lastIndexOf('-')), graineDe(station));
  if ('refus' in entree) throw new Error(entree.refus);
  return entree;
}

/** Première station de la composition, sur 200 graines, dont la caisse de M-02 a quitté son morceau et qui garde du butin. */
function caisseDeplacee(composition: string): string {
  const graine = Array.from({ length: 200 }, (_, rang) => rang).find((rang) => {
    const entree = CATALOGUE.construireGrande(composition, rang);
    return !('refus' in entree) && entree.monde.objets.some((objet) => objet.butin === true) && entree.monde.objets.some((objet) => objet.id === 'm-02/o-caisse' && !objet.piece.startsWith('m-02/'));
  });
  if (graine === undefined) throw new Error(`${composition} : caisse jamais déplacée avec du butin sur 200 graines.`);
  return `${composition}-${graine}`;
}

const CAISSE = caisseDeplacee(CHAINE);
const preuves = new Map<string, LigneGrande>();
/** Une preuve par station pour tout le fichier : elle coûte. */
function prouvee(station: string): LigneGrande {
  const ligne = preuves.get(station) ?? verifierGrande(CATALOGUE, station);
  preuves.set(station, ligne);
  return ligne;
}

/**
 * Petite station où le passager prend la source, l'installe dans la capsule, monte à bord et part. `source` : sa pièce ; le
 * réduit ne s'atteint que par l'antre, où dort la `creature` si elle est donnée.
 */
function petite(source: string, creature?: string): EntreeMonde {
  const reference = CATALOGUE.mondes['m-07'];
  if (reference === undefined) throw new Error('Monde m-07 absent.');
  return {
    ...reference,
    monde: {
      id: 'reparation-test',
      depart: 'a',
      pieces: [{ id: 'a', nom: 'quartiers' }, { id: 'quai', nom: 'embarquement' }, { id: 'cabine', nom: 'cabine', sousPosition: true }, { id: 'antre', nom: 'antre' }, { id: 'reduit', nom: 'reduit' }],
      liaisons: [
        { id: 'porte', nom: 'porte', entre: ['a', 'quai'], ouverte: false },
        { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: false },
        { id: 'sas', nom: 'sas', entre: ['a', 'antre'], ouverte: false },
        { id: 'trappe', nom: 'trappe', entre: ['antre', 'reduit'], ouverte: false },
      ],
      objets: [
        { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine' } },
        { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'capsule' },
        { id: 'source', nom: 'source', piece: source, source: true },
      ],
      ...(creature === undefined ? {} : { creature: { piece: creature } }),
    },
  };
}

/** Le témoin comme une station publiée le garde : les identifiants publics des cibles et des paramètres, relevés dans le menu. */
function enPublic(entree: EntreeMonde, etapes: readonly EtapeParcours[]): PasTemoin[] {
  let partie = nouvellePartie(entree.monde, { version: 'verifier-grandes', graine: 20261010 });
  return etapes.map((etape) => {
    const option = trouverOption(observer(entree.monde, partie.etat), etape);
    if (option === undefined) throw new Error(`Étape « ${etape.action} ${etape.cible} » absente du menu.`);
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`Étape « ${etape.action} ${etape.cible} » refusée.`);
    partie = resultat.partie;
    return option.parametre === undefined ? [option.action, option.cible.id] : [option.action, option.cible.id, option.parametre.id];
  });
}

/** Témoin de la petite station quand la source attend au départ. */
const TEMOIN_PETITE: readonly EtapeParcours[] = (
  [['prendre', 'source'], ['ouvrir', 'porte'], ['aller', 'porte'], ['installer', 'source'], ['ouvrir', 'ecoutille'], ['aller', 'ecoutille'], ['fermer', 'ecoutille'], ['lancer', 'pupitre']] as const
).map(([action, cible]) => ({ action, cible }));

describe('preuve des grandes stations (spec 2026-10-18 §7.4)', () => {
  it('rangsDesSegments suit le segment des pièces d’une grande station', () => {
    const entree = CATALOGUE.construireGrande(CHAINE, graineDe(STATION));
    if ('refus' in entree) throw new Error(entree.refus);
    const rang = rangsDesSegments(entree.monde);
    for (const piece of entree.monde.pieces) expect(rang(piece.id)).toBe(piece.segment);
  });

  it('une grande station en chaîne est prouvée', () => {
    const ligne = verifierGrande(CATALOGUE, STATION);
    expect(ligne.verdict, JSON.stringify(ligne)).toBe('prouvee');
    expect(ligne.actions).toBeGreaterThan(0);
  });

  it('une grande station en ordre libre est prouvée dans les deux ordres', () => {
    const ligne = verifierGrande(CATALOGUE, LIBRE);
    expect(ligne.ordres).toEqual(['prouvee', 'prouvee']);
    expect(ligne.verdict).toBe('prouvee');
  }, 120_000);

  it('une station qui échoue un contrôle est écartée, sans recherche', () => {
    const fautif: Catalogue = {
      ...CATALOGUE,
      construireGrande: (composition, graine) => {
        const entree = CATALOGUE.construireGrande(composition, graine);
        if ('refus' in entree) return entree;
        return { ...entree, monde: { ...entree.monde, pieces: entree.monde.pieces.map((piece) => (piece.id === entree.monde.depart ? { ...piece, trace: 'forte' as const } : piece)) } };
      },
    };
    const ligne = verifierGrande(fautif, STATION);
    expect(ligne.verdict).toBe('ecartee');
    expect(ligne.etats).toBe(0);
  });

  it('un témoin interrompu n’est pas une preuve', () => {
    const entree = CATALOGUE.construireGrande(CHAINE, graineDe(STATION));
    if ('refus' in entree) throw new Error(entree.refus);
    expect(temoinValable(entree, [])).toBe(false);
  });

  it('publierGrandes ne garde que des stations prouvées, triées, sans doublon', () => {
    const trois: Catalogue = { ...CATALOGUE, grandes: CATALOGUE.grandes.filter((composition) => [CHAINE, 'g1-m02-m01-m09-m06-cale', 'g1-m01-m09-m04-m03-observation'].includes(composition.id)) };
    const { publiees, temoins } = publierGrandes(trois, 1, 4);
    expect(publiees.length).toBeGreaterThanOrEqual(2);
    expect(new Set(publiees).size).toBe(publiees.length);
    expect(publiees).toEqual([...publiees].sort());
    for (const id of publiees) expect(verifierPubliee(trois, id, temoins[id]).verdict).toBe('prouvee');
  }, 120_000);

  it('une station publiée se vérifie par le rejeu de ses témoins ; un témoin tronqué ne prouve rien', () => {
    const ligne = verifierGrande(CATALOGUE, STATION);
    const temoins = ligne.temoins ?? [];
    expect(verifierPubliee(CATALOGUE, STATION, temoins).verdict).toBe('prouvee');
    expect(verifierPubliee(CATALOGUE, STATION, temoins.map((pas) => pas.slice(0, -1))).verdict).toBe('non_prouvee');
    expect(verifierPubliee(CATALOGUE, STATION, undefined).verdict).toBe('non_prouvee');
  });

  it('un témoin publié est rejoué aussi sur la station complète : valable sans le butin, il échoue avec lui, la station n’est plus prouvée', () => {
    // Petite station dont le « butin » est une seconde capsule (qualité interdite), listée avant la vraie : sans lui le témoin passe.
    const sans = petite('a');
    const complete: EntreeMonde = {
      ...sans,
      monde: { ...sans.monde, objets: [{ id: 'capsule-butin', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine' }, butin: true }, ...sans.monde.objets] },
    };
    const temoin = enPublic(sans, TEMOIN_PETITE);
    const definition = CATALOGUE.definirGrande(CHAINE, graineDe(STATION));
    const sur = (entree: EntreeMonde): Catalogue => ({ ...CATALOGUE, construireGrande: () => entree, definirGrande: () => definition });
    expect(rejouerTemoin(sansButin(complete), temoin)).not.toBeNull();
    expect(rejouerTemoin(complete, temoin)).toBeNull();
    controles.neutres = true;
    try {
      expect(verifierPubliee(sur(sans), STATION, [temoin]).verdict).toBe('prouvee');
      const ligne = verifierPubliee(sur(complete), STATION, [temoin]);
      expect(ligne.verdict).toBe('non_prouvee');
      expect(ligne.ecarts.join(' ')).toContain('avec ou sans le butin');
    } finally {
      controles.neutres = false;
    }
  });

  it('sansButin : le même monde, même id, privé de ses seuls objets de butin', () => {
    const entree = construite(CAISSE);
    const prive = sansButin(entree);
    expect(prive.monde.id).toBe(entree.monde.id);
    expect(prive.monde.objets).toEqual(entree.monde.objets.filter((objet) => objet.butin !== true));
    expect(prive.monde.objets.length).toBeLessThan(entree.monde.objets.length);
    expect({ ...prive.monde, objets: [] }).toEqual({ ...entree.monde, objets: [] });
  });

  it('une grande station dont la caisse a quitté son morceau est prouvée par témoin réparé, sans dé ni blessure', () => {
    const ligne = prouvee(CAISSE);
    expect(ligne.verdict, JSON.stringify(ligne.ecarts)).toBe('prouvee');
    expect(ligne.methode).toBe('repare');
    const [temoin] = ligne.temoins ?? [];
    if (temoin === undefined) throw new Error('Témoin absent.');
    expect(rejouerTemoin(sansButin(construite(CAISSE)), temoin)).not.toBeNull();
    expect(verifierPubliee(CATALOGUE, CAISSE, ligne.temoins ?? undefined).verdict).toBe('prouvee');
  }, 300_000);

  it('ce témoin se rejoue aussi sur la station complète, butin compris', () => {
    const entree = construite(CAISSE);
    expect(entree.monde.objets.some((objet) => objet.butin === true)).toBe(true);
    const [temoin] = prouvee(CAISSE).temoins ?? [];
    if (temoin === undefined) throw new Error('Témoin absent.');
    expect(rejouerTemoin(entree, temoin)).not.toBeNull();
  }, 300_000);

  it('témoin réparé : un détour sans danger est inséré ; un détour qui exigerait un dé est refusé (une seule voie, sous les yeux de la créature)', () => {
    expect(reparerTemoin(petite('a'), TEMOIN_PETITE)).toEqual(TEMOIN_PETITE);
    expect(reparerTemoin(petite('a', 'antre'), TEMOIN_PETITE)).toEqual(TEMOIN_PETITE);
    const repare = reparerTemoin(petite('reduit'), TEMOIN_PETITE);
    if (repare === null) throw new Error('Détour vers le réduit non trouvé.');
    expect(repare.length).toBeGreaterThan(TEMOIN_PETITE.length);
    expect(temoinValable(petite('reduit'), repare)).toBe(true);
    expect(reparerTemoin(petite('reduit', 'antre'), TEMOIN_PETITE)).toBeNull();
  });

  it('ordre libre : deux témoins du même ordre ne suffisent pas (G-07)', () => {
    const ligne = verifierGrande(CATALOGUE, LIBRE);
    const [premier, second] = ligne.temoins ?? [];
    expect(verifierPubliee(CATALOGUE, LIBRE, [premier!, second!]).verdict).toBe('prouvee');
    expect(verifierPubliee(CATALOGUE, LIBRE, [premier!, premier!]).verdict).toBe('non_prouvee');
  }, 120_000);
});

describe('liste publiée des grandes stations (spec 2026-10-18 §7.2, D-270)', () => {
  it('au moins 500 stations, environ un tiers en ordre libre, chacune avec ses témoins ; un dixième prouvé par leur rejeu (check:stations les rejoue toutes)', () => {
    const temoins = lireTemoins();
    const { publiees } = CATALOGUE;
    expect(publiees.length).toBeGreaterThanOrEqual(500);
    const libres = publiees.filter((id) => id.startsWith('g1-ol-')).length / publiees.length;
    expect(libres).toBeGreaterThan(0.25);
    expect(libres).toBeLessThan(0.4);
    expect(Object.keys(temoins).sort()).toEqual([...publiees]);
    const lignes = verifierPublieesDuLot({ numero: 1, total: 10 });
    expect(ecartsDesGrandes(lignes)).toEqual([]);
  }, 600_000);

  it('aucune note de rangement d’une station publiée n’est dans la pièce de sa clé (#209)', () => {
    let notes = 0;
    for (const id of CATALOGUE.publiees) {
      for (const doc of construite(id).monde.objets) {
        if (doc.document !== true || doc.designe === undefined) continue;
        notes++;
        expect(doc.piece, `${id} : ${doc.nom}`).not.toBe(doc.designe);
      }
    }
    expect(notes).toBeGreaterThan(100);
  }, 600_000);
});
