import { useEffect, useId, useRef, useState } from 'react';
import { COMMENTAIRE_MAX, type Retour, type TypeRapport } from './rapports';
import { empreinteLisible } from './validation';
import { LIBELLES } from './libelles';

/** Texte montré après ENVOYER ; `null` pour la saisie en cours. */
export const RETOURS: Readonly<Record<Retour, string>> = LIBELLES.rapport.retours;

/** Le rapport est arrivé ou gardé sur l'appareil : le panneau se referme. Sinon il reste ouvert, commentaire compris. */
export function rapportPris(retour: Retour): boolean {
  return retour === 'envoye' || retour === 'garde' || retour === 'trop';
}

const INVITES: Readonly<Record<TypeRapport, string>> = LIBELLES.rapport.invites;

/**
 * Panneau d'un rapport, ouvert sous la ligne touchée (D-231) : commentaire facultatif (D-142), case « je valide » pour
 * l'envoi d'une partie finie depuis une version de test (D-096, D-099, D-132), ce qui est joint, ANNULER et ENVOYER.
 */
export function PanneauRapport({
  type,
  pr,
  validable = false,
  empreinteCle,
  partieJointe,
  envoyer,
  fermer,
}: {
  readonly type: TypeRapport;
  /** PR de la version de test, vide pour la version publique. */
  readonly pr: string;
  /** Partie allée au bout, dans une version de test : elle peut porter « je valide », signé par le téléphone (D-130). */
  readonly validable?: boolean;
  /** Empreinte de la clé de validation du téléphone, montrée sous « je valide » pour la comparer avec la PR (D-232). */
  readonly empreinteCle?: () => Promise<string | null>;
  readonly partieJointe: boolean;
  readonly envoyer: (commentaire: string, valide: boolean) => Promise<Retour>;
  /** `retour` : ce qu'il faut afficher sous la ligne une fois le panneau refermé ; `null` à l'annulation. */
  readonly fermer: (retour: Retour | null) => void;
}) {
  const id = useId();
  const avecCase = type === 'partie' && validable && pr !== '';
  const empreinte = useEmpreinte(avecCase ? empreinteCle : undefined);
  const champ = useRef<HTMLTextAreaElement>(null);
  const [commentaire, setCommentaire] = useState('');
  const [valide, setValide] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [refus, setRefus] = useState<Retour | null>(null);

  useEffect(() => {
    champ.current?.focus();
  }, []);

  const partir = async (): Promise<void> => {
    setEnvoi(true);
    setRefus(null);
    const retour = await envoyer(commentaire, type === 'partie' && validable && valide);
    setEnvoi(false);
    if (rapportPris(retour)) fermer(retour);
    else setRefus(retour);
  };

  const joint =
    type === 'bug'
      ? partieJointe
        ? LIBELLES.rapport.joint.partieEnCours
        : LIBELLES.rapport.joint.sansPartie
      : LIBELLES.rapport.joint.partieFinie;

  return (
    <section className="panneau-rapport" aria-label={type === 'bug' ? LIBELLES.commun.signalerBug : LIBELLES.commun.envoyerPartie} data-testid={`panneau-${type}`}>
      <label className="champ-rapport" htmlFor={id}>
        {LIBELLES.rapport.commentaire}
      </label>
      <textarea
        id={id}
        ref={champ}
        value={commentaire}
        maxLength={COMMENTAIRE_MAX}
        placeholder={INVITES[type]}
        rows={4}
        disabled={envoi}
        onChange={(evenement) => setCommentaire(evenement.currentTarget.value)}
      />
      <p className="compte-rapport" aria-hidden="true">
        {commentaire.length} / {COMMENTAIRE_MAX}
      </p>
      {avecCase && (
        <label className="case-rapport" data-son="clic">
          <input type="checkbox" className="lecteur-seul" checked={valide} disabled={envoi} onChange={() => setValide(!valide)} />
          <span className="valeur-case" aria-hidden="true">
            {valide ? '[X]' : '[ ]'}
          </span>
          <span>
            {LIBELLES.rapport.jeValide}
            <span className="detail-option">{LIBELLES.rapport.signature(pr)}</span>
          </span>
        </label>
      )}
      {avecCase && empreinte !== undefined && (
        <p className="cle-rapport" data-testid="cle-rapport">
          {LIBELLES.rapport.cleTelephone}{' '}
          {empreinte === null ? <span>{LIBELLES.rapport.cleCreeeAEnvoi}</span> : <span className="empreinte-cle">{empreinteLisible(empreinte)}</span>}
        </p>
      )}
      <p className="joint-rapport">{joint}</p>
      {refus !== null && (
        <p className="avis-option" role="alert">
          {RETOURS[refus]}
        </p>
      )}
      <div>
        <button type="button" className="secondaire" disabled={envoi} onClick={() => fermer(null)} data-son="clic">
          {LIBELLES.commun.annuler}
        </button>
        <button type="button" className="principal" disabled={envoi} onClick={() => void partir()} data-son="confirmer">
          {envoi ? LIBELLES.rapport.envoi : LIBELLES.rapport.envoyer}
        </button>
      </div>
    </section>
  );
}

/** Empreinte lue une fois : `undefined` tant qu'elle n'est pas lue (ou illisible), `null` si la clé n'existe pas encore. */
function useEmpreinte(lire: (() => Promise<string | null>) | undefined): string | null | undefined {
  const [empreinte, setEmpreinte] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    if (lire === undefined) return undefined;
    let actif = true;
    lire().then(
      (lue) => {
        if (actif) setEmpreinte(lue);
      },
      () => undefined,
    );
    return () => {
      actif = false;
    };
  }, [lire]);
  return empreinte;
}

/**
 * ENVOYER MA PARTIE d'une fin de partie (12 §4.11), discret : le même panneau s'ouvre à sa place, puis le retour reste
 * sous le bouton. `validable` : partie allée au bout, dans une version de test.
 */
export function EnvoyerMaPartie({
  envoyer,
  pr,
  validable,
  empreinteCle,
  occupe,
}: {
  readonly envoyer: (commentaire: string, valide: boolean) => Promise<Retour>;
  readonly pr: string;
  readonly validable: boolean;
  readonly empreinteCle?: () => Promise<string | null>;
  readonly occupe: boolean;
}) {
  const [envoi, setEnvoi] = useState<'ferme' | 'ouvert' | Retour>('ferme');
  const bouton = useRef<HTMLButtonElement>(null);
  if (envoi === 'ouvert') {
    return (
      <PanneauRapport
        type="partie"
        pr={pr}
        validable={validable}
        empreinteCle={empreinteCle}
        partieJointe
        envoyer={envoyer}
        fermer={(retour) => {
          setEnvoi(retour ?? 'ferme');
          // Le bouton revient au rendu suivant : le focus l'y attend.
          requestAnimationFrame(() => bouton.current?.focus());
        }}
      />
    );
  }
  return (
    <>
      <button ref={bouton} type="button" className="discret" disabled={occupe} onClick={() => setEnvoi('ouvert')} data-son="clic">
        {LIBELLES.commun.envoyerPartie}
      </button>
      {envoi !== 'ferme' && (
        <p className="retour-option" role="status" data-testid="retour-partie">
          {RETOURS[envoi]}
        </p>
      )}
    </>
  );
}