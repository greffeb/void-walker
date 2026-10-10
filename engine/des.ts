// Générateur sfc32 (AP-02) : propre à la partie, état sérialisable, jamais de hasard global.

export interface EtatGenerateur {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
}

export const GRAINE_MAX = 0xffffffff;

export function graineValide(graine: unknown): graine is number {
  return typeof graine === 'number' && Number.isInteger(graine) && graine >= 0 && graine <= GRAINE_MAX;
}

export function suivant(etat: EtatGenerateur): { readonly valeur: number; readonly etat: EtatGenerateur } {
  let { a, b, c, d } = etat;
  let t = (a + b) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  d = (d + 1) | 0;
  t = (t + d) | 0;
  c = (c + t) | 0;
  return { valeur: t >>> 0, etat: { a: a >>> 0, b: b >>> 0, c: c >>> 0, d: d >>> 0 } };
}

export function generateurDepuisGraine(graine: number): EtatGenerateur {
  if (!graineValide(graine)) throw new RangeError(`Graine invalide : ${String(graine)}.`);
  let etat: EtatGenerateur = { a: 0x9e3779b9, b: 0x243f6a88, c: 0xb7e15162, d: graine };
  for (let i = 0; i < 12; i++) etat = suivant(etat).etat;
  return etat;
}

/** Ce que les règles reçoivent pour tirer un dé. */
export interface Des {
  lancer(faces: number): number;
}

export interface SessionDes {
  readonly des: Des;
  /** Résultats tirés pendant l'action, dans l'ordre : ils vont au journal. */
  readonly tirages: readonly number[];
  etatFinal(): EtatGenerateur;
}

export function ouvrirDes(depart: EtatGenerateur): SessionDes {
  let courant = depart;
  const tirages: number[] = [];
  const des: Des = {
    lancer(faces: number): number {
      if (!Number.isInteger(faces) || faces < 1) throw new RangeError(`Nombre de faces invalide : ${faces}.`);
      const tirage = suivant(courant);
      courant = tirage.etat;
      const resultat = Math.floor((tirage.valeur / 4294967296) * faces) + 1;
      tirages.push(resultat);
      return resultat;
    },
  };
  return { des, tirages, etatFinal: () => courant };
}
