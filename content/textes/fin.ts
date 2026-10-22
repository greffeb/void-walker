import type { Cause, Evenement, Issue, RefPiece, Sante } from '../../engine';
import { ErreurTexte, remplir } from './gabarit';
import { nomDe, rendreAssistance, rendreEvenements } from './rendu';
import type { CleMoment, CleMort, Nom, PhraseFin, TextesMonde } from './types';

// Récit de l'écran de fin (12 §4.11, D-281 à D-283) : la partie relue du réveil à la fin, ses moments marquants dits par des
// phrases écrites à la main en entier. Rien n'est composé : le récit choisit une forme de chaque phrase et en remplit les trous.

/** Moments gardés au plus (D-281, détail de l'agent). */
export const MOMENTS_MAX = 3;

/** Importance d'un moment : les plus importants sont gardés, puis remis dans l'ordre de la partie. */
const IMPORTANCE: Readonly<Record<CleMoment, number>> = {
  premier_contact: 9,
  creature_expulsee: 9,
  creature_inerte: 9,
  blesse_griffes: 8,
  blesse_feu: 8,
  blesse_froid: 8,
  blesse_griffes_feu: 8,
  blesse_griffes_froid: 8,
  critique_griffes: 8,
  critique_feu: 8,
  critique_froid: 8,
  critique_griffes_feu: 8,
  critique_griffes_froid: 8,
  pont_cede: 7,
  chute_entendue: 7,
  creature_glisse: 7,
  porte_enfoncee: 7,
  soin: 6,
  feu_eteint: 6,
  feu_eteint_derriere: 6,
  breche_ouverte: 6,
  passage_decouvert: 5,
  circuit_active: 5,
  objet_installe: 5,
  pont_place: 5,
  chambre_bouclee: 5,
  cloison_deverrouillee: 4,
  machines_arretees: 4,
  gravite_coupee: 4,
  combinaison_enfilee: 4,
  alarme_declenchee: 4,
};

/** Gestes défaits plus tard : le moment qu'ils annulent n'est pas raconté (C-05). */
const DEFAIT: Partial<Record<Evenement['type'], CleMoment>> = {
  combinaison_retiree: 'combinaison_enfilee',
  breche_rebouchee: 'breche_ouverte',
  machines_relancees: 'machines_arretees',
  gravite_retablie: 'gravite_coupee',
};

/** Ce que le passager a perçu de la créature sans la voir. */
const PERCUE: ReadonlySet<Evenement['type']> = new Set([
  'bruit_creature',
  'creature_entre',
  'pas_entendus',
  'souffle_entendu',
  'bruit_lointain',
  'bruit_proche',
  'traces_fraiches',
  'creature_glisse',
  'porte_secouee',
  'porte_enfoncee',
  'pont_cede',
  'chute_entendue',
]);

/** Ce qui a tué ou blessé, comme les textes d'aggravation : le vide l'emporte, puis le feu sur le froid (D-188, D-240). */
export function cleMort(causes: readonly Cause[]): CleMort {
  if (causes.includes('vide')) return 'vide';
  const griffes = causes.includes('griffes');
  if (causes.includes('feu')) return griffes ? 'griffes_feu' : 'feu';
  if (causes.includes('froid')) return griffes ? 'griffes_froid' : 'froid';
  return 'griffes';
}

interface Moment {
  readonly cle: CleMoment;
  /** Pièce du passager quand le moment arrive. */
  readonly piece: RefPiece;
  readonly valeurs: Readonly<Record<string, Nom>>;
  /** Ce qu'un geste plus tard peut défaire : l'objet ou la pièce visés. */
  readonly sujet: string;
  readonly rang: number;
}

function momentDe(textes: TextesMonde, evenement: Evenement): Omit<Moment, 'piece' | 'rang'> | null {
  const moment = (cle: CleMoment, valeurs: Readonly<Record<string, Nom>> = {}, sujet = ''): Omit<Moment, 'piece' | 'rang'> => ({ cle, valeurs, sujet });
  switch (evenement.type) {
    case 'premier_contact':
    case 'creature_expulsee':
    case 'creature_inerte':
      return moment(evenement.type);
    case 'aggravation_blesse':
    case 'aggravation_critique': {
      // Le vide ne blesse pas : il tue (C-04 §3.1).
      const cause = cleMort(evenement.causes);
      return cause === 'vide' ? null : moment(`${evenement.type === 'aggravation_blesse' ? 'blesse' : 'critique'}_${cause}`);
    }
    case 'pont_cede':
    case 'soin_indemne':
    case 'soin_blesse':
    case 'breche_ouverte':
    case 'combinaison_enfilee':
    case 'alarme_declenchee':
    case 'circuit_active':
    case 'cloison_deverrouillee':
    case 'machines_arretees':
    case 'pont_place': {
      const cle = evenement.type === 'soin_indemne' || evenement.type === 'soin_blesse' ? 'soin' : evenement.type;
      return moment(cle, { objet: nomDe(textes, evenement.objet) }, evenement.objet.id);
    }
    case 'objet_installe':
      return moment('objet_installe', { objet: nomDe(textes, evenement.objet), capsule: nomDe(textes, evenement.capsule) }, evenement.objet.id);
    case 'chute_entendue':
    case 'creature_glisse':
    case 'porte_enfoncee':
      return moment(evenement.type, { passage: nomDe(textes, evenement.passage) });
    case 'feu_eteint':
      return moment(evenement.piece.sorte === 'piece' ? 'feu_eteint' : 'feu_eteint_derriere', { lieu: nomDe(textes, evenement.piece) }, evenement.piece.id);
    case 'passage_decouvert':
      return moment('passage_decouvert', {}, evenement.passage.id);
    case 'chambre_bouclee':
    case 'gravite_coupee':
      return moment(evenement.type, { lieu: nomDe(textes, evenement.piece) }, evenement.piece.id);
    default:
      return null;
  }
}

/** Sujet que défait un geste (combinaison retirée, brèche rebouchée…) ; `null` s'il ne défait rien. */
function sujetDefait(evenement: Evenement): string | null {
  if ('objet' in evenement) return evenement.objet.id;
  if (evenement.type === 'gravite_retablie') return evenement.piece.id;
  return null;
}

/** Ce que la partie a montré, dans l'ordre : moments encore vrais à la fin, pièce de la fin, créature vue ou perçue. */
interface Releve {
  readonly depart: RefPiece;
  readonly moments: readonly Moment[];
  readonly fin: RefPiece;
  readonly vue: boolean;
  readonly percue: boolean;
}

function relever(textes: TextesMonde, etapes: readonly (readonly Evenement[])[]): Releve {
  const reveil = etapes[0]?.find((evenement) => evenement.type === 'reveil');
  if (reveil?.type !== 'reveil') throw new ErreurTexte('Récit de fin sans réveil.');
  let piece = reveil.piece;
  let rang = 0;
  let vue = false;
  let percue = false;
  const moments: Moment[] = [];
  for (const etape of etapes) {
    for (const evenement of etape) {
      if (evenement.type === 'deplacement') piece = evenement.piece;
      if (evenement.type === 'premier_contact') vue = true;
      if (PERCUE.has(evenement.type)) percue = true;
      const defait = DEFAIT[evenement.type];
      if (defait !== undefined) {
        const sujet = sujetDefait(evenement);
        const reste = moments.filter((moment) => moment.cle !== defait || moment.sujet !== sujet);
        moments.splice(0, moments.length, ...reste);
        continue;
      }
      const moment = momentDe(textes, evenement);
      if (moment === null) continue;
      // Une même chose au même endroit ne se raconte qu'une fois.
      if (moments.some((deja) => deja.cle === moment.cle && deja.sujet === moment.sujet && deja.piece.id === piece.id)) continue;
      moments.push({ ...moment, piece, rang: rang++ });
    }
  }
  return { depart: reveil.piece, moments, fin: piece, vue, percue };
}

/**
 * Écrit les phrases dans l'ordre, chacune sous la forme qui suit la phrase d'avant : pièce déjà dite ou non, créature déjà
 * nommée ou non.
 */
function narrateur(textes: TextesMonde, depart: RefPiece): (phrase: PhraseFin, piece: RefPiece, valeurs: Readonly<Record<string, Nom>>) => string {
  // Dernière pièce dite ; `null` après une phrase qui n'en dit pas, pour qu'aucun « y » ne renvoie trop loin.
  let lieu: string | null = depart.id;
  let creature = false;
  return (phrase, piece, valeurs) => {
    const ici = phrase.ailleurs === undefined || piece.id === lieu;
    const forme = ici ? ((creature ? phrase.iciReprise : undefined) ?? phrase.ici) : ((creature ? phrase.ailleursReprise : undefined) ?? phrase.ailleurs);
    if (forme === undefined) throw new ErreurTexte('Phrase de fin sans forme.');
    lieu = phrase.ailleurs === undefined ? null : piece.id;
    creature = phrase.iciReprise !== undefined;
    return remplir(forme, { ...valeurs, piece: nomDe(textes, piece) });
  };
}

/** Fin d'une partie, telle que le passager la connaît. */
export interface FinDePartie {
  readonly issue: Issue;
  readonly sante: Sante;
  readonly graine: number;
  /** Le monde a une créature : sans elle, rien n'est dit de ce qui rôdait. */
  readonly menace: boolean;
}

export interface RecitFin {
  readonly titre: string;
  /** Paragraphes du récit ; pour une défaite, le dernier est la phrase de la mort, à mettre en valeur (D-282). */
  readonly paragraphes: readonly string[];
  /** Message de départ d'IA Station, cité en entier sous le récit d'une évacuation (D-263). */
  readonly assistance: readonly string[];
}

/**
 * Récit de fin d'une défaite ou d'une évacuation, le même pour l'appli et la CLI (C-06 K-07). `etapes` : les événements de
 * chaque pas, du réveil (`nouvellePartie(…).derniers`) à l'action qui a fini la partie (`rejouer(…).etapes`).
 */
export function raconterFin(textes: TextesMonde, etapes: readonly (readonly Evenement[])[], fin: FinDePartie): RecitFin {
  const releve = relever(textes, etapes);
  const gardes = [...releve.moments]
    .sort((a, b) => IMPORTANCE[b.cle] - IMPORTANCE[a.cle] || a.rang - b.rang)
    .slice(0, MOMENTS_MAX)
    .sort((a, b) => a.rang - b.rang);
  const dire = narrateur(textes, releve.depart);
  const reveil = remplir(textes.fin.reveil, { piece: nomDe(textes, releve.depart) });
  const phrases = gardes.map((moment) => dire(textes.fin.moments[moment.cle], moment.piece, moment.valeurs));
  const derniere = etapes.at(-1) ?? [];
  let conclusion: string;
  if (fin.issue === 'defaite') {
    const defaite = derniere.find((evenement) => evenement.type === 'defaite');
    if (defaite?.type !== 'defaite') throw new ErreurTexte('Défaite sans événement de défaite.');
    conclusion = dire(textes.fin.morts[cleMort(defaite.causes)], releve.fin, {});
  } else {
    if (fin.sante === 'vaincu') throw new ErreurTexte('Évacuation d’un passager vaincu.');
    // Le texte de départ que l'écran a montré : même variante, même rang dans le récit de la dernière action.
    const rang = derniere.findIndex((evenement) => evenement.type === 'evacuation');
    if (rang < 0) throw new ErreurTexte('Évacuation sans événement de départ.');
    const depart = rendreEvenements(textes, derniere, { graine: fin.graine, action: etapes.length - 1 })[derniere.slice(0, rang).filter((evenement) => evenement.type !== 'assistance').length];
    if (depart === undefined) throw new ErreurTexte('Évacuation sans texte de départ.');
    const horsJeu = releve.moments.some((moment) => moment.cle === 'creature_expulsee' || moment.cle === 'creature_inerte');
    const creature = horsJeu ? null : releve.vue ? textes.fin.creature.laissee : releve.percue ? textes.fin.creature.entendue : fin.menace ? textes.fin.creature.jamais : null;
    conclusion = [depart, remplir(textes.fin.sante[fin.sante], {}), ...(creature === null ? [] : [remplir(creature, {})])].join(' ');
  }
  const paragraphes = [[reveil, ...phrases.slice(0, 1)].join(' '), phrases.slice(1).join(' '), conclusion].filter((paragraphe) => paragraphe !== '');
  return {
    titre: remplir(textes.fin.titres[fin.issue], {}),
    paragraphes,
    assistance: fin.issue === 'evacuation' ? rendreAssistance(textes, derniere) : [],
  };
}
