import { renderToStaticMarkup } from 'react-dom/server';
import { observer } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { App } from './App';
import { BulleInventaire, DockPiece, EcranJeu } from './EcranJeu';
import { composerDock } from './ecran';
import { commencer, jouerOption, type Environnement, type Jeu } from './jeu';
import type { Stockage } from './sauvegarde';

const { monde, textes } = MONDES[MONDE_PAR_DEFAUT] as EntreeMonde;

function memoire(): Stockage {
  let donnees: unknown = null;
  return {
    lire: () => Promise.resolve(donnees),
    ecrire: (nouvelles) => {
      donnees = nouvelles;
      return Promise.resolve();
    },
  };
}

const env: Environnement = { monde, textes, version: 'v-test', stockage: memoire(), graine: () => 5 };
const rien = (): Promise<void> => Promise.resolve();

function rendre(jeu: Jeu, ouvrirOptions?: () => void): string {
  return renderToStaticMarkup(<EcranJeu jeu={jeu} env={env} occupe={false} choisir={rien} ouvrirOptions={ouvrirOptions} />);
}

/** Texte de la page, sans balises ni attributs. */
function texte(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function entre(html: string, debut: string, fin: string): string {
  const depuis = html.indexOf(debut);
  return depuis === -1 ? '' : html.slice(depuis, html.indexOf(fin, depuis) + fin.length);
}

async function apres(...actions: string[]): Promise<Jeu> {
  let jeu = await commencer(env);
  for (const action of actions) {
    const option = observer(monde, jeu.partie.etat).menu.find((choix) => choix.action === action && choix.disponible);
    if (option === undefined) throw new Error(`Option ${action} absente.`);
    jeu = await jouerOption(env, jeu, option);
  }
  return jeu;
}

describe('écran de jeu « Phosphore » (12 §3.1 à §3.4, §7, §11)', () => {
  it('se lit dans l’ordre en-tête de pièce, récit, dock, navigation', async () => {
    const html = rendre(await commencer(env));
    const reperes = ['<header class="entete-piece"', 'data-testid="recit"', '<section class="dock"', '<nav class="navigation"'].map((repere) =>
      html.indexOf(repere),
    );
    expect(reperes.every((position) => position >= 0)).toBe(true);
    expect([...reperes].sort((a, b) => a - b)).toEqual(reperes);
    expect(html).toContain('<h1 class="titre-piece">cabine</h1>');
  });

  it('en-tête : engrenage masqué tant que l’écran d’options n’existe pas, bouton « Options » sinon', async () => {
    const jeu = await commencer(env);
    expect(rendre(jeu)).not.toContain('Options');
    expect(entre(rendre(jeu, () => undefined), '<button', '</button>')).toMatch(/class="engrenage" aria-label="Options"/);
  });

  it('dock : puces des choses de la pièce, regard autour de soi, déplacement indisponible avec sa raison', async () => {
    const dock = entre(rendre(await commencer(env)), '<section class="dock"', '</section>');
    expect(texte(dock)).toBe(
      'Dans la pièce ▸ Carnet ▸ Porte de l’atelier ▸ Regarder autour de vous Se déplacer vers → atelier La porte de l’atelier est fermée.',
    );
    expect(entre(dock, '<button type="button" class="deplacement"', '</button>')).toContain('disabled=""');
    expect(dock).not.toContain('aria-expanded="true"');
  });

  it('puce touchée : ses options se déplient sous sa rangée, la puce passe en vidéo inverse', async () => {
    const dock = composerDock(observer(monde, (await commencer(env)).partie.etat));
    const carnet = dock.piece[0];
    if (carnet === undefined) throw new Error('Puce du carnet absente.');
    const html = renderToStaticMarkup(
      <DockPiece dock={dock} textes={textes} occupe={false} deplie={carnet.cible.id} basculer={() => undefined} jouer={() => undefined} />,
    );
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(texte(entre(html, '<div id=', '</div></div></li>'))).toBe('▸ Regarder ▸ Prendre');
    expect(html).toMatch(/role="group" aria-label="Carnet"/);
  });

  it('inventaire : bulle cyan nommée, puces des objets portés avec les mêmes options qu’en pièce (D-154, D-176)', async () => {
    const dock = composerDock(observer(monde, (await apres('prendre')).partie.etat));
    const carnet = dock.inventaire[0];
    if (carnet === undefined) throw new Error('Carnet absent de l’inventaire.');
    const html = renderToStaticMarkup(
      <BulleInventaire
        id="inventaire"
        groupes={dock.inventaire}
        textes={textes}
        occupe={false}
        deplie={carnet.cible.id}
        basculer={() => undefined}
        jouer={() => undefined}
        fermer={() => undefined}
      />,
    );
    expect(html).toMatch(/^<section id="inventaire" class="bulle bulle-inventaire" role="dialog" aria-label="Inventaire" tabindex="-1">/);
    expect(texte(html)).toBe('Inventaire ▸ Carnet ▸ Regarder ▸ Poser');
    expect(html).toMatch(/role="group" aria-label="Carnet"/);
  });

  it('navigation : seulement INVENTAIRE, bouton texte sans pictogramme', async () => {
    const nav = entre(rendre(await commencer(env)), '<nav', '</nav>');
    expect(nav.match(/<button/g)).toHaveLength(1);
    expect(texte(nav)).toBe('Inventaire');
    expect(nav).not.toMatch(/<svg|<img/);
  });

  it('rappel « > Carnet · Prendre » en tête du récit, avec le même nom que la puce (NP-04)', async () => {
    const recit = entre(rendre(await apres('prendre')), 'data-testid="recit"', '</section>');
    expect(recit).toMatch(/^data-testid="recit" aria-live="polite"><p class="rappel" data-testid="rappel"><span aria-hidden="true">&gt; <\/span>Carnet · Prendre<\/p>/);
    expect(texte(recit)).toMatch(/Vous (prenez|ramassez) le carnet\./);
  });

  it('aucun chiffre ni compteur d’actions affiché ; réussite de sauvegarde silencieuse, attributs de capture gardés', async () => {
    const html = rendre(await apres('prendre', 'ouvrir'));
    expect(texte(html)).not.toMatch(/\d/);
    expect(html).not.toContain('sauvegardée');
    const sauvegarde = html.match(/<p[^>]*data-testid="sauvegarde"[^>]*>/)?.[0] ?? '';
    expect(sauvegarde).toContain('data-actions="2"');
    expect(sauvegarde).toContain('data-etat="sauvegardee"');
    expect(sauvegarde).toContain('hidden=""');
  });

  it('échec de sauvegarde : avertissement visible, annoncé, attributs gardés', async () => {
    const html = rendre({ ...(await apres('prendre')), sauvegarde: 'echec' });
    const sauvegarde = entre(html, '<p class="avis-sauvegarde"', '</p>');
    expect(sauvegarde).toContain('role="alert"');
    expect(sauvegarde).toContain('data-etat="echec"');
    expect(sauvegarde).not.toContain('hidden');
    expect(texte(sauvegarde)).toBe('La sauvegarde a échoué. Vous pouvez continuer : elle sera retentée à la prochaine action.');
  });

  it('situation en phrases : hors de l’écran, gardée pour le lecteur d’écran comme dans la CLI (C-06 K-07)', async () => {
    const situation = entre(rendre(await commencer(env)), '<section class="lecteur-seul"', '</section>');
    expect(texte(situation)).toBe('Vous êtes dans la cabine. Vous voyez ici un carnet. La porte de l’atelier est fermée. Vous ne portez rien.');
    expect(situation).toContain('data-testid="situation"');
  });

  it('lignes de balayage sur tout l’écran, masquées aux lecteurs d’écran (12 §2.3)', () => {
    const html = renderToStaticMarkup(<App env={env} version="v-test" commit="" pr="" />);
    expect(html).toContain('<div class="balayage" aria-hidden="true"></div>');
  });
});
