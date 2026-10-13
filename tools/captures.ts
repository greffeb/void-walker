import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, devices, type Browser, type Locator, type Page } from 'playwright';
import { preview } from 'vite';
import { apercu, jouer, nouvellePartie, observer, type Commande, type Observation, type OptionMenu, type Partie } from '../engine';
import { libelleOption, MONDES, MOTS_CARTE, nomDe, type EntreeMonde, type EtapeParcours } from '../content';
import { composerDock, filBulle, LIEN_IA, nomDestination, nomParametre, nomPuce, rappelDe, texteRappel, unToucher } from '../app/ecran';
import { CLE_REGLAGES } from '../app/reglages';
import { rejouerExport } from './rejouer-export';
import { dessinerPlan } from './plans-svg';
import { trouverOption } from './rejouer-parcours';
import { REPO_ROOT, isMainModule } from './repo-files';
import { versionDuJeu } from './version';

// Captures (AP-09, D-135) : un navigateur joue le parcours témoin sur un téléphone simulé, 390 × 844 puis 320 px de large ;
// le départ d'AR-01 aussi en 412 × 915, proche du téléphone du porteur (D-191).
// Niveau « vérifié automatiquement » : jamais une validation humaine (C-10 §2).

const SORTIE = join(REPO_ROOT, 'captures');
const TELEPHONE = 'Pixel 7';
const REFERENCE = { width: 390, height: 844 };
const ETROIT = { width: 320, height: 568 };
const PORTEUR = { width: 412, height: 915 };

export interface EtapeCapture {
  /** Partie du commentaire : parcours du monde de test, AR-01 ou AR-02, ou les plans des stations. */
  readonly suite: 'monde-test' | 'ar-01' | 'ar-02' | 'plans' | 'carte';
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
  /** Puce ou destination, telle qu'affichée. */
  readonly bouton: string;
  /** Action de la bulle ouverte sur la puce ; `null` pour un déplacement. */
  readonly verbe: string | null;
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
  const dock = composerDock(observation);
  const titre = libelleOption(textes, option).libelle;
  const rappel = texteRappel(textes, rappelDe(option)).texte;
  const fil = filBulle(textes, option.cible, option);
  const { commande } = option;
  const direct = unToucher(monde, partie, option);
  if (dock.deplacements.includes(option)) {
    const destination = nomDestination(textes, option);
    // Le rappel et le récit nomment la pièce d'arrivée, même par un passage dont la destination était inconnue (D-147).
    const resultat = jouer(monde, partie, commande);
    const arrivee = resultat.type === 'engagee' ? observer(monde, resultat.partie.etat).piece : undefined;
    const rappelArrivee = arrivee === undefined ? rappel : texteRappel(textes, { type: 'deplacement', vers: arrivee }).texte;
    const nom = arrivee === undefined ? destination : nomDe(textes, arrivee).texte;
    return { titre, zone: 'deplacement', bouton: destination, verbe: null, parametre: null, fil, rappel: rappelArrivee, nom, commande, direct };
  }
  const zone = dock.piece.some((groupe) => groupe.options.includes(option)) ? 'piece' : 'inventaire';
  const nom = nomDe(textes, option.cible).texte;
  const parametre = option.parametre === undefined ? null : nomParametre(textes, option.parametre);
  return { titre, zone, bouton: nomPuce(textes, option.cible), verbe: textes.verbes[option.action], parametre, fil, rappel, nom, commande, direct };
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

/** Premier aperçu de chaque forme, au plus près du départ ; seuls ceux du monde par défaut existent. */
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
        const geste = gesteDe(entree, partie, observation, option);
        const prevu = apercu(entree.monde, partie, option.commande);
        if (prevu.type === 'apercu' && !geste.direct) {
          const risque = prevu.apercu.risque !== 'aucun' || prevu.apercu.danger !== null;
          const cout = prevu.apercu.cout !== 'aucun';
          const forme = `${String(risque)}:${String(cout)}`;
          if (!trouves.has(forme)) trouves.set(forme, { risque, cout, chemin, geste });
        }
        const resultat = jouer(entree.monde, partie, option.commande);
        if (resultat.type === 'engagee') suivante.push({ partie: resultat.partie, chemin: [...chemin, geste] });
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

/** Ouvre la bulle touchée : la fiche d'une puce, ou l'aperçu d'un déplacement ; un déplacement d'un seul toucher est joué. */
async function ouvrir(page: Page, geste: Geste): Promise<void> {
  if (geste.zone === 'inventaire') {
    const inventaire = page.getByRole('button', { name: exactement('Inventaire') });
    if ((await inventaire.getAttribute('aria-expanded')) !== 'true') await inventaire.click();
    await page.getByRole('dialog', { name: exactement('Inventaire') }).getByRole('button', { name: exactement(geste.bouton) }).click();
  } else {
    const nom = geste.zone === 'deplacement' && geste.direct ? `${geste.bouton}${SANS_CONFIRMATION}` : geste.bouton;
    if (geste.zone === 'deplacement' && geste.direct) await page.waitForTimeout(PAUSE_JOUEUR_MS);
    await zoneDuDock(page, geste).getByRole('button', { name: exactement(nom) }).click();
  }
}

/** Puces de la pièce ou boutons « Se déplacer vers » : la puce « Grille » et le bouton « → grille » portent le même nom (D-147). */
function zoneDuDock(page: Page, geste: Geste): Locator {
  return page.locator(geste.zone === 'deplacement' ? '.dock .deplacements' : '.dock .puces');
}

/** Fil de l'étape « OÙ ? » : la puce et l'action, sans paramètre (« Caisse › Déplacer »). */
function filQuestion(geste: Geste): string {
  return `${geste.bouton} › ${geste.verbe ?? ''}`;
}

/** Joue un geste d'un seul toucher depuis sa bulle ouverte : la ligne de l'action, sans aperçu (D-182). */
async function toucherLigne(page: Page, geste: Geste): Promise<void> {
  if (geste.verbe === null) return;
  await page.waitForTimeout(PAUSE_JOUEUR_MS);
  await page.getByRole('dialog', { name: exactement(geste.bouton) }).getByRole('button', { name: exactement(`${geste.verbe}${SANS_CONFIRMATION}`) }).click();
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
  if (geste.verbe === null) return;
  // Dans les lignes d'action seulement : « Fermer » est aussi le nom du « ✕ » de la bulle.
  await page.getByRole('dialog', { name: exactement(geste.bouton) }).locator('.lignes').getByRole('button', { name: exactement(geste.verbe) }).click();
}

async function preparer(page: Page, geste: Geste): Promise<Locator> {
  await ouvrir(page, geste);
  return versApercu(page, geste);
}

/** Rejoue des gestes depuis le départ comme le joueur : d'un seul toucher, ou par l'aperçu puis CONFIRMER. */
async function rejouer(page: Page, chemin: readonly Geste[]): Promise<void> {
  for (const [index, geste] of chemin.entries()) {
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

async function nouvelleDepuisAccueil(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^nouvelle partie$/i }).click();
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

/** Le pied de page (version, commit, numéro de PR) est en bas des options, sur une ligne (D-191, #96) ; on revient ensuite au jeu. */
async function verifierPied(page: Page, ou: string, erreurs: string[]): Promise<void> {
  await ouvrirOptions(page);
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

/** Touche une taille du groupe segmenté (12 §4.10). */
async function choisirTaille(page: Page, libelle: 'Standard' | 'Grande' | 'Très grande'): Promise<void> {
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
 * Ouvrir, parcourir et fermer dix fois les bulles ne change rien (C-01 A-01) : cinq fois depuis l'aperçu, cinq fois depuis la fiche.
 * Le focus entre dans la bulle, n'en sort pas au clavier et revient sur la puce à la fermeture (12 §7).
 */
async function verifierSansEffet(page: Page, erreurs: string[]): Promise<void> {
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)) };
  const puces = await page.locator('.dock .puce[aria-haspopup="dialog"]').all();
  if (puces.length === 0) erreurs.push('Aucune puce à ouvrir au départ : bulles non vérifiées.');
  for (let fois = 0; fois < 10; fois++) {
    // Décalé d'un cran : la première bulle ouverte est celle d'une porte, dont l'action garde l'aperçu.
    const puce = puces[(fois + 1) % puces.length];
    const depuisFiche = fois >= FERMETURES.length;
    const choix = depuisFiche ? (FERMETURES[fois % (FERMETURES.length - 1)] ?? '✕') : (FERMETURES[fois] ?? '✕');
    if (puce === undefined) break;
    const nom = (await puce.innerText()).replace(/^▸\s*/, '').trim();
    await puce.click();
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
  // Une action indisponible ne joue rien, même touchée ou validée au clavier (12 §3.7).
  const indisponible = page.getByRole('button', { name: /, indisponible : /i }).first();
  await indisponible.click({ force: true });
  await indisponible.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
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
    const fiche = page.getByRole('dialog', { name: exactement(geste.bouton) });
    await fiche.getByRole('button', { name: exactement('Étape précédente') }).click();
    await liste.waitFor({ timeout: 5_000 }).catch(() => erreurs.push('Inventaire : « ‹ » ne ramène pas à la liste.'));
    await liste.getByRole('button', { name: exactement(geste.bouton) }).click();
    let bulle = fiche;
    if (!geste.direct) {
      await fiche.getByRole('button', { name: exactement(geste.verbe ?? '') }).click();
      bulle = page.getByRole('dialog', { name: exactement(geste.fil) });
      await bulle.getByRole('button', { name: exactement('Étape précédente') }).click();
      await fiche.waitFor({ timeout: 5_000 }).catch(() => erreurs.push('Inventaire : « ‹ » ne ramène pas de l’aperçu à la fiche.'));
      await fiche.getByRole('button', { name: exactement(geste.verbe ?? '') }).click();
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
  await page.locator('.dock .autour').click();
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

/** Bouton IA STATION : carré plein et « nouveau message » tant qu'un message n'est pas lu, rien ensuite (12 §2.6). */
async function verifierPastille(page: Page, attendue: boolean, ou: string, erreurs: string[]): Promise<void> {
  const bouton = page.locator('.nav-ia');
  const pastilles = await bouton.locator('.pastille').count();
  const nom = await bouton.getAttribute('aria-label');
  const voulu = attendue ? 'IA Station, nouveau message' : 'IA Station';
  if (pastilles !== (attendue ? 1 : 0) || nom !== voulu) erreurs.push(`${ou} : IA STATION « ${nom ?? '?'} », ${pastilles} pastille(s), au lieu de « ${voulu} ».`);
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

/** Lien « [ IA STATION ] parle dans l'écouteur › », dernier élément du récit, sans la citation (12 §3.3, D-192). */
async function verifierLien(page: Page, ou: string, erreurs: string[]): Promise<Locator> {
  const lien = page.getByTestId('lien-ia');
  if ((await lien.count()) !== 1 || !(await lien.isVisible())) erreurs.push(`${ou} : lien d’IA Station absent.`);
  else if ((await lien.innerText()).trim() !== LIEN_IA) erreurs.push(`${ou} : lien d’IA Station « ${await lien.innerText()} ».`);
  if ((await page.getByTestId('ia-station').count()) > 0) erreurs.push(`${ou} : la citation d’IA Station est dans le récit au lieu du lien.`);
  const dernier = await page.getByTestId('recit').evaluate((recit) => (recit.lastElementChild as HTMLElement | null)?.dataset.testid);
  if (dernier !== 'lien-ia') erreurs.push(`${ou} : le lien d’IA Station n’est pas après le récit.`);
  return lien;
}

/**
 * Fenêtre d'IA Station (12 §3.9, D-192) : blanche, messages reçus dans l'ordre, NOUVEAU sur ceux qui n'étaient pas lus, un seul bouton ;
 * le focus y reste ; RETOUR ou le voile la referment sans rien jouer, le focus revient, la pastille s'éteint.
 */
async function verifierFenetreIA(
  page: Page,
  depuis: Locator,
  attendus: readonly (readonly [string | undefined, boolean])[],
  fermeture: 'Retour' | 'voile' | 'Échap',
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
  await capturer?.();
  if (fermeture === 'Retour') await fenetre.getByRole('button', { name: exactement('Retour') }).click();
  else if (fermeture === 'Échap') await page.keyboard.press('Escape');
  else await page.getByTestId('voile').click({ position: { x: 4, y: 4 } });
  await fenetre.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => erreurs.push(`${ou} : ${fermeture} ne ferme pas la fenêtre d’IA Station.`));
  if (!(await depuis.evaluate((element) => element === document.activeElement))) erreurs.push(`${ou} : le focus ne revient pas là où la fenêtre a été ouverte.`);
  await verifierPastille(page, false, `${ou}, après lecture`, erreurs);
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

/** Partie enregistrée, lue : sa graine et son état ; `null` s'il n'y en a plus. */
async function partieLue(page: Page): Promise<{ enregistrement: { graine: number }; etat: Record<string, unknown> } | null> {
  const brute = await partieEnregistree(page);
  return brute === 'null' || brute === 'aucune base' ? null : (JSON.parse(brute) as { enregistrement: { graine: number }; etat: Record<string, unknown> });
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
    const bulle = await ecart(() => page.locator('.dock .puce[aria-haspopup="dialog"]').first().click());
    if (bulle !== 2) erreurs.push(`Son : ouvrir une bulle fait partir ${bulle} source(s), 2 attendues.`);
    const echap = await ecart(() => page.keyboard.press('Escape'));
    if (echap !== 1) erreurs.push(`Son : Échap qui referme la bulle fait partir ${echap} source(s), 1 attendue.`);
    await page.locator('.engrenage').click();
    await page.getByRole('heading', { name: exactement('Options'), level: 1 }).waitFor();
    const segment = await ecart(() => page.locator('label.segment').getByText('Grande', { exact: true }).click());
    if (segment !== 2) erreurs.push(`Son : toucher un segment fait partir ${segment} source(s), 2 attendues (un seul clic).`);
  } finally {
    await contexte.close();
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
  for (const absent of [/Télécharger ma partie/i, /Abandonner la partie en cours/i, /^Reprendre la partie$/i]) {
    if ((await page.getByRole('button', { name: absent }).count()) > 0) erreurs.push(`Options sans partie : « ${absent.source} » est proposé.`);
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

  // Mise à jour (D-227) : le bouton cherche, ne trouve rien de plus récent et le dit ; le pied de page porte la version.
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

  // Son (15 §4, D-220, D-223) : trois rails à 80, 80 et 60 ; « Ambiance » à 0 au clavier s'écrit COUPÉE et se garde.
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

  // Télécharger ma partie : le fichier se rejoue avec le rejoueur et donne le même état (C-09 S-03, SP-05).
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Télécharger ma partie/i }).click()]);
  const chemin = join(tmpdir(), `void-walker-captures-${process.pid}.json`);
  await telechargement.saveAs(chemin);
  const rapport = rejouerExport(readFileSync(chemin, 'utf8'), versionDuJeu());
  rmSync(chemin, { force: true });
  if (!rapport.identique) erreurs.push(`Téléchargement : le fichier ne se rejoue pas à l’identique.\n${rapport.lignes.join('\n')}`);
  const retour = ((await page.getByTestId('telechargement').textContent()) ?? '').trim();
  if (retour !== `Fichier prêt : ${telechargement.suggestedFilename()}`) erreurs.push(`Téléchargement : retour « ${retour} ».`);
  if ((await partieEnregistree(page)) !== avant.partie) erreurs.push('Télécharger ma partie a modifié la partie enregistrée.');

  // Très grande : aperçu à 22 px ; lignes de balayage coupées.
  await choisirTaille(page, 'Très grande');
  if ((await tailleRecit(page)) !== '22px') erreurs.push(`Options : aperçu à ${await tailleRecit(page)} en « très grande ».`);
  await page.getByRole('switch', { name: exactement('Lignes de balayage') }).click();
  if ((await page.locator('.balayage').count()) !== 0) erreurs.push('Lignes de balayage sur [NON] : la couche est toujours là.');
  await capturer(page, 'Options : taille « très grande », lignes de balayage sur [NON], fichier prêt');
  await verifierSansTroncature(page, 'Options, très grande', erreurs);

  await page.getByRole('button', { name: exactement('Reprendre la partie') }).click();
  await page.getByTestId('recit').waitFor();
  const ecriture = await etatEcriture(page);
  if (ecriture.animees > 0 || ecriture.visibles !== ecriture.total) erreurs.push('Retour des options : le récit se réécrit.');
  const apres = { partie: await partieEnregistree(page), ...(await lire(page)) };
  if (JSON.stringify(apres) !== JSON.stringify(avant)) erreurs.push('Ouvrir les options a changé la partie, le récit ou la situation.');
  if ((await tailleRecit(page)) !== '22px') erreurs.push(`Jeu en « très grande » : récit à ${await tailleRecit(page)}.`);
  await capturer(page, 'Jeu en « très grande », sans lignes de balayage');
  await verifierEcran(page, 'Jeu, très grande', erreurs);
  await verifierSansTroncature(page, 'Jeu, très grande', erreurs);
  const puce = page.locator('.dock .puce[aria-haspopup="dialog"]').first();
  await puce.click();
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
  // Pièces visitées après les deux gestes joués, selon le moteur, en mots.
  let jouee = nouvellePartie(entree.monde, { version: 'gestes', graine: 0 });
  for (const geste of gestes.slice(0, 2)) {
    const resultat = jouer(entree.monde, jouee, geste.commande);
    if (resultat.type === 'engagee') jouee = resultat.partie;
  }
  const visitees = observer(entree.monde, jouee.etat).visitees.map((piece) => nomPuce(entree.textes, piece)).join(', ');
  for (const attendu of ['Pièces visitées', visitees, entree.textes.observation.terminee]) {
    if (!fin.toLowerCase().includes(attendu.toLowerCase())) erreurs.push(`Fin d’abandon : « ${attendu} » absent.`);
  }
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
 * AR-01 depuis l'adresse par défaut : le parcours P-C joué geste par geste, avec l'étape « OÙ ? » (12 §3.5, §4.6),
 * la parole d'IA Station au réveil (12 §4.2), puis son lien, sa pastille et sa fenêtre, avant et après reprise (12 §3.9, D-192),
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
  if (piece !== depart) erreurs.push(`Adresse par défaut : pièce « ${piece} » au lieu de « ${depart} », le départ d’AR-01.`);
  await verifierPastille(page, true, 'Départ', erreurs);
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
          .getByRole('dialog', { name: exactement(geste.bouton) })
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
    const arrivee = geste.zone === 'deplacement' && geste.bouton !== geste.nom;
    if (arrivee) {
      // Passage sans signalétique franchi : la pièce d'arrivée est nommée, IA Station parle ; le lien ouvre sa fenêtre (D-147, D-192).
      const lien = await verifierLien(page, ou, erreurs);
      await verifierPastille(page, true, ou, erreurs);
      await capturer(page, `AR-01 — Par « → ${geste.bouton} » : « ${geste.rappel} », lien d’IA Station`);
      await verifierFenetreIA(page, lien, [[assistance.reveil, true], [assistance.energie, true]], 'Retour', `${ou}, fenêtre par le lien`, erreurs, () =>
        capturer(page, 'AR-01 — Fenêtre d’IA Station : deux messages nouveaux'),
      );
      // Après reprise : mêmes messages, aucun nouveau ; le lien reste, le message venant d'arriver.
      await page.reload();
      await reprendreDepuisAccueil(page, index + 1);
      await verifierLien(page, `${ou}, après reprise`, erreurs);
      await verifierPastille(page, false, `${ou}, après reprise`, erreurs);
      await verifierFenetreIA(page, page.locator('.nav-ia'), [[assistance.reveil, false], [assistance.energie, false]], 'voile', `${ou}, après reprise, par IA STATION`, erreurs, () =>
        capturer(page, 'AR-01 — Fenêtre d’IA Station après reprise : messages lus'),
      );
    } else if ((await page.getByTestId('ia-station').count()) > 0 || (await page.getByTestId('lien-ia').count()) > 0) {
      erreurs.push(`${ou} : IA Station signalée sans parole nouvelle.`);
    }
    if (etape?.action === 'ouvrir' && etape.cible === 'cloison' && etape.vers === 'observation') {
      const situation = (await lire(page)).situation;
      if (!situation.includes(phrases.creatureATerre)) erreurs.push(`${ou} : « ${phrases.creatureATerre} » absent de la situation.`);
      await capturer(page, `AR-01 — ${geste.titre} : créature à terre`);
    }
    if (etape?.action === 'installer') await capturer(page, `AR-01 — ${geste.titre}`);
  }

  // Fin par évacuation : seize actions (D-196), la phrase de la capsule et NOUVELLE PARTIE à la place du dock.
  const actions = await page.getByTestId('sauvegarde').getAttribute('data-actions');
  if (actions !== '16') erreurs.push(`Fin : ${actions ?? '?'} actions au lieu de 16.`);
  const fin = page.locator('.dock.fin-partie');
  if (!((await fin.innerText()).includes(phrases.evacuee))) erreurs.push(`Fin : « ${phrases.evacuee} » absent.`);
  if (!(await fin.getByRole('button', { name: exactement('Nouvelle partie') }).isVisible())) erreurs.push('Fin : NOUVELLE PARTIE absent.');
  if ((await page.locator('.dock .puce, .dock .deplacements').count()) > 0) erreurs.push('Fin : le dock de la pièce est encore là.');
  if (await page.locator('.navigation').isVisible()) erreurs.push('Fin : INVENTAIRE est encore proposé.');
  const lienFin = await verifierLien(page, 'Fin', erreurs);
  await capturer(page, `AR-01 — Fin : « ${phrases.evacuee} », NOUVELLE PARTIE`);
  await verifierEcran(page, 'AR-01, fin', erreurs);
  await verifierFenetreIA(page, lienFin, [[assistance.reveil, false], [assistance.energie, false], [assistance.depart, true]], 'Échap', 'Fin, fenêtre', erreurs, () =>
    capturer(page, 'AR-01 — Fin : fenêtre d’IA Station, départ confirmé'),
  );
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
  if (!(await fin.innerText()).includes(ar02.textes.observation.evacuee)) erreurs.push(`Fin : « ${ar02.textes.observation.evacuee} » absent.`);
  await capturer(page, `AR-02 — Fin : « ${ar02.textes.observation.evacuee} »`);
  await verifierEcran(page, 'AR-02, fin', erreurs);
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
  await page.goto(racine);
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

/** Plans des stations (14 §4.3) : rendu d'auteur de chaque monde, montré au porteur avant fusion. */
async function capturerPlans(navigateur: Browser, capturer: CapturerPage, erreurs: string[]): Promise<void> {
  const contexte = await navigateur.newContext({ viewport: REFERENCE, locale: 'fr-FR' });
  const page = await contexte.newPage();
  for (const [id, entree] of Object.entries(MONDES)) {
    try {
      await page.setContent(`<!doctype html><html lang="fr"><body style="margin:0;background:#050A06">${dessinerPlan(entree)}</body></html>`);
      await capturer(page, `Plan — ${id}`);
    } catch (erreur) {
      erreurs.push(`${id} : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }
  }
  await contexte.close();
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
      ['Adresse par défaut, partie neuve, joué geste par geste.'],
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
      'Plans des stations (#97)',
      publiees.filter((etape) => etape.suite === 'plans'),
      erreursPlans,
      ['Rendu d’auteur de chaque plan (14 §4.3) : toutes les pièces, portes et capsules, sans la mémoire du passager. À juger par le porteur avant fusion.'],
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
  // Le parcours du monde de test se joue par `?monde=monde-test` ; AR-01, le monde par défaut, par l'adresse nue.
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
    await fenetreIA.getByRole('button', { name: /^Retour$/i }).click();
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
    const passage = gestes.find((geste) => geste.zone === 'deplacement');
    if (passage !== undefined) {
      const ferme = page.getByRole('button', { name: new RegExp(`^${echapper(passage.bouton)}, indisponible : `, 'i') });
      if ((await ferme.getAttribute('aria-disabled')) !== 'true') erreurs.push(`« ⊘ ${passage.bouton} » devrait être indisponible au départ, avec sa raison.`);
    }
    await verifierSansEffet(page, erreurs);
    // Premier geste de pièce qui garde l'aperçu : sa bulle est capturée, ici puis à 320 px.
    const premierApercu = gestes.find((geste) => geste.zone === 'piece' && !geste.direct);

    /** Aperçu puis CONFIRMER (12 §3.8) ; l'aperçu d'un déplacement se referme d'abord sans rien jouer, de cinq façons. */
    const confirmerApres = async (geste: Geste): Promise<void> => {
      let confirmer = await versApercu(page, geste);
      await confirmer.waitFor();
      if (geste === premierApercu || geste.zone !== 'piece') {
        const titre = `Aperçu « ${geste.fil} »`;
        await capturerEtape(titre);
        await verifierEcran(page, titre, erreurs);
        await verifierDansEcran(page, titre, erreurs);
      }
      if (geste.zone === 'deplacement') {
        // Le focus revient sur le bouton après chaque fermeture (12 §3.5).
        const avantFermetures = { partie: await partieEnregistree(page), ...(await lire(page)) };
        const bouton = zoneDuDock(page, geste).getByRole('button', { name: exactement(geste.bouton) });
        await verifierFocusPiege(page, page.getByRole('dialog', { name: exactement(geste.fil) }), `Aperçu « ${geste.fil} »`, erreurs);
        for (const fermeture of FERMETURES) {
          if (fermeture !== FERMETURES[0]) await ouvrir(page, geste);
          await fermerBulle(page, page.getByRole('dialog', { name: exactement(geste.fil) }), fermeture);
          await confirmer.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => erreurs.push(`Déplacement : ${fermeture} ne ferme pas l’aperçu.`));
          if (!(await bouton.evaluate((element) => element === document.activeElement))) {
            erreurs.push(`Déplacement fermé par ${fermeture} : le focus ne revient pas sur le bouton.`);
          }
        }
        const apresFermetures = { partie: await partieEnregistree(page), ...(await lire(page)) };
        if (JSON.stringify(apresFermetures) !== JSON.stringify(avantFermetures)) erreurs.push('Fermer l’aperçu du déplacement a changé la partie, le récit ou la situation.');
        confirmer = await preparer(page, geste);
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

    // Double toucher sur un déplacement d'un seul toucher : un seul déplacement, focus hors des boutons réutilisés (D-182).
    const essai = passageDirect(entree);
    if (essai === undefined) {
      erreurs.push('Aucun déplacement d’un seul toucher à essayer au départ.');
    } else {
      const neuf = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
      page = await neuf.newPage();
      await page.goto(adresse);
      await nouvelleDepuisAccueil(page);
      await (await preparer(page, essai.ouvrir)).click();
      await attendreSauvegarde(page, 1);
      await page.waitForTimeout(PAUSE_JOUEUR_MS);
      const bouton = page.locator('.dock').getByRole('button', { name: exactement(`${essai.aller.bouton}${SANS_CONFIRMATION}`) });
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
        if (piece !== essai.aller.bouton.toLowerCase()) erreurs.push(`Double toucher sur « → ${essai.aller.bouton} » : arrivée en « ${piece} ».`);
        await capturerEtape(`« → ${essai.aller.bouton} » d’un seul toucher, touché deux fois : un seul déplacement`);
        // Au clavier, retour par le même passage : le focus va au récit ; un second Entrée ne rejoue pas le bouton réutilisé.
        const retour = page.locator('.dock').getByRole('button', { name: exactement(`${essai.depart}${SANS_CONFIRMATION}`) });
        if ((await retour.count()) === 0) {
          erreurs.push('Aucun déplacement d’un seul toucher pour l’essai au clavier.');
        } else {
          await page.waitForTimeout(PAUSE_JOUEUR_MS);
          await retour.focus();
          await page.keyboard.press('Enter');
          await attendreSauvegarde(page, 3);
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
          if (!(await page.getByRole('dialog', { name: exactement(pose.bouton) }).isVisible())) erreurs.push(`Double toucher sur « ${pose.bouton} » : la fiche n’est pas restée ouverte.`);
        }
      }
      await neuf.close();
    }

    // Les quatre formes de l'aperçu, chacune depuis une partie neuve.
    const formes = casApercus(entree);
    if (formes.length < 4) erreurs.push(`Seulement ${formes.length} formes d’aperçu sur quatre dans le monde de test.`);
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
    const puce = page.locator('.dock .puce[aria-haspopup="dialog"]').first();
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

    // AR-01, monde par défaut : parcours P-C joué geste par geste depuis l'adresse nue, dans un contexte neuf.
    suite = 'ar-01';
    try {
      await parcoursAr01(navigateur, racine, ar01, capturerPage, erreursAr01);
    } catch (erreur) {
      erreursAr01.push(erreur instanceof Error ? erreur.message : String(erreur));
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

  const resultat = { telephone: TELEPHONE, ecrans: [REFERENCE, ETROIT, PORTEUR], installable, horsLigne, erreurs, erreursAr01, erreursAr02, erreursPlans, erreursCarte, etapes };
  writeFileSync(join(SORTIE, 'resultat.json'), `${JSON.stringify(resultat, null, 2)}\n`);
  writeFileSync(join(SORTIE, 'commentaire.md'), commentaire(etapes, erreurs, erreursAr01, erreursAr02, erreursPlans, erreursCarte, installable, horsLigne));
  return { etapes, erreurs: [...erreurs, ...erreursAr01.map((erreur) => `AR-01 : ${erreur}`), ...erreursAr02.map((erreur) => `AR-02 : ${erreur}`), ...erreursPlans.map((erreur) => `Plans : ${erreur}`), ...erreursCarte.map((erreur) => `Carte : ${erreur}`)] };
}

if (isMainModule(import.meta.url)) {
  const { etapes, erreurs } = await capturer();
  for (const etape of etapes.filter((vue) => vue.image !== '')) console.log(`[${etape.image}] ${etape.titre}\n${etape.recit}\n${etape.situation}\n`);
  for (const erreur of erreurs) console.error(`ERREUR : ${erreur}`);
  console.log(
    erreurs.length === 0
      ? 'Captures : parcours du monde de test, P-C d’AR-01 et P-V1 d’AR-02 réussis dans l’appli, reprise au dernier geste, police servie hors ligne.'
      : 'Captures : ÉCHEC.',
  );
  if (erreurs.length > 0) process.exitCode = 1;
}
