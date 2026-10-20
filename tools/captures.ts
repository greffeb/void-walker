import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, devices, type Browser, type BrowserContext, type Locator, type Page } from 'playwright';
import { preview } from 'vite';
import { apercu, jouer, nouvellePartie, observer, type Commande, type Observation, type OptionMenu, type Partie } from '../engine';
import { generateurDepuisGraine, suivant } from '../engine/des';
import { cleMort, COMPOSITIONS_PUBLIEES, libelleOption, MONDES, MOTS_CARTE, nomDe, type CleMort, type EntreeMonde, type EtapeParcours } from '../content';
import { composerDock, filBulle, nomDestination, nomLigne, nomParametre, nomPorte, nomPuce, passagesEntendus, passagesOuverts, rappelDe, texteRappel, unToucher } from '../app/ecran';
import { recitDeFin } from '../app/jeu';
import { CLE_REGLAGES } from '../app/reglages';
import { creerBot, jouerAvecBot, PROFILS } from './bots';
import { CATALOGUE } from './catalogue';
import { rejouerExport } from './rejouer-export';
import { dessinerPlan } from './plans-svg';
import { trouverOption } from './rejouer-parcours';
import { REPO_ROOT, isMainModule } from './repo-files';
import { cleEtatRegles, verifierLibre } from './verifier-station';
import { versionDuJeu } from './version';

// Captures (AP-09, D-135) : un navigateur joue le parcours témoin sur un téléphone simulé, 390 × 844 puis 320 px de large ;
// le départ d'AR-01 aussi en 412 × 915, proche du téléphone du porteur (D-191).
// Niveau « vérifié automatiquement » : jamais une validation humaine (C-10 §2).

const SORTIE = join(REPO_ROOT, 'captures');
const TELEPHONE = 'Pixel 7';
const REFERENCE = { width: 390, height: 844 };
const ETROIT = { width: 320, height: 568 };
const PORTEUR = { width: 412, height: 915 };
/** Station forcée par `?station=` (#152) ; forme d'une station tirée, `<composition>-<graine>`. */
const STATION_CAPTUREE = 'm07-m03-soute-2718281828';
/** Station à trois obstacles avec la baie (#153), forcée de même : réveil et plan au départ. */
const STATION_BAIE = 'm08-m09-m06-embarquement-2718281828';
/** Chemins d'AR-01 (#154) : trois stations qui, ensemble, couvrent M-01, M-02, M-04 et M-05 ; réveil de la première, plan de chacune. */
const STATIONS_AR01 = ['m08-m01-m06-palier-2718281828', 'm04-m02-m03-atelier-2718281828', 'm05-m06-tri-2718281828'] as const;
/** Ordre libre (#155) : deux branches, M-07 et M-10, et le final M-03 ; réveil, plan, couloir commun et première commande. */
const STATION_LIBRE = 'ol-m07-m10-m03-soute-2718281828';
/** Sas de sécurité M-11 (#203) : porte blindée, lecteur de carte et remise ; plan de la station. */
const STATION_SAS = 'm11-m03-remise-2718281828';
const FORME_STATION = /^(ol-)?(m[0-9]{2}-){1,2}m0[36]-[a-z]+-(0|[1-9][0-9]*)$/;
/** Galerie des plans (#153) : six stations tirées par groupe (un ou deux chemins, M-03 ou M-06), au hasard à graine fixe, les mêmes à chaque capture. */
const STATIONS_PAR_GROUPE = 6;
const GRAINE_GALERIE = 20261015;

export interface EtapeCapture {
  /** Partie du commentaire : parcours du monde de test, AR-01 ou AR-02, carte, stations tirées, ou les plans des stations. */
  readonly suite: 'monde-test' | 'ar-01' | 'ar-02' | 'plans' | 'carte' | 'station' | 'fins';
  readonly titre: string;
  readonly image: string;
  readonly recit: string;
  readonly situation: string;
  /** Lignes de récit visibles et dock entier ou à faire défiler (D-191) ; vide hors de l'écran de jeu. */
  readonly partage: string;
}

/** Où toucher pour jouer une étape (12 §3.4), et ce que l'écran doit en rappeler. */
export interface Geste {
  readonly titre: string;
  readonly zone: 'piece' | 'inventaire' | 'deplacement';
  /** Nom du bouton touché : la puce ; pour un passage, le nom de la salle ou l'état de sa porte, sur sa ligne (D-267). */
  readonly bouton: string;
  /** Nom de la bulle ouverte par le bouton : la puce, ou le passage (« Porte de l’atelier »). */
  readonly bulle: string;
  /** Ligne de l'action dans la bulle ; « Aller dans l’atelier » pour un déplacement (D-229). */
  readonly verbe: string;
  /** Déplacement par un passage dont la destination était inconnue : le récit nomme une autre pièce que le bouton (D-147). */
  readonly versInconnue: boolean;
  /** Ligne choisie à l'étape « OÙ ? », telle qu'affichée ; `null` pour une action sans paramètre (12 §3.5). */
  readonly parametre: string | null;
  /** Fil de la bulle d'aperçu : « Carnet › Prendre », « Caisse › Déplacer › sous la grille », « Aller vers › atelier ». */
  readonly fil: string;
  readonly rappel: string;
  /** Nom de la cible ou de la destination, attendu dans le récit (NP-04). */
  readonly nom: string;
  /** Commande du menu moteur, celle que la CLI numérote : le geste doit enregistrer exactement celle-ci (C-01 A-05). */
  readonly commande: Commande;
  /** Joué d'un seul toucher, sans aperçu (D-182). */
  readonly direct: boolean;
}

const SANS_CONFIRMATION = ', sans confirmation';
/** L'écran ignore un toucher d'un seul geste moins d'une demi-seconde après une action ou un changement de bulle (anti double toucher). */
const PAUSE_JOUEUR_MS = 700;

function gesteDe({ monde, textes }: EntreeMonde, partie: Partie, observation: Observation, option: OptionMenu): Geste {
  const dock = composerDock(observation, passagesOuverts(partie), passagesEntendus(partie));
  const titre = libelleOption(textes, option).libelle;
  const rappel = texteRappel(textes, rappelDe(option)).texte;
  const fil = filBulle(textes, option.cible, option);
  const { commande } = option;
  const direct = unToucher(monde, partie, option);
  const deplacement = dock.deplacements.find((candidat) => candidat.options.includes(option));
  if (deplacement !== undefined) {
    const destination = nomDestination(textes, deplacement.aller);
    // Une ligne de salle se joue d'un toucher : le nom fait passer, l'état ouvre ou ferme la porte (D-267).
    if (option !== deplacement.passer && option !== deplacement.manoeuvre) throw new Error(`${titre} : aucun bouton sur la ligne de ${destination}.`);
    const bouton = option === deplacement.passer ? nomLigne(textes, deplacement) : nomPorte(textes, deplacement);
    const bulle = nomPuce(textes, deplacement.cible);
    if (option.action !== 'aller') {
      const nom = nomDe(textes, option.cible).texte;
      return { titre, zone: 'deplacement', bouton, bulle, verbe: textes.verbes[option.action], versInconnue: false, parametre: null, fil, rappel, nom, commande, direct };
    }
    // Le rappel et le récit nomment la pièce d'arrivée, même par un passage dont la destination était inconnue (D-147).
    const resultat = jouer(monde, partie, commande);
    const arrivee = resultat.type === 'engagee' ? observer(monde, resultat.partie.etat).piece : undefined;
    const rappelArrivee = arrivee === undefined ? rappel : texteRappel(textes, { type: 'deplacement', vers: arrivee }).texte;
    const nom = arrivee === undefined ? destination : nomDe(textes, arrivee).texte;
    return { titre, zone: 'deplacement', bouton, bulle, verbe: titre, versInconnue: nom !== destination, parametre: null, fil, rappel: rappelArrivee, nom, commande, direct };
  }
  const zone = dock.piece.some((groupe) => groupe.options.includes(option)) ? 'piece' : 'inventaire';
  const nom = nomDe(textes, option.cible).texte;
  const parametre = option.parametre === undefined ? null : nomParametre(textes, option.parametre);
  const bouton = nomPuce(textes, option.cible);
  return { titre, zone, bouton, bulle: bouton, verbe: textes.verbes[option.action], versInconnue: false, parametre, fil, rappel, nom, commande, direct };
}

/** Gestes d'un parcours témoin, calculés par le moteur, les textes et le rangement de l'écran : ils ne dépendent pas de la graine. */
export function gestesDuParcours(entree: EntreeMonde, etapes: readonly EtapeParcours[] = entree.parcours[0]?.etapes ?? []): Geste[] {
  let partie: Partie = nouvellePartie(entree.monde, { version: 'gestes', graine: 0 });
  return etapes.map((etape) => {
    const observation = observer(entree.monde, partie.etat);
    const option = trouverOption(observation, etape);
    if (option === undefined) throw new Error(`Étape introuvable : ${etape.action} ${etape.cible}.`);
    const geste = gesteDe(entree, partie, observation, option);
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`Étape non engagée : ${etape.action}.`);
    partie = resultat.partie;
    return geste;
  });
}

/** Au départ, un passage à ouvrir puis à franchir d'un seul toucher (D-182), s'il en existe un. */
function passageDirect(entree: EntreeMonde): { readonly ouvrir: Geste; readonly aller: Geste; readonly depart: string } | undefined {
  const partie = nouvellePartie(entree.monde, { version: 'gestes', graine: 0 });
  const observation = observer(entree.monde, partie.etat);
  for (const option of observation.menu.filter((choix) => choix.action === 'ouvrir' && choix.disponible)) {
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee') continue;
    const apres = observer(entree.monde, resultat.partie.etat);
    const aller = apres.menu.find((choix) => choix.action === 'aller' && choix.cible.id === option.cible.id);
    if (aller !== undefined && unToucher(entree.monde, resultat.partie, aller)) {
      return {
        ouvrir: gesteDe(entree, partie, observation, option),
        aller: gesteDe(entree, resultat.partie, apres, aller),
        depart: nomDe(entree.textes, observation.piece).texte,
      };
    }
  }
  return undefined;
}

/** Une forme de l'aperçu : avec ou sans risque connu, avec ou sans coût ; les gestes qui y mènent depuis le départ. */
export interface CasApercu {
  readonly risque: boolean;
  readonly cout: boolean;
  readonly chemin: readonly Geste[];
  readonly geste: Geste;
}

/** Graines d'essai : la partie du navigateur tire la sienne au hasard (AP-02). */
const GRAINES_ESSAI = [1, 2, 3, 7, 11, 2718281828];

/**
 * Un chemin se rejoue à l'identique dans le navigateur quelle que soit la graine : chaque geste y reste jouable de la même
 * façon (d'un toucher ou par l'aperçu), et le dernier y montre la même forme d'aperçu.
 */
function reproductible(entree: EntreeMonde, chemin: readonly Geste[], geste: Geste, forme: string): boolean {
  return GRAINES_ESSAI.every((graine) => {
    let partie: Partie = nouvellePartie(entree.monde, { version: 'gestes', graine });
    for (const pas of chemin) {
      const option = observer(entree.monde, partie.etat).menu.find((choix) => JSON.stringify(choix.commande) === JSON.stringify(pas.commande));
      if (option === undefined || unToucher(entree.monde, partie, option) !== pas.direct) return false;
      const resultat = jouer(entree.monde, partie, option.commande);
      if (resultat.type !== 'engagee') return false;
      partie = resultat.partie;
    }
    const option = observer(entree.monde, partie.etat).menu.find((choix) => JSON.stringify(choix.commande) === JSON.stringify(geste.commande));
    const prevu = option === undefined || unToucher(entree.monde, partie, option) ? undefined : apercu(entree.monde, partie, option.commande);
    if (prevu?.type !== 'apercu') return false;
    return `${String(prevu.apercu.risque !== 'aucun' || prevu.apercu.danger !== null)}:${String(prevu.apercu.cout !== 'aucun')}` === forme;
  });
}

/**
 * Premier aperçu de chaque forme, au plus près du départ, parmi ceux qui se rejouent quelle que soit la graine ; portes et
 * déplacements n'en ont plus (D-267), le monde de test n'en montre donc pas les quatre formes.
 */
export function casApercus(entree: EntreeMonde): CasApercu[] {
  const trouves = new Map<string, CasApercu>();
  const vus = new Set<string>();
  let frontiere: { partie: Partie; chemin: Geste[] }[] = [{ partie: nouvellePartie(entree.monde, { version: 'gestes', graine: 0 }), chemin: [] }];
  while (frontiere.length > 0 && trouves.size < 4) {
    const suivante: { partie: Partie; chemin: Geste[] }[] = [];
    for (const { partie, chemin } of frontiere) {
      const etat = JSON.stringify({ ...partie.etat, actions: 0, generateur: null, memoire: null });
      if (vus.has(etat)) continue;
      vus.add(etat);
      const observation = observer(entree.monde, partie.etat);
      for (const option of observation.menu.filter((choix) => choix.disponible)) {
        // Une consultation (regarder une porte) n'a ni aperçu ni bouton à rejouer (D-267).
        const resultat = jouer(entree.monde, partie, option.commande);
        if (resultat.type !== 'engagee') continue;
        const geste = gesteDe(entree, partie, observation, option);
        const prevu = apercu(entree.monde, partie, option.commande);
        if (prevu.type === 'apercu' && !geste.direct) {
          const risque = prevu.apercu.risque !== 'aucun' || prevu.apercu.danger !== null;
          const cout = prevu.apercu.cout !== 'aucun';
          const forme = `${String(risque)}:${String(cout)}`;
          if (!trouves.has(forme) && reproductible(entree, chemin, geste, forme)) trouves.set(forme, { risque, cout, chemin, geste });
        }
        suivante.push({ partie: resultat.partie, chemin: [...chemin, geste] });
      }
    }
    frontiere = suivante;
  }
  return [...trouves.values()];
}

function echapper(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactement(texte: string): RegExp {
  return new RegExp(`^${echapper(texte)}$`, 'i');
}

/** Ouvre la bulle touchée : la fiche d'une puce ; une ligne de « Se déplacer vers » n'en a pas (D-267). */
async function ouvrir(page: Page, geste: Geste): Promise<void> {
  if (geste.zone === 'deplacement') return;
  if (geste.zone === 'inventaire') {
    const inventaire = page.getByRole('button', { name: exactement('Inventaire') });
    if ((await inventaire.getAttribute('aria-expanded')) !== 'true') await inventaire.click();
    await page.getByRole('dialog', { name: exactement('Inventaire') }).getByRole('button', { name: exactement(geste.bouton) }).click();
  } else {
    await zoneDuDock(page, geste).getByRole('button', { name: exactement(geste.bouton) }).click();
  }
}

/** Puces de la pièce ou lignes « Se déplacer vers » : la puce « Grille » et le nom « → grille » portent le même nom (D-147). */
function zoneDuDock(page: Page, geste: Geste): Locator {
  return page.locator(geste.zone === 'deplacement' ? '.dock .deplacements' : '.dock .puces');
}

/** Fil de l'étape « OÙ ? » : la puce et l'action, sans paramètre (« Caisse › Déplacer »). */
function filQuestion(geste: Geste): string {
  return `${geste.bulle} › ${geste.verbe}`;
}

/** Joue un geste d'un seul toucher : la ligne de l'action dans sa bulle ouverte (D-182), ou le bouton de la ligne de salle (D-267). */
async function toucherLigne(page: Page, geste: Geste): Promise<void> {
  await page.waitForTimeout(PAUSE_JOUEUR_MS);
  if (geste.zone === 'deplacement') {
    await zoneDuDock(page, geste).getByRole('button', { name: exactement(geste.bouton) }).click();
    return;
  }
  await page.getByRole('dialog', { name: exactement(geste.bulle) }).getByRole('button', { name: exactement(`${geste.verbe}${SANS_CONFIRMATION}`) }).click();
}

/** Choisit l'action dans la fiche s'il le faut, puis le paramètre à l'étape « OÙ ? » ; renvoie CONFIRMER de l'aperçu (12 §3.5, §3.8). */
async function versApercu(page: Page, geste: Geste): Promise<Locator> {
  await versQuestion(page, geste);
  return versConfirmer(page, geste);
}

/** Depuis l'étape « OÙ ? » s'il y en a une : touche le paramètre ; renvoie CONFIRMER de l'aperçu. */
async function versConfirmer(page: Page, geste: Geste): Promise<Locator> {
  if (geste.parametre !== null) {
    await page.getByRole('dialog', { name: exactement(filQuestion(geste)) }).locator('.lignes').getByRole('button', { name: exactement(geste.parametre) }).click();
  }
  return page.getByRole('dialog', { name: exactement(geste.fil) }).getByRole('button', { name: exactement('Confirmer') });
}

/** Touche la ligne de l'action dans la fiche ouverte : l'aperçu, ou l'étape « OÙ ? » si l'action a un paramètre. */
async function versQuestion(page: Page, geste: Geste): Promise<void> {
  // Dans les lignes d'action seulement : « Fermer » est aussi le nom du « ✕ » de la bulle.
  await page.getByRole('dialog', { name: exactement(geste.bulle) }).locator('.lignes').getByRole('button', { name: exactement(geste.verbe) }).click();
}

async function preparer(page: Page, geste: Geste): Promise<Locator> {
  await ouvrir(page, geste);
  return versApercu(page, geste);
}

/** Rejoue des gestes depuis le départ comme le joueur : d'un seul toucher, ou par l'aperçu puis CONFIRMER. */
async function rejouer(page: Page, chemin: readonly Geste[], deja = 0): Promise<void> {
  for (const [rang, geste] of chemin.entries()) {
    const index = deja + rang;
    if (geste.direct) {
      await ouvrir(page, geste);
      await toucherLigne(page, geste);
    } else {
      await (await preparer(page, geste)).click();
    }
    await attendreSauvegarde(page, index + 1);
  }
}

/** La sauvegarde réussie est silencieuse : on attend ses attributs, pas un texte (12 §11). */
async function attendreSauvegarde(page: Page, actions: number): Promise<void> {
  await page
    .locator(`[data-testid="sauvegarde"][data-actions="${actions}"][data-etat="sauvegardee"]`)
    .waitFor({ state: 'attached', timeout: 10_000 });
}

/** Intro de NOUVELLE PARTIE (D-305), pour une station tirée : passée d'un toucher, puis DÉMARRER ; un monde fixe n'en a pas. */
async function passerIntroSiPresente(page: Page): Promise<void> {
  const intro = page.getByRole('main', { name: 'Tirage de la station' });
  const regarder = page.getByRole('button', { name: /^regarder autour de vous$/i });
  await intro.or(regarder).first().waitFor();
  if ((await intro.count()) === 0) return;
  await intro.click({ position: { x: 24, y: 24 } });
  await page.getByRole('button', { name: exactement('Démarrer') }).click();
}

async function nouvelleDepuisAccueil(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
  await passerIntroSiPresente(page);
  await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
  await attendreSauvegarde(page, 0);
}

async function reprendreDepuisAccueil(page: Page, actions: number): Promise<void> {
  await page.getByRole('button', { name: /^reprendre la partie$/i }).click();
  if (actions === 0) await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
  await attendreSauvegarde(page, actions);
}

async function lire(page: Page): Promise<{ recit: string; situation: string }> {
  // Récit tel que le lecteur d'écran le reçoit : la copie écrite à la machine lui est masquée (D-186).
  const zoneRecit = page.getByTestId('recit');
  const recit = (await zoneRecit.count()) === 0 ? '' : await zoneRecit.evaluate((zone) => [...zone.querySelectorAll('.lecteur-seul')].map((bloc) => bloc.textContent ?? '').join('\n'));
  const zoneSituation = page.getByTestId('situation');
  const situation = (await zoneSituation.count()) === 0 ? '' : (await zoneSituation.innerText()).replace(/\n\s*\n/g, '\n').trim();
  return { recit, situation };
}

/** Aucun chiffre affiché, cibles d'au moins 44 × 44 px, pas de débordement en largeur (12 §1, §2.7, §7) ; six lignes de récit au moins (D-191). */
async function verifierEcran(page: Page, ou: string, erreurs: string[]): Promise<void> {
  const zones = await page.locator('.entete-piece, [data-testid="recit"], .dock, .bulle, .navigation').allInnerTexts();
  if (zones.some((texte) => /\d/.test(texte))) erreurs.push(`${ou} : un chiffre est affiché.`);
  for (const bouton of await page.locator('main button').all()) {
    const boite = await bouton.boundingBox();
    if (boite !== null && (boite.width < 43.5 || boite.height < 43.5)) {
      erreurs.push(`${ou} : « ${(await bouton.innerText()).trim()} » mesure ${Math.round(boite.width)} × ${Math.round(boite.height)} px.`);
    }
  }
  const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (debord > 0) erreurs.push(`${ou} : la page déborde de ${debord} px en largeur.`);
  const mesure = await partage(page);
  if (mesure !== null && !(mesure.lignes >= 5.95)) erreurs.push(`${ou} : le récit ne montre que ${mesure.lignes.toFixed(1)} lignes.`);
  if (mesure !== null && mesure.defile && mesure.lignes > 6.05) erreurs.push(`${ou} : le dock défile alors que le récit a ${mesure.lignes.toFixed(1)} lignes.`);
}

/** Partage de l'écran de jeu (D-191) : lignes de récit visibles, et si le dock défile ; `null` sans récit ni dock. */
async function partage(page: Page): Promise<{ lignes: number; defile: boolean } | null> {
  return page.evaluate(() => {
    const recit = document.querySelector<HTMLElement>('[data-testid="recit"]');
    const dock = document.querySelector<HTMLElement>('.dock');
    if (recit === null || dock === null) return null;
    const style = getComputedStyle(recit);
    const lignes = (recit.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / parseFloat(style.lineHeight);
    return { lignes, defile: dock.scrollHeight > dock.clientHeight + 1 };
  });
}

function decrirePartage(mesure: { lignes: number; defile: boolean } | null): string {
  if (mesure === null) return '';
  const lignes = mesure.lignes.toFixed(1).replace('.', ',');
  return `Récit : ${lignes} lignes visibles ; boutons du dock ${mesure.defile ? 'à faire défiler' : 'tous visibles'}.`;
}

/**
 * Le pied de page (version, commit, numéro de PR) est en bas de la bulle Application des options, sur une ligne (D-191, D-287) ;
 * on revient ensuite au jeu par REPRENDRE LA PARTIE, bulle ouverte (D-288).
 */
async function verifierPied(page: Page, ou: string, erreurs: string[]): Promise<void> {
  await ouvrirOptions(page);
  await ouvrirSousMenu(page, 'Application');
  const pied = page.locator('.options .pied');
  if ((await page.locator('.pied').count()) !== 1) erreurs.push(`${ou} : le pied de page n’est pas seulement dans les options.`);
  const lignes = await pied.evaluate((element) => {
    const style = getComputedStyle(element);
    return (element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)) / parseFloat(style.lineHeight);
  });
  if (!(lignes <= 1.05)) erreurs.push(`${ou} : le pied de page « ${(await pied.innerText()).trim()} » tient sur ${Math.round(lignes)} lignes.`);
  await page.getByRole('button', { name: exactement('Reprendre la partie') }).click();
  await page.getByTestId('recit').waitFor();
}

/** Ouvre les options par l'engrenage de l'écran de jeu (12 §3.2). */
async function ouvrirOptions(page: Page): Promise<void> {
  await page.locator('.entete-piece').getByRole('button', { name: exactement('Options') }).click();
  await page.getByRole('heading', { name: exactement('Options'), level: 1 }).waitFor();
}

/** Sous-menus des options, dans l'ordre du sommaire (D-287). */
const SOUS_MENUS = ['Son et texte', 'Rapports', 'Application'] as const;

/** Ouvre un sous-menu des options en touchant sa ligne : sa bulle, nommée par son titre (D-288). */
async function ouvrirSousMenu(page: Page, nom: (typeof SOUS_MENUS)[number]): Promise<Locator> {
  await ligneSousMenu(page, nom).click();
  const bulle = page.getByRole('dialog', { name: exactement(nom) });
  await bulle.waitFor();
  return bulle;
}

/** Ligne du sommaire des options : son nom lu, puis son détail. */
function ligneSousMenu(page: Page, nom: (typeof SOUS_MENUS)[number]): Locator {
  return page.locator('.options-corps').getByRole('button', { name: new RegExp(`^${echapper(nom)}`) });
}

/** Une entrée d'historique de sous-menu reste après sa fermeture (D-288). */
function entreeSousMenuRestee(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const etat: unknown = window.history.state;
    return typeof etat === 'object' && etat !== null && 'void-walker:sous-menu' in etat;
  });
}

/**
 * Sous-menus des options (D-287, D-288), depuis le sommaire : chaque ligne ouvre sa bulle, au toucher ou au clavier, nommée par
 * son titre et focalisée, sous l'en-tête, au-dessus du bas resté utilisable ; ✕, le voile, Échap et le retour du téléphone la
 * referment, le focus revient sur la ligne et l'entrée d'historique s'en va. On reste dans les options.
 */
async function verifierSousMenus(page: Page, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const entete = await page.locator('.entete-options').boundingBox();
  const bas = await page.locator('.options-bas').boundingBox();
  for (const nom of SOUS_MENUS) {
    const ligne = ligneSousMenu(page, nom);
    if ((await ligne.count()) !== 1) {
      erreurs.push(`Options : ligne « ${nom} » absente du sommaire.`);
      continue;
    }
    for (const geste of ['✕', 'voile', 'Échap', 'retour'] as const) {
      const ou = `Sous-menu ${nom}, fermé par ${geste}`;
      // Au clavier pour Échap : le focus sur la ligne, Entrée ; au toucher sinon.
      if (geste === 'Échap') {
        await ligne.focus();
        await page.keyboard.press('Enter');
      } else await ligne.click();
      const bulle = page.getByRole('dialog', { name: exactement(nom) });
      await bulle.waitFor();
      if (!(await bulle.evaluate((element) => element.contains(document.activeElement)))) erreurs.push(`${ou} : le focus n’entre pas dans la bulle.`);
      const boite = await bulle.boundingBox();
      if (boite === null || entete === null || bas === null) erreurs.push(`${ou} : bulle, en-tête ou bas introuvable.`);
      else {
        if (boite.y < entete.y + entete.height) erreurs.push(`${ou} : la bulle passe sur l’en-tête.`);
        if (boite.y + boite.height > bas.y + 1) erreurs.push(`${ou} : la bulle passe sur MENU PRINCIPAL et REPRENDRE LA PARTIE.`);
      }
      // Le bas reste au-dessus du voile : c'est lui qui reçoit le toucher.
      const reprendre = page.locator('.options-bas').getByRole('button', { name: exactement('Reprendre la partie') });
      if (!(await reprendre.evaluate((bouton) => {
        const { x, y, width, height } = bouton.getBoundingClientRect();
        return document.elementFromPoint(x + width / 2, y + height / 2) === bouton;
      }))) erreurs.push(`${ou} : REPRENDRE LA PARTIE est sous le voile.`);
      if (geste === '✕') {
        await capturer(page, `Options : sous-menu ${nom}`);
        await verifierSansTroncature(page, `Options, sous-menu ${nom}`, erreurs);
        await bulle.getByRole('button', { name: exactement('Fermer') }).click();
      } else if (geste === 'voile') await page.mouse.click(8, 8);
      else if (geste === 'Échap') await page.keyboard.press('Escape');
      else await page.goBack();
      await bulle.waitFor({ state: 'detached' });
      if (!(await ligne.evaluate((element) => element === document.activeElement))) erreurs.push(`${ou} : le focus ne revient pas sur sa ligne.`);
      if (await entreeSousMenuRestee(page)) erreurs.push(`${ou} : l’entrée d’historique du sous-menu reste.`);
      if ((await page.getByRole('heading', { name: exactement('Options'), level: 1 }).count()) !== 1) erreurs.push(`${ou} : on a quitté les options.`);
    }
  }
}

/** Touche une taille du groupe segmenté, dans la bulle Son et texte qu'elle ouvre au besoin (12 §4.10, D-288). */
async function choisirTaille(page: Page, libelle: 'Standard' | 'Grande' | 'Très grande'): Promise<void> {
  if ((await page.getByRole('dialog', { name: exactement('Son et texte') }).count()) === 0) await ouvrirSousMenu(page, 'Son et texte');
  await page.locator('label.segment', { has: page.getByText(libelle, { exact: true }) }).click();
}

/** Aucun texte coupé (12 §7) : aucun élément visible ne déborde en largeur de sa boîte. */
async function verifierSansTroncature(page: Page, ou: string, erreurs: string[]): Promise<void> {
  const coupes = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.ecran *')]
      .filter((element) => element.closest('.lecteur-seul, svg') === null && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className} « ${(element.textContent ?? '').trim().slice(0, 40)} »`),
  );
  for (const coupe of coupes) erreurs.push(`${ou} : texte coupé en largeur dans ${coupe}.`);
}

/** Taille du récit en pixels, ou de l'aperçu de taille dans les options. */
async function tailleRecit(page: Page): Promise<string> {
  return page.locator('[data-testid="recit"] p:not(.rappel), [data-testid="apercu-taille"]').first().evaluate((element) => getComputedStyle(element).fontSize);
}

/** Bulle d'inventaire ouverte : au-dessus de son bouton sans le cacher, dock toujours là (D-154, D-176). */
async function verifierBulle(page: Page, ou: string, erreurs: string[]): Promise<void> {
  const bulle = await page.getByRole('dialog', { name: exactement('Inventaire') }).boundingBox();
  const bouton = await page.getByRole('button', { name: exactement('Inventaire') }).boundingBox();
  if (bulle === null || bouton === null) {
    erreurs.push(`${ou} : bulle d’inventaire ou bouton absent.`);
    return;
  }
  if (bulle.y + bulle.height > bouton.y) erreurs.push(`${ou} : la bulle cache le bouton INVENTAIRE.`);
  for (const titre of ['Dans la pièce', 'Se déplacer vers']) {
    if (!(await page.getByRole('heading', { name: exactement(titre) }).isVisible())) erreurs.push(`${ou} : « ${titre} » a disparu sous la bulle.`);
  }
}

/** Toucher en dehors de la bulle la referme sans rien jouer (12 §3.5). */
async function verifierFermeture(page: Page, erreurs: string[]): Promise<void> {
  const inventaire = page.getByRole('button', { name: exactement('Inventaire') });
  await inventaire.click();
  await page.mouse.click(24, 140);
  if (await page.getByRole('dialog', { name: exactement('Inventaire') }).isVisible()) erreurs.push('Toucher hors de la bulle ne la ferme pas.');
  if ((await inventaire.getAttribute('aria-expanded')) !== 'false') erreurs.push('Le bouton INVENTAIRE reste marqué ouvert après fermeture.');
}

/** Chaque bulle ouverte tient entièrement dans l'écran (critère de #93). */
async function verifierDansEcran(page: Page, ou: string, erreurs: string[]): Promise<void> {
  const ecran = page.viewportSize();
  const bulles = await page.getByRole('dialog').all();
  if (bulles.length === 0) erreurs.push(`${ou} : aucune bulle ouverte.`);
  for (const bulle of bulles) {
    const boite = await bulle.boundingBox();
    if (ecran === null || boite === null) continue;
    if (boite.x < 0 || boite.y < 0 || boite.x + boite.width > ecran.width + 0.5 || boite.y + boite.height > ecran.height + 0.5) {
      erreurs.push(`${ou} : la bulle déborde de l’écran (${Math.round(boite.x)}, ${Math.round(boite.y)}, ${Math.round(boite.width)} × ${Math.round(boite.height)}).`);
    }
  }
}

/** Partie enregistrée dans IndexedDB, état des dés compris. */
async function partieEnregistree(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const nom = (await indexedDB.databases()).find((base) => base.name?.startsWith('void-walker:') === true)?.name;
    if (nom === undefined) return 'aucune base';
    const base = await new Promise<IDBDatabase>((resoudre, rejeter) => {
      const demande = indexedDB.open(nom);
      demande.onsuccess = () => resoudre(demande.result);
      demande.onerror = () => rejeter(demande.error ?? new Error('IndexedDB'));
    });
    const valeur = await new Promise<unknown>((resoudre, rejeter) => {
      const demande = base.transaction('parties').objectStore('parties').get('en-cours');
      demande.onsuccess = () => resoudre(demande.result);
      demande.onerror = () => rejeter(demande.error ?? new Error('IndexedDB'));
    });
    base.close();
    return JSON.stringify(valeur ?? null);
  });
}

const FERMETURES = ['✕', 'voile', 'Échap', 'retour système', 'ANNULER'] as const;

/** Boutons du dock qui ouvrent une bulle : les puces des objets ; les lignes de salle n'en ouvrent pas (D-267). */
const OUVRE_BULLE = '.dock .puce[aria-haspopup="dialog"]';

async function verifierFocusPiege(page: Page, bulle: Locator, ou: string, erreurs: string[]): Promise<void> {
  for (const touche of ['Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(touche);
    if (!(await bulle.evaluate((element) => element.contains(document.activeElement)))) {
      erreurs.push(`${ou} : le focus sort de la bulle au clavier (${touche}).`);
      return;
    }
  }
}

/**
 * Une salle derrière une porte fermée (D-267) : nom en pointillé, sans bulle, son de refus ; touché ou validé au clavier,
 * le moteur refuse sans coût : le récit dit pourquoi, la partie enregistrée ne change pas.
 */
async function verifierSalleFermee(page: Page, erreurs: string[]): Promise<void> {
  const partie = await partieEnregistree(page);
  const ferme = page.locator('.dock .deplacements .deplacement.bloque').first();
  if ((await ferme.count()) === 0) {
    erreurs.push('Départ : aucune salle derrière une porte fermée.');
    return;
  }
  const attributs = await ferme.evaluate((bouton) => ({ bulle: bouton.hasAttribute('aria-haspopup'), son: bouton.dataset.son, nom: bouton.getAttribute('aria-label') ?? '' }));
  if (attributs.bulle || attributs.son !== 'refus' || !attributs.nom.includes(', ')) {
    erreurs.push(`Salle fermée « ${attributs.nom} » : attendue sans bulle, son « refus », nommée avec sa raison.`);
  }
  await page.waitForTimeout(PAUSE_JOUEUR_MS);
  await ferme.click();
  await ferme.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  if ((await partieEnregistree(page)) !== partie) erreurs.push('Toucher une salle fermée a modifié la partie enregistrée.');
  if ((await page.getByTestId('sauvegarde').getAttribute('data-actions')) !== '0') erreurs.push('Toucher une salle fermée a compté une action.');
  if (!(await lire(page)).recit.includes('fermé')) erreurs.push('Toucher une salle fermée : le récit ne dit pas pourquoi.');
}

/**
 * Ouvrir, parcourir et fermer dix fois les bulles ne change rien (C-01 A-01) : cinq fois depuis l'aperçu, cinq fois depuis la fiche.
 * Le focus entre dans la bulle, n'en sort pas au clavier et revient sur la puce à la fermeture (12 §7).
 */
async function verifierSansEffet(page: Page, erreurs: string[]): Promise<void> {
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)) };
  const puces = await page.locator(OUVRE_BULLE).all();
  if (puces.length === 0) erreurs.push('Aucune puce à ouvrir au départ : bulles non vérifiées.');
  for (let fois = 0; fois < 10; fois++) {
    const puce = puces[(fois + 1) % puces.length];
    const depuisFiche = fois >= FERMETURES.length;
    const choix = depuisFiche ? (FERMETURES[fois % (FERMETURES.length - 1)] ?? '✕') : (FERMETURES[fois] ?? '✕');
    if (puce === undefined) break;
    await puce.click();
    await page.getByRole('dialog').waitFor();
    const nom = ((await page.getByRole('dialog').locator('.bulle-titre').textContent()) ?? '').trim();
    const fiche = page.getByRole('dialog', { name: exactement(nom) });
    await fiche.waitFor();
    if ((await puce.getAttribute('aria-expanded')) !== 'true') erreurs.push(`Bulle « ${nom} » : la puce n’est pas marquée ouverte.`);
    // Une ligne d'un seul toucher jouerait l'action : on ne touche que celles qui ouvrent un aperçu.
    const ligne = fiche.locator(`.ligne:not(.indisponible):not([aria-label$="${SANS_CONFIRMATION}"])`).first();
    const versApercu = !depuisFiche && (await ligne.count()) > 0;
    const fermeture = !versApercu && choix === 'ANNULER' ? '✕' : choix;
    let bulle = fiche;
    if (!versApercu) {
      if (fois === FERMETURES.length) await verifierFocusPiege(page, fiche, `Fiche « ${nom} »`, erreurs);
    } else {
      const verbe = (await ligne.innerText()).replace(/^▸\s*/, '').trim();
      await ligne.click();
      bulle = page.getByRole('dialog', { name: exactement(`${nom} › ${verbe}`) });
      await bulle.waitFor();
      if (fois === 0) {
        await verifierFocusPiege(page, bulle, `Aperçu « ${nom} › ${verbe} »`, erreurs);
        await bulle.getByRole('button', { name: exactement('Étape précédente') }).click();
        await fiche.waitFor({ timeout: 5_000 }).catch(() => erreurs.push(`Aperçu « ${nom} › ${verbe} » : « ‹ » ne ramène pas à la fiche.`));
        await ligne.click();
        await bulle.waitFor();
      }
    }
    await fermerBulle(page, bulle, fermeture);
    await bulle.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => erreurs.push(`Bulle « ${nom} » : ${fermeture} ne la ferme pas.`));
    if (!(await puce.evaluate((element) => element === document.activeElement))) {
      erreurs.push(`Bulle « ${nom} » fermée par ${fermeture} : le focus ne revient pas sur la puce.`);
    }
  }
  const apres = { partie: await partieEnregistree(page), ...(await lire(page)) };
  if (apres.partie !== avant.partie) erreurs.push('Ouvrir et fermer les bulles a modifié la partie enregistrée.');
  if (apres.recit !== avant.recit || apres.situation !== avant.situation) erreurs.push('Ouvrir et fermer les bulles a changé le récit ou la situation.');
  if ((await page.getByTestId('sauvegarde').getAttribute('data-actions')) !== '0') erreurs.push('Ouvrir et fermer les bulles a compté une action.');
}

async function fermerBulle(page: Page, bulle: Locator, fermeture: (typeof FERMETURES)[number]): Promise<void> {
  if (fermeture === '✕') await bulle.getByRole('button', { name: exactement('Fermer') }).click();
  if (fermeture === 'voile') await page.getByTestId('voile').click({ position: { x: 4, y: 4 } });
  if (fermeture === 'Échap') await page.keyboard.press('Escape');
  if (fermeture === 'retour système') await page.evaluate(() => window.history.back());
  if (fermeture === 'ANNULER') await bulle.getByRole('button', { name: exactement('Annuler') }).click();
}

/** Inventaire : liste, fiche, « ‹ », fiche, aperçu, « ‹ », aperçu, puis fermeture, cinq fois, sans effet ; le focus revient sur INVENTAIRE.
 * Action d'un seul toucher : pas d'aperçu, la fiche se referme (✕ à la place d'ANNULER). */
async function verifierInventaireSansEffet(page: Page, geste: Geste, erreurs: string[]): Promise<void> {
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)) };
  const actions = await page.getByTestId('sauvegarde').getAttribute('data-actions');
  const inventaire = page.getByRole('button', { name: exactement('Inventaire') });
  for (const choix of FERMETURES) {
    await inventaire.click();
    const liste = page.getByRole('dialog', { name: exactement('Inventaire') });
    await liste.getByRole('button', { name: exactement(geste.bouton) }).click();
    const fiche = page.getByRole('dialog', { name: exactement(geste.bulle) });
    await fiche.getByRole('button', { name: exactement('Étape précédente') }).click();
    await liste.waitFor({ timeout: 5_000 }).catch(() => erreurs.push('Inventaire : « ‹ » ne ramène pas à la liste.'));
    await liste.getByRole('button', { name: exactement(geste.bouton) }).click();
    let bulle = fiche;
    if (!geste.direct) {
      await fiche.getByRole('button', { name: exactement(geste.verbe) }).click();
      bulle = page.getByRole('dialog', { name: exactement(geste.fil) });
      await bulle.getByRole('button', { name: exactement('Étape précédente') }).click();
      await fiche.waitFor({ timeout: 5_000 }).catch(() => erreurs.push('Inventaire : « ‹ » ne ramène pas de l’aperçu à la fiche.'));
      await fiche.getByRole('button', { name: exactement(geste.verbe) }).click();
    }
    const fermeture = geste.direct && choix === 'ANNULER' ? '✕' : choix;
    await fermerBulle(page, bulle, fermeture);
    await bulle.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => erreurs.push(`Inventaire : ${fermeture} ne le ferme pas.`));
    if (!(await inventaire.evaluate((element) => element === document.activeElement))) {
      erreurs.push(`Inventaire fermé par ${fermeture} : le focus ne revient pas sur INVENTAIRE.`);
    }
  }
  const apres = { partie: await partieEnregistree(page), ...(await lire(page)) };
  if (apres.partie !== avant.partie || apres.recit !== avant.recit || apres.situation !== avant.situation) {
    erreurs.push('Parcourir l’inventaire a changé la partie, le récit ou la situation.');
  }
  if ((await page.getByTestId('sauvegarde').getAttribute('data-actions')) !== actions) erreurs.push('Parcourir l’inventaire a compté une action.');
}

/** Le rappel et le récit nomment la cible comme le dock (NP-04). */
async function verifierNoms(page: Page, geste: Geste, erreurs: string[]): Promise<void> {
  const rappel = ((await page.getByTestId('rappel').locator('.lecteur-seul').textContent()) ?? '').trim();
  if (rappel.toLowerCase() !== geste.rappel.toLowerCase()) erreurs.push(`${geste.titre} : rappel « ${rappel} » au lieu de « ${geste.rappel} ».`);
  const recit = (await lire(page)).recit.toLowerCase();
  if (!recit.includes(geste.nom.toLowerCase())) erreurs.push(`${geste.titre} : le récit ne nomme pas « ${geste.nom} » (NP-04).`);
}

interface EtatEcriture {
  readonly visibles: number;
  readonly total: number;
  /** Les caractères visibles précèdent tous les autres : l'écriture suit l'ordre de lecture. */
  readonly dansLOrdre: boolean;
  readonly curseur: string;
  readonly curseurs: number;
  /** Place de chaque bloc du récit et du dock : elle ne doit pas bouger pendant l'écriture. */
  readonly places: string;
  readonly classes: string;
  /** Animations de la machine à écrire encore en cours (caractères ou curseur). */
  readonly animees: number;
}

/** Fige l'écriture du récit à `ms` de son début si `ms` est donné, puis relève ce qui est affiché (D-186). */
async function etatEcriture(page: Page, ms?: number): Promise<EtatEcriture> {
  return page.evaluate((instant) => {
    const zone = document.querySelector('[data-testid="recit"]');
    if (zone === null) throw new Error('Récit absent.');
    const animations = document.getAnimations().filter((animation) => {
      const cible = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
      return cible !== null && zone.contains(cible);
    });
    if (instant !== undefined) {
      for (const animation of animations) {
        animation.pause();
        animation.currentTime = instant;
      }
    }
    const vus = [...zone.querySelectorAll('.car')].map((car) => getComputedStyle(car).visibility === 'visible');
    const premierCache = vus.indexOf(false);
    const curseur = zone.querySelector('.curseur');
    const places = [...zone.querySelectorAll('p'), document.querySelector('.dock')]
      .map((element) => {
        const boite = element?.getBoundingClientRect();
        return boite === undefined ? '?' : `${Math.round(boite.top)}+${Math.round(boite.height)}`;
      })
      .join(' ');
    return {
      visibles: vus.filter(Boolean).length,
      total: vus.length,
      dansLOrdre: premierCache === -1 || vus.slice(premierCache).every((vu) => !vu),
      curseur: curseur === null ? 'absent' : `${getComputedStyle(curseur).visibility}, ${getComputedStyle(curseur).animationName}`,
      curseurs: document.querySelectorAll('.curseur').length,
      places: `${places} / ${zone.scrollHeight}`,
      classes: zone.className,
      animees: animations.filter((animation) => animation.playState === 'running' && animation instanceof CSSAnimation && animation.animationName === 'apparait')
        .length,
    };
  }, ms);
}

/** Joue « Regarder autour de vous » et attend que son texte remplace le précédent : une nouvelle écriture commence. */
async function nouveauTexte(page: Page): Promise<void> {
  const ancien = await page.locator('[data-testid="recit"] .car').first().elementHandle();
  await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
  await page.waitForFunction((car) => car === null || !car.isConnected, ancien);
}

/** Écriture figée à différents instants : progressive, dans l'ordre, sans décalage, puis curseur ; un seul curseur. */
function verifierProgression(etats: readonly (readonly [number, EtatEcriture])[], ou: string, erreurs: string[]): void {
  const [premier] = etats;
  if (premier === undefined) return;
  for (const [ms, etat] of etats) {
    const fini = ms >= 500;
    if (fini ? etat.visibles !== etat.total : etat.visibles >= etat.total) erreurs.push(`${ou}, ${ms} ms : ${etat.visibles} caractères visibles sur ${etat.total}.`);
    if (!etat.dansLOrdre) erreurs.push(`${ou}, ${ms} ms : l’écriture ne suit pas l’ordre de lecture.`);
    if (etat.curseurs !== 1) erreurs.push(`${ou}, ${ms} ms : ${etat.curseurs} curseurs à l’écran.`);
    if (!etat.curseur.startsWith(fini ? 'visible' : 'hidden')) erreurs.push(`${ou}, ${ms} ms : curseur ${etat.curseur}.`);
    if (etat.places !== premier[1].places) erreurs.push(`${ou}, ${ms} ms : la mise en page a bougé (${premier[1].places} → ${etat.places}).`);
  }
  const visibles = etats.map(([, etat]) => etat.visibles);
  if (visibles.some((nombre, rang) => rang > 0 && nombre <= (visibles[rang - 1] ?? 0))) erreurs.push(`${ou} : écriture non progressive (${visibles.join(', ')}).`);
}

async function policesChargees(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((police) => police.family.includes('IBM Plex Mono') && police.status === 'loaded')
      .map((police) => `${police.weight} ${police.style}`);
  });
}

type CapturerPage = (page: Page, titre: string, animations?: 'disabled' | 'allow') => Promise<EtapeCapture>;

/**
 * Bouton IA STATION : repère animé et « nouveau message » tant qu'un message n'est pas lu, rien ensuite (12 §2.6, D-263).
 * Un seul repère, jamais avec l'ancien carré ; en mouvement normal il pulse deux fois puis se repose, en mouvement réduit il est fixe et visible.
 */
async function verifierRepere(page: Page, attendue: boolean, ou: string, erreurs: string[]): Promise<void> {
  const bouton = page.locator('.nav-ia');
  const reperes = await bouton.locator('.notification-ia').count();
  const nom = await bouton.getAttribute('aria-label');
  const voulu = attendue ? 'IA Station, nouveau message' : 'IA Station';
  if (reperes !== (attendue ? 1 : 0) || nom !== voulu) erreurs.push(`${ou} : IA STATION « ${nom ?? '?'} », ${reperes} repère(s), au lieu de « ${voulu} ».`);
  if ((await bouton.locator('.pastille').count()) > 0) erreurs.push(`${ou} : l’ancien carré fixe double encore le repère.`);
  if (!attendue || reperes !== 1) return;
  const repere = bouton.locator('.notification-ia');
  if ((await repere.getAttribute('aria-hidden')) !== 'true') erreurs.push(`${ou} : le repère n’est pas masqué au lecteur d’écran.`);
  const etat = await repere.evaluate((element) => ({ nom: getComputedStyle(element).animationName }));
  if (etat.nom !== 'notification-ia') erreurs.push(`${ou} : le repère n’est pas animé (« ${etat.nom} »).`);
  const animationBouton = await bouton.evaluate((element) => getComputedStyle(element).animationName);
  const libelle = await bouton.evaluate((element) => [...element.children].map((enfant) => getComputedStyle(enfant).animationName));
  if (animationBouton !== 'none' || libelle.filter((nomAnimation) => nomAnimation !== 'none').length !== 1) erreurs.push(`${ou} : autre chose que le repère s’anime sur IA STATION.`);
  // Posé à cheval sur le bord haut du bouton, côté droit, sans recouvrir le libellé.
  const place = await page.evaluate(() => {
    const bouton = document.querySelector('.nav-ia');
    const repere = document.querySelector('.nav-ia .notification-ia');
    if (bouton === null || repere === null) return { dedans: false, libelle: true };
    const b = bouton.getBoundingClientRect();
    const r = repere.getBoundingClientRect();
    const rectsTexte = [...bouton.childNodes]
      .filter((noeud) => noeud.nodeType === Node.TEXT_NODE)
      .flatMap((noeud) => {
        const zone = document.createRange();
        zone.selectNodeContents(noeud);
        return [...zone.getClientRects()];
      });
    return {
      dedans: r.left >= b.left && r.right <= b.right + 1 && r.top <= b.top + b.height / 2 && r.bottom >= b.top && r.top >= b.top - 20,
      libelle: rectsTexte.some((t) => t.left < r.right && t.right > r.left && t.top < r.bottom && t.bottom > r.top),
    };
  });
  if (!place.dedans) erreurs.push(`${ou} : le repère n’est pas posé sur l’angle du bouton IA STATION.`);
  if (place.libelle) erreurs.push(`${ou} : le repère recouvre le libellé IA STATION.`);
}

/**
 * Mouvement réduit (D-263) : le repère reste fixe et visible. La préférence est réglée avant le rechargement, comme un téléphone qui demande
 * moins d'animations, puis la partie est reprise ; la préférence normale revient ensuite, par le même chemin.
 */
async function verifierRepereReduit(page: Page, actions: number, ou: string, erreurs: string[]): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await reprendreDepuisAccueil(page, actions);
  const repere = page.locator('.nav-ia .notification-ia');
  if ((await repere.count()) !== 1) erreurs.push(`${ou} : en mouvement réduit, le repère est absent.`);
  else {
    const reduit = await repere.evaluate((element) => ({ nom: getComputedStyle(element).animationName, opacite: getComputedStyle(element).opacity, animations: element.getAnimations().length }));
    if (reduit.nom !== 'none' || reduit.opacite !== '1' || reduit.animations !== 0 || !(await repere.isVisible())) erreurs.push(`${ou} : en mouvement réduit, le repère n’est pas fixe et visible (${JSON.stringify(reduit)}).`);
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await reprendreDepuisAccueil(page, actions);
}

/** Nombre de pulsations par cycle du repère : deux creux d'opacité, une seconde de repos avant le suivant (D-263). */
async function verifierRythmeRepere(page: Page, ou: string, erreurs: string[]): Promise<void> {
  const rythme = await page.locator('.nav-ia .notification-ia').evaluate((element) => {
    const effet = element.getAnimations()[0];
    const timing = effet?.effect?.getComputedTiming();
    const images = (effet?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];
    return { duree: Number(timing?.duration ?? 0), creux: images.filter((image) => Number(image.opacity) < 1).length, iterations: timing?.iterations ?? 0 };
  });
  if (rythme.duree !== 1500 || rythme.creux !== 2 || rythme.iterations !== Infinity) erreurs.push(`${ou} : rythme du repère inattendu (${JSON.stringify(rythme)}).`);
}

async function verifierParole(page: Page, attendue: string | undefined, ou: string, erreurs: string[]): Promise<void> {
  if (attendue === undefined) {
    erreurs.push(`${ou} : aucun texte d’IA Station à attendre.`);
    return;
  }
  const encadre = page.getByTestId('ia-station');
  if ((await encadre.count()) !== 1) {
    erreurs.push(`${ou} : encadré d’IA Station absent.`);
    return;
  }
  const lue = (await encadre.locator('.citation-ia .lecteur-seul').allTextContents()).join('\n');
  if (lue !== `«\u00a0${attendue}\u00a0»`) erreurs.push(`${ou} : citation IA Station inattendue : « ${lue} ».`);
  if (((await encadre.locator('.etiquette-ia').textContent()) ?? '').trim() !== '[ IA STATION ]') erreurs.push(`${ou} : étiquette IA Station absente.`);
  const placement = await page.evaluate(() => {
    const recit = document.querySelector('[data-testid="recit"]');
    const dernier = recit?.lastElementChild;
    return {
      apresRecit: dernier instanceof HTMLElement && dernier.dataset.testid === 'ia-station',
      curseurs: document.querySelectorAll('.curseur').length,
      dansEncadre: document.querySelector('[data-testid="ia-station"] .curseur') !== null,
    };
  });
  if (!placement.apresRecit) erreurs.push(`${ou} : l’encadré IA Station ne suit pas le récit.`);
  if (placement.curseurs !== 1 || !placement.dansEncadre) erreurs.push(`${ou} : curseur IA Station mal placé.`);
}

/** Aucun lien ni citation d'IA Station dans le récit en cours de partie, ni cadre ou place vide associés (#139, D-263). */
async function verifierSansLien(page: Page, ou: string, erreurs: string[]): Promise<void> {
  if ((await page.getByTestId('lien-ia').count()) > 0 || (await page.getByTestId('ia-station').count()) > 0) erreurs.push(`${ou} : IA Station parle encore dans le récit.`);
  if ((await page.getByTestId('recit').innerText()).includes('écouteur')) erreurs.push(`${ou} : « écouteur » dans le récit.`);
  const dernier = await page.getByTestId('recit').evaluate((recit) => (recit.lastElementChild as HTMLElement | null)?.tagName);
  if (dernier !== 'P') erreurs.push(`${ou} : le récit ne se termine pas par un paragraphe (${dernier ?? '?'}).`);
}

/**
 * Fenêtre d'IA Station (12 §3.9, D-192) : blanche, messages reçus dans l'ordre, NOUVEAU sur ceux qui n'étaient pas lus, un seul bouton ;
 * le focus y reste ; la croix, IA STATION ou le voile la referment sans rien jouer, le focus revient, le repère s'éteint.
 */
async function verifierFenetreIA(
  page: Page,
  depuis: Locator,
  attendus: readonly (readonly [string | undefined, boolean])[],
  fermeture: 'croix' | 'IA STATION' | 'voile' | 'Échap',
  ou: string,
  erreurs: string[],
  capturer?: () => Promise<unknown>,
): Promise<void> {
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)), actions: await page.getByTestId('sauvegarde').getAttribute('data-actions') };
  await depuis.click();
  const fenetre = page.getByRole('dialog', { name: exactement('IA Station') });
  await fenetre.waitFor();
  const vus = await fenetre
    .locator('.historique-ia li')
    .evaluateAll((messages) => messages.map((message) => `${message.querySelector('.citation-ia')?.textContent ?? ''}${message.querySelector('.nouveau') === null ? '' : ' [NOUVEAU]'}`));
  const voulus = attendus.map(([texte, nouveau]) => `«\u00a0${texte ?? '?'}\u00a0»${nouveau ? ' [NOUVEAU]' : ''}`);
  if (vus.join(' | ') !== voulus.join(' | ')) erreurs.push(`${ou} : fenêtre d’IA Station « ${vus.join(' | ')} » au lieu de « ${voulus.join(' | ')} ».`);
  if (!(await fenetre.locator('.historique-ia li').last().isVisible())) erreurs.push(`${ou} : le dernier message n’est pas visible à l’ouverture.`);
  if ((await fenetre.getByRole('button').count()) !== 1) erreurs.push(`${ou} : la fenêtre d’IA Station n’a pas un seul bouton.`);
  const bord = await fenetre.evaluate((element) => getComputedStyle(element).borderTopColor);
  if (bord !== 'rgb(238, 246, 248)') erreurs.push(`${ou} : contour de la fenêtre ${bord}, pas le blanc d’IA Station.`);
  if (/\d/.test(await fenetre.innerText())) erreurs.push(`${ou} : un chiffre est affiché dans la fenêtre d’IA Station.`);
  await verifierDansEcran(page, ou, erreurs);
  await verifierFocusPiege(page, fenetre, ou, erreurs);
  await fenetre.getByRole('button', { name: exactement('Fermer') }).focus();
  await page.keyboard.press('Tab');
  if (!(await fenetre.locator('.historique-ia').evaluate((element) => element === document.activeElement))) erreurs.push(`${ou} : l'historique n'est pas accessible au clavier depuis la croix.`);
  await capturer?.();
  if (fermeture === 'croix') await fenetre.getByRole('button', { name: exactement('Fermer') }).click();
  else if (fermeture === 'IA STATION') {
    if ((await page.locator('.nav-ia').getAttribute('data-son')) !== 'fermer-ia') erreurs.push(`${ou} : IA STATION ne joue pas le son de fermeture.`);
    await page.locator('.nav-ia').click();
  } else if (fermeture === 'Échap') await page.keyboard.press('Escape');
  else await page.getByTestId('voile').click({ position: { x: 4, y: 4 } });
  await fenetre.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => erreurs.push(`${ou} : ${fermeture} ne ferme pas la fenêtre d’IA Station.`));
  if (!(await depuis.evaluate((element) => element === document.activeElement))) erreurs.push(`${ou} : le focus ne revient pas là où la fenêtre a été ouverte.`);
  await verifierRepere(page, false, `${ou}, après lecture`, erreurs);
  const apres = { partie: await partieEnregistree(page), ...(await lire(page)), actions: await page.getByTestId('sauvegarde').getAttribute('data-actions') };
  if (JSON.stringify(apres) !== JSON.stringify(avant)) erreurs.push(`${ou} : lire IA Station a changé la partie, le récit ou la situation.`);
}

/** Commande enregistrée par le dernier geste : exactement celle du menu moteur (C-01 A-05). */
async function verifierCommande(page: Page, geste: Geste, ou: string, erreurs: string[]): Promise<void> {
  const journal = (JSON.parse(await partieEnregistree(page)) as { enregistrement: { actions: { commande: Commande }[] } }).enregistrement.actions;
  if (JSON.stringify(journal.at(-1)?.commande) !== JSON.stringify(geste.commande)) {
    erreurs.push(`${ou} : enregistré ${JSON.stringify(journal.at(-1)?.commande)} au lieu de ${JSON.stringify(geste.commande)}.`);
  }
}

/** Partie enregistrée, lue : son monde, sa graine et son état ; `null` s'il n'y en a plus. */
async function partieLue(page: Page): Promise<{ enregistrement: { monde: string; graine: number }; etat: Record<string, unknown> } | null> {
  const brute = await partieEnregistree(page);
  return brute === 'null' || brute === 'aucune base' ? null : (JSON.parse(brute) as { enregistrement: { monde: string; graine: number }; etat: Record<string, unknown> });
}

/**
 * Son (15 §5, D-222), dans Chromium : un espion compte les contextes audio et les sources créés. Aucun contexte avant le
 * premier toucher ; un seul ensuite ; puis le nombre exact de sources d'une bulle, d'Échap et d'un segment. Niveau
 * « vérifié automatiquement ».
 */
async function verifierSon(navigateur: Browser, adresse: string, erreurs: string[]): Promise<void> {
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  await contexte.addInitScript(() => {
    const compte = { contextes: 0, sources: 0 };
    (window as unknown as { __sons: typeof compte }).__sons = compte;
    const Vrai = window.AudioContext;
    window.AudioContext = class extends Vrai {
      constructor(options?: AudioContextOptions) {
        super(options);
        compte.contextes += 1;
      }
      override createOscillator(): OscillatorNode {
        compte.sources += 1;
        return super.createOscillator();
      }
      override createBufferSource(): AudioBufferSourceNode {
        compte.sources += 1;
        return super.createBufferSource();
      }
    };
  });
  const page = await contexte.newPage();
  const compte = (): Promise<{ contextes: number; sources: number }> =>
    page.evaluate(() => (window as unknown as { __sons: { contextes: number; sources: number } }).__sons);
  try {
    await page.goto(adresse);
    await page.getByRole('button', { name: /^nouvelle partie$/i }).waitFor();
    if ((await compte()).contextes !== 0) erreurs.push('Son : un contexte audio existe avant le premier toucher.');
    await nouvelleDepuisAccueil(page);
    const apres = await compte();
    if (apres.contextes !== 1) erreurs.push(`Son : ${apres.contextes} contexte(s) audio après les premiers touchers, 1 attendu.`);
    // Un toucher, un son (D-217) : nombre exact de sources par geste (Tic double : 2 ; un tic : 1 ; clic : 2).
    await page.waitForTimeout(PAUSE_JOUEUR_MS);
    const ecart = async (geste: () => Promise<void>): Promise<number> => {
      const avant = (await compte()).sources;
      await geste();
      await page.waitForTimeout(150);
      return (await compte()).sources - avant;
    };
    const bulle = await ecart(() => page.locator(OUVRE_BULLE).first().click());
    if (bulle !== 2) erreurs.push(`Son : ouvrir une bulle fait partir ${bulle} source(s), 2 attendues.`);
    const echap = await ecart(() => page.keyboard.press('Escape'));
    if (echap !== 1) erreurs.push(`Son : Échap qui referme la bulle fait partir ${echap} source(s), 1 attendue.`);
    await page.locator('.engrenage').click();
    await page.getByRole('heading', { name: exactement('Options'), level: 1 }).waitFor();
    const sousMenu = await ecart(async () => {
      await ouvrirSousMenu(page, 'Son et texte');
    });
    if (sousMenu !== 2) erreurs.push(`Son : ouvrir un sous-menu des options fait partir ${sousMenu} source(s), 2 attendues.`);
    const segment = await ecart(() => page.locator('label.segment').getByText('Grande', { exact: true }).click());
    if (segment !== 2) erreurs.push(`Son : toucher un segment fait partir ${segment} source(s), 2 attendues (un seul clic).`);
    const fermeture = await ecart(() => page.keyboard.press('Escape'));
    if (fermeture !== 1) erreurs.push(`Son : Échap qui referme un sous-menu fait partir ${fermeture} source(s), 1 attendue.`);
  } finally {
    await contexte.close();
  }
}

const AGENT_SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const AGENT_FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0';

interface FenetreInvite {
  __invites: string[];
  __repondre: (issue: 'accepted' | 'dismissed') => void;
}

/**
 * Joue ce que fait Chrome quand le jeu est installable : un `beforeinstallprompt` dont `prompt()` ouvre une boîte à laquelle on
 * répond. Script en chaîne : une fonction nommée passée à `evaluate` reçoit l'aide `__name` de la compilation, absente du navigateur.
 */
async function envoyerInvite(page: Page): Promise<void> {
  await page.evaluate(`(() => {
    window.__invites = [];
    const evenement = new Event('beforeinstallprompt', { cancelable: true });
    evenement.prompt = () => {
      window.__invites.push('prompt');
      return Promise.resolve();
    };
    evenement.userChoice = new Promise((resoudre) => {
      window.__repondre = (outcome) => resoudre({ outcome });
    });
    window.dispatchEvent(evenement);
  })()`);
}

/**
 * Options depuis l'accueil, sans partie, ouvertes sur la bulle Application (D-287) ; `avant` joue ce qui doit arriver avant
 * l'ouverture (l'événement d'installation).
 */
async function optionsDepuisAccueilNeuf(page: Page, adresse: string, avant?: (page: Page) => Promise<void>): Promise<void> {
  await page.goto(adresse);
  await page.getByRole('button', { name: exactement('Nouvelle partie') }).waitFor();
  await avant?.(page);
  await page.getByRole('button', { name: exactement('Options') }).click();
  await page.getByRole('heading', { name: exactement('Options'), level: 1 }).waitFor();
  await ouvrirSousMenu(page, 'Application');
}

/**
 * Installation (#174, docs/16) : l'invite du navigateur jouée par un événement simulé (le Chromium des captures est en navigation
 * privée, il n'en envoie pas), puis les aides de Safari sur iPhone et de Firefox sur Android, reconnus à leur agent utilisateur.
 * Sans événement ni agent connu, la section n'existe pas.
 */
async function parcoursInstallation(navigateur: Browser, adresse: string, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const contexteDe = (agent?: string, viewport = REFERENCE, taille?: string): Promise<BrowserContext> =>
    navigateur.newContext({ ...devices[TELEPHONE], ...(agent === undefined ? {} : { userAgent: agent }), viewport, locale: 'fr-FR' }).then(async (contexte) => {
      if (taille !== undefined) await contexte.addInitScript(([cle, valeur]) => window.localStorage.setItem(cle as string, valeur as string), [CLE_REGLAGES, JSON.stringify({ taille })]);
      return contexte;
    });
  const bouton = (page: Page): Locator => page.getByRole('button', { name: /^Installer le jeu/i });
  const sectionAffichee = (page: Page): Promise<number> => page.getByRole('heading', { name: exactement('Installation'), level: 2 }).count();

  // Sans événement ni navigateur connu : pas de section.
  {
    const contexte = await contexteDe();
    try {
      const page = await contexte.newPage();
      await optionsDepuisAccueilNeuf(page, adresse);
      if ((await sectionAffichee(page)) !== 0) erreurs.push('Installation : section affichée sans événement ni navigateur connu.');
    } finally {
      await contexte.close();
    }
  }

  // Chromium : l'événement est retenu, le bouton ouvre la boîte du navigateur, la réponse s'écrit.
  for (const issue of ['dismissed', 'accepted'] as const) {
    const contexte = await contexteDe();
    try {
      const page = await contexte.newPage();
      await optionsDepuisAccueilNeuf(page, adresse, envoyerInvite);
      await bouton(page).waitFor({ timeout: 10_000 });
      if (issue === 'dismissed') {
        await bouton(page).scrollIntoViewIfNeeded();
        await capturer(page, 'Options : installation, invite du navigateur');
        await verifierSansTroncature(page, 'Options : installation', erreurs);
      }
      await bouton(page).click();
      const ouvertes = await page.evaluate(() => (window as unknown as FenetreInvite).__invites.length);
      if (ouvertes !== 1) erreurs.push(`Installation : ${ouvertes} boîte(s) ouverte(s) au toucher, 1 attendue.`);
      if (!(await bouton(page).isDisabled())) erreurs.push('Installation : le bouton reste actif pendant que la boîte est ouverte.');
      await page.evaluate((reponse) => (window as unknown as FenetreInvite).__repondre(reponse), issue);
      const attendu = issue === 'accepted' ? 'Jeu installé. Cherchez-le sur votre écran d’accueil.' : 'Installation refusée. Le menu du navigateur permet de la relancer.';
      await page.getByTestId('installation').getByText(attendu, { exact: true }).waitFor({ timeout: 10_000 });
      if ((await bouton(page).count()) !== 0) erreurs.push(`Installation (${issue}) : le bouton reste après la réponse, l'événement a déjà servi.`);
      const gardes = await page.evaluate(() => Object.keys(window.localStorage).filter((cle) => cle.startsWith('void-walker:installation:')));
      if ((gardes.length > 0) !== (issue === 'accepted')) erreurs.push(`Installation (${issue}) : drapeaux gardés « ${gardes.join(', ')} ».`);
    } finally {
      await contexte.close();
    }
  }

  // Aides pas à pas : même bulle, mêmes fermetures ; quatre étapes, les boutons nommés comme le téléphone les nomme.
  const aides = [
    { nom: 'iPhone', agent: AGENT_SAFARI_IPHONE, mots: ['« Plus »', '« Partager »', '« Sur l’écran d’accueil »', '« Ouvrir comme app web »', '« Ajouter »'] },
    { nom: 'Firefox', agent: AGENT_FIREFOX_ANDROID, mots: ['« Plus »', '« Ajouter l’application à l’écran d’accueil »', '« Ajouter »'] },
  ] as const;
  for (const aide of aides) {
    const contexte = await contexteDe(aide.agent);
    try {
      const page = await contexte.newPage();
      await optionsDepuisAccueilNeuf(page, adresse);
      await bouton(page).waitFor({ timeout: 10_000 });
      await bouton(page).scrollIntoViewIfNeeded();
      await bouton(page).click();
      const dialogue = page.getByRole('dialog', { name: exactement('Installer le jeu') });
      await dialogue.waitFor();
      const etapes = await dialogue.locator('li').allInnerTexts();
      if (etapes.length !== 4) erreurs.push(`Installation, aide ${aide.nom} : ${etapes.length} étapes, 4 attendues.`);
      for (const mot of aide.mots) if (!etapes.join(' ').includes(mot)) erreurs.push(`Installation, aide ${aide.nom} : ${mot} absent des étapes.`);
      await capturer(page, `Options : installation, aide ${aide.nom}`);
      await verifierDansEcran(page, `Installation, aide ${aide.nom}`, erreurs);
      await verifierSansTroncature(page, `Installation, aide ${aide.nom}`, erreurs);
      // Échap, le voile et ✕ referment ; le focus revient sur le bouton (12 §7).
      for (const geste of ['Échap', 'voile', '✕'] as const) {
        if (geste === 'Échap') await page.keyboard.press('Escape');
        else if (geste === 'voile') await page.mouse.click(8, 8);
        else await dialogue.getByRole('button', { name: exactement('Fermer') }).click();
        await dialogue.waitFor({ state: 'hidden' });
        if (!(await bouton(page).evaluate((element) => element === document.activeElement))) erreurs.push(`Installation, aide ${aide.nom} : le focus ne revient pas sur le bouton après ${geste}.`);
        // L'aide s'ouvre par-dessus la bulle Application (D-288) : la refermer laisse celle-ci ouverte.
        if (!(await page.getByRole('dialog', { name: exactement('Application') }).isVisible())) erreurs.push(`Installation, aide ${aide.nom} : ${geste} referme aussi la bulle Application.`);
        if (geste !== '✕') {
          await bouton(page).click();
          await dialogue.waitFor();
        }
      }
    } finally {
      await contexte.close();
    }
  }

  // Écran étroit, texte « très grand » : l'aide la plus longue tient dans l'écran, ses étapes défilent si besoin.
  const etroit = await contexteDe(AGENT_SAFARI_IPHONE, ETROIT, 'tres_grande');
  try {
    const page = await etroit.newPage();
    await optionsDepuisAccueilNeuf(page, adresse);
    await bouton(page).scrollIntoViewIfNeeded();
    await bouton(page).click();
    await page.getByRole('dialog', { name: exactement('Installer le jeu') }).waitFor();
    await capturer(page, 'Options : installation, aide iPhone, écran étroit et texte très grand');
    await verifierDansEcran(page, 'Installation, aide iPhone étroite', erreurs);
    await verifierSansTroncature(page, 'Installation, aide iPhone étroite', erreurs);
    // La dernière étape et la note se lisent en faisant défiler la bulle : elles tombent dans sa boîte, sans rien chevaucher.
    const bulle = page.getByRole('dialog', { name: exactement('Installer le jeu') });
    await bulle.locator('.note-installation').scrollIntoViewIfNeeded();
    const [boite, derniere, note] = await Promise.all([bulle.boundingBox(), bulle.locator('li').last().boundingBox(), bulle.locator('.note-installation').boundingBox()]);
    if (boite === null || derniere === null || note === null) erreurs.push('Installation, aide iPhone étroite : étape ou note introuvable.');
    else {
      if (note.y + note.height > boite.y + boite.height + 1) erreurs.push('Installation, aide iPhone étroite : la note déborde de la bulle.');
      if (derniere.y + derniere.height > note.y + 1) erreurs.push('Installation, aide iPhone étroite : la note chevauche la dernière étape.');
    }
  } finally {
    await etroit.close();
  }
}

/**
 * Options (#96, 12 §4.10, §4.11) dans le monde de test : depuis l'accueil sans partie, puis en cours de partie sans rien changer ;
 * taille « très grande » partout, lignes de balayage coupées, réglages gardés au rechargement ; téléchargement rejoué par le
 * rejoueur ; abandon confirmé dans la page, écran de fin, plus de reprise ; REJOUER CETTE STATION, même départ, nouveaux tirages.
 */
async function parcoursOptions(navigateur: Browser, adresse: string, entree: EntreeMonde, gestes: readonly Geste[], capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR', acceptDownloads: true });
  const page = await contexte.newPage();
  await page.goto(adresse);
  await page.getByRole('button', { name: exactement('Options') }).click();
  await page.getByRole('heading', { name: exactement('Options'), level: 1 }).waitFor();
  for (const absent of [/Abandonner la partie en cours/i, /^Reprendre la partie$/i]) {
    if ((await page.getByRole('button', { name: absent }).count()) > 0) erreurs.push(`Options sans partie : « ${absent.source} » est proposé.`);
  }
  if ((await ligneSousMenu(page, 'Rapports').count()) > 0) {
    await ouvrirSousMenu(page, 'Rapports');
    if ((await page.getByRole('dialog', { name: exactement('Rapports') }).getByRole('button', { name: /^Télécharger ma partie/i }).count()) > 0) erreurs.push('Options sans partie : « Télécharger ma partie » est proposé.');
    await page.keyboard.press('Escape');
  }
  if ((await partieLue(page)) !== null) erreurs.push('Options sans partie : une partie a été créée.');
  await capturer(page, 'Options depuis l’accueil, sans partie');
  await page.getByRole('button', { name: exactement('Menu principal') }).click();
  await page.getByRole('button', { name: exactement('Nouvelle partie') }).waitFor();

  // En cours de partie : ouvrir les options ne change ni la partie, ni le récit, ni la situation.
  await nouvelleDepuisAccueil(page);
  await rejouer(page, gestes.slice(0, 2));
  await page.waitForTimeout(PAUSE_JOUEUR_MS);
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)) };
  await ouvrirOptions(page);
  if (!(await page.getByText('le jeu est en pause', { exact: true }).isVisible())) erreurs.push('Options en partie : « le jeu est en pause » absent.');
  await capturer(page, 'Options en cours de partie');
  await verifierSansTroncature(page, 'Options en cours de partie', erreurs);
  await verifierSousMenus(page, capturer, erreurs);

  // Mise à jour (D-227), dans la bulle Application : le bouton cherche, ne trouve rien de plus récent et le dit ; le pied de page
  // porte la version.
  await ouvrirSousMenu(page, 'Application');
  const chercherMiseAJour = page.getByRole('button', { name: /Chercher une mise à jour/i });
  try {
    await chercherMiseAJour.waitFor({ timeout: 10_000 });
    await chercherMiseAJour.click();
    await page.getByTestId('mise-a-jour').getByText('Le jeu est à jour.', { exact: true }).waitFor({ timeout: 10_000 });
  } catch {
    erreurs.push(`Options : mise à jour « ${((await page.getByTestId('mise-a-jour').textContent().catch(() => null)) ?? 'section absente').trim()} ».`);
  }
  await page.locator('.options .pied').scrollIntoViewIfNeeded();
  await capturer(page, 'Options : mise à jour et numéro de version');
  await page.keyboard.press('Escape');

  // Son (15 §4, D-220, D-223), dans la bulle Son et texte : trois rails à 80, 80 et 60 ; « Ambiance » à 0 au clavier s'écrit
  // COUPÉE et se garde.
  await ouvrirSousMenu(page, 'Son et texte');
  const rails = page.locator('.curseur-rail');
  if ((await rails.count()) !== 3) erreurs.push(`Options : ${await rails.count()} rails de son, 3 attendus.`);
  const niveaux = await rails.evaluateAll((liste) => liste.map((rail) => (rail as HTMLInputElement).value));
  if (niveaux.join(' ') !== '80 80 60') erreurs.push(`Options : rails à ${niveaux.join(', ')}, 80, 80 et 60 attendus.`);
  await rails.nth(2).focus();
  await page.keyboard.press('Home');
  if ((await page.locator('.valeur-rail').nth(2).innerText()).trim() !== 'COUPÉE') erreurs.push('Options : ambiance à 0 sans « COUPÉE ».');
  const sonGarde = await page.evaluate((cle) => JSON.parse(window.localStorage.getItem(cle) ?? '{}') as { ambiance?: number }, CLE_REGLAGES);
  if (sonGarde.ambiance !== 0) erreurs.push(`Options : ambiance gardée à ${String(sonGarde.ambiance)}, 0 attendu.`);
  await page.locator('.rail').first().scrollIntoViewIfNeeded();
  await capturer(page, 'Options : section SON, ambiance coupée');
  await page.keyboard.press('Escape');

  // Télécharger ma partie, dans la bulle Rapports : le fichier se rejoue avec le rejoueur et donne le même état (C-09 S-03, SP-05).
  await ouvrirSousMenu(page, 'Rapports');
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('dialog', { name: exactement('Rapports') }).getByRole('button', { name: /^Télécharger ma partie/i }).click()]);
  const chemin = join(tmpdir(), `void-walker-captures-${process.pid}.json`);
  await telechargement.saveAs(chemin);
  const rapport = rejouerExport(readFileSync(chemin, 'utf8'), versionDuJeu());
  rmSync(chemin, { force: true });
  if (!rapport.identique) erreurs.push(`Téléchargement : le fichier ne se rejoue pas à l’identique.\n${rapport.lignes.join('\n')}`);
  const retour = ((await page.getByTestId('telechargement').textContent()) ?? '').trim();
  if (retour !== `Fichier prêt : ${telechargement.suggestedFilename()}`) erreurs.push(`Téléchargement : retour « ${retour} ».`);
  if ((await partieEnregistree(page)) !== avant.partie) erreurs.push('Télécharger ma partie a modifié la partie enregistrée.');
  await capturer(page, 'Options : sous-menu Rapports, fichier prêt');
  await page.keyboard.press('Escape');

  // Très grande : aperçu à 22 px ; lignes de balayage coupées.
  await choisirTaille(page, 'Très grande');
  if ((await tailleRecit(page)) !== '22px') erreurs.push(`Options : aperçu à ${await tailleRecit(page)} en « très grande ».`);
  await page.getByRole('switch', { name: exactement('Lignes de balayage') }).click();
  if ((await page.locator('.balayage').count()) !== 0) erreurs.push('Lignes de balayage sur [NON] : la couche est toujours là.');
  await capturer(page, 'Options : taille « très grande », lignes de balayage sur [NON]');
  await verifierSansTroncature(page, 'Options, très grande', erreurs);

  // REPRENDRE LA PARTIE, bulle Son et texte ouverte (D-288) : retour au jeu, sans entrée d'historique laissée derrière.
  await page.getByRole('button', { name: exactement('Reprendre la partie') }).click();
  await page.getByTestId('recit').waitFor();
  await page.waitForTimeout(200);
  if (await entreeSousMenuRestee(page)) erreurs.push('REPRENDRE bulle ouverte : l’entrée d’historique du sous-menu reste.');
  const ecriture = await etatEcriture(page);
  if (ecriture.animees > 0 || ecriture.visibles !== ecriture.total) erreurs.push('Retour des options : le récit se réécrit.');
  const apres = { partie: await partieEnregistree(page), ...(await lire(page)) };
  if (JSON.stringify(apres) !== JSON.stringify(avant)) erreurs.push('Ouvrir les options a changé la partie, le récit ou la situation.');
  if ((await tailleRecit(page)) !== '22px') erreurs.push(`Jeu en « très grande » : récit à ${await tailleRecit(page)}.`);
  await capturer(page, 'Jeu en « très grande », sans lignes de balayage');
  await verifierEcran(page, 'Jeu, très grande', erreurs);
  await verifierSansTroncature(page, 'Jeu, très grande', erreurs);
  // Une puce de la pièce, ou l'inventaire quand la pièce n'en a plus (carnet en main).
  await page.locator(`${OUVRE_BULLE}, .navigation .nav-inventaire`).first().click();
  await verifierDansEcran(page, 'Bulle, très grande', erreurs);
  await verifierSansTroncature(page, 'Bulle, très grande', erreurs);
  await capturer(page, 'Bulle en « très grande »');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: exactement('Inventaire') }).click();
  await verifierDansEcran(page, 'Inventaire, très grande', erreurs);
  await verifierSansTroncature(page, 'Inventaire, très grande', erreurs);
  await page.keyboard.press('Escape');
  await page.locator('.nav-ia').click();
  await verifierDansEcran(page, 'IA Station, très grande', erreurs);
  await verifierSansTroncature(page, 'IA Station, très grande', erreurs);
  await capturer(page, 'Fenêtre d’IA Station en « très grande »');
  await page.keyboard.press('Escape');

  // Réglages gardés sur l'appareil ; accueil, options depuis l'accueil et reprise.
  await page.reload();
  await page.getByRole('button', { name: exactement('Reprendre la partie') }).waitFor();
  const garde = await page.locator('.ecran').evaluate((ecran) => ({ taille: (ecran as HTMLElement).dataset.taille, balayage: ecran.querySelector('.balayage') !== null }));
  if (garde.taille !== 'tres_grande' || garde.balayage) erreurs.push(`Après rechargement : réglages ${JSON.stringify(garde)}.`);
  await capturer(page, 'Accueil après rechargement : réglages gardés');
  await verifierSansTroncature(page, 'Accueil, très grande', erreurs);
  await page.getByRole('button', { name: exactement('Options') }).click();
  await page.getByRole('button', { name: exactement('Reprendre la partie') }).click();
  await attendreSauvegarde(page, 2);
  if ((await partieEnregistree(page)) !== avant.partie) erreurs.push('Options depuis l’accueil puis REPRENDRE : la partie a changé.');

  // Abandon : confirmation dans la page ; ANNULER ne change rien.
  await ouvrirOptions(page);
  const abandon = page.getByRole('button', { name: /Abandonner la partie en cours/i });
  await abandon.click();
  await page.getByText('Abandonner ? Cette partie ne pourra pas être reprise.').waitFor();
  await capturer(page, 'Options : confirmation d’abandon');
  await page.getByRole('button', { name: exactement('Annuler') }).click();
  if (!(await abandon.evaluate((element) => element === document.activeElement))) erreurs.push('Abandon annulé : le focus ne revient pas sur le bouton.');
  if ((await partieEnregistree(page)) !== avant.partie) erreurs.push('ANNULER l’abandon a modifié la partie.');
  await abandon.click();
  await page.getByRole('button', { name: exactement('Abandonner') }).click();
  await page.getByRole('heading', { name: exactement('Partie abandonnée.') }).waitFor();
  const fin = await page.getByTestId('fin').innerText();
  // Le récit seulement, sans liste des pièces (D-284).
  if (!fin.includes(entree.textes.observation.terminee)) erreurs.push(`Fin d’abandon : « ${entree.textes.observation.terminee} » absent.`);
  if (/pièces visitées/i.test(fin)) erreurs.push('Fin d’abandon : la liste des pièces visitées est encore là.');
  if (/\d/.test(await page.locator('main').innerText())) erreurs.push('Fin d’abandon : un chiffre est affiché.');
  if ((await partieLue(page)) !== null) erreurs.push('Fin d’abandon : la partie est encore enregistrée.');
  await capturer(page, 'Fin : partie abandonnée (« très grande »)');
  await verifierSansTroncature(page, 'Fin, très grande', erreurs);
  await page.reload();
  await page.getByRole('button', { name: exactement('Nouvelle partie') }).waitFor();
  if ((await page.getByRole('button', { name: exactement('Reprendre la partie') }).count()) !== 0) erreurs.push('Après abandon : la partie se reprend encore.');

  // REJOUER CETTE STATION : même état de départ, nouveaux tirages (D-087, D-088).
  await nouvelleDepuisAccueil(page);
  await rejouer(page, gestes.slice(0, 1));
  const abandonnee = await partieLue(page);
  await ouvrirOptions(page);
  await abandon.click();
  await page.getByRole('button', { name: exactement('Abandonner') }).click();
  await page.getByRole('button', { name: exactement('Rejouer cette station') }).click();
  await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
  const rejouee = await partieLue(page);
  const depart = nouvellePartie(entree.monde, { version: 'gestes', graine: 0 }).etat;
  if (rejouee === null || abandonnee === null) erreurs.push('Rejouer cette station : partie absente.');
  else {
    if (rejouee.enregistrement.graine === abandonnee.enregistrement.graine) erreurs.push('Rejouer cette station : mêmes tirages que la partie abandonnée.');
    if (JSON.stringify({ ...rejouee.etat, generateur: null }) !== JSON.stringify({ ...depart, generateur: null })) erreurs.push('Rejouer cette station : autre état de départ.');
  }
  await contexte.close();
}

/**
 * AR-01 par `?monde=ar-01` (l'adresse nue tire une station, #152) : le parcours P-C joué geste par geste, avec l'étape « OÙ ? » (12 §3.5, §4.6),
 * la parole d'IA Station au réveil (12 §4.2), puis son lien, son repère et sa fenêtre, avant et après reprise (12 §3.9, D-192),
 * et la fin par évacuation ; puis l'étape « OÙ ? » à 320 px de large.
 */
async function parcoursAr01(navigateur: Browser, adresse: string, ar01: EntreeMonde, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const etapes = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-C'))?.etapes;
  if (etapes === undefined) {
    erreurs.push('Parcours P-C absent d’AR-01.');
    return;
  }
  const gestes = gestesDuParcours(ar01, etapes);
  const { assistance, observation: phrases } = ar01.textes;
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await page.goto(adresse);
  await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
  await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
  await verifierParole(page, assistance.reveil, 'Réveil AR-01', erreurs);
  await capturer(page, 'AR-01 — Réveil : citation IA Station encadrée');
  await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
  await attendreSauvegarde(page, 0);
  const depart = nomDe(ar01.textes, observer(ar01.monde, nouvellePartie(ar01.monde, { version: 'gestes', graine: 0 }).etat).piece).texte;
  const piece = ((await page.locator('.titre-piece').textContent()) ?? '').trim();
  if (piece !== depart) erreurs.push(`?monde=ar-01 : pièce « ${piece} » au lieu de « ${depart} », le départ d’AR-01.`);
  await verifierRepere(page, true, 'Départ', erreurs);
  await capturer(page, 'AR-01 — Départ : IA Station nouvelle');
  await verifierEcran(page, 'AR-01, départ', erreurs);

  for (const [index, geste] of gestes.entries()) {
    const ou = `Étape ${index + 1}, ${geste.titre}`;
    const etape = etapes[index];
    await ouvrir(page, geste);
    if (geste.direct) {
      await toucherLigne(page, geste);
    } else {
      if (geste.parametre !== null) {
        await versQuestion(page, geste);
        const question = page.getByRole('dialog', { name: exactement(filQuestion(geste)) });
        await question.waitFor();
        if (!(await question.getByRole('heading', { name: exactement('Où ?') }).isVisible())) erreurs.push(`${ou} : « OÙ ? » absent.`);
        // « ‹ » ramène aux actions ; on revient à « OÙ ? ».
        await question.getByRole('button', { name: exactement('Étape précédente') }).click();
        await page
          .getByRole('dialog', { name: exactement(geste.bulle) })
          .waitFor({ timeout: 5_000 })
          .catch(() => erreurs.push(`${ou} : « ‹ » ne ramène pas de « OÙ ? » aux actions.`));
        await versQuestion(page, geste);
        await question.waitFor();
        if (geste.zone === 'piece') {
          const titre = `AR-01 — Bulle « ${geste.bouton} », étape « OÙ ? »`;
          await capturer(page, titre);
          await verifierEcran(page, titre, erreurs);
          await verifierDansEcran(page, titre, erreurs);
        }
      }
      let confirmer = geste.parametre === null ? await versApercu(page, geste) : await versConfirmer(page, geste);
      await confirmer.waitFor();
      if (geste.parametre !== null) {
        // « ‹ » ramène de l'aperçu à « OÙ ? ».
        await page.getByRole('dialog', { name: exactement(geste.fil) }).getByRole('button', { name: exactement('Étape précédente') }).click();
        await page
          .getByRole('dialog', { name: exactement(filQuestion(geste)) })
          .waitFor({ timeout: 5_000 })
          .catch(() => erreurs.push(`${ou} : « ‹ » ne ramène pas de l’aperçu à « OÙ ? ».`));
        confirmer = await versConfirmer(page, geste);
        await confirmer.waitFor();
        if (geste.zone === 'inventaire') {
          const titre = `AR-01 — Aperçu « ${geste.fil} »`;
          await capturer(page, titre);
          await verifierEcran(page, titre, erreurs);
          await verifierDansEcran(page, titre, erreurs);
        }
      }
      await confirmer.click();
    }
    await attendreSauvegarde(page, index + 1);
    if (geste.direct && (await page.getByRole('dialog').count()) > 0) erreurs.push(`${ou} : une bulle reste ouverte après un seul toucher.`);
    await verifierCommande(page, geste, ou, erreurs);
    await verifierNoms(page, { ...geste, titre: ou }, erreurs);
    if (index === gestes.length - 1) break;
    await verifierEcran(page, ou, erreurs);
    if (geste.versInconnue) {
      // Passage sans signalétique franchi : la pièce d'arrivée est nommée, IA Station parle ; le lien ouvre sa fenêtre (D-147, D-192).
      await verifierSansLien(page, ou, erreurs);
      await verifierRepere(page, true, ou, erreurs);
      await verifierRythmeRepere(page, ou, erreurs);
      await verifierRepereReduit(page, index + 1, ou, erreurs);
      const boite = await page.locator('.nav-ia').boundingBox();
      await capturer(page, `AR-01 — Par « → ${geste.bouton} » : « ${geste.rappel} », repère sur IA STATION`);
      await verifierFenetreIA(page, page.locator('.nav-ia'), [[assistance.reveil, true], [assistance.energie, true]], 'croix', `${ou}, fenêtre par le bouton`, erreurs, () =>
        capturer(page, 'AR-01 — Fenêtre d’IA Station : deux messages nouveaux'),
      );
      // Le repère disparu, le bouton garde sa place et sa taille, donc sa zone tactile.
      if (JSON.stringify(await page.locator('.nav-ia').boundingBox()) !== JSON.stringify(boite)) erreurs.push(`${ou} : le bouton IA STATION a bougé ou changé de taille à la lecture.`);
      // Après reprise : mêmes messages, aucun nouveau, toujours rien dans le récit.
      await page.reload();
      await reprendreDepuisAccueil(page, index + 1);
      await verifierSansLien(page, `${ou}, après reprise`, erreurs);
      await verifierRepere(page, false, `${ou}, après reprise`, erreurs);
      await verifierFenetreIA(page, page.locator('.nav-ia'), [[assistance.reveil, false], [assistance.energie, false]], 'IA STATION', `${ou}, fermeture par un second appui sur IA STATION`, erreurs);
      await verifierFenetreIA(page, page.locator('.nav-ia'), [[assistance.reveil, false], [assistance.energie, false]], 'voile', `${ou}, après reprise, par IA STATION`, erreurs, () =>
        capturer(page, 'AR-01 — Fenêtre d’IA Station après reprise : messages lus'),
      );
    } else await verifierSansLien(page, ou, erreurs);
    if (etape?.action === 'ouvrir' && etape.cible === 'cloison' && etape.vers === 'observation') {
      const situation = (await lire(page)).situation;
      if (!situation.includes(phrases.creatureATerre)) erreurs.push(`${ou} : « ${phrases.creatureATerre} » absent de la situation.`);
      await capturer(page, `AR-01 — ${geste.titre} : créature à terre`);
    }
    if (etape?.action === 'installer') await capturer(page, `AR-01 — ${geste.titre}`);
  }

  // Fin par évacuation : seize actions (D-196), le dernier texte et CONTINUER seul à la place du dock (D-286).
  const actions = await page.getByTestId('sauvegarde').getAttribute('data-actions');
  if (actions !== '16') erreurs.push(`Fin : ${actions ?? '?'} actions au lieu de 16.`);
  const fin = page.locator('.dock.fin-partie');
  if ((await fin.innerText()).trim().toLowerCase() !== 'continuer') erreurs.push(`Fin : dock « ${await fin.innerText()} » au lieu de CONTINUER seul.`);
  if ((await page.locator('.dock .puce, .dock .deplacements').count()) > 0) erreurs.push('Fin : le dock de la pièce est encore là.');
  if (await page.locator('.navigation').isVisible()) erreurs.push('Fin : INVENTAIRE est encore proposé.');
  // Sans navigation, le message de départ s'écrit en entier dans le récit, encadré comme au réveil, sans lien (D-263).
  await verifierParole(page, assistance.depart, 'Fin', erreurs);
  if ((await page.getByTestId('lien-ia').count()) > 0 || ((await page.getByTestId('recit').innerText()).includes('écouteur'))) erreurs.push('Fin : un lien « parle dans l’écouteur » est encore dans le récit.');
  await capturer(page, 'AR-01 — Écran de fin, avant : dernier texte, message de départ, CONTINUER');
  await verifierEcran(page, 'AR-01, fin', erreurs);
  const partie = await partieJouee(page, ar01);
  await fin.getByRole('button', { name: exactement('Continuer') }).click();
  await verifierFin(page, ar01, partie, 'AR-01, écran de fin', erreurs);
  await capturer(page, 'AR-01 — Écran de fin : évacuation (P-C)');
  // Rouvrir le jeu ramène à l'écran de fin (C-09 S-05, D-286).
  await page.reload();
  await page.getByRole('button', { name: /^reprendre la partie$/i }).click();
  await verifierFin(page, ar01, partie, 'AR-01, écran de fin après réouverture', erreurs);
  await contexte.close();

  // Départ au format du téléphone du porteur, puis à 320 × 568 où le dock défile au-dessous de six lignes de récit (D-191).
  for (const ecran of [PORTEUR, ETROIT]) {
    const autre = await navigateur.newContext({ ...devices[TELEPHONE], viewport: ecran, locale: 'fr-FR' });
    const vue = await autre.newPage();
    await vue.goto(adresse);
    await nouvelleDepuisAccueil(vue);
    const titre = `AR-01 — Départ, ${ecran.width} × ${ecran.height}`;
    await capturer(vue, titre);
    await verifierEcran(vue, titre, erreurs);
    await verifierPied(vue, titre, erreurs);
    if (ecran === PORTEUR && (await partage(vue))?.defile !== false) erreurs.push(`${titre} : les boutons du départ ne sont pas tous visibles.`);
    if (ecran === ETROIT) {
      // Taille « très grande » sur le plus petit écran : rien de coupé, six lignes de récit, le dock défile (12 §7, D-191).
      await ouvrirOptions(vue);
      await choisirTaille(vue, 'Très grande');
      await capturer(vue, `AR-01 — Options en « très grande », ${ecran.width} × ${ecran.height}`);
      await verifierSansTroncature(vue, `Options AR-01, très grande, ${ecran.width} px`, erreurs);
      await vue.getByRole('button', { name: exactement('Reprendre la partie') }).click();
      const grand = `AR-01 — Départ en « très grande », ${ecran.width} × ${ecran.height}`;
      await vue.getByTestId('recit').waitFor();
      await capturer(vue, grand);
      await verifierEcran(vue, grand, erreurs);
      await verifierSansTroncature(vue, grand, erreurs);
      // En-tête le plus chargé, posé à la main dans la page : nom de pièce long et « !! CRITIQUE » ; rien ne sort de l'écran.
      await vue.evaluate(() => {
        const titre = document.querySelector('.entete-piece .titre-piece');
        if (titre === null) return;
        titre.textContent = 'Salle d’embarquement';
        const badge = document.createElement('p');
        badge.className = 'badge-sante critique';
        badge.textContent = '!! CRITIQUE';
        titre.after(badge);
      });
      const charge = `AR-01 — En-tête simulé « Salle d’embarquement » et « !! CRITIQUE », très grande, ${ecran.width} px`;
      await capturer(vue, charge);
      await verifierEcran(vue, charge, erreurs);
      await verifierSansTroncature(vue, charge, erreurs);
      const engrenage = await vue.locator('.engrenage').boundingBox();
      if (engrenage === null || engrenage.x + engrenage.width > ecran.width) erreurs.push(`${charge} : l’engrenage sort de l’écran.`);
    }
    await autre.close();
  }

  // Étape « OÙ ? » à 320 px de large.
  const caisse = gestes.findIndex((geste) => geste.zone === 'piece' && geste.parametre !== null);
  const question = gestes[caisse];
  if (question === undefined) {
    erreurs.push('Aucun geste à paramètre dans la pièce pour l’essai à 320 px.');
    return;
  }
  const etroit = await navigateur.newContext({ ...devices[TELEPHONE], viewport: ETROIT, locale: 'fr-FR' });
  const petite = await etroit.newPage();
  await petite.goto(adresse);
  await nouvelleDepuisAccueil(petite);
  await rejouer(petite, gestes.slice(0, caisse));
  await ouvrir(petite, question);
  await versQuestion(petite, question);
  await petite.getByRole('dialog', { name: exactement(filQuestion(question)) }).waitFor();
  const titre = `AR-01 — Bulle « ${question.bouton} », étape « OÙ ? », ${ETROIT.width} px de large`;
  await capturer(petite, titre);
  await verifierEcran(petite, titre, erreurs);
  await verifierDansEcran(petite, titre, erreurs);
  await etroit.close();
}

/** Danger signalé dans le récit avec son alarme (#138, D-233) : jusqu'à l'étape qui le montre, puis le vérifier et le capturer. */
interface DangerACapturer {
  readonly adresse: string;
  readonly entree: EntreeMonde;
  readonly parcours: string;
  readonly etape: (etape: EtapeParcours) => boolean;
  /** Titre des captures : « AR-01 — Feu découvert », suivi du mode d'animation. */
  readonly nom: string;
  readonly texte: RegExp;
}

/** La ligne du danger, seule, en rouge derrière un triangle qui clignote ; fixe quand le téléphone demande moins d'animations. */
async function dangerSignale(navigateur: Browser, danger: DangerACapturer, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const etapes = danger.entree.parcours.find((parcours) => parcours.nom.startsWith(danger.parcours))?.etapes;
  const rang = etapes?.findIndex(danger.etape) ?? -1;
  if (etapes === undefined || rang === -1) {
    erreurs.push(`${danger.nom} : parcours ${danger.parcours} ou étape absents.`);
    return;
  }
  const gestes = gestesDuParcours(danger.entree, etapes).slice(0, rang + 1);
  for (const reduit of [false, true]) {
    const ou = reduit ? `${danger.nom}, mouvement réduit` : danger.nom;
    const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR', reducedMotion: reduit ? 'reduce' : 'no-preference' });
    const page = await contexte.newPage();
    await page.goto(danger.adresse);
    await nouvelleDepuisAccueil(page);
    await rejouer(page, gestes);
    const alertes = page.getByTestId('alerte');
    if ((await alertes.count()) !== 1) {
      erreurs.push(`${ou} : ${await alertes.count()} ligne(s) d’alerte au lieu d’une.`);
      await contexte.close();
      continue;
    }
    const style = await alertes.evaluate((ligne) => {
      const icone = ligne.querySelector('.icone-alerte');
      const vue = icone === null ? null : getComputedStyle(icone);
      return {
        texte: ligne.textContent ?? '',
        couleur: getComputedStyle(ligne).color,
        icone: vue === null ? null : { couleur: vue.color, animation: vue.animationName, duree: vue.animationDuration },
      };
    });
    if (!danger.texte.test(style.texte)) erreurs.push(`${ou} : la ligne d’alerte ne décrit pas le danger (« ${style.texte} »).`);
    if (style.couleur !== 'rgb(255, 90, 74)' || style.icone?.couleur !== 'rgb(255, 90, 74)') erreurs.push(`${ou} : couleurs ${JSON.stringify(style)}.`);
    const attendue = reduit ? 'none' : 'alerte';
    if (style.icone?.animation !== attendue) erreurs.push(`${ou} : animation du triangle « ${style.icone?.animation ?? 'absent'} » au lieu de « ${attendue} ».`);
    if (!reduit && style.icone?.duree !== '0.5s') erreurs.push(`${ou} : cycle du triangle ${style.icone?.duree ?? '?'} au lieu de 0.5s.`);
    await capturer(page, reduit ? `${danger.nom}, mouvement réduit : triangle fixe` : `${danger.nom} : ligne en rouge, triangle clignotant`);
    await verifierEcran(page, ou, erreurs);
    await contexte.close();
  }
}

/**
 * AR-02 par `?monde=ar-02` : P-V1 joué geste par geste, dans un contexte neuf ; captures du départ, de la combinaison enfilée,
 * de l'aperçu de « percer », de la brèche, de l'arrivée devant le corps inerte et de la fin.
 */
async function parcoursAr02(navigateur: Browser, racine: string, ar02: EntreeMonde, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const etapes = ar02.parcours.find((parcours) => parcours.nom.startsWith('P-V1'))?.etapes;
  if (etapes === undefined) {
    erreurs.push('Parcours P-V1 absent d’AR-02.');
    return;
  }
  const gestes = gestesDuParcours(ar02, etapes);
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await page.goto(`${racine}?monde=ar-02`);
  await nouvelleDepuisAccueil(page);
  await capturer(page, 'AR-02 — Départ');
  await verifierEcran(page, 'AR-02, départ', erreurs);
  for (const [index, geste] of gestes.entries()) {
    const ou = `Étape ${index + 1}, ${geste.titre}`;
    const etape = etapes[index];
    if (geste.direct) {
      await ouvrir(page, geste);
      await toucherLigne(page, geste);
    } else {
      const confirmer = await preparer(page, geste);
      await confirmer.waitFor();
      if (etape?.action === 'percer') {
        const titre = `AR-02 — Aperçu « ${geste.fil} »`;
        await capturer(page, titre);
        await verifierDansEcran(page, titre, erreurs);
      }
      await confirmer.click();
    }
    await attendreSauvegarde(page, index + 1);
    await verifierCommande(page, geste, ou, erreurs);
    await verifierNoms(page, { ...geste, titre: ou }, erreurs);
    if (index === gestes.length - 1) break;
    await verifierEcran(page, ou, erreurs);
    const corps = etape?.action === 'aller' && etape.vers === 'embarquement';
    if (etape?.action === 'enfiler' || etape?.action === 'percer' || corps) await capturer(page, `AR-02 — ${geste.titre}`);
  }
  const actions = await page.getByTestId('sauvegarde').getAttribute('data-actions');
  if (actions !== String(gestes.length)) erreurs.push(`Fin : ${actions ?? '?'} actions au lieu de ${gestes.length}.`);
  const fin = page.locator('.dock.fin-partie');
  if ((await fin.innerText()).trim().toLowerCase() !== 'continuer') erreurs.push(`Fin : dock « ${await fin.innerText()} » au lieu de CONTINUER seul.`);
  await verifierEcran(page, 'AR-02, fin', erreurs);
  const partie = await partieJouee(page, ar02);
  await fin.getByRole('button', { name: exactement('Continuer') }).click();
  await verifierFin(page, ar02, partie, 'AR-02, écran de fin', erreurs);
  await capturer(page, 'AR-02 — Écran de fin : évacuation sur la réserve (P-V1)');
  await contexte.close();
}

/** Aucun chiffre sur la carte, aucun texte qui déborde de sa pièce, puis les règles de tout écran : cibles de 44 px, pas de débordement (12 §1, §7). */
async function verifierCarte(page: Page, ou: string, erreurs: string[]): Promise<void> {
  if (/\d/.test(await page.locator('.carte').innerText())) erreurs.push(`${ou} : un chiffre est affiché sur la carte.`);
  const debordent = await page
    .locator('.carte-piece')
    .evaluateAll((boutons) =>
      boutons.filter((bouton) => bouton.scrollWidth > bouton.clientWidth + 1 || bouton.scrollHeight > bouton.clientHeight + 1).map((bouton) => bouton.getAttribute('aria-label') ?? ''),
    );
  for (const piece of debordent) erreurs.push(`${ou} : le texte de « ${piece} » déborde de sa pièce (PL-04).`);
  await verifierEcran(page, ou, erreurs);
}

/**
 * Carte (#97, 14 §2) : au départ d'AR-01 puis après les cinq premiers pas de P-C (le passager est au local énergie) ; glisser,
 * fiche au clavier, liste, retour système, texte très grand ; AR-02 pour les voyants d'air. Gratuite (D-014).
 */
async function parcoursCarte(navigateur: Browser, racine: string, ar01: EntreeMonde, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const etapes = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-C'))?.etapes;
  if (etapes === undefined) {
    erreurs.push('Parcours P-C absent d’AR-01.');
    return;
  }
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await page.goto(`${racine}?monde=ar-01`);
  await nouvelleDepuisAccueil(page);
  const bouton = page.locator('.nav-carte');
  const carte = page.getByRole('dialog', { name: MOTS_CARTE.titrePlan });
  const focusSur = (cible: Locator): Promise<boolean> => cible.evaluate((element) => element === document.activeElement);
  // La zone du plan se mesure après l'ouverture : on attend les pièces dessinées avant de compter ou de capturer.
  const ouvrirCarte = async (): Promise<void> => {
    await bouton.click();
    await carte.locator('.carte-piece').first().waitFor();
  };

  // Départ : le salon et ses deux sorties (K-01) ; fermer par Échap ne change rien et rend le focus à CARTE.
  const avant = await partieEnregistree(page);
  await ouvrirCarte();
  await capturer(page, 'Carte — départ d’AR-01');
  // Bulle comme l'inventaire (D-215) : marges autour, la navigation reste visible dessous.
  const bulle = await carte.boundingBox();
  const nav = await page.locator('.navigation').boundingBox();
  if (bulle === null || nav === null || bulle.x < 8 || bulle.y < 8 || bulle.y + bulle.height > nav.y) erreurs.push('Carte : pas posée en bulle au-dessus de la navigation.');
  await verifierCarte(page, 'Carte, départ', erreurs);
  const pieces = await carte.locator('.carte-piece').count();
  if (pieces !== 3) erreurs.push(`Carte, départ : ${pieces} pièces au lieu de trois (salon, atelier, local technique).`);
  await page.keyboard.press('Escape');
  await carte.waitFor({ state: 'detached' });
  if (!(await focusSur(bouton))) erreurs.push('Carte fermée par Échap : le focus ne revient pas sur CARTE.');
  // Retour système : même chose.
  await ouvrirCarte();
  await page.evaluate(() => window.history.back());
  await carte.waitFor({ state: 'detached' });
  if (!(await focusSur(bouton))) erreurs.push('Carte fermée par le retour système : le focus ne revient pas sur CARTE.');
  if ((await partieEnregistree(page)) !== avant) erreurs.push('Carte : l’ouvrir et la fermer a changé la partie (D-014).');

  // Cinq pas de P-C : atelier, burette, caisse sous la grille, grille ouverte puis franchie.
  await rejouer(page, gestesDuParcours(ar01, etapes).slice(0, 5));
  await ouvrirCarte();
  await capturer(page, 'Carte — au local énergie : pièces visitées, connues, panneau « ? »');
  await verifierCarte(page, 'Carte, local énergie', erreurs);

  // Glisser fait parcourir le plan, sans ouvrir de fiche.
  const actuelle = carte.locator('.carte-piece[data-statut="actuelle"]');
  const debut = await actuelle.boundingBox();
  if (debut === null) erreurs.push('Carte : pièce actuelle introuvable.');
  else {
    await page.mouse.move(debut.x + debut.width / 2, debut.y + debut.height / 2);
    await page.mouse.down();
    await page.mouse.move(debut.x + debut.width / 2 - 60, debut.y + debut.height / 2 - 40, { steps: 6 });
    await page.mouse.up();
    const fin = await actuelle.boundingBox();
    if (fin === null || Math.abs(fin.x - (debut.x - 60)) > 2 || Math.abs(fin.y - (debut.y - 40)) > 2) erreurs.push('Carte : glisser ne déplace pas le plan.');
    if ((await page.getByRole('dialog').count()) !== 1) erreurs.push('Carte : un glissement a ouvert une fiche.');
  }

  // Au clavier, une pièce sortie de l'écran par un glissement y revient quand elle prend le focus, sans faire défiler la
  // zone ni décaler le dessin (12 §7).
  const atelierVu = carte.getByRole('button', { name: /^Atelier maintenance, vu/ });
  const zonePlan = carte.locator('.carte-zone');
  const centre = await zonePlan.boundingBox();
  if (centre !== null) {
    await page.mouse.move(centre.x + centre.width / 2, centre.y + centre.height / 2);
    await page.mouse.down();
    await page.mouse.move(centre.x + centre.width / 2, centre.y + centre.height / 2 - 450, { steps: 8 });
    await page.mouse.up();
  }
  await atelierVu.focus();
  const defile = await zonePlan.evaluate((zone) => zone.scrollLeft !== 0 || zone.scrollTop !== 0);
  if (defile) erreurs.push('Carte : le focus clavier fait défiler la zone du plan et décale le dessin.');
  const visible = await atelierVu.boundingBox();
  if (centre === null || visible === null || visible.x < centre.x || visible.y < centre.y || visible.x + visible.width > centre.x + centre.width || visible.y + visible.height > centre.y + centre.height) {
    erreurs.push('Carte : la pièce qui prend le focus reste hors de l’écran.');
  }

  // Lecteur d'écran : après un glissement, un toucher activé sans nouvel appui (clic sans pointerdown) ouvre quand même la fiche
  // au second essai ; seul le clic qui termine le glissement est ignoré.
  const salle = carte.locator('.carte-piece[data-statut="actuelle"]');
  const boite = await salle.boundingBox();
  if (boite !== null) {
    await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
    await page.mouse.down();
    await page.mouse.move(boite.x + boite.width / 2 - 20, boite.y + boite.height / 2, { steps: 4 });
    await page.mouse.up();
  }
  for (let fois = 0; fois < 2; fois++) await atelierVu.evaluate((bouton) => bouton.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 })));
  const ficheLecteur = page.getByRole('dialog', { name: 'ATELIER MAINTENANCE' });
  if ((await ficheLecteur.count()) === 0) erreurs.push('Carte : après un glissement, une activation de lecteur d’écran n’ouvre plus de fiche.');
  else {
    await page.keyboard.press('Escape');
    await ficheLecteur.waitFor({ state: 'detached' });
  }

  // Fiche de l'atelier, au clavier ; Échap la ferme et rend le focus à la pièce.
  const atelier = carte.getByRole('button', { name: /^Atelier maintenance, vu/ });
  await atelier.focus();
  await page.keyboard.press('Enter');
  const fiche = page.getByRole('dialog', { name: 'ATELIER MAINTENANCE' });
  await fiche.waitFor();
  await capturer(page, 'Carte — fiche de l’atelier : état vu, objets vus');
  if (!(await fiche.innerText()).includes(MOTS_CARTE.objetsVus)) erreurs.push('Fiche : « OBJETS VUS » absent.');
  await page.keyboard.press('Escape');
  await fiche.waitFor({ state: 'detached' });
  if (!(await focusSur(atelier))) erreurs.push('Fiche fermée : le focus ne revient pas sur la pièce.');

  // Vue LISTE, puis retour au plan et fermeture.
  await carte.getByRole('button', { name: MOTS_CARTE.liste, exact: true }).click();
  await page.getByRole('dialog', { name: MOTS_CARTE.titreListe }).waitFor();
  await capturer(page, 'Carte — vue liste');
  await verifierCarte(page, 'Carte, liste', erreurs);
  await page.getByRole('button', { name: MOTS_CARTE.plan, exact: true }).click();
  await carte.getByRole('button', { name: exactement('Fermer') }).click();
  await carte.waitFor({ state: 'detached' });

  // Texte très grand : noms et étiquettes tiennent ou s'effacent, rien ne déborde.
  await ouvrirOptions(page);
  await choisirTaille(page, 'Très grande');
  await page.getByRole('button', { name: exactement('Reprendre la partie') }).click();
  await page.getByTestId('recit').waitFor();
  await ouvrirCarte();
  await capturer(page, 'Carte — texte très grand');
  await verifierCarte(page, 'Carte, texte très grand', erreurs);
  await carte.getByRole('button', { name: exactement('Fermer') }).click();
  await contexte.close();

  // AR-02 au départ : voyants d'air sur les portes étanches (OP-04).
  const autre = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page02 = await autre.newPage();
  await page02.goto(`${racine}?monde=ar-02`);
  await nouvelleDepuisAccueil(page02);
  await page02.locator('.nav-carte').click();
  await page02.getByRole('dialog', { name: MOTS_CARTE.titrePlan }).locator('.carte-piece').first().waitFor();
  if ((await page02.locator('.carte .voyant').count()) === 0) erreurs.push('AR-02 : aucun voyant d’air sur la carte.');
  await capturer(page02, 'Carte — départ d’AR-02 : voyants d’air');
  await verifierCarte(page02, 'Carte, AR-02', erreurs);
  await autre.close();
}

/** Monde de la partie enregistrée ; « aucune partie » s'il n'y en a pas. */
async function mondeLu(page: Page): Promise<string> {
  return (await partieLue(page))?.enregistrement.monde ?? 'aucune partie';
}

/** Pièce du réveil d'un monde, en mots. */
function departDe({ monde, textes }: EntreeMonde): string {
  return nomDe(textes, observer(monde, nouvellePartie(monde, { version: 'gestes', graine: 0 }).etat).piece).texte;
}

/**
 * Plus courte partie de M-08 sans dé ni blessure où plus aucune sortie n'est possible (G-03) : la planche posée cède sous la
 * créature, le passager resté du mauvais côté. Aucun dé : elle se rejoue quelle que soit la graine.
 */
export function gestesSansSortie(entree: EntreeMonde): Geste[] | null {
  const vus = new Set<string>();
  let frontiere: { partie: Partie; chemin: Geste[] }[] = [{ partie: nouvellePartie(entree.monde, { version: 'gestes', graine: 0 }), chemin: [] }];
  while (frontiere.length > 0) {
    const suivante: { partie: Partie; chemin: Geste[] }[] = [];
    for (const { partie, chemin } of frontiere) {
      const observation = observer(entree.monde, partie.etat);
      if (observation.sansSortie) return chemin;
      const cle = cleEtatRegles(partie.etat);
      if (vus.has(cle) || observation.terminee) continue;
      vus.add(cle);
      for (const option of observation.menu.filter((choix) => choix.disponible && choix.action !== 'regarder')) {
        const resultat = jouer(entree.monde, partie, option.commande);
        if (resultat.type !== 'engagee' || resultat.tirages.length > 0 || resultat.partie.etat.sante !== partie.etat.sante) continue;
        suivante.push({ partie: resultat.partie, chemin: [...chemin, gesteDe(entree, partie, observation, option)] });
      }
    }
    frontiere = suivante;
  }
  return null;
}

/**
 * « Plus aucune sortie » (#156, 12 §5.2) : `?monde=m-08`, la planche perdue exprès ; l'information du jeu, CONTINUER À JOUER,
 * le rappel en tête du récit, la partie qui continue ; options puis retour ne rouvrent pas l'information (D-144).
 */
async function parcoursSansSortie(navigateur: Browser, racine: string, m08: EntreeMonde, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const chemin = gestesSansSortie(m08);
  if (chemin === null) {
    erreurs.push('M-08 : aucune partie sans dé où la planche se perd.');
    return;
  }
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await page.goto(`${racine}?monde=m-08`);
  await nouvelleDepuisAccueil(page);
  const information = page.getByRole('alertdialog', { name: exactement('Plus aucune sortie possible.') });
  await rejouer(page, chemin.slice(0, -1));
  if ((await information.count()) !== 0) erreurs.push('Plus aucune sortie : information avant la perte de la planche.');
  await rejouer(page, chemin.slice(-1), chemin.length - 1);
  await information.waitFor();
  await capturer(page, 'Plus aucune sortie — information du jeu');
  // Le texte du jeu, rien d'autre : aucune sortie nommée (D-085).
  const attendu = 'Information du jeu Plus aucune sortie possible. Plus aucun chemin ne mène à une capsule de secours. Vous pouvez continuer à jouer et explorer la station. Continuer à jouer Terminer la partie la partie s’arrête ici';
  const lu = await information.innerText();
  if (lu.replace(/\s+/g, '').toLowerCase() !== attendu.replace(/\s+/g, '').toLowerCase()) erreurs.push(`Plus aucune sortie : information « ${lu} ».`);
  // Le focus est dans l'information à son ouverture et n'en sort pas au clavier (12 §7).
  if (!(await information.evaluate((element) => element.contains(document.activeElement)))) erreurs.push('Plus aucune sortie : le focus n’est pas dans l’information.');
  await verifierFocusPiege(page, information, 'Plus aucune sortie', erreurs);
  await information.getByRole('button', { name: exactement('Continuer à jouer') }).click();
  await information.waitFor({ state: 'detached' });
  if (!(await page.getByTestId('recit').evaluate((element) => element === document.activeElement))) erreurs.push('Plus aucune sortie : le focus ne revient pas au récit.');
  const rappel = page.getByTestId('sans-sortie');
  if (((await rappel.textContent()) ?? '').trim() !== '[ plus aucune sortie possible ]') erreurs.push('Plus aucune sortie : rappel absent après CONTINUER À JOUER.');
  if ((await page.locator('.dock .autour').count()) === 0) erreurs.push('Plus aucune sortie : la partie ne continue pas.');
  await capturer(page, 'Plus aucune sortie — rappel, la partie continue');
  await verifierEcran(page, 'Plus aucune sortie, rappel', erreurs);
  await ouvrirOptions(page);
  await page.getByRole('button', { name: /^reprendre la partie$/i }).click();
  await rappel.waitFor();
  if ((await information.count()) !== 0) erreurs.push('Plus aucune sortie : l’information revient après les options.');
  await contexte.close();
}

/**
 * Stations tirées (#152), chacune dans un contexte neuf : `?station=<identifiant>` (réveil, plan au départ, NOUVELLE PARTIE garde
 * la station), puis la station à trois obstacles avec la baie (#153, réveil et plan au départ) ; l'adresse nue (REJOUER garde la
 * station tirée, NOUVELLE PARTIE en tire une autre et mène au réveil, la partie se reprend sur sa station, `?monde=ar-01` garde
 * la sienne) ; `?station=` refusé, avec son motif.
 */
async function parcoursStation(navigateur: Browser, racine: string, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const exacte = CATALOGUE.resoudre(STATION_CAPTUREE);
  if ('refus' in exacte) {
    erreurs.push(`${STATION_CAPTUREE} : ${exacte.refus}`);
    return;
  }
  const regarder = (page: Page): Locator => page.getByRole('button', { name: /^regarder autour de vous$/i });
  /**
   * Intro de NOUVELLE PARTIE (D-305) : une station tirée y passe avant le réveil. Un toucher l'amène à son état final, DÉMARRER mène
   * au réveil. `titre` : l'état final est aussi capturé, et son texte vérifié (numéro, total, erreur en rouge).
   */
  const passerIntro = async (page: Page, ou: string, titre?: string): Promise<void> => {
    const intro = page.getByRole('main', { name: 'Tirage de la station' });
    await intro.or(regarder(page)).first().waitFor();
    if ((await intro.count()) === 0) {
      erreurs.push(`${ou} : pas d’intro avant le réveil.`);
      return;
    }
    await intro.click({ position: { x: 24, y: 24 } });
    const demarrer = page.getByRole('button', { name: exactement('Démarrer') });
    await demarrer.waitFor();
    const lu = (await intro.innerText()).replace(/\s+/g, ' ');
    const numero = /Station (\d+) sur (\d+)/.exec(lu);
    if (numero === null || Number(numero[2]) !== COMPOSITIONS_PUBLIEES.length) erreurs.push(`${ou}, intro : « Station N sur ${COMPOSITIONS_PUBLIEES.length} » absent.`);
    if ((await intro.locator('.intro-menace', { hasText: 'ERREUR : Menace détectée' }).count()) !== 1) erreurs.push(`${ou}, intro : ligne de l’erreur absente.`);
    if (titre !== undefined) await capturer(page, titre);
    await demarrer.click();
    await regarder(page).waitFor();
    const rappel = ((await page.locator('.numero-station').textContent()) ?? '').trim();
    if (numero !== null && rappel !== `Station ${numero[1]}`) erreurs.push(`${ou}, réveil : rappel « ${rappel} » au lieu de « Station ${numero[1]} ».`);
  };
  /** Du réveil au jeu : la pièce affichée est celle du départ de `entree`. */
  const verifierDepart = async (page: Page, entree: EntreeMonde | null, ou: string): Promise<void> => {
    await regarder(page).click();
    await attendreSauvegarde(page, 0);
    const piece = ((await page.locator('.titre-piece').textContent()) ?? '').trim();
    if (entree !== null && piece !== departDe(entree)) erreurs.push(`${ou} : pièce « ${piece} » au lieu de « ${departDe(entree)} ».`);
  };
  /** Du jeu à l'écran de fin, par l'abandon des options. */
  const abandonnerPartie = async (page: Page): Promise<void> => {
    await ouvrirOptions(page);
    await page.getByRole('button', { name: /Abandonner la partie en cours/i }).click();
    await page.getByRole('button', { name: exactement('Abandonner') }).click();
    await page.getByRole('heading', { name: exactement('Partie abandonnée.') }).waitFor();
  };
  /** Station tirée de la partie enregistrée ; `null`, avec une erreur, si ce n'en est pas une. */
  const stationTiree = async (page: Page, ou: string): Promise<{ readonly id: string; readonly entree: EntreeMonde | null }> => {
    const id = await mondeLu(page);
    const entree = CATALOGUE.resoudre(id);
    if (FORME_STATION.test(id) && !('refus' in entree)) return { id, entree };
    erreurs.push(`${ou} : partie enregistrée sur « ${id} », pas sur une station tirée.`);
    return { id, entree: null };
  };

  /** `?station=<id>` dans un contexte neuf : cette station, son réveil et son plan au départ ; la page reste au jeu, plan refermé. */
  const forcer = async (id: string, entree: EntreeMonde, reveil = `Station tirée — réveil : ${id} par l’adresse`): Promise<{ readonly contexte: BrowserContext; readonly page: Page }> => {
    const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    const page = await contexte.newPage();
    await page.goto(`${racine}?station=${id}`);
    await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
    await passerIntro(page, `?station=${id}`);
    if ((await mondeLu(page)) !== id) erreurs.push(`?station=${id} : partie sur « ${await mondeLu(page)} ».`);
    await verifierParole(page, entree.textes.assistance.reveil, `?station=${id}, réveil`, erreurs);
    await capturer(page, reveil);
    await verifierDepart(page, entree, `?station=${id}, départ`);
    await verifierEcran(page, `?station=${id}, départ`, erreurs);
    const carte = page.getByRole('dialog', { name: MOTS_CARTE.titrePlan });
    await page.locator('.nav-carte').click();
    await carte.locator('.carte-piece').first().waitFor();
    await capturer(page, `Station tirée — plan au départ : ${id}`);
    await verifierCarte(page, `?station=${id}, plan au départ`, erreurs);
    await page.keyboard.press('Escape');
    await carte.waitFor({ state: 'detached' });
    return { contexte, page };
  };

  // `?station=<identifiant>` : cette station, son réveil et son plan au départ ; NOUVELLE PARTIE la garde.
  const { contexte: forcee, page } = await forcer(STATION_CAPTUREE, exacte);
  await abandonnerPartie(page);
  await page.getByRole('button', { name: exactement('Nouvelle partie') }).click();
  await passerIntro(page, `?station=${STATION_CAPTUREE}, NOUVELLE PARTIE`);
  if ((await mondeLu(page)) !== STATION_CAPTUREE) erreurs.push(`?station=${STATION_CAPTUREE}, NOUVELLE PARTIE : partie sur « ${await mondeLu(page)} ».`);
  await forcee.close();

  // Station à trois obstacles avec la baie (#153) : son réveil et son plan au départ.
  const baie = CATALOGUE.resoudre(STATION_BAIE);
  if ('refus' in baie) erreurs.push(`${STATION_BAIE} : ${baie.refus}`);
  else await (await forcer(STATION_BAIE, baie)).contexte.close();

  // Chemins d'AR-01 (#154) : le réveil de la première station.
  const ar01 = CATALOGUE.resoudre(STATIONS_AR01[0]);
  if ('refus' in ar01) erreurs.push(`${STATIONS_AR01[0]} : ${ar01.refus}`);
  else await (await forcer(STATIONS_AR01[0], ar01, `Réveil — chemins d’AR-01 ${STATIONS_AR01[0]}`)).contexte.close();

  // Ordre libre (#155) : réveil et plan, puis le témoin du vérifieur rejoué comme le joueur jusqu'au couloir commun, où la
  // première cloison est verrouillée, puis jusqu'à la première commande actionnée.
  const libre = CATALOGUE.resoudre(STATION_LIBRE);
  if ('refus' in libre) erreurs.push(`${STATION_LIBRE} : ${libre.refus}`);
  else {
    const etapes = verifierLibre(libre).parcours?.etapes ?? [];
    const gestes = gestesDuParcours(libre, etapes);
    const couloir = etapes.findIndex((etape) => etape.action === 'aller' && etape.vers === 'couloir_commun');
    const commande = etapes.findIndex((etape) => etape.action === 'actionner');
    const { contexte, page: pageLibre } = await forcer(STATION_LIBRE, libre, `Ordre libre — réveil ${STATION_LIBRE}`);
    if (couloir < 0 || commande < couloir) erreurs.push(`${STATION_LIBRE} : témoin sans arrivée au couloir commun puis commande actionnée.`);
    else {
      await rejouer(pageLibre, gestes.slice(0, couloir + 1));
      // En cours de partie, le repère du bouton IA STATION annonce le message, sans citation dans le récit (D-263).
      if ((await pageLibre.locator('.nav-ia .notification-ia').count()) !== 1) erreurs.push(`${STATION_LIBRE}, couloir commun : repère d’IA Station absent.`);
      await capturer(pageLibre, `Ordre libre — couloir commun : deux ailes, première cloison verrouillée`);
      await rejouer(pageLibre, gestes.slice(couloir + 1, commande + 1), couloir + 1);
      await capturer(pageLibre, `Ordre libre — première commande actionnée`);
      await verifierEcran(pageLibre, `${STATION_LIBRE}, commande actionnée`, erreurs);
    }
    await contexte.close();
  }

  // Adresse nue : une station tirée ; REJOUER CETTE STATION la garde, avec d'autres tirages et le même départ.
  const nue = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const pageNue = await nue.newPage();
  await pageNue.goto(racine);
  await pageNue.getByRole('button', { name: /^nouvelle partie$/i }).click();
  await passerIntro(pageNue, 'Adresse nue', 'Intro de NOUVELLE PARTIE — station tirée parmi les autres, DÉMARRER');
  const premiere = await stationTiree(pageNue, 'Adresse nue');
  if (premiere.entree !== null) await verifierParole(pageNue, premiere.entree.textes.assistance.reveil, 'Adresse nue, réveil', erreurs);
  await verifierDepart(pageNue, premiere.entree, 'Adresse nue, départ');
  const abandonnee = await partieLue(pageNue);
  await abandonnerPartie(pageNue);
  await pageNue.getByRole('button', { name: exactement('Rejouer cette station') }).click();
  await regarder(pageNue).waitFor();
  const rejouee = await partieLue(pageNue);
  if (rejouee === null || abandonnee === null) erreurs.push('Adresse nue, REJOUER CETTE STATION : partie absente.');
  else {
    if (rejouee.enregistrement.monde !== premiere.id) erreurs.push(`Adresse nue, REJOUER CETTE STATION : « ${rejouee.enregistrement.monde} » au lieu de « ${premiere.id} ».`);
    if (rejouee.enregistrement.graine === abandonnee.enregistrement.graine) erreurs.push('Adresse nue, REJOUER CETTE STATION : mêmes tirages que la partie abandonnée.');
    if (JSON.stringify({ ...rejouee.etat, generateur: null }) !== JSON.stringify({ ...abandonnee.etat, generateur: null })) erreurs.push('Adresse nue, REJOUER CETTE STATION : autre état de départ.');
  }
  await capturer(pageNue, `Station tirée — rejouer : même station ${premiere.id}, nouveaux tirages`);

  // NOUVELLE PARTIE depuis la fin : une autre station tirée, et son réveil, pas l'accueil.
  await verifierDepart(pageNue, premiere.entree, 'Adresse nue, départ rejoué');
  await abandonnerPartie(pageNue);
  await pageNue.getByRole('button', { name: exactement('Nouvelle partie') }).click();
  await passerIntro(pageNue, 'Adresse nue, NOUVELLE PARTIE depuis la fin');
  const seconde = await stationTiree(pageNue, 'Adresse nue, NOUVELLE PARTIE');
  if (seconde.id === premiere.id) erreurs.push(`Adresse nue, NOUVELLE PARTIE : la même station ${seconde.id}.`);
  if (seconde.entree !== null) await verifierParole(pageNue, seconde.entree.textes.assistance.reveil, 'Adresse nue, NOUVELLE PARTIE, réveil', erreurs);
  await capturer(pageNue, `Station tirée — nouvelle partie : ${seconde.id} après ${premiere.id}, écran de réveil`);

  // Rechargée, la partie se reprend sur sa station ; NOUVELLE PARTIE confirmée à l'accueil en tire une autre.
  await pageNue.reload();
  await reprendreDepuisAccueil(pageNue, 0);
  if ((await mondeLu(pageNue)) !== seconde.id) erreurs.push(`Adresse nue, reprise : partie sur « ${await mondeLu(pageNue)} » au lieu de « ${seconde.id} ».`);
  const reprise = ((await pageNue.locator('.titre-piece').textContent()) ?? '').trim();
  if (seconde.entree !== null && reprise !== departDe(seconde.entree)) erreurs.push(`Adresse nue, reprise : pièce « ${reprise} » au lieu de « ${departDe(seconde.entree)} ».`);
  await pageNue.reload();
  await pageNue.getByRole('button', { name: exactement('Nouvelle partie') }).click();
  await pageNue.getByRole('button', { name: exactement('Commencer') }).click();
  await passerIntro(pageNue, 'Adresse nue, NOUVELLE PARTIE à l’accueil');
  const troisieme = await stationTiree(pageNue, 'Adresse nue, NOUVELLE PARTIE à l’accueil');
  if (troisieme.id === seconde.id) erreurs.push(`Adresse nue, NOUVELLE PARTIE à l’accueil : la même station ${troisieme.id}.`);

  // En dernier : `?monde=ar-01` ouvre sa propre base, et la partie lue ne saurait plus de quelle base elle vient.
  await pageNue.goto(`${racine}?monde=ar-01`);
  await pageNue.getByRole('button', { name: /^nouvelle partie$/i }).waitFor();
  if ((await pageNue.getByRole('button', { name: /^reprendre la partie$/i }).count()) !== 0) erreurs.push('?monde=ar-01 : la partie de l’adresse nue s’y reprend.');
  await nue.close();

  // `?station=` refusé : l'accueil, le motif du catalogue tel quel, NOUVELLE PARTIE indisponible et seule.
  const refusee = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const pageRefus = await refusee.newPage();
  await pageRefus.goto(`${racine}?station=m07-m03-inconnue-1`);
  const alerte = pageRefus.getByRole('alert');
  await alerte.waitFor();
  const motif = (await alerte.innerText()).trim();
  if (motif !== 'Station refusée : Station inconnue : m07-m03-inconnue-1.') erreurs.push(`Station refusée : motif « ${motif} ».`);
  if ((await pageRefus.locator('.titre-accueil').textContent())?.replace(/\s/g, '') !== 'VOIDWALKER▮') erreurs.push('Station refusée : titre de l’accueil absent.');
  const boutons = await pageRefus.getByRole('button').count();
  if (boutons !== 1 || !(await pageRefus.getByRole('button', { name: exactement('Nouvelle partie') }).isDisabled())) {
    erreurs.push(`Station refusée : ${boutons} bouton(s) ; NOUVELLE PARTIE, indisponible, attendu seul.`);
  }
  if ((await partieLue(pageRefus)) !== null) erreurs.push('Station refusée : une partie est enregistrée.');
  await capturer(pageRefus, 'Station refusée : motif à l’accueil, NOUVELLE PARTIE indisponible');
  await verifierEcran(pageRefus, 'Station refusée', erreurs);
  await refusee.close();
}

/**
 * Plans des stations (14 §4.3) : rendu d'auteur de chaque monde, montré au porteur avant fusion, et de la station à trois
 * obstacles avec la baie (`STATION_BAIE`) ; puis une galerie de stations tirées (#153), six par groupe (un ou deux chemins,
 * M-03 ou M-06), chacune d'une composition publiée du groupe tirée au hasard.
 */
async function capturerPlans(navigateur: Browser, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const contexte = await navigateur.newContext({ viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  const dessiner = async (id: string, entree: EntreeMonde, titre: string): Promise<void> => {
    try {
      await page.setContent(`<!doctype html><html lang="fr"><body style="margin:0;background:#050A06">${dessinerPlan(entree)}</body></html>`);
      await capturer(page, titre);
    } catch (erreur) {
      erreurs.push(`${id} : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }
  };
  for (const [id, entree] of Object.entries(CATALOGUE.mondes)) await dessiner(id, entree, `Plan — ${id}`);
  const baie = CATALOGUE.resoudre(STATION_BAIE);
  if ('refus' in baie) erreurs.push(`${STATION_BAIE} : ${baie.refus}`);
  else await dessiner(STATION_BAIE, baie, `Plan — station à trois obstacles avec la baie ${STATION_BAIE}`);
  for (const id of STATIONS_AR01) {
    const station = CATALOGUE.resoudre(id);
    if ('refus' in station) erreurs.push(`${id} : ${station.refus}`);
    else await dessiner(id, station, `Plan — chemins d’AR-01 ${id}`);
  }
  const libre = CATALOGUE.resoudre(STATION_LIBRE);
  if ('refus' in libre) erreurs.push(`${STATION_LIBRE} : ${libre.refus}`);
  else await dessiner(STATION_LIBRE, libre, `Plan — ordre libre ${STATION_LIBRE}`);
  const sas = CATALOGUE.resoudre(STATION_SAS);
  if ('refus' in sas) erreurs.push(`${STATION_SAS} : ${sas.refus}`);
  else await dessiner(STATION_SAS, sas, `Plan — sas de sécurité ${STATION_SAS}`);
  let etat = generateurDepuisGraine(GRAINE_GALERIE);
  const hasard = (): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
  // En chaîne seulement : la galerie reste celle de L3 et L4 ; l'ordre libre a son propre plan, ci-dessus.
  const publiees = CATALOGUE.compositions.filter(({ id, forme }) => forme === 'chaine' && COMPOSITIONS_PUBLIEES.includes(id));
  for (const final of ['m-03', 'm-06']) {
    for (const longueur of [1, 2]) {
      const groupe = publiees.filter((composition) => composition.final === final && composition.chemins.length === longueur);
      for (let rang = 0; rang < STATIONS_PAR_GROUPE; rang++) {
        const composition = groupe[hasard() % groupe.length]?.id;
        if (composition === undefined) {
          erreurs.push(`Aucune composition publiée à ${longueur} chemin(s) et final ${final}.`);
          break;
        }
        const station = CATALOGUE.tirer(hasard, composition);
        if ('refus' in station) erreurs.push(`${composition} : ${station.refus}`);
        else await dessiner(station.monde.id, station, `Plan — station ${station.monde.id}`);
      }
    }
  }
  await contexte.close();
}

/** Partie enregistrée par l'appli, relue par le moteur. */
async function partieJouee(page: Page, entree: EntreeMonde): Promise<Partie> {
  const brute = await partieEnregistree(page);
  const { enregistrement } = JSON.parse(brute) as Partie;
  let partie = nouvellePartie(entree.monde, { version: enregistrement.version, graine: enregistrement.graine });
  for (const { commande } of enregistrement.actions) {
    const resultat = jouer(entree.monde, partie, commande);
    if (resultat.type !== 'engagee') throw new Error(`Partie enregistrée : ${commande.action} non engagée au rejeu.`);
    partie = resultat.partie;
  }
  return partie;
}

/**
 * Écran de fin d'une défaite ou d'une évacuation (12 §4.11, D-281 à D-286) : le titre a le focus, le récit est celui que le
 * moteur relit dans la partie, la mort en `accent`, IA Station au départ ; ni liste des pièces ni chiffre ; quatre boutons au
 * plus, dans l'ordre.
 */
async function verifierFin(page: Page, entree: EntreeMonde, partie: Partie, ou: string, erreurs: string[]): Promise<void> {
  const recit = recitDeFin(entree, partie);
  const ecran = page.getByTestId('fin');
  await page.getByRole('heading', { name: exactement(recit.titre) }).waitFor();
  const focus = await page.evaluate(() => document.activeElement?.className ?? '');
  if (focus !== 'titre-fin') erreurs.push(`${ou} : le focus est sur « ${focus} » et non sur le titre.`);
  const lus = await ecran.locator('.recit .lecteur-seul').allTextContents();
  const attendus = [...recit.paragraphes, ...recit.assistance.map((message) => `«\u00a0${message}\u00a0»`)];
  if (JSON.stringify(lus) !== JSON.stringify(attendus)) erreurs.push(`${ou} : récit « ${lus.join(' | ')} » au lieu de « ${attendus.join(' | ')} ».`);
  const defaite = observer(entree.monde, partie.etat).issue === 'defaite';
  const cause = await ecran.locator('.recit .cause .lecteur-seul').allTextContents();
  if (JSON.stringify(cause) !== JSON.stringify(defaite ? recit.paragraphes.slice(-1) : [])) erreurs.push(`${ou} : phrase en accent « ${cause.join(' | ')} ».`);
  if ((await ecran.locator('.parole-ia').count()) !== (recit.assistance.length > 0 ? 1 : 0)) erreurs.push(`${ou} : encadré d’IA Station ${recit.assistance.length > 0 ? 'absent' : 'présent'}.`);
  const texte = await page.locator('main').innerText();
  if (texte.includes(entree.textes.observation.terminee) !== defaite) erreurs.push(`${ou} : « ${entree.textes.observation.terminee} » ${defaite ? 'absent' : 'présent'}.`);
  if (/pièces visitées/i.test(texte) || /\d/.test(texte)) erreurs.push(`${ou} : liste des pièces ou chiffre affiché.`);
  const boutons = (await page.locator('.actions-fin button').allInnerTexts()).map((libelle) => libelle.trim().toLowerCase()).filter((libelle) => libelle !== 'envoyer ma partie');
  if (JSON.stringify(boutons) !== JSON.stringify(['rejouer cette station', 'nouvelle partie', 'menu principal'])) erreurs.push(`${ou} : boutons ${JSON.stringify(boutons)}.`);
  if ((await page.locator('.navigation').count()) > 0) erreurs.push(`${ou} : la navigation est encore là.`);
  await verifierEcran(page, ou, erreurs);
}

/** Écrit une partie dans la base de l'appli ouverte, comme le ferait sa dernière action. */
async function deposerPartie(page: Page, partie: Partie): Promise<void> {
  await page.evaluate(async (donnees) => {
    const nom = (await indexedDB.databases()).find((base) => base.name?.startsWith('void-walker:') === true)?.name;
    if (nom === undefined) throw new Error('Base IndexedDB absente.');
    const base = await new Promise<IDBDatabase>((resoudre, rejeter) => {
      const demande = indexedDB.open(nom);
      demande.onsuccess = () => resoudre(demande.result);
      demande.onerror = () => rejeter(demande.error ?? new Error('IndexedDB'));
    });
    await new Promise<void>((resoudre, rejeter) => {
      const transaction = base.transaction('parties', 'readwrite');
      transaction.objectStore('parties').put(donnees, 'en-cours');
      transaction.oncomplete = () => resoudre();
      transaction.onerror = () => rejeter(transaction.error ?? new Error('IndexedDB'));
    });
    base.close();
  }, JSON.parse(JSON.stringify(partie)) as unknown);
}

/** Défaites à capturer, une par cause (D-282) ; la créature se joue dans le navigateur, CONTINUER compris. */
const CAUSES_CAPTUREES: readonly CleMort[] = ['feu', 'froid', 'vide'];

/** Plus courte partie de bot finie par chaque cause, sur AR-02 puis des stations tirées à graine fixe : toujours la même. */
export function defaitesParCause(stations = 150): Map<CleMort, { readonly entree: EntreeMonde; readonly adresse: string; readonly commandes: readonly Commande[]; readonly graine: number }> {
  const trouvees = new Map<CleMort, { entree: EntreeMonde; adresse: string; commandes: readonly Commande[]; graine: number }>();
  const essayer = (entree: EntreeMonde, adresse: string, partie: Partie): void => {
    const defaite = partie.derniers.find((evenement) => evenement.type === 'defaite');
    if (defaite?.type !== 'defaite') return;
    const cause = cleMort(defaite.causes);
    const deja = trouvees.get(cause);
    if (!CAUSES_CAPTUREES.includes(cause) || (deja !== undefined && deja.commandes.length <= partie.enregistrement.actions.length)) return;
    trouvees.set(cause, { entree, adresse, commandes: partie.enregistrement.actions.map(({ commande }) => commande), graine: partie.enregistrement.graine });
  };
  const ar02 = MONDES['ar-02'];
  if (ar02 !== undefined) for (let graine = 0; graine < 40; graine++) essayer(ar02, '?monde=ar-02', jouerAvecBot(ar02, creerBot('aleatoire', 900 + graine), 700 + graine).partie);
  let etat = generateurDepuisGraine(20261018);
  const hasard = (): number => {
    const tirage = suivant(etat);
    etat = tirage.etat;
    return tirage.valeur;
  };
  for (let rang = 0; rang < stations; rang++) {
    const station = CATALOGUE.tirer(hasard);
    if ('refus' in station) throw new Error(station.refus);
    const graine = hasard();
    for (const profil of PROFILS) essayer(station, `?station=${station.monde.id}`, jouerAvecBot(station, creerBot(profil, rang * PROFILS.length + PROFILS.indexOf(profil)), graine).partie);
  }
  return trouvees;
}

/**
 * Écrans de fin (#208) : une défaite par la créature jouée geste par geste dans le monde de test (dernier texte, CONTINUER,
 * l'écran de fin, la reprise sur la fin, REJOUER) ; puis le feu, le froid et le vide, chaque partie de bot déposée dans la
 * base de l'appli et reprise depuis l'accueil.
 */
async function parcoursFins(navigateur: Browser, racine: string, monde: EntreeMonde, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const chemin: Geste[] = [];
  let partie = nouvellePartie(monde.monde, { version: 'gestes', graine: 0 });
  for (const [action, cible] of [['ouvrir', 'porte'], ['prendre', 'carnet'], ['poser', 'carnet'], ['prendre', 'carnet'], ['poser', 'carnet'], ['prendre', 'carnet']] as const) {
    const observation = observer(monde.monde, partie.etat);
    const option = observation.menu.find((choix) => choix.action === action && choix.cible.nom === cible && choix.disponible);
    if (option === undefined) throw new Error(`Monde de test : ${action} ${cible} introuvable.`);
    chemin.push(gesteDe(monde, partie, observation, option));
    const resultat = jouer(monde.monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`Monde de test : ${action} non engagé.`);
    partie = resultat.partie;
  }
  const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  await page.goto(`${racine}?monde=monde-test`);
  await nouvelleDepuisAccueil(page);
  await rejouer(page, chemin);
  const dock = page.locator('.dock.fin-partie');
  if ((await dock.innerText()).trim().toLowerCase() !== 'continuer') erreurs.push(`Défaite : dock « ${await dock.innerText()} » au lieu de CONTINUER seul.`);
  await capturer(page, 'Écran de fin, avant : dernier texte de la défaite et CONTINUER (monde de test)');
  const jouee = await partieJouee(page, monde);
  if (observer(monde.monde, jouee.etat).issue !== 'defaite') erreurs.push('Défaite : la partie du navigateur ne finit pas par une défaite.');
  await dock.getByRole('button', { name: exactement('Continuer') }).click();
  await verifierFin(page, monde, jouee, 'Écran de fin, défaite par la créature', erreurs);
  await capturer(page, 'Écran de fin : défaite, créature (monde de test)');
  await page.reload();
  await page.getByRole('button', { name: /^reprendre la partie$/i }).click();
  await verifierFin(page, monde, jouee, 'Écran de fin après réouverture', erreurs);
  // REJOUER CETTE STATION : même départ, nouveaux tirages (D-087, D-088).
  await page.getByRole('button', { name: exactement('Rejouer cette station') }).click();
  await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
  const rejouee = await partieLue(page);
  if (rejouee === null || rejouee.enregistrement.graine === jouee.enregistrement.graine) erreurs.push('Rejouer après une défaite : mêmes tirages ou partie absente.');
  else if (JSON.stringify({ ...rejouee.etat, generateur: null }) !== JSON.stringify({ ...nouvellePartie(monde.monde, { version: 'gestes', graine: 0 }).etat, generateur: null })) {
    erreurs.push('Rejouer après une défaite : autre état de départ.');
  }
  await contexte.close();

  const defaites = defaitesParCause();
  for (const cause of CAUSES_CAPTUREES) {
    const trouvee = defaites.get(cause);
    if (trouvee === undefined) {
      erreurs.push(`Aucune partie de bot morte par « ${cause} » à capturer.`);
      continue;
    }
    const neuf = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    const vue = await neuf.newPage();
    await vue.goto(`${racine}${trouvee.adresse}`);
    await nouvelleDepuisAccueil(vue);
    // La partie du bot, refaite avec la version de l'appli : seule la version change, pas les tirages.
    const { version } = (JSON.parse(await partieEnregistree(vue)) as Partie).enregistrement;
    let finie = nouvellePartie(trouvee.entree.monde, { version, graine: trouvee.graine });
    for (const commande of trouvee.commandes) {
      const resultat = jouer(trouvee.entree.monde, finie, commande);
      if (resultat.type !== 'engagee') throw new Error(`Défaite « ${cause} » : ${commande.action} non engagée.`);
      finie = resultat.partie;
    }
    await deposerPartie(vue, finie);
    await vue.reload();
    await vue.getByRole('button', { name: /^reprendre la partie$/i }).click();
    await verifierFin(vue, trouvee.entree, finie, `Écran de fin, défaite par « ${cause} »`, erreurs);
    await capturer(vue, `Écran de fin : défaite, ${cause} (${trouvee.entree.monde.id})`);
    await neuf.close();
  }
}

/** Une partie du commentaire : bilan, images, puis texte affiché à chaque étape. */
function partieCommentaire(titre: string, etapes: readonly EtapeCapture[], erreurs: readonly string[], details: readonly string[]): string[] {
  const images = process.env.CAPTURES_URL ?? '';
  const commit = process.env.COMMIT ?? '';
  const suffixe = commit === '' ? '' : `?v=${commit.slice(0, 7)}`;
  const lignes = [
    `### ${titre}`,
    '',
    erreurs.length === 0 ? `**${titre} : réussi.**` : `**${titre} : ÉCHEC.**\n\n${erreurs.map((erreur) => `- ${erreur}`).join('\n')}`,
    ...details,
    '',
    etapes.map((etape) => `<img src="${images}${etape.image}${suffixe}" width="200" alt="${etape.titre}">`).join(' '),
    '',
    '<details><summary>Texte affiché à chaque étape</summary>',
    '',
  ];
  for (const etape of etapes) {
    lignes.push(`#### ${etape.titre}`, '', ...(etape.partage === '' ? [] : [`_${etape.partage}_`, '']), ...etape.recit.split('\n').map((ligne) => `> ${ligne}`), '', '```text', etape.situation, '```', '');
  }
  lignes.push('</details>', '');
  return lignes;
}

function commentaire(
  etapes: readonly EtapeCapture[],
  erreurs: readonly string[],
  erreursAr01: readonly string[],
  erreursAr02: readonly string[],
  erreursPlans: readonly string[],
  erreursCarte: readonly string[],
  erreursStation: readonly string[],
  erreursFins: readonly string[],
  installable: string,
  horsLigne: string,
): string {
  const adresse = process.env.VERSION_URL ?? '';
  const commit = process.env.COMMIT ?? '';
  const publiees = etapes.filter((etape) => etape.image !== '');
  const lignes = [
    '<!-- void-walker:version-de-test -->',
    '## Version de test',
    '',
    adresse === '' ? 'Adresse : (publication locale)' : `**Adresse :** ${adresse}`,
    commit === '' ? '' : `Commit \`${commit.slice(0, 7)}\``,
    '',
    `Captures d’un navigateur automatique sur téléphone simulé (${TELEPHONE}, ${REFERENCE.width} × ${REFERENCE.height} puis ${ETROIT.width} px de large ; départ d’AR-01 aussi en ${PORTEUR.width} × ${PORTEUR.height}). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.`,
    '',
    ...partieCommentaire(
      'Parcours du monde de test',
      publiees.filter((etape) => etape.suite === 'monde-test'),
      erreurs,
      ['Adresse : `?monde=monde-test`.', `Installation : ${installable}`, `Hors ligne : ${horsLigne}`],
    ),
    ...partieCommentaire(
      'AR-01, parcours P-C',
      publiees.filter((etape) => etape.suite === 'ar-01'),
      erreursAr01,
      ['Adresse : `?monde=ar-01`, partie neuve, joué geste par geste.'],
    ),
    ...partieCommentaire(
      'AR-02, parcours P-V1',
      publiees.filter((etape) => etape.suite === 'ar-02'),
      erreursAr02,
      ['Adresse : `?monde=ar-02`, partie neuve, joué geste par geste.'],
    ),
    ...partieCommentaire(
      'Carte (#97)',
      publiees.filter((etape) => etape.suite === 'carte'),
      erreursCarte,
      ['AR-01 au départ et au local énergie (cinq pas de P-C), fiche, liste, texte très grand ; AR-02 au départ. **Validation humaine requise** sur téléphone : lisibilité, gestes, bornes du zoom (14 §9).'],
    ),
    ...partieCommentaire(
      'Stations tirées (#152)',
      publiees.filter((etape) => etape.suite === 'station'),
      erreursStation,
      [
        `\`?station=${STATION_CAPTUREE}\` : réveil, plan au départ, NOUVELLE PARTIE garde la station. \`?station=${STATION_BAIE}\`, trois obstacles avec la baie (#153) : réveil, plan au départ. \`?station=${STATIONS_AR01[0]}\`, chemins d’AR-01 (#154) : réveil, plan au départ. Adresse nue : station tirée, REJOUER la garde, NOUVELLE PARTIE en tire une autre et mène au réveil, reprise sur sa station, \`?monde=ar-01\` à part. \`?station=m07-m03-inconnue-1\` : refusée avec son motif. \`?monde=m-08\`, planche perdue exprès (#156) : information « plus aucune sortie », puis le rappel, la partie continue.`,
      ],
    ),
    ...partieCommentaire(
      'Écrans de fin (#208)',
      publiees.filter((etape) => etape.suite === 'fins'),
      erreursFins,
      [
        'Défaite par la créature jouée geste par geste dans `?monde=monde-test` : dernier texte et CONTINUER, l’écran de fin, la réouverture qui y ramène, REJOUER. Feu, froid et vide : la plus courte partie des bots morte de chaque cause, déposée dans la base de l’appli et reprise depuis l’accueil. Évacuations : fins de P-C (AR-01) et de P-V1 (AR-02) ci-dessus. **Validation humaine requise** sur téléphone, pour chaque fin.',
      ],
    ),
    ...partieCommentaire(
      'Plans des stations (#97)',
      publiees.filter((etape) => etape.suite === 'plans'),
      erreursPlans,
      [
        `Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. Puis la station à trois obstacles avec la baie, \`${STATION_BAIE}\` (#153). Puis les chemins d’AR-01 (#154), M-01, M-02, M-04 et M-05 : ${STATIONS_AR01.map((id) => `\`${id}\``).join(', ')}. Puis l’ordre libre, \`${STATION_LIBRE}\` (#155), et le sas de sécurité M-11, \`${STATION_SAS}\` (#203). Puis ${STATIONS_PAR_GROUPE} stations tirées par groupe (#153), au hasard à graine fixe : final M-03 à un puis deux chemins, final M-06 à un puis deux chemins. À juger par le porteur avant fusion.`,
      ],
    ),
  ];
  return lignes.join('\n');
}

/** Dans la PR, seules les captures demandées par sa ligne « Captures : motif ; motif » sont publiées ; hors CI, toutes. Les vérifications tournent toujours. */
const MOTIFS = process.env.PR_BODY === undefined ? null : (/^Captures\s*:\s*(.+)$/im.exec(process.env.PR_BODY)?.[1] ?? '').split(';').map((motif) => motif.trim().toLowerCase()).filter((motif) => motif !== '');

function voulue(titre: string): boolean {
  return MOTIFS === null || MOTIFS.some((motif) => titre.toLowerCase().includes(motif));
}

export async function capturer(): Promise<{ etapes: EtapeCapture[]; erreurs: string[] }> {
  // Le parcours du monde de test se joue par `?monde=monde-test`, AR-01 par `?monde=ar-01` ; l'adresse nue tire une station (#152).
  const entree = MONDES['monde-test'];
  const ar01 = MONDES['ar-01'];
  const ar02 = MONDES['ar-02'];
  if (entree === undefined || ar01 === undefined || ar02 === undefined) throw new Error('Monde de test, AR-01 ou AR-02 absent.');
  const gestes = gestesDuParcours(entree);
  rmSync(SORTIE, { recursive: true, force: true });
  mkdirSync(SORTIE, { recursive: true });

  const etapes: EtapeCapture[] = [];
  const erreurs: string[] = [];
  const erreursAr01: string[] = [];
  const erreursAr02: string[] = [];
  const erreursPlans: string[] = [];
  const erreursCarte: string[] = [];
  const erreursStation: string[] = [];
  const erreursFins: string[] = [];
  let suite: EtapeCapture['suite'] = 'monde-test';
  let installable = 'non vérifiée';
  let horsLigne = 'non vérifié';
  let serveur: Awaited<ReturnType<typeof preview>> | undefined;
  let navigateur: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    serveur = await preview({ configFile: join(REPO_ROOT, 'vite.config.ts'), logLevel: 'warn' });
    navigateur = await chromium.launch();
    const racine = serveur.resolvedUrls?.local[0];
    if (racine === undefined) throw new Error('Serveur de prévisualisation sans adresse.');
    const adresse = `${racine}?monde=monde-test`;
    const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    let page = await contexte.newPage();

    /** Par défaut, l'écriture à la machine est menée à son terme et le curseur montré allumé (D-186). */
    const capturerPage: CapturerPage = async (cible, titre, animations = 'disabled') => {
      const image = voulue(titre) ? `${String(etapes.filter((vue) => vue.image !== '').length + 1).padStart(2, '0')}.png` : '';
      if (image !== '') await cible.screenshot({ path: join(SORTIE, image), fullPage: true, animations });
      const etape = { suite, titre, image, ...(await lire(cible)), partage: decrirePartage(await partage(cible)) };
      etapes.push(etape);
      return etape;
    };
    const capturerEtape = (titre: string, animations: 'disabled' | 'allow' = 'disabled'): Promise<EtapeCapture> => capturerPage(page, titre, animations);

    await page.goto(adresse);
    await page.getByRole('button', { name: /^nouvelle partie$/i }).waitFor();
    if ((await page.getByRole('button', { name: /^reprendre la partie$/i }).count()) !== 0) erreurs.push('Accueil vide : REPRENDRE LA PARTIE est affiché.');
    if ((await page.locator('.titre-accueil').textContent())?.replace(/\s/g, '') !== 'VOIDWALKER▮') erreurs.push('Accueil vide : titre inattendu.');
    if ((await page.getByRole('button').count()) !== 2) erreurs.push('Accueil vide : NOUVELLE PARTIE et OPTIONS ne sont pas les deux seuls boutons.');
    if ((await page.locator('.actions-accueil .principal').innerText()).trim().toLowerCase() !== 'nouvelle partie') erreurs.push('Accueil vide : NOUVELLE PARTIE n’est pas principal.');
    if ((await partieEnregistree(page)) !== 'null') erreurs.push('Accueil vide : une partie a été créée avant un choix explicite.');
    await capturerEtape('Accueil sans partie active');

    await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
    const reveil = await lire(page);
    if (!/Vous (?:ouvrez les yeux|vous réveillez) dans la cabine/.test(reveil.recit)) erreurs.push('Réveil : le texte écrit du monde-test est absent.');
    await verifierParole(page, entree.textes.assistance.reveil, 'Réveil monde-test', erreurs);
    if ((await page.getByRole('button').count()) !== 1) erreurs.push('Réveil : le bouton REGARDER AUTOUR DE VOUS n’est pas seul.');
    const sauvegardeAuReveil = await partieEnregistree(page);
    if ((JSON.parse(sauvegardeAuReveil) as { etat?: { actions?: number } }).etat?.actions !== 0) erreurs.push('Réveil : la nouvelle partie n’est pas au départ, sans action engagée.');
    await capturerEtape('Réveil — monde-test');
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
    await attendreSauvegarde(page, 0);
    if ((await partieEnregistree(page)) !== sauvegardeAuReveil) erreurs.push('REGARDER AUTOUR DE VOUS a modifié la sauvegarde.');
    await page.getByRole('button', { name: /^IA Station, nouveau message$/i }).click();
    const fenetreIA = page.getByRole('dialog', { name: /^IA Station$/i });
    await fenetreIA.getByRole('button', { name: /^Fermer$/i }).click();
    await page.getByRole('button', { name: /^IA Station$/i }).waitFor();
    await page.reload();
    await page.getByRole('button', { name: /^reprendre la partie$/i }).click();
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
    await attendreSauvegarde(page, 0);
    if ((await page.getByRole('button', { name: /^IA Station, nouveau message$/i }).count()) !== 0) {
      erreurs.push('Un message déjà lu redevient nouveau après reprise au réveil.');
    }

    await page.reload();
    await page.getByRole('button', { name: /^reprendre la partie$/i }).waitFor();
    if ((await page.getByRole('button').count()) !== 3) erreurs.push('Accueil avec partie : REPRENDRE, NOUVELLE PARTIE et OPTIONS ne sont pas les seuls boutons.');
    if ((await page.locator('.actions-accueil .principal').innerText()).trim().toLowerCase() !== 'reprendre la partie') erreurs.push('Accueil avec partie : REPRENDRE LA PARTIE n’est pas principal.');
    await capturerEtape('Accueil avec partie en cours');
    await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
    await page.getByText('Une partie est en cours. La nouvelle partie la remplacera.').waitFor();
    const avantConfirmation = await partieEnregistree(page);
    if ((await page.getByRole('button').count()) !== 2) erreurs.push('Confirmation : ANNULER et COMMENCER ne sont pas les deux seuls boutons.');
    await capturerEtape('Confirmation du remplacement');

    await page.getByRole('button', { name: /^commencer$/i }).click();
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
    const apresConfirmation = await partieEnregistree(page);
    if (apresConfirmation === avantConfirmation) erreurs.push('COMMENCER n’a pas remplacé la sauvegarde après confirmation.');
    if ((JSON.parse(apresConfirmation) as { etat?: { actions?: number } }).etat?.actions !== 0) {
      erreurs.push('COMMENCER : la nouvelle partie ne commence pas au réveil sans action engagée.');
    }
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
    await attendreSauvegarde(page, 0);
    if ((await partieEnregistree(page)) !== apresConfirmation) erreurs.push('Le réveil de la partie remplacée a modifié la sauvegarde.');

    await page.reload();
    await page.getByRole('button', { name: /^reprendre la partie$/i }).waitFor();
    await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
    await page.getByText('Une partie est en cours. La nouvelle partie la remplacera.').waitFor();
    const avantAnnulation = await partieEnregistree(page);
    await page.getByRole('button', { name: /^annuler$/i }).click();
    await page.getByRole('button', { name: /^reprendre la partie$/i }).waitFor();
    if ((await partieEnregistree(page)) !== avantAnnulation) erreurs.push('ANNULER a modifié la sauvegarde.');
    await page.getByRole('button', { name: /^reprendre la partie$/i }).click();
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
    if ((await partieEnregistree(page)) !== avantAnnulation) erreurs.push('La reprise à zéro action a modifié la sauvegarde.');
    await page.getByRole('button', { name: /^regarder autour de vous$/i }).click();
    await attendreSauvegarde(page, 0);
    if ((await partieEnregistree(page)) !== avantAnnulation) erreurs.push('Le réveil repris ou son observation gratuite a modifié la sauvegarde.');

    const contexteInvalide = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    const pageInvalide = await contexteInvalide.newPage();
    await pageInvalide.goto(adresse);
    await pageInvalide.getByRole('button', { name: /^nouvelle partie$/i }).waitFor();
    await pageInvalide.evaluate(async () => {
      const nom = (await indexedDB.databases()).find((base) => base.name?.startsWith('void-walker:') === true)?.name;
      if (nom === undefined) throw new Error('Base IndexedDB absente.');
      const base = await new Promise<IDBDatabase>((resoudre, rejeter) => {
        const demande = indexedDB.open(nom);
        demande.onsuccess = () => resoudre(demande.result);
        demande.onerror = () => rejeter(demande.error ?? new Error('IndexedDB'));
      });
      await new Promise<void>((resoudre, rejeter) => {
        const transaction = base.transaction('parties', 'readwrite');
        transaction.objectStore('parties').put({ detailTechnique: 'sauvegarde corrompue' }, 'en-cours');
        transaction.oncomplete = () => resoudre();
        transaction.onerror = () => rejeter(transaction.error ?? new Error('IndexedDB'));
      });
      base.close();
    });
    await pageInvalide.reload();
    await pageInvalide.getByRole('button', { name: /^reprendre la partie$/i }).click();
    const avisReprise = pageInvalide.getByRole('alert');
    await avisReprise.waitFor();
    const messageReprise = await avisReprise.innerText();
    if (!messageReprise.includes('Vous pouvez commencer une nouvelle partie.') || messageReprise.includes('sauvegarde corrompue')) {
      erreurs.push('Reprise impossible : message brut ou bouton de nouvelle partie absent.');
    }
    if ((await pageInvalide.getByRole('button', { name: /^nouvelle partie$/i }).count()) !== 1) erreurs.push('Reprise impossible : NOUVELLE PARTIE est absente.');
    await pageInvalide.getByRole('button', { name: /^nouvelle partie$/i }).click();
    await pageInvalide.getByRole('button', { name: /^regarder autour de vous$/i }).waitFor();
    if ((JSON.parse(await partieEnregistree(pageInvalide)) as { etat?: { actions?: number } }).etat?.actions !== 0) {
      erreurs.push('Reprise impossible : nouvelle partie non démarrée après le choix explicite.');
    }
    await contexteInvalide.close();

    await capturerEtape('Départ');
    await verifierEcran(page, 'Départ', erreurs);
    if ((await page.evaluate(() => document.documentElement.lang)) !== 'fr') erreurs.push('Le document n’est pas déclaré en français.');
    await verifierSansEffet(page, erreurs);
    await verifierSalleFermee(page, erreurs);
    // Premier geste de pièce qui garde l'aperçu : sa bulle est capturée, ici puis à 320 px.
    const premierApercu = gestes.find((geste) => geste.zone === 'piece' && !geste.direct);

    /** Aperçu puis CONFIRMER (12 §3.8) ; portes et déplacements n'en ont plus (D-267). */
    const confirmerApres = async (geste: Geste): Promise<void> => {
      const confirmer = await versApercu(page, geste);
      await confirmer.waitFor();
      if (geste === premierApercu || geste.zone === 'inventaire') {
        const titre = `Aperçu « ${geste.fil} »`;
        await capturerEtape(titre);
        await verifierEcran(page, titre, erreurs);
        await verifierDansEcran(page, titre, erreurs);
      }
      await confirmer.click();
    };

    for (const [index, geste] of gestes.entries()) {
      if (geste.zone === 'inventaire') {
        await verifierFermeture(page, erreurs);
        await verifierInventaireSansEffet(page, geste, erreurs);
        await page.getByRole('button', { name: exactement('Inventaire') }).click();
        await capturerEtape('Inventaire ouvert');
        await verifierEcran(page, 'Inventaire ouvert', erreurs);
        await verifierBulle(page, 'Inventaire ouvert', erreurs);
        await verifierDansEcran(page, 'Inventaire ouvert', erreurs);
      }
      await ouvrir(page, geste);
      if (geste.zone === 'inventaire' || (index === 0 && geste.zone === 'piece')) {
        const titre = geste.zone === 'inventaire' ? `Inventaire, fiche « ${geste.bouton} »` : `Bulle « ${geste.bouton} » ouverte`;
        await capturerEtape(titre);
        await verifierEcran(page, titre, erreurs);
        await verifierDansEcran(page, titre, erreurs);
      }
      if (geste.direct) {
        await toucherLigne(page, geste);
      } else {
        await confirmerApres(geste);
      }
      await attendreSauvegarde(page, index + 1);
      if (geste.direct && (await page.getByRole('dialog').count()) > 0) erreurs.push(`${geste.titre} : une bulle reste ouverte après un seul toucher.`);
      const journal = (JSON.parse(await partieEnregistree(page)) as { enregistrement: { actions: { commande: Commande }[] } }).enregistrement.actions;
      if (JSON.stringify(journal.at(-1)?.commande) !== JSON.stringify(geste.commande)) {
        const qui = geste.direct ? 'Le toucher' : 'CONFIRMER';
        erreurs.push(`${geste.titre} : ${qui} a enregistré ${JSON.stringify(journal.at(-1)?.commande)} au lieu de ${JSON.stringify(geste.commande)}.`);
      }
      const avant = await capturerEtape(geste.titre);
      await verifierEcran(page, geste.titre, erreurs);
      await verifierNoms(page, geste, erreurs);
      if (index === 1) {
        // Fermer l'appli puis la rouvrir : reprise au dernier geste (C-09 S-01).
        await page.close();
        page = await contexte.newPage();
        await page.goto(adresse);
        await reprendreDepuisAccueil(page, index + 1);
        const apres = await capturerEtape('Après fermeture et réouverture');
        if (apres.recit !== avant.recit || apres.situation !== avant.situation) erreurs.push('La réouverture ne reprend pas au dernier geste.');
      }
    }

    const fin = etapes[etapes.length - 1]?.situation ?? '';
    for (const attendu of ['Vous êtes dans l’atelier.', 'Vous voyez ici un carnet et une trousse de soin.']) {
      if (!fin.includes(attendu)) erreurs.push(`Fin du parcours : « ${attendu} » absent.`);
    }

    const manifeste = await page.evaluate(async () => {
      const lien = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (lien === null) return null;
      const reponse = await fetch(lien.href);
      return (await reponse.json()) as { icons?: { sizes?: string }[] };
    });
    const actif = await page.evaluate(() =>
      Promise.race([
        navigator.serviceWorker.ready.then((enregistrement) => enregistrement.active !== null),
        new Promise<boolean>((resoudre) => setTimeout(() => resoudre(false), 10_000)),
      ]),
    );
    const icones = (manifeste?.icons ?? []).map((icone) => icone.sizes).join(', ');
    installable = `manifeste ${manifeste === null ? 'absent' : `présent (icônes ${icones})`}, service worker ${actif ? 'actif' : 'inactif'}`;
    if (manifeste === null || !actif) erreurs.push(`Appli non installable : ${installable}.`);

    // Hors ligne : la partie et la police viennent du service worker de l'appli (12 §2.2).
    await contexte.setOffline(true);
    page = await contexte.newPage();
    const requetes: string[] = [];
    page.on('response', (reponse) => {
      if (reponse.url().endsWith('.woff2')) requetes.push(`${reponse.url().split('/').pop()} (${reponse.fromServiceWorker() ? 'service worker' : 'réseau'})`);
    });
    await page.goto(adresse);
    await reprendreDepuisAccueil(page, gestes.length);
    const chargees = await policesChargees(page);
    horsLigne = `polices chargées : ${chargees.join(', ') || 'aucune'} ; ${requetes.join(', ') || 'aucune requête de police'}`;
    const servies = requetes.length > 0 && requetes.every((requete) => requete.endsWith('(service worker)'));
    if (!chargees.includes('400 normal') || !chargees.includes('600 normal') || !servies) erreurs.push(`Police hors ligne : ${horsLigne}.`);
    await capturerEtape('Hors ligne : reprise, police servie par l’appli');

    await page.setViewportSize(ETROIT);
    await capturerEtape(`Fin du parcours, ${ETROIT.width} px de large`);
    await verifierEcran(page, `Fin, ${ETROIT.width} px`, erreurs);
    await verifierPied(page, `Fin, ${ETROIT.width} px`, erreurs);
    await contexte.setOffline(false);

    // Double toucher sur le nom d'une salle (D-267) : un seul déplacement, focus hors des boutons réutilisés (D-182).
    const essai = passageDirect(entree);
    if (essai === undefined) {
      erreurs.push('Aucun déplacement d’un seul toucher à essayer au départ.');
    } else {
      const neuf = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
      page = await neuf.newPage();
      await page.goto(adresse);
      await nouvelleDepuisAccueil(page);
      await toucherLigne(page, essai.ouvrir);
      await attendreSauvegarde(page, 1);
      await page.waitForTimeout(PAUSE_JOUEUR_MS);
      const bouton = zoneDuDock(page, essai.aller).getByRole('button', { name: exactement(essai.aller.bouton) });
      const boite = await bouton.boundingBox();
      if (boite === null) {
        erreurs.push(`« → ${essai.aller.bouton} » d’un seul toucher absent.`);
      } else {
        const [x, y] = [boite.x + boite.width / 2, boite.y + boite.height / 2];
        await page.touchscreen.tap(x, y);
        await page.waitForTimeout(80);
        await page.touchscreen.tap(x, y);
        await attendreSauvegarde(page, 2);
        // Laisse à un éventuel second déplacement le temps de s'enregistrer.
        await page.waitForTimeout(1_000);
        const actions = await page.getByTestId('sauvegarde').getAttribute('data-actions');
        if (actions !== '2') erreurs.push(`Double toucher sur « → ${essai.aller.bouton} » : ${actions ?? '?'} actions au lieu de 2.`);
        const piece = ((await page.locator('.titre-piece').textContent()) ?? '').trim().toLowerCase();
        if (piece !== essai.aller.nom.toLowerCase()) erreurs.push(`Double toucher sur « → ${essai.aller.bouton} » : arrivée en « ${piece} ».`);
        await capturerEtape(`« → ${essai.aller.nom} » touché deux fois : un seul déplacement`);
        // Au clavier, retour par le même passage : le focus va au récit ; un second Entrée ne rejoue pas le bouton réutilisé.
        const retour = page.locator('.dock .deplacements .deplacement').filter({ hasText: new RegExp(`^→\\s*${echapper(essai.depart)}`, 'i') });
        if ((await retour.count()) === 0) {
          erreurs.push('Aucun déplacement d’un seul toucher pour l’essai au clavier.');
        } else {
          await page.waitForTimeout(PAUSE_JOUEUR_MS);
          await retour.focus();
          await page.keyboard.press('Enter');
          await attendreSauvegarde(page, 3);
          // Le focus rejoint le récit juste après l'affichage du résultat.
          await page.waitForFunction(() => document.activeElement?.getAttribute('data-testid') === 'recit', null, { timeout: 2_000 }).catch(() => undefined);
          const focus = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? '');
          if (focus !== 'recit') erreurs.push(`Après un déplacement d’un seul toucher au clavier, le focus est sur « ${focus} » et non sur le récit.`);
          // Passé le délai anti double toucher : seul le déplacement du focus empêche de rejouer le bouton.
          await page.waitForTimeout(PAUSE_JOUEUR_MS);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1_000);
          if ((await page.getByTestId('sauvegarde').getAttribute('data-actions')) !== '3') erreurs.push('Un second Entrée a rejoué un déplacement.');
        }
        // Double toucher sur un objet de la liste d'inventaire : la ligne « Poser » apparue dessous ne joue rien.
        const prise = gestes.find((geste) => geste.direct && geste.zone === 'piece');
        const pose = gestes.find((geste) => geste.direct && geste.zone === 'inventaire');
        if (prise === undefined || pose === undefined) {
          erreurs.push('Aucun geste d’un seul toucher à poser depuis l’inventaire.');
        } else {
          await ouvrir(page, prise);
          await toucherLigne(page, prise);
          await attendreSauvegarde(page, 4);
          // Passé le délai après la prise : seul le changement d'étape de la bulle doit protéger.
          await page.waitForTimeout(PAUSE_JOUEUR_MS);
          await page.getByRole('button', { name: exactement('Inventaire') }).click();
          await page.waitForTimeout(PAUSE_JOUEUR_MS);
          const objet = await page.getByRole('dialog', { name: exactement('Inventaire') }).getByRole('button', { name: exactement(pose.bouton) }).boundingBox();
          if (objet !== null) {
            const [ox, oy] = [objet.x + objet.width / 2, objet.y + objet.height / 2];
            await page.touchscreen.tap(ox, oy);
            await page.waitForTimeout(80);
            await page.touchscreen.tap(ox, oy);
            await page.waitForTimeout(1_000);
          }
          if ((await page.getByTestId('sauvegarde').getAttribute('data-actions')) !== '4') erreurs.push(`Double toucher sur « ${pose.bouton} » dans l’inventaire : l’objet a été posé.`);
          // Créature dans la pièce (graine tirée au hasard) : « Poser » garde son aperçu, que le second toucher peut ouvrir sans rien jouer.
          const fiche = page.getByRole('dialog', { name: exactement(pose.bouton) });
          const apercuPose = page.getByRole('dialog', { name: exactement(`${pose.bouton} › ${pose.verbe}`) });
          if (!(await fiche.isVisible()) && !(await apercuPose.isVisible())) erreurs.push(`Double toucher sur « ${pose.bouton} » : la bulle s’est refermée.`);
        }
      }
      await neuf.close();
    }

    // Les quatre formes de l'aperçu, chacune depuis une partie neuve.
    const formes = casApercus(entree);
    // Les quatre formes se vérifient au rendu (EcranJeu.test.tsx, D-187) ; ici, celles que le monde de test atteint sans dé.
    if (formes.length === 0) erreurs.push('Aucune forme d’aperçu à capturer dans le monde de test.');
    for (const forme of formes) {
      const neuf = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
      page = await neuf.newPage();
      await page.goto(adresse);
      await nouvelleDepuisAccueil(page);
      await rejouer(page, forme.chemin);
      await (await preparer(page, forme.geste)).waitFor();
      const titre = `Aperçu « ${forme.geste.fil} », ${forme.risque ? 'risque connu' : 'sans risque connu'}, ${forme.cout ? 'avec un coût' : 'sans coût'}`;
      // RISQUE et COÛT seulement s'ils disent autre chose que « aucun » ; SAVOIR toujours (D-187).
      const lignes = await page.getByRole('dialog', { name: exactement(forme.geste.fil) }).locator('.apercu dt').allTextContents();
      const attendues = [...(forme.risque ? ['Risque'] : []), ...(forme.cout ? ['Coût'] : []), 'Savoir'];
      if (lignes.join(' · ') !== attendues.join(' · ')) erreurs.push(`${titre} : lignes « ${lignes.join(' · ')} » au lieu de « ${attendues.join(' · ')} ».`);
      await capturerEtape(titre);
      await verifierEcran(page, titre, erreurs);
      await verifierDansEcran(page, titre, erreurs);
      await neuf.close();
    }

    // Machine à écrire (D-186) : écriture figée à plusieurs instants, en taille standard puis à 22 px (« très grande »).
    const machine = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    page = await machine.newPage();
    await page.goto(adresse);
    await nouvelleDepuisAccueil(page);
    for (const taille of ['taille standard', 'texte à 22 px']) {
      if (taille !== 'taille standard') await page.addStyleTag({ content: '.ecran, .ecran * { font-size: 22px !important; }' });
      await nouveauTexte(page);
      const etats: [number, EtatEcriture][] = [];
      for (const ms of [0, 125, 250, 375, 600]) {
        etats.push([ms, await etatEcriture(page, ms)]);
        if (taille === 'taille standard') await capturerEtape(`Machine à écrire, ${ms} ms après le toucher`, 'allow');
      }
      verifierProgression(etats, `Machine à écrire, ${taille}`, erreurs);
    }
    const lecteur = await page.getByTestId('recit').ariaSnapshot();
    const blocs = (await lire(page)).recit.split('\n');
    if (lecteur.includes('▮') || blocs.some((bloc) => !lecteur.includes(bloc))) erreurs.push(`Lecteur d’écran : récit lu autrement qu’en entier, ou curseur lu :\n${lecteur}`);
    // Toucher pendant l'écriture : la puce s'ouvre, le texte s'affiche en entier.
    await nouveauTexte(page);
    await etatEcriture(page, 100);
    const puce = page.locator(OUVRE_BULLE).first();
    await puce.click();
    const touche = await etatEcriture(page);
    if (!(await page.getByRole('dialog').first().isVisible())) erreurs.push('Machine à écrire : toucher une puce pendant l’écriture n’ouvre pas sa bulle.');
    if (touche.visibles !== touche.total || touche.classes.includes('ecrire')) erreurs.push(`Machine à écrire : après un toucher, ${touche.visibles} caractères visibles sur ${touche.total}.`);
    await capturerEtape('Machine à écrire : puce touchée pendant l’écriture, texte affiché en entier (tout le texte à 22 px)', 'allow');
    await page.keyboard.press('Escape');
    // Rouvrir une bulle ne réécrit rien.
    await puce.click();
    await page.keyboard.press('Escape');
    const rouverte = await etatEcriture(page);
    if (rouverte.animees > 0 || rouverte.visibles !== rouverte.total) erreurs.push('Machine à écrire : rouvrir une bulle relance l’écriture.');
    // Toucher un bouton d'action pendant l'écriture joue l'action sans attendre.
    await nouveauTexte(page);
    await etatEcriture(page, 100);
    await nouveauTexte(page);
    await machine.close();

    // Réglage [NON], gardé sur l'appareil : texte immédiat, curseur fixe, après rechargement.
    const sansEffet = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    page = await sansEffet.newPage();
    await page.goto(adresse);
    await nouvelleDepuisAccueil(page);
    await page.evaluate((cle) => window.localStorage.setItem(cle, JSON.stringify({ machineAEcrire: false })), CLE_REGLAGES);
    for (const fois of ['après rechargement', 'après un second rechargement']) {
      await page.reload();
      await reprendreDepuisAccueil(page, 0);
      await nouveauTexte(page);
      const etat = await etatEcriture(page);
      if (etat.visibles !== etat.total || etat.animees > 0 || etat.curseur !== 'visible, none' || !etat.classes.includes('curseur-fixe')) {
        erreurs.push(`Réglage [NON] ${fois} : ${JSON.stringify(etat)}.`);
      }
    }
    await capturerEtape('Réglage « Effet machine à écrire » sur [NON] : texte immédiat, curseur fixe');
    await sansEffet.close();

    // Le téléphone demande moins d'animations : texte immédiat, curseur fixe.
    const reduit = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR', reducedMotion: 'reduce' });
    page = await reduit.newPage();
    await page.goto(adresse);
    await nouvelleDepuisAccueil(page);
    await nouveauTexte(page);
    const calme = await etatEcriture(page);
    if (calme.visibles !== calme.total || calme.animees > 0 || calme.curseur !== 'visible, none') erreurs.push(`Mouvement réduit : ${JSON.stringify(calme)}.`);
    await reduit.close();

    const etroit = await navigateur.newContext({ ...devices[TELEPHONE], viewport: ETROIT, locale: 'fr-FR' });
    page = await etroit.newPage();
    await page.goto(adresse);
    await nouvelleDepuisAccueil(page);
    const premier = premierApercu;
    if (premier !== undefined) {
      await ouvrir(page, premier);
      await capturerEtape(`Départ, bulle « ${premier.bouton} », ${ETROIT.width} px de large`);
      await verifierEcran(page, `Départ, ${ETROIT.width} px`, erreurs);
      await verifierDansEcran(page, `Départ, ${ETROIT.width} px`, erreurs);
      await (await versApercu(page, premier)).waitFor();
      await capturerEtape(`Aperçu « ${premier.fil} », ${ETROIT.width} px de large`);
      await verifierEcran(page, `Aperçu, ${ETROIT.width} px`, erreurs);
      await verifierDansEcran(page, `Aperçu, ${ETROIT.width} px`, erreurs);
      await page.keyboard.press('Escape');
      // Plus grand encore que la taille « très grande » (22 px pour le récit seul, 12 §4.10) : tout le texte à 22 px.
      await page.addStyleTag({ content: '.ecran, .ecran * { font-size: 22px !important; }' });
      await ouvrir(page, premier);
      await verifierDansEcran(page, `Bulle « ${premier.bouton} », ${ETROIT.width} px, texte à 22 px`, erreurs);
      await (await versApercu(page, premier)).waitFor();
      const titre = `Aperçu « ${premier.fil} », ${ETROIT.width} px, tout le texte à 22 px`;
      await capturerEtape(titre);
      await verifierEcran(page, titre, erreurs);
      await verifierDansEcran(page, titre, erreurs);
    }

    // Son (#99) : premier toucher et bulle, dans un contexte neuf ; aucune capture.
    try {
      await verifierSon(navigateur, adresse, erreurs);
    } catch (erreur) {
      erreurs.push(`Son : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }

    // Options (#96) : réglages, téléchargement, abandon et fin, dans un contexte neuf.
    try {
      await parcoursOptions(navigateur, adresse, entree, gestes, capturerPage, erreurs);
    } catch (erreur) {
      erreurs.push(`Options : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }

    // Installation (#174) : invite du navigateur simulée, aides d'iPhone et de Firefox, dans des contextes neufs.
    try {
      await parcoursInstallation(navigateur, adresse, capturerPage, erreurs);
    } catch (erreur) {
      erreurs.push(`Installation : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }

    // AR-01 par `?monde=ar-01` : parcours P-C joué geste par geste, dans un contexte neuf.
    suite = 'ar-01';
    try {
      await parcoursAr01(navigateur, `${racine}?monde=ar-01`, ar01, capturerPage, erreursAr01);
    } catch (erreur) {
      erreursAr01.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
    // Dangers signalés dans le récit avec leur alarme (#138, D-233) : feu d'AR-01, vide d'AR-02, avec et sans animations.
    const dangers: readonly DangerACapturer[] = [
      { adresse: `${racine}?monde=ar-01`, entree: ar01, parcours: 'P-B', etape: (etape) => etape.action === 'ouvrir' && etape.vers === 'galerie', nom: 'AR-01 — Feu découvert', texte: /flammes|brûle/ },
      { adresse: `${racine}?monde=ar-02`, entree: ar02, parcours: 'P-V1', etape: (etape) => etape.action === 'percer', nom: 'AR-02 — Vide : baie percée', texte: /plus d’air/i },
      { adresse: `${racine}?monde=ar-02`, entree: ar02, parcours: 'P-V1', etape: (etape) => etape.action === 'aller' && etape.vers === 'cabine', nom: 'AR-02 — Vide : entrée sans air', texte: /plus d’air ici/ },
    ];
    for (const danger of dangers) {
      try {
        await dangerSignale(navigateur, danger, capturerPage, danger.entree === ar01 ? erreursAr01 : erreursAr02);
      } catch (erreur) {
        (danger.entree === ar01 ? erreursAr01 : erreursAr02).push(erreur instanceof Error ? erreur.message : String(erreur));
      }
    }

    // AR-02 par `?monde=ar-02` : parcours P-V1, dans un contexte neuf.
    suite = 'ar-02';
    try {
      await parcoursAr02(navigateur, racine, ar02, capturerPage, erreursAr02);
    } catch (erreur) {
      erreursAr02.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
    // Carte (#97) : AR-01 puis AR-02, dans des contextes neufs.
    suite = 'carte';
    try {
      await parcoursCarte(navigateur, racine, ar01, capturerPage, erreursCarte);
    } catch (erreur) {
      erreursCarte.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
    // Stations tirées (#152) : `?station=`, adresse nue, station refusée, dans des contextes neufs.
    suite = 'station';
    try {
      await parcoursStation(navigateur, racine, capturerPage, erreursStation);
    } catch (erreur) {
      erreursStation.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
    // Plus aucune sortie (#156) : M-08, la planche perdue exprès, dans un contexte neuf.
    try {
      const m08 = MONDES['m-08'];
      if (m08 === undefined) throw new Error('M-08 absent des mondes.');
      await parcoursSansSortie(navigateur, racine, m08, capturerPage, erreursStation);
    } catch (erreur) {
      erreursStation.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
    // Écrans de fin (#208) : défaite jouée, puis une par cause, dans des contextes neufs.
    suite = 'fins';
    try {
      await parcoursFins(navigateur, racine, entree, capturerPage, erreursFins);
    } catch (erreur) {
      erreursFins.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
    // Plans des stations (#97) : rendu d'auteur, dans un contexte neuf.
    suite = 'plans';
    try {
      await capturerPlans(navigateur, capturerPage, erreursPlans);
    } catch (erreur) {
      erreursPlans.push(erreur instanceof Error ? erreur.message : String(erreur));
    }
  } catch (erreur) {
    erreurs.push(erreur instanceof Error ? erreur.message : String(erreur));
  } finally {
    await navigateur?.close();
    const http = serveur?.httpServer;
    if (http !== undefined) await new Promise<void>((resoudre) => http.close(() => resoudre()));
  }

  const resultat = { telephone: TELEPHONE, ecrans: [REFERENCE, ETROIT, PORTEUR], installable, horsLigne, erreurs, erreursAr01, erreursAr02, erreursPlans, erreursCarte, erreursStation, erreursFins, etapes };
  writeFileSync(join(SORTIE, 'resultat.json'), `${JSON.stringify(resultat, null, 2)}\n`);
  writeFileSync(join(SORTIE, 'commentaire.md'), commentaire(etapes, erreurs, erreursAr01, erreursAr02, erreursPlans, erreursCarte, erreursStation, erreursFins, installable, horsLigne));
  return {
    etapes,
    erreurs: [
      ...erreurs,
      ...erreursAr01.map((erreur) => `AR-01 : ${erreur}`),
      ...erreursAr02.map((erreur) => `AR-02 : ${erreur}`),
      ...erreursPlans.map((erreur) => `Plans : ${erreur}`),
      ...erreursCarte.map((erreur) => `Carte : ${erreur}`),
      ...erreursStation.map((erreur) => `Station : ${erreur}`),
      ...erreursFins.map((erreur) => `Fins : ${erreur}`),
    ],
  };
}

if (isMainModule(import.meta.url)) {
  const { etapes, erreurs } = await capturer();
  for (const etape of etapes.filter((vue) => vue.image !== '')) console.log(`[${etape.image}] ${etape.titre}\n${etape.recit}\n${etape.situation}\n`);
  for (const erreur of erreurs) console.error(`ERREUR : ${erreur}`);
  console.log(
    erreurs.length === 0
      ? 'Captures : parcours du monde de test, P-C d’AR-01, P-V1 d’AR-02 et stations tirées réussis dans l’appli, reprise au dernier geste, police servie hors ligne.'
      : 'Captures : ÉCHEC.',
  );
  if (erreurs.length > 0) process.exitCode = 1;
}
