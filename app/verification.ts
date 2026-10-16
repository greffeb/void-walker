// État de la vérification automatique d'une version de test (#180). La version de test est publiée dès le début de la CI,
// avant la fin de la vérification ; la CI dépose à côté d'elle `verification.json` : « en cours » à la publication, puis
// « verte » ou « en échec » quand tous ses jobs ont fini.

export type EtatVerification = 'en_cours' | 'verte' | 'echec' | 'inconnue';

export const FICHIER_VERIFICATION = 'verification.json';

/** Contenu de `verification.json` : le commit vérifié et son état. */
export interface FichierVerification {
  readonly commit: string;
  readonly etat: Exclude<EtatVerification, 'inconnue'>;
}

const ETATS: readonly string[] = ['en_cours', 'verte', 'echec'];

/** État lu pour `commit` ; un fichier absent, illisible ou d'un autre commit donne « inconnue ». */
export function interpreterVerification(contenu: unknown, commit: string): EtatVerification {
  if (typeof contenu !== 'object' || contenu === null) return 'inconnue';
  const { commit: verifie, etat } = contenu as Record<string, unknown>;
  if (typeof etat !== 'string' || !ETATS.includes(etat) || commit === '' || verifie !== commit) return 'inconnue';
  return etat as EtatVerification;
}

/** Lit `verification.json` à l'adresse de la version de test, sans cache : l'état change pendant que l'on joue. */
export async function lireVerification(
  appeler: (adresse: string, init: RequestInit) => Promise<Response>,
  base: string,
  commit: string,
): Promise<EtatVerification> {
  try {
    const reponse = await appeler(`${base}${FICHIER_VERIFICATION}?t=${Date.now()}`, { cache: 'no-store' });
    if (!reponse.ok) return 'inconnue';
    return interpreterVerification(await reponse.json(), commit);
  } catch {
    return 'inconnue';
  }
}

export const LIBELLES_VERIFICATION: Readonly<Record<EtatVerification, string>> = {
  en_cours: 'en cours',
  verte: 'verte',
  echec: 'en échec',
  inconnue: 'inconnue',
};
