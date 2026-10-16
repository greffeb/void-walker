import { interpreterVerification, lireVerification } from './verification';

const COMMIT = 'abc1234def';

function reponse(contenu: unknown, ok = true): Promise<Response> {
  return Promise.resolve({ ok, json: () => Promise.resolve(contenu) } as Response);
}

describe('état de la vérification d’une version de test (#180)', () => {
  it('lit l’état du commit de la version', () => {
    expect(interpreterVerification({ commit: COMMIT, etat: 'en_cours' }, COMMIT)).toBe('en_cours');
    expect(interpreterVerification({ commit: COMMIT, etat: 'verte' }, COMMIT)).toBe('verte');
    expect(interpreterVerification({ commit: COMMIT, etat: 'echec' }, COMMIT)).toBe('echec');
  });

  it('un autre commit, un état inconnu ou un fichier illisible : « inconnue », jamais « verte »', () => {
    expect(interpreterVerification({ commit: 'autre', etat: 'verte' }, COMMIT)).toBe('inconnue');
    expect(interpreterVerification({ commit: COMMIT, etat: 'presque' }, COMMIT)).toBe('inconnue');
    expect(interpreterVerification({ commit: '', etat: 'verte' }, '')).toBe('inconnue');
    expect(interpreterVerification(null, COMMIT)).toBe('inconnue');
    expect(interpreterVerification('verte', COMMIT)).toBe('inconnue');
  });

  it('demande le fichier à côté de la version, sans cache ; réseau ou fichier absents : « inconnue »', async () => {
    const appels: [string, RequestInit][] = [];
    const etat = await lireVerification((adresse, init) => {
      appels.push([adresse, init]);
      return reponse({ commit: COMMIT, etat: 'verte' });
    }, '/void-walker/pr-42/', COMMIT);
    expect(etat).toBe('verte');
    expect(appels).toHaveLength(1);
    expect(appels[0]?.[0]).toMatch(/^\/void-walker\/pr-42\/verification\.json\?t=\d+$/);
    expect(appels[0]?.[1]).toEqual({ cache: 'no-store' });
    expect(await lireVerification(() => reponse({}, false), '/', COMMIT)).toBe('inconnue');
    expect(await lireVerification(() => Promise.reject(new Error('hors ligne')), '/', COMMIT)).toBe('inconnue');
  });
});
