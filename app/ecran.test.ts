import { CATALOGUE, empreinteEtat, jouer, nouvellePartie, observer, type OptionMenu, type Partie } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, nomDe, raconter, type EntreeMonde } from '../content';
import {
  composer,
  composerDock,
  ECART_BULLE,
  MARGE_BULLE,
  nomDestination,
  nomPuce,
  placerBulle,
  rappelDe,
  rappelRepris,
  texteRappel,
  type Dock,
} from './ecran';
import { consulter } from './jeu';

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

describe('bulles de composition (12 §3.5 à §3.7)', () => {
  it('chaque puce : sa consultation devient la fiche, ses actions engageantes les lignes, rien ne se perd', () => {
    for (const partie of atteignables()) {
      const dock = composerDock(observer(monde, partie.etat));
      for (const groupe of [...dock.piece, ...dock.inventaire]) {
        const { fiche, actions } = composer(groupe);
        expect(fiche?.action).toBe('regarder');
        expect(actions.every((option) => CATALOGUE[option.action].engage)).toBe(true);
        expect(new Set([fiche, ...actions])).toEqual(new Set(groupe.options));
      }
    }
  });

  it('une ligne envoie la commande structurée du menu moteur, celle que la CLI numérote et accepte (C-01 A-03, A-05)', () => {
    for (const partie of atteignables()) {
      const observation = observer(monde, partie.etat);
      const dock = composerDock(observation);
      for (const groupe of [...dock.piece, ...dock.inventaire]) {
        for (const option of composer(groupe).actions) {
          expect(observation.menu).toContain(option);
          expect(option.commande).toEqual({ action: option.action, cible: groupe.cible.id });
        }
      }
    }
  });

  it('l’inventaire liste exactement les objets portés, chacun avec sa composition', () => {
    for (const partie of atteignables()) {
      const observation = observer(monde, partie.etat);
      const { inventaire } = composerDock(observation);
      expect(inventaire.map((groupe) => groupe.cible)).toEqual(observation.inventaire);
      for (const groupe of inventaire) expect(composer(groupe).fiche).toBeDefined();
    }
  });

  it('ouvrir et relire dix fois chaque fiche ne change ni l’état, ni le compteur, ni les dés (C-01 A-01)', () => {
    for (const partie of atteignables()) {
      const avant = { empreinte: empreinteEtat(partie.etat), json: JSON.stringify(partie) };
      const dock = composerDock(observer(monde, partie.etat));
      const fiches = [...dock.piece, ...dock.inventaire].map((groupe) => composer(groupe).fiche);
      for (let fois = 0; fois < 10; fois++) {
        for (const fiche of fiches) {
          if (fiche !== undefined) expect(consulter({ monde, textes }, partie, fiche)).toHaveLength(1);
        }
      }
      expect(empreinteEtat(partie.etat)).toBe(avant.empreinte);
      expect(JSON.stringify(partie)).toBe(avant.json);
    }
  });

  it('une option qui engage le personnage n’est jamais lue comme une fiche', () => {
    const prendre = optionDe(depart(), 'prendre', 'carnet');
    expect(() => consulter({ monde, textes }, depart(), prendre)).toThrow(/engage le personnage/);
  });
});

describe('placement d’une bulle ancrée (12 §3.5)', () => {
  const bulle = { gauche: MARGE_BULLE, largeur: 358, hauteur: 200 };
  const ecran = 844;

  it('au-dessus de la puce quand elle y tient, flèche sur le centre de la puce', () => {
    const place = placerBulle({ haut: 600, bas: 650, centre: 100 }, bulle, ecran);
    expect(place).toEqual({ cote: 'dessus', bord: ecran - 600 + ECART_BULLE, hauteurMax: 600 - ECART_BULLE - MARGE_BULLE, fleche: 100 - MARGE_BULLE });
  });

  it('dessous si la place manque au-dessus mais suffit dessous', () => {
    const place = placerBulle({ haut: 150, bas: 200, centre: 300 }, bulle, ecran);
    expect(place.cote).toBe('dessous');
    expect(place.bord).toBe(200 + ECART_BULLE);
    expect(place.hauteurMax).toBe(ecran - 200 - ECART_BULLE - MARGE_BULLE);
  });

  it('trop haute des deux côtés : du côté le plus grand, hauteur bornée, elle défile ; jamais hors de l’écran', () => {
    for (const haut of [0, 120, 300, 422, 500, 700, 790]) {
      const ancre = { haut, bas: haut + 50, centre: 200 };
      const place = placerBulle(ancre, { ...bulle, hauteur: 2000 }, ecran);
      const debut = place.cote === 'dessus' ? ecran - place.bord - place.hauteurMax : place.bord;
      const fin = debut + place.hauteurMax;
      expect(debut).toBeGreaterThanOrEqual(MARGE_BULLE);
      expect(fin).toBeLessThanOrEqual(ecran - MARGE_BULLE);
      expect(place.cote === 'dessus' ? fin <= ancre.haut : debut >= ancre.bas).toBe(true);
    }
  });

  it('la flèche reste sur la bulle, même pour une puce collée au bord', () => {
    expect(placerBulle({ haut: 600, bas: 650, centre: 0 }, bulle, ecran).fleche).toBe(ECART_BULLE);
    expect(placerBulle({ haut: 600, bas: 650, centre: 400 }, bulle, ecran).fleche).toBe(bulle.largeur - ECART_BULLE);
  });
});
