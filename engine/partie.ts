import { CATALOGUE } from './actions';
import { graineValide, ouvrirDes } from './des';
import { etatInitial, refPiece, type EtatPartie } from './etat';
import { empreinte } from './hachage';
import { indexer, type DefMonde } from './monde';
import { observer } from './observation';
import { ACTIONS, type Commande, type Consultation, type Evenement, type IdAction, type Observation, type RaisonRefus } from './vocabulaire';

export const FORMAT_ENREGISTREMENT = 1;

export interface EntreeJournal {
  readonly commande: Commande;
  readonly tirages: readonly number[];
}

/** Ce qui suffit à rejouer une partie à l'identique (C-09 SP-01). */
export interface Enregistrement {
  readonly format: typeof FORMAT_ENREGISTREMENT;
  readonly version: string;
  readonly monde: string;
  readonly graine: number;
  readonly actions: readonly EntreeJournal[];
}

export interface Partie {
  readonly enregistrement: Enregistrement;
  readonly etat: EtatPartie;
  /** Événements de la dernière action engagée, pour raconter de nouveau après une reprise. */
  readonly derniers: readonly Evenement[];
}

export type Resultat =
  | { readonly type: 'refus'; readonly raison: RaisonRefus; readonly partie: Partie }
  | { readonly type: 'consultation'; readonly consultation: Consultation; readonly partie: Partie }
  | { readonly type: 'engagee'; readonly evenements: readonly Evenement[]; readonly tirages: readonly number[]; readonly partie: Partie };

export interface ExportPartie extends Enregistrement {
  readonly observation: Observation;
  readonly empreinte: string;
  readonly commentaire?: string;
}

export class ErreurRejeu extends Error {
  override readonly name = 'ErreurRejeu';
}

export function nouvellePartie(monde: DefMonde, options: { readonly version: string; readonly graine: number }): Partie {
  const etat = etatInitial(monde, options.graine);
  return {
    enregistrement: { format: FORMAT_ENREGISTREMENT, version: options.version, monde: monde.id, graine: options.graine, actions: [] },
    etat,
    derniers: [{ type: 'reveil', piece: refPiece(monde, etat.piece) }],
  };
}

function estCommande(valeur: unknown): valeur is Commande {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const { action, cible } = valeur as Record<string, unknown>;
  return typeof action === 'string' && typeof cible === 'string';
}

function estAction(action: string): action is IdAction {
  return (ACTIONS as readonly string[]).includes(action);
}

/** Joue une commande structurée ; un refus ou une consultation rend la partie inchangée (C-01 §6, C-03 §2). */
export function jouer(monde: DefMonde, partie: Partie, commande: unknown): Resultat {
  if (!estCommande(commande)) return { type: 'refus', raison: 'commande_invalide', partie };
  if (!estAction(commande.action)) return { type: 'refus', raison: 'action_inconnue', partie };
  const cible = indexer(monde).versInterne.get(commande.cible);
  if (cible === undefined) return { type: 'refus', raison: 'cible_absente', partie };
  const definition = CATALOGUE[commande.action];
  const contexte = { monde, etat: partie.etat };
  const raison = definition.verifier(contexte, cible);
  if (raison !== null) return { type: 'refus', raison, partie };
  if (!definition.engage) return { type: 'consultation', consultation: definition.consulter(contexte, cible), partie };

  const session = ouvrirDes(partie.etat.generateur);
  const effet = definition.appliquer(contexte, cible, session.des);
  const tirages = [...session.tirages];
  const etat: EtatPartie = { ...effet.etat, actions: partie.etat.actions + 1, generateur: session.etatFinal() };
  const entree: EntreeJournal = { commande: { action: commande.action, cible: commande.cible }, tirages };
  return {
    type: 'engagee',
    evenements: effet.evenements,
    tirages,
    partie: {
      enregistrement: { ...partie.enregistrement, actions: [...partie.enregistrement.actions, entree] },
      etat,
      derniers: effet.evenements,
    },
  };
}

function memesTirages(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((valeur, index) => valeur === b[index]);
}

/** Rejoue depuis l'état initial avec les mêmes tirages ; toute divergence est une erreur (C-09 §5). */
export function rejouer(
  monde: DefMonde,
  enregistrement: Enregistrement,
  version: string,
): { readonly partie: Partie; readonly etapes: readonly (readonly Evenement[])[] } {
  if (enregistrement.format !== FORMAT_ENREGISTREMENT) throw new ErreurRejeu(`Format ${String(enregistrement.format)} non pris en charge.`);
  if (enregistrement.version !== version) {
    throw new ErreurRejeu(`Partie enregistrée avec la version ${enregistrement.version}, jeu en version ${version}.`);
  }
  if (enregistrement.monde !== monde.id) throw new ErreurRejeu(`Partie du monde ${enregistrement.monde}, pas ${monde.id}.`);
  let partie = nouvellePartie(monde, { version, graine: enregistrement.graine });
  const etapes: (readonly Evenement[])[] = [];
  enregistrement.actions.forEach((entree, index) => {
    const resultat = jouer(monde, partie, entree.commande);
    if (resultat.type !== 'engagee') {
      const detail = resultat.type === 'refus' ? `refusée (${resultat.raison})` : 'non engagée';
      throw new ErreurRejeu(`Action ${index + 1} ${detail} au rejeu.`);
    }
    if (!memesTirages(resultat.tirages, entree.tirages)) throw new ErreurRejeu(`Action ${index + 1} : tirages divergents au rejeu.`);
    partie = resultat.partie;
    etapes.push(resultat.evenements);
  });
  return { partie, etapes };
}

export function empreinteEtat(etat: EtatPartie): string {
  return empreinte(etat);
}

/** Export rejouable (C-09 SP-04) ; ne modifie pas la partie (SP-05). */
export function exporter(monde: DefMonde, partie: Partie, commentaire?: string): ExportPartie {
  const base = { ...partie.enregistrement, observation: observer(monde, partie.etat), empreinte: empreinteEtat(partie.etat) };
  return commentaire === undefined || commentaire === '' ? base : { ...base, commentaire };
}

function exiger(condition: boolean, message: string): asserts condition {
  if (!condition) throw new ErreurRejeu(message);
}

/** Valide la forme d'un enregistrement venu de l'extérieur (fichier, stockage). */
export function lireEnregistrement(donnees: unknown): Enregistrement {
  exiger(typeof donnees === 'object' && donnees !== null, 'Enregistrement illisible.');
  const { format, version, monde, graine, actions } = donnees as Record<string, unknown>;
  exiger(format === FORMAT_ENREGISTREMENT, `Format ${String(format)} non pris en charge.`);
  exiger(typeof version === 'string' && typeof monde === 'string', 'Version ou monde manquant.');
  exiger(graineValide(graine), 'Graine invalide.');
  exiger(Array.isArray(actions), 'Liste des actions manquante.');
  const entrees = actions.map((entree: unknown, index): EntreeJournal => {
    exiger(typeof entree === 'object' && entree !== null, `Action ${index + 1} illisible.`);
    const { commande, tirages } = entree as Record<string, unknown>;
    exiger(estCommande(commande), `Action ${index + 1} : commande illisible.`);
    exiger(Array.isArray(tirages) && tirages.every((tirage) => Number.isInteger(tirage)), `Action ${index + 1} : tirages illisibles.`);
    return { commande: { action: commande.action, cible: commande.cible }, tirages: tirages as number[] };
  });
  return { format: FORMAT_ENREGISTREMENT, version, monde, graine, actions: entrees };
}

export function lireExport(donnees: unknown): ExportPartie {
  const enregistrement = lireEnregistrement(donnees);
  const { observation, empreinte: trace, commentaire } = donnees as Record<string, unknown>;
  exiger(typeof trace === 'string', 'Empreinte manquante.');
  exiger(typeof observation === 'object' && observation !== null, 'Observation manquante.');
  exiger(commentaire === undefined || typeof commentaire === 'string', 'Commentaire illisible.');
  const base = { ...enregistrement, observation: observation as Observation, empreinte: trace };
  return commentaire === undefined ? base : { ...base, commentaire };
}

/** Reprend une partie sauvegardée en la rejouant : un état sauvegardé qui diverge est refusé. */
export function reprendrePartie(monde: DefMonde, donnees: unknown, version: string): Partie {
  exiger(typeof donnees === 'object' && donnees !== null, 'Sauvegarde illisible.');
  const { enregistrement, etat } = donnees as Record<string, unknown>;
  exiger(typeof etat === 'object' && etat !== null, 'État sauvegardé manquant.');
  const { partie } = rejouer(monde, lireEnregistrement(enregistrement), version);
  exiger(empreinte(etat) === empreinteEtat(partie.etat), 'Sauvegarde incohérente avec son journal.');
  return partie;
}
