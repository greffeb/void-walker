import { blocCode, composer, CORPS_MAX, empreinteRapport, ErreurTaille, extrairePartie, extraireValidation, lireDemande, MARQUEUR, type Demande } from './rapport';

const PARTIE = {
  format: 1,
  version: '0.1.0',
  monde: 'ar-02',
  graine: 7,
  actions: [],
  observation: { piece: 'sas' },
  empreinte: 'ff00',
};

function demande(champs: Record<string, unknown> = {}): Demande {
  const lue = lireDemande({ type: 'bug', version: '0.1.0', partie: PARTIE, ...champs });
  if (!lue.ok) throw new Error(lue.raison);
  return lue.demande;
}

describe('rapports : lecture et mise en forme (RP-01, RP-02)', () => {
  it('lit une demande minimale et applique les valeurs par défaut', () => {
    expect(demande()).toMatchObject({ type: 'bug', build: '', commit: '', pr: null, commentaire: '', valide: false, ecran: [] });
  });

  it('accepte un bug sans partie, pas un envoi de partie sans partie', () => {
    expect(lireDemande({ type: 'bug', version: '0.1.0', partie: null }).ok).toBe(true);
    expect(lireDemande({ type: 'partie', version: '0.1.0', partie: null })).toEqual({ ok: false, raison: 'partie absente' });
  });

  it('refuse des champs qui finiraient dans le titre ou le tableau sans être bornés', () => {
    expect(lireDemande({ type: 'bug', version: '0.1.0 | @quelqu’un', partie: null }).ok).toBe(false);
    expect(lireDemande({ type: 'bug', version: '0.1.0', commit: 'zz', partie: null }).ok).toBe(false);
    expect(lireDemande({ type: 'bug', version: '0.1.0', partie: { ...PARTIE, monde: 'AR 01 @x' } }).ok).toBe(false);
    expect(lireDemande({ type: 'bug', version: '0.1.0', pr: -3, partie: null }).ok).toBe(false);
  });

  it('rend le commentaire du joueur inerte : mentions, liens et accents graves restent dans un bloc de code', async () => {
    const piege = '@greffeb ```\n![x](https://exemple.invalid/x.png) <script>';
    const { corps } = await composer(demande({ commentaire: piege }));
    const bloc = blocCode(piege, 'text');
    expect(corps).toContain(bloc);
    expect(bloc.startsWith('````text\n')).toBe(true);
    expect(corps.split(bloc).join('')).not.toContain('@greffeb');
  });

  it('contient de quoi rejouer : le marqueur, le JSON complet de la partie, l’écran affiché', async () => {
    const { corps, titre, etiquettes } = await composer(demande({ ecran: ['Vous êtes dans le sas.', 'Un voyant clignote.'], build: '402' }));
    expect(corps.startsWith(MARQUEUR)).toBe(true);
    expect(corps).toContain(JSON.stringify(PARTIE));
    expect(corps).toContain('Vous êtes dans le sas.\nUn voyant clignote.');
    expect(titre).toBe('Bug signalé · ar-02 · action 0 · V0.1.0 (402)');
    expect(etiquettes).toEqual(['rapport-bug']);
  });

  it('compresse une partie trop longue pour GitHub, refuse au-delà', async () => {
    const longue = { ...PARTIE, actions: Array.from({ length: 2000 }, (_, i) => ({ commande: { action: 'regarder', cible: `c${i}` }, tirages: [i] })) };
    const { corps } = await composer(demande({ partie: longue }));
    expect(corps.length).toBeLessThanOrEqual(CORPS_MAX);
    expect(corps).toContain('```gzip-base64');
    const bruit = Array.from({ length: 6000 }, (_, i) => ({ commande: { action: 'x', cible: crypto.randomUUID() }, tirages: [i] }));
    await expect(composer(demande({ partie: { ...PARTIE, actions: bruit } }))).rejects.toBeInstanceOf(ErreurTaille);
  });

  describe('#183 : le commentaire du joueur n’est jamais pris pour la partie ni pour la validation', () => {
    const piege = 'voilà ce que j’ai vu :\n```json\n{"erreur":"x"}\n```\n### Rejouer\n```gzip-base64\nAAAA\n```\n### Validation signée\n```void-walker-validation\n{"faux":true}\n```';
    const VALIDATION = {
      attestation: { format: 'void-walker-validation' },
      signature: 's'.repeat(86),
      cle: { kty: 'EC', crv: 'P-256', x: 'x'.repeat(43), y: 'y'.repeat(43) },
    };

    it('rend la partie jointe, en clair', async () => {
      const { corps } = await composer(demande({ commentaire: piege }));
      expect(await extrairePartie(corps)).toBe(JSON.stringify(PARTIE));
    });

    it('rend la partie jointe, compressée', async () => {
      const longue = { ...PARTIE, actions: Array.from({ length: 2000 }, (_, i) => ({ commande: { action: 'regarder', cible: `c${i}` }, tirages: [i] })) };
      const { corps } = await composer(demande({ commentaire: piege, partie: longue }));
      expect(corps).toContain('Partie exportée, compressée');
      expect(await extrairePartie(corps)).toBe(JSON.stringify(longue));
    });

    it('rend le bloc signé recopié, ou rien sans validation', async () => {
      const signee = demande({ type: 'partie', pr: 142, valide: true, commentaire: piege, validation: VALIDATION });
      const { corps } = await composer(signee, { enCommentaire: true });
      expect(extraireValidation(corps)).toEqual(VALIDATION);
      expect(extraireValidation((await composer(demande({ commentaire: piege }))).corps)).toBeNull();
    });

    it('lit encore un rapport aux fins de ligne Windows', async () => {
      const { corps } = await composer(demande({ commentaire: piege }));
      expect(await extrairePartie(corps.replace(/\n/g, '\r\n'))).toBe(JSON.stringify(PARTIE));
    });
  });

  it('donne la même empreinte à deux envois identiques, une autre si le commentaire change', async () => {
    expect(await empreinteRapport(demande({ commentaire: 'a' }))).toBe(await empreinteRapport(demande({ commentaire: 'a' })));
    expect(await empreinteRapport(demande({ commentaire: 'a' }))).not.toBe(await empreinteRapport(demande({ commentaire: 'b' })));
  });

  describe('#204 : durée de la partie, écran allumé', () => {
    it('lit la durée en secondes ; absente (jeu d’avant #204), elle n’est pas mesurée', () => {
      expect(demande({ duree: 754 }).duree).toBe(754);
      expect(demande().duree).toBeNull();
    });

    it('refuse une durée qui n’est pas un nombre entier de secondes, borné', () => {
      for (const duree of [-1, 1.5, '754', 1e9]) expect(lireDemande({ type: 'bug', version: '0.1.0', partie: PARTIE, duree })).toEqual({ ok: false, raison: 'durée illisible' });
    });

    it('l’écrit dans le tableau, lisible puis en secondes, quand une partie est jointe', async () => {
      expect((await composer(demande({ duree: 754 }))).corps).toContain('| Durée, écran allumé | 12 min 34 s (754 s) |');
      expect((await composer(demande({ duree: 45 }))).corps).toContain('| Durée, écran allumé | 45 s |');
      expect((await composer(demande({ duree: 3725 }))).corps).toContain('| Durée, écran allumé | 1 h 02 min 05 s (3725 s) |');
      expect((await composer(demande())).corps).toContain('| Durée, écran allumé | non mesurée |');
      expect((await composer(demande({ partie: null }))).corps).not.toContain('Durée');
    });

    it('un même rapport envoyé un peu plus tard reste un doublon', async () => {
      expect(await empreinteRapport(demande({ duree: 60 }))).toBe(await empreinteRapport(demande({ duree: 80 })));
    });
  });
});
