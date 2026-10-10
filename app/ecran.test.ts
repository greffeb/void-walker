import { jouer, nouvellePartie, observer, type OptionMenu, type Partie } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, nomDe, raconter, type EntreeMonde } from '../content';
import { composerDock, nomDestination, nomPuce, rappelDe, rappelRepris, texteRappel, type Dock } from './ecran';

const entree = MONDES[MONDE_PAR_DEFAUT] as EntreeMonde;
const { monde, textes } = entree;
const depart = (): Partie => nouvellePartie(monde, { version: 'ecran', graine: 3 });

function placees(dock: Dock): OptionMenu[] {
  return [
    ...dock.piece.flatMap((groupe) => groupe.options),
    ...(dock.autour === undefined ? [] : [dock.autour]),
    ...dock.deplacements,
    ...dock.inventaire.flatMap((groupe) => groupe.options),
  ];
}

/** Une partie par état atteignable du monde de test. */
function atteignables(): Partie[] {
  const vus = new Set<string>();
  const parties: Partie[] = [];
  let frontiere = [depart()];
  while (frontiere.length > 0) {
    const suivante: Partie[] = [];
    for (const partie of frontiere) {
      const cle = JSON.stringify({ ...partie.etat, actions: 0, generateur: null });
      if (vus.has(cle)) continue;
      vus.add(cle);
      parties.push(partie);
      for (const option of observer(monde, partie.etat).menu) {
        const resultat = jouer(monde, partie, option.commande);
        if (resultat.type === 'engagee') suivante.push(resultat.partie);
      }
    }
    frontiere = suivante;
  }
  return parties;
}

function optionDe(partie: Partie, action: string, cible: string): OptionMenu {
  const option = observer(monde, partie.etat).menu.find((choix) => choix.action === action && choix.cible.nom === cible);
  if (option === undefined) throw new Error(`Option ${action} ${cible} absente.`);
  return option;
}

describe('écran de jeu : dock et rappel (12 §3.3, §3.4)', () => {
  it('chaque option du menu moteur a une seule place à l’écran, dans tous les états atteignables', () => {
    const parties = atteignables();
    expect(parties.length).toBeGreaterThan(4);
    for (const partie of parties) {
      const observation = observer(monde, partie.etat);
      const options = placees(composerDock(observation));
      expect(options).toHaveLength(observation.menu.length);
      expect(new Set(options)).toEqual(new Set(observation.menu));
    }
  });

  it('départ : puces du carnet et de la porte, regard sur la pièce, déplacement indisponible, rien en main', () => {
    const dock = composerDock(observer(monde, depart().etat));
    expect(dock.piece.map((groupe) => nomPuce(textes, groupe.cible))).toEqual(['Carnet', 'Porte de l’atelier']);
    expect(dock.piece.map((groupe) => groupe.options.map((option) => textes.verbes[option.action]))).toEqual([
      ['Regarder', 'Prendre'],
      ['Regarder', 'Ouvrir'],
    ]);
    expect(dock.autour?.cible.sorte).toBe('piece');
    expect(dock.deplacements.map((option) => [nomDestination(textes, option), option.disponible])).toEqual([['atelier', false]]);
    expect(dock.inventaire).toEqual([]);
  });

  it('un nom par chose : puce, rappel et récit nomment la même chose (NP-04)', () => {
    let partie = depart();
    for (const etape of entree.parcours.etapes) {
      const option = optionDe(partie, etape.action, etape.cible);
      const resultat = jouer(monde, partie, option.commande);
      const recit = raconter(textes, resultat).join(' ').toLowerCase();
      const rappel = texteRappel(textes, rappelDe(option));
      if (option.action === 'aller') {
        expect(rappel).toEqual({ texte: `Aller vers · ${nomDestination(textes, option)}`, capitales: true });
        expect(recit).toContain(nomDestination(textes, option));
      } else {
        const nom = nomDe(textes, option.cible).texte;
        expect(nomPuce(textes, option.cible).toLowerCase()).toBe(nom);
        expect(rappel).toEqual({ texte: `${nomPuce(textes, option.cible)} · ${textes.verbes[option.action]}`, capitales: false });
        expect(recit).toContain(nom);
      }
      if (resultat.type !== 'engagee') throw new Error(`Étape non engagée : ${etape.action}.`);
      partie = resultat.partie;
    }
  });

  it('rappel : « Regarder autour de vous » pour la pièce, objet puis action sinon', () => {
    const dock = composerDock(observer(monde, depart().etat));
    if (dock.autour === undefined) throw new Error('Regard sur la pièce absent.');
    expect(texteRappel(textes, rappelDe(dock.autour))).toEqual({ texte: 'Regarder autour de vous', capitales: true });
    expect(texteRappel(textes, rappelDe(optionDe(depart(), 'prendre', 'carnet')))).toEqual({ texte: 'Carnet · Prendre', capitales: false });
  });

  it('reprise : même rappel que juste après l’action ; aucun avant la première', () => {
    let partie = depart();
    expect(rappelRepris(partie, observer(monde, partie.etat))).toBeNull();
    for (const etape of entree.parcours.etapes) {
      const option = optionDe(partie, etape.action, etape.cible);
      const resultat = jouer(monde, partie, option.commande);
      if (resultat.type !== 'engagee') throw new Error(`Étape non engagée : ${etape.action}.`);
      partie = resultat.partie;
      const repris = rappelRepris(partie, observer(monde, partie.etat));
      expect(repris === null ? null : texteRappel(textes, repris)).toEqual(texteRappel(textes, rappelDe(option)));
    }
  });
});
