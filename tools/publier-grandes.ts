import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION_GENERATEUR } from '../content';
import { CATALOGUE } from './catalogue';
import { empreinteCode } from './empreinte-code';
import { dansLeLot, lancerSousLots, lireOptionsLots } from './lots';
import { isMainModule, REPO_ROOT } from './repo-files';
import { empreinteComposition, FICHIER_SANS_STATION, FICHIER_TEMOINS, lireSansStation, lireTemoins, publierGrandes, type PasTemoin, type SansStation } from './verifier-grandes';
import { actualiserVersionGrande } from './temoins-portables';

// Publication (D-326) : certificats rejoués ou parcours construits puis vérifiés, sans exploration globale du jeu.
// `--par=<n>` stations par composition (2), `--essais=<n>` graines assemblables (8), `--tout` sans certificats ni refus gardés.
// Un processus par défaut ; `--processus=<n>` pour partager le travail explicitement.

export const FICHIER_LISTE = 'content/stations/grandes-publiees.ts';

export function ecrireListe(publiees: readonly string[]): string {
  return `// Grandes stations publiées (spec 2026-10-18 §7.2, D-326) : chacune assemblée, contrôlée et prouvée sans dé ni blessure par
// \`npm run publier:grandes\`, qui écrit ce fichier. Le jeu ne tire que dans cette liste.

export const GRANDES_PUBLIEES: readonly string[] = [
${publiees.map((id) => `  '${id}',`).join('\n')}
];
`;
}

/** Une nouvelle méthode de preuve ne doit pas réduire silencieusement les variantes déjà proposées au joueur. */
export function verifierDiversite(avant: readonly string[], apres: readonly string[], par: number): void {
  const variantes = (stations: readonly string[]): Map<string, number> => {
    const comptes = new Map<string, number>();
    for (const station of new Set(stations)) {
      const composition = actualiserVersionGrande(station.slice(0, station.lastIndexOf('-')));
      comptes.set(composition, (comptes.get(composition) ?? 0) + 1);
    }
    return comptes;
  };
  const obtenues = variantes(apres);
  const pertes = [...variantes(avant)].filter(([composition, nombre]) => (obtenues.get(composition) ?? 0) < Math.min(par, nombre));
  if (pertes.length > 0) throw new Error(`Republication interrompue : moins de variantes pour ${pertes.map(([composition]) => composition).join(', ')}. Fichiers publiés inchangés ; examiner les parcours non construits.`);
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
  const tout = argumentsCli.includes('--tout');
  const { lot, parts } = lireOptionsLots(argumentsCli.some((argument) => argument.startsWith('--processus=') || argument.startsWith('--lot=')) ? argumentsCli : [...argumentsCli, '--processus=1']);
  const debut = performance.now();
  const compositions = CATALOGUE.grandes.filter((composition) => composition.refus === null).map((composition) => composition.id);

  let temoins: Record<string, readonly (readonly PasTemoin[])[]>;
  let sansStation: Record<string, SansStation[string]>;
  if (parts > 1) {
    const sorties = await lancerSousLots(fileURLToPath(import.meta.url), lot, parts, [`--par=${par}`, `--essais=${essais}`, ...(tout ? ['--tout'] : [])]);
    temoins = {};
    sansStation = {};
    for (const { sortie, erreurs, code } of sorties) {
      process.stderr.write(erreurs);
      if (code !== 0) throw new Error('Un processus de publication a échoué.');
      for (const ligne of sortie.split('\n').filter((texte) => texte.startsWith('{'))) {
        const lue = JSON.parse(ligne) as { station: string; preuve: readonly (readonly PasTemoin[])[] } | { composition: string; marque: SansStation[string] };
        if ('station' in lue) temoins[lue.station] = lue.preuve;
        else sansStation[lue.composition] = lue.marque;
      }
    }
  } else {
    ({ temoins, sansStation } = publierGrandes(CATALOGUE, par, essais, (ligne) => {
      console.error(`${ligne.station} ${ligne.verdict} ${ligne.methode ?? ''} ${ligne.etats} états ${ligne.secondes.toFixed(1)} s${ligne.ecarts.length === 0 ? '' : ` : ${ligne.ecarts.join(' ')}`}`);
    }, dansLeLot(compositions, lot), tout ? {} : lireTemoins(), tout ? {} : lireSansStation(), empreinteCode(['engine/index.ts', 'tools/construire-temoin.ts', 'tools/verifier-grandes.ts'])));
  }
  if (argumentsCli.some((argument) => argument.startsWith('--lot='))) {
    for (const [station, preuve] of Object.entries(temoins)) console.log(JSON.stringify({ station, preuve }));
    for (const [composition, marque] of Object.entries(sansStation)) console.log(JSON.stringify({ composition, marque }));
    return;
  }
  const publiees = Object.keys(temoins).sort();
  verifierDiversite(CATALOGUE.publiees, publiees, par);
  writeFileSync(join(REPO_ROOT, FICHIER_LISTE), ecrireListe(publiees));
  // La fermeture des imports contient la liste publiée : marquer les refus avec l'empreinte après son écriture.
  const moteur = empreinteCode(['engine/index.ts', 'tools/construire-temoin.ts', 'tools/verifier-grandes.ts']);
  for (const [composition, marque] of Object.entries(sansStation)) sansStation[composition] = { ...marque, empreinte: empreinteComposition(CATALOGUE, composition, moteur) };
  writeFileSync(join(REPO_ROOT, FICHIER_TEMOINS), `${JSON.stringify(Object.fromEntries(publiees.map((id) => [id, temoins[id]])))}\n`);
  writeFileSync(join(REPO_ROOT, FICHIER_SANS_STATION), `${JSON.stringify(Object.fromEntries(Object.keys(sansStation).sort().map((id) => [id, sansStation[id]])), null, 1)}\n`);
  const libres = publiees.filter((id) => id.startsWith(`g${VERSION_GENERATEUR}-ol-`)).length;
  console.error(`publier:grandes : ${publiees.length} stations publiées (${libres} en ordre libre) sur ${compositions.length} compositions (${Object.keys(sansStation).length} sans station), en ${((performance.now() - debut) / 1000).toFixed(0)} s.`);
}

if (isMainModule(import.meta.url)) {
  principal().catch((erreur: unknown) => {
    console.error(erreur instanceof Error ? (erreur.stack ?? erreur.message) : String(erreur));
    process.exitCode = 1;
  });
}
