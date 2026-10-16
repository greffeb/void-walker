import {
  apercu,
  empreinteEtat,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  validerMonde,
  type DefMonde,
  type Evenement,
  type OptionMenu,
  type Partie,
} from '../engine';
import type { EntreeMonde, EtapeParcours, Parcours } from '../content';
import { CATALOGUE } from './catalogue';
import { executerParcours, trouverOption } from './rejouer-parcours';

// Stations de test des nouveaux morceaux (#105) : parcours sûrs de chaque fiche (docs/13-morceaux-lancement.md §3) et le risqué
// de la chambre froide, cas de contrat joués par le menu public depuis une nouvelle partie, et preuve qu'aucune règle ne lit un
// nom ni un identifiant.

const STATIONS = ['m-07', 'm-08', 'm-09', 'm-10'] as const;

function entree(id: string): EntreeMonde {
  const trouvee = CATALOGUE.mondes[id];
  if (trouvee === undefined) throw new Error(`Monde ${id} absent.`);
  return trouvee;
}

function depart(monde: DefMonde): Partie {
  return nouvellePartie(monde, { version: 'morceaux-test', graine: 20261010 });
}

interface Pas {
  readonly partie: Partie;
  readonly evenements: readonly Evenement[];
  readonly tirages: readonly number[];
}

function choix(monde: DefMonde, partie: Partie, etape: EtapeParcours): OptionMenu | undefined {
  return trouverOption(observer(monde, partie.etat), etape);
}

function engager(monde: DefMonde, partie: Partie, etape: EtapeParcours): Pas {
  const option = choix(monde, partie, etape);
  if (option === undefined || !option.disponible) throw new Error(`Option ${JSON.stringify(etape)} absente ou indisponible.`);
  const resultat = jouer(monde, partie, option.commande);
  if (resultat.type !== 'engagee') throw new Error(`${JSON.stringify(etape)} : ${resultat.type}.`);
  return resultat;
}

function suite(monde: DefMonde, partie: Partie, etapes: readonly EtapeParcours[]): Pas[] {
  const pas: Pas[] = [];
  let courante = partie;
  for (const etape of etapes) {
    const suivant = engager(monde, courante, etape);
    pas.push(suivant);
    courante = suivant.partie;
  }
  return pas;
}

function apres(monde: DefMonde, partie: Partie, etapes: readonly EtapeParcours[]): Partie {
  return suite(monde, partie, etapes).at(-1)?.partie ?? partie;
}

function types(evenements: readonly Evenement[]): string[] {
  return evenements.map((evenement) => evenement.type);
}

function parcours(id: string, debut: string): Parcours {
  const trouve = entree(id).parcours.find((candidat) => candidat.nom.startsWith(debut));
  if (trouve === undefined) throw new Error(`Parcours ${debut} absent de ${id}.`);
  return trouve;
}

describe('stations de test des nouveaux morceaux : parcours de leurs fiches (#105)', () => {
  it.each(STATIONS)('%s : monde valide, plan compris, créature hors de la pièce de départ', (id) => {
    const { monde } = entree(id);
    expect(validerMonde(monde)).toEqual([]);
    expect(monde.creature?.piece).not.toBe(monde.depart);
  });

  it.each(STATIONS.flatMap((id) => entree(id).parcours.map((un) => [id, un.nom, un] as const)))(
    '%s, %s : évacuation, indemne, sans dé, refus sans effet, export rejoué',
    (id, _nom, un) => {
      const rapport = executerParcours(entree(id), un, 'test');
      expect(rapport.erreurs).toEqual([]);
      expect(rapport.lignes).toContain('Aucun dé tiré : oui.');
    },
  );
});

describe('M-07 — salle des machines (T-15, T-16)', () => {
  const { monde } = entree('m-07');
  const dansLaSalle = (): Partie =>
    apres(monde, depart(monde), [
      { action: 'ouvrir', cible: 'porte', vers: 'machines' },
      { action: 'aller', cible: 'porte', vers: 'machines' },
    ]);

  it('T-15 : la porte grippée s’ouvre dans la salle en marche ; son grincement n’en sort pas, la créature reste dans la soute', () => {
    const ouvert = engager(monde, dansLaSalle(), { action: 'ouvrir', cible: 'porte_grippee', vers: 'coursive' });
    expect(types(ouvert.evenements)).toEqual(['passage_ouvert', 'bruit_couvert']);
    expect(ouvert.partie.etat.creature).toMatchObject({ piece: 'm-07/p-soute', indice: null });
  });

  it('T-15, contre-épreuve : machines arrêtées, le même geste l’attire vers la salle', () => {
    const arretees = apres(monde, dansLaSalle(), [{ action: 'arreter', cible: 'interrupteur' }]);
    const ouvert = engager(monde, arretees, { action: 'ouvrir', cible: 'porte_grippee', vers: 'coursive' });
    expect(types(ouvert.evenements)).toContain('bruit_mecanisme');
    expect(ouvert.partie.etat.creature).toMatchObject({ piece: 'm-07/p-quartiers', indice: { piece: 'm-07/p-machines', par: null } });
  });

  it('T-16 : la relance est un grand bruit que la créature voisine entend ; elle rejoint la salle', () => {
    const etapes = parcours('m-07', 'M-07 — Relancer').etapes;
    const pas = suite(monde, depart(monde), etapes.slice(0, 6));
    expect(types(pas[4]?.evenements ?? [])).toEqual(['machines_relancees']);
    expect(pas[4]?.partie.etat.creature).toMatchObject({ piece: 'm-07/p-quartiers', indice: { piece: 'm-07/p-machines', par: null } });
    expect(pas[5]?.partie.etat.creature?.piece).toBe('m-07/p-machines');
    expect(pas[5]?.partie.etat.piece).toBe('m-07/p-coursive');
  });
});

describe('M-08 — passerelle effondrée (D-164, D-169, D-236)', () => {
  const { monde } = entree('m-08');

  it('la planche et le touret sont encombrants : on ne porte pas les deux (W-02)', () => {
    const portee = engager(monde, apres(monde, depart(monde), [{ action: 'aller', cible: 'porte', vers: 'atelier' }]), { action: 'prendre', cible: 'planche' });
    expect(choix(monde, portee.partie, { action: 'prendre', cible: 'touret' })).toMatchObject({ disponible: false, raison: 'encombre' });
  });

  it('partie du porteur : alertée, elle suit les pas de l’autre côté du vide et tombe ; la planche manque au retour (D-276)', () => {
    // Ses 11 premiers gestes, même graine : il repasse la planche sous les yeux de la créature, qui le voit partir par là.
    const etapes = parcours('m-08', 'M-08').etapes;
    const graine = 1775816682;
    let partie = nouvellePartie(monde, { version: 'morceaux-test', graine });
    for (const etape of [
      ...etapes.slice(0, 7),
      { action: 'ouvrir', cible: 'porte', vers: 'reserve' },
      { action: 'aller', cible: 'porte', vers: 'reserve' },
      { action: 'aller', cible: 'porte', vers: 'est' },
    ] as const) {
      partie = engager(monde, partie, etape).partie;
    }
    // Il repasse le vide : elle ne l'a pas vu partir, mais elle entend ses pas et le raconte.
    const traversee = engager(monde, partie, { action: 'aller', cible: 'vide', vers: 'ouest' });
    expect(types(traversee.evenements)).toEqual(['deplacement', 'pas_entendus', 'bruit_creature']);
    expect(traversee.partie.etat.creature).toMatchObject({ piece: 'p-est', indice: { piece: 'p-ouest', par: null } });
    // Il n'a plus qu'à attendre au bord : elle le poursuit sur la planche, qui cède.
    const attente = jouer(monde, traversee.partie, { action: 'attendre', cible: observer(monde, traversee.partie.etat).piece.id });
    if (attente.type !== 'engagee') throw new Error(`Attente : ${attente.type}.`);
    const chute = { partie: attente.partie, evenements: attente.evenements };
    expect(chute.partie.etat.creature).toMatchObject({ piece: null, neutralisee: 'tombee' });
    expect(types(chute.evenements)).toEqual(['attente', 'pont_cede']);
    expect(observer(monde, chute.partie.etat).pontsBrises.map(({ objet }) => objet.nom)).toEqual(['planche']);
  });

  it('piège : laissée en place, la planche cède sous la créature attirée par un bruit ; le passage est de nouveau coupé', () => {
    const etapes = parcours('m-08', 'M-08').etapes;
    // Jusqu'à la traversée (planche en place), puis retour au bord ouest : la réserve ouverte, un grincement l'attire.
    const posee = apres(monde, depart(monde), [
      ...etapes.slice(0, 7),
      { action: 'ouvrir', cible: 'porte', vers: 'reserve' },
      { action: 'aller', cible: 'vide', vers: 'ouest' },
      { action: 'fermer', cible: 'porte_grippee', vers: 'quartiers' },
    ]);
    const bruit = engager(monde, posee, { action: 'ouvrir', cible: 'porte_grippee', vers: 'quartiers' });
    expect(types(bruit.evenements)).toEqual(['passage_ouvert', 'bruit_mecanisme', 'bruit_creature']);
    expect(bruit.partie.etat.creature?.piece).toBe('p-est');
    const chute = engager(monde, bruit.partie, { action: 'fermer', cible: 'porte_grippee', vers: 'quartiers' });
    expect(types(chute.evenements)).toEqual(['passage_ferme', 'pont_cede']);
    expect(chute.partie.etat.creature).toMatchObject({ piece: null, neutralisee: 'tombee' });
    expect(chute.partie.etat.objets['o-planche']).toEqual({ type: 'perdu', liaison: 'l-ouest-est' });
    expect(choix(monde, chute.partie, { action: 'aller', cible: 'vide', vers: 'est' })).toMatchObject({ disponible: false, raison: 'sans_pont' });
    // T-10 : la reprise d'une sauvegarde redonne la créature tombée et la planche perdue.
    const sauvegarde = JSON.parse(JSON.stringify({ enregistrement: chute.partie.enregistrement, etat: chute.partie.etat })) as unknown;
    expect(empreinteEtat(reprendrePartie(monde, sauvegarde, 'morceaux-test').etat)).toBe(empreinteEtat(chute.partie.etat));
  });
});

describe('M-09 — zone sans gravité (D-165, D-237, D-238, MX-04)', () => {
  const { monde } = entree('m-09');
  const dansLaZone = (avecBurette: boolean): Partie =>
    apres(monde, depart(monde), [
      ...(avecBurette ? [{ action: 'prendre', cible: 'burette' } as const] : []),
      { action: 'ouvrir', cible: 'porte', vers: 'sas_ouest' },
      { action: 'aller', cible: 'porte', vers: 'sas_ouest' },
      { action: 'aller', cible: 'porte', vers: 'transfert' },
    ]);

  it('il faut dériver jusqu’à l’autre bout avant de le franchir ; l’aperçu annonce l’action de plus', () => {
    const dedans = dansLaZone(false);
    expect(choix(monde, dedans, { action: 'aller', cible: 'porte', vers: 'sas_est' })).toMatchObject({ disponible: false, raison: 'trop_loin' });
    const option = choix(monde, dedans, { action: 'deriver', cible: 'porte', vers: 'sas_est' });
    if (option === undefined) throw new Error('Dérive absente.');
    expect(apercu(monde, dedans, option.commande)).toMatchObject({ type: 'apercu', apercu: { risque: 'aucun', savoir: [{ type: 'derivera' }] } });
  });

  it('MX-04 : dans la coursive sans gravité, la burette ne se verse pas', () => {
    const dedans = dansLaZone(true);
    const verser = observer(monde, dedans.etat).menu.filter((option) => option.action === 'verser');
    expect(verser.length).toBeGreaterThan(0);
    expect(verser.every((option) => !option.disponible && option.raison === 'sans_gravite')).toBe(true);
  });
});

describe('M-10 — chambre froide (D-166, D-170, D-239, D-240)', () => {
  const { monde } = entree('m-10');

  it.each(['M-10 — Compresseur', 'M-10 — Risqué'])('%s : la créature est ralentie pour la suite, le passager n’a jamais froid trois actions de suite', (debut) => {
    const pas = suite(monde, depart(monde), parcours('m-10', debut).etapes);
    expect(Math.max(...pas.map((un) => un.partie.etat.froid))).toBeLessThanOrEqual(2);
    expect(pas.at(-1)?.partie.etat.creature?.ralentie).toBeDefined();
    // Le compresseur la garde dans la chambre ; dans le parcours risqué, un autre chemin lui reste ouvert et elle suit les pas (D-276).
    if (debut === 'M-10 — Compresseur') expect(pas.at(-1)?.partie.etat.creature?.piece).toBe('m-10/p-chambre');
  });

  it('le compresseur l’attire dans la chambre, sous les yeux du passager ; ressortir par l’autre porte est libre (D-184)', () => {
    const pas = suite(monde, depart(monde), parcours('m-10', 'M-10 — Compresseur').etapes.slice(0, 6));
    expect(types(pas[3]?.evenements ?? [])).toEqual(['alarme_declenchee', 'creature_entre', 'premier_contact']);
    expect(pas[4]?.tirages).toEqual([]);
    expect(types(pas[5]?.evenements ?? [])).toEqual(['chambre_bouclee']);
  });

  it('rester dans la chambre une troisième action blesse : l’aperçu le dit avant', () => {
    const dedans = apres(monde, depart(monde), [
      { action: 'aller', cible: 'porte', vers: 'antichambre' },
      { action: 'ouvrir', cible: 'porte', vers: 'chambre' },
      { action: 'aller', cible: 'porte', vers: 'chambre' },
      { action: 'fermer', cible: 'porte', vers: 'entrepot' },
    ]);
    const option = choix(monde, dedans, { action: 'ouvrir', cible: 'porte', vers: 'entrepot' });
    if (option === undefined) throw new Error('Option absente.');
    expect(apercu(monde, dedans, option.commande)).toMatchObject({ apercu: { risque: 'certain', danger: { type: 'froid' } } });
    const gele = engager(monde, dedans, { action: 'ouvrir', cible: 'porte', vers: 'entrepot' });
    expect(gele.partie.etat.sante).toBe('blesse');
    expect(gele.evenements).toContainEqual({ type: 'aggravation_blesse', causes: ['froid'] });
  });
});

/** Renomme toutes les pièces, liaisons, positions et objets d'un monde, identifiants et noms, de façon cohérente. */
function renommer(monde: DefMonde): { monde: DefMonde; nom: (nom: string) => string } {
  const ids = new Map<string, string>();
  [...monde.pieces, ...monde.liaisons, ...(monde.positions ?? []), ...monde.objets].forEach((entite, index) => ids.set(entite.id, `x${index}`));
  const id = (ancien: string): string => ids.get(ancien) ?? ancien;
  const nom = (ancien: string): string => `n-${[...ancien].reverse().join('')}`;
  return {
    nom,
    monde: {
      ...monde,
      id: `${monde.id}-renomme`,
      depart: id(monde.depart),
      pieces: monde.pieces.map((piece) => ({ ...piece, id: id(piece.id), nom: nom(piece.nom) })),
      liaisons: monde.liaisons.map((liaison) => ({
        ...liaison,
        id: id(liaison.id),
        nom: nom(liaison.nom),
        entre: [id(liaison.entre[0]), id(liaison.entre[1])] as const,
        ...(liaison.haute === undefined ? {} : { haute: id(liaison.haute) }),
        ...(liaison.cachee === undefined ? {} : { cachee: id(liaison.cachee) }),
        ...(liaison.manoeuvre === undefined ? {} : { manoeuvre: id(liaison.manoeuvre) }),
      })),
      ...(monde.positions === undefined
        ? {}
        : { positions: monde.positions.map((position) => ({ ...position, id: id(position.id), nom: nom(position.nom), piece: id(position.piece), ...(position.sous === undefined ? {} : { sous: id(position.sous) }) })) }),
      objets: monde.objets.map((objet) => ({
        ...objet,
        id: id(objet.id),
        nom: nom(objet.nom),
        piece: id(objet.piece),
        ...(objet.position === undefined ? {} : { position: id(objet.position) }),
        ...(objet.avertisseur === undefined ? {} : { avertisseur: { ...objet.avertisseur, piece: id(objet.avertisseur.piece) } }),
        ...(objet.capsule === undefined ? {} : { capsule: { ...objet.capsule, interieur: id(objet.capsule.interieur) } }),
        ...(objet.alimente === undefined ? {} : { alimente: id(objet.alimente) }),
        ...(objet.depart === undefined ? {} : { depart: id(objet.depart) }),
        ...(objet.machines === undefined ? {} : { machines: id(objet.machines) }),
        ...(objet.gravite === undefined ? {} : { gravite: id(objet.gravite) }),
        ...(objet.fermeture === undefined ? {} : { fermeture: id(objet.fermeture) }),
      })),
      ...(monde.creature === undefined ? {} : { creature: { piece: id(monde.creature.piece) } }),
      ...(monde.assistance === undefined
        ? {}
        : { assistance: monde.assistance.map((message) => (message.quand.type === 'arrivee' ? { ...message, quand: { ...message.quand, piece: id(message.quand.piece) } } : message)) }),
    },
  };
}

describe('aucune règle ne lit le nom ni l’identifiant d’une pièce ou d’un objet (D-078, C-02 §7)', () => {
  it.each(STATIONS.flatMap((id) => entree(id).parcours.map((un) => [id, un.nom, un] as const)))('%s, %s : même partie, entités renommées', (id, _nom, un) => {
    const { monde } = entree(id);
    const renomme = renommer(monde);
    expect(validerMonde(renomme.monde)).toEqual([]);
    const etapes = un.etapes.map((etape) => ({
      ...etape,
      cible: renomme.nom(etape.cible),
      ...(etape.vers === undefined ? {} : { vers: renomme.nom(etape.vers) }),
      ...(etape.parametre === undefined ? {} : { parametre: renomme.nom(etape.parametre) }),
    }));
    const original = suite(monde, depart(monde), un.etapes);
    const copie = suite(renomme.monde, depart(renomme.monde), etapes);
    expect(copie.map((pas) => types(pas.evenements))).toEqual(original.map((pas) => types(pas.evenements)));
    expect(copie.map((pas) => pas.tirages)).toEqual(original.map((pas) => pas.tirages));
    const [fin, finCopie] = [original.at(-1)?.partie, copie.at(-1)?.partie];
    expect(finCopie?.etat.actions).toBe(fin?.etat.actions);
    expect(observer(renomme.monde, finCopie?.etat ?? depart(renomme.monde).etat).issue).toBe('evacuation');
  });
});
