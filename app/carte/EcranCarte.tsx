import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CartePublique, PieceCarte } from '../../engine';
import { ficheDe, libellePlan, MOTS_CARTE, rendreListeCarte, type TextesMonde } from '../../content';
import { garderFocus } from '../bulle';
import { FicheCarte } from './FicheCarte';
import { ListeCarte } from './ListeCarte';
import { PlanCarte } from './PlanCarte';
import { borner, cadreConnu, vueInitiale, zoomMin, type Taille, type Vue } from './vue';

/** Fiche ouverte : la pièce, par identifiant public, et son bouton, qui reprend le focus à la fermeture (12 §7). */
interface FicheOuverte {
  readonly piece: string;
  readonly ancre: HTMLButtonElement;
}

interface Mesure {
  readonly taille: Taille;
  readonly casePx: number;
}

/** Zone du plan : mesure sa taille et la case à l'échelle du texte ; s'ouvre centrée sur la pièce actuelle (D-205). */
function ZonePlan({
  carte,
  textes,
  ouverte,
  toucher,
}: {
  readonly carte: CartePublique;
  readonly textes: TextesMonde;
  readonly ouverte: string | null;
  readonly toucher: (piece: PieceCarte, bouton: HTMLButtonElement) => void;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const etalon = useRef<HTMLDivElement>(null);
  const [mesure, setMesure] = useState<Mesure | null>(null);
  const [vue, setVue] = useState<Vue | null>(null);
  const cadre = cadreConnu(carte);
  useLayoutEffect(() => {
    const element = zone.current;
    const reference = etalon.current;
    if (element === null || reference === null) return;
    // La taille de la zone et l'échelle du texte se lisent à l'écran ; l'observateur les relit quand elles changent.
    const observateur = new ResizeObserver(() => {
      const boite = element.getBoundingClientRect();
      const casePx = reference.getBoundingClientRect().width;
      if (casePx > 0) setMesure({ taille: { largeur: boite.width, hauteur: boite.height }, casePx });
    });
    observateur.observe(element);
    observateur.observe(reference);
    return () => observateur.disconnect();
  }, []);
  const initiale = mesure === null ? null : vueInitiale(carte, mesure.taille, mesure.casePx);
  const affichee = vue ?? initiale;
  const minimum = cadre === null || mesure === null ? 1 : zoomMin(cadre, mesure.taille, mesure.casePx);
  const changerVue = (maj: (courante: Vue) => Vue): void => {
    if (cadre === null || mesure === null || initiale === null) return;
    setVue((courante) => borner(maj(courante ?? initiale), cadre, mesure.taille, mesure.casePx));
  };
  return (
    <div ref={zone} className="carte-zone" role="group" aria-label={libellePlan(textes, carte)}>
      <div ref={etalon} className="carte-etalon" aria-hidden="true" />
      {mesure !== null && affichee !== null && (
        <PlanCarte carte={carte} textes={textes} vue={affichee} casePx={mesure.casePx} zoomMin={minimum} changerVue={changerVue} toucher={toucher} ouverte={ouverte} />
      )}
    </div>
  );
}

/**
 * Carte (14 §2) : bulle verte posée au-dessus de la navigation, comme l'inventaire (D-215) ; plan ou liste ; l'ouvrir, la
 * parcourir et la fermer sont gratuits (D-014). ✕, CARTE, le voile, Échap ou le retour système la referment ; une fiche ouverte se
 * ferme d'abord.
 */
export function EcranCarte({ carte, textes, fermer }: { readonly carte: CartePublique; readonly textes: TextesMonde; readonly fermer: () => void }) {
  const avecPlan = carte.pieces.some((piece) => piece.rect !== null);
  const [mode, setMode] = useState<'plan' | 'liste'>(avecPlan ? 'plan' : 'liste');
  const [fiche, setFiche] = useState<FicheOuverte | null>(null);
  const zone = useRef<HTMLElement>(null);
  const idTitre = useId();
  useLayoutEffect(() => {
    zone.current?.focus();
  }, []);
  const fermerFiche = (): void => {
    const ancre = fiche?.ancre;
    setFiche(null);
    ancre?.focus();
  };
  const ouverte = fiche === null ? undefined : carte.pieces.find((piece) => piece.piece.id === fiche.piece);
  return (
    <section
      ref={zone}
      className="bulle carte"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      tabIndex={-1}
      onKeyDown={(evenement) => {
        // La fiche a traité la touche (Échap, Tab à ses bords) ; sinon une fiche ouverte se ferme avant la carte.
        if (evenement.defaultPrevented) return;
        if (fiche === null) {
          garderFocus(evenement, fermer);
        } else if (evenement.key === 'Escape') {
          evenement.preventDefault();
          fermerFiche();
        }
      }}
    >
      <header className="carte-entete">
        <h2 id={idTitre} className="carte-titre">
          {mode === 'plan' ? MOTS_CARTE.titrePlan : MOTS_CARTE.titreListe}
        </h2>
        {avecPlan && (
          <button
            type="button"
            className="carte-bascule"
            onClick={() => {
              setFiche(null);
              setMode(mode === 'plan' ? 'liste' : 'plan');
            }}
            data-son="clic"
          >
            {mode === 'plan' ? MOTS_CARTE.liste : MOTS_CARTE.plan}
          </button>
        )}
        <button type="button" className="bulle-icone" aria-label="Fermer" onClick={fermer} data-son="fermer">
          <span aria-hidden="true">✕</span>
        </button>
      </header>
      {mode === 'plan' ? (
        <ZonePlan carte={carte} textes={textes} ouverte={fiche?.piece ?? null} toucher={(piece, ancre) => setFiche({ piece: piece.piece.id, ancre })} />
      ) : (
        <ListeCarte blocs={rendreListeCarte(textes, carte)} />
      )}
      {fiche !== null && ouverte !== undefined && (
        <>
          <div className="voile carte-voile" data-testid="voile-carte" data-son="fermer" onClick={fermerFiche} />
          <FicheCarte fiche={ficheDe(textes, ouverte)} ancre={fiche.ancre} fermer={fermerFiche} />
        </>
      )}
    </section>
  );
}
