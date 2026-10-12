import { apercu, historique, jouer, nouvellePartie, observer, reprendrePartie, type DefMonde, type OptionMenu, type Partie } from '../engine';
import { raconter, raconterDerniers, rendreApercu, rendreAssistance, rendreMoment, texteAssistance, type ApercuTexte, type EntreeMonde, type TextesMonde } from '../content';
import { rappelDe, rappelRepris, texteRappel, type TexteRappel } from './ecran';
import type { Stockage } from './sauvegarde';

// Logique de l'écran, sans React : démarrer, reprendre, jouer, sauvegarder honnêtement (C-09 §2-§3).

export type EtatSauvegarde = 'sauvegardee' | 'echec';

export interface Jeu {
  readonly partie: Partie;
  readonly recit: readonly string[];
  /** Rappel de la dernière action choisie, en tête du récit ; `null` au début de la partie. */
  readonly rappel: TexteRappel | null;
  /** Paroles d'IA Station reçues à ce pas, après le récit (12 §3.3) ; aucune après un refus ou une consultation. */
  readonly assistance: readonly string[];
  readonly sauvegarde: EtatSauvegarde;
}

export type Demarrage = { readonly type: 'pret'; readonly jeu: Jeu } | { readonly type: 'reprise_impossible'; readonly raison: string };

export interface Environnement {
  readonly monde: DefMonde;
  readonly textes: TextesMonde;
  readonly version: string;
  readonly stockage: Stockage;
  readonly graine: () => number;
}

async function enregistrer(env: Environnement, partie: Partie): Promise<EtatSauvegarde> {
  try {
    await env.stockage.ecrire(JSON.parse(JSON.stringify(partie)) as unknown);
    return 'sauvegardee';
  } catch {
    return 'echec';
  }
}

export async function commencer(env: Environnement): Promise<Jeu> {
  const partie = nouvellePartie(env.monde, { version: env.version, graine: env.graine() });
  return {
    partie,
    recit: raconterDerniers(env.textes, partie),
    rappel: null,
    assistance: rendreAssistance(env.textes, partie.derniers),
    sauvegarde: await enregistrer(env, partie),
  };
}

/** Reprend la partie enregistrée au dernier geste, ou en commence une si rien n'est enregistré. */
export async function demarrer(env: Environnement): Promise<Demarrage> {
  let donnees: unknown;
  try {
    donnees = await env.stockage.lire();
  } catch (erreur) {
    // Ne jamais écraser une sauvegarde qu'on n'a pas pu lire : le joueur décide.
    return { type: 'reprise_impossible', raison: `Lecture de la sauvegarde impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}` };
  }
  if (donnees === null) return { type: 'pret', jeu: await commencer(env) };
  try {
    const partie = reprendrePartie(env.monde, donnees, env.version);
    const repris = rappelRepris(partie, observer(env.monde, partie.etat));
    const rappel = repris === null ? null : texteRappel(env.textes, repris);
    const jeu: Jeu = { partie, recit: raconterDerniers(env.textes, partie), rappel, assistance: rendreAssistance(env.textes, partie.derniers), sauvegarde: 'sauvegardee' };
    return { type: 'pret', jeu };
  } catch (erreur) {
    return { type: 'reprise_impossible', raison: erreur instanceof Error ? erreur.message : String(erreur) };
  }
}

/** Fiche d'une bulle : texte de la consultation, sans toucher à la partie, au récit ni à la sauvegarde (D-014). */
export function consulter(env: Pick<Environnement, 'monde' | 'textes'>, partie: Partie, option: OptionMenu): string[] {
  const resultat = jouer(env.monde, partie, option.commande);
  if (resultat.type === 'engagee') throw new Error(`« ${option.action} » engage le personnage : ce n’est pas une fiche.`);
  return raconter(env.textes, resultat);
}

/** Aperçu affiché : RISQUE et COÛT seulement s'ils disent autre chose que « aucun » (D-187) ; SAVOIR toujours. */
export interface ApercuAffiche extends Omit<ApercuTexte, 'risque' | 'cout'> {
  readonly risque: string | null;
  readonly cout: string | null;
}

/** Aperçu avant CONFIRMER (12 §3.8), mêmes mots que la CLI ; ne touche ni à la partie ni à la sauvegarde. */
export function prevoir(env: Pick<Environnement, 'monde' | 'textes'>, partie: Partie, option: OptionMenu): ApercuAffiche {
  const resultat = apercu(env.monde, partie, option.commande);
  if (resultat.type !== 'apercu') throw new Error(`« ${option.action} » sans aperçu : ${resultat.type === 'refus' ? resultat.raison : 'gratuit'}.`);
  const { risque, danger, cout } = resultat.apercu;
  const texte = rendreApercu(env.textes, resultat.apercu);
  return { ...texte, risque: risque === 'aucun' && danger === null ? null : texte.risque, cout: cout === 'aucun' ? null : texte.cout };
}

/** Joue la commande d'une option ; seule une action engagée écrit, et l'échec d'écriture reste signalé (C-09 §3). */
export async function jouerOption(env: Environnement, jeu: Jeu, option: OptionMenu): Promise<Jeu> {
  const resultat = jouer(env.monde, jeu.partie, option.commande);
  const recit = raconter(env.textes, resultat);
  if (resultat.type !== 'engagee') return { ...jeu, recit, rappel: texteRappel(env.textes, rappelDe(option)), assistance: [] };
  // Un déplacement se rappelle par la pièce d'arrivée, connue même quand le passage ne la nommait pas (D-147).
  const arrivee = option.action === 'aller' ? observer(env.monde, resultat.partie.etat).piece : null;
  const rappel = texteRappel(env.textes, arrivee === null ? rappelDe(option) : { type: 'deplacement', vers: arrivee });
  const assistance = rendreAssistance(env.textes, resultat.evenements);
  return { partie: resultat.partie, recit, rappel, assistance, sauvegarde: await enregistrer(env, resultat.partie) };
}

/** Message de l'historique d'IA Station (12 §3.9) : repère de moment sans heure, puis le texte. */
export interface MessageAffiche {
  readonly repere: string;
  readonly texte: string;
}

/** Messages reçus, du plus ancien au plus récent ; seulement ceux déjà reçus, aucune réponse d'état (C-06 K-06). */
export function historiqueAffiche(env: Pick<Environnement, 'monde' | 'textes'>, partie: Partie): MessageAffiche[] {
  return historique(env.monde, partie.etat).map(({ message, moment }) => ({ repere: rendreMoment(env.textes, moment), texte: texteAssistance(env.textes, message) }));
}

/** Partie à laquelle se rapportent les messages lus : une autre partie les ignore. */
function partieDesLus(partie: Partie): { readonly monde: string; readonly graine: number } {
  return { monde: partie.enregistrement.monde, graine: partie.enregistrement.graine };
}

/**
 * Nombre de messages déjà lus dans la fenêtre d'IA Station, gardé sur l'appareil à côté de la partie (12 §3.9).
 * Illisible, absent ou d'une autre partie : aucun.
 */
export async function lireLus(env: Environnement, partie: Partie): Promise<number> {
  try {
    const brut = await env.stockage.lireLus();
    if (typeof brut !== 'object' || brut === null) return 0;
    const { monde, graine, lus } = brut as Record<string, unknown>;
    const attendue = partieDesLus(partie);
    if (monde !== attendue.monde || graine !== attendue.graine || typeof lus !== 'number' || !Number.isInteger(lus) || lus < 0) return 0;
    return Math.min(lus, partie.etat.messages.length);
  } catch {
    return 0;
  }
}

/** Tous les messages reçus passent en lus, sans toucher à la partie ; un échec d'écriture les laisse nouveaux à la reprise. */
export async function marquerLus(env: Environnement, partie: Partie): Promise<void> {
  try {
    await env.stockage.ecrireLus({ ...partieDesLus(partie), lus: partie.etat.messages.length });
  } catch {
    // Rien à signaler au joueur : la partie, elle, est enregistrée à part.
  }
}

/** Monde joué : celui demandé par `?monde=` s'il existe, sinon le monde par défaut ; un identifiant inconnu est ignoré. */
export function mondeDemande(recherche: string, mondes: Readonly<Record<string, EntreeMonde>>, parDefaut: string): string {
  const demande = new URLSearchParams(recherche).get('monde');
  return demande !== null && Object.hasOwn(mondes, demande) ? demande : parDefaut;
}
