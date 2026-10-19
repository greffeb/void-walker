import { CAUSES, empreinteEtat, jouer, nouvellePartie, observer, type Cause, type DefMonde, type Des, type Enregistrement, type EtatPartie, type Evenement, type Partie, type Sante } from '../engine';
import { indexer } from '../engine/monde';
import { ATTEINT_JUSQUA } from '../engine/sante';
import { creatureHorsJeu, rangsDesSegments } from './verifier-station';

// Indicateurs de difficulté d'une partie (#194 §1), humaine ou jouée par un bot : comptés depuis les événements et l'état de
// chaque pas. Le rejeu d'un export peut changer le seuil d'esquive (#194 §2.1) : un contrefactuel, à décisions identiques.

export type IssueMesuree = 'evacuation' | 'defaite' | 'en_cours';

export interface IndicateursPartie {
  readonly monde: string;
  readonly issue: IssueMesuree;
  readonly actions: number;
  readonly sante: Sante;
  /** Dés lancés : un par jet d'interception. 0 : la créature n'a joué aucun rôle. */
  readonly des: number;
  /** Aggravations subies (au plus une par action, C-04 §3), défaite comprise. */
  readonly coups: number;
  /** Aggravations où chaque cause a joué ; une aggravation à deux causes compte pour chacune. */
  readonly parCause: Readonly<Record<Cause, number>>;
  /** Numéro de l'action du premier contact ; `null` s'il n'a pas eu lieu. */
  readonly premierContact: number | null;
  /** Première action finie avec la créature hors jeu ou enfermée (D-241) ; `null` sinon. */
  readonly horsJeu: number | null;
  /** Première action finie sans aucune sortie possible (D-275) ; `null` sinon. */
  readonly sansSortie: number | null;
  /** Aucun premier contact de toute la partie (spec 2026-10-18 §11). */
  readonly sansContact: boolean;
  /** Une porte de boucle franchie après la rencontre : la boucle a servi à la poursuite. */
  readonly boucleEnPoursuite: boolean;
  /** Défaite : segment de la pièce de la mort rapporté au plus avancé de la station, de 0 à 1 ; `null` sans défaite. */
  readonly avancementDefaite: number | null;
  /** Pièces distinctes où le passager est passé, départ compris. */
  readonly piecesVisitees: number;
}

/** Comptes d'une partie en cours, pas après pas. */
export class SuiviPartie {
  private actions = 0;
  private des = 0;
  private coups = 0;
  private readonly parCause: Record<Cause, number> = Object.fromEntries(CAUSES.map((cause) => [cause, 0])) as Record<Cause, number>;
  private premierContact: number | null = null;
  private horsJeu: number | null = null;
  private sansSortie: number | null = null;
  private boucleEnPoursuite = false;
  private readonly visitees: Set<string>;
  private etat: EtatPartie;

  constructor(private readonly monde: DefMonde, depart: Partie) {
    this.etat = depart.etat;
    this.visitees = new Set([depart.etat.piece]);
  }

  /** Une action engagée : ses événements, ses tirages et l'état qui la suit. */
  noter(evenements: readonly Evenement[], tirages: readonly number[], etat: EtatPartie): void {
    this.actions++;
    this.des += tirages.length;
    for (const evenement of evenements) {
      if (evenement.type === 'premier_contact') this.premierContact ??= this.actions;
      if (evenement.type === 'deplacement' && this.premierContact !== null && (this.monde.boucles ?? []).includes(indexer(this.monde).versInterne.get(evenement.passage.id) ?? '')) this.boucleEnPoursuite = true;
      if (evenement.type === 'aggravation_blesse' || evenement.type === 'aggravation_critique' || evenement.type === 'defaite') {
        this.coups++;
        for (const cause of new Set(evenement.causes)) this.parCause[cause]++;
      }
    }
    if (this.horsJeu === null && creatureHorsJeu(this.monde, etat)) this.horsJeu = this.actions;
    if (this.sansSortie === null && observer(this.monde, etat).sansSortie) this.sansSortie = this.actions;
    this.visitees.add(etat.piece);
    this.etat = etat;
  }

  resultat(): IndicateursPartie {
    const issue: IssueMesuree = this.etat.fin === 'evacuation' ? 'evacuation' : this.etat.sante === 'vaincu' ? 'defaite' : 'en_cours';
    const rang = rangsDesSegments(this.monde);
    const plusLoin = Math.max(...this.monde.pieces.map((piece) => rang(piece.id)));
    return {
      monde: this.monde.id,
      issue,
      actions: this.actions,
      sante: this.etat.sante,
      des: this.des,
      coups: this.coups,
      parCause: { ...this.parCause },
      premierContact: this.premierContact,
      horsJeu: this.horsJeu,
      sansSortie: this.sansSortie,
      sansContact: this.premierContact === null,
      boucleEnPoursuite: this.boucleEnPoursuite,
      avancementDefaite: issue === 'defaite' ? (plusLoin === 0 ? 0 : rang(this.etat.piece) / plusLoin) : null,
      piecesVisitees: this.visitees.size,
    };
  }
}

export interface RejeuMesure {
  readonly indicateurs: IndicateursPartie;
  /** `null` si chaque action a été rejouée avec les mêmes tirages ; sinon la première qui diverge, et pourquoi. */
  readonly divergence: { readonly action: number; readonly motif: string } | null;
  /** Même état final que l'export (empreinte) : la partie se relit à l'identique avec le moteur actuel. */
  readonly identique: boolean;
  /** Actions du journal non jouées : la partie s'est conclue avant (contrefactuel). */
  readonly nonJouees: number;
}

/**
 * Relit chaque tirage enregistré à un autre seuil : on rend au moteur 1 si le jet touche au nouveau seuil (de 1 à `seuil`),
 * sinon la première face que le moteur fait rater. Un moteur où chaque face touche ne peut pas rejouer un jet raté.
 */
export function desAuSeuil(tirages: readonly number[], seuil: number): Des {
  const file = [...tirages];
  return {
    lancer(faces: number): number {
      const tirage = file.shift();
      if (tirage === undefined) throw new Error('Dé demandé sans tirage enregistré.');
      if (tirage <= seuil) return 1;
      if (ATTEINT_JUSQUA >= faces) throw new Error(`Le moteur fait toucher chaque face de 1 à ${faces} : aucun jet raté à rejouer.`);
      return ATTEINT_JUSQUA + 1;
    },
  };
}

/**
 * Rejoue un enregistrement avec le moteur actuel et en tire les indicateurs. Sans `seuil`, les tirages doivent revenir à
 * l'identique ; avec `seuil`, chaque tirage enregistré est relu à ce seuil (`desAuSeuil`) et la partie s'arrête à sa fin.
 */
export function rejouerPourMesure(monde: DefMonde, enregistrement: Enregistrement, empreinte?: string, seuil?: number): RejeuMesure {
  let partie = nouvellePartie(monde, { version: enregistrement.version, graine: enregistrement.graine });
  const suivi = new SuiviPartie(monde, partie);
  let divergence: RejeuMesure['divergence'] = null;
  let jouees = 0;
  for (const [index, entree] of enregistrement.actions.entries()) {
    if (partie.etat.fin !== null || partie.etat.sante === 'vaincu') break;
    let resultat;
    try {
      resultat = jouer(monde, partie, entree.commande, seuil === undefined ? undefined : desAuSeuil(entree.tirages, seuil));
    } catch (erreur) {
      divergence = { action: index + 1, motif: erreur instanceof Error ? erreur.message : String(erreur) };
      break;
    }
    if (resultat.type !== 'engagee') {
      divergence = { action: index + 1, motif: resultat.type === 'refus' ? `commande refusée (${resultat.raison})` : 'commande non engagée' };
      break;
    }
    if (resultat.tirages.length !== entree.tirages.length || (seuil === undefined && resultat.tirages.some((tirage, rang) => tirage !== entree.tirages[rang]))) {
      divergence = { action: index + 1, motif: 'tirages différents de ceux enregistrés' };
      break;
    }
    partie = resultat.partie;
    suivi.noter(resultat.evenements, resultat.tirages, partie.etat);
    jouees++;
  }
  const identique = divergence === null && jouees === enregistrement.actions.length && (empreinte === undefined || empreinteEtat(partie.etat) === empreinte);
  return { indicateurs: suivi.resultat(), divergence, identique, nonJouees: divergence === null ? enregistrement.actions.length - jouees : 0 };
}
