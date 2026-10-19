import { CATALOGUE, type ActionEngagee, type DefAction, type Effet } from './actions';
import { bruitDeStation } from './bruits';
import { reagir, type SonEmis } from './creature';
import { graineValide, ouvrirDes, type Des } from './des';
import { etatInitial, piecesSansAir, refPiece, type Alarme, type EtatPartie } from './etat';
import { actualiserFeu, brule, voitLaPiece, type Embrasement } from './feu';
import { actualiserFroid, type Froid } from './froid';
import { empreinte } from './hachage';
import { regarder } from './memoire';
import { indexer, type DefMonde } from './monde';
import { observer, terminee } from './observation';
import { aggraver, asphyxier, expose, intercepter, risqueIci } from './sante';
import { actualiserVide, piecesConnues, type Vide } from './vide';
import {
  ACTIONS,
  NIVEAUX_RISQUE,
  type Apercu,
  type Cause,
  type Commande,
  type Consultation,
  type Danger,
  type Evenement,
  type IdAction,
  type NiveauRisque,
  type Observation,
  type RaisonRefus,
  type Sante,
  type Savoir,
} from './vocabulaire';

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

/** Aperçu d'une commande ; une consultation est gratuite et n'en a pas besoin (D-014). */
export type ResultatApercu =
  | { readonly type: 'refus'; readonly raison: RaisonRefus }
  | { readonly type: 'gratuit' }
  | { readonly type: 'apercu'; readonly apercu: Apercu };

export interface ExportPartie extends Enregistrement {
  readonly observation: Observation;
  readonly empreinte: string;
  readonly commentaire?: string;
}

export class ErreurRejeu extends Error {
  override readonly name = 'ErreurRejeu';
}

export function nouvellePartie(monde: DefMonde, options: { readonly version: string; readonly graine: number }): Partie {
  // Au réveil, le passager voit sa pièce (14 §3.1).
  const etat = regarder(monde, etatInitial(monde, options.graine));
  return {
    enregistrement: { format: FORMAT_ENREGISTREMENT, version: options.version, monde: monde.id, graine: options.graine, actions: [] },
    etat,
    derniers: [{ type: 'reveil', piece: refPiece(monde, etat.piece) }, ...etat.messages.map((message) => ({ type: 'assistance', message }) as const)],
  };
}

/** Messages d'arrivée pas encore reçus pour la pièce où le passager finit le pas : une fois chacun. */
function messagesArrivee(monde: DefMonde, etat: EtatPartie): string[] {
  return (monde.assistance ?? [])
    .filter((message) => message.quand.type === 'arrivee' && message.quand.piece === etat.piece && !etat.messages.includes(message.id))
    .map((message) => message.id);
}

function messagesEvacuation(monde: DefMonde, etat: EtatPartie): string[] {
  return (monde.assistance ?? []).filter((message) => message.quand.type === 'evacuation' && !etat.messages.includes(message.id)).map((message) => message.id);
}

/** Attentes de suite qui déclenchent le message de patience (#225). */
const ATTENTES_PATIENCE = 15;

/** Message de patience, une fois : à la 15e attente de suite dont l'attente est le seul événement (#225). */
function messagesPatience(monde: DefMonde, partie: Partie, commande: Commande, evenements: readonly Evenement[]): string[] {
  if (commande.action !== 'attendre' || evenements.length !== 1 || evenements[0]?.type !== 'attente') return [];
  const precedentes = partie.enregistrement.actions.slice(-(ATTENTES_PATIENCE - 1));
  if (precedentes.length < ATTENTES_PATIENCE - 1 || precedentes.some((entree) => entree.commande.action !== 'attendre')) return [];
  return (monde.assistance ?? []).filter((message) => message.quand.type === 'patience' && !partie.etat.messages.includes(message.id)).map((message) => message.id);
}

function estCommande(valeur: unknown): valeur is Commande {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const { action, cible, parametre } = valeur as Record<string, unknown>;
  return typeof action === 'string' && typeof cible === 'string' && (parametre === undefined || typeof parametre === 'string');
}

function estAction(action: string): action is IdAction {
  return (ACTIONS as readonly string[]).includes(action);
}

type Validation =
  | { readonly type: 'refus'; readonly raison: RaisonRefus }
  | {
      readonly type: 'valide';
      readonly commande: Commande;
      readonly definition: DefAction;
      readonly cible: string;
      readonly parametre: string | undefined;
    };

/** Revérifie une commande dans l'état courant (C-01 §4) : une commande périmée est refusée, son paramètre aussi. */
function valider(monde: DefMonde, etat: EtatPartie, commande: unknown): Validation {
  if (!estCommande(commande)) return { type: 'refus', raison: 'commande_invalide' };
  if (terminee(etat)) return { type: 'refus', raison: 'partie_terminee' };
  if (!estAction(commande.action)) return { type: 'refus', raison: 'action_inconnue' };
  const { versInterne } = indexer(monde);
  const cible = versInterne.get(commande.cible);
  if (cible === undefined) return { type: 'refus', raison: 'cible_absente' };
  const definition = CATALOGUE[commande.action];
  const raison = definition.verifier({ monde, etat }, cible);
  if (raison !== null) return { type: 'refus', raison };
  const possibles = definition.engage ? definition.parametres?.({ monde, etat }, cible) : undefined;
  if (possibles === undefined) {
    if (commande.parametre !== undefined) return { type: 'refus', raison: 'commande_invalide' };
    return { type: 'valide', commande: { action: commande.action, cible: commande.cible }, definition, cible, parametre: undefined };
  }
  const parametre = commande.parametre === undefined ? undefined : versInterne.get(commande.parametre);
  if (commande.parametre === undefined || parametre === undefined || !possibles.includes(parametre)) return { type: 'refus', raison: 'parametre_absent' };
  return {
    type: 'valide',
    commande: { action: commande.action, cible: commande.cible, parametre: commande.parametre },
    definition,
    cible,
    parametre,
  };
}

/** Effet simulé sans dé (aperçu, et vide à venir dans `jouer`) : aucune règle d'effet n'en tire, seul le jet d'interception, à part. */
const SANS_DES: Des = {
  lancer: () => {
    throw new Error('Aucun dé dans un effet simulé.');
  },
};

/**
 * Étape 3 d'un pas (C-03 §3) : l'air d'abord — le vide éteint les foyers qu'il atteint et neutralise la créature exposée —,
 * puis le feu, qui ne gagne pas une pièce sans air (C-03 §5.3, §5.4, MX-02), puis le froid (C-03 §5.5, C-04 §3.2).
 */
function mettreAJourDangers(
  monde: DefMonde,
  avant: EtatPartie,
  effet: Effet,
): { vide: Vide; feu: { etat: EtatPartie; evenements: Evenement[]; gagnees: Embrasement[] }; froid: Froid } {
  const vide = actualiserVide(monde, avant, effet.etat);
  const feu = actualiserFeu(monde, vide.etat, vide.sansAir);
  return { vide, feu, froid: actualiserFroid(monde, avant, feu.etat) };
}

interface Simulation {
  readonly avant: EtatPartie;
  readonly vide: Vide;
  readonly feu: { readonly etat: EtatPartie; readonly gagnees: readonly Embrasement[] };
  readonly froid: Froid;
  /** Liaison que le passager franchira. */
  readonly franchie: string | undefined;
}

/**
 * Brûlure connue (D-188) : l'action finira dans une pièce en feu que le passager voit déjà, ou que le feu gagnera depuis un
 * foyer qu'il voit (C-03 §5.3, C-06 §4). Certaine, sans dé ; mortelle s'il est critique.
 */
function feuConnu(monde: DefMonde, { avant: etat, feu }: Simulation, sante: Sante): { risque: NiveauRisque; danger: Danger } | null {
  const { etat: apres, gagnees } = feu;
  if (!brule(apres)) return null;
  const piece = apres.piece;
  const venues = gagnees.filter((gagnee) => gagnee.piece === piece);
  // Déjà en feu : il voit la pièce. Gagnée pendant ce pas : seulement par un passage de sa pièce, qu'il voit (C-06 §4).
  const connu =
    venues.length === 0
      ? voitLaPiece(monde, etat, piece)
      : venues.some((venue) => indexer(monde).liaisons.get(venue.liaison)?.entre.includes(etat.piece) === true);
  if (!connu) return null;
  return { risque: 'certain', danger: { type: sante === 'critique' ? 'brulure_mortelle' : 'brulure' } };
}

/**
 * Vide connu (C-04 §3.1) : l'action finira sans combinaison dans une pièce sans air, ce que disent les voyants des portes
 * étanches (VP-03) ; « mortel ».
 */
function videConnu({ vide }: Simulation): { risque: NiveauRisque; danger: Danger } | null {
  return vide.asphyxie ? { risque: 'mortel', danger: { type: 'asphyxie' } } : null;
}

/** Gelure connue (D-240) : le passager sait depuis combien d'actions il est dans la chambre froide. Certaine, mortelle s'il est critique. */
function froidConnu({ froid }: Simulation, sante: Sante): { risque: NiveauRisque; danger: Danger } | null {
  return froid.gelure ? { risque: 'certain', danger: { type: sante === 'critique' ? 'froid_mortel' : 'froid' } } : null;
}

/** Pièces connues qui perdront ou retrouveront leur air (VP-02) ; jamais l'effet sur une créature non perçue. */
function airConnu(monde: DefMonde, { avant, vide }: Simulation): Savoir[] {
  const precedent = piecesSansAir(monde, avant);
  const connues = piecesConnues(monde, avant);
  const perdront = vide.sansAir.filter((piece) => !precedent.includes(piece) && connues.includes(piece));
  const retrouveront = precedent.filter((piece) => !vide.sansAir.includes(piece) && connues.includes(piece));
  return [
    ...(perdront.length === 0 ? [] : [{ type: 'perdront_air', pieces: perdront.map((piece) => refPiece(monde, piece)) } as const]),
    ...(retrouveront.length === 0 ? [] : [{ type: 'retrouveront_air', pieces: retrouveront.map((piece) => refPiece(monde, piece)) } as const]),
  ];
}

function simuler(monde: DefMonde, etat: EtatPartie, definition: ActionEngagee, cible: string, parametre: string | undefined): Simulation {
  const effet = definition.appliquer({ monde, etat }, cible, SANS_DES, parametre);
  return { avant: etat, franchie: effet.franchie, ...mettreAJourDangers(monde, etat, effet) };
}

/** Sous ses yeux, sauf si le vide l'atteint à ce pas : elle n'agit plus, ni jet ni menace (C-03 §5.4, D-071, D-194). */
function exposeCePas({ avant, vide, franchie }: Simulation): boolean {
  return expose(avant, franchie) && vide.etat.creature?.neutralisee === undefined;
}

/** Aperçu avant confirmation (C-01 §5, C-06 §4) : sans effet sur la partie ni sur les dés. */
export function apercu(monde: DefMonde, partie: Partie, commande: unknown): ResultatApercu {
  const validation = valider(monde, partie.etat, commande);
  if (validation.type === 'refus') return validation;
  const { definition, cible, parametre } = validation;
  if (!definition.engage) return { type: 'gratuit' };
  const { santeApres, ...prevision } = definition.prevoir({ monde, etat: partie.etat }, cible, parametre);
  const sante = santeApres ?? partie.etat.sante;
  const simulation = simuler(monde, partie.etat, definition, cible, parametre);
  // Le danger le plus haut l'emporte : la créature ici avant celui de la destination, le feu, le froid et le vide avant tout ; un
  // soin passe avant le jet (C-04 §3, §4.3).
  let retenu: { risque: NiveauRisque; danger: Danger | null } = prevision;
  const dangers = [
    exposeCePas(simulation) ? risqueIci(partie.etat, sante, simulation.franchie) : null,
    feuConnu(monde, simulation, sante),
    froidConnu(simulation, sante),
    videConnu(simulation),
  ];
  for (const autre of dangers) {
    if (autre !== null && NIVEAUX_RISQUE.indexOf(autre.risque) >= NIVEAUX_RISQUE.indexOf(retenu.risque)) retenu = autre;
  }
  const savoir = [...prevision.savoir, ...airConnu(monde, simulation)];
  return { type: 'apercu', apercu: { commande: validation.commande, ...prevision, ...retenu, savoir } };
}

/**
 * Son fort d'une alarme en cours (C-03 §5.1, D-234) : celui d'un avertisseur, depuis sa pièce ou l'alcôve de sa pièce, ou la
 * relance des machines, depuis leur salle, qu'elle seule peut quitter (D-163).
 */
function sonAlarme(monde: DefMonde, alarme: Alarme): SonEmis {
  const objet = indexer(monde).objets.get(alarme.objet);
  if (objet?.avertisseur !== undefined) {
    return { piece: objet.avertisseur.piece, intensite: 'fort', ...(objet.avertisseur.alcove === true ? { alcove: true } : {}) };
  }
  if (objet?.machines !== undefined) return { piece: objet.machines, intensite: 'fort', relance: true };
  throw new Error(`Alarme inconnue : ${alarme.objet}.`);
}

/** Une réaction de plus couverte par chaque son ; une alarme se termine après sa dernière (C-03 §5.1, T-04). */
function decompter(etat: EtatPartie): EtatPartie {
  if (etat.alarmes.length === 0) return etat;
  return { ...etat, alarmes: etat.alarmes.map((alarme) => ({ ...alarme, restant: alarme.restant - 1 })).filter((alarme) => alarme.restant > 0) };
}

/** Joue une commande structurée ; un refus ou une consultation rend la partie inchangée (C-01 §6, C-03 §2). */
export function jouer(monde: DefMonde, partie: Partie, commande: unknown, des?: Des): Resultat {
  const validation = valider(monde, partie.etat, commande);
  if (validation.type === 'refus') return { ...validation, partie };
  const { definition, cible, parametre } = validation;
  const contexte = { monde, etat: partie.etat };
  if (!definition.engage) return { type: 'consultation', consultation: definition.consulter(contexte, cible), partie };

  const session = ouvrirDes(partie.etat.generateur, des);
  // Sous ses yeux, l'interception se résout avant le changement de position (C-03 §3 étape 2, C-04 §4.2) ; pas si le vide
  // l'atteint à ce pas, ce que l'effet simulé sans dé suffit à dire.
  const exposition = exposeCePas(simuler(monde, partie.etat, definition, cible, parametre));
  const atteint = exposition && intercepter(session.des);
  const effet = definition.appliquer(contexte, cible, session.des, parametre);
  // Étape 3 : le vide, puis le feu, puis le froid ; la brûlure de qui finit l'action dans une pièce en feu (C-03 §5.3, §5.4, D-188),
  // la gelure de qui la finit dans la chambre froide au-delà de deux actions (D-240).
  const { vide, feu, froid } = mettreAJourDangers(monde, partie.etat, effet);
  const brulure = brule(froid.etat);
  // Étape 4 : une réaction au plus, avec les sons des alarmes en cours puis ceux de l'action, plus récents (C-03 §3, §4.2, §5.1).
  // Alertée, la créature entend les pas du passager qui change de pièce, et son souffle tant qu'elle écoute encore (D-276).
  const alertee = froid.etat.creature?.contact === true;
  const genre = effet.franchie !== undefined ? 'pas' : (froid.etat.creature?.ecoute ?? 0) > 0 ? 'souffle' : undefined;
  const pas: readonly SonEmis[] = alertee && genre !== undefined ? [{ piece: froid.etat.piece, intensite: 'normal', pas: genre }] : [];
  const sons = [...froid.etat.alarmes.map((alarme) => sonAlarme(monde, alarme)), ...(effet.sons ?? []), ...pas];
  const reponse = reagir(monde, froid.etat, sons, partie.etat.piece, effet.franchie, exposition);
  const causes: Cause[] = [
    ...(atteint ? (['griffes'] as const) : []),
    ...(brulure ? (['feu'] as const) : []),
    ...(froid.gelure ? (['froid'] as const) : []),
  ];
  // Sans combinaison dans une pièce sans air : vaincu, hors plafond (C-04 §3.1).
  const blessure = vide.asphyxie ? asphyxier(decompter(reponse.etat), causes) : aggraver(decompter(reponse.etat), causes);
  const menace: readonly Evenement[] = exposition && !atteint ? [{ type: 'menace' }] : [];
  const coups = blessure.evenements;
  // En fuite, elle frappe au seuil, avant le déplacement ; la brûlure se raconte avec le feu ; une défaite se raconte en dernier
  // (C-04 §4.2, C-03 §3).
  const vaincu = blessure.etat.sante === 'vaincu';
  const auSeuil = effet.franchie !== undefined && !vaincu;
  const coupsAuSeuil = auSeuil && atteint && !brulure;
  const coupsAvecLeFeu = !vaincu && brulure;
  const evenements = [
    ...(auSeuil ? menace : []),
    ...(coupsAuSeuil ? coups : []),
    ...effet.evenements,
    ...vide.evenements,
    ...feu.evenements,
    ...(coupsAvecLeFeu ? coups : []),
    ...reponse.evenements,
    ...(auSeuil ? [] : menace),
    ...(coupsAuSeuil || coupsAvecLeFeu ? [] : coups),
  ];
  // Étape 5 : messages d'arrivée, puis conclusion ; une défaite l'emporte sur le départ de la capsule.
  let conclu: EtatPartie = blessure.etat;
  if (!vaincu) {
    const arrivees = [...messagesArrivee(monde, conclu), ...messagesPatience(monde, partie, validation.commande, evenements)];
    conclu = { ...conclu, messages: [...conclu.messages, ...arrivees] };
    evenements.push(...arrivees.map((message) => ({ type: 'assistance', message }) as const));
    if (effet.evacuation !== undefined) {
      const depart = messagesEvacuation(monde, conclu);
      conclu = { ...conclu, fin: 'evacuation', messages: [...conclu.messages, ...depart] };
      evenements.push({ type: 'evacuation', sources: effet.evacuation }, ...depart.map((message) => ({ type: 'assistance', message }) as const));
    }
  }
  // Grande station : avant la rencontre, un bruit de station de temps en temps (spec 2026-10-18 §5.5) ; rien dans l'état.
  if (monde.bruitsStation === true && !vaincu && conclu.fin === null && conclu.creature?.contact !== true && bruitDeStation(partie.enregistrement.graine, partie.etat.actions + 1)) {
    evenements.push({ type: 'bruit_station' });
  }
  const tirages = [...session.tirages];
  // Le regard de fin d'action met à jour la mémoire du passager, avec le compte d'actions confirmées (14 §3.1).
  const etat: EtatPartie = regarder(monde, { ...conclu, actions: partie.etat.actions + 1, generateur: session.etatFinal() });
  const entree: EntreeJournal = { commande: validation.commande, tirages };
  return {
    type: 'engagee',
    evenements,
    tirages,
    partie: {
      enregistrement: { ...partie.enregistrement, actions: [...partie.enregistrement.actions, entree] },
      etat,
      derniers: evenements,
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
    const { action, cible, parametre } = commande;
    return { commande: { action, cible, ...(parametre === undefined ? {} : { parametre }) }, tirages: tirages as number[] };
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
