import { generateurDepuisGraine, suivant } from './des';
import type { CategoriePiece } from './monde';
import { caseDevant, casesDe, chevauchent, cleCase, murCommun, panLibre, PORTES_MAX, PROFONDEUR_COQUE, videsEnfermes, type RectPlan } from './plan';
import { accroches, placer } from './pose';
import type { DefAnnexe, DefMorceau } from './station';

// Annexes d'une grande station (spec 2026-10-18 §6.1, §6.2 ; 14 §5.3, GE-09 à GE-11) : après le chemin principal, les pièces du
// catalogue se posent une à une, sans rien défaire, accrochées à une pièce accueillante d'un morceau ou à un couloir du
// catalogue. Seul un couloir peut être retiré, s'il ne trouve pas ses deux premières pièces : il essaie alors une autre place.
// Les règles lisent la forme, la catégorie et les étiquettes, jamais un nom (D-078).

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
/** Passages posés exprès pour rendre une porte de boucle possible (spec §6.4), au plus. */
const CONNECTEURS = 2;
/** Poses examinées, au plus, pour un tel passage : un compte, pour que la graine seule décide. */
const ESSAIS_CONNECTEUR = 400;
/** Places essayées, au plus, pour un couloir et ses deux premières pièces : un compte, pour que la graine seule décide. */
const ESSAIS_COULOIR = 24;

/** Un couloir jusqu'à sept annexes, deux au-delà, s'ils trouvent leur place. */
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

/** Ce qui est posé : rectangles, portes par pièce, et, par couloir, la catégorie de sa pièce d'accroche et ce qu'il dessert. */
interface Etat {
  readonly rects: Map<string, RectPlan>;
  readonly portes: Map<string, number>;
  readonly couloirs: Map<string, { readonly accroche: CategoriePiece | undefined; readonly servies: DefAnnexe[] }>;
  readonly posees: AnnexePosee[];
  /** Voisines de chaque pièce par une porte, annexes comprises. */
  readonly liens: Map<string, string[]>;
  /** Segment de chaque annexe posée : celui de sa pièce d’accroche. */
  readonly segments: Map<string, number>;
  /** Couloirs et passages posés. */
  readonly bouclables: Set<string>;
}

function copier(etat: Etat): Etat {
  return {
    rects: new Map(etat.rects),
    portes: new Map(etat.portes),
    couloirs: new Map([...etat.couloirs].map(([piece, couloir]) => [piece, { ...couloir, servies: [...couloir.servies] }])),
    posees: [...etat.posees],
    liens: new Map([...etat.liens].map(([piece, voisines]) => [piece, [...voisines]])),
    segments: new Map(etat.segments),
    bouclables: new Set(etat.bouclables),
  };
}

/**
 * Annexes posées autour du chemin principal ; `null` si moins de six tiennent, ou si un couloir posé dessert moins de deux
 * pièces. `principales` : pièces dessinées du chemin, préfixées ; `portes` : leur nombre de portes.
 */
export function poserAnnexes(
  principales: ReadonlyMap<string, RectPlan>,
  portes: ReadonlyMap<string, number>,
  accueillantes: ReadonlyMap<string, CategoriePiece>,
  coques: ReadonlySet<string>,
  catalogue: readonly DefMorceau[],
  nombre: number,
  graine: number,
  /** Segment des pièces du chemin (spec §6.3) : un couloir ou un passage préfère toucher une autre pièce bouclable du même segment, pour qu’une porte de boucle y soit possible (§6.4). */
  segments: ReadonlyMap<string, number> = new Map(),
  /** Liaisons du chemin principal : la boucle visée doit fermer un cycle d’au moins quatre pièces. */
  liaisons: readonly (readonly [string, string])[] = [],
  /** Pièce de la créature : jamais bout d’une boucle, et les boucles se cherchent d’abord dans son segment. */
  repaire?: string,
): readonly AnnexePosee[] | null {
  let alea = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(alea);
    alea = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const melanger = <T>(liste: readonly T[]): T[] => {
    const reste = [...liste];
    const melange: T[] = [];
    while (reste.length > 0) melange.push(...reste.splice(tirer(reste.length), 1));
    return melange;
  };
  const reservees = casesReservees(principales, coques);

  /** Pièces où cette annexe peut s'accrocher : couloirs du catalogue d'abord, les moins servis en tête, puis pièces accueillantes. */
  const accrochesPour = (etat: Etat, declaration: DefAnnexe): string[] => {
    const parAccueil = melanger([...accueillantes.keys()]);
    if (declaration.forme === 'couloir') return parAccueil;
    const servies = (piece: string): number => etat.couloirs.get(piece)?.servies.length ?? 0;
    const couloirs = melanger([...etat.couloirs.keys()]).filter((piece) => {
      const couloir = etat.couloirs.get(piece);
      // GE-09 : une pièce de vie ne s'atteint pas par un couloir ouvert sur une pièce technique.
      return servies(piece) < SERVIES_MAX && !(declaration.categorie === 'vie' && couloir?.accroche === 'technique');
    });
    const parCouloir = [...couloirs.filter((piece) => servies(piece) < SERVIES_MIN), ...couloirs.filter((piece) => servies(piece) >= SERVIES_MIN)];
    const { surCouloirDe } = declaration;
    if (surCouloirDe !== undefined) return parCouloir.filter((piece) => etat.couloirs.get(piece)?.servies.some((servie) => servie.etiquettes.includes(surCouloirDe)) === true);
    return [...parCouloir, ...parAccueil];
  };

  const segmentDe = (etat: Etat, piece: string): number | undefined => segments.get(piece) ?? etat.segments.get(piece);
  /** Une pièce où une porte de boucle peut aboutir : pièce accueillante d’un morceau, ou couloir et passage du catalogue. */
  const bouclable = (etat: Etat, piece: string): boolean => accueillantes.has(piece) || etat.bouclables.has(piece);
  /** Une place qui touche, par un mur d’au moins deux cases, une pièce bouclable du même segment à deux portes au moins de la pièce d’accroche. */
  const toucheLoin = (etat: Etat, accroche: string): ((rect: RectPlan) => boolean) => {
    const segment = segmentDe(etat, accroche);
    // Distances à la pièce d’accroche : une porte de boucle vers une pièce à deux portes ou plus ferme un cycle de quatre pièces.
    const distances = new Map([[accroche, 0]]);
    const file = [accroche];
    for (let tete = 0; tete < file.length; tete++) {
      const piece = file[tete];
      if (piece === undefined) break;
      for (const voisine of etat.liens.get(piece) ?? []) {
        if (!distances.has(voisine)) {
          distances.set(voisine, (distances.get(piece) ?? 0) + 1);
          file.push(voisine);
        }
      }
    }
    return (rect) =>
      [...etat.rects].some(([piece, autre]) => {
        const loin = (distances.get(piece) ?? Infinity) >= 2 && piece !== repaire && bouclable(etat, piece) && segmentDe(etat, piece) === segment;
        const mur = loin ? murCommun(autre, rect) : null;
        return mur !== null && mur.fin - mur.debut >= 2;
      });
  };
  /** Un couloir ou un passage essaie d’abord ces places-là ; l’ordre tiré est gardé entre places de même rang. */
  const ordonner = (etat: Etat, declaration: DefAnnexe, accroche: string, rects: readonly RectPlan[]): readonly RectPlan[] => {
    if (declaration.forme === 'impasse') return rects;
    const touche = toucheLoin(etat, accroche);
    return [...rects.filter(touche), ...rects.filter((rect) => !touche(rect))];
  };

  /** Poses possibles de l'annexe, une à une, sur ces pièces d'accroche ; rien n'est modifié. */
  function* poses(etat: Etat, annexe: DefMorceau, candidates: readonly string[]): Generator<AnnexePosee> {
    const declaration = declarationDe(annexe);
    const tuile = annexe.pieces[0]?.plan;
    if (tuile === undefined) throw new Error(`${annexe.id} : annexe sans pièce dessinée.`);
    for (const accroche of candidates) {
      const depuis = etat.rects.get(accroche);
      // GE-09 : une pièce de vie ne s'ouvre jamais sur une pièce technique ; PL-06 : six portes au plus.
      if (depuis === undefined || (etat.portes.get(accroche) ?? 0) >= PORTES_MAX || (declaration.categorie === 'vie' && accueillantes.get(accroche) === 'technique')) continue;
      for (const rect of ordonner(etat, declaration, accroche, melanger(accroches(depuis, tuile)).map((placement) => placer(tuile, placement)))) {
        if ([...etat.rects.values()].some((posee) => chevauchent(posee, rect))) continue;
        if ([...casesDe([rect])].some((cle) => reservees.has(cle))) continue;
        if (videsEnfermes([...etat.rects.values(), rect]).length > 0) continue;
        const mur = murCommun(depuis, rect);
        if (mur === null) continue;
        const rangPorte = mur.debut + tirer(mur.fin - mur.debut);
        const ouverte = declaration.porte === 'ouverte' || (declaration.porte === 'tiree' && tirer(2) === 0);
        yield { instance: `a${etat.posees.length + 1}-${annexe.id.replace(/^a-/, '')}`, annexe, rect, accroche, rangPorte, ouverte };
      }
    }
  }

  const premiere = (etat: Etat, annexe: DefMorceau, candidates: readonly string[]): AnnexePosee | null => {
    for (const posee of poses(etat, annexe, candidates)) return posee;
    return null;
  };

  const enregistrer = (etat: Etat, posee: AnnexePosee): void => {
    const piece = pieceAnnexe(posee);
    const declaration = declarationDe(posee.annexe);
    etat.posees.push(posee);
    etat.rects.set(piece, posee.rect);
    etat.portes.set(posee.accroche, (etat.portes.get(posee.accroche) ?? 0) + 1);
    etat.portes.set(piece, 1);
    etat.liens.set(posee.accroche, [...(etat.liens.get(posee.accroche) ?? []), piece]);
    etat.liens.set(piece, [posee.accroche]);
    etat.couloirs.get(posee.accroche)?.servies.push(declaration);
    if (declaration.forme === 'couloir') etat.couloirs.set(piece, { accroche: accueillantes.get(posee.accroche), servies: [] });
    if (declaration.forme !== 'impasse') etat.bouclables.add(piece);
    const segment = segmentDe(etat, posee.accroche);
    if (segment !== undefined) etat.segments.set(piece, segment);
  };

  const liens = new Map<string, string[]>();
  for (const [a, b] of liaisons) {
    liens.set(a, [...(liens.get(a) ?? []), b]);
    liens.set(b, [...(liens.get(b) ?? []), a]);
  }
  let etat: Etat = { rects: new Map(principales), portes: new Map(portes), couloirs: new Map(), posees: [], liens, segments: new Map(), bouclables: new Set() };
  // Chaque autre annexe deux fois dans l'urne, mélangée.
  const urne = melanger(catalogue.filter((annexe) => annexe.annexe !== undefined && annexe.annexe.forme !== 'couloir').flatMap((annexe) => Array.from({ length: MEME_ANNEXE_MAX }, () => annexe)));
  const prete = (etatCourant: Etat, annexe: DefMorceau): boolean => {
    const { surCouloirDe } = declarationDe(annexe);
    return surCouloirDe === undefined || [...etatCourant.couloirs.values()].some((couloir) => couloir.servies.some((servie) => servie.etiquettes.includes(surCouloirDe)));
  };

  // Couloirs d'abord, chacun avec ses deux premières pièces ; sinon, une autre place, puis on s'en passe.
  const couloir = catalogue.find((annexe) => annexe.annexe?.forme === 'couloir');
  for (let rang = 0; couloir !== undefined && rang < couloirsPour(nombre); rang++) {
    let essais = 0;
    for (const poseeCouloir of poses(etat, couloir, accrochesPour(etat, declarationDe(couloir)))) {
      if (++essais > ESSAIS_COULOIR) break;
      const essai = copier(etat);
      enregistrer(essai, poseeCouloir);
      const prises: number[] = [];
      for (const [indice, annexe] of urne.entries()) {
        if (prises.length >= SERVIES_MIN) break;
        // Le nouveau couloir seulement, s’il convient à cette annexe (GE-09, GE-10).
        const ici = accrochesPour(essai, declarationDe(annexe)).filter((piece) => piece === pieceAnnexe(poseeCouloir));
        if (ici.length === 0) continue;
        const posee = premiere(essai, annexe, ici);
        if (posee === null) continue;
        enregistrer(essai, posee);
        prises.push(indice);
      }
      if (prises.length < SERVIES_MIN) continue;
      etat = essai;
      for (const indice of prises.reverse()) urne.splice(indice, 1);
      break;
    }
  }

  // Connecteurs (spec §6.4) : un passage posé exprès pour toucher une seconde pièce bouclable du même segment, assez loin dans
  // le graphe pour qu’une porte de boucle ferme un cycle d’au moins quatre pièces ; d’abord près du repaire.
  const segmentRepaire = repaire === undefined ? undefined : segments.get(repaire);
  const ecart = (piece: string): number => (segmentRepaire === undefined ? 0 : Math.abs((segmentDe(etat, piece) ?? 0) - segmentRepaire));
  for (let rang = 0; rang < CONNECTEURS && etat.posees.length < nombre; rang++) {
    const indice = urne.findIndex((annexe) => annexe.annexe?.forme === 'passage');
    const passage = urne[indice];
    if (passage === undefined) break;
    const candidates = accrochesPour(etat, declarationDe(passage)).sort((a, b) => ecart(a) - ecart(b));
    let examinees = 0;
    let trouvee: AnnexePosee | null = null;
    for (const posee of poses(etat, passage, candidates)) {
      if (++examinees > ESSAIS_CONNECTEUR) break;
      if (toucheLoin(etat, posee.accroche)(posee.rect)) {
        trouvee = posee;
        break;
      }
    }
    if (trouvee === null) break;
    enregistrer(etat, trouvee);
    urne.splice(indice, 1);
  }

  // Les autres annexes. Celle qui demande un couloir déjà servi (GE-10) attend qu'il le soit, puis passe aussitôt.
  const attente: DefMorceau[] = [];
  const essayer = (annexe: DefMorceau): void => {
    const posee = premiere(etat, annexe, accrochesPour(etat, declarationDe(annexe)));
    if (posee === null) return;
    enregistrer(etat, posee);
    for (const enAttente of attente.filter((candidate) => prete(etat, candidate))) {
      if (etat.posees.length >= nombre) return;
      // Une annexe en attente peut avoir été posée par un appel plus profond.
      const indice = attente.indexOf(enAttente);
      if (indice < 0) continue;
      attente.splice(indice, 1);
      essayer(enAttente);
    }
  };
  for (const annexe of urne) {
    if (etat.posees.length >= nombre) break;
    if (prete(etat, annexe)) essayer(annexe);
    else attente.push(annexe);
  }
  const couloirsServis = [...etat.couloirs.values()].every((serviePar) => serviePar.servies.length >= SERVIES_MIN);
  return etat.posees.length >= Math.min(ANNEXES_MIN, nombre) && couloirsServis ? etat.posees : null;
}
