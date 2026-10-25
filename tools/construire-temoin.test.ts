import { describe, expect, it } from 'vitest';
import { idPublic, jouer, nouvellePartie, observer, type DefMonde } from '../engine';
import { VERSION_GENERATEUR, type EntreeMonde } from '../content';
import { CATALOGUE } from './catalogue';
import { construireTemoin } from './construire-temoin';
import { sansButin, sansErrance, type PasTemoin } from './verifier-grandes';

function entree(monde: DefMonde): EntreeMonde {
  const reference = CATALOGUE.mondes['m-07'];
  if (reference === undefined) throw new Error('Station de référence absente.');
  return { ...reference, monde, parcours: [] };
}

/** Rejeu indépendant du constructeur : chaque commande vient du menu, et aucun tirage ni blessure n'est accepté. */
function rejouer(entree: EntreeMonde, temoin: readonly PasTemoin[] | null): string[] {
  expect(temoin).not.toBeNull();
  if (temoin === null) throw new Error('Preuve absente.');
  const { monde } = entree;
  let partie = nouvellePartie(monde, { version: 'verifier-grandes', graine: 20261010 });
  const levees: string[] = [];
  for (const [action, cible, parametre] of temoin) {
    const option = observer(monde, partie.etat).menu.find((candidate) => candidate.action === action && candidate.cible.id === cible && candidate.parametre?.id === parametre);
    expect(option?.disponible, `${action} ${cible}`).toBe(true);
    if (option === undefined) throw new Error('Commande absente.');
    const avant = partie.etat.verrous ?? [];
    const resultat = jouer(monde, partie, option.commande);
    expect(resultat.type).toBe('engagee');
    if (resultat.type !== 'engagee') throw new Error('Commande non engagée.');
    expect(resultat.tirages).toEqual([]);
    expect(resultat.partie.etat.sante).toBe('indemne');
    partie = resultat.partie;
    levees.push(...avant.filter((cloison) => !partie.etat.verrous?.includes(cloison)));
  }
  expect(partie.etat.fin).toBe('evacuation');
  return levees;
}

const CAPSULE = [
  { id: 'capsule', nom: 'capsule', piece: 'quai', portable: false, capsule: { interieur: 'cabine', alimentee: true } },
  { id: 'pupitre', nom: 'pupitre', piece: 'cabine', portable: false, depart: 'capsule' },
] as const;

describe('construction d’une preuve à froid, par mécanismes et menu public', () => {
  it.each(['m-08', 'm-09', 'm-12', 'ar-02'])('%s : construit sans aucun parcours préexistant et rejoue jusqu’à l’évacuation', (id) => {
    const reference = CATALOGUE.mondes[id];
    if (reference === undefined) throw new Error(`Station ${id} absente.`);
    const sansParcours = { ...reference, parcours: [] };
    rejouer(sansParcours, construireTemoin(sansParcours));
  });

  it.each([
    ['prépare le bord bruyant avant de chercher la planche', 'm01-m08-m07-m03-soute', 0],
    ['distance la créature par la boucle avant d’alimenter la capsule', 'm01-m09-m08-m03-reserve', 3],
    ['ferme le détour du refuge et piège la créature sur la planche avant de rapporter la caisse', 'm01-m08-m02-m03-atelier', 1],
    ['évacue après avoir libéré le chariot qui retenait la créature', 'm02-m08-m12-m03-reserve', 0],
    ['récupère la caisse déplacée avant le bruit du drone', 'm08-m12-m02-m03-atelier', 0],
    ['préfère le détour sans contact pour récupérer la caisse', 'm08-m09-m02-m03-atelier', 2],
    ['préserve le déplacement direct de la caisse pendant la poursuite', 'm12-m09-m02-m06-atelier', 1],
    ['provoque le premier contact par le détour en gardant l’autre entrée fermée', 'm12-m01-m02-m03-atelier', 5],
    ['évacue par décompression plutôt que chercher un détour devant la capsule', 'm08-m02-m01-m06-embarquement', 5],
    ['utilise l’avertisseur de l’alcôve avant les détours de poursuite', 'm08-m02-m04-m03-observation', 1],
  ] as const)('%s : preuve réelle sans témoins préexistants', (_cause, composition, graine) => {
    const construite = CATALOGUE.construireGrande(`g${VERSION_GENERATEUR}-${composition}`, graine);
    if ('refus' in construite) throw new Error(construite.refus);
    const station = { ...sansErrance(sansButin(construite)), parcours: [] };
    rejouer(station, construireTemoin(station));
  });

  it('ouvre l’issue de la créature puis l’attire par une porte bruyante, dans les deux ordres libres', () => {
    const construite = CATALOGUE.construireGrande(`g${VERSION_GENERATEUR}-ol-m08-m09-m02-m03-atelier`, 7);
    if ('refus' in construite) throw new Error(construite.refus);
    const station = { ...sansErrance(sansButin(construite)), parcours: [] };
    const cloisons = station.monde.liaisons.filter((liaison) => liaison.verrouillee === true).map((liaison) => liaison.id);
    for (const ordre of [cloisons, [...cloisons].reverse()]) expect(rejouer(station, construireTemoin(station, ordre))).toEqual(ordre);
  });

  it('va chercher la caisse déplacée, la porte, puis la pose sous la grille ; ne dépend pas des noms', () => {
    const station = entree({
      id: 'caisse-deplacee-constructif', depart: 'depart',
      pieces: [{ id: 'depart', nom: 'x' }, { id: 'annexe', nom: 'x' }, { id: 'quai', nom: 'x' }, { id: 'cabine', nom: 'x', sousPosition: true }],
      liaisons: [
        { id: 'rangement', nom: 'x', entre: ['depart', 'annexe'], ouverte: false },
        { id: 'grille', nom: 'x', entre: ['depart', 'quai'], ouverte: false, haute: 'depart', etroite: true },
        { id: 'ecoutille', nom: 'x', entre: ['quai', 'cabine'], ouverte: false },
      ],
      positions: [{ id: 'sous-grille', nom: 'x', piece: 'depart', sous: 'grille' }],
      objets: [...CAPSULE, { id: 'caisse', nom: 'x', piece: 'annexe', deplacable: true, appui: true, encombrant: true }],
    });
    const temoin = construireTemoin(station);
    rejouer(station, temoin);
    expect(temoin).toContainEqual(['prendre', idPublic(station.monde.id, 'caisse')]);
    expect(temoin).toContainEqual(['poser', idPublic(station.monde.id, 'caisse'), idPublic(station.monde.id, 'sous-grille')]);
  });

  it.each([['a', 'b'], ['b', 'a']])('respecte l’ordre %s puis %s, sans confondre les verrous de navigation', (premiere, seconde) => {
    const station = entree({
      id: 'ordre-constructif', depart: 'depart',
      pieces: [{ id: 'depart', nom: 'depart' }, { id: 'commande-a', nom: 'commande_a' }, { id: 'commande-b', nom: 'commande_b' }, { id: 'sas', nom: 'sas' }, { id: 'quai', nom: 'quai' }, { id: 'cabine', nom: 'cabine', sousPosition: true }],
      liaisons: [
        { id: 'branche-a', nom: 'porte', entre: ['depart', 'commande-a'], ouverte: false },
        { id: 'branche-b', nom: 'porte', entre: ['depart', 'commande-b'], ouverte: false },
        { id: 'a', nom: 'cloison_a', entre: ['depart', 'sas'], ouverte: false, verrouillee: true },
        { id: 'b', nom: 'cloison_b', entre: ['sas', 'quai'], ouverte: false, verrouillee: true },
        { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: false },
      ],
      objets: [...CAPSULE, { id: 'bouton-a', nom: 'bouton_a', piece: 'commande-a', portable: false, deverrouille: 'a' }, { id: 'bouton-b', nom: 'bouton_b', piece: 'commande-b', portable: false, deverrouille: 'b' }],
    });
    expect(rejouer(station, construireTemoin(station, [premiere, seconde]))).toEqual([premiere, seconde]);
  });

  it('ne produit pas une preuve partielle quand la source impose de s’exposer à la créature', () => {
    const station = entree({
      id: 'source-inaccessible-surement', depart: 'depart',
      pieces: [{ id: 'depart', nom: 'depart' }, { id: 'antre', nom: 'antre' }, { id: 'reduit', nom: 'reduit' }, { id: 'quai', nom: 'quai' }, { id: 'cabine', nom: 'cabine', sousPosition: true }],
      liaisons: [
        { id: 'sas', nom: 'sas', entre: ['depart', 'antre'], ouverte: false },
        { id: 'trappe', nom: 'trappe', entre: ['antre', 'reduit'], ouverte: false },
        { id: 'porte', nom: 'porte', entre: ['depart', 'quai'], ouverte: false },
        { id: 'ecoutille', nom: 'ecoutille', entre: ['quai', 'cabine'], ouverte: false },
      ],
      creature: { piece: 'antre' },
      objets: [
        { ...CAPSULE[0], capsule: { interieur: 'cabine' } }, CAPSULE[1],
        { id: 'source', nom: 'source', piece: 'reduit', source: true },
      ],
    });
    expect(construireTemoin(station)).toBeNull();
  });
});
