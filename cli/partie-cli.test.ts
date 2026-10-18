import { assemblerStation, empreinteEtat, idPublic, lireExport, nouvellePartie, observer, rejouer, reprendrePartie } from '../engine';
import { COMPOSITIONS_PUBLIEES, creerCatalogue, MONDES, PAIRES, raconterFin, type Catalogue, type EntreeMonde } from '../content';
import { AIDE, choisirEntree, executer, PARTIE_PAR_DEFAUT, type Contexte, type EntreesSorties, type Sortie } from './partie-cli';

const ENTREE = MONDES['monde-test'] as EntreeMonde;
const AR01 = MONDES['ar-01'] as EntreeMonde;
const VERSION = 'test-cli';
const CATALOGUE = creerCatalogue(assemblerStation);
const STATION = 'm07-m03-soute-2718281828';

function contexte(fichiers = new Map<string, string>(), ecritureEnPanne = false, entree = ENTREE): Contexte & { fichiers: Map<string, string> } {
  return {
    monde: entree.monde,
    textes: entree.textes,
    version: VERSION,
    fichiers,
    es: {
      lire: (chemin) => fichiers.get(chemin) ?? null,
      ecrire: (chemin, contenu) => {
        if (ecritureEnPanne) throw new Error('disque plein');
        fichiers.set(chemin, contenu);
      },
      graineAleatoire: () => 77,
    },
  };
}

function numero(lignes: readonly string[], libelle: string): string {
  const ligne = lignes.find((candidate) => candidate.trim().replace(/^\d+\. /, '').startsWith(libelle));
  const trouve = ligne?.trim().match(/^(\d+)\./)?.[1];
  if (trouve === undefined) throw new Error(`Action « ${libelle} » absente :\n${lignes.join('\n')}`);
  return trouve;
}

describe('CLI', () => {
  it('joue le parcours du monde de test et exporte une partie qui se rejoue à l’identique', () => {
    const ctx = contexte();
    let sortie = executer(['nouvelle', '--graine', '5'], ctx);
    expect(sortie.code).toBe(0);
    expect(sortie.lignes).toContain('Partie enregistrée.');
    for (const libelle of ['Prendre le carnet', 'Ouvrir la porte de l’atelier', 'Aller dans l’atelier', 'Poser le carnet']) {
      sortie = executer(['jouer', numero(sortie.lignes, libelle)], ctx);
      expect(sortie.code).toBe(0);
    }
    expect(sortie.lignes).toContain('Vous êtes dans l’atelier.');
    expect(sortie.lignes).toContain('Vous voyez ici un carnet et une trousse de soin.');
    expect(sortie.lignes).toContain('Actions engagées : 4');

    expect(executer(['exporter', 'export.json', '--commentaire', 'essai'], ctx)).toEqual({
      lignes: ['Partie exportée dans export.json (4 actions engagées). La partie continue.'],
      code: 0,
    });
    const fichier = lireExport(JSON.parse(ctx.fichiers.get('export.json') ?? 'null'));
    expect(fichier.commentaire).toBe('essai');
    expect(empreinteEtat(rejouer(ENTREE.monde, fichier, VERSION).partie.etat)).toBe(fichier.empreinte);
    expect(executer(['voir'], ctx).lignes).toContain('Actions engagées : 4');
  });

  it('carte : la vue liste, gratuite, sans chiffre ni identifiant (14 §3.5, K-07)', () => {
    const ctx = contexte();
    executer(['nouvelle', '--graine', '5'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const sortie = executer(['carte'], ctx);
    expect(sortie).toEqual({
      lignes: [
        '── ICI ──',
        'CABINE : @ vous',
        'porte de l’atelier : fermé',
        'grille de la soute : fermé',
        '── VISITÉES, DE LA PLUS PROCHE ──',
        'aucune',
        '── CONNUES, PAS ENCORE VISITÉES ──',
        'ATELIER : par sa porte',
        'SOUTE : par sa porte',
      ],
      code: 0,
    });
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
    expect(executer(['aide'], ctx).lignes.some((ligne) => ligne.trimStart().startsWith('carte'))).toBe(true);
  });

  it('carte sans partie en cours : le dit, code d’erreur', () => {
    expect(executer(['carte'], contexte())).toEqual({ lignes: ['Aucune partie en cours. Commencez par : nouvelle'], code: 1 });
  });

  it('une option indisponible est refusée : partie et fichier inchangés', () => {
    const ctx = contexte();
    const debut = executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const sortie = executer(['jouer', numero(debut.lignes, 'Aller dans l’atelier')], ctx);
    expect(sortie.code).toBe(0);
    expect(sortie.lignes[0]).toBe('Ce passage est fermé : vous ne pouvez pas le franchir.');
    expect(sortie.lignes).not.toContain('Partie enregistrée.');
    expect(sortie.lignes).toContain('Actions engagées : 0');
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
  });

  it('regarder ne change rien et n’enregistre rien', () => {
    const ctx = contexte();
    const debut = executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const sortie = executer(['jouer', numero(debut.lignes, 'Regarder le carnet')], ctx);
    expect(sortie.code).toBe(0);
    expect(sortie.lignes).not.toContain('Partie enregistrée.');
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
  });

  it('aperçu : risque, coût et ce que l’on sait, sans rien jouer ni enregistrer (12 §3.8)', () => {
    const ctx = contexte();
    const debut = executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const prendre = numero(debut.lignes, 'Prendre le carnet');
    expect(executer(['apercu', prendre], ctx)).toEqual({
      lignes: [
        'Aperçu : Prendre le carnet',
        '  Risque : aucun risque connu',
        '  Coût : aucun',
        '  Vous aurez le carnet en main.',
        `Rien n’est joué. Pour confirmer : jouer ${prendre}`,
      ],
      code: 0,
    });
    expect(executer(['apercu', numero(debut.lignes, 'Aller dans l’atelier')], ctx).lignes).toEqual([
      'Aperçu : Aller dans l’atelier',
      '  Ce passage est fermé : vous ne pouvez pas le franchir.',
    ]);
    const regarder = numero(debut.lignes, 'Regarder le carnet');
    expect(executer(['apercu', regarder], ctx).lignes).toEqual([`Regarder le carnet : gratuit, rien à confirmer. Pour le faire : jouer ${regarder}`]);
    expect(executer(['apercu', '99'], ctx).code).toBe(1);
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
    expect(executer(['voir'], ctx).lignes).toContain('Actions engagées : 0');
  });

  it('aperçu : la créature entendue derrière la porte rend le passage risqué, dit comme dans l’appli (D-181)', () => {
    const ctx = contexte();
    const debut = executer(['nouvelle'], ctx);
    const ouverte = executer(['jouer', numero(debut.lignes, 'Ouvrir la porte de l’atelier')], ctx);
    const aller = numero(ouverte.lignes, 'Aller dans l’atelier');
    expect(executer(['apercu', aller], ctx).lignes).toEqual([
      'Aperçu : Aller dans l’atelier',
      '  Risque : modéré — quelque chose bougeait derrière la porte de l’atelier',
      '  Coût : aucun',
      '  Vous quitterez la cabine.',
      `Rien n’est joué. Pour confirmer : jouer ${aller}`,
    ]);
  });

  it('commande brute invalide : refus explicite sans effet', () => {
    const ctx = contexte();
    executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    expect(executer(['commande', 'voler', 'e12345678'], ctx).lignes[0]).toBe('Cette action n’existe pas : rien n’a été joué.');
    expect(executer(['commande', 'prendre', 'objet-carnet'], ctx).lignes[0]).toBe('Cette action ne peut pas viser cela ici.');
    // Un paramètre donné à une action qui n'en prend pas est refusé.
    const carnet = idPublic(ENTREE.monde.id, 'objet-carnet');
    expect(executer(['commande', 'prendre', carnet, carnet], ctx).lignes[0]).toBe('Commande illisible : rien n’a été joué.');
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
  });

  it('voir --ids montre les commandes brutes, utilisables avec « commande »', () => {
    const ctx = contexte();
    executer(['nouvelle'], ctx);
    const ligne = executer(['voir', '--ids'], ctx).lignes.find((candidate) => candidate.includes('Prendre le carnet')) ?? '';
    const [, action, cible] = ligne.match(/\[(\w+) (e[0-9a-f]{8})\]/) ?? [];
    expect(action).toBe('prendre');
    const sortie = executer(['commande', action ?? '', cible ?? ''], ctx);
    expect(sortie.lignes).toContain('Actions engagées : 1');
  });

  it('écriture impossible : avertissement, jamais « enregistrée » (C-09 §3)', () => {
    const ctx = contexte(new Map(), true);
    const sortie = executer(['nouvelle'], ctx);
    expect(sortie.lignes.some((ligne) => ligne.startsWith('ATTENTION'))).toBe(true);
    expect(sortie.lignes).not.toContain('Partie enregistrée.');
  });

  it('sans partie, avec une sauvegarde corrompue ou un numéro invalide : message clair', () => {
    expect(executer(['voir'], contexte()).lignes[0]).toMatch(/Aucune partie en cours/);
    const corrompue = contexte(new Map([[PARTIE_PAR_DEFAUT, '{"enregistrement":{}}']]));
    expect(executer(['voir'], corrompue).lignes[0]).toMatch(/ne peut pas reprendre/);
    const ctx = contexte();
    executer(['nouvelle'], ctx);
    expect(executer(['jouer', '99'], ctx).code).toBe(1);
    expect(executer(['nouvelle', '--graine', '-3'], ctx).code).toBe(1);
    expect(executer(['nouvelle', '--graine'], ctx).code).toBe(1);
    expect(executer(['nouvelle', '--graine', '1e3'], ctx).code).toBe(1);
    expect(executer(['nouvelle', '42'], ctx).code).toBe(1);
    expect(executer(['inconnue'], ctx).code).toBe(1);
  });

  it('AR-01 : joue P-A jusqu’à l’évacuation, messages de l’IA après le récit, fin dite clairement', () => {
    const ctx = contexte(new Map(), false, AR01);
    let sortie = executer(['nouvelle', '--graine', '7'], ctx);
    expect(sortie.lignes).toContain('[ IA STATION ] « Une capsule de secours est disponible. Son circuit de départ ne répond pas. »');
    const etapes = [
      'Aller dans l’atelier maintenance',
      'Déplacer la caisse sous la grille',
      'Ouvrir la grille',
      'Passer par la grille',
      'Ouvrir le panneau',
      'Aller dans la salle d’embarquement',
      'Fermer la cloison de la baie d’observation',
      'Aller dans le local énergie',
      'Réarmer la console de départ',
      'Aller dans la salle d’embarquement',
      'Ouvrir l’écoutille de la cabine de la capsule',
      'Aller dans la cabine de la capsule',
      'Fermer l’écoutille de la salle d’embarquement',
      'Lancer la capsule depuis le pupitre de départ',
    ];
    for (const libelle of etapes) {
      sortie = executer(['jouer', numero(sortie.lignes, libelle)], ctx);
      expect(sortie.code).toBe(0);
      expect(sortie.lignes).toContain('Partie enregistrée.');
      if (libelle === 'Passer par la grille') {
        expect(sortie.lignes.some((ligne) => ligne.startsWith('[ IA STATION ] « Le circuit de départ'))).toBe(true);
      }
    }
    const fin = sortie.lignes;
    const message = fin.indexOf('[ IA STATION ] « Alimentation confirmée. Écoutille fermée. Départ engagé. »');
    expect(message).toBeGreaterThan(0);
    expect(fin.indexOf('Partie enregistrée.')).toBeGreaterThan(message);
    expect(fin).toContain('La capsule s’est détachée. Vous avez quitté la station.');
    expect(fin).not.toContain('Cette partie est terminée. Elle ne peut pas être reprise.');
    expect(fin).toContain('Partie terminée : plus aucune action possible.');
    expect(fin).toContain('Actions engagées : 14');
    // L'écran de fin, mêmes mots que l'appli (D-281, C-06 K-07) : titre, récit de la partie, message de départ.
    const ecranFin = fin.slice(fin.indexOf('> FIN DE LA PARTIE'));
    expect(ecranFin[1]).toBe('La capsule s’est détachée.');
    expect(ecranFin[3]).toBe('Vous vous êtes réveillé dans le salon de transit. Dans le local énergie, vous avez découvert un passage caché.');
    expect(ecranFin.at(-2)).toMatch(/Vous partez indemne\. Vous n’avez jamais vu ce qui rôdait à bord\.$/);
    expect(ecranFin.at(-1)).toBe('[ IA STATION ] « Alimentation confirmée. Écoutille fermée. Départ engagé. »');
    expect(executer(['voir'], ctx).lignes.slice(-ecranFin.length)).toEqual(ecranFin);
    // Même récit que l'appli : celui de la partie enregistrée, relue du réveil (D-281).
    const partie = reprendrePartie(AR01.monde, JSON.parse(ctx.fichiers.get(PARTIE_PAR_DEFAUT) ?? 'null') as unknown, VERSION);
    const { graine } = partie.enregistrement;
    const pas = [nouvellePartie(AR01.monde, { version: VERSION, graine }).derniers, ...rejouer(AR01.monde, partie.enregistrement, VERSION).etapes];
    const recit = raconterFin(AR01.textes, pas, { issue: 'evacuation', sante: observer(AR01.monde, partie.etat).sante, graine, menace: true });
    expect(ecranFin).toEqual(['> FIN DE LA PARTIE', recit.titre, ...recit.paragraphes.flatMap((paragraphe) => ['', paragraphe]), `[ IA STATION ] « ${recit.assistance.join('')} »`]);
    expect(executer(['jouer', '1'], ctx)).toEqual({ lignes: ['Cette partie est terminée : rien n’a été joué.'], code: 1 });
    expect(executer(['voir'], ctx).lignes).toContain('[ IA STATION ] « Alimentation confirmée. Écoutille fermée. Départ engagé. »');
    expect(executer(['exporter', 'fin.json'], ctx)).toEqual({
      lignes: ['Partie exportée dans fin.json (14 actions engagées). La partie est terminée.'],
      code: 0,
    });
  });

  it('choix du monde : --monde, sinon celui de la partie enregistrée, sinon une station tirée', () => {
    const ctx = contexte();
    expect(idStation(choisirEntree(['nouvelle'], CATALOGUE, ctx.es))).toMatch(/^(m\d\d-){2,3}[a-z]+-\d+$/);
    expect(choisirEntree(['nouvelle', '--monde', 'monde-test'], CATALOGUE, ctx.es)).toBe(ENTREE);
    executer(['nouvelle'], ctx);
    expect(choisirEntree(['voir'], CATALOGUE, ctx.es)).toBe(ENTREE);
    expect(idStation(choisirEntree(['nouvelle'], CATALOGUE, ctx.es))).toMatch(/^(m\d\d-){2,3}[a-z]+-\d+$/);
    expect(choisirEntree(['voir', '--monde', 'ailleurs'], CATALOGUE, ctx.es)).toMatch(/^Monde inconnu : ailleurs\./);
    expect(choisirEntree(['voir', '--monde', 'constructor'], CATALOGUE, ctx.es)).toMatch(/^Monde inconnu : constructor\./);
    expect(choisirEntree(['voir', '--monde'], CATALOGUE, ctx.es)).toMatch(/--monde <id>/);
  });

  it('une partie enregistrée sur AR-01 reprend sur AR-01 ; --monde ar-01 donne AR-01', () => {
    const ctx = contexte(new Map(), false, AR01);
    expect(choisirEntree(['nouvelle', '--monde', 'ar-01'], CATALOGUE, ctx.es)).toBe(AR01);
    executer(['nouvelle'], ctx);
    expect(choisirEntree(['voir'], CATALOGUE, ctx.es)).toBe(AR01);
    expect(choisirEntree(['jouer', '1'], CATALOGUE, ctx.es)).toBe(AR01);
  });
});

/** Comme `cli/main.ts` : un monde refusé est dit, code 1. */
function appeler(argv: readonly string[], catalogue: Catalogue, es: EntreesSorties): Sortie {
  const entree = choisirEntree(argv, catalogue, es);
  if (typeof entree === 'string') return { lignes: [entree], code: 1 };
  return executer(argv, { monde: entree.monde, textes: entree.textes, version: VERSION, es });
}

function idStation(resultat: EntreeMonde | string): string {
  if (typeof resultat === 'string') throw new Error(resultat);
  return resultat.monde.id;
}

function mondeEnregistre(fichiers: ReadonlyMap<string, string>): unknown {
  return (JSON.parse(fichiers.get(PARTIE_PAR_DEFAUT) ?? 'null') as { enregistrement: { monde: unknown } }).enregistrement.monde;
}

describe('CLI : station tirée (#152)', () => {
  it('nouvelle sans option tire une station publiée, réveil dans le vestibule ; voir la reprend, même avec un autre catalogue', () => {
    const ctx = contexte();
    const debut = appeler(['nouvelle'], CATALOGUE, ctx.es);
    expect(debut.code).toBe(0);
    expect(debut.lignes).toContain('Partie enregistrée.');
    expect(debut.lignes).toContain('Vous êtes dans le vestibule.');
    const id = String(mondeEnregistre(ctx.fichiers));
    const [, composition, graine] = /^([a-z0-9-]+)-(0|[1-9][0-9]*)$/.exec(id) ?? [];
    expect(COMPOSITIONS_PUBLIEES).toContain(composition);
    expect(Number(graine)).toBeLessThanOrEqual(0xffffffff);

    const ailleurs = creerCatalogue(assemblerStation);
    expect(idStation(choisirEntree(['voir'], ailleurs, ctx.es))).toBe(id);
    const reprise = appeler(['voir'], ailleurs, ctx.es);
    expect(reprise.code).toBe(0);
    expect(reprise.lignes).toContain('Vous êtes dans le vestibule.');
    expect(reprise.lignes).toContain('Actions engagées : 0');
  });

  it('--station <composition> force la composition, plan tiré', () => {
    const ctx = contexte();
    for (const composition of COMPOSITIONS_PUBLIEES) {
      expect(idStation(choisirEntree(['nouvelle', '--station', composition], CATALOGUE, ctx.es))).toMatch(new RegExp(`^${composition}-(0|[1-9][0-9]*)$`));
    }
    const sortie = appeler(['nouvelle', '--station', 'm10-m03-entrepot'], CATALOGUE, ctx.es);
    expect(sortie.code).toBe(0);
    expect(String(mondeEnregistre(ctx.fichiers))).toMatch(/^m10-m03-entrepot-/);
  });

  it('--station <identifiant> force cette station exacte, et l’emporte sur --monde', () => {
    const ctx = contexte();
    expect(appeler(['nouvelle', '--station', STATION], CATALOGUE, ctx.es).code).toBe(0);
    expect(mondeEnregistre(ctx.fichiers)).toBe(STATION);
    expect(idStation(choisirEntree(['voir'], CATALOGUE, ctx.es))).toBe(STATION);
    expect(idStation(choisirEntree(['nouvelle', '--monde', 'ar-01', '--station', STATION], CATALOGUE, ctx.es))).toBe(STATION);
    expect(idStation(choisirEntree(['nouvelle', '--station', STATION, '--monde', 'ar-01'], CATALOGUE, ctx.es))).toBe(STATION);
  });

  it('station refusée : son motif, code 1, partie enregistrée inchangée', () => {
    const ctx = contexte();
    appeler(['nouvelle', '--station', STATION], CATALOGUE, ctx.es);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    expect(appeler(['nouvelle', '--station', 'm07-m03-inconnue-1'], CATALOGUE, ctx.es)).toEqual({
      lignes: ['Station refusée : Station inconnue : m07-m03-inconnue-1.'],
      code: 1,
    });
    for (const id of ['M07-M03-SOUTE-1', 'm07-m03-soute-4294967296', 'm07-m03-soute-007', 'toString', '__proto__', 'constructor']) {
      const sortie = appeler(['voir', '--station', id], CATALOGUE, ctx.es);
      expect(sortie.code).toBe(1);
      expect(sortie.lignes).toHaveLength(1);
      expect(sortie.lignes[0]).toMatch(/^Station refusée : /);
    }
    expect(appeler(['nouvelle', '--station'], CATALOGUE, ctx.es)).toEqual({ lignes: ['Indiquez la station : --station <id>.'], code: 1 });
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
  });

  it('G-02 : sans la paire M-03 + M-07 dans la table, --station est refusé avec le motif de la table', () => {
    const catalogue = creerCatalogue(assemblerStation, PAIRES.filter((ligne) => !(ligne.a === 'M-03' && ligne.b === 'M-07')));
    const refus = { lignes: ['Station refusée : Paire M-03 + M-07 absente de la table : refusée par défaut.'], code: 1 };
    const ctx = contexte();
    expect(appeler(['nouvelle', '--station', 'm07-m03-soute'], catalogue, ctx.es)).toEqual(refus);
    expect(appeler(['nouvelle', '--station', STATION], catalogue, ctx.es)).toEqual(refus);
    expect(ctx.fichiers.size).toBe(0);
  });

  it('partie enregistrée sur une station inconnue : le dit, code 1, sans tirer une autre station ; nouvelle la remplace', () => {
    const ancienne = JSON.stringify({ enregistrement: { monde: 'm07-m03-cale-5' } });
    const ctx = contexte(new Map([[PARTIE_PAR_DEFAUT, ancienne]]));
    const sansTirage: EntreesSorties = {
      ...ctx.es,
      graineAleatoire: () => {
        throw new Error('tirage inattendu');
      },
    };
    const refus = { lignes: ['La partie enregistrée porte sur une station inconnue (m07-m03-cale-5). Commencez une nouvelle partie : nouvelle'], code: 1 };
    expect(appeler(['voir'], CATALOGUE, sansTirage)).toEqual(refus);
    expect(appeler(['jouer', '1'], CATALOGUE, sansTirage)).toEqual(refus);
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(ancienne);
    expect(appeler(['nouvelle'], CATALOGUE, ctx.es).code).toBe(0);
    expect(String(mondeEnregistre(ctx.fichiers))).toMatch(/^(m\d\d-){2,3}[a-z]+-\d+$/);
  });

  it('aide : --station, et --monde sans partie donne une station tirée', () => {
    expect(AIDE.some((ligne) => ligne.startsWith('Option : --station <id>'))).toBe(true);
    expect(AIDE).toContain('Option : --monde <id>  (à la reprise, le monde de la partie enregistrée ; sinon une station tirée)');
  });
});
