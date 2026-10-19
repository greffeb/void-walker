import { describe, expect, it } from 'vitest';
import type { DefMonde, DefStation } from '../engine';
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
          (piece) => etiquettesDe(piece).includes('butin') && segment(monde, piece) === segment(monde, monde.depart) && !monde.objets.some((objet) => objet.piece === piece) && monde.pieces.find((candidate) => candidate.id === piece)?.pillee !== true,
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
