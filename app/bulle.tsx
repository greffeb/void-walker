import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { placerBulle } from './ecran';
import type { Geste } from './son/recettes';

// Bulles (12 §3.5, §3.6) : dialogue nommé, focus piégé, Échap qui referme ; partagées par l'écran de jeu et la carte.

/** Le focus reste dans la bulle ou la fenêtre ; Échap la referme. */
export function garderFocus(evenement: KeyboardEvent<HTMLElement>, fermer: () => void): void {
  if (evenement.key === 'Escape') {
    evenement.preventDefault();
    fermer();
    return;
  }
  if (evenement.key !== 'Tab') return;
  const boutons = [...evenement.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')];
  const premier = boutons[0];
  const dernier = boutons[boutons.length - 1];
  if (premier === undefined || dernier === undefined) return;
  const actif = document.activeElement;
  if (evenement.shiftKey ? actif === premier || actif === evenement.currentTarget : actif === dernier) {
    evenement.preventDefault();
    (evenement.shiftKey ? dernier : premier).focus();
  }
}

/**
 * Bulle (12 §3.5) : dialogue nommé par son fil, « ‹ » à partir de la deuxième étape, « ✕ ».
 * Le focus y entre à chaque étape et n'en sort pas ; Échap la referme.
 */
export function Bulle({
  id,
  zone,
  classe,
  titre,
  decrite,
  etape,
  retour,
  fermer,
  pied,
  sonFermer = 'fermer',
  children,
}: {
  readonly id?: string;
  readonly zone: RefObject<HTMLElement | null>;
  readonly classe: string;
  readonly titre: ReactNode;
  /** Fiche lue par le lecteur d'écran à l'ouverture, après le titre. */
  readonly decrite?: string;
  /** Change à chaque étape : le focus revient sur la bulle. */
  readonly etape: string;
  readonly retour?: () => void;
  readonly fermer: () => void;
  /** Toujours visible sous le contenu qui défile : ANNULER et CONFIRMER restent sous le pouce. */
  readonly pied?: ReactNode;
  /** Son de ✕ et d'Échap : le tic des bulles, ou le bip plus grave d'un menu (D-226). */
  readonly sonFermer?: Geste;
  readonly children: ReactNode;
}) {
  const idTitre = useId();
  useEffect(() => {
    zone.current?.focus();
  }, [zone, etape]);
  return (
    <section
      ref={zone}
      id={id}
      className={`bulle ${classe}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      aria-describedby={decrite}
      tabIndex={-1}
      data-son-fermer={sonFermer}
      onKeyDown={(evenement) => garderFocus(evenement, fermer)}
    >
      <div className="bulle-entete">
        {retour !== undefined && (
          <button type="button" className="bulle-icone" aria-label="Étape précédente" onClick={retour} data-son="clic">
            <span aria-hidden="true">‹</span>
          </button>
        )}
        <h2 id={idTitre} className="bulle-titre">
          {titre}
        </h2>
        <button type="button" className="bulle-icone" aria-label="Fermer" onClick={fermer} data-son={sonFermer}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="bulle-corps">{children}</div>
      {pied !== undefined && <div className="bulle-pied">{pied}</div>}
    </section>
  );
}

/** Bulle ancrée sur l'élément touché : dessus si elle y tient, sinon dessous, jamais hors de l'écran (12 §3.5, §3.6). */
export function BulleAncree({
  ancre,
  etape,
  classe = 'bulle-objet',
  ...props
}: Omit<Parameters<typeof Bulle>[0], 'zone' | 'classe'> & { readonly ancre: HTMLElement; readonly classe?: string }) {
  const zone = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const bulle = zone.current;
    if (bulle === null) return;
    const placer = (): void => {
      const puce = ancre.getBoundingClientRect();
      const boite = bulle.getBoundingClientRect();
      const hauteur = [...bulle.children].reduce((somme, enfant) => somme + enfant.scrollHeight, boite.height - bulle.clientHeight);
      const place = placerBulle(
        { haut: puce.top, bas: puce.bottom, centre: puce.left + puce.width / 2 },
        { gauche: boite.left, largeur: boite.width, hauteur },
        window.innerHeight,
      );
      bulle.dataset.cote = place.cote;
      bulle.style.top = place.cote === 'dessous' ? `${place.bord}px` : '';
      bulle.style.bottom = place.cote === 'dessus' ? `${place.bord}px` : '';
      bulle.style.maxHeight = `${place.hauteurMax}px`;
      bulle.style.setProperty('--fleche', `${place.fleche}px`);
    };
    placer();
    window.addEventListener('resize', placer);
    return () => window.removeEventListener('resize', placer);
  }, [ancre, etape]);
  return <Bulle zone={zone} classe={classe} etape={etape} {...props} />;
}
