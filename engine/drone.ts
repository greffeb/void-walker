import type { ActionEngagee, Effet } from './actions';
import type { SonEmis } from './creature';
import { generateurDepuisGraine, suivant } from './des';
import { assourdie, autreCote, objetsDans, refObjet, refPassage, type EtatPartie } from './etat';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import type { Evenement, PhaseDrone, Savoir } from './vocabulaire';

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
 * seulement si un objet qui la déverrouille est lui-même atteint ; hors de la pièce de son obstacle et du repaire ; d'où son chemin existe et
 * ne passe que par ces pièces. Dans l'ordre du monde. `fermees` : cloisons de l'ordre libre, jamais franchies, pour que le drone
 * n'impose pas l'ordre des branches.
 */
export function placesDuDrone(monde: DefMonde, drone: string, fermees: ReadonlySet<string> = new Set()): readonly string[] {
  const obstacle = obstacleDuDrone(monde, drone);
  if (obstacle === undefined) return [];
  const liaisons = new Map(monde.liaisons.map((liaison) => [liaison.id, liaison]));
  const passages = new Set(monde.objets.flatMap((objet) => (objet.obstacle === undefined ? [] : [objet.obstacle.passage])));
  const atteintes = new Set([monde.depart]);
  for (let change = true; change; ) {
    change = false;
    for (const liaison of monde.liaisons) {
      if (passages.has(liaison.id) || fermees.has(liaison.id)) continue;
      if (liaison.verrouillee === true && !monde.objets.some((objet) => objet.deverrouille === liaison.id && atteintes.has(objet.piece))) continue;
      const [a, b] = liaison.entre;
      if (atteintes.has(a) !== atteintes.has(b)) {
        atteintes.add(atteintes.has(a) ? b : a);
        change = true;
      }
    }
  }
  // Une porte du chemin doit pouvoir s'ouvrir avant l'obstacle : sa commande (et la carte qu'elle exige) atteinte, sa pièce de
  // manœuvre aussi ; sinon le drone attendrait devant elle pour toujours.
  const atteint = (id: string | undefined): boolean => id === undefined || atteintes.has(monde.objets.find((objet) => objet.id === id)?.piece ?? '');
  const ouvrableAvant = (liaison: DefLiaison): boolean =>
    (liaison.manoeuvre === undefined || atteintes.has(liaison.manoeuvre))
    && (liaison.verrouillee !== true || monde.objets.some((objet) => objet.deverrouille === liaison.id && atteintes.has(objet.piece) && atteint(objet.exige)));
  return monde.pieces.map((piece) => piece.id).filter((piece) => {
    // Jamais dans le repaire de la créature : on ne l'y lancerait pas sans risque, et la station doit garder un chemin sûr (D-084).
    // Ni au départ, qui reste vide (GP-04).
    if (!atteintes.has(piece) || piece === obstacle.piece || piece === monde.creature?.piece || piece === monde.depart) return false;
    const chemin = cheminDrone(monde, drone, piece);
    if (chemin === null) return false;
    let ici = piece;
    for (const id of chemin) {
      const liaison = liaisons.get(id);
      if (liaison === undefined || !ouvrableAvant(liaison)) return false;
      ici = autreCote(liaison, ici);
      if (ici !== obstacle.piece && !atteintes.has(ici)) return false;
    }
    return true;
  });
}

/** Chaque drone posé dans une de ses places, tirée uniformément sur cette graine ; sans place, il reste où il est (#270). */
export function placerDrones(monde: DefMonde, graine: number, fermees: ReadonlySet<string> = new Set()): DefMonde {
  let alea = generateurDepuisGraine(graine);
  let resultat = monde;
  for (const objet of monde.objets) {
    if (objet.drone === undefined) continue;
    const places = placesDuDrone(resultat, objet.id, fermees);
    if (places.length === 0) continue;
    const tirage = suivant(alea);
    alea = tirage.etat;
    resultat = avecDroneEn(resultat, objet.id, places[Math.floor((tirage.valeur / 4294967296) * places.length)] ?? objet.piece);
  }
  return resultat;
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
  return drones.length === 0 ? {} : { drones: { phases: Object.fromEntries(drones.map((objet) => [objet.id, 'veille'])), bruits: [] } };
}

export function range(etat: EtatPartie, objet: DefObjet): boolean {
  const place = etat.objets[objet.id];
  return objet.obstacle !== undefined && place?.type === 'piece' && place.position === objet.obstacle.rangement;
}

export function obstacleSur(monde: DefMonde, etat: EtatPartie, passage: string): DefObjet | undefined {
  if (etat.drones === undefined) return undefined;
  return monde.objets.find((objet) => objet.obstacle?.passage === passage && !range(etat, objet));
}

function changerPhase(etat: EtatPartie, id: string, phase: PhaseDrone): EtatPartie {
  if (etat.drones === undefined) return etat;
  return { ...etat, drones: { ...etat.drones, phases: { ...etat.drones.phases, [id]: phase } } };
}

type GesteDrone = 'envoyer' | 'replacer' | 'rearmer' | 'arreter_drone' | 'reprendre_drone';
function geste(id: GesteDrone, phases: readonly PhaseDrone[], phase: PhaseDrone, type: Evenement['type'], savoir: Savoir['type'], bruyant: boolean): ActionEngagee {
  const cibles: ActionEngagee['cibles'] = ({ monde, etat }) => etat.drones === undefined ? [] : objetsDans(monde, etat, etat.piece)
    .filter((objet) => objet.drone !== undefined && phases.includes(etat.drones?.phases[objet.id] ?? 'veille'))
    .map((objet) => objet.id);
  return {
    id, engage: true, cibles,
    verifier: (contexte, cible) => cibles(contexte).includes(cible) ? null : 'cible_absente',
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

export const ACTIONS_DRONE = {
  // On n'envoie le drone qu'une fois vu l'obstacle qu'il dégage (#270) : avant, rien au menu ne parle de lui.
  envoyer: geste('envoyer', ['pret'], 'trajet', 'drone_envoye', 'enverra_drone', true),
  replacer: geste('replacer', ['deraille'], 'a_rearmer', 'drone_replace', 'replacera_drone', false),
  rearmer: geste('rearmer', ['a_rearmer'], 'trajet', 'drone_rearme', 'rearmera_drone', true),
  arreter_drone: geste('arreter_drone', ['trajet', 'roule', 'traction'], 'arrete', 'drone_arrete', 'arretera_drone', false),
  reprendre_drone: geste('reprendre_drone', ['arrete'], 'trajet', 'drone_rearme', 'rearmera_drone', true),
} as const;

/** Phase telle qu'on la voit et l'entend : en `trajet` devant une porte ouverte, il repart déjà (`roule`) ; arrêté devant une fermée. */
export function phaseVisible(monde: DefMonde, etat: EtatPartie, drone: string): PhaseDrone | undefined {
  const phase = etat.drones?.phases[drone];
  const place = etat.objets[drone];
  if (phase !== 'trajet' || place?.type !== 'piece') return phase;
  const suivante = cheminDrone(monde, drone, place.piece)?.[0];
  return suivante !== undefined && etat.liaisons[suivante] === true ? 'roule' : phase;
}

/** Actifs sans horloge : un drone fait du bruit en roulant et en tirant l'obstacle, jamais à l'arrêt (#270). */
export function sonsDrones(monde: DefMonde, etat: EtatPartie): (SonEmis & { readonly drone: string })[] {
  if (etat.drones === undefined) return [];
  return monde.objets.flatMap((objet) => {
    const phase = phaseVisible(monde, etat, objet.id);
    const place = etat.objets[objet.id];
    return (phase === 'roule' || phase === 'traction') && place?.type === 'piece'
      ? [{ piece: place.piece, intensite: 'fort', drone: objet.id }]
      : [];
  });
}

function sources(monde: DefMonde, etat: EtatPartie): string[] {
  return [...sonsDrones(monde, etat).map((son) => son.drone), ...etat.alarmes.map((alarme) => alarme.objet)];
}

/**
 * Progression mécanique avant les dangers et la réaction ; aucun effet du vide, froid, feu ou gravité. Deux actions par pièce
 * (#270) : `trajet` part à mi-chemin (`roule`) si la porte suivante de son chemin est ouverte, `roule` passe si elle l'est encore ;
 * arrivé, il tire l'obstacle à l'action suivante.
 */
export function avancerDrones(monde: DefMonde, avant: EtatPartie, effet: Effet): Effet {
  if (effet.etat.drones === undefined) return effet;
  let etat = effet.etat;
  const evenements = [...effet.evenements];
  const index = indexer(monde);
  for (const objet of monde.objets) {
    if (objet.drone === undefined) continue;
    const phase = etat.drones?.phases[objet.id];
    const obstacle = index.objets.get(objet.drone.obstacle);
    const place = etat.objets[objet.id];
    if (obstacle?.obstacle === undefined || place?.type !== 'piece') continue;
    // Le fait « obstacle vu » vit dans la phase, que la clé du solveur voit, et non dans les pièces visitées, qu'elle ignore.
    if (phase === 'veille' && etat.visitees.includes(obstacle.piece)) etat = changerPhase(etat, objet.id, 'pret');
    if (phase === 'traction') {
      const rangee = { ...etat, objets: { ...etat.objets, [obstacle.id]: { type: 'piece' as const, piece: obstacle.piece, position: obstacle.obstacle.rangement } } };
      etat = changerPhase(rangee, objet.id, 'termine');
      // Seul un passager dans sa pièce le voit ranger l'obstacle : hors de vue, rien n'est raconté (C-06 §5).
      if (etat.piece === place.piece) evenements.push({ type: 'drone_termine', objet: refObjet(monde, objet.id) });
      continue;
    }
    if (phase !== 'trajet' && phase !== 'roule') continue;
    if (place.piece === obstacle.piece) {
      etat = changerPhase(etat, objet.id, 'traction');
      continue;
    }
    const suivante = index.liaisons.get(cheminDrone(monde, objet.id, place.piece)?.[0] ?? '');
    const ouverte = suivante !== undefined && etat.liaisons[suivante.id] === true;
    if (phase === 'trajet') {
      if (ouverte) etat = changerPhase(etat, objet.id, 'roule');
    } else if (!ouverte || suivante === undefined) {
      etat = changerPhase(etat, objet.id, 'trajet');
    } else {
      const arrivee = autreCote(suivante, place.piece);
      const deplace = { ...etat, objets: { ...etat.objets, [objet.id]: { type: 'piece' as const, piece: arrivee } } };
      etat = changerPhase(deplace, objet.id, arrivee === obstacle.piece ? 'traction' : 'trajet');
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

/** En entrant dans une pièce, ce qu'on voit de ses obstacles : celui qui barre encore son passage, celui qui l'a dégagé (#271). */
export function obstaclesALArrivee(monde: DefMonde, etat: EtatPartie, piece: string): Evenement[] {
  return monde.objets.flatMap((objet) => {
    const place = etat.objets[objet.id];
    const liaison = objet.obstacle === undefined ? undefined : monde.liaisons.find((candidate) => candidate.id === objet.obstacle?.passage);
    if (liaison === undefined || place?.type !== 'piece' || place.piece !== piece) return [];
    return [{ type: range(etat, objet) ? 'obstacle_degage' : 'obstacle_en_travers', objet: refObjet(monde, objet.id), passage: refPassage(monde, etat, liaison, piece) }];
  });
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
