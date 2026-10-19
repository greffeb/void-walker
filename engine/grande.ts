import { pieceAnnexe, poserAnnexes, type AnnexePosee } from './annexes';
import { poserBoucles } from './boucles';
import { poserCles, type CleAPoser, type PieceCandidate } from './cles';
import type { CategoriePiece, DefLiaison, DefMonde, DefObjet, DefPiece } from './monde';
import { tracerPiste } from './piste';
import { piecesDeCoque, type RectPlan } from './plan';
import { prefixer, sousGraine } from './pose';
import type { DefMorceau, DefStation, DefStationGrande } from './station';

// Grande station (spec 2026-10-18 §6.2) : autour du chemin principal déjà posé, les annexes, puis les portes de boucle, puis la
// piste de la créature, puis les clés, chacune sur sa sous-graine. Le monde reste un monde ordinaire, revalidé par l'assembleur.

/** Une liaison que la créature peut franchir, au besoin en forçant la porte (D-279) : la piste ne passe que par elles. */
export function franchissable(liaison: DefLiaison): boolean {
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

/**
 * Objets du monde, clés dispersées (spec §6.5) : une clé tirée dans une annexe y perd sa position ; un appui `portableEnGrande`
 * devient portable et encombrant, qu'il bouge ou non.
 */
function disperserCles(monde: DefMonde, station: DefStation, annexes: readonly AnnexePosee[], segments: ReadonlyMap<string, number>, liaisons: readonly DefLiaison[]): DefObjet[] {
  const { morceaux } = station;
  // Dans l'ordre du chemin, puis des identifiants : le tirage ne dépend pas de l'ordre des déclarations.
  const cles = morceaux.flatMap((morceau) =>
    Object.entries(morceau.grande?.cles ?? {})
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([id, cle]): CleAPoser => {
        const objet = monde.objets.find((candidat) => candidat.id === prefixer(morceau.id, id));
        if (objet === undefined) throw new Error(`${morceau.id} : clé absente ${id}.`);
        return { objet: objet.id, morceau: morceau.id, origine: objet.piece, cle, encombrante: objet.encombrant === true || cle.portableEnGrande === true, large: objet.large === true };
      }),
  );

  // Zones permises : le côté avant du morceau et celui du morceau d'où part son entrée ; pour le final, celui du dernier chemin.
  const avant = (morceau: DefMorceau | undefined): (number | undefined)[] => morceau?.grande?.avant.map((piece) => segments.get(prefixer(morceau.id, piece))) ?? [];
  const carrefour = morceaux.find((morceau) => morceau.famille === 'carrefour');
  const zones = new Map<string, ReadonlySet<number | undefined>>();
  const racines = new Map<string, ReadonlySet<string>>();
  morceaux.forEach((morceau, rang) => {
    const accroche = station.accroches?.find((candidate) => candidate.vers === morceau.id);
    const precedent = accroche === undefined ? morceaux[rang - 1] : morceaux.find((candidat) => candidat.id === accroche.depuis);
    zones.set(morceau.id, new Set([...avant(morceau), ...avant(precedent)]));
    // Ordre libre : les deux branches partent du couloir commun et partagent sa zone ; la clé de l'une n'y pend jamais à l'autre.
    if (carrefour !== undefined && accroche?.depuis === carrefour.id && accroche.piece === carrefour.entree) racines.set(morceau.id, new Set([morceau.id, carrefour.id]));
  });

  const accrocheDe = new Map(annexes.map((posee) => [pieceAnnexe(posee), posee.accroche]));
  const racine = (piece: string): string => {
    let haut = piece;
    for (let suivante = accrocheDe.get(haut); suivante !== undefined; suivante = accrocheDe.get(haut)) haut = suivante;
    return haut;
  };
  const candidates = annexes.map((posee): PieceCandidate => {
    const id = pieceAnnexe(posee);
    return { id, etiquettes: posee.annexe.annexe?.etiquettes ?? [], segment: segments.get(id) ?? -1, racine: racine(id) };
  });
  const permise = (cle: CleAPoser, candidate: PieceCandidate): boolean =>
    zones.get(cle.morceau)?.has(candidate.segment) === true && (racines.get(cle.morceau)?.has(candidate.racine.slice(0, candidate.racine.indexOf('/'))) ?? true);

  // Pièces d'où l'on apporte un objet large à l'intérieur d'une capsule, toutes portes supposées ouvertes (logique de
  // `apportablesVers`, sortie.ts) ; aussi sans passage haut, caché ni vide, par prudence.
  const larges = liaisons.filter((liaison) => liaison.etroite !== true && liaison.gouffre !== true && liaison.haute === undefined && liaison.cachee === undefined);
  const apportables = new Set(monde.objets.flatMap((objet) => (objet.capsule === undefined ? [] : [objet.capsule.interieur])));
  for (const piece of apportables) for (const liaison of larges) if (liaison.entre.includes(piece)) for (const autre of liaison.entre) apportables.add(autre);

  const poses = poserCles(cles, candidates, permise, (piece) => apportables.has(piece), sousGraine(station.graine, 'cles'));
  const portablesEnGrande = new Set(cles.filter((cle) => cle.cle.portableEnGrande === true).map((cle) => cle.objet));
  return monde.objets.map((objet) => {
    const leve = portablesEnGrande.has(objet.id) ? { ...objet, portable: true, encombrant: true } : objet;
    const piece = poses.get(objet.id) ?? objet.piece;
    if (piece === objet.piece) return leve;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- la position appartient à la pièce d'origine.
    const { position, ...ailleurs } = leve;
    return { ...ailleurs, piece };
  });
}

/** Monde du chemin principal étendu ; `null` si les annexes ne tiennent pas, ou si aucune porte de boucle ne se pose (D-295), pour cette graine. */
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
  if (boucles.length === 0) return null;
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
    objets: disperserCles(monde, station, annexes, segments, [...liaisons, ...liaisonsBoucles]),
    liaisons: [...liaisons, ...liaisonsBoucles],
    boucles: liaisonsBoucles.map((liaison) => liaison.id),
    bruitsStation: true,
  };
}
