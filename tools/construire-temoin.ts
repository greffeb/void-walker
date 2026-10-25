import { idPublic, jouer, menu as menuPublic, nouvellePartie, type DefLiaison, type DefObjet, type IdAction, type Partie } from '../engine';
import type { EntreeMonde } from '../content';
import type { PasTemoin } from './verifier-grandes';

interface Trajet {
  readonly partie: Partie;
  readonly pas: readonly PasTemoin[];
}

// shortcut: 4 096 commandes par objectif, enrichir les recettes si une preuve dépasse ce budget.
const MAX_COMMANDES = 4_096;

/** Recettes des mécanismes, puis navigation sur les pièces ; jamais de recherche dans le graphe des états du monde. */
export function construireTemoin(entree: EntreeMonde, ordre: readonly string[] = []): readonly PasTemoin[] | null {
  const { monde } = entree;
  const publics = new Map([...monde.pieces, ...monde.liaisons, ...monde.objets, ...(monde.positions ?? [])].map(({ id }) => [id, idPublic(monde.id, id)]));
  const voisines = new Map(monde.pieces.map(({ id }) => [id, monde.liaisons.filter((liaison) => liaison.entre.includes(id))]));
  const objets = new Map(monde.objets.map((objet) => [objet.id, objet]));
  const pieceCreature = monde.creature?.piece;
  const grilleGardee = monde.liaisons.some((liaison) => liaison.haute !== undefined && liaison.haute === pieceCreature);
  // Ouvrir la porte d'une pièce voisine la soumet aussi au vide du vitrage percé.
  const diversionDirecte = monde.objets.some((objet) =>
    (objet.avertisseur?.alcove === true && objet.avertisseur.piece === pieceCreature) ||
    (objet.vitrageExterieur === true && (objet.piece === pieceCreature || (voisines.get(objet.piece) ?? []).some((liaison) => liaison.entre.includes(pieceCreature ?? '')))),
  );
  let partie = nouvellePartie(monde, { version: 'verifier-grandes', graine: 20261010 });
  const pas: PasTemoin[] = [];
  const enCours = new Set<string>();
  let commandes = 0;
  let plafond = MAX_COMMANDES;
  const menus = new WeakMap<Partie['etat'], ReturnType<typeof menuPublic>>();

  function menu(depart: Partie): ReturnType<typeof menuPublic> {
    const connu = menus.get(depart.etat);
    if (connu !== undefined) return connu;
    const actuel = menuPublic(monde, depart.etat);
    menus.set(depart.etat, actuel);
    return actuel;
  }

  function essayer(operation: () => boolean): boolean {
    const avant = partie;
    const longueur = pas.length;
    if (operation()) return true;
    partie = avant;
    pas.length = longueur;
    return false;
  }

  function recette(id: string, operation: () => boolean): boolean {
    if (enCours.has(id) || commandes >= plafond) return false;
    enCours.add(id);
    const resultat = essayer(operation);
    enCours.delete(id);
    return resultat;
  }

  /** Une piste infructueuse ne doit pas consommer tout le budget avant les autres mécanismes. */
  function strategie(operation: (continuer: () => boolean) => boolean, suite: () => boolean): boolean {
    const precedent = plafond;
    let limite = Math.min(plafond, commandes + 512);
    plafond = limite;
    const continuer = (): boolean => {
      // La suite consomme le plafond global, pas les gestes encore disponibles pour terminer cette tactique.
      const restant = Math.max(0, limite - commandes);
      plafond = precedent;
      try {
        return suite();
      } finally {
        limite = Math.min(precedent, commandes + restant);
        plafond = limite;
      }
    };
    try {
      return operation(continuer);
    } finally {
      plafond = precedent;
    }
  }

  function geste(depart: Partie, action: IdAction, cible: string, parametre?: string): Trajet | null {
    if (commandes >= plafond) return null;
    commandes++;
    const option = menu(depart).find((candidate) => candidate.action === action && candidate.cible.id === publics.get(cible) && candidate.parametre?.id === (parametre === undefined ? undefined : publics.get(parametre)));
    if (option === undefined || !option.disponible) return null;
    const resultat = jouer(monde, depart, option.commande);
    if (resultat.type !== 'engagee' || resultat.tirages.length !== 0 || resultat.partie.etat.sante !== 'indemne') return null;
    const verrous = resultat.partie.etat.verrous ?? [];
    // Les commandes propres aux morceaux (M-11) restent libres ; les cloisons du carrefour suivent le préfixe demandé.
    let encoreVerrouillee = false;
    for (const cloison of ordre) {
      if (verrous.includes(cloison)) encoreVerrouillee = true;
      else if (encoreVerrouillee) return null;
    }
    const courante = resultat.partie;
    return { partie: { ...courante, enregistrement: { ...courante.enregistrement, actions: [] }, derniers: [] }, pas: [option.parametre === undefined ? [action, option.cible.id] : [action, option.cible.id, option.parametre.id]] };
  }

  function agir(action: IdAction, cible: string, parametre?: string): boolean {
    const suivant = geste(partie, action, cible, parametre);
    if (suivant === null) return false;
    partie = suivant.partie;
    pas.push(...suivant.pas);
    return true;
  }

  const autre = (liaison: DefLiaison, piece: string): string => liaison.entre[0] === piece ? liaison.entre[1] : liaison.entre[0];
  const active = (): boolean => partie.etat.creature !== null && partie.etat.creature.neutralisee === undefined;
  const porte = (objet: DefObjet): boolean => partie.etat.objets[objet.id]?.type === 'passager';

  function distances(destination: string): Map<string, number> {
    const distances = new Map([[destination, 0]]);
    const file = [destination];
    for (const piece of file) {
      for (const liaison of voisines.get(piece) ?? []) {
        const voisine = autre(liaison, piece);
        if (distances.has(voisine)) continue;
        distances.set(voisine, (distances.get(piece) ?? 0) + 1);
        file.push(voisine);
      }
    }
    return distances;
  }

  function traverser(depart: Partie, liaison: DefLiaison, fermer: boolean): Trajet | null {
    let courante = depart;
    const etapes: PasTemoin[] = [];
    const faire = (action: IdAction): boolean => {
      const suite = geste(courante, action, liaison.id);
      if (suite === null) return false;
      courante = suite.partie;
      etapes.push(...suite.pas);
      return true;
    };
    if (courante.etat.liaisons[liaison.id] !== true && !faire('ouvrir')) return null;
    const aller = menu(courante).find((option) => option.action === 'aller' && option.cible.id === publics.get(liaison.id));
    if (aller?.raison === 'trop_loin' && !faire('deriver')) return null;
    if (!faire('aller')) return null;
    // Refermer derrière une poursuite achète du temps, sans gaspiller le répit quand elle est déjà dans notre pièce.
    if (fermer && courante.etat.creature?.contact === true && courante.etat.creature.neutralisee === undefined && courante.etat.creature.piece === depart.etat.piece) faire('fermer');
    return { partie: courante, pas: etapes };
  }

  /** Un tour de boucle pour distancer la créature : plus court retour sans reprendre la porte de départ. */
  function circuits(piece: string): readonly (readonly DefLiaison[])[] {
    const circuits: DefLiaison[][] = [];
    for (const premiere of voisines.get(piece) ?? []) {
      if (premiere.gouffre === true) continue;
      const depart = autre(premiere, piece);
      const file = [{ piece: depart, chemin: [premiere] }];
      const vus = new Set([piece, depart]);
      for (const noeud of file) {
        for (const liaison of voisines.get(noeud.piece) ?? []) {
          if (liaison.id === premiere.id || liaison.gouffre === true) continue;
          const suivante = autre(liaison, noeud.piece);
          if (suivante === piece) {
            if (noeud.chemin.length >= 3) circuits.push([...noeud.chemin, liaison]);
            continue;
          }
          if (vus.has(suivante)) continue;
          vus.add(suivante);
          file.push({ piece: suivante, chemin: [...noeud.chemin, liaison] });
        }
      }
    }
    return circuits;
  }

  function tourner(trajets: ReadonlyMap<string, Trajet>, suite: () => boolean): boolean {
    if ([...enCours].some((id) => id.startsWith('circuit:') || id.startsWith('piege:') || id.startsWith('repli:'))) return false;
    for (const [piece, trajet] of trajets) {
      const creature = trajet.partie.etat.creature;
      if (creature?.contact !== true || creature.neutralisee !== undefined) continue;
      if (creature.piece !== piece && !(voisines.get(piece) ?? []).some((liaison) => liaison.entre.includes(creature.piece ?? ''))) continue;
      if (recette(`circuit:${piece}`, () => {
        const debut = partie;
        const longueur = pas.length;
        for (const circuit of circuits(piece)) {
          for (const fermeture of ['extremites', 'toutes', 'depart', 'aucune']) {
            if (commandes >= plafond) return false;
            partie = debut;
            pas.length = longueur;
            const entree = circuit[0];
            const approche = entree === undefined ? undefined : trajets.get(autre(entree, piece));
            const inverse = debut.etat.creature?.contact !== true && debut.etat.creature?.piece === piece && approche !== undefined && approche.partie.etat.creature?.contact !== true;
            if (inverse && entree !== undefined && approche !== undefined) {
              // Premier contact par ce côté, puis retour immédiat : l'autre entrée reste fermée pendant le détour.
              partie = approche.partie;
              pas.push(...approche.pas);
              const contact = traverser(partie, entree, false);
              if (contact === null) continue;
              const retour = traverser(contact.partie, entree, false);
              if (retour === null) continue;
              partie = retour.partie;
              pas.push(...contact.pas, ...retour.pas);
            } else {
              partie = trajet.partie;
              pas.push(...trajet.pas);
            }
            let complet = true;
            for (const [rang, liaison] of circuit.entries()) {
              if (inverse && rang === 0) continue;
              if (inverse && rang === circuit.length - 1 && partie.etat.liaisons[liaison.id] !== true) {
                if (!agir('ouvrir', liaison.id)) { complet = false; break; }
                const precedente = circuit[rang - 1];
                if (precedente !== undefined && partie.etat.liaisons[precedente.id] !== true && !agir('ouvrir', precedente.id)) { complet = false; break; }
              }
              const fermer = fermeture === 'toutes' || fermeture === 'extremites' && (rang === 0 || rang === circuit.length - 1) || fermeture === 'depart' && rang === 0;
              const suivant = traverser(partie, liaison, fermer);
              if (suivant === null) { complet = false; break; }
              partie = suivant.partie;
              pas.push(...suivant.pas);
              if (inverse && fermeture === 'toutes' && rang < circuit.length - 1 && partie.etat.liaisons[liaison.id] === true && !agir('fermer', liaison.id)) { complet = false; break; }
            }
            if (complet && suite()) return true;
            partie = debut;
            pas.length = longueur;
          }
        }
        return false;
      })) return true;
    }
    return false;
  }

  /** Un repli derrière une porte, fermée puis rouverte, laisse la poursuite prendre le détour. */
  function reculer(trajets: ReadonlyMap<string, Trajet>, suite: () => boolean): boolean {
    if ([...enCours].some((id) => id.startsWith('repli:') || id.startsWith('circuit:') || id.startsWith('piege:'))) return false;
    for (const [piece, trajet] of trajets) {
      const creature = trajet.partie.etat.creature;
      if (creature?.contact !== true || creature.neutralisee !== undefined) continue;
      if (creature.piece !== piece && !(voisines.get(piece) ?? []).some((liaison) => liaison.entre.includes(creature.piece ?? ''))) continue;
      for (const liaison of voisines.get(piece) ?? []) {
        if (creature.piece !== piece && liaison.entre.includes(creature.piece ?? '')) continue;
        if (recette(`repli:${piece}:${liaison.id}`, () => {
          partie = trajet.partie;
          pas.push(...trajet.pas);
          const recul = traverser(partie, liaison, false);
          if (recul === null) return false;
          partie = recul.partie;
          pas.push(...recul.pas);
          return agir('fermer', liaison.id) && agir('ouvrir', liaison.id) && suite();
        })) return true;
      }
    }
    return false;
  }

  /** Ouvrir son issue, puis la faire quitter sa pièce par le bruit d'une porte déjà accessible. */
  function leurrer(trajets: ReadonlyMap<string, Trajet>, suite: () => boolean): boolean {
    if (!active() || partie.etat.creature?.contact === true || [...enCours].some((id) => id.startsWith('leurre:'))) return false;
    const creature = partie.etat.creature?.piece;
    for (const issue of voisines.get(creature ?? '') ?? []) {
      const approche = trajets.get(autre(issue, creature ?? ''));
      if (approche === undefined || approche.partie.etat.creature?.contact === true) continue;
      for (const porte of monde.liaisons) {
        if (porte.bruyante !== true) continue;
        for (const cote of porte.entre) {
          if (!trajets.has(cote)) continue;
          if (recette(`leurre:${porte.id}:${issue.id}`, () => {
            partie = approche.partie;
            pas.push(...approche.pas);
            if (partie.etat.liaisons[issue.id] !== true && !agir('ouvrir', issue.id)) return false;
            return naviguer(cote, () => {
              if (partie.etat.liaisons[porte.id] === true && !agir('fermer', porte.id)) return false;
              return agir('ouvrir', porte.id) && agir('attendre', cote) && suite();
            }).arrive;
          })) return true;
        }
      }
    }
    return false;
  }

  function piegerPont(accessibles: ReadonlySet<string>, suite: () => boolean): boolean {
    if (!active() || [...enCours].some((id) => id.startsWith('piege:') || id.startsWith('circuit:') || id.startsWith('repli:'))) return false;
    for (const pont of monde.objets) {
      const place = partie.etat.objets[pont.id];
      if (place?.type !== 'pont') continue;
      const gouffre = monde.liaisons.find((liaison) => liaison.id === place.liaison);
      if (gouffre === undefined) continue;
      for (const bord of gouffre.entre) {
        if (!accessibles.has(bord)) continue;
        for (const circuit of circuits(bord)) {
          const porteRefuge = circuit.at(-1);
          if (porteRefuge === undefined) continue;
          const refuge = autre(porteRefuge, bord);
          for (const delai of [0, 1, 2]) {
            if (recette(`piege:${gouffre.id}`, () => {
              if (!atteindre(bord)) return false;
              // Laisser la poursuite s'engager, puis fermer les portes du détour jusqu'au refuge.
              for (const [rang, liaison] of circuit.slice(0, -1).entries()) {
                const suivant = traverser(partie, liaison, rang > 0);
                if (suivant === null) return false;
                partie = suivant.partie;
                pas.push(...suivant.pas);
                if (rang > 0 && partie.etat.liaisons[liaison.id] === true && !agir('fermer', liaison.id)) return false;
              }
              const retour = traverser(partie, porteRefuge, false);
              if (retour === null) return false;
              partie = retour.partie;
              pas.push(...retour.pas);
              for (let attente = 0; attente < delai; attente++) if (!agir('attendre', bord)) return false;
              for (const liaison of voisines.get(bord) ?? []) {
                if (liaison.id !== gouffre.id && liaison.id !== porteRefuge.id && partie.etat.liaisons[liaison.id] === true && !agir('fermer', liaison.id)) return false;
              }
              const fuite = traverser(partie, porteRefuge, false);
              if (fuite === null) return false;
              partie = fuite.partie;
              pas.push(...fuite.pas);
              const issue = circuit.at(-2);
              if (issue !== undefined && partie.etat.liaisons[issue.id] !== true && !agir('ouvrir', issue.id)) return false;
              if (!agir('fermer', porteRefuge.id)) return false;
              for (let attente = 0; attente < 6; attente++) {
                if (!active()) return suite();
                if (!agir('attendre', refuge)) return false;
              }
              return !active() && suite();
            })) return true;
          }
        }
      }
    }
    return false;
  }

  /** Un seul trajet par pièce : les états ne sont ni indexés ni développés comme des nœuds de recherche. */
  function naviguer(destination: string, suite: () => boolean): { readonly frontiere: readonly { liaison: DefLiaison; depuis: string }[]; readonly accessibles: ReadonlySet<string>; readonly trajets: ReadonlyMap<string, Trajet>; readonly arrive: boolean } {
    const debut = partie;
    const longueur = pas.length;
    const distance = distances(destination);
    const frontiere: { liaison: DefLiaison; depuis: string }[] = [];
    const accessibles = new Set<string>();
    const trajets = new Map<string, Trajet>();
    for (const fermer of [false, true]) {
      const file: Trajet[] = [{ partie: debut, pas: [] }];
      const vus = new Set<string>();
      let fermeture = false;
      while (file.length > 0 && commandes < plafond) {
        file.sort((a, b) => Number(a.partie.etat.creature?.contact === true && debut.etat.creature?.contact !== true) - Number(b.partie.etat.creature?.contact === true && debut.etat.creature?.contact !== true) || (distance.get(a.partie.etat.piece) ?? Infinity) - (distance.get(b.partie.etat.piece) ?? Infinity) || a.pas.length - b.pas.length);
        const noeud = file.shift();
        if (noeud === undefined || vus.has(noeud.partie.etat.piece)) continue;
        const piece = noeud.partie.etat.piece;
        vus.add(piece);
        accessibles.add(piece);
        if (!trajets.has(piece)) trajets.set(piece, noeud);
        if (piece === destination) {
          partie = noeud.partie;
          pas.push(...noeud.pas);
          if (essayer(suite)) return { frontiere, accessibles, trajets, arrive: true };
          // Protéger le geste utile avant de reprendre la route, même si la poursuite est encore une pièce derrière.
          if (active() && partie.etat.creature?.contact === true && partie.etat.creature.piece !== piece && essayer(() => {
            let fermee = false;
            for (const liaison of voisines.get(piece) ?? []) {
              if (partie.etat.liaisons[liaison.id] === true) {
                if (!agir('fermer', liaison.id)) return false;
                fermee = true;
              }
            }
            return fermee && suite();
          })) return { frontiere, accessibles, trajets, arrive: true };
          partie = debut;
          pas.length = longueur;
        }
        for (const liaison of voisines.get(piece) ?? []) {
          if (vus.has(autre(liaison, piece))) continue;
          const suivant = traverser(noeud.partie, liaison, fermer);
          if (suivant === null) frontiere.push({ liaison, depuis: piece });
          else {
            fermeture ||= suivant.pas.at(-1)?.[0] === 'fermer' || !fermer && suivant.partie.etat.creature?.contact === true && suivant.partie.etat.creature.neutralisee === undefined && suivant.partie.etat.creature.piece === piece;
            file.push({ partie: suivant.partie, pas: [...noeud.pas, ...suivant.pas] });
          }
        }
      }
      if (!fermeture) break;
    }
    partie = debut;
    pas.length = longueur;
    frontiere.sort((a, b) => (distance.get(autre(a.liaison, a.depuis)) ?? Infinity) - (distance.get(autre(b.liaison, b.depuis)) ?? Infinity));
    return { frontiere, accessibles, trajets, arrive: false };
  }

  function obtenir(objet: DefObjet, suite: () => boolean = () => true): boolean {
    if (porte(objet)) return suite();
    const place = partie.etat.objets[objet.id];
    if (place?.type !== 'piece' && place?.type !== 'pont') return false;
    const piece = place.type === 'piece' ? place.piece : monde.liaisons.find((liaison) => liaison.id === place.liaison)?.entre[0];
    return piece !== undefined && atteindre(piece, () => {
      if (objet.encombrant === true) {
        for (const autreObjet of monde.objets) {
          if (autreObjet.id !== objet.id && autreObjet.encombrant === true && porte(autreObjet) && !agir('poser', autreObjet.id)) return false;
        }
      }
      return agir('prendre', objet.id) && suite();
    });
  }

  function avecQualite(qualite: 'extinction' | 'glissant' | 'appui' | 'pont' | 'protection' | 'perce', suite: (objet: DefObjet) => boolean): boolean {
    return monde.objets.filter((objet) => objet[qualite] !== undefined && objet[qualite] !== false && (qualite !== 'extinction' && qualite !== 'glissant' || (partie.etat.doses[objet.id] ?? 0) > 0)).some((objet) => essayer(() => suite(objet)));
  }

  function preparer(liaison: DefLiaison, depuis: string, suite: () => boolean): boolean {
    const vers = autre(liaison, depuis);
    if (partie.etat.feu.includes(vers)) {
      return avecQualite('extinction', (eau) => obtenir(eau, () => atteindre(depuis, () => (partie.etat.liaisons[liaison.id] === true || agir('ouvrir', liaison.id)) && agir('arroser', eau.id, liaison.id) && suite())));
    }
    if (partie.etat.verrous?.includes(liaison.id) === true) {
      const rang = ordre.indexOf(liaison.id);
      if (rang > 0 && ordre.slice(0, rang).some((id) => partie.etat.verrous?.includes(id))) return false;
      return monde.objets.filter((objet) => objet.deverrouille === liaison.id).some((commande) => essayer(() => {
        const cle = commande.exige === undefined ? undefined : objets.get(commande.exige);
        const actionner = (): boolean => atteindre(commande.piece, () => agir('actionner', commande.id) && suite());
        return commande.exige === undefined ? actionner() : cle !== undefined && obtenir(cle, actionner);
      }));
    }
    if (liaison.haute === depuis) {
      const position = monde.positions?.find((candidate) => candidate.sous === liaison.id);
      if (position === undefined) return false;
      return avecQualite('appui', (appui) => {
        const place = partie.etat.objets[appui.id];
        if (place?.type === 'piece' && place.piece === depuis && place.position === position.id) return false;
        if (place?.type === 'piece' && place.piece === depuis && appui.deplacable === true && essayer(() => atteindre(depuis, () => agir('deplacer', appui.id, position.id) && suite()))) return true;
        if (appui.portable === false) return place?.type === 'piece' && place.piece === depuis && atteindre(depuis, () => agir('deplacer', appui.id, position.id) && suite());
        return obtenir(appui, () => atteindre(depuis, () => agir('poser', appui.id, position.id) && suite()));
      });
    }
    if (liaison.gouffre === true && !Object.values(partie.etat.objets).some((place) => place.type === 'pont' && place.liaison === liaison.id)) {
      return atteindre(depuis) && avecQualite('pont', (pont) => obtenir(pont, () => atteindre(depuis, () => {
        // Préparer le bord avant la pose laisse arriver la créature ; fermer derrière soi lui coupe le détour.
        for (const porte of voisines.get(depuis) ?? []) {
          if (porte.id !== liaison.id && partie.etat.liaisons[porte.id] === true) agir('fermer', porte.id);
        }
        return agir('placer', pont.id, liaison.id) && suite();
      })));
    }
    const obstacle = monde.objets.find((objet) => objet.obstacle?.passage === liaison.id);
    if (obstacle?.obstacle !== undefined) {
      const place = partie.etat.objets[obstacle.id];
      if (place?.type !== 'piece' || place.position === obstacle.obstacle.rangement) return false;
      const drone = monde.objets.find((objet) => objet.drone?.poignee === obstacle.obstacle?.maintien);
      if (drone === undefined) return false;
      // Rapporter l'appui déplacé encore accessible avant que le drone n'alerte la créature.
      for (const appui of monde.objets) {
        const placeAppui = partie.etat.objets[appui.id];
        if (appui.appui !== true || appui.portable === false || placeAppui?.type !== 'piece' || (monde.positions ?? []).some((position) => position.sous !== undefined && position.piece === placeAppui.piece)) continue;
        if (monde.objets.some((objet) => objet.encombrant === true && porte(objet))) continue;
        essayer(() => naviguer(placeAppui.piece, () => agir('prendre', appui.id)).arrive);
      }
      // Isoler la créature près de la poignée, sans fermer inutilement le passage que le chariot va libérer.
      const poignee = drone.drone === undefined ? undefined : objets.get(drone.drone.poignee);
      if (active() && poignee !== undefined && (voisines.get(poignee.piece) ?? []).some((porte) => porte.entre.includes(partie.etat.creature?.piece ?? ''))) {
        for (const porteCreature of voisines.get(partie.etat.creature?.piece ?? '') ?? []) {
          if (partie.etat.liaisons[porteCreature.id] !== true) continue;
          const cote = autre(porteCreature, partie.etat.creature?.piece ?? '');
          essayer(() => atteindre(cote, () => agir('fermer', porteCreature.id)));
        }
      }
      const phase = partie.etat.drones?.phases[drone.id];
      if (phase !== 'maintien' && phase !== 'trajet') {
        const placeDrone = partie.etat.objets[drone.id];
        if (placeDrone?.type !== 'piece' || !atteindre(placeDrone.piece)) return false;
        if (phase === 'deraille' && !agir('replacer', drone.id)) return false;
        if (!agir(phase === 'veille' ? 'envoyer' : phase === 'arrete' ? 'reprendre_drone' : 'rearmer', drone.id)) return false;
      }
      return atteindre(obstacle.piece, () => agir('deplacer', obstacle.id, obstacle.obstacle?.rangement) && suite());
    }
    if (liaison.etroite === true) {
      const larges = monde.objets.filter((objet) => objet.large === true && porte(objet));
      return larges.length > 0 && larges.every((objet) => agir('poser', objet.id)) && suite();
    }
    return false;
  }

  function diversions(accessibles: ReadonlySet<string>, suite: () => boolean): boolean {
    if (!active()) return false;
    for (const objet of monde.objets) {
      if (!accessibles.has(objet.piece)) continue;
      if (objet.avertisseur?.alcove === true && recette(`alarme:${objet.id}`, () => atteindre(objet.piece, () => agir('declencher', objet.id)) && suite())) return true;
      if (objet.vitrageExterieur === true && !partie.etat.breches.includes(objet.id) && recette(`vide:${objet.id}`, () =>
        avecQualite('protection', (protection) => {
          if (!obtenir(protection)) return false;
          const place = partie.etat.objets[protection.id];
          return (place?.type === 'passager' && place.enfile === true || agir('enfiler', protection.id)) &&
            avecQualite('perce', (outil) => obtenir(outil) && atteindre(objet.piece, () => agir('percer', objet.id)) && suite());
        }))) return true;
      if (objet.fermeture !== undefined && recette(`froid:${objet.id}`, () => {
        const chambre = objet.fermeture;
        const alarme = monde.objets.find((candidate) => candidate.avertisseur?.piece === chambre && candidate.piece === chambre);
        return chambre !== undefined && alarme !== undefined && atteindre(chambre, () => agir('declencher', alarme.id)) && atteindre(objet.piece, () => agir('boucler', objet.id)) && suite();
      })) return true;
      if (objet.machines !== undefined && recette(`machines:${objet.id}`, () => atteindre(objet.piece, () =>
        (partie.etat.arretees.includes(objet.machines ?? '') || agir('arreter', objet.id)) && agir('relancer', objet.id)) && suite())) return true;
    }
    const creature = partie.etat.creature?.piece;
    for (const liaison of voisines.get(creature ?? '') ?? []) {
      const depuis = autre(liaison, creature ?? '');
      if (!accessibles.has(depuis)) continue;
      if (recette(`huile:${liaison.id}:${depuis}`, () => avecQualite('glissant', (huile) => obtenir(huile, () => atteindre(depuis, () => agir('verser', huile.id, liaison.id)) && suite())))) return true;
      if (partie.etat.liaisons[liaison.id] === true && recette(`isoler:${liaison.id}`, () => atteindre(depuis, () => agir('fermer', liaison.id)) && suite())) return true;
    }
    return false;
  }

  function atteindre(destination: string, suite: () => boolean = () => true): boolean {
    if (commandes >= plafond) return false;
    const trajet = naviguer(destination, suite);
    if (trajet.arrive) return true;
    if (commandes >= plafond) return false;
    const creature = partie.etat.creature;
    if (creature !== null && creature.neutralisee === undefined && creature.piece === partie.etat.piece && creature.contact && !creature.repit && creature.perdues === 0 && creature.ralentie?.saute !== true) return false;
    const essayees = new Set<string>();
    for (const { liaison, depuis } of trajet.frontiere) {
      if (!partie.etat.feu.includes(autre(liaison, depuis)) && !partie.etat.verrous?.includes(liaison.id) && liaison.haute !== depuis && liaison.gouffre !== true && liaison.etroite !== true && !monde.objets.some((objet) => objet.obstacle?.passage === liaison.id)) continue;
      const id = `${liaison.id}:${depuis}`;
      if (essayees.has(id)) continue;
      essayees.add(id);
      if (recette(id, () => preparer(liaison, depuis, () => atteindre(destination, suite)))) return true;
    }
    if (diversionDirecte && strategie((continuer) => diversions(trajet.accessibles, continuer), () => atteindre(destination, suite))) return true;
    if (strategie((continuer) => reculer(trajet.trajets, continuer), () => atteindre(destination, suite))) return true;
    if (grilleGardee && strategie((continuer) => piegerPont(trajet.accessibles, continuer), () => atteindre(destination, suite))) return true;
    if (strategie((continuer) => tourner(trajet.trajets, continuer), () => atteindre(destination, suite))) return true;
    if (!grilleGardee && strategie((continuer) => piegerPont(trajet.accessibles, continuer), () => atteindre(destination, suite))) return true;
    if (strategie((continuer) => leurrer(trajet.trajets, continuer), () => atteindre(destination, suite))) return true;
    return !diversionDirecte && strategie((continuer) => diversions(trajet.accessibles, continuer), () => atteindre(destination, suite));
  }

  function evacuer(capsule: DefObjet): boolean {
    if (capsule.capsule === undefined) return false;
    const interieur = capsule.capsule.interieur;
    const pupitre = monde.objets.find((objet) => objet.depart === capsule.id);
    return pupitre !== undefined && atteindre(interieur, () => {
      for (const liaison of voisines.get(interieur) ?? []) {
        if (partie.etat.liaisons[liaison.id] === true && !agir('fermer', liaison.id)) return false;
      }
      return agir('lancer', pupitre.id) && partie.etat.fin === 'evacuation';
    });
  }

  for (const cloison of ordre) {
    commandes = 0;
    const commande = monde.objets.find((objet) => objet.deverrouille === cloison);
    if (commande === undefined || !atteindre(commande.piece, () => agir('actionner', commande.id))) return null;
  }
  for (const capsule of monde.objets.filter((objet) => objet.capsule !== undefined)) {
    commandes = 0;
    if (capsule.capsule?.alimentee === true && essayer(() => evacuer(capsule))) return pas;
    for (const source of monde.objets.filter((objet) => objet.source === true)) {
      commandes = 0;
      if (essayer(() => obtenir(source, () => atteindre(capsule.piece, () => agir('installer', source.id) && evacuer(capsule))))) return pas;
    }
    for (const console of monde.objets.filter((objet) => objet.alimente === capsule.id)) {
      commandes = 0;
      if (essayer(() => atteindre(console.piece, () => agir('activer', console.id) && evacuer(capsule)))) return pas;
    }
  }
  return null;
}
