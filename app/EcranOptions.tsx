import { useEffect, useId, useRef, useState } from 'react';
import { observer } from '../engine';
import { nomDe, remplir } from '../content';
import { nomPuce } from './ecran';
import type { Environnement, Jeu } from './jeu';
import { TAILLES, type Reglages, type Taille } from './reglages';

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
  partieEnCours,
  occupe,
  telecharger,
  abandonner,
  menuPrincipal,
  reprendre,
  version,
  commit,
  pr,
}: {
  readonly reglages: Reglages;
  readonly changerReglages: (reglages: Reglages) => void;
  readonly partieEnCours: boolean;
  readonly occupe: boolean;
  readonly telecharger: () => Telechargement;
  /** `false` si l'abandon n'a pas pu être enregistré : la partie reste en cours. */
  readonly abandonner: () => Promise<boolean>;
  readonly menuPrincipal: () => void;
  readonly reprendre: () => void;
  readonly version: string;
  readonly commit: string;
  readonly pr: string;
}) {
  const idTaille = useId();
  const [telechargement, setTelechargement] = useState<Telechargement>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [abandonRefuse, setAbandonRefuse] = useState(false);
  const question = useRef<HTMLParagraphElement>(null);
  const danger = useRef<HTMLButtonElement>(null);
  /** Le focus suit la confirmation : sur sa question à l'ouverture, sur le bouton d'abandon à l'annulation (12 §7). */
  const focusApres = useRef(false);

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
        <h1 className="titre-piece">Options</h1>
        {partieEnCours && <p className="sous-titre-options">le jeu est en pause</p>}
      </header>
      <div className="options-corps">
        <section>
          <h2 className="titre-section" id={idTaille}>
            Taille du texte
          </h2>
          <div className="segments" role="radiogroup" aria-labelledby={idTaille}>
            {TAILLES.map((taille) => (
              <label key={taille} className={taille === reglages.taille ? 'segment actif' : 'segment'}>
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
          <h2 className="titre-section">Affichage</h2>
          <Bascule libelle="Lignes de balayage" actif={reglages.balayage} basculer={() => changerReglages({ ...reglages, balayage: !reglages.balayage })} />
          <Bascule
            libelle="Effet machine à écrire"
            actif={reglages.machineAEcrire}
            basculer={() => changerReglages({ ...reglages, machineAEcrire: !reglages.machineAEcrire })}
          />
        </section>
        {partieEnCours && (
          <section>
            <h2 className="titre-section">Partie</h2>
            <button type="button" className="ligne-option" disabled={occupe} onClick={() => setTelechargement(telecharger())}>
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
            {confirmation ? (
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
                  <button type="button" className="secondaire" disabled={occupe} onClick={() => confirmer(false)}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="principal"
                    disabled={occupe}
                    onClick={() => void abandonner().then((fait) => setAbandonRefuse(!fait))}
                  >
                    Abandonner
                  </button>
                </div>
              </section>
            ) : (
              <button ref={danger} type="button" className="danger" disabled={occupe} onClick={() => confirmer(true)}>
                <span aria-hidden="true">⊘ </span>
                Abandonner la partie en cours
              </button>
            )}
          </section>
        )}
        <p className="pied">
          V{version}
          {commit !== '' && ` · ${commit.slice(0, 7)}`}
          {pr !== '' && ` · test PR #${pr}`}
        </p>
      </div>
      <div className="options-bas">
        <button type="button" className="secondaire" disabled={occupe} onClick={menuPrincipal}>
          Menu principal
        </button>
        {partieEnCours && (
          <button type="button" className="principal" disabled={occupe} onClick={reprendre}>
            Reprendre la partie
          </button>
        )}
      </div>
    </main>
  );
}

/** Bascule (12 §3.12) : libellé, puis « [OUI] » ou « [NON] » à droite ; lue comme un interrupteur. */
function Bascule({ libelle, actif, basculer }: { readonly libelle: string; readonly actif: boolean; readonly basculer: () => void }) {
  return (
    <button type="button" className="bascule" role="switch" aria-checked={actif} aria-label={libelle} onClick={basculer}>
      <span>{libelle}</span>
      <span className="valeur-bascule">{actif ? '[OUI]' : '[NON]'}</span>
    </button>
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
}: {
  readonly jeu: Jeu;
  readonly env: Pick<Environnement, 'monde' | 'textes'>;
  readonly occupe: boolean;
  /** Même état de départ, nouveaux tirages (D-087, D-088). */
  readonly rejouer: () => void;
  readonly nouvellePartie: () => void;
  readonly menuPrincipal: () => void;
}) {
  const { textes } = env;
  const observation = observer(env.monde, jeu.partie.etat);
  const visitees = observation.visitees.map((piece) => nomPuce(textes, piece)).join(', ');
  return (
    <main className="jeu fin">
      <header className="entete-piece entete-reveil">
        <p className="lieu-reveil">&gt; Fin de la partie_</p>
      </header>
      <section className="recit-fin" data-testid="fin">
        <h1 className="titre-fin">Partie abandonnée.</h1>
        <p>{remplir(textes.observation.abandon, { piece: nomDe(textes, observation.piece) })}</p>
        <div className="bilan-fin">
          <p>
            <span className="etiquette-fin">Pièces visitées :</span> {visitees}
          </p>
          <p>{remplir(textes.observation.terminee, {})}</p>
        </div>
      </section>
      <div className="actions-fin">
        <button type="button" className="principal" disabled={occupe} onClick={rejouer}>
          Rejouer cette station
        </button>
        <button type="button" className="secondaire" disabled={occupe} onClick={nouvellePartie}>
          Nouvelle partie
        </button>
        <button type="button" className="discret" disabled={occupe} onClick={menuPrincipal}>
          Menu principal
        </button>
      </div>
    </main>
  );
}
