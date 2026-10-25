import { useLayoutEffect, useRef } from 'react';
import type { CartePublique, Observation } from '../engine';
import { former, nomDe, type TextesMonde } from '../content';
import { garderFocus } from './bulle';
import { ZonePlan } from './carte/EcranCarte';
import { camerasChangees, type CameraLue } from './jeu';
import { LIBELLES } from './libelles';

const MOTS = LIBELLES.poste;

/** Une ligne du journal du poste ; `alerte` : une caméra passée au mouvement, en rouge. */
export interface PhrasePoste {
  readonly texte: string;
  readonly alerte: boolean;
}

/** Lignes que garde le mini-terminal du bas de la fenêtre, la plus récente en bas (D-359). */
export const LIGNES_JOURNAL = 4;

/**
 * Journal du poste (D-359) : seulement les caméras, jamais le récit. Une caméra passée au mouvement l'écrit en rouge, une caméra
 * en panne (`hs`) l'écrit aussi ; brouillée ou revenue au calme, rien. Un pas sans rien de neuf écrit « Aucun mouvement. », une fois
 * jusqu'au prochain changement, et jamais sous une caméra au mouvement. Sans `avant` (connexion), le journal part de l'état présent :
 * les caméras déjà au mouvement, sinon « Aucun mouvement. » ; une caméra déjà en panne reste barrée sur le plan, sans ligne.
 */
export function journalPoste(
  textes: TextesMonde,
  journal: readonly PhrasePoste[],
  avant: readonly CameraLue[] | undefined,
  apres: readonly CameraLue[],
): PhrasePoste[] {
  const changees = avant === undefined ? apres.filter(({ etat }) => etat === 'mouvement') : camerasChangees(avant, apres);
  const lignes = changees.flatMap(({ piece, etat }): PhrasePoste[] => {
    if (etat === 'mouvement') return [{ texte: MOTS.mouvement(`dans ${former('le', nomDe(textes, piece))}`), alerte: true }];
    if (etat === 'hs') return [{ texte: MOTS.panne(former('de', nomDe(textes, piece))), alerte: false }];
    return [];
  });
  const calme = lignes.length === 0 && !apres.some(({ etat }) => etat === 'mouvement') && journal.at(-1)?.texte !== MOTS.aucun;
  return [...journal, ...lignes, ...(calme ? [{ texte: MOTS.aucun, alerte: false }] : [])].slice(-LIGNES_JOURNAL);
}

/** Un pas d'attente toutes les deux secondes, au rythme du « ● DIRECT », tant que la fenêtre est ouverte (D-359). */
export const PAS_POSTE_MS = 2000;

/** Ce que l'horloge lit de la page : `document`, ou une page simulée dans les tests. */
export interface PageVisible {
  readonly hidden: boolean;
  addEventListener(type: 'visibilitychange', ecouteur: () => void): void;
  removeEventListener(type: 'visibilitychange', ecouteur: () => void): void;
}

/**
 * Horloge du poste : arme un seul pas différé si `actif`, et rend de quoi l'annuler. Appelée par un effet qui se rejoue à chaque
 * pas : jamais deux minuteurs, rien pendant qu'un pas s'applique (`actif` faux), rien après la fermeture ou le démontage.
 * Page cachée (écran verrouillé, autre appli) : aucun pas ; revenue, le pas repart de deux secondes.
 */
export function armerPoste(actif: boolean, jouer: () => void, page: PageVisible): () => void {
  if (!actif) return () => undefined;
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  const armer = (): void => {
    clearTimeout(minuteur);
    minuteur = page.hidden ? undefined : setTimeout(jouer, PAS_POSTE_MS);
  };
  page.addEventListener('visibilitychange', armer);
  armer();
  return () => {
    clearTimeout(minuteur);
    page.removeEventListener('visibilitychange', armer);
  };
}

const rien = (): void => undefined;

/**
 * Fenêtre du poste de surveillance en direct (lot 4, variante A) : plein cadre et verte comme la carte. En-tête SURVEILLANCE et
 * ● DIRECT, le plan de la station avec ses caméras, le journal des caméras, puis QUITTER, qui la ferme
 * et arrête l'horloge (D-359). Échap la ferme aussi. Une pièce n'y ouvre pas de fiche : la carte reste là pour ça.
 */
export function FenetrePoste({
  carte,
  cameras,
  journal,
  quitter,
  textes,
}: {
  readonly carte: CartePublique;
  readonly cameras: NonNullable<Observation['cameras']>;
  readonly journal: readonly PhrasePoste[];
  readonly quitter: () => void;
  readonly textes: TextesMonde;
}) {
  const zone = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    zone.current?.focus();
  }, []);
  return (
    <section
      ref={zone}
      className="bulle carte fenetre-poste"
      role="dialog"
      aria-modal="true"
      aria-label={MOTS.nom}
      tabIndex={-1}
      onKeyDown={(evenement) => garderFocus(evenement, quitter)}
    >
      <header className="carte-entete">
        <h2 className="carte-titre" aria-hidden="true">
          {MOTS.titre}
        </h2>
        <span className="repere-direct" aria-hidden="true">
          {MOTS.direct}
        </span>
      </header>
      <ZonePlan carte={carte} textes={textes} ouverte={null} toucher={rien} cameras={new Map(cameras.map(({ piece, etat }) => [piece.id, etat]))} />
      {/* Les caméras en mots, pour le lecteur d'écran : le plan, lui, ne les nomme pas. */}
      <ul className="lecteur-seul">
        {cameras.map(({ piece, etat }) => (
          <li key={piece.id}>{MOTS.camera(former('de', nomDe(textes, piece)), MOTS.etats[etat])}</li>
        ))}
      </ul>
      <div className="poste-bas">
        <ol className="poste-journal" role="log" aria-live="polite">
          {journal.map(({ texte, alerte }, index) => (
            <li key={index} className={alerte ? 'alerte' : undefined}>
              {texte}
            </li>
          ))}
        </ol>
        <div className="poste-actions">
          <button type="button" className="secondaire" onClick={quitter} data-son="clic">
            {MOTS.quitter}
          </button>
        </div>
      </div>
    </section>
  );
}
