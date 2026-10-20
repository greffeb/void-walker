// Intro de NOUVELLE PARTIE (12 §4.1 bis, #200, D-305 à D-309) : un vieux terminal démarre, des stations défilent et s'arrêtent sur
// une silhouette voilée, puis la station tirée est prête. Elle montre au joueur non briefé que la station change à chaque partie,
// sans rien en dévoiler. Ce module en fixe le texte et le rythme ; l'écran est dans `EcranIntro.tsx`.

import type { DefMonde, RectPlan } from '../engine';
import type { EntreeMonde, Refus } from '../content';

/** Ce que l'intro demande au lancement : le catalogue et le hasard de l'appareil. */
export interface Intro {
  /** Nombre de stations publiées : « Station 372 sur 600 ». */
  readonly total: number;
  /** Rang de la station dans le catalogue publié, de 1 à `total` ; `null` pour un monde fixe (AR-01, monde de test, `?monde=`). */
  numero(idMonde: string): number | null;
  /** Plan d'une station publiée tirée au hasard, pour le défilé ; `null` si le tirage n'a pas de plan. */
  plan(): readonly RectPlan[] | null;
  /** Hasard de l'intro, de 0 (compris) à 1 (exclu) ; sans lien avec celui de la partie (AP-02). */
  readonly hasard: () => number;
  /** Le téléphone demande moins d'animations : l'intro s'affiche d'emblée finie. */
  mouvementReduit(): boolean;
}

export interface DependancesIntro {
  readonly compositions: readonly string[];
  readonly construire: (composition: string, graine: number) => EntreeMonde | Refus;
  readonly hasard: () => number;
  readonly mouvementReduit: () => boolean;
}

/** Composition d'une station tirée : son identifiant sans la graine du plan (`m01-m03-reserve-5` → `m01-m03-reserve`). */
export function compositionDe(idMonde: string): string {
  const tiret = idMonde.lastIndexOf('-');
  return tiret < 0 ? idMonde : idMonde.slice(0, tiret);
}

export function numeroDe(compositions: readonly string[], idMonde: string): number | null {
  if (!/-\d+$/.test(idMonde)) return null;
  const rang = compositions.indexOf(compositionDe(idMonde));
  return rang < 0 ? null : rang + 1;
}

/** Rectangles des pièces dessinées d'un monde. */
export function planDe(monde: DefMonde): RectPlan[] {
  return monde.pieces.flatMap((piece) => (piece.plan === undefined ? [] : [piece.plan]));
}

export function creerIntro(deps: DependancesIntro): Intro {
  const { compositions, hasard } = deps;
  return {
    total: compositions.length,
    numero: (idMonde) => numeroDe(compositions, idMonde),
    plan: () => {
      const composition = compositions[Math.floor(hasard() * compositions.length)];
      if (composition === undefined) return null;
      const entree = deps.construire(composition, Math.floor(hasard() * 1000));
      return 'refus' in entree ? null : planDe(entree.monde);
    },
    hasard,
    mouvementReduit: deps.mouvementReduit,
  };
}

/* ---------- Texte (D-306, textes d'exemple validés sur maquette) ---------- */

/** Démarrage du terminal, tel que le porteur l'a écrit (D-306). */
export const COMMANDE_BOOT = 'boot -a --v';
export const CHARGEMENT = ['Loading terminal system...', 'ready'] as const;
export const COMMANDE_CAMPAGNE = 'campaign_mode; console_log(01);';

export interface LigneIntro {
  readonly libelle: string;
  readonly valeur: string;
}

const avant: readonly LigneIntro[] = [
  { libelle: 'Section de départ', valeur: 'ok' },
  { libelle: 'Sections de passage', valeur: 'ok' },
  { libelle: 'Section finale', valeur: 'ok' },
];

const apres: readonly LigneIntro[] = [
  { libelle: 'Arrimage de la capsule', valeur: 'ok' },
  { libelle: 'Vérification de la sortie', valeur: 'ok' },
];

/** Textes d'ambiance : trois au hasard à chaque tirage (D-306) ; certains portent une valeur tirée. */
export const AMBIANCE: readonly ((hasard: () => number) => LigneIntro)[] = [
  () => ({ libelle: 'Pressurisation des coursives', valeur: 'ok' }),
  (hasard) => ({ libelle: 'Éclairage de secours', valeur: `${12 + Math.floor(hasard() * 60)} %` }),
  () => ({ libelle: 'Purge des conduits', valeur: 'ok' }),
  (hasard) => ({ libelle: 'Recyclage de l’air', valeur: `${40 + Math.floor(hasard() * 45)} %` }),
  () => ({ libelle: 'Calibrage des capteurs', valeur: 'ok' }),
  () => ({ libelle: 'Contrôle des joints', valeur: 'ok' }),
  () => ({ libelle: 'Horloge de bord', valeur: 'dérive' }),
  () => ({ libelle: 'Réchauffage du vestibule', valeur: 'ok' }),
  () => ({ libelle: 'Recherche de survivants', valeur: '1' }),
  () => ({ libelle: 'Balise de détresse', valeur: 'muette' }),
  () => ({ libelle: 'Gravité artificielle', valeur: 'ok' }),
  () => ({ libelle: 'Journal de bord', valeur: 'illisible' }),
  () => ({ libelle: 'Équipage à bord', valeur: '?' }),
];

/** Dernière ligne, en rouge, avec le triangle des dangers (D-233, D-306). */
export const MENACE = 'ERREUR : Menace détectée';
export const SUITE = 'La prochaine partie en tirera une autre.';

export const tirage = (total: number): string => `Tirage parmi ${total} stations…`;
export const prete = (numero: number): string => `Station ${numero} prête`;

/** Un pas irrégulier entre deux lignes (D-306) : rafales rapides, pas ordinaires, quelques temps de traitement plus longs. */
export function pasLigne(hasard: () => number): number {
  const jet = hasard();
  if (jet < 0.3) return 25 + Math.floor(hasard() * 35);
  if (jet < 0.8) return 80 + Math.floor(hasard() * 100);
  return 240 + Math.floor(hasard() * 160);
}

/** Lignes de génération d'un tirage, avec le délai qui suit chacune, en millisecondes. */
export function lignesDuTirage(hasard: () => number): readonly (LigneIntro & { readonly pas: number })[] {
  const restantes = [...AMBIANCE];
  const ambiance: LigneIntro[] = [];
  for (let i = 0; i < 3 && restantes.length > 0; i += 1) {
    const [choisie] = restantes.splice(Math.floor(hasard() * restantes.length), 1);
    if (choisie !== undefined) ambiance.push(choisie(hasard));
  }
  return [...avant, ...ambiance, ...apres].map((ligne) => ({ ...ligne, pas: pasLigne(hasard) }));
}

/* ---------- Rythme (D-307) : démarrage complet à chaque intro, en millisecondes ---------- */

export const RYTHME = {
  /** Écran noir avant la mise sous tension. */
  noir: 700,
  /** Ouverture du faisceau en écran. */
  allumage: 650,
  frappeMachine: 38,
  apresBoot: 350,
  apresChargement: 1400,
  frappeClavier: 42,
  avantSaut: 300,
  apresSaut: 120,
  /** Défilé des stations : premier pas, ralentissement à chaque pas, durée totale. */
  defile: { premier: 55, ralentir: 1.12, duree: 2400 },
  apresArret: 500,
  avantMenace: 450,
  apresMenace: 700,
  avantBouton: 400,
} as const;
