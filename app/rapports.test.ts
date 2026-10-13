import { CLE_FILE, creerRapports, FILE_MAX, PATIENCE_MS, type DependancesRapports, type Rapport } from './rapports';

const RAPPORT: Rapport = { type: 'bug', version: '0.1.0', build: '', commit: '', pr: null, commentaire: 'a', valide: false, partie: null, ecran: [], validation: null };

/** Service factice : répond le statut voulu, ou « hors ligne » ; l'appareil garde ce qu'on lui confie. */
function banc(options: { ecritureRefusee?: boolean } = {}) {
  const appareil = new Map<string, string>();
  let maintenant = 1_000_000;
  let reponse: number | 'hors_ligne' = 201;
  const envoyes: Rapport[] = [];
  const dependances: DependancesRapports = {
    adresse: 'https://service/rapports',
    appeler: async (_adresse, init) => {
      if (reponse === 'hors_ligne') throw new TypeError('Failed to fetch');
      envoyes.push(JSON.parse(String(init.body)) as Rapport);
      return { status: reponse };
    },
    lire: (cle) => appareil.get(cle) ?? null,
    ecrire: (cle, valeur) => {
      if (options.ecritureRefusee === true) throw new Error('QuotaExceededError');
      appareil.set(cle, valeur);
    },
    maintenant: () => maintenant,
  };
  return {
    rapports: creerRapports(dependances),
    dependances,
    appareil,
    envoyes,
    repondre: (statut: number | 'hors_ligne') => {
      reponse = statut;
    },
    avancer: (ms: number) => {
      maintenant += ms;
    },
  };
}

const rapport = (commentaire: string): Rapport => ({ ...RAPPORT, commentaire });

describe('rapports du jeu (C-10 §3)', () => {
  it('envoie le rapport en POST JSON et dit qu’il est parti', async () => {
    const { rapports, envoyes } = banc();
    expect(await rapports.envoyer(RAPPORT)).toBe('envoye');
    expect(envoyes).toEqual([RAPPORT]);
    expect(rapports.enAttente()).toBe(0);
  });

  it('PR-01 : sans réseau, garde le rapport et le renvoie au retour du réseau', async () => {
    const { rapports, repondre, envoyes, appareil } = banc();
    repondre('hors_ligne');
    const avertis: number[] = [];
    rapports.abonner(() => avertis.push(rapports.enAttente()));
    expect(await rapports.envoyer(rapport('un'))).toBe('garde');
    expect(await rapports.envoyer(rapport('deux'))).toBe('garde');
    expect(rapports.enAttente()).toBe(2);
    expect(JSON.parse(appareil.get(CLE_FILE) ?? '[]')).toHaveLength(2);
    repondre(201);
    await rapports.renvoyer();
    expect(envoyes.map((envoye) => envoye.commentaire)).toEqual(['un', 'deux']);
    expect(rapports.enAttente()).toBe(0);
    expect(avertis).toEqual([1, 2, 1, 0]);
  });

  it('une file gardée survit au redémarrage du jeu', async () => {
    const premier = banc();
    premier.repondre('hors_ligne');
    await premier.rapports.envoyer(RAPPORT);
    const relance = creerRapports(premier.dependances);
    expect(relance.enAttente()).toBe(1);
    premier.repondre(201);
    await relance.renvoyer();
    expect(relance.enAttente()).toBe(0);
  });

  it('un service qui demande d’attendre garde le rapport ; un refus ne le garde pas', async () => {
    const { rapports, repondre } = banc();
    repondre(429);
    expect(await rapports.envoyer(rapport('trop'))).toBe('trop');
    repondre(400);
    expect(await rapports.envoyer(rapport('mauvais'))).toBe('refuse');
    expect(rapports.enAttente()).toBe(1);
    // Un rapport gardé que le service refuse ensuite quitte la file : il ne bloque pas les suivants.
    await rapports.renvoyer();
    expect(rapports.enAttente()).toBe(0);
  });

  it('le renvoi s’arrête au premier rapport qui ne passe pas, sans perdre les autres', async () => {
    const { rapports, repondre } = banc();
    repondre(503);
    await rapports.envoyer(rapport('a'));
    await rapports.envoyer(rapport('b'));
    await rapports.renvoyer();
    expect(rapports.enAttente()).toBe(2);
  });

  it('un doublon déjà publié (200) compte comme arrivé', async () => {
    const { rapports, repondre } = banc();
    repondre(200);
    expect(await rapports.envoyer(RAPPORT)).toBe('envoye');
  });

  it('le jeu attend un instant entre deux envois, en plus du service (D-095)', async () => {
    const { rapports, avancer, envoyes } = banc();
    await rapports.envoyer(rapport('a'));
    expect(await rapports.envoyer(rapport('b'))).toBe('patience');
    avancer(PATIENCE_MS);
    expect(await rapports.envoyer(rapport('b'))).toBe('envoye');
    expect(envoyes).toHaveLength(2);
  });

  it('ni réseau ni place sur l’appareil : le rapport est dit perdu, jamais « gardé » à tort', async () => {
    const plein = banc();
    plein.repondre('hors_ligne');
    for (let i = 0; i < FILE_MAX; i += 1) expect(await plein.rapports.envoyer(rapport(String(i)))).toBe('garde');
    expect(await plein.rapports.envoyer(rapport('de trop'))).toBe('perdu');
    const prive = banc({ ecritureRefusee: true });
    prive.repondre('hors_ligne');
    expect(await prive.rapports.envoyer(RAPPORT)).toBe('perdu');
  });
});
