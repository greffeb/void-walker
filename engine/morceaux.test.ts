import {
  apercu,
  empreinteEtat,
  jouer,
  nouvellePartie,
  observer,
  reprendrePartie,
  sonRetenu,
  validerMonde,
  type DefMonde,
  type EtatCreature,
  type Evenement,
  type IdAction,
  type OptionMenu,
  type Partie,
} from './index';

// Règles des nouveaux morceaux (C-03 §5.5, C-04 §3.2, C-02 §5, D-163 à D-170, D-234 à D-240) et mélanges MX-01, MX-04, MX-05,
// sur des fixtures réduites. Les noms ne servent qu'à retrouver les options du menu : aucune règle ne lit un nom (D-078).

const CALME: Omit<EtatCreature, 'piece'> = { indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null };

function partie(monde: DefMonde, graine = 7): Partie {
  return nouvellePartie(monde, { version: 'morceaux-1', graine });
}

/** Partie placée à la main : pièce du passager, créature, états du monde. */
function placee(monde: DefMonde, changement: Partial<Partie['etat']>): Partie {
  const depart = partie(monde);
  return { ...depart, etat: { ...depart.etat, ...changement } };
}

function option(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): OptionMenu | undefined {
  const nomme = (cible: OptionMenu['cible'] | undefined, attendu: string): boolean =>
    cible !== undefined && (cible.nom === attendu || (cible.sorte === 'passage' && cible.vers?.nom === attendu));
  return observer(monde, courante.etat).menu.find(
    (choix) => choix.action === action && nomme(choix.cible, nom) && (parametre === undefined || nomme(choix.parametre, parametre)),
  );
}

interface Pas {
  readonly partie: Partie;
  readonly evenements: readonly Evenement[];
  readonly tirages: readonly number[];
}

function engager(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): Pas {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined || !choix.disponible) throw new Error(`Option ${action} ${nom} ${parametre ?? ''} absente ou indisponible.`);
  const resultat = jouer(monde, courante, choix.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return resultat;
}

type Geste = readonly [IdAction, string] | readonly [IdAction, string, string];

function suite(monde: DefMonde, depart: Partie, gestes: readonly Geste[]): Pas[] {
  const pas: Pas[] = [];
  let courante = depart;
  for (const [action, nom, parametre] of gestes) {
    const suivant = engager(monde, courante, action, nom, parametre);
    pas.push(suivant);
    courante = suivant.partie;
  }
  return pas;
}

function fin(pas: readonly Pas[]): Partie {
  const dernier = pas.at(-1);
  if (dernier === undefined) throw new Error('Aucun pas.');
  return dernier.partie;
}

function types(evenements: readonly Evenement[]): string[] {
  return evenements.map((evenement) => evenement.type);
}

function apercuDe(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string) {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  const resultat = apercu(monde, courante, choix.commande);
  if (resultat.type !== 'apercu') throw new Error(`Aperçu ${action} ${nom} : ${resultat.type}.`);
  return resultat.apercu;
}

/** Une commande refusée laisse la partie intacte, sans engagement (C-01 §6, MP-03). */
function refusee(monde: DefMonde, courante: Partie, action: IdAction, nom: string, parametre?: string): string {
  const choix = option(monde, courante, action, nom, parametre);
  if (choix === undefined) throw new Error(`Option ${action} ${nom} absente.`);
  const resultat = jouer(monde, courante, choix.commande);
  if (resultat.type !== 'refus') throw new Error(`${action} ${nom} : ${resultat.type}, refus attendu.`);
  expect(resultat.partie).toBe(courante);
  expect(empreinteEtat(resultat.partie.etat)).toBe(empreinteEtat(courante.etat));
  return resultat.raison;
}

/** Fait passer le temps sans bruit : ouvrir puis fermer, l'une après l'autre, une porte de la pièce du passager. */
function attendre(monde: DefMonde, depart: Partie, porte: string, fois: number): Pas[] {
  const pas: Pas[] = [];
  let courante = depart;
  for (let i = 0; i < fois; i++) {
    const ouverte = option(monde, courante, 'fermer', porte)?.disponible === true;
    const suivant = engager(monde, courante, ouverte ? 'fermer' : 'ouvrir', porte);
    pas.push(suivant);
    courante = suivant.partie;
  }
  return pas;
}

// Salle des machines (D-163, D-173, D-234, D-235) :
//
//   reduit (créature) ══porte_rc══ couloir ══porte_cs══ salle (machines, interrupteur) ══grippee_sb (bruyante)══ bout
const MACHINES: DefMonde = {
  id: 'essai-machines',
  depart: 'salle',
  pieces: [
    { id: 'reduit', nom: 'reduit' },
    { id: 'couloir', nom: 'couloir' },
    { id: 'salle', nom: 'salle', machines: true },
    { id: 'bout', nom: 'bout' },
  ],
  liaisons: [
    { id: 'rc', nom: 'porte_rc', entre: ['reduit', 'couloir'], ouverte: true },
    { id: 'cs', nom: 'porte_cs', entre: ['couloir', 'salle'], ouverte: true },
    { id: 'sb', nom: 'grippee_sb', entre: ['salle', 'bout'], ouverte: false, bruyante: true },
  ],
  objets: [{ id: 'levier', nom: 'interrupteur', piece: 'salle', portable: false, machines: 'salle' }],
  creature: { piece: 'reduit' },
};

describe('salle des machines (D-163, D-235, T-15, T-16)', () => {
  it('la fixture est valide ; un interrupteur hors de sa salle est refusé (D-173)', () => {
    expect(validerMonde(MACHINES)).toEqual([]);
    const hors: DefMonde = { ...MACHINES, objets: [{ id: 'levier', nom: 'interrupteur', piece: 'couloir', portable: false, machines: 'salle' }] };
    expect(validerMonde(hors)).toEqual(['levier : interrupteur hors de sa salle des machines (D-173).']);
  });

  it('T-15 : machines en marche, ouvrir la porte grippée dans la salle ne fait sortir aucun son ; sans annonce « bruyant »', () => {
    const depart = partie(MACHINES);
    expect(observer(MACHINES, depart.etat).machines).toBe('marche');
    expect(apercuDe(MACHINES, depart, 'ouvrir', 'bout').cout).toBe('aucun');
    const ouvert = engager(MACHINES, depart, 'ouvrir', 'bout');
    expect(types(ouvert.evenements)).toEqual(['passage_ouvert', 'bruit_couvert']);
    expect(ouvert.partie.etat.creature).toMatchObject({ piece: 'reduit', indice: null });
  });

  it('machines arrêtées, la salle est ordinaire : le même geste s’annonce bruyant et la créature l’entend', () => {
    const arretees = fin(suite(MACHINES, partie(MACHINES), [['arreter', 'interrupteur']]));
    expect(observer(MACHINES, arretees.etat).machines).toBe('arret');
    expect(apercuDe(MACHINES, arretees, 'ouvrir', 'bout').cout).toBe('bruyant');
    const ouvert = engager(MACHINES, arretees, 'ouvrir', 'bout');
    expect(types(ouvert.evenements)).toContain('bruit_mecanisme');
    expect(ouvert.partie.etat.creature).toMatchObject({ piece: 'couloir', indice: { piece: 'salle', par: null } });
  });

  it('T-16 : la relance fait un grand bruit perçu par la créature voisine, le temps de trois réactions (D-234)', () => {
    const arretees = fin(suite(MACHINES, partie(MACHINES), [['arreter', 'interrupteur']]));
    expect(option(MACHINES, arretees, 'arreter', 'interrupteur')).toBeUndefined();
    expect(apercuDe(MACHINES, arretees, 'relancer', 'interrupteur')).toMatchObject({ cout: 'bruyant', savoir: [{ type: 'relanceront' }] });
    const relance = engager(MACHINES, arretees, 'relancer', 'interrupteur');
    expect(types(relance.evenements)).toEqual(['machines_relancees']);
    expect(relance.partie.etat.arretees).toEqual([]);
    expect(relance.partie.etat.alarmes).toEqual([{ objet: 'levier', restant: 2 }]);
    // Réaction 0 : elle part vers la salle ; le passager, dans le vacarme, ne l'entend pas venir.
    expect(relance.partie.etat.creature).toMatchObject({ piece: 'couloir', indice: { piece: 'salle', par: null } });
    expect(relance.partie.etat.reperes.entendue).toBeNull();
    const [suivant, dernier] = attendre(MACHINES, relance.partie, 'bout', 2);
    expect(suivant?.partie.etat.alarmes).toEqual([{ objet: 'levier', restant: 1 }]);
    expect(suivant?.partie.etat.creature?.piece).toBe('salle');
    expect(dernier?.partie.etat.alarmes).toEqual([]);
  });

  it('arrêter les machines fait taire la relance en cours ; « déjà fait » refuse une commande périmée', () => {
    const relance = fin(suite(MACHINES, partie(MACHINES), [['arreter', 'interrupteur'], ['relancer', 'interrupteur']]));
    const stoppee = engager(MACHINES, relance, 'arreter', 'interrupteur');
    expect(stoppee.partie.etat.alarmes).toEqual([]);
    const commande = option(MACHINES, relance, 'arreter', 'interrupteur')?.commande;
    if (commande === undefined) throw new Error('Commande absente.');
    const perimee = jouer(MACHINES, stoppee.partie, commande);
    expect(perimee).toMatchObject({ type: 'refus', raison: 'deja_fait' });
  });

  it('D-235 : la créature dans la salle en marche n’entend rien du dehors ; un bruit ne traverse pas la salle ; seule la relance en sort', () => {
    const etat = partie(MACHINES).etat;
    const ouverte = { ...etat, liaisons: { ...etat.liaisons, sb: true } };
    const fort = { piece: 'couloir', intensite: 'fort' } as const;
    expect(sonRetenu(MACHINES, ouverte, 'salle', [fort])).toBeUndefined();
    expect(sonRetenu(MACHINES, ouverte, 'bout', [fort])).toBeUndefined();
    expect(sonRetenu(MACHINES, ouverte, 'reduit', [{ piece: 'salle', intensite: 'fort' }])).toBeUndefined();
    expect(sonRetenu(MACHINES, ouverte, 'reduit', [{ piece: 'salle', intensite: 'fort', relance: true }])).toBeDefined();
    const arretees = { ...ouverte, arretees: ['salle'] };
    expect(sonRetenu(MACHINES, arretees, 'salle', [fort])).toBeDefined();
    expect(sonRetenu(MACHINES, arretees, 'bout', [fort])).toBeDefined();
  });

  it('D-163 : dans la salle en marche, le passager n’entend pas la créature bouger à côté ; machines arrêtées, il l’entend', () => {
    const traque = { piece: 'reduit', ...CALME, indice: { piece: 'couloir', par: null } };
    const enMarche = engager(MACHINES, placee(MACHINES, { creature: traque }), 'ouvrir', 'bout');
    expect(enMarche.partie.etat.creature?.piece).toBe('couloir');
    expect(types(enMarche.evenements)).not.toContain('bruit_creature');
    expect(enMarche.partie.etat.reperes.entendue).toBeNull();
    const arretee = engager(MACHINES, placee(MACHINES, { creature: traque, arretees: ['salle'], liaisons: { rc: true, cs: true, sb: true } }), 'fermer', 'bout');
    expect(types(arretee.evenements)).toContain('bruit_creature');
  });

  it('D-163 : la créature qui bouge dans la salle en marche n’est pas entendue du couloir', () => {
    const vers = { piece: 'bout', ...CALME, indice: { piece: 'salle', par: null } };
    const ouvertes = { rc: true, cs: true, sb: true };
    const dehors = engager(MACHINES, placee(MACHINES, { piece: 'couloir', creature: vers, liaisons: ouvertes }), 'fermer', 'reduit');
    expect(dehors.partie.etat.creature?.piece).toBe('salle');
    expect(types(dehors.evenements)).not.toContain('bruit_creature');
    const arretee = engager(MACHINES, placee(MACHINES, { piece: 'couloir', creature: vers, liaisons: ouvertes, arretees: ['salle'] }), 'fermer', 'reduit');
    expect(types(arretee.evenements)).toContain('bruit_creature');
  });
});

// Passerelle (D-164, D-169, D-236), objets encombrants (D-079, MP-03) :
//
//   depot (planche, caisse) ══porte_dw══ ouest ┄┄vide┄┄ est ══porte_ef══ fond (créature)
const PASSERELLE: DefMonde = {
  id: 'essai-passerelle',
  depart: 'depot',
  pieces: [
    { id: 'depot', nom: 'depot' },
    { id: 'ouest', nom: 'ouest' },
    { id: 'est', nom: 'est' },
    { id: 'fond', nom: 'fond' },
  ],
  liaisons: [
    { id: 'dw', nom: 'porte_dw', entre: ['depot', 'ouest'], ouverte: true, bruyante: true },
    { id: 'gouffre', nom: 'vide', entre: ['ouest', 'est'], ouverte: true, gouffre: true },
    { id: 'ef', nom: 'porte_ef', entre: ['est', 'fond'], ouverte: false },
  ],
  objets: [
    { id: 'planche', nom: 'planche', piece: 'depot', pont: true, encombrant: true },
    { id: 'caisse', nom: 'caisse', piece: 'depot', encombrant: true },
  ],
  creature: { piece: 'fond' },
};

describe('objets encombrants (D-079, MP-03, W-02)', () => {
  it('W-02 : ramasser un deuxième objet encombrant est refusé sans coût, les deux restent où ils étaient', () => {
    const portee = engager(PASSERELLE, partie(PASSERELLE), 'prendre', 'planche').partie;
    expect(option(PASSERELLE, portee, 'prendre', 'caisse')).toMatchObject({ disponible: false, raison: 'encombre' });
    expect(refusee(PASSERELLE, portee, 'prendre', 'caisse')).toBe('encombre');
    expect(portee.etat.objets).toMatchObject({ planche: { type: 'passager' }, caisse: { type: 'piece', piece: 'depot' } });
    const posee = engager(PASSERELLE, portee, 'poser', 'planche').partie;
    expect(option(PASSERELLE, posee, 'prendre', 'caisse')).toMatchObject({ disponible: true });
  });
});

describe('passerelle et pont fragile (D-164, D-236)', () => {
  it('la fixture est valide ; un vide fermé ou un pont qui n’est pas encombrant sont refusés', () => {
    expect(validerMonde(PASSERELLE)).toEqual([]);
    const casse: DefMonde = {
      ...PASSERELLE,
      liaisons: PASSERELLE.liaisons.map((liaison) => (liaison.id === 'gouffre' ? { ...liaison, ouverte: false } : liaison)),
      objets: [{ id: 'planche', nom: 'planche', piece: 'depot', pont: true }],
    };
    expect(validerMonde(casse)).toEqual(['gouffre : vide fermé.', 'planche : pont fragile non portable ou non encombrant (D-169).']);
  });

  it('sans pont, le vide ne se franchit pas ; il n’a pas de porte à ouvrir ni à fermer', () => {
    const auBord = engager(PASSERELLE, partie(PASSERELLE), 'aller', 'ouest').partie;
    expect(option(PASSERELLE, auBord, 'aller', 'est')).toMatchObject({ disponible: false, raison: 'sans_pont' });
    expect(refusee(PASSERELLE, auBord, 'aller', 'est')).toBe('sans_pont');
    expect(option(PASSERELLE, auBord, 'ouvrir', 'est')).toBeUndefined();
    expect(option(PASSERELLE, auBord, 'fermer', 'est')).toBeUndefined();
  });

  it('poser la planche, traverser, la retirer derrière soi : une action chacune, sans dé', () => {
    const pas = suite(PASSERELLE, partie(PASSERELLE), [
      ['prendre', 'planche'],
      ['aller', 'ouest'],
      ['placer', 'planche', 'est'],
      ['aller', 'est'],
      ['prendre', 'planche'],
    ]);
    const [, , pose, traverse, retire] = pas;
    expect(types(pose?.evenements ?? [])).toEqual(['pont_place']);
    expect(pose?.partie.etat.objets.planche).toEqual({ type: 'pont', liaison: 'gouffre' });
    expect(observer(PASSERELLE, pose?.partie.etat ?? partie(PASSERELLE).etat).ponts).toHaveLength(1);
    expect(traverse?.partie.etat.piece).toBe('est');
    // Vue de l'autre bord, la planche se voit, se regarde et se reprend.
    const deLautreBord = observer(PASSERELLE, traverse?.partie.etat ?? partie(PASSERELLE).etat);
    expect(deLautreBord.ponts).toHaveLength(1);
    expect(deLautreBord.objets.map((objet) => objet.nom)).toEqual(['planche']);
    expect(option(PASSERELLE, traverse?.partie ?? partie(PASSERELLE), 'regarder', 'planche')).toBeDefined();
    expect(retire?.partie.etat.objets.planche).toEqual({ type: 'passager' });
    expect(option(PASSERELLE, fin(pas), 'aller', 'ouest')).toMatchObject({ disponible: false, raison: 'sans_pont' });
    expect(pas.flatMap((un) => un.tirages)).toEqual([]);
    expect(fin(pas).etat.actions).toBe(5);
  });

  it('piège : la créature qui s’engage sur la planche tombe, neutralisée pour de bon ; la planche est perdue', () => {
    const posee = fin(suite(PASSERELLE, partie(PASSERELLE), [['prendre', 'planche'], ['aller', 'ouest'], ['placer', 'planche', 'est']]));
    // Elle est sur l'autre bord et a entendu du bruit de ce côté-ci (D-236 : le son passe par-dessus le vide).
    const attiree = placee(PASSERELLE, { ...posee.etat, creature: { piece: 'est', ...CALME, indice: { piece: 'ouest', par: null } } });
    const chute = engager(PASSERELLE, attiree, 'fermer', 'depot');
    expect(types(chute.evenements)).toEqual(['passage_ferme', 'pont_cede']);
    expect(chute.partie.etat.creature).toMatchObject({ piece: null, neutralisee: 'tombee' });
    expect(chute.partie.etat.objets.planche).toEqual({ type: 'perdu', liaison: 'gouffre' });
    expect(observer(PASSERELLE, chute.partie.etat).ponts).toEqual([]);
    expect(option(PASSERELLE, chute.partie, 'aller', 'est')).toMatchObject({ disponible: false, raison: 'sans_pont' });
    // Neutralisée, elle ne réagit plus jamais.
    const apres = attendre(PASSERELLE, chute.partie, 'depot', 3);
    expect(apres.at(-1)?.partie.etat.creature).toMatchObject({ piece: null, neutralisee: 'tombee' });
  });

  it('sans pont, la créature reste au bord du vide ; le bruit d’un bord s’entend de l’autre (D-236)', () => {
    const auBord = placee(PASSERELLE, { piece: 'ouest', creature: { piece: 'est', ...CALME }, liaisons: { dw: false, gouffre: true, ef: false } });
    const ouvert = engager(PASSERELLE, auBord, 'ouvrir', 'depot');
    expect(types(ouvert.evenements)).toContain('bruit_mecanisme');
    expect(ouvert.partie.etat.creature).toMatchObject({ piece: 'est', indice: { piece: 'ouest', par: null } });
    const apres = attendre(PASSERELLE, ouvert.partie, 'depot', 2).at(-1)?.partie;
    expect(apres?.etat.creature?.piece).toBe('est');
    expect(apres?.etat.creature?.neutralisee).toBeUndefined();
  });

  it('l’huile se verse au pied d’une porte, pas au bord du vide (D-190 ; mélange non décidé, D-174)', () => {
    const avecHuile: DefMonde = { ...PASSERELLE, id: 'essai-passerelle-huile', objets: [...PASSERELLE.objets, { id: 'huile', nom: 'huile', piece: 'depot', glissant: 1 }] };
    const auBord = fin(suite(avecHuile, partie(avecHuile), [['prendre', 'huile'], ['aller', 'ouest']]));
    expect(option(avecHuile, auBord, 'verser', 'huile', 'depot')).toMatchObject({ disponible: true });
    expect(option(avecHuile, auBord, 'verser', 'huile', 'est')).toBeUndefined();
  });

  it('la créature vue partir par la planche la suit et tombe (D-177)', () => {
    const posee = fin(suite(PASSERELLE, partie(PASSERELLE), [['prendre', 'planche'], ['aller', 'ouest'], ['placer', 'planche', 'est'], ['aller', 'est']]));
    const suivie = placee(PASSERELLE, { ...posee.etat, creature: { piece: 'ouest', ...CALME, indice: { piece: 'est', par: 'gouffre' } } });
    const chute = engager(PASSERELLE, suivie, 'ouvrir', 'fond');
    expect(types(chute.evenements)).toContain('pont_cede');
    expect(chute.partie.etat.objets.planche).toEqual({ type: 'perdu', liaison: 'gouffre' });
  });
});

// Zone sans gravité (D-165, D-168, D-237, D-238) :
//
//   ouest (interrupteur, burette) ══porte_oz══ zone (gravité coupée) ══porte_ze══ est (interrupteur) ══porte_el══ loin
const GRAVITE: DefMonde = {
  id: 'essai-gravite',
  depart: 'ouest',
  pieces: [
    { id: 'ouest', nom: 'ouest' },
    { id: 'zone', nom: 'zone', gravite: 'coupee' },
    { id: 'est', nom: 'est' },
    { id: 'loin', nom: 'loin' },
  ],
  liaisons: [
    { id: 'oz', nom: 'porte_oz', entre: ['ouest', 'zone'], ouverte: true },
    { id: 'ze', nom: 'porte_ze', entre: ['zone', 'est'], ouverte: true },
    { id: 'el', nom: 'porte_el', entre: ['est', 'loin'], ouverte: false },
  ],
  objets: [
    { id: 'burette', nom: 'burette', piece: 'ouest', glissant: 1 },
    { id: 'inter-o', nom: 'interrupteur_o', piece: 'ouest', portable: false, gravite: 'zone' },
    { id: 'inter-e', nom: 'interrupteur_e', piece: 'est', portable: false, gravite: 'zone' },
  ],
};

describe('zone sans gravité (D-165, D-237, D-238)', () => {
  it('la fixture est valide ; un interrupteur dans la zone ou loin d’elle est refusé (D-238)', () => {
    expect(validerMonde(GRAVITE)).toEqual([]);
    const casse: DefMonde = { ...GRAVITE, objets: [{ id: 'inter', nom: 'interrupteur', piece: 'loin', portable: false, gravite: 'zone' }] };
    expect(validerMonde(casse)).toEqual(["inter : interrupteur hors d'une pièce qui touche sa zone (D-238)."]);
  });

  it('gravité coupée : entrer coûte une action, ressortir par l’autre bout deux (dériver, franchir), par l’entrée une', () => {
    const dedans = engager(GRAVITE, partie(GRAVITE), 'aller', 'zone').partie;
    expect(observer(GRAVITE, dedans.etat).gravite).toBe('coupee');
    expect(option(GRAVITE, dedans, 'aller', 'est')).toMatchObject({ disponible: false, raison: 'trop_loin' });
    expect(refusee(GRAVITE, dedans, 'aller', 'est')).toBe('trop_loin');
    expect(option(GRAVITE, dedans, 'aller', 'ouest')).toMatchObject({ disponible: true });
    expect(option(GRAVITE, dedans, 'deriver', 'ouest')).toBeUndefined();
    expect(apercuDe(GRAVITE, dedans, 'deriver', 'est')).toMatchObject({ risque: 'aucun', savoir: [{ type: 'derivera' }] });
    const pas = suite(GRAVITE, dedans, [['deriver', 'est'], ['aller', 'est']]);
    expect(types(pas[0]?.evenements ?? [])).toEqual(['derive']);
    expect(fin(pas).etat).toMatchObject({ piece: 'est', actions: 3, bord: null });
  });

  it('gravité rétablie depuis un interrupteur : la zone est ordinaire, on la traverse en deux actions', () => {
    const depart = partie(GRAVITE);
    expect(option(GRAVITE, depart, 'retablir', 'interrupteur_o')).toMatchObject({ disponible: true });
    expect(option(GRAVITE, depart, 'couper', 'interrupteur_o')).toBeUndefined();
    const pas = suite(GRAVITE, depart, [['retablir', 'interrupteur_o'], ['aller', 'zone'], ['aller', 'est']]);
    expect(types(pas[0]?.evenements ?? [])).toEqual(['gravite_retablie']);
    expect(fin(pas).etat).toMatchObject({ piece: 'est', apesanteur: [] });
    expect(option(GRAVITE, fin(pas), 'couper', 'interrupteur_e')).toMatchObject({ disponible: true });
  });

  it('MX-04 : impossible de verser l’huile tant que la gravité est coupée', () => {
    const dedans = fin(suite(GRAVITE, partie(GRAVITE), [['prendre', 'burette'], ['aller', 'zone']]));
    expect(option(GRAVITE, dedans, 'verser', 'burette', 'est')).toMatchObject({ disponible: false, raison: 'sans_gravite' });
    expect(refusee(GRAVITE, dedans, 'verser', 'burette', 'est')).toBe('sans_gravite');
    const retablie = placee(GRAVITE, { ...dedans.etat, apesanteur: [] });
    expect(option(GRAVITE, retablie, 'verser', 'burette', 'est')).toMatchObject({ disponible: true });
  });

  /** Actions du passager, enfermé dans « loin », jusqu'à ce que la créature partie de l'ouest atteigne l'est. */
  function traversee(apesanteur: readonly string[], creature: Partial<EtatCreature> = {}): number {
    let courante = placee(GRAVITE, { piece: 'loin', apesanteur, creature: { piece: 'ouest', ...CALME, indice: { piece: 'est', par: null }, ...creature } });
    for (let actions = 1; actions <= 20; actions++) {
      courante = attendre(GRAVITE, courante, 'est', 1)[0]?.partie ?? courante;
      if (courante.etat.creature?.piece === 'est') return actions;
    }
    throw new Error('Jamais arrivée.');
  }

  it('gravité coupée, la créature met deux réactions de plus pour traverser la zone (D-165, D-237)', () => {
    expect(traversee([])).toBe(2);
    expect(traversee(['zone'])).toBe(4);
  });

  it('couper la gravité quand elle s’y engage la retient deux réactions de plus ; la rétablir la laisse repartir', () => {
    const guet = placee(GRAVITE, {
      piece: 'est',
      apesanteur: [],
      creature: { piece: 'ouest', ...CALME, indice: { piece: 'est', par: null } },
      liaisons: { oz: true, ze: true, el: false },
    });
    const engagee = engager(GRAVITE, guet, 'ouvrir', 'loin');
    expect(engagee.partie.etat.creature).toMatchObject({ piece: 'zone', bord: 'oz' });
    expect(types(engagee.evenements)).toContain('bruit_creature');
    const coupee = engager(GRAVITE, engagee.partie, 'couper', 'interrupteur_e');
    expect(types(coupee.evenements)).toContain('gravite_coupee');
    expect(coupee.partie.etat.creature).toMatchObject({ piece: 'zone', derive: { vers: 'ze', restant: 1 } });
    const [encore, arrivee] = attendre(GRAVITE, coupee.partie, 'loin', 2);
    expect(encore?.partie.etat.creature).toMatchObject({ piece: 'zone', bord: 'ze' });
    expect(arrivee?.partie.etat.creature?.piece).toBe('est');
    // Rétablie pendant qu'elle dérive : elle franchit dès la réaction suivante.
    const retablie = engager(GRAVITE, coupee.partie, 'retablir', 'interrupteur_e');
    expect(retablie.partie.etat.creature?.piece).toBe('est');
  });
});

// Chambre froide (D-166, D-170, D-239, D-240) :
//
//   sas (pupitre de fermeture, burette) ══porte_sc══ chambre (froide, compresseur) ══porte_ce══ entrepot (créature)
const FROID: DefMonde = {
  id: 'essai-froid',
  depart: 'sas',
  pieces: [
    { id: 'sas', nom: 'sas' },
    { id: 'chambre', nom: 'chambre', froide: true },
    { id: 'entrepot', nom: 'entrepot' },
  ],
  liaisons: [
    { id: 'sc', nom: 'porte_sc', entre: ['sas', 'chambre'], ouverte: true },
    { id: 'ce', nom: 'porte_ce', entre: ['chambre', 'entrepot'], ouverte: true },
  ],
  objets: [
    { id: 'pupitre', nom: 'fermeture', piece: 'sas', portable: false, fermeture: 'chambre' },
    { id: 'burette', nom: 'burette', piece: 'sas', glissant: 1 },
    { id: 'compresseur', nom: 'compresseur', piece: 'chambre', portable: false, avertisseur: { piece: 'chambre' } },
  ],
  creature: { piece: 'entrepot' },
};
const SANS_CREATURE: DefMonde = { ...FROID, id: 'essai-froid-seul', creature: undefined };

describe('zone sans gravité : reprise en pleine dérive (T-10)', () => {
  // La porte grippée du passager, au fond, attire la créature de l'ouest à travers la zone ; un cellier lui laisse un geste discret.
  const TRAQUE: DefMonde = {
    ...GRAVITE,
    id: 'essai-gravite-traque',
    depart: 'loin',
    pieces: [...GRAVITE.pieces, { id: 'cellier', nom: 'cellier' }],
    liaisons: [
      ...GRAVITE.liaisons.map((liaison) => (liaison.id === 'el' ? { ...liaison, bruyante: true } : liaison)),
      { id: 'lc', nom: 'porte_lc', entre: ['loin', 'cellier'], ouverte: false },
    ],
    creature: { piece: 'ouest' },
  };

  it('en pleine dérive, la reprise d’une sauvegarde redonne le même état, puis la même suite', () => {
    expect(validerMonde(TRAQUE)).toEqual([]);
    const pas = suite(TRAQUE, partie(TRAQUE), [['ouvrir', 'est'], ['ouvrir', 'cellier']]);
    expect(pas[0]?.partie.etat.creature).toMatchObject({ piece: 'zone', bord: 'oz' });
    const sauvee = fin(pas);
    expect(sauvee.etat.creature).toMatchObject({ piece: 'zone', derive: { vers: 'ze', restant: 1 } });
    const reprise = reprendrePartie(TRAQUE, JSON.parse(JSON.stringify({ enregistrement: sauvee.enregistrement, etat: sauvee.etat })), 'morceaux-1');
    expect(empreinteEtat(reprise.etat)).toBe(empreinteEtat(sauvee.etat));
    const [, arrivee] = suite(TRAQUE, reprise, [['fermer', 'cellier'], ['ouvrir', 'cellier']]);
    expect(arrivee?.partie.etat.creature?.piece).toBe('est');
  });
});

describe('chambre froide : le passager (D-166, D-240, C-04 §3.2)', () => {
  it('la fixture est valide ; un pupitre de fermeture loin de sa chambre est refusé', () => {
    expect(validerMonde(FROID)).toEqual([]);
    const loin: DefMonde = { ...FROID, objets: [{ id: 'pupitre', nom: 'fermeture', piece: 'entrepot', portable: false, fermeture: 'sas' }] };
    expect(validerMonde(loin)).toEqual(["pupitre : ferme une pièce qui n'est pas une chambre froide.", "pupitre : pupitre hors d'une pièce voisine de sa chambre (D-170)."]);
  });

  it('deux actions dedans sans mal ; la troisième blesse, annoncée certaine ; puis chaque action ; mortelle si critique', () => {
    const deux = suite(SANS_CREATURE, partie(SANS_CREATURE), [['aller', 'chambre'], ['fermer', 'sas']]);
    expect(fin(deux).etat).toMatchObject({ froid: 2, sante: 'indemne' });
    expect(observer(SANS_CREATURE, fin(deux).etat).froid).toBe(true);
    expect(apercuDe(SANS_CREATURE, fin(deux), 'ouvrir', 'sas')).toMatchObject({ risque: 'certain', danger: { type: 'froid' } });
    // Ressortir n'expose pas au froid.
    expect(apercuDe(SANS_CREATURE, fin(deux), 'aller', 'entrepot')).toMatchObject({ risque: 'aucun', danger: null });
    const troisieme = engager(SANS_CREATURE, fin(deux), 'ouvrir', 'sas');
    expect(troisieme.evenements.at(-1)).toEqual({ type: 'aggravation_blesse', causes: ['froid'] });
    const quatrieme = engager(SANS_CREATURE, troisieme.partie, 'fermer', 'sas');
    expect(quatrieme.partie.etat.sante).toBe('critique');
    expect(apercuDe(SANS_CREATURE, quatrieme.partie, 'ouvrir', 'sas')).toMatchObject({ risque: 'certain', danger: { type: 'froid_mortel' } });
    const cinquieme = engager(SANS_CREATURE, quatrieme.partie, 'ouvrir', 'sas');
    expect(cinquieme.evenements.at(-1)).toEqual({ type: 'defaite', causes: ['froid'] });
    expect(observer(SANS_CREATURE, cinquieme.partie.etat).issue).toBe('defaite');
  });

  it('ressortir remet le compte à zéro', () => {
    const pas = suite(SANS_CREATURE, partie(SANS_CREATURE), [['aller', 'chambre'], ['fermer', 'sas'], ['aller', 'entrepot'], ['aller', 'chambre'], ['ouvrir', 'sas']]);
    expect(fin(pas).etat).toMatchObject({ froid: 2, sante: 'indemne' });
  });
});

describe('chambre froide : la créature ralentie (D-166, D-170, D-239, MX-01, MX-05, T-17)', () => {
  const dedans = (creature: Partial<EtatCreature> = {}, changement: Partial<Partie['etat']> = {}): Partie =>
    placee(FROID, { creature: { piece: 'chambre', ...CALME, ...creature }, ...changement });

  it('le compresseur sonne fort le temps de trois réactions et l’attire (D-234)', () => {
    const lance = engager(FROID, placee(FROID, { piece: 'chambre' }), 'declencher', 'compresseur');
    expect(lance.partie.etat.alarmes).toEqual([{ objet: 'compresseur', restant: 2 }]);
    expect(lance.partie.etat.creature?.piece).toBe('chambre');
  });

  it('le pupitre ferme d’un coup les deux portes ; elle est dedans : ralentie pour de bon, engourdie aussitôt', () => {
    expect(apercuDe(FROID, dedans(), 'boucler', 'fermeture')).toMatchObject({ savoir: [{ type: 'bouclera' }] });
    const bouclee = engager(FROID, dedans(), 'boucler', 'fermeture');
    expect(types(bouclee.evenements)).toEqual(['chambre_bouclee']);
    expect(bouclee.partie.etat.liaisons).toEqual({ sc: false, ce: false });
    expect(bouclee.partie.etat.creature?.ralentie).toEqual({ saute: false });
    // Toujours offert : l'option ne dit rien des portes ; déjà fermées, elles le restent, contre une action.
    const encore = engager(FROID, bouclee.partie, 'boucler', 'fermeture');
    expect(encore.partie.etat.liaisons).toEqual({ sc: false, ce: false });
    expect(encore.partie.etat.actions).toBe(bouclee.partie.etat.actions + 1);
  });

  it('depuis le sas, l’option du pupitre est la même, porte de l’entrepôt ouverte ou fermée : rien de caché ne s’y lit (C-06 §5)', () => {
    const ouverte = placee(FROID, { liaisons: { sc: false, ce: true } });
    const fermee = placee(FROID, { liaisons: { sc: false, ce: false } });
    expect(option(FROID, ouverte, 'boucler', 'fermeture')).toEqual(option(FROID, fermee, 'boucler', 'fermeture'));
    expect(apercuDe(FROID, ouverte, 'boucler', 'fermeture')).toEqual(apercuDe(FROID, fermee, 'boucler', 'fermeture'));
  });

  it('une porte de la chambre fermée à la main pendant qu’elle est dedans suffit (D-239) ; dehors, rien', () => {
    expect(engager(FROID, dedans(), 'fermer', 'chambre').partie.etat.creature?.ralentie).toBeDefined();
    const dehors = placee(FROID, { creature: { piece: 'entrepot', ...CALME } });
    expect(engager(FROID, dehors, 'fermer', 'chambre').partie.etat.creature?.ralentie).toBeUndefined();
  });

  it('ralentie, elle n’agit qu’une réaction sur deux, pour toute la partie', () => {
    // Elle cherche le passager vers l'entrepôt, qu'elle n'atteindrait qu'en deux réactions.
    const traque = { indice: { piece: 'entrepot', par: null }, ralentie: { saute: true } };
    const pas = attendre(FROID, placee(FROID, { piece: 'sas', creature: { piece: 'chambre', ...CALME, ...traque }, liaisons: { sc: false, ce: true } }), 'chambre', 4);
    expect(pas.map((un) => un.partie.etat.creature?.piece)).toEqual(['chambre', 'entrepot', 'entrepot', 'entrepot']);
  });

  it('pendant la réaction sautée, elle ne peut pas l’intercepter ; à la suivante, si', () => {
    const face = { contact: true, ralentie: { saute: true } };
    const libre = placee(FROID, { piece: 'chambre', creature: { piece: 'chambre', ...CALME, ...face } });
    expect(apercuDe(FROID, libre, 'aller', 'sas')).toMatchObject({ risque: 'aucun' });
    // Ce que l'aperçu en dit se voit : elle est figée (C-06 §4).
    expect(observer(FROID, libre.etat)).toMatchObject({ creatureRalentie: true, creatureEngourdie: true });
    const menace = placee(FROID, { piece: 'chambre', creature: { piece: 'chambre', ...CALME, ...face, ralentie: { saute: false } } });
    expect(apercuDe(FROID, menace, 'aller', 'sas')).toMatchObject({ risque: 'eleve', danger: { type: 'interception' } });
    expect(observer(FROID, menace.etat)).toMatchObject({ creatureRalentie: true, creatureEngourdie: false });
  });

  it('fermer la chambre sous ses yeux : le jet d’interception prend sa réaction, la suivante est sautée', () => {
    const face = placee(FROID, { piece: 'chambre', creature: { piece: 'chambre', ...CALME, contact: true } });
    const fermee = engager(FROID, face, 'fermer', 'sas');
    expect(fermee.tirages).toHaveLength(1);
    expect(fermee.partie.etat.creature?.ralentie).toEqual({ saute: true });
    expect(apercuDe(FROID, fermee.partie, 'ouvrir', 'sas')).toMatchObject({ risque: 'aucun' });
  });

  it('T-17, MX-01 : enfermée puis glissée sur l’huile, ses deux réactions perdues se comptent sur celles qui restent', () => {
    // Huile au pied de la porte de l'entrepôt, côté entrepôt : elle y glisse en sortant de la chambre ; le passager attend au sas.
    const huilee = dedans(
      { ralentie: { saute: false }, indice: { piece: 'entrepot', par: null } },
      { huile: [{ liaison: 'ce', piece: 'entrepot' }] },
    );
    const glisse = engager(FROID, huilee, 'fermer', 'chambre');
    expect(glisse.partie.etat.creature).toMatchObject({ piece: 'entrepot', perdues: 2, ralentie: { saute: true } });
    const suites = attendre(FROID, glisse.partie, 'chambre', 6);
    expect(suites.map((un) => un.partie.etat.creature?.perdues)).toEqual([2, 1, 1, 0, 0, 0]);
    // Une réaction sur deux, et deux perdues : six actions avant qu'elle n'agisse de nouveau, contre trois sans le froid.
    expect(suites.map((un) => un.partie.etat.creature?.ralentie?.saute)).toEqual([false, true, false, true, false, true]);
  });

  it('MX-01 : ralentie, sa dérive sans gravité se compte aussi sur les réactions qui restent', () => {
    let courante = placee(GRAVITE, {
      piece: 'loin',
      creature: { piece: 'ouest', ...CALME, indice: { piece: 'est', par: null }, ralentie: { saute: false } },
    });
    let actions = 0;
    while (courante.etat.creature?.piece !== 'est' && actions < 20) {
      courante = attendre(GRAVITE, courante, 'est', 1)[0]?.partie ?? courante;
      actions += 1;
    }
    // Quatre réactions utiles (entrer, dériver deux fois, franchir), une sur deux : sept actions.
    expect(actions).toBe(7);
  });

  it('MX-05 : l’huile versée dans la chambre froide y reste glissante, sans effet de plus', () => {
    const versee = fin(suite(FROID, placee(FROID, { creature: null }), [['prendre', 'burette'], ['aller', 'chambre'], ['verser', 'burette', 'entrepot']]));
    expect(versee.etat.huile).toEqual([{ liaison: 'ce', piece: 'chambre' }]);
    const attiree = placee(FROID, { ...versee.etat, creature: { piece: 'entrepot', ...CALME, indice: { piece: 'chambre', par: null } } });
    const glisse = engager(FROID, attiree, 'aller', 'sas');
    expect(glisse.partie.etat.creature).toMatchObject({ piece: 'chambre', perdues: 2 });
    expect(glisse.partie.etat.creature?.ralentie).toBeUndefined();
  });

  it('T-10 : ralentie, la reprise d’une sauvegarde redonne le même état', () => {
    const pas = suite(FROID, partie(FROID), [['aller', 'chambre'], ['declencher', 'compresseur'], ['aller', 'sas'], ['boucler', 'fermeture']]);
    const sauvee = fin(pas);
    expect(sauvee.etat.creature?.ralentie).toBeDefined();
    const reprise = reprendrePartie(FROID, JSON.parse(JSON.stringify({ enregistrement: sauvee.enregistrement, etat: sauvee.etat })), 'morceaux-1');
    expect(empreinteEtat(reprise.etat)).toBe(empreinteEtat(sauvee.etat));
    expect(reprise.etat.creature).toEqual(sauvee.etat.creature);
  });
});
