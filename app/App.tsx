import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { observer, type Evenement, type OptionMenu, type Partie } from '../engine';
import type { EntreeMonde } from '../content';
import type { Chronometre } from './duree';
import { EcranJeu, EcranReveil } from './EcranJeu';
import { EcranFin } from './EcranFin';
import { EcranIntro } from './EcranIntro';
import { EcranOptions, type Telechargement } from './EcranOptions';
import {
  abandonner,
  carteANouveau,
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
import type { Installation } from './installation';
import type { Intro } from './intro';
import type { MiseAJour } from './miseAJour';
import { composerRapport, signerRapport, type Rapports, type Retour, type TypeRapport } from './rapports';
import type { Signataire } from './validation';
import type { Reglages } from './reglages';
import { SonContexte, sonDeFermeture, sonDuToucher } from './son/contexte';
import { signauxApres } from './son/declencheurs';
import { SILENCE, type Son } from './son/moteur';
import type { Signal } from './son/recettes';
import type { EtatVerification } from './verification';
import { LIBELLES } from './libelles';

const AUCUN_SIGNAL: readonly Signal[] = [];
const SANS_ABONNEMENT = (): (() => void) => () => undefined;
const AUCUN = (): number => 0;

/** Événements du pas qui vient d'être joué ; aucun si la partie n'a pas avancé (refus, consultation). */
function evenementsDuPas(avant: Jeu, apres: Jeu): readonly Evenement[] {
  return apres.partie === avant.partie ? [] : apres.partie.derniers;
}

/** `lus` : messages d'IA Station déjà lus, à part du jeu pour ne pas réécrire le récit quand il change (D-186). */
type Ecran =
  | { readonly type: 'chargement' }
  | { readonly type: 'accueil'; readonly partiePresente: boolean; readonly confirmation: boolean }
  /** Intro de NOUVELLE PARTIE (12 §4.1 bis, D-308) : la partie est déjà créée et enregistrée, DÉMARRER mène au réveil. */
  | { readonly type: 'intro'; readonly jeu: Jeu; readonly numero: number }
  | { readonly type: 'reveil'; readonly jeu: Jeu; readonly lus: readonly string[] }
  | { readonly type: 'reprise_impossible' }
  /** `signaux` : ceux de la dernière action, annoncés une fois (15 §2.2) ; aucun à la reprise ni au retour des options. */
  | { readonly type: 'jeu'; readonly jeu: Jeu; readonly lus: readonly string[]; readonly signaux: readonly Signal[]; readonly carteANouveau: boolean }
  /** Options (12 §4.10) ouvertes depuis l'accueil ou le jeu ; `jeu` : la partie enregistrée, `null` s'il n'y en a pas. */
  | { readonly type: 'options'; readonly depuis: 'accueil' | 'jeu'; readonly jeu: Jeu | null; readonly lus: readonly string[] }
  /** Fin (12 §4.11) : après un abandon, la partie n'est plus enregistrée ; après une défaite ou une évacuation, elle l'est encore. */
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
  env: envInitial,
  nouvelleStation,
  reglages: reglagesInitiaux,
  garderReglages,
  version,
  build = '',
  commit,
  pr,
  son = SILENCE,
  miseAJour,
  installation,
  rapports,
  signataire,
  verification,
  chronometre,
  intro,
}: {
  readonly env: Environnement;
  /** Monde de chaque NOUVELLE PARTIE (#152) ; absent, toujours celui de `env`. REJOUER CETTE STATION garde le monde en cours. */
  readonly nouvelleStation?: () => EntreeMonde;
  readonly reglages: Reglages;
  /** Garde les réglages sur l'appareil, hors de la sauvegarde de partie (12 §4.10) ; `false` si l'appareil refuse. */
  readonly garderReglages?: (reglages: Reglages) => boolean;
  readonly version: string;
  /** Numéro de construction : nombre de commits de la version publiée (D-227) ; vide hors publication. */
  readonly build?: string;
  readonly commit: string;
  readonly pr: string;
  /** Moteur du son (15 §6) ; muet par défaut, pour le rendu côté serveur et les tests. */
  readonly son?: Son;
  /** Mise à jour de l'appli installée (D-227) ; absente hors du navigateur. */
  readonly miseAJour?: MiseAJour;
  /** Installation sur l'écran d'accueil (#174) ; absente hors du navigateur. */
  readonly installation?: Installation;
  /** Service de rapports (C-10 §3) ; absent, pas de « Signaler un bug » ni d'« Envoyer ma partie ». */
  readonly rapports?: Rapports;
  /** Clé de validation du téléphone (C-10 §4) ; absente, « je valide » part sans signature. */
  readonly signataire?: Signataire;
  /** État de la vérification automatique de la version de test (#180). */
  readonly verification?: () => Promise<EtatVerification>;
  /** Durée de la partie, écran allumé (#204) ; absent, les rapports la disent non mesurée. */
  readonly chronometre?: Chronometre;
  /** Intro de NOUVELLE PARTIE (D-308) ; absente, NOUVELLE PARTIE mène droit au réveil. */
  readonly intro?: Intro;
}) {
  const [ecran, setEcran] = useState<Ecran>({ type: 'chargement' });
  // Le monde change à chaque NOUVELLE PARTIE ; le stockage, la version et la graine restent ceux du lancement.
  const [env, setEnv] = useState(envInitial);
  const { stockage } = env;
  const empreinteCle = useMemo(() => (signataire === undefined ? undefined : () => signataire.empreinte()), [signataire]);
  const rapportsEnAttente = useSyncExternalStore(rapports?.abonner ?? SANS_ABONNEMENT, rapports?.enAttente ?? AUCUN, rapports?.enAttente ?? AUCUN);
  const [occupe, setOccupe] = useState(false);
  const [reglages, setReglages] = useState(reglagesInitiaux);
  const [reglagesGardes, setReglagesGardes] = useState(true);

  // Les rails s'appliquent pendant le glissé (15 §4) ; un `Reglages` porte les trois niveaux.
  useEffect(() => {
    son.regler(reglages);
  }, [son, reglages]);

  // Accueil au lancement seulement : le stockage ne change pas avec la station, une NOUVELLE PARTIE ne ramène pas à l'accueil.
  useEffect(() => {
    let actif = true;
    void sauvegardePresente({ stockage }).then(
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
  }, [stockage]);

  const choisir = useCallback(
    async (jeu: Jeu, option: OptionMenu) => {
      setOccupe(true);
      try {
        const suivant = await jouerOption(env, jeu, option);
        const signaux = signauxApres(observer(env.monde, jeu.partie.etat), observer(env.monde, suivant.partie.etat), evenementsDuPas(jeu, suivant));
        setEcran((avant) => ({
          type: 'jeu',
          jeu: suivant,
          lus: avant.type === 'jeu' ? avant.lus : [],
          signaux,
          carteANouveau: carteANouveau(avant.type === 'jeu' && avant.carteANouveau, evenementsDuPas(jeu, suivant)),
        }));
      } finally {
        setOccupe(false);
      }
    },
    [env],
  );

  /**
   * Partie neuve sur `cible`, qui devient le monde en cours avec l'écran de réveil ; avec `avecIntro`, l'intro passe d'abord
   * pour une station tirée (D-308). REJOUER CETTE STATION n'en a pas.
   */
  const commencerSur = useCallback(
    async (cible: Environnement, avecIntro = false) => {
      setOccupe(true);
      try {
        const jeu = await commencer(cible);
        setEnv(cible);
        const numero = avecIntro ? (intro?.numero(cible.monde.id) ?? null) : null;
        if (intro === undefined || numero === null) {
          setEcran({ type: 'reveil', jeu, lus: [] });
          return;
        }
        setEcran({ type: 'intro', jeu, numero });
      } finally {
        setOccupe(false);
      }
    },
    [intro],
  );

  const commencerNouvellePartie = useCallback(async () => {
    const station = nouvelleStation?.();
    await commencerSur(station === undefined ? env : { ...env, monde: station.monde, textes: station.textes }, true);
  }, [env, nouvelleStation, commencerSur]);

  const reprendre = useCallback(async () => {
    setOccupe(true);
    try {
      const demarrage = await demarrer(env);
      if (demarrage.type !== 'pret') {
        setEcran({ type: 'reprise_impossible' });
        return;
      }
      // Une partie finie rouvre sur son écran de fin (C-09 S-05, D-286).
      if (observer(env.monde, demarrage.jeu.partie.etat).terminee) {
        setEcran({ type: 'fin', jeu: demarrage.jeu });
        return;
      }
      if (demarrage.jeu.partie.etat.actions === 0) {
        const lus = await lireLus(env, demarrage.jeu.partie);
        setEcran({ type: 'reveil', jeu: demarrage.jeu, lus });
        return;
      }
      const lus = await lireLus(env, demarrage.jeu.partie);
      // shortcut: le « ! » de CARTE se perd hors de l'écran de jeu ; à garder avec les messages lus si le porteur le regrette.
      setEcran({ type: 'jeu', jeu: demarrage.jeu, lus, signaux: AUCUN_SIGNAL, carteANouveau: false });
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
        setEcran({ type: 'jeu', jeu: suivant, lus, signaux, carteANouveau: carteANouveau(false, evenementsDuPas(jeu, suivant)) });
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

  /** Ouvrir la carte : le « ! » du capteur s'éteint (créature mobile lot 3). */
  const voirCarte = useCallback(() => {
    setEcran((avant) => (avant.type === 'jeu' && avant.carteANouveau ? { ...avant, carteANouveau: false } : avant));
  }, []);

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
    void rapports?.renvoyer();
    setOccupe(true);
    try {
      const charge = await charger(env);
      const jeu = charge.type === 'pret' ? charge.jeu : null;
      setEcran({ type: 'options', depuis: 'accueil', jeu, lus: jeu === null ? [] : await lireLus(env, jeu.partie) });
    } finally {
      setOccupe(false);
    }
  }, [env, rapports]);

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

  const envoyerRapport = (type: TypeRapport, jeu: Jeu | null, commentaire: string, valide: boolean): Promise<Retour> => {
    if (rapports === undefined) return Promise.resolve('refuse');
    const duree = jeu === null ? null : (chronometre?.secondes(jeu.partie) ?? null);
    const rapport = composerRapport(env.monde, { version, build, commit, pr }, type, jeu, commentaire, valide, duree);
    return signerRapport(rapport, signataire).then((signe) => rapports.envoyer(signe));
  };

  const ouvrirOptions = (jeu: Jeu, lus: readonly string[]): void => {
    void rapports?.renvoyer();
    setEcran({ type: 'options', depuis: 'jeu', jeu, lus });
  };
  const enCours = ecran.type === 'options' && ecran.jeu !== null && !observer(env.monde, ecran.jeu.partie.etat).terminee ? ecran.jeu : null;

  // Le temps court du réveil à l'action qui finit la partie, options ouvertes en cours de partie comprises (D-280).
  const partieQuiCourt: Partie | null =
    ecran.type === 'reveil'
      ? ecran.jeu.partie
      : ecran.type === 'jeu' && !observer(env.monde, ecran.jeu.partie.etat).terminee
        ? ecran.jeu.partie
        : ecran.type === 'options' && ecran.depuis === 'jeu'
          ? (enCours?.partie ?? null)
          : null;
  useEffect(() => {
    chronometre?.suivre(partieQuiCourt);
  }, [chronometre, partieQuiCourt]);

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
                <section className="confirmation-accueil" aria-label={LIBELLES.accueil.confirmation}>
                  <p>{LIBELLES.accueil.remplacement}</p>
                  <div>
                    <button type="button" className="secondaire" disabled={occupe} onClick={() => setEcran({ ...ecran, confirmation: false })} data-son="clic">
                      {LIBELLES.commun.annuler}
                    </button>
                    <button type="button" className="principal" disabled={occupe} onClick={() => void commencerNouvellePartie()} data-son="confirmer">
                      {LIBELLES.accueil.commencer}
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  {ecran.partiePresente && (
                    <button type="button" className="principal" disabled={occupe} onClick={() => void reprendre()} data-son="clic">
                      {LIBELLES.commun.reprendrePartie}
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
                    {LIBELLES.commun.nouvellePartie}
                  </button>
                  <button type="button" className="discret" disabled={occupe} onClick={() => void optionsDepuisAccueil()} data-son="clic">
                    {LIBELLES.commun.options}
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
              // shortcut: le « ! » de CARTE se perd hors de l'écran de jeu ; à garder avec les messages lus si le porteur le regrette.
              setEcran(reveil ? { type: 'reveil', jeu: enCours, lus: ecran.lus } : { type: 'jeu', jeu: enCours, lus: ecran.lus, signaux: AUCUN_SIGNAL, carteANouveau: false });
            }}
            version={version}
            build={build}
            commit={commit}
            pr={pr}
            miseAJour={miseAJour}
            installation={installation}
            partieEnregistree={ecran.jeu !== null}
            envoyerRapport={rapports === undefined ? undefined : (type, commentaire, valide) => envoyerRapport(type, ecran.jeu, commentaire, valide)}
            rapportsEnAttente={rapportsEnAttente}
            partieFinie={ecran.jeu !== null && observer(env.monde, ecran.jeu.partie.etat).terminee}
            empreinteCle={empreinteCle}
            verification={verification}
          />
        ) : ecran.type === 'fin' ? (
          <EcranFin
            jeu={ecran.jeu}
            env={env}
            machineAEcrire={reglages.machineAEcrire}
            occupe={occupe}
            rejouer={() => void commencerSur(env)}
            nouvellePartie={() => void commencerNouvellePartie()}
            menuPrincipal={() => void allerAccueil()}
            envoyerPartie={rapports === undefined ? undefined : (commentaire, valide) => envoyerRapport('partie', ecran.jeu, commentaire, valide)}
            pr={pr}
            empreinteCle={empreinteCle}
          />
        ) : ecran.type === 'intro' && intro !== undefined ? (
          <EcranIntro
            intro={intro}
            numero={ecran.numero}
            instantane={!reglages.machineAEcrire || intro.mouvementReduit()}
            occupe={occupe}
            demarrer={() => setEcran({ type: 'reveil', jeu: ecran.jeu, lus: [] })}
          />
        ) : ecran.type === 'reveil' ? (
          <EcranReveil
            jeu={ecran.jeu}
            env={env}
            numero={intro?.numero(env.monde.id) ?? null}
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
            carteANouveau={ecran.carteANouveau}
            voirCarte={voirCarte}
            ouvrirOptions={() => ouvrirOptions(ecran.jeu, ecran.lus)}
            terminerPartie={() => abandonnerPartie(ecran.jeu)}
            signaux={ecran.signaux}
            continuer={() => setEcran({ type: 'fin', jeu: ecran.jeu })}
            carteRevelee={pr !== '' && reglages.carteRevelee}
          />
        ) : (
          <main className="jeu">
            <header className="entete-piece">
              <h1 className="titre-piece">Void Walker</h1>
            </header>
            <section className="recit">
              {ecran.type === 'chargement' && <p className="attente">{LIBELLES.commun.chargement}</p>}
              {ecran.type === 'reprise_impossible' && (
                <div className="avis" role="alert">
                  <p>{LIBELLES.accueil.repriseImpossible}</p>
                  <button type="button" className="principal" disabled={occupe} onClick={() => void commencerNouvellePartie()} data-son="clic">
                    {LIBELLES.commun.nouvellePartie}
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

/** `?station=` refusé (#152) : l'accueil, le motif du catalogue tel quel, et rien qui lance une partie. */
export function EcranRefus({ motif, reglages }: { readonly motif: string; readonly reglages: Reglages }) {
  return (
    <div className="ecran" data-taille={reglages.taille}>
      <main className="jeu accueil">
        <h1 className="titre-accueil" aria-label="VOID WALKER">
          <span>VOID</span>
          <span>WALKER▮</span>
        </h1>
        <div className="actions-accueil">
          <section className="confirmation-accueil" role="alert">
            <p>{LIBELLES.accueil.stationRefusee(motif)}</p>
          </section>
          <button type="button" className="principal" disabled data-son="clic">
            {LIBELLES.commun.nouvellePartie}
          </button>
        </div>
      </main>
      {reglages.balayage && <div className="balayage" aria-hidden="true" />}
    </div>
  );
}
