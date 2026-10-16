import { CLE_INSTALLATION, estFirefoxAndroid, estSafariIos, piloterInstallation, type EtatInstallation, type InviteInstallation } from './installation';

const AGENTS = {
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  chromeBureau: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  // iPadOS demande par défaut les sites pour ordinateur : l'iPad se présente comme un Mac.
  safariIpad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  chromeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1',
  vueIntegreeIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  firefoxBureau: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0',
  safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
} as const;

type Evenement = 'beforeinstallprompt' | 'appinstalled';

/** Faux navigateur : une page qui reçoit les événements d'installation, un stockage, et une boîte d'installation à laquelle on répond. */
function banc({
  agent = AGENTS.chromeAndroid,
  pointsTactiles = 5,
  modeAppli = false,
  versionDeTest = false,
  gardee = null,
  ecritureImpossible = false,
}: {
  readonly agent?: string;
  readonly pointsTactiles?: number;
  readonly modeAppli?: boolean;
  readonly versionDeTest?: boolean;
  readonly gardee?: string | null;
  readonly ecritureImpossible?: boolean;
} = {}) {
  const ecouteurs = new Map<Evenement, ((evenement: Event) => void)[]>();
  const stockage = new Map<string, string>();
  if (gardee !== null) stockage.set(CLE_INSTALLATION, gardee);
  const installation = piloterInstallation({
    ecouter: (type, ecouteur) => ecouteurs.set(type, [...(ecouteurs.get(type) ?? []), ecouteur]),
    agent,
    pointsTactiles,
    modeAppli: () => modeAppli,
    versionDeTest,
    lire: (cle) => stockage.get(cle) ?? null,
    ecrire: (cle, valeur) => {
      if (ecritureImpossible) throw new Error('quota');
      stockage.set(cle, valeur);
    },
  });
  const journal: string[] = [];
  /** `beforeinstallprompt` : rend l'événement, dont `prompt()` ouvre une boîte qu'on referme par `repondre`. */
  const recevoirInvite = (): { evenement: InviteInstallation; repondre: (issue: 'accepted' | 'dismissed' | Error) => Promise<void> } => {
    let repondre: (issue: 'accepted' | 'dismissed') => void = () => undefined;
    let refuser: (erreur: Error) => void = () => undefined;
    const choix = new Promise<{ outcome: 'accepted' | 'dismissed' }>((resolu, rejete) => {
      repondre = (outcome) => resolu({ outcome });
      refuser = rejete;
    });
    const evenement = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: () => {
        journal.push('prompt');
        return Promise.resolve();
      },
      userChoice: choix,
    });
    ecouteurs.get('beforeinstallprompt')?.forEach((ecouteur) => ecouteur(evenement));
    return {
      evenement,
      repondre: async (issue) => {
        if (issue instanceof Error) refuser(issue);
        else repondre(issue);
        await choix.catch(() => undefined);
        await Promise.resolve();
      },
    };
  };
  return {
    installation,
    journal,
    stockage,
    recevoirInvite,
    installee: () => ecouteurs.get('appinstalled')?.forEach((ecouteur) => ecouteur(new Event('appinstalled'))),
  };
}

describe('installation de l’appli (#174)', () => {
  describe('navigateurs sans rien à proposer', () => {
    it.each([
      ['Chrome sans événement (déjà installée, ou pas encore éligible)', AGENTS.chromeAndroid],
      ['Chrome sur ordinateur', AGENTS.chromeBureau],
      ['Firefox sur ordinateur', AGENTS.firefoxBureau],
      ['Safari sur Mac (pas de toucher)', AGENTS.safariMac],
      ['Chrome sur iPhone (menu et libellés non vérifiés)', AGENTS.chromeIphone],
      ['vue intégrée d’une autre appli sur iPhone', AGENTS.vueIntegreeIphone],
    ])('%s : indisponible', (_nom, agent) => {
      expect(banc({ agent, pointsTactiles: agent === AGENTS.safariMac ? 0 : 5 }).installation.etat()).toBe('indisponible');
    });
  });

  describe('aide pas à pas, sans invite du navigateur', () => {
    it('Safari sur iPhone', () => {
      expect(banc({ agent: AGENTS.safariIphone }).installation.etat()).toBe('guide_ios');
    });

    it('Safari sur iPad récent, qui se présente comme un Mac mais a un écran tactile', () => {
      expect(banc({ agent: AGENTS.safariIpad, pointsTactiles: 5 }).installation.etat()).toBe('guide_ios');
    });

    it('Firefox sur Android', () => {
      expect(banc({ agent: AGENTS.firefoxAndroid }).installation.etat()).toBe('guide_firefox');
    });

    it('détection des agents utilisateurs', () => {
      expect(estSafariIos(AGENTS.safariIphone, 5)).toBe(true);
      expect(estSafariIos(AGENTS.safariMac, 0)).toBe(false);
      expect(estSafariIos(AGENTS.chromeIphone, 5)).toBe(false);
      expect(estFirefoxAndroid(AGENTS.firefoxAndroid)).toBe(true);
      expect(estFirefoxAndroid(AGENTS.firefoxBureau)).toBe(false);
      expect(estFirefoxAndroid(AGENTS.chromeAndroid)).toBe(false);
    });

    it('proposer n’a rien à ouvrir : l’aide est dans la page', () => {
      const { installation, journal } = banc({ agent: AGENTS.safariIphone });
      installation.proposer();
      expect(installation.etat()).toBe('guide_ios');
      expect(journal).toEqual([]);
    });
  });

  describe('Chromium : l’invite du navigateur', () => {
    it('l’événement est retenu (le navigateur n’affiche pas sa propre invite) et passe l’état à « invite »', () => {
      const { installation, recevoirInvite } = banc();
      const { evenement } = recevoirInvite();
      expect(evenement.defaultPrevented).toBe(true);
      expect(installation.etat()).toBe('invite');
    });

    it('proposer ouvre la boîte tout de suite, dans le geste du joueur', () => {
      const { installation, journal, recevoirInvite } = banc();
      recevoirInvite();
      installation.proposer();
      expect(journal).toEqual(['prompt']);
      expect(installation.etat()).toBe('en_cours');
    });

    it('accepté : installée, et gardée pour les prochains onglets', async () => {
      const { installation, stockage, recevoirInvite } = banc();
      const { repondre } = recevoirInvite();
      installation.proposer();
      await repondre('accepted');
      expect(installation.etat()).toBe('installee');
      expect(JSON.parse(stockage.get(CLE_INSTALLATION) ?? 'null')).toEqual({ installee: true });
    });

    it('refusé : refusée, rien n’est gardé', async () => {
      const { installation, stockage, recevoirInvite } = banc();
      const { repondre } = recevoirInvite();
      installation.proposer();
      await repondre('dismissed');
      expect(installation.etat()).toBe('refusee');
      expect(stockage.has(CLE_INSTALLATION)).toBe(false);
    });

    it('boîte qui échoue : refusée, sans erreur dans la page', async () => {
      const { installation, recevoirInvite } = banc();
      const { repondre } = recevoirInvite();
      installation.proposer();
      await repondre(new Error('déjà utilisée'));
      expect(installation.etat()).toBe('refusee');
    });

    it('un événement ne sert qu’une fois : un second toucher n’ouvre rien', async () => {
      const { installation, journal, recevoirInvite } = banc();
      const { repondre } = recevoirInvite();
      installation.proposer();
      installation.proposer();
      await repondre('dismissed');
      installation.proposer();
      expect(journal).toEqual(['prompt']);
    });

    it('après un refus, un nouvel événement du navigateur rouvre la proposition', async () => {
      const { installation, journal, recevoirInvite } = banc();
      const premiere = recevoirInvite();
      installation.proposer();
      await premiere.repondre('dismissed');
      recevoirInvite();
      expect(installation.etat()).toBe('invite');
      installation.proposer();
      expect(journal).toEqual(['prompt', 'prompt']);
    });

    it('« appinstalled » avant la réponse du joueur : installée, une seule fois', async () => {
      const { installation, installee, recevoirInvite } = banc();
      const { repondre } = recevoirInvite();
      installation.proposer();
      installee();
      await repondre('accepted');
      expect(installation.etat()).toBe('installee');
    });

    it('installée depuis le menu du navigateur : « appinstalled » suffit', () => {
      const { installation, installee, recevoirInvite } = banc();
      recevoirInvite();
      installee();
      expect(installation.etat()).toBe('installee');
    });

    it('proposer sans événement ne fait rien', () => {
      const { installation, journal } = banc();
      installation.proposer();
      expect(installation.etat()).toBe('indisponible');
      expect(journal).toEqual([]);
    });

    it('un événement l’emporte sur « déjà installée » : le navigateur dit qu’elle ne l’est plus', () => {
      const { installation, recevoirInvite } = banc({ gardee: JSON.stringify({ installee: true }) });
      expect(installation.etat()).toBe('indisponible');
      recevoirInvite();
      expect(installation.etat()).toBe('invite');
    });

    it('stockage refusé (navigation privée, quota) : l’installation marche quand même', async () => {
      const { installation, recevoirInvite } = banc({ ecritureImpossible: true });
      const { repondre } = recevoirInvite();
      installation.proposer();
      await repondre('accepted');
      expect(installation.etat()).toBe('installee');
    });
  });

  describe('là où il ne faut rien proposer', () => {
    it('version de test : ni invite, ni aide, et l’événement du navigateur reste intact', () => {
      for (const agent of [AGENTS.chromeAndroid, AGENTS.safariIphone, AGENTS.firefoxAndroid]) {
        const { installation, recevoirInvite, stockage } = banc({ agent, versionDeTest: true });
        const { evenement } = recevoirInvite();
        expect(evenement.defaultPrevented).toBe(false);
        expect(installation.etat()).toBe('indisponible');
        expect(stockage.size).toBe(0);
      }
    });

    it('appli ouverte depuis l’écran d’accueil : rien à proposer, et l’installation est gardée', () => {
      const { installation, recevoirInvite, stockage } = banc({ agent: AGENTS.firefoxAndroid, modeAppli: true });
      const { evenement } = recevoirInvite();
      expect(evenement.defaultPrevented).toBe(false);
      expect(installation.etat()).toBe('indisponible');
      expect(JSON.parse(stockage.get(CLE_INSTALLATION) ?? 'null')).toEqual({ installee: true });
    });

    it('lancée une fois depuis l’écran d’accueil, l’aide ne revient pas dans un onglet (Android)', () => {
      expect(banc({ agent: AGENTS.firefoxAndroid, gardee: JSON.stringify({ installee: true }) }).installation.etat()).toBe('indisponible');
    });

    it('drapeau illisible : ignoré', () => {
      for (const gardee of ['{pas du json', 'null', '"oui"', JSON.stringify({ installee: 'oui' })]) {
        expect(banc({ agent: AGENTS.firefoxAndroid, gardee }).installation.etat()).toBe('guide_firefox');
      }
    });
  });

  it('les abonnés sont prévenus à chaque changement, puis plus après désabonnement', async () => {
    const { installation, recevoirInvite } = banc();
    const vus: EtatInstallation[] = [];
    const desabonner = installation.abonner(() => vus.push(installation.etat()));
    const { repondre } = recevoirInvite();
    installation.proposer();
    await repondre('accepted');
    expect(vus).toEqual(['invite', 'en_cours', 'installee']);
    desabonner();
    recevoirInvite();
    expect(vus).toHaveLength(3);
  });
});
