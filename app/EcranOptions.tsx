import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { observer } from '../engine';
import { nomDe, remplir } from '../content';
import { nomPuce } from './ecran';
import type { Environnement, Jeu } from './jeu';
import type { EtatMiseAJour, MiseAJour } from './miseAJour';
import { EnvoyerMaPartie, PanneauRapport, RETOURS } from './PanneauRapport';
import type { Retour, TypeRapport } from './rapports';
import { empreinteLisible } from './validation';
import { TAILLES, type Reglages, type Taille } from './reglages';
import { useSon } from './son/contexte';

const LIBELLES_TAILLE: Readonly<Record<Taille, string>> = { standard: 'Standard', grande: 'Grande', tres_grande: 'Très grande' };

/** Phrase de récit montrée à la taille choisie (12 §4.10). */
export const APERCU_TAILLE = 'Un voyant clignote au-dessus de la porte. Rien d’autre ne bouge.';

/** Retour visible du téléchargement (12 §6, C-09 SP-05) ; `null` tant que rien n'a été demandé. */
export type Telechargement = { readonly etat: 'pret'; readonly nom: string } | { readonly etat: 'echec' } | null;

/**
 * Options (12 §4.10) : gratuites, elles ne changent pas la partie. Sans partie en cours, ni téléchargement, ni abandon,
 * ni REPRENDRE LA PARTIE.
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
  partieEnregistree = partieEnCours,
  envoyerRapport,
  rapportsEnAttente = 0,
  partieFinie = false,
  empreinteCle,
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
}) {
  const idTaille = useId();
  const titre = useRef<HTMLHeadingElement>(null);
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

  const confirmer = (ouverte: boolean): void => {
    focusApres.current = true;
    setAbandonRefuse(false);
    setConfirmation(ouverte);
  };

  return (
    <main className="jeu options">
      <header className="entete-options">
        <h1 ref={titre} className="titre-piece" tabIndex={-1}>
          Options
        </h1>
        {partieEnCours && <p className="sous-titre-options">le jeu est en pause</p>}
      </header>
      <div className="options-corps">
        <section>
          <h2 className="titre-section" id={idTaille}>
            Taille du texte
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
          <h2 className="titre-section">Son</h2>
          <Rail libelle="Général" coupe="COUPÉE" valeur={reglages.general} changer={(general) => changerReglages({ ...reglages, general })} />
          <Rail
            libelle="Effets sonores"
            detail="bips et clics du terminal"
            coupe="COUPÉS"
            valeur={reglages.effets}
            changer={(effets) => changerReglages({ ...reglages, effets })}
          />
          <Rail
            libelle="Ambiance"
            detail="bruit brun et carlingue"
            coupe="COUPÉE"
            valeur={reglages.ambiance}
            changer={(ambiance) => changerReglages({ ...reglages, ambiance })}
          />
        </section>
        <section>
          <h2 className="titre-section">Affichage</h2>
          <Bascule libelle="Lignes de balayage" actif={reglages.balayage} basculer={() => changerReglages({ ...reglages, balayage: !reglages.balayage })} />
          <Bascule
            libelle="Effet machine à écrire"
            actif={reglages.machineAEcrire}
            basculer={() => changerReglages({ ...reglages, machineAEcrire: !reglages.machineAEcrire })}
          />
          {!reglagesGardes && (
            <p className="retour-option" role="status">
              Cet appareil ne garde pas les réglages : ils valent jusqu’à la fermeture du jeu.
            </p>
          )}
        </section>
        {(partieEnCours || envoyerRapport !== undefined) && (
          <section>
            <h2 className="titre-section">Partie</h2>
            {partieEnCours && (
              <>
                <button type="button" className="ligne-option" disabled={occupe} onClick={() => setTelechargement(telecharger())} data-son="clic">
                  <span>
                    <span aria-hidden="true">▸ </span>
                    Télécharger ma partie
                  </span>
                  <span className="detail-option">fichier enregistré sur le téléphone</span>
                </button>
                <p className="retour-option" role="status" data-testid="telechargement">
                  {telechargement?.etat === 'pret' && `Fichier prêt : ${telechargement.nom}`}
                  {telechargement?.etat === 'echec' && 'Le téléchargement a échoué. Vous pouvez réessayer.'}
                </p>
              </>
            )}
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
              />
            )}
            {!partieEnCours ? null : confirmation ? (
              <section className="confirmation-options" aria-label="Confirmation d’abandon">
                <p ref={question} tabIndex={-1}>
                  Abandonner ? Cette partie ne pourra pas être reprise.
                </p>
                {abandonRefuse && (
                  <p className="avis-option" role="alert">
                    L’abandon n’a pas pu être enregistré. La partie est toujours en cours.
                  </p>
                )}
                <div>
                  <button type="button" className="secondaire" disabled={occupe} onClick={() => confirmer(false)} data-son="clic">
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="principal"
                    disabled={occupe}
                    onClick={() => void abandonner().then((fait) => setAbandonRefuse(!fait))}
                    data-son="confirmer"
                  >
                    Abandonner
                  </button>
                </div>
              </section>
            ) : (
              <button ref={danger} type="button" className="danger" disabled={occupe} onClick={() => confirmer(true)} data-son="clic">
                <span aria-hidden="true">⊘ </span>
                Abandonner la partie en cours
              </button>
            )}
          </section>
        )}
        {pr !== '' && empreinteCle !== undefined && <SectionValidation key={envois} empreinteCle={empreinteCle} />}
        <SectionMiseAJour miseAJour={miseAJour} partieEnCours={partieEnCours} occupe={occupe} />
        <p className="pied">
          V{version}
          {build !== '' && ` (${build})`}
          {commit !== '' && ` · ${commit.slice(0, 7)}`}
          {pr !== '' && ` · test PR #${pr}`}
        </p>
      </div>
      <div className="options-bas">
        <button type="button" className="secondaire" disabled={occupe} onClick={menuPrincipal} data-son="clic">
          Menu principal
        </button>
        {partieEnCours && (
          <button type="button" className="principal" disabled={occupe} onClick={reprendre} data-son="clic">
            Reprendre la partie
          </button>
        )}
      </div>
    </main>
  );
}

const LIBELLES_RAPPORT: Readonly<Record<TypeRapport, string>> = { bug: 'Signaler un bug', partie: 'Envoyer ma partie' };

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
}: {
  readonly validable: boolean;
  readonly apresEnvoi: () => void;
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
    bug: partieEnCours ? 'la partie en cours est jointe' : partieEnregistree ? 'la partie est jointe' : 'aucune partie à joindre',
    partie: 'partie et commentaire',
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
          {enAttente === 1 ? 'Un rapport attend le réseau pour partir.' : `${enAttente} rapports attendent le réseau pour partir.`}
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
      <h2 className="titre-section">Validation</h2>
      <div className="ligne-cle" data-testid="cle-validation">
        <span>Clé de ce téléphone</span>
        {empreinte === 'lecture' ? (
          <span className="detail-option">lecture…</span>
        ) : empreinte === 'illisible' ? (
          <span className="detail-option">illisible sur ce téléphone : « je valide » partira sans signature</span>
        ) : empreinte === null ? (
          <span className="detail-option">pas encore créée : elle le sera au premier « je valide » envoyé</span>
        ) : (
          <>
            <span className="empreinte-cle">{empreinteLisible(empreinte)}</span>
            <span className="detail-option">à comparer avec celle citée dans la PR</span>
          </>
        )}
      </div>
    </section>
  );
}

const SANS_ABONNEMENT = (): (() => void) => () => undefined;
const INDISPONIBLE = (): EtatMiseAJour => 'indisponible';

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
      <h2 className="titre-section">Mise à jour</h2>
      <button type="button" className="ligne-option" disabled={occupe || enCours} onClick={() => void miseAJour.chercher()} data-son="clic">
        <span>
          <span aria-hidden="true">▸ </span>
          {prete ? 'Installer la nouvelle version' : 'Chercher une mise à jour'}
        </span>
        <span className="detail-option">{partieEnCours ? 'le jeu redémarre, la partie est gardée' : 'le jeu redémarre s’il en trouve une'}</span>
      </button>
      <p className="retour-option" role="status" data-testid="mise-a-jour">
        {etat === 'recherche' && 'Recherche en cours…'}
        {etat === 'a_jour' && 'Le jeu est à jour.'}
        {etat === 'prete' && 'Une nouvelle version est prête.'}
        {etat === 'installation' && 'Installation de la nouvelle version…'}
        {etat === 'echec' && 'Impossible de vérifier. Le téléphone est-il connecté ?'}
      </p>
    </section>
  );
}

/** Bascule (12 §3.12) : libellé, puis « [OUI] » ou « [NON] » à droite ; lue comme un interrupteur. */
function Bascule({ libelle, actif, basculer }: { readonly libelle: string; readonly actif: boolean; readonly basculer: () => void }) {
  return (
    <button type="button" className="bascule" role="switch" aria-checked={actif} aria-label={libelle} onClick={basculer} data-son="clic">
      <span>{libelle}</span>
      <span className="valeur-bascule">{actif ? '[OUI]' : '[NON]'}</span>
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

/** Écran de fin après un abandon (12 §4.11) : le récit seulement, sans score (D-086) ; la partie ne se reprend pas (D-013). */
export function EcranFin({
  jeu,
  env,
  occupe,
  rejouer,
  nouvellePartie,
  menuPrincipal,
  envoyerPartie,
  pr = '',
}: {
  readonly jeu: Jeu;
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  readonly occupe: boolean;
  /** Même état de départ, nouveaux tirages (D-087, D-088). */
  readonly rejouer: () => void;
  readonly nouvellePartie: () => void;
  readonly menuPrincipal: () => void;
  /** ENVOYER MA PARTIE (12 §4.11) ; absent, pas de bouton. */
  readonly envoyerPartie?: (commentaire: string, valide: boolean) => Promise<Retour>;
  readonly pr?: string;
}) {
  const { textes } = env;
  const observation = observer(env.monde, jeu.partie.etat);
  const visitees = observation.visitees.map((piece) => nomPuce(textes, piece)).join(', ');
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titre.current?.focus();
  }, []);
  return (
    <main className="jeu fin">
      <header className="entete-piece entete-reveil">
        <p className="lieu-reveil">&gt; Fin de la partie_</p>
      </header>
      <section className="recit-fin" data-testid="fin">
        <h1 ref={titre} className="titre-fin" tabIndex={-1}>
          Partie abandonnée.
        </h1>
        <p>{remplir(textes.observation.abandon, { piece: nomDe(textes, observation.piece) })}</p>
        <div className="bilan-fin">
          <p>
            <span className="etiquette-fin">Pièces visitées :</span> {visitees}
          </p>
          <p>{remplir(textes.observation.terminee, {})}</p>
        </div>
      </section>
      <div className="actions-fin">
        <button type="button" className="principal" disabled={occupe} onClick={rejouer} data-son="clic">
          Rejouer cette station
        </button>
        <button type="button" className="secondaire" disabled={occupe} onClick={nouvellePartie} data-son="clic">
          Nouvelle partie
        </button>
        {/* Un abandon ne valide pas (D-099) : pas de « je valide » ici. */}
        {envoyerPartie !== undefined && <EnvoyerMaPartie envoyer={envoyerPartie} pr={pr} validable={false} occupe={occupe} />}
        <button type="button" className="discret" disabled={occupe} onClick={menuPrincipal} data-son="clic">
          Menu principal
        </button>
      </div>
    </main>
  );
}
