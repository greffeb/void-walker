import { generateurDepuisGraine, suivant } from './des';
import { prefixer } from './pose';
import type { EmplacementDocument, ReserveDocuments } from './station';

/** Clé de la note de la trousse de soin du butin : la seule note de rangement sans morceau, sa « clé » ne désignant aucun objet de morceau. */
export const CLE_TROUSSE = 'butin:soin';

// Documents d'une grande station (spec 2026-10-18 §8.4) : après le butin, cinq à sept documents de la réserve, notes de
// rangement comprises, un par pièce. Les règles lisent couches, étapes, étiquettes et rangs, jamais un nom (D-078).

/** Pièce parcourable de la station, vue par la pose des documents. */
export interface PieceDocument {
  readonly id: string;
  readonly etiquettes: readonly string[];
  /** Morceau dont c'est la pièce face à l'obstacle ou, pour une pièce du catalogue, dont la pièce face porte l'annexe ; sinon null. */
  readonly morceau: string | null;
  /** Portes à franchir depuis le départ : l'ordre du trajet. */
  readonly rang: number;
  readonly catalogue: boolean;
  /** Ne porte encore rien : ni objet, ni salle de butin, ni bout de porte de boucle, ni trace. */
  readonly vide: boolean;
}

export interface DocumentPose {
  readonly emplacement: EmplacementDocument;
  readonly piece: string;
  /** Note de rangement : la pièce de la clé ou de la trousse. */
  readonly designe?: string;
}

type Couple = readonly [EmplacementDocument, PieceDocument];

/**
 * Documents de la station, sur la sous-graine 'documents' ; `depart` n'en reçoit jamais. Dans l'ordre : le nombre tiré dans
 * `parStation`, que les notes des clés déplacées dépassent au besoin ; une note par clé déplacée, dans la pièce face, sinon
 * dans sa pièce d'origine, sinon dans une annexe pendue à la face, jamais la pièce de la clé ; un document par morceau
 * présent, dans sa pièce face, sinon dans une annexe pendue à elle ; la menace, une étape par tiers du trajet, au moins une ;
 * l'univers, dans les pièces du catalogue d'une étiquette acceptée ; la note de la trousse. Ailleurs que dans une pièce
 * imposée, les pièces du catalogue d'abord, celles qui ne portent encore rien en priorité. Couverture (§7.3) : hors notes et
 * première menace, un document ne prend la place réservée à une pièce du catalogue qui ne porte rien que s'il la couvre ; les
 * morceaux laissent en plus une place à la menace.
 */
export function poserDocuments(
  reserve: ReserveDocuments,
  pieces: readonly PieceDocument[],
  clesDeplacees: ReadonlyMap<string, { readonly piece: string; readonly face: string; readonly origine: string }>,
  trousse: string | null,
  morceaux: ReadonlySet<string>,
  depart: string,
  graine: number,
): readonly DocumentPose[] {
  let alea = generateurDepuisGraine(graine);
  const tirer = (faces: number): number => {
    const tirage = suivant(alea);
    alea = tirage.etat;
    return Math.floor((tirage.valeur / 4294967296) * faces);
  };
  const { emplacements, parStation } = reserve;
  const [min, max] = parStation;
  const nombre = min + tirer(max - min + 1);
  const de = (couche: EmplacementDocument['couche']): EmplacementDocument[] => emplacements.filter((emplacement) => emplacement.couche === couche);
  const parId = new Map(pieces.map((piece) => [piece.id, piece]));

  const poses: DocumentPose[] = [];
  const prise = (piece: string): boolean => piece === depart || poses.some((pose) => pose.piece === piece);
  // Le nom de puce d'un document est son identifiant : jamais deux fois le même.
  const tire = (emplacement: EmplacementDocument): boolean => poses.some((pose) => pose.emplacement.id === emplacement.id);
  const poser = (emplacement: EmplacementDocument, piece: string, designe?: string): void => {
    poses.push({ emplacement, piece, ...(designe === undefined ? {} : { designe }) });
  };
  const reste = (): number => nombre - poses.length;
  const catalogue = pieces.filter((piece) => piece.catalogue);
  // Couverture (§7.3) : chaque pièce du catalogue qui ne porte encore rien garde sa place dans le nombre tiré.
  const aCouvrir = (): number => catalogue.filter((piece) => piece.vide && !prise(piece.id)).length;
  /**
   * Un des couples libres les mieux placés, tiré au hasard : pièce du catalogue d'abord, qui ne porte rien ensuite. Sauf
   * `force`, aucun s'il ne couvre pas une pièce du catalogue alors que la place restante leur est réservée.
   */
  const choisir = (couples: readonly Couple[], force = false): Couple | undefined => {
    const ordre = ([, piece]: Couple): number => (piece.catalogue ? 0 : 2) + (piece.vide ? 0 : 1);
    const libres = couples.filter(([emplacement, piece]) => !tire(emplacement) && !prise(piece.id));
    const meilleur = Math.min(...libres.map(ordre));
    const meilleurs = libres.filter((couple) => ordre(couple) === meilleur);
    const couple = meilleurs[tirer(meilleurs.length)];
    return couple === undefined || force || meilleur === 0 || reste() > aCouvrir() ? couple : undefined;
  };
  const pendues = (morceau: string | null | undefined): PieceDocument[] => pieces.filter((piece) => piece.catalogue && piece.morceau !== null && piece.morceau === morceau);

  for (const [cle, { piece, face, origine }] of clesDeplacees) {
    const note = de('rangement').find((emplacement) => emplacement.morceau !== undefined && emplacement.cle !== undefined && prefixer(emplacement.morceau, emplacement.cle) === cle);
    if (note === undefined || tire(note)) continue;
    const ici = [face, origine].find((id) => parId.has(id) && !prise(id)) ?? choisir(pendues(parId.get(face)?.morceau).filter((annexe) => annexe.id !== piece).map((annexe) => [note, annexe]), true)?.[1].id;
    if (ici !== undefined) poser(note, ici, piece);
  }

  const deMorceaux = de('morceau').filter((emplacement) => emplacement.morceau !== undefined && morceaux.has(emplacement.morceau));
  // Une place au moins reste à la menace, et une à chaque pièce du catalogue à couvrir.
  while (reste() > aCouvrir() + 1 && deMorceaux.length > 0) {
    const [emplacement] = deMorceaux.splice(tirer(deMorceaux.length), 1);
    if (emplacement === undefined || poses.some((pose) => pose.emplacement.couche === 'morceau' && pose.emplacement.morceau === emplacement.morceau)) continue;
    const face = pieces.find((piece) => !piece.catalogue && piece.morceau === emplacement.morceau);
    if (face === undefined) continue;
    const ici = prise(face.id) ? choisir(pendues(emplacement.morceau).map((annexe) => [emplacement, annexe]))?.[1].id : face.id;
    if (ici !== undefined) poser(emplacement, ici);
  }

  const plusLoin = Math.max(0, ...pieces.map((piece) => piece.rang));
  const tiers = (piece: PieceDocument): number => (piece.rang * 3 <= plusLoin ? 0 : piece.rang * 3 <= plusLoin * 2 ? 1 : 2);
  for (const etape of [1, 2, 3, 4] as const) {
    const menace = poses.filter((pose) => pose.emplacement.couche === 'menace');
    if (reste() <= 0 && menace.length > 0) break;
    // Étapes 1 et 2 au premier tiers, 3 au deuxième, 4 au dernier ; jamais avant l'étape précédente sur le trajet.
    const depuis = Math.max(0, ...menace.map((pose) => parId.get(pose.piece)?.rang ?? 0));
    const ici = pieces.filter((piece) => tiers(piece) === Math.max(0, etape - 2) && piece.rang >= depuis);
    const couple = choisir(
      de('menace').flatMap((emplacement) => (emplacement.etape === etape ? ici.map((piece): Couple => [emplacement, piece]) : [])),
      menace.length === 0,
    );
    if (couple !== undefined) poser(couple[0], couple[1].id);
  }

  const univers = de('univers').flatMap((emplacement) => catalogue.filter((piece) => piece.etiquettes.some((etiquette) => emplacement.etiquettes?.includes(etiquette) === true)).map((piece): Couple => [emplacement, piece]));
  while (reste() > 0) {
    const couple = choisir(univers);
    if (couple === undefined) break;
    poser(couple[0], couple[1].id);
  }

  const soin = emplacements.find((emplacement) => emplacement.couche === 'rangement' && emplacement.cle === CLE_TROUSSE);
  if (trousse !== null && soin !== undefined && reste() > 0) {
    const couple = choisir(catalogue.filter((piece) => piece.id !== trousse).map((piece): Couple => [soin, piece]));
    if (couple !== undefined) poser(soin, couple[1].id, trousse);
  }
  return poses;
}
