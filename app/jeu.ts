import { apercu, exporter, historique, jouer, nouvellePartie, observer, reprendrePartie, type DefMonde, type OptionMenu, type Partie } from '../engine';
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

/** Lecture seule utilisée à l'accueil : l'absence de sauvegarde ne crée pas de partie (C-09 §2). */
export async function sauvegardePresente(env: Pick<Environnement, 'stockage'>): Promise<boolean> {
  return (await env.stockage.lire()) !== null;
}

/** Reprend la partie enregistrée au dernier geste, ou en commence une si rien n'est enregistré. */
export async function demarrer(env: Environnement): Promise<Demarrage> {
  const charge = await charger(env);
  return charge.type === 'absente' ? { type: 'pret', jeu: await commencer(env) } : charge;
}

/** Lit la partie enregistrée sans jamais en créer : `absente` si rien n'est enregistré. */
export async function charger(env: Environnement): Promise<Demarrage | { readonly type: 'absente' }> {
  let donnees: unknown;
  try {
    donnees = await env.stockage.lire();
  } catch (erreur) {
    // Ne jamais écraser une sauvegarde qu'on n'a pas pu lire : le joueur décide.
    return { type: 'reprise_impossible', raison: `Lecture de la sauvegarde impossible : ${erreur instanceof Error ? erreur.message : String(erreur)}` };
  }
  if (donnees === null) return { type: 'absente' };
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

/** Message de l'historique d'IA Station (12 §3.9) : son identifiant, son repère de moment sans heure, puis le texte. */
export interface MessageAffiche {
  readonly message: string;
  readonly repere: string;
  readonly texte: string;
}

/** Messages reçus, du plus ancien au plus récent ; seulement ceux déjà reçus, aucune réponse d'état (C-06 K-06). */
export function historiqueAffiche(env: Pick<Environnement, 'monde' | 'textes'>, partie: Partie): MessageAffiche[] {
  return historique(env.monde, partie.etat).map(({ message, moment }) => ({
    message,
    repere: rendreMoment(env.textes, moment),
    texte: texteAssistance(env.textes, message),
  }));
}

/** Partie à laquelle se rapportent les messages lus : une autre partie les ignore. */
function partieDesLus(partie: Partie): { readonly monde: string; readonly graine: number } {
  return { monde: partie.enregistrement.monde, graine: partie.enregistrement.graine };
}

/**
 * Messages déjà lus dans la fenêtre d'IA Station, par identifiant, gardés sur l'appareil à côté de la partie (12 §3.9).
 * Illisibles, absents ou d'une autre partie : aucun.
 */
export async function lireLus(env: Environnement, partie: Partie): Promise<readonly string[]> {
  try {
    const brut = await env.stockage.lireLus();
    if (typeof brut !== 'object' || brut === null) return [];
    const { monde, graine, lus } = brut as Record<string, unknown>;
    const attendue = partieDesLus(partie);
    if (monde !== attendue.monde || graine !== attendue.graine || !Array.isArray(lus)) return [];
    return lus.filter((message): message is string => typeof message === 'string');
  } catch {
    return [];
  }
}

/** Tous les messages reçus passent en lus, sans toucher à la partie ; un échec d'écriture les laisse nouveaux à la reprise. */
export async function marquerLus(env: Environnement, partie: Partie): Promise<void> {
  try {
    await env.stockage.ecrireLus({ ...partieDesLus(partie), lus: [...partie.etat.messages] });
  } catch {
    // Rien à signaler au joueur : la partie, elle, est enregistrée à part.
  }
}

/** Fichier « Télécharger ma partie » : l'export qui rejoue toute la partie (C-09 §5), sans la modifier (SP-05). */
export function fichierPartie(env: Pick<Environnement, 'monde'>, partie: Partie, maintenant: Date): { readonly nom: string; readonly contenu: string } {
  const deux = (nombre: number): string => String(nombre).padStart(2, '0');
  const date = `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}-${deux(maintenant.getHours())}${deux(maintenant.getMinutes())}`;
  return { nom: `void-walker-${partie.enregistrement.monde}-${date}.json`, contenu: `${JSON.stringify(exporter(env.monde, partie), null, 2)}\n` };
}

/** Abandon (C-08 §4) : la partie et ses messages lus quittent l'appareil ; `false` si le stockage a refusé. */
export async function abandonner(env: Pick<Environnement, 'stockage'>): Promise<boolean> {
  try {
    await env.stockage.effacer();
    return true;
  } catch {
    return false;
  }
}

/** Monde joué : celui demandé par `?monde=` s'il existe, sinon le monde par défaut ; un identifiant inconnu est ignoré. */
export function mondeDemande(recherche: string, mondes: Readonly<Record<string, EntreeMonde>>, parDefaut: string): string {
  const demande = new URLSearchParams(recherche).get('monde');
  return demande !== null && Object.hasOwn(mondes, demande) ? demande : parDefaut;
}
