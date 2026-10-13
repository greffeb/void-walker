// Accès GitHub du service : créer une issue, commenter une PR, savoir si une PR est ouverte. Rien d'autre (C-10 §5).

export interface Github {
  creerIssue(titre: string, corps: string, etiquettes: readonly string[]): Promise<string>;
  commenter(numero: number, corps: string): Promise<string>;
  prOuverte(numero: number): Promise<boolean>;
}

export class ErreurGithub extends Error {
  constructor(readonly statut: number) {
    super(`GitHub a répondu ${statut}.`);
  }
}

/** `jeton` : secret du Worker, jamais renvoyé ni journalisé. */
export function github(jeton: string, depot: string, appeler: typeof fetch = fetch): Github {
  const api = `https://api.github.com/repos/${depot}`;
  const demander = async (chemin: string, init: { readonly method?: string; readonly corps?: unknown } = {}): Promise<Response> =>
    appeler(`${api}${chemin}`, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jeton}`,
        'User-Agent': 'void-walker-rapports',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.corps === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init.corps === undefined ? undefined : JSON.stringify(init.corps),
    });
  const adresse = async (reponse: Response): Promise<string> => {
    if (!reponse.ok) throw new ErreurGithub(reponse.status);
    const { html_url: url } = (await reponse.json()) as { html_url?: unknown };
    if (typeof url !== 'string') throw new ErreurGithub(reponse.status);
    return url;
  };
  return {
    creerIssue: async (titre, corps, etiquettes) =>
      adresse(await demander('/issues', { method: 'POST', corps: { title: titre, body: corps, labels: etiquettes } })),
    commenter: async (numero, corps) => adresse(await demander(`/issues/${numero}/comments`, { method: 'POST', corps: { body: corps } })),
    prOuverte: async (numero) => {
      const reponse = await demander(`/pulls/${numero}`);
      if (reponse.status === 404) return false;
      if (!reponse.ok) throw new ErreurGithub(reponse.status);
      const { state } = (await reponse.json()) as { state?: unknown };
      return state === 'open';
    },
  };
}
