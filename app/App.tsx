import { useCallback, useEffect, useState } from 'react';
import type { OptionMenu } from '../engine';
import { EcranJeu } from './EcranJeu';
import { commencer, demarrer, jouerOption, lireLus, marquerLus, type Environnement, type Jeu } from './jeu';
import type { Reglages } from './reglages';

/** `lus` : messages d'IA Station déjà lus, à part du jeu pour ne pas réécrire le récit quand il change (D-186). */
type Ecran =
  | { readonly type: 'chargement' }
  | { readonly type: 'reprise_impossible'; readonly raison: string }
  | { readonly type: 'jeu'; readonly jeu: Jeu; readonly lus: number };

export function App({
  env,
  reglages,
  version,
  commit,
  pr,
}: {
  readonly env: Environnement;
  readonly reglages: Reglages;
  readonly version: string;
  readonly commit: string;
  readonly pr: string;
}) {
  const [ecran, setEcran] = useState<Ecran>({ type: 'chargement' });
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    let actif = true;
    void demarrer(env).then(async (demarrage) => {
      const lus = demarrage.type === 'pret' ? await lireLus(env, demarrage.jeu.partie) : 0;
      if (!actif) return;
      setEcran(demarrage.type === 'pret' ? { type: 'jeu', jeu: demarrage.jeu, lus } : demarrage);
    });
    return () => {
      actif = false;
    };
  }, [env]);

  const choisir = useCallback(
    async (jeu: Jeu, option: OptionMenu) => {
      setOccupe(true);
      try {
        const suivant = await jouerOption(env, jeu, option);
        setEcran((avant) => ({ type: 'jeu', jeu: suivant, lus: avant.type === 'jeu' ? avant.lus : 0 }));
      } finally {
        setOccupe(false);
      }
    },
    [env],
  );

  const recommencer = useCallback(async () => {
    setOccupe(true);
    try {
      setEcran({ type: 'jeu', jeu: await commencer(env), lus: 0 });
    } finally {
      setOccupe(false);
    }
  }, [env]);

  /** Ouvrir la fenêtre d'IA Station : tous les messages reçus passent en lus, la partie ne change pas (12 §3.9). */
  const lireMessages = useCallback(
    (jeu: Jeu) => {
      const lus = jeu.partie.etat.messages.length;
      setEcran((avant) => (avant.type === 'jeu' && avant.jeu === jeu ? { ...avant, lus } : avant));
      void marquerLus(env, jeu.partie);
    },
    [env],
  );

  return (
    <div className="ecran">
      {ecran.type === 'jeu' ? (
        <EcranJeu
          jeu={ecran.jeu}
          lus={ecran.lus}
          env={env}
          machineAEcrire={reglages.machineAEcrire}
          occupe={occupe}
          choisir={choisir}
          lireMessages={lireMessages}
          nouvellePartie={() => void recommencer()}
        />
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
        <span>V{version}</span>
        {commit !== '' && <span> · {commit.slice(0, 7)}</span>}
        {pr !== '' && <span> · test PR #{pr}</span>}
      </footer>
      {/* Lignes de balayage (12 §2.3) : décoratives, jamais touchées ni lues. */}
      <div className="balayage" aria-hidden="true" />
    </div>
  );
}
