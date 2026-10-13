// Anti-abus du service (RP-03, D-095) : délai, nombre et doublons, appliqués ici en plus du jeu.
// Un seul objet durable tient l'état : les demandes y passent une à une, une rafale ne peut pas se glisser entre deux lectures.

export interface Limites {
  /** Délai minimal entre deux rapports d'un même appareil. */
  readonly delaiMs: number;
  readonly parHeure: number;
  readonly parJour: number;
  /** Plafond de tout le service, pour que le dépôt ne soit jamais noyé. */
  readonly globalParJour: number;
  /** Durée pendant laquelle un rapport identique est reconnu comme doublon. */
  readonly doublonMs: number;
}

export const LIMITES: Limites = {
  delaiMs: 20_000,
  parHeure: 6,
  parJour: 20,
  globalParJour: 100,
  doublonMs: 24 * 3_600_000,
};

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;

/** Rapport réservé dont l'envoi à GitHub n'a pas abouti à temps : il ne bloque plus un nouvel essai. */
const RESERVATION_MS = 60_000;

export interface EtatGarde {
  /** Envois acceptés par appareil (adresse hachée), horodatés. */
  readonly appareils: Readonly<Record<string, readonly number[]>>;
  readonly global: readonly number[];
  /** Empreinte d'un rapport → moment et adresse publiée ; `null` tant que GitHub n'a pas répondu. */
  readonly rapports: Readonly<Record<string, { readonly t: number; readonly adresse: string | null }>>;
}

export const ETAT_VIDE: EtatGarde = { appareils: {}, global: [], rapports: {} };

export type Decision =
  | { readonly type: 'accepte' }
  | { readonly type: 'doublon'; readonly adresse: string | null }
  | { readonly type: 'trop'; readonly apresMs: number };

/** Retire tout ce qui ne compte plus : l'état reste petit sans tâche de nettoyage. */
export function elaguer(etat: EtatGarde, maintenant: number, limites: Limites = LIMITES): EtatGarde {
  const appareils: Record<string, readonly number[]> = {};
  for (const [appareil, moments] of Object.entries(etat.appareils)) {
    const recents = moments.filter((t) => maintenant - t < JOUR);
    if (recents.length > 0) appareils[appareil] = recents;
  }
  const rapports: Record<string, { readonly t: number; readonly adresse: string | null }> = {};
  for (const [cle, rapport] of Object.entries(etat.rapports)) {
    const vivant = rapport.adresse === null ? maintenant - rapport.t < RESERVATION_MS : maintenant - rapport.t < limites.doublonMs;
    if (vivant) rapports[cle] = rapport;
  }
  return { appareils, global: etat.global.filter((t) => maintenant - t < JOUR), rapports };
}

/**
 * Décide d'un rapport et le réserve s'il est accepté. Un doublon passe avant les limites : renvoyer un rapport déjà
 * publié (réponse perdue en route) ne coûte rien et rend son adresse.
 */
export function reserver(
  etatInitial: EtatGarde,
  appareil: string,
  empreinte: string,
  maintenant: number,
  limites: Limites = LIMITES,
): { readonly etat: EtatGarde; readonly decision: Decision } {
  const etat = elaguer(etatInitial, maintenant, limites);
  const connu = etat.rapports[empreinte];
  if (connu !== undefined) return { etat, decision: { type: 'doublon', adresse: connu.adresse } };

  const moments = etat.appareils[appareil] ?? [];
  const attentes: number[] = [];
  const dernier = moments.at(-1);
  if (dernier !== undefined && maintenant - dernier < limites.delaiMs) attentes.push(dernier + limites.delaiMs - maintenant);
  const dansLHeure = moments.filter((t) => maintenant - t < HEURE);
  if (dansLHeure.length >= limites.parHeure) attentes.push((dansLHeure[dansLHeure.length - limites.parHeure] ?? maintenant) + HEURE - maintenant);
  if (moments.length >= limites.parJour) attentes.push((moments[moments.length - limites.parJour] ?? maintenant) + JOUR - maintenant);
  if (etat.global.length >= limites.globalParJour) {
    attentes.push((etat.global[etat.global.length - limites.globalParJour] ?? maintenant) + JOUR - maintenant);
  }
  if (attentes.length > 0) return { etat, decision: { type: 'trop', apresMs: Math.max(1000, ...attentes) } };

  return {
    etat: {
      appareils: { ...etat.appareils, [appareil]: [...moments, maintenant] },
      global: [...etat.global, maintenant],
      rapports: { ...etat.rapports, [empreinte]: { t: maintenant, adresse: null } },
    },
    decision: { type: 'accepte' },
  };
}

/** GitHub a publié le rapport : son adresse est rendue aux doublons. */
export function confirmer(etat: EtatGarde, empreinte: string, adresse: string, maintenant: number): EtatGarde {
  return { ...etat, rapports: { ...etat.rapports, [empreinte]: { t: maintenant, adresse } } };
}

/** GitHub a refusé ou n'a pas répondu : le rapport pourra être renvoyé, l'envoi ne compte pas dans les limites. */
export function liberer(etat: EtatGarde, appareil: string, empreinte: string, moment: number): EtatGarde {
  const rapports = Object.fromEntries(Object.entries(etat.rapports).filter(([cle]) => cle !== empreinte));
  const sansMoment = (moments: readonly number[]): number[] => {
    const index = moments.lastIndexOf(moment);
    return index === -1 ? [...moments] : [...moments.slice(0, index), ...moments.slice(index + 1)];
  };
  return {
    appareils: { ...etat.appareils, [appareil]: sansMoment(etat.appareils[appareil] ?? []) },
    global: sansMoment(etat.global),
    rapports,
  };
}
