import { VERSION_GENERATEUR, type EntreeMonde } from '../content';
import { idPublic } from '../engine/monde';
import type { PasTemoin } from './verifier-grandes';

/** Actualise uniquement la version : la composition et la graine éventuelle restent intactes. */
export function actualiserVersionGrande(id: string): string {
  return id.replace(/^g\d+-/, `g${VERSION_GENERATEUR}-`);
}

/** Transporte les identités, pas la preuve : l'appelant doit rejouer les témoins sur la cible (D-326). */
export function transposerTemoins(source: EntreeMonde, cible: EntreeMonde, temoins: readonly (readonly PasTemoin[])[]): readonly (readonly PasTemoin[])[] | null {
  const correspondances = new Map<string, string>();
  for (const categorie of ['pieces', 'liaisons', 'objets', 'positions'] as const) {
    const presentes = new Set((cible.monde[categorie] ?? []).map((entite) => entite.id));
    for (const entite of source.monde[categorie] ?? []) {
      if (presentes.has(entite.id)) correspondances.set(idPublic(source.monde.id, entite.id), idPublic(cible.monde.id, entite.id));
    }
  }
  const resultat: PasTemoin[][] = [];
  for (const temoin of temoins) {
    const transpose: PasTemoin[] = [];
    for (const [action, idCible, idParametre] of temoin) {
      const cibleTransposee = correspondances.get(idCible);
      if (cibleTransposee === undefined) return null;
      if (idParametre === undefined) {
        transpose.push([action, cibleTransposee]);
      } else {
        const parametreTranspose = correspondances.get(idParametre);
        if (parametreTranspose === undefined) return null;
        transpose.push([action, cibleTransposee, parametreTranspose]);
      }
    }
    resultat.push(transpose);
  }
  return resultat;
}
