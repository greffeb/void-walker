import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, devices, type Locator, type Page } from 'playwright';
import { preview } from 'vite';
import { jouer, nouvellePartie, observer, type Commande, type Observation, type OptionMenu, type Partie } from '../engine';
import { libelleOption, MONDE_PAR_DEFAUT, MONDES, nomDe, type EntreeMonde } from '../content';
import { composerDock, filBulle, nomDestination, nomPuce, rappelDe, texteRappel, unToucher } from '../app/ecran';
import { trouverOption } from './rejouer-parcours';
import { REPO_ROOT, isMainModule } from './repo-files';

// Captures (AP-09, D-135) : un navigateur joue le parcours témoin sur un téléphone simulé, 390 × 844 puis 320 px de large.
// Niveau « vérifié automatiquement » : jamais une validation humaine (C-10 §2).

const SORTIE = join(REPO_ROOT, 'captures');
const TELEPHONE = 'Pixel 7';
const REFERENCE = { width: 390, height: 844 };
const ETROIT = { width: 320, height: 568 };

export interface EtapeCapture {
  readonly titre: string;
  readonly image: string;
  readonly recit: string;
  readonly situation: string;
}

/** Où toucher pour jouer une étape (12 §3.4), et ce que l'écran doit en rappeler. */
export interface Geste {
  readonly titre: string;
  readonly zone: 'piece' | 'inventaire' | 'deplacement';
  /** Puce ou destination, telle qu'affichée. */
  readonly bouton: string;
  /** Action de la bulle ouverte sur la puce ; `null` pour un déplacement. */
  readonly verbe: string | null;
  /** Fil de la bulle d'aperçu : « Carnet › Prendre », « Aller vers › atelier ». */
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
    return { titre, zone: 'deplacement', bouton: destination, verbe: null, fil, rappel, nom: destination, commande, direct };
  }
  const zone = dock.piece.some((groupe) => groupe.options.includes(option)) ? 'piece' : 'inventaire';
  const nom = nomDe(textes, option.cible).texte;
  return { titre, zone, bouton: nomPuce(textes, option.cible), verbe: textes.verbes[option.action], fil, rappel, nom, commande, direct };
}

/** Gestes du parcours témoin, calculés par le moteur, les textes et le rangement de l'écran : ils ne dépendent pas de la graine. */
export function gestesDuParcours(entree: EntreeMonde): Geste[] {
  let partie: Partie = nouvellePartie(entree.monde, { version: 'gestes', graine: 0 });
  return entree.parcours.etapes.map((etape) => {
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
    await page.locator('.dock').getByRole('button', { name: exactement(nom) }).click();
  }
}

/** Joue un geste d'un seul toucher depuis sa bulle ouverte : la ligne de l'action, sans aperçu (D-182). */
async function toucherLigne(page: Page, geste: Geste): Promise<void> {
  if (geste.verbe === null) return;
  await page.waitForTimeout(PAUSE_JOUEUR_MS);
  await page.getByRole('dialog', { name: exactement(geste.bouton) }).getByRole('button', { name: exactement(`${geste.verbe}${SANS_CONFIRMATION}`) }).click();
}

/** Choisit l'action dans la fiche s'il le faut ; renvoie CONFIRMER de l'aperçu (12 §3.8). */
async function versApercu(page: Page, geste: Geste): Promise<Locator> {
  if (geste.verbe !== null) {
    await page.getByRole('dialog', { name: exactement(geste.bouton) }).getByRole('button', { name: exactement(geste.verbe) }).click();
  }
  return page.getByRole('dialog', { name: exactement(geste.fil) }).getByRole('button', { name: exactement('Confirmer') });
}

async function preparer(page: Page, geste: Geste): Promise<Locator> {
  await ouvrir(page, geste);
  return versApercu(page, geste);
}

/** La sauvegarde réussie est silencieuse : on attend ses attributs, pas un texte (12 §11). */
async function attendreSauvegarde(page: Page, actions: number): Promise<void> {
  await page
    .locator(`[data-testid="sauvegarde"][data-actions="${actions}"][data-etat="sauvegardee"]`)
    .waitFor({ state: 'attached', timeout: 10_000 });
}

async function lire(page: Page): Promise<{ recit: string; situation: string }> {
  const texte = async (id: string): Promise<string> => (await page.getByTestId(id).innerText()).replace(/\n\s*\n/g, '\n').trim();
  return { recit: await texte('recit'), situation: await texte('situation') };
}

/** Aucun chiffre affiché, cibles d'au moins 44 × 44 px, pas de débordement en largeur (12 §1, §2.7, §7). */
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
    return JSON.stringify(valeur);
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
  const rappel = ((await page.getByTestId('rappel').textContent()) ?? '').replace(/^>\s*/, '').trim();
  if (rappel.toLowerCase() !== geste.rappel.toLowerCase()) erreurs.push(`${geste.titre} : rappel « ${rappel} » au lieu de « ${geste.rappel} ».`);
  const recit = (await page.getByTestId('recit').innerText()).toLowerCase();
  if (!recit.includes(geste.nom.toLowerCase())) erreurs.push(`${geste.titre} : le récit ne nomme pas « ${geste.nom} » (NP-04).`);
}

async function policesChargees(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((police) => police.family.includes('IBM Plex Mono') && police.status === 'loaded')
      .map((police) => `${police.weight} ${police.style}`);
  });
}

function commentaire(etapes: readonly EtapeCapture[], erreurs: readonly string[], installable: string, horsLigne: string): string {
  const adresse = process.env.VERSION_URL ?? '';
  const images = process.env.CAPTURES_URL ?? '';
  const commit = process.env.COMMIT ?? '';
  const suffixe = commit === '' ? '' : `?v=${commit.slice(0, 7)}`;
  const lignes = [
    '<!-- void-walker:version-de-test -->',
    '## Version de test',
    '',
    adresse === '' ? 'Adresse : (publication locale)' : `**Adresse :** ${adresse}`,
    commit === '' ? '' : `Commit \`${commit.slice(0, 7)}\``,
    '',
    `Captures d’un navigateur automatique sur téléphone simulé (${TELEPHONE}, ${REFERENCE.width} × ${REFERENCE.height} puis ${ETROIT.width} px de large). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.`,
    '',
    erreurs.length === 0 ? '**Parcours du monde de test : réussi.**' : `**Parcours du monde de test : ÉCHEC.**\n\n${erreurs.map((erreur) => `- ${erreur}`).join('\n')}`,
    `Installation : ${installable}`,
    `Hors ligne : ${horsLigne}`,
    '',
    etapes.map((etape) => `<img src="${images}${etape.image}${suffixe}" width="200" alt="${etape.titre}">`).join(' '),
    '',
    '<details><summary>Texte affiché à chaque étape</summary>',
    '',
  ];
  for (const etape of etapes) {
    lignes.push(`#### ${etape.titre}`, '', ...etape.recit.split('\n').map((ligne) => `> ${ligne}`), '', '```text', etape.situation, '```', '');
  }
  lignes.push('</details>', '');
  return lignes.join('\n');
}

export async function capturer(): Promise<{ etapes: EtapeCapture[]; erreurs: string[] }> {
  const entree = MONDES[MONDE_PAR_DEFAUT];
  if (entree === undefined) throw new Error('Monde par défaut absent.');
  const gestes = gestesDuParcours(entree);
  rmSync(SORTIE, { recursive: true, force: true });
  mkdirSync(SORTIE, { recursive: true });

  const etapes: EtapeCapture[] = [];
  const erreurs: string[] = [];
  let installable = 'non vérifiée';
  let horsLigne = 'non vérifié';
  let serveur: Awaited<ReturnType<typeof preview>> | undefined;
  let navigateur: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    serveur = await preview({ configFile: join(REPO_ROOT, 'vite.config.ts'), logLevel: 'warn' });
    navigateur = await chromium.launch();
    const adresse = serveur.resolvedUrls?.local[0];
    if (adresse === undefined) throw new Error('Serveur de prévisualisation sans adresse.');
    const contexte = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
    let page = await contexte.newPage();

    const capturerEtape = async (titre: string): Promise<EtapeCapture> => {
      const image = `${String(etapes.length + 1).padStart(2, '0')}.png`;
      await page.screenshot({ path: join(SORTIE, image), fullPage: true });
      const etape = { titre, image, ...(await lire(page)) };
      etapes.push(etape);
      return etape;
    };

    await page.goto(adresse);
    await attendreSauvegarde(page, 0);
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
        const bouton = page.locator('.dock').getByRole('button', { name: exactement(geste.bouton) });
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
        await attendreSauvegarde(page, index + 1);
        const apres = await capturerEtape('Après fermeture et réouverture');
        if (apres.recit !== avant.recit || apres.situation !== avant.situation) erreurs.push('La réouverture ne reprend pas au dernier geste.');
      }
    }

    const fin = etapes[etapes.length - 1]?.situation ?? '';
    for (const attendu of ['Vous êtes dans l’atelier.', 'Vous voyez ici un carnet.']) {
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
    await attendreSauvegarde(page, gestes.length);
    const chargees = await policesChargees(page);
    horsLigne = `polices chargées : ${chargees.join(', ') || 'aucune'} ; ${requetes.join(', ') || 'aucune requête de police'}`;
    const servies = requetes.length > 0 && requetes.every((requete) => requete.endsWith('(service worker)'));
    if (!chargees.includes('400 normal') || !chargees.includes('600 normal') || !servies) erreurs.push(`Police hors ligne : ${horsLigne}.`);
    await capturerEtape('Hors ligne : reprise, police servie par l’appli');

    await page.setViewportSize(ETROIT);
    await capturerEtape(`Fin du parcours, ${ETROIT.width} px de large`);
    await verifierEcran(page, `Fin, ${ETROIT.width} px`, erreurs);
    await contexte.setOffline(false);

    // Double toucher sur un déplacement d'un seul toucher : un seul déplacement, focus hors des boutons réutilisés (D-182).
    const essai = passageDirect(entree);
    if (essai === undefined) {
      erreurs.push('Aucun déplacement d’un seul toucher à essayer au départ.');
    } else {
      const neuf = await navigateur.newContext({ ...devices[TELEPHONE], viewport: REFERENCE, locale: 'fr-FR' });
      page = await neuf.newPage();
      await page.goto(adresse);
      await attendreSauvegarde(page, 0);
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

    const etroit = await navigateur.newContext({ ...devices[TELEPHONE], viewport: ETROIT, locale: 'fr-FR' });
    page = await etroit.newPage();
    await page.goto(adresse);
    await attendreSauvegarde(page, 0);
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
      // Plus grand que la taille « très grande » prévue (22 px pour le récit, 12 §4.10), qui n'existe pas encore.
      await page.addStyleTag({ content: '.ecran, .ecran * { font-size: 22px !important; }' });
      await ouvrir(page, premier);
      await verifierDansEcran(page, `Bulle « ${premier.bouton} », ${ETROIT.width} px, texte à 22 px`, erreurs);
      await (await versApercu(page, premier)).waitFor();
      const titre = `Aperçu « ${premier.fil} », ${ETROIT.width} px, tout le texte à 22 px`;
      await capturerEtape(titre);
      await verifierEcran(page, titre, erreurs);
      await verifierDansEcran(page, titre, erreurs);
    }
  } catch (erreur) {
    erreurs.push(erreur instanceof Error ? erreur.message : String(erreur));
  } finally {
    await navigateur?.close();
    const http = serveur?.httpServer;
    if (http !== undefined) await new Promise<void>((resoudre) => http.close(() => resoudre()));
  }

  const resultat = { telephone: TELEPHONE, ecrans: [REFERENCE, ETROIT], installable, horsLigne, erreurs, etapes };
  writeFileSync(join(SORTIE, 'resultat.json'), `${JSON.stringify(resultat, null, 2)}\n`);
  writeFileSync(join(SORTIE, 'commentaire.md'), commentaire(etapes, erreurs, installable, horsLigne));
  return { etapes, erreurs };
}

if (isMainModule(import.meta.url)) {
  const { etapes, erreurs } = await capturer();
  for (const etape of etapes) console.log(`[${etape.image}] ${etape.titre}\n${etape.recit}\n${etape.situation}\n`);
  for (const erreur of erreurs) console.error(`ERREUR : ${erreur}`);
  console.log(erreurs.length === 0 ? 'Captures : parcours réussi dans l’appli, reprise au dernier geste, police servie hors ligne.' : 'Captures : ÉCHEC.');
  if (erreurs.length > 0) process.exitCode = 1;
}
