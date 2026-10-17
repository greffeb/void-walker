import {
  apercu,
  empreinteEtat,
  exporter,
  jouer,
  lireExport,
  nouvellePartie,
  observer,
  rejouer,
  sonRetenu,
  validerMonde,
  type DefMonde,
  type Commande,
  type Evenement,
  type IdAction,
  type Partie,
} from './index';
import { dangerConnu, PORTE_DETRUITE, REACTIONS_FORCER, reagir } from './creature';
import { ATTEINT_JUSQUA } from './sante';

// Créature (C-03 §3, §4 ; C-02 §4.2 ; OP-01). Fixtures nommées par leur rôle ; aucune règle ne lit un nom.
//
//   salle_a ══porte_ab (bruyante, fermée)══ salle_b ══porte_bc (ouverte)══ salle_c ══porte_cd (ouverte)══ salle_d
//      ╚══════════════ grille_ac (étroite, son au travers, fermée) ══════════════╝
const MONDE: DefMonde = {
  id: 'essai-creature',
  depart: 'a',
  pieces: [
    { id: 'a', nom: 'salle_a' },
    { id: 'b', nom: 'salle_b' },
    { id: 'c', nom: 'salle_c' },
    { id: 'd', nom: 'salle_d' },
  ],
  liaisons: [
    { id: 'ab', nom: 'porte_ab', entre: ['a', 'b'], ouverte: false, bruyante: true },
    { id: 'bc', nom: 'porte_bc', entre: ['b', 'c'], ouverte: true },
    { id: 'cd', nom: 'porte_cd', entre: ['c', 'd'], ouverte: true },
    { id: 'ac', nom: 'grille_ac', entre: ['a', 'c'], ouverte: false, etroite: true, sonAuTravers: true },
  ],
  objets: [
    { id: 'o-a', nom: 'boite', piece: 'a' },
    { id: 'o-b', nom: 'cle', piece: 'b' },
  ],
  creature: { piece: 'c' },
};
const VERSION = 'creature-1';

function avec(changement: Partial<DefMonde>): DefMonde {
  return { ...MONDE, ...changement };
}

function liaisons(monde: DefMonde, modifs: Readonly<Record<string, Partial<DefMonde['liaisons'][number]>>>): DefMonde {
  return { ...monde, liaisons: monde.liaisons.map((liaison) => ({ ...liaison, ...modifs[liaison.id] })) };
}

function partie(monde: DefMonde = MONDE): Partie {
  return nouvellePartie(monde, { version: VERSION, graine: 7 });
}

/** Joue l'option du menu public `action` sur la cible nommée `nom` (passage nommé par lui-même ou sa destination). */
function engager(monde: DefMonde, courante: Partie, action: IdAction, nom: string): { partie: Partie; evenements: readonly Evenement[] } {
  const option = observer(monde, courante.etat).menu.find(
    (choix) => choix.action === action && choix.disponible && (choix.cible.nom === nom || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === nom)),
  );
  if (option === undefined) throw new Error(`Option ${action} ${nom} absente ou indisponible.`);
  const resultat = jouer(monde, courante, option.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return { partie: resultat.partie, evenements: resultat.evenements };
}

/** Ce que raconte un jet d'interception : une blessure s'il touche, sinon la menace (C-04 §4.2). */
function apresJet(partie: Partie, rang: number): string {
  const tirages = partie.enregistrement.actions[rang]?.tirages ?? [];
  expect(tirages).toHaveLength(1);
  return (tirages[0] ?? 0) <= ATTEINT_JUSQUA ? 'aggravation_blesse' : 'menace';
}

function suite(monde: DefMonde, depart: Partie, gestes: readonly (readonly [IdAction, string])[]): { partie: Partie; evenements: (readonly Evenement[])[] } {
  let courante = depart;
  const evenements: (readonly Evenement[])[] = [];
  for (const [action, nom] of gestes) {
    const pas = engager(monde, courante, action, nom);
    courante = pas.partie;
    evenements.push(pas.evenements);
  }
  return { partie: courante, evenements };
}

function types(evenements: readonly Evenement[]): string[] {
  return evenements.map((evenement) => evenement.type);
}

const pieceCreature = (courante: Partie): string | null | undefined => courante.etat.creature?.piece;

function optionAller(monde: DefMonde, courante: Partie, nom: string): Commande {
  const option = observer(monde, courante.etat).menu.find(
    (choix) => choix.action === 'aller' && choix.cible.sorte === 'passage' && (choix.cible.nom === nom || choix.cible.vers?.nom === nom),
  );
  if (option === undefined) throw new Error(`Aller ${nom} absent.`);
  return option.commande;
}

describe('créature : monde et état (C-02 §4.2)', () => {
  it('un monde avec créature est valide ; jamais dans la pièce de départ, jamais dans une pièce inconnue (GP-04)', () => {
    expect(validerMonde(MONDE)).toEqual([]);
    expect(validerMonde(avec({ creature: { piece: 'a' } }))).toContain('Créature dans la pièce de départ (GP-04).');
    expect(validerMonde(avec({ creature: { piece: 'z' } }))).toContain('Créature : pièce inconnue z.');
  });

  it('état de départ : emplacement réel, aucun indice, premier contact pas encore annoncé', () => {
    expect(partie().etat.creature).toMatchObject({ piece: 'c', indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
    expect(nouvellePartie({ ...MONDE, creature: undefined }, { version: VERSION, graine: 7 }).etat.creature).toBeNull();
  });
});

describe('perception et réaction (C-03 §4)', () => {
  it('sans indice, la créature attend au même endroit : aucune patrouille', () => {
    const { partie: fin, evenements } = suite(MONDE, partie(), [
      ['prendre', 'boite'],
      ['poser', 'boite'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(pieceCreature(fin)).toBe('c');
    expect(fin.etat.creature?.indice).toBeNull();
    expect(evenements.flat().map((evenement) => evenement.type)).not.toContain('bruit_creature');
  });

  it('T-01 : dix lectures, menus et aperçus entre deux engagements ne font pas réagir la créature', () => {
    // Créature déjà en route vers un indice : la moindre réaction la ferait avancer.
    const monde = liaisons(MONDE, { bc: { ouverte: false } });
    const enRoute = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]).partie;
    const avant = JSON.stringify(enRoute);
    for (let fois = 0; fois < 10; fois++) {
      for (const choix of observer(monde, enRoute.etat).menu) {
        expect(apercu(monde, enRoute, choix.commande).type).toBe(choix.disponible ? (choix.action === 'regarder' ? 'gratuit' : 'apercu') : 'refus');
        if (choix.action === 'regarder') expect(jouer(monde, enRoute, choix.commande).partie).toBe(enRoute);
      }
    }
    expect(JSON.stringify(enRoute)).toBe(avant);
  });

  it('un son passe par des portes ouvertes et attire, une liaison par réaction ; le passager l’entend bouger derrière la porte', () => {
    const { partie: fin, evenements } = suite(MONDE, partie(), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
    ]);
    // Pas 1 : bruit en A, chemin sonore A–B–C par des portes ouvertes ; la créature franchit une seule liaison, C → B.
    expect(types(evenements[0] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme', 'bruit_creature']);
    expect(evenements[0]?.[2]).toMatchObject({ type: 'bruit_creature', passage: { nom: 'porte_ab' } });
    // Pas 2 : geste silencieux ; elle poursuit vers l'indice, entre en A : premier contact, sans conséquence hostile.
    expect(types(evenements[1] ?? [])).toEqual(['objet_pris', 'creature_entre', 'premier_contact']);
    expect(pieceCreature(fin)).toBe('a');
    expect(fin.etat.creature).toMatchObject({ indice: null, contact: true, repit: true, alcove: false, perdues: 0, connues: [], engagee: null });
  });

  it('une porte fermée bloque le son : la créature ne l’entend pas et ne bouge pas', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false }, ac: { sonAuTravers: false } });
    const { partie: fin, evenements } = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]);
    expect(types(evenements[0] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme']);
    expect(fin.etat.creature).toMatchObject({ piece: 'c', indice: null, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
  });

  it('T-07 : son entendu par une grille trop étroite, aucune voie praticable : elle ne passe pas, l’origine perçue est conservée', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false } });
    const { partie: fin } = suite(monde, partie(monde), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(fin.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'a', par: null }, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
  });

  it('T-07 : le chemin du son praticable en partie, elle rejoint le côté accessible de la séparation étroite', () => {
    // Créature en D : le son de A lui arrive par la grille puis la porte C–D ; seule C–D lui est praticable.
    const monde = liaisons({ ...MONDE, creature: { piece: 'd' } }, { bc: { ouverte: false } });
    const { partie: fin } = suite(monde, partie(monde), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(fin.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'a', par: null }, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
  });

  it('l’origine perçue est poursuivie plus tard, dès qu’une voie s’ouvre, sans nouveau son', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false } });
    const coincee = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]).partie;
    expect(coincee.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'a', par: null }, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
    // Le passager ouvre B–C depuis B (geste discret) : la créature reprend la poursuite vers A, par B.
    const { partie: fin, evenements } = suite(monde, coincee, [
      ['aller', 'salle_b'],
      ['ouvrir', 'porte_bc'],
    ]);
    expect(types(evenements[1] ?? [])).toEqual(['passage_ouvert', 'creature_entre', 'premier_contact']);
    expect(fin.etat.creature).toMatchObject({ piece: 'b', indice: { piece: 'a', par: null }, contact: true, repit: true, garde: 'bc', alcove: false, perdues: 0, connues: [], engagee: null });
  });

  it('premier contact annoncé une seule fois ; l’action suivante est libre, puis la quitter passe par le dé (D-184, D-183)', () => {
    const contact = suite(MONDE, partie(), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
    ]).partie;
    const repit = engager(MONDE, contact, 'poser', 'boite');
    expect(types(repit.evenements)).toEqual(['objet_pose', 'menace']);
    const fuite = jouer(MONDE, repit.partie, optionAller(MONDE, repit.partie, 'salle_b'));
    if (fuite.type !== 'engagee') throw new Error('Fuite non engagée.');
    expect(fuite.tirages).toHaveLength(1);
    const interception = (fuite.tirages[0] ?? 0) <= ATTEINT_JUSQUA ? 'aggravation_blesse' : 'menace';
    expect(types(fuite.evenements)).toEqual([interception, 'deplacement', 'piece_decouverte']);
  });

  it('arriver dans la pièce du passager et l’attaquer ne tiennent pas dans la même réaction (C-03 §4.3)', () => {
    // Contact en A ; le passager repasse en B par la porte qu'elle vient de franchir (un dé, D-195), referme,
    // puis rouvre bruyamment A–B depuis B.
    const { partie: fin, evenements } = suite(MONDE, partie(), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['aller', 'salle_b'],
      ['fermer', 'porte_ab'],
      ['ouvrir', 'porte_ab'],
      ['prendre', 'cle'],
    ]);
    expect(types(evenements[2] ?? [])).toEqual([apresJet(fin, 2), 'deplacement', 'piece_decouverte']);
    expect(types(evenements[4] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme', 'creature_entre']);
    // Action suivante sous ses yeux : le dé de D-183, quel qu'en soit le résultat.
    expect(types(evenements[5] ?? [])).toEqual(['objet_pris', expect.stringMatching(/^(menace|aggravation_blesse|aggravation_critique)$/)]);
    expect(pieceCreature(fin)).toBe('b');
  });

  it('un joueur visible passe avant un son, même plus fort (C-03 §4.2)', () => {
    const depart = partie();
    const ensemble = { ...depart.etat, creature: { piece: 'a', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null } };
    const reponse = reagir(MONDE, ensemble, [{ piece: 'c', intensite: 'fort' }], 'a', undefined, false);
    expect(reponse.etat.creature).toMatchObject({ piece: 'a', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
    expect(types(reponse.evenements)).toEqual(['menace']);
  });

  it('T-09 : elle suit le passage qu’elle l’a vu prendre, pas sa position cachée ; arrivée sur place, sans indice, elle attend', () => {
    const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
    const vue = suite(monde, partie(monde), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    expect(vue.etat.creature).toMatchObject({ piece: 'c', contact: true, repit: true, alcove: false, perdues: 0, connues: [], engagee: null });
    // Il sort par B puis continue vers A, ou reste en B : elle fait le même pas, vers B, puis, alertée, suit ses pas (D-276).
    const loin = suite(monde, vue, [['aller', 'salle_b'], ['aller', 'salle_a'], ['prendre', 'boite']]);
    const pres = suite(monde, vue, [['aller', 'salle_b'], ['prendre', 'cle']]);
    expect(loin.evenements.map(types)).toEqual([['deplacement'], ['deplacement', 'bruit_creature'], ['objet_pris', 'creature_entre']]);
    expect(pres.evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre']]);
    expect(loin.partie.etat.creature).toMatchObject({ piece: 'a', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
    expect(pres.partie.etat.creature).toMatchObject({ piece: 'b', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
  });
});

describe('poursuite par le passage vu (D-177)', () => {
  const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
  const contact = (): Partie => suite(monde, partie(monde), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;

  it('elle le voit partir pendant l’action, le suit à l’action suivante, une pièce à la fois, puis menace', () => {
    const { partie: fin, evenements } = suite(monde, contact(), [
      ['aller', 'salle_b'],
      ['prendre', 'cle'],
      ['poser', 'cle'],
    ]);
    expect(evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre'], ['objet_pose', apresJet(fin, fin.enregistrement.actions.length - 1)]]);
    expect(pieceCreature(fin)).toBe('b');
  });

  it('refermer la porte derrière soi ne l’arrête plus si un autre chemin existe : alertée, elle entend ses pas et fait le tour (D-276)', () => {
    // Grille élargie et ouverte : C → A → B est praticable, et le son y passe.
    const detour = liaisons(monde, { ac: { etroite: false, ouverte: true } });
    const vue = suite(detour, partie(detour), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    const { partie: fin } = suite(detour, vue, [
      ['aller', 'salle_b'],
      ['fermer', 'porte_bc'],
      ['prendre', 'cle'],
      ['poser', 'cle'],
    ]);
    expect(fin.etat.creature).toMatchObject({ piece: 'b', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
  });

  it('un passage trop étroit l’arrête : elle ne le suit pas par la grille mais, alertée, elle fait le tour en suivant ses pas (D-276)', () => {
    const { partie: fin } = suite(monde, contact(), [
      ['ouvrir', 'grille_ac'],
      ['aller', 'salle_a'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(pieceCreature(fin)).toBe('a');
  });

  it('deux passages entre les mêmes pièces : elle retient celui qu’il a vraiment pris, quel que soit l’ordre du monde', () => {
    const grille = { id: 'bc2', nom: 'grille_bc', entre: ['b', 'c'] as const, ouverte: true, etroite: true };
    for (const avant of [true, false]) {
      const double: DefMonde = { ...monde, liaisons: avant ? [grille, ...monde.liaisons] : [...monde.liaisons, grille] };
      const vue = suite(double, partie(double), [['aller', 'salle_b'], ['aller', 'porte_bc']]).partie;
      const parPorte = suite(double, vue, [['aller', 'porte_bc'], ['prendre', 'cle']]);
      expect(parPorte.evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre']]);
      const parGrille = suite(double, vue, [['aller', 'grille_bc'], ['prendre', 'cle'], ['poser', 'cle']]);
      // Elle ne passe pas par la grille, trop étroite, mais entend ses pas et rejoint B par la porte (D-276).
      const dernier = parGrille.partie.enregistrement.actions.length - 1;
      expect(parGrille.evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre'], ['objet_pose', apresJet(parGrille.partie, dernier)]]);
      expect(parGrille.partie.etat.creature).toMatchObject({ piece: 'b' });
    }
  });

  it('un son prend le pas sur l’indice de départ (C-03 §4.2) ; la porte refermée sur sa piste, elle la force (D-279)', () => {
    const bruyante = liaisons(monde, { ac: { bruyante: true } });
    const vue = suite(bruyante, partie(bruyante), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    // Après les deux premières réactions, des gestes discrets dans A jusqu'à ce que la porte cède.
    const attente = Array.from({ length: REACTIONS_FORCER - 2 }, (_, rang) => [rang % 2 === 0 ? 'prendre' : 'poser', 'boite'] as const);
    const { partie: bloquee, evenements } = suite(bruyante, vue, [['aller', 'salle_b'], ['fermer', 'porte_bc'], ['aller', 'salle_a'], ...attente]);
    // Porte refermée devant elle : elle s'y acharne, le passager l'entend depuis B. Le bruit de ses pas dans A lui parvient par la
    // grille et remplace l'indice de départ ; son plus court chemin vers lui passe par la même porte, qui finit par céder.
    expect(types(evenements[1] ?? [])).toEqual(['passage_ferme', 'porte_secouee']);
    // Loin de la porte, il ne l'entend plus ; le récit dit seulement qu'elle a entendu ses pas (D-276).
    expect(types(evenements[2] ?? [])).toEqual(['deplacement', 'pas_entendus']);
    expect(evenements.slice(2).flatMap(types)).not.toContain('porte_enfoncee');
    expect(bloquee.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'a', par: null }, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
    expect(bloquee.etat.creature?.force).toBeUndefined();
    expect(bloquee.etat.liaisons.bc).toBe(true);
    const fin = suite(bruyante, bloquee, [['ouvrir', 'grille_ac']]).partie;
    expect(fin.etat.creature).toMatchObject({ piece: 'b', indice: { piece: 'a', par: null }, contact: true });
  });

  it('revenir dans sa pièce efface l’indice de départ : elle le voit, menace', () => {
    const { partie: fin, evenements } = suite(monde, contact(), [['aller', 'salle_b'], ['aller', 'salle_c']]);
    expect(evenements.map(types)).toEqual([['deplacement'], ['deplacement', 'menace']]);
    expect(fin.etat.creature).toMatchObject({ piece: 'c', indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null });
  });
});

describe('où la créature entend', () => {
  it('le passager n’entend rien au-delà de la pièce voisine (OP-01)', () => {
    // Le bruit de A attire la créature de D vers C. C n'est voisine de A que par la grille.
    const voisine = { ...MONDE, creature: { piece: 'd' } };
    const entendu = suite(voisine, partie(voisine), [['ouvrir', 'porte_ab']]);
    expect(entendu.evenements[0]?.at(-1)).toMatchObject({ type: 'bruit_creature', passage: { nom: 'grille_ac' } });
    // Grille sans passage du son : C n'est plus voisine pour l'oreille, D est au-delà ; rien n'est entendu.
    const sourde = liaisons(voisine, { ac: { sonAuTravers: false } });
    const rien = suite(sourde, partie(sourde), [['ouvrir', 'porte_ab']]);
    expect(types(rien.evenements[0] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme']);
    expect(pieceCreature(rien.partie)).toBe('c');
  });

  it('son le plus fort d’abord ; à égalité, le plus récent (C-03 §4.2)', () => {
    const depart = liaisons(MONDE, { ab: { ouverte: true } });
    const etat = { ...partie(depart).etat };
    expect(sonRetenu(depart, etat, 'c', [{ piece: 'b', intensite: 'fort' }, { piece: 'a', intensite: 'normal' }])).toEqual({ piece: 'b', intensite: 'fort' });
    expect(sonRetenu(depart, etat, 'c', [{ piece: 'b', intensite: 'normal' }, { piece: 'a', intensite: 'normal' }])).toEqual({ piece: 'a', intensite: 'normal' });
    const ferme = liaisons(MONDE, { bc: { ouverte: false }, ac: { sonAuTravers: false } });
    expect(sonRetenu(ferme, partie(ferme).etat, 'c', [{ piece: 'a', intensite: 'fort' }])).toBeUndefined();
  });
});

describe('ce que le passager sait (C-06, C-01 A-02)', () => {
  it('deux mondes identiques pour le passager donnent la même observation, même si la créature bouge hors de sa perception', () => {
    // La créature de D entend la porte et passe en C, sans que le passager l'entende (grille sourde).
    const avecCreature = liaisons({ ...MONDE, creature: { piece: 'd' } }, { ac: { sonAuTravers: false } });
    const sans: DefMonde = { ...avecCreature, creature: undefined };
    const gestes = [['ouvrir', 'porte_ab']] as const;
    const a = suite(avecCreature, partie(avecCreature), gestes);
    const b = suite(sans, partie(sans), gestes);
    expect(pieceCreature(a.partie)).not.toBe('d');
    expect(observer(avecCreature, a.partie.etat)).toEqual(observer(sans, b.partie.etat));
    expect(a.evenements).toEqual(b.evenements);
    expect(observer(avecCreature, a.partie.etat).creatureVisible).toBe(false);
    for (const choix of observer(avecCreature, a.partie.etat).menu) {
      expect(apercu(avecCreature, a.partie, choix.commande)).toEqual(apercu(sans, b.partie, choix.commande));
    }
  });

  it('vue dans la même pièce seulement', () => {
    const contact = suite(MONDE, partie(), [['ouvrir', 'porte_ab'], ['prendre', 'boite']]).partie;
    expect(observer(MONDE, contact.etat).creatureVisible).toBe(true);
  });

  it('ouvrir une porte au mécanisme grippé s’annonce bruyant dans l’aperçu', () => {
    const depart = partie();
    const ouvrir = observer(MONDE, depart.etat).menu.find((choix) => choix.action === 'ouvrir' && choix.cible.nom === 'porte_ab');
    expect(apercu(MONDE, depart, ouvrir?.commande)).toMatchObject({ type: 'apercu', apercu: { risque: 'aucun', cout: 'bruyant' } });
    const grille = observer(MONDE, depart.etat).menu.find((choix) => choix.action === 'ouvrir' && choix.cible.nom === 'grille_ac');
    expect(apercu(MONDE, depart, grille?.commande)).toMatchObject({ type: 'apercu', apercu: { cout: 'aucun' } });
  });
});

describe('danger connu derrière un passage où elle a été perçue (D-180, D-181)', () => {
  /** Niveau et danger de l'aperçu, le danger réduit à son type et au nom de la pièce ou du passage. */
  function apercuDe(monde: DefMonde, courante: Partie, action: IdAction, nom: string): unknown {
    const option = observer(monde, courante.etat).menu.find(
      (choix) => choix.action === action && choix.cible.sorte === 'passage' && (choix.cible.nom === nom || choix.cible.vers?.nom === nom),
    );
    const resultat = apercu(monde, courante, option?.commande);
    if (resultat.type !== 'apercu') throw new Error(`Aperçu ${action} ${nom} : ${resultat.type}.`);
    const { risque, danger } = resultat.apercu;
    if (danger === null) return { risque, danger };
    if (danger.type === 'creature_entendue') return { risque, danger: [danger.type, danger.passage.nom] };
    return { risque, danger: 'piece' in danger ? [danger.type, danger.piece.nom] : [danger.type] };
  }

  it('entendue derrière une porte : modéré, situé par cette porte ; ailleurs, aucun risque connu', () => {
    const monde = liaisons(MONDE, { ac: { ouverte: true } });
    const entendue = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]).partie;
    expect(entendue.etat.reperes).toEqual({ vue: null, entendue: { piece: 'b', par: 'ab' } });
    expect(apercuDe(monde, entendue, 'aller', 'salle_b')).toEqual({ risque: 'modere', danger: ['creature_entendue', 'porte_ab'] });
    expect(apercuDe(monde, entendue, 'aller', 'grille_ac')).toEqual({ risque: 'aucun', danger: null });
    // Elle entre : vue ici, à l'instant ; le bruit est oublié, on sait où elle est (D-181). Repasser par sa porte : le dé (D-195).
    const vue = engager(monde, entendue, 'prendre', 'boite').partie;
    expect(vue.etat.reperes).toEqual({ vue: { piece: 'a', depuis: 0 }, entendue: null });
    expect(apercuDe(monde, vue, 'aller', 'salle_b')).toEqual({ risque: 'eleve', danger: ['interception'] });
  });

  it('entrer dans la pièce du bruit et la voir vide efface le bruit', () => {
    // État injecté : bruit entendu en B, la créature repartie en C sans être perçue ; porte A–B ouverte.
    const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
    const depart = partie(monde);
    const entendue = { ...depart, etat: { ...depart.etat, reperes: { vue: null, entendue: { piece: 'b', par: 'ab' } } } };
    expect(apercuDe(monde, entendue, 'aller', 'salle_b')).toEqual({ risque: 'modere', danger: ['creature_entendue', 'porte_ab'] });
    const vide = engager(monde, entendue, 'aller', 'salle_b').partie;
    expect(vide.etat.reperes).toEqual({ vue: null, entendue: null });
    expect(apercuDe(monde, vide, 'aller', 'salle_a')).toEqual({ risque: 'aucun', danger: null });
  });

  it('vue : élevé à l’instant et il y a un moment, modéré il y a longtemps (seuils D-151) ; ouvrir vers elle s’annonce pareil', () => {
    // Contact par la grille, retour par la grille : trop étroite, elle ne le suit pas et reste en C. La porte A–B, étroite elle aussi,
    // ne se force pas (D-279).
    const monde = liaisons(MONDE, { ab: { bruyante: false, etroite: true }, ac: { ouverte: true } });
    let courante = suite(monde, partie(monde), [['aller', 'grille_ac'], ['aller', 'grille_ac']]).partie;
    expect(courante.etat.reperes.vue).toEqual({ piece: 'c', depuis: 1 });
    const attendus = ['creature_vue_instant', 'creature_vue_moment', 'creature_vue_moment', 'creature_vue_moment', 'creature_vue_moment', 'creature_vue_longtemps'];
    const risqueDe = (type: string | undefined): string => (type === 'creature_vue_longtemps' ? 'modere' : 'eleve');
    for (const [rang, attendu] of attendus.entries()) {
      expect(courante.etat.reperes.vue?.depuis, attendu).toBe(rang + 1);
      expect(apercuDe(monde, courante, 'aller', 'grille_ac')).toEqual({ risque: risqueDe(attendu), danger: [attendu, 'salle_c'] });
      // Refermer la grille compte une action de plus ; l'ouvrir s'annonce comme y aller.
      const suivant = attendus[rang + 1];
      const fermee = engager(monde, courante, 'fermer', 'grille_ac').partie;
      if (suivant !== undefined) expect(apercuDe(monde, fermee, 'ouvrir', 'grille_ac')).toEqual({ risque: risqueDe(suivant), danger: [suivant, 'salle_c'] });
      courante = engager(monde, courante, rang % 2 === 0 ? 'prendre' : 'poser', 'boite').partie;
    }
    // Compteur plafonné à « il y a longtemps » : l'état reste fini.
    expect(courante.etat.reperes.vue).toEqual({ piece: 'c', depuis: 6 });
    expect(pieceCreature(courante)).toBe('c');
  });

  it('vue puis entendue ailleurs : les deux pièces signalées ; voir la pièce vide efface la vue, un nouveau bruit remplace l’ancien', () => {
    // Monde de base, grille ouverte : contact en C par la grille, retour en A, puis porte grippée ouverte.
    const monde = liaisons(MONDE, { ac: { ouverte: true } });
    const avant = suite(monde, partie(monde), [['aller', 'grille_ac'], ['aller', 'grille_ac'], ['ouvrir', 'porte_ab']]).partie;
    expect(pieceCreature(avant)).toBe('b');
    expect(avant.etat.reperes).toEqual({ vue: { piece: 'c', depuis: 2 }, entendue: { piece: 'b', par: 'ab' } });
    expect(apercuDe(monde, avant, 'aller', 'grille_ac')).toEqual({ risque: 'eleve', danger: ['creature_vue_moment', 'salle_c'] });
    expect(apercuDe(monde, avant, 'aller', 'salle_b')).toEqual({ risque: 'modere', danger: ['creature_entendue', 'porte_ab'] });
    // Il retourne en C par la grille : alertée, elle entend ses pas et le rejoint en C, où il la voit (D-276) ; la vue remplace le bruit.
    const { partie: fin, evenements } = suite(monde, avant, [['aller', 'grille_ac']]);
    expect(types(evenements[0] ?? [])).toEqual(['deplacement', 'creature_entre']);
    expect(fin.etat.reperes).toEqual({ vue: { piece: 'c', depuis: 0 }, entendue: null });
  });

  it('un bruit ne vieillit pas : modéré tant que la pièce n’a pas été vue', () => {
    // Créature en D : le bruit de A l'attire en C, entendue derrière la grille ; porte B–C fermée et grille étroite la retiennent en C.
    const monde = liaisons({ ...MONDE, creature: { piece: 'd' } }, { bc: { ouverte: false } });
    let courante = engager(monde, partie(monde), 'ouvrir', 'porte_ab').partie;
    for (let fois = 0; fois < 8; fois++) courante = engager(monde, courante, fois % 2 === 0 ? 'prendre' : 'poser', 'boite').partie;
    expect(pieceCreature(courante)).toBe('c');
    expect(courante.etat.reperes).toEqual({ vue: null, entendue: { piece: 'c', par: 'ac' } });
    expect(apercuDe(monde, courante, 'ouvrir', 'grille_ac')).toEqual({ risque: 'modere', danger: ['creature_entendue', 'grille_ac'] });
  });

  it('deux passages vers la même pièce : les deux préviennent', () => {
    const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
    const double: DefMonde = { ...monde, liaisons: [...monde.liaisons, { id: 'bc2', nom: 'grille_bc', entre: ['b', 'c'], ouverte: true, etroite: true }] };
    const vue = suite(double, partie(double), [['aller', 'salle_b'], ['aller', 'porte_bc'], ['aller', 'grille_bc']]).partie;
    expect(apercuDe(double, vue, 'aller', 'porte_bc')).toEqual({ risque: 'eleve', danger: ['creature_vue_instant', 'salle_c'] });
    expect(apercuDe(double, vue, 'aller', 'grille_bc')).toEqual({ risque: 'eleve', danger: ['creature_vue_instant', 'salle_c'] });
  });

  it('vue et entendue dans la même pièce : le niveau le plus haut ; à égalité, le bruit situé par son passage', () => {
    // États injectés : seuls les repères comptent pour l'aperçu, la créature n'y est pas lue.
    const depart = partie();
    const avec = (depuis: number) => ({ ...depart.etat, reperes: { vue: { piece: 'b', depuis }, entendue: { piece: 'b', par: 'ab' } } });
    expect(dangerConnu(MONDE, avec(3), 'b')).toMatchObject({ risque: 'eleve', danger: { type: 'creature_vue_moment' } });
    expect(dangerConnu(MONDE, avec(6), 'b')).toMatchObject({ risque: 'modere', danger: { type: 'creature_entendue', passage: { nom: 'porte_ab' } } });
    expect(dangerConnu(MONDE, avec(6), 'c')).toBeNull();
  });

  it('elle quitte une pièce voisine pour une pièce lointaine : entendue là d’où vient le bruit (OP-01)', () => {
    // État injecté : passager en B, créature en C en route vers D ; seul C est voisine de B (porte B–C ouverte).
    const depart = partie();
    const etat = { ...depart.etat, piece: 'b', creature: { piece: 'c', indice: { piece: 'd', par: null }, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null } };
    const reponse = reagir(MONDE, etat, [], 'b', undefined, false);
    expect(reponse.etat.creature?.piece).toBe('d');
    expect(reponse.evenements).toMatchObject([{ type: 'bruit_creature', passage: { nom: 'porte_bc' } }]);
    expect(reponse.etat.reperes.entendue).toEqual({ piece: 'c', par: 'bc' });
  });
});

describe('rejeu (C-09)', () => {
  it('rejouer un export redonne le même état, la même position de la créature et les mêmes événements', () => {
    const { partie: fin, evenements } = suite(MONDE, partie(), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    const fichier = lireExport(JSON.parse(JSON.stringify(exporter(MONDE, fin))) as unknown);
    const rejeu = rejouer(MONDE, fichier, VERSION);
    expect(empreinteEtat(rejeu.partie.etat)).toBe(fichier.empreinte);
    expect(rejeu.partie.etat.creature).toEqual(fin.etat.creature);
    expect(rejeu.etapes).toEqual(evenements);
  });
});

describe('porte forcée par la créature en poursuite (D-279)', () => {
  const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
  /** Contact en C, puis le passager repasse en B et claque la porte B–C derrière lui. */
  const claquee = (): { partie: Partie; evenements: (readonly Evenement[])[] } =>
    suite(monde, suite(monde, partie(monde), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie, [['aller', 'salle_b'], ['fermer', 'porte_bc']]);

  /**
   * Gestes discrets en B (prendre puis poser la clé) après la porte claquée, jusqu'à ce qu'elle cède : `REACTIONS_FORCER - 1`
   * actions, la dernière racontée par la porte qui cède.
   */
  const jusquACeder = (fermee: Partie): { partie: Partie; evenements: (readonly Evenement[])[] } =>
    suite(monde, fermee, Array.from({ length: REACTIONS_FORCER - 1 }, (_, rang) => [rang % 2 === 0 ? 'prendre' : 'poser', 'cle'] as const));

  it(`claquer la porte ne l’arrête plus : ${REACTIONS_FORCER} réactions de coups, la porte cède, puis elle passe`, () => {
    expect(REACTIONS_FORCER).toBe(2);
    const { partie: fermee, evenements } = claquee();
    expect(types(evenements[1] ?? [])).toEqual(['passage_ferme', 'porte_secouee']);
    expect(fermee.etat.creature).toMatchObject({ piece: 'c', force: { liaison: 'bc', restant: REACTIONS_FORCER - 1 } });
    const { partie: ouverte, evenements: coups } = jusquACeder(fermee);
    expect(coups.map((pas) => types(pas).at(-1))).toEqual([...Array.from({ length: REACTIONS_FORCER - 2 }, () => 'porte_secouee'), 'porte_enfoncee']);
    const cede = { partie: ouverte };
    expect(cede.partie.etat.liaisons.bc).toBe(true);
    expect(cede.partie.etat.creature?.force).toBeUndefined();
    expect(pieceCreature(cede.partie)).toBe('c');
    const entree = engager(monde, cede.partie, 'attendre', 'salle_b');
    expect(types(entree.evenements)).toEqual(['attente', 'creature_entre']);
    expect(pieceCreature(entree.partie)).toBe('b');
  });

  it(PORTE_DETRUITE ? 'une porte enfoncée ne ferme plus (V2a)' : 'une porte enfoncée se referme, et elle doit la forcer de nouveau (V2b)', () => {
    const cede = jusquACeder(claquee().partie).partie;
    const fermer = observer(monde, cede.etat).menu.find((option) => option.action === 'fermer' && option.cible.nom === 'porte_bc');
    if (PORTE_DETRUITE) {
      expect(cede.etat.enfoncees).toEqual(['bc']);
      expect(fermer).toMatchObject({ disponible: false, raison: 'enfoncee' });
      return;
    }
    expect(cede.etat.enfoncees).toBeUndefined();
    expect(fermer?.disponible).toBe(true);
    const refermee = engager(monde, cede, 'fermer', 'porte_bc');
    expect(types(refermee.evenements)).toEqual(['passage_ferme', 'porte_secouee']);
    expect(jusquACeder(refermee.partie).evenements.flatMap(types).at(-1)).toBe('porte_enfoncee');
  });

  it('elle reprend à zéro une porte qu’elle a cessé de forcer', () => {
    const { partie: fermee } = claquee();
    // État injecté : elle a perdu sa piste et n'écoute plus ; elle n'a plus de raison de forcer la porte.
    const creature = fermee.etat.creature === null ? null : { ...fermee.etat.creature, indice: null, ecoute: 0 };
    const oubliee = { ...fermee, etat: { ...fermee.etat, creature } };
    const suivante = engager(monde, oubliee, 'prendre', 'cle').partie;
    expect(suivante.etat.creature?.force).toBeUndefined();
    expect(suivante.etat.liaisons.bc).toBe(false);
  });

  it('avant le premier contact, une porte fermée l’arrête toujours', () => {
    // État injecté : un indice derrière la porte fermée, sans contact.
    const depart = partie(monde);
    const ferme = { ...depart, etat: { ...depart.etat, liaisons: { ...depart.etat.liaisons, bc: false }, creature: { piece: 'c', indice: { piece: 'b', par: 'bc' }, contact: false, repit: false, alcove: false, perdues: 0, connues: [], engagee: null } } };
    const suivante = engager(monde, ferme, 'prendre', 'boite').partie;
    expect(suivante.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'b', par: 'bc' } });
    expect(suivante.etat.creature?.force).toBeUndefined();
    expect(suivante.etat.liaisons.bc).toBe(false);
  });

  it('un passage étroit ne se force pas', () => {
    const etroite = liaisons(monde, { bc: { etroite: true } });
    const { partie: fermee, evenements } = suite(etroite, suite(etroite, partie(etroite), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie, [['aller', 'salle_b'], ['fermer', 'porte_bc']]);
    expect(types(evenements[1] ?? [])).toEqual(['passage_ferme']);
    expect(fermee.etat.creature?.force).toBeUndefined();
  });
});

describe('poursuite des pas, écoute et fouille (D-276)', () => {
  const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
  /** Créature alertée dans `piece`, sans piste, que le passager n'a pas encore fait bouger. */
  const alertee = (courante: DefMonde, piece: string, ecoute?: number): Partie => {
    const depart = partie(courante);
    const creature = { piece, indice: null, contact: true, repit: false, alcove: false, perdues: 0, connues: [], engagee: null, ...(ecoute === undefined ? {} : { ecoute }) };
    return { ...depart, etat: { ...depart.etat, creature } };
  };

  it('avant le premier contact, ses pas n’attirent rien', () => {
    const { partie: fin, evenements } = suite(monde, partie(monde), [['aller', 'salle_b'], ['prendre', 'cle']]);
    expect(evenements.flatMap(types)).not.toContain('pas_entendus');
    expect(pieceCreature(fin)).toBe('c');
  });

  it('alertée, elle entend ses pas dans une autre pièce et va vers lui ; le bruit de sa marche suffit au récit', () => {
    const { partie: fin, evenements } = suite(monde, alertee(monde, 'd'), [['aller', 'salle_b'], ['prendre', 'cle']]);
    expect(types(evenements[0] ?? [])).toEqual(['deplacement', 'piece_decouverte', 'bruit_creature']);
    expect(pieceCreature(fin)).toBe('b');
    expect(types(evenements[1] ?? [])).toEqual(['objet_pris', 'creature_entre']);
  });

  it('elle garde l’oreille ouverte trois actions : son souffle l’attire, puis plus rien', () => {
    // Séparation étroite : elle entend par la grille mais ne peut pas passer, et la porte A–B, étroite elle aussi, ne se force pas
    // (D-279) ; on voit donc l’écoute s’user sans qu’elle arrive.
    const etroit = liaisons(MONDE, { ab: { ouverte: false, bruyante: false, etroite: true } });
    const depart = alertee(etroit, 'c', 3);
    const ecoutes: (number | undefined)[] = [];
    const evenements: string[][] = [];
    let courante = depart;
    for (const geste of [['prendre', 'boite'], ['poser', 'boite'], ['prendre', 'boite'], ['poser', 'boite']] as const) {
      const pas = engager(etroit, courante, geste[0], geste[1]);
      courante = pas.partie;
      ecoutes.push(courante.etat.creature?.ecoute);
      evenements.push(types(pas.evenements));
    }
    expect(ecoutes).toEqual([2, 1, undefined, undefined]);
    // Seule la première piste est racontée : il n’y a rien de neuf ensuite.
    expect(evenements.map((un) => un.includes('souffle_entendu'))).toEqual([true, false, false, false]);
    expect(courante.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'a', par: null } });
  });

  it('au bout de sa piste sans le trouver, elle fouille une pièce voisine, pas celle d’où elle vient, une seule fois', () => {
    // Passager caché en A derrière deux portes fermées, sans piste : elle fouille par la première porte ouverte.
    const fermees = liaisons(MONDE, { ab: { ouverte: false, bruyante: false } });
    const gestes = [['prendre', 'boite'], ['poser', 'boite'], ['prendre', 'boite']] as const;
    let courante = alertee(fermees, 'c');
    const pieces: (string | null | undefined)[] = [];
    for (const geste of gestes) {
      courante = engager(fermees, courante, geste[0], geste[1]).partie;
      pieces.push(pieceCreature(courante));
    }
    // Une pièce voisine (B par la porte, la grille étant trop étroite), puis elle s’immobilise.
    expect(pieces).toEqual(['b', 'b', 'b']);
    expect(courante.etat.creature).toMatchObject({ fouille: true, venue: 'bc' });
  });

  it('une nouvelle piste lui rend la fouille', () => {
    const fermees = liaisons(MONDE, { ab: { ouverte: false, bruyante: false } });
    let courante = engager(fermees, alertee(fermees, 'c'), 'prendre', 'boite').partie;
    expect(courante.etat.creature).toMatchObject({ piece: 'b', fouille: true });
    // Il ouvre la porte bruyante depuis A : un bruit, une piste, plus de fouille déjà faite.
    const bruyante = liaisons(MONDE, { ab: { ouverte: false, bruyante: true } });
    courante = { ...courante, etat: { ...courante.etat } };
    courante = engager(bruyante, courante, 'ouvrir', 'salle_b').partie;
    expect(courante.etat.creature).toMatchObject({ piece: 'a' });
    expect(courante.etat.creature?.fouille).toBeUndefined();
  });
});
