import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { Bulle } from './bulle';
import { SANS_ABONNEMENT } from './constantes';
import type { EtatInstallation, Installation } from './installation';
import type { EtatMiseAJour, MiseAJour } from './miseAJour';
import { PanneauRapport, RETOURS } from './PanneauRapport';
import type { Retour, TypeRapport } from './rapports';
import { empreinteLisible } from './validation';
import { LIBELLES_VERIFICATION, type EtatVerification } from './verification';
import { TAILLES, type Reglages, type Taille } from './reglages';
import { useSon } from './son/contexte';
import { LIBELLES } from './libelles';

const LIBELLES_TAILLE: Readonly<Record<Taille, string>> = LIBELLES.options.tailles;

/** Phrase de récit montrée à la taille choisie (12 §4.10). */
export const APERCU_TAILLE = LIBELLES.options.apercuTaille;

/** Retour visible du téléchargement (12 §6, C-09 SP-05) ; `null` tant que rien n'a été demandé. */
export type Telechargement = { readonly etat: 'pret'; readonly nom: string } | { readonly etat: 'echec' } | null;

const DETAILS = LIBELLES.options.details;

/** Sous-menus des options, dans l'ordre du sommaire (D-287). */
type SousMenuOptions ='son_texte' | 'rapports' | 'application';

const TITRES_SOUS_MENUS: Readonly<Record<SousMenuOptions, string>> = LIBELLES.options.sousMenus;

/** Marque l'entrée d'historique posée à l'ouverture d'un sous-menu : le retour du téléphone le referme (D-288). */
const ENTREE_SOUS_MENU = 'void-walker:sous-menu';

function quitterEntreeSousMenu(): void {
  const etat: unknown = window.history.state;
  if (typeof etat === 'object' && etat !== null && ENTREE_SOUS_MENU in etat) window.history.back();
}

/**
 * Options (12 §4.10) : gratuites, elles ne changent pas la partie. Un sommaire de trois lignes et l'abandon (D-287) ; chaque
 * ligne ouvre son sous-menu dans une bulle, le bas restant utilisable (D-288). Sans partie en cours, ni téléchargement, ni
 * abandon, ni REPRENDRE LA PARTIE.
 */
export function EcranOptions({
  reglages,
  changerReglages,
  reglagesGardes = true,
  partieEnCours,
  occupe,
  telecharger,
  abandonner,
  menuPrincipal,
  reprendre,
  version,
  build = '',
  commit,
  pr,
  miseAJour,
  installation,
  partieEnregistree = partieEnCours,
  envoyerRapport,
  rapportsEnAttente = 0,
  partieFinie = false,
  empreinteCle,
  verification,
  sousMenuInitial = null,
}: {
  readonly reglages: Reglages;
  readonly changerReglages: (reglages: Reglages) => void;
  /** Faux si l'appareil a refusé de garder le dernier réglage (navigation privée, quota) : il vaut jusqu'à la fermeture. */
  readonly reglagesGardes?: boolean;
  readonly partieEnCours: boolean;
  readonly occupe: boolean;
  readonly telecharger: () => Telechargement;
  /** `false` si l'abandon n'a pas pu être enregistré : la partie reste en cours. */
  readonly abandonner: () => Promise<boolean>;
  readonly menuPrincipal: () => void;
  readonly reprendre: () => void;
  readonly version: string;
  readonly build?: string;
  readonly commit: string;
  readonly pr: string;
  readonly miseAJour?: MiseAJour;
  /** Installation sur l'écran d'accueil (#174) ; absente, ou état « indisponible », pas de section. */
  readonly installation?: Installation;
  /** Une partie est enregistrée, en cours ou finie : elle peut être envoyée. */
  readonly partieEnregistree?: boolean;
  /** Rapports (C-10 §3) ; absents, ni « Signaler un bug » ni « Envoyer ma partie ». */
  readonly envoyerRapport?: (type: TypeRapport, commentaire: string, valide: boolean) => Promise<Retour>;
  /** Rapports gardés sur l'appareil, en attente du réseau (PR-01). */
  readonly rapportsEnAttente?: number;
  /** La partie enregistrée est allée au bout : son envoi peut porter « je valide » dans une version de test (D-099). */
  readonly partieFinie?: boolean;
  /** Empreinte de la clé de validation du téléphone (C-10 §4), lue dans les versions de test seulement. */
  readonly empreinteCle?: () => Promise<string | null>;
  /** État de la vérification automatique de ce commit (#180), lu dans les versions de test seulement. */
  readonly verification?: () => Promise<EtatVerification>;
  /** Sous-menu déjà ouvert au premier rendu ; `null`, le sommaire seul. */
  readonly sousMenuInitial?: SousMenuOptions | null;
}) {
  const idTaille = useId();
  const son = useSon();
  const titre = useRef<HTMLHeadingElement>(null);
  const [sousMenu, setSousMenu] = useState(sousMenuInitial);
  const bulle = useRef<HTMLElement>(null);
  const lignes = useRef<Partial<Record<SousMenuOptions, HTMLButtonElement | null>>>({});
  /** Sous-menu ouvert avec son entrée d'historique ; vidé à la fermeture, avant que le retour n'arrive. */
  const origine = useRef<SousMenuOptions | null>(null);
  const lireInstallation = installation?.etat ?? INSTALLATION_INDISPONIBLE;
  const installable = useSyncExternalStore(installation?.abonner ?? SANS_ABONNEMENT, lireInstallation, lireInstallation) !== 'indisponible';
  const [telechargement, setTelechargement] = useState<Telechargement>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [abandonRefuse, setAbandonRefuse] = useState(false);
  /** Rapports envoyés depuis l'ouverture : le premier « je valide » crée la clé, la section VALIDATION la relit. */
  const [envois, setEnvois] = useState(0);
  const question = useRef<HTMLParagraphElement>(null);
  const danger = useRef<HTMLButtonElement>(null);
  /** Le focus suit la confirmation : sur sa question à l'ouverture, sur le bouton d'abandon à l'annulation (12 §7). */
  const focusApres = useRef(false);

  useEffect(() => {
    titre.current?.focus();
  }, []);

  useEffect(() => {
    if (!focusApres.current) return;
    focusApres.current = false;
    (confirmation ? question.current : danger.current)?.focus();
  }, [confirmation]);

  useEffect(() => {
    // Retour du téléphone (D-288) : même son que ✕ ; une fermeture par ✕ a déjà vidé `origine` et ne sonne pas deux fois.
    const surRetour = (): void => {
      const depuis = origine.current;
      if (depuis === null) return;
      origine.current = null;
      setSousMenu(null);
      son.geste('fermer');
      lignes.current[depuis]?.focus();
    };
    window.addEventListener('popstate', surRetour);
    return () => window.removeEventListener('popstate', surRetour);
  }, [son]);

  // Options quittées bulle ouverte (MENU PRINCIPAL, REPRENDRE LA PARTIE) : son entrée d'historique part avec elles.
  useEffect(() => () => quitterEntreeSousMenu(), []);

  const confirmer = (ouverte: boolean): void => {
    focusApres.current = true;
    setAbandonRefuse(false);
    setConfirmation(ouverte);
  };

  const ouvrir = (menu: SousMenuOptions): void => {
    if (origine.current === null) window.history.pushState({ [ENTREE_SOUS_MENU]: true }, '');
    origine.current = menu;
    setSousMenu(menu);
  };
  /** ✕, voile ou Échap : le focus revient sur la ligne touchée (12 §7). */
  const fermer = (): void => {
    if (sousMenu === null) return;
    origine.current = null;
    setSousMenu(null);
    quitterEntreeSousMenu();
    lignes.current[sousMenu]?.focus();
  };

  const sousMenus: readonly SousMenuOptions[] = partieEnCours || envoyerRapport !== undefined ? ['son_texte', 'rapports', 'application'] : ['son_texte', 'application'];
  // Le détail dit ce que la bulle contient vraiment (D-287).
  const details: Readonly<Record<SousMenuOptions, string>> = {
    son_texte: pr === '' ? DETAILS.sonTexte : DETAILS.sonTexteTest,
    rapports:
      envoyerRapport === undefined
        ? DETAILS.telecharger
        : partieEnCours
          ? DETAILS.rapportsEnCours
          : partieEnregistree
            ? DETAILS.rapportsEnregistree
            : DETAILS.rapportsSansPartie,
    application: installable ? DETAILS.applicationInstallable : DETAILS.application,
  };

  return (
    <main className="jeu options">
      <header className="entete-options">
        <h1 ref={titre} className="titre-piece" tabIndex={-1}>
          {LIBELLES.commun.options}
        </h1>
        {partieEnCours && <p className="sous-titre-options">{LIBELLES.options.enPause}</p>}
      </header>
      <div className="options-zone">
        <div className="options-corps">
          {sousMenus.map((menu) => (
            <button
              key={menu}
              ref={(bouton) => {
                lignes.current[menu] = bouton;
              }}
              type="button"
              className="ligne-option"
              aria-haspopup="dialog"
              onClick={() => ouvrir(menu)}
              data-son="bulle"
            >
              <span className="nom-sous-menu">
                <span aria-hidden="true">▸ </span>
                {TITRES_SOUS_MENUS[menu]}
              </span>
              <span className="detail-option">{details[menu]}</span>
            </button>
          ))}
          {!partieEnCours ? null : confirmation ? (
            <section className="confirmation-options" aria-label={LIBELLES.options.abandon.confirmation}>
              <p ref={question} tabIndex={-1}>
                {LIBELLES.options.abandon.question}
              </p>
              {abandonRefuse && (
                <p className="avis-option" role="alert">
                  {LIBELLES.commun.abandonRefuse}
                </p>
              )}
              <div>
                <button type="button" className="secondaire" disabled={occupe} onClick={() => confirmer(false)} data-son="clic">
                  {LIBELLES.commun.annuler}
                </button>
                <button
                  type="button"
                  className="principal"
                  disabled={occupe}
                  onClick={() => void abandonner().then((fait) => setAbandonRefuse(!fait))}
                  data-son="confirmer"
                >
                  {LIBELLES.options.abandon.abandonner}
                </button>
              </div>
            </section>
          ) : (
            <button ref={danger} type="button" className="danger" disabled={occupe} onClick={() => confirmer(true)} data-son="clic">
              <span aria-hidden="true">⊘ </span>
              {LIBELLES.options.abandon.bouton}
            </button>
          )}
        </div>
        {sousMenu !== null && (
          <>
            <div className="voile" data-testid="voile-options" data-son="fermer" onClick={fermer} />
            <Bulle zone={bulle} classe="bulle-options" titre={TITRES_SOUS_MENUS[sousMenu]} etape={sousMenu} fermer={fermer}>
              {sousMenu === 'son_texte' ? (
                <>
                  <section>
                    <h2 className="titre-section" id={idTaille}>
                      {LIBELLES.options.tailleTexte}
                    </h2>
                    <div className="segments" role="radiogroup" aria-labelledby={idTaille}>
                      {TAILLES.map((taille) => (
                        <label key={taille} className={taille === reglages.taille ? 'segment actif' : 'segment'} data-son="clic">
                          <input
                            type="radio"
                            name="taille"
                            className="lecteur-seul"
                            checked={taille === reglages.taille}
                            onChange={() => changerReglages({ ...reglages, taille })}
                          />
                          <span>{LIBELLES_TAILLE[taille]}</span>
                        </label>
                      ))}
                    </div>
                    <p className="apercu-taille" data-testid="apercu-taille">
                      {APERCU_TAILLE}
                    </p>
                  </section>
                  <section>
                    <h2 className="titre-section">{LIBELLES.options.son}</h2>
                    <Rail libelle={LIBELLES.options.general} coupe={LIBELLES.options.coupee} valeur={reglages.general} changer={(general) => changerReglages({ ...reglages, general })} />
                    <Rail
                      libelle={LIBELLES.options.effets}
                      detail={LIBELLES.options.effetsDetail}
                      coupe={LIBELLES.options.coupes}
                      valeur={reglages.effets}
                      changer={(effets) => changerReglages({ ...reglages, effets })}
                    />
                    <Rail
                      libelle={LIBELLES.options.ambiance}
                      detail={LIBELLES.options.ambianceDetail}
                      coupe={LIBELLES.options.coupee}
                      valeur={reglages.ambiance}
                      changer={(ambiance) => changerReglages({ ...reglages, ambiance })}
                    />
                  </section>
                  <section>
                    <h2 className="titre-section">{LIBELLES.options.affichage}</h2>
                    <Bascule libelle={LIBELLES.options.balayage} actif={reglages.balayage} basculer={() => changerReglages({ ...reglages, balayage: !reglages.balayage })} />
                    <Bascule
                      libelle={LIBELLES.options.machineAEcrire}
                      actif={reglages.machineAEcrire}
                      basculer={() => changerReglages({ ...reglages, machineAEcrire: !reglages.machineAEcrire })}
                    />
                    {pr !== '' && (
                      <Bascule
                        libelle={LIBELLES.options.carteRevelee}
                        actif={reglages.carteRevelee}
                        basculer={() => changerReglages({ ...reglages, carteRevelee: !reglages.carteRevelee })}
                      />
                    )}
                    {!reglagesGardes && (
                      <p className="retour-option" role="status">
                        {LIBELLES.options.reglagesNonGardes}
                      </p>
                    )}
                  </section>
                </>
              ) : sousMenu === 'rapports' ? (
                <>
                  {envoyerRapport !== undefined && (
                    <LignesRapports
                      partieEnregistree={partieEnregistree}
                      partieEnCours={partieEnCours}
                      pr={pr}
                      occupe={occupe}
                      envoyer={envoyerRapport}
                      enAttente={rapportsEnAttente}
                      validable={pr !== '' && partieFinie}
                      apresEnvoi={() => setEnvois((nombre) => nombre + 1)}
                      empreinteCle={empreinteCle}
                    />
                  )}
                  {partieEnCours && (
                    <>
                      <button type="button" className="ligne-option" disabled={occupe} onClick={() => setTelechargement(telecharger())} data-son="clic">
                        <span>
                          <span aria-hidden="true">▸ </span>
                          {LIBELLES.options.telecharger}
                        </span>
                        <span className="detail-option">{LIBELLES.options.telechargerDetail}</span>
                      </button>
                      <p className="retour-option" role="status" data-testid="telechargement">
                        {telechargement?.etat === 'pret' && LIBELLES.options.fichierPret(telechargement.nom)}
                        {telechargement?.etat === 'echec' && LIBELLES.options.telechargementEchoue}
                      </p>
                    </>
                  )}
                  {pr !== '' && empreinteCle !== undefined && <SectionValidation key={envois} empreinteCle={empreinteCle} />}
                </>
              ) : (
                <>
                  <SectionInstallation installation={installation} occupe={occupe} />
                  <SectionMiseAJour miseAJour={miseAJour} partieEnCours={partieEnCours} occupe={occupe} />
                  <p className="pied">
                    V{version}
                    {build !== '' && ` (${build})`}
                    {commit !== '' && ` · ${commit.slice(0, 7)}`}
                    {pr !== '' && LIBELLES.options.versionTest(pr)}
                  </p>
                  {pr !== '' && verification !== undefined && <LigneVerification verification={verification} />}
                </>
              )}
            </Bulle>
          </>
        )}
      </div>
      <div className="options-bas">
        <button type="button" className="secondaire" disabled={occupe} onClick={menuPrincipal} data-son="clic">
          {LIBELLES.commun.menuPrincipal}
        </button>
        {partieEnCours && (
          <button type="button" className="principal" disabled={occupe} onClick={reprendre} data-son="clic">
            {LIBELLES.commun.reprendrePartie}
          </button>
        )}
      </div>
    </main>
  );
}

const LIBELLES_RAPPORT: Readonly<Record<TypeRapport, string>> = { bug: LIBELLES.commun.signalerBug, partie: LIBELLES.commun.envoyerPartie };

/**
 * « Signaler un bug » et « Envoyer ma partie » (12 §4.10, D-142) : le panneau s'ouvre sous la ligne touchée, un seul à la
 * fois ; une fois le rapport parti ou gardé, il se referme et laisse son retour sous la ligne.
 */
function LignesRapports({
  partieEnregistree,
  partieEnCours,
  pr,
  occupe,
  envoyer,
  enAttente,
  validable,
  apresEnvoi,
  empreinteCle,
}: {
  readonly validable: boolean;
  readonly apresEnvoi: () => void;
  readonly empreinteCle: (() => Promise<string | null>) | undefined;
  readonly partieEnregistree: boolean;
  readonly partieEnCours: boolean;
  readonly pr: string;
  readonly occupe: boolean;
  readonly envoyer: (type: TypeRapport, commentaire: string, valide: boolean) => Promise<Retour>;
  readonly enAttente: number;
}) {
  const [ouvert, setOuvert] = useState<TypeRapport | null>(null);
  const [retours, setRetours] = useState<Partial<Record<TypeRapport, Retour>>>({});
  const lignes = useRef<Partial<Record<TypeRapport, HTMLButtonElement | null>>>({});
  const types: readonly TypeRapport[] = partieEnregistree ? ['bug', 'partie'] : ['bug'];
  const details: Readonly<Record<TypeRapport, string>> = {
    bug: partieEnCours ? LIBELLES.rapport.details.partieEnCoursJointe : partieEnregistree ? LIBELLES.rapport.details.partieJointe : LIBELLES.rapport.details.aucunePartie,
    partie: LIBELLES.rapport.details.partie,
  };
  return (
    <>
      {types.map((type) => (
        <div key={type} className="rapport">
          <button
            ref={(bouton) => {
              lignes.current[type] = bouton;
            }}
            type="button"
            className={ouvert === type ? 'ligne-option ouverte' : 'ligne-option'}
            aria-expanded={ouvert === type}
            disabled={occupe}
            onClick={() => {
              setOuvert(ouvert === type ? null : type);
              setRetours({});
            }}
            data-son="clic"
          >
            <span>
              <span aria-hidden="true">▸ </span>
              {LIBELLES_RAPPORT[type]}
            </span>
            <span className="detail-option">{details[type]}</span>
          </button>
          {ouvert === type ? (
            <PanneauRapport
              type={type}
              pr={pr}
              validable={validable}
              empreinteCle={empreinteCle}
              partieJointe={partieEnregistree}
              envoyer={(commentaire, valide) => envoyer(type, commentaire, valide)}
              fermer={(retour) => {
                setOuvert(null);
                if (retour !== null) {
                  setRetours({ [type]: retour });
                  apresEnvoi();
                }
                lignes.current[type]?.focus();
              }}
            />
          ) : (
            <p className="retour-option" role="status" data-testid={`retour-${type}`}>
              {retours[type] !== undefined && RETOURS[retours[type]]}
            </p>
          )}
        </div>
      ))}
      {enAttente > 0 && (
        <p className="retour-option" data-testid="rapports-en-attente">
          {LIBELLES.rapport.enAttente(enAttente)}
        </p>
      )}
    </>
  );
}

/**
 * Clé de validation du téléphone (C-10 §4, D-232) : son empreinte, à comparer avec celle que cite le robot de la PR ; la
 * clé se crée au premier « je valide » envoyé.
 */
export function SectionValidation({ empreinteCle }: { readonly empreinteCle: () => Promise<string | null> }) {
  const [empreinte, setEmpreinte] = useState<string | null | 'lecture' | 'illisible'>('lecture');
  useEffect(() => {
    let actif = true;
    empreinteCle().then(
      (lue) => {
        if (actif) setEmpreinte(lue);
      },
      () => {
        if (actif) setEmpreinte('illisible');
      },
    );
    return () => {
      actif = false;
    };
  }, [empreinteCle]);
  return (
    <section>
      <h2 className="titre-section">{LIBELLES.validation.titre}</h2>
      <div className="ligne-cle" data-testid="cle-validation">
        <span>{LIBELLES.validation.cle}</span>
        {empreinte === 'lecture' ? (
          <span className="detail-option">{LIBELLES.commun.lecture}</span>
        ) : empreinte === 'illisible' ? (
          <span className="detail-option">{LIBELLES.validation.cleIllisible}</span>
        ) : empreinte === null ? (
          <span className="detail-option">{LIBELLES.validation.cleAbsente}</span>
        ) : (
          <>
            <span className="empreinte-cle">{empreinteLisible(empreinte)}</span>
            <span className="detail-option">{LIBELLES.validation.cleAComparer}</span>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Version de test publiée avant la fin de sa vérification (#180) : l'état est lu à l'ouverture des options. Une validation
 * signée pendant la vérification ne compte que si celle-ci finit verte.
 */
export function LigneVerification({ verification }: { readonly verification: () => Promise<EtatVerification> }) {
  const [etat, setEtat] = useState<EtatVerification | 'lecture'>('lecture');
  useEffect(() => {
    let actif = true;
    verification().then(
      (lu) => {
        if (actif) setEtat(lu);
      },
      () => {
        if (actif) setEtat('inconnue');
      },
    );
    return () => {
      actif = false;
    };
  }, [verification]);
  return (
    <p className="etat-verification" data-testid="verification">
      {LIBELLES.validation.verification} {etat === 'lecture' ? LIBELLES.commun.lecture : LIBELLES_VERIFICATION[etat]}
      {etat === 'en_cours' && LIBELLES.validation.enCours}
      {etat === 'echec' && LIBELLES.validation.echec}
    </p>
  );
}

const INDISPONIBLE = (): EtatMiseAJour => 'indisponible';
const INSTALLATION_INDISPONIBLE = (): EtatInstallation => 'indisponible';

/** Aide pas à pas là où le navigateur ne laisse pas la page lancer l'installation (#174) ; noms des boutons : docs/16 §3.1. */
export const GUIDES_INSTALLATION = LIBELLES.installation.guides;

const RETOURS_INSTALLATION: Readonly<Partial<Record<EtatInstallation, string>>> = LIBELLES.installation.retours;

/**
 * Installation (#174) : « Installer le jeu » ouvre la boîte du navigateur (Chromium) ou une bulle d'aide (Safari sur iPhone,
 * Firefox sur Android). Absente ailleurs et dans l'appli déjà installée ; présente dans une version de test, à valider.
 */
function SectionInstallation({ installation, occupe }: { readonly installation: Installation | undefined; readonly occupe: boolean }) {
  const lire = installation?.etat ?? INSTALLATION_INDISPONIBLE;
  const etat = useSyncExternalStore(installation?.abonner ?? SANS_ABONNEMENT, lire, lire);
  const [aide, setAide] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const bulle = useRef<HTMLElement>(null);
  /** Le focus revient sur le bouton quand la bulle se referme (12 §7). */
  const aEteOuverte = useRef(false);

  useEffect(() => {
    if (aide) aEteOuverte.current = true;
    else if (aEteOuverte.current) bouton.current?.focus();
  }, [aide]);

  if (installation === undefined || etat === 'indisponible') return null;
  const guide = etat === 'guide_ios' || etat === 'guide_firefox' ? GUIDES_INSTALLATION[etat] : null;
  const proposable = etat === 'invite' || etat === 'en_cours' || guide !== null;
  return (
    <section>
      <h2 className="titre-section">{LIBELLES.installation.titre}</h2>
      {proposable && (
        <button
          ref={bouton}
          type="button"
          className="ligne-option"
          disabled={occupe || etat === 'en_cours'}
          aria-haspopup={guide === null ? undefined : 'dialog'}
          onClick={() => (guide === null ? installation.proposer() : setAide(true))}
          data-son="clic"
        >
          <span>
            <span aria-hidden="true">▸ </span>
            {LIBELLES.installation.installer}
          </span>
          <span className="detail-option">{guide?.detail ?? LIBELLES.installation.detail}</span>
        </button>
      )}
      <p className="retour-option" role="status" data-testid="installation">
        {RETOURS_INSTALLATION[etat]}
      </p>
      {aide && guide !== null && (
        <>
          <div className="voile voile-haut" data-testid="voile-installation" data-son="fermer" onClick={() => setAide(false)} />
          <Bulle zone={bulle} classe="bulle-installation" titre={LIBELLES.installation.installer} etape="installation" fermer={() => setAide(false)}>
            <ol className="etapes-installation">
              {guide.etapes.map((etape) => (
                <li key={etape}>{etape}</li>
              ))}
            </ol>
            <p className="note-installation">{guide.note}</p>
          </Bulle>
        </>
      )}
    </section>
  );
}

/**
 * Mise à jour (D-227) : le jeu se met à jour seul ; ce bouton la force. Absent sans service worker (développement).
 */
function SectionMiseAJour({
  miseAJour,
  partieEnCours,
  occupe,
}: {
  readonly miseAJour: MiseAJour | undefined;
  readonly partieEnCours: boolean;
  readonly occupe: boolean;
}) {
  const lire = miseAJour?.etat ?? INDISPONIBLE;
  const etat = useSyncExternalStore(miseAJour?.abonner ?? SANS_ABONNEMENT, lire, lire);
  if (miseAJour === undefined || etat === 'indisponible') return null;
  const prete = etat === 'prete' || etat === 'installation';
  const enCours = etat === 'recherche' || etat === 'installation';
  return (
    <section>
      <h2 className="titre-section">{LIBELLES.miseAJour.titre}</h2>
      <button type="button" className="ligne-option" disabled={occupe || enCours} onClick={() => void miseAJour.chercher()} data-son="clic">
        <span>
          <span aria-hidden="true">▸ </span>
          {prete ? LIBELLES.miseAJour.installer : LIBELLES.miseAJour.chercher}
        </span>
        <span className="detail-option">{partieEnCours ? LIBELLES.miseAJour.detailEnCours : LIBELLES.miseAJour.detail}</span>
      </button>
      <p className="retour-option" role="status" data-testid="mise-a-jour">
        {etat === 'recherche' && LIBELLES.miseAJour.recherche}
        {etat === 'a_jour' && LIBELLES.miseAJour.aJour}
        {etat === 'prete' && LIBELLES.miseAJour.prete}
        {etat === 'installation' && LIBELLES.miseAJour.installation}
        {etat === 'echec' && LIBELLES.miseAJour.echec}
      </p>
    </section>
  );
}

/** Bascule (12 §3.12) : libellé, puis « [OUI] » ou « [NON] » à droite ; lue comme un interrupteur. */
function Bascule({ libelle, actif, basculer }: { readonly libelle: string; readonly actif: boolean; readonly basculer: () => void }) {
  return (
    <button type="button" className="bascule" role="switch" aria-checked={actif} aria-label={libelle} onClick={basculer} data-son="clic">
      <span>{libelle}</span>
      <span className="valeur-bascule">{actif ? LIBELLES.options.oui : LIBELLES.options.non}</span>
    </button>
  );
}

const TOUCHES_RAIL = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

/**
 * Rail du son (15 §4, D-220) : libellé, détail, valeur à droite (« COUPÉE » ou « COUPÉS » à 0), puis le curseur natif.
 * Le réglage s'applique pendant le glissé ; le clic de contrôle part au relâché, au nouveau niveau.
 */
function Rail({
  libelle,
  detail,
  coupe,
  valeur,
  changer,
}: {
  readonly libelle: string;
  readonly detail?: string;
  readonly coupe: string;
  readonly valeur: number;
  readonly changer: (valeur: number) => void;
}) {
  const id = useId();
  const son = useSon();
  const ecrite = valeur === 0 ? coupe : String(valeur);
  return (
    <div className="rail">
      <label className="rail-haut" htmlFor={id}>
        <span>
          {libelle}
          {detail !== undefined && <span className="detail-option">{detail}</span>}
        </span>
        <span className="valeur-rail" aria-hidden="true">
          {ecrite}
        </span>
      </label>
      <input
        id={id}
        className="curseur-rail"
        type="range"
        min={0}
        max={100}
        step={1}
        aria-valuetext={valeur === 0 ? coupe.toLowerCase() : String(valeur)}
        style={{ '--rempli': `${valeur}%` } as CSSProperties}
        value={valeur}
        onChange={(evenement) => changer(Number(evenement.currentTarget.value))}
        onPointerUp={() => son.geste('clic')}
        onKeyUp={(evenement) => {
          if (TOUCHES_RAIL.has(evenement.key)) son.geste('clic');
        }}
      />
    </div>
  );
}
