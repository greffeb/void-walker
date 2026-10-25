import {
  assemblerStation,
  empreinte,
  empreinteEtat,
  exporter,
  generateurDepuisGraine,
  jouer,
  nouvellePartie,
  observer,
  validerMonde,
  validerMorceau,
  type Assembleur,
  type DefMonde,
  type DefMorceau,
  type DefStation,
  type Observation,
} from '../engine';
import { suivant } from '../engine/des';
import {
  COMPOSITIONS_PUBLIEES,
  SANS_PREUVE_DRONE,
  creerCatalogue,
  fuitesDeCouches,
  MONDES,
  MORCEAUX,
  MORCEAUX_TEXTES,
  nomDe,
  nomLisible,
  numeroter,
  PAIRES,
  rendreDocument,
  reunir,
  sansConflit,
  type Composition,
  type EntreeMonde,
  type EntreeMorceau,
  type Refus,
  type TextesMorceau,
} from '../content';
import { TEXTES_AR01 } from '../content/ar-01/textes';
import { MORCEAU_M01, TEXTES_MORCEAU_M01 } from '../content/morceaux/m-01';
import { MORCEAU_M02, TEXTES_MORCEAU_M02 } from '../content/morceaux/m-02';
import { MORCEAU_M04, TEXTES_MORCEAU_M04 } from '../content/morceaux/m-04';
import { MORCEAU_M05, TEXTES_MORCEAU_M05 } from '../content/morceaux/m-05';
import { lireDemande } from '../report-service/src/rapport';
import { CATALOGUE } from './catalogue';
import { stationDeReference } from './verifier-station';

// Morceaux écrits à la main et stations de test refaites par l'assembleur (#152, 13 §8, GP-01).

function station(id: string): DefMonde {
  const trouvee: EntreeMonde | undefined = CATALOGUE.mondes[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent du catalogue.`);
  return trouvee.monde;
}

function porte(monde: DefMonde, id: string) {
  const trouvee = monde.liaisons.find((liaison) => liaison.id === id);
  if (trouvee === undefined) throw new Error(`Liaison ${id} absente.`);
  return trouvee;
}

describe('morceaux (13 §8)', () => {
  it('vestibule, dix chemins dont M-12, carrefour, deux finals et embarquement d’essai, dans cet ordre', () => {
    expect(Object.keys(MORCEAUX)).toEqual(['vestibule', 'm-01', 'm-02', 'm-04', 'm-05', 'm-07', 'm-08', 'm-09', 'm-10', 'm-11', 'm-12', 'carrefour', 'm-03', 'm-06', 'essai']);
  });

  it.each(Object.entries(MORCEAUX))('%s : morceau valide, identifiant repris', (id, { morceau }) => {
    expect(morceau.id).toBe(id);
    expect(validerMorceau(morceau)).toEqual([]);
  });

  it('le vestibule n’a ni objet ni place de créature ; sa porte est ordinaire', () => {
    const { morceau } = MORCEAUX.vestibule ?? {};
    expect(morceau).toMatchObject({ famille: 'depart', objets: [], placesCreature: [], sortie: { piece: 'p-vestibule', porte: { nom: 'porte' } } });
    expect(morceau?.sortie?.porte.bruyante).toBeUndefined();
  });

  it('M-03 est un final : capsule non alimentée, console et bloc pour l’alimenter', () => {
    const { morceau } = MORCEAUX['m-03'] ?? {};
    expect(morceau).toMatchObject({ famille: 'final', demande: ['acces'], fournit: ['evacuation'], placesCreature: ['p-reserve'] });
    const capsule = morceau?.objets.find((objet) => objet.capsule !== undefined);
    expect(capsule?.capsule?.alimentee).not.toBe(true);
    expect(morceau?.objets.find((objet) => objet.alimente !== undefined)?.alimente).toBe(capsule?.id);
    expect(morceau?.objets.some((objet) => objet.source === true && objet.large === true && objet.encombrant === true)).toBe(true);
  });

  it('l’embarquement d’essai est un final à la capsule alimentée', () => {
    const { morceau } = MORCEAUX.essai ?? {};
    expect(morceau).toMatchObject({ famille: 'final', demande: ['acces'], fournit: ['evacuation'], placesCreature: [] });
    expect(morceau?.objets.find((objet) => objet.capsule !== undefined)?.capsule?.alimentee).toBe(true);
  });
});

describe('M-06, M-08 et M-09 (spec L3 §3.1 à §3.3)', () => {
  function entree(id: string): EntreeMorceau {
    const trouvee = MORCEAUX[id];
    if (trouvee === undefined) throw new Error(`Morceau ${id} absent.`);
    return trouvee;
  }

  it('M-06 : final valide, entrée par le couloir de sécurité, créature à l’embarquement, capsule alimentée, écoutille fermée', () => {
    const { morceau, textes } = entree('m-06');
    expect(validerMorceau(morceau)).toEqual([]);
    expect(morceau).toMatchObject({ famille: 'final', entree: 'p-couloir', placesCreature: ['p-embarquement'], demande: ['acces'], fournit: ['evacuation'] });
    expect(morceau.objets.find((objet) => objet.capsule !== undefined)?.capsule).toEqual({ interieur: 'p-cabine', alimentee: true });
    expect(morceau.liaisons.find((liaison) => liaison.nom === 'ecoutille')).toMatchObject({ entre: ['p-embarquement', 'p-cabine'], ouverte: false });
    expect(textes.noms.couloir_securite).toEqual({ texte: 'couloir de sécurité', genre: 'm', nombre: 's', elision: false });
  });

  it('M-06 : les objets d’AR-02 sans le terminal, la baie dans la panoramique', () => {
    const { morceau } = entree('m-06');
    expect(morceau.objets.map((objet) => [objet.id, objet.piece])).toEqual([
      ['o-signaletique', 'p-couloir'],
      ['o-casier', 'p-local'],
      ['o-combinaison', 'p-local'],
      ['o-decoupeuse', 'p-local'],
      ['o-baie', 'p-panoramique'],
      ['o-kit', 'p-panoramique'],
      ['o-capsule', 'p-embarquement'],
      ['o-pupitre', 'p-cabine'],
    ]);
    expect(morceau.objets.find((objet) => objet.id === 'o-baie')?.vitrageExterieur).toBe(true);
    expect(morceau.objets.some((objet) => objet.nom === 'terminal')).toBe(false);
  });

  it('M-06 : aucun message d’assistance', () => {
    const { morceau, textes } = entree('m-06');
    expect(morceau.assistance ?? []).toEqual([]);
    expect(textes.assistance).toEqual({});
  });

  it('vigilance 5 : aucun texte de m-06 ne parle des cabines du personnel ni du terminal', () => {
    const textes = JSON.stringify(entree('m-06').textes).toLocaleLowerCase('fr');
    for (const mot of ['cabines du personnel', 'terminal']) expect(textes).not.toContain(mot);
  });

  it.each([
    ['m-08', 'p-magasin', 'passerelle', 'p-ouest'],
    ['m-09', 'p-cale', 'gravite', 'p-sas-ouest'],
  ] as const)('%s : chemin valide, créature en %s, message %s à l’arrivée en %s', (id, place, message, piece) => {
    const { morceau, textes } = entree(id);
    expect(validerMorceau(morceau)).toEqual([]);
    expect(morceau).toMatchObject({ famille: 'chemin', entree: 'p-quartiers', placesCreature: [place], demande: [], fournit: ['acces'] });
    expect(morceau.assistance).toEqual([{ id: message, quand: { type: 'arrivee', piece } }]);
    expect(textes.assistance[message]).toBeDefined();
  });

  it.each([
    [
      'm-08',
      [
        [['p-quartiers', 'p-atelier'], 'porte', 'ouverte', false, false],
        [['p-quartiers', 'p-ouest'], 'porte_grippee', 'fermée', true, false],
        [['p-ouest', 'p-est'], 'vide', 'ouverte', false, true],
        [['p-est', 'p-magasin'], 'porte', 'fermée', false, false],
      ],
      { piece: 'p-est', porte: { nom: 'porte' } },
    ],
    [
      'm-09',
      [
        [['p-quartiers', 'p-sas-ouest'], 'porte', 'fermée', false, false],
        [['p-sas-ouest', 'p-transfert'], 'porte', 'ouverte', false, false],
        [['p-transfert', 'p-sas-est'], 'porte', 'ouverte', false, false],
        [['p-sas-est', 'p-cale'], 'porte', 'fermée', false, false],
      ],
      { piece: 'p-sas-est', porte: { nom: 'porte' } },
    ],
    [
      'm-06',
      [
        [['p-couloir', 'p-local'], 'porte', 'ouverte', false, false],
        [['p-couloir', 'p-panoramique'], 'porte', 'fermée', false, false],
        [['p-panoramique', 'p-embarquement'], 'porte_grippee', 'fermée', true, false],
        [['p-embarquement', 'p-cabine'], 'ecoutille', 'fermée', false, false],
      ],
      undefined,
    ],
  ] as const)('%s : liaisons [extrémités, nom, état, bruyante, gouffre] et porte de sortie figées', (id, liaisons, sortie) => {
    const { morceau } = entree(id);
    expect(
      morceau.liaisons.map((liaison) => [liaison.entre, liaison.nom, liaison.ouverte ? 'ouverte' : 'fermée', liaison.bruyante === true, liaison.gouffre === true]),
    ).toEqual(liaisons);
    expect(morceau.sortie).toEqual(sortie);
    expect(morceau.sortie?.porte.bruyante).toBeUndefined();
  });

  it('M-08 : la planche, pont encombrant, est dans l’atelier ; pas de touret', () => {
    const { morceau } = entree('m-08');
    expect(morceau.objets).toEqual([{ id: 'o-planche', nom: 'planche', piece: 'p-atelier', pont: true, encombrant: true }]);
    expect(morceau.objets.some((objet) => objet.nom === 'touret')).toBe(false);
  });

  it('M-09 : deux interrupteurs de gravité, dans les sas, hors de la coursive ; pas de burette', () => {
    const { morceau } = entree('m-09');
    const interrupteurs = morceau.objets.filter((objet) => objet.gravite === 'p-transfert');
    expect(interrupteurs.map((objet) => [objet.nom, objet.piece])).toEqual([
      ['interrupteur_gravite', 'p-sas-ouest'],
      ['interrupteur_gravite', 'p-sas-est'],
    ]);
    expect(morceau.pieces.find((piece) => piece.id === 'p-transfert')?.gravite).toBe('coupee');
    expect(morceau.objets.filter((objet) => objet.piece === 'p-transfert')).toEqual([]);
    expect(morceau.objets.some((objet) => objet.nom === 'burette')).toBe(false);
  });

  it.each([
    ['m-08', ['touret', 'réserve']],
    ['m-09', ['burette', 'soute']],
  ] as const)('vigilance 5 : aucun texte de %s ne garde %j de sa station de test', (id, mots) => {
    const textes = JSON.stringify(entree(id).textes).toLocaleLowerCase('fr');
    for (const mot of mots) expect(textes).not.toContain(mot);
  });

  it('aucun mot de l’univers ni de la menace dans les textes de M-06, M-08 et M-09', () => {
    expect(Object.keys(MORCEAUX_TEXTES)).toEqual(expect.arrayContaining(['m-06', 'm-08', 'm-09']));
    expect(fuitesDeCouches(MORCEAUX_TEXTES)).toEqual([]);
  });
});

describe('M-01, M-02, M-04 et M-05 (spec L4 §3)', () => {
  const L4: Readonly<Record<string, { readonly morceau: DefMorceau; readonly textes: TextesMorceau }>> = {
    'm-01': { morceau: MORCEAU_M01, textes: TEXTES_MORCEAU_M01 },
    'm-02': { morceau: MORCEAU_M02, textes: TEXTES_MORCEAU_M02 },
    'm-04': { morceau: MORCEAU_M04, textes: TEXTES_MORCEAU_M04 },
    'm-05': { morceau: MORCEAU_M05, textes: TEXTES_MORCEAU_M05 },
  };

  function l4(id: string): { readonly morceau: DefMorceau; readonly textes: TextesMorceau } {
    const trouve = L4[id];
    if (trouve === undefined) throw new Error(`Morceau ${id} absent.`);
    return trouve;
  }

  it.each([
    ['m-01', 'p-poste', 'p-palier', 'p-palier', 'cloison'],
    ['m-02', 'p-atelier', 'p-pompes', 'p-atelier', 'porte'],
    ['m-04', 'p-controle', 'p-observation', 'p-observation', 'cloison'],
    ['m-05', 'p-service', 'p-quai', 'p-tri', 'porte'],
  ] as const)('%s : chemin valide, entrée %s, sortie depuis %s, créature en %s, porte de sortie %s', (id, entree, sortie, place, porte) => {
    const { morceau, textes } = l4(id);
    expect(validerMorceau(morceau)).toEqual([]);
    expect(morceau).toMatchObject({ id, famille: 'chemin', entree, placesCreature: [place], demande: [], fournit: ['acces'] });
    expect(morceau.sortie).toEqual({ piece: sortie, porte: { nom: porte } });
    expect(morceau.assistance).toBeUndefined();
    expect(textes.assistance).toEqual({});
  });

  it.each([
    ['m-01', [['p-poste', 'poste_incendie', 0, 0], ['p-galerie', 'galerie', 4, 0], ['p-palier', 'palier', 8, 0]]],
    ['m-02', [['p-atelier', 'atelier', 0, 0], ['p-pompes', 'pompes', 4, 0]]],
    ['m-04', [['p-controle', 'controle', 0, 0], ['p-observation', 'observation', 4, 0]]],
    ['m-05', [['p-service', 'service', 0, 0], ['p-tri', 'tri', 4, 0], ['p-quai', 'quai', 0, 3]]],
  ] as const)('%s : pièces [id, nom, x, y] figées, tuiles de 4 × 3 sauf le quai de 8 × 3', (id, pieces) => {
    const { morceau } = l4(id);
    expect(morceau.pieces.map((piece) => [piece.id, piece.nom, piece.plan?.x, piece.plan?.y])).toEqual(pieces);
    for (const piece of morceau.pieces) expect([piece.plan?.largeur, piece.plan?.hauteur]).toEqual([piece.id === 'p-quai' ? 8 : 4, 3]);
  });

  it.each([
    [
      'm-01',
      [
        ['l-poste-galerie', ['p-poste', 'p-galerie'], 'cloison', 'fermée', false, false, false, null, null],
        ['l-galerie-palier', ['p-galerie', 'p-palier'], 'cloison', 'fermée', false, false, false, null, null],
      ],
    ],
    ['m-02', [['l-atelier-pompes', ['p-atelier', 'p-pompes'], 'grille', 'fermée', false, false, true, 'p-atelier', null]]],
    ['m-04', [['l-controle-observation', ['p-controle', 'p-observation'], 'cloison', 'fermée', true, false, false, null, null]]],
    [
      'm-05',
      [
        ['l-service-tri', ['p-service', 'p-tri'], 'porte', 'fermée', false, false, false, null, null],
        ['l-tri-quai', ['p-tri', 'p-quai'], 'porte', 'fermée', false, false, false, null, null],
        ['l-service-quai', ['p-service', 'p-quai'], 'panneau', 'fermée', false, false, true, null, 'p-quai'],
      ],
    ],
  ] as const)('%s : liaisons [id, extrémités, nom, état, bruyante, gouffre, étroite, haute, cachée] figées', (id, liaisons) => {
    const { morceau } = l4(id);
    expect(
      morceau.liaisons.map((liaison) => [
        liaison.id,
        liaison.entre,
        liaison.nom,
        liaison.ouverte ? 'ouverte' : 'fermée',
        liaison.bruyante === true,
        liaison.gouffre === true,
        liaison.etroite === true,
        liaison.haute ?? null,
        liaison.cachee ?? null,
      ]),
    ).toEqual(liaisons);
  });

  it('M-02 : la grille d’AR-01, son au travers et sans signalétique ; caisse au centre, position sous la grille', () => {
    const { morceau } = l4('m-02');
    expect(morceau.liaisons[0]).toMatchObject({ id: 'l-atelier-pompes', sonAuTravers: true, sansSignaletique: true });
    expect(morceau.positions).toEqual([
      { id: 'pos-sous-grille', nom: 'sous_grille', piece: 'p-atelier', sous: 'l-atelier-pompes' },
      { id: 'pos-centre', nom: 'centre', piece: 'p-atelier' },
    ]);
    expect(morceau.objets).toEqual([
      { id: 'o-caisse', nom: 'caisse', piece: 'p-atelier', position: 'pos-centre', portable: false, deplacable: true, appui: true },
    ]);
  });

  it('M-01 : le bidon dans le poste incendie ; seule la galerie est en feu', () => {
    const { morceau } = l4('m-01');
    expect(morceau.objets).toEqual([{ id: 'o-bidon', nom: 'bidon', piece: 'p-poste', extinction: 1 }]);
    expect(morceau.pieces.filter((piece) => piece.feu === true).map((piece) => piece.id)).toEqual(['p-galerie']);
  });

  it('M-04 : burette et avertisseur dans la salle de contrôle, émetteur dans l’alcôve de l’observation, hors coque', () => {
    const { morceau } = l4('m-04');
    expect(morceau.objets).toEqual([
      { id: 'o-burette', nom: 'burette', piece: 'p-controle', glissant: 1 },
      { id: 'o-avertisseur', nom: 'avertisseur', piece: 'p-controle', portable: false, avertisseur: { piece: 'p-observation', alcove: true } },
    ]);
    expect(morceau.pieces.find((piece) => piece.id === 'p-observation')?.coque).toBeUndefined();
  });

  it('M-05 : aucun objet ; le panneau n’a ni son au travers ni signalétique déclarée', () => {
    const { morceau } = l4('m-05');
    expect(morceau.objets).toEqual([]);
    expect(morceau.positions).toBeUndefined();
    expect(morceau.liaisons.find((liaison) => liaison.nom === 'panneau')).toEqual({
      id: 'l-service-quai',
      nom: 'panneau',
      entre: ['p-service', 'p-quai'],
      ouverte: false,
      etroite: true,
      cachee: 'p-quai',
    });
  });

  it.each([
    ['m-01', ['burette', 'caisse', 'trousse']],
    ['m-02', ['bidon', 'burette', 'trousse']],
    ['m-04', ['bidon', 'caisse', 'trousse']],
    ['m-05', ['bidon', 'burette', 'caisse', 'trousse']],
  ] as const)('%s : aucun objet d’AR-01 placé dans un autre morceau (%j)', (id, absents) => {
    const noms = l4(id).morceau.objets.map((objet) => objet.nom);
    for (const nom of absents) expect(noms).not.toContain(nom);
  });

  it.each(Object.keys(L4))('%s : chaque pièce, objet, position et liaison a un nom ; pièces et objets ont deux descriptions', (id) => {
    const { morceau, textes } = l4(id);
    const reunis = reunir([textes]);
    const cles = [
      ...morceau.pieces.map((piece) => piece.nom),
      ...morceau.objets.map((objet) => objet.nom),
      ...(morceau.positions ?? []).map((position) => position.nom),
      ...morceau.liaisons.map((liaison) => liaison.nom),
      ...(morceau.sortie === undefined ? [] : [morceau.sortie.porte.nom]),
    ];
    for (const cle of cles) expect(reunis.noms[cle], cle).toBeDefined();
    for (const cle of [...morceau.pieces.map((piece) => piece.nom), ...morceau.objets.map((objet) => objet.nom)]) {
      expect(reunis.descriptions[cle]?.length, cle).toBe(2);
    }
  });

  it.each([
    ['m-01', ['bidon', 'cloison'], ['bidon']],
    ['m-02', ['atelier', 'grille', 'sous_grille', 'caisse'], ['caisse']],
    ['m-04', ['cloison', 'burette', 'avertisseur'], ['burette']],
    ['m-05', ['panneau'], []],
  ] as const)('%s : noms %j et descriptions %j repris d’AR-01 à l’identique', (id, noms, descriptions) => {
    const { textes } = l4(id);
    for (const cle of noms) expect(textes.noms[cle], cle).toEqual(TEXTES_AR01.noms[cle]);
    for (const cle of descriptions) expect(textes.descriptions[cle], cle).toEqual(TEXTES_AR01.descriptions[cle]);
  });

  it.each([
    ['m-01', 'galerie', { texte: 'tunnel technique', genre: 'm', nombre: 's', elision: false }],
    ['m-02', 'centre', { texte: 'au centre de la pièce', genre: 'm', nombre: 's', elision: false }],
    ['m-04', 'observation', { texte: 'salle d’observation', genre: 'f', nombre: 's', elision: false }],
  ] as const)('%s : « %s » a son propre nom, pas celui d’AR-01', (id, cle, nom) => {
    expect(l4(id).textes.noms[cle]).toEqual(nom);
    expect(TEXTES_AR01.noms[cle]).not.toEqual(nom);
  });

  it.each(Object.keys(L4))('vigilance aux noms : aucun texte de %s ne nomme une pièce d’AR-01 hors du morceau, ni une pièce des trois autres', (id) => {
    const textes = JSON.stringify(l4(id).textes).toLocaleLowerCase('fr');
    for (const mot of ['salon', 'local énergie', 'embarquement', 'baie', 'local technique']) expect(textes).not.toContain(mot);
    for (const [autre, { morceau, textes: siens }] of Object.entries(L4)) {
      if (autre === id) continue;
      for (const piece of morceau.pieces) {
        const nom = siens.noms[piece.nom]?.texte.toLocaleLowerCase('fr');
        expect(nom, `${autre}/${piece.id}`).toBeDefined();
        expect(textes, `${autre}/${piece.id}`).not.toContain(nom);
      }
    }
  });

  const L2_L3 = ['vestibule', 'm-03', 'm-06', 'm-07', 'm-08', 'm-09', 'm-10'] as const;

  function existant(id: string): EntreeMorceau {
    const trouve = MORCEAUX[id];
    if (trouve === undefined) throw new Error(`Morceau ${id} absent.`);
    return trouve;
  }

  // Les chaînes d'un jeu de textes, sans ses clés, en minuscules.
  function valeurs(textes: TextesMorceau): string {
    const chaines: string[] = [];
    const parcourir = (valeur: unknown): void => {
      if (typeof valeur === 'string') chaines.push(valeur);
      else if (typeof valeur === 'object' && valeur !== null) for (const sous of Object.values(valeur)) parcourir(sous);
    };
    parcourir(textes);
    return chaines.join('\n').toLocaleLowerCase('fr');
  }

  function motif(nom: string): RegExp {
    return new RegExp(`(?<!\\p{L})${nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\p{L})`, 'gu');
  }

  function nomme(texte: string, nom: string): boolean {
    return motif(nom).test(texte);
  }

  function nomsDePieces({ morceau, textes }: { readonly morceau: DefMorceau; readonly textes: TextesMorceau }): string[] {
    const reunis = reunir([textes]);
    return morceau.pieces.map((piece) => {
      const nom = reunis.noms[piece.nom]?.texte;
      if (nom === undefined) throw new Error(`${morceau.id} : pièce ${piece.id} sans nom.`);
      return nom.toLocaleLowerCase('fr');
    });
  }

  // Les textes d'un morceau, ses propres noms de pièces effacés : « atelier maintenance » ne nomme pas l'atelier de M-08.
  function horsDesSiens(entree: { readonly morceau: DefMorceau; readonly textes: TextesMorceau }): string {
    let texte = valeurs(entree.textes);
    for (const nom of nomsDePieces(entree).sort((a, b) => b.length - a.length)) texte = texte.replace(motif(nom), ' ');
    return texte;
  }

  it.each(Object.keys(L4))('vigilance aux noms : aucun texte de %s ne nomme une pièce du vestibule ni de M-03, M-06 à M-10', (id) => {
    const texte = horsDesSiens(l4(id));
    for (const autre of L2_L3) for (const nom of nomsDePieces(existant(autre))) expect(nomme(texte, nom), `${autre} : ${nom}`).toBe(false);
  });

  it.each(L2_L3)('vigilance aux noms : aucun texte de %s ne nomme une pièce de M-01, M-02, M-04 ou M-05', (id) => {
    const texte = horsDesSiens(existant(id));
    for (const [autre, entree] of Object.entries(L4)) for (const nom of nomsDePieces(entree)) expect(nomme(texte, nom), `${autre} : ${nom}`).toBe(false);
  });

  it('vigilance aux noms, cas négatifs : la description d’atelier d’AR-01 et « galerie » de M-08 seraient refusées', () => {
    const atelier = TEXTES_AR01.descriptions.atelier;
    if (atelier === undefined) throw new Error('Description d’atelier absente d’AR-01.');
    const avecAr01 = { morceau: MORCEAU_M02, textes: { ...TEXTES_MORCEAU_M02, descriptions: { ...TEXTES_MORCEAU_M02.descriptions, atelier } } };
    expect(nomme(horsDesSiens(avecAr01), 'atelier')).toBe(true);
    expect(nomme(horsDesSiens(l4('m-02')), 'atelier')).toBe(false);
    expect(nomme(horsDesSiens(existant('m-08')), 'galerie')).toBe(true);
  });

  it('M-01 : le palier ne fait entendre aucun pas ; M-05 ne dit ni « quai » ni « vide »', () => {
    expect(valeurs(TEXTES_MORCEAU_M01)).not.toContain('vos pas');
    for (const mot of ['quai', 'vide']) expect(nomme(valeurs(TEXTES_MORCEAU_M05), mot), mot).toBe(false);
  });

  it.each(Object.keys(L4))('PL-04 : chaque nom de pièce de %s tient dans son rectangle', (id) => {
    const { morceau, textes } = l4(id);
    for (const piece of morceau.pieces) {
      const nom = reunir([textes]).noms[piece.nom]?.texte ?? '';
      expect(nomLisible(nom, piece.plan?.largeur ?? 0, piece.plan?.hauteur ?? 0), nom).toBe(true);
    }
  });

  it('aucun mot de l’univers ni de la menace dans les textes de M-01, M-02, M-04 et M-05', () => {
    expect(fuitesDeCouches(Object.fromEntries(Object.entries(L4).map(([id, { textes }]) => [id, textes])))).toEqual([]);
  });
});

describe('stations de test refaites par l’assembleur', () => {
  it('le catalogue a les mondes fixes plus m-07 et m-10, dans l’ordre d’avant', () => {
    expect(Object.keys(MONDES)).toEqual(['ar-01', 'ar-02', 'monde-test', 'm-08', 'm-09']);
    expect(Object.keys(CATALOGUE.mondes)).toEqual(['ar-01', 'ar-02', 'monde-test', 'm-07', 'm-08', 'm-09', 'm-10', 'm-12']);
    for (const [id, entree] of Object.entries(MONDES)) expect(CATALOGUE.mondes[id]).toBe(entree);
  });

  it.each([
    ['m-07', 'm-07/p-soute', 'l-m-07-essai', true],
    ['m-10', 'm-10/p-entrepot', 'l-m-10-essai', false],
  ] as const)('%s : monde valide, créature en %s, porte de sortie ouverte : %s', (id, creature, sortie, ouverte) => {
    const monde = station(id);
    expect(monde.id).toBe(id);
    expect(validerMonde(monde)).toEqual([]);
    expect(monde.depart).toBe(`${id}/p-quartiers`);
    expect(monde.creature).toEqual({ piece: creature });
    expect(porte(monde, sortie)).toMatchObject({ entre: [`${id}/p-coursive`, 'essai/p-embarquement'], ouverte });
  });

  it('m-07 : mêmes pièces, liaisons et objets qu’avant, dans le même ordre', () => {
    const monde = station('m-07');
    expect(monde.pieces.map((piece) => piece.id)).toEqual(['m-07/p-quartiers', 'm-07/p-soute', 'm-07/p-machines', 'm-07/p-coursive', 'essai/p-embarquement', 'essai/p-cabine']);
    expect(monde.liaisons.map((liaison) => [liaison.id, liaison.nom, liaison.ouverte, liaison.bruyante === true])).toEqual([
      ['m-07/l-quartiers-soute', 'porte', true, false],
      ['m-07/l-quartiers-machines', 'porte', false, false],
      ['m-07/l-machines-coursive', 'porte_grippee', false, true],
      ['l-m-07-essai', 'porte', true, false],
      ['essai/l-embarquement-cabine', 'ecoutille', false, false],
    ]);
    expect(monde.objets.map((objet) => objet.id)).toEqual(['m-07/o-interrupteur', 'essai/o-capsule', 'essai/o-pupitre']);
    expect(monde.assistance).toEqual([
      { id: 'capsule', quand: { type: 'reveil' } },
      { id: 'presence', quand: { type: 'reveil' } },
    ]);
  });

  it('m-10 : mêmes pièces, liaisons et objets qu’avant, dans le même ordre', () => {
    const monde = station('m-10');
    expect(monde.pieces.map((piece) => piece.id)).toEqual([
      'm-10/p-quartiers',
      'm-10/p-antichambre',
      'm-10/p-chambre',
      'm-10/p-entrepot',
      'm-10/p-coursive',
      'essai/p-embarquement',
      'essai/p-cabine',
    ]);
    expect(monde.liaisons.map((liaison) => [liaison.id, liaison.nom, liaison.ouverte, liaison.bruyante === true])).toEqual([
      ['m-10/l-quartiers-antichambre', 'porte', true, false],
      ['m-10/l-antichambre-chambre', 'porte', false, false],
      ['m-10/l-chambre-entrepot', 'porte', true, false],
      ['m-10/l-entrepot-coursive', 'porte', true, false],
      ['m-10/l-quartiers-coursive', 'porte', false, false],
      ['l-m-10-essai', 'porte_grippee', false, true],
      ['essai/l-embarquement-cabine', 'ecoutille', false, false],
    ]);
    expect(monde.objets.map((objet) => objet.id)).toEqual(['m-10/o-fermeture', 'm-10/o-compresseur', 'essai/o-capsule', 'essai/o-pupitre']);
    expect(monde.assistance).toEqual([
      { id: 'capsule', quand: { type: 'reveil' } },
      { id: 'presence', quand: { type: 'reveil' } },
    ]);
  });

  it('un assembleur sans plan est refusé par le catalogue', () => {
    expect(() => creerCatalogue(() => ({ type: 'sans_plan' }))).toThrow(/m-07/);
  });
});

// Table des paires, compositions, résolution d'un identifiant et tirage (#152, 13 §4.1, D-253, D-260).

const ID = 'm07-m03-soute-2718281828';
const MONDE_ID = /^[a-z0-9-]{1,40}$/;

/** Compositions publiées de L3 (#153), figées avant l'arrivée de M-01, M-02, M-04 et M-05. */
const PUBLIEES_L3: readonly string[] = [
  'm07-m03-reserve',
  'm07-m03-soute',
  'm07-m06-embarquement',
  'm07-m06-soute',
  'm07-m08-m03-magasin',
  'm07-m08-m03-reserve',
  'm07-m08-m03-soute',
  'm07-m08-m06-embarquement',
  'm07-m08-m06-magasin',
  'm07-m08-m06-soute',
  'm07-m09-m03-cale',
  'm07-m09-m03-reserve',
  'm07-m09-m03-soute',
  'm07-m09-m06-cale',
  'm07-m09-m06-embarquement',
  'm07-m09-m06-soute',
  'm07-m10-m03-entrepot',
  'm07-m10-m03-reserve',
  'm07-m10-m03-soute',
  'm07-m10-m06-embarquement',
  'm07-m10-m06-entrepot',
  'm07-m10-m06-soute',
  'm08-m03-magasin',
  'm08-m03-reserve',
  'm08-m06-embarquement',
  'm08-m06-magasin',
  'm08-m07-m03-magasin',
  'm08-m07-m03-reserve',
  'm08-m07-m03-soute',
  'm08-m07-m06-embarquement',
  'm08-m07-m06-magasin',
  'm08-m07-m06-soute',
  'm08-m09-m03-cale',
  'm08-m09-m03-magasin',
  'm08-m09-m03-reserve',
  'm08-m09-m06-cale',
  'm08-m09-m06-embarquement',
  'm08-m09-m06-magasin',
  'm08-m10-m03-entrepot',
  'm08-m10-m03-magasin',
  'm08-m10-m03-reserve',
  'm08-m10-m06-embarquement',
  'm08-m10-m06-entrepot',
  'm08-m10-m06-magasin',
  'm09-m03-cale',
  'm09-m03-reserve',
  'm09-m06-cale',
  'm09-m06-embarquement',
  'm09-m07-m03-cale',
  'm09-m07-m03-reserve',
  'm09-m07-m03-soute',
  'm09-m07-m06-cale',
  'm09-m07-m06-embarquement',
  'm09-m07-m06-soute',
  'm09-m08-m03-cale',
  'm09-m08-m03-magasin',
  'm09-m08-m03-reserve',
  'm09-m08-m06-cale',
  'm09-m08-m06-embarquement',
  'm09-m08-m06-magasin',
  'm09-m10-m03-cale',
  'm09-m10-m03-entrepot',
  'm09-m10-m03-reserve',
  'm09-m10-m06-cale',
  'm09-m10-m06-embarquement',
  'm09-m10-m06-entrepot',
  'm10-m03-entrepot',
  'm10-m03-reserve',
  'm10-m06-embarquement',
  'm10-m06-entrepot',
  'm10-m07-m03-entrepot',
  'm10-m07-m03-reserve',
  'm10-m07-m03-soute',
  'm10-m07-m06-embarquement',
  'm10-m07-m06-entrepot',
  'm10-m07-m06-soute',
  'm10-m08-m03-entrepot',
  'm10-m08-m03-magasin',
  'm10-m08-m03-reserve',
  'm10-m08-m06-embarquement',
  'm10-m08-m06-entrepot',
  'm10-m08-m06-magasin',
  'm10-m09-m03-cale',
  'm10-m09-m03-entrepot',
  'm10-m09-m03-reserve',
  'm10-m09-m06-cale',
  'm10-m09-m06-embarquement',
  'm10-m09-m06-entrepot',
];
const SANS_M03_M07 = PAIRES.filter((ligne) => !(ligne.a === 'M-03' && ligne.b === 'M-07'));

function hasardDepuis(graine: number): () => number {
  let etat = generateurDepuisGraine(graine);
  return () => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
}

function suiteDe(...valeurs: number[]): () => number {
  let rang = 0;
  return () => {
    const valeur = valeurs[rang++];
    if (valeur === undefined) throw new Error('Hasard épuisé.');
    return valeur;
  };
}

function entreeDe(resultat: EntreeMonde | Refus): EntreeMonde {
  if ('refus' in resultat) throw new Error(resultat.refus);
  return resultat;
}

function refusDe(resultat: EntreeMonde | Refus): string {
  if (!('refus' in resultat)) throw new Error(`Station acceptée : ${resultat.monde.id}.`);
  return resultat.refus;
}

const DE_TEST = (station: DefStation): boolean => station.id === 'm-07' || station.id === 'm-10' || station.id === 'm-12';

/** Assembleur qui note les stations demandées, hors stations de test assemblées à la création du catalogue. */
function espion(repondre: Assembleur = assemblerStation): { readonly appels: DefStation[]; readonly assembler: Assembleur } {
  const appels: DefStation[] = [];
  return {
    appels,
    assembler: (station) => {
      if (DE_TEST(station)) return assemblerStation(station);
      appels.push(station);
      return repondre(station);
    },
  };
}

describe('table des paires (13 §4.1)', () => {
  const NUMEROS = Array.from({ length: 12 }, (_, rang) => `M-${String(rang + 1).padStart(2, '0')}`);

  it('66 paires, chacune une seule fois, dans l’ordre de la table, a < b, chacune avec sa règle', () => {
    expect(PAIRES).toHaveLength(66);
    expect(PAIRES.map((ligne) => `${ligne.a} + ${ligne.b}`)).toEqual(NUMEROS.flatMap((a, rang) => NUMEROS.slice(rang + 1).map((b) => `${a} + ${b}`)));
    for (const ligne of PAIRES) {
      expect(ligne.a < ligne.b).toBe(true);
      expect(ligne.regle).toMatch(/\(.*D-\d{3}.*\)$/);
    }
  });

  it('seule M-03 + M-06 est jamais ensemble', () => {
    expect(PAIRES.filter((ligne) => ligne.verdict === 'jamais')).toEqual([
      { a: 'M-03', b: 'M-06', verdict: 'jamais', regle: 'Deux morceaux finals ; un seul final par station (D-159, D-172)' },
    ]);
    expect(PAIRES.filter((ligne) => ligne.verdict === 'permise')).toHaveLength(65);
  });
});

describe('compositions', () => {
  it('850 compositions : 580 en chaîne (290 par final ; 40 à un chemin ; 540 à deux) et 270 en ordre libre (45 paires × 2 finals × 3 places)', () => {
    const { compositions } = CATALOGUE;
    const CHEMINS = ['m-01', 'm-02', 'm-04', 'm-05', 'm-07', 'm-08', 'm-09', 'm-10', 'm-11', 'm-12'];
    expect(compositions).toHaveLength(850);
    const chaine = compositions.filter((composition) => composition.forme === 'chaine');
    const libre = compositions.filter((composition) => composition.forme === 'libre');
    expect(chaine).toHaveLength(580);
    expect(libre).toHaveLength(270);
    for (const final of ['m-03', 'm-06']) expect(chaine.filter((composition) => composition.final === final), final).toHaveLength(290);
    expect(chaine.filter((composition) => composition.chemins.length === 1)).toHaveLength(40);
    expect(chaine.filter((composition) => composition.chemins.length === 2)).toHaveLength(540);
    const parStation = new Map<string, number>();
    for (const composition of compositions) {
      const morceaux: string[] = [...composition.chemins, composition.final];
      expect(['m-03', 'm-06'], composition.id).toContain(composition.final);
      expect(new Set(composition.chemins).size, composition.id).toBe(composition.chemins.length);
      for (const chemin of composition.chemins) expect(CHEMINS, composition.id).toContain(chemin);
      expect(morceaux.includes('m-03') && morceaux.includes('m-06'), composition.id).toBe(false);
      const cle = `${composition.forme} ${morceaux.join(' + ')}`;
      parStation.set(cle, (parStation.get(cle) ?? 0) + 1);
    }
    for (const composition of chaine) expect(composition.refus, composition.id).toBeNull();
    for (const [station, places] of parStation) expect(places, station).toBe(station.split(' + ').length);
    // Ordre libre : deux branches distinctes, A au plus petit numéro, identifiant `ol-<A>-<B>-<final>-<place>`.
    for (const composition of libre) {
      const [a, b] = composition.chemins;
      expect(composition.chemins, composition.id).toHaveLength(2);
      expect((a ?? '') < (b ?? ''), composition.id).toBe(true);
      expect(composition.id.startsWith(`ol-${[a, b, composition.final].map((id) => id?.replace('-', '')).join('-')}-`), composition.id).toBe(true);
    }
  });

  it('ordre libre (spec L5 §3.2) : créature sur le palier ou dans l’atelier écartée avant tout plan, avec son motif (D-268)', () => {
    const libre = CATALOGUE.compositions.filter((composition) => composition.forme === 'libre');
    const ecartees = libre.filter((composition) => composition.refus !== null);
    expect(ecartees).toHaveLength(36);
    for (const composition of ecartees) {
      expect(['m-01/p-palier', 'm-02/p-atelier'], composition.id).toContain(composition.creature);
      expect(composition.refus).toContain('D-268');
    }
    expect(refusDe(CATALOGUE.resoudre('ol-m01-m07-m03-palier-1'))).toContain('D-268');
    // En chaîne, les mêmes places restent vérifiées, et publiées derrière un obstacle utile (D-268).
    expect(COMPOSITIONS_PUBLIEES).toContain('m07-m01-m03-palier');
  });

  it('les compositions de L3 et toutes les publiées sont dans le catalogue ; celles de L3 restent publiées', () => {
    const ids = CATALOGUE.compositions.map((composition) => composition.id);
    expect(PUBLIEES_L3).toHaveLength(88);
    expect(ids).toEqual(expect.arrayContaining([...PUBLIEES_L3]));
    expect(ids).toEqual(expect.arrayContaining([...COMPOSITIONS_PUBLIEES]));
    expect(COMPOSITIONS_PUBLIEES).toEqual(expect.arrayContaining([...PUBLIEES_L3]));
  });

  it('publication (spec L4 §4, L5 §4) : en chaîne, aucune composition palier ou atelier sans M-04, M-07, M-08 ni M-10 avant la place, ni sans preuve de drone (#270) ; en ordre libre, toutes celles que leur place n’écarte pas', () => {
    const AIDES = ['m-04', 'm-07', 'm-08', 'm-10'];
    const bouchees = CATALOGUE.compositions.filter(({ forme, chemins, creature }) => {
      if (forme !== 'chaine' || (creature !== 'm-01/p-palier' && creature !== 'm-02/p-atelier')) return false;
      const avant = chemins.slice(0, chemins.indexOf(creature.slice(0, creature.indexOf('/'))));
      return !avant.some((chemin) => AIDES.includes(chemin));
    });
    expect(bouchees).toHaveLength(60);
    const bouchee = new Set(bouchees.map(({ id }) => id));
    expect(COMPOSITIONS_PUBLIEES).toEqual(CATALOGUE.compositions.filter(({ id, refus }) => refus === null && !bouchee.has(id) && !SANS_PREUVE_DRONE.includes(id)).map(({ id }) => id));
  });

  it('identifiants de composition uniques, triés, minuscules, chiffres et tirets, 29 caractères au plus : avec la graine, 40 au plus', () => {
    const ids = CATALOGUE.compositions.map((composition) => composition.id);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9-]{1,29}$/);
      expect(`${id}-4294967295`).toMatch(MONDE_ID);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
    expect(COMPOSITIONS_PUBLIEES).toEqual([...COMPOSITIONS_PUBLIEES].sort());
  });

  it('places distinctes : par station, une composition par place, aucune place du même nom affiché qu’une autre', () => {
    const parStation = new Map<string, Composition[]>();
    for (const composition of CATALOGUE.compositions) {
      const cle = `${composition.forme} ${[...composition.chemins, composition.final].join(' + ')}`;
      parStation.set(cle, [...(parStation.get(cle) ?? []), composition]);
    }
    expect(parStation.size).toBe(200 + 90);
    for (const [cle, compositions] of parStation) {
      const morceaux = cle.slice(cle.indexOf(' ') + 1).split(' + ').map((id) => MORCEAUX[id]);
      const places = morceaux.flatMap((entree) => entree?.morceau.placesCreature.map((place) => `${entree.morceau.id}/${place}`) ?? []);
      expect(compositions.map((composition) => composition.creature).sort(), cle).toEqual([...places].sort());
      const noms = morceaux.flatMap((entree) =>
        (entree?.morceau.placesCreature ?? []).map((place) => {
          const nom = entree?.morceau.pieces.find((piece) => piece.id === place)?.nom ?? place;
          return entree?.textes.noms[nom]?.texte ?? nom;
        }),
      );
      expect(new Set(noms).size, cle).toBe(noms.length);
    }
  });

  it('G-02 : sans la paire M-03 + M-07, ses compositions sont refusées avec le motif de la table, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, SANS_M03_M07);
    const motif = 'Paire M-03 + M-07 absente de la table : refusée par défaut.';
    // Toute station qui passe par M-07 et se termine par M-03 est refusée ; les autres restent, M-07 vers M-06 compris.
    // En ordre libre, la paire passe avant la place écartée (D-268).
    expect(catalogue.compositions.map((composition) => [composition.id, composition.refus])).toEqual(
      CATALOGUE.compositions.map(({ id, chemins, final, refus }) => [id, chemins.includes('m-07') && final === 'm-03' ? motif : refus]),
    );
    expect(catalogue.compositions.filter((composition) => composition.refus === motif)).toHaveLength(56 + 27);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm07-m03-soute'))).toContain('M-03 + M-07');
    expect(refusDe(catalogue.resoudre('m07-m03-soute-42'))).toContain('M-03 + M-07');
    expect(refusDe(catalogue.construire('m07-m03-soute', 42))).toContain('M-03 + M-07');
    expect(appels).toEqual([]);
    // Le tirage libre ne propose plus que les compositions qui restent.
    const restantes = catalogue.compositions.filter((composition) => composition.refus === null).map((composition) => composition.id);
    const hasard = hasardDepuis(2);
    for (let rang = 0; rang < 20; rang++) expect(restantes).toContain(entreeDe(catalogue.tirer(hasard)).monde.id.replace(/-\d+$/, ''));
  });

  it('G-02 : sans la paire M-07 + M-10, m07-m10-m03-soute est refusée avec le motif de la table, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, PAIRES.filter((ligne) => !(ligne.a === 'M-07' && ligne.b === 'M-10')));
    const motif = 'Paire M-07 + M-10 absente de la table : refusée par défaut.';
    expect(catalogue.compositions.find((composition) => composition.id === 'm07-m10-m03-soute')?.refus).toBe(motif);
    expect(catalogue.compositions.filter((composition) => composition.refus !== null).map((composition) => composition.id)).toEqual([
      'm07-m10-m03-entrepot',
      'm07-m10-m03-reserve',
      'm07-m10-m03-soute',
      'm07-m10-m06-embarquement',
      'm07-m10-m06-entrepot',
      'm07-m10-m06-soute',
      'm10-m07-m03-entrepot',
      'm10-m07-m03-reserve',
      'm10-m07-m03-soute',
      'm10-m07-m06-embarquement',
      'm10-m07-m06-entrepot',
      'm10-m07-m06-soute',
      'ol-m01-m02-m03-atelier',
      'ol-m01-m02-m03-palier',
      'ol-m01-m02-m06-atelier',
      'ol-m01-m02-m06-palier',
      'ol-m01-m04-m03-palier',
      'ol-m01-m04-m06-palier',
      'ol-m01-m05-m03-palier',
      'ol-m01-m05-m06-palier',
      'ol-m01-m07-m03-palier',
      'ol-m01-m07-m06-palier',
      'ol-m01-m08-m03-palier',
      'ol-m01-m08-m06-palier',
      'ol-m01-m09-m03-palier',
      'ol-m01-m09-m06-palier',
      'ol-m01-m10-m03-palier',
      'ol-m01-m10-m06-palier',
      'ol-m01-m11-m03-palier',
      'ol-m01-m11-m06-palier',
      'ol-m01-m12-m03-palier',
      'ol-m01-m12-m06-palier',
      'ol-m02-m04-m03-atelier',
      'ol-m02-m04-m06-atelier',
      'ol-m02-m05-m03-atelier',
      'ol-m02-m05-m06-atelier',
      'ol-m02-m07-m03-atelier',
      'ol-m02-m07-m06-atelier',
      'ol-m02-m08-m03-atelier',
      'ol-m02-m08-m06-atelier',
      'ol-m02-m09-m03-atelier',
      'ol-m02-m09-m06-atelier',
      'ol-m02-m10-m03-atelier',
      'ol-m02-m10-m06-atelier',
      'ol-m02-m11-m03-atelier',
      'ol-m02-m11-m06-atelier',
      'ol-m02-m12-m03-atelier',
      'ol-m02-m12-m06-atelier',
      'ol-m07-m10-m03-entrepot',
      'ol-m07-m10-m03-reserve',
      'ol-m07-m10-m03-soute',
      'ol-m07-m10-m06-embarquement',
      'ol-m07-m10-m06-entrepot',
      'ol-m07-m10-m06-soute',
    ]);
    expect(catalogue.compositions.find((composition) => composition.id === 'ol-m07-m10-m03-soute')?.refus).toBe(motif);
    expect(refusDe(catalogue.resoudre('m07-m10-m03-soute-42'))).toBe(motif);
    expect(refusDe(catalogue.construire('m07-m10-m03-soute', 42))).toBe(motif);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm07-m10-m03-soute'))).toBe(motif);
    expect(appels).toEqual([]);
  });

  it('le motif est celui de la première paire refusée : chemin–chemin, puis chaque chemin–final, dans l’ordre de la station', () => {
    const sans = (...paires: string[]) => PAIRES.filter((ligne) => !paires.includes(`${ligne.a} + ${ligne.b}`));
    const refus = (table: typeof PAIRES, id: string) => creerCatalogue(assemblerStation, table).compositions.find((composition) => composition.id === id)?.refus;
    expect(refus(sans('M-07 + M-10', 'M-03 + M-07'), 'm07-m10-m03-soute')).toContain('M-07 + M-10');
    expect(refus(sans('M-03 + M-07', 'M-03 + M-10'), 'm07-m10-m03-soute')).toContain('M-03 + M-07');
    expect(refus(sans('M-03 + M-07', 'M-03 + M-10'), 'm10-m07-m03-soute')).toContain('M-03 + M-10');
  });

  it('une paire jamais ensemble refuse la composition avec sa règle, sans appeler l’assembleur', () => {
    const { appels, assembler } = espion();
    const table = PAIRES.map((ligne) => (ligne.a === 'M-03' && ligne.b === 'M-10' ? { ...ligne, verdict: 'jamais' as const, regle: 'Règle d’essai (D-000)' } : ligne));
    const catalogue = creerCatalogue(assembler, table);
    const motif = refusDe(catalogue.resoudre('m10-m03-entrepot-1'));
    expect(motif).toContain('M-03 + M-10');
    expect(motif).toContain('Règle d’essai (D-000)');
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm10-m03-reserve'))).toBe(motif);
    expect(appels).toEqual([]);
  });

  it('une composition possible mais non publiée n’est ni résolue ni tirée ; construire l’assemble quand même', () => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler, PAIRES, ['m07-m03-soute']);
    const motif = 'Composition m10-m03-entrepot non prouvée : non proposée.';
    expect(refusDe(catalogue.resoudre('m10-m03-entrepot-1'))).toBe(motif);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), 'm10-m03-entrepot'))).toBe(motif);
    expect(appels).toEqual([]);
    expect(entreeDe(catalogue.construire('m10-m03-entrepot', 2718281828)).monde.id).toBe('m10-m03-entrepot-2718281828');
    const hasard = hasardDepuis(3);
    for (let rang = 0; rang < 10; rang++) expect(entreeDe(catalogue.tirer(hasard)).monde.id).toMatch(/^m07-m03-soute-/);
  });

  it.each(['m01-m03-palier', 'm02-m06-atelier'])('vigilance 2 (spec L4 §4) : %s, possible mais non prouvée, n’est ni résolue ni tirée', (composition) => {
    const { appels, assembler } = espion();
    const catalogue = creerCatalogue(assembler);
    expect(catalogue.compositions.find(({ id }) => id === composition)?.refus).toBeNull();
    expect(COMPOSITIONS_PUBLIEES).not.toContain(composition);
    let resultat: EntreeMonde | Refus | undefined;
    expect(() => (resultat = catalogue.resoudre(`${composition}-1`))).not.toThrow();
    expect(refusDe(resultat as EntreeMonde | Refus)).toBe(`Composition ${composition} non prouvée : non proposée.`);
    expect(refusDe(catalogue.tirer(hasardDepuis(1), composition))).toContain('non prouvée');
    expect(appels).toEqual([]);
  });
});

describe('résolution d’un identifiant', () => {
  const { appels, assembler } = espion();
  const catalogue = creerCatalogue(assembler);

  it('un monde fixe ou une station de test se résout tel quel', () => {
    expect(catalogue.resoudre('ar-01')).toBe(catalogue.mondes['ar-01']);
    expect(catalogue.resoudre('m-07')).toBe(catalogue.mondes['m-07']);
  });

  it.each([
    '',
    'M07-M03-SOUTE-1',
    'm07-m03-soute-4294967296',
    'm07-m03-soute-99999999999',
    'm07-m03-soute-007',
    'm07-m03-soute-',
    'm07-m03-soute',
    'toString',
    '__proto__',
    'constructor',
    'hasOwnProperty-1',
    'm07-m03-inconnue-1',
    `m07-m03-soute-1${'0'.repeat(40)}`,
    'm07-m07-m03-soute-1',
    'm03-m07-m03-soute-1',
    'm07-m10-m07-m03-soute-1',
    'm07-m10-m99-soute-1',
  ])('vigilance 3 : %j est refusé avec un motif, sans exception ni assemblage', (id) => {
    appels.length = 0;
    let resultat: EntreeMonde | Refus | undefined;
    expect(() => (resultat = catalogue.resoudre(id))).not.toThrow();
    expect(refusDe(resultat as EntreeMonde | Refus)).not.toBe('');
    expect(appels).toEqual([]);
  });

  it.each([
    '',
    'M07-M03-SOUTE',
    'toString',
    '__proto__',
    'm07-m03-inconnue',
    ID,
    'm07-m07-m03-soute',
    'm03-m07-m03-soute',
    'm07-m10-m07-m03-soute',
    'm07-m10-m99-soute',
  ])('tirer avec %j : composition refusée, sans assemblage', (composition) => {
    appels.length = 0;
    expect(refusDe(catalogue.tirer(hasardDepuis(1), composition))).not.toBe('');
    expect(appels).toEqual([]);
  });

  it.each([-1, 1.5, 4294967296, Number.NaN])('construire avec la graine %s : refusée, sans assemblage', (graine) => {
    appels.length = 0;
    expect(refusDe(catalogue.construire('m07-m03-soute', graine))).toContain('graine');
    expect(refusDe(catalogue.construire('toString', 1))).not.toBe('');
    expect(appels).toEqual([]);
  });

  it(`${ID} : même objet à chaque fois ; vestibule de départ, créature dans la soute, portes entre morceaux fermées`, () => {
    const premiere = entreeDe(catalogue.resoudre(ID));
    expect(catalogue.resoudre(ID)).toBe(premiere);
    expect(catalogue.construire('m07-m03-soute', 2718281828)).toBe(premiere);
    const { monde, textes, parcours } = premiere;
    expect(monde.id).toBe(ID);
    expect(validerMonde(monde)).toEqual([]);
    expect(monde.depart).toBe('vestibule/p-vestibule');
    expect(monde.creature).toEqual({ piece: 'm-07/p-soute' });
    expect(monde.pieces.map((piece) => piece.id)).toEqual([
      'vestibule/p-vestibule',
      'm-07/p-quartiers',
      'm-07/p-soute',
      'm-07/p-machines',
      'm-07/p-coursive',
      'm-03/p-energie',
      'm-03/p-reserve',
      'm-03/p-embarquement',
      'm-03/p-cabine',
    ]);
    expect(porte(monde, 'l-vestibule-m-07')).toMatchObject({ entre: ['vestibule/p-vestibule', 'm-07/p-quartiers'], ouverte: false });
    expect(porte(monde, 'l-m-07-m-03')).toMatchObject({ entre: ['m-07/p-coursive', 'm-03/p-energie'], ouverte: false });
    expect(monde.assistance).toEqual([
      { id: 'reveil', quand: { type: 'reveil' } },
      { id: 'depart', quand: { type: 'evacuation' } },
      { id: 'patience', quand: { type: 'patience' } },
      { id: 'energie', quand: { type: 'arrivee', piece: 'm-03/p-energie' } },
    ]);
    expect(parcours).toEqual([]);
    expect(Object.keys(textes.assistance).sort()).toEqual(['depart', 'energie', 'patience', 'reveil']);
  });

  // Empreintes relevées avec le message de patience (#225) ; sans lui, ce sont celles d'avant, plans inchangés.
  it.each([
    ['m07-m03-reserve-2718281828', '06b30f6d5e2988'],
    ['m07-m03-soute-2718281828', '10334387143f1d'],
    ['m10-m03-entrepot-2718281828', '0911ccb5fafe7b'],
    ['m10-m03-reserve-2718281828', '0b24637e459cc3'],
  ])('vigilance 2 : %s, station de L2, est reconstruite à l’identique (empreinte du monde %s)', (id, attendue) => {
    expect(empreinte(entreeDe(catalogue.resoudre(id)).monde)).toBe(attendue);
  });

  it('vigilance 1 (spec L4 §4) : les 88 stations de L3 sont reconstruites à l’identique à la graine 2718281828', () => {
    const monde = (composition: string): DefMonde => entreeDe(catalogue.resoudre(`${composition}-2718281828`)).monde;
    const mondes = PUBLIEES_L3.map(monde);
    expect(empreinte(Object.fromEntries(mondes.map((station) => [station.id, empreinte(station)])))).toBe('0cd581b911ddba');
    expect(['m08-m09-m06-embarquement', 'm10-m09-m03-entrepot', 'm07-m10-m06-soute'].map((id) => empreinte(monde(id)))).toEqual([
      '0b01d3ed5cc2ff',
      '00650eb3d7f7ae',
      '00a41aaab24725',
    ]);
  });

  it('messages d’IA Station au réveil et au départ : écrits, sans pièce nommée ni présence détectée', () => {
    const { monde, textes } = entreeDe(catalogue.resoudre(ID));
    const noms = monde.pieces.map((piece) => textes.noms[piece.nom]?.texte.toLocaleLowerCase('fr') ?? piece.nom);
    for (const id of ['reveil', 'depart']) {
      const message = textes.assistance[id] ?? '';
      expect(message).not.toBe('');
      expect(message).not.toMatch(/présence|\d|\{/i);
      for (const nom of noms) expect(message.toLocaleLowerCase('fr')).not.toContain(nom);
    }
  });

  it('identifiant exact sans plan : refusé ; au tirage, une nouvelle graine à chaque plan manquant, 50 essais au plus', () => {
    const sansPlan = espion(() => ({ type: 'sans_plan' }));
    const vide = creerCatalogue(sansPlan.assembler);
    expect(refusDe(vide.resoudre('m10-m03-entrepot-5'))).toContain('plan');
    sansPlan.appels.length = 0;
    let tires = 0;
    expect(refusDe(vide.tirer(() => ++tires, 'm07-m03-soute'))).toContain('50');
    expect(tires).toBe(50);
    expect(sansPlan.appels.map((station) => station.graine)).toEqual(Array.from({ length: 50 }, (_, rang) => rang + 1));
  });

  it('le tirage consomme le hasard dans l’ordre : final, composition, puis graine du plan', () => {
    const manque = espion((station) => (station.graine === 7 ? { type: 'sans_plan' } : assemblerStation(station)));
    const tirage = creerCatalogue(manque.assembler);
    // Final : 4 % 2 (m-03) ; composition : 5 % 162 (m01-m05-m03-tri) ; graine 7 sans plan, puis 2718281828.
    expect(entreeDe(tirage.tirer(suiteDe(4, 5, 7, 2718281828))).monde.id).toBe('m01-m05-m03-tri-2718281828');
    expect(manque.appels.map((station) => station.graine)).toEqual([7, 2718281828]);
  });

  it('pile ou face (D-253) : le premier tirage choisit le final, 0 donne M-03, 1 donne M-06', () => {
    const graines = Array.from({ length: 50 }, (_, rang) => rang);
    const finalDe = (resultat: EntreeMonde | Refus): string | undefined => {
      const { id } = entreeDe(resultat).monde;
      return CATALOGUE.compositions.find((composition) => composition.id === id.slice(0, id.lastIndexOf('-')))?.final;
    };
    expect(finalDe(catalogue.tirer(suiteDe(0, 0, ...graines)))).toBe('m-03');
    expect(finalDe(catalogue.tirer(suiteDe(1, 0, ...graines)))).toBe('m-06');
  });
});

describe('stations tirées', () => {
  function porteDuVestibule(vue: Observation, action: 'aller' | 'ouvrir') {
    return vue.menu.find((option) => option.action === action && option.cible.sorte === 'passage' && option.cible.nom === 'porte');
  }

  it.each(COMPOSITIONS_PUBLIEES)('GP-04, %s : rien au vestibule ; regarder est gratuit ; ouvrir puis sortir sans dé', (composition) => {
    const { monde } = entreeDe(CATALOGUE.tirer(hasardDepuis(11), composition));
    const partie = nouvellePartie(monde, { version: 'stations-test', graine: 20261015 });
    const vue = observer(monde, partie.etat);
    expect(partie.etat.piece).toBe('vestibule/p-vestibule');
    expect(monde.objets.filter((objet) => objet.piece === monde.depart)).toEqual([]);
    expect(monde.creature?.piece).not.toBe(monde.depart);
    expect(vue).toMatchObject({ objets: [], creatureVisible: false, sante: 'indemne' });
    expect(porteDuVestibule(vue, 'aller')).toMatchObject({ disponible: false });

    const regards = vue.menu.filter((option) => option.action === 'regarder');
    expect(regards.length).toBeGreaterThan(0);
    for (const regard of regards) {
      const resultat = jouer(monde, partie, regard.commande);
      expect(resultat.type).toBe('consultation');
      expect(empreinteEtat(resultat.partie.etat)).toBe(empreinteEtat(partie.etat));
      expect(resultat.partie.enregistrement.actions).toEqual([]);
    }

    const ouvrir = porteDuVestibule(vue, 'ouvrir');
    expect(ouvrir?.disponible).toBe(true);
    const ouverte = jouer(monde, partie, ouvrir?.commande);
    expect(ouverte).toMatchObject({ type: 'engagee', tirages: [] });
    const aller = porteDuVestibule(observer(monde, ouverte.partie.etat), 'aller');
    expect(aller?.disponible).toBe(true);
    const sortie = jouer(monde, ouverte.partie, aller?.commande);
    expect(sortie).toMatchObject({ type: 'engagee', tirages: [] });
    // En ordre libre, le vestibule donne sur le couloir commun (13 §8.1).
    const { forme, chemins: [premier = ''] = [] } = CATALOGUE.compositions.find(({ id }) => id === composition) ?? {};
    const suivant = forme === 'libre' ? 'carrefour' : premier;
    expect(sortie.partie.etat.piece).toBe(`${suivant}/${MORCEAUX[suivant]?.morceau.entree ?? ''}`);
  });

  it('PL-04 : sur 50 stations tirées, chaque nom de pièce tient dans son rectangle', () => {
    const hasard = hasardDepuis(4);
    for (let rang = 0; rang < 50; rang++) {
      const { monde, textes } = entreeDe(CATALOGUE.tirer(hasard));
      for (const piece of monde.pieces) {
        if (piece.plan === undefined) {
          expect(piece.sousPosition).toBe(true);
          continue;
        }
        const texte = textes.noms[piece.nom]?.texte ?? '';
        expect(nomLisible(texte, piece.plan.largeur, piece.plan.hauteur), `${monde.id}, ${piece.id}`).toBe(true);
      }
    }
  });

  it('10 000 tirages : toujours une composition publiée, chacune au moins une fois, identifiant conforme et résoluble', () => {
    const hasard = hasardDepuis(20261015);
    const vues = new Set<string>();
    for (let rang = 0; rang < 10000; rang++) {
      const entree = entreeDe(CATALOGUE.tirer(hasard));
      const { id } = entree.monde;
      expect(id).toMatch(MONDE_ID);
      const composition = id.slice(0, id.lastIndexOf('-'));
      expect(COMPOSITIONS_PUBLIEES).toContain(composition);
      expect(id.slice(composition.length + 1)).toMatch(/^(0|[1-9]\d*)$/);
      expect(CATALOGUE.resoudre(id)).toBe(entree);
      vues.add(composition);
    }
    expect([...vues].sort()).toEqual(COMPOSITIONS_PUBLIEES);
  }, 60000);

  it('vigilance 5 : l’export d’une partie neuve d’une station tirée passe le service de rapports', () => {
    const { monde } = entreeDe(CATALOGUE.tirer(hasardDepuis(5)));
    const partie = exporter(monde, nouvellePartie(monde, { version: '0.1.0', graine: 7 }));
    const demande = { type: 'partie', version: '0.1.0', build: '1', commit: '', pr: 152, commentaire: '', valide: false, partie, ecran: [], validation: null };
    expect(lireDemande(JSON.parse(JSON.stringify(demande)) as unknown)).toMatchObject({ ok: true, demande: { partie: { monde: monde.id } } });
  });

  it('vigilance 4 : l’export d’une partie neuve de m08-m09-m06-embarquement-2718281828 passe le service de rapports', () => {
    const { monde } = entreeDe(CATALOGUE.resoudre('m08-m09-m06-embarquement-2718281828'));
    const partie = exporter(monde, nouvellePartie(monde, { version: '0.1.0', graine: 7 }));
    const demande = { type: 'partie', version: '0.1.0', build: '1', commit: '', pr: 153, commentaire: '', valide: false, partie, ecran: [], validation: null };
    expect(lireDemande(JSON.parse(JSON.stringify(demande)) as unknown)).toMatchObject({
      ok: true,
      demande: { partie: { monde: 'm08-m09-m06-embarquement-2718281828' } },
    });
  });
});

describe('pièces du même nom numérotées (D-208)', () => {
  // Deux chemins de test qui apportent chacun une coursive.
  const chemin = (id: string, nom = 'coursive'): DefMorceau => ({
    id,
    famille: 'chemin',
    pieces: [{ id: 'p-coursive', nom, plan: { x: 0, y: 0, largeur: 4, hauteur: 3 } }],
    liaisons: [],
    objets: [],
    entree: 'p-coursive',
    sortie: { piece: 'p-coursive', porte: { nom: 'porte' } },
    placesCreature: ['p-coursive'],
    demande: [],
    fournit: ['acces'],
  });
  const COURSIVE: TextesMorceau = {
    noms: { coursive: { texte: 'coursive', genre: 'f', nombre: 's', elision: false } },
    descriptions: { coursive: ['Une coursive étroite.', 'Un couloir de service.'] },
    assistance: {},
  };

  function deuxCoursives(noms: readonly [string, string] = ['coursive', 'coursive'], propres: TextesMorceau = COURSIVE): EntreeMonde {
    const { vestibule, essai } = MORCEAUX;
    if (vestibule === undefined || essai === undefined) throw new Error('Morceaux absents.');
    for (let graine = 1; graine <= 50; graine++) {
      const morceaux = [vestibule.morceau, chemin('c-a', noms[0]), chemin('c-b', noms[1]), essai.morceau];
      const station: DefStation = { id: 'deux-coursives', morceaux, creature: 'c-a/p-coursive', graine };
      const resultat = assemblerStation(station);
      if (resultat.type === 'station') return { monde: resultat.monde, textes: reunir([vestibule.textes, propres, essai.textes]), parcours: [] };
    }
    throw new Error('Aucun plan pour la station à deux coursives.');
  }

  it('deux coursives deviennent « coursive A » et « coursive B », mêmes genre et descriptions', () => {
    const entree = deuxCoursives();
    const numerotee = numeroter(entree);
    expect(numerotee.monde.pieces.map((piece) => [piece.id, piece.nom])).toEqual([
      ['vestibule/p-vestibule', 'vestibule'],
      ['c-a/p-coursive', 'coursive_a'],
      ['c-b/p-coursive', 'coursive_b'],
      ['essai/p-embarquement', 'embarquement'],
      ['essai/p-cabine', 'cabine'],
    ]);
    expect(numerotee.textes.noms.coursive_a).toEqual({ texte: 'coursive A', genre: 'f', nombre: 's', elision: false });
    expect(numerotee.textes.noms.coursive_b).toEqual({ texte: 'coursive B', genre: 'f', nombre: 's', elision: false });
    expect(numerotee.textes.descriptions.coursive_a).toEqual(COURSIVE.descriptions.coursive);
    expect(numerotee.textes.descriptions.coursive_b).toEqual(COURSIVE.descriptions.coursive);
    expect(validerMonde(numerotee.monde)).toEqual([]);
    expect(entree.monde.pieces[1]?.nom).toBe('coursive');
  });

  it('un nom numéroté tient dans son rectangle et ne contient aucun chiffre (carte, écran de fin)', () => {
    const { monde, textes } = numeroter(deuxCoursives());
    const numerotees = monde.pieces.filter((piece) => piece.id.endsWith('/p-coursive'));
    expect(numerotees).toHaveLength(2);
    for (const piece of numerotees) {
      const texte = textes.noms[piece.nom]?.texte ?? '';
      expect(texte).toMatch(/^coursive [A-Z]$/);
      expect(`${piece.nom} ${texte}`).not.toMatch(/\d/);
      if (piece.plan === undefined) throw new Error(`${piece.id} sans plan.`);
      expect(nomLisible(texte, piece.plan.largeur, piece.plan.hauteur)).toBe(true);
    }
  });

  it('deux clés différentes au même nom affiché reçoivent aussi une lettre, chacune avec sa description', () => {
    const nom = { texte: 'coursive', genre: 'f', nombre: 's', elision: false } as const;
    const propres: TextesMorceau = {
      noms: { coursive_x: nom, coursive_y: nom },
      descriptions: { coursive_x: ['Une coursive étroite.'], coursive_y: ['Un couloir de service.'] },
      assistance: {},
    };
    const { monde, textes } = numeroter(deuxCoursives(['coursive_x', 'coursive_y'], propres));
    const coursives = monde.pieces.filter((piece) => piece.id.endsWith('/p-coursive'));
    expect(coursives.map((piece) => [piece.nom, textes.noms[piece.nom]?.texte, textes.descriptions[piece.nom]])).toEqual([
      ['coursive_x_a', 'coursive A', ['Une coursive étroite.']],
      ['coursive_y_b', 'coursive B', ['Un couloir de service.']],
    ]);
    expect(validerMonde(monde)).toEqual([]);
  });

  it('la puce d’un document passe par la numérotation, et sa note nomme la coursive désignée avec sa lettre (spec §8.5)', () => {
    const puce = { texte: 'mot de Léa', genre: 'm', nombre: 's', elision: false } as const;
    const note = { puce, support: 'note', ou: 'glissée sous une patte de rangement', corps: ['J’ai rangé la planche dans {le:piece}.'], signature: 'Léa' } as const;
    const { monde, textes } = numeroter(deuxCoursives(['coursive', 'coursive'], { ...COURSIVE, documents: { mot_lea: note } }));
    const coursiveB = monde.pieces.find((piece) => piece.id === 'c-b/p-coursive');
    if (coursiveB === undefined) throw new Error('Coursive B absente.');
    const cible = { sorte: 'objet', id: 'e00000001', nom: 'mot_lea' } as const;
    expect(nomDe(textes, cible)).toEqual(puce);
    const rendu = rendreDocument(textes, { type: 'regarder_document', cible, designe: { sorte: 'piece', id: coursiveB.id, nom: coursiveB.nom } });
    expect(rendu.corps).toEqual([{ texte: 'J’ai rangé la planche dans la coursive B.' }]);
    expect(rendu.piece).toBe('coursive B');
  });

  it('une station sans doublon reste identique', () => {
    const entree = entreeDe(CATALOGUE.resoudre(ID));
    expect(numeroter(entree)).toBe(entree);
  });
});

describe('clés de texte en conflit entre morceaux (spec L3 §4.2)', () => {
  function morceau(id: string): EntreeMorceau {
    const entree = MORCEAUX[id];
    if (entree === undefined) throw new Error(`Morceau ${id} absent.`);
    return entree;
  }

  it('M-07 et M-10 : coursive devient coursive_m07 et coursive_m10, chacune avec ses textes ; morceaux d’origine inchangés', () => {
    const [m07, m10] = [morceau('m-07'), morceau('m-10')];
    const empreintes = [empreinte(m07), empreinte(m10)];
    expect(() => reunir([m07.textes, m10.textes])).toThrow(/coursive/);
    const [a, b] = sansConflit([m07, m10]);
    if (a === undefined || b === undefined) throw new Error('Morceaux absents.');
    expect(a.morceau.pieces.map((piece) => piece.nom)).toEqual(['quartiers', 'soute', 'machines', 'coursive_m07']);
    expect(b.morceau.pieces.map((piece) => piece.nom)).toEqual(['quartiers', 'antichambre', 'chambre', 'entrepot', 'coursive_m10']);
    expect([a.textes.noms.coursive_m07, a.textes.descriptions.coursive_m07]).toEqual([m07.textes.noms.coursive, m07.textes.descriptions.coursive]);
    expect([b.textes.noms.coursive_m10, b.textes.descriptions.coursive_m10]).toEqual([m10.textes.noms.coursive, m10.textes.descriptions.coursive]);
    expect(a.textes.descriptions.coursive_m07).not.toEqual(b.textes.descriptions.coursive_m10);
    for (const { textes } of [a, b]) expect([Object.hasOwn(textes.noms, 'coursive'), Object.hasOwn(textes.descriptions, 'coursive')]).toEqual([false, false]);
    expect(() => reunir([a.textes, b.textes])).not.toThrow();
    expect([empreinte(m07), empreinte(m10)]).toEqual(empreintes);
  });

  it('sans conflit, chaque morceau est rendu tel quel', () => {
    const entrees = [morceau('vestibule'), morceau('m-07'), morceau('m-03')];
    sansConflit(entrees).forEach((entree, rang) => expect(entree).toBe(entrees[rang]));
  });

  it('une clé renommée garde son nom venu des couches', () => {
    const avecCapsule = (id: string, description: string): EntreeMorceau => ({
      morceau: {
        ...morceau('m-07').morceau,
        id,
        objets: [{ id: 'o-capsule', nom: 'capsule', piece: 'p-coursive', portable: false }],
      },
      textes: { noms: {}, descriptions: { capsule: [description] }, assistance: {} },
    });
    const [a, b] = sansConflit([avecCapsule('c-a', 'Une capsule.'), avecCapsule('c-b', 'Une autre capsule.')]);
    expect(reunir([]).noms.capsule).toBeDefined();
    expect([a?.morceau.objets[0]?.nom, a?.textes.noms.capsule_ca, a?.textes.descriptions.capsule_ca]).toEqual(['capsule_ca', reunir([]).noms.capsule, ['Une capsule.']]);
    expect([b?.morceau.objets[0]?.nom, b?.textes.noms.capsule_cb, b?.textes.descriptions.capsule_cb]).toEqual(['capsule_cb', reunir([]).noms.capsule, ['Une autre capsule.']]);
  });

  it('vigilance 1 de L3 et 3 de L4 : m07-m10-m03-soute se lit « coursive A » puis « coursive B » ; m02-m08-m03-reserve, « atelier maintenance » et « atelier » ; nulle part deux pièces au même nom affiché', () => {
    const { monde, textes } = entreeDe(CATALOGUE.resoudre('m07-m10-m03-soute-2718281828'));
    expect(validerMonde(monde)).toEqual([]);
    const affiche = (id: string): string | undefined => textes.noms[monde.pieces.find((piece) => piece.id === id)?.nom ?? '']?.texte;
    expect([affiche('m-07/p-coursive'), affiche('m-10/p-coursive')]).toEqual(['coursive A', 'coursive B']);
    const reference = stationDeReference(CATALOGUE, 'm02-m08-m03-reserve');
    if ('refus' in reference) throw new Error(reference.refus);
    const ateliers = reference.entree;
    const afficheAtelier = (id: string): string | undefined =>
      ateliers.textes.noms[ateliers.monde.pieces.find((piece) => piece.id === id)?.nom ?? '']?.texte;
    expect([afficheAtelier('m-02/p-atelier'), afficheAtelier('m-08/p-atelier')]).toEqual(['atelier maintenance', 'atelier']);
    expect(COMPOSITIONS_PUBLIEES.length).toBeGreaterThan(PUBLIEES_L3.length);
    const references = COMPOSITIONS_PUBLIEES.map((composition) => {
      const reference = stationDeReference(CATALOGUE, composition);
      if ('refus' in reference) throw new Error(reference.refus);
      return reference.entree;
    });
    for (const station of [{ monde, textes }, ...references]) {
      const noms = station.monde.pieces.map((piece) => station.textes.noms[piece.nom]?.texte ?? piece.nom);
      expect(new Set(noms).size, station.monde.id).toBe(noms.length);
    }
  });
});
