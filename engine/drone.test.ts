import { apercu, exporter, jouer, nouvellePartie, rejouer, type Partie } from './partie';
import { carte } from './carte';
import { observer } from './observation';
import { sortiePossible } from './sortie';
import { idPublic, validerMonde, type DefMonde } from './monde';
import { avecDroneEn, cheminDrone, placesDuDrone, renverserDrone, sonsDrones } from './drone';

// Noms et identifiants sans rapport avec le morceau : seules les qualités font règle.
// a (départ, drone) ─ b ─ c ─ d (obstacle z en travers de df) ─ f ; c ─ e (créature) ; b ┄ d fermée ; a ≈ g (vide) ; b ▣ h (cloison
// que déverrouille k, posé en f, au-delà de l'obstacle).
const MONDE: DefMonde = {
  id: 'essai-drone', depart: 'a',
  pieces: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id, nom: id })),
  liaisons: [
    { id: 'ab', nom: 'porte', entre: ['a', 'b'], ouverte: true },
    { id: 'bc', nom: 'porte', entre: ['b', 'c'], ouverte: true },
    { id: 'cd', nom: 'porte', entre: ['c', 'd'], ouverte: true },
    { id: 'ce', nom: 'porte', entre: ['c', 'e'], ouverte: true },
    { id: 'bd', nom: 'porte', entre: ['b', 'd'], ouverte: false },
    { id: 'df', nom: 'porte', entre: ['d', 'f'], ouverte: true },
    { id: 'ag', nom: 'vide', entre: ['a', 'g'], ouverte: true, gouffre: true },
    { id: 'bh', nom: 'porte', entre: ['b', 'h'], ouverte: false, verrouillee: true },
  ],
  positions: [
    { id: 'barre', nom: 'barre', piece: 'd' },
    { id: 'range', nom: 'range', piece: 'd' },
  ],
  objets: [
    { id: 'x', nom: 'x', piece: 'a', portable: false, drone: { obstacle: 'z' } },
    { id: 'z', nom: 'z', piece: 'd', portable: false, deplacable: true, position: 'barre', obstacle: { passage: 'df', rangement: 'range' } },
    { id: 'k', nom: 'k', piece: 'f', portable: false, deverrouille: 'bh' },
  ],
  creature: { piece: 'e' },
};
const avecObjets = (objets: DefMonde['objets']): DefMonde => ({ ...MONDE, objets });

describe('chemin et places du drone', () => {
  it('valide le monde', () => {
    expect(validerMonde(MONDE)).toEqual([]);
  });
  it('le chemin le plus court passe par les portes fermées, jamais par le vide', () => {
    expect(cheminDrone(MONDE, 'x', 'a')).toEqual(['ab', 'bd']);
    expect(cheminDrone(MONDE, 'x', 'e')).toEqual(['ce', 'cd']);
    expect(cheminDrone(MONDE, 'x', 'd')).toEqual([]);
    expect(cheminDrone(MONDE, 'x', 'g')).toBeNull();
  });
  it('places : avant l’obstacle, sans vide ni cloison qu’on n’ouvre qu’au-delà', () => {
    expect(placesDuDrone(MONDE, 'x')).toEqual(['a', 'b', 'c', 'e']);
  });
  it('une cloison qu’on déverrouille avant l’obstacle ouvre une place', () => {
    const monde = avecObjets(MONDE.objets.map((objet) => (objet.id === 'k' ? { ...objet, piece: 'c' } : objet)));
    expect(placesDuDrone(monde, 'x')).toEqual(['a', 'b', 'c', 'e', 'h']);
  });
  it('avecDroneEn déplace le drone sans position', () => {
    expect(avecDroneEn(MONDE, 'x', 'e').objets.find((objet) => objet.id === 'x')?.piece).toBe('e');
  });
  it('diagnostics des qualités', () => {
    const [drone, obstacle, commande] = MONDE.objets as [DefMonde['objets'][number], DefMonde['objets'][number], DefMonde['objets'][number]];
    expect(validerMonde(avecObjets([{ ...drone, drone: { obstacle: 'k' } }, obstacle, commande]))).toEqual(
      expect.arrayContaining(['x : obstacle du drone inconnu ou sans qualité.', 'z : obstacle sans drone.']),
    );
    expect(validerMonde(avecObjets([{ ...drone, piece: 'g' }, obstacle, commande]))).toEqual(expect.arrayContaining(['x : aucun chemin de drone vers son obstacle.']));
    expect(validerMonde(avecObjets([{ ...drone, portable: true }, obstacle, commande]))).toEqual(expect.arrayContaining(['x : dispositif de maintien portable.']));
  });
});

const debut = (monde = MONDE): Partie => nouvellePartie(monde, { version: 'test-drone', graine: 203 });
const commande = (action: string, cible: string, parametre?: string) => ({
  action, cible: idPublic(MONDE.id, cible), ...(parametre === undefined ? {} : { parametre: idPublic(MONDE.id, parametre) }),
});
function pas(partie: Partie, action: string, cible: string, parametre?: string, monde = MONDE): Partie {
  const resultat = jouer(monde, partie, commande(action, cible, parametre));
  expect(resultat.type, `${action} ${cible}`).toBe('engagee');
  return resultat.partie;
}
type Geste = readonly [string, string, string?];
function suite(partie: Partie, gestes: readonly Geste[], monde = MONDE): Partie {
  return gestes.reduce((courante, [action, cible, parametre]) => pas(courante, action, cible, parametre, monde), partie);
}
/** Palier vu, créature isolée derrière `ce`, retour au drone ; `bd` ouverte si `raccourci`. */
function prete(raccourci: boolean, monde = MONDE): Partie {
  const retour: Geste[] = raccourci ? [['ouvrir', 'bd'], ['aller', 'bd']] : [['aller', 'cd'], ['aller', 'bc']];
  return suite(debut(monde), [['aller', 'ab'], ['aller', 'bc'], ['fermer', 'ce'], ['aller', 'cd'], ...retour, ['aller', 'ab']], monde);
}
const ou = (partie: Partie) => [partie.etat.drones?.phases.x, partie.etat.objets.x?.type === 'piece' ? partie.etat.objets.x.piece : null];
const proposeEnvoyer = (partie: Partie) => observer(MONDE, partie.etat).menu.some((option) => option.action === 'envoyer');

describe('le drone roule seul et tire l’obstacle', () => {
  it('envoyer absent tant que le palier n’a pas été vu', () => {
    expect(proposeEnvoyer(debut())).toBe(false);
    expect(jouer(MONDE, debut(), commande('envoyer', 'x')).type).toBe('refus');
    expect(proposeEnvoyer(prete(false))).toBe(true);
  });
  it('deux actions par pièce, puis traction et passage libre', () => {
    let partie = pas(prete(true), 'envoyer', 'x');
    expect(ou(partie)).toEqual(['roule', 'a']);
    const etapes: unknown[] = [];
    for (let n = 0; n < 4; n++) {
      partie = pas(partie, 'attendre', 'a');
      etapes.push(ou(partie));
    }
    expect(etapes).toEqual([['trajet', 'b'], ['roule', 'b'], ['traction', 'd'], ['termine', 'd']]);
    expect(partie.etat.objets.z).toEqual({ type: 'piece', piece: 'd', position: 'range' });
    expect(partie.enregistrement.actions.every((action) => action.tirages.length === 0)).toBe(true);
  });
  it('attend devant une porte fermée, sans bruit, et repart quand on l’ouvre', () => {
    let partie = suite(prete(false), [['envoyer', 'x'], ['attendre', 'a'], ['attendre', 'a']]);
    expect(ou(partie)).toEqual(['trajet', 'b']);
    expect(sonsDrones(MONDE, partie.etat)).toEqual([]);
    partie = suite(partie, [['aller', 'ab'], ['ouvrir', 'bd']]);
    expect(ou(partie)).toEqual(['roule', 'b']);
    expect(sonsDrones(MONDE, partie.etat)).toHaveLength(1);
  });
  it('porte refermée pendant le roulement : il reste et attend', () => {
    const partie = suite(prete(false), [['envoyer', 'x'], ['attendre', 'a'], ['aller', 'ab'], ['ouvrir', 'bd'], ['fermer', 'bd']]);
    expect(ou(partie)).toEqual(['trajet', 'b']);
  });
  it('renversé pendant la traction, l’obstacle ne bouge pas ; redressé et relancé, il le range', () => {
    let partie = suite(prete(true), [['envoyer', 'x'], ['attendre', 'a'], ['attendre', 'a'], ['attendre', 'a']]);
    expect(ou(partie)).toEqual(['traction', 'd']);
    partie = { ...partie, etat: renverserDrone(MONDE, partie.etat, 'x').etat };
    partie = suite(partie, [['aller', 'ab'], ['aller', 'bd']]);
    expect(ou(partie)).toEqual(['deraille', 'd']);
    expect(partie.etat.objets.z).toEqual({ type: 'piece', piece: 'd', position: 'barre' });
    partie = pas(partie, 'replacer', 'x');
    expect(ou(partie)).toEqual(['a_rearmer', 'd']);
    partie = pas(partie, 'rearmer', 'x');
    expect(ou(partie)).toEqual(['traction', 'd']);
    partie = pas(partie, 'attendre', 'd');
    expect(ou(partie)).toEqual(['termine', 'd']);
    expect(partie.etat.objets.z).toEqual({ type: 'piece', piece: 'd', position: 'range' });
  });
  it('arrêter puis relancer garde sa place et son trajet', () => {
    let partie = suite(prete(true), [['envoyer', 'x'], ['arreter_drone', 'x']]);
    expect(ou(partie)).toEqual(['arrete', 'a']);
    expect(sonsDrones(MONDE, partie.etat)).toEqual([]);
    partie = pas(partie, 'attendre', 'a');
    expect(ou(partie)).toEqual(['arrete', 'a']);
    partie = pas(partie, 'reprendre_drone', 'x');
    expect(ou(partie)).toEqual(['roule', 'a']);
  });
  it('l’obstacle est trop lourd pour la main', () => {
    const partie = suite(debut(), [['aller', 'ab'], ['aller', 'bc'], ['aller', 'cd']]);
    const refus = jouer(MONDE, partie, commande('deplacer', 'z', 'range'));
    expect(refus).toMatchObject({ type: 'refus', raison: 'trop_lourd' });
    expect(refus.partie).toBe(partie);
    expect(jouer(MONDE, partie, commande('aller', 'df'))).toMatchObject({ type: 'refus', raison: 'encombre_par_obstacle' });
  });
  it('rejoue exactement au milieu d’un trajet', () => {
    const partie = suite(prete(true), [['envoyer', 'x'], ['attendre', 'a']]);
    expect(rejouer(MONDE, exporter(MONDE, partie), 'test-drone').partie).toEqual(partie);
  });
  it('le palier dit que l’obstacle barre le passage, puis qu’il est dégagé', () => {
    let partie = suite(prete(true), [['envoyer', 'x'], ['aller', 'ab'], ['aller', 'bd']]);
    const obstacles = () => observer(MONDE, partie.etat).obstacles?.map(({ objet, passage, range }) => [objet.id, passage.id, range]);
    expect(obstacles()).toEqual([[idPublic(MONDE.id, 'z'), idPublic(MONDE.id, 'df'), false]]);
    partie = suite(partie, [['attendre', 'd'], ['attendre', 'd']]);
    expect(ou(partie)).toEqual(['termine', 'd']);
    expect(obstacles()).toEqual([[idPublic(MONDE.id, 'z'), idPublic(MONDE.id, 'df'), true]]);
    expect(observer(MONDE, debut().etat).obstacles).toEqual([]);
  });
  it('la carte suit le drone envoyé hors de vue, sans double ni souvenir périmé', () => {
    const surCarte = (partie: Partie) => carte(MONDE, partie.etat).pieces.filter((piece) => piece.objets.some((objet) => objet.drone === true)).map((piece) => piece.piece.id);
    expect(surCarte(debut())).toEqual([idPublic(MONDE.id, 'a')]);
    let partie = suite(prete(true), [['envoyer', 'x'], ['aller', 'ab'], ['aller', 'bc']]);
    expect(ou(partie)).toEqual(['roule', 'b']);
    partie = pas(partie, 'attendre', 'c');
    expect(ou(partie)).toEqual(['traction', 'd']);
    expect(surCarte(partie)).toEqual([idPublic(MONDE.id, 'd')]);
    const renverse: Partie = { ...partie, etat: renverserDrone(MONDE, partie.etat, 'x').etat };
    expect(surCarte(renverse)).toEqual([idPublic(MONDE.id, 'd')]);
    partie = pas(partie, 'attendre', 'c');
    expect(ou(partie)).toEqual(['termine', 'd']);
    expect(surCarte(partie)).toEqual([idPublic(MONDE.id, 'd')]);
  });
  it('plus aucune sortie : un drone renversé derrière une porte qu’on peut ouvrir laisse la sortie, pas un chemin condamné', () => {
    const avecCapsule = (base: DefMonde): DefMonde => ({ ...base,
      pieces: [...base.pieces, { id: 'i', nom: 'i', sousPosition: true }],
      liaisons: [...base.liaisons, { id: 'fi', nom: 'porte', entre: ['f', 'i'], ouverte: false }],
      objets: [...base.objets,
        { id: 'capsule', nom: 'capsule', piece: 'f', portable: false, capsule: { interieur: 'i', alimentee: true } },
        { id: 'pupitre', nom: 'pupitre', piece: 'i', portable: false, depart: 'capsule' },
      ],
    });
    const renverse = (monde: DefMonde) => {
      const initiale = debut(monde);
      return { ...initiale.etat, objets: { ...initiale.etat.objets, x: { type: 'piece' as const, piece: 'b' } }, drones: { phases: { x: 'deraille' as const }, bruits: [] } };
    };
    const monde = avecCapsule(MONDE);
    expect(sortiePossible(monde, renverse(monde))).toBe(true);
    // Sans c ─ d, le seul chemin du drone est b ┄ d, qui ne se manœuvre que depuis d : on n'y arrive plus.
    const condamne = avecCapsule({ ...MONDE, liaisons: MONDE.liaisons.filter((liaison) => liaison.id !== 'cd').map((liaison) => (liaison.id === 'bd' ? { ...liaison, manoeuvre: 'd' } : liaison)) });
    expect(sortiePossible(condamne, renverse(condamne))).toBe(false);
  });
  it('le feu n’arrête pas le drone (D-306)', () => {
    const monde: DefMonde = { ...MONDE, pieces: MONDE.pieces.map((piece) => (piece.id === 'b' ? { ...piece, feu: true } : piece)) };
    // Drone déjà en route depuis a ; le passager attend loin du feu, enfermé en e avec la créature partie ailleurs.
    const initiale = debut({ ...monde, creature: { piece: 'f' } });
    const drones = { phases: { x: 'trajet' as const }, bruits: [] };
    let partie: Partie = { ...initiale, etat: { ...initiale.etat, piece: 'e', visitees: ['a', 'd', 'e'], drones, liaisons: { ...initiale.etat.liaisons, bd: true, ce: false } } };
    for (let n = 0; n < 5; n++) partie = pas(partie, 'attendre', 'e', undefined, { ...monde, creature: { piece: 'f' } });
    expect(ou(partie)).toEqual(['termine', 'd']);
  });
  it('aperçus et refus ne coûtent rien', () => {
    const partie = prete(true);
    const avant = structuredClone(partie);
    for (let n = 0; n < 5; n++) {
      expect(apercu(MONDE, partie, commande('envoyer', 'x')).type).toBe('apercu');
      expect(jouer(MONDE, partie, commande('replacer', 'x')).partie).toBe(partie);
    }
    expect(partie).toEqual(avant);
  });
  it('la créature qui l’entend rouler le renverse en route ; le passager à l’abri reste indemne', () => {
    // Créature dans une réserve ouverte sur l'obstacle, comme dans M-12 ; le passager lance le drone et se referme en a.
    const monde: DefMonde = {
      ...MONDE,
      pieces: [...MONDE.pieces, { id: 'r', nom: 'r' }],
      liaisons: [...MONDE.liaisons, { id: 'dr', nom: 'porte', entre: ['d', 'r'], ouverte: true }],
      creature: { piece: 'r' },
    };
    const initiale = debut(monde);
    let partie: Partie = { ...initiale, etat: { ...initiale.etat, visitees: ['a', 'd'], liaisons: { ...initiale.etat.liaisons, bd: true } } };
    partie = suite(partie, [['envoyer', 'x'], ['attendre', 'a'], ['fermer', 'ab']], monde);
    for (let n = 0; n < 6 && partie.etat.drones?.phases.x !== 'deraille'; n++) partie = pas(partie, 'attendre', 'a', undefined, monde);
    expect(partie.etat.drones?.phases.x).toBe('deraille');
    expect(partie.etat.objets.z).toEqual({ type: 'piece', piece: 'd', position: 'barre' });
    expect(partie.etat.sante).toBe('indemne');
  });
});
