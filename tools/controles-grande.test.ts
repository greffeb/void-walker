import { describe, expect, it } from 'vitest';
import type { DefMonde, DefObjet, DefStation, EmplacementDocument } from '../engine';
import { PIECES_CATALOGUE, type CompositionGrande, type EntreeMonde } from '../content';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { controlerGrande } from './controles-grande';
import { CATALOGUE } from './catalogue';

// Contrôles structurels des grandes stations (spec 2026-10-18 §7.3) : parcours de graphe, sans recherche d'états.

interface Construite {
  readonly entree: EntreeMonde;
  readonly station: DefStation;
}

function construire(composition: string, graine: number): Construite | null {
  const entree = CATALOGUE.construireGrande(composition, graine);
  const station = CATALOGUE.definirGrande(composition, graine);
  return 'refus' in entree || 'refus' in station ? null : { entree, station };
}

/** Première station construite d'une composition du filtre où `trouver` rend quelque chose, et ce qu'il rend. */
function chercher<T>(filtre: (composition: CompositionGrande) => boolean, trouver: (construite: Construite) => T | undefined): { readonly construite: Construite; readonly trouve: T } {
  for (const composition of CATALOGUE.grandes.filter((candidate) => candidate.refus === null && filtre(candidate))) {
    for (let graine = 0; graine < 20; graine++) {
      const construite = construire(composition.id, graine);
      const trouve = construite === null ? undefined : trouver(construite);
      if (construite !== null && trouve !== undefined) return { construite, trouve };
    }
  }
  throw new Error('Aucune grande station pour ce filtre.');
}

const premiere = (filtre: (composition: CompositionGrande) => boolean): Construite => chercher(filtre, () => true).construite;

const modifier = ({ entree, station }: Construite, monde: (monde: DefMonde) => DefMonde): Construite => ({ entree: { ...entree, monde: monde(entree.monde) }, station });

interface Cle {
  readonly objet: string;
  readonly morceau: string;
  readonly etiquettes: readonly string[];
}

const clesDe = (station: DefStation): Cle[] =>
  station.morceaux.flatMap((morceau) => Object.entries(morceau.grande?.cles ?? {}).map(([id, cle]) => ({ objet: `${morceau.id}/${id}`, morceau: morceau.id, etiquettes: cle.etiquettes })));
/** Étiquettes d'une annexe : 'a3-couchettes/p-piece' → celles de 'a-couchettes'. */
const etiquettesDe = (piece: string): readonly string[] => PIECES_CATALOGUE.find((annexe) => annexe.id === `a-${piece.slice(0, piece.indexOf('/')).replace(/^a\d+-/, '')}`)?.annexe?.etiquettes ?? [];
const compatible = (cle: Cle, piece: string): boolean => etiquettesDe(piece).some((etiquette) => cle.etiquettes.includes(etiquette));
const annexes = (monde: DefMonde, forme?: string): string[] => monde.pieces.filter((piece) => piece.forme !== undefined && (forme === undefined || piece.forme === forme)).map((piece) => piece.id);
const segment = (monde: DefMonde, piece: string): number | undefined => monde.pieces.find((candidate) => candidate.id === piece)?.segment;
const deplacer = (monde: DefMonde, objet: string, piece: string): DefMonde => ({ ...monde, objets: monde.objets.map((candidat) => (candidat.id === objet ? { ...candidat, piece } : candidat)) });
/** Pièces où pend une annexe, en remontant les couloirs du catalogue jusqu'au chemin principal. */
function accrochesDe(monde: DefMonde, piece: string): string[] {
  const haut = new Map(monde.liaisons.filter((liaison) => /^l-a\d+-/.test(liaison.id)).map((liaison) => [liaison.entre[1], liaison.entre[0]]));
  const chaine: string[] = [];
  for (let suivante = haut.get(piece); suivante !== undefined; suivante = haut.get(suivante)) chaine.push(suivante);
  return chaine;
}

interface Doc {
  readonly objet: DefObjet;
  readonly place: EmplacementDocument;
}

const emplacementsDe = (station: DefStation): readonly EmplacementDocument[] => station.grande?.documents?.emplacements ?? [];
/** Documents posés d'une station construite, avec leur place dans la réserve. */
const documentsDe = ({ entree: { monde }, station }: Construite): Doc[] =>
  monde.objets.flatMap((objet) => {
    const place = emplacementsDe(station).find((emplacement) => emplacement.id === objet.nom);
    return objet.document === true && place !== undefined ? [{ objet, place }] : [];
  });
const notesDeCles = (docs: readonly Doc[]): Doc[] => docs.filter(({ place }) => place.couche === 'rangement' && place.morceau !== undefined);
const sans = (monde: DefMonde, ...ids: string[]): DefMonde => ({ ...monde, objets: monde.objets.filter((objet) => !ids.includes(objet.id)) });
/** Pose un document de plus, de la réserve, dans `piece`. */
const ajouter = (monde: DefMonde, emplacement: EmplacementDocument, piece: string): DefMonde => ({
  ...monde,
  objets: [...monde.objets, { id: `o-doc-9${monde.objets.length}`, nom: emplacement.id, piece, portable: false, document: true }],
});

describe('contrôles structurels des grandes stations (spec 2026-10-18 §7.3)', () => {
  it.each([
    ['chaîne, M-08', (composition: CompositionGrande) => composition.forme === 'chaine' && composition.chemins.includes('m-08')],
    ['chaîne, M-10 en troisième', (composition: CompositionGrande) => composition.forme === 'chaine' && composition.chemins[2] === 'm-10'],
    ['chaîne, final M-06', (composition: CompositionGrande) => composition.forme === 'chaine' && composition.final === 'm-06'],
    ['ordre libre', (composition: CompositionGrande) => composition.forme === 'libre'],
    ['ordre libre, M-05 en troisième', (composition: CompositionGrande) => composition.forme === 'libre' && composition.chemins[2] === 'm-05'],
  ])('%s : une station construite passe tous les contrôles', (_cas, filtre) => {
    const { entree, station } = premiere(filtre);
    expect(controlerGrande(entree, station)).toEqual([]);
  });

  it('une boucle à travers la coupe de M-08 est signalée', () => {
    const construite = premiere((composition) => composition.chemins.includes('m-08'));
    const fautive = modifier(construite, (monde) => ({
      ...monde,
      liaisons: [...monde.liaisons, { id: 'l-boucle-9', nom: 'porte', entre: ['m-08/p-quartiers', 'm-08/p-magasin'], ouverte: false }],
      boucles: [...(monde.boucles ?? []), 'l-boucle-9'],
    }));
    expect(controlerGrande(fautive.entree, fautive.station).some((ecart) => /coupe/i.test(ecart))).toBe(true);
  });

  it('une station sans porte de boucle est signalée (D-295)', () => {
    const construite = premiere(() => true);
    const boucles = new Set(construite.entree.monde.boucles);
    const fautive = modifier(construite, (monde) => ({ ...monde, liaisons: monde.liaisons.filter((liaison) => !boucles.has(liaison.id)), boucles: [] }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain('Aucune porte de boucle (D-295).');
  });

  it('une station à plus de trois portes de boucle est signalée (D-295)', () => {
    const construite = premiere(() => true);
    const fautive = modifier(construite, (monde) => ({ ...monde, boucles: ['l-boucle-1', 'l-boucle-2', 'l-boucle-3', 'l-boucle-4'] }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain('4 portes de boucle, plus de trois (D-295).');
  });

  it('ordre libre : l’entrée de chaque branche est dans la zone du couloir commun ; seules les cloisons et les obstacles coupent', () => {
    const { entree } = premiere((composition) => composition.forme === 'libre');
    const segment = (id: string): number | undefined => entree.monde.pieces.find((piece) => piece.id === id)?.segment;
    const couloir = segment('carrefour/p-couloir');
    const entrees = entree.monde.liaisons.filter((liaison) => liaison.id.startsWith('l-carrefour-') && liaison.verrouillee !== true).map((liaison) => liaison.entre[1]);
    expect(entrees).toHaveLength(2);
    for (const piece of entrees) expect(segment(piece), piece).toBe(couloir);
  });

  it('une annexe accrochée à la chambre froide est signalée', () => {
    const construite = premiere((composition) => composition.chemins.includes('m-10'));
    const fautive = modifier(construite, (monde) => {
      const porte = monde.liaisons.find((liaison) => /^l-a\d+-/.test(liaison.id));
      if (porte === undefined) throw new Error('Aucune annexe.');
      return { ...monde, liaisons: monde.liaisons.map((liaison) => (liaison === porte ? { ...liaison, entre: ['m-10/p-chambre', liaison.entre[1]] } : liaison)) };
    });
    expect(controlerGrande(fautive.entree, fautive.station).some((ecart) => /accroch/.test(ecart))).toBe(true);
  });

  it('une trace dans le vestibule est signalée', () => {
    const construite = premiere(() => true);
    const fautive = modifier(construite, (monde) => ({ ...monde, pieces: monde.pieces.map((piece) => (piece.id === monde.depart ? { ...piece, trace: 'legere' as const } : piece)) }));
    expect(controlerGrande(fautive.entree, fautive.station).some((ecart) => /trace/.test(ecart))).toBe(true);
  });

  it('une clé posée dans une annexe sans étiquette commune est signalée (spec §6.5)', () => {
    const { construite, trouve } = chercher(
      () => true,
      ({ entree, station }) => clesDe(station).flatMap((cle) => annexes(entree.monde).filter((piece) => !compatible(cle, piece)).map((piece) => ({ cle, piece })))[0],
    );
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.cle.objet, trouve.piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Clé ${trouve.cle.objet} dans ${trouve.piece} : ni sa pièce d’origine, ni une annexe d’une de ses étiquettes.`);
  });

  it('en chaîne, une clé du final posée dans la zone du vestibule est signalée (spec §6.5)', () => {
    const { construite, trouve } = chercher(
      (composition) => composition.forme === 'chaine',
      ({ entree: { monde }, station }) =>
        clesDe(station)
          .filter((cle) => cle.morceau === station.morceaux.at(-1)?.id)
          .flatMap((cle) => annexes(monde).filter((piece) => compatible(cle, piece) && segment(monde, piece) === segment(monde, monde.depart)).map((piece) => ({ cle, piece })))[0],
    );
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.cle.objet, trouve.piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Clé ${trouve.cle.objet} dans ${trouve.piece}, hors de sa zone permise.`);
  });

  it('ordre libre : la clé d’une branche dans une annexe pendue à l’autre branche est signalée (spec §6.5)', () => {
    const { construite, trouve } = chercher(
      (composition) => composition.forme === 'libre',
      ({ entree: { monde }, station }) => {
        const [, , a, b] = station.morceaux;
        const autre = new Map([[a?.id, b?.id], [b?.id, a?.id]]);
        return clesDe(station)
          .filter((cle) => autre.has(cle.morceau))
          .flatMap((cle) =>
            annexes(monde)
              .filter((piece) => compatible(cle, piece) && segment(monde, piece) === segment(monde, monde.depart) && accrochesDe(monde, piece).at(-1)?.startsWith(`${autre.get(cle.morceau)}/`) === true)
              .map((piece) => ({ cle, piece })),
          )[0];
      },
    );
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.cle.objet, trouve.piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Clé ${trouve.cle.objet} dans ${trouve.piece}, hors de sa zone permise.`);
  });

  it('le bloc, large, déplacé derrière un passage étroit est signalé (spec §6.5)', () => {
    // Une impasse pendue au final : rien d'étroit entre elle et la capsule.
    const { construite, trouve } = chercher(
      (composition) => composition.final === 'm-03',
      ({ entree: { monde } }) => annexes(monde, 'impasse').find((piece) => accrochesDe(monde, piece).at(-1)?.startsWith('m-03/') === true),
    );
    const ecart = `Clé large m-03/o-bloc dans ${trouve}, d’où on ne l’apporte pas à la capsule.`;
    const deplace = modifier(construite, (monde) => deplacer(monde, 'm-03/o-bloc', trouve));
    expect(controlerGrande(deplace.entree, deplace.station)).not.toContain(ecart);
    // La seule porte de l'impasse devient étroite : le bloc n'en sort plus.
    const fautive = modifier(deplace, (monde) => ({ ...monde, liaisons: monde.liaisons.map((liaison) => (liaison.entre.includes(trouve) ? { ...liaison, etroite: true } : liaison)) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(ecart);
  });

  it('deux clés encombrantes déplacées sont signalées (spec §6.5)', () => {
    const { construite, trouve } = chercher(
      () => true,
      ({ entree: { monde }, station }) => {
        const encombrantes = clesDe(station).filter((cle) => monde.objets.find((objet) => objet.id === cle.objet)?.encombrant === true);
        const [une, autre] = annexes(monde, 'impasse');
        return encombrantes.length >= 2 && autre !== undefined ? { encombrantes, une, autre } : undefined;
      },
    );
    const [a, b] = trouve.encombrantes;
    const fautive = modifier(construite, (monde) => deplacer(deplacer(monde, a!.objet, trouve.une!), b!.objet, trouve.autre));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Plus d’une clé encombrante déplacée : ${a!.objet}, ${b!.objet}.`);
  });

  it('deux clés de morceaux différents dans une même pièce sont signalées (spec §6.5)', () => {
    const construite = premiere(() => true);
    const [cle, ...autres] = clesDe(construite.station);
    const autre = autres.find((candidate) => candidate.morceau !== cle!.morceau)!;
    const piece = annexes(construite.entree.monde, 'impasse')[0]!;
    const fautive = modifier(construite, (monde) => deplacer(deplacer(monde, cle!.objet, piece), autre.objet, piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Clés de morceaux différents dans ${piece} : ${cle!.morceau}, ${autre.morceau}.`);
  });

  it('un butin porteur d’une qualité passive est signalé (spec §6.6)', () => {
    const { construite, trouve } = chercher(() => true, ({ entree }) => entree.monde.objets.find((objet) => objet.butin === true));
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: monde.objets.map((objet) => (objet.id === trouve.id ? { ...objet, appui: true } : objet)) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Butin ${trouve.id} : qualité passive appui.`);
  });

  it('un butin hors d’une salle de butin est signalé (spec §6.6)', () => {
    const { construite, trouve } = chercher(() => true, ({ entree }) => entree.monde.objets.find((objet) => objet.butin === true));
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.id, construite.station.creature));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Butin ${trouve.id} dans ${construite.station.creature}, hors d’une salle de butin garnie.`);
  });

  it('une pièce pillée qui n’est pas une salle de butin vide est signalée (spec §6.6)', () => {
    const { construite, trouve } = chercher(() => true, ({ entree }) => entree.monde.objets.find((objet) => objet.butin === true));
    const { creature } = construite.station;
    const fautive = modifier(construite, (monde) => ({ ...monde, pieces: monde.pieces.map((piece) => (piece.id === creature || piece.id === trouve.piece ? { ...piece, pillee: true as const } : piece)) }));
    const ecarts = controlerGrande(fautive.entree, fautive.station);
    expect(ecarts).toContain(`${creature} pillée : ni salle de butin du catalogue, ni vide.`);
    expect(ecarts).toContain(`${trouve.piece} pillée : ni salle de butin du catalogue, ni vide.`);
  });

  it('un butin ou une pièce pillée dans une impasse sans étiquette butin est signalé (spec §6.6)', () => {
    const { construite, trouve } = chercher(
      () => true,
      ({ entree: { monde } }) => {
        const butin = monde.objets.find((objet) => objet.butin === true);
        const impasse = annexes(monde, 'impasse').find((piece) => !etiquettesDe(piece).includes('butin') && !monde.objets.some((objet) => objet.piece === piece));
        return butin === undefined || impasse === undefined ? undefined : { butin, impasse };
      },
    );
    const garnie = modifier(construite, (monde) => deplacer(monde, trouve.butin.id, trouve.impasse));
    expect(controlerGrande(garnie.entree, garnie.station)).toContain(`Butin ${trouve.butin.id} dans ${trouve.impasse}, hors d’une salle de butin garnie.`);
    const pillee = modifier(construite, (monde) => ({ ...monde, pieces: monde.pieces.map((piece) => (piece.id === trouve.impasse ? { ...piece, pillee: true as const } : piece)) }));
    expect(controlerGrande(pillee.entree, pillee.station)).toContain(`${trouve.impasse} pillée : ni salle de butin du catalogue, ni vide.`);
  });

  it('un butin ou une pièce pillée dans une annexe d’étiquette butin qui n’est pas une impasse est signalé (spec §6.6)', () => {
    // Aucune annexe d'étiquette butin n'est un passage au catalogue : une salle garnie et une salle pillée le deviennent.
    const { construite, trouve } = chercher(
      () => true,
      ({ entree: { monde } }) => {
        const butin = monde.objets.find((objet) => objet.butin === true);
        const pillee = monde.pieces.find((piece) => piece.pillee === true)?.id;
        return butin === undefined || pillee === undefined ? undefined : { butin, pillee };
      },
    );
    const fautive = modifier(construite, (monde) => ({
      ...monde,
      pieces: monde.pieces.map((piece) => (piece.id === trouve.butin.piece || piece.id === trouve.pillee ? { ...piece, forme: 'passage' as const } : piece)),
    }));
    const ecarts = controlerGrande(fautive.entree, fautive.station);
    expect(ecarts).toContain(`Butin ${trouve.butin.id} dans ${trouve.butin.piece}, hors d’une salle de butin garnie.`);
    expect(ecarts).toContain(`${trouve.pillee} pillée : ni salle de butin du catalogue, ni vide.`);
  });

  it('une burette de réserve atteinte sans franchir la coupe de M-04 est signalée (spec §6.6)', () => {
    const { construite, trouve } = chercher(
      (composition) => composition.chemins.includes('m-04'),
      ({ entree: { monde } }) =>
        annexes(monde, 'impasse').find(
          (piece) => etiquettesDe(piece).includes('butin') && segment(monde, piece) === segment(monde, monde.depart) && !monde.objets.some((objet) => objet.piece === piece && objet.document !== true) && monde.pieces.find((candidate) => candidate.id === piece)?.pillee !== true,
        ),
    );
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: [...monde.objets, { id: 'o-butin-9', nom: 'cat_burette_reserve', piece: trouve, butin: true, glissant: 1 }] }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Butin o-butin-9 dans ${trouve} : glissant, atteint sans franchir la coupe de m-04.`);
  });

  it('aucune salle de butin accrochée à la piste, quand une impasse de butin libre y pend, est signalé (spec §6.6)', () => {
    const { construite } = chercher(
      () => true,
      ({ entree: { monde } }) =>
        annexes(monde, 'impasse').some(
          (piece) =>
            etiquettesDe(piece).includes('butin') &&
            !monde.objets.some((objet) => objet.piece === piece && objet.butin !== true) &&
            accrochesDe(monde, piece).some((haut) => monde.pieces.find((candidate) => candidate.id === haut)?.trace !== undefined),
        ) || undefined,
    );
    // Plus aucune salle de butin : ni objet de butin, ni pièce pillée.
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: monde.objets.filter((objet) => objet.butin !== true), pieces: monde.pieces.map((piece) => ({ ...piece, pillee: undefined })) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain('Butin : aucune salle de butin accrochée à la piste.');
  });

  it('deux objets de noms différents au même nom affiché sont signalés (NP-04)', () => {
    const { entree, station } = premiere(() => true);
    const objet = entree.monde.objets[0]!;
    const { noms } = entree.textes;
    const fautive = { ...entree, monde: { ...entree.monde, objets: [...entree.monde.objets, { ...objet, id: 'o-copie', nom: 'copie' }] }, textes: { ...entree.textes, noms: { ...noms, copie: noms[objet.nom]! } } };
    expect(controlerGrande(fautive, station)).toContain(`Nom affiché en double : ${noms[objet.nom]?.texte}.`);
  });

  it('un objet au nom affiché d’une pièce est signalé (NP-04)', () => {
    const { entree, station } = premiere(() => true);
    const piece = entree.monde.pieces.find((candidate) => candidate.id === station.creature)!;
    const fautive = modifier({ entree, station }, (monde) => ({ ...monde, objets: [...monde.objets, { id: 'o-copie', nom: piece.nom, piece: piece.id }] }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Nom affiché en double : ${entree.textes.noms[piece.nom]?.texte ?? piece.nom}.`);
  });

  // Documents (spec 2026-10-18 §8.4, §7.3) : relus dans le monde construit, jamais par la pose.
  const idCle = (place: EmplacementDocument): string => `${place.morceau ?? ''}/${place.cle ?? ''}`;
  const dEtape = (docs: readonly Doc[], etape: number): Doc | undefined => docs.find(({ place }) => place.couche === 'menace' && place.etape === etape);
  const avecTrousse = () =>
    chercher(
      () => true,
      (construite) => {
        const note = documentsDe(construite).find(({ place }) => place.cle === 'butin:soin');
        const trousse = construite.entree.monde.objets.find((objet) => objet.butin === true && objet.soin !== undefined);
        return note === undefined || trousse === undefined ? undefined : { note, trousse };
      },
    );
  // Borne haute : max(7, notes de clés déplacées + 1). Une station compte trois chemins et un final, et M-06 est le seul morceau à deux
  // clés : cinq notes au plus, `+ 1` reste sous 7 et la borne est celle de `parStation`. La partie `+ 1` ne joue que si la réserve ou les
  // morceaux changent ; le test des notes qui dépassent `parStation` la prouve sur une réserve resserrée.
  const bornes = (construite: Construite): readonly [number, number] => [5, Math.max(7, notesDeCles(documentsDe(construite)).length + 1)];
  const origineDe = (station: DefStation, place: EmplacementDocument): string =>
    `${place.morceau ?? ''}/${station.morceaux.find((morceau) => morceau.id === place.morceau)?.objets.find((objet) => objet.id === place.cle)?.piece ?? ''}`;

  it('un document au vestibule est signalé (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => documentsDe(candidate)[0]);
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.objet.id, monde.depart));
    // Le vestibule n'a aucun objet (D-257) : le contrôle existant couvre les documents.
    expect(controlerGrande(fautive.entree, fautive.station)).toContain('Vestibule : un objet.');
  });

  it('moins de cinq documents sont signalés (spec §8.4)', () => {
    const construite = premiere(() => true);
    const [min, max] = bornes(construite);
    const gardes = documentsDe(construite).slice(0, min - 1).map(({ objet }) => objet.id);
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: monde.objets.filter((objet) => objet.document !== true || gardes.includes(objet.id)) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Documents : ${min - 1}, hors de ${min} à ${max}.`);
  });

  it('plus de documents que permis sont signalés (spec §8.4)', () => {
    const construite = premiere(() => true);
    const docs = documentsDe(construite);
    const [min, max] = bornes(construite);
    const libres = emplacementsDe(construite.station).filter((emplacement) => !docs.some(({ place }) => place.id === emplacement.id));
    const fautive = modifier(construite, (monde) => libres.slice(0, max + 1 - docs.length).reduce((suite, emplacement) => ajouter(suite, emplacement, construite.station.creature), monde));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Documents : ${max + 1}, hors de ${min} à ${max}.`);
  });

  it('deux documents dans une même pièce sont signalés (spec §8.4)', () => {
    const construite = premiere(() => true);
    const [a, b] = documentsDe(construite);
    const fautive = modifier(construite, (monde) => deplacer(monde, b!.objet.id, a!.objet.piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${b!.objet.nom} dans ${a!.objet.piece} : la pièce porte déjà ${a!.objet.nom}.`);
  });

  it('un document dans une salle pillée est signalé (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const pillee = candidate.entree.monde.pieces.find((piece) => piece.pillee === true);
        const doc = documentsDe(candidate)[0];
        return pillee === undefined || doc === undefined ? undefined : { pillee: pillee.id, doc };
      },
    );
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.doc.objet.id, trouve.pillee));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.doc.objet.nom} dans ${trouve.pillee} : salle pillée.`);
  });

  it('un document d’un morceau absent de la station est signalé (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      ({ station }) => emplacementsDe(station).find((emplacement) => emplacement.couche === 'morceau' && !station.morceaux.some((morceau) => morceau.id === emplacement.morceau)),
    );
    const { creature } = construite.station;
    const fautive = modifier(construite, (monde) => ajouter(monde, trouve, creature));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.id} dans ${creature} : le morceau ${trouve.morceau} n’est pas dans la station.`);
  });

  it('un document de morceau ailleurs que dans la pièce face ou une annexe qui y pend est signalé (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => documentsDe(candidate).find(({ place }) => place.couche === 'morceau'));
    const { depart } = construite.entree.monde;
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.objet.id, depart));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.objet.nom} dans ${depart} : ni la pièce face de ${trouve.place.morceau}, ni une annexe qui y pend.`);
  });

  it('deux documents d’un même morceau sont signalés (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => documentsDe(candidate).find(({ place }) => place.couche === 'morceau'));
    const { creature } = construite.station;
    const fautive = modifier(construite, (monde) => ajouter(monde, trouve.place, creature));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.objet.nom} dans ${creature} : le morceau ${trouve.place.morceau} a déjà ${trouve.objet.nom}.`);
  });

  it('une clé déplacée sans note de rangement est signalée (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => notesDeCles(documentsDe(candidate))[0]);
    const fautive = modifier(construite, (monde) => sans(monde, trouve.objet.id));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Clé ${idCle(trouve.place)} déplacée : note de rangement absente.`);
  });

  it('une note de rangement hors de la pièce face, de l’origine de la clé et des annexes de la face est signalée (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => notesDeCles(documentsDe(candidate))[0]);
    const { depart } = construite.entree.monde;
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.objet.id, depart));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(
      `Document ${trouve.objet.nom} dans ${depart} : ni la pièce face de ${trouve.place.morceau}, ni l’origine de ${idCle(trouve.place)}, ni une annexe qui pend à la face.`,
    );
  });

  it('une note de rangement dans la pièce d’origine de la clé, distincte de la pièce face, est permise (spec §8.4)', () => {
    // Une note de la station construite, dans une pièce du chemin principal qui n'est pas l'origine de sa clé, est dans la pièce face
    // (le contrôle passe) : l'origine, elle, est alors une autre pièce que la face.
    const { construite, trouve } = chercher(
      () => true,
      (candidate) =>
        notesDeCles(documentsDe(candidate)).find(
          ({ objet, place }) => candidate.entree.monde.pieces.find((piece) => piece.id === objet.piece)?.forme === undefined && objet.piece !== origineDe(candidate.station, place),
        ),
    );
    expect(controlerGrande(construite.entree, construite.station)).toEqual([]);
    const origine = origineDe(construite.station, trouve.place);
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.objet.id, origine));
    expect(controlerGrande(fautive.entree, fautive.station).filter((ecart) => ecart.startsWith(`Document ${trouve.objet.nom} dans ${origine} : ni la pièce face`))).toEqual([]);
  });

  // Une annexe du catalogue pendue à la pièce face, par des couloirs au besoin : permise ; pendue à une autre pièce : signalée. La face
  // vient de la station construite, que le contrôle accepte : la racine de la chaîne d'une annexe qui porte le document de morceau, la
  // pièce du chemin principal, autre que l'origine de sa clé, qui porte la note.
  const faceDuDocument = {
    morceau: (candidate: Construite) => {
      const { monde } = candidate.entree;
      return documentsDe(candidate).flatMap((doc) => {
        const face = doc.place.couche === 'morceau' ? accrochesDe(monde, doc.objet.piece).at(-1) : undefined;
        return face === undefined ? [] : [{ doc, face }];
      })[0];
    },
    note: (candidate: Construite) => {
      const note = notesDeCles(documentsDe(candidate)).find(({ objet, place }) => accrochesDe(candidate.entree.monde, objet.piece).length === 0 && objet.piece !== origineDe(candidate.station, place));
      return note === undefined ? undefined : { doc: note, face: note.objet.piece };
    },
  };
  it.each([
    ['document de morceau', faceDuDocument.morceau, ({ objet, place }: Doc, piece: string) => `Document ${objet.nom} dans ${piece} : ni la pièce face de ${place.morceau}, ni une annexe qui y pend.`],
    [
      'note de rangement',
      faceDuDocument.note,
      ({ objet, place }: Doc, piece: string) => `Document ${objet.nom} dans ${piece} : ni la pièce face de ${place.morceau}, ni l’origine de ${idCle(place)}, ni une annexe qui pend à la face.`,
    ],
  ])('%s : permis dans une annexe pendue à la face, signalé dans une annexe pendue ailleurs (spec §8.4)', (_cas, faceDe, message) => {
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const { monde } = candidate.entree;
        const sur = faceDe(candidate);
        const pendue = annexes(monde).find((piece) => accrochesDe(monde, piece).at(-1) === sur?.face);
        const ailleurs = annexes(monde).find((piece) => accrochesDe(monde, piece).at(-1) !== sur?.face && !monde.objets.some((objet) => objet.piece === piece));
        return sur === undefined || pendue === undefined || ailleurs === undefined ? undefined : { ...sur, pendue, ailleurs };
      },
    );
    expect(controlerGrande(construite.entree, construite.station)).toEqual([]);
    const permise = modifier(construite, (monde) => deplacer(monde, trouve.doc.objet.id, trouve.pendue));
    expect(controlerGrande(permise.entree, permise.station).filter((ecart) => ecart.startsWith(`Document ${trouve.doc.objet.nom} dans ${trouve.pendue} : ni la pièce face`))).toEqual([]);
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.doc.objet.id, trouve.ailleurs));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(message(trouve.doc, trouve.ailleurs));
  });

  it('une note de rangement qui ne désigne pas la pièce de la clé est signalée (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => notesDeCles(documentsDe(candidate))[0]);
    const { depart, objets } = construite.entree.monde;
    const piece = objets.find((objet) => objet.id === idCle(trouve.place))?.piece;
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: monde.objets.map((objet) => (objet.id === trouve.objet.id ? { ...objet, designe: depart } : objet)) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.objet.nom} dans ${trouve.objet.piece} : désigne ${depart}, la clé ${idCle(trouve.place)} est dans ${piece}.`);
  });

  it('la note d’une clé qui n’a pas bougé est signalée (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      ({ entree: { monde }, station }) =>
        emplacementsDe(station).find((emplacement) => emplacement.couche === 'rangement' && station.morceaux.some((morceau) => morceau.id === emplacement.morceau) && !monde.objets.some((objet) => objet.nom === emplacement.id)),
    );
    const { creature } = construite.station;
    const fautive = modifier(construite, (monde) => ajouter(monde, trouve, creature));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.id} dans ${creature} : la clé ${idCle(trouve)} n’est pas déplacée.`);
  });

  it('la note de la trousse sans trousse est signalée (spec §8.4)', () => {
    const { construite, trouve } = avecTrousse();
    const fautive = modifier(construite, (monde) => sans(monde, trouve.trousse.id));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.note.objet.nom} dans ${trouve.note.objet.piece} : aucune trousse dans la station.`);
  });

  it('la note de la trousse hors du catalogue ou dans la pièce de la trousse est signalée (spec §8.4)', () => {
    const { construite, trouve } = avecTrousse();
    const { depart } = construite.entree.monde;
    for (const ici of [depart, trouve.trousse.piece]) {
      const fautive = modifier(construite, (monde) => deplacer(monde, trouve.note.objet.id, ici));
      expect(controlerGrande(fautive.entree, fautive.station), ici).toContain(`Document ${trouve.note.objet.nom} dans ${ici} : hors du catalogue, ou dans la pièce de la trousse.`);
    }
  });

  it('la note de la trousse qui ne désigne pas la pièce de la trousse est signalée (spec §8.4)', () => {
    const { construite, trouve } = avecTrousse();
    const { depart } = construite.entree.monde;
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: monde.objets.map((objet) => (objet.id === trouve.note.objet.id ? { ...objet, designe: depart } : objet)) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.note.objet.nom} dans ${trouve.note.objet.piece} : désigne ${depart}, la trousse est dans ${trouve.trousse.piece}.`);
  });

  it('deux documents de la même étape de la menace sont signalés (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const premier = documentsDe(candidate).find(({ place }) => place.couche === 'menace');
        const autre = emplacementsDe(candidate.station).find((emplacement) => emplacement.couche === 'menace' && emplacement.etape === premier?.place.etape && emplacement.id !== premier?.place.id);
        return premier === undefined || autre === undefined ? undefined : { premier, autre };
      },
    );
    const { creature } = construite.station;
    const fautive = modifier(construite, (monde) => ajouter(monde, trouve.autre, creature));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.autre.id} dans ${creature} : étape ${trouve.premier.place.etape} déjà posée avec ${trouve.premier.objet.nom}.`);
  });

  it('des étapes de la menace hors de l’ordre du trajet sont signalées (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const docs = documentsDe(candidate);
        const [un, quatre] = [dEtape(docs, 1), dEtape(docs, 4)];
        return un === undefined || quatre === undefined ? undefined : { un, quatre };
      },
    );
    // Premier et dernier tiers du trajet : l'étape 4 est plus loin que l'étape 1 ; on les échange.
    const fautive = modifier(construite, (monde) => deplacer(deplacer(monde, trouve.un.objet.id, trouve.quatre.objet.piece), trouve.quatre.objet.id, trouve.un.objet.piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.un.objet.nom} dans ${trouve.quatre.objet.piece} : étape 1 plus loin sur le trajet que l’étape 4.`);
  });

  it('une étape de la menace hors de son tiers du trajet est signalée (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const docs = documentsDe(candidate);
        const [trois, quatre] = [dEtape(docs, 3), dEtape(docs, 4)];
        return trois === undefined || quatre === undefined ? undefined : { trois, quatre };
      },
    );
    // L'étape 3 est au deuxième tiers, l'étape 4 au dernier : l'ordre tient, pas le tiers.
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.quatre.objet.id, trouve.trois.objet.piece));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.quatre.objet.nom} dans ${trouve.trois.objet.piece} : étape 4 au deuxième tiers du trajet, attendue au dernier.`);
  });

  it('un document de l’univers hors d’une pièce du catalogue de ses étiquettes est signalé (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => documentsDe(candidate).find(({ place }) => place.couche === 'univers'));
    const { depart } = construite.entree.monde;
    const fautive = modifier(construite, (monde) => deplacer(monde, trouve.objet.id, depart));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.objet.nom} dans ${depart} : pas une pièce du catalogue portant l’une de ses étiquettes.`);
  });

  it('deux documents au même nom de puce sont signalés (spec §8.4)', () => {
    const construite = premiere(() => true);
    const [a, b] = documentsDe(construite);
    const { textes } = construite.entree;
    const puce = textes.documents[a!.objet.nom]!.puce;
    const documents = { ...textes.documents, [b!.objet.nom]: { ...textes.documents[b!.objet.nom]!, puce } };
    const fautive = { ...construite, entree: { ...construite.entree, textes: { ...textes, documents } } };
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${b!.objet.nom} dans ${b!.objet.piece} : nom de puce « ${puce.texte} » déjà pris par ${a!.objet.nom}.`);
  });

  it('une pièce du catalogue qui ne porte rien est signalée (spec §7.3)', () => {
    // Un document seul dans une pièce du catalogue qui n'a ni trace, ni salle de butin, ni bout de porte de boucle.
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const { monde } = candidate.entree;
        const boucles = new Set(monde.boucles);
        return documentsDe(candidate).find(({ objet }) => {
          const piece = monde.pieces.find((autre) => autre.id === objet.piece);
          return (
            piece?.forme !== undefined &&
            piece.trace === undefined &&
            piece.pillee !== true &&
            monde.objets.filter((autre) => autre.piece === objet.piece).length === 1 &&
            !monde.liaisons.some((liaison) => boucles.has(liaison.id) && liaison.entre.includes(objet.piece))
          );
        });
      },
    );
    const fautive = modifier(construite, (monde) => sans(monde, trouve.objet.id));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`${trouve.objet.piece} : ne porte rien (couverture, spec §7.3).`);
  });

  it('un document absent de la réserve est signalé (spec §8.4)', () => {
    const construite = premiere(() => true);
    const { creature } = construite.station;
    const fautive = modifier(construite, (monde) => ({ ...monde, objets: [...monde.objets, { id: 'o-doc-98', nom: 'doc_inconnu', piece: creature, portable: false, document: true }] }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document doc_inconnu dans ${creature} : absent de la réserve.`);
  });

  it('un document dans une pièce en feu est signalé (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => documentsDe(candidate)[0]);
    const fautive = modifier(construite, (monde) => ({ ...monde, pieces: monde.pieces.map((piece) => (piece.id === trouve.objet.piece ? { ...piece, feu: true } : piece)) }));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain(`Document ${trouve.objet.nom} dans ${trouve.objet.piece} : pièce en feu.`);
  });

  it('une station sans aucun document de la menace est signalée (spec §8.4)', () => {
    const construite = premiere(() => true);
    const menace = documentsDe(construite).filter(({ place }) => place.couche === 'menace').map(({ objet }) => objet.id);
    const fautive = modifier(construite, (monde) => sans(monde, ...menace));
    expect(controlerGrande(fautive.entree, fautive.station)).toContain('Documents : aucun document de la menace.');
  });

  it('une étape de la menace manquante est permise (spec §8.4)', () => {
    const { construite, trouve } = chercher(
      () => true,
      (candidate) => {
        const menace = documentsDe(candidate).filter(({ place }) => place.couche === 'menace');
        return menace.length >= 2 ? menace : undefined;
      },
    );
    // Chaque étape posée, retirée seule : les autres restent, aucun écart de menace.
    for (const { objet } of trouve) {
      const fautive = modifier(construite, (monde) => sans(monde, objet.id));
      expect(controlerGrande(fautive.entree, fautive.station).filter((ecart) => /étape|menace/.test(ecart)), objet.nom).toEqual([]);
    }
  });

  it('les notes des clés déplacées, plus une menace, dépassent la borne haute de la réserve (spec §8.4)', () => {
    const { construite, trouve } = chercher(() => true, (candidate) => (notesDeCles(documentsDe(candidate)).length >= 2 ? documentsDe(candidate).length : undefined));
    const { station } = construite;
    const notes = notesDeCles(documentsDe(construite)).length;
    // Réserve resserrée à un seul document par station : la borne haute est alors celle des notes, plus le document de la menace.
    const reserve = { ...station.grande!.documents!, parStation: [1, 1] as const };
    const resserree = { ...station, grande: { ...station.grande!, documents: reserve } };
    expect(controlerGrande(construite.entree, resserree)).toContain(`Documents : ${trouve}, hors de 1 à ${notes + 1}.`);
  });

  it('propriété : sur 1 000 tirages, toute grande station construite passe tous les contrôles', () => {
    const tirables = CATALOGUE.grandes.filter((composition) => composition.refus === null);
    let alea = generateurDepuisGraine(20261019);
    const tirer = (faces: number): number => {
      const tirage = suivant(alea);
      alea = tirage.etat;
      return tirage.valeur % faces;
    };
    let controlees = 0;
    for (let rang = 0; rang < 1000; rang++) {
      const composition = tirables[tirer(tirables.length)]!;
      const construite = construire(composition.id, tirer(10_000));
      if (construite === null) continue;
      controlees++;
      expect(controlerGrande(construite.entree, construite.station), construite.entree.monde.id).toEqual([]);
    }
    // Une graine sur deux environ n'a pas de plan : aucune porte de boucle (D-295).
    expect(controlees).toBeGreaterThanOrEqual(400);
  }, 300_000);
});
