import { pieceAnnexe, poserAnnexes } from './annexes';
import { poserBoucles } from './boucles';
import type { CategoriePiece, DefLiaison, DefMonde, DefPiece } from './monde';
import { tracerPiste } from './piste';
import { piecesDeCoque, type RectPlan } from './plan';
import { prefixer, sousGraine } from './pose';
import type { DefStation, DefStationGrande } from './station';

// Grande station (spec 2026-10-18 §6.2) : autour du chemin principal déjà posé, les annexes, puis les portes de boucle, puis la
// piste de la créature, chacune sur sa sous-graine. Le monde reste un monde ordinaire, revalidé par l'assembleur.

/** Une liaison que la créature peut franchir, au besoin en forçant la porte (D-279) : la piste ne passe que par elles. */
function franchissable(liaison: DefLiaison): boolean {
  return liaison.etroite !== true && liaison.gouffre !== true && liaison.verrouillee !== true && liaison.haute === undefined && liaison.cachee === undefined && liaison.manoeuvre === undefined;
}

/** Liaisons de la station qui coupent un obstacle : coupes déclarées par les morceaux, porte de sortie comprise, et cloisons verrouillées. */
export function coupesDe(monde: DefMonde, station: DefStation): Set<string> {
  const coupes = new Set(monde.liaisons.filter((liaison) => liaison.verrouillee === true).map((liaison) => liaison.id));
  for (const morceau of station.morceaux) {
    for (const coupe of morceau.grande?.coupe ?? []) {
      if (coupe !== 'sortie') coupes.add(prefixer(morceau.id, coupe));
      // La porte de sortie : celle qui part de ce morceau vers le suivant (porteEntre).
      else for (const liaison of monde.liaisons) if (liaison.id.startsWith(`l-${morceau.id}-`)) coupes.add(liaison.id);
    }
  }
  return coupes;
}

/**
 * Segment de chaque pièce (spec §6.3) : la zone qu’on parcourt sans franchir une coupe, c’est-à-dire « du même côté des
 * obstacles » (GE-13). Les zones sont numérotées par le nombre de coupes à franchir depuis le départ, puis dans l’ordre où on
 * les découvre : deux branches de l’ordre libre, au même rang, restent deux zones.
 */
export function segmentsDe(monde: DefMonde, station: DefStation): Map<string, number> {
  const coupes = coupesDe(monde, station);
  const voisines = new Map<string, { readonly piece: string; readonly coupe: boolean }[]>();
  for (const liaison of monde.liaisons) {
    const [a, b] = liaison.entre;
    const coupe = coupes.has(liaison.id);
    voisines.set(a, [...(voisines.get(a) ?? []), { piece: b, coupe }]);
    voisines.set(b, [...(voisines.get(b) ?? []), { piece: a, coupe }]);
  }
  const segments = new Map<string, number>();
  // Parcours par couches : chaque couche franchit une coupe de plus ; dans une couche, une zone par composante sans coupe.
  let couche = [monde.depart];
  let prochain = 0;
  while (couche.length > 0) {
    const suivante: string[] = [];
    for (const depart of couche) {
      if (segments.has(depart)) continue;
      const zone = prochain++;
      const file = [depart];
      segments.set(depart, zone);
      for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
        for (const { piece: autre, coupe } of voisines.get(piece) ?? []) {
          if (segments.has(autre)) continue;
          if (coupe) suivante.push(autre);
          else {
            segments.set(autre, zone);
            file.push(autre);
          }
        }
      }
    }
    couche = suivante;
  }
  return segments;
}

/** Monde du chemin principal étendu ; `null` si les annexes ne tiennent pas pour cette graine. */
export function etendreGrande(monde: DefMonde, station: DefStation, grande: DefStationGrande): DefMonde | null {
  const { morceaux, graine, creature } = station;
  const segments = segmentsDe(monde, station);
  const principales = new Map(monde.pieces.flatMap((piece): (readonly [string, RectPlan])[] => (piece.plan === undefined ? [] : [[piece.id, piece.plan]])));
  const compterPortes = (liaisons: readonly DefLiaison[]): Map<string, number> => {
    const portes = new Map<string, number>();
    for (const liaison of liaisons) for (const piece of liaison.entre) portes.set(piece, (portes.get(piece) ?? 0) + 1);
    return portes;
  };
  const accueillantes = new Map<string, CategoriePiece>(
    morceaux.flatMap((morceau) => Object.entries(morceau.grande?.accueillantes ?? {}).map(([piece, categorie]) => [prefixer(morceau.id, piece), categorie] as const)),
  );

  const annexes = poserAnnexes(principales, compterPortes(monde.liaisons), accueillantes, new Set(piecesDeCoque(monde)), grande.catalogue, grande.annexes, sousGraine(graine, 'annexes'), segments, monde.liaisons.map((liaison) => liaison.entre), creature);
  if (annexes === null) return null;
  const piecesAnnexes = annexes.map((posee): DefPiece => {
    const declaration = posee.annexe.annexe;
    const piece = posee.annexe.pieces[0];
    if (declaration === undefined || piece === undefined) throw new Error(`${posee.annexe.id} : annexe incomplète.`);
    const id = pieceAnnexe(posee);
    // Les couloirs sont posés avant les pièces qu'ils desservent : leur segment est déjà connu.
    const segment = segments.get(posee.accroche) ?? 0;
    segments.set(id, segment);
    return { ...piece, id, plan: posee.rect, segment, categorie: declaration.categorie, forme: declaration.forme };
  });
  const liaisonsAnnexes = annexes.map((posee): DefLiaison => ({ id: `l-${posee.instance}`, nom: 'porte', entre: [posee.accroche, pieceAnnexe(posee)], ouverte: posee.ouverte, plan: { rang: posee.rangPorte } }));
  const liaisons = [...monde.liaisons, ...liaisonsAnnexes];

  const dessinees = [...monde.pieces, ...piecesAnnexes].flatMap((piece) => (piece.plan === undefined ? [] : [{ ...piece, plan: piece.plan }]));
  const boucles = poserBoucles(
    dessinees.map((piece) => ({ id: piece.id, rect: piece.plan, segment: segments.get(piece.id) ?? 0, bouclable: piece.forme === 'couloir' || piece.forme === 'passage' || accueillantes.has(piece.id) })),
    liaisons.map((liaison) => liaison.entre),
    compterPortes(liaisons),
    creature,
    grande.boucles,
    sousGraine(graine, 'boucles'),
  );
  const liaisonsBoucles = boucles.map((boucle): DefLiaison => ({ id: boucle.id, nom: 'porte', entre: boucle.entre, ouverte: false, plan: { rang: boucle.rang } }));

  const etiquettes = new Map(annexes.map((posee) => [pieceAnnexe(posee), posee.annexe.annexe?.etiquettes ?? []]));
  const parcourables = dessinees.filter((piece) => piece.feu !== true);
  const ids = new Set(parcourables.map((piece) => piece.id));
  const piste = tracerPiste(
    parcourables.map((piece) => ({ id: piece.id, ...(etiquettes.has(piece.id) ? { etiquettes: etiquettes.get(piece.id) } : {}) })),
    [...liaisons, ...liaisonsBoucles].filter((liaison) => franchissable(liaison) && liaison.entre.every((piece) => ids.has(piece))).map((liaison) => liaison.entre),
    monde.depart,
    creature,
    sousGraine(graine, 'piste'),
  );
  const marquer = (piece: DefPiece): DefPiece => {
    const trace = piste.get(piece.id);
    const segment = segments.get(piece.id);
    return { ...piece, ...(segment === undefined ? {} : { segment }), ...(trace === undefined ? {} : { trace }) };
  };
  return {
    ...monde,
    pieces: [...monde.pieces, ...piecesAnnexes].map(marquer),
    liaisons: [...liaisons, ...liaisonsBoucles],
    boucles: liaisonsBoucles.map((liaison) => liaison.id),
    bruitsStation: true,
  };
}
