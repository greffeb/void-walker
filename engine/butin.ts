import { generateurDepuisGraine, suivant } from './des';
import type { DefObjet, IntensiteTrace } from './monde';
import type { EntreeButin, TableButin } from './station';

// Salles de butin d'une grande station (spec 2026-10-18 §6.6) : deux ou trois impasses du catalogue, l'une accrochée à la piste
// près du repaire, reçoivent chacune zéro ou un objet de la table. Les règles lisent étiquettes, piste et segments, jamais un
// nom (D-078).

export interface SalleButin {
  readonly piece: string;
  /** Null : la salle a été pillée avant le joueur. */
  readonly objet: DefObjet | null;
}

/**
 * Salles de butin et leur objet, sur la sous-graine 'butin' ; null si aucune impasse `butin` ne s'accroche à la piste (la graine
 * n'a pas de plan). La première pend à une pièce de trace forte s'il y en a, sinon légère ; les autres sont tirées parmi les
 * impasses restantes. Les objets sont tirés sans remise, la salle vide comprise, chacun seulement là où sa condition tient :
 * `apresCoupe(morceau, segment)` dit si ce segment est au-delà de la coupe du morceau, ou si le morceau n'est pas dans la station.
 */
export function poserButin(
  impasses: readonly { readonly id: string; readonly etiquettes: readonly string[]; readonly accroche: string; readonly segment: number }[],
  piste: ReadonlyMap<string, IntensiteTrace>,
  repaire: string,
  table: TableButin,
  apresCoupe: (morceau: string, segment: number) => boolean,
  graine: number,
): readonly SalleButin[] | null {
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
  const fortes = candidates.filter((impasse) => piste.get(impasse.accroche) === 'forte');
  const preferees = fortes.length > 0 ? fortes : candidates.filter((impasse) => piste.get(impasse.accroche) === 'legere');
  const premiere = preferees[tirer(preferees.length)];
  if (premiere === undefined) return null;
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
