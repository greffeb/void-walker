import { empreinteEtat, idPublic, lireExport, rejouer } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { choisirMonde, executer, PARTIE_PAR_DEFAUT, type Contexte } from './partie-cli';

const ENTREE = MONDES['monde-test'] as EntreeMonde;
const AR01 = MONDES['ar-01'] as EntreeMonde;
const VERSION = 'test-cli';

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
    expect(executer(['jouer', '1'], ctx)).toEqual({ lignes: ['Cette partie est terminée : rien n’a été joué.'], code: 1 });
    expect(executer(['voir'], ctx).lignes).toContain('[ IA STATION ] « Alimentation confirmée. Écoutille fermée. Départ engagé. »');
    expect(executer(['exporter', 'fin.json'], ctx)).toEqual({
      lignes: ['Partie exportée dans fin.json (14 actions engagées). La partie est terminée.'],
      code: 0,
    });
  });

  it('choix du monde : --monde, sinon celui de la partie enregistrée, sinon AR-01', () => {
    const ctx = contexte();
    expect(choisirMonde(['nouvelle'], MONDES, MONDE_PAR_DEFAUT, ctx.es)).toBe(AR01);
    expect(choisirMonde(['nouvelle', '--monde', 'monde-test'], MONDES, MONDE_PAR_DEFAUT, ctx.es)).toBe(ENTREE);
    executer(['nouvelle'], ctx);
    expect(choisirMonde(['voir'], MONDES, MONDE_PAR_DEFAUT, ctx.es)).toBe(ENTREE);
    expect(choisirMonde(['nouvelle'], MONDES, MONDE_PAR_DEFAUT, ctx.es)).toBe(AR01);
    expect(choisirMonde(['voir', '--monde', 'ailleurs'], MONDES, MONDE_PAR_DEFAUT, ctx.es)).toMatch(/^Monde inconnu : ailleurs\./);
    expect(choisirMonde(['voir', '--monde'], MONDES, MONDE_PAR_DEFAUT, ctx.es)).toMatch(/--monde <id>/);
  });
});
