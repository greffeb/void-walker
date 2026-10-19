import { generateurDepuisGraine, suivant } from './des';
import { caseDevant, casesDe, chevauchent, cleCase, murCommun, panLibre, PORTES_MAX, PROFONDEUR_COQUE, videsEnfermes, type RectPlan } from './plan';
import { accroches, placer } from './pose';
import type { CategoriePiece, DefAnnexe, DefMorceau } from './station';

// Annexes d'une grande station (spec 2026-10-18 §6.1, §6.2 ; 14 §5.3, GE-09 à GE-11) : après le chemin principal, les pièces du
// catalogue se posent une à une, sans rien défaire, accrochées à une pièce accueillante d'un morceau ou à un couloir du
// catalogue. Les règles lisent la forme, la catégorie et les étiquettes, jamais un nom (D-078).

export interface AnnexePosee {
  /** Identifiant d'instance, ex. 'a3-couchettes' : préfixe de sa pièce et de sa porte. */
  readonly instance: string;
  readonly annexe: DefMorceau;
  readonly rect: RectPlan;
  /** Pièce préfixée où elle s'accroche : pièce accueillante d'un morceau, ou couloir du catalogue. */
  readonly accroche: string;
  /** Case de la porte sur le mur commun (GE-01). */
  readonly rangPorte: number;
  readonly ouverte: boolean;
}

/** Une grande station reçoit au moins six annexes (spec §4.1) : en deçà, pas de plan pour cette graine. */
const ANNEXES_MIN = 6;
/** Un couloir du catalogue dessert de deux à quatre pièces (GE-11). */
const SERVIES_MIN = 2;
const SERVIES_MAX = 4;
/** Une même annexe deux fois au plus dans une station, sauf le couloir. */
const MEME_ANNEXE_MAX = 2;

/** Un couloir jusqu'à sept annexes, deux au-delà. */
function couloirsPour(nombre: number): number {
  return nombre <= 7 ? 1 : 2;
}

function declarationDe(morceau: DefMorceau): DefAnnexe {
  if (morceau.annexe === undefined) throw new Error(`${morceau.id} : morceau sans déclaration d’annexe.`);
  return morceau.annexe;
}

/** Pièce préfixée d'une annexe posée. */
export function pieceAnnexe(posee: Pick<AnnexePosee, 'instance'>): string {
  return `${posee.instance}/p-piece`;
}

/** Cases devant le pan libre de chaque pièce de coque (GE-07) : aucune annexe ne s'y pose. */
function casesReservees(principales: ReadonlyMap<string, RectPlan>, coques: ReadonlySet<string>): Set<string> {
  const occupees = casesDe(principales.values());
  const reservees = new Set<string>();
  for (const id of coques) {
    const rect = principales.get(id);
    const pan = rect === undefined ? null : panLibre(rect, occupees);
    if (rect === undefined || pan === null) continue;
    for (let i = pan.debut; i < pan.fin; i++) {
      for (let k = 1; k <= PROFONDEUR_COQUE; k++) {
        const devant = caseDevant(rect, pan.cote, i, k);
        reservees.add(cleCase(devant.x, devant.y));
      }
    }
  }
  return reservees;
}

/**
 * Annexes posées autour du chemin principal ; `null` si moins de six tiennent, si un couloir ne trouve pas de place ou dessert
 * moins de deux pièces. `principales` : pièces dessinées du chemin, préfixées ; `portes` : leur nombre de portes.
 */
export function poserAnnexes(
  principales: ReadonlyMap<string, RectPlan>,
  portes: ReadonlyMap<string, number>,
  accueillantes: ReadonlyMap<string, CategoriePiece>,
  coques: ReadonlySet<string>,
  catalogue: readonly DefMorceau[],
  nombre: number,
  graine: number,
): readonly AnnexePosee[] | null {
  let etat = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const melanger = <T>(liste: readonly T[]): T[] => {
    const reste = [...liste];
    const melange: T[] = [];
    while (reste.length > 0) melange.push(...reste.splice(tirer(reste.length), 1));
    return melange;
  };

  const reservees = casesReservees(principales, coques);
  const rects = new Map(principales);
  const nbPortes = new Map(portes);
  /** Par couloir posé : les déclarations des pièces qu'il dessert. */
  const servies = new Map<string, DefAnnexe[]>();
  const posees: AnnexePosee[] = [];

  const accrochesPossibles = (declaration: DefAnnexe): string[] => {
    const parAccueil = melanger([...accueillantes.keys()]);
    if (declaration.forme === 'couloir') return parAccueil;
    // Les couloirs qui n'ont pas encore leurs deux pièces d'abord, puis les autres couloirs, puis les pièces accueillantes.
    const couloirs = melanger([...servies.keys()]).filter((couloir) => (servies.get(couloir)?.length ?? 0) < SERVIES_MAX);
    const parCouloir = [...couloirs.filter((couloir) => (servies.get(couloir)?.length ?? 0) < SERVIES_MIN), ...couloirs.filter((couloir) => (servies.get(couloir)?.length ?? 0) >= SERVIES_MIN)];
    const { surCouloirDe } = declaration;
    if (surCouloirDe !== undefined) return parCouloir.filter((couloir) => servies.get(couloir)?.some((servie) => servie.etiquettes.includes(surCouloirDe)) === true);
    return [...parCouloir, ...parAccueil];
  };

  const tenter = (annexe: DefMorceau): AnnexePosee | null => {
    const declaration = declarationDe(annexe);
    const tuile = annexe.pieces[0]?.plan;
    if (tuile === undefined) throw new Error(`${annexe.id} : annexe sans pièce dessinée.`);
    const candidates = accrochesPossibles(declaration).filter(
      // GE-09 : une pièce de vie ne s'ouvre jamais sur une pièce technique.
      (accroche) => (nbPortes.get(accroche) ?? 0) < PORTES_MAX && !(declaration.categorie === 'vie' && accueillantes.get(accroche) === 'technique'),
    );
    for (const accroche of candidates) {
      const depuis = rects.get(accroche);
      if (depuis === undefined) continue;
      for (const placement of melanger(accroches(depuis, tuile))) {
        const rect = placer(tuile, placement);
        if ([...rects.values()].some((posee) => chevauchent(posee, rect))) continue;
        if ([...casesDe([rect])].some((cle) => reservees.has(cle))) continue;
        if (videsEnfermes([...rects.values(), rect]).length > 0) continue;
        const mur = murCommun(depuis, rect);
        if (mur === null) continue;
        const rangPorte = mur.debut + tirer(mur.fin - mur.debut);
        const ouverte = declaration.porte === 'ouverte' || (declaration.porte === 'tiree' && tirer(2) === 0);
        return { instance: `a${posees.length + 1}-${annexe.id.replace(/^a-/, '')}`, annexe, rect, accroche, rangPorte, ouverte };
      }
    }
    return null;
  };

  const enregistrer = (posee: AnnexePosee): void => {
    const piece = pieceAnnexe(posee);
    posees.push(posee);
    rects.set(piece, posee.rect);
    nbPortes.set(posee.accroche, (nbPortes.get(posee.accroche) ?? 0) + 1);
    nbPortes.set(piece, 1);
    servies.get(posee.accroche)?.push(declarationDe(posee.annexe));
    if (declarationDe(posee.annexe).forme === 'couloir') servies.set(piece, []);
  };

  const couloir = catalogue.find((annexe) => annexe.annexe?.forme === 'couloir');
  for (let rang = 0; couloir !== undefined && rang < couloirsPour(nombre); rang++) {
    const posee = tenter(couloir);
    if (posee === null) return null;
    enregistrer(posee);
  }
  // Chaque autre annexe deux fois dans l'urne. Celle qui demande un couloir déjà servi (GE-10) attend qu'il le soit, puis passe
  // aussitôt.
  const urne = melanger(catalogue.filter((annexe) => annexe.annexe !== undefined && annexe.annexe.forme !== 'couloir').flatMap((annexe) => Array.from({ length: MEME_ANNEXE_MAX }, () => annexe)));
  const prete = (annexe: DefMorceau): boolean => {
    const { surCouloirDe } = declarationDe(annexe);
    return surCouloirDe === undefined || [...servies.values()].some((pieces) => pieces.some((servie) => servie.etiquettes.includes(surCouloirDe)));
  };
  const attente: DefMorceau[] = [];
  const essayer = (annexe: DefMorceau): void => {
    const posee = tenter(annexe);
    if (posee === null) return;
    enregistrer(posee);
    for (const enAttente of attente.filter(prete)) {
      if (posees.length >= nombre) return;
      // Une annexe en attente peut avoir été posée par un appel plus profond.
      const rang = attente.indexOf(enAttente);
      if (rang < 0) continue;
      attente.splice(rang, 1);
      essayer(enAttente);
    }
  };
  for (const annexe of urne) {
    if (posees.length >= nombre) break;
    if (prete(annexe)) essayer(annexe);
    else attente.push(annexe);
  }
  const couloirsServis = [...servies.values()].every((pieces) => pieces.length >= SERVIES_MIN);
  return posees.length >= Math.min(ANNEXES_MIN, nombre) && couloirsServis ? posees : null;
}
