import { empreinteEtat, observer, type OptionMenu } from '../engine';
import { MONDES, type EntreeMonde } from '../content';
import { commencer, jouerOption, type Environnement, type Jeu } from '../app/jeu';
import { composerRapport, creerRapports } from '../app/rapports';
import type { Stockage } from '../app/sauvegarde';
import type { Github } from '../report-service/src/github';
import { GardeRapports, gardeDistante, traiter, type Env, type Stockage as StockageGarde } from '../report-service/src/index';
import { lireSource, rejouerExport } from './rejouer-export';

// De bout en bout (C-10 PR-01, PR-02, PR-09) : le jeu compose le rapport, le service le publie, un agent le rejoue.
// Dans tools/ : seul dossier qui peut réunir app/ et report-service/ (AP-01).

const entree = MONDES['monde-test'] as EntreeMonde;

function memoire(): Stockage {
  let donnees: unknown = null;
  return {
    lire: async () => donnees,
    ecrire: async (nouvelles) => {
      donnees = nouvelles;
    },
    lireLus: async () => null,
    ecrireLus: async () => undefined,
    effacer: async () => {
      donnees = null;
    },
  };
}

const env: Environnement = { monde: entree.monde, textes: entree.textes, version: '0.1.0', stockage: memoire(), graine: () => 20261013 };

async function jouer(...actions: string[]): Promise<Jeu> {
  let jeu = await commencer(env);
  for (const action of actions) {
    const option = observer(env.monde, jeu.partie.etat).menu.find((choix) => choix.action === action && choix.disponible) as OptionMenu;
    jeu = await jouerOption(env, jeu, option);
  }
  return jeu;
}

/** Le vrai service, avec sa vraie garde en mémoire et un GitHub qui garde les corps publiés. */
function service(prOuverte = true) {
  const valeurs = new Map<string, unknown>();
  const stockage: StockageGarde = {
    get: async <T>(cle: string) => valeurs.get(cle) as T | undefined,
    put: async (cle, valeur) => {
      valeurs.set(cle, structuredClone(valeur));
    },
  };
  const objet = new GardeRapports({ storage: stockage });
  let file: Promise<unknown> = Promise.resolve();
  const envService: Env = {
    GITHUB_JETON: 'x',
    DEPOT: 'greffeb/void-walker',
    ORIGINES: 'https://greffeb.github.io',
    // Portes d'entrée de l'objet durable simulées : ses demandes passent une à une.
    GARDE: {
      idFromName: (nom) => nom,
      get: () => ({
        fetch: (requete) => {
          const reponse = file.then(() => objet.fetch(requete));
          file = reponse.catch(() => undefined);
          return reponse;
        },
      }),
    },
  };
  const publies: { adresse: string; corps: string; pr?: number }[] = [];
  const gh: Github = {
    creerIssue: async (_titre, corps) => {
      const adresse = `https://github.com/greffeb/void-walker/issues/${200 + publies.length}`;
      publies.push({ adresse, corps });
      return adresse;
    },
    commenter: async (pr, corps) => {
      const adresse = `https://github.com/greffeb/void-walker/pull/${pr}#issuecomment-${9000 + publies.length}`;
      publies.push({ adresse, corps, pr });
      return adresse;
    },
    prOuverte: async () => prOuverte,
  };
  let enLigne = true;
  /** Un jeu sur un appareil : sa propre file, le même service. */
  const appareilJeu = () => {
    const appareil = new Map<string, string>();
    return creerRapports({
    adresse: 'https://void-walker-rapports.example/rapports',
    appeler: async (adresse, init) => {
      if (!enLigne) throw new TypeError('Failed to fetch');
      const reponse = await traiter(
        new Request(adresse, { ...init, headers: { ...(init.headers as Record<string, string>), Origin: 'https://greffeb.github.io' } }),
        envService,
        { garde: gardeDistante(envService), gh },
      );
      return { status: reponse.status };
    },
    lire: (cle) => appareil.get(cle) ?? null,
    ecrire: (cle, valeur) => appareil.set(cle, valeur),
    maintenant: () => Date.now(),
    });
  };
  return {
    rapports: appareilJeu(),
    appareilJeu,
    publies,
    couper: (coupe: boolean) => {
      enLigne = !coupe;
    },
  };
}

const PUBLIQUE = { version: '0.1.0', build: '412', commit: 'e27d2204f1c3', pr: '' };

describe('rapports de bout en bout (C-10)', () => {
  it('PR-02 : un bug signalé en cours de partie se rejoue à l’identique depuis son issue', async () => {
    const jeu = await jouer('prendre', 'ouvrir', 'aller');
    const { rapports, publies } = service();
    expect(await rapports.envoyer(composerRapport(env.monde, PUBLIQUE, 'bug', jeu, 'La porte claque deux fois.', false))).toBe('envoye');
    expect(publies).toHaveLength(1);
    const corps = publies[0]?.corps ?? '';
    expect(corps).toContain('La porte claque deux fois.');
    for (const ligne of jeu.recit) expect(corps).toContain(ligne);

    const json = await lireSource(publies[0]?.adresse ?? '', () => '', () => corps);
    const rejeu = rejouerExport(json, '0.1.0');
    expect(rejeu.identique).toBe(true);
    expect(rejeu.lignes.at(-2)).toBe(`Même état final : oui (empreinte ${empreinteEtat(jeu.partie.etat)}, attendue ${empreinteEtat(jeu.partie.etat)}).`);
  });

  it('PR-01 : sans réseau le rapport est gardé, la partie reste intacte, puis il part au retour du réseau', async () => {
    const jeu = await jouer('prendre');
    const avant = empreinteEtat(jeu.partie.etat);
    const { rapports, publies, couper } = service();
    couper(true);
    expect(await rapports.envoyer(composerRapport(env.monde, PUBLIQUE, 'bug', jeu, '', false))).toBe('garde');
    expect(empreinteEtat(jeu.partie.etat)).toBe(avant);
    expect(publies).toHaveLength(0);
    couper(false);
    await rapports.renvoyer();
    expect(publies).toHaveLength(1);
    expect(rapports.enAttente()).toBe(0);
    expect(rejouerExport(await lireSource('rapport.md', () => publies[0]?.corps ?? ''), '0.1.0').identique).toBe(true);
  });

  it('PR-09 : une partie envoyée depuis la version de test d’une PR arrive en commentaire de cette PR, rejouable', async () => {
    const jeu = await jouer('prendre', 'ouvrir', 'aller', 'poser');
    const { rapports, publies } = service(true);
    const test = { ...PUBLIQUE, pr: '142' };
    expect(await rapports.envoyer(composerRapport(env.monde, test, 'partie', jeu, 'Bonne partie.', true))).toBe('envoye');
    expect(publies[0]?.pr).toBe(142);
    expect(publies[0]?.corps).toContain('cochée, sans signature');
    const json = await lireSource(publies[0]?.adresse ?? '', () => '', () => publies[0]?.corps ?? '');
    expect(rejouerExport(json, '0.1.0').identique).toBe(true);
  });

  it('PR-06 : le même rapport envoyé en rafale depuis plusieurs appareils n’est publié qu’une fois', async () => {
    const jeu = await jouer('prendre');
    const { publies, appareilJeu } = service();
    const rapport = composerRapport(env.monde, PUBLIQUE, 'bug', jeu, 'Encore.', false);
    // Cinq jeux, donc sans la patience propre à chaque jeu : seul le service peut arrêter la rafale.
    const retours = await Promise.all(Array.from({ length: 5 }, () => appareilJeu().envoyer(rapport)));
    expect(retours).toEqual(Array<string>(5).fill('envoye'));
    expect(publies).toHaveLength(1);
  });

  it('un bug signalé sans partie en cours part avec son seul commentaire', async () => {
    const { rapports, publies } = service();
    expect(await rapports.envoyer(composerRapport(env.monde, PUBLIQUE, 'bug', null, 'Le jeu ne démarre pas.', false))).toBe('envoye');
    expect(publies[0]?.corps).toContain('Le jeu ne démarre pas.');
    await expect(lireSource('x.md', () => publies[0]?.corps ?? '')).rejects.toThrow(/Ni export/);
  });
});
