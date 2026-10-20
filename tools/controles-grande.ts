import { franchissable, prefixer, type DefLiaison, type DefMorceau, type DefPiece, type DefStation } from '../engine';
import { PIECES_CATALOGUE, type EntreeMonde } from '../content';

// Contrôles structurels d'une grande station (spec 2026-10-18 §7.3) : des parcours de graphe, sans recherche d'états, rapides
// sur chaque station publiée. La preuve de jeu (vérifieur) vient ensuite.

const ANNEXES = new Map(PIECES_CATALOGUE.map((morceau) => [morceau.id, morceau]));
// Spec §4.1 : de 21 à 28 pièces dessinées ; `piecesMin` du contenu écarte les graines dont le plan, reprise de couverture comprise, en compterait moins.
const PIECES_MIN = 21;
const PIECES_MAX = 28;
const PORTES_MAX = 6;
const SERVIES_MIN = 2;
const SERVIES_MAX = 4;
/** Une porte de boucle ferme un cycle d'au moins quatre pièces : trois liaisons au moins entre ses deux bouts sans elle. */
const CHEMIN_MIN = 3;
/** Une trace est forte à deux portes ou moins du repaire (spec §5.4). */
const TRACE_FORTE = 2;
/** Champs permis à un butin (spec §6.6) : ses seuls effets sont ses actions, aucune qualité passive. */
const CHAMPS_BUTIN = new Set(['id', 'nom', 'piece', 'butin', 'soin', 'glissant']);
/** La burette de réserve rendrait triviale la coupe de M-04 si on l'atteignait avant elle (spec §6.6). */
const COUPE_DU_GLISSANT = 'm-04';
/** Note de rangement de la trousse : son emplacement ne désigne aucune clé de morceau. */
const CLE_TROUSSE = 'butin:soin';
/** Tiers du trajet où se lit chaque étape de la menace : 1 et 2 au premier, 3 au deuxième, 4 au dernier (spec §8.4). */
const TIERS = ['premier', 'deuxième', 'dernier'] as const;
const TIER_DE_L_ETAPE = { 1: 0, 2: 0, 3: 1, 4: 2 } as const;

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

  // Clés dispersées (spec §6.5) : dans leur pièce d'origine, ou dans une annexe d'une de leurs étiquettes, dans la zone avant de
  // leur morceau ou de celui d'où part son entrée ; en ordre libre, une branche dans la zone du vestibule, sous elle-même ou
  // sous le carrefour.
  const enChaine = (piece: string): string[] => {
    const chaine: string[] = [];
    for (let haut = accrocheDe.get(piece); haut !== undefined; haut = accrocheDe.get(haut)) chaine.push(haut);
    return chaine;
  };
  const etiquettesAnnexe = (piece: string): readonly string[] => (pieces.get(piece)?.forme === undefined ? [] : (annexeDe(piece)?.annexe?.etiquettes ?? []));
  const zone = (piece: string): number[] => {
    const segment = pieces.get(piece)?.segment;
    return segment === undefined ? [] : [segment];
  };
  const zonesAvant = (morceau: DefMorceau | undefined): number[] => morceau?.grande?.avant.flatMap((piece) => zone(prefixer(morceau.id, piece))) ?? [];
  const carrefour = station.morceaux.find((morceau) => morceau.famille === 'carrefour');
  // Pièces d'où l'on apporte un objet large à l'intérieur d'une capsule, par des passages ni étroits, ni vides, ni hauts, ni cachés.
  const larges = monde.liaisons.filter((liaison) => liaison.etroite !== true && liaison.gouffre !== true && liaison.haute === undefined && liaison.cachee === undefined);
  const apportables = new Set(monde.objets.flatMap((objet) => (objet.capsule === undefined ? [] : [...distances(objet.capsule.interieur, larges).keys()])));
  const cles = station.morceaux.flatMap((morceau, rang) => {
    const accroche = station.accroches?.find((candidate) => candidate.vers === morceau.id);
    const precedent = accroche === undefined ? station.morceaux[rang - 1] : station.morceaux.find((candidat) => candidat.id === accroche.depuis);
    const branche = carrefour !== undefined && accroche?.depuis === carrefour.id && accroche.piece === carrefour.entree;
    const zones = branche ? zone(monde.depart) : [...zonesAvant(morceau), ...zonesAvant(precedent)];
    return Object.entries(morceau.grande?.cles ?? {}).flatMap(([id, cle]) => {
      const objet = monde.objets.find((candidat) => candidat.id === prefixer(morceau.id, id));
      const origine = morceau.objets.find((candidat) => candidat.id === id)?.piece;
      if (objet === undefined || origine === undefined) {
        ecarts.push(`Clé ${prefixer(morceau.id, id)} absente.`);
        return [];
      }
      const deplacee = objet.piece !== prefixer(morceau.id, origine);
      if (deplacee) {
        const racine = enChaine(objet.piece).at(-1) ?? objet.piece;
        const sousSaBranche = !branche || [morceau.id, carrefour.id].includes(racine.slice(0, racine.indexOf('/')));
        if (!etiquettesAnnexe(objet.piece).some((etiquette) => cle.etiquettes.includes(etiquette))) ecarts.push(`Clé ${objet.id} dans ${objet.piece} : ni sa pièce d’origine, ni une annexe d’une de ses étiquettes.`);
        if (!zone(objet.piece).some((segment) => zones.includes(segment)) || !sousSaBranche) ecarts.push(`Clé ${objet.id} dans ${objet.piece}, hors de sa zone permise.`);
        if (objet.large === true && !apportables.has(objet.piece)) ecarts.push(`Clé large ${objet.id} dans ${objet.piece}, d’où on ne l’apporte pas à la capsule.`);
      }
      return [{ objet, morceau: morceau.id, deplacee, origine: prefixer(morceau.id, origine) }];
    });
  });
  const encombrantes = cles.filter((cle) => cle.deplacee && cle.objet.encombrant === true).map((cle) => cle.objet.id);
  if (encombrantes.length > 1) ecarts.push(`Plus d’une clé encombrante déplacée : ${encombrantes.join(', ')}.`);
  for (const piece of new Set(cles.map((cle) => cle.objet.piece))) {
    const morceaux = new Set(cles.filter((cle) => cle.objet.piece === piece).map((cle) => cle.morceau));
    if (morceaux.size > 1) ecarts.push(`Clés de morceaux différents dans ${piece} : ${[...morceaux].join(', ')}.`);
  }

  // Butin (spec §6.6) : sans qualité passive, seulement dans une salle de butin, impasse du catalogue d'étiquette butin, garnie ;
  // une pièce pillée est une salle de butin vide.
  const salleDeButin = (piece: string): boolean => pieces.get(piece)?.forme === 'impasse' && etiquettesAnnexe(piece).includes('butin');
  const butins = monde.objets.filter((objet) => objet.butin === true);
  const coupeDuGlissant = station.morceaux.some((morceau) => morceau.id === COUPE_DU_GLISSANT) ? groupesDeCoupes(station, monde.liaisons).find((groupe) => groupe.nom === COUPE_DU_GLISSANT) : undefined;
  const sansLaCoupe = coupeDuGlissant === undefined ? undefined : distances(monde.depart, monde.liaisons.filter((liaison) => !coupeDuGlissant.ids.has(liaison.id)));
  for (const objet of butins) {
    for (const champ of Object.keys(objet)) if (!CHAMPS_BUTIN.has(champ)) ecarts.push(`Butin ${objet.id} : qualité passive ${champ}.`);
    if (!salleDeButin(objet.piece) || pieces.get(objet.piece)?.pillee === true) ecarts.push(`Butin ${objet.id} dans ${objet.piece}, hors d’une salle de butin garnie.`);
    if (objet.glissant !== undefined && sansLaCoupe?.has(objet.piece) === true) ecarts.push(`Butin ${objet.id} dans ${objet.piece} : glissant, atteint sans franchir la coupe de ${COUPE_DU_GLISSANT}.`);
  }
  for (const piece of monde.pieces) {
    if (piece.pillee === true && (!salleDeButin(piece.id) || monde.objets.some((objet) => objet.piece === piece.id))) ecarts.push(`${piece.id} pillée : ni salle de butin du catalogue, ni vide.`);
  }
  // La première salle pend à la piste, directement ou par des couloirs du catalogue, dès qu'une impasse de butin sans clé y pend.
  const salles = new Set([...monde.pieces.filter((piece) => piece.pillee === true).map((piece) => piece.id), ...butins.map((objet) => objet.piece)]);
  const surLaPiste = (piece: string): boolean =>
    salleDeButin(piece) && !cles.some((cle) => cle.objet.piece === piece) && enChaine(piece).some((haut) => pieces.get(haut)?.trace !== undefined);
  if (station.grande?.butin !== undefined && monde.pieces.some((piece) => surLaPiste(piece.id)) && ![...salles].some(surLaPiste)) ecarts.push('Butin : aucune salle de butin accrochée à la piste.');

  // Documents (spec §8.4, §7.3), relus dans le monde construit sans rien demander à la pose. Le vestibule, sans objet, n'en reçoit
  // aucun (contrôle ci-dessous).
  const reserve = station.grande?.documents;
  if (reserve !== undefined) {
    const docs = monde.objets.flatMap((objet) => {
      if (objet.document !== true) return [];
      const place = reserve.emplacements.find((emplacement) => emplacement.id === objet.nom);
      if (place === undefined) ecarts.push(`Document ${objet.nom} dans ${objet.piece} : absent de la réserve.`);
      return place === undefined ? [] : [{ objet, place }];
    });
    const deplacees = cles.filter((cle) => cle.deplacee);
    const [min, max] = [reserve.parStation[0], Math.max(reserve.parStation[1], deplacees.length + 1)];
    if (docs.length < min || docs.length > max) ecarts.push(`Documents : ${docs.length}, hors de ${min} à ${max}.`);

    // Pièce face d'un morceau : le bout, côté avant, d'une de ses coupes ; l'annexe qui y pend, par des couloirs au besoin, y est rattachée.
    const coupes = groupesDeCoupes(station, monde.liaisons);
    const faces = new Map(
      station.morceaux.flatMap((morceau) => {
        const avant = new Set(zonesAvant(morceau));
        const ids = coupes.find((groupe) => groupe.nom === morceau.id)?.ids;
        const face = monde.liaisons.filter((liaison) => ids?.has(liaison.id) === true).flatMap((liaison) => liaison.entre).find((piece) => zone(piece).some((segment) => avant.has(segment)));
        return face === undefined ? [] : [[morceau.id, face] as const];
      }),
    );
    const auFace = (piece: string, morceau: string): boolean => {
      const face = faces.get(morceau);
      return face !== undefined && (piece === face || (pieces.get(piece)?.forme !== undefined && enChaine(piece).at(-1) === face));
    };
    // Rang d'une pièce : les portes depuis le départ, toutes liaisons ; les tiers se mesurent comme la pose (§8.4).
    const rang = distances(monde.depart, monde.liaisons);
    const rangDe = (piece: string): number => rang.get(piece) ?? 0;
    const plusLoin = Math.max(0, ...monde.pieces.filter((piece) => piece.plan !== undefined && piece.feu !== true && piece.pillee !== true).map((piece) => rangDe(piece.id)));
    const tiers = (piece: string): 0 | 1 | 2 => (rangDe(piece) * 3 <= plusLoin ? 0 : rangDe(piece) * 3 <= plusLoin * 2 ? 1 : 2);
    const trousse = monde.objets.find((objet) => objet.butin === true && objet.soin !== undefined);
    const puceDe = (nom: string): string => textes.documents[nom]?.puce.texte ?? nom;
    const menace = docs.flatMap(({ objet, place }) => (place.couche === 'menace' && place.etape !== undefined ? [{ objet, etape: place.etape }] : []));

    docs.forEach(({ objet, place }, indice) => {
      const ici = `Document ${objet.nom} dans ${objet.piece}`;
      const avant = docs.slice(0, indice);
      if (pieces.get(objet.piece)?.pillee === true) ecarts.push(`${ici} : salle pillée.`);
      const voisin = avant.find((autre) => autre.objet.piece === objet.piece);
      if (voisin !== undefined) ecarts.push(`${ici} : la pièce porte déjà ${voisin.objet.nom}.`);
      const memePuce = avant.find((autre) => puceDe(autre.objet.nom) === puceDe(objet.nom));
      if (memePuce !== undefined) ecarts.push(`${ici} : nom de puce « ${puceDe(objet.nom)} » déjà pris par ${memePuce.objet.nom}.`);

      if (place.couche === 'univers' && !etiquettesAnnexe(objet.piece).some((etiquette) => place.etiquettes?.includes(etiquette) === true)) ecarts.push(`${ici} : pas une pièce du catalogue portant l’une de ses étiquettes.`);

      if (place.couche === 'morceau') {
        const morceau = place.morceau ?? '';
        if (!station.morceaux.some((candidat) => candidat.id === morceau)) ecarts.push(`${ici} : le morceau ${morceau} n’est pas dans la station.`);
        else if (!auFace(objet.piece, morceau)) ecarts.push(`${ici} : ni la pièce face de ${morceau}, ni une annexe qui y pend.`);
        const autre = avant.find((precedent) => precedent.place.couche === 'morceau' && precedent.place.morceau === morceau);
        if (autre !== undefined) ecarts.push(`${ici} : le morceau ${morceau} a déjà ${autre.objet.nom}.`);
      }

      // Note de rangement : d'une clé déplacée, dans la face, son origine ou une annexe de la face ; de la trousse, dans le catalogue.
      if (place.couche === 'rangement' && place.morceau !== undefined) {
        const id = prefixer(place.morceau, place.cle ?? '');
        const cle = deplacees.find((candidate) => candidate.objet.id === id);
        if (cle === undefined) ecarts.push(`${ici} : la clé ${id} n’est pas déplacée.`);
        else {
          if (!auFace(objet.piece, cle.morceau) && objet.piece !== cle.origine) ecarts.push(`${ici} : ni la pièce face de ${cle.morceau}, ni l’origine de ${id}, ni une annexe qui pend à la face.`);
          if (objet.designe !== cle.objet.piece) ecarts.push(`${ici} : désigne ${objet.designe ?? 'rien'}, la clé ${id} est dans ${cle.objet.piece}.`);
        }
      }
      if (place.couche === 'rangement' && place.morceau === undefined && place.cle === CLE_TROUSSE) {
        if (trousse === undefined) ecarts.push(`${ici} : aucune trousse dans la station.`);
        else {
          if (pieces.get(objet.piece)?.forme === undefined || objet.piece === trousse.piece) ecarts.push(`${ici} : hors du catalogue, ou dans la pièce de la trousse.`);
          if (objet.designe !== trousse.piece) ecarts.push(`${ici} : désigne ${objet.designe ?? 'rien'}, la trousse est dans ${trousse.piece}.`);
        }
      }
    });
    for (const cle of deplacees) {
      const note = docs.some(({ place }) => place.couche === 'rangement' && place.morceau !== undefined && prefixer(place.morceau, place.cle ?? '') === cle.objet.id);
      if (!note) ecarts.push(`Clé ${cle.objet.id} déplacée : note de rangement absente.`);
    }

    // Menace : chaque étape au plus une fois, dans le tiers du trajet de son étape, jamais plus loin qu'une étape plus haute.
    menace.forEach(({ objet, etape }, indice) => {
      const ici = `Document ${objet.nom} dans ${objet.piece}`;
      const deja = menace.slice(0, indice).find((autre) => autre.etape === etape);
      if (deja !== undefined) ecarts.push(`${ici} : étape ${etape} déjà posée avec ${deja.objet.nom}.`);
      if (tiers(objet.piece) !== TIER_DE_L_ETAPE[etape]) ecarts.push(`${ici} : étape ${etape} au ${TIERS[tiers(objet.piece)]} tiers du trajet, attendue au ${TIERS[TIER_DE_L_ETAPE[etape]]}.`);
      for (const apres of menace) if (apres.etape > etape && rangDe(apres.objet.piece) < rangDe(objet.piece)) ecarts.push(`${ici} : étape ${etape} plus loin sur le trajet que l’étape ${apres.etape}.`);
    });

    // Couverture (§7.3) : une pièce du catalogue porte un objet, une salle de butin (pillée comprise), un bout de porte de boucle ou une trace.
    const portent = new Set([
      ...monde.objets.map((objet) => objet.piece),
      ...monde.pieces.filter((piece) => piece.pillee === true || piece.trace !== undefined).map((piece) => piece.id),
      ...monde.liaisons.filter((liaison) => boucles.has(liaison.id)).flatMap((liaison) => liaison.entre),
    ]);
    for (const piece of monde.pieces) if (piece.forme !== undefined && !portent.has(piece.id)) ecarts.push(`${piece.id} : ne porte rien (couverture, spec §7.3).`);
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

  // Taille (D-290) et noms (NP-04), objets compris.
  const dessinees = monde.pieces.filter((piece) => piece.plan !== undefined).length;
  if (dessinees < PIECES_MIN || dessinees > PIECES_MAX) ecarts.push(`Taille : ${dessinees} pièces dessinées.`);
  // Deux objets d'une même clé de nom sont une même chose (les deux interrupteurs de gravité de M-09, D-238) : un seul nom.
  const noms = [...monde.pieces.map((piece) => piece.nom), ...new Set(monde.objets.map((objet) => objet.nom))].map((nom) => textes.noms[nom]?.texte ?? nom);
  for (const nom of new Set(noms)) if (noms.filter((autre) => autre === nom).length > 1) ecarts.push(`Nom affiché en double : ${nom}.`);
  return ecarts;
}
