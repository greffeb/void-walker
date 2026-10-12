import { useCallback, useEffect, useState } from 'react';
import { observer, type OptionMenu } from '../engine';
import { EcranJeu, EcranReveil } from './EcranJeu';
import { commencer, demarrer, jouerOption, lireLus, marquerLus, sauvegardePresente, type Environnement, type Jeu } from './jeu';
import type { Reglages } from './reglages';

/** `lus` : messages d'IA Station déjà lus, à part du jeu pour ne pas réécrire le récit quand il change (D-186). */
type Ecran =
  | { readonly type: 'chargement' }
  | { readonly type: 'accueil'; readonly partiePresente: boolean; readonly confirmation: boolean }
  | { readonly type: 'reveil'; readonly jeu: Jeu; readonly lus: readonly string[] }
  | { readonly type: 'reprise_impossible' }
  | { readonly type: 'jeu'; readonly jeu: Jeu; readonly lus: readonly string[] };

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
    void sauvegardePresente(env).then(
      (partiePresente) => {
        if (actif) setEcran({ type: 'accueil', partiePresente, confirmation: false });
      },
      () => {
        if (actif) setEcran({ type: 'reprise_impossible' });
      },
    );
    return () => {
      actif = false;
    };
  }, [env]);

  const choisir = useCallback(
    async (jeu: Jeu, option: OptionMenu) => {
      setOccupe(true);
      try {
        const suivant = await jouerOption(env, jeu, option);
        setEcran((avant) => ({ type: 'jeu', jeu: suivant, lus: avant.type === 'jeu' ? avant.lus : [] }));
      } finally {
        setOccupe(false);
      }
    },
    [env],
  );

  const commencerNouvellePartie = useCallback(async () => {
    setOccupe(true);
    try {
      setEcran({ type: 'reveil', jeu: await commencer(env), lus: [] });
    } finally {
      setOccupe(false);
    }
  }, [env]);

  const reprendre = useCallback(async () => {
    setOccupe(true);
    try {
      const demarrage = await demarrer(env);
      if (demarrage.type !== 'pret') {
        setEcran({ type: 'reprise_impossible' });
        return;
      }
      if (demarrage.jeu.partie.etat.actions === 0) {
        const lus = await lireLus(env, demarrage.jeu.partie);
        setEcran({ type: 'reveil', jeu: demarrage.jeu, lus });
        return;
      }
      const lus = await lireLus(env, demarrage.jeu.partie);
      setEcran({ type: 'jeu', jeu: demarrage.jeu, lus });
    } finally {
      setOccupe(false);
    }
  }, [env]);

  const regarder = useCallback(
    async (jeu: Jeu, lus: readonly string[]) => {
      const option = observer(env.monde, jeu.partie.etat).menu.find((choix) => choix.action === 'regarder');
      if (option === undefined) return;
      setOccupe(true);
      try {
        setEcran({ type: 'jeu', jeu: await jouerOption(env, jeu, option), lus });
      } finally {
        setOccupe(false);
      }
    },
    [env],
  );

  /** Ouvrir la fenêtre d'IA Station : tous les messages reçus passent en lus, la partie ne change pas (12 §3.9). */
  const lireMessages = useCallback(
    (jeu: Jeu) => {
      const lus = jeu.partie.etat.messages;
      setEcran((avant) => (avant.type === 'jeu' && avant.jeu === jeu ? { ...avant, lus } : avant));
      void marquerLus(env, jeu.partie);
    },
    [env],
  );

  return (
    <div className="ecran">
      {ecran.type === 'accueil' ? (
        <main className="jeu accueil">
          <h1 className="titre-accueil" aria-label="VOID WALKER">
            <span>VOID</span>
            <span>WALKER▮</span>
          </h1>
          <div className="actions-accueil">
            {ecran.confirmation ? (
              <section className="confirmation-accueil" aria-label="Confirmation de nouvelle partie">
                <p>Une partie est en cours. La nouvelle partie la remplacera.</p>
                <div>
                  <button type="button" className="secondaire" disabled={occupe} onClick={() => setEcran({ ...ecran, confirmation: false })}>
                    Annuler
                  </button>
                  <button type="button" className="principal" disabled={occupe} onClick={() => void commencerNouvellePartie()}>
                    Commencer
                  </button>
                </div>
              </section>
            ) : (
              <>
                {ecran.partiePresente && (
                  <button type="button" className="principal" disabled={occupe} onClick={() => void reprendre()}>
                    Reprendre la partie
                  </button>
                )}
                <button
                  type="button"
                  className={ecran.partiePresente ? 'secondaire' : 'principal'}
                  disabled={occupe}
                  onClick={() =>
                    ecran.partiePresente
                      ? setEcran({ ...ecran, confirmation: true })
                      : void commencerNouvellePartie()
                  }
                >
                  Nouvelle partie
                </button>
              </>
            )}
          </div>
        </main>
      ) : ecran.type === 'reveil' ? (
        <EcranReveil
          jeu={ecran.jeu}
          env={env}
          machineAEcrire={reglages.machineAEcrire}
          occupe={occupe}
          regarder={() => void regarder(ecran.jeu, ecran.lus)}
        />
      ) : ecran.type === 'jeu' ? (
        <EcranJeu
          jeu={ecran.jeu}
          lus={ecran.lus}
          env={env}
          machineAEcrire={reglages.machineAEcrire}
          occupe={occupe}
          choisir={choisir}
          lireMessages={lireMessages}
          nouvellePartie={() => void commencerNouvellePartie()}
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
                <p>La partie enregistrée ne peut pas être reprise. Vous pouvez commencer une nouvelle partie.</p>
                <button type="button" className="principal" disabled={occupe} onClick={() => void commencerNouvellePartie()}>
                  Nouvelle partie
                </button>
              </div>
            )}
          </section>
        </main>
      )}
      {ecran.type !== 'accueil' && ecran.type !== 'reveil' && (
        <footer className="pied">
          <span>V{version}</span>
          {commit !== '' && <span> · {commit.slice(0, 7)}</span>}
          {pr !== '' && <span> · test PR #{pr}</span>}
        </footer>
      )}
      {/* Lignes de balayage (12 §2.3) : décoratives, jamais touchées ni lues. */}
      <div className="balayage" aria-hidden="true" />
    </div>
  );
}
