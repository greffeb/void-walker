import { apercu, CATALOGUE, empreinteEtat, jouer, nouvellePartie, observer, type DefMonde, type OptionMenu, type Partie } from '../engine';
import { MONDES, nomDe, raconter, type EntreeMonde } from '../content';
import {
  composer,
  composerDock,
  ECART_BULLE,
  etapeBulle,
  filBulle,
  libelleLigne,
  lignesActions,
  MARGE_BULLE,
  nomDestination,
  nomParametre,
  nomPuce,
  passagesEntendus,
  passagesOuverts,
  placerBulle,
  precedente,
  rappelDe,
  rappelRepris,
  texteRappel,
  unToucher,
  type Dock,
  type Groupe,
} from './ecran';
import { consulter, prevoir } from './jeu';

const entree = MONDES['monde-test'] as EntreeMonde;
const { monde, textes } = entree;
const etapes = entree.parcours[0]?.etapes ?? [];
const depart = (): Partie => nouvellePartie(monde, { version: 'ecran', graine: 3 });

/** Zone sans gravité réduite (engine/morceaux.test.ts) : ouest ══ zone (gravité coupée) ══ est. */
const GRAVITE: DefMonde = {
  id: 'ecran-gravite',
  depart: 'ouest',
  pieces: [
    { id: 'ouest', nom: 'ouest' },
    { id: 'zone', nom: 'zone', gravite: 'coupee' },
    { id: 'est', nom: 'est' },
  ],
  liaisons: [
    { id: 'oz', nom: 'porte_oz', entre: ['ouest', 'zone'], ouverte: true },
    { id: 'ze', nom: 'porte_ze', entre: ['zone', 'est'], ouverte: true },
  ],
  objets: [{ id: 'inter-o', nom: 'interrupteur_o', piece: 'ouest', portable: false, gravite: 'zone' }],
};

function placees(dock: Dock): OptionMenu[] {
  return [
    ...dock.piece.flatMap((groupe) => groupe.options),
    ...(dock.autour === undefined ? [] : [dock.autour]),
    ...(dock.attendre === undefined ? [] : [dock.attendre]),
    ...dock.deplacements.flatMap((deplacement) => deplacement.options),
    ...dock.inventaire.flatMap((groupe) => groupe.options),
  ];
}

let explores: Partie[] | undefined;

/** Une partie par état atteignable du monde de test, calculées une seule fois pour le fichier. */
function atteignables(): Partie[] {
  if (explores !== undefined) return explores;
  const vus = new Set<string>();
  const parties: Partie[] = [];
  let frontiere = [depart()];
  while (frontiere.length > 0) {
    const suivante: Partie[] = [];
    for (const partie of frontiere) {
      const cle = JSON.stringify({ ...partie.etat, actions: 0, generateur: null, memoire: null });
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
  explores = parties;
  return parties;
}

function optionDe(partie: Partie, action: string, cible: string): OptionMenu {
  const option = observer(monde, partie.etat).menu.find((choix) => choix.action === action && choix.cible.nom === cible);
  if (option === undefined) throw new Error(`Option ${action} ${cible} absente.`);
  return option;
}

describe('écran de jeu : dock et rappel (12 §3.3, §3.4)', () => {
  it('chaque option du menu moteur a une seule place à l’écran, dans tous les états atteignables', { timeout: 30_000 }, () => {
    const parties = atteignables();
    expect(parties.length).toBeGreaterThan(4);
    const ecarts: string[] = [];
    for (const partie of parties) {
      const observation = observer(monde, partie.etat);
      const options = placees(composerDock(observation, passagesOuverts(partie)));
      if (options.length !== observation.menu.length || !observation.menu.every((option) => options.includes(option))) {
        ecarts.push(`${observation.piece.nom} : ${options.length} places pour ${observation.menu.length} options`);
      }
    }
    expect([...new Set(ecarts)]).toEqual([]);
  });

  it('départ : puce du carnet, regard sur la pièce, une ligne par salle voisine avec sa porte, rien en main (D-267)', () => {
    const dock = composerDock(observer(monde, depart().etat));
    expect(dock.piece.map((groupe) => nomPuce(textes, groupe.cible))).toEqual(['Carnet']);
    expect(dock.piece.map((groupe) => groupe.options.map((option) => textes.verbes[option.action]))).toEqual([['Regarder', 'Prendre']]);
    expect(dock.autour).toMatchObject({ action: 'regarder', cible: { sorte: 'piece' } });
    expect(dock.attendre).toMatchObject({ action: 'attendre', cible: { sorte: 'piece' }, disponible: true });
    // Le nom joue le déplacement, même impossible (le moteur le refuse sans coût) ; la commande ouvre la porte.
    expect(dock.deplacements.map(({ passer, manoeuvre, reperes }) => [nomDestination(textes, passer), passer.action, passer.disponible, manoeuvre?.action, reperes])).toEqual([
      ['atelier', 'aller', false, 'ouvrir', []],
      ['soute', 'aller', false, 'ouvrir', []],
    ]);
    expect(dock.inventaire).toEqual([]);
  });

  it('porte ouverte : le nom fait passer, la commande la referme ; la créature entendue derrière se signale jusqu’à l’action suivante (D-267)', () => {
    const ouverte = jouer(monde, depart(), optionDe(depart(), 'ouvrir', 'porte').commande);
    if (ouverte.type !== 'engagee') throw new Error('Porte non ouverte.');
    const ligne = (partie: Partie) =>
      composerDock(observer(monde, partie.etat), passagesOuverts(partie), passagesEntendus(partie)).deplacements.find((deplacement) => deplacement.cible.nom === 'porte');
    expect(passagesEntendus(ouverte.partie)).toEqual([ligne(ouverte.partie)?.cible.id]);
    expect(ligne(ouverte.partie)).toMatchObject({ passer: { action: 'aller', disponible: true }, manoeuvre: { action: 'fermer' }, reperes: ['bruit'] });
    // L'action suivante (prendre le carnet, sans bruit derrière la porte) efface le repère.
    const suite = jouer(monde, ouverte.partie, optionDe(ouverte.partie, 'prendre', 'carnet').commande);
    if (suite.type !== 'engagee') throw new Error('Carnet non pris.');
    expect(suite.partie.derniers.some((evenement) => evenement.type === 'bruit_creature')).toBe(false);
    expect(ligne(suite.partie)?.reperes).toEqual([]);
  });

  it('repère BRUIT : un net entendu en attendant, un toujours et le bruit proche le posent, un vague non', () => {
    const depart0 = depart();
    const passage = observer(monde, depart0.etat).passages[0];
    if (passage === undefined) throw new Error('Un passage attendu.');
    const avec = (...derniers: Partie['derniers']) => passagesEntendus({ ...depart0, derniers });
    expect(avec({ type: 'ecoute', passage, entendu: 'net' })).toEqual([passage.id]);
    expect(avec({ type: 'ecoute', passage, entendu: 'toujours' })).toEqual([passage.id]);
    expect(avec({ type: 'bruit_proche', passage })).toEqual([passage.id]);
    expect(avec({ type: 'ecoute', passage, entendu: 'vague' })).toEqual([]);
    expect(avec({ type: 'ecoute', passage, entendu: 'plus_rien' })).toEqual([]);
  });

  it('repères : voyant de vide et flammes vues par la porte ouverte, dans l’ordre VIDE, FEU, BRUIT (D-267)', () => {
    const observation = observer(monde, depart().etat);
    const [premier, second] = observation.passages;
    if (premier === undefined || second === undefined) throw new Error('Deux passages attendus.');
    const passages = [{ ...premier, vide: true }, { ...second, ouvert: true, feu: true }];
    const dock = composerDock({ ...observation, passages }, [], [premier.id]);
    expect(dock.deplacements.map((deplacement) => deplacement.reperes)).toEqual([['vide', 'bruit'], ['feu']]);
  });

  it('sans gravité : loin du passage le nom fait dériver, au bord il fait passer (D-237, D-267)', () => {
    const avant = nouvellePartie(GRAVITE, { version: 'ecran', graine: 7 });
    const entrer = observer(GRAVITE, avant.etat).menu.find((option) => option.action === 'aller' && option.cible.sorte === 'passage' && option.cible.vers?.nom === 'zone');
    if (entrer === undefined) throw new Error('Entrée de la zone absente.');
    const dedans = jouer(GRAVITE, avant, entrer.commande);
    if (dedans.type !== 'engagee') throw new Error('Zone non atteinte.');
    const passer = (partie: Partie) =>
      Object.fromEntries(composerDock(observer(GRAVITE, partie.etat)).deplacements.map((deplacement) => [deplacement.cible.vers?.nom, deplacement.passer.action]));
    expect(passer(dedans.partie)).toEqual({ ouest: 'aller', est: 'deriver' });
    const deriver = composerDock(observer(GRAVITE, dedans.partie.etat)).deplacements.find((deplacement) => deplacement.cible.vers?.nom === 'est')?.passer;
    if (deriver === undefined) throw new Error('Dérive absente.');
    expect(unToucher(GRAVITE, dedans.partie, deriver)).toBe(true);
    const auBord = jouer(GRAVITE, dedans.partie, deriver.commande);
    if (auBord.type !== 'engagee') throw new Error('Dérive non jouée.');
    expect(passer(auBord.partie)).toEqual({ ouest: 'deriver', est: 'aller' });
  });

  it('un seul toucher pour toute porte et tout déplacement, même bruyant ou risqué ; prendre garde la règle de D-182 (D-267)', () => {
    // La porte grippée de l'atelier est bruyante : elle passait par l'aperçu.
    expect(apercu(monde, depart(), optionDe(depart(), 'ouvrir', 'porte').commande)).toMatchObject({ apercu: { cout: 'bruyant' } });
    expect(unToucher(monde, depart(), optionDe(depart(), 'ouvrir', 'porte'))).toBe(true);
    expect(unToucher(monde, depart(), optionDe(depart(), 'prendre', 'carnet'))).toBe(true);
    expect(unToucher(monde, depart(), optionDe(depart(), 'attendre', observer(monde, depart().etat).piece.nom))).toBe(true);
    // Indisponible : jamais d'un seul toucher, rien ne se joue.
    const aller = observer(monde, depart().etat).menu.find((option) => option.action === 'aller' && option.cible.nom === 'porte');
    if (aller === undefined) throw new Error('Aller absent.');
    expect(unToucher(monde, depart(), aller)).toBe(false);
  });

  it('un nom par chose : puce, rappel et récit nomment la même chose (NP-04)', () => {
    let partie = depart();
    for (const etape of etapes) {
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
    if (dock.attendre === undefined) throw new Error('Attendre absent.');
    expect(texteRappel(textes, rappelDe(dock.attendre))).toEqual({ texte: 'Attendre', capitales: true });
    expect(texteRappel(textes, rappelDe(optionDe(depart(), 'prendre', 'carnet')))).toEqual({ texte: 'Carnet · Prendre', capitales: false });
  });

  it('reprise : même rappel que juste après l’action ; aucun avant la première', () => {
    let partie = depart();
    expect(rappelRepris(partie, observer(monde, partie.etat))).toBeNull();
    for (const etape of etapes) {
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
  // Des milliers d'états : les écarts sont relevés puis vérifiés d'un coup, une assertion par élément serait trop lente.
  // Délai de 30 s comme les autres parcours de tous les états : la machine de la PR est plus lente qu'un poste.
  it('chaque puce : sa consultation devient la fiche, ses actions engageantes les lignes, rien ne se perd', { timeout: 30_000 }, () => {
    const ecarts: string[] = [];
    for (const partie of atteignables()) {
      const dock = composerDock(observer(monde, partie.etat));
      for (const groupe of [...dock.piece, ...dock.deplacements, ...dock.inventaire]) {
        const { fiche, actions } = composer(groupe);
        const ranges = [fiche, ...actions];
        if (fiche?.action !== 'regarder') ecarts.push(`${groupe.cible.nom} : fiche ${String(fiche?.action)}`);
        if (!actions.every((option) => CATALOGUE[option.action].engage)) ecarts.push(`${groupe.cible.nom} : action gratuite en ligne`);
        if (ranges.length !== groupe.options.length || !groupe.options.every((option) => ranges.includes(option))) {
          ecarts.push(`${groupe.cible.nom} : options perdues ou en double`);
        }
      }
    }
    expect([...new Set(ecarts)]).toEqual([]);
  });

  it('une ligne envoie la commande structurée du menu moteur, celle que la CLI numérote et accepte (C-01 A-03, A-05)', { timeout: 30_000 }, () => {
    const ecarts: string[] = [];
    for (const partie of atteignables()) {
      const observation = observer(monde, partie.etat);
      const dock = composerDock(observation);
      for (const groupe of [...dock.piece, ...dock.deplacements, ...dock.inventaire]) {
        for (const option of composer(groupe).actions) {
          if (!observation.menu.includes(option)) ecarts.push(`${option.action} ${groupe.cible.nom} : hors du menu`);
          if (option.commande.action !== option.action || option.commande.cible !== groupe.cible.id) ecarts.push(`${option.action} ${groupe.cible.nom} : commande`);
        }
      }
    }
    expect([...new Set(ecarts)]).toEqual([]);
  });

  it('l’inventaire liste exactement les objets portés, chacun avec sa composition, tant que la partie continue', { timeout: 30_000 }, () => {
    const ecarts: string[] = [];
    for (const partie of atteignables()) {
      const observation = observer(monde, partie.etat);
      const { inventaire } = composerDock(observation);
      if (observation.terminee) {
        if (inventaire.length > 0) ecarts.push('partie terminée : inventaire jouable');
        continue;
      }
      const ids = inventaire.map((groupe) => groupe.cible.id).join(',');
      if (ids !== observation.inventaire.map((objet) => objet.id).join(',')) ecarts.push(`inventaire ${ids}`);
      if (inventaire.some((groupe) => composer(groupe).fiche === undefined)) ecarts.push('objet porté sans fiche');
    }
    expect([...new Set(ecarts)]).toEqual([]);
  });

  // Une lecture partout ; les dix lectures d'A-01 sur un état sur vingt-cinq.
  it('ouvrir et relire dix fois chaque fiche et chaque aperçu ne change ni l’état, ni le compteur, ni les dés (C-01 A-01)', { timeout: 60_000 }, () => {
    const ecarts: string[] = [];
    for (const [rang, partie] of atteignables().entries()) {
      const avant = { empreinte: empreinteEtat(partie.etat), json: JSON.stringify(partie) };
      const dock = composerDock(observer(monde, partie.etat));
      const compositions = [...dock.piece, ...dock.deplacements, ...dock.inventaire].map(composer);
      const apercus = compositions.flatMap((etape) => etape.actions).filter((option) => option.disponible);
      for (let fois = 0; fois < (rang % 25 === 0 ? 10 : 1); fois++) {
        for (const { fiche } of compositions) {
          if (fiche !== undefined && consulter({ monde, textes }, partie, fiche).length !== 1) ecarts.push(`fiche ${fiche.cible.nom}`);
        }
        for (const option of apercus) {
          if (prevoir({ monde, textes }, partie, option).savoir.length === 0) ecarts.push(`aperçu ${option.action} sans savoir`);
        }
      }
      if (empreinteEtat(partie.etat) !== avant.empreinte || JSON.stringify(partie) !== avant.json) ecarts.push(`état ${rang} modifié`);
    }
    expect([...new Set(ecarts)]).toEqual([]);
  });

  it('fil de la bulle : objet, puis objet › action ; déplacement « Aller vers › destination » (12 §3.5, §4.3)', () => {
    const ouverte = jouer(monde, depart(), optionDe(depart(), 'ouvrir', 'porte').commande);
    if (ouverte.type !== 'engagee') throw new Error('Porte non ouverte.');
    const prendre = optionDe(depart(), 'prendre', 'carnet');
    const aller = optionDe(ouverte.partie, 'aller', 'porte');
    expect(filBulle(textes, prendre.cible)).toBe('Carnet');
    expect(filBulle(textes, prendre.cible, prendre)).toBe('Carnet › Prendre');
    expect(filBulle(textes, aller.cible, aller)).toBe('Aller vers › atelier');
  });

  it('une option qui engage le personnage n’est jamais lue comme une fiche', () => {
    const prendre = optionDe(depart(), 'prendre', 'carnet');
    expect(() => consulter({ monde, textes }, depart(), prendre)).toThrow(/engage le personnage/);
  });
});

describe('étape « OÙ ? » de la bulle, sur AR-01 (12 §3.5, §4.6)', () => {
  const ar01 = MONDES['ar-01'] as EntreeMonde;
  const P_C = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-C'))?.etapes ?? [];

  /** Partie AR-01 après les `nombre` premières étapes de P-C, jouées par les commandes du menu. */
  function pc(nombre: number): Partie {
    let partie = nouvellePartie(ar01.monde, { version: 'ecran', graine: 20261010 });
    for (const etape of P_C.slice(0, nombre)) {
      const option = observer(ar01.monde, partie.etat).menu.find(
        (choix) =>
          choix.action === etape.action &&
          choix.cible.nom === etape.cible &&
          (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)) &&
          (etape.parametre === undefined || (choix.parametre?.sorte === 'passage' ? choix.parametre.vers?.nom : choix.parametre?.nom) === etape.parametre),
      );
      if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
      const resultat = jouer(ar01.monde, partie, option.commande);
      if (resultat.type !== 'engagee') throw new Error(`${etape.action} ${etape.cible} non engagée.`);
      partie = resultat.partie;
    }
    return partie;
  }

  function groupe(partie: Partie, nom: string, zone: 'piece' | 'inventaire' = 'piece'): Groupe {
    const trouve = composerDock(observer(ar01.monde, partie.etat))[zone].find((candidat) => candidat.cible.nom === nom);
    if (trouve === undefined) throw new Error(`Puce ${nom} absente.`);
    return trouve;
  }

  it('grille sans signalétique : puce tant qu’on ne l’a pas ouverte ; ouverte puis refermée, elle reste dans « Se déplacer vers » (D-147, D-229)', () => {
    const ou = (partie: Partie): string => {
      const dock = composerDock(observer(ar01.monde, partie.etat), passagesOuverts(partie));
      if (dock.piece.some((candidat) => candidat.cible.nom === 'grille')) return 'piece';
      return dock.deplacements.some((candidat) => candidat.cible.nom === 'grille') ? 'deplacement' : 'absente';
    };
    expect(ou(pc(1))).toBe('piece');
    const ouverte = pc(4);
    expect(ou(ouverte)).toBe('deplacement');
    const fermer = observer(ar01.monde, ouverte.etat).menu.find((option) => option.action === 'fermer' && option.cible.nom === 'grille');
    if (fermer === undefined) throw new Error('Fermer la grille absent.');
    const refermee = jouer(ar01.monde, ouverte, fermer.commande);
    if (refermee.type !== 'engagee') throw new Error('Grille non refermée.');
    expect(ou(refermee.partie)).toBe('deplacement');
    const grille = composerDock(observer(ar01.monde, refermee.partie.etat), passagesOuverts(refermee.partie)).deplacements.find(
      (candidat) => candidat.cible.nom === 'grille',
    );
    expect(grille?.options.map((option) => option.action)).toEqual(['aller', 'regarder', 'ouvrir']);
    expect(grille?.aller.disponible).toBe(false);
  });

  it('pupitre de départ : l’écoutille s’y ouvre et s’y ferme avant « Lancer », mêmes options que le bouton du bas (#159)', () => {
    const lignes = (partie: Partie): string[] => lignesActions(composer(groupe(partie, 'pupitre')).actions).map((option) => option.action);
    const ecoutille = (partie: Partie): readonly OptionMenu[] =>
      composerDock(observer(ar01.monde, partie.etat), passagesOuverts(partie)).deplacements.find((candidat) => candidat.cible.nom === 'ecoutille')?.options ?? [];
    const manoeuvre = (partie: Partie): OptionMenu | undefined => groupe(partie, 'pupitre').options.find((option) => option.cible.nom === 'ecoutille');

    const ouverte = pc(P_C.length - 2);
    expect(lignes(ouverte)).toEqual(['fermer', 'lancer']);
    expect(ecoutille(ouverte)).toContainEqual(manoeuvre(ouverte));
    const fermer = manoeuvre(ouverte);
    if (fermer === undefined) throw new Error('Fermer l’écoutille absent du pupitre.');
    expect(libelleLigne(ar01.textes, groupe(ouverte, 'pupitre'), fermer).libelle).toBe('Fermer l’écoutille');
    const lancer = groupe(ouverte, 'pupitre').options.find((option) => option.action === 'lancer');
    if (lancer === undefined) throw new Error('Lancer absent.');
    expect(libelleLigne(ar01.textes, groupe(ouverte, 'pupitre'), lancer).libelle).toBe('Lancer');

    const resultat = jouer(ar01.monde, ouverte, fermer.commande);
    if (resultat.type !== 'engagee') throw new Error('Écoutille non fermée.');
    expect(lignes(resultat.partie)).toEqual(['ouvrir', 'lancer']);
    expect(ecoutille(resultat.partie).map((option) => option.action)).toContain('ouvrir');
    expect(ecoutille(resultat.partie)).toContainEqual(manoeuvre(resultat.partie));
  });

  it('une ligne par action : plusieurs paramètres, une ligne ; jouable si l’un l’est, sinon la première avec sa raison', () => {
    const burette = groupe(pc(5), 'burette', 'inventaire');
    const verser = composer(burette).actions.filter((option) => option.action === 'verser');
    expect(verser.length).toBeGreaterThan(1);
    expect(lignesActions(composer(burette).actions).filter((option) => option.action === 'verser')).toEqual([verser.find((option) => option.disponible)]);

    const vide = groupe(pc(6), 'burette', 'inventaire');
    const lignes = lignesActions(composer(vide).actions);
    const [indisponible] = composer(vide).actions.filter((option) => option.action === 'verser');
    expect(lignes.filter((option) => option.action === 'verser')).toEqual([indisponible]);
    expect(indisponible?.disponible).toBe(false);
  });

  it('fiche, puis « OÙ ? » avec les seuls paramètres jouables, puis l’aperçu de la commande exacte du menu ; « ‹ » remonte d’une étape', () => {
    const partie = pc(2);
    const caisse = groupe(partie, 'caisse');
    expect(etapeBulle(caisse, null, null)).toEqual({ type: 'fiche' });

    const ou = etapeBulle(caisse, 'deplacer', null);
    if (ou.type !== 'parametre') throw new Error(`Étape ${ou.type}.`);
    expect(ou.options.every((option) => option.disponible && option.action === 'deplacer')).toBe(true);
    expect(ou.options.map((option) => option.parametre === undefined ? '' : nomParametre(ar01.textes, option.parametre))).toEqual(['sous la grille']);
    expect(precedente(ou)).toEqual({ action: null, parametre: null });

    const [sous] = ou.options;
    if (sous?.parametre === undefined) throw new Error('Position absente.');
    const vue = etapeBulle(caisse, 'deplacer', sous.parametre.id);
    expect(vue).toEqual({ type: 'apercu', option: sous, avecParametre: true });
    if (vue.type !== 'apercu') throw new Error(`Étape ${vue.type}.`);
    expect(observer(ar01.monde, partie.etat).menu).toContainEqual(vue.option);
    expect(vue.option.commande).toEqual({ action: 'deplacer', cible: caisse.cible.id, parametre: sous.parametre.id });
    expect(precedente(vue)).toEqual({ action: 'deplacer', parametre: null });
    expect(filBulle(ar01.textes, caisse.cible, vue.option)).toBe('Caisse › Déplacer › sous la grille');

    expect(etapeBulle(caisse, 'deplacer', 'inconnu')).toEqual({ type: 'fiche' });
    expect(precedente({ type: 'fiche' })).toBeNull();
  });

  it('action sans paramètre : de la fiche droit à l’aperçu, « ‹ » ramène aux actions', () => {
    const partie = pc(4);
    const burette = groupe(partie, 'burette', 'inventaire');
    const etape = etapeBulle(burette, 'poser', null);
    expect(etape).toMatchObject({ type: 'apercu', avecParametre: false });
    expect(precedente(etape)).toEqual({ action: null, parametre: null });
  });

  it('rappel avec paramètre : « Caisse · Déplacer · sous la grille », retrouvé depuis la commande enregistrée', () => {
    const avant = pc(2);
    const option = composer(groupe(avant, 'caisse')).actions.find((candidate) => candidate.action === 'deplacer' && candidate.disponible);
    if (option === undefined) throw new Error('Déplacer absent.');
    const rappel = rappelDe(option);
    expect(texteRappel(ar01.textes, rappel)).toEqual({ texte: 'Caisse · Déplacer · sous la grille', capitales: false });
    const apres = pc(3);
    const repris = rappelRepris(apres, observer(ar01.monde, apres.etat));
    expect(repris).toEqual(rappel);
  });
});

describe('un seul toucher (D-182, D-267)', () => {
  it('départ : prendre le carnet, ouvrir une porte ou une grille, tout d’un toucher', () => {
    const partie = depart();
    expect(unToucher(monde, partie, optionDe(partie, 'prendre', 'carnet'))).toBe(true);
    expect(unToucher(monde, partie, optionDe(partie, 'ouvrir', 'porte'))).toBe(true);
    expect(unToucher(monde, partie, optionDe(partie, 'ouvrir', 'grille'))).toBe(true);
  });

  it('dans tous les états atteignables : portes et déplacements toujours ; prendre et poser jamais avec un risque, un danger ou un coût', { timeout: 30_000 }, () => {
    const vus = new Set<string>();
    const ecarts: string[] = [];
    for (const partie of atteignables()) {
      for (const option of observer(monde, partie.etat).menu) {
        const direct = unToucher(monde, partie, option);
        if (!option.disponible) {
          if (direct) ecarts.push(`${option.action} indisponible d’un toucher`);
          continue;
        }
        vus.add(`${option.action}:${String(direct)}`);
        const porteOuDeplacement = ['aller', 'deriver', 'ouvrir', 'fermer', 'attendre'].includes(option.action);
        if (porteOuDeplacement !== direct && !['prendre', 'poser'].includes(option.action)) ecarts.push(`${option.action} : un toucher ${String(direct)}`);
        if (!direct || porteOuDeplacement) continue;
        const apercu = prevoir({ monde, textes }, partie, option);
        if (apercu.risque !== null || apercu.danger !== null || apercu.cout !== null) {
          ecarts.push(`${option.action} d’un toucher malgré un risque`);
        }
      }
    }
    expect([...new Set(ecarts)]).toEqual([]);
    expect([...vus]).toEqual(expect.arrayContaining(['aller:true', 'prendre:true', 'poser:true', 'ouvrir:true', 'fermer:true', 'attendre:true']));
    expect([...vus]).not.toEqual(expect.arrayContaining(['aller:false']));
  });
});

describe('aperçu affiché (D-187)', () => {
  it('dans tous les états atteignables : RISQUE et COÛT absents exactement quand le moteur annonce « aucun », jamais écrits « aucun »', { timeout: 30_000 }, () => {
    const formes = new Set<string>();
    const ecarts: string[] = [];
    for (const partie of atteignables()) {
      // « Attendre » se joue d'un toucher, sans aperçu (D-274).
      for (const option of observer(monde, partie.etat).menu.filter((choix) => choix.disponible && CATALOGUE[choix.action].engage && choix.action !== 'attendre')) {
        const moteur = apercu(monde, partie, option.commande);
        if (moteur.type !== 'apercu') continue;
        const { risque, danger, cout } = moteur.apercu;
        const affiche = prevoir({ monde, textes }, partie, option);
        const avecRisque = risque !== 'aucun' || danger !== null;
        const avecCout = cout !== 'aucun';
        formes.add(`${String(avecRisque)}:${String(avecCout)}`);
        if ((affiche.risque !== null) !== avecRisque) ecarts.push(`${option.action} : ligne RISQUE ${affiche.risque === null ? 'absente' : 'affichée'}`);
        if ((affiche.cout !== null) !== avecCout) ecarts.push(`${option.action} : ligne COÛT ${affiche.cout === null ? 'absente' : 'affichée'}`);
        if (affiche.risque === textes.apercu.risques.aucun || affiche.cout === textes.apercu.couts.aucun) ecarts.push(`${option.action} : « aucun » affiché`);
        if (affiche.savoir.length === 0) ecarts.push(`${option.action} : SAVOIR vide`);
      }
    }
    expect([...new Set(ecarts)]).toEqual([]);
    expect([...formes].sort()).toEqual(['false:false', 'false:true', 'true:false', 'true:true']);
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
