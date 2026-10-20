import { apercu, jouer, nouvellePartie, observer, type Apercu, type Commande, type Consultation, type DefMonde, type Evenement, type IntensiteTrace, type NiveauRisque, type Observation, type OptionMenu, type Partie } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { SuiviPartie, type IndicateursPartie } from './indicateurs-partie';
import type { EntreeMonde } from '../content';

// Bots de mesure (#194 §2.3) : ils jouent par le menu public, avec ce que le joueur voit (observation, aperçu du risque, récit
// de la dernière action), jamais l'état caché du moteur. Leur seule mémoire est la leur. Ils servent à mesurer, pas à prouver :
// la preuve d'une station reste celle de `check:stations`.

export const PROFILS = ['aleatoire', 'prudent', 'presse', 'averti'] as const;
export type Profil = (typeof PROFILS)[number];

/** Plafond d'actions d'une partie de bot : au-delà, la partie est abandonnée (issue « en cours ») ; 600 pour les grandes stations (spec 2026-10-18 §11). */
export const PLAFOND_ACTIONS = 600;

/** Ce qu'un bot voit avant de choisir. */
export interface VueBot {
  readonly observation: Observation;
  /** Événements de la dernière action engagée (le récit qu'a lu le joueur). */
  readonly evenements: readonly Evenement[];
  /** Aperçu de chaque option engagée et disponible, par commande. */
  readonly apercu: (option: OptionMenu) => Apercu | null;
  /** Trace de la pièce, telle que la montre « regarder » (spec 2026-10-18 §5.4) ; `null` sans trace. */
  readonly trace: IntensiteTrace | null;
  /** « Regarder » une cible de la pièce : consultation gratuite, que la partie n'enregistre pas ; `null` si elle est refusée. */
  readonly consulter: (cible: string) => Consultation | null;
}

export interface Bot {
  /** Commande à engager ; `null` pour abandonner. */
  choisir(vue: VueBot): Commande | null;
}

/** Hasard propre au bot, enregistré nulle part : il ne touche jamais aux dés de la partie. */
export function hasardDe(graine: number): () => number {
  let etat = generateurDepuisGraine(graine);
  return () => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur / 4294967296;
  };
}

/** Options qui engagent une action ; « regarder » est une consultation gratuite. */
export function optionsJouables(observation: Observation): OptionMenu[] {
  return observation.menu.filter((option) => option.disponible && option.action !== 'regarder');
}

export function botAleatoire(graine: number): Bot {
  const hasard = hasardDe(graine);
  return {
    choisir({ observation }) {
      const options = optionsJouables(observation);
      return options.length === 0 ? null : (options[Math.floor(hasard() * options.length)]?.commande ?? null);
    },
  };
}

/** Récit qui dit que la créature est là, ou tout près (ce que lit le joueur). */
const MENACES: ReadonlySet<Evenement['type']> = new Set(['premier_contact', 'menace', 'creature_entre', 'creature_glisse', 'bruit_creature', 'pas_entendus', 'souffle_entendu']);

const GESTES_DE_PASSAGE: ReadonlySet<OptionMenu['action']> = new Set(['aller', 'ouvrir', 'fermer', 'attendre', 'poser', 'retirer', 'regarder']);

/** Gestes dont l'indisponibilité ne dit rien de la pièce : « aller » par une porte fermée, « fermer » une porte déjà fermée. */
const SANS_BLOCAGE: ReadonlySet<OptionMenu['action']> = new Set(['aller', 'ouvrir', 'fermer', 'attendre', 'regarder']);

/**
 * Pièce à revoir quand on porte autre chose (spec 2026-10-18 §11) : un passage qu'on ne peut ni franchir ni ouvrir, ou un geste
 * indisponible autre qu'un geste de passage. Une porte fermée qu'on peut ouvrir ne compte pas.
 */
export function aRevoirIci(observation: Observation): boolean {
  const options = optionsJouables(observation);
  const bloque = observation.passages.some((passage) => !options.some((option) => (option.action === 'aller' || option.action === 'ouvrir') && option.cible.id === passage.id));
  return bloque || observation.menu.some((option) => !option.disponible && !SANS_BLOCAGE.has(option.action));
}

/** Malus d'un risque annoncé pour le bot prudent ; le bot pressé ne garde que les deux derniers. */
const MALUS_PRUDENT: Readonly<Record<NiveauRisque, number>> = { aucun: 0, faible: 10, modere: 40, eleve: 150, certain: 5000, mortel: 10000 };
const MALUS_PRESSE: Readonly<Record<NiveauRisque, number>> = { aucun: 0, faible: 0, modere: 0, eleve: 0, certain: 5000, mortel: 10000 };

/** Malus d'aller plus loin depuis une pièce à trace forte, pour le bot averti, avant la rencontre ; il s'use de 50 par geste. */
const MALUS_TRACE = 200;

/** Prix d'un geste sur la route d'une pièce que nomme une note de rangement : avant l'exploration (100) et le butin (150), après un geste jamais essayé (200). */
const PRIX_NOTE = 180;

/** Actions après lesquelles le bot réessaie un passage qu'il n'a pas pu ouvrir. */
const OUBLI = 20;

const cle = (commande: Commande): string => `${commande.action}|${commande.cible}|${commande.parametre ?? ''}`;

/** Ce qui change ce qu'on peut faire ici : la pièce, ce qu'on porte, ce qui est posé et activé, les passages ouverts. */
function situation(observation: Observation): string {
  return JSON.stringify([
    observation.piece.id,
    observation.inventaire.map((objet) => objet.id).sort(),
    observation.placements.map((placement) => `${placement.objet.id}@${placement.position.id}`).sort(),
    observation.installes.map((installe) => installe.objet.id).sort(),
    observation.actives.map((objet) => objet.id).sort(),
    observation.passages.filter((passage) => passage.ouvert).map((passage) => passage.id).sort(),
    observation.enfilee?.id ?? null,
    observation.machines,
    observation.gravite,
  ]);
}

/**
 * Explorateur qui cherche la capsule comme un joueur attentif : il essaie une fois chaque geste dans chaque situation, ramasse,
 * ouvre, va vers les pièces qu'il n'a pas vues ou pas revues depuis qu'il porte autre chose, et ferme la porte derrière lui
 * quand le récit annonce la créature. Prudent, il évite les risques annoncés quand il a le choix ; pressé, seulement le mortel
 * et le certain. Averti, il est prudent et lit ce que le passager peut lire : avant la rencontre, une trace forte le fait hésiter
 * à aller plus loin, et il regarde chaque document à sa première visite, puis va vers la pièce qu'une note de rangement nomme.
 */
export function botExplorateur(graine: number, profil: 'prudent' | 'presse' | 'averti'): Bot {
  const hasard = hasardDe(graine);
  const malus = profil === 'presse' ? MALUS_PRESSE : MALUS_PRUDENT;
  let rencontre = false;
  /** Gestes déjà choisis dans chaque pièce à trace forte : l'hésitation s'use, pour ne pas tourner en rond. */
  const hesitations = new Map<string, number>();
  /** Pièces où un passage ou un geste n'était pas possible : les seules qui valent d'être revues avec autre chose en main. */
  const aRevoir = new Set<string>();
  const essais = new Map<string, number>();
  const ouverts = new Set<string>();
  /**
   * Passages qu'on n'a pu ni ouvrir ni franchir, avec l'action où on l'a vu : oubliés dès qu'un geste change quelque chose (une
   * commande, un objet pris), ou après `OUBLI` actions, pour réessayer.
   */
  const bloques = new Map<string, number>();
  const bloque = (passage: string, actions: number): boolean => {
    const depuis = bloques.get(passage);
    return depuis !== undefined && actions - depuis < OUBLI;
  };
  /** Pièce et inventaire de chaque passage : une pièce à revoir quand on porte autre chose. */
  const vues = new Set<string>();
  /** Pièce visée, gardée jusqu'à l'atteindre ou ne plus pouvoir l'atteindre : sans elle, il hésite entre deux pièces. */
  let but: string | null = null;
  let precedente: string | null = null;
  let franchi: string | null = null;
  /** Pièces dont les documents sont déjà lus : un document se lit à la première visite, et pas deux fois. */
  const lues = new Set<string>();
  /** Pièces que les notes de rangement lues nomment : des destinations tant qu'on ne les a pas atteintes. */
  const designees = new Set<string>();

  const inventaire = (observation: Observation): string => observation.inventaire.map((objet) => objet.id).sort().join(',');

  /** Pièces à voir : jamais visitées, ou pas depuis qu'on porte autre chose. */
  const aVoir = (observation: Observation): Set<string> => {
    const avecCe = inventaire(observation);
    return new Set(
      observation.carte.pieces
        .filter((piece) => piece.statut === 'connue' || (piece.statut === 'visitee' && aRevoir.has(piece.piece.id) && !vues.has(`${piece.piece.id}#${avecCe}`)))
        .map((piece) => piece.piece.id),
    );
  };

  /** Plus courts chemins sur la carte du passager, sans les passages bloqués : pour chaque pièce, le premier passage et la distance. */
  const routes = (observation: Observation): Map<string, { readonly premier: string; readonly distance: number }> => {
    const trouvees = new Map<string, { premier: string; distance: number }>();
    const depart = observation.piece.id;
    const file: { piece: string; premier: string | null; distance: number }[] = [{ piece: depart, premier: null, distance: 0 }];
    const atteintes = new Set([depart]);
    for (let courant = file.shift(); courant !== undefined; courant = file.shift()) {
      if (courant.premier !== null) trouvees.set(courant.piece, { premier: courant.premier, distance: courant.distance });
      for (const passage of observation.carte.passages) {
        if (passage.entre === null || bloque(passage.id, observation.actions)) continue;
        const [a, b] = passage.entre;
        const voisine = a.id === courant.piece ? b.id : b.id === courant.piece ? a.id : null;
        if (voisine === null || atteintes.has(voisine)) continue;
        atteintes.add(voisine);
        file.push({ piece: voisine, premier: courant.premier ?? passage.id, distance: courant.distance + 1 });
      }
    }
    return trouvees;
  };

  /**
   * Passage à prendre ou à ouvrir vers le but, gardé ou choisi le plus proche parmi les pièces à voir ; `null` sans but joignable.
   * Averti, avant la rencontre : la pièce nommée par une note, pas encore atteinte et par un chemin connu, passe avant ; sans
   * chemin connu, l'exploration continue comme avant.
   */
  const etape = (observation: Observation): { readonly passage: string; readonly distance: number; readonly designee: boolean } | null => {
    const chemins = routes(observation);
    const cibles = aVoir(observation);
    if (but === observation.piece.id || (but !== null && (!cibles.has(but) || !chemins.has(but)))) but = null;
    if (but === null) {
      let proche = Infinity;
      for (const piece of cibles) {
        const route = chemins.get(piece);
        if (route !== undefined && route.distance < proche) [but, proche] = [piece, route.distance];
      }
    }
    let designee = false;
    if (profil === 'averti' && !rencontre) {
      let proche = Infinity;
      for (const piece of designees) {
        const route = chemins.get(piece);
        if (route === undefined || route.distance >= proche || observation.visitees.some((vue) => vue.id === piece)) continue;
        [but, proche, designee] = [piece, route.distance, true];
      }
    }
    const route = but === null ? undefined : chemins.get(but);
    return route === undefined ? null : { passage: route.premier, distance: route.distance, designee };
  };

  const score = (vue: VueBot, option: OptionMenu, ici: string, menace: boolean, vers: { passage: string; distance: number; designee: boolean } | null): number => {
    const { observation } = vue;
    const { action, cible } = option;
    const essai = essais.get(`${ici}|${cle(option.commande)}`) ?? 0;
    const surLaRoute = vers !== null && cible.id === vers.passage ? (vers.designee ? PRIX_NOTE : 85) - vers.distance : 0;
    let points = 0;
    if (action === 'lancer') points = 1000;
    else if (action === 'fermer') points = menace && cible.id === franchi ? 400 : 2;
    else if (action === 'aller') {
      const destination = cible.sorte === 'passage' ? cible.vers : null;
      const inconnue = destination === null || !observation.visitees.some((piece) => piece.id === destination.id);
      points = observation.creatureVisible ? 300 : Math.max(inconnue ? 100 : 3, surLaRoute);
      if (destination !== null && destination.id === precedente && !observation.creatureVisible && surLaRoute === 0) points -= 30;
    } else if (action === 'ouvrir') points = Math.max(ouverts.has(cible.id) ? 20 : 120, surLaRoute);
    else if (action === 'attendre') points = 1;
    else if (action === 'poser' || action === 'retirer') points = essai === 0 ? 10 : 1;
    else if (action === 'prendre') points = essai === 0 ? 150 : 2;
    else if (!GESTES_DE_PASSAGE.has(action)) points = essai === 0 ? 200 : 5;
    if (essai > 0 && action !== 'aller' && surLaRoute === 0) points -= 10 * essai;
    if (profil === 'averti' && !rencontre && vue.trace === 'forte') {
      const versInconnue = action === 'aller' && cible.sorte === 'passage' && (cible.vers === null || !observation.visitees.some((piece) => piece.id === cible.vers?.id));
      if (action === 'ouvrir' || versInconnue) points -= Math.max(0, MALUS_TRACE - 50 * (hesitations.get(observation.piece.id) ?? 0));
    }
    const risque = vue.apercu(option)?.risque ?? 'aucun';
    return points - malus[risque] + hasard();
  };

  return {
    choisir(vue) {
      const { observation, evenements } = vue;
      const options = optionsJouables(observation);
      if (options.length === 0) return null;
      const ici = situation(observation);
      vues.add(`${observation.piece.id}#${inventaire(observation)}`);
      rencontre ||= observation.creatureVisible || evenements.some((evenement) => evenement.type === 'premier_contact');
      if (profil === 'averti' && !lues.has(observation.piece.id)) {
        lues.add(observation.piece.id);
        for (const objet of observation.objets) {
          const lu = vue.consulter(objet.id);
          if (lu?.type === 'regarder_document' && lu.designe !== undefined) designees.add(lu.designe.id);
        }
      }
      if (aRevoirIci(observation)) aRevoir.add(observation.piece.id);
      // Un passage d'ici qu'on ne peut ni franchir ni ouvrir est bloqué pour l'instant : porte verrouillée, vide sans pont…
      for (const passage of observation.passages) {
        const praticable = options.some((option) => (option.action === 'aller' || option.action === 'ouvrir') && option.cible.id === passage.id);
        if (!praticable && !bloque(passage.id, observation.actions)) bloques.set(passage.id, observation.actions);
      }
      const menace = observation.creatureVisible || evenements.some((evenement) => MENACES.has(evenement.type));
      const vers = etape(observation);
      let meilleure: OptionMenu | undefined;
      let meilleurScore = -Infinity;
      for (const option of options) {
        const points = score(vue, option, ici, menace, vers);
        if (points > meilleurScore) [meilleure, meilleurScore] = [option, points];
      }
      if (meilleure === undefined) return null;
      if (vue.trace === 'forte' && !rencontre) hesitations.set(observation.piece.id, (hesitations.get(observation.piece.id) ?? 0) + 1);
      const { action, commande } = meilleure;
      const nom = `${ici}|${cle(commande)}`;
      essais.set(nom, (essais.get(nom) ?? 0) + 1);
      if (action === 'ouvrir') ouverts.add(commande.cible);
      if (action === 'prendre' || !GESTES_DE_PASSAGE.has(action)) bloques.clear();
      if (action === 'aller') {
        precedente = observation.piece.id;
        franchi = commande.cible;
      } else if (action !== 'fermer') franchi = null;
      return commande;
    },
  };
}

export function creerBot(profil: Profil, graine: number): Bot {
  return profil === 'aleatoire' ? botAleatoire(graine) : botExplorateur(graine, profil);
}

/** Trace de la pièce du passager, par la consultation gratuite « regarder » : ce que le joueur lit en regardant la pièce. */
function traceIci(monde: DefMonde, partie: Partie, piece: string): IntensiteTrace | null {
  const resultat = jouer(monde, partie, { action: 'regarder', cible: piece });
  return resultat.type === 'consultation' && resultat.consultation.type === 'regarder_piece' ? (resultat.consultation.trace ?? null) : null;
}

/** Joue une partie complète avec un bot, depuis le réveil, et en rend les indicateurs. */
export function jouerAvecBot(entree: EntreeMonde, bot: Bot, graine: number, plafond = PLAFOND_ACTIONS): { readonly indicateurs: IndicateursPartie; readonly partie: Partie } {
  const { monde } = entree;
  let partie = nouvellePartie(monde, { version: 'bot', graine });
  const suivi = new SuiviPartie(monde, partie);
  let evenements: readonly Evenement[] = partie.derniers;
  for (let action = 0; action < plafond; action++) {
    const observation = observer(monde, partie.etat);
    if (observation.terminee) break;
    const enCours = partie;
    const commande = bot.choisir({
      observation,
      evenements,
      apercu: (option) => {
        const resultat = apercu(monde, enCours, option.commande);
        return resultat.type === 'apercu' ? resultat.apercu : null;
      },
      trace: traceIci(monde, partie, observation.piece.id),
      consulter: (cible) => {
        const resultat = jouer(monde, enCours, { action: 'regarder', cible });
        return resultat.type === 'consultation' ? resultat.consultation : null;
      },
    });
    if (commande === null) break;
    const resultat = jouer(monde, partie, commande);
    if (resultat.type !== 'engagee') throw new Error(`Le bot a proposé une commande refusée : ${JSON.stringify(commande)}.`);
    partie = resultat.partie;
    evenements = resultat.evenements;
    suivi.noter(resultat.evenements, resultat.tirages, partie.etat);
  }
  return { indicateurs: suivi.resultat(), partie };
}
