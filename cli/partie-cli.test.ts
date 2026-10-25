import { assemblerStation, empreinteEtat, idPublic, lireExport, nouvellePartie, observer, rejouer, reprendrePartie } from '../engine';
import { COMPOSITIONS_PUBLIEES, creerCatalogue, MONDES, PAIRES, raconterFin, TEXTES_CATALOGUE, VERSION_GENERATEUR, type Catalogue, type EntreeMonde, type Nom, type TexteDocument } from '../content';
import { AIDE, choisirEntree, executer, PARTIE_PAR_DEFAUT, type Contexte, type EntreesSorties, type Sortie } from './partie-cli';

const ENTREE = MONDES['monde-test'] as EntreeMonde;
const AR01 = MONDES['ar-01'] as EntreeMonde;
const VERSION = 'test-cli';
const CATALOGUE = creerCatalogue(assemblerStation);
const STATION = 'm07-m03-soute-2718281828';
const ID_GRANDE = new RegExp(`^g${VERSION_GENERATEUR}-(ol-)?(m\\d\\d-){4}[a-z]+-\\d+$`);

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
    expect(idStation(choisirEntree(['nouvelle'], CATALOGUE, ctx.es))).toMatch(ID_GRANDE);
    expect(choisirEntree(['nouvelle', '--monde', 'monde-test'], CATALOGUE, ctx.es)).toBe(ENTREE);
    executer(['nouvelle'], ctx);
    expect(choisirEntree(['voir'], CATALOGUE, ctx.es)).toBe(ENTREE);
    expect(idStation(choisirEntree(['nouvelle'], CATALOGUE, ctx.es))).toMatch(ID_GRANDE);
    expect(choisirEntree(['voir', '--monde', 'ailleurs'], CATALOGUE, ctx.es)).toMatch(/^Monde inconnu : ailleurs\./);
    expect(choisirEntree(['voir', '--monde', 'constructor'], CATALOGUE, ctx.es)).toMatch(/^Monde inconnu : constructor\./);
    expect(choisirEntree(['voir', '--monde'], CATALOGUE, ctx.es)).toMatch(/--monde <id>/);
  });

  it('une option inconnue est refusée sans rien jouer ni enregistrer (#281)', () => {
    const ctx = contexte();
    executer(['nouvelle'], ctx);
    const avant = new Map(ctx.fichiers);
    expect(choisirEntree(['--partei', 'essai.json', 'jouer', '2'], CATALOGUE, ctx.es)).toMatch(/^Option inconnue : --partei\./);
    expect(executer(['--partei', 'essai.json', 'jouer', '2'], ctx)).toMatchObject({ code: 1, lignes: [expect.stringMatching(/^Option inconnue : --partei\./)] });
    expect(executer(['--partie=x.json', 'voir'], ctx)).toMatchObject({ code: 1, lignes: [expect.stringMatching(/^Option inconnue : --partie=x\.json\./)] });
    expect(ctx.fichiers).toEqual(avant);
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
  it('nouvelle sans option tire une grande station publiée (D-313), réveil dans le vestibule ; voir la reprend, même avec un autre catalogue', () => {
    const ctx = contexte();
    const debut = appeler(['nouvelle'], CATALOGUE, ctx.es);
    expect(debut.code).toBe(0);
    expect(debut.lignes).toContain('Partie enregistrée.');
    expect(debut.lignes).toContain('Vous êtes dans le vestibule.');
    const id = String(mondeEnregistre(ctx.fichiers));
    expect(CATALOGUE.publiees).toContain(id);

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

  it('--station <grande composition> : une grande station publiée de cette composition', () => {
    const ctx = contexte();
    const station = CATALOGUE.publiees[0] ?? '';
    const composition = station.slice(0, station.lastIndexOf('-'));
    const forcee = idStation(choisirEntree(['nouvelle', '--station', composition], CATALOGUE, ctx.es));
    expect(CATALOGUE.publiees).toContain(forcee);
    expect(forcee.startsWith(`${composition}-`)).toBe(true);
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
    expect(String(mondeEnregistre(ctx.fichiers))).toMatch(ID_GRANDE);
  });

  it('partie enregistrée sur une grande station d’une autre version des stations : le dit, code 1, sans y toucher (spec 2026-10-18 §4.3)', () => {
    const ancienne = JSON.stringify({ enregistrement: { monde: `g0-${(CATALOGUE.publiees[0] ?? '').slice(3)}` } });
    const ctx = contexte(new Map([[PARTIE_PAR_DEFAUT, ancienne]]));
    expect(appeler(['voir'], CATALOGUE, ctx.es)).toEqual({ lignes: ['Station d’une version précédente des stations : la partie ne peut pas être reprise. Commencez une nouvelle partie : nouvelle'], code: 1 });
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(ancienne);
  });

  it('aide : --station, et --monde sans partie donne une station tirée', () => {
    expect(AIDE.some((ligne) => ligne.startsWith('Option : --station <id>'))).toBe(true);
    expect(AIDE).toContain('Option : --monde <id>  (à la reprise, le monde de la partie enregistrée ; sinon une station tirée)');
  });
});

// Documents (#209, spec 2026-10-18 §9.2) : « regarder » dit le support, la ligne « où », puis le corps ligne à ligne et la signature.
// Un monde de test avec une note, un journal, un message et une note de rangement dans la cabine.
describe('regarder un document (#209, spec 2026-10-18 §9.2)', () => {
  const nom = (texte: string, elision = false): Nom => ({ texte, genre: 'm', nombre: 's', elision });
  const documents: Readonly<Record<string, TexteDocument>> = {
    note_malik: {
      puce: nom('mot de Malik'),
      support: 'note',
      ou: 'scotchée au montant d’une couchette',
      corps: ['Je ne dors plus.', 'Si quelqu’un lit ceci, ne comptez pas sur la lumière.'],
      signature: 'Malik',
    },
    journal_quart: {
      puce: nom('terminal de quart'),
      support: 'journal',
      ou: 'resté allumé sur un pupitre',
      corps: ['02:14  Sas arrière : pression nominale.', '03:05  Alimentation secondaire coupée.'],
    },
    message_enregistreur: {
      puce: nom('enregistreur', true),
      support: 'message',
      ou: 'posé sur une tablette',
      corps: ['Allô ? [souffle court] Vous m’entendez ?', '[long silence]'],
    },
    mot_lea: {
      puce: nom('mot de Léa'),
      support: 'note',
      ou: 'glissée sous une patte de rangement',
      corps: ['J’ai rangé la planche dans {le:piece}.', 'Rejoignez-moi {a:piece}.'],
      signature: 'Léa',
    },
  };
  const entree: EntreeMonde = {
    ...ENTREE,
    monde: {
      ...ENTREE.monde,
      objets: [
        ...ENTREE.monde.objets,
        ...Object.keys(documents).map((cle) => ({
          id: `objet-${cle}`,
          nom: cle,
          piece: 'piece-cabine',
          portable: false,
          document: true as const,
          ...(cle === 'mot_lea' ? { designe: 'piece-atelier' } : {}),
        })),
      ],
    },
    textes: {
      ...ENTREE.textes,
      noms: { ...ENTREE.textes.noms, ...Object.fromEntries(Object.entries(documents).map(([cle, { puce }]) => [cle, puce])) },
      documents,
    },
  };

  /** Ce que dit « regarder » ce document, sans la situation qui suit ; la partie enregistrée n'a pas bougé. */
  function regarder(libelle: string): readonly string[] {
    const ctx = contexte(new Map(), false, entree);
    const debut = executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const sortie = executer(['jouer', numero(debut.lignes, libelle)], ctx);
    expect(sortie.code).toBe(0);
    expect(sortie.lignes).not.toContain('Partie enregistrée.');
    expect(sortie.lignes).toContain('Actions engagées : 0');
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
    const fin = sortie.lignes.indexOf('');
    return sortie.lignes.slice(0, fin);
  }

  it('une note : le support, la ligne « où », un paragraphe par ligne, puis la signature', () => {
    expect(regarder('Regarder le mot de Malik')).toEqual([
      'Note manuscrite',
      'scotchée au montant d’une couchette',
      'Je ne dors plus.',
      'Si quelqu’un lit ceci, ne comptez pas sur la lumière.',
      'Malik',
    ]);
  });

  it('un journal : « hh:mm  texte », une entrée par ligne', () => {
    expect(regarder('Regarder le terminal de quart')).toEqual([
      'Journal de terminal',
      'resté allumé sur un pupitre',
      '02:14  Sas arrière : pression nominale.',
      '03:05  Alimentation secondaire coupée.',
    ]);
  });

  it('un message : les didascalies, crochets compris, sont des lignes à part', () => {
    expect(regarder('Regarder l’enregistreur')).toEqual([
      'Message enregistré',
      'posé sur une tablette',
      'Allô ?',
      '[souffle court]',
      'Vous m’entendez ?',
      '[long silence]',
    ]);
  });

  it('une note de rangement : la pièce désignée est dite en clair, sans aucune marque', () => {
    expect(regarder('Regarder le mot de Léa')).toEqual([
      'Note manuscrite',
      'glissée sous une patte de rangement',
      'J’ai rangé la planche dans l’atelier.',
      'Rejoignez-moi à l’atelier.',
      'Léa',
    ]);
  });

  it('« commande regarder » dit la même chose, et ne coûte rien non plus', () => {
    const ctx = contexte(new Map(), false, entree);
    executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    const sortie = executer(['commande', 'regarder', idPublic(entree.monde.id, 'objet-journal_quart')], ctx);
    expect(sortie.lignes.slice(0, 4)).toEqual(['Journal de terminal', 'resté allumé sur un pupitre', '02:14  Sas arrière : pression nominale.', '03:05  Alimentation secondaire coupée.']);
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
  });

  it('regarder un objet ordinaire reste une phrase', () => {
    const ctx = contexte(new Map(), false, entree);
    const debut = executer(['nouvelle'], ctx);
    const sortie = executer(['jouer', numero(debut.lignes, 'Regarder le carnet')], ctx);
    expect(sortie.lignes[0]).toMatch(/carnet/);
    expect(sortie.lignes[1]).toBe('');
  });
});

describe('CLI : poser un appui porté à une position (demande du porteur, grandes stations)', () => {
  // La caisse se porte en grande station (spec 2026-10-18 §6.5) : AR-01, dont l'atelier a déjà ses positions, la rend portable.
  const PORTABLE: EntreeMonde = {
    ...AR01,
    monde: { ...AR01.monde, objets: AR01.monde.objets.map((objet) => (objet.id === 'o-caisse' ? { ...objet, portable: true, encombrant: true } : objet)) },
  };

  /** Caisse en main dans l'atelier ; renvoie le contexte et les commandes brutes des lignes « Poser la caisse », sous la grille d'abord. */
  function caisseEnMain() {
    const ctx = contexte(new Map(), false, PORTABLE);
    let sortie = executer(['nouvelle', '--graine', '5'], ctx);
    for (const libelle of ['Aller dans l’atelier maintenance', 'Prendre la caisse']) sortie = executer(['jouer', numero(sortie.lignes, libelle)], ctx);
    const brutes = executer(['voir', '--ids'], ctx).lignes.filter((ligne) => ligne.includes('Poser la caisse'));
    const [sous, centre] = brutes.map((ligne) => ligne.match(/\[poser (e[0-9a-f]{8}) (e[0-9a-f]{8})\]/)?.slice(1) ?? []);
    return { ctx, lignes: sortie.lignes, brutes, sous: sous ?? [], centre: centre ?? [] };
  }

  it('une ligne « Poser » par position, chacune nommant la sienne ; l’aperçu et « jouer » suivent la ligne choisie', () => {
    const { ctx, lignes, brutes } = caisseEnMain();
    expect(brutes).toHaveLength(2);
    const poses = lignes.filter((ligne) => ligne.includes('Poser la caisse')).map((ligne) => ligne.trim().replace(/^\d+\. /, ''));
    expect(poses).toEqual(['Poser la caisse sous la grille', 'Poser la caisse au centre de l’atelier']);
    const sous = numero(lignes, 'Poser la caisse sous la grille');
    const centre = numero(lignes, 'Poser la caisse au centre de l’atelier');
    expect(sous).not.toBe(centre);
    expect(executer(['apercu', sous], ctx).lignes).toContain('Aperçu : Poser la caisse sous la grille');
    expect(executer(['apercu', sous], ctx).lignes).toContain('  La caisse sera sous la grille.');
    expect(executer(['apercu', centre], ctx).lignes).toContain('Aperçu : Poser la caisse au centre de l’atelier');
    expect(executer(['apercu', centre], ctx).lignes).toContain('  La caisse sera au centre de l’atelier.');
    const sortie = executer(['jouer', sous], ctx);
    expect(sortie.code).toBe(0);
    expect(sortie.lignes[0]).toMatch(/^Vous (posez|déposez) la caisse sous la grille/);
    expect(sortie.lignes).toContain('Actions engagées : 3');
    expect(sortie.lignes.some((ligne) => ligne.includes('Ouvrir la grille') && !ligne.includes('indisponible'))).toBe(true);
  });

  it('« commande poser » accepte la position ; sans elle, ou d’ailleurs, rien n’est joué', () => {
    const { ctx, sous, centre } = caisseEnMain();
    const [caisse = '', position = ''] = sous;
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    expect(executer(['commande', 'poser', caisse], ctx).lignes[0]).toBe('Ce n’est pas possible ici : rien n’a été joué.');
    expect(executer(['commande', 'poser', caisse, caisse], ctx).lignes[0]).toBe('Ce n’est pas possible ici : rien n’a été joué.');
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
    expect(centre[0]).toBe(caisse);
    const sortie = executer(['commande', 'poser', caisse, position], ctx);
    expect(sortie.lignes[0]).toMatch(/^Vous (posez|déposez) la caisse sous la grille/);
    expect(sortie.lignes).toContain('Actions engagées : 3');
  });
});

describe('CLI : poste de surveillance (lot 4)', () => {
  // Le monde de test, avec un terminal et son post-it dans la cabine, des caméras dans l'atelier et la soute.
  const catalogue = (cle: string) => ({ nom: TEXTES_CATALOGUE.noms[cle]!, descriptions: TEXTES_CATALOGUE.descriptions[cle]! });
  const POSTE: EntreeMonde = {
    ...ENTREE,
    monde: {
      ...ENTREE.monde,
      id: 'monde-poste',
      objets: [
        ...ENTREE.monde.objets,
        { id: 'objet-terminal', nom: 'cat_terminal', piece: 'piece-cabine', portable: false, terminal: true, exige: 'objet-post-it' },
        { id: 'objet-post-it', nom: 'cat_post_it', piece: 'piece-cabine' },
      ],
      cameras: [{ piece: 'piece-atelier' }, { piece: 'piece-soute' }],
    },
    textes: {
      ...ENTREE.textes,
      noms: { ...ENTREE.textes.noms, cat_terminal: catalogue('cat_terminal').nom, cat_post_it: catalogue('cat_post_it').nom },
      descriptions: { ...ENTREE.textes.descriptions, cat_terminal: catalogue('cat_terminal').descriptions, cat_post_it: catalogue('cat_post_it').descriptions },
    },
  };

  it('« surveiller terminal » : refusé tant que le post-it n’a pas servi, puis connecte et liste les caméras en mots', () => {
    const ctx = contexte(new Map(), false, POSTE);
    executer(['nouvelle', '--graine', '5'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    let sortie = executer(['surveiller', 'terminal'], ctx);
    expect(sortie.lignes).toContain('Le terminal demande un mot de passe : rien n’a été joué.');
    expect(sortie.lignes).not.toContain('Caméras en direct :');
    expect(ctx.fichiers.get(PARTIE_PAR_DEFAUT)).toBe(avant);
    expect(executer(['deverrouiller', 'terminal'], ctx)).toEqual({ lignes: ['Aucun terminal à déverrouiller ici.'], code: 1 });
    executer(['jouer', numero(sortie.lignes, 'Prendre le post-it')], ctx);
    // Le post-it en main ne suffit pas : il faut l'utiliser sur le terminal.
    expect(executer(['surveiller', 'terminal'], ctx).lignes).toContain('Le terminal demande un mot de passe : rien n’a été joué.');
    expect(executer(['deverrouiller', 'terminal'], ctx).code).toBe(0);
    expect(executer(['deverrouiller'], ctx)).toEqual({ lignes: ['Aucun terminal à déverrouiller ici.'], code: 1 });
    sortie = executer(['surveiller', 'terminal'], ctx);
    expect(sortie.code).toBe(0);
    expect(sortie.lignes).toContain('Partie enregistrée.');
    expect(sortie.lignes).toEqual(expect.arrayContaining(['Caméras en direct :', '  Caméra de l’atelier : calme', '  Caméra de la soute : mouvement']));
    expect(executer(['voir'], ctx).lignes).toContain('  Caméra de la soute : mouvement');
    expect(executer(['aide'], ctx).lignes.some((ligne) => ligne.startsWith('  surveiller [terminal]'))).toBe(true);
    expect(executer(['aide'], ctx).lignes.some((ligne) => ligne.startsWith('  deverrouiller [terminal]'))).toBe(true);
  });

  it('« surveiller » sans terminal dans la pièce : le dit, code 1', () => {
    const ctx = contexte();
    executer(['nouvelle', '--graine', '5'], ctx);
    expect(executer(['surveiller'], ctx)).toEqual({ lignes: ['Aucun terminal ici.'], code: 1 });
  });
});
