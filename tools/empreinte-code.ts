import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { collectImports } from './check-imports';
import { REPO_ROOT, displayPath } from './repo-files';

// Verdicts gardés d'une vérification à l'autre (#180) : un verdict n'est repris que si l'empreinte du code qui l'a rendu est la
// même. L'empreinte couvre chaque fichier du dépôt importé, de proche en proche, par le script de vérification (moteur,
// contenu, assemblage, vérifieur), les dépendances npm (package-lock.json) et la version de Node. Changer une ligne de l'un
// d'eux, c'est tout revérifier.

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.json'];

function resoudre(depuis: string, specifieur: string): string | null {
  const base = resolve(dirname(depuis), specifieur);
  const candidats = [base, ...EXTENSIONS.map((extension) => `${base}${extension}`), ...EXTENSIONS.map((extension) => join(base, `index${extension}`))];
  return candidats.find((candidat) => existsSync(candidat) && statSync(candidat).isFile()) ?? null;
}

/** Fichiers du dépôt importés par `entrees`, elles comprises, de proche en proche ; triés, relatifs à la racine. */
export function fermetureDesImports(entrees: readonly string[], racine = REPO_ROOT): string[] {
  const vus = new Set<string>();
  const pile = entrees.map((entree) => resolve(racine, entree));
  for (let fichier = pile.pop(); fichier !== undefined; fichier = pile.pop()) {
    if (vus.has(fichier)) continue;
    vus.add(fichier);
    if (fichier.endsWith('.json')) continue;
    for (const { specifier } of collectImports(fichier, readFileSync(fichier, 'utf8'))) {
      if (specifier === null) throw new Error(`${displayPath(racine, fichier)} : import non littéral, empreinte impossible.`);
      if (!specifier.startsWith('.')) continue;
      const cible = resoudre(fichier, specifier);
      if (cible === null) throw new Error(`${displayPath(racine, fichier)} : import introuvable « ${specifier} ».`);
      pile.push(cible);
    }
  }
  return [...vus].map((fichier) => displayPath(racine, fichier)).sort();
}

/** Empreinte du code de `entrees` : chemins et contenus de leur fermeture, package-lock.json, version de Node. */
export function empreinteCode(entrees: readonly string[], racine = REPO_ROOT): string {
  const hachage = createHash('sha256');
  hachage.update(`node ${process.versions.node}\n`);
  for (const fichier of [...fermetureDesImports(entrees, racine), 'package-lock.json']) {
    const chemin = join(racine, fichier);
    hachage.update(`${fichier}\n`);
    // Fins de ligne normalisées : la même empreinte sous Windows et Linux.
    hachage.update(existsSync(chemin) ? readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n') : '(absent)');
    hachage.update('\n\0\n');
  }
  return hachage.digest('hex').slice(0, 32);
}

/**
 * Dossier de verdicts d'un outil, pour une empreinte : `<racine>/<outil>/<empreinte>/`. La racine est `VERIFS_CACHE` si
 * elle est donnée (la CI la met hors du dépôt : un fichier ajouté à une PR ne peut pas passer pour un verdict), sinon
 * `.cache/verifs` à la racine du dépôt.
 */
export interface Cache {
  readonly dossier: string;
  lire<T>(cle: string): T | undefined;
  ecrire(cle: string, valeur: unknown): void;
}

export function racineDuCache(): string {
  return process.env.VERIFS_CACHE ?? join(REPO_ROOT, '.cache', 'verifs');
}

function nomDeFichier(cle: string): string {
  return `${createHash('sha256').update(cle).digest('hex').slice(0, 40)}.json`;
}

export function ouvrirCache(outil: string, empreinte: string, racine = racineDuCache()): Cache {
  const dossier = join(racine, outil, empreinte);
  return {
    dossier,
    lire<T>(cle: string): T | undefined {
      const chemin = join(dossier, nomDeFichier(cle));
      if (!existsSync(chemin)) return undefined;
      try {
        const lu = JSON.parse(readFileSync(chemin, 'utf8')) as { cle?: unknown; valeur?: T };
        return lu.cle === cle ? lu.valeur : undefined;
      } catch {
        return undefined;
      }
    },
    ecrire(cle: string, valeur: unknown): void {
      mkdirSync(dossier, { recursive: true });
      const chemin = join(dossier, nomDeFichier(cle));
      // Écrit à côté puis renommé : un processus voisin ne lit jamais un fichier à moitié écrit.
      const provisoire = `${chemin}.${process.pid}.tmp`;
      writeFileSync(provisoire, JSON.stringify({ cle, valeur }));
      renameSync(provisoire, chemin);
    },
  };
}

/** Retire les dossiers d'empreintes périmées d'un outil ; garde celle donnée. */
export function purgerCache(outil: string, garder: string, racine = racineDuCache()): void {
  const dossier = join(racine, outil);
  if (!existsSync(dossier)) return;
  for (const entree of readdirSync(dossier)) if (entree !== garder) rmSync(join(dossier, entree), { recursive: true, force: true });
}
