import { useLayoutEffect, useRef } from 'react';
import type { CartePublique, Observation } from '../engine';
import { former, nomCarte, nomDe, type TextesMonde } from '../content';
import { garderFocus } from './bulle';
import { ZonePlan } from './carte/EcranCarte';
import type { CameraLue } from './jeu';
import { LIBELLES } from './libelles';

const MOTS = LIBELLES.poste;

/** Une phrase de la ligne du bas ; `alerte` : une caméra passée au mouvement, en rouge. */
export interface PhrasePoste {
  readonly texte: string;
  readonly alerte: boolean;
}

/**
 * Ligne du bas de la fenêtre (lot 4) : le récit du pas s'il dit autre chose que l'attente (D-359), puis « REMISE : MOUVEMENT. » en
 * rouge, « REMISE : calme. » pour un autre changement. Sans changement, les caméras restées au mouvement se redisent : la ligne ne
 * dit jamais « Aucun mouvement. » sous une caméra rouge.
 */
export function lignePoste(
  textes: TextesMonde,
  changees: readonly CameraLue[],
  cameras: readonly CameraLue[],
  recit: readonly PhrasePoste[] = [],
): PhrasePoste[] {
  const dites = changees.length > 0 ? changees : cameras.filter((camera) => camera.etat === 'mouvement');
  if (dites.length === 0 && recit.length === 0) return [{ texte: MOTS.aucun, alerte: false }];
  return [
    ...recit,
    ...dites.map(({ piece, etat }) => {
      const mot = MOTS.etats[etat];
      return { texte: `${nomCarte(textes, piece)} : ${etat === 'mouvement' ? mot.toUpperCase() : mot}.`, alerte: etat === 'mouvement' };
    }),
  ];
}

/** Un pas d'attente toutes les deux secondes, au rythme du « ● DIRECT », tant que la fenêtre est ouverte (D-359). */
export const PAS_POSTE_MS = 2000;

/**
 * Horloge du poste : arme un seul pas différé si `actif`, et rend de quoi l'annuler. Appelée par un effet qui se rejoue à chaque
 * pas : jamais deux minuteurs, rien pendant qu'un pas s'applique (`actif` faux), rien après la fermeture ou le démontage.
 */
export function armerPoste(actif: boolean, jouer: () => void): () => void {
  if (!actif) return () => undefined;
  const minuteur = setTimeout(jouer, PAS_POSTE_MS);
  return () => clearTimeout(minuteur);
}

const rien = (): void => undefined;

/**
 * Fenêtre du poste de surveillance en direct (lot 4, variante A) : plein cadre et verte comme la carte. En-tête SURVEILLANCE et
 * ● DIRECT, le plan de la station avec ses caméras, la ligne des changements, puis QUITTER, qui la ferme
 * et arrête l'horloge (D-359). Échap la ferme aussi. Une pièce n'y ouvre pas de fiche : la carte reste là pour ça.
 */
export function FenetrePoste({
  carte,
  cameras,
  ligne,
  quitter,
  textes,
}: {
  readonly carte: CartePublique;
  readonly cameras: NonNullable<Observation['cameras']>;
  readonly ligne: readonly PhrasePoste[];
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
        <p className="poste-ligne" aria-live="polite">
          {ligne.map(({ texte, alerte }, index) => (
            <span key={index} className={alerte ? 'alerte' : undefined}>
              {texte}{' '}
            </span>
          ))}
        </p>
        <div className="poste-actions">
          <button type="button" className="secondaire" onClick={quitter} data-son="clic">
            {MOTS.quitter}
          </button>
        </div>
      </div>
    </section>
  );
}
