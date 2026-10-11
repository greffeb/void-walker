import {
  apercu,
  exporter,
  jouer,
  nouvellePartie,
  observer,
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
  libelleOption,
  raconter,
  raconterDerniers,
  rendreApercu,
  rendreAssistance,
  rendreObservation,
  rendreRefus,
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
  '  apercu <numéro>              Voir le risque, le coût et ce que vous savez avant d’agir (gratuit).',
  '  jouer <numéro>               Choisir une action du menu par son numéro.',
  '  commande <action> <cible> [paramètre]   Envoyer une commande brute ; identifiants visibles avec « voir --ids ».',
  '  exporter <fichier> [--commentaire "texte"]   Exporter la partie pour la rejouer.',
  '  aide                         Afficher cette aide.',
  '',
  'Les numéros du menu changent après chaque action : relisez le menu affiché.',
  'Seules les actions qui engagent le personnage comptent et sont enregistrées ;',
  'regarder, relire, un aperçu et une action refusée ne coûtent rien.',
  '',
  `Option : --partie <fichier>  (par défaut ${PARTIE_PAR_DEFAUT})`,
  'Option : --monde <id>  (à la reprise, le monde de la partie enregistrée ; sinon AR-01)',
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
 * Monde de l'appel : celui de `--monde`, sinon celui de la partie enregistrée (sauf pour « nouvelle »), sinon le monde par
 * défaut. Renvoie un message si le monde est inconnu.
 */
export function choisirMonde(
  argv: readonly string[],
  mondes: Readonly<Record<string, EntreeMonde>>,
  parDefaut: string,
  es: EntreesSorties,
): EntreeMonde | string {
  const { positionnels, options } = analyserArguments(argv);
  const demande = options.monde;
  if (demande === '') return 'Indiquez le monde : --monde <id>.';
  const id = demande ?? (positionnels[0] === 'nouvelle' ? null : mondeEnregistre(es.lire(cheminPartie(options)))) ?? parDefaut;
  return mondes[id] ?? `Monde inconnu : ${id}. Mondes disponibles : ${Object.keys(mondes).join(', ')}.`;
}

/** Messages de l'IA de la station reçus avec ces événements, après le récit. */
function afficherAssistance(textes: TextesMonde, evenements: readonly Evenement[]): string[] {
  return rendreAssistance(textes, evenements).map((message) => `[ IA STATION ] « ${message} »`);
}

export function afficherSituation(textes: TextesMonde, observation: Observation, avecIds = false): string[] {
  const lignes = ['', ...rendreObservation(textes, observation), ''];
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

function suite(contexte: Contexte, chemin: string, resultat: Resultat): Sortie {
  const lignes = [...raconter(contexte.textes, resultat)];
  if (resultat.type === 'engagee') {
    lignes.push(...afficherAssistance(contexte.textes, resultat.evenements));
    lignes.push(enregistrer(contexte, chemin, resultat.partie));
  }
  lignes.push(...afficherSituation(contexte.textes, observer(contexte.monde, resultat.partie.etat)));
  return { lignes, code: 0 };
}

export function executer(argv: readonly string[], contexte: Contexte): Sortie {
  const { positionnels, options } = analyserArguments(argv);
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
      return { lignes: ['Dernière action :', ...raconterDerniers(textes, partie), ...afficherAssistance(textes, partie.derniers), ...situation], code: 0 };
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
