import {
  exporter,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  type DefMonde,
  type Observation,
  type Partie,
  type Resultat,
} from '../engine';
import { libelleOption, raconter, raconterDerniers, rendreObservation, type TextesMonde } from '../content';

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
  '  jouer <numéro>               Choisir une action du menu par son numéro.',
  '  commande <action> <cible>    Envoyer une commande brute ; identifiants visibles avec « voir --ids ».',
  '  exporter <fichier> [--commentaire "texte"]   Exporter la partie pour la rejouer.',
  '  aide                         Afficher cette aide.',
  '',
  'Les numéros du menu changent après chaque action : relisez le menu affiché.',
  'Seules les actions qui engagent le personnage comptent et sont enregistrées ;',
  'regarder, relire et une action refusée ne coûtent rien.',
  '',
  `Option : --partie <fichier>  (par défaut ${PARTIE_PAR_DEFAUT})`,
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

export function afficherSituation(textes: TextesMonde, observation: Observation, avecIds = false): string[] {
  const lignes = ['', ...rendreObservation(textes, observation), '', 'Actions :'];
  observation.menu.forEach((option, index) => {
    const { libelle, raison } = libelleOption(textes, option);
    const ids = avecIds ? ` [${option.commande.action} ${option.commande.cible}]` : '';
    lignes.push(`  ${index + 1}. ${libelle}${raison === null ? '' : ` — indisponible : ${raison}`}${ids}`);
  });
  lignes.push('', `Actions engagées : ${observation.actions}`);
  return lignes;
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
    return `ATTENTION : la partie n’a pas pu être enregistrée (${detail}). Vous pouvez continuer ; l’enregistrement sera retenté à la prochaine action.`;
  }
}

function suite(contexte: Contexte, chemin: string, resultat: Resultat): Sortie {
  const lignes = [...raconter(contexte.textes, resultat)];
  if (resultat.type === 'engagee') lignes.push(enregistrer(contexte, chemin, resultat.partie));
  lignes.push(...afficherSituation(contexte.textes, observer(contexte.monde, resultat.partie.etat)));
  return { lignes, code: 0 };
}

export function executer(argv: readonly string[], contexte: Contexte): Sortie {
  const { positionnels, options } = analyserArguments(argv);
  const [commande = 'aide', ...reste] = positionnels;
  const chemin = options.partie !== undefined && options.partie !== '' ? options.partie : PARTIE_PAR_DEFAUT;
  const { monde, textes } = contexte;

  switch (commande) {
    case 'aide':
      return { lignes: AIDE, code: 0 };
    case 'nouvelle': {
      const graine = options.graine === undefined ? contexte.es.graineAleatoire() : Number(options.graine);
      if (!Number.isInteger(graine) || graine < 0 || graine > 0xffffffff) {
        return { lignes: ['Graine invalide : entier de 0 à 4294967295 attendu.'], code: 1 };
      }
      const partie = nouvellePartie(monde, { version: contexte.version, graine });
      const lignes = [...raconterDerniers(textes, partie), enregistrer(contexte, chemin, partie)];
      lignes.push(...afficherSituation(textes, observer(monde, partie.etat)));
      return { lignes, code: 0 };
    }
    case 'voir': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const situation = afficherSituation(textes, observer(monde, partie.etat), options.ids === 'oui');
      return { lignes: ['Dernière action :', ...raconterDerniers(textes, partie), ...situation], code: 0 };
    }
    case 'jouer': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      const menu = observer(monde, partie.etat).menu;
      const numero = Number(reste[0]);
      const option = Number.isInteger(numero) ? menu[numero - 1] : undefined;
      if (option === undefined) return { lignes: [`Numéro d’action invalide : choisissez entre 1 et ${menu.length}.`], code: 1 };
      return suite(contexte, chemin, jouer(monde, partie, option.commande));
    }
    case 'commande': {
      const partie = charger(contexte, chemin);
      if (typeof partie === 'string') return { lignes: [partie], code: 1 };
      return suite(contexte, chemin, jouer(monde, partie, { action: reste[0] ?? '', cible: reste[1] ?? '' }));
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
      return { lignes: [`Partie exportée dans ${fichier} (${partie.etat.actions} actions engagées). La partie continue.`], code: 0 };
    }
    default:
      return { lignes: [`Commande inconnue : ${commande}.`, '', ...AIDE], code: 1 };
  }
}
