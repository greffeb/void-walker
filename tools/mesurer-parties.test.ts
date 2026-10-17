import { exporter, type ExportPartie } from '../engine';
import { MARQUEUR } from '../report-service/src/rapport';
import { creerBot, jouerAvecBot } from './bots';
import { CATALOGUE } from './catalogue';
import { rejouerPourMesure } from './indicateurs-partie';
import { contrefactuelApproche, enMarkdown, lireRapport, mediane, mesurerRapport, partieJouee, rapportsDuDepot, type LecteurJson } from './mesurer-parties';

// Parties humaines (#194 §2.1) : lecture des rapports, indicateurs tirés de l'export et contrefactuel du seuil d'esquive.

const entree = CATALOGUE.resoudre('m07-m03-soute-2718281828');
if ('refus' in entree) throw new Error(entree.refus);
/** Partie du bot pressé, graine 1 : au moins un jet d'interception. */
const fichier = exporter(entree.monde, jouerAvecBot(entree, creerBot('presse', 1), 1).partie);

/** Export minimal, sans rejeu possible : seuls les tirages, la santé et l'issue comptent. */
function exportFactice(tirages: readonly (readonly number[])[], sante: ExportPartie['observation']['sante'], issue: 'evacuation' | 'defaite' | null): ExportPartie {
  return { ...fichier, monde: 'inconnu', actions: tirages.map((liste) => ({ commande: { action: 'attendre', cible: 'x' }, tirages: liste })), observation: { ...fichier.observation, sante, issue } };
}

describe('mesurer:parties', () => {
  it("lit l'export seul : issue, santé, dés et jets qui ont touché", () => {
    expect(partieJouee(exportFactice([[], [2], [5, 3], []], 'critique', 'evacuation'))).toEqual({ issue: 'evacuation', actions: 4, sante: 'critique', des: 3, touches: 2 });
    expect(partieJouee(exportFactice([[1]], 'vaincu', null)).issue).toBe('defaite');
    expect(partieJouee(exportFactice([[]], 'indemne', null)).issue).toBe('en_cours');
  });

  it('contrefactuel approché : la défaite tombe au jet qui épuise les paliers', () => {
    const blesse = exportFactice([[], [5], [], [4], [6]], 'blesse', 'evacuation');
    expect(contrefactuelApproche(blesse, 6)).toEqual({ issue: 'defaite', actions: 4, exact: false });
    expect(contrefactuelApproche(blesse, 4)).toEqual({ issue: 'evacuation', actions: 5, exact: false });
    expect(contrefactuelApproche(blesse, 3)).toEqual({ issue: 'evacuation', actions: 5, exact: false });
  });

  it('contrefactuel exact quand le moteur actuel rejoue la partie', async () => {
    const partie = await mesurerRapport({ adresse: 'fichier.json', corps: JSON.stringify(fichier) });
    expect(partie?.rejeu).toEqual({ identique: true });
    expect(partie?.jouee.des).toBe(fichier.actions.flatMap((entreeJournal) => entreeJournal.tirages).length);
    // Rejouée à l'identique : les jets qui ont touché sont ceux du rejeu, au seuil de sa version.
    expect(partie?.jouee.touches).toBe(partie?.indicateurs?.parCause.griffes);
    const autre = rejouerPourMesure(entree.monde, fichier, undefined, 6).indicateurs;
    expect(partie?.contrefactuel).toEqual({ issue: autre.issue, actions: autre.actions, exact: true });
  });

  it('un monde disparu garde les indicateurs de l’export et un contrefactuel approché', async () => {
    const partie = await mesurerRapport({ adresse: 'x', corps: JSON.stringify({ ...fichier, monde: 'm07-m03-cale-5' }) });
    expect(partie?.rejeu.identique).toBe(false);
    expect(partie?.indicateurs).toBeNull();
    expect(partie?.contrefactuel.exact).toBe(false);
  });

  it('ignore un rapport sans partie', async () => {
    expect(await mesurerRapport({ adresse: 'x', corps: `${MARQUEUR}\nBug signalé, sans partie.` })).toBeNull();
  });

  it('trouve les rapports du dépôt, page par page, parmi les issues et les commentaires', async () => {
    const demandes: string[] = [];
    const lire: LecteurJson = async (chemin) => {
      demandes.push(chemin);
      if (chemin.startsWith('repos/d/issues?')) {
        return chemin.endsWith('page=1')
          ? Array.from({ length: 100 }, (_, rang) => ({ html_url: `https://github.com/d/issues/${rang}`, body: rang === 7 ? `${MARQUEUR} partie` : 'autre' }))
          : [{ html_url: 'https://github.com/d/issues/200', body: null }];
      }
      return [{ html_url: 'https://github.com/d/pull/3#issuecomment-9', body: `texte ${MARQUEUR}` }];
    };
    const rapports = await rapportsDuDepot('d', lire);
    expect(rapports.map((rapport) => rapport.adresse)).toEqual(['https://github.com/d/issues/7', 'https://github.com/d/pull/3#issuecomment-9']);
    expect(demandes).toEqual([
      'repos/d/issues?state=all&per_page=100&page=1',
      'repos/d/issues?state=all&per_page=100&page=2',
      'repos/d/issues/comments?per_page=100&page=1',
    ]);
  });

  it("lit une issue, un commentaire ou un fichier", async () => {
    const lire: LecteurJson = async (chemin) => ({ body: chemin });
    expect((await lireRapport('https://github.com/o/r/issues/5', lire)).corps).toBe('repos/o/r/issues/5');
    expect((await lireRapport('https://github.com/o/r/pull/5#issuecomment-8', lire)).corps).toBe('repos/o/r/issues/comments/8');
    expect((await lireRapport('partie.json', lire, () => '{}')).corps).toBe('{}');
  });

  it('rend le tableau et la synthèse des parties finies sur une station tirée', async () => {
    const partie = await mesurerRapport({ adresse: 'https://github.com/o/r/pull/160#issuecomment-1', corps: JSON.stringify(fichier) });
    if (partie === null) throw new Error('Partie absente.');
    const texte = enMarkdown([partie]);
    expect(texte).toContain(`dont ${partie.jouee.issue === 'en_cours' ? 0 : 1} finies sur une station tirée`);
    expect(texte).toContain('| [#160](https://github.com/o/r/pull/160#issuecomment-1) | m07-m03-soute-2718281828 |');
    expect(texte).toContain('| Parties sans aucun dé | 0 sur 1 |');
    const changee = partie.contrefactuel.issue === partie.jouee.issue ? 0 : 1;
    expect(texte).toContain(`| Avec le jet qui touche de 1 à 6, à décisions identiques : issue changée | ${changee} sur 1 |`);
  });

  it('médiane', () => {
    expect(mediane([])).toBe(0);
    expect(mediane([3, 1, 2])).toBe(2);
    expect(mediane([4, 1, 2, 3])).toBe(2.5);
  });
});
