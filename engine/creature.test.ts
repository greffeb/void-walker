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
  type Evenement,
  type IdAction,
  type Partie,
} from './index';
import { reagir } from './creature';

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
    (choix) => choix.action === action && choix.disponible && (choix.cible.nom === nom || (choix.cible.sorte === 'passage' && choix.cible.vers.nom === nom)),
  );
  if (option === undefined) throw new Error(`Option ${action} ${nom} absente ou indisponible.`);
  const resultat = jouer(monde, courante, option.commande);
  if (resultat.type !== 'engagee') throw new Error(`${action} ${nom} : ${resultat.type}.`);
  return { partie: resultat.partie, evenements: resultat.evenements };
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

const pieceCreature = (courante: Partie): string | undefined => courante.etat.creature?.piece;

describe('créature : monde et état (C-02 §4.2)', () => {
  it('un monde avec créature est valide ; jamais dans la pièce de départ, jamais dans une pièce inconnue (GP-04)', () => {
    expect(validerMonde(MONDE)).toEqual([]);
    expect(validerMonde(avec({ creature: { piece: 'a' } }))).toContain('Créature dans la pièce de départ (GP-04).');
    expect(validerMonde(avec({ creature: { piece: 'z' } }))).toContain('Créature : pièce inconnue z.');
  });

  it('état de départ : emplacement réel, aucun indice, premier contact pas encore annoncé', () => {
    expect(partie().etat.creature).toEqual({ piece: 'c', indice: null, contact: false });
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
    expect(fin.etat.creature).toMatchObject({ indice: null, contact: true });
  });

  it('une porte fermée bloque le son : la créature ne l’entend pas et ne bouge pas', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false }, ac: { sonAuTravers: false } });
    const { partie: fin, evenements } = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]);
    expect(types(evenements[0] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme']);
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: null, contact: false });
  });

  it('T-07 : son entendu par une grille trop étroite, aucune voie praticable : elle ne passe pas, l’origine perçue est conservée', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false } });
    const { partie: fin } = suite(monde, partie(monde), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: { piece: 'a', par: null }, contact: false });
  });

  it('T-07 : le chemin du son praticable en partie, elle rejoint le côté accessible de la séparation étroite', () => {
    // Créature en D : le son de A lui arrive par la grille puis la porte C–D ; seule C–D lui est praticable.
    const monde = liaisons({ ...MONDE, creature: { piece: 'd' } }, { bc: { ouverte: false } });
    const { partie: fin } = suite(monde, partie(monde), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: { piece: 'a', par: null }, contact: false });
  });

  it('l’origine perçue est poursuivie plus tard, dès qu’une voie s’ouvre, sans nouveau son', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false } });
    const coincee = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]).partie;
    expect(coincee.etat.creature).toEqual({ piece: 'c', indice: { piece: 'a', par: null }, contact: false });
    // Le passager ouvre B–C depuis B (geste discret) : la créature reprend la poursuite vers A, par B.
    const { partie: fin, evenements } = suite(monde, coincee, [
      ['aller', 'salle_b'],
      ['ouvrir', 'porte_bc'],
    ]);
    expect(types(evenements[1] ?? [])).toEqual(['passage_ouvert', 'creature_entre', 'premier_contact']);
    expect(fin.etat.creature).toEqual({ piece: 'b', indice: { piece: 'a', par: null }, contact: true });
  });

  it('premier contact annoncé une seule fois ; ensuite, rester visible attire une menace, jamais le jour même de l’arrivée', () => {
    const contact = suite(MONDE, partie(), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
    ]).partie;
    const { partie: fin, evenements } = suite(MONDE, contact, [
      ['poser', 'boite'],
      ['aller', 'salle_b'],
      ['aller', 'salle_a'],
    ]);
    expect(types(evenements[0] ?? [])).toEqual(['objet_pose', 'menace']);
    expect(types(evenements[1] ?? [])).toEqual(['deplacement', 'piece_decouverte']);
    // Revenir dans sa pièce : vue de nouveau, menace immédiate, sans second avertissement (C-03 §4.4).
    expect(types(evenements[2] ?? [])).toEqual(['deplacement', 'menace']);
    expect(pieceCreature(fin)).toBe('a');
  });

  it('arriver dans la pièce du passager et l’attaquer ne tiennent pas dans la même réaction (C-03 §4.3)', () => {
    // Contact en A, le passager passe en B sans être suivi, referme puis rouvre bruyamment A–B depuis B.
    const { partie: fin, evenements } = suite(MONDE, partie(), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['aller', 'salle_b'],
      ['fermer', 'porte_ab'],
      ['ouvrir', 'porte_ab'],
      ['prendre', 'cle'],
    ]);
    expect(types(evenements[2] ?? [])).toEqual(['deplacement', 'piece_decouverte']);
    expect(types(evenements[4] ?? [])).toEqual(['passage_ouvert', 'bruit_mecanisme', 'creature_entre']);
    expect(types(evenements[5] ?? [])).toEqual(['objet_pris', 'menace']);
    expect(pieceCreature(fin)).toBe('b');
  });

  it('un joueur visible passe avant un son, même plus fort (C-03 §4.2)', () => {
    const depart = partie();
    const ensemble = { ...depart.etat, creature: { piece: 'a', indice: null, contact: true } };
    const reponse = reagir(MONDE, ensemble, [{ piece: 'c', intensite: 'fort' }], 'a', undefined);
    expect(reponse.etat.creature).toEqual({ piece: 'a', indice: null, contact: true });
    expect(types(reponse.evenements)).toEqual(['menace']);
  });

  it('T-09 : elle suit le passage qu’elle l’a vu prendre, pas sa position cachée ; arrivée sur place, sans indice, elle attend', () => {
    const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
    const vue = suite(monde, partie(monde), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    expect(vue.etat.creature).toMatchObject({ piece: 'c', contact: true });
    // Il sort par B puis continue vers A, ou reste en B : elle fait le même pas, vers B, sans savoir où il est.
    const loin = suite(monde, vue, [['aller', 'salle_b'], ['aller', 'salle_a'], ['prendre', 'boite']]);
    const pres = suite(monde, vue, [['aller', 'salle_b'], ['prendre', 'cle']]);
    expect(loin.evenements.map(types)).toEqual([['deplacement'], ['deplacement', 'bruit_creature'], ['objet_pris']]);
    expect(pres.evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre']]);
    expect(loin.partie.etat.creature).toEqual({ piece: 'b', indice: null, contact: true });
    expect(pres.partie.etat.creature).toEqual({ piece: 'b', indice: null, contact: true });
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
    expect(evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre'], ['objet_pose', 'menace']]);
    expect(pieceCreature(fin)).toBe('b');
  });

  it('refermer la porte derrière soi l’arrête, même si un autre chemin existe', () => {
    // Grille élargie et ouverte : C → A → B serait praticable, mais elle ne suit que le passage vu.
    const detour = liaisons(monde, { ac: { etroite: false, ouverte: true } });
    const vue = suite(detour, partie(detour), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    const { partie: fin } = suite(detour, vue, [
      ['aller', 'salle_b'],
      ['fermer', 'porte_bc'],
      ['prendre', 'cle'],
      ['poser', 'cle'],
    ]);
    expect(fin.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'b' }, contact: true });
  });

  it('un passage trop étroit l’arrête : elle ne le suit pas par la grille ni ne fait le tour', () => {
    const { partie: fin } = suite(monde, contact(), [
      ['ouvrir', 'grille_ac'],
      ['aller', 'salle_a'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(pieceCreature(fin)).toBe('c');
  });

  it('deux passages entre les mêmes pièces : elle retient celui qu’il a vraiment pris, quel que soit l’ordre du monde', () => {
    const grille = { id: 'bc2', nom: 'grille_bc', entre: ['b', 'c'] as const, ouverte: true, etroite: true };
    for (const avant of [true, false]) {
      const double: DefMonde = { ...monde, liaisons: avant ? [grille, ...monde.liaisons] : [...monde.liaisons, grille] };
      const vue = suite(double, partie(double), [['aller', 'salle_b'], ['aller', 'porte_bc']]).partie;
      const parPorte = suite(double, vue, [['aller', 'porte_bc'], ['prendre', 'cle']]);
      expect(parPorte.evenements.map(types)).toEqual([['deplacement'], ['objet_pris', 'creature_entre']]);
      const parGrille = suite(double, vue, [['aller', 'grille_bc'], ['prendre', 'cle'], ['poser', 'cle']]);
      expect(parGrille.evenements.map(types)).toEqual([['deplacement'], ['objet_pris'], ['objet_pose']]);
      expect(parGrille.partie.etat.creature).toMatchObject({ piece: 'c', indice: { piece: 'b', par: 'bc2' } });
    }
  });

  it('un son prend le pas sur l’indice de départ (C-03 §4.2)', () => {
    const bruyante = liaisons(monde, { ac: { bruyante: true } });
    const vue = suite(bruyante, partie(bruyante), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    const bloquee = suite(bruyante, vue, [['aller', 'salle_b'], ['fermer', 'porte_bc'], ['aller', 'salle_a']]).partie;
    expect(bloquee.etat.creature).toEqual({ piece: 'c', indice: { piece: 'b', par: 'bc' }, contact: true });
    const fin = suite(bruyante, bloquee, [['ouvrir', 'grille_ac']]).partie;
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: { piece: 'a', par: null }, contact: true });
  });

  it('revenir dans sa pièce efface l’indice de départ : elle le voit, menace', () => {
    const { partie: fin, evenements } = suite(monde, contact(), [['aller', 'salle_b'], ['aller', 'salle_c']]);
    expect(evenements.map(types)).toEqual([['deplacement'], ['deplacement', 'menace']]);
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: null, contact: true });
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
