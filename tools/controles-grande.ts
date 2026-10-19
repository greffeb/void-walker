import { franchissable, prefixer, type DefLiaison, type DefMorceau, type DefPiece, type DefStation } from '../engine';
import { PIECES_CATALOGUE, type EntreeMonde } from '../content';

// Contrôles structurels d'une grande station (spec 2026-10-18 §7.3) : des parcours de graphe, sans recherche d'états, rapides
// sur chaque station publiée. La preuve de jeu (vérifieur) vient ensuite.

const ANNEXES = new Map(PIECES_CATALOGUE.map((morceau) => [morceau.id, morceau]));
const PIECES_MIN = 21;
const PIECES_MAX = 28;
const PORTES_MAX = 6;
const SERVIES_MIN = 2;
const SERVIES_MAX = 4;
/** Une porte de boucle ferme un cycle d'au moins quatre pièces : trois liaisons au moins entre ses deux bouts sans elle. */
const CHEMIN_MIN = 3;
/** Une trace est forte à deux portes ou moins du repaire (spec §5.4). */
const TRACE_FORTE = 2;

const estPorteAnnexe = (liaison: DefLiaison): boolean => /^l-a\d+-/.test(liaison.id);
/** Annexe du catalogue d'une pièce d'annexe : 'a3-couchettes/p-piece' → 'a-couchettes'. */
const annexeDe = (piece: string): DefMorceau | undefined => ANNEXES.get(`a-${piece.slice(0, piece.indexOf('/')).replace(/^a\d+-/, '')}`);

function voisinage(liaisons: readonly DefLiaison[]): Map<string, string[]> {
  const voisines = new Map<string, string[]>();
  for (const { entre: [a, b] } of liaisons) {
    voisines.set(a, [...(voisines.get(a) ?? []), b]);
    voisines.set(b, [...(voisines.get(b) ?? []), a]);
  }
  return voisines;
}

/** Nombre de liaisons de chaque pièce atteinte à `depuis`, quels que soient leurs états. */
function distances(depuis: string, liaisons: readonly DefLiaison[]): Map<string, number> {
  const voisines = voisinage(liaisons);
  const vues = new Map([[depuis, 0]]);
  const file = [depuis];
  for (let tete = 0; tete < file.length; tete++) {
    const piece = file[tete];
    if (piece === undefined) break;
    for (const autre of voisines.get(piece) ?? []) {
      if (!vues.has(autre)) {
        vues.set(autre, (vues.get(piece) ?? 0) + 1);
        file.push(autre);
      }
    }
  }
  return vues;
}

/** Coupes de chaque morceau, retirées ensemble ; chaque cloison verrouillée, seule. */
function groupesDeCoupes(station: DefStation, liaisons: readonly DefLiaison[]): { readonly nom: string; readonly ids: ReadonlySet<string> }[] {
  const groupes = station.morceaux.flatMap((morceau) => {
    const ids = new Set(
      (morceau.grande?.coupe ?? []).flatMap((coupe) => (coupe === 'sortie' ? liaisons.filter((liaison) => liaison.id.startsWith(`l-${morceau.id}-`)).map((liaison) => liaison.id) : [prefixer(morceau.id, coupe)])),
    );
    return ids.size === 0 ? [] : [{ nom: morceau.id, ids }];
  });
  const groupees = new Set(groupes.flatMap((groupe) => [...groupe.ids]));
  for (const liaison of liaisons) if (liaison.verrouillee === true && !groupees.has(liaison.id)) groupes.push({ nom: liaison.id, ids: new Set([liaison.id]) });
  return groupes;
}

/** Écarts d'une grande station aux règles de la spec §7.3 ; vide si elle les tient. */
export function controlerGrande(entree: EntreeMonde, station: DefStation): string[] {
  const { monde, textes } = entree;
  const ecarts: string[] = [];
  const pieces = new Map(monde.pieces.map((piece) => [piece.id, piece]));
  const boucles = new Set(monde.boucles ?? []);
  const principales = monde.liaisons.filter((liaison) => !estPorteAnnexe(liaison) && !boucles.has(liaison.id));
  const accueillantes = new Map(station.morceaux.flatMap((morceau) => Object.entries(morceau.grande?.accueillantes ?? {}).map(([piece, categorie]) => [prefixer(morceau.id, piece), categorie] as const)));
  const portesAnnexes = monde.liaisons.filter(estPorteAnnexe);
  const accrocheDe = new Map(portesAnnexes.map((liaison) => [liaison.entre[1], liaison.entre[0]]));
  const bouclable = (piece: DefPiece | undefined): boolean => piece !== undefined && (piece.forme === 'couloir' || piece.forme === 'passage' || accueillantes.has(piece.id));

  // Coupes (GE-13) : ce qu'on n'atteint pas sans franchir une coupe sur le chemin principal reste hors d'atteinte, annexes et
  // boucles comprises.
  for (const groupe of groupesDeCoupes(station, monde.liaisons)) {
    const avantSurLeChemin = distances(monde.depart, principales.filter((liaison) => !groupe.ids.has(liaison.id)));
    const avantPartout = distances(monde.depart, monde.liaisons.filter((liaison) => !groupe.ids.has(liaison.id)));
    for (const piece of monde.pieces) {
      if (piece.forme === undefined && !avantSurLeChemin.has(piece.id) && avantPartout.has(piece.id)) ecarts.push(`Coupe ${groupe.nom} contournée : ${piece.id} atteinte sans la franchir.`);
    }
  }

  // Accroches (spec §6.1) et architecture (GE-09 à GE-11).
  for (const { entre: [accroche, piece] } of portesAnnexes) {
    const lieu = pieces.get(accroche);
    const declaration = annexeDe(piece)?.annexe;
    if (!accueillantes.has(accroche) && lieu?.forme !== 'couloir') ecarts.push(`Annexe ${piece} accrochée à ${accroche}, ni accueillante ni couloir du catalogue.`);
    if (declaration === undefined) {
      ecarts.push(`Annexe ${piece} absente du catalogue.`);
      continue;
    }
    const categorieDuLieu = lieu?.forme === 'couloir' ? accueillantes.get(accrocheDe.get(accroche) ?? '') : accueillantes.get(accroche);
    if (declaration.categorie === 'vie' && categorieDuLieu === 'technique') ecarts.push(`GE-09 : ${piece}, pièce de vie, s’atteint par une pièce technique.`);
    const { surCouloirDe } = declaration;
    if (surCouloirDe !== undefined) {
      const servieParLeCouloir = portesAnnexes.some((liaison) => liaison.entre[0] === accroche && annexeDe(liaison.entre[1])?.annexe?.etiquettes.includes(surCouloirDe) === true);
      if (lieu?.forme !== 'couloir' || !servieParLeCouloir) ecarts.push(`GE-10 : ${piece} n’est pas sur un couloir qui dessert une pièce « ${surCouloirDe} ».`);
    }
  }
  for (const piece of monde.pieces) {
    const servies = portesAnnexes.filter((liaison) => liaison.entre[0] === piece.id).length;
    if ((piece.forme === 'impasse' || piece.forme === 'passage') && servies > 0) ecarts.push(`${piece.id} : une ${piece.forme} ne dessert aucune pièce.`);
    if (piece.forme === 'couloir' && (servies < SERVIES_MIN || servies > SERVIES_MAX)) ecarts.push(`GE-11 : le couloir ${piece.id} dessert ${servies} pièces.`);
    const portes = monde.liaisons.filter((liaison) => liaison.entre.includes(piece.id)).length;
    if (portes > PORTES_MAX) ecarts.push(`PL-06 : ${piece.id} a ${portes} portes.`);
  }

  // Boucles (spec §6.4) : une à trois (D-295).
  if (boucles.size === 0) ecarts.push('Aucune porte de boucle (D-295).');
  if (boucles.size > 3) ecarts.push(`${boucles.size} portes de boucle, plus de trois (D-295).`);
  for (const id of boucles) {
    const liaison = monde.liaisons.find((candidate) => candidate.id === id);
    if (liaison === undefined) {
      ecarts.push(`Boucle ${id} absente des liaisons.`);
      continue;
    }
    const [a, b] = liaison.entre.map((piece) => pieces.get(piece));
    if (a?.segment !== b?.segment) ecarts.push(`Boucle ${id} entre deux segments.`);
    if (!bouclable(a) || !bouclable(b) || a?.forme === 'impasse' || b?.forme === 'impasse') ecarts.push(`Boucle ${id} sur une pièce qui ne peut pas en recevoir.`);
    if (liaison.entre.includes(station.creature)) ecarts.push(`Boucle ${id} sur la pièce de la créature.`);
    const sansElle = distances(liaison.entre[0], monde.liaisons.filter((autre) => autre.id !== id)).get(liaison.entre[1]) ?? Infinity;
    if (sansElle < CHEMIN_MIN) ecarts.push(`Boucle ${id} : cycle de ${sansElle + 1} pièces, moins de quatre.`);
  }

  // Vestibule (D-257) : une seule porte, aucun objet.
  if (monde.liaisons.filter((liaison) => liaison.entre.includes(monde.depart)).length !== 1) ecarts.push('Vestibule : plus d’une porte.');
  if (monde.objets.some((objet) => objet.piece === monde.depart)) ecarts.push('Vestibule : un objet.');

  // Piste (spec §5.4) : un plus court chemin de l'origine au repaire, par des passages que la créature franchit.
  const marquees = monde.pieces.filter((piece) => piece.trace !== undefined);
  if (marquees.some((piece) => piece.id === monde.depart)) ecarts.push('Piste : une trace dans la pièce de départ.');
  const parcourables = new Set(monde.pieces.filter((piece) => piece.feu !== true && piece.sousPosition !== true).map((piece) => piece.id));
  const passages = monde.liaisons.filter((liaison) => franchissable(liaison) && liaison.entre.every((piece) => parcourables.has(piece)));
  const auRepaire = distances(station.creature, passages);
  const origine = marquees.reduce<DefPiece | undefined>((loin, piece) => ((auRepaire.get(piece.id) ?? -1) > (auRepaire.get(loin?.id ?? '') ?? -1) ? piece : loin), undefined);
  if (origine !== undefined) {
    const longueur = auRepaire.get(origine.id) ?? Infinity;
    const depuisOrigine = distances(origine.id, passages);
    for (const piece of marquees) {
      const dRepaire = auRepaire.get(piece.id) ?? Infinity;
      if ((depuisOrigine.get(piece.id) ?? Infinity) + dRepaire !== longueur) ecarts.push(`Piste : ${piece.id} marquée hors du plus court chemin.`);
      if (piece.trace !== (dRepaire <= TRACE_FORTE ? 'forte' : 'legere')) ecarts.push(`Piste : ${piece.id}, trace ${piece.trace} à ${dRepaire} portes du repaire.`);
    }
  }

  // Taille (D-290) et noms (NP-04).
  const dessinees = monde.pieces.filter((piece) => piece.plan !== undefined).length;
  if (dessinees < PIECES_MIN || dessinees > PIECES_MAX) ecarts.push(`Taille : ${dessinees} pièces dessinées.`);
  const noms = monde.pieces.map((piece) => textes.noms[piece.nom]?.texte ?? piece.nom);
  for (const nom of new Set(noms)) if (noms.filter((autre) => autre === nom).length > 1) ecarts.push(`Nom affiché en double : ${nom}.`);
  return ecarts;
}
