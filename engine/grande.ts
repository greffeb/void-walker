import { ANNEXES_MIN, pieceAnnexe, poserAnnexes, type AnnexePosee } from './annexes';
import { poserBoucles } from './boucles';
import { poserButin, type ImpasseButin } from './butin';
import { poserCles, type CleAPoser, type PieceCandidate } from './cles';
import { poserDocuments, type PieceDocument } from './documents';
import type { CategoriePiece, DefLiaison, DefMonde, DefObjet, DefPiece } from './monde';
import { tracerPiste } from './piste';
import { piecesDeCoque, type RectPlan } from './plan';
import { prefixer, sousGraine } from './pose';
import type { DefMorceau, DefStation, DefStationGrande } from './station';

// Grande station (spec 2026-10-18 §6.2) : autour du chemin principal déjà posé, les annexes, puis les portes de boucle, puis la
// piste de la créature, puis les clés, puis le butin, puis les documents, chacun sur sa sous-graine. Le monde reste un monde
// ordinaire, revalidé par l'assembleur.

/** Une liaison que la créature peut franchir, au besoin en forçant la porte (D-279) : la piste ne passe que par elles. */
export function franchissable(liaison: DefLiaison): boolean {
  return liaison.etroite !== true && liaison.gouffre !== true && liaison.verrouillee !== true && liaison.haute === undefined && liaison.cachee === undefined && liaison.manoeuvre === undefined;
}

/** Liaisons qui coupent l'obstacle d'un morceau, porte de sortie comprise. */
function coupesDuMorceau(monde: DefMonde, morceau: DefMorceau): string[] {
  // La porte de sortie : celle qui part de ce morceau vers le suivant (porteEntre).
  const sortie = monde.liaisons.filter((liaison) => liaison.id.startsWith(`l-${morceau.id}-`)).map((liaison) => liaison.id);
  return (morceau.grande?.coupe ?? []).flatMap((coupe) => (coupe === 'sortie' ? sortie : [prefixer(morceau.id, coupe)]));
}

/** Liaisons de la station qui coupent un obstacle : coupes déclarées par les morceaux, porte de sortie comprise, et cloisons verrouillées. */
export function coupesDe(monde: DefMonde, station: DefStation): Set<string> {
  return new Set([...monde.liaisons.filter((liaison) => liaison.verrouillee === true).map((liaison) => liaison.id), ...station.morceaux.flatMap((morceau) => coupesDuMorceau(monde, morceau))]);
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

/** Pièce où pend une annexe, puis, tant que c'est un couloir du catalogue, celle où ce couloir pend, jusqu'au chemin principal. */
function accrochesDe(annexes: readonly AnnexePosee[]): (piece: string) => string[] {
  const accrocheDe = new Map(annexes.map((posee) => [pieceAnnexe(posee), posee.accroche]));
  return (piece) => {
    const chaine: string[] = [];
    for (let haut = accrocheDe.get(piece); haut !== undefined; haut = accrocheDe.get(haut)) chaine.push(haut);
    return chaine;
  };
}

/** Portes à franchir depuis `depart` jusqu'à chaque pièce atteinte, portes ouvertes ou non, sans les liaisons `sauf`. */
function distancesDepuis(depart: string, liaisons: readonly DefLiaison[], sauf: ReadonlySet<string> = new Set()): Map<string, number> {
  const distances = new Map([[depart, 0]]);
  const file = [depart];
  for (let piece = file.shift(); piece !== undefined; piece = file.shift()) {
    for (const liaison of liaisons) {
      if (sauf.has(liaison.id) || !liaison.entre.includes(piece)) continue;
      for (const autre of liaison.entre) {
        if (distances.has(autre)) continue;
        distances.set(autre, (distances.get(piece) ?? 0) + 1);
        file.push(autre);
      }
    }
  }
  return distances;
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

  const accroches = accrochesDe(annexes);
  const racine = (piece: string): string => accroches(piece).at(-1) ?? piece;
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

/**
 * Vrai si ce segment n'est atteint du départ qu'en franchissant une coupe de ce morceau, portes ouvertes ou non ; vrai aussi
 * quand le morceau n'est pas dans la station. Les zones sont numérotées dans l'ordre où on les découvre, pas dans celui du
 * chemin : un rang de segment ne le dit pas.
 */
function apresCoupe(monde: DefMonde, station: DefStation, liaisons: readonly DefLiaison[], segments: ReadonlyMap<string, number>): (morceau: string, segment: number) => boolean {
  return (id, segment) => {
    const morceau = station.morceaux.find((candidat) => candidat.id === id);
    if (morceau === undefined) return true;
    const vues = distancesDepuis(monde.depart, liaisons, new Set(coupesDuMorceau(monde, morceau)));
    return ![...vues.keys()].some((piece) => segments.get(piece) === segment);
  };
}

/** Pièce face à l'obstacle de chaque morceau : le bout, du côté avant, d'une liaison de sa coupe (spec §6.5). */
function facesDe(monde: DefMonde, station: DefStation, segments: ReadonlyMap<string, number>): Map<string, string> {
  return new Map(
    station.morceaux.flatMap((morceau) => {
      const avant = new Set(morceau.grande?.avant.map((piece) => segments.get(prefixer(morceau.id, piece))));
      const coupes = new Set(coupesDuMorceau(monde, morceau));
      const face = monde.liaisons.filter((liaison) => coupes.has(liaison.id)).flatMap((liaison) => liaison.entre).find((piece) => avant.has(segments.get(piece)));
      return face === undefined ? [] : [[morceau.id, face] as const];
    }),
  );
}

/**
 * Monde du chemin principal étendu ; `null` si les annexes ne tiennent pas, si aucune porte de boucle ne se pose (D-295), si,
 * avec des documents, une pièce du catalogue ne porte rien même à six annexes (§7.3), ou si le monde compte moins de
 * `piecesMin` pièces dessinées (§4.1), reprise de couverture comprise, pour cette graine.
 */
export function etendreGrande(monde: DefMonde, station: DefStation, grande: DefStationGrande): DefMonde | null {
  const etendu = etendreUneFois(monde, station, grande);
  if (etendu === null) return null;
  // Une annexe de moins n'ajoute aucune pièce : un monde déjà sous le minimum ne se rattrape pas.
  if (grande.piecesMin !== undefined && etendu.monde.pieces.filter((piece) => piece.plan !== undefined).length < grande.piecesMin) return null;
  if (etendu.couvert) return etendu.monde;
  // Couverture (spec §7.3) : une annexe de moins plutôt qu'une pièce du catalogue qui ne porte rien ; les sous-graines ne changent pas.
  return grande.annexes > ANNEXES_MIN ? etendreGrande(monde, station, { ...grande, annexes: grande.annexes - 1 }) : null;
}

/** Une extension, et si chaque pièce du catalogue porte quelque chose ; toujours vrai sans réserve de documents. */
function etendreUneFois(monde: DefMonde, station: DefStation, grande: DefStationGrande): { readonly monde: DefMonde; readonly couvert: boolean } | null {
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
  const toutes = [...liaisons, ...liaisonsBoucles];
  const objets = disperserCles(monde, station, annexes, segments, toutes);

  // Butin (spec §6.6) : seulement si le contenu donne une table ; jamais dans une impasse qui garde déjà une clé.
  const accroches = accrochesDe(annexes);
  const auRepaire = distancesDepuis(creature, toutes);
  const impasses = annexes
    .filter((posee) => posee.annexe.annexe?.forme === 'impasse' && !objets.some((objet) => objet.piece === pieceAnnexe(posee)))
    .map((posee): ImpasseButin => {
      const id = pieceAnnexe(posee);
      return { id, etiquettes: posee.annexe.annexe?.etiquettes ?? [], accroches: accroches(id), segment: segments.get(id) ?? 0, distance: auRepaire.get(id) ?? Infinity };
    });
  const salles = grande.butin === undefined ? [] : poserButin(impasses, piste, creature, grande.butin, apresCoupe(monde, station, toutes, segments), sousGraine(graine, 'butin'));
  const pillees = new Set(salles.flatMap((salle) => (salle.objet === null ? [salle.piece] : [])));
  const butins = salles.flatMap((salle) => (salle.objet === null ? [] : [salle.objet]));

  // Documents (spec §8.4) : seulement si le contenu donne une réserve. Une pièce porte quelque chose (§7.3) : un objet, une salle
  // de butin, un bout de porte de boucle, une trace, puis un document.
  const catalogue = new Set(annexes.map(pieceAnnexe));
  const portent = new Set([...[...objets, ...butins].map((objet) => objet.piece), ...pillees, ...piste.keys(), ...liaisonsBoucles.flatMap((liaison) => liaison.entre)]);
  const faces = facesDe(monde, station, segments);
  const morceauDeFace = new Map([...faces].map(([morceau, face]) => [face, morceau]));
  const auDepart = distancesDepuis(monde.depart, toutes);
  // Une salle pillée ne reçoit aucun document : sa phrase de pillage dit qu'il n'y reste rien (C-05).
  const piecesDocuments = parcourables
    .filter((piece) => !pillees.has(piece.id))
    .map(
      (piece): PieceDocument => ({
        id: piece.id,
        etiquettes: etiquettes.get(piece.id) ?? [],
        morceau: morceauDeFace.get(accroches(piece.id).at(-1) ?? piece.id) ?? null,
        rang: auDepart.get(piece.id) ?? 0,
        catalogue: catalogue.has(piece.id),
        vide: !portent.has(piece.id),
      }),
    );
  const origines = new Map(monde.objets.map((objet) => [objet.id, objet.piece]));
  const morceauDeCle = new Map(morceaux.flatMap((morceau) => Object.keys(morceau.grande?.cles ?? {}).map((id) => [prefixer(morceau.id, id), morceau.id] as const)));
  const clesDeplacees = new Map(
    objets.flatMap((objet) => {
      const origine = origines.get(objet.id);
      const face = faces.get(morceauDeCle.get(objet.id) ?? '');
      return origine === undefined || origine === objet.piece || face === undefined ? [] : [[objet.id, { piece: objet.piece, face, origine }] as const];
    }),
  );
  const trousse = butins.find((objet) => objet.soin !== undefined)?.piece ?? null;
  const documents =
    grande.documents === undefined ? [] : poserDocuments(grande.documents, piecesDocuments, clesDeplacees, trousse, new Set(morceaux.map((morceau) => morceau.id)), monde.depart, sousGraine(graine, 'documents'));
  for (const pose of documents) portent.add(pose.piece);

  const marquer = (piece: DefPiece): DefPiece => {
    const trace = piste.get(piece.id);
    const segment = segments.get(piece.id);
    return { ...piece, ...(segment === undefined ? {} : { segment }), ...(trace === undefined ? {} : { trace }), ...(pillees.has(piece.id) ? { pillee: true } : {}) };
  };
  return {
    monde: {
      ...monde,
      pieces: [...monde.pieces, ...piecesAnnexes].map(marquer),
      objets: [
        ...objets,
        ...butins,
        ...documents.map((pose, indice): DefObjet => ({ id: `o-doc-${indice + 1}`, nom: pose.emplacement.id, piece: pose.piece, portable: false, document: true, ...(pose.designe === undefined ? {} : { designe: pose.designe }) })),
      ],
      liaisons: toutes,
      boucles: liaisonsBoucles.map((liaison) => liaison.id),
      bruitsStation: true,
    },
    couvert: grande.documents === undefined || [...catalogue].every((piece) => portent.has(piece)),
  };
}
