import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOGUE } from './catalogue';
import { dansLeLot, lancerSousLots, lireOptionsLots } from './lots';
import { isMainModule, REPO_ROOT } from './repo-files';
import { FICHIER_TEMOINS, publierGrandes, type PasTemoin } from './verifier-grandes';

// Publication des grandes stations (spec 2026-10-18 §7.2, D-303) : `npm run publier:grandes` prouve, pour chaque grande
// composition, ses premières graines, puis écrit la liste publiée (contenu) et les témoins (outils), que `check:stations`
// rejoue. Long : à lancer une fois, quand le générateur ou les règles changent. `--par=<n>` graines par composition (2),
// `--essais=<n>` graines prouvées au plus (8), sans compter celles qui n’ont pas de plan, `--processus=<n>` en parallèle.

export const FICHIER_LISTE = 'content/stations/grandes-publiees.ts';

export function ecrireListe(publiees: readonly string[]): string {
  return `// Grandes stations publiées (spec 2026-10-18 §7.2, D-303) : chacune assemblée, contrôlée et prouvée sans dé ni blessure par
// \`npm run publier:grandes\`, qui écrit ce fichier. Le jeu ne tire que dans cette liste.

export const GRANDES_PUBLIEES: readonly string[] = [
${publiees.map((id) => `  '${id}',`).join('\n')}
];
`;
}

async function principal(): Promise<void> {
  const argumentsCli = process.argv.slice(2);
  const valeur = (prefixe: string, defaut: number): number => {
    const texte = argumentsCli.find((argument) => argument.startsWith(prefixe))?.slice(prefixe.length);
    const nombre = texte === undefined ? defaut : Number(texte);
    if (!Number.isSafeInteger(nombre) || nombre < 1) throw new RangeError(`Option ${prefixe} invalide : ${texte}.`);
    return nombre;
  };
  const par = valeur('--par=', 2);
  const essais = valeur('--essais=', 8);
  const { lot, parts } = lireOptionsLots(argumentsCli);
  const debut = performance.now();
  const compositions = CATALOGUE.grandes.filter((composition) => composition.refus === null).map((composition) => composition.id);

  if (parts > 1) {
    const sorties = await lancerSousLots(fileURLToPath(import.meta.url), lot, parts, [`--par=${par}`, `--essais=${essais}`]);
    const temoins: Record<string, readonly (readonly PasTemoin[])[]> = {};
    for (const { sortie, erreurs, code } of sorties) {
      process.stderr.write(erreurs);
      if (code !== 0) throw new Error('Un processus de publication a échoué.');
      for (const ligne of sortie.split('\n').filter((texte) => texte.startsWith('{'))) {
        const { station, preuve } = JSON.parse(ligne) as { station: string; preuve: readonly (readonly PasTemoin[])[] };
        temoins[station] = preuve;
      }
    }
    const publiees = Object.keys(temoins).sort();
    writeFileSync(join(REPO_ROOT, FICHIER_LISTE), ecrireListe(publiees));
    writeFileSync(join(REPO_ROOT, FICHIER_TEMOINS), `${JSON.stringify(Object.fromEntries(publiees.map((id) => [id, temoins[id]])))}\n`);
    const libres = publiees.filter((id) => id.startsWith('g1-ol-')).length;
    console.error(`publier:grandes : ${publiees.length} stations publiées (${libres} en ordre libre) sur ${compositions.length} compositions, en ${((performance.now() - debut) / 1000).toFixed(0)} s.`);
    return;
  }

  const { temoins } = publierGrandes(CATALOGUE, par, essais, {}, (ligne) => {
    console.error(`${ligne.station} ${ligne.verdict} ${ligne.methode ?? ''} ${ligne.secondes.toFixed(1)} s`);
  }, dansLeLot(compositions, lot));
  for (const [station, preuve] of Object.entries(temoins)) console.log(JSON.stringify({ station, preuve }));
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? (erreur.stack ?? erreur.message) : String(erreur));
    process.exitCode = 1;
  });
}
