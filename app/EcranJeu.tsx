import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { observer, type OptionMenu } from '../engine';
import { libelleOption, nomDe, remplir, rendreObservation, type TextesMonde } from '../content';
import { composerDock, nomDestination, nomPuce, REGARDER_AUTOUR, type Dock, type Groupe } from './ecran';
import type { Environnement, Jeu } from './jeu';

type Jouer = (option: OptionMenu) => void;

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
  const [deplie, setDeplie] = useState<string | null>(null);
  const [inventaireOuvert, setInventaireOuvert] = useState(false);
  const idInventaire = useId();
  const boutonInventaire = useRef<HTMLButtonElement>(null);

  const jouer: Jouer = (option) => {
    setDeplie(null);
    setInventaireOuvert(false);
    void choisir(jeu, option);
  };
  const basculer = (id: string): void => setDeplie((actuel) => (actuel === id ? null : id));
  const fermerInventaire = (): void => {
    setDeplie(null);
    setInventaireOuvert(false);
    boutonInventaire.current?.focus();
  };

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
      <Recit jeu={jeu} />
      {/* Situation en phrases : hors de l'écran, gardée pour le lecteur d'écran comme dans la CLI (C-06 K-07). */}
      <section className="lecteur-seul" data-testid="situation">
        {rendreObservation(textes, observation).map((ligne, index) => (
          <p key={index}>{ligne}</p>
        ))}
      </section>
      <DockPiece dock={dock} textes={textes} occupe={occupe} deplie={inventaireOuvert ? null : deplie} basculer={basculer} jouer={jouer} />
      {/* Toucher en dehors de la bulle la referme sans effet (12 §3.5). */}
      {inventaireOuvert && <div className="voile" data-testid="voile" onClick={fermerInventaire} />}
      <div className="bas">
        {inventaireOuvert && (
          <BulleInventaire
            id={idInventaire}
            groupes={dock.inventaire}
            textes={textes}
            occupe={occupe}
            deplie={deplie}
            basculer={basculer}
            jouer={jouer}
            fermer={fermerInventaire}
          />
        )}
        <nav className="navigation" aria-label="Navigation">
          <button
            ref={boutonInventaire}
            type="button"
            aria-expanded={inventaireOuvert}
            aria-controls={inventaireOuvert ? idInventaire : undefined}
            onClick={() => {
              setDeplie(null);
              setInventaireOuvert((ouvert) => !ouvert);
            }}
          >
            Inventaire
          </button>
        </nav>
      </div>
    </main>
  );
}

/** Inventaire (D-154) : bulle cyan (D-176) posée au-dessus du bouton INVENTAIRE, par-dessus l'écran. */
export function BulleInventaire({
  id,
  groupes,
  fermer,
  ...props
}: PropsPuces & { readonly id: string; readonly groupes: readonly Groupe[]; readonly fermer: () => void }) {
  const bulle = useRef<HTMLElement>(null);
  const fermerActuel = useRef(fermer);
  useEffect(() => {
    fermerActuel.current = fermer;
  });
  // À l'ouverture seulement : le focus entre dans la bulle, Échap la referme.
  useEffect(() => {
    bulle.current?.focus();
    const touche = (evenement: KeyboardEvent): void => {
      if (evenement.key === 'Escape') fermerActuel.current();
    };
    document.addEventListener('keydown', touche);
    return () => document.removeEventListener('keydown', touche);
  }, []);
  return (
    <section ref={bulle} id={id} className="bulle bulle-inventaire" role="dialog" aria-label="Inventaire" tabIndex={-1}>
      <h2 className="titre-section">Inventaire</h2>
      <div className="bulle-corps">
        {groupes.length === 0 ? (
          <p className="vide">{remplir(props.textes.observation.inventaireVide, {})}</p>
        ) : (
          <Puces groupes={groupes} {...props} />
        )}
      </div>
    </section>
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

function Recit({ jeu }: { readonly jeu: Jeu }) {
  const { rappel } = jeu;
  return (
    <section className="recit" data-testid="recit" aria-live="polite">
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

interface PropsPuces {
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  readonly deplie: string | null;
  readonly basculer: (id: string) => void;
  readonly jouer: Jouer;
}

/** Dock (12 §3.4) : puces des objets et passages de la pièce, puis un bouton par passage connu. */
export function DockPiece({ dock, ...props }: PropsPuces & { readonly dock: Dock }) {
  const autour = dock.autour;
  return (
    <section className="dock">
      <h2 className="titre-section">Dans la pièce</h2>
      <Puces groupes={dock.piece} {...props} />
      {autour !== undefined && (
        <button type="button" className="puce autour" disabled={props.occupe} onClick={() => props.jouer(autour)}>
          <span aria-hidden="true">▸ </span>
          {REGARDER_AUTOUR}
        </button>
      )}
      {dock.deplacements.length > 0 && (
        <>
          <h2 className="titre-section">Se déplacer vers</h2>
          <ul className="deplacements">
            {dock.deplacements.map((option) => (
              <Deplacement key={option.cible.id} option={option} textes={props.textes} occupe={props.occupe} jouer={props.jouer} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Puces({ groupes, textes, occupe, deplie, basculer, jouer }: PropsPuces & { readonly groupes: readonly Groupe[] }) {
  const idOptions = useId();
  const ouvert = groupes.findIndex((groupe) => groupe.cible.id === deplie);
  const groupeOuvert = groupes[ouvert];
  const items: ReactNode[] = [];
  groupes.forEach((groupe, index) => {
    items.push(
      <li key={groupe.cible.id}>
        <button
          type="button"
          className="puce"
          aria-expanded={index === ouvert}
          aria-controls={index === ouvert ? idOptions : undefined}
          onClick={() => basculer(groupe.cible.id)}
        >
          <span aria-hidden="true">▸ </span>
          {nomPuce(textes, groupe.cible)}
        </button>
      </li>,
    );
    // En attendant les bulles (Interface 2), les options se déplient sous la rangée de la puce touchée.
    const finDeRangee = index % 2 === 1 || index === groupes.length - 1;
    if (finDeRangee && groupeOuvert !== undefined && Math.floor(ouvert / 2) === Math.floor(index / 2)) {
      items.push(
        <li key="options" className="pleine-largeur">
          <Options id={idOptions} groupe={groupeOuvert} textes={textes} occupe={occupe} jouer={jouer} />
        </li>,
      );
    }
  });
  return <ul className="puces">{items}</ul>;
}

function Options({
  id,
  groupe,
  textes,
  occupe,
  jouer,
}: {
  readonly id: string;
  readonly groupe: Groupe;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  readonly jouer: Jouer;
}) {
  return (
    <div id={id} className="options" role="group" aria-label={nomPuce(textes, groupe.cible)}>
      {groupe.options.map((option) => {
        const { raison } = libelleOption(textes, option);
        return (
          <div key={option.action} className="option">
            <button type="button" disabled={occupe || !option.disponible} onClick={() => jouer(option)}>
              <span aria-hidden="true">▸ </span>
              {textes.verbes[option.action]}
            </button>
            {raison !== null && <p className="raison">{raison}</p>}
          </div>
        );
      })}
    </div>
  );
}

function Deplacement({ option, textes, occupe, jouer }: { readonly option: OptionMenu; readonly textes: TextesMonde; readonly occupe: boolean; readonly jouer: Jouer }) {
  const idRaison = useId();
  const { raison } = libelleOption(textes, option);
  return (
    <li>
      <button
        type="button"
        className="deplacement"
        disabled={occupe || !option.disponible}
        aria-describedby={raison === null ? undefined : idRaison}
        onClick={() => jouer(option)}
      >
        <span aria-hidden="true">→ </span>
        {nomDestination(textes, option)}
      </button>
      {raison !== null && (
        <p id={idRaison} className="raison">
          {raison}
        </p>
      )}
    </li>
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
