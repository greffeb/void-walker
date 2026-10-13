import { useEffect, useId, useRef, useState } from 'react';
import { COMMENTAIRE_MAX, type Retour, type TypeRapport } from './rapports';

/** Texte montré après ENVOYER ; `null` pour la saisie en cours. */
export const RETOURS: Readonly<Record<Retour, string>> = {
  envoye: 'Merci, le rapport est envoyé.',
  garde: 'Pas de réseau. Le rapport est gardé sur le téléphone et partira tout seul à la prochaine connexion.',
  trop: 'Trop d’envois rapprochés. Le rapport est gardé sur le téléphone et partira plus tard.',
  refuse: 'Le service n’a pas accepté ce rapport. Vous pouvez télécharger la partie à la place.',
  perdu: 'Pas de réseau, et ce téléphone ne peut pas garder le rapport. Réessayez plus tard.',
  patience: 'Un rapport vient de partir. Réessayez dans un instant.',
};

/** Le rapport est arrivé ou gardé sur l'appareil : le panneau se referme. Sinon il reste ouvert, commentaire compris. */
export function rapportPris(retour: Retour): boolean {
  return retour === 'envoye' || retour === 'garde' || retour === 'trop';
}

const INVITES: Readonly<Record<TypeRapport, string>> = {
  bug: 'Ce qui s’est passé, ce que vous attendiez…',
  partie: 'Votre avis sur la partie…',
};

/**
 * Panneau d'un rapport, ouvert sous la ligne touchée (12 §4.10, choix A du porteur) : commentaire facultatif (D-142), case
 * « je valide » pour un envoi de partie depuis une version de test (D-096, D-132), ce qui est joint, ANNULER et ENVOYER.
 */
export function PanneauRapport({
  type,
  pr,
  partieJointe,
  envoyer,
  fermer,
}: {
  readonly type: TypeRapport;
  /** PR de la version de test, vide pour la version publique. */
  readonly pr: string;
  readonly partieJointe: boolean;
  readonly envoyer: (commentaire: string, valide: boolean) => Promise<Retour>;
  /** `retour` : ce qu'il faut afficher sous la ligne une fois le panneau refermé ; `null` à l'annulation. */
  readonly fermer: (retour: Retour | null) => void;
}) {
  const id = useId();
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
    const retour = await envoyer(commentaire, type === 'partie' && valide);
    setEnvoi(false);
    if (rapportPris(retour)) fermer(retour);
    else setRefus(retour);
  };

  const joint =
    type === 'bug'
      ? partieJointe
        ? 'Joint : la partie jusqu’ici et l’écran affiché.'
        : 'Aucune partie en cours : seul le commentaire part.'
      : 'Joint : la partie complète et où elle en est.';

  return (
    <section className="panneau-rapport" aria-label={type === 'bug' ? 'Signaler un bug' : 'Envoyer ma partie'} data-testid={`panneau-${type}`}>
      <label className="champ-rapport" htmlFor={id}>
        Votre commentaire, facultatif
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
      {type === 'partie' && pr !== '' && (
        <label className="case-rapport" data-son="clic">
          <input type="checkbox" className="lecteur-seul" checked={valide} disabled={envoi} onChange={() => setValide(!valide)} />
          <span className="valeur-case" aria-hidden="true">
            {valide ? '[X]' : '[ ]'}
          </span>
          <span>
            Je valide cette aventure
            <span className="detail-option">version de test PR #{pr}</span>
          </span>
        </label>
      )}
      <p className="joint-rapport">{joint}</p>
      {refus !== null && (
        <p className="avis-option" role="alert">
          {RETOURS[refus]}
        </p>
      )}
      <div>
        <button type="button" className="secondaire" disabled={envoi} onClick={() => fermer(null)} data-son="clic">
          Annuler
        </button>
        <button type="button" className="principal" disabled={envoi} onClick={() => void partir()} data-son="confirmer">
          {envoi ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </section>
  );
}
