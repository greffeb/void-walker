/**
 * Mise à jour de l'appli installée (D-227). Une appli ouverte depuis l'écran d'accueil ne recharge presque jamais sa page :
 * le navigateur ne cherche donc pas seul la nouvelle version. On la cherche au lancement, à chaque retour dans l'appli et
 * toutes les demi-heures. Une version prête s'installe aussitôt si le joueur n'a pas encore touché l'écran depuis le
 * lancement ou le retour dans l'appli ; sinon au prochain retour, ou tout de suite par le bouton des options. La partie
 * est enregistrée après chaque action engagée (D-022) : le redémarrage ne perd que l'écran affiché.
 */

/** `indisponible` : pas de service worker (développement, navigateur sans prise en charge) ; rien à proposer. */
export type EtatMiseAJour = 'indisponible' | 'inconnu' | 'recherche' | 'a_jour' | 'prete' | 'installation' | 'echec';

interface Travailleur {
  readonly state: string;
  addEventListener(type: 'statechange', ecouteur: () => void): void;
}

/** Ce dont on se sert de `ServiceWorkerRegistration`. */
export interface Enregistrement {
  update(): Promise<unknown>;
  readonly installing: Travailleur | null;
  readonly waiting: Travailleur | null;
}

/** Options de `registerSW` (vite-plugin-pwa) dont on se sert. */
export interface OptionsEnregistrement {
  readonly immediate: boolean;
  readonly onNeedRefresh: () => void;
  readonly onRegisteredSW: (adresse: string, enregistrement: Enregistrement | undefined) => void;
  readonly onRegisterError: (erreur: unknown) => void;
}

export interface DependancesMiseAJour {
  /** `registerSW` : rend la fonction qui installe la version prête puis recharge la page. */
  readonly enregistrer: (options: OptionsEnregistrement) => () => Promise<void>;
  readonly document: {
    readonly hidden: boolean;
    addEventListener(type: 'visibilitychange' | 'pointerdown' | 'keydown', ecouteur: () => void, options?: { capture: boolean }): void;
  };
  readonly minuterie: {
    repeter(ms: number, quoi: () => void): void;
    attendre(ms: number, quoi: () => void): void;
  };
  /** Recharge la page : filet si la nouvelle version tarde à prendre la main. */
  readonly recharger: () => void;
}

export interface MiseAJour {
  readonly etat: () => EtatMiseAJour;
  readonly abonner: (ecouteur: () => void) => () => void;
  /** Bouton des options : installe la version prête, sinon la cherche et l'installe si elle existe. */
  readonly chercher: () => Promise<void>;
}

/** Fréquence de la recherche tant que l'appli reste au premier plan. */
export const INTERVALLE_RECHERCHE = 30 * 60_000;
/** Délai après lequel on recharge de nous-mêmes si la nouvelle version n'a pas pris la main. */
export const DELAI_FILET = 5_000;

export function piloterMiseAJour({ enregistrer, document, minuterie, recharger }: DependancesMiseAJour): MiseAJour {
  let etat: EtatMiseAJour = 'indisponible';
  let enregistrement: Enregistrement | undefined;
  /** Le joueur a touché l'écran depuis le lancement ou le dernier retour dans l'appli. */
  let touche = false;
  /** Le joueur a demandé la mise à jour par le bouton : elle s'installe dès qu'elle est prête. */
  let demandee = false;
  const ecouteurs = new Set<() => void>();
  // Lecture hors du rétrécissement de TypeScript : les rappels du service worker changent l'état pendant les `await`.
  const lire = (): EtatMiseAJour => etat;

  const changer = (nouvel: EtatMiseAJour): void => {
    if (nouvel === etat) return;
    etat = nouvel;
    for (const ecouteur of ecouteurs) ecouteur();
  };

  const installer = enregistrer({
    immediate: true,
    onNeedRefresh: () => {
      changer('prete');
      if (!touche || demandee) appliquer();
    },
    onRegisteredSW: (_adresse, trouve) => {
      if (trouve === undefined) return;
      enregistrement = trouve;
      if (etat === 'indisponible') changer('inconnu');
    },
    onRegisterError: () => undefined,
  });

  function appliquer(): void {
    if (etat === 'installation') return;
    changer('installation');
    void installer();
    minuterie.attendre(DELAI_FILET, recharger);
  }

  /** Recherche silencieuse : l'échec (hors ligne) ne s'affiche pas. */
  const verifier = (): void => {
    if (enregistrement === undefined || etat === 'recherche' || etat === 'installation') return;
    enregistrement.update().catch(() => undefined);
  };

  const toucher = (): void => {
    touche = true;
  };
  document.addEventListener('pointerdown', toucher, { capture: true });
  document.addEventListener('keydown', toucher, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    touche = false;
    if (etat === 'prete') appliquer();
    else verifier();
  });
  minuterie.repeter(INTERVALLE_RECHERCHE, () => {
    if (!document.hidden) verifier();
  });

  const chercher = async (): Promise<void> => {
    if (etat === 'prete') {
      appliquer();
      return;
    }
    if (enregistrement === undefined || etat === 'recherche' || etat === 'installation') return;
    const cible = enregistrement;
    demandee = true;
    changer('recherche');
    try {
      await cible.update();
    } catch {
      demandee = false;
      changer('echec');
      return;
    }
    // `onNeedRefresh` a pu passer pendant la recherche : la version est déjà en cours d'installation.
    if (lire() !== 'recherche') return;
    const enCours = cible.installing;
    if (enCours !== null) {
      enCours.addEventListener('statechange', () => {
        if (enCours.state !== 'redundant' || etat !== 'recherche') return;
        demandee = false;
        changer('echec');
      });
      return;
    }
    if (cible.waiting !== null) {
      changer('prete');
      appliquer();
      return;
    }
    demandee = false;
    changer('a_jour');
  };

  return {
    etat: lire,
    abonner: (ecouteur) => {
      ecouteurs.add(ecouteur);
      return () => {
        ecouteurs.delete(ecouteur);
      };
    },
    chercher,
  };
}
