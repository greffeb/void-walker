import { generateurDepuisGraine, suivant } from './des';
import type { DefObjet, IntensiteTrace } from './monde';
import type { EntreeButin, TableButin } from './station';

// Salles de butin d'une grande station (spec 2026-10-18 §6.6) : deux ou trois impasses du catalogue, la première sur la piste
// près du repaire, reçoivent chacune zéro ou un objet de la table. Les règles lisent étiquettes, piste, distances et segments,
// jamais un nom (D-078).

/** Impasse du catalogue candidate, vue par la pose du butin. */
export interface ImpasseButin {
  readonly id: string;
  readonly etiquettes: readonly string[];
  /** Pièce où elle pend, puis, tant que c'est un couloir du catalogue, celle où ce couloir pend, jusqu'au chemin principal. */
  readonly accroches: readonly string[];
  readonly segment: number;
  /** Portes à franchir depuis le repaire, portes ouvertes ou non. */
  readonly distance: number;
}

export interface SalleButin {
  readonly piece: string;
  /** Null : la salle a été pillée avant le joueur. */
  readonly objet: DefObjet | null;
}

/**
 * Salles de butin et leur objet, sur la sous-graine 'butin' ; aucune sans impasse `butin` (la graine garde son plan). La première
 * est sur la piste : la plus proche pièce marquée de sa chaîne d'accroches porte une trace forte s'il y en a, sinon légère ; à
 * défaut, c'est une des impasses les plus proches du repaire. Les autres sont tirées parmi les impasses restantes. Les objets
 * sont tirés sans remise, la salle vide comprise, chacun seulement là où sa condition tient : `apresCoupe(morceau, segment)` dit
 * si ce segment est au-delà de la coupe du morceau, ou si le morceau n'est pas dans la station.
 */
export function poserButin(
  impasses: readonly ImpasseButin[],
  piste: ReadonlyMap<string, IntensiteTrace>,
  repaire: string,
  table: TableButin,
  apresCoupe: (morceau: string, segment: number) => boolean,
  graine: number,
): readonly SalleButin[] {
  let alea = generateurDepuisGraine(graine);
  const hasard = (): number => {
    const tirage = suivant(alea);
    alea = tirage.etat;
    return tirage.valeur / 4294967296;
  };
  const tirer = (faces: number): number => Math.floor(hasard() * faces);

  // La pièce de la créature n'est jamais une salle de butin.
  const candidates = impasses.filter((impasse) => impasse.etiquettes.includes('butin') && impasse.id !== repaire);
  const [min, max] = table.salles;
  const nombre = min + tirer(max - min + 1);
  const trace = (impasse: ImpasseButin): IntensiteTrace | undefined => impasse.accroches.map((piece) => piste.get(piece)).find((intensite) => intensite !== undefined);
  const fortes = candidates.filter((impasse) => trace(impasse) === 'forte');
  const legeres = candidates.filter((impasse) => trace(impasse) === 'legere');
  const proche = Math.min(...candidates.map((impasse) => impasse.distance));
  const preferees = fortes.length > 0 ? fortes : legeres.length > 0 ? legeres : candidates.filter((impasse) => impasse.distance === proche);
  const premiere = preferees[tirer(preferees.length)];
  if (premiere === undefined) return [];
  const salles = [premiere];
  const reste = candidates.filter((impasse) => impasse !== premiere);
  while (salles.length < nombre && reste.length > 0) salles.push(...reste.splice(tirer(reste.length), 1));

  const entrees: EntreeButin[] = [...table.entrees];
  let poses = 0;
  return salles.map((salle) => {
    const permises = entrees.filter((entree) => entree.apresCoupeDe === undefined || apresCoupe(entree.apresCoupeDe, salle.segment));
    let tirage = hasard() * permises.reduce((total, entree) => total + entree.poids, table.vide) - table.vide;
    const tiree = tirage < 0 ? undefined : permises.find((entree) => (tirage -= entree.poids) < 0);
    if (tiree === undefined) return { piece: salle.id, objet: null };
    entrees.splice(entrees.indexOf(tiree), 1);
    return { piece: salle.id, objet: { ...tiree.objet, id: `o-butin-${++poses}`, piece: salle.id, butin: true } };
  });
}
