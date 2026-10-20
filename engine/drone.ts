import type { ActionEngagee, DefAction, Effet } from './actions';
import type { SonEmis } from './creature';
import { assourdie, autreCote, objetsDans, refObjet, refPassage, type EtatPartie } from './etat';
import { indexer, type DefMonde, type DefObjet } from './monde';
import type { Evenement, PhaseDrone, RaisonRefus, Savoir } from './vocabulaire';

/** Qualités bornées : un rail relie le départ du drone à sa poignée ; l'obstacle est manipulé ailleurs. */
export function validerDrones(monde: DefMonde): string[] {
  const erreurs: string[] = [];
  const objets = new Map(monde.objets.map((objet) => [objet.id, objet]));
  for (const objet of monde.objets) {
    if (objet.drone === undefined && objet.poignee !== true && objet.obstacle === undefined) continue;
    const erreur = (detail: string): void => { erreurs.push(`${objet.id} : ${detail}.`); };
    if (objet.portable !== false) erreur('dispositif de maintien portable');
    if (['appui', 'soin', 'extinction', 'glissant', 'avertisseur', 'source', 'capsule', 'alimente', 'depart',
      'vitrageExterieur', 'perce', 'protection', 'rebouche', 'pont', 'machines', 'gravite', 'fermeture', 'deverrouille', 'exige']
      .some((cle) => objet[cle as keyof DefObjet] !== undefined && objet[cle as keyof DefObjet] !== false)) erreur('qualité étrangère au dispositif de maintien');
    if ([objet.drone !== undefined, objet.poignee === true, objet.obstacle !== undefined].filter(Boolean).length !== 1) erreur('qualités de maintien incompatibles');
    if (objet.drone !== undefined || objet.poignee === true) {
      if (objet.deplacable === true) erreur('dispositif fixe déplaçable');
    }
    if (objet.drone !== undefined) {
      const rail = monde.liaisons.find((liaison) => liaison.id === objet.drone?.rail);
      const poignee = objets.get(objet.drone.poignee);
      if (poignee?.poignee !== true) erreur('poignée du drone inconnue ou sans qualité');
      if (rail === undefined || !rail.entre.includes(objet.piece) || poignee === undefined || !rail.entre.includes(poignee.piece) || objet.piece === poignee.piece) erreur('rail hors du trajet local');
      if (rail?.gouffre === true || rail?.etroite === true || rail?.haute !== undefined || rail?.cachee !== undefined) erreur('rail incompatible avec le passage');
      if (monde.objets.filter((autre) => autre.drone?.poignee === objet.drone?.poignee).length !== 1) erreur('plusieurs drones pour la même poignée');
    }
    if (objet.poignee === true && !monde.objets.some((autre) => autre.drone?.poignee === objet.id)) erreur('poignée sans drone');
    if (objet.obstacle !== undefined) {
      const { passage, rangement, maintien } = objet.obstacle;
      const liaison = monde.liaisons.find((candidate) => candidate.id === passage);
      const poignee = objets.get(maintien);
      if (objet.deplacable !== true || objet.position === undefined) erreur('obstacle sans position déplaçable');
      if (liaison === undefined || !liaison.entre.includes(objet.piece) || liaison.gouffre === true) erreur('passage de l’obstacle invalide');
      if (monde.positions?.find((position) => position.id === rangement)?.piece !== objet.piece || objet.position === rangement) erreur('rangement de l’obstacle invalide');
      if (poignee?.poignee !== true || poignee.piece === objet.piece) erreur('maintien de l’obstacle invalide');
      if (monde.objets.filter((autre) => autre.obstacle?.maintien === maintien).length !== 1) erreur('plusieurs obstacles pour la même poignée');
      if (monde.objets.some((autre) => autre.drone?.rail === passage)) erreur('obstacle sur le rail');
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
