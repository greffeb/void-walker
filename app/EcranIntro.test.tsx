import { renderToStaticMarkup } from 'react-dom/server';
import { MONDES, type EntreeMonde } from '../content';
import { EcranIntro } from './EcranIntro';
import { EcranReveil } from './EcranJeu';
import { commencer, type Environnement } from './jeu';
import type { Intro } from './intro';
import type { Stockage } from './sauvegarde';

const plan = [
  { x: 0, y: 0, largeur: 4, hauteur: 3 },
  { x: 4, y: 0, largeur: 4, hauteur: 3 },
];

const intro: Intro = {
  total: 600,
  numero: () => 372,
  plan: () => plan,
  hasard: () => 0.5,
  mouvementReduit: () => false,
};

const texte = (html: string): string =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function rendre(instantane: boolean): string {
  return renderToStaticMarkup(<EcranIntro intro={intro} numero={372} instantane={instantane} occupe={false} demarrer={() => undefined} />);
}

describe('écran d’intro (12 §4.1 bis, D-308 à D-312)', () => {
  it('au départ : écran noir, rien à lire, pas encore de DÉMARRER', () => {
    const html = rendre(false);
    expect(html).toContain('aria-label="Tirage de la station"');
    expect(html).not.toContain('Démarrer');
    expect(texte(html)).toBe('');
  });

  it('fini (passé d’un toucher, machine à écrire coupée ou mouvement réduit) : le tirage, l’erreur en rouge et DÉMARRER', () => {
    const html = rendre(true);
    const lu = texte(html);
    expect(lu).toContain('Station 372 sur 600');
    expect(lu).toContain('> Tirage parmi 600 stations…');
    expect(lu).toContain('> Section de départ ok');
    expect(lu).toContain('> Vérification de la sortie ok');
    expect(html).toMatch(/<li class="intro-menace"><span aria-hidden="true">▲ <\/span>ERREUR : Menace détectée<\/li>/);
    expect(lu).toContain('> Station 372 prête');
    expect(lu).toContain('La prochaine partie en tirera une autre.');
    expect(html).toMatch(/<button[^>]*class="principal"[^>]*data-son="confirmer"[^>]*>Démarrer<\/button>/);
    expect(html).not.toContain('Toucher pour passer');
    // La silhouette tirée reste voilée : rien de la station n'est dévoilé.
    expect(html).toContain('class="intro-carte intro-voilee"');
  });
});

describe('réveil : rang de la station en haut à droite (D-312)', () => {
  function memoire(): Stockage {
    let donnees: unknown = null;
    return {
      lire: () => Promise.resolve(donnees),
      ecrire: (nouvelles) => {
        donnees = nouvelles;
        return Promise.resolve();
      },
      lireLus: () => Promise.resolve(null),
      ecrireLus: () => Promise.resolve(),
      effacer: () => Promise.resolve(),
    };
  }

  it('station tirée : « Station 372 » ; monde fixe : rien', async () => {
    const { monde, textes } = MONDES['monde-test'] as EntreeMonde;
    const env: Environnement = { monde, textes, version: 'v-test', stockage: memoire(), graine: () => 5 };
    const jeu = await commencer(env);
    const avec = renderToStaticMarkup(<EcranReveil jeu={jeu} env={env} numero={372} machineAEcrire={false} occupe={false} regarder={() => undefined} />);
    expect(avec).toContain('<p class="numero-station">Station 372</p>');
    const sans = renderToStaticMarkup(<EcranReveil jeu={jeu} env={env} machineAEcrire={false} occupe={false} regarder={() => undefined} />);
    expect(sans).not.toContain('numero-station');
  });
});
