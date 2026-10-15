import { renderToStaticMarkup } from 'react-dom/server';
import { observer, type IdAction, type OptionMenu } from '../engine';
import { MONDES, type EntreeMonde, type EtapeParcours } from '../content';
import { App, EcranRefus } from './App';
import { BulleInventaire, BulleObjet, DockPiece, EcranJeu, EcranReveil, ModaleIA } from './EcranJeu';
import { APERCU_TAILLE, EcranFin, EcranOptions } from './EcranOptions';
import { composerDock, unToucher, type Groupe } from './ecran';
import { marquerEcrit } from './ecriture';
import { commencer, consulter, historiqueAffiche, jouerOption, prevoir, type Environnement, type Jeu } from './jeu';
import type { EtatMiseAJour, MiseAJour } from './miseAJour';
import { PanneauRapport, RETOURS, rapportPris } from './PanneauRapport';
import type { Retour } from './rapports';
import { REGLAGES_PAR_DEFAUT, type Reglages } from './reglages';
import type { Stockage } from './sauvegarde';

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

function rendre(jeu: Jeu, ouvrirOptions?: () => void, machineAEcrire = true, lus: readonly string[] = []): string {
  return renderToStaticMarkup(
    <EcranJeu
      jeu={jeu}
      lus={lus}
      env={env}
      machineAEcrire={machineAEcrire}
      occupe={false}
      choisir={rien}
      lireMessages={rienALire}
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

  it('dock : objets de la pièce, regard autour de soi ; portes fermées dans « Se déplacer vers », en pointillé, avec leur raison (D-229)', async () => {
    const dock = entre(rendre(await commencer(env)), '<section class="dock"', '</section>');
    expect(texte(dock)).toBe('Dans la pièce ▸ Carnet ▸ Regarder autour de vous Se déplacer vers → atelier → soute');
    const deplacement = entre(dock, '<button type="button" class="deplacement', '</button>');
    expect(deplacement).toContain('class="deplacement bloque" aria-haspopup="dialog" aria-expanded="false" aria-label="atelier, La porte de l’atelier est fermée."');
    expect(deplacement).not.toContain('disabled=""');
    expect(deplacement).toContain('data-son="bulle"');
    expect(dock).not.toContain('aria-expanded="true"');
    expect(dock.match(/aria-haspopup="dialog"/g)).toHaveLength(3);
    expect(entre(dock, '<button type="button" class="puce"', '</button>')).toContain('data-son="bulle"');
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
    const { piece, deplacements } = composerDock(observer(monde, jeu.partie.etat));
    const [carnet] = piece;
    const [porte] = deplacements;
    if (carnet === undefined || porte === undefined) throw new Error('Puces absentes.');
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
    // Bulle d'un bouton « Se déplacer vers » : la fiche de la porte, le déplacement, puis l'ouverture (D-229).
    expect(texte(bulleObjet(jeu, porte))).toBe(`Porte de l’atelier ✕ ${description(jeu, 'porte')} ⊘ Aller dans l’atelier La porte de l’atelier est fermée. ▸ Ouvrir`);
  });

  it('un seul toucher (D-182) : prendre sans risque ni coût joue la ligne, une porte garde l’aperçu', async () => {
    const jeu = await commencer(env);
    const { piece, deplacements } = composerDock(observer(monde, jeu.partie.etat));
    const [carnet] = piece;
    const [porte] = deplacements;
    if (carnet === undefined || porte === undefined) throw new Error('Puces absentes.');
    expect(bulleObjet(jeu, carnet)).toContain('aria-label="Prendre, sans confirmation"');
    expect(bulleObjet(jeu, porte)).toContain('<button type="button" class="ligne" data-son="clic"><span aria-hidden="true">▸ </span>Ouvrir</button>');
    // Pendant l'enregistrement d'une action, la ligne ne joue rien de plus.
    const occupee = renderToStaticMarkup(<BulleObjet ancre={{} as HTMLElement} groupe={carnet} {...composition(jeu, null)} occupe={true} />);
    expect(occupee).toContain('aria-label="Prendre, sans confirmation" disabled=""');
  });

  it('un seul toucher (D-182) : dans la bulle du passage, déplacement sans danger connu joué tout de suite ; vers la créature entendue, aperçu', async () => {
    const passage = (jeu: Jeu, nom: string): Groupe => {
      const trouve = composerDock(observer(monde, jeu.partie.etat)).deplacements.find((deplacement) => deplacement.cible.nom === nom);
      if (trouve === undefined) throw new Error(`Passage ${nom} absent.`);
      return trouve;
    };
    const debut = await commencer(env);
    const grille = observer(monde, debut.partie.etat).menu.find((option) => option.action === 'ouvrir' && option.cible.nom === 'grille');
    if (grille === undefined) throw new Error('Grille absente.');
    const ouverte = await jouerOption(env, debut, grille);
    // Le bouton ouvre toujours la bulle (D-229) ; la ligne joue le déplacement d'un seul toucher.
    const bouton = entre(entre(rendre(ouverte), '<ul class="deplacements"', '</ul>'), '<button type="button" class="deplacement"', '</button>');
    expect(bouton).toContain('aria-haspopup="dialog"');
    expect(bouton).toContain('data-son="bulle"');
    expect(bulleObjet(ouverte, passage(ouverte, 'grille'))).toContain(
      '<button type="button" class="ligne" aria-label="Aller dans la soute, sans confirmation" data-son="confirmer"><span aria-hidden="true">▸ </span>Aller dans la soute</button>',
    );
    const porte = await apres('ouvrir');
    expect(bulleObjet(porte, passage(porte, 'porte'))).toContain(
      '<button type="button" class="ligne" data-son="clic"><span aria-hidden="true">▸ </span>Aller dans l’atelier</button>',
    );
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

  it('déplacement : de la bulle du passage à l’aperçu « Aller vers › atelier » (12 §4.3, D-229)', async () => {
    const jeu = await apres('ouvrir');
    const porte = composerDock(observer(monde, jeu.partie.etat)).deplacements[0];
    if (porte === undefined || !porte.aller.disponible) throw new Error('Déplacement ouvert attendu.');
    const html = bulleObjet(jeu, porte, 'aller');
    expect(html).toMatch(/^<section class="bulle bulle-objet" role="dialog" aria-modal="true"/);
    expect(html).toContain('aria-label="Étape précédente"');
    // La porte grippée a attiré la créature dans l'atelier, entendue derrière la porte : l'aperçu prévient (D-181, 12 §3.8) ; pas de coût, pas de ligne COÛT (D-187).
    expect(texte(html)).toBe(
      '‹ Aller vers › atelier ✕ Risque modéré — quelque chose bougeait derrière la porte de l’atelier Savoir Vous quitterez la cabine. Annuler Confirmer',
    );
    // Porte ouverte : la bulle propose aussi de la refermer.
    expect(texte(bulleObjet(jeu, porte))).toBe(`Porte de l’atelier ✕ ${description(jeu, 'porte')} ▸ Aller dans l’atelier ▸ Fermer`);
    expect(html).toContain('<dd><strong>modéré</strong> — quelque chose bougeait derrière la porte de l’atelier</dd>');
    const dock = entre(rendre(jeu), '<section class="dock"', '</section>');
    expect(entre(dock, '<button type="button" class="deplacement"', '</button>')).toContain('aria-haspopup="dialog" aria-expanded="false"');
  });

  it('pendant l’enregistrement d’une action, aucune bulle ne s’ouvre sur l’état d’avant (C-01 §4)', async () => {
    const html = renderToStaticMarkup(<EcranJeu jeu={await apres('ouvrir')} lus={[]} env={env} machineAEcrire occupe={true} choisir={rien} lireMessages={rienALire} />);
    const ouvrants = (html.match(/<button[^>]*>/g) ?? []).filter((bouton) => bouton.includes('aria-haspopup="dialog"'));
    // Carnet, « → ATELIER », « → SOUTE », INVENTAIRE, CARTE et IA STATION.
    expect(ouvrants).toHaveLength(6);
    expect(ouvrants.every((bouton) => bouton.includes('disabled=""'))).toBe(true);
    const arrivee = await apres('prendre', 'ouvrir', 'aller');
    const lien = entre(
      renderToStaticMarkup(<EcranJeu jeu={arrivee} lus={[]} env={env} machineAEcrire occupe={true} choisir={rien} lireMessages={rienALire} />),
      '<button type="button" class="lien-ia"',
      '>',
    );
    expect(lien).toContain('disabled=""');
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
    // Porte fermée au départ : dans sa bulle, le déplacement est indisponible (D-229).
    const porte = composerDock(observer(monde, jeu.partie.etat)).deplacements[0];
    if (porte === undefined || porte.aller.disponible) throw new Error('Passage fermé attendu au départ.');
    const html = bulleObjet(jeu, porte);
    const ligne = entre(html, '<button type="button" class="ligne indisponible"', '</button>');
    expect(ligne).toContain('aria-disabled="true"');
    expect(ligne).toContain('data-son="refus"');
    expect(ligne).not.toMatch(/disabled=""|<s>|<del>|line-through/);
    expect(texte(ligne)).toBe('⊘ Aller dans l’atelier La porte de l’atelier est fermée.');
    expect(ligne).toContain('aria-label="Aller dans l’atelier, indisponible : La porte de l’atelier est fermée."');
    expect(ligne).toContain('<span class="raison">La porte de l’atelier est fermée.</span>');
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

  it('défaite : plus d’action ni d’inventaire, la phrase de fin et NOUVELLE PARTIE (D-013)', async () => {
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
        nouvellePartie={() => undefined}
      />,
    );
    expect(html).not.toContain('badge-sante');
    expect(html).not.toContain('class="puce"');
    // Partie terminée : rien à mettre en pause, l'engrenage disparaît comme la navigation.
    expect(html).not.toContain('aria-label="Options"');
    expect(texte(entre(html, '<section class="dock fin-partie"', '</section>'))).toBe(
      'Cette partie est terminée. Elle ne peut pas être reprise. Nouvelle partie',
    );
    expect(html).toContain('<nav class="navigation" aria-label="Navigation" hidden="">');
  });

  it('fin de partie : ENVOYER MA PARTIE, discret, sous NOUVELLE PARTIE quand le service est là (12 §4.11, #108)', async () => {
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
        nouvellePartie={() => undefined}
        envoyerPartie={() => Promise.resolve('envoye')}
        pr="142"
      />,
    );
    expect(texte(entre(html, '<section class="dock fin-partie"', '</section>'))).toBe(
      'Cette partie est terminée. Elle ne peut pas être reprise. Nouvelle partie Envoyer ma partie',
    );
    expect(html).toContain('<button type="button" class="discret" data-son="clic">Envoyer ma partie</button>');
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

  it('pied de page court, déplacé dans les options : version, commit et numéro de PR sur une ligne (D-191)', async () => {
    const pied = (commit: string, pr: string, build = ''): string =>
      texte(entre(options({ commit, pr, build, version: '0.1.0' }), '<p class="pied">', '</p>'));
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

function options(
  surcharge: Partial<{
    reglages: Reglages;
    partieEnCours: boolean;
    version: string;
    build: string;
    commit: string;
    pr: string;
    miseAJour: MiseAJour;
    partieEnregistree: boolean;
    envoyerRapport: () => Promise<Retour>;
    rapportsEnAttente: number;
    empreinteCle: () => Promise<string | null>;
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
      partieEnregistree={surcharge.partieEnregistree}
      envoyerRapport={surcharge.envoyerRapport}
      rapportsEnAttente={surcharge.rapportsEnAttente}
      empreinteCle={surcharge.empreinteCle}
    />,
  );
}

describe('options (12 §4.10, #96)', () => {
  it('en-tête, taille du texte en trois boutons radio avec aperçu, affichage en deux bascules, partie, puis MENU PRINCIPAL et REPRENDRE', () => {
    const html = options();
    expect(texte(html)).toBe(
      [
        'Options le jeu est en pause',
        'Taille du texte Standard Grande Très grande',
        APERCU_TAILLE,
        'Son Général 80 Effets sonores bips et clics du terminal 80 Ambiance bruit brun et carlingue 60',
        'Affichage Lignes de balayage [OUI] Effet machine à écrire [OUI]',
        'Partie ▸ Télécharger ma partie fichier enregistré sur le téléphone ⊘ Abandonner la partie en cours',
        'Vv-test Menu principal Reprendre la partie',
      ].join(' '),
    );
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    expect(html).toMatch(/<label class="segment actif" data-son="clic"><input type="radio"[^>]*name="taille" checked=""\/><span>Standard<\/span><\/label>/);
    expect(html).toContain('role="switch" aria-checked="true" aria-label="Lignes de balayage"');
    expect(html).toContain('role="switch" aria-checked="true" aria-label="Effet machine à écrire"');
    expect(html).toContain('<p class="retour-option" role="status" data-testid="telechargement"></p>');
  });

  it('mise à jour : bouton selon l’état, absent sans service worker (D-227)', () => {
    const section = (etat: EtatMiseAJour, partieEnCours = true): string => {
      const miseAJour: MiseAJour = { etat: () => etat, abonner: () => () => undefined, chercher: () => Promise.resolve() };
      const html = options({ miseAJour, partieEnCours });
      return html.includes('Mise à jour') ? texte(entre(html, '<h2 class="titre-section">Mise à jour</h2>', '</section>')) : '';
    };
    expect(section('indisponible')).toBe('');
    expect(texte(options())).not.toContain('Mise à jour');
    expect(section('inconnu')).toBe('Mise à jour ▸ Chercher une mise à jour le jeu redémarre, la partie est gardée');
    expect(section('a_jour', false)).toBe('Mise à jour ▸ Chercher une mise à jour le jeu redémarre s’il en trouve une Le jeu est à jour.');
    expect(section('echec')).toContain('Impossible de vérifier. Le téléphone est-il connecté ?');
    expect(section('prete')).toBe('Mise à jour ▸ Installer la nouvelle version le jeu redémarre, la partie est gardée Une nouvelle version est prête.');
    expect(section('recherche')).toContain('Recherche en cours…');
  });

  it('réglages choisis : la taille active et les bascules sur [NON]', () => {
    const html = options({ reglages: { ...REGLAGES_PAR_DEFAUT, taille: 'tres_grande', balayage: false, machineAEcrire: false } });
    expect(html).toMatch(/<label class="segment actif" data-son="clic"><input[^>]*checked=""\/><span>Très grande<\/span>/);
    expect(html.match(/class="segment actif"/g)).toHaveLength(1);
    expect(texte(html)).toContain('Lignes de balayage [NON] Effet machine à écrire [NON]');
    expect(html).toContain('role="switch" aria-checked="false"');
  });

  it('son : trois rails de 0 à 100, valeur écrite à droite, COUPÉE ou COUPÉS à 0 (15 §4, D-220)', () => {
    const html = options();
    const rails = html.match(/<input[^>]*class="curseur-rail"[^>]*>/g) ?? [];
    expect(rails).toHaveLength(3);
    for (const rail of rails) expect(rail).toMatch(/type="range" min="0" max="100" step="1"/);
    expect(rails.map((rail) => /value="(\d+)"/.exec(rail)?.[1])).toEqual(['80', '80', '60']);
    const coupe = texte(options({ reglages: { ...REGLAGES_PAR_DEFAUT, general: 0, effets: 0, ambiance: 0 } }));
    expect(coupe).toContain('Son Général COUPÉE Effets sonores bips et clics du terminal COUPÉS Ambiance bruit brun et carlingue COUPÉE');
    expect(options()).toContain('aria-valuetext="60"');
  });

  it('sans partie en cours : ni Télécharger, ni Abandonner, ni REPRENDRE LA PARTIE, ni « en pause »', () => {
    const html = texte(options({ partieEnCours: false }));
    for (const absent of ['Télécharger', 'Abandonner', 'Reprendre', 'en pause', 'Partie ']) expect(html).not.toContain(absent);
    expect(html).toContain('Menu principal');
  });
});

describe('rapports dans les options (12 §4.10, D-142, #107)', () => {
  const envoyerRapport = (): Promise<Retour> => Promise.resolve('envoye');

  it('partie en cours : Télécharger, Signaler un bug, Envoyer ma partie, puis Abandonner', () => {
    expect(texte(entre(options({ envoyerRapport }), '<h2 class="titre-section">Partie</h2>', '</section>'))).toBe(
      [
        'Partie ▸ Télécharger ma partie fichier enregistré sur le téléphone',
        '▸ Signaler un bug la partie en cours est jointe',
        '▸ Envoyer ma partie partie et commentaire',
        '⊘ Abandonner la partie en cours',
      ].join(' '),
    );
    expect(options({ envoyerRapport })).toContain('aria-expanded="false"');
  });

  it('sans partie : seulement Signaler un bug, sans partie jointe ; partie finie : on peut encore l’envoyer', () => {
    const sans = texte(options({ envoyerRapport, partieEnCours: false, partieEnregistree: false }));
    expect(sans).toContain('Partie ▸ Signaler un bug aucune partie à joindre');
    for (const absent of ['Envoyer ma partie', 'Télécharger', 'Abandonner']) expect(sans).not.toContain(absent);
    const finie = texte(options({ envoyerRapport, partieEnCours: false, partieEnregistree: true }));
    expect(finie).toContain('▸ Signaler un bug la partie est jointe ▸ Envoyer ma partie partie et commentaire');
    expect(finie).not.toContain('Abandonner');
  });

  it('rapports gardés sans réseau : le nombre en attente est dit en mots courants', () => {
    expect(texte(options({ envoyerRapport, rapportsEnAttente: 1 }))).toContain('Un rapport attend le réseau pour partir.');
    expect(texte(options({ envoyerRapport, rapportsEnAttente: 3 }))).toContain('3 rapports attendent le réseau pour partir.');
    expect(options({ envoyerRapport })).not.toContain('rapports-en-attente');
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
    const test = options({ envoyerRapport, pr: '142', empreinteCle });
    expect(texte(entre(test, '<h2 class="titre-section">Validation</h2>', '</section>'))).toBe('Validation Clé de ce téléphone lecture…');
    expect(texte(options({ envoyerRapport, pr: '', empreinteCle }))).not.toContain('Validation');
    expect(texte(options({ envoyerRapport, pr: '142' }))).not.toContain('Validation');
  });

  it('retours : le panneau se ferme quand le rapport est parti ou gardé, reste ouvert sinon', () => {
    expect((['envoye', 'garde', 'trop'] as const).every(rapportPris)).toBe(true);
    expect((['refuse', 'perdu', 'patience'] as const).some(rapportPris)).toBe(false);
    expect(RETOURS.garde).toBe('Pas de réseau. Le rapport est gardé sur le téléphone et partira tout seul à la prochaine connexion.');
  });
});

describe('fin après abandon (12 §4.11, #96)', () => {
  it('titre, récit court, pièces visitées en mots, phrase de fin, puis REJOUER, NOUVELLE PARTIE et MENU PRINCIPAL ; aucun chiffre', async () => {
    const jeu = await apres('prendre', 'ouvrir', 'aller');
    const html = renderToStaticMarkup(
      <EcranFin jeu={jeu} env={env} occupe={false} rejouer={rienALire} nouvellePartie={rienALire} menuPrincipal={rienALire} />,
    );
    expect(texte(html)).toBe(
      [
        '&gt; Fin de la partie_',
        'Partie abandonnée.',
        'Vous en restez là, dans l’atelier.',
        'Pièces visitées : Cabine, Atelier',
        'Cette partie est terminée. Elle ne peut pas être reprise.',
        'Rejouer cette station Nouvelle partie Menu principal',
      ].join(' '),
    );
    expect(texte(html)).not.toMatch(/\d/);
    expect(html).toContain('<button type="button" class="principal" data-son="clic">Rejouer cette station</button>');
  });

  it('ENVOYER MA PARTIE, discret, entre NOUVELLE PARTIE et MENU PRINCIPAL quand le service est là (#107)', async () => {
    const jeu = await apres('prendre');
    const html = renderToStaticMarkup(
      <EcranFin jeu={jeu} env={env} occupe={false} rejouer={rienALire} nouvellePartie={rienALire} menuPrincipal={rienALire} envoyerPartie={() => Promise.resolve('envoye')} />,
    );
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
    expect(html).toContain('<button type="button" class="principal" disabled="">Nouvelle partie</button>');
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
      <EcranJeu jeu={jeu} lus={lus} env={envAr01} machineAEcrire occupe={false} choisir={rien} lireMessages={rienALire} nouvellePartie={() => undefined} />,
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
    expect(texte(entre(atelier, '<ul class="deplacements"', '</ul>'))).toBe('→ salon de transit');
    const ouverte = dockDe(rendreAr01(await pc(4)));
    expect(texte(ouverte)).not.toContain('▸ Grille');
    expect(texte(entre(ouverte, '<ul class="deplacements"', '</ul>'))).toBe('→ salon de transit → grille');
    const local = dockDe(rendreAr01(await pc(5)));
    expect(texte(entre(local, '<ul class="deplacements"', '</ul>'))).toContain('→ atelier maintenance');
    expect(local).not.toMatch(/→ grille/);
  });

  it('bloc en main : « → atelier » par la grille reste visible, en pointillé, nommé avec sa raison (D-229)', async () => {
    const charge = dockDe(rendreAr01(await pc(7)));
    const grille = entre(charge, '<button type="button" class="deplacement bloque" aria-haspopup="dialog" aria-expanded="false" aria-label="atelier maintenance', '</button>');
    const raison = 'Ce que vous portez est trop large pour la grille de l’atelier maintenance.';
    expect(grille).toContain(`aria-label="atelier maintenance, ${raison}"`);
    expect(texte(grille)).toBe('→ atelier maintenance');
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
    // En cours de partie, un lien ouvre la fenêtre au lieu de la citation (12 §3.3, D-192).
    const html = rendreAr01(arrivee, ['reveil']);
    expect(html).not.toContain('parole-ia');
    expect(texte(entre(html, '<button type="button" class="lien-ia"', '</button>'))).toBe('[ IA STATION ] parle dans l’écouteur ›');
    expect((await pc(6)).assistance).toEqual([]);
    expect(rendreAr01(await pc(6), ['reveil'])).not.toContain('lien-ia');
  });

  it('évacuation : seize actions, la phrase de la capsule et NOUVELLE PARTIE à la place du dock ; en-tête inchangé', async () => {
    const fin = await pc(P_C.length);
    expect(fin.partie.etat.actions).toBe(16);
    const html = rendreAr01(fin);
    expect(texte(entre(html, '<section class="dock fin-partie"', '</section>'))).toBe('La capsule s’est détachée. Vous avez quitté la station. Nouvelle partie');
    expect(html).not.toContain('Cette partie est terminée');
    expect(html).not.toContain('class="puce"');
    expect(html).not.toContain('class="deplacements"');
    expect(html).toContain('<nav class="navigation" aria-label="Navigation" hidden="">');
    expect(entre(html, '<header', '</header>')).toContain('<h1 class="titre-piece">cabine de la capsule</h1>');
    expect(fin.assistance).toEqual([ar01.textes.assistance.depart]);
    // Le dernier message se lit encore dans la fenêtre, par le lien : la navigation n'est plus là.
    expect(html).toContain('class="lien-ia"');
  });
});

describe('IA Station : lien, pastille et fenêtre blanche (#98, 12 §3.3, §3.9, D-192)', () => {
  const { reveil = '', atelier = '' } = textes.assistance;
  const navIa = (html: string): string => entre(html, '<button type="button" class="nav-ia"', '</button>');

  it('au réveil : citation encadrée, pas de lien ; pastille et « nouveau message » tant que la fenêtre n’a pas été ouverte', async () => {
    const jeu = await commencer(env);
    const html = rendre(jeu);
    expect(lu(entre(html, '<section class="parole-ia"', '</section>'))).toBe(`«\u00a0${reveil}\u00a0»`);
    expect(html).not.toContain('lien-ia');
    expect(navIa(html)).toBe(
      '<button type="button" class="nav-ia" aria-haspopup="dialog" aria-expanded="false" aria-label="IA Station, nouveau message" data-son="panneau-ia">IA Sta\u00adtion<span class="pastille" aria-hidden="true"></span></button>',
    );
    const lu1 = navIa(rendre(jeu, undefined, true, ['reveil']));
    expect(lu1).toContain('aria-label="IA Station"');
    expect(lu1).not.toContain('pastille');
  });

  it('à l’arrivée dans l’atelier : seulement le lien dans le récit, après lui ; à l’action suivante, plus de lien, la pastille reste', async () => {
    const arrivee = await apres('prendre', 'ouvrir', 'aller');
    expect(arrivee.assistance).toEqual([atelier]);
    const recit = entre(rendre(arrivee, undefined, true, ['reveil']), '<section class="recit', '</button></section>');
    expect(recit).not.toContain('parole-ia');
    expect(recit).not.toContain(atelier);
    expect(recit).toMatch(
      /<button type="button" class="lien-ia" aria-haspopup="dialog" aria-expanded="false" aria-label="IA Station parle dans l’écouteur" data-testid="lien-ia" data-son="panneau-ia">\[ IA STATION \] parle dans l’écouteur\u00a0›<\/button><\/section>$/,
    );
    expect(navIa(rendre(arrivee, undefined, true, ['reveil']))).toContain('pastille');
    expect(navIa(rendre(arrivee, undefined, true, ['reveil', 'atelier']))).not.toContain('pastille');
    // Seul le message de l'atelier a été lu : celui du réveil reste nouveau.
    expect(navIa(rendre(arrivee, undefined, true, ['atelier']))).toContain('pastille');
    const suivant = await jouerOption(env, arrivee, observer(monde, arrivee.partie.etat).menu.find((option) => option.action === 'poser') as OptionMenu);
    expect(rendre(suivant, undefined, true, ['reveil'])).not.toContain('lien-ia');
    expect(navIa(rendre(suivant, undefined, true, ['reveil']))).toContain('pastille');
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
        <EcranJeu jeu={jeu} lus={[]} env={envAr01} machineAEcrire occupe={false} choisir={rien} lireMessages={rienALire} nouvellePartie={() => undefined} />,
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
