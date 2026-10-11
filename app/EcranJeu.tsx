import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { observer, type OptionMenu } from '../engine';
import { libelleOption, nomDe, remplir, rendreObservation, type TextesMonde } from '../content';
import { composer, composerDock, nomDestination, nomPuce, placerBulle, REGARDER_AUTOUR, type Dock, type Groupe } from './ecran';
import { consulter, type Environnement, type Jeu } from './jeu';

type Jouer = (option: OptionMenu) => void;
/** Texte de la fiche d'une cible : sa consultation, gratuite (D-014). */
type Lire = (option: OptionMenu) => readonly string[];

/** Bulle ouverte : celle d'une puce de la pièce, ou l'inventaire (liste, puis fiche d'un objet porté). */
type Ouverte =
  | { readonly zone: 'piece'; readonly cible: string; readonly ancre: HTMLElement }
  | { readonly zone: 'inventaire'; readonly cible: string | null };

/** Marque l'entrée d'historique posée à l'ouverture d'une bulle : le retour système la referme (12 §3.5). */
const ENTREE_BULLE = 'void-walker:bulle';

function quitterEntreeBulle(): void {
  const etat: unknown = window.history.state;
  if (typeof etat === 'object' && etat !== null && ENTREE_BULLE in etat) window.history.back();
}

/** Écran de jeu (12 §3.1), lu dans cet ordre : en-tête de pièce, récit, dock, navigation (12 §7). */
export function EcranJeu({
  jeu,
  env,
  occupe,
  choisir,
  ouvrirOptions,
}: {
  readonly jeu: Jeu;
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  readonly occupe: boolean;
  readonly choisir: (jeu: Jeu, option: OptionMenu) => Promise<void>;
  /** Absent tant que l'écran d'options n'existe pas : l'engrenage reste masqué. */
  readonly ouvrirOptions?: () => void;
}) {
  const { textes } = env;
  const observation = observer(env.monde, jeu.partie.etat);
  const dock = composerDock(observation);
  const [ouverte, setOuverte] = useState<Ouverte | null>(null);
  const idInventaire = useId();
  const recit = useRef<HTMLElement>(null);
  /** Élément touché pour ouvrir la bulle en cours ; `null` si aucune n'est ouverte. */
  const origine = useRef<HTMLElement | null>(null);
  /** Après une action lancée depuis une bulle : où rendre le focus une fois le résultat affiché. */
  const aRendre = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const surRetour = (): void => {
      const depuis = origine.current;
      if (depuis === null) return;
      origine.current = null;
      setOuverte(null);
      depuis.focus();
    };
    window.addEventListener('popstate', surRetour);
    return () => window.removeEventListener('popstate', surRetour);
  }, []);

  useEffect(() => {
    const depuis = aRendre.current;
    if (depuis === null) return;
    aRendre.current = null;
    (depuis.isConnected ? depuis : recit.current)?.focus();
  }, [jeu]);

  const ouvrir = (suivante: Ouverte, depuis: HTMLElement): void => {
    if (origine.current === null) window.history.pushState({ [ENTREE_BULLE]: true }, '');
    origine.current = depuis;
    setOuverte(suivante);
  };
  /** Fermer sans effet : ✕, voile, Échap ou retour système ; le focus revient à l'élément d'origine (12 §7). */
  const fermer = (): void => {
    const depuis = origine.current;
    if (depuis === null) return;
    origine.current = null;
    setOuverte(null);
    quitterEntreeBulle();
    depuis.focus();
  };
  // Engagement provisoire (#93) : la dernière étape joue l'action, en attendant l'aperçu (Interface 3).
  const jouer: Jouer = (option) => {
    aRendre.current = origine.current;
    if (origine.current !== null) {
      origine.current = null;
      setOuverte(null);
      quitterEntreeBulle();
    }
    void choisir(jeu, option);
  };
  const lire: Lire = (option) => consulter(env, jeu.partie, option);

  const groupeOuvert = ouverte?.zone === 'piece' ? dock.piece.find((groupe) => groupe.cible.id === ouverte.cible) : undefined;
  return (
    <main className="jeu">
      <header className="entete-piece">
        <h1 className="titre-piece">{nomDe(textes, observation.piece).texte}</h1>
        {ouvrirOptions !== undefined && (
          <button type="button" className="engrenage" aria-label="Options" onClick={ouvrirOptions}>
            <Engrenage />
          </button>
        )}
      </header>
      <Sauvegarde jeu={jeu} />
      <Recit jeu={jeu} zone={recit} />
      {/* Situation en phrases : hors de l'écran, gardée pour le lecteur d'écran comme dans la CLI (C-06 K-07). */}
      <section className="lecteur-seul" data-testid="situation">
        {rendreObservation(textes, observation).map((ligne, index) => (
          <p key={index}>{ligne}</p>
        ))}
      </section>
      <DockPiece
        dock={dock}
        textes={textes}
        occupe={occupe}
        ouverte={ouverte?.zone === 'piece' ? ouverte.cible : null}
        ouvrir={(groupe, ancre) => ouvrir({ zone: 'piece', cible: groupe.cible.id, ancre }, ancre)}
        jouer={jouer}
      />
      {/* Toucher en dehors de la bulle la referme sans effet (12 §3.5). */}
      {ouverte !== null && <div className={ouverte.zone === 'piece' ? 'voile voile-haut' : 'voile'} data-testid="voile" onClick={fermer} />}
      {ouverte?.zone === 'piece' && groupeOuvert !== undefined && (
        <BulleObjet ancre={ouverte.ancre} groupe={groupeOuvert} textes={textes} occupe={occupe} jouer={jouer} lire={lire} fermer={fermer} />
      )}
      <div className="bas">
        {ouverte?.zone === 'inventaire' && (
          <BulleInventaire
            id={idInventaire}
            groupes={dock.inventaire}
            cible={ouverte.cible}
            choisir={(cible) => setOuverte({ zone: 'inventaire', cible })}
            textes={textes}
            occupe={occupe}
            jouer={jouer}
            lire={lire}
            fermer={fermer}
          />
        )}
        <nav className="navigation" aria-label="Navigation">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={ouverte?.zone === 'inventaire'}
            aria-controls={ouverte?.zone === 'inventaire' ? idInventaire : undefined}
            onClick={(evenement) => (ouverte?.zone === 'inventaire' ? fermer() : ouvrir({ zone: 'inventaire', cible: null }, evenement.currentTarget))}
          >
            Inventaire
          </button>
        </nav>
      </div>
    </main>
  );
}

interface PropsComposition {
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  readonly jouer: Jouer;
  readonly lire: Lire;
  readonly fermer: () => void;
}

/**
 * Bulle (12 §3.5) : dialogue nommé par son fil, « ‹ » à partir de la deuxième étape, « ✕ ».
 * Le focus y entre à chaque étape et n'en sort pas ; Échap la referme.
 */
function Bulle({
  id,
  zone,
  classe,
  titre,
  decrite,
  etape,
  retour,
  fermer,
  children,
}: {
  readonly id?: string;
  readonly zone: RefObject<HTMLElement | null>;
  readonly classe: string;
  readonly titre: string;
  /** Fiche lue par le lecteur d'écran à l'ouverture, après le titre. */
  readonly decrite?: string;
  /** Change à chaque étape : le focus revient sur la bulle. */
  readonly etape: string;
  readonly retour?: () => void;
  readonly fermer: () => void;
  readonly children: ReactNode;
}) {
  const idTitre = useId();
  useEffect(() => {
    zone.current?.focus();
  }, [zone, etape]);
  const pieger = (evenement: KeyboardEvent<HTMLElement>): void => {
    if (evenement.key === 'Escape') {
      evenement.preventDefault();
      fermer();
      return;
    }
    if (evenement.key !== 'Tab') return;
    const boutons = [...evenement.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled)')];
    const premier = boutons[0];
    const dernier = boutons[boutons.length - 1];
    if (premier === undefined || dernier === undefined) return;
    const actif = document.activeElement;
    if (evenement.shiftKey ? actif === premier || actif === evenement.currentTarget : actif === dernier) {
      evenement.preventDefault();
      (evenement.shiftKey ? dernier : premier).focus();
    }
  };
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
      onKeyDown={pieger}
    >
      <div className="bulle-entete">
        {retour !== undefined && (
          <button type="button" className="bulle-icone" aria-label="Étape précédente" onClick={retour}>
            <span aria-hidden="true">‹</span>
          </button>
        )}
        <h2 id={idTitre} className="bulle-titre">
          {titre}
        </h2>
        <button type="button" className="bulle-icone" aria-label="Fermer" onClick={fermer}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="bulle-corps">{children}</div>
    </section>
  );
}

/** Bulle d'une puce de la pièce, ancrée sur elle : dessus si elle y tient, sinon dessous, jamais hors de l'écran (12 §3.5, §3.6). */
export function BulleObjet({ ancre, groupe, ...props }: PropsComposition & { readonly ancre: HTMLElement; readonly groupe: Groupe }) {
  const zone = useRef<HTMLElement>(null);
  const idFiche = useId();
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
  }, [ancre]);
  return (
    <Bulle zone={zone} classe="bulle-objet" titre={nomPuce(props.textes, groupe.cible)} decrite={idFiche} etape={groupe.cible.id} fermer={props.fermer}>
      <Composer groupe={groupe} idFiche={idFiche} {...props} />
    </Bulle>
  );
}

/** Inventaire (D-154) : bulle cyan (D-176) au-dessus du bouton INVENTAIRE ; toucher un objet ouvre la même composition qu'en pièce. */
export function BulleInventaire({
  id,
  groupes,
  cible,
  choisir,
  ...props
}: PropsComposition & {
  readonly id: string;
  readonly groupes: readonly Groupe[];
  /** Objet porté dont la fiche est ouverte ; `null` pour la liste. */
  readonly cible: string | null;
  readonly choisir: (cible: string | null) => void;
}) {
  const zone = useRef<HTMLElement>(null);
  const idFiche = useId();
  const groupe = groupes.find((porte) => porte.cible.id === cible);
  if (groupe !== undefined) {
    return (
      <Bulle
        id={id}
        zone={zone}
        classe="bulle-inventaire"
        titre={nomPuce(props.textes, groupe.cible)}
        decrite={idFiche}
        etape={groupe.cible.id}
        retour={() => choisir(null)}
        fermer={props.fermer}
      >
        <Composer groupe={groupe} idFiche={idFiche} {...props} />
      </Bulle>
    );
  }
  return (
    <Bulle id={id} zone={zone} classe="bulle-inventaire" titre="Inventaire" etape="" fermer={props.fermer}>
      {groupes.length === 0 ? (
        <p className="vide">{remplir(props.textes.observation.inventaireVide, {})}</p>
      ) : (
        <ul className="puces">
          {groupes.map((porte) => (
            <li key={porte.cible.id}>
              <button type="button" className="puce" onClick={() => choisir(porte.cible.id)}>
                <span aria-hidden="true">▸ </span>
                {nomPuce(props.textes, porte.cible)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Bulle>
  );
}

/** Première étape (12 §3.5) : la fiche, gratuite, puis une ligne par action ; une action sans paramètre se joue aussitôt. */
function Composer({
  groupe,
  idFiche,
  textes,
  occupe,
  jouer,
  lire,
}: Omit<PropsComposition, 'fermer'> & { readonly groupe: Groupe; readonly idFiche: string }) {
  const { fiche, actions } = composer(groupe);
  return (
    <>
      {fiche !== undefined && (
        <div id={idFiche} className="fiche">
          {lire(fiche).map((phrase, index) => (
            <p key={index}>{phrase}</p>
          ))}
        </div>
      )}
      {actions.length > 0 && (
        <ul className="lignes">
          {actions.map((option) => {
            const { raison } = libelleOption(textes, option);
            const verbe = textes.verbes[option.action];
            return (
              <li key={option.action}>
                {raison === null ? (
                  <button type="button" className="ligne" disabled={occupe} onClick={() => jouer(option)}>
                    <span aria-hidden="true">▸ </span>
                    {verbe}
                  </button>
                ) : (
                  <Indisponible classe="ligne" libelle={verbe} raison={raison} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Action indisponible (12 §3.7) : visible, « ⊘ », raison publique à droite, lue « Ouvrir, indisponible : … », jamais activable. */
function Indisponible({ classe, libelle, raison }: { readonly classe: string; readonly libelle: string; readonly raison: string }) {
  return (
    <button type="button" className={`${classe} indisponible`} aria-disabled="true" aria-label={`${libelle}, indisponible : ${raison}`}>
      <span className="libelle">
        <span aria-hidden="true">⊘ </span>
        {libelle}
      </span>
      <span className="raison">{raison}</span>
    </button>
  );
}

/** Réussite silencieuse ; échec visible tant qu'aucune écriture n'a réussi (C-09 §3). Attributs lus par les captures. */
function Sauvegarde({ jeu }: { readonly jeu: Jeu }) {
  const echec = jeu.sauvegarde === 'echec';
  return (
    <p
      className="avis-sauvegarde"
      data-testid="sauvegarde"
      data-actions={jeu.partie.etat.actions}
      data-etat={jeu.sauvegarde}
      role={echec ? 'alert' : undefined}
      hidden={!echec}
    >
      {echec && 'La sauvegarde a échoué. Vous pouvez continuer : elle sera retentée à la prochaine action.'}
    </p>
  );
}

/** `tabIndex` : le focus y revient quand la puce d'origine a disparu après l'action (objet pris). */
function Recit({ jeu, zone }: { readonly jeu: Jeu; readonly zone: RefObject<HTMLElement | null> }) {
  const { rappel } = jeu;
  return (
    <section ref={zone} className="recit" data-testid="recit" aria-live="polite" tabIndex={-1}>
      {rappel !== null && (
        <p className={rappel.capitales ? 'rappel capitales' : 'rappel'} data-testid="rappel">
          <span aria-hidden="true">&gt; </span>
          {rappel.texte}
        </p>
      )}
      {jeu.recit.map((phrase, index) => (
        <p key={index}>{phrase}</p>
      ))}
    </section>
  );
}

/** Dock (12 §3.4) : une puce par objet ou passage de la pièce, qui ouvre sa bulle, puis un bouton par passage connu. */
export function DockPiece({
  dock,
  textes,
  occupe,
  ouverte,
  ouvrir,
  jouer,
}: {
  readonly dock: Dock;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  /** Cible dont la bulle est ouverte : sa puce passe en vidéo inverse. */
  readonly ouverte: string | null;
  readonly ouvrir: (groupe: Groupe, ancre: HTMLElement) => void;
  readonly jouer: Jouer;
}) {
  const autour = dock.autour;
  return (
    <section className="dock">
      <h2 className="titre-section">Dans la pièce</h2>
      <ul className="puces">
        {dock.piece.map((groupe) => (
          <li key={groupe.cible.id}>
            <button
              type="button"
              className="puce"
              aria-haspopup="dialog"
              aria-expanded={groupe.cible.id === ouverte}
              onClick={(evenement) => ouvrir(groupe, evenement.currentTarget)}
            >
              <span aria-hidden="true">▸ </span>
              {nomPuce(textes, groupe.cible)}
            </button>
          </li>
        ))}
      </ul>
      {autour !== undefined && (
        <button type="button" className="puce autour" disabled={occupe} onClick={() => jouer(autour)}>
          <span aria-hidden="true">▸ </span>
          {REGARDER_AUTOUR}
        </button>
      )}
      {dock.deplacements.length > 0 && (
        <>
          <h2 className="titre-section">Se déplacer vers</h2>
          <ul className="deplacements">
            {dock.deplacements.map((option) => (
              <li key={option.cible.id}>
                <Deplacement option={option} textes={textes} occupe={occupe} jouer={jouer} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Deplacement({ option, textes, occupe, jouer }: { readonly option: OptionMenu; readonly textes: TextesMonde; readonly occupe: boolean; readonly jouer: Jouer }) {
  const { raison } = libelleOption(textes, option);
  const destination = nomDestination(textes, option);
  if (raison !== null) return <Indisponible classe="deplacement" libelle={destination} raison={raison} />;
  return (
    <button type="button" className="deplacement" disabled={occupe} onClick={() => jouer(option)}>
      <span aria-hidden="true">→ </span>
      {destination}
    </button>
  );
}

/** Engrenage au trait (12 §2.5). */
function Engrenage() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M18.95 10.14L21.88 10.44L21.88 13.56L18.95 13.86L18.24 15.6L20.09 17.88L17.88 20.09L15.6 18.24L13.86 18.95L13.56 21.88L10.44 21.88L10.14 18.95L8.4 18.24L6.12 20.09L3.91 17.88L5.76 15.6L5.05 13.86L2.12 13.56L2.12 10.44L5.05 10.14L5.76 8.4L3.91 6.12L6.12 3.91L8.4 5.76L10.14 5.05L10.44 2.12L13.56 2.12L13.86 5.05L15.6 5.76L17.88 3.91L20.09 6.12L18.24 8.4Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
