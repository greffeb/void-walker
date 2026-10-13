import { useCallback, useEffect, useState } from 'react';
import { observer, type Evenement, type OptionMenu } from '../engine';
import { EcranJeu, EcranReveil } from './EcranJeu';
import { EcranFin, EcranOptions, type Telechargement } from './EcranOptions';
import {
  abandonner,
  charger,
  commencer,
  demarrer,
  fichierPartie,
  jouerOption,
  lireLus,
  marquerLus,
  sauvegardePresente,
  type Environnement,
  type Jeu,
} from './jeu';
import type { Reglages } from './reglages';
import { SonContexte, sonDeFermeture, sonDuToucher } from './son/contexte';
import { signauxApres } from './son/declencheurs';
import { SILENCE, type Son } from './son/moteur';
import type { Signal } from './son/recettes';

const AUCUN_SIGNAL: readonly Signal[] = [];

/** Événements du pas qui vient d'être joué ; aucun si la partie n'a pas avancé (refus, consultation). */
function evenementsDuPas(avant: Jeu, apres: Jeu): readonly Evenement[] {
  return apres.partie === avant.partie ? [] : apres.partie.derniers;
}

/** `lus` : messages d'IA Station déjà lus, à part du jeu pour ne pas réécrire le récit quand il change (D-186). */
type Ecran =
  | { readonly type: 'chargement' }
  | { readonly type: 'accueil'; readonly partiePresente: boolean; readonly confirmation: boolean }
  | { readonly type: 'reveil'; readonly jeu: Jeu; readonly lus: readonly string[] }
  | { readonly type: 'reprise_impossible' }
  /** `signaux` : ceux de la dernière action, annoncés une fois (15 §2.2) ; aucun à la reprise ni au retour des options. */
  | { readonly type: 'jeu'; readonly jeu: Jeu; readonly lus: readonly string[]; readonly signaux: readonly Signal[] }
  /** Options (12 §4.10) ouvertes depuis l'accueil ou le jeu ; `jeu` : la partie enregistrée, `null` s'il n'y en a pas. */
  | { readonly type: 'options'; readonly depuis: 'accueil' | 'jeu'; readonly jeu: Jeu | null; readonly lus: readonly string[] }
  /** Fin après abandon (12 §4.11) : la partie n'est plus enregistrée. */
  | { readonly type: 'fin'; readonly jeu: Jeu };

/** Télécharge l'export de la partie sur l'appareil (C-09 §5) ; le retour est visible, prêt ou échec. */
function telechargerPartie(env: Environnement, jeu: Jeu): Telechargement {
  try {
    const { nom, contenu } = fichierPartie(env, jeu.partie, new Date());
    const adresse = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
    const lien = document.createElement('a');
    lien.href = adresse;
    lien.download = nom;
    lien.hidden = true;
    document.body.append(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(adresse), 60_000);
    return { etat: 'pret', nom };
  } catch {
    return { etat: 'echec' };
  }
}

export function App({
  env,
  reglages: reglagesInitiaux,
  garderReglages,
  version,
  commit,
  pr,
  son = SILENCE,
}: {
  readonly env: Environnement;
  readonly reglages: Reglages;
  /** Garde les réglages sur l'appareil, hors de la sauvegarde de partie (12 §4.10) ; `false` si l'appareil refuse. */
  readonly garderReglages?: (reglages: Reglages) => boolean;
  readonly version: string;
  readonly commit: string;
  readonly pr: string;
  /** Moteur du son (15 §6) ; muet par défaut, pour le rendu côté serveur et les tests. */
  readonly son?: Son;
}) {
  const [ecran, setEcran] = useState<Ecran>({ type: 'chargement' });
  const [occupe, setOccupe] = useState(false);
  const [reglages, setReglages] = useState(reglagesInitiaux);
  const [reglagesGardes, setReglagesGardes] = useState(true);

  // Les rails s'appliquent pendant le glissé (15 §4) ; un `Reglages` porte les trois niveaux.
  useEffect(() => {
    son.regler(reglages);
  }, [son, reglages]);

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
        const signaux = signauxApres(observer(env.monde, jeu.partie.etat), observer(env.monde, suivant.partie.etat), evenementsDuPas(jeu, suivant));
        setEcran((avant) => ({ type: 'jeu', jeu: suivant, lus: avant.type === 'jeu' ? avant.lus : [], signaux }));
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
      setEcran({ type: 'jeu', jeu: demarrage.jeu, lus, signaux: AUCUN_SIGNAL });
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
        const suivant = await jouerOption(env, jeu, option);
        const signaux = signauxApres(observer(env.monde, jeu.partie.etat), observer(env.monde, suivant.partie.etat), evenementsDuPas(jeu, suivant));
        setEcran({ type: 'jeu', jeu: suivant, lus, signaux });
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

  const changerReglages = useCallback(
    (nouveaux: Reglages) => {
      setReglages(nouveaux);
      setReglagesGardes(garderReglages?.(nouveaux) ?? true);
    },
    [garderReglages],
  );

  const allerAccueil = useCallback(async () => {
    setOccupe(true);
    try {
      setEcran({ type: 'accueil', partiePresente: await sauvegardePresente(env), confirmation: false });
    } catch {
      setEcran({ type: 'reprise_impossible' });
    } finally {
      setOccupe(false);
    }
  }, [env]);

  /** Depuis l'accueil, la partie enregistrée est lue, jamais créée ni modifiée. */
  const optionsDepuisAccueil = useCallback(async () => {
    setOccupe(true);
    try {
      const charge = await charger(env);
      const jeu = charge.type === 'pret' ? charge.jeu : null;
      setEcran({ type: 'options', depuis: 'accueil', jeu, lus: jeu === null ? [] : await lireLus(env, jeu.partie) });
    } finally {
      setOccupe(false);
    }
  }, [env]);

  /** Abandon confirmé (C-08 §4) : l'écran de fin seulement une fois la partie retirée de l'appareil. */
  const abandonnerPartie = useCallback(
    async (jeu: Jeu): Promise<boolean> => {
      setOccupe(true);
      try {
        const fait = await abandonner(env);
        if (fait) setEcran({ type: 'fin', jeu });
        return fait;
      } finally {
        setOccupe(false);
      }
    },
    [env],
  );

  const ouvrirOptions = (jeu: Jeu, lus: readonly string[]): void => setEcran({ type: 'options', depuis: 'jeu', jeu, lus });
  const enCours = ecran.type === 'options' && ecran.jeu !== null && !observer(env.monde, ecran.jeu.partie.etat).terminee ? ecran.jeu : null;

  return (
    <SonContexte.Provider value={son}>
      {/* Son (15 §2.1, §5) : un toucher ouvre l'audio ; un clic sonne selon le data-son touché, sauf si l'écran l'a annulé ;
          Échap qui referme une bulle (touche déjà traitée) sonne comme ✕. */}
      <div
        className="ecran"
        data-taille={reglages.taille}
        onPointerDownCapture={() => son.debloquer()}
        onKeyDownCapture={() => son.debloquer()}
        onClick={(evenement) => {
          son.debloquer();
          const geste = evenement.defaultPrevented ? null : sonDuToucher(evenement.target);
          if (geste !== null) son.geste(geste);
        }}
        onKeyDown={(evenement) => {
          if (evenement.key === 'Escape' && evenement.defaultPrevented) son.geste(sonDeFermeture(evenement.target));
        }}
      >
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
                    <button type="button" className="secondaire" disabled={occupe} onClick={() => setEcran({ ...ecran, confirmation: false })} data-son="clic">
                      Annuler
                    </button>
                    <button type="button" className="principal" disabled={occupe} onClick={() => void commencerNouvellePartie()} data-son="confirmer">
                      Commencer
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  {ecran.partiePresente && (
                    <button type="button" className="principal" disabled={occupe} onClick={() => void reprendre()} data-son="clic">
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
                    data-son="clic"
                  >
                    Nouvelle partie
                  </button>
                  <button type="button" className="discret" disabled={occupe} onClick={() => void optionsDepuisAccueil()} data-son="clic">
                    Options
                  </button>
                </>
              )}
            </div>
          </main>
        ) : ecran.type === 'options' ? (
          <EcranOptions
            reglages={reglages}
            changerReglages={changerReglages}
            reglagesGardes={reglagesGardes}
            partieEnCours={enCours !== null}
            occupe={occupe}
            telecharger={() => (enCours === null ? { etat: 'echec' } : telechargerPartie(env, enCours))}
            abandonner={() => (enCours === null ? Promise.resolve(false) : abandonnerPartie(enCours))}
            menuPrincipal={() => void allerAccueil()}
            reprendre={() => {
              if (enCours === null) return;
              // Depuis le jeu, retour au même écran, sans réécrire le récit ; depuis l'accueil, comme REPRENDRE LA PARTIE.
              const reveil = ecran.depuis === 'accueil' && enCours.partie.etat.actions === 0;
              setEcran(reveil ? { type: 'reveil', jeu: enCours, lus: ecran.lus } : { type: 'jeu', jeu: enCours, lus: ecran.lus, signaux: AUCUN_SIGNAL });
            }}
            version={version}
            commit={commit}
            pr={pr}
          />
        ) : ecran.type === 'fin' ? (
          <EcranFin
            jeu={ecran.jeu}
            env={env}
            occupe={occupe}
            rejouer={() => void commencerNouvellePartie()}
            nouvellePartie={() => void commencerNouvellePartie()}
            menuPrincipal={() => void allerAccueil()}
          />
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
            ouvrirOptions={() => ouvrirOptions(ecran.jeu, ecran.lus)}
          signaux={ecran.signaux}
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
                  <button type="button" className="principal" disabled={occupe} onClick={() => void commencerNouvellePartie()} data-son="clic">
                    Nouvelle partie
                  </button>
                </div>
              )}
            </section>
          </main>
        )}
        {/* Lignes de balayage (12 §2.3) : décoratives, jamais touchées ni lues ; désactivables dans les options. */}
        {reglages.balayage && <div className="balayage" aria-hidden="true" />}
      </div>
    </SonContexte.Provider>
  );
}
