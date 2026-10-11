import { useCallback, useEffect, useState } from 'react';
import type { OptionMenu } from '../engine';
import { EcranJeu } from './EcranJeu';
import { commencer, demarrer, jouerOption, type Environnement, type Jeu } from './jeu';

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
        setEcran({ type: 'jeu', jeu: await jouerOption(env, jeu, option) });
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
    <div className="ecran">
      {ecran.type === 'jeu' ? (
        <EcranJeu jeu={ecran.jeu} env={env} occupe={occupe} choisir={choisir} nouvellePartie={() => void recommencer()} />
      ) : (
        <main className="jeu">
          <header className="entete-piece">
            <h1 className="titre-piece">Void Walker</h1>
          </header>
          <section className="recit">
            {ecran.type === 'chargement' && <p className="attente">Chargement…</p>}
            {ecran.type === 'reprise_impossible' && (
              <div className="avis" role="alert">
                <p>La partie enregistrée ne peut pas reprendre.</p>
                <p className="detail">{ecran.raison}</p>
                <button type="button" className="principal" disabled={occupe} onClick={() => void recommencer()}>
                  Commencer une nouvelle partie
                </button>
              </div>
            )}
          </section>
        </main>
      )}
      <footer className="pied">
        <span>Version {version}</span>
        {commit !== '' && <span> · {commit.slice(0, 7)}</span>}
        {pr !== '' && <span> · version de test de la PR #{pr}</span>}
      </footer>
      {/* Lignes de balayage (12 §2.3) : décoratives, jamais touchées ni lues. */}
      <div className="balayage" aria-hidden="true" />
    </div>
  );
}
