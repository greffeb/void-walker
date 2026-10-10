import { empreinteEtat, lireExport, rejouer } from '../engine';
import { MONDE_PAR_DEFAUT, MONDES, type EntreeMonde } from '../content';
import { executer, PARTIE_PAR_DEFAUT, type Contexte } from './partie-cli';

const ENTREE = MONDES[MONDE_PAR_DEFAUT] as EntreeMonde;
const VERSION = 'test-cli';

function contexte(fichiers = new Map<string, string>(), ecritureEnPanne = false): Contexte & { fichiers: Map<string, string> } {
  return {
    monde: ENTREE.monde,
    textes: ENTREE.textes,
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
    expect(sortie.lignes).toContain('Vous voyez ici un carnet.');
    expect(sortie.lignes).toContain('Actions engagées : 4');

    expect(executer(['exporter', 'export.json', '--commentaire', 'essai'], ctx).code).toBe(0);
    const fichier = lireExport(JSON.parse(ctx.fichiers.get('export.json') ?? 'null'));
    expect(fichier.commentaire).toBe('essai');
    expect(empreinteEtat(rejouer(ENTREE.monde, fichier, VERSION).partie.etat)).toBe(fichier.empreinte);
    expect(executer(['voir'], ctx).lignes).toContain('Actions engagées : 4');
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

  it('commande brute invalide : refus explicite sans effet', () => {
    const ctx = contexte();
    executer(['nouvelle'], ctx);
    const avant = ctx.fichiers.get(PARTIE_PAR_DEFAUT);
    expect(executer(['commande', 'voler', 'e12345678'], ctx).lignes[0]).toBe('Cette action n’existe pas : rien n’a été joué.');
    expect(executer(['commande', 'prendre', 'objet-carnet'], ctx).lignes[0]).toBe('Cette action ne peut pas viser cela ici.');
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
});
