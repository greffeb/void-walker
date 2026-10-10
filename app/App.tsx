import { useCallback, useEffect, useState } from 'react';
import { observer, type OptionMenu } from '../engine';
import { libelleOption, rendreObservation } from '../content';
import { commencer, demarrer, jouerCommande, type Environnement, type Jeu } from './jeu';

type Ecran =
  | { readonly type: 'chargement' }
  | { readonly type: 'reprise_impossible'; readonly raison: string }
  | { readonly type: 'jeu'; readonly jeu: Jeu };

export function App({
  env,
  version,
  commit,
  pr,
}: {
  readonly env: Environnement;
  readonly version: string;
  readonly commit: string;
  readonly pr: string;
}) {
  const [ecran, setEcran] = useState<Ecran>({ type: 'chargement' });
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    let actif = true;
    void demarrer(env).then((demarrage) => {
      if (!actif) return;
      setEcran(demarrage.type === 'pret' ? { type: 'jeu', jeu: demarrage.jeu } : demarrage);
    });
    return () => {
      actif = false;
    };
  }, [env]);

  const choisir = useCallback(
    async (jeu: Jeu, option: OptionMenu) => {
      setOccupe(true);
      try {
        setEcran({ type: 'jeu', jeu: await jouerCommande(env, jeu, option.commande) });
      } finally {
        setOccupe(false);
      }
    },
    [env],
  );

  const recommencer = useCallback(async () => {
    setOccupe(true);
    try {
      setEcran({ type: 'jeu', jeu: await commencer(env) });
    } finally {
      setOccupe(false);
    }
  }, [env]);

  return (
    <main className="jeu">
      <header className="entete">
        <h1>Void Walker</h1>
      </header>
      {ecran.type === 'chargement' && <p className="attente">Chargement…</p>}
      {ecran.type === 'reprise_impossible' && (
        <section className="avis" role="alert">
          <p>La partie enregistrée ne peut pas reprendre.</p>
          <p className="detail">{ecran.raison}</p>
          <button type="button" disabled={occupe} onClick={() => void recommencer()}>
            Commencer une nouvelle partie
          </button>
        </section>
      )}
      {ecran.type === 'jeu' && <Partie jeu={ecran.jeu} env={env} occupe={occupe} choisir={choisir} />}
      <footer className="pied">
        <span>Version {version}</span>
        {commit !== '' && <span> · {commit.slice(0, 7)}</span>}
        {pr !== '' && <span> · version de test de la PR #{pr}</span>}
      </footer>
    </main>
  );
}

function Partie({
  jeu,
  env,
  occupe,
  choisir,
}: {
  readonly jeu: Jeu;
  readonly env: Environnement;
  readonly occupe: boolean;
  readonly choisir: (jeu: Jeu, option: OptionMenu) => Promise<void>;
}) {
  const observation = observer(env.monde, jeu.partie.etat);
  return (
    <>
      <section className="recit" data-testid="recit" aria-live="polite">
        {jeu.recit.map((phrase, index) => (
          <p key={index}>{phrase}</p>
        ))}
      </section>
      <section className="situation" data-testid="situation">
        {rendreObservation(env.textes, observation).map((ligne, index) => (
          <p key={index}>{ligne}</p>
        ))}
      </section>
      <nav className="actions" aria-label="Actions">
        {observation.menu.map((option) => {
          const { libelle, raison } = libelleOption(env.textes, option);
          return (
            <div className="action" key={`${option.action}:${option.cible.id}`}>
              <button type="button" disabled={occupe || !option.disponible} onClick={() => void choisir(jeu, option)}>
                {libelle}
              </button>
              {raison !== null && <span className="raison">{raison}</span>}
            </div>
          );
        })}
      </nav>
      <p
        className={jeu.sauvegarde === 'echec' ? 'sauvegarde echec' : 'sauvegarde'}
        data-testid="sauvegarde"
        data-actions={jeu.partie.etat.actions}
        data-etat={jeu.sauvegarde}
        role={jeu.sauvegarde === 'echec' ? 'alert' : undefined}
      >
        {jeu.sauvegarde === 'sauvegardee'
          ? `Partie sauvegardée · ${jeu.partie.etat.actions} action(s)`
          : 'La sauvegarde a échoué. Vous pouvez continuer : elle sera retentée à la prochaine action.'}
      </p>
    </>
  );
}
