import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { CATALOGUE, observer, type IdAction, type OptionMenu, type Sante } from '../engine';
import { libelleOption, nomDe, remplir, rendreObservation, type ApercuTexte, type TextesMonde } from '../content';
import { composer, composerDock, filBulle, nomDestination, nomPuce, placerBulle, REGARDER_AUTOUR, unToucher, type Dock, type Groupe } from './ecran';
import { dejaEcrit, delaisEcriture, DUREE_ECRITURE_MS, marquerEcrit, numeroDe } from './ecriture';
import { consulter, prevoir, type Environnement, type Jeu } from './jeu';

type Jouer = (option: OptionMenu) => void;
/** Texte de la fiche d'une cible : sa consultation, gratuite (D-014). */
type Lire = (option: OptionMenu) => readonly string[];
type Prevoir = (option: OptionMenu) => ApercuTexte;
/** Vrai si l'option se joue d'un seul toucher, sans aperçu (D-182). */
type Direct = (option: OptionMenu) => boolean;

/** Suffixe du nom accessible d'un bouton qui joue l'action sans aperçu. */
const SANS_CONFIRMATION = ', sans confirmation';

/**
 * Bulle ouverte : une puce de la pièce, l'inventaire (liste, puis fiche d'un objet porté) ou un déplacement.
 * `action` : action choisie dont l'aperçu est affiché ; `null` à l'étape de la fiche.
 */
type Ouverte =
  | { readonly zone: 'piece'; readonly cible: string; readonly ancre: HTMLElement; readonly action: IdAction | null }
  | { readonly zone: 'inventaire'; readonly cible: string | null; readonly action: IdAction | null }
  | { readonly zone: 'deplacement'; readonly cible: string; readonly ancre: HTMLElement };

/** Marque l'entrée d'historique posée à l'ouverture d'une bulle : le retour système la referme (12 §3.5). */
const ENTREE_BULLE = 'void-walker:bulle';

/** Un double toucher ne joue qu'une action : le second ne doit pas jouer un bouton d'un seul toucher apparu dessous (D-182). */
const ANTI_DOUBLE_TOUCHER_MS = 500;

function quitterEntreeBulle(): void {
  const etat: unknown = window.history.state;
  if (typeof etat === 'object' && etat !== null && ENTREE_BULLE in etat) window.history.back();
}

/** Écran de jeu (12 §3.1), lu dans cet ordre : en-tête de pièce, récit, dock, navigation (12 §7). */
export function EcranJeu({
  jeu,
  env,
  machineAEcrire,
  occupe,
  choisir,
  ouvrirOptions,
  nouvellePartie,
}: {
  readonly jeu: Jeu;
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  /** Réglage « Effet machine à écrire » (D-186) ; le mouvement réduit du téléphone l'emporte, en CSS. */
  readonly machineAEcrire: boolean;
  readonly occupe: boolean;
  readonly choisir: (jeu: Jeu, option: OptionMenu) => Promise<void>;
  /** Absent tant que l'écran d'options n'existe pas : l'engrenage reste masqué. */
  readonly ouvrirOptions?: () => void;
  /** Après une défaite, seul geste possible en attendant l'écran de fin (12 §4.11). */
  readonly nouvellePartie?: () => void;
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
  /** Dernière action engagée ou dernier changement de bulle : ce qui a pu faire apparaître un autre bouton sous le doigt. */
  const dernierChangement = useRef(Number.NEGATIVE_INFINITY);
  /** Texte affiché en entier avant la fin de l'écriture : touché ou clavier pendant l'effet (D-186). */
  const [complet, setComplet] = useState<Jeu | null>(null);
  const ecrire = machineAEcrire && complet !== jeu && !dejaEcrit(jeu);
  const completer = (): void => {
    marquerEcrit(jeu);
    setComplet(jeu);
  };

  useEffect(() => {
    const fin = setTimeout(() => marquerEcrit(jeu), DUREE_ECRITURE_MS);
    return () => clearTimeout(fin);
  }, [jeu]);

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

  /** Ouvre une bulle ou change d'étape. */
  const montrer = (suivante: Ouverte): void => {
    dernierChangement.current = performance.now();
    setOuverte(suivante);
  };
  const ouvrir = (suivante: Ouverte, depuis: HTMLElement): void => {
    if (origine.current === null) window.history.pushState({ [ENTREE_BULLE]: true }, '');
    origine.current = depuis;
    montrer(suivante);
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
  const direct: Direct = (option) => unToucher(env.monde, jeu.partie, option);
  /** Un toucher d'un seul geste trop proche d'une action ou d'un changement de bulle est le second d'un double toucher : ignoré. */
  const tropTot = (option: OptionMenu): boolean => direct(option) && performance.now() - dernierChangement.current < ANTI_DOUBLE_TOUCHER_MS;
  // CONFIRMER engage l'action, ou un seul toucher quand rien n'est à craindre (D-182) ; « Regarder autour de vous » reste gratuit.
  const jouer: Jouer = (option) => {
    if (tropTot(option)) return;
    const depuis = origine.current;
    if (depuis !== null) {
      origine.current = null;
      setOuverte(null);
      quitterEntreeBulle();
    }
    // Après un déplacement, le même bouton mène ailleurs : le focus va au récit.
    aRendre.current = option.action === 'aller' ? recit.current : depuis;
    if (CATALOGUE[option.action].engage) dernierChangement.current = performance.now();
    void choisir(jeu, option);
  };
  const lire: Lire = (option) => consulter(env, jeu.partie, option);
  const voir: Prevoir = (option) => prevoir(env, jeu.partie, option);
  const toucherDeplacement = (option: OptionMenu, ancre: HTMLElement): void => {
    if (direct(option)) jouer(option);
    else ouvrir({ zone: 'deplacement', cible: option.cible.id, ancre }, ancre);
  };

  const groupeOuvert = ouverte?.zone === 'piece' ? dock.piece.find((groupe) => groupe.cible.id === ouverte.cible) : undefined;
  const deplacementOuvert =
    ouverte?.zone === 'deplacement' ? dock.deplacements.find((option) => option.cible.id === ouverte.cible && option.disponible) : undefined;
  return (
    // Pendant l'écriture, tout toucher agit normalement et affiche le texte en entier.
    <main className="jeu" onPointerDownCapture={completer} onKeyDownCapture={completer}>
      <header className="entete-piece">
        <h1 className="titre-piece">{nomDe(textes, observation.piece).texte}</h1>
        <BadgeSante sante={observation.sante} />
        {ouvrirOptions !== undefined && (
          <button type="button" className="engrenage" aria-label="Options" onClick={ouvrirOptions}>
            <Engrenage />
          </button>
        )}
      </header>
      <Sauvegarde jeu={jeu} />
      <Recit jeu={jeu} zone={recit} ecrire={ecrire} fixe={!machineAEcrire} />
      {/* Situation en phrases : hors de l'écran, gardée pour le lecteur d'écran comme dans la CLI (C-06 K-07). */}
      <section className="lecteur-seul" data-testid="situation">
        {rendreObservation(textes, observation).map((ligne, index) => (
          <p key={index}>{ligne}</p>
        ))}
      </section>
      {observation.terminee ? (
        <section className="dock fin-partie">
          {/* Déjà lue dans la situation, en tête de page pour le lecteur d'écran. */}
          <p aria-hidden="true">{remplir(textes.observation.terminee, {})}</p>
          {nouvellePartie !== undefined && (
            <button type="button" className="principal" disabled={occupe} onClick={nouvellePartie}>
              Nouvelle partie
            </button>
          )}
        </section>
      ) : (
        <DockPiece
          dock={dock}
          textes={textes}
          occupe={occupe}
          puceOuverte={ouverte?.zone === 'piece' ? ouverte.cible : null}
          deplacementOuvert={ouverte?.zone === 'deplacement' ? ouverte.cible : null}
          ouvrir={(groupe, ancre) => ouvrir({ zone: 'piece', cible: groupe.cible.id, ancre, action: null }, ancre)}
          ouvrirDeplacement={toucherDeplacement}
          direct={direct}
          jouer={jouer}
        />
      )}
      {/* Toucher en dehors de la bulle la referme sans effet (12 §3.5). */}
      {ouverte !== null && <div className={ouverte.zone === 'inventaire' ? 'voile' : 'voile voile-haut'} data-testid="voile" onClick={fermer} />}
      {ouverte?.zone === 'piece' && groupeOuvert !== undefined && (
        <BulleObjet
          ancre={ouverte.ancre}
          groupe={groupeOuvert}
          action={ouverte.action}
          choisirAction={(action) => montrer({ ...ouverte, action })}
          textes={textes}
          occupe={occupe}
          jouer={jouer}
          lire={lire}
          prevoir={voir}
          direct={direct}
          fermer={fermer}
        />
      )}
      {ouverte?.zone === 'deplacement' && deplacementOuvert !== undefined && (
        <BulleDeplacement ancre={ouverte.ancre} option={deplacementOuvert} textes={textes} occupe={occupe} jouer={jouer} prevoir={voir} fermer={fermer} />
      )}
      <div className="bas">
        {ouverte?.zone === 'inventaire' && (
          <BulleInventaire
            id={idInventaire}
            groupes={dock.inventaire}
            cible={ouverte.cible}
            choisir={(cible) => montrer({ zone: 'inventaire', cible, action: null })}
            action={ouverte.action}
            choisirAction={(action) => montrer({ ...ouverte, action })}
            textes={textes}
            occupe={occupe}
            jouer={jouer}
            lire={lire}
            prevoir={voir}
            direct={direct}
            fermer={fermer}
          />
        )}
        <nav className="navigation" aria-label="Navigation" hidden={observation.terminee}>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={ouverte?.zone === 'inventaire'}
            aria-controls={ouverte?.zone === 'inventaire' ? idInventaire : undefined}
            disabled={occupe}
            onClick={(evenement) =>
              ouverte?.zone === 'inventaire' ? fermer() : ouvrir({ zone: 'inventaire', cible: null, action: null }, evenement.currentTarget)
            }
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
  /** Joue l'action : CONFIRMER, ou la ligne elle-même si elle se joue d'un seul toucher. */
  readonly jouer: Jouer;
  readonly lire: Lire;
  readonly prevoir: Prevoir;
  readonly direct: Direct;
  readonly fermer: () => void;
  /** Action dont l'aperçu est affiché ; `null` à l'étape de la fiche. */
  readonly action: IdAction | null;
  readonly choisirAction: (action: IdAction | null) => void;
}

/** Action choisie, encore jouable ; sinon la bulle revient à la fiche. */
function choisie(groupe: Groupe, action: IdAction | null): OptionMenu | undefined {
  return composer(groupe).actions.find((option) => option.action === action && option.disponible);
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
  pied,
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
  /** Toujours visible sous le contenu qui défile : ANNULER et CONFIRMER restent sous le pouce. */
  readonly pied?: ReactNode;
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
      {pied !== undefined && <div className="bulle-pied">{pied}</div>}
    </section>
  );
}

/** Bulle ancrée sur l'élément touché : dessus si elle y tient, sinon dessous, jamais hors de l'écran (12 §3.5, §3.6). */
function BulleAncree({ ancre, etape, ...props }: Omit<Parameters<typeof Bulle>[0], 'zone' | 'classe'> & { readonly ancre: HTMLElement }) {
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
  return <Bulle zone={zone} classe="bulle-objet" etape={etape} {...props} />;
}

/** Bulle d'une puce de la pièce : fiche et actions, puis aperçu de l'action choisie. */
export function BulleObjet({ ancre, groupe, ...props }: PropsComposition & { readonly ancre: HTMLElement; readonly groupe: Groupe }) {
  const idDescription = useId();
  const option = choisie(groupe, props.action);
  return (
    <BulleAncree
      ancre={ancre}
      titre={filBulle(props.textes, groupe.cible, option)}
      decrite={idDescription}
      etape={`${groupe.cible.id}:${option?.action ?? ''}`}
      retour={option === undefined ? undefined : () => props.choisirAction(null)}
      fermer={props.fermer}
      pied={option === undefined ? undefined : <Confirmation occupe={props.occupe} confirmer={() => props.jouer(option)} annuler={props.fermer} />}
    >
      <Composer groupe={groupe} option={option} idDescription={idDescription} {...props} />
    </BulleAncree>
  );
}

/** Déplacement (12 §4.3) : aperçu ancré sur le bouton, puis CONFIRMER. */
export function BulleDeplacement({
  ancre,
  option,
  textes,
  occupe,
  jouer,
  prevoir: voir,
  fermer,
}: Pick<PropsComposition, 'textes' | 'occupe' | 'jouer' | 'prevoir' | 'fermer'> & { readonly ancre: HTMLElement; readonly option: OptionMenu }) {
  const idDescription = useId();
  return (
    <BulleAncree
      ancre={ancre}
      titre={filBulle(textes, option.cible, option)}
      decrite={idDescription}
      etape={option.cible.id}
      fermer={fermer}
      pied={<Confirmation occupe={occupe} confirmer={() => jouer(option)} annuler={fermer} />}
    >
      <ApercuAction apercu={voir(option)} idDescription={idDescription} />
    </BulleAncree>
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
  const idDescription = useId();
  const groupe = groupes.find((porte) => porte.cible.id === cible);
  if (groupe !== undefined) {
    const option = choisie(groupe, props.action);
    return (
      <Bulle
        id={id}
        zone={zone}
        classe="bulle-inventaire"
        titre={filBulle(props.textes, groupe.cible, option)}
        decrite={idDescription}
        etape={`${groupe.cible.id}:${option?.action ?? ''}`}
        retour={option === undefined ? () => choisir(null) : () => props.choisirAction(null)}
        fermer={props.fermer}
        pied={option === undefined ? undefined : <Confirmation occupe={props.occupe} confirmer={() => props.jouer(option)} annuler={props.fermer} />}
      >
        <Composer groupe={groupe} option={option} idDescription={idDescription} {...props} />
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

/** Étapes de la bulle (12 §3.5) : la fiche, gratuite, et une ligne par action ; puis l'aperçu de l'action choisie, sauf action d'un seul toucher. */
function Composer({
  groupe,
  option,
  idDescription,
  textes,
  occupe,
  jouer,
  lire,
  prevoir: voir,
  direct,
  choisirAction,
}: PropsComposition & { readonly groupe: Groupe; readonly option: OptionMenu | undefined; readonly idDescription: string }) {
  if (option !== undefined) return <ApercuAction apercu={voir(option)} idDescription={idDescription} />;
  const { fiche, actions } = composer(groupe);
  return (
    <>
      {fiche !== undefined && (
        <div id={idDescription} className="fiche">
          {lire(fiche).map((phrase, index) => (
            <p key={index}>{phrase}</p>
          ))}
        </div>
      )}
      {actions.length > 0 && (
        <ul className="lignes">
          {actions.map((action) => {
            const { raison } = libelleOption(textes, action);
            const verbe = textes.verbes[action.action];
            return (
              <li key={action.action}>
                {raison !== null ? (
                  <Indisponible classe="ligne" libelle={verbe} raison={raison} />
                ) : direct(action) ? (
                  <button type="button" className="ligne" aria-label={`${verbe}${SANS_CONFIRMATION}`} disabled={occupe} onClick={() => jouer(action)}>
                    <span aria-hidden="true">▸ </span>
                    {verbe}
                  </button>
                ) : (
                  <button type="button" className="ligne" onClick={() => choisirAction(action.action)}>
                    <span aria-hidden="true">▸ </span>
                    {verbe}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/** Aperçu (12 §3.8) : RISQUE (niveau, puis le danger connu), COÛT, SAVOIR. Aucun chiffre. */
function ApercuAction({ apercu, idDescription }: { readonly apercu: ApercuTexte; readonly idDescription: string }) {
  return (
    <dl id={idDescription} className="apercu">
      <dt>Risque</dt>
      <dd>
        <strong>{apercu.risque}</strong>
        {apercu.danger === null ? null : ` — ${apercu.danger}`}
      </dd>
      <dt>Coût</dt>
      <dd>{apercu.cout}</dd>
      <dt>Savoir</dt>
      <dd>
        {apercu.savoir.map((phrase, index) => (
          <p key={index}>{phrase}</p>
        ))}
      </dd>
    </dl>
  );
}

/** ANNULER (un tiers) referme sans effet ; CONFIRMER (deux tiers) engage l'action prévue (12 §3.5). */
function Confirmation({ occupe, confirmer, annuler }: { readonly occupe: boolean; readonly confirmer: () => void; readonly annuler: () => void }) {
  return (
    <div className="confirmation">
      <button type="button" className="secondaire" onClick={annuler}>
        Annuler
      </button>
      <button type="button" className="principal" disabled={occupe} onClick={confirmer}>
        Confirmer
      </button>
    </div>
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

/** Badge de santé (12 §3.2) : rien quand il est indemne ; la défaite n'a pas de badge. */
function BadgeSante({ sante }: { readonly sante: Sante }) {
  if (sante !== 'blesse' && sante !== 'critique') return null;
  const blesse = sante === 'blesse';
  return (
    <p className={`badge-sante ${sante}`} role="status" aria-label={blesse ? 'État : blessé' : 'État : critique'}>
      {blesse ? '! BLESSÉ' : '!! CRITIQUE'}
    </p>
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

/**
 * Récit (12 §3.3), écrit à la machine quand il est nouveau (D-186). `tabIndex` : le focus y revient quand la puce d'origine a disparu.
 * Chaque bloc existe deux fois : le texte entier pour le lecteur d'écran, et une copie masquée écrite lettre à lettre,
 * qui occupe dès le départ la place du texte final. Le curseur suit le dernier bloc.
 */
function Recit({
  jeu,
  zone,
  ecrire,
  fixe,
}: {
  readonly jeu: Jeu;
  readonly zone: RefObject<HTMLElement | null>;
  readonly ecrire: boolean;
  /** Réglage sur [NON] : curseur sans clignotement. */
  readonly fixe: boolean;
}) {
  const { rappel } = jeu;
  const blocs = [...(rappel === null ? [] : [`> ${rappel.texte}`]), ...jeu.recit];
  const delais = delaisEcriture(blocs);
  // Nouvelle clé à chaque nouveau texte : la copie écrite est recréée et son écriture repart de zéro.
  const numero = numeroDe(jeu);
  const copie = (rang: number): ReactNode => (
    <span key={numero} aria-hidden="true">
      {[...(blocs[rang] ?? '')].map((caractere, index) => (
        <span key={index} className="car" style={{ animationDelay: `${delais[rang]?.[index] ?? 0}ms` }}>
          {caractere}
        </span>
      ))}
      {rang === blocs.length - 1 && (
        <span className="curseur" style={{ animationDelay: `${DUREE_ECRITURE_MS}ms` }}>
          ▮
        </span>
      )}
    </span>
  );
  const decalage = rappel === null ? 0 : 1;
  const classes = ['recit', ...(ecrire ? ['ecrire'] : []), ...(fixe ? ['curseur-fixe'] : [])].join(' ');
  return (
    <section ref={zone} className={classes} data-testid="recit" aria-live="polite" tabIndex={-1}>
      {rappel !== null && (
        <p className={rappel.capitales ? 'rappel capitales' : 'rappel'} data-testid="rappel">
          <span className="lecteur-seul">{rappel.texte}</span>
          {copie(0)}
        </p>
      )}
      {jeu.recit.map((phrase, index) => (
        <p key={index}>
          <span className="lecteur-seul">{phrase}</span>
          {copie(index + decalage)}
        </p>
      ))}
    </section>
  );
}

/** Dock (12 §3.4) : une puce par objet ou passage de la pièce, qui ouvre sa bulle, puis un bouton par passage connu. */
// Pendant l'enregistrement d'une action, rien ne s'ouvre : une bulle calculée sur l'état d'avant serait périmée (C-01 §4).
export function DockPiece({
  dock,
  textes,
  occupe,
  puceOuverte,
  deplacementOuvert,
  ouvrir,
  ouvrirDeplacement,
  direct,
  jouer,
}: {
  readonly dock: Dock;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  /** Cible dont la bulle est ouverte : sa puce passe en vidéo inverse. */
  readonly puceOuverte: string | null;
  readonly deplacementOuvert: string | null;
  readonly ouvrir: (groupe: Groupe, ancre: HTMLElement) => void;
  /** Ouvre l'aperçu du déplacement, ou le joue s'il se fait d'un seul toucher. */
  readonly ouvrirDeplacement: (option: OptionMenu, ancre: HTMLElement) => void;
  readonly direct: Direct;
  /** « Regarder autour de vous » : gratuit, sans aperçu. */
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
              aria-expanded={groupe.cible.id === puceOuverte}
              disabled={occupe}
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
                <Deplacement
                  option={option}
                  textes={textes}
                  occupe={occupe}
                  ouverte={option.cible.id === deplacementOuvert}
                  direct={direct(option)}
                  ouvrir={ouvrirDeplacement}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Deplacement({
  option,
  textes,
  occupe,
  ouverte,
  direct,
  ouvrir,
}: {
  readonly option: OptionMenu;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  readonly ouverte: boolean;
  readonly direct: boolean;
  readonly ouvrir: (option: OptionMenu, ancre: HTMLElement) => void;
}) {
  const { raison } = libelleOption(textes, option);
  const destination = nomDestination(textes, option);
  if (raison !== null) return <Indisponible classe="deplacement" libelle={destination} raison={raison} />;
  return (
    <button
      type="button"
      className="deplacement"
      aria-haspopup={direct ? undefined : 'dialog'}
      aria-expanded={direct ? undefined : ouverte}
      aria-label={direct ? `${destination}${SANS_CONFIRMATION}` : undefined}
      disabled={occupe}
      onClick={(evenement) => ouvrir(option, evenement.currentTarget)}
    >
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
