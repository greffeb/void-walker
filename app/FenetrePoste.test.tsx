import { renderToStaticMarkup } from 'react-dom/server';
import type { CartePublique, RefPiece } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { FenetrePoste, lignePoste } from './FenetrePoste';

const { textes } = MONDES['monde-test'] as EntreeMonde;
const rien = (): void => undefined;
const piece = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });
const ATELIER = piece('atelier');
const SOUTE = piece('soute');
const CARTE: CartePublique = { pieces: [], passages: [], capsules: [], aBord: null };

describe('fenêtre du poste (lot 4, variante A)', () => {
  it('dialogue « Surveillance » : en-tête, caméras lues en mots, ligne rouge en région polie, ATTENDRE et QUITTER', () => {
    const cameras = [
      { piece: ATELIER, etat: 'calme' as const },
      { piece: SOUTE, etat: 'mouvement' as const },
    ];
    const html = renderToStaticMarkup(
      <FenetrePoste carte={CARTE} cameras={cameras} ligne={lignePoste(textes, [cameras[1]!], cameras)} attendre={rien} quitter={rien} textes={textes} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Surveillance"');
    expect(html).toContain('SURVEILLANCE');
    expect(html).toContain('class="repere-direct" aria-hidden="true">● DIRECT');
    expect(html).toContain('<li>Caméra de l’atelier : calme</li>');
    expect(html).toContain('<li>Caméra de la soute : mouvement</li>');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('<span class="alerte">SOUTE : MOUVEMENT. </span>');
    expect(html).toMatch(/<button[^>]*class="principal"[^>]*>Attendre<\/button>/);
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
  });
});
