import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';

// Lots des vérifications longues (#180) : `check:stations` et `check:texts` se partagent en lots, un par job de CI, et chaque
// lot en sous-processus, un par cœur. Les lots d'un même total couvrent toute la liste, sans doublon ni reste.

/** Lot `numero` sur `total` : les rangs `numero - 1`, `numero - 1 + total`, … d'une liste. */
export interface Lot {
  readonly numero: number;
  readonly total: number;
}

export const LOT_UNIQUE: Lot = { numero: 1, total: 1 };

export function lireLot(texte: string): Lot {
  const trouve = /^(\d+)\/(\d+)$/.exec(texte);
  const numero = Number(trouve?.[1]);
  const total = Number(trouve?.[2]);
  if (trouve === null || numero < 1 || numero > total) throw new RangeError(`Lot invalide : ${texte} (attendu : k/n, 1 ≤ k ≤ n).`);
  return { numero, total };
}

export function dansLeLot<T>(liste: readonly T[], { numero, total }: Lot): T[] {
  return liste.filter((_, rang) => rang % total === numero - 1);
}

/**
 * Le `numero`-ième des `parts` sous-lots d'un lot : un sous-lot est un lot d'un total plus grand. Le lot k sur n prend les
 * rangs r ≡ k - 1 (mod n) ; son sous-lot j sur p, les rangs r ≡ k - 1 + n (j - 1) (mod n p).
 */
export function sousLot(lot: Lot, parts: number, numero: number): Lot {
  return { numero: lot.numero + lot.total * (numero - 1), total: lot.total * parts };
}

export interface OptionsLots {
  readonly lot: Lot;
  /** Sous-processus à lancer ; 1 : le lot est vérifié dans ce processus. */
  readonly parts: number;
  /** Arguments sans `--lot=` ni `--processus=`. */
  readonly reste: readonly string[];
}

/**
 * `--lot=k/n` et `--processus=p` (`auto` : un par cœur). Sans `--processus`, un processus par cœur pour le lot entier ; avec
 * `--lot` seul (un sous-processus, lancé avec son `--lot`), le lot est vérifié dans ce processus.
 */
export function lireOptionsLots(argumentsCli: readonly string[]): OptionsLots {
  const valeur = (prefixe: string): string | undefined => argumentsCli.find((argument) => argument.startsWith(prefixe))?.slice(prefixe.length);
  const texteLot = valeur('--lot=');
  const texteProcessus = valeur('--processus=');
  const parts = texteProcessus === 'auto' || (texteProcessus === undefined && texteLot === undefined) ? availableParallelism() : texteProcessus === undefined ? 1 : Number(texteProcessus);
  if (!Number.isSafeInteger(parts) || parts < 1) throw new RangeError(`Nombre de processus invalide : ${texteProcessus}.`);
  return {
    lot: texteLot === undefined ? LOT_UNIQUE : lireLot(texteLot),
    parts,
    reste: argumentsCli.filter((argument) => !argument.startsWith('--lot=') && !argument.startsWith('--processus=')),
  };
}

export interface SortieProcessus {
  readonly lot: Lot;
  readonly sortie: string;
  readonly erreurs: string;
  readonly code: number;
}

/** Lance `script` en `parts` sous-processus, un sous-lot chacun, avec le même Node et les mêmes options de chargement (tsx). */
export function lancerSousLots(script: string, lot: Lot, parts: number, passer: readonly string[]): Promise<SortieProcessus[]> {
  return Promise.all(
    Array.from({ length: parts }, (_, rang) => {
      const sous = sousLot(lot, parts, rang + 1);
      return new Promise<SortieProcessus>((resoudre) => {
        const enfant = spawn(process.execPath, [...process.execArgv, script, ...passer, `--lot=${sous.numero}/${sous.total}`], { stdio: ['ignore', 'pipe', 'pipe'] });
        let sortie = '';
        let erreurs = '';
        enfant.stdout.setEncoding('utf8');
        enfant.stderr.setEncoding('utf8');
        enfant.stdout.on('data', (morceau: string) => { sortie += morceau; });
        enfant.stderr.on('data', (morceau: string) => { erreurs += morceau; });
        enfant.on('error', (erreur) => resoudre({ lot: sous, sortie, erreurs: `${erreurs}${erreur.message}\n`, code: 1 }));
        enfant.on('close', (code) => resoudre({ lot: sous, sortie, erreurs, code: code ?? 1 }));
      });
    }),
  );
}
