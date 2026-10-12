import { renderToStaticMarkup } from 'react-dom/server';
import { observer, type IdAction, type OptionMenu } from '../engine';
import { MONDES, type EntreeMonde, type EtapeParcours } from '../content';
import { App } from './App';
import { BulleDeplacement, BulleInventaire, BulleObjet, DockPiece, EcranJeu } from './EcranJeu';
import { composerDock, unToucher, type Groupe } from './ecran';
import { marquerEcrit } from './ecriture';
import { commencer, consulter, jouerOption, prevoir, type Environnement, type Jeu } from './jeu';
import type { Stockage } from './sauvegarde';

const { monde, textes } = MONDES['monde-test'] as EntreeMonde;

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

function rendre(jeu: Jeu, ouvrirOptions?: () => void, machineAEcrire = true): string {
  return renderToStaticMarkup(
    <EcranJeu jeu={jeu} env={env} machineAEcrire={machineAEcrire} occupe={false} choisir={rien} ouvrirOptions={ouvrirOptions} />,
  );
}

/** Texte de la page, sans balises ni attributs. */
function texte(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function entre(html: string, debut: string, fin: string): string {
  const depuis = html.indexOf(debut);
  return depuis === -1 ? '' : html.slice(depuis, html.indexOf(fin, depuis) + fin.length);
}

/** Ce que reçoit le lecteur d'écran dans le récit : un bloc entier par paragraphe, séparés par « | ». */
function lu(recit: string): string {
  return [...recit.matchAll(/<span class="lecteur-seul">([^<]*)<\/span>/g)].map(([, bloc = '']) => bloc).join(' | ');
}

/** Copies écrites à la machine, masquées au lecteur d'écran : leurs caractères, sans le curseur. */
function vu(recit: string): string[] {
  return recit
    .split('<span aria-hidden="true">')
    .slice(1)
    .map((copie) => [...copie.matchAll(/<span class="car"[^>]*>([^<]*)<\/span>/g)].map(([, caractere = '']) => caractere).join('').replace(/&gt;/g, '>'));
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

function composition(jeu: Jeu, action: IdAction | null, parametre: string | null = null, entree: Environnement = env) {
  return {
    textes: entree.textes,
    occupe: false,
    jouer: rienAJouer,
    lire: (option: OptionMenu) => consulter(entree, jeu.partie, option),
    prevoir: (option: OptionMenu) => prevoir(entree, jeu.partie, option),
    direct: (option: OptionMenu) => unToucher(entree.monde, jeu.partie, option),
    fermer: rienAJouer,
    action,
    choisirAction: rienAJouer,
    parametre,
    choisirParametre: rienAJouer,
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

  it('action choisie : fil « Carnet › Prendre », aperçu sans risque ni coût réduit à SAVOIR, ANNULER puis CONFIRMER (12 §3.5, §3.8, D-187)', async () => {
    const jeu = await commencer(env);
    const carnet = composerDock(observer(monde, jeu.partie.etat)).piece[0];
    if (carnet === undefined) throw new Error('Puce du carnet absente.');
    const html = bulleObjet(jeu, carnet, 'prendre');
    expect(html).toContain('aria-label="Étape précédente"');
    expect(texte(html)).toBe('‹ Carnet › Prendre ✕ Savoir Vous aurez le carnet en main. Annuler Confirmer');
    const apercu = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? '';
    expect(html).toContain(`<dl id="${apercu}" class="apercu"><dt>Savoir</dt><dd><p>Vous aurez le carnet en main.</p></dd></dl>`);
    expect(html).toMatch(/<div class="confirmation"><button type="button" class="secondaire">Annuler<\/button><button type="button" class="principal">Confirmer<\/button><\/div>/);
    expect(texte(html)).not.toMatch(/\d|%|Rien ne se passe|Risque|Coût|aucun/);
  });

  it('aperçu (D-187) : RISQUE et COÛT seulement quand ils disent autre chose que « aucun » ; SAVOIR toujours', async () => {
    const ouvrirPorte = async (jeu: Jeu): Promise<string> => {
      const porte = composerDock(observer(monde, jeu.partie.etat)).piece.find((groupe) => groupe.cible.nom === 'porte');
      if (porte === undefined) throw new Error('Puce de la porte absente.');
      return texte(bulleObjet(jeu, porte, 'ouvrir'));
    };
    const depart = await commencer(env);
    const grille = composerDock(observer(monde, depart.partie.etat)).piece.find((groupe) => groupe.cible.nom === 'grille');
    if (grille === undefined) throw new Error('Puce de la grille absente.');
    // Ni risque ni coût : une grille garde l'aperçu (D-182), réduit à SAVOIR.
    expect(texte(bulleObjet(depart, grille, 'ouvrir'))).toBe('‹ Grille de la soute › Ouvrir ✕ Savoir La grille de la soute sera ouverte. Annuler Confirmer');
    // Coût sans risque connu : la porte grippée.
    expect(await ouvrirPorte(depart)).toBe('‹ Porte de l’atelier › Ouvrir ✕ Coût [bruyant] Savoir La porte de l’atelier sera ouverte. Annuler Confirmer');
    // Risque et coût : attirée par la porte, la créature est entrée dans la cabine ; agir sous ses yeux est risqué (D-183).
    const proche = await apres('ouvrir', 'prendre', 'fermer');
    expect(rendre(proche)).toContain('La créature est là, tout près de vous.');
    expect(await ouvrirPorte(proche)).toBe(
      '‹ Porte de l’atelier › Ouvrir ✕ Risque élevé — le temps de faire cela, la créature peut vous frapper Coût [bruyant] Savoir La porte de l’atelier sera ouverte. Annuler Confirmer',
    );
  });

  it('déplacement : bulle d’aperçu « Aller vers › atelier », sans étape précédente (12 §4.3)', async () => {
    const jeu = await apres('ouvrir');
    const aller = composerDock(observer(monde, jeu.partie.etat)).deplacements[0];
    if (aller === undefined || !aller.disponible) throw new Error('Déplacement ouvert attendu.');
    const html = renderToStaticMarkup(<BulleDeplacement ancre={{} as HTMLElement} option={aller} {...composition(jeu, null)} />);
    expect(html).toMatch(/^<section class="bulle bulle-objet" role="dialog" aria-modal="true"/);
    // La porte grippée a attiré la créature dans l'atelier, entendue derrière la porte : l'aperçu prévient (D-181, 12 §3.8) ; pas de coût, pas de ligne COÛT (D-187).
    expect(texte(html)).toBe(
      'Aller vers › atelier ✕ Risque modéré — quelque chose bougeait derrière la porte de l’atelier Savoir Vous quitterez la cabine. Annuler Confirmer',
    );
    expect(html).toContain('<dd><strong>modéré</strong> — quelque chose bougeait derrière la porte de l’atelier</dd>');
    const dock = entre(rendre(jeu), '<section class="dock"', '</section>');
    expect(entre(dock, '<button type="button" class="deplacement"', '</button>')).toContain('aria-haspopup="dialog" aria-expanded="false"');
  });

  it('pendant l’enregistrement d’une action, aucune bulle ne s’ouvre sur l’état d’avant (C-01 §4)', async () => {
    const html = renderToStaticMarkup(<EcranJeu jeu={await apres('ouvrir')} env={env} machineAEcrire occupe={true} choisir={rien} />);
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
      '‹ Carnet › Poser ✕ Savoir Le carnet restera dans la cabine. Annuler Confirmer',
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
    expect(recit).toMatch(
      /^data-testid="recit" aria-live="polite" tabindex="-1"><p class="rappel" data-testid="rappel"><span class="lecteur-seul">Carnet · Prendre<\/span><span aria-hidden="true">/,
    );
    expect(lu(recit)).toMatch(/^Carnet · Prendre \| Vous (prenez|ramassez) le carnet\./);
    expect(vu(recit)[0]).toBe('> Carnet · Prendre');
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

  it('badge de santé : rien si indemne, « ! BLESSÉ » puis « !! CRITIQUE », annoncés comme état (12 §3.2)', async () => {
    const jeu = await commencer(env);
    const avec = (sante: Jeu['partie']['etat']['sante']): Jeu => ({ ...jeu, partie: { ...jeu.partie, etat: { ...jeu.partie.etat, sante } } });
    expect(rendre(jeu)).not.toContain('badge-sante');
    expect(entre(rendre(avec('blesse')), '<header', '</header>')).toContain(
      '<p class="badge-sante blesse" role="status" aria-label="État : blessé">! BLESSÉ</p>',
    );
    expect(entre(rendre(avec('critique')), '<header', '</header>')).toContain(
      '<p class="badge-sante critique" role="status" aria-label="État : critique">!! CRITIQUE</p>',
    );
    expect(texte(entre(rendre(avec('blesse')), 'data-testid="situation"', '</section>'))).toContain('Vous êtes blessé.');
  });

  it('défaite : plus d’action ni d’inventaire, la phrase de fin et NOUVELLE PARTIE (D-013)', async () => {
    const jeu = await commencer(env);
    const vaincu: Jeu = { ...jeu, partie: { ...jeu.partie, etat: { ...jeu.partie.etat, sante: 'vaincu' } } };
    const html = renderToStaticMarkup(
      <EcranJeu jeu={vaincu} env={env} machineAEcrire occupe={false} choisir={rien} nouvellePartie={() => undefined} />,
    );
    expect(html).not.toContain('badge-sante');
    expect(html).not.toContain('class="puce"');
    expect(texte(entre(html, '<section class="dock fin-partie"', '</section>'))).toBe(
      'Cette partie est terminée. Elle ne peut pas être reprise. Nouvelle partie',
    );
    expect(html).toContain('<nav class="navigation" aria-label="Navigation" hidden="">');
  });

  it('situation en phrases : hors de l’écran, gardée pour le lecteur d’écran comme dans la CLI (C-06 K-07)', async () => {
    const situation = entre(rendre(await commencer(env)), '<section class="lecteur-seul"', '</section>');
    expect(texte(situation)).toBe(
      'Vous êtes dans la cabine. Vous voyez ici un carnet. La porte de l’atelier est fermée. La grille de la soute est fermée. Vous ne portez rien.',
    );
    expect(situation).toContain('data-testid="situation"');
  });

  it('lignes de balayage sur tout l’écran, masquées aux lecteurs d’écran (12 §2.3)', () => {
    const html = renderToStaticMarkup(<App env={env} reglages={{ machineAEcrire: true }} version="v-test" commit="" pr="" />);
    expect(html).toContain('<div class="balayage" aria-hidden="true"></div>');
  });
});

describe('effet machine à écrire sur le nouveau texte (D-186)', () => {
  it('nouveau récit : écrit en 500 ms dans l’ordre de lecture, puis un seul curseur à la fin du dernier bloc', async () => {
    const jeu = await apres('prendre');
    const recit = entre(rendre(jeu), '<section class="recit', '</section>');
    expect(recit).toMatch(/^<section class="recit ecrire" data-testid="recit"/);
    const delais = [...recit.matchAll(/class="car" style="animation-delay:(\d+)ms"/g)].map(([, ms = '']) => Number(ms));
    expect(delais[0]).toBe(0);
    expect(delais.every((ms, rang) => rang === 0 || ms >= (delais[rang - 1] ?? 0))).toBe(true);
    expect(Math.max(...delais)).toBeLessThan(500);
    expect(Math.max(...delais)).toBeGreaterThan(490);
    expect(recit.match(/class="curseur"/g)).toHaveLength(1);
    expect(recit).toMatch(/<span class="curseur" style="animation-delay:500ms">▮<\/span><\/span><\/p><\/section>$/);
    expect(vu(recit)).toEqual(['> Carnet · Prendre', ...jeu.recit]);
  });

  it('lecteur d’écran : le texte entier une seule fois par bloc ; copie écrite et curseur masqués', async () => {
    const jeu = await apres('prendre');
    const recit = entre(rendre(jeu), '<section class="recit', '</section>');
    expect(recit).toContain('aria-live="polite"');
    expect(lu(recit)).toBe(['Carnet · Prendre', ...jeu.recit].join(' | '));
    // Chaque caractère et le curseur sont à l'intérieur d'une copie aria-hidden.
    const horsCopies = recit.replace(/<span aria-hidden="true">(?:<span class="(?:car|curseur)"[^>]*>[^<]*<\/span>)*<\/span>/g, '');
    expect(horsCopies).not.toMatch(/class="car"|class="curseur"|▮/);
  });

  it('réglage sur [NON] : pas d’écriture, curseur fixe ; même structure pour le lecteur d’écran', async () => {
    const jeu = await apres('prendre');
    const oui = entre(rendre(jeu), '<section class="recit', '</section>');
    const non = entre(rendre(jeu, undefined, false), '<section class="recit', '</section>');
    expect(non).toMatch(/^<section class="recit curseur-fixe" data-testid="recit"/);
    expect(non.replace('recit curseur-fixe', 'recit ecrire')).toBe(oui);
  });

  it('un texte déjà affiché n’est pas réécrit : seul le nouveau l’est', async () => {
    const jeu = await apres('prendre');
    marquerEcrit(jeu);
    expect(entre(rendre(jeu), '<section class="recit', '>')).toBe('<section class="recit" data-testid="recit" aria-live="polite" tabindex="-1">');
    const suivant = await jouerOption(env, jeu, observer(monde, jeu.partie.etat).menu.find((option) => option.action === 'ouvrir') as OptionMenu);
    expect(entre(rendre(suivant), '<section class="recit', '>')).toContain('class="recit ecrire"');
  });
});

describe('AR-01 dans l’appli : « OÙ ? », passages sans signalétique, IA Station, évacuation (#103)', () => {
  const ar01 = MONDES['ar-01'] as EntreeMonde;
  const P_C = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-C'))?.etapes ?? [];
  const envAr01: Environnement = { monde: ar01.monde, textes: ar01.textes, version: 'v-test', stockage: memoire(), graine: () => 20261010 };

  /** Option du menu désignée comme dans un parcours : nom de la cible, destination, nom du paramètre. */
  function optionAr01(jeu: Jeu, etape: EtapeParcours): OptionMenu {
    const nomParam = (parametre: OptionMenu['parametre']): string | undefined => (parametre?.sorte === 'passage' ? parametre.vers?.nom : parametre?.nom);
    const option = observer(ar01.monde, jeu.partie.etat).menu.find(
      (choix) =>
        choix.action === etape.action &&
        choix.cible.nom === etape.cible &&
        (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)) &&
        (etape.parametre === undefined || nomParam(choix.parametre) === etape.parametre),
    );
    if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
    return option;
  }

  async function pc(nombre: number): Promise<Jeu> {
    let jeu = await commencer(envAr01);
    for (const etape of P_C.slice(0, nombre)) jeu = await jouerOption(envAr01, jeu, optionAr01(jeu, etape));
    return jeu;
  }

  function rendreAr01(jeu: Jeu): string {
    return renderToStaticMarkup(<EcranJeu jeu={jeu} env={envAr01} machineAEcrire occupe={false} choisir={rien} nouvellePartie={() => undefined} />);
  }

  function groupeAr01(jeu: Jeu, nom: string, zone: 'piece' | 'inventaire' = 'piece'): Groupe {
    const groupe = composerDock(observer(ar01.monde, jeu.partie.etat))[zone].find((candidat) => candidat.cible.nom === nom);
    if (groupe === undefined) throw new Error(`Puce ${nom} absente.`);
    return groupe;
  }

  function bulleAr01(jeu: Jeu, nom: string, action: IdAction | null, parametre: string | null = null): string {
    return renderToStaticMarkup(<BulleObjet ancre={{} as HTMLElement} groupe={groupeAr01(jeu, nom)} {...composition(jeu, action, parametre, envAr01)} />);
  }

  const dockDe = (html: string): string => entre(html, '<section class="dock"', '</section>');

  it('caisse : actions, puis « OÙ ? » et ses positions, puis l’aperçu avec le paramètre dans le fil (12 §3.5, §4.6)', async () => {
    const jeu = await pc(2);
    const caisse = groupeAr01(jeu, 'caisse');
    const fiche = texte(bulleAr01(jeu, 'caisse', null));
    expect(fiche).toMatch(/^Caisse ✕ .* ▸ Déplacer$/);
    expect(fiche.match(/Déplacer/g)).toHaveLength(1);

    const ou = bulleAr01(jeu, 'caisse', 'deplacer');
    expect(texte(ou)).toBe('‹ Caisse › Déplacer ✕ Où ? ▸ sous la grille');
    expect(ou).toContain('<h3 class="question">Où ?</h3>');
    expect(ou).toContain('aria-label="Étape précédente"');
    expect(ou).not.toContain('aria-describedby');
    expect(ou).not.toContain('Confirmer');

    const sous = caisse.options.find((option) => option.parametre?.nom === 'sous_grille');
    if (sous?.parametre === undefined) throw new Error('Position sous la grille absente.');
    const apercu = bulleAr01(jeu, 'caisse', 'deplacer', sous.parametre.id);
    expect(texte(apercu)).toBe('‹ Caisse › Déplacer › sous la grille ✕ Savoir La caisse sera sous la grille. Annuler Confirmer');
    expect(apercu).toContain('Caisse › Déplacer<span class="fil-parametre"> › sous la grille</span></h2>');
    // Paramètre qui n'est plus jouable : retour à la fiche.
    expect(texte(bulleAr01(jeu, 'caisse', 'deplacer', 'inconnu'))).toBe(fiche);
  });

  it('inventaire : verser la burette passe aussi par « OÙ ? » ; vide, « Verser » n’apparaît qu’une fois, avec sa raison', async () => {
    const local = await pc(5);
    const burette = groupeAr01(local, 'burette', 'inventaire');
    const inventaire = (jeu: Jeu, action: IdAction | null, parametre: string | null = null): string =>
      renderToStaticMarkup(
        <BulleInventaire
          id="inventaire"
          groupes={composerDock(observer(ar01.monde, jeu.partie.etat)).inventaire}
          cible={burette.cible.id}
          choisir={rienAJouer}
          {...composition(jeu, action, parametre, envAr01)}
        />,
      );
    const ou = texte(inventaire(local, 'verser'));
    expect(ou).toMatch(/^‹ Burette d’huile › Verser ✕ Où \? (▸ [^▸]+ )*▸ Cloison de la salle d’observation( ▸ [^▸]+)*$/);
    const cloison = burette.options.find((option) => option.parametre?.sorte === 'passage' && option.parametre.vers?.nom === 'observation');
    if (cloison?.parametre === undefined) throw new Error('Cloison de l’observation absente.');
    expect(texte(inventaire(local, 'verser', cloison.parametre.id))).toMatch(
      /^‹ Burette d’huile › Verser › Cloison de la salle d’observation ✕ Savoir Le sol sera glissant au pied de la cloison de la salle d’observation/,
    );

    const vide = await jouerOption(envAr01, local, cloison);
    const fiche = inventaire(vide, null);
    expect(fiche.match(/class="ligne indisponible"/g)).toHaveLength(1);
    expect(texte(fiche)).toMatch(/⊘ Verser La burette d’huile est vide\.$/);
    expect(texte(inventaire(vide, 'verser'))).toBe(texte(fiche));
  });

  it('grille sans signalétique : une puce tant qu’elle est fermée ; ouverte, « → GRILLE » ; franchie, sa destination (D-147)', async () => {
    const atelier = dockDe(rendreAr01(await pc(1)));
    expect(texte(atelier)).toContain('▸ Grille');
    expect(texte(entre(atelier, '<ul class="deplacements"', '</ul>'))).toBe('→ salon de transit');
    const ouverte = dockDe(rendreAr01(await pc(4)));
    expect(texte(entre(ouverte, '<ul class="deplacements"', '</ul>'))).toBe('→ salon de transit → grille');
    const local = dockDe(rendreAr01(await pc(5)));
    expect(texte(entre(local, '<ul class="deplacements"', '</ul>'))).toContain('→ atelier de service');
    expect(local).not.toMatch(/→ grille/);
  });

  it('bloc en main : « → atelier » par la grille reste visible, indisponible, avec sa raison', async () => {
    const charge = dockDe(rendreAr01(await pc(7)));
    const grille = entre(charge, '<button type="button" class="deplacement indisponible" aria-disabled="true" aria-label="atelier de service', '</button>');
    const raison = 'Ce que vous portez est trop large pour la grille de l’atelier de service.';
    expect(grille).toContain(`aria-label="atelier de service, indisponible : ${raison}"`);
    expect(texte(grille)).toBe(`⊘ atelier de service ${raison}`);
  });

  it('IA Station : au réveil puis à l’arrivée au local énergie, encadrée après le récit, écrite comme lui ; rien à l’action suivante', async () => {
    const reveil = await commencer(envAr01);
    expect(reveil.assistance).toEqual([ar01.textes.assistance.reveil]);
    const recit = entre(rendreAr01(reveil), '<section class="recit', '</section></section>');
    const ia = entre(recit, '<section class="parole-ia"', '</section>');
    expect(ia).toMatch(/^<section class="parole-ia" aria-label="Parole d’IA Station" data-testid="ia-station"><p class="etiquette-ia">\[ IA STATION \]<\/p><p class="citation-ia">/);
    expect(lu(recit)).toBe([...reveil.recit, `«\u00a0${ar01.textes.assistance.reveil ?? ''}\u00a0»`].join(' | '));
    expect(vu(recit).at(-1)).toBe(`«\u00a0${ar01.textes.assistance.reveil ?? ''}\u00a0»`);
    expect(recit.match(/class="curseur"/g)).toHaveLength(1);
    expect(ia).toContain('class="curseur"');

    const arrivee = await pc(5);
    expect(arrivee.rappel).toEqual({ texte: 'Aller vers · local énergie', capitales: true });
    expect(arrivee.assistance).toEqual([ar01.textes.assistance.energie]);
    expect(lu(entre(rendreAr01(arrivee), '<section class="recit', '</section></section>'))).toContain(`«\u00a0${ar01.textes.assistance.energie ?? ''}\u00a0»`);
    expect((await pc(6)).assistance).toEqual([]);
    expect(rendreAr01(await pc(6))).not.toContain('parole-ia');
  });

  it('évacuation : quinze actions, la phrase de la capsule et NOUVELLE PARTIE à la place du dock ; en-tête inchangé', async () => {
    const fin = await pc(P_C.length);
    expect(fin.partie.etat.actions).toBe(15);
    const html = rendreAr01(fin);
    expect(texte(entre(html, '<section class="dock fin-partie"', '</section>'))).toBe('La capsule s’est détachée. Vous avez quitté la station. Nouvelle partie');
    expect(html).not.toContain('Cette partie est terminée');
    expect(html).not.toContain('class="puce"');
    expect(html).not.toContain('class="deplacements"');
    expect(html).toContain('<nav class="navigation" aria-label="Navigation" hidden="">');
    expect(entre(html, '<header', '</header>')).toContain('<h1 class="titre-piece">cabine de la capsule</h1>');
    expect(fin.assistance).toEqual([ar01.textes.assistance.depart]);
  });
});
