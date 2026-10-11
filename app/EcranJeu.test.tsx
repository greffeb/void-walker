import { renderToStaticMarkup } from 'react-dom/server';
import { observer, type IdAction, type OptionMenu } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { App } from './App';
import { BulleDeplacement, BulleInventaire, BulleObjet, DockPiece, EcranJeu } from './EcranJeu';
import { composerDock, unToucher, type Groupe } from './ecran';
import { commencer, consulter, jouerOption, prevoir, type Environnement, type Jeu } from './jeu';
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

const rienAJouer = (): void => undefined;

function composition(jeu: Jeu, action: IdAction | null) {
  return {
    textes,
    occupe: false,
    jouer: rienAJouer,
    lire: (option: OptionMenu) => consulter(env, jeu.partie, option),
    prevoir: (option: OptionMenu) => prevoir(env, jeu.partie, option),
    direct: (option: OptionMenu) => unToucher(monde, jeu.partie, option),
    fermer: rienAJouer,
    action,
    choisirAction: rienAJouer,
  };
}

/** Bulle d'une puce, rendue côté serveur : l'ancrage ne se calcule que dans le navigateur. */
function bulleObjet(jeu: Jeu, groupe: Groupe, action: IdAction | null = null): string {
  return renderToStaticMarkup(<BulleObjet ancre={{} as HTMLElement} groupe={groupe} {...composition(jeu, action)} />);
}

function bulleInventaire(jeu: Jeu, cible: string | null, action: IdAction | null = null): string {
  return renderToStaticMarkup(
    <BulleInventaire
      id="inventaire"
      groupes={composerDock(observer(monde, jeu.partie.etat)).inventaire}
      cible={cible}
      choisir={rienAJouer}
      {...composition(jeu, action)}
    />,
  );
}

function description(jeu: Jeu, nom: string): string {
  const option = observer(monde, jeu.partie.etat).menu.find((choix) => choix.action === 'regarder' && choix.cible.nom === nom);
  if (option === undefined) throw new Error(`Regard sur ${nom} absent.`);
  return consulter(env, jeu.partie, option).join(' ').replace(/\s+/g, ' ');
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

  it('dock : puces des choses de la pièce, regard autour de soi, déplacement indisponible avec sa raison (12 §3.7)', async () => {
    const dock = entre(rendre(await commencer(env)), '<section class="dock"', '</section>');
    expect(texte(dock)).toBe(
      'Dans la pièce ▸ Carnet ▸ Porte de l’atelier ▸ Grille de la soute ▸ Regarder autour de vous Se déplacer vers ⊘ atelier La porte de l’atelier est fermée. ⊘ soute La grille de la soute est fermée.',
    );
    const deplacement = entre(dock, '<button type="button" class="deplacement', '</button>');
    expect(deplacement).toContain(
      'class="deplacement indisponible" aria-disabled="true" aria-label="atelier, indisponible : La porte de l’atelier est fermée."',
    );
    expect(deplacement).not.toContain('disabled=""');
    expect(dock).not.toContain('aria-expanded="true"');
    expect(dock.match(/aria-haspopup="dialog"/g)).toHaveLength(3);
  });

  it('puce dont la bulle est ouverte : seule en vidéo inverse', async () => {
    const dock = composerDock(observer(monde, (await commencer(env)).partie.etat));
    const carnet = dock.piece[0];
    if (carnet === undefined) throw new Error('Puce du carnet absente.');
    const html = renderToStaticMarkup(
      <DockPiece
        dock={dock}
        textes={textes}
        occupe={false}
        puceOuverte={carnet.cible.id}
        deplacementOuvert={null}
        ouvrir={rienAJouer}
        ouvrirDeplacement={rienAJouer}
        direct={() => false}
        jouer={rienAJouer}
      />,
    );
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(entre(html, '<button type="button" class="puce"', '</button>')).toContain('aria-expanded="true"');
  });

  it('bulle d’une puce : dialogue nommé, fiche gratuite puis actions, sans « Regarder » à confirmer (12 §3.5)', async () => {
    const jeu = await commencer(env);
    const [carnet, porte] = composerDock(observer(monde, jeu.partie.etat)).piece;
    if (carnet === undefined || porte === undefined) throw new Error('Puces absentes.');
    const html = bulleObjet(jeu, carnet);
    expect(html).toMatch(
      /^<section class="bulle bulle-objet" role="dialog" aria-modal="true" aria-labelledby="[^"]+" aria-describedby="[^"]+" tabindex="-1">/,
    );
    const titre = html.match(/aria-labelledby="([^"]+)"/)?.[1] ?? '';
    expect(html).toContain(`<h2 id="${titre}" class="bulle-titre">Carnet</h2>`);
    const fiche = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? '';
    expect(texte(entre(html, `<div id="${fiche}" class="fiche">`, '</div>'))).toBe(description(jeu, 'carnet'));
    expect(html).toContain('aria-label="Fermer"');
    expect(html).not.toContain('Étape précédente');
    expect(texte(html)).toBe(`Carnet ✕ ${description(jeu, 'carnet')} ▸ Prendre`);
    expect(html).toContain('<button type="button" class="ligne" aria-label="Prendre, sans confirmation"><span aria-hidden="true">▸ </span>Prendre</button>');
    expect(texte(bulleObjet(jeu, porte))).toBe(`Porte de l’atelier ✕ ${description(jeu, 'porte')} ▸ Ouvrir`);
  });

  it('un seul toucher (D-182) : prendre sans risque ni coût joue la ligne, une porte garde l’aperçu', async () => {
    const jeu = await commencer(env);
    const [carnet, porte] = composerDock(observer(monde, jeu.partie.etat)).piece;
    if (carnet === undefined || porte === undefined) throw new Error('Puces absentes.');
    expect(bulleObjet(jeu, carnet)).toContain('aria-label="Prendre, sans confirmation"');
    expect(bulleObjet(jeu, porte)).toContain('<button type="button" class="ligne"><span aria-hidden="true">▸ </span>Ouvrir</button>');
    // Pendant l'enregistrement d'une action, la ligne ne joue rien de plus.
    const occupee = renderToStaticMarkup(<BulleObjet ancre={{} as HTMLElement} groupe={carnet} {...composition(jeu, null)} occupe={true} />);
    expect(occupee).toContain('aria-label="Prendre, sans confirmation" disabled=""');
  });

  it('un seul toucher (D-182) : déplacement sans danger connu joué tout de suite ; vers la créature entendue, aperçu', async () => {
    const debut = await commencer(env);
    const grille = observer(monde, debut.partie.etat).menu.find((option) => option.action === 'ouvrir' && option.cible.nom === 'grille');
    if (grille === undefined) throw new Error('Grille absente.');
    const ouverte = await jouerOption(env, debut, grille);
    const soute = entre(entre(rendre(ouverte), '<ul class="deplacements"', '</ul>'), '<button type="button" class="deplacement"', '</button>');
    expect(soute).toContain('aria-label="soute, sans confirmation"');
    expect(soute).not.toContain('aria-haspopup');
    const porte = entre(entre(rendre(await apres('ouvrir')), '<ul class="deplacements"', '</ul>'), '<button type="button" class="deplacement"', '</button>');
    expect(porte).toContain('aria-haspopup="dialog"');
    expect(porte).not.toContain('sans confirmation');
  });

  it('action choisie : fil « Carnet › Prendre », aperçu RISQUE / COÛT / SAVOIR, ANNULER puis CONFIRMER (12 §3.5, §3.8)', async () => {
    const jeu = await commencer(env);
    const carnet = composerDock(observer(monde, jeu.partie.etat)).piece[0];
    if (carnet === undefined) throw new Error('Puce du carnet absente.');
    const html = bulleObjet(jeu, carnet, 'prendre');
    expect(html).toContain('aria-label="Étape précédente"');
    expect(texte(html)).toBe('‹ Carnet › Prendre ✕ Risque aucun risque connu Coût aucun Savoir Vous aurez le carnet en main. Annuler Confirmer');
    const apercu = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? '';
    expect(html).toContain(`<dl id="${apercu}" class="apercu"><dt>Risque</dt><dd><strong>aucun risque connu</strong></dd>`);
    expect(html).toMatch(/<div class="confirmation"><button type="button" class="secondaire">Annuler<\/button><button type="button" class="principal">Confirmer<\/button><\/div>/);
    expect(texte(html)).not.toMatch(/\d|%|Rien ne se passe/);
  });

  it('déplacement : bulle d’aperçu « Aller vers › atelier », sans étape précédente (12 §4.3)', async () => {
    const jeu = await apres('ouvrir');
    const aller = composerDock(observer(monde, jeu.partie.etat)).deplacements[0];
    if (aller === undefined || !aller.disponible) throw new Error('Déplacement ouvert attendu.');
    const html = renderToStaticMarkup(<BulleDeplacement ancre={{} as HTMLElement} option={aller} {...composition(jeu, null)} />);
    expect(html).toMatch(/^<section class="bulle bulle-objet" role="dialog" aria-modal="true"/);
    // La porte grippée a attiré la créature dans l'atelier, entendue derrière la porte : l'aperçu prévient (D-181, 12 §3.8).
    expect(texte(html)).toBe(
      'Aller vers › atelier ✕ Risque modéré — quelque chose bougeait derrière la porte de l’atelier Coût aucun Savoir Vous quitterez la cabine. Annuler Confirmer',
    );
    expect(html).toContain('<dd><strong>modéré</strong> — quelque chose bougeait derrière la porte de l’atelier</dd>');
    const dock = entre(rendre(jeu), '<section class="dock"', '</section>');
    expect(entre(dock, '<button type="button" class="deplacement"', '</button>')).toContain('aria-haspopup="dialog" aria-expanded="false"');
  });

  it('pendant l’enregistrement d’une action, aucune bulle ne s’ouvre sur l’état d’avant (C-01 §4)', async () => {
    const html = renderToStaticMarkup(<EcranJeu jeu={await apres('ouvrir')} env={env} occupe={true} choisir={rien} />);
    const ouvrants = (html.match(/<button[^>]*>/g) ?? []).filter((bouton) => bouton.includes('aria-haspopup="dialog"'));
    // Carnet, porte, grille, « → ATELIER » (ouverte) et INVENTAIRE ; « ⊘ SOUTE » n'ouvre rien.
    expect(ouvrants).toHaveLength(5);
    expect(ouvrants.every((bouton) => bouton.includes('disabled=""'))).toBe(true);
  });

  it('inventaire : l’action choisie montre aussi son aperçu ; « ‹ » revient à la fiche', async () => {
    const jeu = await apres('prendre');
    const carnet = observer(monde, jeu.partie.etat).inventaire[0];
    if (carnet === undefined) throw new Error('Carnet absent de l’inventaire.');
    expect(texte(bulleInventaire(jeu, carnet.id, 'poser'))).toBe(
      '‹ Carnet › Poser ✕ Risque aucun risque connu Coût aucun Savoir Le carnet restera dans la cabine. Annuler Confirmer',
    );
  });

  it('action indisponible dans une bulle : visible, « ⊘ », raison à droite, aria-disabled, jamais barrée (12 §3.7)', async () => {
    const jeu = await commencer(env);
    const menu = observer(monde, jeu.partie.etat).menu;
    const regarder = menu.find((option) => option.action === 'regarder' && option.cible.sorte === 'passage');
    const aller = menu.find((option) => option.action === 'aller');
    if (regarder === undefined || aller === undefined || aller.disponible) throw new Error('Passage fermé attendu au départ.');
    // Le monde de test n'a pas encore d'action indisponible dans une bulle : on y range le déplacement, fermé au départ.
    const html = bulleObjet(jeu, { cible: aller.cible as Groupe['cible'], options: [regarder, aller] });
    const ligne = entre(html, '<button type="button" class="ligne indisponible"', '</button>');
    expect(ligne).toContain('aria-disabled="true"');
    expect(ligne).not.toMatch(/disabled=""|<s>|<del>|line-through/);
    expect(texte(ligne)).toBe('⊘ Aller vers La porte de l’atelier est fermée.');
    expect(ligne).toContain('aria-label="Aller vers, indisponible : La porte de l’atelier est fermée."');
    expect(ligne).toContain('<span class="raison">La porte de l’atelier est fermée.</span>');
  });

  it('inventaire : bulle cyan, liste exacte des objets portés, puis la même composition qu’en pièce (D-154, D-176)', async () => {
    const jeu = await apres('prendre');
    const liste = bulleInventaire(jeu, null);
    expect(liste).toMatch(/^<section id="inventaire" class="bulle bulle-inventaire" role="dialog" aria-modal="true" aria-labelledby="[^"]+" tabindex="-1">/);
    expect(texte(liste)).toBe('Inventaire ✕ ▸ Carnet');
    const carnet = observer(monde, jeu.partie.etat).inventaire[0];
    if (carnet === undefined) throw new Error('Carnet absent de l’inventaire.');
    const fiche = bulleInventaire(jeu, carnet.id);
    expect(fiche).toContain('aria-label="Étape précédente"');
    expect(texte(fiche)).toBe(`‹ Carnet ✕ ${description(jeu, 'carnet')} ▸ Poser`);
    expect(texte(bulleInventaire(await commencer(env), null))).toBe('Inventaire ✕ Vous ne portez rien.');
  });

  it('navigation : seulement INVENTAIRE, bouton texte sans pictogramme qui ouvre une bulle', async () => {
    const nav = entre(rendre(await commencer(env)), '<nav', '</nav>');
    expect(nav.match(/<button/g)).toHaveLength(1);
    expect(texte(nav)).toBe('Inventaire');
    expect(nav).toContain('aria-haspopup="dialog" aria-expanded="false"');
    expect(nav).not.toMatch(/<svg|<img/);
  });

  it('rappel « > Carnet · Prendre » en tête du récit, avec le même nom que la puce (NP-04)', async () => {
    const recit = entre(rendre(await apres('prendre')), 'data-testid="recit"', '</section>');
    expect(recit).toMatch(/^data-testid="recit" aria-live="polite" tabindex="-1"><p class="rappel" data-testid="rappel"><span aria-hidden="true">&gt; <\/span>Carnet · Prendre<\/p>/);
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
    expect(texte(situation)).toBe(
      'Vous êtes dans la cabine. Vous voyez ici un carnet. La porte de l’atelier est fermée. La grille de la soute est fermée. Vous ne portez rien.',
    );
    expect(situation).toContain('data-testid="situation"');
  });

  it('lignes de balayage sur tout l’écran, masquées aux lecteurs d’écran (12 §2.3)', () => {
    const html = renderToStaticMarkup(<App env={env} version="v-test" commit="" pr="" />);
    expect(html).toContain('<div class="balayage" aria-hidden="true"></div>');
  });
});
