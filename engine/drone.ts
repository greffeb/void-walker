import type { ActionEngagee, DefAction, Effet } from './actions';
import type { SonEmis } from './creature';
import { assourdie, autreCote, objetsDans, refObjet, refPassage, type EtatPartie } from './etat';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { Evenement, PhaseDrone, RaisonRefus, Savoir } from './vocabulaire';

/** Liaisons qu'un drone ne franchit jamais : vide, gabarit étroit, passage haut ou caché, passage d'un obstacle (#270). */
export function franchissableParDrone(liaison: DefLiaison, monde: DefMonde): boolean {
  return liaison.gouffre !== true && liaison.etroite !== true && liaison.haute === undefined && liaison.cachee === undefined
    && !monde.objets.some((objet) => objet.obstacle?.passage === liaison.id);
}

function obstacleDuDrone(monde: DefMonde, drone: string): DefObjet | undefined {
  const cible = monde.objets.find((objet) => objet.id === drone)?.drone?.obstacle;
  return monde.objets.find((objet) => objet.id === cible && objet.obstacle !== undefined);
}

const chemins = new WeakMap<DefMonde, Map<string, readonly string[] | null>>();

/**
 * Liaisons, dans l'ordre, du plus court chemin du drone de `depuis` à la pièce de son obstacle, portes ouvertes ou fermées ;
 * `[]` s'il y est, `null` sans chemin. Voisins visités dans l'ordre du monde : les égalités ne dépendent que de lui.
 */
export function cheminDrone(monde: DefMonde, drone: string, depuis: string): readonly string[] | null {
  let memo = chemins.get(monde);
  if (memo === undefined) chemins.set(monde, (memo = new Map()));
  const cle = `${drone}|${depuis}`;
  if (memo.has(cle)) return memo.get(cle) ?? null;
  // Sans `indexer`, qui valide le monde : la validation appelle cette fonction.
  const obstacle = obstacleDuDrone(monde, drone);
  let resultat: readonly string[] | null = null;
  if (obstacle !== undefined) {
    const liaisons = monde.liaisons.filter((liaison) => franchissableParDrone(liaison, monde));
    const venues = new Map<string, readonly string[]>([[depuis, []]]);
    for (const file = [depuis]; file.length > 0 && !venues.has(obstacle.piece); ) {
      const piece = file.shift() as string;
      for (const liaison of liaisons) {
        if (!liaison.entre.includes(piece)) continue;
        const autre = autreCote(liaison, piece);
        if (venues.has(autre)) continue;
        venues.set(autre, [...(venues.get(piece) ?? []), liaison.id]);
        file.push(autre);
      }
    }
    resultat = venues.get(obstacle.piece) ?? null;
  }
  memo.set(cle, resultat);
  return resultat;
}

/**
 * Pièces où un drone peut attendre (#270) : atteintes depuis le départ sans franchir un obstacle, une cloison verrouillée
 * seulement si un objet qui la déverrouille est lui-même atteint ; hors de la pièce de son obstacle ; d'où son chemin existe et
 * ne passe que par ces pièces. Dans l'ordre du monde.
 */
export function placesDuDrone(monde: DefMonde, drone: string): readonly string[] {
  const obstacle = obstacleDuDrone(monde, drone);
  if (obstacle === undefined) return [];
  const liaisons = new Map(monde.liaisons.map((liaison) => [liaison.id, liaison]));
  const passages = new Set(monde.objets.flatMap((objet) => (objet.obstacle === undefined ? [] : [objet.obstacle.passage])));
  const atteintes = new Set([monde.depart]);
  for (let change = true; change; ) {
    change = false;
    for (const liaison of monde.liaisons) {
      if (passages.has(liaison.id)) continue;
      if (liaison.verrouillee === true && !monde.objets.some((objet) => objet.deverrouille === liaison.id && atteintes.has(objet.piece))) continue;
      const [a, b] = liaison.entre;
      if (atteintes.has(a) !== atteintes.has(b)) {
        atteintes.add(atteintes.has(a) ? b : a);
        change = true;
      }
    }
  }
  return monde.pieces.map((piece) => piece.id).filter((piece) => {
    if (!atteintes.has(piece) || piece === obstacle.piece) return false;
    const chemin = cheminDrone(monde, drone, piece);
    if (chemin === null) return false;
    let ici = piece;
    for (const id of chemin) {
      const liaison = liaisons.get(id);
      if (liaison === undefined) return false;
      ici = autreCote(liaison, ici);
      if (ici !== obstacle.piece && !atteintes.has(ici)) return false;
    }
    return true;
  });
}

/** Le monde, drone posé dans cette pièce, hors de toute position. */
export function avecDroneEn(monde: DefMonde, drone: string, piece: string): DefMonde {
  return {
    ...monde,
    objets: monde.objets.map((objet) => {
      if (objet.id !== drone) return objet;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- la position appartient à la pièce d'origine.
      const { position, ...ailleurs } = objet;
      return { ...ailleurs, piece };
    }),
  };
}

/** Qualités bornées : un drone fixe, relié par un chemin franchissable à l'obstacle qu'il est seul à ranger (#270). */
export function validerDrones(monde: DefMonde): string[] {
  const erreurs: string[] = [];
  const objets = new Map(monde.objets.map((objet) => [objet.id, objet]));
  for (const objet of monde.objets) {
    if (objet.drone === undefined && objet.obstacle === undefined) continue;
    const erreur = (detail: string): void => { erreurs.push(`${objet.id} : ${detail}.`); };
    if (objet.portable !== false) erreur('dispositif de maintien portable');
    if (['appui', 'soin', 'extinction', 'glissant', 'avertisseur', 'source', 'capsule', 'alimente', 'depart',
      'vitrageExterieur', 'perce', 'protection', 'rebouche', 'pont', 'machines', 'gravite', 'fermeture', 'deverrouille', 'exige']
      .some((cle) => objet[cle as keyof DefObjet] !== undefined && objet[cle as keyof DefObjet] !== false)) erreur('qualité étrangère au dispositif de maintien');
    if (objet.drone !== undefined && objet.obstacle !== undefined) erreur('qualités de maintien incompatibles');
    if (objet.drone !== undefined) {
      if (objet.deplacable === true) erreur('dispositif fixe déplaçable');
      const cible = objets.get(objet.drone.obstacle);
      if (cible?.obstacle === undefined) erreur('obstacle du drone inconnu ou sans qualité');
      else if (monde.objets.filter((autre) => autre.drone?.obstacle === cible.id).length !== 1) erreur('plusieurs drones pour le même obstacle');
      else if (cheminDrone(monde, objet.id, objet.piece) === null) erreur('aucun chemin de drone vers son obstacle');
    }
    if (objet.obstacle !== undefined) {
      const { passage, rangement } = objet.obstacle;
      const liaison = monde.liaisons.find((candidate) => candidate.id === passage);
      if (objet.deplacable !== true || objet.position === undefined) erreur('obstacle sans position déplaçable');
      if (liaison === undefined || !liaison.entre.includes(objet.piece) || liaison.gouffre === true) erreur('passage de l’obstacle invalide');
      if (monde.positions?.find((position) => position.id === rangement)?.piece !== objet.piece || objet.position === rangement) erreur('rangement de l’obstacle invalide');
      if (!monde.objets.some((autre) => autre.drone?.obstacle === objet.id)) erreur('obstacle sans drone');
    }
  }
  return erreurs;
}

export function dronesInitiaux(monde: DefMonde): Pick<EtatPartie, 'drones'> {
  const drones = monde.objets.filter((objet) => objet.drone !== undefined);
  return drones.length === 0 ? {} : { drones: { phases: Object.fromEntries(drones.map((objet) => [objet.id, 'veille'])), tenue: null, bruits: [] } };
}

export function range(etat: EtatPartie, objet: DefObjet): boolean {
  const place = etat.objets[objet.id];
  return objet.obstacle !== undefined && place?.type === 'piece' && place.position === objet.obstacle.rangement;
}

export function obstacleSur(monde: DefMonde, etat: EtatPartie, passage: string): DefObjet | undefined {
  if (etat.drones === undefined) return undefined;
  return monde.objets.find((objet) => objet.obstacle?.passage === passage && !range(etat, objet));
}

export function maintienDrone(monde: DefMonde, etat: EtatPartie, poignee: string): boolean {
  return monde.objets.some((objet) => objet.drone?.poignee === poignee && etat.drones?.phases[objet.id] === 'maintien');
}

function changerPhase(etat: EtatPartie, id: string, phase: PhaseDrone): EtatPartie {
  if (etat.drones === undefined) return etat;
  return { ...etat, drones: { ...etat.drones, phases: { ...etat.drones.phases, [id]: phase } } };
}

export function lacherPoignee(monde: DefMonde, etat: EtatPartie): Effet {
  const tenue = etat.drones?.tenue;
  if (tenue === undefined || tenue === null || etat.drones === undefined) return { etat, evenements: [] };
  return { etat: { ...etat, drones: { ...etat.drones, tenue: null } }, evenements: [{ type: 'poignee_lachee', objet: refObjet(monde, tenue) }] };
}

function fini(monde: DefMonde, etat: EtatPartie, poignee: string): boolean {
  return monde.objets.some((objet) => objet.obstacle?.maintien === poignee && range(etat, objet));
}

/** Un seul filtre partagé par validation et menu, sans mutation pour un refus. */
export function avecMaintien(action: DefAction): DefAction {
  if (!action.engage || ['aller', 'deriver', 'attendre', 'lacher'].includes(action.id)) return action;
  return {
    ...action,
    verifier: (contexte, cible) => {
      const raison = action.verifier(contexte, cible);
      return raison ?? (contexte.etat.drones?.tenue != null ? 'lacher_poignee' : null);
    },
  };
}

type GesteDrone = 'envoyer' | 'replacer' | 'rearmer' | 'arreter_drone' | 'reprendre_drone';
function geste(id: GesteDrone, phases: readonly PhaseDrone[], phase: PhaseDrone, type: Evenement['type'], savoir: Savoir['type'], bruyant: boolean): ActionEngagee {
  const cibles: ActionEngagee['cibles'] = ({ monde, etat }) => etat.drones === undefined ? [] : objetsDans(monde, etat, etat.piece)
    .filter((objet) => objet.drone !== undefined && phases.includes(etat.drones?.phases[objet.id] ?? 'veille'))
    .map((objet) => objet.id);
  return {
    id, engage: true, cibles,
    verifier: (contexte, cible) => {
      if (!cibles(contexte).includes(cible)) return 'cible_absente';
      const rail = indexer(contexte.monde).objets.get(cible)?.drone?.rail;
      return id === 'envoyer' && rail !== undefined && contexte.etat.liaisons[rail] !== true ? 'ferme' : null;
    },
    prevoir: ({ monde, etat }, cible) => ({
      risque: 'aucun', danger: null, cout: bruyant && !assourdie(monde, etat, etat.piece) ? 'bruyant' : 'aucun',
      savoir: [{ type: savoir, objet: refObjet(monde, cible) } as Savoir],
    }),
    appliquer: ({ monde, etat }, cible) => ({
      etat: changerPhase(etat, cible, phase),
      evenements: [{ type, objet: refObjet(monde, cible) } as Evenement],
    }),
  };
}

const tenir: ActionEngagee = {
  id: 'tenir', engage: true,
  cibles: ({ monde, etat }) => etat.drones === undefined ? [] : objetsDans(monde, etat, etat.piece)
    .filter((objet) => objet.poignee === true && etat.drones?.tenue !== objet.id && !maintienDrone(monde, etat, objet.id) && !fini(monde, etat, objet.id))
    .map((objet) => objet.id),
  verifier: (contexte, cible) => tenir.cibles(contexte).includes(cible) ? null : 'cible_absente',
  prevoir: ({ monde }, cible) => ({ risque: 'aucun', danger: null, cout: 'aucun', savoir: [{ type: 'tiendra', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }, cible) => ({
    etat: etat.drones === undefined ? etat : { ...etat, drones: { ...etat.drones, tenue: cible } },
    evenements: [{ type: 'poignee_tenue', objet: refObjet(monde, cible) }],
  }),
};
const lacher: ActionEngagee = {
  id: 'lacher', engage: true,
  cibles: ({ etat }) => etat.drones?.tenue == null ? [] : [etat.drones.tenue],
  verifier: ({ etat }, cible) => etat.drones?.tenue === cible ? null : 'cible_absente',
  prevoir: ({ monde }, cible) => ({ risque: 'aucun', danger: null, cout: 'aucun', savoir: [{ type: 'lachera', objet: refObjet(monde, cible) }] }),
  appliquer: ({ monde, etat }) => lacherPoignee(monde, etat),
};

export const ACTIONS_DRONE = {
  envoyer: geste('envoyer', ['veille'], 'trajet', 'drone_envoye', 'enverra_drone', true),
  replacer: geste('replacer', ['deraille'], 'a_rearmer', 'drone_replace', 'replacera_drone', false),
  rearmer: geste('rearmer', ['a_rearmer'], 'maintien', 'drone_rearme', 'rearmera_drone', true),
  arreter_drone: geste('arreter_drone', ['maintien'], 'arrete', 'drone_arrete', 'arretera_drone', false),
  reprendre_drone: geste('reprendre_drone', ['arrete'], 'maintien', 'drone_rearme', 'rearmera_drone', true),
  tenir, lacher,
} as const;

export function frein(monde: DefMonde, etat: EtatPartie, objet: DefObjet): RaisonRefus | null {
  return objet.obstacle !== undefined && !maintienDrone(monde, etat, objet.obstacle.maintien) ? 'frein_serre' : null;
}

/** Actifs sans horloge ; le son porte l'identité physique inspectable de sa source. */
export function sonsDrones(monde: DefMonde, etat: EtatPartie): (SonEmis & { readonly drone: string })[] {
  if (etat.drones === undefined) return [];
  return monde.objets.flatMap((objet) => {
    const phase = etat.drones?.phases[objet.id];
    const place = etat.objets[objet.id];
    return (phase === 'trajet' || phase === 'maintien') && place?.type === 'piece'
      ? [{ piece: place.piece, intensite: 'fort', drone: objet.id }]
      : [];
  });
}

function sources(monde: DefMonde, etat: EtatPartie): string[] {
  return [...sonsDrones(monde, etat).map((son) => son.drone), ...etat.alarmes.map((alarme) => alarme.objet)];
}

/** Progression mécanique avant les dangers et la réaction ; aucun effet du vide, froid, feu ou gravité. */
export function avancerDrones(monde: DefMonde, avant: EtatPartie, effet: Effet): Effet {
  if (effet.etat.drones === undefined) return effet;
  let etat = effet.etat;
  const evenements = [...effet.evenements];
  if (avant.piece !== etat.piece) {
    const lachee = lacherPoignee(monde, etat);
    etat = lachee.etat;
    evenements.push(...lachee.evenements);
  }
  for (const objet of monde.objets) {
    if (objet.drone === undefined) continue;
    const phase = etat.drones?.phases[objet.id];
    const poignee = indexer(monde).objets.get(objet.drone.poignee);
    const place = etat.objets[objet.id];
    if (poignee === undefined || place?.type !== 'piece') continue;
    if (phase !== 'termine' && fini(monde, etat, poignee.id)) {
      etat = changerPhase(etat, objet.id, 'termine');
      // Seul un passager dans sa pièce le voit lâcher la poignée : hors de vue, rien n'est raconté (C-06 §5).
      if (etat.piece === place.piece) evenements.push({ type: 'drone_termine', objet: refObjet(monde, objet.id) });
    } else if (phase === 'trajet') {
      if (place.piece === poignee.piece) {
        etat = changerPhase(etat, objet.id, 'maintien');
        if (etat.piece === place.piece) evenements.push({ type: 'drone_maintient', objet: refObjet(monde, objet.id) });
      } else if (etat.liaisons[objet.drone.rail] === true && obstacleSur(monde, etat, objet.drone.rail) === undefined) {
        etat = { ...etat, objets: { ...etat.objets, [objet.id]: { type: 'piece', piece: poignee.piece } } };
      }
    }
  }
  // Ordre relatif de démarrage des sources actives : plus récent en dernier, taille bornée par les objets.
  const actives = sources(monde, etat);
  const precedentes = sources(monde, avant);
  const gardees = (avant.drones?.bruits ?? []).filter((id) => precedentes.includes(id) && actives.includes(id));
  const bruits = [...gardees, ...actives.filter((id) => !gardees.includes(id))];
  if (etat.drones !== undefined) etat = { ...etat, drones: { ...etat.drones, bruits } };
  return { ...effet, etat, evenements };
}

/** Appelé seulement par l'inspection de la source retenue, jamais après un mouvement de la créature. */
export function renverserDrone(monde: DefMonde, etat: EtatPartie, id: string): Effet {
  const place = etat.objets[id];
  const suivant = changerPhase(etat, id, 'deraille');
  if (place?.type !== 'piece') return { etat: suivant, evenements: [] };
  if (place.piece === etat.piece) return { etat: suivant, evenements: [{ type: 'drone_deraille', objet: refObjet(monde, id) }] };
  if (assourdie(monde, etat, etat.piece) || assourdie(monde, etat, place.piece)) return { etat: suivant, evenements: [] };
  const lien = monde.liaisons.find((liaison) => liaison.entre.includes(etat.piece) && autreCote(liaison, etat.piece) === place.piece && (etat.liaisons[liaison.id] === true || liaison.sonAuTravers === true));
  return { etat: suivant, evenements: lien === undefined ? [] : [{ type: 'drone_bruit_arrete', passage: refPassage(monde, etat, lien, etat.piece) }] };
}
