import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CATALOGUE, observer, type IdAction, type OptionMenu, type Sante } from '../engine';
import { libelleOption, nomDe, remplir, rendreObservation, type TextesMonde } from '../content';
import {
  composer,
  composerDock,
  etapeBulle,
  filBulle,
  libelleLigne,
  lignesActions,
  nomDestination,
  nomParametre,
  nomPuce,
  passagesEntendus,
  passagesOuverts,
  precedente,
  REGARDER_AUTOUR,
  unToucher,
  type Deplacement,
  type Dock,
  type Etape,
  type Groupe,
  type Repere,
} from './ecran';
import { Bulle, BulleAncree, garderFocus } from './bulle';
import { EcranCarte } from './carte/EcranCarte';
import { dejaEcrit, delaisEcriture, DUREE_ECRITURE_MS, marquerEcrit, numeroDe } from './ecriture';
import { consulter, historiqueAffiche, prevoir, type ApercuAffiche, type Environnement, type Jeu, type MessageAffiche } from './jeu';
import { EnvoyerMaPartie } from './PanneauRapport';
import type { Retour } from './rapports';
import { annoncerTexte, useSon } from './son/contexte';
import type { Geste, Signal } from './son/recettes';

type Jouer = (option: OptionMenu) => void;
/** Texte de la fiche d'une cible : sa consultation, gratuite (D-014). */
type Lire = (option: OptionMenu) => readonly string[];
type Prevoir = (option: OptionMenu) => ApercuAffiche;
/** Vrai si l'option se joue d'un seul toucher, sans aperçu (D-182). */
type Direct = (option: OptionMenu) => boolean;

/** Suffixe du nom accessible d'un bouton qui joue l'action sans aperçu. */
const SANS_CONFIRMATION = ', sans confirmation';

/** Historique vide, pour un monde sans message d'IA Station. */
const AUCUN_MESSAGE = 'Aucun message reçu.';

/** Aucun signal : réveil, reprise, retour des options (15 §2.2). */
const AUCUN_SIGNAL: readonly Signal[] = [];

/** Libellés de la navigation : en texte agrandi sur un écran étroit, ils se coupent à la syllabe, avec un trait d'union (12 §7). */
const NAV_INVENTAIRE = 'Inven\u00adtaire';
const NAV_IA = 'IA Sta\u00adtion';
const NAV_CARTE = 'Carte';

/**
 * Bulle ouverte : une puce de la pièce ou un bouton « Se déplacer vers » (D-229), l'inventaire (liste, puis fiche d'un objet porté), la fenêtre
 * d'IA Station, ou la carte (14 §2.1).
 * `action` : action choisie ; `null` à l'étape de la fiche. `parametre` : paramètre choisi à l'étape « OÙ ? », sinon `null`.
 * `nouveaux` : messages qui n'étaient pas encore lus à l'ouverture de la fenêtre, marqués NOUVEAU tant qu'elle reste ouverte.
 */
type Ouverte =
  | { readonly zone: 'piece'; readonly cible: string; readonly ancre: HTMLElement; readonly action: IdAction | null; readonly parametre: string | null }
  | { readonly zone: 'inventaire'; readonly cible: string | null; readonly action: IdAction | null; readonly parametre: string | null }
  | { readonly zone: 'ia'; readonly nouveaux: readonly string[] }
  | { readonly zone: 'carte' };

/** Refermer l'inventaire, la carte ou IA Station sonne plus grave que les autres bulles (D-226). */
function sonDeFermetureZone(zone: Ouverte['zone']): Geste {
  return zone === 'inventaire' ? 'fermer-inventaire' : zone === 'carte' ? 'fermer-carte' : zone === 'ia' ? 'fermer-ia' : 'fermer';
}

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
  lus,
  env,
  machineAEcrire,
  occupe,
  choisir,
  lireMessages,
  ouvrirOptions,
  nouvellePartie,
  signaux = AUCUN_SIGNAL,
  envoyerPartie,
  pr = '',
  empreinteCle,
}: {
  readonly jeu: Jeu;
  /** Messages d'IA Station déjà lus, par identifiant : les autres messages reçus sont nouveaux (12 §2.6). */
  readonly lus: readonly string[];
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  /** Réglage « Effet machine à écrire » (D-186) ; le mouvement réduit du téléphone l'emporte, en CSS. */
  readonly machineAEcrire: boolean;
  readonly occupe: boolean;
  readonly choisir: (jeu: Jeu, option: OptionMenu) => Promise<void>;
  /** À l'ouverture de la fenêtre d'IA Station : tous les messages reçus passent en lus, sans toucher à la partie. */
  readonly lireMessages: (jeu: Jeu) => void;
  /** Engrenage des options (12 §3.2) ; absent, ou partie terminée : pas d'engrenage. */
  readonly ouvrirOptions?: () => void;
  /** Après la fin de la partie, seul geste possible en attendant l'écran de fin (12 §4.11). */
  readonly nouvellePartie?: () => void;
  /** Signaux de la dernière action (15 §2.2), annoncés après l'écriture du texte. */
  readonly signaux?: readonly Signal[];
  /** ENVOYER MA PARTIE après la fin (12 §4.11) ; dans une version de test, la partie finie peut porter « je valide ». */
  readonly envoyerPartie?: (commentaire: string, valide: boolean) => Promise<Retour>;
  /** Numéro de PR de la version de test, vide pour la version publique. */
  readonly pr?: string;
  /** Empreinte de la clé de validation, montrée sous « je valide » (D-232) : l'écran de fin n'a pas d'options. */
  readonly empreinteCle?: () => Promise<string | null>;
}) {
  const { textes } = env;
  const observation = observer(env.monde, jeu.partie.etat);
  const dock = composerDock(observation, passagesOuverts(jeu.partie), passagesEntendus(jeu.partie));
  const son = useSon();
  const [ouverte, setOuverte] = useState<Ouverte | null>(null);
  /** Bulle ouverte, lue par le retour système pour sonner comme elle (D-226). */
  const zoneOuverte = useRef<Ouverte['zone'] | null>(null);
  useEffect(() => {
    zoneOuverte.current = ouverte?.zone ?? null;
  }, [ouverte]);
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
    // Texte affiché en entier : le crépitement s'arrête net, les signaux partent (15 §2.3).
    son.taire();
  };

  // Nouveau texte (15 §2.3, §2.4) : crépitement s'il s'écrit, puis les signaux de l'action ; une seule fois par texte.
  useEffect(() => {
    annoncerTexte(son, jeu, ecrire, signaux);
  }, [son, jeu, ecrire, signaux]);

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
      // Retour système (12 §3.5) : même son que ✕ ; une fermeture par ✕ a déjà vidé `origine` et ne sonne pas deux fois.
      son.geste(zoneOuverte.current === null ? 'fermer' : sonDeFermetureZone(zoneOuverte.current));
      depuis.focus();
    };
    window.addEventListener('popstate', surRetour);
    return () => window.removeEventListener('popstate', surRetour);
  }, [son]);

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
  const nonLus = jeu.partie.etat.messages.filter((message) => !lus.includes(message));
  // Gratuit (D-014) : la fenêtre montre les messages déjà reçus, sans question possible (C-06 K-06).
  const ouvrirIA = (depuis: HTMLElement): void => {
    ouvrir({ zone: 'ia', nouveaux: nonLus }, depuis);
    lireMessages(jeu);
  };

  const groupeOuvert = ouverte?.zone === 'piece' ? dock.piece.find((groupe) => groupe.cible.id === ouverte.cible) : undefined;
  return (
    // Pendant l'écriture, tout toucher agit normalement et affiche le texte en entier.
    <main className="jeu" onPointerDownCapture={completer} onKeyDownCapture={completer}>
      <header className="entete-piece">
        <h1 className="titre-piece">{nomDe(textes, observation.piece).texte}</h1>
        <BadgeSante sante={observation.sante} />
        {ouvrirOptions !== undefined && !observation.terminee && (
          <button type="button" className="engrenage" aria-label="Options" disabled={occupe} onClick={ouvrirOptions} data-son="clic">
            <Engrenage />
          </button>
        )}
      </header>
      <Sauvegarde jeu={jeu} />
      <Recit jeu={jeu} zone={recit} ecrire={ecrire} fixe={!machineAEcrire} terminee={observation.terminee} />
      {/* Situation en phrases : hors de l'écran, gardée pour le lecteur d'écran comme dans la CLI (C-06 K-07). */}
      <section className="lecteur-seul" data-testid="situation">
        {rendreObservation(textes, observation).map((ligne, index) => (
          <p key={index}>{ligne}</p>
        ))}
      </section>
      {observation.terminee ? (
        <section className="dock fin-partie">
          {/* Déjà lue dans la situation, en tête de page pour le lecteur d'écran. */}
          <p aria-hidden="true">{remplir(observation.issue === 'evacuation' ? textes.observation.evacuee : textes.observation.terminee, {})}</p>
          {nouvellePartie !== undefined && (
            <button type="button" className="principal" disabled={occupe} onClick={nouvellePartie} data-son="clic">
              Nouvelle partie
            </button>
          )}
          {envoyerPartie !== undefined && <EnvoyerMaPartie envoyer={envoyerPartie} pr={pr} validable={pr !== ''} empreinteCle={empreinteCle} occupe={occupe} />}
        </section>
      ) : (
        <DockPiece
          // Une nouvelle pièce remonte le dock : il ne garde pas le défilement de la précédente.
          key={observation.piece.id}
          dock={dock}
          textes={textes}
          occupe={occupe}
          puceOuverte={ouverte?.zone === 'piece' ? ouverte.cible : null}
          ouvrir={(groupe, ancre) => ouvrir({ zone: 'piece', cible: groupe.cible.id, ancre, action: null, parametre: null }, ancre)}
          jouer={jouer}
        />
      )}
      {/* Toucher en dehors de la bulle la referme sans effet (12 §3.5). */}
      {ouverte !== null && (
        <div
          className={ouverte.zone === 'piece' ? 'voile voile-haut' : 'voile'}
          data-testid="voile"
          data-son={sonDeFermetureZone(ouverte.zone)}
          onClick={fermer}
        />
      )}
      {ouverte?.zone === 'piece' && groupeOuvert !== undefined && (
        <BulleObjet
          ancre={ouverte.ancre}
          groupe={groupeOuvert}
          action={ouverte.action}
          choisirAction={(action) => montrer({ ...ouverte, action, parametre: null })}
          parametre={ouverte.parametre}
          choisirParametre={(parametre) => montrer({ ...ouverte, parametre })}
          textes={textes}
          occupe={occupe}
          jouer={jouer}
          lire={lire}
          prevoir={voir}
          direct={direct}
          fermer={fermer}
        />
      )}
      <div className="bas">
        {ouverte?.zone === 'ia' && <ModaleIA messages={historiqueAffiche(env, jeu.partie)} nouveaux={ouverte.nouveaux} fermer={fermer} />}
        {/* Carte (14 §2) : bulle au-dessus de la navigation comme l'inventaire (D-215), gratuite (D-014) ; elle ne lit que l'observation publique. */}
        {ouverte?.zone === 'carte' && <EcranCarte carte={observation.carte} textes={textes} fermer={fermer} />}
        {ouverte?.zone === 'inventaire' && (
          <BulleInventaire
            id={idInventaire}
            groupes={dock.inventaire}
            cible={ouverte.cible}
            choisir={(cible) => montrer({ zone: 'inventaire', cible, action: null, parametre: null })}
            action={ouverte.action}
            choisirAction={(action) => montrer({ ...ouverte, action, parametre: null })}
            parametre={ouverte.parametre}
            choisirParametre={(parametre) => montrer({ ...ouverte, parametre })}
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
            className="nav-inventaire"
            aria-haspopup="dialog"
            aria-expanded={ouverte?.zone === 'inventaire'}
            aria-controls={ouverte?.zone === 'inventaire' ? idInventaire : undefined}
            aria-label="Inventaire"
            disabled={occupe}
            onClick={(evenement) =>
              ouverte?.zone === 'inventaire' ? fermer() : ouvrir({ zone: 'inventaire', cible: null, action: null, parametre: null }, evenement.currentTarget)
            }
            data-son={ouverte?.zone === 'inventaire' ? 'fermer-inventaire' : 'panneau-inventaire'}
          >
            {NAV_INVENTAIRE}
          </button>
          <button
            type="button"
            className="nav-carte"
            aria-haspopup="dialog"
            aria-expanded={ouverte?.zone === 'carte'}
            aria-label="Carte"
            disabled={occupe}
            onClick={(evenement) => (ouverte?.zone === 'carte' ? fermer() : ouvrir({ zone: 'carte' }, evenement.currentTarget))}
            data-son={ouverte?.zone === 'carte' ? 'fermer-carte' : 'panneau-carte'}
          >
            {NAV_CARTE}
          </button>
          {/* Repère animé tant qu'un message n'a pas été lu (D-263) ; masqué au lecteur d'écran, qui lit « nouveau message » sans répétition (12 §2.6). */}
          <button
            type="button"
            className="nav-ia"
            aria-haspopup="dialog"
            aria-expanded={ouverte?.zone === 'ia'}
            aria-label={nonLus.length > 0 ? 'IA Station, nouveau message' : 'IA Station'}
            disabled={occupe}
            onClick={(evenement) => (ouverte?.zone === 'ia' ? fermer() : ouvrirIA(evenement.currentTarget))}
            data-son={ouverte?.zone === 'ia' ? 'fermer-ia' : 'panneau-ia'}
          >
            {NAV_IA}
            {nonLus.length > 0 && (
              <svg className="notification-ia" viewBox="0 0 12 20" aria-hidden="true">
                <rect x="3" y="0" width="6" height="12" fill="currentColor" />
                <rect x="3" y="14" width="6" height="6" fill="currentColor" />
              </svg>
            )}
          </button>
        </nav>
      </div>
    </main>
  );
}

export function EcranReveil({
  jeu,
  env,
  machineAEcrire,
  occupe,
  regarder,
}: {
  readonly jeu: Jeu;
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  readonly machineAEcrire: boolean;
  readonly occupe: boolean;
  readonly regarder: () => void;
}) {
  const observation = observer(env.monde, jeu.partie.etat);
  const zone = useRef<HTMLElement>(null);
  const [complet, setComplet] = useState(false);
  const ecrire = machineAEcrire && !complet && !dejaEcrit(jeu);
  const son = useSon();
  const completer = (): void => {
    marquerEcrit(jeu);
    setComplet(true);
    son.taire();
  };

  // Réveil : crépitement seulement ; aucun signal sans action d'avant (15 §2.2).
  useEffect(() => {
    annoncerTexte(son, jeu, ecrire, AUCUN_SIGNAL);
  }, [son, jeu, ecrire]);

  useEffect(() => {
    const fin = setTimeout(() => marquerEcrit(jeu), DUREE_ECRITURE_MS);
    return () => clearTimeout(fin);
  }, [jeu]);

  return (
    <main className="jeu reveil" onPointerDownCapture={completer} onKeyDownCapture={completer}>
      <header className="entete-piece entete-reveil">
        <p className="lieu-reveil">&gt; {nomDe(env.textes, observation.piece).texte}_</p>
      </header>
      <Sauvegarde jeu={jeu} />
      <Recit jeu={jeu} zone={zone} ecrire={ecrire} fixe={!machineAEcrire} terminee={false} />
      <div className="actions-reveil">
        <button type="button" className="principal" disabled={occupe} onClick={regarder} data-son="confirmer">
          Regarder autour de vous
        </button>
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
  /** Action choisie ; `null` à l'étape de la fiche. */
  readonly action: IdAction | null;
  readonly choisirAction: (action: IdAction | null) => void;
  /** Paramètre choisi à l'étape « OÙ ? » ; `null` avant. */
  readonly parametre: string | null;
  readonly choisirParametre: (parametre: string | null) => void;
}

/** Fil d'une étape (12 §3.5) ; le paramètre garde sa casse : « CAISSE › DÉPLACER › sous la grille ». */
function Fil({ textes, groupe, etape }: { readonly textes: TextesMonde; readonly groupe: Groupe; readonly etape: Etape }) {
  if (etape.type === 'fiche') return filBulle(textes, groupe.cible);
  if (etape.type === 'apercu' && etape.option.action === 'aller') return filBulle(textes, groupe.cible, etape.option);
  const action = etape.type === 'parametre' ? etape.action : etape.option.action;
  const parametre = etape.type === 'apercu' ? etape.option.parametre : undefined;
  // L'écoutille choisie au pupitre garde son nom : « ÉCOUTILLE › FERMER » (#159).
  const cible = etape.type === 'apercu' ? etape.option.cible : groupe.cible;
  return (
    <>
      {`${nomPuce(textes, cible)} › ${textes.verbes[action]}`}
      {parametre !== undefined && <span className="fil-parametre">{` › ${nomParametre(textes, parametre)}`}</span>}
    </>
  );
}

/** Retour d'une étape (« ‹ ») ; `undefined` à la fiche. */
function retourDe(etape: Etape, props: PropsComposition): (() => void) | undefined {
  const avant = precedente(etape);
  if (avant === null) return undefined;
  return avant.action === null ? () => props.choisirAction(null) : () => props.choisirParametre(null);
}

/** Clé d'une étape : le focus revient sur la bulle quand elle change. */
function cleEtape(groupe: Groupe, etape: Etape): string {
  if (etape.type === 'fiche') return groupe.cible.id;
  if (etape.type === 'parametre') return `${groupe.cible.id}:${etape.action}`;
  return `${groupe.cible.id}:${etape.option.action}:${etape.option.parametre?.id ?? ''}`;
}

/** Bulle d'une puce de la pièce : fiche et actions, puis « OÙ ? » si l'action a un paramètre, puis l'aperçu. */
export function BulleObjet({ ancre, groupe, ...props }: PropsComposition & { readonly ancre: HTMLElement; readonly groupe: Groupe }) {
  const idDescription = useId();
  const etape = etapeBulle(groupe, props.action, props.parametre);
  return (
    <BulleAncree
      ancre={ancre}
      titre={<Fil textes={props.textes} groupe={groupe} etape={etape} />}
      decrite={etape.type === 'parametre' ? undefined : idDescription}
      etape={cleEtape(groupe, etape)}
      retour={retourDe(etape, props)}
      fermer={props.fermer}
      pied={etape.type === 'apercu' ? <Confirmation occupe={props.occupe} confirmer={() => props.jouer(etape.option)} annuler={props.fermer} /> : undefined}
    >
      <Composer groupe={groupe} etape={etape} idDescription={idDescription} {...props} />
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
    const etape = etapeBulle(groupe, props.action, props.parametre);
    return (
      <Bulle
        id={id}
        zone={zone}
        classe="bulle-inventaire"
        titre={<Fil textes={props.textes} groupe={groupe} etape={etape} />}
        decrite={etape.type === 'parametre' ? undefined : idDescription}
        etape={cleEtape(groupe, etape)}
        retour={retourDe(etape, props) ?? (() => choisir(null))}
        fermer={props.fermer}
        sonFermer="fermer-inventaire"
        pied={etape.type === 'apercu' ? <Confirmation occupe={props.occupe} confirmer={() => props.jouer(etape.option)} annuler={props.fermer} /> : undefined}
      >
        <Composer groupe={groupe} etape={etape} idDescription={idDescription} {...props} />
      </Bulle>
    );
  }
  return (
    <Bulle id={id} zone={zone} classe="bulle-inventaire" titre="Inventaire" etape="" fermer={props.fermer} sonFermer="fermer-inventaire">
      {groupes.length === 0 ? (
        <p className="vide">{remplir(props.textes.observation.inventaireVide, {})}</p>
      ) : (
        <ul className="puces">
          {groupes.map((porte) => (
            <li key={porte.cible.id}>
              <button type="button" className="puce" onClick={() => choisir(porte.cible.id)} data-son="clic">
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

/**
 * Étapes de la bulle (12 §3.5) : la fiche, gratuite, et une ligne par action ; puis « OÙ ? », une ligne par paramètre jouable,
 * si l'action en a ; puis l'aperçu de l'option choisie, sauf action d'un seul toucher.
 */
function Composer({
  groupe,
  etape,
  idDescription,
  textes,
  occupe,
  jouer,
  lire,
  prevoir: voir,
  direct,
  choisirAction,
  choisirParametre,
}: PropsComposition & { readonly groupe: Groupe; readonly etape: Etape; readonly idDescription: string }) {
  if (etape.type === 'apercu') return <ApercuAction apercu={voir(etape.option)} idDescription={idDescription} />;
  if (etape.type === 'parametre') {
    return (
      <>
        <h3 className="question">Où ?</h3>
        <ul className="lignes">
          {etape.options.map(({ parametre }) =>
            parametre === undefined ? null : (
              <li key={parametre.id}>
                <button type="button" className="ligne" onClick={() => choisirParametre(parametre.id)} data-son="clic">
                  <span aria-hidden="true">▸ </span>
                  {nomParametre(textes, parametre)}
                </button>
              </li>
            ),
          )}
        </ul>
      </>
    );
  }
  const { fiche, actions } = composer(groupe);
  const lignes = lignesActions(actions);
  return (
    <>
      {fiche !== undefined && (
        <div id={idDescription} className="fiche">
          {lire(fiche).map((phrase, index) => (
            <p key={index}>{phrase}</p>
          ))}
        </div>
      )}
      {lignes.length > 0 && (
        <ul className="lignes">
          {lignes.map((action) => {
            const { libelle: verbe, raison } = libelleLigne(textes, groupe, action);
            return (
              <li key={action.action}>
                {raison !== null ? (
                  <Indisponible classe="ligne" libelle={verbe} raison={raison} />
                ) : direct(action) ? (
                  <button type="button" className="ligne" aria-label={`${verbe}${SANS_CONFIRMATION}`} disabled={occupe} onClick={() => jouer(action)} data-son="confirmer">
                    <span aria-hidden="true">▸ </span>
                    {verbe}
                  </button>
                ) : (
                  <button type="button" className="ligne" onClick={() => choisirAction(action.action)} data-son="clic">
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

/** Aperçu (12 §3.8) : RISQUE (niveau, puis le danger connu) et COÛT s'ils ne sont pas « aucun » (D-187), puis SAVOIR. Aucun chiffre. */
function ApercuAction({ apercu, idDescription }: { readonly apercu: ApercuAffiche; readonly idDescription: string }) {
  return (
    <dl id={idDescription} className="apercu">
      {apercu.risque !== null && (
        <>
          <dt>Risque</dt>
          <dd>
            <strong>{apercu.risque}</strong>
            {apercu.danger === null ? null : ` — ${apercu.danger}`}
          </dd>
        </>
      )}
      {apercu.cout !== null && (
        <>
          <dt>Coût</dt>
          <dd>{apercu.cout}</dd>
        </>
      )}
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
      <button type="button" className="secondaire" onClick={annuler} data-son="fermer">
        Annuler
      </button>
      <button type="button" className="principal" disabled={occupe} onClick={confirmer} data-son="confirmer">
        Confirmer
      </button>
    </div>
  );
}

/** Action indisponible (12 §3.7) : visible, « ⊘ », raison publique à droite, lue « Ouvrir, indisponible : … », jamais activable. */
function Indisponible({ classe, libelle, raison }: { readonly classe: string; readonly libelle: string; readonly raison: string }) {
  return (
    <button type="button" className={`${classe} indisponible`} aria-disabled="true" aria-label={`${libelle}, indisponible : ${raison}`} data-son="refus">
      <span className="libelle">
        <span aria-hidden="true">⊘ </span>
        {libelle}
      </span>
      <span className="raison">{raison}</span>
    </button>
  );
}

/**
 * Fenêtre d'IA Station (12 §3.9), blanche (D-192) : messages reçus du plus ancien au plus récent, en bas et visible à
 * l'ouverture ; repère de moment sans heure ; NOUVEAU sur ceux qui n'étaient pas lus ; croix de fermeture dans l'en-tête.
 */
export function ModaleIA({
  messages,
  nouveaux,
  fermer,
}: {
  readonly messages: readonly MessageAffiche[];
  readonly nouveaux: readonly string[];
  readonly fermer: () => void;
}) {
  const zone = useRef<HTMLElement>(null);
  const liste = useRef<HTMLOListElement>(null);
  const idSousTitre = useId();
  useLayoutEffect(() => {
    if (liste.current !== null) liste.current.scrollTop = liste.current.scrollHeight;
    zone.current?.focus();
  }, []);
  return (
    <section
      ref={zone}
      className="bulle modale-ia"
      role="dialog"
      aria-modal="true"
      aria-label="IA Station"
      aria-describedby={idSousTitre}
      tabIndex={-1}
      data-son-fermer="fermer-ia"
      onKeyDown={(evenement) => garderFocus(evenement, fermer)}
    >
      <div className="modale-entete">
        <div className="modale-identite">
          <h2 className="modale-titre">[ IA STATION ]</h2>
          <p id={idSousTitre} className="modale-sous-titre">
            messages reçus dans l’écouteur
          </p>
        </div>
        <button type="button" className="bulle-icone" aria-label="Fermer" onClick={fermer} data-son="fermer-ia">
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      {messages.length === 0 ? (
        <p className="modale-vide">{AUCUN_MESSAGE}</p>
      ) : (
        <ol ref={liste} className="historique-ia" tabIndex={0}>
          {messages.map((message) => (
            <li key={message.message}>
              <p className="repere-ia">
                <span aria-hidden="true">&gt; </span>
                {message.repere}
                {nouveaux.includes(message.message) && (
                  <>
                    {' '}
                    <span className="nouveau">nouveau</span>
                  </>
                )}
              </p>
              <p className="citation-ia">{`«\u00a0${message.texte}\u00a0»`}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
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
 * Au réveil et à la fin de la partie, la parole d'IA Station est encadrée en entier (12 §4.2) ; en cours de partie, rien dans le récit :
 * le repère du bouton IA STATION l'annonce (12 §3.3, D-263).
 */
function Recit({
  jeu,
  zone,
  ecrire,
  fixe,
  terminee,
  sansAssistance = false,
}: {
  readonly jeu: Jeu;
  readonly zone: RefObject<HTMLElement | null>;
  readonly ecrire: boolean;
  /** Réglage sur [NON] : curseur sans clignotement. */
  readonly fixe: boolean;
  /** Partie finie : la navigation a disparu, le dernier message d'IA Station s'écrit alors dans le récit, comme au réveil. */
  readonly terminee: boolean;
  readonly sansAssistance?: boolean;
}) {
  const { rappel } = jeu;
  const reveil = jeu.partie.etat.actions === 0;
  // Paroles d'IA Station entre guillemets, après le récit, écrites comme lui (D-186).
  const paroles = (reveil || terminee) && !sansAssistance ? jeu.assistance.map((message) => `«\u00a0${message}\u00a0»`) : [];
  const blocs = [...(rappel === null ? [] : [`> ${rappel.texte}`]), ...jeu.recit, ...paroles];
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
      {jeu.recit.map((phrase, index) =>
        jeu.alertes.includes(index) ? (
          <p key={index} className="alerte" data-testid="alerte">
            <IconeAlerte />
            <span className="lecteur-seul">{phrase}</span>
            {copie(index + decalage)}
          </p>
        ) : (
          <p key={index}>
            <span className="lecteur-seul">{phrase}</span>
            {copie(index + decalage)}
          </p>
        ),
      )}
      {paroles.length > 0 && (
        <section className="parole-ia" aria-label="Parole d’IA Station" data-testid="ia-station">
          <p className="etiquette-ia">[ IA STATION ]</p>
          {paroles.map((parole, index) => (
            <p key={index} className="citation-ia">
              <span className="lecteur-seul">{parole}</span>
              {copie(decalage + jeu.recit.length + index)}
            </p>
          ))}
        </section>
      )}
    </section>
  );
}

/**
 * Triangle d'attention devant la phrase d'un danger apparu (D-233) : présent dès le premier instant, hors de l'écriture à la
 * machine, il clignote seul ; le lecteur d'écran l'annonce une fois, avec la phrase.
 */
function IconeAlerte() {
  return (
    <svg className="icone-alerte" viewBox="0 0 16 16" role="img" aria-label="Attention">
      <path d="M8 1.5 15 14.5H1Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
      <path d="M8 6v4.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="7.1" y="11.4" width="1.8" height="1.8" fill="currentColor" />
    </svg>
  );
}

/** Dock (12 §3.4) : une puce par objet de la pièce, qui ouvre sa bulle ; puis une ligne par passage connu, jouée d'un toucher (D-267). */
// Pendant l'enregistrement d'une action, rien ne s'ouvre : une bulle calculée sur l'état d'avant serait périmée (C-01 §4).
export function DockPiece({
  dock,
  textes,
  occupe,
  puceOuverte,
  ouvrir,
  jouer,
}: {
  readonly dock: Dock;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  /** Cible dont la bulle est ouverte : sa puce ou son bouton passe en vidéo inverse. */
  readonly puceOuverte: string | null;
  readonly ouvrir: (groupe: Groupe, ancre: HTMLElement) => void;
  /** « Regarder autour de vous », déplacements et portes : sans aperçu (D-267). */
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
              data-son="bulle"
            >
              <span aria-hidden="true">▸ </span>
              {nomPuce(textes, groupe.cible)}
            </button>
          </li>
        ))}
      </ul>
      {autour !== undefined && (
        <button type="button" className="puce autour" disabled={occupe} onClick={() => jouer(autour)} data-son="confirmer">
          <span aria-hidden="true">▸ </span>
          {REGARDER_AUTOUR}
        </button>
      )}
      {dock.deplacements.length > 0 && (
        <>
          <h2 className="titre-section">Se déplacer vers</h2>
          <ul className="deplacements">
            {dock.deplacements.map((deplacement) => (
              <LigneSalle key={deplacement.cible.id} deplacement={deplacement} textes={textes} occupe={occupe} jouer={jouer} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const REPERES: Record<Repere, string> = { vide: 'Vide', feu: 'Feu', bruit: 'Bruit' };

/**
 * Ligne « → DESTINATION » (D-267) : le nom fait passer d'un toucher ; impossible (porte fermée), il est en pointillé et le
 * moteur refuse sans coût, le récit dit pourquoi. La commande dit l'état de la porte et l'ouvre ou la ferme d'un toucher ;
 * indisponible, elle reste visible et inerte, sa raison lue (12 §3.7). Les repères sont lus avec le nom.
 */
function LigneSalle({
  deplacement,
  textes,
  occupe,
  jouer,
}: {
  readonly deplacement: Deplacement;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  readonly jouer: Jouer;
}) {
  const { passer, manoeuvre, reperes, cible } = deplacement;
  const { raison } = libelleOption(textes, passer);
  const destination = nomDestination(textes, passer);
  const nom = [destination, ...reperes.map((repere) => REPERES[repere].toLowerCase()), ...(raison === null ? [] : [raison])].join(', ');
  const classes = ['deplacement', ...(passer.disponible ? [] : ['bloque']), ...(reperes.length > 0 ? ['repere-danger'] : [])].join(' ');
  return (
    <li className={manoeuvre === undefined ? 'salle sans-porte' : 'salle'}>
      <button type="button" className={classes} aria-label={nom} disabled={occupe} onClick={() => jouer(passer)} data-son={passer.disponible ? 'confirmer' : 'refus'}>
        <span aria-hidden="true">→ </span>
        {destination}
        {reperes.map((repere) => (
          <span key={repere} className="repere" aria-hidden="true">
            {REPERES[repere]}
          </span>
        ))}
      </button>
      {manoeuvre !== undefined && <EtatPorte manoeuvre={manoeuvre} ouverte={cible.ouvert} textes={textes} occupe={occupe} jouer={jouer} />}
    </li>
  );
}

function EtatPorte({
  manoeuvre,
  ouverte,
  textes,
  occupe,
  jouer,
}: {
  readonly manoeuvre: OptionMenu;
  readonly ouverte: boolean;
  readonly textes: TextesMonde;
  readonly occupe: boolean;
  readonly jouer: Jouer;
}) {
  const etat = ouverte ? 'ouverte' : 'fermée';
  const nom = `${nomPuce(textes, manoeuvre.cible)}, ${etat}`;
  const contenu = (
    <>
      <span className="temoin" aria-hidden="true" />
      {ouverte ? 'Ouverte' : 'Fermée'}
    </>
  );
  const classe = ouverte ? 'porte-etat ouverte' : 'porte-etat';
  if (!manoeuvre.disponible) {
    const { raison } = libelleOption(textes, manoeuvre);
    return (
      <button type="button" className={`${classe} indisponible`} aria-disabled="true" aria-label={`${nom}, indisponible : ${raison ?? ''}`} data-son="refus">
        {contenu}
      </button>
    );
  }
  return (
    <button type="button" className={classe} aria-label={nom} disabled={occupe} onClick={() => jouer(manoeuvre)} data-son="confirmer">
      {contenu}
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
