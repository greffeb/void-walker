import { apercu, jouer, nouvellePartie, observer, type Apercu, type Commande, type Consultation, type DefMonde, type Evenement, type IntensiteTrace, type NiveauRisque, type Observation, type OptionMenu, type Partie } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { SuiviPartie, type IndicateursPartie } from './indicateurs-partie';
import type { EntreeMonde } from '../content';

// Bots de mesure (#194 §2.3) : ils jouent par le menu public, avec ce que le joueur voit (observation, aperçu du risque, récit
// de la dernière action) et ce qu'il peut regarder gratuitement (une trace, un document), jamais l'état caché du moteur. Leur seule mémoire est la leur. Ils servent à mesurer, pas à prouver :
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
const MENACES: ReadonlySet<Evenement['type']> = new Set(['premier_contact', 'menace', 'creature_entre', 'creature_glisse', 'bruit_creature', 'poursuite_proche', 'pas_entendus', 'souffle_entendu']);

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

/**
 * Ce que fait un explorateur, geste par geste (mesure 2026-11) : les trois profils en sont des réglages, et un bot « à un seul
 * défaut » est l'averti privé d'un geste. Comparer deux réglages sur les mêmes parties dit ce que vaut le geste.
 */
export interface Traits {
  /** Malus des risques annoncés ; `sans-creature` : prudent devant le feu, le froid et le vide, sourd aux risques d'interception. */
  readonly risque: 'prudent' | 'presse' | 'sans-creature';
  /** Fermer derrière lui la porte qu'il vient de franchir : quand le récit annonce la créature, jamais, ou à chaque porte. */
  readonly fermer: 'menace' | 'jamais' | 'toujours';
  /** Regarder les documents et suivre les notes de rangement. */
  readonly lire: boolean;
  /** Attendre une fois devant une porte fermée vers l'inconnu, pour écouter. */
  readonly ecouter: boolean;
  /** Hésiter à aller plus loin depuis une pièce à trace forte. */
  readonly traces: boolean;
  /** Éviter les gestes annoncés bruyants quand un autre choix existe. */
  readonly discret: boolean;
  /** S'éloigner quand la créature est en vue. */
  readonly fuir: boolean;
  /**
   * Faire d'abord ce que son dernier geste vient de rendre possible : ouvrir ou prendre le passage, ou faire le geste, que le menu refusait
   * juste avant. Sans ce réglage, les profils d'origine préfèrent un geste neuf (200) à un passage à ouvrir (120) : devant la
   * grille de M-02, la caisse à peine posée dessous, ils la redéplacent au lieu d'ouvrir, et la grille redevient hors de portée
   * (mesure 2026-11). Les profils d'origine restent tels quels, pour que leurs chiffres se comparent aux anciens.
   */
  readonly enchainer: boolean;
}

const TRAITS_PRUDENT: Traits = { risque: 'prudent', fermer: 'menace', lire: false, ecouter: false, traces: false, discret: false, fuir: true, enchainer: false };
const TRAITS_AVERTI: Traits = { ...TRAITS_PRUDENT, lire: true, ecouter: true, traces: true };

/** Malus d'un geste annoncé bruyant pour le bot discret : il passe après une pièce inconnue (100), jamais après un geste neuf (200). */
const MALUS_BRUIT = 60;

/** Points d'un geste que le geste précédent vient de rendre possible, pour le bot qui enchaîne : au-dessus d'un geste neuf (200). */
const PRIX_SUITE = 250;

/**
 * Bots à un seul réglage changé : l'averti (ou le prudent, voir `BASES`) privé d'un geste, ou doté d'un geste de plus. `expert`
 * réunit les réglages qui gagnent des évacuations dans la mesure 2026-11 ; `casse-cou` est le prudent qui ignore la créature :
 * ni ses risques annoncés, ni porte fermée derrière lui, ni fuite.
 */
export const VARIANTES = {
  'sans-fermer': { ...TRAITS_AVERTI, fermer: 'jamais' },
  'ferme-tout': { ...TRAITS_AVERTI, fermer: 'toujours' },
  'sans-lire': { ...TRAITS_AVERTI, lire: false },
  'sans-ecouter': { ...TRAITS_AVERTI, ecouter: false },
  'sans-traces': { ...TRAITS_AVERTI, traces: false },
  discret: { ...TRAITS_AVERTI, discret: true },
  'sans-fuir': { ...TRAITS_AVERTI, fuir: false },
  enchaine: { ...TRAITS_AVERTI, enchainer: true },
  expert: { ...TRAITS_AVERTI, fermer: 'toujours', ecouter: false, traces: false, fuir: false, enchainer: true },
  'prudent-enchaine': { ...TRAITS_PRUDENT, enchainer: true },
  'casse-cou': { ...TRAITS_PRUDENT, risque: 'sans-creature', fermer: 'jamais', fuir: false },
} as const satisfies Record<string, Traits>;
export type Variante = keyof typeof VARIANTES;

/** Profil dont chaque variante part, et dont elle prend la graine : ses parties se comparent une à une à celles de ce profil. */
export const BASES: Readonly<Record<Variante, 'prudent' | 'averti'>> = {
  'sans-fermer': 'averti', 'ferme-tout': 'averti', 'sans-lire': 'averti', 'sans-ecouter': 'averti', 'sans-traces': 'averti', discret: 'averti', 'sans-fuir': 'averti',
  enchaine: 'averti', expert: 'averti', 'prudent-enchaine': 'prudent', 'casse-cou': 'prudent',
};

/** Malus d'aller plus loin depuis une pièce à trace forte, pour le bot averti, avant la rencontre ; il s'use de 50 par geste. */
const MALUS_TRACE = 200;

/** Prix d'un geste sur la route d'une pièce que nomme une note de rangement : avant l'exploration (100) et le butin (150), après un geste jamais essayé (200). */
const PRIX_NOTE = 180;

/**
 * Choix de l'averti, avant la rencontre, où une pièce nommée par une note joue sans qu'il s'en rapproche (distance minimale
 * jamais battue) : au bout de cette patience, la pièce cesse d'être une destination. Sans elle, un passage jugé trop risqué
 * vers la pièce le ferait tourner autour jusqu'au plafond.
 */
const PATIENCE_NOTE = 15;

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
    ...(observation.drones === undefined ? [] : [observation.drones, observation.obstacles]),
  ]);
}

/**
 * Explorateur qui cherche la capsule comme un joueur attentif : il essaie une fois chaque geste dans chaque situation, ramasse,
 * ouvre, va vers les pièces qu'il n'a pas vues ou pas revues depuis qu'il porte autre chose, et ferme la porte derrière lui
 * quand le récit annonce la créature. Prudent, il évite les risques annoncés quand il a le choix ; pressé, seulement le mortel
 * et le certain. Averti, il est prudent et lit ce que le passager peut lire : avant la rencontre, une trace forte le fait hésiter
 * à aller plus loin, et il regarde chaque document à sa première visite, puis va vers la pièce qu'une note de rangement nomme.
 * Il écoute aussi : à sa première arrivée dans une pièce qui a une porte fermée vers une pièce pas encore visitée, il attend une
 * fois avant tout autre choix ; un « net » monte l'aperçu du passage, et son malus de risque fait le reste (D-181).
 */
export function botExplorateur(graine: number, profil: 'prudent' | 'presse' | 'averti' | Traits): Bot {
  const hasard = hasardDe(graine);
  const traits: Traits = typeof profil !== 'string' ? profil : profil === 'averti' ? TRAITS_AVERTI : profil === 'presse' ? { ...TRAITS_PRUDENT, risque: 'presse' } : TRAITS_PRUDENT;
  const malus = traits.risque === 'presse' ? MALUS_PRESSE : MALUS_PRUDENT;
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
  /** Pièces dont les documents sont déjà lus : un document se lit à la première visite, et pas deux fois ; un regard refusé n'est pas retenté. */
  const lues = new Set<string>();
  /** Pièces que les notes de rangement lues nomment : des destinations tant qu'on ne les a pas atteintes, ni usé la patience. */
  const designees = new Set<string>();
  /** Pour chaque pièce nommée : la distance la plus courte où l'on s'en est trouvé, et les choix sans s'en être rapproché. */
  const plusProches = new Map<string, number>();
  const usures = new Map<string, number>();
  /** Pièces où l'averti a déjà écouté, ou n'avait rien à écouter : une seule attente, à la première arrivée. */
  const ecoutees = new Set<string>();
  /** Pour le bot qui enchaîne : pièce et commandes que le menu refusait au choix précédent, puis celles qu'il propose à présent. */
  let refusees = new Set<string>();
  let debloquees = new Set<string>();

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
    let visee: string | null = null;
    if (traits.lire && !rencontre) {
      let proche = Infinity;
      for (const piece of designees) {
        const route = chemins.get(piece);
        if (route === undefined || route.distance >= proche || (usures.get(piece) ?? 0) >= PATIENCE_NOTE || observation.visitees.some((vue) => vue.id === piece)) continue;
        [visee, proche] = [piece, route.distance];
      }
      if (visee !== null) {
        but = visee;
        // Un choix où la destination joue : il use la patience, sauf s'il rapproche de la pièce.
        if (proche < (plusProches.get(visee) ?? Infinity)) plusProches.set(visee, proche);
        else usures.set(visee, (usures.get(visee) ?? 0) + 1);
      }
    }
    const route = but === null ? undefined : chemins.get(but);
    return route === undefined ? null : { passage: route.premier, distance: route.distance, designee: visee !== null };
  };

  const score = (vue: VueBot, option: OptionMenu, ici: string, menace: boolean, vers: { passage: string; distance: number; designee: boolean } | null): number => {
    const { observation } = vue;
    const { action, cible } = option;
    const essai = essais.get(`${ici}|${cle(option.commande)}`) ?? 0;
    const surLaRoute = vers !== null && cible.id === vers.passage ? (vers.designee ? PRIX_NOTE : 85) - vers.distance : 0;
    let points = 0;
    if (action === 'lancer') points = 1000;
    else if (action === 'fermer') points = ((menace && traits.fermer === 'menace') || traits.fermer === 'toujours') && cible.id === franchi ? 400 : 2;
    else if (action === 'aller') {
      const destination = cible.sorte === 'passage' ? cible.vers : null;
      const inconnue = destination === null || !observation.visitees.some((piece) => piece.id === destination.id);
      points = observation.creatureVisible && traits.fuir ? 300 : Math.max(inconnue ? 100 : 3, surLaRoute);
      if (destination !== null && destination.id === precedente && !observation.creatureVisible && surLaRoute === 0) points -= 30;
    } else if (action === 'ouvrir') points = Math.max(ouverts.has(cible.id) ? 20 : 120, surLaRoute);
    else if (action === 'attendre') points = 1;
    else if (action === 'poser' || action === 'retirer') points = essai === 0 ? 10 : 1;
    else if (action === 'prendre') points = essai === 0 ? 150 : 2;
    else if (!GESTES_DE_PASSAGE.has(action)) points = essai === 0 ? 200 : 5;
    if (essai > 0 && action !== 'aller' && surLaRoute === 0) points -= 10 * essai;
    if (debloquees.has(cle(option.commande)) && (action === 'ouvrir' || action === 'aller' || !GESTES_DE_PASSAGE.has(action))) points = Math.max(points, PRIX_SUITE);
    if (traits.traces && !rencontre && vue.trace === 'forte') {
      const versInconnue = action === 'aller' && cible.sorte === 'passage' && (cible.vers === null || !observation.visitees.some((piece) => piece.id === cible.vers?.id));
      if (action === 'ouvrir' || versInconnue) points -= Math.max(0, MALUS_TRACE - 50 * (hesitations.get(observation.piece.id) ?? 0));
    }
    const prevu = vue.apercu(option);
    if (traits.discret && prevu?.cout === 'bruyant') points -= MALUS_BRUIT;
    return points - (traits.risque === 'sans-creature' && prevu?.danger?.type.startsWith('interception') === true ? 0 : malus[prevu?.risque ?? 'aucun']) + hasard();
  };

  return {
    choisir(vue) {
      const { observation, evenements } = vue;
      const options = optionsJouables(observation);
      if (options.length === 0) return null;
      const ici = situation(observation);
      vues.add(`${observation.piece.id}#${inventaire(observation)}`);
      rencontre ||= observation.creatureVisible || evenements.some((evenement) => evenement.type === 'premier_contact');
      if (traits.lire && !lues.has(observation.piece.id)) {
        lues.add(observation.piece.id);
        for (const objet of observation.objets) {
          const lu = vue.consulter(objet.id);
          if (lu?.type === 'regarder_document' && lu.designe !== undefined) designees.add(lu.designe.id);
        }
      }
      if (traits.ecouter && !ecoutees.has(observation.piece.id)) {
        ecoutees.add(observation.piece.id);
        const attendre = options.find((option) => option.action === 'attendre');
        const versInconnue = observation.passages.some((passage) => !passage.ouvert && (passage.vers === null || !observation.visitees.some((piece) => piece.id === passage.vers?.id)));
        if (attendre !== undefined && versInconnue && !observation.creatureVisible) return attendre.commande;
      }
      if (aRevoirIci(observation)) aRevoir.add(observation.piece.id);
      // Un passage d'ici qu'on ne peut ni franchir ni ouvrir est bloqué pour l'instant : porte verrouillée, vide sans pont…
      for (const passage of observation.passages) {
        const praticable = options.some((option) => (option.action === 'aller' || option.action === 'ouvrir') && option.cible.id === passage.id);
        if (!praticable && !bloque(passage.id, observation.actions)) bloques.set(passage.id, observation.actions);
      }
      if (traits.enchainer) {
        debloquees = new Set(options.filter((option) => refusees.has(`${observation.piece.id}|${cle(option.commande)}`)).map((option) => cle(option.commande)));
        refusees = new Set(observation.menu.filter((option) => !option.disponible).map((option) => `${observation.piece.id}|${cle(option.commande)}`));
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

export function creerBot(profil: Profil | Variante, graine: number): Bot {
  return profil === 'aleatoire' ? botAleatoire(graine) : botExplorateur(graine, profil in VARIANTES ? VARIANTES[profil as Variante] : (profil as Exclude<Profil, 'aleatoire'>));
}

/** Trace de la pièce du passager, par la consultation gratuite « regarder » : ce que le joueur lit en regardant la pièce. */
function traceIci(monde: DefMonde, partie: Partie, piece: string): IntensiteTrace | null {
  const resultat = jouer(monde, partie, { action: 'regarder', cible: piece });
  return resultat.type === 'consultation' && resultat.consultation.type === 'regarder_piece' ? (resultat.consultation.trace ?? null) : null;
}

/** Joue une partie complète avec un bot, depuis le réveil, et en rend les indicateurs. */
export function jouerAvecBot(
  entree: EntreeMonde,
  bot: Bot,
  graine: number,
  plafond = PLAFOND_ACTIONS,
  /** Chaque action engagée, pour une mesure de plus : ce que le joueur voyait avant, la commande, le récit et l'état qui suit. */
  surPas?: (avant: Observation, commande: Commande, evenements: readonly Evenement[], partie: Partie) => void,
): { readonly indicateurs: IndicateursPartie; readonly partie: Partie } {
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
    surPas?.(observation, commande, resultat.evenements, partie);
  }
  return { indicateurs: suivi.resultat(), partie };
}
