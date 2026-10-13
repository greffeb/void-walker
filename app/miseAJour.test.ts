import { DELAI_FILET, INTERVALLE_RECHERCHE, piloterMiseAJour, type Enregistrement, type OptionsEnregistrement } from './miseAJour';

type Evenement = 'visibilitychange' | 'pointerdown' | 'keydown';

/** Faux navigateur : un service worker dont on choisit la réponse à `update()`, une page qu'on cache ou montre. */
function banc({ enregistre = true }: { readonly enregistre?: boolean } = {}) {
  const ecouteurs = new Map<Evenement, (() => void)[]>();
  const document = {
    hidden: false,
    addEventListener: (type: Evenement, ecouteur: () => void) => ecouteurs.set(type, [...(ecouteurs.get(type) ?? []), ecouteur]),
  };
  const emettre = (type: Evenement): void => ecouteurs.get(type)?.forEach((ecouteur) => ecouteur());
  const repetes: { ms: number; quoi: () => void }[] = [];
  const attentes: { ms: number; quoi: () => void }[] = [];
  let options: OptionsEnregistrement | undefined;
  const journal: string[] = [];
  /** Ce que fait le prochain `update()` : rien de neuf, une version qui s'installe, ou une erreur réseau. */
  let reponse: 'rien' | 'nouvelle' | 'erreur' = 'rien';
  const enregistrement: { -readonly [Cle in keyof Enregistrement]: Enregistrement[Cle] } = {
    installing: null,
    waiting: null,
    update: () => {
      journal.push('update');
      if (reponse === 'erreur') return Promise.reject(new Error('hors ligne'));
      if (reponse === 'nouvelle') options?.onNeedRefresh();
      return Promise.resolve();
    },
  };
  const miseAJour = piloterMiseAJour({
    enregistrer: (recues) => {
      options = recues;
      return () => {
        journal.push('installer');
        return Promise.resolve();
      };
    },
    document,
    minuterie: { repeter: (ms, quoi) => repetes.push({ ms, quoi }), attendre: (ms, quoi) => attentes.push({ ms, quoi }) },
    recharger: () => journal.push('recharger'),
  });
  if (enregistre) options?.onRegisteredSW('sw.js', enregistrement);
  return {
    miseAJour,
    journal,
    attentes,
    repetes,
    enregistrement,
    pret: () => options?.onNeedRefresh(),
    repondre: (quoi: typeof reponse) => {
      reponse = quoi;
    },
    toucher: () => emettre('pointerdown'),
    cacher: () => {
      document.hidden = true;
      emettre('visibilitychange');
    },
    montrer: () => {
      document.hidden = false;
      emettre('visibilitychange');
    },
  };
}

describe('mise à jour de l’appli installée (D-227)', () => {
  it('reste indisponible sans service worker', () => {
    const { miseAJour } = banc({ enregistre: false });
    expect(miseAJour.etat()).toBe('indisponible');
  });

  it('installe aussitôt une version prête au lancement, avant tout toucher', () => {
    const { miseAJour, journal, pret, attentes } = banc();
    pret();
    expect(miseAJour.etat()).toBe('installation');
    expect(journal).toEqual(['installer']);
    expect(attentes.map((attente) => attente.ms)).toEqual([DELAI_FILET]);
  });

  it('attend le prochain retour dans l’appli si le joueur a touché l’écran', () => {
    const { miseAJour, journal, pret, toucher, cacher, montrer } = banc();
    toucher();
    pret();
    expect(miseAJour.etat()).toBe('prete');
    expect(journal).toEqual([]);
    cacher();
    expect(journal).toEqual([]);
    montrer();
    expect(miseAJour.etat()).toBe('installation');
    expect(journal).toEqual(['installer']);
  });

  it('cherche la nouvelle version à chaque retour dans l’appli et l’installe, l’écran n’étant pas encore touché', () => {
    const { miseAJour, journal, toucher, cacher, montrer, repondre } = banc();
    toucher();
    cacher();
    repondre('nouvelle');
    montrer();
    expect(journal).toEqual(['update', 'installer']);
    expect(miseAJour.etat()).toBe('installation');
  });

  it('cherche toutes les demi-heures au premier plan seulement, sans montrer l’échec', async () => {
    const { miseAJour, journal, repetes, cacher, repondre } = banc();
    expect(repetes.map((repete) => repete.ms)).toEqual([INTERVALLE_RECHERCHE]);
    repondre('erreur');
    repetes[0]?.quoi();
    await Promise.resolve();
    expect(journal).toEqual(['update']);
    expect(miseAJour.etat()).toBe('inconnu');
    cacher();
    repetes[0]?.quoi();
    expect(journal).toEqual(['update']);
  });

  it('le bouton dit que le jeu est à jour, ou qu’il n’a pas pu vérifier', async () => {
    const { miseAJour, repondre } = banc();
    await miseAJour.chercher();
    expect(miseAJour.etat()).toBe('a_jour');
    repondre('erreur');
    await miseAJour.chercher();
    expect(miseAJour.etat()).toBe('echec');
  });

  it('le bouton installe la version trouvée même après un toucher', async () => {
    const { miseAJour, journal, toucher, repondre } = banc();
    toucher();
    repondre('nouvelle');
    await miseAJour.chercher();
    expect(journal).toEqual(['update', 'installer']);
    expect(miseAJour.etat()).toBe('installation');
  });

  it('le bouton installe une version déjà prête sans chercher', async () => {
    const { miseAJour, journal, toucher, pret } = banc();
    toucher();
    pret();
    await miseAJour.chercher();
    expect(journal).toEqual(['installer']);
  });

  it('le bouton attend une version en cours de téléchargement, et signale son échec', async () => {
    const { miseAJour, enregistrement } = banc();
    let changement: (() => void) | undefined;
    const travailleur = {
      state: 'installing',
      addEventListener: (_type: 'statechange', ecouteur: () => void) => {
        changement = ecouteur;
      },
    };
    enregistrement.installing = travailleur;
    await miseAJour.chercher();
    expect(miseAJour.etat()).toBe('recherche');
    travailleur.state = 'redundant';
    changement?.();
    expect(miseAJour.etat()).toBe('echec');
  });

  it('prévient ses abonnés', () => {
    const { miseAJour, pret, toucher } = banc();
    const vus: string[] = [];
    const desabonner = miseAJour.abonner(() => vus.push(miseAJour.etat()));
    toucher();
    pret();
    desabonner();
    void miseAJour.chercher();
    expect(vus).toEqual(['prete']);
  });
});
