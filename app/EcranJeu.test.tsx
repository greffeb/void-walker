import { renderToStaticMarkup } from 'react-dom/server';
import { carte, observer, type DefMonde, type IdAction, type OptionMenu } from '../engine';
import { ficheDe, libelleOption, MONDES, rendreListeCarte, TEXTES_CATALOGUE, texteDocument, VERSION_GENERATEUR, type DocumentRendu, type EntreeMonde, type EtapeParcours, type Nom, type TexteDocument, type TextesMonde } from '../content';
import { App, EcranRefus } from './App';
import { FicheDocument } from './bulle';
import { CATALOGUE } from './catalogue';
import { BulleInventaire, BulleObjet, degatSubi, DockPiece, EcranJeu, EcranReveil, ModaleIA } from './EcranJeu';
import { EcranFin } from './EcranFin';
import { APERCU_TAILLE, EcranOptions, GUIDES_INSTALLATION } from './EcranOptions';
import { composerDock, etapeBulle, libelleLigne, unToucher, type Groupe } from './ecran';
import { marquerEcrit } from './ecriture';
import { commencer, consulter, consulterDocument, fermerPoste, historiqueAffiche, jouerOption, prevoir, recitDeFin, type Environnement, type Jeu } from './jeu';
import type { EtatInstallation, Installation } from './installation';
import type { EtatMiseAJour, MiseAJour } from './miseAJour';
import { PanneauRapport, RETOURS, rapportPris } from './PanneauRapport';
import type { Retour } from './rapports';
import { REGLAGES_PAR_DEFAUT, type Reglages } from './reglages';
import type { Stockage } from './sauvegarde';
import type { EtatVerification } from './verification';

const { monde, textes } = MONDES['monde-test'] as EntreeMonde;

function memoire(): Stockage {
  let donnees: unknown = null;
  let lus: unknown = null;
  return {
    lire: () => Promise.resolve(donnees),
    ecrire: (nouvelles) => {
      donnees = nouvelles;
      return Promise.resolve();
    },
    lireLus: () => Promise.resolve(lus),
    ecrireLus: (nouveaux) => {
      lus = nouveaux;
      return Promise.resolve();
    },
    effacer: () => {
      donnees = null;
      lus = null;
      return Promise.resolve();
    },
  };
}

const env: Environnement = { monde, textes, version: 'v-test', stockage: memoire(), graine: () => 5 };
const rien = (): Promise<void> => Promise.resolve();
const rienALire = (): void => undefined;

function rendre(jeu: Jeu, ouvrirOptions?: () => void, machineAEcrire = true, lus: readonly string[] = [], carteANouveau = false): string {
  return renderToStaticMarkup(
    <EcranJeu
      jeu={jeu}
      lus={lus}
      env={env}
      machineAEcrire={machineAEcrire}
      occupe={false}
      choisir={rien}
      lireMessages={rienALire}
      carteANouveau={carteANouveau}
      ouvrirOptions={ouvrirOptions}
    />,
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
    lireDocument: (option: OptionMenu) => consulterDocument(entree, jeu.partie, option),
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

  it('en-tête : bouton « Options » (engrenage) quand les options sont branchées', async () => {
    const jeu = await commencer(env);
    expect(rendre(jeu)).not.toContain('Options');
    expect(entre(rendre(jeu, () => undefined), '<button', '</button>')).toMatch(/class="engrenage" aria-label="Options"/);
  });

  it('dock : objets de la pièce, regard autour de soi ; une ligne par salle, nom et état de sa porte, sans bulle (D-267)', async () => {
    const dock = entre(rendre(await commencer(env)), '<section class="dock"', '</section>');
    expect(texte(dock)).toBe('Dans la pièce ▸ Carnet ▸ Regarder ▸ Attendre Se déplacer vers atelier Fermée Bruyante soute Fermée');
    // Porte fermée : nom en pointillé, toujours touchable ; le moteur refuse sans coût, le son dit le refus.
    const nom = entre(dock, '<button type="button" class="deplacement', '</button>');
    expect(nom).toContain('class="deplacement bloque" aria-label="atelier, en haut à droite, La porte de l’atelier est fermée." data-son="refus"');
    expect(nom).not.toMatch(/disabled=""|aria-haspopup/);
    // La porte de l'atelier est grippée : « Bruyante » sous son état, lu avec lui (D-348)  ; la grille de la soute, non.
    const [porte, soute] = dock.match(/<button type="button" class="porte-etat.*?<\/button>/g) ?? [];
    expect(porte).toBe(
      '<button type="button" class="porte-etat" aria-label="Porte de l’atelier, fermée, bruyante" data-son="confirmer"><span class="temoin" aria-hidden="true"></span>' +
        '<span class="porte-mots"><span>Fermée</span><span class="porte-bruyante">Bruyante</span></span></button>',
    );
    expect(soute).toBe(
      '<button type="button" class="porte-etat" aria-label="Grille de la soute, fermée" data-son="confirmer"><span class="temoin" aria-hidden="true"></span>Fermée</button>',
    );
    // « Regarder » et « Attendre » sur une ligne, d'un toucher ; le lecteur d'écran garde « Regarder autour de vous » (D-274).
    expect(entre(dock, '<div class="autour">', '</div>')).toBe(
      '<div class="autour"><button type="button" class="puce" aria-label="Regarder autour de vous" data-son="confirmer"><span aria-hidden="true">▸ </span>Regarder</button>' +
        '<button type="button" class="puce" data-son="confirmer"><span aria-hidden="true">▸ </span>Attendre</button></div>',
    );
    // Seule la puce du carnet ouvre une bulle.
    expect(dock.match(/aria-haspopup="dialog"/g)).toHaveLength(1);
    expect(entre(dock, '<button type="button" class="puce"', '</button>')).toContain('data-son="bulle"');
  });

  it('porte ouverte : nom plein qui fait passer, état « Ouverte » ; la créature entendue derrière se signale (D-267)', async () => {
    const dock = entre(rendre(await apres('ouvrir')), '<ul class="deplacements"', '</ul>');
    const ligne = entre(dock, '<li class="salle"', '</li>');
    expect(texte(ligne)).toBe('atelier Bruit Ouverte');
    expect(ligne).toContain('<button type="button" class="deplacement repere-danger" aria-label="atelier, en haut à droite, bruit" data-son="confirmer">');
    expect(ligne).toContain('<span class="repere" aria-hidden="true">Bruit</span>');
    expect(ligne).toContain('class="porte-etat ouverte" aria-label="Porte de l’atelier, ouverte"');
    // Un pas plus loin, le bruit est oublié.
    expect(entre(rendre(await apres('ouvrir', 'prendre')), '<ul class="deplacements"', '</ul>')).not.toContain('repere');
  });

  it('passage sans porte à manœuvrer : pas de commande, le nom prend la ligne ; commande indisponible : inerte, raison lue (D-267, 12 §3.7)', async () => {
    const jeu = await commencer(env);
    const dock = composerDock(observer(monde, jeu.partie.etat));
    const [atelier, soute] = dock.deplacements;
    if (atelier?.manoeuvre === undefined || soute === undefined) throw new Error('Deux portes attendues.');
    const html = renderToStaticMarkup(
      <DockPiece
        dock={{ ...dock, deplacements: [{ ...atelier, manoeuvre: { ...atelier.manoeuvre, disponible: false, raison: 'hors_de_portee' } }, { ...soute, manoeuvre: undefined }] }}
        textes={textes}
        occupe={false}
        puceOuverte={null}
        ouvrir={rienAJouer}
        jouer={rienAJouer}
      />,
    );
    const [premiere = '', seconde = ''] = html.split('<li class="salle').slice(1);
    expect(premiere).toContain(
      '<button type="button" class="porte-etat indisponible" aria-disabled="true" aria-label="Porte de l’atelier, fermée, indisponible : La porte de l’atelier est hors de portée." data-son="refus">',
    );
    expect(seconde).toMatch(/^ sans-porte">/);
    expect(seconde).not.toContain('porte-etat');
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
        ouvrir={rienAJouer}
        jouer={rienAJouer}
      />,
    );
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(entre(html, '<button type="button" class="puce"', '</button>')).toContain('aria-expanded="true"');
  });

  it('bulle d’une puce : dialogue nommé, fiche gratuite puis actions, sans « Regarder » à confirmer (12 §3.5)', async () => {
    const jeu = await commencer(env);
    const [carnet] = composerDock(observer(monde, jeu.partie.etat)).piece;
    if (carnet === undefined) throw new Error('Puce absente.');
    const html = bulleObjet(jeu, carnet);
    expect(html).toMatch(
      /^<section class="bulle bulle-objet" role="dialog" aria-modal="true" aria-labelledby="[^"]+" aria-describedby="[^"]+" tabindex="-1" data-son-fermer="fermer">/,
    );
    const titre = html.match(/aria-labelledby="([^"]+)"/)?.[1] ?? '';
    expect(html).toContain(`<h2 id="${titre}" class="bulle-titre">Carnet</h2>`);
    const fiche = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? '';
    expect(texte(entre(html, `<div id="${fiche}" class="fiche">`, '</div>'))).toBe(description(jeu, 'carnet'));
    expect(html).toContain('aria-label="Fermer"');
    expect(html).not.toContain('Étape précédente');
    expect(texte(html)).toBe(`Carnet ✕ ${description(jeu, 'carnet')} ▸ Prendre`);
    expect(html).toContain('<button type="button" class="ligne" aria-label="Prendre, sans confirmation" data-son="confirmer"><span aria-hidden="true">▸ </span>Prendre</button>');
  });

  it('un seul toucher (D-182) : prendre sans risque ni coût joue la ligne ; pendant l’enregistrement, rien de plus', async () => {
    const jeu = await commencer(env);
    const [carnet] = composerDock(observer(monde, jeu.partie.etat)).piece;
    if (carnet === undefined) throw new Error('Puce absente.');
    expect(bulleObjet(jeu, carnet)).toContain('aria-label="Prendre, sans confirmation"');
    const occupee = renderToStaticMarkup(<BulleObjet ancre={{} as HTMLElement} groupe={carnet} {...composition(jeu, null)} occupe={true} />);
    expect(occupee).toContain('aria-label="Prendre, sans confirmation" disabled=""');
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
    expect(html).toMatch(/<div class="confirmation"><button type="button" class="secondaire" data-son="fermer">Annuler<\/button><button type="button" class="principal" data-son="confirmer">Confirmer<\/button><\/div>/);
    expect(texte(html)).not.toMatch(/\d|%|Rien ne se passe|Risque|Coût|aucun/);
  });

  // Les portes du monde de test n'ont plus d'aperçu à l'écran (D-267) ; elles restent les exemples les plus simples des quatre formes.
  it('aperçu (D-187) : RISQUE et COÛT seulement quand ils disent autre chose que « aucun » ; SAVOIR toujours', async () => {
    const ouvrirPorte = async (jeu: Jeu): Promise<string> => {
      const porte = composerDock(observer(monde, jeu.partie.etat)).deplacements.find((groupe) => groupe.cible.nom === 'porte');
      if (porte === undefined) throw new Error('Puce de la porte absente.');
      return texte(bulleObjet(jeu, porte, 'ouvrir'));
    };
    const depart = await commencer(env);
    const grille = composerDock(observer(monde, depart.partie.etat)).deplacements.find((groupe) => groupe.cible.nom === 'grille');
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

  it('pendant l’enregistrement d’une action, aucune bulle ne s’ouvre et aucune ligne ne joue sur l’état d’avant (C-01 §4)', async () => {
    const html = renderToStaticMarkup(<EcranJeu jeu={await apres('ouvrir')} lus={[]} env={env} machineAEcrire occupe={true} choisir={rien} lireMessages={rienALire} />);
    const ouvrants = (html.match(/<button[^>]*>/g) ?? []).filter((bouton) => bouton.includes('aria-haspopup="dialog"'));
    // Carnet, INVENTAIRE, CARTE et IA STATION.
    expect(ouvrants).toHaveLength(4);
    expect(ouvrants.every((bouton) => bouton.includes('disabled=""'))).toBe(true);
    // Noms et états des portes : « → ATELIER », « → SOUTE » et leurs commandes.
    const lignes = (html.match(/<button type="button" class="(deplacement|porte-etat)[^>]*>/g) ?? []);
    expect(lignes).toHaveLength(4);
    expect(lignes.every((bouton) => bouton.includes('disabled=""'))).toBe(true);
    // IA Station n'a plus de lien dans le récit en cours de partie : son bouton de navigation porte le repère (#139, D-263).
    const arrivee = await apres('prendre', 'ouvrir', 'aller');
    expect(renderToStaticMarkup(<EcranJeu jeu={arrivee} lus={[]} env={env} machineAEcrire occupe={true} choisir={rien} lireMessages={rienALire} />)).not.toContain('lien-ia');
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
    // Le carnet hors de portée : sa prise est indisponible.
    const carnet = composerDock(observer(monde, jeu.partie.etat)).piece[0];
    if (carnet === undefined) throw new Error('Puce du carnet absente.');
    const loin: Groupe = { ...carnet, options: carnet.options.map((option) => (option.action === 'prendre' ? { ...option, disponible: false, raison: 'hors_de_portee' } : option)) };
    const html = bulleObjet(jeu, loin);
    const ligne = entre(html, '<button type="button" class="ligne indisponible"', '</button>');
    expect(ligne).toContain('aria-disabled="true"');
    expect(ligne).toContain('data-son="refus"');
    expect(ligne).not.toMatch(/disabled=""|<s>|<del>|line-through/);
    expect(texte(ligne)).toBe('⊘ Prendre Le carnet est hors de portée.');
    expect(ligne).toContain('aria-label="Prendre, indisponible : Le carnet est hors de portée."');
    expect(ligne).toContain('<span class="raison">Le carnet est hors de portée.</span>');
  });

  it('inventaire : ✕ et Échap referment avec le bip plus grave de l’inventaire (D-226)', async () => {
    const jeu = await commencer(env);
    const html = bulleInventaire(jeu, null);
    expect(html).toContain('aria-label="Fermer" data-son="fermer-inventaire"');
    expect(html).toContain('data-son-fermer="fermer-inventaire"');
  });

  it('inventaire : bulle cyan, liste exacte des objets portés, puis la même composition qu’en pièce (D-154, D-176)', async () => {
    const jeu = await apres('prendre');
    const liste = bulleInventaire(jeu, null);
    expect(liste).toMatch(/^<section id="inventaire" class="bulle bulle-inventaire" role="dialog" aria-modal="true" aria-labelledby="[^"]+" tabindex="-1" data-son-fermer="fermer-inventaire">/);
    expect(texte(liste)).toBe('Inventaire ✕ ▸ Carnet');
    const carnet = observer(monde, jeu.partie.etat).inventaire[0];
    if (carnet === undefined) throw new Error('Carnet absent de l’inventaire.');
    const fiche = bulleInventaire(jeu, carnet.id);
    expect(fiche).toContain('aria-label="Étape précédente"');
    expect(texte(fiche)).toBe(`‹ Carnet ✕ ${description(jeu, 'carnet')} ▸ Poser`);
    expect(texte(bulleInventaire(await commencer(env), null))).toBe('Inventaire ✕ Vous ne portez rien.');
  });

  it('navigation : INVENTAIRE, CARTE et IA STATION, boutons texte sans pictogramme qui ouvrent une bulle ou une fenêtre', async () => {
    const nav = entre(rendre(await commencer(env), undefined, true, ['reveil']), '<nav', '</nav>');
    expect(nav.match(/<button/g)).toHaveLength(3);
    // Coupure possible à la syllabe en texte agrandi (trait d'union conditionnel), invisible sinon.
    expect(texte(nav)).toBe('Inven­taire Carte IA Sta­tion');
    expect(nav.match(/aria-haspopup="dialog" aria-expanded="false"/g)).toHaveLength(3);
    expect(nav).toContain('class="nav-carte"');
    expect(nav).toContain('aria-label="Inventaire" data-son="panneau-inventaire"');
    expect(nav).toContain('aria-label="Carte" data-son="panneau-carte"');
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

  it('réveil : citation IA Station encadrée et panne de sauvegarde visible', async () => {
    const jeu = await commencer(env);
    const rendreReveil = (partie: Jeu): string =>
      renderToStaticMarkup(
        <EcranReveil jeu={partie} env={env} machineAEcrire={false} occupe={false} regarder={() => undefined} />,
      );
    const html = rendreReveil(jeu);
    expect(html).toContain('data-testid="ia-station"');
    expect(texte(entre(html, 'data-testid="ia-station"', '</section>'))).toContain(jeu.assistance[0]);
    expect((html.match(/<button/g) ?? [])).toHaveLength(1);

    const enPanne = rendreReveil({ ...jeu, sauvegarde: 'echec' });
    expect(enPanne).toContain('role="alert"');
    expect(texte(entre(enPanne, 'data-testid="sauvegarde"', '</p>'))).toContain('La sauvegarde a échoué.');
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

  it('défaite : plus d’action ni d’inventaire, le dernier texte reste et CONTINUER seul (D-013, D-286)', async () => {
    const jeu = await commencer(env);
    const vaincu: Jeu = { ...jeu, partie: { ...jeu.partie, etat: { ...jeu.partie.etat, sante: 'vaincu' } } };
    const html = renderToStaticMarkup(
      <EcranJeu
        jeu={vaincu}
        lus={[]}
        env={env}
        machineAEcrire
        occupe={false}
        choisir={rien}
        lireMessages={rienALire}
        ouvrirOptions={() => undefined}
        continuer={() => undefined}
      />,
    );
    expect(html).not.toContain('badge-sante');
    expect(html).not.toContain('class="puce"');
    // Partie terminée : rien à mettre en pause, l'engrenage disparaît comme la navigation.
    expect(html).not.toContain('aria-label="Options"');
    expect(entre(html, '<section class="dock fin-partie"', '</section>')).toBe(
      '<section class="dock fin-partie"><button type="button" class="principal" data-son="clic">Continuer</button></section>',
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

  it('lignes de balayage sur tout l’écran, masquées aux lecteurs d’écran, désactivables (12 §2.3) ; taille du texte posée sur l’écran', () => {
    const html = renderToStaticMarkup(<App env={env} reglages={REGLAGES_PAR_DEFAUT} version="v-test" commit="" pr="" />);
    expect(html).toContain('<div class="balayage" aria-hidden="true"></div>');
    expect(html).toContain('<div class="ecran" data-taille="standard">');
    const sans = renderToStaticMarkup(<App env={env} reglages={{ ...REGLAGES_PAR_DEFAUT, taille: 'tres_grande', balayage: false }} version="v-test" commit="" pr="" />);
    expect(sans).not.toContain('balayage');
    expect(sans).toContain('<div class="ecran" data-taille="tres_grande">');
  });

  it('pied de page court, déplacé dans la bulle Application des options : version, commit et numéro de PR sur une ligne (D-191, D-287)', async () => {
    const pied = (commit: string, pr: string, build = ''): string =>
      texte(entre(options({ commit, pr, build, version: '0.1.0', sousMenuInitial: 'application' }), '<p class="pied">', '</p>'));
    expect(options({ commit: 'e27d2204f1c3', pr: '121' })).not.toContain('class="pied"');
    expect(pied('e27d2204f1c3', '121')).toBe('V0.1.0 · e27d220 · test PR #121');
    expect(pied('e27d2204f1c3', '')).toBe('V0.1.0 · e27d220');
    expect(pied('', '')).toBe('V0.1.0');
    // Numéro de construction entre parenthèses (D-227).
    expect(pied('e27d2204f1c3', '121', '412')).toBe('V0.1.0 (412) · e27d220 · test PR #121');
    expect(pied('e27d2204f1c3', '', '412')).toBe('V0.1.0 (412) · e27d220');
    // Plus de pied de page sur l'écran de jeu.
    expect(rendre(await commencer(env), () => undefined)).not.toContain('class="pied"');
  });
});

describe('plus aucune sortie (12 §5.2, D-085, D-144, D-275)', () => {
  const m08 = MONDES['m-08'] as EntreeMonde;
  const envM08: Environnement = { ...env, monde: m08.monde, textes: m08.textes };
  const ecran = (jeu: Jeu): string =>
    renderToStaticMarkup(
      <EcranJeu jeu={jeu} lus={[]} env={envM08} machineAEcrire={false} occupe={false} choisir={rien} lireMessages={rienALire} terminerPartie={() => Promise.resolve(true)} />,
    );

  it('planche tombée du mauvais côté : information du jeu, sans nommer de sortie, puis le rappel en tête du récit', async () => {
    const depart = await commencer(envM08);
    expect(ecran(depart)).not.toContain('alertdialog');
    expect(ecran(depart)).not.toContain('plus aucune sortie possible');
    const etat = { ...depart.partie.etat, piece: 'p-ouest', objets: { ...depart.partie.etat.objets, 'o-planche': { type: 'perdu', liaison: 'l-ouest-est' } as const } };
    const html = ecran({ ...depart, partie: { ...depart.partie, etat } });
    expect(html).toContain('role="alertdialog" aria-modal="true"');
    expect(texte(entre(html, '<section class="information-jeu"', '</section>'))).toBe(
      'Information du jeu Plus aucune sortie possible. Plus aucun chemin ne mène à une capsule de secours. Vous pouvez continuer à jouer et explorer la station. Continuer à jouer Terminer la partie la partie s’arrête ici',
    );
    expect(html).toContain('<p class="rappel-sans-sortie" data-testid="sans-sortie">[ plus aucune sortie possible ]</p>');
    // La partie continue : le dock reste là.
    expect(html).not.toContain('fin-partie');
  });
});

function options(
  surcharge: Partial<{
    reglages: Reglages;
    partieEnCours: boolean;
    version: string;
    build: string;
    commit: string;
    pr: string;
    miseAJour: MiseAJour;
    installation: Installation;
    partieEnregistree: boolean;
    envoyerRapport: () => Promise<Retour>;
    rapportsEnAttente: number;
    empreinteCle: () => Promise<string | null>;
    verification: () => Promise<EtatVerification>;
    sousMenuInitial: 'son_texte' | 'rapports' | 'application';
  }> = {},
): string {
  return renderToStaticMarkup(
    <EcranOptions
      reglages={surcharge.reglages ?? REGLAGES_PAR_DEFAUT}
      changerReglages={rienALire}
      partieEnCours={surcharge.partieEnCours ?? true}
      occupe={false}
      telecharger={() => null}
      abandonner={() => Promise.resolve(false)}
      menuPrincipal={rienALire}
      reprendre={rienALire}
      version={surcharge.version ?? 'v-test'}
      build={surcharge.build ?? ''}
      commit={surcharge.commit ?? ''}
      pr={surcharge.pr ?? ''}
      miseAJour={surcharge.miseAJour}
      installation={surcharge.installation}
      partieEnregistree={surcharge.partieEnregistree}
      envoyerRapport={surcharge.envoyerRapport}
      rapportsEnAttente={surcharge.rapportsEnAttente}
      empreinteCle={surcharge.empreinteCle}
      verification={surcharge.verification}
      sousMenuInitial={surcharge.sousMenuInitial}
    />,
  );
}

/** La bulle du sous-menu ouvert (D-288), jusqu'au bas des options. */
function bulleOptions(html: string): string {
  return entre(html, '<section class="bulle bulle-options"', '<div class="options-bas">');
}

describe('options (12 §4.10, #96, #201)', () => {
  it('sommaire : trois lignes qui ouvrent chacune une bulle, l’abandon, puis MENU PRINCIPAL et REPRENDRE (D-287)', () => {
    const html = options();
    expect(texte(html)).toBe(
      [
        'Options le jeu est en pause',
        '▸ Son et texte taille du texte, son, affichage',
        '▸ Rapports télécharger ma partie',
        '▸ Application mise à jour, version',
        '⊘ Abandonner la partie en cours',
        'Menu principal Reprendre la partie',
      ].join(' '),
    );
    expect(html.match(/<button type="button" class="ligne-option" aria-haspopup="dialog" data-son="bulle">/g)).toHaveLength(3);
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('voile');
  });

  it('détail des lignes : ce que la bulle contient vraiment (D-287)', () => {
    const envoyerRapport = (): Promise<Retour> => Promise.resolve('envoye');
    const installation: Installation = { etat: () => 'invite', abonner: () => () => undefined, proposer: () => undefined };
    const detail = (html: string, ligne: string): string | undefined => new RegExp(`${ligne}</span><span class="detail-option">([^<]*)</span>`).exec(html)?.[1];
    expect(detail(options({ envoyerRapport }), 'Rapports')).toBe('signaler un bug, envoyer ou télécharger ma partie');
    expect(detail(options({ envoyerRapport, partieEnCours: false, partieEnregistree: true }), 'Rapports')).toBe('signaler un bug, envoyer ma partie');
    expect(detail(options({ envoyerRapport, partieEnCours: false, partieEnregistree: false }), 'Rapports')).toBe('signaler un bug');
    expect(detail(options({ installation }), 'Application')).toBe('installation, mise à jour, version');
    expect(detail(options(), 'Son et texte')).toBe('taille du texte, son, affichage');
  });

  it('bulle Son et texte : dialogue ambre titré avec ✕ sur le sommaire voilé ; taille du texte en trois boutons radio avec aperçu, son, affichage (D-288)', () => {
    const html = options({ sousMenuInitial: 'son_texte' });
    const bulle = bulleOptions(html);
    expect(bulle).toMatch(/^<section class="bulle bulle-options" role="dialog" aria-modal="true" aria-labelledby="[^"]+" tabindex="-1" data-son-fermer="fermer">/);
    expect(texte(bulle)).toBe(
      [
        'Son et texte ✕',
        'Taille du texte Standard Grande Très grande',
        APERCU_TAILLE,
        'Son Général 80 Effets sonores bips et clics du terminal 80 Ambiance bruit brun et carlingue 60',
        'Affichage Lignes de balayage [OUI] Effet machine à écrire [OUI]',
      ].join(' '),
    );
    expect(html).toContain('<div class="voile" data-testid="voile-options" data-son="fermer"></div>');
    expect(html.indexOf('voile-options')).toBeGreaterThan(html.indexOf('Abandonner la partie en cours'));
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toMatch(/<label class="segment actif" data-son="clic"><input type="radio"[^>]*name="taille" checked=""\/><span>Standard<\/span><\/label>/);
    expect(html).toContain('role="switch" aria-checked="true" aria-label="Lignes de balayage"');
    expect(html).toContain('role="switch" aria-checked="true" aria-label="Effet machine à écrire"');
  });

  it('chaque option a sa place : sommaire et trois bulles, rien de perdu (D-287)', () => {
    const tout = {
      envoyerRapport: (): Promise<Retour> => Promise.resolve('envoye'),
      pr: '142',
      empreinteCle: (): Promise<string | null> => Promise.resolve(null),
      verification: (): Promise<EtatVerification> => Promise.resolve('verte'),
      installation: { etat: () => 'invite', abonner: () => () => undefined, proposer: () => undefined } satisfies Installation,
      miseAJour: { etat: () => 'inconnu', abonner: () => () => undefined, chercher: () => Promise.resolve() } satisfies MiseAJour,
    };
    const places = {
      sommaire: texte(options(tout)),
      son_texte: texte(bulleOptions(options({ ...tout, sousMenuInitial: 'son_texte' }))),
      rapports: texte(bulleOptions(options({ ...tout, sousMenuInitial: 'rapports' }))),
      application: texte(bulleOptions(options({ ...tout, sousMenuInitial: 'application' }))),
    };
    const attendues: Readonly<Record<keyof typeof places, readonly string[]>> = {
      sommaire: ['Son et texte', 'Rapports', 'Application', 'Abandonner la partie en cours', 'Menu principal', 'Reprendre la partie'],
      son_texte: ['Taille du texte', 'Standard', 'Très grande', APERCU_TAILLE, 'Général', 'Effets sonores', 'Ambiance', 'Lignes de balayage', 'Effet machine à écrire'],
      rapports: ['Signaler un bug', 'Envoyer ma partie', 'Télécharger ma partie', 'Clé de ce téléphone'],
      application: ['Installer le jeu', 'Chercher une mise à jour', 'Vv-test · test PR #142', 'Vérification automatique'],
    };
    for (const [place, libelles] of Object.entries(attendues) as [keyof typeof places, readonly string[]][]) {
      for (const libelle of libelles) {
        expect(places[place], `${libelle} dans ${place}`).toContain(libelle);
        if (place === 'sommaire') continue;
        for (const autre of ['son_texte', 'rapports', 'application'] as const) {
          if (autre !== place) expect(places[autre], `${libelle} seulement dans ${place}`).not.toContain(libelle);
        }
      }
    }
    // Le sommaire ne montre aucun réglage : seulement ses lignes, l'abandon et le bas.
    for (const option of [...attendues.son_texte, ...attendues.rapports, ...attendues.application]) expect(places.sommaire).not.toContain(option);
    expect(texte(bulleOptions(options({ ...tout, sousMenuInitial: 'rapports' })))).toMatch(/Signaler un bug.*Envoyer ma partie.*Télécharger ma partie.*Validation/);
  });

  it('version de test : état de la vérification automatique sous la version, lu à l’ouverture ; absent de la version publique (#180)', () => {
    const verification = (): Promise<EtatVerification> => Promise.resolve('en_cours');
    const application = { sousMenuInitial: 'application' } as const;
    expect(options({ pr: '42', verification, ...application })).toContain('<p class="etat-verification" data-testid="verification">Vérification automatique : lecture…</p>');
    expect(options({ pr: '', verification, ...application })).not.toContain('Vérification automatique');
    expect(options({ pr: '42', ...application })).not.toContain('Vérification automatique');
    expect(options({ pr: '42', verification })).not.toContain('Vérification automatique');
  });

  it('mise à jour : bouton selon l’état, absent sans service worker (D-227)', () => {
    const section = (etat: EtatMiseAJour, partieEnCours = true): string => {
      const miseAJour: MiseAJour = { etat: () => etat, abonner: () => () => undefined, chercher: () => Promise.resolve() };
      const html = options({ miseAJour, partieEnCours, sousMenuInitial: 'application' });
      return html.includes('Mise à jour</h2>') ? texte(entre(html, '<h2 class="titre-section">Mise à jour</h2>', '</section>')) : '';
    };
    expect(section('indisponible')).toBe('');
    expect(texte(bulleOptions(options({ sousMenuInitial: 'application' })))).toBe('Application ✕ Vv-test');
    expect(section('inconnu')).toBe('Mise à jour ▸ Chercher une mise à jour le jeu redémarre, la partie est gardée');
    expect(section('a_jour', false)).toBe('Mise à jour ▸ Chercher une mise à jour le jeu redémarre s’il en trouve une Le jeu est à jour.');
    expect(section('echec')).toContain('Impossible de vérifier. Le téléphone est-il connecté ?');
    expect(section('prete')).toBe('Mise à jour ▸ Installer la nouvelle version le jeu redémarre, la partie est gardée Une nouvelle version est prête.');
    expect(section('recherche')).toContain('Recherche en cours…');
  });

  it('installation : bouton ou aide selon l’état, absente quand rien n’est possible (#174)', () => {
    const section = (etat: EtatInstallation): string => {
      const installation: Installation = { etat: () => etat, abonner: () => () => undefined, proposer: () => undefined };
      const html = options({ installation, sousMenuInitial: 'application' });
      return html.includes('Installation</h2>') ? texte(entre(html, '<h2 class="titre-section">Installation</h2>', '</section>')) : '';
    };
    expect(section('indisponible')).toBe('');
    expect(texte(options({ sousMenuInitial: 'application' }))).not.toContain('Installation');
    expect(section('invite')).toBe('Installation ▸ Installer le jeu s’ouvre en plein écran, sans la barre du navigateur');
    expect(section('en_cours')).toContain('Installer le jeu');
    expect(options({ installation: { etat: () => 'en_cours', abonner: () => () => undefined, proposer: () => undefined }, sousMenuInitial: 'application' })).toMatch(
      /<button type="button" class="ligne-option" disabled=""[^>]*>[^]*?Installer le jeu/,
    );
    expect(section('guide_ios')).toBe('Installation ▸ Installer le jeu marche à suivre pour iPhone et iPad');
    expect(section('guide_firefox')).toBe('Installation ▸ Installer le jeu marche à suivre pour Firefox');
    // Une réponse du joueur à la boîte du navigateur : plus de bouton (l'événement a servi), le retour reste écrit.
    expect(section('installee')).toBe('Installation Jeu installé. Cherchez-le sur votre écran d’accueil.');
    expect(section('refusee')).toBe('Installation Installation refusée. Le menu du navigateur permet de la relancer.');
    expect(section('guide_ios')).not.toContain('Jeu installé');
  });

  it('bulle Application : installation, mise à jour, puis la version ; le retour de l’installation en zone de statut (D-287)', () => {
    const installation: Installation = { etat: () => 'invite', abonner: () => () => undefined, proposer: () => undefined };
    const miseAJour: MiseAJour = { etat: () => 'inconnu', abonner: () => () => undefined, chercher: () => Promise.resolve() };
    const html = bulleOptions(options({ installation, miseAJour, sousMenuInitial: 'application' }));
    expect(html.indexOf('Installation</h2>')).toBeGreaterThan(0);
    expect(html.indexOf('Installation</h2>')).toBeLessThan(html.indexOf('Mise à jour</h2>'));
    expect(html.indexOf('Mise à jour</h2>')).toBeLessThan(html.indexOf('<p class="pied">'));
    expect(html).toContain('<p class="retour-option" role="status" data-testid="installation"></p>');
  });

  it('installation : les aides disent les boutons tels que le téléphone les nomme (docs/16 §3.1)', () => {
    const ios = GUIDES_INSTALLATION.guide_ios.etapes.join(' ');
    for (const nom of ['Plus', 'Partager', 'Sur l’écran d’accueil', 'Ouvrir comme app web', 'Ajouter']) expect(ios).toContain(`« ${nom} »`);
    expect(GUIDES_INSTALLATION.guide_ios.note).toContain('« Modifier les actions »');
    const firefox = GUIDES_INSTALLATION.guide_firefox.etapes.join(' ');
    for (const nom of ['Plus', 'Ajouter l’application à l’écran d’accueil', 'Ajouter']) expect(firefox).toContain(`« ${nom} »`);
    for (const guide of Object.values(GUIDES_INSTALLATION)) expect(guide.etapes).toHaveLength(4);
  });

  it('réglages choisis : la taille active et les bascules sur [NON]', () => {
    const html = options({ reglages: { ...REGLAGES_PAR_DEFAUT, taille: 'tres_grande', balayage: false, machineAEcrire: false }, sousMenuInitial: 'son_texte' });
    expect(html).toMatch(/<label class="segment actif" data-son="clic"><input[^>]*checked=""\/><span>Très grande<\/span>/);
    expect(html.match(/class="segment actif"/g)).toHaveLength(1);
    expect(texte(html)).toContain('Lignes de balayage [NON] Effet machine à écrire [NON]');
    expect(html).toContain('role="switch" aria-checked="false"');
  });

  it('carte révélée : bascule seulement dans une version de test (PR), absente de la version publique', () => {
    expect(texte(options({ sousMenuInitial: 'son_texte' }))).not.toContain('Carte révélée');
    expect(texte(options({ sousMenuInitial: 'son_texte', pr: '249' }))).toContain('Carte révélée (test) [NON]');
    expect(texte(options({ sousMenuInitial: 'son_texte', pr: '249', reglages: { ...REGLAGES_PAR_DEFAUT, carteRevelee: true } }))).toContain('Carte révélée (test) [OUI]');
  });

  it('son : trois rails de 0 à 100, valeur écrite à droite, COUPÉE ou COUPÉS à 0 (15 §4, D-220)', () => {
    const html = options({ sousMenuInitial: 'son_texte' });
    const rails = html.match(/<input[^>]*class="curseur-rail"[^>]*>/g) ?? [];
    expect(rails).toHaveLength(3);
    for (const rail of rails) expect(rail).toMatch(/type="range" min="0" max="100" step="1"/);
    expect(rails.map((rail) => /value="(\d+)"/.exec(rail)?.[1])).toEqual(['80', '80', '60']);
    const coupe = texte(options({ reglages: { ...REGLAGES_PAR_DEFAUT, general: 0, effets: 0, ambiance: 0 }, sousMenuInitial: 'son_texte' }));
    expect(coupe).toContain('Son Général COUPÉE Effets sonores bips et clics du terminal COUPÉS Ambiance bruit brun et carlingue COUPÉE');
    expect(html).toContain('aria-valuetext="60"');
  });

  it('sans partie en cours : ni Télécharger, ni Abandonner, ni REPRENDRE LA PARTIE, ni « en pause »', () => {
    const html = texte(options({ partieEnCours: false }));
    for (const absent of ['Télécharger', 'Abandonner', 'Reprendre', 'en pause']) expect(html).not.toContain(absent);
    // Sans partie ni service de rapports, la bulle Rapports n'aurait rien : pas de ligne.
    expect(html).toBe('Options ▸ Son et texte taille du texte, son, affichage ▸ Application mise à jour, version Menu principal');
  });
});

describe('rapports dans les options (12 §4.10, D-142, #107)', () => {
  const envoyerRapport = (): Promise<Retour> => Promise.resolve('envoye');

  it('partie en cours : Signaler un bug, Envoyer ma partie, puis Télécharger ma partie, dans la bulle Rapports (D-287)', () => {
    const html = options({ envoyerRapport, sousMenuInitial: 'rapports' });
    expect(texte(bulleOptions(html))).toBe(
      [
        'Rapports ✕',
        '▸ Signaler un bug la partie en cours est jointe',
        '▸ Envoyer ma partie partie et commentaire',
        '▸ Télécharger ma partie fichier enregistré sur le téléphone',
      ].join(' '),
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('<p class="retour-option" role="status" data-testid="telechargement"></p>');
  });

  it('sans partie : seulement Signaler un bug, sans partie jointe ; partie finie : on peut encore l’envoyer', () => {
    const sans = texte(options({ envoyerRapport, partieEnCours: false, partieEnregistree: false, sousMenuInitial: 'rapports' }));
    expect(sans).toContain('Rapports ✕ ▸ Signaler un bug aucune partie à joindre');
    for (const absent of ['Envoyer ma partie', 'Télécharger', 'Abandonner']) expect(sans).not.toContain(absent);
    const finie = texte(options({ envoyerRapport, partieEnCours: false, partieEnregistree: true, sousMenuInitial: 'rapports' }));
    expect(finie).toContain('▸ Signaler un bug la partie est jointe ▸ Envoyer ma partie partie et commentaire');
    expect(finie).not.toContain('Abandonner');
  });

  it('rapports gardés sans réseau : le nombre en attente est dit en mots courants', () => {
    expect(texte(options({ envoyerRapport, rapportsEnAttente: 1, sousMenuInitial: 'rapports' }))).toContain('Un rapport attend le réseau pour partir.');
    expect(texte(options({ envoyerRapport, rapportsEnAttente: 3, sousMenuInitial: 'rapports' }))).toContain('3 rapports attendent le réseau pour partir.');
    expect(options({ envoyerRapport, sousMenuInitial: 'rapports' })).not.toContain('rapports-en-attente');
  });

  it('panneau de bug : commentaire facultatif borné, ce qui est joint, ANNULER et ENVOYER ; pas de case « je valide »', () => {
    const html = renderToStaticMarkup(<PanneauRapport type="bug" pr="142" partieJointe envoyer={envoyerRapport} fermer={rienALire} />);
    expect(texte(html)).toBe('Votre commentaire, facultatif 0 / 1000 Joint : la partie jusqu’ici et l’écran affiché. Annuler Envoyer');
    expect(html).toMatch(/<textarea[^>]*maxLength="1000"[^>]*placeholder="Ce qui s’est passé, ce que vous attendiez…"/);
    expect(html).not.toContain('checkbox');
  });

  it('panneau d’envoi de partie : « je valide » seulement pour une partie finie, dans une version de test (D-099, D-132)', () => {
    const panneau = (pr: string, validable: boolean): string =>
      renderToStaticMarkup(<PanneauRapport type="partie" pr={pr} validable={validable} partieJointe envoyer={envoyerRapport} fermer={rienALire} />);
    expect(texte(panneau('142', true))).toContain('[ ] Je valide cette aventure signé par ce téléphone · version de test PR #142');
    expect(panneau('142', true)).toContain('type="checkbox"');
    expect(panneau('142', false)).not.toContain('checkbox');
    expect(panneau('', true)).not.toContain('checkbox');
    expect(texte(panneau('', false))).toContain('Joint : la partie complète et où elle en est.');
  });

  it('section VALIDATION : seulement dans une version de test, avec la clé du téléphone (D-232)', () => {
    const empreinteCle = (): Promise<string | null> => Promise.resolve(null);
    const rapports = { sousMenuInitial: 'rapports' } as const;
    const test = options({ envoyerRapport, pr: '142', empreinteCle, ...rapports });
    expect(texte(entre(test, '<h2 class="titre-section">Validation</h2>', '</section>'))).toBe('Validation Clé de ce téléphone lecture…');
    expect(texte(options({ envoyerRapport, pr: '', empreinteCle, ...rapports }))).not.toContain('Validation');
    expect(texte(options({ envoyerRapport, pr: '142', ...rapports }))).not.toContain('Validation');
  });

  it('retours : le panneau se ferme quand le rapport est parti ou gardé, reste ouvert sinon', () => {
    expect((['envoye', 'garde', 'trop'] as const).every(rapportPris)).toBe(true);
    expect((['refuse', 'perdu', 'patience'] as const).some(rapportPris)).toBe(false);
    expect(RETOURS.garde).toBe('Pas de réseau. Le rapport est gardé sur le téléphone et partira tout seul à la prochaine connexion.');
  });
});

describe('écran de fin (12 §4.11, #96, #208, D-281 à D-286)', () => {
  /** Plus courte défaite du monde de test, sans dé : la créature vient à la cabine pendant qu'on fait du bruit. */
  async function vaincu(): Promise<Jeu> {
    let jeu = await commencer(env);
    for (const [action, cible] of [['ouvrir', 'porte'], ['prendre', 'carnet'], ['poser', 'carnet'], ['prendre', 'carnet'], ['poser', 'carnet'], ['prendre', 'carnet']] as const) {
      const option = observer(monde, jeu.partie.etat).menu.find((choix) => choix.action === action && choix.cible.nom === cible && choix.disponible);
      if (option === undefined) throw new Error(`Option ${action} ${cible} absente.`);
      jeu = await jouerOption(env, jeu, option);
    }
    expect(observer(monde, jeu.partie.etat).issue).toBe('defaite');
    return jeu;
  }

  const fin = (jeu: Jeu, entree: Environnement = env, envoyer?: () => Promise<Retour>, pr = ''): string =>
    renderToStaticMarkup(
      <EcranFin jeu={jeu} env={entree} machineAEcrire occupe={false} rejouer={rienALire} nouvellePartie={rienALire} menuPrincipal={rienALire} envoyerPartie={envoyer} pr={pr} />,
    );

  it('défaite : titre, récit de la partie, la mort en ambre, « ne peut pas être reprise », quatre boutons ; ni pièce ni chiffre', async () => {
    const jeu = await vaincu();
    const recit = recitDeFin(env, jeu.partie);
    const html = fin(jeu, env, () => Promise.resolve('envoye'));
    expect(entre(html, '<header', '</header>')).toContain('&gt; Fin de la partie_');
    expect(html).toContain('<h1 class="titre-fin" tabindex="-1">Vous n’avez pas atteint la capsule.</h1>');
    expect(lu(entre(html, '<section class="recit', '</section>'))).toBe(recit.paragraphes.join(' | '));
    expect(recit.paragraphes).toEqual([
      'Vous vous êtes réveillé dans la cabine. Vous y avez vu la créature pour la première fois.',
      'Elle vous y a blessé. Puis elle vous a grièvement blessé.',
      'Vous y êtes mort, sous ses griffes.',
    ]);
    // La mort et sa cause en `accent`, seule (D-282).
    expect(html.match(/<p class="cause">/g)).toHaveLength(1);
    expect(lu(entre(html, '<p class="cause">', '</p>'))).toBe('Vous y êtes mort, sous ses griffes.');
    expect(texte(entre(html, '<div class="bilan-fin">', '</div>'))).toBe('Cette partie est terminée. Elle ne peut pas être reprise.');
    expect(texte(entre(html, '<div class="actions-fin">', '</div>'))).toBe('Rejouer cette station Nouvelle partie Envoyer ma partie Menu principal');
    expect(html).not.toContain('Pièces visitées');
    expect(html).not.toContain('parole-ia');
    expect(lu(html)).not.toMatch(/\d/);
  });

  it('abandon : titre, la pièce où l’on s’est arrêté, « ne peut pas être reprise » ; sans liste des pièces (D-284)', async () => {
    const jeu = await apres('prendre', 'ouvrir', 'aller');
    const html = fin(jeu);
    expect(html).toContain('<h1 class="titre-fin" tabindex="-1">Partie abandonnée.</h1>');
    expect(lu(entre(html, '<section class="recit', '</section>'))).toBe('Vous en restez là, dans l’atelier.');
    expect(texte(entre(html, '<div class="bilan-fin">', '</div>'))).toBe('Cette partie est terminée. Elle ne peut pas être reprise.');
    expect(html).not.toContain('Pièces visitées');
    expect(lu(html)).not.toMatch(/\d/);
    expect(html).toContain('<button type="button" class="principal" data-son="clic">Rejouer cette station</button>');
  });

  it('ENVOYER MA PARTIE, discret, entre NOUVELLE PARTIE et MENU PRINCIPAL quand le service est là (#107)', async () => {
    const html = fin(await apres('prendre'), env, () => Promise.resolve('envoye'));
    expect(texte(entre(html, '<div class="actions-fin">', '</div>'))).toBe('Rejouer cette station Nouvelle partie Envoyer ma partie Menu principal');
    expect(html).toContain('<button type="button" class="discret" data-son="clic">Envoyer ma partie</button>');
  });
});

describe('station refusée par l’adresse (#152)', () => {
  it('accueil avec le motif tel quel ; NOUVELLE PARTIE indisponible et aucun autre bouton', () => {
    const html = renderToStaticMarkup(<EcranRefus motif="Station inconnue : m07-m03-inconnue-1." reglages={REGLAGES_PAR_DEFAUT} />);
    expect(html).toContain('<h1 class="titre-accueil" aria-label="VOID WALKER"><span>VOID</span><span>WALKER▮</span></h1>');
    expect(texte(entre(html, '<section', '</section>'))).toBe('Station refusée : Station inconnue : m07-m03-inconnue-1.');
    expect(html).toContain('role="alert"');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('<button type="button" class="principal" disabled="" data-son="clic">Nouvelle partie</button>');
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

  function rendreAr01(jeu: Jeu, lus: readonly string[] = []): string {
    return renderToStaticMarkup(
      <EcranJeu jeu={jeu} lus={lus} env={envAr01} machineAEcrire occupe={false} choisir={rien} lireMessages={rienALire} continuer={() => undefined} />,
    );
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
    expect(ou).toMatch(/^‹ Burette d’huile › Verser ✕ Où \? (▸ [^▸]+ )*▸ Cloison de la baie d’observation( ▸ [^▸]+)*$/);
    const cloison = burette.options.find((option) => option.parametre?.sorte === 'passage' && option.parametre.vers?.nom === 'observation');
    if (cloison?.parametre === undefined) throw new Error('Cloison de l’observation absente.');
    expect(texte(inventaire(local, 'verser', cloison.parametre.id))).toMatch(
      /^‹ Burette d’huile › Verser › Cloison de la baie d’observation ✕ Savoir Le sol sera glissant au pied de la cloison de la baie d’observation/,
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
    expect(texte(entre(atelier, '<ul class="deplacements"', '</ul>'))).toBe('salon de transit Ouverte');
    const ouverte = dockDe(rendreAr01(await pc(4)));
    expect(texte(ouverte)).not.toContain('▸ Grille');
    expect(texte(entre(ouverte, '<ul class="deplacements"', '</ul>'))).toBe('salon de transit Ouverte grille Ouverte');
    const local = dockDe(rendreAr01(await pc(5)));
    expect(texte(entre(local, '<ul class="deplacements"', '</ul>'))).toContain('atelier maintenance');
    expect(texte(entre(local, '<ul class="deplacements"', '</ul>'))).not.toContain('grille');
  });

  it('bloc en main : « → atelier » par la grille reste visible, en pointillé, nommé avec sa raison (D-229, D-267)', async () => {
    const charge = dockDe(rendreAr01(await pc(7)));
    const grille = entre(charge, '<button type="button" class="deplacement bloque" aria-label="atelier maintenance', '</button>');
    const raison = 'Ce que vous portez est trop large pour la grille de l’atelier maintenance.';
    expect(grille).toContain(`aria-label="atelier maintenance, en haut, ${raison}"`);
    expect(texte(grille)).toBe('atelier maintenance');
    // La grille s'ouvre en haut du local énergie, sur la carte (D-349).
    expect(grille).toContain('<path transform="rotate(0 8 8)"');
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
    // En cours de partie, ni citation ni lien dans le récit : le repère du bouton IA STATION annonce le message (#139, D-263).
    const html = rendreAr01(arrivee, ['reveil']);
    expect(html).not.toContain('parole-ia');
    expect(html).not.toContain('lien-ia');
    expect(html).not.toContain('parle dans l’écouteur');
    expect(entre(html, '<button type="button" class="nav-ia"', '</button>')).toContain('class="notification-ia"');
    expect((await pc(6)).assistance).toEqual([]);
    expect(rendreAr01(await pc(6), ['reveil'])).not.toContain('lien-ia');
  });

  it('évacuation : seize actions, le texte du départ et CONTINUER à la place du dock ; en-tête inchangé (D-286)', async () => {
    const fin = await pc(P_C.length);
    expect(fin.partie.etat.actions).toBe(16);
    const html = rendreAr01(fin);
    expect(texte(entre(html, '<section class="dock fin-partie"', '</section>'))).toBe('Continuer');
    expect(html).not.toContain('Cette partie est terminée');
    expect(html).not.toContain('class="puce"');
    expect(html).not.toContain('class="deplacements"');
    expect(html).toContain('<nav class="navigation" aria-label="Navigation" hidden="">');
    expect(entre(html, '<header', '</header>')).toContain('<h1 class="titre-piece">cabine de la capsule</h1>');
    expect(fin.assistance).toEqual([ar01.textes.assistance.depart]);
    // La navigation n'est plus là : le message de départ s'écrit en entier dans le récit, encadré comme au réveil, sans lien (#139, D-263).
    expect(lu(entre(html, '<section class="parole-ia"', '</section>'))).toBe(`«\u00a0${ar01.textes.assistance.depart ?? ''}\u00a0»`);
    expect(html).not.toContain('lien-ia');
    expect(html).not.toContain('parle dans l’écouteur');
  });

  it('écran de fin après l’évacuation : le récit de la partie, puis le message de départ d’IA Station ; ni « ne peut pas être reprise » ni pièces (D-283)', async () => {
    const jeu = await pc(P_C.length);
    const recit = recitDeFin(envAr01, jeu.partie);
    const html = renderToStaticMarkup(
      <EcranFin jeu={jeu} env={envAr01} machineAEcrire occupe={false} rejouer={rienALire} nouvellePartie={rienALire} menuPrincipal={rienALire} />,
    );
    expect(html).toContain('<h1 class="titre-fin" tabindex="-1">La capsule s’est détachée.</h1>');
    expect(recit.assistance).toEqual([ar01.textes.assistance.depart]);
    expect(lu(entre(html, '<section class="recit', '</section></section>'))).toBe([...recit.paragraphes, `«\u00a0${ar01.textes.assistance.depart ?? ''}\u00a0»`].join(' | '));
    expect(recit.paragraphes.at(-1)).toMatch(/Vous partez (indemne|blessé|grièvement blessé, mais vivant)\./);
    expect(html).not.toContain('class="cause"');
    expect(html).not.toContain('bilan-fin');
    expect(html).not.toContain('Pièces visitées');
    expect(texte(entre(html, '<div class="actions-fin">', '</div>'))).toBe('Rejouer cette station Nouvelle partie Menu principal');
  });
});

describe('CARTE : « ! » du capteur (créature mobile lot 3)', () => {
  const navCarte = (html: string): string => entre(html, '<button type="button" class="nav-carte"', '</button>');

  it('le repère et le libellé n’y sont qu’avec un nouveau signal', async () => {
    const jeu = await commencer(env);
    expect(navCarte(rendre(jeu, undefined, true, [], true))).toContain('class="notification-ia notification-carte"');
    expect(navCarte(rendre(jeu, undefined, true, [], true))).toContain('aria-label="Carte, nouveau signal du capteur"');
    expect(navCarte(rendre(jeu))).not.toContain('notification-carte');
    expect(navCarte(rendre(jeu))).toContain('aria-label="Carte"');
  });
});

describe('poste de surveillance : fenêtre en direct, refus et messages d’IA Station (lot 4)', () => {
  // Le monde de test, avec un terminal et son post-it dans la cabine, des caméras dans l'atelier et la soute, et la rencontre.
  const POSTE: DefMonde = {
    ...monde,
    id: 'monde-poste',
    rencontre: { rythme: 1 },
    objets: [
      ...monde.objets,
      { id: 'objet-terminal', nom: 'cat_terminal', piece: 'piece-cabine', portable: false, terminal: true, exige: 'objet-post-it' },
      { id: 'objet-post-it', nom: 'cat_post_it', piece: 'piece-cabine' },
    ],
    cameras: [{ piece: 'piece-atelier' }, { piece: 'piece-soute' }],
  };
  const catalogue = (cle: string) => ({ noms: TEXTES_CATALOGUE.noms[cle]!, descriptions: TEXTES_CATALOGUE.descriptions[cle]! });
  const TEXTES_POSTE: TextesMonde = {
    ...textes,
    noms: { ...textes.noms, cat_terminal: catalogue('cat_terminal').noms, cat_post_it: catalogue('cat_post_it').noms },
    descriptions: { ...textes.descriptions, cat_terminal: catalogue('cat_terminal').descriptions, cat_post_it: catalogue('cat_post_it').descriptions },
  };
  let graine = 0;
  const envPoste: Environnement = { ...env, monde: POSTE, textes: TEXTES_POSTE, stockage: memoire(), graine: () => graine };
  const jouerAction = (jeu: Jeu, action: IdAction, disponible = true, cible?: string): Promise<Jeu> => {
    const option = observer(POSTE, jeu.partie.etat).menu.find(
      (choix) => choix.action === action && choix.disponible === disponible && (cible === undefined || choix.cible.nom === cible),
    );
    if (option === undefined) throw new Error(`Option ${action} absente.`);
    return jouerOption(envPoste, jeu, option);
  };
  const rendrePoste = (jeu: Jeu): string =>
    renderToStaticMarkup(<EcranJeu jeu={jeu} lus={[]} env={envPoste} machineAEcrire={false} occupe={false} choisir={rien} lireMessages={rienALire} />);
  const ferme = (jeu: Jeu): boolean => fermerPoste(observer(POSTE, jeu.partie.etat), jeu.partie.derniers);
  /** Le post-it pris et utilisé sur le terminal (D-356), puis la connexion, sur la graine en cours. */
  const connecterSur = async (): Promise<Jeu> =>
    jouerAction(await jouerAction(await jouerAction(await commencer(envPoste), 'prendre', true, 'cat_post_it'), 'deverrouiller'), 'surveiller');
  /** Connecté au terminal, sur la première graine où la créature n'est pas déjà dans la salle. */
  const connecte = async (): Promise<Jeu> => {
    for (graine = 0; graine < 50; graine++) {
      const jeu = await connecterSur();
      if (!ferme(jeu)) return jeu;
    }
    throw new Error('Aucune connexion calme.');
  };

  it('sans le post-it, le terminal se refuse comme le lecteur de carte, et rien ne s’ouvre', async () => {
    const debut = await commencer(envPoste);
    const refus = await jouerAction(debut, 'surveiller', false);
    expect(refus.partie).toBe(debut.partie);
    const html = rendrePoste(refus);
    expect(texte(html)).toContain('Le terminal demande un mot de passe : rien n’a été joué.');
    expect(html).not.toContain('aria-label="Surveillance"');
    // Rien ne souffle qu'un post-it existe avant de l'avoir trouvé (D-356).
    expect(observer(POSTE, debut.partie.etat).menu.some((option) => option.action === 'deverrouiller')).toBe(false);
  });

  it('« Se connecter » : un seul toucher, sans CONFIRMER (D-359)', async () => {
    const debut = await jouerAction(await jouerAction(await commencer(envPoste), 'prendre', true, 'cat_post_it'), 'deverrouiller');
    const option = observer(POSTE, debut.partie.etat).menu.find((choix) => choix.action === 'surveiller');
    expect(option?.disponible).toBe(true);
    expect(unToucher(POSTE, debut.partie, option!)).toBe(true);
  });

  it('régression : la fenêtre s’ouvre dès la connexion, même quand le pas raconte aussi une écoute ou un signe (D-359)', async () => {
    let bruyantes = 0;
    for (graine = 0; graine < 30; graine++) {
      const jeu = await connecterSur();
      if (jeu.partie.etat.creature?.piece === 'piece-cabine') continue;
      if (jeu.partie.derniers.some(({ type }) => type !== 'terminal_connecte')) bruyantes++;
      expect(rendrePoste(jeu)).toContain('aria-label="Surveillance"');
    }
    // L'ancienne règle fermait la fenêtre sur ces connexions-là : il fallait se reconnecter.
    expect(bruyantes).toBeGreaterThan(0);
  });

  it('après la connexion, la fenêtre est ouverte, avec ses deux caméras en mots', async () => {
    const jeu = await connecte();
    const html = rendrePoste(jeu);
    expect(html).toContain('aria-label="Surveillance"');
    expect(html).toContain('<li>Caméra de l’atelier : calme</li>');
    expect(html).toContain('<li>Caméra de la soute : mouvement</li>');
    expect(html).toContain('<span class="alerte">SOUTE : MOUVEMENT. </span>');
  });

  it('après la connexion, une pièce jamais visitée est connue : ni « vu à l’instant », ni « aucun objet », ni rangée parmi les visitées', async () => {
    const jeu = await connecte();
    const plan = carte(POSTE, jeu.partie.etat);
    // L'atelier, jamais visité, contient la trousse : la carte n'en dit rien.
    const atelier = plan.pieces.find((piece) => piece.piece.nom === 'atelier');
    expect(atelier?.statut).toBe('connue');
    expect(atelier?.regard).toBeNull();
    const fiche = ficheDe(TEXTES_POSTE, atelier!);
    expect(fiche.objets).toBeNull();
    expect(fiche.sousTitre).toBe('pas encore visitée');
    const blocs = rendreListeCarte(TEXTES_POSTE, plan);
    expect(blocs[1]!.entrees.map((entree) => entree.titre)).not.toContain('ATELIER');
    expect(blocs[2]!.entrees.map((entree) => entree.titre)).toContain('ATELIER');
  });

  it('la créature entre dans la salle : la fenêtre se ferme, le récit montre l’entrée en rouge (Review Focus 1)', async () => {
    const jeu = await connecte();
    // Un pas calme dans la salle garde la fenêtre ouverte.
    expect(ferme(jeu)).toBe(false);
    // La porte de l'atelier ouverte, la créature dans l'atelier : elle finit par entrer dans la cabine.
    let courant: Jeu = {
      ...jeu,
      partie: { ...jeu.partie, etat: { ...jeu.partie.etat, liaisons: { ...jeu.partie.etat.liaisons, 'liaison-cabine-atelier': true }, creature: { ...jeu.partie.etat.creature!, piece: 'piece-atelier' } } },
    };
    for (let pas = 0; pas < 20 && courant.partie.etat.creature?.piece !== 'piece-cabine'; pas++) courant = await jouerAction(courant, 'attendre');
    expect(courant.partie.etat.creature?.piece).toBe('piece-cabine');
    expect(ferme(courant)).toBe(true);
    const html = rendrePoste(courant);
    expect(html).not.toContain('aria-label="Surveillance"');
    expect(texte(html)).toContain('par la porte de l’atelier.');
    expect(entre(html, '<section class="recit', '</section>')).toContain('alerte');
    expect(courant.alertes.length).toBeGreaterThan(0);
  });

  it('ModaleIA : un signe de présence nomme la pièce, en cours de route', async () => {
    const jeu = await connecte();
    const partie = { ...jeu.partie, etat: { ...jeu.partie.etat, messages: ['signe-1'], signes: [{ sorte: 'presence' as const, piece: 'piece-atelier', action: 2 }] } };
    const messages = historiqueAffiche(envPoste, partie);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.repere).toBe('en cours de route');
    expect(messages[0]!.texte).toMatch(/^Atelier : /);
    expect(texte(renderToStaticMarkup(<ModaleIA messages={messages} nouveaux={[]} fermer={rienAJouer} />))).toContain(messages[0]!.texte);
  });
});

describe('IA Station : repère du bouton, lien de fin et fenêtre blanche (#98, #139, 12 §3.3, §3.9, D-192, D-263)', () => {
  const { reveil = '', atelier = '' } = textes.assistance;
  const navIa = (html: string): string => entre(html, '<button type="button" class="nav-ia"', '</button>');

  it('au réveil : citation encadrée, pas de lien ; repère et « nouveau message » tant que la fenêtre n’a pas été ouverte', async () => {
    const jeu = await commencer(env);
    const html = rendre(jeu);
    expect(lu(entre(html, '<section class="parole-ia"', '</section>'))).toBe(`«\u00a0${reveil}\u00a0»`);
    expect(html).not.toContain('lien-ia');
    expect(navIa(html)).toBe(
      '<button type="button" class="nav-ia" aria-haspopup="dialog" aria-expanded="false" aria-label="IA Station, nouveau message" data-son="panneau-ia">IA Sta\u00adtion<svg class="notification-ia" viewBox="0 0 12 20" aria-hidden="true"><rect x="3" y="0" width="6" height="12" fill="currentColor"></rect><rect x="3" y="14" width="6" height="6" fill="currentColor"></rect></svg></button>',
    );
    const lu1 = navIa(rendre(jeu, undefined, true, ['reveil']));
    expect(lu1).toContain('aria-label="IA Station"');
    expect(lu1).not.toContain('notification-ia');
  });

  it('à l’arrivée dans l’atelier : rien dans le récit, le repère seul sur le bouton ; il reste aux actions suivantes jusqu’à la lecture', async () => {
    const arrivee = await apres('prendre', 'ouvrir', 'aller');
    expect(arrivee.assistance).toEqual([atelier]);
    const recit = entre(rendre(arrivee, undefined, true, ['reveil']), '<section class="recit', '</section>');
    expect(recit).not.toContain('parole-ia');
    expect(recit).not.toContain('lien-ia');
    expect(recit).not.toContain(atelier);
    expect(recit).not.toContain('IA STATION');
    // Le repère remplace le carré : un seul, jamais avec l'ancienne pastille.
    expect(rendre(arrivee, undefined, true, ['reveil'])).not.toContain('pastille');
    expect(navIa(rendre(arrivee, undefined, true, ['reveil'])).match(/class="notification-ia"/g)).toHaveLength(1);
    expect(navIa(rendre(arrivee, undefined, true, ['reveil', 'atelier']))).not.toContain('notification-ia');
    // Seul le message de l'atelier a été lu : celui du réveil reste nouveau.
    expect(navIa(rendre(arrivee, undefined, true, ['atelier']))).toContain('notification-ia');
    const suivant = await jouerOption(env, arrivee, observer(monde, arrivee.partie.etat).menu.find((option) => option.action === 'poser') as OptionMenu);
    expect(rendre(suivant, undefined, true, ['reveil'])).not.toContain('lien-ia');
    expect(navIa(rendre(suivant, undefined, true, ['reveil']))).toContain('notification-ia');
  });

  it('fenêtre : en-tête, messages du plus ancien au plus récent avec leur repère, NOUVEAU sur les non-lus, une croix pour fermer', async () => {
    const arrivee = await apres('prendre', 'ouvrir', 'aller');
    const html = renderToStaticMarkup(<ModaleIA messages={historiqueAffiche(env, arrivee.partie)} nouveaux={['atelier']} fermer={rienAJouer} />);
    // Refermer IA Station : son propre bip, plus grave (D-226), par la croix comme par Échap.
    expect(html).toContain('class="bulle-icone" aria-label="Fermer" data-son="fermer-ia"><span aria-hidden="true">✕</span></button>');
    expect(html).not.toContain('Retour');
    expect(html).not.toContain('modale-pied');
    expect(html).toContain('class="historique-ia" tabindex="0"');
    expect(html).toContain('data-son-fermer="fermer-ia"');
    expect(html).toMatch(/^<section class="bulle modale-ia" role="dialog" aria-modal="true" aria-label="IA Station" aria-describedby="[^"]+" tabindex="-1" data-son-fermer="fermer-ia">/);
    expect(texte(html)).toBe(
      `[ IA STATION ] messages reçus dans l’écouteur ✕ &gt; au réveil · Cabine « ${reveil} » &gt; en arrivant · Atelier nouveau « ${atelier} »`,
    );
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html.match(/class="nouveau"/g)).toHaveLength(1);
    expect(renderToStaticMarkup(<ModaleIA messages={historiqueAffiche(env, arrivee.partie)} nouveaux={[]} fermer={rienAJouer} />)).not.toContain('nouveau"');
    expect(texte(renderToStaticMarkup(<ModaleIA messages={[]} nouveaux={[]} fermer={rienAJouer} />))).toBe(
      '[ IA STATION ] messages reçus dans l’écouteur ✕ Aucun message reçu.',
    );
  });
});

describe('danger apparu : triangle rouge devant la phrase du feu (#138, D-233)', () => {
  const ar01 = MONDES['ar-01'] as EntreeMonde;
  const P_B = ar01.parcours.find((parcours) => parcours.nom.startsWith('P-B'))?.etapes ?? [];
  const envAr01: Environnement = { monde: ar01.monde, textes: ar01.textes, version: 'v-test', stockage: memoire(), graine: () => 20261010 };

  async function pb(nombre: number): Promise<Jeu> {
    let jeu = await commencer(envAr01);
    for (const etape of P_B.slice(0, nombre)) {
      const option = observer(ar01.monde, jeu.partie.etat).menu.find(
        (choix) =>
          choix.action === etape.action &&
          choix.cible.nom === etape.cible &&
          (etape.vers === undefined || (choix.cible.sorte === 'passage' && choix.cible.vers?.nom === etape.vers)),
      );
      if (option === undefined) throw new Error(`Option ${JSON.stringify(etape)} absente.`);
      jeu = await jouerOption(envAr01, jeu, option);
    }
    return jeu;
  }

  const recitDe = (jeu: Jeu): string =>
    entre(
      renderToStaticMarkup(
        <EcranJeu jeu={jeu} lus={[]} env={envAr01} machineAEcrire occupe={false} choisir={rien} lireMessages={rienALire} continuer={() => undefined} />,
      ),
      'data-testid="recit"',
      '<section class="dock"',
    );

  it('ouvrir la porte du local technique : la phrase du feu, et elle seule, porte le triangle et la couleur d’alerte', async () => {
    const jeu = await pb(4);
    const recit = recitDe(jeu);
    const alertes = [...recit.matchAll(/<p class="alerte" data-testid="alerte">(.*?)<\/p>/g)].map(([, contenu = '']) => contenu);
    expect(alertes).toHaveLength(1);
    const [alerte = ''] = alertes;
    // Le triangle précède la phrase, hors de la copie écrite à la machine : il est là dès le départ.
    expect(alerte).toMatch(/^<svg class="icone-alerte" viewBox="0 0 16 16" role="img" aria-label="Attention">/);
    expect(lu(alerte)).toBe(jeu.recit[jeu.alertes[0] ?? -1]);
    expect(lu(alerte)).toMatch(/flammes|brûle/);
    // Les autres phrases restent sans repère.
    expect(recit.match(/icone-alerte/g)).toHaveLength(1);
    expect(jeu.recit).toHaveLength(2);
    expect(recit).toContain(`<p><span class="lecteur-seul">${jeu.recit[0] ?? ''}</span>`);
  });

  it('avant la découverte, aucun triangle ni ligne d’alerte', async () => {
    for (const nombre of [0, 1, 2, 3]) expect(recitDe(await pb(nombre))).not.toContain('alerte');
  });
});

describe('brouillage d’un dégât (#166)', () => {
  it('se joue sur blessure, blessure critique et mort, pas sur un soin ni une alarme', () => {
    expect(degatSubi(['blessure'])).toBe(true);
    expect(degatSubi(['alarme-feu', 'blessure-critique'])).toBe(true);
    expect(degatSubi(['mort'])).toBe(true);
    expect(degatSubi(['soin', 'alarme-vide', 'creature', 'ia'])).toBe(false);
    expect(degatSubi([])).toBe(false);
  });
});

// Fiche d'un document (#209, D-324, spec 2026-10-18 §9.1) : un monde de test avec un document de chaque support dans la cabine, et une
// note de rangement qui désigne l'atelier. Aucune grande station : seule la mise en forme de la fiche est en jeu.
describe('fiche d’un document (#209, D-324, spec 2026-10-18 §9.1)', () => {
  const nom = (texte: string, genre: Nom['genre'] = 'm'): Nom => ({ texte, genre, nombre: 's', elision: false });
  const documents: Readonly<Record<string, TexteDocument>> = {
    note_malik: {
      puce: nom('mot de Malik'),
      support: 'note',
      ou: 'scotchée au montant d’une couchette',
      corps: ['Je ne dors plus.', 'Si quelqu’un lit ceci, ne comptez pas sur la lumière.'],
      signature: 'Malik',
    },
    journal_quart: {
      puce: nom('terminal de quart'),
      support: 'journal',
      ou: 'resté allumé sur un pupitre',
      corps: ['02:14  Sas arrière : pression nominale.', '02:31  Sas arrière : porte forcée, côté intérieur.'],
    },
    message_enregistreur: {
      puce: nom('enregistreur'),
      support: 'message',
      ou: 'posé sur une tablette',
      corps: ['Allô ? [souffle court] Vous m’entendez ?', '[long silence]'],
    },
    inscription_cloison: { puce: nom('inscription', 'f'), support: 'inscription', ou: 'tracée à la main sur la cloison', corps: ['Ne restez pas là.'] },
    affiche_sas: {
      puce: nom('affiche', 'f'),
      support: 'affiche',
      ou: 'collée près du sas',
      corps: ['Note de service no 12', 'En cas d’alerte, rejoignez votre capsule.', 'La Direction du transit'],
    },
    mot_lea: {
      puce: nom('mot de Léa'),
      support: 'note',
      ou: 'glissée sous une patte de rangement',
      corps: ['J’ai rangé la planche dans {le:piece}.', 'La porte {de:piece} est lourde : poussez fort.', 'Rejoignez-moi {a:piece}.'],
      signature: 'Léa',
    },
  };
  const monDocuments: DefMonde = {
    ...monde,
    objets: [
      ...monde.objets,
      ...Object.keys(documents).map((cle) => ({
        id: `objet-${cle}`,
        nom: cle,
        piece: 'piece-cabine',
        portable: false,
        document: true as const,
        ...(cle === 'mot_lea' ? { designe: 'piece-atelier' } : {}),
      })),
    ],
  };
  const textesDocuments: TextesMonde = {
    ...textes,
    noms: { ...textes.noms, ...Object.fromEntries(Object.entries(documents).map(([cle, { puce }]) => [cle, puce])) },
    documents,
  };
  const ecritures: unknown[] = [];
  const stockage: Stockage = { ...memoire(), ecrire: (donnees) => (ecritures.push(donnees), Promise.resolve()) };
  const envDocuments: Environnement = { monde: monDocuments, textes: textesDocuments, version: 'v-test', stockage, graine: () => 5 };

  async function groupeDe(cle: string): Promise<{ readonly jeu: Jeu; readonly groupe: Groupe }> {
    const jeu = await commencer(envDocuments);
    const groupe = composerDock(observer(monDocuments, jeu.partie.etat)).piece.find((candidat) => candidat.cible.nom === cle);
    if (groupe === undefined) throw new Error(`Puce ${cle} absente.`);
    return { jeu, groupe };
  }

  /** Bulle d'un document, rendue côté serveur : sa fiche seule, sans l'en-tête. */
  async function bulle(cle: string): Promise<{ readonly html: string; readonly fiche: string }> {
    const { jeu, groupe } = await groupeDe(cle);
    const html = renderToStaticMarkup(<BulleObjet ancre={{} as HTMLElement} groupe={groupe} {...composition(jeu, null, null, envDocuments)} />);
    return { html, fiche: entre(html, '<div class="bulle-corps">', '</section>') };
  }

  /** Ce que lit le lecteur d'écran : le texte de la fiche sans ce qui est masqué, la pièce soulignée se lisant dans sa phrase. */
  const lecteur = (fiche: string): string =>
    texte(fiche.replace(/<(\w+)[^>]*aria-hidden="true"[^>]*>[^<]*<\/\1>/g, '').replace(/<span class="lieu">([^<]*)<\/span>/g, '$1'));

  it('note : le support puis la ligne « où » en haut, puis le corps en italique avec filet, la signature à droite', async () => {
    const { fiche } = await bulle('note_malik');
    expect(fiche).toContain(
      '<p class="support">Note manuscrite <span aria-hidden="true">· </span><span>scotchée au montant d’une couchette</span></p>' +
        '<div class="doc doc-note"><p>Je ne dors plus.</p><p>Si quelqu’un lit ceci, ne comptez pas sur la lumière.</p><p class="signe">Malik</p></div>',
    );
    // Les capitales sont du style : le texte reste en casse normale, le lecteur d'écran lit des mots.
    expect(fiche).not.toContain('NOTE MANUSCRITE');
  });

  it('journal : un cadre sous une barre de titre au nom de la puce, les heures en colonne à part du texte', async () => {
    const { fiche } = await bulle('journal_quart');
    expect(fiche).toContain(
      '<p class="support">Journal de terminal <span aria-hidden="true">· </span><span>resté allumé sur un pupitre</span></p>' +
        '<div class="doc doc-journal"><div class="barre" aria-hidden="true">Terminal de quart</div><ol>' +
        '<li><time>02:14</time> <span>Sas arrière : pression nominale.</span></li>' +
        '<li><time>02:31</time> <span>Sas arrière : porte forcée, côté intérieur.</span></li></ol></div>',
    );
  });

  it('message : chaque didascalie est un paragraphe à part, de la classe qui la met en couleur secondaire', async () => {
    const { fiche } = await bulle('message_enregistreur');
    expect(fiche).toContain(
      '<div class="doc doc-message"><p>Allô ?</p><p class="didascalie">[souffle court]</p><p>Vous m’entendez ?</p><p class="didascalie">[long silence]</p></div>',
    );
  });

  it('inscription : le texte en casse normale, en grandes capitales par le style', async () => {
    const { fiche } = await bulle('inscription_cloison');
    expect(fiche).toContain('<div class="doc doc-inscription"><p>Ne restez pas là.</p></div>');
  });

  it('affiche : un double cadre, le titre en tête et la signature de la compagnie en pied', async () => {
    const { fiche } = await bulle('affiche_sas');
    expect(fiche).toContain(
      '<div class="doc doc-affiche"><p class="titre">Note de service no 12</p><p>En cas d’alerte, rejoignez votre capsule.</p><p class="pied">La Direction du transit</p></div>',
    );
  });

  it('la pièce remplie par le trou est soulignée partout dans le corps, sans lien ni aide ; la ligne « où » et la signature ne le sont pas', async () => {
    const { fiche } = await bulle('mot_lea');
    expect(fiche).toContain(
      '<div class="doc doc-note"><p>J’ai rangé la planche dans l’<span class="lieu">atelier</span>.</p>' +
        '<p>La porte de l’<span class="lieu">atelier</span> est lourde : poussez fort.</p>' +
        '<p>Rejoignez-moi à l’<span class="lieu">atelier</span>.</p><p class="signe">Léa</p></div>',
    );
    expect(fiche.match(/class="lieu"/g)).toHaveLength(3);
    expect(fiche).not.toMatch(/<(a|abbr)\b|title=|aria-label=|tabindex/);
  });

  it('une note sans pièce désignée ne souligne rien', async () => {
    expect((await bulle('note_malik')).fiche).not.toContain('lieu');
  });

  it('seul le mot entier est souligné : pas « cale » dans « calendrier »', () => {
    const rendu: DocumentRendu = {
      support: 'note',
      libelleSupport: 'Note manuscrite',
      ou: 'glissée dans un tiroir',
      corps: [{ texte: 'La cale, puis le calendrier, puis la cale.' }],
      piece: 'cale',
    };
    expect(renderToStaticMarkup(<FicheDocument rendu={rendu} puce="Mot" />)).toContain(
      '<p>La <span class="lieu">cale</span>, puis le calendrier, puis la <span class="lieu">cale</span>.</p>',
    );
  });

  it('un journal souligne aussi la pièce désignée, dans le texte de ses lignes et pas dans l’heure', () => {
    const rendu: DocumentRendu = {
      support: 'journal',
      libelleSupport: 'Journal de terminal',
      ou: 'resté allumé sur un pupitre',
      corps: [{ heure: '02:14', texte: 'Clé laissée à la cale.' }, { heure: '02:31', texte: 'Rien à signaler.' }],
      piece: 'cale',
    };
    const fiche = renderToStaticMarkup(<FicheDocument rendu={rendu} puce="Journal" />);
    expect(fiche).toContain('<li><time>02:14</time> <span>Clé laissée à la <span class="lieu">cale</span>.</span></li>');
    expect(fiche).toContain('<li><time>02:31</time> <span>Rien à signaler.</span></li>');
  });

  it('lecteur d’écran : le support, la ligne « où », puis le texte, dans l’ordre du DOM ; le libellé n’est pas masqué', async () => {
    const lus: Readonly<Record<string, string>> = {
      note_malik: 'Note manuscrite scotchée au montant d’une couchette Je ne dors plus. Si quelqu’un lit ceci, ne comptez pas sur la lumière. Malik',
      journal_quart: 'Journal de terminal resté allumé sur un pupitre 02:14 Sas arrière : pression nominale. 02:31 Sas arrière : porte forcée, côté intérieur.',
      message_enregistreur: 'Message enregistré posé sur une tablette Allô ? [souffle court] Vous m’entendez ? [long silence]',
      inscription_cloison: 'Inscription tracée à la main sur la cloison Ne restez pas là.',
      affiche_sas: 'Affiche de la compagnie collée près du sas Note de service no 12 En cas d’alerte, rejoignez votre capsule. La Direction du transit',
      mot_lea: 'Note manuscrite glissée sous une patte de rangement J’ai rangé la planche dans l’atelier. La porte de l’atelier est lourde : poussez fort. Rejoignez-moi à l’atelier. Léa',
    };
    for (const [cle, attendu] of Object.entries(lus)) {
      const { html, fiche } = await bulle(cle);
      expect(lecteur(fiche), cle).toBe(attendu);
      expect(fiche, cle).not.toMatch(/<p class="support"[^>]*aria-hidden/);
      // C'est la fiche que la bulle donne en description, après son titre.
      const description = html.match(/aria-describedby="([^"]+)"/)?.[1] ?? '';
      expect(fiche, cle).toContain(`<div id="${description}" class="fiche fiche-document">`);
    }
  });

  it('la bulle d’un document n’a que sa fiche : aucune action à choisir ni à confirmer', async () => {
    const { groupe } = await groupeDe('journal_quart');
    expect(groupe.options.map((option) => option.action)).toEqual(['regarder']);
    const { fiche } = await bulle('journal_quart');
    expect(fiche).not.toMatch(/class="ligne|Confirmer|<button/);
  });

  it('lire un document n’engage aucune action et n’écrit rien : ni partie, ni récit, ni sauvegarde (D-014)', async () => {
    const jeu = await commencer(envDocuments);
    const avant = { partie: JSON.stringify(jeu.partie), recit: [...jeu.recit], ecritures: ecritures.length };
    const options = observer(monDocuments, jeu.partie.etat).menu.filter((option) => option.action === 'regarder' && Object.hasOwn(documents, option.cible.nom));
    expect(options).toHaveLength(Object.keys(documents).length);
    for (const option of options) {
      const rendu = consulterDocument(envDocuments, jeu.partie, option);
      if (rendu === null) throw new Error(`Document ${option.cible.nom} sans rendu.`);
      // La chaîne du lecteur d'écran et de l'historique reste celle du rendu structuré.
      expect(consulter(envDocuments, jeu.partie, option)).toEqual([texteDocument(rendu)]);
    }
    expect(JSON.stringify(jeu.partie)).toBe(avant.partie);
    expect(jeu.partie.etat.actions).toBe(0);
    expect(jeu.recit).toEqual(avant.recit);
    expect(ecritures).toHaveLength(avant.ecritures);
  });

  it('seul un document a une fiche structurée : le carnet reste une phrase', async () => {
    const jeu = await commencer(envDocuments);
    const carnet = observer(monDocuments, jeu.partie.etat).menu.find((option) => option.action === 'regarder' && option.cible.nom === 'carnet');
    if (carnet === undefined) throw new Error('Regard sur le carnet absent.');
    expect(consulterDocument(envDocuments, jeu.partie, carnet)).toBeNull();
    const { fiche } = await bulle('carnet');
    expect(fiche).toMatch(/<div id="[^"]+" class="fiche"><p>/);
    expect(fiche).not.toContain('support');
  });

  it('dock : la puce d’un document est une puce ordinaire, rien ne la signale (spec §9.4)', async () => {
    const { jeu } = await groupeDe('journal_quart');
    const dock = composerDock(observer(monDocuments, jeu.partie.etat));
    const html = renderToStaticMarkup(
      <DockPiece dock={dock} textes={textesDocuments} occupe={false} puceOuverte={null} ouvrir={rienAJouer} jouer={rienAJouer} />,
    );
    const puces = [...entre(html, '<ul class="puces">', '</ul>').matchAll(/<button type="button" class="puce"([^>]*)><span aria-hidden="true">▸ <\/span>([^<]*)<\/button>/g)];
    expect(puces.map(([, , libelle]) => libelle).sort()).toEqual(['Affiche', 'Carnet', 'Enregistreur', 'Inscription', 'Mot de Léa', 'Mot de Malik', 'Terminal de quart']);
    expect(new Set(puces.map(([, attributs]) => attributs)).size).toBe(1);
  });
});

describe('grande station : poser la caisse portée sous la grille d’un seul geste (demande du porteur)', () => {
  // La caisse de M-02 se porte en grande station (spec 2026-10-18 §6.5) ; état placé à la main, la route de l'atelier ne compte pas ici.
  const COMPOSITION = `g${VERSION_GENERATEUR}-m01-m02-m09-m06-cale`;
  const grande = ((): EntreeMonde => {
    for (let graine = 0; graine < 50; graine += 1) {
      const entree = CATALOGUE.construireGrande(COMPOSITION, graine);
      if (!('refus' in entree)) return entree;
    }
    throw new Error(`${COMPOSITION} : aucun plan sur 50 graines.`);
  })();
  const envGrande: Environnement = { monde: grande.monde, textes: grande.textes, version: 'v-test', stockage: memoire(), graine: () => 20261010 };

  async function atelierCaisseEnMain(): Promise<Jeu> {
    const jeu = await commencer(envGrande);
    const etat = { ...jeu.partie.etat, piece: 'm-02/p-atelier', objets: { ...jeu.partie.etat.objets, 'm-02/o-caisse': { type: 'passager' as const } } };
    return { ...jeu, partie: { ...jeu.partie, etat } };
  }

  const caisseDe = (jeu: Jeu): Groupe => {
    const groupe = composerDock(observer(grande.monde, jeu.partie.etat)).inventaire.find((candidat) => candidat.cible.nom === 'caisse');
    if (groupe === undefined) throw new Error('Caisse absente de l’inventaire.');
    return groupe;
  };

  const inventaire = (jeu: Jeu, action: IdAction | null, parametre: string | null = null): string =>
    renderToStaticMarkup(
      <BulleInventaire
        id="inventaire"
        groupes={composerDock(observer(grande.monde, jeu.partie.etat)).inventaire}
        cible={caisseDe(jeu).cible.id}
        choisir={rienAJouer}
        {...composition(jeu, action, parametre, envGrande)}
      />,
    );

  it('de la fiche, « Poser » n’est pas d’un seul toucher : il ouvre « OÙ ? » avec les positions de l’atelier, puis l’aperçu', async () => {
    const jeu = await atelierCaisseEnMain();
    const caisse = caisseDe(jeu);
    const poses = caisse.options.filter((option) => option.action === 'poser');
    expect(poses.map((option) => option.parametre?.nom)).toEqual(['sous_grille', 'centre']);
    expect(poses.map((option) => unToucher(grande.monde, jeu.partie, option))).toEqual([false, false]);
    expect(etapeBulle(caisse, 'poser', null)).toMatchObject({ type: 'parametre', action: 'poser' });

    const fiche = inventaire(jeu, null);
    expect(texte(fiche)).toMatch(/^‹ Caisse ✕ .* ▸ Poser$/);
    expect(fiche).not.toContain('sans confirmation');

    expect(texte(inventaire(jeu, 'poser'))).toBe('‹ Caisse › Poser ✕ Où ? ▸ sous la grille ▸ au centre de la pièce');
    const sous = poses.find((option) => option.parametre?.nom === 'sous_grille');
    if (sous?.parametre === undefined) throw new Error('Position sous la grille absente.');
    expect(texte(inventaire(jeu, 'poser', sous.parametre.id))).toBe('‹ Caisse › Poser › sous la grille ✕ Savoir La caisse sera sous la grille. Annuler Confirmer');
    // La ligne de l'étape 1 reste le verbe seul ; le libellé du menu (CLI, captures) nomme la position de chaque option.
    expect(libelleLigne(grande.textes, caisse, sous).libelle).toBe('Poser');
    expect(poses.map((option) => libelleOption(grande.textes, option).libelle)).toEqual(['Poser la caisse sous la grille', 'Poser la caisse au centre de la pièce']);
  });

  it('confirmé sous la grille : la caisse y est, le récit et le rappel le disent, la grille se touche', async () => {
    const jeu = await atelierCaisseEnMain();
    const sous = caisseDe(jeu).options.find((option) => option.action === 'poser' && option.parametre?.nom === 'sous_grille');
    if (sous === undefined) throw new Error('Poser sous la grille absent.');
    const pose = await jouerOption(envGrande, jeu, sous);
    expect(pose.recit.join(' ')).toMatch(/Vous (posez|déposez) la caisse sous la grille/);
    expect(pose.rappel).toEqual({ texte: 'Caisse · Poser · sous la grille', capitales: false });
    expect(pose.partie.etat.objets['m-02/o-caisse']).toMatchObject({ type: 'piece', piece: 'm-02/p-atelier' });
    const grille = observer(grande.monde, pose.partie.etat).menu.find((option) => option.action === 'ouvrir' && option.cible.nom === 'grille');
    expect(grille).toMatchObject({ disponible: true });
  });
});
