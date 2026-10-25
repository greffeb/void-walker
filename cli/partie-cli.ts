import {
  apercu,
  exporter,
  jouer,
  nouvellePartie,
  observer,
  rejouer,
  reprendrePartie,
  type DefMonde,
  type Evenement,
  type Observation,
  type OptionMenu,
  type Partie,
  type Resultat,
  type ResultatApercu,
} from '../engine';
import {
  former,
  libelleOption,
  lignesListeCarte,
  nomDe,
  raconter,
  raconterDerniers,
  raconterFin,
  rendreApercu,
  rendreAssistance,
  rendreDocument,
  rendreListeCarte,
  rendreObservation,
  rendreRefus,
  type Catalogue,
  type DocumentRendu,
  type EntreeMonde,
  type TextesMonde,
} from '../content';

// CLI pour les agents et le playtester : une commande par appel, partie enregistrée dans un fichier.

export const PARTIE_PAR_DEFAUT = '.void-walker/partie.json';

export interface EntreesSorties {
  lire(chemin: string): string | null;
  ecrire(chemin: string, contenu: string): void;
  graineAleatoire(): number;
}

export interface Contexte {
  readonly monde: DefMonde;
  readonly textes: TextesMonde;
  readonly version: string;
  readonly es: EntreesSorties;
}

export interface Sortie {
  readonly lignes: readonly string[];
  readonly code: number;
}

export const AIDE = [
  'Void Walker — partie en ligne de commande.',
  '',
  'Commandes :',
  '  nouvelle [--graine N]        Commencer une nouvelle partie (remplace la partie en cours).',
  '  voir [--ids]                 Relire la situation et les actions possibles (gratuit).',
  '  carte                        Relire la carte : ici, pièces visitées et connues (gratuit).',
  '  apercu <numéro>              Voir le risque, le coût et ce que vous savez avant d’agir (gratuit).',
  '  jouer <numéro>               Choisir une action du menu par son numéro.',
  '  deverrouiller [terminal]     Utiliser le post-it sur le terminal de la pièce, comme l’action du menu.',
  '  surveiller [terminal]        Se connecter au terminal de la pièce, comme l’action du menu.',
  '  commande <action> <cible> [paramètre]   Envoyer une commande brute ; identifiants visibles avec « voir --ids ».',
  '  exporter <fichier> [--commentaire "texte"]   Exporter la partie pour la rejouer.',
  '  aide                         Afficher cette aide.',
  '',
  'Les numéros du menu changent après chaque action : relisez le menu affiché.',
  'Seules les actions qui engagent le personnage comptent et sont enregistrées ;',
  'regarder, relire, un aperçu et une action refusée ne coûtent rien.',
  '',
  `Option : --partie <fichier>  (par défaut ${PARTIE_PAR_DEFAUT})`,
  'Option : --station <id>  (une composition, ex. m07-m03-soute, au plan tiré ; ou une station exacte, ex. m07-m03-soute-2718281828 ; l’emporte sur --monde)',
  'Option : --monde <id>  (à la reprise, le monde de la partie enregistrée ; sinon une station tirée)',
];

interface Arguments {
  readonly positionnels: readonly string[];
  readonly options: Readonly<Record<string, string>>;
}

export function analyserArguments(argv: readonly string[]): Arguments {
  const positionnels: string[] = [];
  const options: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i] ?? '';
    if (argument === '--ids') {
      options.ids = 'oui';
    } else if (argument.startsWith('--')) {
      options[argument.slice(2)] = argv[i + 1] ?? '';
      i++;
    } else {
      positionnels.push(argument);
    }
  }
  return { positionnels, options };
}

const OPTIONS = new Set(['partie', 'station', 'monde', 'graine', 'commentaire', 'ids']);

/** Refus d'une option inconnue, faute de frappe comprise : elle ne doit pas jouer sur la partie par défaut (#281). */
function optionInconnue(options: Readonly<Record<string, string>>): string | null {
  const inconnue = Object.keys(options).find((option) => !OPTIONS.has(option));
  return inconnue === undefined ? null : `Option inconnue : --${inconnue}. Options : --partie, --station, --monde, --graine, --commentaire, --ids.`;
}

function cheminPartie(options: Readonly<Record<string, string>>): string {
  return options.partie !== undefined && options.partie !== '' ? options.partie : PARTIE_PAR_DEFAUT;
}

/** Monde d'une partie enregistrée, ou `null` si le fichier est absent ou illisible (la reprise dira alors pourquoi). */
function mondeEnregistre(contenu: string | null): string | null {
  if (contenu === null) return null;
  try {
    const monde = (JSON.parse(contenu) as { enregistrement?: { monde?: unknown } } | null)?.enregistrement?.monde;
    return typeof monde === 'string' ? monde : null;
  } catch {
    return null;
  }
}

/**
 * Monde de l'appel : la station de `--station` (composition au plan tiré, ou station exacte), sinon le monde fixe de
 * `--monde`, sinon celui de la partie enregistrée (sauf pour « nouvelle »), sinon une grande station tirée (D-313). Renvoie un message
 * si le monde est refusé ; une partie enregistrée sur une station inconnue n'est jamais remplacée par un tirage.
 */
export function choisirEntree(argv: readonly string[], catalogue: Catalogue, es: EntreesSorties): EntreeMonde | string {
  const { positionnels, options } = analyserArguments(argv);
  const inconnue = optionInconnue(options);
  if (inconnue !== null) return inconnue;
  const { station, monde } = options;
  const hasard = (): number => es.graineAleatoire();
  if (station === '') return 'Indiquez la station : --station <id>.';
  if (station !== undefined) {
    const petite = catalogue.compositions.some(({ id }) => id === station);
    const grande = catalogue.grandes.some(({ id }) => id === station);
    const forcee = petite ? catalogue.tirer(hasard, station) : grande ? catalogue.tirerGrande(hasard, station) : catalogue.resoudre(station);
    return 'refus' in forcee ? `Station refusée : ${forcee.refus}` : forcee;
  }
  if (monde === '') return 'Indiquez le monde : --monde <id>.';
  if (monde !== undefined) {
    const fixe = Object.hasOwn(catalogue.mondes, monde) ? catalogue.mondes[monde] : undefined;
    return fixe ?? `Monde inconnu : ${monde}. Mondes disponibles : ${Object.keys(catalogue.mondes).join(', ')}.`;
  }
  const enregistre = positionnels[0] === 'nouvelle' ? null : mondeEnregistre(es.lire(cheminPartie(options)));
  if (enregistre !== null) {
    const reprise = catalogue.resoudre(enregistre);
    if (!('refus' in reprise)) return reprise;
    // Une grande station dit pourquoi elle ne se reprend pas : autre version des stations, ou station non publiée (spec §4.3).
    if (/^g\d+-/.test(enregistre)) return `${reprise.refus} Commencez une nouvelle partie : nouvelle`;
    return `La partie enregistrée porte sur une station inconnue (${enregistre}). Commencez une nouvelle partie : nouvelle`;
  }
  const tiree = catalogue.tirerGrande(hasard);
  return 'refus' in tiree ? `Station refusée : ${tiree.refus}` : tiree;
}

/** Messages de l'IA de la station reçus avec ces événements, après le récit. */
function afficherAssistance(textes: TextesMonde, evenements: readonly Evenement[]): string[] {
  return rendreAssistance(textes, evenements).map((message) => `[ IA STATION ] « ${message} »`);
}

/**
 * Écran de fin d'une défaite ou d'une évacuation, mêmes mots que l'appli (12 §4.11, D-281, C-06 K-07) : la partie relue du
 * réveil à sa dernière action. Rien pour une partie en cours ; « ne peut pas être reprise » est déjà dans la situation.
 */
export function afficherFin(monde: DefMonde, textes: TextesMonde, partie: Partie): string[] {
  const { issue, sante } = observer(monde, partie.etat);
  if (issue === null) return [];
  const { version, graine } = partie.enregistrement;
  const etapes = [nouvellePartie(monde, { version, graine }).derniers, ...rejouer(monde, partie.enregistrement, version).etapes];
  const { titre, paragraphes, assistance } = raconterFin(textes, etapes, { issue, sante, graine, menace: monde.creature !== undefined });
  return [
    '',
    '> FIN DE LA PARTIE',
    titre,
    ...paragraphes.flatMap((paragraphe) => ['', paragraphe]),
    ...assistance.map((message) => `[ IA STATION ] « ${message} »`),
  ];
}

/** État d'une caméra en mots, les mêmes que la fenêtre du poste de l'appli (lot 4, app/libelles : poste.etats). */
const ETATS_CAMERA = { calme: 'calme', mouvement: 'mouvement', brouille: 'brouillée', hs: 'plus de signal' } as const;

/** Connecté dans la salle de surveillance : les caméras en direct, une ligne chacune, comme l'appli les fait lire (lot 4). */
function afficherCameras(textes: TextesMonde, observation: Observation): string[] {
  if (observation.cameras === undefined) return [];
  return ['Caméras en direct :', ...observation.cameras.map(({ piece, etat }) => `  Caméra ${former('de', nomDe(textes, piece))} : ${ETATS_CAMERA[etat]}`), ''];
}

export function afficherSituation(textes: TextesMonde, observation: Observation, avecIds = false): string[] {
  const lignes = ['', ...rendreObservation(textes, observation), '', ...afficherCameras(textes, observation)];
  if (observation.terminee) lignes.push('Partie terminée : plus aucune action possible.');
  else lignes.push('Actions :');
  observation.menu.forEach((option, index) => {
    const { libelle, raison } = libelleOption(textes, option);
    const { action, cible, parametre } = option.commande;
    const ids = avecIds ? ` [${[action, cible, ...(parametre === undefined ? [] : [parametre])].join(' ')}]` : '';
    lignes.push(`  ${index + 1}. ${libelle}${raison === null ? '' : ` — indisponible : ${raison}`}${ids}`);
  });
  lignes.push('', `Actions engagées : ${observation.actions}`);
  return lignes;
}

/** Même aperçu que l'écran (12 §3.8) : risque, coût, ce que vous savez ; rien n'est joué. */
function afficherApercu(textes: TextesMonde, option: OptionMenu, numero: number, resultat: ResultatApercu): string[] {
  const { libelle } = libelleOption(textes, option);
  switch (resultat.type) {
    case 'refus':
      return [`Aperçu : ${libelle}`, `  ${rendreRefus(textes, resultat.raison)}`];
    case 'gratuit':
      return [`${libelle} : gratuit, rien à confirmer. Pour le faire : jouer ${numero}`];
    case 'apercu': {
      const { risque, danger, cout, savoir } = rendreApercu(textes, resultat.apercu);
      return [
        `Aperçu : ${libelle}`,
        `  Risque : ${risque}${danger === null ? '' : ` — ${danger}`}`,
        `  Coût : ${cout}`,
        ...savoir.map((phrase) => `  ${phrase}`),
        `Rien n’est joué. Pour confirmer : jouer ${numero}`,
      ];
    }
  }
}

function charger(contexte: Contexte, chemin: string): Partie | string {
  const contenu = contexte.es.lire(chemin);
  if (contenu === null) return 'Aucune partie en cours. Commencez par : nouvelle';
  try {
    return reprendrePartie(contexte.monde, JSON.parse(contenu) as unknown, contexte.version);
  } catch (erreur) {
    const detail = erreur instanceof Error ? erreur.message : String(erreur);
    return `La partie enregistrée ne peut pas reprendre (${detail}). Commencez une nouvelle partie : nouvelle`;
  }
}

function enregistrer(contexte: Contexte, chemin: string, partie: Partie): string {
  try {
    contexte.es.ecrire(chemin, JSON.stringify(partie));
    return 'Partie enregistrée.';
  } catch (erreur) {
    const detail = erreur instanceof Error ? erreur.message : String(erreur);
    return `ATTENTION : la partie n’a pas pu être enregistrée (${detail}). Cette action ne sera pas conservée : le prochain appel repartira de la dernière partie enregistrée.`;
  }
}

/** Un document se lit ligne à ligne (spec 2026-10-18 §9.2) : le support, la ligne « où », le corps (journal : « hh:mm  texte »), la signature. */
function lignesDocument({ libelleSupport, ou, corps, signature }: DocumentRendu): string[] {
  return [libelleSupport, ou, ...corps.map(({ heure, texte }) => (heure === undefined ? texte : `${heure}  ${texte}`)), ...(signature === undefined ? [] : [signature])];
}

function suite(contexte: Contexte, chemin: string, resultat: Resultat): Sortie {
  const lignes =
    resultat.type === 'consultation' && resultat.consultation.type === 'regarder_document'
      ? lignesDocument(rendreDocument(contexte.textes, resultat.consultation))
      : [...raconter(contexte.textes, resultat)];
  if (resultat.type === 'engagee') {
    lignes.push(...afficherAssistance(contexte.textes, resultat.evenements));
    lignes.push(enregistrer(contexte, chemin, resultat.partie));
  }
  lignes.push(...afficherSituation(contexte.textes, observer(contexte.monde, resultat.partie.etat)));
  lignes.push(...afficherFin(contexte.monde, contexte.textes, resultat.partie));
  return { lignes, code: 0 };
}

export function executer(argv: readonly string[], contexte: Contexte): Sortie {
  const { positionnels, options } = analyserArguments(argv);
  const inconnue = optionInconnue(options);
  if (inconnue !== null) return { lignes: [inconnue], code: 1 };
  const [commande = 'aide', ...reste] = positionnels;
  const chemin = cheminPartie(options);
  const { monde, textes } = contexte;

  switch (commande) {
    case 'aide':
      return { lignes: AIDE, code: 0 };
    case 'nouvelle': {
      if (reste.length > 0) return { lignes: [`Argument inattendu : ${reste.join(' ')}. Pour choisir la graine : nouvelle --graine N`], code: 1 };
      const texteGraine = options.graine;
      const graine = texteGraine === undefined ? contexte.es.graineAleatoire() : /^\d+$/.test(texteGraine) ? Number(texteGraine) : Number.NaN;
      if (!Number.isInteger(graine) || graine < 0 || graine > 0xffffffff) {
        return { lignes: ['Graine invalide : entier de 0 à 4294967295 attendu.'], code: 1 };
      }
      const partie = nouvellePartie(monde, { version: contexte.version, graine });
      const lignes = [...raconterDerniers(textes, partie), ...afficherAssistance(textes, partie.derniers), enregistrer(contexte, chemin, partie)];
      lignes.push(...afficherSituation(textes, observer(monde, partie.etat)));
      return { lignes, code: 0 };
    }
    case 'voir': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const situation = afficherSituation(textes, observer(monde, partie.etat), options.ids === 'oui');
      return { lignes: ['Dernière action :', ...raconterDerniers(textes, partie), ...afficherAssistance(textes, partie.derniers), ...situation, ...afficherFin(monde, textes, partie)], code: 0 };
    }
    case 'carte': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      return { lignes: lignesListeCarte(rendreListeCarte(textes, observer(monde, partie.etat).carte)), code: 0 };
    }
    case 'apercu':
    case 'jouer': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const observation = observer(monde, partie.etat);
      if (observation.terminee) return { lignes: [rendreRefus(textes, 'partie_terminee')], code: 1 };
      const menu = observation.menu;
      const numero = Number(reste[0]);
      const option = Number.isInteger(numero) ? menu[numero - 1] : undefined;
      if (option === undefined) return { lignes: [`Numéro d’action invalide : choisissez entre 1 et ${menu.length}.`], code: 1 };
      if (commande === 'apercu') return { lignes: afficherApercu(textes, option, numero, apercu(monde, partie, option.commande)), code: 0 };
      return suite(contexte, chemin, jouer(monde, partie, option.commande));
    }
    case 'commande': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const [action = '', cible = '', parametre] = reste;
      return suite(contexte, chemin, jouer(monde, partie, { action, cible, ...(parametre === undefined ? {} : { parametre }) }));
    }
    case 'deverrouiller':
    case 'surveiller': {
      // Raccourcis des actions du menu (lot 4), refusées sans le post-it comme par leur numéro ; « terminal » est facultatif : un seul par station.
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const option = observer(monde, partie.etat).menu.find((choix) => choix.action === commande);
      if (option === undefined) return { lignes: [commande === 'surveiller' ? 'Aucun terminal ici.' : 'Aucun terminal à déverrouiller ici.'], code: 1 };
      return suite(contexte, chemin, jouer(monde, partie, option.commande));
    }
    case 'exporter': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const fichier = reste[0];
      if (fichier === undefined) return { lignes: ['Indiquez le fichier d’export : exporter <fichier>'], code: 1 };
      const donnees = exporter(monde, partie, options.commentaire);
      try {
        contexte.es.ecrire(fichier, `${JSON.stringify(donnees, null, 2)}\n`);
      } catch (erreur) {
        return { lignes: [`Export impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}`], code: 1 };
      }
      const etat = observer(monde, partie.etat).terminee ? 'La partie est terminée.' : 'La partie continue.';
      return { lignes: [`Partie exportée dans ${fichier} (${partie.etat.actions} actions engagées). ${etat}`], code: 0 };
    }
    default:
      return { lignes: [`Commande inconnue : ${commande}.`, '', ...AIDE], code: 1 };
  }
}
