import { blocCode, composer, CORPS_MAX, empreinteRapport, ErreurTaille, lireDemande, MARQUEUR, type Demande } from './rapport';

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

  it('donne la même empreinte à deux envois identiques, une autre si le commentaire change', async () => {
    expect(await empreinteRapport(demande({ commentaire: 'a' }))).toBe(await empreinteRapport(demande({ commentaire: 'a' })));
    expect(await empreinteRapport(demande({ commentaire: 'a' }))).not.toBe(await empreinteRapport(demande({ commentaire: 'b' })));
  });
});
