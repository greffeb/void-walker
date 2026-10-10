import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, devices, type Page } from 'playwright';
import { preview } from 'vite';
import { jouer, nouvellePartie, observer, type Partie } from '../engine';
import { libelleOption, MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { trouverOption } from './rejouer-parcours';
import { REPO_ROOT, isMainModule } from './repo-files';

// Captures (AP-09, D-135) : un navigateur joue le parcours témoin sur un téléphone simulé.
// Niveau « vérifié automatiquement » : jamais une validation humaine (C-10 §2).

const SORTIE = join(REPO_ROOT, 'captures');
const TELEPHONE = 'Pixel 7';

export interface EtapeCapture {
  readonly titre: string;
  readonly image: string;
  readonly recit: string;
  readonly situation: string;
}

/** Libellés du parcours témoin, calculés par le moteur et les textes : ils ne dépendent pas de la graine. */
export function libellesDuParcours(entree: EntreeMonde): string[] {
  let partie: Partie = nouvellePartie(entree.monde, { version: 'libelles', graine: 0 });
  return entree.parcours.etapes.map((etape) => {
    const option = trouverOption(observer(entree.monde, partie.etat), etape);
    if (option === undefined) throw new Error(`Étape introuvable : ${etape.action} ${etape.cible}.`);
    const resultat = jouer(entree.monde, partie, option.commande);
    if (resultat.type !== 'engagee') throw new Error(`Étape non engagée : ${etape.action}.`);
    partie = resultat.partie;
    return libelleOption(entree.textes, option).libelle;
  });
}

async function attendreSauvegarde(page: Page, actions: number): Promise<void> {
  await page.locator(`[data-testid="sauvegarde"][data-actions="${actions}"][data-etat="sauvegardee"]`).waitFor({ timeout: 10_000 });
}

async function lire(page: Page): Promise<{ recit: string; situation: string }> {
  const texte = async (id: string): Promise<string> => (await page.getByTestId(id).innerText()).replace(/\n\s*\n/g, '\n').trim();
  return { recit: await texte('recit'), situation: await texte('situation') };
}

function commentaire(etapes: readonly EtapeCapture[], erreurs: readonly string[], installable: string): string {
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
    `Captures d’un navigateur automatique sur téléphone simulé (${TELEPHONE}). Niveau de preuve : **vérifié automatiquement**, ce n’est pas une validation humaine.`,
    '',
    erreurs.length === 0 ? '**Parcours du monde de test : réussi.**' : `**Parcours du monde de test : ÉCHEC.**\n\n${erreurs.map((erreur) => `- ${erreur}`).join('\n')}`,
    `Installation : ${installable}`,
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
  const libelles = libellesDuParcours(entree);
  rmSync(SORTIE, { recursive: true, force: true });
  mkdirSync(SORTIE, { recursive: true });

  const serveur = await preview({ configFile: join(REPO_ROOT, 'vite.config.ts'), logLevel: 'warn' });
  const adresse = serveur.resolvedUrls?.local[0];
  const navigateur = await chromium.launch();
  const etapes: EtapeCapture[] = [];
  const erreurs: string[] = [];
  let installable = 'non vérifiée';
  try {
    if (adresse === undefined) throw new Error('Serveur de prévisualisation sans adresse.');
    const contexte = await navigateur.newContext({ ...devices[TELEPHONE], locale: 'fr-FR' });
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
    const fermee = page.getByRole('button', { name: libelles[2] ?? '', exact: true });
    if (!(await fermee.isDisabled())) erreurs.push(`« ${libelles[2]} » devrait être indisponible au départ.`);

    for (const [index, libelle] of libelles.entries()) {
      await page.getByRole('button', { name: libelle, exact: true }).click();
      await attendreSauvegarde(page, index + 1);
      const avant = await capturerEtape(libelle);
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
  } catch (erreur) {
    erreurs.push(erreur instanceof Error ? erreur.message : String(erreur));
  } finally {
    await navigateur.close();
    await new Promise<void>((resoudre) => serveur.httpServer.close(() => resoudre()));
  }

  writeFileSync(join(SORTIE, 'resultat.json'), `${JSON.stringify({ telephone: TELEPHONE, installable, erreurs, etapes }, null, 2)}\n`);
  writeFileSync(join(SORTIE, 'commentaire.md'), commentaire(etapes, erreurs, installable));
  return { etapes, erreurs };
}

if (isMainModule(import.meta.url)) {
  const { etapes, erreurs } = await capturer();
  for (const etape of etapes) console.log(`[${etape.image}] ${etape.titre}\n${etape.recit}\n${etape.situation}\n`);
  for (const erreur of erreurs) console.error(`ERREUR : ${erreur}`);
  console.log(erreurs.length === 0 ? 'Captures : parcours réussi dans l’appli, reprise au dernier geste.' : 'Captures : ÉCHEC.');
  if (erreurs.length > 0) process.exitCode = 1;
}
