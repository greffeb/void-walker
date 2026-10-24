import { renderToStaticMarkup } from 'react-dom/server';
import type { CartePublique, RefPiece } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { armerPoste, FenetrePoste, journalPoste, PAS_POSTE_MS } from './FenetrePoste';

const { textes } = MONDES['monde-test'] as EntreeMonde;
const rien = (): void => undefined;
const piece = (nom: string): RefPiece => ({ sorte: 'piece', id: `e-${nom}`, nom });
const ATELIER = piece('atelier');
const SOUTE = piece('soute');
const CARTE: CartePublique = { pieces: [], passages: [], capsules: [], aBord: null };

describe('fenêtre du poste (lot 4, variante A)', () => {
  it('dialogue « Surveillance » : en-tête, caméras lues en mots, journal en région log polie, QUITTER seul (D-359)', () => {
    const cameras = [
      { piece: ATELIER, etat: 'calme' as const },
      { piece: SOUTE, etat: 'mouvement' as const },
    ];
    const html = renderToStaticMarkup(
      <FenetrePoste carte={CARTE} cameras={cameras} journal={journalPoste(textes, [], undefined, cameras)} quitter={rien} textes={textes} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Surveillance"');
    expect(html).toContain('SURVEILLANCE');
    expect(html).toContain('class="repere-direct" aria-hidden="true">● DIRECT');
    expect(html).toContain('<li>Caméra de l’atelier : calme</li>');
    expect(html).toContain('<li>Caméra de la soute : mouvement</li>');
    expect(html).toContain('<ol class="poste-journal" role="log" aria-live="polite"><li class="alerte">Mouvement détecté dans la soute.</li></ol>');
    expect(html).not.toContain('Attendre');
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toMatch(/<button[^>]*class="secondaire"[^>]*>Quitter<\/button>/);
  });

  it('journal : mouvement en rouge, panne ; brouillée ou retour au calme muets ; « Aucun mouvement. » une fois, jamais sous du rouge', () => {
    const calme = { piece: ATELIER, etat: 'calme' as const };
    const rouge = { piece: SOUTE, etat: 'mouvement' as const };
    const soute = { piece: SOUTE, etat: 'calme' as const };
    const mouvement = { texte: 'Mouvement détecté dans la soute.', alerte: true };
    const aucun = { texte: 'Aucun mouvement.', alerte: false };
    // Connexion : l'état présent ; une caméra déjà en panne ne s'écrit pas.
    expect(journalPoste(textes, [], undefined, [calme, rouge])).toEqual([mouvement]);
    expect(journalPoste(textes, [], undefined, [calme, { piece: SOUTE, etat: 'hs' }])).toEqual([aucun]);
    // Rien de neuf : « Aucun mouvement. » ne s'empile pas, et ne se dit pas sous une caméra rouge.
    expect(journalPoste(textes, [aucun], [calme, soute], [calme, soute])).toEqual([aucun]);
    expect(journalPoste(textes, [mouvement], [calme, rouge], [calme, rouge])).toEqual([mouvement]);
    expect(journalPoste(textes, [aucun], [calme, soute], [calme, rouge])).toEqual([aucun, mouvement]);
    // Retour au calme : pas de ligne à lui, « Aucun mouvement. » reprend.
    expect(journalPoste(textes, [mouvement], [calme, rouge], [calme, soute])).toEqual([mouvement, aucun]);
    expect(journalPoste(textes, [aucun], [calme, soute], [{ piece: ATELIER, etat: 'brouille' }, { piece: SOUTE, etat: 'hs' }])).toEqual([
      aucun,
      { texte: 'Caméra de la soute : en panne.', alerte: false },
    ]);
  });

  it('journal : les quatre dernières lignes seulement, la plus récente en bas', () => {
    const calme = [{ piece: SOUTE, etat: 'calme' as const }];
    const rouge = [{ piece: SOUTE, etat: 'mouvement' as const }];
    let journal = journalPoste(textes, [], undefined, calme);
    for (let pas = 0; pas < 3; pas++) journal = journalPoste(textes, journalPoste(textes, journal, calme, rouge), rouge, calme);
    expect(journal).toHaveLength(4);
    expect(journal.map(({ texte }) => texte)).toEqual(['Mouvement détecté dans la soute.', 'Aucun mouvement.', 'Mouvement détecté dans la soute.', 'Aucun mouvement.']);
  });
});

describe('horloge du poste (D-359)', () => {
  // Page simulée : `cacher` change sa visibilité et prévient ses écouteurs, comme `document`.
  const page = Object.assign(new EventTarget(), { hidden: false });
  const cacher = (hidden: boolean): void => {
    page.hidden = hidden;
    page.dispatchEvent(new Event('visibilitychange'));
  };
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    page.hidden = false;
    vi.useRealTimers();
  });

  it('page cachée (écran verrouillé, autre appli) : aucun pas ; revenue, le pas repart de deux secondes', () => {
    const jouer = vi.fn();
    const annuler = armerPoste(true, jouer, page);
    vi.advanceTimersByTime(PAS_POSTE_MS - 1);
    cacher(true);
    vi.advanceTimersByTime(PAS_POSTE_MS * 10);
    expect(jouer).not.toHaveBeenCalled();
    cacher(false);
    vi.advanceTimersByTime(PAS_POSTE_MS - 1);
    expect(jouer).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(jouer).toHaveBeenCalledTimes(1);
    annuler();
    // Annulée, elle n'écoute plus la page.
    cacher(true);
    cacher(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('armée page déjà cachée : rien avant le retour', () => {
    const jouer = vi.fn();
    page.hidden = true;
    const annuler = armerPoste(true, jouer, page);
    expect(vi.getTimerCount()).toBe(0);
    cacher(false);
    vi.advanceTimersByTime(PAS_POSTE_MS);
    expect(jouer).toHaveBeenCalledTimes(1);
    annuler();
  });

  it('un pas toutes les deux secondes, un seul minuteur, rien quand inactive ou annulée', () => {
    const jouer = vi.fn();
    const annuler = armerPoste(true, jouer, page);
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
    armerPoste(false, jouer, page);
    expect(vi.getTimerCount()).toBe(0);
    const annuler = armerPoste(true, jouer, page);
    vi.advanceTimersByTime(PAS_POSTE_MS / 2);
    annuler();
    vi.advanceTimersByTime(PAS_POSTE_MS * 3);
    expect(jouer).not.toHaveBeenCalled();
  });

  it('réarmée à chaque pas comme l’effet de l’écran : jamais deux minuteurs à la fois', () => {
    const jouer = vi.fn();
    let annuler = armerPoste(true, jouer, page);
    for (let pas = 0; pas < 4; pas++) {
      vi.advanceTimersByTime(PAS_POSTE_MS);
      annuler();
      annuler = armerPoste(true, jouer, page);
      expect(vi.getTimerCount()).toBe(1);
    }
    annuler();
    expect(jouer).toHaveBeenCalledTimes(4);
  });
});
