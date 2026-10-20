import { manoeuvrable, pontSur, verrouillee, type EtatPartie } from './etat';
import { indexer, type DefLiaison, type DefMonde, type DefObjet } from './monde';
import { obstacleSur, range } from './drone';

// « Plus aucune sortie » (D-085, D-275) : un calcul de chemin sur l'état réel. Les dangers (créature, feu, froid, vide) ne
// ferment aucun passage : on peut y laisser la vie, pas le chemin. Seul compte ce que l'on ne peut plus franchir ou
// apporter : vide sans pont, cloison dont la commande est hors d'atteinte, passage haut sans appui, capsule sans énergie.

/** Pièce où se trouve l'objet, ou `undefined` s'il est porté, installé, posé en pont ou perdu. */
function pieceDe(etat: EtatPartie, objet: DefObjet): string | undefined {
  const emplacement = etat.objets[objet.id];
  return emplacement?.type === 'piece' ? emplacement.piece : undefined;
}

/**
 * Vrai tant qu'une évacuation reste possible, en ignorant dés, blessures, créature, feu, froid et air. Une partie finie, ou un
 * monde sans capsule à lancer, comme le monde de test, ne reçoit jamais le signal.
 */
export function sortiePossible(monde: DefMonde, etat: EtatPartie): boolean {
  if (etat.fin !== null || etat.sante === 'vaincu' || !monde.objets.some((objet) => objet.depart !== undefined)) return true;
  const index = indexer(monde);
  const atteintes = new Set([etat.piece]);
  const deverrouillees = new Set<string>();
  const deplaces = new Set<string>();

  // Objet que le passager peut prendre : porté, posé dans une pièce atteinte, ou pont sur un vide qui en touche une.
  const aPortee = (objet: DefObjet): boolean => {
    const emplacement = etat.objets[objet.id];
    if (emplacement === undefined) return false;
    if (emplacement.type === 'passager') return true;
    if (emplacement.type === 'piece') return atteintes.has(emplacement.piece);
    if (emplacement.type === 'pont') return index.liaisons.get(emplacement.liaison)?.entre.some((piece) => atteintes.has(piece)) === true;
    return false;
  };
  // Pièces où l'objet peut être apporté : toutes celles atteintes, sauf, pour un objet large, au-delà d'un passage étroit (D-044)
  // ou par un passage qu'on ne franchit pas. `enCours` coupe un appui large qui se demanderait lui-même (aucun au lancement).
  const enCours = new Set<string>();
  function apportablesVers(objet: DefObjet): ReadonlySet<string> {
    if (objet.portable === false || !aPortee(objet) || enCours.has(objet.id)) return new Set();
    if (objet.large !== true) return atteintes;
    const emplacement = etat.objets[objet.id];
    const depart =
      emplacement?.type === 'piece' ? emplacement.piece
      : emplacement?.type === 'pont' ? (index.liaisons.get(emplacement.liaison)?.entre.find((piece) => atteintes.has(piece)) ?? etat.piece)
      : etat.piece;
    const vues = new Set([depart]);
    enCours.add(objet.id);
    for (const piece of vues) {
      for (const liaison of monde.liaisons) {
        if (liaison.etroite === true || !liaison.entre.includes(piece)) continue;
        const autre = liaison.entre[0] === piece ? liaison.entre[1] : liaison.entre[0];
        if (atteintes.has(autre) && franchissable(liaison, piece)) vues.add(autre);
      }
    }
    enCours.delete(objet.id);
    return vues;
  }
  // Un appui stable peut se trouver sous la liaison haute, de son côté haut (C-02 §5).
  const appuiPossible = (liaison: DefLiaison, cote: string): boolean => {
    const positions = (monde.positions ?? []).filter((position) => position.piece === cote && position.sous === liaison.id);
    return monde.objets.some((objet) => {
      if (objet.appui !== true) return false;
      const emplacement = etat.objets[objet.id];
      if (emplacement?.type === 'piece' && emplacement.piece === cote && positions.some((position) => position.id === emplacement.position)) return true;
      if (objet.deplacable !== true || positions.length === 0) return false;
      return (emplacement?.type === 'piece' && emplacement.piece === cote && atteintes.has(cote)) || apportablesVers(objet).has(cote);
    });
  };
  const atteignableDe = (liaison: DefLiaison, cote: string): boolean => liaison.haute !== cote || appuiPossible(liaison, cote);
  const decouverte = (liaison: DefLiaison): boolean => etat.decouvertes.includes(liaison.id);

  function franchissable(liaison: DefLiaison, depuis: string): boolean {
    const obstacle = obstacleSur(monde, etat, liaison.id);
    if (obstacle !== undefined && !deplaces.has(obstacle.id)) return false;
    // Un passage caché n'existe pas de son côté caché tant qu'il n'est pas découvert ; de l'autre, l'ouvrir le découvre (K-05).
    if (liaison.cachee !== undefined && !decouverte(liaison) && (liaison.cachee === depuis || !manoeuvrable(liaison, depuis))) return false;
    if (liaison.gouffre === true) {
      if (pontSur(monde, etat, liaison.id) !== undefined) return true;
      return monde.objets.some((objet) => objet.pont === true && apportablesVers(objet).has(depuis));
    }
    if (verrouillee(etat, liaison.id) && !deverrouillees.has(liaison.id)) return false;
    if (!atteignableDe(liaison, depuis)) return false;
    return etat.liaisons[liaison.id] === true || manoeuvrable(liaison, depuis);
  }

  for (let change = true; change; ) {
    change = false;
    for (const objet of monde.objets) {
      // Panne réparable sans consommable : le poste et l'obstacle doivent être accessibles, ainsi que le drone et son rail.
      if (objet.obstacle !== undefined && !range(etat, objet) && !deplaces.has(objet.id)) {
        const poignee = index.objets.get(objet.obstacle.maintien);
        const drone = monde.objets.find((candidat) => candidat.drone?.poignee === poignee?.id);
        const rail = drone?.drone === undefined ? undefined : index.liaisons.get(drone.drone.rail);
        const ici = drone === undefined ? undefined : pieceDe(etat, drone);
        if (atteintes.has(objet.piece) && poignee !== undefined && atteintes.has(poignee.piece) && ici !== undefined && atteintes.has(ici)
          && rail !== undefined && (ici === poignee.piece || franchissable(rail, ici))) {
          deplaces.add(objet.id);
          change = true;
        }
      }
      if (objet.deverrouille === undefined || deverrouillees.has(objet.deverrouille)) continue;
      const piece = pieceDe(etat, objet);
      const carte = objet.exige === undefined ? undefined : index.objets.get(objet.exige);
      if (piece !== undefined && atteintes.has(piece) && (objet.exige === undefined || (carte !== undefined && aPortee(carte)))) {
        deverrouillees.add(objet.deverrouille);
        change = true;
      }
    }
    for (const liaison of monde.liaisons) {
      const [a, b] = liaison.entre;
      if (atteintes.has(a) === atteintes.has(b)) continue;
      const depuis = atteintes.has(a) ? a : b;
      if (!franchissable(liaison, depuis)) continue;
      atteintes.add(depuis === a ? b : a);
      change = true;
    }
  }

  return monde.objets.some((pupitre) => {
    const capsule = pupitre.depart === undefined ? undefined : index.objets.get(pupitre.depart);
    const cabine = pupitre.depart === undefined ? undefined : pieceDe(etat, pupitre);
    if (capsule === undefined || cabine === undefined || !atteintes.has(cabine)) return false;
    // Lancer demande la cabine close : chaque passage fermé, ou que l'on peut fermer de l'intérieur ; et l'on y entre par un
    // passage que l'on referme derrière soi, sauf si l'on y est déjà.
    const fermable = (liaison: DefLiaison): boolean =>
      liaison.gouffre !== true && manoeuvrable(liaison, cabine) && atteignableDe(liaison, cabine) && (liaison.cachee !== cabine || decouverte(liaison));
    const close = monde.liaisons.every((liaison) => !liaison.entre.includes(cabine) || etat.liaisons[liaison.id] !== true || fermable(liaison));
    const entree =
      etat.piece === cabine ||
      monde.liaisons.some((liaison) => {
        if (!liaison.entre.includes(cabine) || !fermable(liaison)) return false;
        const dehors = liaison.entre[0] === cabine ? liaison.entre[1] : liaison.entre[0];
        return atteintes.has(dehors) && franchissable(liaison, dehors);
      });
    return close && entree && alimentable(monde, etat, capsule, atteintes, apportablesVers);
  });
}

/** La capsule a ou peut recevoir de l'énergie : réserve, circuit activé ou à activer, source installée ou à apporter. */
function alimentable(
  monde: DefMonde,
  etat: EtatPartie,
  capsule: DefObjet,
  atteintes: ReadonlySet<string>,
  apportablesVers: (objet: DefObjet) => ReadonlySet<string>,
): boolean {
  const ici = pieceDe(etat, capsule);
  return monde.objets.some((objet) => {
    if (objet.alimente === capsule.id) {
      const piece = pieceDe(etat, objet);
      return etat.actives.includes(objet.id) || (piece !== undefined && atteintes.has(piece));
    }
    if (objet.source !== true) return false;
    const emplacement = etat.objets[objet.id];
    if (emplacement?.type === 'installe') return emplacement.dans === capsule.id;
    return ici !== undefined && apportablesVers(objet).has(ici);
  }) || capsule.capsule?.alimentee === true;
}
