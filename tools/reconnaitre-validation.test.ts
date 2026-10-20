import { readFileSync } from 'node:fs';
import type { ExportPartie } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { composerRapport, signerRapport, type Rapport } from '../app/rapports';
import { attester, creerSignataire, empreinteLisible, type ClesTelephone, type Coffre, type Signataire } from '../app/validation';
import { composer, lireDemande } from '../report-service/src/rapport';
import { commitSigne, etatDesRuns, FICHIER_CLES, lireCles, marqueurReponse, reconnaitre, reponse, selonVerification, type CleEnregistree } from './reconnaitre-validation';
import { executerParcours } from './rejouer-parcours';
import { REPO_ROOT } from './repo-files';

// Validation signée de bout en bout (C-10 §4) : le téléphone signe, le service recopie, le robot de la PR reconnaît.

const COMMIT = 'e27d2204f1c3a9b8c7d6e5f4a3b2c1d0e9f8a7b6';
const PR = 142;

function coffreMemoire(): Coffre {
  let cles: ClesTelephone | null = null;
  return {
    lire: async () => cles,
    ecrire: async (nouvelles) => {
      cles = nouvelles;
    },
  };
}

function partieFinie(): ExportPartie {
  const entree = MONDES['ar-01'] as EntreeMonde;
  const parcours = entree.parcours?.[0];
  if (parcours === undefined) throw new Error('AR-01 sans parcours témoin.');
  const { exportPartie } = executerParcours(entree, parcours, '0.1.0');
  if (exportPartie === null || !exportPartie.observation.terminee) throw new Error('Parcours non fini.');
  return exportPartie;
}

const FINIE = partieFinie();

function rapport(valide: boolean, partie: ExportPartie = FINIE): Rapport {
  return {
    ...composerRapport((MONDES['ar-01'] as EntreeMonde).monde, { version: '0.1.0', build: '412', commit: COMMIT, pr: String(PR) }, 'partie', null, 'Elle tient.', valide),
    partie,
  };
}

/** Commentaire que le service poste dans la PR pour ce rapport. */
async function commentaire(envoye: Rapport): Promise<string> {
  const lue = lireDemande(JSON.parse(JSON.stringify(envoye)) as unknown);
  if (!lue.ok) throw new Error(lue.raison);
  return (await composer(lue.demande, { enCommentaire: true })).corps;
}

async function cleDe(signataire: Signataire, nom = 'Téléphone du porteur du projet'): Promise<CleEnregistree> {
  const signe = await signerRapport(rapport(true), signataire);
  if (signe.validation === null) throw new Error('Non signé.');
  return { nom, cle: signe.validation.cle };
}

const telephone = creerSignataire(coffreMemoire());
const etranger = creerSignataire(coffreMemoire());
const verifier = async (corps: string, cles: readonly CleEnregistree[], commits = [COMMIT], pr = PR) => reconnaitre({ corps, pr, commits, cles });

describe('validation signée par le téléphone (C-10 §4)', () => {
  it('PR-04 : « je valide » signé par le téléphone enregistré est reconnu, avec aventure, version et fin', async () => {
    const cles = [await cleDe(telephone)];
    const corps = await commentaire(await signerRapport(rapport(true), telephone));
    expect(corps).toContain('cochée, signée par le téléphone');
    const resultat = await verifier(corps, cles);
    expect(resultat.type).toBe('reconnue');
    const texte = reponse(resultat, 'https://github.com/greffeb/void-walker/pull/142#issuecomment-1') ?? '';
    expect(texte).toContain('**Validation reconnue**');
    expect(texte).toContain('AR-01 · version 0.1.0 · commit e27d220 · évacuation en');
  });

  it('PR-03 : « je valide » coché sans signature reste un simple retour, sans réponse du robot', async () => {
    const corps = await commentaire(rapport(true));
    expect(corps).toContain('cochée, sans signature');
    const resultat = await verifier(corps, [await cleDe(telephone)]);
    expect(resultat).toEqual({ type: 'aucune' });
    expect(reponse(resultat, '')).toBeNull();
  });

  it('une signature faite avec une autre clé n’est pas reconnue : le robot cite son empreinte à comparer', async () => {
    const corps = await commentaire(await signerRapport(rapport(true), etranger));
    const resultat = await verifier(corps, [await cleDe(telephone)]);
    expect(resultat.type).toBe('cle_inconnue');
    const empreinte = resultat.type === 'cle_inconnue' ? resultat.empreinte : '';
    expect(reponse(resultat, 'adresse')).toContain(`Empreinte : **${empreinteLisible(empreinte)}**`);
    expect(await etranger.empreinte()).toBe(empreinte);
  });

  it('une signature étrangère présentée sous la clé enregistrée est refusée', async () => {
    const enregistree = await cleDe(telephone);
    const signe = await signerRapport(rapport(true), etranger);
    const maquille: Rapport = { ...signe, validation: signe.validation === null ? null : { ...signe.validation, cle: enregistree.cle } };
    expect(await verifier(await commentaire(maquille), [enregistree])).toEqual({ type: 'refusee', raison: 'signature invalide' });
  });

  it('refuse une partie changée après signature, une autre PR ou un commit hors de la PR', async () => {
    const cles = [await cleDe(telephone)];
    const signe = await signerRapport(rapport(true), telephone);
    const autrePartie: Rapport = { ...signe, partie: { ...FINIE, graine: FINIE.graine + 1 } };
    expect(await verifier(await commentaire(autrePartie), cles)).toMatchObject({ type: 'refusee', raison: 'la partie jointe n’est pas celle qui a été signée' });
    const corps = await commentaire(signe);
    expect(await verifier(corps, cles, [COMMIT], 141)).toMatchObject({ type: 'refusee', raison: 'signée pour la PR #142, pas pour celle-ci' });
    expect(await verifier(corps, cles, ['0'.repeat(40)])).toMatchObject({ type: 'refusee', raison: 'commit e27d220 hors de cette PR' });
  });

  it('une partie qui n’est pas allée au bout ne se signe pas (D-099)', async () => {
    const enCours: ExportPartie = { ...FINIE, observation: { ...FINIE.observation, terminee: false, issue: null } };
    expect(await attester(enCours, { pr: PR, commit: COMMIT }, '')).toBeNull();
    const signe = await signerRapport(rapport(true, enCours), telephone);
    expect(signe.validation).toBeNull();
    expect(signe.valide).toBe(false);
  });

  it('la clé ne se crée qu’une fois et sa partie privée n’est pas exportable', async () => {
    const coffre = coffreMemoire();
    const signataire = creerSignataire(coffre);
    expect(await signataire.empreinte()).toBeNull();
    await Promise.all([signerRapport(rapport(true), signataire), signerRapport(rapport(true), signataire)]);
    const premiere = await signataire.empreinte();
    await signerRapport(rapport(true), signataire);
    expect(await signataire.empreinte()).toBe(premiere);
    const cles = await coffre.lire();
    expect(cles?.privee.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('jwk', cles?.privee as CryptoKey)).rejects.toThrow();
  });

  it('PR-05 : le fichier de clés du dépôt ne contient que des parties publiques', () => {
    const texte = readFileSync(`${REPO_ROOT}/${FICHIER_CLES}`, 'utf8');
    expect(() => lireCles(texte)).not.toThrow();
    // Une clé privée JWK porterait « d » ; une clé PEM, « PRIVATE KEY ».
    expect(texte).not.toMatch(/"d"\s*:|PRIVATE KEY/);
  });

  it('RP-05 : le journal des parties humaines ne liste que des validations reconnues, chacune liée à sa partie signée', () => {
    const journal = readFileSync(`${REPO_ROOT}/docs/journal-parties-humaines.md`, 'utf8').replaceAll('\r\n', '\n');
    const section = /^## Validations signées\n([\s\S]*?)(?=^## )/m.exec(journal)?.[1];
    expect(section).toBeDefined();
    const lignes = (section ?? '').split('\n').filter((ligne) => ligne.startsWith('- '));
    for (const ligne of lignes) {
      expect(ligne).toMatch(/^- [A-Z0-9-]+ · version \S+ · commit [0-9a-f]{7} · (évacuation|défaite) en \d+ actions · \[partie\]\(https:\/\/github\.com\/greffeb\/void-walker\/pull\/\d+#issuecomment-\d+\)$/);
    }
  });

  it('un fichier de clés mal formé n’est jamais lu comme « aucune clé à vérifier »', () => {
    expect(() => lireCles('{}')).toThrow(/liste « cles » absente/);
    expect(() => lireCles('{"cles":[{"nom":"x","cle":{"kty":"EC","crv":"P-256","x":"a","y":"b"}}]}')).toThrow(/illisible/);
    const c43 = 'A'.repeat(43);
    expect(() => lireCles(`{"cles":[{"nom":"x","cle":{"kty":"EC","crv":"P-256","x":"${c43}","y":"${c43}","d":"${c43}"}}]}`)).toThrow(/privée/);
  });

  it('#183 : un commentaire qui contient de faux blocs json et de validation ne fait pas refuser une validation authentique', async () => {
    const piege = 'Voilà :\n```json\n{"erreur":"x"}\n```\n### Rejouer\n```void-walker-validation\n{}\n```';
    const avecPiege: Rapport = {
      ...composerRapport((MONDES['ar-01'] as EntreeMonde).monde, { version: '0.1.0', build: '412', commit: COMMIT, pr: String(PR) }, 'partie', null, piege, true),
      partie: FINIE,
    };
    const corps = await commentaire(await signerRapport(avecPiege, telephone));
    expect((await verifier(corps, [await cleDe(telephone)])).type).toBe('reconnue');
  });
});

describe('validation envoyée pendant la vérification de son commit (#180)', () => {
  const adresse = 'https://github.com/greffeb/void-walker/pull/142#issuecomment-7';
  const run = (status: string, conclusion: string | null, created_at: string, run_attempt = 1) => ({ status, conclusion, created_at, run_attempt });

  it('attendue tant que la vérification tourne, puis reconnue si elle finit au vert', async () => {
    const cles = [await cleDe(telephone)];
    const corps = await commentaire(await signerRapport(rapport(true), telephone));
    expect(commitSigne(corps)).toBe(COMMIT);
    const signee = await verifier(corps, cles);
    expect(signee.type).toBe('reconnue');

    const pendant = selonVerification(signee, etatDesRuns([run('in_progress', null, '2026-10-16T10:00:00Z')]));
    expect(pendant).toMatchObject({ type: 'en_attente', verification: 'en_cours', nom: 'Téléphone du porteur du projet' });
    const attente = reponse(pendant, adresse) ?? '';
    expect(attente).toContain('**Validation en attente**');
    expect(attente).toContain('commit `e27d220` est encore en cours');
    expect(attente).not.toContain('Validation reconnue');

    const apres = selonVerification(signee, etatDesRuns([run('completed', 'success', '2026-10-16T10:00:00Z')]));
    expect(apres).toEqual(signee);
    expect(reponse(apres, adresse)).toContain('**Validation reconnue**');
  });

  it('non prise en compte si la vérification de ce commit échoue', async () => {
    const cles = [await cleDe(telephone)];
    const signee = await verifier(await commentaire(await signerRapport(rapport(true), telephone)), cles);
    const apres = selonVerification(signee, etatDesRuns([run('completed', 'failure', '2026-10-16T10:00:00Z')]));
    expect(apres.type).toBe('ecartee');
    const texte = reponse(apres, adresse) ?? '';
    expect(texte).toContain('**Validation non prise en compte**');
    expect(texte).toContain('a échoué');
    expect(texte).not.toContain('Validation reconnue');
  });

  it('vérification interrompue ou introuvable : en attente, jamais reconnue', async () => {
    const signee = await verifier(await commentaire(await signerRapport(rapport(true), telephone)), [await cleDe(telephone)]);
    expect(selonVerification(signee, etatDesRuns([run('completed', 'cancelled', '2026-10-16T10:00:00Z')]))).toMatchObject({ type: 'en_attente', verification: 'interrompue' });
    expect(selonVerification(signee, etatDesRuns([]))).toMatchObject({ type: 'en_attente', verification: 'inconnue' });
  });

  it('le dernier run du commit fait foi, tentatives comprises', () => {
    expect(etatDesRuns([run('completed', 'failure', '2026-10-16T10:00:00Z'), run('completed', 'success', '2026-10-16T11:00:00Z')])).toBe('verte');
    expect(etatDesRuns([run('completed', 'success', '2026-10-16T10:00:00Z'), run('queued', null, '2026-10-16T11:00:00Z')])).toBe('en_cours');
    expect(etatDesRuns([run('completed', 'failure', '2026-10-16T10:00:00Z', 1), run('completed', 'success', '2026-10-16T10:00:00Z', 2)])).toBe('verte');
    expect(etatDesRuns([run('completed', 'timed_out', '2026-10-16T10:00:00Z')])).toBe('echec');
  });

  it('les refus et les simples retours ne dépendent pas de la vérification', async () => {
    expect(selonVerification({ type: 'aucune' }, 'echec')).toEqual({ type: 'aucune' });
    expect(selonVerification({ type: 'refusee', raison: 'x' }, 'verte')).toEqual({ type: 'refusee', raison: 'x' });
    expect(commitSigne('pas de validation')).toBeNull();
    expect(marqueurReponse(7)).toBe('<!-- void-walker:validation-de 7 -->');
  });
});
