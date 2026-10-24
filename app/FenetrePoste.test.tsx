import { renderToStaticMarkup } from 'react-dom/server';
import type { CartePublique, RefPiece } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { armerPoste, FenetrePoste, lignePoste, PAS_POSTE_MS } from './FenetrePoste';

const { textes } = MONDES['monde-test'] as EntreeMonde;
const rien = (): void => undefined;
const piece = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });
const ATELIER = piece('atelier');
const SOUTE = piece('soute');
const CARTE: CartePublique = { pieces: [], passages: [], capsules: [], aBord: null };

describe('fenêtre du poste (lot 4, variante A)', () => {
  it('dialogue « Surveillance » : en-tête, caméras lues en mots, ligne rouge en région polie, QUITTER seul (D-359)', () => {
    const cameras = [
      { piece: ATELIER, etat: 'calme' as const },
      { piece: SOUTE, etat: 'mouvement' as const },
    ];
    const html = renderToStaticMarkup(
      <FenetrePoste carte={CARTE} cameras={cameras} ligne={lignePoste(textes, [cameras[1]!], cameras)} quitter={rien} textes={textes} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Surveillance"');
    expect(html).toContain('SURVEILLANCE');
    expect(html).toContain('class="repere-direct" aria-hidden="true">● DIRECT');
    expect(html).toContain('<li>Caméra de l’atelier : calme</li>');
    expect(html).toContain('<li>Caméra de la soute : mouvement</li>');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('<span class="alerte">SOUTE : MOUVEMENT. </span>');
    expect(html).not.toContain('Attendre');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toMatch(/<button[^>]*class="secondaire"[^>]*>Quitter<\/button>/);
  });

  it('ligne : un changement par phrase, « Aucun mouvement. » seulement sans caméra rouge', () => {
    const calme = { piece: ATELIER, etat: 'calme' as const };
    const rouge = { piece: SOUTE, etat: 'mouvement' as const };
    expect(lignePoste(textes, [calme], [calme])).toEqual([{ texte: 'ATELIER : calme.', alerte: false }]);
    expect(lignePoste(textes, [{ piece: ATELIER, etat: 'brouille' }, { piece: SOUTE, etat: 'hs' }], [])).toEqual([
      { texte: 'ATELIER : brouillée.', alerte: false },
      { texte: 'SOUTE : plus de signal.', alerte: false },
    ]);
    expect(lignePoste(textes, [], [calme])).toEqual([{ texte: 'Aucun mouvement.', alerte: false }]);
    expect(lignePoste(textes, [], [calme, rouge])).toEqual([{ texte: 'SOUTE : MOUVEMENT.', alerte: true }]);
    // Le récit du pas passe devant les caméras, ses alertes en rouge ; il remplace « Aucun mouvement. ».
    const recit = [{ texte: 'Un raclement derrière la porte.', alerte: true }];
    expect(lignePoste(textes, [], [calme], recit)).toEqual(recit);
    expect(lignePoste(textes, [], [calme, rouge], recit)).toEqual([...recit, { texte: 'SOUTE : MOUVEMENT.', alerte: true }]);
  });
});

describe('horloge du poste (D-359)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('un pas toutes les deux secondes, un seul minuteur, rien quand inactive ou annulée', () => {
    const jouer = vi.fn();
    const annuler = armerPoste(true, jouer);
    vi.advanceTimersByTime(PAS_POSTE_MS - 1);
    expect(jouer).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(jouer).toHaveBeenCalledTimes(1);
    // Un seul pas par armement : le suivant attend le pas appliqué, qui réarme.
    vi.advanceTimersByTime(PAS_POSTE_MS * 5);
    expect(jouer).toHaveBeenCalledTimes(1);
    annuler();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pas appliqué en cours, fenêtre fermée ou démontée : aucun pas', () => {
    const jouer = vi.fn();
    armerPoste(false, jouer);
    expect(vi.getTimerCount()).toBe(0);
    const annuler = armerPoste(true, jouer);
    vi.advanceTimersByTime(PAS_POSTE_MS / 2);
    annuler();
    vi.advanceTimersByTime(PAS_POSTE_MS * 3);
    expect(jouer).not.toHaveBeenCalled();
  });

  it('réarmée à chaque pas comme l’effet de l’écran : jamais deux minuteurs à la fois', () => {
    const jouer = vi.fn();
    let annuler = armerPoste(true, jouer);
    for (let pas = 0; pas < 4; pas++) {
      vi.advanceTimersByTime(PAS_POSTE_MS);
      annuler();
      annuler = armerPoste(true, jouer);
      expect(vi.getTimerCount()).toBe(1);
    }
    annuler();
    expect(jouer).toHaveBeenCalledTimes(4);
  });
});
