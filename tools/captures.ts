import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, devices, type Locator, type Page } from 'playwright';
import { preview } from 'vite';
import { jouer, nouvellePartie, observer, type Observation, type OptionMenu, type Partie } from '../engine';
import { libelleOption, MONDE_PAR_DEFAUT, MONDES, nomDe, type EntreeMonde } from '../content';
import { composerDock, nomDestination, nomPuce, rappelDe, texteRappel } from '../app/ecran';
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
  readonly rappel: string;
  /** Nom de la cible ou de la destination, attendu dans le récit (NP-04). */
  readonly nom: string;
}

function gesteDe({ textes }: EntreeMonde, observation: Observation, option: OptionMenu): Geste {
  const dock = composerDock(observation);
  const titre = libelleOption(textes, option).libelle;
  const rappel = texteRappel(textes, rappelDe(option)).texte;
  if (dock.deplacements.includes(option)) {
    const destination = nomDestination(textes, option);
    return { titre, zone: 'deplacement', bouton: destination, verbe: null, rappel, nom: destination };
  }
  const zone = dock.piece.some((groupe) => groupe.options.includes(option)) ? 'piece' : 'inventaire';
  return { titre, zone, bouton: nomPuce(textes, option.cible), verbe: textes.verbes[option.action], rappel, nom: nomDe(textes, option.cible).texte };
}

/** Gestes du parcours témoin, calculés par le moteur, les textes et le rangement de l'écran : ils ne dépendent pas de la graine. */
export function gestesDuParcours(entree: EntreeMonde): Geste[] {
  let partie: Partie = nouvellePartie(entree.monde, { version: 'gestes', graine: 0 });
  return entree.parcours.etapes.map((etape) => {
    const observation = observer(entree.monde, partie.etat);
    const option = trouverOption(observation, etape);
    if (option === undefined) throw new Error(`Étape introuvable : ${etape.action} ${etape.cible}.`);
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`Étape non engagée : ${etape.action}.`);
    partie = resultat.partie;
    return gesteDe(entree, observation, option);
  });
}

function echapper(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactement(texte: string): RegExp {
  return new RegExp(`^${echapper(texte)}$`, 'i');
}

/** Ouvre la bulle de la puce, dans la pièce ou dans l'inventaire ; renvoie le bouton qui joue l'étape. */
async function preparer(page: Page, geste: Geste): Promise<Locator> {
  if (geste.zone === 'deplacement') return page.getByRole('button', { name: exactement(geste.bouton) });
  if (geste.zone === 'inventaire') {
    const inventaire = page.getByRole('button', { name: exactement('Inventaire') });
    if ((await inventaire.getAttribute('aria-expanded')) !== 'true') await inventaire.click();
    await page.getByRole('dialog', { name: exactement('Inventaire') }).getByRole('button', { name: exactement(geste.bouton) }).click();
  } else {
    await page.locator('.dock').getByRole('button', { name: exactement(geste.bouton) }).click();
  }
  return page.getByRole('dialog', { name: exactement(geste.bouton) }).getByRole('button', { name: exactement(geste.verbe ?? '') });
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

const FERMETURES = ['✕', 'voile', 'Échap', 'retour système'] as const;

/**
 * Ouvrir, parcourir et fermer dix fois les bulles ne change rien (C-01 A-01) ; le focus entre dans la bulle,
 * n'en sort pas au clavier et revient sur la puce à la fermeture (12 §7).
 */
async function verifierSansEffet(page: Page, erreurs: string[]): Promise<void> {
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)) };
  const puces = await page.locator('.dock [aria-haspopup="dialog"]').all();
  if (puces.length === 0) erreurs.push('Aucune puce à ouvrir au départ : bulles non vérifiées.');
  for (let fois = 0; fois < 10; fois++) {
    const puce = puces[fois % puces.length];
    const fermeture = FERMETURES[fois % FERMETURES.length] ?? '✕';
    if (puce === undefined) break;
    const nom = (await puce.innerText()).replace(/^▸\s*/, '').trim();
    await puce.click();
    const bulle = page.getByRole('dialog', { name: exactement(nom) });
    await bulle.waitFor();
    if ((await puce.getAttribute('aria-expanded')) !== 'true') erreurs.push(`Bulle « ${nom} » : la puce n’est pas marquée ouverte.`);
    if (fois === 0) {
      for (const touche of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
        await page.keyboard.press(touche);
        if (!(await bulle.evaluate((element) => element.contains(document.activeElement)))) {
          erreurs.push(`Bulle « ${nom} » : le focus sort de la bulle au clavier (${touche}).`);
          break;
        }
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
}

/** Inventaire : liste, fiche, « ‹ », puis fermeture, quatre fois, sans effet ; le focus revient sur INVENTAIRE. */
async function verifierInventaireSansEffet(page: Page, geste: Geste, erreurs: string[]): Promise<void> {
  const avant = { partie: await partieEnregistree(page), ...(await lire(page)) };
  const actions = await page.getByTestId('sauvegarde').getAttribute('data-actions');
  const inventaire = page.getByRole('button', { name: exactement('Inventaire') });
  for (const fermeture of FERMETURES) {
    await inventaire.click();
    const liste = page.getByRole('dialog', { name: exactement('Inventaire') });
    await liste.getByRole('button', { name: exactement(geste.bouton) }).click();
    const fiche = page.getByRole('dialog', { name: exactement(geste.bouton) });
    await fiche.getByRole('button', { name: exactement('Étape précédente') }).click();
    await liste.waitFor({ timeout: 5_000 }).catch(() => erreurs.push('Inventaire : « ‹ » ne ramène pas à la liste.'));
    await liste.getByRole('button', { name: exactement(geste.bouton) }).click();
    await fermerBulle(page, fiche, fermeture);
    await fiche.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => erreurs.push(`Inventaire : ${fermeture} ne le ferme pas.`));
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
      const bouton = await preparer(page, geste);
      if (geste.zone === 'inventaire' || (index === 0 && geste.zone === 'piece')) {
        const titre = geste.zone === 'inventaire' ? `Inventaire, fiche « ${geste.bouton} »` : `Bulle « ${geste.bouton} » ouverte`;
        await capturerEtape(titre);
        await verifierEcran(page, titre, erreurs);
        await verifierDansEcran(page, titre, erreurs);
      }
      await bouton.click();
      await attendreSauvegarde(page, index + 1);
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

    const etroit = await navigateur.newContext({ ...devices[TELEPHONE], viewport: ETROIT, locale: 'fr-FR' });
    page = await etroit.newPage();
    await page.goto(adresse);
    await attendreSauvegarde(page, 0);
    const premier = gestes[0];
    if (premier !== undefined && premier.zone !== 'deplacement') {
      await preparer(page, premier);
      await capturerEtape(`Départ, bulle « ${premier.bouton} », ${ETROIT.width} px de large`);
      await verifierEcran(page, `Départ, ${ETROIT.width} px`, erreurs);
      await verifierDansEcran(page, `Départ, ${ETROIT.width} px`, erreurs);
      await page.keyboard.press('Escape');
      // Plus grand que la taille « très grande » prévue (22 px pour le récit, 12 §4.10), qui n'existe pas encore.
      await page.addStyleTag({ content: '.ecran, .ecran * { font-size: 22px !important; }' });
      await preparer(page, premier);
      const titre = `Bulle « ${premier.bouton} », ${ETROIT.width} px, tout le texte à 22 px`;
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
