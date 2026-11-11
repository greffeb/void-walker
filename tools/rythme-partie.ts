import type { Commande, DefMonde, Evenement, Observation, Partie } from '../engine';
import { creatureActive, creatureEnVue } from '../engine/etat';
import { indexer } from '../engine/monde';
import type { IndicateursPartie } from './indicateurs-partie';
import type { PasTemoin } from './verifier-grandes';
import { creatureHorsJeu, morceauDe } from './verifier-station';

// Rythme d'une partie et raison de sa fin (mesure 2026-11) : ce que `indicateurs-partie` mélange ou ne compte pas. Outil de
// mesure : il lit l'état complet et le chemin prouvé de la station, ce qu'aucun bot joueur ne voit.

/** Comment la partie s'est finie : une seule catégorie par partie. */
export const FINS = ['evacuation', 'creature', 'environnement', 'sans_sortie', 'perdu', 'interrompu'] as const;
export type Fin = (typeof FINS)[number];

/** Pourquoi le bot perdu n'a pas franchi le passage du chemin prouvé où il s'est arrêté. */
export const RAISONS_PERDU = ['passage_jamais_pris', 'porte_jamais_ouverte', 'geste_jamais_choisi', 'geste_jamais_propose', 'passage_bloque', 'passage_jamais_vu', 'chemin_parcouru'] as const;
export type RaisonPerdu = (typeof RAISONS_PERDU)[number];

export interface Perdu {
  /** Morceau où le bot a passé le plus d'actions parmi les `FENETRE` dernières, et pièces distinctes qu'il y a vues. */
  readonly morceau: string;
  readonly piecesALaFin: number;
  /** Attentes parmi les `FENETRE` dernières actions. */
  readonly attentesALaFin: number;
  /** Morceau du premier passage du chemin prouvé qu'il n'a jamais franchi ; `null` s'il les a tous franchis. */
  readonly frontiere: string | null;
  readonly raison: RaisonPerdu;
  /** Le geste du chemin prouvé qui manquait avant ce passage : action et nom de sa cible ; `null` sans geste manquant. */
  readonly geste: string | null;
}

export interface Rythme {
  readonly fin: Fin;
  readonly actions: number;
  /** Action du premier signe de la créature : bruit, trace fraîche, écoute qui entend, message d'IA Station, ou la créature elle-même. */
  readonly premierSigne: number | null;
  readonly premierContact: number | null;
  /** Actions qui portent un signe avant le premier contact (toute la partie s'il n'a pas lieu) : ce qui l'annonce sans la montrer. */
  readonly signesAvantContact: number;
  /** Coups de griffes reçus. */
  readonly griffes: number;
  /** Fois où la créature est entrée en vue. */
  readonly faceAFace: number;
  /** Actions finies avec la créature en traque après le premier contact : en vue, à l'écoute, à une porte, ou avant sa fouille. */
  readonly poursuite: number;
  /** Actions finies avec la créature hors jeu ou enfermée (D-241). */
  readonly sansMenace: number;
  /** Plus longue suite d'actions sans événement notable : rien d'autre que marcher, ouvrir, fermer, poser, attendre sans rien entendre. */
  readonly calme: number;
  /** Retours immédiats dans la pièce qu'on vient de quitter. */
  readonly allersRetours: number;
  readonly pieces: number;
  readonly attentes: number;
  readonly fermetures: number;
  /** Actions entre le premier contact et la mort par la créature ; `null` sinon. */
  readonly sursis: number | null;
  /** Seulement pour une partie perdue ou sans sortie, quand le chemin prouvé est connu. */
  readonly perdu: Perdu | null;
}

/** Dernières actions regardées pour dire où un bot perdu tournait. */
export const FENETRE = 200;

const SIGNES: ReadonlySet<Evenement['type']> = new Set([
  'bruit_lointain', 'bruit_proche', 'traces_fraiches', 'bruit_creature', 'poursuite_proche', 'pas_entendus', 'souffle_entendu', 'creature_entre',
  'premier_contact', 'menace', 'porte_secouee', 'porte_enfoncee', 'creature_glisse', 'chute_entendue', 'pont_cede', 'creature_attiree',
]);

const BANALS: ReadonlySet<Evenement['type']> = new Set([
  'deplacement', 'passage_ouvert', 'passage_ouvert_encombre', 'passage_ferme', 'attente', 'ecoute_couverte', 'ecoute_groupee', 'ecoute_rappel',
  'bruit_mecanisme', 'bruit_couvert', 'objet_pose', 'objet_pose_position', 'derive',
]);

const DEPLACEMENTS: ReadonlySet<string> = new Set(['aller', 'ouvrir', 'fermer', 'attendre']);

export function estSigne(evenement: Evenement): boolean {
  if (evenement.type === 'ecoute') return evenement.entendu === 'net' || evenement.entendu === 'vague' || evenement.entendu === 'toujours';
  if (evenement.type === 'assistance') return evenement.signe !== undefined;
  if (evenement.type === 'capteur' || evenement.type === 'capteur_pose') return evenement.etat === 'mouvement';
  if (evenement.type === 'aggravation_blesse' || evenement.type === 'aggravation_critique' || evenement.type === 'defaite') return evenement.causes.includes('griffes');
  return SIGNES.has(evenement.type);
}

const banal = (evenement: Evenement): boolean => BANALS.has(evenement.type) || (evenement.type === 'ecoute' && !estSigne(evenement));

const cle = (action: string, cible: string, parametre?: string): string => `${action}|${cible}|${parametre ?? ''}`;

/** Suit une partie pas à pas, par le crochet `surPas` de `jouerAvecBot`. */
export class SuiviRythme {
  private actions = 0;
  private premierSigne: number | null = null;
  private premierContact: number | null = null;
  private signesAvantContact = 0;
  private griffes = 0;
  private faceAFace = 0;
  private poursuite = 0;
  private sansMenace = 0;
  private calme = 0;
  private calmeEnCours = 0;
  private allersRetours = 0;
  private attentes = 0;
  private fermetures = 0;
  private mort: 'creature' | 'environnement' | null = null;
  private enVue = false;
  private quittee: string | null = null;
  private readonly pieces: string[];
  private readonly gestes: string[] = [];
  private readonly faites = new Set<string>();
  private readonly proposees = new Set<string>();

  constructor(private readonly monde: DefMonde, depart: Partie, private readonly temoin?: readonly PasTemoin[]) {
    this.pieces = [depart.etat.piece];
  }

  readonly noter = (avant: Observation, commande: Commande, evenements: readonly Evenement[], partie: Partie): void => {
    const { etat } = partie;
    this.actions++;
    for (const option of avant.menu) if (option.disponible) this.proposees.add(cle(option.action, option.cible.id, option.parametre?.id));
    this.faites.add(cle(commande.action, commande.cible, commande.parametre));
    this.gestes.push(commande.action);
    if (commande.action === 'attendre') this.attentes++;
    if (commande.action === 'fermer') this.fermetures++;
    for (const evenement of evenements) {
      if (estSigne(evenement)) this.premierSigne ??= this.actions;
      if (evenement.type === 'premier_contact') this.premierContact ??= this.actions;
      if (evenement.type === 'aggravation_blesse' || evenement.type === 'aggravation_critique' || evenement.type === 'defaite') {
        if (evenement.causes.includes('griffes')) this.griffes++;
        if (evenement.type === 'defaite') this.mort = evenement.causes.includes('griffes') ? 'creature' : 'environnement';
      }
    }
    if (this.premierContact === null && evenements.some(estSigne)) this.signesAvantContact++;
    this.calmeEnCours = evenements.every(banal) ? this.calmeEnCours + 1 : 0;
    this.calme = Math.max(this.calme, this.calmeEnCours);
    const ici = this.pieces.at(-1);
    if (etat.piece !== ici) {
      if (etat.piece === this.quittee) this.allersRetours++;
      this.quittee = ici ?? null;
    }
    this.pieces.push(etat.piece);
    const vue = creatureEnVue(etat);
    if (vue && !this.enVue) this.faceAFace++;
    this.enVue = vue;
    const creature = etat.creature;
    if (creature !== null && creatureActive(etat) && creature.contact && (vue || creature.ecoute !== undefined || creature.force !== undefined || creature.fouille !== true)) this.poursuite++;
    if (creatureHorsJeu(this.monde, etat)) this.sansMenace++;
  };

  /** `plafond` : le nombre d'actions accordé ; une partie arrêtée avant, sans fin, a été interrompue par le bot. */
  resultat(indicateurs: IndicateursPartie, plafond: number): Rythme {
    const fin: Fin =
      indicateurs.issue === 'evacuation' ? 'evacuation'
      : this.mort !== null ? this.mort
      : indicateurs.sansSortie !== null ? 'sans_sortie'
      : this.actions < plafond ? 'interrompu'
      : 'perdu';
    return {
      fin,
      actions: this.actions,
      premierSigne: this.premierSigne,
      premierContact: this.premierContact,
      signesAvantContact: this.signesAvantContact,
      griffes: this.griffes,
      faceAFace: this.faceAFace,
      poursuite: this.poursuite,
      sansMenace: this.sansMenace,
      calme: this.calme,
      allersRetours: this.allersRetours,
      pieces: new Set(this.pieces).size,
      attentes: this.attentes,
      fermetures: this.fermetures,
      sursis: fin === 'creature' && this.premierContact !== null ? this.actions - this.premierContact : null,
      perdu: (fin === 'perdu' || fin === 'sans_sortie') && this.temoin !== undefined ? this.perdu(this.temoin) : null,
    };
  }

  /**
   * Où le bot s'est arrêté sur le chemin prouvé : le premier passage de ce chemin qu'il n'a jamais franchi. S'il pouvait le
   * prendre ou l'ouvrir, c'est son choix ; sinon, le premier geste du chemin qu'il n'a pas fait avant ce passage dit ce qui manquait.
   */
  private perdu(temoin: readonly PasTemoin[]): Perdu {
    const index = indexer(this.monde);
    const fin = this.pieces.slice(-FENETRE);
    const parMorceau = new Map<string, number>();
    for (const piece of fin) parMorceau.set(morceauDe(piece) ?? piece, (parMorceau.get(morceauDe(piece) ?? piece) ?? 0) + 1);
    const morceau = [...parMorceau].sort(([a, n], [b, m]) => m - n || (a < b ? -1 : 1))[0]?.[0] ?? '';
    const faite = ([action, cible, parametre]: PasTemoin): boolean => this.faites.has(cle(action, cible, parametre));
    const proposee = ([action, cible, parametre]: PasTemoin): boolean => this.proposees.has(cle(action, cible, parametre));
    const rang = temoin.findIndex((pas) => pas[0] === 'aller' && !faite(pas));
    const passage = temoin[rang];
    const manquant = temoin.slice(0, rang < 0 ? temoin.length : rang).find((pas) => !DEPLACEMENTS.has(pas[0]) && !faite(pas));
    const nomDe = (id: string): string => {
      const interne = index.versInterne.get(id) ?? id;
      return index.objets.get(interne)?.nom ?? index.positions.get(interne)?.nom ?? interne;
    };
    const geste = manquant === undefined ? null : [manquant[0], nomDe(manquant[1]), ...(manquant[2] === undefined ? [] : [nomDe(manquant[2])])].join(' ');
    const vues = new Set(this.pieces);
    const raison: RaisonPerdu =
      passage === undefined ? 'chemin_parcouru'
      : proposee(passage) ? 'passage_jamais_pris'
      : proposee(['ouvrir', passage[1]]) && !faite(['ouvrir', passage[1]]) ? 'porte_jamais_ouverte'
      : manquant !== undefined ? (proposee(manquant) ? 'geste_jamais_choisi' : 'geste_jamais_propose')
      : index.liaisons.get(index.versInterne.get(passage[1]) ?? '')?.entre.some((piece) => vues.has(piece)) === true ? 'passage_bloque'
      : 'passage_jamais_vu';
    return {
      morceau,
      piecesALaFin: new Set(fin).size,
      attentesALaFin: this.gestes.slice(-FENETRE).filter((action) => action === 'attendre').length,
      frontiere: passage === undefined ? null : (morceauDe(index.versInterne.get(passage[1]) ?? '') ?? 'jonction'),
      raison,
      geste,
    };
  }
}
