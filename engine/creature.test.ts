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
    const depart = partie();
    const avant = JSON.stringify(depart);
    for (let fois = 0; fois < 10; fois++) {
      const observation = observer(MONDE, depart.etat);
      for (const choix of observation.menu) {
        apercu(MONDE, depart, choix.commande);
        if (choix.action === 'regarder') jouer(MONDE, depart, choix.commande);
      }
    }
    expect(JSON.stringify(depart)).toBe(avant);
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
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: 'a', contact: false });
  });

  it('T-07 : le chemin du son praticable en partie, elle rejoint le côté accessible de la séparation étroite', () => {
    // Créature en D : le son de A lui arrive par la grille puis la porte C–D ; seule C–D lui est praticable.
    const monde = liaisons({ ...MONDE, creature: { piece: 'd' } }, { bc: { ouverte: false } });
    const { partie: fin } = suite(monde, partie(monde), [
      ['ouvrir', 'porte_ab'],
      ['prendre', 'boite'],
      ['poser', 'boite'],
    ]);
    expect(fin.etat.creature).toEqual({ piece: 'c', indice: 'a', contact: false });
  });

  it('l’origine perçue est poursuivie plus tard, dès qu’une voie s’ouvre, sans nouveau son', () => {
    const monde = liaisons(MONDE, { bc: { ouverte: false } });
    const coincee = suite(monde, partie(monde), [['ouvrir', 'porte_ab']]).partie;
    expect(coincee.etat.creature).toEqual({ piece: 'c', indice: 'a', contact: false });
    // Le passager ouvre B–C depuis B (geste discret) : la créature reprend la poursuite vers A, par B.
    const { partie: fin, evenements } = suite(monde, coincee, [
      ['aller', 'salle_b'],
      ['ouvrir', 'porte_bc'],
    ]);
    expect(types(evenements[1] ?? [])).toEqual(['passage_ouvert', 'creature_entre', 'premier_contact']);
    expect(fin.etat.creature).toEqual({ piece: 'b', indice: 'a', contact: true });
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
    const reponse = reagir(MONDE, ensemble, [{ piece: 'c', intensite: 'fort' }]);
    expect(reponse.etat.creature).toEqual({ piece: 'a', indice: null, contact: true });
    expect(types(reponse.evenements)).toEqual(['menace']);
  });

  it('T-09 : sans perception, la nouvelle position du passager ne guide pas la créature', () => {
    const monde = liaisons(MONDE, { ab: { ouverte: true, bruyante: false } });
    const vue = suite(monde, partie(monde), [['aller', 'salle_b'], ['aller', 'salle_c']]).partie;
    expect(vue.etat.creature).toMatchObject({ piece: 'c', contact: true });
    // Il quitte la pièce par deux chemins différents ; elle ne le voit plus et ne sait pas où il est allé.
    const parB = suite(monde, vue, [['aller', 'salle_b'], ['aller', 'salle_a']]).partie;
    const parD = suite(monde, vue, [['aller', 'salle_d']]).partie;
    expect(parB.etat.creature).toEqual({ piece: 'c', indice: null, contact: true });
    expect(parD.etat.creature).toEqual({ piece: 'c', indice: null, contact: true });
  });

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
  it('deux mondes identiques pour le passager donnent la même observation, tant que la créature n’est pas perçue', () => {
    const sans: DefMonde = { ...MONDE, creature: undefined };
    const gestes = [['prendre', 'boite'], ['poser', 'boite']] as const;
    const a = suite(MONDE, partie(), gestes);
    const b = suite(sans, partie(sans), gestes);
    expect(observer(MONDE, a.partie.etat)).toEqual(observer(sans, b.partie.etat));
    expect(a.evenements).toEqual(b.evenements);
    expect(observer(MONDE, a.partie.etat).creatureVisible).toBe(false);
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
